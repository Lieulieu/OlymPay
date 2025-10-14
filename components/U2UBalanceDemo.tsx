"use client";

import { useState } from "react";
import { useMetaMaskWallet } from "@/contexts/MetaMaskWalletContext";

export default function U2UBalanceDemo() {
  const { connected, address, chainId, switchToU2U } = useMetaMaskWallet();
  const [u2uBalance, setU2uBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchU2uBalance = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/u2u-explorer/u2u-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (response.ok) {
        const data = await response.json();
        setU2uBalance(data.balance || 0);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch U2U balance");
      }
    } catch (err) {
      setError("Network error");
      console.error("Failed to fetch U2U balance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToU2U = async () => {
    try {
      await switchToU2U();
    } catch (err) {
      setError("Failed to switch to U2U network");
      console.error("Switch to U2U error:", err);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">U2U Balance Demo</h2>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <div className={`alert ${connected ? 'alert-success' : 'alert-error'}`}>
            <div>
              <h3 className="font-bold">
                {connected ? 'MetaMask Connected' : 'MetaMask Not Connected'}
              </h3>
              {connected && address && (
                <div className="text-sm">
                  <div>Address: {address}</div>
                  <div>Chain ID: {chainId}</div>
                </div>
              )}
            </div>
          </div>

          {/* U2U Network Switch */}
          {connected && (
            <div className="flex gap-2">
              <button
                onClick={handleSwitchToU2U}
                className="btn btn-primary"
              >
                Switch to U2U Solaris
              </button>
            </div>
          )}

          {/* U2U Balance */}
          {connected && address && (
            <div className="space-y-2">
              <button
                onClick={fetchU2uBalance}
                disabled={loading}
                className="btn btn-outline"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Fetch U2U Balance'
                )}
              </button>

              {u2uBalance !== null && (
                <div className="alert alert-info">
                  <div>
                    <h4 className="font-bold">U2U Balance</h4>
                    <p>{u2uBalance.toFixed(6)} U2U</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  <div>
                    <h4 className="font-bold">Error</h4>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
