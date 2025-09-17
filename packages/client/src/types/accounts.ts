import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Account structures that match the Rust program
export interface AuctionAccount {
  auctionId: BN;
  creator: PublicKey;
  assetMint: PublicKey;
  assetVault: PublicKey;
  auctionType: AuctionTypeEnum;
  status: AuctionStatusEnum;
  startTime: BN;
  endTime: BN;
  minimumBid: BN;
  reservePriceEncrypted: number[];
  reservePriceNonce: BN;
  currentPrice: BN;
  priceDecreaseRate: BN;
  bidCount: BN;
  winner: PublicKey | null;
  winningAmount: BN;
  settledAt: BN | null;
}

export interface BidAccount {
  auctionId: BN;
  bidder: PublicKey;
  amountEncrypted: number[];
  encryptionPublicKey: number[];
  nonce: BN;
  timestamp: BN;
  isWinner: boolean;
}

// Enum types that match the Rust program
export type AuctionTypeEnum = 
  | { sealedBid: {} }
  | { dutch: {} }
  | { batch: {} };

export type AuctionStatusEnum = 
  | { created: {} }
  | { active: {} }
  | { ended: {} }
  | { settled: {} }
  | { cancelled: {} };

// Type guards for checking enum variants
export function isAuctionType(type: AuctionTypeEnum, variant: 'sealedBid' | 'dutch' | 'batch'): boolean {
  return variant in type;
}

export function isAuctionStatus(status: AuctionStatusEnum, variant: 'created' | 'active' | 'ended' | 'settled' | 'cancelled'): boolean {
  return variant in status;
}