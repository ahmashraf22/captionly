import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { getGeminiModel } from '../lib/gemini';
import { checkRateLimit } from '../lib/rate-limit';

export const contentRouter = Router();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

interface GeneratedPost {
  day_number: number;
  platform: 'Instagram' | 'Facebook';
  content: string;
}

interface BusinessRow {
  id: string;
  name: string;
  type: string;
  city: string;
  country: string;
  audience: string;
  tone: string;
  description: string;
}

const IDEAS_MAX_LENGTH = 300;
const GOOGLE_BIO_MAX_LENGTH = 750;

// Per-field caps applied at prompt-build time. Defensive — the client also
// caps these on the Onboarding form — but a row created via direct Supabase
// access could exceed them.
const PROMPT_FIELD_CAPS = {
  name: 120,
  type: 60,
  city: 100,
  country: 80,
  audience: 200,
  tone: 60,
  description: 1000,
} as const;

// Rate limits for Gemini-backed endpoints. Per-user, 1-hour window.
const GENERATE_LIMIT = 20;
const GENERATE_BIO_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Clamps each field of the business row to its per-field cap before injecting into a Gemini prompt. */
function sanitizeBusiness(b: BusinessRow): BusinessRow {
  return {
    ...b,
    name: (b.name || '').slice(0, PROMPT_FIELD_CAPS.name),
    type: (b.type || '').slice(0, PROMPT_FIELD_CAPS.type),
    city: (b.city || '').slice(0, PROMPT_FIELD_CAPS.city),
    country: (b.country || '').slice(0, PROMPT_FIELD_CAPS.country),
    audience: (b.audience || '').slice(0, PROMPT_FIELD_CAPS.audience),
    tone: (b.tone || '').slice(0, PROMPT_FIELD_CAPS.tone),
    description: (b.description || '').slice(0, PROMPT_FIELD_CAPS.description),
  };
}

/** Sleep for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Returns true if a Gemini error is transient (overloaded / rate-limited / server) and worth retrying. */
function isTransientGeminiError(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Calls Gemini with up to 3 attempts, backing off on transient errors (5xx / 429).
 * Throws the last error on final failure.
 */
async function generateWithRetry(request: Parameters<ReturnType<typeof getGeminiModel>['generateContent']>[0]) {
  const delays = [400, 1200]; // ms before retries 2 and 3
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await getGeminiModel().generateContent(request);
    } catch (err) {
      lastErr = err;
      if (!isTransientGeminiError(err) || attempt === 2) throw err;
      await sleep(delays[attempt]);
    }
  }
  throw lastErr;
}

/**
 * Builds a Gemini prompt instructing the model to return a JSON array
 * of 7 social-media posts tailored to the business profile. When `ideas`
 * is provided, the prompt steers Gemini to revolve the week around them.
 */
function buildPrompt(b: BusinessRow, ideas?: string): string {
  const ideasBlock = ideas
    ? `

The owner specifically wants the next 7 posts to focus on the following ideas/themes provided by them:
"""
${ideas}
"""
Use these as the central angle for the week — at least 5 of the 7 posts should clearly relate to one of these ideas. Stay consistent with the business's tone and audience above.`
    : '';

  return `You are a social-media copywriter for local businesses.

Generate exactly 7 social-media posts for the next 7 days for the following business:

- Name: ${b.name}
- Type: ${b.type}
- Location: ${b.city}, ${b.country}
- Target audience: ${b.audience}
- Brand tone: ${b.tone}
- Description: ${b.description}${ideasBlock}

Requirements:
- Return strictly a JSON array of 7 objects — no prose, no markdown, no code fences.
- Alternate platforms: Day 1 Instagram, Day 2 Facebook, Day 3 Instagram, Day 4 Facebook, Day 5 Instagram, Day 6 Facebook, Day 7 Instagram.
- Each post should match the brand tone and feel native to its platform.
- Include relevant emojis in every post.
- Include 3–5 relevant hashtags at the end of every post.
- Keep each post under 280 characters.

Each object must have exactly these keys:
{
  "day_number": <integer 1..7>,
  "platform": "Instagram" | "Facebook",
  "content": "<post text with emojis and hashtags>"
}`;
}

