import {CalculatorPanel} from './CalculatorPanel';
import {Compass} from 'lucide-react';
import {CalculatorPanelHeading} from './CalculatorPanelHeading';
import {CalculatorSelect} from './CalculatorSelect';
import {useLocale} from './Locale';
import {SPECIALIZATIONS,specializationEffect,specializationPercent,type SpecializationState} from '@/lib/specializations';
export function SpecializationStats({value,onChange,weaponType}:{value:SpecializationState;onChange:(value:SpecializationState)=>void;weaponType:string}){
 const {t}=useLocale();const effect=specializationEffect(value,weaponType);
 const conditions:Record<string,[string,string,string][]>= {
  gunner:[['kill','Barrage: killed an enemy in the last 5 seconds','Шквальный огонь: враг убит за последние 5 секунд'],['still','Emplacement: stationary for at least 1 second','Огневая позиция: без движения не менее 1 секунды']],
  demolitionist:[['kit','Stimulant Patch: armor kit buff is active (15 seconds)','Стимулирующий пластырь: действует бонус бронекомплекта (15 секунд)']],
  technician:[['robot','Dismantling: target is a drone, skill proxy or robot','Демонтаж: цель — дрон, устройство навыка или робот']]
 };
 const team=[['sharpshooter','Allied Sharpshooter: you are closer to the enemy than the ally','Союзный меткий стрелок: ты ближе к врагу, чем союзник'],['demolitionist','Allied Demolitionist: tactical link active','Союзный подрывник: командный бонус активен'],['survivalist','Allied Survivalist: target has a status effect','Союзный выживальщик: на цели действует статусный эффект'],['firewall','Allied Firewall: target within 10 m of the ally','Союзный огнемётчик: цель в пределах 10 м от союзника']];
 const labels:Record<string,[string,string]>={wd:['Weapon Damage','Урон оружия'],hsd:['Headshot Damage','Урон в голову'],out:['Damage out of Cover','Урон вне укрытия'],rof:['Rate of Fire','Скорострельность'],handling:['Weapon Handling','Эргономичность']};
 return <CalculatorPanel><CalculatorPanelHeading icon={Compass} label="02 / SPECIALIZATION" title={t('Specialization','Специализация')}/>
 <label>{t('Your specialization','Твоя специализация')}<CalculatorSelect value={value.id} onChange={e=>onChange({...value,id:e.target.value,weaponTier:3,conditions:{}})}><option value="">{t('None','Нет')}</option>{SPECIALIZATIONS.map(([id,en,ru])=><option key={id} value={id}>{t(en,ru)}</option>)}</CalculatorSelect></label>
 {value.id&&<><label className="damage-specialization-tier">{t('Damage node for the selected weapon class','Узел урона для выбранного класса оружия')}<CalculatorSelect value={String(value.weaponTier)} onChange={e=>onChange({...value,weaponTier:Number(e.target.value)})}>{[0,1,2,3].map(tier=><option key={tier} value={tier}>{t('Tier','Уровень')} {tier} · +{tier?specializationPercent(`Sharpshooter E.M.I Tier ${tier}`):0}%</option>)}</CalculatorSelect></label><p className="damage-help">{t('Other personal perks are assumed fully unlocked. Weapon node level applies to the current weapon class.','Остальные личные навыки считаются полностью открытыми. Уровень узла урона относится к текущему классу оружия.')}</p></>}
 {value.id==='sharpshooter'&&<p className="damage-help">{t('One in the Head only applies to rifles and marksman rifles.','Бонус «Одним в голову» действует только для винтовок и снайперских винтовок.')}</p>}
 {(conditions[value.id]||[]).map(([id,en,ru])=><label className="damage-check" key={id}><input type="checkbox" checked={!!value.conditions[id]} onChange={e=>onChange({...value,conditions:{...value.conditions,[id]:e.target.checked}})}/>{t(en,ru)}</label>)}
 {value.id==='gunner'&&<p className="damage-help">{t('Coupler’s periodic fast reload is not included in sustained DPS.','Периодическая ускоренная перезарядка Coupler пока не входит в DPS.')}</p>}
 {value.id==='firewall'&&<p className="damage-help">{t('Striker shield damage depends on skills and enemy count; it is not modeled yet.','Усиление щита «Ударник» зависит от навыков и числа врагов; пока не моделируется.')}</p>}
 {value.id==='technician'&&<p className="damage-help">{t('Skill tier and skill damage do not directly increase bullet damage; skill-dependent talent interactions are not modeled here.','Уровень навыка и урон навыков напрямую не повышают урон пули; их взаимодействия с талантами здесь пока не моделируются.')}</p>}
 <h3>{t('Received group bonuses','Получаемые бонусы группы')}</h3><p className="damage-help">{t('Enable only buffs supplied by another player with the stated condition met. Your own tactical link does not buff you. Identical links are counted once.','Включай только бонусы от другого игрока при выполнении указанного условия. Собственный командный бонус на тебя не действует. Одинаковые бонусы учитываются один раз.')}</p>
 {team.map(([id,en,ru])=><label className="damage-check" key={id}><input type="checkbox" checked={!!value.team[id]} onChange={e=>onChange({...value,team:{...value.team,[id]:e.target.checked}})}/>{t(en,ru)}</label>)}
 <ul className="damage-mod-stats">{Object.entries(effect.bonuses).map(([id,n])=><li key={id}>{t(...labels[id])}<strong>+{n}%</strong></li>)}{effect.amps.map((n,i)=><li key={'amp'+i}>{t('Conditional amplifier','Условное усиление')}<strong>+{n}%</strong></li>)}</ul>
 </CalculatorPanel>;
}
