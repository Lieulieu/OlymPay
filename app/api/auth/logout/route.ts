import { clearSessionCookie } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  clearSessionCookie(res);
  return res;
}
