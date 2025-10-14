import { NextRequest, NextResponse } from "next/server";
import { mintFromManagerWallet } from "@/lib/solana-mint";

export async function POST(request: NextRequest) {
  try {
    const { toAddress, amount, tokenType = "oVND" } = await request.json();

    if (!toAddress || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid destination address or amount" },
        { status: 400 }
      );
    }

    // Validate token type
    if (!["oVND", "oUSDC"].includes(tokenType)) {
      return NextResponse.json(
        { error: "Invalid token type. Only oVND and oUSDC are supported" },
        { status: 400 }
      );
    }

    const managerKeypairHex = process.env.OUSDC_TOKEN;
    const treasuryKeypairPrivateKey =
      process.env.OUSDC_MANAGER_WALLET_KEYPAIR_BASE64;

    if (!managerKeypairHex && !treasuryKeypairPrivateKey) {
      return NextResponse.json(
        { error: "Manager wallet keypair not found in environment variables" },
        { status: 500 }
      );
    }

    const result = await mintFromManagerWallet(toAddress, amount, tokenType);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${tokenType} tokens minted successfully from manager wallet`,
        txHash: result.txHash,
        amount: amount,
        tokenType: tokenType,
        fromAddress: result.fromAddress,
        toAddress: toAddress,
        explorerUrl: result.explorerUrl,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Minting from manager wallet failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error minting from manager wallet:", error);
    return NextResponse.json(
      { error: "Failed to mint from manager wallet" },
      { status: 500 }
    );
  }
}
