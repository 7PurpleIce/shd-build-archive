import named from '../data/named-gear.json';
import fixedAttributes from '../data/named-gear-attributes.json';
import attributes from '../data/attributes.json';
import {attributeAmount,attributeRollAmount} from './attribute-values';
import {hasModSlot} from './damage';
export type GearRoll={id:string;proto:boolean;value?:number};
export type GearItem={brand:string;namedId?:string;core:GearRoll;minor:GearRoll[];mod:string;modValue?:number;extraMods?:{id:string;value?:number}[]};
export const namedGear=named;
export function selectedNamedGear(g:GearItem,slot:number){return named.find(n=>n.id===g.namedId&&n.brand===g.brand&&n.slot===slot);}
export function gearAttribute(id:string){return attributes.find(a=>a.id===id)||fixedAttributes.find(a=>a.id===id);}
export function gearStatId(id:string){return fixedAttributes.find(a=>a.id===id)?.statId||id;}
export function isNamedAttribute(id:string){return fixedAttributes.some(a=>a.id===id);}
export function gearRollAmount(roll:GearRoll){const a=gearAttribute(roll.id);if(!a)return 0;const n=attributeRollAmount(a,roll);return isNamedAttribute(roll.id)?Math.max(Math.min(1,attributeAmount(a,roll.proto)),n):n;}
export function gearModCount(g:GearItem,slot:number){return selectedNamedGear(g,slot)?.mods??Number(hasModSlot(slot,g.brand));}
/** Keep ordinary rolls, remove stale unique rolls, then install the new item's fixed slots. */
export function selectNamedGear(g:GearItem,slot:number,id:string):GearItem{
 const item=named.find(n=>n.id===id&&n.slot===slot&&n.brand===g.brand);
 const proto=g.core.proto;
 const clean=(r:GearRoll,core=false):GearRoll=>isNamedAttribute(r.id)?{id:core?'weapon-damage':'',proto}:r;
 const fixed=(spec:string,old:GearRoll):GearRoll=>spec.startsWith('fixed:')?{id:spec.slice(6),proto,value:attributeAmount(gearAttribute(spec.slice(6))!,proto)}:old;
 const minor=(item?.minor||['type:gear-minor','type:gear-minor']).map((spec,i)=>fixed(spec,clean(g.minor[i]||{id:'',proto})));
 const seen=new Set<string>();for(let i=0;i<minor.length;i++)if(isNamedAttribute(minor[i].id))seen.add(gearStatId(minor[i].id));
 for(let i=0;i<minor.length;i++)if(!isNamedAttribute(minor[i].id)&&minor[i].id){if(seen.has(minor[i].id))minor[i]={id:'',proto};else seen.add(minor[i].id);}
 const next={...g,namedId:item?.id,core:fixed(item?.core||'type:gear-core',clean(g.core,true)),minor};
 const mods=gearModCount(next,slot);
 return {...next,mod:mods?g.mod:'',extraMods:Array.from({length:Math.max(0,mods-1)},(_,i)=>g.extraMods?.[i]||{id:''})};
}
export function gearRollBonuses(g:GearItem,slot:number,weaponType:string,isSet=false){
 const item=selectedNamedGear(g,slot);const count=item?.minor.length??(isSet?1:2);
 const keys:Record<string,string>={'weapon-damage':'wd','critical-hit-chance':'chc','critical-hit-damage':'chd','headshot-damage':'hsd','weapon-handling':'handling','dtoc':'out','damage-to-armor':'armor','health-damage':'health','rate-of-fire':'rof'};
 const result:Record<string,number>={};
 for(const [index,roll] of [g.core,...g.minor.slice(0,count)].entries()){
  // Unique stats are valid only in their source item and source slot.
  if(isNamedAttribute(roll.id)&&(index===0?item?.core:item?.minor[index-1])!==`fixed:${roll.id}`)continue;
  const stat=gearStatId(roll.id);const key=stat==='pistol-damage'?(weaponType==='pistol'?'wd':''):keys[stat];
  if(key)result[key]=(result[key]||0)+gearRollAmount(roll);
 }
 return result;
}
