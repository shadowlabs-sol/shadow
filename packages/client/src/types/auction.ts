import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum AuctionType {
  SealedBid = 'SEALED_BID',
  Dutch = 'DUTCH',
  Batch = 'BATCH'
}

export enum AuctionStatus {
  Created = 'CREATED',
  Active = 'ACTIVE',
  Ended = 'ENDED',
  Settled = 'SETTLED',
  Cancelled = 'CANCELLED'
}

export interface Auction {
  id: string;
  auctionId: BN;
  creator: PublicKey;
  assetMint: PublicKey;
  type: AuctionType;
  status: AuctionStatus;
  startTime: Date;
  endTime: Date;
  minimumBid: BN;
  reservePrice?: BN;
  reservePriceEncrypted?: Uint8Array;
  currentPrice?: BN;
  priceDecreaseRate?: BN;
  bidCount: number;
  winner?: PublicKey;
  winningAmount?: BN;
  settledAt?: Date;
}

export interface CreateAuctionParams {
  type: AuctionType;
  assetMint: string;
  duration: number;
  minimumBid: number;
  reservePrice?: number;
  startingPrice?: number;
  priceDecreaseRate?: number;
}