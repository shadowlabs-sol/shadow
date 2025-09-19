use anchor_lang::prelude::*;

#[cfg(target_os = "solana")]
use getrandom::register_custom_getrandom;

#[cfg(target_os = "solana")]
fn custom_random(buf: &mut [u8]) -> std::result::Result<(), getrandom::Error> {
    use anchor_lang::solana_program::clock;
    
    let seed = match clock::Clock::get() {
        Ok(clock) => clock.slot.wrapping_add(clock.unix_timestamp as u64),
        Err(_) => 12345u64,
    };
    
    let mut state = seed;
    for (i, byte) in buf.iter_mut().enumerate() {
        state = state.wrapping_mul(1103515245).wrapping_add(12345).wrapping_add(i as u64);
        *byte = (state >> 8) as u8;
    }
    
    Ok(())
}

#[cfg(target_os = "solana")]
register_custom_getrandom!(custom_random);

mod instructions;
mod state;
mod error;
mod crypto;

use instructions::*;

declare_id!("Apw2K9F8KRSgie4iS5ea82Vd3XwTtmojQfXPdbxYFCQm");


#[program]
pub mod shadow_protocol {
    use super::*;


    pub fn create_sealed_auction(
        ctx: Context<CreateSealedAuction>,
        asset_mint: Pubkey,
        asset_amount: u64,
        duration: u64,
        minimum_bid: u64,
        reserve_price_encrypted: [u8; 32],
        reserve_price_nonce: u128,
    ) -> Result<()> {
        instructions::create_sealed_auction(
            ctx,
            asset_mint,
            asset_amount,
            duration,
            minimum_bid,
            reserve_price_encrypted,
            reserve_price_nonce,
        )
    }

    pub fn create_dutch_auction(
        ctx: Context<CreateDutchAuction>,
        asset_mint: Pubkey,
        asset_amount: u64,
        starting_price: u64,
        price_decrease_rate: u64,
        minimum_price_floor: u64,
        duration: u64,
        reserve_price_encrypted: [u8; 32],
        reserve_price_nonce: u128,
    ) -> Result<()> {
        instructions::create_dutch_auction(
            ctx,
            asset_mint,
            asset_amount,
            starting_price,
            price_decrease_rate,
            minimum_price_floor,
            duration,
            reserve_price_encrypted,
            reserve_price_nonce,
        )
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
        instructions::submit_encrypted_bid(
            ctx,
            auction_id,
            bid_amount_encrypted,
            public_key,
            nonce,
            collateral_amount,
            computation_offset,
        )
    }

    pub fn submit_dutch_bid(
        ctx: Context<SubmitDutchBid>,
        auction_id: u64,
        bid_amount: u64,
        collateral_amount: u64,
    ) -> Result<()> {
        instructions::submit_dutch_bid(ctx, auction_id, bid_amount, collateral_amount)
    }

    pub fn authorize_settlement(
        ctx: Context<AuthorizeSettlement>,
        auction_id: u64,
        mpc_verification_hash: [u8; 32],
    ) -> Result<()> {
        instructions::authorize_settlement(ctx, auction_id, mpc_verification_hash)
    }

    pub fn settle_auction(
        ctx: Context<SettleAuction>,
        auction_id: u64,
        computation_offset: u64,
    ) -> Result<()> {
        instructions::settle_auction(ctx, auction_id, computation_offset)
    }

    pub fn batch_settle(
        ctx: Context<BatchSettle>,
        auction_ids: Vec<u64>,
        computation_offset: u64,
    ) -> Result<()> {
        instructions::batch_settle(ctx, auction_ids, computation_offset)
    }

    pub fn execute_settlement(
        ctx: Context<ExecuteSettlement>,
        auction_id: u64,
        winner: Pubkey,
        winning_amount: u64,
    ) -> Result<()> {
        instructions::execute_settlement(ctx, auction_id, winner, winning_amount)
    }

    pub fn initialize_protocol(ctx: Context<InitializeProtocol>) -> Result<()> {
        instructions::initialize_protocol(ctx)
    }

    pub fn set_pause_state(ctx: Context<SetPauseState>, paused: bool) -> Result<()> {
        instructions::set_pause_state(ctx, paused)
    }

    pub fn update_protocol_fee(ctx: Context<UpdateProtocolFee>, new_fee: u16) -> Result<()> {
        instructions::update_protocol_fee(ctx, new_fee)
    }

    pub fn update_fee_recipient(ctx: Context<UpdateFeeRecipient>, new_recipient: Pubkey) -> Result<()> {
        instructions::update_fee_recipient(ctx, new_recipient)
    }

    pub fn initiate_authority_transfer(ctx: Context<InitiateAuthorityTransfer>, new_authority: Pubkey) -> Result<()> {
        instructions::initiate_authority_transfer(ctx, new_authority)
    }

    pub fn complete_authority_transfer(ctx: Context<CompleteAuthorityTransfer>) -> Result<()> {
        instructions::complete_authority_transfer(ctx)
    }

    pub fn cancel_authority_transfer(ctx: Context<CancelAuthorityTransfer>) -> Result<()> {
        instructions::cancel_authority_transfer(ctx)
    }



    pub fn cleanup_expired_auction(
        ctx: Context<CleanupExpiredAuction>,
        auction_id: u64,
    ) -> Result<()> {
        instructions::cleanup_expired_auction(ctx, auction_id)
    }

    pub fn cleanup_expired_bids(
        ctx: Context<CleanupExpiredBids>,
        auction_id: u64,
        bid_indices: Vec<u64>,
    ) -> Result<()> {
        instructions::cleanup_expired_bids(ctx, auction_id, bid_indices)
    }

    pub fn batch_cleanup_auctions(
        ctx: Context<BatchCleanupAuctions>,
        auction_ids: Vec<u64>,
    ) -> Result<()> {
        instructions::batch_cleanup_auctions(ctx, auction_ids)
    }

    pub fn reclaim_storage(
        ctx: Context<ReclaimStorage>,
    ) -> Result<()> {
        instructions::reclaim_storage(ctx)
    }
}

#[derive(Debug)]
pub enum ComputationOutputs {
    Bytes(Vec<u8>),
    Error(String),
}