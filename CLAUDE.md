# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app does
**Captionly** — an AI-powered content generator for local businesses (salons, gyms, restaurants, dentists). Business owners enter their info and get 30 days of social media posts, Google Business descriptions, and email newsletters.

Tagline: _"Make content that gets results."_

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS v3
- Backend: Node.js + Express + TypeScript
- Database: Supabase (PostgreSQL + Auth)
- AI: Google Gemini API (gemini-2.5-flash model)
- Deployment: Vercel

## Commands

### Run both client and server together
```bash
npm run dev          # from repo root — runs both concurrently
```

### Client only (React + Vite)
```bash
cd client
npm run dev          # dev server on http://localhost:5173
npm run build        # production build
npm run lint         # ESLint
```

### Server only (Express)
```bash
cd server
npm run dev          # nodemon + ts-node on http://localhost:3001
npm run build        # compile to dist/
npm start            # run compiled dist/index.js
```

## Architecture

### Client (`/client`)
- Entry: `src/main.tsx` → mounts into `index.html`
- `src/pages/` — top-level route components
- `src/components/` — shared UI components
- Tailwind is configured via `tailwind.config.js` (content: `./src/**/*.{ts,tsx}`) and loaded in `src/index.css` with `@tailwind base/components/utilities`

### Server (`/server`)
- Entry: `src/index.ts` — sets up Express, CORS (allows `CLIENT_URL`), JSON body parsing, and mounts routes
- `src/routes/` — route modules exported as Express `Router` instances, mounted at `/api/<name>`
- Health check endpoint: `GET /api/health`
- Uses CommonJS module output (`tsconfig.json` → `"module": "commonjs"`); use `require`-style imports only if needed at runtime — otherwise `import` works via `ts-node`

### Lib files (already created)
- `client/src/lib/supabase.ts` — Supabase browser client (uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)
- `server/src/lib/supabase.ts` — Supabase server client (uses `SUPABASE_URL` / `SUPABASE_ANON_KEY`)
- `server/src/lib/gemini.ts` — Gemini API client (uses `GEMINI_API_KEY`, model: `gemini-1.5-flash`)

### Auth
`client/src/context/AuthContext.tsx` wraps the app in `main.tsx` and exposes the Supabase session via `useAuth()` with `login`, `signup`, `signInWithGoogle`, and `logout` actions.

**Google OAuth:** `signInWithGoogle()` calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '${origin}/auth/callback' } })`. The provider must be enabled in **Supabase dashboard → Authentication → Providers → Google** and the callback URL added to **Authentication → URL Configuration → Redirect URLs**. After Google completes the flow, the user lands on `/auth/callback` ([client/src/pages/AuthCallback.tsx](client/src/pages/AuthCallback.tsx)) which waits for the session to settle, queries `businesses` for the user, and routes to `/dashboard` (business exists) or `/onboarding` (no business). Errors from Google (e.g. user denied access) are surfaced from the URL hash/query and show a "Sign-in failed" card with a back-to-login link.

### Database
SQL files live in `supabase/`:
- `supabase/schema.sql` — `businesses` table (one row per user, unique index on `user_id`) with columns `name`, `type`, `city`, `country`, `audience`, `tone`, `description`. RLS policies restrict each user to their own row.
- `supabase/content_schema.sql` — `posts` table for AI-generated content. Columns: `id`, `user_id`, `business_id`, `day_number` (1–30), `platform` (`Instagram` | `Facebook`), `content`, `created_at`. Unique index on `(business_id, day_number)` so re-generation upserts cleanly. RLS policies restrict each user to their own posts.
- `supabase/businesses_google_bio.sql` — adds a `google_bio text` column to `businesses` to hold the AI-generated Google Business Profile description (max 750 chars). Idempotent — uses `add column if not exists`.

Run each file in the Supabase SQL editor (once) to set the schema up.

> **Migration note:** the `state` column was renamed to `country`. If your Supabase project still has the old column, run:
> ```sql
> alter table businesses rename column state to country;
> ```

### Environment
Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env` before running. Required vars:

