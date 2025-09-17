'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, DollarSign, Package, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettlementDetails {
  auctionId: string;
  winner: string;
  winningBid: number;
  totalBids: number;
  creator: string;
  asset: string;
}

interface SettlementNotificationProps {
  details: SettlementDetails;
  onClose: () => void;
}

export const SettlementNotification: React.FC<SettlementNotificationProps> = ({ 
  details, 
  onClose 
}) => {
  useEffect(() => {
    // Auto-close after 10 seconds
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-4 right-4 w-96 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 text-white rounded-2xl shadow-2xl overflow-hidden z-50"
      >
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 animate-pulse" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/30 rounded-full blur-xl animate-bounce" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500/30 rounded-full blur-xl animate-pulse" />
        </div>
        
        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="p-3 bg-yellow-400/20 rounded-xl"
              >
                <Trophy className="w-6 h-6 text-yellow-400" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold">Auction Settled!</h3>
                <p className="text-sm text-purple-200">ID: {details.auctionId.slice(0, 8)}...</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Settlement Details */}
          <div className="space-y-3">
            {/* Winner */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Winner</span>
              </div>
              <span className="text-sm font-mono">
                {details.winner.slice(0, 6)}...{details.winner.slice(-4)}
              </span>
            </motion.div>
            
            {/* Winning Bid */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm">Winning Bid</span>
              </div>
              <span className="text-sm font-bold">{details.winningBid} SOL</span>
            </motion.div>
            
            {/* Total Participants */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Total Bids</span>
              </div>
              <span className="text-sm">{details.totalBids}</span>
            </motion.div>
            
            {/* Asset Transfer */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="text-sm">Asset</span>
              </div>
              <span className="text-sm">Transferred ✓</span>
            </motion.div>
          </div>
          
          {/* Status Messages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-400/30"
          >
            <p className="text-xs text-green-300">
              ✓ Payment sent to creator<br/>
              ✓ Asset transferred to winner<br/>
              ✓ Non-winning bids refunded
            </p>
          </motion.div>
          
          {/* Progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-400 to-pink-400"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 10, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};