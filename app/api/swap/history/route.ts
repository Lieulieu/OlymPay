import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/firebase-admin";
import { getUserSwapHistory } from "@/lib/swap-functions";

/**
 * GET /api/swap/history
 * Get user's swap transaction history
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

    // Get swap history
    const swapHistory = await getUserSwapHistory(userId);

    return NextResponse.json({
      success: true,
      swaps: swapHistory,
      total: swapHistory.length,
    });
  } catch (error) {
    console.error("[/api/swap/history] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
