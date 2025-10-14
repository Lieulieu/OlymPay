"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useInternalBalance } from "@/hooks/use-internal-balance";
 
interface RevealMnemonicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RevealMnemonicDialog({
  open,
  onOpenChange,
}: RevealMnemonicDialogProps) {
  const [password, setPassword] = useState("");
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const { refreshBalance } = useInternalBalance();

  const getAuthToken = async () => {
    try {
      const { getClientAuth } = await import("@/lib/client/firebase-client");
      const auth = getClientAuth();
      const user = auth.currentUser;

      if (!user) return null;

      return await user.getIdToken(true);
    } catch (err) {
      console.error("Error getting auth token:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/wallet/reveal-mnemonic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setMnemonic(data.mnemonic);
        toast.success("Mnemonic revealed successfully");
      } else {
        setError(data.error || "Failed to reveal mnemonic");
      }
    } catch (err) {
      console.error("Error revealing mnemonic:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const copyMnemonic = async () => {
    if (!mnemonic) return;

    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Mnemonic copied to clipboard");
  };

  const handleClose = () => {
    setPassword("");
    setMnemonic(null);
    setError(null);
    setShowMnemonic(false);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 data-[state=open]:animate-fadeIn" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-xl font-semibold mb-2">
            Reveal Mnemonic Phrase
          </Dialog.Title>
          <Dialog.Description className="text-sm text-base-content/70 mb-4">
            Enter your password to reveal your mnemonic phrase. Keep this phrase
            secure and never share it with anyone.
          </Dialog.Description>

          {!mnemonic ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <div className="label">
                  <span className="label-text-alt text-base-content/60">
                    Default password: 123456 (for demo)
                  </span>
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading || !password.trim()}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                  Reveal Mnemonic
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="alert alert-warning">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Security Warning</div>
                  <div className="text-sm">
                    Never share your mnemonic phrase with anyone. Anyone with
                    access to this phrase can control your wallet.
                  </div>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Your Mnemonic Phrase</span>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setShowMnemonic(!showMnemonic)}
                    type="button"
                  >
                    {showMnemonic ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                    {showMnemonic ? "Hide" : "Show"}
                  </button>
                </label>

                <div className="relative">
                  <textarea
                    className="textarea textarea-bordered w-full h-32 font-mono text-sm"
                    value={
                      showMnemonic ? mnemonic : "•".repeat(mnemonic.length)
                    }
                    readOnly
                  />
                  <button
                    className="btn btn-ghost btn-xs absolute top-2 right-2"
                    onClick={copyMnemonic}
                    type="button"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-primary" />
                    ) : (
                      <ClipboardIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setMnemonic(null);
                    setPassword("");
                    setError(null);
                    setShowMnemonic(false);
                  }}
                >
                  Back
                </button>
                <Dialog.Close asChild>
                  <button className="btn btn-primary">Close</button>
                </Dialog.Close>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
