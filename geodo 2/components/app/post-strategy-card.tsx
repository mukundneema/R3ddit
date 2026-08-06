"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, RefreshCw, ExternalLink, ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PostStrategy, RuleCheckResult } from "@/lib/types";
import { buildRedditSubmitUrl } from "@/lib/reddit";

const RISK_VARIANT = {
  low: "success",
  medium: "warning",
  high: "danger",
} as const;

interface PostStrategyCardProps {
  post: PostStrategy;
  subreddit: string;
  ruleCheck: RuleCheckResult | null;
  isCheckingRules: boolean;
  onRegenerate: () => Promise<void>;
}

export function PostStrategyCard({
  post,
  subreddit,
  ruleCheck,
  isCheckingRules,
  onRegenerate,
}: PostStrategyCardProps) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(`${post.title}\n\n${post.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  }

  const hasHighRiskWarning = ruleCheck?.overallRisk === "high" || ruleCheck?.excessiveSelfPromotion;
  const submitUrl = buildRedditSubmitUrl(subreddit, post.title, post.body);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="accent">{post.label}</Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {post.engagementScore}/100 engagement
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div>
            <div className="text-base font-semibold leading-snug text-foreground">{post.title}</div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {post.body}
            </p>
          </div>

          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Why this fits: </span>
            {post.whyItFits}
          </p>

          <div className="flex items-center gap-2">
            <Badge variant={RISK_VARIANT[post.removalRisk]}>{post.removalRisk} removal risk</Badge>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            {isCheckingRules ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Spinner className="h-3.5 w-3.5" />
                Checking against r/{subreddit}&apos;s rules...
              </div>
            ) : ruleCheck ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  {hasHighRiskWarning ? (
                    <ShieldAlert className="h-3.5 w-3.5 text-danger" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  )}
                  Rule check: {ruleCheck.overallRisk} risk
                </div>
                {ruleCheck.warnings.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {ruleCheck.warnings.map((warning, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-warning">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No rule violations detected.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Rule check unavailable.</p>
            )}
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </Button>
            <a href={submitUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="w-full" disabled={isCheckingRules}>
                <ExternalLink className="h-3.5 w-3.5" />
                Post on Reddit
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
