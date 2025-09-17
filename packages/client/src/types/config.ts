export interface ShadowProtocolConfig {
  rpcUrl: string;
  programId?: string;
  clusterOffset?: number;
  callbackUrl?: string;
  commitment?: import('@solana/web3.js').Commitment;
  wallet?: import('@coral-xyz/anchor').Wallet;
  arciumClusterPubkey?: string;
  mxePublicKey?: Uint8Array;
}

export interface MXEConfig {
  publicKey: Uint8Array;
  clusterOffset: number;
}