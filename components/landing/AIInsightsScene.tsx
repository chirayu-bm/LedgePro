"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, BrainCircuit } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

export default function AIInsightsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const titleOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0.1, 0.4], [30, 0]);

  const cardsOpacity = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  const card1Y = useTransform(scrollYProgress, [0.3, 0.6], [50, 0]);
  const card2Y = useTransform(scrollYProgress, [0.4, 0.7], [50, 0]);

  return (
    <section ref={containerRef} className="py-32 relative min-h-[100vh] flex flex-col items-center justify-center">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-orange/5 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-5xl mx-auto px-6 text-center">
        
        <motion.div style={{ opacity: titleOpacity, y: titleY }} className="mb-20 flex flex-col items-center">
          <div className="inline-flex px-3 py-1 rounded-full bg-accent-orange/10 border border-accent-orange/20 mb-6">
            <span className="text-xs font-bold text-accent-orange flex items-center gap-2">
              <Sparkles size={14} />
              Step 5 — Prediction
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-space-grotesk)] mb-6">
            Know what happens next
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl">
            Our ML models analyze your historical ledger data to predict runway, forecast cash flow shortages, and identify unusual expense anomalies before they become problems.
          </p>
        </motion.div>

        <motion.div style={{ opacity: cardsOpacity }} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left relative">
           
           {/* Connecting Line */}
           <div className="absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-accent-orange/50 to-transparent z-0 hidden md:block" />

           <motion.div style={{ y: card1Y }} className="z-10 relative">
             <div className="absolute -inset-1 bg-gradient-to-r from-accent-orange to-accent-orange/50 rounded-2xl blur-lg opacity-20" />
             <GlassCard className="p-6 h-full relative border-accent-orange/20">
               <div className="w-10 h-10 rounded-xl bg-accent-orange/20 flex items-center justify-center mb-6">
                 <BrainCircuit size={20} className="text-accent-orange" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Cash Flow Forecast</h3>
               <p className="text-sm text-text-secondary leading-relaxed mb-6">
                 Based on your current run rate and historical Q3 vendor payments, you will likely encounter a $45k deficit in November.
               </p>
               <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
                 <span className="text-xs text-text-muted">Recommendation</span>
                 <span className="text-xs font-medium text-accent-orange whitespace-nowrap cursor-pointer hover:underline">Extend Runway →</span>
               </div>
             </GlassCard>
           </motion.div>

           <motion.div style={{ y: card2Y }} className="z-10 relative mt-8 md:mt-16">
             <GlassCard className="p-6 h-full border-accent-green/20">
               <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center mb-6">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
                   <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                 </svg>
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Automated Savings</h3>
               <p className="text-sm text-text-secondary leading-relaxed mb-6">
                 LedgerFlow detected duplicate SaaS subscriptions across 3 departments. Consolidating these accounts will save you $12,400 annually.
               </p>
               <div className="px-3 py-2 bg-accent-green/10 rounded-lg text-accent-green text-xs font-semibold inline-block">
                 Actionable Insight
               </div>
             </GlassCard>
           </motion.div>

        </motion.div>

      </div>
    </section>
  );
}
