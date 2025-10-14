import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/firebase-admin";
import { UnifiedUserManager } from "@/lib/server/unified-user-manager";
import { detectEnvironment, isValidEnvironment } from "@/lib/server/environment-detector";

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

    const { fromEnv, toEnv } = await req.json();
    
    // Validate environments
    if (!isValidEnvironment(fromEnv) || !isValidEnvironment(toEnv)) {
      return NextResponse.json(
        { error: "Invalid environment. Must be 'development', 'staging', or 'production'" },
        { status: 400 }
      );
    }
    
    if (fromEnv === toEnv) {
      return NextResponse.json(
        { error: "Source and target environments cannot be the same" },
        { status: 400 }
      );
    }

    const uid = decoded.uid;
    
    // Migrate wallet
    const result = await userManager.migrateWallet(uid, fromEnv, toEnv);
    
    return NextResponse.json({
      ok: true,
      ...result,
    });

  } catch (error) {
    console.error("[/api/wallet/migrate] error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Migration failed" 
      },
      { status: 500 }
    );
  }
}
