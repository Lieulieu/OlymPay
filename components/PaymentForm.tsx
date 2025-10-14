"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useWallet } from "@/contexts/WalletContext";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentFormProps {}

function PaymentFormComponent() {
  const stripe = useStripe();
  const elements = useElements();
  const { connected, publicKey, connect, loading: walletLoading } = useWallet();
  const [amount, setAmount] = useState(100);
  const [currency, setCurrency] = useState("usd");
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [mintTransactionHash, setMintTransactionHash] = useState<string>("");
  const [exchangeRates, setExchangeRates] = useState({
    usd: 1,
    eur: 0.85,
    thb: 35.5,
  });

  // Generate unique transaction ID
  const generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `OLYMPAY_${timestamp}_${random}`.toUpperCase();
  };

  // Calculate crypto amount based on current price and exchange rate
  useEffect(() => {
    const mockUSDCPrice = 1; // USDC is pegged to USD
    const exchangeRate = exchangeRates[currency as keyof typeof exchangeRates];
    setCryptoAmount(amount * exchangeRate * mockUSDCPrice);
  }, [amount, currency, exchangeRates]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Check wallet connection first
    if (!connected) {
      setError("Please connect your wallet before making a payment");
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate transaction ID
      const txId = generateTransactionId();
      setTransactionId(txId);

      // Create payment intent
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(
            amount * exchangeRates[currency as keyof typeof exchangeRates] * 100
          ), // Convert to cents with exchange rate
          currency: currency,
          usdcAmount: amount, // Store the USDC amount for reference
          transactionId: txId, // Include transaction ID
          walletAddress: publicKey?.toString(), // Include wallet address
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        });

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
      } else if (paymentIntent.status === "succeeded") {
        setSuccess(true);
        setTransactionDetails(paymentIntent);

        // Mint tokens to internal wallet after successful payment
        try {
          console.log("Payment succeeded, minting tokens...");

          const mintResponse = await fetch("/api/mint-after-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              userId: publicKey?.toString(), // Using wallet address as user ID for now
              amount: amount,
              currency: currency,
              transactionId: txId,
              walletAddress: publicKey?.toString(),
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

        console.log("Payment succeeded:", paymentIntent);
      }
    } catch (err) {
      setError("An error occurred during payment");
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
          Payment Successful!
        </h3>
        <p className="text-secondary mb-4">
          You've successfully purchased {amount.toFixed(2)} USDC
        </p>
        <p className="text-sm text-secondary mb-4">
          Paid:{" "}
          {(
            amount * exchangeRates[currency as keyof typeof exchangeRates]
          ).toFixed(2)}{" "}
          {currency.toUpperCase()}
        </p>

        {transactionDetails && (
          <div className="card bg-base-200 p-4 mb-4">
            <h4 className="font-semibold mb-2">Transaction Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>OlymPay Transaction ID:</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Stripe Payment ID:</span>
                <span className="font-mono text-xs">
                  {transactionDetails.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Description:</span>
                <span>
                  {transactionDetails.description ||
                    "Purchase USDC on Solana - OlymPay"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>
                  {(transactionDetails.amount / 100).toFixed(2)}{" "}
                  {currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-success font-semibold">
                  {transactionDetails.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <span>{transactionDetails.metadata?.network || "Solana"}</span>
              </div>
              <div className="flex justify-between">
                <span>Wallet Address:</span>
                <span className="font-mono text-xs">
                  {publicKey?.toString().slice(0, 8)}...
                  {publicKey?.toString().slice(-8)}
                </span>
              </div>
              {mintTransactionHash && (
                <div className="flex justify-between">
                  <span>Transaction Explorer:</span>
                  <a
                    href={`https://explorer.solana.com/tx/${mintTransactionHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary text-xs font-mono"
                  >
                    {mintTransactionHash.slice(0, 8)}...
                    {mintTransactionHash.slice(-8)}
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
            setAmount(100);
            setTransactionDetails(null);
            setMintTransactionHash("");
          }}
        >
          Make Another Purchase
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
              <h3 className="font-semibold text-warning">Wallet Required</h3>
              <p className="text-sm text-secondary">
                Please connect your wallet to proceed with payment
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
                  Connecting...
                </>
              ) : (
                <>
                  <WalletIcon className="w-4 h-4" />
                  Connect Wallet
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
              <h3 className="font-semibold text-success">Wallet Connected</h3>
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
            <span className="label-text font-semibold">Amount (USDC)</span>
          </label>
          <div className="relative">
            <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="number"
              min="10"
              max="10000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input input-bordered w-full pl-10"
              placeholder="Enter amount"
              required
            />
          </div>
          <div className="text-sm text-secondary mt-1">
            Minimum: 10 USDC, Maximum: 10,000 USDC
          </div>
        </div>

        <div>
          <label className="label">
            <span className="label-text font-semibold">Currency</span>
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="thb">THB</option>
          </select>
          <div className="text-sm text-secondary mt-1">
            Exchange rate: 1 USDC ={" "}
            {exchangeRates[currency as keyof typeof exchangeRates]}{" "}
            {currency.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Payment Summary</h3>

        <div className="card bg-base-300 p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Amount to pay:</span>
            <span className="text-lg font-bold">
              {(
                amount * exchangeRates[currency as keyof typeof exchangeRates]
              ).toFixed(2)}{" "}
              {currency.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-secondary mt-1">
            Based on current exchange rate
          </div>
        </div>

        <div className="card bg-primary/10 p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">You'll receive:</span>
            <span className="text-lg font-bold text-primary">
              {amount.toFixed(2)} USDC
            </span>
          </div>
          <div className="text-sm text-secondary mt-1">
            Transaction fee: {(amount * 0.001).toFixed(2)} USDC (0.1%)
          </div>
        </div>
      </div>

      <div>
        <label className="label">
          <span className="label-text font-semibold">Card Information</span>
        </label>
        <div className="p-4 border border-base-300 rounded-lg bg-base-100">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <motion.button
        type="submit"
        disabled={!stripe || loading || !connected}
        className="btn btn-primary w-full"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Processing...
          </>
        ) : (
          <>
            <CreditCardIcon className="w-5 h-5" />
            Pay{" "}
            {(
              amount * exchangeRates[currency as keyof typeof exchangeRates]
            ).toFixed(2)}{" "}
            {currency.toUpperCase()}
          </>
        )}
      </motion.button>

      <div className="text-xs text-secondary text-center">
        By proceeding, you agree to our Terms of Service and Privacy Policy.
        Your payment is processed securely by Stripe.
      </div>
    </form>
  );
}

export default function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormComponent />
    </Elements>
  );
}
