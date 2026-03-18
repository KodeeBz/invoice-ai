import { NextResponse } from "next/server";

type LimitConfig = {
  windowMs: number;
  max: number;
  keyPrefix: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function applyRateLimit(
  request: Request,
  config: LimitConfig,
  customIdentity?: string
) {
  const now = Date.now();

  // Opportunistic cleanup to avoid unbounded map growth.
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  });

  const identity = customIdentity || getIp(request);
  const key = `${config.keyPrefix}:${identity}`;

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return null;
  }

  if (current.count >= config.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    );

    return NextResponse.json(
      {
        error: "Too many requests. Please try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      }
    );
  }

  current.count += 1;
  buckets.set(key, current);
  return null;
}
