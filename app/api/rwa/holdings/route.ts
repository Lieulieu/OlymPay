import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { RWAHolding } from "@/types/rwa";

const HOLDINGS_COLLECTION = "rwa_holdings";

// API to get user's RWA holdings
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

    // Get user's holdings
    const holdingsRef = firebaseDb
      .collection(HOLDINGS_COLLECTION)
      .where("userId", "==", uid)
      .where("status", "==", "ACTIVE")
      .orderBy("lastUpdated", "desc");

    const holdingsSnapshot = await holdingsRef.get();
    const holdings = holdingsSnapshot.docs.map((doc) => {
      const data = doc.data() as RWAHolding;
      return {
        ...data,
        purchaseDate: new Date(data.purchaseDate),
        lastUpdated: new Date(data.lastUpdated),
      };
    });

    // Calculate total portfolio value
    const totalValue = holdings.reduce(
      (sum, holding) => sum + holding.totalValue,
      0
    );

    return NextResponse.json({
      success: true,
      holdings,
      totalHoldings: holdings.length,
      totalValue,
    });
  } catch (error) {
    console.error("Error fetching RWA holdings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
