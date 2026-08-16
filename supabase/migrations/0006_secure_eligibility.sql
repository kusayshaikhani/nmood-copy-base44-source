-- Keep DOB private while deriving adult eligibility exclusively on the
-- server. This replaces the initial onboarding save function in projects
-- where migration 0002 has already been applied.
create or replace function public.save_my_onboarding_progress(p_updates jsonb)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.members%rowtype;
  supplied_dob date;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  perform public.ensure_my_onboarding_profile();

  if p_updates ? 'date_of_birth' then
    supplied_dob := (p_updates ->> 'date_of_birth')::date;
    if supplied_dob > current_date
      or extract(year from age(current_date, supplied_dob)) < 18 then
      raise exception 'You must be at least 18 to join Nmood';
    end if;
    update public.member_private
      set date_of_birth = supplied_dob, updated_at = now()
      where id = auth.uid() and date_of_birth is null;
    if not found then
      raise exception 'Date of birth is already stored and cannot be changed here';
    end if;
    update public.members
      set eligibility_status = 'verified', updated_at = now()
      where id = auth.uid();
  end if;

  update public.members
  set
    display_name = case when p_updates ? 'display_name' then left(trim(p_updates ->> 'display_name'), 80) else display_name end,
    photo_url = case when p_updates ? 'photo_url' then nullif(left(trim(p_updates ->> 'photo_url'), 2048), '') else photo_url end,
    bio = case when p_updates ? 'bio' then left(trim(p_updates ->> 'bio'), 1000) else bio end,
    city = case when p_updates ? 'city' then left(trim(p_updates ->> 'city'), 120) else city end,
    country = case when p_updates ? 'country' then left(trim(p_updates ->> 'country'), 120) else country end,
    interests = case when p_updates ? 'interests' then array(select jsonb_array_elements_text(p_updates -> 'interests')) else interests end,
    languages = case when p_updates ? 'languages' then array(select jsonb_array_elements_text(p_updates -> 'languages')) else languages end,
    onboarding_updated_at = now(), updated_at = now()
  where id = auth.uid()
  returning * into profile;
  return profile;
end;
$$;

create or replace function public.complete_my_onboarding()
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.members%rowtype;
  has_dob boolean;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  perform public.ensure_my_onboarding_profile();
  select * into profile from public.members where id = auth.uid();
  select date_of_birth is not null into has_dob from public.member_private where id = auth.uid();
  if coalesce(trim(profile.display_name), '') = '' then raise exception 'Display name is required'; end if;
  if profile.photo_url is null then raise exception 'Profile photo is required'; end if;
  if not coalesce(has_dob, false) or profile.eligibility_status <> 'verified' then
    raise exception 'A verified adult date of birth is required';
  end if;
  update public.members set onboarding_completed = true, onboarding_updated_at = now(), updated_at = now()
    where id = auth.uid() returning * into profile;
  return profile;
end;
$$;
