import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { orcaSwapService } from "@/services/orca-swap.service";
import { addressFromEncMnemonic } from "@/lib/server/wallet";
import { USERS_COLLECTION } from "@/config/db";
import { TOKEN_ADDRESSES } from "@/types/swap";

/**
 * POST /api/orca-auto-swap
 * Automatic swap from oVND to oUSD when user has sufficient balance
 */
export async function POST(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

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
    const {
      minAmount = 1000, // Minimum amount to trigger auto swap
      maxAmount = 10000, // Maximum amount to swap at once
      slippage = 0.5,
    } = await req.json();

    // Get user's internal wallet
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

    // Check current oVND balance
    const currentOVNDBalance = userData.internalWallet.oVND || 0;
    const currentOUSDBalance = userData.internalWallet.oUSDC || 0;

    // Check if user has enough oVND to trigger auto swap
    if (currentOVNDBalance < minAmount) {
      return NextResponse.json({
        success: false,
        message: `Insufficient oVND balance for auto swap. Current: ${currentOVNDBalance}, Required: ${minAmount}`,
        currentBalance: currentOVNDBalance,
        requiredBalance: minAmount,
      });
    }

    // Determine swap amount (use maxAmount if available, otherwise use current balance)
    const swapAmount = Math.min(currentOVNDBalance, maxAmount);

    // Check if swap is possible
    const canSwapResult = await orcaSwapService.canSwap({
      tokenIn: TOKEN_ADDRESSES.oVND,
      tokenOut: TOKEN_ADDRESSES.oUSD,
      amountIn: swapAmount,
      slippage,
      userAddress,
      chainId: "solanaDevnet",
    });

    if (!canSwapResult.canSwap) {
      return NextResponse.json({
        success: false,
        error: canSwapResult.reason || "Auto swap not possible",
      });
    }

    // Get swap quote
    const quote = await orcaSwapService.getSwapQuote({
      tokenIn: TOKEN_ADDRESSES.oVND,
      tokenOut: TOKEN_ADDRESSES.oUSD,
      amountIn: swapAmount,
      slippage,
      userAddress,
      chainId: "solanaDevnet",
    });

    // Execute the swap
    const swapResult = await orcaSwapService.executeSwap({
      tokenIn: TOKEN_ADDRESSES.oVND,
      tokenOut: TOKEN_ADDRESSES.oUSD,
      amountIn: swapAmount,
      slippage,
      userAddress,
      chainId: "solanaDevnet",
    });

    if (!swapResult.success) {
      return NextResponse.json({
        success: false,
        error: swapResult.error || "Auto swap execution failed",
      });
    }

    // Update user's internal wallet balance
    const newOVNDBalance = currentOVNDBalance - swapAmount;
    const newOUSDBalance = currentOUSDBalance + quote.toAmount;

    await userRef.update({
      "internalWallet.oVND": newOVNDBalance,
      "internalWallet.oUSDC": newOUSDBalance,
      updatedAt: new Date(),
    });

    // Record auto swap transaction
    const swapId = `auto_swap_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    const swapRecord = {
      id: swapId,
      userId,
      fromToken: "oVND",
      toToken: "oUSD",
      fromAmount: swapAmount,
      toAmount: quote.toAmount,
      exchangeRate: quote.exchangeRate,
      slippage,
      status: "COMPLETED",
      timestamp: new Date(),
      transactionHash: `auto_swap_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`,
      notes: `Auto swap ${swapAmount} oVND → ${quote.toAmount} oUSD via Orca`,
      type: "AUTO_SWAP",
    };

    const swapRef = firebaseDb.collection("swap_transactions").doc(swapId);
    await swapRef.set({
      ...swapRecord,
      timestamp: swapRecord.timestamp.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Auto swap completed: ${swapAmount} oVND → ${quote.toAmount} oUSD`,
      swapId,
      transactionHash: swapRecord.transactionHash,
      exchangeRate: quote.exchangeRate,
      slippage,
      fromAmount: swapAmount,
      toAmount: quote.toAmount,
      newBalances: {
        oVND: newOVNDBalance,
        oUSD: newOUSDBalance,
      },
      note: "This is a simulated auto swap. Real Orca integration requires proper SDK setup.",
    });
  } catch (error) {
    console.error("[/api/orca-auto-swap] error:", error);
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
 * GET /api/orca-auto-swap
 * Get auto swap settings and status
 */
export async function GET(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

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

    // Get user's internal wallet
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentOVNDBalance = userData?.internalWallet?.oVND || 0;
    const currentOUSDBalance = userData?.internalWallet?.oUSDC || 0;

    // Get auto swap settings (if any)
    const autoSwapSettings = userData?.autoSwapSettings || {
      enabled: false,
      minAmount: 1000,
      maxAmount: 10000,
      slippage: 0.5,
    };

    // Get recent auto swap history
    const swapRef = firebaseDb.collection("swap_transactions");
    const snapshot = await swapRef
      .where("userId", "==", userId)
      .where("type", "==", "AUTO_SWAP")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const autoSwapHistory: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      autoSwapHistory.push({
        ...data,
        timestamp: data.timestamp,
      });
    });

    return NextResponse.json({
      success: true,
      settings: autoSwapSettings,
      currentBalances: {
        oVND: currentOVNDBalance,
        oUSD: currentOUSDBalance,
      },
      autoSwapHistory,
      canAutoSwap: currentOVNDBalance >= autoSwapSettings.minAmount,
    });
  } catch (error) {
    console.error("[/api/orca-auto-swap] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
