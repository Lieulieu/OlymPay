import { NextRequest, NextResponse } from "next/server";
import { createZaloPayAPI } from "@/lib/zalopay-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Initialize ZaloPay API
    const zalopayAPI = createZaloPayAPI();

    // Extract callback data
    const {
      app_id,
      app_trans_id,
      app_time,
      amount,
      app_user,
      zp_trans_id,
      server_time,
      merchant_id,
      trans_type,
      status,
      mac,
    } = body;

    // Verify signature using ZaloPay API
    const isValidSignature = zalopayAPI.verifyCallback(body, mac);

    if (!isValidSignature) {
      console.error("Invalid ZaloPay callback signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Log the payment result
    console.log("ZaloPay Callback:", {
      app_trans_id,
      zp_trans_id,
      amount,
      status,
      app_user,
    });

    // Handle successful payment
    if (status === 1) {
      // Here you would typically:
      // 1. Update your database with the successful payment
      // 2. Mint oVND tokens to the user's wallet
      // 3. Send confirmation email/SMS
      // 4. Update transaction status

      console.log(`Payment successful for transaction ${app_trans_id}`);

      // TODO: Implement oVND token minting
      // await mintOvndTokens(app_user, amount)

      return NextResponse.json({
        return_code: 1,
        return_message: "success",
      });
    } else {
      // Handle failed payment
      console.log(`Payment failed for transaction ${app_trans_id}`);

      return NextResponse.json({
        return_code: 0,
        return_message: "Payment failed",
      });
    }
  } catch (error) {
    console.error("ZaloPay callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
