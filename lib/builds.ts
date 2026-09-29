import {requireSupabase} from './supabase';
export type Build={id:string;title:string;description:string;image_key:string;created_at:string};
const BUCKET='build-images';
export async function listBuilds():Promise<Build[]>{
 const {data,error}=await requireSupabase().from('archive_builds').select('id,title,description,image_key,created_at').order('created_at',{ascending:false});
 if(error)throw error;return data??[];
}
export function buildImageUrl(key:string){return requireSupabase().storage.from(BUCKET).getPublicUrl(key).data.publicUrl;}
export async function createBuild(payload:FormData):Promise<Build>{
 const client=requireSupabase();
 const file=payload.get('image');const title=String(payload.get('title')??'').trim();const description=String(payload.get('description')??'').trim();
 if(!(file instanceof File)||!file.size||file.size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)||!title||title.length>120||!description||description.length>60000)throw new Error('Invalid build.');
 const key=`${crypto.randomUUID()}.${file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp'}`;
 const {error:uploadError}=await client.storage.from(BUCKET).upload(key,file,{contentType:file.type,upsert:false});
 if(uploadError)throw uploadError;
 const {data,error}=await client.from('archive_builds').insert({title,description,image_key:key}).select('id,title,description,image_key,created_at').single();
 if(error){await client.storage.from(BUCKET).remove([key]);throw error;}return data;
}

// Storage cleanup follows the confirmed row mutation so a failed write never
// removes the screenshot referenced by a published build.
async function removeImage(key:string):Promise<boolean>{
 try{const {error}=await requireSupabase().storage.from(BUCKET).remove([key]);return !!error}catch{return true}
}
export async function updateBuild(existing:Build,payload:FormData):Promise<{build:Build;cleanupFailed:boolean}>{
 const client=requireSupabase();
 const title=String(payload.get('title')??'').trim();
 const description=String(payload.get('description')??'').trim();
 const file=payload.get('image');
 const replacement=file instanceof File&&file.size>0?file:null;
 if(!title||title.length>120||!description||description.length>60000)throw new Error('Invalid build.');
 if(replacement&&(replacement.size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(replacement.type)))throw new Error('Invalid screenshot.');
 let key=existing.image_key;
 if(replacement){
  key=`${crypto.randomUUID()}.${replacement.type==='image/jpeg'?'jpg':replacement.type==='image/png'?'png':'webp'}`;
  const {error}=await client.storage.from(BUCKET).upload(key,replacement,{contentType:replacement.type,upsert:false});
  if(error)throw error;
 }
 const {data,error}=await client.from('archive_builds').update({title,description,image_key:key}).eq('id',existing.id).eq('image_key',existing.image_key).select('id,title,description,image_key,created_at').single();
 if(error){if(replacement)await removeImage(key);throw error}
 return {build:data,cleanupFailed:replacement?await removeImage(existing.image_key):false};
}
export async function deleteBuild(existing:Build):Promise<boolean>{
 const {data,error}=await requireSupabase().from('archive_builds').delete().eq('id',existing.id).eq('image_key',existing.image_key).select('id,image_key').single();
 if(error)throw error;
 return removeImage(data.image_key);
}
