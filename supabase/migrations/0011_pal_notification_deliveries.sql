create table if not exists public.notification_deliveries (
  notification_key text primary key,
  request_id uuid not null references public.pal_requests(id) on delete cascade,
  event_type text not null check (event_type in ('pal_request_created', 'pal_request_accepted')),
  recipient_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  resend_email_id text
);

alter table public.notification_deliveries enable row level security;
