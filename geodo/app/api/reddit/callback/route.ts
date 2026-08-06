import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchRedditIdentity } from "@/lib/reddit";
import {
  encryptPayload,
  REDDIT_STATE_COOKIE,
  REDDIT_TOKEN_COOKIE,
  RedditTokenPayload,
} from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL("/app", req.url);

  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      url.searchParams.set("reddit_error", `Reddit denied authorization: ${error}`);
      return NextResponse.redirect(url);
    }

    const storedState = req.cookies.get(REDDIT_STATE_COOKIE)?.value;
    if (!code || !state || !storedState || state !== storedState) {
      url.searchParams.set("reddit_error", "Reddit authorization state did not match. Please try again.");
      return NextResponse.redirect(url);
    }

    const token = await exchangeCodeForToken(code);
    const identity = await fetchRedditIdentity(token.access_token);

    const payload: RedditTokenPayload = {
      accessToken: token.access_token,
      username: identity.username,
      expiresAt: Date.now() + token.expires_in * 1000,
    };

    const encrypted = encryptPayload(payload);

    url.searchParams.set("reddit_connected", "1");
    const res = NextResponse.redirect(url);

    res.cookies.set(REDDIT_TOKEN_COOKIE, encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: token.expires_in,
      path: "/",
    });
    res.cookies.set(REDDIT_STATE_COOKIE, "", { maxAge: 0, path: "/" });

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete Reddit authorization.";
    url.searchParams.set("reddit_error", message);
    return NextResponse.redirect(url);
  }
}
