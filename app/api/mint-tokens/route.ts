import { NextRequest, NextResponse } from "next/server";
import { getMintingFunction } from "@/lib/solana-mint";

export async function POST(request: NextRequest) {
  try {
    const { userAddress, amount } = await request.json();

    // Validate input
    if (!userAddress || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid user address or amount" },
        { status: 400 }
      );
    }

    // Get mint keypair from environment variables
    const mintKeypairHex = process.env.OUSDC_TOKEN;

    if (!mintKeypairHex) {
      return NextResponse.json(
        { error: "Mint keypair not found in environment variables" },
        { status: 500 }
      );
    }

    // Get the appropriate minting function (mock or real)
    const mintFunction = getMintingFunction();

    // Mint tokens
    const result = await mintFunction(userAddress, amount, mintKeypairHex);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Tokens minted successfully",
        txHash: result.txHash,
        amount: amount,
        userAddress: userAddress,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Minting failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error minting tokens:", error);
    return NextResponse.json(
      { error: "Failed to mint tokens" },
      { status: 500 }
    );
  }
}
