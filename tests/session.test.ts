import { randomBytes, scryptSync } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createSessionToken,
  isActiveSessionToken,
  isValidSessionToken,
  verifyOwnerPassword,
  SESSION_HOURS,
} from "@/lib/server/session";

beforeEach(() => {
  process.env.SESSION_SECRET = "a".repeat(40);
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("owner session token", () => {
  it("accepts a fresh token", async () => {
    const token = createSessionToken();
    expect(isValidSessionToken(token)).toBe(true);
    expect(await isActiveSessionToken(token)).toBe(true);
  });

  it("rejects an expired token", () => {
    const issued = Date.now() - (SESSION_HOURS + 1) * 3_600_000;
    expect(isValidSessionToken(createSessionToken(issued))).toBe(false);
  });

  it("rejects a token whose expiry was edited", () => {
    const [kind, , sig] = createSessionToken().split(".");
    const forged = `${kind}.${Date.now() + 365 * 86_400_000}.${sig}`;
    expect(isValidSessionToken(forged)).toBe(false);
  });

  it("rejects a token signed with another secret", () => {
    const token = createSessionToken();
    process.env.SESSION_SECRET = "b".repeat(40);
    expect(isValidSessionToken(token)).toBe(false);
  });

  it("rejects garbage", () => {
    for (const t of [undefined, "", "owner", "owner.x.y", "admin.1.2"]) {
      expect(isValidSessionToken(t)).toBe(false);
    }
  });
});

describe("owner password", () => {
  function hashFor(password: string): string {
    const salt = randomBytes(16);
    const hash = scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });
    return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
  }

  it("accepts the right password and rejects a wrong one", () => {
    process.env.ADMIN_PASSWORD_HASH = hashFor("correct horse battery");
    expect(verifyOwnerPassword("correct horse battery")).toBe(true);
    expect(verifyOwnerPassword("correct horse battery!")).toBe(false);
  });

  it("refuses everything when no hash is configured", () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    expect(verifyOwnerPassword("anything")).toBe(false);
  });
});
