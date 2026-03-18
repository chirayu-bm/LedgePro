"use client";

import { useEffect } from "react";
import Lenis from "lenis";
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

  return (
    <div className="min-h-screen bg-bg-main text-text-primary selection:bg-accent-orange/30 selection:text-white">
      {/* Simple Transparent Navbar for Landing */}
      <nav className="fixed top-0 w-full z-50 glass border-x-0 border-t-0 border-b border-glass-border rounded-none px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)] text-white">
              LedgerFlow
            </span>
         </div>
         <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-white transition-colors cursor-pointer hidden sm:block">
              Sign In
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
         </div>
      </nav>

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
