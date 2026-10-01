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

const {setTalentRule,evaluateSetRule}=load('set-effects');
const {initialTalentState,baseCalculatorBonuses}=load('calculator-defaults');
const setRule=(id,chest=false,backpack=false)=>setTalentRule(catalog.sets.find(s=>s.id===id),chest,backpack,30);
test('selection initializes ordinary and perfect talent stacks without manual damage bonuses',()=>{
 for(const [name,max] of [['Obliterate',20],['Perfect Obliterate',24]]){
  const state=initialTalentState(get(name));assert.equal(state.active,true);assert.equal(state.values.stacks,max);
  assert.equal(evaluateTalent(get(name),state.active,state.values,context).bonuses.twd,max);
 }
 assert.equal(initialTalentState(undefined).active,false);
 assert.equal(baseCalculatorBonuses().chd,25);assert.equal(baseCalculatorBonuses().wd,0);
});
test('set upgrades use source limits, preserve zero stacks and disable cleanly',()=>{
 const basic=setRule('striker-s-battlegear'),upgraded=setRule('striker-s-battlegear',true,true);
 assert.equal(basic.controls[0].max,100);assert.equal(upgraded.controls[0].max,200);
 close(evaluateSetRule(basic,true,{},context).amps[0],65);
 close(evaluateSetRule(upgraded,true,{},context).amps[0],180);
 assert.equal(evaluateSetRule(upgraded,true,{stacks:0},context).amps[0],0);
 assert.equal(evaluateSetRule(upgraded,false,{},context).amps.length,0);
 assert.equal(evaluateSetRule(basic,true,{stacks:200},context).amps[0],65);
 assert.equal(evaluateSetRule(setRule('future-initiative',true),true,{},context).bonuses.twd,25);
 assert.equal(evaluateSetRule(setRule('ongoing-directive',true),true,{},context).amps[0],60);
 assert.equal(evaluateSetRule(setRule('concentrated-company',false,true),true,{},context).bonuses.wd,210);
 assert.equal(setRule('heartbreaker',true).controls[0].max,100);
 assert.equal(setRule('tipping-scales',true).controls[0].max,75);
});
test('all modeled source set variants produce finite values and next-shot sets do not inflate sustained DPS',()=>{
 for(const s of catalog.sets.filter(s=>s.kind==='set'))for(const chest of [false,true])for(const backpack of [false,true]){
  const rule=setTalentRule(s,chest,backpack,30);if(!rule)continue;
  for(const control of rule.controls)assert.ok(Number.isFinite(control.max)&&control.max>0,s.id);
  const effect=evaluateSetRule(rule,true,{},context);
  for(const n of [...Object.values(effect.bonuses),...effect.amps])assert.ok(Number.isFinite(n),s.id);
 }
 const aces=evaluateSetRule(setRule('aces-eights',true),true,{},context);
 close(talentDamage(input,[aces]).body,talentDamage(input,[]).body*2);
 close(talentDamage(input,[aces]).sustained,talentDamage(input,[]).sustained);
 assert.equal(evaluateSetRule(setRule('breaking-point'),true,{}, {...context,weaponType:'smg'}).bonuses.wd,undefined);
});

