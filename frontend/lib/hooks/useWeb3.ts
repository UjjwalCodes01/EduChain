'use client';

/**
 * useWeb3 Hook
 * React hook for managing Web3 wallet connection and state
 */

import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  getConnectedWallet,
  getChainId,
  isCorrectNetwork as checkNetwork,
  switchToCorrectNetwork,
  onAccountsChanged,
  onChainChanged,
  removeListeners,
  isMetaMaskInstalled,
} from '@/lib/web3';
import { NETWORK_CONFIG } from '@/lib/contracts';

export const useWeb3 = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMask, setIsMetaMask] = useState(false);

  // Check MetaMask installation
  useEffect(() => {
    setIsMetaMask(isMetaMaskInstalled());
  }, []);

  // Load initial wallet state
  useEffect(() => {
    const loadWallet = async () => {
      const address = await getConnectedWallet();
      const chain = await getChainId();
      
      setAccount(address);
      setChainId(chain);
      setIsCorrectNetwork(chain === NETWORK_CONFIG.chainId);
    };

    if (isMetaMask) {
      loadWallet();
    }
  }, [isMetaMask]);

  // Setup event listeners
  useEffect(() => {
    if (!isMetaMask) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
      } else {
        setAccount(accounts[0]);
        // Save to localStorage
        localStorage.setItem('userWallet', accounts[0]);
      }
    };

    const handleChainChanged = async (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      setIsCorrectNetwork(newChainId === NETWORK_CONFIG.chainId);
      
      // Reload page on network change (recommended by MetaMask)
      window.location.reload();
    };

    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);

    return () => {
      removeListeners();
    };
  }, [isMetaMask]);

  // Connect wallet function
  const connect = useCallback(async () => {
    if (!isMetaMask) {
      alert('Please install MetaMask to use this app');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    setIsConnecting(true);
    try {
      const address = await connectWallet();
      if (address) {
        setAccount(address);
        localStorage.setItem('userWallet', address);

        // Check network
        const chain = await getChainId();
        setChainId(chain);
        const correctNetwork = chain === NETWORK_CONFIG.chainId;
        setIsCorrectNetwork(correctNetwork);

        if (!correctNetwork) {
          const switched = await switchToCorrectNetwork();
          if (switched) {
            setIsCorrectNetwork(true);
          }
        }
      }
      return address;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMask]);

  // Disconnect wallet function
  const disconnect = useCallback(() => {
    setAccount(null);
    localStorage.removeItem('userWallet');
    localStorage.removeItem('userRole');
  }, []);

  // Switch network function
  const switchNetwork = useCallback(async () => {
    const success = await switchToCorrectNetwork();
    if (success) {
      const chain = await getChainId();
      setChainId(chain);
      setIsCorrectNetwork(true);
    }
    return success;
  }, []);

  return {
    account,
    chainId,
    isCorrectNetwork,
    isConnecting,
    isMetaMask,
    connect,
    disconnect,
    switchNetwork,
  };
};
