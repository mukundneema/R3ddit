import { NextRequest, NextResponse } from "next/server";
import { decryptPayload, REDDIT_TOKEN_COOKIE, RedditTokenPayload } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(REDDIT_TOKEN_COOKIE)?.value;
  const payload = decryptPayload<RedditTokenPayload>(cookie);

  if (!payload || payload.expiresAt < Date.now()) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({ connected: true, username: payload.username });
}
