import { NextRequest, NextResponse } from "next/server";
import { deriveSolanaFromMnemonic } from "@/lib/mnemonic-utils";

export async function POST(request: NextRequest) {
  try {
    const { mnemonic } = await request.json();

    if (!mnemonic || typeof mnemonic !== "string") {
      return NextResponse.json(
        { error: "Mnemonic phrase is required" },
        { status: 400 }
      );
    }

    // Generate keypair from mnemonic
    const result = await deriveSolanaFromMnemonic(mnemonic.trim());

    // Return only the necessary data (exclude the actual keypair object)
    return NextResponse.json({
      address: result.address,
      publicKey: result.publicKey,
      privateKey: result.privateKey,
      secretKeyHex: result.secretKeyHex,
      secretKeyBase64: result.secretKeyBase64,
    });
  } catch (error) {
    console.error("Error generating keypair from mnemonic:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate keypair from mnemonic",
      },
      { status: 500 }
    );
  }
}
