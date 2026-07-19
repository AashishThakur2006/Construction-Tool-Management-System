/*
  PLINTH — store. Session, preferences, scoped reads, mutations with undo.
  All data lives in memory, cloned from seed; mutations are real so the UI
  reacts truthfully. Undo restores a pre-action snapshot of the register.
*/
import * as seed from "./data.js";

const clone = (x) => JSON.parse(JSON.stringify(x));

export const TODAY = seed.TODAY;
export const COPY = seed.COPY;
export const personas = seed.personas;

export const db = {
  jobs: clone(seed.jobs),
  employees: clone(seed.employees),
  assets: clone(seed.assets),
  maintenance: clone(seed.maintenance),
  payments: clone(seed.payments),
  history: clone(seed.history),
};

/* ---------------- events ---------------- */
const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit() { listeners.forEach((f) => f()); }

/* ---------------- session & prefs ---------------- */
let sessionKey = localStorage.getItem("plinth.session") || null;

export function sessionRole() { return sessionKey; }
export function persona() { return sessionKey ? personas[sessionKey] : null; }
export function isOwner() { return sessionKey === "owner"; }
export function login(key) { sessionKey = key; localStorage.setItem("plinth.session", key); }
export function logout() { sessionKey = null; localStorage.removeItem("plinth.session"); }
export function setRole(key) { login(key); emit(); }

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
  const me = persona();
  return db.jobs.filter((j) => j.engineerId === me.id);
}
export function myJobIds() { return new Set(myJobs().map((j) => j.id)); }
export function canSeeJob(id) { return isOwner() || myJobIds().has(id); }

export function visibleAssets() {
  if (isOwner()) return db.assets;
  const mine = myJobIds();
  const me = persona();
  const myReports = new Set(db.maintenance.filter((m) => m.reporterId === me.id).map((m) => m.assetId));
  return db.assets.filter((a) =>
    (a.jobId && mine.has(a.jobId)) || a.status === "In yard" || myReports.has(a.id));
}
export function canSeeAsset(id) { return visibleAssets().some((a) => a.id === id); }

