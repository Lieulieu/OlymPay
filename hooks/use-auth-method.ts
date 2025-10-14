"use client";

import { useUserStore } from "@/stores/user-store";

export function useAuthMethod() {
  const currentUser = useUserStore((s: any) => s.currentUser);
  
  const authMethod = currentUser?.authMethod || 'wallet'; // Default to wallet for backward compatibility
  const isGoogleAuth = authMethod === 'google';
  const isWalletAuth = authMethod === 'wallet' || authMethod === 'metamask';
  const canCreateInternalWallet = isGoogleAuth; // Only Google OAuth users can create internal wallet
  
  return {
    authMethod,
    isGoogleAuth,
    isWalletAuth,
    canCreateInternalWallet,
  };
}
