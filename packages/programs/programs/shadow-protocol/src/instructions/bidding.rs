use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer, transfer};
use crate::state::*;
use crate::error::ShadowProtocolError;

/// Calculate current Dutch auction price based on time progression
fn calculate_dutch_auction_price(auction: &AuctionAccount) -> Result<u64> {
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    let elapsed_time = current_time.saturating_sub(auction.start_time);
    
    // Ensure elapsed time is non-negative
    let elapsed_seconds = elapsed_time.max(0) as u64;
    
    // Calculate price decrease based on time (price_decrease_rate is per second)
    let price_decrease = elapsed_seconds
        .checked_mul(auction.price_decrease_rate)
        .ok_or(ShadowProtocolError::FeeCalculationOverflow)?;
    
    // Calculate current price with minimum floor enforcement
    let current_price = auction.current_price
        .saturating_sub(price_decrease)
        .max(auction.minimum_price_floor);
    
    Ok(current_price)
}

pub fn submit_encrypted_bid(
    ctx: Context<SubmitBid>,
    auction_id: u64,
    bid_amount_encrypted: [u8; 32],
    public_key: [u8; 32],
    nonce: u128,
    collateral_amount: u64,
    computation_offset: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    require!(
        auction.status == AuctionStatus::Active,
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    require!(
        collateral_amount >= auction.minimum_bid,
        ShadowProtocolError::InsufficientCollateral
    );
    
    // Validate collateral amount is reasonable (prevent overflow attacks)
    require!(
        collateral_amount <= u64::MAX / 2,
        ShadowProtocolError::InvalidAssetAmount
    );
    
    // Validate bidder has sufficient collateral
    require!(
        ctx.accounts.bidder_collateral_account.amount >= collateral_amount,
        ShadowProtocolError::InsufficientFunds
    );
    
    require!(
        clock.unix_timestamp < auction.end_time,
        ShadowProtocolError::AuctionEnded
    );
    
    require!(
        auction.bid_count < MAX_BIDS_PER_AUCTION as u64,
        ShadowProtocolError::MaxBidsExceeded
    );
    
    let bid = &mut ctx.accounts.bid;
    bid.auction_id = auction_id;
    bid.bidder = ctx.accounts.bidder.key();
    bid.amount_encrypted = bid_amount_encrypted;
    bid.encryption_public_key = public_key;
    bid.nonce = nonce;
    bid.timestamp = clock.unix_timestamp;
    bid.collateral_amount = collateral_amount;
    bid.collateral_account = ctx.accounts.bidder_collateral_account.key();
    bid.is_winner = false;
    bid.bump = ctx.bumps.bid;
    
    // Transfer collateral to bid escrow
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bidder_collateral_account.to_account_info(),
                to: ctx.accounts.bid_escrow.to_account_info(),
                authority: ctx.accounts.bidder.to_account_info(),
            },
        ),
        collateral_amount,
    )?;
    
    auction.bid_count += 1;
    
    
    emit!(BidSubmitted {
        auction_id,
        bidder: ctx.accounts.bidder.key(),
        timestamp: clock.unix_timestamp,
        bid_count: auction.bid_count,
    });
    
    Ok(())
}

pub fn submit_dutch_bid(
    ctx: Context<SubmitDutchBid>,
    auction_id: u64,
    bid_amount: u64,
    collateral_amount: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let protocol = &ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(!protocol.paused, ShadowProtocolError::ProtocolPaused);
    
    require!(
        auction.auction_type == AuctionType::Dutch,
        ShadowProtocolError::InvalidAuctionType
    );
    
    require!(
        collateral_amount >= bid_amount,
        ShadowProtocolError::InsufficientCollateral
    );
    
    // Validate bid amount is reasonable (prevent overflow attacks)
    require!(
        bid_amount <= u64::MAX / 2,
        ShadowProtocolError::InvalidAssetAmount
    );
    
    // Validate bidder has sufficient collateral
    require!(
        ctx.accounts.bidder_collateral_account.amount >= collateral_amount,
        ShadowProtocolError::InsufficientFunds
    );
    
    require!(
        auction.status == AuctionStatus::Active,
        ShadowProtocolError::InvalidAuctionStatus
    );
    
    require!(
        clock.unix_timestamp < auction.end_time,
        ShadowProtocolError::AuctionEnded
    );
    
    // Calculate current price based on slot progression (more reliable than timestamps)
    let current_price = calculate_dutch_auction_price(auction)?;
    
    require!(
        bid_amount >= current_price,
        ShadowProtocolError::DutchPriceNotMet
    );
    
    require!(
        current_price >= auction.minimum_price_floor,
        ShadowProtocolError::PriceBelowMinimumFloor
    );
    
    // Transfer collateral from bidder
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bidder_collateral_account.to_account_info(),
                to: ctx.accounts.protocol_payment_account.to_account_info(),
                authority: ctx.accounts.bidder.to_account_info(),
            },
        ),
        collateral_amount,
    )?;
    
    // Dutch auction ends immediately when bid meets price
    auction.status = AuctionStatus::Ended;
    auction.winner = Some(ctx.accounts.bidder.key());
    auction.winning_amount = current_price;
    auction.bid_count = 1;
    
    
    emit!(BidSubmitted {
        auction_id,
        bidder: ctx.accounts.bidder.key(),
        timestamp: clock.unix_timestamp,
        bid_count: 1,
    });
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct SubmitBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,
    
    #[account(
        mut,
        seeds = [AUCTION_SEED, auction_id.to_le_bytes().as_ref()],
        bump = auction.bump
    )]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        init,
        payer = bidder,
        space = 8 + BidAccount::INIT_SPACE,
        seeds = [BID_SEED, auction_id.to_le_bytes().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid: Account<'info, BidAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// Bidder's collateral token account
    #[account(
        mut,
        associated_token::mint = collateral_mint,
        associated_token::authority = bidder
    )]
    pub bidder_collateral_account: Account<'info, TokenAccount>,
    
    /// Bid escrow account to hold collateral
    #[account(
        init,
        payer = bidder,
        token::mint = collateral_mint,
        token::authority = bid,
        seeds = [b"bid_escrow", auction_id.to_le_bytes().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid_escrow: Account<'info, TokenAccount>,
    
    /// Collateral token mint
    pub collateral_mint: Account<'info, Mint>,
    
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct SubmitDutchBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,
    
    #[account(
        mut,
        seeds = [AUCTION_SEED, auction_id.to_le_bytes().as_ref()],
        bump = auction.bump,
        constraint = auction.auction_type == AuctionType::Dutch @ ShadowProtocolError::InvalidAuctionType
    )]
    pub auction: Account<'info, AuctionAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// Bidder's collateral token account
    #[account(
        mut,
        associated_token::mint = collateral_mint,
        associated_token::authority = bidder
    )]
    pub bidder_collateral_account: Account<'info, TokenAccount>,
    
    /// Protocol payment account
    #[account(
        mut,
        address = protocol_state.fee_recipient
    )]
    pub protocol_payment_account: Account<'info, TokenAccount>,
    
    /// Collateral token mint
    pub collateral_mint: Account<'info, Mint>,
    
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

