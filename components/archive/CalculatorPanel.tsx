import {Children,useId,useState,type ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';
import {useLocale} from './Locale';
/** Keep controls mounted while collapsed so editing state and focus targets are stable. */
export function CalculatorPanel({children,className='damage-panel',defaultOpen=true}:{children:ReactNode;className?:string;defaultOpen?:boolean}){
 const {t}=useLocale();const [open,setOpen]=useState(defaultOpen);const id=useId();const [heading,...body]=Children.toArray(children);
 return <section className={className+' damage-collapsible'}><div className="damage-panel-header">{heading}<button className="damage-panel-toggle" type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}><span>{open?t('Collapse','Свернуть'):t('Expand','Развернуть')}</span><ChevronDown size={18}/></button></div><div id={id} hidden={!open}>{body}</div></section>;
}
