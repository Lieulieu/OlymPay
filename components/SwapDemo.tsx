"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Wallet,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwapRequest, SwapQuote, SwapTransaction } from "@/types/swap";

interface SwapDemoProps {
  userAddress?: string;
  authToken?: string;
}

export default function SwapDemo({ userAddress, authToken }: SwapDemoProps) {
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<{
    oVND: number;
    oUSD: number;
  } | null>(null);
  const [swapHistory, setSwapHistory] = useState<SwapTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadExchangeRate();
    if (authToken) {
      loadUserBalance();
      loadSwapHistory();
    }
  }, [authToken]);

  // Get quote when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      getQuote();
    } else {
      setQuote(null);
    }
  }, [amount, slippage]);

  const loadExchangeRate = async () => {
    try {
      const response = await fetch("/api/swap/rate");
      const data = await response.json();
      if (data.success) {
        setExchangeRate(data.rate);
      }
    } catch (error) {
      console.error("Error loading exchange rate:", error);
    }
  };

  const loadUserBalance = async () => {
    if (!authToken) return;

    try {
      const response = await fetch("/api/swap/balance", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserBalance(data.balances);
      }
    } catch (error) {
      console.error("Error loading user balance:", error);
    }
  };

  const loadSwapHistory = async () => {
    if (!authToken) return;

    try {
      const response = await fetch("/api/swap/history", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSwapHistory(data.swaps);
      }
    } catch (error) {
      console.error("Error loading swap history:", error);
    }
  };

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoadingQuote(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/swap/ovnd-to-usd?amount=${amount}&slippage=${slippage}`
      );
      const data = await response.json();

      if (data.success) {
        setQuote(data.quote);
      } else {
        setError(data.error || "Failed to get quote");
      }
    } catch (error) {
      setError("Network error while getting quote");
      console.error("Error getting quote:", error);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const executeSwap = async () => {
    if (!amount || parseFloat(amount) <= 0 || !authToken) return;

    setIsSwapping(true);
    setError(null);
    setSwapResult(null);

    try {
      const response = await fetch("/api/swap/ovnd-to-usd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          slippage,
        }),
      });

      const data = await response.json();
      setSwapResult(data);

      if (data.success) {
        // Refresh balance and history
        loadUserBalance();
        loadSwapHistory();
        setAmount("");
        setQuote(null);
      } else {
        setError(data.error || "Swap failed");
      }
    } catch (error) {
      setError("Network error while executing swap");
      console.error("Error executing swap:", error);
    } finally {
      setIsSwapping(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 6) => {
    return num.toLocaleString("vi-VN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("vi-VN");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-primary mb-2">
          Swap oVND → oUSD Demo
        </h1>
        <p className="text-gray-600">
          Demo chức năng swap từ oVND sang oUSD sử dụng Orca
        </p>
      </motion.div>

      {/* Current Exchange Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Tỷ giá hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                1 oVND = {formatNumber(exchangeRate, 8)} oUSD
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Tỷ giá được cập nhật từ Orca
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* User Balance */}
      {userBalance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-500" />
                Số dư ví
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatNumber(userBalance.oVND)} oVND
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {formatNumber(userBalance.oUSD)} oUSD
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Swap Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-purple-500" />
              Swap oVND → oUSD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Số lượng oVND
              </label>
              <Input
                type="number"
                placeholder="Nhập số lượng oVND"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Slippage */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Slippage (%)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="0.5"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                className="w-full"
              />
            </div>

            {/* Quote Display */}
            {isLoadingQuote && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Đang tính toán...</span>
              </div>
            )}

            {quote && !isLoadingQuote && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bạn sẽ nhận:</span>
                  <span className="font-semibold text-green-600">
                    {formatNumber(quote.toAmount)} oUSD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tỷ giá:</span>
                  <span className="text-sm">
                    1 oVND = {formatNumber(quote.exchangeRate, 8)} oUSD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price Impact:</span>
                  <span className="text-sm">
                    {formatNumber(quote.priceImpact, 2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phí gas:</span>
                  <span className="text-sm">
                    {formatNumber(quote.estimatedGas, 6)} SOL
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Swap Result */}
            {swapResult && (
              <div
                className={`p-4 rounded-lg ${
                  swapResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center">
                  {swapResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span
                    className={
                      swapResult.success ? "text-green-700" : "text-red-700"
                    }
                  >
                    {swapResult.message || swapResult.error}
                  </span>
                </div>
                {swapResult.transactionHash && (
                  <div className="mt-2 text-xs text-gray-600">
                    Transaction: {swapResult.transactionHash}
                  </div>
                )}
              </div>
            )}

            {/* Swap Button */}
            <Button
              onClick={executeSwap}
              disabled={
                !amount || parseFloat(amount) <= 0 || !authToken || isSwapping
              }
              className="w-full"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang swap...
                </>
              ) : (
                "Thực hiện Swap"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Swap History */}
      {swapHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-orange-500" />
                Lịch sử Swap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {swapHistory.slice(0, 5).map((swap) => (
                  <div
                    key={swap.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {formatNumber(swap.fromAmount)} oVND →{" "}
                        {formatNumber(swap.toAmount)} oUSD
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(swap.timestamp)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${
                          swap.status === "COMPLETED"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {swap.status}
                      </div>
                      <div className="text-xs text-gray-500">
                        Rate: {formatNumber(swap.exchangeRate, 8)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
