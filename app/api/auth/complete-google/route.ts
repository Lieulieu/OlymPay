import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { detectEnvironment } from "@/lib/server/environment-detector";
import { generateMnemonic } from "bip39";
import { deriveSolanaFromMnemonic, deriveEthereumFromMnemonic } from "@/lib/server/wallet";
import { encryptMnemonic, encryptPrivateKey } from "@/lib/server/crypto";

export async function POST(req: NextRequest) {
  try {
    const { googleUser } = await req.json();
    const firebaseAuth = auth();
    const firebaseDb = db();

    if (!googleUser || !googleUser.uid || !googleUser.email) {
      return NextResponse.json(
        { ok: false, error: "Missing Google user data" },
        { status: 400 }
      );
    }

    const { uid, email, displayName, photoURL, emailVerified } = googleUser;
    const environment = detectEnvironment(req);
    
    // Use Google UID as the main identifier
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const snap = await userRef.get();
    const existing = snap.exists ? snap.data() ?? {} : {};

    const updates: any = {
      uid,
      email,
      displayName: displayName || '',
      photoURL: photoURL || '',
      emailVerified: emailVerified || false,
      authMethod: 'google',
      environment,
      updatedAt: new Date(),
    };
    
    if (!snap.exists) {
      updates.createdAt = new Date();
      
      // Tự động tạo mnemonic và private keys cho Google OAuth users
      try {
        const mnemonic = generateMnemonic();
        const { publicKey: solanaPublicKey, privateKey: solanaSecretKey } = await deriveSolanaFromMnemonic(mnemonic);
        const { address: evmAddress, privateKey: evmPrivateKey } = await deriveEthereumFromMnemonic(mnemonic);
        
        // Mã hóa mnemonic và private keys
        const encMnemonic = encryptMnemonic(mnemonic);
        const encSolanaPrivateKey = encryptPrivateKey(solanaSecretKey);
        const encEVMPrivateKey = encryptPrivateKey(evmPrivateKey);
        
        // Lưu vào Firebase với cấu trúc mới
        const walletData = {
          [`internalWallet_${environment}`]: {
            addressDigest: '', // Sẽ được cập nhật sau
            createdAt: new Date(),
            encMnemonic,
            encEVMPrivateKey,
            encSolanaPrivatekey: encSolanaPrivateKey,
            EVMWallet: '',
            SolanaWallet: '',
            environment,
            oUSDC: 0,
            oVND: 0,
            solAirdrop: {
              balance: 0,
              success: false,
              version: 2
            },
            updatedAt: new Date()
          }
        };
        
        Object.assign(updates, walletData);
        
        console.log(`[Google OAuth] Auto-created wallet for user ${uid} in ${environment}`);
      } catch (walletError) {
        console.error(`[Google OAuth] Failed to create wallet for user ${uid}:`, walletError);
        // Không throw error, chỉ log để không làm gián đoạn login
      }
    }

    await userRef.set(updates, { merge: true });

    const token = await firebaseAuth.createCustomToken(uid);

    return NextResponse.json({
      ok: true,
      token,
      user: {
        uid,
        email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        emailVerified: emailVerified || false,
        authMethod: 'google',
        externalWallet: '', // Google users don't have external wallet
        internalWallet: { address: null },
        profile: existing.profile ?? {},
        points: typeof existing.points === "number" ? existing.points : 0,
      },
    });
  } catch (err) {
    console.error("[/api/auth/complete-google] error:", err);
    
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