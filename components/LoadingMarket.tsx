import { Loader2 } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";

export function LoadingMarket() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="bg-base-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading marketplace...</span>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
