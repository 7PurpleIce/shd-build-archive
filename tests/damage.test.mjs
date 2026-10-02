import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/damage.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {calculateDamage,hasModSlot,staticBonus}=exports;
const example={base:38300,wd:119,twd:0,chc:60,chd:101,hsd:70,armor:8,health:0,out:10,armored:true,outside:true,amps:[],rpm:1200,magazine:50,reload:2,headshots:0};
const close=(a,b)=>assert.ok(Math.abs(a-b)<.0001,`${a} != ${b}`);
test('NYL reference: additive WD, independent amplifiers, crit and headshot',()=>{
 const r=calculateDamage(example);close(r.body,99645.876);close(r.crit,200288.21076);
 const a=calculateDamage({...example,amps:[50,30]});close(a.body,194309.4582);close(a.crit,390562.010982);close(a.critHead,a.body*2.71);close(a.average,a.body*1.606);
});
test('target conditions, crit cap, DPS and zero fire rate',()=>{
 const r=calculateDamage({...example,armored:false,outside:false,chc:90,health:20});close(r.body,38300*2.19*1.2);close(r.chance,.6);
 close(r.sustained,r.average*50/(50/20+2));close(r.burst,r.average*20);
 assert.equal(calculateDamage({...example,rpm:0}).sustained,0);
 close(calculateDamage({...example,headshots:100}).average,calculateDamage(example).body*(1+.606+.7));
});
test('three standard mod slots and extras only on improvised pieces',()=>{
 assert.equal([0,1,2,3,4,5].filter(i=>hasModSlot(i,'brand')).length,3);
 assert.equal([0,1,2,3,4,5].filter(i=>hasModSlot(i,'improvised')).length,6);
 assert.equal(hasModSlot(4,'gear-set'),false);
});
test('brand weapon bonuses apply only to matching class; talent prose not parsed',()=>{
 assert.equal(staticBonus('+12% — Lmg Damage','smg').length,0);
 assert.equal(staticBonus('+12% — Lmg Damage','lmg')[0].value,12);
 assert.equal(staticBonus('+20% — Critical Hit Damage\n+15% — Rate Of Fire','smg').length,2);
 assert.equal(staticBonus('Amplifies damage by 60% when shooting.','smg').length,0);
});
test('calculator tab, content and lazy-loaded component are all guarded',()=>{
 const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
 assert.match(read('../components/archive/ArchiveNavigation.tsx'),/section.id!=='damage'\|\|canUseCalculator/);
 assert.match(read('../components/archive/ArchiveApp.tsx'),/canUseCalculator && <TabsContent value="damage"/);
 assert.match(read('../components/archive/DamageCalculator.tsx'),/return canUseCalculator\?<CalculatorBody\b[^>]*\/>:null/);
});
