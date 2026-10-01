import {useState,type CSSProperties} from 'react';
import {Crosshair} from 'lucide-react';
import {CalculatorSelect} from './CalculatorSelect';
import {WatchStats} from './WatchStats';
import {watchDamageBonuses,type WatchPoints} from '@/lib/shd-watch';
import weapons from '@/data/weapons.json';
import attributes from '@/data/attributes.json';
import mods from '@/data/gear-mods.json';
import catalog from '@/data/catalog.json';
import {attributeAmount} from '@/lib/attribute-values';
import weaponMods from '@/data/weapon-mods.json';
import {WEAPON_MOD_SLOTS,compatibleMod,selectedWeaponMods,attachmentBonuses,modStats,effectiveWeaponCycle,type WeaponModSlot} from '@/lib/weapon-mods';
import {calculateDamage,hasModSlot,numericStat,staticBonus} from '@/lib/damage';
import {useLocale} from './Locale';
import {useOwner} from './OwnerAuth';
import {SectionHeading} from './SectionHeading';
import './damage.css';
const types=[['assault-rifle','Assault rifles','Штурмовые винтовки'],['smg','SMGs','Пистолеты-пулемёты'],['lmg','LMGs','Пулемёты'],['rifle','Rifles','Винтовки'],['marksman-rifle','Marksman rifles','Снайперские винтовки'],['shotgun','Shotguns','Дробовики'],['pistol','Pistols','Пистолеты']] as const;
const slots=[['Mask','Маска'],['Chest','Броня'],['Backpack','Рюкзак'],['Gloves','Перчатки'],['Holster','Кобура'],['Kneepads','Наколенники']] as const;
type Roll={id:string;proto:boolean};
type Gear={brand:string;core:Roll;minor:Roll[];mod:string};
const blankGear=():Gear[]=>slots.map(()=>({brand:'',core:{id:'weapon-damage',proto:false},minor:[{id:'',proto:false},{id:'',proto:false}],mod:''}));
const statKey:Record<string,string>={'weapon-damage':'wd','critical-hit-chance':'chc','critical-hit-damage':'chd','headshot-damage':'hsd','weapon-handling':'handling'};
const supportedTalents={'chest-glass-cannon':'amp','backpack-vigilance':'twd','weapon-sadist':'amp'} as const;
const emptyExtra={wd:0,twd:0,chc:0,chd:0,hsd:0,armor:0,health:0,out:0,rof:0,reload:0,mag:0};
export default function DamageCalculator(){const {canManage}=useOwner();return canManage?<CalculatorBody/>:null;}
function CalculatorBody(){
 const {t,locale}=useLocale();
 const [weaponId,setWeaponId]=useState(weapons.find(w=>w.name==='FAMAS 2010')!.id);
 const weapon=weapons.find(w=>w.id===weaponId)!;
 const [attachments,setAttachments]=useState<Partial<Record<WeaponModSlot,string>>>({});
 const [query,setQuery]=useState('');const [override,setOverride]=useState<number|null>(null);
 const [gear,setGear]=useState<Gear[]>(blankGear);
 const [weaponDamage,setWeaponDamage]=useState(15);const [watch,setWatch]=useState<WatchPoints>({wd:50});const [specialization,setSpecialization]=useState(15);const [expertise,setExpertise]=useState(0);
 const [extra,setExtra]=useState(emptyExtra);const [amps,setAmps]=useState<number[]>([]);
 const [talents,setTalents]=useState(['','','']);const [active,setActive]=useState([false,false,false]);
 const [armored,setArmored]=useState(true);const [outside,setOutside]=useState(true);const [headshots,setHeadshots]=useState(0);
 const factor=(n:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:4}).format(n);
 const fmt=(n:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(n);
 const totals:Record<string,number>={...extra,handling:0};
 const add=(key:string,value:number)=>{totals[key]=(totals[key]||0)+value;};
 const counts:Record<string,number>={};gear.forEach(g=>{if(g.brand&&g.brand!=='improvised')counts[g.brand]=(counts[g.brand]||0)+1;});
 const activeSets=catalog.sets.filter(s=>counts[s.id]);
 for(const s of activeSets)for(const b of s.bonuses)if(b.pieces<=counts[s.id])for(const v of staticBonus(b.text,weapon.type))add(v.key,v.value);
 for(const [i,g] of gear.entries()){
  const isSet=catalog.sets.find(s=>s.id===g.brand)?.kind==='set';
  for(const roll of [g.core,...g.minor.slice(0,isSet?1:2)]){const a=attributes.find(a=>a.id===roll.id);if(a&&statKey[a.id])add(statKey[a.id],attributeAmount(a,roll.proto));}
  const mod=hasModSlot(i,g.brand)?mods.find(m=>m.id===g.mod):undefined;if(mod&&statKey[mod.id])add(statKey[mod.id],numericStat(mod.value));
 }
 const talentAmps:number[]=[];
 const talentAllowed=[!weapon.exotic&&!weapon.named, catalog.sets.find(s=>s.id===gear[1].brand)?.kind!=='set'&&gear[1].brand!=='improvised', catalog.sets.find(s=>s.id===gear[2].brand)?.kind!=='set'&&gear[2].brand!=='improvised'];
 const selectedTalents=talents.map((id,i)=>talentAllowed[i]?catalog.talents.find(t=>t.id===id):undefined);
 selectedTalents.forEach((talent,i)=>{if(!talent||!active[i])return;const kind=supportedTalents[talent.id as keyof typeof supportedTalents];const value=Number(talent.description.match(/([\d.]+)%/)?.[1]);if(kind==='amp')talentAmps.push(value);else if(kind==='twd')add('twd',value);});
 const equippedMods=selectedWeaponMods(weapon.slots,attachments,weaponMods);
 const modBonuses=attachmentBonuses(equippedMods);
 Object.entries(modBonuses).forEach(([key,value])=>add(key,value));
 Object.entries(watchDamageBonuses(watch)).forEach(([key,value])=>add(key,value));
 const base=override??weapon.damage;
 const wd=totals.wd+weaponDamage+specialization+expertise;
 const {rpm,magazine,reload}=effectiveWeaponCycle(weapon,totals);
 const result=calculateDamage({base,wd,twd:totals.twd,chc:totals.chc,chd:totals.chd,hsd:weapon.hsd+totals.hsd,armor:totals.armor,health:totals.health,out:totals.out,armored,outside,amps:[...amps,...talentAmps],rpm,magazine,reload,headshots});
 function changeGear(i:number,patch:Partial<Gear>){setGear(old=>old.map((g,j)=>{if(j!==i)return g;const next={...g,...patch};if(catalog.sets.find(s=>s.id===next.brand)?.kind==='set')next.minor=[next.minor[0],{id:'',proto:false}];if(!hasModSlot(i,next.brand))next.mod='';return next;}));}
 function modLabel(id:string){const names:Record<string,[string,string]>={'critical-hit-chance':['Critical Hit Chance','Шанс крита'],'critical-hit-damage':['Critical Hit Damage','Критический урон'],'headshot-damage':['Headshot Damage','Урон в голову'],'weapon-damage':['Weapon Damage','Урон оружия'],'weapon-handling':['Weapon Handling','Эргономичность'],'reload-speed':['Reload Speed','Скорость перезарядки'],'rate-of-fire':['Rate of Fire','Скорострельность'],'magazine-size':['Magazine Size','Размер магазина'],'accuracy':['Accuracy','Точность'],'stability':['Stability','Стабильность'],'optimal-range':['Optimal Range','Оптимальная дальность'],'swap-speed':['Swap Speed','Скорость смены'],'melee-damage':['Melee Damage','Урон в ближнем бою']};return names[id]?t(...names[id]):id;}
 function numberField(label:string,value:number,onChange:(v:number)=>void,max=10000){return <label className="damage-field">{label}<input type="number" min={0} max={max} step="any" value={value} onChange={e=>{const n=Number(e.target.value);onChange(Number.isFinite(n)?Math.min(max,Math.max(0,n)):0)}}/>{max<=100&&<input type="range" className="calculator-range" min={0} max={max} step={1} value={value} aria-label={label} onChange={e=>onChange(Number(e.target.value))} style={{'--range-fill':`${value/max*100}%`} as CSSProperties}/>}</label>;}
 function rollControl(roll:Roll,options:typeof attributes,onChange:(r:Roll)=>void,label:string,excluded=''){return <div className="damage-roll"><label>{label}<CalculatorSelect value={roll.id} onChange={e=>onChange({...roll,id:e.target.value})}><option value="">{t('None','Нет')}</option>{options.filter(a=>a.id!==excluded).map(a=><option key={a.id} value={a.id}>{t(a.en,a.ru)} · {fmt(attributeAmount(a,roll.proto))}{a.value.endsWith('%')?'%':''}</option>)}</CalculatorSelect></label><label className="damage-check prototype"><input type="checkbox" checked={roll.proto} disabled={!roll.id} onChange={e=>onChange({...roll,proto:e.target.checked})}/>{t('Proto','Прото')}</label></div>;}
 return <div className="damage-page">
 <SectionHeading section="damage" eyebrow={t('ADMIN LAB · V1 · PVE','ЛАБОРАТОРИЯ АДМИНА · V1 · PVE')} title={t('Damage calculator','Калькулятор урона')}/>
 <p className="damage-notice">{t('Experimental PvE calculation at optimal range, with all shots landing. Weapon base stats are provisional and editable. No PvP normalization or damage falloff.','Тестовый расчёт PvE на оптимальной дистанции, при попадании всех выстрелов. Базовые параметры оружия требуют сверки; урон можно изменить. Без нормализации PvP и падения урона с расстоянием.')}</p>
 <div className="damage-layout"><div className="damage-config">
 <section className="damage-panel"><h2>{t('01 / Weapon','01 / Оружие')}</h2>
 <div className="damage-fields"><label>{t('Class','Класс')}<CalculatorSelect value={weapon.type} onChange={e=>{setWeaponId(weapons.find(w=>w.type===e.target.value)!.id);setOverride(null);setAttachments({});setQuery('');setTalents(old=>['',old[1],old[2]]);setActive(old=>[false,old[1],old[2]]);}}>{types.map(([id,en,ru])=><option key={id} value={id}>{t(en,ru)}</option>)}</CalculatorSelect></label><label>{t('Search weapon','Поиск оружия')}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Weapon name','Название оружия')}/></label></div>
 <label>{t('Weapon','Оружие')}<CalculatorSelect value={weaponId} onChange={e=>{setWeaponId(e.target.value);setOverride(null);setAttachments({});setTalents(old=>['',old[1],old[2]]);setActive(old=>[false,old[1],old[2]]);}}>{weapons.filter(w=>w.type===weapon.type&&(w.id===weaponId||w.name.toLowerCase().includes(query.toLowerCase()))).map(w=><option key={w.id} value={w.id}>{w.name}{w.exotic?' · Exotic':w.named?' · Named':''}</option>)}</CalculatorSelect></label>
 <div className="damage-fields">{numberField(t('Base damage','Базовый урон'),base,setOverride,10000000)}{numberField(t('Weapon core damage %','Урон на оружии %'),weaponDamage,setWeaponDamage,100)}{numberField(t('Specialization damage %','Урон специализации %'),specialization,setSpecialization,100)}{numberField(t('Expertise damage %','Урон мастерства %'),expertise,setExpertise,30)}</div>
 <p className="damage-help">{t('RPM / magazine / reload','Скорострельность / магазин / перезарядка')}: {fmt(weapon.rpm)} / {weapon.mag} / {fmt(weapon.reload)} {t('s','с')}. <button type="button" onClick={()=>setOverride(null)}>{t('Restore base damage','Вернуть базовый урон')}</button></p>
 <p className="damage-help">{t('Enter weapon attributes, base character CHD and other bonuses in Other bonuses below; they are not added automatically. Exotic and named weapon talents are manual in V1. Shotgun damage is treated as a whole shot; pellet hits are not simulated.','Атрибуты оружия, базовый крит. урон персонажа и другие бонусы укажи ниже в блоке «Остальные бонусы» — автоматически они не прибавляются. Таланты экзотического и именного оружия в V1 вводятся вручную. Урон дробовика считается за весь выстрел, попадания отдельных дробин не моделируются.')}</p>
 </section>
 <section className="damage-panel damage-attachments"><div className="damage-block-title"><Crosshair size={23}/><div><span>02 / MODS</span><h2>{t('Weapon attachments','Модификации оружия')}</h2></div></div>
 <p className="damage-help">{t('Compatible attachments only. Fixed attachments are included automatically. All listed bonuses and penalties affecting damage, fire rate, reload or magazine size are included below.','Только совместимые модификации. Фиксированные обвесы установлены автоматически. Бонусы и штрафы к урону, скорострельности, перезарядке и магазину учитываются в результате.')}</p>
 <div className="damage-gear-grid">{WEAPON_MOD_SLOTS.map(slot=>{const spec=weapon.slots[slot];const fixed=spec.startsWith('fixed:');const current=equippedMods.find(m=>m.category===slot);const labels={optics:['Optics','Прицел'],magazine:['Magazine','Магазин'],muzzle:['Muzzle','Дульная модификация'],underbarrel:['Underbarrel','Подствольная модификация']} as const;
 return <div className="damage-gear" key={slot}><label>{t(labels[slot][0],labels[slot][1])}<CalculatorSelect disabled={fixed||!spec.startsWith('type:')} value={current?.name||''} onChange={e=>setAttachments(old=>({...old,[slot]:e.target.value}))}><option value="">{spec==='N/A'?t('No slot','Нет слота'):t('None','Нет')}</option>{weaponMods.filter(m=>compatibleMod(spec,slot,m)).map(m=><option key={m.name} value={m.name}>{m.name}</option>)}</CalculatorSelect></label>{fixed&&<small>{t('Fixed attachment','Фиксированная модификация')}</small>}{current&&<ul className="damage-mod-stats">{modStats(current).map(stat=><li key={stat.id}>{modLabel(stat.id)} <strong>{stat.value>0?'+':''}{fmt(stat.value)}{stat.percent?'%':''}</strong></li>)}</ul>}</div>;
 })}</div><p className="damage-help">{t('Accuracy, stability, range, swap speed and melee damage are shown for reference; they do not change this optimal-range bullet DPS model. Mod names follow the English database.','Точность, стабильность, дальность, скорость смены и урон в ближнем бою показаны для справки и не меняют эту модель DPS пули на оптимальной дистанции. Названия модификаций — из английской базы.')}</p>
 </section>
 <section className="damage-panel"><h2>{t('03 / Gear & mods','03 / Экипировка и вставки')}</h2><p className="damage-help">{t('Maximum rolls from Attributes. Set pieces have one minor attribute. Named/exotic gear is not modeled yet; enter unique bonuses manually.','Максимальные значения из «Статы». У предметов сета один дополнительный стат. Именная и экзотическая экипировка пока не моделируется; уникальные бонусы добавляются вручную.')}</p>
 <div className="damage-gear-grid">{gear.map((g,i)=>{const set=catalog.sets.find(s=>s.id===g.brand);return <article className="damage-gear" key={i}><h3>{t(slots[i][0],slots[i][1])}</h3><label>{t('Brand / set','Бренд / сет')}<CalculatorSelect value={g.brand} onChange={e=>changeGear(i,{brand:e.target.value})}><option value="">{t('No bonus','Без бонуса')}</option><option value="improvised">{t('Improvised','Кустарное')}</option>{catalog.sets.map(s=><option key={s.id} value={s.id}>{t(s.name,s.ru?.name||s.name)}</option>)}</CalculatorSelect></label>
 {rollControl(g.core,attributes.filter(a=>a.core),core=>changeGear(i,{core}),t('Core attribute','Основной стат'))}
 {g.minor.slice(0,set?.kind==='set'?1:2).map((roll,j)=><div key={j}>{rollControl(roll,attributes.filter(a=>!a.core),r=>changeGear(i,{minor:g.minor.map((v,k)=>k===j?r:v)}),t('Attribute','Стат')+' '+(j+1),set?.kind==='set'?'':g.minor[1-j].id)}</div>)}
 {hasModSlot(i,g.brand)&&<label>{t('Gear mod','Вставка')}<CalculatorSelect value={g.mod} onChange={e=>changeGear(i,{mod:e.target.value})}><option value="">{t('None','Нет')}</option>{mods.map(m=><option key={m.id} value={m.id}>{t(m.en,m.ru)} {m.value}</option>)}</CalculatorSelect></label>}
 </article>})}</div><p className="damage-help">{t('Available mod slots','Доступно слотов вставок')}: {gear.filter((g,i)=>hasModSlot(i,g.brand)).length}. {t('Defensive and skill stats do not directly increase bullet damage.','Защитные статы и статы навыков напрямую не увеличивают урон пули.')}</p>
 {activeSets.map(s=><div className="damage-set" key={s.id}><strong>{t(s.name,s.ru?.name||s.name)} · {counts[s.id]}</strong>{s.bonuses.filter(b=>b.pieces<=counts[s.id]).map((b,i)=><p key={i}>{b.pieces}: {locale==='ru'?s.ru?.bonuses.find(r=>r.pieces===b.pieces)?.text||b.text:b.text}</p>)}</div>)}
 <p className="damage-notice">{t('Static damage, crit, handling, magazine and fire-rate bonuses are automatic. Four-piece set talents and chest/backpack upgrades are NOT automatic: add active effects below as separate modifiers.','Обычные бонусы урона, крита, эргономичности, магазина и скорострельности считаются автоматически. Таланты за 4 предмета и их усиления от брони/рюкзака НЕ автоматизированы: активные эффекты добавляй ниже отдельными модификаторами.')}</p>
 </section>
 <section className="damage-panel"><h2>{t('04 / Talents','04 / Таланты')}</h2>
 {(['weapon','chest','backpack'] as const).map((kind,i)=>{const talent=selectedTalents[i];const supported=!!talent&&talent.id in supportedTalents;return <div className="damage-talent" key={kind}><label>{t(['Weapon','Chest','Backpack'][i],['Оружие','Броня','Рюкзак'][i])}<CalculatorSelect disabled={!talentAllowed[i]} value={talentAllowed[i]?talents[i]:''} onChange={e=>{setTalents(old=>old.map((v,j)=>i===j?e.target.value:v));setActive(old=>old.map((v,j)=>i===j?false:v));}}><option value="">{t('None','Нет')}</option>{catalog.talents.filter(x=>x.kind===kind&&!x.exotic&&(kind!=='weapon'||(!weapon.exotic&&!weapon.named&&x.weaponTypes.includes(weapon.type)))).map(x=><option key={x.id} value={x.id}>{t(x.name,x.ru?.name||x.name)}{x.id in supportedTalents?'':' · '+t('manual','вручную')}</option>)}</CalculatorSelect></label>{!talentAllowed[i]&&<p className="damage-help">{t("This item uses a fixed effect. See its description and enter the active modifier manually.","У этого предмета фиксированный эффект. Сверь описание и введи активный модификатор вручную.")}</p>}{talent&&<><p>{t(talent.description,talent.ru?.description||talent.description)}</p>{supported?<label className="damage-check"><input type="checkbox" checked={active[i]} onChange={e=>setActive(old=>old.map((v,j)=>i===j?e.target.checked:v))}/>{t('Condition met — apply bonus','Условие выполнено — применить бонус')}</label>:<p className="damage-notice">{t('Reference only. Enter this talent’s active effect manually below.','Только справка. Активный эффект этого таланта введи вручную ниже.')}</p>}</>}</div>})}
 </section>
 <WatchStats value={watch} onChange={setWatch}/>
 <section className="damage-panel"><h2>{t('06 / Other bonuses','06 / Остальные бонусы')}</h2><p className="damage-help">{t('Only bonuses not already included above. Enter character base stats, weapon attributes and other unmodeled bonuses here. Selected attachments and watch stats are already included.','Только бонусы, ещё не учтённые выше. Здесь укажи базовые статы персонажа, атрибуты оружия и другие неучтённые бонусы. Выбранные обвесы и часы уже учтены.')}</p><div className="damage-fields">{([
 ['wd','Weapon Damage','Урон от оружия'],['twd','Total Weapon Damage','Общий урон от оружия'],['chc','Critical Hit Chance','Шанс крит. попадания'],['chd','Critical Hit Damage','Крит. урон'],['hsd','Additional Headshot Damage','Доп. урон в голову'],['armor','Damage to Armor','Урон по броне'],['health','Damage to Health','Урон по здоровью'],['out','Damage out of Cover','Урон вне укрытия'],['rof','Rate of Fire','Скорострельность'],['reload','Reload Speed','Скорость перезарядки'],['mag','Magazine Size','Размер магазина']
 ] as const).map(([key,en,ru])=><div key={key}>{numberField(t(en,ru)+' %',extra[key],v=>setExtra(old=>({...old,[key]:v})))}</div>)}</div>
 </section><section className="damage-panel"><h2>{t('07 / Damage amplifiers','07 / Усиления урона')}</h2><p className="damage-help">{t('One row per independent multiplier, including separately modeled set talents.','Одна строка на независимый множитель, включая отдельно рассчитываемые таланты сетов.')}</p>
 {amps.map((a,i)=><div className="damage-amp" key={i}>{numberField(t('Amplifier','Усиление')+' '+(i+1)+' %',a,v=>setAmps(old=>old.map((x,j)=>j===i?v:x)))}<button type="button" onClick={()=>setAmps(old=>old.filter((_,j)=>j!==i))}>{t('Remove','Убрать')}</button></div>)}<button type="button" className="damage-action" onClick={()=>setAmps(old=>[...old,0])}>{t('+ Add multiplier','+ Добавить множитель')}</button>
 </section></div>
 <aside className="damage-results"><div className="damage-panel"><h2>{t('Damage output','Результат')}</h2><label>{t('Target','Цель')}<CalculatorSelect value={armored?'armor':'health'} onChange={e=>setArmored(e.target.value==='armor')}><option value="armor">{t('Armor','Броня')}</option><option value="health">{t('Health','Здоровье')}</option></CalculatorSelect></label><label className="damage-check"><input type="checkbox" checked={outside} onChange={e=>setOutside(e.target.checked)}/>{t('Out of cover','Вне укрытия')}</label>{numberField(t('Headshot share %','Доля попаданий в голову %'),headshots,setHeadshots,100)}
 <div className="damage-hero"><span>{t('Average hit','Среднее попадание')}</span><strong>{fmt(result.average)}</strong></div><dl>{([
 ['Body','В тело',result.body],['Critical body','Крит в тело',result.crit],['Headshot','В голову',result.head],['Critical headshot','Крит в голову',result.critHead],['Burst DPS','DPS без перезарядки',result.burst],['Sustained DPS','DPS с перезарядкой',result.sustained]
 ] as const).map(([en,ru,value])=><div key={en}><dt>{t(en,ru)}</dt><dd>{fmt(value)}</dd></div>)}</dl>
 <p className="damage-help">{t('Expected damage uses crit chance and headshot share. Sustained DPS assumes continuous fire, fixed buffs and full-magazine reloads.','Средний урон учитывает шанс крита и долю попаданий в голову. DPS предполагает непрерывную стрельбу, постоянные баффы и перезарядку полного магазина.')}</p>
 <h3>{t('Calculation breakdown','Разбор расчёта')}</h3><dl>{[['Base',base],['Weapon Damage %',wd],['Total Weapon Damage %',totals.twd],['CHC %',result.chance*100],['CHD %',totals.chd],['HSD %',weapon.hsd+totals.hsd],['RPM',rpm],[t('Magazine','Магазин'),magazine],[t('Reload, s','Перезарядка, с'),reload]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{fmt(Number(value))}</dd></div>)}</dl>
 {totals.chc>60&&<p className="damage-notice">{t('Critical chance above 60% is excluded.','Шанс крита свыше 60% не учитывается.')}</p>}
 <p className="damage-formula">{fmt(base)} × {factor(1+wd/100)} × {factor(1+totals.twd/100)} × {factor(1+(armored?totals.armor:totals.health)/100)} × {factor(1+(outside?totals.out:0)/100)}{[...talentAmps,...amps].map((a,i)=><span key={i}> × {new Intl.NumberFormat(locale,{maximumFractionDigits:4}).format(1+a/100)}</span>)}</p><small>{t('Body damage before crit / headshot.','Урон в тело до крита / попадания в голову.')}</small>
 </div></aside></div>
 <p className="damage-help">{t('Weapon data','Данные оружия')}: <a href="https://github.com/div2hub/game-data/tree/main/weapons" target="_blank" rel="noreferrer">div2hub</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. {t('Gear, attributes and talents: shared archive data.','Экипировка, статы и таланты: общие данные справочника.')}</p>
 </div>;
}
