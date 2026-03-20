"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import AnimatedText from "@/components/shared/AnimatedText";
import Link from "next/link";
import { useRef } from "react";

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end center"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <section ref={containerRef} className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 animated-gradient opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bg-main via-bg-main to-transparent opacity-80" />
      </div>

      <motion.div
        style={{ opacity, y, scale }}
        className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-24 pt-28 lg:grid-cols-[1.04fr_0.96fr]"
      >
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-glass-border px-3 py-1.5 glass"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-orange shadow-glow-orange" />
            <span className="text-xs font-medium text-text-secondary">LedgerFlow Pro v2.0 is live</span>
          </motion.div>

          <AnimatedText
            as="h1"
            text="Financial Clarity Starts Here"
            className="mb-6 justify-center font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-[1.03] tracking-tight md:text-6xl lg:justify-start"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8 max-w-2xl text-base text-text-secondary/95 md:text-lg"
          >
            Track revenue, control expenses, and monitor cash flow - all in one intelligent dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <Link href="/dashboard">
              <Button size="md" icon={ArrowRight} iconPosition="right">
                Start Managing Your Finances
              </Button>
            </Link>
            <Button variant="secondary" size="md">
              View Documentation
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="relative mx-auto w-full max-w-[560px]"
        >
          <div className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-accent-orange/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-accent-green/20 blur-2xl" />

          <div className="glass relative overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.09)_0%,transparent_48%,rgba(255,255,255,0.06)_100%)]" />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d111b]/95 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Live Product Preview</p>
                  <p className="mt-1 text-xs font-semibold text-white">LedgerFlow Workspace</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                  LIVE
                </span>
              </div>

              <div className="grid gap-2.5 md:grid-cols-[1.65fr_1fr]">
                <div className="space-y-2.5">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
                      <p className="text-[10px] text-text-secondary">Good afternoon, team</p>
                      <p className="mt-1 text-sm font-semibold text-white">Financial cockpit is stable</p>
                      <div className="mt-2 h-1.5 w-[82%] rounded-full bg-white/10" />
                      <div className="mt-1 h-1.5 w-[66%] rounded-full bg-white/10" />
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
                      <div className="flex items-center justify-between text-[10px] text-text-secondary">
                        <span>Main wallet</span>
                        <span className="rounded-full bg-accent-green/15 px-1.5 py-0.5 text-accent-green">+15.2%</span>
                      </div>
                      <p className="mt-1.5 text-xl font-semibold text-white">$32,126</p>
                      <p className="mt-1 text-[10px] text-text-muted">Updated just now</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Activity Summary</p>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted">Weekly trend</p>
                      </div>
                      <div className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-white/85">Weekly</div>
                    </div>

                    <div className="relative h-24 overflow-hidden rounded-md border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
                      <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
                      <svg viewBox="0 0 260 84" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          <linearGradient id="previewBlue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="previewGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7EEA73" stopOpacity="0.34" />
                            <stop offset="100%" stopColor="#7EEA73" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 52 C30 48 58 52 85 44 C111 36 137 27 163 33 C188 38 220 49 260 54" fill="none" stroke="#3B82F6" strokeWidth="2" />
                        <path d="M0 68 C24 66 50 64 78 57 C102 50 129 42 156 45 C184 49 217 59 260 66" fill="none" stroke="#7EEA73" strokeWidth="2" />
                        <path d="M0 84 L0 52 C30 48 58 52 85 44 C111 36 137 27 163 33 C188 38 220 49 260 54 L260 84 Z" fill="url(#previewBlue)" />
                        <path d="M0 84 L0 68 C24 66 50 64 78 57 C102 50 129 42 156 45 C184 49 217 59 260 66 L260 84 Z" fill="url(#previewGreen)" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
                    <div className="mb-2 flex items-center justify-between text-[10px] text-text-muted">
                      <span>Credit</span>
                      <span>+ Add Card</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-gradient-to-r from-[#2f343f] via-[#414754] to-[#4a515d] p-2.5">
                      <div className="flex items-center justify-between text-[10px] text-white/85">
                        <span>))))</span>
                        <span>6541</span>
                      </div>
                      <div className="mt-3 h-5 w-7 rounded-md bg-gradient-to-br from-[#efae51] to-[#b8772e]" />
                      <div className="mt-2 text-[10px] text-white/75">Card Holder Name</div>
                      <div className="text-sm font-semibold text-white">Aldeen Nasrun M</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
                    <p className="text-xs font-semibold text-white">Quick Action</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center text-white/90">Top Up</div>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center text-white/90">Transfer</div>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center text-white/90">Withdraw</div>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center text-white/90">Request</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
                    <p className="text-xs font-semibold text-white">Daily Limit</p>
                    <p className="mt-1 text-[10px] text-text-secondary">$1,200 used from $2,000</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-accent-green to-[#7ec7ff]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="relative z-10 mx-auto flex w-fit flex-col items-center gap-2 pb-8"
      >
        <span className="text-xs text-text-muted uppercase tracking-widest font-medium">Scroll down</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-text-muted/0 via-text-muted to-text-muted/0 overflow-hidden">
          <motion.div
            animate={{ y: [0, 48, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-full h-1/2 bg-accent-orange shadow-glow-orange blur-[1px]"
          />
        </div>
      </motion.div>
    </section>
  );
}
