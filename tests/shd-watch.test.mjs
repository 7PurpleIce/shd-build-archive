import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/shd-watch.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {WATCH_STATS,WATCH_CAP,clampWatchPoints,watchBonus,watchDamageBonuses}=exports;
test('watch points are whole numbers capped at 50 and scale to actual percentages',()=>{
 assert.equal(WATCH_STATS.length,16);assert.equal(WATCH_CAP,50);
 assert.equal(clampWatchPoints(99),50);assert.equal(clampWatchPoints(-5),0);assert.equal(clampWatchPoints(NaN),0);assert.equal(clampWatchPoints(12.9),12);
 assert.equal(watchBonus(50,10),10);assert.equal(watchBonus(50,20),20);assert.equal(watchBonus(25,20),10);
});
test('only applicable watch stats affect bullet DPS; reserve ammo is not magazine size',()=>{
 const full=Object.fromEntries(WATCH_STATS.map(s=>[s.id,50]));const b=watchDamageBonuses(full);
 assert.equal(b.wd,10);assert.equal(b.chc,10);assert.equal(b.chd,20);assert.equal(b.hsd,20);assert.equal(b.reload,10);
 assert.equal(b.mag,undefined);assert.equal(b.armor,undefined);assert.equal(b.health,undefined);
});
