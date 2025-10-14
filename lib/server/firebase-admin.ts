import {
  initializeApp,
  cert,
  getApps,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App | null = null;

function resolveCredential() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    try {
      const json = Buffer.from(b64, "base64").toString("utf8");
      const sa = JSON.parse(json);
      if (
        typeof sa.private_key === "string" &&
        sa.private_key.includes("\\n")
      ) {
        sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      }
      return cert(sa);
    } catch (e) {
      console.error(
        "[Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT_B64:",
        e
      );
    }
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      const sa = JSON.parse(raw);
      if (
        typeof sa.private_key === "string" &&
        sa.private_key.includes("\\n")
      ) {
        sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      }
      return cert(sa);
    } catch (e) {
      console.error("[Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT:", e);
    }
  }

  const path = process.env.FIREBASE_CREDENTIALS_PATH;
  if (path) {
    try {
      const fs = require("fs");
      const sa = JSON.parse(fs.readFileSync(path, "utf8"));
      if (
        typeof sa.private_key === "string" &&
        sa.private_key.includes("\\n")
      ) {
        sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      }
      return cert(sa);
    } catch (e) {
      console.error(
        "[Firebase Admin] Cannot read FIREBASE_CREDENTIALS_PATH:",
        e
      );
    }
  }

  try {
    return applicationDefault();
  } catch {
    return undefined;
  }
}

function ensureApp() {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const credential = resolveCredential();
  app = credential ? initializeApp({ credential }) : initializeApp();
  return app;
}

export function auth() {
  const a = ensureApp();
  return getAuth(a);
}

export function db() {
  const a = ensureApp();
  return getFirestore(a);
}
