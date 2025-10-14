"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/stores/user-store";
import { toast } from "sonner";

export function useEVMWallet() {
  const { currentUser, refreshMe } = useUserStore();
  const [address, setAddress] = useState<string>("");
  const [walletLoading, setWalletLoading] = useState(false);

  // Lấy địa chỉ EVM từ user data
  useEffect(() => {
    const evmAddress = currentUser?.internalWallet?.evmAddress;
    if (evmAddress && evmAddress !== "null" && evmAddress !== "" && evmAddress !== null) {
      setAddress(evmAddress);
    } else {
      setAddress("");
    }
  }, [currentUser]);

  const createEVMWallet = async () => {
    try {
      setWalletLoading(true);
      
      // Lấy Firebase auth token
      const { getClientAuth } = await import("@/lib/client/firebase-client");
      const auth = getClientAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const token = await user.getIdToken(true);
      
      const response = await fetch("/api/wallet/create-evm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create EVM wallet");
      }

      const result = await response.json();
      if (result.ok) {
        // Refresh user data
        await refreshMe();
        toast.success("EVM wallet address displayed!");
        return result.address;
      } else {
        throw new Error(result.error || "Failed to create EVM wallet");
      }
    } catch (error) {
      console.error("Error creating EVM wallet:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create EVM wallet");
      throw error;
    } finally {
      setWalletLoading(false);
    }
  };

  return {
    address,
    walletLoading,
    createEVMWallet,
    refreshMe,
  };
}
