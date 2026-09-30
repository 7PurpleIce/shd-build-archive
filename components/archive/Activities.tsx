'use client';
import {SectionHeading} from './SectionHeading';
import {useCurrentTime} from '@/hooks/use-current-time';
import {Clock3,RotateCcw,Swords,Shield} from 'lucide-react';
import {ACTIVITY_GROUPS,activityReset} from '@/lib/activities';

import {useLocale} from './Locale';
import './activities.css';

export function Activities(){
 const {t,locale}=useLocale();
 const {now}=useCurrentTime();
 const zone=t('UTC','МСК');
 const pad=(value:number)=>String(value).padStart(2,'0');
 return <div className="activities-page">
  <SectionHeading section="activities" eyebrow={t('WEEKLY ACTIVITIES','ЕЖЕНЕДЕЛЬНЫЕ АКТИВНОСТИ')} title={t('Incursions & raids','Вылазки и рейды')}><span className="activity-zone"><Clock3 size={16}/>{t('All times in UTC','Время по МСК · UTC+3')}</span></SectionHeading>
  <p className="activity-intro">{t('Weekly reset schedule for raids and incursions.','Расписание еженедельного сброса рейдов и вылазок.')}</p>
  {ACTIVITY_GROUPS.map(group=>{
   const reset=activityReset(group.resetDay,now);
   const Icon=group.id==='raids'?Shield:Swords;
   const date=new Intl.DateTimeFormat(locale==='ru'?'ru-RU':'en-GB',{day:'numeric',month:'long',timeZone:locale==='ru'?'Europe/Moscow':'UTC'}).format(new Date(reset.target));
   return <section className="activity-group" key={group.id} aria-labelledby={`${group.id}-heading`}>
    <div className="activity-group-heading"><Icon size={22} aria-hidden="true"/><h2 id={`${group.id}-heading`}>{t(group.en,group.ru)}</h2><span>02</span></div>
    <div className="activity-grid">{group.activities.map((activity,index)=><article className="activity-card" key={activity.id}>
     <div className="activity-card-top"><span>{t('EVERY WEEK','КАЖДУЮ НЕДЕЛЮ')}</span><b>0{index+1}</b></div>
     <h3>{t(activity.en,activity.ru)}</h3>
     <div className="activity-schedule"><RotateCcw size={20} aria-hidden="true"/><div><small>{t('Weekly reset','Еженедельный сброс')}</small><strong>{t(group.dayEn,group.dayRu)}</strong></div><div className="activity-time">{t('08:00','11:00')}<small>{zone}</small></div></div>
     <div className="activity-next"><Clock3 size={14} aria-hidden="true"/><span>{t('Next reset:','Следующий сброс:')} <time dateTime={new Date(reset.target).toISOString()}>{date}</time></span></div>
     <div className="activity-countdown"><span>{t('Resets in','До сброса')}</span><strong>{pad(reset.days)} {t('d','д')} {pad(reset.hours)} {t('h','ч')} {pad(reset.minutes)} {t('m','м')}</strong></div>
    </article>)}</div>
   </section>;
  })}
 </div>;
}
