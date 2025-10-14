"use client";

import { useMemo, useState } from "react";
import QRCodeSVG from "react-qr-code";
import {
  ClipboardIcon,
  CheckIcon,
  QrCodeIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { useEVMWallet } from "@/hooks/use-evm-wallet";
import { useAuthMethod } from "@/hooks/use-auth-method";
import RevealPrivateKeyDialog from "./RevealPrivateKeyDialog";

export default function EVMWalletSection() {
  const { address, walletLoading, createEVMWallet, refreshMe } =
    useEVMWallet();
  const { canCreateInternalWallet } = useAuthMethod();
  const [copied, setCopied] = useState(false);
  const [showPrivateKeyDialog, setShowPrivateKeyDialog] = useState(false);

  const addressShort = useMemo(() => {
    const a = address || "";
    return a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;
  }, [address]);

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
    toast.info("Olym3 Wallet address copied.");
  };

  return (
    <ProfileSection
      title="EVM Wallet"
      actions={
        address ? (
          <div className="flex gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={copy}
              disabled={!address}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <ClipboardIcon className="h-4 w-4" />
              )}
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowPrivateKeyDialog(true)}
              disabled={!address}
            >
              <KeyIcon className="h-4 w-4" />
              Private Key
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={createEVMWallet}
            disabled={walletLoading || !canCreateInternalWallet}
            title={!canCreateInternalWallet ? "Only available for Google OAuth users" : ""}
          >
            {walletLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <QrCodeIcon className="h-4 w-4" />
            )}
            Create EVM wallet
          </button>
        )
      }
    >
      {walletLoading && (
        <div
          className="skeleton h-40 w-full rounded-xl"
          aria-label="Loading internal wallet"
        />
      )}

      {!walletLoading && !address && (
        <div className="rounded-xl border border-base-300 bg-base-200 p-4 text-sm text-base-content/70">
          {canCreateInternalWallet ? (
            <>
              No internal wallet yet. Click{" "}
              <span className="font-medium">Create wallet</span> to generate a
              custodial address managed by Olympay.
            </>
          ) : (
            <>
              Internal wallet creation is only available for Google OAuth users. 
              Wallet users already have their external wallet connected.
            </>
          )}
        </div>
      )}

      {!walletLoading && address && (
        <article className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="mx-auto w-[160px] rounded bg-white p-2">
            <QRCodeSVG value={address} size={156} />
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-base-content/60">Address</div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm break-all">
                  {addressShort}
                </code>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={copy}
                  aria-label="Copy internal address"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-primary" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="text-xs text-base-content/60 mt-1">
                Share or scan this QR to send tokens to your EVM wallet.
              </div>
            </div>

            <div className="pt-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => refreshMe()}
              >
                Refresh
              </button>
            </div>
          </div>
        </article>
      )}

      {showPrivateKeyDialog && (
        <RevealPrivateKeyDialog
          chain="ethereum"
          onClose={() => setShowPrivateKeyDialog(false)}
        />
      )}
    </ProfileSection>
  );
}
