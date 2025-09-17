import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface Settlement {
  id: string;
  auctionId: BN;
  winner: PublicKey;
  winningAmount: BN;
  settlementTime: Date;
  transactionHash: string;
  callbackData?: Uint8Array;
}

export interface SettlementResult {
  auctionId: string;
  winner: string;
  winningAmount: string;
  metReserve?: boolean;
}