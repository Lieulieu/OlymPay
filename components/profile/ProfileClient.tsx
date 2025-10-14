"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowPathIcon,
  ClipboardIcon,
  CheckIcon,
  UserCircleIcon,
  WalletIcon,
  CreditCardIcon,
  ClockIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  SparklesIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Header from "@/components/Header";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ProfileStat } from "@/components/profile/ProfileStat";
import InternalWalletSection from "@/components/profile/InternalWalletSection";
import EVMWalletSection from "@/components/profile/EVMWalletSection";
import MnemonicSection from "@/components/profile/MnemonicSection";
import { useAuthMethod } from "@/hooks/use-auth-method";
import PaymentHistory from "@/components/profile/PaymentHistory";
import { useUserStore } from "@/stores/user-store";
import { money } from "@/utils/wallet";
import { ProfileFormSchema, ProfileFormValues } from "@/schemas/user.schema";
import AffiliateButton from "./AffiliateButton";
import { useInternalBalance } from "@/hooks/use-internal-balance";
import { formatBalance } from "@/lib/utils";
import PurchasedAssets from "./PurchasedAssets";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const maybeFail = () => Math.random() < 0.12;

export default function ProfileClient() {
  const {
    currentUser,
    refreshMe,
    updateProfile,
    loading: userLoading,
  } = useUserStore();
  const { canCreateInternalWallet } = useAuthMethod();

  const {
    balance: internalBalance,
    loading: balanceLoading,
    refreshBalance,
  } = useInternalBalance();

  /* U2U Balance state */
  const [u2uBalance, setU2uBalance] = useState<number | null>(null);
  const [u2uBalanceLoading, setU2uBalanceLoading] = useState(false);

  /* UI state */
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [isLinkBank, setLinkBank] = useState(false);
  const [isBuy, setBuy] = useState(false);
  const [isKyc, setKyc] = useState(false);

  /* Dialogs (Top-up / Withdraw / Edit Profile) */
  const [openTopup, setOpenTopup] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [amount, setAmount] = useState("1000000");
  const [isTopup, setTopup] = useState(false);
  const [isWithdraw, setWithdraw] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: currentUser?.profile?.name ?? "",
      avatarUrl: currentUser?.profile?.avatarUrl ?? undefined,
      bio: currentUser?.profile?.bio ?? "",
    },
  });

  const avatarUrl = watch("avatarUrl");
  const [formLoading, setFormLoading] = useState(false);
  const openedOnceRef = useRef(false);

  /* Derived */
  const walletShort = useMemo(() => {
    const w = currentUser?.externalWallet ?? "";
    return w.length > 14 ? `${w.slice(0, 10)}…${w.slice(-4)}` : w;
  }, [currentUser?.externalWallet]);

  /* Fetch U2U balance */
  const fetchU2uBalance = async (walletAddress: string) => {
    if (!walletAddress) return;

    setU2uBalanceLoading(true);
    try {
      const response = await fetch("/api/u2u-explorer/u2u-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        setU2uBalance(data.balance || 0);
      } else {
        setU2uBalance(0);
      }
    } catch (error) {
      console.error("Failed to fetch U2U balance:", error);
      setU2uBalance(null);
    } finally {
      setU2uBalanceLoading(false);
    }
  };

  /* Initial page load */
  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  /* Fetch U2U balance when external wallet changes */
  useEffect(() => {
    if (currentUser?.externalWallet) {
      fetchU2uBalance(currentUser.externalWallet);
    }
  }, [currentUser?.externalWallet]);

  /* Keep form in sync when currentUser changes (outside dialog lifecycle) */
  useEffect(() => {
    reset({
      name: currentUser?.profile?.name ?? "",
      avatarUrl: currentUser?.profile?.avatarUrl ?? undefined,
      bio: currentUser?.profile?.bio ?? "",
    });
  }, [
    currentUser?.profile?.name,
    currentUser?.profile?.avatarUrl,
    currentUser?.profile?.bio,
    reset,
  ]);

  /* Open edit dialog -> fetch freshest data once */
  const handleEditOpenChange = useCallback(
    async (isOpen: boolean) => {
      setOpenEdit(isOpen);
      if (!isOpen) return;

      if (!openedOnceRef.current) {
        setFormLoading(true);
        try {
          await refreshMe();
          openedOnceRef.current = true;
        } catch (e) {
          console.error(e);
          toast.error("Failed to load latest profile.");
        } finally {
          setFormLoading(false);
        }
      }

      reset({
        name: currentUser?.profile?.name ?? "",
        avatarUrl: currentUser?.profile?.avatarUrl ?? undefined,
        bio: currentUser?.profile?.bio ?? "",
      });
    },
    [
      reset,
      refreshMe,
      currentUser?.profile?.name,
      currentUser?.profile?.avatarUrl,
      currentUser?.profile?.bio,
    ]
  );

  /* Actions */
  const copyWallet = async () => {
    if (!currentUser?.externalWallet) return;
    await navigator.clipboard.writeText(currentUser.externalWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
    toast.info("Wallet address copied.");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const t = toast.loading("Refreshing profile…");
    await Promise.all([
      refreshMe(),
      refreshBalance(),
      currentUser?.externalWallet
        ? fetchU2uBalance(currentUser.externalWallet)
        : Promise.resolve(),
    ]);
    setRefreshing(false);
    toast.success("Profile refreshed.", { id: t });
  };

  const onLinkBank = async () => {
    setLinkBank(true);
    const t = toast.loading("Linking bank…");
    await wait(900);
    setLinkBank(false);
    toast.success("Bank linked (mock).", { id: t });
  };

  const onBuyServices = async () => {
    setBuy(true);
    const t = toast.loading("Opening marketplace…");
    await wait(900);
    setBuy(false);
    toast.success("Marketplace opened (mock).", { id: t });
  };

  const onKyc = async () => {
    setKyc(true);
    const t = toast.loading("Starting KYC…");
    await wait(1200);
    setKyc(false);
    toast.success("KYC started (step 1/3, mock).", { id: t });
  };

  const confirmTopup = async () => {
    setTopup(true);
    const t = toast.loading("Processing top-up…");
    await wait(1000);
    setTopup(false);
    setOpenTopup(false);
    if (maybeFail())
      return toast.error("Top-up failed. Please try again.", { id: t });
    toast.success(`Top-up ${money(Number(amount))} oVND succeeded.`, { id: t });
  };

  const confirmWithdraw = async () => {
    setWithdraw(true);
    const t = toast.loading("Submitting withdraw…");
    await wait(1200);
    setWithdraw(false);
    setOpenWithdraw(false);
    if (maybeFail())
      return toast.error("Withdraw failed. Check your balance.", { id: t });
    toast.success(`Withdraw ${money(Number(amount))} oVND requested.`, {
      id: t,
    });
  };

  const onSubmit = async (values: ProfileFormValues) => {
    const diff: Record<string, any> = {};
    if ((values.name ?? "") !== (currentUser?.profile?.name ?? "")) {
      diff.name = values.name;
    }
    if ((values.avatarUrl ?? "") !== (currentUser?.profile?.avatarUrl ?? "")) {
      diff.avatarUrl = values.avatarUrl ?? undefined;
    }
    if ((values.bio ?? "") !== (currentUser?.profile?.bio ?? "")) {
      diff.bio = values.bio;
    }

    if (Object.keys(diff).length === 0) {
      toast.info("No changes to save.");
      return;
    }

    try {
      await updateProfile(diff);
      setOpenEdit(false);
      toast.success("Profile updated.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to update profile.");
    }
  };

  return (
    <>
      {/* header */}
      <Header />

      <div className="mt-10">
        {/* page header */}
        <header className="bg-base-100 pt-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-base-content/70">
                  Manage your info, wallet, rewards, and transactions.
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm gap-2"
                aria-label="Refresh"
                onClick={onRefresh}
                disabled={isRefreshing || userLoading}
              >
                {isRefreshing ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* main */}
        <main className="py-6">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 font-inter">
            {/* identity + stats */}
            <section
              aria-label="Profile overview"
              className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4"
            >
              <article className="rounded-2xl border border-base-300 bg-base-100 p-5 md:p-6 shadow-sm">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Avatar */}
                  <div className="avatar shrink-0">
                    <div className="w-12 h-12 rounded-full ring ring-primary/30 ring-offset-2 overflow-hidden">
                      {currentUser?.profile?.avatarUrl ? (
                        <img
                          src={currentUser.profile.avatarUrl}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="h-12 w-12 text-primary" />
                      )}
                    </div>
                  </div>

                  {/* Name & meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold truncate">
                          {currentUser?.profile?.name || "User"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {currentUser?.profile?.bio ? (
                            <span className="text-xs text-base-content/60 line-clamp-3">
                              {currentUser.profile.bio}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Edit Profile */}
                      <Dialog.Root
                        open={openEdit}
                        onOpenChange={handleEditOpenChange}
                      >
                        <Dialog.Trigger asChild>
                          <button className="btn btn-ghost btn-sm gap-1">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                          <Dialog.Overlay className="fixed inset-0 bg-black/30 data-[state=open]:animate-fadeIn" />
                          <Dialog.Content
                            className="fixed left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xl focus:outline-none"
                            aria-describedby={undefined}
                          >
                            <Dialog.Title className="text-lg font-semibold">
                              Edit profile
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-base-content/70 mt-1">
                              Update your public information. Only fields below
                              are currently editable.
                            </Dialog.Description>

                            {formLoading ? (
                              <div className="mt-4 flex items-center gap-2 text-sm">
                                <span className="loading loading-spinner loading-sm" />
                                Loading latest profile…
                              </div>
                            ) : null}

                            <form
                              className="mt-4 space-y-4"
                              onSubmit={handleSubmit(onSubmit)}
                            >
                              {/* Name */}
                              <div className="form-control">
                                <label className="label">
                                  <span className="label-text">Name</span>
                                </label>
                                <input
                                  className={`input input-bordered ${
                                    errors.name ? "input-error" : ""
                                  }`}
                                  placeholder="Your name"
                                  {...register("name")}
                                  disabled={formLoading || isSubmitting}
                                />
                                {errors.name && (
                                  <p className="mt-1 text-xs text-error">
                                    {errors.name.message}
                                  </p>
                                )}
                              </div>

                              {/* Avatar */}
                              {/* <div className="form-control">
                                <label className="label">
                                  <span className="label-text">Avatar</span>
                                </label>
                                <AvatarUploader
                                  value={avatarUrl || null}
                                  onChange={(url) => {
                                    setValue("avatarUrl", url ?? undefined, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                  }}
                                  disabled={isSubmitting || formLoading}
                                />
                                {errors.avatarUrl && (
                                  <p className="mt-1 text-xs text-error">
                                    {errors.avatarUrl.message as any}
                                  </p>
                                )}
                              </div> */}

                              {/* Bio */}
                              <div className="form-control">
                                <label className="label">
                                  <span className="label-text">Bio</span>
                                </label>
                                <textarea
                                  rows={3}
                                  className={`textarea textarea-bordered ${
                                    errors.bio ? "textarea-error" : ""
                                  }`}
                                  placeholder="Tell something about you (max 240 chars)"
                                  {...register("bio")}
                                  disabled={formLoading || isSubmitting}
                                />
                                {errors.bio && (
                                  <p className="mt-1 text-xs text-error">
                                    {errors.bio.message}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="mt-2 flex items-center justify-end gap-2">
                                <Dialog.Close asChild>
                                  <button
                                    className="btn btn-ghost"
                                    type="button"
                                    disabled={isSubmitting || formLoading}
                                  >
                                    Cancel
                                  </button>
                                </Dialog.Close>
                                <button
                                  className="btn btn-primary"
                                  type="submit"
                                  disabled={
                                    isSubmitting || formLoading || !isDirty
                                  }
                                >
                                  {isSubmitting ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : null}
                                  Save changes
                                </button>
                              </div>
                            </form>
                          </Dialog.Content>
                        </Dialog.Portal>
                      </Dialog.Root>
                    </div>
                  </div>
                </header>

                {/* Contact & Wallet */}
                <section className="mt-4 grid gap-3 sm:grid-cols-2">
                  {currentUser?.profile?.email && (
                    <div className="rounded-xl bg-base-200 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-base-content/60">
                        Email
                      </p>
                      <p className="truncate font-medium">
                        {currentUser?.profile?.email || "you@example.com"}
                      </p>
                    </div>
                  )}
                  {currentUser?.profile?.phone && (
                    <div className="rounded-xl bg-base-200 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-base-content/60">
                        Phone
                      </p>
                      <p className="truncate font-medium">
                        {currentUser?.profile?.phone || "+84 901 234 567"}
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2 rounded-xl bg-base-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-base-content/60">
                          {currentUser?.externalWallet ? "Wallet" : "Google Account"}
                        </p>
                        {currentUser?.externalWallet ? (
                          <>
                            <p className="font-mono text-sm truncate">
                              {walletShort || "—"}
                            </p>
                            {u2uBalance !== null && (
                              <p className="text-xs text-base-content/70 mt-1">
                                Balance: {formatBalance(u2uBalance)} U2U
                              </p>
                            )}
                            {u2uBalanceLoading && (
                              <p className="text-xs text-base-content/70 mt-1">
                                Loading balance...
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-base-content text-sm">
                                  {(currentUser as any)?.displayName || 
                                   currentUser?.profile?.name || 
                                   "Google User"}
                                </p>
                                <p className="text-xs text-base-content/70">
                                  {(currentUser as any)?.email || 
                                   currentUser?.profile?.email || 
                                   "No email available"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600 font-medium">
                                Google OAuth Connected
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {currentUser?.externalWallet && (
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={copyWallet}
                          aria-label="Copy wallet address"
                          disabled={!currentUser?.externalWallet}
                          type="button"
                        >
                          {copied ? (
                            <CheckIcon className="h-4 w-4 text-primary" />
                          ) : (
                            <ClipboardIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              </article>

              <ProfileStat
                title="oVND Balance"
                value={`${money(internalBalance?.oVNDBalance ?? 0)} oVND`}
                desc="Real-time balance"
                icon={<WalletIcon className="h-7 w-7" />}
                tone="primary"
              />
              <ProfileStat
                title="oUSDC Balance"
                value={`${money(internalBalance?.oUSDCBalance ?? 0)} oUSDC`}
                desc="Stablecoin balance"
                icon={<BanknotesIcon className="h-7 w-7" />}
                tone="accent"
              />
              <ProfileStat
                title="Reward Points"
                value={money(currentUser?.points ?? 0)}
                desc="Redeem for vouchers"
                icon={<SparklesIcon className="h-7 w-7" />}
                tone="secondary"
              />
            </section>

            {/* quick actions */}
            <section
              aria-label="Quick actions"
              className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {/* Top up */}
              <Dialog.Root open={openTopup} onOpenChange={setOpenTopup}>
                <Dialog.Trigger asChild>
                  <button className="btn btn-primary w-full">
                    <ArrowDownLeftIcon className="h-5 w-5" />
                    Top up
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/30 data-[state=open]:animate-fadeIn" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold">
                      Top up oVND
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-base-content/70 mt-1">
                      Enter an amount to top up (mock flow).
                    </Dialog.Description>
                    <input
                      type="number"
                      className="input input-bordered w-full mt-3"
                      value={amount}
                      min={100000}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="mt-4 flex justify-end gap-2">
                      <Dialog.Close asChild>
                        <button className="btn btn-ghost" disabled={isTopup}>
                          Cancel
                        </button>
                      </Dialog.Close>
                      <button
                        className="btn btn-primary"
                        onClick={confirmTopup}
                        disabled={isTopup || !Number(amount)}
                      >
                        {isTopup ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <ArrowDownLeftIcon className="h-5 w-5" />
                        )}
                        Confirm
                      </button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

              {/* Withdraw */}
              <Dialog.Root open={openWithdraw} onOpenChange={setOpenWithdraw}>
                <Dialog.Trigger asChild>
                  <button className="btn btn-outline w-full">
                    <ArrowUpRightIcon className="h-5 w-5" />
                    Withdraw
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/30 data-[state=open]:animate-fadeIn" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold">
                      Withdraw oVND
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-base-content/70 mt-1">
                      Enter an amount to withdraw (mock flow).
                    </Dialog.Description>
                    <input
                      type="number"
                      className="input input-bordered w-full mt-3"
                      value={amount}
                      min={100000}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="mt-4 flex justify-end gap-2">
                      <Dialog.Close asChild>
                        <button className="btn btn-ghost" disabled={isWithdraw}>
                          Cancel
                        </button>
                      </Dialog.Close>
                      <button
                        className="btn btn-outline"
                        onClick={confirmWithdraw}
                        disabled={isWithdraw || !Number(amount)}
                      >
                        {isWithdraw ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <ArrowUpRightIcon className="h-5 w-5" />
                        )}
                        Confirm
                      </button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

              {/* Link bank */}
              <button
                className="btn w-full"
                onClick={onLinkBank}
                disabled={isLinkBank}
              >
                {isLinkBank ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <CreditCardIcon className="h-5 w-5" />
                )}
                Link bank
              </button>

              {/* Affiliate */}
              {currentUser?.profile.referralCode && (
                <AffiliateButton
                  referralCode={currentUser?.profile.referralCode || ""}
                />
              )}
            </section>

            {/* two columns */}
            <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              {/* Left: transactions + assets + rewards (mocked for now) */}
              <div className="space-y-6 lg:col-span-2">
                <PaymentHistory />

                <PurchasedAssets />

                <ProfileSection
                  title="Rewards & vouchers"
                  actions={
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toast.info("Redeem flow (mock).")}
                    >
                      Redeem
                    </button>
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <article className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-base-100 p-4">
                      <p className="text-sm text-primary">Promo code</p>
                      <p className="text-lg font-semibold">SAVE50K</p>
                      <p className="mt-1 text-xs text-base-content/60">
                        Orders from 500k
                      </p>
                      <button
                        className="btn btn-primary btn-sm mt-3"
                        onClick={() => toast.success("Code applied (mock).")}
                      >
                        Apply
                      </button>
                    </article>
                    <article className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-base-100 p-4">
                      <p className="text-sm text-primary">Voucher</p>
                      <p className="text-lg font-semibold">-10% Flight</p>
                      <p className="mt-1 text-xs text-base-content/60">
                        Valid until 2025-09-30
                      </p>
                      <button
                        className="btn btn-outline btn-sm mt-3"
                        onClick={() => toast.success("Voucher saved (mock).")}
                      >
                        Save
                      </button>
                    </article>
                  </div>
                </ProfileSection>
              </div>

              {/* Right: security + internal wallet */}
              <div className="space-y-6">
                <ProfileSection title="Security">
                  <div className="space-y-3">
                    <article className="flex items-start gap-3 rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                      <ShieldCheckIcon
                        className="h-5 w-5 text-primary"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium">KYC</p>
                        <p className="text-sm text-base-content/70">
                          Verify identity to increase limits.
                        </p>
                      </div>
                      <div className="ms-auto">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={onKyc}
                          disabled={isKyc}
                        >
                          {isKyc ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : null}
                          Start
                        </button>
                      </div>
                    </article>
                  </div>
                </ProfileSection>

                {/* Wallet sections - Only show for Google OAuth users */}
                {canCreateInternalWallet && (
                  <>
                    <InternalWalletSection />
                    <EVMWalletSection />
                    <MnemonicSection />
                  </>
                )}
              </div>
            </section>
          </div>
        </main>

        {/* footer */}
        <footer className="mt-10 pb-10 text-center text-xs text-base-content/50">
          Built with <span className="text-primary">OlymPay</span>.
        </footer>
      </div>
    </>
  );
}
