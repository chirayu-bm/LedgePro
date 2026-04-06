"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";

export default function LedgerFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const splitProgress = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  
  const debitX = useTransform(splitProgress, [0, 1], [0, -100]);
  const creditX = useTransform(splitProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0.2, 0.4, 0.7, 0.9], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="py-32 relative min-h-[100vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl mx-auto px-6 text-center">
        
        <motion.div style={{ opacity }} className="mb-24 flex flex-col items-center">
          <div className="inline-flex px-3 py-1 rounded-full border border-glass-border glass mb-4">
            <span className="text-xs font-medium text-accent-green">Step 2 — Double-Entry Engine</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-6 max-w-2xl bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Balanced automatically by the LedgerFlow engine
          </h2>
          <p className="text-text-secondary max-w-xl text-lg">
            A single action triggers a perfectly balanced debit and credit split across your chart of accounts.
          </p>
        </motion.div>

        <div className="relative flex justify-center h-64">
           {/* Center Source Card */}
           <motion.div 
             style={{ opacity, scale: useTransform(splitProgress, [0, 1], [1, 0.8]) }}
             className="absolute top-0 z-20 w-48 glass-strong p-4 rounded-xl shadow-soft border-b-4 border-accent-orange flex flex-col items-center"
           >
             <span className="text-xs text-text-muted mb-1">Source Transaction</span>
             <span className="text-lg font-bold text-white">$4,250.00</span>
           </motion.div>

           {/* Vertical Line */}
           <motion.div 
             style={{ 
               height: useTransform(splitProgress, [0, 1], [0, 60]),
               opacity: splitProgress 
             }}
             className="absolute top-[70px] w-0.5 bg-glass-border z-10 flex flex-col items-center overflow-visible"
           >
              <ArrowDown size={14} className="absolute -bottom-3 text-text-muted" />
           </motion.div>

           {/* Horizontal Split Line */}
           <motion.div 
             style={{ 
               width: useTransform(splitProgress, [0, 1], [0, 200]),
               opacity: splitProgress
             }}
             className="absolute top-[130px] h-0.5 bg-glass-border z-10"
           />

           {/* Debit Card (Left) */}
           <motion.div 
             style={{ x: debitX, opacity: splitProgress }}
             className="absolute top-[160px] w-40 glass p-4 rounded-xl border-l-4 border-accent-green flex flex-col items-start"
           >
             <span className="text-[10px] uppercase text-text-muted mb-1 tracking-wider">Debit</span>
             <span className="text-sm font-bold text-white">Software Expense</span>
             <span className="text-sm font-medium text-accent-green mt-1">+$4,250.00</span>
           </motion.div>

           {/* Credit Card (Right) */}
           <motion.div 
             style={{ x: creditX, opacity: splitProgress }}
             className="absolute top-[160px] w-40 glass p-4 rounded-xl border-r-4 border-accent-red flex flex-col items-end text-right"
           >
             <span className="text-[10px] uppercase text-text-muted mb-1 tracking-wider">Credit</span>
             <span className="text-sm font-bold text-white">Cash Account</span>
             <span className="text-sm font-medium text-accent-red mt-1">-$4,250.00</span>
           </motion.div>
        </div>
      </div>
    </section>
  );
}
