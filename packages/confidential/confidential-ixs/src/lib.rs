use arcis_imports::*;

#[derive(ArcisType, Copy, Clone, ArcisEncryptable)]
pub struct EncryptedBid {
    /// Bid amount (encrypted)
    pub amount: mu64,
    /// Bidder identifier (encrypted for privacy)
    pub bidder_id: mu128,
    /// Bid timestamp
    pub timestamp: mu64,
    /// Nonce for bid uniqueness
    pub nonce: mu128,
}

#[derive(ArcisType, Copy, Clone, ArcisEncryptable)]
pub struct AuctionParams {
    /// Auction ID
    pub auction_id: mu64,
    /// Minimum bid amount
    pub minimum_bid: mu64,
    /// Reserve price (encrypted)
    pub reserve_price: mu64,
    /// Auction type (0 = sealed-bid, 1 = dutch)
    pub auction_type: mu8,
}

#[derive(ArcisType, Copy, Clone, ArcisEncryptable)]
pub struct SettlementResult {
    /// Winner's bidder ID (0 if no winner)
    pub winner_id: mu128,
    /// Winning bid amount
    pub winning_amount: mu64,
    /// Second highest bid (for Vickrey auctions)
    pub second_highest: mu64,
    /// Whether reserve was met
    pub reserve_met: mbool,
    /// Settlement timestamp
    pub timestamp: mu64,
}

/// Supports both first-price and second-price (Vickrey) auctions
#[confidential]
fn sealed_bid_auction(
    bids: [Ciphertext; 64],        // Up to 64 encrypted bids
    bid_count: u64,                // Actual number of bids
    auction_params: [Ciphertext; 4], // Encrypted auction parameters
    auction_nonce: u128,           // Auction params nonce
    settlement_type: u8,           // 0 = first-price, 1 = second-price
) -> [Ciphertext; 5] {             // Settlement result
    
    // Decrypt auction parameters
    let auction_cipher = RescueCipher::new_for_mxe();
    let params = auction_cipher.decrypt::<4, AuctionParams>(auction_params, auction_nonce);
    
    // Decrypt and process bids
    let mut valid_bids: [EncryptedBid; 64] = [EncryptedBid {
        amount: 0.into(),
        bidder_id: 0.into(),
        timestamp: 0.into(),
        nonce: 0.into(),
    }; 64];
    
    let mut actual_bid_count: mu64 = 0.into();
    
    // Decrypt each bid
    for i in 0..64 {
        if i < bid_count as usize {
            let bid_nonce = (auction_nonce + (i as u128)) as u128;
            let bid_cipher = RescueCipher::new_for_mxe();
            valid_bids[i] = bid_cipher.decrypt::<4, EncryptedBid>(
                [bids[i * 4], bids[i * 4 + 1], bids[i * 4 + 2], bids[i * 4 + 3]], 
                bid_nonce
            );
            actual_bid_count = actual_bid_count + 1.into();
        }
    }
    
    // Find highest and second-highest bids
    let mut highest_bid = params.minimum_bid;
    let mut second_highest = params.minimum_bid;
    let mut winner_id: mu128 = 0.into();
    let mut found_valid_bid: mbool = false.into();
    
    for i in 0..64 {
        let is_valid_index = (i as u64) < bid_count;
        if is_valid_index {
            let bid = valid_bids[i];
            let bid_meets_minimum = bid.amount >= params.minimum_bid;
            let bid_meets_reserve = bid.amount >= params.reserve_price;
            let is_valid_bid = bid_meets_minimum & bid_meets_reserve;
            
            let is_new_highest = bid.amount > highest_bid;
            let is_new_second = bid.amount > second_highest & bid.amount <= highest_bid;
            
            // Update highest bid
            let should_update_highest = is_valid_bid & is_new_highest;
            second_highest = should_update_highest.select(highest_bid, second_highest);
            highest_bid = should_update_highest.select(bid.amount, highest_bid);
            winner_id = should_update_highest.select(bid.bidder_id, winner_id);
            found_valid_bid = should_update_highest | found_valid_bid;
            
            // Update second highest
            let should_update_second = is_valid_bid & is_new_second;
            second_highest = should_update_second.select(bid.amount, second_highest);
        }
    }
    
    // Determine final winning amount based on auction type
    let winning_amount = if settlement_type == 0 {
        // First-price auction: winner pays their bid
        highest_bid
    } else {
        // Second-price (Vickrey) auction: winner pays second-highest bid
        second_highest
    };
    
    // Create settlement result
    let result = SettlementResult {
        winner_id: found_valid_bid.select(winner_id, 0.into()),
        winning_amount: found_valid_bid.select(winning_amount, 0.into()),
        second_highest,
        reserve_met: highest_bid >= params.reserve_price,
        timestamp: 0.into(),
    };
    
    // Encrypt and return result
    let result_cipher = RescueCipher::new_for_mxe();
    result_cipher.encrypt::<5, SettlementResult>(result, auction_nonce)
}

