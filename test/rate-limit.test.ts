import { describe, expect, it } from "vitest";
import { checkRateLimit, getClientIp } from "../lib/rate-limit";

describe("rate limit", () => {
  it("allows requests until the limit is reached", () => {
    const key = `test:${Math.random()}`;
    const first = checkRateLimit({ key, limit: 2, windowMs: 1000 });
    const second = checkRateLimit({ key, limit: 2, windowMs: 1000 });
    const third = checkRateLimit({ key, limit: 2, windowMs: 1000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses the first forwarded IP address", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.2",
    });

    expect(getClientIp(headers)).toBe("203.0.113.10");
  });
});
