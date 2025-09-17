'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, Shield, TrendingDown, Award, ArrowRight, Loader2, MoreHorizontal, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AuctionTimer } from './AuctionTimer';
import toast from 'react-hot-toast';

interface AuctionCardProps {
  auction: any;
  onBid: (auctionId: string, amount: number) => Promise<void>;
  onSettle: (auctionId: string) => Promise<void>;
  onManage?: () => void;
  isCreator?: boolean;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onBid, onSettle, onManage, isCreator }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [showBidInput, setShowBidInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    const minBidInSol = auction.minimumBid ? parseFloat(auction.minimumBid) / 1e9 : 0;
    if (minBidInSol && amount < minBidInSol) {
      toast.error(`Minimum bid is ${minBidInSol.toFixed(4)} SOL`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onBid(auction.auctionId, amount);
      setBidAmount('');
      setShowBidInput(false);
      toast.success('Bid submitted successfully!');
    } catch (error) {
      console.error('Failed to submit bid:', error);
      toast.error('Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettle = async () => {
    setIsSubmitting(true);
    try {
      await onSettle(auction.auctionId);
      toast.success('Auction settled successfully!');
    } catch (error) {
      console.error('Failed to settle auction:', error);
      toast.error('Failed to settle auction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeRemaining = auction.endTime ? formatDistanceToNow(new Date(auction.endTime)) : 'N/A';
  const isActive = auction.status === 'ACTIVE';
  const isEnded = auction.status === 'ENDED' || auction.status === 'SETTLED';
  const canSettle = auction.status === 'ENDED';

  const getStatusColor = () => {
    switch (auction.status) {
      case 'ACTIVE': return 'from-emerald-400 to-green-400';
      case 'ENDED': return 'from-amber-400 to-orange-400';
      case 'SETTLED': return 'from-blue-400 to-indigo-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getTypeIcon = () => {
    switch (auction.type) {
      case 'SEALED': return <Shield className="w-4 h-4" />;
      case 'DUTCH': return <TrendingDown className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      {/* Modern Glass Card with Noise */}
      <div className="relative bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.015]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
          }}
        />

        {/* Gradient Glow Effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Top Section with Glass Effect */}
        <div className="relative">
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg blur-md" />
                <div className="relative p-2 bg-black/20 backdrop-blur-sm rounded-lg border border-white/[0.08]">
                  {getTypeIcon()}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  {auction.type} Auction
                </p>
                <h3 className="text-sm font-semibold text-white">
                  {auction.title || `Auction #${auction.auctionId.slice(0, 8)}`}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Timer for active auctions */}
              {auction.status === 'ACTIVE' && auction.endTime && (
                <AuctionTimer
                  auctionId={auction.auctionId}
                  endTime={auction.endTime}
                  status={auction.status}
                />
              )}
              
              {/* Status Badge with Glow */}
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${getStatusColor()} rounded-full blur-md opacity-60`} />
                <div className="relative px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/[0.08]">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {auction.status}
                  </span>
                </div>
              </div>

              {/* Manage Button */}
              {onManage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onManage();
                  }}
                  className="p-2 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-sm rounded-lg border border-white/[0.08] hover:border-white/[0.12] transition-all"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-4">
            {/* Description */}
            {auction.description && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {auction.description}
              </p>
            )}

            {/* Stats Grid with Glass Cards */}
            <div className="grid grid-cols-3 gap-2">
              {/* Time Left */}
              <div className="relative group/stat">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent rounded-lg blur-md opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                <div className="relative p-3 bg-white/[0.02] backdrop-blur-sm rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] text-gray-500">Time</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    {isActive ? timeRemaining : isEnded ? 'Ended' : 'Soon'}
                  </p>
                </div>
              </div>

              {/* Bids */}
              <div className="relative group/stat">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent rounded-lg blur-md opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                <div className="relative p-3 bg-white/[0.02] backdrop-blur-sm rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-gray-500">Bids</span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {auction.bidCount || 0}
                  </p>
                </div>
              </div>

              {/* Min Bid */}
              <div className="relative group/stat">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent rounded-lg blur-md opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                <div className="relative p-3 bg-white/[0.02] backdrop-blur-sm rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-gray-500">Min</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    {auction.minimumBid ? (parseFloat(auction.minimumBid) / 1e9).toFixed(2) : '0'} SOL
                  </p>
                </div>
              </div>
            </div>

            {/* Dutch Auction Current Price */}
            {auction.type === 'DUTCH' && auction.currentPrice && (
              <div className="p-3 bg-gradient-to-r from-orange-600/10 to-amber-600/10 backdrop-blur-sm rounded-lg border border-orange-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-gray-400">Current Price</span>
                  </div>
                  <p className="text-sm font-bold text-orange-400">
                    {(parseFloat(auction.currentPrice) / 1e9).toFixed(4)} SOL
                  </p>
                </div>
              </div>
            )}

            {/* Winner Info */}
            {auction.winner && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg blur-md" />
                <div className="relative p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-[10px] text-purple-400">Winner</p>
                        <p className="text-xs font-mono text-white">
                          {auction.winner.slice(0, 6)}...{auction.winner.slice(-4)}
                        </p>
                      </div>
                    </div>
                    {auction.winningAmount && (
                      <p className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {(parseFloat(auction.winningAmount) / 1e9).toFixed(4)} SOL
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isActive && !showBidInput && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowBidInput(true)}
                className="relative w-full group/btn overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <div className="relative py-3 px-4 bg-black/20 backdrop-blur-sm rounded-lg border border-white/[0.08] flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold text-sm">Place Encrypted Bid</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            )}

            {isActive && showBidInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter bid amount"
                    className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none pr-16"
                    step="0.01"
                    min={auction.minimumBid || '0'}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">SOL</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBid}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Submit Bid
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowBidInput(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-sm text-gray-400 rounded-lg border border-white/[0.08] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {canSettle && (
              <button
                onClick={handleSettle}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Settling...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Settle Auction
                  </>
                )}
              </button>
            )}

            {auction.status === 'SETTLED' && (
              <div className="py-2.5 px-3 bg-white/[0.02] backdrop-blur-sm rounded-lg border border-white/[0.06] text-center">
                <p className="text-xs text-gray-400">✓ Auction Completed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};