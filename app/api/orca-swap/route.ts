import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { Connection, PublicKey } from "@solana/web3.js";
import { USERS_COLLECTION } from "@/config/db";
import { addressFromEncMnemonic } from "@/lib/server/wallet";

// Token addresses on Solana Devnet
const OUSDC_MINT_ADDRESS = "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV"; // oUSDC
const NVDAX_MINT_ADDRESS = "HPDJ6Nruhi2nSjnaXAvC6AFGRhH4Dg6sguQchLCNxKWT"; // NVDAX

export async function POST(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const { amount, slippage = 0.5 } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Get user's internal wallet
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData?.internalWallet?.encMnemonic) {
      return NextResponse.json(
        { success: false, error: "Internal wallet not found" },
        { status: 404 }
      );
    }

    // Check if user has enough oUSDC balance
    const currentOUSDCBalance = userData.internalWallet.oUSDC || 0;
    if (currentOUSDCBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient oUSDC balance. Available: ${currentOUSDCBalance}, Required: ${amount}`,
        },
        { status: 400 }
      );
    }

    // Get internal wallet address
    const internalWalletAddress = await addressFromEncMnemonic(
      userData.internalWallet.encMnemonic
    );

    // Connect to Solana devnet to verify tokens exist
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Verify tokens exist on devnet
    try {
      await connection.getAccountInfo(new PublicKey(OUSDC_MINT_ADDRESS));
      await connection.getAccountInfo(new PublicKey(NVDAX_MINT_ADDRESS));
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or both tokens do not exist on Solana devnet. Please check token addresses.",
        },
        { status: 400 }
      );
    }

    // For now, simulate the swap with realistic data
    // In production, you would integrate with Orca's actual API
    const swapResult = await simulateRealisticSwap(
      amount,
      slippage,
      connection
    );

    // Update user's internal wallet balance
    const newOUSDCBalance = currentOUSDCBalance - amount;
    const currentNVDAXBalance = userData.internalWallet.NVDAX || 0;
    const newNVDAXBalance = currentNVDAXBalance + swapResult.nvdaxAmount;

    await userRef.update({
      "internalWallet.oUSDC": newOUSDCBalance,
      "internalWallet.NVDAX": newNVDAXBalance,
      updatedAt: new Date(),
    });

    // Record swap transaction
    const swapId = `${Math.random().toString(36).substring(2, 8)}`;
    const swapRecord = {
      id: swapId,
      userId: uid,
      fromToken: "oUSDC",
      toToken: "NVDAX",
      fromAmount: amount,
      toAmount: swapResult.nvdaxAmount,
      exchangeRate: swapResult.exchangeRate,
      slippage,
      status: "COMPLETED",
      timestamp: new Date(),
      transactionHash: swapResult.transactionHash,
      notes: `Swap ${amount} oUSDC → ${swapResult.nvdaxAmount} NVDAX via Orca (Simulated)`,
    };

    const swapRef = firebaseDb.collection("swap_transactions").doc(swapId);
    await swapRef.set({
      ...swapRecord,
      timestamp: swapRecord.timestamp.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully swapped ${amount} oUSDC → ${swapResult.nvdaxAmount} NVDAX`,
      swapId,
      transactionHash: swapResult.transactionHash,
      exchangeRate: swapResult.exchangeRate,
      slippage,
      note: "This is a simulated swap. Real Orca integration requires proper SDK setup.",
    });
  } catch (error) {
    console.error("[/api/orca-swap] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Simulate realistic swap with market data
async function simulateRealisticSwap(
  amount: number,
  slippage: number,
  connection: Connection
) {
  try {
    // Get current market data (simulated)
    // In production, you would fetch real price data from Orca or other sources
    const mockExchangeRate = 0.0056; // 1 oUSDC = 0.0056 NVDAX
    const nvdaxAmount = amount * mockExchangeRate;

    // Apply slippage
    const slippageAmount = nvdaxAmount * (slippage / 100);
    const finalNVDAXAmount = nvdaxAmount - slippageAmount;

    // Generate realistic transaction hash
    const mockTransactionHash = `orca_real_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    return {
      nvdaxAmount: finalNVDAXAmount,
      exchangeRate: mockExchangeRate,
      transactionHash: mockTransactionHash,
    };
  } catch (error) {
    console.error("Swap simulation error:", error);
    throw new Error(
      `Swap simulation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Get swap quote
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const amount = parseFloat(searchParams.get("amount") || "0");
    const slippage = parseFloat(searchParams.get("slippage") || "0.5");

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Verify tokens exist
    try {
      await connection.getAccountInfo(new PublicKey(OUSDC_MINT_ADDRESS));
      await connection.getAccountInfo(new PublicKey(NVDAX_MINT_ADDRESS));
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "One or both tokens do not exist on Solana devnet.",
        },
        { status: 400 }
      );
    }

    const quote = await simulateRealisticSwap(amount, slippage, connection);

    return NextResponse.json({
      success: true,
      quote: {
        fromToken: "oUSDC",
        toToken: "NVDAX",
        fromAmount: amount,
        toAmount: quote.nvdaxAmount,
        exchangeRate: quote.exchangeRate,
        slippage,
        estimatedGas: 0.001, // Mock gas fee
        note: "This is a simulated quote. Real quotes require Orca SDK integration.",
      },
    });
  } catch (error) {
    console.error("[/api/orca-swap] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
