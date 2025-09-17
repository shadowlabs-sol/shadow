import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionSignature,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { 
  AUCTION_SEED, 
  ASSET_VAULT_SEED, 
  PROTOCOL_SEED,
  COMP_DEF_OFFSET_SEALED_BID,
  COMP_DEF_OFFSET_DUTCH_AUCTION
} from '../utils/constants';
import { AuctionData, AuctionType, AuctionStatus, AuctionAccount, AuctionTypeEnum, AuctionStatusEnum, createTypedProgram, ShadowProtocolProgram } from '../types';

export class AuctionManager {
  private program: ShadowProtocolProgram;
  private connection: Connection;

  constructor(program: Program, connection: Connection) {
    this.program = createTypedProgram(program);
    this.connection = connection;
  }

  async createSealedAuction(params: {
    auctionId?: number;
    assetMint: string;
    duration: number;
    minimumBid: number;
    reservePriceEncrypted: number[];
    reserveNonce: bigint;
    encryptionPublicKey: number[];
  }): Promise<{
    signature: TransactionSignature;
    auctionId: number;
    auctionPubkey: PublicKey;
  }> {
    const auctionId = params.auctionId || Date.now();
    
    // Derive PDAs
    const [auctionPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(AUCTION_SEED), new BN(auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const [assetVaultPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(ASSET_VAULT_SEED), new BN(auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const [protocolStatePubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROTOCOL_SEED)],
      this.program.programId
    );

    try {
      const signature = await this.program.methods
        .createSealedAuction(
          new BN(auctionId),
          new PublicKey(params.assetMint),
          new BN(params.duration),
          new BN(params.minimumBid),
          params.reservePriceEncrypted as any,
          new BN(params.reserveNonce.toString())
        )
        .accounts({
          creator: this.program.provider.publicKey!,
          auction: auctionPubkey,
          protocolState: protocolStatePubkey,
          assetMint: new PublicKey(params.assetMint),
          assetVault: assetVaultPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        signature,
        auctionId,
        auctionPubkey
      };
    } catch (error) {
      console.error('Failed to create sealed auction:', error);
      throw error;
    }
  }

  async createDutchAuction(params: {
    auctionId?: number;
    assetMint: string;
    startingPrice: number;
    priceDecreaseRate: number;
    duration: number;
    reservePrice: number;
    reserveNonce: bigint;
    encryptionPublicKey: number[];
  }): Promise<{
    signature: TransactionSignature;
    auctionId: number;
    auctionPubkey: PublicKey;
  }> {
    const auctionId = params.auctionId || Date.now();
    
    const [auctionPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(AUCTION_SEED), new BN(auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const [assetVaultPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(ASSET_VAULT_SEED), new BN(auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const [protocolStatePubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROTOCOL_SEED)],
      this.program.programId
    );

    try {
      const signature = await this.program.methods
        .createDutchAuction(
          new BN(auctionId),
          new PublicKey(params.assetMint),
          new BN(params.startingPrice),
          new BN(params.priceDecreaseRate),
          new BN(params.duration),
          Array(32).fill(0), // Encrypted reserve price placeholder
          new BN(params.reserveNonce.toString())
        )
        .accounts({
          creator: this.program.provider.publicKey!,
          auction: auctionPubkey,
          protocolState: protocolStatePubkey,
          assetMint: new PublicKey(params.assetMint),
          assetVault: assetVaultPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        signature,
        auctionId,
        auctionPubkey
      };
    } catch (error) {
      console.error('Failed to create Dutch auction:', error);
      throw error;
    }
  }

  async settleAuction(auctionId: number): Promise<{
    signature: TransactionSignature;
    settlementResult?: any;
  }> {
    const [auctionPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(AUCTION_SEED), new BN(auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    try {
      const signature = await this.program.methods
        .settleAuction(
          new BN(auctionId),
          new BN(COMP_DEF_OFFSET_SEALED_BID)
        )
        .accounts({
          payer: this.program.provider.publicKey!,
          auction: auctionPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { signature };
    } catch (error) {
      console.error('Failed to settle auction:', error);
      throw error;
    }
  }

  async batchSettle(auctionIds: number[]): Promise<{
    signature: TransactionSignature;
    batchId: number;
  }> {
    const batchId = Date.now();
    
    try {
      const signature = await this.program.methods
        .batchSettle(
          auctionIds.map(id => new BN(id)),
          new BN(COMP_DEF_OFFSET_SEALED_BID)
        )
        .accounts({
          payer: this.program.provider.publicKey!,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { signature, batchId };
    } catch (error) {
      console.error('Failed to batch settle auctions:', error);
      throw error;
    }
  }

  async getAuction(auctionId: number): Promise<AuctionData | null> {
    const [auctionPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(AUCTION_SEED), new BN(auctionId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    try {
      const auctionAccount = await this.program.account.auctionAccount.fetch(auctionPubkey);
      
      return {
        auctionId: auctionAccount.auctionId.toNumber(),
        creator: auctionAccount.creator,
        assetMint: auctionAccount.assetMint,
        assetVault: auctionAccount.assetVault,
        auctionType: this.mapAuctionType(auctionAccount.auctionType),
        status: this.mapAuctionStatus(auctionAccount.status),
        startTime: auctionAccount.startTime.toNumber(),
        endTime: auctionAccount.endTime.toNumber(),
        minimumBid: auctionAccount.minimumBid.toNumber(),
        reservePriceEncrypted: new Uint8Array(auctionAccount.reservePriceEncrypted),
        reservePriceNonce: BigInt(auctionAccount.reservePriceNonce.toString()),
        currentPrice: auctionAccount.currentPrice.toNumber(),
        priceDecreaseRate: auctionAccount.priceDecreaseRate.toNumber(),
        bidCount: auctionAccount.bidCount.toNumber(),
        winner: auctionAccount.winner,
        winningAmount: auctionAccount.winningAmount.toNumber(),
        settledAt: auctionAccount.settledAt?.toNumber(),
      };
    } catch (error) {
      console.error('Failed to fetch auction:', error);
      return null;
    }
  }

  async getActiveAuctions(): Promise<AuctionData[]> {
    try {
      const auctions = await this.program.account.auctionAccount.all([
        {
          memcmp: {
            offset: 8 + 32 + 32 + 32 + 1, // Skip to status field
            bytes: Buffer.from([1]).toString('base64'), // Active status
          }
        }
      ]);

      return auctions.map(({ account }) => this.mapAuctionAccount(account));
    } catch (error) {
      console.error('Failed to fetch active auctions:', error);
      return [];
    }
  }

  async getAuctionsByType(type: AuctionType): Promise<AuctionData[]> {
    try {
      const typeValue = type === AuctionType.SealedBid ? 0 : 
                       type === AuctionType.Dutch ? 1 : 2;
      
      const auctions = await this.program.account.auctionAccount.all([
        {
          memcmp: {
            offset: 8 + 32 + 32 + 32, // Skip to type field
            bytes: Buffer.from([typeValue]).toString('base64'),
          }
        }
      ]);

      return auctions.map(({ account }) => this.mapAuctionAccount(account));
    } catch (error) {
      console.error('Failed to fetch auctions by type:', error);
      return [];
    }
  }

  async getAuctionsByStatus(status: AuctionStatus): Promise<AuctionData[]> {
    try {
      const statusValue = this.getStatusValue(status);
      
      const auctions = await this.program.account.auctionAccount.all([
        {
          memcmp: {
            offset: 8 + 32 + 32 + 32 + 1, // Skip to status field
            bytes: Buffer.from([statusValue]).toString('base64'),
          }
        }
      ]);

      return auctions.map(({ account }) => this.mapAuctionAccount(account));
    } catch (error) {
      console.error('Failed to fetch auctions by status:', error);
      return [];
    }
  }

  private mapAuctionAccount(account: AuctionAccount): AuctionData {
    return {
      auctionId: account.auctionId.toNumber(),
      creator: account.creator,
      assetMint: account.assetMint,
      assetVault: account.assetVault,
      auctionType: this.mapAuctionType(account.auctionType),
      status: this.mapAuctionStatus(account.status),
      startTime: account.startTime.toNumber(),
      endTime: account.endTime.toNumber(),
      minimumBid: account.minimumBid.toNumber(),
      reservePriceEncrypted: new Uint8Array(account.reservePriceEncrypted),
      reservePriceNonce: BigInt(account.reservePriceNonce.toString()),
      currentPrice: account.currentPrice.toNumber(),
      priceDecreaseRate: account.priceDecreaseRate.toNumber(),
      bidCount: account.bidCount.toNumber(),
      winner: account.winner,
      winningAmount: account.winningAmount.toNumber(),
      settledAt: account.settledAt?.toNumber(),
    };
  }

  private mapAuctionType(type: AuctionTypeEnum): AuctionType {
    if ('sealedBid' in type) return AuctionType.SealedBid;
    if ('dutch' in type) return AuctionType.Dutch;
    return AuctionType.Batch;
  }

  private mapAuctionStatus(status: AuctionStatusEnum): AuctionStatus {
    if ('created' in status) return AuctionStatus.Created;
    if ('active' in status) return AuctionStatus.Active;
    if ('ended' in status) return AuctionStatus.Ended;
    if ('settled' in status) return AuctionStatus.Settled;
    return AuctionStatus.Cancelled;
  }

  private getStatusValue(status: AuctionStatus): number {
    switch (status) {
      case AuctionStatus.Created: return 0;
      case AuctionStatus.Active: return 1;
      case AuctionStatus.Ended: return 2;
      case AuctionStatus.Settled: return 3;
      case AuctionStatus.Cancelled: return 4;
      default: return 0;
    }
  }
}