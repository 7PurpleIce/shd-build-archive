import {calculateDamage,type DamageInput} from './damage';
import type {TalentEffect} from './talent-effects';
/** Evaluate the selected shot. Repeatable DPS excludes effects marked next-shot only. */
function shot(input:DamageInput,effects:TalentEffect[]){
 const criticalChance=effects.map(e=>e.criticalChance).find(v=>v!==undefined);
 const forceHead=effects.some(e=>e.forceHead);
 const headMultiplier=effects.reduce((m,e)=>m*(1+(e.headAmp||0)/100),1);
 const baseMultiplier=effects.reduce((m,e)=>m*(e.baseMultiplier??1),1);
 const p={...input,base:input.base*baseMultiplier,amps:[...input.amps,...effects.flatMap(e=>e.amps)]};
 const result=calculateDamage(p);
 const chance=criticalChance??result.chance;
 let additive=0;
 for(const e of effects){if(!e.headhunter)continue;const h=e.headhunter;
  const cap=p.base*(1+p.wd/100)*(1+p.twd/100)*(1+(p.armored?p.armor:p.health)/100)*(p.hsd>h.threshold?h.high:h.low)/100;
  additive+=Math.min(h.previous*h.scale/100,cap);
 }
 const head=result.head*headMultiplier,critHead=result.critHead*headMultiplier;
 const body=forceHead?head:result.body,crit=forceHead?critHead:result.crit;
 const headShare=forceHead?1:Math.min(100,Math.max(0,p.headshots))/100;
 const average=(1-headShare)*((1-chance)*result.body+chance*result.crit)+headShare*((1-chance)*head+chance*critHead)+additive;
 return {...result,body:body+additive,crit:crit+additive,head:head+additive,critHead:critHead+additive,average,chance,additive,
 burst:average*p.rpm/60,sustained:p.rpm>0&&p.magazine>0?average*p.magazine/(p.magazine*60/p.rpm+p.reload):0};
}
export function talentDamage(input:DamageInput,effects:TalentEffect[]){
 const result=shot(input,effects);const singleShot=effects.some(e=>e.nextShot);
 const repeatableInput={...input};
 for(const e of effects.filter(e=>e.nextShot))for(const key of ['wd','twd','chc','chd','hsd','armor','health','out'] as const)repeatableInput[key]-=e.bonuses[key]||0;
 const repeatable=singleShot?shot(repeatableInput,effects.filter(e=>!e.nextShot)):result;
 return {...result,burst:repeatable.burst,sustained:repeatable.sustained,singleShot};
}
