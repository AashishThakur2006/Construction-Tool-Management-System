import sql from "@/lib/db";
import { budgetUsagePct } from "@/lib/validation";

export const dynamic = "force-dynamic";

type ProjectFinance = {
  id: number;
  name: string;
  status: string;
  budget: number;
  paid: number;
  pending: number;
  maintenance_cost: number;
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default async function ReportsPage() {
  const projectFinance = (await sql`
    SELECT p.id, p.name, p.status, p.budget::float8 AS budget,
           COALESCE(pay.paid, 0)::float8    AS paid,
           COALESCE(pay.pending, 0)::float8 AS pending,
           COALESCE(mx.cost, 0)::float8     AS maintenance_cost
    FROM projects p
    LEFT JOIN (
      SELECT project_id,
             SUM(amount) FILTER (WHERE status = 'PAID')    AS paid,
             SUM(amount) FILTER (WHERE status = 'PENDING') AS pending
      FROM payments GROUP BY project_id
    ) pay ON pay.project_id = p.id
    LEFT JOIN (
      SELECT m.project_id, SUM(mr.cost) AS cost
      FROM maintenance_records mr JOIN machines m ON m.id = mr.machine_id
      GROUP BY m.project_id
    ) mx ON mx.project_id = p.id
    ORDER BY p.budget DESC`) as unknown as ProjectFinance[];

  const [machineUtil] = (await sql`
    SELECT
      COUNT(*)                                          AS total,
      COUNT(*) FILTER (WHERE status = 'ALLOCATED')      AS allocated,
      COUNT(*) FILTER (WHERE status = 'AVAILABLE')      AS available,
      COUNT(*) FILTER (WHERE status = 'MAINTENANCE')    AS maintenance
    FROM machines`) as unknown as {
    total: number;
    allocated: number;
    available: number;
    maintenance: number;
  }[];

  const [maint] = (await sql`
    SELECT
      COUNT(*)                                        AS total,
      COUNT(*) FILTER (WHERE status = 'PENDING')      AS pending,
      COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')  AS in_progress,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')    AS completed,
      COALESCE(SUM(cost), 0)::float8                  AS total_cost
    FROM maintenance_records`) as unknown as {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    total_cost: number;
  }[];

  const lowStock = (await sql`
    SELECT id, name, available_quantity, total_quantity, unit
    FROM tools
    WHERE total_quantity > 0 AND available_quantity::float8 / total_quantity < 0.2
    ORDER BY available_quantity::float8 / total_quantity ASC`) as unknown as {
    id: number;
    name: string;
    available_quantity: number;
    total_quantity: number;
    unit: string;
  }[];

  const deliveriesByStatus = (await sql`
    SELECT status, COUNT(*) AS count
    FROM deliveries GROUP BY status ORDER BY status`) as unknown as {
    status: string;
    count: number;
  }[];

  const monthlyPayments = (await sql`
    SELECT to_char(date_trunc('month', COALESCE(payment_date, created_at::date)), 'YYYY-MM') AS month,
           SUM(amount)::float8 AS total
    FROM payments
    GROUP BY 1 ORDER BY 1 DESC LIMIT 6`) as unknown as {
    month: string;
    total: number;
  }[];

  const utilPct =
    machineUtil.total > 0
      ? Math.round((machineUtil.allocated / machineUtil.total) * 100)
      : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-slate-500">
          Cross-module summaries of finance, equipment, maintenance and logistics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Machine utilisation">
          <div className="mb-3 text-3xl font-bold">{utilPct}%</div>
          <p className="mb-4 text-sm text-slate-500">
            {machineUtil.allocated} of {machineUtil.total} machines allocated to a
            project.
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Available</dt>
              <dd className="font-medium">{machineUtil.available}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Allocated</dt>
              <dd className="font-medium">{machineUtil.allocated}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Under maintenance</dt>
              <dd className="font-medium">{machineUtil.maintenance}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Maintenance summary">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Open (pending)</dt>
              <dd className="font-medium">{maint.pending}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">In progress</dt>
              <dd className="font-medium">{maint.in_progress}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Completed</dt>
              <dd className="font-medium">{maint.completed}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <dt className="text-slate-500">Total maintenance spend</dt>
              <dd className="font-semibold">{inr(maint.total_cost)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Deliveries by status">
          {deliveriesByStatus.length === 0 ? (
            <p className="text-sm text-slate-500">No deliveries recorded.</p>
          ) : (
            <dl className="space-y-2 text-sm">
              {deliveriesByStatus.map((d) => (
                <div key={d.status} className="flex justify-between">
                  <dt className="text-slate-500">{d.status.replace("_", " ")}</dt>
                  <dd className="font-medium">{d.count}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card title="Low tool stock">
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">All tools above 20% stock.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((t) => (
                <li key={t.id} className="flex justify-between">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-rose-600">
                    {t.available_quantity} / {t.total_quantity} {t.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Payments — last 6 months">
          {monthlyPayments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments recorded.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {monthlyPayments.map((m) => (
                <li key={m.month} className="flex justify-between">
                  <span className="text-slate-500">{m.month}</span>
                  <span className="font-medium">{inr(m.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Project budget vs. spend">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Maint. cost</th>
                  <th className="px-4 py-3">Budget used</th>
                </tr>
              </thead>
              <tbody>
                {projectFinance.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No projects yet.
                    </td>
                  </tr>
                )}
                {projectFinance.map((p) => {
                  const committed = p.paid + p.pending + p.maintenance_cost;
                  const pct = budgetUsagePct(committed, p.budget);
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.status.replace("_", " ")}</td>
                      <td className="px-4 py-3">{inr(p.budget)}</td>
                      <td className="px-4 py-3">{inr(p.paid)}</td>
                      <td className="px-4 py-3">{inr(p.pending)}</td>
                      <td className="px-4 py-3">{inr(p.maintenance_cost)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            pct > 100
                              ? "font-semibold text-rose-600"
                              : pct > 85
                                ? "font-semibold text-amber-600"
                                : "text-slate-600"
                          }
                        >
                          {p.budget > 0 ? `${pct}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
