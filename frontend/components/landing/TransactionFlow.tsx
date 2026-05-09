"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CreditCard, ArrowRight } from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";

export default function TransactionFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.4], [100, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  const cardScale = useTransform(scrollYProgress, [0.2, 0.5], [0.8, 1]);
  const cardY = useTransform(scrollYProgress, [0.2, 0.5], [100, 0]);
  const cardOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  const textOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);
  const textX = useTransform(scrollYProgress, [0.4, 0.6], [50, 0]);

  return (
    <section ref={containerRef} className="py-32 relative flex items-center justify-center min-h-[80vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-orange/5 to-transparent skew-y-6 transform -z-10" />

      <div className="w-full max-w-6xl mx-auto px-6">
        <motion.div style={{ opacity: titleOpacity, y: titleY }} className="text-center mb-20">
          <SectionTitle 
            title="Intelligent Inputs"
            subtitle="The journey begins with capturing your financial events instantly and securely."
            align="center"
          />
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
          <motion.div style={{ scale: cardScale, y: cardY, opacity: cardOpacity }} className="w-full max-w-sm relative">
            <div className="absolute -inset-4 bg-accent-orange/20 blur-3xl rounded-full opacity-50 z-0" />
            <GlassCard glow className="relative z-10 p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-accent-orange/20 flex items-center justify-center">
                  <CreditCard size={20} className="text-accent-orange" />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-green/10 text-accent-green">
                  Processing
                </span>
              </div>
              
              <div>
                <p className="text-3xl font-bold text-text-primary mb-1">$4,250.00</p>
                <p className="text-sm text-text-muted">Payment to Stripe Inc.</p>
              </div>

              <div className="h-px w-full bg-glass-border" />

              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Today, 10:24 AM</span>
                <span>ID: TXN-8932</span>
              </div>
            </GlassCard>
            
            <motion.div 
              animate={{ 
                x: [0, 10, 0], 
                opacity: [0.5, 1, 0.5] 
              }} 
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute -right-12 top-1/2 -translate-y-1/2 hidden md:block"
            >
              <ArrowRight size={32} className="text-accent-orange" />
            </motion.div>
          </motion.div>

          <motion.div style={{ opacity: textOpacity, x: textX }} className="w-full max-w-md">
            <div className="inline-flex px-3 py-1 rounded-full border border-glass-border glass mb-4">
              <span className="text-xs font-medium text-accent-orange">Step 1 — Input</span>
            </div>
            <h3 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4 leading-tight">
              Every transaction captured at the source
            </h3>
            <p className="text-text-secondary leading-relaxed mb-6">
              Connect your bank accounts, process invoices, or manually enter transactions. LedgerFlow captures raw financial data securely in real-time, preparing it for the double-entry engine.
            </p>
            <ul className="space-y-3">
               {["Bank syncing via Plaid integration", "Smart OCR for invoice scanning", "Real-time webhooks for Stripe"].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-sm text-text-primary">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
                   {item}
                 </li>
               ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
