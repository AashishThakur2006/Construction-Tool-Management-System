# Construction Tool Management System

A web-based application that helps construction companies manage projects, machines, employees, maintenance and payments through a centralized platform.

Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS** and **SQLite** (zero-setup, file-based database).

## Features

- User registration, login and logout with role-based access (Owner / Site Engineer)
- Dashboard with live statistics of projects, machines, employees, maintenance and payments
- Project management (add / edit / delete / search)
- Machine management (register / update / allocate to projects)
- Maintenance management (raise requests, assign workers, update status)
- Employee management with role management
- Payment management (add payments, update payment status)
- Search and filters across all modules

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000, register an account (choose the Owner or Site Engineer role) and log in.

The SQLite database is created automatically at `data/ctms.db` on first run.

## Repository Layout

This repository holds the main application plus two standalone static builds. Each is independent — the two static folders need no install step and no backend.

| Folder | What it is |
|---|---|
| `src/` | The main Next.js application — full stack, SQLite-backed |
| `plinth/` | **Plinth** — a complete design-led frontend prototype of the same product |
| `website/` | **Atelier Terrane** — a premium marketing/demo site |

### Main application

```
src/
  app/            # Pages and API routes (Next.js App Router)
  lib/            # Database connection + auth helpers
  components/     # Shared UI components
```

### Plinth — frontend prototype

A complete, navigable frontend for the platform with a mock data layer: no backend, no auth server, no build step. Plain ES modules and a hash router, served as static files.

It covers authentication, role-scoped dashboards, jobs, an asset register, the allocation flow (allocate / return / transfer), employees, a maintenance pipeline, a payments ledger, global search and settings. Two demo roles — Owner and Site Engineer — see genuinely different data, and the role switcher rescopes the whole register live.

```bash
cd plinth
python -m http.server 8741
```

Open http://127.0.0.1:8741 and sign in with any password of 4 or more characters. It **must** be served over http; opening `index.html` directly from the file system fails, because browsers block ES modules on `file://`.

The design system, interface vocabulary, component inventory and an iteration log are documented in [`plinth/guide.html`](plinth/guide.html). The signature canvas animation can be viewed in isolation at [`plinth/signature-demo.html`](plinth/signature-demo.html).

Seed data is fictional and internally consistent against a fixed date of 19 July 2026.

### Website

A static marketing site. Serve it the same way:

```bash
cd website
python -m http.server 8742
```

## Docs

- [Project Scope](scope.md)
- [Components](components.md)
- [MVP](mvp.md)
- [Plinth design guide](plinth/guide.html) — palette, typography, density system, vocabulary and iteration log
