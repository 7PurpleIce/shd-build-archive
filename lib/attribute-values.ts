export const PROTOTYPE_MULTIPLIER = 1.5;
type AttributeValue={value:string;prototypeValue?:string;enValue?:string;enPrototypeValue?:string};
/** Commas in source display values are thousands separators. */
export function attributeAmount(item:AttributeValue,prototype=false){
 const value=prototype?item.prototypeValue||item.enPrototypeValue:item.enValue||item.value;
 if(value)return Number(value.replace(/[+,%]/g,''));
 return Number(item.value.replace(/[+,%]/g,''))*PROTOTYPE_MULTIPLIER;
}
export function prototypeValue(base:string,locale:'en'|'ru',explicit?:string){
 const amount=Number((explicit||base).replace(/[+,%]/g,''))*(explicit?1:PROTOTYPE_MULTIPLIER);
 return `+${new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(amount)}${base.endsWith('%')?'%':''}`;
}
