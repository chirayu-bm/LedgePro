"use client";

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  state?: "loading" | "empty" | "error";
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export default function SkeletonCard({
  className,
  lines = 3,
  state = "loading",
  emptyMessage = "No data yet",
  errorMessage = "Failed to load data",
  onRetry,
}: SkeletonCardProps) {
  if (state === "empty") {
    return (
      <div
        className={cn(
          "glass shadow-soft flex flex-col items-center justify-center py-12 px-6",
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="text-text-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        className={cn(
          "glass shadow-soft flex flex-col items-center justify-center py-12 px-6",
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-accent-red/10 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-accent-red"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-accent-red text-sm mb-3">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors cursor-pointer"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("glass shadow-soft p-6 space-y-4", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div
            className="skeleton-pulse rounded-lg bg-white/5"
            style={{
              height: i === 0 ? "20px" : "14px",
              width: i === 0 ? "60%" : `${85 - i * 15}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
