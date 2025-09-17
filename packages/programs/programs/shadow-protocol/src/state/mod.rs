use anchor_lang::prelude::*;

pub mod auction;
pub mod bid;
pub mod protocol;

pub use auction::*;
pub use bid::*;
pub use protocol::*;

#[account]
#[derive(InitSpace)]
pub struct ProtocolState {
    /// Protocol authority
    pub authority: Pubkey,
    /// Protocol fee in basis points (e.g., 50 = 0.5%)
    pub protocol_fee: u16,
    /// Fee recipient
    pub fee_recipient: Pubkey,
    /// Whether the protocol is paused
    pub paused: bool,
    /// Next auction ID (auto-incrementing)
    pub next_auction_id: u64,
    /// Pending authority transfer
    pub pending_authority: Option<Pubkey>,
    /// Authority transfer timelock (timestamp)
    pub authority_transfer_timelock: Option<i64>,
    /// Protocol bump seed
    pub bump: u8,
    /// Reserved space for future upgrades
    pub reserved: [u8; 100],
}

#[account]
#[derive(InitSpace)]
pub struct AuctionAccount {
    /// Unique auction identifier
    pub auction_id: u64,
    /// Auction creator
    pub creator: Pubkey,
    /// Asset being auctioned
    pub asset_mint: Pubkey,
    /// Asset vault holding the auctioned item
    pub asset_vault: Pubkey,
    /// Asset amount being auctioned
    pub asset_amount: u64,
    /// Auction type
    pub auction_type: AuctionType,
    /// Auction status
    pub status: AuctionStatus,
    /// Start time (Unix timestamp)
    pub start_time: i64,
    /// End time (Unix timestamp)
    pub end_time: i64,
    /// Minimum bid amount
    pub minimum_bid: u64,
    /// Minimum price floor (for Dutch auctions)
    pub minimum_price_floor: u64,
    /// Encrypted reserve price (for privacy)
    pub reserve_price_encrypted: [u8; 32],
    /// Nonce for reserve price encryption
    pub reserve_price_nonce: u128,
    /// Current highest bid (for Dutch auctions)
    pub current_price: u64,
    /// Price decrease rate (for Dutch auctions, per slot)
    pub price_decrease_rate: u64,
    /// Number of bids received
    pub bid_count: u64,
    /// Winner of the auction (if settled)
    pub winner: Option<Pubkey>,
    /// Winning bid amount
    pub winning_amount: u64,
    /// Settlement timestamp
    pub settled_at: Option<i64>,
    /// MPC settlement verification hash
    pub mpc_verification_hash: Option<[u8; 32]>,
    /// Whether settlement is authorized
    pub settlement_authorized: bool,
    /// Bump seed
    pub bump: u8,
    /// Reserved space for future upgrades
    pub reserved: [u8; 32],
}

#[account]
#[derive(InitSpace)]
pub struct BidAccount {
    /// Reference to the auction
    pub auction_id: u64,
    /// Bidder's public key
    pub bidder: Pubkey,
    /// Encrypted bid amount
    pub amount_encrypted: [u8; 32],
    /// Public key for encryption
    pub encryption_public_key: [u8; 32],
    /// Encryption nonce
    pub nonce: u128,
    /// Bid timestamp
    pub timestamp: i64,
    /// Collateral amount deposited
    pub collateral_amount: u64,
    /// Collateral token account
    pub collateral_account: Pubkey,
    /// Whether this bid won the auction
    pub is_winner: bool,
    /// Bump seed
    pub bump: u8,
    /// Reserved space
    pub reserved: [u8; 16],
}

#[account]
#[derive(InitSpace)]
pub struct BatchSettlement {
    /// Unique batch identifier
    pub batch_id: u64,
    /// Creator of the batch
    pub creator: Pubkey,
    /// List of auction IDs in this batch
    #[max_len(10)]
    pub auction_ids: Vec<u64>,
    /// Settlement status
    pub status: BatchStatus,
    /// Creation timestamp
    pub created_at: i64,
    /// Settlement timestamp
    pub settled_at: Option<i64>,
    /// Bump seed
    pub bump: u8,
    /// Reserved space
    pub reserved: [u8; 64],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum AuctionType {
    SealedBid,
    Dutch,
    Batch,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum AuctionStatus {
    Created,
    Active,
    Ended,
    Settled,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BatchStatus {
    Created,
    Settling,
    Settled,
    Failed,
}

#[event]
pub struct AuctionCreated {
    pub auction_id: u64,
    pub creator: Pubkey,
    pub asset_mint: Pubkey,
    pub auction_type: AuctionType,
    pub start_time: i64,
    pub end_time: i64,
    pub minimum_bid: u64,
}

#[event]
pub struct BidSubmitted {
    pub auction_id: u64,
    pub bidder: Pubkey,
    pub timestamp: i64,
    pub bid_count: u64,
}

#[event]
pub struct AuctionSettled {
    pub auction_id: u64,
    pub winner: Option<Pubkey>,
    pub winning_amount: u64,
    pub settled_at: i64,
}

#[event]
pub struct BatchSettlementCreated {
    pub batch_id: u64,
    pub creator: Pubkey,
    pub auction_count: u64,
}

#[event]
pub struct BatchSettled {
    pub batch_id: u64,
    pub settled_count: u64,
    pub settled_at: i64,
}

pub const PROTOCOL_SEED: &[u8] = b"protocol";
pub const AUCTION_SEED: &[u8] = b"auction";
pub const BID_SEED: &[u8] = b"bid";
pub const ASSET_VAULT_SEED: &[u8] = b"asset_vault";
pub const BATCH_SEED: &[u8] = b"batch";

// Maximum auction duration (30 days)
pub const MAX_AUCTION_DURATION: i64 = 30 * 24 * 60 * 60;

// Maximum protocol fee (5%)
pub const MAX_PROTOCOL_FEE: u16 = 500;

// Maximum bids per auction for gas optimization
pub const MAX_BIDS_PER_AUCTION: usize = 1000;

// Authority transfer timelock (7 days in seconds)
pub const AUTHORITY_TRANSFER_TIMELOCK: i64 = 7 * 24 * 60 * 60;

// Minimum price floor for Dutch auctions (basis points, e.g., 100 = 1% of starting price)
pub const MINIMUM_PRICE_FLOOR_BPS: u16 = 100;