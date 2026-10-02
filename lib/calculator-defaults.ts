import {talentRule,type TalentSource} from './talent-effects';
/** Character baseline, separate from item rolls and SHD watch bonuses. */
export const BASE_CHARACTER_CHD=25;
export function initialTalentState(talent:(TalentSource&{exotic?:boolean})|undefined){
 const rule=talent&&talentRule(talent);
 const values:Record<string,number>=rule?Object.fromEntries(rule.controls.map(c=>[c.id,c.id==='stacks'?c.max:0])):{};
 // Explicit combat states: never maximize inputs such as skill tier or status-effect stats.
 const exoticDefaults:Record<string,Record<string,number>>={
  'Bond':{source:2},'Decoy King':{phase:4},'Kill Confirmed':{short:1},
  'Adaptive Instincts':{head:1,body:1,legs:1},'Agonizing Bite':{marked:1},
  'Gangland Hit':{marks:1},'Blossom Harvest':{remaining:200},
  'Rebalance':{red:79,blue:80},
 };
 if(talent?.exotic)Object.assign(values,exoticDefaults[talent.name]||{});
 return {active:!!rule,values};
}
export function baseCalculatorBonuses():Record<string,number>{return {wd:0,twd:0,chc:0,chd:BASE_CHARACTER_CHD,hsd:0,armor:0,health:0,out:0,rof:0,reload:0,mag:0,handling:0};}
