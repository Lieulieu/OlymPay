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
import { useUserStore } from "@/stores/user-store";
import { getClientAuth } from "@/lib/client/firebase-client";
import { toast } from "sonner";

interface DepositFormProps {
  onDepositSuccess?: () => void;
}

export default function DepositForm({ onDepositSuccess }: DepositFormProps) {
  const { currentUser } = useUserStore();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"oUSDC" | "oVND">("oUSDC");
  const [source, setSource] = useState<
    "EXTERNAL_WALLET" | "BANK_TRANSFER" | "CREDIT_CARD" | "OVND_SWAP"
  >("EXTERNAL_WALLET");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositResult, setDepositResult] = useState<any>(null);

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
        onDepositSuccess?.();
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

  if (!currentUser?.uid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Nạp tiền
          </CardTitle>
          <CardDescription>Nạp oUSDC hoặc oVND vào ví nội bộ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-gray-600 mb-4">
              Vui lòng kết nối ví để nạp tiền
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
          <DollarSign className="h-5 w-5" />
          Nạp tiền
        </CardTitle>
        <CardDescription>Nạp oUSDC hoặc oVND vào ví nội bộ</CardDescription>
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
                Phương thức: {depositMethods.find((m) => m.id === source)?.name}
              </p>
              <p>ID giao dịch: {depositResult.depositId}</p>
            </div>
          </motion.div>
        )}

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
              onValueChange={(value: "oUSDC" | "oVND") => setCurrency(value)}
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
          <label className="text-sm font-medium">Phương thức nạp tiền</label>
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

        {/* Deposit Button */}
        <Button
          onClick={handleDeposit}
          disabled={isDepositing || !amount || parseFloat(amount) <= 0}
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

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Giao dịch sẽ được xử lý ngay lập tức</p>
          <p>• Phí giao dịch: 0% (miễn phí)</p>
          <p>• Số tiền sẽ được cộng vào ví nội bộ của bạn</p>
        </div>
      </CardContent>
    </Card>
  );
}
