'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/AuthContext';
import { 
  X, Wallet, Shield, CheckCircle, Loader2, 
  User, Mail, Edit2, Camera, Link2, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'profile';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  mode = 'login' 
}) => {
  const { connected, publicKey } = useWallet();
  const { user, login, isLoading, refreshUser } = useAuth();
  const [currentMode, setCurrentMode] = useState(mode);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
      setCurrentMode('profile');
    } else {
      setCurrentMode('login');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    await login();
    if (user) {
      setCurrentMode('profile');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update local state with new data first for immediate feedback
      setProfileData({
        username: updatedUser.username || '',
        email: updatedUser.email || '',
        bio: updatedUser.bio || '',
        avatar: updatedUser.avatar || '',
      });
      
      // Then refresh user in context (this will update everywhere)
      await refreshUser();
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      
      // Close modal after successful save to see the updated dropdown
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="relative glass-card backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5 opacity-50" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[var(--muted)] transition-colors z-10"
              >
                <X className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>

              {currentMode === 'login' ? (
                /* Login View */
                <div className="relative p-8">
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="inline-flex p-4 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 rounded-2xl mb-4"
                    >
                      <Shield className="w-12 h-12 text-[var(--primary)]" />
                    </motion.div>
                    
                    <h2 className="text-3xl font-bold text-gradient">
                      Welcome to Shadow
                    </h2>
                    <p className="text-[var(--muted-foreground)] mt-2">
                      Sign in with your wallet to continue
                    </p>
                  </div>

                  {!connected ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-xl">
                        <p className="text-sm text-[var(--warning)]">
                          Please connect your wallet first to sign in
                        </p>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl font-semibold"
                      >
                        Connect Wallet
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[var(--foreground)]">Connected Wallet</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-xs font-mono text-[var(--primary)]">
                          {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <Wallet className="w-5 h-5" />
                            Sign Message to Login
                          </>
                        )}
                      </motion.button>

                      <div className="text-center">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Profile View */
                <div className="relative p-8">
                  <div className="text-center mb-6">
                    <div className="relative inline-block mb-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-24 h-24 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-full flex items-center justify-center text-white text-3xl font-bold"
                      >
                        {profileData.avatar ? (
                          <img 
                            src={profileData.avatar} 
                            alt="Avatar" 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          profileData.username?.charAt(0).toUpperCase() || 
                          user?.walletAddress.charAt(0).toUpperCase()
                        )}
                      </motion.div>
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 p-2 bg-[var(--primary)] text-white rounded-full shadow-lg">
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                      {profileData.username || 'Anonymous User'}
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)] font-mono">
                      {user?.walletAddress.slice(0, 8)}...{user?.walletAddress.slice(-8)}
                    </p>
                    
                    {user?.verified && (
                      <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-[var(--success)]/10 text-[var(--success)] rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          className="w-full px-4 py-2 bg-[var(--input)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)]"
                          placeholder="Enter username"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-4 py-2 bg-[var(--input)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)]"
                          placeholder="Enter email"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                          Bio
                        </label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          className="w-full px-4 py-2 bg-[var(--input)] border border-[var(--input-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--foreground)] resize-none"
                          rows={3}
                          placeholder="Tell us about yourself"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="flex-1 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Save Changes
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsEditing(false)}
                          className="flex-1 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded-xl font-semibold"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--muted)] rounded-xl">
                          <p className="text-2xl font-bold text-[var(--foreground)]">{user?.totalBids || 0}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Total Bids</p>
                        </div>
                        <div className="p-4 bg-[var(--muted)] rounded-xl">
                          <p className="text-2xl font-bold text-[var(--foreground)]">{user?.auctionsWon || 0}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Auctions Won</p>
                        </div>
                      </div>
                      
                      {profileData.bio && (
                        <div className="p-4 bg-[var(--primary)]/10 rounded-xl">
                          <p className="text-sm text-[var(--foreground)]">{profileData.bio}</p>
                        </div>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsEditing(true)}
                        className="w-full py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                      </motion.button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};