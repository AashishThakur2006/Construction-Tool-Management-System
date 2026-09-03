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
const TABLES: Record<
  string,
  { table: string; cols: string[] }
> = {
  asset: {
    table: "assets",
    cols: ["status", "job_id", "allocated_on", "condition", "hours"],
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

  const keys = Object.keys(op.set ?? op.insert ?? {});
  const badCol = keys.find((k) => !def.cols.includes(k));
  if (badCol) return `Column "${badCol}" is not writable on ${op.t}`;

  if (role === "OWNER") return null; // owner may do everything below

  // ---- Site Engineer rules ----
  switch (op.t) {
    case "asset": {
      // allocate / return / transfer only — never retire, never edit specs
      if (op.insert || op.del) return "Engineers cannot add or remove assets";
      const status = op.set?.status as string | undefined;
      if (status && !["In yard", "Allocated", "In workshop"].includes(status)) {
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
