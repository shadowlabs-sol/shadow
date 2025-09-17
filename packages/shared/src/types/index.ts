import { PublicKey, Commitment } from '@solana/web3.js';

export enum AuctionType {
  SealedBid = 0,
  Dutch = 1,
  Batch = 2,
}

export enum AuctionStatus {
  Created = 0,
  Active = 1,
  Ended = 2,
  Settled = 3,
  Cancelled = 4,
}

export enum BatchStatus {
  Created = 0,
  Settling = 1,
  Settled = 2,
  Failed = 3,
}

export enum BidStatus {
  Submitted = 0,
  Processing = 1,
  Accepted = 2,
  Rejected = 3,
  Winner = 4,
}

export interface ShadowProtocolConfig {
  rpcUrl: string;
  programId?: string;
  arciumClusterPubkey: PublicKey;
  clusterOffset?: number;
  commitment?: Commitment;
  wallet?: any; // Wallet interface
  callbackServerUrl?: string;
}

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  wsUrl?: string;
  chainId: number;
  programIds: {
    shadowProtocol: string;
    arcium: string;
  };
}

export interface AuctionData {
  auctionId: number;
  creator: PublicKey;
  assetMint: PublicKey;
  assetVault: PublicKey;
  auctionType: AuctionType;
  status: AuctionStatus;
  startTime: number;
  endTime: number;
  minimumBid: number;
  reservePrice?: number; // Only visible if decrypted
  reservePriceEncrypted: Uint8Array;
  reserveNonce: string;
  currentPrice?: number; // For Dutch auctions
  priceDecreaseRate?: number; // For Dutch auctions
  startingPrice?: number; // For Dutch auctions
  bidCount: number;
  winner?: PublicKey;
  winningAmount?: number;
  settledAt?: number;
  bump: number;
}

export interface CreateAuctionParams {
  assetMint: PublicKey;
  duration: number; // in seconds
  minimumBid: number;
  reservePrice: number;
}

export interface CreateDutchAuctionParams extends CreateAuctionParams {
  startingPrice: number;
  priceDecreaseRate: number; // decrease per second
}

export interface BidData {
  auctionId: number;
  bidder: PublicKey;
  amountEncrypted?: Uint8Array; // For sealed bids
  amount?: number; // For Dutch bids or decrypted amounts
  encryptionPublicKey?: Uint8Array;
  nonce?: string;
  timestamp: number;
  status: BidStatus;
  isWinner: boolean;
  bump: number;
}

export interface SubmitBidParams {
  auctionId: number;
  bidAmount: number;
}

export interface EncryptedBidParams {
  auctionId: number;
  bidAmountEncrypted: number[];
  publicKey: number[];
  nonce: string;
}

export interface SettlementResult {
  auctionId: number;
  winner?: PublicKey;
  winningAmount: number;
  secondHighestBid?: number;
  reserveMet: boolean;
  settledAt: number;
  totalBids: number;
}

export interface BatchSettlement {
  batchId: number;
  creator: PublicKey;
  auctionIds: number[];
  status: BatchStatus;
  createdAt: number;
  settledAt?: number;
  successfulSettlements: number;
  failedSettlements: number;
  totalVolume: number;
}

export interface EncryptionResult {
  encryptedData: Uint8Array;
  nonce: string;
  publicKey: Uint8Array;
}

export interface DecryptionParams {
  encryptedData: Uint8Array;
  nonce: string;
  privateKey: Uint8Array;
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface AuctionCreatedEvent {
  auctionId: number;
  creator: PublicKey;
  assetMint: PublicKey;
  auctionType: AuctionType;
  startTime: number;
  endTime: number;
  minimumBid: number;
}

export interface BidSubmittedEvent {
  auctionId: number;
  bidder: PublicKey;
  timestamp: number;
  bidCount: number;
  isEncrypted: boolean;
}

export interface AuctionSettledEvent {
  auctionId: number;
  winner?: PublicKey;
  winningAmount: number;
  settledAt: number;
  totalBids: number;
}

export interface BatchSettlementCreatedEvent {
  batchId: number;
  creator: PublicKey;
  auctionCount: number;
}

export interface BatchSettledEvent {
  batchId: number;
  settledCount: number;
  settledAt: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AuctionListResponse {
  auctions: AuctionData[];
  total: number;
  activeCount: number;
  settledCount: number;
}

export interface BidListResponse {
  bids: BidData[];
  total: number;
  winningBids: number;
}

export interface ShadowProtocolError {
  code: string;
  message: string;
  details?: any;
}

export enum ErrorCode {
  // Auction errors
  AUCTION_NOT_FOUND = 'AUCTION_NOT_FOUND',
  AUCTION_ENDED = 'AUCTION_ENDED',
  AUCTION_NOT_STARTED = 'AUCTION_NOT_STARTED',
  INVALID_AUCTION_TYPE = 'INVALID_AUCTION_TYPE',
  
  // Bid errors
  BID_TOO_LOW = 'BID_TOO_LOW',
  BID_AFTER_DEADLINE = 'BID_AFTER_DEADLINE',
  DUPLICATE_BID = 'DUPLICATE_BID',
  INVALID_BID_AMOUNT = 'INVALID_BID_AMOUNT',
  
  // Encryption errors
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  INVALID_KEY = 'INVALID_KEY',
  
  // Settlement errors
  SETTLEMENT_FAILED = 'SETTLEMENT_FAILED',
  ALREADY_SETTLED = 'ALREADY_SETTLED',
  NO_VALID_BIDS = 'NO_VALID_BIDS',
  
  // Network errors
  RPC_ERROR = 'RPC_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  PROGRAM_ERROR = 'PROGRAM_ERROR',
  
  // Validation errors
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export type AuctionFilter = {
  type?: AuctionType;
  status?: AuctionStatus;
  creator?: PublicKey;
  assetMint?: PublicKey;
  minBid?: number;
  maxBid?: number;
  startTime?: number;
  endTime?: number;
};

export type BidFilter = {
  auctionId?: number;
  bidder?: PublicKey;
  minAmount?: number;
  maxAmount?: number;
  status?: BidStatus;
  isWinner?: boolean;
};

export type SortOrder = 'asc' | 'desc';

export type AuctionSortBy = 
  | 'createdAt' 
  | 'startTime' 
  | 'endTime' 
  | 'minimumBid' 
  | 'bidCount'
  | 'winningAmount';

export type BidSortBy = 
  | 'timestamp' 
  | 'amount' 
  | 'status';

export const AUCTION_DURATION_LIMITS = {
  MIN: 60, // 1 minute
  MAX: 30 * 24 * 60 * 60, // 30 days
} as const;

export const BID_LIMITS = {
  MIN: 1,
  MAX: Number.MAX_SAFE_INTEGER,
} as const;

export const PROTOCOL_LIMITS = {
  MAX_AUCTIONS_PER_BATCH: 10,
  MAX_BIDS_PER_AUCTION: 1000,
  MAX_PROTOCOL_FEE: 500, // 5%
} as const;