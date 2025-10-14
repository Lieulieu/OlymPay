"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EyeIcon, EyeSlashIcon, ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface RevealPrivateKeyDialogProps {
  chain: 'solana' | 'ethereum';
  onClose: () => void;
}

function RevealPrivateKeyDialog({ chain, onClose }: RevealPrivateKeyDialogProps) {
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = async () => {
    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/wallet/reveal-private-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password,
          chain 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setPrivateKey(data.privateKey);
        toast.success(`${chain} private key revealed`);
      } else {
        toast.error(data.error || 'Failed to reveal private key');
      }
    } catch (error) {
      console.error('Error revealing private key:', error);
      toast.error('Error revealing private key');
    } finally {
      setLoading(false);
    }
  };

  const copyPrivateKey = async () => {
    if (!privateKey) return;
    await navigator.clipboard.writeText(privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.info("Private key copied to clipboard");
  };

  const chainInfo = {
    solana: {
      name: "Solana",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    ethereum: {
      name: "Ethereum", 
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    }
  };

  const info = chainInfo[chain];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`${info.color}`}>
            Reveal {info.name} Private Key
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!privateKey ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                />
              </div>
              
              <div className={`p-3 rounded-lg ${info.bgColor}`}>
                <p className="text-sm text-base-content/70">
                  Enter your password to reveal the {info.name} private key.
                  This action is required for wallet recovery.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleReveal}
                  disabled={loading || !password.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Reveal Private Key"
                  )}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Private Key</Label>
                <div className="relative">
                  <Input
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${info.bgColor}`}>
                <p className="text-sm text-base-content/70">
                  ⚠️ Keep this private key secure and never share it with anyone.
                  Anyone with this key can access your {info.name} wallet.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={copyPrivateKey}
                  disabled={!privateKey}
                  className="flex-1"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RevealPrivateKeyDialog;