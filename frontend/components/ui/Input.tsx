"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-text-secondary font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-accent-orange/50 focus:border-accent-orange/50",
              "transition-all duration-300",
              "backdrop-blur-xl",
              Icon && "pl-10",
              error && "border-accent-red/50 focus:ring-accent-red/50",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-accent-red">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
