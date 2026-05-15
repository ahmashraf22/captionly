/**
 * Tiny in-memory token-bucket rate limiter.
 *
 * Single-process only — buckets live in the local Map. If the server is ever
 * scaled to multiple instances, swap for Redis (e.g. `rate-limiter-flexible`).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Records one hit against `key`. Returns null if allowed; otherwise an object
 * with `retryAfterSeconds` so the caller can set the `Retry-After` header.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { retryAfterSeconds: number } | null {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (bucket.count >= limit) {
    return { retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return null;
}

// Sweep expired buckets so the Map doesn't grow unbounded.
// `.unref()` so this interval doesn't keep the process alive on shutdown.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  },
  10 * 60 * 1000,
).unref();
