/** Site-wide stat display: comma thousands separators, decimal point in both languages. */
export function formatNumber(value:number,maximumFractionDigits=2){
 return new Intl.NumberFormat('en-US',{maximumFractionDigits}).format(value);
}
export function formatStatValue(raw:string){
 const value=Number(raw.replace(/[+,\s%]/g,''));
 return `${raw.startsWith('+')?'+':''}${formatNumber(value)}${raw.endsWith('%')?'%':''}`;
}
/** Format large quantities in game descriptions, not names, dates, URLs or form values. */
export function formatGameText(text:string){
 return text.replace(/(?<![\p{L}\d.,])\d{4,}(?:[.,]\d+)?(?![\p{L}\d])/gu,value=>formatNumber(Number(value.replace(',','.')),4));
}
