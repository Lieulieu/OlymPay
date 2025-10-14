export interface RWAAsset {
  id: string;
  issuer: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  image: string;
  description?: string;
  location?: string;
  yield?: number;
  maturity?: string;
  riskLevel?: "Low" | "Medium" | "High";
  assetType?: string;
  totalSupply?: number;
  availableSupply?: number;
  marketCap?: number;
  volume24h?: number;
  lastPrice?: number;
  priceChange24h?: number;
  bridgeProtocol?: string;
  supportedChains?: string[];
  crossChainEnabled?: boolean;
  // RWA-specific properties
  rwaType?: string;
  propertyValue?: number;
  occupancyRate?: number;
  annualRent?: number;
  propertyLocation?: string;
  propertyType?: string;
  floors?: number;
  totalArea?: string;
  tenants?: string[];
  // Token and network properties
  tokenAddress?: string;
  network?: string;
  networkUrl?: string;
}

export interface RWAPurchaseResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  transactionHash?: string;
  newBalance?: number;
  assetTokens?: number;
  paymentMethod?: "OUSDC" | "OVND_TO_OUSDC" | "COMBINED";
  oUSDCUsed?: number;
  oVNDUsed?: number;
  oUSDCConverted?: number;
  exchangeRate?: number;
  newOUSDCBalance?: number;
  newOVNDBalance?: number;
  swapDetails?: {
    ousdcAmount: number;
    nvdaxAmount: number;
    exchangeRate: number;
    poolUrl: string;
  };
}

export interface RWAMarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  totalAssets: number;
  averageYield: number;
  activeInvestors: number;
}

// New interfaces for comprehensive RWA system
export interface RWATransaction {
  id: string;
  userId: string;
  assetId: string;
  assetName: string;
  transactionType: "PURCHASE" | "SALE" | "DIVIDEND" | "MATURITY";
  amount: number;
  price: number;
  currency: string;
  paymentMethod: "OUSDC" | "OVND_TO_OUSDC" | "COMBINED";
  status: "PENDING" | "COMPLETED" | "FAILED";
  transactionHash?: string;
  timestamp: Date;
  fees?: number;
  notes?: string;
}

export interface RWAHolding {
  id: string;
  userId: string;
  assetId: string;
  assetName: string;
  issuer: string;
  quantity: number;
  averagePrice: number;
  totalValue: number;
  currency: string;
  purchaseDate: Date;
  lastUpdated: Date;
  yield?: number;
  maturity?: string;
  status: "ACTIVE" | "MATURED" | "SOLD";
}

export interface DepositTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: "oUSDC" | "oVND";
  source: "EXTERNAL_WALLET" | "BANK_TRANSFER" | "CREDIT_CARD" | "OVND_SWAP";
  status: "PENDING" | "COMPLETED" | "FAILED";
  transactionHash?: string;
  timestamp: Date;
  fees?: number;
  notes?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalGains: number;
  totalGainsPercentage: number;
  currency: string;
  holdings: RWAHolding[];
  recentTransactions: RWATransaction[];
  assetDistribution: {
    assetId: string;
    assetName: string;
    value: number;
    percentage: number;
  }[];
}
