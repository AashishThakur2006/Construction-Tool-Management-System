import { describe, it, expect } from "vitest";
import { denyReason, tableFor, type Op } from "./plinth";

const ok = (op: Op, role: "OWNER" | "SITE_ENGINEER") =>
  expect(denyReason(op, role)).toBeNull();
const deny = (op: Op, role: "OWNER" | "SITE_ENGINEER") =>
  expect(denyReason(op, role)).toEqual(expect.any(String));

describe("tableFor", () => {
  it("maps op targets to real tables", () => {
    expect(tableFor("asset")?.table).toBe("assets");
    expect(tableFor("job")?.table).toBe("jobs");
    expect(tableFor("nope")).toBeUndefined();
  });
});

describe("denyReason — unknown / bad columns", () => {
  it("rejects an unknown target", () => deny({ t: "widget", set: {} }, "OWNER"));
  it("rejects a non-writable column even for the Owner", () =>
    deny({ t: "asset", id: "AST-1", set: { secret: 1 } }, "OWNER"));
});

describe("denyReason — Owner", () => {
  it("may do every allowed write", () => {
    ok({ t: "job", insert: { id: "JOB-26-001", name: "X" } }, "OWNER");
    ok({ t: "asset", id: "AST-1", set: { model: "CAT 320", value: 5, condition: "A" } }, "OWNER");
    ok({ t: "asset", id: "AST-1", set: { status: "Retired" } }, "OWNER");
    ok({ t: "mr", id: "MR-1", set: { status: "Approved", approved_on: "2026-07-19" } }, "OWNER");
    ok({ t: "payment", insert: { id: "INV-1", amount: 100, status: "Pending" } }, "OWNER");
    ok({ t: "payment", id: "INV-1", set: { status: "Paid" } }, "OWNER");
    ok({ t: "employee", insert: { id: "E-9", name: "New" } }, "OWNER");
  });
});

describe("denyReason — Site Engineer", () => {
  it("may allocate / return / transfer an asset", () => {
    ok({ t: "asset", id: "AST-1", set: { status: "Allocated", job_id: "JOB-1", allocated_on: "2026-07-19" } }, "SITE_ENGINEER");
    ok({ t: "asset", id: "AST-1", set: { status: "In yard", job_id: null } }, "SITE_ENGINEER");
    ok({ t: "history", insert: { asset_id: "AST-1", on: "2026-07-19", kind: "Allocated", note: "x" } }, "SITE_ENGINEER");
    ok({ t: "history", delMatch: { asset_id: "AST-1", kind: "Allocated", note: "x" } }, "SITE_ENGINEER");
  });

  it("may raise a fault but not progress it", () => {
    ok({ t: "mr", insert: { id: "MR-9", status: "Reported", asset_id: "AST-1", fault: "f" } }, "SITE_ENGINEER");
    ok({ t: "mr", del: "MR-9" }, "SITE_ENGINEER"); // undo of a raise
    deny({ t: "mr", insert: { id: "MR-9", status: "Approved" } }, "SITE_ENGINEER");
    deny({ t: "mr", id: "MR-9", set: { status: "Approved" } }, "SITE_ENGINEER");
  });

  it("cannot retire, edit specs, add or remove assets", () => {
    deny({ t: "asset", id: "AST-1", set: { status: "Retired" } }, "SITE_ENGINEER");
    deny({ t: "asset", id: "AST-1", set: { value: 999 } }, "SITE_ENGINEER");
    deny({ t: "asset", id: "AST-1", set: { condition: "D" } }, "SITE_ENGINEER");
    deny({ t: "asset", insert: { id: "AST-9", model: "x" } }, "SITE_ENGINEER");
    deny({ t: "asset", del: "AST-1" }, "SITE_ENGINEER");
  });

  it("cannot touch jobs, payments or the payroll", () => {
    deny({ t: "job", insert: { id: "JOB-26-002", name: "X" } }, "SITE_ENGINEER");
    deny({ t: "job", id: "JOB-1", set: { status: "Completed" } }, "SITE_ENGINEER");
    deny({ t: "payment", id: "INV-1", set: { status: "Paid" } }, "SITE_ENGINEER");
    deny({ t: "payment", insert: { id: "INV-9", amount: 1 } }, "SITE_ENGINEER");
    deny({ t: "employee", insert: { id: "E-9", name: "New" } }, "SITE_ENGINEER");
  });
});
