import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";

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

    // Get user's internal wallet balance
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const internalWallet = userData?.internalWallet || {};

    return NextResponse.json({
      success: true,
      oUSDC: internalWallet.oUSDC || 0,
      oVND: internalWallet.oVND || 0,
      NVDAX: internalWallet.NVDAX || 0,
      hasWallet: !!internalWallet.encMnemonic,
      walletAddress: internalWallet.address,
    });
  } catch (error) {
    console.error("[/api/wallet/balance] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
