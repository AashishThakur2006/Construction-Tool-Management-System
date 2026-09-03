/**
 * Plinth demo seeder.  npm run seed
 *
 * Wipes the register (not auth users) and inserts an internally consistent
 * dataset built around TODAY = 2026-07-19, plus two demo accounts:
 *   rajendra@plinthops.in / demo1234   (Owner,        E-001)
 *   priya@plinthops.in    / demo1234   (Site Engineer, E-102)
 */
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const { DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!DATABASE_URL || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env — need DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (see .env.local).");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });
const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TODAY = "2026-07-19";

/* ---------- deterministic generators (ported from Plinth's data.js) ---------- */
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
const daysAgo = (d) => new Date(new Date(TODAY).getTime() - d * 864e5).toISOString().slice(0, 10);
const inr = (n) => "₹" + n.toLocaleString("en-IN");

/* ---------- jobs ---------- */
const jobs = [
  { id: "JOB-24-004", name: "Wagholi Warehouse Park — Shed 2", client: "Panchshil Industrial", location: "Wagholi, Pune", status: "Completed", started: "2024-03-11", ends: "2024-12-19", engineer_id: "E-104" },
  { id: "JOB-24-009", name: "Chakan Press Shop Bay Extension", client: "Bharat Forge Facilities", location: "Chakan MIDC, Pune", status: "Completed", started: "2024-06-02", ends: "2025-02-27", engineer_id: "E-103" },
  { id: "JOB-24-011", name: "Mundhwa Riverside Depot Expansion", client: "MSRDC", location: "Mundhwa, Pune", status: "Active", started: "2024-08-05", ends: "2026-11-20", engineer_id: "E-102" },
  { id: "JOB-24-014", name: "Katraj Flyover Deck Replacement", client: "L&T Transportation", location: "Katraj, Pune", status: "Active", started: "2024-11-04", ends: "2026-09-30", engineer_id: "E-103" },
  { id: "JOB-24-016", name: "Mula Riverbank Outfall Repairs", client: "PMC Drainage Department", location: "Aundh, Pune", status: "Completed", started: "2024-09-23", ends: "2025-06-12", engineer_id: "E-105" },
  { id: "JOB-24-017", name: "Ranjangaon Forge Hall Strengthening", client: "Tata Projects", location: "Ranjangaon MIDC", status: "Active", started: "2024-12-09", ends: "2026-08-28", engineer_id: "E-104" },
  { id: "JOB-25-002", name: "Baner Water Main Relay", client: "Pune Smart City JV", location: "Baner Road, Pune", status: "Active", started: "2025-02-10", ends: "2026-12-18", engineer_id: "E-104" },
  { id: "JOB-25-003", name: "FC Road Streetscape — Phase 1", client: "Shapoorji Pallonji JV", location: "FC Road, Pune", status: "Completed", started: "2025-01-13", ends: "2026-03-06", engineer_id: "E-102" },
  { id: "JOB-25-005", name: "Koregaon Park Shoring — Block 7", client: "Godrej Constructions", location: "Koregaon Park, Pune", status: "Active", started: "2025-04-21", ends: "2026-10-09", engineer_id: "E-102" },
  { id: "JOB-25-006", name: "Talegaon Substation Enabling Works", client: "MSETCL Contractor Group", location: "Talegaon Dabhade", status: "On hold", started: "2025-03-03", ends: "2026-05-22", engineer_id: "E-105", hold_note: "Client stop-work since 22 May 2026 — utility easement dispute" },
  { id: "JOB-25-008", name: "NMIA Landside Trench Duct", client: "L&T — Airport Package JV", location: "Ulwe, Navi Mumbai", status: "Active", started: "2025-06-30", ends: "2027-02-26", engineer_id: "E-103" },
  { id: "JOB-25-011", name: "Sinhagad Road Retaining Walls", client: "NCC Ltd", location: "Sinhagad Road, Pune", status: "Active", started: "2025-09-15", ends: "2026-08-21", engineer_id: "E-105" },
  { id: "JOB-25-015", name: "Indrayani Levee Raising", client: "Afcons — Sub-Package 4", location: "Alandi, Pune", status: "Mobilising", started: "2026-08-03", ends: "2027-06-30", engineer_id: "E-102" },
  { id: "JOB-25-016", name: "Chakan Cold Storage Slab", client: "KEC Infrastructure", location: "Chakan MIDC, Pune", status: "Mobilising", started: "2026-09-14", ends: "2027-03-12", engineer_id: "E-103" },
];

/* ---------- employees ---------- */
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
const employees = crew.map(([id, name, role, job_id], i) => ({
  id, name, role, job_id,
  phone: `+91 98${((220 + i * 3) % 900) + 100} ${String(40100 + i * 731).slice(0, 5)}`,
  email: name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".") + "@plinthops.in",
  started_on: between("2018-01-15", "2025-11-01"),
  status: i === 21 ? "On leave" : "Active",
}));

