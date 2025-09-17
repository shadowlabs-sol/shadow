import { PublicKey } from '@solana/web3.js';

// Shadow Protocol Program ID (will be updated after deployment)
export const SHADOW_PROTOCOL_PROGRAM_ID = 'ShadowProtocol11111111111111111111111111111';

// Arcium Network Constants
export const DEFAULT_CLUSTER_OFFSET = 1116522165; // Devnet cluster
export const ARCIUM_PROGRAM_ID = new PublicKey('ArciumProgram11111111111111111111111111111');

// PDA Seeds
export const PROTOCOL_SEED = 'protocol';
export const AUCTION_SEED = 'auction';
export const BID_SEED = 'bid';
export const ASSET_VAULT_SEED = 'asset_vault';
export const BATCH_SEED = 'batch';
export const MXE_SEED = 'mxe';

// Network Configuration
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const ARCIUM_CLUSTER_OFFSET = parseInt(process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET || '1116522165');

// Transaction Limits
export const MAX_BIDS_PER_AUCTION = 1000;
export const MAX_AUCTION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds
export const MAX_PROTOCOL_FEE = 500; // 5% in basis points

// Computation Definition Offsets
export const COMP_DEF_OFFSET_SEALED_BID = 0x12345678;
export const COMP_DEF_OFFSET_DUTCH_AUCTION = 0x87654321;
export const COMP_DEF_OFFSET_BATCH_SETTLEMENT = 0xABCDEF01;

// Default Values
export const DEFAULT_MEMPOOL_SIZE = 'Small';
export const DEFAULT_CONFIRMATION = 'confirmed';