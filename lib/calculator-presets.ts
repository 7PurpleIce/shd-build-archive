import {selectExoticGear} from './exotic-gear';
import type {GearItem} from './named-gear';
import type {WeaponModSlot} from './weapon-mods';
import weapons from '../data/weapons.json';
import attributes from '../data/weapon-attributes.json';
import {initialWeaponRolls,setWeaponPrototype} from './weapon-attributes';
import {calculatorTalents} from './calculator-talents';
import {maxWatchPoints} from './shd-watch';
import {applyEventPreset} from './event-bonuses';
export function primaDonnaPreset(){
 const weapon=weapons.find(w=>w.name==='Prima Donna')!;
 const weaponRolls=initialWeaponRolls(weapon.attributes,attributes);
 weaponRolls.minor_1={id:'dtoc-weapon-minor',proto:false,value:10};
 const cores=[22.5,15,15,20.8,22.5,22.5],heads=[15,15,15,14.2,13.2,15];
 const gear=cores.map((value,i)=>({namedId:i===2?'2:Melon Baller':undefined,brand:i===1||i===2?'airaldi-holdings':'aces-eights',core:{id:'weapon-damage',proto:true,value},minor:[{id:'headshot-damage',proto:true,value:heads[i]},{id:i===1||i===2?'weapon-handling':'',proto:true,value:i===1||i===2?8:0}],mod:i<3?'headshot-damage':'',modValue:i<3?10:0}));
 return {attachments:{} as Partial<Record<WeaponModSlot,string>>,baseOverride:null as number|null,weaponId:weapon.id,weaponRolls,gear,watch:maxWatchPoints(),specialization:{id:'sharpshooter',weaponTier:3,conditions:{},team:{}},expertise:30,
 talents:['',calculatorTalents.find(t=>t.name==='Headhunter')!.id,calculatorTalents.find(t=>t.name==='Perfect Concussion')!.id],active:[true,true,true],
 talentValues:[{stacks:10},{previous:71541528},{mode:3}] as Record<string,number>[],
 setStates:{'aces-eights':{enabled:true,values:{}}},
 eventBonuses:applyEventPreset([],'deadeye-overdrive'),armored:false,outside:true,headshots:100};
}

export function mantisPreset(){
 const preset=primaDonnaPreset();const weapon=weapons.find(w=>w.name==='Mantis')!;
 return {...preset,weaponId:weapon.id,weaponRolls:initialWeaponRolls(weapon.attributes,attributes),talentValues:[{},{previous:54751504},{mode:3}] as Record<string,number>[]};
}
export const CALCULATOR_PRESETS=[
 {id:'prima-donna',en:'Prima Donna · Aces & Eights',ru:'Примадонна · Тузы и восьмёрки',headDamage:71541516.14,create:primaDonnaPreset},
 {id:'mantis',en:'Mantis · Aces & Eights',ru:'Богомол · Тузы и восьмёрки',headDamage:54751525.80,create:mantisPreset},
] as const;

/** Screenshot configuration supplied for CoCo - Striker 2.0, 2026-10-02. */
export function cocoStrikerPreset(){
 const weapon=weapons.find(w=>w.name==='Lexington')!;
 const base=primaDonnaPreset();
 const gear:GearItem[]=Array.from({length:6},(_,i)=>({brand:i===1?'ceska-vyroba-s-r-o':'concentrated-company',
  core:{id:'weapon-damage',proto:true,value:22.5},
  minor:i===1?[{id:'critical-hit-chance',proto:true,value:9},{id:'critical-hit-damage',proto:true,value:18}]:[{id:'critical-hit-damage',proto:true,value:18},{id:'',proto:true}],
  mod:i===1?'critical-hit-chance':i<3?'critical-hit-damage':'',modValue:i===1?6:i<3?12:0}));
 gear[3]=selectExoticGear(gear[3],3,'3:Overdogs');
 return {...base,weaponId:weapon.id,baseOverride:48699.5,weaponRolls:setWeaponPrototype(weapon.attributes,initialWeaponRolls(weapon.attributes,attributes),attributes,true),
  gear,expertise:30,watch:maxWatchPoints(),specialization:{id:'gunner',weaponTier:3,conditions:{kill:true,still:true},team:{}},
  attachments:{optics:'C79 Scope (3.4x)',magazine:'Sturdy Extended 5.56 Mag',muzzle:'Muzzle Brake 5.56',underbarrel:'Laser Pointer'} as Partial<Record<WeaponModSlot,string>>,
  talents:[calculatorTalents.find(t=>t.name==='Killer')!.id,calculatorTalents.find(t=>t.name==='Obliterate')!.id,''],active:[true,true,false],
  talentValues:[{},{stacks:20},{}] as Record<string,number>[],setStates:{'concentrated-company':{enabled:true,values:{stacks:35}}},eventBonuses:[],armored:true,outside:true,headshots:0};
}
const linkedPresets=[{id:'coco-striker-2',en:'CoCo - Striker 2.0',ru:'Точка концентрации - Боевик 2.0',create:cocoStrikerPreset}];
export function findCalculatorPreset(id:string){return [...CALCULATOR_PRESETS,...linkedPresets].find(p=>p.id===id);}
