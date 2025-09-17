import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface Bid {
  id: string;
  auctionId: BN;
  bidder: PublicKey;
  amount: BN;
  encryptedAmount?: Uint8Array;
  timestamp: Date;
  isWinner: boolean;
  transactionHash: string;
}

export interface SubmitBidParams {
  auctionId: string;
  amount: number;
}