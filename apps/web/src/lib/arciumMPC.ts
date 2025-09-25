import { PublicKey, Connection, Transaction, TransactionInstruction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { RescueCipher, x25519 } from '@arcium-hq/client';

const ARCIUM_CONFIG = {
  clusterEndpoint: process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_ENDPOINT || 'https://testnet-api.arcium.com',
  mxeProgramId: new PublicKey(process.env.NEXT_PUBLIC_MXE_PROGRAM_ID || 'DWrCjVyfhysTNwQh96PzScBAiCvZ3hAKWYfyHWpQqee8'),
  computationGas: parseInt(process.env.NEXT_PUBLIC_ARCIUM_COMPUTATION_GAS || '1000000'),
  clusterOffset: parseInt(process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET || '2326510165'),
};

export interface EncryptedBid {
  bidder: string;
  encryptedAmount: Uint8Array;
  nonce: Uint8Array;
  publicKey: Uint8Array;
  timestamp: number;
  sharedSecret: Uint8Array;
}

export interface MPCResult {
  winner: string;
  winningAmount: number;
  rankings: Array<{
    bidder: string;
    rank: number;
  }>;
  computationProof: string;
  computationId: string;
  timestamp: number;
}

export interface MXECluster {
  publicKey: Uint8Array;
  address: PublicKey;
  endpoint: string;
}

export async function initializeMXECluster(connection: Connection): Promise<MXECluster> {
  try {
    const mxeAccount = await connection.getAccountInfo(ARCIUM_CONFIG.mxeProgramId);
    if (!mxeAccount || !mxeAccount.executable) {
      throw new Error('MXE program not found or not executable');
    }

    let mxePublicKey: Uint8Array;
    if (process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_PUBKEY) {
      mxePublicKey = new PublicKey(process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_PUBKEY).toBytes();
    } else {
      const mxeData = new Uint8Array(mxeAccount.data);
      mxePublicKey = mxeData.slice(8, 40);
    }
    
    return {
      publicKey: mxePublicKey,
      address: ARCIUM_CONFIG.mxeProgramId,
      endpoint: ARCIUM_CONFIG.clusterEndpoint
    };
  } catch (error) {
    console.error('Failed to initialize MXE cluster:', error);
    throw new Error(`MXE cluster initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function queueAuctionComputation(
  provider: AnchorProvider,
  program: Program,
  auctionId: string,
  encryptedBids: EncryptedBid[],
  encryptedReservePrice: Uint8Array,
  mxeCluster: MXECluster
): Promise<string> {
  const computationInstruction = await createComputationInstruction(
    program,
    auctionId,
    encryptedBids,
    encryptedReservePrice,
    mxeCluster
  );

  const transaction = new Transaction().add(computationInstruction);
  const signature = await provider.sendAndConfirm(transaction);
  return signature;
}

async function createComputationInstruction(
  program: Program,
  auctionId: string,
  encryptedBids: EncryptedBid[],
  encryptedReservePrice: Uint8Array,
  mxeCluster: MXECluster
): Promise<TransactionInstruction> {
  
  const computationData = {
    auctionId: parseInt(auctionId),
    bidsCount: encryptedBids.length,
    encryptedBids: encryptedBids.map(bid => ({
      bidder: new PublicKey(bid.bidder),
      encryptedAmount: Array.from(bid.encryptedAmount),
      nonce: Array.from(bid.nonce),
      publicKey: Array.from(bid.publicKey)
    })),
    encryptedReservePrice: Array.from(encryptedReservePrice),
    mxeCluster: mxeCluster.address,
    gasLimit: ARCIUM_CONFIG.computationGas
  };

  return await program.methods
    .queueComputation(computationData)
    .accounts({
      mxeProgram: ARCIUM_CONFIG.mxeProgramId,
    })
    .instruction();
}

export async function encryptBidForMXE(
  bidAmount: number,
  bidder: PublicKey,
  mxeCluster: MXECluster
): Promise<EncryptedBid> {
  const privateKey = new Uint8Array(32);
  crypto.getRandomValues(privateKey);
  const publicKey = x25519.getPublicKey(privateKey);
  const sharedSecret = x25519.getSharedSecret(privateKey, mxeCluster.publicKey);
  const cipher = new RescueCipher(sharedSecret);
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  
  const plaintext = [BigInt(Math.floor(bidAmount * 1e9))];
  const ciphertext = cipher.encrypt(plaintext, nonce);
  
  const encryptedAmount = new Uint8Array(32);
  if (ciphertext && ciphertext.length > 0) {
    const resultValue: any = ciphertext[0];
    let hexString = '';
    
    if (typeof resultValue === 'bigint') {
      hexString = resultValue.toString(16);
    } else if (typeof resultValue === 'number') {
      hexString = resultValue.toString(16);
    } else {
      hexString = '0';
    }
    
    const paddedHex = hexString.padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      const byteHex = paddedHex.substring(i * 2, i * 2 + 2);
      encryptedAmount[i] = parseInt(byteHex, 16);
    }
  }
  
  return {
    bidder: bidder.toString(),
    encryptedAmount,
    nonce,
    publicKey,
    timestamp: Date.now(),
    sharedSecret
  };
}

export async function encryptReservePriceForMXE(
  reservePrice: number,
  mxeCluster: MXECluster
): Promise<{ encryptedPrice: Uint8Array; nonce: Uint8Array; publicKey: Uint8Array }> {
  const privateKey = new Uint8Array(32);
  crypto.getRandomValues(privateKey);
  const publicKey = x25519.getPublicKey(privateKey);
  const sharedSecret = x25519.getSharedSecret(privateKey, mxeCluster.publicKey);
  const cipher = new RescueCipher(sharedSecret);
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  
  const plaintext = [BigInt(Math.floor(reservePrice * 1e9))];
  const ciphertext = cipher.encrypt(plaintext, nonce);
  
  const encryptedPrice = new Uint8Array(32);
  if (ciphertext && ciphertext.length > 0) {
    const resultValue: any = ciphertext[0];
    let hexString = '';
    
    if (typeof resultValue === 'bigint') {
      hexString = resultValue.toString(16);
    } else if (typeof resultValue === 'number') {
      hexString = resultValue.toString(16);
    } else {
      hexString = '0';
    }
    
    const paddedHex = hexString.padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      const byteHex = paddedHex.substring(i * 2, i * 2 + 2);
      encryptedPrice[i] = parseInt(byteHex, 16);
    }
  }
  
  return {
    encryptedPrice,
    nonce,
    publicKey
  };
}

export async function pollComputationResult(
  connection: Connection,
  computationSignature: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<MPCResult> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const status = await connection.getSignatureStatus(computationSignature);
    
    if (status.value?.confirmationStatus === 'finalized') {
      const transaction = await connection.getTransaction(computationSignature, {
        commitment: 'finalized',
        maxSupportedTransactionVersion: 0
      });
      
      if (transaction?.meta?.logMessages) {
        const result = parseComputationResult(transaction.meta.logMessages);
        if (result) {
          return result;
        }
      }
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Computation result polling timeout');
}

function parseComputationResult(logs: string[]): MPCResult | null {
  const resultLog = logs.find(log => log.includes('MPC_COMPUTATION_RESULT'));
  if (!resultLog) return null;
  
  const resultData = resultLog.split('MPC_COMPUTATION_RESULT:')[1];
  const parsed = JSON.parse(resultData);
  
  return {
    winner: parsed.winner,
    winningAmount: parsed.winningAmount,
    rankings: parsed.rankings || [],
    computationProof: parsed.proof,
    computationId: parsed.computationId,
    timestamp: Date.now()
  };
}

export async function verifyComputationProof(
  proof: string,
  computationId: string,
  _mxeCluster: MXECluster
): Promise<boolean> {
  const proofBytes = Buffer.from(proof, 'hex');
  const computationIdBytes = Buffer.from(computationId, 'hex');
  
  return proofBytes.length === 64 && computationIdBytes.length === 32;
}

export async function getComputationStatus(
  connection: Connection,
  computationSignature: string
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
}> {
  const status = await connection.getSignatureStatus(computationSignature);
  
  if (!status.value) {
    return {
      status: 'pending',
      progress: 0,
      message: 'Computation queued'
    };
  }
  
  if (status.value.err) {
    return {
      status: 'failed',
      progress: 0,
      message: 'Computation failed'
    };
  }
  
  switch (status.value.confirmationStatus) {
    case 'processed':
      return {
        status: 'processing',
        progress: 50,
        message: 'MPC computation in progress'
      };
    case 'confirmed':
      return {
        status: 'processing',
        progress: 75,
        message: 'Computation confirmed, finalizing...'
      };
    case 'finalized':
      return {
        status: 'completed',
        progress: 100,
        message: 'Computation completed'
      };
    default:
      return {
        status: 'pending',
        progress: 25,
        message: 'Processing transaction'
      };
  }
}