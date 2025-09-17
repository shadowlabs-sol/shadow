// Export all type modules
export * from './auction';
export * from './bid';
export * from './config';
export * from './settlement';
export * from './accounts';
export * from './program';

// Re-export common types for convenience
export {
  AuctionType,
  AuctionStatus
} from './auction';

export type {
  Auction,
  CreateAuctionParams
} from './auction';

export type {
  Bid,
  SubmitBidParams
} from './bid';

export type {
  ShadowProtocolConfig,
  MXEConfig
} from './config';

export type {
  Settlement,
  SettlementResult
} from './settlement';

// Define additional types that are used across multiple files
export interface AuctionData {
  auctionId: number;
  creator: import('@solana/web3.js').PublicKey;
  assetMint: import('@solana/web3.js').PublicKey;
  assetVault: import('@solana/web3.js').PublicKey;
  auctionType: import('./auction').AuctionType;
  status: import('./auction').AuctionStatus;
  startTime: number;
  endTime: number;
  minimumBid: number;
  reservePriceEncrypted: Uint8Array;
  reservePriceNonce: bigint;
  currentPrice: number;
  startingPrice?: number;
  priceDecreaseRate: number;
  bidCount: number;
  winner: import('@solana/web3.js').PublicKey | null;
  winningAmount: number;
  settledAt?: number;
}

export interface BidData {
  auctionId: number;
  bidder: import('@solana/web3.js').PublicKey;
  amountEncrypted: Uint8Array;
  encryptionPublicKey: Uint8Array;
  nonce: bigint;
  timestamp: number;
  isWinner: boolean;
}