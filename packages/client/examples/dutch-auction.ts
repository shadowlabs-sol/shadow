/**
 * Dutch auction example - Creates a Dutch auction with decreasing price
 */

import { ShadowProtocolClient } from '../src';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';

async function dutchAuctionExample() {
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
    console.log('🔥 Creating Dutch auction...');
    
    const auction = await client.createDutchAuction({
      assetMint: new PublicKey('So11111111111111111111111111111111111111112'),
      duration: 1800, // 30 minutes
      startingPrice: 10_000_000, // 10 SOL starting price
      priceDecreaseRate: 100_000, // Decrease by 0.1 SOL per second
      reservePrice: 3_000_000, // 3 SOL minimum (hidden)
    });

    console.log(`✅ Dutch auction created!`);
    console.log(`   Auction ID: ${auction.auctionId}`);
    console.log(`   Starting Price: 10 SOL`);
    console.log(`   Price decreases by 0.1 SOL every second`);
    console.log(`   Hidden Reserve: 3 SOL`);

    // Set up price monitoring
    console.log('\n📊 Monitoring price...');
    
    let monitoring = true;
    const targetPrice = 6_000_000; // 6 SOL target price
    
    const monitorPrice = async () => {
      while (monitoring) {
        try {
          const currentPrice = await client.getCurrentDutchPrice(auction.auctionId);
          const priceInSOL = currentPrice / 1_000_000;
          
          console.log(`   Current price: ${priceInSOL.toFixed(2)} SOL`);
          
          // Check if price hit our target
          if (currentPrice <= targetPrice) {
            console.log(`\n🎯 Target price reached! Submitting bid...`);
            
            const bid = await client.submitDutchBid({
              auctionId: auction.auctionId.toString(),
              amount: currentPrice,
            });

            if (bid.accepted) {
              console.log(`✅ Bid accepted! Transaction: ${bid.signature}`);
              console.log(`   Winning price: ${priceInSOL.toFixed(2)} SOL`);
              monitoring = false;
              return;
            } else {
              console.log('❌ Bid rejected (possibly too late)');
            }
          }
          
          // Check if auction ended
          if (await client.isAuctionEnded(auction.auctionId)) {
            console.log('\n⏰ Auction ended without hitting target price');
            monitoring = false;
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
          
        } catch (error) {
          console.error('Error monitoring price:', error);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    };

    // Start monitoring in background
    const monitoringPromise = monitorPrice();

    // Set up event subscription
    console.log('\n🔔 Subscribing to auction events...');
    const unsubscribe = client.subscribeToAuctionEvents((event) => {
      console.log('📢 Auction event:', event);
    }, auction.auctionId);

    // Wait for monitoring to complete or timeout
    const timeout = new Promise(resolve => 
      setTimeout(() => {
        monitoring = false;
        resolve('timeout');
      }, 120000) // 2 minute timeout
    );

    await Promise.race([monitoringPromise, timeout]);
    
    // Clean up
    unsubscribe();
    
    // Get final auction state
    const finalAuction = await client.getAuction(auction.auctionId);
    console.log('\n🏁 Final auction state:');
    console.log(`   Status: ${finalAuction?.status}`);
    console.log(`   Current Price: ${finalAuction?.currentPrice / 1_000_000} SOL`);
    console.log(`   Winner: ${finalAuction?.winner?.toString() || 'None'}`);

  } catch (error) {
    console.error('❌ Error running Dutch auction example:', error);
  }
}

// Run the example
if (require.main === module) {
  dutchAuctionExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { dutchAuctionExample };