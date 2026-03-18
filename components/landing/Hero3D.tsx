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
    <section ref={containerRef} className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 animated-gradient opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bg-main via-bg-main to-transparent opacity-80" />
      </div>

      <motion.div
        style={{ opacity, y, scale }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-glass-border glass mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-accent-orange shadow-glow-orange animate-pulse" />
          <span className="text-xs font-medium text-text-secondary">LedgerFlow Pro v2.0 is live</span>
        </motion.div>

        <AnimatedText
          as="h1"
          text="Your Financial Operating System"
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)] leading-[1.05] mb-6 justify-center"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base md:text-lg text-text-secondary/95 max-w-xl mb-9"
        >
          A premium fintech dashboard designed for modern SaaS companies. Clean, intelligent, and slightly futuristic.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link href="/dashboard">
            <Button size="md" icon={ArrowRight} iconPosition="right">
              Explore Dashboard
            </Button>
          </Link>
          <Button variant="secondary" size="md">
            View Documentation
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
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
