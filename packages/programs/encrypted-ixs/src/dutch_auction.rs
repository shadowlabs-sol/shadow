use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    #[instruction]
    pub fn process_dutch_auction(
        auction_id: Enc<Mxe, u64>,
        starting_price: Enc<Mxe, u64>,
        current_price: Enc<Mxe, u64>,
        price_decrease_rate: Enc<Mxe, u64>,
        minimum_floor: Enc<Mxe, u64>,
        elapsed_time: Enc<Shared, u64>, // In seconds
        bid_price: Enc<Shared, u64>,
        bidder_id: Enc<Shared, u128>,
    ) -> Enc<Shared, (u128, u64, bool)> { // (winner_id, final_price, auction_won)
        let start_price = starting_price.to_arcis();
        let decrease_rate = price_decrease_rate.to_arcis();
        let min_floor = minimum_floor.to_arcis();
        let time_elapsed = elapsed_time.to_arcis();
        let bid_amount = bid_price.to_arcis();
        let bidder = bidder_id.to_arcis();
        
        // Calculate current price based on Dutch auction formula
        let price_decrease = decrease_rate * time_elapsed;
        let calculated_price = if start_price > price_decrease {
            start_price - price_decrease
        } else {
            min_floor
        };
        
        let final_price = calculated_price.max(min_floor);
        
        // Check if bid meets or exceeds current price
        let auction_won = bid_amount >= final_price && bidder > 0;
        
        let winner = if auction_won { bidder } else { 0 };
        
        elapsed_time.owner.from_arcis((winner, final_price, auction_won))
    }

    #[instruction]
    pub fn calculate_dutch_price(
        starting_price: Enc<Mxe, u64>,
        decrease_rate: Enc<Mxe, u64>,
        minimum_floor: Enc<Mxe, u64>,
        elapsed_time: Enc<Shared, u64>,
    ) -> Enc<Shared, u64> {
        let start_price = starting_price.to_arcis();
        let rate = decrease_rate.to_arcis();
        let floor = minimum_floor.to_arcis();
        let time = elapsed_time.to_arcis();
        
        let price_decrease = rate * time;
        let current_price = if start_price > price_decrease {
            start_price - price_decrease
        } else {
            floor
        };
        
        elapsed_time.owner.from_arcis(current_price.max(floor))
    }
}