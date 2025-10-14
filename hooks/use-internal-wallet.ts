"use client";

import { useCallback } from "react";
import { useUserStore } from "@/stores/user-store";

export function useInternalWallet() {
  const address = useUserStore(
    (s: any) => s.currentUser?.internalWallet?.address ?? null
  );
  const walletLoading = useUserStore((s: any) => s.walletLoading);
  const refreshMe = useUserStore((s: any) => s.refreshMe);
  const createInternalWallet = useUserStore((s: any) => s.createInternalWallet);

  const createIfMissing = useCallback(async () => {
    if (!address) {
      await createInternalWallet();
    }
  }, [address, createInternalWallet]);

  return {
    address,
    walletLoading,
    refreshMe,
    createIfMissing,
    createInternalWallet,
  };
}
