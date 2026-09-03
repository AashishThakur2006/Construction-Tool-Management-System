"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

export type Tool = {
  id: number;
  name: string;
  category: string;
  unit: string;
  total_quantity: number;
  available_quantity: number;
  location: string;
};

type Option = { id: number; name: string };
type Transaction = {
  id: number;
  tool_id: number;
  kind: string;
  quantity: number;
  note: string;
  created_at: string;
  tool_name: string;
  project_name: string | null;
  employee_name: string | null;
};

const EMPTY = {
  name: "",
  category: "",
  unit: "unit",
  total_quantity: "0",
  location: "WAREHOUSE",
};

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

export default function ToolsClient({
  tools,
  projects,
  employees,
  transactions,
  role,
}: {
  tools: Tool[];
  projects: Option[];
  employees: Option[];
  transactions: Transaction[];
  role: string;
}) {
  const router = useRouter();
  const isOwner = role === "OWNER";
  const [modal, setModal] = useState<"add" | "edit" | "move" | null>(null);
  const [selected, setSelected] = useState<Tool | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [move, setMove] = useState({
    kind: "ISSUE",
    quantity: "1",
    project_id: "",
    employee_id: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setForm(EMPTY);
    setError("");
    setModal("add");
  }

  function openEdit(t: Tool) {
    setSelected(t);
    setForm({
      name: t.name,
      category: t.category,
      unit: t.unit,
      total_quantity: String(t.total_quantity),
      location: t.location,
    });
    setError("");
    setModal("edit");
  }

  function openMove(t: Tool, kind: "ISSUE" | "RETURN") {
    setSelected(t);
    setMove({ kind, quantity: "1", project_id: "", employee_id: "", note: "" });
    setError("");
    setModal("move");
  }

  async function saveTool(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = modal === "add" ? "/api/tools" : `/api/tools/${selected!.id}`;
    const res = await fetch(url, {
      method: modal === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setModal(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save tool");
    }
  }

  async function submitMove(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/tools/${selected!.id}/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(move),
    });
    setSaving(false);
    if (res.ok) {
      setModal(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to record movement");
    }
  }

  async function remove(t: Tool) {
    if (!confirm(`Delete tool "${t.name}"?`)) return;
    const res = await fetch(`/api/tools/${t.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete tool");
    }
  }

  return (
    <div className="space-y-8">
      {isOwner && (
        <div>
          <button
            onClick={openAdd}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            + Add Tool
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tool</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tools.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No tools found.
                </td>
              </tr>
            )}
            {tools.map((t) => {
              const ratio =
                t.total_quantity > 0
                  ? t.available_quantity / t.total_quantity
                  : 1;
              const low = t.total_quantity > 0 && ratio < 0.2;
              return (
                <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.category || "—"}</td>
                  <td className="px-4 py-3">{t.location}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${low ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${low ? "text-rose-600" : "text-slate-500"}`}>
                        {t.available_quantity} / {t.total_quantity} {t.unit}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => openMove(t, "ISSUE")}
                      className="mr-2 text-emerald-600 hover:underline"
                    >
                      Issue
                    </button>
                    <button
                      onClick={() => openMove(t, "RETURN")}
                      className="mr-2 text-sky-600 hover:underline"
                    >
                      Return
                    </button>
                    {isOwner && (
                      <>
                        <button
                          onClick={() => openEdit(t)}
                          className="mr-2 text-slate-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(t)}
                          className="text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Recent movements</h2>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Movement</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Site / Worker</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No movements recorded yet.
                  </td>
                </tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{tx.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium">{tx.tool_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        tx.kind === "ISSUE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {tx.kind === "ISSUE" ? "Issued" : "Returned"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{tx.quantity}</td>
                  <td className="px-4 py-3">
                    {tx.project_name || tx.employee_name || "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                    {tx.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "add" ? "Add Tool" : "Edit Tool"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveTool} className="space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Cordless drill"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                  placeholder="Power tools"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Unit</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className={inputClass}
                  placeholder="unit / box / m"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Total quantity
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.total_quantity}
                  onChange={(e) =>
                    setForm({ ...form, total_quantity: e.target.value })
                  }
                  className={inputClass}
                />
                {modal === "edit" && (
                  <p className="mt-1 text-xs text-slate-400">
                    Available stock shifts with this change.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={inputClass}
                />
              </div>
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
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "move" && selected && (
        <Modal
          title={`${move.kind === "ISSUE" ? "Issue" : "Return"} — ${selected.name}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={submitMove} className="space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <p className="text-sm text-slate-500">
              {selected.available_quantity} {selected.unit} currently available.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium">Quantity *</label>
              <input
                type="number"
                required
                min={1}
                value={move.quantity}
                onChange={(e) => setMove({ ...move, quantity: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Project</label>
                <select
                  value={move.project_id}
                  onChange={(e) =>
                    setMove({ ...move, project_id: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">— None —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Worker</label>
                <select
                  value={move.employee_id}
                  onChange={(e) =>
                    setMove({ ...move, employee_id: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">— None —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Note</label>
              <input
                value={move.note}
                onChange={(e) => setMove({ ...move, note: e.target.value })}
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
                  : move.kind === "ISSUE"
                    ? "Issue tool"
                    : "Return tool"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
