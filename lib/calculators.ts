import costs from '@/data/expertise.json';
export type UpgradeCategory=keyof typeof costs;
export type Upgrade={id:string;category:UpgradeCategory;from:number;to:number};
export const MATERIALS={
 steel:{en:'Steel',ru:'Сталь',short:'St',color:'green'},
 ceramics:{en:'Ceramics',ru:'Керамика',short:'Cer',color:'green'},
 polycarbonate:{en:'Polycarbonate',ru:'Поликарбонат',short:'PC',color:'green'},
 titanium:{en:'Titanium',ru:'Титан',short:'Ti',color:'blue'},
 carbon_fiber:{en:'Carbon fiber',ru:'Углеволокно',short:'CF',color:'blue'},
 electronics:{en:'Electronics',ru:'Электроника',short:'Ele',color:'blue'},
 receiver_components:{en:'Receiver components',ru:'Компоненты ствольной коробки',short:'RC',color:'white'},
 protective_fabric:{en:'Protective fabric',ru:'Защитная ткань',short:'PF',color:'white'},
 printer_filament:{en:'Printer filament',ru:'Нить для 3D-принтера',short:'3D',color:'purple'},
 shd_calibration:{en:'SHD calibration',ru:'Калибровка SHD',short:'SHD',color:'orange'},
 field_recon_data:{en:'Field recon data',ru:'Данные полевой разведки',short:'FRD',color:'orange'},
 exotic_components:{en:'Exotic components',ru:'Экзотические компоненты',short:'Ex',color:'red'},
} as const;
export type Material=keyof typeof MATERIALS;
export const CATEGORIES:{id:UpgradeCategory;en:string;ru:string;materials:Material[]}[]=[
 {id:'weapon',en:'Weapons',ru:'Оружие',materials:['steel','titanium','receiver_components','shd_calibration','field_recon_data','exotic_components']},
 {id:'gear',en:'Gear',ru:'Экипировка',materials:['polycarbonate','carbon_fiber','protective_fabric','shd_calibration','field_recon_data','exotic_components']},
 {id:'skill',en:'Skills',ru:'Умения',materials:['ceramics','electronics','printer_filament','shd_calibration','field_recon_data','exotic_components']},
];
export const MAX_EXPERTISE=30;
export function validUpgrade(u:Upgrade){return Number.isInteger(u.from)&&Number.isInteger(u.to)&&u.from>=0&&u.to>=u.from&&u.to<=MAX_EXPERTISE}
export function expertiseTotal(upgrades:Upgrade[]):Record<Material,number>{
 if(upgrades.some(u=>!validUpgrade(u)))throw new RangeError('Invalid upgrade range');
 const total=Object.fromEntries(Object.keys(MATERIALS).map(key=>[key,0])) as Record<Material,number>;
 for(const upgrade of upgrades){for(const row of costs[upgrade.category]){if(row.grade>upgrade.from&&row.grade<=upgrade.to){for(const key of Object.keys(MATERIALS) as Material[])total[key]+=Number((row as Record<string,number>)[key]||0)}}}
 return total;
}
export const MAX_AUGMENT_ITEMS=7;
export function augmentTotal(maxPercent:number,count:number){return Math.round(maxPercent*count*10)/10}
