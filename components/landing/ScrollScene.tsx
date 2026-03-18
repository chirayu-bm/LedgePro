"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrollScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const titleOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0.1, 0.3], [50, 0]);

  // Generate a grid of data blocks that light up as you scroll
  const blocks = Array.from({ length: 24 }).map((_, i) => {
    // Each block lights up at a slightly different scroll point
    const blockStart = 0.3 + (i * 0.015);
    const blockEnd = blockStart + 0.1;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const opacity = useTransform(scrollYProgress, [blockStart, blockEnd], [0.1, 1]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const scale = useTransform(scrollYProgress, [blockStart, blockEnd], [0.95, 1]);
    
    return { opacity, scale, id: i };
  });

  return (
    <section ref={containerRef} className="py-32 relative min-h-[100vh] flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <motion.div style={{ opacity: titleOpacity, y: titleY }} className="order-2 lg:order-1">
          <div className="inline-flex px-3 py-1 rounded-full border border-glass-border glass mb-4">
            <span className="text-xs font-medium text-[#4ADE80]">Step 3 — Database</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-6 leading-tight">
            Immutable, lightning-fast storage
          </h2>
          <p className="text-text-secondary text-lg mb-6">
            Every entry is logged on an append-only ledger architecture. Built for scale, query speed, and absolute financial truth.
          </p>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-glass-border glass-hover transition-colors">
              <Database size={18} className="text-[#4ADE80]" />
              <span className="font-medium text-white">PostgreSQL core with TimescaleDB</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-glass-border glass-hover transition-colors">
              <div className="w-4 h-4 rounded-full border-2 border-accent-orange/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
              </div>
              <span className="font-medium text-white">Sub-50ms query latency</span>
            </div>
          </div>
        </motion.div>

        <div className="order-1 lg:order-2 perspective-1000">
          <motion.div 
            className="grid grid-cols-4 sm:grid-cols-6 gap-3 rotate-y-[-12deg] rotate-x-[5deg]"
            style={{ 
              rotateY: useTransform(scrollYProgress, [0, 1], ["-12deg", "12deg"])
            }}
          >
            {blocks.map((block) => (
              <motion.div
                key={block.id}
                style={{ opacity: block.opacity, scale: block.scale }}
                className={cn(
                  "aspect-square rounded-lg border flex flex-col items-center justify-center transition-shadow",
                  block.id % 5 === 0 
                  ? "bg-accent-orange/10 border-accent-orange/30 shadow-[0_0_15px_rgba(255,122,0,0.2)]" 
                  : block.id % 7 === 0
                  ? "bg-accent-green/10 border-accent-green/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                  : "bg-white/5 border-white/10"
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 mb-1" />
                <div className="w-4 h-0.5 rounded-full bg-white/10" />
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