const {specializationEffect,blankSpecialization,SPECIALIZATIONS}=load('specializations');
test('specializations use source weapon tiers and restrict personal headshot damage to rifles',()=>{
 for(const [id] of SPECIALIZATIONS)for(const weaponType of ['rifle','marksman-rifle','assault-rifle','smg','lmg','shotgun','pistol'])for(let tier=0;tier<=3;tier++){
  const effect=specializationEffect({...blankSpecialization(),id,weaponTier:tier},weaponType);
  assert.equal(effect.bonuses.wd||0,tier*5);
  assert.equal(effect.bonuses.hsd||0,id==='sharpshooter'&&['rifle','marksman-rifle'].includes(weaponType)?15:0);
 }
 assert.equal(Object.keys(specializationEffect(blankSpecialization(),'rifle').bonuses).length,0);
});
test('own tactical links never apply to self; allied links use distinct damage buckets and target conditions',()=>{
 const own=specializationEffect({...blankSpecialization(),id:'demolitionist'},'rifle');assert.equal(own.bonuses.out,undefined);
 const team=specializationEffect({...blankSpecialization(),team:{demolitionist:true,sharpshooter:true,survivalist:true,firewall:true}},'rifle');
 assert.equal(team.bonuses.out,5);assert.equal(team.bonuses.hsd,10);assert.equal(team.amps.length,2);assert.equal(team.amps[0],10);
 const a=talentDamage({...input,out:team.bonuses.out,outside:false},[]).body;
 close(a,talentDamage({...input,out:0,outside:false},[]).body);
 close(talentDamage({...input,out:5,outside:true},[]).body/a,1.05);
});
test('conditional specialization perks switch off when changing specialization',()=>{
 const conditions={kill:true,still:true,kit:true,robot:true};
 const gunner=specializationEffect({...blankSpecialization(),id:'gunner',conditions},'smg');assert.equal(gunner.bonuses.rof,5);assert.equal(gunner.bonuses.handling,10);assert.equal(gunner.amps.length,0);
 const demo=specializationEffect({...blankSpecialization(),id:'demolitionist',conditions},'smg');assert.equal(demo.bonuses.handling,30);assert.equal(demo.bonuses.rof,undefined);
 const tech=specializationEffect({...blankSpecialization(),id:'technician',conditions},'smg');assert.equal(tech.amps[0],12);assert.equal(tech.bonuses.handling,undefined);
 assert.equal(specializationEffect({...blankSpecialization(),id:'technician'},'smg').amps.length,0);
});

const {eventBonusEffect,applyEventPreset,EVENT_PRESETS}=load('event-bonuses');
const event=(type,value,enabled=true)=>({id:type+value,type,value,enabled,name:'Event'});
test('event bonuses add within buckets and multiply independent amplifiers without double counting',()=>{
 const effect=eventBonusEffect([event('wd',20),event('wd',30),event('twd',10),event('out',5),event('amp',20),event('amp',30)]);
 assert.equal(effect.bonuses.wd,50);assert.equal(effect.bonuses.twd,10);assert.equal(effect.bonuses.out,5);
 const r=talentDamage({...input,wd:50,twd:10,out:5,outside:true},[{bonuses:{},amps:effect.amps}]);
 close(r.body,input.base*1.5*1.1*1.1*1.05*1.2*1.3);
});
test('event headshot bonuses affect only head hits; target-specific bonuses follow target settings',()=>{
 const e=eventBonusEffect([event('hsd',60),event('out',20),event('armor',10),event('health',15)]);
 const base=talentDamage(input,[]),head=talentDamage({...input,hsd:input.hsd+e.bonuses.hsd},[]);
 close(head.body,base.body);close(head.head-base.head,base.body*.6);
 const covered=talentDamage({...input,outside:false,out:e.bonuses.out,armor:e.bonuses.armor,health:e.bonuses.health},[]);
 close(covered.body,input.base*2*1.25*1.1);
 close(talentDamage({...input,outside:false,armored:false,armor:e.bonuses.armor,health:e.bonuses.health},[]).body,input.base*2*1.25*1.15);
});
test('disabled, removed and invalid event rows do not leave bonuses behind',()=>{
 const e=eventBonusEffect([event('wd',30,false),event('amp',NaN),event('hsd',-20),event('unknown',50)]);
 assert.equal(e.bonuses.wd,undefined);assert.equal(e.bonuses.hsd,0);assert.equal(e.amps.length,0);
 assert.equal(Object.keys(eventBonusEffect([]).bonuses).length,0);
});

