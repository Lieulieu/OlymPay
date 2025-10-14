import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, amount = 0.2 } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (amount <= 0 || amount > 2) {
      return NextResponse.json(
        { success: false, error: "Amount must be between 0 and 2 SOL" },
        { status: 400 }
      );
    }

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const publicKey = new PublicKey(walletAddress);

    console.log(`🚀 Airdropping ${amount} SOL to ${walletAddress}`);

    try {
      // Request airdrop from Solana devnet
      const signature = await connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );

      console.log(`✅ Airdrop signature: ${signature}`);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Get updated balance
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;

      console.log(`💰 New SOL balance: ${solBalance} SOL`);

      return NextResponse.json({
        success: true,
        message: `Successfully airdropped ${amount} SOL`,
        signature,
        walletAddress,
        amount,
        newBalance: solBalance,
      });
    } catch (airdropError) {
      console.error("Airdrop failed:", airdropError);

      // Check if wallet already has sufficient balance
      const currentBalance = await connection.getBalance(publicKey);
      const currentSolBalance = currentBalance / LAMPORTS_PER_SOL;

      if (currentSolBalance >= amount) {
        return NextResponse.json({
          success: true,
          message: `Wallet already has sufficient SOL balance: ${currentSolBalance} SOL`,
          walletAddress,
          amount,
          currentBalance: currentSolBalance,
          note: "No airdrop needed - sufficient balance already exists",
        });
      }

      throw airdropError;
    }
  } catch (error) {
    console.error("Error in SOL airdrop:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Airdrop failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    return NextResponse.json({
      success: true,
      walletAddress,
      solBalance,
      lamports: balance,
    });
  } catch (error) {
    console.error("Error checking SOL balance:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to check balance",
      },
      { status: 500 }
    );
  }
}
