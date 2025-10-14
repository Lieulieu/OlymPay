"use client";

import { useState } from "react";
import { useUserStore } from "@/stores/user-store";
import { useAuthMethod } from "@/hooks/use-auth-method";
import { useEVMWallet } from "@/hooks/use-evm-wallet";

export default function CreateEVMWalletDebugger() {
  const { currentUser } = useUserStore();
  const { authMethod, canCreateInternalWallet } = useAuthMethod();
  const { address, walletLoading, createEVMWallet } = useEVMWallet();
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleCreateEVMWallet = async () => {
    addLog("🚀 Starting EVM wallet creation...");
    
    try {
      addLog(`📊 Current state: address=${address}, loading=${walletLoading}, canCreate=${canCreateInternalWallet}`);
      addLog(`🔐 Auth method: ${authMethod}`);
      addLog(`👤 User: ${currentUser?.uid || 'Not logged in'}`);
      
      if (!canCreateInternalWallet) {
        addLog("❌ Cannot create wallet - not Google OAuth user");
        return;
      }
      
      if (address) {
        addLog("❌ EVM wallet already exists");
        return;
      }
      
      addLog("✅ Calling createEVMWallet...");
      await createEVMWallet();
      addLog("✅ EVM wallet creation completed");
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      console.error("Create EVM wallet error:", error);
    }
  };

  const clearLog = () => {
    setDebugLog([]);
  };

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h3 className="card-title text-lg mb-4">🔍 Create EVM Wallet Debugger</h3>
      
      <div className="space-y-4">
        {/* Current State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="stat">
            <div className="stat-title">Auth Method</div>
            <div className="stat-value text-sm">{authMethod}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Can Create</div>
            <div className="stat-value text-sm">{canCreateInternalWallet ? 'Yes' : 'No'}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Has EVM Address</div>
            <div className="stat-value text-sm">{address ? 'Yes' : 'No'}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Loading</div>
            <div className="stat-value text-sm">{walletLoading ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Address Display */}
        {address && (
          <div className="alert alert-success">
            <div>
              <h4 className="font-bold">EVM Wallet Address:</h4>
              <p className="text-sm font-mono break-all">{address}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            onClick={handleCreateEVMWallet}
            disabled={walletLoading || !canCreateInternalWallet || !!address}
          >
            {walletLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Creating...
              </>
            ) : (
              "Create EVM Wallet"
            )}
          </button>
          
          <button
            className="btn btn-outline"
            onClick={clearLog}
          >
            Clear Log
          </button>
        </div>

        {/* Debug Log */}
        <div className="card bg-base-100">
          <div className="card-body">
            <h4 className="card-title text-sm">Debug Log</h4>
            <div className="max-h-60 overflow-y-auto">
              {debugLog.length === 0 ? (
                <p className="text-sm text-base-content/70">No logs yet...</p>
              ) : (
                <div className="space-y-1">
                  {debugLog.map((log, index) => (
                    <div key={index} className="text-xs font-mono bg-base-200 p-2 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="card bg-base-100">
          <div className="card-body">
            <h4 className="card-title text-sm">User Info</h4>
            <pre className="text-xs bg-base-200 p-3 rounded overflow-auto">
              {JSON.stringify({
                uid: currentUser?.uid,
                authMethod: currentUser?.authMethod,
                externalWallet: currentUser?.externalWallet,
                hasInternalWallet: !!currentUser?.internalWallet?.address,
                internalWalletAddress: currentUser?.internalWallet?.address,
                hasEVMWallet: !!currentUser?.internalWallet?.evmAddress,
                evmWalletAddress: currentUser?.internalWallet?.evmAddress,
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
