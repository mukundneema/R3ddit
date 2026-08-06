import { NextRequest, NextResponse } from "next/server";
import { getJSONCompletion } from "@/lib/openai";
import { PostStrategy, RuleCheckResult, SubredditRulesPayload } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a strict Reddit moderator reviewing a draft post before it is submitted.
You care about three things above all: (1) the post is not excessive self-promotion, (2) the tone
genuinely matches this specific subreddit's culture, and (3) the title follows the subreddit's title
conventions and any explicit rules provided.

Be skeptical and specific. If the post reads like an ad, say so. If the subreddit rules restrict or ban
self-promotion and the post promotes a product or link, flag it clearly.

Respond with ONLY a JSON object of this exact shape:
{
  "passesBasicChecks": boolean,
  "excessiveSelfPromotion": boolean,
  "toneMatchesSubreddit": boolean,
  "titleFollowsConventions": boolean,
  "warnings": string[],        // specific, actionable warnings; empty array if none
  "overallRisk": "low" | "medium" | "high"
}`;

interface RuleCheckBody {
  post: PostStrategy;
  rules: SubredditRulesPayload;
}

export async function POST(req: NextRequest) {
  try {
    const { post, rules } = (await req.json()) as RuleCheckBody;

    if (!post || !rules) {
      return NextResponse.json({ error: "post and rules are required." }, { status: 400 });
    }

    const userPrompt = `Subreddit: r/${rules.subreddit}
Subreddit rules:
${rules.rulesText}

Draft post title: ${post.title}

Draft post body:
${post.body}`;

    const result = await getJSONCompletion<RuleCheckResult>(SYSTEM_PROMPT, userPrompt, 0.3);

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to run the rule check.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
