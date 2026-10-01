import {Crosshair,Shield,Zap} from 'lucide-react';
import attributes from '@/data/attributes.json';
import gearMods from '@/data/gear-mods.json';
import {SectionHeading} from './SectionHeading';
import {useLocale} from './Locale';
import './attributes.css';

const groups = [
 {id:'offense',en:'Offense & weapons',ru:'Урон и оружие',Icon:Crosshair},
 {id:'defense',en:'Defense & survival',ru:'Защита и выживаемость',Icon:Shield},
 {id:'skill',en:'Skills & effects',ru:'Навыки и эффекты',Icon:Zap},
] as const;
const coreDescriptions:Record<string,{en:string;ru:string}>={
 'weapon-damage':{en:'Increases the damage dealt by your weapons.',ru:'Повышает урон, наносимый оружием.'},
 armor:{en:'Increases your armor pool.',ru:'Увеличивает запас брони.'},
 'skill-tier':{en:'Improves skills according to their tier bonuses.',ru:'Усиливает навыки в соответствии с бонусами их уровня.'},
};
export function Attributes(){
 const {t}=useLocale();
 const core=attributes.filter(item=>item.core);
 const other=attributes.filter(item=>!item.core);
 return <div className="attributes-page">
  <SectionHeading section="attributes" eyebrow={t('ATTRIBUTE REFERENCE','СПРАВОЧНИК ХАРАКТЕРИСТИК')} title={t('Attributes','Статы')}>
   <p className="heading-note">{t('Gear attributes and their maximum rolls.','Характеристики экипировки и их максимальные значения.')}</p>
  </SectionHeading>
  <section aria-labelledby="core-attributes-title">
   <div className="attributes-section-title"><h2 id="core-attributes-title">{t('Core attributes','Основные статы')}</h2><span>{core.length}</span></div>
   <div className="attributes-core-grid">{core.map(item=>{
    const Icon=groups.find(group=>group.id===item.group)!.Icon;
    return <article key={item.id} className={`attribute-core attribute-${item.group}`}>
     <Icon size={28} aria-hidden="true"/>
     <h3>{t(item.en,item.ru)}</h3>
     <strong className="attribute-core-value">{item.value}</strong><p>{t(coreDescriptions[item.id].en,coreDescriptions[item.id].ru)}</p>
    </article>;
   })}</div>
  </section>
  <section className="attributes-other" aria-labelledby="other-attributes-title">
   <div className="attributes-section-title"><h2 id="other-attributes-title">{t('Attributes','Статы')}</h2><span>{other.length}</span></div>
   <div className="attributes-groups">{groups.map(({id,en,ru,Icon})=>{
    const items=other.filter(item=>item.group===id);
    return <section className={`attribute-group attribute-${id}`} key={id} aria-labelledby={`attributes-${id}`}>
     <div className="attribute-group-heading"><Icon size={20} aria-hidden="true"/><h3 id={`attributes-${id}`}>{t(en,ru)}</h3><span>{items.length}</span></div>
     <ul>{items.map(item=><li key={item.id}><span>{t(item.en,item.ru)}</span><strong>{item.value}{item.id==='armor-regeneration'?t('/s','/с'):''}</strong></li>)}</ul>
    </section>;
   })}</div>
  </section>
  <section className="attributes-other" aria-labelledby="gear-mods-title">
   <div className="attributes-section-title"><h2 id="gear-mods-title">{t('Gear Mods','Вставки')}</h2><span>{gearMods.length}</span></div>
   <div className="attributes-groups">{groups.map(({id,Icon})=>{
    const items=gearMods.filter(item=>item.group===id);
    const labels={offense:['Offensive mods','Атакующие вставки'],defense:['Defensive mods','Защитные вставки'],skill:['Utility mods','Вставки навыков']} as const;
    return <section className={`attribute-group attribute-${id}`} key={id} aria-labelledby={`gear-mods-${id}`}>
     <div className="attribute-group-heading"><Icon size={20} aria-hidden="true"/><h3 id={`gear-mods-${id}`}>{t(labels[id][0],labels[id][1])}</h3><span>{items.length}</span></div>
     <ul>{items.map(item=><li key={item.id}><span>{t(item.en,item.ru)}</span><strong>{item.value}</strong></li>)}</ul>
    </section>;
   })}</div>
  </section>
 </div>;
}
