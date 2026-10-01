export const WATCH_CAP=50;
export const WATCH_STATS=[
 {id:'wd',group:'offense',en:'Weapon Damage',ru:'Урон от оружия',max:10,damageKey:'wd'},
 {id:'chc',group:'offense',en:'Critical Hit Chance',ru:'Шанс крит. попадания',max:10,damageKey:'chc'},
 {id:'chd',group:'offense',en:'Critical Hit Damage',ru:'Критический урон',max:20,damageKey:'chd'},
 {id:'hsd',group:'offense',en:'Headshot Damage',ru:'Урон в голову',max:20,damageKey:'hsd'},
 {id:'armor',group:'defense',en:'Total Armor',ru:'Общая броня',max:10,damageKey:null},
 {id:'health',group:'defense',en:'Health',ru:'Здоровье',max:10,damageKey:null},
 {id:'hazard',group:'defense',en:'Hazard Protection',ru:'Защита от факторов риска',max:10,damageKey:null},
 {id:'explosive',group:'defense',en:'Explosive Resistance',ru:'Сопротивление взрывам',max:10,damageKey:null},
 {id:'skillDamage',group:'skill',en:'Skill Damage',ru:'Урон от навыков',max:10,damageKey:null},
 {id:'skillHaste',group:'skill',en:'Skill Haste',ru:'Убыстрение',max:10,damageKey:null},
 {id:'skillDuration',group:'skill',en:'Skill Duration',ru:'Длительность навыков',max:20,damageKey:null},
 {id:'repair',group:'skill',en:'Repair Skills',ru:'Ремонт навыками',max:10,damageKey:null},
 {id:'reload',group:'handling',en:'Reload Speed',ru:'Скорость перезарядки',max:10,damageKey:'reload'},
 {id:'accuracy',group:'handling',en:'Accuracy',ru:'Точность',max:10,damageKey:null},
 {id:'stability',group:'handling',en:'Stability',ru:'Стабильность',max:10,damageKey:null},
 {id:'ammo',group:'handling',en:'Ammo Capacity',ru:'Боезапас',max:20,damageKey:null},
] as const;
export type WatchPoints=Partial<Record<typeof WATCH_STATS[number]['id'],number>>;
export function clampWatchPoints(value:number){return Number.isFinite(value)?Math.max(0,Math.min(WATCH_CAP,Math.floor(value))):0;}
export function watchBonus(points:number,max:number){return clampWatchPoints(points)*max/WATCH_CAP;}
export function watchDamageBonuses(points:WatchPoints){
 const result:Record<string,number>={};
 for(const stat of WATCH_STATS)if(stat.damageKey)result[stat.damageKey]=watchBonus(points[stat.id]||0,stat.max);
 return result;
}

export function maxWatchPoints():WatchPoints{return Object.fromEntries(WATCH_STATS.map(stat=>[stat.id,WATCH_CAP]));}
