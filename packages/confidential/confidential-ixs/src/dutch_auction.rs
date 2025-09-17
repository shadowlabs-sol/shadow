use arcis_imports::*;

#[instruction]
pub fn dutch_auction_verify(
    current_bid: Enc<Mxe, u128>,
    reserve_price_encrypted: Enc<Mxe, u128>,
    elapsed_time: u64,
    price_decrease_rate: u64,
    starting_price: u128,
) -> Enc<Mxe, DutchAuctionResult> {
    let bid = current_bid.to_arcis();
    let reserve = reserve_price_encrypted.to_arcis();
    
    // Calculate current Dutch auction price
    let price_decrease = (elapsed_time as u128) * (price_decrease_rate as u128);
    let current_price = starting_price.saturating_sub(price_decrease);
    
    // Check if bid meets current price and reserve
    let meets_current_price = bid >= current_price;
    let meets_reserve = bid >= reserve;
    
    let result = if meets_current_price && meets_reserve {
        DutchAuctionResult::Success {
            winning_amount: current_price,
            actual_bid: bid,
        }
    } else if meets_current_price && !meets_reserve {
        DutchAuctionResult::ReserveNotMet
    } else {
        DutchAuctionResult::PriceNotMet
    };
    
    Mxe::get().from_arcis(result)
}

#[derive(Clone, Debug)]
pub enum DutchAuctionResult {
    Success {
        winning_amount: u128,
        actual_bid: u128,
    },
    ReserveNotMet,
    PriceNotMet,
}

#[instruction]
pub fn calculate_dutch_price(
    starting_price: u128,
    elapsed_seconds: u64,
    decrease_rate_per_second: u64,
) -> Enc<Mxe, u128> {
    let decrease_amount = (elapsed_seconds as u128) * (decrease_rate_per_second as u128);
    let current_price = starting_price.saturating_sub(decrease_amount);
    
    Mxe::get().from_arcis(current_price)
}