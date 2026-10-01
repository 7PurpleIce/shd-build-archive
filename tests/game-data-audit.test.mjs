import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url),'utf8'));
const catalog=read('catalog.json');
const entries=catalog.talents.flatMap(t=>[t,...t.perfect||[]]);
const talent=n=>entries.find(t=>t.name===n);
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/attribute-values.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Intl});
test('prototype maxima come from explicit source values, not a blanket multiplier',()=>{
 const attrs=read('attributes.json');const value=id=>exports.attributeAmount(attrs.find(a=>a.id===id),true);
 assert.equal(value('skill-haste'),15);assert.equal(value('health'),28403);assert.equal(value('armor-regeneration'),7388);assert.equal(value('critical-hit-damage'),18);
});
test('Russian PvE corrections preserve independent PvP values',()=>{
 assert.match(talent('Gunslinger').ru.description,/23% \(15% в PVP\)/);
 assert.match(talent('Soft Spot').ru.description,/19% \(20% в PVP\)/);
 assert.match(talent('Perfect Empathic Resolve').ru.description,/2,3-16,3% \(1-12% в PVP\)/);
 assert.match(talent('Transfusion').ru.description,/получает 200%/);
});
test('corrected gear-mod identity and audited source snapshot are consistent',()=>{
 const mods=read('gear-mods.json');assert.ok(mods.some(m=>m.id==='disrupt-resistance'&&m.value==='+10%'));assert.ok(!mods.some(m=>m.id==='freeze-resistance'));
 assert.equal(read('source/upstream-manifest.json').commit,'9c9ff25552439aabe9f995f4ed66897040ac0cc0');
 assert.equal(read('weapon-mods.json').length,252);
});
