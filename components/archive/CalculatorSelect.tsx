import {Children,isValidElement,type ReactNode} from 'react';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
const EMPTY='__empty_calculator_option__';
/** Retains simple option-based call sites while rendering the shared accessible select. */
export function CalculatorSelect({value,onChange,disabled,children}:{value:string;onChange:(event:{target:{value:string}})=>void;disabled?:boolean;children:ReactNode}){
 const options=Children.toArray(children).filter(isValidElement<{value:string;children:ReactNode;disabled?:boolean}>);
 const valid=options.some(o=>o.props.value===value);
 return <Select value={valid?(value||EMPTY):EMPTY} onValueChange={value=>onChange({target:{value:value===EMPTY?'':value}})} disabled={disabled}>
  <SelectTrigger className="calculator-select-trigger"><SelectValue/></SelectTrigger>
  <SelectContent position="popper" align="start" sideOffset={5} className="calculator-select-menu">
   {options.map(o=><SelectItem key={o.props.value||EMPTY} value={o.props.value||EMPTY} disabled={o.props.disabled}>{o.props.children}</SelectItem>)}
  </SelectContent>
 </Select>;
}
