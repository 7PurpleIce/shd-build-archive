import type {ReactNode} from 'react';
import type {LucideIcon} from 'lucide-react';

export function CalculatorPanelHeading({icon:Icon,label,title,action}:{icon:LucideIcon;label:string;title:string;action?:ReactNode}){
 return <div className="damage-block-title"><Icon size={23} aria-hidden="true"/><div className="damage-block-heading"><span>{label}</span><h2>{title}</h2></div>{action}</div>;
}
