import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();
    
    // Kiểm tra Firebase configuration
    const config = {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      hasServiceAccountRaw: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      hasCredentialsPath: !!process.env.FIREBASE_CREDENTIALS_PATH,
      nodeEnv: process.env.NODE_ENV,
    };
    
    // Test Firebase Auth
    let authTest = null;
    try {
      // Tạo test custom token
      const testUid = "test-user-" + Date.now();
      const customToken = await firebaseAuth.createCustomToken(testUid);
      authTest = {
        success: true,
        customTokenLength: customToken.length,
        message: "Custom token created successfully"
      };
    } catch (error) {
      authTest = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: (error as any)?.code || "unknown"
      };
    }
    
    // Test Firestore
    let firestoreTest = null;
    try {
      const testRef = firebaseDb.collection("test").doc("config-check");
      await testRef.set({ timestamp: new Date(), test: true });
      const doc = await testRef.get();
      firestoreTest = {
        success: true,
        hasData: doc.exists,
        message: "Firestore connection successful"
      };
    } catch (error) {
      firestoreTest = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: (error as any)?.code || "unknown"
      };
    }
    
    return NextResponse.json({
      ok: true,
      config,
      authTest,
      firestoreTest,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("[/api/debug/firebase-config] error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Failed to check Firebase config",
        code: (error as any)?.code || "unknown"
      },
      { status: 500 }
    );
  }
}
