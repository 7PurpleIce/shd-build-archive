alter table public.archive_builds
 add column tags text[] not null default '{}',
 add constraint archive_builds_tags_valid check (
  tags <@ array['PvP','PvE','Sniper','Damage dealer','heal','support','tank']::text[]
  and array_position(tags,null) is null
  and cardinality(tags)<=7
 );
