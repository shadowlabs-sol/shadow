use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    pub struct BidData {
        pub auction_id: u64,
        pub bid_amount: u64,
        pub bidder_id: u128,
    }

    pub struct AuctionData {
        pub reserve_price: u64,
        pub bids: Vec<BidData>,
        pub bid_count: u64,
    }

    #[instruction]
    pub fn process_sealed_bid_auction(
        auction_data: Enc<Mxe, AuctionData>,
        bids: Enc<Shared, Vec<BidData>>,
    ) -> Enc<Shared, (u128, u64, bool)> { // (winner_id, winning_amount, auction_met_reserve)
        let auction = auction_data.to_arcis();
        let bid_list = bids.to_arcis();
        
        // Find highest bid
        let mut highest_bid: u64 = 0;
        let mut winner_id: u128 = 0;
        let mut second_highest: u64 = 0;
        
        for bid in bid_list.iter() {
            if bid.bid_amount > highest_bid {
                second_highest = highest_bid;
                highest_bid = bid.bid_amount;
                winner_id = bid.bidder_id;
            } else if bid.bid_amount > second_highest {
                second_highest = bid.bid_amount;
            }
        }
        
        // Vickrey auction: winner pays second-highest price
        let winning_amount = if second_highest > 0 { second_highest } else { highest_bid };
        let met_reserve = winning_amount >= auction.reserve_price;
        
        bids.owner.from_arcis((winner_id, winning_amount, met_reserve))
    }

    #[instruction]
    pub fn verify_bid_encryption(
        bid: Enc<Shared, BidData>,
        auction_id: u64,
    ) -> Enc<Shared, bool> {
        let bid_data = bid.to_arcis();
        let is_valid = bid_data.auction_id == auction_id && bid_data.bid_amount > 0;
        bid.owner.from_arcis(is_valid)
    }
}