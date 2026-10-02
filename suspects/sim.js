// STARSHIP SUSPECTS — game simulation (no rendering): crew, movement, tasks, kills, vents, bodies, sabotage, meetings, win rules.
import * as M from './map.js';
import * as AI from './ai.js';
const cl=(v,a,b)=>v<a?a:v>b?b:v,R=()=>M.rand();

export const CREW=[
 {n:'ARLO',css:'#e8433a'},{n:'BEX',css:'#3f6fe8'},{n:'CYRA',css:'#2fbf5c'},{n:'DAX',css:'#f2c53d'},{n:'ESME',css:'#f2862e'},
 {n:'FINN',css:'#9257ec'},{n:'GUS',css:'#36d3df'},{n:'HOLLY',css:'#f27ab9'},{n:'IVO',css:'#e8ecf2'},{n:'JUNO',css:'#9bdc3e'}];
export const C={speed:3.5,ghost:4.6,killR:1.8,reportR:3.4,useR:1.35,vis:7.4,visDark:2.7,visSab:8.4,coneNear:.52,coneCos:Math.cos(66*Math.PI/180),
 killCd:38,killCd0:24,killCdMeet:26,sabCd:28,critT:45,doorT:10,doorCd:24,meetCd:14,discuss:30,vote:30,intro:3.2,reveal:4.5,eject:7};
export const WIN={tasks:'ALL TASKS COMPLETE',eject:'ALL SABOTEURS EJECTED',parity:'THE SABOTEURS OUTNUMBER THE CREW',reactor:'REACTOR MELTDOWN',oxygen:'OXYGEN DEPLETED',clock:'TIME RAN OUT'};

export class Sim{
 constructor(o={}){
  this.o=Object.assign({role:'crew',sabs:1,diff:1,clock:720,confirm:true,discuss:C.discuss,vote:C.vote,autopilot:false,color:0,seed:null,tasks:8,attract:false},Object.fromEntries(Object.entries(o).filter(([,v])=>v!==undefined&&v!==null)));
  M.seed(this.o.seed);for(const d of M.DOORS)d.closed=0;
  this.t=0;this.pt=0;this.clock=this.o.clock;this.phase='play';this.events=[];this.bodies=[];this.meeting=null;this.winner=null;this.reason='';this.lastMeet=0;this.nextBody=0;
  this.sab={kind:null,t:0,done:{},hold:{},holdT:0,cd:30,assign:{},doorCd:new Float32Array(M.ROOMS.length)};this.percT=0;this.assignT=0;this.input={x:0,z:0};this.meetings=0;this.ejections=[];
  this.diff=AI.DIFF[this.o.diff];this.killCdMax=this.o.killCd||([44,38,32][this.o.diff]||C.killCd)*(this.o.sabs>1?1.3:.85);
  // roster: the human takes the chosen colour, bots get the rest in random order
  const cols=M.shuffle([...Array(10).keys()].filter(i=>i!==this.o.color));cols.unshift(this.o.color);
  this.crew=cols.map((ci,i)=>({id:i,ci,name:CREW[ci].n,css:CREW[ci].css,human:i===0,sab:false,alive:true,x:0,z:0,fx:0,fz:1,vx:0,vz:0,tasks:[],emergency:1,killCd:C.killCd0,vent:null,busy:null,
   mem:{seen:[...Array(10)].map(()=>[]),ev:[],with:new Float32Array(10),clear:new Set(),saidNear:new Set()},sus:new Float32Array(10),trail:[],brain:{},stats:{tasks:0,kills:0,right:0,reports:0,sabotages:0,meetings:0},deathT:-1,ejected:false,lastKill:null}));
  const ids=M.shuffle([...Array(9).keys()].map(i=>i+1));const ns=cl(this.o.sabs,1,2);
  const sabs=this.o.role==='sab'?[0,...ids.slice(0,ns-1)]:ids.slice(0,ns);for(const i of sabs){this.crew[i].sab=true;this.crew[i].killCd=C.killCd0+(this.crew[i].human?0:M.rand()*10-3);}
  for(const c of this.crew){const types=M.shuffle(Object.keys(M.TASK_TYPES)).slice(0,c.human?this.o.tasks:Math.min(this.o.tasks,this.o.botTasks??(ns>1?6:7)));c.tasks=types.map(ty=>({st:M.pick(M.STATIONS.filter(s=>s.type===ty)),done:false}));}
  this.taskTotal=this.crew.filter(c=>!c.sab).reduce((a,c)=>a+c.tasks.length,0);this.taskDone=0;
  this.spawnAll();AI.init(this);}
 get player(){return this.crew[0];}
 spawnAll(){const live=this.crew;live.forEach((c,i)=>{const a=i/live.length*Math.PI*2+.3;c.x=M.BUTTON.x+Math.cos(a)*3.1;c.z=M.BUTTON.z+Math.sin(a)*3.1;M.collide(c);c.fx=Math.cos(a);c.fz=Math.sin(a);c.vx=c.vz=0;c.busy=null;c.vent=null;c.brain.path=[];});}
 ev(e){e.t=this.t;this.events.push(e);if(this.events.length>200)this.events.splice(0,100);}
 visR(c){if(!c.alive)return 99;if(c.sab)return C.visSab;return this.sab.kind==='lights'?C.visDark:C.vis;}
 // can character c see point (x,z)? The human (when not on autopilot) has a forward cone plus a short all-round radius.
 sees(c,x,z,scale=1){const r=this.visR(c)*scale,dx=x-c.x,dz=z-c.z,d2=dx*dx+dz*dz;if(d2>r*r)return false;
  if(c.human&&!this.o.autopilot&&c.alive){const near=r*C.coneNear;if(d2>near*near){const d=Math.sqrt(d2);if((dx*c.fx+dz*c.fz)/d<C.coneCos)return false;}}
  return M.los(c.x,c.z,x,z);}
 visibleChar(c,o){return o.alive&&!o.vent&&this.sees(c,o.x,o.z);}