const weaponAttributeData=JSON.parse(readFileSync(new URL('../data/weapon-attributes.json',import.meta.url),'utf8'));
const weaponData=JSON.parse(readFileSync(new URL('../data/weapons.json',import.meta.url),'utf8'));
const {initialWeaponRolls,setWeaponPrototype,weaponAttributeBonuses}=load('weapon-attributes');
const {setAttributePrototype}=load('attribute-values');
test('one weapon prototype switch applies to every slot and preserves custom and zero rolls',()=>{
 const w=weaponData.find(w=>w.name==='FAMAS 2010');const rolls=initialWeaponRolls(w.attributes,weaponAttributeData);
 const proto=setWeaponPrototype(w.attributes,rolls,weaponAttributeData,true);
 assert.equal(proto.core_1.value,22.5);assert.equal(proto.core_2.proto,true);assert.equal(proto.minor_1.proto,true);
 const normal=setWeaponPrototype(w.attributes,proto,weaponAttributeData,false);assert.equal(normal.core_1.value,15);
 rolls.core_1.value=10;assert.equal(setWeaponPrototype(w.attributes,rolls,weaponAttributeData,true).core_1.value,10);
 rolls.core_1.value=0;assert.equal(setWeaponPrototype(w.attributes,rolls,weaponAttributeData,true).core_1.value,0);
});
test('exotic weapon prototype flags are rejected by the switch and cannot raise calculation caps',()=>{
 for(const name of ['Mantis','Prima Donna']){
  const w=weaponData.find(w=>w.name===name),rolls=initialWeaponRolls(w.attributes,weaponAttributeData);
  const invalid=setWeaponPrototype(w.attributes,rolls,weaponAttributeData,true);
  assert.equal(weaponAttributeBonuses(w.attributes,invalid,weaponAttributeData,true).wd,15);
  assert.equal(weaponAttributeBonuses(w.attributes,invalid,weaponAttributeData,true).hsd,111);
  const safe=setWeaponPrototype(w.attributes,invalid,weaponAttributeData,true,true);
  assert.ok(Object.values(safe).every(r=>!r.proto));assert.equal(safe.core_1.value,15);
 }
});
test('gear prototype switching retains rolled values while changing maximum rolls and future empty slots',()=>{
 const a={value:'+15%',prototypeValue:'+22.5%'};
 assert.equal(setAttributePrototype({id:'weapon-damage',proto:false,value:15},a,true).value,22.5);
 assert.equal(setAttributePrototype({id:'weapon-damage',proto:true,value:20.8},a,false).value,15);
 assert.equal(setAttributePrototype({id:'weapon-damage',proto:false,value:10},a,true).value,10);
 assert.equal(setAttributePrototype({id:'',proto:false},undefined,true).proto,true);
});

