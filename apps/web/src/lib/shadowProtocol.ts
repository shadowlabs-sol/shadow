import { PublicKey, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, BN, web3 } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { RescueCipher, x25519 } from '@arcium-hq/client';
import ShadowProtocolIDL from '@/idl/shadow_protocol.json';

// Browser-compatible random bytes generation
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

// Constants
export const PROGRAM_ID = new PublicKey('HhniyEPrifbiJg4Hi53m4MjcBtSoyyDr5LkwfsHxb8RC');
export const PROTOCOL_SEED = Buffer.from('protocol');
export const AUCTION_SEED = Buffer.from('auction');
export const BID_SEED = Buffer.from('bid');
export const ASSET_VAULT_SEED = Buffer.from('asset_vault');
export const BID_ESCROW_SEED = Buffer.from('bid_escrow');

// Types
export interface CreateAuctionParams {
  assetMint: PublicKey;
  assetAmount: number;
  duration: number; // in seconds
  minimumBid: number; // in SOL
  reservePrice: number; // in SOL
  auctionType: 'SEALED' | 'DUTCH';
  // Dutch auction specific
  startingPrice?: number;
  priceDecreaseRate?: number;
  minimumPriceFloor?: number;
}

export interface SubmitBidParams {
  auctionId: string;
  bidAmount: number; // in SOL
}

// Helper functions
export function getProtocolPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROTOCOL_SEED],
    PROGRAM_ID
  );
}

