"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import UnifiedAuthDropdown from "@/components/UnifiedAuthDropdown";
import MetaMaskDemo from "@/components/MetaMaskDemo";
import { useUserStore } from "@/stores/user-store";
import { useWallet } from "@/contexts/WalletContext";

export default function AuthenticationDemoPage() {
  const { currentUser, loading: userLoading } = useUserStore();
  const { connected, publicKey, balance, loading: walletLoading } = useWallet();
  const [testResults, setTestResults] = useState<any[]>([]);

  const runSystemTests = async () => {
    const tests = [
      {
        name: "Google OAuth Test",
        test: async () => {
          if (typeof window === 'undefined') {
            throw new Error('Window not available');
          }
          
          const { getClientAuth } = await import('@/lib/client/firebase-client');
          const auth = getClientAuth();
          return { success: true, message: "Google OAuth ready" };
        }
      },
      {
        name: "Phantom Wallet Test",
        test: async () => {
          if (typeof window === 'undefined' || !window.solana) {
            throw new Error('Phantom wallet not installed');
          }
          return { success: true, message: "Phantom wallet detected" };
        }
      },
      {
        name: "MetaMask Test",
        test: async () => {
          if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not installed');
          }
          return { success: true, message: "MetaMask detected" };
        }
      },
      {
        name: "Firebase Config Test",
        test: async () => {
          const config = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          };
          
          const missing = Object.entries(config).filter(([key, value]) => !value);
          if (missing.length > 0) {
            throw new Error(`Missing config: ${missing.map(([key]) => key).join(', ')}`);
          }
          
          return { success: true, message: "Firebase config complete" };
        }
      },
      {
        name: "User Store Test",
        test: async () => {
          if (!currentUser) {
            throw new Error('No user logged in');
          }
          return { success: true, message: `User logged in: ${currentUser.uid}` };
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
    toast.success("System tests completed");
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
            Authentication System Demo
          </h1>
          <p className="text-base-content/70">
            Test the complete authentication system with Google OAuth, Phantom (Solana), and MetaMask (EVM)
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Unified Authentication */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">Unified Authentication</h2>
              
              <div className="space-y-4">
                <UnifiedAuthDropdown />
                
                {currentUser && (
                  <div className="alert alert-success">
                    <div>
                      <h3 className="font-bold">Signed In!</h3>
                      <div className="text-sm space-y-1">
                        <div>UID: {currentUser.uid}</div>
                        <div>External Wallet: {currentUser.externalWallet || 'N/A'}</div>
                        <div>Internal Wallet: {currentUser.internalWallet?.address || 'N/A'}</div>
                        <div>Points: {currentUser.points}</div>
                        <div>Auth Method: {currentUser.authMethod || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {(userLoading || walletLoading) && (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* System Tests */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">System Tests</h2>
              
              <div className="space-y-4">
                <button
                  onClick={runSystemTests}
                  className="btn btn-primary w-full"
                >
                  Run System Tests
                </button>
                
                {testResults.length > 0 && (
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
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wallet Demos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Solana Wallet (Phantom) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                Solana Wallet (Phantom)
              </h2>
              
              <div className="space-y-4">
                <div className={`alert ${connected ? 'alert-success' : 'alert-error'}`}>
                  <div>
                    <h3 className="font-bold">
                      {connected ? 'Connected' : 'Not Connected'}
                    </h3>
                    {connected && publicKey && (
                      <div className="text-sm space-y-1">
                        <div>Address: {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-6)}</div>
                        <div>Balance: {balance?.toFixed(4) || '0'} SOL</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-base-content/70">
                  <p>Phantom wallet provides Solana blockchain access for:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>SOL transactions</li>
                    <li>SPL token operations</li>
                    <li>DeFi interactions</li>
                    <li>NFT transactions</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* MetaMask Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MetaMaskDemo />
          </motion.div>
        </div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-base-100 shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title">Current Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat">
                <div className="stat-title">User Status</div>
                <div className="stat-value text-sm">
                  {currentUser ? 'Signed In' : 'Not Signed In'}
                </div>
                <div className="stat-desc">
                  {currentUser ? currentUser.uid : 'No user'}
                </div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Solana Wallet</div>
                <div className="stat-value text-sm">
                  {connected ? 'Connected' : 'Not Connected'}
                </div>
                <div className="stat-desc">
                  {connected ? publicKey?.toBase58() : 'No wallet'}
                </div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Loading</div>
                <div className="stat-value text-sm">
                  {(userLoading || walletLoading) ? 'Yes' : 'No'}
                </div>
                <div className="stat-desc">
                  {(userLoading || walletLoading) ? 'Processing...' : 'Ready'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

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
                <h3 className="font-semibold">1. Google OAuth:</h3>
                <p className="text-sm text-base-content/70">
                  Click "Continue with Google" to test Google OAuth authentication.
                  Make sure you have a Google account and popups are enabled.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">2. Phantom Wallet (Solana):</h3>
                <p className="text-sm text-base-content/70">
                  Click "Connect Phantom" to test Phantom wallet authentication.
                  Make sure Phantom extension is installed and unlocked.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">3. MetaMask Wallet (EVM):</h3>
                <p className="text-sm text-base-content/70">
                  Use the MetaMask demo section to test MetaMask wallet functionality.
                  Make sure MetaMask extension is installed and unlocked.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">4. System Tests:</h3>
                <p className="text-sm text-base-content/70">
                  Click "Run System Tests" to verify all authentication methods
                  and system configuration.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
