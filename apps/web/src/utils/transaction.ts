export function isValidTransactionSignature(signature: string | null | undefined): boolean {
  if (!signature) return false;
  
  return (
    signature.length >= 87 &&
    signature.length <= 88 &&
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(signature)
  );
}

export function getSolscanUrl(transactionHash: string, cluster: 'mainnet' | 'devnet' = 'devnet'): string {
  const clusterParam = cluster === 'mainnet' ? '' : '?cluster=devnet';
  return `https://solscan.io/tx/${transactionHash}${clusterParam}`;
}

export function getSolscanAccountUrl(accountAddress: string, cluster: 'mainnet' | 'devnet' = 'devnet'): string {
  const clusterParam = cluster === 'mainnet' ? '' : '?cluster=devnet';
  return `https://solscan.io/account/${accountAddress}${clusterParam}`;
}

export function getSolscanTokenUrl(tokenAddress: string, cluster: 'mainnet' | 'devnet' = 'devnet'): string {
  const clusterParam = cluster === 'mainnet' ? '' : '?cluster=devnet';
  return `https://solscan.io/token/${tokenAddress}${clusterParam}`;
}

export function formatTransactionSignature(signature: string, length: number = 12): string {
  if (signature.length <= length * 2) {
    return signature;
  }
  return `${signature.slice(0, length)}...${signature.slice(-length)}`;
}

export function getTransactionDisplayInfo(signature: string | null | undefined, cluster: 'mainnet' | 'devnet' = 'devnet') {
  if (!signature) {
    return {
      displayText: 'No transaction',
      showLink: false,
      className: 'text-gray-500',
    };
  }

  const isValid = isValidTransactionSignature(signature);
  
  if (isValid) {
    return {
      displayText: formatTransactionSignature(signature),
      showLink: true,
      className: 'text-gray-400 hover:text-blue-400 transition-colors cursor-pointer',
      url: getSolscanUrl(signature, cluster),
    };
  } else {
    return {
      displayText: signature.length > 24 ? formatTransactionSignature(signature) : signature,
      showLink: false,
      className: 'text-gray-400',
    };
  }
}

export enum TransactionType {
  AUCTION_CREATION = 'auction_creation',
  BID_SUBMISSION = 'bid_submission',
  AUCTION_SETTLEMENT = 'auction_settlement',
  PAYMENT_TRANSFER = 'payment_transfer',
  REFUND_TRANSFER = 'refund_transfer',
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    return (
      address.length >= 32 &&
      address.length <= 44 &&
      /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)
    );
  } catch {
    return false;
  }
}

export function formatSolanaAddress(address: string, length: number = 6): string {
  if (address.length <= length * 2) {
    return address;
  }
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function openExternalLink(url: string, description?: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function getClusterFromEnvironment(): 'mainnet' | 'devnet' {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || '';
  return rpcUrl.includes('mainnet') ? 'mainnet' : 'devnet';
}