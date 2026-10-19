/*
  PLINTH — store. Session, preferences, scoped reads, mutations with undo.

  The register is held in memory (`db`), hydrated once from GET /api/state.
  Mutations change `db` immediately so the UI reacts, then POST the same
  changes to /api/mutate. Undo restores the local snapshot and posts the
  inverse ops. A failed save rolls the snapshot back and toasts.
*/
import { COPY as SEED_COPY } from "./data.js";
import { toast } from "./ui.js";

const clone = (x) => JSON.parse(JSON.stringify(x));

export const COPY = SEED_COPY;
export let TODAY = "2026-07-19";

export const db = {
  jobs: [],
  employees: [],
  assets: [],
  maintenance: [],
  payments: [],
  history: {},
};

let me = null; // { id, name, role: "Owner" | "Site Engineer" }

/* ---------------- events ---------------- */
const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit() { listeners.forEach((f) => f()); }

/* ---------------- session ---------------- */
export function persona() { return me; }
export function sessionRole() { return me ? (me.role === "Owner" ? "owner" : "engineer") : null; }
export function isOwner() { return me?.role === "Owner"; }

/* Connectivity is judged by whether our own requests actually complete —
   not by navigator.onLine, which misreports on some machines. */
export let online = true;
function setOnline(v) {
  if (online === v) return;
  online = v;
  emit();
}

async function api(path, options) {
  let res;
  // A request that never got an answer is safe to resend; try a few times
  // before declaring the network down (flaky links reset connections).
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      break;
    } catch {
      if (attempt < 2) { await new Promise((r) => setTimeout(r, 300 * (attempt + 1))); continue; }
      setOnline(false);
      const err = new Error("Can't reach the server. Check your connection and try again.");
      err.offline = true;
      throw err;
    }
  }
  setOnline(true);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

/** Load the register for the signed-in user. Returns true if authenticated. */
export async function boot() {
  try {
    const state = await api("/api/state");
    hydrate(state);
    return true;
  } catch (e) {
    if (e.status === 401) { me = null; return false; }
    throw e;
  }
}

function hydrate(state) {
  TODAY = state.today || TODAY;
  me = state.me && state.me.id ? state.me : state.me ? { ...state.me } : null;
  db.jobs = state.jobs || [];
  db.employees = state.employees || [];
  db.assets = state.assets || [];
  db.maintenance = state.maintenance || [];
  db.payments = state.payments || [];
  db.history = state.history || {};
}

