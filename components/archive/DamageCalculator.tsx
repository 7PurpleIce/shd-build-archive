import {useState} from 'react';
import weapons from '@/data/weapons.json';
import attributes from '@/data/attributes.json';
import mods from '@/data/gear-mods.json';
import catalog from '@/data/catalog.json';
import {PROTOTYPE_MULTIPLIER} from '@/lib/attribute-values';
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
 const [query,setQuery]=useState('');const [override,setOverride]=useState<number|null>(null);
 const [gear,setGear]=useState<Gear[]>(blankGear);
 const [weaponDamage,setWeaponDamage]=useState(15);const [watch,setWatch]=useState(10);const [specialization,setSpecialization]=useState(15);const [expertise,setExpertise]=useState(0);
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
  for(const roll of [g.core,...g.minor.slice(0,isSet?1:2)]){const a=attributes.find(a=>a.id===roll.id);if(a&&statKey[a.id])add(statKey[a.id],numericStat(a.value)*(roll.proto?PROTOTYPE_MULTIPLIER:1));}
  const mod=hasModSlot(i,g.brand)?mods.find(m=>m.id===g.mod):undefined;if(mod&&statKey[mod.id])add(statKey[mod.id],numericStat(mod.value));
 }
 const talentAmps:number[]=[];
 const talentAllowed=[!weapon.exotic&&!weapon.named, catalog.sets.find(s=>s.id===gear[1].brand)?.kind!=='set'&&gear[1].brand!=='improvised', catalog.sets.find(s=>s.id===gear[2].brand)?.kind!=='set'&&gear[2].brand!=='improvised'];
 const selectedTalents=talents.map((id,i)=>talentAllowed[i]?catalog.talents.find(t=>t.id===id):undefined);
 selectedTalents.forEach((talent,i)=>{if(!talent||!active[i])return;const kind=supportedTalents[talent.id as keyof typeof supportedTalents];const value=Number(talent.description.match(/([\d.]+)%/)?.[1]);if(kind==='amp')talentAmps.push(value);else if(kind==='twd')add('twd',value);});
 const base=override??weapon.damage;
 const wd=totals.wd+weaponDamage+watch+specialization+expertise;
 const rpm=weapon.rpm*(1+totals.rof/100),magazine=Math.max(1,Math.floor(weapon.mag*(1+totals.mag/100))),reload=weapon.reload/(1+(totals.reload+totals.handling)/100);
 const result=calculateDamage({base,wd,twd:totals.twd,chc:totals.chc,chd:totals.chd,hsd:weapon.hsd+totals.hsd,armor:totals.armor,health:totals.health,out:totals.out,armored,outside,amps:[...amps,...talentAmps],rpm,magazine,reload,headshots});
 function changeGear(i:number,patch:Partial<Gear>){setGear(old=>old.map((g,j)=>{if(j!==i)return g;const next={...g,...patch};if(catalog.sets.find(s=>s.id===next.brand)?.kind==='set')next.minor=[next.minor[0],{id:'',proto:false}];if(!hasModSlot(i,next.brand))next.mod='';return next;}));}
 function numberField(label:string,value:number,onChange:(v:number)=>void,max=10000){return <label className="damage-field">{label}<input type="number" min={0} max={max} step="any" value={value} onChange={e=>{const n=Number(e.target.value);onChange(Number.isFinite(n)?Math.min(max,Math.max(0,n)):0)}}/></label>;}
 function rollControl(roll:Roll,options:typeof attributes,onChange:(r:Roll)=>void,label:string,excluded=''){return <div className="damage-roll"><label>{label}<select value={roll.id} onChange={e=>onChange({...roll,id:e.target.value})}><option value="">{t('None','Нет')}</option>{options.filter(a=>a.id!==excluded).map(a=><option key={a.id} value={a.id}>{t(a.en,a.ru)} · {fmt(numericStat(a.value)*(roll.proto?PROTOTYPE_MULTIPLIER:1))}{a.value.endsWith('%')?'%':''}</option>)}</select></label><label className="damage-check prototype"><input type="checkbox" checked={roll.proto} disabled={!roll.id} onChange={e=>onChange({...roll,proto:e.target.checked})}/>{t('Proto','Прото')}</label></div>;}
 return <div className="damage-page">
 <SectionHeading section="damage" eyebrow={t('ADMIN LAB · V1 · PVE','ЛАБОРАТОРИЯ АДМИНА · V1 · PVE')} title={t('Damage calculator','Калькулятор урона')}/>
 <p className="damage-notice">{t('Experimental PvE calculation at optimal range, with all shots landing. Weapon base stats are provisional and editable. No PvP normalization or damage falloff.','Тестовый расчёт PvE на оптимальной дистанции, при попадании всех выстрелов. Базовые параметры оружия требуют сверки; урон можно изменить. Без нормализации PvP и падения урона с расстоянием.')}</p>
 <div className="damage-layout"><div className="damage-config">
 <section className="damage-panel"><h2>{t('01 / Weapon','01 / Оружие')}</h2>
 <div className="damage-fields"><label>{t('Class','Класс')}<select value={weapon.type} onChange={e=>{setWeaponId(weapons.find(w=>w.type===e.target.value)!.id);setOverride(null);setQuery('');setTalents(old=>['',old[1],old[2]]);setActive(old=>[false,old[1],old[2]]);}}>{types.map(([id,en,ru])=><option key={id} value={id}>{t(en,ru)}</option>)}</select></label><label>{t('Search weapon','Поиск оружия')}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Weapon name','Название оружия')}/></label></div>
 <label>{t('Weapon','Оружие')}<select value={weaponId} onChange={e=>{setWeaponId(e.target.value);setOverride(null);setTalents(old=>['',old[1],old[2]]);setActive(old=>[false,old[1],old[2]]);}}>{weapons.filter(w=>w.type===weapon.type&&(w.id===weaponId||w.name.toLowerCase().includes(query.toLowerCase()))).map(w=><option key={w.id} value={w.id}>{w.name}{w.exotic?' · Exotic':w.named?' · Named':''}</option>)}</select></label>
 <div className="damage-fields">{numberField(t('Base damage','Базовый урон'),base,setOverride,10000000)}{numberField(t('Weapon core damage %','Урон на оружии %'),weaponDamage,setWeaponDamage,100)}{numberField(t('Watch weapon damage %','Урон от часов %'),watch,setWatch,100)}{numberField(t('Specialization damage %','Урон специализации %'),specialization,setSpecialization,100)}{numberField(t('Expertise damage %','Урон мастерства %'),expertise,setExpertise,100)}</div>
 <p className="damage-help">{t('RPM / magazine / reload','Скорострельность / магазин / перезарядка')}: {fmt(weapon.rpm)} / {weapon.mag} / {fmt(weapon.reload)} {t('s','с')}. <button type="button" onClick={()=>setOverride(null)}>{t('Restore base damage','Вернуть базовый урон')}</button></p>
 <p className="damage-help">{t('Enter weapon attributes, attachments, base character CHD and remaining watch bonuses in Additional stats below; they are not added automatically. Exotic and named weapon talents are manual in V1. Shotgun damage is treated as a whole shot; pellet hits are not simulated.','Атрибуты оружия, обвесы, базовый крит. урон персонажа и остальные бонусы часов укажи ниже в дополнительных статах — автоматически они не прибавляются. Таланты экзотического и именного оружия в V1 вводятся вручную. Урон дробовика считается за весь выстрел, попадания отдельных дробин не моделируются.')}</p>
 </section>
 <section className="damage-panel"><h2>{t('02 / Gear & mods','02 / Экипировка и вставки')}</h2><p className="damage-help">{t('Maximum rolls from Attributes. Set pieces have one minor attribute. Named/exotic gear is not modeled yet; enter unique bonuses manually.','Максимальные значения из «Статы». У предметов сета один дополнительный стат. Именная и экзотическая экипировка пока не моделируется; уникальные бонусы добавляются вручную.')}</p>
 <div className="damage-gear-grid">{gear.map((g,i)=>{const set=catalog.sets.find(s=>s.id===g.brand);return <article className="damage-gear" key={i}><h3>{t(slots[i][0],slots[i][1])}</h3><label>{t('Brand / set','Бренд / сет')}<select value={g.brand} onChange={e=>changeGear(i,{brand:e.target.value})}><option value="">{t('No bonus','Без бонуса')}</option><option value="improvised">{t('Improvised','Кустарное')}</option>{catalog.sets.map(s=><option key={s.id} value={s.id}>{t(s.name,s.ru?.name||s.name)}</option>)}</select></label>
 {rollControl(g.core,attributes.filter(a=>a.core),core=>changeGear(i,{core}),t('Core attribute','Основной стат'))}
 {g.minor.slice(0,set?.kind==='set'?1:2).map((roll,j)=><div key={j}>{rollControl(roll,attributes.filter(a=>!a.core),r=>changeGear(i,{minor:g.minor.map((v,k)=>k===j?r:v)}),t('Attribute','Стат')+' '+(j+1),set?.kind==='set'?'':g.minor[1-j].id)}</div>)}
 {hasModSlot(i,g.brand)&&<label>{t('Gear mod','Вставка')}<select value={g.mod} onChange={e=>changeGear(i,{mod:e.target.value})}><option value="">{t('None','Нет')}</option>{mods.map(m=><option key={m.id} value={m.id}>{t(m.en,m.ru)} {m.value}</option>)}</select></label>}
 </article>})}</div><p className="damage-help">{t('Available mod slots','Доступно слотов вставок')}: {gear.filter((g,i)=>hasModSlot(i,g.brand)).length}. {t('Defensive and skill stats do not directly increase bullet damage.','Защитные статы и статы навыков напрямую не увеличивают урон пули.')}</p>
 {activeSets.map(s=><div className="damage-set" key={s.id}><strong>{t(s.name,s.ru?.name||s.name)} · {counts[s.id]}</strong>{s.bonuses.filter(b=>b.pieces<=counts[s.id]).map((b,i)=><p key={i}>{b.pieces}: {locale==='ru'?s.ru?.bonuses.find(r=>r.pieces===b.pieces)?.text||b.text:b.text}</p>)}</div>)}
 <p className="damage-notice">{t('Static damage, crit, handling, magazine and fire-rate bonuses are automatic. Four-piece set talents and chest/backpack upgrades are NOT automatic: add active effects below as separate modifiers.','Обычные бонусы урона, крита, эргономичности, магазина и скорострельности считаются автоматически. Таланты за 4 предмета и их усиления от брони/рюкзака НЕ автоматизированы: активные эффекты добавляй ниже отдельными модификаторами.')}</p>
 </section>
 <section className="damage-panel"><h2>{t('03 / Talents','03 / Таланты')}</h2>
 {(['weapon','chest','backpack'] as const).map((kind,i)=>{const talent=selectedTalents[i];const supported=!!talent&&talent.id in supportedTalents;return <div className="damage-talent" key={kind}><label>{t(['Weapon','Chest','Backpack'][i],['Оружие','Броня','Рюкзак'][i])}<select disabled={!talentAllowed[i]} value={talentAllowed[i]?talents[i]:''} onChange={e=>{setTalents(old=>old.map((v,j)=>i===j?e.target.value:v));setActive(old=>old.map((v,j)=>i===j?false:v));}}><option value="">{t('None','Нет')}</option>{catalog.talents.filter(x=>x.kind===kind&&!x.exotic&&(kind!=='weapon'||(!weapon.exotic&&!weapon.named&&x.weaponTypes.includes(weapon.type)))).map(x=><option key={x.id} value={x.id}>{t(x.name,x.ru?.name||x.name)}{x.id in supportedTalents?'':' · '+t('manual','вручную')}</option>)}</select></label>{!talentAllowed[i]&&<p className="damage-help">{t("This item uses a fixed effect. See its description and enter the active modifier manually.","У этого предмета фиксированный эффект. Сверь описание и введи активный модификатор вручную.")}</p>}{talent&&<><p>{t(talent.description,talent.ru?.description||talent.description)}</p>{supported?<label className="damage-check"><input type="checkbox" checked={active[i]} onChange={e=>setActive(old=>old.map((v,j)=>i===j?e.target.checked:v))}/>{t('Condition met — apply bonus','Условие выполнено — применить бонус')}</label>:<p className="damage-notice">{t('Reference only. Enter this talent’s active effect manually below.','Только справка. Активный эффект этого таланта введи вручную ниже.')}</p>}</>}</div>})}
 </section>
 <section className="damage-panel"><h2>{t('04 / Additional stats','04 / Дополнительные статы')}</h2><p className="damage-help">{t('Only bonuses not already included above. CHC/CHD here include character base, watch, weapon cores and mods.','Только бонусы, ещё не учтённые выше. Здесь в шанс/урон крита включи базовые статы персонажа, часы, атрибуты и обвесы оружия.')}</p><div className="damage-fields">{([
 ['wd','Weapon Damage','Урон от оружия'],['twd','Total Weapon Damage','Общий урон от оружия'],['chc','Critical Hit Chance','Шанс крит. попадания'],['chd','Critical Hit Damage','Крит. урон'],['hsd','Additional Headshot Damage','Доп. урон в голову'],['armor','Damage to Armor','Урон по броне'],['health','Damage to Health','Урон по здоровью'],['out','Damage out of Cover','Урон вне укрытия'],['rof','Rate of Fire','Скорострельность'],['reload','Reload Speed','Скорость перезарядки'],['mag','Magazine Size','Размер магазина']
 ] as const).map(([key,en,ru])=><div key={key}>{numberField(t(en,ru)+' %',extra[key],v=>setExtra(old=>({...old,[key]:v})))}</div>)}</div>
 <h3>{t('Independent damage amplifiers','Независимые усиления урона')}</h3><p className="damage-help">{t('One row per independent multiplier, including separately modeled set talents.','Одна строка на независимый множитель, включая отдельно рассчитываемые таланты сетов.')}</p>
 {amps.map((a,i)=><div className="damage-amp" key={i}>{numberField(t('Amplifier','Усиление')+' '+(i+1)+' %',a,v=>setAmps(old=>old.map((x,j)=>j===i?v:x)))}<button type="button" onClick={()=>setAmps(old=>old.filter((_,j)=>j!==i))}>{t('Remove','Убрать')}</button></div>)}<button type="button" className="damage-action" onClick={()=>setAmps(old=>[...old,0])}>{t('+ Add multiplier','+ Добавить множитель')}</button>
 </section></div>
 <aside className="damage-results"><div className="damage-panel"><h2>{t('Damage output','Результат')}</h2><label>{t('Target','Цель')}<select value={armored?'armor':'health'} onChange={e=>setArmored(e.target.value==='armor')}><option value="armor">{t('Armor','Броня')}</option><option value="health">{t('Health','Здоровье')}</option></select></label><label className="damage-check"><input type="checkbox" checked={outside} onChange={e=>setOutside(e.target.checked)}/>{t('Out of cover','Вне укрытия')}</label>{numberField(t('Headshot share %','Доля попаданий в голову %'),headshots,setHeadshots,100)}
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
