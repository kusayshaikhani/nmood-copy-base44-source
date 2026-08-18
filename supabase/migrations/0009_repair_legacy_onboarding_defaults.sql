-- Repair only unfinished legacy profiles. Completed members retain every
-- privacy choice they already made.
alter table public.members
  alter column profile_visibility set default 'public',
  alter column who_can_message set default 'everyone';

update public.members
set
  profile_visibility = 'public',
  who_can_message = 'everyone',
  -- The original member name is preserved whenever it exists. This fallback
  -- repairs migration-era verified accounts where only the email was copied.
  display_name = case
    when coalesce(trim(display_name), '') <> '' then display_name
    when coalesce(trim(email), '') <> '' then initcap(replace(replace(split_part(email, '@', 1), '.', ' '), '_', ' '))
    else display_name
  end,
  onboarding_updated_at = now(),
  updated_at = now()
where onboarding_completed = false
  and (
    (profile_visibility = 'connections' and who_can_message = 'connections')
    or coalesce(trim(display_name), '') = ''
  );
