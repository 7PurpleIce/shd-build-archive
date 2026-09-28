'use client';
import {useLocale} from './Locale';
export type CoreStat='weapon-damage'|'armor'|'skill-tier';
const options:{id:CoreStat;en:string;ru:string;color:string}[]=[
 {id:'weapon-damage',en:'Weapon damage',ru:'Урон от оружия',color:'red'},
 {id:'armor',en:'Armor',ru:'Броня',color:'blue'},
 {id:'skill-tier',en:'Skill tier',ru:'Уровень навыка',color:'yellow'},
];
export function CoreStatFilter({selected,onChange}:{selected:CoreStat[];onChange:(values:CoreStat[])=>void}){
 const{t}=useLocale();
 return <fieldset className="core-stat-filter" aria-label={t('Core attribute filter','Фильтр основной характеристики')}><legend className="sr-only">{t('Core attribute','Основная характеристика')}</legend>{options.map(option=><label key={option.id} className={`core-option core-${option.color}`}><input type="checkbox" checked={selected.includes(option.id)} onChange={e=>onChange(e.target.checked?[...selected,option.id]:selected.filter(value=>value!==option.id))}/><span>{t(option.en,option.ru)}</span></label>)}</fieldset>
}
