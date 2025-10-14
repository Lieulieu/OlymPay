import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";

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

    console.log("Creating sample holdings data for user:", uid);

    const sampleHoldings = [
      {
        id: `${uid}_tbill-001`,
        userId: uid,
        assetId: "tbill-001",
        assetName: "3-Month Treasury Bills",
        issuer: "US Treasury",
        quantity: 100,
        averagePrice: 1.0,
        totalValue: 100,
        currency: "oUSDC",
        purchaseDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        lastUpdated: new Date().toISOString(),
        status: "ACTIVE",
      },
      {
        id: `${uid}_reit-001`,
        userId: uid,
        assetId: "reit-001",
        assetName: "Real Estate Investment Trust",
        issuer: "Property Corp",
        quantity: 50,
        averagePrice: 2.5,
        totalValue: 125,
        currency: "oUSDC",
        purchaseDate: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000
        ).toISOString(), // 15 days ago
        lastUpdated: new Date().toISOString(),
        status: "ACTIVE",
      },
      {
        id: `${uid}_gold-001`,
        userId: uid,
        assetId: "gold-001",
        assetName: "Gold Bullion",
        issuer: "Gold Reserve",
        quantity: 25,
        averagePrice: 4.0,
        totalValue: 100,
        currency: "oUSDC",
        purchaseDate: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days ago
        lastUpdated: new Date().toISOString(),
        status: "ACTIVE",
      },
    ];

    // Save all holdings
    await firebaseDb.runTransaction(async (transaction) => {
      for (const holding of sampleHoldings) {
        const holdingRef = firebaseDb
          .collection(HOLDINGS_COLLECTION)
          .doc(holding.id);
        transaction.set(holdingRef, holding);
      }
    });

    const totalValue = sampleHoldings.reduce(
      (sum, holding) => sum + holding.totalValue,
      0
    );

    return NextResponse.json({
      success: true,
      message: "Sample holdings created successfully",
      data: {
        holdings: sampleHoldings,
        totalHoldings: sampleHoldings.length,
        totalValue,
      },
    });
  } catch (error) {
    console.error("Error creating sample holdings:", error);
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

// API to check if holdings collection exists and get debug info
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

    console.log("Checking holdings collection for user:", uid);

    const debugInfo = {
      userId: uid,
      collectionExists: false,
      holdingsCount: 0,
      holdings: [] as any[],
      errors: [] as string[],
    };

    try {
      // Check if holdings collection exists and has data
      const holdingsRef = firebaseDb
        .collection(HOLDINGS_COLLECTION)
        .where("userId", "==", uid);

      const holdingsSnapshot = await holdingsRef.get();

      debugInfo.collectionExists = true;
      debugInfo.holdingsCount = holdingsSnapshot.size;

      if (holdingsSnapshot.size > 0) {
        debugInfo.holdings = holdingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      console.log(`Found ${holdingsSnapshot.size} holdings for user ${uid}`);
    } catch (error) {
      debugInfo.errors.push(`Holdings error: ${error}`);
      console.error("Error checking holdings:", error);
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      message: "Holdings debug info collected successfully",
    });
  } catch (error) {
    console.error("Debug holdings API error:", error);
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
