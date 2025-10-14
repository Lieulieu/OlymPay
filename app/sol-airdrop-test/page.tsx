"use client";

import { useState } from "react";
import { useUserStore } from "@/stores/user-store";

export default function SolAirdropTestPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState(0.2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserStore();

  const handleAirdrop = async () => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/wallet/sol-airdrop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          amount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Airdrop failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const checkBalance = async () => {
    if (!walletAddress) {
      setError("Please enter a wallet address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/wallet/sol-airdrop?walletAddress=${encodeURIComponent(
          walletAddress
        )}`
      );

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Failed to check balance");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createWalletWithAirdrop = async () => {
    if (!currentUser) {
      setError("Please login first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { getClientAuth } = await import("@/lib/client/firebase-client");
      const auth = getClientAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("No authenticated user found");
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch("/api/wallet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.ok) {
        setResult(data);
        setWalletAddress(data.address);
      } else {
        setError(data.error || "Failed to create wallet");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            SOL Airdrop Test Page
          </h1>

          <div className="space-y-6">
            {/* Create Wallet with Airdrop */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">
                Create New Wallet with SOL Airdrop
              </h2>
              <p className="text-gray-600 mb-4">
                This will create a new internal wallet and automatically airdrop
                0.2 SOL for transaction fees.
              </p>
              <button
                onClick={createWalletWithAirdrop}
                disabled={loading || !currentUser}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Wallet + Airdrop"}
              </button>
            </div>

            {/* Manual Airdrop */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Manual SOL Airdrop</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter Solana wallet address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (SOL)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    min="0.1"
                    max="2"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleAirdrop}
                    disabled={loading || !walletAddress}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Airdropping..." : "Airdrop SOL"}
                  </button>
                  <button
                    onClick={checkBalance}
                    disabled={loading || !walletAddress}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    {loading ? "Checking..." : "Check Balance"}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold mb-2">Result</h3>
                <pre className="text-green-700 text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 font-semibold mb-2">Instructions</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>
                  • <strong>Create Wallet + Airdrop:</strong> Creates a new
                  internal wallet and automatically airdrops 0.2 SOL
                </li>
                <li>
                  • <strong>Manual Airdrop:</strong> Airdrop SOL to any wallet
                  address (max 2 SOL)
                </li>
                <li>
                  • <strong>Check Balance:</strong> Check current SOL balance of
                  a wallet
                </li>
                <li>• This uses Solana devnet - SOL has no real value here</li>
                <li>• Airdrops are limited by Solana devnet rate limits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
