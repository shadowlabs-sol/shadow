'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Globe, 
  Volume2,
  Eye,
  DollarSign,
  Zap,
  Save,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    bids: boolean;
    auctions: boolean;
    settlements: boolean;
    sounds: boolean;
  };
  privacy: {
    hideBalance: boolean;
    hideActivity: boolean;
    anonymousBidding: boolean;
  };
  preferences: {
    currency: 'SOL' | 'USD';
    language: 'en' | 'es' | 'zh' | 'ja';
    autoSettle: boolean;
    confirmTransactions: boolean;
  };
  advanced: {
    rpcEndpoint: string;
    slippage: number;
    priorityFee: number;
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  notifications: {
    bids: true,
    auctions: true,
    settlements: true,
    sounds: false,
  },
  privacy: {
    hideBalance: false,
    hideActivity: false,
    anonymousBidding: false,
  },
  preferences: {
    currency: 'SOL',
    language: 'en',
    autoSettle: false,
    confirmTransactions: true,
  },
  advanced: {
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    slippage: 0.5,
    priorityFee: 0.00001,
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'advanced'>('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);


  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('shadowProtocolSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const savedSettings = localStorage.getItem('shadowProtocolSettings');
    if (savedSettings) {
      const saved = JSON.parse(savedSettings);
      setHasChanges(JSON.stringify(saved) !== JSON.stringify(settings));
    } else {
      setHasChanges(JSON.stringify(DEFAULT_SETTINGS) !== JSON.stringify(settings));
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('shadowProtocolSettings', JSON.stringify(settings));
      
      // Apply theme
      if (settings.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else if (settings.theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
      } else if (settings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Settings saved successfully!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Settings save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string[], value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {(['general', 'notifications', 'privacy', 'advanced'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => updateSetting(['theme'], theme)}
                        className={`p-3 rounded-lg border ${
                          settings.theme === theme
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                        } transition-colors`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {theme === 'light' && <Sun className="w-5 h-5 text-yellow-400" />}
                          {theme === 'dark' && <Moon className="w-5 h-5 text-blue-400" />}
                          {theme === 'system' && <Zap className="w-5 h-5 text-purple-400" />}
                          <span className="text-xs text-gray-300 capitalize">{theme}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Display Currency</label>
                  <select
                    value={settings.preferences.currency}
                    onChange={(e) => updateSetting(['preferences', 'currency'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value="SOL">SOL</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Language</label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => updateSetting(['preferences', 'language'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>

                {/* Confirm Transactions */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Confirm Transactions</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Ask for confirmation before sending transactions</p>
                  </div>
                  <button
                    onClick={() => updateSetting(['preferences', 'confirmTransactions'], !settings.preferences.confirmTransactions)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.preferences.confirmTransactions ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.preferences.confirmTransactions ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* Bid Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Bid Notifications</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Get notified when someone bids on your auctions</p>
                  </div>
                  <button
                    onClick={() => updateSetting(['notifications', 'bids'], !settings.notifications.bids)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.notifications.bids ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.bids ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Auction Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Auction Updates</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Notifications for auction status changes</p>
                  </div>
                  <button
                    onClick={() => updateSetting(['notifications', 'auctions'], !settings.notifications.auctions)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.notifications.auctions ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.auctions ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Settlement Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Settlement Alerts</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Get notified when auctions are settled</p>
                  </div>
                  <button
                    onClick={() => updateSetting(['notifications', 'settlements'], !settings.notifications.settlements)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.notifications.settlements ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.settlements ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Effects */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Sound Effects</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Play sounds for notifications</p>
                  </div>
                  <button
                    onClick={() => updateSetting(['notifications', 'sounds'], !settings.notifications.sounds)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.notifications.sounds ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.sounds ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Hide Balance */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Hide Balance</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Hide your wallet balance from the UI</p>
                  </div>
                  <button
                    onClick={() => updateSetting(['privacy', 'hideBalance'], !settings.privacy.hideBalance)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.privacy.hideBalance ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.privacy.hideBalance ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Hide Activity */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Hide Activity</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Don't show your bidding history publicly</p>
                  </div>
                  <button
                    onClick={() => updateSetting(['privacy', 'hideActivity'], !settings.privacy.hideActivity)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.privacy.hideActivity ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.privacy.hideActivity ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Anonymous Bidding */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Anonymous Bidding</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Hide your identity when placing bids (coming soon)</p>
                  </div>
                  <button
                    disabled
                    className="relative w-12 h-6 rounded-full bg-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <div className="absolute top-1 left-1 w-4 h-4 bg-[var(--muted-foreground)] rounded-full" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                {/* RPC Endpoint */}
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">RPC Endpoint</label>
                  <input
                    type="text"
                    value={settings.advanced.rpcEndpoint}
                    onChange={(e) => updateSetting(['advanced', 'rpcEndpoint'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                    placeholder="https://mainnet.helius-rpc.com"
                  />
                </div>

                {/* Slippage Tolerance */}
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                    Slippage Tolerance ({settings.advanced.slippage}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={settings.advanced.slippage}
                    onChange={(e) => updateSetting(['advanced', 'slippage'], parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                    <span>0.1%</span>
                    <span>5%</span>
                  </div>
                </div>

                {/* Priority Fee */}
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                    Priority Fee ({settings.advanced.priorityFee} SOL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="0.01"
                    step="0.00001"
                    value={settings.advanced.priorityFee}
                    onChange={(e) => updateSetting(['advanced', 'priorityFee'], parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>

                {/* Auto-Settle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)]">Auto-Settle Auctions</label>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      <span className="text-yellow-400">⚠️ Disabled for safety</span> - Manual settlement only
                    </p>
                  </div>
                  <button
                    disabled
                    className="relative w-12 h-6 rounded-full bg-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <div className="absolute top-1 left-1 w-4 h-4 bg-[var(--muted-foreground)] rounded-full" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-800">
            <div className="text-sm text-gray-500">
              {hasChanges && 'You have unsaved changes'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  hasChanges && !saving
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};