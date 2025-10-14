import { NextRequest, NextResponse } from "next/server";
import { mintFromManagerWallet } from "@/lib/solana-mint";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { addressFromEncMnemonic } from "@/lib/server/wallet";
import { PaymentService } from "@/services/payment.service";

export async function POST(request: NextRequest) {
  try {
    console.log(
      "🚀 [MINT-AFTER-PAYMENT] Starting mint after payment process..."
    );

    const {
      paymentIntentId,
      userId,
      amount,
      currency,
      transactionId,
      walletAddress,
    } = await request.json();

    console.log("📋 [MINT-AFTER-PAYMENT] Received data:");
    console.log(`  - Payment Intent ID: ${paymentIntentId}`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Amount: ${amount}`);
    console.log(`  - Currency: ${currency}`);
    console.log(`  - Transaction ID: ${transactionId}`);
    console.log(`  - Wallet Address: ${walletAddress}`);

    if (
      !paymentIntentId ||
      !userId ||
      !amount ||
      !transactionId ||
      !walletAddress
    ) {
      console.log("❌ [MINT-AFTER-PAYMENT] Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const firebaseDb = db();
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(walletAddress);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.log("❌ [MINT-AFTER-PAYMENT] User not found in Firebase");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userSnap.data();

    if (!user?.internalWallet) {
      console.log("❌ [MINT-AFTER-PAYMENT] User internal wallet not found");
      return NextResponse.json(
        { error: "User internal wallet not found" },
        { status: 400 }
      );
    }

    const internalWalletAddress = await addressFromEncMnemonic(
      user.internalWallet.encMnemonic
    );

    if (!internalWalletAddress) {
      console.log(
        "❌ [MINT-AFTER-PAYMENT] Failed to derive internal wallet address"
      );
      return NextResponse.json(
        { error: "Failed to derive internal wallet address" },
        { status: 400 }
      );
    }

    // Check if manager wallet is configured (no need to pass keypair anymore)
    const hasManagerWallet =
      process.env.OUSDC_MANAGER_WALLET_KEYPAIR_BASE64 ||
      process.env.OUSDC_MANAGER_WALLET_PRIVATE_KEY ||
      process.env.OUSDC_TOKEN ||
      process.env.OUSDC_MANAGER_WALLET_MNEMONIC;

    if (!hasManagerWallet) {
      console.log("❌ [MINT-AFTER-PAYMENT] Manager wallet not configured");
      return NextResponse.json(
        { error: "Manager wallet not configured" },
        { status: 500 }
      );
    }

    // Convert amount to oUSDC (1:1 ratio with USD)
    const oUSDCAmount =
      currency === "usd"
        ? amount
        : currency === "eur"
        ? amount * 1.18 // Approximate EUR to USD
        : currency === "thb"
        ? amount / 35.5 // Approximate THB to USD
        : amount;

    // Mint oUSDC to internal wallet (no need to pass managerKeypairHex anymore)
    console.log("🚀 [MINT-AFTER-PAYMENT] Calling mintFromManagerWallet...");
    const mintResult = await mintFromManagerWallet(
      internalWalletAddress,
      oUSDCAmount,
      "oUSDC"
    );

    if (!mintResult.success) {
      console.log("❌ [MINT-AFTER-PAYMENT] Minting failed:", mintResult.error);
      return NextResponse.json(
        { error: `Minting failed: ${mintResult.error}` },
        { status: 500 }
      );
    }

    const currentBalance = user.internalWallet.oUSDC || 0;
    const newBalance = currentBalance + oUSDCAmount;

    await userRef.update({
      "internalWallet.oUSDC": newBalance,
      updatedAt: new Date(),
    });

    // Save payment information to database
    console.log(
      "💾 [MINT-AFTER-PAYMENT] Saving payment information to database..."
    );
    try {
      await PaymentService.createPayment(walletAddress, {
        paymentIntentId: paymentIntentId,
        amount: amount,
        currency: currency,
        transactionId: transactionId,
        walletAddress: walletAddress,
        internalWalletAddress: internalWalletAddress,
        tokenAmount: oUSDCAmount,
        tokenType: "oUSDC",
        metadata: {
          stripeCustomerId: user?.uid,
          description: `Payment for ${amount} ${currency} - Minted ${oUSDCAmount} oUSDC`,
        },
      });
      console.log(
        "✅ [MINT-AFTER-PAYMENT] Payment information saved successfully"
      );
    } catch (paymentError) {
      console.error(
        "⚠️ [MINT-AFTER-PAYMENT] Failed to save payment info:",
        paymentError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tokens minted successfully",
      data: {
        amount: oUSDCAmount,
        currency: "oUSDC",
        transactionHash: mintResult.txHash,
        newBalance: newBalance,
        paymentIntentId: paymentIntentId,
        transactionId: transactionId,
      },
    });
  } catch (error) {
    console.error(
      "💥 [MINT-AFTER-PAYMENT] Error minting tokens after payment:",
      error
    );
    return NextResponse.json(
      { error: "Failed to mint tokens" },
      { status: 500 }
    );
  }
}
