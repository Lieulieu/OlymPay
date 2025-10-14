"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/stores/user-store";
import { getClientAuth } from "@/lib/client/firebase-client";

export default function PortfolioDebug() {
  const { currentUser } = useUserStore();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const runDebug = async () => {
    if (!currentUser?.uid) {
      setError("Please connect wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      const token = await getAuthToken();

      const response = await fetch("/api/debug/portfolio", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setDebugInfo(result.debug);
      } else {
        setError(result.error || "Debug failed");
      }
    } catch (err) {
      console.error("Debug error:", err);
      setError(err instanceof Error ? err.message : "Debug failed");
    } finally {
      setIsLoading(false);
    }
  };

  const testPortfolioAPIs = async () => {
    if (!currentUser?.uid) {
      setError("Please connect wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();

      // Test both APIs
      const [transactionsRes, depositsRes] = await Promise.all([
        fetch("/api/rwa/transactions", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/wallet/deposit", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const transactionsData = await transactionsRes.json();
      const depositsData = await depositsRes.json();

      console.log("Transactions API response:", transactionsData);
      console.log("Deposits API response:", depositsData);

      setDebugInfo({
        transactionsAPI: {
          status: transactionsRes.status,
          ok: transactionsRes.ok,
          data: transactionsData,
        },
        depositsAPI: {
          status: depositsRes.status,
          ok: depositsRes.ok,
          data: depositsData,
        },
      });
    } catch (err) {
      console.error("API test error:", err);
      setError(err instanceof Error ? err.message : "API test failed");
    } finally {
      setIsLoading(false);
    }
  };

  const createSampleData = async () => {
    if (!currentUser?.uid) {
      setError("Please connect wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();

      const response = await fetch("/api/debug/create-sample-data", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setDebugInfo({
          sampleDataCreated: true,
          data: result.data,
        });
      } else {
        setError(result.error || "Failed to create sample data");
      }
    } catch (err) {
      console.error("Create sample data error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create sample data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser?.uid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Debug</CardTitle>
          <CardDescription>Debug portfolio data fetching</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Please connect wallet to debug portfolio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Debug</CardTitle>
        <CardDescription>
          Debug portfolio data fetching for user: {currentUser.uid.slice(0, 8)}
          ...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDebug} disabled={isLoading}>
            {isLoading ? "Debugging..." : "Run Debug"}
          </Button>
          <Button
            onClick={testPortfolioAPIs}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "Testing..." : "Test APIs"}
          </Button>
          <Button
            onClick={createSampleData}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? "Creating..." : "Create Sample Data"}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-semibold mb-2">Debug Results:</p>
            <pre className="text-sm text-blue-700 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
