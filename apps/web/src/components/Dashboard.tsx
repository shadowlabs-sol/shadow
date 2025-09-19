'use client';

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletAuthButton } from './WalletAuthButton';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Shield, Eye, Zap, RefreshCw, Search, Filter, 
  TrendingUp, Activity, Clock, Users, DollarSign, Award,
  ArrowUp, ArrowDown, BarChart3, PieChart, Sparkles,
  Timer, AlertCircle, CheckCircle, XCircle, ExternalLink
} from 'lucide-react';
import { useShadowProtocol } from '@/context/ShadowProtocolContext';
import { AuctionCard } from './AuctionCard';
import { WalletBalance } from './WalletBalance';

// Lazy load heavy components for better performance
const CreateAuctionModal = dynamic(() => import('./CreateAuctionModal').then(mod => ({ default: mod.CreateAuctionModal })), {
  ssr: false,
  loading: () => <div className="animate-pulse">Loading...</div>
});

const AuctionManagementModal = dynamic(() => import('./AuctionManagementModal').then(mod => ({ default: mod.AuctionManagementModal })), {
  ssr: false,
  loading: () => <div className="animate-pulse">Loading...</div>
});

const AuctionFlowIndicator = dynamic(() => import('./AuctionFlowIndicator').then(mod => ({ default: mod.AuctionFlowIndicator })), {
  ssr: false
});

const SettlementNotification = dynamic(() => import('./SettlementNotification').then(mod => ({ default: mod.SettlementNotification })), {
  ssr: false
});
import toast, { Toaster } from 'react-hot-toast';

