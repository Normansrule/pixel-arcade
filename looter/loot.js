// STARWARDEN — loot: elements, rarities, weapon archetypes, perks, exotics, item generation, derived stats and the
// persistent vault (localStorage keys prefixed looter_). Power rises as better drops are equipped.
export const EL={kin:{n:'KINETIC',c:'#e9e4d8',hex:0xe9e4d8,tr:[2.4,2.2,1.9]},solar:{n:'SOLAR',c:'#ff8a2a',hex:0xff8a2a,tr:[3.4,1.3,.25]},arc:{n:'ARC',c:'#5fd8ff',hex:0x5fd8ff,tr:[.5,1.8,3.6]},void:{n:'VOID',c:'#b46bff',hex:0xb46bff,tr:[2,.6,3.6]}};
export const ELS=['solar','arc','void'];
export const RAR=[{n:'COMMON',c:'#c9cdd4',k:1,pw:[-5,0]},{n:'RARE',c:'#4f9dff',k:2,pw:[-2,3]},{n:'LEGENDARY',c:'#b45cff',k:3,pw:[1,5]},{n:'EXOTIC',c:'#ffcf3f',k:2,pw:[3,7]}];
export const SLOT={kin:{n:'KINETIC',ix:0},en:{n:'ENERGY',ix:1},pow:{n:'POWER',ix:2}};
export const SLOTS=['kin','en','pow'];
// dmg at power parity; rate = s between shots (bursts: between bursts); fall=[start,end,min]
export const ARCH={
 auto:{n:'AUTO RIFLE',slots:['kin','en'],dmg:15,rate:.095,mag:36,res:360,reload:1.9,spr:.012,sprMax:.045,sprAdd:.004,crit:1.6,range:90,fall:[24,60,.6],auto:1,zoom:1.4,kick:.4,snd:'auto'},
 pulse:{n:'PULSE RIFLE',slots:['kin','en'],dmg:18,rate:.36,burst:3,gap:.068,mag:30,res:300,reload:2,spr:.004,sprMax:.016,sprAdd:.002,crit:1.75,range:110,fall:[34,80,.62],zoom:1.7,kick:.5,snd:'pulse'},
 scout:{n:'SCOUT RIFLE',slots:['kin','en'],dmg:40,rate:.22,mag:16,res:160,reload:2.1,spr:.0015,sprMax:.01,sprAdd:.003,crit:1.9,range:160,fall:[60,120,.75],zoom:2.4,kick:.6,snd:'scout'},
 hand:{n:'HAND CANNON',slots:['kin','en'],dmg:58,rate:.32,mag:11,res:120,reload:2.2,spr:.003,sprMax:.02,sprAdd:.009,crit:2,range:90,fall:[28,55,.55],zoom:1.5,kick:1.1,snd:'hand'},
 smg:{n:'SUBMACHINE GUN',slots:['kin','en'],dmg:10.5,rate:.058,mag:42,res:420,reload:1.6,spr:.02,sprMax:.06,sprAdd:.004,crit:1.5,range:55,fall:[14,32,.5],auto:1,zoom:1.2,kick:.35,snd:'smg'},
 shot:{n:'SHOTGUN',slots:['pow'],dmg:24,pel:12,rate:.75,mag:5,res:20,reload:2.4,spr:.07,crit:1.4,range:30,fall:[7,18,.15],zoom:1.15,kick:1.6,snd:'shot'},
 snipe:{n:'SNIPER RIFLE',slots:['pow'],dmg:290,rate:1.05,mag:4,res:16,reload:2.6,spr:0,crit:2.6,range:300,zoom:4.2,scope:1,pierce:1,kick:2.2,snd:'snipe'},
 fusion:{n:'FUSION RIFLE',slots:['pow'],dmg:52,pel:7,charge:.6,rate:.75,mag:5,res:20,reload:2.4,spr:.028,crit:1.4,range:45,fall:[15,32,.4],zoom:1.3,kick:1.7,snd:'fusion'},
 rocket:{n:'ROCKET LAUNCHER',slots:['pow'],dmg:520,proj:1,speed:46,splash:5.5,rate:.9,mag:1,res:6,reload:2.6,crit:1,range:200,zoom:1.4,kick:2.4,snd:'rocket'}};
