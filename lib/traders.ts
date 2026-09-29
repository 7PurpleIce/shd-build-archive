// User-provided recurring schedule, stored in UTC. Moscow is UTC+03:00.
export const TRADER_WINDOWS=[{day:1,hour:0},{day:3,hour:8},{day:5,hour:16}] as const;
export function traderTime(hour:number,locale:'en'|'ru'){
 return `${String(hour+(locale==='ru'?3:0)).padStart(2,'0')}:00`;
}
export function traderToday(now:Date,locale:'en'|'ru'){
 const wall=new Date(now.getTime()+(locale==='ru'?3:0)*3600000);
 return {year:wall.getUTCFullYear(),month:wall.getUTCMonth(),day:wall.getUTCDate()};
}
export function traderEvent(day:number){
 for(const window of TRADER_WINDOWS){
  if(day===window.day)return {kind:'open' as const,hour:window.hour};
  if(day===window.day+1)return {kind:'close' as const,hour:window.hour};
 }
 return null;
}
export function traderMonth(year:number,month:number){
 const first=new Date(Date.UTC(year,month,1));
 const offset=(first.getUTCDay()+6)%7;
 const count=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 const cells=Math.ceil((offset+count)/7)*7;
 return Array.from({length:cells},(_,index)=>{
  const date=new Date(Date.UTC(year,month,index-offset+1));
  return {year:date.getUTCFullYear(),month:date.getUTCMonth(),day:date.getUTCDate(),weekday:date.getUTCDay(),key:date.toISOString().slice(0,10)};
 });
}

export function traderStatus(window:{day:number;hour:number},now:Date){
 const dayMs=86400000;const weekMs=7*dayMs;const instant=now.getTime();
 const monday=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-(now.getUTCDay()+6)%7);
 let openedAt=monday+(window.day-1)*dayMs+window.hour*3600000;
 if(instant<openedAt)openedAt-=weekMs;
 const active=instant<openedAt+dayMs;
 const target=active?openedAt+dayMs:openedAt+weekMs;
 // Round up so a still-closed trader never shows 00h 00m before opening.
 const minutes=Math.max(0,Math.ceil((target-instant)/60000));
 return {active,target,hours:Math.floor(minutes/60),minutes:minutes%60};
}
