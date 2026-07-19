/*
  PLINTH — interface language and seed data.

  GLOSSARY (used with zero drift, everywhere):
    Asset        — any ownable piece of plant or equipment. Never "tool",
                   "equipment" or "machine" in the interface.
    Job          — one contracted scope of work at one location. Never
                   "project" or "site" as a noun for the work unit.
    Allocation   — the record of an asset committed to a job.
                   Verbs: allocate, return, transfer. Never "assign",
                   "check out" or "issue" for assets.
    Yard         — where unallocated assets live. Status: "In yard".
    Workshop     — maintenance holding. Status: "In workshop".
    Employee     — a person on the payroll, assigned to jobs.
    Maintenance request — Reported → Approved → In workshop → Resolved,
                   or Rejected. The Owner approves spend.
    Payment      — one ledger entry. Paid, Pending, Overdue or Disputed.

  Dates are internally consistent against TODAY. An asset is never
  allocated to a job outside that job's window; maintenance never predates
  purchase; overdue means due-date past and unpaid. Money is INR.
*/

export const TODAY = "2026-07-19";

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20260719);
const between = (a, b) => {
  const t = new Date(a).getTime() + R() * (new Date(b).getTime() - new Date(a).getTime());
  return new Date(t).toISOString().slice(0, 10);
};
function daysAgo(d) {
  return new Date(new Date(TODAY).getTime() - d * 864e5).toISOString().slice(0, 10);
}

/* ---------------- jobs ---------------- */

export const jobs = [
  { id: "JOB-24-004", name: "Wagholi Warehouse Park — Shed 2", client: "Panchshil Industrial", location: "Wagholi, Pune", status: "Completed", started: "2024-03-11", ends: "2024-12-19", engineerId: "E-104" },
  { id: "JOB-24-009", name: "Chakan Press Shop Bay Extension", client: "Bharat Forge Facilities", location: "Chakan MIDC, Pune", status: "Completed", started: "2024-06-02", ends: "2025-02-27", engineerId: "E-103" },
  { id: "JOB-24-011", name: "Mundhwa Riverside Depot Expansion", client: "MSRDC", location: "Mundhwa, Pune", status: "Active", started: "2024-08-05", ends: "2026-11-20", engineerId: "E-102" },
  { id: "JOB-24-014", name: "Katraj Flyover Deck Replacement", client: "L&T Transportation", location: "Katraj, Pune", status: "Active", started: "2024-11-04", ends: "2026-09-30", engineerId: "E-103" },
  { id: "JOB-24-016", name: "Mula Riverbank Outfall Repairs", client: "PMC Drainage Department", location: "Aundh, Pune", status: "Completed", started: "2024-09-23", ends: "2025-06-12", engineerId: "E-105" },
  { id: "JOB-24-017", name: "Ranjangaon Forge Hall Strengthening", client: "Tata Projects", location: "Ranjangaon MIDC", status: "Active", started: "2024-12-09", ends: "2026-08-28", engineerId: "E-104" },
  { id: "JOB-25-002", name: "Baner Water Main Relay", client: "Pune Smart City JV", location: "Baner Road, Pune", status: "Active", started: "2025-02-10", ends: "2026-12-18", engineerId: "E-104" },
  { id: "JOB-25-003", name: "FC Road Streetscape — Phase 1", client: "Shapoorji Pallonji JV", location: "FC Road, Pune", status: "Completed", started: "2025-01-13", ends: "2026-03-06", engineerId: "E-102" },
  { id: "JOB-25-005", name: "Koregaon Park Shoring — Block 7", client: "Godrej Constructions", location: "Koregaon Park, Pune", status: "Active", started: "2025-04-21", ends: "2026-10-09", engineerId: "E-102" },
  { id: "JOB-25-006", name: "Talegaon Substation Enabling Works", client: "MSETCL Contractor Group", location: "Talegaon Dabhade", status: "On hold", started: "2025-03-03", ends: "2026-05-22", engineerId: "E-105", holdNote: "Client stop-work since 22 May 2026 — utility easement dispute" },
  { id: "JOB-25-008", name: "NMIA Landside Trench Duct", client: "L&T — Airport Package JV", location: "Ulwe, Navi Mumbai", status: "Active", started: "2025-06-30", ends: "2027-02-26", engineerId: "E-103" },
  { id: "JOB-25-011", name: "Sinhagad Road Retaining Walls", client: "NCC Ltd", location: "Sinhagad Road, Pune", status: "Active", started: "2025-09-15", ends: "2026-08-21", engineerId: "E-105" },
  { id: "JOB-25-015", name: "Indrayani Levee Raising", client: "Afcons — Sub-Package 4", location: "Alandi, Pune", status: "Mobilising", started: "2026-08-03", ends: "2027-06-30", engineerId: "E-102" },
  { id: "JOB-25-016", name: "Chakan Cold Storage Slab", client: "KEC Infrastructure", location: "Chakan MIDC, Pune", status: "Mobilising", started: "2026-09-14", ends: "2027-03-12", engineerId: "E-103" },
];

