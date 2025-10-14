import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { testUid } = await req.json();
    
    if (!testUid) {
      return NextResponse.json(
        { error: "testUid is required" },
        { status: 400 }
      );
    }
    
    const firebaseAuth = auth();
    
    // Tạo custom token
    let createResult = null;
    try {
      const customToken = await firebaseAuth.createCustomToken(testUid);
      createResult = {
        success: true,
        tokenLength: customToken.length,
        tokenPreview: customToken.substring(0, 50) + "...",
        message: "Custom token created successfully"
      };
    } catch (error) {
      createResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: (error as any)?.code || "unknown"
      };
    }
    
    // Test verify custom token (nếu có)
    let verifyResult = null;
    if (createResult?.success) {
      try {
        // Note: Không thể verify custom token trực tiếp với Firebase Admin
        // Custom token cần được exchange thành ID token trước
        verifyResult = {
          success: true,
          message: "Custom token created (verification requires client-side exchange)"
        };
      } catch (error) {
        verifyResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }
    
    return NextResponse.json({
      ok: true,
      testUid,
      createResult,
      verifyResult,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("[/api/debug/test-custom-token] error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Failed to test custom token",
        code: (error as any)?.code || "unknown"
      },
      { status: 500 }
    );
  }
}
