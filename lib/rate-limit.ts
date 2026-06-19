interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

const store = getStore();

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds: 0,
  };
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

function getStore(): Map<string, RateLimitRecord> {
  const globalForRateLimit = globalThis as typeof globalThis & {
    __fsiRateLimitStore?: Map<string, RateLimitRecord>;
  };

  if (!globalForRateLimit.__fsiRateLimitStore) {
    globalForRateLimit.__fsiRateLimitStore = new Map();
  }

  return globalForRateLimit.__fsiRateLimitStore;
}
