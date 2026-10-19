import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/* ---------------------------------------------------------------------------
   Request-hardening helpers shared by the API routes.
   - rateLimit: fixed-window, in-memory (per server instance). It is a speed
     bump against credential stuffing, not a distributed limiter; put a
     platform firewall in front for real traffic.
   - sameOrigin: CSRF defence-in-depth for cookie-authenticated mutations.
   - generateTempPassword / passwordProblem: credential policy.
   ------------------------------------------------------------------------- */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateResult = { ok: boolean; remaining: number; retryAfter: number };

/** Count a hit against `key`; ok=false once `limit` hits land inside `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_BUCKETS) buckets.clear();
  }
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  const ok = b.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - b.count),
    retryAfter: ok ? 0 : Math.ceil((b.resetAt - now) / 1000),
  };
}

export function resetRateLimits() {
  buckets.clear();
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** 429 response if the caller is over the limit, otherwise null. */
export function limited(req: NextRequest, scope: string, limit: number, windowMs: number, extra = "") {
  const r = rateLimit(`${scope}:${clientIp(req)}:${extra}`, limit, windowMs);
  if (r.ok) return null;
  return NextResponse.json(
    { error: "Too many attempts. Please wait and try again." },
    { status: 429, headers: { "Retry-After": String(r.retryAfter) } }
  );
}

/**
 * True when a state-changing request comes from our own origin. Requests with
 * no Origin header (curl, server-to-server) are allowed; browsers always send
 * one on cross-site POSTs, which is the case this guards against.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** 403 response for cross-origin mutations, otherwise null. */
export function originGuard(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (isSameOrigin(req.headers.get("origin"), host)) return null;
  return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
}

/** Cryptographically random, human-typeable temporary password. */
export function generateTempPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes (i l o 0 1)
  const bytes = randomBytes(12);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `plinth-${out.slice(0, 6)}-${out.slice(6)}`;
}

export const MIN_PASSWORD = 8;

/** Returns a human message when the password is unacceptable, else null. */
export function passwordProblem(pw: unknown, email = ""): string | null {
  if (typeof pw !== "string" || pw.length < MIN_PASSWORD) {
    return `Password must be at least ${MIN_PASSWORD} characters`;
  }
  if (pw.length > 128) return "Password is too long";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "Password needs at least one letter and one number";
  }
  const local = email.split("@")[0];
  if (local.length >= 4 && pw.toLowerCase().includes(local.toLowerCase())) {
    return "Password must not contain your email name";
  }
  return null;
}

/** Self-service Owner sign-up is a demo convenience; off by default in production. */
export function ownerSignupAllowed(env: Record<string, string | undefined> = process.env): boolean {
  if (env.ALLOW_OWNER_SIGNUP === "true") return true;
  if (env.ALLOW_OWNER_SIGNUP === "false") return false;
  return env.NODE_ENV !== "production";
}

/** Only same-site absolute paths are valid post-login destinations (no //host, no backslashes, no schemes). */
export function safeNext(next: string | null | undefined, fallback = "/app"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

export function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const m = /^(\[[^\]]+\]|[^:]+)(?::\d+)?$/.exec(host.trim().toLowerCase());
  if (!m) return false;
  const h = m[1];
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".localhost")) return true;
  // private-network addresses (opening the dev server from a LAN IP or phone);
  // the dev login that uses this is already disabled in production builds
  return /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(h);
}
