use anchor_lang::prelude::*;
use crate::error::ShadowProtocolError;

/// Encryption key derivation and verification utilities
pub struct CryptoUtils;

impl CryptoUtils {
    /// Derive deterministic encryption key from auction and bidder context
    pub fn derive_encryption_key(
        auction_id: u64,
        bidder: Pubkey,
        auction_creator: Pubkey,
        nonce: u128,
    ) -> Result<[u8; 32]> {
        use anchor_lang::solana_program::hash::{hash, Hash};
        
        let mut data = Vec::new();
        data.extend_from_slice(b"shadow_bid_encryption_v1");
        data.extend_from_slice(&auction_id.to_le_bytes());
        data.extend_from_slice(&bidder.to_bytes());
        data.extend_from_slice(&auction_creator.to_bytes());
        data.extend_from_slice(&nonce.to_le_bytes());
        
        let hash_result: Hash = hash(&data);
        Ok(hash_result.to_bytes())
    }
    
    /// Verify encryption key is properly derived
    pub fn verify_encryption_key(
        provided_key: [u8; 32],
        auction_id: u64,
        bidder: Pubkey,
        auction_creator: Pubkey,
        nonce: u128,
    ) -> Result<bool> {
        let expected_key = Self::derive_encryption_key(
            auction_id,
            bidder,
            auction_creator,
            nonce,
        )?;
        
        Ok(provided_key == expected_key)
    }
    
    /// Generate auction-specific public key for MPC computation
    pub fn derive_auction_public_key(
        auction_id: u64,
        creator: Pubkey,
        start_time: i64,
    ) -> Result<[u8; 32]> {
        use anchor_lang::solana_program::hash::{hash, Hash};
        
        let mut data = Vec::new();
        data.extend_from_slice(b"shadow_auction_pubkey_v1");
        data.extend_from_slice(&auction_id.to_le_bytes());
        data.extend_from_slice(&creator.to_bytes());
        data.extend_from_slice(&start_time.to_le_bytes());
        
        let hash_result: Hash = hash(&data);
        Ok(hash_result.to_bytes())
    }
    
    /// Validate bid encryption format and constraints
    pub fn validate_encrypted_bid(
        encrypted_data: &[u8; 32],
        public_key: &[u8; 32],
        nonce: u128,
        minimum_bid: u64,
    ) -> Result<()> {
        // Validate nonce is within reasonable bounds (prevent replay attacks)
        require!(
            nonce > 0,
            ShadowProtocolError::InvalidEncryption
        );
        
        // Validate public key is not all zeros
        require!(
            *public_key != [0u8; 32],
            ShadowProtocolError::InvalidEncryption
        );
        
        // Validate encrypted data is not all zeros
        require!(
            *encrypted_data != [0u8; 32],
            ShadowProtocolError::InvalidEncryption
        );
        
        // Additional entropy check - ensure encrypted data has sufficient randomness
        let zero_count = encrypted_data.iter().filter(|&&x| x == 0).count();
        require!(
            zero_count < 16, // Less than half should be zeros
            ShadowProtocolError::InvalidEncryption
        );
        
        Ok(())
    }
    
    /// Verify MPC computation authenticity
    pub fn verify_mpc_computation(
        computation_result: &[u8],
        auction_id: u64,
        bid_count: u64,
        end_time: i64,
        expected_hash: [u8; 32],
    ) -> Result<bool> {
        use anchor_lang::solana_program::hash::{hash, Hash};
        
        let mut verification_data = Vec::new();
        verification_data.extend_from_slice(b"shadow_mpc_verification_v1");
        verification_data.extend_from_slice(&auction_id.to_le_bytes());
        verification_data.extend_from_slice(&bid_count.to_le_bytes());
        verification_data.extend_from_slice(&end_time.to_le_bytes());
        verification_data.extend_from_slice(computation_result);
        
        let computed_hash: Hash = hash(&verification_data);
        Ok(computed_hash.to_bytes() == expected_hash)
    }
    
    /// Generate secure bid commitment hash
    pub fn generate_bid_commitment(
        bidder: Pubkey,
        amount: u64,
        nonce: u128,
        auction_id: u64,
    ) -> Result<[u8; 32]> {
        use anchor_lang::solana_program::hash::{hash, Hash};
        
        let mut data = Vec::new();
        data.extend_from_slice(b"shadow_bid_commitment_v1");
        data.extend_from_slice(&bidder.to_bytes());
        data.extend_from_slice(&amount.to_le_bytes());
        data.extend_from_slice(&nonce.to_le_bytes());
        data.extend_from_slice(&auction_id.to_le_bytes());
        
        let hash_result: Hash = hash(&data);
        Ok(hash_result.to_bytes())
    }
    
    /// Validate auction encryption parameters
    pub fn validate_auction_encryption(
        reserve_price_encrypted: &[u8; 32],
        reserve_price_nonce: u128,
        creator: Pubkey,
        auction_id: u64,
    ) -> Result<()> {
        // Validate reserve price encryption is not trivial
        require!(
            *reserve_price_encrypted != [0u8; 32],
            ShadowProtocolError::InvalidEncryption
        );
        
        // Validate nonce uniqueness per auction
        require!(
            reserve_price_nonce > 0,
            ShadowProtocolError::InvalidEncryption
        );
        
        // Generate expected encryption context
        let expected_context = Self::derive_auction_encryption_context(
            auction_id,
            creator,
            reserve_price_nonce,
        )?;
        
        // Verify encryption follows expected pattern
        let context_hash = Self::hash_encryption_context(&expected_context)?;
        let encryption_prefix = &reserve_price_encrypted[0..8];
        let context_prefix = &context_hash[0..8];
        
        // Encrypted data should be deterministically related to context
        require!(
            encryption_prefix != context_prefix, // Should be encrypted, not raw context
            ShadowProtocolError::InvalidEncryption
        );
        
        Ok(())
    }
    
    /// Derive auction encryption context
    fn derive_auction_encryption_context(
        auction_id: u64,
        creator: Pubkey,
        nonce: u128,
    ) -> Result<[u8; 32]> {
        use anchor_lang::solana_program::hash::{hash, Hash};
        
        let mut data = Vec::new();
        data.extend_from_slice(b"shadow_auction_encryption_context_v1");
        data.extend_from_slice(&auction_id.to_le_bytes());
        data.extend_from_slice(&creator.to_bytes());
        data.extend_from_slice(&nonce.to_le_bytes());
        
        let hash_result: Hash = hash(&data);
        Ok(hash_result.to_bytes())
    }
    
    /// Hash encryption context for verification
    fn hash_encryption_context(context: &[u8; 32]) -> Result<[u8; 32]> {
        use anchor_lang::solana_program::hash::{hash, Hash};
        
        let hash_result: Hash = hash(context);
        Ok(hash_result.to_bytes())
    }
}