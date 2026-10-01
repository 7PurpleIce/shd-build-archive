import {useId,type CSSProperties} from 'react';
import {Watch} from 'lucide-react';
import {CalculatorPanelHeading} from './CalculatorPanelHeading';
import {WATCH_STATS,WATCH_CAP,clampWatchPoints,watchBonus,type WatchPoints} from '@/lib/shd-watch';
import {useLocale} from './Locale';
export function WatchStats({value,onChange}:{value:WatchPoints;onChange:(value:WatchPoints)=>void}){
 const {t,locale}=useLocale();const prefix=useId();
 const format=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
 return <section className="damage-panel damage-watch"><CalculatorPanelHeading icon={Watch} label="05 / SHD" title={t('SHD watch stats','Уровень часов')} action={<button type="button" className="watch-max watch-max-all" disabled={WATCH_STATS.every(stat=>clampWatchPoints(value[stat.id]||0)===WATCH_CAP)} aria-label={t('Max all watch stats','Максимум всех статов часов')} onClick={()=>onChange(Object.fromEntries(WATCH_STATS.map(stat=>[stat.id,WATCH_CAP])))}>MAX</button>}/>
 <p className="damage-help">{t('0–50 points per stat. MAX fills that stat to 50 points; the resulting percentage is shown beside it.','От 0 до 50 очков на характеристику. MAX выставляет 50 очков; рядом показан получаемый процент бонуса.')}</p>
 {([['offense','Offense','Атака'],['defense','Defense','Защита'],['skill','Skills','Навыки'],['handling','Handling','Обращение с оружием']] as const).map(([group,en,ru])=><div className={`watch-group watch-${group}`} key={group}><h3>{t(en,ru)}</h3><div className="watch-grid">{WATCH_STATS.filter(s=>s.group===group).map(stat=>{
 const points=clampWatchPoints(value[stat.id]||0);const id=prefix+'-'+stat.id;
 const change=(n:number)=>onChange({...value,[stat.id]:clampWatchPoints(n)});
 return <div className="watch-stat" key={stat.id}><div className="watch-stat-heading"><label id={id+'-label'} htmlFor={id}>{t(stat.en,stat.ru)}</label><output>+{format(watchBonus(points,stat.max))}%</output></div>
 <div className="watch-stat-controls"><input className="calculator-range" type="range" min={0} max={WATCH_CAP} step={1} value={points} onChange={e=>change(Number(e.target.value))} aria-labelledby={id+'-label'} aria-valuetext={`${points} / ${WATCH_CAP}; +${format(watchBonus(points,stat.max))}%`} style={{'--range-fill':`${points/WATCH_CAP*100}%`} as CSSProperties}/><input id={id} type="number" min={0} max={WATCH_CAP} step={1} value={points} onChange={e=>change(Number(e.target.value))}/><button type="button" className="watch-max" disabled={points===WATCH_CAP} aria-label={`MAX: ${t(stat.en,stat.ru)} — ${WATCH_CAP}`} onClick={()=>change(WATCH_CAP)}>MAX</button></div>
 <div className="watch-range-labels"><span>0</span><span>{WATCH_CAP} {t('points','очков')} · +{stat.max}%</span></div></div>;
 })}</div></div>)}
 <p className="damage-help">{t('Weapon damage, crit, headshot damage and reload speed enter the DPS calculation. Other watch stats are recorded here for reference. Ammo capacity increases reserve ammunition, not magazine size.','Урон оружия, крит, урон в голову и перезарядка участвуют в расчёте DPS. Остальные статы часов показаны для справки. Боезапас увеличивает запас патронов, а не размер магазина.')}</p>
 </section>;
}
