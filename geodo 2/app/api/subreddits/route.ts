import { NextRequest, NextResponse } from "next/server";
import { getJSONCompletion } from "@/lib/openai";
import { BusinessProfile, SubredditRecommendation } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a Reddit growth expert who has spent years studying which subreddits
tolerate business owners talking about their products versus which ones will remove posts and ban
users on sight.

Given a business profile, recommend 6 real, currently-active subreddits (use real subreddit names
you are confident exist, without the "r/" prefix) that are plausible places this business could
engage with. Prioritize a realistic mix: a couple of large general subreddits relevant to the
industry, a couple of medium-sized niche communities, and a couple of smaller, highly-targeted
communities.

Respond with ONLY a JSON object of this exact shape:
{
  "subreddits": [
    {
      "name": string,                     // without "r/" prefix
      "subscribersEstimate": string,       // rough human-readable estimate, e.g. "~1.2M" or "~45K"
      "whyItMatches": string,              // 1-2 sentences on why this community fits
      "audienceFit": number,               // 0-100, how well the target customer overlaps with this community
      "promotionRisk": "low" | "medium" | "high",  // how risky direct or indirect self-promotion is here
      "linksTypicallyAllowed": boolean,    // whether this community typically tolerates outbound links
      "notes": string                      // a short practical tip for posting here (tone, timing, format)
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { profile } = (await req.json()) as { profile: BusinessProfile };

    if (!profile) {
      return NextResponse.json({ error: "A business profile is required." }, { status: 400 });
    }

    const userPrompt = `Business profile:\n${JSON.stringify(profile, null, 2)}`;

    const result = await getJSONCompletion<{ subreddits: SubredditRecommendation[] }>(
      SYSTEM_PROMPT,
      userPrompt,
      0.7
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to recommend subreddits.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
