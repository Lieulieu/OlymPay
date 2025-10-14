import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";

export async function GET(req: NextRequest) {
  try {
    const firebaseAuth = auth();
    const firebaseDb = db();

    // Get all users to debug
    const usersSnapshot = await firebaseDb.collection(USERS_COLLECTION).get();
    const users: Array<{
      uid: string;
      email: string;
      hasInternalWallet: boolean;
      oUSDCBalance: number;
      oVNDBalance: number;
      walletAddress: string;
      createdAt: string;
      lastUpdated: string;
    }> = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        email: userData.email || "N/A",
        hasInternalWallet: !!userData.internalWallet,
        oUSDCBalance: userData.internalWallet?.oUSDC || 0,
        oVNDBalance: userData.internalWallet?.oVND || 0,
        walletAddress: userData.internalWallet?.addressDigest
          ? "***" + userData.internalWallet.addressDigest.slice(-8)
          : "N/A",
        createdAt: userData.createdAt
          ? userData.createdAt._seconds
            ? new Date(userData.createdAt._seconds * 1000).toISOString()
            : userData.createdAt.toString()
          : "N/A",
        lastUpdated: userData.lastUpdated
          ? userData.lastUpdated._seconds
            ? new Date(userData.lastUpdated._seconds * 1000).toISOString()
            : userData.lastUpdated.toString()
          : "N/A",
      });
    });

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      users: users,
      debugInfo: {
        message:
          "This endpoint shows all users and their internal wallet balances",
        note: "Use this to verify if oUSDC balances are correct",
      },
    });
  } catch (error) {
    console.error("Debug balance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch debug data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "UID is required" },
        { status: 400 }
      );
    }

    const firebaseDb = db();
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      uid: uid,
      userData: {
        email: userData?.email || "N/A",
        hasInternalWallet: !!userData?.internalWallet,
        oUSDCBalance: userData?.internalWallet?.oUSDC || 0,
        oVNDBalance: userData?.internalWallet?.oVND || 0,
        walletAddress: userData?.internalWallet?.addressDigest
          ? "***" + userData.internalWallet.addressDigest.slice(-8)
          : "N/A",
        fullInternalWallet: userData?.internalWallet || null,
        createdAt: userData?.createdAt
          ? userData.createdAt._seconds
            ? new Date(userData.createdAt._seconds * 1000).toISOString()
            : userData.createdAt.toString()
          : "N/A",
        lastUpdated: userData?.lastUpdated
          ? userData.lastUpdated._seconds
            ? new Date(userData.lastUpdated._seconds * 1000).toISOString()
            : userData.lastUpdated.toString()
          : "N/A",
      },
    });
  } catch (error) {
    console.error("Debug user balance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
