import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { RWATransaction, RWAHolding, DepositTransaction } from "@/types/rwa";

const TRANSACTIONS_COLLECTION = "rwa_transactions";
const HOLDINGS_COLLECTION = "rwa_holdings";
const DEPOSITS_COLLECTION = "deposit_transactions";

// API to record RWA purchase transaction
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
      amount,
      price,
      currency,
      paymentMethod,
      transactionHash,
      fees = 0,
      notes,
    } = await req.json();

    if (!assetId || !assetName || !amount || !price || !currency) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transactionId = `RWA_TX_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Create transaction record
    const transaction: RWATransaction = {
      id: transactionId,
      userId: uid,
      assetId,
      assetName,
      transactionType: "PURCHASE",
      amount,
      price,
      currency,
      paymentMethod,
      status: "COMPLETED",
      transactionHash,
      timestamp: new Date(),
      fees,
      notes,
    };

    // Create or update holding
    const holdingId = `${uid}_${assetId}`;
    const holdingRef = firebaseDb
      .collection(HOLDINGS_COLLECTION)
      .doc(holdingId);
    const existingHolding = await holdingRef.get();

    let holding: RWAHolding;
    if (existingHolding.exists) {
      const existing = existingHolding.data() as RWAHolding;
      const totalQuantity = existing.quantity + amount;
      const totalCost = existing.totalValue + amount * price;
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
        quantity: amount,
        averagePrice: price,
        totalValue: amount * price,
        currency,
        purchaseDate: new Date(),
        lastUpdated: new Date(),
        status: "ACTIVE",
      };
    }

    // Create transaction data
    const transactionData = {
      id: transactionId,
      userId: uid,
      assetId,
      assetName,
      amount,
      price,
      currency,
      timestamp: new Date(),
      status: "COMPLETED",
      type: "PURCHASE",
    };

    // Save transaction and holding atomically
    await firebaseDb.runTransaction(async (firestoreTransaction) => {
      // Save transaction
      const txRef = firebaseDb
        .collection(TRANSACTIONS_COLLECTION)
        .doc(transactionId);
      firestoreTransaction.set(txRef, {
        ...transactionData,
        timestamp: transactionData.timestamp.toISOString(),
      });

      // Save/update holding
      firestoreTransaction.set(holdingRef, {
        ...holding,
        purchaseDate: holding.purchaseDate.toISOString(),
        lastUpdated: holding.lastUpdated.toISOString(),
      });
    });

    return NextResponse.json({
      success: true,
      transactionId,
      holding: {
        ...holding,
        purchaseDate: holding.purchaseDate.toISOString(),
        lastUpdated: holding.lastUpdated.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error recording RWA transaction:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// API to get user's transaction history
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get transactions
    const transactionsRef = firebaseDb
      .collection(TRANSACTIONS_COLLECTION)
      .where("userId", "==", uid)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .offset(offset);

    const transactionsSnapshot = await transactionsRef.get();
    const transactions = transactionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: new Date(data.timestamp),
      };
    });

    // Get holdings
    const holdingsRef = firebaseDb
      .collection(HOLDINGS_COLLECTION)
      .where("userId", "==", uid)
      .where("status", "==", "ACTIVE");

    const holdingsSnapshot = await holdingsRef.get();
    const holdings = holdingsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        purchaseDate: new Date(data.purchaseDate),
        lastUpdated: new Date(data.lastUpdated),
      };
    });

    return NextResponse.json({
      success: true,
      transactions,
      holdings,
      totalTransactions: transactions.length,
      totalHoldings: holdings.length,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
