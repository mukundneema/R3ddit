import { NextRequest, NextResponse } from "next/server";
import { fetchSubredditRules } from "@/lib/reddit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { subreddit } = (await req.json()) as { subreddit: string };

    if (!subreddit) {
      return NextResponse.json({ error: "A subreddit name is required." }, { status: 400 });
    }

    const rules = await fetchSubredditRules(subreddit);
    return NextResponse.json({ rules });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch subreddit rules.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
