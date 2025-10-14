"use client";

import { MetaMaskWalletProvider } from "@/contexts/MetaMaskWalletContext";
import U2UBalanceDemo from "@/components/U2UBalanceDemo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function U2UBalanceTestPage() {
  return (
    <MetaMaskWalletProvider>
      <main className="min-h-screen">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">U2U Balance Test</h1>
              <p className="text-base-content/70">
                Test U2U balance fetching from U2U Solaris network
              </p>
            </div>

            <U2UBalanceDemo />
          </div>
        </div>

        <Footer />
      </main>
    </MetaMaskWalletProvider>
  );
}
