# Geodo — AI Reddit Marketing Assistant

Geodo interviews you about your business (chat-style, like ChatGPT), builds a
structured profile, recommends real subreddits with fit/risk scores, writes
three post strategies per subreddit (Founder Story, Educational, Question /
Discussion), checks each draft against that subreddit's actual rules, and
then hands you off to Reddit's own "create post" page, pre-filled and ready
to submit.

**No sign-up. No database. No auth system of its own, and no Reddit API
approval required.** Everything lives in one browser session — your
business profile, subreddit list, and generated posts live in
`sessionStorage` on the client, and there's no server-side session store at
all.

## Why there's no direct Reddit publishing

Reddit shut down instant self-serve API app creation. Getting a Reddit
API client ID/secret today requires filing a manual approval request under
Reddit's "Responsible Builder Policy," and small/personal projects are
reported as the most-often-rejected category, sometimes with no response at
all. Rather than block this app on an approval process that may never come
through, **Publish** opens Reddit's own native submit page
(`reddit.com/r/<subreddit>/submit`) in a new tab, pre-filled with the
AI-generated title and body via query parameters. You review it on Reddit's
own page, logged in as yourself, and click Post there. It's one extra click
instead of a silent auto-publish — but it works today, for everyone, with no
approval wait.

If Reddit's policy changes later and self-serve API access comes back, the
publish flow can be swapped for a direct API call again without touching
anything upstream of `components/app/post-strategy-card.tsx`.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + hand-rolled shadcn/ui-style components (no external UI
  package, so there's nothing extra to install)
- Framer Motion for animation
- OpenAI API (`gpt-4o-mini` by default) for the interview summary, subreddit
  recommendations, post generation, and rule checking
- Reddit's public, unauthenticated JSON endpoints (`/about.json`,
  `/about/rules.json`) for fetching real subreddit rules — no API key needed
  for this, it's the same data anyone sees browsing reddit.com

## 1. Install

```bash
npm install
```

## 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Then fill in `.env.local` — there's only one required value:

```
OPENAI_API_KEY=sk-...
```

Get a key from https://platform.openai.com/api-keys. This app uses
`gpt-4o-mini`, which is inexpensive — testing the full flow many times over
should cost well under $1. OpenAI requires a payment method on file; you can
set a spending limit under Settings → Billing → Limits to cap it (e.g. $5)
while testing.

## 3. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`. Click **Start Creating**, answer the six
interview questions, review your profile, pick a subreddit, generate posts,
review the rule check, and click **Post on Reddit** — it opens Reddit's
submit page in a new tab with everything pre-filled, ready for you to review
and hit Post yourself.

## 4. Deploy to Vercel

1. Push this project to a GitHub repo.
2. Import the repo in Vercel (Framework Preset: Next.js, auto-detected).
3. If your repo has `package.json` inside a subfolder rather than at the
   root, set **Root Directory** to that subfolder name.
4. Add one environment variable in Vercel's project settings:
   `OPENAI_API_KEY`.
5. Deploy. No build steps or extra setup required.

## How the pieces fit together

```
Landing (/)                →  marketing page, "Start Creating" → /app
App (/app)                 →  client-side state machine (interview → profile
                               → subreddits → posts), persisted to
                               sessionStorage
/api/interview/summarize   →  turns the Q&A transcript into a BusinessProfile
                               (OpenAI)
/api/subreddits             →  recommends 6 subreddits for that profile
                               (OpenAI)
/api/subreddit-rules        →  fetches a subreddit's real public rules from
                               Reddit's public JSON endpoints (no auth needed)
/api/generate-posts         →  writes (or regenerates one of) the 3 post
                               strategies for a subreddit, using its real
                               rules as context (OpenAI)
/api/rule-check              →  scores a draft against the subreddit's rules
                               for self-promotion, tone, and title
                               conventions (OpenAI)
"Post on Reddit" button     →  opens reddit.com/r/<subreddit>/submit in a new
                               tab, pre-filled with the title and body —
                               submission happens on Reddit's own page
```

## What I'd extend first

1. **Streaming AI responses.** Right now each AI call blocks until it's
   fully done. Streaming the interview summary and post drafts token-by-
   token would strengthen the "ChatGPT feel."
2. **Multi-subreddit batch generation.** Let the user select several
   subreddits at once and generate/queue posts for all of them.
3. **Smarter rule checking.** The rule checker currently only sees a
   subreddit's `rules.json` text. Pulling the top few recent posts (via the
   public `.json` listing endpoint) and feeding their tone/format into the
   rule check would catch unwritten norms, not just written rules.
4. **A lightweight "posted" tracker.** After a user clicks "Post on Reddit,"
   let them mark that post as posted (stored in `sessionStorage`) so the UI
   reflects it, since the app itself can't verify what happened in the
   Reddit tab.
5. **Direct Reddit API publishing, if/when access opens back up.** If Reddit
   approves an OAuth app for this project down the line (or the approval
   process eases), swap `buildRedditSubmitUrl` in `lib/reddit.ts` for a real
   `submitRedditPost` call — the rest of the app doesn't need to change.
6. **Better error surfaces on generation failures.** Right now errors from
   OpenAI or Reddit's public endpoints surface as a single banner message;
   mapping specific failure types (rate limits, invalid subreddit names) to
   more actionable copy would help.
