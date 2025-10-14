"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";
import { getClientAuth } from "@/lib/client/firebase-client";

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  slippage: number;
  estimatedGas: number;
}

interface SwapResult {
  success: boolean;
  message: string;
  swapId?: string;
  transactionHash?: string;
  exchangeRate?: number;
  slippage?: number;
}

export default function OrcaSwapComponent() {
  const { currentUser } = useUserStore();
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [internalBalance, setInternalBalance] = useState({
    oUSDC: 0,
    NVDAX: 0,
  });

  // Fetch internal balance
  const fetchInternalBalance = async () => {
    if (!currentUser?.uid) return;

    try {
      const token = await getClientAuth().currentUser?.getIdToken();
      const response = await fetch("/api/wallet/balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInternalBalance({
          oUSDC: data.oUSDC || 0,
          NVDAX: data.NVDAX || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  useEffect(() => {
    fetchInternalBalance();
  }, [currentUser]);

  // Get swap quote
  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    setIsLoadingQuote(true);
    try {
      const response = await fetch(
        `/api/orca-swap?amount=${amount}&slippage=${slippage}`
      );
      const data = await response.json();

      if (data.success) {
        setQuote(data.quote);
      } else {
        toast.error(data.error || "Không thể lấy quote");
      }
    } catch (error) {
      console.error("Quote error:", error);
      toast.error("Có lỗi xảy ra khi lấy quote");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Execute swap
  const executeSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!currentUser?.uid) {
      toast.error("Vui lòng đăng nhập trước");
      return;
    }

    setIsSwapping(true);
    try {
      const token = await getClientAuth().currentUser?.getIdToken();
      const response = await fetch("/api/orca-swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          slippage,
        }),
      });

      const result: SwapResult = await response.json();
      setSwapResult(result);

      if (result.success) {
        toast.success(result.message);
        setAmount("");
        setQuote(null);
        fetchInternalBalance(); // Refresh balance
      } else {
        toast.error(result.message || "Swap thất bại");
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Có lỗi xảy ra khi swap");
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Swap oUSDC → NVDAX via Orca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">oUSDC Balance</div>
              <div className="text-lg font-semibold">
                {internalBalance.oUSDC.toFixed(2)} oUSDC
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">NVDAX Balance</div>
              <div className="text-lg font-semibold">
                {internalBalance.NVDAX.toFixed(4)} NVDAX
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (oUSDC)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setAmount(internalBalance.oUSDC.toString())}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Slippage Setting */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Slippage Tolerance (%)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.5"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                className="flex-1"
                step="0.1"
                min="0.1"
                max="50"
              />
              <div className="flex gap-1">
                {[0.5, 1.0, 2.0].map((value) => (
                  <Button
                    key={value}
                    variant={slippage === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSlippage(value)}
                  >
                    {value}%
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Quote Button */}
          <Button
            onClick={getQuote}
            disabled={isLoadingQuote || !amount || parseFloat(amount) <= 0}
            className="w-full"
          >
            {isLoadingQuote ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Quote...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Get Quote
              </>
            )}
          </Button>

          {/* Quote Display */}
          {quote && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Exchange Rate</span>
                  <span className="font-medium">
                    1 oUSDC = {quote.exchangeRate.toFixed(6)} NVDAX
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    You will receive
                  </span>
                  <span className="font-semibold text-lg">
                    {quote.toAmount.toFixed(4)} NVDAX
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Slippage</span>
                  <span className="font-medium">{quote.slippage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Gas</span>
                  <span className="font-medium">{quote.estimatedGas} SOL</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Swap Button */}
          <Button
            onClick={executeSwap}
            disabled={
              isSwapping ||
              !quote ||
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > internalBalance.oUSDC
            }
            className="w-full"
            size="lg"
          >
            {isSwapping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Execute Swap
              </>
            )}
          </Button>

          {/* Swap Result */}
          {swapResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                swapResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {swapResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {swapResult.success ? "Swap Successful!" : "Swap Failed"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{swapResult.message}</p>
              {swapResult.transactionHash && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Transaction:</span>
                  <a
                    href={`https://explorer.solana.com/tx/${swapResult.transactionHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {swapResult.transactionHash.slice(0, 8)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">
                  Important Information
                </p>
                <ul className="text-yellow-700 space-y-1">
                  <li>• This swap uses Orca DEX on Solana Devnet</li>
                  <li>• Transaction fees are paid in SOL</li>
                  <li>
                    • Slippage tolerance affects the final amount received
                  </li>
                  <li>• Swaps are executed through your internal wallet</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
