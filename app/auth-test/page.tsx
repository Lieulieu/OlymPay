"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import UnifiedAuthDropdown from "@/components/UnifiedAuthDropdown";
import { useUserStore } from "@/stores/user-store";
import { useWallet } from "@/contexts/WalletContext";

export default function AuthTestPage() {
  const { currentUser, loading } = useUserStore();
  const { connected, publicKey } = useWallet();
  const [testResults, setTestResults] = useState<any[]>([]);

  const runTests = async () => {
    const tests = [
      {
        name: "Google OAuth Test",
        test: async () => {
          // Test Google OAuth availability
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

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold text-base-content">
            Authentication Test Page
          </h1>
          <p className="text-base-content/70">
            Test the unified authentication system with Google OAuth, Phantom, and MetaMask
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authentication Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">Authentication</h2>
              
              <div className="space-y-4">
                <UnifiedAuthDropdown />
                
                {currentUser && (
                  <div className="alert alert-success">
                    <div>
                      <h3 className="font-bold">Signed In!</h3>
                      <div className="text-sm">
                        <div>UID: {currentUser.uid}</div>
                        <div>External Wallet: {currentUser.externalWallet || 'N/A'}</div>
                        <div>Internal Wallet: {currentUser.internalWallet?.address || 'N/A'}</div>
                        <div>Points: {currentUser.points}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {loading && (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Test Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">System Tests</h2>
              
              <div className="space-y-4">
                <button
                  onClick={runTests}
                  className="btn btn-primary w-full"
                >
                  Run Tests
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
                <div className="stat-title">Wallet Status</div>
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
                  {loading ? 'Yes' : 'No'}
                </div>
                <div className="stat-desc">
                  {loading ? 'Processing...' : 'Ready'}
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
                <h3 className="font-semibold">Google OAuth:</h3>
                <p className="text-sm text-base-content/70">
                  Click "Continue with Google" to test Google OAuth authentication.
                  Make sure you have a Google account and popups are enabled.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">Phantom Wallet:</h3>
                <p className="text-sm text-base-content/70">
                  Click "Connect Phantom" to test Phantom wallet authentication.
                  Make sure Phantom extension is installed and unlocked.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">MetaMask Wallet:</h3>
                <p className="text-sm text-base-content/70">
                  Click "Connect MetaMask" to test MetaMask wallet authentication.
                  Make sure MetaMask extension is installed and unlocked.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
