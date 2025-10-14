"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/stores/user-store";
import { getClientAuth } from "@/lib/client/firebase-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Building,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { RWAAsset, RWAPurchaseResponse } from "@/types/rwa";
import { formatBalance } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LoadingMarket } from "@/components/LoadingMarket";

interface InternalWalletBalance {
  oUSDC: number;
  oVND: number;
  hasWallet: boolean;
}

// Mock RWA data with demo images
const mockRWAData: RWAAsset[] = [
  {
    id: "nvdax-001",
    issuer: "Nvidia Corp",
    name: "NVDAX Token",
    price: 1,
    currency: "oUSDC",
    category: "Technology Stock",
    image: "/nvdax.webp",
    description:
      "Tokenized shares of NVIDIA Corporation, a leading AI and graphics technology company",
    location: "Delaware, USA",
    yield: 1,
    maturity: "2025-12-31",
    riskLevel: "Medium",
    assetType: "Equity Token",
    totalSupply: 1000000,
    availableSupply: 856000,
    marketCap: 125500000,
    volume24h: 2500000,
    lastPrice: 125.5,
    priceChange24h: 3.2,
  },
  {
    id: "openasset-001",
    issuer: "Open Asset Corp",
    name: "Open Asset Token",
    price: 0.5,
    currency: "oUSDC",
    category: "Cross-Chain Bridge",
    image: "/openAsset.png",
    description:
      "Tokenized shares of Open Asset Corporation, powered by Owlto Finance cross-chain bridge protocol for seamless multi-chain interoperability",
    location: "San Francisco, USA",
    yield: 2.5,
    maturity: "2026-06-30",
    riskLevel: "Low",
    assetType: "Cross-Chain Equity Token",
    totalSupply: 2000000,
    availableSupply: 1500000,
    marketCap: 750000,
    volume24h: 1200000,
    lastPrice: 0.5,
    priceChange24h: 1.8,
    bridgeProtocol: "Owlto Finance",
    supportedChains: ["Ethereum", "Arbitrum", "Optimism", "zkSync Era", "Solana"],
    crossChainEnabled: true,
  },
  {
    id: "openasset-rwa-001",
    issuer: "Open Asset RWA Corp",
    name: "Open Asset RWA",
    price: 10000,
    currency: "oVND",
    category: "Real Estate",
    image: "/openAsset1.png",
    description:
      "Tokenized real estate assets from Open Asset RWA Corporation, representing fractional ownership in premium commercial properties across major metropolitan areas",
    location: "New York, USA",
    yield: 4.2,
    maturity: "2027-12-31",
    riskLevel: "Medium",
    assetType: "Real Estate Token",
    totalSupply: 500000,
    availableSupply: 375000,
    marketCap: 5000000000, // 5B oVND
    volume24h: 3400000000, // 3.4B oVND
    lastPrice: 10000,
    priceChange24h: 2.1,
    bridgeProtocol: "Owlto Finance",
    supportedChains: ["Ethereum", "Arbitrum", "Optimism", "zkSync Era", "Solana"],
    crossChainEnabled: true,
    rwaType: "Commercial Real Estate",
    propertyValue: 50000000,
    occupancyRate: 92.5,
    annualRent: 2100000,
    propertyLocation: "Manhattan, New York",
    propertyType: "Office Building",
    floors: 25,
    totalArea: "150,000 sq ft",
    tenants: ["Tech Corp", "Finance Inc", "Consulting Ltd"],
    tokenAddress: "0x699e24B7CAf01Ff66F2d54F840b973c8139d28cA", // oVND token address
    network: "U2U Network",
    networkUrl: "https://u2uscan.xyz/address/0x699e24B7CAf01Ff66F2d54F840b973c8139d28cA",
  },
];

