import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/activities.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {activityReset,ACTIVITY_GROUPS}=exports;
assert.equal(ACTIVITY_GROUPS.length,2);
assert.equal(ACTIVITY_GROUPS.flatMap(g=>g.activities).length,4);
for(const [day,start] of [[1,'2026-09-28T08:00:00Z'],[2,'2026-09-29T08:00:00Z']]){
 const at=Date.parse(start);
 const before=activityReset(day,new Date(at-1));assert.equal(before.target,at);assert.equal(before.minutes,1);
 const exact=activityReset(day,new Date(at));assert.equal(exact.target,at+7*86400000);assert.equal(exact.days,7);assert.equal(exact.hours,0);assert.equal(exact.minutes,0);
 assert.equal(activityReset(day,new Date(at+1)).target,at+7*86400000);
 assert.equal(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:'Europe/Moscow'}).format(new Date(at)),'11');
}
assert.equal(new Date(activityReset(1,new Date('2026-12-31T23:00:00Z')).target).toISOString(),'2027-01-04T08:00:00.000Z');
assert.equal(new Date(activityReset(2,new Date('2028-02-28T09:00:00Z')).target).toISOString(),'2028-02-29T08:00:00.000Z');
for(const now of ['2026-03-29T12:00:00Z','2026-10-25T12:00:00Z'])assert.equal(new Date(activityReset(1,new Date(now)).target).getUTCHours(),8);
console.log('PASS: weekly resets, exact boundaries, Moscow conversion, year/leap-day and DST independence.');
