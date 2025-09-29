use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::ShadowProtocolError;

pub fn queue_mpc_computation(
    ctx: Context<QueueMpcComputation>,
    auction_id: u64,
    bids_count: u32,
    encrypted_bids: Vec<EncryptedBidData>,
    encrypted_reserve_price: [u8; 32],
    mxe_cluster: Pubkey,
    gas_limit: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    require!(
        auction.status == AuctionStatus::Ended || 
        (auction.status == AuctionStatus::Active && clock.unix_timestamp >= auction.end_time),
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    require!(
        auction.auction_id == auction_id,
        ShadowProtocolError::InvalidAuctionId
    );
    
    require!(
        encrypted_bids.len() as u32 == bids_count,
        ShadowProtocolError::InvalidBidCount
    );
    
    require!(
        bids_count <= MAX_BIDS_PER_AUCTION as u32,
        ShadowProtocolError::TooManyBids
    );
    
    let computation_id = generate_computation_id(auction_id, auction.end_time);

    auction.mpc_computation_id = Some(computation_id);
    auction.mxe_cluster = Some(mxe_cluster);
    auction.computation_gas_limit = gas_limit;
    auction.computation_queued_at = Some(clock.unix_timestamp);

    if auction.status == AuctionStatus::Active {
        auction.status = AuctionStatus::Ended;
        auction.end_time = clock.unix_timestamp;
    }

    msg!(
        "Arcium MPC computation queued for auction {}: computation_id={:?}, bids_count={}, gas_limit={}",
        auction_id,
        computation_id,
        bids_count,
        gas_limit
    );

    emit!(MpcComputationQueued {
        auction_id,
        computation_id,
        bids_count,
        mxe_cluster,
        gas_limit,
        queued_at: clock.unix_timestamp,
    });
    
    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EncryptedBidData {
    pub bidder: Pubkey,
    pub encrypted_amount: [u8; 32],
    pub nonce: [u8; 16],
    pub public_key: [u8; 32],
}

#[event]
pub struct MpcComputationQueued {
    pub auction_id: u64,
    pub computation_id: [u8; 32],
    pub bids_count: u32,
    pub mxe_cluster: Pubkey,
    pub gas_limit: u64,
    pub queued_at: i64,
}

#[event]
pub struct ArciumComputationCompleted {
    pub auction_id: u64,
    pub computation_id: [u8; 32],
    pub winner: Pubkey,
    pub winning_amount: u64,
    pub verification_hash: [u8; 32],
    pub completed_at: i64,
}

pub fn arcium_callback(
    ctx: Context<ArciumCallback>,
    computation_id: [u8; 32],
    result: Vec<u8>,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;

    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    require!(
        auction.status == AuctionStatus::Ended,
        ShadowProtocolError::InvalidAuctionStatus
    );
    require!(
        !auction.settlement_authorized,
        ShadowProtocolError::AuctionAlreadySettled
    );

    let expected_computation_id = generate_computation_id(auction.auction_id, auction.end_time);
    require!(
        computation_id == expected_computation_id,
        ShadowProtocolError::InvalidComputationId
    );

    let mpc_result = parse_arcium_result(&result)?;
    require!(
        mpc_result.winning_amount > 0 && mpc_result.winning_amount >= auction.minimum_bid,
        ShadowProtocolError::BidTooLow
    );

    let verification_hash = compute_settlement_hash(
        auction.auction_id,
        mpc_result.winner,
        mpc_result.winning_amount,
        auction.bid_count,
        auction.end_time
    );

    require!(
        verification_hash == mpc_result.verification_hash,
        ShadowProtocolError::MpcVerificationFailed
    );

    auction.winner = Some(mpc_result.winner);
    auction.winning_amount = mpc_result.winning_amount;
    auction.mpc_verification_hash = Some(mpc_result.verification_hash);
    auction.settlement_authorized = true;
    auction.settled_at = Some(clock.unix_timestamp);

    emit!(ArciumComputationCompleted {
        auction_id: auction.auction_id,
        computation_id,
        winner: mpc_result.winner,
        winning_amount: mpc_result.winning_amount,
        verification_hash: mpc_result.verification_hash,
        completed_at: clock.unix_timestamp,
    });

    msg!(
        "MPC computation verified for auction {}: winner={}, amount={}",
        auction.auction_id,
        mpc_result.winner,
        mpc_result.winning_amount
    );

    Ok(())
}

fn generate_computation_id(auction_id: u64, end_time: i64) -> [u8; 32] {
    use anchor_lang::solana_program::hash::{hash, Hash};

    let mut data = Vec::new();
    data.extend_from_slice(b"shadow_mpc_computation");
    data.extend_from_slice(&auction_id.to_le_bytes());
    data.extend_from_slice(&end_time.to_le_bytes());

    hash(&data).to_bytes()
}

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

    hash(&data).to_bytes()
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct QueueMpcComputation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = auction.auction_id == auction_id @ ShadowProtocolError::InvalidAuctionId
    )]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// CHECK: MXE program account
    pub mxe_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
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

fn parse_arcium_result(result: &[u8]) -> Result<ArciumMpcResult> {
    require!(result.len() >= 72, ShadowProtocolError::InvalidMpcResult);

    let winner_bytes: [u8; 32] = result[0..32].try_into()
        .map_err(|_| ShadowProtocolError::InvalidMpcResult)?;
    let winner = Pubkey::new_from_array(winner_bytes);

    let winning_amount = u64::from_le_bytes(
        result[32..40].try_into()
            .map_err(|_| ShadowProtocolError::InvalidMpcResult)?
    );

    let verification_hash: [u8; 32] = result[40..72].try_into()
        .map_err(|_| ShadowProtocolError::InvalidMpcResult)?;

    Ok(ArciumMpcResult {
        winner,
        winning_amount,
        verification_hash,
    })
}

#[derive(Debug)]
pub struct ArciumMpcResult {
    pub winner: Pubkey,
    pub winning_amount: u64,
    pub verification_hash: [u8; 32],
}