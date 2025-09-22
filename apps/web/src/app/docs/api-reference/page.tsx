'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, Search, Book, Code, Settings, Zap } from 'lucide-react';

const sections = [
  {
    id: 'client',
    title: 'ShadowProtocolClient',
    icon: <Settings className="h-5 w-5" />,
    methods: [
      { name: 'constructor', description: 'Initialize the client' },
      { name: 'createSealedAuction', description: 'Create a sealed-bid auction' },
      { name: 'createDutchAuction', description: 'Create a Dutch auction' },
      { name: 'submitEncryptedBid', description: 'Submit encrypted bid' },
      { name: 'settleAuction', description: 'Settle auction via MPC' },
      { name: 'batchSettle', description: 'Batch settlement' }
    ]
  },
  {
    id: 'queries',
    title: 'Query Methods',
    icon: <Search className="h-5 w-5" />,
    methods: [
      { name: 'getAuction', description: 'Get auction by ID' },
      { name: 'getAuctionBids', description: 'Get bids for auction' },
      { name: 'getUserBids', description: 'Get user bids' },
      { name: 'getActiveAuctions', description: 'Get active auctions' },
      { name: 'getAuctionsByType', description: 'Filter by type' },
      { name: 'getAuctionsByStatus', description: 'Filter by status' }
    ]
  },
  {
    id: 'utils',
    title: 'Utilities',
    icon: <Zap className="h-5 w-5" />,
    methods: [
      { name: 'getCurrentDutchPrice', description: 'Calculate Dutch price' },
      { name: 'isAuctionEnded', description: 'Check if ended' },
      { name: 'waitForComputation', description: 'Wait for MPC' },
      { name: 'decryptSettlementResult', description: 'Decrypt results' }
    ]
  },
  {
    id: 'types',
    title: 'Types & Interfaces',
    icon: <Code className="h-5 w-5" />,
    methods: [
      { name: 'ShadowProtocolConfig', description: 'Client configuration' },
      { name: 'AuctionData', description: 'Auction data structure' },
      { name: 'BidData', description: 'Bid data structure' },
      { name: 'AuctionType', description: 'Auction type enum' },
      { name: 'AuctionStatus', description: 'Status enum' }
    ]
  }
];

