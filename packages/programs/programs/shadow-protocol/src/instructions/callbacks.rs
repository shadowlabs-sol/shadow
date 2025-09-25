use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::ShadowProtocolError;

pub fn init_sealed_bid_comp_def(_ctx: Context<InitSealedBidCompDef>) -> Result<()> {
    Ok(())
}

pub fn init_dutch_auction_comp_def(_ctx: Context<InitDutchAuctionCompDef>) -> Result<()> {
    Ok(())
}

pub fn init_batch_settlement_comp_def(_ctx: Context<InitBatchSettlementCompDef>) -> Result<()> {
    Ok(())
}

pub fn sealed_bid_auction(
    ctx: Context<SealedBidAuction>,
    _auction_id: u64,
    _computation_offset: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    require!(
        auction.status == AuctionStatus::Ended,
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    Ok(())
}

pub fn sealed_bid_auction_callback(
    ctx: Context<SealedBidAuctionCallback>,
    result_data: Vec<u8>,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    
    if result_data.len() >= 32 {
        let winner_bytes: [u8; 32] = result_data[0..32].try_into()
            .map_err(|_| ShadowProtocolError::InvalidWinnerDetermination)?;
        let winner_pubkey = Pubkey::new_from_array(winner_bytes);
        
        let winning_amount = if result_data.len() >= 40 {
            u64::from_le_bytes(result_data[32..40].try_into().unwrap_or([0; 8]))
        } else {
            0
        };
        
        auction.winner = Some(winner_pubkey);
        auction.winning_amount = winning_amount;
        auction.status = AuctionStatus::Settled;
        auction.settled_at = Some(Clock::get()?.unix_timestamp);
        
        emit!(AuctionSettled {
            auction_id: auction.auction_id,
            winner: Some(winner_pubkey),
            winning_amount,
            settled_at: Clock::get()?.unix_timestamp,
        });
    } else {
        auction.status = AuctionStatus::Cancelled;
        return Err(ShadowProtocolError::ComputationFailed.into());
    }
    
    Ok(())
}

pub fn dutch_auction(
    ctx: Context<DutchAuction>,
    _auction_id: u64,
    _computation_offset: u64,
) -> Result<()> {
    let _auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    Ok(())
}

pub fn dutch_auction_callback(
    ctx: Context<DutchAuctionCallback>,
    result_data: Vec<u8>,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    
    if result_data.len() >= 32 {
        let winner_bytes: [u8; 32] = result_data[0..32].try_into()
            .map_err(|_| ShadowProtocolError::InvalidWinnerDetermination)?;
        let winner_pubkey = Pubkey::new_from_array(winner_bytes);
        
        auction.winner = Some(winner_pubkey);
        auction.status = AuctionStatus::Settled;
        auction.settled_at = Some(Clock::get()?.unix_timestamp);
    } else {
        auction.status = AuctionStatus::Ended;
    }
    
    Ok(())
}

pub fn batch_settlement(
    ctx: Context<BatchSettlementCtx>,
    _batch_id: u64,
    _computation_offset: u64,
) -> Result<()> {
    let batch = &mut ctx.accounts.batch_account;
    let protocol = &ctx.accounts.protocol_state;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    require!(
        batch.status == BatchStatus::Created,
        ShadowProtocolError::InvalidBatchSize
    );
    
    Ok(())
}

pub fn batch_settlement_callback(
    ctx: Context<BatchSettlementCallbackCtx>,
    result_data: Vec<u8>,
) -> Result<()> {
    let batch = &mut ctx.accounts.batch_account;
    
    if result_data.len() >= 8 {
        let settled_count = u64::from_le_bytes(
            result_data[0..8].try_into().unwrap_or([0; 8])
        );
        
        batch.status = BatchStatus::Settled;
        batch.settled_at = Some(Clock::get()?.unix_timestamp);
        
        emit!(BatchSettled {
            batch_id: batch.batch_id,
            settled_count,
            settled_at: Clock::get()?.unix_timestamp,
        });
    } else {
        batch.status = BatchStatus::Failed;
        return Err(ShadowProtocolError::BatchSettlementFailed.into());
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitSealedBidCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitDutchAuctionCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitBatchSettlementCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SealedBidAuction<'info> {
    #[account(mut)]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
pub struct SealedBidAuctionCallback<'info> {
    #[account(mut)]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
pub struct DutchAuction<'info> {
    #[account(mut)]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
pub struct DutchAuctionCallback<'info> {
    #[account(mut)]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
pub struct BatchSettlementCtx<'info> {
    #[account(mut)]
    pub batch_account: Account<'info, BatchSettlement>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
pub struct BatchSettlementCallbackCtx<'info> {
    #[account(mut)]
    pub batch_account: Account<'info, BatchSettlement>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}