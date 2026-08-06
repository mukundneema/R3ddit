import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { FeatureCards } from "@/components/landing/feature-cards";
import { GradientBackground } from "@/components/landing/gradient-background";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <GradientBackground />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
            G
          </div>
          <span className="text-sm font-semibold tracking-tight">Geodo</span>
        </div>
        <Link href="/app">
          <Button variant="secondary" size="sm">
            Open the app
          </Button>
        </Link>
      </header>

      <div className="relative z-10">
        <Hero />
        <FeatureCards />
      </div>

      <footer className="relative z-10 border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <span>Geodo — built for a single browser session. No accounts, no database.</span>
          <span>Powered by OpenAI + the Reddit API.</span>
        </div>
      </footer>
    </main>
  );
}
