import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/firebase-admin";
import { UnifiedUserManager } from "@/lib/server/unified-user-manager";
import { detectEnvironment } from "@/lib/server/environment-detector";

export async function GET(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const userManager = new UnifiedUserManager();

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
    const environment = detectEnvironment(req);
    
    // Lấy thông tin user với environment detection
    const userData = await userManager.getUserData(uid, environment);
    
    if (!userData) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    // Lấy địa chỉ từ wallet hiện tại
    let internalWalletAddress: string | null = null;
    let evmAddress: string | null = null;

    // Lấy dữ liệu từ internalWallet_${environment}
    const envKey = `internalWallet_${environment}`;
    const walletData = (userData as any)[envKey];
    
    if (walletData) {
      // Với cấu trúc mới: SolanaWallet và EVMWallet
      internalWalletAddress = walletData.SolanaWallet || walletData.address || null;
      evmAddress = walletData.EVMWallet || null;
    }

    return NextResponse.json({
      ok: true,
      data: {
        uid: (userData as any).uid || uid,
        externalWallet: (userData as any).externalWallet ?? null,
        authMethod: (userData as any).authMethod || 'wallet', // Default to wallet for backward compatibility
        internalWallet: { 
          address: internalWalletAddress,
          evmAddress: evmAddress
        },
        profile: (userData as any).profile ?? {},
        points: typeof (userData as any).points === "number" ? (userData as any).points : 0,
        environment: (userData as any).currentEnvironment,
        // Thêm email và displayName từ Firebase
        email: (userData as any).email || null,
        displayName: (userData as any).displayName || null,
        photoURL: (userData as any).photoURL || null,
        emailVerified: (userData as any).emailVerified || false,
      },
    });
  } catch (e) {
    console.error("[/api/users/me] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
