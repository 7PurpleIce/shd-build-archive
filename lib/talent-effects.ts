/** Explicit, reviewed PvE rules. Values are read from the shared English descriptions.
 * Unlisted mechanics stay manual; never guess an effect from an arbitrary percentage.
 */
export type TalentSource={name:string;description:string};
export type TalentControl={id:string;en:string;ru:string;max:number;step?:number};
export type TalentEffect={bonuses:Record<string,number>;amps:number[];noReload?:boolean;forceHead?:boolean;criticalChance?:number;headAmp?:number;baseMultiplier?:number;nextShot?:boolean;magBasePercent?:number;shotBonus?:number;headhunter?:{previous:number;scale:number;low:number;high:number;threshold:number}};
export type TalentContext={weaponType:string;magazine:number;armored:boolean;redCores?:number};
export type TalentRule={note?:[string,string];passive?:boolean;controls:TalentControl[];apply:(values:Record<string,number>,context:TalentContext)=>TalentEffect};
const effect=(bonuses:Record<string,number>={},amps:number[]=[]):TalentEffect=>({bonuses,amps});
export function talentRule(t:TalentSource):TalentRule|undefined{
 const name=t.name.replace(/^Perfect /,'');
 const p=[...t.description.matchAll(/([+-]?\d+(?:\.\d+)?)%/g)].map(m=>Number(m[1]));
 const control=(id:string,en:string,ru:string,max:number,step=1):TalentControl=>({id,en,ru,max,step});
 const stacks=(max:number)=>control('stacks','Active stacks','Активные стаки',max);
 const stackMax=()=>Number(t.description.match(/(?:Max stacks?:? (?:is )?|[Ss]tacks up to |[Ss]tacks? (?:to a cap of|up to a max of) )(\d+)/)?.[1]||0);
 const simple=(key:string,value:number,passive=false):TalentRule=>({passive,controls:[],apply:()=>key==='amp'?effect({},[value]):effect({[key]:value})});
 const stacked=(key:string,per:number,max:number,compound=false):TalentRule|undefined=>max>0?{controls:[stacks(max)],apply:v=>key==='amp'?effect({},[compound?((1+per/100)**(v.stacks||0)-1)*100:per*(v.stacks||0)]):effect({[key]:per*(v.stacks||0)})}:undefined;
 if(!p.every(Number.isFinite))return;
 if(['Glass Cannon','Spotter','Behind You','Eyeless','Flatline','Foam at the Mouth','Head Scratcher','Ignited','Immobilize','Pressure Point','Sadist','Thunder Strike','Breathe Free','High Priority Target','Ortiz Assault Interface','Restrained'].includes(name)&&p.length)return simple('amp',p[0]);
 if(['Companion','Composure','Gunslinger','Overwatch','Spark','Vigilance','Wicked'].includes(name)&&p.length)return simple('twd',p[0]);
 if(['Close & Personal','Pummel','Soft Spot','Streamline','Swift','Unhinged'].includes(name)&&p.length)return simple('wd',p[0],name==='Unhinged');
 if(name==='Killer'&&p.length)return simple('chd',p[0]);
 if(name==='Naked'&&p.length)return simple('hsd',p[0]);
 if(['Braced','On Empty','Unwavering','Optimized'].includes(name)&&p.length)return simple('handling',p[0],name==='Optimized');
 if(['Overclock','Jazz Hands'].includes(name)&&p.length)return simple('reload',p[0],name==='Jazz Hands');
 if(['Lucky Shot','Extra'].includes(name)&&p.length)return simple('mag',p[0],true);
 if(name==='Allegro'&&p.length)return simple('rof',p[0],true);
 if(['Rifleman','Overwhelm','Pumped Up','Unstoppable Force','Obliterate','Strained','Fast Hands','Breadbasket','Precision Strike'].includes(name)&&p.length){
 const keys:Record<string,string>={'Rifleman':'wd','Overwhelm':'wd','Pumped Up':'wd','Unstoppable Force':'twd','Obliterate':'twd','Strained':'chd','Fast Hands':'reload','Breadbasket':'hsd','Precision Strike':'amp'};
 const rule=stacked(keys[name],p[0],stackMax());if(name==='Breadbasket'&&rule){const apply=rule.apply;return {...rule,apply:(v,c)=>({...apply(v,c),nextShot:true})};}return rule;
 }
 if(name==='Focus'&&p.length>=2)return stacked('twd',p[0],Math.round(p[1]/p[0]));
 if(name==='Intimidate'&&p.length)return stacked('amp',p[0],Number(t.description.match(/max of (\d+)/)?.[1]),true);
 if(name==='In Sync'&&p.length>=2)return {controls:[control('buffs','Weapon buff: 0 off / 1 single / 2 both','Бонус оружия: 0 нет / 1 один / 2 оба',2)],apply:v=>effect({wd:p[1]*(v.buffs||0)})};
 if(name==='Concussion'&&p.length>=2)return {controls:[control('mode','Buff: 0 off / 1 headshot / 2 kill / 3 both','Бонус: 0 нет / 1 в голову / 2 убийство / 3 оба',3)],apply:v=>effect({twd:v.mode===3?p[0]+p[1]:v.mode===2?p[1]:v.mode===1?p[0]:0})};
 if(name==='Measured'&&p.length===4)return {controls:[control('half','Magazine half: 0 top / 1 bottom','Половина магазина: 0 первая / 1 вторая',1)],apply:v=>v.half?effect({rof:p[2],twd:p[3]}):effect({rof:p[0],wd:p[1]})};
 if(name==='Optimist'&&p.length>=2)return {controls:[control('missing','Missing magazine % (current shot)','Израсходовано магазина % (текущий выстрел)',100,.1)],apply:v=>effect({wd:p[0]*(v.missing||0)/p[1]})};
 if(name==='Ranger'&&p.length){const distance=Number(t.description.match(/every (\d+)m/)?.[1]);if(distance)return {controls:[control('distance',`Complete ${distance} m distance steps`,`Полных отрезков дистанции по ${distance} м`,100)],apply:v=>effect({},[p[0]*(v.distance||0)])};}
 if(name==='Frenzy'&&p.length>=2){const group=Number(t.description.match(/every (\d+) bullets/i)?.[1]);if(group)return {controls:[],apply:(_,c)=>effect({rof:Math.floor(c.magazine/group)*p[0],wd:Math.floor(c.magazine/group)*p[1]})};}
 if(name==='Back and Forth'&&p.length>=2)return {controls:[],apply:()=>effect({rof:p[0],wd:p[1]})};
 if(name==='Vindictive'&&p.length>=2)return {controls:[],apply:()=>effect({chc:p[0],chd:p[1]})};
 if(name==='Opportunistic'&&p.length)return simple('amp',p[0]);
 if(name==='Versatile'&&p.length>=3)return {controls:[],apply:(_,c)=>effect({},[['shotgun','smg'].includes(c.weaponType)?p[0]:['rifle','marksman-rifle'].includes(c.weaponType)?p[1]:['lmg','assault-rifle'].includes(c.weaponType)?p[2]:0])};
 // Current-shot mechanics are separate from permanent stat bonuses.
 if(['Determined','First Blood','Transfusion','Resolved'].includes(name))return {controls:[],apply:()=>({...effect(),forceHead:true,criticalChance:t.name==='Perfect Determined'?1:undefined,nextShot:name!=='Transfusion'})};
 if(name==='Agonizing Bite'&&p.length)return {controls:[control('marked','0 critical buff / 1 marked target','0 бонус крита / 1 отмеченная цель',1)],apply:v=>({...effect({},v.marked?[p[0]]:[]),criticalChance:1})};
 if(name==='Boiling Point')return {controls:[control('half','0 first magazine portion / 1 final portion','0 начало магазина / 1 остаток магазина',1)],apply:v=>({...effect(),criticalChance:v.half?1:0})};
 if(name==='In Plain Sight'&&p.length)return {controls:[],apply:()=>({...effect(),headAmp:p[0]})};
 if(name==='Headhunter'&&p.length===4)return {note:['Next shot only; enter the previous killing hit. It is not a sustained-DPS bonus.','Только следующий выстрел: укажи урон предыдущего убийства в голову. Бонус не добавляется к постоянному DPS.'],controls:[control('previous','Previous headshot killing damage','Урон предыдущего убийства в голову',1000000000)],apply:v=>({...effect(),nextShot:true,headhunter:{previous:v.previous||0,scale:p[0],low:p[1],high:p[2],threshold:p[3]}})};
 if(name==='Blossom Harvest'&&p.length>=2)return {controls:[control('remaining','Combined remaining armor and health %','Оставшиеся броня и здоровье, суммарно %',200)],apply:v=>effect({},[p[0]*Math.floor((v.remaining||0)/p[1])])};
 if(name==='Brazen'&&p.length){const min=Number(t.description.match(/at least (\d+) pellets/)?.[1]);return {controls:[control('pellets','Pellets landed in the previous shot','Попаданий дробин предыдущим выстрелом',20)],apply:v=>({...effect({},(v.pellets||0)>=min?[p[0]*(v.pellets||0)]:[]),nextShot:true})};}
 if(name==='Adaptive Instincts'&&p.length>=4)return {controls:[control('head','Headshot buff: 0 off / 1 on','Бонус за головы: 0 нет / 1 да',1),control('body','Body-shot buff: 0 off / 1 on','Бонус за корпус: 0 нет / 1 да',1),control('legs','Leg-shot buff: 0 off / 1 on','Бонус за ноги: 0 нет / 1 да',1)],apply:v=>effect({chc:p[0]*(v.head||0),chd:p[1]*(v.head||0),wd:p[2]*(v.body||0),reload:p[3]*(v.legs||0)})};
 if(name==='Gangland Hit'&&p.length>=2)return {controls:[control('marks','Marks on this target (including yours)','Метки на цели (включая твою)',4)],apply:v=>effect({},v.marks?[p[0]+p[1]*(v.marks-1)]:[])};
 if(name==='Sledgehammer'&&p.length)return {controls:[],apply:(_,c)=>effect({},c.armored?[p[0]]:[])};
 if(name==='Mosquito Song'&&p.length)return {controls:[stacks(5)],apply:(v,c)=>effect({},c.armored&&v.stacks===5?[p[0]]:[])};
 if(name==='Septic Shock'&&p.length)return {controls:[stacks(9)],apply:v=>effect({},v.stacks===9?[p[0]]:[])};
 if(name==="Dragon's Breath"&&p.length>=2)return {note:['Direct weapon bonus only; burn ticks are separate.','Только бонус прямого урона оружия; горение отдельно.'],controls:[control('status','Total Status Effects bonus %','Суммарный бонус негативных эффектов %',1000,.1)],apply:v=>effect({},[(v.status||0)*p[1]/100])};
 if(['Overflowing','Pakhan'].includes(name)&&p.length)return {controls:name==='Pakhan'?[stacks(Number(t.description.match(/up to (\d+) stacks/)?.[1]))]:[],apply:v=>({...effect(),magBasePercent:p[0]*(name==='Pakhan'?(v.stacks||0):1)})};
 if(name==='Bond'&&p.length>=4)return {controls:[control('source','0 none / 1 skill nearby / 2 ally nearby','0 нет / 1 навык рядом / 2 союзник рядом',2)],apply:v=>effect({chd:v.source===2?p[0]:v.source===1?p[3]:0})};
 if(name==='Decoy King'&&p.length>=3)return {controls:[control('phase','Moon phase (0–7)','Фаза луны (0–7)',7)],apply:v=>effect({},[Math.min(p[2],p[0]+p[1]*Math.min(v.phase||0,8-(v.phase||0)))])};
 if(name==='Kill Confirmed'&&p.length>=4)return {controls:[stacks(30),control('short','Short buff: 0 off / 1 on','Краткий бонус: 0 нет / 1 да',1)],apply:(v,c)=>effect({wd:p[3]*(v.stacks||0)+p[0]*(c.redCores||0)*(v.short||0)})};
 if(name==='Rebalance'&&p.length>=4)return {controls:[control('red','Current red stacks (before purge)','Текущие красные стаки (до сброса)',79),control('blue','Blue stacks at previous purge','Синие стаки при прошлом сбросе',80)],apply:v=>effect({wd:p[0]*(v.red||0)+p[3]*(v.blue||0)})};
 // Exotic weapon effects supported as a selected, constant combat state.
 if(name==='Capacitance'&&p.length>=2)return {passive:true,controls:[control('tier','Skill tier (including specialization)','Уровень навыка (включая специализацию)',6)],apply:v=>effect({wd:p[1]*(v.tier||0)})};
 if(name==='Payment in Kind'&&p.length)return stacked('chd',p[0],Number(t.description.match(/up to (\d+) stacks/)?.[1]));
 if(name==='Cover Shooter'&&p.length>=2)return stacked('wd',p[0],p[1]/p[0]);
 if(name==='Full Stop'&&p.length>=2)return {controls:[stacks(Number(t.description.match(/cap of (\d+)/)?.[1]))],apply:v=>effect({wd:p[0]*(v.stacks||0),hsd:p[1]*(v.stacks||0)})};
 if(name==='Incessant Chatter'&&p.length)return stacked('rof',p[0],stackMax());
 if(name==='Liberty or Death'&&p.length)return stacked('wd',p[0],stackMax());
 if(name==='Unnerve'&&p.length)return stacked('amp',p[0],Number(t.description.match(/is (\d+)/)?.[1]));
 if(name==="You can look...but you can't touch"&&p.length)return stacked('amp',p[0],Number(t.description.match(/receive (\d+) stacks/)?.[1]));
 if(['Faster Than Reloading','Perturb'].includes(name)&&p.length>=2){const offset=name==='Perturb'?1:0;return {controls:[],apply:()=>effect({rof:p[offset],wd:p[offset+1]})};}
 if(name==='Startling'&&p.length)return simple('out',p[0]);
 if(name==='Bullet Hell')return {passive:true,controls:[],apply:()=>({...effect(),noReload:true})};
 return undefined;
}
export function evaluateTalent(t:TalentSource,active:boolean,values:Record<string,number>,context:TalentContext):TalentEffect{
 const rule=talentRule(t);if(!rule||(!active&&!rule.passive))return effect();
 const clean:Record<string,number>={};for(const c of rule.controls){const n=values[c.id]||0;clean[c.id]=Number.isFinite(n)?Math.min(c.max,Math.max(0,n)):0;if((c.step||1)===1)clean[c.id]=Math.floor(clean[c.id]);}
 return rule.apply(clean,context);
}

