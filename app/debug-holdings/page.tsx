"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getClientAuth } from "@/lib/client/firebase-client";

export default function DebugHoldingsPage() {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkHoldings = async () => {
    try {
      setLoading(true);
      const token = await getClientAuth().currentUser?.getIdToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/debug/create-sample-holdings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setDebugInfo(data.debug);
        toast.success("Holdings checked successfully");
      } else {
        throw new Error(data.error || "Failed to check holdings");
      }
    } catch (error) {
      console.error("Error checking holdings:", error);
      toast.error("Failed to check holdings");
    } finally {
      setLoading(false);
    }
  };

  const createSampleHoldings = async () => {
    try {
      setLoading(true);
      const token = await getClientAuth().currentUser?.getIdToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/debug/create-sample-holdings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Sample holdings created successfully");
        // Refresh the debug info
        await checkHoldings();
      } else {
        throw new Error(data.error || "Failed to create sample holdings");
      }
    } catch (error) {
      console.error("Error creating sample holdings:", error);
      toast.error("Failed to create sample holdings");
    } finally {
      setLoading(false);
    }
  };

  const migrateHoldings = async () => {
    try {
      setLoading(true);
      const token = await getClientAuth().currentUser?.getIdToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/debug/migrate-holdings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Migrated ${data.migratedCount} holdings successfully`);
        // Refresh the debug info
        await checkHoldings();
      } else {
        throw new Error(data.error || "Failed to migrate holdings");
      }
    } catch (error) {
      console.error("Error migrating holdings:", error);
      toast.error("Failed to migrate holdings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Holdings Collection</h1>

      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <button
            className="btn btn-primary"
            onClick={checkHoldings}
            disabled={loading}
          >
            {loading ? "Loading..." : "Check Holdings Collection"}
          </button>

          <button
            className="btn btn-secondary"
            onClick={createSampleHoldings}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Sample Holdings"}
          </button>

          <button
            className="btn btn-accent"
            onClick={migrateHoldings}
            disabled={loading}
          >
            {loading ? "Migrating..." : "Migrate Existing Holdings"}
          </button>
        </div>

        {debugInfo && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Debug Information</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Collection Status:</h3>
                  <p>
                    Collection Exists:{" "}
                    {debugInfo.collectionExists ? "✅ Yes" : "❌ No"}
                  </p>
                  <p>Holdings Count: {debugInfo.holdingsCount}</p>
                </div>

                {debugInfo.errors && debugInfo.errors.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-error">Errors:</h3>
                    <ul className="list-disc list-inside">
                      {debugInfo.errors.map((error: string, index: number) => (
                        <li key={index} className="text-error">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {debugInfo.holdings && debugInfo.holdings.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Holdings:</h3>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Asset Name</th>
                            <th>Quantity</th>
                            <th>Total Value</th>
                            <th>Currency</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debugInfo.holdings.map((holding: any) => (
                            <tr key={holding.id}>
                              <td>{holding.assetName}</td>
                              <td>{holding.quantity}</td>
                              <td>{holding.totalValue}</td>
                              <td>{holding.currency}</td>
                              <td>{holding.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
