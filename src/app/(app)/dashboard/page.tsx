import Link from "next/link";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function count(table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as {
    c: number;
  };
  return row.c;
}

export default async function DashboardPage() {
  const session = await getSession();

  const stats = [
    { label: "Total Projects", value: count("projects"), icon: "🏗️", href: "/projects", accent: "border-amber-500" },
    { label: "Total Machines", value: count("machines"), icon: "🚜", href: "/machines", accent: "border-sky-500" },
    { label: "Total Employees", value: count("employees"), icon: "👷", href: "/employees", accent: "border-emerald-500" },
    { label: "Maintenance Records", value: count("maintenance_records"), icon: "🔧", href: "/maintenance", accent: "border-rose-500" },
    { label: "Total Payments", value: count("payments"), icon: "💰", href: "/payments", accent: "border-violet-500" },
  ];

  const ongoingProjects = db
    .prepare(
      "SELECT id, name, location, status, progress FROM projects WHERE status = 'ONGOING' ORDER BY created_at DESC LIMIT 5"
    )
    .all() as {
    id: number;
    name: string;
    location: string;
    status: string;
    progress: number;
  }[];

  const pendingMaintenance = db
    .prepare(
      `SELECT mr.id, mr.description, mr.status, m.name AS machine_name
       FROM maintenance_records mr
       JOIN machines m ON m.id = mr.machine_id
       WHERE mr.status != 'COMPLETED'
       ORDER BY mr.created_at DESC LIMIT 5`
    )
    .all() as {
    id: number;
    description: string;
    status: string;
    machine_name: string;
  }[];

  const pendingPayments = db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'PENDING'")
    .get() as { total: number };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back, {session?.name}. Here is an overview of your operations.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-xl border-l-4 ${s.accent} bg-white p-5 shadow-sm transition hover:shadow-md`}
          >
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Ongoing Projects</h2>
          {ongoingProjects.length === 0 ? (
            <p className="text-sm text-slate-500">No ongoing projects.</p>
          ) : (
            <ul className="space-y-3">
              {ongoingProjects.map((p) => (
                <li key={p.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-slate-500">{p.progress}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-amber-500"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Open Maintenance Requests</h2>
          {pendingMaintenance.length === 0 ? (
            <p className="text-sm text-slate-500">No open maintenance requests.</p>
          ) : (
            <ul className="space-y-3">
              {pendingMaintenance.map((mr) => (
                <li
                  key={mr.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="font-medium">{mr.machine_name}</div>
                    <div className="text-slate-500">{mr.description}</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      mr.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {mr.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
            <span className="text-slate-500">Pending payments total: </span>
            <span className="font-semibold">
              ₹{pendingPayments.total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
