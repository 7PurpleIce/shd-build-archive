import {createClient} from '@supabase/supabase-js';
import config from './supabase-config.json';
const url=import.meta.env.VITE_SUPABASE_URL || config.url;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || config.publishableKey;
// A publishable key is intentionally public. Authorization lives in database RLS.
export const supabase=url&&key?createClient(url,key):null;
export function requireSupabase(){if(!supabase)throw new Error('Supabase is not configured.');return supabase;}
export function assetPath(path:string){return path.startsWith('/')?`${import.meta.env.BASE_URL}${path.slice(1)}`:path;}
