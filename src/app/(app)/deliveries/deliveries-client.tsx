"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

export type Delivery = {
  id: number;
  reference: string;
  direction: string;
  project_id: number | null;
  carrier: string;
  item_summary: string;
  status: string;
  scheduled_date: string | null;
  delivered_date: string | null;
  project_name: string | null;
};

type Option = { id: number; name: string };

const EMPTY = {
  reference: "",
  direction: "INBOUND",
  project_id: "",
  carrier: "",
  item_summary: "",
  status: "SCHEDULED",
  scheduled_date: "",
  delivered_date: "",
};

const STATUS_STYLE: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-700",
  IN_TRANSIT: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

export default function DeliveriesClient({
  deliveries,
  projects,
  role,
}: {
  deliveries: Delivery[];
  projects: Option[];
  role: string;
}) {
  const router = useRouter();
  const isOwner = role === "OWNER";
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setForm(EMPTY);
    setError("");
    setModal("add");
  }

  function openEdit(d: Delivery) {
    setEditing(d);
    setForm({
      reference: d.reference,
      direction: d.direction,
      project_id: d.project_id ? String(d.project_id) : "",
      carrier: d.carrier,
      item_summary: d.item_summary,
      status: d.status,
      scheduled_date: d.scheduled_date ?? "",
      delivered_date: d.delivered_date ?? "",
    });
    setError("");
    setModal("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url =
      modal === "add" ? "/api/deliveries" : `/api/deliveries/${editing!.id}`;
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
      setError(data.error ?? "Failed to save delivery");
    }
  }

  async function remove(d: Delivery) {
    if (!confirm(`Delete delivery "${d.item_summary}"?`)) return;
    const res = await fetch(`/api/deliveries/${d.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete delivery");
    }
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={openAdd}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + Schedule Delivery
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No deliveries found.
                </td>
              </tr>
            )}
            {deliveries.map((d) => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{d.reference || "—"}</td>
                <td className="px-4 py-3">
                  {d.direction === "INBOUND" ? "Inbound" : "Outbound"}
                </td>
                <td className="max-w-xs truncate px-4 py-3">{d.item_summary}</td>
                <td className="px-4 py-3">{d.project_name ?? "—"}</td>
                <td className="px-4 py-3">{d.carrier || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLE[d.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {d.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">{d.scheduled_date ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => openEdit(d)}
                    className="mr-2 text-sky-600 hover:underline"
                  >
                    Edit
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => remove(d)}
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
          title={modal === "add" ? "Schedule Delivery" : "Edit Delivery"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={save} className="space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Reference
                </label>
                <input
                  value={form.reference}
                  onChange={(e) =>
                    setForm({ ...form, reference: e.target.value })
                  }
                  className={inputClass}
                  placeholder="DLV-0001"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Direction
                </label>
                <select
                  value={form.direction}
                  onChange={(e) =>
                    setForm({ ...form, direction: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="INBOUND">Inbound</option>
                  <option value="OUTBOUND">Outbound</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Items *</label>
              <input
                required
                value={form.item_summary}
                onChange={(e) =>
                  setForm({ ...form, item_summary: e.target.value })
                }
                className={inputClass}
                placeholder="20 bags cement, 5 steel bars"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Project</label>
                <select
                  value={form.project_id}
                  onChange={(e) =>
                    setForm({ ...form, project_id: e.target.value })
                  }
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
              <div>
                <label className="mb-1 block text-sm font-medium">Carrier</label>
                <input
                  value={form.carrier}
                  onChange={(e) => setForm({ ...form, carrier: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_TRANSIT">In transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Scheduled date
                </label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_date: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            {form.status === "DELIVERED" && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Delivered date
                </label>
                <input
                  type="date"
                  value={form.delivered_date}
                  onChange={(e) =>
                    setForm({ ...form, delivered_date: e.target.value })
                  }
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Defaults to today if left blank.
                </p>
              </div>
            )}
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