**server/.env**
```
PORT=3001
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

**client/.env**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Coding Conventions
- TypeScript everywhere; functional React components only
- camelCase for variables/functions, PascalCase for components and types
- JSDoc comments on all functions
- `async/await` only — never `.then()` chains
- Tailwind classes only — never inline styles
- Never expose API keys in frontend code; all secrets in `server/.env`

## Brand & Theme (dark)
The app is a **dark-themed** SaaS UI. Use these tokens (also defined as CSS vars in [client/src/index.css](client/src/index.css)):

| Token            | Value     | Usage                                    |
| ---------------- | --------- | ---------------------------------------- |
| Background       | `#0a0a0a` | Page background (near black)             |
| Card             | `#111111` | Primary card surface                     |
| Card 2           | `#1a1a1a` | Inputs, hover surfaces, secondary panels |
| Border           | `#27272a` | All borders / dividers                   |
| Text primary     | `#ffffff` | Headings, primary copy                   |
| Text secondary   | `#a1a1aa` | (`zinc-400`) Subtle copy, labels         |
| Primary accent   | `#7c3aed` | Buttons, focus rings, active states      |
| Secondary accent | `#a855f7` | Links, icons, gradients, highlights      |
| Button hover     | `#6d28d9` | Primary button hover                     |

Brand mark: the wordmark **`Captionly`** in white followed by a small purple dot (`#7c3aed`) with a soft glow. No image logo / no sparkle icon.

Primary button pattern: `bg-gradient-to-r from-[#7c3aed] to-[#a855f7]` with `shadow-[#7c3aed]/30`. Solid-purple `bg-[#7c3aed]` is acceptable for compact CTAs.

Inputs: `bg-[#1a1a1a]` with `border-[#27272a]`, focus ring `#7c3aed`. White text, `placeholder-zinc-500`.

## Constraints
- Do not install new packages without confirming with the user first

## Current Status

**Completed features:**
- Auth — signup, login, logout, email confirmation, post-login redirect logic based on whether a business row exists or not
- Onboarding form — country dropdown + city, saves to `businesses` table with `upsert(..., { onConflict: 'user_id' })`
- Dashboard UI — welcome header, 4 stat cards (Posts Generated, Posts Scheduled, Google Bio: Ready, Emails Drafted), content calendar (7 days), business info sidebar, logout button
- AI content generation — `POST /api/content/generate` works end to end: Gemini generates 7 social-media posts with emojis and hashtags tailored to the business profile, posts upsert to the `posts` table, and render in the dashboard calendar cards
  - `posts` table created in Supabase (schema in [supabase/content_schema.sql](supabase/content_schema.sql))
  - `ws` package installed in `server/` and passed as `realtime.transport` to the per-request `createClient` — required because Node 20 has no global WebSocket and supabase-js eagerly constructs a `RealtimeClient` inside `createClient`. Without this the route crashes with `ERR_EMPTY_RESPONSE` on the client.
  - The per-request Supabase client carrying the user's JWT inside [server/src/routes/content.ts](server/src/routes/content.ts) is **correct and should stay as is** — it's required so RLS policies match `auth.uid()` to `user_id`. Do **not** replace it with the shared `../lib/supabase` client (that one uses the anon key with no user context and would make every RLS-protected query return zero rows).
