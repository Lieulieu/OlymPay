"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface MetaMaskWalletContextType {
  // Connection state
  connected: boolean;
  address: string | null;
  chainId: string | null;
  
  // Balances
  ethBalance: number | null;
  usdcBalance: number | null;
  
  // Provider
  provider: any | null;
  
  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: string) => Promise<void>;
  switchToU2U: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (transaction: any) => Promise<string>;
  
  // State
  loading: boolean;
  error: string | null;
}

const MetaMaskWalletContext = createContext<MetaMaskWalletContextType | undefined>(undefined);

// Ethereum network configurations
const ETHEREUM_NETWORKS = {
  mainnet: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  sepolia: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
};

// USDC contract addresses on different networks
const USDC_CONTRACTS = {
  mainnet: '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C',
  sepolia: '0x0', // No USDC on Sepolia testnet
  polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
};

// U2U Solaris Network Configuration
const U2U_NETWORK_CONFIG = {
  chainId: '0x1a1', // 417 in decimal
  chainName: 'U2U Solaris',
  nativeCurrency: {
    name: 'U2U',
    symbol: 'U2U',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-mainnet.uniultra.xyz'],
  blockExplorerUrls: ['https://u2uscan.xyz'],
};

export function MetaMaskWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event listeners for account and chain changes
  const [accountChangedCallback, setAccountChangedCallback] = useState<((accounts: string[]) => void) | null>(null);
  const [chainChangedCallback, setChainChangedCallback] = useState<((chainId: string) => void) | null>(null);
  const [disconnectCallback, setDisconnectCallback] = useState<(() => void) | null>(null);

  // Initialize MetaMask connection
  useEffect(() => {
    const initializeMetaMask = async () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        console.log('MetaMask not detected');
        return;
      }

      setProvider(window.ethereum);

      // Check if already connected
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setConnected(true);
          await fetchBalances(accounts[0]);
        }

        // Get current chain
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(currentChainId);

        // Set up event listeners
        setupEventListeners();
      } catch (error) {
        console.error('Failed to initialize MetaMask:', error);
      }
    };

    initializeMetaMask();
  }, []);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    if (!window.ethereum) return;

    // Account changed
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        setAddress(accounts[0]);
        fetchBalances(accounts[0]);
      }
      
      // Notify callback
      if (accountChangedCallback) {
        accountChangedCallback(accounts);
      }
    });

    // Chain changed
    window.ethereum.on('chainChanged', (newChainId: string) => {
      setChainId(newChainId);
      if (connected && address) {
        fetchBalances(address);
      }
      
      // Notify callback
      if (chainChangedCallback) {
        chainChangedCallback(newChainId);
      }
    });

    // Disconnect
    window.ethereum.on('disconnect', () => {
      handleDisconnect();
      
      // Notify callback
      if (disconnectCallback) {
        disconnectCallback();
      }
    });
  }, [connected, address, accountChangedCallback, chainChangedCallback, disconnectCallback]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setEthBalance(null);
    setUsdcBalance(null);
    setError(null);
  }, []);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  }, []);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask not installed. Please install MetaMask extension.');
    }

    setLoading(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum!.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const accountAddress = accounts[0];
      setAddress(accountAddress);
      setConnected(true);

      // Get current chain
      const currentChainId = await window.ethereum!.request({ method: 'eth_chainId' });
      setChainId(currentChainId);

      // Fetch balances
      await fetchBalances(accountAddress);

    } catch (error: any) {
      console.error('MetaMask connection failed:', error);
      setError(error.message || 'Failed to connect to MetaMask');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isMetaMaskInstalled]);

  // Disconnect from MetaMask
  const disconnect = useCallback(() => {
    handleDisconnect();
  }, [handleDisconnect]);

  // Switch to different chain
  const switchChain = useCallback(async (targetChainId: string) => {
    if (!window.ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      // If chain doesn't exist, try to add it
      if (error.code === 4902) {
        let networkConfig;
        
        // Check if it's U2U Solaris network
        if (targetChainId === U2U_NETWORK_CONFIG.chainId) {
          networkConfig = U2U_NETWORK_CONFIG;
        } else {
          // Check other Ethereum networks
          networkConfig = Object.values(ETHEREUM_NETWORKS).find(
            network => network.chainId === targetChainId
          );
        }
        
        if (networkConfig) {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
        } else {
          throw new Error(`Network with chainId ${targetChainId} not supported`);
        }
      } else {
        throw error;
      }
    }
  }, []);

  // Switch to U2U Solaris network
  const switchToU2U = useCallback(async () => {
    await switchChain(U2U_NETWORK_CONFIG.chainId);
  }, [switchChain]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!window.ethereum || !address) {
      throw new Error('MetaMask not connected');
    }

    try {
      const signature = await window.ethereum!.request({
        method: 'personal_sign',
        params: [message, address],
      });
      return signature;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected signing');
      }
      throw error;
    }
  }, [address]);

  // Send transaction
  const sendTransaction = useCallback(async (transaction: any): Promise<string> => {
    if (!window.ethereum || !address) {
      throw new Error('MetaMask not connected');
    }

    try {
      const txHash = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      });
      return txHash;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected transaction');
      }
      throw error;
    }
  }, [address]);

  // Fetch ETH balance
  const fetchEthBalance = useCallback(async (accountAddress: string) => {
    try {
      const balance = await window.ethereum!.request({
        method: 'eth_getBalance',
        params: [accountAddress, 'latest']
      });
      
      // Convert wei to ETH (1 ETH = 10^18 wei)
      const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
      setEthBalance(ethBalance);
    } catch (error) {
      console.error('Failed to fetch ETH balance:', error);
      setEthBalance(null);
    }
  }, []);

  // Fetch USDC balance
  const fetchUsdcBalance = useCallback(async (accountAddress: string) => {
    try {
      if (!chainId) return;

      const usdcContract = USDC_CONTRACTS[chainId as keyof typeof USDC_CONTRACTS];
      if (!usdcContract) {
        setUsdcBalance(0);
        return;
      }

      // Call USDC balanceOf function
      const balance = await window.ethereum!.request({
        method: 'eth_call',
        params: [{
          to: usdcContract,
          data: `0x70a08231${accountAddress.slice(2).padStart(64, '0')}`
        }, 'latest']
      });
      
      // USDC has 6 decimals
      const usdcBalance = parseInt(balance, 16) / Math.pow(10, 6);
      setUsdcBalance(usdcBalance);
    } catch (error) {
      console.error('Failed to fetch USDC balance:', error);
      setUsdcBalance(null);
    }
  }, [chainId]);

  // Fetch all balances
  const fetchBalances = useCallback(async (accountAddress: string) => {
    await Promise.all([
      fetchEthBalance(accountAddress),
      fetchUsdcBalance(accountAddress),
    ]);
  }, [fetchEthBalance, fetchUsdcBalance]);

  // Event subscription methods
  const onAccountChanged = useCallback((callback: (accounts: string[]) => void) => {
    setAccountChangedCallback(() => callback);
  }, []);

  const onChainChanged = useCallback((callback: (chainId: string) => void) => {
    setChainChangedCallback(() => callback);
  }, []);

  const onDisconnect = useCallback((callback: () => void) => {
    setDisconnectCallback(() => callback);
  }, []);

  return (
    <MetaMaskWalletContext.Provider
      value={{
        connected,
        address,
        chainId,
        ethBalance,
        usdcBalance,
        provider,
        connect,
        disconnect,
        switchChain,
        switchToU2U,
        signMessage,
        sendTransaction,
        loading,
        error,
      }}
    >
      {children}
    </MetaMaskWalletContext.Provider>
  );
}

export function useMetaMaskWallet() {
  const context = useContext(MetaMaskWalletContext);
  if (context === undefined) {
    throw new Error('useMetaMaskWallet must be used within a MetaMaskWalletProvider');
  }
  return context;
}

// Utility functions
export const MetaMaskUtils = {
  // Format address for display
  formatAddress: (address: string, length: number = 6) => {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  },

  // Format balance for display
  formatBalance: (balance: number, decimals: number = 4) => {
    if (balance === null || balance === undefined) return '0';
    return balance.toFixed(decimals);
  },

  // Get network name from chain ID
  getNetworkName: (chainId: string) => {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon Mainnet',
    };
    return networks[chainId as keyof typeof networks] || 'Unknown Network';
  },

  // Check if chain is supported
  isChainSupported: (chainId: string) => {
    return Object.values(ETHEREUM_NETWORKS).some(network => network.chainId === chainId);
  },
};
