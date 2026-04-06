import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getDisplayName(name?: string | null, email?: string | null): string {
  if ((email ?? "").trim().toLowerCase() === "admin@ledgerflow.io") {
    return "Aldeen Nasrun M";
  }

  const trimmedName = (name ?? "").trim();
  if (trimmedName) {
    return trimmedName;
  }

  const emailPrefix = (email ?? "").split("@")[0]?.trim() ?? "";
  const humanizedPrefix = emailPrefix.replace(/[._+-]+/g, " ").replace(/\s+/g, " ").trim();

  if (humanizedPrefix) {
    return toTitleCase(humanizedPrefix);
  }

  return trimmedName || "User";
}
