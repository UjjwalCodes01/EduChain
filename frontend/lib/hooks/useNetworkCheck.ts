import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export function useNetworkCheck() {
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);

  const checkNetwork = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        setCurrentChainId(chainId);
        
        // Sepolia chainId is 11155111
        setIsCorrectNetwork(chainId === 11155111);
      } catch (error) {
        console.error('Error checking network:', error);
      }
    }
  };

  const switchToSepolia = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
        });
        await checkNetwork();
      } catch (error: any) {
        // If the chain hasn't been added to MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'SepoliaETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                },
              ],
            });
            await checkNetwork();
          } catch (addError) {
            console.error('Error adding Sepolia network:', addError);
          }
        }
      }
    }
  };

  useEffect(() => {
    checkNetwork();

    // Listen for network changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum;
      const handleChainChanged = () => {
        checkNetwork();
      };
      
      if (ethereum.on && typeof ethereum.removeListener === 'function') {
        ethereum.on('chainChanged', handleChainChanged);
        return () => {
          if (ethereum.removeListener) {
            ethereum.removeListener('chainChanged', handleChainChanged);
          }
        };
      }
    }
  }, []);

  return { isCorrectNetwork, currentChainId, switchToSepolia, checkNetwork };
}
