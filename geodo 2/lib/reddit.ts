import { SubredditRulesPayload } from "./types";

const REDDIT_PUBLIC_BASE = "https://www.reddit.com";

// Reddit asks API clients to send a descriptive User-Agent. This is a public,
// unauthenticated request (no OAuth, no API keys, no approval process) so a
// generic one is fine.
const USER_AGENT = "web:geodo-prototype:1.0.0 (by /u/geodo-app)";

/**
 * Fetches a subreddit's public description and rules using Reddit's
 * unauthenticated public JSON endpoints. No user token, client ID, or
 * secret is required for this — it's the same data anyone can see by
 * visiting reddit.com in a browser.
 */
export async function fetchSubredditRules(subreddit: string): Promise<SubredditRulesPayload> {
  const clean = subreddit.replace(/^r\//, "").trim();

  const [aboutRes, rulesRes] = await Promise.all([
    fetch(`${REDDIT_PUBLIC_BASE}/r/${clean}/about.json`, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    }),
    fetch(`${REDDIT_PUBLIC_BASE}/r/${clean}/about/rules.json`, {
      headers: { "User-Agent": USER_AGENT },
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

/**
 * Builds a URL to Reddit's own native "create post" page, pre-filled with
 * a title and self-text body. Opening this in a new tab lets a logged-in
 * Reddit user review and submit the post themselves — no OAuth, no API
 * keys, no approval process required.
 */
export function buildRedditSubmitUrl(subreddit: string, title: string, text: string): string {
  const clean = subreddit.replace(/^r\//, "").trim();
  const params = new URLSearchParams({ title, selftext: "true", text });
  return `${REDDIT_PUBLIC_BASE}/r/${clean}/submit?${params.toString()}`;
}
