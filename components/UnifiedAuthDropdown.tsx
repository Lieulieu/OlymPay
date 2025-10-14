"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDownIcon, 
  XMarkIcon,
  WalletIcon,
  UserIcon,
  ArrowRightIcon,
  CheckIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";
import { useWallet } from "@/contexts/WalletContext";

interface UnifiedAuthDropdownProps {
  className?: string;
}

export default function UnifiedAuthDropdown({ className = "" }: UnifiedAuthDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'phantom' | 'metamask' | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { 
    currentUser, 
    loginWithAddress, 
    loginWithGoogle,
    loginWithMetaMask,
    logout,
    loading: userLoading 
  } = useUserStore();
  
  const { 
    connected, 
    publicKey, 
    connect, 
    disconnect, 
    loading: walletLoading 
  } = useWallet();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Google OAuth authentication
  const handleGoogleAuth = async () => {
    setLoading(true);
    setAuthMethod('google');
    
    try {
      // Check if Google OAuth is available
      if (typeof window === 'undefined') {
        throw new Error('Google OAuth not available');
      }

      toast.info("Connecting to Google...");

      // Import Firebase auth dynamically
      const { getClientAuth } = await import('@/lib/client/firebase-client');
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const googleUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      };

      toast.info("Authenticating with Google...");
      await loginWithGoogle(googleUser);
      toast.success("Signed in with Google!");
      setIsOpen(false);
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups for this site.');
      } else {
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
      setAuthMethod(null);
    }
  };

  // Handle Phantom wallet authentication
  const handlePhantomAuth = async () => {
    setLoading(true);
    setAuthMethod('phantom');
    
    try {
      // Check if Phantom is installed
      if (typeof window === 'undefined' || !window.solana) {
        throw new Error('Phantom wallet not installed. Please install Phantom extension.');
      }

      if (!connected) {
        toast.info("Connecting to Phantom wallet...");
        await connect();
      }

      const pk = publicKey?.toBase58() || 
        (typeof window !== "undefined" ? window.solana?.publicKey?.toBase58() : undefined);

      if (!pk) {
        throw new Error("Failed to get wallet address");
      }

      toast.info("Authenticating with Phantom...");
      await loginWithAddress(pk);
      toast.success("Connected & signed in with Phantom!");
      setIsOpen(false);
    } catch (error: any) {
      console.error('Phantom auth error:', error);
      if (error.message.includes('not installed')) {
        toast.error('Phantom wallet not installed. Please install Phantom extension.');
      } else if (error.message.includes('User rejected')) {
        toast.error('Connection cancelled');
      } else {
        toast.error(error.message || 'Failed to authenticate with Phantom');
      }
    } finally {
      setLoading(false);
      setAuthMethod(null);
    }
  };

  // Handle MetaMask wallet authentication
  const handleMetaMaskAuth = async () => {
    setLoading(true);
    setAuthMethod('metamask');
    
    try {
      // Check if MetaMask is installed
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask extension.');
      }

      toast.info("Connecting to MetaMask...");

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0];
      
      toast.info("Getting authentication challenge...");
      
      // Get nonce for MetaMask
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (!nonceRes.ok) {
        const error = await nonceRes.json();
        throw new Error(error?.error || "Failed to get nonce");
      }

      const { nonce } = await nonceRes.json();
      if (!nonce) throw new Error("Nonce not returned");

      toast.info("Please sign the message in MetaMask...");

      // Sign message with MetaMask
      const message = `Sign this message to authenticate with OlymPay: ${nonce}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });

      if (!signature) {
        throw new Error("User canceled signing");
      }

      toast.info("Authenticating with MetaMask...");

      // Use the new loginWithMetaMask method
      await loginWithMetaMask(walletAddress);
      toast.success("Connected & signed in with MetaMask!");
      setIsOpen(false);
    } catch (error: any) {
      console.error('MetaMask auth error:', error);
      if (error.message.includes('not installed')) {
        toast.error('MetaMask not installed. Please install MetaMask extension.');
      } else if (error.message.includes('User rejected') || error.message.includes('canceled')) {
        toast.error('Connection cancelled');
      } else if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error(error.message || 'Failed to authenticate with MetaMask');
      }
    } finally {
      setLoading(false);
      setAuthMethod(null);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      if (connected) {
        await disconnect();
      }
      toast.success("Logged out successfully");
      setIsOpen(false);
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
    }
  };

  const isAnyLoading = loading || userLoading || walletLoading;

  if (currentUser) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-primary gap-2"
          disabled={isAnyLoading}
        >
          <UserIcon className="h-4 w-4" />
          {currentUser.profile?.name || 'Profile'}
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-64 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base-content">Account</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-base-content/70">
                    {currentUser.externalWallet && (
                      <div>Wallet: {currentUser.externalWallet.slice(0, 8)}...{currentUser.externalWallet.slice(-6)}</div>
                    )}
                    {currentUser.profile?.email && (
                      <div>Email: {currentUser.profile.email}</div>
                    )}
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = '/profile';
                    }}
                    className="btn btn-ghost btn-sm w-full justify-start"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    className="btn btn-error btn-sm w-full"
                    disabled={isAnyLoading}
                  >
                    {isAnyLoading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      'Logout'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary gap-2"
        disabled={isAnyLoading}
      >
        <WalletIcon className="h-4 w-4" />
        Connect & Sign In
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-base-content">Connect & Sign In</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Google Sign In */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium text-base-content/70">Social Login</h4>
                  </div>
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isAnyLoading}
                    className="btn btn-outline w-full justify-start gap-3 hover:btn-primary transition-all duration-200"
                  >
                    {authMethod === 'google' ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span>Continue with Google</span>
                    <ArrowRightIcon className="h-4 w-4 ml-auto" />
                  </button>
                </div>

                <div className="divider">
                  <span className="text-xs text-base-content/50">or</span>
                </div>

                {/* Wallet Sign In */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4 text-secondary" />
                    <h4 className="text-sm font-medium text-base-content/70">Wallet Connection</h4>
                  </div>
                  
                  {/* Phantom Wallet */}
                  <button
                    onClick={handlePhantomAuth}
                    disabled={isAnyLoading}
                    className="btn btn-outline w-full justify-start gap-3 hover:btn-secondary transition-all duration-200"
                  >
                    {authMethod === 'phantom' ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                    )}
                    <span>Connect Phantom</span>
                    <ArrowRightIcon className="h-4 w-4 ml-auto" />
                  </button>

                  {/* MetaMask Wallet */}
                  <button
                    onClick={handleMetaMaskAuth}
                    disabled={isAnyLoading}
                    className="btn btn-outline w-full justify-start gap-3 hover:btn-accent transition-all duration-200"
                  >
                    {authMethod === 'metamask' ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                    )}
                    <span>Connect MetaMask</span>
                    <ArrowRightIcon className="h-4 w-4 ml-auto" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-base-content/50 text-center">
                By connecting, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
