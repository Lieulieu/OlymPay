import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, tokenType = "oVND" } = await request.json();

    // Validate input
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate token type
    if (!["oVND", "oUSDC"].includes(tokenType)) {
      return NextResponse.json(
        { error: "Invalid token type. Only oVND and oUSDC are supported" },
        { status: 400 }
      );
    }

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Token addresses
    const oVND_MINT_ADDRESS = "EbNKsXtiUQQ972QEF172kRQPhVb6MJpx5NwZ6LX8H69b";
    const oUSDC_MINT_ADDRESS = "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV";

    const mintAddress =
      tokenType === "oVND" ? oVND_MINT_ADDRESS : oUSDC_MINT_ADDRESS;
    const mintPublicKey = new PublicKey(mintAddress);
    const walletPublicKey = new PublicKey(walletAddress);

    console.log(
      `🔍 Checking ${tokenType} balance for wallet: ${walletAddress}`
    );
    console.log(`Token Mint Address: ${mintAddress}`);

    try {
      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
      );

      console.log(`Token Account: ${tokenAccount.toString()}`);

      // Get token account info
      const accountInfo = await getAccount(connection, tokenAccount);

      // Convert balance from smallest unit to token units (9 decimals)
      const balance = Number(accountInfo.amount) / Math.pow(10, 9);

      console.log(`✅ ${tokenType} Balance: ${balance}`);

      return NextResponse.json({
        success: true,
        walletAddress: walletAddress,
        tokenType: tokenType,
        tokenAccount: tokenAccount.toString(),
        balance: balance,
        rawBalance: accountInfo.amount.toString(),
        decimals: accountInfo.mint.toString() === mintAddress ? 9 : "unknown",
        mintAddress: mintAddress,
        explorerUrl: `https://explorer.solana.com/address/${tokenAccount}?cluster=devnet`,
      });
    } catch (error) {
      // Token account doesn't exist
      console.log(`❌ Token account not found for ${tokenType}`);

      return NextResponse.json({
        success: true,
        walletAddress: walletAddress,
        tokenType: tokenType,
        balance: 0,
        rawBalance: "0",
        decimals: 9,
        mintAddress: mintAddress,
        message: `No ${tokenType} token account found for this wallet`,
        tokenAccount: null,
        explorerUrl: null,
      });
    }
  } catch (error) {
    console.error("Error checking token balance:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check token balance",
        success: false,
      },
      { status: 500 }
    );
  }
}
