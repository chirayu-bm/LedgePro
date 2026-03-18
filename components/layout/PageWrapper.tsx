"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "min-h-[calc(100vh-4rem)] px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:py-8 md:pb-8",
        className
      )}
    >
      {children}
    </motion.main>
  );
}
