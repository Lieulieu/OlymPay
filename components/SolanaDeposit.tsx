"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/stores/user-store";
import { getClientAuth } from "@/lib/client/firebase-client";
import { toast } from "sonner";
import { formatBalance } from "@/lib/utils";

interface SolanaDepositProps {
  onDepositSuccess?: () => void;
}

export default function SolanaDeposit({
  onDepositSuccess,
}: SolanaDepositProps) {
  const { currentUser } = useUserStore();
  const [amount, setAmount] = useState("");
  const [fromWallet, setFromWallet] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [depositResult, setDepositResult] = useState<any>(null);
  const [step, setStep] = useState<"input" | "sign" | "complete">("input");

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

  const createDepositTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!fromWallet) {
      toast.error("Vui lòng nhập địa chỉ ví nguồn");
      return;
    }

    if (!currentUser?.uid) {
      toast.error("Vui lòng kết nối ví trước");
      return;
    }

    setIsCreating(true);
    setTransactionData(null);
    setDepositResult(null);

    try {
      const token = await getAuthToken();

      const response = await fetch("/api/wallet/solana-deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          fromWalletAddress: fromWallet,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTransactionData(result);
        setStep("sign");
        toast.success("Transaction đã được tạo. Vui lòng ký transaction.");
      } else {
        toast.error(result.error || "Tạo transaction thất bại");
      }
    } catch (error) {
      console.error("Create transaction error:", error);
      toast.error("Có lỗi xảy ra khi tạo transaction");
    } finally {
      setIsCreating(false);
    }
  };

  const signAndSendTransaction = async () => {
    if (!transactionData) {
      toast.error("Không có transaction để ký");
      return;
    }

    try {
      // Check if Phantom wallet is available
      if (!window.solana || !window.solana.isPhantom) {
        toast.error("Vui lòng cài đặt Phantom wallet");
        return;
      }

      // Connect to Phantom wallet
      const response = await window.solana.connect();
      const wallet = response.publicKey.toString();

      if (wallet !== fromWallet) {
        toast.error("Ví đã kết nối không khớp với địa chỉ ví nguồn");
        return;
      }

      // Deserialize transaction
      const transactionBuffer = Buffer.from(
        transactionData.transaction,
        "base64"
      );
      const { Transaction } = await import("@solana/web3.js");
      const transaction = Transaction.from(transactionBuffer);

      // Sign and send transaction
      const signedTransaction = await (
        window.solana as any
      ).signAndSendTransaction(transaction);

      toast.success("Transaction đã được gửi thành công!");

      // Complete the deposit
      await completeDeposit(signedTransaction.signature);
    } catch (error) {
      console.error("Sign transaction error:", error);
      toast.error("Có lỗi xảy ra khi ký transaction");
    }
  };

  const completeDeposit = async (transactionSignature: string) => {
    setIsCompleting(true);

    try {
      const token = await getAuthToken();

      const response = await fetch("/api/wallet/solana-deposit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionSignature,
          amount: parseFloat(amount),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDepositResult(result);
        setStep("complete");
        toast.success(`Nạp thành công ${amount} oUSDC từ Solana devnet!`);
        onDepositSuccess?.();
      } else {
        toast.error(result.error || "Hoàn thành nạp tiền thất bại");
      }
    } catch (error) {
      console.error("Complete deposit error:", error);
      toast.error("Có lỗi xảy ra khi hoàn thành nạp tiền");
    } finally {
      setIsCompleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã copy vào clipboard");
  };

  const resetForm = () => {
    setAmount("");
    setFromWallet("");
    setTransactionData(null);
    setDepositResult(null);
    setStep("input");
  };

  if (!currentUser?.uid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Nạp oUSDC từ Solana Devnet
          </CardTitle>
          <CardDescription>Nạp oUSDC thật từ ví Solana devnet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-gray-600 mb-4">
              Vui lòng kết nối ví để nạp oUSDC từ Solana devnet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Nạp oUSDC từ Solana Devnet
        </CardTitle>
        <CardDescription>
          Nạp oUSDC thật từ ví Solana devnet vào ví nội bộ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              step === "input"
                ? "bg-blue-100 text-blue-800"
                : step === "sign"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "input"
                  ? "bg-blue-500 text-white"
                  : step === "sign"
                  ? "bg-yellow-500 text-white"
                  : "bg-green-500 text-white"
              }`}
            >
              {step === "input" ? "1" : step === "sign" ? "2" : "3"}
            </div>
            <span className="text-sm font-medium">
              {step === "input"
                ? "Nhập thông tin"
                : step === "sign"
                ? "Ký transaction"
                : "Hoàn thành"}
            </span>
          </div>
        </div>

        {/* Input Step */}
        {step === "input" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Số tiền oUSDC</label>
              <Input
                type="number"
                placeholder="Nhập số tiền oUSDC"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Địa chỉ ví nguồn (Solana Devnet)
              </label>
              <Input
                placeholder="Nhập địa chỉ ví Solana devnet"
                value={fromWallet}
                onChange={(e) => setFromWallet(e.target.value)}
              />
            </div>

            <Button
              onClick={createDepositTransaction}
              disabled={isCreating || !amount || !fromWallet}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo transaction...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Tạo Transaction
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Sign Step */}
        {step === "sign" && transactionData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                Transaction Details
              </h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Từ ví:</span>
                  <span className="font-mono">
                    {transactionData.fromWallet.slice(0, 8)}...
                    {transactionData.fromWallet.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Đến ví:</span>
                  <span className="font-mono">
                    {transactionData.toWallet.slice(0, 8)}...
                    {transactionData.toWallet.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Số tiền:</span>
                  <span className="font-semibold">
                    {transactionData.amount} oUSDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Token:</span>
                  <span className="font-mono">
                    {transactionData.mintAddress.slice(0, 8)}...
                    {transactionData.mintAddress.slice(-8)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={signAndSendTransaction}
                disabled={isCompleting}
                className="w-full"
              >
                {isCompleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang ký và gửi...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Ký và Gửi Transaction
                  </>
                )}
              </Button>

              <Button onClick={resetForm} variant="outline" className="w-full">
                Hủy và Quay lại
              </Button>
            </div>
          </motion.div>
        )}

        {/* Complete Step */}
        {step === "complete" && depositResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Nạp tiền thành công!</span>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Số tiền:</span>
                  <span className="font-semibold">{amount} oUSDC</span>
                </div>
                <div className="flex justify-between">
                  <span>Số dư mới:</span>
                  <span className="font-semibold">
                    {formatBalance(depositResult.newBalance)} oUSDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction Hash:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">
                      {depositResult.transactionSignature.slice(0, 8)}...
                      {depositResult.transactionSignature.slice(-8)}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(depositResult.transactionSignature)
                      }
                      className="text-green-600 hover:text-green-800"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() =>
                  window.open(
                    `https://explorer.solana.com/tx/${depositResult.transactionSignature}?cluster=devnet`,
                    "_blank"
                  )
                }
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Xem trên Explorer
              </Button>
              <Button onClick={resetForm} className="flex-1">
                Nạp thêm
              </Button>
            </div>
          </motion.div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Cần có oUSDC trong ví Solana devnet</p>
          <p>• Transaction sẽ được gửi trên Solana devnet</p>
          <p>• Phí gas sẽ được trừ từ ví nguồn</p>
          <p>• Số tiền sẽ được cộng vào ví nội bộ sau khi confirm</p>
        </div>
      </CardContent>
    </Card>
  );
}
