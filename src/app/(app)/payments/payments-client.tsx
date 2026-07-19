"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";

export type Payment = {
  id: number;
  project_id: number | null;
  description: string;
  amount: number;
  status: string;
  payment_date: string | null;
  project_name: string | null;
};

type ProjectOption = { id: number; name: string };

const EMPTY = {
  project_id: "",
  description: "",
  amount: "",
  status: "PENDING",
  payment_date: "",
};

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

export default function PaymentsClient({
  payments,
  projects,
  role,
}: {
  payments: Payment[];
  projects: ProjectOption[];
  role: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isOwner = role === "OWNER";

  function openAdd() {
    setForm(EMPTY);
    setError("");
    setModal("add");
  }

  function openEdit(p: Payment) {
    setEditing(p);
    setForm({
      project_id: p.project_id ? String(p.project_id) : "",
      description: p.description,
      amount: String(p.amount),
      status: p.status,
      payment_date: p.payment_date ?? "",
    });
    setError("");
    setModal("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = modal === "add" ? "/api/payments" : `/api/payments/${editing!.id}`;
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
      setError(data.error ?? "Failed to save payment");
    }
  }

  async function remove(p: Payment) {
    if (!confirm(`Delete payment "${p.description}"?`)) return;
    const res = await fetch(`/api/payments/${p.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete payment");
    }
  }

  return (
    <div>
      {isOwner ? (
        <div className="mb-4">
          <button
            onClick={openAdd}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            + Add Payment
          </button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-500">
          Payments are managed by the Owner. You have monitor access.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Amount (₹)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment Date</th>
              {isOwner && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td
                  colSpan={isOwner ? 6 : 5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No payments found.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{p.description}</td>
                <td className="px-4 py-3">{p.project_name ?? "—"}</td>
                <td className="px-4 py-3">{p.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">{p.payment_date ?? "—"}</td>
                {isOwner && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-2 text-sky-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal === "add" ? "Add Payment" : "Edit Payment"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={save} className="space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Description *
              </label>
              <input
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={inputClass}
                placeholder="Cement supplier invoice #123"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Project</label>
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className={inputClass}
              >
                <option value="">— No project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Payment date
              </label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) =>
                  setForm({ ...form, payment_date: e.target.value })
                }
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
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
