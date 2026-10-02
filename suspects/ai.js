// STARSHIP SUSPECTS — bot brains. Bots only know what they have actually seen: every 0.2 s each one records who it can see,
// where, and doing what. Suspicion, alibis, accusations and votes are all built from that memory (saboteurs also lie).
import * as M from './map.js';
import {C} from './sim.js';
const cl=(v,a,b)=>v<a?a:v>b?b:v,R=()=>M.rand(),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const DIFF=[
 {n:'EASY',mem:70,sloppy:.3,thr:.75,noise:.3,smart:0,vent:.5,sabRate:.45,self:0,loiter:.8,stealth:0},
 {n:'NORMAL',mem:150,sloppy:.06,thr:.52,noise:.12,smart:1,vent:.85,sabRate:1,self:.08,loiter:.85,stealth:3},
 {n:'HARD',mem:1e9,sloppy:0,thr:.5,noise:.06,smart:2,vent:1,sabRate:1.35,self:.2,loiter:.85,stealth:6}];

export function init(sim){for(const c of sim.crew)c.brain={seenBy:new Float32Array(10).fill(-99),st:'idle',path:[],gx:c.x,gz:c.z,wait:R()*2,tt:R()*.15,body:null,alarm:null,hunt:null,huntT:0,escape:null,ventPlan:null,fix:null,sabT:2+R()*3,seenBodies:new Set(),stuck:0};}

/* ---------- movement helpers ---------- */
function goTo(sim,c,x,z){const b=c.brain;b.gx=x;b.gz=z;const p=M.findPath(c.x,c.z,x,z);b.path=p||[];b.stuck=0;return !!p;}
export function repath(sim,c){const b=c.brain;if(b.gx!=null)goTo(sim,c,b.gx,b.gz);}
const arrived=(c,r=.35)=>!c.brain.path.length&&Math.hypot(c.brain.gx-c.x,c.brain.gz-c.z)<r;
function spotIn(room){const r=M.ROOMS[room].r;for(let i=0;i<30;i++){const x=r[0]+1+R()*(r[1]-r[0]-2),z=r[2]+1+R()*(r[3]-r[2]-2);if(M.walkable(x,z)&&M.walkable(x+.4,z)&&M.walkable(x-.4,z)&&M.walkable(x,z+.4)&&M.walkable(x,z-.4))return{x,z};}return{x:M.ROOMS[room].cx,z:M.ROOMS[room].cz};}
function nextTask(c,skipScan){let best=null,bd=1e9;for(const t of c.tasks){if(t.done||(skipScan&&t.st.type==='scan'))continue;const d=Math.hypot(t.st.x-c.x,t.st.z-c.z)*(.8+R()*.5);if(d<bd){bd=d;best=t;}}return best;}
function stationFree(sim,c,st){return !sim.crew.some(o=>o!==c&&o.alive&&o.busy&&o.busy.st===st);}

/* ---------- perception: sightings memory ---------- */
export function perceive(sim,dt){const pt=sim.pt;
 for(const o of sim.crew){if(!o.alive||o.vent)continue;
  // own trail (for alibis)
  const k=M.placeKey(o.x,o.z),tr=o.trail,last=tr[tr.length-1],task=o.busy&&(o.busy.kind==='task'||o.busy.kind==='fake')?o.busy.st.type:null;
  if(last&&last.k===k&&pt-last.t1<1)last.t1=pt;else tr.push({k,t0:pt,t1:pt,task:null});if(task)tr[tr.length-1].task=task;if(tr.length>80)tr.splice(0,20);
  for(const x of sim.crew){if(x===o||!sim.visibleChar(o,x))continue;
   const arr=o.mem.seen[x.id],e=arr[arr.length-1],kk=M.placeKey(x.x,x.z),tk=x.busy&&(x.busy.kind==='task'||x.busy.kind==='fake')?x.busy.st.type:null;
   if(e&&e.k===kk&&pt-e.t1<1.2){e.t1=pt;e.x=x.x;e.z=x.z;if(tk)e.task=tk;}else{arr.push({k:kk,t0:pt,t1:pt,task:tk,x:x.x,z:x.z});if(arr.length>50)arr.splice(0,10);}
   o.mem.with[x.id]+=dt;if(x.sab&&!o.sab)x.brain.seenBy[o.id]=pt;
   if(x.busy&&x.busy.visual&&x.busy.t>2&&!o.mem.clear.has(x.id)){o.mem.clear.add(x.id);o.mem.ev.push({type:'scan',who:x.id,k:kk,t:pt});}}
  for(const b of sim.bodies){if(b.reported||!sim.sees(o,b.x,b.z))continue;
   if(!o.brain.seenBodies.has(b.id)){o.brain.seenBodies.add(b.id);if(!o.sab)o.brain.body=b;}
   for(const x of sim.crew){if(x===o||!x.alive||x.vent||dist(x,b)>2.6||!sim.visibleChar(o,x))continue;const key=x.id+':'+b.id;if(!o.mem.saidNear.has(key)){o.mem.saidNear.add(key);o.mem.ev.push({type:'near',who:x.id,victim:b.victim,k:b.k,t:pt});}}}}}

// AI estimate of how many crew could witness a kill (uses a slightly short vision radius)
function witnesses(sim,k,v){let n=0;for(const o of sim.crew){if(!o.alive||o.sab||o===v||o===k||o.vent)continue;if(sim.sees(o,k.x,k.z,.88)||sim.sees(o,v.x,v.z,.88))n++;}return n;}
function watchers(sim,x,z){let n=0;for(const o of sim.crew){if(!o.alive||o.sab||o.vent)continue;if(sim.sees(o,x,z,.95))n++;}return n;}

