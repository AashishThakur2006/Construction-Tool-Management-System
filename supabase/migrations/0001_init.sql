-- ============ CTMS schema (Supabase / Postgres) ============
-- Applied to Supabase project bvfmvlgyuauszpgtnlyh.
-- The app connects as the Postgres role over the session pooler (BYPASSRLS);
-- RLS is enabled with no policies so the public PostgREST roles cannot read/write.

-- profiles: 1:1 with auth.users, holds display name + app role
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  role       text not null default 'SITE_ENGINEER' check (role in ('OWNER','SITE_ENGINEER')),
  created_at timestamptz not null default now()
);

-- auto-create a profile row whenever an auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'OWNER' then 'OWNER' else 'SITE_ENGINEER' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- core domain ----------
create table if not exists public.projects (
  id         bigint generated always as identity primary key,
  name       text not null,
  location   text not null default '',
  status     text not null default 'PLANNED' check (status in ('PLANNED','ONGOING','COMPLETED','ON_HOLD')),
  start_date date,
  end_date   date,
  budget     numeric(14,2) not null default 0,
  progress   integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.machines (
  id            bigint generated always as identity primary key,
  name          text not null,
  type          text not null default '',
  model         text not null default '',
  status        text not null default 'AVAILABLE' check (status in ('AVAILABLE','ALLOCATED','MAINTENANCE')),
  purchase_date date,
  project_id    bigint references public.projects(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists public.employees (
  id         bigint generated always as identity primary key,
  name       text not null,
  role       text not null default 'OPERATOR' check (role in ('OPERATOR','MAINTENANCE_WORKER','SUPERVISOR','LABOURER')),
  phone      text not null default '',
  email      text not null default '',
  status     text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_records (
  id                   bigint generated always as identity primary key,
  machine_id           bigint not null references public.machines(id) on delete cascade,
  description          text not null,
  status               text not null default 'PENDING' check (status in ('PENDING','IN_PROGRESS','COMPLETED')),
  assigned_employee_id bigint references public.employees(id) on delete set null,
  raised_by            uuid references public.profiles(id) on delete set null,
  cost                 numeric(14,2) not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.payments (
  id           bigint generated always as identity primary key,
  project_id   bigint references public.projects(id) on delete set null,
  description  text not null,
  amount       numeric(14,2) not null default 0,
  status       text not null default 'PENDING' check (status in ('PENDING','PAID')),
  payment_date date,
  created_at   timestamptz not null default now()
);

-- ---------- logistics ----------
-- consumable tools / small equipment tracked by quantity
create table if not exists public.tools (
  id                 bigint generated always as identity primary key,
  name               text not null,
  category           text not null default '',
  unit               text not null default 'unit',
  total_quantity     integer not null default 0 check (total_quantity >= 0),
  available_quantity integer not null default 0 check (available_quantity >= 0),
  location           text not null default 'WAREHOUSE',
  created_at         timestamptz not null default now(),
  check (available_quantity <= total_quantity)
);

-- tool issue / return ledger (check-out / check-in)
create table if not exists public.tool_transactions (
  id          bigint generated always as identity primary key,
  tool_id     bigint not null references public.tools(id) on delete cascade,
  kind        text not null check (kind in ('ISSUE','RETURN')),
  quantity    integer not null check (quantity > 0),
  project_id  bigint references public.projects(id) on delete set null,
  employee_id bigint references public.employees(id) on delete set null,
  note        text not null default '',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- machine transfer audit log between projects / sites
create table if not exists public.machine_transfers (
  id              bigint generated always as identity primary key,
  machine_id      bigint not null references public.machines(id) on delete cascade,
  from_project_id bigint references public.projects(id) on delete set null,
  to_project_id   bigint references public.projects(id) on delete set null,
  transferred_by  uuid references public.profiles(id) on delete set null,
  note            text not null default '',
  created_at      timestamptz not null default now()
);

-- inbound / outbound material deliveries
create table if not exists public.deliveries (
  id             bigint generated always as identity primary key,
  reference      text not null default '',
  direction      text not null check (direction in ('INBOUND','OUTBOUND')),
  project_id     bigint references public.projects(id) on delete set null,
  carrier        text not null default '',
  item_summary   text not null default '',
  status         text not null default 'SCHEDULED' check (status in ('SCHEDULED','IN_TRANSIT','DELIVERED','CANCELLED')),
  scheduled_date date,
  delivered_date date,
  created_at     timestamptz not null default now()
);

create index if not exists idx_machines_project   on public.machines(project_id);
create index if not exists idx_maint_machine      on public.maintenance_records(machine_id);
create index if not exists idx_payments_project   on public.payments(project_id);
create index if not exists idx_tooltx_tool        on public.tool_transactions(tool_id);
create index if not exists idx_transfers_machine  on public.machine_transfers(machine_id);
create index if not exists idx_deliveries_project on public.deliveries(project_id);

-- ---------- RLS: enable everywhere, no policies ----------
alter table public.profiles            enable row level security;
alter table public.projects            enable row level security;
alter table public.machines            enable row level security;
alter table public.employees           enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.payments            enable row level security;
alter table public.tools               enable row level security;
alter table public.tool_transactions   enable row level security;
alter table public.machine_transfers   enable row level security;
alter table public.deliveries          enable row level security;