/* ---------------- employees ---------------- */

const crew = [
  ["E-001", "Rajendra Palekar", "Owner", null],
  ["E-102", "Priya Nair", "Site Engineer", null],
  ["E-103", "Arvind Kulkarni", "Site Engineer", null],
  ["E-104", "Sneha Deshpande", "Site Engineer", null],
  ["E-105", "Rohan Bhosale", "Site Engineer", null],
  ["E-110", "Santosh Jadhav", "Plant Operator", "JOB-24-011"],
  ["E-111", "Imran Shaikh", "Plant Operator", "JOB-24-011"],
  ["E-112", "Balu Pawar", "Plant Operator", "JOB-24-014"],
  ["E-113", "Ganesh More", "Plant Operator", "JOB-24-017"],
  ["E-114", "Nitin Gaikwad", "Plant Operator", "JOB-25-002"],
  ["E-115", "Prakash Chavan", "Plant Operator", "JOB-25-005"],
  ["E-116", "Feroz Khan", "Plant Operator", "JOB-25-008"],
  ["E-120", "Sunita Kamble", "Plant Mechanic", null],
  ["E-121", "Dattatray Shinde", "Plant Mechanic", null],
  ["E-122", "Manoj Yadav", "Plant Mechanic", null],
  ["E-130", "Kavita Joshi", "Surveyor", "JOB-24-014"],
  ["E-131", "Harish Patil", "Surveyor", "JOB-25-011"],
  ["E-140", "Ravi Salunkhe", "Rigger", "JOB-24-017"],
  ["E-141", "Deepak Waghmare", "Rigger", "JOB-25-005"],
  ["E-142", "Anil Thorat", "Rigger", "JOB-24-011"],
  ["E-150", "Vandana Sable", "Concrete Finisher", "JOB-25-002"],
  ["E-151", "Abdul Momin", "Concrete Finisher", "JOB-25-011"],
  ["E-160", "Shubhangi Dhole", "Yard Storekeeper", null],
  ["E-161", "Vitthal Kadam", "Truck Driver", null],
  ["E-162", "Sagar Bhandari", "Truck Driver", null],
  ["E-170", "Meera Kulkarni", "Office Administrator", null],
];

export const employees = crew.map(([id, name, role, jobId], i) => ({
  id, name, role, jobId,
  phone: `+91 98${((220 + i * 3) % 900) + 100} ${String(40100 + i * 731).slice(0, 5)}`,
  email: name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".") + "@plinthops.in",
  startedOn: between("2018-01-15", "2025-11-01"),
  status: i === 21 ? "On leave" : "Active",
}));

/* demo personas for the role switcher */
export const personas = {
  owner: { id: "E-001", name: "Rajendra Palekar", role: "Owner" },
  engineer: { id: "E-102", name: "Priya Nair", role: "Site Engineer" },
};

/* ---------------- assets ---------------- */

