'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Search, ExternalLink, CheckCircle, AlertCircle, Loader2, Plus, Hash } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

interface TokenAccount {
  mint: string;
  balance: number;
  decimals: number;
  symbol?: string;
  name?: string;
  image?: string;
  verified?: boolean;
}

interface AssetSelectorProps {
  selectedAsset?: string;
  onSelect: (mintAddress: string) => void;
  disabled?: boolean;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAsset,
  onSelect,
  disabled = false,
}) => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [walletAssets, setWalletAssets] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'wallet' | 'external'>('wallet');
  const [customMint, setCustomMint] = useState('');
  const [validatingMint, setValidatingMint] = useState(false);
  const [mintValidation, setMintValidation] = useState<{
    isValid: boolean;
    error?: string;
    tokenInfo?: any;
  } | null>(null);

  // Fetch wallet assets
  useEffect(() => {
    if (!connected || !publicKey) return;

    const fetchWalletAssets = async () => {
      setLoading(true);
      try {
        // Get all token accounts for the wallet
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );

        const assets: TokenAccount[] = [];

        for (const account of tokenAccounts.value) {
          const mintInfo = account.account.data.parsed.info;
          const balance = mintInfo.tokenAmount.uiAmount;

          if (balance > 0) {
            // Fetch token metadata from Helius or Jupiter
            try {
              const tokenInfo = await fetchTokenInfo(mintInfo.mint);
              assets.push({
                mint: mintInfo.mint,
                balance,
                decimals: mintInfo.tokenAmount.decimals,
                symbol: tokenInfo?.symbol || 'UNKNOWN',
                name: tokenInfo?.name || 'Unknown Token',
                image: tokenInfo?.image || '/default-token.png',
                verified: tokenInfo?.verified || false,
              });
            } catch (error) {
              // If metadata fetch fails, still include the token with basic info
              assets.push({
                mint: mintInfo.mint,
                balance,
                decimals: mintInfo.tokenAmount.decimals,
                symbol: 'UNKNOWN',
                name: 'Unknown Token',
              });
            }
          }
        }

        setWalletAssets(assets);
      } catch (error) {
        console.error('Error fetching wallet assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAssets();
  }, [connected, publicKey, connection]);

  const fetchTokenInfo = async (mintAddress: string) => {
    // First try Helius DAS API
    try {
      const response = await fetch(`/api/token-info/${mintAddress}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Fallback to Jupiter API
      try {
        const response = await fetch(`https://tokens.jup.ag/token/${mintAddress}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (fallbackError) {
        console.warn('Failed to fetch token info from both sources');
      }
    }
    return null;
  };

  // Validate external mint address
  const validateMintAddress = async (mintAddress: string) => {
    if (!mintAddress) {
      setMintValidation(null);
      return;
    }

    try {
      new PublicKey(mintAddress); // Validate format
    } catch (error) {
      setMintValidation({
        isValid: false,
        error: 'Invalid public key format',
      });
      return;
    }

    setValidatingMint(true);
    try {
      // Check if mint account exists and get info
      const mintPublicKey = new PublicKey(mintAddress);
      const mintInfo = await getMint(connection, mintPublicKey);
      
      // Fetch token metadata
      const tokenInfo = await fetchTokenInfo(mintAddress);

      setMintValidation({
        isValid: true,
        tokenInfo: {
          ...tokenInfo,
          decimals: mintInfo.decimals,
          supply: mintInfo.supply.toString(),
        },
      });
    } catch (error) {
      setMintValidation({
        isValid: false,
        error: 'Token mint not found or invalid',
      });
    } finally {
      setValidatingMint(false);
    }
  };

  // Debounced validation for external mint
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customMint) {
        validateMintAddress(customMint);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customMint]);

  const filteredAssets = walletAssets.filter(asset =>
    asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.mint.includes(searchTerm)
  );

  const handleAssetSelect = (mintAddress: string) => {
    onSelect(mintAddress);
  };

  const handleExternalAssetAdd = () => {
    if (mintValidation?.isValid && customMint) {
      onSelect(customMint);
      setCustomMint('');
      setMintValidation(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Hash className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-gray-300">Select Asset</span>
      </div>

      {/* Tab Selection */}
      <div className="flex rounded-xl bg-gray-800/30 p-1">
        <button
          onClick={() => setSelectedTab('wallet')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            selectedTab === 'wallet'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallet Assets
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('external')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            selectedTab === 'external'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            External Asset
          </div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {selectedTab === 'wallet' && (
          <motion.div
            key="wallet"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {connected ? (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search your tokens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Asset List */}
                <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      <span className="ml-2 text-gray-400">Loading your assets...</span>
                    </div>
                  ) : filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <motion.button
                        key={asset.mint}
                        onClick={() => handleAssetSelect(asset.mint)}
                        className={`w-full p-3 rounded-xl border transition-all text-left ${
                          selectedAsset === asset.mint
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/50'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={disabled}
                      >
                        <div className="flex items-center gap-3">
                          {asset.image ? (
                            <img
                              src={asset.image}
                              alt={asset.symbol}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src = '/default-token.png';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-400">
                                {asset.symbol?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">
                                {asset.name}
                              </p>
                              {asset.verified && (
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {asset.balance.toLocaleString()} {asset.symbol}
                            </p>
                          </div>
                          {selectedAsset === asset.mint && (
                            <CheckCircle className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No tokens found in your wallet</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? 'Try a different search term' : 'Add some tokens to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 mb-2">Connect your wallet</p>
                <p className="text-sm text-gray-500">
                  Connect your wallet to see your available tokens
                </p>
              </div>
            )}
          </motion.div>
        )}

        {selectedTab === 'external' && (
          <motion.div
            key="external"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm text-gray-400">
                Token Mint Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter valid SPL token mint address..."
                  value={customMint}
                  onChange={(e) => setCustomMint(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all font-mono text-sm pr-10"
                  disabled={disabled}
                />
                {validatingMint && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Validation Result */}
            {mintValidation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-3 rounded-xl border ${
                  mintValidation.isValid
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {mintValidation.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    {mintValidation.isValid ? (
                      <div>
                        <p className="font-medium">Valid token found!</p>
                        {mintValidation.tokenInfo && (
                          <div className="mt-2 space-y-1 text-sm">
                            <p>Name: {mintValidation.tokenInfo.name || 'Unknown'}</p>
                            <p>Symbol: {mintValidation.tokenInfo.symbol || 'UNKNOWN'}</p>
                            <p>Decimals: {mintValidation.tokenInfo.decimals}</p>
                            {mintValidation.tokenInfo.verified && (
                              <p className="text-green-400">✓ Verified token</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>{mintValidation.error}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Add External Asset Button */}
            {mintValidation?.isValid && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleExternalAssetAdd}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
              >
                Use This Asset
              </motion.button>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <ExternalLink className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300 font-medium">External Asset</p>
                  <p className="text-xs text-blue-400/80 mt-1">
                    Enter any valid SPL token mint address. We'll verify the token exists and fetch metadata from trusted sources.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};