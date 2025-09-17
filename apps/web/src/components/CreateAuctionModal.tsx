'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, TrendingDown, Lock, Hash, FileText, Clock, Coins } from 'lucide-react';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: any) => void;
}

export const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  const [auctionType, setAuctionType] = useState<'sealed' | 'dutch'>('sealed');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetMint: '',
    duration: 24,
    minimumBid: '',
    reservePrice: '',
    startingPrice: '',
    priceDecreaseRate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      type: auctionType,
      ...formData,
      duration: formData.duration * 3600, // Convert hours to seconds
      minimumBid: parseFloat(formData.minimumBid),
      reservePrice: parseFloat(formData.reservePrice),
      startingPrice: auctionType === 'dutch' ? parseFloat(formData.startingPrice) : undefined,
      priceDecreaseRate: auctionType === 'dutch' ? parseFloat(formData.priceDecreaseRate) : undefined,
    });
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 m-auto w-[calc(100%-2rem)] md:w-full md:max-w-2xl h-fit max-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-900 to-black border border-gray-800/50 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-xl border-b border-gray-800/50 px-6 py-4 -mx-6 -mt-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Create Auction</h2>
                  <p className="text-sm text-gray-500 mt-1">List your asset for private bidding</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-gray-800/50 rounded-xl transition-all hover:rotate-90 duration-200"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Auction Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rare NFT Collection #42"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-800/70 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Description
                </label>
                <textarea
                  placeholder="Describe what you're auctioning..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-800/70 focus:outline-none resize-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Auction Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAuctionType('sealed')}
                    className={`relative py-4 px-4 rounded-xl border-2 transition-all ${
                      auctionType === 'sealed'
                        ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/20'
                        : 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <Lock className="w-5 h-5 mx-auto mb-2" />
                    <span className="font-medium">Sealed Bid</span>
                    {auctionType === 'sealed' && (
                      <motion.div
                        layoutId="auctionType"
                        className="absolute inset-0 border-2 border-purple-400 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuctionType('dutch')}
                    className={`relative py-4 px-4 rounded-xl border-2 transition-all ${
                      auctionType === 'dutch'
                        ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/20'
                        : 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 mx-auto mb-2" />
                    <span className="font-medium">Dutch</span>
                    {auctionType === 'dutch' && (
                      <motion.div
                        layoutId="auctionType"
                        className="absolute inset-0 border-2 border-blue-400 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Hash className="w-4 h-4 text-purple-400" />
                  Asset Mint Address
                </label>
                <input
                  type="text"
                  value={formData.assetMint}
                  onChange={(e) => handleInputChange('assetMint', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-800/70 focus:outline-none transition-all font-mono text-sm"
                  placeholder="Enter token mint address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-800/70 focus:outline-none transition-all pr-16"
                      placeholder="24"
                      min="1"
                      max="720"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">hours</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Coins className="w-4 h-4 text-purple-400" />
                    Reserve Price
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.reservePrice}
                      onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-800/70 focus:outline-none transition-all pr-16"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">SOL</span>
                  </div>
                </div>
              </div>

              {auctionType === 'sealed' && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <DollarSign className="w-4 h-4 text-purple-400" />
                    Minimum Bid
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.minimumBid}
                      onChange={(e) => handleInputChange('minimumBid', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-800/70 focus:outline-none transition-all pr-16"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">SOL</span>
                  </div>
                </div>
              )}

              {auctionType === 'dutch' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <DollarSign className="w-4 h-4 text-purple-400" />
                      Starting Price
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.startingPrice}
                        onChange={(e) => handleInputChange('startingPrice', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-800/70 focus:outline-none transition-all pr-16"
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">SOL</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <TrendingDown className="w-4 h-4 text-purple-400" />
                      Decrease Rate
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.priceDecreaseRate}
                        onChange={(e) => handleInputChange('priceDecreaseRate', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-800/70 focus:outline-none transition-all pr-20"
                        placeholder="0.00"
                        step="0.001"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">SOL/s</span>
                    </div>
                  </div>
                </div>
              )}

            </form>
            
            {/* Fixed Footer with Action Buttons */}
            <div className="sticky bottom-0 bg-gradient-to-t from-black via-gray-900/98 to-gray-900/95 backdrop-blur-xl border-t border-gray-800/50 px-6 py-4 -mx-6 -mb-6 mt-6">
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Auction
                </button>
                <button
                  onClick={onClose}
                  className="px-8 py-3.5 bg-gray-800/50 text-gray-400 rounded-xl hover:bg-gray-800/70 border border-gray-700/50 transition-all duration-200 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                🔐 Your reserve price will be encrypted using zero-knowledge proofs
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};