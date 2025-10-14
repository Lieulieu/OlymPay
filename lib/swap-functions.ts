import { orcaSwapService } from "@/services/orca-swap.service";
import {
  SwapRequest,
  SwapResponse,
  SwapTransaction,
  SwapQuote,
  TOKEN_ADDRESSES,
} from "@/types/swap";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";

/**
 * Main swap function for oVND -> oUSD
 */
export async function swapOVNDToUSD(
  swapRequest: SwapRequest,
  userId: string
): Promise<SwapResponse> {
  try {
    // Validate swap request
    const validation = await validateSwapRequest(swapRequest);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || "Validation failed",
        error: validation.error,
      };
    }

    // Check if user can perform the swap
    const canSwapResult = await orcaSwapService.canSwap({
      tokenIn: TOKEN_ADDRESSES.oVND,
      tokenOut: TOKEN_ADDRESSES.oUSD,
      amountIn: swapRequest.amount,
      slippage: swapRequest.slippage || 0.5,
      userAddress: swapRequest.userAddress,
      chainId: "solanaDevnet",
    });

    if (!canSwapResult.canSwap) {
      return {
        success: false,
        message: canSwapResult.reason || "Swap not possible",
        error: canSwapResult.reason || "Swap not possible",
      };
    }

    // Get swap quote
    const quote = await orcaSwapService.getSwapQuote({
      tokenIn: TOKEN_ADDRESSES.oVND,
      tokenOut: TOKEN_ADDRESSES.oUSD,
      amountIn: swapRequest.amount,
      slippage: swapRequest.slippage || 0.5,
      userAddress: swapRequest.userAddress,
      chainId: "solanaDevnet",
    });

    // Execute the swap
    const swapResult = await orcaSwapService.executeSwap({
      tokenIn: TOKEN_ADDRESSES.oVND,
      tokenOut: TOKEN_ADDRESSES.oUSD,
      amountIn: swapRequest.amount,
      slippage: swapRequest.slippage || 0.5,
      userAddress: swapRequest.userAddress,
      chainId: "solanaDevnet",
    });

    if (!swapResult.success) {
      return {
        success: false,
        message: swapResult.error || "Swap execution failed",
        error: swapResult.error || "Swap execution failed",
      };
    }

    // Record swap transaction in database
    const swapId = await recordSwapTransaction({
      userId,
      fromToken: "oVND",
      toToken: "oUSD",
      fromAmount: swapRequest.amount,
      toAmount: quote.toAmount,
      exchangeRate: quote.exchangeRate,
      slippage: swapRequest.slippage || 0.5,
      status: "COMPLETED",
      transactionHash: generateMockTransactionHash(),
      notes: `Swap ${swapRequest.amount} oVND → ${quote.toAmount} oUSD via Orca`,
    });

    // Update user's internal wallet balance
    await updateUserWalletBalance(userId, swapRequest.amount, quote.toAmount);

    return {
      success: true,
      message: `Successfully swapped ${swapRequest.amount} oVND → ${quote.toAmount} oUSD`,
      swapId,
      transactionHash: generateMockTransactionHash(),
      exchangeRate: quote.exchangeRate,
      slippage: swapRequest.slippage || 0.5,
    };
  } catch (error) {
    console.error("Error in swapOVNDToUSD:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get swap quote for oVND -> oUSD
 */
export async function getSwapQuote(
  amount: number,
  slippage: number = 0.5,
  userAddress: string
): Promise<SwapQuote | null> {
  try {
    const quote = await orcaSwapService.getSwapQuote({
      tokenIn: TOKEN_ADDRESSES.oVND,
      tokenOut: TOKEN_ADDRESSES.oUSD,
      amountIn: amount,
      slippage,
      userAddress,
      chainId: "solanaDevnet",
    });

    return quote;
  } catch (error) {
    console.error("Error getting swap quote:", error);
    return null;
  }
}

/**
 * Validate swap request
 */
async function validateSwapRequest(swapRequest: SwapRequest): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // Check if amount is positive
  if (swapRequest.amount <= 0) {
    return {
      isValid: false,
      error: "Amount must be greater than 0",
    };
  }

  // Check if slippage is within reasonable bounds
  if (
    swapRequest.slippage &&
    (swapRequest.slippage < 0 || swapRequest.slippage > 50)
  ) {
    return {
      isValid: false,
      error: "Slippage must be between 0 and 50 percent",
    };
  }

  // Check if user address is valid
  if (!swapRequest.userAddress) {
    return {
      isValid: false,
      error: "User address is required",
    };
  }

  // Check if tokens are supported
  if (swapRequest.fromToken !== "oVND" || swapRequest.toToken !== "oUSD") {
    return {
      isValid: false,
      error: "Only oVND -> oUSD swaps are supported",
    };
  }

  return { isValid: true };
}

/**
 * Record swap transaction in database
 */
async function recordSwapTransaction(transactionData: {
  userId: string;
  fromToken: "oVND";
  toToken: "oUSD";
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  slippage: number;
  status: "COMPLETED" | "FAILED" | "PENDING";
  transactionHash?: string;
  notes?: string;
}): Promise<string> {
  try {
    const firebaseDb = db();
    const swapId = `swap_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    const swapRecord: SwapTransaction = {
      id: swapId,
      userId: transactionData.userId,
      fromToken: transactionData.fromToken,
      toToken: transactionData.toToken,
      fromAmount: transactionData.fromAmount,
      toAmount: transactionData.toAmount,
      exchangeRate: transactionData.exchangeRate,
      slippage: transactionData.slippage,
      status: transactionData.status,
      timestamp: new Date(),
      transactionHash: transactionData.transactionHash,
      notes: transactionData.notes,
    };

    await firebaseDb
      .collection("swap_transactions")
      .doc(swapId)
      .set({
        ...swapRecord,
        timestamp: swapRecord.timestamp.toISOString(),
      });

    return swapId;
  } catch (error) {
    console.error("Error recording swap transaction:", error);
    throw new Error("Failed to record swap transaction");
  }
}

/**
 * Update user's internal wallet balance after swap
 */
async function updateUserWalletBalance(
  userId: string,
  oVNDAmount: number,
  oUSDAmount: number
): Promise<void> {
  try {
    const firebaseDb = db();
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(userId);

    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const currentOVNDBalance = userData?.internalWallet?.oVND || 0;
    const currentOUSDBalance = userData?.internalWallet?.oUSDC || 0;

    // Update balances
    await userRef.update({
      "internalWallet.oVND": currentOVNDBalance - oVNDAmount,
      "internalWallet.oUSDC": currentOUSDBalance + oUSDAmount,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating user wallet balance:", error);
    throw new Error("Failed to update wallet balance");
  }
}

/**
 * Get user's swap history
 */
export async function getUserSwapHistory(
  userId: string
): Promise<SwapTransaction[]> {
  try {
    const firebaseDb = db();
    const swapRef = firebaseDb.collection("swap_transactions");

    const snapshot = await swapRef
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const swaps: SwapTransaction[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      swaps.push({
        ...data,
        timestamp: new Date(data.timestamp),
      } as SwapTransaction);
    });

    return swaps;
  } catch (error) {
    console.error("Error getting user swap history:", error);
    return [];
  }
}

/**
 * Get current exchange rate
 */
export async function getCurrentExchangeRate(): Promise<number> {
  try {
    return await orcaSwapService.getCurrentExchangeRate();
  } catch (error) {
    console.error("Error getting exchange rate:", error);
    return 0.00024; // Fallback rate
  }
}

/**
 * Generate mock transaction hash for testing
 */
function generateMockTransactionHash(): string {
  return `orca_swap_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 15)}`;
}

/**
 * Check if user has sufficient balance for swap
 */
export async function checkUserBalance(
  userId: string,
  requiredAmount: number
): Promise<{ hasBalance: boolean; currentBalance: number; error?: string }> {
  try {
    const firebaseDb = db();
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(userId);

    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return {
        hasBalance: false,
        currentBalance: 0,
        error: "User not found",
      };
    }

    const userData = userDoc.data();
    const currentBalance = userData?.internalWallet?.oVND || 0;

    return {
      hasBalance: currentBalance >= requiredAmount,
      currentBalance,
    };
  } catch (error) {
    console.error("Error checking user balance:", error);
    return {
      hasBalance: false,
      currentBalance: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
