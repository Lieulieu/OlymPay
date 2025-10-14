import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { DepositTransaction } from "@/types/rwa";

const DEPOSITS_COLLECTION = "deposit_transactions";

// Mock deposit API for devnet/testnet
export async function POST(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const { amount, currency, source, notes } = await req.json();

    if (!amount || amount <= 0 || !currency || !source) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid deposit amount, currency, or source",
        },
        { status: 400 }
      );
    }

    // Mock validation based on source
    let mockTransactionHash = "";
    let mockStatus = "PENDING";
    let mockFees = 0;

    switch (source) {
      case "EXTERNAL_WALLET":
        // Mock Solana transaction hash
        mockTransactionHash = `mock_sol_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        mockStatus = "COMPLETED";
        mockFees = 0.000005; // Mock SOL fee
        break;

      case "BANK_TRANSFER":
        // Mock bank transfer reference
        mockTransactionHash = `mock_bank_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        mockStatus = "COMPLETED";
        mockFees = 0; // No fees for bank transfer
        break;

      case "CREDIT_CARD":
        // Mock credit card transaction
        mockTransactionHash = `mock_cc_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        mockStatus = "COMPLETED";
        mockFees = amount * 0.029; // 2.9% fee
        break;

      case "OVND_SWAP":
        // Mock swap transaction
        mockTransactionHash = `mock_swap_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        mockStatus = "COMPLETED";
        mockFees = 0; // No fees for internal swap
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Unsupported deposit source" },
          { status: 400 }
        );
    }

    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const depositId = `DEP_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    await firebaseDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();

      if (!userData?.internalWallet) {
        throw new Error("Internal wallet not found for user");
      }

      let newOUSDCBalance = userData.internalWallet.oUSDC || 0;
      let newOVNDBalance = userData.internalWallet.oVND || 0;

      if (currency === "oUSDC") {
        newOUSDCBalance += amount;
      } else if (currency === "oVND") {
        newOVNDBalance += amount;
      } else {
        throw new Error("Unsupported currency");
      }

      // Update user's internal wallet balance
      transaction.update(userRef, {
        "internalWallet.oUSDC": newOUSDCBalance,
        "internalWallet.oVND": newOVNDBalance,
        updatedAt: new Date(),
      });

      // Record deposit transaction
      const depositRecord: DepositTransaction = {
        id: depositId,
        userId: uid,
        amount,
        currency,
        source,
        status: mockStatus as "PENDING" | "COMPLETED" | "FAILED",
        transactionHash: mockTransactionHash,
        timestamp: new Date(),
        fees: mockFees,
        notes: notes || `Mock deposit ${amount} ${currency} via ${source}`,
      };

      const depositRef = firebaseDb
        .collection(DEPOSITS_COLLECTION)
        .doc(depositId);
      transaction.set(depositRef, {
        ...depositRecord,
        timestamp: depositRecord.timestamp.toISOString(),
      });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deposited ${amount} ${currency} (MOCK)`,
      depositId,
      transactionHash: mockTransactionHash,
      status: mockStatus,
      fees: mockFees,
      note: "This is a mock transaction for devnet/testing purposes",
    });
  } catch (error) {
    console.error("[/api/wallet/deposit] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// API to get user's deposit history
export async function GET(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const depositsRef = firebaseDb
      .collection(DEPOSITS_COLLECTION)
      .where("userId", "==", uid)
      .orderBy("timestamp", "desc");

    const depositsSnapshot = await depositsRef.get();
    const deposits = depositsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: new Date(data.timestamp),
      };
    });

    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    console.error("[/api/wallet/deposit] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
