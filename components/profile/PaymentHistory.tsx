"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/stores/user-store";
import { StripePaymentInfo } from "@/types/payment";
import {
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BanknotesIcon,
  WalletIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { formatBalance, formatDate } from "@/lib/utils";

interface PaymentHistoryProps {
  className?: string;
}

export default function PaymentHistory({
  className = "",
}: PaymentHistoryProps) {
  const { currentUser } = useUserStore();

  const [payments, setPayments] = useState<StripePaymentInfo[]>([]);
  const [stats, setStats] = useState<{
    totalPayments: number;
    totalAmount: number;
    totalTokens: number;
    lastPaymentDate?: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchPaymentHistory = async (pageNum: number = 1) => {
    // Use currentUser's external wallet address, fallback to hardcoded address for testing
    const walletAddress =
      currentUser?.externalWallet ||
      "37sB7rXbnMzokX2V61KjXnv28fsMiqTidyBcM6CpauvD";

    if (!walletAddress) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 [PAYMENT-HISTORY] Fetching payment history...");
      console.log(`  - Wallet Address: ${walletAddress}`);

      const response = await fetch(
        `/api/payment-history?userId=${walletAddress}&page=${pageNum}&limit=10`
      );

      console.log(`📊 [PAYMENT-HISTORY] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }

      const data = await response.json();

      console.log("📋 [PAYMENT-HISTORY] Response data:", data);

      if (data.success) {
        if (pageNum === 1) {
          setPayments(data.data.payments);
        } else {
          setPayments((prev) => [...prev, ...data.data.payments]);
        }
        setHasMore(data.data.hasMore);
        setPage(pageNum);
      } else {
        throw new Error(data.error || "Failed to fetch payment history");
      }
    } catch (err) {
      console.error(
        "❌ [PAYMENT-HISTORY] Error fetching payment history:",
        err
      );
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    // Use currentUser's external wallet address, fallback to hardcoded address for testing
    const walletAddress =
      currentUser?.externalWallet ||
      "37sB7rXbnMzokX2V61KjXnv28fsMiqTidyBcM6CpauvD";

    if (!walletAddress) return;

    try {
      console.log("📊 [PAYMENT-STATS] Fetching payment stats...");
      console.log(`  - Wallet Address: ${walletAddress}`);

      const response = await fetch("/api/payment-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: walletAddress,
        }),
      });

      console.log(`📊 [PAYMENT-STATS] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error("Failed to fetch payment stats");
      }

      const data = await response.json();

      console.log("📋 [PAYMENT-STATS] Response data:", data);

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("❌ [PAYMENT-STATS] Error fetching payment stats:", err);
    }
  };

  useEffect(() => {
    // Always fetch data, even if currentUser is not available (use hardcoded address)
    fetchPaymentHistory(1);
    fetchPaymentStats();
  }, [currentUser]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPaymentHistory(page + 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPaymentHistory(1), fetchPaymentStats()]);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "processing":
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "processing":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (!currentUser) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <WalletIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Please sign in to view payment history</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Statistics */}
      {/* {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPayments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatBalance(stats.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTokens.toLocaleString()} oUSDC
                </p>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Payment History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Payment History
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your Stripe payment transactions and token minting history
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-outline btn-sm gap-2"
              title="Refresh payment history"
            >
              {refreshing ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowPathIcon className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && payments.length === 0 ? (
            <div className="text-center py-8">
              <ArrowPathIcon className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-500">Loading payment history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircleIcon className="h-8 w-8 mx-auto mb-4 text-red-400" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => fetchPaymentHistory(1)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCardIcon className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No payment history found</p>
              <p className="text-sm text-gray-400 mt-2">
                Your Stripe payment transactions will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Tokens</th>
                    <th>Date</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.paymentIntentId} className="hover">
                      <td>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(payment.status)}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              payment.status
                            )}`}
                          ></span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatBalance(payment.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.currency.toUpperCase()}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.tokenAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.tokenType}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-gray-900">
                            {formatDate(payment.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td>
                        {payment.transactionHash ? (
                          <div>
                            <p className="text-xs text-gray-500 font-mono">
                              {payment.transactionHash.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-gray-400">
                              {payment.transactionId}
                            </p>
                            <a
                              href={`https://explorer.solana.com/tx/${payment.transactionHash}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary text-xs"
                            >
                              View on Explorer
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            {payment.transactionId}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 inline mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
