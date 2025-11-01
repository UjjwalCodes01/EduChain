/**
 * Web3 Provider Utilities
 * Helper functions for blockchain interactions
 */

import { ethers, BrowserProvider, JsonRpcProvider } from 'ethers';
import { NETWORK_CONFIG, POOL_FACTORY_ADDRESS, FACTORY_ABI, POOL_ABI } from './contracts';

/**
 * Get the browser provider (MetaMask)
 */
export const getBrowserProvider = async (): Promise<BrowserProvider | null> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  return new ethers.BrowserProvider(window.ethereum);
};

/**
 * Get a read-only provider (for queries without wallet)
 */
export const getReadOnlyProvider = (): JsonRpcProvider => {
  return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
};

/**
 * Request wallet connection
 */
export const connectWallet = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = await getBrowserProvider();
    if (!provider) return null;

    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
};

/**
 * Get current connected wallet address
 */
export const getConnectedWallet = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) return null;

    const provider = await getBrowserProvider();
    if (!provider) return null;

    const accounts = await provider.listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  } catch (error) {
    console.error('Error getting connected wallet:', error);
    return null;
  }
};

/**
 * Get current network chain ID
 */
export const getChainId = async (): Promise<number | null> => {
  try {
    if (!window.ethereum) return null;

    const provider = await getBrowserProvider();
    if (!provider) return null;

    const network = await provider.getNetwork();
    return Number(network.chainId);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};

/**
 * Check if connected to correct network
 */
export const isCorrectNetwork = async (): Promise<boolean> => {
  const chainId = await getChainId();
  return chainId === NETWORK_CONFIG.chainId;
};

/**
 * Switch to correct network (Sepolia)
 */
export const switchToCorrectNetwork = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const chainIdHex = `0x${NETWORK_CONFIG.chainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: NETWORK_CONFIG.chainName,
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [NETWORK_CONFIG.rpcUrl],
              blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
            },
          ],
        });
        return true;
      }
      throw switchError;
    }
  } catch (error) {
    console.error('Error switching network:', error);
    return false;
  }
};

/**
 * Get Pool Factory contract instance
 */
export const getFactoryContract = async (withSigner = false) => {
  if (withSigner) {
    const provider = await getBrowserProvider();
    if (!provider) throw new Error('Provider not available');
    const signer = await provider.getSigner();
    return new ethers.Contract(POOL_FACTORY_ADDRESS, FACTORY_ABI, signer);
  } else {
    const provider = getReadOnlyProvider();
    return new ethers.Contract(POOL_FACTORY_ADDRESS, FACTORY_ABI, provider);
  }
};

/**
 * Get Scholarship Pool contract instance
 */
export const getPoolContract = async (poolAddress: string, withSigner = false) => {
  if (withSigner) {
    const provider = await getBrowserProvider();
    if (!provider) throw new Error('Provider not available');
    const signer = await provider.getSigner();
    return new ethers.Contract(poolAddress, POOL_ABI, signer);
  } else {
    const provider = getReadOnlyProvider();
    return new ethers.Contract(poolAddress, POOL_ABI, provider);
  }
};

/**
 * Get ETH balance of an address
 */
export const getBalance = async (address: string): Promise<string> => {
  try {
    const provider = getReadOnlyProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
};

/**
 * Wait for transaction confirmation
 */
export const waitForTransaction = async (txHash: string, confirmations = 1): Promise<any> => {
  try {
    const provider = getReadOnlyProvider();
    return await provider.waitForTransaction(txHash, confirmations);
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw error;
  }
};

/**
 * Estimate gas for a transaction
 */
export const estimateGas = async (tx: any): Promise<bigint> => {
  try {
    const provider = await getBrowserProvider();
    if (!provider) throw new Error('Provider not available');
    return await provider.estimateGas(tx);
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};

/**
 * Get gas price
 */
export const getGasPrice = async (): Promise<bigint> => {
  try {
    const provider = getReadOnlyProvider();
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  } catch (error) {
    console.error('Error getting gas price:', error);
    throw error;
  }
};

/**
 * Format error message from contract interaction
 */
export const formatContractError = (error: any): string => {
  if (error.code === 'ACTION_REJECTED') {
    return 'Transaction rejected by user';
  }
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds for transaction';
  }
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection';
  }
  if (error.reason) {
    return error.reason;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Listen for account changes
 */
export const onAccountsChanged = (callback: (accounts: string[]) => void) => {
  if (window.ethereum && window.ethereum.on) {
    window.ethereum.on('accountsChanged', callback);
  }
};

/**
 * Listen for network changes
 */
export const onChainChanged = (callback: (chainId: string) => void) => {
  if (window.ethereum && window.ethereum.on) {
    window.ethereum.on('chainChanged', callback);
  }
};

/**
 * Remove event listeners
 */
export const removeListeners = () => {
  if (window.ethereum && window.ethereum.removeListener) {
    window.ethereum.removeListener('accountsChanged', () => {});
    window.ethereum.removeListener('chainChanged', () => {});
  }
};
