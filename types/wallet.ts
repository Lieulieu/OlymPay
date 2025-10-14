export type WalletAddress = string;

export interface EncryptedMnemonic {
  ciphertext: string;
  iv: string;
  tag: string;
  version: number;
}

export interface SolAirdropResult {
  success: boolean;
  signature?: string;
  balance?: number;
  error?: string;
}

export interface InternalWallet {
  encMnemonic: EncryptedMnemonic;
  addressDigest: string;
  createdAt: Date;
  version: number;
  oVND: number;
  oUSDC: number;
  solAirdrop?: SolAirdropResult;
  environment?: string;
  migratedFrom?: string;
  migratedAt?: Date;
  SolanaWallet?: string;
  EVMWallet?: string;
  encSolanaPrivatekey?: EncryptedPrivateKey;
  encEVMPrivateKey?: EncryptedPrivateKey;
}

export interface MultiEnvironmentWallet {
  [key: string]: InternalWallet;
}

export interface EnvironmentWalletInfo {
  environment: string;
  address: string;
  hasWallet: boolean;
  createdAt?: Date;
  lastUpdated?: Date;
}

// Mới: Interface cho mã hóa private key
export interface EncryptedPrivateKey {
  ciphertext: string;
  iv: string;
  tag: string;
  version: number;
}

// Mới: Interface cho thông tin ví Solana
export interface SolanaWalletInfo {
  address: string;
  addressDigest: string;
  encPrivateKey: EncryptedPrivateKey;
  publicKey: string;
}

export interface InternalWalletResponse {
  address: WalletAddress | null;
  evmAddress?: WalletAddress | null;
}
