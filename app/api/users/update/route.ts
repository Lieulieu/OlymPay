import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { auth, db as firebaseDb } from "@/lib/server/firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { UpdateProfileInput } from "@/schemas/user.schema";
import { Role, UserSession } from "@/types/user";
import { InternalWalletResponse } from "@/types/wallet";
import { badRequest, unauthorized } from "@/utils/server";
import { getSessionUser } from "@/utils/auth";

export async function POST(req: NextRequest) {
  try {
    const userSession = await getSessionUser(req);
    const uid = userSession?.uid;
    if (!uid) return unauthorized("Missing or invalid auth");

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return badRequest("Body must be valid JSON");
    }

    const parsed = UpdateProfileInput.safeParse(json);
    if (!parsed.success) {
      const message =
        parsed.error.issues?.map((i) => i.message).join("; ") ||
        "Invalid payload";
      return badRequest(message);
    }
    const input = parsed.data;

    // whitelist fields
    const profileUpdates: Record<string, unknown> = {};
    if (typeof input.name !== "undefined")
      profileUpdates["profile.name"] = input.name;
    if (typeof input.avatarUrl !== "undefined")
      profileUpdates["profile.avatarUrl"] = input.avatarUrl;
    if (typeof input.bio !== "undefined")
      profileUpdates["profile.bio"] = input.bio;

    if (Object.keys(profileUpdates).length === 0) {
      return badRequest("No updatable fields provided");
    }

    const db = firebaseDb();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);

    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) {
        const baseDoc = {
          uid,
          profile: {
            role: "user" as Role,
            ovndBalance: 0,
            name: input.name,
            avatarUrl: input.avatarUrl,
            bio: input.bio,
          },
          points: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        tx.set(userRef, baseDoc);
        return baseDoc;
      } else {
        tx.update(userRef, {
          ...profileUpdates,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { ...snap.data(), ...profileUpdates };
      }
    });

    const session: UserSession = {
      uid,
      externalWallet: ((updated as any)?.externalWallet as string) ?? "",
      internalWallet: ((updated as any)
        ?.internalWallet as InternalWalletResponse) ?? {
        address: "",
      },
      profile: {
        name: updated?.profile?.name,
        email: updated?.profile?.email,
        phone: updated?.profile?.phone,
        avatarUrl: updated?.profile?.avatarUrl,
        bio: updated?.profile?.bio,
        ovndBalance:
          typeof updated?.profile?.ovndBalance === "number"
            ? updated.profile.ovndBalance
            : 0,
        role: (updated?.profile?.role as Role) ?? "user",
      },
      points: typeof updated?.points === "number" ? updated.points : 0,
    };

    return NextResponse.json({ data: session }, { status: 200 });
  } catch (err) {
    console.error("[/api/users/update] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
