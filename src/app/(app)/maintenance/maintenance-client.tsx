"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";

export type MaintenanceRecord = {
  id: number;
  machine_id: number;
  description: string;
  status: string;
  assigned_employee_id: number | null;
  cost: number;
  created_at: string;
  machine_name: string;
  employee_name: string | null;
  raised_by_name: string | null;
};

type Option = { id: number; name: string };
type Worker = { id: number; name: string; role: string };

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

export default function MaintenanceClient({
  records,
  machines,
  workers,
  role,
}: {
  records: MaintenanceRecord[];
  machines: Option[];
  workers: Worker[];
  role: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"raise" | "edit" | null>(null);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState({
    machine_id: "",
    description: "",
    status: "PENDING",
    assigned_employee_id: "",
    cost: "0",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isOwner = role === "OWNER";

  function openRaise() {
    setForm({
      machine_id: "",
      description: "",
      status: "PENDING",
      assigned_employee_id: "",
      cost: "0",
    });
    setError("");
    setModal("raise");
  }

  function openEdit(r: MaintenanceRecord) {
    setEditing(r);
    setForm({
      machine_id: String(r.machine_id),
      description: r.description,
      status: r.status,
      assigned_employee_id: r.assigned_employee_id
        ? String(r.assigned_employee_id)
        : "",
      cost: String(r.cost),
    });
    setError("");
    setModal("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url =
      modal === "raise" ? "/api/maintenance" : `/api/maintenance/${editing!.id}`;
    const res = await fetch(url, {
      method: modal === "raise" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setModal(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save maintenance record");
    }
  }

  async function remove(r: MaintenanceRecord) {
    if (!confirm(`Delete this maintenance record for "${r.machine_name}"?`))
      return;
    const res = await fetch(`/api/maintenance/${r.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete record");
    }
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={openRaise}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + Raise Maintenance Request
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Machine</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned Worker</th>
              <th className="px-4 py-3">Raised By</th>
              <th className="px-4 py-3">Cost (₹)</th>
              <th className="px-4 py-3">Raised On</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No maintenance records found.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{r.machine_name}</td>
                <td className="max-w-xs truncate px-4 py-3">{r.description}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3">{r.employee_name ?? "Unassigned"}</td>
                <td className="px-4 py-3">{r.raised_by_name ?? "—"}</td>
                <td className="px-4 py-3">{r.cost.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">{r.created_at.slice(0, 10)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => openEdit(r)}
                    className="mr-2 text-sky-600 hover:underline"
                  >
                    Update
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => remove(r)}
                      className="text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={
            modal === "raise"
              ? "Raise Maintenance Request"
              : `Update Maintenance — ${editing?.machine_name}`
          }
          onClose={() => setModal(null)}
        >
          <form onSubmit={save} className="space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {modal === "raise" && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Machine *
                </label>
                <select
                  required
                  value={form.machine_id}
                  onChange={(e) =>
                    setForm({ ...form, machine_id: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">— Select machine —</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={inputClass}
                placeholder="Describe the issue..."
              />
            </div>
            {modal === "edit" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Assigned worker
                  </label>
                  <select
                    value={form.assigned_employee_id}
                    onChange={(e) =>
                      setForm({ ...form, assigned_employee_id: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">— Unassigned —</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                        {w.role === "MAINTENANCE_WORKER" ? " (Maintenance)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Cost (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : modal === "raise"
                    ? "Raise request"
                    : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
