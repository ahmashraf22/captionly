# Captionly •

> **Make content that gets results.**
>
> AI-powered social content generator for local businesses.

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-8E75B2?logo=google&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed.svg)](#license)

---

## About

**Captionly** is an AI-powered content generator built for local businesses — salons, gyms, restaurants, dentists, and more. Business owners enter a few details about their brand and get a ready-to-post content calendar with social media captions and a polished Google Business Profile description in seconds.

Built for **local business owners** who want a steady stream of on-brand content without hiring an agency or spending hours staring at a blank caption box.

## Features

- 🪄 **AI-generated social media posts** — Instagram + Facebook captions tailored to your business tone, audience, and city
- 💡 **Custom content ideas input** — feed Captionly a prompt (e.g. "summer sale next week") and the calendar adapts
- 📍 **Google Business profile description generator** — a 750-character bio optimized for Google Business Profile, one click to copy
- 📅 **7-day content calendar** — visual day-by-day grid with platform pills, copy buttons, and per-card expand toggles
- 🔐 **Google OAuth + email authentication** — sign in with Google or email/password via Supabase Auth
- 🌙 **Dark modern UI** — purple-accented dark theme, responsive layout, smooth animations

## Tech Stack

| Layer        | Stack                                           |
| ------------ | ----------------------------------------------- |
| Frontend     | React + Vite + TypeScript + Tailwind CSS v3    |
| Backend      | Node.js + Express + TypeScript                  |
| Database     | Supabase (PostgreSQL + Auth + Row Level Security) |
| AI           | Google Gemini API (`gemini-2.5-flash`)         |
| Deployment   | Vercel                                          |

## Getting Started

### Prerequisites

- **Node.js** 20+ and **npm**
- A **Supabase** project ([create one free](https://supabase.com))
- A **Google Gemini API key** ([get one here](https://ai.google.dev))

### 1. Clone the repository

```bash
git clone https://github.com/your-username/captionly.git
cd captionly
```

### 2. Install dependencies

```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 3. Set up environment variables

Copy the example files and fill in your values:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

See the [Environment Variables](#environment-variables) section below for what each one does.

### 4. Set up the database

In the **Supabase SQL editor**, run each file once:

1. `supabase/schema.sql` — creates the `businesses` table + RLS policies
2. `supabase/content_schema.sql` — creates the `posts` table + RLS policies
3. `supabase/businesses_google_bio.sql` — adds the `google_bio` column

Then in the Supabase dashboard:

- **Authentication → Providers → Google** — enable the Google provider
- **Authentication → URL Configuration → Redirect URLs** — add `http://localhost:5173/auth/callback`

### 5. Run locally

From the repo root:

```bash
npm run dev
```

This runs both the client (http://localhost:5173) and server (http://localhost:3001) concurrently.

## Environment Variables

### `client/.env`

| Variable                 | Description                                   |
| ------------------------ | --------------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key — safe in browser  |

### `server/.env`

| Variable            | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `PORT`              | Express server port (default `3001`)                       |
| `CLIENT_URL`        | Frontend origin allowed by CORS (e.g. `http://localhost:5173`) |
| `GEMINI_API_KEY`    | Google Gemini API key — used for all AI generation         |
| `SUPABASE_URL`      | Your Supabase project URL                                  |
| `SUPABASE_ANON_KEY` | Supabase anon key (server uses per-request user JWT for RLS) |

> ⚠️ Never commit `.env` files. The `GEMINI_API_KEY` must stay server-side only.

## Screenshots

<!-- Add screenshots here -->

## Live Demo

Coming soon.

## Author

Built by **Ahmed Ashraf**.

- LinkedIn: _coming soon_
- GitHub: _coming soon_

## License

[MIT](LICENSE) © Ahmed Ashraf
