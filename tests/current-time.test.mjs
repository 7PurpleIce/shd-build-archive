import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=readFileSync(new URL('../hooks/use-current-time.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};let cleanup,tick,interval,updates=0,cleared;
const listeners={};
function target(name){return {
 addEventListener(event,handler){listeners[name+event]=handler},
 removeEventListener(event,handler){assert.equal(listeners[name+event],handler);delete listeners[name+event]},
}}
vm.runInNewContext(compiled,{exports,Date,
 require:()=>({useState:initial=>[initial(),()=>updates++],useCallback:fn=>fn,useEffect:effect=>{cleanup=effect()}}),
 window:target('window'),document:target('document'),
 setInterval(fn,ms){tick=fn;interval=ms;return 42},clearInterval(id){cleared=id},
});
const {now,refresh}=exports.useCurrentTime();
assert.ok(now instanceof Date);assert.equal(interval,1000);
tick();listeners.windowfocus();listeners.documentvisibilitychange();refresh();
assert.equal(updates,4);
cleanup();assert.equal(cleared,42);assert.equal(Object.keys(listeners).length,0);
console.log('PASS: clock ticks, focus/visibility/manual refresh, timer and listener cleanup.');
