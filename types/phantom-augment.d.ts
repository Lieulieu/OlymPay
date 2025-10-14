import type { PublicKey } from "@solana/web3.js";

declare global {
  interface PhantomSignMessageResult {
    signature: Uint8Array;
    publicKey?: PublicKey | Uint8Array;
  }

  interface PhantomProvider {
    isPhantom?: boolean;
    publicKey?: PublicKey;
    connect: () => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
    signMessage?: (
      message: Uint8Array,
      display?: "utf8" | "hex"
    ) => Promise<PhantomSignMessageResult>;

    request?: (args: { method: string; params?: any }) => Promise<any>;
  }

  interface Window {
    solana?: PhantomProvider;
  }
}

export {};
