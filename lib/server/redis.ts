import "server-only";

/**
 * Upstash Redis over its REST API — no client library, no open connections,
 * fine on serverless. Optional: with UPSTASH_REDIS_REST_URL / _TOKEN unset,
 * redis() returns null and callers fall back to their in-memory behaviour.
 */

type Command = (string | number)[];

export interface Redis {
  pipeline(commands: Command[]): Promise<unknown[] | null>;
}

export function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return {
    async pipeline(commands) {
      try {
        const response = await fetch(`${url}/pipeline`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(commands.map((c) => c.map(String))),
          cache: "no-store",
          signal: AbortSignal.timeout(1_500),
        });
        if (!response.ok) return null;
        const results = (await response.json()) as { result?: unknown; error?: string }[];
        if (results.some((r) => r.error)) return null;
        return results.map((r) => r.result);
      } catch {
        return null;
      }
    },
  };
}
