import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    
    // Lấy thông tin project từ server
    let serverProjectInfo = null;
    try {
      // Tạo test custom token để lấy project info
      const testUid = "test-project-check-" + Date.now();
      const customToken = await firebaseAuth.createCustomToken(testUid);
      
      // Parse JWT để lấy project info (không verify, chỉ decode)
      const parts = customToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        // Lấy project ID từ service account email trong issuer
        let projectId = payload.aud;
        if (payload.iss && payload.iss.includes('@')) {
          // Extract project ID từ service account email
          // Format: firebase-adminsdk-xxx@project-id.iam.gserviceaccount.com
          const emailMatch = payload.iss.match(/@([^.]+)\.iam\.gserviceaccount\.com/);
          if (emailMatch) {
            projectId = emailMatch[1];
          }
        }
        
        serverProjectInfo = {
          projectId: projectId,
          issuer: payload.iss,
          subject: payload.sub,
          audience: payload.aud,
          fullPayload: payload, // Thêm để debug
        };
      }
    } catch (error) {
      serverProjectInfo = {
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
    
    // Client configuration từ environment variables
    const clientConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Not Set",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Set" : "❌ Not Set",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Not Set",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✅ Set" : "❌ Not Set",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "✅ Set" : "❌ Not Set",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✅ Set" : "❌ Not Set",
    };
    
    // Giá trị thực tế (ẩn một phần)
    const clientValues = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10) + "..." : "Not Set",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "Not Set",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Not Set",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "Not Set",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "Not Set",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "Not Set",
    };
    
    return NextResponse.json({
      ok: true,
      serverProjectInfo,
      clientConfig,
      clientValues,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("[/api/debug/firebase-client-config] error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Failed to check Firebase client config",
        code: (error as any)?.code || "unknown"
      },
      { status: 500 }
    );
  }
}
