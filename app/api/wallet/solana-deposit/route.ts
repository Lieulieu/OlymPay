import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";
import { USERS_COLLECTION } from "@/config/db";
import { addressFromEncMnemonic } from "@/lib/server/wallet";

// oUSDC Token Address on Solana Devnet
const OUSDC_MINT_ADDRESS = "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV"; // USDC on devnet as oUSDC

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

    const { amount, fromWalletAddress } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!fromWalletAddress) {
      return NextResponse.json(
        { success: false, error: "From wallet address is required" },
        { status: 400 }
      );
    }

    // Get user's internal wallet
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData?.internalWallet?.encMnemonic) {
      return NextResponse.json(
        { success: false, error: "Internal wallet not found" },
        { status: 404 }
      );
    }

    // Get internal wallet address
    const internalWalletAddress = await addressFromEncMnemonic(
      userData.internalWallet.encMnemonic
    );

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const mintPublicKey = new PublicKey(OUSDC_MINT_ADDRESS);
    const fromPublicKey = new PublicKey(fromWalletAddress);
    const toPublicKey = new PublicKey(internalWalletAddress);

    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      fromPublicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    );

    // Check if from wallet has enough balance
    try {
      const fromAccountInfo = await connection.getTokenAccountBalance(
        fromTokenAccount
      );
      const fromBalance =
        parseFloat(fromAccountInfo.value.amount) /
        Math.pow(10, fromAccountInfo.value.decimals);

      if (fromBalance < amount) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient balance. Available: ${fromBalance} oUSDC, Required: ${amount} oUSDC`,
          },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "From wallet does not have oUSDC token account or insufficient balance",
        },
        { status: 400 }
      );
    }

    // Check if to wallet has token account, create if not
    try {
      await connection.getTokenAccountBalance(toTokenAccount);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Internal wallet does not have oUSDC token account. Please create it first.",
        },
        { status: 400 }
      );
    }

    // Create transfer instruction
    const transferAmount = Math.floor(amount * Math.pow(10, 6)); // USDC has 6 decimals
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPublicKey,
      transferAmount
    );

    // Create transaction
    const transaction = new Transaction().add(transferInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Serialize transaction for client to sign
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const transactionBase64 = serializedTransaction.toString("base64");

    return NextResponse.json({
      success: true,
      message: "Transaction created successfully",
      transaction: transactionBase64,
      fromWallet: fromWalletAddress,
      toWallet: internalWalletAddress,
      amount: amount,
      mintAddress: OUSDC_MINT_ADDRESS,
      instructions: [
        {
          type: "transfer",
          from: fromWalletAddress,
          to: internalWalletAddress,
          amount: amount,
          token: "oUSDC",
        },
      ],
    });
  } catch (error) {
    console.error("Error creating Solana deposit transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// API to verify and complete the deposit
export async function PUT(req: NextRequest) {
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

    const { transactionSignature, amount } = await req.json();

    if (!transactionSignature || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction signature and amount are required",
        },
        { status: 400 }
      );
    }

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Verify transaction
    const transaction = await connection.getTransaction(transactionSignature, {
      commitment: "confirmed",
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Get user's internal wallet
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData?.internalWallet) {
      return NextResponse.json(
        { success: false, error: "Internal wallet not found" },
        { status: 404 }
      );
    }

    // Update user's internal wallet balance
    const currentOUSDCBalance = userData.internalWallet.oUSDC || 0;
    const newOUSDCBalance = currentOUSDCBalance + amount;

    await userRef.update({
      "internalWallet.oUSDC": newOUSDCBalance,
      updatedAt: new Date(),
    });

    // Record deposit transaction
    const depositId = `SOL_DEP_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const depositTransaction = {
      id: depositId,
      userId: uid,
      amount: amount,
      currency: "oUSDC",
      source: "SOLANA_DEVNET",
      status: "COMPLETED",
      transactionHash: transactionSignature,
      timestamp: new Date(),
      fees: 0,
      notes: `Deposit from Solana devnet: ${transactionSignature}`,
    };

    const depositRef = firebaseDb
      .collection("deposit_transactions")
      .doc(depositId);
    await depositRef.set({
      ...depositTransaction,
      timestamp: depositTransaction.timestamp.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Deposit completed successfully",
      depositId,
      newBalance: newOUSDCBalance,
      transactionSignature,
    });
  } catch (error) {
    console.error("Error completing Solana deposit:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
