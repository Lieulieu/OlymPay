import { LoyaltyBalance } from "@/types/loyalty";
import { WalletAddress } from "@/types/wallet";

export const toInt = (n: any) => Math.max(0, Math.floor(Number(n || 0)));

export const emptyBalance = (walletAddress: WalletAddress): LoyaltyBalance => ({
  walletAddress,
  opSpendable: 0,
  opPending: 0,
  opLifetime: 0,
});
