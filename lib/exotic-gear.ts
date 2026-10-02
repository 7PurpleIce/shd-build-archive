import extraAttributes from '../data/exotic-gear-attributes.json';
import {calculatorTalents} from './calculator-talents';
import {evaluateTalent,type TalentContext,type TalentEffect} from './talent-effects';
import items from '../data/exotic-gear.json';
import attributes from '../data/attributes.json';
import rawAttributes from '../data/weapon-attributes.json';
import {attributeAmount} from './attribute-values';
import type {GearItem,GearRoll} from './named-gear';
export const exoticGear=items;
export function selectedExoticGear(g:GearItem,slot:number){return g.exotic?items.find(n=>n.id===g.exoticId&&n.slot===slot):undefined;}
export function exoticRollOptions(spec:string,core=false){
 if(spec.startsWith('fixed:'))return [...attributes,...extraAttributes].filter(a=>a.id===spec.slice(6));
 const parts=spec.split('|');const group=parts[0].slice(5);const excluded=parts.slice(1).map(p=>rawAttributes.find(a=>a.id===p.slice(1))?.stat_id);
 return attributes.filter(a=>a.core===core&&!excluded.includes(a.id)&&(group==='gear-offensive-minor'?a.group==='offense':group==='gear-defensive-minor'?a.group==='defense':true));
}
export function selectExoticGear(g:GearItem,slot:number,id:string):GearItem{
 const item=items.find(n=>n.id===id&&n.slot===slot);
 if(!item)return {brand:'',core:{id:'weapon-damage',proto:false},minor:[{id:'',proto:false},{id:'',proto:false}],mod:g.mod,modValue:g.modValue};
 const taken=new Set<string>();
 const roll=(spec:string,core=false):GearRoll=>{const options=exoticRollOptions(spec,core);const a=options.find(a=>core||!taken.has(a.id));if(!a)return {id:'',proto:false};if(!core)taken.add(a.id);return {id:a.id,proto:false,value:attributeAmount(a)};};
 const cores=item.cores.map(spec=>roll(spec,true));
 return {brand:'',exotic:true,exoticId:item.id,core:cores[0],extraCores:cores.slice(1),minor:item.minor.map(spec=>roll(spec)),mod:item.mods?g.mod:'',modValue:g.modValue,extraMods:Array.from({length:Math.max(0,item.mods-1)},()=>({id:''})),effectEnabled:true,effectValues:{}};
}

export function exoticTalent(g:GearItem,slot:number){const item=selectedExoticGear(g,slot);return item?calculatorTalents.find(t=>t.name===item.talent):undefined;}
export function exoticEffect(g:GearItem,slot:number,context:TalentContext):TalentEffect|undefined{
 const talent=exoticTalent(g,slot);if(!talent)return;
 if(talent.name==='Slotted'){
  const per=Number(talent.description.match(/Red:\s*\+(\d+(?:\.\d+)?)%/)?.[1]||0);
  return {bonuses:{chd:g.effectEnabled===false?0:per*g.minor.filter(r=>attributes.find(a=>a.id===r.id)?.group==='offense').length},amps:[]};
 }
 if(talent.name==='Resolved'&&!['marksman-rifle','rifle','pistol'].includes(context.weaponType))return {bonuses:{},amps:[]};
 return evaluateTalent(talent,g.effectEnabled!==false,g.effectValues||{},context);
}
export function gearBrandCounts(gear:GearItem[]){
 const counts:Record<string,number>={};for(const g of gear)if(!g.exotic&&g.brand&&g.brand!=='improvised')counts[g.brand]=(counts[g.brand]||0)+1;
 if(gear.some((g,i)=>exoticTalent(g,i)?.name==='Resourceful'&&g.effectEnabled!==false))for(const brand of Object.keys(counts))counts[brand]++;
 return counts;
}
