/** Stable build IDs keep calculator links intact across renames and locale changes. */
const presets:Record<string,string>={
 '5154f03a-3277-4685-9780-873d7c2821f6':'coco-striker-2',
 'e15438dc-2b43-4d69-baf3-7d2db4f226e0':'striker-overdogs-100',
};
export function buildCalculatorPreset(buildId:string){return presets[buildId];}
export type CalculatorLoadRequest={presetId:string;requestId:number};
