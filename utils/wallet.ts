export const money = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

import bs58 from "bs58";

export async function signNonceWithWallet(nonce: string): Promise<string> {
  const provider = window.solana;
  if (!provider?.signMessage) {
    throw new Error(
      "Wallet does not support signMessage. Please update Phantom."
    );
  }

  const encoded = new TextEncoder().encode(nonce);
  const { signature } = await provider.signMessage(encoded, "utf8");
  return bs58.encode(signature);
}

export function short(addr?: string | null) {
  if (!addr) return "";
  return addr.length <= 10 ? addr : `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
