-- ============ Rebuild on Plinth's data model ============
-- Replaces the projects/machines/tools/deliveries schema from 0001 with
-- Plinth's vocabulary: jobs, assets, allocations (as asset state), an
-- append-only asset_history, a maintenance pipeline and a payments ledger.

drop table if exists public.deliveries          cascade;
drop table if exists public.machine_transfers   cascade;
drop table if exists public.tool_transactions   cascade;
drop table if exists public.tools               cascade;
drop table if exists public.payments            cascade;
drop table if exists public.maintenance_records cascade;
drop table if exists public.machines            cascade;
drop table if exists public.employees           cascade;
drop table if exists public.projects            cascade;

-- ---------- employees (human-readable ids: E-102) ----------
create table public.employees (
  id         text primary key,
  name       text not null,
  role       text not null default 'Plant Operator',
  job_id     text,
  phone      text not null default '',
  email      text not null default '',
  started_on date,
  status     text not null default 'Active' check (status in ('Active','On leave','Left')),
  created_at timestamptz not null default now()
);

-- ---------- jobs (JOB-24-011) ----------
create table public.jobs (
  id          text primary key,
  name        text not null,
  client      text not null default '',
  location    text not null default '',
  status      text not null default 'Mobilising'
    check (status in ('Mobilising','Active','On hold','Completed')),
  started     date,
  ends        date,
  engineer_id text references public.employees(id) on delete set null,
  hold_note   text,
  created_at  timestamptz not null default now()
);

alter table public.employees
  add constraint employees_job_fk foreign key (job_id) references public.jobs(id) on delete set null;

-- ---------- assets (AST-0112) ----------
create table public.assets (
  id           text primary key,
  category     text not null default '',
  model        text not null default '',
  serial       text not null default '',
  purchased    date,
  value        bigint not null default 0,
  condition    text not null default 'B' check (condition in ('A','B','C','D')),
  status       text not null default 'In yard'
    check (status in ('In yard','Allocated','In workshop','Retired')),
  job_id       text references public.jobs(id) on delete set null,
  allocated_on date,
  hours        integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------- append-only per-asset history ----------
create table public.asset_history (
  id        bigint generated always as identity primary key,
  asset_id  text not null references public.assets(id) on delete cascade,
  "on"      date not null,
  kind      text not null,
  note      text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- maintenance pipeline (MR-161) ----------
create table public.maintenance (
  id          text primary key,
  asset_id    text not null references public.assets(id) on delete cascade,
  status      text not null default 'Reported'
    check (status in ('Reported','Approved','In workshop','Resolved','Rejected')),
  reported    date not null,
  fault       text not null,
  est_cost    bigint not null default 0,
  reporter_id text references public.employees(id) on delete set null,
  mechanic_id text references public.employees(id) on delete set null,
  approved_on date,
  workshop_on date,
  resolved_on date,
  rejected_on date,
  reject_note text,
  overdue     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- payments ledger (INV-26428) ----------
create table public.payments (
  id           text primary key,
  job_id       text references public.jobs(id) on delete set null,
  payee        text not null default '',
  description  text not null default '',
  amount       bigint not null default 0,
  status       text not null default 'Pending'
    check (status in ('Pending','Paid','Overdue','Disputed','Voided')),
  issued       date,
  due          date,
  paid_on      date,
  voided_on    date,
  dispute_note text,
  created_at   timestamptz not null default now()
);

-- ---------- profiles: link a login to an employee ----------
alter table public.profiles add column if not exists employee_id text
  references public.employees(id) on delete set null;

-- keep the signup trigger; refresh it to also copy employee_id if supplied
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, employee_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'OWNER' then 'OWNER' else 'SITE_ENGINEER' end,
    nullif(new.raw_user_meta_data->>'employee_id', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create index idx_assets_job       on public.assets(job_id);
create index idx_assets_status    on public.assets(status);
create index idx_history_asset    on public.asset_history(asset_id);
create index idx_maint_asset      on public.maintenance(asset_id);
create index idx_maint_status     on public.maintenance(status);
create index idx_payments_job     on public.payments(job_id);
create index idx_jobs_engineer    on public.jobs(engineer_id);

alter table public.employees     enable row level security;
alter table public.jobs          enable row level security;
alter table public.assets        enable row level security;
alter table public.asset_history enable row level security;
alter table public.maintenance   enable row level security;
alter table public.payments      enable row level security;
