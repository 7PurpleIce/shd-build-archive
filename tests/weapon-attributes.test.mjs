import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url),'utf8'));
const all=read('weapon-attributes.json'),weapons=read('weapons.json');
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/weapon-attributes.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {initialWeaponRolls,weaponAttributeBonuses,attributeOptions,weaponRollMax}=exports;
const weapon=name=>weapons.find(w=>w.name===name);
test('every weapon fixed attribute resolves; default values are finite',()=>{
 for(const w of weapons){
 for(const spec of Object.values(w.attributes))if(spec.startsWith('fixed:'))assert.equal(attributeOptions(spec,all).length,1,w.name+' '+spec);
 const bonuses=weaponAttributeBonuses(w.attributes,initialWeaponRolls(w.attributes,all),all);assert.ok(Object.values(bonuses).every(Number.isFinite),w.name);
 }
});
test('AR health, SMG crit, LMG out-of-cover and MMR headshot cores enter the right buckets',()=>{
 const check=(name,key,value)=>{const w=weapon(name);const b=weaponAttributeBonuses(w.attributes,initialWeaponRolls(w.attributes,all),all);assert.equal(b[key],value);assert.equal(b.wd,15);};
 check('FAMAS 2010','health',21);check('Vector SBR .45 ACP','chc',21);check('MG5','out',12);check('SOCOM Mk20 SSR','hsd',111);
 const w=weapon('The White Death');assert.equal(weaponAttributeBonuses(w.attributes,initialWeaponRolls(w.attributes,all),all).hsd,137);
});
test('prototype values are explicit, duplicate cores cannot be added as minors, and reset zeroes bonuses',()=>{
 const w=weapon('FAMAS 2010'),rolls=initialWeaponRolls(w.attributes,all);
 rolls.core_1={...rolls.core_1,proto:true,value:100};rolls.minor_1={id:'health-damage-weapon-minor',proto:false,value:10};
 const b=weaponAttributeBonuses(w.attributes,rolls,all);assert.equal(b.wd,22.5);assert.equal(b.health,21);
 const a=all.find(a=>a.id==='critical-hit-damage-weapon-core');assert.equal(weaponRollMax(a,true,'fixed:'+a.id),26);
 assert.ok(Object.values(weaponAttributeBonuses(w.attributes,initialWeaponRolls(w.attributes,all,true),all)).every(v=>v===0));
 rolls.minor_1={id:'dtoc-weapon-minor',proto:true,value:15};assert.equal(weaponAttributeBonuses(w.attributes,rolls,all).out,15);
});

test('free weapon defaults are compatible, populated and never duplicate fixed stats',()=>{
 for(const w of weapons){const rolls=initialWeaponRolls(w.attributes,all),seen=new Set();
  for(const [slot,spec] of Object.entries(w.attributes)){
   const r=rolls[slot];if(spec==='N/A')continue;
   if(r.id){const a=attributeOptions(spec,all).find(a=>a.id===r.id);assert.ok(a,w.name);assert.ok(!seen.has(a.stat_id),w.name+' '+a.stat_id);seen.add(a.stat_id);}
   if(spec.startsWith('fixed:'))assert.equal(r.id,spec.split(':')[1],w.name);
  }
 }
 const ar=weapon('FAMAS 2010'),lmg=weapon('MG5');
 assert.equal(initialWeaponRolls(ar.attributes,all).minor_1.id,'dtoc-weapon-minor');
 assert.equal(initialWeaponRolls(lmg.attributes,all).minor_1.id,'damage-to-armor-weapon-minor');
});
