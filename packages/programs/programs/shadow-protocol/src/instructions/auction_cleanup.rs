use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, transfer, CloseAccount, close_account};
use crate::state::*;
use crate::error::ShadowProtocolError;

/// Grace period after auction end before cleanup is allowed (24 hours)
pub const CLEANUP_GRACE_PERIOD: i64 = 24 * 60 * 60;

/// Maximum number of expired auctions to cleanup in one transaction
pub const MAX_CLEANUP_BATCH_SIZE: usize = 5;

/// Clean up expired and settled auctions to reclaim storage
pub fn cleanup_expired_auction(
    ctx: Context<CleanupExpiredAuction>,
    auction_id: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    // Verify auction ID matches
    require!(
        auction.auction_id == auction_id,
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    // Auction must be either settled or expired
    let is_settled = auction.status == AuctionStatus::Settled;
    let is_expired = clock.unix_timestamp >= auction.end_time + CLEANUP_GRACE_PERIOD;
    
    require!(
        is_settled || is_expired,
        ShadowProtocolError::AuctionNotEnded
    );
    
    // If auction ended but wasn't settled, refund collateral to creator
    if !is_settled && auction.status == AuctionStatus::Ended {
        // Return asset to creator if no settlement occurred
        if ctx.accounts.asset_vault.amount > 0 {
            let auction_id_bytes = auction.auction_id.to_le_bytes();
            let auction_seeds = &[
                AUCTION_SEED,
                auction_id_bytes.as_ref(),
                &[auction.bump],
            ];
            let signer_seeds = &[&auction_seeds[..]];
            
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.asset_vault.to_account_info(),
                        to: ctx.accounts.creator_asset_account.to_account_info(),
                        authority: auction.to_account_info(),
                    },
                    signer_seeds,
                ),
                ctx.accounts.asset_vault.amount,
            )?;
        }
    }
    
    // Close asset vault if empty
    if ctx.accounts.asset_vault.amount == 0 {
        let auction_id_bytes = auction.auction_id.to_le_bytes();
        let auction_seeds = &[
            AUCTION_SEED,
            auction_id_bytes.as_ref(),
            &[auction.bump],
        ];
        let signer_seeds = &[&auction_seeds[..]];
        
        close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: ctx.accounts.asset_vault.to_account_info(),
                    destination: ctx.accounts.creator.to_account_info(),
                    authority: auction.to_account_info(),
                },
                signer_seeds,
            ),
        )?;
    }
    
    // Mark auction as cleaned up
    auction.status = AuctionStatus::Cancelled;
    
    msg!("Cleaned up expired auction {}", auction_id);
    
    Ok(())
}

/// Clean up expired bids for an auction
pub fn cleanup_expired_bids(
    ctx: Context<CleanupExpiredBids>,
    auction_id: u64,
    bid_indices: Vec<u64>,
) -> Result<()> {
    let auction = &ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    require!(
        bid_indices.len() <= MAX_CLEANUP_BATCH_SIZE,
        ShadowProtocolError::InvalidBatchSize
    );
    
    // Auction must be expired or settled for bid cleanup
    let is_cleanup_eligible = auction.status == AuctionStatus::Settled || 
                             auction.status == AuctionStatus::Cancelled ||
                             clock.unix_timestamp >= auction.end_time + CLEANUP_GRACE_PERIOD;
    
    require!(
        is_cleanup_eligible,
        ShadowProtocolError::AuctionNotEnded
    );
    
    msg!("Cleaned up {} expired bids for auction {}", bid_indices.len(), auction_id);
    
    Ok(())
}

/// Batch cleanup multiple expired auctions
pub fn batch_cleanup_auctions(
    ctx: Context<BatchCleanupAuctions>,
    auction_ids: Vec<u64>,
) -> Result<()> {
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    require!(
        auction_ids.len() <= MAX_CLEANUP_BATCH_SIZE,
        ShadowProtocolError::InvalidBatchSize
    );
    
    require!(
        auction_ids.len() > 0,
        ShadowProtocolError::InvalidBatchSize
    );
    
    // Mark batch as processed
    let batch = &mut ctx.accounts.cleanup_batch;
    batch.creator = ctx.accounts.cleaner.key();
    batch.auction_ids = auction_ids.clone();
    batch.processed_at = clock.unix_timestamp;
    batch.bump = ctx.bumps.cleanup_batch;
    
    msg!("Batch cleanup initiated for {} auctions", auction_ids.len());
    
    Ok(())
}

/// Reclaim unused storage from the protocol
pub fn reclaim_storage(
    ctx: Context<ReclaimStorage>,
) -> Result<()> {
    let protocol = &ctx.accounts.protocol_state;
    
    // Only protocol authority can reclaim storage
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    msg!("Storage reclamation initiated by protocol authority");
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct CleanupExpiredAuction<'info> {
    #[account(mut)]
    pub cleaner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [AUCTION_SEED, auction_id.to_le_bytes().as_ref()],
        bump = auction.bump,
        constraint = auction.auction_id == auction_id @ ShadowProtocolError::InvalidAuctionStatus
    )]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// Asset vault for the auction
    #[account(
        mut,
        associated_token::mint = auction.asset_mint,
        associated_token::authority = auction
    )]
    pub asset_vault: Account<'info, TokenAccount>,
    
    /// Creator's asset account to receive refunds
    #[account(
        mut,
        associated_token::mint = auction.asset_mint,
        associated_token::authority = creator
    )]
    pub creator_asset_account: Account<'info, TokenAccount>,
    
    /// CHECK: Creator account for receiving SOL refunds
    #[account(mut)]
    pub creator: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct CleanupExpiredBids<'info> {
    #[account(mut)]
    pub cleaner: Signer<'info>,
    
    #[account(
        seeds = [AUCTION_SEED, auction_id.to_le_bytes().as_ref()],
        bump = auction.bump
    )]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BatchCleanupAuctions<'info> {
    #[account(mut)]
    pub cleaner: Signer<'info>,
    
    #[account(
        init,
        payer = cleaner,
        space = 8 + CleanupBatch::INIT_SPACE,
        seeds = [b"cleanup_batch", cleaner.key().as_ref()],
        bump
    )]
    pub cleanup_batch: Account<'info, CleanupBatch>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReclaimStorage<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct CleanupBatch {
    /// Creator of the cleanup batch
    pub creator: Pubkey,
    /// List of auction IDs to cleanup
    #[max_len(5)]
    pub auction_ids: Vec<u64>,
    /// Processing timestamp
    pub processed_at: i64,
    /// Bump seed
    pub bump: u8,
}