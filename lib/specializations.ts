import descriptions from '../data/specialization-talents.json';
import type {TalentEffect} from './talent-effects';
export const SPECIALIZATIONS=[['sharpshooter','Sharpshooter','Меткий стрелок'],['demolitionist','Demolitionist','Подрывник'],['survivalist','Survivalist','Выживальщик'],['gunner','Gunner','Пулемётчик'],['technician','Technician','Техник'],['firewall','Firewall','Огнемётчик']] as const;
export type SpecializationState={id:string;weaponTier:number;conditions:Record<string,boolean>;team:Record<string,boolean>};
export const blankSpecialization=():SpecializationState=>({id:'',weaponTier:3,conditions:{},team:{}});
export function specializationPercent(name:string){const text=(descriptions as Record<string,string>)[name];if(!text)throw new Error('Missing specialization source: '+name);const match=text.match(/([\d.]+)%/);if(!match)throw new Error('Missing specialization percentage: '+name);return Number(match[1]);}
const weaponNodes:Record<string,string>={'assault-rifle':'E.M.I',smg:'Spray and Pray',lmg:'Onslaught',rifle:'This is my Rifle','marksman-rifle':'Depleted Rounds',shotgun:'Running the Gun',pistol:'Gunslinger'};
export function specializationEffect(state:SpecializationState,weaponType:string):TalentEffect{
 const bonuses:Record<string,number>={};const amps:number[]=[];const own=SPECIALIZATIONS.find(s=>s[0]===state.id);
 const add=(key:string,value:number)=>{bonuses[key]=(bonuses[key]||0)+value;};
 const pct=specializationPercent;
 if(own){
  const tier=Math.min(3,Math.max(0,Math.floor(state.weaponTier)));const node=weaponNodes[weaponType];
  if(tier&&node)add('wd',pct(`${own[1]} ${node} Tier ${tier}`));
  if(state.id==='sharpshooter'&&['rifle','marksman-rifle'].includes(weaponType))add('hsd',pct('Sharpshooter One in the Head Tier 5'));
  if(state.id==='gunner'){
   if(state.conditions.kill)add('rof',pct('Gunner Barrage Tier 1'));
   if(state.conditions.still)add('handling',pct('Gunner Emplacement Tier 1'));
  }
  if(state.id==='demolitionist'&&state.conditions.kit)add('handling',Number(descriptions['Demolitionist Stimulant Patch Tier 1'].match(/handling by ([\d.]+)%/)![1]));
  if(state.id==='technician'&&state.conditions.robot)amps.push(pct('Technician Dismantling Tier 4'));
 }
 if(state.team.sharpshooter)add('hsd',pct('Sharpshooter Sharpshooter Tactical Link Tier 1'));
 if(state.team.demolitionist)add('out',pct('Demolitionist Demolitionist Tactical Link Tier 1'));
 if(state.team.survivalist)amps.push(pct('Survivalist Survivalist Tactical Link Tier 1'));
 if(state.team.firewall)amps.push(pct('Firewall Firewall Tactical Link Tier 1'));
 return {bonuses,amps};
}
