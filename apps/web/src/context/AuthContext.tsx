'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import toast from 'react-hot-toast';

interface User {
  id: string;
  walletAddress: string;
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  verified: boolean;
  totalBids?: number;
  auctionsWon?: number;
  auctionsCreated?: number;
  totalVolume?: bigint | number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    
    try {
      const walletAddress = publicKey.toBase58();
      
      // Get nonce from server
      const nonceResponse = await fetch(`/api/auth/nonce?wallet=${walletAddress}`);
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }
      
      const { nonce, message } = await nonceResponse.json();
      
      // Sign message with wallet
      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encodedMessage);
      const signature = bs58.encode(signatureBytes);
      
      // Verify signature on server
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });
      
      if (!verifyResponse.ok) {
        throw new Error('Authentication failed');
      }
      
      const data = await verifyResponse.json();
      setUser(data.user);
      
      toast.success('Successfully logged in!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      
      // Optionally disconnect wallet
      if (connected) {
        await disconnect();
      }
      
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  }, [connected, disconnect]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      }
    } catch (error) {
      console.error('User refresh error:', error);
    }
    return null;
  }, []);

  // Auto-login when wallet connects
  useEffect(() => {
    if (connected && publicKey && !user && !isLoading) {
      // Give user a moment to see they're connected before auto-login prompt
      const timer = setTimeout(() => {
        login();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [connected, publicKey, user, isLoading, login]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};