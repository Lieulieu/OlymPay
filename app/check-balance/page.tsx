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

export default function CheckTokenBalancePage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [tokenType, setTokenType] = useState<"oVND" | "oUSDC">("oVND");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckBalance = async () => {
    if (!walletAddress) {
      setError("Vui lòng nhập địa chỉ ví");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/check-token-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          tokenType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Có lỗi xảy ra khi kiểm tra balance");
      }
    } catch (err) {
      setError("Lỗi kết nối: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPhantom = async () => {
    if (
      typeof window !== "undefined" &&
      window.solana &&
      window.solana.isPhantom
    ) {
      try {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
      } catch (err) {
        setError(
          "Không thể kết nối với Phantom wallet: " + (err as Error).message
        );
      }
    } else {
      setError("Phantom wallet không được cài đặt");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Kiểm tra Token Balance</CardTitle>
          <CardDescription>
            Kiểm tra số dư oVND và oUSDC trong ví Phantom
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Địa chỉ ví (Wallet Address)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập địa chỉ ví Solana..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleConnectPhantom}
                variant="outline"
                disabled={loading}
              >
                Connect Phantom
              </Button>
            </div>
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

          <Button
            onClick={handleCheckBalance}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Đang kiểm tra..." : `Kiểm tra ${tokenType} Balance`}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">❌ {error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-medium mb-2">
                ✅ Thông tin Balance
              </h3>
              <div className="space-y-1 text-sm text-green-700">
                <p>
                  <strong>Địa chỉ ví:</strong> {result.walletAddress}
                </p>
                <p>
                  <strong>Loại token:</strong> {result.tokenType}
                </p>
                <p>
                  <strong>Số dư:</strong> {result.balance} {result.tokenType}
                </p>
                <p>
                  <strong>Raw Balance:</strong> {result.rawBalance}
                </p>
                {result.tokenAccount && (
                  <p>
                    <strong>Token Account:</strong> {result.tokenAccount}
                  </p>
                )}
                <p>
                  <strong>Mint Address:</strong> {result.mintAddress}
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
                {result.message && (
                  <p className="text-yellow-600">
                    <strong>Lưu ý:</strong> {result.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">📝 Hướng dẫn sử dụng:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Nhập địa chỉ ví Solana hoặc click "Connect Phantom"</li>
              <li>• Chọn loại token cần kiểm tra: oVND hoặc oUSDC</li>
              <li>• Click "Kiểm tra Balance" để xem số dư</li>
              <li>• Nếu chưa có token account, balance sẽ hiển thị 0</li>
              <li>• Có thể xem chi tiết trên Solana Explorer</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium mb-2">🔧 Token Addresses:</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>
                • <strong>oVND:</strong>{" "}
                EbNKsXtiUQQ972QEF172kRQPhVb6MJpx5NwZ6LX8H69b
              </li>
              <li>
                • <strong>oUSDC:</strong>{" "}
                FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV
              </li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-md">
            <h4 className="font-medium mb-2">💡 Lưu ý:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Balance được hiển thị với 9 decimals</li>
              <li>• Nếu ví chưa có token account, số dư sẽ là 0</li>
              <li>
                • Token account sẽ được tạo tự động khi có giao dịch đầu tiên
              </li>
              <li>• Kiểm tra trên Solana Devnet</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
