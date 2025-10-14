import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";

export async function POST(req: NextRequest) {
  try {
    const firebaseDb = db();

    // Create demo user with internal wallet
    const demoUserId = "demo-user";
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(demoUserId);

    const now = new Date();
    await userRef.set(
      {
        uid: demoUserId,
        createdAt: now,
        updatedAt: now,
        internalWallet: {
          encMnemonic: {
            ciphertext: "demo-ciphertext",
            iv: "demo-iv",
            tag: "demo-tag",
            version: 1,
          },
          addressDigest: "demo-address-digest",
          createdAt: now,
          version: 1,
          oUSDC: 1000, // Demo: 1000 oUSDC
          oVND: 25000000, // Demo: 25M oVND
        },
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Demo user created successfully",
      userId: demoUserId,
      oUSDCBalance: 1000,
      oVNDBalance: 25000000,
    });
  } catch (e) {
    console.error("[/api/demo/create-user] error:", e);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
