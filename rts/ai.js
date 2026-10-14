// SHARDWAR — CPU commanders. Each one runs a macro loop (workers, supply, a build order with tech and an expansion,
// extractor saturation, research, army production weighted by faction mix and by what it has seen the enemy field) and
// a military loop (scouting, rally, defending any base under attack, attack waves that grow, retreat on HARD).
import {U,B,UP,DIFF,CS} from './data.js';
import {cl} from './util.js';

export class Brain{
 constructor(S,p,diff){this.S=S;this.p=p;this.D=DIFF[diff];this.diff=diff;this.t=Math.random()*this.D.dec;this.F=p.F;this.mode='build';this.wave=0;this.waveSup=this.D.waveSup;this.nextWave=this.D.first;
  this.scouted=false;this.seenE=new Map();this.target=null;this.acts=0;const hq=p.hq0;this.home={x:hq.x,z:hq.z};const b=S.M.mains[p.start];this.back=b.back;this.lastTrainT=0;}
 mine(f){const o=[];for(const e of this.S.ents)if(e.alive&&e.owner===this.p.i&&(!f||f(e)))o.push(e);return o;}
 update(dt){this.t-=dt;if(this.t>0)return;this.t=this.D.dec*(.8+Math.random()*.4);if(!this.p.alive)return;const S=this.S,p=this.p;
  const all=this.mine(),units=all.filter(e=>e.cls==='u'),blds=all.filter(e=>e.cls==='b');this.units=units;this.blds=blds;
  this.workers=units.filter(u=>u.d.worker);this.army=units.filter(u=>!u.d.worker);this.hqs=blds.filter(b=>b.d.hq);
  if(!this.hqs.length&&!this.workers.length&&!this.army.length)return;
  for(const e of S.ents)if(e.alive&&e.cls==='u'&&e.team!==p.team&&S.visible(p.team,e))this.seenE.set(e.id,e.type);
  this.economy();this.buildOrder();this.research();this.produce();this.military();}
 cmd(us,o,shift){if(!us.length)return;this.S.cmd(this.p,us,o,shift);this.acts++;}
 pending(type){let n=0;for(const u of this.workers)for(const o of u.q)if(o.k==='build'&&o.type===type&&!o.b)n++;return n;}
 have(type,done=false){return this.blds.filter(b=>b.type===type&&(!done||b.done)).length+(done?0:this.pending(type));}
 freeWorker(){let best=null,bs=1e9;for(const u of this.workers){const o=u.q[0];if(o&&o.k==='build')continue;if(u===this.scout)continue;const s=(o&&o.k==='gather'?0:-5)+(u.carry&&u.carry.n?4:0)+(o&&o.t&&o.t.cls==='b'?6:0);if(s<bs){bs=s;best=u;}}return best;}
 /* ---------- economy ---------- */
 economy(){const S=this.S,p=this.p,F=this.F;const exts=this.blds.filter(b=>b.d.ext&&b.done&&b.vent&&b.vent.amt>0);
  const onExt=e=>this.workers.filter(u=>u.q[0]&&u.q[0].k==='gather'&&u.q[0].t===e).length;
  for(const u of this.workers){if(u.q.length||u===this.scout)continue;// idle worker: aether first if undersaturated, else nearest ore near an HQ
   const e=exts.find(e=>onExt(e)<3);if(e&&(p.ae<p.ore*.6||Math.random()<.5)){this.cmd([u],{k:'gather',t:e});continue;}
   let n=null,bd=1e9;for(const h of this.hqs.filter(h=>h.done)){const r=S.nearestRes(h.x,h.z,'ore',18);if(r){const d=Math.hypot(r.x-u.x,r.z-u.z);if(d<bd){bd=d;n=r;}}}if(!n)n=S.nearestRes(u.x,u.z,'ore',200);if(n)this.cmd([u],{k:'gather',t:n});}
  for(const e of exts){const n=onExt(e);if(n<3&&this.workers.length>10){const w=this.workers.find(u=>u.q[0]&&u.q[0].k==='gather'&&u.q[0].t.cls==='r'&&!(u.carry&&u.carry.n)&&u!==this.scout);if(w)this.cmd([w],{k:'gather',t:e});}}
  // workers
  const want=Math.min(this.D.workers,this.hqs.filter(h=>h.done).length*16+exts.length*3+2);
  if(this.workers.length+this.trainingOf(F.worker)<want)for(const h of this.hqs)if(h.done&&h.queue.length<(this.diff>1?2:1))S.train(p,h,F.worker);
  // supply
  const prod=this.blds.filter(b=>b.d.trains&&b.done).length;const need=3+prod*(this.diff>=1?3:2);
  if(p.cap<150&&p.cap-p.sup<need){const building=this.blds.filter(b=>b.type===F.supply&&!b.done).length+this.pending(F.supply);if(building<(p.cap>60?2:1))this.place(F.supply);}}
 trainingOf(type){let n=0;for(const b of this.blds)for(const q of b.queue)if(q.type===type)n++;return n;}
 buildOrder(){const S=this.S,p=this.p,F=this.F,t=S.t,D=this.D,e=this.diff===0,w=this.workers.length;
  const steps=[[F.barracks,1,w>=(e?8:9)],[F.ext,1,this.have(F.barracks)&&w>=(e?12:11)],[F.tech,1,this.have(F.barracks,true)&&t>(e?260:this.diff>1?120:150)],
   [F.ext,2,t>(e?330:200)],[F.factory,1,this.have(F.barracks,true)&&t>(e?380:this.diff>1?190:230)],[F.hq,2,t>D.expand],[F.barracks,2,t>(e?560:this.diff>1?260:320)],
   [F.tower,D.towers,t>(this.diff>1?200:260)],[F.air,1,this.have(F.factory,true)&&t>(e?600:this.diff>1?330:400)],[F.ext,4,this.hqs.filter(h=>h.done).length>=2&&t>(e?700:400)],
   [F.barracks,3,this.diff>1&&t>420],[F.factory,2,this.diff>1&&t>500],[F.hq,3,this.diff>1&&t>620],[F.air,2,this.diff>=1&&t>640],[F.barracks,Math.min(5,1+this.hqs.length+(p.ore/700|0)),this.D.extraRax&&p.ore>450&&t>240],[F.ext,3,p.ore>500&&t>300]];
  for(const[type,n,cond]of steps){if(!cond||this.have(type)>=n)continue;if(S.missing(p,type))continue;const c=B[type].cost;if(!S.afford(p,c)){if(p.ore<c[0]){this.saving=c;return;}continue;}if(this.place(type))return;}
  this.saving=null;}
 place(type){const S=this.S,p=this.p,d=B[type];if(!S.afford(p,d.cost))return false;const wk=this.freeWorker();if(!wk)return false;let spot=null;
  if(d.ext){let bd=1e9;for(const h of this.hqs.filter(h=>h.done)){for(const v of S.ents){if(v.cls!=='r'||v.rk!=='vent'||!v.alive||v.ext||v.amt<=0)continue;if(this.workers.some(u=>u.q.some(o=>o.k==='build'&&o.x===v.x&&o.z===v.z)))continue;const dd=Math.hypot(v.x-h.x,v.z-h.z);if(dd<16&&dd<bd){bd=dd;spot=[v.x,v.z];}}}}
  else if(d.hq){let bd=1e9;for(const b of S.M.bases){if(S.ents.some(e=>e.cls==='b'&&e.alive&&e.d.hq&&Math.hypot(e.x-b.x,e.z-b.z)<10))continue;if(this.workers.some(u=>u.q.some(o=>o.k==='build'&&o.type===type)))return false;
    const dd=Math.hypot(b.x-this.home.x,b.z-this.home.z);let danger=false;for(const e of S.ents)if(e.alive&&e.team!==p.team&&e.cls==='b'&&Math.hypot(e.x-b.x,e.z-b.z)<30)danger=true;if(!danger&&dd<bd&&S.canPlace(p,type,b.x,b.z).ok){bd=dd;spot=[b.x,b.z];}}}
  else{const hq=this.hqs.find(h=>h.done)||this.hqs[0]||{x:this.home.x,z:this.home.z};const bx=this.back[0],bz=this.back[1];const tower=type===this.F.tower;
   for(let k=0;k<160&&!spot;k++){const r=(tower?11:7+d.size)+(k/16|0)*2.2,a=Math.atan2(-bx,-bz)+(tower?(k%16-8)*.12:(k%16)*.39+(k/16|0)*.2);const x=hq.x+Math.sin(a)*r,z=hq.z+Math.cos(a)*r;
    if((x-hq.x)*bx+(z-hq.z)*bz>3)continue;const pl=S.canPlace(p,type,x,z);if(!pl.ok)continue;
    // keep a free ring around the footprint so paths stay open
    const h=d.size*CS/2+1.5;let ok=true;for(const[ox,oz]of[[-h,-h],[h,-h],[-h,h],[h,h],[0,-h],[0,h],[-h,0],[h,0]])if(!S.free(pl.x+ox,pl.z+oz)){ok=false;break;}if(ok)spot=[pl.x,pl.z];}}
  if(!spot)return false;const ok=S.build(p,[wk],type,spot[0],spot[1]);if(ok)this.acts++;return ok;}
 research(){const S=this.S,p=this.p;if(this.diff===0&&S.t<480)return;for(const b of this.blds){if(!b.done||!b.d.res||b.queue.length)continue;for(const k of b.d.res){if(p.up[k]||S.researching(p,k)||S.missing(p,k))continue;const c=UP[k].cost;if(p.ore>c[0]+150&&p.ae>c[1]+50){S.research(p,b,k);this.acts++;}break;}}}
 /* ---------- army ---------- */
 weights(){const S=this.S,p=this.p,mix={...this.F.mix};if(this.D.adapt){let air=0,arm=0,light=0,n=0;for(const[,ty]of this.seenE){const d=U[ty];if(!d||d.worker)continue;n++;if(d.air)air++;if(d.tags.includes('armored'))arm++;else light++;}
   if(n>4){const k=this.D.adapt;if(air/n>.25){if(p.f==='compact'){mix.trooper*=1+k;mix.lancer*=1+k*.5;}else{mix.glider*=1+k;mix.spiner*=1+k;}}
    if(arm/n>.4){if(p.f==='compact'){mix.lancer*=1+k*1.5;}else{mix.lobber*=1+k*.6;mix.weaver*=1+k*.5;mix.carapace*=1+k*.4;}}
    if(light/n>.6){if(p.f==='compact'){mix.bombard*=1+k;mix.warden*=1+k*.6;}else{mix.lobber*=1+k;mix.carapace*=1+k*.6;}}}}
  return mix;}
 produce(){const S=this.S,p=this.p;if(this.saving&&(p.ore<this.saving[0]+60))return;if(Math.random()>this.D.prod)return;if(this.army.reduce((s,u)=>s+u.d.sup,0)>=this.D.armyCap)return;const mix=this.weights();
  // current composition to keep proportions
  const have={};for(const u of this.army)have[u.type]=(have[u.type]||0)+1;
  for(const b of this.blds){if(!b.done||!b.d.trains||b.d.hq||b.queue.length>=(this.diff>1||p.ore>350?2:1))continue;
   const opts=b.d.trains.filter(t=>!S.missing(p,t)&&S.afford(p,U[t].cost));if(!opts.length)continue;
   let best=null,bs=-1;for(const t of opts){const w=mix[t]||1;const s=w/(1+(have[t]||0))*(.7+Math.random()*.6);if(s>bs){bs=s;best=t;}}
   if(best&&S.train(p,b,best)){have[best]=(have[best]||0)+1;this.acts++;}}}
 rallyPt(){const hq=this.hqs.filter(h=>h.done).sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))[0]||{x:this.home.x,z:this.home.z};const x=hq.x-this.back[0]*13,z=hq.z-this.back[1]*13;return this.S.free(x,z)?{x,z}:{x:hq.x-this.back[0]*8,z:hq.z-this.back[1]*8};}
 enemyTarget(from){const S=this.S,p=this.p;let best=null,bd=1e9;for(const e of S.ents){if(!e.alive||e.cls!=='b'||e.team===p.team||!e.seen[p.team])continue;const d=Math.hypot(e.x-from.x,e.z-from.z)-(e.d.atk?0:0);if(d<bd){bd=d;best=e;}}
  if(best)return{x:best.x,z:best.z,b:best};// unknown: head to an enemy start
  const starts=S.players.filter(q=>q.team!==p.team&&q.alive).map(q=>S.M.mains[q.start]);if(!starts.length)return null;const s=starts[(this.wave+p.i)%starts.length];return{x:s.x,z:s.z};}
 military(){const S=this.S,p=this.p,army=this.army;const sup=army.reduce((s,u)=>s+u.d.sup,0);const R=this.rallyPt();
  for(const b of this.blds)if(b.d.trains&&!b.d.hq&&(!b.rally||Math.hypot(b.rally.x-R.x,b.rally.z-R.z)>2))S.rally(p,[b],R.x,R.z);
  // scout once
  if(!this.scouted&&S.t>this.D.scout&&this.workers.length>6){this.scouted=true;const w=this.freeWorker();if(w){this.scout=w;const starts=S.players.filter(q=>q.team!==p.team).map(q=>S.M.mains[q.start]);starts.forEach((s,i)=>this.cmd([w],{k:'move',x:s.x-s.back[0]*14,z:s.z-s.back[1]*14},i>0));this.cmd([w],{k:'move',x:this.home.x,z:this.home.z},true);}}
  if(this.scout&&(!this.scout.alive||!this.scout.q.length))this.scout=null;
  // threats near any of our buildings
  let threat=null,tn=0;for(const e of S.ents){if(!e.alive||e.cls!=='u'||e.team===p.team||!S.visible(p.team,e))continue;for(const b of this.blds){if(Math.hypot(e.x-b.x,e.z-b.z)<20){tn++;if(!threat)threat=e;break;}}}
  // weaver novas
  for(const u of army)if(u.d.nova&&u.novaCd<=0&&this.diff>0){const c=this.cluster(u,u.d.nova.rng+2,u.d.nova.r);if(c){this.cmd([u],{k:'nova',x:c.x,z:c.z});this.cmd([u],{k:'amove',x:c.x,z:c.z},true);}}
  if(threat&&this.mode!=='attack'||threat&&tn>4&&sup<this.waveSup*.8){this.mode='defend';const idle=army.filter(u=>!u.q.length||u.q[0].k!=='attack'&&u.q[0].k!=='nova');this.cmd(idle.filter(u=>!u.q.length||Math.hypot(u.q[0].x-threat.x,u.q[0].z-threat.z)>8),{k:'amove',x:threat.x,z:threat.z});
   // HARD/NORMAL: pull a few workers when the army is tiny and the threat sits in the mineral line
   if(this.diff>=1&&sup<4&&tn<=3&&threat.d.tg){const near=this.workers.filter(w=>Math.hypot(w.x-threat.x,w.z-threat.z)<10).slice(0,4);if(near.length)this.cmd(near,{k:'attack',t:threat});}return;}
  if(this.mode==='defend'&&!threat){this.mode='build';this.cmd(army.filter(u=>!u.q.length||u.q[0].k==='amove'),{k:'amove',x:R.x,z:R.z});}
  if(this.mode==='build'){const idle=army.filter(u=>!u.q.length&&Math.hypot(u.x-R.x,u.z-R.z)>9);if(idle.length)this.cmd(idle,{k:'move',x:R.x,z:R.z});
   if(S.t>=this.nextWave&&sup>=this.waveSup){this.mode='attack';this.wave++;this.waveStart=sup;this.target=this.enemyTarget(R);if(this.target)this.cmd(army,{k:'amove',x:this.target.x,z:this.target.z});}
   else if(S.t>=this.nextWave+90&&sup>=this.waveSup*.6&&S.t>S.len-150){this.mode='attack';this.wave++;this.waveStart=sup;this.target=this.enemyTarget(R);if(this.target)this.cmd(army,{k:'amove',x:this.target.x,z:this.target.z});}
   return;}
  if(this.mode==='attack'){if(!army.length||sup<this.waveStart*(this.D.micro>=2?.3:this.D.micro?.2:.05)){this.mode='build';this.nextWave=S.t+this.D.waveGap;this.waveSup+=this.D.waveAdd;
    if(army.length)this.cmd(army,{k:'move',x:R.x,z:R.z});return;}
   const tg=this.target;if(!tg||(tg.b&&!tg.b.alive)||(!tg.b&&this.armyNear(tg,10))){this.target=this.enemyTarget(this.centroid(army));if(!this.target){this.mode='build';return;}}
   const t2=this.target;const lost=army.filter(u=>!u.q.length||(u.q[0].k==='move'&&Math.hypot(u.x-R.x,u.z-R.z)<10));if(lost.length)this.cmd(lost,{k:'amove',x:t2.x,z:t2.z});
   // stragglers: keep the blob together on harder levels
   if(this.D.micro>=1){const c=this.centroid(army);const far=army.filter(u=>Math.hypot(u.x-c.x,u.z-c.z)>22&&u.q[0]&&u.q[0].k==='amove');if(far.length>2&&far.length<army.length*.5){const lead=army.filter(u=>!far.includes(u)&&Math.hypot(u.x-t2.x,u.z-t2.z)<Math.hypot(c.x-t2.x,c.z-t2.z));if(lead.length)this.cmd(lead,{k:'amove',x:c.x,z:c.z});this.cmd(lead,{k:'amove',x:t2.x,z:t2.z},true);}}}}
 armyNear(pt,r){return this.army.some(u=>Math.hypot(u.x-pt.x,u.z-pt.z)<r);}
 centroid(us){let x=0,z=0;for(const u of us){x+=u.x;z+=u.z;}return{x:x/us.length,z:z/us.length};}
 cluster(u,rng,r){const S=this.S;let best=null,bn=2;const foes=S.ents.filter(e=>e.alive&&e.cls==='u'&&e.team!==u.team&&!e.air&&S.visible(u.team,e)&&Math.hypot(e.x-u.x,e.z-u.z)<rng);
  for(const e of foes){let n=0;for(const f of foes)if(Math.hypot(f.x-e.x,f.z-e.z)<r*.8)n+=f.d.worker?.5:1;if(n>bn){bn=n;best=e;}}return best;}}