export async function signIn(email, password) {
  await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  return boot();
}
export async function signInDev(kind) {
  await api("/api/auth/dev", { method: "POST", body: JSON.stringify({ role: kind }) });
  return boot();
}
export async function register(payload) {
  return api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
}
export async function logout() {
  try { await api("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
  me = null;
  db.jobs = []; db.employees = []; db.assets = []; db.maintenance = []; db.payments = [];
  db.history = {};
}

/* ---------------- preferences ---------------- */
export function pref(name, fallback) { return localStorage.getItem("plinth." + name) || fallback; }
export function setPref(name, value) { localStorage.setItem("plinth." + name, value); applyPrefs(); emit(); }
export function applyPrefs() {
  document.documentElement.dataset.density = pref("density", "comfortable");
  document.documentElement.dataset.motion = pref("motion", "full");
}
export function reducedMotion() {
  return pref("motion", "full") === "reduced" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------------- scoped reads ---------------- */
export function myJobs() {
  if (isOwner()) return db.jobs;
  return db.jobs.filter((j) => j.engineerId === me?.id);
}
export function myJobIds() { return new Set(myJobs().map((j) => j.id)); }
export function canSeeJob(id) { return isOwner() || myJobIds().has(id); }

export function visibleAssets() {
  if (isOwner()) return db.assets;
  const mine = myJobIds();
  const myReports = new Set(db.maintenance.filter((m) => m.reporterId === me?.id).map((m) => m.assetId));
  return db.assets.filter((a) =>
    (a.jobId && mine.has(a.jobId)) || a.status === "In yard" || myReports.has(a.id));
}
export function canSeeAsset(id) { return visibleAssets().some((a) => a.id === id); }

export function visibleMaintenance() {
  if (isOwner()) return db.maintenance;
  return db.maintenance.filter((m) => m.reporterId === me?.id);
}
export function canSeeMr(id) { return visibleMaintenance().some((m) => m.id === id); }

export function visiblePayments() {
  if (isOwner()) return db.payments;
  const mine = myJobIds();
  return db.payments.filter((p) => mine.has(p.jobId));
}
export function canSeePayment(id) { return visiblePayments().some((p) => p.id === id); }

export function visibleEmployees() {
  if (isOwner()) return db.employees;
  const mine = myJobIds();
  return db.employees.filter((e) => e.id === me?.id || (e.jobId && mine.has(e.jobId)));
}
export function canSeeEmployee(id) { return visibleEmployees().some((e) => e.id === id); }

export const job = (id) => db.jobs.find((j) => j.id === id);
export const asset = (id) => db.assets.find((a) => a.id === id);
export const employee = (id) => db.employees.find((e) => e.id === id);
export const mrById = (id) => db.maintenance.find((m) => m.id === id);
export const paymentById = (id) => db.payments.find((p) => p.id === id);

export function jobAssets(jobId) { return db.assets.filter((a) => a.jobId === jobId && a.status === "Allocated"); }
export function jobCrew(jobId) {
  const j = job(jobId);
  return db.employees.filter((e) => e.jobId === jobId || (j && e.id === j.engineerId));
}
export function openMrsFor(assetId) {
  return db.maintenance.filter((m) => m.assetId === assetId && !["Resolved", "Rejected"].includes(m.status));
}

export function dueBack(days = 30) {
  const limit = new Date(new Date(TODAY).getTime() + days * 864e5).toISOString().slice(0, 10);
  return visibleAssets().filter((a) => {
    if (a.status !== "Allocated") return false;
    const j = job(a.jobId);
    return j && j.ends >= TODAY && j.ends <= limit;
  });
}

/* ---------------- nav counts ---------------- */
export function navCounts() {
  const assets = visibleAssets().filter((a) => a.status !== "Retired");
  const inYard = assets.filter((a) => a.status === "In yard").length;
  const mrs = visibleMaintenance();
  const open = mrs.filter((m) => ["Reported", "Approved", "In workshop"].includes(m.status));
  const overdueMr = open.filter((m) => m.overdue).length;
  const pays = visiblePayments();
  const overduePay = pays.filter((p) => p.status === "Overdue");
  const jobsActive = myJobs().filter((j) => j.status === "Active").length;
  return {
    jobs: { active: jobsActive, total: myJobs().length },
    assets: { total: assets.length, inYard },
    maintenance: { open: open.length, overdue: overdueMr },
    payments: {
      overdue: overduePay.length,
      overdueSum: overduePay.reduce((s, p) => s + p.amount, 0),
      pending: pays.filter((p) => p.status === "Pending").length,
    },
    employees: { total: visibleEmployees().length },
  };
}

export function utilization() {
  const pool = db.assets.filter((a) => a.status !== "Retired");
  const allocated = pool.filter((a) => a.status === "Allocated").length;
  return { allocated, total: pool.length, pct: pool.length ? Math.round((allocated / pool.length) * 100) : 0 };
}

export function fieldData(scopeMine = false) {
  const jobsIn = (scopeMine ? myJobs() : db.jobs).filter((j) => j.status === "Active");
  const pool = scopeMine ? visibleAssets() : db.assets;
  return {
    jobs: jobsIn.map((j) => ({
      code: j.id,
      allocated: pool.filter((a) => a.jobId === j.id && a.status === "Allocated").length,
    })),
    idle: pool.filter((a) => a.status === "In yard").length,
    workshop: pool.filter((a) => a.status === "In workshop").length,
  };
}

/* ---------------- load (data is already hydrated) ---------------- */
export function load() { return Promise.resolve(); }

/* ---------------- mutations ---------------- */
function snapshot() {
  const snap = clone(db);
  return () => { Object.keys(snap).forEach((k) => { db[k] = snap[k]; }); };
}
function hist(assetId, kind, note) {
  (db.history[assetId] = db.history[assetId] || []).push({ on: TODAY, kind, note });
}
/** Fire a batch at the server. On failure of a forward change, roll back + toast. */
function push(ops, restore) {
  api("/api/mutate", { method: "POST", body: JSON.stringify({ ops }) }).catch((e) => {
    if (restore) {
      restore(); emit(); toast(`Couldn't save — change reverted. ${e.message}`);
      // the snapshot also discards any other edit made since; re-sync with the server
      boot().then(() => emit()).catch(() => {});
    }
    else toast(`Couldn't sync that undo — reload to resync. ${e.message}`);
  });
}
function nextId(prefix, list, floor, pad = 0) {
  const nums = list.map((r) => Number(String(r.id).replace(prefix, "")) || 0);
  const n = Math.max(floor, ...nums) + 1;
  return prefix + (pad ? String(n).padStart(pad, "0") : n);
}

export function allocate(assetIds, jobId) {
  const restore = snapshot();
  const j = job(jobId);
  const ops = [], inv = [];
  assetIds.forEach((id) => {
    const a = asset(id);
    inv.push({ t: "asset", id, set: { status: a.status, job_id: a.jobId, allocated_on: a.allocatedOn } });
    a.status = "Allocated"; a.jobId = jobId; a.allocatedOn = TODAY;
    const note = `Allocated to ${jobId} — ${j.name}`;
    hist(id, "Allocated", note);
    ops.push({ t: "asset", id, set: { status: "Allocated", job_id: jobId, allocated_on: TODAY } });
    ops.push({ t: "history", insert: { asset_id: id, on: TODAY, kind: "Allocated", note } });
    inv.push({ t: "history", delMatch: { asset_id: id, kind: "Allocated", note } });
  });
  emit();
  push(ops, restore);
  return () => { restore(); emit(); push(inv); };
}

export function returnToYard(assetIds) {
  const restore = snapshot();
  const ops = [], inv = [];
  assetIds.forEach((id) => {
    const a = asset(id);
    inv.push({ t: "asset", id, set: { status: a.status, job_id: a.jobId, allocated_on: a.allocatedOn } });
    const note = `Returned to yard from ${a.jobId}`;
    hist(id, "Returned", note);
    a.status = "In yard"; a.jobId = null; a.allocatedOn = null;
    ops.push({ t: "asset", id, set: { status: "In yard", job_id: null, allocated_on: null } });
    ops.push({ t: "history", insert: { asset_id: id, on: TODAY, kind: "Returned", note } });
    inv.push({ t: "history", delMatch: { asset_id: id, kind: "Returned", note } });
  });
  emit();
  push(ops, restore);
  return () => { restore(); emit(); push(inv); };
}

export function transfer(assetId, toJobId) {
  const restore = snapshot();
  const a = asset(assetId);
  const from = a.jobId, j = job(toJobId);
  const inv = [{ t: "asset", id: assetId, set: { job_id: from, allocated_on: a.allocatedOn } }];
  a.jobId = toJobId; a.allocatedOn = TODAY;
  const note = `Transferred ${from} → ${toJobId} — ${j.name}`;
  hist(assetId, "Transferred", note);
  emit();
  push([
    { t: "asset", id: assetId, set: { job_id: toJobId, allocated_on: TODAY } },
    { t: "history", insert: { asset_id: assetId, on: TODAY, kind: "Transferred", note } },
  ], restore);
  inv.push({ t: "history", delMatch: { asset_id: assetId, kind: "Transferred", note } });
  return () => { restore(); emit(); push(inv); };
}

export function raiseMaintenance({ assetId, fault, estCost }) {
  const restore = snapshot();
  const id = nextId("MR-", db.maintenance, 154);
  const row = { id, assetId, status: "Reported", reported: TODAY, fault, estCost, reporterId: me?.id, overdue: false };
  db.maintenance.unshift(row);
  emit();
  push([{ t: "mr", insert: {
    id, asset_id: assetId, status: "Reported", reported: TODAY,
    fault, est_cost: estCost, reporter_id: me?.id, overdue: false,
  } }], restore);
  return { id, undo: () => { restore(); emit(); push([{ t: "mr", del: id }]); } };
}

export function approveMr(id) {
  const restore = snapshot();
  const m = mrById(id);
  const prev = { status: m.status, approvedOn: m.approvedOn ?? null };
  m.status = "Approved"; m.approvedOn = TODAY;
  emit();
  push([{ t: "mr", id, set: { status: "Approved", approved_on: TODAY } }], restore);
  return () => {
    restore(); emit();
    push([{ t: "mr", id, set: { status: prev.status, approved_on: prev.approvedOn } }]);
  };
}

export function rejectMr(id, note) {
  const restore = snapshot();
  const m = mrById(id);
  const prev = { status: m.status };
  m.status = "Rejected"; m.rejectedOn = TODAY;
  if (note) m.rejectNote = note;
  emit();
  push([{ t: "mr", id, set: { status: "Rejected", rejected_on: TODAY, reject_note: note || null } }], restore);
  return () => {
    restore(); emit();
    push([{ t: "mr", id, set: { status: prev.status, rejected_on: null, reject_note: null } }]);
  };
}

export function startWork(id, mechanicId) {
  const restore = snapshot();
  const m = mrById(id);
  const a = asset(m.assetId);
  const prevA = { status: a.status, job_id: a.jobId, allocated_on: a.allocatedOn };
  const notes = [];
  m.status = "In workshop"; m.workshopOn = TODAY;
  if (mechanicId) m.mechanicId = mechanicId;
  if (a.status === "Allocated") {
    const n = `Pulled from ${a.jobId} into the workshop (${id})`;
    hist(a.id, "Returned", n); notes.push(["Returned", n]);
  }
  a.status = "In workshop"; a.jobId = null; a.allocatedOn = null;
  const n2 = `Workshop intake for ${id} — ${m.fault}`;
  hist(a.id, "Workshop", n2); notes.push(["Workshop", n2]);
  emit();
  push([
    { t: "mr", id, set: { status: "In workshop", workshop_on: TODAY, mechanic_id: mechanicId || null } },
    { t: "asset", id: a.id, set: { status: "In workshop", job_id: null, allocated_on: null } },
    ...notes.map(([kind, note]) => ({ t: "history", insert: { asset_id: a.id, on: TODAY, kind, note } })),
  ], restore);
  return () => {
    restore(); emit();
    push([
      { t: "mr", id, set: { status: "Approved", workshop_on: null, mechanic_id: null } },
      { t: "asset", id: a.id, set: prevA },
      ...notes.map(([kind, note]) => ({ t: "history", delMatch: { asset_id: a.id, kind, note } })),
    ]);
  };
}

export function resolveMr(id) {
  const restore = snapshot();
  const m = mrById(id);
  const a = asset(m.assetId);
  const prevA = { status: a.status, job_id: a.jobId, allocated_on: a.allocatedOn };
  m.status = "Resolved"; m.resolvedOn = TODAY;
  const wasWorkshop = a.status === "In workshop";
  if (wasWorkshop) a.status = "In yard";
  const note = `${id} closed — returned to yard serviceable`;
  hist(a.id, "Resolved", note);
  emit();
  push([
    { t: "mr", id, set: { status: "Resolved", resolved_on: TODAY } },
    ...(wasWorkshop ? [{ t: "asset", id: a.id, set: { status: "In yard" } }] : []),
    { t: "history", insert: { asset_id: a.id, on: TODAY, kind: "Resolved", note } },
  ], restore);
  return () => {
    restore(); emit();
    push([
      { t: "mr", id, set: { status: "In workshop", resolved_on: null } },
      { t: "asset", id: a.id, set: prevA },
      { t: "history", delMatch: { asset_id: a.id, kind: "Resolved", note } },
    ]);
  };
}

export function recordPayment({ jobId, payee, desc, amount, due }) {
  const restore = snapshot();
  const id = nextId("INV-", db.payments, 26499);
  db.payments.unshift({ id, jobId, payee, desc, amount, status: "Pending", issued: TODAY, due });
  emit();
  push([{ t: "payment", insert: {
    id, job_id: jobId, payee, description: desc, amount, status: "Pending", issued: TODAY, due,
  } }], restore);
  return { id, undo: () => { restore(); emit(); push([{ t: "payment", del: id }]); } };
}

export function markPaid(id) {
  const restore = snapshot();
  const p = paymentById(id);
  const prev = { status: p.status };
  p.status = "Paid"; p.paidOn = TODAY;
  emit();
  push([{ t: "payment", id, set: { status: "Paid", paid_on: TODAY } }], restore);
  return () => {
    restore(); emit();
    push([{ t: "payment", id, set: { status: prev.status, paid_on: null } }]);
  };
}

export function voidPayment(id) {
  const restore = snapshot();
  const p = paymentById(id);
  const prev = { status: p.status };
  p.status = "Voided"; p.voidedOn = TODAY;
  emit();
  push([{ t: "payment", id, set: { status: "Voided", voided_on: TODAY } }], restore);
  return () => {
    restore(); emit();
    push([{ t: "payment", id, set: { status: prev.status, voided_on: null } }]);
  };
}

export function addEmployee({ name, role, jobId, phone, email }) {
  const restore = snapshot();
  const id = nextId("E-", db.employees, 200, 3);
  db.employees.push({ id, name, role, jobId: jobId || null, phone, email, startedOn: TODAY, status: "Active" });
  emit();
  push([{ t: "employee", insert: {
    id, name, role, job_id: jobId || null, phone, email, started_on: TODAY, status: "Active",
  } }], restore);
  return { id, undo: () => { restore(); emit(); push([{ t: "employee", del: id }]); } };
}

export function retireAsset(id) {
  const restore = snapshot();
  const a = asset(id);
  const prevA = { status: a.status, job_id: a.jobId, allocated_on: a.allocatedOn };
  const ops = [], inv = [];
  if (a.status === "Allocated") {
    const n = `Allocation to ${a.jobId} closed at retirement`;
    hist(id, "Returned", n);
    ops.push({ t: "history", insert: { asset_id: id, on: TODAY, kind: "Returned", note: n } });
    inv.push({ t: "history", delMatch: { asset_id: id, kind: "Returned", note: n } });
  }
  openMrsFor(id).forEach((m) => {
    inv.push({ t: "mr", id: m.id, set: { status: m.status, rejected_on: null, reject_note: null } });
    m.status = "Rejected"; m.rejectedOn = TODAY; m.rejectNote = "Cancelled — asset retired";
    ops.push({ t: "mr", id: m.id, set: { status: "Rejected", rejected_on: TODAY, reject_note: "Cancelled — asset retired" } });
  });
  a.status = "Retired"; a.jobId = null; a.allocatedOn = null;
  const rn = "Removed from the active register; history kept for audit";
  hist(id, "Retired", rn);
  ops.push({ t: "asset", id, set: { status: "Retired", job_id: null, allocated_on: null } });
  ops.push({ t: "history", insert: { asset_id: id, on: TODAY, kind: "Retired", note: rn } });
  inv.unshift({ t: "asset", id, set: prevA });
  inv.push({ t: "history", delMatch: { asset_id: id, kind: "Retired", note: rn } });
  emit();
  push(ops, restore);
  return () => { restore(); emit(); push(inv); };
}

/* ---------------- jobs & assets (Owner) ---------------- */
function nextJobId() {
  const yy = String(new Date(TODAY).getFullYear()).slice(2);
  const nums = db.jobs
    .map((j) => /^JOB-\d\d-(\d+)$/.exec(j.id))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  return `JOB-${yy}-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}

export function addJob({ name, client, location, status, started, ends, engineerId }) {
  const restore = snapshot();
  const id = nextJobId();
  const row = { id, name, client: client || "", location: location || "", status: status || "Mobilising", started: started || null, ends: ends || null, engineerId: engineerId || null, holdNote: null };
  db.jobs.push(row);
  emit();
  push([{ t: "job", insert: {
    id, name, client: row.client, location: row.location, status: row.status,
    started: row.started, ends: row.ends, engineer_id: row.engineerId,
  } }], restore);
  return { id, undo: () => { restore(); emit(); push([{ t: "job", del: id }]); } };
}

export function updateJob(id, patch) {
  const restore = snapshot();
  const j = job(id);
  const prev = { name: j.name, client: j.client, location: j.location, status: j.status, started: j.started, ends: j.ends, engineerId: j.engineerId };
  Object.assign(j, patch);
  emit();
  push([{ t: "job", id, set: {
    name: j.name, client: j.client, location: j.location, status: j.status,
    started: j.started || null, ends: j.ends || null, engineer_id: j.engineerId || null,
  } }], restore);
  return () => {
    restore(); emit();
    push([{ t: "job", id, set: {
      name: prev.name, client: prev.client, location: prev.location, status: prev.status,
      started: prev.started || null, ends: prev.ends || null, engineer_id: prev.engineerId || null,
    } }]);
  };
}

export function addAsset({ category, model, serial, purchased, value, condition }) {
  const restore = snapshot();
  const id = nextId("AST-", db.assets, 100, 4);
  const row = { id, category: category || "", model: model || "", serial: serial || "", purchased: purchased || null, value: Number(value) || 0, condition: condition || "B", status: "In yard", jobId: null, allocatedOn: null, hours: 0 };
  db.assets.push(row);
  const note = `Purchased and registered · ₹${row.value.toLocaleString("en-IN")}`;
  hist(id, "Registered", note);
  emit();
  push([
    { t: "asset", insert: { id, category: row.category, model: row.model, serial: row.serial, purchased: row.purchased, value: row.value, condition: row.condition, status: "In yard", hours: 0 } },
    { t: "history", insert: { asset_id: id, on: row.purchased || TODAY, kind: "Registered", note } },
  ], restore);
  return { id, undo: () => { restore(); emit(); push([{ t: "asset", del: id }]); } };
}

export function updateAsset(id, patch) {
  const restore = snapshot();
  const a = asset(id);
  const prev = { category: a.category, model: a.model, serial: a.serial, purchased: a.purchased, value: a.value, condition: a.condition, hours: a.hours };
  Object.assign(a, patch, { value: patch.value != null ? Number(patch.value) : a.value, hours: patch.hours != null ? Number(patch.hours) : a.hours });
  emit();
  const send = (o) => push([{ t: "asset", id, set: {
    category: o.category, model: o.model, serial: o.serial,
    purchased: o.purchased || null, value: Number(o.value) || 0,
    condition: o.condition, hours: Number(o.hours) || 0,
  } }]);
  send(a);
  return () => { restore(); emit(); send(prev); };
}

/* ---------------- team (Owner, no undo) ---------------- */
export async function fetchTeam() { return api("/api/team"); }
export async function createMember(payload) {
  return api("/api/team", { method: "POST", body: JSON.stringify(payload) });
}
export async function updateMember(id, patch) {
  return api("/api/team/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(patch) });
}
export async function removeMember(id) {
  return api("/api/team/" + encodeURIComponent(id), { method: "DELETE" });
}

/* ---------------- CSV import (Owner) ---------------- */
/** rows: array of {category,model,serial,purchased,value,condition}. Applied in one batch. */
export async function importAssets(rows) {
  const restore = snapshot();
  const ops = [];
  rows.forEach((r) => {
    const id = nextId("AST-", db.assets, 100, 4);
    const value = Number(r.value) || 0;
    const row = { id, category: r.category || "", model: r.model || "", serial: r.serial || "", purchased: r.purchased || null, value, condition: /^[A-D]$/.test(r.condition) ? r.condition : "B", status: "In yard", jobId: null, allocatedOn: null, hours: 0 };
    db.assets.push(row);
    const note = `Imported and registered · ₹${value.toLocaleString("en-IN")}`;
    hist(id, "Registered", note);
    ops.push({ t: "asset", insert: { id, category: row.category, model: row.model, serial: row.serial, purchased: row.purchased, value, condition: row.condition, status: "In yard", hours: 0 } });
    ops.push({ t: "history", insert: { asset_id: id, on: row.purchased || TODAY, kind: "Registered", note } });
  });
  emit();
  try {
    // chunk to stay under the /api/mutate op cap
    for (let i = 0; i < ops.length; i += 80) {
      await api("/api/mutate", { method: "POST", body: JSON.stringify({ ops: ops.slice(i, i + 80) }) });
    }
    return { count: rows.length };
  } catch (e) {
    restore(); emit();
    throw e;
  }
}

/* ---------------- global search ---------------- */
export function searchAll(q) {
  const s = q.trim().toLowerCase();
  if (!s) return null;
  const has = (...vals) => vals.some((v) => v && String(v).toLowerCase().includes(s));
  return {
    assets: visibleAssets().filter((a) => has(a.id, a.model, a.serial, a.category, a.jobId)),
    jobs: myJobs().filter((j) => has(j.id, j.name, j.client, j.location)),
    employees: visibleEmployees().filter((e) => has(e.id, e.name, e.role, e.email)),
    maintenance: visibleMaintenance().filter((m) => has(m.id, m.assetId, m.fault)),
    payments: visiblePayments().filter((p) => has(p.id, p.payee, p.desc, p.jobId)),
  };
}
