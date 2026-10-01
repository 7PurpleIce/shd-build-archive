export const WEAPON_MOD_SLOTS=['optics','magazine','muzzle','underbarrel'] as const;
export type WeaponModSlot=typeof WEAPON_MOD_SLOTS[number];
export type WeaponMod={name:string;category:string;compatibility:string;stats:string};
export function compatibleMod(spec:string,slot:WeaponModSlot,mod:WeaponMod){
 if(mod.category!==slot)return false;
 if(spec.startsWith('fixed:'))return mod.name===spec.slice(6);
 if(!spec.startsWith('type:'))return false;
 return mod.compatibility.split('|').some(type=>type==='@any'||type===spec.slice(5));
}
export function selectedWeaponMods(slots:Record<WeaponModSlot,string>,selections:Partial<Record<WeaponModSlot,string>>,mods:WeaponMod[]){
 return WEAPON_MOD_SLOTS.flatMap(slot=>{
  const spec=slots[slot];const name=spec.startsWith('fixed:')?spec.slice(6):selections[slot];
  const mod=mods.find(m=>m.name===name&&compatibleMod(spec,slot,m));return mod?[mod]:[];
 });
}
export function modStats(mod:WeaponMod){return mod.stats.split('|').flatMap(part=>{
 const match=part.match(/^([^:]+):([+-]?\d+(?:\.\d+)?)(%)?$/);return match?[{id:match[1],value:Number(match[2]),percent:!!match[3]}]:[];
});}
export function attachmentBonuses(mods:WeaponMod[]){
 const totals:Record<string,number>={};
 const mapping:Record<string,string>={'critical-hit-chance':'chc','critical-hit-damage':'chd','headshot-damage':'hsd','weapon-damage':'wd','weapon-handling':'handling','reload-speed':'reload','rate-of-fire':'rof'};
 for(const mod of mods)for(const stat of modStats(mod)){
  const key=stat.id==='magazine-size'?(stat.percent?'mag':'magFlat'):stat.percent?mapping[stat.id]:undefined;
  if(key)totals[key]=(totals[key]||0)+stat.value;
 }
 return totals;
}
export function effectiveWeaponCycle(base:{rpm:number;mag:number;reload:number},bonuses:Record<string,number>){
 return {rpm:Math.max(0,base.rpm*(1+(bonuses.rof||0)/100)),
 magazine:Math.max(1,Math.floor((base.mag+(bonuses.magFlat||0))*(1+(bonuses.mag||0)/100))),
 reload:base.reload/Math.max(.01,1+((bonuses.reload||0)+(bonuses.handling||0))/100)};
}
