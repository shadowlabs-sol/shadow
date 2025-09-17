import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionSignature,
  SystemProgram
} from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { 
  BID_SEED, 
  AUCTION_SEED,
  COMP_DEF_OFFSET_SEALED_BID
} from '../utils/constants';
import { BidData, BidAccount, createTypedProgram, ShadowProtocolProgram } from '../types';

export class BidManager {
  private program: ShadowProtocolProgram;
  private connection: Connection;

  constructor(program: Program, connection: Connection) {
    this.program = createTypedProgram(program);
    this.connection = connection;
  }

  /**
   * Submit an encrypted bid to a sealed auction
   */
  async submitEncryptedBid(params: {
    auctionId: number;
    bidAmountEncrypted: number[];
    nonce: bigint;
    publicKey: number[];
  }): Promise<{
    signature: TransactionSignature;
    bidPubkey: PublicKey;
    computationSignature?: TransactionSignature;
  }> {
    const bidId = Date.now();
    
    // Derive PDAs
    const [auctionPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(AUCTION_SEED), new BN(params.auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const [bidPubkey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(BID_SEED),
        new BN(params.auctionId).toArrayLike(Buffer, 'le', 8),
        this.program.provider.publicKey!!.toBuffer()
      ],
      this.program.programId
    );

    try {
      // Generate computation offset for Arcium
      const computationOffset = new BN(Math.floor(Math.random() * 1000000000));

      const signature = await this.program.methods
        .submitEncryptedBid(
          new BN(params.auctionId),
          params.bidAmountEncrypted as any,
          params.publicKey as any,
          new BN(params.nonce.toString()),
          computationOffset
        )
        .accounts({
          bidder: this.program.provider.publicKey!!,
          auction: auctionPubkey,
          bid: bidPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        signature,
        bidPubkey
      };
    } catch (error) {
      console.error('Failed to submit encrypted bid:', error);
      throw error;
    }
  }

  /**
   * Submit a bid to a Dutch auction
   */
  async submitDutchBid(params: {
    auctionId: number;
    bidAmount: number;
  }): Promise<{
    signature: TransactionSignature;
    accepted: boolean;
  }> {
    const [auctionPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(AUCTION_SEED), new BN(params.auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    try {
      const signature = await this.program.methods
        .submitDutchBid(
          new BN(params.auctionId),
          new BN(params.bidAmount)
        )
        .accounts({
          bidder: this.program.provider.publicKey!!,
          auction: auctionPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Check if bid was accepted (Dutch auction ends immediately if bid meets current price)
      const auctionAccount = await this.program.account.auctionAccount.fetch(auctionPubkey);
      const accepted = auctionAccount.winner?.equals(this.program.provider.publicKey!) || false;

      return {
        signature,
        accepted
      };
    } catch (error) {
      console.error('Failed to submit Dutch bid:', error);
      throw error;
    }
  }

  /**
   * Get all bids for an auction
   */
  async getAuctionBids(auctionId: number): Promise<BidData[]> {
    try {
      const bids = await this.program.account.bidAccount.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: new BN(auctionId).toArrayLike(Buffer, 'le', 8).toString('base64'),
          }
        }
      ]);

      return bids.map(({ account, publicKey }: { account: BidAccount; publicKey: import('@solana/web3.js').PublicKey }) => ({
        auctionId: account.auctionId.toNumber(),
        bidder: account.bidder,
        amountEncrypted: new Uint8Array(account.amountEncrypted),
        encryptionPublicKey: new Uint8Array(account.encryptionPublicKey),
        nonce: BigInt(account.nonce.toString()),
        timestamp: account.timestamp.toNumber(),
        isWinner: account.isWinner,
      }));
    } catch (error) {
      console.error('Failed to fetch auction bids:', error);
      return [];
    }
  }

  /**
   * Get user's bids across all auctions
   */
  async getUserBids(userPubkey: PublicKey): Promise<BidData[]> {
    try {
      const bids = await this.program.account.bidAccount.all([
        {
          memcmp: {
            offset: 8 + 8, // Skip discriminator and auction_id
            bytes: userPubkey.toBase58(),
          }
        }
      ]);

      return bids.map(({ account }: { account: BidAccount }) => ({
        auctionId: account.auctionId.toNumber(),
        bidder: account.bidder,
        amountEncrypted: new Uint8Array(account.amountEncrypted),
        encryptionPublicKey: new Uint8Array(account.encryptionPublicKey),
        nonce: BigInt(account.nonce.toString()),
        timestamp: account.timestamp.toNumber(),
        isWinner: account.isWinner,
      }));
    } catch (error) {
      console.error('Failed to fetch user bids:', error);
      return [];
    }
  }

  /**
   * Cancel a bid (if auction allows)
   */
  async cancelBid(auctionId: number): Promise<TransactionSignature> {
    const [auctionPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(AUCTION_SEED), new BN(auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const [bidPubkey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(BID_SEED),
        new BN(auctionId).toArrayLike(Buffer, 'le', 8),
        this.program.provider.publicKey!!.toBuffer()
      ],
      this.program.programId
    );

    try {
      const signature = await this.program.methods
        .cancelBid(new BN(auctionId))
        .accounts({
          bidder: this.program.provider.publicKey!!,
          auction: auctionPubkey,
          bid: bidPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return signature;
    } catch (error) {
      console.error('Failed to cancel bid:', error);
      throw error;
    }
  }

  /**
   * Verify bid encryption matches expected values
   */
  async verifyBidIntegrity(
    bidPubkey: PublicKey,
    expectedAuctionId: number
  ): Promise<boolean> {
    try {
      const bidAccount = await this.program.account.bidAccount.fetch(bidPubkey);
      
      // Verify auction ID matches
      if (bidAccount.auctionId.toNumber() !== expectedAuctionId) {
        return false;
      }

      // Verify bidder matches
      if (!bidAccount.bidder.equals(this.program.provider.publicKey!)) {
        return false;
      }

      // Additional verification logic can be added here
      return true;
    } catch (error) {
      console.error('Failed to verify bid integrity:', error);
      return false;
    }
  }
}