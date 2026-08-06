import { NextResponse } from "next/server";
import { REDDIT_TOKEN_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(REDDIT_TOKEN_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
