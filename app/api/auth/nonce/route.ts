import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  let walletAddress: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    walletAddress = body?.walletAddress;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Missing walletAddress" },
      { status: 400 }
    );
  }

  const nonce = randomBytes(16).toString("hex");

  return NextResponse.json({ nonce });
}
