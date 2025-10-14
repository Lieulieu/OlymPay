import { NextRequest, NextResponse } from "next/server";
import { getCurrentExchangeRate } from "@/lib/swap-functions";

/**
 * GET /api/swap/rate
 * Get current exchange rate between oVND and oUSD
 */
export async function GET(req: NextRequest) {
  try {
    const exchangeRate = await getCurrentExchangeRate();

    return NextResponse.json({
      success: true,
      rate: exchangeRate,
      fromToken: "oVND",
      toToken: "oUSD",
      timestamp: new Date().toISOString(),
      note: "This is a simulated rate. Real rates require Orca SDK integration.",
    });
  } catch (error) {
    console.error("[/api/swap/rate] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
