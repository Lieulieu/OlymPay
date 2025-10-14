import { NextRequest, NextResponse } from "next/server";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, signature, nonce } = await req.json();
    const firebaseAuth = auth();
    const firebaseDb = db();

    if (!walletAddress || !signature || !nonce) {
      return NextResponse.json(
        { ok: false, error: "Missing walletAddress, signature, or nonce" },
        { status: 400 }
      );
    }

    const message = new TextEncoder().encode(nonce);
    const pubkeyBytes = bs58.decode(walletAddress);
    const sigBytes = bs58.decode(signature);
    const verified = nacl.sign.detached.verify(message, sigBytes, pubkeyBytes);
    if (!verified)
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );

    const uid = walletAddress;
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const snap = await userRef.get();
    const existing = snap.exists ? snap.data() ?? {} : {};

    const updates: any = {
      uid,
      externalWallet: walletAddress,
      updatedAt: new Date(),
    };
    if (!snap.exists) updates.createdAt = new Date();

    await userRef.set(updates, { merge: true });

    const token = await firebaseAuth.createCustomToken(uid);

    return NextResponse.json({
      ok: true,
      token,
      user: {
        uid,
        externalWallet: walletAddress,
        authMethod: 'wallet', // Solana wallet authentication
        internalWallet: { address: null },
        profile: existing.profile ?? {},
        points: typeof existing.points === "number" ? existing.points : 0,
      },
    });
  } catch (err) {
    console.error("[/api/auth/complete] error:", err);
    
    // Cung cấp thông tin debug chi tiết hơn
    const errorInfo = {
      message: err instanceof Error ? err.message : "Unknown error",
      code: (err as any)?.code || "unknown",
      stack: err instanceof Error ? err.stack : undefined,
    };
    
    return NextResponse.json(
      { 
        ok: false, 
        error: "Internal server error",
        debug: errorInfo
      },
      { status: 500 }
    );
  }
}
