use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    #[instruction]
    pub fn process_sealed_bid_auction(
        auction_id: Enc<Mxe, u64>,
        reserve_price: Enc<Mxe, u64>,
        bid1_amount: Enc<Shared, u64>,
        bid1_bidder: Enc<Shared, u128>,
        bid2_amount: Enc<Shared, u64>,
        bid2_bidder: Enc<Shared, u128>,
        bid3_amount: Enc<Shared, u64>,
        bid3_bidder: Enc<Shared, u128>,
        bid4_amount: Enc<Shared, u64>,
        bid4_bidder: Enc<Shared, u128>,
        bid5_amount: Enc<Shared, u64>,
        bid5_bidder: Enc<Shared, u128>,
    ) -> Enc<Shared, (u128, u64, bool)> { // (winner_id, winning_amount, auction_met_reserve)
        let reserve = reserve_price.to_arcis();
        
        // Get bid data
        let bids = [
            (bid1_amount.to_arcis(), bid1_bidder.to_arcis()),
            (bid2_amount.to_arcis(), bid2_bidder.to_arcis()),
            (bid3_amount.to_arcis(), bid3_bidder.to_arcis()),
            (bid4_amount.to_arcis(), bid4_bidder.to_arcis()),
            (bid5_amount.to_arcis(), bid5_bidder.to_arcis()),
        ];
        
        // Find highest bid
        let mut highest_bid: u64 = 0;
        let mut winner_id: u128 = 0;
        let mut second_highest: u64 = 0;
        
        for (bid_amount, bidder_id) in bids.iter() {
            if *bid_amount > highest_bid {
                second_highest = highest_bid;
                highest_bid = *bid_amount;
                winner_id = *bidder_id;
            } else if *bid_amount > second_highest {
                second_highest = *bid_amount;
            }
        }
        
        // Vickrey auction: winner pays second-highest price
        let winning_amount = if second_highest > 0 { second_highest } else { highest_bid };
        let met_reserve = winning_amount >= reserve;
        
        bid1_amount.owner.from_arcis((winner_id, winning_amount, met_reserve))
    }

    #[instruction]
    pub fn verify_bid_encryption(
        bid_amount: Enc<Shared, u64>,
        bidder_id: Enc<Shared, u128>,
        auction_id: u64,
    ) -> Enc<Shared, bool> {
        let amount = bid_amount.to_arcis();
        let bidder = bidder_id.to_arcis();
        let is_valid = amount > 0 && bidder > 0;
        bid_amount.owner.from_arcis(is_valid)
    }
}