export const PRIM=['auto','pulse','scout','hand','smg'],HEAVY=['shot','snipe','fusion','rocket'];
export const PERKS={
 xmag:{n:'EXTENDED MAG',d:'Magazine holds 40% more rounds.'},
 explo:{n:'EXPLOSIVE ROUNDS',d:'Hits burst for 30% bonus splash damage.',no:['rocket']},
 rampage:{n:'RAMPAGE',d:'Kills grant +15% damage, stacking 3×, for 4.5 s.'},
 kswitch:{n:'KILLSWITCH',d:'Reload after a kill: +35% damage for 5 s.'},
 quick:{n:'QUICKHANDS',d:'Precision kills make reloads 50% faster for 6 s.'},
 focus:{n:'PRECISION FOCUS',d:'Precision damage +25%.',no:['rocket']},
 overflow:{n:'OVERFLOW',d:'Kills refill 30% of the magazine from reserves.',no:['rocket']},
 starburst:{n:'STARBURST',d:'Precision kills detonate the target.',no:['rocket']},
 drain:{n:'SOULDRAIN',d:'Kills restore 35 shield and health.'},
 breaker:{n:'SHIELDBREAKER',d:'+60% damage to elemental shields.'},
 steady:{n:'STEADY BARREL',d:'35% tighter spread, 15% more range.',no:['rocket']},
 spark:{n:'CHAIN SPARK',d:'Every 6th hit arcs lightning to two foes.',no:['rocket']}};
export const PERK_IDS=Object.keys(PERKS);
export const EXO={
 sunspire:{n:'SUNSPIRE',a:'hand',s:'en',el:'solar',ip:'SOLAR FLARE',d:'Every third hit in a row erupts in solar flame.'},
 galeheart:{n:'GALEHEART',a:'auto',s:'en',el:'arc',ip:'STORMCHAIN',d:'Hits chain lightning to nearby foes.'},
 halcyon:{n:'HALCYON',a:'pulse',s:'kin',el:'kin',ip:'PERFECT CYCLE',d:'Kills refill the magazine. The last round deals triple damage.'},
 whisper:{n:'NIGHTWHISPER',a:'snipe',s:'pow',el:'void',ip:'ECHO SHOT',d:'Precision hits return the round and deal double precision damage.'},
 cataclysm:{n:'CATACLYSM',a:'rocket',s:'pow',el:'solar',ip:'CLUSTER',d:'Rockets split into burning bomblets. Reloads itself after kills.'},
 riftmaw:{n:'RIFTMAW',a:'shot',s:'pow',el:'void',ip:'VOID HUNGER',d:'Kills release orbs of power and mend your shields.'}};
const A1=['ASHEN','SILENT','VESPER','IRON','HOLLOW','DAWN','STARLESS','GILDED','WANING','ETERNAL','SOVEREIGN','LAST','PALE','BRIGHT','FERAL','QUIET','CINDER','ARGENT','LUNAR','ROGUE','SHATTERED','HALLOWED','RADIANT','DUSKBORN'];
const A2=['OATH','CHORUS','REQUIEM','VIGIL','HYMN','TEMPEST','VERDICT','PROMISE','LANTERN','ECLIPSE','MERIDIAN','REVERIE','EPITAPH','LEGACY','WARDEN','HERALD','ANTHEM','COMET','BASTION','SPARROW','ORACLE','RELIQUARY','GAMBIT','HORIZON'];
const MAKER=['HALVARD','OSKA','TREVIN','MERRICK','SOLANE','VARGA','DELMAR','KESTREN'];
const R=Math.random,pick=a=>a[R()*a.length|0],ri=(a,b)=>a+Math.floor(R()*(b-a+1));
let UID=Date.now()%100000;

export function makeItem(o={}){const r=o.r??0;let a=o.a,s=o.s,el=o.el,x=null,n;
 if(r===3){const id=o.x||pick(Object.keys(EXO));const e=EXO[id];x=id;a=e.a;s=e.s;el=e.el;n=e.n;}
 else{s=s||pick(SLOTS);a=a||(s==='pow'?pick(HEAVY):pick(PRIM));if(!ARCH[a].slots.includes(s))s=ARCH[a].slots[0];el=s==='kin'?'kin':(el&&el!=='kin'?el:pick(ELS));
  n=r===0?pick(MAKER)+'-'+ri(2,9)+' '+ARCH[a].n.split(' ')[0]:r===1?pick(A1)+' '+pick(A2):(R()<.4?'THE ':'')+pick(A1)+' '+pick(A2)+(R()<.25?' II':'');}
 const nk=RAR[r].k;const pool=PERK_IDS.filter(k=>!(PERKS[k].no||[]).includes(a));const k=[];while(k.length<nk&&pool.length){const i=R()*pool.length|0;k.push(pool.splice(i,1)[0]);}
 const base=o.p??100;const p=o.fix?base:Math.max(1,Math.round(base+ri(RAR[r].pw[0],RAR[r].pw[1])));
 return{u:++UID+'_'+(R()*1e4|0),a,s,el,r,p,k,n,x,nw:1};}

