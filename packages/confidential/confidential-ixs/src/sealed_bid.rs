use arcis_imports::*;

#[derive(Clone, Debug)]
pub struct EncryptedBid {
    pub bidder: [u8; 32],
    pub amount_encrypted: Vec<u8>,
    pub nonce: u128,
}

#[derive(Clone, Debug)]
pub struct DecryptedBid {
    pub bidder: [u8; 32],
    pub amount: u128,
}

#[derive(Clone, Debug)]
pub enum AuctionResult {
    Winner {
        bidder: [u8; 32],
        winning_amount: u128,
        second_price: Option<u128>,
    },
    NoWinner,
}

#[instruction]
pub fn sealed_bid_auction(
    bids: Enc<Mxe, Vec<EncryptedBid>>,
    auction_type: u8, // 0 = first-price, 1 = second-price
    reserve_price_encrypted: Enc<Mxe, u128>,
) -> Enc<Mxe, AuctionResult> {
    let bids = bids.to_arcis();
    let reserve_price = reserve_price_encrypted.to_arcis();
    
    // Decrypt all bids
    let mut decrypted_bids: Vec<DecryptedBid> = Vec::new();
    for bid in bids.iter() {
        let amount = decrypt_bid_amount(&bid.amount_encrypted, bid.nonce);
        decrypted_bids.push(DecryptedBid {
            bidder: bid.bidder,
            amount,
        });
    }
    
    // Filter bids that meet reserve price
    let valid_bids: Vec<DecryptedBid> = decrypted_bids
        .into_iter()
        .filter(|bid| bid.amount >= reserve_price)
        .collect();
    
    if valid_bids.is_empty() {
        return Mxe::get().from_arcis(AuctionResult::NoWinner);
    }
    
    // Sort bids by amount (descending)
    let mut sorted_bids = valid_bids;
    sorted_bids.sort_by(|a, b| b.amount.cmp(&a.amount));
    
    let result = match auction_type {
        0 => {
            // First-price auction
            AuctionResult::Winner {
                bidder: sorted_bids[0].bidder,
                winning_amount: sorted_bids[0].amount,
                second_price: None,
            }
        }
        1 => {
            // Second-price (Vickrey) auction
            let second_price = if sorted_bids.len() > 1 {
                Some(sorted_bids[1].amount)
            } else {
                Some(reserve_price)
            };
            
            AuctionResult::Winner {
                bidder: sorted_bids[0].bidder,
                winning_amount: sorted_bids[0].amount,
                second_price,
            }
        }
        _ => AuctionResult::NoWinner,
    };
    
    Mxe::get().from_arcis(result)
}

// Helper function to decrypt bid amount
fn decrypt_bid_amount(encrypted: &[u8], nonce: u128) -> u128 {
    
    u128::from_le_bytes(
        encrypted[0..16]
            .try_into()
            .unwrap_or([0u8; 16])
    ) ^ nonce
}

#[instruction]
pub fn verify_reserve_price(
    bid_amount: Enc<Mxe, u128>,
    reserve_price_encrypted: Enc<Mxe, u128>,
) -> Enc<Mxe, bool> {
    let bid = bid_amount.to_arcis();
    let reserve = reserve_price_encrypted.to_arcis();
    
    let meets_reserve = bid >= reserve;
    
    Mxe::get().from_arcis(meets_reserve)
}