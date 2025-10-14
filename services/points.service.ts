import { FieldValue } from "firebase-admin/firestore";
import {
  LOYALTY_BALANCE_COLLECTION,
  LOYALTY_EVENTS_COLLECTION,
  LOYALTY_IDEMPOTENCY_COLLECTION,
  LOYALTY_LOCKS_COLLECTION,
  LOYALTY_TOPUP_BATCHES_COLLECTION,
  USERS_COLLECTION,
} from "@/config/db";
import { POINTS_REASON } from "@/config/rewards";
import { WalletAddress } from "@/types/wallet";
import { emptyBalance, toInt } from "@/utils/loyalty";
import { RATE_SPEND } from "@/config/loyalty";
import { db } from "@/lib/server/firebase-admin";
import { LoyaltyBalance, LoyaltyEventType } from "@/types/loyalty";
import { toDate } from "@/utils/date";
import { hashWalletAddress } from "@/lib/server/crypto";

export async function awardReferralPoints(params: {
  walletAddress: WalletAddress;
  amount: number;
  redemptionId: string;
  meta?: Record<string, any>;
}) {
  const { walletAddress, amount, redemptionId, meta } = params;

  if (!walletAddress || !amount || !redemptionId) {
    throw new Error("walletAddress, amount, and redemptionId are required");
  }

  const hashedAddress = hashWalletAddress(walletAddress);

  try {
    const firestore = db();
    await firestore.runTransaction(async (tx) => {
      const colBalance = firestore.collection(LOYALTY_BALANCE_COLLECTION);
      const colEvents = firestore.collection(LOYALTY_EVENTS_COLLECTION);
      const colIdempotency = firestore.collection(
        LOYALTY_IDEMPOTENCY_COLLECTION
      );

      const balRef = colBalance.doc(hashedAddress);
      const idemRef = colIdempotency.doc(`AWARD_${redemptionId}`);

      const [idemSnap, balSnap] = await Promise.all([
        tx.get(idemRef),
        tx.get(balRef),
      ]);

      if (idemSnap.exists) {
        throw new Error("IDEMPOTENT_APPLIED");
      }

      const cur = balSnap.exists ? balSnap.data()! : {};

      // Create idempotency record
      tx.create(idemRef, {
        walletAddress: hashedAddress,
        type: "AWARD" as LoyaltyEventType,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update loyalty balance - award points are immediately spendable
      const nextSpendable = (cur.opSpendable ?? 0) + amount;
      const nextLifetime = (cur.opLifetime ?? 0) + amount;

      tx.set(
        balRef,
        {
          walletAddress: hashedAddress,
          opSpendable: nextSpendable,
          opPending: cur.opPending ?? 0,
          opLifetime: nextLifetime,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Create loyalty event
      const evRef = colEvents.doc();
      tx.set(evRef, {
        walletAddress: hashedAddress,
        type: "AWARD" as LoyaltyEventType,
        amount,
        createdAt: FieldValue.serverTimestamp(),
        meta: {
          redemptionId,
          reason: POINTS_REASON.REFERRAL_INVITE,
          ...meta,
        },
      });
    });
  } catch (e: any) {
    if (/IDEMPOTENT_APPLIED/.test(String(e?.message))) {
      return {
        ok: true as const,
        awarded: 0,
        balance: await getBalanceSnapshot(walletAddress),
      };
    }
    throw e;
  }

  const balance = await getBalanceSnapshot(walletAddress);
  return { ok: true as const, awarded: amount, balance };
}

// Legacy function for backward compatibility - now uses OP system
export async function awardReferralInvitePointsInTx(
  tx: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  inviterId: string,
  redemptionId: string,
  points: number,
  meta?: Record<string, any>
) {
  // This function is now deprecated - use awardReferralPoints instead
  // Keeping for backward compatibility but should be migrated
  const userRef = db.collection(USERS_COLLECTION).doc(inviterId);
  const ledgerRef = db
    .collection("point_ledger")
    .doc(`referral_${redemptionId}`);

  const ledgerSnap = await tx.get(ledgerRef);
  if (ledgerSnap.exists) return;

  tx.set(userRef, { points: FieldValue.increment(points) }, { merge: true });

  tx.set(ledgerRef, {
    userId: inviterId,
    points,
    reason: POINTS_REASON.REFERRAL_INVITE,
    sourceId: redemptionId,
    createdAt: FieldValue.serverTimestamp(),
    meta: meta ?? null,
  });
}

export async function spendPoints(params: {
  walletAddress: WalletAddress;
  amountUsd: number;
  orderId?: string;
  maxBatchesToScan?: number;
  now?: Date | null;
}) {
  const now = params.now ?? new Date();
  const amount = toInt(params.amountUsd) * RATE_SPEND;
  if (!params.walletAddress || !amount)
    throw new Error("walletAddress & amountUsd required");

  let matchedTotal = 0;

  try {
    const firestore = db();
    await firestore.runTransaction(async (tx) => {
      const colBalance = firestore.collection(LOYALTY_BALANCE_COLLECTION);
      const colBatches = firestore.collection(LOYALTY_TOPUP_BATCHES_COLLECTION);
      const colEvents = firestore.collection(LOYALTY_EVENTS_COLLECTION);

      const balRef = colBalance.doc(params.walletAddress);
      const idemRef = params.orderId
        ? firestore
            .collection(LOYALTY_IDEMPOTENCY_COLLECTION)
            .doc(`SPEND_${params.orderId}`)
        : null;

      const q = colBatches
        .where("walletAddress", "==", params.walletAddress)
        .where("remaining", ">", 0)
        .orderBy("createdAt", "asc")
        .limit(params.maxBatchesToScan ?? 200);

      const [idemSnap, balSnap, batchesSnap] = await Promise.all([
        idemRef ? tx.get(idemRef) : Promise.resolve(null as any),
        tx.get(balRef),
        tx.get(q),
      ]);

      if (idemSnap?.exists) {
        throw new Error("IDEMPOTENT_APPLIED");
      }

      const cur = balSnap.exists ? balSnap.data()! : {};
      const pendingBefore: number = cur.opPending ?? 0;

      let toMatch = Math.min(amount, pendingBefore);
      const batchUpdates: Array<{
        ref: FirebaseFirestore.DocumentReference;
        take: number;
      }> = [];

      for (const doc of batchesSnap.docs) {
        if (toMatch <= 0) break;
        const b = doc.data() as any;
        const take = Math.min(b.remaining, toMatch);
        if (take > 0) {
          matchedTotal += take;
          toMatch -= take;
          batchUpdates.push({ ref: doc.ref, take });
        }
      }

      if (idemRef) {
        tx.create(idemRef, {
          walletAddress: params.walletAddress,
          type: "SPEND" as LoyaltyEventType,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      for (const u of batchUpdates) {
        tx.update(u.ref, { remaining: FieldValue.increment(-u.take) });
      }

      const nextSpendable = (cur.opSpendable ?? 0) + amount + matchedTotal;
      const nextPending = Math.max(0, pendingBefore - matchedTotal);
      const nextLifetime = (cur.opLifetime ?? 0) + amount;

      tx.set(
        balRef,
        {
          walletAddress: params.walletAddress,
          opSpendable: nextSpendable,
          opPending: nextPending,
          opLifetime: nextLifetime,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const evRef = colEvents.doc();
      tx.set(evRef, {
        walletAddress: params.walletAddress,
        type: "SPEND" as LoyaltyEventType,
        amount,
        createdAt: FieldValue.serverTimestamp(),
        meta: {
          orderId: params.orderId ?? null,
          matchedFromTopup: matchedTotal,
          instantRelease: true,
        },
      });
    });
  } catch (e: any) {
    if (/IDEMPOTENT_APPLIED/.test(String(e?.message))) {
      return {
        ok: true as const,
        matchedFromTopup: 0,
        balance: await getBalanceSnapshot(params.walletAddress),
      };
    }
    throw e;
  }

  const balance = await getBalanceSnapshot(params.walletAddress);
  return { ok: true as const, matchedFromTopup: matchedTotal, balance };
}

export async function releaseDueLocks(params?: {
  now?: Date | null;
  pageSize?: number;
}) {
  const now = params?.now ?? new Date();
  const pageSize = params?.pageSize ?? 100;
  const firestore = db();

  const colLocks = firestore.collection(LOYALTY_LOCKS_COLLECTION);
  const colBalance = firestore.collection(LOYALTY_BALANCE_COLLECTION);
  const colEvents = firestore.collection(LOYALTY_EVENTS_COLLECTION);

  const due = await colLocks
    .where("released", "==", false)
    .where("unlockAt", "<=", now)
    .orderBy("unlockAt", "asc")
    .limit(pageSize)
    .get();

  let processed = 0;

  for (const doc of due.docs) {
    const lock = doc.data() as any;
    const walletAddress: WalletAddress = lock.walletAddress;
    const amount: number = lock.amount;

    await firestore.runTransaction(async (tx) => {
      const balRef = colBalance.doc(walletAddress);
      const balSnap = await tx.get(balRef);
      const cur = balSnap.exists ? balSnap.data()! : {};

      if (lock.released) return;

      tx.update(balRef, {
        opSpendable: (cur.opSpendable ?? 0) + amount,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(doc.ref, { released: true });

      const evRef = colEvents.doc();
      tx.set(evRef, {
        walletAddress,
        type: "RELEASE" as LoyaltyEventType,
        amount,
        createdAt: FieldValue.serverTimestamp(),
        meta: { lockId: doc.id },
      });
    });

    processed++;
  }

  return { ok: true as const, processed };
}

export async function releasePendingDue(params?: {
  now?: Date;
  pageSize?: number;
}) {
  const now = params?.now ?? new Date();
  const pageSize = params?.pageSize ?? 100;

  const firestore = db();
  const colBatches = firestore.collection(LOYALTY_TOPUP_BATCHES_COLLECTION);
  const colBalance = firestore.collection(LOYALTY_BALANCE_COLLECTION);
  const colEvents = firestore.collection(LOYALTY_EVENTS_COLLECTION);

  const dueSnap = await colBatches
    .where("unlockAt", "<=", now)
    .orderBy("unlockAt", "asc")
    .limit(pageSize)
    .get();

  let processed = 0;
  let releasedTotal = 0;

  for (const doc of dueSnap.docs) {
    const b = doc.data() as any;
    const remaining: number = b.remaining ?? 0;
    if (remaining <= 0) continue;

    const walletAddress: WalletAddress = b.walletAddress;

    await firestore.runTransaction(async (tx) => {
      const balRef = colBalance.doc(walletAddress);
      const balSnap = await tx.get(balRef);
      const cur = balSnap.exists ? balSnap.data()! : {};

      tx.update(doc.ref, { remaining: 0 });

      tx.set(
        balRef,
        {
          walletAddress,
          opSpendable: (cur.opSpendable ?? 0) + remaining,
          opPending: Math.max(0, (cur.opPending ?? 0) - remaining),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const evRef = colEvents.doc();
      tx.set(evRef, {
        walletAddress,
        type: "RELEASE" as LoyaltyEventType,
        amount: remaining,
        createdAt: FieldValue.serverTimestamp(),
        meta: { kind: "pending", batchId: doc.id },
      });
    });

    processed++;
    releasedTotal += remaining;
  }

  return { ok: true as const, processed, releasedTotal };
}

export async function withdrawTopup(params: {
  walletAddress: WalletAddress;
  amountUsd: number;
  withdrawId?: string;
  maxBatchesToScan?: number;
}) {
  const amount = toInt(params.amountUsd);
  if (!params.walletAddress || !amount)
    throw new Error("walletAddress & amountUsd required");

  let withdrawn = 0;
  const firestore = db();
  const colBalance = firestore.collection(LOYALTY_BALANCE_COLLECTION);
  const colBatches = firestore.collection(LOYALTY_TOPUP_BATCHES_COLLECTION);
  const colEvents = firestore.collection(LOYALTY_EVENTS_COLLECTION);

  try {
    await firestore.runTransaction(async (tx) => {
      const balRef = colBalance.doc(params.walletAddress);
      const idemRef = params.withdrawId
        ? firestore
            .collection(LOYALTY_IDEMPOTENCY_COLLECTION)
            .doc(`WITHDRAW_${params.withdrawId}`)
        : null;

      const q = colBatches
        .where("walletAddress", "==", params.walletAddress)
        .where("remaining", ">", 0)
        .orderBy("createdAt", "asc")
        .limit(params.maxBatchesToScan ?? 200);

      const [idemSnap, balSnap, batchesSnap] = await Promise.all([
        idemRef ? tx.get(idemRef) : Promise.resolve(null as any),
        tx.get(balRef),
        tx.get(q),
      ]);

      if (idemSnap?.exists) throw new Error("IDEMPOTENT_APPLIED");

      const cur = balSnap.exists ? balSnap.data()! : {};

      let toTake = amount;
      const batchUpdates: Array<{
        ref: FirebaseFirestore.DocumentReference;
        take: number;
      }> = [];

      for (const d of batchesSnap.docs) {
        if (toTake <= 0) break;
        const b = d.data() as any;
        const take = Math.min(b.remaining, toTake);
        if (take > 0) {
          withdrawn += take;
          toTake -= take;
          batchUpdates.push({ ref: d.ref, take });
        }
      }

      if (idemRef) {
        tx.create(idemRef, {
          walletAddress: params.walletAddress,
          type: "WITHDRAW" as LoyaltyEventType,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      for (const u of batchUpdates) {
        tx.update(u.ref, { remaining: FieldValue.increment(-u.take) });
      }

      tx.set(
        balRef,
        {
          walletAddress: params.walletAddress,
          opPending: Math.max(0, (cur.opPending ?? 0) - withdrawn),
          opLifetime: Math.max(0, (cur.opLifetime ?? 0) - withdrawn),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const evRef = colEvents.doc();
      tx.set(evRef, {
        walletAddress: params.walletAddress,
        type: "WITHDRAW" as LoyaltyEventType,
        amount: withdrawn,
        createdAt: FieldValue.serverTimestamp(),
        meta: { withdrawId: params.withdrawId ?? null },
      });
    });
  } catch (e: any) {
    if (/IDEMPOTENT_APPLIED/.test(String(e?.message))) {
      return {
        ok: true as const,
        withdrawn: 0,
        balance: await getBalanceSnapshot(params.walletAddress),
      };
    }
    throw e;
  }

  const balance = await getBalanceSnapshot(params.walletAddress);
  return { ok: true as const, withdrawn, balance };
}

async function getBalanceSnapshot(
  walletAddress: WalletAddress
): Promise<LoyaltyBalance> {
  const firestore = db();
  const colBalance = firestore.collection(LOYALTY_BALANCE_COLLECTION);
  const hashedAddress = hashWalletAddress(walletAddress);
  const snap = await colBalance.doc(hashedAddress).get();

  if (!snap.exists) return emptyBalance(walletAddress);
  const d = snap.data()!;
  return {
    walletAddress,
    opSpendable: d.opSpendable ?? 0,
    opPending: d.opPending ?? 0,
    opLifetime: d.opLifetime ?? 0,
    updatedAt: toDate(d.updatedAt),
  };
}
