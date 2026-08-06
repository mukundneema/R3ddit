"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppStep = "interview" | "profile" | "subreddits" | "posts";

const STEPS: { key: AppStep; label: string }[] = [
  { key: "interview", label: "Interview" },
  { key: "profile", label: "Profile" },
  { key: "subreddits", label: "Subreddits" },
  { key: "posts", label: "Posts" },
];

export function StepIndicator({ current }: { current: AppStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                isDone && "border-primary bg-primary text-white",
                isActive && "border-primary text-primary",
                !isDone && !isActive && "border-white/15 text-muted-foreground"
              )}
            >
              {isDone ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-white/10 sm:w-10" />}
          </div>
        );
      })}
    </div>
  );
}
