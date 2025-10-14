import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { addressFromEncMnemonic } from "@/lib/server/wallet";

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

    // Add timeout for Firebase operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Firebase operation timeout")), 8000);
    });

    const firebaseOperation = async () => {
      const decoded = await firebaseAuth.verifyIdToken(idToken);
      const uid = decoded.uid;

      const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
      const snap = await userRef.get();

      if (!snap.exists) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const user = snap.data() ?? {};

      if (!user.internalWallet) {
        return NextResponse.json({
          success: true,
          oUSDCBalance: 0,
          oVNDBalance: 0,
          solBalance: 0,
          hasWallet: false,
        });
      }

      const oUSDCBalance = user.internalWallet.oUSDC || 0;
      const oVNDBalance = user.internalWallet.oVND || 0;

      // Get SOL balance from blockchain
      let solBalance = 0;
      try {
        const walletAddress = await addressFromEncMnemonic(
          user.internalWallet.encMnemonic
        );
        const connection = new Connection(
          "https://api.devnet.solana.com",
          "confirmed"
        );
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        solBalance = balance / LAMPORTS_PER_SOL;
      } catch (solError) {
        console.warn("Failed to get SOL balance:", solError);
        // Don't fail the request if SOL balance check fails
      }

      return NextResponse.json({
        success: true,
        oUSDCBalance,
        oVNDBalance,
        solBalance,
        hasWallet: true,
        walletAddress: user.internalWallet.addressDigest
          ? "***" + user.internalWallet.addressDigest.slice(-8)
          : null,
        solAirdrop: user.internalWallet.solAirdrop,
      });
    };

    // Race between Firebase operation and timeout
    const result = await Promise.race([firebaseOperation(), timeoutPromise]);
    return result as NextResponse;
  } catch (e) {
    console.error("[/api/wallet/internal-balance] error:", e);

    // More specific error handling
    if (e instanceof Error) {
      if (e.message.includes("timeout")) {
        return NextResponse.json(
          { success: false, error: "Request timeout. Please try again." },
          { status: 408 }
        );
      } else if (e.message.includes("auth")) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication failed. Please refresh the page.",
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
