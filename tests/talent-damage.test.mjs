import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const catalog=JSON.parse(readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
const cache={};function load(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:p=>p.endsWith('.json')?JSON.parse(readFileSync(new URL('../data/'+p.split('/').pop(),import.meta.url),'utf8')):load(p.replace('./',''))});return exports;}
const {evaluateTalent,talentStatus}=load('talent-effects'),{talentDamage}=load('talent-damage'),{selectableTalents,weaponTalent,namedTalentGear}=load('calculator-talents');
const input={base:100000,wd:100,twd:25,chc:60,chd:100,hsd:200,armor:10,health:0,out:10,armored:true,outside:true,amps:[],rpm:600,magazine:30,reload:2,headshots:0};
const context={weaponType:'rifle',magazine:30,armored:true};const all=catalog.talents.flatMap(t=>[t,...t.perfect]);const get=n=>all.find(t=>t.name===n);const fx=(n,v={})=>evaluateTalent(get(n),true,v,context);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('perfect gear talents are reachable and use their own stack limit and TWD bucket',()=>{
 const options=selectableTalents('chest','rifle');const perfect=options.find(t=>t.name==='Perfect Obliterate');assert.ok(perfect);
 assert.equal(evaluateTalent(perfect,true,{stacks:999},context).bonuses.twd,24);
 assert.equal(fx('Obliterate',{stacks:999}).bonuses.twd,20);
 const b=talentDamage({...input,twd:24},[]).body,a=talentDamage({...input,twd:20},[]).body;close(b/a,1.24/1.2);
 assert.ok(selectableTalents('backpack','rifle').some(t=>t.name==='Perfect Vigilance'));
 assert.ok(!selectableTalents('weapon','rifle').some(t=>t.perfect));
 assert.equal(weaponTalent('fixed:Perfect Killer','').name,'Perfect Killer');
});
test('guaranteed crit bypasses the ordinary 60 percent cap only for an active talent',()=>{
 const r=talentDamage(input,[fx('Agonizing Bite',{marked:1})]);assert.equal(r.chance,1);close(r.average,r.crit);
 const off=evaluateTalent(get('Agonizing Bite'),false,{marked:1},context);assert.equal(talentDamage(input,[off]).chance,.6);
 assert.equal(talentDamage(input,[fx('Boiling Point',{half:0})]).chance,0);assert.equal(talentDamage(input,[fx('Boiling Point',{half:1})]).chance,1);
});
test('head-only amplifiers do not amplify body damage; one-shot head conversion does not inflate sustained DPS',()=>{
 const baseline=talentDamage(input,[]);const r=talentDamage(input,[fx('In Plain Sight')]);close(r.body,baseline.body);close(r.head,baseline.head*1.5);
 const d=talentDamage(input,[fx('Determined')]);close(d.body,d.head);close(d.sustained,baseline.sustained);assert.equal(d.singleShot,true);
});
test('Headhunter adds a capped next-shot bonus without applying crit or amps to it again',()=>{
 const baseline=talentDamage(input,[]);const r=talentDamage(input,[fx('Headhunter',{previous:100000000})]);
 const cap=100000*2*1.25*1.1*12.5;close(r.additive,cap);close(r.crit-baseline.crit,cap);close(r.head-baseline.head,cap);close(r.sustained,baseline.sustained);
 const low=talentDamage({...input,hsd:150},[fx('Headhunter',{previous:1e8})]);close(low.additive,100000*2*1.25*1.1*8);
 close(talentDamage(input,[fx('Perfect Headhunter',{previous:100})]).additive,150);
});
test('marked armor amplifiers are conditional on armor, and every catalogue talent has an explicit coverage status',()=>{
 assert.equal(fx('Perfect Sledgehammer').amps[0],20);assert.equal(evaluateTalent(get('Perfect Sledgehammer'),true,{}, {...context,armored:false}).amps.length,0);
 for(const t of all)assert.notEqual(talentStatus(t).kind,'unreviewed',t.name);
});

test('named perfect talents map to the actual source slot and brand, including slot-changing variants',()=>{
 assert.equal(namedTalentGear('chest','Perfect Obliterate')[0].name,'Equalizer');
 assert.equal(namedTalentGear('chest','Perfect Obliterate')[0].brand,'unit-alloys');
 assert.ok(selectableTalents('chest','rifle').some(t=>t.name==='Perfect Companion'));
 assert.ok(!selectableTalents('backpack','rifle').some(t=>t.name==='Perfect Companion'));
 assert.ok(selectableTalents('backpack','rifle').some(t=>t.name==='Perfect Tamper Proof'));
 for(const kind of ['chest','backpack'])for(const t of selectableTalents(kind,'rifle').filter(t=>t.perfect))assert.equal(namedTalentGear(kind,t.name).length,1,t.name);
});
