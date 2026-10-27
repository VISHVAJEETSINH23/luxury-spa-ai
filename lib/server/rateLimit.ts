import "server-only";

/**
 * Per-instance, in-memory request limits. On a serverless host each warm
 * instance keeps its own counts, so treat this as a brake on scripted abuse,
 * not an exact quota. Booking spam is also capped per phone in the database.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function allow(key: string, limit: number, windowMs: number): boolean {
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
