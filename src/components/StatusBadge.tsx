const COLORS: Record<string, string> = {
  // projects
  PLANNED: "bg-slate-100 text-slate-700",
  ONGOING: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  ON_HOLD: "bg-amber-100 text-amber-800",
  // machines
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  ALLOCATED: "bg-sky-100 text-sky-800",
  MAINTENANCE: "bg-rose-100 text-rose-800",
  // maintenance
  PENDING: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  // payments / employees
  PAID: "bg-emerald-100 text-emerald-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-slate-100 text-slate-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        COLORS[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
