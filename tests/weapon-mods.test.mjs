import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url),'utf8'));
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/weapon-mods.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {compatibleMod,selectedWeaponMods,attachmentBonuses,effectiveWeaponCycle}=exports;
const mods=read('weapon-mods.json'),weapons=read('weapons.json');
const mod=name=>mods.find(m=>m.name===name),gun=name=>weapons.find(w=>w.name===name);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('calibre and slot restrictions reject incompatible and stale selections',()=>{
 const m4=gun('Police M4');assert.equal(compatibleMod(m4.slots.magazine,'magazine',mod('Sturdy Extended 5.56 Mag')),true);
 assert.equal(compatibleMod(m4.slots.magazine,'magazine',mod('Sturdy Extended 7.62 Mag')),false);
 assert.equal(compatibleMod('N/A','magazine',mod('Sturdy Extended 5.56 Mag')),false);
 assert.equal(selectedWeaponMods(m4.slots,{magazine:'Sturdy Extended 7.62 Mag'},mods).length,0);
});
test('fixed exotic attachments auto-apply exactly once, ignoring manual overrides',()=>{
 const elmo=gun("St. Elmo's Engine"),selected=selectedWeaponMods(elmo.slots,{magazine:'Sturdy Extended 5.56 Mag'},mods);
 assert.equal(selected.length,4);const b=attachmentBonuses(selected);assert.equal(b.magFlat,30);assert.equal(b.chc,15);assert.equal(b.chd,15);assert.equal(b.handling,10);
 const cycle=effectiveWeaponCycle(elmo,b);assert.equal(cycle.magazine,70);close(cycle.reload,2.24/1.1);
});
test('magazine flat rounds and percent bonuses combine; reload penalties increase time',()=>{
 const b=attachmentBonuses([mod('Sturdy Extended 5.56 Mag')]);assert.equal(b.magFlat,20);assert.equal(b.reload,-10);
 const cycle=effectiveWeaponCycle({mag:30,rpm:900,reload:2},{...b,mag:30,rof:15});assert.equal(cycle.magazine,65);close(cycle.rpm,1035);close(cycle.reload,2/.9);
 const scope=attachmentBonuses([mod('Digital Scope')]);assert.equal(scope.hsd,45);assert.equal(scope.chd,-5);
});
test('all 281 weapons have resolvable fixed attachments in correct slots',()=>{
 for(const weapon of weapons)for(const [slot,spec] of Object.entries(weapon.slots))if(spec.startsWith('fixed:'))assert.ok(mods.some(m=>compatibleMod(spec,slot,m)),`${weapon.name}: ${slot} ${spec}`);
});
