# SHD Build Archive

React + TypeScript + Vite catalogue for The Division 2, with English/Russian content, brands and gear sets, weapon and gear talents, augments and expertise calculators. Hosted on GitHub Pages; Supabase provides owner authentication, build records and images.

## Local development

Node.js 22.13+ and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the dedicated Supabase project's Connect dialog. Only a publishable key belongs in the frontend; never use a service-role key or secret key.

## Database and owner account

1. Create a dedicated Supabase project (do not run this schema against the task tracker).
2. Apply `supabase/schema.sql` in its SQL editor.
3. Create the owner in Authentication → Users using a private password. Turn off public user registration in Authentication settings.
4. Add that user's UUID to `public.archive_owners` through the dashboard. Do not grant browser clients write access to this table.
5. Use that account's email and password in **Owner sign in**. Everyone else can browse without an account.

Row-level security checks membership for every build write and image upload. Hiding the form is only a UI convenience. Images are public, with PNG/JPEG/WebP and 10 MB limits. Auth membership and passwords are never committed to this repository.

## Publish

The dedicated Supabase project is configured in `lib/supabase-config.json` using its public publishable key. Optional GitHub Actions repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` override this configuration. Select **GitHub Actions** in Settings → Pages. The `pages.yml` workflow builds and deploys `dist` after pushes to `main`. The default base path is `/shd-build-archive/`.

```sh
pnpm test
pnpm build
```

Before completing migration, test public reads, anonymous/non-owner write denial, owner uploads, login/logout and all images under the Pages subpath. Transfer any existing builds and screenshots before switching links. Current production remains unchanged until the new deployment is ready.

## Catalogue provenance

See `data/SOURCES.md`. Catalogue data and game icons retain their upstream attribution. User builds live in Supabase and are not stored in Git.

### Icon assets

The 257 referenced game icons are preserved losslessly in `assets/icons-*.b64` (a compressed JSON bundle), with a SHA-256 manifest. `predev` / `prebuild` restore the original filenames into `public/game-icons/`. This avoids relying on external image hosts and keeps the transferred catalogue self-contained.

## Migration status

Dedicated project `shd-build-archive` is healthy in Frankfurt. The schema and storage policies have been applied. Owner provisioning and Pages activation remain required. The task tracker uses its own project and is unaffected.

## Build translations

The build editor requires a title and description in both RU and ENG, with one shared screenshot. Cards, expanded descriptions and name search use the current site language. Existing builds without translations retain their original text as a fallback; their original copy is shown in the editor for manual translation. New fields are added by `supabase/migrations/20260929131408_build_translations.sql`; `schema.sql` includes them for fresh projects. Database owner policies are unchanged.

## Build tags

Owners can assign any combination of PvP, PvE, Sniper, Damage dealer, heal, support and tank when adding or editing a build. Tags appear on cards. The public tag filter matches all selected tags and combines with the current-language title search; resetting tags shows untagged builds again. Existing builds default to an empty tag list. The database validates the supported values, while existing owner-only write policies remain in effect.
