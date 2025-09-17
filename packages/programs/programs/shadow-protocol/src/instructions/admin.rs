use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::ShadowProtocolError;

pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    
    protocol.authority = ctx.accounts.authority.key();
    protocol.protocol_fee = 50; // 0.5% default fee
    protocol.fee_recipient = ctx.accounts.fee_recipient.key();
    protocol.paused = false;
    protocol.next_auction_id = 1; // Start auction IDs from 1
    protocol.pending_authority = None;
    protocol.authority_transfer_timelock = None;
    protocol.bump = ctx.bumps.protocol_state;
    protocol.reserved = [0u8; 100]; // Reduced due to new fields
    
    msg!("Shadow Protocol initialized");
    msg!("Authority: {}", protocol.authority);
    msg!("Fee recipient: {}", protocol.fee_recipient);
    msg!("Protocol fee: {} basis points", protocol.protocol_fee);
    
    Ok(())
}

pub fn set_pause_state(ctx: Context<SetPauseState>, paused: bool) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    protocol.paused = paused;
    
    msg!("Protocol pause state updated: {}", paused);
    
    Ok(())
}

pub fn update_protocol_fee(ctx: Context<UpdateProtocolFee>, new_fee: u16) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    require!(
        new_fee <= MAX_PROTOCOL_FEE,
        ShadowProtocolError::InvalidProtocolFee
    );
    
    protocol.protocol_fee = new_fee;
    
    msg!("Protocol fee updated to {} basis points", new_fee);
    
    Ok(())
}

pub fn update_fee_recipient(ctx: Context<UpdateFeeRecipient>, new_recipient: Pubkey) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    protocol.fee_recipient = new_recipient;
    
    msg!("Fee recipient updated to {}", new_recipient);
    
    Ok(())
}

/// Initiate authority transfer (first step)
pub fn initiate_authority_transfer(ctx: Context<InitiateAuthorityTransfer>, new_authority: Pubkey) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    require!(
        protocol.pending_authority.is_none(),
        ShadowProtocolError::AuthorityTransferPending
    );
    
    protocol.pending_authority = Some(new_authority);
    protocol.authority_transfer_timelock = Some(clock.unix_timestamp + AUTHORITY_TRANSFER_TIMELOCK);
    
    msg!("Authority transfer initiated. New authority: {}, Timelock until: {}", 
         new_authority, 
         clock.unix_timestamp + AUTHORITY_TRANSFER_TIMELOCK);
    
    Ok(())
}

/// Complete authority transfer (second step, after timelock)
pub fn complete_authority_transfer(ctx: Context<CompleteAuthorityTransfer>) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    let clock = Clock::get()?;
    
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    require!(
        protocol.pending_authority.is_some(),
        ShadowProtocolError::NoPendingAuthorityTransfer
    );
    
    require!(
        protocol.authority_transfer_timelock.is_some(),
        ShadowProtocolError::NoPendingAuthorityTransfer
    );
    
    let timelock_expires = protocol.authority_transfer_timelock.unwrap();
    require!(
        clock.unix_timestamp >= timelock_expires,
        ShadowProtocolError::AuthorityTransferTimelockNotElapsed
    );
    
    let new_authority = protocol.pending_authority.unwrap();
    protocol.authority = new_authority;
    protocol.pending_authority = None;
    protocol.authority_transfer_timelock = None;
    
    msg!("Authority transfer completed. New authority: {}", new_authority);
    
    Ok(())
}

/// Cancel pending authority transfer
pub fn cancel_authority_transfer(ctx: Context<CancelAuthorityTransfer>) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    require!(
        protocol.pending_authority.is_some(),
        ShadowProtocolError::NoPendingAuthorityTransfer
    );
    
    protocol.pending_authority = None;
    protocol.authority_transfer_timelock = None;
    
    msg!("Authority transfer cancelled");
    
    Ok(())
}

pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol_state;
    
    require!(
        ctx.accounts.authority.key() == protocol.authority,
        ShadowProtocolError::Unauthorized
    );
    
    protocol.authority = new_authority;
    
    msg!("Authority transferred to {}", new_authority);
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolState::INIT_SPACE,
        seeds = [PROTOCOL_SEED],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// CHECK: Fee recipient account
    pub fee_recipient: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPauseState<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
pub struct UpdateProtocolFee<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
pub struct UpdateFeeRecipient<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// CHECK: New fee recipient account
    pub new_recipient: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// CHECK: New authority account
    pub new_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitiateAuthorityTransfer<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    /// CHECK: New authority account
    pub new_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CompleteAuthorityTransfer<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}

#[derive(Accounts)]
pub struct CancelAuthorityTransfer<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_state.bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
}