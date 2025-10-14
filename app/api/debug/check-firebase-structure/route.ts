import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { detectEnvironment } from "@/lib/server/environment-detector";

export async function GET(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

    // Xác thực user
    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const decoded = await firebaseAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const uid = decoded.uid;
    const environment = detectEnvironment(req);
    const envKey = `internalWallet_${environment}`;
    
    // Lấy thông tin user từ Firebase
    const userRef = firebaseDb.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }
    
    const userData = userDoc.data()!;
    const walletData = userData[envKey];
    
    // Debug thông tin chi tiết
    const debugInfo = {
      uid,
      environment,
      envKey,
      userData: {
        hasInternalWallet: !!userData.internalWallet,
        internalWallet: userData.internalWallet,
        hasWalletData: !!walletData,
        walletData: walletData ? {
          hasSolanaWallet: !!walletData.SolanaWallet,
          hasEVMWallet: !!walletData.EVMWallet,
          solanaWallet: walletData.SolanaWallet,
          evmWallet: walletData.EVMWallet,
          evmWalletType: typeof walletData.EVMWallet,
          evmWalletValue: walletData.EVMWallet,
          allKeys: Object.keys(walletData),
        } : null,
      },
      // Kiểm tra cấu trúc wallet
      walletStructure: {
        hasWallet: 'wallet' in userData,
        wallet: userData.wallet,
        walletKeys: userData.wallet ? Object.keys(userData.wallet) : [],
      }
    };

    return NextResponse.json({
      ok: true,
      debug: debugInfo,
    });

  } catch (e) {
    console.error("[/api/debug/check-firebase-structure] error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
