import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { awardReferralPoints } from "@/services/points.service";
import { REFERRAL_REWARD_POINTS } from "@/config/rewards";
import {
  REFERRAL_CODES_COLLECTION,
  REFERRAL_REDEMPTIONS_BY_USER_COLLECTION,
  REFERRAL_REDEMPTIONS_COLLECTION,
  USERS_COLLECTION,
} from "@/config/db";

const BodySchema = z.object({ code: z.string().min(4).max(32) });
class RedeemError extends Error {
  constructor(public code: string, public status = 400) {
    super(code);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { ok: false, error: "INVALID_BODY" },
        { status: 400 }
      );

    const codeRaw = parsed.data.code.trim().toUpperCase();
    const token = (req.headers.get("authorization") || "").replace(
      "Bearer ",
      ""
    );
    if (!token)
      return NextResponse.json(
        { ok: false, error: "UNAUTHENTICATED" },
        { status: 401 }
      );

    const firebaseAuth = auth();
    const decoded = await firebaseAuth.verifyIdToken(token).catch(() => null);
    if (!decoded)
      return NextResponse.json(
        { ok: false, error: "INVALID_TOKEN" },
        { status: 401 }
      );
    const inviteeId = decoded.uid;

    const firebaseDb = db();
    const codeRef = firebaseDb
      .collection(REFERRAL_CODES_COLLECTION)
      .doc(codeRaw);
    const redemptionId = `${codeRaw}_${inviteeId}`;
    const redemptionRef = firebaseDb
      .collection(REFERRAL_REDEMPTIONS_COLLECTION)
      .doc(redemptionId);
    const userRedeemRef = firebaseDb
      .collection(REFERRAL_REDEMPTIONS_BY_USER_COLLECTION)
      .doc(inviteeId);

    let inviterId: string | null = null;

    await firebaseDb.runTransaction(async (tx) => {
      const [codeSnap, redeemSnap, userRedeemSnap] = await Promise.all([
        tx.get(codeRef),
        tx.get(redemptionRef),
        tx.get(userRedeemRef),
      ]);

      if (!codeSnap.exists) throw new RedeemError("INVALID_CODE", 404);
      const data = codeSnap.data() as any;
      inviterId = data.inviterId ?? null;
      if (!data.active) throw new RedeemError("CODE_INACTIVE");
      const expiresAt: Date | null = data.expiresAt
        ? data.expiresAt instanceof Timestamp
          ? data.expiresAt.toDate()
          : new Date(data.expiresAt)
        : null;
      if (expiresAt && expiresAt.getTime() < Date.now())
        throw new RedeemError("CODE_EXPIRED");
      if (inviterId && inviterId === inviteeId)
        throw new RedeemError("SELF_INVITE_NOT_ALLOWED");

      if (userRedeemSnap.exists) {
        const prev = userRedeemSnap.data() as any;
        if (prev.code === codeRaw) return;
        throw new RedeemError("ALREADY_REDEEMED_BY_USER", 409);
      }

      const used = Number(data.used ?? 0);
      const maxUses = Number(data.maxUses ?? 1);
      if (!Number.isFinite(used) || !Number.isFinite(maxUses))
        throw new RedeemError("CODE_BROKEN");
      if (used >= maxUses) throw new RedeemError("CODE_EXHAUSTED", 410);
      if (redeemSnap.exists) return;

      tx.update(codeRef, { used: FieldValue.increment(1) });
      tx.set(redemptionRef, {
        code: codeRaw,
        inviterId: inviterId || null,
        inviteeId,
        redeemedAt: FieldValue.serverTimestamp(),
      });
      tx.set(userRedeemRef, {
        inviteeId,
        code: codeRaw,
        inviterId: inviterId || null,
        redeemedAt: FieldValue.serverTimestamp(),
      });

      // Award points will be handled outside the transaction using the new OP system
    });

    // Award points using the new OP loyalty system
    if (inviterId) {
      try {
        // Get the inviter's wallet address
        const inviterRef = firebaseDb
          .collection(USERS_COLLECTION)
          .doc(inviterId);
        const inviterSnap = await inviterRef.get();

        if (inviterSnap.exists) {
          const inviterData = inviterSnap.data()!;
          const walletAddress = inviterData.externalWallet;

          if (walletAddress) {
            await awardReferralPoints({
              walletAddress,
              amount: REFERRAL_REWARD_POINTS,
              redemptionId,
              meta: { code: codeRaw, inviteeId },
            });
          }
        }
      } catch (awardError) {
        console.error("Failed to award referral points:", awardError);
        // Don't fail the entire redemption if awarding fails
        // The redemption was successful, just the points award failed
      }
    }

    return NextResponse.json({ ok: true, code: codeRaw, inviterId });
  } catch (e: any) {
    if (e instanceof RedeemError) {
      return NextResponse.json(
        { ok: false, error: e.code },
        { status: e.status }
      );
    }
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
