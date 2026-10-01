import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Layers3,LayoutGrid,Zap,Atom,Calculator,Store,Swords,SlidersHorizontal,ChevronLeft,ChevronRight} from 'lucide-react';
import {TabsList,TabsTrigger} from '@/components/ui/tabs';
import {ARCHIVE_SECTIONS,type ArchiveSection,sectionNumber} from '@/lib/navigation';
import {useLocale} from './Locale';
import './navigation.css';
import {useOwner} from './OwnerAuth';
const icons={sets:Layers3,talents:Zap,attributes:SlidersHorizontal,builds:LayoutGrid,augments:Atom,expertise:Calculator,traders:Store,activities:Swords,damage:Calculator} satisfies Record<ArchiveSection,typeof Layers3>;
export function ArchiveNavigation({activeTab}:{activeTab:string}){
 const {canManage}=useOwner();
 const {t,locale}=useLocale();const viewport=useRef<HTMLDivElement>(null);const [scroll,setScroll]=useState({left:0,max:0});
 useEffect(()=>{
  const el=viewport.current;if(!el)return;
  const sync=()=>setScroll({left:el.scrollLeft,max:Math.max(0,el.scrollWidth-el.clientWidth)});
  const observer=new ResizeObserver(sync);observer.observe(el);if(el.firstElementChild)observer.observe(el.firstElementChild);
  el.addEventListener('scroll',sync,{passive:true});sync();
  return()=>{observer.disconnect();el.removeEventListener('scroll',sync)};
 },[]);
 useEffect(()=>{
  const el=viewport.current;const active=el?.querySelector<HTMLElement>('[data-state="active"]');if(!el||!active)return;
  const container=el.getBoundingClientRect(),tab=active.getBoundingClientRect();
  if(tab.left<container.left)el.scrollLeft+=tab.left-container.left;
  else if(tab.right>container.right)el.scrollLeft+=tab.right-container.right;
 },[activeTab,locale]);
 function move(delta:number){const el=viewport.current;if(el)el.scrollLeft+=delta*el.clientWidth*.65}
 return <div className="archive-navigation">
  <div ref={viewport} className="nav-viewport" id="archive-nav-viewport"><TabsList className="main-nav" aria-label={t('Site sections','Разделы сайта')}>{ARCHIVE_SECTIONS.filter(section=>section.id!=='damage'||canManage).map(section=>{const Icon=icons[section.id];return <TabsTrigger key={section.id} value={section.id}><Icon/>{t(section.en,section.ru)}<span>{sectionNumber(section.id)}</span></TabsTrigger>})}</TabsList></div>
  {scroll.max>1&&<div className="nav-slider"><button type="button" disabled={scroll.left<=1} onClick={()=>move(-1)} aria-label={t('Scroll menu left','Прокрутить меню влево')} aria-controls="archive-nav-viewport"><ChevronLeft size={18}/></button><input type="range" min={0} max={scroll.max} step={1} value={Math.min(scroll.left,scroll.max)} onChange={event=>{if(viewport.current)viewport.current.scrollLeft=Number(event.target.value)}} aria-label={t('Menu horizontal scroll','Горизонтальная прокрутка меню')} aria-controls="archive-nav-viewport" aria-valuetext={`${Math.round(scroll.left/scroll.max*100)}%`} style={{'--nav-progress':`${scroll.left/scroll.max*100}%`} as CSSProperties}/><button type="button" disabled={scroll.left>=scroll.max-1} onClick={()=>move(1)} aria-label={t('Scroll menu right','Прокрутить меню вправо')} aria-controls="archive-nav-viewport"><ChevronRight size={18}/></button></div>}
 </div>;
}
