import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { decryptMnemonic } from "@/lib/server/crypto";
import { detectEnvironment } from "@/lib/server/environment-detector";
import crypto from "crypto";

const DEFAULT_PASSWORD = "123456"; // Mock password

export async function POST(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!idToken || idToken === "placeholder-token") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const environment = detectEnvironment(req);
    const envKey = `internalWallet_${environment}`;

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // For mock purposes, accept default password
    if (password !== DEFAULT_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const snap = await userRef.get();
    const user = snap.exists ? snap.data() ?? {} : {};

    // Với cấu trúc mới: tìm trong internalWallet_development
    const walletData = user[envKey];
    if (!walletData?.encMnemonic) {
      return NextResponse.json(
        { success: false, error: "No internal wallet found" },
        { status: 404 }
      );
    }

    try {
      const mnemonic = decryptMnemonic(walletData.encMnemonic);

      return NextResponse.json({
        success: true,
        mnemonic,
        message: "Mnemonic decrypted successfully",
      });
    } catch (decryptError) {
      console.error("Decryption error:", decryptError);
      return NextResponse.json(
        { success: false, error: "Failed to decrypt mnemonic" },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("[/api/wallet/reveal-mnemonic] error:", e);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
