"use client";

import { useUserStore } from "@/stores/user-store";
import CreateWalletDebugger from "@/components/CreateWalletDebugger";
import CreateEVMWalletDebugger from "@/components/CreateEVMWalletDebugger";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CreateWalletDebugPage() {
  const { currentUser } = useUserStore();

  return (
    <main className="min-h-screen bg-base-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Create Wallet Debug Page</h1>
            <p className="text-lg text-base-content/70">
              Debug the "Create Solana wallet" button functionality
            </p>
          </div>

          {!currentUser ? (
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              <span>Please log in to test wallet creation.</span>
            </div>
          ) : (
            <div className="space-y-8">
              <CreateWalletDebugger />
              <CreateEVMWalletDebugger />
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
