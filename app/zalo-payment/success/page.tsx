"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function ZaloPaymentSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending"
  >("pending");
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [mintTransactionHash, setMintTransactionHash] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Check payment status from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const appTransId = urlParams.get("app_trans_id");
    const status = urlParams.get("status");

    if (appTransId) {
      // Query payment status
      fetch(`/api/create-zalo-payment?app_trans_id=${appTransId}`)
        .then((response) => response.json())
        .then(async (data) => {
          setLoading(false);
          if (data.success) {
            setPaymentStatus("success");
            setTransactionDetails(data.data);

            // Mint tokens after successful payment
            try {
              console.log("Payment succeeded, minting tokens...");

              const mintResponse = await fetch("/api/mint-after-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentIntentId: data.data.app_trans_id,
                  userId: data.data.userAddress || "unknown",
                  amount: data.data.amount,
                  currency: "vnd",
                  transactionId: data.data.app_trans_id,
                  walletAddress: data.data.userAddress || "unknown",
                }),
              });

              if (mintResponse.ok) {
                const mintData = await mintResponse.json();
                console.log("✅ Tokens minted successfully:", mintData);
                // Store the transaction hash from mint response
                if (mintData.data?.transactionHash) {
                  setMintTransactionHash(mintData.data.transactionHash);
                }
              } else {
                const errorData = await mintResponse.json();
                console.error("❌ Minting failed:", errorData);
                // Don't fail the payment, just log the error
              }
            } catch (mintError) {
              console.error("Error minting tokens:", mintError);
              // Don't fail the payment, just log the error
            }
          } else {
            setPaymentStatus("failed");
          }
        })
        .catch((error) => {
          console.error("Error checking payment status:", error);
          setLoading(false);
          setPaymentStatus("failed");
        });
    } else {
      setLoading(false);
      setPaymentStatus("failed");
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="bg-base-100 pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <h2 className="text-2xl font-bold text-primary">
                Đang kiểm tra trạng thái thanh toán...
              </h2>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="bg-base-100 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {paymentStatus === "success" ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <CheckCircleIcon className="w-16 h-16 text-success mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-success mb-4">
                  Thanh Toán Thành Công!
                </h1>
                <p className="text-xl text-secondary mb-8">
                  Cảm ơn bạn đã sử dụng dịch vụ OlymPay Zalo Payment
                </p>

                {transactionDetails && (
                  <div className="card bg-base-200 shadow-xl max-w-2xl mx-auto mb-8">
                    <div className="card-body p-8">
                      <h3 className="text-2xl font-bold text-primary mb-6">
                        Chi Tiết Giao Dịch
                      </h3>
                      <div className="space-y-4 text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Mã giao dịch:</span>
                          <span className="font-mono text-sm">
                            {transactionDetails.app_trans_id}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Mã Zalopay:</span>
                          <span className="font-mono text-sm">
                            {transactionDetails.zp_trans_id}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Số tiền:</span>
                          <span className="font-bold">
                            {transactionDetails.amount?.toLocaleString("vi-VN")}{" "}
                            VND
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Trạng thái:</span>
                          <span className="badge badge-success">
                            Thành công
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Thời gian:</span>
                          <span>
                            {new Date(
                              transactionDetails.server_time
                            ).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        {mintTransactionHash && (
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">
                              Transaction Explorer:
                            </span>
                            <a
                              href={`https://explorer.solana.com/tx/${mintTransactionHash}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary text-sm font-mono"
                            >
                              {mintTransactionHash.slice(0, 8)}...
                              {mintTransactionHash.slice(-8)}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => router.push("/zalo-payment")}
                  >
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Thực Hiện Giao Dịch Khác
                  </button>
                  <button
                    className="btn btn-outline btn-lg ml-4"
                    onClick={() => router.push("/")}
                  >
                    Về Trang Chủ
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-4xl font-bold text-error mb-4">
                  Thanh Toán Thất Bại
                </h1>
                <p className="text-xl text-secondary mb-8">
                  Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.
                </p>

                <div className="space-y-4">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => router.push("/zalo-payment")}
                  >
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Thử Lại
                  </button>
                  <button
                    className="btn btn-outline btn-lg ml-4"
                    onClick={() => router.push("/")}
                  >
                    Về Trang Chủ
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
