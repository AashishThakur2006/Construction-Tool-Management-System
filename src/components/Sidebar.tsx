"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/projects", label: "Projects", icon: "🏗️" },
  { href: "/machines", label: "Machines", icon: "🚜" },
  { href: "/maintenance", label: "Maintenance", icon: "🔧" },
  { href: "/employees", label: "Employees", icon: "👷" },
  { href: "/payments", label: "Payments", icon: "💰" },
];

export default function Sidebar({
  user,
}: {
  user: { name: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900 text-slate-200">
      <div className="border-b border-slate-700 px-6 py-5">
        <div className="text-lg font-bold text-white">🏗️ CTMS</div>
        <div className="text-xs text-slate-400">
          Construction Tool Management
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-amber-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-700 px-4 py-4">
        <div className="mb-3 px-2">
          <div className="truncate text-sm font-medium text-white">
            {user.name}
          </div>
          <div className="text-xs text-slate-400">
            {user.role === "OWNER" ? "Owner" : "Site Engineer"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