// derived combat stats for an item
export function wstats(it){const A=ARCH[it.a],has=k=>it.k.includes(k);const s={...A};
 if(has('xmag'))s.mag=Math.round(A.mag*1.4)||A.mag+1;if(has('steady')){s.spr=A.spr*.65;s.sprMax=(A.sprMax||0)*.65;s.range=A.range*1.15;if(A.fall)s.fall=[A.fall[0]*1.15,A.fall[1]*1.15,A.fall[2]];}
 if(has('focus'))s.crit=A.crit*1.25;if(it.x==='whisper')s.crit=A.crit*1.5;
 // rarity: a little more base damage per tier
 s.dmg=A.dmg*(1+it.r*.04);s.res=A.res;return s;}

export function itemLine(it){return`${RAR[it.r].n} ${ARCH[it.a].n}`;}
export function powerOf(eq){if(!eq||eq.some(x=>!x))return 0;return Math.floor((eq[0].p+eq[1].p+eq[2].p)/3);}

/* ---------------- save ---------------- */
const KEY='looter_save';
export function freshSave(){const st=[makeItem({r:0,s:'kin',a:'auto',p:100,fix:1}),makeItem({r:0,s:'en',a:'pulse',el:'arc',p:100,fix:1}),makeItem({r:0,s:'pow',a:'rocket',el:'solar',p:100,fix:1})];st.forEach(i=>i.nw=0);
 return{v:1,inv:st,eq:st.map(i=>i.u),cls:'strider',shards:0,runs:0,clears:0,best:0,hi:100,seen:{}};}
export function loadSave(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===1&&Array.isArray(s.inv)&&s.inv.length){s.inv=s.inv.filter(i=>ARCH[i.a]);return s;}}catch(e){}return freshSave();}
export function storeSave(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
export const byU=(s,u)=>s.inv.find(i=>i.u===u);
export function equipped(s){const eq=s.eq.map(u=>byU(s,u));for(let i=0;i<3;i++)if(!eq[i]){eq[i]=s.inv.find(x=>x.s===SLOTS[i]);if(eq[i])s.eq[i]=eq[i].u;}return eq;}
export const VAULT_MAX=60;
// a drop near the player's current power (the loot treadmill)
export function rollDrop(s,o={}){const pw=Math.max(powerOf(equipped(s)),(s.hi||100)-6);const roll=R();const diff=o.diff||0;const luck=o.luck||0;
 let r=roll<.02+luck*.05+diff*.015?3:roll<.32+luck*.3+diff*.08?2:roll<.72?1:0;if(o.min!==undefined)r=Math.max(r,o.min);if(o.r!==undefined)r=o.r;
 // never two copies of the same exotic in a row
 const it=makeItem({r,p:pw+(o.bonus||0)+diff});return it;}
export function addToVault(s,it){s.inv.push(it);s.hi=Math.max(s.hi||100,it.p);
 // vault full: auto-dismantle the weakest unlocked, unequipped commons first
 while(s.inv.length>VAULT_MAX){const c=s.inv.filter(i=>!s.eq.includes(i.u)&&!i.lock).sort((a,b)=>a.r-b.r||a.p-b.p)[0];if(!c)break;s.inv.splice(s.inv.indexOf(c),1);s.shards+=1+c.r*2;}}
export function dismantle(s,u){const it=byU(s,u);if(!it||s.eq.includes(u)||it.lock)return 0;s.inv.splice(s.inv.indexOf(it),1);const g=[2,5,12,30][it.r];s.shards+=g;return g;}
export function infuseCost(s,it){const top=Math.max(...s.inv.filter(i=>i.s===it.s).map(i=>i.p));return top>it.p?{to:top,cost:Math.max(5,Math.round((top-it.p)*2+it.r*4))}:null;}
export function infuse(s,u){const it=byU(s,u);if(!it)return false;const c=infuseCost(s,it);if(!c||s.shards<c.cost)return false;s.shards-=c.cost;it.p=c.to;return true;}
