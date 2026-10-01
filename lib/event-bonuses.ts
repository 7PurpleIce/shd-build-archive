import type {TalentEffect} from './talent-effects';
export const EVENT_BONUS_TYPES=[
 ['wd','Weapon Damage','Урон оружия'],['twd','Total Weapon Damage','Общий урон оружия'],
 ['hsd','Headshot Damage','Урон в голову'],['chd','Critical Hit Damage','Критический урон'],
 ['chc','Critical Hit Chance','Шанс критического попадания'],['out','Damage to Targets out of Cover','Урон по цели вне укрытия'],
 ['armor','Damage to Armor','Урон по броне'],['health','Damage to Health','Урон по здоровью'],
 ['amp','Independent damage multiplier','Независимый множитель урона'],['rof','Rate of Fire','Скорострельность']
] as const;
export type EventBonusType=typeof EVENT_BONUS_TYPES[number][0];
export type EventBonus={id:string;type:EventBonusType;value:number;name:string;enabled:boolean};
export function eventBonusEffect(rows:EventBonus[]):TalentEffect{
 const bonuses:Record<string,number>={};const amps:number[]=[];
 for(const row of rows){
  if(!row.enabled||!Number.isFinite(row.value)||!EVENT_BONUS_TYPES.some(t=>t[0]===row.type))continue;
  const value=Math.max(0,Math.min(10000,row.value));
  if(row.type==='amp'){if(value)amps.push(value);}else bonuses[row.type]=(bonuses[row.type]||0)+value;
 }
 return {bonuses,amps};
}
