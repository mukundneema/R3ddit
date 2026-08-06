# Geodo — AI Reddit Marketing Assistant

Geodo interviews you about your business (chat-style, like ChatGPT), builds a
structured profile, recommends real subreddits with fit/risk scores, writes
three post strategies per subreddit (Founder Story, Educational, Question /
Discussion), checks each draft against that subreddit's actual rules, and
publishes directly to Reddit once you authorize your account.

**No sign-up. No database. No auth system of its own.** Everything lives in
one browser session:
- Your business profile, subreddit list, and generated posts live in
  `sessionStorage` on the client.
- Your Reddit login lives in a single encrypted, httpOnly cookie (AES-256-GCM,
  keyed by `SESSION_SECRET`). There is no server-side session store — the
  cookie *is* the session.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + hand-rolled shadcn/ui-style components (no external UI
  package, so there's nothing extra to install)
- Framer Motion for animation
- OpenAI API (`gpt-4o-mini` by default) for the interview summary, subreddit
  recommendations, post generation, and rule checking
- Reddit OAuth (`https://www.reddit.com/api/v1/authorize` + the official
  Reddit API) for authorization and publishing

## 1. Install

```bash
npm install
```

## 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

### OpenAI
Get an API key from https://platform.openai.com/api-keys and set:
```
OPENAI_API_KEY=sk-...
```

### Reddit OAuth app
1. Go to https://www.reddit.com/prefs/apps
2. Click **create another app...**
3. Choose type **web app**
4. Set the redirect URI to exactly `http://localhost:3000/api/reddit/callback`
   for local dev (you'll add a second one for production later)
5. Copy the client ID (under the app name) and the secret into:
```
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_REDIRECT_URI=http://localhost:3000/api/reddit/callback
REDDIT_USER_AGENT=web:geodo:1.0.0 (by /u/your_reddit_username)
```
Reddit is strict about the `User-Agent` header — keep the format above
(platform:appname:version (by /u/username)).

### Session secret
Generate a random secret used to encrypt the Reddit token cookie:
```bash
openssl rand -hex 32
```
```
SESSION_SECRET=<paste the generated value>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`. Click **Start Creating**, answer the six
interview questions, review your profile, pick a subreddit, generate posts,
connect Reddit, review the rule check, and publish.

### How to test this safely

Publishing is real — it posts to actual Reddit through the real API, so
be deliberate about what you test with:

- **Use a throwaway/test Reddit account**, not your main one, while you're
  iterating on prompts and UI.
- **Post to `r/test`** — a subreddit that exists specifically for testing API
  integrations. It's low-traffic and posts there are expected.
- Alternatively, **create a private test subreddit** you moderate
  (reddit.com/subreddits/create), set it to private, and generate/publish
  posts there — nobody else will ever see them.
- The app includes an explicit **approve-before-publish** step: clicking
  "Publish" doesn't submit immediately, it opens a confirmation panel telling
  you exactly which subreddit it's about to post to. Nothing goes live until
  you click "Confirm & publish."
- Reddit rate-limits new/low-karma accounts and OAuth apps more aggressively
  than established ones — if `submitRedditPost` in `lib/reddit.ts` returns a
  `RATELIMIT` error, that's Reddit, not a bug in the app; wait a few minutes.

## 4. Deploy to Vercel

1. Push this project to a GitHub repo.
2. Import the repo in Vercel.
3. Add the same environment variables from `.env.local` in the Vercel
   project's **Settings → Environment Variables** — but set:
   ```
   REDDIT_REDIRECT_URI=https://your-app.vercel.app/api/reddit/callback
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
4. In your Reddit app settings (https://www.reddit.com/prefs/apps), add a
   second redirect URI: `https://your-app.vercel.app/api/reddit/callback`
   (Reddit apps can have multiple redirect URIs, or you can point your one
   URI at production once you're done testing locally).
5. Deploy. No build steps, database migrations, or extra setup required —
   it's a standard Next.js app.

## How the pieces fit together

```
Landing (/)              →  marketing page, "Start Creating" → /app
App (/app)                →  client-side state machine (interview → profile
                              → subreddits → posts), persisted to
                              sessionStorage so it survives the Reddit OAuth
                              redirect round-trip
/api/interview/summarize  →  turns Q&A transcript into a BusinessProfile (OpenAI)
/api/subreddits           →  recommends 6 subreddits for that profile (OpenAI)
/api/subreddit-rules      →  fetches a subreddit's public rules from Reddit's
                              public JSON endpoints (no auth needed)
/api/generate-posts       →  writes (or regenerates one of) the 3 post
                              strategies for a subreddit, using its real rules
                              as context (OpenAI)
/api/rule-check           →  scores a draft against the subreddit's rules for
                              self-promotion, tone, and title conventions (OpenAI)
/api/reddit/auth          →  redirects to Reddit's OAuth authorize screen
/api/reddit/callback      →  exchanges the code for a token, encrypts it into
                              a cookie, redirects back to /app
/api/reddit/me            →  reports current connection status
/api/reddit/publish       →  submits the chosen post via oauth.reddit.com
/api/reddit/logout        →  clears the session cookie
```

## What I'd extend first

1. **Streaming AI responses.** Right now each AI call blocks until it's fully
   done. Streaming the interview summary and post drafts token-by-token would
   make the "ChatGPT feel" much stronger.
2. **Multi-subreddit batch generation.** Let the user select several
   subreddits at once and generate/queue posts for all of them, with a
   lightweight review queue before publishing each.
3. **Smarter rule checking.** Right now the rule checker only sees the
   subreddit's `rules.json` text. Pulling the top few recent posts (via the
   public `.json` listing endpoint) and feeding their tone/format into the
   rule check would catch unwritten norms, not just written rules.
4. **Scheduling.** Reddit's API supports posting now only, but you could add
   a "queue for later" UI backed by a serverless cron (Vercel Cron) that
   re-encrypts and holds the token until the scheduled time — still no
   database required if you keep the queue in a signed cookie or short-lived
   KV entry.
5. **Image/link post support.** Currently only self (text) posts are
   supported (`kind: "self"`). Adding `kind: "link"` support would let the
   tool promote a URL directly where that's allowed.
6. **Better error surfaces on Reddit rejections.** Reddit's submit API
   returns coded errors (e.g. `RATELIMIT`, `SUBREDDIT_NOTALLOWED`). Mapping
   those codes to specific, actionable copy instead of the raw message would
   help non-technical users self-serve.
7. **Persisting across full browser restarts.** Session state currently lives
   in `sessionStorage`, so closing the tab loses it (by design — no DB). If
   you want it to survive a full browser restart without adding a database,
   swap `sessionStorage` for `localStorage` in `components/app/app-shell.tsx`.
