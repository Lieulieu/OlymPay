import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { checkUserBalance } from "@/lib/swap-functions";
import { USERS_COLLECTION } from "@/config/db";

/**
 * GET /api/swap/balance
 * Check user's oVND balance for swap
 */
export async function GET(req: NextRequest) {
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

    // Get user's internal wallet balance
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
    const oVNDBalance = userData?.internalWallet?.oVND || 0;
    const oUSDBalance = userData?.internalWallet?.oUSDC || 0;

    return NextResponse.json({
      success: true,
      balances: {
        oVND: oVNDBalance,
        oUSD: oUSDBalance,
      },
      canSwap: oVNDBalance > 0,
    });
  } catch (error) {
    console.error("[/api/swap/balance] error:", error);
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
 * POST /api/swap/balance
 * Check if user has sufficient balance for a specific swap amount
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
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Check user balance
    const balanceCheck = await checkUserBalance(userId, amount);

    return NextResponse.json({
      success: true,
      hasBalance: balanceCheck.hasBalance,
      currentBalance: balanceCheck.currentBalance,
      requiredAmount: amount,
      canSwap: balanceCheck.hasBalance,
      error: balanceCheck.error,
    });
  } catch (error) {
    console.error("[/api/swap/balance] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