/* ---------- sabotage responders ---------- */
export function assignFixers(sim){const S=sim.sab;if(!S.kind||S.kind==='doors')return;const ps=M.FIX[S.kind];
 for(const p of ps){if(S.done[p.id])continue;const cur=S.assign[p.id]!=null?sim.crew[S.assign[p.id]]:null;if(cur&&cur.alive)continue;
  const taken=new Set(Object.values(S.assign));
  // the human standing on a panel covers it
  const h=sim.player;if(h.alive&&!sim.o.autopilot&&Math.hypot(h.x-p.x,h.z-p.z)<2.5)continue;
  let best=null,bd=1e9;for(const c of sim.crew){if(!c.alive||c.vent||(c.human&&!sim.o.autopilot)||taken.has(c.id))continue;if(c.sab&&R()<.7)continue;const d=Math.hypot(c.x-p.x,c.z-p.z);if(d<bd){bd=d;best=c;}}
  if(best){S.assign[p.id]=best.id;best.brain.fix=p;best.busy=null;goTo(sim,best,p.x,p.z);}}}

/* ---------- think ---------- */
export function think(sim,c,dt){const b=c.brain;if(sim.phase!=='play')return;
 if(!c.alive)return ghostThink(sim,c,dt);
 if(c.vent)return ventThink(sim,c,dt);
 // sabotage duty overrides everything except reporting
 const S=sim.sab;if(b.fix&&(!S.kind||S.done[b.fix.id]||S.assign[b.fix.id]!==c.id))b.fix=null;
 if(c.busy){if(b.body&&!c.sab&&!b.body.reported){c.busy=null;}else{if(c.busy.kind==='hold')sim.hold(c,c.busy.st.id);return;}}
 if(c.sab)return sabThink(sim,c,dt);
 // 1. found a body -> report it
 if(b.body){if(b.body.reported){b.body=null;}else{if(dist(c,b.body)<C.reportR*.85&&M.los(c.x,c.z,b.body.x,b.body.z)){sim.report(c,b.body);return;}if(Math.hypot(b.gx-b.body.x,b.gz-b.body.z)>.5||!b.path.length)goTo(sim,c,b.body.x,b.body.z);return;}}
 // 2. saw a vent / kill with no body around -> emergency button
 if(b.alarm&&c.emergency>0){if(sim.canButton(c)){if(Math.hypot(c.x-M.BUTTON.x,c.z-M.BUTTON.z)<M.BUTTON.r-.3){sim.button(c);return;}if(Math.hypot(b.gx-M.BUTTON.x,b.gz-M.BUTTON.z)>2.5||!b.path.length)goTo(sim,c,M.BUTTON.x+(R()-.5),M.BUTTON.z+2.2);return;}}
 // 3. fix sabotage
 if(b.fix){const p=b.fix;if(dist(c,p)<.6){c.busy={st:p,kind:S.kind==='reactor'?'hold':'fix',t:0,dur:S.kind==='lights'?3:3.5};c.fx=p.dx||c.fx;c.fz=p.dz||c.fz;}else if(!b.path.length)goTo(sim,c,p.x,p.z);return;}
 // 4. keep away from someone I strongly suspect (hard)
 if(sim.diff.smart>=2&&b.st!=='flee'){for(const o of sim.crew){if(o===c||!o.alive||c.sus[o.id]<.9||dist(o,c)>4||!sim.visibleChar(c,o))continue;const others=sim.crew.some(x=>x!==c&&x!==o&&x.alive&&sim.visibleChar(c,x));if(!others){b.st='flee';const r=M.RI.caf;const s=spotIn(r);goTo(sim,c,s.x,s.z);b.wait=4;return;}}}
 routine(sim,c,dt,false);}

function routine(sim,c,dt,fake){const b=c.brain;
 if(b.st==='task'){const t=b.task;if(!t||t.done){b.st='idle';}else if(arrived(c,.45)){if(stationFree(sim,c,t.st)){c.busy={st:t.st,kind:fake?'fake':'task',t:0,dur:(M.TASK_TYPES[t.st.type].t)*(1.25+R()*.5),visual:!fake&&!!M.TASK_TYPES[t.st.type].visual};b.st='idle';b.justTask=true;}else{b.wait-=dt;if(b.wait<-4){b.st='idle';}}}else if(!b.path.length)goTo(sim,c,t.st.x,t.st.z);return;}
 if(b.st==='loiter'||b.st==='flee'){if(arrived(c,.6)||!b.path.length){b.wait-=dt;if(b.wait<=0)b.st='idle';}return;}
 if(b.st==='follow'){const o=b.follow;b.wait-=dt;if(!o||!o.alive||b.wait<=0){b.st='idle';return;}if(dist(c,o)>2.2&&(!b.path.length||Math.hypot(b.gx-o.x,b.gz-o.z)>2))goTo(sim,c,o.x,o.z);else if(dist(c,o)<1.6)b.path=[];return;}
 // idle: choose what next
 b.wait-=dt;if(b.wait>0)return;
 const t=nextTask(c,fake);const loiter=b.justTask&&R()<sim.diff.loiter;b.justTask=false;
 if(t&&!loiter){b.st='task';b.task=t;b.wait=0;goTo(sim,c,t.st.x,t.st.z);return;}
 if(fake&&!t){for(const x of c.tasks)x.done=false;}
 // loiter: wander to a room or tag along with someone
 const vis=sim.crew.filter(o=>o!==c&&o.alive&&sim.visibleChar(c,o));
 if(vis.length&&R()<.5){b.st='follow';b.follow=M.pick(vis);b.wait=5+R()*10;return;}
 const room=R()<.3?M.roomAt(c.x,c.z):(R()*M.ROOMS.length|0);const s=spotIn(room>=0?room:M.RI.caf);b.st='loiter';b.wait=4+R()*12;goTo(sim,c,s.x,s.z);}

