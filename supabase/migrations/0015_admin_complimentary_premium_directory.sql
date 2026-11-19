-- Mission Control: include active complimentary Premium grants in the
-- administrator overview and member directory. Complimentary grants are the
-- current founder/admin one-year grants and live outside public.memberships.

create or replace function public.admin_platform_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'members_total', (select count(*) from public.members),
    'members_onboarded', (select count(*) from public.members where onboarding_completed),
    'members_new_24h', (select count(*) from public.members where created_at >= now() - interval '24 hours'),
    'members_new_7d', (select count(*) from public.members where created_at >= now() - interval '7 days'),
    'members_new_30d', (select count(*) from public.members where created_at >= now() - interval '30 days'),
    'members_active_7d', (select count(*) from public.members where coalesce(last_active_at, updated_at) >= now() - interval '7 days'),
    'members_verified', (select count(*) from public.members where identity_verified),
    'premium_members', (
      select count(*)
      from public.members m
      where exists (select 1 from public.founder_premium_grants g where g.member_id = m.id)
         or exists (
           select 1 from public.memberships ms
           where ms.member_id = m.id
             and coalesce(ms.plan, 'explorer') <> 'explorer'
             and ms.entitlement_status in ('active', 'trial', 'grace_period')
             and (ms.expires_at is null or ms.expires_at > now())
         )
         or exists (
           select 1 from nmood_main_operations.complimentary_premium cp
           where cp.member_id = m.id and cp.expires_at > now()
         )
    ),
    'circles_total', (select count(*) from public.app_records where entity_type = 'Circle'),
    'experiences_total', (select count(*) from public.app_records where entity_type = 'Experience'),
    'reports_total', (select count(*) from public.app_records where entity_type = 'SafetyReport'),
    'reports_open', (select count(*) from public.app_records where entity_type = 'SafetyReport' and coalesce(data->>'status', 'open') in ('open', 'pending', 'investigating')),
    'tickets_open', (select count(*) from public.app_records where entity_type = 'SupportTicket' and coalesce(data->>'status', 'open') in ('open', 'pending')),
    'messages_total', (select count(*) from public.private_messages),
    'messages_24h', (select count(*) from public.private_messages where created_at >= now() - interval '24 hours'),
    'conversations_total', (select count(*) from public.private_conversations),
    'connections_total', (select count(*) from public.pal_connections),
    'pal_requests_pending', (select count(*) from public.pal_requests where status = 'pending'),
    'subscriptions_active', (select count(*) from public.app_records where entity_type in ('Membership', 'Subscription') and coalesce(data->>'status', '') = 'active'),
    'photo_verifications_pending', (select count(*) from public.app_records where entity_type = 'PhotoVerification' and coalesce(data->>'status', 'pending') = 'pending')
  ) into v;

  return v;
end;
$$;

create or replace function public.admin_list_members_v2(
  p_search text default null,
  p_limit integer default 500,
  p_offset integer default 0
)
returns table(
  id uuid, role public.member_role, display_name text, first_name text, last_name text,
  email text, photo_url text, city text, country text, languages text[], interests text[],
  eligibility_status text, account_state text, onboarding_completed boolean,
  identity_verified boolean, phone_verified boolean, created_at timestamptz,
  updated_at timestamptz, last_active_at timestamptz, membership_tier text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_q text := nullif(btrim(coalesce(p_search, '')), '');
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  return query
  select m.id, m.role, m.display_name, m.first_name, m.last_name, mp.email,
         m.photo_url, m.city, m.country, m.languages, m.interests,
         m.eligibility_status, m.account_state, m.onboarding_completed,
         m.identity_verified, coalesce(mp.phone_verified, false), m.created_at,
         m.updated_at, m.last_active_at,
         case when exists (select 1 from public.founder_premium_grants g where g.member_id = m.id)
                    or exists (
                      select 1 from public.memberships ms
                      where ms.member_id = m.id
                        and coalesce(ms.plan, 'explorer') <> 'explorer'
                        and ms.entitlement_status in ('active', 'trial', 'grace_period')
                        and (ms.expires_at is null or ms.expires_at > now())
                    )
                    or exists (
                      select 1 from nmood_main_operations.complimentary_premium cp
                      where cp.member_id = m.id and cp.expires_at > now()
                    )
              then 'premium' else 'explorer' end
    from public.members m
    left join public.member_private mp on mp.id = m.id
   where v_q is null
      or m.display_name ilike '%' || v_q || '%'
      or coalesce(m.first_name, '') ilike '%' || v_q || '%'
      or coalesce(m.last_name, '') ilike '%' || v_q || '%'
      or coalesce(mp.email, '') ilike '%' || v_q || '%'
   order by m.created_at desc
   limit greatest(1, least(coalesce(p_limit, 500), 2000))
  offset greatest(0, coalesce(p_offset, 0));
end;
$$;

revoke all on function public.admin_list_members_v2(text, integer, integer) from public;
grant execute on function public.admin_list_members_v2(text, integer, integer) to authenticated, service_role;
