"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@/contexts/WalletContext";
import { useUserStore } from "@/stores/user-store";
import { toast } from "sonner";
import { LoadingButton } from "@/components/LoadingButton";
import { href } from "@/utils/client";
import UnifiedAuthDropdown from "@/components/UnifiedAuthDropdown";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authing, setAuthing] = useState(false);

  const { connected, publicKey, balance, connect, disconnect, loading } =
    useWallet();
  const {
    loginWithAddress,
    logout,
    currentUser,
    loading: userLoading,
  } = useUserStore();

  const loadingStates = useMemo(() => {
    const isConnecting = loading && !connected;
    const isAuthenticating = authing && connected;
    const isLoggingOut = userLoading && currentUser;
    const isGeneralLoading = userLoading && !currentUser;

    return {
      isConnecting,
      isAuthenticating,
      isLoggingOut,
      isGeneralLoading,
      isAnyLoading: authing || loading || userLoading,
    };
  }, [authing, loading, userLoading, connected, currentUser]);

  const getLoadingText = () => {
    if (loadingStates.isConnecting) return "Connecting Wallet...";
    if (loadingStates.isAuthenticating) return "Signing In...";
    if (loadingStates.isGeneralLoading) return "Loading...";
    return "Connecting...";
  };

  const doLogin = async () => {
    if (authing) return;

    setAuthing(true);
    try {
      if (!publicKey) {
        toast.info("Opening wallet...");
        await connect();
      }

      const pk =
        publicKey?.toBase58() ||
        (typeof window !== "undefined"
          ? window.solana?.publicKey?.toBase58()
          : undefined);

      if (!pk) {
        toast.error("Failed to connect wallet");
        return;
      }

      toast.info("Authenticating...");
      await loginWithAddress(pk);
      toast.success("Connected & signed in");
    } catch (e: any) {
      toast.error(e?.message || "Login failed");
    } finally {
      setAuthing(false);
    }
  };

  const doLogout = async () => {
    try {
      await logout();
      disconnect();
      toast.success("Logged out");
    } catch (e: any) {
      toast.error(e?.message || "Failed to logout");
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-base-100 shadow-lg"
    >
      <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex-1">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <img
                src="/logo.png"
                alt="OlymPay"
                className="h-10 w-auto cursor-pointer"
              />
              <span className="text-xl font-bold text-primary hidden sm:block">
                OLYMPAY
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex-none hidden md:flex">
          <ul className="flex items-center gap-1 px-1 mr-2">
            <li>
              <Link
                href={"/"}
                prefetch={false}
                className="px-4 py-2 rounded-lg transition-colors !no-underline !text-current hover:!bg-blue-500 hover:!text-white"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3b82f6";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "";
                  e.currentTarget.style.color = "";
                }}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href={"/onofframp"}
                prefetch={false}
                className={`px-4 py-2 rounded-lg transition-colors !no-underline ${
                  pathname === "/onofframp"
                    ? "!bg-blue-500 !text-white"
                    : "!text-current hover:!bg-blue-500 hover:!text-white"
                }`}
                style={{
                  backgroundColor: pathname === "/onofframp" ? "#3b82f6" : "",
                  color: pathname === "/onofframp" ? "white" : "",
                }}
                onMouseEnter={(e) => {
                  if (pathname !== "/onofframp") {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== "/onofframp") {
                    e.currentTarget.style.backgroundColor = "";
                    e.currentTarget.style.color = "";
                  }
                }}
              >
                On/Off Ramp
              </Link>
            </li>
            <li>
              <Link
                href={"/zalo-payment"}
                prefetch={false}
                className={`px-4 py-2 rounded-lg transition-colors !no-underline ${
                  pathname === "/zalo-payment"
                    ? "!bg-blue-500 !text-white"
                    : "!text-current hover:!bg-blue-500 hover:!text-white"
                }`}
                style={{
                  backgroundColor:
                    pathname === "/zalo-payment" ? "#3b82f6" : "",
                  color: pathname === "/zalo-payment" ? "white" : "",
                }}
                onMouseEnter={(e) => {
                  if (pathname !== "/zalo-payment") {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== "/zalo-payment") {
                    e.currentTarget.style.backgroundColor = "";
                    e.currentTarget.style.color = "";
                  }
                }}
              >
                Zalo Payment
              </Link>
            </li>
            <li>
              <Link
                href={"/rwa-market"}
                prefetch={false}
                className={`px-4 py-2 rounded-lg transition-colors !no-underline ${
                  pathname === "/rwa-market"
                    ? "!bg-blue-500 !text-white"
                    : "!text-current hover:!bg-blue-500 hover:!text-white"
                }`}
                style={{
                  backgroundColor: pathname === "/rwa-market" ? "#3b82f6" : "",
                  color: pathname === "/rwa-market" ? "white" : "",
                }}
                onMouseEnter={(e) => {
                  if (pathname !== "/rwa-market") {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== "/rwa-market") {
                    e.currentTarget.style.backgroundColor = "";
                    e.currentTarget.style.color = "";
                  }
                }}
              >
                RWAs Market
              </Link>
            </li>
            <li>
              <Link
                href={"/profile"}
                prefetch={false}
                className={`px-4 py-2 rounded-lg transition-colors !no-underline ${
                  pathname === "/profile"
                    ? "!bg-blue-500 !text-white"
                    : "!text-current hover:!bg-blue-500 hover:!text-white"
                }`}
                style={{
                  backgroundColor: pathname === "/profile" ? "#3b82f6" : "",
                  color: pathname === "/profile" ? "white" : "",
                }}
                onMouseEnter={(e) => {
                  if (pathname !== "/profile") {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== "/profile") {
                    e.currentTarget.style.backgroundColor = "";
                    e.currentTarget.style.color = "";
                  }
                }}
              >
                Profile
              </Link>
            </li>
          </ul>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex-none md:hidden">
          <motion.button
            className="btn btn-ghost btn-square"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </motion.button>
        </div>

        {/* Desktop Connect Wallet Button */}
        <AnimatePresence mode="wait">
          {currentUser ? (
            <motion.div
              key="user-info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div className="text-sm">
                <div className="text-primary font-medium">
                  {currentUser.externalWallet.slice(0, 4)}...
                  {currentUser.externalWallet.slice(-4)}
                </div>
                <div className="text-xs text-secondary">
                  {currentUser.points ?? 0} pts
                </div>
              </div>
              <LoadingButton
                isLoading={loadingStates.isLoggingOut}
                loadingText="Logging out..."
                className="btn-outline btn-sm"
                onClick={doLogout}
              >
                Logout
              </LoadingButton>
            </motion.div>
          ) : (
            <motion.div
              key="connect-button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <UnifiedAuthDropdown />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-base-100 border-t border-base-300 shadow-lg"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                href="/"
                className="block px-4 py-2 rounded-lg transition-colors hover:bg-blue-500 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/onofframp"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === "/onofframp"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-500 hover:text-white"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                On/Off Ramp
              </Link>
              <Link
                href="/zalo-payment"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === "/zalo-payment"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-500 hover:text-white"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Zalo Payment
              </Link>
              <Link
                href="/marketplace"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === "/marketplace"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-500 hover:text-white"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                href="/rwa-market"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === "/rwa-market"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-500 hover:text-white"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                RWAs Market
              </Link>
              <Link
                href={href("/profile")}
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === "/profile"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-500 hover:text-white"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>

              <div className="pt-4 border-t border-base-300">
                <AnimatePresence mode="wait">
                  {currentUser ? (
                    <motion.div
                      key="mobile-user"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="text-center">
                        <div className="text-primary font-medium">
                          {currentUser.externalWallet.slice(0, 4)}...
                          {currentUser.externalWallet.slice(-4)}
                        </div>
                        <div className="text-xs text-secondary">
                          {currentUser.points ?? 0} pts
                        </div>
                      </div>
                      <LoadingButton
                        isLoading={loadingStates.isLoggingOut}
                        loadingText="Logging out..."
                        className="btn-outline w-full"
                        onClick={() => {
                          doLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Logout
                      </LoadingButton>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mobile-connect"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <UnifiedAuthDropdown 
                        className="w-full"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
