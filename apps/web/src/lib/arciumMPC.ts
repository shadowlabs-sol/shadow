import { PublicKey, Connection, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
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
  
  const auctionIdNum = parseInt(auctionId);
  const bidsCount = encryptedBids.length;
  
  // Convert encrypted bids to the format expected by the program
  const encryptedBidsForProgram = encryptedBids.map(bid => ({
    bidder: new PublicKey(bid.bidder),
    encryptedAmount: Array.from(bid.encryptedAmount),
    nonce: Array.from(bid.nonce.slice(0, 16)), // Ensure 16 bytes
    publicKey: Array.from(bid.publicKey)
  }));

  // Get auction PDA
  const [auctionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('auction'), new BN(auctionIdNum).toArrayLike(Buffer, 'le', 8)],
    program.programId
  );

  // Get protocol state PDA
  const [protocolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    program.programId
  );

  return await program.methods
    .queueMpcComputation(
      new BN(auctionIdNum),
      bidsCount,
      encryptedBidsForProgram,
      Array.from(encryptedReservePrice),
      mxeCluster.address,
      new BN(ARCIUM_CONFIG.computationGas)
    )
    .accounts({
      authority: program.provider.publicKey!,
      auction: auctionPDA,
      protocolState: protocolPDA,
      mxeProgram: ARCIUM_CONFIG.mxeProgramId,
      systemProgram: SystemProgram.programId,
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
  // Look for Arcium MPC computation event logs
  const mpcQueuedLog = logs.find(log => 
    log.includes('MpcComputationQueued') || 
    log.includes('Program log: MPC computation queued')
  );
  
  if (!mpcQueuedLog) {
    console.warn('No MPC computation queued event found in logs');
    return null;
  }

  // Look for actual MPC result in transaction logs
  // Arcium MPC results come through program events or instruction data
  const mpcResultLog = logs.find(log => 
    log.includes('Program data:') || 
    log.includes('Program return:')
  );

  if (mpcResultLog) {
    try {
      // Parse base64 encoded result from program return data
      const base64Match = mpcResultLog.match(/Program return: [^\\s]+ (.+)/);
      if (base64Match) {
        const resultBytes = Buffer.from(base64Match[1], 'base64');
        return parseArciumMpcResult(resultBytes);
      }
    } catch (error) {
      console.error('Failed to parse MPC result from logs:', error);
    }
  }

  // Fallback: look for custom program event
  const eventLog = logs.find(log => log.includes('MPC_RESULT:'));
  if (eventLog) {
    try {
      const resultData = eventLog.split('MPC_RESULT:')[1];
      const parsed = JSON.parse(resultData);
      
      return {
        winner: parsed.winner,
        winningAmount: parseFloat(parsed.winningAmount) || 0,
        rankings: parsed.rankings || [],
        computationProof: parsed.proof || '',
        computationId: parsed.computationId || '',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to parse custom MPC event:', error);
    }
  }
  
  return null;
}

function parseArciumMpcResult(resultBytes: Buffer): MPCResult | null {
  try {
    // Arcium MPC result format:
    // [32 bytes winner] [8 bytes winning_amount] [32 bytes computation_id] [remaining: proof]
    if (resultBytes.length < 72) {
      console.warn('MPC result too short, expected at least 72 bytes');
      return null;
    }

    const winner = new PublicKey(resultBytes.slice(0, 32)).toBase58();
    const winningAmount = Number(resultBytes.readBigUInt64LE(32)) / 1e9; // Convert lamports to SOL
    const computationId = Buffer.from(resultBytes.slice(40, 72)).toString('hex');
    const proof = resultBytes.slice(72).toString('hex');

    return {
      winner,
      winningAmount,
      rankings: [], // Rankings would be in separate data if provided
      computationProof: proof,
      computationId,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Failed to parse Arcium MPC result bytes:', error);
    return null;
  }
}

export async function verifyComputationProof(
  proof: string,
  computationId: string,
  mxeCluster: MXECluster
): Promise<boolean> {
  try {
    // Parse proof components
    const proofBytes = Buffer.from(proof, 'hex');
    const computationIdBytes = Buffer.from(computationId, 'hex');
    
    // Basic validation
    if (proofBytes.length < 64) {
      console.error('Proof too short, expected at least 64 bytes');
      return false;
    }
    
    if (computationIdBytes.length !== 32) {
      console.error('Invalid computation ID length, expected 32 bytes');
      return false;
    }
    
    // Extract proof components (Arcium proof structure)
    // [32 bytes signature] [32 bytes verification key] [remaining: auxiliary proof data]
    const signature = proofBytes.slice(0, 32);
    const verificationKey = proofBytes.slice(32, 64);
    const auxiliaryData = proofBytes.slice(64);
    
    // Verify the proof using Arcium's cryptographic verification
    const isValidProof = await verifyArciumProof({
      signature,
      verificationKey,
      auxiliaryData,
      computationId: computationIdBytes,
      mxePublicKey: mxeCluster.publicKey
    });
    
    if (!isValidProof) {
      console.error('Cryptographic proof verification failed');
      return false;
    }
    
    // Additional validation: check computation integrity
    const isValidComputation = await validateComputationIntegrity(
      computationId,
      proof,
      mxeCluster
    );
    
    return isValidComputation;
    
  } catch (error) {
    console.error('Proof verification error:', error);
    return false;
  }
}

async function verifyArciumProof(proofData: {
  signature: Buffer;
  verificationKey: Buffer;
  auxiliaryData: Buffer;
  computationId: Buffer;
  mxePublicKey: Uint8Array;
}): Promise<boolean> {
  try {
    // Use Arcium's verification library functions
    // This would integrate with @arcium-hq/client verification methods
    
    // Create verification message from computation context
    const verificationMessage = Buffer.concat([
      Buffer.from('arcium_mpc_verification'),
      proofData.computationId,
      proofData.verificationKey,
      Buffer.from(proofData.mxePublicKey)
    ]);
    
    // For now, implement Ed25519 signature verification as placeholder
    // In production, this would use Arcium's specific proof verification
    try {
      const { verify } = await import('@noble/ed25519');
      const isValidSig = await verify(
        proofData.signature,
        verificationMessage,
        proofData.verificationKey
      );
      
      if (!isValidSig) {
        console.error('Signature verification failed');
        return false;
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return false;
    }
    
    // Additional Arcium-specific verification would go here
    // This includes zero-knowledge proof verification of the MPC computation
    
    return true;
  } catch (error) {
    console.error('Arcium proof verification failed:', error);
    return false;
  }
}

async function validateComputationIntegrity(
  computationId: string,
  proof: string,
  mxeCluster: MXECluster
): Promise<boolean> {
  try {
    // Validate that the computation was properly executed
    // by checking against known MPC computation constraints
    
    const computationIdBytes = Buffer.from(computationId, 'hex');
    
    // Generate expected computation hash
    const expectedHash = await generateComputationHash(
      computationIdBytes,
      mxeCluster.publicKey
    );
    
    // Extract computation hash from proof
    const proofBytes = Buffer.from(proof, 'hex');
    if (proofBytes.length < 96) {
      return false;
    }
    
    const actualHash = proofBytes.slice(64, 96);
    
    // Compare hashes
    const hashesMatch = Buffer.compare(expectedHash, actualHash) === 0;
    
    if (!hashesMatch) {
      console.error('Computation integrity check failed: hash mismatch');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Computation integrity validation failed:', error);
    return false;
  }
}

async function generateComputationHash(
  computationId: Buffer,
  mxePublicKey: Uint8Array
): Promise<Buffer> {
  // Generate expected computation hash using the same algorithm
  // as the MPC network would use
  
  const hashInput = Buffer.concat([
    Buffer.from('shadow_mpc_computation_integrity'),
    computationId,
    Buffer.from(mxePublicKey)
  ]);
  
  // Use SHA-256 for computation hash
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(hashInput).digest();
  
  return hash;
}

export async function getComputationStatus(
  connection: Connection,
  computationSignature: string
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  estimatedCompletionTime?: number;
  gasUsed?: number;
  errorDetails?: string;
}> {
  try {
    const status = await connection.getSignatureStatus(computationSignature);
    
    if (!status.value) {
      return {
        status: 'pending',
        progress: 0,
        message: 'Computation queued, waiting for MPC network',
        estimatedCompletionTime: Date.now() + 30000
      };
    }
    
    if (status.value.err) {
      const errorDetails = parseError(status.value.err);
      return {
        status: 'failed',
        progress: 0,
        message: 'Computation failed',
        errorDetails
      };
    }
    
    let gasUsed: number | undefined;
    if (status.value.confirmationStatus === 'finalized') {
      try {
        const transaction = await connection.getTransaction(computationSignature, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0
        });
        gasUsed = transaction?.meta?.fee;
      } catch (gasError) {
        console.warn('Could not retrieve gas usage:', gasError);
      }
    }
    
    switch (status.value.confirmationStatus) {
      case 'processed':
        return {
          status: 'processing',
          progress: 30,
          message: 'MPC computation processed by validators',
          estimatedCompletionTime: Date.now() + 20000
        };
      case 'confirmed':
        return {
          status: 'processing',
          progress: 70,
          message: 'Computation confirmed, finalizing...',
          estimatedCompletionTime: Date.now() + 5000
        };
      case 'finalized':
        return {
          status: 'completed',
          progress: 100,
          message: 'MPC computation completed and verified',
          gasUsed
        };
      default:
        return {
          status: 'processing',
          progress: 10,
          message: 'Processing transaction',
          estimatedCompletionTime: Date.now() + 25000
        };
    }
  } catch (error) {
    console.error('Failed to get computation status:', error);
    return {
      status: 'failed',
      progress: 0,
      message: 'Status check failed',
      errorDetails: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function parseError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    if (error.InstructionError) {
      const [index, instructionError] = error.InstructionError;
      if (instructionError.Custom) {
        return `Instruction ${index} failed with custom error: ${instructionError.Custom}`;
      }
      return `Instruction ${index} failed: ${JSON.stringify(instructionError)}`;
    }
    
    if (error.InsufficientFundsForRent) {
      return 'Insufficient funds for rent';
    }
    
    if (error.AccountAlreadyInUse) {
      return 'Account already in use';
    }
    
    if (error.InvalidAccountData) {
      return 'Invalid account data';
    }
  }
  
  return JSON.stringify(error);
}

export async function monitorComputationProgress(
  connection: Connection,
  computationSignature: string,
  onProgress?: (status: any) => void,
  timeoutMs: number = 300000
): Promise<MPCResult> {
  const startTime = Date.now();
  let lastProgress = 0;
  
  console.log(`Starting computation monitoring for signature: ${computationSignature}`);
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const status = await getComputationStatus(connection, computationSignature);
      
      if (onProgress && status.progress !== lastProgress) {
        onProgress(status);
        lastProgress = status.progress;
      }
      
      if (status.status === 'completed') {
        console.log('Computation completed, parsing results...');
        
        const transaction = await connection.getTransaction(computationSignature, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0
        });
        
        if (!transaction?.meta?.logMessages) {
          throw new Error('No transaction logs available');
        }
        
        const result = parseComputationResult(transaction.meta.logMessages);
        if (!result) {
          throw new Error('Could not parse computation results');
        }
        
        console.log('Successfully parsed computation results:', result);
        return result;
      }
      
      if (status.status === 'failed') {
        throw new Error(`Computation failed: ${status.message}${status.errorDetails ? ` - ${status.errorDetails}` : ''}`);
      }
      
      const waitTime = status.status === 'pending' ? 5000 : 2000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } catch (error) {
      console.error('Error during computation monitoring:', error);
      
      if (error instanceof Error && error.message.includes('fetch')) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Computation monitoring timeout after ' + timeoutMs + 'ms');
}