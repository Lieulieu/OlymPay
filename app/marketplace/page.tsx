"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Wallet,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useWallet } from "@/contexts/WalletContext";
import { Transaction } from "@solana/web3.js";
import { LoadingMarket } from "@/components/LoadingMarket";

interface MarketplaceProduct {
  id: string;
  partner: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  image: string;
  description?: string;
}

interface WalletBalance {
  balance: number;
  currency: string;
}

interface PurchaseResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  transactionHash?: string;
  newBalance?: number;
}

const partners = [
  "All",
  "SAVICO",
  "Vietjet Air",
  "HDBank",
  "Olym3 AI Hub",
  "VNX Gold",
];

export default function MarketplacePage() {
  const { connected, publicKey } = useWallet();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<
    MarketplaceProduct[]
  >([]);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] =
    useState<MarketplaceProduct | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResponse | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oVNDBalance, setOVNDBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [internalBalance, setInternalBalance] = useState<{
    oUSDCBalance: number;
    oVNDBalance: number;
    hasWallet: boolean;
    walletAddress?: string;
  } | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    fetchWalletBalance();
    fetchInternalBalance();
  }, []);

  // Fetch oVND balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchOVNDBalance();
    }
  }, [connected, publicKey]);

  // Filter products when search term or partner changes
  useEffect(() => {
    let filtered = products;

    // Filter by partner
    if (selectedPartner !== "All") {
      filtered = filtered.filter(
        (product) => product.partner === selectedPartner
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedPartner]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/marketplace/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError("Failed to load products. Please try again.");
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("/api/wallet/balance");
      if (!response.ok) {
        throw new Error("Failed to fetch wallet balance");
      }
      const data = await response.json();
      setWalletBalance(data);
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  };

  const fetchInternalBalance = async () => {
    try {
      const response = await fetch("/api/wallet/internal-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch internal balance");
      }
      const data = await response.json();
      setInternalBalance(data);
    } catch (err) {
      console.error("Error fetching internal balance:", err);
    }
  };

  // Helper function to get auth token
  const getAuthToken = async () => {
    // This would typically get the Firebase auth token
    // For now, return a placeholder
    return "placeholder-token";
  };

  // Fetch oVND balance
  const fetchOVNDBalance = async () => {
    if (!publicKey) return;

    setLoadingBalance(true);
    try {
      const response = await fetch("/api/wallet/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
        }),
      });

      const data = await response.json();
      if (data.success && data.oVNDBalance !== undefined) {
        setOVNDBalance(data.oVNDBalance);
      }
    } catch (error) {
      console.error("Error fetching oVND balance:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleBuyClick = (product: MarketplaceProduct) => {
    setSelectedProduct(product);
    setPurchaseResult(null);
    setIsPurchaseModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedProduct || !publicKey) return;

    // Check balance based on currency
    if (selectedProduct.currency === "oVND") {
      // Check if user has enough oVND balance
      if (
        oVNDBalance === null ||
        oVNDBalance < selectedProduct.price * 1000000000
      ) {
        setPurchaseResult({
          success: false,
          message: "Không đủ số dư oVND để mua sản phẩm này.",
        });
        return;
      }
    } else if (selectedProduct.currency === "USDC") {
      // Check if user has enough USDC balance
      if (!walletBalance || walletBalance.balance < selectedProduct.price) {
        setPurchaseResult({
          success: false,
          message: "Không đủ số dư USDC để mua sản phẩm này.",
        });
        return;
      }
    }

    setIsPurchasing(true);
    try {
      if (selectedProduct.currency === "oVND") {
        // Handle oVND purchases (existing logic)
        // Step 1: Create transfer transaction
        const createTxResponse = await fetch("/api/wallet/user-transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromAddress: publicKey.toString(),
            toAddress: "GVq5DsJkrwg1MwZGvJUQxXML6JiBnnwfeePv8LrvaHqR", // OlymPay Treasury
            amount: selectedProduct.price,
          }),
        });

        const createTxResult = await createTxResponse.json();

        if (!createTxResult.success) {
          setPurchaseResult({
            success: false,
            message: `Create transaction failed: ${createTxResult.error}`,
          });
          return;
        }

        // Step 2: Sign and send transaction with Phantom wallet
        const transaction = Transaction.from(
          Buffer.from(createTxResult.transaction, "base64")
        );

        // Request signature and send transaction directly
        const { signature } = await (
          window as any
        ).solana.signAndSendTransaction(transaction);

        if (!signature) {
          setPurchaseResult({
            success: false,
            message: "User rejected transaction signature",
          });
          return;
        }

        // Step 3: Process the purchase (transaction already sent)
        const response = await fetch("/api/marketplace/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: selectedProduct.id,
            transactionHash: signature,
          }),
        });

        const result: PurchaseResponse = await response.json();
        // Add transactionHash to the result
        result.transactionHash = signature;
        setPurchaseResult(result);

        if (result.success) {
          // Refresh balance from blockchain (don't manually subtract as transaction already did it)
          setTimeout(() => {
            fetchOVNDBalance();
          }, 1000);
        }
      } else if (selectedProduct.currency === "USDC") {
        // Handle USDC purchases on Base Network
        // For now, we'll simulate the purchase process
        // In a real implementation, you would integrate with Base Network USDC transfers

        // Simulate API call for USDC purchase
        const response = await fetch("/api/marketplace/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: selectedProduct.id,
            currency: "USDC",
            amount: selectedProduct.price,
            network: "Base",
          }),
        });

        const result: PurchaseResponse = await response.json();
        setPurchaseResult(result);

        if (result.success) {
          // Update USDC balance
          setWalletBalance((prev) =>
            prev
              ? {
                  ...prev,
                  balance: prev.balance - selectedProduct.price,
                }
              : null
          );
          // Refresh balance
          setTimeout(() => {
            fetchWalletBalance();
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Purchase error:", err);
      setPurchaseResult({
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "Network error. Please try again.",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const closeModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedProduct(null);
    setPurchaseResult(null);
  };

  const formatPrice = (price: number) => {
    return price ? price.toLocaleString("vi-VN") : "0";
  };

  const getPartnerColor = (partner: string) => {
    switch (partner) {
      case "SAVICO":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Vietjet Air":
        return "bg-red-100 text-red-800 border-red-200";
      case "HDBank":
        return "bg-green-100 text-green-800 border-green-200";
      case "Olym3 AI Hub":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "VNX Gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return <LoadingMarket />;
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="bg-base-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Marketplace
            </h1>
            <p className="text-xl text-secondary max-w-3xl mx-auto mb-8">
              Purchase
            </p>

            {/* Wallet Balance Display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              {walletBalance && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2"
                >
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="text-sm text-secondary">Số dư USDC:</span>
                  <span className="font-bold text-primary">
                    {formatPrice(walletBalance.balance)}{" "}
                    {walletBalance.currency}
                  </span>
                </motion.div>
              )}

              {/* Internal Wallet Balance */}
              {internalBalance && internalBalance.hasWallet && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2"
                  >
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">$</span>
                    </div>
                    <span className="text-sm text-gray-600">oUSDC:</span>
                    <span className="font-bold text-green-600">
                      {formatPrice(internalBalance.oUSDCBalance)} oUSDC
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2"
                  >
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₫</span>
                    </div>
                    <span className="text-sm text-gray-600">oVND:</span>
                    <span className="font-bold text-blue-600">
                      {formatPrice(internalBalance.oVNDBalance)} oVND
                    </span>
                  </motion.div>
                </>
              )}

              {/* oVND Balance Display */}
              {connected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-2"
                >
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-sm text-gray-600">Solana oVND:</span>
                  {loadingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  ) : oVNDBalance !== null ? (
                    <span className="font-bold text-orange-600">
                      {oVNDBalance !== null
                        ? (oVNDBalance / 1000000000).toLocaleString("vi-VN", {
                            maximumFractionDigits: 6,
                          })
                        : "0"}{" "}
                      oVND
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Không thể tải</span>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={selectedPartner}
                onValueChange={setSelectedPartner}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issuer" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {partners.map((partner) => (
                    <SelectItem
                      className="cursor-pointer hover:text-white"
                      key={partner}
                      value={partner}
                    >
                      {partner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8"
            >
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Products by Sections */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-12"
          >
            {[
              "Dịch vụ",
              "Khóa học AI và Blockchain",
              "Tài sản thế giới thực",
            ].map((sectionName, sectionIndex) => {
              const sectionProducts = filteredProducts.filter(
                (product) => product.category === sectionName
              );

              if (sectionProducts.length === 0) return null;

              return (
                <motion.div
                  key={sectionName}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: sectionIndex * 0.2 }}
                  className="space-y-6"
                >
                  {/* Section Header */}
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-primary mb-2">
                      {sectionName}
                    </h2>
                    <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
                  </div>

                  {/* Products Grid for this section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                      {sectionProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ y: -5 }}
                          className="h-full"
                        >
                          <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="pb-3">
                              <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                <ShoppingCart className="h-12 w-12 text-gray-400" />
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getPartnerColor(
                                    product.partner
                                  )}`}
                                >
                                  {product.partner}
                                </span>
                                <span className="text-xs text-secondary">
                                  {product.category}
                                </span>
                              </div>
                              <CardTitle className="text-lg line-clamp-2">
                                {product.name}
                              </CardTitle>
                            </CardHeader>

                            <CardContent className="flex-1">
                              <CardDescription className="line-clamp-3">
                                {product.description ||
                                  "Sản phẩm chất lượng cao từ đối tác uy tín"}
                              </CardDescription>
                            </CardContent>

                            <CardFooter className="pt-3">
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <span className="text-2xl font-bold text-primary">
                                    {formatPrice(product.price)}
                                  </span>
                                  <span className="text-sm text-secondary ml-1">
                                    {product.currency}
                                  </span>
                                </div>
                                <Button
                                  onClick={() => handleBuyClick(product)}
                                  className="ml-4"
                                  disabled={
                                    product.currency === "oVND"
                                      ? oVNDBalance === null ||
                                        oVNDBalance < product.price * 1000000000
                                      : walletBalance
                                      ? walletBalance.balance < product.price
                                      : false
                                  }
                                >
                                  Purchase
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Empty State */}
          {filteredProducts.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No product found
              </h3>
              <p className="text-gray-500">
                Please try changing the filter or search term
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="sm:max-w-md bg-green-200">
          <DialogHeader>
            <DialogTitle>Confirm purchase</DialogTitle>
            <DialogDescription>
              Please check the product information before purchasing
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getPartnerColor(
                      selectedProduct.partner
                    )}`}
                  >
                    {selectedProduct.partner}
                  </span>
                  <span className="text-xs text-secondary">
                    {selectedProduct.category}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{selectedProduct.name}</h3>
                <p className="text-sm text-secondary mb-3">
                  {selectedProduct.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(selectedProduct.price)}{" "}
                    {selectedProduct.currency}
                  </span>
                </div>
              </div>

              {/* Balance Check based on currency */}
              {connected &&
                selectedProduct.currency === "oVND" &&
                oVNDBalance !== null && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Current oVND balance:
                      </span>
                      <span className="font-semibold text-blue-600">
                        {oVNDBalance !== null
                          ? (oVNDBalance / 1000000000).toLocaleString("vi-VN", {
                              maximumFractionDigits: 0,
                            })
                          : "0"}{" "}
                        oVND
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Product price:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {formatPrice(selectedProduct.price)} oVND
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Remaining balance:
                      </span>
                      <span className="font-semibold text-green-600">
                        {oVNDBalance !== null
                          ? (
                              oVNDBalance / 1000000000 -
                              selectedProduct.price
                            ).toLocaleString("vi-VN", {
                              maximumFractionDigits: 0,
                            })
                          : "0"}{" "}
                        oVND
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Chuyển đến:</span>
                      <span className="font-semibold text-purple-600">
                        OlymPay Treasury
                      </span>
                    </div>
                    {oVNDBalance < selectedProduct.price * 1000000000 && (
                      <div className="mt-2 text-sm text-red-600">
                        ⚠️ Remaining oVND balance is not enough to purchase this
                        product
                      </div>
                    )}
                  </div>
                )}

              {/* USDC Balance Check */}
              {connected &&
                selectedProduct.currency === "USDC" &&
                walletBalance && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Current USDC balance:
                      </span>
                      <span className="font-semibold text-blue-600">
                        {formatPrice(walletBalance.balance)} USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Product price:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {formatPrice(selectedProduct.price)} USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Remaining balance:
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(
                          walletBalance.balance - selectedProduct.price
                        )}{" "}
                        USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Mạng lưới:</span>
                      <span className="font-semibold text-purple-600">
                        Base Network
                      </span>
                    </div>
                    {walletBalance.balance < selectedProduct.price && (
                      <div className="mt-2 text-sm text-red-600">
                        ⚠️ Remaing USDC balance is not enough to purchase this
                      </div>
                    )}
                  </div>
                )}

              {walletBalance && selectedProduct.currency === "USDC" && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">
                      Số dư USDC hiện tại:
                    </span>
                    <span className="font-semibold">
                      {formatPrice(walletBalance.balance)}{" "}
                      {walletBalance.currency}
                    </span>
                  </div>
                  {walletBalance &&
                    walletBalance.balance < selectedProduct.price && (
                      <div className="mt-2 text-sm text-red-600">
                        ⚠️ Remaining balance is not enough to purchase this
                        product
                      </div>
                    )}
                </div>
              )}

              {purchaseResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    purchaseResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    {purchaseResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span
                      className={
                        purchaseResult.success
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    >
                      {purchaseResult.message}
                    </span>
                  </div>
                  {purchaseResult.transactionId && (
                    <div className="mt-2 text-xs text-gray-600">
                      Mã giao dịch: {purchaseResult.transactionId}
                    </div>
                  )}
                  {purchaseResult.transactionHash && (
                    <div className="mt-2 text-xs text-gray-600">
                      Transaction:
                      <a
                        href={`https://explorer.solana.com/tx/${purchaseResult.transactionHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:text-blue-800 underline"
                      >
                        {purchaseResult.transactionHash.slice(0, 8)}...
                        {purchaseResult.transactionHash.slice(-8)}
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Đóng
            </Button>
            {!purchaseResult && (
              <Button
                onClick={handlePurchase}
                disabled={
                  isPurchasing ||
                  (selectedProduct?.currency === "oVND"
                    ? oVNDBalance === null ||
                      oVNDBalance < (selectedProduct?.price || 0) * 1000000000
                    : walletBalance
                    ? walletBalance.balance < (selectedProduct?.price || 0)
                    : false)
                }
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Confirm investment"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
}
