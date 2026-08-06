import { NextRequest, NextResponse } from "next/server";
import { submitRedditPost } from "@/lib/reddit";
import { decryptPayload, REDDIT_TOKEN_COOKIE, RedditTokenPayload } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(REDDIT_TOKEN_COOKIE)?.value;
    const payload = decryptPayload<RedditTokenPayload>(cookie);

    if (!payload || payload.expiresAt < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not connected to Reddit, or your session expired. Please reconnect.",
        },
        { status: 401 }
      );
    }

    const { subreddit, title, text } = (await req.json()) as {
      subreddit: string;
      title: string;
      text: string;
    };

    if (!subreddit || !title || !text) {
      return NextResponse.json(
        { success: false, error: "subreddit, title, and text are all required." },
        { status: 400 }
      );
    }

    const result = await submitRedditPost(payload.accessToken, subreddit, title, text);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish to Reddit.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
