import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { detectEnvironment } from "@/lib/server/environment-detector";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, signature, nonce, walletType, chain } = await req.json();
    const firebaseAuth = auth();
    const firebaseDb = db();

    if (!walletAddress || !signature || !nonce) {
      return NextResponse.json(
        { ok: false, error: "Missing walletAddress, signature, or nonce" },
        { status: 400 }
      );
    }

    // Verify MetaMask signature
    try {
      const message = `Sign this message to authenticate with OlymPay: ${nonce}`;
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json(
          { ok: false, error: "Invalid signature" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Signature verification failed:", error);
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const environment = detectEnvironment(req);
    const uid = walletAddress;
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const snap = await userRef.get();
    const existing = snap.exists ? snap.data() ?? {} : {};

    const updates: any = {
      uid,
      externalWallet: walletAddress,
      walletType: walletType || 'metamask',
      chain: chain || 'ethereum',
      environment,
      updatedAt: new Date(),
    };
    
    if (!snap.exists) {
      updates.createdAt = new Date();
    }

    await userRef.set(updates, { merge: true });

    const token = await firebaseAuth.createCustomToken(uid);

    return NextResponse.json({
      ok: true,
      token,
      user: {
        uid,
        externalWallet: walletAddress,
        authMethod: 'metamask', // MetaMask wallet authentication
        walletType: walletType || 'metamask',
        chain: chain || 'ethereum',
        internalWallet: { address: null },
        profile: existing.profile ?? {},
        points: typeof existing.points === "number" ? existing.points : 0,
      },
    });
  } catch (err) {
    console.error("[/api/auth/complete-metamask] error:", err);
    
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
