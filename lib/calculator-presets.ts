import weapons from '../data/weapons.json';
import attributes from '../data/weapon-attributes.json';
import {initialWeaponRolls} from './weapon-attributes';
import {calculatorTalents} from './calculator-talents';
import {maxWatchPoints} from './shd-watch';
import {applyEventPreset} from './event-bonuses';
export function primaDonnaPreset(){
 const weapon=weapons.find(w=>w.name==='Prima Donna')!;
 const weaponRolls=initialWeaponRolls(weapon.attributes,attributes);
 weaponRolls.minor_1={id:'dtoc-weapon-minor',proto:false,value:10};
 const cores=[22.5,15,15,20.8,22.5,22.5],heads=[15,15,15,14.2,13.2,15];
 const gear=cores.map((value,i)=>({namedId:i===2?'2:Melon Baller':undefined,brand:i===1||i===2?'airaldi-holdings':'aces-eights',core:{id:'weapon-damage',proto:true,value},minor:[{id:'headshot-damage',proto:true,value:heads[i]},{id:i===1||i===2?'weapon-handling':'',proto:true,value:i===1||i===2?8:0}],mod:i<3?'headshot-damage':'',modValue:i<3?10:0}));
 return {weaponId:weapon.id,weaponRolls,gear,watch:maxWatchPoints(),specialization:{id:'sharpshooter',weaponTier:3,conditions:{},team:{}},expertise:30,
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
