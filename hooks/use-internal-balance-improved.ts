"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/stores/user-store";

interface InternalBalance {
  oUSDCBalance: number;
  oVNDBalance: number;
  solBalance: number;
  hasWallet: boolean;
  walletAddress?: string;
  solAirdrop?: {
    success: boolean;
    signature?: string;
    balance?: number;
    error?: string;
  };
}

interface UseInternalBalanceReturn {
  balance: InternalBalance | null;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useInternalBalance(): UseInternalBalanceReturn {
  const [balance, setBalance] = useState<InternalBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { currentUser } = useUserStore();

  const getAuthToken = useCallback(
    async (forceRefresh = false) => {
      if (!currentUser?.uid) return null;

      try {
        const { getClientAuth } = await import("@/lib/client/firebase-client");
        const auth = getClientAuth();
        const user = auth.currentUser;

        if (!user) {
          console.warn("No authenticated user found");
          return null;
        }

        // Try to get token with retry logic
        let attempts = 0;
        while (attempts < 3) {
          try {
            const token = await user.getIdToken(forceRefresh);
            if (token) return token;
          } catch (tokenError) {
            console.warn(
              `Token fetch attempt ${attempts + 1} failed:`,
              tokenError
            );
            attempts++;
            if (attempts < 3) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }

        throw new Error("Failed to get auth token after 3 attempts");
      } catch (err) {
        console.error("Error getting auth token:", err);
        return null;
      }
    },
    [currentUser?.uid]
  );

  const fetchBalance = useCallback(
    async (isRetry = false) => {
      if (!currentUser?.uid) {
        setBalance(null);
        return;
      }

      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      try {
        const token = await getAuthToken(isRetry);
        if (!token) {
          throw new Error("Authentication required");
        }

        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/wallet/internal-balance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication expired. Please refresh the page.");
          } else if (response.status === 500) {
            throw new Error("Server error. Please try again later.");
          } else {
            throw new Error(`Failed to fetch balance: ${response.status}`);
          }
        }

        const data = await response.json();

        if (data.success) {
          setBalance({
            oUSDCBalance: data.oUSDCBalance || 0,
            oVNDBalance: data.oVNDBalance || 0,
            solBalance: data.solBalance || 0,
            hasWallet: data.hasWallet || false,
            walletAddress: data.walletAddress,
            solAirdrop: data.solAirdrop,
          });
          setRetryCount(0); // Reset retry count on success
        } else {
          throw new Error(data.error || "Failed to fetch balance");
        }
      } catch (err) {
        console.error("Error fetching internal balance:", err);

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setBalance(null);

        // Auto-retry logic
        if (retryCount < MAX_RETRIES && !isRetry) {
          console.log(
            `Retrying balance fetch in ${RETRY_DELAY}ms... (attempt ${
              retryCount + 1
            }/${MAX_RETRIES})`
          );
          setRetryCount((prev) => prev + 1);

          setTimeout(() => {
            fetchBalance(true);
          }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        }
      } finally {
        if (!isRetry) {
          setLoading(false);
        }
      }
    },
    [currentUser?.uid, getAuthToken, retryCount]
  );

  const refreshBalance = useCallback(async () => {
    setRetryCount(0); // Reset retry count on manual refresh
    await fetchBalance();
  }, [fetchBalance]);

  // Fetch balance when user changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh every 30 seconds when not loading
  useEffect(() => {
    if (!loading && currentUser?.uid) {
      const interval = setInterval(() => {
        fetchBalance(true); // Silent refresh
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [loading, currentUser?.uid, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refreshBalance,
    retryCount,
  };
}