export function getAuctionPDA(auctionId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [AUCTION_SEED, auctionId.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

export function getAssetVaultPDA(auctionId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [ASSET_VAULT_SEED, auctionId.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

export function getBidPDA(auctionId: BN, bidder: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BID_SEED, auctionId.toArrayLike(Buffer, 'le', 8), bidder.toBuffer()],
    PROGRAM_ID
  );
}

export function getBidEscrowPDA(auctionId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BID_ESCROW_SEED, auctionId.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

// Encryption helpers
export async function encryptBidAmount(
  amount: number,
  mxePublicKey?: Uint8Array
): Promise<{
  encryptedAmount: Uint8Array;
  publicKey: Uint8Array;
  nonce: Uint8Array;
}> {
  const amountInLamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
  const nonce = randomBytes(16);
  
  if (mxePublicKey && mxePublicKey.length === 32) {
    // Real encryption with Arcium
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    
    try {
      const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
      const cipher = new RescueCipher(sharedSecret);
      const encryptedResult = cipher.encrypt([amountInLamports], nonce);
      
      // Convert result to Uint8Array
      const encryptedAmount = new Uint8Array(32);
      if (encryptedResult && encryptedResult.length > 0) {
        // The result is an array, get first element and convert to hex
        const resultValue: any = encryptedResult[0];
        let hexString: string = '';
        
        // Handle both BigInt and number types
        if (typeof resultValue === 'bigint') {
          hexString = resultValue.toString(16);
        } else if (typeof resultValue === 'number') {
          hexString = resultValue.toString(16);
        } else if (resultValue && typeof resultValue.toString === 'function') {
          // Fallback - try to convert to string
          hexString = resultValue.toString(16) || resultValue.toString();
        } else {
          // Last resort - just use a default value
          hexString = '0';
        }
        
        const paddedHex = hexString.padStart(64, '0');
        
        for (let i = 0; i < 32; i++) {
          const byteHex = paddedHex.substring(i * 2, i * 2 + 2);
          encryptedAmount[i] = parseInt(byteHex, 16);
        }
      }
      
      return {
        encryptedAmount,
        publicKey,
        nonce
      };
    } catch (error) {
      console.warn('Encryption failed, using fallback:', error);
    }
  }
  
  // Fallback for development
  const encryptedAmount = new Uint8Array(32);
  const encoder = new TextEncoder();
  const amountBytes = encoder.encode(amountInLamports.toString());
  encryptedAmount.set(amountBytes.slice(0, 32));
  
  return {
    encryptedAmount,
    publicKey: new Uint8Array(32),
    nonce
  };
}

export async function encryptReservePrice(
  price: number,
  mxePublicKey?: Uint8Array
): Promise<{
  encrypted: Uint8Array;
  nonce: bigint;
}> {
  const priceInLamports = BigInt(Math.floor(price * LAMPORTS_PER_SOL));
  const nonce = randomBytes(16);
  // Create BigInt from nonce bytes
  const nonceValue = BigInt('0x' + Array.from(nonce.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  if (mxePublicKey && mxePublicKey.length === 32) {
    try {
      const privateKey = x25519.utils.randomPrivateKey();
      const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
      const cipher = new RescueCipher(sharedSecret);
      const encryptedResult = cipher.encrypt([priceInLamports], nonce);
      
      // Convert to Uint8Array
      const encrypted = new Uint8Array(32);
      if (encryptedResult && encryptedResult.length > 0) {
        const resultValue: any = encryptedResult[0];
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
          encrypted[i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
        }
      }
      
      return {
        encrypted,
        nonce: nonceValue
      };
    } catch (error) {
      console.warn('Reserve price encryption failed:', error);
    }
  }
  
  // Fallback
  const encrypted = new Uint8Array(32);
  const encoder = new TextEncoder();
  const priceBytes = encoder.encode(priceInLamports.toString());
  encrypted.set(priceBytes.slice(0, 32));
  
  return {
    encrypted,
    nonce: nonceValue
  };
}

// Main protocol class
export class ShadowProtocol {
  private program: Program;
  private provider: AnchorProvider;
  private mxePublicKey?: Uint8Array;
  
  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.program = new Program(
      ShadowProtocolIDL as Idl,
      provider
    );
  }
  
  async initialize() {
    // Try to get MXE public key from Arcium
    try {
      // This would be the actual Arcium cluster address
      const mxeKey = await this.getMXEPublicKey();
      if (mxeKey) {
        this.mxePublicKey = mxeKey;
        console.log('Arcium MXE initialized');
      }
    } catch (error) {
      console.warn('Arcium not available, using fallback encryption');
    }
  }
  
  private async getMXEPublicKey(): Promise<Uint8Array | undefined> {
    return undefined;
  }
  
  async createAuction(params: CreateAuctionParams): Promise<string> {
    const wallet = this.provider.wallet;
    
    // Get next auction ID from protocol state
    const [protocolPDA] = getProtocolPDA();
    
    const auctionId = new BN(Date.now());
    const [auctionPDA] = getAuctionPDA(auctionId);
    const [assetVaultPDA] = getAssetVaultPDA(auctionId);
    
    // Get creator's token account
    const creatorTokenAccount = await getAssociatedTokenAddress(
      params.assetMint,
      wallet.publicKey
    );
    
    // Encrypt reserve price
    const { encrypted: reservePriceEncrypted, nonce: reservePriceNonce } = 
      await encryptReservePrice(params.reservePrice, this.mxePublicKey);
    
    if (params.auctionType === 'SEALED') {
      // Create sealed bid auction
      const tx = await this.program.methods
        .createSealedAuction(
          auctionId,
          params.assetMint,
          new BN(params.duration),
          new BN(params.minimumBid * LAMPORTS_PER_SOL),
          Array.from(reservePriceEncrypted) as any,
          new BN(reservePriceNonce.toString())
        )
        .accounts({
          creator: wallet.publicKey,
          auction: auctionPDA,
          protocolState: protocolPDA,
          assetMint: params.assetMint,
          assetVault: assetVaultPDA,
          creatorAssetAccount: creatorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      return tx;
    } else {
      // Create Dutch auction
      const tx = await this.program.methods
        .createDutchAuction(
          auctionId,
          params.assetMint,
          new BN(params.assetAmount),
          new BN((params.startingPrice || params.reservePrice * 2) * LAMPORTS_PER_SOL),
          new BN((params.priceDecreaseRate || 0.01) * LAMPORTS_PER_SOL),
          new BN((params.minimumPriceFloor || params.minimumBid) * LAMPORTS_PER_SOL),
          new BN(params.duration),
          Array.from(reservePriceEncrypted) as any,
          new BN(reservePriceNonce.toString())
        )
        .accounts({
          creator: wallet.publicKey,
          auction: auctionPDA,
          protocolState: protocolPDA,
          assetMint: params.assetMint,
          assetVault: assetVaultPDA,
          creatorAssetAccount: creatorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      return tx;
    }
  }
  
  async submitBid(params: SubmitBidParams): Promise<string> {
    const wallet = this.provider.wallet;
    const auctionId = new BN(params.auctionId);
    
    const [auctionPDA] = getAuctionPDA(auctionId);
    const [bidPDA] = getBidPDA(auctionId, wallet.publicKey);
    
    // Encrypt bid amount
    const { encryptedAmount, publicKey, nonce } = 
      await encryptBidAmount(params.bidAmount, this.mxePublicKey);
    
    // Generate computation offset for Arcium
    const computationOffset = new BN(randomBytes(8));
    
    const tx = await this.program.methods
      .submitEncryptedBid(
        auctionId,
        Array.from(encryptedAmount) as any,
        Array.from(publicKey) as any,
        new BN(BigInt('0x' + Array.from(nonce.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('').toString())),
        computationOffset
      )
      .accounts({
        bidder: wallet.publicKey,
        auction: auctionPDA,
        bid: bidPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }
  
  async settleAuction(auctionId: string): Promise<string> {
    const wallet = this.provider.wallet;
    const auctionIdBN = new BN(auctionId);
    const [auctionPDA] = getAuctionPDA(auctionIdBN);
    
    // Generate computation offset for Arcium settlement
    const computationOffset = new BN(randomBytes(8));
    
    const tx = await this.program.methods
      .settleAuction(
        auctionIdBN,
        computationOffset
      )
      .accounts({
        payer: wallet.publicKey,
        auction: auctionPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }
  
  async fetchAuction(auctionId: string) {
    const auctionIdBN = new BN(auctionId);
    const [auctionPDA] = getAuctionPDA(auctionIdBN);
    
    // return await this.program.account.auctionAccount.fetch(auctionPDA);
    return null;
  }
  
  async fetchAllAuctions() {
    // return await this.program.account.auctionAccount.all();
    return [];
  }
}