"use client";

import { useState } from "react";
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

export default function ManagerMintTestPage() {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState<"oVND" | "oUSDC">("oVND");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    if (!toAddress || !amount) {
      setError("Vui lòng nhập địa chỉ đích và số lượng");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/manager-mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toAddress,
          amount: parseFloat(amount),
          tokenType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Có lỗi xảy ra khi mint token");
      }
    } catch (err) {
      setError("Lỗi kết nối: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🏦 Test Manager Wallet Minting</CardTitle>
          <CardDescription>
            Mint token từ ví manager tới địa chỉ khác
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Địa chỉ đích (Destination Address)
            </label>
            <Input
              placeholder="Nhập địa chỉ Solana đích..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Loại token</label>
            <Select
              value={tokenType}
              onValueChange={(value: "oVND" | "oUSDC") => setTokenType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oVND">oVND</SelectItem>
                <SelectItem value="oUSDC">oUSDC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Số lượng ({tokenType})
            </label>
            <Input
              type="number"
              placeholder="Nhập số lượng token..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button onClick={handleMint} disabled={loading} className="w-full">
            {loading ? "Đang mint..." : `Mint ${tokenType} từ Manager Wallet`}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">❌ {error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-medium mb-2">
                ✅ Mint thành công!
              </h3>
              <div className="space-y-1 text-sm text-green-700">
                <p>
                  <strong>Transaction Hash:</strong> {result.txHash}
                </p>
                <p>
                  <strong>Từ địa chỉ:</strong> {result.fromAddress}
                </p>
                <p>
                  <strong>Đến địa chỉ:</strong> {result.toAddress}
                </p>
                <p>
                  <strong>Số lượng:</strong> {result.amount} {result.tokenType}
                </p>
                {result.explorerUrl && (
                  <p>
                    <strong>Explorer:</strong>{" "}
                    <a
                      href={result.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Xem trên Solana Explorer
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">📝 Hướng dẫn sử dụng:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Nhập địa chỉ Solana hợp lệ làm địa chỉ đích</li>
              <li>• Chọn loại token: oVND hoặc oUSDC</li>
              <li>• Nhập số lượng token cần mint</li>
              <li>• Click "Mint" để thực hiện minting từ manager wallet</li>
              <li>• API sẽ tự động tạo token account nếu chưa tồn tại</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium mb-2">
              🔧 Environment Variables cần thiết:
            </h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>
                • <code>OUSDC_TOKEN</code> - Hex string của manager wallet
              </li>
              <li>
                • <code>OUSDC_MANAGER_WALLET_KEYPAIR_BASE64</code> - JSON array
                của treasury wallet
              </li>
              <li>
                • <code>USE_REAL_SOLANA_MINTING=true</code> - Để sử dụng real
                minting
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
