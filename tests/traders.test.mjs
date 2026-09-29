import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/traders.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {traderTime,traderToday,traderEvent,traderMonth}=exports;
for(const [day,hour] of [[1,0],[3,8],[5,16]]){assert.equal(traderEvent(day).kind,'open');assert.equal(traderEvent(day+1).kind,'close');assert.equal(traderTime(hour,'ru'),`${String(hour+3).padStart(2,'0')}:00`);assert.equal(traderTime(hour,'en'),`${String(hour).padStart(2,'0')}:00`)}
assert.equal(traderEvent(0),null);
const instant=new Date('2026-12-31T22:30:00Z');assert.equal(traderToday(instant,'ru').year,2027);assert.equal(traderToday(instant,'en').year,2026);assert.equal(traderToday(instant,'ru').day,1);assert.equal(traderToday(instant,'en').day,31);
for(const [year,month,count] of [[2028,1,29],[2026,1,28],[2026,7,31],[2027,0,31]]){const cells=traderMonth(year,month);assert.equal(cells.length%7,0);assert.equal(cells[0].weekday,1);assert.equal(cells.at(-1).weekday,0);assert.equal(cells.filter(c=>c.month===month).length,count);assert.equal(new Set(cells.map(c=>c.key)).size,cells.length)}
assert.equal(traderMonth(2026,7).length,42);
console.log('PASS: all weekly openings/closings, MSK/UTC conversion, year boundary, leap years and six-week months.');
const {traderStatus,TRADER_WINDOWS}=exports;
for(const window of TRADER_WINDOWS){
 const start=Date.UTC(2026,8,28+window.day-1,window.hour);
 const before=traderStatus(window,new Date(start-1));assert.equal(before.active,false);assert.equal(before.minutes,1);assert.equal(before.target,start);
 const opened=traderStatus(window,new Date(start));assert.equal(opened.active,true);assert.equal(opened.hours,24);assert.equal(opened.minutes,0);
 const closing=traderStatus(window,new Date(start+86400000-1));assert.equal(closing.active,true);assert.equal(closing.minutes,1);
 const closed=traderStatus(window,new Date(start+86400000));assert.equal(closed.active,false);assert.equal(closed.hours,144);assert.equal(closed.target,start+7*86400000);
 const nextWeek=traderStatus(window,new Date(start+7*86400000));assert.equal(nextWeek.active,true);
}
const middle=new Date('2026-09-30T12:25:00Z');assert.equal(traderStatus(TRADER_WINDOWS[0],middle).active,false);assert.equal(traderStatus(TRADER_WINDOWS[1],middle).active,true);assert.equal(traderStatus(TRADER_WINDOWS[1],middle).hours,19);assert.equal(traderStatus(TRADER_WINDOWS[1],middle).minutes,35);assert.equal(traderStatus(TRADER_WINDOWS[2],middle).active,false);
assert.equal(traderStatus(TRADER_WINDOWS[0],new Date('2027-01-03T23:59:00Z')).minutes,1);
console.log('PASS: exact opening/closing boundaries, next-week countdowns, three independent statuses and year transition.');
