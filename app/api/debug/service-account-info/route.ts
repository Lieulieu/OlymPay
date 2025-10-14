import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Kiểm tra Service Account từ environment variables
    let serviceAccountInfo = null;
    
    try {
      const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
      if (b64) {
        const json = Buffer.from(b64, "base64").toString("utf8");
        const sa = JSON.parse(json);
        
        serviceAccountInfo = {
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKeyId: sa.private_key_id,
          authUri: sa.auth_uri,
          tokenUri: sa.token_uri,
          authProviderX509CertUrl: sa.auth_provider_x509_cert_url,
          clientX509CertUrl: sa.client_x509_cert_url,
          type: sa.type,
          hasPrivateKey: !!sa.private_key,
        };
      } else {
        serviceAccountInfo = {
          error: "FIREBASE_SERVICE_ACCOUNT_B64 not set"
        };
      }
    } catch (error) {
      serviceAccountInfo = {
        error: error instanceof Error ? error.message : "Failed to parse service account"
      };
    }
    
    // So sánh với client config
    const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const serverProjectId = serviceAccountInfo?.projectId;
    
    const comparison = {
      clientProjectId,
      serverProjectId,
      match: clientProjectId === serverProjectId,
      status: clientProjectId === serverProjectId ? "✅ Match" : "❌ Mismatch"
    };
    
    return NextResponse.json({
      ok: true,
      serviceAccountInfo,
      comparison,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("[/api/debug/service-account-info] error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Failed to check service account info",
        code: (error as any)?.code || "unknown"
      },
      { status: 500 }
    );
  }
}
