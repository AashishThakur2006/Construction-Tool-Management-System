# Construction Tool & Logistics Management System

A web application that helps a construction company run its sites from one place:
projects, heavy machines, a quantity-tracked tool inventory, material deliveries,
maintenance, workforce and payments — with role-based access and cross-module
reports.

Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS** and
**Supabase** (Postgres for data, Supabase Auth for sign-in).

## Features

- Email/password auth via Supabase, with a `profiles` table holding the app role
  (Owner / Site Engineer). A development-only one-click login bypass is available
  outside production.
- Dashboard with live counts, ongoing projects, open maintenance, low tool stock
  and a logistics/finance summary.
- **Projects** – add / edit / delete / search, budget and progress tracking.
- **Machines** – register, update, allocate to a project; every move is written to
  a machine-transfer log.
- **Tools & Inventory** – small tools/consumables tracked by quantity; check-out
  (`ISSUE`) and check-in (`RETURN`) adjust available stock and append to a
  movement ledger; low-stock warnings.
- **Deliveries** – inbound/outbound material movements with carrier, project and a
  `SCHEDULED → IN_TRANSIT → DELIVERED` status flow.
- **Maintenance** – raise requests, assign workers, update status; machine status
  stays in sync with its open work.
- **Employees** – CRUD with role and active/inactive status.
- **Payments** – record project payments, track paid / pending totals.
- **Reports** – machine utilisation, maintenance summary, deliveries by status,
  low tool stock, monthly payments, and project budget-vs-spend.
- Search across every module.

## Getting started

### 1. Configure the environment

```bash
cp .env.example .env.local
```

Fill `.env.local` from your Supabase project (Settings → API / Database):

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service role / secret key (server-only) |
| `DATABASE_URL` | Settings → Database → Connection pooling → **Session** (port 5432) |

### 2. Create the schema

Run the migration in `supabase/migrations/0001_init.sql` against your project —
via the Supabase SQL editor, the Supabase CLI (`supabase db push`), or `psql`.
It creates every table plus a trigger that inserts a `profiles` row whenever an
auth user signs up, and enables RLS (the app connects as the Postgres role over
the pooler, which bypasses RLS; authorization is enforced in the API layer).

Make sure **auto-confirm** is on (Auth → Providers → Email) if you want sign-ups
to log in immediately without an email round-trip.

### 3. Install, seed, run

```bash
npm install
npm run seed     # optional: demo data + two demo accounts
npm run dev
```

Open http://localhost:3000. Sign in with a demo account:

- `owner@ctms.demo` / `demo1234` — Owner
- `engineer@ctms.demo` / `demo1234` — Site Engineer

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Reset domain tables and load demo data |

CI (`.github/workflows/ci.yml`) runs the tests, the type check and a production
build on every push and pull request.

## Repository layout

```
src/
  app/
    (auth)/            login + register pages
    (app)/             dashboard + one folder per module (page.tsx + *-client.tsx)
    api/               route handlers, one folder per resource
  components/          Modal, SearchBar, Sidebar, StatusBadge
  lib/
    db.ts              postgres client (Supabase session pooler)
    supabase/          SSR + middleware auth clients
    auth.ts            session + role guards used by the API layer
    validation.ts      pure input helpers (unit-tested)
supabase/migrations/   database schema
scripts/seed.mjs       demo data seeder
plinth/                standalone design-led frontend prototype (no backend)
```

### Plinth — frontend prototype

`plinth/` is a self-contained, navigable frontend for the same product with a
mock data layer: no backend, no build step, plain ES modules and a hash router.

```bash
cd plinth
python -m http.server 8741
```

Open http://127.0.0.1:8741 and sign in with any password of 4+ characters. It
must be served over http (ES modules are blocked on `file://`). Design system and
iteration log: [`plinth/guide.html`](plinth/guide.html).

## Docs

- [Project Scope](scope.md)
- [Components](components.md)
- [MVP](mvp.md)
