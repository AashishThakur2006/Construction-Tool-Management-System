import Link from "next/link";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  const [
    [counts],
    ongoingProjects,
    pendingMaintenance,
    [pendingPayments],
    lowStockTools,
    [deliveryStats],
  ] = await Promise.all([
    sql`SELECT
          (SELECT COUNT(*) FROM projects)             AS projects,
          (SELECT COUNT(*) FROM machines)             AS machines,
          (SELECT COUNT(*) FROM employees)            AS employees,
          (SELECT COUNT(*) FROM maintenance_records)  AS maintenance,
          (SELECT COUNT(*) FROM payments)             AS payments,
          (SELECT COUNT(*) FROM tools)                AS tools,
          (SELECT COUNT(*) FROM deliveries)           AS deliveries`,
    sql`SELECT id, name, location, status, progress FROM projects
        WHERE status = 'ONGOING' ORDER BY created_at DESC LIMIT 5`,
    sql`SELECT mr.id, mr.description, mr.status, m.name AS machine_name
        FROM maintenance_records mr JOIN machines m ON m.id = mr.machine_id
        WHERE mr.status != 'COMPLETED' ORDER BY mr.created_at DESC LIMIT 5`,
    sql`SELECT COALESCE(SUM(amount), 0)::float8 AS total FROM payments WHERE status = 'PENDING'`,
    sql`SELECT id, name, available_quantity, total_quantity, unit FROM tools
        WHERE total_quantity > 0 AND available_quantity::float8 / total_quantity < 0.2
        ORDER BY available_quantity::float8 / total_quantity ASC LIMIT 5`,
    sql`SELECT
          COUNT(*) FILTER (WHERE status = 'SCHEDULED')   AS scheduled,
          COUNT(*) FILTER (WHERE status = 'IN_TRANSIT')  AS in_transit
        FROM deliveries`,
  ]);

  const stats = [
    { label: "Projects", value: counts.projects, icon: "🏗️", href: "/projects", accent: "border-amber-500" },
    { label: "Machines", value: counts.machines, icon: "🚜", href: "/machines", accent: "border-sky-500" },
    { label: "Tools", value: counts.tools, icon: "🧰", href: "/tools", accent: "border-teal-500" },
    { label: "Employees", value: counts.employees, icon: "👷", href: "/employees", accent: "border-emerald-500" },
    { label: "Maintenance", value: counts.maintenance, icon: "🔧", href: "/maintenance", accent: "border-rose-500" },
    { label: "Deliveries", value: counts.deliveries, icon: "🚚", href: "/deliveries", accent: "border-indigo-500" },
    { label: "Payments", value: counts.payments, icon: "💰", href: "/payments", accent: "border-violet-500" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back, {session?.name}. Here is an overview of your operations.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${p.progress}%` }} />
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
                <li key={mr.id} className="flex items-center justify-between text-sm">
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
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Low Tool Stock</h2>
          {lowStockTools.length === 0 ? (
            <p className="text-sm text-slate-500">All tools well stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStockTools.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-rose-600">
                    {t.available_quantity} / {t.total_quantity} {t.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Logistics &amp; Finance</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Deliveries scheduled</dt>
              <dd className="font-semibold">{deliveryStats.scheduled}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Deliveries in transit</dt>
              <dd className="font-semibold">{deliveryStats.in_transit}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="text-slate-500">Pending payments total</dt>
              <dd className="font-semibold">
                ₹{pendingPayments.total.toLocaleString("en-IN")}
              </dd>
            </div>
          </dl>
          <Link href="/reports" className="mt-4 inline-block text-sm font-medium text-amber-700 hover:underline">
            View full reports →
          </Link>
        </div>
      </div>
    </div>
  );
}
