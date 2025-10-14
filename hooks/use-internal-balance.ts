"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserStore } from "@/stores/user-store";

interface InternalBalance {
  oUSDCBalance: number;
  oVNDBalance: number;
  hasWallet: boolean;
  walletAddress?: string;
}

interface UseInternalBalanceReturn {
  balance: InternalBalance | null;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
}

export function useInternalBalance(): UseInternalBalanceReturn {
  const [balance, setBalance] = useState<InternalBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserStore();

  const getAuthToken = useCallback(async () => {
    if (!currentUser?.uid) return null;

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
  }, [currentUser?.uid]);

  const fetchBalance = useCallback(async () => {
    if (!currentUser?.uid) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/wallet/internal-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch internal balance");
      }

      const data = await response.json();

      if (data.success) {
        setBalance({
          oUSDCBalance: data.oUSDCBalance || 0,
          oVNDBalance: data.oVNDBalance || 0,
          hasWallet: data.hasWallet || false,
          walletAddress: data.walletAddress,
        });
      } else {
        throw new Error(data.error || "Failed to fetch balance");
      }
    } catch (err) {
      console.error("Error fetching internal balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, getAuthToken]);

  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  // Fetch balance when user changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refreshBalance,
  };
}
