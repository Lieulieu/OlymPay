"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function BalanceDebugPage() {
  const [internalBalance, setInternalBalance] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInternalBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/wallet/internal-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer placeholder-token`,
        },
      });

      const data = await response.json();
      console.log("Internal Balance Response:", data);
      setInternalBalance(data);
    } catch (err) {
      console.error("Error fetching internal balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/wallet/balance");
      const data = await response.json();
      console.log("Wallet Balance Response:", data);
      setWalletBalance(data);
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createDemoUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Create Demo User Response:", data);

      if (data.success) {
        // Refresh internal balance after creating demo user
        await fetchInternalBalance();
      }
    } catch (err) {
      console.error("Error creating demo user:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Balance Debug Page</h1>

      <div className="space-y-6">
        <div className="flex gap-4">
          <Button onClick={fetchInternalBalance} disabled={loading}>
            {loading ? "Loading..." : "Fetch Internal Balance"}
          </Button>
          <Button onClick={fetchWalletBalance} disabled={loading}>
            {loading ? "Loading..." : "Fetch Wallet Balance"}
          </Button>
          <Button
            onClick={createDemoUser}
            disabled={loading}
            variant="secondary"
          >
            {loading ? "Creating..." : "Create Demo User"}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Internal Balance</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(internalBalance, null, 2)}
            </pre>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Wallet Balance</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(walletBalance, null, 2)}
            </pre>
          </div>
        </div>

        {/* Display Balance Cards */}
        {(internalBalance || walletBalance) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Balance Display</h3>
            <div className="flex flex-wrap gap-4">
              {walletBalance && (
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
                  <span className="text-sm text-secondary">USDC:</span>
                  <span className="font-bold text-primary">
                    {walletBalance.balance} {walletBalance.currency}
                  </span>
                </div>
              )}

              {internalBalance && internalBalance.hasWallet && (
                <>
                  <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                    <span className="text-sm text-gray-600">oUSDC:</span>
                    <span className="font-bold text-green-600">
                      {internalBalance.oUSDCBalance} oUSDC
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                    <span className="text-sm text-gray-600">oVND:</span>
                    <span className="font-bold text-blue-600">
                      {internalBalance.oVNDBalance} oVND
                    </span>
                  </div>
                </>
              )}

              {internalBalance && !internalBalance.hasWallet && (
                <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-600">
                    No Internal Wallet
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
