import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { RWAHolding } from "@/types/rwa";
import { mintFromManagerWallet } from "@/lib/solana-mint";
import { addressFromEncMnemonic } from "@/lib/server/wallet";

const HOLDINGS_COLLECTION = "rwa_holdings";

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

    const {
      assetId,
      assetName,
      quantity,
      unitPrice,
      totalPrice,
      currency,
      transactionHash: requestTransactionHash,
    } = await req.json();

    if (!assetId || !assetName || !quantity || !unitPrice || !totalPrice) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
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
    if (!userData?.internalWallet) {
      return NextResponse.json(
        { success: false, error: "Internal wallet not found" },
        { status: 404 }
      );
    }

    // Check if user has enough balance
    const currentBalance = userData.internalWallet[currency] || 0;
    if (currentBalance < totalPrice) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient ${currency} balance. Available: ${currentBalance}, Required: ${totalPrice}`,
        },
        { status: 400 }
      );
    }

    // Generate realistic transaction hash (64 characters hex)
    const transactionId = `rwa_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Use real transaction hash from blockchain instead of mock
    let transactionHash: string;

    // Check if we should use real blockchain transaction
    const useRealTransaction = process.env.USE_REAL_SOLANA_MINTING === "true";

    if (useRealTransaction) {
      // Get user's internal wallet address for minting
      const internalWalletAddress = await addressFromEncMnemonic(
        userData.internalWallet.encMnemonic
      );

      if (!internalWalletAddress) {
        return NextResponse.json(
          { success: false, error: "Failed to derive internal wallet address" },
          { status: 400 }
        );
      }

      // Mint tokens to user's internal wallet (this creates a real blockchain transaction)
      console.log("🚀 [RWA-PURCHASE] Minting tokens to internal wallet...");
      const mintResult = await mintFromManagerWallet(
        internalWalletAddress,
        totalPrice, // Amount to mint
        currency as "oVND" | "oUSDC"
      );

      if (!mintResult.success) {
        console.log("❌ [RWA-PURCHASE] Minting failed:", mintResult.error);
        return NextResponse.json(
          { success: false, error: `Minting failed: ${mintResult.error}` },
          { status: 500 }
        );
      }

      transactionHash = mintResult.txHash || `mint_${Date.now()}`;
      console.log(
        "✅ [RWA-PURCHASE] Minting successful, TX Hash:",
        transactionHash
      );
    } else {
      // Generate a realistic Solana transaction hash (64 hex characters)
      const generateSolanaTxHash = () => {
        const chars = "0123456789abcdef";
        let result = "";
        for (let i = 0; i < 64; i++) {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
      };
      transactionHash = generateSolanaTxHash();
    }

    // Update user's internal wallet balance
    const newBalance = currentBalance - totalPrice;
    const currentHoldings = userData.internalWallet.rwaHoldings || {};
    const currentAssetHoldings = currentHoldings[assetId] || {
      quantity: 0,
      totalCost: 0,
    };

    const newAssetHoldings = {
      quantity: currentAssetHoldings.quantity + quantity,
      totalCost: currentAssetHoldings.totalCost + totalPrice,
      averagePrice:
        (currentAssetHoldings.totalCost + totalPrice) /
        (currentAssetHoldings.quantity + quantity),
      lastPurchase: new Date(),
    };

    // Create or update holding in rwa_holdings collection
    const holdingId = `${uid}_${assetId}`;
    const holdingRef = firebaseDb
      .collection(HOLDINGS_COLLECTION)
      .doc(holdingId);
    const existingHolding = await holdingRef.get();

    let holding: RWAHolding;
    if (existingHolding.exists) {
      const existing = existingHolding.data() as RWAHolding;
      const totalQuantity = existing.quantity + quantity;
      const totalCost = existing.totalValue + totalPrice;
      const newAveragePrice = totalCost / totalQuantity;

      holding = {
        ...existing,
        quantity: totalQuantity,
        averagePrice: newAveragePrice,
        totalValue: totalCost,
        lastUpdated: new Date(),
      };
    } else {
      holding = {
        id: holdingId,
        userId: uid,
        assetId,
        assetName,
        issuer: "US Treasury", // This should come from asset data
        quantity,
        averagePrice: unitPrice,
        totalValue: totalPrice,
        currency,
        purchaseDate: new Date(),
        lastUpdated: new Date(),
        status: "ACTIVE",
      };
    }

    // Update user's internal wallet balance and create holdings atomically
    await firebaseDb.runTransaction(async (transaction) => {
      // Update user's internal wallet
      transaction.update(userRef, {
        [`internalWallet.${currency}`]: newBalance,
        [`internalWallet.rwaHoldings.${assetId}`]: newAssetHoldings,
        updatedAt: new Date(),
      });

      // Save/update holding in rwa_holdings collection
      transaction.set(holdingRef, {
        ...holding,
        purchaseDate: holding.purchaseDate.toISOString(),
        lastUpdated: holding.lastUpdated.toISOString(),
      });
    });

    // Record RWA purchase transaction
    const purchaseRecord = {
      id: transactionId,
      userId: uid,
      assetId,
      assetName,
      quantity,
      unitPrice,
      totalPrice,
      currency,
      transactionHash: transactionHash || requestTransactionHash,
      status: "COMPLETED",
      timestamp: new Date(),
      type: "PURCHASE",
      notes: `Purchased ${quantity} ${assetName} for ${totalPrice} ${currency}`,
    };

    const purchaseRef = firebaseDb
      .collection("rwa_transactions")
      .doc(transactionId);
    await purchaseRef.set({
      ...purchaseRecord,
      timestamp: purchaseRecord.timestamp.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${quantity} ${assetName}`,
      transactionId,
      transactionHash: purchaseRecord.transactionHash,
      assetTokens: `${quantity} ${assetName} tokens`,
      newBalance,
      assetHoldings: newAssetHoldings,
    });
  } catch (error) {
    console.error("[/api/rwa/purchase] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
