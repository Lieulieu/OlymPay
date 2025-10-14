import crypto from "crypto";
import { EncryptedPrivateKey } from "@/types/wallet";

const ENC_KEY = Buffer.from(process.env.MNEMONIC_AES_KEY_B64!, "base64"); // 32B AES-256-GCM
const HMAC_KEY = Buffer.from(process.env.ADDR_INDEX_KEY_BASE64!, "base64"); // HMAC index key

export function encryptMnemonic(mnemonic: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(mnemonic, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    version: 1,
  };
}

export function decryptMnemonic(enc: {
  ciphertext: string;
  iv: string;
  tag: string;
}) {
  const iv = Buffer.from(enc.iv, "base64");
  const tag = Buffer.from(enc.tag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([
    decipher.update(Buffer.from(enc.ciphertext, "base64")),
    decipher.final(),
  ]);
  return out.toString("utf8");
}

export function digestAddress(address: string) {
  return crypto
    .createHmac("sha256", HMAC_KEY)
    .update(address)
    .digest("base64url");
}

export function hashWalletAddress(address: string) {
  return crypto
    .createHmac("sha256", HMAC_KEY)
    .update(address)
    .digest("base64url");
}

// Mới: Mã hóa private key
export function encryptPrivateKey(privateKey: string): EncryptedPrivateKey {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    version: 1,
  };
}

// Mới: Giải mã private key
export function decryptPrivateKey(enc: EncryptedPrivateKey): string {
  const iv = Buffer.from(enc.iv, "base64");
  const tag = Buffer.from(enc.tag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([
    decipher.update(Buffer.from(enc.ciphertext, "base64")),
    decipher.final(),
  ]);
  return out.toString("utf8");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function genReferralCode(len = 8) {
  const buf = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}