function ghostThink(sim,c,dt){const b=c.brain;if(c.human&&!sim.o.autopilot)return;if(c.sab){if(!b.path.length){b.wait-=dt;if(b.wait<=0){const s=spotIn(R()*M.ROOMS.length|0);goTo(sim,c,s.x,s.z);b.wait=5+R()*8;}}return;}
 if(c.busy)return;const t=b.task&&!b.task.done?b.task:nextTask(c,false);if(!t){if(!b.path.length&&(b.wait-=dt)<=0){const s=spotIn(R()*M.ROOMS.length|0);goTo(sim,c,s.x,s.z);b.wait=6;}return;}
 b.task=t;if(dist(c,t.st)<.5){c.busy={st:t.st,kind:'task',t:0,dur:M.TASK_TYPES[t.st.type].t*1.2,visual:false};b.task=null;}else if(!b.path.length||Math.hypot(b.gx-t.st.x,b.gz-t.st.z)>.3)goTo(sim,c,t.st.x,t.st.z);}

function ventThink(sim,c,dt){const b=c.brain,p=b.ventPlan||(b.ventPlan={t:1+R()*1.5,moves:0});p.t-=dt;if(p.t>0)return;
 const opts=[c.vent,...M.ventLinks(c.vent)];const here=watchers(sim,c.vent.x,c.vent.z);
 if(here===0&&(p.moves>0||p.t<-3)){sim.ventExit(c);b.ventPlan=null;b.escape=null;b.st='idle';b.wait=0;b.justTask=false;return;}
 if(here===0&&R()<.3){sim.ventExit(c);b.ventPlan=null;b.escape=null;b.st='idle';return;}
 const alt=opts.filter(v=>v!==c.vent);if(alt.length&&p.moves<4){sim.ventTo(c,M.pick(alt));p.moves++;p.t=.8+R()*1.2;}else if(p.t<-6){sim.ventExit(c);b.ventPlan=null;b.st='idle';}}

function sabThink(sim,c,dt){const b=c.brain,D=sim.diff;
 // escaping after a kill
 if(b.escape){const e=b.escape;e.t-=dt;
  if(e.self){if(e.t<=0){const bd=sim.bodies.find(x=>x.id===e.self&&!x.reported);b.escape=null;if(bd){if(dist(c,bd)<C.reportR*.8)sim.report(c,bd);else{b.body=bd;}}}return;}
  if(e.vent){if(dist(c,e.vent)<.5){if(watchers(sim,c.x,c.z)===0||R()>D.vent){sim.ventEnter(c,e.vent);b.ventPlan=null;return;}b.escape=null;}else if(!b.path.length)goTo(sim,c,e.vent.x,e.vent.z);if(e.t<0)b.escape=null;return;}
  if(arrived(c,.6)||e.t<0)b.escape=null;return;}
 // self-reporting a body
 if(b.body&&!b.body.reported){if(dist(c,b.body)<C.reportR*.8&&M.los(c.x,c.z,b.body.x,b.body.z)){sim.report(c,b.body);return;}if(!b.path.length)goTo(sim,c,b.body.x,b.body.z);return;}
 if(b.body&&b.body.reported)b.body=null;
 // someone else's body nearby: walk away (or report it, on harder settings)
 for(const bd of sim.bodies){if(bd.reported||b.seenBodies.has('s'+bd.id)||!sim.sees(c,bd.x,bd.z))continue;b.seenBodies.add('s'+bd.id);if(bd.killer!==c.id&&R()<.25+.2*D.smart){b.body=bd;return;}}
 // sabotage
 if((b.sabT-=dt)<=0){b.sabT=3+R()*3;trySabotage(sim,c);}
 // kill
 if(c.killCd<=0&&!sim.o.attract){
  let tgt=null,td=C.killR;for(const o of sim.crew){if(!o.alive||o.sab||o.vent)continue;const d=dist(c,o);if(d<td&&M.los(c.x,c.z,o.x,o.z)){td=d;tgt=o;}}
  if(tgt){const w=witnesses(sim,c,tgt);let seen=false;if(D.stealth)for(const o of sim.crew){if(o!==tgt&&o.alive&&!o.sab&&sim.pt-b.seenBy[o.id]<D.stealth){seen=true;break;}}if((w===0&&!seen)||(w===1&&R()<D.sloppy*.5)){if(sim.kill(c,tgt)){afterKill(sim,c);return;}}}
  if(b.hunt){const h=b.hunt;b.huntT-=dt;if(!h.alive||b.huntT<=0||h.vent){b.hunt=null;}else{if(!b.path.length||Math.hypot(b.gx-h.x,b.gz-h.z)>1.2){goTo(sim,c,h.x,h.z);}return;}}
  else if(R()<.02+.025*D.sabRate){// now and then, go after an isolated crewmate
   let best=null,bs=-1e9;for(const o of sim.crew){if(!o.alive||o.sab||o.vent)continue;const d=dist(c,o);if(d>26)continue;const others=sim.crew.filter(x=>x!==o&&x.alive&&!x.sab&&!x.vent&&dist(x,o)<7&&M.los(x.x,x.z,o.x,o.z)).length;const s=-others*10-d*.3+(o.human?[-5,-3,0][D.smart]:0)+R()*3;if(s>bs){bs=s;best=o;}}
   if(best&&bs>-12){b.hunt=best;b.huntT=12+R()*8;b.st='hunt';goTo(sim,c,best.x,best.z);return;}}}
 if(b.st==='hunt'){b.st='idle';b.wait=0;}
 routine(sim,c,dt,true);}

