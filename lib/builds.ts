import {requireSupabase} from './supabase';
export const BUILD_TAGS=['PvP','PvE','Sniper','Damage dealer','heal','support','tank','Conflict','DarkZone'] as const;
export type BuildTag=typeof BUILD_TAGS[number];
export type Build={tags?:BuildTag[];id:string;title:string;description:string;image_key:string;created_at:string;title_ru?:string|null;description_ru?:string|null;title_en?:string|null;description_en?:string|null};
const BUCKET='build-images';
const BUILD_FIELDS='id,title,description,title_ru,description_ru,title_en,description_en,image_key,created_at,tags';
export function getBuildText(build:Build,locale:'en'|'ru'){
 return {title:build[`title_${locale}`]?.trim()||build.title,description:build[`description_${locale}`]?.trim()||build.description};
}
export function matchesBuildTags(build:Pick<Build,'tags'>,selected:readonly BuildTag[]){
 return selected.every(tag=>(build.tags??[]).includes(tag));
}
function readBuildTags(payload:FormData):BuildTag[]{
 const tags=[...new Set(payload.getAll('tags').map(String))];
 if(tags.some(tag=>!BUILD_TAGS.includes(tag as BuildTag)))throw new Error('Неизвестный тег / Unknown tag.');
 return tags as BuildTag[];
}
function readTranslations(payload:FormData){
 const title_ru=String(payload.get('title_ru')??'').trim();
 const title_en=String(payload.get('title_en')??'').trim();
 const description_ru=String(payload.get('description_ru')??'').trim();
 const description_en=String(payload.get('description_en')??'').trim();
 if([title_ru,title_en].some(v=>!v||v.length>120)||[description_ru,description_en].some(v=>!v||v.length>60000))throw new Error('Заполни название и описание на RU и ENG / Fill in the RU and ENG title and description.');
 // Keep legacy fields for cached clients until they refresh.
 return {title:title_en,description:description_en,title_ru,title_en,description_ru,description_en,tags:readBuildTags(payload)};
}
export async function listBuilds():Promise<Build[]>{
 const {data,error}=await requireSupabase().from('archive_builds').select(BUILD_FIELDS).order('created_at',{ascending:false});
 if(error)throw error;return data??[];
}
export function buildImageUrl(key:string){return requireSupabase().storage.from(BUCKET).getPublicUrl(key).data.publicUrl;}
export async function createBuild(payload:FormData):Promise<Build>{
 const client=requireSupabase();
 const file=payload.get('image');const text=readTranslations(payload);
 if(!(file instanceof File)||!file.size||file.size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Invalid build.');
 const key=`${crypto.randomUUID()}.${file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp'}`;
 const {error:uploadError}=await client.storage.from(BUCKET).upload(key,file,{contentType:file.type,upsert:false});
 if(uploadError)throw uploadError;
 const {data,error}=await client.from('archive_builds').insert({...text,image_key:key}).select(BUILD_FIELDS).single();
 if(error){await client.storage.from(BUCKET).remove([key]);throw error;}return data;
}

// Storage cleanup follows the confirmed row mutation so a failed write never
// removes the screenshot referenced by a published build.
async function removeImage(key:string):Promise<boolean>{
 try{const {error}=await requireSupabase().storage.from(BUCKET).remove([key]);return !!error}catch{return true}
}
export async function updateBuild(existing:Build,payload:FormData):Promise<{build:Build;cleanupFailed:boolean}>{
 const client=requireSupabase();
 const text=readTranslations(payload);
 const file=payload.get('image');
 const replacement=file instanceof File&&file.size>0?file:null;
 if(replacement&&(replacement.size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(replacement.type)))throw new Error('Invalid screenshot.');
 let key=existing.image_key;
 if(replacement){
  key=`${crypto.randomUUID()}.${replacement.type==='image/jpeg'?'jpg':replacement.type==='image/png'?'png':'webp'}`;
  const {error}=await client.storage.from(BUCKET).upload(key,replacement,{contentType:replacement.type,upsert:false});
  if(error)throw error;
 }
 const {data,error}=await client.from('archive_builds').update({...text,image_key:key}).eq('id',existing.id).eq('image_key',existing.image_key).select(BUILD_FIELDS).single();
 if(error){if(replacement)await removeImage(key);throw error}
 return {build:data,cleanupFailed:replacement?await removeImage(existing.image_key):false};
}
export async function deleteBuild(existing:Build):Promise<boolean>{
 const {data,error}=await requireSupabase().from('archive_builds').delete().eq('id',existing.id).eq('image_key',existing.image_key).select('id,image_key').single();
 if(error)throw error;
 return removeImage(data.image_key);
}
