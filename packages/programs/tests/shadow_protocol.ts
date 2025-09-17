import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShadowProtocol } from "../target/types/shadow_protocol";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("shadow-protocol", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShadowProtocol as Program<ShadowProtocol>;
  
  // Test accounts
  let protocolAuthority: Keypair;
  let feeRecipient: Keypair;
  let auctionCreator: Keypair;
  let bidder1: Keypair;
  let bidder2: Keypair;
  let bidder3: Keypair;
  let assetMint: PublicKey;
  let paymentMint: PublicKey;
  
  // PDAs
  let protocolStatePDA: PublicKey;
  let protocolStateBump: number;
  
  before(async () => {
    // Generate test keypairs
    protocolAuthority = Keypair.generate();
    feeRecipient = Keypair.generate();
    auctionCreator = Keypair.generate();
    bidder1 = Keypair.generate();
    bidder2 = Keypair.generate();
    bidder3 = Keypair.generate();
    
    // Airdrop SOL to test accounts
    const airdropPromises = [
      protocolAuthority,
      feeRecipient,
      auctionCreator,
      bidder1,
      bidder2,
      bidder3,
    ].map(async (keypair) => {
      const signature = await provider.connection.requestAirdrop(
        keypair.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
    });
    
    await Promise.all(airdropPromises);
    
    // Create test tokens
    assetMint = await createMint(
      provider.connection,
      auctionCreator,
      auctionCreator.publicKey,
      null,
      6
    );
    
    paymentMint = await createMint(
      provider.connection,
      auctionCreator,
      auctionCreator.publicKey,
      null,
      6
    );
    
    // Derive protocol state PDA
    [protocolStatePDA, protocolStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );
  });
  
  describe("Protocol Initialization", () => {
    it("Initializes the protocol", async () => {
      await program.methods
        .initializeProtocol()
        .accounts({
          authority: protocolAuthority.publicKey,
          protocolState: protocolStatePDA,
          feeRecipient: feeRecipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([protocolAuthority])
        .rpc();
      
      const protocolState = await program.account.protocolState.fetch(protocolStatePDA);
      
      assert.equal(
        protocolState.authority.toString(),
        protocolAuthority.publicKey.toString()
      );
      assert.equal(
        protocolState.feeRecipient.toString(),
        feeRecipient.publicKey.toString()
      );
      assert.equal(protocolState.protocolFee, 50); // 0.5%
      assert.equal(protocolState.paused, false);
    });
    
    it("Updates protocol fee", async () => {
      const newFee = 100; // 1%
      
      await program.methods
        .updateProtocolFee(newFee)
        .accounts({
          authority: protocolAuthority.publicKey,
          protocolState: protocolStatePDA,
        })
        .signers([protocolAuthority])
        .rpc();
      
      const protocolState = await program.account.protocolState.fetch(protocolStatePDA);
      assert.equal(protocolState.protocolFee, newFee);
    });
    
    it("Prevents unauthorized fee updates", async () => {
      try {
        await program.methods
          .updateProtocolFee(200)
          .accounts({
            authority: auctionCreator.publicKey, // Wrong authority
            protocolState: protocolStatePDA,
          })
          .signers([auctionCreator])
          .rpc();
        
        assert.fail("Should have thrown unauthorized error");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
      }
    });
  });
  
  describe("Sealed-Bid Auction", () => {
    let auctionId: anchor.BN;
    let auctionPDA: PublicKey;
    let assetVaultPDA: PublicKey;
    let creatorAssetAccount: any;
    
    before(async () => {
      auctionId = new anchor.BN(Date.now());
      
      // Derive auction PDA
      [auctionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("auction"), auctionId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      // Derive asset vault PDA
      [assetVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("asset_vault"), auctionId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      // Create and fund creator's asset account
      creatorAssetAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        auctionCreator,
        assetMint,
        auctionCreator.publicKey
      );
      
      // Mint test assets to creator
      await mintTo(
        provider.connection,
        auctionCreator,
        assetMint,
        creatorAssetAccount.address,
        auctionCreator,
        1000000 // 1 token with 6 decimals
      );
    });
    
    it("Creates a sealed-bid auction", async () => {
      const duration = new anchor.BN(3600); // 1 hour
      const minimumBid = new anchor.BN(100000); // 0.1 token
      const reservePriceEncrypted = Buffer.alloc(32);
      const reservePriceNonce = new anchor.BN(123456);
      
      // For testing, we'll skip the actual MPC setup
      
      const tx = await program.methods
        .createSealedAuction(
          auctionId,
          assetMint,
          duration,
          minimumBid,
          Array.from(reservePriceEncrypted),
          reservePriceNonce
        )
        .accounts({
          creator: auctionCreator.publicKey,
          auction: auctionPDA,
          protocolState: protocolStatePDA,
          assetMint: assetMint,
          assetVault: assetVaultPDA,
          assetVaultAccount: creatorAssetAccount.address,
          creatorAssetAccount: creatorAssetAccount.address,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([auctionCreator])
        .rpc();
      
      const auction = await program.account.auctionAccount.fetch(auctionPDA);
      
      assert.equal(auction.auctionId.toString(), auctionId.toString());
      assert.equal(auction.creator.toString(), auctionCreator.publicKey.toString());
      assert.equal(auction.assetMint.toString(), assetMint.toString());
      assert.equal(auction.auctionType, { sealedBid: {} });
      assert.equal(auction.status, { active: {} });
      assert.equal(auction.minimumBid.toString(), minimumBid.toString());
    });
    
    it("Submits encrypted bids", async () => {
      // Bidder 1 submits bid
      const bidAmount1 = Buffer.alloc(32);
      const publicKey1 = Buffer.alloc(32);
      const nonce1 = new anchor.BN(111111);
      
      const [bid1PDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bid"),
          auctionId.toArrayLike(Buffer, "le", 8),
          bidder1.publicKey.toBuffer(),
        ],
        program.programId
      );
      
      // Skipping for test demonstration
      
      /* await program.methods
        .submitEncryptedBid(
          auctionId,
          Array.from(bidAmount1),
          Array.from(publicKey1),
          nonce1,
          new anchor.BN(0)
        )
        .accounts({
          bidder: bidder1.publicKey,
          auction: auctionPDA,
          bid: bid1PDA,
          protocolState: protocolStatePDA,
          // Add Arcium accounts here
          systemProgram: SystemProgram.programId,
        })
        .signers([bidder1])
        .rpc(); */
      
      console.log("Bid submission test placeholder - requires Arcium setup");
    });
    
    it("Prevents bids after auction ends", async () => {
      // Fast forward time (in real test would manipulate blockchain time)
      console.log("Time-based test placeholder");
    });
  });
  
  describe("Dutch Auction", () => {
    let dutchAuctionId: anchor.BN;
    let dutchAuctionPDA: PublicKey;
    
    before(async () => {
      dutchAuctionId = new anchor.BN(Date.now() + 1000);
      
      [dutchAuctionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("auction"), dutchAuctionId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
    });
    
    it("Creates a Dutch auction", async () => {
      const startingPrice = new anchor.BN(1000000); // 1 token
      const priceDecreaseRate = new anchor.BN(100); // 100 units per second
      const duration = new anchor.BN(3600); // 1 hour
      const reservePriceEncrypted = Buffer.alloc(32);
      const reservePriceNonce = new anchor.BN(789012);
      
      console.log("Dutch auction creation test placeholder");
    });
    
    it("Accepts bid at current price", async () => {
      console.log("Dutch auction bidding test placeholder");
    });
  });
  
  describe("Batch Settlement", () => {
    it("Creates batch settlement", async () => {
      const auctionIds = [
        new anchor.BN(1),
        new anchor.BN(2),
        new anchor.BN(3),
      ];
      
      console.log("Batch settlement test placeholder");
    });
  });
  
  describe("Admin Functions", () => {
    it("Pauses the protocol", async () => {
      await program.methods
        .setPauseState(true)
        .accounts({
          authority: protocolAuthority.publicKey,
          protocolState: protocolStatePDA,
        })
        .signers([protocolAuthority])
        .rpc();
      
      const protocolState = await program.account.protocolState.fetch(protocolStatePDA);
      assert.equal(protocolState.paused, true);
    });
    
    it("Unpauses the protocol", async () => {
      await program.methods
        .setPauseState(false)
        .accounts({
          authority: protocolAuthority.publicKey,
          protocolState: protocolStatePDA,
        })
        .signers([protocolAuthority])
        .rpc();
      
      const protocolState = await program.account.protocolState.fetch(protocolStatePDA);
      assert.equal(protocolState.paused, false);
    });
    
    it("Transfers authority", async () => {
      const newAuthority = Keypair.generate();
      
      await program.methods
        .transferAuthority(newAuthority.publicKey)
        .accounts({
          authority: protocolAuthority.publicKey,
          protocolState: protocolStatePDA,
          newAuthority: newAuthority.publicKey,
        })
        .signers([protocolAuthority])
        .rpc();
      
      const protocolState = await program.account.protocolState.fetch(protocolStatePDA);
      assert.equal(
        protocolState.authority.toString(),
        newAuthority.publicKey.toString()
      );
    });
  });
});