/* ---------- assets ---------- */
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
const serialFor = (model, n) =>
  `${model.split(" ")[0].slice(0, 3).toUpperCase()}-${String(40000 + n * 137 + Math.floor(R() * 90)).slice(0, 5)}`;

const assets = [];
const WORKSHOP_IDS = [];
for (let n = 0; n < 64; n++) {
  const [category, model, [lo, hi]] = catalog[n % catalog.length];
  const id = `AST-${String(101 + n).padStart(4, "0")}`;
  const purchased = between("2019-02-01", "2025-10-01");
  const condRoll = R();
  const condition = condRoll < 0.42 ? "A" : condRoll < 0.76 ? "B" : condRoll < 0.94 ? "C" : "D";
  let status, job_id = null, allocated_on = null;
  if (n % 9 === 4 && WORKSHOP_IDS.length < 7) {
    status = "In workshop";
    WORKSHOP_IDS.push(id);
  } else if (n % 3 === 2) {
    status = "In yard";
  } else {
    status = "Allocated";
    job_id = activeJobs[n % activeJobs.length];
    const job = jobs.find((j) => j.id === job_id);
    const windowStart = job.started > purchased ? job.started : purchased;
    allocated_on = between(windowStart, TODAY);
  }
  assets.push({
    id, category, model, serial: serialFor(model, n),
    purchased, value: Math.round((lo + R() * (hi - lo)) / 1000) * 1000,
    condition, status, job_id, allocated_on, hours: Math.round(120 + R() * 5200),
  });
}

/* ---------- per-asset history ---------- */
const history = [];
assets.forEach((a, i) => {
  history.push({ asset_id: a.id, on: a.purchased, kind: "Registered", note: `Purchased and registered · ${inr(a.value)}` });
  const past = completedJobs[i % completedJobs.length];
  if (past && past.started > a.purchased) {
    history.push({ asset_id: a.id, on: between(past.started, past.ends), kind: "Allocated", note: `Allocated to ${past.id} — ${past.name}` });
    history.push({ asset_id: a.id, on: past.ends, kind: "Returned", note: `Returned to yard at ${past.id} completion` });
  }
  if (a.status === "Allocated") {
    history.push({ asset_id: a.id, on: a.allocated_on, kind: "Allocated", note: `Allocated to ${a.job_id} — ${jobs.find((j) => j.id === a.job_id).name}` });
  }
});
history.sort((x, y) => x.on.localeCompare(y.on));

