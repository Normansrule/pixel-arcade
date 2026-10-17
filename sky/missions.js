// SKY LANCERS — campaign missions + free-for-all dogfight. Each mission: init(G) spawns the scenario, tick(G,dt) returns 'win' | 'lose' | null, clockEnd(G) decides a timeout.
import * as THREE from '../vendor/three.module.min.js';
import {ISLANDS,findFlat,height} from './world.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a,rs=(a=1)=>(Math.random()*2-1)*a;
const isl=n=>ISLANDS.find(i=>i.name===n);
export const CARRIER_START=new V(2600,0,3800),CARRIER_DIR=new V(-.2,0,-1).normalize(),CARRIER_SPEED=7;
// the harbour town on HAVEN's east coast
export const PORT=new V(-1150,0,3550);
const alive=l=>l.filter(p=>p.alive&&!p.doomed);
const dirTo=(a,b)=>new V(b.x-a.x,0,b.z-a.z).normalize();
function ring(c,r,i,n,y){const a=i/n*Math.PI*2+rnd(.3);return new V(c.x+Math.cos(a)*r,y,c.z+Math.sin(a)*r);}
function wave(G,n,type,from,toward,alt,o={}){const out=[];const d=dirTo(from,toward),side=new V(-d.z,0,d.x);for(let i=0;i<n;i++){const p=from.clone().addScaledVector(side,(i-(n-1)/2)*160).addScaledVector(d,-Math.abs(i-(n-1)/2)*120);p.y=alt+rs(120);
 out.push(G.spawnPlane(type,1,p,d,o.speed||220,{skill:o.skill??G.skillFor(0),role:o.role,pref:o.pref,leash:o.leash,livery:o.livery}));}return out;}

