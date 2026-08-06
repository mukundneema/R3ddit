"use client";

import { motion } from "framer-motion";
import { ArrowRight, Link2, Link2Off, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubredditRecommendation } from "@/lib/types";

const RISK_VARIANT = {
  low: "success",
  medium: "warning",
  high: "danger",
} as const;

interface SubredditCardProps {
  subreddit: SubredditRecommendation;
  onSelect: () => void;
  isLoading?: boolean;
  index: number;
}

export function SubredditCard({ subreddit, onSelect, isLoading, index }: SubredditCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Card className="flex h-full flex-col transition-colors hover:bg-white/[0.06]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-foreground">r/{subreddit.name}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {subreddit.subscribersEstimate} subscribers
              </div>
            </div>
            <Badge variant={RISK_VARIANT[subreddit.promotionRisk]}>
              {subreddit.promotionRisk} risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <p className="text-sm text-muted-foreground">{subreddit.whyItMatches}</p>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Audience fit</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${subreddit.audienceFit}%` }}
                />
              </div>
              <span className="font-medium text-foreground">{subreddit.audienceFit}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {subreddit.linksTypicallyAllowed ? (
                <>
                  <Link2 className="h-3.5 w-3.5 text-success" /> Links OK
                </>
              ) : (
                <>
                  <Link2Off className="h-3.5 w-3.5 text-danger" /> No links
                </>
              )}
            </div>
          </div>

          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground">
            {subreddit.notes}
          </p>

          <Button onClick={onSelect} disabled={isLoading} className="mt-auto group">
            {isLoading ? "Generating posts..." : "Write posts for this subreddit"}
            {!isLoading && (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
