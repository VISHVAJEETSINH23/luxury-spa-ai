import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { redis } from "@/lib/server/redis";

/**
 * The owner's login. One account, so no user table: the password is stored
 * only as a scrypt hash in ADMIN_PASSWORD_HASH (make one with
 * `npm run hash-password`), and a signed, httpOnly cookie carries the session.
 */

export const SESSION_COOKIE = "alexa_owner";
export const SESSION_HOURS = 12;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 random characters.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** "owner.<expiry-ms>.<signature>" */
export function createSessionToken(now = Date.now()): string {
  const payload = `owner.${now + SESSION_HOURS * 3_600_000}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "owner") return false;
  const expiry = Number(parts[1]);
  if (!Number.isFinite(expiry) || expiry < now) return false;
  try {
    return safeEqual(sign(`${parts[0]}.${parts[1]}`), parts[2]);
  } catch {
    return false;
  }
}

/**
 * Logout revokes the token itself, not just the browser's copy: its signature
 * goes on a Redis deny-list until the token would have expired anyway. Without
 * Redis, logout clears the cookie and the token lapses on its own; to cut off
 * every session at once, change SESSION_SECRET.
 */
export async function revokeSessionToken(token: string | undefined, now = Date.now()): Promise<void> {
  if (!isValidSessionToken(token, now)) return;
  const [, expiry, signature] = token!.split(".");
  const ttlSeconds = Math.ceil((Number(expiry) - now) / 1000);
  await redis()?.pipeline([["SET", `revoked:${signature}`, "1", "EX", ttlSeconds]]);
}

/** Valid signature, not expired, and not logged out. */
export async function isActiveSessionToken(token: string | undefined): Promise<boolean> {
  if (!isValidSessionToken(token)) return false;
  const client = redis();
  if (!client) return true;
  const results = await client.pipeline([["EXISTS", `revoked:${token!.split(".")[2]}`]]);
  // Redis down: fail open on revocation only — the signature and expiry still held.
  return results?.[0] !== 1;
}

/** ADMIN_PASSWORD_HASH ="scrypt:<salt base64url>:<hash base64url>" */
export function verifyOwnerPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const [scheme, saltB64, hashB64] = stored.split(":");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, "base64url");
  const actual = scryptSync(password.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  };
}
