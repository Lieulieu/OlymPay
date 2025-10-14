"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CreditCard,
  Building2,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DepositForm from "@/components/DepositForm";
import SolanaDeposit from "@/components/SolanaDeposit";
import { useUserStore } from "@/stores/user-store";
import { getClientAuth } from "@/lib/client/firebase-client";
import { toast } from "sonner";
import { formatBalance } from "@/lib/utils";

export default function DepositPage() {
  const { currentUser } = useUserStore();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"oUSDC" | "oVND">("oUSDC");
  const [source, setSource] = useState<
    "EXTERNAL_WALLET" | "BANK_TRANSFER" | "CREDIT_CARD" | "OVND_SWAP"
  >("EXTERNAL_WALLET");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositResult, setDepositResult] = useState<any>(null);
  const [internalBalance, setInternalBalance] = useState<any>(null);

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
      if (!currentUser?.uid) return;

      const response = await fetch("/api/wallet/internal-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInternalBalance(data);
      }
    } catch (err) {
      console.error("Error fetching internal balance:", err);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!currentUser?.uid) {
      toast.error("Vui lòng kết nối ví trước");
      return;
    }

    setIsDepositing(true);
    setDepositResult(null);

    try {
      const token = await getAuthToken();

      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          source,
          notes: `Deposit ${amount} ${currency} via ${source}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDepositResult(result);
        toast.success(`Nạp thành công ${amount} ${currency}`);
        setAmount("");
        fetchInternalBalance(); // Refresh balance
      } else {
        toast.error(result.error || "Nạp tiền thất bại");
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Có lỗi xảy ra khi nạp tiền");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!currentUser?.uid) {
      toast.error("Vui lòng kết nối ví trước");
      return;
    }

    setIsDepositing(true);

    try {
      const token = await getAuthToken();

      const response = await fetch("/api/exchange/ovnd-to-ousdc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
        }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success(
          `Swap thành công: ${amount} oVND → ${result.oUSDCAmount} oUSDC`
        );
        setAmount("");
        fetchInternalBalance(); // Refresh balance
      } else {
        toast.error(result.error || "Swap thất bại");
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Có lỗi xảy ra khi swap");
    } finally {
      setIsDepositing(false);
    }
  };

  const depositMethods = [
    {
      id: "EXTERNAL_WALLET",
      name: "Ví ngoài",
      description: "Chuyển từ ví Solana khác",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      id: "BANK_TRANSFER",
      name: "Chuyển khoản ngân hàng",
      description: "Chuyển từ tài khoản ngân hàng",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: "CREDIT_CARD",
      name: "Thẻ tín dụng",
      description: "Thanh toán bằng thẻ tín dụng",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: "OVND_SWAP",
      name: "Đổi từ oVND",
      description: "Chuyển đổi từ oVND sang oUSDC",
      icon: <ArrowRightLeft className="h-5 w-5" />,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 mt-22">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nạp tiền</h1>
          <p className="text-gray-600">
            Nạp oUSDC hoặc oVND vào ví nội bộ của bạn
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Số dư hiện tại
              </CardTitle>
              <CardDescription>Số dư trong ví nội bộ của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">oUSDC</p>
                      <p className="text-sm text-green-600">USD Coin</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-800">
                      {internalBalance?.oUSDCBalance
                        ? formatBalance(internalBalance.oUSDCBalance)
                        : "0"}
                    </p>
                    <p className="text-sm text-green-600">oUSDC</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800">oVND</p>
                      <p className="text-sm text-blue-600">Vietnamese Dong</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-800">
                      {internalBalance?.oVNDBalance
                        ? formatBalance(internalBalance.oVNDBalance)
                        : "0"}
                    </p>
                    <p className="text-sm text-blue-600">oVND</p>
                  </div>
                </div>

                <Button
                  onClick={fetchInternalBalance}
                  variant="outline"
                  className="w-full"
                >
                  Làm mới số dư
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Nạp tiền
              </CardTitle>
              <CardDescription>
                Nạp oUSDC hoặc oVND vào ví nội bộ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deposit Result */}
              {depositResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Nạp tiền thành công!</span>
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Số tiền: {amount} {currency}
                    </p>
                    <p>
                      Phương thức:{" "}
                      {depositMethods.find((m) => m.id === source)?.name}
                    </p>
                    <p>ID giao dịch: {depositResult.depositId}</p>
                  </div>
                </motion.div>
              )}

              {!currentUser?.uid ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <p className="text-gray-600 mb-4">
                    Vui lòng kết nối ví để nạp tiền
                  </p>
                </div>
              ) : (
                <>
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Số tiền</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Nhập số tiền"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <Select
                        value={currency}
                        onValueChange={(value: "oUSDC" | "oVND") =>
                          setCurrency(value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oUSDC">oUSDC</SelectItem>
                          <SelectItem value="oVND">oVND</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Deposit Method */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Phương thức nạp tiền
                    </label>
                    <Select
                      value={source}
                      onValueChange={(value: any) => setSource(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {depositMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              {method.icon}
                              <div>
                                <div className="font-medium">{method.name}</div>
                                <div className="text-xs text-gray-500">
                                  {method.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {source === "OVND_SWAP" ? (
                      <Button
                        onClick={handleSwap}
                        disabled={
                          isDepositing || !amount || parseFloat(amount) <= 0
                        }
                        className="w-full"
                      >
                        {isDepositing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Đang swap...
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Swap {amount || "0"} oVND → oUSDC
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleDeposit}
                        disabled={
                          isDepositing || !amount || parseFloat(amount) <= 0
                        }
                        className="w-full"
                      >
                        {isDepositing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Đang nạp tiền...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Nạp {amount || "0"} {currency}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Giao dịch sẽ được xử lý ngay lập tức</p>
                    <p>• Phí giao dịch: 0% (miễn phí)</p>
                    <p>• Số tiền sẽ được cộng vào ví nội bộ của bạn</p>
                    {source === "OVND_SWAP" && (
                      <p>• Tỷ giá: 1 oUSDC = 25,000 oVND</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Solana Devnet Deposit */}
        <div className="mt-8">
          <SolanaDeposit onDepositSuccess={fetchInternalBalance} />
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Hành động nhanh</CardTitle>
            <CardDescription>Các hành động nhanh để quản lý ví</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => window.open("/rwa-market", "_blank")}
                className="h-20 flex flex-col gap-2"
              >
                <Building2 className="h-6 w-6" />
                <span>RWA Market</span>
                <span className="text-xs text-gray-500">Mua RWA assets</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open("/portfolio", "_blank")}
                className="h-20 flex flex-col gap-2"
              >
                <TrendingUp className="h-6 w-6" />
                <span>Portfolio</span>
                <span className="text-xs text-gray-500">Xem holdings</span>
              </Button>

              <Button
                variant="outline"
                onClick={fetchInternalBalance}
                className="h-20 flex flex-col gap-2"
              >
                <Wallet className="h-6 w-6" />
                <span>Refresh Balance</span>
                <span className="text-xs text-gray-500">Cập nhật số dư</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </main>
  );
}
