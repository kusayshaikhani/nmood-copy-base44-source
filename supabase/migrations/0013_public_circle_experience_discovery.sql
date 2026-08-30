-- Migration: 0013_public_circle_experience_discovery.sql
-- Problem: public.app_records only had an owner policy, so a signed-in member
-- could read their own Circles/Experiences but never anyone else's. Discovery
-- feeds were therefore empty for everyone except the creator.
--
-- Fix: one narrowly scoped, read-only policy. It is limited to the two
-- discoverable entity types, to records that are explicitly public, and to
-- records that are still active. Every other entity_type (PhotoVerification,
-- Attendance, drafts, ...) stays owner-only. No anon access is granted.

drop policy if exists "members read public circles and experiences" on public.app_records;
create policy "members read public circles and experiences"
  on public.app_records for select to authenticated
  using (
    entity_type in ('Circle', 'Experience')
    and coalesce(data->>'privacy', data->>'visibility', 'public') = 'public'
    and coalesce(data->>'status', 'active') = 'active'
    and coalesce((data->>'is_hidden')::boolean, false) = false
    and coalesce((data->>'is_archived')::boolean, false) = false
  );
