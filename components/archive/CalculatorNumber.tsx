import {useId,type CSSProperties} from 'react';
import {formatNumber} from '@/lib/number-format';
export function CalculatorNumber({label,value,onChange,max,min=0,step='any',showMax=false}:{label:string;value:number;onChange:(v:number)=>void;max:number;min?:number;step?:number|'any';showMax?:boolean}){
 const id=useId();
 const change=(n:number)=>onChange(Number.isFinite(n)?Math.max(min,Math.min(max,n)):min);
 return <div className="calculator-number"><label className="damage-field" htmlFor={id}>{label}<input id={id} type="number" min={min} max={max} step={step} value={value} onChange={e=>change(Number(e.target.value))}/></label><input type="range" className="calculator-range" min={min} max={max} step={step} value={value} aria-label={label} onChange={e=>change(Number(Number(e.target.value).toFixed(2)))} style={{'--range-fill':`${max>min?(value-min)/(max-min)*100:0}%`} as CSSProperties}/>{showMax&&<div className="calculator-number-limit"><span>{formatNumber(min)}</span><button type="button" className="watch-max" onClick={()=>change(max)}>MAX {formatNumber(max)}</button></div>}</div>;
}
