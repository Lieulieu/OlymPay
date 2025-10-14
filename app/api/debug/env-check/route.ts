import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || "development",
      USE_REAL_SOLANA_MINTING: process.env.USE_REAL_SOLANA_MINTING || "false",
      OUSDC_TOKEN: process.env.OUSDC_TOKEN ? "SET" : "NOT_SET",
      OUSDC_MANAGER_WALLET_KEYPAIR_BASE64: process.env
        .OUSDC_MANAGER_WALLET_KEYPAIR_BASE64
        ? "SET"
        : "NOT_SET",
    };

    // Determine minting mode
    const isProduction = process.env.NODE_ENV === "production";
    const useRealMinting = process.env.USE_REAL_SOLANA_MINTING === "true";
    const hasManagerKeypair = !!(
      process.env.OUSDC_TOKEN || process.env.OUSDC_MANAGER_WALLET_KEYPAIR_BASE64
    );

    const mintingMode = !isProduction || !useRealMinting ? "MOCK" : "REAL";
    const canMint = mintingMode === "REAL" && hasManagerKeypair;

    return NextResponse.json({
      success: true,
      environment: envCheck,
      mintingMode: mintingMode,
      canMint: canMint,
      issues: [
        ...(mintingMode === "MOCK"
          ? ["Using MOCK minting mode - no real tokens will be minted"]
          : []),
        ...(!hasManagerKeypair ? ["No manager wallet keypair found"] : []),
        ...(mintingMode === "REAL" && !hasManagerKeypair
          ? ["Cannot mint without manager wallet keypair"]
          : []),
      ],
      recommendations: [
        ...(mintingMode === "MOCK"
          ? [
              "To use real minting:",
              "  - Set NODE_ENV=production",
              "  - Set USE_REAL_SOLANA_MINTING=true",
              "  - Set OUSDC_TOKEN or OUSDC_MANAGER_WALLET_KEYPAIR_BASE64",
            ]
          : []),
        ...(!hasManagerKeypair
          ? [
              "Add manager wallet keypair to environment variables:",
              "  - OUSDC_TOKEN=your_hex_keypair",
              "  - OR OUSDC_MANAGER_WALLET_KEYPAIR_BASE64=[1,2,3,...]",
            ]
          : []),
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check environment",
      },
      { status: 500 }
    );
  }
}
