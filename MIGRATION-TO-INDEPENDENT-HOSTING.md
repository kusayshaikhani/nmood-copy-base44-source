# Nmood migration from Base44

## Target stack

- GitHub: source and deployment trigger
- Cloudflare Pages and Workers: frontend and server APIs
- Supabase: Auth, PostgreSQL, Storage, Realtime, and Edge Functions

This starts at $0 for an early-stage application within each provider's free
limits. It deliberately keeps the Base44 project untouched until the new app
passes production verification.

## Safety rules

1. Do not redirect `app.nmood.app` until the new auth, onboarding, messaging,
   connection, and authorization paths have passed acceptance testing.
2. Export Base44 data before decommissioning it. The GitHub repository contains
   code, not a guaranteed export of live members, messages, or media.
3. Keep all privileged actions in server-side Edge Functions. Never put a
   Supabase service-role key in the React app.

## First migration slice

Current state: the Supabase project is created. Migrations `0001`, `0002`,
and the compatibility record store (`0004`) have been applied there. The
source now has an independent Supabase email/password session flow, safe
email-link handoff, canonical profile provisioning, progressive onboarding
saves, private DOB storage, and Supabase Storage profile uploads. Do not cut
over the domain yet: migrations `0003`, `0005`, `0006`, and `0007` still need to be
applied, and the remaining Base44 entity/services have not been ported.

`supabase/migrations/0001_nmood_core.sql` establishes the canonical user
profile, resumable onboarding state, Pals, and private-message core. This is
the dependency chain behind the connection/onboarding repair.

Apply migrations in this order before testing the independent frontend:

1. `0003_member_profile_fields.sql`
2. `0005_profile_photos.sql`
3. `0006_secure_eligibility.sql`
4. `0007_pal_connection_actions.sql`

`0005` creates the public profile-photo bucket but restricts uploads and
deletes to the signed-in member's own folder. `0006` replaces the onboarding
RPCs so the database validates an 18+ DOB and derives the eligibility state;
the browser neither writes nor reads the DOB after that point. `0007` moves
Pal request, accept, decline, cancellation, and removal actions into
server-side functions; direct browser table writes remain unavailable.

Next implementation steps:

1. Configure Supabase Auth email templates, Site URL, and redirect URLs for
   the independent host. Enable Google/Apple only after their callback URLs
   have been registered.
2. Replace `src/api/base44Client.js` behind a provider-neutral client API.
3. Port `authorizationGate` as Edge Functions before exposing any social
   mutation to the new frontend.
4. Deploy a preview from GitHub to Cloudflare Pages and compare it with the
   Base44 version before domain cutover.