export const MISSIONS=[
 {id:'m1',name:'FIRST LIGHT',tag:'PATROL',tod:'morning',plane:'wren',lives:3,stars:[1600,2300],
  brief:'Raiders slipped past the picket at dawn. Take the patrol north of the carrier and splash every one of them.',obj:'Shoot down the raiders',
  init(G){G.startAt(new V(1800,1400,1200),new V(-.3,0,-1));this.w=wave(G,3,'wren',new V(1200,0,-2600),new V(1800,0,1200),1500,{skill:0,speed:170});this.w2=null;this.t=0;G.allies(1,'wren');},
  tick(G,dt){this.t+=dt;if(!this.w2&&(alive(this.w).length<=1||this.t>50)){this.w2=wave(G,2,'wren',new V(-2500,0,-4200),G.player.p,1800,{skill:1,speed:170});G.banner('BANDITS','SECOND FLIGHT INBOUND FROM THE NORTH-WEST');}
   const all=this.w.concat(this.w2||[]),left=alive(all).length+(this.w2?0:2);G.setObj(`Shoot down the raiders · ${5-left}/5`);return this.w2&&left===0?'win':null;},
  clockEnd(){return 'lose';}},
 {id:'m2',name:'STORMWALL',tag:'INTERCEPT',tod:'storm',plane:'wren',lives:3,stars:[2600,3600],clouds:{count:90,base:1300,dark:.55},
  brief:'A bomber stream is pushing through the storm front toward Port Haven. Stop them before they reach the harbour — no more than one may get through.',obj:'Intercept the bombers',
  init(G){G.startAt(new V(-800,2300,800),new V(.05,0,-1));this.bomb=[];this.reached=0;this.hit=new Set();
   for(let f=0;f<2;f++){const lead=G.spawnPlane('bomber',1,new V(-900+f*1500,2500+f*150,-7200-f*900),new V(-.03,0,1),125,{role:'bomber',route:[{x:PORT.x+f*200,y:2400,z:PORT.z},{x:PORT.x-6000,y:2600,z:PORT.z+5000}]});this.bomb.push(lead);
    for(const s of[-1,1])this.bomb.push(G.spawnPlane('bomber',1,lead.p.clone().add(new V(s*70,-30,90)),new V(0,0,1),125,{role:'bomber',leader:lead,slot:new V(s*70,-30,90)}));}
   this.esc=wave(G,4,'stiletto',new V(-300,0,-7600),PORT,2900,{skill:G.diffSkill(0),speed:200,pref:o=>o.human?400:0});G.allies(2,'wren');},
  tick(G,dt){for(const b of alive(this.bomb)){const d=Math.hypot(b.p.x-PORT.x,b.p.z-PORT.z);if(d<520&&!this.hit.has(b)){this.hit.add(b);this.reached++;G.townHit(PORT,b);G.feed('BOMBER OVER PORT HAVEN','bad');}}
   const left=alive(this.bomb).filter(b=>!this.hit.has(b)).length;G.setObj(`Destroy the bombers · ${6-left-this.reached}/6 down · ${this.reached} reached port`,this.reached?'bad':'');
   if(this.reached>=2)return 'lose';return left===0?'win':null;},clockEnd(){return 'lose';}},
 {id:'m3',name:'IRON TIDE',tag:'DEFEND THE CARRIER',tod:'sunset',plane:'wren',lives:3,stars:[2800,4000],carrierHP:100,
  brief:'Strike groups are coming for the carrier at sunset. Keep her afloat: break up every attack wave, or hold until the clock runs out.',obj:'Defend the carrier',
  init(G){G.startAt(G.carrier.p.clone().add(new V(0,900,-1500)),new V(0,0,-1));this.waves=0;this.cur=[];this.t=0;this.total=0;this.kill=0;G.allies(2,'wren');this.spawnWave(G);},
  spawnWave(G){this.waves++;const a=this.waves*2.1+rnd(1),from=new V(G.carrier.p.x+Math.cos(a)*8000,0,G.carrier.p.z+Math.sin(a)*8000);const tp=G.carrier.target;
   const st=this.waves===3?'anvil':'wren';const strikers=wave(G,4,st,from,tp.p,this.waves===2?600:1200,{role:'striker',skill:G.diffSkill(-1),speed:170});
   strikers.forEach((p,i)=>p.ai.strike={target:tp,mode:i%2?'dive':'level',alt:this.waves===2?450:1100,salvo:p.bombs});
   const fighters=this.waves>1?wave(G,2,this.waves===3?'stiletto':'wren',from.clone().add(new V(600,0,600)),tp.p,1800,{skill:G.diffSkill(0),speed:200}):[];
   this.cur=strikers.concat(fighters);this.total+=strikers.length;this.str=strikers;G.banner(`WAVE ${this.waves} / 3`,'STRIKE GROUP INBOUND · PROTECT THE CARRIER');this.t=0;},
  tick(G,dt){this.t+=dt;if(G.carrier.hp<=0)return 'lose';const left=alive(this.str).length;if(this.waves<3&&(left===0||this.t>80))this.spawnWave(G);
   G.setObj(`Defend the carrier · hull ${Math.ceil(G.carrier.hp)}% · wave ${this.waves}/3 · ${left} strikers inbound`,G.carrier.hp<40?'bad':'');
   return this.waves>=3&&alive(this.str).length===0?'win':null;},clockEnd(G){return G.carrier.hp>0?'win':'lose';}},
 {id:'m4',name:'HAMMERFALL',tag:'GROUND STRIKE',tod:'day',plane:'stiletto',lives:3,stars:[3000,4200],
  brief:'Fang Island hosts the enemy\'s air-defence net. Flatten the AA, SAM sites, radar and fuel depots. Expect flak and a fighter screen — and a destroyer offshore.',obj:'Destroy the Fang Island base',
  init(G){const F=isl('FANG');G.startAt(new V(F.x-6500,1500,F.z+5200),dirTo(new V(F.x-6500,0,F.z+5200),F));const R=G.rng;this.tg=[];
   const kinds=['aa','aa','aa','sam','sam','radar','fuel','fuel','hangar'];kinds.forEach((k,i)=>{const p=findFlat(F.x+Math.cos(i*.7)*700,F.z+Math.sin(i*.7)*600,900,R,6,260,.2);this.tg.push(G.addSite(k,p,{team:1}));});
   this.dd=G.addShip(new V(F.x-2600,0,F.z+2200),new V(1,0,.2),4,{team:1});this.cap=wave(G,2,'stiletto',new V(F.x,0,F.z),new V(F.x-6500,0,F.z+5200),1700,{skill:G.diffSkill(0),speed:220,leash:{p:new V(F.x,1500,F.z),r:4500}});this.c2=null;this.t=0;G.allies(2,'stiletto');},
  tick(G,dt){this.t+=dt;if(!this.c2&&this.t>60){this.c2=wave(G,2,'wren',new V(G.player.p.x+3000,0,G.player.p.z-4000),G.player.p,1600,{skill:G.diffSkill(0)});G.banner('INTERCEPTORS','TWO MORE FIGHTERS SCRAMBLED');}
   const left=this.tg.filter(t=>!t.dead).length;G.setObj(`Destroy base targets · ${this.tg.length-left}/${this.tg.length}${this.dd.dead?' · destroyer sunk':''}`);return left===0?'win':null;},clockEnd(){return 'lose';}},
 {id:'m5',name:'SHEPHERD',tag:'ESCORT',tod:'morning',plane:'stiletto',lives:3,stars:[2600,3800],
  brief:'Three transports carrying the relief convoy are inbound to Port Haven. Interceptors are hunting them. At least two must land.',obj:'Escort the transports',
  init(G){const st=new V(8200,1600,-4800);G.startAt(st.clone().add(new V(-300,350,700)),dirTo(st,PORT));const d=dirTo(st,PORT);const route=[{x:PORT.x+300,y:900,z:PORT.z-600},{x:PORT.x-2600,y:500,z:PORT.z+1800}];
   const lead=G.spawnPlane('transport',0,st,d,118,{role:'transport',route,name:'CONVOY 1',livery:'grey'});this.tr=[lead];
   for(const s of[-1,1])this.tr.push(G.spawnPlane('transport',0,st.clone().add(new V(s*90,-25,120)),d,118,{role:'transport',leader:lead,slot:new V(s*90,-25,120),name:'CONVOY '+(this.tr.length+1),livery:'grey'}));
   this.arr=new Set();this.t=0;this.w=0;this.next=8;G.allies(1,'wren');},
  tick(G,dt){this.t+=dt;if(this.t>this.next&&this.w<5){this.w++;this.next=this.t+30;const lead=alive(this.tr)[0]||this.tr[0];const a=rnd(6.28),from=new V(lead.p.x+Math.cos(a)*5000,0,lead.p.z+Math.sin(a)*5000);
    const tr=this.tr;wave(G,this.w>2?3:2,this.w>3?'stiletto':'wren',from,lead.p,1700,{skill:G.diffSkill(this.w>3?0:-1),pref:o=>tr.includes(o)?900:0});G.banner('BANDITS','INTERCEPTORS ON THE CONVOY');}
   for(const t of alive(this.tr))if(Math.hypot(t.p.x-PORT.x,t.p.z-PORT.z)<900&&!this.arr.has(t)){this.arr.add(t);G.feed(t.name+' IS SAFE','good');t.safe=true;}
   const lost=this.tr.filter(t=>!t.alive||t.doomed).length;G.setObj(`Escort the transports · ${this.arr.size} safe · ${lost} lost · ${Math.round(Math.hypot(this.tr[0].p.x-PORT.x,this.tr[0].p.z-PORT.z)/100)/10} km to go`,lost?'bad':'');
   if(lost>=2)return 'lose';if(this.arr.size>=2&&this.arr.size+lost>=3)return 'win';return null;},clockEnd(){return 'lose';}},
 {id:'m6',name:'LONE WOLF',tag:'ACE DUEL',tod:'dusk',plane:'stiletto',lives:1,stars:[1800,2600],
  brief:'Their top ace, call-sign MAGPIE, has challenged you to a duel over Ember Peak. One airframe. No wingmen. Fight smart: keep your energy up.',obj:'Shoot down MAGPIE',
  init(G){const E=isl('EMBER PEAK');const c=new V(E.x+3500,0,E.z+3500);G.startAt(c.clone().add(new V(2500,1800,2500)),dirTo(new V(2500,0,2500),new V(0,0,0)));
   const pt=G.player.type;this.ace=G.spawnPlane(pt==='wren'?'wren':'stiletto',1,c.clone().add(new V(-2500,2000,-2500)),dirTo(new V(-2500,0,-2500),new V(0,0,0)),230,{skill:2,name:'MAGPIE',livery:'ace',hpMul:1.7,ace:true});this.ace.flares+=20;},
  tick(G){G.setObj(`Shoot down MAGPIE · ace hull ${Math.max(0,Math.round(this.ace.hp/this.ace.s.hp/1.7*100))}%`);return !this.ace.alive||this.ace.doomed?'win':null;},clockEnd(){return 'lose';}},
 {id:'m7',name:'THUNDERHEAD',tag:'FORTRESS',tod:'sunset',plane:'anvil',lives:3,stars:[4200,6000],
  brief:'The enemy\'s flying fortress is crossing the strait to bombard Port Haven. Kill four of its six engines to bring it down — through its gunners and its escorts.',obj:'Bring down the fortress',
  init(G){const st=new V(2400,3200,-8600);G.startAt(new V(-500,2200,1200),dirTo(new V(-500,0,1200),st));
   this.f=G.spawnPlane('fortress',1,st,dirTo(st,PORT),85,{role:'fortress',route:[{x:PORT.x+600,y:3000,z:PORT.z-1200},{x:PORT.x-1200,y:3000,z:PORT.z+600},{x:PORT.x+1200,y:3000,z:PORT.z+1400}],loop:false,name:'THUNDERHEAD'});
   this.f.ai.route.push(...[0,1,2,3].map(i=>({x:PORT.x+Math.cos(i*1.57)*1600,y:3000,z:PORT.z+Math.sin(i*1.57)*1600})));this.f.ai.loop=true;
   this.t=0;this.w=0;this.next=4;this.townT=0;this.town=100;G.allies(2,'stiletto');},
  tick(G,dt){this.t+=dt;if(this.t>this.next&&this.w<4){this.w++;this.next=this.t+38;wave(G,this.w>2?3:2,this.w%2?'stiletto':'wren',this.f.p.clone().add(new V(rs(800),0,rs(800))),G.player.p,this.f.p.y-400,{skill:G.diffSkill(0),leash:{p:this.f.p,r:5000}});if(this.w>1)G.banner('ESCORTS','FORTRESS FIGHTER SCREEN LAUNCHED');}
   const eng=Object.keys(this.f.parts).filter(k=>k.startsWith('eng')&&this.f.lost[k]).length;const dPort=Math.hypot(this.f.p.x-PORT.x,this.f.p.z-PORT.z);
   if(dPort<2400&&this.f.alive&&!this.f.doomed){this.townT+=dt;if(this.townT>5){this.townT=0;this.town-=12;G.townHit(PORT,this.f);}}
   G.setObj(`Destroy fortress engines · ${eng}/4${this.town<100?` · Port Haven ${Math.max(0,this.town)}%`:` · ${(dPort/1000).toFixed(1)} km from Port Haven`}`,this.town<100?'bad':'');
   if(this.town<=0)return 'lose';return !this.f.alive||this.f.doomed?'win':null;},clockEnd(){return 'lose';}}];

// free-for-all dogfight
export const DOGFIGHT={id:'ffa',name:'DOGFIGHT',tag:'FREE-FOR-ALL',tod:'day',lives:0,stars:[800,1600],ffa:true,
 brief:'Every pilot for themselves over the archipelago. Most kills when the clock runs out wins.',obj:'Most kills wins',
 init(G){const c=new V(1200,0,600),n=G.opts.cpus;const types=['wren','stiletto','anvil'];G.startAt(ring(c,2600,0,n+1,1600),dirTo(ring(c,2600,0,n+1,0),c));
  for(let i=0;i<n;i++){const p=ring(c,2600,i+1,n+1,1400+rnd(800));G.spawnPlane(types[(i+(G.rng()*3|0))%3],-1,p,dirTo(p,c),210,{skill:G.opts.diff,ffa:i});}},
 tick(G){const me=G.player,b=G.board();const lead=b[0];G.setObj(`Most kills wins · you ${me.kills} · leader ${lead.name} ${lead.kills}`);return null;},
 clockEnd(G){const b=G.board();return b[0].human?'win':'lose';}};
