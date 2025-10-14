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
      return NextResponse.json({ 
        ok: false, 
        error: "User not found",
        debug: { uid, environment, envKey }
      }, { status: 404 });
    }
    
    const userData = userDoc.data()!;
    const walletData = userData[envKey];
    
    // Phân tích dữ liệu
    const analysis = {
      uid,
      environment,
      envKey,
      hasUserData: !!userData,
      hasWalletData: !!walletData,
      userData: {
        authMethod: userData.authMethod,
        hasInternalWallet: !!userData[envKey],
      },
      walletData: walletData ? {
        hasEncMnemonic: !!walletData.encMnemonic,
        hasSolanaWallet: !!walletData.SolanaWallet,
        hasEVMWallet: !!walletData.EVMWallet,
        solanaWallet: walletData.SolanaWallet || "",
        evmWallet: walletData.EVMWallet || "",
        createdAt: walletData.createdAt,
        updatedAt: walletData.updatedAt,
      } : null,
      // Test EVM derivation if mnemonic exists
      evmDerivationTest: walletData?.encMnemonic ? await testEVMDerivation(walletData.encMnemonic) : null,
    };
    
    return NextResponse.json({
      ok: true,
      debug: analysis
    });
    
  } catch (error) {
    console.error("EVM Wallet Flow Debug Error:", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      debug: { error: true }
    }, { status: 500 });
  }
}

async function testEVMDerivation(encMnemonic: any) {
  try {
    const { decryptMnemonic } = await import("@/lib/server/crypto");
    const { deriveEthereumFromMnemonic } = await import("@/lib/server/wallet");
    
    const mnemonic = decryptMnemonic(encMnemonic);
    const { address } = await deriveEthereumFromMnemonic(mnemonic);
    
    return {
      success: true,
      derivedAddress: address,
      mnemonicLength: mnemonic.split(' ').length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
