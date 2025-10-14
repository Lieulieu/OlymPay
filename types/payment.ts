export interface StripePaymentInfo {
  // Stripe Payment Intent data
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "canceled" | "processing";

  // Transaction details
  transactionId: string;
  transactionHash?: string; // Solana transaction hash

  // Wallet information
  walletAddress: string; // External wallet address used for payment
  internalWalletAddress: string; // Internal wallet where tokens were minted

  // Token information
  tokenAmount: number; // Amount of tokens minted (oUSDC)
  tokenType: "oUSDC" | "oVND";

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Additional metadata
  metadata?: {
    stripeCustomerId?: string;
    paymentMethod?: string;
    description?: string;
    [key: string]: any;
  };
}

export interface PaymentHistoryResponse {
  payments: StripePaymentInfo[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreatePaymentRequest {
  paymentIntentId: string;
  amount: number;
  currency: string;
  transactionId: string;
  walletAddress: string;
  internalWalletAddress: string;
  tokenAmount: number;
  tokenType: "oUSDC" | "oVND";
  metadata?: Record<string, any>;
}
