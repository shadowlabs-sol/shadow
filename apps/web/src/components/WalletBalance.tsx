'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, RefreshCw } from 'lucide-react';

export const WalletBalance: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchBalance = async () => {
    if (!publicKey) return;
    
    try {
      setIsRefreshing(true);
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      
      // Subscribe to balance changes
      const subscriptionId = connection.onAccountChange(
        publicKey,
        (accountInfo) => {
          setBalance(accountInfo.lamports / 1e9);
        },
        'confirmed'
      );
      
      return () => {
        connection.removeAccountChangeListener(subscriptionId);
      };
    }
  }, [connected, publicKey, connection]);
  
  if (!connected) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-200"
      >
        <Wallet className="w-4 h-4 text-purple-600" />
        <div className="flex flex-col">
          <span className="text-xs text-gray-600">Balance</span>
          <span className="text-sm font-bold text-gray-900">
            {balance.toFixed(4)} SOL
          </span>
        </div>
        <button
          onClick={fetchBalance}
          disabled={isRefreshing}
          className="ml-2 p-1.5 hover:bg-white/50 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};