export type WeaponAttribute={id:string;stat_id:string;range_min:string;range_max:string;proto_max:string;compatibility:string;fidelity:string};
export type WeaponRoll={id:string;proto:boolean;value:number};
export type WeaponRolls=Record<string,WeaponRoll>;
export const WEAPON_ATTRIBUTE_SLOTS=['core_1','core_2','core_3','minor_1','minor_2','minor_3'] as const;
export function attributeOptions(spec:string,all:WeaponAttribute[]){
 if(spec.startsWith('fixed:'))return all.filter(a=>a.id===spec.split(':')[1]);
 if(!spec.startsWith('type:'))return [];
 const [type,...excluded]=spec.slice(5).split('|');
 return all.filter(a=>a.compatibility.split('|').includes(type)&&!excluded.includes('!'+a.id));
}
export function weaponRollMax(a:WeaponAttribute,proto:boolean,spec:string){
 const fixed=spec.startsWith('fixed:')?spec.split(':')[2]:undefined;
 return parseFloat(fixed||(proto?a.proto_max:a.range_max));
}
export function initialWeaponRolls(specs:Record<string,string>,all:WeaponAttribute[],zero=false):WeaponRolls{
 return Object.fromEntries(WEAPON_ATTRIBUTE_SLOTS.map(slot=>{
  const spec=specs[slot];const a=spec.startsWith('fixed:')?attributeOptions(spec,all)[0]:undefined;
  return [slot,{id:a?.id||'',proto:false,value:a&&!zero?weaponRollMax(a,false,spec):0}];
 }));
}
export function weaponAttributeBonuses(specs:Record<string,string>,rolls:WeaponRolls,all:WeaponAttribute[]){
 const result:Record<string,number>={};const seen=new Set<string>();
 const keys:Record<string,string>={'critical-hit-chance':'chc','critical-hit-damage':'chd','headshot-damage':'hsd','health-damage':'health','dtoc':'out','damage-to-armor':'armor','reload-speed':'reload','rate-of-fire':'rof','magazine-size':'mag','skill-tier':'skillTier'};
 for(const slot of WEAPON_ATTRIBUTE_SLOTS){
  const r=rolls[slot];if(!r)continue;
  const spec=specs[slot];const a=attributeOptions(spec,all).find(a=>a.id===r.id);
  if(!a||seen.has(a.stat_id))continue;seen.add(a.stat_id);
  const key=a.stat_id.endsWith('-damage')&&/^(assault-rifle|smg|lmg|rifle|marksman-rifle|shotgun|pistol)-damage$/.test(a.stat_id)?'wd':keys[a.stat_id];
  if(key)result[key]=(result[key]||0)+(Number.isFinite(r.value)?Math.min(weaponRollMax(a,r.proto,spec),Math.max(0,r.value)):0);
 }
 return result;
}
