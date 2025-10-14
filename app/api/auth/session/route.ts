import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/firebase-admin";
import { createSessionCookie, writeSessionCookie } from "@/utils/auth";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }
    const firebaseAuth = auth();

    await firebaseAuth.verifyIdToken(idToken);

    const sessionCookie = await createSessionCookie(idToken);
    const res = NextResponse.json({ ok: true }, { status: 200 });
    writeSessionCookie(res, sessionCookie, req);
    return res;
  } catch (e) {
    console.error("[/api/auth/session] error:", e);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
