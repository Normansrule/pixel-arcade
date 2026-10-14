// SHARDWAR — the simulation: entities (units, buildings, resource nodes), orders with shift-queues, flow-field
// pathfinding on the cell grid, separation, combat with projectiles/splash/chain bolts, economy (two resources, supply),
// construction (Compact riggers stay on site, Lattice structures grow alone), production queues, research,
// per-team fog of war with explored memory, scoring and victory. No rendering here: events go to S.ev for the views.
import {U,B,UP,FACTIONS,CS,ORE_TRIP,AE_TRIP,ORE_T,AE_T,MAX_SUP,DIFF,value} from './data.js';
import {makeMap} from './map.js';
import {cl,dist} from './util.js';

const D8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]];
const circCache={};function circle(r){const k=Math.round(r*2);if(circCache[k])return circCache[k];const o=[],R=k/2;for(let j=-Math.ceil(R);j<=Math.ceil(R);j++)for(let i=-Math.ceil(R);i<=Math.ceil(R);i++)if(i*i+j*j<=R*R+.5)o.push([i,j]);return circCache[k]=o;}

export class Sim{
 constructor(o){
  this.o=o;this.M=makeMap(o.map);const M=this.M;this.N=M.N;this.half=M.half;this.t=0;this.len=o.minutes*60;this.over=null;
  this.ents=[];this.nid=1;this.ev=[];this.projs=[];this.blasts=[];this.occ=new Uint8Array(M.blk);this.occV=1;this.fc=new Map();this.fBudget=3;
  this.players=o.players.map((p,i)=>({i,name:p.name,team:p.team,f:p.faction,F:FACTIONS[p.faction],ai:!!p.ai,diff:p.diff??1,col:p.color,human:!p.ai,start:p.start,
   ore:p.ore??75,ae:p.ae??0,sup:0,cap:0,up:{},gm:p.ai?DIFF[p.diff??1].gather:1,alive:true,lastAtk:-99,
   st:{built:0,lost:0,killed:0,bBuilt:0,bLost:0,bKilled:0,ore:0,ae:0,spent:0,acts:0,vKilled:0,vBuilt:0,armyMax:0}}));
  this.teams=[...new Set(this.players.map(p=>p.team))].sort();
  const NN=this.N*this.N;this.vis={};this.exp={};for(const t of this.teams){this.vis[t]=new Uint8Array(NN);this.exp[t]=new Uint8Array(NN);}
  this.visT=0;this.chkT=0;this.hashN=Math.ceil(M.size/6);this.hash=Array.from({length:this.hashN*this.hashN},()=>[]);
  // resources
  for(const b of M.bases){for(const[x,z,a]of b.ore)this.addRes('ore',x,z,a);for(const[x,z,a]of b.vents)this.addRes('vent',x,z,a);}
  // starting bases: HQ + 6 workers mining
  for(const p of this.players){const base=M.mains[p.start];const hq=this.addBld(p,p.F.hq,base.x,base.z,true);
   for(let k=0;k<6;k++){const a=Math.atan2(base.back[0],base.back[1])+(k-2.5)*.45;const w=this.addUnit(p,p.F.worker,base.x+Math.sin(a)*5.6,base.z+Math.cos(a)*5.6);const n=this.nearestRes(w.x,w.z,'ore',20);if(n)w.q.push({k:'gather',t:n,ph:'go'});}
   p.hq0=hq;}
  this.calcSupply();this.vision();}
 /* ---------------- grid helpers ---------------- */
 cell(x,z){const N=this.N;const i=cl(Math.floor((x+this.half)/CS),0,N-1),j=cl(Math.floor((z+this.half)/CS),0,N-1);return j*N+i;}
 cx(c){return-this.half+(c%this.N+.5)*CS;}cz(c){return-this.half+((c/this.N|0)+.5)*CS;}
 free(x,z){if(Math.abs(x)>=this.half||Math.abs(z)>=this.half)return false;return this.occ[this.cell(x,z)]===0;}
 lineFree(ax,az,bx,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.9);for(let k=1;k<n;k++){const t=k/n;if(!this.free(ax+(bx-ax)*t,az+(bz-az)*t))return false;}return true;}
 rectOf(e){const h=e.d.size*CS/2;return[e.x-h,e.z-h,e.x+h,e.z+h];}
 // edge-to-edge gap between a unit and any entity
 gap(u,t){if(t.cls==='u')return Math.hypot(u.x-t.x,u.z-t.z)-u.r-t.r;let x0,z0,x1,z1;if(t.cls==='b')[x0,z0,x1,z1]=this.rectOf(t);else{const h=t.rk==='vent'?CS:CS/2;x0=t.x-h;z0=t.z-h;x1=t.x+h;z1=t.z+h;}
  const dx=Math.max(x0-u.x,0,u.x-x1),dz=Math.max(z0-u.z,0,u.z-z1);return Math.hypot(dx,dz)-u.r;}
 /* ---------------- entities ---------------- */
 addRes(rk,x,z,amt){const e={id:this.nid++,cls:'r',rk,x,z,amt,amt0:amt,r:rk==='vent'?1.8:1,alive:true,team:-1,owner:-1,miner:null,ext:null,cells:[]};
  const h=rk==='vent'?1:0;for(let j=-h;j<=h-(h?1:0);j++)for(let i=-h;i<=h-(h?1:0);i++){const c=this.cell(x+i*CS+(h?CS/2:0),z+j*CS+(h?CS/2:0));e.cells.push(c);}
  if(rk==='ore')for(const c of e.cells)this.occ[c]=3;this.ents.push(e);return e;}
 addUnit(p,type,x,z){const d=U[type];const u={id:this.nid++,cls:'u',type,d,owner:p.i,P:p,team:p.team,x,z,r:d.r,hp:d.hp,mhp:d.hp,alive:true,yaw:Math.atan2(-x,-z),q:[],tgt:null,cdT:0,acqT:Math.random()*.3,
   vx:0,vz:0,moving:false,air:!!d.air,carry:null,gT:0,atkAnim:0,hitT:0,losT:0,los:false,novaCd:0,born:this.t,lastHit:-99,stuckT:0,lastD:1e9,inside:false};
  if(p.up.hard&&(type==='carapace'||type==='lobber')){u.mhp+=60;u.hp+=60;}
  this.ents.push(u);return u;}
 addBld(p,type,x,z,done=false){const d=B[type];const b={id:this.nid++,cls:'b',type,d,owner:p.i,P:p,team:p.team,x,z,r:d.size*CS/2,hp:done?d.hp:d.hp*.1,mhp:d.hp,alive:true,done,prog:done?1:0,queue:[],rally:null,cdT:0,tgt:null,acqT:0,cells:[],seen:{},yaw:0,lastHit:-99,born:this.t,atkAnim:0};
  b.seen[p.team]=1;const h=d.size/2;for(let j=0;j<d.size;j++)for(let i=0;i<d.size;i++){const c=this.cell(x+(i-h+.5)*CS,z+(j-h+.5)*CS);b.cells.push(c);}
  if(d.ext){const v=this.ents.find(e=>e.cls==='r'&&e.rk==='vent'&&e.alive&&Math.abs(e.x-x)<.1&&Math.abs(e.z-z)<.1);b.vent=v;if(v)v.ext=b;}
  for(const c of b.cells)this.occ[c]=2;this.occV++;this.ents.push(b);if(done)p.st.bBuilt++;
  // push units out of the footprint
  for(const u of this.ents)if(u.cls==='u'&&u.alive&&!u.air&&this.occ[this.cell(u.x,u.z)]!==0)this.unstick(u);
  return b;}
 unstick(u){const c0=this.cell(u.x,u.z),N=this.N,ci=c0%N,cj=c0/N|0;let best=null,bd=1e9;for(let r=1;r<10&&!best;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){if(Math.max(Math.abs(i),Math.abs(j))!==r)continue;const ii=ci+i,jj=cj+j;if(ii<1||jj<1||ii>=N-1||jj>=N-1)continue;const c=jj*N+ii;if(this.occ[c])continue;const d=(this.cx(c)-u.x)**2+(this.cz(c)-u.z)**2;if(d<bd){bd=d;best=c;}}
  if(best!=null){u.x=this.cx(best);u.z=this.cz(best);}}
 nearestRes(x,z,rk,r,ex){let b=null,bd=r*r;for(const e of this.ents){if(e.cls!=='r'||!e.alive||e.rk!==rk||e===ex)continue;const d=(e.x-x)**2+(e.z-z)**2;if(d<bd){bd=d;b=e;}}return b;}
 dropOf(u){let b=null,bd=1e18;for(const e of this.ents){if(e.cls!=='b'||!e.alive||!e.done||e.owner!==u.owner||!e.d.drop)continue;const d=(e.x-u.x)**2+(e.z-u.z)**2;if(d<bd){bd=d;b=e;}}return b;}
 count(p,type,done=true){let n=0;for(const e of this.ents)if(e.alive&&e.owner===p.i&&e.type===type&&(!done||e.cls!=='b'||e.done))n++;return n;}
 has(p,type){for(const e of this.ents)if(e.alive&&e.owner===p.i&&e.type===type&&e.done)return true;return false;}
 // requirement check: '' when ok, else the missing building name
 missing(p,key){const d=U[key]||B[key]||UP[key];if(!d)return'?';const req=[...(d.req?(Array.isArray(d.req)?d.req:[d.req]):[])];for(const r of req)if(!this.has(p,r))return B[r].n;if(d.prev&&!p.up[d.prev])return UP[d.prev].n;return'';}
 afford(p,cost){return p.ore>=cost[0]&&p.ae>=cost[1];}
 pay(p,cost,k=1){p.ore-=cost[0]*k;p.ae-=cost[1]*k;if(k>0)p.st.spent+=cost[0]+cost[1];}
 msg(p,text,snd='deny'){this.ev.push({k:'msg',p:p.i,text,snd});}
 calcSupply(){for(const p of this.players){let s=0,c=0;for(const e of this.ents){if(!e.alive||e.owner!==p.i)continue;if(e.cls==='u')s+=e.d.sup;else{if(e.done&&e.d.sup)c+=e.d.sup;for(const q of e.queue)if(q.k==='u')s+=U[q.type].sup;}}p.sup=s;p.cap=Math.min(MAX_SUP,c);}}
 /* ---------------- player commands (human and CPU) ---------------- */
 // units: array; o: order {k,x,z,t,...}; shift appends
 cmd(p,units,o,shift=false){units=units.filter(u=>u.alive&&u.cls==='u'&&u.owner===p.i);if(!units.length)return;p.st.acts++;
  let cxs=0,czs=0;for(const u of units){cxs+=u.x;czs+=u.z;}cxs/=units.length;czs/=units.length;let spread=0;for(const u of units)spread=Math.max(spread,Math.hypot(u.x-cxs,u.z-czs));
  const grp={n:units.length,id:this.nid++};let k=0;
  for(const u of units){let oo={...o,grp};
   if((o.k==='move'||o.k==='amove')&&units.length>1){let ox,oz;if(spread<9){ox=(u.x-cxs)*.8;oz=(u.z-czs)*.8;}else{const a=k*2.4,rr=Math.sqrt(k)*1.25;ox=Math.sin(a)*rr;oz=Math.cos(a)*rr;}k++;
    if(this.free(o.x+ox,o.z+oz)||u.air){oo.ox=ox;oo.oz=oz;}}
   if(o.k==='gather'){if(!u.d.worker){oo={k:'move',x:o.t.x,z:o.t.z,grp};}else oo.ph=u.carry&&u.carry.n?'ret':'go';}
   if(o.k==='attack'&&!this.canHit(u,o.t)){if(o.t.team===u.team||!u.d.tg){oo={k:'move',x:o.t.x,z:o.t.z,grp};}else oo={k:'amove',x:o.t.x,z:o.t.z,grp};}
   if(o.k==='stop'){this.clearQ(u);u.tgt=null;u.home=null;continue;}
   if(o.k==='nova'&&!u.d.nova)continue;
   if(o.k==='build'&&!u.d.worker)continue;
   if(!shift){this.clearQ(u);u.q=[oo];u.tgt=null;}else u.q.push(oo);}}
 clearQ(u){for(const o of u.q){if(o.k==='build'&&!o.b&&o.paid)this.pay(u.P,B[o.type].cost,-1);}if(u.inside)this.exitExt(u);const o=u.q[0];if(o&&o.t&&o.t.miner===u)o.t.miner=null;u.q=[];}
 canPlace(p,type,x,z,ignore){const d=B[type];const h=d.size/2;
  if(d.ext){const v=this.ents.find(e=>e.cls==='r'&&e.rk==='vent'&&e.alive&&!e.ext&&Math.abs(e.x-x)<2.1&&Math.abs(e.z-z)<2.1);if(!v)return{ok:false,why:'Must be placed on an aether vent',x,z};return{ok:p.ai||this.exp[p.team][this.cell(v.x,v.z)]>0,x:v.x,z:v.z,why:'Unexplored'};}
  const sx=d.size%2?(Math.floor(x/CS)+.5)*CS:Math.round(x/CS)*CS,sz=d.size%2?(Math.floor(z/CS)+.5)*CS:Math.round(z/CS)*CS;
  for(let j=0;j<d.size;j++)for(let i=0;i<d.size;i++){const wx=sx+(i-h+.5)*CS,wz=sz+(j-h+.5)*CS;if(Math.abs(wx)>this.half-4||Math.abs(wz)>this.half-4)return{ok:false,x:sx,z:sz,why:'Out of bounds'};const c=this.cell(wx,wz);if(this.occ[c])return{ok:false,x:sx,z:sz,why:'Blocked'};if(!p.ai&&!this.exp[p.team][c])return{ok:false,x:sx,z:sz,why:'Unexplored'};}
  // keep resource lines and drop-offs apart: no HQ within 6 m of resources
  if(d.hq){for(const e of this.ents)if(e.cls==='r'&&e.alive&&Math.abs(e.x-sx)<h*CS+2.6&&Math.abs(e.z-sz)<h*CS+2.6)return{ok:false,x:sx,z:sz,why:'Too close to resources'};}
  for(const e of this.ents)if(e.cls==='u'&&e.alive&&!e.air&&e.team!==p.team&&Math.abs(e.x-sx)<h*CS+e.r&&Math.abs(e.z-sz)<h*CS+e.r)return{ok:false,x:sx,z:sz,why:'Enemy units in the way'};
  return{ok:true,x:sx,z:sz};}
 // order the closest given worker to build type at x,z
 build(p,workers,type,x,z,shift=false){const d=B[type];workers=workers.filter(u=>u.alive&&u.d.worker&&u.owner===p.i);if(!workers.length)return false;
  if(d.f!==p.f)return false;const miss=this.missing(p,type);if(miss){this.msg(p,'Requires '+miss);return false;}
  const pl=this.canPlace(p,type,x,z);if(!pl.ok){this.msg(p,pl.why);return false;}if(!this.afford(p,d.cost)){this.msg(p,p.ore<d.cost[0]?'Not enough ore':'Not enough aether');return false;}
  let w=workers[0],bd=1e9;for(const u of workers){const dd=Math.hypot(u.x-pl.x,u.z-pl.z)+(u.carry&&u.carry.n?3:0)+(u.q.length&&u.q[0].k==='build'?40:0);if(dd<bd){bd=dd;w=u;}}
  this.pay(p,d.cost);const prev=w.q[0]&&w.q[0].k==='gather'?w.q[0].t:null;const o={k:'build',type,x:pl.x,z:pl.z,paid:true,resume:prev};
  if(shift){w.q.push(o);}else{this.clearQ(w);w.q=[o];}p.st.acts++;return true;}
 train(p,b,type){if(!b.alive||!b.done||b.owner!==p.i)return false;const d=U[type];if(!b.d.trains||!b.d.trains.includes(type))return false;
  const miss=this.missing(p,type);if(miss){this.msg(p,'Requires '+miss);return false;}if(b.queue.length>=5){this.msg(p,'Queue is full');return false;}
  if(!this.afford(p,d.cost)){this.msg(p,p.ore<d.cost[0]?'Not enough ore':'Not enough aether');return false;}
  this.calcSupply();if(p.sup+d.sup>p.cap){this.msg(p,p.cap>=MAX_SUP?'Supply maximum reached':'Need more supply: build a '+B[p.F.supply].n);return false;}
  this.pay(p,d.cost);b.queue.push({k:'u',type,t:0,T:d.time});p.st.acts++;this.calcSupply();return true;}
 research(p,b,key){const d=UP[key];if(!b.alive||!b.done||b.owner!==p.i||!b.d.res||!b.d.res.includes(key))return false;if(p.up[key]||this.researching(p,key)){this.msg(p,'Already researched');return false;}
  const miss=this.missing(p,key);if(miss){this.msg(p,'Requires '+miss);return false;}if(b.queue.length>=5)return false;if(!this.afford(p,d.cost)){this.msg(p,p.ore<d.cost[0]?'Not enough ore':'Not enough aether');return false;}
  this.pay(p,d.cost);b.queue.push({k:'r',type:key,t:0,T:d.time});p.st.acts++;return true;}
 researching(p,key){for(const e of this.ents)if(e.cls==='b'&&e.alive&&e.owner===p.i&&e.queue.some(q=>q.type===key))return true;return false;}
 cancel(p,b,i=-1){if(b.owner!==p.i)return false;if(!b.done){this.pay(p,b.d.cost,-.75);this.kill(b,null,true);return true;}if(!b.queue.length)return false;if(i<0)i=b.queue.length-1;const q=b.queue.splice(i,1)[0];if(!q)return false;this.pay(p,(U[q.type]||UP[q.type]).cost,-1);p.st.spent-=0;this.calcSupply();p.st.acts++;return true;}
 rally(p,bs,x,z,t){for(const b of bs)if(b.cls==='b'&&b.owner===p.i&&b.d.trains)b.rally={x,z,t:t||null};p.st.acts++;}
 /* ---------------- upgrades ---------------- */
 wpn(p){return(p.up.c_wpn1||p.up.l_wpn1?1:0)+(p.up.c_wpn2||p.up.l_wpn2?1:0);}
 arm(p){return(p.up.c_arm1||p.up.l_arm1?1:0)+(p.up.c_arm2||p.up.l_arm2?1:0);}
 range(u){const d=u.cls==='b'?u.d.atk:u.d;let r=d.rng;if(u.P.up.c_shell){if(u.type==='bombard')r+=2;if(u.type==='hawk')r+=1;}return r;}
 speed(u){let s=u.d.spd;if(u.P.up.l_quick&&!u.air)s*=1.18;return s;}
 canHit(u,t){const d=u.cls==='b'?u.d.atk:u.d;if(!d||!d.tg||!t||!t.alive||t.cls==='r'||t.team===u.team)return false;if(t.cls==='u'&&t.inside)return false;return t.air?d.tg.includes('a'):d.tg.includes('g');}
 visible(team,e){if(e.team===team)return true;if(e.cls==='u'&&e.inside)return false;const v=this.vis[team];if(e.cls==='b'){for(const c of e.cells)if(v[c])return true;return false;}return v[this.cell(e.x,e.z)]>0;}
 /* ---------------- flow fields ---------------- */
 flow(key,seeds){let f=this.fc.get(key);if(f&&f.v===this.occV){f.u=this.t;return f.d;}if(this.fBudget<=0)return f?f.d:null;this.fBudget--;
  const N=this.N,NN=N*N,d=f?f.d:new Float32Array(NN),occ=this.occ;d.fill(1e9);
  if(!this.hc){this.hc=new Int32Array(NN*8);this.hk=new Float32Array(NN*8);}const hc=this.hc,hk=this.hk;let hn=0;
  const push=(c,k)=>{let i=hn++;while(i>0){const p=(i-1)>>1;if(hk[p]<=k)break;hc[i]=hc[p];hk[i]=hk[p];i=p;}hc[i]=c;hk[i]=k;};
  const pop=()=>{const c=hc[0];const lc=hc[--hn],lk=hk[hn];let i=0;for(;;){let m=i*2+1;if(m>=hn)break;if(m+1<hn&&hk[m+1]<hk[m])m++;if(hk[m]>=lk)break;hc[i]=hc[m];hk[i]=hk[m];i=m;}hc[i]=lc;hk[i]=lk;return c;};
  if(typeof seeds==="function")seeds=seeds();for(const[c,k]of seeds){if(k<d[c]){d[c]=k;push(c,k);}}
  const DI=[1,-1,0,0,1,1,-1,-1],DJ=[0,0,1,-1,1,-1,1,-1],DW=[1,1,1,1,1.4142,1.4142,1.4142,1.4142];
  while(hn>0){const k=hk[0],c=pop();if(k>d[c])continue;const i=c%N,j=(c-i)/N;
   for(let q=0;q<8;q++){const ii=i+DI[q],jj=j+DJ[q];if(ii<0||jj<0||ii>=N||jj>=N)continue;const n=jj*N+ii;if(occ[n]!==0)continue;if(q>3&&(occ[j*N+ii]!==0||occ[jj*N+i]!==0))continue;const nk=k+DW[q];if(nk<d[n]){d[n]=nk;push(n,nk);}}}
  this.fc.set(key,{d,v:this.occV,u:this.t});if(this.fc.size>48){let ok=null,ou=1e18;for(const[kk,ff]of this.fc)if(ff.u<ou){ou=ff.u;ok=kk;}this.fc.delete(ok);}return d;}
 seedsPoint(x,z){const c=this.cell(x,z);if(!this.occ[c])return[[c,0]];const N=this.N,i0=c%N,j0=c/N|0,out=[];for(let r=1;r<8&&!out.length;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const ii=i0+i,jj=j0+j;if(ii<0||jj<0||ii>=N||jj>=N)continue;const n=jj*N+ii;if(!this.occ[n])out.push([n,Math.hypot(i,j)]);}return out;}
 seedsEnt(e){const N=this.N,set=new Set(),out=[];for(const c of e.cells.length?e.cells:[this.cell(e.x,e.z)]){const i=c%N,j=c/N|0;for(const[di,dj]of D8){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=N||jj>=N)continue;const n=jj*N+ii;if(!this.occ[n]&&!set.has(n)){set.add(n);out.push([n,0]);}}}return out.length?out:this.seedsPoint(e.x,e.z);}
 /* ---------------- movement ---------------- */
 // steer u towards (gx,gz). key/seeds pick the shared flow field when the straight line is blocked. returns remaining distance
 steer(u,gx,gz,dt,key,seedFn){const dx=gx-u.x,dz=gz-u.z,d=Math.hypot(dx,dz);if(d<.05){u.moving=false;return d;}
  let vx=dx/d,vz=dz/d;
  if(!u.air){u.losT-=dt;if(u.losT<=0||u.losK!==key){u.los=this.lineFree(u.x,u.z,gx,gz);u.losT=.35+Math.random()*.2;u.losK=key;}
   if(!u.los){const F=this.flow(key||('p'+this.cell(gx,gz)),seedFn||(()=>this.seedsPoint(gx,gz)));if(F){const N=this.N,c=this.cell(u.x,u.z),i=c%N,j=c/N|0;let best=-1,bk=F[c];
     for(const[di,dj]of D8){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=N||jj>=N)continue;const n=jj*N+ii;if(this.occ[n])continue;if(di&&dj&&(this.occ[j*N+ii]||this.occ[jj*N+i]))continue;if(F[n]<bk){bk=F[n];best=n;}}
     if(best>=0){const tx=this.cx(best)-u.x,tz=this.cz(best)-u.z,l=Math.hypot(tx,tz)||1;vx=tx/l;vz=tz/l;}}}}
  const sp=this.speed(u);u.vx=vx*sp;u.vz=vz*sp;u.moving=true;u.yaw=Math.atan2(vx,vz);return d;}
 // move along an order to a point; true on arrival
 moveTo(u,o,dt){let gx=o.x+(o.ox||0),gz=o.z+(o.oz||0);const key='p'+this.cell(o.x,o.z);const d=this.steer(u,gx,gz,dt,Math.hypot(u.x-gx,u.z-gz)<6&&(u.air||this.lineFree(u.x,u.z,gx,gz))?'d':key,()=>this.seedsPoint(o.x,o.z));
  const ar=o.grp&&o.grp.n>1?.4+Math.sqrt(o.grp.n)*.35:.35;if(d<ar){u.moving=false;return true;}
  // progress watchdog: stuck in a crowd near the goal counts as arrived
  u.stuckT+=dt;if(u.stuckT>.8){u.stuckT=0;const prog=u.lastD-d;u.lastD=d;if(prog<.3&&d<(o.grp?2+Math.sqrt(o.grp.n)*1.2:2.5)){u.moving=false;return true;}if(prog<.05)u.stk=(u.stk||0)+1;else u.stk=0;if(u.stk>6){u.stk=0;u.moving=false;return true;}}
  return false;}
 moveToEnt(u,t,dt){const k='e'+t.id;if(t.cls==='u'){const qx=(Math.floor(t.x/8)+.5)*8,qz=(Math.floor(t.z/8)+.5)*8;return this.steer(u,t.x,t.z,dt,'q'+qx+','+qz,()=>this.seedsPoint(qx,qz));}return this.steer(u,t.x,t.z,dt,k,()=>this.seedsEnt(t));}
 next(u){const o=u.q.shift();if(o&&o.t&&o.t.miner===u)o.t.miner=null;u.stuckT=0;u.lastD=1e9;u.tgt=null;u.moving=false;u.vx=u.vz=0;}
 /* ---------------- targeting ---------------- */
 acquire(u,r){const hn=this.hashN,bi=cl(Math.floor((u.x+this.half)/6),0,hn-1),bj=cl(Math.floor((u.z+this.half)/6),0,hn-1),rr=Math.ceil((r+2)/6);let best=null,bs=-1e9;
  for(let j=Math.max(0,bj-rr);j<=Math.min(hn-1,bj+rr);j++)for(let i=Math.max(0,bi-rr);i<=Math.min(hn-1,bi+rr);i++)for(const e of this.hash[j*hn+i]){if(e.team===u.team||!this.canHit(u,e)||!this.visible(u.team,e))continue;const g=this.gap(u,e);if(g>r)continue;
   const threat=e.cls==='u'&&e.d.tg?(e.d.worker?2:6):e.cls==='b'&&e.d.atk?5:1;const s=threat*10-g-(e.hp/e.mhp)*2;if(s>bs){bs=s;best=e;}}
  if(!best){// buildings are not in the hash
   for(const e of this.ents){if(e.cls!=='b'||!e.alive||e.team===u.team||!this.canHit(u,e)||!this.visible(u.team,e))continue;const g=this.gap(u,e);if(g>r)continue;const s=(e.d.atk?5:1)*10-g;if(s>bs){bs=s;best=e;}}}
  return best;}
 // approach and attack t; returns false when t is no longer valid
 fight(u,t,dt,hold){if(!t||!t.alive||!this.canHit(u,t)||!this.visible(u.team,t)&&this.gap(u,t)>1)return false;const g=this.gap(u,t),rg=this.range(u);
  if(g<=rg+.15&&!(u.d.minr&&g<u.d.minr)){u.moving=false;u.vx=u.vz=0;u.yaw=Math.atan2(t.x-u.x,t.z-u.z);if(u.cdT<=0)this.fire(u,t);return true;}
  if(hold)return false;
  if(u.d.minr&&g<u.d.minr){const dx=u.x-t.x,dz=u.z-t.z,l=Math.hypot(dx,dz)||1;this.steer(u,u.x+dx/l*4,u.z+dz/l*4,dt,'d');return true;}
  this.moveToEnt(u,t,dt);return true;}
 fire(u,t){const d=u.cls==='b'?u.d.atk:u.d;let cd=d.cd;if(u.P.up.c_drill&&u.cls==='u'&&u.d.tags.includes('bio'))cd*=.8;u.cdT=cd*(.95+Math.random()*.1);u.atkAnim=.35;
  const dm=this.dmgOf(u,d,t);this.ev.push({k:'shot',u,t,look:d.proj||'melee'});
  if(!d.proj){this.hurt(t,dm,u);if(d.spl)this.splash(t.x,t.z,d.spl,u,d,t);return;}
  if(d.chain){const hit=[t];let cur=t;this.hurt(t,dm,u);for(let k=1;k<d.chain;k++){let nb=null,nd=16;for(const e of this.ents){if(e.cls!=='u'||!e.alive||hit.includes(e)||!this.canHit(u,e))continue;const dd=(e.x-cur.x)**2+(e.z-cur.z)**2;if(dd<nd){nd=dd;nb=e;}}if(!nb)break;this.ev.push({k:'arc',a:cur,b:nb});hit.push(nb);this.hurt(nb,this.dmgOf(u,d,nb)*.7,u);cur=nb;}return;}
  const y0=u.cls==='b'?(u.d.size>=3?5:4.2):u.air?3.2:1.1;const lob=d.proj==='shell'||d.proj==='geode';const spd=lob?16:d.proj==='rail'?80:d.proj==='spine'?34:55;
  const ty=t.air?3.2:t.cls==='b'?1.6:.8;this.projs.push({x:u.x,y:y0,z:u.z,sx:u.x,sy:y0,sz:u.z,tx:t.x,ty,tz:t.z,t:lob?null:t,s:0,spd,dmg:dm,spl:d.spl||0,src:u,P:u.P,team:u.team,look:d.proj,arc:lob?Math.min(9,2+Math.hypot(t.x-u.x,t.z-u.z)*.35):0,d});}
 dmgOf(u,d,t){let v=d.dmg;const tags=t.cls==='b'?['armored','structure']:t.d.tags;if(d.bon){for(const k in d.bon)if(tags.includes(k)||(k==='air'&&t.air))v+=d.bon[k];}v*=1+.12*this.wpn(u.P);return v;}
 hurt(t,v,src){if(!t.alive)return;const ar=(t.cls==='b'?t.d.ar:t.d.ar)+(t.cls==='u'?this.arm(t.P):0);v=Math.max(.5,v-ar);t.hp-=v;t.hitT=.15;t.lastHit=this.t;
  if(src){src.P.st.dmg=(src.P.st.dmg||0)+v;if(t.cls==='u'&&!t.tgt&&!t.q.length&&this.canHit(t,src)&&!t.d.worker)t.tgt=src;t.lastAtkBy=src;}
  if(t.P&&src&&src.team!==t.team&&this.t-t.P.lastAtk>8){t.P.lastAtk=this.t;this.ev.push({k:'alarm',p:t.owner,x:t.x,z:t.z,worker:t.cls==='u'&&t.d.worker,bld:t.cls==='b'});}
  if(t.P)t.P.atkPos={x:t.x,z:t.z,t:this.t};
  if(t.hp<=0)this.kill(t,src);}
 splash(x,z,r,u,d,primary){for(const e of this.ents){if(!e.alive||e===primary||e.cls==='r'||e.team===u.team||e.air||(e.cls==='u'&&e.inside))continue;const g=e.cls==='b'?Math.max(0,this.gap({x,z,r:0},e)):Math.hypot(e.x-x,e.z-z)-e.r;if(g>r)continue;this.hurt(e,this.dmgOf(u,d,e)*(1-.5*cl(g/r,0,1)),u);}}
 kill(e,src,silent){if(!e.alive)return;e.alive=false;e.hp=0;e.deadT=this.t;const p=e.P;
  if(e.cls==='u'){p.st.lost++;if(e.inside)this.exitExt(e);const o=e.q[0];if(o&&o.t&&o.t.miner===e)o.t.miner=null;}
  else{p.st.bLost++;for(const c of e.cells)this.occ[c]=0;this.occV++;if(e.vent)e.vent.ext=null;for(const u of this.ents)if(u.cls==='u'&&u.inside===e)this.exitExt(u);}
  if(src&&src.P&&src.team!==e.team){if(e.cls==='u')src.P.st.killed++;else src.P.st.bKilled++;src.P.st.vKilled+=value(e.type)*(e.cls==='b'?1.5:1);}
  if(!silent)this.ev.push({k:'die',e,src});this.calcSupply();}
 exitExt(u){const b=u.inside;u.inside=false;if(b&&b.vent&&b.vent.miner===u)b.vent.miner=null;if(b){const a=Math.random()*6.28;u.x=b.x+Math.sin(a)*(b.r+u.r+.3);u.z=b.z+Math.cos(a)*(b.r+u.r+.3);if(!this.free(u.x,u.z))this.unstick(u);}}
 /* ---------------- per-unit order logic ---------------- */
 unitTick(u,dt){if(u.cdT>0)u.cdT-=dt;if(u.atkAnim>0)u.atkAnim-=dt;if(u.hitT>0)u.hitT-=dt;if(u.novaCd>0)u.novaCd-=dt;u.vx=u.vz=0;u.moving=false;
  if(u.P.f==='lattice'&&u.hp<u.mhp)u.hp=Math.min(u.mhp,u.hp+dt*(.35+(u.P.up.l_hard&&(u.type==='carapace'||u.type==='lobber')?.8:0)));
  if(u.d.heal)this.healTick(u,dt);
  const o=u.q[0];const atk=!!u.d.tg;
  if(!o){// idle: acquire and chase within a leash, then return
   if(atk){u.acqT-=dt;if(u.acqT<=0||(u.tgt&&!u.tgt.alive)){u.acqT=.3;if(!u.tgt||!u.tgt.alive||!this.visible(u.team,u.tgt)){u.tgt=this.acquire(u,Math.max(this.range(u),u.d.worker?0:u.d.sight*.8));if(u.tgt&&!u.home)u.home={x:u.x,z:u.z};}}
    if(u.tgt){if(u.home&&Math.hypot(u.x-u.home.x,u.z-u.home.z)>14){u.tgt=null;}else if(!this.fight(u,u.tgt,dt))u.tgt=null;return;}
    if(u.home){if(Math.hypot(u.x-u.home.x,u.z-u.home.z)>1.5){this.steer(u,u.home.x,u.home.z,dt,'p'+this.cell(u.home.x,u.home.z));return;}u.home=null;}}
   return;}
  u.home=null;
  switch(o.k){
   case'move':if(this.moveTo(u,o,dt))this.next(u);break;
   case'follow':{const t=o.t;if(!t||!t.alive){this.next(u);break;}if(Math.hypot(t.x-u.x,t.z-u.z)>3)this.moveToEnt(u,t,dt);break;}
   case'amove':case'patrol':{u.acqT-=dt;if(atk&&(u.acqT<=0||(u.tgt&&!u.tgt.alive))){u.acqT=.25;if(!u.tgt||!u.tgt.alive||this.gap(u,u.tgt)>u.d.sight+2)u.tgt=this.acquire(u,Math.max(this.range(u),u.d.sight*.9));}
    if(u.tgt&&this.fight(u,u.tgt,dt))break;u.tgt=null;
    if(u.d.heal&&u.healT>0)break;
    if(this.moveTo(u,o,dt)){if(o.k==='patrol'){const a=o.a||{x:u.x,z:u.z};o.a={x:o.x,z:o.z};o.x=a.x;o.z=a.z;o.ox=o.oz=0;u.lastD=1e9;}else this.next(u);}break;}
   case'attack':{if(!this.fight(u,o.t,dt))this.next(u);break;}
   case'hold':{u.acqT-=dt;if(atk&&u.acqT<=0){u.acqT=.25;u.tgt=this.acquire(u,this.range(u));}if(u.tgt&&!this.fight(u,u.tgt,dt,true))u.tgt=null;break;}
   case'nova':{const nv=u.d.nova;if(u.novaCd>0){this.next(u);break;}const g=Math.hypot(o.x-u.x,o.z-u.z);if(g>nv.rng){this.steer(u,o.x,o.z,dt,'p'+this.cell(o.x,o.z));break;}
    u.novaCd=nv.cd;u.atkAnim=.6;u.yaw=Math.atan2(o.x-u.x,o.z-u.z);this.blasts.push({x:o.x,z:o.z,t:1,r:nv.r,dmg:nv.dmg*(1+.12*this.wpn(u.P)),u});this.ev.push({k:'nova',u,x:o.x,z:o.z,r:nv.r});this.next(u);break;}
   case'gather':this.gatherTick(u,o,dt);break;
   case'return':{if(!u.carry||!u.carry.n){this.next(u);break;}const dr=this.dropOf(u);if(!dr){this.next(u);break;}if(this.gap(u,dr)<.7){this.deposit(u);this.next(u);if(!u.q.length&&u.lastNode&&u.lastNode.alive)u.q.push({k:'gather',t:u.lastNode,ph:'go'});}else this.moveToEnt(u,dr,dt);break;}
   case'build':this.buildTick(u,o,dt);break;
   default:this.next(u);}}
 deposit(u){const p=u.P,n=u.carry.n*p.gm;if(u.carry.k==='o'){p.ore+=n;p.st.ore+=n;}else{p.ae+=n;p.st.ae+=n;}this.ev.push({k:'deposit',u,res:u.carry.k,n});u.carry=null;}
 gatherTick(u,o,dt){let n=o.t;const isExt=n&&n.cls==='b';
  if(u.carry&&u.carry.n&&(o.ph==='ret'||u.carry.n>=(u.carry.k==='o'?ORE_TRIP:AE_TRIP)||(u.carry.k==='o')===!!isExt)){o.ph='ret';}
  if(o.ph==='ret'){if(u.inside)this.exitExt(u);const dr=this.dropOf(u);if(!dr){this.next(u);return;}if(this.gap(u,dr)<.7){this.deposit(u);o.ph='go';}else this.moveToEnt(u,dr,dt);return;}
  // resolve a valid node
  if(!n||!n.alive||(n.cls==='r'&&n.amt<=0)||(isExt&&(!n.done||n.owner!==u.owner||!n.vent||n.vent.amt<=0))){if(n&&n.miner===u)n.miner=null;
   const alt=this.nearestRes(n?n.x:u.x,n?n.z:u.z,'ore',16);if(alt&&!isExt){o.t=alt;n=alt;}else{if(u.inside)this.exitExt(u);this.next(u);return;}}
  if(isExt){const v=n.vent;if(u.inside){u.gT-=dt;if(u.gT<=0){const k=Math.min(AE_TRIP,v.amt);v.amt-=k;u.carry={k:'a',n:k};u.lastNode=n;this.exitExt(u);o.ph='ret';if(v.amt<=0)this.ev.push({k:'depleted',e:v});}return;}
   if(this.gap(u,n)<.8){if(!v.miner||!v.miner.alive||v.miner.inside!==n){v.miner=u;u.inside=n;u.gT=AE_T;}return;}this.moveToEnt(u,n,dt);return;}
  if(this.gap(u,n)<.75){u.yaw=Math.atan2(n.x-u.x,n.z-u.z);
   if(n.miner&&n.miner!==u&&n.miner.alive&&n.miner.q[0]&&n.miner.q[0].t===n&&n.miner.mining){// occupied: try a free neighbour node
    if(!o.wait||this.t-o.wait>.6){o.wait=this.t;let alt=null,bd=64;for(const e of this.ents){if(e.cls!=='r'||!e.alive||e.rk!=='ore'||e===n||e.miner&&e.miner.alive&&e.miner.mining&&e.miner.q[0]&&e.miner.q[0].t===e)continue;const d=(e.x-n.x)**2+(e.z-n.z)**2;if(d<bd){bd=d;alt=e;}}if(alt)o.t=alt;}
    u.mining=false;return;}
   if(n.miner!==u){n.miner=u;u.gT=ORE_T;}u.mining=true;u.gT-=dt;u.atkAnim=u.atkAnim>0?u.atkAnim:(Math.sin(this.t*7)>.9?.3:0);
   if(u.gT<=0){const k=Math.min(ORE_TRIP,n.amt);n.amt-=k;u.carry={k:'o',n:k};u.lastNode=n;n.miner=null;u.mining=false;o.ph='ret';if(n.amt<=0){n.alive=false;for(const c of n.cells)this.occ[c]=0;this.ev.push({k:'depleted',e:n});}}return;}
  u.mining=false;this.moveToEnt(u,n,dt);}
 buildTick(u,o,dt){const p=u.P,d=B[o.type];
  if(o.b){const b=o.b;if(!b.alive||b.done){this.next(u);this.afterBuild(u,o);return;}if(this.gap(u,b)<1.2){u.building=b;u.yaw=Math.atan2(b.x-u.x,b.z-u.z);u.atkAnim=u.atkAnim>0?u.atkAnim:(Math.random()<dt*3?.35:0);}else this.moveToEnt(u,b,dt);return;}
  o.t0??=this.t;if(this.t-o.t0>35){this.pay(p,d.cost,-1);o.paid=false;this.msg(p,'Construction site unreachable');this.next(u);this.afterBuild(u,o);return;}
  const fake={cls:'b',d,x:o.x,z:o.z,cells:[]};const g=this.gap(u,fake);
  if(g>1.2){const k='s'+o.x+','+o.z;this.steer(u,o.x,o.z,dt,k,()=>{const out=[],h=d.size/2+1;for(let j=-h;j<=h;j++)for(let i=-h;i<=h;i++){const c=this.cell(o.x+(i)*CS,o.z+(j)*CS);if(!this.occ[c])out.push([c,0]);}return out.length?out:this.seedsPoint(o.x,o.z);});
   u.stuckT+=dt;if(u.stuckT>1){u.stuckT=0;if(Math.abs(u.lastD-g)<.05&&g<4){u.lastD=1e9;}else u.lastD=g;}return;}
  const pl=this.canPlace(p,o.type,o.x,o.z);if(!pl.ok){this.pay(p,d.cost,-1);o.paid=false;this.msg(p,'Cannot build there: '+pl.why);this.next(u);return;}
  const b=this.addBld(p,o.type,pl.x,pl.z,false);o.paid=false;b.builder=u;this.ev.push({k:'place',b,u});p.st.acts+=0;
  if(p.f==='lattice'){this.next(u);this.afterBuild(u,o);}else o.b=b;}
 afterBuild(u,o){if(!u.q.length&&u.d.worker){const n=o.resume&&o.resume.alive?o.resume:this.nearestRes(u.x,u.z,'ore',30);if(n)u.q.push({k:'gather',t:n,ph:'go'});}}
 healTick(u,dt){u.healT=(u.healT||0)-dt;u.hcd=(u.hcd||0)-dt;if(u.hcd>0)return;u.hcd=.5;let best=null,bs=0;
  for(const e of this.ents){if(e.cls!=='u'||!e.alive||e.team!==u.team||e===u||!e.d.tags.includes('bio')||e.hp>=e.mhp||e.inside)continue;const d=Math.hypot(e.x-u.x,e.z-u.z);if(d>u.d.sight)continue;const s=(e.mhp-e.hp)-d*2;if(s>bs){bs=s;best=e;}}
  if(!best)return;const d=Math.hypot(best.x-u.x,best.z-u.z);if(d<=u.d.hrng+best.r){best.hp=Math.min(best.mhp,best.hp+u.d.heal*.5);u.healT=.6;u.atkAnim=.3;u.yaw=Math.atan2(best.x-u.x,best.z-u.z);this.ev.push({k:'heal',u,t:best});}
  else if(!u.q.length||u.q[0].k==='amove'){u.healT=.6;this.steer(u,best.x,best.z,dt,'d');}}
 /* ---------------- buildings ---------------- */
 bldTick(b,dt){const p=b.P;if(b.atkAnim>0)b.atkAnim-=dt;if(b.hitT>0)b.hitT-=dt;
  if(p.f==='lattice'&&b.hp<b.mhp&&b.done)b.hp=Math.min(b.mhp,b.hp+dt*2);
  if(!b.done){let rate=0;if(p.f==='lattice')rate=1;else{for(const u of this.ents)if(u.cls==='u'&&u.alive&&u.building===b&&u.q[0]&&u.q[0].b===b){rate=1;break;}}
   if(rate){b.prog+=dt/b.d.time;b.hp=Math.min(b.mhp,b.hp+b.mhp*.9*dt/b.d.time);if(b.prog>=1){b.prog=1;b.done=true;p.st.bBuilt++;p.st.vBuilt+=value(b.type)*.5;this.ev.push({k:'built',b});this.calcSupply();}}return;}
  if(b.d.atk){if(b.cdT>0)b.cdT-=dt;b.acqT-=dt;if(b.acqT<=0||(b.tgt&&!b.tgt.alive)){b.acqT=.3;if(!b.tgt||!b.tgt.alive||!this.canHit(b,b.tgt)||this.gap(b.tgt.cls==='u'?b.tgt:b,b.tgt.cls==='u'?b:b.tgt)>b.d.atk.rng+.2)b.tgt=this.acquireB(b);}
   if(b.tgt&&b.cdT<=0){b.yaw=Math.atan2(b.tgt.x-b.x,b.tgt.z-b.z);this.fire(b,b.tgt);}}
  const q=b.queue[0];if(!q)return;
  if(q.k==='r'&&!b.d.res.includes(q.type)){b.queue.shift();return;}
  q.t+=dt;if(q.t<q.T)return;b.queue.shift();
  if(q.k==='r'){p.up[q.type]=1;const ud=UP[q.type];if(ud.kind==='hard')for(const e of this.ents)if(e.alive&&e.owner===p.i&&(e.type==='carapace'||e.type==='lobber')){e.mhp+=60;e.hp+=60;}this.ev.push({k:'research',p:p.i,key:q.type,b});return;}
  this.spawn(b,q.type);}
 acquireB(b){let best=null,bd=1e9;const r=b.d.atk.rng;for(const e of this.ents){if(e.cls!=='u'||!e.alive||e.team===b.team||!this.canHit(b,e)||!this.visible(b.team,e))continue;const g=this.gap(e,b);if(g>r)continue;const s=g-(e.d.tg?3:0);if(s<bd){bd=s;best=e;}}return best;}
 spawn(b,type){const p=b.P,d=U[type];const tx=b.rally?b.rally.x:b.x+(b.x>0?-1:1)*8,tz=b.rally?b.rally.z:b.z+(b.z>0?-1:1)*8;let a=Math.atan2(tx-b.x,tz-b.z),x=0,z=0;
  for(let k=0;k<16;k++){const aa=a+(k%2?1:-1)*Math.ceil(k/2)*.4;x=b.x+Math.sin(aa)*(b.r+d.r+.4);z=b.z+Math.cos(aa)*(b.r+d.r+.4);if(d.air||this.free(x,z))break;}
  const u=this.addUnit(p,type,x,z);u.yaw=a;p.st.built++;p.st.vBuilt+=value(type)*.25;this.ev.push({k:'trained',u,b});
  const R=b.rally;if(R){if(R.t&&R.t.alive&&d.worker&&(R.t.cls==='r'||R.t.d&&R.t.d.ext))u.q.push({k:'gather',t:R.t,ph:'go'});else if(R.t&&R.t.alive&&R.t.team!==u.team&&this.canHit(u,R.t))u.q.push({k:'attack',t:R.t});else u.q.push({k:'move',x:R.x,z:R.z});}
  else if(d.worker){const n=this.nearestRes(b.x,b.z,'ore',22);if(n)u.q.push({k:'gather',t:n,ph:'go'});}
  else u.q.push({k:'move',x:tx,z:tz});this.calcSupply();return u;}
 /* ---------------- vision ---------------- */
 vision(){const N=this.N;for(const t of this.teams)this.vis[t].fill(0);
  for(const e of this.ents){if(!e.alive||e.cls==='r'||(e.cls==='u'&&e.inside))continue;const v=this.vis[e.team],x=this.exp[e.team];const s=(e.cls==='b'&&!e.done?Math.min(5,e.d.sight):e.d.sight)/CS;const c=this.cell(e.x,e.z),i0=c%N,j0=c/N|0;
   for(const[i,j]of circle(s)){const ii=i0+i,jj=j0+j;if(ii<0||jj<0||ii>=N||jj>=N)continue;const k=jj*N+ii;v[k]=1;x[k]=1;}}
  for(const e of this.ents)if(e.cls==='b'&&e.alive)for(const t of this.teams)if(!e.seen[t]&&e.cells.some(c=>this.vis[t][c]))e.seen[t]=1;}
 /* ---------------- step ---------------- */
 step(dt){if(this.over)return;this.t+=dt;this.fBudget=3;
  // spatial hash of live units
  for(const h of this.hash)h.length=0;const hn=this.hashN;for(const e of this.ents)if(e.cls==='u'&&e.alive&&!e.inside){const i=cl(Math.floor((e.x+this.half)/6),0,hn-1),j=cl(Math.floor((e.z+this.half)/6),0,hn-1);this.hash[j*hn+i].push(e);}
  for(const e of this.ents){if(!e.alive)continue;if(e.cls==='u'){e.building=e.q[0]&&e.q[0].k==='build'?e.building:null;this.unitTick(e,dt);}else if(e.cls==='b')this.bldTick(e,dt);}
  this.integrate(dt);
  // projectiles
  for(let i=this.projs.length-1;i>=0;i--){const m=this.projs[i];if(m.t&&m.t.alive){m.tx=m.t.x;m.tz=m.t.z;}const L=Math.max(.5,Math.hypot(m.tx-m.sx,m.tz-m.sz));m.s+=m.spd*dt/L;const s=Math.min(1,m.s);
   m.x=m.sx+(m.tx-m.sx)*s;m.z=m.sz+(m.tz-m.sz)*s;m.y=m.sy+(m.ty-m.sy)*s+m.arc*4*s*(1-s);
   if(m.s>=1){this.projs.splice(i,1);if(m.spl){this.ev.push({k:'impact',x:m.tx,z:m.tz,look:m.look,spl:m.spl,team:m.team});const fake={P:m.P,team:m.team,d:m.d};
     for(const e of this.ents){if(!e.alive||e.cls==='r'||e.team===m.team||e.air||(e.cls==='u'&&e.inside))continue;const g=e.cls==='b'?Math.max(0,this.gap({x:m.tx,z:m.tz,r:0},e)):Math.hypot(e.x-m.tx,e.z-m.tz)-e.r*.6;if(g>m.spl)continue;this.hurt(e,this.dmgOf(fake,m.d,e)*(1-.5*cl(g/m.spl,0,1)),m.src.alive?m.src:{...fake,P:m.P});}}
    else if(m.t&&m.t.alive){this.hurt(m.t,m.dmg,m.src.alive?m.src:null);this.ev.push({k:'impact',x:m.t.x,z:m.t.z,y:m.ty,look:m.look,spl:0,team:m.team});}}}
  // delayed nova blasts
  for(let i=this.blasts.length-1;i>=0;i--){const b=this.blasts[i];b.t-=dt;if(b.t>0)continue;this.blasts.splice(i,1);this.ev.push({k:'blast',x:b.x,z:b.z,r:b.r});
   for(const e of this.ents){if(!e.alive||e.cls==='r'||e.team===b.u.team||(e.cls==='u'&&e.inside))continue;const g=e.cls==='b'?Math.max(0,this.gap({x:b.x,z:b.z,r:0},e)):Math.hypot(e.x-b.x,e.z-b.z)-e.r*.5;if(g<=b.r)this.hurt(e,b.dmg*(e.cls==='b'?.5:1),b.u.alive?b.u:null);}}
  this.visT-=dt;if(this.visT<=0){this.visT=.2;this.vision();}
  // tidy corpses
  if((this.t*10|0)%10===0)this.ents=this.ents.filter(e=>e.alive||this.t-(e.deadT??this.t)<4);
  this.chkT-=dt;if(this.chkT<=0){this.chkT=.5;this.calcSupply();this.checkEnd();for(const p of this.players){let a=0;for(const e of this.ents)if(e.alive&&e.owner===p.i&&e.cls==='u'&&!e.d.worker)a+=e.d.sup;p.st.armyMax=Math.max(p.st.armyMax,a);}}}
 integrate(dt){const hn=this.hashN;
  for(const u of this.ents){if(u.cls!=='u'||!u.alive||u.inside)continue;const ghost=u.d.worker&&u.q[0]&&(u.q[0].k==='gather'||u.q[0].k==='return');let px=0,pz=0;
   const i0=cl(Math.floor((u.x+this.half)/6),0,hn-1),j0=cl(Math.floor((u.z+this.half)/6),0,hn-1);
   if(!ghost)for(let j=Math.max(0,j0-1);j<=Math.min(hn-1,j0+1);j++)for(let i=Math.max(0,i0-1);i<=Math.min(hn-1,i0+1);i++)for(const e of this.hash[j*hn+i]){if(e===u||e.air!==u.air||!e.alive)continue;if(e.d.worker&&e.q[0]&&(e.q[0].k==='gather'||e.q[0].k==='return'))continue;
    const dx=u.x-e.x,dz=u.z-e.z,d=Math.hypot(dx,dz),m=u.r+e.r-d;if(m<=0)continue;const k=(u.moving&&!e.moving?.25:!u.moving&&e.moving?1:.6)*m;if(d<1e-4){px+=Math.random()-.5;pz+=Math.random()-.5;continue;}px+=dx/d*k;pz+=dz/d*k;}
   let mx=u.vx*dt+cl(px,-.5,.5)*Math.min(1,dt*8),mz=u.vz*dt+cl(pz,-.5,.5)*Math.min(1,dt*8);if(!mx&&!mz)continue;
   if(u.air){u.x=cl(u.x+mx,-this.half+3,this.half-3);u.z=cl(u.z+mz,-this.half+3,this.half-3);continue;}
   const r=u.r*.7,sx=Math.sign(mx),sz=Math.sign(mz);
   if(this.free(u.x+mx+sx*r,u.z)&&this.free(u.x+mx+sx*r,u.z+r*.7)&&this.free(u.x+mx+sx*r,u.z-r*.7))u.x+=mx;else if(u.moving)u.vz+=0;
   if(this.free(u.x,u.z+mz+sz*r)&&this.free(u.x+r*.7,u.z+mz+sz*r)&&this.free(u.x-r*.7,u.z+mz+sz*r))u.z+=mz;
   if(!this.free(u.x,u.z))this.unstick(u);}}
 /* ---------------- score / end ---------------- */
 score(p){const s=p.st;return Math.round((s.ore+s.ae*1.5)*.5+s.vKilled+s.vBuilt);}
 teamScore(t){let s=0;for(const p of this.players)if(p.team===t)s+=this.score(p);return s;}
 checkEnd(){const alive={};for(const t of this.teams)alive[t]=0;for(const e of this.ents)if(e.alive&&e.cls==='b')alive[e.team]++;
  for(const p of this.players){if(p.alive&&!this.ents.some(e=>e.alive&&e.cls==='b'&&e.owner===p.i)){p.alive=false;this.ev.push({k:'elim',p:p.i});for(const e of this.ents)if(e.alive&&e.owner===p.i&&e.cls==='u'&&!this.ents.some(b=>b.alive&&b.cls==='b'&&b.team===p.team))this.kill(e,null,true);}}
  const left=this.teams.filter(t=>alive[t]>0);if(left.length<=1){this.over={win:left[0]??-1,why:'destroy',t:this.t};return;}
  if(this.t>=this.len){const sc=this.teams.map(t=>[t,this.teamScore(t)]).sort((a,b)=>b[1]-a[1]);this.over={win:sc[0][1]===sc[1][1]?-1:sc[0][0],why:'time',t:this.t};}}}
