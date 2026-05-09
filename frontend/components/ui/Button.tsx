"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-accent-orange text-white hover:bg-[#FF9A40] shadow-glow-orange",
  secondary:
    "glass glass-hover text-text-secondary hover:text-white",
  danger:
    "bg-accent-red/20 text-accent-red border border-accent-red/30 hover:bg-accent-red/30",
  ghost:
    "bg-transparent text-text-secondary hover:text-white hover:bg-white/5",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-7 py-3.5 text-base rounded-xl gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-300 cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : size === "md" ? 16 : 18} />}
      {children}
      {Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : size === "md" ? 16 : 18} />}
    </motion.button>
  );
}
