# Calculator tester access

Login entry: `https://7purpleice.github.io/shd-build-archive/#tester`.
The existing `#owner` entry remains supported. Neither link grants a role.

Provision a password account using Supabase Auth Admin `createUser` (or update an existing user), with administrator-controlled `app_metadata.archive_role = "tester"`. A real email address must be supplied by the site owner. Do not add testers to `public.archive_owners`. Never use user-editable `user_metadata` for access checks, and never put server-side credentials in the frontend.

The frontend verifies the user with `auth.getUser()` and derives separate capabilities:
- `canUseCalculator`: archive owner or verified tester app metadata.
- `canManage`: membership in `public.archive_owners` only.

Build insertion, updates and deletion, and build image changes remain protected by existing owner-only database/storage RLS policies. Tester access does not change those policies. Revoking the app metadata removes calculator access at the next access check; reload/sign-in refreshes it.

Validated 2026-10-01: authenticated non-owner tester cannot insert/update/delete builds or insert owner membership. Checks ran in a rolled-back transaction. Calculator access is frontend feature visibility; the static calculator bundle and public catalogue are not confidential server-side data.
