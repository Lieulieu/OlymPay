"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MetaMaskWalletProvider, useMetaMaskWallet, MetaMaskUtils } from "@/contexts/MetaMaskWalletContext";

function MetaMaskTestContent() {
  const {
    connected,
    address,
    chainId,
    ethBalance,
    usdcBalance,
    provider,
    connect,
    disconnect,
    switchChain,
    signMessage,
    sendTransaction,
    loading,
    error,
  } = useMetaMaskWallet();

  const [testMessage, setTestMessage] = useState("Hello from OlymPay!");
  const [signature, setSignature] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Test MetaMask functionality
  const runTests = async () => {
    const tests = [
      {
        name: "MetaMask Installation",
        test: async () => {
          if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not installed');
          }
          return { success: true, message: "MetaMask detected" };
        }
      },
      {
        name: "Connection Test",
        test: async () => {
          if (!connected) {
            throw new Error('Not connected to MetaMask');
          }
          return { success: true, message: "Connected to MetaMask" };
        }
      },
      {
        name: "Address Validation",
        test: async () => {
          if (!address) {
            throw new Error('No address found');
          }
          if (!address.startsWith('0x') || address.length !== 42) {
            throw new Error('Invalid address format');
          }
          return { success: true, message: `Valid address: ${MetaMaskUtils.formatAddress(address)}` };
        }
      },
      {
        name: "Chain ID Check",
        test: async () => {
          if (!chainId) {
            throw new Error('No chain ID found');
          }
          const networkName = MetaMaskUtils.getNetworkName(chainId);
          return { success: true, message: `Connected to ${networkName} (${chainId})` };
        }
      },
      {
        name: "Balance Check",
        test: async () => {
          if (ethBalance === null) {
            throw new Error('ETH balance not available');
          }
          return { success: true, message: `ETH Balance: ${MetaMaskUtils.formatBalance(ethBalance)} ETH` };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        results.push({
          name: test.name,
          success: false,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    setTestResults(results);
    toast.success("Tests completed");
  };

  // Test message signing
  const testSignMessage = async () => {
    if (!connected) {
      toast.error("Please connect to MetaMask first");
      return;
    }

    try {
      const sig = await signMessage(testMessage);
      setSignature(sig);
      toast.success("Message signed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign message");
    }
  };

  // Test chain switching
  const testSwitchChain = async (targetChainId: string) => {
    if (!connected) {
      toast.error("Please connect to MetaMask first");
      return;
    }

    try {
      await switchChain(targetChainId);
      toast.success(`Switched to chain ${targetChainId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to switch chain");
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold text-base-content">
            MetaMask Wallet Test
          </h1>
          <p className="text-base-content/70">
            Test MetaMask wallet connection, signing, and transaction functionality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">MetaMask Connection</h2>
              
              <div className="space-y-4">
                {/* Connection Status */}
                <div className={`alert ${connected ? 'alert-success' : 'alert-error'}`}>
                  <div>
                    <h3 className="font-bold">
                      {connected ? 'Connected' : 'Not Connected'}
                    </h3>
                    {connected && address && (
                      <div className="text-sm">
                        <div>Address: {MetaMaskUtils.formatAddress(address)}</div>
                        <div>Chain: {MetaMaskUtils.getNetworkName(chainId || '')}</div>
                        <div>ETH Balance: {MetaMaskUtils.formatBalance(ethBalance || 0)} ETH</div>
                        {usdcBalance !== null && (
                          <div>USDC Balance: {MetaMaskUtils.formatBalance(usdcBalance)} USDC</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Buttons */}
                <div className="flex gap-2">
                  {!connected ? (
                    <button
                      onClick={connect}
                      disabled={loading}
                      className="btn btn-primary flex-1"
                    >
                      {loading ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        'Connect MetaMask'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={disconnect}
                      className="btn btn-error flex-1"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="alert alert-error">
                    <div>
                      <h4 className="font-bold">Error</h4>
                      <div className="text-sm">{error}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Testing Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">Functionality Tests</h2>
              
              <div className="space-y-4">
                {/* Message Signing */}
                <div className="space-y-2">
                  <label className="label">
                    <span className="label-text">Test Message</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter message to sign"
                  />
                  <button
                    onClick={testSignMessage}
                    disabled={!connected || loading}
                    className="btn btn-outline w-full"
                  >
                    Sign Message
                  </button>
                  
                  {signature && (
                    <div className="alert alert-info">
                      <div>
                        <h4 className="font-bold">Signature</h4>
                        <div className="text-xs font-mono break-all">{signature}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chain Switching */}
                <div className="space-y-2">
                  <label className="label">
                    <span className="label-text">Switch Chain</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => testSwitchChain('0x1')}
                      disabled={!connected || loading}
                      className="btn btn-sm btn-outline flex-1"
                    >
                      Ethereum
                    </button>
                    <button
                      onClick={() => testSwitchChain('0x89')}
                      disabled={!connected || loading}
                      className="btn btn-sm btn-outline flex-1"
                    >
                      Polygon
                    </button>
                  </div>
                </div>

                {/* Run Tests */}
                <button
                  onClick={runTests}
                  className="btn btn-primary w-full"
                >
                  Run All Tests
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">Test Results</h2>
              
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`alert ${
                      result.success ? 'alert-success' : 'alert-error'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{result.name}</div>
                      <div className="text-sm">{result.message}</div>
                      <div className="text-xs opacity-70">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title">Instructions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">1. Install MetaMask</h3>
                <p className="text-sm text-base-content/70">
                  Make sure you have MetaMask browser extension installed and unlocked.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">2. Connect Wallet</h3>
                <p className="text-sm text-base-content/70">
                  Click "Connect MetaMask" to establish connection and get your wallet address.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">3. Test Signing</h3>
                <p className="text-sm text-base-content/70">
                  Enter a message and click "Sign Message" to test message signing functionality.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">4. Test Chain Switching</h3>
                <p className="text-sm text-base-content/70">
                  Use the chain switching buttons to test network changes.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">5. Run Tests</h3>
                <p className="text-sm text-base-content/70">
                  Click "Run All Tests" to verify all MetaMask functionality.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function MetaMaskTestPage() {
  return (
    <MetaMaskWalletProvider>
      <MetaMaskTestContent />
    </MetaMaskWalletProvider>
  );
}
