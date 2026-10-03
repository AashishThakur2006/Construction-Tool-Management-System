# Plinth — Construction Plant & Logistics Register

Plinth is a web application for a construction company to run its plant fleet
from one place: **jobs**, an **asset register**, the **allocation** flow
(allocate / return / transfer), a **maintenance** pipeline, an **employee**
roster and a **payments** ledger — role-scoped for the Owner and Site Engineers.

- **Frontend** — a client-side SPA (hash router, plain ES modules, no build step)
  served by Next.js from `/public`.
- **Backend** — Next.js route handlers over **Supabase**: Postgres for data
  (via the session pooler), Supabase Auth for sign-in.

## How it fits together

```
src/app/
  (site)/                   marketing site — /, /about, /people, /pricing
    layout.tsx              dark chrome, orb field, /landing.js
  app/page.tsx              serves the Plinth SPA shell + /styles.css
  auth/callback/route.ts    OAuth code exchange
  api/state/route.ts        GET the register, row-scoped by role
  api/mutate/route.ts       command bus: applies a batch of ops, role-gated
  api/team/*                Owner-only: list / invite / edit / remove accounts
  api/auth/*                login / logout / register / oauth + dev bypass
public/
  js/store.js               in-memory register, hydrated from /api/state;
                            mutations apply locally then POST /api/mutate
  js/views/*.js             one Plinth screen per module
                            (reports + team are Owner-only)
  landing.css / landing.js  marketing-site styles + scroll motion (site only)
  art/*.svg                 marketing imagery
src/lib/
  db.ts                     postgres client (Supabase session pooler)
  auth.ts                   session + role, joined to public.profiles
  plinth.ts                 TODAY + the mutation allow-list per role
supabase/migrations/        database schema (0001 base, 0002 = Plinth's model)
scripts/seed.mjs            demo register + two demo accounts
```

The marketing site is at `/`; the app is at `/app`. "Sign in" / "Sign up" in
the header link straight to it (`/app?tab=register` opens the Register tab).
OAuth ("Continue with Google / GitHub") is wired through
`/api/auth/oauth` → provider → `/auth/callback`; enable the provider in the
Supabase dashboard and add `<origin>/auth/callback` to its redirect list.

### The register & mutations

`GET /api/state` returns the register (jobs, employees, assets, asset_history,
maintenance, payments) in the camelCase shape the SPA expects, **row-scoped on
the server**: the Owner gets everything; a Site Engineer gets only their jobs,
the assets on them (plus the yard and assets they've reported faults on), their
fault reports, and the money and crew on their jobs. The linkage is
`profiles.employee_id` → `jobs.engineer_id`; an Owner manages it from **Team**.

Every change the SPA makes is expressed as a batch of ops and sent to
`POST /api/mutate`, e.g.

```json
{ "ops": [
  { "t": "asset", "id": "AST-0112", "set": { "status": "Allocated", "job_id": "JOB-24-011", "allocated_on": "2026-07-19" } },
  { "t": "history", "insert": { "asset_id": "AST-0112", "on": "2026-07-19", "kind": "Allocated", "note": "…" } }
] }
```

`src/lib/plinth.ts` decides which ops each role may perform (the Owner approves
spend, records payments, manages the payroll and retires assets; a Site Engineer
allocates, returns, transfers and raises fault reports). **Undo** just posts the
inverse ops.

## Getting started

### 1. Environment

```bash
cp .env.example .env.local     # fill in from your Supabase project
```

| Variable | Supabase dashboard |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service role / secret key (server-only) |
| `DATABASE_URL` | Settings → Database → Connection pooling → **Session** (port 5432) |

### 2. Schema

Apply `supabase/migrations/0001_init.sql` then `0002_plinth_model.sql` to your
project (SQL editor, `supabase db push`, or `psql`). They create every table plus
a trigger that inserts a `profiles` row on sign-up, and enable RLS (the app
connects as the Postgres role, which bypasses RLS; the API gates writes by role).
Turn on **auto-confirm** email under Auth → Providers → Email for immediate login.

### 3. Install, seed, run

```bash
npm install
npm run seed      # demo register + accounts (destructive: clears the register)
npm run dev
```

Open http://localhost:3000 and sign in:

- `rajendra@plinthops.in` / `demo1234` — **Owner** (whole register)
- `priya@plinthops.in` / `demo1234` — **Site Engineer** (her jobs only)

Seed data is internally consistent against a fixed "today" of **19 July 2026**.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / build / serve |
| `npm test` | Unit tests (Vitest) for the input helpers |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Reset the register and load demo data |

CI (`.github/workflows/ci.yml`) runs the tests, the type check and a production
build on every push and pull request.

## Security

Defence in depth, all unit-tested (`src/lib/security.test.ts`, `plinth.test.ts`):

- **Headers** (`next.config.ts`): Content-Security-Policy (no framing, no foreign form posts, connections only to this origin and Supabase), `X-Frame-Options`, `nosniff`, referrer and permissions policies, HSTS in production, `no-store` on API responses.
- **Rate limiting** (`src/lib/security.ts`): login (per IP and per account), sign-up, OAuth start, dev login and `/api/mutate` (per user). In-memory, so per server instance - put a platform firewall in front for real traffic.
- **CSRF**: every state-changing route rejects requests whose `Origin` is not this host.
- **Authorisation**: `denyReason` (who may touch which table/column) plus `assertEngineerScope` (which *rows* a Site Engineer's jobs cover, enforced inside the transaction so a violation rolls the batch back).
- **Input validation**: `valueProblem` checks enums, integers, real dates, id shapes, text length and date ranges and answers with a precise 400; Postgres integrity errors map to 4xx, not 500.
- **Credentials**: passwords need 8+ characters with a letter and a number; temporary passwords come from `crypto`. Self-service *Owner* sign-up is open in development and closed in production unless `ALLOW_OWNER_SIGNUP=true`.
- **Output safety**: status chips insert text, never markup; CSV exports neutralise spreadsheet formulas (`= + - @`).
- **Redirects**: post-login `next` is restricted to same-site paths. The dev login only works on localhost outside production.
- **Idle sign-out**: the app closes the session after 30 minutes without input (with a one-minute warning).

## Using the app

- **Keyboard**: `/` or `Ctrl+K` search; `g` then `d j a l e m p s` (and `r t` for Owners) to jump between screens; `?` lists them all.
- **Export**: every list has an *Export CSV* button that downloads exactly the filtered, sorted rows on screen.
- **Print**: registers, ledgers and job sheets print without the app chrome.
- **Health check**: `GET /api/health` reports liveness and database reachability for uptime monitors.

## Design guide

The UI follows the Planpoint design system (white canvas, Signal Blue action colour, pill
buttons, Inter, flat surfaces; source: styles.refero.design). Palette, typography, the interface
glossary and an iteration log are in
[`public/guide.html`](public/guide.html) (served at `/guide.html`). The signature
allocation-field animation is at `/signature-demo.html`.

## Docs

- [Project Scope](scope.md) · [MVP](mvp.md) · [Components](components.md)
