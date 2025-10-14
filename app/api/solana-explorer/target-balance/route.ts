import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

const TARGET_WALLET_ADDRESS = "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV";
const OUSDC_MINT_ADDRESS = "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV";

export async function GET() {
  try {
    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const mintPublicKey = new PublicKey(OUSDC_MINT_ADDRESS);
    const targetPublicKey = new PublicKey(TARGET_WALLET_ADDRESS);

    // Get target wallet's associated token account
    const targetTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      targetPublicKey
    );

    try {
      // Get token account info
      const tokenAccount = await getAccount(connection, targetTokenAccount);

      // Convert balance from token units to oUSDC (6 decimals)
      const oUSDCBalance = Number(tokenAccount.amount) / 1_000_000;

      console.log(
        "oUSDC Balance fetched from Solana Explorer for target address:",
        {
          walletAddress: TARGET_WALLET_ADDRESS,
          tokenAccount: targetTokenAccount.toString(),
          balance: tokenAccount.amount,
          balanceInOUSDC: oUSDCBalance,
        }
      );

      return NextResponse.json({
        success: true,
        walletAddress: TARGET_WALLET_ADDRESS,
        oUSDCBalance,
        oUSDCBalanceFormatted: oUSDCBalance.toLocaleString("vi-VN", {
          maximumFractionDigits: 6,
        }),
        tokenAccount: targetTokenAccount.toString(),
        source: "solana-explorer-target",
        explorerUrl: `https://explorer.solana.com/address/${TARGET_WALLET_ADDRESS}?cluster=devnet`,
      });
    } catch (error) {
      // Token account doesn't exist or has no balance
      console.log(
        "No oUSDC token account found for target address:",
        TARGET_WALLET_ADDRESS
      );

      return NextResponse.json({
        success: true,
        walletAddress: TARGET_WALLET_ADDRESS,
        oUSDCBalance: 0,
        oUSDCBalanceFormatted: "0",
        tokenAccount: targetTokenAccount.toString(),
        message: "No oUSDC token account found for target address",
        source: "solana-explorer-target",
        explorerUrl: `https://explorer.solana.com/address/${TARGET_WALLET_ADDRESS}?cluster=devnet`,
      });
    }
  } catch (error) {
    console.error(
      "Error fetching oUSDC balance from Solana Explorer for target address:",
      error
    );
    return NextResponse.json(
      {
        error:
          "Failed to fetch oUSDC balance from Solana Explorer for target address",
        details: error instanceof Error ? error.message : "Unknown error",
        walletAddress: TARGET_WALLET_ADDRESS,
        explorerUrl: `https://explorer.solana.com/address/${TARGET_WALLET_ADDRESS}?cluster=devnet`,
      },
      { status: 500 }
    );
  }
}

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

    const mintPublicKey = new PublicKey(OUSDC_MINT_ADDRESS);
    const userPublicKey = new PublicKey(walletAddress);

    // Get user's associated token account
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      userPublicKey
    );

    try {
      // Get token account info
      const tokenAccount = await getAccount(connection, userTokenAccount);

      // Convert balance from token units to oUSDC (6 decimals)
      const oUSDCBalance = Number(tokenAccount.amount) / 1_000_000;

      console.log("oUSDC Balance fetched from Solana Explorer:", {
        walletAddress,
        tokenAccount: userTokenAccount.toString(),
        balance: tokenAccount.amount,
        balanceInOUSDC: oUSDCBalance,
      });

      return NextResponse.json({
        success: true,
        walletAddress,
        oUSDCBalance,
        oUSDCBalanceFormatted: oUSDCBalance.toLocaleString("vi-VN", {
          maximumFractionDigits: 6,
        }),
        tokenAccount: userTokenAccount.toString(),
        source: "solana-explorer",
        explorerUrl: `https://explorer.solana.com/address/${walletAddress}?cluster=devnet`,
      });
    } catch (error) {
      // Token account doesn't exist or has no balance
      console.log("No oUSDC token account found for:", walletAddress);

      return NextResponse.json({
        success: true,
        walletAddress,
        oUSDCBalance: 0,
        oUSDCBalanceFormatted: "0",
        tokenAccount: userTokenAccount.toString(),
        message: "No oUSDC token account found",
        source: "solana-explorer",
        explorerUrl: `https://explorer.solana.com/address/${walletAddress}?cluster=devnet`,
      });
    }
  } catch (error) {
    console.error("Error fetching oUSDC balance from Solana Explorer:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch oUSDC balance from Solana Explorer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
