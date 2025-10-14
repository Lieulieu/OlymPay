import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { detectEnvironment } from "@/lib/server/environment-detector";
import { deriveEthereumFromMnemonic } from "@/lib/server/wallet";
import { decryptMnemonic } from "@/lib/server/crypto";

export async function POST(req: NextRequest) {
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
    
    if (!walletData || !walletData.encMnemonic) {
      return NextResponse.json({ ok: false, error: "No mnemonic found for user" }, { status: 404 });
    }
    
    // Giải mã mnemonic và tạo địa chỉ EVM
    const mnemonic = decryptMnemonic(walletData.encMnemonic);
    const { address: evmAddress } = await deriveEthereumFromMnemonic(mnemonic);
    
    console.log("Before update - EVMWallet:", walletData.EVMWallet);
    console.log("Derived EVM Address:", evmAddress);
    
    // Cập nhật địa chỉ EVM vào Firebase
    const updateData = {
      [`${envKey}.EVMWallet`]: evmAddress,
      [`${envKey}.updatedAt`]: new Date(),
      updatedAt: new Date(),
    };
    
    console.log("Update data:", updateData);
    
    await userRef.update(updateData);
    
    console.log("Firebase update completed");
    
    // Kiểm tra lại sau khi update
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data()!;
    const updatedWalletData = updatedData[envKey];
    
    console.log("After update - EVMWallet:", updatedWalletData?.EVMWallet);
    
    return NextResponse.json({
      ok: true,
      evmAddress,
      environment,
      envKey,
      beforeUpdate: {
        evmWallet: walletData.EVMWallet,
      },
      afterUpdate: {
        evmWallet: updatedWalletData?.EVMWallet,
      },
      updateData,
      message: "EVM wallet address updated successfully",
    });

  } catch (e) {
    console.error("[/api/debug/check-evm-update] error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
