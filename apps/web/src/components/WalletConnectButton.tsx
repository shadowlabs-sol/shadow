'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useCallback, useEffect, useState } from 'react';
import { Wallet, ChevronDown, LogOut, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export const WalletConnectButton = () => {
  const { publicKey, disconnect, connecting, connected, select, wallets, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleConnect = useCallback(() => {
    if (!connected && !connecting) {
      setVisible(true);
    }
  }, [connected, connecting, setVisible]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setDropdownOpen(false);
    toast.success('Wallet disconnected');
  }, [disconnect]);

  const copyAddress = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      toast.success('Address copied!');
    }
  }, [publicKey]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Auto-select Phantom if available and not connected
  useEffect(() => {
    const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
    if (phantomWallet && !wallet && !connected) {
      select(phantomWallet.adapter.name);
    }
  }, [wallets, wallet, connected, select]);

  if (connecting) {
    return (
      <button className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Connecting...
        </div>
      </button>
    );
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors flex items-center gap-2"
      >
        {wallet?.adapter.icon && (
          <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-5 h-5" />
        )}
        <span className="text-white font-medium">
          {publicKey ? truncateAddress(publicKey.toBase58()) : 'Connected'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
          <button
            onClick={copyAddress}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Address
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};