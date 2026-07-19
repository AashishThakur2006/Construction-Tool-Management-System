"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";

export type Machine = {
  id: number;
  name: string;
  type: string;
  model: string;
  status: string;
  purchase_date: string | null;
  project_id: number | null;
  project_name: string | null;
};

type ProjectOption = { id: number; name: string };

const EMPTY = { name: "", type: "", model: "", purchase_date: "" };

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

export default function MachinesClient({
  machines,
  projects,
  role,
}: {
  machines: Machine[];
  projects: ProjectOption[];
  role: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"add" | "edit" | "allocate" | null>(null);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [allocateProject, setAllocateProject] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isOwner = role === "OWNER";

  function openAdd() {
    setForm(EMPTY);
    setError("");
    setModal("add");
  }

  function openEdit(m: Machine) {
    setSelected(m);
    setForm({
      name: m.name,
      type: m.type,
      model: m.model,
      purchase_date: m.purchase_date ?? "",
    });
    setError("");
    setModal("edit");
  }

  function openAllocate(m: Machine) {
    setSelected(m);
    setAllocateProject(m.project_id ? String(m.project_id) : "");
    setError("");
    setModal("allocate");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = modal === "add" ? "/api/machines" : `/api/machines/${selected!.id}`;
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
      setError(data.error ?? "Failed to save machine");
    }
  }

  async function allocate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/machines/${selected!.id}/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: allocateProject || null }),
    });
    setSaving(false);
    if (res.ok) {
      setModal(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to allocate machine");
    }
  }

  async function remove(m: Machine) {
    if (!confirm(`Delete machine "${m.name}"?`)) return;
    const res = await fetch(`/api/machines/${m.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete machine");
    }
  }

  return (
    <div>
      {isOwner && (
        <div className="mb-4">
          <button
            onClick={openAdd}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            + Register Machine
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Allocated Project</th>
              <th className="px-4 py-3">Purchased</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {machines.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No machines found.
                </td>
              </tr>
            )}
            {machines.map((m) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3">{m.type || "—"}</td>
                <td className="px-4 py-3">{m.model || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3">{m.project_name ?? "—"}</td>
                <td className="px-4 py-3">{m.purchase_date ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => openAllocate(m)}
                    className="mr-2 text-emerald-600 hover:underline"
                  >
                    Allocate
                  </button>
                  <button
                    onClick={() => openEdit(m)}
                    className="mr-2 text-sky-600 hover:underline"
                  >
                    Edit
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => remove(m)}
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

      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "add" ? "Register Machine" : "Edit Machine"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={save} className="space-y-4">
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
                placeholder="Excavator 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <input
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={inputClass}
                  placeholder="Excavator"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Model</label>
                <input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className={inputClass}
                  placeholder="CAT 320"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Purchase date
              </label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) =>
                  setForm({ ...form, purchase_date: e.target.value })
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

      {modal === "allocate" && selected && (
        <Modal
          title={`Allocate "${selected.name}"`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={allocate} className="space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Project</label>
              <select
                value={allocateProject}
                onChange={(e) => setAllocateProject(e.target.value)}
                className={inputClass}
              >
                <option value="">— Not allocated (available) —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Selecting a project marks the machine as ALLOCATED. Choosing
                &quot;Not allocated&quot; releases it back to AVAILABLE.
              </p>
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
                {saving ? "Saving..." : "Save allocation"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
