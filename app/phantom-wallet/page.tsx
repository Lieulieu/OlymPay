"use client";

import { useState } from "react";
import {
  generatePhantomWallet,
  generateWalletFromKeypair,
  generateEnvData,
  PhantomWalletData,
} from "@/lib/phantom-wallet-generator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyIcon, EyeIcon, EyeOffIcon, RefreshCcwIcon } from "lucide-react";
import { toast } from "sonner";

export default function PhantomWalletPage() {
  const [walletData, setWalletData] = useState<PhantomWalletData | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingToEnv, setIsSavingToEnv] = useState(false);
  const [isGeneratingAndSaving, setIsGeneratingAndSaving] = useState(false);
  const [existingKeypair, setExistingKeypair] = useState("");

  const handleGenerateWallet = () => {
    setIsGenerating(true);
    try {
      const newWallet = generatePhantomWallet();
      setWalletData(newWallet);
      toast.success("Phantom wallet generated successfully!");
    } catch (error) {
      toast.error("Failed to generate wallet");
      console.error("Error generating wallet:", error);
    }
    setIsGenerating(false);
  };

  const handleGenerateFromKeypair = () => {
    if (!existingKeypair.trim()) {
      toast.error("Please enter a valid keypair base64");
      return;
    }

    setIsGenerating(true);
    try {
      const newWallet = generateWalletFromKeypair(existingKeypair.trim());
      setWalletData(newWallet);
      toast.success("Wallet generated from existing keypair successfully!");
    } catch (error) {
      toast.error("Failed to generate wallet from keypair");
      console.error("Error generating wallet from keypair:", error);
    }
    setIsGenerating(false);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const saveToEnvFile = async () => {
    if (!walletData) return;

    setIsSavingToEnv(true);
    try {
      // Save to server .env file
      const response = await fetch("/api/phantom-wallet/save-env", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(walletData),
      });

      if (response.ok) {
        toast.success("Wallet data saved to .env file successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save to .env file");
      }
    } catch (error) {
      toast.error("Failed to save .env file");
      console.error("Error saving .env file:", error);
    }
    setIsSavingToEnv(false);
  };

  const downloadEnvFile = () => {
    if (!walletData) return;

    try {
      const envData = generateEnvData(walletData);

      // Create a download link for the .env file
      const blob = new Blob([envData], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = ".env";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(".env file downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download .env file");
      console.error("Error downloading .env file:", error);
    }
  };

  const handleGenerateAndSave = async () => {
    setIsGeneratingAndSaving(true);
    try {
      const response = await fetch("/api/phantom-wallet/generate-and-save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keypairBase64: existingKeypair.trim() || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setWalletData(result.walletData);
        toast.success("Wallet generated and saved to .env file successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate and save wallet");
      }
    } catch (error) {
      toast.error("Failed to generate and save wallet");
      console.error("Error generating and saving wallet:", error);
    }
    setIsGeneratingAndSaving(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Phantom Wallet Generator</h1>
        <p className="text-gray-600">
          Generate a new Phantom wallet with 24-character numeric ID
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGenerateWallet}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <RefreshCcwIcon className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCcwIcon className="w-4 h-4 mr-2" />
                Generate New Wallet
              </>
            )}
          </Button>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">
            Generate from Existing Keypair
          </h3>
          <div className="space-y-3">
            <textarea
              value={existingKeypair}
              onChange={(e) => setExistingKeypair(e.target.value)}
              placeholder="Enter your existing keypair in base64 format..."
              className="w-full p-3 border rounded-lg font-mono text-sm"
              rows={3}
            />
            <Button
              onClick={handleGenerateFromKeypair}
              disabled={isGenerating || !existingKeypair.trim()}
              variant="outline"
              className="w-full"
            >
              Generate Wallet from Keypair
            </Button>
            <Button
              onClick={handleGenerateAndSave}
              disabled={isGeneratingAndSaving}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGeneratingAndSaving ? (
                <>
                  <RefreshCcwIcon className="w-4 h-4 mr-2 animate-spin" />
                  Generating & Saving...
                </>
              ) : (
                "Generate & Save to .env"
              )}
            </Button>
          </div>
        </div>
      </div>

      {walletData && (
        <div className="space-y-6">
          {/* Numeric ID */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">
              24-Character Numeric ID
            </h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded font-mono text-lg tracking-wider">
                {walletData.numericId}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(walletData.numericId, "Numeric ID")
                }
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Public Key */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Public Key</h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded font-mono break-all">
                {walletData.publicKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(walletData.publicKey, "Public Key")
                }
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Private Key */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Private Key</h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded font-mono break-all">
                {showPrivateKey ? walletData.privateKey : "•".repeat(88)}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
              >
                {showPrivateKey ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(walletData.privateKey, "Private Key")
                }
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Keypair Hex */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Keypair (Hex)</h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded font-mono break-all text-sm">
                {walletData.keypairHex}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(walletData.keypairHex, "Keypair Hex")
                }
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Keypair Base64 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Keypair (Base64)</h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded font-mono break-all text-sm">
                {walletData.keypairBase64}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(walletData.keypairBase64, "Keypair Base64")
                }
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Mnemonic Phrase */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">
              Mnemonic Phrase (12 words)
            </h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded font-mono">
                {showMnemonic
                  ? walletData.mnemonic
                  : "•".repeat(walletData.mnemonic.length)}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMnemonic(!showMnemonic)}
              >
                {showMnemonic ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(walletData.mnemonic, "Mnemonic Phrase")
                }
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Save to .env */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-3">Save to .env File</h3>
            <p className="text-gray-600 mb-4">
              Save wallet information to .env file for easy integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={saveToEnvFile}
                disabled={isSavingToEnv}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSavingToEnv ? "Saving..." : "Save to Server .env"}
              </Button>
              <Button
                onClick={downloadEnvFile}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Download .env File
              </Button>
            </div>
          </Card>

          {/* Warning */}
          <Card className="p-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold mb-2 text-red-800">
              🚨 Security Warning
            </h3>
            <ul className="text-red-700 space-y-1 text-sm">
              <li>
                • Never share your private key or mnemonic phrase with anyone
              </li>
              <li>• Store your private key securely and offline</li>
              <li>
                • Anyone with access to your private key can control your wallet
              </li>
              <li>
                • This is a test wallet - do not use for mainnet transactions
              </li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
