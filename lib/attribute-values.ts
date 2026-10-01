export const PROTOTYPE_MULTIPLIER = 1.5;
type AttributeValue={value:string;prototypeValue?:string;enValue?:string;enPrototypeValue?:string};
/** Commas in source display values are thousands separators. */
export function attributeAmount(item:AttributeValue,prototype=false){
 const value=prototype?item.enPrototypeValue||item.prototypeValue:item.enValue||item.value;
 if(value)return Number(value.replace(/[+,%]/g,''));
 return Number(item.value.replace(/[+,%]/g,''))*PROTOTYPE_MULTIPLIER;
}
export function prototypeValue(base:string,_locale:'en'|'ru',explicit?:string){
 const amount=Number((explicit||base).replace(/[+,%]/g,''))*(explicit?1:PROTOTYPE_MULTIPLIER);
 return `+${new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(amount)}${base.endsWith('%')?'%':''}`;
}

/** Actual selected roll; omission preserves the previous maximum-roll default. */
export function attributeRollAmount(item:AttributeValue,roll:{proto:boolean;value?:number}){
 const max=attributeAmount(item,roll.proto);
 return roll.value===undefined?max:Number.isFinite(roll.value)?Math.min(max,Math.max(0,roll.value)):0;
}

/** Preserve custom rolls; a roll at the old cap follows the new cap. */
export function setAttributePrototype<T extends {id:string;proto:boolean;value?:number}>(roll:T,item:AttributeValue|undefined,proto:boolean):T{
 if(!item)return {...roll,proto};
 const current=attributeRollAmount(item,roll),oldMax=attributeAmount(item,roll.proto),max=attributeAmount(item,proto);
 return {...roll,proto,value:current===oldMax?max:Math.min(current,max)};
}
