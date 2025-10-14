import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/firebase-admin";
import { UnifiedUserManager } from "@/lib/server/unified-user-manager";
import { detectEnvironment } from "@/lib/server/environment-detector";

export async function POST(req: NextRequest) {
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
    const environment = detectEnvironment(req);
    
    // Tạo ví cho environment hiện tại
    const result = await userManager.createWalletForEnvironment(uid, environment);
    
    return NextResponse.json({
      ok: true,
      address: result.address,
      environment: result.environment,
      solAirdrop: result.solAirdrop,
      isExisting: result.isExisting,
      message: result.message,
    });

  } catch (e) {
    console.error("[/api/wallet/create] error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
