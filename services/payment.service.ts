import { db } from "@/lib/server/firebase-admin";
import {
  StripePaymentInfo,
  CreatePaymentRequest,
  PaymentHistoryResponse,
} from "@/types/payment";
import { PAYMENTS_COLLECTION } from "@/config/db";

export class PaymentService {
  /**
   * Create a new payment record in Firebase
   */
  static async createPayment(
    userId: string,
    paymentData: CreatePaymentRequest
  ): Promise<StripePaymentInfo> {
    try {
      console.log("💾 [PAYMENT-SERVICE] Creating payment record...");
      console.log(`  - User ID: ${userId}`);
      console.log(`  - Payment Intent ID: ${paymentData.paymentIntentId}`);
      console.log(`  - Amount: ${paymentData.amount} ${paymentData.currency}`);
      console.log(
        `  - Token Amount: ${paymentData.tokenAmount} ${paymentData.tokenType}`
      );

      const firebaseDb = db();
      const paymentsRef = firebaseDb.collection(PAYMENTS_COLLECTION);

      const paymentDoc: StripePaymentInfo = {
        ...paymentData,
        status: "succeeded",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add payment record
      const docRef = await paymentsRef.add({
        ...paymentDoc,
        userId, // Add userId for querying
      });

      console.log(
        `✅ [PAYMENT-SERVICE] Payment record created with ID: ${docRef.id}`
      );

      return {
        ...paymentDoc,
        paymentIntentId: docRef.id, // Use Firebase doc ID as unique identifier
      };
    } catch (error) {
      console.error(
        "❌ [PAYMENT-SERVICE] Error creating payment record:",
        error
      );
      throw new Error(
        `Failed to create payment record: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get payment history for a user
   */
  static async getPaymentHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaymentHistoryResponse> {
    try {
      console.log("📋 [PAYMENT-SERVICE] Fetching payment history...");
      console.log(`  - User ID: ${userId}`);
      console.log(`  - Page: ${page}, Limit: ${limit}`);

      const firebaseDb = db();
      const paymentsRef = firebaseDb.collection(PAYMENTS_COLLECTION);

      // Calculate offset
      const offset = (page - 1) * limit;

      // Query payments for this user, ordered by creation date (newest first)
      const query = paymentsRef.where("userId", "==", userId).limit(limit + 1); // Get one extra to check if there are more

      const snapshot = await query.get();

      const payments: StripePaymentInfo[] = [];
      let hasMore = false;

      snapshot.docs.forEach((doc, index) => {
        if (index < limit) {
          const data = doc.data();
          payments.push({
            paymentIntentId: doc.id,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            transactionId: data.transactionId,
            transactionHash: data.transactionHash,
            walletAddress: data.walletAddress,
            internalWalletAddress: data.internalWalletAddress,
            tokenAmount: data.tokenAmount,
            tokenType: data.tokenType,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            metadata: data.metadata,
          });
        } else {
          hasMore = true;
        }
      });

      // Sort by createdAt descending (newest first)
      payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      console.log(`✅ [PAYMENT-SERVICE] Found ${payments.length} payments`);
      console.log(`  - Has more: ${hasMore}`);

      return {
        payments,
        total: payments.length,
        page,
        limit,
        hasMore,
      };
    } catch (error) {
      console.error(
        "❌ [PAYMENT-SERVICE] Error fetching payment history:",
        error
      );
      throw new Error(
        `Failed to fetch payment history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get a specific payment by payment intent ID
   */
  static async getPaymentByIntentId(
    paymentIntentId: string
  ): Promise<StripePaymentInfo | null> {
    try {
      console.log("🔍 [PAYMENT-SERVICE] Fetching payment by intent ID...");
      console.log(`  - Payment Intent ID: ${paymentIntentId}`);

      const firebaseDb = db();
      const paymentsRef = firebaseDb.collection(PAYMENTS_COLLECTION);

      const query = paymentsRef.where("paymentIntentId", "==", paymentIntentId);
      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log("❌ [PAYMENT-SERVICE] Payment not found");
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      const payment: StripePaymentInfo = {
        paymentIntentId: doc.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        transactionId: data.transactionId,
        transactionHash: data.transactionHash,
        walletAddress: data.walletAddress,
        internalWalletAddress: data.internalWalletAddress,
        tokenAmount: data.tokenAmount,
        tokenType: data.tokenType,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        metadata: data.metadata,
      };

      console.log(
        `✅ [PAYMENT-SERVICE] Payment found: ${payment.amount} ${payment.currency}`
      );

      return payment;
    } catch (error) {
      console.error("❌ [PAYMENT-SERVICE] Error fetching payment:", error);
      throw new Error(
        `Failed to fetch payment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    paymentIntentId: string,
    status: "succeeded" | "failed" | "canceled" | "processing",
    transactionHash?: string
  ): Promise<void> {
    try {
      console.log("🔄 [PAYMENT-SERVICE] Updating payment status...");
      console.log(`  - Payment Intent ID: ${paymentIntentId}`);
      console.log(`  - New Status: ${status}`);
      console.log(`  - Transaction Hash: ${transactionHash || "N/A"}`);

      const firebaseDb = db();
      const paymentsRef = firebaseDb.collection(PAYMENTS_COLLECTION);

      const query = paymentsRef.where("paymentIntentId", "==", paymentIntentId);
      const snapshot = await query.get();

      if (snapshot.empty) {
        throw new Error(`Payment not found: ${paymentIntentId}`);
      }

      const doc = snapshot.docs[0];
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (transactionHash) {
        updateData.transactionHash = transactionHash;
      }

      await doc.ref.update(updateData);

      console.log(`✅ [PAYMENT-SERVICE] Payment status updated successfully`);
    } catch (error) {
      console.error(
        "❌ [PAYMENT-SERVICE] Error updating payment status:",
        error
      );
      throw new Error(
        `Failed to update payment status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get payment statistics for a user
   */
  static async getPaymentStats(userId: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    totalTokens: number;
    lastPaymentDate?: Date;
  }> {
    try {
      console.log("📊 [PAYMENT-SERVICE] Calculating payment statistics...");
      console.log(`  - User ID: ${userId}`);

      const firebaseDb = db();
      const paymentsRef = firebaseDb.collection(PAYMENTS_COLLECTION);

      const query = paymentsRef
        .where("userId", "==", userId)
        .where("status", "==", "succeeded");

      const snapshot = await query.get();

      let totalPayments = 0;
      let totalAmount = 0;
      let totalTokens = 0;
      let lastPaymentDate: Date | undefined;

      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        totalPayments++;
        totalAmount += data.amount;
        totalTokens += data.tokenAmount;

        if (index === 0) {
          lastPaymentDate = data.createdAt.toDate();
        }
      });

      console.log(`✅ [PAYMENT-SERVICE] Statistics calculated:`);
      console.log(`  - Total Payments: ${totalPayments}`);
      console.log(`  - Total Amount: ${totalAmount}`);
      console.log(`  - Total Tokens: ${totalTokens}`);
      console.log(
        `  - Last Payment: ${lastPaymentDate?.toISOString() || "N/A"}`
      );

      return {
        totalPayments,
        totalAmount,
        totalTokens,
        lastPaymentDate,
      };
    } catch (error) {
      console.error(
        "❌ [PAYMENT-SERVICE] Error calculating payment stats:",
        error
      );
      throw new Error(
        `Failed to calculate payment stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
