import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { RWAHolding } from "@/types/rwa";

const HOLDINGS_COLLECTION = "rwa_holdings";

// API to migrate existing holdings from internalWallet to rwa_holdings collection
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

    console.log("Migrating holdings for user:", uid);

    // Get user data
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const internalHoldings = userData?.internalWallet?.rwaHoldings || {};

    if (Object.keys(internalHoldings).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No holdings to migrate",
        migratedCount: 0,
      });
    }

    const migratedHoldings: RWAHolding[] = [];
    const errors: string[] = [];

    // Migrate each holding
    await firebaseDb.runTransaction(async (transaction) => {
      for (const [assetId, holdingData] of Object.entries(internalHoldings)) {
        try {
          const holdingId = `${uid}_${assetId}`;
          const holdingRef = firebaseDb
            .collection(HOLDINGS_COLLECTION)
            .doc(holdingId);

          // Check if holding already exists in rwa_holdings collection
          const existingHolding = await holdingRef.get();

          if (existingHolding.exists) {
            console.log(`Holding ${assetId} already exists, skipping...`);
            continue;
          }

          // Type assertion for holdingData
          const typedHoldingData = holdingData as any;

          // Create new holding
          const holding: RWAHolding = {
            id: holdingId,
            userId: uid,
            assetId,
            assetName: getAssetName(assetId),
            issuer: getIssuer(assetId),
            quantity: typedHoldingData.quantity || 0,
            averagePrice: typedHoldingData.averagePrice || 0,
            totalValue: typedHoldingData.totalCost || 0,
            currency: "oUSDC", // Default currency
            purchaseDate: typedHoldingData.lastPurchase
              ? new Date(typedHoldingData.lastPurchase)
              : new Date(),
            lastUpdated: new Date(),
            status: "ACTIVE",
          };

          // Save holding
          transaction.set(holdingRef, {
            ...holding,
            purchaseDate: holding.purchaseDate.toISOString(),
            lastUpdated: holding.lastUpdated.toISOString(),
          });

          migratedHoldings.push(holding);
        } catch (error) {
          const errorMsg = `Error migrating ${assetId}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedHoldings.length} holdings`,
      migratedCount: migratedHoldings.length,
      migratedHoldings,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error migrating holdings:", error);
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

// Helper function to get asset name from asset ID
function getAssetName(assetId: string): string {
  const assetNames: Record<string, string> = {
    "tbill-001": "3-Month Treasury Bills",
    "reit-001": "Real Estate Investment Trust",
    "gold-001": "Gold Bullion",
    "nvdax-001": "NVDAX Token",
  };
  return assetNames[assetId] || assetId;
}

// Helper function to get issuer from asset ID
function getIssuer(assetId: string): string {
  const issuers: Record<string, string> = {
    "tbill-001": "US Treasury",
    "reit-001": "Property Corp",
    "gold-001": "Gold Reserve",
    "nvdax-001": "NVDAX Token",
  };
  return issuers[assetId] || "Unknown Issuer";
}
