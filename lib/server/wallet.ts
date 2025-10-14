import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { decryptMnemonic } from "./crypto";
import { HDNodeWallet } from "ethers";

export async function deriveSolanaFromMnemonic(mnemonic: string) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const { key } = derivePath(
    `m/44'/501'/0'/0'`,
    Buffer.from(seed).toString("hex")
  );
  const kp = Keypair.fromSeed(Buffer.from(key));
  const address = bs58.encode(kp.publicKey.toBytes());
  const privateKey = bs58.encode(kp.secretKey);
  const publicKey = kp.publicKey.toBase58();
  return { keypair: kp, address, privateKey, publicKey };
}

export async function deriveEthereumFromMnemonic(mnemonic: string) {
  const wallet = HDNodeWallet.fromPhrase(mnemonic);
  const address = wallet.address;
  const privateKey = wallet.privateKey;
  return { address, privateKey };
}

export async function addressFromEncMnemonic(enc: {
  ciphertext: string;
  iv: string;
  tag: string;
}) {
  const mnemonic = decryptMnemonic(enc);
  const { address } = await deriveSolanaFromMnemonic(mnemonic);
  return address;
}
