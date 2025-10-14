"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PoolInfo {
  address: string;
  tokenMintA: string;
  tokenMintB: string;
  tokenVaultA: string;
  tokenVaultB: string;
  tickSpacing: number;
  feeRate: number;
  protocolFeeRate: number;
  liquidity: string;
  sqrtPrice: string;
  tickCurrentIndex: number;
}

export default function OrcaPoolTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testPoolConnection = async () => {
    setIsLoading(true);
    setError(null);
    setPoolInfo(null);

    try {
      const response = await fetch("/api/orca-pool-info");
      const data = await response.json();

      if (data.success) {
        setPoolInfo(data.poolInfo);
        toast.success("Whirlpool found successfully!");
      } else {
        setError(data.error || "Failed to find whirlpool");
        toast.error(data.error || "Failed to find whirlpool");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSwapQuote = async () => {
    if (!poolInfo) {
      toast.error("No pool info available");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/orca-swap?amount=100&slippage=0.5");
      const data = await response.json();

      if (data.success) {
        toast.success(
          `Quote: 100 oUSDC → ${data.quote.toAmount.toFixed(4)} NVDAX`
        );
        console.log("Quote data:", data.quote);
      } else {
        toast.error(data.error || "Failed to get quote");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Quote error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Orca Integration Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={testPoolConnection}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Pool Connection"
              )}
            </Button>

            <Button
              onClick={testSwapQuote}
              disabled={isLoading || !poolInfo}
              variant="outline"
              className="flex-1"
            >
              Test Swap Quote
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {poolInfo && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Pool Found!</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Pool Address:</span>
                    <div className="font-mono text-xs break-all">
                      {poolInfo.address}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Tick Spacing:</span>
                    <div>{poolInfo.tickSpacing}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Token Mint A:</span>
                    <div className="font-mono text-xs break-all">
                      {poolInfo.tokenMintA}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Token Mint B:</span>
                    <div className="font-mono text-xs break-all">
                      {poolInfo.tokenMintB}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Fee Rate:</span>
                    <div>{poolInfo.feeRate}</div>
                  </div>
                  <div>
                    <span className="font-medium">Protocol Fee:</span>
                    <div>{poolInfo.protocolFeeRate}</div>
                  </div>
                </div>

                <div>
                  <span className="font-medium">Liquidity:</span>
                  <div className="font-mono text-xs">{poolInfo.liquidity}</div>
                </div>

                <div>
                  <span className="font-medium">Current Tick:</span>
                  <div>{poolInfo.tickCurrentIndex}</div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">
              Test Instructions:
            </h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>
                Click "Test Pool Connection" to find oUSDC/NVDAX whirlpool
              </li>
              <li>If pool is found, click "Test Swap Quote" to get a quote</li>
              <li>Check console for detailed logs</li>
              <li>If no pool is found, the tokens might not exist on devnet</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
