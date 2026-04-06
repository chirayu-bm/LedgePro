"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import { revenueData } from "@/lib/constants";

export default function ReportsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const titleOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0.1, 0.4], [30, 0]);

  const chartScale = useTransform(scrollYProgress, [0.2, 0.6], [0.9, 1]);
  const chartOpacity = useTransform(scrollYProgress, [0.2, 0.6], [0.3, 1]);
  
  // Animate the line drawing based on scroll
  const strokeDashoffset = useTransform(scrollYProgress, [0.3, 0.8], [1000, 0]);

  return (
    <section ref={containerRef} className="py-32 relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-accent-orange/5 via-bg-main to-bg-main transform -z-10" />

      <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <motion.div style={{ opacity: titleOpacity, y: titleY }}>
          <div className="inline-flex px-3 py-1 rounded-full border border-glass-border glass mb-4">
            <span className="text-xs font-medium text-text-primary">Step 4 — Reporting</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-6 leading-tight">
            See the full picture instantly
          </h2>
          <p className="text-text-secondary text-lg mb-8 leading-relaxed">
            Beautiful, interactive charts generated from your real-time ledger. What used to take days of Excel wrangling now happens continuously.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {["Profit & Loss", "Cash Flow", "Balance Sheet", "Custom Metrics"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent-orange shadow-glow-orange" />
                 <span className="text-sm font-medium text-white">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div style={{ scale: chartScale, opacity: chartOpacity }} className="relative h-80 lg:h-96 w-full">
           <GlassCard glow className="absolute inset-0 p-6 flex flex-col h-full w-full">
             <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">Net Revenue Trajectory</h3>
                  <p className="text-xs text-text-muted">Last 12 Months</p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-accent-orange/10 text-accent-orange text-xs font-bold">
                  +18.4% YTD
                </div>
             </div>
             
             <div className="flex-1 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={revenueData}>
                   <XAxis dataKey="month" hide />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 17, 21, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }} 
                     itemStyle={{ color: '#FF7A00', fontWeight: 'bold' }}
                     cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="revenue" 
                     stroke="#FF7A00" 
                     strokeWidth={4} 
                     dot={false}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="expenses" 
                     stroke="rgba(255,255,255,0.2)" 
                     strokeWidth={2} 
                     dot={false}
                   />
                 </LineChart>
               </ResponsiveContainer>
               
               {/* Overlay to handle the drawing animation effect */}
               <motion.div 
                 style={{ width: useTransform(scrollYProgress, [0.3, 0.8], ["100%", "0%"]) }}
                 className="absolute inset-y-0 right-0 bg-bg-main mix-blend-color z-10 origin-right transition-none"
               />
               <motion.div 
                 style={{ width: useTransform(scrollYProgress, [0.3, 0.8], ["100%", "0%"]) }}
                 className="absolute inset-y-0 right-0 bg-gradient-to-l from-bg-main to-transparent z-10"
               />

             </div>
           </GlassCard>
        </motion.div>

      </div>
    </section>
  );
}
