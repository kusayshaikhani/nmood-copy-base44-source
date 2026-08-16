-- Preserve Nmood profile, privacy, and discovery preferences while keeping
-- identifying data in member_private.
alter table public.members
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists gender text,
  add column if not exists country_code text,
  add column if not exists nationality text,
  add column if not exists state text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists lifestyle text,
  add column if not exists photo_gallery text[] not null default '{}',
  add column if not exists location_enabled boolean not null default false,
  add column if not exists notifications_enabled boolean not null default false,
  add column if not exists notif_email boolean not null default true,
  add column if not exists notif_circle boolean not null default false,
  add column if not exists profile_visibility text not null default 'connections',
  add column if not exists who_can_message text not null default 'connections',
  add column if not exists show_online_status boolean not null default true,
  add column if not exists show_age boolean not null default false,
  add column if not exists show_distance boolean not null default false,
  add column if not exists show_last_seen boolean not null default false,
  add column if not exists personalized_recommendations boolean not null default true,
  add column if not exists analytics_consent boolean not null default false,
  add column if not exists account_state text not null default 'active',
  add column if not exists discovery_scope text not null default 'anywhere',
  add column if not exists search_country text,
  add column if not exists search_radius numeric not null default 50,
  add column if not exists search_age_min integer,
  add column if not exists search_age_max integer,
  add column if not exists search_availability text[] not null default '{}',
  add column if not exists search_languages text[] not null default '{}',
  add column if not exists looking_for_tags text[] not null default '{}',
  add column if not exists zodiac text;

alter table public.member_private
  add column if not exists phone text,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists eligibility_verified_at timestamptz,
  add column if not exists dob_change_requested_at timestamptz;

alter table public.members
  add constraint members_profile_visibility_valid check (profile_visibility in ('public','connections','private')),
  add constraint members_message_policy_valid check (who_can_message in ('everyone','connections','no_one')),
  add constraint members_account_state_valid check (account_state in ('active','paused','hidden','deleted')),
  add constraint members_discovery_scope_valid check (discovery_scope in ('nearby','same_country','anywhere'));
