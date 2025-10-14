import { NextRequest, NextResponse } from "next/server";
import { detectEnvironment } from "@/lib/server/environment-detector";

export async function GET(req: NextRequest) {
  try {
    const environment = detectEnvironment(req);
    const origin = req.headers.get('origin') || '';
    const host = req.headers.get('host') || '';
    const referer = req.headers.get('referer') || '';
    
    return NextResponse.json({
      ok: true,
      environment,
      headers: {
        origin,
        host,
        referer,
        userAgent: req.headers.get('user-agent'),
      },
      nodeEnv: process.env.NODE_ENV,
      cookieDomain: process.env.COOKIE_DOMAIN,
      sessionMaxDays: process.env.SESSION_COOKIE_MAX_DAYS,
    });

  } catch (error) {
    console.error("[/api/debug/environment] error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Failed to get environment info" 
      },
      { status: 500 }
    );
  }
}
