import {talentRule,type TalentSource} from './talent-effects';
/** Character baseline, separate from item rolls and SHD watch bonuses. */
export const BASE_CHARACTER_CHD=25;
export function initialTalentState(talent:TalentSource|undefined){
 const rule=talent&&talentRule(talent);
 return {active:!!rule,values:rule?Object.fromEntries(rule.controls.map(c=>[c.id,c.id==='stacks'?c.max:0])):{}};
}
export function baseCalculatorBonuses():Record<string,number>{return {wd:0,twd:0,chc:0,chd:BASE_CHARACTER_CHD,hsd:0,armor:0,health:0,out:0,rof:0,reload:0,mag:0,handling:0};}
