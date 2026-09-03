"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/people", label: "People" },
  { href: "/pricing", label: "Pricing" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = (href: string) =>
    (href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "page" : undefined;

  return (
    <header className="site-header">
      <div className="wrap site-header__row">
        <Link href="/" className="brand" aria-label="Plinth home">
          Plinth<span className="brand__tag">plant register</span>
        </Link>

        <nav className="nav-capsule" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)}>
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          className="menu-btn"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <div className="site-header__auth">
          <a className="btn btn--ghost btn--sm" href="/app">
            Sign in
          </a>
          <a className="btn btn--primary btn--sm" href="/app?tab=register">
            Sign up
          </a>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={current(n.href)}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
