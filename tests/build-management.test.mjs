import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=readFileSync(new URL('../lib/builds.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const original={id:'build-1',image_key:'old.png',title:'Before',description:'Before',created_at:'2026-01-01'};
function setup({denied=false,cleanupError=false}={}){
 const events=[];let patch;
 const chain={eq(field,value){events.push(['filter',field,value]);return this},select(){return this},async single(){events.push(['write']);return denied?{error:new Error('Denied or stale build')}:{data:{...original,...patch}}}};
 const client={from(){return {update(value){patch=value;return chain},delete(){return chain}}},storage:{from(){return {async upload(key){events.push(['upload',key]);return {}},async remove(keys){events.push(['remove',...keys]);return {error:cleanupError?new Error('Storage unavailable'):null}}}}}};
 const exports={};vm.runInNewContext(compiled,{exports,require:()=>({requireSupabase:()=>client}),File,crypto});return {...exports,events};
}
function payload(image=false){const f=new FormData();f.set('title_en',' Updated ');f.set('description_en','Details');f.set('title_ru',' Обновлённый ');f.set('description_ru','Описание');if(image)f.set('image',new File(['png'],'test.png',{type:'image/png'}));return f}
let api=setup();let result=await api.updateBuild(original,payload());assert.equal(result.build.title,'Updated');assert.equal(result.build.image_key,'old.png');assert.ok(!api.events.some(e=>e[0]==='remove'||e[0]==='upload'));
api=setup();await api.updateBuild(original,payload(true));assert.deepEqual(api.events.filter(e=>e[0]!=='filter').map(e=>e[0]),['upload','write','remove']);assert.equal(api.events.at(-1)[1],'old.png');
api=setup({denied:true});await assert.rejects(api.updateBuild(original,payload(true)));assert.notEqual(api.events.at(-1)[1],'old.png');
api=setup({denied:true});await assert.rejects(api.deleteBuild(original));assert.ok(!api.events.some(e=>e[0]==='remove'));
api=setup();assert.equal(await api.deleteBuild(original),false);assert.deepEqual(api.events.filter(e=>e[0]!=='filter').map(e=>e[0]),['write','remove']);
api=setup({cleanupError:true});assert.equal(await api.deleteBuild(original),true);
console.log('PASS: edit preserves image, replacement and deletion ordering, denied mutations, cleanup failure.');

api=setup();result=await api.updateBuild(original,payload());assert.equal(result.build.title_ru,'Обновлённый');assert.equal(api.getBuildText(result.build,'ru').description,'Описание');assert.equal(api.getBuildText(result.build,'en').title,'Updated');assert.equal(api.getBuildText(original,'ru').title,'Before');assert.equal(api.getBuildText(original,'en').description,'Before');
const incomplete=payload();incomplete.delete('description_en');api=setup();await assert.rejects(api.updateBuild(original,incomplete));assert.equal(api.events.length,0);
console.log('PASS: bilingual persistence, locale switching, legacy fallback and incomplete translation rejection.');

api=setup();const tagged=payload();tagged.append('tags','PvE');tagged.append('tags','heal');tagged.append('tags','heal');result=await api.updateBuild(original,tagged);assert.deepEqual(Array.from(result.build.tags),['PvE','heal']);
assert.equal(api.matchesBuildTags(result.build,['PvE','heal']),true);assert.equal(api.matchesBuildTags(result.build,['PvE','tank']),false);assert.equal(api.matchesBuildTags(original,[]),true);assert.equal(api.matchesBuildTags(original,['PvE']),false);
result=await api.updateBuild(result.build,payload());assert.equal(result.build.tags.length,0);
api=setup();const invalidTag=payload();invalidTag.append('tags','unknown');await assert.rejects(api.updateBuild(original,invalidTag));assert.equal(api.events.length,0);
console.log('PASS: multiple tags, deduplication, all-selected filtering, untagged builds, tag removal and invalid tag rejection.');

api=setup();const zoneTags=payload();zoneTags.append('tags','Conflict');zoneTags.append('tags','DarkZone');result=await api.updateBuild(original,zoneTags);assert.deepEqual(Array.from(result.build.tags),['Conflict','DarkZone']);assert.equal(api.matchesBuildTags(result.build,['Conflict','DarkZone']),true);assert.equal(api.matchesBuildTags(original,['Conflict']),false);assert.equal(api.matchesBuildTags(original,['DarkZone']),false);
console.log('PASS: Conflict and DarkZone persistence and combined filtering.');

api=setup();const incursionTags=payload();incursionTags.append('tags','Broken Rain');incursionTags.append('tags','Paradise Lost');result=await api.updateBuild(original,incursionTags);assert.deepEqual(Array.from(result.build.tags),['Broken Rain','Paradise Lost']);assert.equal(api.matchesBuildTags(result.build,['Broken Rain','Paradise Lost']),true);assert.equal(api.matchesBuildTags(original,['Broken Rain']),false);assert.equal(api.matchesBuildTags(original,['Paradise Lost']),false);
console.log('PASS: incursion tags persistence and combined filtering.');
