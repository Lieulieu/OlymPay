import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/firebase-admin";
import { UnifiedUserManager } from "@/lib/server/unified-user-manager";
import { detectEnvironment } from "@/lib/server/environment-detector";

export async function GET(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const userManager = new UnifiedUserManager();

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
    const currentEnvironment = detectEnvironment(req);
    
    // Lấy thông tin tất cả environments
    const userData = await userManager.getUserData(uid);
    const availableEnvironments = await userManager.getAvailableEnvironments(uid);
    
    return NextResponse.json({
      ok: true,
      currentEnvironment,
      availableEnvironments,
      environmentWallets: (userData as any)?.environmentWallets || [],
      hasWallet: (userData as any)?.hasWallet || false,
    });

  } catch (error) {
    console.error("[/api/wallet/environments] error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Failed to get environment info" 
      },
      { status: 500 }
    );
  }
}