 /* ---------- main step ---------- */
 step(dt){if(this.phase==='over')return;this.t+=dt;
  if(this.phase==='meeting'){if(!this.o.attract)this.clock=Math.max(0,this.clock-dt);AI.meetingStep(this,this.meeting,dt);return;}
  this.pt+=dt;if(!this.o.attract)this.clock-=dt;
  const S=this.sab;S.cd-=dt;S.doorCd.forEach((v,i)=>S.doorCd[i]=Math.max(0,v-dt));
  for(const d of M.DOORS)if(d.closed>0)d.closed=Math.max(0,d.closed-dt);
  if(S.kind==='reactor'||S.kind==='oxygen'){S.t-=dt;if(S.t<=0){S.t=0;return this.end('sab',S.kind);}}
  for(const c of this.crew)if(c.sab&&c.alive&&!c.vent&&c.killCd>0)c.killCd-=dt;
  // bots think (staggered)
  for(const c of this.crew){if(c.human&&!this.o.autopilot)continue;const b=c.brain;b.tt-=dt;if(b.tt<=0){b.tt=.12+R()*.06;AI.think(this,c,.15);}}
  // busy timers (bots; the human's tasks run in minigames)
  for(const c of this.crew){const B=c.busy;if(!B||(c.human&&!this.o.autopilot&&B.kind!=='fake'))continue;B.t+=dt;if(B.kind!=='hold'&&B.t>=B.dur){c.busy=null;
   if(B.kind==='task')this.completeTask(c,B.st.id);else if(B.kind==='fake'){const tk=c.tasks.find(t=>t.st===B.st);if(tk)tk.done=true;if(c.human)this.ev({type:'fakeDone',who:c.id});}else if(B.kind==='fix')this.fixPanel(c,B.st.id);}}
  // movement
  for(const c of this.crew)this.move(c,dt);
  this.separate();
  // reactor: both panels held at once
  if(S.kind==='reactor'){const ps=M.FIX.reactor;const held=ps.every(p=>S.hold[p.id]>0);for(const p of ps)S.hold[p.id]=Math.max(0,(S.hold[p.id]||0)-dt);
   if(held){S.holdT+=dt;if(S.holdT>.6)this.clearSab(true);}else S.holdT=Math.max(0,S.holdT-dt*2);}
  if((this.assignT-=dt)<=0){this.assignT=.8;AI.assignFixers(this);}
  if((this.percT-=dt)<=0){this.percT=.2;AI.perceive(this,.2);}
  this.check();if(this.phase==='play'&&this.clock<=0&&!this.o.attract){this.clock=0;this.end('sab','clock');}}
 move(c,dt){if(c.vent)return;const human=c.human&&!this.o.autopilot;let wx=0,wz=0;
  if(c.busy){c.vx*=.6;c.vz*=.6;if(c.busy.st&&(c.busy.st.dx||c.busy.st.dz)){c.fx+=(c.busy.st.dx-c.fx)*.2;c.fz+=(c.busy.st.dz-c.fz)*.2;}return;}
  const sp=c.alive?C.speed:C.ghost;
  if(human){wx=this.input.x;wz=this.input.z;const l=Math.hypot(wx,wz);if(l>1){wx/=l;wz/=l;}wx*=sp;wz*=sp;}
  else{const b=c.brain,p=b.path;while(p&&p.length){const q=p[0],dx=q.x-c.x,dz=q.z-c.z,d=Math.hypot(dx,dz);if(d<.18&&p.length>1){p.shift();continue;}if(d<.06){p.shift();break;}const s=Math.min(sp,d/dt);wx=dx/d*s;wz=dz/d*s;break;}}
  const k=1-Math.exp(-dt*(human?14:10));c.vx+=(wx-c.vx)*k;c.vz+=(wz-c.vz)*k;
  const ox=c.x,oz=c.z;c.x+=c.vx*dt;c.z+=c.vz*dt;
  if(!c.alive&&c.human){c.x=cl(c.x,-2,M.MW+2);c.z=cl(c.z,-2,M.MH+2);}else M.collide(c);
  const sp2=c.vx*c.vx+c.vz*c.vz;if(human&&this.input.fx!=null){const kf=1-Math.exp(-dt*16);c.fx+=(this.input.fx-c.fx)*kf;c.fz+=(this.input.fz-c.fz)*kf;const fl=Math.hypot(c.fx,c.fz)||1;c.fx/=fl;c.fz/=fl;}else if(sp2>.3){const l=Math.sqrt(sp2);const kf=1-Math.exp(-dt*12);c.fx+=(c.vx/l-c.fx)*kf;c.fz+=(c.vz/l-c.fz)*kf;const fl=Math.hypot(c.fx,c.fz)||1;c.fx/=fl;c.fz/=fl;}
  if(!human){const b=c.brain;const moved=Math.hypot(c.x-ox,c.z-oz);if(b.path&&b.path.length&&moved<dt*.4){b.stuck=(b.stuck||0)+dt;if(b.stuck>1){b.stuck=0;AI.repath(this,c);}}else b.stuck=0;}}
 separate(){const L=this.crew;for(let i=0;i<L.length;i++){const a=L[i];if(!a.alive||a.vent)continue;for(let j=i+1;j<L.length;j++){const b=L[j];if(!b.alive||b.vent)continue;const dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;if(d2<.36&&d2>1e-6){const d=Math.sqrt(d2),p=(.6-d)*.25;const ax=a.busy?0:1,bx=b.busy?0:1;a.x-=dx/d*p*ax;a.z-=dz/d*p*ax;b.x+=dx/d*p*bx;b.z+=dz/d*p*bx;M.collide(a);M.collide(b);}}}}

