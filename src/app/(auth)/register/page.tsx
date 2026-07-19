"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "OWNER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed");
      setLoading(false);
    }
  }

  const inputClass =
    "mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🏗️</div>
          <h1 className="text-2xl font-bold text-white">
            Construction Tool Management
          </h1>
          <p className="mt-1 text-sm text-slate-300">Create your account</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-8 shadow-2xl"
        >
          <h2 className="mb-6 text-lg font-semibold">Register</h2>
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <label className="mb-1 block text-sm font-medium">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            placeholder="John Doe"
          />
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
            placeholder="you@company.com"
          />
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className={inputClass}
            placeholder="At least 6 characters"
          />
          <label className="mb-1 block text-sm font-medium">Role</label>
          <select
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="OWNER">Owner</option>
            <option value="SITE_ENGINEER">Site Engineer</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-amber-700 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
