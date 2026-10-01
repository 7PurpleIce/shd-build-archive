import {CalculatorPanel} from './CalculatorPanel';
import {Plus,Trash2,Zap} from 'lucide-react';
import {CalculatorPanelHeading} from './CalculatorPanelHeading';
import {CalculatorSelect} from './CalculatorSelect';
import {CalculatorNumber} from './CalculatorNumber';
import {useLocale} from './Locale';
import {EVENT_BONUS_TYPES,EVENT_PRESETS,applyEventPreset,type EventBonus,type EventBonusType} from '@/lib/event-bonuses';
export function EventBonuses({value,onChange}:{value:EventBonus[];onChange:(rows:EventBonus[])=>void}){
 const {t}=useLocale();const selectedEvent=EVENT_PRESETS.find(p=>value.some(row=>row.eventId===p.id));const patch=(id:string,patch:Partial<EventBonus>)=>onChange(value.map(row=>row.id===id?{...row,...patch}:row));
 return <CalculatorPanel><CalculatorPanelHeading icon={Zap} label="06 / EVENT BONUSES" title={t('Event bonuses & amplifiers','Бонусы и усиления события')}/>
 <div className="damage-fields"><label>{t('Event preset','Пресет события')}<CalculatorSelect value={selectedEvent?.id||''} onChange={e=>onChange(applyEventPreset(value,e.target.value))}><option value="">{t('None / custom bonuses','Без события / свои бонусы')}</option>{EVENT_PRESETS.map(p=><option key={p.id} value={p.id}>{t(p.en,p.ru)}</option>)}</CalculatorSelect></label></div>
 <p className="damage-help">{t('Selecting an event fills its bonuses below. Switching or clearing it preserves bonuses you added manually.','Выбор события подставляет его бонусы ниже. При смене или отключении события добавленные вручную бонусы сохраняются.')}</p>
 <p className="damage-help">{t('Add one row per external bonus: choose its damage type and value. Bonuses of the same type add together; independent multipliers multiply separately. Gear and talent bonuses already calculated above do not need another row.','Добавь строку для каждого внешнего бонуса: выбери тип и значение. Бонусы одного типа суммируются; независимые множители перемножаются. Уже учтённые выше бонусы экипировки и талантов повторно добавлять не нужно.')}</p>
 {value.length===0&&<p className="damage-help">{t('No additional event bonuses.','Дополнительных бонусов события нет.')}</p>}
 <div className="damage-event-list">{value.map((row,i)=><div className="damage-event-row" key={row.id}>
 <div className="damage-event-heading"><label className="damage-check"><input type="checkbox" checked={row.enabled} onChange={e=>patch(row.id,{enabled:e.target.checked})}/>{t('Bonus','Бонус')} {i+1}</label><button className="damage-action" type="button" aria-label={t('Remove bonus','Удалить бонус')+' '+(i+1)} title={t('Remove bonus','Удалить бонус')} onClick={()=>onChange(value.filter(r=>r.id!==row.id))}><Trash2 size={16}/></button></div>
 <div className="damage-fields"><label>{t('Bonus type','Тип бонуса')}<CalculatorSelect value={row.type} onChange={e=>patch(row.id,{type:e.target.value as EventBonusType})}>{EVENT_BONUS_TYPES.map(([id,en,ru])=><option key={id} value={id}>{t(en,ru)}</option>)}</CalculatorSelect></label><label>{t('Event / name (optional)','Событие / название (необязательно)')}<input value={row.name||(row.eventId&&selectedEvent?t(selectedEvent.en,selectedEvent.ru):'')} maxLength={100} onChange={e=>patch(row.id,{name:e.target.value})} placeholder={t('Event bonus','Бонус события')}/></label></div>
 <CalculatorNumber label={t('Bonus value %','Значение бонуса %')} value={row.value} max={10000} step="any" onChange={n=>patch(row.id,{value:n})}/>
 {(row.type==='accuracy'||row.type==='stability'||row.type==='weakpoint')&&<p className="damage-help">{row.type==='weakpoint'?t('Applies to weakpoints; not included in the displayed body/head hit damage.','Действует на уязвимые места; не входит в отображаемый урон попадания в тело или голову.'):t('Handling bonus; does not directly increase bullet damage.','Бонус к управлению оружием; напрямую не увеличивает урон пули.')}</p>}
 {row.type==='out'&&<p className="damage-help">{t('Only applies when the target is out of cover.','Учитывается только для цели вне укрытия.')}</p>}
 {row.type==='hsd'&&<p className="damage-help">{t('Adds to headshot damage; does not increase ordinary body hits.','Добавляется к урону в голову; не увеличивает обычное попадание в тело.')}</p>}
 </div>)}</div>
 <button type="button" className="damage-action damage-event-add" onClick={()=>onChange([...value,{id:crypto.randomUUID(),type:'amp',value:0,name:'',enabled:true}])}><Plus size={16}/>{t('Add bonus','Добавить бонус')}</button>
 </CalculatorPanel>;
}