function afterKill(sim,c){const b=c.brain,D=sim.diff;b.hunt=null;b.st='idle';
 if(R()<D.self){b.escape={self:c.lastKill.body.id,t:1.5+R()*2.5};b.path=[];return;}
 let v=null,vd=8;for(const x of M.VENTS){const d=Math.hypot(x.x-c.x,x.z-c.z);if(d<vd){vd=d;v=x;}}
 if(v&&R()<.85){b.escape={vent:v,t:6};goTo(sim,c,v.x,v.z);return;}
 // walk to a fake task in another room
 const far=c.tasks.filter(t=>M.roomAt(t.st.x,t.st.z)!==M.roomAt(c.x,c.z));const t=far.length?M.pick(far):null;const s=t?t.st:spotIn(R()*M.ROOMS.length|0);b.escape={t:14};goTo(sim,c,s.x,s.z);}

function trySabotage(sim,c){const S=sim.sab,D=sim.diff;if(sim.o.attract)return;
 // doors: trap the hunt target in its room
 if(c.brain.hunt&&D.smart&&R()<.25){const r=M.roomAt(c.brain.hunt.x,c.brain.hunt.z);if(r>=0&&M.roomAt(c.x,c.z)===r&&sim.canSabotage('doors',r)){sim.sabotage('doors',r,c);return;}}
 if(S.kind||S.cd>0)return;const prog=sim.taskDone/sim.taskTotal;
 if(c.brain.hunt&&c.killCd<4&&R()<.35*D.sabRate){sim.sabotage('lights',-1,c);return;}
 if(prog>.45&&R()<.12*D.sabRate){sim.sabotage(R()<.5?'reactor':'oxygen',-1,c);return;}
 if(R()<.05*D.sabRate)sim.sabotage(M.pick(['lights','reactor','oxygen']),-1,c);}

/* =================== MEETINGS =================== */
const N=(sim,i)=>sim.crew[i].name,P=k=>M.prettyPlace(k),TV=ty=>M.TASK_TYPES[ty]?M.TASK_TYPES[ty].v:'';
const ago=(sim,t)=>{const s=Math.max(3,Math.round((sim.meeting?sim.meeting.tPlay:sim.pt)-t));return s<8?'just before':s<60?`about ${Math.round(s/5)*5}s before`:'a while before';};
function alibi(sim,c,m){const t1=m.tPlay,t0=t1-45;let ent=c.trail.filter(e=>e.t1>=t0);
 const lie=c.sab&&c.lastKill&&c.lastKill.t>=t0-8;
 if(lie)ent=ent.filter(e=>!M.compatible(e.k,c.lastKill.k));
 const merged=[];for(const e of ent){const d=Math.max(0,Math.min(e.t1,t1)-Math.max(e.t0,t0));const l=merged[merged.length-1];if(l&&M.compatible(l.k,e.k)){l.d+=d;if(e.task)l.task=e.task;if(e.k<100)l.k=e.k;continue;}merged.push({k:e.k,d,task:e.task,s:Math.max(e.t0,t0)});}
 const places=[];for(const p of merged){if(p.d<2.5&&merged.length>1)continue;const l=places[places.length-1];if(l&&M.compatible(l.k,p.k)){l.d+=p.d;l.task=l.task||p.task;continue;}places.push(p);}
 let ps=places.slice(-3);
 if(!ps.length){const kr=c.lastKill?c.lastKill.k%100:M.nearestRoom(c.x,c.z);let alt=0,bd=1e9;M.ROOMS.forEach((r,i)=>{if(i===kr)return;const d=Math.hypot(r.cx-M.ROOMS[kr].cx,r.cz-M.ROOMS[kr].cz);if(d<bd){bd=d;alt=i;}});
  const ft=c.tasks.find(t=>M.roomAt(t.st.x,t.st.z)===alt);ps=[{k:alt,d:20,task:ft?ft.st.type:null,s:t1-25}];}
 return{kind:'alibi',places:ps.map(p=>p.k),tasks:ps.map(p=>p.task||null),t0:ps[0].s!=null?ps[0].s+1:t1-20,t1,lie};}
function alibiText(sim,st,lead='I was in'){const pl=st.places.map((k,i)=>P(k)+(st.tasks&&st.tasks[i]?' '+TV(st.tasks[i]):''));return lead+' '+pl.join(', then ')+'.';}

// evidence a crew character holds against everyone, from its own memory
function evidence(sim,c,m){const out=[...Array(10)].map(()=>({s:0,r:'',w:0}));const add=(i,s,r)=>{const e=out[i];e.s+=s;if(Math.abs(s)>e.w){e.w=Math.abs(s);e.r=r;}};
 const tR=m.tPlay,body=m.body;
 for(const e of c.mem.ev){if(e.who===c.id)continue;
  if(e.type==='kill')add(e.who,2.4,`I watched them kill ${N(sim,e.victim)}`);
  else if(e.type==='vent')add(e.who,2.2,`I saw them use a vent in ${P(e.k)}`);
  else if(e.type==='near'&&body&&e.victim===body.victim)add(e.who,.8,`they were standing over the body`);
  else if(e.type==='scan')add(e.who,-1.3,`they scanned in front of me`);}
 if(body){const v=body.victim,vs=c.mem.seen[v],lv=vs[vs.length-1];
  if(lv&&tR-lv.t1<90){// who was with the victim when I last saw them
   for(let i=0;i<10;i++){if(i===c.id||i===v)continue;const s=c.mem.seen[i];for(let j=s.length-1;j>=0&&j>s.length-4;j--){const e=s[j];if(e.k===lv.k&&e.t1>=lv.t1-4&&e.t0<=lv.t1+2){add(i,.25,`they were the last one I saw with ${N(sim,v)}`);break;}}}}
  for(let i=0;i<10;i++){if(i===c.id||i===v)continue;const s=c.mem.seen[i];for(let j=s.length-1;j>=0;j--){const e=s[j];const age=tR-e.t1;if(age>70)break;if(M.compatible(e.k,body.k)){add(i,.22*(1-age/80),`they were in ${P(body.k)} right before`);break;}}}}
 // spent the run-up together with me, away from the body
 for(let i=0;i<10;i++){if(i===c.id)continue;const s=c.mem.seen[i];let tog=0;for(const e of s)tog+=Math.max(0,Math.min(e.t1,tR)-Math.max(e.t0,tR-35));if(tog>22&&(!body||!s.some(e=>M.compatible(e.k,body.k)&&e.t1>tR-40)))add(i,-.45,`they were with me the whole time`);}
 if(m.caller!==c.id&&m.kind==='report')add(m.caller,.06,'they reported it');
 return out;}

