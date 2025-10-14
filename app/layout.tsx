import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL("https://olympay-sol.vercel.app"),
  title: "OlymPay- Cross-Chain Payment Infrastructure",
  description:
    "Seamless payments on U2U Network, Solana and Base Network with algorithmic stability, instant settlement, and ultra-low fees.",
  keywords: "U2U Network, Solana, Base, cross-chain, payments, DeFi, blockchain",
  authors: [{ name: "OlymPay" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "OlymPay - Cross-Chain Payment Infrastructure",
    description:
      "Seamless payments on U2U Network, Solana and Base Network with algorithmic stability, instant settlement, and ultra-low fees.",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 200,
        height: 60,
        alt: "OlymPay Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OlymPay - Cross-Chain Payment Infrastructure",
    description:
      "Seamless payments on U2U Network, Solana and Base Network with algorithmic stability, instant settlement, and ultra-low fees.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="solbase">
      <body className="font-inter">
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
