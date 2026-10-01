begin;
alter table public.archive_builds drop constraint archive_builds_tags_valid;
alter table public.archive_builds add constraint archive_builds_tags_valid check (
 tags <@ array['PvP','PvE','Sniper','Damage dealer','heal','support','tank','Conflict','DarkZone','Broken Rain','Paradise Lost']::text[]
 and array_position(tags,null) is null
 and cardinality(tags)<=11
);
commit;
