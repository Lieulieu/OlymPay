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

export default function DebugMintIssuePage() {
  const [walletAddress, setWalletAddress] = useState(
    "37sB7rXbnMzokX2V61KjXnv28fsMiqTidyBcM6CpauvD"
  );
  const [tokenType, setTokenType] = useState<"oVND" | "oUSDC">("oUSDC");
  const [loading, setLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    if (!walletAddress) {
      setError("Vui lòng nhập địa chỉ ví");
      return;
    }

    setLoading(true);
    setError(null);
    setDebugResults(null);

    try {
      // Step 1: Check environment
      const envResponse = await fetch("/api/debug/env-check");
      const envData = await envResponse.json();

      // Step 2: Check initial balance
      const initialBalanceResponse = await fetch("/api/check-token-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, tokenType }),
      });
      const initialBalance = await initialBalanceResponse.json();

      // Step 3: Attempt to mint
      const mintResponse = await fetch("/api/manager-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress: walletAddress,
          amount: 100,
          tokenType,
        }),
      });
      const mintResult = await mintResponse.json();

      // Step 4: Wait and check final balance
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const finalBalanceResponse = await fetch("/api/check-token-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, tokenType }),
      });
      const finalBalance = await finalBalanceResponse.json();

      // Compile results
      const results = {
        environment: envData,
        initialBalance,
        mintResult,
        finalBalance,
        balanceChange: finalBalance.balance - initialBalance.balance,
        isMockTransaction:
          mintResult.txHash && mintResult.txHash.startsWith("manager_mock_"),
      };

      setDebugResults(results);
    } catch (err) {
      setError("Lỗi debug: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Mint Issue</CardTitle>
          <CardDescription>
            Kiểm tra tại sao mint thành công nhưng balance vẫn là 0
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Địa chỉ ví</label>
              <Input
                placeholder="Nhập địa chỉ ví..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
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
          </div>

          <Button onClick={runDebug} disabled={loading} className="w-full">
            {loading ? "Đang debug..." : "Chạy Debug"}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">❌ {error}</p>
            </div>
          )}

          {debugResults && (
            <div className="space-y-4">
              {/* Environment Check */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-blue-800 font-medium mb-2">
                  🔧 Environment Check
                </h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    <strong>Minting Mode:</strong>{" "}
                    {debugResults.environment.mintingMode}
                  </p>
                  <p>
                    <strong>Can Mint:</strong>{" "}
                    {debugResults.environment.canMint ? "✅ Yes" : "❌ No"}
                  </p>
                  <p>
                    <strong>NODE_ENV:</strong>{" "}
                    {debugResults.environment.environment.NODE_ENV}
                  </p>
                  <p>
                    <strong>USE_REAL_SOLANA_MINTING:</strong>{" "}
                    {
                      debugResults.environment.environment
                        .USE_REAL_SOLANA_MINTING
                    }
                  </p>
                  <p>
                    <strong>Manager Keypair:</strong>{" "}
                    {debugResults.environment.environment.OUSDC_TOKEN ===
                      "SET" ||
                    debugResults.environment.environment
                      .OUSDC_MANAGER_WALLET_KEYPAIR_BASE64 === "SET"
                      ? "✅ Set"
                      : "❌ Not Set"}
                  </p>
                </div>
              </div>

              {/* Balance Check */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-green-800 font-medium mb-2">
                  💰 Balance Check
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>Initial Balance:</strong>{" "}
                    {debugResults.initialBalance.balance} {tokenType}
                  </p>
                  <p>
                    <strong>Final Balance:</strong>{" "}
                    {debugResults.finalBalance.balance} {tokenType}
                  </p>
                  <p>
                    <strong>Balance Change:</strong>{" "}
                    {debugResults.balanceChange > 0 ? "+" : ""}
                    {debugResults.balanceChange} {tokenType}
                  </p>
                </div>
              </div>

              {/* Mint Result */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="text-yellow-800 font-medium mb-2">
                  🏦 Mint Result
                </h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>
                    <strong>Success:</strong>{" "}
                    {debugResults.mintResult.success ? "✅ Yes" : "❌ No"}
                  </p>
                  <p>
                    <strong>Transaction Hash:</strong>{" "}
                    {debugResults.mintResult.txHash}
                  </p>
                  <p>
                    <strong>From Address:</strong>{" "}
                    {debugResults.mintResult.fromAddress}
                  </p>
                  <p>
                    <strong>Amount:</strong> {debugResults.mintResult.amount}{" "}
                    {debugResults.mintResult.tokenType}
                  </p>
                  {debugResults.mintResult.explorerUrl && (
                    <p>
                      <strong>Explorer:</strong>{" "}
                      <a
                        href={debugResults.mintResult.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Transaction
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                <h3 className="text-purple-800 font-medium mb-2">
                  🔍 Diagnosis
                </h3>
                <div className="text-sm text-purple-700 space-y-1">
                  {debugResults.isMockTransaction ? (
                    <>
                      <p className="text-orange-600">
                        <strong>⚠️ MOCK TRANSACTION DETECTED</strong>
                      </p>
                      <p>
                        Transaction hash starts with "manager_mock_" - this is a
                        mock transaction
                      </p>
                      <p>
                        Mock transactions don't actually mint tokens on the
                        blockchain
                      </p>
                    </>
                  ) : debugResults.balanceChange > 0 ? (
                    <>
                      <p className="text-green-600">
                        <strong>✅ SUCCESS</strong>
                      </p>
                      <p>
                        Balance increased by {debugResults.balanceChange}{" "}
                        {tokenType}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-600">
                        <strong>❌ ISSUE DETECTED</strong>
                      </p>
                      <p>Real transaction but no balance change</p>
                      <p>Possible causes:</p>
                      <ul className="list-disc list-inside ml-4">
                        <li>Manager wallet doesn't have mint authority</li>
                        <li>Token account creation failed</li>
                        <li>Transaction failed but reported success</li>
                        <li>Wrong token mint address</li>
                        <li>Insufficient SOL for transaction fees</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {debugResults.environment.recommendations &&
                debugResults.environment.recommendations.length > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <h3 className="text-gray-800 font-medium mb-2">
                      💡 Recommendations
                    </h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      {debugResults.environment.recommendations.map(
                        (rec: string, index: number) => (
                          <p key={index}>{rec}</p>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">📝 Common Issues:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>Mock Mode:</strong> Đang chạy ở mock mode - không mint
                token thật
              </li>
              <li>
                • <strong>Missing Keypair:</strong> Thiếu manager wallet keypair
              </li>
              <li>
                • <strong>No Mint Authority:</strong> Manager wallet không có
                quyền mint
              </li>
              <li>
                • <strong>Wrong Network:</strong> Đang dùng sai network (mainnet
                vs devnet)
              </li>
              <li>
                • <strong>Insufficient SOL:</strong> Không đủ SOL để trả phí
                transaction
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
