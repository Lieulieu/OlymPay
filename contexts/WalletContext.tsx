"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { fetchOvndBalance } from "@/lib/ovnd-contract";

interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  connection: Connection | null;
  balance: number | null;
  usdcBalance: number | null;
  ovndBalance: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [ovndBalance, setOvndBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize connection to Solana devnet
  useEffect(() => {
    const conn = new Connection("https://api.devnet.solana.com", "confirmed");
    setConnection(conn);
  }, []);

  // Check if Phantom wallet is installed
  const isPhantomInstalled = () => {
    return (
      typeof window !== "undefined" && window.solana && window.solana.isPhantom
    );
  };

  // USDC Token Mint Address on Solana Devnet
  const USDC_MINT = new PublicKey(
    "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV"
  );

  // Fetch SOL balance
  const fetchBalance = async (publicKey: PublicKey) => {
    if (!connection) return;

    try {
      const balance = await connection.getBalance(publicKey);
      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      setBalance(balance / 1_000_000_000);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
    }
  };

  // Fetch USDC balance
  const fetchUsdcBalance = async (publicKey: PublicKey) => {
    if (!connection) return;

    try {
      // Get the associated token address for USDC
      const associatedTokenAddress = await getAssociatedTokenAddress(
        USDC_MINT,
        publicKey
      );

      // Get the token account info
      const tokenAccount = await getAccount(connection, associatedTokenAddress);

      // Convert to USDC (USDC has 6 decimals)
      setUsdcBalance(Number(tokenAccount.amount) / 1_000_000);
    } catch (error) {
      // If no token account exists, balance is 0
      if (
        error instanceof Error &&
        error.message.includes("could not find account")
      ) {
        setUsdcBalance(0);
      } else {
        console.error("Failed to fetch USDC balance:", error);
        setUsdcBalance(null);
      }
    }
  };

  // Fetch oVND balance from smart contract
  const fetchOvndBalanceFromContract = async (publicKey: PublicKey) => {
    if (!connection) return;

    try {
      const balance = await fetchOvndBalance(connection, publicKey);
      setOvndBalance(balance);
    } catch (error) {
      console.error("Failed to fetch oVND balance from contract:", error);
      setOvndBalance(null);
    }
  };

  // Connect to Phantom wallet
  const connect = async () => {
    if (!isPhantomInstalled()) {
      alert(
        "Phantom wallet is not installed. Please install it from https://phantom.app/"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await window.solana!.connect();
      const newPublicKey = new PublicKey(response.publicKey.toString());
      setPublicKey(newPublicKey);
      setConnected(true);

      // Fetch balances after connecting
      await Promise.all([
        fetchBalance(newPublicKey),
        fetchUsdcBalance(newPublicKey),
        fetchOvndBalanceFromContract(newPublicKey),
      ]);

      // Listen for account changes
      window.solana!.on("accountChanged", async (publicKey: PublicKey) => {
        if (publicKey) {
          const newPublicKey = new PublicKey(publicKey.toString());
          setPublicKey(newPublicKey);
          await Promise.all([
            fetchBalance(newPublicKey),
            fetchUsdcBalance(newPublicKey),
            fetchOvndBalanceFromContract(newPublicKey),
          ]);
        } else {
          setConnected(false);
          setPublicKey(null);
          setBalance(null);
          setUsdcBalance(null);
          setOvndBalance(null);
        }
      });

      // Listen for disconnect events
      window.solana!.on("disconnect", () => {
        setConnected(false);
        setPublicKey(null);
        setBalance(null);
        setUsdcBalance(null);
        setOvndBalance(null);
      });
    } catch (error) {
      console.error("Failed to connect to Phantom wallet:", error);
      alert("Failed to connect to Phantom wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from wallet
  const disconnect = async () => {
    if (window.solana && window.solana.disconnect) {
      await window.solana.disconnect();
    }
    setConnected(false);
    setPublicKey(null);
    setBalance(null);
    setUsdcBalance(null);
    setOvndBalance(null);
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        publicKey,
        connection,
        balance,
        usdcBalance,
        ovndBalance,
        connect,
        disconnect,
        loading,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
