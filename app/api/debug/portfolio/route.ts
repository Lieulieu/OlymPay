import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";

const TRANSACTIONS_COLLECTION = "rwa_transactions";
const HOLDINGS_COLLECTION = "rwa_holdings";
const DEPOSITS_COLLECTION = "deposit_transactions";

// Debug API to check portfolio data
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

    console.log("Debug: Fetching portfolio data for user:", uid);

    // Check if collections exist and have data
    const debugInfo = {
      userId: uid,
      collections: {
        transactions: { exists: false, count: 0 },
        holdings: { exists: false, count: 0 },
        deposits: { exists: false, count: 0 },
      },
      errors: [] as string[],
    };

    try {
      // Check transactions collection
      const transactionsRef = firebaseDb.collection(TRANSACTIONS_COLLECTION);
      const transactionsSnapshot = await transactionsRef
        .where("userId", "==", uid)
        .get();
      debugInfo.collections.transactions.exists = true;
      debugInfo.collections.transactions.count = transactionsSnapshot.size;
      console.log("Transactions found:", transactionsSnapshot.size);
    } catch (error) {
      debugInfo.errors.push(`Transactions error: ${error}`);
      console.error("Error checking transactions:", error);
    }

    try {
      // Check holdings collection
      const holdingsRef = firebaseDb.collection(HOLDINGS_COLLECTION);
      const holdingsSnapshot = await holdingsRef
        .where("userId", "==", uid)
        .get();
      debugInfo.collections.holdings.exists = true;
      debugInfo.collections.holdings.count = holdingsSnapshot.size;
      console.log("Holdings found:", holdingsSnapshot.size);
    } catch (error) {
      debugInfo.errors.push(`Holdings error: ${error}`);
      console.error("Error checking holdings:", error);
    }

    try {
      // Check deposits collection
      const depositsRef = firebaseDb.collection(DEPOSITS_COLLECTION);
      const depositsSnapshot = await depositsRef
        .where("userId", "==", uid)
        .get();
      debugInfo.collections.deposits.exists = true;
      debugInfo.collections.deposits.count = depositsSnapshot.size;
      console.log("Deposits found:", depositsSnapshot.size);
    } catch (error) {
      debugInfo.errors.push(`Deposits error: ${error}`);
      console.error("Error checking deposits:", error);
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      message: "Debug info collected successfully",
    });
  } catch (error) {
    console.error("Debug API error:", error);
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
