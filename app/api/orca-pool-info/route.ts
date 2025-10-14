import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

// Token addresses on Solana Devnet
const OUSDC_MINT_ADDRESS = "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV"; // oUSDC
const NVDAX_MINT_ADDRESS = "HPDJ6Nruhi2nSjnaXAvC6AFGRhH4Dg6sguQchLCNxKWT"; // NVDAX

export async function GET(req: NextRequest) {
  try {
    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Check if tokens exist on devnet
    const ousdcExists = await checkTokenExists(connection, OUSDC_MINT_ADDRESS);
    const nvdaxExists = await checkTokenExists(connection, NVDAX_MINT_ADDRESS);

    if (!ousdcExists || !nvdaxExists) {
      return NextResponse.json({
        success: false,
        error: "One or both tokens do not exist on Solana devnet",
        details: {
          ousdcExists,
          nvdaxExists,
          ousdcAddress: OUSDC_MINT_ADDRESS,
          nvdaxAddress: NVDAX_MINT_ADDRESS,
        },
        suggestion:
          "You may need to deploy these tokens to devnet first or use existing tokens",
      });
    }

    // For now, return mock pool info since we can't find real whirlpool
    // In production, you would search for actual whirlpool addresses
    const mockPoolInfo = {
      address: "mock-whirlpool-address",
      tokenMintA: OUSDC_MINT_ADDRESS,
      tokenMintB: NVDAX_MINT_ADDRESS,
      tokenVaultA: "mock-vault-a",
      tokenVaultB: "mock-vault-b",
      tickSpacing: 64,
      feeRate: 500, // 0.05%
      protocolFeeRate: 300, // 0.03%
      liquidity: "0",
      sqrtPrice: "79228162514264337593543950336", // 1:1 price
      tickCurrentIndex: 0,
    };

    return NextResponse.json({
      success: true,
      whirlpoolAddress: mockPoolInfo.address,
      poolInfo: mockPoolInfo,
      message: "Tokens exist on devnet. Mock pool info provided.",
      note: "This is mock data. Real whirlpool integration requires Orca SDK setup.",
    });
  } catch (error) {
    console.error("Error checking pool info:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function checkTokenExists(
  connection: Connection,
  mintAddress: string
): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(
      new PublicKey(mintAddress)
    );
    return accountInfo !== null;
  } catch (error) {
    console.error(`Error checking token ${mintAddress}:`, error);
    return false;
  }
}