// Optimized countdown timer with memoization
const CountdownTimer = memo(({ endTime }: { endTime: number }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;
      
      if (diff <= 0) {
        setTimeLeft('Ended');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endTime]);

  return (
    <span className={`text-sm font-mono ${timeLeft === 'Ended' ? 'text-red-500' : 'text-green-500'}`}>
      {timeLeft}
    </span>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

// Memoized stat card for better performance
const StatCard = memo(({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  prefix = '', 
  suffix = '' 
}: { 
  icon: any;
  title: string;
  value: number;
  change?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Disable animation for performance
    setDisplayValue(value);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl backdrop-blur-sm border border-purple-500/20">
          <Icon className="w-6 h-6 text-purple-600" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-[var(--foreground)]">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-[var(--foreground-dim)] mt-1">{title}</div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// Memoized activity feed
const ActivityFeed = memo(({ activities }: { activities: any[] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[var(--foreground)]">Live Activity</h3>
        <Activity className="w-5 h-5 text-[var(--primary)] animate-pulse" />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length > 0 ? (
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-[var(--muted)] rounded-lg backdrop-blur-sm hover:bg-[var(--muted-hover)] transition-all"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'bid' ? 'bg-blue-500' : 
                  activity.type === 'create' ? 'bg-green-500' : 
                  'bg-yellow-500'
                }`} />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-gray-600"> {activity.action}</span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">{activity.time}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-8 text-[var(--foreground-dim)]">
            <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--muted-foreground)]" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Activities will appear here when auctions are created or bids are placed</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

ActivityFeed.displayName = 'ActivityFeed';

export const Dashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { 
    auctions, 
    loading, 
    createAuction, 
    submitBid, 
    settleAuction,
    deleteAuction,
    refreshAuctions 
  } = useShadowProtocol();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'ending' | 'popular'>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settlementDetails, setSettlementDetails] = useState<any>(null);

  // Real activities will be fetched from blockchain events
  const [activities] = useState<any[]>([]);

  // Check for settlement notifications from window
  useEffect(() => {
    const checkSettlement = setInterval(() => {
      if ((window as any).__lastSettlement) {
        setSettlementDetails((window as any).__lastSettlement);
        delete (window as any).__lastSettlement;
      }
    }, 500);

    return () => clearInterval(checkSettlement);
  }, []);

  // Calculate statistics
  const stats = {
    totalAuctions: auctions.length,
    activeAuctions: auctions.filter((a: any) => a.status === 'ACTIVE').length,
    totalVolume: auctions.reduce((sum: number, a: any) => sum + (a.currentBid || 0), 0),
    avgBidSize: auctions.length > 0 ? 
      auctions.reduce((sum: number, a: any) => sum + (a.currentBid || 0), 0) / auctions.length : 0,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAuctions();
      toast.success('Auctions refreshed!', {
        icon: '✨',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (error) {
      toast.error('Failed to refresh auctions');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter and sort auctions
  let filteredAuctions = auctions.filter((auction: any) => {
    if (filter === 'active' && auction.status !== 'ACTIVE') return false;
    if (filter === 'ended' && auction.status === 'ACTIVE') return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        auction.title?.toLowerCase().includes(query) ||
        auction.description?.toLowerCase().includes(query) ||
        auction.auctionId?.toString().includes(query)
      );
    }
    
    return true;
  });

  // Sort auctions
  filteredAuctions = [...filteredAuctions].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'ending':
        return (a.endTime || 0) - (b.endTime || 0);
      case 'popular':
        return (b.numberOfBids || 0) - (a.numberOfBids || 0);
      case 'newest':
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });

  const features = [
    {
      icon: Shield,
      title: 'Private & Secure',
      description: 'Military-grade encryption protects your bids',
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: Eye,
      title: 'No Peeking',
      description: 'Bids stay hidden until auction ends',
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: Zap,
      title: 'Instant Wins',
      description: 'Settlement in seconds, not hours',
      color: 'from-yellow-500/20 to-orange-500/20'
    }
  ];

  if (!connected) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/5 to-indigo-500/5 rounded-full blur-[150px]" />
        </div>

        <nav className="relative z-10 border-b border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur-lg opacity-50"
                />
                <img src="/logo.png" alt="Shadow Protocol" className="relative w-10 h-10 object-contain" />
              </div>
              <span className="text-2xl font-bold text-gradient">
                Shadow Protocol
              </span>
            </motion.div>
            <WalletAuthButton />
          </div>
        </nav>

        <div className="relative z-10 flex items-center justify-center px-6 py-32">
          <motion.div 
            className="text-center max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
              style={{ backgroundSize: "200% 200%" }}
            >
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to the Shadows
              </h1>
            </motion.div>
            
            <p className="text-xl text-[var(--foreground-dim)] mb-12 leading-relaxed">
              Connect your wallet to start trading in complete privacy.
              No bots, no front-running, just fair auctions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 mx-auto backdrop-blur-sm border border-white/10`}>
                    <feature.icon className="w-7 h-7 text-[var(--primary)]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-[var(--foreground)]">{feature.title}</h3>
                  <p className="text-[var(--foreground-dim)] text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <WalletAuthButton />
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/5 to-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--glass)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <img src="/logo.png" alt="Shadow" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  Shadow Protocol
                </h1>
                <p className="text-xs text-[var(--foreground-dim)]">Private Auctions on Solana</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              <WalletBalance />
              
              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 glass-card rounded-xl hover:shadow-[var(--glow)] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-5 h-5 text-[var(--foreground-dim)] ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl font-semibold hover:shadow-[var(--glow)] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                <span>Create Auction</span>
              </motion.button>
              
              <WalletAuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Statistics Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--primary)]" />
            Network Statistics
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={DollarSign} 
              title="Total Volume" 
              value={stats.totalVolume} 
              prefix="$"
            />
            <StatCard 
              icon={Activity} 
              title="Active Auctions" 
              value={stats.activeAuctions} 
            />
            <StatCard 
              icon={Users} 
              title="Total Auctions" 
              value={stats.totalAuctions} 
            />
            <StatCard 
              icon={TrendingUp} 
              title="Avg Bid Size" 
              value={Math.floor(stats.avgBidSize)} 
              prefix="$"
            />
          </div>
        </motion.div>

        {/* Auction Flow Indicator for active auction */}
        {filteredAuctions.length > 0 && filteredAuctions[0].status === 'ACTIVE' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <AuctionFlowIndicator
              status={filteredAuctions[0].status}
              bidCount={filteredAuctions[0].bidCount || 0}
              isEncrypted={true}
            />
          </motion.div>
        )}

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 glass-card rounded-2xl p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search auctions by title, description, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--input)] rounded-xl border border-[var(--input-border)] focus:border-[var(--primary)] focus:outline-none focus:shadow-[var(--glow)] transition-all duration-300"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex bg-[var(--muted)] rounded-xl p-1">
                {(['all', 'active', 'ended'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg font-medium capitalize transition-all duration-300 ${
                      filter === f 
                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-[var(--glow)]' 
                        : 'text-[var(--foreground-dim)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-[var(--input)] rounded-xl border border-[var(--input-border)] focus:border-[var(--primary)] focus:outline-none focus:shadow-[var(--glow)] transition-all duration-300"
              >
                <option value="newest">Newest First</option>
                <option value="ending">Ending Soon</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Auctions Grid */}
          <div className="lg:col-span-2">
            <motion.h2 
              className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              Live Auctions
              <span className="ml-2 px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold rounded-full">
                {filteredAuctions.length}
              </span>
            </motion.h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-3 border-purple-600 border-t-transparent rounded-full"
                />
              </div>
            ) : filteredAuctions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 glass-card rounded-2xl"
              >
                <AlertCircle className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No auctions found</h3>
                <p className="text-[var(--foreground-dim)] mb-6">
                  {searchQuery ? 'Try adjusting your search' : 'Be the first to create one!'}
                </p>
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl font-semibold shadow-[var(--glow)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create First Auction
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredAuctions.map((auction: any, index: number) => (
                    <motion.div
                      key={auction.auctionId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <div className="relative">
                        {auction.status === 'ACTIVE' && auction.endTime && (
                          <div className="absolute -top-2 -right-2 z-10 bg-[var(--card)] rounded-full px-3 py-1 shadow-lg border border-[var(--border)]">
                            <CountdownTimer endTime={auction.endTime} />
                          </div>
                        )}
                        <AuctionCard
                          auction={auction}
                          onBid={async (auctionId: string, amount: number) => {
                            await submitBid(auctionId, amount);
                            toast.success('Bid submitted!', {
                              icon: '🎯',
                              style: {
                                borderRadius: '10px',
                                background: '#333',
                                color: '#fff',
                              },
                            });
                          }}
                          onManage={() => {
                            setSelectedAuction(auction);
                            setShowManagementModal(true);
                          }}
                          onSettle={async (auctionId: string) => {
                            await settleAuction(auctionId);
                            toast.success('Auction settled!', {
                              icon: '✅',
                              style: {
                                borderRadius: '10px',
                                background: '#333',
                                color: '#fff',
                              },
                            });
                          }}
                          isCreator={publicKey?.toString() === auction.creator}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <motion.h2 
              className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Activity className="w-5 h-5 text-[var(--primary)]" />
              Recent Activity
            </motion.h2>
            
            <ActivityFeed activities={activities} />

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-2xl p-6 text-white shadow-[var(--glow)]"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-white" />
                Your Wallet
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/80">Address</span>
                  {publicKey ? (
                    <a
                      href={`https://solscan.io/account/${publicKey.toString()}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold font-mono text-xs text-white hover:text-purple-200 transition-colors flex items-center gap-1"
                      onClick={() => toast.success('Opening wallet on Solscan')}
                    >
                      {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-bold font-mono text-xs">-</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Network</span>
                  <a
                    href="https://solscan.io/?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-white hover:text-purple-200 transition-colors flex items-center gap-1"
                    onClick={() => toast.success('Opening Solana Devnet on Solscan')}
                  >
                    Devnet
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Status</span>
                  <span className="font-bold">Connected</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateAuctionModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={async (data) => {
              try {
                await createAuction(data);
                toast.success('Auction created successfully!', {
                  icon: '🎉',
                  style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                  },
                });
                setShowCreateModal(false);
              } catch (error) {
                toast.error('Failed to create auction');
              }
            }}
          />
        )}

        {showManagementModal && selectedAuction && (
          <AuctionManagementModal
            isOpen={showManagementModal}
            auction={selectedAuction}
            isCreator={publicKey?.toString() === selectedAuction.creator}
            onClose={() => {
              setShowManagementModal(false);
              setSelectedAuction(null);
            }}
            onDelete={async () => {
              try {
                await deleteAuction(selectedAuction.auctionId);
                toast.success('Auction deleted!', {
                  icon: '🗑️',
                  style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                  },
                });
                setShowManagementModal(false);
                setSelectedAuction(null);
              } catch (error) {
                toast.error('Failed to delete auction');
              }
            }}
            onSettle={async () => {
              try {
                await settleAuction(selectedAuction.auctionId);
                toast.success('Auction settled!', {
                  icon: '✅',
                  style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                  },
                });
                setShowManagementModal(false);
                setSelectedAuction(null);
              } catch (error) {
                toast.error('Failed to settle auction');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Settlement Notification */}
      {settlementDetails && (
        <SettlementNotification
          details={settlementDetails}
          onClose={() => setSettlementDetails(null)}
        />
      )}
    </div>
  );
};