export default function RWAMarketPage() {
  const { currentUser } = useUserStore();
  const [assets] = useState<RWAAsset[]>(mockRWAData);
  const [filteredAssets, setFilteredAssets] = useState<RWAAsset[]>(mockRWAData);
  const [internalBalance, setInternalBalance] =
    useState<InternalWalletBalance | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<RWAAsset | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] =
    useState<RWAPurchaseResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssuer, setSelectedIssuer] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
    fetchInternalBalance();
  }, []);

  // Helper function to get auth token
  const getAuthToken = async () => {
    if (!currentUser?.uid) {
      throw new Error("User not authenticated");
    }

    const clientAuth = getClientAuth();
    const user = clientAuth.currentUser;

    if (!user) {
      throw new Error("No authenticated user found");
    }

    return await user.getIdToken(true);
  };

  const fetchInternalBalance = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setInternalBalance(data);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
  const getQuantity = (assetId: string) => quantities[assetId] || 1;
  const setQuantity = (assetId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [assetId]: Math.max(1, quantity) }));
  };

  const getTotalPrice = (asset: RWAAsset) =>
    asset.price * getQuantity(asset.id);

  const handlePurchase = async () => {
    if (!selectedAsset || isPurchasing) return;

    const totalPrice = getTotalPrice(selectedAsset);
    const quantity = getQuantity(selectedAsset.id);

    setIsPurchasing(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Authentication required");

      const response = await fetch("/api/rwa/purchase-real", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          assetName: selectedAsset.name,
          quantity: quantity,
          unitPrice: selectedAsset.price,
          totalPrice: totalPrice,
          currency: selectedAsset.currency,
        }),
      });

      const result: RWAPurchaseResponse = await response.json();
      setPurchaseResult(result);

      // Close confirm modal and open status modal
      setIsConfirmModalOpen(false);
      setIsStatusModalOpen(true);

      if (result.success) {
        setTimeout(() => fetchInternalBalance(), 1000);
      }
    } catch (err) {
      setPurchaseResult({
        success: false,
        message: err instanceof Error ? err.message : "Purchase failed",
      });
      setIsConfirmModalOpen(false);
      setIsStatusModalOpen(true);
    } finally {
      setIsPurchasing(false);
    }
  };

  const closeModal = () => {
    setIsConfirmModalOpen(false);
    setIsStatusModalOpen(false);
    setSelectedAsset(null);
    setPurchaseResult(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Technology Stock":
        return "💻";
      case "Government Bond":
        return "🏛️";
      case "Precious Metal":
        return "🥇";
      case "Real Estate":
        return "🏢";
      default:
        return "📈";
    }
  };

  if (isLoading) return <LoadingMarket />;

  return (
    <main className="min-h-screen mt-15 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RWA Marketplace
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Invest in tokenized real-world assets with your digital wallet
            </p>
          </div>

          {/* Asset Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className="h-full flex flex-col bg-white border-0 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2 rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => {
                  setSelectedAsset(asset);
                  setIsConfirmModalOpen(true);
                }}
              >
                <CardHeader className="pb-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 rounded-xl mb-4 flex items-center justify-center border border-blue-200/30 shadow-inner overflow-hidden">
                    {asset.image ? (
                      <img
                        src={asset.image}
                        alt={asset.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="p-3 bg-white/80 rounded-full shadow-sm border border-white/50">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <p className="text-xs text-gray-600 font-medium px-3 py-1 bg-white/60 rounded-full border border-white/50">
                          {asset.category}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {asset.issuer}
                    </Badge>
                    <Badge
                      variant={
                        asset.riskLevel === "Low"
                          ? "default"
                          : asset.riskLevel === "Medium"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {asset.riskLevel}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                    {asset.name}
                  </h3>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatBalance(asset.price)} {asset.currency}
                      </span>
                      {asset.priceChange24h && (
                        <div
                          className={`flex items-center gap-1 ${
                            asset.priceChange24h >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {asset.priceChange24h >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {asset.priceChange24h >= 0 ? "+" : ""}
                            {asset.priceChange24h}%
                          </span>
                        </div>
                      )}
                    </div>

                    {asset.yield && asset.yield > 0 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {asset.yield}% APY
                        </span>
                      </div>
                    )}

                    {asset.crossChainEnabled && asset.bridgeProtocol && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {asset.bridgeProtocol} Bridge
                        </span>
                      </div>
                    )}

                    {asset.rwaType && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <Building className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {asset.rwaType}
                        </span>
                      </div>
                    )}

                    {asset.tokenAddress && (
                      <div className="flex items-center gap-2 text-green-600">
                        <ExternalLink className="h-4 w-4" />
                        <a 
                          href={asset.networkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline"
                        >
                          {asset.network} Token
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Confirm Purchase Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Review your purchase details before proceeding
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4">
              {/* Asset Info */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    {getCategoryIcon(selectedAsset.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedAsset.name}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedAsset.issuer}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per unit:</span>
                    <span className="font-medium">
                      {formatBalance(selectedAsset.price)}{" "}
                      {selectedAsset.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setQuantity(
                            selectedAsset.id,
                            getQuantity(selectedAsset.id) - 1
                          )
                        }
                        disabled={getQuantity(selectedAsset.id) <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">
                        {getQuantity(selectedAsset.id)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setQuantity(
                            selectedAsset.id,
                            getQuantity(selectedAsset.id) + 1
                          )
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold text-lg">
                      {formatBalance(getTotalPrice(selectedAsset))}{" "}
                      {selectedAsset.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* RWA Details */}
              {selectedAsset?.rwaType && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      Real Estate Details
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {selectedAsset.propertyValue && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">Property Value:</span>
                        <span className="font-medium">
                          ${selectedAsset.propertyValue.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedAsset.occupancyRate && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">Occupancy:</span>
                        <span className="font-medium">
                          {selectedAsset.occupancyRate}%
                        </span>
                      </div>
                    )}
                    {selectedAsset.propertyLocation && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">Location:</span>
                        <span className="font-medium">
                          {selectedAsset.propertyLocation}
                        </span>
                      </div>
                    )}
                    {selectedAsset.annualRent && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">Annual Rent:</span>
                        <span className="font-medium">
                          ${selectedAsset.annualRent.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Balance Check */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">
                    Your {selectedAsset?.currency || 'oUSDC'} Balance:
                  </span>
                  <span className="font-medium text-blue-800">
                    {selectedAsset?.currency === 'oVND' 
                      ? formatBalance(internalBalance?.oVND || 0) + ' oVND'
                      : formatBalance(internalBalance?.oUSDC || 0) + ' oUSDC'
                    }
                  </span>
                </div>
                {getTotalPrice(selectedAsset) >
                  (selectedAsset?.currency === 'oVND' 
                    ? (internalBalance?.oVND || 0)
                    : (internalBalance?.oUSDC || 0)
                  ) && (
                  <p className="text-red-600 text-xs mt-1">
                    Insufficient balance. Please deposit more {selectedAsset?.currency || 'oUSDC'}.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={
                isPurchasing ||
                getTotalPrice(selectedAsset || ({} as RWAAsset)) >
                  (selectedAsset?.currency === 'oVND' 
                    ? (internalBalance?.oVND || 0)
                    : (internalBalance?.oUSDC || 0)
                  )
              }
              className="flex-1"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Purchase for ${formatBalance(
                  getTotalPrice(selectedAsset || ({} as RWAAsset))
                )} ${selectedAsset?.currency}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {purchaseResult?.success
                ? "Purchase Successful"
                : "Purchase Failed"}
            </DialogTitle>
            <DialogDescription>
              {purchaseResult?.success
                ? "Your RWA purchase has been completed successfully"
                : "There was an issue with your purchase"}
            </DialogDescription>
          </DialogHeader>

          {purchaseResult && (
            <div className="space-y-4">
              {/* Success/Failure Icon */}
              <div className="flex justify-center">
                {purchaseResult.success ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>

              {/* Transaction Details */}
              {purchaseResult.success && (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Transaction Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Asset:</span>
                        <span className="font-medium">
                          {selectedAsset?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">
                          {getQuantity(selectedAsset?.id || "")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid:</span>
                        <span className="font-medium">
                          {formatBalance(
                            getTotalPrice(selectedAsset || ({} as RWAAsset))
                          )}{" "}
                          {selectedAsset?.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  {purchaseResult.transactionHash && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Transaction Hash</h4>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono flex-1 break-all">
                          {purchaseResult.transactionHash}
                        </code>
                        <a
                          href={`https://explorer.solana.com/tx/${purchaseResult.transactionHash}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline btn-primary shrink-0"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Swap Details */}
                  {purchaseResult.swapDetails && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        Swap Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-600">Swapped:</span>
                          <span className="font-medium">
                            {purchaseResult.swapDetails.ousdcAmount} oUSDC
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Received:</span>
                          <span className="font-medium">
                            {purchaseResult.swapDetails.nvdaxAmount} NVDAX
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Exchange Rate:</span>
                          <span className="font-medium">
                            1 oUSDC = {purchaseResult.swapDetails.exchangeRate}{" "}
                            NVDAX
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {!purchaseResult.success && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{purchaseResult.message}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeModal} className="w-full">
              {purchaseResult?.success ? "Close" : "Try Again"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
}
