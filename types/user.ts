import { InternalWalletResponse } from "./wallet";

export type Role = "user" | "admin";

export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  ovndBalance?: number;
  role?: Role;
  referralCode?: string;
}

export interface UserSession {
  uid: string;
  externalWallet: string;
  internalWallet: InternalWalletResponse | null;
  profile: UserProfile;
  points: number;
  authMethod?: 'google' | 'wallet' | 'metamask';
}
