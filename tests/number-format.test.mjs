import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Intl});return exports;}
const {formatNumber,formatStatValue,formatGameText}=load('../lib/number-format.ts');
const {prototypeValue,attributeRollAmount}=load('../lib/attribute-values.ts');
test('standard, prototype and calculated quantities use comma grouping in both languages',()=>{
 assert.equal(formatStatValue('+170000'),'+170,000');assert.equal(formatStatValue('+170,000'),'+170,000');
 assert.equal(prototypeValue('+170000','ru','+255000'),'+255,000');assert.equal(prototypeValue('+170000','en','+255000'),'+255,000');
 assert.equal(formatStatValue('+22.5%'),'+22.5%');assert.equal(formatNumber(1234567.89),'1,234,567.89');
 assert.equal(formatGameText('Урон 1250% и 1250,5 брони; P320, 0,5%.'),'Урон 1,250% и 1,250.5 брони; P320, 0,5%.');
});
test('selected gear rolls retain partial values and zero; prototype caps are enforced',()=>{
 const a={value:'+15%',enValue:'+15%',prototypeValue:'+22.5%'};
 assert.equal(attributeRollAmount(a,{proto:false,value:7.3}),7.3);
 assert.equal(attributeRollAmount(a,{proto:true,value:0}),0);
 assert.equal(attributeRollAmount(a,{proto:false,value:22.5}),15);
 assert.equal(attributeRollAmount(a,{proto:true,value:99}),22.5);
 assert.equal(attributeRollAmount(a,{proto:true}),22.5);
 assert.equal(attributeRollAmount(a,{proto:true,value:NaN}),0);
});
