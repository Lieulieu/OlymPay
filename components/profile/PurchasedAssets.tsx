"use client";

import { useEffect, useState } from "react";
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { money } from "@/utils/wallet";
import { formatBalance } from "@/lib/utils";
import { getClientAuth } from "@/lib/client/firebase-client";

interface RWAHolding {
  id: string;
  userId: string;
  assetId: string;
  assetName: string;
  issuer: string;
  quantity: number;
  averagePrice: number;
  totalValue: number;
  currency: string;
  purchaseDate: string;
  lastUpdated: string;
  status: string;
}

interface HoldingsResponse {
  success: boolean;
  holdings: RWAHolding[];
  totalHoldings: number;
  totalValue: number;
  error?: string;
}

export default function PurchasedAssets() {
  const [holdings, setHoldings] = useState<RWAHolding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getClientAuth().currentUser?.getIdToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/rwa/holdings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: HoldingsResponse = await response.json();

      if (data.success) {
        setHoldings(data.holdings);
        setTotalValue(data.totalValue);
      } else {
        throw new Error(data.error || "Failed to fetch holdings");
      }
    } catch (err) {
      console.error("Error fetching holdings:", err);
      setError(err instanceof Error ? err.message : "Failed to load assets");
      toast.error("Failed to load purchased assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const getAssetIcon = (assetId: string) => {
    if (assetId.includes("tbill")) {
      return <BuildingOfficeIcon className="h-6 w-6 text-blue-500" />;
    }
    if (assetId.includes("reit")) {
      return <ChartBarIcon className="h-6 w-6 text-green-500" />;
    }
    if (assetId.includes("gold")) {
      return <CurrencyDollarIcon className="h-6 w-6 text-yellow-500" />;
    }
    return <BuildingOfficeIcon className="h-6 w-6 text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDaysHeld = (purchaseDate: string) => {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchase.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <ProfileSection
        title="Purchased Assets"
        actions={
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchHoldings}
            disabled={loading}
          >
            <span className="loading loading-spinner loading-xs" />
            Refresh
          </button>
        }
      >
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-base-300 rounded w-1/4 mb-2"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-base-300 bg-base-100 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-base-300 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-base-300 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-base-300 rounded w-1/4"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-base-300 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-base-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProfileSection>
    );
  }

  if (error) {
    return (
      <ProfileSection
        title="Purchased Assets"
        actions={
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchHoldings}
            disabled={loading}
          >
            Retry
          </button>
        }
      >
        <div className="text-center py-8">
          <div className="text-error mb-2">Failed to load assets</div>
          <p className="text-sm text-base-content/70 mb-4">{error}</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={fetchHoldings}
            disabled={loading}
          >
            Try Again
          </button>
        </div>
      </ProfileSection>
    );
  }

  if (holdings.length === 0) {
    return (
      <ProfileSection
        title="Purchased Assets"
        actions={
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchHoldings}
            disabled={loading}
          >
            Refresh
          </button>
        }
      >
        <div className="text-center py-8">
          <BuildingOfficeIcon className="h-12 w-12 text-base-content/30 mx-auto mb-4" />
          <div className="text-base-content/70 mb-2">
            No assets purchased yet
          </div>
          <p className="text-sm text-base-content/50">
            Visit the RWA marketplace to start investing in real-world assets
          </p>
        </div>
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title="Purchased Assets"
      actions={
        <div className="flex items-center gap-2">
          <div className="text-sm text-base-content/70">
            Total Value: {money(totalValue)} {holdings[0]?.currency || "oUSDC"}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchHoldings}
            disabled={loading}
          >
            <span className="loading loading-spinner loading-xs" />
            Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {holdings.map((holding) => (
          <article
            key={holding.id}
            className="rounded-xl border border-base-300 bg-base-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              {/* Asset Icon */}
              <div className="shrink-0">{getAssetIcon(holding.assetId)}</div>

              {/* Asset Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {holding.assetName}
                    </h3>
                    <p className="text-sm text-base-content/70">
                      {holding.issuer}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-base-content/60">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>
                          Held {calculateDaysHeld(holding.purchaseDate)} days
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-3 w-3" />
                        <span>
                          Avg: {money(holding.averagePrice)} {holding.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Value Info */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-semibold">
                      {money(holding.totalValue)} {holding.currency}
                    </div>
                    <div className="text-sm text-base-content/70">
                      {formatBalance(holding.quantity)} units
                    </div>
                    <div className="text-xs text-base-content/50 mt-1">
                      Purchased {formatDate(holding.purchaseDate)}
                    </div>
                  </div>
                </div>

                {/* Asset Details */}
                <div className="mt-3 pt-3 border-t border-base-300">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-base-content/60">Asset ID:</span>
                      <div className="font-mono text-xs">{holding.assetId}</div>
                    </div>
                    <div>
                      <span className="text-base-content/60">Status:</span>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            holding.status === "ACTIVE"
                              ? "bg-success"
                              : "bg-warning"
                          }`}
                        />
                        <span className="capitalize">{holding.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Portfolio Summary */}
      <div className="mt-6 pt-4 border-t border-base-300">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-base-content/60">Total Assets</div>
            <div className="text-lg font-semibold">{holdings.length}</div>
          </div>
          <div className="text-center">
            <div className="text-base-content/60">Portfolio Value</div>
            <div className="text-lg font-semibold">
              {money(totalValue)} {holdings[0]?.currency || "oUSDC"}
            </div>
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
