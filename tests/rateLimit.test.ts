import { afterEach, describe, expect, it, vi } from "vitest";
import { allow, clientIp } from "@/lib/server/rateLimit";

afterEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.unstubAllGlobals();
});

describe("allow (in-memory)", () => {
  it("lets `limit` requests through, then blocks", async () => {
    const key = `test:${Math.random()}`;
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await allow(key, 3, 60_000));
    expect(results).toEqual([true, true, true, false]);
  });
});

describe("allow (Redis)", () => {
  it("uses the shared count from Redis", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([{ result: 11 }, { result: 0 }])));
    expect(await allow("login:1.2.3.4", 10, 60_000)).toBe(false);
  });

  it("falls back to memory when Redis is unreachable", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect(await allow(`fallback:${Math.random()}`, 1, 60_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for address", () => {
    const req = new Request("https://x", { headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" } });
    expect(clientIp(req)).toBe("1.1.1.1");
  });
});