- **Session 8 — Full UI polish (complete):** initial light-theme indigo/purple polish across all pages, sparkle logo mark, fade-in animations, responsive layouts. **Superseded by Session 9 — kept for history.**
- **Session 12 — Dashboard layout reorg (complete):** repositioned the dashboard so the **content calendar is the visible hero above the fold**. Same data, restructured layout in [client/src/pages/Dashboard.tsx](client/src/pages/Dashboard.tsx).
  - **Top row:** welcome heading on the left, `Regenerate` (when posts exist) + `Generate Content` buttons on the right. Generate buttons moved out of the ideas card so they're always visible regardless of textarea state.
  - **Two-column body** (`xl:grid-cols-[7fr_3fr]`, single column below xl):
    - **Left (70%):** compact 2-row ideas textarea (no buttons inside, char counter inline with the label) + Content Calendar in a 2-column grid.
    - **Right (30%):** stat cards stacked vertically as horizontal mini-cards (icon left, value/label right, "Soon" pill right-aligned for placeholders); compact Google Bio card (bio in `max-h-44 overflow-y-auto` so a long description doesn't blow out the column); compact Business Info card.
  - **Calendar cards as hero:** `min-h-[260px]` (was 200), prominent `text-4xl` day number with a "Day" micro-label, platform pill top-right, content with `line-clamp-3` by default + a purple `Show more / Show less` toggle (only renders when `content.length > 200`), Copy button **always visible** in the bottom-right. New state: `expandedIds: Set<string>` for per-card expand toggling.
  - **Scroll-for-more hint:** a subtle fixed pill at `bottom-6 left-1/2` that fades out (500ms) once `window.scrollY > 80`. Driven by a `scroll` listener + `hasScrolled: boolean` state. No DOM measurement — if the page is short, the pill just disappears on the first tick of scroll.
  - Empty-day placeholder cards also got the larger day number to match the hero treatment.
  - Container widened from `max-w-6xl` → `max-w-7xl` to give the new two-column grid more room on wide displays.
- **Session 11 — Google OAuth + ideas tweaks (complete):**
  - `AuthContext.signInWithGoogle()` added; both Login ("Continue with Google") and Signup ("Sign up with Google") buttons are now live (the "Coming soon" pills + tooltips were removed). Buttons show a spinner + "Redirecting…" while the OAuth redirect kicks off.
  - New page [client/src/pages/AuthCallback.tsx](client/src/pages/AuthCallback.tsx) at route `/auth/callback`. It waits for AuthContext to settle, then queries `businesses` for the user and routes to `/dashboard` or `/onboarding`. Surfaces Google's `error_description` if the user denied access.
  - Manual setup needed in the Supabase dashboard: enable the Google provider AND add `http://localhost:5173/auth/callback` (and the production origin equivalent) to Authentication → URL Configuration → Redirect URLs. Without that step Supabase rejects the redirect.
  - Ideas textarea on the dashboard tightened: label is now "What would you like to post about? (optional)", placeholder is the summer-sale example, and the max length is **300 chars** (was 500). Both client `IDEAS_MAX` and server `IDEAS_MAX_LENGTH` updated.
- **Session 10 — Google Business description (complete):** end-to-end Google Business Profile description generator.
  - Migration: `supabase/businesses_google_bio.sql` adds a nullable `google_bio text` column to `businesses` (run once in the Supabase SQL editor).
  - Server: `POST /api/content/generate-bio` in [server/src/routes/content.ts](server/src/routes/content.ts). Body `{ business_id }`. Calls Gemini with `buildBioPrompt()` (no JSON response mime — plain text), strips surrounding quotes, hard-caps to 750 chars, persists to `businesses.google_bio`, returns `{ google_bio: string }`.
  - Client: dedicated "Google Business description" card on the dashboard between the stat cards and the content calendar. Empty state shows a `Generate bio` CTA; filled state shows the bio in a read-only panel with `Copy` (2-second "Copied!" feedback) and `Regenerate` buttons, plus a live char counter and a "Ready" badge.
  - The "Google Bio" stat card now reflects real state (`Ready` if `google_bio` is set, `Not yet` otherwise).
  - Posts Scheduled and Emails Drafted stat cards marked **Coming soon** (visibly muted with a purple "Soon" pill) — placeholders for unimplemented features that keep the four-card layout coherent.
- **Session 9 — Captionly rebrand + dark theme (complete):** full rename from "Local Content AI" → **Captionly** and end-to-end dark redesign across every page using the brand tokens above. Wordmark is `Captionly` + purple dot, no image logo. Favicon updated to a dark tile with a purple `C`. Title tag and meta description updated. Ambient purple `bg-[#7c3aed]` glow + radial grid lines used as hero decoration.
  - Landing — dark hero with `Make content that gets results.` headline, "Start creating" primary CTA, "See How It Works" smooth-scroll button, dark feature/testimonial cards with purple accent icons
  - Login + Signup — dark card on `#111111`, dark inputs on `#1a1a1a`, purple gradient submit, all auxiliary UI (Google "Coming soon", forgot-password, show/hide, password strength meter, ToS checkbox) preserved
  - Onboarding — dark stepper with purple gradient on the active circle and `#7c3aed` connector for completed steps, dark tone-selector cards, dark searchable country combobox
  - Dashboard — **left sidebar nav** (Dashboard / Calendar / Posts / Business + Pro tip card + Logout) replaces the gradient top bar, dark stat cards with purple icon tiles, dark calendar cards with subtle hover-glow border, mobile top bar fallback for small screens
  - Brand + dark palette docs added to CLAUDE.md ("Brand & Theme" section) so future sessions stay consistent
  - Note: the npm package `name` in [package.json](package.json) is still `local-content-ai` — left unchanged to avoid forcing a `package-lock.json` regeneration; rename when convenient

**Next tasks:**
1. Push to GitHub
2. Email newsletter generator (turn the "Emails Drafted" Coming soon card into a real feature)
3. Post scheduling (turn the "Posts Scheduled" Coming soon card into a real feature — IG/FB API + cron)
4. Deploy to Vercel
