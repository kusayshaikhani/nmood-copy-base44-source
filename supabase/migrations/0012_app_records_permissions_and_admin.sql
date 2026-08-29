-- Migration: 0012_app_records_permissions_and_admin.sql
-- Grants explicit DML privileges on public.app_records to the authenticated role
-- and establishes admin / founder review policies alongside owner RLS.

-- 1. Ensure the table exists and RLS is enabled
create table if not exists public.app_records (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type ~ '^[A-Za-z][A-Za-z0-9_]{0,79}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_records_owner_type on public.app_records(owner_id, entity_type);
create index if not exists app_records_type on public.app_records(entity_type);

alter table public.app_records enable row level security;

-- 2. Explicitly grant table permissions to authenticated role (and service_role)
grant select, insert, update, delete on table public.app_records to authenticated;
grant all on table public.app_records to service_role;

-- 3. Owner management policy: authenticated users can only insert, select, update, delete their own records
drop policy if exists "record owners manage their records" on public.app_records;
create policy "record owners manage their records"
  on public.app_records for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- 4. Admin & Founder review policy: admins can read and update all app_records (e.g. review PhotoVerification)
drop policy if exists "admins review all app records" on public.app_records;
create policy "admins review all app records"
  on public.app_records for all to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.id = auth.uid()
        and m.role in ('admin', 'founder')
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.id = auth.uid()
        and m.role in ('admin', 'founder')
    )
  );
