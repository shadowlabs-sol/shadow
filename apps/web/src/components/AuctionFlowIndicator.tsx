'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Unlock, Trophy, Send, Eye, EyeOff, Sparkles } from 'lucide-react';

interface AuctionFlowIndicatorProps {
  status: 'CREATED' | 'ACTIVE' | 'ENDED' | 'SETTLED';
  bidCount: number;
  isEncrypted: boolean;
}

export const AuctionFlowIndicator: React.FC<AuctionFlowIndicatorProps> = ({ 
  status, 
  bidCount, 
  isEncrypted 
}) => {
  const stages = [
    {
      name: 'Setup',
      icon: Shield,
      description: 'Auction initialized with encrypted reserve',
      active: true,
      completed: true
    },
    {
      name: 'Bidding',
      icon: isEncrypted ? Lock : Send,
      description: `${bidCount} encrypted bids submitted`,
      active: status === 'ACTIVE',
      completed: status !== 'CREATED' && status !== 'ACTIVE'
    },
    {
      name: 'Settlement',
      icon: Unlock,
      description: 'Arcium MPC processes bids',
      active: status === 'ENDED',
      completed: status === 'SETTLED'
    },
    {
      name: 'Transfer',
      icon: Trophy,
      description: 'Assets transferred to winner',
      active: false,
      completed: status === 'SETTLED'
    }
  ];

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-600/5 to-purple-600/5 rounded-2xl blur-xl" />
      
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Auction Flow
          </h3>
          {isEncrypted && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 rounded-full">
              <EyeOff className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">MEV Protected</span>
            </div>
          )}
        </div>

        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              initial={{ width: '0%' }}
              animate={{ 
                width: status === 'CREATED' ? '0%' :
                       status === 'ACTIVE' ? '25%' :
                       status === 'ENDED' ? '50%' :
                       '100%'
              }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="relative grid grid-cols-4 gap-4">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Stage indicator */}
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      stage.completed 
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-200/50' 
                        : stage.active
                        ? 'bg-white border-2 border-purple-600 text-purple-600 animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <stage.icon className="w-5 h-5" />
                    
                    {/* Active indicator */}
                    {stage.active && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-purple-600"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>

                  <div className="mt-3 text-center">
                    <p className={`text-sm font-semibold ${
                      stage.completed || stage.active ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {stage.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 max-w-[100px]">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Status message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
        >
          <p className="text-sm text-gray-700">
            {status === 'CREATED' && '🚀 Auction created and ready to accept bids'}
            {status === 'ACTIVE' && `🔐 ${bidCount} encrypted bids received - MEV protection active`}
            {status === 'ENDED' && '⏳ Processing bids through Arcium MPC network...'}
            {status === 'SETTLED' && '✅ Winner determined! Assets transferred successfully'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};