const publicSus=(sim,i)=>{let s=0,n=0;for(const c of sim.crew){if(!c.alive||c.sab||c.id===i)continue;s+=c.sus[i];n++;}return n?s/n:0;};

export function meetingOpen(sim,m){const D=sim.diff;m.talk=0;m.lines=0;m.ev=[];m.dup=new Map();m.contested=new Set();
 // forget old sightings (easy bots have short memories)
 for(const c of sim.crew){const lim=m.tPlay-D.mem;for(const s of c.mem.seen){while(s.length&&s[0].t1<lim)s.shift();}c.mem.ev=c.mem.ev.filter(e=>e.t>=lim||e.type==='scan');}
 for(const c of sim.crew){if(!c.alive)continue;const E=evidence(sim,c,m);c.why=E;for(let i=0;i<10;i++){c.sus[i]=c.sus[i]*.6+E[i].s+(R()-.5)*D.noise;if(c.mem.clear.has(i))c.sus[i]=Math.min(c.sus[i],-.8);}c.sus[c.id]=-9;
  for(const o of sim.crew)if(!o.alive)c.sus[o.id]=-9;}
 const q=[];const add=(who,st,pri,delay=0)=>q.push({who,st,pri:pri+R()*.8,delay});
 for(const c of sim.crew){if(!c.alive||(c.human&&!sim.o.autopilot))continue;const lines=[];
  if(c.id===m.caller){if(m.kind==='report')add(c.id,{kind:'report',victim:m.victim,k:m.body.k},0);else{const a=c.mem.ev.filter(e=>e.type==='vent'||e.type==='kill').pop();add(c.id,a?{kind:a.type,target:a.who,victim:a.victim,k:a.k,t:a.t}:{kind:'call'},0);}}
  if(c.sab){sabLines(sim,c,m,add);continue;}
  for(const e of c.mem.ev){if(e.type==='kill'||e.type==='vent'){if(c.id===m.caller&&e===c.mem.ev.filter(x=>x.type==='vent'||x.type==='kill').pop())continue;add(c.id,{kind:e.type,target:e.who,victim:e.victim,k:e.k,t:e.t},1);}
   else if(e.type==='near'&&m.body&&e.victim===m.body.victim)add(c.id,{kind:'near',target:e.who,k:e.k},2);}
  add(c.id,alibi(sim,c,m),3);
  // relevant sightings
  const seen=[];if(m.body){for(let i=0;i<10;i++){if(i===c.id)continue;const s=c.mem.seen[i];const e=[...s].reverse().find(e=>m.tPlay-e.t1<60&&M.compatible(e.k,m.body.k));if(e)seen.push({i,e});}}
  else{for(let i=0;i<10;i++){if(i===c.id||c.sus[i]<.3)continue;const s=c.mem.seen[i];if(s.length)seen.push({i,e:s[s.length-1]});}}
  seen.sort((a,b)=>b.e.t1-a.e.t1).slice(0,1+(R()<.4)).forEach(({i,e})=>add(c.id,{kind:i===m.victim?'lastseen':'saw',target:i,k:e.k,t:e.t1,task:e.task},4));
  for(const i of c.mem.clear)if(sim.crew[i].alive&&R()<.5)add(c.id,{kind:'clear',target:i,why:'scan'},4.5);
  const tg=topSus(sim,c);if(tg&&c.sus[tg.id]>=D.thr*.9)add(c.id,{kind:'accuse',target:tg.id,conf:cl(c.sus[tg.id]/1.6,.3,1),why:c.why[tg.id].r},5);
  else if(R()<.4)add(c.id,{kind:'skip'},7);}
 q.sort((a,b)=>a.pri-b.pri);let t=.8;for(const x of q){x.at=t;t+=1.3+R()*1.4;}m.queue=q;}
function topSus(sim,c){let best=null,bs=-1e9;for(const o of sim.crew){if(o===c||!o.alive)continue;if(c.sus[o.id]>bs){bs=c.sus[o.id];best=o;}}return best;}
function sabLines(sim,c,m,add){const D=sim.diff;const mates=sim.crew.filter(o=>o.sab&&o!==c);
 add(c.id,alibi(sim,c,m),3);
 // misdirect: a true sighting of a crewmate near the body (can't be refuted); hard saboteurs will also invent one
 let x=null,e=null;if(m.body){for(const o of sim.crew){if(!o.alive||o.sab)continue;const s=c.mem.seen[o.id];const f=[...s].reverse().find(q=>m.tPlay-q.t1<70&&(M.compatible(q.k,m.body.k)||Math.hypot(q.x-m.body.x,q.z-m.body.z)<9));if(f&&(!e||f.t1>e.t1)){x=o;e=f;}}}
 if(x&&R()<.5+.2*D.smart){add(c.id,{kind:'saw',target:x.id,k:e.k,t:e.t1,task:e.task},4);if(D.smart>=1&&R()<.35*D.smart)add(c.id,{kind:'accuse',target:x.id,conf:.5,why:`they were around ${P(e.k)} right before`},5);}
 else if(m.body&&D.smart>=2&&R()<.3){const cand=(m.body.near||[]).map(i=>sim.crew[i]).filter(o=>o.alive&&!o.sab);if(cand[0])add(c.id,{kind:'saw',target:cand[0].id,k:m.body.k,t:m.body.t-4,fake:true},4);}
 else if(R()<.5)add(c.id,{kind:'skip'},7);}

