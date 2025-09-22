use arcis_imports::*;

#[derive(ArcisType, Copy, Clone)]
pub struct EncryptedBid {
    pub amount: u64,
    pub bidder_id: u128,
    pub timestamp: u64,
    pub nonce: u128,
}

#[derive(ArcisType, Copy, Clone)]
pub struct AuctionParams {
    pub auction_id: u64,
    pub minimum_bid: u64,
    pub reserve_price: u64,
    pub auction_type: u8,
}

#[derive(ArcisType, Copy, Clone)]
pub struct SettlementResult {
    pub winner_id: u128,
    pub winning_amount: u64,
    pub second_highest: u64,
    pub reserve_met: bool,
    pub timestamp: u64,
}

pub
fn sealed_bid_auction(
    bids: [u64; 64],
    bid_count: u64,
    auction_params: AuctionParams,
    settlement_type: u8,
) -> SettlementResult {
    let mut highest_bid = auction_params.minimum_bid;
    let mut second_highest = auction_params.minimum_bid;
    let mut winner_id: u128 = 0;
    let mut found_valid_bid = false;
    
    for i in 0..64 {
        if (i as u64) < bid_count && bids[i] > 0 {
            let bid_amount = bids[i];
            let bid_meets_minimum = bid_amount >= auction_params.minimum_bid;
            let bid_meets_reserve = bid_amount >= auction_params.reserve_price;
            let is_valid_bid = bid_meets_minimum && bid_meets_reserve;
            
            if is_valid_bid && bid_amount > highest_bid {
                second_highest = highest_bid;
                highest_bid = bid_amount;
                winner_id = i as u128;
                found_valid_bid = true;
            } else if is_valid_bid && bid_amount > second_highest && bid_amount <= highest_bid {
                second_highest = bid_amount;
            }
        }
    }
    
    let winning_amount = if settlement_type == 0 {
        highest_bid
    } else {
        second_highest
    };
    
    SettlementResult {
        winner_id: if found_valid_bid { winner_id } else { 0 },
        winning_amount: if found_valid_bid { winning_amount } else { 0 },
        second_highest,
        reserve_met: highest_bid >= auction_params.reserve_price,
        timestamp: 0,
    }
}

pub
fn dutch_auction(
    current_price: u64,
    bid_amount: u64,
    reserve_price: u64,
    bidder_id: u128,
) -> (bool, u64, u128) {
    let meets_current_price = bid_amount >= current_price;
    let meets_reserve = bid_amount >= reserve_price;
    let bid_accepted = meets_current_price && meets_reserve;
    
    let final_price = if bid_accepted { current_price } else { 0 };
    let winner = if bid_accepted { bidder_id } else { 0 };
    
    (bid_accepted, final_price, winner)
}

pub
fn batch_settlement(
    auction_results: [u64; 32],
    batch_size: u8,
) -> (u8, u8, u64) {
    let mut successful_settlements: u8 = 0;
    let mut total_volume: u64 = 0;
    let mut failed_settlements: u8 = 0;
    
    for i in 0..32 {
        if i < batch_size as usize {
            let success = auction_results[i] > 0;
            let volume = auction_results[i];
            
            if success {
                successful_settlements += 1;
                total_volume += volume;
            } else {
                failed_settlements += 1;
            }
        }
    }
    
    (successful_settlements, failed_settlements, total_volume)
}

fn verify_auction_timing(start_time: u64, end_time: u64, current_time: u64) -> bool {
    let started = current_time >= start_time;
    let not_ended = current_time <= end_time;
    started && not_ended
}

fn calculate_dutch_price(
    starting_price: u64,
    decrease_rate: u64,
    elapsed_time: u64,
) -> u64 {
    let price_decrease = decrease_rate * elapsed_time;
    if starting_price > price_decrease {
        starting_price - price_decrease
    } else {
        0
    }
}

fn validate_bid(
    bid_amount: u64,
    minimum_bid: u64,
    reserve_price: u64,
) -> bool {
    bid_amount >= minimum_bid && bid_amount >= reserve_price
}