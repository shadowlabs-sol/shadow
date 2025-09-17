'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Gavel,
  DollarSign,
  Trophy,
  AlertCircle,
  Check,
  X,
  Clock,
  Trash2,
  Archive,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'bid' | 'auction' | 'settlement' | 'win' | 'outbid' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    auctionId?: string;
    amount?: number;
    bidder?: string;
    txHash?: string;
  };
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { publicKey } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);


  // Load notifications from localStorage
  useEffect(() => {
    if (publicKey) {
      loadNotifications();
    }
  }, [publicKey]);

  // Subscribe to notification events
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      const newNotification = event.detail;
      setNotifications(prev => [newNotification, ...prev]);
      
      // Save to localStorage
      if (publicKey) {
        const key = `notifications_${publicKey.toBase58()}`;
        const updated = [newNotification, ...notifications];
        localStorage.setItem(key, JSON.stringify(updated.slice(0, 50))); // Keep last 50
      }
      
      // Show toast if settings allow
      const settings = localStorage.getItem('shadowProtocolSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.notifications[newNotification.type] !== false) {
          toast.success(newNotification.title, {
            duration: 4000,
            icon: getNotificationIcon(newNotification.type)
          });
        }
      }
    };

    window.addEventListener('shadowNotification', handleNewNotification as EventListener);
    return () => {
      window.removeEventListener('shadowNotification', handleNewNotification as EventListener);
    };
  }, [publicKey, notifications]);

  const loadNotifications = () => {
    if (!publicKey) return;
    
    const key = `notifications_${publicKey.toBase58()}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'bid': return '💰';
      case 'auction': return '🔨';
      case 'settlement': return '✅';
      case 'win': return '🏆';
      case 'outbid': return '⚠️';
      case 'system': return 'ℹ️';
      default: return '📬';
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'bid': return <DollarSign className="w-4 h-4" />;
      case 'auction': return <Gavel className="w-4 h-4" />;
      case 'settlement': return <Check className="w-4 h-4" />;
      case 'win': return <Trophy className="w-4 h-4" />;
      case 'outbid': return <AlertCircle className="w-4 h-4" />;
      case 'system': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'bid': return 'text-green-400 bg-green-400/10';
      case 'auction': return 'text-blue-400 bg-blue-400/10';
      case 'settlement': return 'text-purple-400 bg-purple-400/10';
      case 'win': return 'text-yellow-400 bg-yellow-400/10';
      case 'outbid': return 'text-orange-400 bg-orange-400/10';
      case 'system': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    saveNotifications();
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    saveNotifications();
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    saveNotifications();
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications();
    toast.success('All notifications cleared');
  };

  const saveNotifications = () => {
    if (!publicKey) return;
    const key = `notifications_${publicKey.toBase58()}`;
    localStorage.setItem(key, JSON.stringify(notifications));
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-[420px] bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-2xl border-l border-purple-500/20 shadow-2xl z-50 flex flex-col"
        style={{
          boxShadow: '-20px 0 40px rgba(139, 92, 246, 0.1)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-purple-400" />
                Notifications
              </h2>
              <p className="text-sm text-gray-400 mt-1">Stay updated with your auction activity</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl transition-all group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-pink-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {filteredNotifications.length} {filter === 'unread' ? 'unread' : 'total'} notifications
            </span>
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-20">
              <div className="p-4 bg-gray-800/20 rounded-2xl mb-4">
                <Archive className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium text-gray-400">No notifications</p>
              <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative p-4 rounded-xl transition-all cursor-pointer group overflow-hidden ${
                    !notification.read 
                      ? 'bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 hover:border-purple-500/40' 
                      : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  {!notification.read && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-l-xl" />
                  )}
                  
                  <div className="flex gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110 ${
                      notification.type === 'bid' ? 'bg-blue-500/20' :
                      notification.type === 'win' ? 'bg-green-500/20' :
                      notification.type === 'outbid' ? 'bg-orange-500/20' :
                      notification.type === 'settlement' ? 'bg-purple-500/20' :
                      notification.type === 'auction' ? 'bg-pink-500/20' :
                      'bg-gray-500/20'
                    }`}>
                      {notification.type === 'bid' && <DollarSign className="w-4 h-4 text-blue-400" />}
                      {notification.type === 'win' && <Trophy className="w-4 h-4 text-green-400" />}
                      {notification.type === 'outbid' && <TrendingUp className="w-4 h-4 text-orange-400" />}
                      {notification.type === 'settlement' && <Sparkles className="w-4 h-4 text-purple-400" />}
                      {notification.type === 'auction' && <Gavel className="w-4 h-4 text-pink-400" />}
                      {notification.type === 'system' && <Bell className="w-4 h-4 text-gray-400" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/50 flex-shrink-0 mt-1"
                          />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {notification.metadata?.auctionId && (
                            <button className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
                              View →
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper function to emit notifications
export const emitNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const event = new CustomEvent('shadowNotification', {
    detail: {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false
    }
  });
  window.dispatchEvent(event);
};