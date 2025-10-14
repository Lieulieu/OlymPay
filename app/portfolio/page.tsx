"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUserStore } from "@/stores/user-store";
import { getClientAuth } from "@/lib/client/firebase-client";
import { formatBalance, formatDate } from "@/lib/utils";
import {
  RWAHolding,
  RWATransaction,
  DepositTransaction,
  PortfolioSummary,
} from "@/types/rwa";

export default function PortfolioPage() {
  const { currentUser } = useUserStore();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<RWATransaction[]>([]);
  const [deposits, setDeposits] = useState<DepositTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchPortfolioData = async () => {
    try {
      if (!currentUser?.uid) {
        console.log("User not authenticated, skipping portfolio fetch");
        return;
      }

      setIsLoading(true);
      setError(null);

      const token = await getAuthToken();

      // Fetch transactions and holdings
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

      if (!transactionsRes.ok || !depositsRes.ok) {
        throw new Error("Failed to fetch portfolio data");
      }

      const transactionsData = await transactionsRes.json();
      const depositsData = await depositsRes.json();

      setTransactions(transactionsData.transactions || []);
      setDeposits(depositsData.deposits || []);

      // Calculate portfolio summary
      const holdings = transactionsData.holdings || [];
      const totalInvested = holdings.reduce(
        (sum: number, holding: RWAHolding) => sum + holding.totalValue,
        0
      );
      const totalValue = holdings.reduce((sum: number, holding: RWAHolding) => {
        // Mock: assume 5% gain on average
        return sum + holding.totalValue * 1.05;
      }, 0);
      const totalGains = totalValue - totalInvested;
      const totalGainsPercentage =
        totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

      // Calculate asset distribution
      const assetDistribution = holdings.map((holding: RWAHolding) => ({
        assetId: holding.assetId,
        assetName: holding.assetName,
        value: holding.totalValue,
        percentage:
          totalInvested > 0 ? (holding.totalValue / totalInvested) * 100 : 0,
      }));

      const portfolioSummary: PortfolioSummary = {
        totalValue,
        totalInvested,
        totalGains,
        totalGainsPercentage,
        currency: "oUSDC",
        holdings,
        recentTransactions: transactionsData.transactions?.slice(0, 5) || [],
        assetDistribution,
      };

      setPortfolio(portfolioSummary);
    } catch (err) {
      console.error("Error fetching portfolio data:", err);
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      fetchPortfolioData();
    }
  }, [currentUser?.uid]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!currentUser?.uid) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Portfolio</h1>
            <p className="text-gray-600">
              Vui lòng kết nối ví để xem portfolio
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải portfolio...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Portfolio</h1>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchPortfolioData}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Thử lại
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
          <p className="text-gray-600">
            Tổng quan về các khoản đầu tư RWA của bạn
          </p>
        </motion.div>

        {/* Portfolio Summary */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tổng giá trị
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBalance(portfolio.totalValue)} {portfolio.currency}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{formatBalance(portfolio.totalGains)} từ đầu tư
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tổng đầu tư
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBalance(portfolio.totalInvested)} {portfolio.currency}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tổng số tiền đã đầu tư
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
                {portfolio.totalGains >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    portfolio.totalGains >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {portfolio.totalGains >= 0 ? "+" : ""}
                  {formatBalance(portfolio.totalGains)} {portfolio.currency}
                </div>
                <p className="text-xs text-muted-foreground">
                  {portfolio.totalGainsPercentage >= 0 ? "+" : ""}
                  {portfolio.totalGainsPercentage.toFixed(2)}% tổng thể
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Số lượng tài sản
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {portfolio.holdings.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tài sản RWA đang nắm giữ
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Holdings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Tài sản đang nắm giữ
              </CardTitle>
              <CardDescription>
                Các khoản đầu tư RWA hiện tại của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {portfolio?.holdings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có tài sản RWA nào</p>
                  <p className="text-sm">Bắt đầu đầu tư tại RWA Market</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio?.holdings.map((holding) => (
                    <div
                      key={holding.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{holding.assetName}</h3>
                        <p className="text-sm text-gray-600">
                          {holding.issuer}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>
                            Số lượng: {formatBalance(holding.quantity)}
                          </span>
                          <span>
                            Giá TB: {formatBalance(holding.averagePrice)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatBalance(holding.totalValue)} {holding.currency}
                        </div>
                        <Badge className={getStatusColor(holding.status)}>
                          {holding.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Giao dịch gần đây
              </CardTitle>
              <CardDescription>Lịch sử giao dịch RWA của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <p className="font-medium">{transaction.assetName}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.transactionType} •{" "}
                            {formatDate(transaction.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {transaction.transactionType === "PURCHASE"
                            ? "-"
                            : "+"}
                          {formatBalance(
                            transaction.amount * transaction.price
                          )}{" "}
                          {transaction.currency}
                        </p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Deposit History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Lịch sử nạp tiền
            </CardTitle>
            <CardDescription>
              Các giao dịch nạp tiền vào ví nội bộ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deposits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có giao dịch nạp tiền nào</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>{formatDate(deposit.timestamp)}</TableCell>
                      <TableCell>{deposit.source}</TableCell>
                      <TableCell>
                        +{formatBalance(deposit.amount)} {deposit.currency}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(deposit.status)}>
                          {deposit.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </main>
  );
}
