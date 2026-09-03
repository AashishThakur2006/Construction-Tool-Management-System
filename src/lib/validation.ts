/**
 * Pure input-normalisation helpers shared by the API routes.
 * No I/O — unit-tested in src/lib/validation.test.ts.
 */

export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function clamp(value: unknown, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function money(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/** Positive integer or null (for optional quantities / foreign keys). */
export function posIntOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function isEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

/** Empty string -> null, so optional date inputs clear cleanly. */
export function dateOrNull(value: unknown): string | null {
  const s = str(value);
  return s === "" ? null : s;
}

export const PROJECT_STATUSES = ["PLANNED", "ONGOING", "COMPLETED", "ON_HOLD"] as const;
export const MACHINE_STATUSES = ["AVAILABLE", "ALLOCATED", "MAINTENANCE"] as const;
export const EMPLOYEE_ROLES = ["OPERATOR", "MAINTENANCE_WORKER", "SUPERVISOR", "LABOURER"] as const;
export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export const MAINTENANCE_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
export const PAYMENT_STATUSES = ["PENDING", "PAID"] as const;
export const TOOL_TX_KINDS = ["ISSUE", "RETURN"] as const;
export const DELIVERY_DIRECTIONS = ["INBOUND", "OUTBOUND"] as const;
export const DELIVERY_STATUSES = ["SCHEDULED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const;

/** Fraction (0..1) of a tool's stock still on the shelf; 1 when nothing is tracked. */
export function stockRatio(available: number, total: number): number {
  if (!total || total <= 0) return 1;
  return Math.max(0, Math.min(1, available / total));
}

export function isLowStock(available: number, total: number, threshold = 0.2): boolean {
  return total > 0 && stockRatio(available, total) < threshold;
}

/** Committed spend as a whole-number percent of budget; 0 when no budget is set. */
export function budgetUsagePct(committed: number, budget: number): number {
  if (!budget || budget <= 0) return 0;
  return Math.round((committed / budget) * 100);
}
