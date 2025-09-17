use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct DutchAuctionData {
        pub auction_id: u64,
        pub reserve_price: u64,
        pub current_price: u64,
        pub minimum_floor: u64,
    }

    pub struct DutchBid {
        pub auction_id: u64,
        pub bid_amount: u64,
        pub bidder_id: u128,
        pub timestamp: i64,
    }

    #[instruction]
    pub fn process_dutch_auction_bid(
        auction: Enc<Mxe, DutchAuctionData>,
        bid: Enc<Shared, DutchBid>,
    ) -> Enc<Shared, (bool, u64, u128)> { // (is_valid, final_price, winner_id)
        let auction_data = auction.to_arcis();
        let bid_data = bid.to_arcis();
        
        // Verify bid meets current price
        let meets_price = bid_data.bid_amount >= auction_data.current_price;
        
        // Verify bid meets reserve price
        let meets_reserve = bid_data.bid_amount >= auction_data.reserve_price;
        
        // Verify price is above minimum floor
        let above_floor = auction_data.current_price >= auction_data.minimum_floor;
        
        // Bid is valid if it meets all conditions
        let is_valid = meets_price && meets_reserve && above_floor;
        
        // Winner pays the current auction price (not their bid amount)
        let final_price = if is_valid {
            auction_data.current_price.max(auction_data.reserve_price)
        } else {
            0
        };
        
        let winner_id = if is_valid { bid_data.bidder_id } else { 0 };
        
        bid.owner.from_arcis((is_valid, final_price, winner_id))
    }

    #[instruction]
    pub fn calculate_dutch_price(
        starting_price: u64,
        decrease_rate: u64,
        elapsed_time: u64,
        minimum_floor: u64,
    ) -> Enc<Shared, u64> {
        let price_decrease = decrease_rate.saturating_mul(elapsed_time);
        let current_price = starting_price.saturating_sub(price_decrease);
        let final_price = current_price.max(minimum_floor);
        
        Shared.from_arcis(final_price)
    }
}