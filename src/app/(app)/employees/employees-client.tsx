"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";

export type Employee = {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
};

const ROLE_LABELS: Record<string, string> = {
  OPERATOR: "Operator",
  MAINTENANCE_WORKER: "Maintenance Worker",
  SUPERVISOR: "Supervisor",
  LABOURER: "Labourer",
};

const EMPTY = {
  name: "",
  role: "OPERATOR",
  phone: "",
  email: "",
  status: "ACTIVE",
};

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

export default function EmployeesClient({
  employees,
  role,
}: {
  employees: Employee[];
  role: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isOwner = role === "OWNER";

  function openAdd() {
    setForm(EMPTY);
    setError("");
    setModal("add");
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      name: emp.name,
      role: emp.role,
      phone: emp.phone,
      email: emp.email,
      status: emp.status,
    });
    setError("");
    setModal("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url =
      modal === "add" ? "/api/employees" : `/api/employees/${editing!.id}`;
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
      setError(data.error ?? "Failed to save employee");
    }
  }

  async function remove(emp: Employee) {
    if (!confirm(`Delete employee "${emp.name}"?`)) return;
    const res = await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete employee");
    }
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={openAdd}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + Add Employee
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No employees found.
                </td>
              </tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{emp.name}</td>
                <td className="px-4 py-3">{ROLE_LABELS[emp.role] ?? emp.role}</td>
                <td className="px-4 py-3">{emp.phone || "—"}</td>
                <td className="px-4 py-3">{emp.email || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={emp.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => openEdit(emp)}
                    className="mr-2 text-sky-600 hover:underline"
                  >
                    Edit
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => remove(emp)}
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
          title={modal === "add" ? "Add Employee" : "Edit Employee"}
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputClass}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
    </div>
  );
}
