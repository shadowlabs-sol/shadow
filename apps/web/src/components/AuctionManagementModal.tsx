'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Ban, Edit3, Eye, Users, DollarSign, Clock, Shield, TrendingDown, Award, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

interface AuctionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: any;
  onDelete: (auctionId: string) => Promise<void>;
  onCancel?: (auctionId: string) => Promise<void>;
  onSettle?: (auctionId: string) => Promise<void>;
  isCreator: boolean;
}

export const AuctionManagementModal: React.FC<AuctionManagementModalProps> = ({
  isOpen,
  onClose,
  auction,
  onDelete,
  onCancel,
  onSettle,
  isCreator
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'bids' | 'actions'>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !auction) return null;

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete(auction.auctionId);
      toast.success('Auction deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete auction');
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsProcessing(true);
    try {
      await onCancel(auction.auctionId);
      toast.success('Auction cancelled successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to cancel auction');
    } finally {
      setIsProcessing(false);
      setShowCancelConfirm(false);
    }
  };

  const handleSettle = async () => {
    if (!onSettle) return;
    setIsProcessing(true);
    try {
      await onSettle(auction.auctionId);
      toast.success('Settlement initiated');
      onClose();
    } catch (error) {
      toast.error('Failed to settle auction');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    switch (auction.status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'ENDED': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'SETTLED': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getTypeIcon = () => {
    switch (auction.type) {
      case 'SEALED': return <Shield className="w-5 h-5" />;
      case 'DUTCH': return <TrendingDown className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-700/50">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-gray-700/50 p-6">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-800/50 rounded-xl">
                    {getTypeIcon()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {auction.title || `Auction #${auction.auctionId.slice(0, 8)}`}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Created by {auction.creator.slice(0, 6)}...{auction.creator.slice(-4)}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full border ${getStatusColor()}`}>
                    <span className="text-xs font-semibold uppercase">{auction.status}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-700/50">
                {['details', 'bids', 'actions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[400px]">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Description */}
                    {auction.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                        <p className="text-gray-300">{auction.description}</p>
                      </div>
                    )}

                    {/* Auction Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">Start Time</span>
                        </div>
                        <p className="text-sm text-white">
                          {format(new Date(auction.startTime), 'PPp')}
                        </p>
                      </div>

                      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">End Time</span>
                        </div>
                        <p className="text-sm text-white">
                          {format(new Date(auction.endTime), 'PPp')}
                        </p>
                      </div>

                      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs">Minimum Bid</span>
                        </div>
                        <p className="text-sm text-white">
                          {auction.minimumBid ? (parseFloat(auction.minimumBid) / 1e9).toFixed(4) : '0'} SOL
                        </p>
                      </div>

                      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Users className="w-4 h-4" />
                          <span className="text-xs">Total Bids</span>
                        </div>
                        <p className="text-sm text-white">{auction.bidCount || 0}</p>
                      </div>

                      {auction.type === 'DUTCH' && (
                        <>
                          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <TrendingDown className="w-4 h-4" />
                              <span className="text-xs">Starting Price</span>
                            </div>
                            <p className="text-sm text-white">
                              {auction.startingPrice ? (parseFloat(auction.startingPrice) / 1e9).toFixed(4) : '0'} SOL
                            </p>
                          </div>

                          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <TrendingDown className="w-4 h-4" />
                              <span className="text-xs">Current Price</span>
                            </div>
                            <p className="text-sm text-white">
                              {auction.currentPrice ? (parseFloat(auction.currentPrice) / 1e9).toFixed(4) : '0'} SOL
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Winner Info */}
                    {auction.winner && (
                      <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl p-4 border border-purple-500/30">
                        <h3 className="text-sm font-semibold text-purple-300 mb-3">Auction Winner</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                            <p className="text-sm font-mono text-white">
                              {auction.winner.slice(0, 8)}...{auction.winner.slice(-8)}
                            </p>
                          </div>
                          {auction.winningAmount && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400 mb-1">Winning Bid</p>
                              <p className="text-lg font-bold text-white">
                                {(parseFloat(auction.winningAmount) / 1e9).toFixed(4)} SOL
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Technical Details */}
                    <div className="pt-4 border-t border-gray-700/30">
                      <h3 className="text-sm font-semibold text-gray-400 mb-3">Technical Details</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Auction ID:</span>
                          <span className="font-mono text-gray-400">{auction.auctionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Asset Mint:</span>
                          <span className="font-mono text-gray-400">{auction.assetMint.slice(0, 12)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction:</span>
                          <span className="font-mono text-gray-400">{auction.transactionHash?.slice(0, 12)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'bids' && (
                  <div className="space-y-4">
                    {auction.bids && auction.bids.length > 0 ? (
                      <div className="space-y-3">
                        {auction.bids.map((bid: any, index: number) => (
                          <div
                            key={bid.id}
                            className={`p-4 rounded-xl border ${
                              bid.isWinner
                                ? 'bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/30'
                                : 'bg-gray-800/30 border-gray-700/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-mono text-white">
                                    {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDistanceToNow(new Date(bid.timestamp), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                              {bid.isWinner && (
                                <div className="flex items-center gap-2 text-green-400">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-semibold">Winner</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No bids yet</p>
                        <p className="text-xs text-gray-500 mt-1">Bids are encrypted until settlement</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'actions' && (
                  <div className="space-y-4">
                    {!isCreator ? (
                      <div className="text-center py-12">
                        <Info className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No actions available</p>
                        <p className="text-xs text-gray-500 mt-1">Only the auction creator can manage this auction</p>
                      </div>
                    ) : (
                      <>
                        {/* Settle Auction */}
                        {auction.status === 'ENDED' && onSettle && (
                          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                            <div className="flex items-start gap-3">
                              <Award className="w-5 h-5 text-blue-400 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-white mb-1">Settle Auction</h4>
                                <p className="text-sm text-gray-400 mb-3">
                                  Finalize the auction and determine the winner through the MPC network.
                                </p>
                                <button
                                  onClick={handleSettle}
                                  disabled={isProcessing}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isProcessing ? 'Processing...' : 'Settle Now'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cancel Auction */}
                        {auction.status === 'ACTIVE' && onCancel && (
                          <>
                            {!showCancelConfirm ? (
                              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                <div className="flex items-start gap-3">
                                  <Ban className="w-5 h-5 text-yellow-400 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-1">Cancel Auction</h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                      Stop the auction before it ends. Bids will be refunded.
                                    </p>
                                    <button
                                      onClick={() => setShowCancelConfirm(true)}
                                      disabled={isProcessing}
                                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Cancel Auction
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-1">Confirm Cancellation</h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                      Are you sure? This will cancel the auction and refund all bids.
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleCancel}
                                        disabled={isProcessing}
                                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isProcessing ? 'Cancelling...' : 'Yes, Cancel'}
                                      </button>
                                      <button
                                        onClick={() => setShowCancelConfirm(false)}
                                        disabled={isProcessing}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        No, Keep Active
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Delete Auction */}
                        {auction.status !== 'SETTLED' && (
                          <>
                            {!showDeleteConfirm ? (
                              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <div className="flex items-start gap-3">
                                  <Trash2 className="w-5 h-5 text-red-400 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-1">Delete Auction</h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                      Permanently remove this auction from the database. This cannot be undone.
                                    </p>
                                    <button
                                      onClick={() => setShowDeleteConfirm(true)}
                                      disabled={isProcessing}
                                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Delete Auction
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-1">Confirm Deletion</h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                      This action cannot be undone. The auction and all associated data will be permanently deleted.
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleDelete}
                                        disabled={isProcessing}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isProcessing ? 'Deleting...' : 'Yes, Delete'}
                                      </button>
                                      <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isProcessing}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* No Actions Available */}
                        {auction.status === 'SETTLED' && (
                          <div className="text-center py-12">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="text-gray-400">Auction Completed</p>
                            <p className="text-xs text-gray-500 mt-1">This auction has been settled successfully</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};