const TEXT={
 report:(s,st)=>M.pick([`${N(s,st.victim)} is dead in ${P(st.k)}. I just found the body.`,`Body in ${P(st.k)}! It's ${N(s,st.victim)}.`,`I found ${N(s,st.victim)} in ${P(st.k)}. Who was there?`]),
 call:()=>M.pick(['Emergency meeting. Quick check-in: where is everyone?','I called it. Something feels off, let\'s compare notes.']),
 kill:(s,st)=>`${N(s,st.target)} KILLED ${N(s,st.victim)} in ${P(st.k)}! I watched it happen!`,
 vent:(s,st)=>M.pick([`I SAW ${N(s,st.target)} VENT in ${P(st.k)}!`,`${N(s,st.target)} came out of a vent in ${P(st.k)}. I saw it.`]),
 near:(s,st)=>`${N(s,st.target)} was standing right over the body.`,
 alibi:(s,st)=>alibiText(s,st),
 defend:(s,st)=>M.pick(['It wasn\'t me!','Not me.','Wrong person.'])+' '+alibiText(s,st),
 saw:(s,st)=>M.pick([`I saw ${N(s,st.target)} in ${P(st.k)} ${ago(s,st.t)}.`,`${N(s,st.target)} was in ${P(st.k)} ${ago(s,st.t)}.`])+(st.task&&!st.fake?` Looked like ${TV(st.task).replace('my ','their ')}.`:''),
 lastseen:(s,st)=>`Last time I saw ${N(s,st.target)} was in ${P(st.k)}.`,
 clear:(s,st)=>st.why==='scan'?`${N(s,st.target)} is clear. I watched them scan.`:`${N(s,st.target)} is safe in my book.`,
 accuse:(s,st)=>M.pick([`I'm voting ${N(s,st.target)}`,`It's ${N(s,st.target)}`,`${N(s,st.target)} is sus`])+(st.why?` — ${st.why}.`:'.'),
 agree:(s,st)=>M.pick([`Agreed, ${N(s,st.target)} has been acting weird.`,`Yeah, I'm with that. ${N(s,st.target)}.`,`${N(s,st.target)}? That lines up with what I saw.`]),
 doubt:(s,st)=>`I don't buy it. ${N(s,st.target)} was with me.`,
 contradict:(s,st)=>`That's a lie. I saw ${N(s,st.target)} in ${P(st.k)}.`,
 refute:(s,st)=>`No way. ${N(s,st.about)} was in ${P(st.k)} at that point. ${N(s,st.target)} is making that up.`,
 confirm:(s,st)=>`I can vouch: ${N(s,st.target)} was in ${P(st.k)}.`,
 deny:(s,st)=>`What? I was never in ${P(st.k)}. ${N(s,st.target)} is lying.`,
 skip:()=>M.pick(['Not enough info. I\'m skipping.','No idea yet. Skip for now.','I didn\'t see anything. Skipping.']),
 where:()=>'Where was everyone?',
 chat:(s,st)=>st.text,
};
export function text(sim,st){return st.text||(TEXT[st.kind]?TEXT[st.kind](sim,st):'...');}

export function post(sim,m,c,st){if(!st.text&&m.chat.some(l=>l.who===c.id&&l.kind===st.kind&&l.target===(st.target??null)&&st.kind!=='chat'))return null;if((st.kind==='clear'||st.kind==='confirm')&&st.target!=null){const k=st.kind+st.target;const n=m.dup.get(k)||0;if(n>=(st.kind==='clear'?1:2)&&!(c.human&&!sim.o.autopilot))return null;m.dup.set(k,n+1);}const line={who:c.id,kind:st.kind,target:st.target??null,conf:st.conf??null,text:text(sim,st),t:m.talk};m.chat.push(line);m.lines++;m.said.set(c.id,(m.said.get(c.id)||0)+1);
 if(['accuse','contradict','near','saw','kill','vent','refute'].includes(st.kind)&&st.target!=null)m.contested.add(st.target);
 if(st.kind==='accuse'){if(!m.accusers.has(st.target))m.accusers.set(st.target,new Set());m.accusers.get(st.target).add(c.id);}
 sim.ev({type:'chat',who:c.id});hear(sim,m,c,st);return line;}
function react(sim,m,c,st,delay=1+R()*1.6){const key=c.id+':'+st.kind+':'+(st.target??'');if(m.reacted.has(key)||(m.said.get(c.id)||0)>5||m.queue.length>14||m.lines>40)return;m.reacted.add(key);if(c.human&&!sim.o.autopilot)return;m.queue.push({who:c.id,st,at:m.talk+delay,pri:0});m.queue.sort((a,b)=>a.at-b.at);}

