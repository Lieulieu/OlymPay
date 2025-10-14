import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import bs58 from "bs58";

export interface PhantomWalletData {
  mnemonic: string;
  publicKey: string;
  privateKey: string;
  keypairHex: string;
  keypairBase64: string;
  numericId: string;
}

/**
 * Generate a Phantom wallet with 24-character numeric ID
 */
export function generatePhantomWallet(): PhantomWalletData {
  // Generate 24-character numeric ID
  const numericId = generateNumericId(24);

  // Generate mnemonic phrase
  const mnemonic = bip39.generateMnemonic();

  // Create seed from mnemonic
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  // Create keypair from seed (using first 32 bytes)
  const keypair = Keypair.fromSeed(seed.slice(0, 32));

  // Get public key as base58 string
  const publicKey = keypair.publicKey.toBase58();

  // Get private key as base58 string
  const privateKey = bs58.encode(keypair.secretKey);

  // Get keypair as hex string
  const keypairHex = Buffer.from(keypair.secretKey).toString("hex");

  // Get keypair as base64 string
  const keypairBase64 = Buffer.from(keypair.secretKey).toString("base64");

  return {
    mnemonic,
    publicKey,
    privateKey,
    keypairHex,
    keypairBase64,
    numericId,
  };
}

/**
 * Generate a numeric ID with specified length
 */
function generateNumericId(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

/**
 * Generate wallet from existing keypair (base64 format)
 */
export function generateWalletFromKeypair(
  inputKeypairBase64: string
): PhantomWalletData {
  try {
    // Decode base64 keypair
    const secretKey = Buffer.from(inputKeypairBase64, "base64");

    // Create keypair from secret key
    const keypair = Keypair.fromSecretKey(secretKey);

    // Generate new numeric ID
    const numericId = generateNumericId(24);

    // Get public key as base58 string
    const publicKey = keypair.publicKey.toBase58();

    // Get private key as base58 string
    const privateKey = bs58.encode(keypair.secretKey);

    // Get keypair as hex string
    const keypairHex = Buffer.from(keypair.secretKey).toString("hex");

    // Get keypair as base64 string
    const keypairBase64 = Buffer.from(keypair.secretKey).toString("base64");

    // Generate mnemonic (for display purposes, not used for wallet creation)
    const mnemonic = bip39.generateMnemonic();

    return {
      mnemonic,
      publicKey,
      privateKey,
      keypairHex,
      keypairBase64,
      numericId,
    };
  } catch (error) {
    throw new Error("Invalid keypair base64 format");
  }
}

/**
 * Generate wallet data for .env file
 */
export function generateEnvData(walletData: PhantomWalletData): string {
  return `# Phantom Wallet Generated
PHANTOM_WALLET_NUMERIC_ID=${walletData.numericId}
PHANTOM_WALLET_PUBLIC_KEY=${walletData.publicKey}
PHANTOM_WALLET_PRIVATE_KEY=${walletData.privateKey}
OUSDC_TOKEN=${walletData.keypairHex}
PHANTOM_WALLET_KEYPAIR_BASE64=${walletData.keypairBase64}
PHANTOM_WALLET_MNEMONIC="${walletData.mnemonic}"
`;
}
