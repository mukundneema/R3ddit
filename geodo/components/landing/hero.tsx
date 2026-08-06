"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-6 pt-32 pb-24 text-center sm:pt-40">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        AI-native Reddit marketing, no dashboard required
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="max-w-3xl text-balance text-5xl font-semibold tracking-tight text-gradient sm:text-6xl md:text-7xl"
      >
        Turn Reddit into your{" "}
        <span className="text-gradient-primary">best growth channel</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-6 max-w-xl text-balance text-lg text-muted-foreground"
      >
        Geodo interviews you about your business, finds the subreddits where
        your customers actually hang out, writes posts that fit each
        community, checks the rules, and publishes for you — all in one
        session, no sign-up.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
      >
        <Link href="/app">
          <Button size="lg" className="group">
            Start Creating
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
        <span className="text-xs text-muted-foreground">
          No account. No database. Everything lives in this browser tab.
        </span>
      </motion.div>
    </section>
  );
}
