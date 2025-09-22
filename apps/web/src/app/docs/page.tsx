import Link from 'next/link';
import { Book, Code, Zap, Shield, Users } from 'lucide-react';

export default function DocsHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Shadow Protocol Documentation
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Build privacy-preserving auction applications with our comprehensive SDK. 
            Create sealed-bid auctions, Dutch auctions, and batch settlements using 
            Arcium's MPC technology on Solana.
          </p>
        </div>

        {/* Quick Start Card */}
        <div className="mb-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-4">🚀 Quick Start</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Installation</h3>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-green-400">
                npm install @shadow-protocol/client
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">First Auction</h3>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-blue-400">
                const auction = await client.createSealedAuction(params);
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Link href="/docs/getting-started" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-yellow-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Getting Started</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Set up your development environment and create your first auction in minutes.
              </p>
              <div className="text-blue-400 group-hover:text-blue-300 font-medium">
                Start building →
              </div>
            </div>
          </Link>

          <Link href="/docs/api-reference" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
              <div className="flex items-center mb-4">
                <Book className="h-8 w-8 text-blue-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">API Reference</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Complete API documentation with types, examples, and error handling.
              </p>
              <div className="text-blue-400 group-hover:text-blue-300 font-medium">
                View API docs →
              </div>
            </div>
          </Link>

          <Link href="/docs/examples" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
              <div className="flex items-center mb-4">
                <Code className="h-8 w-8 text-green-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Interactive Examples</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Try live examples and see code in action with our interactive playground.
              </p>
              <div className="text-blue-400 group-hover:text-blue-300 font-medium">
                Try examples →
              </div>
            </div>
          </Link>

          <Link href="/docs/privacy" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Privacy & Security</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Learn how we use MPC encryption to ensure auction privacy and security.
              </p>
              <div className="text-blue-400 group-hover:text-blue-300 font-medium">
                Learn more →
              </div>
            </div>
          </Link>

          <Link href="/docs/guides" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-orange-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">Guides & Tutorials</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Step-by-step guides for building different types of auction applications.
              </p>
              <div className="text-blue-400 group-hover:text-blue-300 font-medium">
                Browse guides →
              </div>
            </div>
          </Link>

          <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-3"></div>
              <h3 className="text-xl font-semibold text-white">Need Help?</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Join our community for support, questions, and to share your builds.
            </p>
            <div className="space-y-2">
              <a href="https://discord.gg/shadow-protocol" className="block text-purple-400 hover:text-purple-300">
                Discord Community
              </a>
              <a href="https://github.com/shadow-protocol/shadow" className="block text-purple-400 hover:text-purple-300">
                GitHub Issues
              </a>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose Shadow Protocol?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-purple-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
              <p className="text-gray-400 text-sm">
                All bids and reserves encrypted using Arcium's MPC technology
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast & Efficient</h3>
              <p className="text-gray-400 text-sm">
                Built on Solana for high-speed, low-cost transactions
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Developer Friendly</h3>
              <p className="text-gray-400 text-sm">
                Simple SDK with TypeScript support and comprehensive docs
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
              <p className="text-gray-400 text-sm">
                Active community and open-source development
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-12 border border-purple-400/30">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build Privacy-Preserving Auctions?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Start building your auction platform today with our comprehensive SDK and documentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs/getting-started" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all">
              Get Started
            </Link>
            <Link href="/docs/examples" className="border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all">
              Try Examples
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}