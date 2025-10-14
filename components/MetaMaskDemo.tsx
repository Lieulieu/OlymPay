"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MetaMaskWalletProvider, useMetaMaskWallet, MetaMaskUtils } from "@/contexts/MetaMaskWalletContext";

interface MetaMaskDemoProps {
  className?: string;
}

function MetaMaskDemoContent({ className = "" }: MetaMaskDemoProps) {
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

  const [testMessage, setTestMessage] = useState("Hello from OlymPay MetaMask!");
  const [signature, setSignature] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            MetaMask Wallet
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-ghost btn-sm"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Connection Status */}
        <div className={`alert ${connected ? 'alert-success' : 'alert-error'}`}>
          <div>
            <h3 className="font-bold">
              {connected ? 'Connected' : 'Not Connected'}
            </h3>
            {connected && address && (
              <div className="text-sm space-y-1">
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

        {/* Expanded Content */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? "auto" : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="space-y-4 pt-4">
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

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Test Results:</h4>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`alert ${
                      result.success ? 'alert-success' : 'alert-error'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{result.name}</div>
                      <div className="text-xs">{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function MetaMaskDemo({ className = "" }: MetaMaskDemoProps) {
  return (
    <MetaMaskWalletProvider>
      <MetaMaskDemoContent className={className} />
    </MetaMaskWalletProvider>
  );
}
