'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Settings, Bell, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { SettingsModal } from './SettingsModal';
import { NotificationsPanel } from './NotificationsPanel';
import { useShadowProtocol } from '@/context/ShadowProtocolContext';
import { useConnection } from '@solana/wallet-adapter-react';

export const WalletButton: React.FC = () => {
  const { publicKey, disconnect, wallet, connected, connecting, select, wallets, connect } = useWallet();
  const { connection } = useConnection();
  const { userBids, auctions } = useShadowProtocol();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [balance, setBalance] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Calculate user stats
  const userStats = useMemo(() => {
    const totalBids = userBids?.length || 0;
    const wonAuctions = userBids?.filter((bid: any) => bid.isWinner).length || 0;
    return { totalBids, wonAuctions };
  }, [userBids]);
  
  // Listen for wallet selection and auto-connect
  useEffect(() => {
    if (wallet && !connected && !connecting) {
      connect().catch((err) => {
        console.error('Failed to connect wallet:', err);
        toast.error('Failed to connect wallet. Please try again.');
      });
    }
  }, [wallet, connected, connecting, connect]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey && connection) {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / 1e9); // Convert lamports to SOL
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      }
    };
    
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [publicKey, connection]);
  
  // Check for unread notifications
  useEffect(() => {
    if (publicKey) {
      const checkUnread = () => {
        const key = `notifications_${publicKey.toBase58()}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const notifications = JSON.parse(saved);
            const unread = notifications.filter((n: any) => !n.read).length;
            setUnreadCount(unread);
          } catch (error) {
            console.error('Failed to load notifications:', error);
          }
        }
      };
      
      checkUnread();
      const interval = setInterval(checkUnread, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      // First try to open the modal
      setVisible(true);
      
      // If wallets are available, log them for debugging
      if (wallets && wallets.length > 0) {
        console.log('Available wallets:', wallets.map(w => w.adapter.name));
      }
    } catch (error) {
      console.error('Error opening wallet modal:', error);
      toast.error('Failed to open wallet selector');
    }
  }, [setVisible, wallets]);

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
    toast.success('Wallet disconnected');
  };

  const handleChangeWallet = () => {
    disconnect();
    setDropdownOpen(false);
    setTimeout(() => {
      setVisible(true);
    }, 200);
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      toast.success('Address copied to clipboard');
    }
  };

  const openExplorer = () => {
    if (publicKey) {
      window.open(
        `https://explorer.solana.com/address/${publicKey.toBase58()}`,
        '_blank'
      );
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)]"
      >
        <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!connected || !publicKey) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-pink-500 text-[var(--primary-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] transition-colors"
      >
        {wallet?.adapter.icon && (
          <img 
            src={wallet.adapter.icon} 
            alt={wallet.adapter.name} 
            className="w-5 h-5"
          />
        )}
        <span className="text-[var(--foreground)] font-medium">
          {truncateAddress(publicKey.toBase58())}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-80 bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-2xl border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden z-50"
            style={{
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15), 0 0 80px rgba(139, 92, 246, 0.1)'
            }}
          >
            {/* Profile Header */}
            <div className="relative p-6 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-transparent border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 animate-pulse" />
              <div className="relative flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {publicKey?.toBase58().slice(0, 1).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
                </div>
                
                {/* User Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {truncateAddress(publicKey.toBase58())}
                  </h3>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    {wallet?.adapter.icon && (
                      <img src={wallet.adapter.icon} alt="" className="w-4 h-4" />
                    )}
                    {wallet?.adapter.name || 'Wallet'}
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{userStats.totalBids}</div>
                  <div className="text-xs text-gray-500 mt-1">Bids</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{userStats.wonAuctions}</div>
                  <div className="text-xs text-gray-500 mt-1">Won</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{balance.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">SOL</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2" style={{ pointerEvents: 'auto' }}>

              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => {
                    setNotificationsOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 rounded-xl transition-all group border border-blue-500/20 hover:border-blue-500/40 relative"
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-all">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-pink-500 text-white text-xs font-bold rounded-full shadow-lg shadow-pink-500/50">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSettingsOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-xl transition-all group border border-purple-500/20 hover:border-purple-500/40"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-all">
                    <Settings className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-white">Settings</span>
                </button>
              </div>
              
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent my-2" />
              
              {/* Wallet Actions */}
              <div className="space-y-1 mb-2">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all group"
                >
                  <div className="p-2 bg-gray-500/10 rounded-lg group-hover:bg-gray-500/20 transition-colors">
                    <Copy className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-gray-300">Copy Address</span>
                </button>

                <button
                  onClick={openExplorer}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all group"
                >
                  <div className="p-2 bg-gray-500/10 rounded-lg group-hover:bg-gray-500/20 transition-colors">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-gray-300">View on Explorer</span>
                </button>

                <button
                  onClick={handleChangeWallet}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all group"
                >
                  <div className="p-2 bg-gray-500/10 rounded-lg group-hover:bg-gray-500/20 transition-colors">
                    <Wallet className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-gray-300">Change Wallet</span>
                </button>
              </div>
              
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent my-2" />
              
              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl transition-all group"
              >
                <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-red-400 font-medium">Disconnect</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </div>
  );
};