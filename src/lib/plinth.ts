/**
 * Shared constants + the mutation allow-list for the Plinth backend.
 *
 * The client (public/js/store.js) sends a batch of ops to POST /api/mutate.
 * Each op is { t, id?, set?, insert?, del?, delMatch? }. This module decides
 * which ops each role may perform and which columns they may touch.
 */

/** Reference "today" the seed data is built around. Returned to the client as `today`. */
export const TODAY = "2026-07-19";

export type Role = "OWNER" | "SITE_ENGINEER";

export type Op = {
  t: string;
  id?: string;
  set?: Record<string, unknown>;
  insert?: Record<string, unknown>;
  del?: string;
  delMatch?: Record<string, unknown>;
};

// table -> real name + the columns a write may set/insert
const TABLES: Record<string, { table: string; cols: string[] }> = {
  job: {
    table: "jobs",
    cols: ["id", "name", "client", "location", "status", "started", "ends", "engineer_id", "hold_note"],
  },
  asset: {
    table: "assets",
    cols: [
      "id", "category", "model", "serial", "purchased", "value", "condition",
      "status", "job_id", "allocated_on", "hours",
    ],
  },
  history: {
    table: "asset_history",
    cols: ["asset_id", "on", "kind", "note"],
  },
  mr: {
    table: "maintenance",
    cols: [
      "id", "asset_id", "status", "reported", "fault", "est_cost",
      "reporter_id", "mechanic_id", "approved_on", "workshop_on",
      "resolved_on", "rejected_on", "reject_note", "overdue",
    ],
  },
  payment: {
    table: "payments",
    cols: [
      "id", "job_id", "payee", "description", "amount", "status",
      "issued", "due", "paid_on", "voided_on", "dispute_note",
    ],
  },
  employee: {
    table: "employees",
    cols: ["id", "name", "role", "job_id", "phone", "email", "started_on", "status"],
  },
};

// columns a Site Engineer may set on an existing asset (allocate / return / transfer)
const ENGINEER_ASSET_COLS = ["status", "job_id", "allocated_on"];
const ENGINEER_ASSET_STATUS = ["In yard", "Allocated", "In workshop"];

export function tableFor(t: string) {
  return TABLES[t];
}

/**
 * Returns null if the op is allowed for the role, or a reason string if not.
 * Mirrors the controls Plinth's views actually expose per role.
 */
export function denyReason(op: Op, role: Role): string | null {
  const def = TABLES[op.t];
  if (!def) return `Unknown target "${op.t}"`;

  const payload = op.set ?? op.insert ?? {};
  const keys = Object.keys(payload);
  const badCol = keys.find((k) => !def.cols.includes(k));
  if (badCol) return `Column "${badCol}" is not writable on ${op.t}`;

  if (role === "OWNER") return null; // owner may do everything below

  // ---- Site Engineer rules ----
  switch (op.t) {
    case "job":
      return "Only the Owner manages jobs";
    case "asset": {
      if (op.insert || op.del) return "Engineers cannot add or remove assets";
      const bad = keys.find((k) => !ENGINEER_ASSET_COLS.includes(k));
      if (bad) return `Engineers can only allocate, return or transfer — not edit ${bad}`;
      const status = op.set?.status as string | undefined;
      if (status && !ENGINEER_ASSET_STATUS.includes(status)) {
        return "Engineers cannot set that asset status";
      }
      return null;
    }
    case "history":
      return null; // history follows the asset moves an engineer can make
    case "mr": {
      if (op.set) return "Only the Owner approves, rejects or progresses requests";
      if (op.del) return null; // undo of a raise
      if (op.insert) {
        return op.insert.status === "Reported"
          ? null
          : "A raised request must start as Reported";
      }
      return "Not permitted";
    }
    case "payment":
      return "Payments are managed by the Owner";
    case "employee":
      return "Only the Owner manages the payroll";
    default:
      return "Not permitted";
  }
}

/* ---------------------------------------------------------------------------
   Value validation. denyReason() decides *who may touch which columns*; this
   decides whether the values are sane, so bad input gets a precise 400 rather
   than a database constraint error surfacing as a 500.
   ------------------------------------------------------------------------- */

const ENUMS: Record<string, Record<string, readonly string[]>> = {
  job: { status: ["Mobilising", "Active", "On hold", "Completed"] },
  asset: {
    status: ["In yard", "Allocated", "In workshop", "Retired"],
    condition: ["A", "B", "C", "D"],
  },
  mr: { status: ["Reported", "Approved", "In workshop", "Resolved", "Rejected"] },
  payment: { status: ["Pending", "Paid", "Overdue", "Disputed", "Voided"] },
  employee: { status: ["Active", "On leave", "Left"] },
};

const INT_COLS = new Set(["value", "hours", "est_cost", "amount"]);
const DATE_COLS = new Set([
  "purchased", "allocated_on", "started", "ends", "issued", "due", "paid_on",
  "voided_on", "reported", "approved_on", "workshop_on", "resolved_on",
  "rejected_on", "started_on", "on",
]);
const MAX_TEXT = 2000;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;
const MAX_MONEY = 1_000_000_000_000; // ₹1 lakh crore: far past any real invoice or asset

function validDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Returns a message for the first bad value in the op, or null when it is sane. */
export function valueProblem(op: Op): string | null {
  if (op.id != null && !ID_RE.test(String(op.id))) return "Malformed id";
  if (typeof op.del === "string" && !ID_RE.test(op.del)) return "Malformed id";

  const payload = op.set ?? op.insert;
  if (!payload) return null;

  for (const [k, v] of Object.entries(payload)) {
    if (v === null || v === undefined) continue;

    const allowed = ENUMS[op.t]?.[k];
    if (allowed && !allowed.includes(v as string)) {
      return `"${String(v).slice(0, 40)}" is not a valid ${k} for ${op.t}`;
    }
    if (INT_COLS.has(k)) {
      if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > MAX_MONEY) {
        return `${k} must be a whole number between 0 and ${MAX_MONEY.toLocaleString("en-IN")}`;
      }
      continue;
    }
    if (k === "overdue") {
      if (typeof v !== "boolean") return "overdue must be true or false";
      continue;
    }
    if (DATE_COLS.has(k)) {
      if (typeof v !== "string" || !validDate(v)) return `${k} must be a real date (YYYY-MM-DD)`;
      continue;
    }
    if (typeof v !== "string") return `${k} must be text`;
    if (v.length > MAX_TEXT) return `${k} is too long (max ${MAX_TEXT} characters)`;
    if ((k === "id" || k.endsWith("_id")) && v !== "" && !ID_RE.test(v)) return `${k} is malformed`;
  }

  // a payment cannot be both paid and voided, and ranges must not run backwards
  const p = payload as Record<string, unknown>;
  if (op.t === "job" && typeof p.started === "string" && typeof p.ends === "string" && p.ends < p.started) {
    return "A job cannot end before it starts";
  }
  if (op.t === "payment" && typeof p.issued === "string" && typeof p.due === "string" && p.due < p.issued) {
    return "A payment cannot fall due before it was issued";
  }
  return null;
}
