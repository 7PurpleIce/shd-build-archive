import type {TalentRule,TalentEffect} from './talent-effects';
export type CalculatorSet={id:string;bonuses:{pieces:number;text:string}[];extra?:{name:string;description:string}[]};
const percentages=(text:string)=>[...text.matchAll(/([\d.]+)%/g)].map(m=>Number(m[1]));
const effect=(bonuses:Record<string,number>={},amps:number[]=[]):TalentEffect=>({bonuses,amps});
export function setTalentRule(set:CalculatorSet,chest:boolean,backpack:boolean,magazine:number):TalentRule|undefined{
 const text=set.bonuses.find(b=>b.pieces===4)?.text||'';const p=percentages(text);
 const ct=set.extra?.find(e=>e.name.startsWith('Chest'))?.description||'';
 const bt=set.extra?.find(e=>e.name.startsWith('Backpack'))?.description||'';
 const cp=percentages(ct),bp=percentages(bt);
 const stacked=(max:number,apply:(stacks:number)=>TalentEffect):TalentRule=>({controls:[{id:'stacks',en:'Active stacks',ru:'Активные стаки',max}],apply:v=>apply(v.stacks||0)});
 switch(set.id){
 case 'striker-s-battlegear':return stacked(Number((chest?ct:text).match(chest?/to (\d+)/:/up to (\d+)/)?.[1]),n=>effect({},[(backpack?bp[1]:p[0])*n]));
 case 'heartbreaker':return stacked(Number((chest?ct:text).match(chest?/now (\d+)/:/stack is (\d+)/)?.[1]),n=>effect({},[p[1]*n]));
 case 'ongoing-directive':return {controls:[],apply:()=>effect({},[chest?cp[0]:p[0]])};
 case 'future-initiative':return {controls:[],apply:()=>effect({twd:chest?cp[1]:p[0]})};
 case 'true-patriot':return {controls:[],apply:()=>effect({},[backpack?bp[1]:p[0]])};
 case 'concentrated-company':return stacked(Number(text.match(/stacks is (\d+)/)?.[1]),n=>effect({wd:(backpack?bp[1]:p[0])*n,chd:p[1]*n}));
 case 'tipping-scales':return stacked(Number((chest?ct:text).match(chest?/to (\d+)/:/max of (\d+)/)?.[1]),n=>effect({handling:p[0]*n,chd:(backpack?bp[1]:p[1])*n}));
 case 'umbra-initiative':return stacked(Number((chest?ct:text).match(/to (\d+)/)?.[1]),n=>effect({chd:p[1]*n,rof:p[2]*n}));
 case 'negotiator-s-dilemma':return {...stacked(Number(text.match(/up to (\d+) times/)?.[1]),n=>effect({chd:p[1]*n})),note:['Crit damage is included; damage copied to other targets is not part of single-target DPS.','Критический урон учтён; перенос урона на другие цели не входит в DPS одной цели.']};
 case 'breaking-point':return {...stacked(magazine,n=>effect({handling:p[0]*n,wd:(backpack?bp[1]:p[1])*n})),apply:(v,c)=>['rifle','marksman-rifle'].includes(c.weaponType)?effect({handling:p[0]*(v.stacks||0),wd:(backpack?bp[1]:p[1])*(v.stacks||0)}):effect()};
 case 'aces-eights':return {controls:[],note:['Enhanced next shot only; the card cycle is not included in DPS.','Только следующий усиленный выстрел; цикл карт не включён в DPS.'],apply:(_,c)=>['rifle','marksman-rifle'].includes(c.weaponType)?{...effect({},[chest?cp[1]:p[0]]),nextShot:true}:effect()};
 case 'eclipse-protocol':return backpack?{controls:[],apply:()=>effect({},[bp[0]])}:undefined;
 case 'ortiz-exuro':return backpack?{controls:[],apply:()=>effect({},[bp[0]])}:undefined;
 case 'tip-of-the-spear':return backpack?{controls:[],apply:()=>effect({},[bp[0]])}:undefined;
 default:return undefined;
 }
}
export function evaluateSetRule(rule:TalentRule,enabled:boolean,values:Record<string,number>,context:{weaponType:string;magazine:number;armored:boolean}){
 if(!enabled)return effect();const clean:Record<string,number>={};
 for(const c of rule.controls){const value=values[c.id]??c.max;clean[c.id]=Number.isFinite(value)?Math.min(c.max,Math.max(0,Math.floor(value))):0;}
 return rule.apply(clean,context);
}