const catalog = [
  ["Earthmoving", "CAT 320 Excavator", [11500000, 16000000]],
  ["Earthmoving", "CAT 308 Mini Excavator", [5200000, 7200000]],
  ["Earthmoving", "Komatsu PC210 Excavator", [10500000, 14500000]],
  ["Earthmoving", "Bobcat S650 Skid Steer", [2800000, 3900000]],
  ["Earthmoving", "JCB 3DX Backhoe Loader", [3200000, 4200000]],
  ["Lifting", "Genie GS-1932 Scissor Lift", [1200000, 1750000]],
  ["Lifting", "Genie Z-45 Boom Lift", [4000000, 5500000]],
  ["Lifting", "Manitou MT 625 Telehandler", [6000000, 7800000]],
  ["Lifting", "Kito 2 t Chain Block", [75000, 135000]],
  ["Concrete", "Whiteman B446 Power Trowel", [270000, 430000]],
  ["Concrete", "Wacker BS60-4 Rammer", [220000, 300000]],
  ["Concrete", "Husqvarna K770 Cut-off Saw", [92000, 125000]],
  ["Concrete", "Belle Minimix 150 Mixer", [67000, 108000]],
  ["Power & Air", "Atlas Copco XAS 88 Compressor", [1450000, 2000000]],
  ["Power & Air", "Honda EU70is Generator", [400000, 520000]],
  ["Power & Air", "Kirloskar KG1-62.5 Generator", [2300000, 3250000]],
  ["Power & Air", "Hilti TE 3000-AVR Breaker", [175000, 240000]],
  ["Survey", "Leica TS16 Total Station", [2150000, 2850000]],
  ["Survey", "Topcon RL-H5A Laser Level", [58000, 92000]],
  ["Access", "BoSS Clima 6.2 m Tower", [280000, 425000]],
  ["Site Support", "Wacker PT3 Trash Pump", [185000, 285000]],
  ["Site Support", "Ador Weldmaker 400 Welder", [320000, 450000]],
  ["Site Support", "SMC TL90 Lighting Tower", [800000, 1200000]],
  ["Site Support", "Karcher HD 6/13 Washer", [75000, 118000]],
];

const activeJobs = jobs.filter((j) => j.status === "Active").map((j) => j.id);
const completedJobs = jobs.filter((j) => j.status === "Completed");

function serialFor(model, n) {
  const code = model.split(" ")[0].slice(0, 3).toUpperCase();
  return `${code}-${String(40000 + n * 137 + Math.floor(R() * 90)).slice(0, 5)}`;
}

export const assets = [];
const WORKSHOP_IDS = [];
for (let n = 0; n < 64; n++) {
  const [category, model, [lo, hi]] = catalog[n % catalog.length];
  const id = `AST-${String(101 + n).padStart(4, "0")}`;
  const purchased = between("2019-02-01", "2025-10-01");
  const condRoll = R();
  const condition = condRoll < 0.42 ? "A" : condRoll < 0.76 ? "B" : condRoll < 0.94 ? "C" : "D";
  // status mix: ~38 allocated, ~19 in yard, 7 in workshop
  let status, jobId = null, allocatedOn = null;
  if (n % 9 === 4 && WORKSHOP_IDS.length < 7) {
    status = "In workshop";
    WORKSHOP_IDS.push(id);
  } else if (n % 3 === 2) {
    status = "In yard";
  } else {
    status = "Allocated";
    jobId = activeJobs[n % activeJobs.length];
    const job = jobs.find((j) => j.id === jobId);
    const windowStart = job.started > purchased ? job.started : purchased;
    allocatedOn = between(windowStart, TODAY);
  }
  assets.push({
    id, category, model, serial: serialFor(model, n),
    purchased, value: Math.round((lo + R() * (hi - lo)) / 1000) * 1000,
    condition, status, jobId, allocatedOn,
    hours: Math.round(120 + R() * 5200),
  });
}

const inr = (n) => "₹" + n.toLocaleString("en-IN");

/* per-asset history: purchase, past allocations on completed jobs, current state */
export const history = {};
assets.forEach((a, i) => {
  const events = [{ on: a.purchased, kind: "Registered", note: `Purchased and registered · ${inr(a.value)}` }];
  const past = completedJobs[i % completedJobs.length];
  if (past && past.started > a.purchased) {
    const from = between(past.started, past.ends);
    events.push({ on: from, kind: "Allocated", note: `Allocated to ${past.id} — ${past.name}` });
    events.push({ on: past.ends, kind: "Returned", note: `Returned to yard at ${past.id} completion` });
  }
  if (a.status === "Allocated") {
    events.push({ on: a.allocatedOn, kind: "Allocated", note: `Allocated to ${a.jobId} — ${jobs.find((j) => j.id === a.jobId).name}` });
  }
  history[a.id] = events.sort((x, y) => x.on.localeCompare(y.on));
});

/* ---------------- maintenance requests ---------------- */
/* Every asset with status "In workshop" has a request at Approved or
   In workshop; the rest of the queue covers every status. */