/* ---------- maintenance ---------- */
const faults = [
  "Hydraulic hose weeping at boom ram", "Track tension slack beyond limits",
  "Charging fault — alternator output low", "Cut depth guard cracked",
  "Coolant leak at water pump", "Deadman trigger intermittent",
  "Mast chain stretch at limit", "Engine hunting under load",
  "Slew ring play above tolerance", "Fuel line perished at tank union",
  "Emergency stop fails to latch", "Platform gate spring broken",
];
let mrN = 0;
function mr(asset_id, status, offsetDays, cost, reporter_id, extra = {}) {
  mrN += 1;
  return {
    id: `MR-${140 + mrN}`, asset_id, status, reported: daysAgo(offsetDays),
    fault: faults[mrN % faults.length], est_cost: cost, reporter_id,
    mechanic_id: null, approved_on: null, workshop_on: null, resolved_on: null,
    rejected_on: null, reject_note: null, overdue: false, ...extra,
  };
}
const maintenance = [
  mr(WORKSHOP_IDS[0], "In workshop", 21, 290000, "E-102", { approved_on: daysAgo(18), workshop_on: daysAgo(15), mechanic_id: "E-120" }),
  mr(WORKSHOP_IDS[1], "In workshop", 13, 158000, "E-103", { approved_on: daysAgo(11), workshop_on: daysAgo(9), mechanic_id: "E-121" }),
  mr(WORKSHOP_IDS[2], "In workshop", 9, 65000, "E-105", { approved_on: daysAgo(7), workshop_on: daysAgo(6), mechanic_id: "E-122" }),
  mr(WORKSHOP_IDS[3], "In workshop", 30, 442000, "E-104", { approved_on: daysAgo(27), workshop_on: daysAgo(24), mechanic_id: "E-120", overdue: true }),
  mr(WORKSHOP_IDS[4], "Approved", 6, 196000, "E-102", { approved_on: daysAgo(3) }),
  mr(WORKSHOP_IDS[5], "Approved", 4, 84000, "E-103", { approved_on: daysAgo(1) }),
  mr(WORKSHOP_IDS[6], "Reported", 2, 123000, "E-105"),
  mr("AST-0105", "Reported", 1, 54000, "E-102"),
  mr("AST-0117", "Reported", 5, 262000, "E-104", { overdue: true }),
  mr("AST-0122", "Resolved", 64, 101000, "E-103", { approved_on: daysAgo(60), workshop_on: daysAgo(58), resolved_on: daysAgo(49), mechanic_id: "E-121" }),
  mr("AST-0131", "Resolved", 41, 233000, "E-105", { approved_on: daysAgo(38), workshop_on: daysAgo(35), resolved_on: daysAgo(30), mechanic_id: "E-122" }),
  mr("AST-0140", "Resolved", 25, 36000, "E-102", { approved_on: daysAgo(24), workshop_on: daysAgo(22), resolved_on: daysAgo(20), mechanic_id: "E-120" }),
  mr("AST-0126", "Rejected", 33, 710000, "E-104", { rejected_on: daysAgo(29), reject_note: "Repair exceeds 60% of replacement value — schedule for disposal review instead" }),
  mr("AST-0148", "Rejected", 12, 45000, "E-103", { rejected_on: daysAgo(10), reject_note: "Duplicate of MR-151 raised the same week" }),
];

/* ---------- payments ---------- */
const payees = [
  "Gmmco Ltd — CAT parts", "Sanghvi Movers — cross-hire", "Deccan Sand & Aggregates",
  "TIL Ltd — parts counter", "Powerica generator service", "HP Fuels — bulk diesel",
  "Pune Crane Services", "SafeZone Traffic Management",
];
let pN = 0;
function pay(job_id, payee, description, amount, status, issuedDaysAgo, dueDaysFromIssue, extra = {}) {
  pN += 1;
  const issued = daysAgo(issuedDaysAgo);
  const due = new Date(new Date(issued).getTime() + dueDaysFromIssue * 864e5).toISOString().slice(0, 10);
  return {
    id: `INV-26${String(400 + pN * 7)}`, job_id, payee, description, amount, status, issued, due,
    paid_on: null, voided_on: null, dispute_note: null, ...extra,
  };
}
const payments = [
  pay("JOB-24-011", payees[0], "PC210 undercarriage rebuild — parts", 1040000, "Paid", 88, 30, { paid_on: daysAgo(55) }),
  pay("JOB-24-011", payees[1], "Cross-hired 20 t roller, 6 weeks", 820000, "Overdue", 71, 30),
  pay("JOB-24-014", payees[2], "Structural backfill, 340 t", 1360000, "Paid", 62, 30, { paid_on: daysAgo(28) }),
  pay("JOB-24-014", payees[7], "Lane closure crew, deck pours 4–6", 1810000, "Pending", 18, 45),
  pay("JOB-24-017", payees[4], "Telehandler 500 h service", 325000, "Paid", 47, 30, { paid_on: daysAgo(12) }),
  pay("JOB-24-017", payees[6], "Mobile crane, truss lift day rate", 630000, "Disputed", 39, 30, { dispute_note: "Standby hours billed at working rate — contested 12 Jun 2026" }),
  pay("JOB-25-002", payees[5], "Bulk diesel, Q2 top-up", 960000, "Paid", 51, 14, { paid_on: daysAgo(40) }),
  pay("JOB-25-002", payees[3], "Trench shield seal kits", 168000, "Pending", 9, 30),
  pay("JOB-25-005", payees[1], "Cross-hired piling rig attachments", 1590000, "Overdue", 64, 30),
  pay("JOB-25-005", payees[2], "Shotcrete aggregate, 90 t", 552000, "Paid", 33, 30, { paid_on: daysAgo(5) }),
  pay("JOB-25-008", payees[5], "Bulk diesel, airside bowser", 1180000, "Pending", 12, 30),
  pay("JOB-25-008", payees[0], "Generator load-bank test", 183000, "Paid", 29, 14, { paid_on: daysAgo(16) }),
  pay("JOB-25-011", payees[3], "Breaker steels and retainers", 76000, "Pending", 6, 30),
  pay("JOB-25-011", payees[6], "Wall panel lift sequence", 478000, "Overdue", 49, 30),
];

