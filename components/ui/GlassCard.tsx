"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "glass shadow-soft",
        hover && "glass-hover cursor-pointer transition-all duration-300",
        glow && "shadow-glow-orange",
        className
      )}
      whileHover={
        hover
          ? { y: -4, transition: { duration: 0.3, ease: "easeOut" } }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}
