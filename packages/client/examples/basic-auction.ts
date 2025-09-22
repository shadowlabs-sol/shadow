/**
 * Basic auction example - Creates a sealed auction and submits bids
 */

import { ShadowProtocolClient } from '../src';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';

async function basicAuctionExample() {
  // Initialize connection and wallet
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );
  
  const wallet = new Wallet(Keypair.generate()); // Use your actual wallet
  
  // Initialize Shadow Protocol client
  const client = new ShadowProtocolClient({
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    arciumClusterPubkey: process.env.ARCIUM_CLUSTER_PUBKEY!,
    wallet,
    commitment: 'confirmed'
  });

  try {
    console.log('Creating sealed auction...');
    
    // Create a sealed auction
    const auction = await client.createSealedAuction({
      assetMint: new PublicKey('So11111111111111111111111111111111111111112'), // Wrapped SOL
      duration: 3600, // 1 hour
      minimumBid: 1_000_000, // 1 SOL minimum
      reservePrice: 5_000_000, // 5 SOL reserve (hidden)
    });

    console.log(`✅ Auction created!`);
    console.log(`   Auction ID: ${auction.auctionId}`);
    console.log(`   Transaction: ${auction.signature}`);
    console.log(`   Auction Account: ${auction.auctionPubkey.toString()}`);

    // Submit encrypted bids
    console.log('\nSubmitting bids...');
    
    const bid1 = await client.submitEncryptedBid({
      auctionId: auction.auctionId.toString(),
      amount: 6_000_000, // 6 SOL
    });

    console.log(`✅ Bid 1 submitted: ${bid1.signature}`);

    const bid2 = await client.submitEncryptedBid({
      auctionId: auction.auctionId.toString(),
      amount: 7_500_000, // 7.5 SOL
    });

    console.log(`✅ Bid 2 submitted: ${bid2.signature}`);

    // Get auction info
    const auctionData = await client.getAuction(auction.auctionId);
    console.log('\n📊 Auction Status:');
    console.log(`   Status: ${auctionData?.status}`);
    console.log(`   Total Bids: ${auctionData?.totalBids}`);
    console.log(`   End Time: ${new Date(auctionData?.endTime * 1000).toISOString()}`);

    // Get bids for this auction
    const bids = await client.getAuctionBids(auction.auctionId);
    console.log(`\n💰 Auction has ${bids.length} bids`);

    console.log('\n⏳ Waiting for auction to end before settling...');
    console.log('   (In a real scenario, you would wait for the actual end time)');
    
    // In production, wait for actual auction end time:
    // while (!(await client.isAuctionEnded(auction.auctionId))) {
    //   await new Promise(resolve => setTimeout(resolve, 10000));
    // }

    // For demo purposes, settle immediately
    console.log('\n🔨 Settling auction...');
    const settlement = await client.settleAuction(auction.auctionId);
    console.log(`✅ Settlement initiated: ${settlement.signature}`);

    // Wait for MPC computation
    console.log('⚡ Waiting for MPC computation...');
    await client.waitForComputation(settlement.signature);

    // Get final results
    const finalAuction = await client.getAuction(auction.auctionId);
    console.log('\n🏆 Final Results:');
    console.log(`   Winner: ${finalAuction?.winner?.toString() || 'TBD'}`);
    console.log(`   Final Price: ${finalAuction?.currentPrice / 1_000_000} SOL`);
    console.log(`   Status: ${finalAuction?.status}`);

  } catch (error) {
    console.error('❌ Error running auction example:', error);
  }
}

// Run the example
if (require.main === module) {
  basicAuctionExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { basicAuctionExample };