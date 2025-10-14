import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import {
  swapOVNDToUSD,
  getSwapQuote,
  getUserSwapHistory,
  getCurrentExchangeRate,
  checkUserBalance,
} from "@/lib/swap-functions";
import { SwapRequest } from "@/types/swap";
import { addressFromEncMnemonic } from "@/lib/server/wallet";
import { USERS_COLLECTION } from "@/config/db";

/**
 * POST /api/swap/ovnd-to-usd
 * Execute swap from oVND to oUSD
 */
export async function POST(req: NextRequest) {
  try {
    const firebaseAuth = auth();

    // Verify authentication
    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    // Parse request body
    const { amount, slippage = 0.5 } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Get user's internal wallet address
    const firebaseDb = db();
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(userId);
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

    // Get internal wallet address
    const userAddress = await addressFromEncMnemonic(
      userData.internalWallet.encMnemonic
    );

    // Check user balance
    const balanceCheck = await checkUserBalance(userId, amount);
    if (!balanceCheck.hasBalance) {
      return NextResponse.json(
        {
          success: false,
          error:
            balanceCheck.error ||
            `Insufficient oVND balance. Available: ${balanceCheck.currentBalance}, Required: ${amount}`,
        },
        { status: 400 }
      );
    }

    // Create swap request
    const swapRequest: SwapRequest = {
      fromToken: "oVND",
      toToken: "oUSD",
      amount,
      slippage,
      userAddress,
    };

    // Execute swap
    const swapResult = await swapOVNDToUSD(swapRequest, userId);

    if (swapResult.success) {
      return NextResponse.json({
        success: true,
        message: swapResult.message,
        swapId: swapResult.swapId,
        transactionHash: swapResult.transactionHash,
        exchangeRate: swapResult.exchangeRate,
        slippage: swapResult.slippage,
        note: "This is a simulated swap. Real Orca integration requires proper SDK setup.",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: swapResult.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[/api/swap/ovnd-to-usd] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/swap/ovnd-to-usd
 * Get swap quote for oVND to oUSD
 */
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

    // For quote, we can use a mock user address since we're not executing
    const mockUserAddress = "11111111111111111111111111111111";

    // Get swap quote
    const quote = await getSwapQuote(amount, slippage, mockUserAddress);

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get swap quote",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: {
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        exchangeRate: quote.exchangeRate,
        slippage: quote.slippage,
        estimatedGas: quote.estimatedGas,
        priceImpact: quote.priceImpact,
        minimumReceived: quote.minimumReceived,
        validUntil: quote.validUntil,
        note: "This is a simulated quote. Real quotes require Orca SDK integration.",
      },
    });
  } catch (error) {
    console.error("[/api/swap/ovnd-to-usd] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
