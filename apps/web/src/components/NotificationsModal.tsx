'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  Award, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Trash2,
  Settings,
  Search,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'BID_PLACED' | 'BID_OUTBID' | 'AUCTION_WON' | 'AUCTION_LOST' | 'AUCTION_ENDED' | 'AUCTION_CREATED' | 'SYSTEM';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock notifications data - in production this would come from API
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'AUCTION_WON',
            title: 'Auction Won! 🎉',
            message: 'Congratulations! You won the auction for Mad Lads #8420',
            data: { auctionId: '1756989785908', amount: 2.5 },
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
          },
          {
            id: '2',
            type: 'BID_OUTBID',
            title: 'You have been outbid',
            message: 'Your bid of 1.8 SOL on Rare Collection has been outbid',
            data: { auctionId: '1755554142775', yourBid: 1.8, currentBid: 2.1 },
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          },
          {
            id: '3',
            type: 'AUCTION_ENDED',
            title: 'Auction Ended',
            message: 'The auction for Test Auction has ended. Settlement in progress.',
            data: { auctionId: '1756811030720' },
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
          },
          {
            id: '4',
            type: 'BID_PLACED',
            title: 'Bid Placed Successfully',
            message: 'Your bid of 1.5 SOL has been placed on Digital Art Collection',
            data: { auctionId: '1755557337809', amount: 1.5 },
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
          },
          {
            id: '5',
            type: 'SYSTEM',
            title: 'Welcome to Shadow Protocol',
            message: 'Thank you for joining Shadow Protocol! Start bidding on exclusive NFT auctions.',
            data: {},
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days ago
          }
        ];
        setNotifications(mockNotifications);
        setLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'AUCTION_WON': return <Award className="w-5 h-5 text-green-400" />;
      case 'BID_OUTBID': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'AUCTION_ENDED': return <Clock className="w-5 h-5 text-blue-400" />;
      case 'BID_PLACED': return <DollarSign className="w-5 h-5 text-purple-400" />;
      case 'AUCTION_CREATED': return <Bell className="w-5 h-5 text-cyan-400" />;
      case 'AUCTION_LOST': return <X className="w-5 h-5 text-red-400" />;
      case 'SYSTEM': return <Settings className="w-5 h-5 text-gray-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'AUCTION_WON': return 'border-green-500/30 bg-green-500/5';
      case 'BID_OUTBID': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'AUCTION_ENDED': return 'border-blue-500/30 bg-blue-500/5';
      case 'BID_PLACED': return 'border-purple-500/30 bg-purple-500/5';
      case 'AUCTION_CREATED': return 'border-cyan-500/30 bg-cyan-500/5';
      case 'AUCTION_LOST': return 'border-red-500/30 bg-red-500/5';
      case 'SYSTEM': return 'border-gray-500/30 bg-gray-500/5';
      default: return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    toast.success('Notification deleted');
  };

  const filteredNotifications = notifications
    .filter(notif => filter === 'all' || !notif.read)
    .filter(notif => 
      searchQuery === '' || 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const unreadCount = notifications.filter(notif => !notif.read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Bell className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                <p className="text-xs text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg border border-white/[0.08] transition-all"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Mark All Read
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filter === 'all' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700/70'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filter === 'unread' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700/70'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                <span className="ml-3 text-gray-400">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {searchQuery ? 'Try adjusting your search' : 'Check back later for updates'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border transition-all hover:bg-white/[0.02] ${
                      getNotificationColor(notification.type)
                    } ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-semibold text-sm ${
                            notification.read ? 'text-gray-300' : 'text-white'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        </div>
                        <p className={`text-sm mt-1 ${
                          notification.read ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};