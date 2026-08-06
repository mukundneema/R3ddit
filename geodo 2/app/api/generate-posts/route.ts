import { NextRequest, NextResponse } from "next/server";
import { getJSONCompletion } from "@/lib/openai";
import { BusinessProfile, PostStrategy, PostStrategyType, SubredditRulesPayload } from "@/lib/types";

export const runtime = "nodejs";

const STRATEGY_LABELS: Record<PostStrategyType, string> = {
  founder_story: "Founder Story",
  educational: "Educational",
  question_discussion: "Question / Discussion",
};

const STRATEGY_DESCRIPTIONS: Record<PostStrategyType, string> = {
  founder_story:
    "A first-person, honest founder story about why this business exists and what problem it solves. Should read like a real Redditor sharing their journey, not an ad.",
  educational:
    "A genuinely useful, standalone educational post that teaches the reader something valuable related to the business's space. The business itself is mentioned briefly or not at all — the value is the takeaway.",
  question_discussion:
    "A post that opens a genuine discussion or asks the community a real question related to the business's space, designed to spark comments and engagement rather than promote directly.",
};

function buildSystemPrompt(types: PostStrategyType[]): string {
  return `You are an expert Reddit marketer who writes posts that sound like real community members,
never like ads. You deeply understand that Reddit punishes obvious self-promotion and rewards
authenticity, specificity, and value.

You will write ${types.length === 1 ? "one Reddit post" : "Reddit posts"} for the subreddit given,
following the subreddit's actual rules and typical tone. Each post must feel native to Reddit:
conversational, specific, no marketing buzzwords, no excessive emoji, no "check out my product" energy
unless the strategy explicitly calls for a light, honest mention.

Respond with ONLY a JSON object of this exact shape:
{
  "posts": [
    {
      "type": "founder_story" | "educational" | "question_discussion",
      "title": string,            // a Reddit-native title, following the subreddit's title conventions
      "body": string,             // the full post body in Reddit markdown, 120-350 words
      "whyItFits": string,        // 1-2 sentences on why this version fits this specific subreddit
      "engagementScore": number,  // 0-100 estimate of how likely this is to get upvotes/comments
      "removalRisk": "low" | "medium" | "high"  // estimate of how likely a moderator removes this
    }
  ]
}

Only include the strategies listed in the user prompt, in the order requested.`;
}

interface GenerateBody {
  profile: BusinessProfile;
  subreddit: string;
  rules: SubredditRulesPayload;
  strategy?: PostStrategyType; // if present, regenerate just this one
}

export async function POST(req: NextRequest) {
  try {
    const { profile, subreddit, rules, strategy } = (await req.json()) as GenerateBody;

    if (!profile || !subreddit || !rules) {
      return NextResponse.json(
        { error: "profile, subreddit, and rules are all required." },
        { status: 400 }
      );
    }

    const types: PostStrategyType[] = strategy
      ? [strategy]
      : ["founder_story", "educational", "question_discussion"];

    const userPrompt = `Business profile:\n${JSON.stringify(profile, null, 2)}

Target subreddit: r/${rules.subreddit} ("${rules.title}")
Subreddit public description: ${rules.publicDescription || "(none provided)"}
Subreddit submission type: ${rules.submissionType}
Subreddit rules:
${rules.rulesText}

Write the following strategies, in this order:
${types.map((t) => `- ${STRATEGY_LABELS[t]}: ${STRATEGY_DESCRIPTIONS[t]}`).join("\n")}

Make sure each post would plausibly NOT be removed under the rules above.`;

    const result = await getJSONCompletion<{
      posts: Array<Omit<PostStrategy, "label">>;
    }>(buildSystemPrompt(types), userPrompt, 0.85);

    const posts: PostStrategy[] = result.posts.map((p) => ({
      ...p,
      label: STRATEGY_LABELS[p.type] ?? p.type,
    }));

    if (strategy) {
      return NextResponse.json({ post: posts[0] });
    }

    return NextResponse.json({ posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate posts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
