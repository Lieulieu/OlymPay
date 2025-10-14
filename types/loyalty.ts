import { WalletAddress } from "./wallet";

export interface LoyaltyBalance {
  walletAddress: WalletAddress;
  opSpendable: number; // immediately usable points
  opPending: number; // top-up points not yet matched
  opLifetime: number; // total accumulated (top-up + spend)
  updatedAt?: Date;
}

export interface TopupBatch {
  id: string;
  walletAddress: WalletAddress;
  amount: number; // OP amount from top-up (1$ = 1 OP)
  remaining: number; // unmatched portion
  unlockAt: Date; // unlock time (top-up + 7 days)
  createdAt: Date;
}

export interface LoyaltyLock {
  id: string;
  walletAddress: WalletAddress;
  batchId: string;
  amount: number;
  unlockAt: Date;
  released: boolean;
  createdAt: Date;
}

export type LoyaltyEventType =
  | "TOPUP"
  | "SPEND"
  | "RELEASE"
  | "WITHDRAW"
  | "AWARD";

export interface LoyaltyEvent {
  id: string;
  walletAddress: WalletAddress;
  type: LoyaltyEventType;
  amount: number;
  createdAt: Date;
  meta?: Record<string, any>;
}
