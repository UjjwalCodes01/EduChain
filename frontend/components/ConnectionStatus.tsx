'use client';

/**
 * ConnectionStatus Component
 * Shows wallet connection and network status
 */

import { useWeb3 } from '@/lib/hooks';
import { formatAddress } from '@/lib/contracts';
import { NETWORK_CONFIG } from '@/lib/contracts';

export default function ConnectionStatus() {
  const { account, chainId, isCorrectNetwork, isConnecting, connect, disconnect, switchNetwork } = useWeb3();

  if (!account) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? 'Connecting...' : '🔗 Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Network Status */}
      {!isCorrectNetwork && (
        <button
          onClick={switchNetwork}
          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          title="Wrong Network"
        >
          ⚠️ Switch to {NETWORK_CONFIG.chainName}
        </button>
      )}

      {isCorrectNetwork && (
        <div className="px-3 py-2 bg-green-600/20 border border-green-600/50 rounded-lg text-green-400 text-sm font-medium flex items-center gap-2">
          ✓ {NETWORK_CONFIG.chainName}
        </div>
      )}

      {/* Wallet Address */}
      <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm flex items-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        {formatAddress(account)}
      </div>

      {/* Disconnect Button */}
      <button
        onClick={disconnect}
        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg text-sm transition-colors"
        title="Disconnect Wallet"
      >
        🚪
      </button>
    </div>
  );
}
