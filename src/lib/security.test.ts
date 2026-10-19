import { beforeEach, describe, expect, it } from "vitest";
import {
  generateTempPassword,
  isSameOrigin,
  ownerSignupAllowed,
  passwordProblem,
  rateLimit,
  resetRateLimits,
} from "./security";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit then blocks with a retry hint", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 0).ok).toBe(true);
    const r = rateLimit("k", 3, 1000, 0);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBe(1);
  });

  it("resets after the window", () => {
    for (let i = 0; i < 4; i++) rateLimit("k", 3, 1000, 0);
    expect(rateLimit("k", 3, 1000, 1001).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 4; i++) rateLimit("a", 3, 1000, 0);
    expect(rateLimit("b", 3, 1000, 0).ok).toBe(true);
  });
});

describe("isSameOrigin", () => {
  it("accepts matching and missing origins", () => {
    expect(isSameOrigin("https://app.example.com", "app.example.com")).toBe(true);
    expect(isSameOrigin(null, "app.example.com")).toBe(true);
  });
  it("rejects foreign or malformed origins", () => {
    expect(isSameOrigin("https://evil.example", "app.example.com")).toBe(false);
    expect(isSameOrigin("not a url", "app.example.com")).toBe(false);
    expect(isSameOrigin("https://app.example.com", null)).toBe(false);
  });
});

describe("passwordProblem", () => {
  it("enforces length, mix and email-name rules", () => {
    expect(passwordProblem("short1")).toMatch(/at least 8/);
    expect(passwordProblem("onlyletters")).toMatch(/letter and one number/);
    expect(passwordProblem("12345678")).toMatch(/letter and one number/);
    expect(passwordProblem("priya2026ok", "priya@plinthops.in")).toMatch(/email name/);
    expect(passwordProblem("blue-crane-42")).toBeNull();
  });
});

describe("generateTempPassword", () => {
  it("is unique and passes the policy", () => {
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a).not.toBe(b);
    expect(passwordProblem(a)).toBeNull();
  });
});

describe("ownerSignupAllowed", () => {
  it("defaults open in dev, closed in production, overridable", () => {
    expect(ownerSignupAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(ownerSignupAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(ownerSignupAllowed({ NODE_ENV: "production", ALLOW_OWNER_SIGNUP: "true" })).toBe(true);
    expect(ownerSignupAllowed({ NODE_ENV: "development", ALLOW_OWNER_SIGNUP: "false" })).toBe(false);
  });
});

import { isLocalHost, safeNext } from "./security";

describe("safeNext", () => {
  it("keeps same-site paths and rejects everything else", () => {
    expect(safeNext("/app?tab=register")).toBe("/app?tab=register");
    expect(safeNext("//evil.example")).toBe("/app");
    expect(safeNext("https://evil.example")).toBe("/app");
    expect(safeNext("/\\evil.example")).toBe("/app");
    expect(safeNext("/ok\n")).toBe("/app");
    expect(safeNext(null)).toBe("/app");
  });
});

describe("isLocalHost", () => {
  it("recognises loopback hosts only", () => {
    expect(isLocalHost("localhost:3000")).toBe(true);
    expect(isLocalHost("127.0.0.1:3111")).toBe(true);
    expect(isLocalHost("[::1]:3000")).toBe(true);
    expect(isLocalHost("10.210.40.148:3000")).toBe(true);
    expect(isLocalHost("8.8.8.8")).toBe(false);
    expect(isLocalHost("plinth.vercel.app")).toBe(false);
    expect(isLocalHost(null)).toBe(false);
  });
});
