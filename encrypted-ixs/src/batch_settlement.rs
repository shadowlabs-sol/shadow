use arcis_imports::*;

#[derive(Clone, Debug)]
pub struct BatchAuction {
    pub auction_id: u64,
    pub bids: Vec<EncryptedBid>,
    pub reserve_price: u128,
    pub auction_type: u8,
}

#[derive(Clone, Debug)]
pub struct EncryptedBid {
    pub bidder: [u8; 32],
    pub amount_encrypted: Vec<u8>,
    pub nonce: u128,
}

#[derive(Clone, Debug)]
pub struct BatchSettlementResult {
    pub auction_results: Vec<SingleAuctionResult>,
    pub total_volume: u128,
    pub successful_auctions: u32,
}

#[derive(Clone, Debug)]
pub struct SingleAuctionResult {
    pub auction_id: u64,
    pub winner: Option<[u8; 32]>,
    pub winning_amount: u128,
    pub success: bool,
}

#[instruction]
pub fn batch_settlement(
    auctions: Enc<Mxe, Vec<BatchAuction>>,
) -> Enc<Mxe, BatchSettlementResult> {
    let auctions = auctions.to_arcis();
    let mut results = Vec::new();
    let mut total_volume = 0u128;
    let mut successful_auctions = 0u32;
    
    for auction in auctions.iter() {
        let auction_result = process_single_auction(auction);
        
        if auction_result.success {
            successful_auctions += 1;
            total_volume = total_volume.saturating_add(auction_result.winning_amount);
        }
        
        results.push(auction_result);
    }
    
    let batch_result = BatchSettlementResult {
        auction_results: results,
        total_volume,
        successful_auctions,
    };
    
    Mxe::get().from_arcis(batch_result)
}

fn process_single_auction(auction: &BatchAuction) -> SingleAuctionResult {
    let mut decrypted_bids: Vec<([u8; 32], u128)> = Vec::new();
    
    for bid in auction.bids.iter() {
        let amount = decrypt_bid_amount(&bid.amount_encrypted, bid.nonce);
        if amount >= auction.reserve_price {
            decrypted_bids.push((bid.bidder, amount));
        }
    }
    
    if decrypted_bids.is_empty() {
        return SingleAuctionResult {
            auction_id: auction.auction_id,
            winner: None,
            winning_amount: 0,
            success: false,
        };
    }
    
    decrypted_bids.sort_by(|a, b| b.1.cmp(&a.1));
    
    let (winner, winning_amount) = match auction.auction_type {
        0 => {
            (decrypted_bids[0].0, decrypted_bids[0].1)
        }
        1 => {
            let second_price = if decrypted_bids.len() > 1 {
                decrypted_bids[1].1
            } else {
                auction.reserve_price
            };
            (decrypted_bids[0].0, second_price)
        }
        _ => {
            return SingleAuctionResult {
                auction_id: auction.auction_id,
                winner: None,
                winning_amount: 0,
                success: false,
            };
        }
    };
    
    SingleAuctionResult {
        auction_id: auction.auction_id,
        winner: Some(winner),
        winning_amount,
        success: true,
    }
}

fn decrypt_bid_amount(encrypted: &[u8], nonce: u128) -> u128 {
    u128::from_le_bytes(
        encrypted[0..16]
            .try_into()
            .unwrap_or([0u8; 16])
    ) ^ nonce
}

#[instruction]
pub fn verify_batch_integrity(
    batch_id: u64,
    auction_count: u32,
    computed_hash: Enc<Mxe, [u8; 32]>,
    expected_hash: Enc<Mxe, [u8; 32]>,
) -> Enc<Mxe, bool> {
    let computed = computed_hash.to_arcis();
    let expected = expected_hash.to_arcis();
    
    let is_valid = computed == expected && auction_count > 0;
    
    Mxe::get().from_arcis(is_valid)
}