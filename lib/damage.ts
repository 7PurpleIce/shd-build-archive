export type DamageInput = {
 base: number; wd: number; twd: number; chc: number; chd: number; hsd: number;
 armor: number; health: number; out: number; armored: boolean; outside: boolean;
 amps: number[]; rpm: number; magazine: number; reload: number; headshots: number;
};
export function calculateDamage(p: DamageInput) {
 const chance=Math.min(60,Math.max(0,p.chc))/100;
 const body=p.base*(1+p.wd/100)*(1+p.twd/100)*(1+(p.armored?p.armor:p.health)/100)*(1+(p.outside?p.out:0)/100)*p.amps.reduce((v,a)=>v*(1+a/100),1);
 const crit=body*(1+p.chd/100), head=body*(1+p.hsd/100), critHead=body*(1+(p.chd+p.hsd)/100);
 const average=body*(1+chance*p.chd/100+Math.min(100,Math.max(0,p.headshots))/100*p.hsd/100);
 const burst=average*p.rpm/60;
 // Ideal continuous cadence: magazine/RPS includes one firing interval per round.
 const sustained=p.rpm>0&&p.magazine>0?average*p.magazine/(p.magazine*60/p.rpm+p.reload):0;
 return {body,crit,head,critHead,average,burst,sustained,chance};
}
export function numericStat(value:string){return Number(value.replace(/[+,%]/g,''));}
export function hasModSlot(slot:number,brand:string){return slot<3||brand==='improvised';}
export function staticBonus(text:string,weaponType:string):{key:string;value:number}[] {
 const weaponNames:Record<string,string>={'assault-rifle':'assault rifle damage',smg:'smg damage',lmg:'lmg damage',rifle:'rifle damage','marksman-rifle':'marksman rifle damage',shotgun:'shotgun damage',pistol:'pistol damage'};
 const keys:Record<string,string>={'weapon damage':'wd','critical hit chance':'chc','critical hit damage':'chd','headshot damage':'hsd','damage to armor':'armor','health damage':'health','damage to targets out of cover':'out','rate of fire':'rof','reload speed':'reload','weapon handling':'handling','magazine size':'mag'};
 return text.split('\n').flatMap(line=>{const m=line.trim().match(/^\+?([\d.]+)%\s*—\s*(.+)$/);if(!m)return [];const name=m[2].toLowerCase();const key=name===weaponNames[weaponType]?'wd':keys[name];return key?[{key,value:Number(m[1])}]:[];});
}