// everyone updates their beliefs from a statement
function hear(sim,m,S,st){const D=sim.diff,tg=st.target!=null?sim.crew[st.target]:null;
 for(const L of sim.crew){if(L===S||!L.alive)continue;const bot=!(L.human&&!sim.o.autopilot);
  if(L.sab){// saboteurs defend themselves and (on hard) cover their partner
   if(tg===L&&['accuse','kill','vent','near','contradict'].includes(st.kind)){react(sim,m,L,{...alibi(sim,L,m),kind:'defend'});if(D.smart>=2&&!S.sab&&R()<.5)react(sim,m,L,{kind:'accuse',target:S.id,conf:.5,why:'they\'re pinning it on me to save themselves'},2.4);}
   else if(tg&&tg.sab&&tg!==L&&st.kind==='accuse'&&D.smart>=2&&R()<.35)react(sim,m,L,{kind:'doubt',target:tg.id});
   else if(tg&&!tg.sab&&st.kind==='accuse'&&publicSus(sim,tg.id)>.4&&R()<.4)react(sim,m,L,{kind:'agree',target:tg.id});
   continue;}
  const trust=cl(.6-L.sus[S.id]*.45,.05,1),me=tg===L;
  switch(st.kind){
   case'kill':case'vent':if(me){L.sus[S.id]=3;react(sim,m,L,{kind:'deny',target:S.id,k:st.k});}else if(tg)L.sus[tg.id]+=1.5*trust;break;
   case'near':if(me){L.sus[S.id]+=.6;react(sim,m,L,{...alibi(sim,L,m),kind:'defend'});}else if(tg)L.sus[tg.id]+=.6*trust;break;
   case'saw':case'lastseen':{if(!tg)break;if(me){const was=L.trail.some(e=>M.compatible(e.k,st.k)&&e.t0<=st.t+6&&e.t1>=st.t-6);if(!was&&st.t>m.tPlay-120){L.sus[S.id]+=.8;react(sim,m,L,{kind:'deny',target:S.id,k:st.k});}break;}
    const mine=st.kind==='saw'?L.mem.seen[tg.id].find(e=>e.t0<=st.t-1.5&&e.t1>=st.t+1.5):null;if(mine&&!M.compatible(mine.k,st.k)){L.sus[S.id]+=.55;react(sim,m,L,{kind:'refute',target:S.id,about:tg.id,k:mine.k});}
    else if(m.body&&M.compatible(st.k,m.body.k)&&m.tPlay-st.t<60)L.sus[tg.id]+=(st.kind==='lastseen'?.15:.28)*trust;break;}
   case'alibi':case'defend':{const v=verify(L,S,st);if(v.bad){L.sus[S.id]+=.6;react(sim,m,L,{kind:'contradict',target:S.id,k:v.bad.k});}else if(v.good){L.sus[S.id]-=.22;if(R()<(m.contested.has(S.id)?.5:.1))react(sim,m,L,{kind:'confirm',target:S.id,k:v.good.k});}
    if(m.body&&st.places&&st.places.some(k=>M.compatible(k,m.body.k)))L.sus[S.id]+=.12;break;}
   case'accuse':{if(!tg)break;if(me){L.sus[S.id]+=.4*(st.conf||.5);react(sim,m,L,{...alibi(sim,L,m),kind:'defend'});break;}
    L.sus[tg.id]+=.22*(st.conf||.5)*trust;const tog=L.mem.with[tg.id];if((L.mem.clear.has(tg.id)||L.why&&L.why[tg.id].s<-.3)){L.sus[S.id]+=.2;if(R()<.6)react(sim,m,L,{kind:'doubt',target:tg.id});}else if(L.sus[tg.id]>D.thr&&R()<.45&&bot)react(sim,m,L,{kind:'agree',target:tg.id});break;}
   case'refute':if(tg){if(me)break;L.sus[tg.id]+=.45*trust;}break;
   case'contradict':if(tg){if(me){L.sus[S.id]+=.5;react(sim,m,L,{...alibi(sim,L,m),kind:'defend'});}else L.sus[tg.id]+=.5*trust;}break;
   case'confirm':if(tg&&!me)L.sus[tg.id]-=.25*trust;break;
   case'clear':if(tg&&!me)L.sus[tg.id]-=.6*trust;break;
   case'doubt':if(tg&&!me)L.sus[tg.id]-=.2*trust;break;
   case'deny':if(tg){if(me)L.sus[S.id]+=.3;else{L.sus[S.id]+=.15;L.sus[tg.id]+=.25*trust;}}break;
   case'where':if(bot&&!(m.said.get(L.id)>0))react(sim,m,L,alibi(sim,L,m));break;}
  L.sus[S.id]=cl(L.sus[S.id],-2,3.5);if(tg&&tg!==L)L.sus[tg.id]=cl(L.sus[tg.id],-2,3.5);}}
// does a claim match what the listener saw?
function verify(L,S,st){const res={bad:null,good:null};if(!st.places)return res;for(const e of L.mem.seen[S.id]){const ov=Math.min(e.t1+1,st.t1)-Math.max(e.t0-1,st.t0);if(st.places.some(k=>M.compatible(k,e.k))){if(ov>=2.5)res.good=e;}else if(ov>=4.5)res.bad=e;}if(res.bad)res.good=null;return res;}

export function botVote(sim,c){const D=sim.diff;
 if(c.sab){let best=null,bs=-1e9;for(const o of sim.crew){if(!o.alive||o.sab)continue;const p=publicSus(sim,o.id);if(p>bs){bs=p;best=o;}}
  const mate=sim.crew.find(o=>o.sab&&o!==c&&o.alive);if(mate&&D.smart>=2&&publicSus(sim,mate.id)>1.2&&R()<.6)return mate.id;
  return best&&bs>.28?best.id:-1;}
 let best=null,bs=-1e9,sec=-1e9;for(const o of sim.crew){if(o===c||!o.alive)continue;const s=c.sus[o.id]+(R()-.5)*D.noise;if(s>bs){sec=bs;bs=s;best=o;}else if(s>sec)sec=s;}
 if(best&&bs>=D.thr&&bs-sec>.08)return best.id;
 // follow the room: someone accused by several people that I also find shady
 const m=sim.meeting;if(m&&D.smart){let ft=null,fn=1;for(const[t,set]of m.accusers){const o=sim.crew[t];if(!o.alive||o===c||set.has(c.id))continue;const n=[...set].filter(a=>a!==t&&c.sus[a]<.6).length;if(n>fn&&c.sus[t]>D.thr*.45){fn=n;ft=t;}}if(ft!=null)return ft;}
 return -1;}

