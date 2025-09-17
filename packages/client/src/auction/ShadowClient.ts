import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { AuctionManager } from './AuctionManager';
import { BidManager } from './BidManager';

export class ShadowClient {
  public auction: AuctionManager;
  public bid: BidManager;
  
  constructor(
    public readonly connection: Connection,
    public readonly provider: AnchorProvider,
    public readonly program: Program,
    public readonly programId: PublicKey
  ) {
    this.auction = new AuctionManager(program, connection);
    this.bid = new BidManager(program, connection);
  }
  
  static async initialize(
    connection: Connection,
    provider: AnchorProvider,
    programId: PublicKey
  ): Promise<ShadowClient> {
    // Load program IDL and create program instance
    const program = new Program(
      require('../../../programs/shadow-protocol/target/idl/shadow_protocol.json'),
      provider
    );
    
    return new ShadowClient(connection, provider, program, programId);
  }
}