import { describe, it, expect } from "vitest";
import {
  str,
  oneOf,
  clamp,
  money,
  posIntOrNull,
  isEmail,
  dateOrNull,
  stockRatio,
  isLowStock,
  budgetUsagePct,
  PROJECT_STATUSES,
} from "./validation";

describe("str", () => {
  it("trims strings and rejects non-strings", () => {
    expect(str("  hi ")).toBe("hi");
    expect(str(42)).toBe("");
    expect(str(null)).toBe("");
    expect(str(undefined)).toBe("");
  });
});

describe("oneOf", () => {
  it("passes through allowed values and falls back otherwise", () => {
    expect(oneOf("ONGOING", PROJECT_STATUSES, "PLANNED")).toBe("ONGOING");
    expect(oneOf("NOPE", PROJECT_STATUSES, "PLANNED")).toBe("PLANNED");
    expect(oneOf(undefined, PROJECT_STATUSES, "PLANNED")).toBe("PLANNED");
  });
});

describe("clamp", () => {
  it("clamps into range and rounds", () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp("42.6", 0, 100)).toBe(43);
    expect(clamp("abc", 0, 100)).toBe(0);
  });
});

describe("money", () => {
  it("keeps two decimals and floors negatives / junk to 0", () => {
    expect(money("19.999")).toBe(20);
    expect(money(-3)).toBe(0);
    expect(money("nope")).toBe(0);
    expect(money(1234.5)).toBe(1234.5);
  });
});

describe("posIntOrNull", () => {
  it("accepts positive integers only", () => {
    expect(posIntOrNull("5")).toBe(5);
    expect(posIntOrNull(0)).toBeNull();
    expect(posIntOrNull(-2)).toBeNull();
    expect(posIntOrNull("2.5")).toBeNull();
    expect(posIntOrNull("")).toBeNull();
  });
});

describe("isEmail", () => {
  it("does a loose shape check", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("bad")).toBe(false);
    expect(isEmail("a@b")).toBe(false);
  });
});

describe("dateOrNull", () => {
  it("maps empty to null", () => {
    expect(dateOrNull("")).toBeNull();
    expect(dateOrNull("  ")).toBeNull();
    expect(dateOrNull("2026-01-01")).toBe("2026-01-01");
  });
});

describe("stock helpers", () => {
  it("stockRatio is 1 when nothing is tracked", () => {
    expect(stockRatio(0, 0)).toBe(1);
    expect(stockRatio(5, 10)).toBe(0.5);
    expect(stockRatio(20, 10)).toBe(1);
  });

  it("isLowStock trips below the threshold only when stock exists", () => {
    expect(isLowStock(1, 10)).toBe(true);
    expect(isLowStock(3, 10)).toBe(false);
    expect(isLowStock(0, 0)).toBe(false);
  });
});

describe("budgetUsagePct", () => {
  it("returns a rounded percent, 0 without a budget", () => {
    expect(budgetUsagePct(50, 200)).toBe(25);
    expect(budgetUsagePct(250, 200)).toBe(125);
    expect(budgetUsagePct(10, 0)).toBe(0);
  });
});
