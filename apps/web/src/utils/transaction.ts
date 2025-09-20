/**
 * Transaction utilities for Shadow Protocol
 */

/**
 * Check if a transaction hash is from a real blockchain transaction
 */
export function isRealTransaction(transactionHash: string | null | undefined): boolean {
  if (!transactionHash) return false;
  
  // Real Solana transaction signatures are base58 encoded and typically 87-88 characters long
  // Development transactions start with 'dev_'
  return (
    !transactionHash.startsWith('dev_') &&
    transactionHash.length >= 80 && // Minimum length for base58 signature
    transactionHash.length <= 90 && // Maximum reasonable length
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(transactionHash) // Valid base58 characters only
  );
}

/**
 * Get the appropriate Solscan URL for a transaction
 */
export function getSolscanUrl(transactionHash: string, cluster: 'mainnet' | 'devnet' = 'mainnet'): string {
  const clusterParam = cluster === 'mainnet' ? '' : '?cluster=devnet';
  return `https://solscan.io/tx/${transactionHash}${clusterParam}`;
}

/**
 * Get the appropriate Solscan URL for an account
 */
export function getSolscanAccountUrl(accountAddress: string, cluster: 'mainnet' | 'devnet' = 'mainnet'): string {
  const clusterParam = cluster === 'mainnet' ? '' : '?cluster=devnet';
  return `https://solscan.io/account/${accountAddress}${clusterParam}`;
}

/**
 * Get the appropriate Solscan URL for a token
 */
export function getSolscanTokenUrl(tokenAddress: string, cluster: 'mainnet' | 'devnet' = 'mainnet'): string {
  const clusterParam = cluster === 'mainnet' ? '' : '?cluster=devnet';
  return `https://solscan.io/token/${tokenAddress}${clusterParam}`;
}

/**
 * Format transaction hash for display
 */
export function formatTransactionHash(transactionHash: string, length: number = 12): string {
  if (transactionHash.length <= length * 2) {
    return transactionHash;
  }
  return `${transactionHash.slice(0, length)}...${transactionHash.slice(-length)}`;
}

/**
 * Get transaction status display info
 */
export function getTransactionDisplayInfo(transactionHash: string | null | undefined) {
  if (!transactionHash) {
    return {
      isReal: false,
      displayText: 'No transaction',
      showLink: false,
      className: 'text-gray-500',
    };
  }

  const isReal = isRealTransaction(transactionHash);
  
  if (isReal) {
    return {
      isReal: true,
      displayText: formatTransactionHash(transactionHash),
      showLink: true,
      className: 'text-gray-400 hover:text-blue-400',
      url: getSolscanUrl(transactionHash),
    };
  } else {
    return {
      isReal: false,
      displayText: formatTransactionHash(transactionHash),
      showLink: false,
      className: 'text-gray-400 opacity-60',
      badge: '(development)',
    };
  }
}

/**
 * Transaction types for better categorization
 */
export enum TransactionType {
  AUCTION_CREATION = 'auction_creation',
  BID_SUBMISSION = 'bid_submission',
  AUCTION_SETTLEMENT = 'auction_settlement',
  PAYMENT_TRANSFER = 'payment_transfer',
  REFUND_TRANSFER = 'refund_transfer',
}

/**
 * Generate a development transaction ID with proper context
 */
export function generateDevTransactionId(type: TransactionType, contextId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  return `dev_${type}_${contextId}_${timestamp}_${random}`;
}

/**
 * Validate Solana public key format
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Solana addresses are base58 encoded and typically 32-44 characters
    return (
      address.length >= 32 &&
      address.length <= 44 &&
      /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)
    );
  } catch {
    return false;
  }
}