import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(name,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>load('navigation'),...globals});return exports;}
const {ownerCheckStarted,accessibleSection,restoreSection,archivePermissions}=load('archive-view-state');
const admin={canManage:true,canUseCalculator:true,signedIn:true,loading:false};
test('refocus/token refresh preserves same-user admin UI and selected calculator',()=>{
 const checking=ownerCheckStarted(admin,'owner','owner');assert.equal(checking.canManage,true);assert.equal(checking.loading,true);assert.equal(accessibleSection('damage',checking),'damage');
 assert.equal(accessibleSection('damage',admin),'damage');
});
test('cold start waits for role check; sign-out/account switch never inherits access',()=>{
 assert.equal(accessibleSection('damage',{canManage:false,canUseCalculator:false,signedIn:false,loading:true}),'damage');
 const switched=ownerCheckStarted(admin,'owner','other');assert.equal(switched.canManage,false);assert.equal(switched.loading,true);
 const signedOut=ownerCheckStarted(admin,'owner',undefined);assert.equal(signedOut.canManage,false);assert.equal(accessibleSection('damage',signedOut),'sets');
 assert.equal(accessibleSection('damage',{canManage:false,canUseCalculator:false,signedIn:true,loading:false}),'sets');
});
test('last section survives a new module session, invalid values and blocked storage are safe',()=>{
 const values=new Map();const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const first=load('archive-view-state',{localStorage});first.saveSection('damage');assert.equal(load('archive-view-state',{localStorage}).readSection(),'damage');
 first.saveSection('talents');assert.equal(first.readSection(),'talents');assert.equal(restoreSection('unknown'),'sets');assert.equal(restoreSection(null),'sets');
 const blocked=load('archive-view-state',{localStorage:{getItem:()=>{throw Error();},setItem:()=>{throw Error();}}});assert.equal(blocked.readSection(),'sets');assert.doesNotThrow(()=>blocked.saveSection('builds'));
});
test('calculator remains mounted but hidden on other site tabs',()=>{
 const app=readFileSync(new URL('../components/archive/ArchiveApp.tsx',import.meta.url),'utf8');
 assert.match(app,/value="damage" forceMount hidden=\{tab !== "damage"\}/);
 assert.match(app,/calculatorVisited \|\| tab === "damage"/);
});

test('testers can use the calculator but never manage builds; access clears across accounts',()=>{
 const tester={...archivePermissions(false,{archive_role:'tester'}),signedIn:true,loading:false};
 assert.equal(tester.canUseCalculator,true);assert.equal(tester.canManage,false);
 assert.equal(accessibleSection('damage',tester),'damage');
 const refresh=ownerCheckStarted(tester,'tester','tester');assert.equal(refresh.canUseCalculator,true);assert.equal(refresh.canManage,false);
 for(const next of ['other',undefined]){const state=ownerCheckStarted(tester,'tester',next);assert.equal(state.canUseCalculator,false);assert.equal(state.canManage,false);}
 assert.equal(archivePermissions(false,{}).canUseCalculator,false);
 assert.equal(archivePermissions(false,{archive_role:'owner'}).canManage,false);
 assert.equal(archivePermissions(true,{}).canUseCalculator,true);
 const app=readFileSync(new URL('../components/archive/ArchiveApp.tsx',import.meta.url),'utf8');
 assert.match(app,/<Builds canManage=\{canManage\}/);
});
