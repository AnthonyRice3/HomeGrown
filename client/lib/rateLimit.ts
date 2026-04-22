import type { NextRequest } from "next/server";

interface Bucket { count: number; resetAt: number }

// In-memory store — per Vercel instance; sufficient for basic abuse prevention
const store = new Map<string, Bucket>();

/**
 * Returns true when the request is within the allowed rate, false when blocked.
 * @param key     Unique key per action+identity (e.g. "book:1.2.3.4")
 * @param max     Maximum requests per window
 * @param windowMs Window length in milliseconds
 */
export function rateLimit(key: string, { max, windowMs }: { max: number; windowMs: number }): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/** Extract the real client IP from common proxy headers. */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
