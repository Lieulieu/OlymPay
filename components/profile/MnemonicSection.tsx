"use client";

import { useState } from "react";
import { KeyIcon } from "@heroicons/react/24/outline";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { useAuthMethod } from "@/hooks/use-auth-method";
import { useInternalWallet } from "@/hooks/use-internal-wallet";
import RevealMnemonicDialog from "./RevealMnemonicDialog";

export default function MnemonicSection() {
  const { canCreateInternalWallet } = useAuthMethod();
  const { address } = useInternalWallet();
  const [showMnemonicDialog, setShowMnemonicDialog] = useState(false);

  // Chỉ hiển thị cho Google OAuth users và khi đã có Solana wallet
  if (!canCreateInternalWallet || !address) {
    return null;
  }

  return (
    <>
      <ProfileSection
        title="Mnemonic Phrase"
        actions={
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowMnemonicDialog(true)}
          >
            <KeyIcon className="h-4 w-4" />
            Show Mnemonic
          </button>
        }
      >
        <div className="rounded-xl border border-base-300 bg-base-200 p-4 text-sm text-base-content/70">
          <div className="flex items-start gap-3">
            <KeyIcon className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-base-content">
                Your wallet recovery phrase
              </p>
              <p className="mt-1">
                Click "Show Mnemonic" to reveal your 12-word recovery phrase. 
                Keep it safe and never share it with anyone.
              </p>
              <div className="mt-2 text-xs text-warning">
                ⚠️ Anyone with access to this phrase can control your wallet
              </div>
            </div>
          </div>
        </div>
      </ProfileSection>

      <RevealMnemonicDialog
        open={showMnemonicDialog}
        onOpenChange={setShowMnemonicDialog}
      />
    </>
  );
}
