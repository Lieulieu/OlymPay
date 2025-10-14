"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EnvironmentInfo {
  environment: string;
  availableEnvironments: string[];
  environmentWallets: Array<{
    environment: string;
    address: string;
    hasWallet: boolean;
    createdAt?: string;
    lastUpdated?: string;
  }>;
  hasWallet: boolean;
}

export default function EnvironmentDebugger() {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const fetchEnvironmentInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wallet/environments', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEnvInfo(data);
      } else {
        toast.error('Failed to fetch environment info');
      }
    } catch (error) {
      console.error('Error fetching environment info:', error);
      toast.error('Error fetching environment info');
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    try {
      const { getClientAuth } = await import("@/lib/client/firebase-client");
      const auth = getClientAuth();
      const user = auth.currentUser;
      if (!user) return null;
      return await user.getIdToken(true);
    } catch (err) {
      console.error("Error getting auth token:", err);
      return null;
    }
  };

  const migrateWallet = async (fromEnv: string, toEnv: string) => {
    setMigrating(true);
    try {
      const response = await fetch('/api/wallet/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ fromEnv, toEnv }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchEnvironmentInfo(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Error migrating wallet:', error);
      toast.error('Error migrating wallet');
    } finally {
      setMigrating(false);
    }
  };

  const createWallet = async (environment: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchEnvironmentInfo(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create wallet');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('Error creating wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironmentInfo();
  }, []);

  if (!envInfo) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Environment Debugger</h2>
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Environment Debugger</h2>
          
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Current Environment</div>
              <div className="stat-value text-primary">{envInfo.environment}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Available Wallets</div>
              <div className="stat-value text-secondary">{envInfo.availableEnvironments.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Has Current Wallet</div>
              <div className="stat-value text-accent">{envInfo.hasWallet ? "Yes" : "No"}</div>
            </div>
          </div>

          <div className="divider"></div>

          <h3 className="text-lg font-semibold mb-4">Environment Wallets</h3>
          <div className="space-y-4">
            {envInfo.environmentWallets.map((wallet) => (
              <div key={wallet.environment} className="card bg-base-200">
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold capitalize">{wallet.environment}</h4>
                      <p className="text-sm text-base-content/70">
                        {wallet.hasWallet ? wallet.address : 'No wallet'}
                      </p>
                      {wallet.createdAt && (
                        <p className="text-xs text-base-content/50">
                          Created: {new Date(wallet.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!wallet.hasWallet && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => createWallet(wallet.environment)}
                          disabled={loading}
                        >
                          Create Wallet
                        </button>
                      )}
                      {wallet.hasWallet && envInfo.environment !== wallet.environment && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => migrateWallet(envInfo.environment, wallet.environment)}
                          disabled={migrating}
                        >
                          Migrate To
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-actions justify-end">
            <button
              className="btn btn-outline"
              onClick={fetchEnvironmentInfo}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