export default function APIReferencePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('client');

  const filteredSections = sections.map(section => ({
    ...section,
    methods: section.methods.filter(method => 
      method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      method.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.methods.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-8">
          <Link href="/docs" className="text-blue-400 hover:text-blue-300">Docs</Link>
          <ChevronRight className="h-4 w-4 text-gray-500" />
          <span className="text-gray-300">API Reference</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-6">API Reference</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Complete API documentation for the Shadow Protocol SDK with examples and type definitions.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search methods..."
                  className="w-full bg-black/30 text-white pl-10 pr-4 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">Sections</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left p-2 rounded-lg transition-all flex items-center space-x-2 ${
                      selectedSection === section.id
                        ? 'bg-blue-600/30 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* ShadowProtocolClient Section */}
            {selectedSection === 'client' && (
              <div className="space-y-8">
                <section className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6">ShadowProtocolClient</h2>
                  <p className="text-gray-300 mb-6">
                    The main client class for interacting with Shadow Protocol.
                  </p>

                  {/* Constructor */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Constructor</h3>
                    <div className="bg-black/40 rounded-lg p-4 mb-4">
                      <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`new ShadowProtocolClient(config: ShadowProtocolConfig)`}
                      </pre>
                    </div>
                    <p className="text-gray-300 mb-4">Creates a new Shadow Protocol client instance.</p>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-green-300 font-mono text-sm overflow-x-auto">
{`const client = new ShadowProtocolClient({
  rpcUrl: 'https://api.devnet.solana.com',
  arciumClusterPubkey: 'your-cluster-pubkey',
  wallet: yourWallet,
  commitment: 'confirmed'
});`}
                      </pre>
                    </div>
                  </div>

                  {/* createSealedAuction */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">createSealedAuction()</h3>
                    <div className="bg-black/40 rounded-lg p-4 mb-4">
                      <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`async createSealedAuction(params: CreateAuctionParams): Promise<CreateAuctionResult>`}
                      </pre>
                    </div>
                    <p className="text-gray-300 mb-4">Creates a new sealed-bid auction with encrypted reserve price.</p>
                    
                    <h4 className="text-lg font-medium text-white mb-2">Parameters</h4>
                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <pre className="text-yellow-300 font-mono text-sm overflow-x-auto">
{`interface CreateAuctionParams {
  assetMint: PublicKey;        // Token mint for auction
  duration: number;            // Duration in seconds
  minimumBid: number;          // Minimum bid in lamports
  reservePrice?: number;       // Hidden reserve price
  metadata?: AuctionMetadata;  // Optional metadata
}`}
                      </pre>
                    </div>

                    <h4 className="text-lg font-medium text-white mb-2">Example</h4>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-green-300 font-mono text-sm overflow-x-auto">
{`const auction = await client.createSealedAuction({
  assetMint: new PublicKey('So11111111111111111111111111111111111111112'),
  duration: 3600,              // 1 hour
  minimumBid: 1_000_000,       // 1 SOL
  reservePrice: 5_000_000,     // 5 SOL (encrypted)
});

console.log(\`Auction created: \${auction.auctionId}\`);`}
                      </pre>
                    </div>
                  </div>

                  {/* submitEncryptedBid */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">submitEncryptedBid()</h3>
                    <div className="bg-black/40 rounded-lg p-4 mb-4">
                      <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`async submitEncryptedBid(params: SubmitBidParams): Promise<SubmitBidResult>`}
                      </pre>
                    </div>
                    <p className="text-gray-300 mb-4">Submits an encrypted bid to a sealed auction.</p>
                    
                    <h4 className="text-lg font-medium text-white mb-2">Example</h4>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-green-300 font-mono text-sm overflow-x-auto">
{`const bid = await client.submitEncryptedBid({
  auctionId: '123',
  amount: 7_000_000,           // 7 SOL bid
});

console.log(\`Bid submitted: \${bid.signature}\`);`}
                      </pre>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Query Methods Section */}
            {selectedSection === 'queries' && (
              <div className="space-y-8">
                <section className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6">Query Methods</h2>
                  
                  {/* getAuction */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">getAuction()</h3>
                    <div className="bg-black/40 rounded-lg p-4 mb-4">
                      <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`async getAuction(auctionId: number): Promise<AuctionData | null>`}
                      </pre>
                    </div>
                    <p className="text-gray-300 mb-4">Retrieves auction data by ID.</p>
                    
                    <h4 className="text-lg font-medium text-white mb-2">Returns</h4>
                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <pre className="text-yellow-300 font-mono text-sm overflow-x-auto">
{`interface AuctionData {
  id: number;
  creator: PublicKey;
  assetMint: PublicKey;
  auctionType: AuctionType;
  status: AuctionStatus;
  startTime: number;
  endTime: number;
  minimumBid: number;
  currentPrice: number;
  totalBids: number;
  winner?: PublicKey;
}`}
                      </pre>
                    </div>

                    <h4 className="text-lg font-medium text-white mb-2">Example</h4>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-green-300 font-mono text-sm overflow-x-auto">
{`const auction = await client.getAuction(123);
if (auction) {
  console.log(\`Status: \${auction.status}\`);
  console.log(\`Total bids: \${auction.totalBids}\`);
}`}
                      </pre>
                    </div>
                  </div>

                  {/* getActiveAuctions */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">getActiveAuctions()</h3>
                    <div className="bg-black/40 rounded-lg p-4 mb-4">
                      <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`async getActiveAuctions(): Promise<AuctionData[]>`}
                      </pre>
                    </div>
                    <p className="text-gray-300 mb-4">Returns all currently active auctions.</p>
                    
                    <h4 className="text-lg font-medium text-white mb-2">Example</h4>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-green-300 font-mono text-sm overflow-x-auto">
{`const activeAuctions = await client.getActiveAuctions();
console.log(\`\${activeAuctions.length} auctions active\`);

activeAuctions.forEach(auction => {
  const timeLeft = auction.endTime - Date.now() / 1000;
  console.log(\`Auction \${auction.id}: \${timeLeft}s remaining\`);
});`}
                      </pre>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Types Section */}
            {selectedSection === 'types' && (
              <div className="space-y-8">
                <section className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6">Types & Interfaces</h2>
                  
                  {/* ShadowProtocolConfig */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">ShadowProtocolConfig</h3>
                    <p className="text-gray-300 mb-4">Configuration interface for the Shadow Protocol client.</p>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-yellow-300 font-mono text-sm overflow-x-auto">
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
                    </div>
                  </div>

                  {/* Enums */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Enums</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-medium text-white mb-2">AuctionType</h4>
                        <div className="bg-black/40 rounded-lg p-4">
                          <pre className="text-purple-300 font-mono text-sm overflow-x-auto">
{`enum AuctionType {
  Sealed = 'Sealed',
  Dutch = 'Dutch',
  Reserve = 'Reserve'
}`}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-2">AuctionStatus</h4>
                        <div className="bg-black/40 rounded-lg p-4">
                          <pre className="text-purple-300 font-mono text-sm overflow-x-auto">
{`enum AuctionStatus {
  Active = 'Active',
  Ended = 'Ended',
  Settled = 'Settled',
  Cancelled = 'Cancelled'
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Utilities Section */}
            {selectedSection === 'utils' && (
              <div className="space-y-8">
                <section className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-white mb-6">Utility Methods</h2>
                  
                  {/* getCurrentDutchPrice */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">getCurrentDutchPrice()</h3>
                    <div className="bg-black/40 rounded-lg p-4 mb-4">
                      <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`async getCurrentDutchPrice(auctionId: number): Promise<number>`}
                      </pre>
                    </div>
                    <p className="text-gray-300 mb-4">Calculates the current price for a Dutch auction.</p>
                    
                    <h4 className="text-lg font-medium text-white mb-2">Example</h4>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-green-300 font-mono text-sm overflow-x-auto">
{`const currentPrice = await client.getCurrentDutchPrice(123);
const priceInSOL = currentPrice / 1_000_000;
console.log(\`Current price: \${priceInSOL.toFixed(2)} SOL\`);`}
                      </pre>
                    </div>
                  </div>

                  {/* waitForComputation */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">waitForComputation()</h3>
                    <div className="bg-black/40 rounded-lg p-4 mb-4">
                      <pre className="text-blue-300 font-mono text-sm overflow-x-auto">
{`async waitForComputation(
  txSignature: TransactionSignature,
  maxWaitTime?: number
): Promise<TransactionSignature>`}
                      </pre>
                    </div>
                    <p className="text-gray-300 mb-4">Waits for MPC computation to complete with optional timeout.</p>
                    
                    <h4 className="text-lg font-medium text-white mb-2">Example</h4>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-green-300 font-mono text-sm overflow-x-auto">
{`const settlement = await client.settleAuction(123);

try {
  await client.waitForComputation(settlement.signature, 120000);
  console.log('MPC computation completed');
} catch (error) {
  console.log('Computation timed out');
}`}
                      </pre>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-8 border border-purple-400/30">
              <h3 className="text-2xl font-bold text-white mb-6">Quick Links</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/docs/examples" className="block group">
                  <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all">
                    <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300">
                      Interactive Examples
                    </h4>
                    <p className="text-gray-300 text-sm">
                      See these APIs in action with live code examples.
                    </p>
                  </div>
                </Link>
                
                <Link href="/docs/guides" className="block group">
                  <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all">
                    <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300">
                      Guides & Tutorials
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Step-by-step guides for common use cases.
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