/**
 * Builds a Gemini prompt for a Google Business Profile description (max 750 chars,
 * professional and factual, no URLs/phones/hashtags/emojis — Google flags those).
 */
function buildBioPrompt(b: BusinessRow): string {
  return `You are writing a Google Business Profile description for a local business.

Business details:
- Name: ${b.name}
- Type: ${b.type}
- Location: ${b.city}, ${b.country}
- Target audience: ${b.audience}
- Brand tone: ${b.tone}
- Description: ${b.description}

Write a single paragraph between 400 and 700 characters that:
- Describes what the business offers and what makes it distinct.
- Mentions the city or neighborhood to help local discovery.
- Matches the brand tone above.
- Uses professional, factual language — no superlatives like "best in the world" or marketing fluff.
- Does NOT include URLs, phone numbers, email addresses, or hashtags (Google flags these).
- Does NOT use emojis.

Return ONLY the description text. No preamble, no quotes, no headers, no markdown.`;
}

/**
 * Validates that Gemini returned the shape we asked for.
 * Throws a descriptive Error if anything is off.
 */
function parseGeneratedPosts(raw: string): GeneratedPost[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Gemini returned non-JSON output.');
  }
  if (!Array.isArray(parsed) || parsed.length !== 7) {
    throw new Error('Expected a JSON array of exactly 7 posts.');
  }
  return parsed.map((item, i) => {
    const obj = item as Record<string, unknown>;
    const day_number = Number(obj.day_number);
    const platform = obj.platform;
    const content = obj.content;
    if (!Number.isInteger(day_number) || day_number < 1 || day_number > 7) {
      throw new Error(`Post ${i}: invalid day_number.`);
    }
    if (platform !== 'Instagram' && platform !== 'Facebook') {
      throw new Error(`Post ${i}: invalid platform.`);
    }
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error(`Post ${i}: missing content.`);
    }
    return { day_number, platform, content };
  });
}

/**
 * POST /api/content/generate
 * Body: { business_id: string }
 * Headers: Authorization: Bearer <supabase_access_token>
 *
 * Generates 7 posts via Gemini, persists them to the `posts` table, and
 * returns the saved rows.
 */
contentRouter.post('/generate', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing access token.' });
  }
  const accessToken = authHeader.slice('Bearer '.length);

  const { business_id, ideas: rawIdeas } = (req.body ?? {}) as { business_id?: string; ideas?: unknown };
  if (!business_id || !UUID_RE.test(business_id)) {
    return res.status(400).json({ error: 'business_id is required and must be a UUID.' });
  }

  let ideas: string | undefined;
  if (rawIdeas !== undefined && rawIdeas !== null && rawIdeas !== '') {
    if (typeof rawIdeas !== 'string') {
      return res.status(400).json({ error: 'ideas must be a string.' });
    }
    const trimmed = rawIdeas.trim();
    if (trimmed.length > IDEAS_MAX_LENGTH) {
      return res.status(400).json({ error: `ideas must be ${IDEAS_MAX_LENGTH} characters or fewer.` });
    }
    if (trimmed) ideas = trimmed;
  }

  // Per-request Supabase client carrying the user's JWT — RLS now scopes everything to this user.
  // `ws` transport is required because Node 20 lacks a global WebSocket and supabase-js
  // constructs a RealtimeClient eagerly inside createClient.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    realtime: { transport: ws as any },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
  const userId = userData.user.id;

  // Per-user rate limit. Applied after auth so anonymous traffic doesn't
  // poison buckets keyed by user id.
  const rate = checkRateLimit(`gen:${userId}`, GENERATE_LIMIT, RATE_WINDOW_MS);
  if (rate) {
    res.setHeader('Retry-After', String(rate.retryAfterSeconds));
    return res.status(429).json({
      error: `Too many generations — try again in ${rate.retryAfterSeconds}s.`,
    });
  }

  // Fetch the business — RLS ensures it must belong to this user.
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('id, name, type, city, country, audience, tone, description')
    .eq('id', business_id)
    .maybeSingle();

  if (bizErr || !business) {
    return res.status(404).json({ error: 'Business not found.' });
  }

  // Clamp each field so a long row can't blow up the Gemini token bill.
  const safeBusiness = sanitizeBusiness(business as BusinessRow);

  // Ask Gemini for structured JSON output.
  let rawText: string;
  try {
    const result = await generateWithRetry({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(safeBusiness, ideas) }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    rawText = result.response.text();
  } catch (err) {
    console.error('[content/generate] Gemini call failed:', err);
    if (isTransientGeminiError(err)) {
      return res.status(503).json({ error: 'Gemini is busy right now — please try again in a moment.' });
    }
    return res.status(502).json({ error: 'Content generation failed.' });
  }

  let generated: GeneratedPost[];
  try {
    generated = parseGeneratedPosts(rawText);
  } catch (err) {
    console.error('[content/generate] Bad Gemini output:', err, rawText);
    return res.status(502).json({ error: 'Generated content was malformed.' });
  }

  // Upsert by (business_id, day_number) so re-runs replace previous posts cleanly.
  const rows = generated.map(p => ({
    user_id: userId,
    business_id,
    day_number: p.day_number,
    platform: p.platform,
    content: p.content,
  }));

  const { data: saved, error: saveErr } = await supabase
    .from('posts')
    .upsert(rows, { onConflict: 'business_id,day_number' })
    .select();

  if (saveErr) {
    console.error('[content/generate] Failed to save posts:', saveErr);
    return res.status(500).json({ error: 'Failed to save generated posts.' });
  }

  // Return posts ordered by day for a stable client render.
  const sorted = [...(saved ?? [])].sort((a, b) => a.day_number - b.day_number);
  return res.json({ posts: sorted });
});

