"use client";

import { useState, useEffect } from "react";
import SwapDemo from "@/components/SwapDemo";

export default function SwapTestPage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate getting auth token and user address
    // In a real app, this would come from your auth system
    const mockAuthToken = "mock-auth-token";
    const mockUserAddress = "11111111111111111111111111111111";

    setAuthToken(mockAuthToken);
    setUserAddress(mockUserAddress);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <SwapDemo
          userAddress={userAddress || undefined}
          authToken={authToken || undefined}
        />

        {/* API Documentation */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">API Documentation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  POST /api/swap/ovnd-to-usd
                </h3>
                <p className="text-gray-600 mb-2">
                  Thực hiện swap từ oVND sang oUSD
                </p>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <pre>{`{
  "amount": 1000,
  "slippage": 0.5
}`}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  GET /api/swap/ovnd-to-usd
                </h3>
                <p className="text-gray-600 mb-2">Lấy quote cho swap</p>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <pre>{`?amount=1000&slippage=0.5`}</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  GET /api/swap/rate
                </h3>
                <p className="text-gray-600 mb-2">Lấy tỷ giá hiện tại</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  GET /api/swap/history
                </h3>
                <p className="text-gray-600 mb-2">Lấy lịch sử swap của user</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  GET /api/swap/balance
                </h3>
                <p className="text-gray-600 mb-2">
                  Kiểm tra số dư oVND và oUSD
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
