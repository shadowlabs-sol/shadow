use anchor_lang::prelude::*;

#[error_code]
pub enum ShadowProtocolError {
    #[msg("Auction has already ended")]
    AuctionEnded,
    
    #[msg("Auction has not ended yet")]
    AuctionNotEnded,
    
    #[msg("Auction has already been settled")]
    AuctionAlreadySettled,
    
    #[msg("Bid amount is below minimum")]
    BidBelowMinimum,
    
    #[msg("Invalid auction type")]
    InvalidAuctionType,
    
    #[msg("Invalid auction status")]
    InvalidAuctionStatus,
    
    #[msg("Auction duration exceeds maximum allowed")]
    AuctionDurationTooLong,
    
    #[msg("Protocol is currently paused")]
    ProtocolPaused,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid encryption parameters")]
    InvalidEncryption,
    
    #[msg("Maximum bid count exceeded")]
    MaxBidsExceeded,
    
    #[msg("Batch settlement failed")]
    BatchSettlementFailed,
    
    #[msg("Invalid reserve price")]
    InvalidReservePrice,
    
    #[msg("Computation request failed")]
    ComputationFailed,
    
    #[msg("Asset transfer failed")]
    AssetTransferFailed,
    
    #[msg("Invalid Dutch auction price decrease rate")]
    InvalidPriceDecreaseRate,
    
    #[msg("Dutch auction price not met")]
    DutchPriceNotMet,
    
    #[msg("Invalid batch size")]
    InvalidBatchSize,
    
    #[msg("Auction not found in batch")]
    AuctionNotInBatch,
    
    #[msg("Fee calculation overflow")]
    FeeCalculationOverflow,
    
    #[msg("Invalid protocol fee")]
    InvalidProtocolFee,
    
    #[msg("Insufficient funds for bid")]
    InsufficientFunds,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    
    #[msg("Decryption failed")]
    DecryptionFailed,
    
    #[msg("Invalid winner determination")]
    InvalidWinnerDetermination,
    
    #[msg("MPC verification failed")]
    MpcVerificationFailed,
    
    #[msg("Settlement not authorized")]
    SettlementNotAuthorized,
    
    #[msg("Authority transfer already pending")]
    AuthorityTransferPending,
    
    #[msg("Authority transfer timelock not elapsed")]
    AuthorityTransferTimelockNotElapsed,
    
    #[msg("No pending authority transfer")]
    NoPendingAuthorityTransfer,
    
    #[msg("Auction ID already exists")]
    AuctionIdAlreadyExists,
    
    #[msg("Insufficient collateral for bid")]
    InsufficientCollateral,
    
    #[msg("Invalid asset amount")]
    InvalidAssetAmount,
    
    #[msg("Price below minimum floor")]
    PriceBelowMinimumFloor,
}