export function visibleMaintenance() {
  if (isOwner()) return db.maintenance;
  const me = persona();
  return db.maintenance.filter((m) => m.reporterId === me.id);
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
  const me = persona();
  return db.employees.filter((e) => e.id === me.id || (e.jobId && mine.has(e.jobId)));
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

/* due back = allocated to a job whose end date is within `days` of today */
export function dueBack(days = 30) {
  const limit = new Date(new Date(TODAY).getTime() + days * 864e5).toISOString().slice(0, 10);
  return visibleAssets().filter((a) => {
    if (a.status !== "Allocated") return false;
    const j = job(a.jobId);
    return j && j.ends >= TODAY && j.ends <= limit;
  });
}

/* ---------------- nav counts (live truth, scoped) ---------------- */
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

/* ---------------- signature field data ---------------- */
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

/* ---------------- load simulation ---------------- */
const loaded = new Set();
export function load(key, ms = 500) {
  if (loaded.has(key)) return Promise.resolve();
  loaded.add(key);
  return new Promise((res) => setTimeout(res, ms));
}

/* ---------------- mutations (all snapshot for undo) ---------------- */
function snapshot() {
  const snap = clone(db);
  return () => { Object.keys(snap).forEach((k) => { db[k] = snap[k]; }); emit(); };
}
function hist(assetId, kind, note) {
  (db.history[assetId] = db.history[assetId] || []).push({ on: TODAY, kind, note });
}

export function allocate(assetIds, jobId) {
  const undo = snapshot();
  const j = job(jobId);
  assetIds.forEach((id) => {
    const a = asset(id);
    a.status = "Allocated"; a.jobId = jobId; a.allocatedOn = TODAY;
    hist(id, "Allocated", `Allocated to ${jobId} — ${j.name}`);
  });
  emit();
  return undo;
}

export function returnToYard(assetIds) {
  const undo = snapshot();
  assetIds.forEach((id) => {
    const a = asset(id);
    hist(id, "Returned", `Returned to yard from ${a.jobId}`);
    a.status = "In yard"; a.jobId = null; a.allocatedOn = null;
  });
  emit();
  return undo;
}

export function transfer(assetId, toJobId) {
  const undo = snapshot();
  const a = asset(assetId);
  const from = a.jobId, j = job(toJobId);
  a.jobId = toJobId; a.allocatedOn = TODAY;
  hist(assetId, "Transferred", `Transferred ${from} → ${toJobId} — ${j.name}`);
  emit();
  return undo;
}

let mrSeq = 160;
export function raiseMaintenance({ assetId, fault, estCost }) {
  const undo = snapshot();
  const id = `MR-${mrSeq++}`;
  db.maintenance.unshift({
    id, assetId, status: "Reported", reported: TODAY,
    fault, estCost, reporterId: persona().id,
  });
  emit();
  return { undo, id };
}

export function approveMr(id) {
  const undo = snapshot();
  const m = mrById(id);
  m.status = "Approved"; m.approvedOn = TODAY;
  emit();
  return undo;
}
export function rejectMr(id, note) {
  const undo = snapshot();
  const m = mrById(id);
  m.status = "Rejected"; m.rejectedOn = TODAY;
  if (note) m.rejectNote = note;
  emit();
  return undo;
}
export function startWork(id, mechanicId) {
  const undo = snapshot();
  const m = mrById(id);
  m.status = "In workshop"; m.workshopOn = TODAY;
  if (mechanicId) m.mechanicId = mechanicId;
  const a = asset(m.assetId);
  if (a.status === "Allocated") hist(a.id, "Returned", `Pulled from ${a.jobId} into the workshop (${id})`);
  a.status = "In workshop"; a.jobId = null; a.allocatedOn = null;
  hist(a.id, "Workshop", `Workshop intake for ${id} — ${m.fault}`);
  emit();
  return undo;
}
export function resolveMr(id) {
  const undo = snapshot();
  const m = mrById(id);
  m.status = "Resolved"; m.resolvedOn = TODAY;
  const a = asset(m.assetId);
  if (a.status === "In workshop") { a.status = "In yard"; }
  hist(a.id, "Resolved", `${id} closed — returned to yard serviceable`);
  emit();
  return undo;
}

let paySeq = 900;
export function recordPayment({ jobId, payee, desc, amount, due }) {
  const undo = snapshot();
  const id = `INV-26${paySeq++}`;
  db.payments.unshift({ id, jobId, payee, desc, amount, status: "Pending", issued: TODAY, due });
  emit();
  return { undo, id };
}
export function markPaid(id) {
  const undo = snapshot();
  const p = paymentById(id);
  p.status = "Paid"; p.paidOn = TODAY;
  emit();
  return undo;
}
export function voidPayment(id) {
  const undo = snapshot();
  const p = paymentById(id);
  p.status = "Voided"; p.voidedOn = TODAY;
  emit();
  return undo;
}

let empSeq = 200;
export function addEmployee({ name, role, jobId, phone, email }) {
  const undo = snapshot();
  const id = `E-${empSeq++}`;
  db.employees.push({
    id, name, role, jobId: jobId || null, phone, email,
    startedOn: TODAY, status: "Active",
  });
  emit();
  return { undo, id };
}

export function retireAsset(id) {
  const undo = snapshot();
  const a = asset(id);
  if (a.status === "Allocated") hist(id, "Returned", `Allocation to ${a.jobId} closed at retirement`);
  openMrsFor(id).forEach((m) => { m.status = "Rejected"; m.rejectedOn = TODAY; m.rejectNote = "Cancelled — asset retired"; });
  a.status = "Retired"; a.jobId = null; a.allocatedOn = null;
  hist(id, "Retired", "Removed from the active register; history kept for audit");
  emit();
  return undo;
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
