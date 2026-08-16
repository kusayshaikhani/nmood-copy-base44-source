-- Temporary compatibility store for the non-core Base44 entities while they
-- are migrated one-by-one to typed tables. It keeps ownership explicit and
-- does not grant cross-user access by default.
create table public.app_records (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type ~ '^[A-Za-z][A-Za-z0-9_]{0,79}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index app_records_owner_type on public.app_records(owner_id, entity_type);
create index app_records_type on public.app_records(entity_type);

alter table public.app_records enable row level security;

create policy "record owners manage their records"
  on public.app_records for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Public/member-to-member queries, admin workflows, messaging and connection
-- mutations are intentionally not opened through this bridge. They retain
-- dedicated policies and server functions as each feature is migrated.
