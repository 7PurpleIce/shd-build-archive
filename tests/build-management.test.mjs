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
