"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";
import { motion } from "framer-motion";
import Hero3D from "@/components/landing/Hero3D";
import TransactionFlow from "@/components/landing/TransactionFlow";
import LedgerFlow from "@/components/landing/LedgerFlow";
import ScrollScene from "@/components/landing/ScrollScene";
import ReportsScene from "@/components/landing/ReportsScene";
import AIInsightsScene from "@/components/landing/AIInsightsScene";
import PremiumFooter from "@/components/landing/PremiumFooter";
import Link from "next/link";
import { Zap } from "lucide-react";
import Button from "@/components/ui/Button";

export default function LandingPage() {
  const [isCompactNav, setIsCompactNav] = useState(false);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const compactThreshold = 80;

    const onScroll = () => {
      setIsCompactNav(window.scrollY > compactThreshold);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-main text-text-primary selection:bg-accent-orange/30 selection:text-white">
      {/* Simple Transparent Navbar for Landing */}
      <motion.nav
        initial={false}
        animate={{
          paddingTop: isCompactNav ? 9 : 16,
          paddingBottom: isCompactNav ? 9 : 16,
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 z-50 w-full overflow-hidden rounded-none border-b border-glass-border border-t-0 border-x-0 glass px-4 sm:px-6"
      >
        <div
          className={`pointer-events-none absolute inset-0 ${isCompactNav ? "backdrop-blur-md" : "backdrop-blur-sm"}`}
          style={{
            background: isCompactNav
              ? "linear-gradient(120deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))"
              : "linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-orange">
              <Zap size={18} className="text-white" />
            </div>

            <motion.span
              initial={false}
              animate={{
                opacity: isCompactNav ? 0 : 1,
                scale: isCompactNav ? 0.94 : 1,
                y: isCompactNav ? -2 : 0,
              }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="font-bold font-[family-name:var(--font-space-grotesk)] text-white"
              style={{ transformOrigin: "left center" }}
            >
              LedgerFlow
            </motion.span>
          </div>

          <motion.div
            initial={false}
            animate={{
              opacity: isCompactNav ? 0 : 1,
              y: isCompactNav ? -6 : 0,
              scale: isCompactNav ? 0.98 : 1,
            }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 items-center gap-4 sm:flex"
            style={{ pointerEvents: isCompactNav ? "none" : "auto" }}
          >
            <Link href="/login" className="cursor-pointer text-sm font-medium text-text-secondary transition-colors hover:text-white">
              Sign In
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      <main className="pt-16">
        <Hero3D />
        <TransactionFlow />
        <LedgerFlow />
        <ScrollScene />
        <ReportsScene />
        <AIInsightsScene />
      </main>

      <PremiumFooter />
    </div>
  );
}