export function meetingStep(sim,m,dt){m.t+=dt;const o=sim.o;
 if(m.stage==='intro'){if(m.t>=C.intro){m.stage='discuss';m.t=0;sim.ev({type:'stage',stage:'discuss'});}return;}
 if(m.stage==='discuss'||m.stage==='vote'){m.talk+=dt;
  while(m.queue.length&&m.queue[0].at<=m.talk){const x=m.queue.shift();const c=sim.crew[x.who];if(c.alive)post(sim,m,c,x.st);}
  if(m.stage==='discuss'&&m.t>=o.discuss){m.stage='vote';m.t=0;for(const c of sim.crew){c.brain.voteAt=c.alive?2+R()*Math.max(2,Math.min(16,o.vote-6))+(sim.diff.smart>=2&&!c.sab?2:0):1e9;}sim.ev({type:'stage',stage:'vote'});}
  else if(m.stage==='vote'){for(const c of sim.crew){if(!c.alive||m.votes.has(c.id)||(c.human&&!o.autopilot))continue;if(m.t>=c.brain.voteAt)sim.castVote(c,botVote(sim,c));}
   const live=sim.crew.filter(c=>c.alive);if(live.every(c=>m.votes.has(c.id))||m.t>=o.vote){for(const c of live)if(!m.votes.has(c.id))m.votes.set(c.id,-1);sim.tally();m.stage='reveal';m.t=0;sim.ev({type:'stage',stage:'reveal'});}}
  return;}
 if(m.stage==='reveal'){if(m.t>=C.reveal){m.stage='eject';m.t=0;sim.ev({type:'stage',stage:'eject',ejected:m.ejected});}return;}
 if(m.stage==='eject'){if(m.t>=(m.ejected!=null?C.eject:3.2))sim.resolveMeeting();}}

export function afterEject(sim,m,e){if(!sim.o.confirm)return;
 // with confirmed ejections, crew learn who pushed an innocent (or who was right)
 const acc=m.accusers.get(e.id)||new Set();for(const L of sim.crew){if(!L.alive||L.sab)continue;for(const a of acc){if(a===L.id)continue;L.sus[a]+=e.sab?-.4:.35;}}}

/* ---------- the human's meeting options ---------- */
export function quickLines(sim){const c=sim.player,m=sim.meeting;if(!m||!c.alive)return[];const out=[];
 const al=alibi(sim,c,m);if(c.sab)al.lie=false;out.push({label:'MY ALIBI',st:al});
 for(const e of c.mem.ev){if(e.type==='kill'||e.type==='vent')out.push({label:e.type==='vent'?`SAW ${N(sim,e.who)} VENT`:`SAW ${N(sim,e.who)} KILL`,st:{kind:e.type,target:e.who,victim:e.victim,k:e.k,t:e.t}});}
 const seen=[];for(let i=1;i<10;i++){const s=c.mem.seen[i];if(!s.length)continue;const e=s[s.length-1];if(m.tPlay-e.t1<90)seen.push({i,e});}
 seen.sort((a,b)=>b.e.t1-a.e.t1).slice(0,4).forEach(({i,e})=>out.push({label:`SAW ${N(sim,i)} · ${P(e.k).toUpperCase()}`,st:{kind:sim.crew[i].alive?'saw':'lastseen',target:i,k:e.k,t:e.t1,task:e.task}}));
 out.push({label:'WHERE WAS EVERYONE?',st:{kind:'where'}});return out;}
export function targetLines(sim,t){return[{label:'SUS',st:{kind:'accuse',target:t,conf:.7,why:''}},{label:'SAFE',st:{kind:'clear',target:t}}];}
export function claimRoom(sim,room){const m=sim.meeting;return{kind:'alibi',places:[room],tasks:[null],t0:m.tPlay-45,t1:m.tPlay};}
// free text: look for names, rooms and intent words
export function parseText(sim,txt){const s=txt.toLowerCase(),c=sim.player;let target=null;
 for(const o of sim.crew){if(o===c)continue;const n=o.name.toLowerCase();if(new RegExp('\\b'+n+'\\b').test(s)){target=o.id;break;}}
 let room=-1;M.ROOMS.forEach((r,i)=>{const w=r.n.toLowerCase().split(' ')[0];if(s.includes(w)||(r.id==='caf'&&/\bcaf\b/.test(s))||(r.id==='ele'&&/\belec\b/.test(s))||(r.id==='nav'&&/\bnav\b/.test(s)))room=i;});
 const st={text:txt.slice(0,140)};
 if(target!=null&&/vent/.test(s))return{...st,kind:'vent',target,k:room>=0?room:M.placeKey(c.x,c.z),t:sim.meeting.tPlay-10};
 if(target!=null&&/\b(kill|killed|murder|stab)/.test(s))return{...st,kind:'kill',target,victim:sim.meeting.victim??target,k:room>=0?room:M.placeKey(c.x,c.z),t:sim.meeting.tPlay-10};
 if(target!=null&&/\b(safe|clear|innocent|trust|vouch|with me)\b/.test(s))return{...st,kind:'clear',target};
 if(target!=null&&/\b(sus|vote|voting|saboteur|impostor|imposter|traitor|liar|lying|it'?s|did it|kill)\b/.test(s))return{...st,kind:'accuse',target,conf:.6,why:''};
 if(target!=null&&room>=0&&/\b(saw|seen|was in|near)\b/.test(s))return{...st,kind:'saw',target,k:room,t:sim.meeting.tPlay-15};
 if(room>=0&&/\b(i was|i'm in|im in|i am|was in|doing)\b/.test(s))return{...st,kind:'alibi',places:[room],tasks:[null],t0:sim.meeting.tPlay-45,t1:sim.meeting.tPlay};
 if(/\bskip\b/.test(s))return{...st,kind:'skip'};
 if(/\bwhere\b/.test(s))return{...st,kind:'where'};
 return{...st,kind:'chat'};}