 /* ---------- tasks ---------- */
 completeTask(c,stId){const tk=c.tasks.find(t=>t.st.id===stId&&!t.done);if(!tk)return false;tk.done=true;if(c.sab)return true;this.taskDone++;c.stats.tasks++;this.ev({type:'task',who:c.id,st:stId});
  if(this.o.attract&&this.taskDone>=this.taskTotal-2){for(const x of this.crew)x.tasks.forEach(t=>t.done=false);this.taskDone=0;}return true;}
 // nearest thing the human can interact with
 actions(c=this.player){const out={use:null,report:null,kill:null,vent:null,button:false,fix:null};if(this.phase!=='play')return out;
  if(c.vent){out.vent=c.vent;return out;}
  const d=(x,z)=>Math.hypot(x-c.x,z-c.z);
  if(!c.busy){for(const t of c.tasks){if(t.done)continue;if(d(t.st.x,t.st.z)<C.useR&&!(c.sab&&!c.alive)){out.use={kind:c.sab?'fake':'task',st:t.st};break;}}}
  if(c.alive&&this.sab.kind&&this.sab.kind!=='doors'){for(const p of M.FIX[this.sab.kind]||[])if(!this.sab.done[p.id]&&d(p.x,p.z)<C.useR){out.fix=p;break;}}
  if(c.alive&&d(M.BUTTON.x,M.BUTTON.z)<M.BUTTON.r&&this.canButton(c))out.button=true;
  if(c.alive){let bd=C.reportR;for(const b of this.bodies)if(!b.reported){const dd=d(b.x,b.z);if(dd<bd&&M.los(c.x,c.z,b.x,b.z)){bd=dd;out.report=b;}}}
  if(c.alive&&c.sab){let bd=C.killR;for(const o of this.crew)if(o.alive&&!o.sab&&!o.vent){const dd=d(o.x,o.z);if(dd<bd&&M.los(c.x,c.z,o.x,o.z)){bd=dd;out.kill=o;}}
   for(const v of M.VENTS)if(d(v.x,v.z)<1.15){out.vent=v;break;}}
  return out;}
 canButton(c){return c.alive&&c.emergency>0&&this.phase==='play'&&!(this.sab.kind==='reactor'||this.sab.kind==='oxygen')&&this.pt-this.lastMeet>=C.meetCd;}
 setBusy(c,st,kind){c.busy=st?{st,kind,t:0,dur:(M.TASK_TYPES[st.type]?.t||3),visual:kind==='task'&&M.TASK_TYPES[st.type]?.visual}:null;}

