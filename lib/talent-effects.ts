/** Explicit, reviewed PvE rules. Values are read from the shared English descriptions.
 * Unlisted mechanics stay manual; never guess an effect from an arbitrary percentage.
 */
export type TalentSource={name:string;description:string};
export type TalentControl={id:string;en:string;ru:string;max:number;step?:number};
export type TalentEffect={bonuses:Record<string,number>;amps:number[];noReload?:boolean};
export type TalentContext={weaponType:string;magazine:number;armored:boolean};
export type TalentRule={passive?:boolean;controls:TalentControl[];apply:(values:Record<string,number>,context:TalentContext)=>TalentEffect};
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
 return stacked(keys[name],p[0],stackMax());
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
 if(name==='Opportunistic'&&p.length)return {controls:[],apply:(_,c)=>effect({},['shotgun','marksman-rifle'].includes(c.weaponType)?[p[0]]:[])};
 if(name==='Versatile'&&p.length>=3)return {controls:[],apply:(_,c)=>effect({},[['shotgun','smg'].includes(c.weaponType)?p[0]:['rifle','marksman-rifle'].includes(c.weaponType)?p[1]:['lmg','assault-rifle'].includes(c.weaponType)?p[2]:0])};
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
