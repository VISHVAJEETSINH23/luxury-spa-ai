import "server-only";

import { redis } from "@/lib/server/redis";

/**
 * Request limits, fixed window per key.
 *
 * With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, counts live
 * in Redis and are shared by every serverless instance — an exact quota.
 * Without them (local dev, or Redis unreachable) each warm instance keeps its
 * own in-memory counts, which is a brake on scripted abuse, not a quota.
 * Booking spam is also capped per phone in the database.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

function allowInMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** INCR + PEXPIRE NX in one round trip; returns the count after this hit. */
async function redisHit(key: string, windowMs: number): Promise<number | null> {
  const client = redis();
  if (!client) return null;
  const windowKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  const results = await client.pipeline([
    ["INCR", windowKey],
    ["PEXPIRE", windowKey, windowMs, "NX"],
  ]);
  return typeof results?.[0] === "number" ? results[0] : null;
}

export async function allow(key: string, limit: number, windowMs: number): Promise<boolean> {
  const count = await redisHit(key, windowMs);
  if (count === null) return allowInMemory(key, limit, windowMs);
  return count <= limit;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Reads a JSON body, refusing anything larger than `maxBytes`. */
export async function readJson(request: Request, maxBytes = 8_192): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("BODY_TOO_LARGE");
  return JSON.parse(text);
}
