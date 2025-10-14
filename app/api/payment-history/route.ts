import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";

export async function GET(request: NextRequest) {
  try {
    console.log("📋 [PAYMENT-HISTORY] Fetching payment history...");

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    console.log(`  - User ID: ${userId}`);
    console.log(`  - Page: ${page}, Limit: ${limit}`);

    if (!userId) {
      console.log("❌ [PAYMENT-HISTORY] Missing userId parameter");
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const paymentHistory = await PaymentService.getPaymentHistory(
      userId,
      page,
      limit
    );

    console.log(
      `✅ [PAYMENT-HISTORY] Found ${paymentHistory.payments.length} payments`
    );

    return NextResponse.json({
      success: true,
      data: paymentHistory,
    });
  } catch (error) {
    console.error(
      "❌ [PAYMENT-HISTORY] Error fetching payment history:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📊 [PAYMENT-STATS] Fetching payment statistics...");

    const { userId } = await request.json();

    console.log(`  - User ID: ${userId}`);

    if (!userId) {
      console.log("❌ [PAYMENT-STATS] Missing userId parameter");
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const stats = await PaymentService.getPaymentStats(userId);

    console.log(`✅ [PAYMENT-STATS] Statistics calculated:`);
    console.log(`  - Total Payments: ${stats.totalPayments}`);
    console.log(`  - Total Amount: ${stats.totalAmount}`);
    console.log(`  - Total Tokens: ${stats.totalTokens}`);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ [PAYMENT-STATS] Error calculating payment stats:", error);
    return NextResponse.json(
      { error: "Failed to calculate payment statistics" },
      { status: 500 }
    );
  }
}
