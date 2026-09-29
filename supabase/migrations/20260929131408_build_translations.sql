-- Add translations without modifying the original build text or access policies.
alter table public.archive_builds
 add column title_ru text,
 add column title_en text,
 add column description_ru text,
 add column description_en text,
 add constraint archive_builds_translations_complete check (
 num_nonnulls(title_ru,title_en,description_ru,description_en)=0
 or (
  num_nonnulls(title_ru,title_en,description_ru,description_en)=4
  and char_length(btrim(title_ru)) between 1 and 120
  and char_length(btrim(title_en)) between 1 and 120
  and char_length(btrim(description_ru)) between 1 and 60000
  and char_length(btrim(description_en)) between 1 and 60000
 )
);
