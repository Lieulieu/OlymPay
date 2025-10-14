"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  WalletIcon,
  BanknotesIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { useWallet } from "@/contexts/WalletContext";

interface ZaloPaymentFormMockProps {}

export default function ZaloPaymentFormMock() {
  const { connected, publicKey, connect, loading: walletLoading } = useWallet();
  const [amount, setAmount] = useState(1000000); // Default 1,000,000 VND
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "atm" | "cc">("qr");
  const [qrCode, setQrCode] = useState<string>("");
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [oVNDBalance, setOVNDBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Generate unique transaction ID
  const generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ZALOPAY_MOCK_${timestamp}_${random}`.toUpperCase();
  };

  // Fetch oVND balance
  const fetchOVNDBalance = async () => {
    if (!publicKey) return;

    setLoadingBalance(true);
    try {
      const response = await fetch("/api/wallet/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
        }),
      });

      const data = await response.json();
      if (data.success && data.oVNDBalance !== undefined) {
        setOVNDBalance(data.oVNDBalance);
      }
    } catch (error) {
      console.error("Error fetching oVND balance:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Fetch balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchOVNDBalance();
    }
  }, [connected, publicKey]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Check wallet connection first
    if (!connected) {
      setError("Vui lòng kết nối ví trước khi thực hiện thanh toán");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate transaction ID
      const txId = generateTransactionId();
      setTransactionId(txId);

      // Create Mock ZaloPay order
      const response = await fetch("/api/zalo-payment/mock-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          description: `Nạp ${amount.toLocaleString(
            "vi-VN"
          )} VND - OlymPay Mock`,
          paymentMethod: paymentMethod,
          userAddress: publicKey?.toString(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.success) {
        setQrCode(data.qrCode || "");
        setPaymentUrl(data.paymentUrl || "");
        setShowPaymentOptions(true);

        // Simulate payment success after 5 seconds for demo
        setTimeout(() => {
          setSuccess(true);
          setTransactionDetails({
            id: txId,
            appTransId: data.appTransId,
            amount: amount,
            currency: "vnd",
            status: "succeeded",
            description: `Nạp ${amount.toLocaleString(
              "vi-VN"
            )} VND - OlymPay Mock`,
            metadata: {
              network: "Solana",
              walletAddress: publicKey?.toString(),
              paymentMethod: paymentMethod,
              mock: true,
            },
            minting: data.minting, // Include minting information
          });

          // Refresh balance after successful minting
          setTimeout(() => {
            fetchOVNDBalance();
          }, 2000);
        }, 5000);
      }
    } catch (err) {
      setError("Đã xảy ra lỗi trong quá trình thanh toán");
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-success mb-4">
          Thanh Toán Thành Công!
        </h3>
        <p className="text-secondary mb-4">
          Bạn đã nạp thành công {amount.toLocaleString("vi-VN")} VND (Mock)
        </p>
        <p className="text-sm text-secondary mb-4">
          Đã thanh toán: {amount.toLocaleString("vi-VN")} VND
        </p>

        {/* Minting Information */}
        {transactionDetails?.minting && (
          <div className="alert alert-success mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🪙</span>
              <div>
                <h4 className="font-bold">oVND Tokens Minted!</h4>
                <p className="text-sm">
                  Đã mint{" "}
                  {transactionDetails.minting.mintedAmount.toLocaleString(
                    "vi-VN",
                    { maximumFractionDigits: 6 }
                  )}{" "}
                  oVND vào ví của bạn
                </p>
                <p className="text-xs text-secondary">
                  Transaction Hash:
                  <a
                    href={`https://explorer.solana.com/tx/${transactionDetails.minting.txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary ml-1"
                  >
                    {transactionDetails.minting.txHash.slice(0, 8)}...
                    {transactionDetails.minting.txHash.slice(-8)}
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* oVND Balance Display */}
        <div className="card bg-base-200 p-4 mb-4">
          <h4 className="font-semibold mb-2">Số dư oVND</h4>
          {loadingBalance ? (
            <div className="flex items-center">
              <span className="loading loading-spinner loading-sm mr-2"></span>
              <span className="text-sm text-secondary">
                Đang tải số dư oVND...
              </span>
            </div>
          ) : oVNDBalance !== null ? (
            <div className="text-lg font-bold text-primary">
              {(oVNDBalance / 1000000000).toLocaleString("vi-VN", {
                maximumFractionDigits: 6,
              })}{" "}
              oVND
            </div>
          ) : (
            <div className="text-sm text-secondary">
              Không thể tải số dư oVND
            </div>
          )}
        </div>

        {transactionDetails && (
          <div className="card bg-base-200 p-4 mb-4">
            <h4 className="font-semibold mb-2">Chi Tiết Giao Dịch (Mock)</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Mã giao dịch OlymPay:</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Mô tả:</span>
                <span>{transactionDetails.description}</span>
              </div>
              <div className="flex justify-between">
                <span>Số tiền:</span>
                <span>{amount.toLocaleString("vi-VN")} VND</span>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <span className="text-success font-semibold">
                  Thành công (Mock)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mạng:</span>
                <span>{transactionDetails.metadata?.network || "Solana"}</span>
              </div>
              <div className="flex justify-between">
                <span>Địa chỉ ví:</span>
                <span className="font-mono text-xs">
                  {publicKey?.toString().slice(0, 8)}...
                  {publicKey?.toString().slice(-8)}
                </span>
              </div>
              {transactionDetails?.minting?.txHash && (
                <div className="flex justify-between">
                  <span>Transaction Explorer:</span>
                  <a
                    href={`https://explorer.solana.com/tx/${transactionDetails.minting.txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary text-xs font-mono"
                  >
                    {transactionDetails.minting.txHash.slice(0, 8)}...
                    {transactionDetails.minting.txHash.slice(-8)}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={() => {
            setSuccess(false);
            setAmount(1000000);
            setTransactionDetails(null);
            setShowPaymentOptions(false);
          }}
        >
          Nạp Thêm
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Wallet Connection Section */}
      {!connected ? (
        <div className="card bg-warning/10 border-warning p-4">
          <div className="flex items-center space-x-3">
            <WalletIcon className="w-6 h-6 text-warning" />
            <div className="flex-1">
              <h3 className="font-semibold text-warning">Cần Kết Nối Ví</h3>
              <p className="text-sm text-secondary">
                Vui lòng kết nối ví để tiếp tục thanh toán
              </p>
            </div>
            <button
              type="button"
              onClick={connect}
              disabled={walletLoading}
              className="btn btn-warning btn-sm"
            >
              {walletLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Đang kết nối...
                </>
              ) : (
                <>
                  <WalletIcon className="w-4 h-4" />
                  Kết Nối Ví
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="card bg-success/10 border-success p-4">
          <div className="flex items-center space-x-3">
            <WalletIcon className="w-6 h-6 text-success" />
            <div className="flex-1">
              <h3 className="font-semibold text-success">Ví Đã Kết Nối</h3>
              <p className="text-sm text-secondary font-mono">
                {publicKey?.toString().slice(0, 8)}...
                {publicKey?.toString().slice(-8)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text font-semibold">Số tiền (VND)</span>
          </label>
          <div className="relative">
            <BanknotesIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="number"
              min="100000"
              max="50000000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input input-bordered w-full pl-10"
              placeholder="Nhập số tiền"
              required
            />
          </div>
          <div className="text-sm text-secondary mt-1">
            Tối thiểu: 100,000 VND, Tối đa: 50,000,000 VND
          </div>
        </div>

        <div>
          <label className="label">
            <span className="label-text font-semibold">
              Phương thức thanh toán
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("qr")}
              className={`btn btn-sm ${
                paymentMethod === "qr" ? "btn-primary" : "btn-outline"
              }`}
            >
              <QrCodeIcon className="w-4 h-4" />
              QR Code
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("atm")}
              className={`btn btn-sm ${
                paymentMethod === "atm" ? "btn-primary" : "btn-outline"
              }`}
            >
              <CreditCardIcon className="w-4 h-4" />
              Thẻ ATM
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cc")}
              className={`btn btn-sm ${
                paymentMethod === "cc" ? "btn-primary" : "btn-outline"
              }`}
            >
              <CreditCardIcon className="w-4 h-4" />
              Thẻ Tín dụng
            </button>
          </div>
        </div>

        <div>
          <label className="label">
            <span className="label-text font-semibold">Loại tiền tệ</span>
          </label>
          <div className="input input-bordered w-full bg-base-200 text-secondary">
            VND (Việt Nam Đồng)
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">
          Tóm Tắt Thanh Toán
        </h3>

        <div className="card bg-base-300 p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Số tiền thanh toán:</span>
            <span className="text-lg font-bold">
              {amount.toLocaleString("vi-VN")} VND
            </span>
          </div>
          <div className="text-sm text-secondary mt-1">
            Dựa trên tỷ giá hiện tại
          </div>
        </div>

        <div className="card bg-primary/10 p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Bạn sẽ nhận được:</span>
            <span className="text-lg font-bold text-primary">
              {amount.toLocaleString("vi-VN")} oVND
            </span>
          </div>
          <div className="text-sm text-secondary mt-1">
            Miễn phí giao dịch cho dịch vụ Zalo Payment (Mock)
          </div>
        </div>
      </div>

      {/* Payment Options Display */}
      {showPaymentOptions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-primary">
            Chọn cách thanh toán (Mock)
          </h3>

          {paymentMethod === "qr" && qrCode && (
            <div className="card bg-base-200 p-6 text-center">
              <QrCodeIcon className="w-8 h-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">
                Quét mã QR để thanh toán (Mock)
              </h4>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="Mock ZaloPay QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-secondary mb-4">
                Đây là mock QR code để test UI. Trong thực tế sẽ là QR code từ
                ZaloPay
              </p>
              <div className="text-xs text-secondary">
                Mã giao dịch: {transactionId}
              </div>
            </div>
          )}

          {paymentMethod !== "qr" && paymentUrl && (
            <div className="card bg-base-200 p-6 text-center">
              <CreditCardIcon className="w-8 h-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">
                {paymentMethod === "atm"
                  ? "Thanh toán bằng thẻ ATM (Mock)"
                  : "Thanh toán bằng thẻ tín dụng (Mock)"}
              </h4>
              <p className="text-sm text-secondary mb-4">
                Đây là mock payment URL để test UI. Trong thực tế sẽ redirect
                đến ZaloPay
              </p>
              <button
                onClick={() => window.open(paymentUrl, "_blank")}
                className="btn btn-primary"
              >
                <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
                Thanh toán ngay (Mock)
              </button>
              <div className="text-xs text-secondary mt-4">
                Mã giao dịch: {transactionId}
              </div>
            </div>
          )}

          <div className="alert alert-info">
            <div className="flex items-center">
              <div className="loading loading-spinner loading-sm mr-2"></div>
              <span>
                Đang chờ thanh toán... (Mock - sẽ tự động thành công sau 5 giây)
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowPaymentOptions(false);
              setQrCode("");
              setPaymentUrl("");
            }}
            className="btn btn-outline w-full"
          >
            Hủy thanh toán
          </button>
        </motion.div>
      )}

      {/* Payment Method Info */}
      <div className="card bg-accent/10 border-accent p-4">
        <div className="flex items-center space-x-3">
          <CreditCardIcon className="w-6 h-6 text-accent" />
          <div className="flex-1">
            <h3 className="font-semibold text-accent">Zalopay Mock Mode</h3>
            <p className="text-sm text-secondary">
              {paymentMethod === "qr"
                ? "Mock QR code để test UI - không phải ZaloPay thật"
                : "Mock payment URL để test UI - không phải ZaloPay thật"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {!showPaymentOptions && (
        <motion.button
          type="submit"
          disabled={loading || !connected}
          className="btn btn-primary w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Đang tạo đơn hàng Mock...
            </>
          ) : (
            <>
              <CreditCardIcon className="w-5 h-5" />
              Tạo đơn hàng Mock {amount.toLocaleString("vi-VN")} VND
            </>
          )}
        </motion.button>
      )}

      <div className="text-xs text-secondary text-center">
        <strong>Mock Mode:</strong> Đây là phiên bản test UI. Để tích hợp thật
        với ZaloPay, vui lòng cấu hình credentials hợp lệ và sử dụng
        ZaloPaymentForm.tsx gốc.
      </div>
    </form>
  );
}
