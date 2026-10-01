import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const catalog=JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
const talents=catalog.talents.flatMap(t=>[t,...t.perfect]);
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/talent-effects.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {talentRule,evaluateTalent}=exports;
const context={weaponType:'assault-rifle',magazine:50,armored:true};
const get=n=>{const t=talents.find(t=>t.name===n);assert.ok(t,n);return t;};
const run=(n,v={},active=true)=>evaluateTalent(get(n),active,v,context);
test('PvE source values, distinct damage buckets and activation',()=>{
 assert.equal(run('Glass Cannon').amps[0],25);assert.equal(run('Perfect Glass Cannon').amps[0],30);
 assert.equal(run('Gunslinger').bonuses.twd,23);assert.equal(run('Sadist').amps[0],30);
 assert.equal(run('Soft Spot').bonuses.wd,19);assert.equal(run('Soft Spot',{},false).bonuses.wd,undefined);
 assert.equal(run('Unhinged',{},false).bonuses.wd,18);
 assert.equal(run('Spotter').amps[0],15);assert.equal(run('Vigilance').bonuses.twd,25);
});
test('stack caps and multiple effects are evaluated independently',()=>{
 assert.equal(run('Obliterate',{stacks:99}).bonuses.twd,20);
 assert.equal(run('Perfect Strained',{stacks:8}).bonuses.chd,80);
 assert.equal(run('Fast Hands',{stacks:40}).bonuses.reload,120);
 assert.equal(run('Rifleman',{stacks:5}).bonuses.wd,50);
 assert.ok(Math.abs(run('Intimidate',{stacks:9}).amps[0]-((1.04**9-1)*100))<1e-8);
 assert.equal(run('In Sync',{buffs:2}).bonuses.wd,30);
 assert.equal(run('Concussion',{mode:3}).bonuses.twd,25);
 assert.equal(run('Measured',{half:0}).bonuses.wd,-25);assert.equal(run('Measured',{half:1}).bonuses.twd,30);
 assert.equal(run('Frenzy').bonuses.wd,15);
});
test('fixed exotic and perfect mechanics; unsupported effects never guessed',()=>{
 assert.equal(run('Capacitance',{tier:6},false).bonuses.wd,45);
 assert.equal(run('Full Stop',{stacks:20}).bonuses.hsd,100);
 assert.equal(run('Payment in Kind',{stacks:100}).bonuses.chd,200);
 assert.equal(run('Bullet Hell',{},false).noReload,true);
 assert.equal(run('Perfect Extra',{},false).bonuses.mag,30);
 assert.equal(talentRule(get('Headhunter')),undefined);
 assert.equal(talentRule(get('Plague of the Outcasts')),undefined);
 assert.equal(talentRule({...get('Gunslinger'),name:'Unknown talent'}),undefined);
});
test('all supported talent variants return finite values at zero and max, with no inactive conditional effects',()=>{
 for(const t of talents){const rule=talentRule(t);if(!rule)continue;
 assert.ok(rule.controls.every(c=>Number.isFinite(c.max)&&c.max>0),t.name);
 const values=Object.fromEntries(rule.controls.map(c=>[c.id,c.max]));
 for(const v of [{},values]){const e=evaluateTalent(t,true,v,context);assert.ok([...Object.values(e.bonuses),...e.amps].every(Number.isFinite),t.name);}
 if(!rule.passive){const e=evaluateTalent(t,false,values,context);assert.equal(Object.keys(e.bonuses).length+e.amps.length,0,t.name);}
 }
});
