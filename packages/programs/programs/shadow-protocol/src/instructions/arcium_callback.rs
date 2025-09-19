use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::ShadowProtocolError;
use crate::crypto::CryptoUtils;

/// Arcium callback instruction for MPC computation results
pub fn arcium_callback(
    ctx: Context<ArciumCallback>,
    computation_id: [u8; 32],
    result: Vec<u8>,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    // Verify only Arcium network can call this
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    // Verify auction is in correct state for MPC result
    require!(
        auction.status == AuctionStatus::Ended,
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    require!(
        !auction.settlement_authorized,
        ShadowProtocolError::AuctionAlreadySettled
    );
    
    // Verify computation ID matches expected auction context
    let expected_computation_id = generate_computation_id(auction.auction_id, auction.end_time);
    require!(
        computation_id == expected_computation_id,
        ShadowProtocolError::InvalidComputationId
    );
    
    // Parse and validate MPC result
    require!(
        result.len() >= 96, // 32 bytes winner + 32 bytes amount + 32 bytes verification hash
        ShadowProtocolError::InvalidMpcResult
    );
    
    let winner_bytes: [u8; 32] = result[0..32].try_into()
        .map_err(|_| ShadowProtocolError::InvalidMpcResult)?;
    let winner = Pubkey::new_from_array(winner_bytes);
    
    let winning_amount = u64::from_le_bytes(
        result[32..40].try_into()
            .map_err(|_| ShadowProtocolError::InvalidMpcResult)?
    );
    
    let verification_hash: [u8; 32] = result[64..96].try_into()
        .map_err(|_| ShadowProtocolError::InvalidMpcResult)?;
    
    // Verify the MPC computation hash using crypto utilities
    let expected_hash = compute_settlement_hash(
        auction.auction_id,
        winner,
        winning_amount,
        auction.bid_count,
        auction.end_time
    );
    
    require!(
        verification_hash == expected_hash,
        ShadowProtocolError::InvalidMpcVerification
    );
    
    // Additional MPC result validation using crypto utilities
    let is_computation_valid = CryptoUtils::verify_mpc_computation(
        &result,
        auction.auction_id,
        auction.bid_count,
        auction.end_time,
        verification_hash,
    )?;
    
    require!(
        is_computation_valid,
        ShadowProtocolError::MpcVerificationFailed
    );
    
    // Validate winning amount is reasonable
    require!(
        winning_amount >= auction.minimum_bid,
        ShadowProtocolError::BidTooLow
    );
    
    // Store MPC results and authorize settlement
    auction.winner = Some(winner);
    auction.winning_amount = winning_amount;
    auction.mpc_verification_hash = Some(verification_hash);
    auction.settlement_authorized = true;
    auction.settled_at = Some(clock.unix_timestamp);
    
    msg!(
        "MPC computation verified for auction {}: winner={}, amount={}, hash={:?}",
        auction.auction_id,
        winner,
        winning_amount,
        verification_hash
    );
    
    Ok(())
}

/// Generate deterministic computation ID for auction
fn generate_computation_id(auction_id: u64, end_time: i64) -> [u8; 32] {
    use anchor_lang::solana_program::hash::{hash, Hash};
    
    let mut data = Vec::new();
    data.extend_from_slice(b"shadow_mpc_computation");
    data.extend_from_slice(&auction_id.to_le_bytes());
    data.extend_from_slice(&end_time.to_le_bytes());
    
    let hash_result: Hash = hash(&data);
    hash_result.to_bytes()
}

/// Compute settlement verification hash
fn compute_settlement_hash(
    auction_id: u64,
    winner: Pubkey,
    winning_amount: u64,
    bid_count: u64,
    end_time: i64,
) -> [u8; 32] {
    use anchor_lang::solana_program::hash::{hash, Hash};
    
    let mut data = Vec::new();
    data.extend_from_slice(b"shadow_settlement_verification");
    data.extend_from_slice(&auction_id.to_le_bytes());
    data.extend_from_slice(&winner.to_bytes());
    data.extend_from_slice(&winning_amount.to_le_bytes());
    data.extend_from_slice(&bid_count.to_le_bytes());
    data.extend_from_slice(&end_time.to_le_bytes());
    
    let hash_result: Hash = hash(&data);
    hash_result.to_bytes()
}

#[derive(Accounts)]
#[instruction(computation_id: [u8; 32])]
pub struct ArciumCallback<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = auction.status == AuctionStatus::Ended @ ShadowProtocolError::InvalidAuctionStatus
    )]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub system_program: Program<'info, System>,
}