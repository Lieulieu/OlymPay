import { NextResponse } from "next/server";
import { auth, db } from "@/lib/server/firebase-admin";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { USERS_COLLECTION } from "@/config/db";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ I,O,0,1
function genReferralCode(len = 8) {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[buf[i] % ALPHABET.length];
  return out;
}

async function ensureReferralCodeForUser(uid: string) {
  const firebaseDb = db();
  const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const code = genReferralCode(8);
      const codeRef = firebaseDb.collection("referral_codes").doc(code);

      await firebaseDb.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        const existing = userSnap.exists ? userSnap.get("referralCode") : null;
        if (existing) {
          return;
        }

        const codeSnap = await tx.get(codeRef);
        if (codeSnap.exists) throw new Error("DUPLICATE");

        tx.set(codeRef, {
          code,
          inviterId: uid,
          createdAt: Date.now(),
          expiresAt: null,
          maxUses: 999999,
          used: 0,
          active: true,
        });
        tx.set(userRef, { referralCode: code }, { merge: true });
      });

      // trả về mã hiện có (mới tạo hoặc đã có sẵn)
      const final = await userRef.get();
      return final.get("referralCode") as string;
    } catch (e: any) {
      if (e?.message === "DUPLICATE") continue; // thử code khác
      throw e;
    }
  }
  throw new Error("Cannot allocate referral code");
}

export async function POST(req: Request) {
  try {
    const { walletAddress, signature, nonce } = await req.json();
    if (!walletAddress || !signature || !nonce) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const firebaseAuth = auth();
    const firebaseDb = db();

    const ref = firebaseDb.collection("auth_nonces").doc(walletAddress);
    const snap = await ref.get();
    if (!snap.exists || snap.get("nonce") !== nonce) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 401 });
    }

    const message = new TextEncoder().encode(nonce);
    const pubKeyBytes = bs58.decode(walletAddress);
    const sigBytes = bs58.decode(signature);
    const ok = nacl.sign.detached.verify(message, sigBytes, pubKeyBytes);
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const uid = walletAddress;
    const userRef = firebaseDb.collection(USERS_COLLECTION).doc(uid);
    await userRef.set(
      {
        externalWallet: walletAddress,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      },
      { merge: true }
    );

    const referralCode = await ensureReferralCodeForUser(uid);

    const token = await firebaseAuth.createCustomToken(uid, {
      wallet: walletAddress,
    });

    await ref.delete();

    return NextResponse.json({ token, referralCode });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Auth failed" },
      { status: 400 }
    );
  }
}
