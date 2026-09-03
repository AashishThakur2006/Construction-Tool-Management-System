/**
 * Demo data seeder.
 *
 *   npm run seed
 *
 * Wipes the domain tables (NOT auth users) and inserts a small, internally
 * consistent dataset, plus two demo accounts:
 *   owner@ctms.demo    / demo1234   (Owner)
 *   engineer@ctms.demo / demo1234   (Site Engineer)
 */
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const { DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } =
  process.env;

if (!DATABASE_URL || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing env. Need DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (see .env.local)."
  );
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });
const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  { email: "owner@ctms.demo", name: "Priya Sharma", role: "OWNER" },
  { email: "engineer@ctms.demo", name: "Arjun Mehta", role: "SITE_ENGINEER" },
];

async function ensureUser({ email, name, role }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "demo1234",
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error && !/already|exists|registered/i.test(error.message)) throw error;
  if (data?.user) return data.user.id;

  // Already existed — find it.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list.users.find((u) => u.email === email);
  if (!found) throw new Error(`Could not resolve user ${email}`);
  return found.id;
}

async function main() {
  console.log("Creating demo accounts...");
  const ownerId = await ensureUser(DEMO_USERS[0]);
  await ensureUser(DEMO_USERS[1]);
  // Make sure profiles reflect the intended names/roles.
  for (const u of DEMO_USERS) {
    await sql`
      UPDATE profiles SET name = ${u.name}, role = ${u.role}
      WHERE id = (SELECT id FROM auth.users WHERE email = ${u.email})`;
  }

  console.log("Clearing domain tables...");
  await sql`TRUNCATE
    deliveries, machine_transfers, tool_transactions, tools,
    payments, maintenance_records, machines, employees, projects
    RESTART IDENTITY CASCADE`;

  console.log("Inserting projects...");
  const projects = await sql`
    INSERT INTO projects (name, location, status, start_date, end_date, budget, progress) VALUES
      ('Riverside Apartments',  'Pune',      'ONGOING',   '2026-02-01', '2026-12-20', 48000000, 55),
      ('Metro Depot Phase 2',   'Nagpur',    'ONGOING',   '2026-04-15', '2027-03-30', 92000000, 30),
      ('Hillcrest Villas',      'Lonavala',  'PLANNED',   NULL,         NULL,         26000000, 0),
      ('City Mall Retrofit',    'Mumbai',    'ON_HOLD',   '2026-01-10', NULL,         15000000, 40),
      ('Airport Link Road',     'Pune',      'COMPLETED', '2025-06-01', '2026-05-15', 61000000, 100)
    RETURNING id, name`;
  const P = Object.fromEntries(projects.map((r) => [r.name, r.id]));

  console.log("Inserting employees...");
  const employees = await sql`
    INSERT INTO employees (name, role, phone, email, status) VALUES
      ('Ramesh Patil',   'OPERATOR',           '9820011111', 'ramesh@ctms.demo',  'ACTIVE'),
      ('Suresh Kadam',   'OPERATOR',           '9820022222', 'suresh@ctms.demo',  'ACTIVE'),
      ('Vikram Singh',   'MAINTENANCE_WORKER', '9820033333', 'vikram@ctms.demo',  'ACTIVE'),
      ('Anil Deshmukh',  'MAINTENANCE_WORKER', '9820044444', 'anil@ctms.demo',    'ACTIVE'),
      ('Meena Joshi',    'SUPERVISOR',         '9820055555', 'meena@ctms.demo',   'ACTIVE'),
      ('Farhan Qureshi', 'LABOURER',           '9820066666', 'farhan@ctms.demo',  'INACTIVE')
    RETURNING id, name`;
  const E = Object.fromEntries(employees.map((r) => [r.name, r.id]));

  console.log("Inserting machines...");
  const machines = await sql`
    INSERT INTO machines (name, type, model, status, purchase_date, project_id) VALUES
      ('Excavator EX-01',  'Excavator',    'CAT 320',       'ALLOCATED',   '2024-03-10', ${P["Riverside Apartments"]}),
      ('Excavator EX-02',  'Excavator',    'Komatsu PC210',  'ALLOCATED',   '2023-11-22', ${P["Metro Depot Phase 2"]}),
      ('Tower Crane TC-01','Crane',        'Potain MDT 219', 'ALLOCATED',   '2022-07-01', ${P["Riverside Apartments"]}),
      ('Concrete Mixer M-01','Mixer',      'Schwing SP 305', 'AVAILABLE',   '2025-01-15', NULL),
      ('Backhoe Loader B-01','Loader',     'JCB 3DX',        'MAINTENANCE', '2021-09-30', NULL),
      ('Road Roller R-01', 'Compactor',    'Bomag BW 211',   'AVAILABLE',   '2024-06-18', NULL)
    RETURNING id, name`;
  const M = Object.fromEntries(machines.map((r) => [r.name, r.id]));

  console.log("Inserting maintenance records...");
  await sql`
    INSERT INTO maintenance_records (machine_id, description, status, assigned_employee_id, raised_by, cost) VALUES
      (${M["Backhoe Loader B-01"]}, 'Hydraulic hose burst, needs replacement', 'IN_PROGRESS', ${E["Vikram Singh"]}, ${ownerId}, 18500),
      (${M["Excavator EX-02"]},     'Scheduled 500-hour service',              'PENDING',     ${E["Anil Deshmukh"]}, ${ownerId}, 12000),
      (${M["Tower Crane TC-01"]},   'Annual safety inspection',                'COMPLETED',   ${E["Vikram Singh"]}, ${ownerId}, 30000),
      (${M["Concrete Mixer M-01"]}, 'Drum bearing noise reported by operator', 'PENDING',     NULL,                 ${ownerId}, 0)`;

  console.log("Inserting payments...");
  await sql`
    INSERT INTO payments (project_id, description, amount, status, payment_date) VALUES
      (${P["Riverside Apartments"]},  'Steel supplier invoice #RS-204',     3200000, 'PAID',    '2026-05-12'),
      (${P["Riverside Apartments"]},  'Cement bulk order Q2',               1450000, 'PAID',    '2026-06-02'),
      (${P["Riverside Apartments"]},  'Electrical subcontractor milestone', 2100000, 'PENDING', NULL),
      (${P["Metro Depot Phase 2"]},   'Earthworks contractor advance',      5000000, 'PAID',    '2026-04-28'),
      (${P["Metro Depot Phase 2"]},   'Rebar shipment #MD-77',              2750000, 'PENDING', NULL),
      (${P["City Mall Retrofit"]},    'Facade glass deposit',                900000, 'PENDING', NULL),
      (${P["Airport Link Road"]},     'Final retention release',            3050000, 'PAID',    '2026-05-20')`;

  console.log("Inserting tools...");
  const tools = await sql`
    INSERT INTO tools (name, category, unit, total_quantity, available_quantity, location) VALUES
      ('Cordless Drill',        'Power tools',  'unit', 24, 9,  'Central Warehouse'),
      ('Angle Grinder',         'Power tools',  'unit', 16, 3,  'Central Warehouse'),
      ('Scaffold Frame',        'Access',       'set',  120, 48, 'Central Warehouse'),
      ('Safety Harness',        'PPE',          'unit', 60, 55, 'Central Warehouse'),
      ('Jackhammer',            'Demolition',   'unit', 8,  1,  'Central Warehouse'),
      ('Laser Level',           'Survey',       'unit', 6,  6,  'Survey Room'),
      ('Wheelbarrow',           'General',      'unit', 40, 22, 'Central Warehouse')
    RETURNING id, name`;
  const T = Object.fromEntries(tools.map((r) => [r.name, r.id]));

  console.log("Inserting tool movements...");
  await sql`
    INSERT INTO tool_transactions (tool_id, kind, quantity, project_id, employee_id, note, created_by) VALUES
      (${T["Cordless Drill"]}, 'ISSUE', 15, ${P["Riverside Apartments"]}, ${E["Meena Joshi"]}, 'Fit-out crew', ${ownerId}),
      (${T["Angle Grinder"]},  'ISSUE', 13, ${P["Metro Depot Phase 2"]},  ${E["Suresh Kadam"]}, 'Steel cutting', ${ownerId}),
      (${T["Scaffold Frame"]}, 'ISSUE', 72, ${P["Riverside Apartments"]}, ${E["Meena Joshi"]}, 'Block C elevation', ${ownerId}),
      (${T["Jackhammer"]},     'ISSUE', 7,  ${P["City Mall Retrofit"]},   ${E["Ramesh Patil"]}, 'Slab breaking', ${ownerId}),
      (${T["Wheelbarrow"]},    'ISSUE', 18, ${P["Metro Depot Phase 2"]},  NULL, 'General site use', ${ownerId}),
      (${T["Cordless Drill"]}, 'RETURN', 1, NULL, ${E["Meena Joshi"]}, 'One returned faulty', ${ownerId})`;

  console.log("Inserting deliveries...");
  await sql`
    INSERT INTO deliveries (reference, direction, project_id, carrier, item_summary, status, scheduled_date, delivered_date) VALUES
      ('DLV-1001', 'INBOUND',  ${P["Riverside Apartments"]}, 'BlueDart Freight', '400 bags cement, 2t rebar',        'DELIVERED',  '2026-06-01', '2026-06-02'),
      ('DLV-1002', 'INBOUND',  ${P["Metro Depot Phase 2"]},  'VRL Logistics',    'Precast beams x12',                'IN_TRANSIT', '2026-07-18', NULL),
      ('DLV-1003', 'OUTBOUND', ${P["City Mall Retrofit"]},   'Own fleet',        'Return unused scaffold to depot',  'SCHEDULED',  '2026-07-25', NULL),
      ('DLV-1004', 'INBOUND',  ${P["Hillcrest Villas"]},     'Safexpress',       'Survey equipment + site office',   'SCHEDULED',  '2026-08-05', NULL),
      ('DLV-1005', 'INBOUND',  ${P["Riverside Apartments"]}, 'TCI Freight',      'Electrical conduit + fittings',    'CANCELLED',  '2026-06-20', NULL)`;

  console.log("\nDone. Sign in with owner@ctms.demo / demo1234 (or engineer@ctms.demo).");
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
