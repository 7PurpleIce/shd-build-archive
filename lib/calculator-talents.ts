import catalog from '@/data/catalog.json';
export const calculatorTalents=catalog.talents.flatMap(t=>[
 {id:t.id,name:t.name,description:t.description,kind:t.kind,exotic:t.exotic,weaponTypes:t.weaponTypes,perfect:false,ru:t.ru},
 ...t.perfect.map(p=>({id:t.id+':'+p.name,name:p.name,description:p.description,kind:t.kind,exotic:false,weaponTypes:p.weaponTypes,perfect:true,ru:p.ru}))
]);
export function weaponTalent(spec:string,selectedId:string){
 return spec.startsWith('fixed:')?calculatorTalents.find(t=>t.kind==='weapon'&&t.name===spec.slice(6)):
 calculatorTalents.find(t=>t.id===selectedId&&t.kind==='weapon'&&!t.perfect&&!t.exotic&&t.weaponTypes.includes(spec.slice(5)));
}
