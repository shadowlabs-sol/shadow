use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, transfer};
use crate::state::*;
use crate::error::ShadowProtocolError;
use crate::ComputationOutputs;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AuctionResult {
    pub winner: Pubkey,
    pub winning_amount: u64,
    pub second_price: Option<u64>, // For Vickrey auctions
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct BatchResult {
    pub results: Vec<AuctionResult>,
}

pub fn handle_sealed_bid_settlement(
    ctx: Context<SealedBidSettlementCallback>,
    output: ComputationOutputs,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    
    match output {
        ComputationOutputs::Bytes(data) => {
            // Deserialize the auction result from MPC computation
            let result: AuctionResult = AuctionResult::try_from_slice(&data)
                .map_err(|_| ShadowProtocolError::DecryptionFailed)?;
            
            auction.winner = Some(result.winner);
            auction.winning_amount = result.second_price.unwrap_or(result.winning_amount);
            auction.status = AuctionStatus::Settled;
            auction.settled_at = Some(Clock::get()?.unix_timestamp);
            
            // Update winner's bid record
            if let Some(winner_bid) = ctx.accounts.winner_bid.as_mut() {
                winner_bid.is_winner = true;
            }
            
            emit!(AuctionSettled {
                auction_id: auction.auction_id,
                winner: Some(result.winner),
                winning_amount: auction.winning_amount,
                settled_at: Clock::get()?.unix_timestamp,
            });
            
            msg!("Auction {} settled. Winner: {}, Amount: {}", 
                auction.auction_id, result.winner, auction.winning_amount);
        }
        ComputationOutputs::Error(err) => {
            msg!("MPC computation failed: {}", err);
            return Err(ShadowProtocolError::ComputationFailed.into());
        }
    }
    
    Ok(())
}

pub fn handle_dutch_auction_result(
    ctx: Context<DutchAuctionCallback>,
    output: ComputationOutputs,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    
    match output {
        ComputationOutputs::Bytes(data) => {
            // Deserialize the verification result
            let meets_reserve = data.get(0).map(|&b| b != 0).unwrap_or(false);
            
            if meets_reserve {
                // Auction successfully completed
                auction.status = AuctionStatus::Settled;
                auction.settled_at = Some(Clock::get()?.unix_timestamp);
                
                // Execute asset transfer
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
                    ctx.accounts.asset_vault.amount,
                )?;
                
                emit!(AuctionSettled {
                    auction_id: auction.auction_id,
                    winner: auction.winner,
                    winning_amount: auction.winning_amount,
                    settled_at: Clock::get()?.unix_timestamp,
                });
                
                msg!("Dutch auction {} settled successfully", auction.auction_id);
            } else {
                // Reserve price not met, cancel auction
                auction.status = AuctionStatus::Cancelled;
                auction.winner = None;
                auction.winning_amount = 0;
                
                msg!("Dutch auction {} cancelled - reserve not met", auction.auction_id);
            }
        }
        ComputationOutputs::Error(err) => {
            msg!("Dutch auction verification failed: {}", err);
            return Err(ShadowProtocolError::ComputationFailed.into());
        }
    }
    
    Ok(())
}

pub fn handle_batch_settlement(
    ctx: Context<BatchSettlementCallback>,
    output: ComputationOutputs,
) -> Result<()> {
    let batch = &mut ctx.accounts.batch;
    
    match output {
        ComputationOutputs::Bytes(data) => {
            // Deserialize batch results
            let results: BatchResult = BatchResult::try_from_slice(&data)
                .map_err(|_| ShadowProtocolError::BatchSettlementFailed)?;
            
            let settled_count = results.results.len() as u64;
            
            batch.status = BatchStatus::Settled;
            batch.settled_at = Some(Clock::get()?.unix_timestamp);
            
            emit!(BatchSettled {
                batch_id: batch.batch_id,
                settled_count,
                settled_at: Clock::get()?.unix_timestamp,
            });
            
            msg!("Batch {} settled with {} auctions", batch.batch_id, settled_count);
        }
        ComputationOutputs::Error(err) => {
            msg!("Batch settlement failed: {}", err);
            batch.status = BatchStatus::Failed;
            return Err(ShadowProtocolError::BatchSettlementFailed.into());
        }
    }
    
    Ok(())
}
// Context definitions for callbacks

#[derive(Accounts)]
pub struct SealedBidSettlementCallback<'info> {
    #[account(mut)]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(mut)]
    pub winner_bid: Option<Account<'info, BidAccount>>,
    
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
        mut,
        associated_token::mint = auction.asset_mint,
        associated_token::authority = auction
    )]
    pub asset_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub winner_asset_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BatchSettlementCallback<'info> {
    #[account(mut)]
    pub batch: Account<'info, BatchSettlement>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

// Arcium computation definition contexts

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