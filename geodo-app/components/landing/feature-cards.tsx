"use client";

import { motion } from "framer-motion";
import { MessagesSquare, Compass, PenSquare, ShieldCheck, Send, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "AI interview",
    description:
      "A short, conversational interview learns what you sell, who you sell to, and what you want out of Reddit.",
  },
  {
    icon: Compass,
    title: "Subreddit discovery",
    description:
      "Get a ranked list of relevant subreddits with audience fit, promotion risk, and whether links are typically allowed.",
  },
  {
    icon: PenSquare,
    title: "Three post strategies",
    description:
      "Founder story, educational, and discussion-style drafts tailored to each subreddit's tone.",
  },
  {
    icon: ShieldCheck,
    title: "Rule checking",
    description:
      "Every draft is checked against the subreddit's actual rules before you're allowed to publish it.",
  },
  {
    icon: Send,
    title: "One-click publish",
    description:
      "Authorize with Reddit once, then publish straight from the app — no copy-pasting into a browser tab.",
  },
  {
    icon: Sparkles,
    title: "Regenerate anything",
    description:
      "Not feeling a draft? Regenerate a single strategy instantly without losing the rest of your session.",
  },
];

export function FeatureCards() {
  return (
    <section className="relative px-6 pb-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <Card className="h-full transition-colors hover:bg-white/[0.06]">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
