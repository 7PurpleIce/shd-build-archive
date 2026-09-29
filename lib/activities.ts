// User-provided schedule: 11:00 Moscow is 08:00 UTC throughout the year.
export const ACTIVITY_GROUPS = [
 {id:'raids',en:'Raids',ru:'Рейды',resetDay:2,dayEn:'Tuesday',dayRu:'Вторник',activities:[
  {id:'dark-hours',en:'Dark Hours',ru:'Тяжелые времена'},
  {id:'iron-horse',en:'Iron Horse',ru:'Железный конь'},
 ]},
 {id:'incursions',en:'Incursions',ru:'Вылазки',resetDay:1,dayEn:'Monday',dayRu:'Понедельник',activities:[
  {id:'paradise-lost',en:'Paradise Lost',ru:'Потерянный рай'},
  {id:'broken-rain',en:'Broken Rain',ru:'Косой дождь'},
 ]},
] as const;
export function activityReset(resetDay:1|2,now:Date){
 const instant=now.getTime();
 let target=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+(resetDay-now.getUTCDay()+7)%7,8);
 if(target<=instant)target+=7*86400000;
 const totalMinutes=Math.ceil((target-instant)/60000);
 return {target,days:Math.floor(totalMinutes/1440),hours:Math.floor(totalMinutes%1440/60),minutes:totalMinutes%60};
}
