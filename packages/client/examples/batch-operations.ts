/**
 * Batch operations example - Demonstrates batch settlement and bulk operations
 */

import { ShadowProtocolClient, AuctionStatus } from '../src';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

async function batchOperationsExample() {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );
  
  const wallet = new Wallet(Keypair.generate());
  
  const client = new ShadowProtocolClient({
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    arciumClusterPubkey: process.env.ARCIUM_CLUSTER_PUBKEY!,
    wallet,
    commitment: 'confirmed'
  });

  try {
    console.log('🚀 Running batch operations example...');

    // 1. Create multiple auctions
    console.log('\n📦 Creating multiple auctions...');
    const auctions = [];
    
    for (let i = 0; i < 3; i++) {
      const auction = await client.createSealedAuction({
        assetMint: new PublicKey(''),
        duration: 300, // 5 minutes for demo
        minimumBid: 1_000_000 * (i + 1), // Different minimum bids
        reservePrice: 2_000_000 * (i + 1), // Different reserves
      });
      
      auctions.push(auction);
      console.log(`   ✅ Auction ${i + 1}: ID ${auction.auctionId}`);
    }

    // 2. Submit bids to all auctions
    console.log('\n💰 Submitting bids to all auctions...');
    
    for (const auction of auctions) {
      // Submit 2-3 bids per auction
      const bidCount = 2 + Math.floor(Math.random() * 2);
      
      for (let j = 0; j < bidCount; j++) {
        const bidAmount = (3_000_000 + (j * 1_000_000)) * (auction.auctionId + 1);
        
        const bid = await client.submitEncryptedBid({
          auctionId: auction.auctionId.toString(),
          amount: bidAmount,
        });
        
        console.log(`   💵 Bid ${bidAmount / 1_000_000} SOL on auction ${auction.auctionId}`);
      }
    }

    // 3. Get auction analytics
    console.log('\n📊 Auction analytics...');
    
    const activeAuctions = await client.getActiveAuctions();
    console.log(`   Active auctions: ${activeAuctions.length}`);
    
    for (const auction of auctions) {
      const auctionData = await client.getAuction(auction.auctionId);
      const bids = await client.getAuctionBids(auction.auctionId);
      
      console.log(`   Auction ${auction.auctionId}:`);
      console.log(`     Status: ${auctionData?.status}`);
      console.log(`     Total bids: ${bids.length}`);
      console.log(`     Min bid: ${auctionData?.minimumBid / 1_000_000} SOL`);
    }

    // 4. Simulate auction end and batch settlement
    console.log('\n⏰ Simulating auction end...');
    console.log('   (In production, wait for actual end times)');
    
    // Get auctions by status
    const sealedAuctions = await client.getAuctionsByType('Sealed' as any);
    console.log(`   Found ${sealedAuctions.length} sealed auctions`);
    
    // Simulate ending auctions (in production these would end naturally)
    const auctionIds = auctions.map(a => a.auctionId);
    
    console.log('\n🔨 Batch settlement...');
    
    try {
      const batchSettlement = await client.batchSettle(auctionIds);
      console.log(`   ✅ Batch settlement initiated: ${batchSettlement.signature}`);
      console.log(`   Batch ID: ${batchSettlement.batchId}`);
      
      // Wait for MPC computation
      console.log('   ⚡ Waiting for MPC computation...');
      await client.waitForComputation(batchSettlement.signature, 120000);
      
    } catch (error) {
      console.log('   ⚠️  Batch settlement not available, settling individually...');
      
      // Fall back to individual settlement
      for (const auctionId of auctionIds) {
        try {
          const settlement = await client.settleAuction(auctionId);
          console.log(`   ✅ Settled auction ${auctionId}: ${settlement.signature}`);
        } catch (settlementError) {
          console.log(`   ❌ Failed to settle auction ${auctionId}:`, settlementError);
        }
      }
    }

    // 5. Final results
    console.log('\n🏆 Final results...');
    
    for (const auction of auctions) {
      const finalAuction = await client.getAuction(auction.auctionId);
      console.log(`   Auction ${auction.auctionId}:`);
      console.log(`     Status: ${finalAuction?.status}`);
      console.log(`     Winner: ${finalAuction?.winner?.toString().slice(0, 8)}...`);
      console.log(`     Final price: ${finalAuction?.currentPrice / 1_000_000} SOL`);
    }

    // 6. User bid summary
    console.log('\n👤 User bid summary...');
    const userBids = await client.getUserBids(wallet.publicKey);
    console.log(`   Total bids placed: ${userBids.length}`);
    
    const bidsByAuction = userBids.reduce((acc, bid) => {
      acc[bid.auctionId] = (acc[bid.auctionId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    Object.entries(bidsByAuction).forEach(([auctionId, count]) => {
      console.log(`   Auction ${auctionId}: ${count} bids`);
    });

    console.log('\n✨ Batch operations example completed!');

  } catch (error) {
    console.error('❌ Error running batch operations example:', error);
  }
}

// Helper function to demonstrate analytics
async function getAuctionAnalytics(client: ShadowProtocolClient) {
  console.log('\n📈 Platform Analytics:');
  
  try {
    const [activeAuctions, allStatuses] = await Promise.all([
      client.getActiveAuctions(),
      Promise.all([
        client.getAuctionsByStatus(AuctionStatus.Active),
        client.getAuctionsByStatus(AuctionStatus.Ended),
        client.getAuctionsByStatus(AuctionStatus.Settled),
      ])
    ]);
    
    const [active, ended, settled] = allStatuses;
    
    console.log(`   📊 Active: ${active.length}`);
    console.log(`   ⏰ Ended: ${ended.length}`);
    console.log(`   ✅ Settled: ${settled.length}`);
    console.log(`   📈 Total: ${active.length + ended.length + settled.length}`);
    
  } catch (error) {
    console.log('   ❌ Analytics unavailable:', error.message);
  }
}

// Run the example
if (require.main === module) {
  batchOperationsExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { batchOperationsExample, getAuctionAnalytics };