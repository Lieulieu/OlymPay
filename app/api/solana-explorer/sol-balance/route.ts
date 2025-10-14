import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const userPublicKey = new PublicKey(walletAddress);

    try {
      // Get SOL balance
      const balance = await connection.getBalance(userPublicKey);

      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      const solBalance = balance / 1_000_000_000;

      console.log("SOL Balance fetched:", {
        walletAddress,
        balance: balance,
        balanceInSOL: solBalance,
      });

      return NextResponse.json({
        success: true,
        walletAddress,
        balance: solBalance,
        rawBalance: balance,
        explorerUrl: `https://explorer.solana.com/address/${walletAddress}?cluster=devnet`,
      });
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch SOL balance",
        walletAddress,
        balance: 0,
      });
    }
  } catch (error) {
    console.error("Error in SOL balance API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check SOL balance",
        success: false,
      },
      { status: 500 }
    );
  }
}