/* ---------- accounts ---------- */
const ACCOUNTS = [
  { email: "rajendra@plinthops.in", name: "Rajendra Palekar", role: "OWNER", employee_id: "E-001" },
  { email: "priya@plinthops.in", name: "Priya Nair", role: "SITE_ENGINEER", employee_id: "E-102" },
];
async function ensureUser({ email, name, role, employee_id }) {
  const { error } = await admin.auth.admin.createUser({
    email, password: "demo1234", email_confirm: true,
    user_metadata: { name, role, employee_id },
  });
  if (error && !/already|exists|registered/i.test(error.message)) throw error;
}

/* ---------- run ---------- */
async function main() {
  console.log("Clearing the register…");
  // DELETE (not TRUNCATE) so the profiles.employee_id FK degrades to NULL
  // instead of cascade-truncating the profiles table.
  await sql`DELETE FROM asset_history`;
  await sql`DELETE FROM maintenance`;
  await sql`DELETE FROM payments`;
  await sql`DELETE FROM assets`;
  await sql`UPDATE employees SET job_id = NULL`;
  await sql`DELETE FROM jobs`;
  await sql`DELETE FROM employees`;

  console.log(`Inserting ${employees.length} employees, ${jobs.length} jobs, ${assets.length} assets…`);
  // employees first without job_id (jobs not in yet), then jobs, then backfill job_id
  await sql`INSERT INTO employees ${sql(employees.map((e) => ({ ...e, job_id: null })))}`;
  await sql`INSERT INTO jobs ${sql(jobs.map((j) => ({ hold_note: null, ...j })))}`;
  for (const e of employees) {
    if (e.job_id) await sql`UPDATE employees SET job_id = ${e.job_id} WHERE id = ${e.id}`;
  }
  await sql`INSERT INTO assets ${sql(assets)}`;
  await sql`INSERT INTO asset_history ${sql(history)}`;
  await sql`INSERT INTO maintenance ${sql(maintenance)}`;
  await sql`INSERT INTO payments ${sql(payments)}`;

  console.log("Creating demo accounts…");
  for (const acc of ACCOUNTS) await ensureUser(acc);
  for (const acc of ACCOUNTS) {
    // Upsert the profile directly — the signup trigger only fires for brand-new
    // users, so an existing demo account needs its profile (re)written here.
    await sql`
      INSERT INTO profiles (id, name, role, employee_id)
      SELECT id, ${acc.name}, ${acc.role}, ${acc.employee_id}
      FROM auth.users WHERE email = ${acc.email}
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name, role = EXCLUDED.role, employee_id = EXCLUDED.employee_id`;
  }

  console.log("\nDone. Sign in with rajendra@plinthops.in / demo1234 (Owner) or priya@plinthops.in / demo1234 (Site Engineer).");
  await sql.end();
}
main().catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
