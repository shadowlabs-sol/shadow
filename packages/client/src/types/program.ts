import { Program, Idl } from '@coral-xyz/anchor';
import { AuctionAccount, BidAccount } from './accounts';

// Extend the program type to include our account types
export interface ShadowProtocolProgram extends Program {
  account: {
    auctionAccount: {
      fetch: (address: import('@solana/web3.js').PublicKey) => Promise<AuctionAccount>;
      all: (filters?: any[]) => Promise<Array<{
        account: AuctionAccount;
        publicKey: import('@solana/web3.js').PublicKey;
      }>>;
    };
    bidAccount: {
      fetch: (address: import('@solana/web3.js').PublicKey) => Promise<BidAccount>;
      all: (filters?: any[]) => Promise<Array<{
        account: BidAccount;
        publicKey: import('@solana/web3.js').PublicKey;
      }>>;
    };
  };
}

// Type-safe wrapper for casting a Program to ShadowProtocolProgram
export function createTypedProgram(program: Program): ShadowProtocolProgram {
  return program as ShadowProtocolProgram;
}