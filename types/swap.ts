// Swap Types and Interfaces for oVND -> oUSD functionality

export interface SwapRequest {
  fromToken: "oVND";
  toToken: "oUSD";
  amount: number;
  slippage?: number; // Default 0.5%
  userAddress: string;
}

export interface SwapQuote {
  fromToken: "oVND";
  toToken: "oUSD";
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  slippage: number;
  estimatedGas: number;
  priceImpact: number;
  minimumReceived: number;
  validUntil: Date;
}

export interface SwapTransaction {
  id: string;
  userId: string;
  fromToken: "oVND";
  toToken: "oUSD";
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  slippage: number;
  status: SwapStatus;
  timestamp: Date;
  transactionHash?: string;
  error?: string;
  notes?: string;
}

export type SwapStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface SwapResponse {
  success: boolean;
  message: string;
  swapId?: string;
  transactionHash?: string;
  exchangeRate?: number;
  slippage?: number;
  error?: string;
}

export interface OrcaSwapParams {
  tokenIn: string; // oVND token address
  tokenOut: string; // oUSD token address
  amountIn: number;
  slippage: number;
  userAddress: string;
  chainId: "solanaDevnet";
}

export interface OrcaSwapResponse {
  success: boolean;
  transaction?: string; // Base64 encoded transaction
  quote?: {
    inputAmount: number;
    outputAmount: number;
    priceImpact: number;
    fee: number;
  };
  error?: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

// Token addresses for Solana Devnet
export const TOKEN_ADDRESSES = {
  oVND: "EbNKsXtiUQQ972QEF172kRQPhVb6MJpx5NwZ6LX8H69b",
  oUSD: "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV",
} as const;

export const TOKEN_INFO: Record<string, TokenInfo> = {
  oVND: {
    address: TOKEN_ADDRESSES.oVND,
    symbol: "oVND",
    decimals: 9,
    name: "Olympay Vietnamese Dong",
  },
  oUSD: {
    address: TOKEN_ADDRESSES.oUSD,
    symbol: "oUSD",
    decimals: 6,
    name: "Olympay US Dollar",
  },
};
