/**
 * Utility functions để tạo key-pair từ mnemonic phrase
 */

import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export interface KeypairFromMnemonicResult {
  keypair: Keypair;
  address: string;
  publicKey: string;
  privateKey: string;
  secretKeyHex: string;
  secretKeyBase64: string;
}

/**
 * Tạo key-pair từ mnemonic phrase
 * @param mnemonic - Cụm 12 từ mnemonic
 * @param derivationPath - Đường dẫn derivation (mặc định: m/44'/501'/0'/0')
 * @returns Object chứa keypair và address
 */
export async function deriveSolanaFromMnemonic(
  mnemonic: string,
  derivationPath: string = `m/44'/501'/0'/0'`
): Promise<KeypairFromMnemonicResult> {
  try {
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Invalid mnemonic phrase");
    }

    // Tạo seed từ mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Derive key từ seed theo Solana derivation path
    const { key } = derivePath(
      derivationPath,
      Buffer.from(seed).toString("hex")
    );

    // Tạo keypair từ derived key
    const keypair = Keypair.fromSeed(Buffer.from(key));

    // Lấy address (public key)
    const address = bs58.encode(keypair.publicKey.toBytes());

    return {
      keypair,
      address,
      publicKey: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(keypair.secretKey),
      secretKeyHex: Buffer.from(keypair.secretKey).toString("hex"),
      secretKeyBase64: Buffer.from(keypair.secretKey).toString("base64"),
    };
  } catch (error) {
    throw new Error(
      `Failed to derive keypair: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Tạo nhiều key-pair từ cùng một mnemonic với các derivation path khác nhau
 * @param mnemonic - Cụm 12 từ mnemonic
 * @param count - Số lượng key-pair cần tạo (mặc định: 1)
 * @returns Array các key-pair
 */
export async function deriveMultipleSolanaFromMnemonic(
  mnemonic: string,
  count: number = 1
): Promise<KeypairFromMnemonicResult[]> {
  const results: KeypairFromMnemonicResult[] = [];

  for (let i = 0; i < count; i++) {
    const derivationPath = `m/44'/501'/${i}'/0'`;
    const result = await deriveSolanaFromMnemonic(mnemonic, derivationPath);
    results.push(result);
  }

  return results;
}

/**
 * Validate mnemonic phrase
 * @param mnemonic - Cụm từ mnemonic
 * @returns true nếu mnemonic hợp lệ
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Generate random mnemonic phrase
 * @param strength - Độ mạnh entropy (128, 160, 192, 224, 256)
 * @returns Mnemonic phrase
 */
export function generateMnemonic(strength: number = 128): string {
  return bip39.generateMnemonic(strength);
}

/**
 * Convert keypair result to environment variables format
 * @param result - Keypair result
 * @param prefix - Prefix cho environment variables (mặc định: SOLANA_WALLET)
 * @returns Object chứa environment variables
 */
export function keypairToEnvVars(
  result: KeypairFromMnemonicResult,
  prefix: string = "SOLANA_WALLET"
): Record<string, string> {
  return {
    [`${prefix}_ADDRESS`]: result.address,
    [`${prefix}_PUBLIC_KEY`]: result.publicKey,
    [`${prefix}_PRIVATE_KEY`]: result.privateKey,
    [`${prefix}_SECRET_KEY_HEX`]: result.secretKeyHex,
    [`${prefix}_SECRET_KEY_BASE64`]: result.secretKeyBase64,
  };
}