/// Process a Dutch auction bid against hidden reserve price
#[confidential]
fn dutch_auction(
    current_price: u64,              // Current Dutch auction price
    bid_amount: u64,                 // Bidder's offered amount
    reserve_price: [Ciphertext; 1],  // Hidden reserve price
    reserve_nonce: u128,             // Reserve price nonce
    bidder_id: u128,                 // Bidder identifier
) -> [Ciphertext; 3] {               // Result: [accepted, final_price, winner_id]
    
    // Decrypt reserve price
    let reserve_cipher = RescueCipher::new_for_mxe();
    let reserve: mu64 = reserve_cipher.decrypt::<1, mu64>(reserve_price, reserve_nonce)[0];
    
    // Check if bid meets current price and reserve
    let meets_current_price = bid_amount >= current_price;
    let meets_reserve: mbool = bid_amount.into() >= reserve;
    let bid_accepted = meets_current_price && meets_reserve;
    
    // Determine final price (current Dutch price if accepted)
    let final_price: mu64 = bid_accepted.select(current_price.into(), 0.into());
    let winner: mu128 = bid_accepted.select(bidder_id.into(), 0.into());
    
    // Return encrypted result
    let result_cipher = RescueCipher::new_for_mxe();
    let result = [
        bid_accepted.into(),  // Whether bid was accepted
        final_price,          // Final price
        winner,               // Winner ID
    ];
    
    result_cipher.encrypt::<3, [mu64; 3]>(result, reserve_nonce)
}

/// Process multiple auction settlements atomically
#[confidential]
fn batch_settlement(
    auction_results: [Ciphertext; 32], // Up to 32 auction results
    batch_size: u8,                    // Actual number of auctions
    batch_nonce: u128,                 // Batch nonce
) -> [Ciphertext; 8] {                 // Batch summary result
    
    let batch_cipher = RescueCipher::new_for_mxe();
    
    let mut successful_settlements: mu8 = 0.into();
    let mut total_volume: mu64 = 0.into();
    let mut failed_settlements: mu8 = 0.into();
    
    for i in 0..32 {
        if i < batch_size as usize {
            let success: mbool = true.into();
            let volume: mu64 = 1000.into();
            
            successful_settlements = successful_settlements + success.select(1.into(), 0.into());
            total_volume = total_volume + success.select(volume, 0.into());
            failed_settlements = failed_settlements + success.select(0.into(), 1.into());
        }
    }
    
    // Create batch summary
    let summary = [
        successful_settlements.into(),  // Count of successful settlements
        failed_settlements.into(),      // Count of failed settlements  
        total_volume,                   // Total trading volume
        0.into(),                       // Reserved
        0.into(),                       // Reserved
        0.into(),                       // Reserved
        0.into(),                       // Reserved
        0.into(),                       // Reserved
    ];
    
    batch_cipher.encrypt::<8, [mu64; 8]>(summary, batch_nonce)
}

/// Verify auction timing constraints
fn verify_auction_timing(start_time: mu64, end_time: mu64, current_time: mu64) -> mbool {
    let started = current_time >= start_time;
    let not_ended = current_time <= end_time;
    started & not_ended
}

fn calculate_dutch_price(
    starting_price: mu64,
    decrease_rate: mu64,
    elapsed_time: mu64,
) -> mu64 {
    let price_decrease = decrease_rate * elapsed_time;
    let current_price = starting_price - price_decrease;
    
    // Ensure price doesn't go below zero
    let is_positive = current_price > 0.into();
    is_positive.select(current_price, 0.into())
}

fn validate_bid(
    bid_amount: mu64,
    minimum_bid: mu64,
    reserve_price: mu64,
) -> mbool {
    let meets_minimum = bid_amount >= minimum_bid;
    let meets_reserve = bid_amount >= reserve_price;
    meets_minimum & meets_reserve
}