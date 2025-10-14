import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";

// Mock exchange rate - in production, this would come from a real exchange rate API
const EXCHANGE_RATE = 25000; // 1 USD = 25,000 VND (approximate)

export async function POST(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    const decoded = await firebaseAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );

    const uid = decoded.uid;
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const snap = await userRef.get();
    const user = snap.exists ? snap.data() ?? {} : {};

    if (!user.internalWallet) {
      return NextResponse.json(
        { ok: false, error: "Internal wallet not found" },
        { status: 404 }
      );
    }

    const currentOVND = user.internalWallet.oVND || 0;
    const currentOUSDC = user.internalWallet.oUSDC || 0;

    // Calculate how much oUSDC we can get from the oVND amount
    const oUSDCAmount = amount / EXCHANGE_RATE;

    if (currentOVND < amount) {
      return NextResponse.json(
        { ok: false, error: "Insufficient oVND balance" },
        { status: 400 }
      );
    }

    // Update balances atomically
    await firebaseDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();

      if (!userData?.internalWallet) {
        throw new Error("Internal wallet not found");
      }

      const newOVND = Math.max(0, userData.internalWallet.oVND - amount);
      const newOUSDC = userData.internalWallet.oUSDC + oUSDCAmount;

      transaction.update(userRef, {
        "internalWallet.oVND": newOVND,
        "internalWallet.oUSDC": newOUSDC,
        updatedAt: new Date(),
      });
    });

    return NextResponse.json({
      ok: true,
      exchangeRate: EXCHANGE_RATE,
      oVNDAmount: amount,
      oUSDCAmount: oUSDCAmount,
      newOVNDBalance: currentOVND - amount,
      newOUSDCBalance: currentOUSDC + oUSDCAmount,
    });
  } catch (e) {
    console.error("[/api/exchange/ovnd-to-ousdc] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to get current exchange rate
export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      exchangeRate: EXCHANGE_RATE,
      fromCurrency: "oVND",
      toCurrency: "oUSDC",
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[/api/exchange/ovnd-to-ousdc] GET error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
