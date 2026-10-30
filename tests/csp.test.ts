import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "@/lib/csp";

describe("contentSecurityPolicy", () => {
  it("allows scripts by nonce, not unsafe-inline", () => {
    const scripts = contentSecurityPolicy("abc", false).split("; ").find((d) => d.startsWith("script-src"));
    expect(scripts).toContain("'nonce-abc'");
    expect(scripts).not.toContain("unsafe-inline");
    expect(scripts).not.toContain("unsafe-eval");
  });
});