test('Prima Donna preset reproduces the verified build with full watch, three mods and event bonuses',()=>{
 const p=load('calculator-presets').primaDonnaPreset();const w=weaponData.find(w=>w.id===p.weaponId);
 const gearAttributes=JSON.parse(readFileSync(new URL('../data/attributes.json',import.meta.url),'utf8'));
 const totals=baseCalculatorBonuses();const add=bs=>Object.entries(bs).forEach(([k,n])=>totals[k]=(totals[k]||0)+n);
 const counts={};p.gear.forEach(g=>counts[g.brand]=(counts[g.brand]||0)+1);
 for(const s of catalog.sets.filter(s=>counts[s.id]))for(const b of s.bonuses.filter(b=>b.pieces<=counts[s.id]))for(const x of load('damage').staticBonus(b.text,w.type))add({[x.key]:x.value});
 const keys={'weapon-damage':'wd','headshot-damage':'hsd','weapon-handling':'handling'};
 for(const g of p.gear){for(const roll of [g.core,...g.minor]){const a=gearAttributes.find(a=>a.id===roll.id);if(a&&keys[a.id])add({[keys[a.id]]:load('attribute-values').attributeRollAmount(a,roll)});}if(g.mod)add({hsd:g.modValue});}
 const wm=load('weapon-mods');const mods=JSON.parse(readFileSync(new URL('../data/weapon-mods.json',import.meta.url),'utf8'));
 add(wm.attachmentBonuses(wm.selectedWeaponMods(w.slots,{},mods)));add(load('shd-watch').watchDamageBonuses(p.watch));add(weaponAttributeBonuses(w.attributes,p.weaponRolls,weaponAttributeData,true));add(specializationEffect(p.specialization,w.type).bonuses);
 const event=eventBonusEffect(p.eventBonuses);add(event.bonuses);
 const ctx={weaponType:w.type,magazine:w.mag,armored:p.armored};const choices=[weaponTalent(w.talentSlot,''),...p.talents.slice(1).map(id=>load('calculator-talents').calculatorTalents.find(t=>t.id===id))];
 const effects=choices.map((talent,i)=>evaluateTalent(talent,p.active[i],p.talentValues[i],ctx));effects.forEach(e=>add(e.bonuses));effects.push(evaluateSetRule(setRule('aces-eights'),true,{},ctx));
 const r=talentDamage({...input,base:w.damage,wd:totals.wd+p.expertise,twd:totals.twd,chc:totals.chc,chd:totals.chd,hsd:w.hsd+totals.hsd,armor:0,health:0,out:totals.out,armored:p.armored,outside:p.outside,headshots:p.headshots},effects);
 close(totals.wd+p.expertise,260.3);close(totals.hsd,424.4);close(r.head,71541516.14317176);
 assert.equal(Object.values(p.watch).length,16);assert.ok(Object.values(p.watch).every(v=>v===50));assert.equal(p.gear.filter(g=>g.mod).length,3);
 const fresh=load('calculator-presets').primaDonnaPreset();p.gear[0].core.value=0;assert.equal(fresh.gear[0].core.value,22.5);
});

test('preset list resolves both weapons and never carries Prima Donna stacks into Mantis',()=>{
 const {CALCULATOR_PRESETS}=load('calculator-presets');assert.equal(CALCULATOR_PRESETS.length,2);
 const p=CALCULATOR_PRESETS.find(p=>p.id==='mantis').create();const w=weaponData.find(w=>w.id===p.weaponId);
 assert.equal(w.name,'Mantis');assert.equal(weaponTalent(w.talentSlot,'').name,'In Plain Sight');assert.equal(p.talentValues[0].stacks,undefined);
 assert.equal(p.weaponRolls.minor_1.id,'dtoc-weapon-minor');assert.equal(p.active[0],true);assert.equal(p.eventBonuses.length,5);
});

test('event presets fill five localized bonuses without duplication and preserve custom rows',()=>{
 const custom={id:'custom',type:'twd',value:10,name:'Other',enabled:true};
 const rows=applyEventPreset([custom],'deadeye-overdrive');
 assert.deepEqual(JSON.parse(JSON.stringify(rows.slice(1).map(({type,value})=>({type,value})))),[
  {type:'hsd',value:60},{type:'wd',value:30},{type:'accuracy',value:40},{type:'stability',value:40},{type:'weakpoint',value:40}
 ]);
 assert.equal(EVENT_PRESETS[0].en,'DeadEye Overdrive');assert.equal(EVENT_PRESETS[0].ru,'Снайперский Форсаж');
 assert.equal(applyEventPreset(rows,'deadeye-overdrive').length,6);
 assert.equal(new Set(rows.map(r=>r.id)).size,6);
 const cleared=applyEventPreset(rows,'');assert.equal(cleared.length,1);assert.equal(cleared[0],custom);
 const effects=eventBonusEffect(rows);assert.equal(effects.bonuses.wd,30);assert.equal(effects.bonuses.hsd,60);assert.equal(effects.bonuses.twd,10);
 assert.equal(effects.bonuses.accuracy,undefined);assert.equal(effects.bonuses.stability,undefined);assert.equal(effects.bonuses.weakpoint,undefined);
 rows[1].value=0;assert.equal(applyEventPreset([],'deadeye-overdrive')[0].value,60);
});
