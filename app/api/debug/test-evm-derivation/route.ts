import { NextRequest, NextResponse } from "next/server";
import { deriveEthereumFromMnemonic } from "@/lib/server/wallet";

export async function GET(req: NextRequest) {
  try {
    // Test với mnemonic mẫu
    const testMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    
    console.log("Testing EVM derivation with test mnemonic...");
    console.log("Test mnemonic:", testMnemonic);
    
    let result = null;
    let error = null;
    
    try {
      console.log("Calling deriveEthereumFromMnemonic...");
      result = await deriveEthereumFromMnemonic(testMnemonic);
      console.log("EVM derivation successful:", result);
    } catch (e) {
      console.error("EVM derivation failed:", e);
      error = {
        message: e instanceof Error ? e.message : "Unknown error",
        stack: e instanceof Error ? e.stack : undefined,
        name: e instanceof Error ? e.name : "UnknownError",
      };
    }
    
    return NextResponse.json({
      ok: true,
      testMnemonic,
      result,
      error,
      timestamp: new Date().toISOString(),
    });

  } catch (e) {
    console.error("[/api/debug/test-evm-derivation] error:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
