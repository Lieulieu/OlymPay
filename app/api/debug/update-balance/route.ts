import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, oUSDCAmount, oVNDAmount, action = "set" } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "UID is required" },
        { status: 400 }
      );
    }

    const firebaseDb = db();
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Ensure internal wallet exists
    if (!userData?.internalWallet) {
      await userRef.update({
        internalWallet: {
          oUSDC: 0,
          oVND: 0,
          addressDigest: `demo-wallet-${uid.slice(-8)}`,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Get current balances
    const currentOUSDC = userData?.internalWallet?.oUSDC || 0;
    const currentOVND = userData?.internalWallet?.oVND || 0;

    let newOUSDC = currentOUSDC;
    let newOVND = currentOVND;

    // Calculate new balances based on action
    if (action === "set") {
      newOUSDC = oUSDCAmount || currentOUSDC;
      newOVND = oVNDAmount || currentOVND;
    } else if (action === "add") {
      newOUSDC = currentOUSDC + (oUSDCAmount || 0);
      newOVND = currentOVND + (oVNDAmount || 0);
    } else if (action === "subtract") {
      newOUSDC = Math.max(0, currentOUSDC - (oUSDCAmount || 0));
      newOVND = Math.max(0, currentOVND - (oVNDAmount || 0));
    }

    // Update the user's internal wallet
    await userRef.update({
      "internalWallet.oUSDC": newOUSDC,
      "internalWallet.oVND": newOVND,
      "internalWallet.lastUpdated": new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Balance updated successfully`,
      uid: uid,
      previousBalance: {
        oUSDC: currentOUSDC,
        oVND: currentOVND,
      },
      newBalance: {
        oUSDC: newOUSDC,
        oVND: newOVND,
      },
      action: action,
      changes: {
        oUSDCChange: newOUSDC - currentOUSDC,
        oVNDChange: newOVND - currentOVND,
      },
    });
  } catch (error) {
    console.error("Update balance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Method not allowed. Use POST to update balance.",
      supportedMethods: ["POST"],
      requiredFields: ["uid"],
      optionalFields: ["oUSDCAmount", "oVNDAmount", "action"],
      actions: ["set", "add", "subtract"],
      example: {
        uid: "user-wallet-address-here",
        oUSDCAmount: 1000,
        oVNDAmount: 50000,
        action: "set",
      },
    },
    { status: 405 }
  );
}
