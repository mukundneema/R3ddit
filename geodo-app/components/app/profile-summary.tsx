"use client";

import { motion } from "framer-motion";
import { Building2, Target, Sparkles, MapPin, Flag, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BusinessProfile } from "@/lib/types";

interface ProfileSummaryProps {
  profile: BusinessProfile;
  onContinue: () => void;
  onRestart: () => void;
}

const FIELDS: { key: keyof BusinessProfile; label: string; icon: typeof Building2 }[] = [
  { key: "sells", label: "What they sell", icon: Package },
  { key: "targetCustomer", label: "Target customer", icon: Target },
  { key: "uniqueValue", label: "What makes them different", icon: Sparkles },
  { key: "location", label: "Where they operate", icon: MapPin },
  { key: "goal", label: "Campaign goal", icon: Flag },
];

export function ProfileSummary({ profile, onContinue, onRestart }: ProfileSummaryProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide">Business profile</span>
          </div>
          <CardTitle className="text-2xl">{profile.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{profile.description}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-foreground">
            {profile.summary}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.key} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <field.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{field.label}</div>
                  <div className="text-sm text-foreground">{profile[field.key]}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button onClick={onContinue} className="sm:flex-1">
              Find matching subreddits
            </Button>
            <Button onClick={onRestart} variant="secondary">
              Start over
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
