"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/client/firebase-client";
import { toast } from "sonner";
import { UserSession } from "@/types/user";
import { signNonceWithWallet } from "@/utils/wallet";
import { safeJson } from "@/utils/json";
import { MAIN_ORIGIN } from "@/config/auth";

type CompleteAuthResponse =
  | {
      ok: true;
      token: string;
      user: {
        uid: string;
        externalWallet: string;
        internalWallet?: { address?: string | null };
        profile?: Record<string, any>;
        points?: number;
      };
    }
  | { ok: false; error: string };

type UserState = {
  currentUser: UserSession | null;
  loading: boolean;
  walletLoading: boolean;
  loginWithAddress: (addressBase58: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (partial: Record<string, any>) => Promise<void>;
  refreshMe: () => Promise<void>;
  createInternalWallet: () => Promise<void>;
  loginWithGoogle: (googleUser: any) => Promise<void>;
  loginWithMetaMask: (walletAddress: string) => Promise<void>;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      loading: false,
      walletLoading: false,

      loginWithAddress: async (addressBase58: string) => {
        let signedIn = false;
        try {
          set({ loading: true });

          const nonceRes = await fetch("/api/auth/nonce", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: addressBase58 }),
          });

          if (!nonceRes.ok) {
            const t = await safeJson(nonceRes);
            throw new Error(t?.error || "Failed to get nonce");
          }
          const { nonce } = await nonceRes.json();
          if (!nonce) throw new Error("Nonce not returned");

          const signature = await signNonceWithWallet(nonce);
          if (!signature)
            throw new Error("User canceled signing or no signature");

          const completeRes = await fetch("/api/auth/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress: addressBase58,
              signature,
              nonce,
            }),
          });

          const completeJson: CompleteAuthResponse = await safeJson(
            completeRes
          );

          if (!completeRes.ok || !completeJson || completeJson.ok !== true) {
            throw new Error(
              (completeJson as any)?.error || "Authentication failed on server"
            );
          }

          const { token, user: srvUser } = completeJson as any;
          if (!token) throw new Error("No Firebase token returned");

          const clientAuth = getClientAuth();
          await signInWithCustomToken(clientAuth, token);
          const idToken = await clientAuth.currentUser?.getIdToken(true);

          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          let user = srvUser;
          if (!user) {
            const meRes = await fetch("/api/users/me", {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            const meJson = await meRes.json().catch(() => ({}));
            if (meRes.ok && meJson?.data) {
              user = meJson.data;
            } else {
              user = {
                uid: addressBase58,
                externalWallet: addressBase58,
                internalWallet: { address: null },
                profile: {},
                points: 0,
              };
            }
          }

          set({
            currentUser: {
              uid: user.uid || addressBase58,
              externalWallet: user.externalWallet || addressBase58,
              internalWallet: { address: user.internalWallet?.address ?? null },
              profile: user.profile ?? {},
              points: user.points ?? 0,
              authMethod: user.authMethod || 'wallet', // Use authMethod from server or default to wallet
            },
          });
          signedIn = true;

          if (!user.internalWallet?.address) {
            try {
              await get().createInternalWallet();
            } catch (e) {
              console.error(e);
              toast.error(
                "Could not auto-create internal wallet. You can retry from Profile."
              );
            }
          }

          toast.success("Connected & signed in.");
        } catch (e: any) {
          console.error(e);
          if (signedIn) {
            try {
              const clientAuth = getClientAuth();
              await signOut(clientAuth);
            } catch {}
          }
          set({ currentUser: null });
          toast.error(e?.message || "Login failed.");
          throw e;
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        try {
          const clientAuth = getClientAuth();
          await signOut(clientAuth);
          set({ currentUser: null });
        } catch (e) {
          console.error(e);
        }
      },

      updateProfile: async (partial: Record<string, any>) => {
        try {
          const clientAuth = getClientAuth();
          const idToken = await clientAuth.currentUser?.getIdToken();
          if (!idToken) throw new Error("Not authenticated");

          const res = await fetch("/api/users/update", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(partial),
          });

          const json = await safeJson(res);
          if (!res.ok) throw new Error(json?.error || "Failed to update profile");

          await get().refreshMe();
          toast.success("Profile updated.");
        } catch (e: any) {
          console.error(e);
          toast.error(e?.message || "Failed to update profile.");
          throw e;
        }
      },

      refreshMe: async () => {
        try {
          const clientAuth = getClientAuth();
          const idToken = await clientAuth.currentUser?.getIdToken();
          if (!idToken) return;

          const res = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          const me = await safeJson(res);
          if (!res.ok) throw new Error(me?.error || "Failed to load profile");

          const prev = get().currentUser;
          set({
            currentUser: {
              uid: me?.data?.uid ?? prev?.uid ?? "",
              externalWallet:
                me?.data?.externalWallet ?? prev?.externalWallet ?? "",
              authMethod: me?.data?.authMethod ?? prev?.authMethod ?? 'wallet',
              internalWallet: {
                address:
                  me?.data?.internalWallet?.address ??
                  prev?.internalWallet?.address ??
                  null,
                evmAddress:
                  me?.data?.internalWallet?.evmAddress ??
                  prev?.internalWallet?.evmAddress ??
                  null,
              },
              profile: me?.data?.profile ?? prev?.profile ?? {},
              points: me?.data?.points ?? prev?.points ?? 0,
            },
          });
        } catch (e) {
          console.error(e);
        }
      },

      createInternalWallet: async () => {
        try {
          set({ walletLoading: true });
          const clientAuth = getClientAuth();
          const idToken = await clientAuth.currentUser?.getIdToken();
          if (!idToken) throw new Error("Not authenticated");

          const res = await fetch("/api/wallet/create", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          });

          const json = await safeJson(res);
          if (!res.ok || !json?.address) {
            throw new Error(json?.error || "Failed to create internal wallet");
          }

          await get().refreshMe();

          toast.success("Internal wallet is ready.");
        } catch (e: any) {
          console.error(e);
          toast.error(e?.message || "Failed to create internal wallet.");
          throw e;
        } finally {
          set({ walletLoading: false });
        }
      },


      loginWithGoogle: async (googleUser: any) => {
        let signedIn = false;
        try {
          set({ loading: true });

          // Complete Google authentication
          const completeRes = await fetch("/api/auth/complete-google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ googleUser }),
          });

          const completeJson: CompleteAuthResponse = await safeJson(completeRes);

          if (!completeRes.ok || !completeJson || completeJson.ok !== true) {
            throw new Error(
              (completeJson as any)?.error || "Google authentication failed"
            );
          }

          const { token, user: srvUser } = completeJson as any;
          if (!token) throw new Error("No Firebase token returned");

          const clientAuth = getClientAuth();
          await signInWithCustomToken(clientAuth, token);
          const idToken = await clientAuth.currentUser?.getIdToken(true);

          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          let user = srvUser;
          if (!user) {
            const meRes = await fetch("/api/users/me", {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            const meJson = await meRes.json().catch(() => ({}));
            if (meRes.ok && meJson?.data) {
              user = meJson.data;
            } else {
              user = {
                uid: googleUser.uid,
                email: googleUser.email,
                displayName: googleUser.displayName,
                photoURL: googleUser.photoURL,
                emailVerified: googleUser.emailVerified,
                internalWallet: { address: null },
                profile: {},
                points: 0,
              };
            }
          }

          set({
            currentUser: {
              uid: user.uid || googleUser.uid,
              externalWallet: user.externalWallet || '',
              internalWallet: { address: user.internalWallet?.address ?? null },
              profile: user.profile ?? {},
              points: user.points ?? 0,
              authMethod: user.authMethod || 'google', // Use authMethod from server or default to google
            },
          });
          signedIn = true;

          toast.success("Signed in with Google!");
        } catch (e: any) {
          console.error(e);
          if (signedIn) {
            try {
              const clientAuth = getClientAuth();
              await signOut(clientAuth);
            } catch {}
          }
          set({ currentUser: null });
          toast.error(e?.message || "Google sign in failed.");
          throw e;
        } finally {
          set({ loading: false });
        }
      },

      loginWithMetaMask: async (walletAddress: string) => {
        let signedIn = false;
        try {
          set({ loading: true });

          // Get nonce for MetaMask
          const nonceRes = await fetch("/api/auth/nonce", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress }),
          });

          if (!nonceRes.ok) {
            const t = await safeJson(nonceRes);
            throw new Error(t?.error || "Failed to get nonce");
          }
          const { nonce } = await nonceRes.json();
          if (!nonce) throw new Error("Nonce not returned");

          // Sign message with MetaMask
          const message = `Sign this message to authenticate with OlymPay: ${nonce}`;
          const signature = await (window as any).ethereum.request({
            method: 'personal_sign',
            params: [message, walletAddress],
          });

          if (!signature) {
            throw new Error("User canceled signing");
          }

          // Complete MetaMask authentication
          const completeRes = await fetch("/api/auth/complete-metamask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress,
              signature,
              nonce,
              walletType: 'metamask',
              chain: 'ethereum'
            }),
          });

          const completeJson: CompleteAuthResponse = await safeJson(completeRes);

          if (!completeRes.ok || !completeJson || completeJson.ok !== true) {
            throw new Error(
              (completeJson as any)?.error || "MetaMask authentication failed"
            );
          }

          const { token, user: srvUser } = completeJson as any;
          if (!token) throw new Error("No Firebase token returned");

          const clientAuth = getClientAuth();
          await signInWithCustomToken(clientAuth, token);
          const idToken = await clientAuth.currentUser?.getIdToken(true);

          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          let user = srvUser;
          if (!user) {
            const meRes = await fetch("/api/users/me", {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            const meJson = await meRes.json().catch(() => ({}));
            if (meRes.ok && meJson?.data) {
              user = meJson.data;
            } else {
              user = {
                uid: walletAddress,
                externalWallet: walletAddress,
                internalWallet: { address: null },
                profile: {},
                points: 0,
              };
            }
          }

          set({
            currentUser: {
              uid: user.uid || walletAddress,
              externalWallet: user.externalWallet || walletAddress,
              internalWallet: { address: user.internalWallet?.address ?? null },
              profile: user.profile ?? {},
              points: user.points ?? 0,
              authMethod: user.authMethod || 'metamask', // Use authMethod from server or default to metamask
            },
          });
          signedIn = true;

          toast.success("Connected & signed in with MetaMask!");
        } catch (e: any) {
          console.error(e);
          if (signedIn) {
            try {
              const clientAuth = getClientAuth();
              await signOut(clientAuth);
            } catch {}
          }
          set({ currentUser: null });
          toast.error(e?.message || "MetaMask sign in failed.");
          throw e;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "olympay-user",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