 /* ---------- kills / bodies / vents ---------- */
 kill(k,v){if(this.phase!=='play'||!k.alive||!k.sab||!v.alive||v.sab||k.killCd>0||k.vent||v.vent)return false;if(Math.hypot(k.x-v.x,k.z-v.z)>C.killR+.05||!M.los(k.x,k.z,v.x,v.z))return false;
  const place=M.placeKey(v.x,v.z);v.alive=false;v.deathT=this.pt;v.busy=null;v.brain.path=[];
  const near=this.crew.filter(o=>o.alive&&!o.sab).map(o=>({id:o.id,d:Math.hypot(o.x-v.x,o.z-v.z)})).sort((a,b)=>a.d-b.d).slice(0,3).map(o=>o.id);
  const body={id:this.nextBody++,victim:v.id,x:v.x,z:v.z,k:place,t:this.pt,killer:k.id,reported:false,near};this.bodies.push(body);
  k.x=v.x;k.z=v.z;M.collide(k);k.killCd=k.human?Math.min(this.killCdMax,[44,38,32][this.o.diff]||C.killCd):this.killCdMax;k.stats.kills++;k.lastKill={t:this.pt,k:place,body};
  for(const o of this.crew){if(!o.alive||o===k||o.vent)continue;if(this.sees(o,k.x,k.z)||this.sees(o,v.x,v.z)){o.mem.ev.push({type:'kill',who:k.id,victim:v.id,k:place,t:this.pt});if(!o.sab)o.brain.alarm={who:k.id,type:'kill'};}}
  this.ev({type:'kill',killer:k.id,victim:v.id,x:v.x,z:v.z});this.check();return true;}
 report(c,body){if(this.phase!=='play'||!c.alive||body.reported)return false;c.stats.reports++;this.callMeeting(c,body);return true;}
 button(c){if(!this.canButton(c))return false;c.emergency--;c.stats.meetings++;this.callMeeting(c,null);return true;}
 ventEnter(c,v){if(!c.sab||!c.alive||c.vent||this.phase!=='play')return false;c.vent=v;c.x=v.x;c.z=v.z;c.busy=null;c.vx=c.vz=0;this.ventSeen(c,v);this.ev({type:'vent',who:c.id,vent:v.id,inn:true});return true;}
 ventMove(c,dir){if(!c.vent)return;const L=[c.vent,...M.ventLinks(c.vent)].sort((a,b)=>a.id-b.id),i=L.indexOf(c.vent);c.vent=L[(i+dir+L.length)%L.length];c.x=c.vent.x;c.z=c.vent.z;this.ev({type:'ventMove',who:c.id,vent:c.vent.id});}
 ventTo(c,v){if(!c.vent||v.net!==c.vent.net)return;c.vent=v;c.x=v.x;c.z=v.z;this.ev({type:'ventMove',who:c.id,vent:v.id});}
 ventExit(c){if(!c.vent)return false;const v=c.vent;c.vent=null;c.x=v.x;c.z=v.z+.01;this.ventSeen(c,v);this.ev({type:'vent',who:c.id,vent:v.id,inn:false});return true;}
 ventSeen(c,v){const place=M.placeKey(v.x,v.z);for(const o of this.crew){if(!o.alive||o===c||o.vent||o.sab)continue;if(this.sees(o,v.x,v.z)){o.mem.ev.push({type:'vent',who:c.id,k:place,t:this.pt});o.brain.alarm={who:c.id,type:'vent'};}}}

