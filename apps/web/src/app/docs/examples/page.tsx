'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, Play, Copy, CheckCircle, AlertCircle, Code, Zap } from 'lucide-react';

const examples = [
  {
    id: 'sealed-auction',
    title: 'Sealed-Bid Auction',
    description: 'Create a privacy-preserving sealed auction with encrypted bids',
    difficulty: 'Beginner',
    time: '5 min',
    code: `import { ShadowProtocolClient } from '@shadow-protocol/client';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize client
const client = new ShadowProtocolClient({
  rpcUrl: 'https://api.devnet.solana.com',
  arciumClusterPubkey: process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_PUBKEY!,
  wallet: yourWallet,
});

// Create sealed auction
const auction = await client.createSealedAuction({
  assetMint: new PublicKey('So11111111111111111111111111111111111111112'),
  duration: 3600, // 1 hour
  minimumBid: 1_000_000, // 1 SOL
  reservePrice: 5_000_000, // 5 SOL (encrypted)
});

console.log(\`Auction created: \${auction.auctionId}\`);

// Submit encrypted bid
const bid = await client.submitEncryptedBid({
  auctionId: auction.auctionId.toString(),
  amount: 7_000_000, // 7 SOL
});

console.log(\`Bid submitted: \${bid.signature}\`);`
  },
  {
    id: 'dutch-auction',
    title: 'Dutch Auction',
    description: 'Create a Dutch auction with decreasing price over time',
    difficulty: 'Intermediate',
    time: '8 min',
    code: `import { ShadowProtocolClient } from '@shadow-protocol/client';

const client = new ShadowProtocolClient(config);

// Create Dutch auction
const auction = await client.createDutchAuction({
  assetMint: new PublicKey('asset-mint'),
  duration: 1800, // 30 minutes
  startingPrice: 10_000_000, // 10 SOL
  priceDecreaseRate: 100_000, // 0.1 SOL per second
  reservePrice: 3_000_000, // 3 SOL minimum
});

// Monitor price changes
const monitorPrice = async () => {
  const currentPrice = await client.getCurrentDutchPrice(auction.auctionId);
  console.log(\`Current price: \${currentPrice / 1_000_000} SOL\`);
  
  if (currentPrice <= 6_000_000) { // Target 6 SOL
    const bid = await client.submitDutchBid({
      auctionId: auction.auctionId.toString(),
      amount: currentPrice,
    });
    
    if (bid.accepted) {
      console.log('Bid accepted!');
    }
  }
};

// Check price every 2 seconds
setInterval(monitorPrice, 2000);`
  },
  {
    id: 'batch-settlement',
    title: 'Batch Settlement',
    description: 'Settle multiple auctions efficiently in a single transaction',
    difficulty: 'Advanced',
    time: '12 min',
    code: `import { ShadowProtocolClient, AuctionStatus } from '@shadow-protocol/client';

const client = new ShadowProtocolClient(config);

// Get all ended auctions
const endedAuctions = await client.getAuctionsByStatus(AuctionStatus.Ended);
const auctionIds = endedAuctions.map(auction => auction.id);

if (auctionIds.length > 0) {
  console.log(\`Settling \${auctionIds.length} auctions...\`);
  
  // Batch settle for efficiency
  const batchSettlement = await client.batchSettle(auctionIds);
  console.log(\`Batch settlement: \${batchSettlement.signature}\`);
  
  // Wait for MPC computation
  await client.waitForComputation(batchSettlement.signature, 120000);
  
  // Check results
  for (const auctionId of auctionIds) {
    const auction = await client.getAuction(auctionId);
    console.log(\`Auction \${auctionId}: Winner \${auction?.winner}\`);
  }
}`
  },
  {
    id: 'event-subscription',
    title: 'Real-time Events',
    description: 'Subscribe to auction and bid events for real-time updates',
    difficulty: 'Intermediate',
    time: '6 min',
    code: `import { ShadowProtocolClient } from '@shadow-protocol/client';

const client = new ShadowProtocolClient(config);

// Subscribe to auction events
const unsubscribeAuctions = client.subscribeToAuctionEvents((event) => {
  console.log(\`Auction Event: \${event.type}\`, event);
  
  if (event.type === 'AuctionEnded') {
    // Auto-settle when auction ends
    client.settleAuction(event.auctionId);
  }
});

// Subscribe to bid events
const unsubscribeBids = client.subscribeToBidEvents((event) => {
  console.log(\`Bid Event: \${event.type}\`, event);
  
  if (event.type === 'BidSubmitted') {
    console.log(\`New bid on auction \${event.auctionId}\`);
  }
});

// Subscribe to settlement events
const unsubscribeSettlements = client.subscribeToSettlementEvents((event) => {
  console.log(\`Settlement Event: \${event.type}\`, event);
  
  if (event.type === 'SettlementCompleted') {
    console.log(\`Auction \${event.auctionId} settled!\`);
    console.log(\`Winner: \${event.winner}\`);
    console.log(\`Final Price: \${event.finalPrice}\`);
  }
});

// Cleanup after 10 minutes
setTimeout(() => {
  unsubscribeAuctions();
  unsubscribeBids();
  unsubscribeSettlements();
}, 600000);`
  }
];

