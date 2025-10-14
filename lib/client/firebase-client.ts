import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function ensureClient() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client SDK can only run in the browser.");
  }
}

function getConfig() {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  for (const [k, v] of Object.entries(cfg)) {
    if (!v) throw new Error(`Missing ${k} (NEXT_PUBLIC_*)`);
  }
  return cfg as Required<typeof cfg>;
}

export function getClientApp(): FirebaseApp {
  ensureClient();
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(getConfig());
  return _app;
}

export function getClientAuth(): Auth {
  ensureClient();
  return (_auth ||= getAuth(getClientApp()));
}

export function getClientDb(): Firestore {
  ensureClient();
  return (_db ||= getFirestore(getClientApp()));
}

export function getClientStorage(): FirebaseStorage {
  ensureClient();
  return (_storage ||= getStorage(getClientApp()));
}