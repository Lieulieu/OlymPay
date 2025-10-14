import { NextRequest, NextResponse } from "next/server";

// U2U Solaris Network Configuration
const U2U_RPC_URL = "https://rpc-mainnet.uniultra.xyz";
const U2U_CHAIN_ID = "0x1a1"; // 417 in decimal
const U2U_NATIVE_CURRENCY = {
  name: "U2U",
  symbol: "U2U",
  decimals: 18,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate wallet address format (Ethereum format)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    try {
      // Fetch U2U balance using eth_getBalance
      const response = await fetch(U2U_RPC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
      },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [walletAddress, "latest"],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }

      // Convert wei to U2U (1 U2U = 10^18 wei)
      const balanceInWei = parseInt(data.result, 16);
      const u2uBalance = balanceInWei / Math.pow(10, 18);

      console.log("U2U Balance fetched:", {
        walletAddress,
        balanceInWei: balanceInWei,
        balanceInU2U: u2uBalance,
        rpcUrl: U2U_RPC_URL,
      });

      return NextResponse.json({
        success: true,
        walletAddress,
        balance: u2uBalance,
        rawBalance: balanceInWei,
        currency: "U2U",
        network: "U2U Solaris",
        explorerUrl: `https://u2uscan.xyz/address/${walletAddress}`,
        rpcUrl: U2U_RPC_URL,
      });
    } catch (error) {
      console.error("Error fetching U2U balance:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch U2U balance",
        walletAddress,
        balance: 0,
        currency: "U2U",
        network: "U2U Solaris",
      });
    }
  } catch (error) {
    console.error("Error in U2U balance API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check U2U balance",
        success: false,
      },
      { status: 500 }
    );
  }
}
