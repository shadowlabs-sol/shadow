import { PublicKey } from '@solana/web3.js';
import { ValidationError } from '../errors';

export function validatePublicKey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export function validateAmount(amount: number): void {
  if (amount <= 0) {
    throw new ValidationError('Amount must be greater than 0');
  }
  if (!Number.isFinite(amount)) {
    throw new ValidationError('Amount must be a finite number');
  }
}

export function validateDuration(duration: number): void {
  if (duration <= 0) {
    throw new ValidationError('Duration must be greater than 0');
  }
  if (duration > 86400 * 30) { // 30 days max
    throw new ValidationError('Duration cannot exceed 30 days');
  }
}

export function validateAuctionType(type: string): void {
  const validTypes = ['SEALED', 'DUTCH', 'BATCH'];
  if (!validTypes.includes(type)) {
    throw new ValidationError(`Invalid auction type: ${type}`);
  }
}