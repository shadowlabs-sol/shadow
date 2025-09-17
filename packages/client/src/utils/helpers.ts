import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export function toBN(value: number | string | bigint): BN {
  return new BN(value.toString());
}

export function fromBN(value: BN): bigint {
  return BigInt(value.toString());
}

export function toPublicKey(value: string | PublicKey): PublicKey {
  if (typeof value === 'string') {
    return new PublicKey(value);
  }
  return value;
}

export function generateNonce(): Uint8Array {
  const nonce = new Uint8Array(32);
  crypto.getRandomValues(nonce);
  return nonce;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}