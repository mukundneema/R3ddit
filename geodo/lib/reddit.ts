import { SubredditRulesPayload } from "./types";

const REDDIT_AUTH_BASE = "https://www.reddit.com/api/v1/authorize";
const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_OAUTH_BASE = "https://oauth.reddit.com";
const REDDIT_PUBLIC_BASE = "https://www.reddit.com";

function getUserAgent(): string {
  return process.env.REDDIT_USER_AGENT || "web:geodo:1.0.0 (by /u/unknown)";
}

function getRedirectUri(): string {
  const uri = process.env.REDDIT_REDIRECT_URI;
  if (!uri) {
    throw new Error("REDDIT_REDIRECT_URI is not set. Add it to your environment variables.");
  }
  return uri;
}

export function getRedditAuthUrl(state: string): string {
  const clientId = process.env.REDDIT_CLIENT_ID;
  if (!clientId) {
    throw new Error("REDDIT_CLIENT_ID is not set. Add it to your environment variables.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    state,
    redirect_uri: getRedirectUri(),
    duration: "temporary",
    scope: "identity submit",
  });

  return `${REDDIT_AUTH_BASE}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  error?: string;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Reddit client credentials are not configured.");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
  });

  const res = await fetch(REDDIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": getUserAgent(),
    },
    body: body.toString(),
  });

  const json = (await res.json()) as TokenResponse;
  if (!res.ok || json.error) {
    throw new Error(json.error || `Reddit token exchange failed with status ${res.status}`);
  }
  return json;
}

export async function fetchRedditIdentity(accessToken: string): Promise<{ username: string }> {
  const res = await fetch(`${REDDIT_OAUTH_BASE}/api/v1/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": getUserAgent(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Reddit identity (status ${res.status})`);
  }

  const json = await res.json();
  return { username: json.name as string };
}

/**
 * Fetches a subreddit's public description and rules using Reddit's
 * unauthenticated public JSON endpoints. No user token is required.
 */
export async function fetchSubredditRules(subreddit: string): Promise<SubredditRulesPayload> {
  const clean = subreddit.replace(/^r\//, "").trim();

  const [aboutRes, rulesRes] = await Promise.all([
    fetch(`${REDDIT_PUBLIC_BASE}/r/${clean}/about.json`, {
      headers: { "User-Agent": getUserAgent() },
      cache: "no-store",
    }),
    fetch(`${REDDIT_PUBLIC_BASE}/r/${clean}/about/rules.json`, {
      headers: { "User-Agent": getUserAgent() },
      cache: "no-store",
    }),
  ]);

  let title = clean;
  let publicDescription = "";
  let submissionType = "any";

  if (aboutRes.ok) {
    const aboutJson = await aboutRes.json();
    const data = aboutJson?.data;
    if (data) {
      title = data.title || clean;
      publicDescription = data.public_description || data.description || "";
      submissionType = data.submission_type || "any";
    }
  }

  let rulesText = "No community-specific rules were published for this subreddit.";
  if (rulesRes.ok) {
    const rulesJson = await rulesRes.json();
    const rules = rulesJson?.rules as
      | { short_name?: string; description?: string; violation_reason?: string }[]
      | undefined;

    if (rules && rules.length > 0) {
      rulesText = rules
        .map((rule, index) => {
          const name = rule.short_name || `Rule ${index + 1}`;
          const desc = (rule.description || "").slice(0, 400);
          return `${index + 1}. ${name}: ${desc}`;
        })
        .join("\n");
    }
  }

  return {
    subreddit: clean,
    title,
    publicDescription,
    rulesText,
    submissionType,
  };
}

interface SubmitResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function submitRedditPost(
  accessToken: string,
  subreddit: string,
  title: string,
  text: string
): Promise<SubmitResult> {
  const clean = subreddit.replace(/^r\//, "").trim();

  const body = new URLSearchParams({
    sr: clean,
    kind: "self",
    title,
    text,
    api_type: "json",
  });

  const res = await fetch(`${REDDIT_OAUTH_BASE}/api/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": getUserAgent(),
    },
    body: body.toString(),
  });

  const json = await res.json();
  const errors = json?.json?.errors;

  if (!res.ok || (errors && errors.length > 0)) {
    const message =
      errors && errors.length > 0
        ? errors.map((e: unknown[]) => e.join(" ")).join("; ")
        : `Reddit rejected the post (status ${res.status})`;
    return { success: false, error: message };
  }

  const permalink = json?.json?.data?.url as string | undefined;
  return { success: true, url: permalink };
}

/**
 * Builds a URL to Reddit's own native "create post" page, pre-filled with
 * a title and self-text body. Kept as a fallback for when Reddit OAuth
 * env vars aren't configured — opens Reddit's own submit form instead of
 * publishing through the app.
 */
export function buildRedditSubmitUrl(subreddit: string, title: string, text: string): string {
  const clean = subreddit.replace(/^r\//, "").trim();
  const params = new URLSearchParams({ title, selftext: "true", text });
  return `${REDDIT_PUBLIC_BASE}/r/${clean}/submit?${params.toString()}`;
}