/**
 * POST /api/content/generate-bio
 * Body: { business_id: string }
 * Headers: Authorization: Bearer <supabase_access_token>
 *
 * Generates a Google Business Profile description via Gemini, saves it to
 * `businesses.google_bio`, and returns the saved string.
 */
contentRouter.post('/generate-bio', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing access token.' });
  }
  const accessToken = authHeader.slice('Bearer '.length);

  const { business_id } = (req.body ?? {}) as { business_id?: string };
  if (!business_id || !UUID_RE.test(business_id)) {
    return res.status(400).json({ error: 'business_id is required and must be a UUID.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    realtime: { transport: ws as any },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
  const userId = userData.user.id;

  const rate = checkRateLimit(`bio:${userId}`, GENERATE_BIO_LIMIT, RATE_WINDOW_MS);
  if (rate) {
    res.setHeader('Retry-After', String(rate.retryAfterSeconds));
    return res.status(429).json({
      error: `Too many bio generations — try again in ${rate.retryAfterSeconds}s.`,
    });
  }

  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('id, name, type, city, country, audience, tone, description')
    .eq('id', business_id)
    .maybeSingle();

  if (bizErr || !business) {
    return res.status(404).json({ error: 'Business not found.' });
  }

  const safeBusiness = sanitizeBusiness(business as BusinessRow);

  // Plain-text bio — no responseMimeType=json, just raw string.
  let bio: string;
  try {
    const result = await generateWithRetry({
      contents: [{ role: 'user', parts: [{ text: buildBioPrompt(safeBusiness) }] }],
    });
    bio = result.response.text().trim();
  } catch (err) {
    console.error('[content/generate-bio] Gemini call failed:', err);
    if (isTransientGeminiError(err)) {
      return res.status(503).json({ error: 'Gemini is busy right now — please try again in a moment.' });
    }
    return res.status(502).json({ error: 'Bio generation failed.' });
  }

  if (!bio) {
    return res.status(502).json({ error: 'Generated bio was empty.' });
  }
  // Strip surrounding quotes if Gemini ignored the instruction.
  if ((bio.startsWith('"') && bio.endsWith('"')) || (bio.startsWith("'") && bio.endsWith("'"))) {
    bio = bio.slice(1, -1).trim();
  }
  // Hard-cap to Google's 750-char limit so saving never fails downstream.
  if (bio.length > GOOGLE_BIO_MAX_LENGTH) bio = bio.slice(0, GOOGLE_BIO_MAX_LENGTH);

  const { error: saveErr } = await supabase
    .from('businesses')
    .update({ google_bio: bio })
    .eq('id', business_id);

  if (saveErr) {
    console.error('[content/generate-bio] Failed to save bio:', saveErr);
    return res.status(500).json({ error: 'Failed to save generated bio.' });
  }

  return res.json({ google_bio: bio });
});
