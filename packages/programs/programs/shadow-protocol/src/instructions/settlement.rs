use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer, transfer};
use crate::state::*;
use crate::error::ShadowProtocolError;

/// Authorize settlement after MPC computation verification
pub fn authorize_settlement(
    ctx: Context<AuthorizeSettlement>,
    auction_id: u64,
    mpc_verification_hash: [u8; 32],
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    
    // Verify auction ID matches
    require!(
        auction.auction_id == auction_id,
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    // Only protocol authority can authorize settlement
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

    // Store MPC verification hash and authorize settlement
    auction.mpc_verification_hash = Some(mpc_verification_hash);
    auction.settlement_authorized = true;

    msg!("Settlement authorized for auction {} with MPC hash: {:?}", auction_id, mpc_verification_hash);

    Ok(())
}

pub fn settle_auction(
    ctx: Context<SettleAuction>,
    auction_id: u64,
    computation_offset: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(
        auction.status == AuctionStatus::Active || auction.status == AuctionStatus::Ended,
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    require!(
        clock.unix_timestamp >= auction.end_time,
        ShadowProtocolError::AuctionNotEnded
    );
    
    require!(
        auction.status != AuctionStatus::Settled,
        ShadowProtocolError::AuctionAlreadySettled
    );
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    // Mark as ended to trigger MPC computation
    auction.status = AuctionStatus::Ended;
    
    
    Ok(())
}

pub fn batch_settle(
    ctx: Context<BatchSettle>,
    auction_ids: Vec<u64>,
    computation_offset: u64,
) -> Result<()> {
    let batch = &mut ctx.accounts.batch;
    let clock = Clock::get()?;
    
    require!(
        auction_ids.len() > 0 && auction_ids.len() <= 10,
        ShadowProtocolError::InvalidBatchSize
    );
    
    batch.batch_id = clock.unix_timestamp as u64;
    batch.creator = ctx.accounts.creator.key();
    batch.auction_ids = auction_ids.clone();
    batch.status = BatchStatus::Created;
    batch.created_at = clock.unix_timestamp;
    batch.settled_at = None;
    batch.bump = ctx.bumps.batch;
    
    
    batch.status = BatchStatus::Settling;
    
    emit!(BatchSettlementCreated {
        batch_id: batch.batch_id,
        creator: ctx.accounts.creator.key(),
        auction_count: auction_ids.len() as u64,
    });
    
    Ok(())
}

pub fn execute_settlement(
    ctx: Context<ExecuteSettlement>,
    auction_id: u64,
    winner: Pubkey,
    winning_amount: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    // Check that settlement is authorized by MPC
    require!(
        auction.settlement_authorized,
        ShadowProtocolError::SettlementNotAuthorized
    );
    
    // Verify MPC verification hash exists
    require!(
        auction.mpc_verification_hash.is_some(),
        ShadowProtocolError::MpcVerificationFailed
    );
    
    require!(
        auction.status == AuctionStatus::Ended,
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    // Verify settlement parameters match MPC results
    require!(
        auction.winner == Some(winner),
        ShadowProtocolError::InvalidWinnerDetermination
    );
    
    require!(
        auction.winning_amount == winning_amount,
        ShadowProtocolError::InvalidAssetAmount
    );
    
    require!(
        winning_amount > 0,
        ShadowProtocolError::InvalidAssetAmount
    );
    
    // Validate asset vault has sufficient funds and matches auction amount
    require!(
        ctx.accounts.asset_vault.amount >= auction.asset_amount,
        ShadowProtocolError::InvalidAssetAmount
    );
    
    // Validate winner is provided (already set by MPC)
    require!(
        winner != Pubkey::default(),
        ShadowProtocolError::InvalidWinnerDetermination
    );
    auction.status = AuctionStatus::Settled;
    auction.settled_at = Some(Clock::get()?.unix_timestamp);
    
    // Calculate protocol fee
    let fee_amount = winning_amount
        .checked_mul(protocol.protocol_fee as u64)
        .ok_or(ShadowProtocolError::FeeCalculationOverflow)?
        .checked_div(10000)
        .ok_or(ShadowProtocolError::FeeCalculationOverflow)?;
    
    let transfer_amount = winning_amount
        .checked_sub(fee_amount)
        .ok_or(ShadowProtocolError::FeeCalculationOverflow)?;
    
    // Transfer asset to winner
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
                to: ctx.accounts.winner_asset_account.to_account_info(),
                authority: auction.to_account_info(),
            },
            signer_seeds,
        ),
        auction.asset_amount, // Use the stored asset amount
    )?;
    
    // Transfer payment from winner to creator (minus fees)
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.winner_payment_account.to_account_info(),
                to: ctx.accounts.creator_payment_account.to_account_info(),
                authority: ctx.accounts.winner.to_account_info(),
            },
        ),
        transfer_amount,
    )?;
    
    // Transfer fee to protocol
    if fee_amount > 0 {
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.winner_payment_account.to_account_info(),
                    to: ctx.accounts.protocol_fee_account.to_account_info(),
                    authority: ctx.accounts.winner.to_account_info(),
                },
            ),
            fee_amount,
        )?;
    }
    
    emit!(AuctionSettled {
        auction_id,
        winner: Some(winner),
        winning_amount,
        settled_at: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct AuthorizeSettlement<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [AUCTION_SEED, auction_id.to_le_bytes().as_ref()],
        bump = auction.bump
    )]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct SettleAuction<'info> {
    #[account(mut)]
    pub settler: Signer<'info>,
    
    #[account(
        mut,
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
pub struct BatchSettle<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + BatchSettlement::INIT_SPACE,
        seeds = [BATCH_SEED, creator.key().as_ref()],
        bump
    )]
    pub batch: Account<'info, BatchSettlement>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct ExecuteSettlement<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [AUCTION_SEED, auction_id.to_le_bytes().as_ref()],
        bump = auction.bump
    )]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// Asset vault holding the auctioned item
    #[account(
        mut,
        associated_token::mint = auction.asset_mint,
        associated_token::authority = auction
    )]
    pub asset_vault: Account<'info, TokenAccount>,
    
    /// Winner's asset account
    #[account(
        mut,
        associated_token::mint = auction.asset_mint,
        associated_token::authority = winner
    )]
    pub winner_asset_account: Account<'info, TokenAccount>,
    
    /// Winner's payment account
    #[account(mut)]
    pub winner_payment_account: Account<'info, TokenAccount>,
    
    /// Creator's payment account
    #[account(mut)]
    pub creator_payment_account: Account<'info, TokenAccount>,
    
    /// Protocol fee account
    #[account(
        mut,
        address = protocol_state.fee_recipient
    )]
    pub protocol_fee_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

