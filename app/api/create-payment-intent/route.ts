import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, usdcAmount, transactionId, walletAddress } =
      await request.json();

    console.log("Stripe Payment Intent Request:", {
      amount,
      currency,
      usdcAmount,
      transactionId,
      walletAddress,
    });

    // Validate required fields (similar to Zalo flow)
    if (!amount || !currency || !transactionId || !walletAddress) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: amount, currency, transactionId, walletAddress",
        },
        { status: 400 }
      );
    }

    // Validate amount based on currency
    const minAmounts = {
      usd: 1000, // $10 minimum
      eur: 850, // €8.50 minimum (approximate)
      thb: 35500, // ฿355 minimum (approximate)
    };

    const maxAmounts = {
      usd: 1000000, // $10,000 maximum
      eur: 850000, // €8,500 maximum (approximate)
      thb: 35500000, // ฿355,000 maximum (approximate)
    };

    if (amount < minAmounts[currency as keyof typeof minAmounts]) {
      return NextResponse.json(
        {
          error: `Amount must be at least ${
            currency === "usd" ? "$10" : currency === "eur" ? "€8.50" : "฿355"
          }`,
        },
        { status: 400 }
      );
    }

    if (amount > maxAmounts[currency as keyof typeof maxAmounts]) {
      return NextResponse.json(
        {
          error: `Amount must be less than ${
            currency === "usd"
              ? "$10,000"
              : currency === "eur"
              ? "€8,500"
              : "฿355,000"
          }`,
        },
        { status: 400 }
      );
    }

    // Create payment intent with description including transaction ID
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      description: `Purchase ${usdcAmount} oUSDC on Solana - OlymPay [${transactionId}]`,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "crypto_purchase",
        network: "solana",
        usdc_amount: usdcAmount?.toString() || "0",
        currency: currency,
        transaction_id: transactionId || "",
        wallet_address: walletAddress || "",
      },
    });

    console.log("✅ Stripe Payment Intent created:", {
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      transactionId: transactionId,
      walletAddress: walletAddress,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transactionId: transactionId,
      amount: amount,
      currency: currency,
      usdcAmount: usdcAmount,
      walletAddress: walletAddress,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
