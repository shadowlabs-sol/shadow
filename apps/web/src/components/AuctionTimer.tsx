'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { useShadowProtocol } from '@/context/ShadowProtocolContext';
import toast from 'react-hot-toast';

interface AuctionTimerProps {
  auctionId: string;
  endTime: Date;
  status: string;
  onExpiry?: () => void;
}

export const AuctionTimer: React.FC<AuctionTimerProps> = ({ 
  auctionId, 
  endTime, 
  status,
  onExpiry 
}) => {
  const { settleAuction } = useShadowProtocol();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [autoSettling, setAutoSettling] = useState(false);
  
  useEffect(() => {
    // Don't run timer for non-active auctions
    if (status !== 'ACTIVE') {
      return;
    }
    
    const timer = setInterval(async () => {
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const diff = end - now;
      
      if (diff <= 0 && !isExpired) {
        setTimeLeft('EXPIRED');
        setIsExpired(true);
        clearInterval(timer);
        
        // DISABLED AUTO-SETTLEMENT TO PREVENT WALLET DRAIN
        // Auto-settlement should be triggered manually or by a backend service
        // not by the frontend timer
        /*
        if (!autoSettling) {
          setAutoSettling(true);
          toast.loading('⏰ Auction expired! Auto-settling...', { id: 'auto-settle' });
          
          setTimeout(async () => {
            try {
              await settleAuction(auctionId);
              toast.dismiss('auto-settle');
              toast.success('Auction auto-settled successfully!');
              if (onExpiry) onExpiry();
            } catch (error) {
              toast.dismiss('auto-settle');
              toast.error('Auto-settlement failed. Please settle manually.');
            }
            setAutoSettling(false);
          }, 3000);
        }
        */
        
        // Just notify that auction expired
        toast.error('⏰ Auction has expired! Please settle manually.', {
          id: `expired-${auctionId}`,
          duration: 5000
        });
        
        if (onExpiry) onExpiry();
        return;
      }
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
        
        // Warning when less than 5 minutes
        if (diff < 5 * 60 * 1000 && diff > 4 * 60 * 1000) {
          toast('⏰ Auction ending in 5 minutes!', { 
            icon: '⚠️',
            id: 'time-warning-5'
          });
        }
        
        // Warning when less than 1 minute
        if (diff < 60 * 1000 && diff > 59 * 1000) {
          toast('🚨 Auction ending in 1 minute!', { 
            icon: '🔔',
            id: 'time-warning-1'
          });
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [auctionId, endTime, status, isExpired, autoSettling, settleAuction, onExpiry]);
  
  if (status !== 'ACTIVE') {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        isExpired 
          ? 'bg-red-100 text-red-700 border border-red-200' 
          : timeLeft.includes('m') && !timeLeft.includes('h')
          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
          : 'bg-green-100 text-green-700 border border-green-200'
      }`}
    >
      {isExpired ? (
        <AlertCircle className="w-4 h-4 animate-pulse" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span>{timeLeft}</span>
      {autoSettling && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
    </motion.div>
  );
};