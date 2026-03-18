"use client";

import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

export default function SectionTitle({
  title,
  subtitle,
  className,
  align = "left",
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "mb-8",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-space-grotesk)] bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-text-secondary text-sm md:text-base max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