 /* ---------- sabotage ---------- */
 canSabotage(kind,room){const S=this.sab;if(this.phase!=='play')return false;if(kind==='doors')return room>=0&&S.doorCd[room]<=0&&!M.DOORS[room].closed;return !S.kind&&S.cd<=0;}
 sabotage(kind,room=-1,who=null){if(!this.canSabotage(kind,room))return false;const S=this.sab;if(who)who.stats.sabotages++;
  if(kind==='doors'){M.DOORS[room].closed=C.doorT;S.doorCd[room]=C.doorCd;this.ev({type:'doors',room});return true;}
  S.kind=kind;S.t=kind==='lights'?0:C.critT;S.done={};S.hold={};S.holdT=0;S.cd=C.sabCd;S.assign={};this.assignT=0;this.ev({type:'sabotage',kind});return true;}
 fixPanel(c,id){const S=this.sab;if(!S.kind||!c.alive)return false;const ps=M.FIX[S.kind];if(!ps||!ps.find(p=>p.id===id))return false;
  if(S.kind==='reactor'){S.hold[id]=.25;return true;}
  S.done[id]=true;this.ev({type:'fixPart',id});if(ps.every(p=>S.done[p.id]))this.clearSab(true);return true;}
 hold(c,id){if(this.sab.kind==='reactor'&&c.alive)this.sab.hold[id]=.25;}
 clearSab(fixed){const k=this.sab.kind;if(!k)return;this.sab.kind=null;this.sab.t=0;this.sab.done={};this.sab.hold={};this.sab.assign={};for(const c of this.crew)if(c.busy&&(c.busy.kind==='hold'||c.busy.kind==='fix'))c.busy=null;if(fixed)this.ev({type:'fixed',kind:k});}

 /* ---------- meetings ---------- */
 callMeeting(caller,body){this.phase='meeting';this.meetings++;
  for(const b of this.bodies)b.reported=true;if(body)body.reported=true;
  this.clearSab(false);for(const d of M.DOORS)d.closed=0;
  for(const c of this.crew){if(c.vent){const v=c.vent;c.vent=null;c.x=v.x;c.z=v.z;}c.busy=null;c.brain.path=[];c.vx=c.vz=0;}
  const m=this.meeting={caller:caller.id,body:body||null,victim:body?body.victim:null,kind:body?'report':'button',stage:'intro',t:0,chat:[],queue:[],votes:new Map(),ejected:null,tie:false,tPlay:this.pt,said:new Map(),reacted:new Set(),accusers:new Map()};
  this.ev({type:'meeting',caller:caller.id,body:!!body});AI.meetingOpen(this,m);}
 castVote(c,target){const m=this.meeting;if(!m||m.stage!=='vote'||!c.alive||m.votes.has(c.id))return false;if(target!==-1){const t=this.crew[target];if(!t||!t.alive)return false;}m.votes.set(c.id,target);this.ev({type:'vote',who:c.id});return true;}
 say(c,st){const m=this.meeting;if(!m||!(m.stage==='discuss'||m.stage==='vote')||!c.alive)return false;AI.post(this,m,c,st);return true;}
 tally(){const m=this.meeting;const n=new Map();for(const[,t]of m.votes)n.set(t,(n.get(t)||0)+1);let best=-1,bn=0,tie=false;for(const[t,k]of n){if(k>bn){bn=k;best=t;tie=false;}else if(k===bn)tie=true;}
  m.tie=tie;m.ejected=tie||best===-1?null:best;m.counts=n;
  for(const[v,t]of m.votes){if(t>=0&&this.crew[t].sab&&!this.crew[v].sab)this.crew[v].stats.right++;}}
 resolveMeeting(){const m=this.meeting;if(m.ejected!=null){const e=this.crew[m.ejected];e.alive=false;e.ejected=true;e.deathT=this.pt;this.ejections.push({id:e.id,sab:e.sab});AI.afterEject(this,m,e);}
  this.meeting=null;this.bodies.length=0;this.lastMeet=this.pt;this.phase='play';this.check();if(this.phase==='over')return;
  this.spawnAll();for(const c of this.crew){if(c.sab)c.killCd=C.killCdMeet+(c.human?0:R()*10-3);c.brain.st='idle';c.brain.wait=0;c.brain.hunt=null;c.brain.escape=null;c.brain.body=null;c.brain.alarm=null;}
  this.sab.cd=Math.max(this.sab.cd,12);this.ev({type:'resume'});}

 /* ---------- end conditions ---------- */
 counts(){let crew=0,sab=0;for(const c of this.crew)if(c.alive){if(c.sab)sab++;else crew++;}return{crew,sab};}
 check(){if(this.phase==='over'||this.o.attract)return;const{crew,sab}=this.counts();
  if(sab===0)return this.end('crew','eject');if(this.taskDone>=this.taskTotal)return this.end('crew','tasks');
  if(this.phase==='play'&&sab>=crew)return this.end('sab','parity');}
 end(side,why){if(this.phase==='over')return;this.phase='over';this.winner=side;this.reason=why;this.ev({type:'over',side,why});}
}