const faults = [
  "Hydraulic hose weeping at boom ram", "Track tension slack beyond limits",
  "Charging fault — alternator output low", "Cut depth guard cracked",
  "Coolant leak at water pump", "Deadman trigger intermittent",
  "Mast chain stretch at limit", "Engine hunting under load",
  "Slew ring play above tolerance", "Fuel line perished at tank union",
  "Emergency stop fails to latch", "Platform gate spring broken",
];

let mrN = 0;
function mr(assetId, status, reportedOffsetDays, cost, reporterId, extra = {}) {
  const reported = daysAgo(reportedOffsetDays);
  mrN += 1;
  return {
    id: `MR-${140 + mrN}`,
    assetId, status, reported,
    fault: faults[mrN % faults.length],
    estCost: cost,
    reporterId,
    ...extra,
  };
}

export const maintenance = [
  mr(WORKSHOP_IDS[0], "In workshop", 21, 290000, "E-102", { approvedOn: daysAgo(18), workshopOn: daysAgo(15), mechanicId: "E-120" }),
  mr(WORKSHOP_IDS[1], "In workshop", 13, 158000, "E-103", { approvedOn: daysAgo(11), workshopOn: daysAgo(9), mechanicId: "E-121" }),
  mr(WORKSHOP_IDS[2], "In workshop", 9, 65000, "E-105", { approvedOn: daysAgo(7), workshopOn: daysAgo(6), mechanicId: "E-122" }),
  mr(WORKSHOP_IDS[3], "In workshop", 30, 442000, "E-104", { approvedOn: daysAgo(27), workshopOn: daysAgo(24), mechanicId: "E-120", overdue: true }),
  mr(WORKSHOP_IDS[4], "Approved", 6, 196000, "E-102", { approvedOn: daysAgo(3) }),
  mr(WORKSHOP_IDS[5], "Approved", 4, 84000, "E-103", { approvedOn: daysAgo(1) }),
  mr(WORKSHOP_IDS[6], "Reported", 2, 123000, "E-105"),
  mr("AST-0105", "Reported", 1, 54000, "E-102"),
  mr("AST-0117", "Reported", 5, 262000, "E-104", { overdue: true }),
  mr("AST-0122", "Resolved", 64, 101000, "E-103", { approvedOn: daysAgo(60), workshopOn: daysAgo(58), resolvedOn: daysAgo(49), mechanicId: "E-121" }),
  mr("AST-0131", "Resolved", 41, 233000, "E-105", { approvedOn: daysAgo(38), workshopOn: daysAgo(35), resolvedOn: daysAgo(30), mechanicId: "E-122" }),
  mr("AST-0140", "Resolved", 25, 36000, "E-102", { approvedOn: daysAgo(24), workshopOn: daysAgo(22), resolvedOn: daysAgo(20), mechanicId: "E-120" }),
  mr("AST-0126", "Rejected", 33, 710000, "E-104", { rejectedOn: daysAgo(29), rejectNote: "Repair exceeds 60% of replacement value — schedule for disposal review instead" }),
  mr("AST-0148", "Rejected", 12, 45000, "E-103", { rejectedOn: daysAgo(10), rejectNote: "Duplicate of MR-151 raised the same week" }),
];

/* ---------------- payments ---------------- */

const payees = [
  "Gmmco Ltd — CAT parts", "Sanghvi Movers — cross-hire", "Deccan Sand & Aggregates",
  "TIL Ltd — parts counter", "Powerica generator service", "HP Fuels — bulk diesel",
  "Pune Crane Services", "SafeZone Traffic Management",
];

let pN = 0;
function pay(jobId, payee, desc, amount, status, issuedDaysAgo, dueDaysFromIssue, extra = {}) {
  pN += 1;
  const issued = daysAgo(issuedDaysAgo);
  const due = new Date(new Date(issued).getTime() + dueDaysFromIssue * 864e5).toISOString().slice(0, 10);
  return { id: `INV-26${String(400 + pN * 7)}`, jobId, payee, desc, amount, status, issued, due, ...extra };
}

