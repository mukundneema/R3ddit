import { NextRequest, NextResponse } from "next/server";
import { getRedditAuthUrl } from "@/lib/reddit";
import { REDDIT_STATE_COOKIE, generateState } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const state = generateState();
    const authUrl = getRedditAuthUrl(state);

    const res = NextResponse.redirect(authUrl);
    res.cookies.set(REDDIT_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes to complete the flow
      path: "/",
    });

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start Reddit authorization.";
    const url = new URL("/app", req.url);
    url.searchParams.set("reddit_error", message);
    return NextResponse.redirect(url);
  }
}
