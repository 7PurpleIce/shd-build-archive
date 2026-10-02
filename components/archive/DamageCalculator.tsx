import type {CalculatorLoadRequest} from '@/lib/build-calculator-links';
import {exoticGear,selectedExoticGear,exoticRollOptions,selectExoticGear,exoticTalent,exoticEffect,gearBrandCounts} from '@/lib/exotic-gear';
import {namedGear,selectedNamedGear,gearAttribute,gearStatId,isNamedAttribute,gearModCount,selectNamedGear,gearRollBonuses,type GearItem} from '@/lib/named-gear';
import {CalculatorPanel} from './CalculatorPanel';
import {CALCULATOR_PRESETS,findCalculatorPreset} from '@/lib/calculator-presets';
import {EventBonuses} from './EventBonuses';
import {eventBonusEffect,type EventBonus} from '@/lib/event-bonuses';
import {SpecializationStats} from './SpecializationStats';
import {blankSpecialization,specializationEffect} from '@/lib/specializations';
import {formatGameText} from '@/lib/number-format';
import {useEffect,useState} from 'react';
import {Crosshair, Shield, Sparkles, ChartNoAxesCombined, RotateCcw, ScanFace, Shirt, Backpack, Hand, Package, Footprints} from 'lucide-react';
import {CalculatorPanelHeading} from './CalculatorPanelHeading';
import {CalculatorNumber} from './CalculatorNumber';
import {CalculatorSelect} from './CalculatorSelect';
import {WatchStats} from './WatchStats';
import {WeaponAttributes} from './WeaponAttributes';
import weaponAttributes from '@/data/weapon-attributes.json';
import {initialWeaponRolls,weaponAttributeBonuses} from '@/lib/weapon-attributes';
import {calculatorTalents,weaponTalent,selectableTalents,namedTalentGear} from '@/lib/calculator-talents';
import {initialTalentState,baseCalculatorBonuses,BASE_CHARACTER_CHD} from '@/lib/calculator-defaults';
import {setTalentRule,evaluateSetRule} from '@/lib/set-effects';
import {talentDamage} from '@/lib/talent-damage';
import {talentRule,evaluateTalent,talentStatus} from '@/lib/talent-effects';
import {watchDamageBonuses,maxWatchPoints,type WatchPoints} from '@/lib/shd-watch';
import weapons from '@/data/weapons.json';
import attributes from '@/data/attributes.json';
import mods from '@/data/gear-mods.json';
import catalog from '@/data/catalog.json';
import {attributeAmount,attributeRollAmount,setAttributePrototype} from '@/lib/attribute-values';
import weaponMods from '@/data/weapon-mods.json';
import {WEAPON_MOD_SLOTS,compatibleMod,selectedWeaponMods,attachmentBonuses,modStats,effectiveWeaponCycle,type WeaponModSlot} from '@/lib/weapon-mods';
import {numericStat,staticBonus} from '@/lib/damage';
import {useLocale} from './Locale';
import {useOwner} from './OwnerAuth';
import {SectionHeading} from './SectionHeading';
import './damage.css';
const types=[['assault-rifle','Assault rifles','Штурмовые винтовки'],['smg','SMGs','Пистолеты-пулемёты'],['lmg','LMGs','Пулемёты'],['rifle','Rifles','Винтовки'],['marksman-rifle','Marksman rifles','Снайперские винтовки'],['shotgun','Shotguns','Дробовики'],['pistol','Pistols','Пистолеты']] as const;
const slotIcons=[ScanFace,Shirt,Backpack,Hand,Package,Footprints];
const slots=[['Mask','Маска'],['Chest','Броня'],['Backpack','Рюкзак'],['Gloves','Перчатки'],['Holster','Кобура'],['Kneepads','Наколенники']] as const;
type Roll={id:string;proto:boolean;value?:number};
type Gear=GearItem;
const blankGear=():Gear[]=>slots.map(()=>({brand:'',core:{id:'weapon-damage',proto:false},minor:[{id:'',proto:false},{id:'',proto:false}],mod:''}));
const statKey:Record<string,string>={'weapon-damage':'wd','critical-hit-chance':'chc','critical-hit-damage':'chd','headshot-damage':'hsd','weapon-handling':'handling'};
export default function DamageCalculator({loadRequest}:{loadRequest?:CalculatorLoadRequest|null}){const {canUseCalculator}=useOwner();return canUseCalculator?<CalculatorBody loadRequest={loadRequest}/>:null;}
function CalculatorBody({loadRequest}:{loadRequest?:CalculatorLoadRequest|null}){
 const {t,locale}=useLocale();
 const [presetId,setPresetId]=useState<string>('');
 const selectedPreset=findCalculatorPreset(presetId);
 const [weaponId,setWeaponId]=useState(weapons.find(w=>w.name==='FAMAS 2010')!.id);
 const weapon=weapons.find(w=>w.id===weaponId)!;
 const [attachments,setAttachments]=useState<Partial<Record<WeaponModSlot,string>>>({});
 const [query,setQuery]=useState('');const [override,setOverride]=useState<number|null>(null);
 const [gear,setGear]=useState<Gear[]>(blankGear);
 const [editingSlot,setEditingSlot]=useState(0);
 const [weaponRolls,setWeaponRolls]=useState(()=>initialWeaponRolls(weapon.attributes,weaponAttributes));
 const [talentValues,setTalentValues]=useState<Record<string,number>[]>([{},{},{}]);
 const [watch,setWatch]=useState<WatchPoints>(maxWatchPoints);const [specialization,setSpecialization]=useState(blankSpecialization);const [expertise,setExpertise]=useState(0);
 const [setStates,setSetStates]=useState<Record<string,{enabled:boolean;values:Record<string,number>}>>({});
 const [talents,setTalents]=useState(['','','']);const [active,setActive]=useState([false,false,false]);
 const [armored,setArmored]=useState(true);const [outside,setOutside]=useState(true);const [headshots,setHeadshots]=useState(0);
 const factor=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(n);
 const fmt=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
 const [eventBonuses,setEventBonuses]=useState<EventBonus[]>([]);
 const eventEffect=eventBonusEffect(eventBonuses);
 const totals=baseCalculatorBonuses();
 const add=(key:string,value:number)=>{totals[key]=(totals[key]||0)+value;};
 Object.entries(eventEffect.bonuses).forEach(([key,value])=>add(key,value));
 const counts=gearBrandCounts(gear);
 const activeSets=catalog.sets.filter(s=>counts[s.id]);
 for(const s of activeSets)for(const b of s.bonuses)if(b.pieces<=counts[s.id])for(const v of staticBonus(b.text,weapon.type))add(v.key,v.value);
 for(const [i,g] of gear.entries()){
  const isSet=catalog.sets.find(s=>s.id===g.brand)?.kind==='set';
  Object.entries(gearRollBonuses(g,i,weapon.type,isSet)).forEach(([key,value])=>add(key,value));
  for(const roll of [{id:g.mod,value:g.modValue},...(g.extraMods||[])].slice(0,gearModCount(g,i))){const mod=mods.find(m=>m.id===roll.id);if(mod&&statKey[mod.id])add(statKey[mod.id],Math.max(0,Math.min(numericStat(mod.value),roll.value??numericStat(mod.value))));}
 }
 const specEffect=specializationEffect(specialization,weapon.type);
 Object.entries(specEffect.bonuses).forEach(([key,value])=>add(key,value));
 const talentAmps:number[]=[...specEffect.amps,...eventEffect.amps];
 const talentAllowed=[true, !gear[1].exotic&&catalog.sets.find(s=>s.id===gear[1].brand)?.kind!=='set'&&gear[1].brand!=='improvised', !gear[2].exotic&&catalog.sets.find(s=>s.id===gear[2].brand)?.kind!=='set'&&gear[2].brand!=='improvised'];
 const selectedTalents=talents.map((id,i)=>i===0?weaponTalent(weapon.talentSlot,id):talentAllowed[i]?calculatorTalents.find(t=>t.id===id):undefined);
 const equippedMods=selectedWeaponMods(weapon.slots,attachments,weaponMods);
 const modBonuses=attachmentBonuses(equippedMods);
 Object.entries(modBonuses).forEach(([key,value])=>add(key,value));
 Object.entries(watchDamageBonuses(watch)).forEach(([key,value])=>add(key,value));
 Object.entries(weaponAttributeBonuses(weapon.attributes,weaponRolls,weaponAttributes,weapon.exotic)).forEach(([key,value])=>add(key,value));
 const talentContext={weaponType:weapon.type,magazine:effectiveWeaponCycle(weapon,totals).magazine,armored,redCores:gear.filter(g=>g.core.id==='weapon-damage').length};
 let noReload=false;
 const setRules=activeSets.filter(s=>s.kind==='set'&&counts[s.id]>=4).map(s=>({set:s,rule:setTalentRule(s,gear[1].brand===s.id,gear[2].brand===s.id,talentContext.magazine)}));
 const setEffects=setRules.flatMap(({set:s,rule})=>rule?[evaluateSetRule(rule,setStates[s.id]?.enabled??true,setStates[s.id]?.values||{},talentContext)]:[]);
 const talentEffects=selectedTalents.map((talent,i)=>talent?evaluateTalent(talent,active[i],talentValues[i],talentContext):undefined);
 const exoticEffects=gear.map((g,i)=>exoticEffect(g,i,talentContext));
 const allTalentEffects=[...talentEffects,...exoticEffects];
 [...allTalentEffects,...setEffects].forEach(effect=>{if(!effect)return;Object.entries(effect.bonuses).forEach(([key,value])=>add(key,value));talentAmps.push(...effect.amps);noReload ||= !!effect.noReload;});
 const base=override??weapon.damage;
 const wd=totals.wd+expertise;
 const cycle=effectiveWeaponCycle(weapon,totals);
 const {rpm}=cycle;const magBasePercent=allTalentEffects.reduce((sum,e)=>sum+(e?.magBasePercent||0),0);const magazine=cycle.magazine+Math.floor(weapon.mag*magBasePercent/100);const reload=noReload?0:cycle.reload;
 const result=talentDamage({base,wd,twd:totals.twd,chc:totals.chc,chd:totals.chd,hsd:weapon.hsd+totals.hsd,armor:totals.armor,health:totals.health,out:totals.out,armored,outside,amps:[],rpm,magazine,reload,headshots},[...allTalentEffects,...setEffects,{bonuses:{},amps:[...specEffect.amps,...eventEffect.amps]}].filter((e):e is NonNullable<typeof e>=>!!e));
 function changeWeapon(id:string){const next=weapons.find(w=>w.id===id)!;setWeaponId(id);setWeaponRolls(initialWeaponRolls(next.attributes,weaponAttributes));setOverride(null);setAttachments({});setQuery('');setTalents(old=>['',old[1],old[2]]);const state=initialTalentState(weaponTalent(next.talentSlot,''));setActive(old=>[state.active,old[1],old[2]]);setTalentValues(old=>[state.values,old[1],old[2]]);}
 function changeGear(i:number,patch:Partial<Gear>){if(patch.brand!==undefined&&(i===1||i===2)){const chosen=selectedTalents[i];if(chosen?.perfect&&!namedTalentGear(chosen.kind,chosen.name).some(g=>g.brand===patch.brand)){setTalents(old=>old.map((v,j)=>j===i?'':v));setActive(old=>old.map((v,j)=>j===i?false:v));setTalentValues(old=>old.map((v,j)=>j===i?{}:v));}}setGear(old=>old.map((g,j)=>{if(j!==i)return g;const next=patch.brand!==undefined&&patch.brand!==g.brand?selectNamedGear({...g,...patch},i,''):{...g,...patch};if(catalog.sets.find(s=>s.id===next.brand)?.kind==='set')next.minor=[next.minor[0],{id:'',proto:next.core.proto}];if(!gearModCount(next,i))next.mod='';return next;}));}
 function chooseExoticItem(i:number,id:string){
  const next=selectExoticGear(gear[i],i,id);
  setGear(old=>old.map((g,j)=>j===i?next:g));
  if(i===1||i===2){setTalents(old=>old.map((v,j)=>j===i?'':v));setActive(old=>old.map((v,j)=>j===i?false:v));setTalentValues(old=>old.map((v,j)=>j===i?{}:v));}
 }
 function renderExoticTalent(g:Gear,i:number){
  const talent=exoticTalent(g,i);if(!talent)return null;const rule=talentRule(talent);const special=['Slotted','Resourceful'].includes(talent.name);
  return <div className="damage-talent"><h4>{t(talent.name,talent.ru?.name||talent.name)}</h4><p>{formatGameText(t(talent.description,talent.ru?.description||talent.description))}</p>
  {(rule||special)?<><label className="damage-check"><input type="checkbox" checked={g.effectEnabled!==false} onChange={e=>changeGear(i,{effectEnabled:e.target.checked})}/>{t('Apply talent — conditions met','Применить талант — условия выполнены')}</label>
  <p className="damage-help">{t('Talent conditions are assumed met by default. Stacks and combat mode can be adjusted below.','По умолчанию считаем, что условия таланта выполнены. Стаки и режим боя можно изменить ниже.')}</p>
  {special&&<p className="damage-help">{t('Calculated from the equipped attributes and sets.','Рассчитывается по выбранным статам и комплектам.')}</p>}
  {rule?.note&&<p className="damage-help">{t(...rule.note)}</p>}
  <div className="damage-fields">{rule?.controls.map(c=><CalculatorNumber key={c.id} label={t(c.en,c.ru)} max={c.max} step={c.step||1} value={g.effectValues?.[c.id]||0} onChange={n=>changeGear(i,{effectValues:{...g.effectValues,[c.id]:n}})} showMax/>)}</div></>:<p className="damage-notice">{t(...talentStatus(talent).note)}</p>}
  </div>;
 }
 function chooseNamedItem(i:number,id:string){
  const next=selectNamedGear(gear[i],i,id);changeGear(i,next);
  if(i===1||i===2){const item=selectedNamedGear(next,i);const choice=item?.talent?calculatorTalents.find(t=>t.name===item.talent):undefined;const state=initialTalentState(choice);setTalents(old=>old.map((v,j)=>j===i?choice?.id||'':v));setActive(old=>old.map((v,j)=>j===i?state.active:v));setTalentValues(old=>old.map((v,j)=>j===i?state.values:v));}
 }
 function modLabel(id:string){const names:Record<string,[string,string]>={'critical-hit-chance':['Critical Hit Chance','Шанс крита'],'critical-hit-damage':['Critical Hit Damage','Критический урон'],'headshot-damage':['Headshot Damage','Урон в голову'],'weapon-damage':['Weapon Damage','Урон оружия'],'weapon-handling':['Weapon Handling','Эргономичность'],'reload-speed':['Reload Speed','Скорость перезарядки'],'rate-of-fire':['Rate of Fire','Скорострельность'],'magazine-size':['Magazine Size','Размер магазина'],'accuracy':['Accuracy','Точность'],'stability':['Stability','Стабильность'],'optimal-range':['Optimal Range','Оптимальная дальность'],'swap-speed':['Swap Speed','Скорость смены'],'melee-damage':['Melee Damage','Урон в ближнем бою']};return names[id]?t(...names[id]):id;}
 function resetStats(){
  setPresetId('');
  setEventBonuses([]);
  setWeaponId(weapons.find(w=>w.name==='FAMAS 2010')!.id);setQuery('');setOverride(null);setAttachments({});
  setGear(blankGear().map(g=>({...g,core:{id:'',proto:false}})));
  setWeaponRolls(initialWeaponRolls(weapons.find(w=>w.name==='FAMAS 2010')!.attributes,weaponAttributes,true));setTalentValues([{},{},{}]);setSpecialization(blankSpecialization());setExpertise(0);setWatch({});setSetStates({});
  setTalents(['','','']);setActive([false,false,false]);setHeadshots(0);setArmored(true);setOutside(false);
 }
 function numberField(label:string,value:number,onChange:(v:number)=>void,max=10000){return <CalculatorNumber label={label} value={value} onChange={onChange} max={max}/>;}
 function rollControl(roll:Roll,options:typeof attributes,onChange:(r:Roll)=>void,label:string,excluded='',fixed=false){
  const item=options.find(a=>a.id===roll.id);const max=item?attributeAmount(item,roll.proto):0;const value=item?attributeRollAmount(item,roll):0;
  return <div className="damage-roll-editor"><div className="damage-roll damage-roll-single"><label>{label}<CalculatorSelect disabled={fixed} value={roll.id} onChange={e=>{const next=options.find(a=>a.id===e.target.value);onChange({...roll,id:e.target.value,value:next?attributeAmount(next,roll.proto):0});}}><option value="">{t('None','Нет')}</option>{options.filter(a=>a.id!==excluded).map(a=><option key={a.id} value={a.id}>{t(a.en,a.ru)}</option>)}</CalculatorSelect></label></div>{item&&<CalculatorNumber label={t(item.en,item.ru)+(item.value.endsWith('%')?' %':'')} value={value} onChange={value=>onChange({...roll,value})} min={isNamedAttribute(roll.id)?Math.min(1,max):0} max={max} step={item.id==='skill-tier'?(roll.proto?0.5:1):item.value.endsWith('%')?'any':1} showMax/>}</div>;
 }
 function renderTalent(i:0|1|2){
 const kind=(['weapon','chest','backpack'] as const)[i];
 const talent=selectedTalents[i];const rule=talent?talentRule(talent):undefined;const fixed=i===0?weapon.talentSlot.startsWith('fixed:'):!!selectedNamedGear(gear[i],i)?.talent;
 const options=fixed?calculatorTalents.filter(x=>x===talent):selectableTalents(kind,weapon.type);
 return <div className="damage-talent" key={kind}><label>{t(['Weapon talent','Chest talent','Backpack talent'][i],['Талант оружия','Талант брони','Талант рюкзака'][i])}<CalculatorSelect disabled={!talentAllowed[i]||fixed} value={talent?.id||''} onChange={e=>{setTalents(old=>old.map((v,j)=>i===j?e.target.value:v));const choice=calculatorTalents.find(t=>t.id===e.target.value);const state=initialTalentState(choice);setActive(old=>old.map((v,j)=>i===j?state.active:v));setTalentValues(old=>old.map((v,j)=>i===j?state.values:v));const binding=choice?namedTalentGear(kind,choice.name)[0]:undefined;if(binding&&i>0)setGear(old=>old.map((g,j)=>j===i?selectNamedGear({...g,brand:binding.brand},i,namedGear.find(n=>n.slot===i&&n.name===binding.name)?.id||''):g));}}><option value="">{t('None','Нет')}</option>{options.map(x=><option key={x.id} value={x.id}>{t(x.name,x.ru?.name||x.name)} · {t(...talentStatus(x).label)}</option>)}</CalculatorSelect></label>
 {!talentAllowed[i]&&<p className="damage-help">{t('Set and improvised gear cannot select a normal talent here. Supported set effects are calculated in the Gear section.','У сетовой и кустарной экипировки здесь нельзя выбрать обычный талант. Поддерживаемые эффекты сетов рассчитываются в блоке экипировки.')}</p>}
 {fixed&&<small>{t('Fixed item talent','Фиксированный талант предмета')}</small>}
 {talent?.perfect&&i>0&&<p className="damage-help">{t('Named item / brand applied: ','Именной предмет / бренд выбран: ')}{namedTalentGear(kind,talent.name).map(g=>g.name).join(' / ')||t('Choose the matching named item','Выбери соответствующий именной предмет')}</p>}
 {talent&&<><p>{formatGameText(t(talent.description,talent.ru?.description||talent.description))}</p>
 {rule?<>{rule.note&&<p className="damage-notice">{t(...rule.note)}</p>}{rule.passive?<p className="damage-help">{t('Passive bonus is automatic.','Пассивный бонус учитывается автоматически.')}</p>:<label className="damage-check"><input type="checkbox" checked={active[i]} onChange={e=>setActive(old=>old.map((v,j)=>i===j?e.target.checked:v))}/>{t('Condition met — apply PvE bonus','Условие выполнено — применить бонус PvE')}</label>}
 <div className="damage-fields">{rule.controls.map(control=><CalculatorNumber key={control.id} label={t(control.en,control.ru)} value={talentValues[i][control.id]||0} max={control.max} step={control.step||1} showMax onChange={n=>setTalentValues(old=>old.map((v,j)=>j===i?{...v,[control.id]:n}:v))}/>)}</div>
 <ul className="damage-mod-stats">{Object.entries(talentEffects[i]?.bonuses||{}).map(([key,value])=><li key={key}>{({wd:t('Weapon Damage','Урон оружия'),twd:t('Total Weapon Damage','Общий урон оружия'),chc:t('Critical Hit Chance','Шанс крита'),chd:t('Critical Hit Damage','Критический урон'),hsd:t('Headshot Damage','Урон в голову'),handling:t('Weapon Handling','Эргономичность'),reload:t('Reload Speed','Скорость перезарядки'),rof:t('Rate of Fire','Скорострельность'),mag:t('Magazine Size','Размер магазина'),out:t('Damage out of Cover','Урон вне укрытия')} as Record<string,string>)[key]||key}<strong>{value>0?'+':''}{fmt(value)}%</strong></li>)}{talentEffects[i]?.amps.map((value,j)=><li key={'amp'+j}>{t('Independent amplifier','Отдельное усиление')}<strong>+{fmt(value)}%</strong></li>)}{talentEffects[i]?.forceHead&&<li>{t('Guaranteed headshot','Гарантированное попадание в голову')}</li>}{talentEffects[i]?.criticalChance!==undefined&&<li>{t('Talent critical chance','Шанс крита от таланта')}<strong>{fmt(talentEffects[i]!.criticalChance!*100)}%</strong></li>}{talentEffects[i]?.headAmp&&<li>{t('Headshot amplifier','Усиление попадания в голову')}<strong>+{fmt(talentEffects[i]!.headAmp!)}%</strong></li>}{talentEffects[i]?.magBasePercent&&<li>{t('Base magazine bonus','Бонус базового магазина')}<strong>+{fmt(talentEffects[i]!.magBasePercent!)}%</strong></li>}{talentEffects[i]?.noReload&&<li>{t('No reload','Без перезарядки')}</li>}</ul>
 </>:<p className="damage-notice">{t(...talentStatus(talent).note)}</p>}</>}
 </div>;
 }
 function applyPreset(id:string){
 const preset=findCalculatorPreset(id);if(!preset)return;setPresetId(id);
 const p=preset.create();setWeaponId(p.weaponId);setWeaponRolls(p.weaponRolls);setGear(p.gear);setWatch(p.watch);setSpecialization(p.specialization);setExpertise(p.expertise);setTalents(p.talents);setActive(p.active);setTalentValues(p.talentValues);setSetStates(p.setStates);setEventBonuses(p.eventBonuses);setArmored(p.armored);setOutside(p.outside);setHeadshots(p.headshots);setAttachments(p.attachments);setQuery('');setOverride(p.baseOverride);setEditingSlot(0);
 }
 useEffect(()=>{if(!loadRequest)return;applyPreset(loadRequest.presetId);const frame=requestAnimationFrame(()=>{const root=document.getElementById('damage-calculator');root?.focus({preventScroll:true});root?.scrollIntoView({block:'start'});});return ()=>cancelAnimationFrame(frame);},[loadRequest]);
 return <div className="damage-page" id="damage-calculator" tabIndex={-1}>
 <SectionHeading section="damage" eyebrow={t('TEST LAB · V1 · PVE','ТЕСТОВАЯ ЛАБОРАТОРИЯ · V1 · PVE')} title={t('Damage calculator','Калькулятор урона')}/>
 <p className="damage-notice">{t('Experimental PvE calculation at optimal range, with all shots landing. Weapon base stats are provisional and editable. No PvP normalization or damage falloff. In-game and calculated damage may differ slightly, possibly due to in-game rounding. For prototype Skill Tier values, use the table below.','Тестовый расчёт PvE на оптимальной дистанции, при попадании всех выстрелов. Базовые параметры оружия требуют сверки; урон можно изменить. Без нормализации PvP и падения урона с расстоянием. Урон в игре и калькуляторе может незначительно отличаться, возможно из-за особенностей округления в игре. Соответствие обычных и прототипных уровней навыка приведено в таблице ниже.')}</p>
 <div className="damage-tier-reference"><table><caption>{t('Skill Tier: standard / prototype','Уровень навыка: обычный / прототипный')}</caption><thead><tr><th scope="col">{t('Standard','Обычный')}</th>{[1,2,3,4].map(n=><th scope="col" key={n}>{n}</th>)}</tr></thead><tbody><tr><th scope="row">{t('Prototype','Прототипный')}</th>{[1,3,4,6].map((n,i)=><td key={i}>{n}</td>)}</tr></tbody></table></div>
 <div className="damage-toolbar"><p className="damage-help">{t('Reset clears all selected bonuses, gear and watch points, and restores the starting weapon and its base damage.','Сброс обнуляет все выбранные бонусы, экипировку и часы, возвращает начальное оружие и его базовый урон.')}</p><button type="button" className="damage-action damage-reset" onClick={resetStats}><RotateCcw size={16}/>{t('RESET','СБРОС')}</button></div>
 <CalculatorPanel><CalculatorPanelHeading icon={Sparkles} label="PRESETS" title={t('Build presets','Пресеты билдов')}/><div className="damage-preset-buttons" role="group" aria-label={t('Apply a build preset','Применить пресет билда')}>{CALCULATOR_PRESETS.map(p=><button type="button" key={p.id} className="damage-preset-button" onClick={()=>applyPreset(p.id)}>{t(p.en,p.ru)}</button>)}</div><p className="damage-help">{t('Click a preset to load all its settings. You can then edit them.','Нажми на пресет, чтобы сразу загрузить все его параметры. Затем их можно изменить.')}</p><p className="damage-preset-status" role="status">{selectedPreset&&t('Loaded: ','Загружен: ')}{selectedPreset&&t(selectedPreset.en,selectedPreset.ru)}</p></CalculatorPanel>
 <div className="damage-layout"><div className="damage-config">
 <CalculatorPanel><CalculatorPanelHeading icon={Crosshair} label="01 / WEAPON" title={t('Weapon','Оружие')}/>
 <div className="damage-fields"><label>{t('Class','Класс')}<CalculatorSelect value={weapon.type} onChange={e=>changeWeapon(weapons.find(w=>w.type===e.target.value)!.id)}>{types.map(([id,en,ru])=><option key={id} value={id}>{t(en,ru)}</option>)}</CalculatorSelect></label><label>{t('Search weapon','Поиск оружия')}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Weapon name','Название оружия')}/></label></div>
 <label>{t('Weapon','Оружие')}<CalculatorSelect value={weaponId} onChange={e=>changeWeapon(e.target.value)}>{weapons.filter(w=>w.type===weapon.type&&(w.id===weaponId||w.name.toLowerCase().includes(query.toLowerCase()))).map(w=><option key={w.id} value={w.id}>{w.name}{w.exotic?' · Exotic':w.named?' · Named':''}</option>)}</CalculatorSelect></label>
 <div className="damage-fields">{numberField(t('Base damage','Базовый урон'),base,setOverride,10000000)}{numberField(t('Expertise damage %','Урон мастерства %'),expertise,setExpertise,30)}</div>
 <p className="damage-help">{t('RPM / magazine / reload','Скорострельность / магазин / перезарядка')}: {fmt(weapon.rpm)} / {weapon.mag} / {fmt(weapon.reload)} {t('s','с')}. <button type="button" onClick={()=>setOverride(null)}>{t('Restore base damage','Вернуть базовый урон')}</button></p>
 <WeaponAttributes exotic={weapon.exotic} specs={weapon.attributes} value={weaponRolls} onChange={setWeaponRolls}/>
 <p className="damage-help">{t('Weapon attributes and supported talents are included automatically. Base character critical damage (+25%) is included automatically. Shotgun damage is per whole shot.','Атрибуты оружия и поддерживаемые таланты учитываются автоматически. Базовый критический урон персонажа (+25%) учитывается автоматически. Урон дробовика считается за весь выстрел.')}</p>
 {renderTalent(0)}
 </CalculatorPanel>
 <SpecializationStats value={specialization} onChange={setSpecialization} weaponType={weapon.type}/>
 <CalculatorPanel className="damage-panel damage-attachments"><CalculatorPanelHeading icon={Crosshair} label="03 / MODS" title={t('Weapon attachments','Модификации оружия')}/>
 <p className="damage-help">{t('Compatible attachments only. Fixed attachments are included automatically. All listed bonuses and penalties affecting damage, fire rate, reload or magazine size are included below.','Только совместимые модификации. Фиксированные обвесы установлены автоматически. Бонусы и штрафы к урону, скорострельности, перезарядке и магазину учитываются в результате.')}</p>
 <div className="damage-gear-grid">{WEAPON_MOD_SLOTS.map(slot=>{const spec=weapon.slots[slot];const fixed=spec.startsWith('fixed:');const current=equippedMods.find(m=>m.category===slot);const labels={optics:['Optics','Прицел'],magazine:['Magazine','Магазин'],muzzle:['Muzzle','Дульная модификация'],underbarrel:['Underbarrel','Подствольная модификация']} as const;
 return <div className="damage-gear" key={slot}><label>{t(labels[slot][0],labels[slot][1])}<CalculatorSelect disabled={fixed||!spec.startsWith('type:')} value={current?.name||''} onChange={e=>setAttachments(old=>({...old,[slot]:e.target.value}))}><option value="">{spec==='N/A'?t('No slot','Нет слота'):t('None','Нет')}</option>{weaponMods.filter(m=>compatibleMod(spec,slot,m)).map(m=><option key={m.name} value={m.name}>{[m.name,...modStats(m).map(stat=>`${stat.value>0?'+':''}${fmt(stat.value)}${stat.percent?'%':''} ${modLabel(stat.id)}`)].join(' | ')}</option>)}</CalculatorSelect></label>{fixed&&<small>{t('Fixed attachment','Фиксированная модификация')}</small>}{current&&<ul className="damage-mod-stats">{modStats(current).map(stat=><li key={stat.id}>{modLabel(stat.id)} <strong>{stat.value>0?'+':''}{fmt(stat.value)}{stat.percent?'%':''}</strong></li>)}</ul>}</div>;
 })}</div><p className="damage-help">{t('Accuracy, stability, range, swap speed and melee damage are shown for reference; they do not change this optimal-range bullet DPS model. Mod names follow the English database.','Точность, стабильность, дальность, скорость смены и урон в ближнем бою показаны для справки и не меняют эту модель DPS пули на оптимальной дистанции. Названия модификаций — из английской базы.')}</p>
 </CalculatorPanel>
 <CalculatorPanel className="gear-workbench"><CalculatorPanelHeading icon={Shield} label="04 / GEAR" title={t('Gear & mods','Экипировка и вставки')}/>
 <div className="gear-workbench-intro"><p>{t('Choose a slot, then configure the item below. Changes apply to damage immediately.','Выбери слот и настрой предмет ниже. Изменения сразу учитываются в уроне.')}</p><span>{t('Mods','Вставки')} <strong>{gear.reduce((n,g,i)=>n+[{id:g.mod},...(g.extraMods||[])].slice(0,gearModCount(g,i)).filter(m=>m.id).length,0)} / {gear.reduce((n,g,i)=>n+gearModCount(g,i),0)}</strong></span></div>
 <div className="gear-slot-picker" role="group" aria-label={t('Equipment slots','Слоты экипировки')}>{gear.map((g,i)=>{
  const Icon=slotIcons[i];const exotic=selectedExoticGear(g,i);const named=selectedNamedGear(g,i);const set=catalog.sets.find(x=>x.id===g.brand);
  const itemName=exotic?t(exotic.name,exotic.ru):named?t(named.name,named.ru):set?t(set.name,set.ru?.name||set.name):g.brand==='improvised'?t('Improvised','Кустарное'):t('Choose an item','Выбери предмет');
  const kind=g.exotic?'exotic':set?.kind==='set'?'set':g.core.proto?'prototype':'standard';
  const core=gearAttribute(g.core.id);
  return <button type="button" key={i} className={'gear-slot-button gear-kind-'+kind} aria-pressed={editingSlot===i} aria-controls={'gear-slot-editor-'+i} onClick={()=>setEditingSlot(i)}><span className="gear-slot-top"><Icon size={19}/><span>{t(slots[i][0],slots[i][1])}</span><span className="gear-slot-dot"/></span><strong title={itemName}>{itemName}</strong><span className="gear-slot-bottom">{core?t(core.en,core.ru)+' '+fmt(attributeRollAmount(core,g.core))+(core.value.endsWith('%')?'%':''):t('No core attribute','Без основного стата')}</span></button>;
 })}</div>
 <div className="gear-slot-editors">{gear.map((g,i)=>{const set=catalog.sets.find(s=>s.id===g.brand);const exotic=selectedExoticGear(g,i);const named=selectedNamedGear(g,i);const namedOptions=namedGear.filter(n=>n.slot===i&&n.brand===g.brand);return <article className="damage-gear gear-workbench-card" key={i} id={"gear-slot-editor-"+i} hidden={editingSlot!==i} aria-label={t(slots[i][0],slots[i][1])}><div className="damage-prototype-heading"><h3>{t(slots[i][0],slots[i][1])}</h3><div className="damage-item-options"><label className="damage-check prototype"><input type="checkbox" disabled={!!g.exotic} checked={!g.exotic&&g.core.proto} onChange={e=>{const proto=e.target.checked;const update=(roll:Roll)=>setAttributePrototype(roll,gearAttribute(roll.id),proto);changeGear(i,{core:update(g.core),minor:g.minor.map(update)});}}/>{t('Prototype item','Прототип предмета')}</label><label className="damage-check exotic"><input type="checkbox" checked={!!g.exotic} disabled={!g.exotic&&gear.some(x=>x.exotic)} onChange={e=>chooseExoticItem(i,e.target.checked?exoticGear.find(x=>x.slot===i)!.id:'')}/>{t('Exotic','Экзотика')}</label></div></div><div className="gear-item-selection">{g.exotic?<label>{t('Exotic item','Экзотический предмет')}<CalculatorSelect value={g.exoticId||''} onChange={e=>chooseExoticItem(i,e.target.value)}>{exoticGear.filter(x=>x.slot===i).map(x=><option key={x.id} value={x.id}>{t(x.name,x.ru)}</option>)}</CalculatorSelect></label>:<label>{t('Brand / set','Бренд / сет')}<CalculatorSelect value={g.brand} onChange={e=>changeGear(i,{brand:e.target.value})}><option value="">{t('No bonus','Без бонуса')}</option><option value="improvised">{t('Improvised','Кустарное')}</option>{catalog.sets.map(s=><option key={s.id} value={s.id}>{t(s.name,s.ru?.name||s.name)}</option>)}</CalculatorSelect></label>}
 {namedOptions.length>0&&<label>{t('Named item','Именной предмет')}<CalculatorSelect value={named?.id||''} onChange={e=>chooseNamedItem(i,e.target.value)}><option value="">{t('Standard item','Обычный предмет')}</option>{namedOptions.map(n=><option key={n.id} value={n.id}>{t(n.name,n.ru)}</option>)}</CalculatorSelect></label>}
 </div>
 <div className="gear-editor-section-heading"><Crosshair size={16}/><h4>{t('Attributes','Характеристики')}</h4><span>{g.exotic?t('Standard rolls · no prototype','Обычные значения · без прототипа'):set?.kind==='set'?t('1 core + 1 attribute','1 основной + 1 дополнительный'):t('Adjust each roll below','Настрой значения ползунками')}</span></div>
 <div className="gear-attribute-grid">
 {rollControl(g.core,exotic?exoticRollOptions(exotic.cores[0],true):isNamedAttribute(g.core.id)?[gearAttribute(g.core.id)!]:attributes.filter(a=>a.core),core=>changeGear(i,{core}),t('Core attribute','Основной стат'),'',!!exotic?.cores[0].startsWith('fixed:')||isNamedAttribute(g.core.id))}
 {exotic&&g.extraCores?.map((roll,j)=><div key={'core'+j}>{rollControl(roll,exoticRollOptions(exotic.cores[j+1],true),r=>changeGear(i,{extraCores:g.extraCores!.map((v,k)=>k===j?r:v)}),t('Core attribute','Основной стат')+' '+(j+2),'',true)}</div>)}
 {g.minor.slice(0,exotic?.minor.length??named?.minor.length??(set?.kind==='set'?1:2)).map((roll,j)=>{const fixed=!!exotic?.minor[j]?.startsWith('fixed:')||isNamedAttribute(roll.id);const others=g.minor.filter((_,k)=>k!==j).map(r=>gearStatId(r.id));return <div key={j}>{rollControl(roll,exotic?exoticRollOptions(exotic.minor[j]).filter(a=>!others.includes(a.id)):fixed?[gearAttribute(roll.id)!]:attributes.filter(a=>!a.core&&!others.includes(a.id)),r=>changeGear(i,{minor:g.minor.map((v,k)=>k===j?r:v)}),t('Attribute','Стат')+' '+(j+1),'',fixed)}</div>;})}
 </div>
 <div className="gear-item-extras"><section className="gear-mod-section"><div className="gear-editor-section-heading"><Package size={16}/><h4>{t('Gear mods','Вставки')}</h4><span>{gearModCount(g,i)}</span></div>
 {gearModCount(g,i)===0&&<p className="gear-empty-note">{t('This item has no mod slot.','У этого предмета нет слота для вставки.')}</p>}
 {Array.from({length:gearModCount(g,i)},(_,m)=>{const roll=m===0?{id:g.mod,value:g.modValue}:g.extraMods?.[m-1]||{id:''};const update=(id:string,value?:number)=>m===0?changeGear(i,{mod:id,modValue:value}):changeGear(i,{extraMods:Array.from({length:gearModCount(g,i)-1},(_,k)=>k===m-1?{id,value}:g.extraMods?.[k]||{id:''})});const mod=mods.find(x=>x.id===roll.id);return <div className="damage-roll-editor" key={'mod'+m}><label>{t('Gear mod','Вставка')}{gearModCount(g,i)>1?' '+(m+1):''}<CalculatorSelect value={roll.id} onChange={e=>update(e.target.value)}><option value="">{t('None','Нет')}</option>{mods.map(x=><option key={x.id} value={x.id}>{t(x.en,x.ru)}</option>)}</CalculatorSelect></label>{mod&&<CalculatorNumber label={t(mod.en,mod.ru)+' %'} value={roll.value??numericStat(mod.value)} max={numericStat(mod.value)} onChange={value=>update(roll.id,value)} showMax/>}</div>;})}
 </section><section className="gear-talent-section"><div className="gear-editor-section-heading"><Sparkles size={16}/><h4>{t('Item talent','Талант предмета')}</h4></div>
 {!g.exotic&&i!==1&&i!==2&&!named?.talent&&<p className="gear-empty-note">{set?.kind==='set'?t('Set effects are configured below.','Эффекты комплекта настраиваются ниже.'):t('This slot has no item talent.','В этом слоте нет таланта предмета.')}</p>}
 {named?.talent&&i!==1&&i!==2&&<p className="damage-notice">{t('Item talent: ','Талант предмета: ')}{named.talent}. {t('Its special effect is not included in bullet damage yet.','Его особый эффект пока не включён в урон пули.')}</p>}

 {!g.exotic&&(i===1||i===2)&&renderTalent(i)}
 {g.exotic&&renderExoticTalent(g,i)}
 </section></div></article>})}</div>
 <p className="gear-workbench-footnote">{t('One exotic gear item at a time. Prototype and exotic switches apply to the selected item. Defensive and skill attributes do not directly increase bullet damage.','Можно надеть один экзотический предмет. Переключатели прототипа и экзотики относятся к выбранному слоту. Защитные статы и статы навыков напрямую не увеличивают урон пули.')}</p>
 <details className="gear-brand-summary"><summary>{t('Active brand & set bonuses','Активные бонусы брендов и сетов')}<span>{activeSets.length}</span></summary><div className="gear-brand-grid">
 {activeSets.length===0&&<p className="gear-empty-note">{t('Choose a brand or set to see its bonuses here.','Выбери бренд или сет — здесь появятся его бонусы.')}</p>}
 {activeSets.map(s=><div className="damage-set" key={s.id}><strong>{t(s.name,s.ru?.name||s.name)} · {counts[s.id]}</strong>{s.bonuses.filter(b=>b.pieces<=counts[s.id]).map((b,i)=><p key={i}>{b.pieces}: {formatGameText(locale==='ru'?s.ru?.bonuses.find(r=>r.pieces===b.pieces)?.text||b.text:b.text)}</p>)}</div>)}
 </div></details>
 {setRules.map(({set:s,rule})=><div className="damage-set-effect" key={s.id}><h3>{t(s.name,s.ru?.name||s.name)} · {t('Set talent','Талант сета')}</h3>{rule?<><label className="damage-check"><input type="checkbox" checked={setStates[s.id]?.enabled??true} onChange={e=>setSetStates(old=>({...old,[s.id]:{enabled:e.target.checked,values:old[s.id]?.values||{}}}))}/>{t('Conditions met — apply set bonus','Условия выполнены — применить бонус сета')}</label><p className="damage-help">{t('Assumes the set condition is active. Chest/backpack upgrades follow equipped slots automatically.','По умолчанию условие сета считается выполненным. Усиления от брони и рюкзака учитываются по надетым предметам автоматически.')}</p>{rule.note&&<p className="damage-help">{t(...rule.note)}</p>}<div className="damage-fields">{rule.controls.map(control=><CalculatorNumber key={control.id} label={t(control.en,control.ru)} max={control.max} step={1} showMax value={Math.min(control.max,setStates[s.id]?.values[control.id]??control.max)} onChange={value=>setSetStates(old=>({...old,[s.id]:{enabled:old[s.id]?.enabled??true,values:{...old[s.id]?.values,[control.id]:value}}}))}/>)}</div></>:<p className="damage-notice">{t('The set’s static bonuses are included above. Its four-piece mechanic is not included in bullet damage yet; the result is incomplete for this effect.','Обычные бонусы сета уже учтены. Его механика за 4 предмета пока не включена в урон пули; для этого эффекта расчёт неполный.')}</p>}</div>)}

 </CalculatorPanel>
 <WatchStats value={watch} onChange={setWatch}/>
 <EventBonuses value={eventBonuses} onChange={setEventBonuses}/>
 </div>

 <aside className="damage-results"><div className="damage-panel"><CalculatorPanelHeading icon={ChartNoAxesCombined} label="07 / DPS" title={t('Damage output','Результат')}/><label>{t('Target','Цель')}<CalculatorSelect value={armored?'armor':'health'} onChange={e=>setArmored(e.target.value==='armor')}><option value="armor">{t('Armor','Броня')}</option><option value="health">{t('Health','Здоровье')}</option></CalculatorSelect></label><label className="damage-check"><input type="checkbox" checked={outside} onChange={e=>setOutside(e.target.checked)}/>{t('Out of cover','Вне укрытия')}</label>{numberField(t('Headshot share %','Доля попаданий в голову %'),headshots,setHeadshots,100)}
 <h3>{weapon.type==='shotgun'?t('Damage per shot (all pellets)','Урон за выстрел (все дробины)'):t('Damage per bullet','Урон за пулю')}</h3><div className="damage-hit-grid">{([
 ['Body hit','В тело',result.body],['Critical body hit','Крит в тело',result.crit],['Headshot','В голову',result.head],['Critical headshot','Крит в голову',result.critHead]
 ] as const).map(([en,ru,n])=><div key={en}><span>{t(en,ru)}</span><strong>{fmt(n)}</strong></div>)}</div>
 <div className="damage-average"><span>{t('Average hit (probability-weighted)','Средний урон (с учётом вероятностей)')}</span><strong>{fmt(result.average)}</strong></div>
 <dl>{([['Burst DPS','DPS без перезарядки',result.burst],['Sustained DPS','DPS с перезарядкой',result.sustained]] as const).map(([en,ru,n])=><div key={en}><dt>{t(en,ru)}</dt><dd>{fmt(n)}</dd></div>)}</dl>
 <p className="damage-help">{t('Expected damage uses crit chance and headshot share. Sustained DPS assumes continuous fire, fixed buffs and full-magazine reloads.','Средний урон учитывает шанс крита и долю попаданий в голову. DPS предполагает непрерывную стрельбу, постоянные баффы и перезарядку полного магазина.')}</p>
 {result.singleShot&&<p className="damage-notice">{t('Hit values include the next-shot effect. DPS excludes one-shot effects and their unmodeled activation cycle.','Урон попаданий учитывает эффект следующего выстрела. DPS не включает разовые эффекты и их цикл активации.')}</p>}
 {result.additive>0&&<p className="damage-help">Headhunter: +{fmt(result.additive)}</p>}
 <p className="damage-help">{t('Character base critical damage: ','Базовый критический урон персонажа: ')}+{BASE_CHARACTER_CHD}%</p><h3>{t('Calculation breakdown','Разбор расчёта')}</h3><dl>{[['Base',base],['Weapon Damage %',wd],['Total Weapon Damage %',totals.twd],['CHC %',result.chance*100],['CHD %',totals.chd],['HSD %',weapon.hsd+totals.hsd],['RPM',rpm],[t('Magazine','Магазин'),magazine],[t('Reload, s','Перезарядка, с'),reload]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{fmt(Number(value))}</dd></div>)}</dl>
 {totals.chc>60&&result.chance<=.6&&<p className="damage-notice">{t('Critical chance above 60% is excluded.','Шанс крита свыше 60% не учитывается.')}</p>}
 <p className="damage-formula">{fmt(base)} × {factor(1+wd/100)} × {factor(1+totals.twd/100)} × {factor(1+(armored?totals.armor:totals.health)/100)} × {factor(1+(outside?totals.out:0)/100)}{talentAmps.map((a,i)=><span key={i}> × {new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(1+a/100)}</span>)}</p><small>{t('Base body formula before crit, headshot and special next-shot effects.','Базовая формула до крита, попадания в голову и специальных эффектов следующего выстрела.')}</small>
 </div></aside></div>
 <p className="damage-help">{t('Weapon data','Данные оружия')}: <a href="https://github.com/div2hub/game-data/tree/main/weapons" target="_blank" rel="noreferrer">div2hub</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. {t('Gear, attributes and talents: shared archive data.','Экипировка, статы и таланты: общие данные справочника.')}</p>
 </div>;
}
