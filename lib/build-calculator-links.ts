/** Stable build IDs keep calculator links intact across renames and locale changes. */
const presets:Record<string,string>={'5154f03a-3277-4685-9780-873d7c2821f6':'coco-striker-2'};
export function buildCalculatorPreset(buildId:string){return presets[buildId];}
export type CalculatorLoadRequest={presetId:string;requestId:number};
