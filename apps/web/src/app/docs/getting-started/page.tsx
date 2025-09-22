import Link from 'next/link';
import { ChevronRight, Copy, ExternalLink } from 'lucide-react';

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-8">
          <Link href="/docs" className="text-blue-400 hover:text-blue-300">Docs</Link>
          <ChevronRight className="h-4 w-4 text-gray-500" />
          <span className="text-gray-300">Getting Started</span>
        </nav>

        {/* Header */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Getting Started</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Build your first privacy-preserving auction in minutes with the Shadow Protocol SDK.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Prerequisites */}
            <section className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">Prerequisites</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Node.js 18+</h3>
                    <p className="text-gray-300">Download from <a href="https://nodejs.org" className="text-blue-400 hover:underline" target="_blank">nodejs.org</a></p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Solana Wallet</h3>
                    <p className="text-gray-300">Phantom, Solflare, or any Solana-compatible wallet</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Basic TypeScript Knowledge</h3>
                    <p className="text-gray-300">Familiarity with TypeScript and async/await</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Installation */}
            <section className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">Installation</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">1. Install the SDK</h3>
                  <div className="bg-black/40 rounded-lg p-4 relative">
                    <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`# Using npm
npm install @shadow-protocol/client

# Using yarn
yarn add @shadow-protocol/client

# Using bun
bun add @shadow-protocol/client`}
                    </pre>
                    <button className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">2. Install Peer Dependencies</h3>
                  <div className="bg-black/40 rounded-lg p-4 relative">
                    <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`npm install @solana/web3.js @coral-xyz/anchor`}
                    </pre>
                    <button className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Start */}
            <section className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">Quick Start</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">1. Initialize the Client</h3>
                  <div className="bg-black/40 rounded-lg p-4 relative">
                    <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`import { ShadowProtocolClient } from '@shadow-protocol/client';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize client
const client = new ShadowProtocolClient({
  rpcUrl: 'https://api.devnet.solana.com',
  arciumClusterPubkey: 'your-cluster-pubkey',
  wallet: yourWallet,
  commitment: 'confirmed'
});`}
                    </pre>
                    <button className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">2. Create Your First Auction</h3>
                  <div className="bg-black/40 rounded-lg p-4 relative">
                    <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`// Create a sealed-bid auction
const auction = await client.createSealedAuction({
  assetMint: new PublicKey('So11111111111111111111111111111111111111112'), // wSOL
  duration: 3600, // 1 hour
  minimumBid: 1_000_000, // 1 SOL
  reservePrice: 5_000_000, // 5 SOL (encrypted)
});

console.log(\`Auction created with ID: \${auction.auctionId}\`);`}
                    </pre>
                    <button className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">3. Submit an Encrypted Bid</h3>
                  <div className="bg-black/40 rounded-lg p-4 relative">
                    <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`// Submit an encrypted bid
const bid = await client.submitEncryptedBid({
  auctionId: auction.auctionId.toString(),
  amount: 7_000_000, // 7 SOL bid
});

console.log(\`Bid submitted: \${bid.signature}\`);`}
                    </pre>
                    <button className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">4. Settle the Auction</h3>
                  <div className="bg-black/40 rounded-lg p-4 relative">
                    <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`// Wait for auction to end, then settle
const settlement = await client.settleAuction(auction.auctionId);

// Wait for MPC computation
await client.waitForComputation(settlement.signature);

// Get final results
const finalAuction = await client.getAuction(auction.auctionId);
console.log(\`Winner: \${finalAuction.winner}\`);
console.log(\`Final price: \${finalAuction.currentPrice / 1_000_000} SOL\`);`}
                    </pre>
                    <button className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Configuration */}
            <section className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">Configuration</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Environment Variables</h3>
                  <p className="text-gray-300 mb-4">Create a <code className="bg-black/30 px-2 py-1 rounded text-green-400">.env</code> file in your project root:</p>
                  <div className="bg-black/40 rounded-lg p-4 relative">
                    <pre className="text-yellow-300 font-mono text-sm overflow-x-auto">
{`# Required
SHADOW_PROTOCOL_PROGRAM_ID=your_program_id
ARCIUM_CLUSTER_PUBKEY=your_cluster_pubkey

# Optional
SOLANA_RPC_URL=https://api.devnet.solana.com
MXE_PUBLIC_KEY=your_mxe_public_key
CLUSTER_OFFSET=0`}
                    </pre>
                    <button className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Client Configuration Options</h3>
                  <div className="bg-black/40 rounded-lg p-4 relative">
                    <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`interface ShadowProtocolConfig {
  rpcUrl: string;                    // Solana RPC endpoint
  programId?: string;                // Shadow Protocol program ID
  clusterOffset?: number;            // Arcium cluster offset
  callbackUrl?: string;              // Callback URL for MPC results
  commitment?: Commitment;           // Transaction commitment level
  wallet?: Wallet;                   // Solana wallet instance
  arciumClusterPubkey?: string;      // Arcium cluster public key
  mxePublicKey?: Uint8Array;         // MPC execution public key
}`}
                    </pre>
                    <button className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-8 border border-purple-400/30">
              <h2 className="text-3xl font-bold text-white mb-6">Next Steps</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/docs/examples" className="block group">
                  <div className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition-all">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300">
                      Try Interactive Examples
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Explore working examples with live code and explanations.
                    </p>
                    <div className="text-blue-400 text-sm flex items-center">
                      View Examples <ExternalLink className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </Link>
                
                <Link href="/docs/api-reference" className="block group">
                  <div className="bg-white/10 rounded-lg p-6 hover:bg-white/20 transition-all">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300">
                      Read API Documentation
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Complete reference for all methods, types, and configurations.
                    </p>
                    <div className="text-blue-400 text-sm flex items-center">
                      API Reference <ExternalLink className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </Link>
              </div>
            </section>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">On This Page</h3>
              <nav className="space-y-2 text-sm">
                <a href="#prerequisites" className="block text-gray-400 hover:text-white">Prerequisites</a>
                <a href="#installation" className="block text-gray-400 hover:text-white">Installation</a>
                <a href="#quick-start" className="block text-gray-400 hover:text-white">Quick Start</a>
                <a href="#configuration" className="block text-gray-400 hover:text-white">Configuration</a>
                <a href="#next-steps" className="block text-gray-400 hover:text-white">Next Steps</a>
              </nav>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
              <h3 className="text-lg font-semibold text-white mb-3">💡 Need Help?</h3>
              <p className="text-gray-300 text-sm mb-4">
                Running into issues? Check our troubleshooting guide or join the community.
              </p>
              <div className="space-y-2 text-sm">
                <a href="/docs/troubleshooting" className="block text-green-400 hover:text-green-300">
                  Troubleshooting Guide
                </a>
                <a href="https://discord.gg/shadow-protocol" className="block text-green-400 hover:text-green-300">
                  Discord Community
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}