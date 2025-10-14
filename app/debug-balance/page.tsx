"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RefreshCw, User, Wallet, DollarSign } from "lucide-react";
// import { formatBalance, formatDate } from "@/lib/utils";

interface UserData {
  uid: string;
  email: string;
  hasInternalWallet: boolean;
  oUSDCBalance: number;
  oVNDBalance: number;
  walletAddress: string;
  createdAt: string;
  lastUpdated: string;
}

interface DebugResponse {
  success: boolean;
  totalUsers: number;
  users: UserData[];
  debugInfo: {
    message: string;
    note: string;
  };
}

export default function DebugBalancePage() {
  const [debugData, setDebugData] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedUid, setSelectedUid] = useState("");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/balance");
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error("Error fetching debug data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (uid: string) => {
    if (!uid) return;

    setLoadingUser(true);
    try {
      const response = await fetch("/api/debug/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid }),
      });
      const data = await response.json();
      setUserDetails(data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const updateBalance = async (action: "set" | "add" | "subtract") => {
    if (!selectedUid) return;

    const oUSDCAmount = parseFloat(
      (document.getElementById("ousdc-amount") as HTMLInputElement)?.value ||
        "0"
    );
    const oVNDAmount = parseFloat(
      (document.getElementById("ovnd-amount") as HTMLInputElement)?.value || "0"
    );

    if (action !== "set" && oUSDCAmount === 0 && oVNDAmount === 0) {
      alert("Please enter an amount to add or subtract");
      return;
    }

    try {
      const response = await fetch("/api/debug/update-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: selectedUid,
          oUSDCAmount: oUSDCAmount || undefined,
          oVNDAmount: oVNDAmount || undefined,
          action,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `Balance updated successfully!\nNew oUSDC: ${formatBalance(
            result.newBalance.oUSDC
          )}\nNew oVND: ${formatBalance(result.newBalance.oVND)}`
        );
        // Refresh user details
        fetchUserDetails(selectedUid);
        // Refresh all users data
        fetchDebugData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      alert("Failed to update balance");
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  const formatBalance = (balance: number) => {
    return balance.toLocaleString("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A";

    // Handle Firebase Timestamp
    if (dateValue && typeof dateValue === "object" && dateValue._seconds) {
      return new Date(dateValue._seconds * 1000).toLocaleString();
    }

    // Handle regular Date string
    if (typeof dateValue === "string") {
      return new Date(dateValue).toLocaleString();
    }

    return "N/A";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug Balance - oUSDC & oVND
          </h1>
          <p className="text-gray-600">
            Kiểm tra số dư oUSDC và oVND trong internal wallet của tất cả users
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={fetchDebugData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh All Users
          </Button>
        </div>

        {/* Summary Cards */}
        {debugData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{debugData.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Users with Wallet
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {debugData.users.filter((u) => u.hasInternalWallet).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total oUSDC
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBalance(
                    debugData.users.reduce((sum, u) => sum + u.oUSDCBalance, 0)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Details Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Check & Update Specific User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter User UID"
                  value={selectedUid}
                  onChange={(e) => setSelectedUid(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => fetchUserDetails(selectedUid)}
                  disabled={loadingUser || !selectedUid}
                >
                  {loadingUser ? "Loading..." : "Get Details"}
                </Button>
              </div>

              {userDetails && userDetails.success && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">User Details:</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">
                        oUSDC Balance:
                      </label>
                      <p className="font-mono text-lg">
                        {formatBalance(userDetails.userData.oUSDCBalance)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        oVND Balance:
                      </label>
                      <p className="font-mono text-lg">
                        {formatBalance(userDetails.userData.oVNDBalance)}
                      </p>
                    </div>
                  </div>

                  {/* Update Balance Form */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Update Balance:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          New oUSDC Amount:
                        </label>
                        <Input
                          id="ousdc-amount"
                          type="number"
                          step="0.01"
                          placeholder="Enter oUSDC amount"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          New oVND Amount:
                        </label>
                        <Input
                          id="ovnd-amount"
                          type="number"
                          step="0.01"
                          placeholder="Enter oVND amount"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => updateBalance("set")}
                        variant="default"
                      >
                        Set Balance
                      </Button>
                      <Button
                        onClick={() => updateBalance("add")}
                        variant="outline"
                      >
                        Add to Balance
                      </Button>
                      <Button
                        onClick={() => updateBalance("subtract")}
                        variant="outline"
                      >
                        Subtract from Balance
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        {debugData && (
          <Card>
            <CardHeader>
              <CardTitle>All Users Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">UID</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Has Wallet</th>
                      <th className="text-left p-2">oUSDC Balance</th>
                      <th className="text-left p-2">oVND Balance</th>
                      <th className="text-left p-2">Wallet Address</th>
                      <th className="text-left p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugData.users.map((user) => (
                      <tr key={user.uid} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-sm">{user.uid}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              user.hasInternalWallet
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.hasInternalWallet ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="p-2 font-mono">
                          {formatBalance(user.oUSDCBalance)} oUSDC
                        </td>
                        <td className="p-2 font-mono">
                          {formatBalance(user.oVNDBalance)} oVND
                        </td>
                        <td className="p-2 font-mono text-sm">
                          {user.walletAddress}
                        </td>
                        <td className="p-2 text-sm">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        {debugData && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Message:</strong> {debugData.debugInfo.message}
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  <strong>Note:</strong> {debugData.debugInfo.note}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
