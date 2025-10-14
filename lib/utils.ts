import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(balance: number) {
  return balance.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

export function formatDate(dateValue: any) {
  if (!dateValue) return "N/A";

  // Handle Firebase Timestamp
  if (dateValue && typeof dateValue === "object" && dateValue._seconds) {
    return new Date(dateValue._seconds * 1000).toLocaleString();
  }

  // Handle regular Date string
  if (typeof dateValue === "string") {
    return new Date(dateValue).toLocaleString();
  }

  return "N/A";
}
