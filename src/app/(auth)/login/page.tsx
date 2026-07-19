"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function devLogin(role: string) {
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Dev bypass failed");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🏗️</div>
          <h1 className="text-2xl font-bold text-white">
            Construction Tool Management
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Sign in to manage your projects and equipment
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-8 shadow-2xl"
        >
          <h2 className="mb-6 text-lg font-semibold">Login</h2>
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            placeholder="you@company.com"
          />
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            placeholder="••••••••"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <p className="mt-4 text-center text-sm text-slate-500">
            No account?{" "}
            <Link href="/register" className="font-medium text-amber-700 hover:underline">
              Register
            </Link>
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                ⚡ Dev bypass (development only)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => devLogin("OWNER")}
                  className="flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Enter as Owner
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => devLogin("SITE_ENGINEER")}
                  className="flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Enter as Site Engineer
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
