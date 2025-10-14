import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";

const TRANSACTIONS_COLLECTION = "rwa_transactions";
const HOLDINGS_COLLECTION = "rwa_holdings";
const DEPOSITS_COLLECTION = "deposit_transactions";

// API to create sample data for testing
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

    console.log("Creating sample data for user:", uid);

    // Create sample deposit transaction
    const depositId = `DEP_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const depositTransaction = {
      id: depositId,
      userId: uid,
      amount: 1000,
      currency: "oUSDC",
      source: "EXTERNAL_WALLET",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      fees: 0,
      notes: "Sample deposit for testing",
    };

    // Create sample RWA transaction
    const transactionId = `RWA_TX_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const rwaTransaction = {
      id: transactionId,
      userId: uid,
      assetId: "tbill-001",
      assetName: "3-Month Treasury Bills",
      transactionType: "PURCHASE",
      amount: 100,
      price: 1,
      currency: "oUSDC",
      paymentMethod: "OUSDC",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      fees: 0,
      notes: "Sample RWA purchase for testing",
    };

    // Create sample RWA holding
    const holdingId = `${uid}_tbill-001`;
    const rwaHolding = {
      id: holdingId,
      userId: uid,
      assetId: "tbill-001",
      assetName: "3-Month Treasury Bills",
      issuer: "US Treasury",
      quantity: 100,
      averagePrice: 1,
      totalValue: 100,
      currency: "oUSDC",
      purchaseDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: "ACTIVE",
    };

    // Save all sample data
    await firebaseDb.runTransaction(async (transaction) => {
      // Save deposit transaction
      const depositRef = firebaseDb
        .collection(DEPOSITS_COLLECTION)
        .doc(depositId);
      transaction.set(depositRef, depositTransaction);

      // Save RWA transaction
      const txRef = firebaseDb
        .collection(TRANSACTIONS_COLLECTION)
        .doc(transactionId);
      transaction.set(txRef, rwaTransaction);

      // Save RWA holding
      const holdingRef = firebaseDb
        .collection(HOLDINGS_COLLECTION)
        .doc(holdingId);
      transaction.set(holdingRef, rwaHolding);
    });

    return NextResponse.json({
      success: true,
      message: "Sample data created successfully",
      data: {
        deposit: depositTransaction,
        transaction: rwaTransaction,
        holding: rwaHolding,
      },
    });
  } catch (error) {
    console.error("Error creating sample data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