/** Coverage is explicit: a non-damage talent is different from a missing damage model. */
export function talentStatus(t:TalentSource):{kind:string;label:[string,string];note:[string,string]}{
 if(talentRule(t))return {kind:'auto',label:['auto','авто'],note:['Calculated for the selected state.','Рассчитано для выбранного состояния.']};
 const name=t.name.replace(/^Perfect /,'');
 if(['Finisher','Busy Little Bee','Abridged'].includes(name))return {kind:'transfer',label:['other weapon','другое оружие'],note:['This effect is transferred to another weapon. A second equipped weapon is required to model it; it is not applied to its source weapon.','Эффект передаётся другому оружию. Для расчёта нужен второй оснащённый ствол; на оружие-источник этот бонус не накладывается.']};
 if(['Boomerang','Salvage','Steady Handed','Parkour!'].includes(name))return {kind:'cycle',label:['shot/reload cycle','цикл стрельбы'],note:['Ammunition returns and reload events require a shot-by-shot firing cycle. Their DPS contribution is not included yet.','Возврат патронов и события перезарядки требуют покадрового цикла стрельбы. Их вклад в DPS пока не включён.']};
 if(['Binary Trigger','Geri and Freki','Plague of the Outcasts','Regicide','Explosive Delivery','Fireworks Show','Toxic Delivery'].includes(name))return {kind:'separate',label:['separate damage','отдельный урон'],note:['This talent deals separate damage, explosions or damage over time. That damage is not part of the bullet DPS shown here.','Талант наносит отдельный урон, взрывы или периодический урон. Он пока не входит в показанный DPS пули.']};
 if(['Big Game Hunter','Electromagnetic Accelerator','Quick Draw','Shakedown','Resourceful','Slotted','Rebalance','Empathic Resolve','Counter','Pack Instincts','Chemical Agent','Ostracize','Over the top','Stand Your Ground','Vicious Cycle','Weakest Link','Bewildered'].includes(name))return {kind:'special',label:['special model','особая механика'],note:['This effect needs a dedicated weapon/equipment or shot model. Its bonus is not included automatically.','Для эффекта нужна отдельная модель оружия, экипировки или выстрела. Бонус пока не включён автоматически.']};
 if(name==='Autentico')return {kind:'built-in',label:['in base stats','в базовых статах'],note:['Already included in this weapon’s source base stats; not added a second time.','Уже включён в базовые характеристики оружия в источнике; повторно не добавляется.']};
 const nonBullet=['Ablative Nano-Plating','Actum Est','Adrenaline Rush','Ardent','Bleeding Edge','Bloodsucker','Caduceus','Calculated','Capitulate','Challenger','Clutch','Combat Medic','Combined Arms','Creeping Death','Disruptor Rounds','Doctor Home',"Eagle's Strike / Tenacity",'Efficient','Energize','Entrench','Future Perfect','Future Perfection','Galvanize','Hidden Rock','Hoarder','Kinetic Momentum','Leadership','Mad Bomber','Near Sighted','One in the Hand... / ...Two in the Bag','Outsider','Accurate','Distance','Perpetuation','Preservation','Primer Rounds','Protected Reload','Protector','Reassigned','Reformation','Refreshing','Rule Them All','Safeguard','Sandman','Shock and Awe','Skilled','Spike','Sport Mode','Stabilize','Symbiosis','Tag Team','Tamper Proof','Tech Support','The Trap','Trauma','Unbreakable','Vanguard','Alternating Current','Bob and Weave','Defibrillator',"Dragon's Glare",'Escape Plan','Flurry','Impervious','Iron Grip','Smoke Screen','Transference Overclock'];
 if(nonBullet.includes(name))return {kind:'non-bullet',label:['no direct bullet bonus','без бонуса пули'],note:['No direct bullet-damage bonus. Healing, defense, skills, status effects and handling outside reload are not simulated by this bullet calculator.','Прямого бонуса урону пули нет. Лечение, защита, навыки, негативные эффекты и обращение с оружием вне перезарядки не моделируются этим расчётом пули.']};
 return {kind:'unreviewed',label:['not modeled','не рассчитано'],note:['This mechanic is not modeled.','Эта механика пока не рассчитана.']};
}
