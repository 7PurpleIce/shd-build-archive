import {EventBonuses} from './EventBonuses';
import {eventBonusEffect,type EventBonus} from '@/lib/event-bonuses';
import {SpecializationStats} from './SpecializationStats';
import {blankSpecialization,specializationEffect} from '@/lib/specializations';
import {formatGameText} from '@/lib/number-format';
import {useState} from 'react';
import {Crosshair, Shield, Sparkles, ChartNoAxesCombined, RotateCcw} from 'lucide-react';
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
import {watchDamageBonuses,type WatchPoints} from '@/lib/shd-watch';
import weapons from '@/data/weapons.json';
import attributes from '@/data/attributes.json';
import mods from '@/data/gear-mods.json';
import catalog from '@/data/catalog.json';
import {attributeAmount,attributeRollAmount} from '@/lib/attribute-values';
import weaponMods from '@/data/weapon-mods.json';
import {WEAPON_MOD_SLOTS,compatibleMod,selectedWeaponMods,attachmentBonuses,modStats,effectiveWeaponCycle,type WeaponModSlot} from '@/lib/weapon-mods';
import {hasModSlot,numericStat,staticBonus} from '@/lib/damage';
import {useLocale} from './Locale';
import {useOwner} from './OwnerAuth';
import {SectionHeading} from './SectionHeading';
import './damage.css';
const types=[['assault-rifle','Assault rifles','Штурмовые винтовки'],['smg','SMGs','Пистолеты-пулемёты'],['lmg','LMGs','Пулемёты'],['rifle','Rifles','Винтовки'],['marksman-rifle','Marksman rifles','Снайперские винтовки'],['shotgun','Shotguns','Дробовики'],['pistol','Pistols','Пистолеты']] as const;
const slots=[['Mask','Маска'],['Chest','Броня'],['Backpack','Рюкзак'],['Gloves','Перчатки'],['Holster','Кобура'],['Kneepads','Наколенники']] as const;
type Roll={id:string;proto:boolean;value?:number};
type Gear={brand:string;core:Roll;minor:Roll[];mod:string;modValue?:number};
const blankGear=():Gear[]=>slots.map(()=>({brand:'',core:{id:'weapon-damage',proto:false},minor:[{id:'',proto:false},{id:'',proto:false}],mod:''}));
const statKey:Record<string,string>={'weapon-damage':'wd','critical-hit-chance':'chc','critical-hit-damage':'chd','headshot-damage':'hsd','weapon-handling':'handling'};
export default function DamageCalculator(){const {canManage}=useOwner();return canManage?<CalculatorBody/>:null;}
function CalculatorBody(){
 const {t,locale}=useLocale();
 const [weaponId,setWeaponId]=useState(weapons.find(w=>w.name==='FAMAS 2010')!.id);
 const weapon=weapons.find(w=>w.id===weaponId)!;
 const [attachments,setAttachments]=useState<Partial<Record<WeaponModSlot,string>>>({});
 const [query,setQuery]=useState('');const [override,setOverride]=useState<number|null>(null);
 const [gear,setGear]=useState<Gear[]>(blankGear);
 const [weaponRolls,setWeaponRolls]=useState(()=>initialWeaponRolls(weapon.attributes,weaponAttributes));
 const [talentValues,setTalentValues]=useState<Record<string,number>[]>([{},{},{}]);
 const [watch,setWatch]=useState<WatchPoints>({wd:50});const [specialization,setSpecialization]=useState(blankSpecialization);const [expertise,setExpertise]=useState(0);
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
 const counts:Record<string,number>={};gear.forEach(g=>{if(g.brand&&g.brand!=='improvised')counts[g.brand]=(counts[g.brand]||0)+1;});
 const activeSets=catalog.sets.filter(s=>counts[s.id]);
 for(const s of activeSets)for(const b of s.bonuses)if(b.pieces<=counts[s.id])for(const v of staticBonus(b.text,weapon.type))add(v.key,v.value);
 for(const [i,g] of gear.entries()){
  const isSet=catalog.sets.find(s=>s.id===g.brand)?.kind==='set';
  for(const roll of [g.core,...g.minor.slice(0,isSet?1:2)]){const a=attributes.find(a=>a.id===roll.id);if(a&&statKey[a.id])add(statKey[a.id],attributeRollAmount(a,roll));}
  const mod=hasModSlot(i,g.brand)?mods.find(m=>m.id===g.mod):undefined;if(mod&&statKey[mod.id])add(statKey[mod.id],Math.max(0,Math.min(numericStat(mod.value),g.modValue??numericStat(mod.value))));
 }
 const specEffect=specializationEffect(specialization,weapon.type);
 Object.entries(specEffect.bonuses).forEach(([key,value])=>add(key,value));
 const talentAmps:number[]=[...specEffect.amps,...eventEffect.amps];
 const talentAllowed=[true, catalog.sets.find(s=>s.id===gear[1].brand)?.kind!=='set'&&gear[1].brand!=='improvised', catalog.sets.find(s=>s.id===gear[2].brand)?.kind!=='set'&&gear[2].brand!=='improvised'];
 const selectedTalents=talents.map((id,i)=>i===0?weaponTalent(weapon.talentSlot,id):talentAllowed[i]?calculatorTalents.find(t=>t.id===id):undefined);
 const equippedMods=selectedWeaponMods(weapon.slots,attachments,weaponMods);
 const modBonuses=attachmentBonuses(equippedMods);
 Object.entries(modBonuses).forEach(([key,value])=>add(key,value));
 Object.entries(watchDamageBonuses(watch)).forEach(([key,value])=>add(key,value));
 Object.entries(weaponAttributeBonuses(weapon.attributes,weaponRolls,weaponAttributes)).forEach(([key,value])=>add(key,value));
 const talentContext={weaponType:weapon.type,magazine:effectiveWeaponCycle(weapon,totals).magazine,armored,redCores:gear.filter(g=>g.core.id==='weapon-damage').length};
 let noReload=false;
 const setRules=activeSets.filter(s=>s.kind==='set'&&counts[s.id]>=4).map(s=>({set:s,rule:setTalentRule(s,gear[1].brand===s.id,gear[2].brand===s.id,talentContext.magazine)}));
 const setEffects=setRules.flatMap(({set:s,rule})=>rule?[evaluateSetRule(rule,setStates[s.id]?.enabled??true,setStates[s.id]?.values||{},talentContext)]:[]);
 const talentEffects=selectedTalents.map((talent,i)=>talent?evaluateTalent(talent,active[i],talentValues[i],talentContext):undefined);
 [...talentEffects,...setEffects].forEach(effect=>{if(!effect)return;Object.entries(effect.bonuses).forEach(([key,value])=>add(key,value));talentAmps.push(...effect.amps);noReload ||= !!effect.noReload;});
 const base=override??weapon.damage;
 const wd=totals.wd+expertise;
 const cycle=effectiveWeaponCycle(weapon,totals);
 const {rpm}=cycle;const magBasePercent=talentEffects.reduce((sum,e)=>sum+(e?.magBasePercent||0),0);const magazine=cycle.magazine+Math.floor(weapon.mag*magBasePercent/100);const reload=noReload?0:cycle.reload;
 const result=talentDamage({base,wd,twd:totals.twd,chc:totals.chc,chd:totals.chd,hsd:weapon.hsd+totals.hsd,armor:totals.armor,health:totals.health,out:totals.out,armored,outside,amps:[],rpm,magazine,reload,headshots},[...talentEffects,...setEffects,{bonuses:{},amps:[...specEffect.amps,...eventEffect.amps]}].filter((e):e is NonNullable<typeof e>=>!!e));
 function changeWeapon(id:string){const next=weapons.find(w=>w.id===id)!;setWeaponId(id);setWeaponRolls(initialWeaponRolls(next.attributes,weaponAttributes));setOverride(null);setAttachments({});setQuery('');setTalents(old=>['',old[1],old[2]]);const state=initialTalentState(weaponTalent(next.talentSlot,''));setActive(old=>[state.active,old[1],old[2]]);setTalentValues(old=>[state.values,old[1],old[2]]);}
 function changeGear(i:number,patch:Partial<Gear>){if(patch.brand!==undefined&&(i===1||i===2)){const chosen=selectedTalents[i];if(chosen?.perfect&&!namedTalentGear(chosen.kind,chosen.name).some(g=>g.brand===patch.brand)){setTalents(old=>old.map((v,j)=>j===i?'':v));setActive(old=>old.map((v,j)=>j===i?false:v));setTalentValues(old=>old.map((v,j)=>j===i?{}:v));}}setGear(old=>old.map((g,j)=>{if(j!==i)return g;const next={...g,...patch};if(catalog.sets.find(s=>s.id===next.brand)?.kind==='set')next.minor=[next.minor[0],{id:'',proto:false}];if(!hasModSlot(i,next.brand))next.mod='';return next;}));}
 function modLabel(id:string){const names:Record<string,[string,string]>={'critical-hit-chance':['Critical Hit Chance','Шанс крита'],'critical-hit-damage':['Critical Hit Damage','Критический урон'],'headshot-damage':['Headshot Damage','Урон в голову'],'weapon-damage':['Weapon Damage','Урон оружия'],'weapon-handling':['Weapon Handling','Эргономичность'],'reload-speed':['Reload Speed','Скорость перезарядки'],'rate-of-fire':['Rate of Fire','Скорострельность'],'magazine-size':['Magazine Size','Размер магазина'],'accuracy':['Accuracy','Точность'],'stability':['Stability','Стабильность'],'optimal-range':['Optimal Range','Оптимальная дальность'],'swap-speed':['Swap Speed','Скорость смены'],'melee-damage':['Melee Damage','Урон в ближнем бою']};return names[id]?t(...names[id]):id;}
 function resetStats(){
  setEventBonuses([]);
  setWeaponId(weapons.find(w=>w.name==='FAMAS 2010')!.id);setQuery('');setOverride(null);setAttachments({});
  setGear(blankGear().map(g=>({...g,core:{id:'',proto:false}})));
  setWeaponRolls(initialWeaponRolls(weapons.find(w=>w.name==='FAMAS 2010')!.attributes,weaponAttributes,true));setTalentValues([{},{},{}]);setSpecialization(blankSpecialization());setExpertise(0);setWatch({});setSetStates({});
  setTalents(['','','']);setActive([false,false,false]);setHeadshots(0);setArmored(true);setOutside(false);
 }
 function numberField(label:string,value:number,onChange:(v:number)=>void,max=10000){return <CalculatorNumber label={label} value={value} onChange={onChange} max={max}/>;}
 function rollControl(roll:Roll,options:typeof attributes,onChange:(r:Roll)=>void,label:string,excluded=''){
  const item=options.find(a=>a.id===roll.id);const max=item?attributeAmount(item,roll.proto):0;const value=item?attributeRollAmount(item,roll):0;
  return <div className="damage-roll-editor"><div className="damage-roll"><label>{label}<CalculatorSelect value={roll.id} onChange={e=>{const next=options.find(a=>a.id===e.target.value);onChange({...roll,id:e.target.value,value:next?attributeAmount(next,roll.proto):0});}}><option value="">{t('None','Нет')}</option>{options.filter(a=>a.id!==excluded).map(a=><option key={a.id} value={a.id}>{t(a.en,a.ru)}</option>)}</CalculatorSelect></label><label className="damage-check prototype"><input type="checkbox" checked={roll.proto} disabled={!roll.id} onChange={e=>{const nextMax=item?attributeAmount(item,e.target.checked):0;onChange({...roll,proto:e.target.checked,value:value===max?nextMax:Math.min(value,nextMax)});}}/>{t('Proto','Прото')}</label></div>{item&&<CalculatorNumber label={t(item.en,item.ru)+(item.value.endsWith('%')?' %':'')} value={value} onChange={value=>onChange({...roll,value})} max={max} step={item.id==='skill-tier'?(roll.proto?0.5:1):item.value.endsWith('%')?'any':1} showMax/>}</div>;
 }
 return <div className="damage-page">
 <SectionHeading section="damage" eyebrow={t('ADMIN LAB · V1 · PVE','ЛАБОРАТОРИЯ АДМИНА · V1 · PVE')} title={t('Damage calculator','Калькулятор урона')}/>
 <p className="damage-notice">{t('Experimental PvE calculation at optimal range, with all shots landing. Weapon base stats are provisional and editable. No PvP normalization or damage falloff. In-game and calculated damage may differ slightly — around 0.00004% in the tested builds, possibly due to rounding differences.','Тестовый расчёт PvE на оптимальной дистанции, при попадании всех выстрелов. Базовые параметры оружия требуют сверки; урон можно изменить. Без нормализации PvP и падения урона с расстоянием. Урон в игре и калькуляторе может незначительно отличаться — в проверенных билдах примерно на 0,00004%, возможно из-за особенностей округления.')}</p>
 <div className="damage-toolbar"><p className="damage-help">{t('Reset clears all selected bonuses, gear and watch points, and restores the starting weapon and its base damage.','Сброс обнуляет все выбранные бонусы, экипировку и часы, возвращает начальное оружие и его базовый урон.')}</p><button type="button" className="damage-action damage-reset" onClick={resetStats}><RotateCcw size={16}/>{t('RESET','СБРОС')}</button></div>
 <div className="damage-layout"><div className="damage-config">
 <section className="damage-panel"><CalculatorPanelHeading icon={Crosshair} label="01 / WEAPON" title={t('Weapon','Оружие')}/>
 <div className="damage-fields"><label>{t('Class','Класс')}<CalculatorSelect value={weapon.type} onChange={e=>changeWeapon(weapons.find(w=>w.type===e.target.value)!.id)}>{types.map(([id,en,ru])=><option key={id} value={id}>{t(en,ru)}</option>)}</CalculatorSelect></label><label>{t('Search weapon','Поиск оружия')}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Weapon name','Название оружия')}/></label></div>
 <label>{t('Weapon','Оружие')}<CalculatorSelect value={weaponId} onChange={e=>changeWeapon(e.target.value)}>{weapons.filter(w=>w.type===weapon.type&&(w.id===weaponId||w.name.toLowerCase().includes(query.toLowerCase()))).map(w=><option key={w.id} value={w.id}>{w.name}{w.exotic?' · Exotic':w.named?' · Named':''}</option>)}</CalculatorSelect></label>
 <div className="damage-fields">{numberField(t('Base damage','Базовый урон'),base,setOverride,10000000)}{numberField(t('Expertise damage %','Урон мастерства %'),expertise,setExpertise,30)}</div>
 <p className="damage-help">{t('RPM / magazine / reload','Скорострельность / магазин / перезарядка')}: {fmt(weapon.rpm)} / {weapon.mag} / {fmt(weapon.reload)} {t('s','с')}. <button type="button" onClick={()=>setOverride(null)}>{t('Restore base damage','Вернуть базовый урон')}</button></p>
 <WeaponAttributes specs={weapon.attributes} value={weaponRolls} onChange={setWeaponRolls}/>
 <p className="damage-help">{t('Weapon attributes and supported talents are included automatically. Base character critical damage (+25%) is included automatically. Shotgun damage is per whole shot.','Атрибуты оружия и поддерживаемые таланты учитываются автоматически. Базовый критический урон персонажа (+25%) учитывается автоматически. Урон дробовика считается за весь выстрел.')}</p>
 </section>
 <SpecializationStats value={specialization} onChange={setSpecialization} weaponType={weapon.type}/>
 <section className="damage-panel damage-attachments"><CalculatorPanelHeading icon={Crosshair} label="02 / MODS" title={t('Weapon attachments','Модификации оружия')}/>
 <p className="damage-help">{t('Compatible attachments only. Fixed attachments are included automatically. All listed bonuses and penalties affecting damage, fire rate, reload or magazine size are included below.','Только совместимые модификации. Фиксированные обвесы установлены автоматически. Бонусы и штрафы к урону, скорострельности, перезарядке и магазину учитываются в результате.')}</p>
 <div className="damage-gear-grid">{WEAPON_MOD_SLOTS.map(slot=>{const spec=weapon.slots[slot];const fixed=spec.startsWith('fixed:');const current=equippedMods.find(m=>m.category===slot);const labels={optics:['Optics','Прицел'],magazine:['Magazine','Магазин'],muzzle:['Muzzle','Дульная модификация'],underbarrel:['Underbarrel','Подствольная модификация']} as const;
 return <div className="damage-gear" key={slot}><label>{t(labels[slot][0],labels[slot][1])}<CalculatorSelect disabled={fixed||!spec.startsWith('type:')} value={current?.name||''} onChange={e=>setAttachments(old=>({...old,[slot]:e.target.value}))}><option value="">{spec==='N/A'?t('No slot','Нет слота'):t('None','Нет')}</option>{weaponMods.filter(m=>compatibleMod(spec,slot,m)).map(m=><option key={m.name} value={m.name}>{[m.name,...modStats(m).map(stat=>`${stat.value>0?'+':''}${fmt(stat.value)}${stat.percent?'%':''} ${modLabel(stat.id)}`)].join(' | ')}</option>)}</CalculatorSelect></label>{fixed&&<small>{t('Fixed attachment','Фиксированная модификация')}</small>}{current&&<ul className="damage-mod-stats">{modStats(current).map(stat=><li key={stat.id}>{modLabel(stat.id)} <strong>{stat.value>0?'+':''}{fmt(stat.value)}{stat.percent?'%':''}</strong></li>)}</ul>}</div>;
 })}</div><p className="damage-help">{t('Accuracy, stability, range, swap speed and melee damage are shown for reference; they do not change this optimal-range bullet DPS model. Mod names follow the English database.','Точность, стабильность, дальность, скорость смены и урон в ближнем бою показаны для справки и не меняют эту модель DPS пули на оптимальной дистанции. Названия модификаций — из английской базы.')}</p>
 </section>
 <section className="damage-panel"><CalculatorPanelHeading icon={Shield} label="03 / GEAR" title={t('Gear & mods','Экипировка и вставки')}/><p className="damage-help">{t('Select an attribute, then adjust its value. Limits come from Attributes. Set pieces have one minor attribute. Perfect talents select their matching named brand. Exotic gear is not modeled yet.','Выбери стат и настрой его значение ползунком. Пределы взяты из «Статы». У предметов сета один дополнительный стат. Идеальные таланты выбирают соответствующий именной бренд. Экзотическая экипировка пока не моделируется.')}</p>
 <div className="damage-gear-grid">{gear.map((g,i)=>{const set=catalog.sets.find(s=>s.id===g.brand);return <article className="damage-gear" key={i}><h3>{t(slots[i][0],slots[i][1])}</h3><label>{t('Brand / set','Бренд / сет')}<CalculatorSelect value={g.brand} onChange={e=>changeGear(i,{brand:e.target.value})}><option value="">{t('No bonus','Без бонуса')}</option><option value="improvised">{t('Improvised','Кустарное')}</option>{catalog.sets.map(s=><option key={s.id} value={s.id}>{t(s.name,s.ru?.name||s.name)}</option>)}</CalculatorSelect></label>
 {rollControl(g.core,attributes.filter(a=>a.core),core=>changeGear(i,{core}),t('Core attribute','Основной стат'))}
 {g.minor.slice(0,set?.kind==='set'?1:2).map((roll,j)=><div key={j}>{rollControl(roll,attributes.filter(a=>!a.core),r=>changeGear(i,{minor:g.minor.map((v,k)=>k===j?r:v)}),t('Attribute','Стат')+' '+(j+1),set?.kind==='set'?'':g.minor[1-j].id)}</div>)}
 {hasModSlot(i,g.brand)&&<div className="damage-roll-editor"><label>{t('Gear mod','Вставка')}<CalculatorSelect value={g.mod} onChange={e=>changeGear(i,{mod:e.target.value,modValue:undefined})}><option value="">{t('None','Нет')}</option>{mods.map(m=><option key={m.id} value={m.id}>{t(m.en,m.ru)}</option>)}</CalculatorSelect></label>{(()=>{const mod=mods.find(m=>m.id===g.mod);return mod?<CalculatorNumber label={t(mod.en,mod.ru)+' %'} value={g.modValue??numericStat(mod.value)} max={numericStat(mod.value)} onChange={modValue=>changeGear(i,{modValue})} showMax/>:null;})()}</div>}

 </article>})}</div><p className="damage-help">{t('Available mod slots','Доступно слотов вставок')}: {gear.filter((g,i)=>hasModSlot(i,g.brand)).length}. {t('Defensive and skill stats do not directly increase bullet damage.','Защитные статы и статы навыков напрямую не увеличивают урон пули.')}</p>
 {activeSets.map(s=><div className="damage-set" key={s.id}><strong>{t(s.name,s.ru?.name||s.name)} · {counts[s.id]}</strong>{s.bonuses.filter(b=>b.pieces<=counts[s.id]).map((b,i)=><p key={i}>{b.pieces}: {formatGameText(locale==='ru'?s.ru?.bonuses.find(r=>r.pieces===b.pieces)?.text||b.text:b.text)}</p>)}</div>)}
 {setRules.map(({set:s,rule})=><div className="damage-set-effect" key={s.id}><h3>{t(s.name,s.ru?.name||s.name)} · {t('Set talent','Талант сета')}</h3>{rule?<><label className="damage-check"><input type="checkbox" checked={setStates[s.id]?.enabled??true} onChange={e=>setSetStates(old=>({...old,[s.id]:{enabled:e.target.checked,values:old[s.id]?.values||{}}}))}/>{t('Conditions met — apply set bonus','Условия выполнены — применить бонус сета')}</label><p className="damage-help">{t('Assumes the set condition is active. Chest/backpack upgrades follow equipped slots automatically.','По умолчанию условие сета считается выполненным. Усиления от брони и рюкзака учитываются по надетым предметам автоматически.')}</p>{rule.note&&<p className="damage-help">{t(...rule.note)}</p>}<div className="damage-fields">{rule.controls.map(control=><CalculatorNumber key={control.id} label={t(control.en,control.ru)} max={control.max} step={1} showMax value={Math.min(control.max,setStates[s.id]?.values[control.id]??control.max)} onChange={value=>setSetStates(old=>({...old,[s.id]:{enabled:old[s.id]?.enabled??true,values:{...old[s.id]?.values,[control.id]:value}}}))}/>)}</div></>:<p className="damage-notice">{t('The set’s static bonuses are included above. Its four-piece mechanic is not included in bullet damage yet; the result is incomplete for this effect.','Обычные бонусы сета уже учтены. Его механика за 4 предмета пока не включена в урон пули; для этого эффекта расчёт неполный.')}</p>}</div>)}

 </section>
 <section className="damage-panel"><CalculatorPanelHeading icon={Sparkles} label="04 / TALENTS" title={t('Talents','Таланты')}/>
 <p className="damage-help">{t('PvE only. Selecting a supported talent enables its effect and fills stack counters to MAX. Adjust stacks or disable the effect if its conditions are not met. Set the current stacks or phase; DPS assumes this state stays constant, not a full combat simulation. Fixed weapon talents are selected automatically.','Только PvE. При выборе поддерживаемого таланта его эффект включается, а стаки заполняются до MAX. Уменьши стаки или отключи эффект, если условия не выполнены. Укажи текущие стаки или фазу: DPS предполагает постоянное состояние, а не симуляцию всего боя. Фиксированные таланты оружия выбираются автоматически. PvP-значения из описаний не используются.')}</p>
 {(['weapon','chest','backpack'] as const).map((kind,i)=>{
 const talent=selectedTalents[i];const rule=talent?talentRule(talent):undefined;const fixed=i===0&&weapon.talentSlot.startsWith('fixed:');
 const options=fixed?calculatorTalents.filter(x=>x===talent):selectableTalents(kind,weapon.type);
 return <div className="damage-talent" key={kind}><label>{t(['Weapon','Chest','Backpack'][i],['Оружие','Броня','Рюкзак'][i])}<CalculatorSelect disabled={!talentAllowed[i]||fixed} value={talent?.id||''} onChange={e=>{setTalents(old=>old.map((v,j)=>i===j?e.target.value:v));const choice=calculatorTalents.find(t=>t.id===e.target.value);const state=initialTalentState(choice);setActive(old=>old.map((v,j)=>i===j?state.active:v));setTalentValues(old=>old.map((v,j)=>i===j?state.values:v));const binding=choice?namedTalentGear(kind,choice.name)[0]:undefined;if(binding&&i>0)setGear(old=>old.map((g,j)=>j===i?{...g,brand:binding.brand}:g));}}><option value="">{t('None','Нет')}</option>{options.map(x=><option key={x.id} value={x.id}>{t(x.name,x.ru?.name||x.name)} · {t(...talentStatus(x).label)}</option>)}</CalculatorSelect></label>
 {!talentAllowed[i]&&<p className="damage-help">{t('Set and improvised gear cannot select a normal talent here. Supported set effects are calculated in the Gear section.','У сетовой и кустарной экипировки здесь нельзя выбрать обычный талант. Поддерживаемые эффекты сетов рассчитываются в блоке экипировки.')}</p>}
 {fixed&&<small>{t('Fixed weapon talent','Фиксированный талант оружия')}</small>}
 {talent?.perfect&&i>0&&<p className="damage-help">{t('Named item / brand applied: ','Именной предмет / бренд выбран: ')}{namedTalentGear(kind,talent.name).map(g=>g.name).join(' / ')||t('Choose the matching named item','Выбери соответствующий именной предмет')}</p>}
 {talent&&<><p>{formatGameText(t(talent.description,talent.ru?.description||talent.description))}</p>
 {rule?<>{rule.note&&<p className="damage-notice">{t(...rule.note)}</p>}{rule.passive?<p className="damage-help">{t('Passive bonus is automatic.','Пассивный бонус учитывается автоматически.')}</p>:<label className="damage-check"><input type="checkbox" checked={active[i]} onChange={e=>setActive(old=>old.map((v,j)=>i===j?e.target.checked:v))}/>{t('Condition met — apply PvE bonus','Условие выполнено — применить бонус PvE')}</label>}
 <div className="damage-fields">{rule.controls.map(control=><CalculatorNumber key={control.id} label={t(control.en,control.ru)} value={talentValues[i][control.id]||0} max={control.max} step={control.step||1} showMax onChange={n=>setTalentValues(old=>old.map((v,j)=>j===i?{...v,[control.id]:n}:v))}/>)}</div>
 <ul className="damage-mod-stats">{Object.entries(talentEffects[i]?.bonuses||{}).map(([key,value])=><li key={key}>{({wd:t('Weapon Damage','Урон оружия'),twd:t('Total Weapon Damage','Общий урон оружия'),chc:t('Critical Hit Chance','Шанс крита'),chd:t('Critical Hit Damage','Критический урон'),hsd:t('Headshot Damage','Урон в голову'),handling:t('Weapon Handling','Эргономичность'),reload:t('Reload Speed','Скорость перезарядки'),rof:t('Rate of Fire','Скорострельность'),mag:t('Magazine Size','Размер магазина'),out:t('Damage out of Cover','Урон вне укрытия')} as Record<string,string>)[key]||key}<strong>{value>0?'+':''}{fmt(value)}%</strong></li>)}{talentEffects[i]?.amps.map((value,j)=><li key={'amp'+j}>{t('Independent amplifier','Отдельное усиление')}<strong>+{fmt(value)}%</strong></li>)}{talentEffects[i]?.forceHead&&<li>{t('Guaranteed headshot','Гарантированное попадание в голову')}</li>}{talentEffects[i]?.criticalChance!==undefined&&<li>{t('Talent critical chance','Шанс крита от таланта')}<strong>{fmt(talentEffects[i]!.criticalChance!*100)}%</strong></li>}{talentEffects[i]?.headAmp&&<li>{t('Headshot amplifier','Усиление попадания в голову')}<strong>+{fmt(talentEffects[i]!.headAmp!)}%</strong></li>}{talentEffects[i]?.magBasePercent&&<li>{t('Base magazine bonus','Бонус базового магазина')}<strong>+{fmt(talentEffects[i]!.magBasePercent!)}%</strong></li>}{talentEffects[i]?.noReload&&<li>{t('No reload','Без перезарядки')}</li>}</ul>
 </>:<p className="damage-notice">{t(...talentStatus(talent).note)}</p>}</>}
 </div>;
 })}
 </section>
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