export const payments = [
  pay("JOB-24-011", payees[0], "PC210 undercarriage rebuild — parts", 1040000, "Paid", 88, 30, { paidOn: daysAgo(55) }),
  pay("JOB-24-011", payees[1], "Cross-hired 20 t roller, 6 weeks", 820000, "Overdue", 71, 30),
  pay("JOB-24-014", payees[2], "Structural backfill, 340 t", 1360000, "Paid", 62, 30, { paidOn: daysAgo(28) }),
  pay("JOB-24-014", payees[7], "Lane closure crew, deck pours 4–6", 1810000, "Pending", 18, 45),
  pay("JOB-24-017", payees[4], "Telehandler 500 h service", 325000, "Paid", 47, 30, { paidOn: daysAgo(12) }),
  pay("JOB-24-017", payees[6], "Mobile crane, truss lift day rate", 630000, "Disputed", 39, 30, { disputeNote: "Standby hours billed at working rate — contested 12 Jun 2026" }),
  pay("JOB-25-002", payees[5], "Bulk diesel, Q2 top-up", 960000, "Paid", 51, 14, { paidOn: daysAgo(40) }),
  pay("JOB-25-002", payees[3], "Trench shield seal kits", 168000, "Pending", 9, 30),
  pay("JOB-25-005", payees[1], "Cross-hired piling rig attachments", 1590000, "Overdue", 64, 30),
  pay("JOB-25-005", payees[2], "Shotcrete aggregate, 90 t", 552000, "Paid", 33, 30, { paidOn: daysAgo(5) }),
  pay("JOB-25-008", payees[5], "Bulk diesel, airside bowser", 1180000, "Pending", 12, 30),
  pay("JOB-25-008", payees[0], "Generator load-bank test", 183000, "Paid", 29, 14, { paidOn: daysAgo(16) }),
  pay("JOB-25-011", payees[3], "Breaker steels and retainers", 76000, "Pending", 6, 30),
  pay("JOB-25-011", payees[6], "Wall panel lift sequence", 478000, "Overdue", 49, 30),
];

/* ---------------- state copy (written in advance) ---------------- */

export const COPY = {
  loading: "Loading from the register.",
  empty: {
    assets: { title: "No assets registered", body: "The register is empty. Add the first asset and it will appear here and in the allocation field.", action: "Register an asset" },
    jobs: { title: "No jobs yet", body: "Create a job to start allocating assets and crew to it.", action: "Create a job" },
    employees: { title: "No employees on file", body: "Add crew and staff here to assign them to jobs.", action: "Add an employee" },
    maintenance: { title: "The maintenance queue is clear", body: "Faults reported from any job will land here for approval and workshop scheduling.", action: null },
    payments: { title: "The ledger is empty", body: "Payments recorded against jobs will appear here with their status.", action: null },
  },
  error: { title: "This view could not be loaded", body: "The register did not respond. Your data is unchanged. Retry now, or come back after checking your connection.", action: "Retry" },
  offline: { title: "You are offline", body: "Plinth will keep showing the last loaded data and retry when the connection returns. Changes are disabled until then.", action: "Retry connection" },
  denied: { title: "This area is restricted", body: "Your role does not include this record. Payments and approvals outside your jobs are visible to the Owner only. If you need access, ask the Owner to reassign the job to you.", action: "Back to dashboard" },
  noResults: (q) => ({ title: `Nothing matches “${q}”`, body: "Check the spelling, or search by asset ID (AST-0112), job code (JOB-24-011), invoice (INV-26428), or a person's name.", action: "Clear search" }),
  confirm: {
    deleteAsset: (a, openAlloc, openMr) => ({
      title: `Retire ${a.id} — ${a.model}?`,
      body: `${openAlloc ? `Its open allocation to ${a.jobId} will be closed. ` : ""}${openMr ? `${openMr} open maintenance request${openMr > 1 ? "s" : ""} will be cancelled. ` : ""}The asset's history is kept for audit. This cannot be undone from this screen.`,
      confirmLabel: "Retire asset",
    }),
    rejectMr: (m, a, reporter) => ({
      title: `Reject ${m.id}?`,
      body: `${reporter} will see the rejection, and ${a.id} stays in service with the fault unrepaired. Estimated repair deferred: ${inr(m.estCost)}.`,
      confirmLabel: "Reject request",
    }),
    voidPayment: (p) => ({
      title: `Void ${p.id} — ${inr(p.amount)} to ${p.payee}?`,
      body: `The ledger keeps a voided row for audit. The amount is removed from ${p.jobId} committed spend. The payee is not notified by Plinth.`,
      confirmLabel: "Void payment",
    }),
    returnAsset: (a) => ({
      title: `Return ${a.id} to the yard?`,
      body: `The allocation to ${a.jobId} closes today and the asset becomes available to every job.`,
      confirmLabel: "Return to yard",
    }),
  },
};