export default function ExamplesPage() {
  const [selectedExample, setSelectedExample] = useState(examples[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(selectedExample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateRun = async () => {
    setIsRunning(true);
    setOutput([]);
    
    const steps = [
      '🔌 Connecting to Solana devnet...',
      '🚀 Initializing Shadow Protocol client...',
      '⚡ Setting up Arcium MPC connection...',
      '✅ Client initialized successfully!',
      '',
      '📦 Creating auction...',
      '🔐 Encrypting reserve price with MPC...',
      '📝 Submitting transaction to Solana...',
      '✅ Auction created with ID: 1234',
      '🔗 Transaction: 5KJp7X8...9mNw2',
      '',
      '💰 Submitting encrypted bid...',
      '🔒 Encrypting bid amount client-side...',
      '📤 Broadcasting bid transaction...',
      '✅ Bid submitted successfully!',
      '🔗 Bid signature: 3FkL9M...7qWe4',
      '',
      '🏁 Example completed successfully!'
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setOutput(prev => [...prev, step]);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-8">
          <Link href="/docs" className="text-blue-400 hover:text-blue-300">Docs</Link>
          <ChevronRight className="h-4 w-4 text-gray-500" />
          <span className="text-gray-300">Interactive Examples</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-6">Interactive Examples</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Learn Shadow Protocol by running live code examples. Each example includes step-by-step explanations and editable code.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Example List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Choose an Example</h2>
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setSelectedExample(example)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selectedExample.id === example.id
                    ? 'bg-blue-600/30 border-blue-400/50 text-white'
                    : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{example.title}</h3>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      example.difficulty === 'Beginner' ? 'bg-green-600/30 text-green-300' :
                      example.difficulty === 'Intermediate' ? 'bg-yellow-600/30 text-yellow-300' :
                      'bg-red-600/30 text-red-300'
                    }`}>
                      {example.difficulty}
                    </span>
                    <span className="text-gray-400">{example.time}</span>
                  </div>
                </div>
                <p className="text-sm opacity-80">{example.description}</p>
              </button>
            ))}
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="bg-black/30 px-6 py-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedExample.title}</h3>
                    <p className="text-sm text-gray-400">{selectedExample.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm text-white"
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={simulateRun}
                      disabled={isRunning}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all text-sm text-white disabled:opacity-50"
                    >
                      {isRunning ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>Run Example</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Code */}
              <div className="p-6">
                <pre className="text-sm overflow-x-auto">
                  <code className="text-blue-300 font-mono leading-relaxed">
                    {selectedExample.code}
                  </code>
                </pre>
              </div>
            </div>

            {/* Output Terminal */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <div className="bg-black/60 px-6 py-3 border-b border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-400 text-sm font-mono">Terminal Output</span>
                </div>
              </div>
              <div className="p-6 min-h-[200px] font-mono text-sm">
                {output.length === 0 ? (
                  <div className="text-gray-500 italic">
                    Click "Run Example" to see the output...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {output.map((line, index) => (
                      <div key={index} className={`${
                        line.startsWith('✅') ? 'text-green-400' :
                        line.startsWith('🔗') ? 'text-blue-400' :
                        line.startsWith('❌') ? 'text-red-400' :
                        line.startsWith('⚠️') ? 'text-yellow-400' :
                        'text-gray-300'
                      }`}>
                        {line}
                      </div>
                    ))}
                    {isRunning && (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">How it Works</h3>
              <div className="space-y-4 text-gray-300">
                {selectedExample.id === 'sealed-auction' && (
                  <div className="space-y-3">
                    <p><strong>1. Client Initialization:</strong> Creates a connection to Solana and sets up the Arcium MPC client for encryption.</p>
                    <p><strong>2. Reserve Price Encryption:</strong> The reserve price is encrypted client-side using Arcium's MPC before being sent to the blockchain.</p>
                    <p><strong>3. Auction Creation:</strong> The auction is created on-chain with the encrypted reserve price. Only the MPC network can decrypt it during settlement.</p>
                    <p><strong>4. Encrypted Bidding:</strong> Bid amounts are encrypted client-side, ensuring complete privacy until settlement.</p>
                  </div>
                )}
                {selectedExample.id === 'dutch-auction' && (
                  <div className="space-y-3">
                    <p><strong>1. Price Calculation:</strong> Dutch auctions start at a high price and decrease over time based on the configured rate.</p>
                    <p><strong>2. Real-time Monitoring:</strong> The current price is calculated based on elapsed time since auction start.</p>
                    <p><strong>3. Immediate Settlement:</strong> Dutch auctions settle immediately when someone bids at the current price.</p>
                    <p><strong>4. Reserve Protection:</strong> Hidden reserve prices prevent sales below a minimum threshold.</p>
                  </div>
                )}
                {selectedExample.id === 'batch-settlement' && (
                  <div className="space-y-3">
                    <p><strong>1. Batch Processing:</strong> Multiple auctions can be settled in a single transaction for gas efficiency.</p>
                    <p><strong>2. MPC Computation:</strong> The settlement process triggers multi-party computation to determine winners.</p>
                    <p><strong>3. Parallel Processing:</strong> Multiple auctions are processed simultaneously by the MPC network.</p>
                    <p><strong>4. Result Distribution:</strong> Winners and final prices are revealed once computation completes.</p>
                  </div>
                )}
                {selectedExample.id === 'event-subscription' && (
                  <div className="space-y-3">
                    <p><strong>1. WebSocket Connection:</strong> Real-time events are delivered via WebSocket connections to the Solana network.</p>
                    <p><strong>2. Event Filtering:</strong> Subscribe to specific auction IDs or event types for targeted notifications.</p>
                    <p><strong>3. Automatic Actions:</strong> Set up automated responses to events like auto-settling ended auctions.</p>
                    <p><strong>4. State Synchronization:</strong> Keep your application state in sync with on-chain events.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
              <h3 className="text-lg font-semibold text-white mb-4">Ready to Build?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/docs/getting-started" className="block group">
                  <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      <h4 className="font-semibold text-white group-hover:text-blue-300">
                        Setup Guide
                      </h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Get your development environment ready for building.
                    </p>
                  </div>
                </Link>
                
                <Link href="/docs/api-reference" className="block group">
                  <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all">
                    <div className="flex items-center space-x-2 mb-2">
                      <Code className="h-5 w-5 text-blue-400" />
                      <h4 className="font-semibold text-white group-hover:text-blue-300">
                        API Reference
                      </h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Explore the complete API documentation.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}