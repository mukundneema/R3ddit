"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AlertCircle, ArrowLeft, X } from "lucide-react";
import { ChatInterview } from "@/components/app/chat-interview";
import { ProfileSummary } from "@/components/app/profile-summary";
import { SubredditCard } from "@/components/app/subreddit-card";
import { PostStrategyCard } from "@/components/app/post-strategy-card";
import { RedditConnectButton, RedditStatus } from "@/components/app/reddit-connect-button";
import { StepIndicator, AppStep } from "@/components/app/step-indicator";
import { GradientBackground } from "@/components/landing/gradient-background";
import { Skeleton } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  BusinessProfile,
  InterviewAnswer,
  PostStrategy,
  PublishResult,
  RuleCheckResult,
  SubredditRecommendation,
  SubredditRulesPayload,
} from "@/lib/types";

const STORAGE_KEY = "geodo_session_v1";

interface StoredState {
  step: AppStep;
  profile: BusinessProfile | null;
  subreddits: SubredditRecommendation[];
  selectedSubreddit: string | null;
  rules: SubredditRulesPayload | null;
  posts: PostStrategy[];
  ruleChecks: Record<string, RuleCheckResult>;
}

const EMPTY_STATE: StoredState = {
  step: "interview",
  profile: null,
  subreddits: [],
  selectedSubreddit: null,
  rules: null,
  posts: [],
  ruleChecks: {},
};

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `Request to ${url} failed`);
  }
  return json as T;
}

function AppPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<StoredState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isFindingSubreddits, setIsFindingSubreddits] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [checkingRules, setCheckingRules] = useState<Record<string, boolean>>({});
  const [isRedditConnected, setIsRedditConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);

  // Hydrate from sessionStorage on mount (survives the Reddit OAuth redirect).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState(JSON.parse(raw) as StoredState);
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist to sessionStorage on every change.
  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  // Handle the redirect back from Reddit OAuth.
  useEffect(() => {
    const connected = searchParams.get("reddit_connected");
    const redditError = searchParams.get("reddit_error");

    if (connected) {
      setOauthNotice("Reddit connected successfully. You can publish now.");
      router.replace("/app");
    }
    if (redditError) {
      setError(redditError);
      router.replace("/app");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function update(partial: Partial<StoredState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  function resetAll() {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(EMPTY_STATE);
    setError(null);
  }

  async function handleInterviewComplete(answers: InterviewAnswer[]) {
    setIsSummarizing(true);
    setError(null);
    try {
      const { profile } = await postJSON<{ profile: BusinessProfile }>(
        "/api/interview/summarize",
        { answers }
      );
      update({ profile, step: "profile" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSummarizing(false);
    }
  }

  async function handleFindSubreddits() {
    if (!state.profile) return;
    setIsFindingSubreddits(true);
    setError(null);
    try {
      const { subreddits } = await postJSON<{ subreddits: SubredditRecommendation[] }>(
        "/api/subreddits",
        { profile: state.profile }
      );
      update({ subreddits, step: "subreddits" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsFindingSubreddits(false);
    }
  }

  async function generatePostsForSubreddit(subredditName: string) {
    if (!state.profile) return;
    setGeneratingFor(subredditName);
    setError(null);
    try {
      const { rules } = await postJSON<{ rules: SubredditRulesPayload }>(
        "/api/subreddit-rules",
        { subreddit: subredditName }
      );

      const { posts } = await postJSON<{ posts: PostStrategy[] }>("/api/generate-posts", {
        profile: state.profile,
        subreddit: subredditName,
        rules,
      });

      update({
        selectedSubreddit: subredditName,
        rules,
        posts,
        ruleChecks: {},
        step: "posts",
      });

      // Kick off rule checks for each post in parallel.
      posts.forEach((post) => runRuleCheck(post, rules));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGeneratingFor(null);
    }
  }

  async function runRuleCheck(post: PostStrategy, rules: SubredditRulesPayload) {
    setCheckingRules((prev) => ({ ...prev, [post.type]: true }));
    try {
      const { result } = await postJSON<{ result: RuleCheckResult }>("/api/rule-check", {
        post,
        rules,
      });
      setState((prev) => ({
        ...prev,
        ruleChecks: { ...prev.ruleChecks, [post.type]: result },
      }));
    } catch {
      // Non-fatal: the card will just show "unavailable"
    } finally {
      setCheckingRules((prev) => ({ ...prev, [post.type]: false }));
    }
  }

  async function handleRegenerate(post: PostStrategy) {
    if (!state.profile || !state.rules || !state.selectedSubreddit) return;
    try {
      const { post: newPost } = await postJSON<{ post: PostStrategy }>("/api/generate-posts", {
        profile: state.profile,
        subreddit: state.selectedSubreddit,
        rules: state.rules,
        strategy: post.type,
      });

      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p.type === newPost.type ? newPost : p)),
      }));

      runRuleCheck(newPost, state.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate that post.");
    }
  }

  function handleRequireConnect() {
    // Snapshot state before leaving the page, so it's restored after the
    // Reddit OAuth redirect round-trip.
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.location.href = "/api/reddit/auth";
  }

  async function handlePublish(subreddit: string, title: string, text: string): Promise<PublishResult> {
    try {
      const res = await fetch("/api/reddit/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddit, title, text }),
      });
      return (await res.json()) as PublishResult;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to publish." };
    }
  }

  const stepForIndicator: AppStep = useMemo(() => {
    if (state.step === "posts") return "posts";
    if (state.step === "subreddits") return "subreddits";
    if (state.step === "profile") return "profile";
    return "interview";
  }, [state.step]);

  if (!hydrated) {
    return (
      <main className="relative min-h-screen">
        <GradientBackground />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      <GradientBackground />

      <header className="relative z-10 border-b border-white/10 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
              G
            </div>
            <span className="text-sm font-semibold">Geodo</span>
          </Link>
          <StepIndicator current={stepForIndicator} />
          <RedditConnectButton
            onStatusChange={(s: RedditStatus) => setIsRedditConnected(s.connected)}
          />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <AnimatePresence>
          {oauthNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            >
              {oauthNotice}
              <button onClick={() => setOauthNotice(null)}>
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </span>
              <button onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {state.step === "interview" && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-gradient">Tell Geodo about your business</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Six quick questions. Then I&apos;ll find the right subreddits and write your posts.
              </p>
            </div>
            <div className="h-[520px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              {isSummarizing ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <p className="mt-2 text-sm text-muted-foreground">Building your business profile...</p>
                </div>
              ) : (
                <ChatInterview onComplete={handleInterviewComplete} />
              )}
            </div>
          </div>
        )}

        {state.step === "profile" && state.profile && (
          <div className="mx-auto max-w-2xl">
            <ProfileSummary
              profile={state.profile}
              onContinue={handleFindSubreddits}
              onRestart={resetAll}
            />
            {isFindingSubreddits && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            )}
          </div>
        )}

        {state.step === "subreddits" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gradient">Recommended subreddits</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick one to generate three post strategies for it.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => update({ step: "profile" })}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {state.subreddits.map((s, i) => (
                <SubredditCard
                  key={s.name}
                  subreddit={s}
                  index={i}
                  isLoading={generatingFor === s.name}
                  onSelect={() => generatePostsForSubreddit(s.name)}
                />
              ))}
            </div>
          </div>
        )}

        {state.step === "posts" && state.selectedSubreddit && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gradient">
                  Posts for r/{state.selectedSubreddit}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each draft was checked against this subreddit&apos;s actual rules. Publishing
                  requires an extra confirmation step.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => update({ step: "subreddits" })}>
                <ArrowLeft className="h-4 w-4" />
                Back to subreddits
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {state.posts.map((post) => (
                <PostStrategyCard
                  key={post.type}
                  post={post}
                  subreddit={state.selectedSubreddit!}
                  ruleCheck={state.ruleChecks[post.type] ?? null}
                  isCheckingRules={!!checkingRules[post.type]}
                  isConnectedToReddit={isRedditConnected}
                  onRegenerate={() => handleRegenerate(post)}
                  onPublish={handlePublish}
                  onRequireConnect={handleRequireConnect}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AppShell() {
  return (
    <Suspense fallback={<main className="relative min-h-screen bg-background" />}>
      <AppPageInner />
    </Suspense>
  );
}
