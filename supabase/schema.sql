-- Apply once to a dedicated Supabase project using the SQL editor.
-- Owner membership is provisioned by the administrator, never by the browser.
begin;
create table public.archive_owners (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.archive_owners enable row level security;
revoke all on public.archive_owners from anon, authenticated;
grant select on public.archive_owners to authenticated;
create policy "Read own owner membership" on public.archive_owners for select to authenticated using (user_id=(select auth.uid()));

create table public.archive_builds (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(btrim(title)) between 1 and 120),
 description text not null check (char_length(btrim(description)) between 1 and 60000),
 image_key text not null unique check (image_key ~ '^[a-f0-9-]{36}\.(png|jpg|webp)$'),
 created_at timestamptz not null default now(),
 title_ru text,
 title_en text,
 description_ru text,
 description_en text,
 tags text[] not null default '{}' constraint archive_builds_tags_valid check (
  tags <@ array['PvP','PvE','Sniper','Damage dealer','heal','support','tank']::text[]
  and array_position(tags,null) is null and cardinality(tags)<=7
 ),
 constraint archive_builds_translations_complete check (
  num_nonnulls(title_ru,title_en,description_ru,description_en)=0
  or (
   num_nonnulls(title_ru,title_en,description_ru,description_en)=4
   and char_length(btrim(title_ru)) between 1 and 120
   and char_length(btrim(title_en)) between 1 and 120
   and char_length(btrim(description_ru)) between 1 and 60000
   and char_length(btrim(description_en)) between 1 and 60000
  )
 )
);
alter table public.archive_builds enable row level security;
revoke all on public.archive_builds from anon, authenticated;
grant select on public.archive_builds to anon, authenticated;
grant insert, update, delete on public.archive_builds to authenticated;
create index archive_builds_created_at_idx on public.archive_builds(created_at desc);
create policy "Public build reading" on public.archive_builds for select to anon, authenticated using (true);
create policy "Owner publishes builds" on public.archive_builds for insert to authenticated with check (exists(select 1 from public.archive_owners where user_id=(select auth.uid())));
create policy "Owner edits builds" on public.archive_builds for update to authenticated using (exists(select 1 from public.archive_owners where user_id=(select auth.uid()))) with check (exists(select 1 from public.archive_owners where user_id=(select auth.uid())));
create policy "Owner removes builds" on public.archive_builds for delete to authenticated using (exists(select 1 from public.archive_owners where user_id=(select auth.uid())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('build-images','build-images',true,10485760,array['image/png','image/jpeg','image/webp']);
create policy "Owner uploads build images" on storage.objects for insert to authenticated with check (bucket_id='build-images' and exists(select 1 from public.archive_owners where user_id=(select auth.uid())));
create policy "Owner lists build images" on storage.objects for select to authenticated using (bucket_id='build-images' and exists(select 1 from public.archive_owners where user_id=(select auth.uid())));
create policy "Owner removes build images" on storage.objects for delete to authenticated using (bucket_id='build-images' and exists(select 1 from public.archive_owners where user_id=(select auth.uid())));
commit;
