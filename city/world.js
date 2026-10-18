// NEON BAY — procedural coastal city layout + physics queries.
// Pure data (no rendering): street grid, canal + bridges, beach, harbour, Crest Ridge hills with a winding road,
// an elevated freeway loop that tunnels through the ridge, ramps, buildings, props, POIs, collision + ground + routing.
import {cl,lerp,sstep,rng,fbm,hash2,segDist} from './util.js';

export const XS=[-520,-410,-300,-190,-80,30,140,250,400,510];
export const ZS=[-350,-240,-130,-20,90,200,310,420];
export const RW=7,WALK=5,SLAB=.18,WL=-1.2,CANAL=[300,350],QUAY=640,BEACH=440,FWY_Y=12,FWY_HW=11;
export const BOUND={x0:-640,x1:760,z0:-760,z1:640};
const STEP=1.25;

/* ---------------- polylines ---------------- */
export function poly(pts){let s=0;pts[0].s=0;for(let i=1;i<pts.length;i++){s+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z);pts[i].s=s;}pts.len=s;return pts;}
function lineSamples(a,b,step){const L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(L/step)),o=[];for(let i=0;i<=n;i++)o.push({x:lerp(a.x,b.x,i/n),z:lerp(a.z,b.z,i/n)});return o;}
function catmull(cp,step){const out=[];for(let i=0;i<cp.length-1;i++){const p0=cp[Math.max(0,i-1)],p1=cp[i],p2=cp[i+1],p3=cp[Math.min(cp.length-1,i+2)];const L=Math.hypot(p2.x-p1.x,p2.z-p1.z),n=Math.max(2,Math.ceil(L/step));
  for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;const f=(a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);out.push({x:f(p0.x,p1.x,p2.x,p3.x),z:f(p0.z,p1.z,p2.z,p3.z)});}}
 out.push({x:cp[cp.length-1].x,z:cp[cp.length-1].z});return out;}
export function polyAt(P,s,o={}){s=cl(s,0,P.len);let lo=0,hi=P.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(P[m].s<=s)lo=m;else hi=m;}const a=P[lo],b=P[hi],L=(b.s-a.s)||1e-6,t=(s-a.s)/L;
 o.x=a.x+(b.x-a.x)*t;o.z=a.z+(b.z-a.z)*t;o.y=(a.y??0)+((b.y??0)-(a.y??0))*t;o.tx=(b.x-a.x)/L;o.tz=(b.z-a.z)/L;return o;}

/* ---------------- spatial hash ---------------- */
class Hash{constructor(cell){this.c=cell;this.m=new Map();}
 key(i,j){return i*73856093^j*19349663;}
 add(o,x0,z0,x1,z1){const c=this.c;for(let i=Math.floor(x0/c);i<=Math.floor(x1/c);i++)for(let j=Math.floor(z0/c);j<=Math.floor(z1/c);j++){const k=this.key(i,j);let a=this.m.get(k);if(!a)this.m.set(k,a=[]);a.push(o);}}
 at(x,z){return this.m.get(this.key(Math.floor(x/this.c),Math.floor(z/this.c)))||EMPTY;}
 near(x0,z0,x1,z1,out){const c=this.c;out.length=0;const seen=out.seen||(out.seen=new Set());seen.clear();for(let i=Math.floor(x0/c);i<=Math.floor(x1/c);i++)for(let j=Math.floor(z0/c);j<=Math.floor(z1/c);j++){const a=this.m.get(this.key(i,j));if(a)for(const o of a)if(!seen.has(o)){seen.add(o);out.push(o);}}return out;}}
const EMPTY=[];

export const DNAME={downtown:'DOWNTOWN',midtown:'MIDTOWN',strip:'NEON STRIP',beach:'OCEAN DRIVE',suburb:'PALMWOOD',harbor:'PORT SALT',park:'PALM PARK',canal:'CANALSIDE',hills:'CREST RIDGE',sea:'THE BAY',sand:'SUNSET BEACH',freeway:'BAYLOOP FREEWAY'};

export class World{
 constructor(seed=1987){this.R=rng(seed);this.solids=[];this.decks=[];this.decksAll=[];this.nodes=[];this.edges=[];this.blocks=[];this.excl=[];
  this.bld=[];this.roofs=[];this.roofProps=[];this.signs=[];this.boards=[];this.lamps=[];this.palms=[];this.trees=[];this.pines=[];this.benches=[];this.bins=[];this.hydrants=[];this.tlights=[];this.containers=[];this.cranes=[];this.boats=[];this.umbrellas=[];this.towers=[];this.railings=[];this.pillars=[];this.walls=[];this.portals=[];this.fountains=[];
  this.sHash=new Hash(32);this.dHash=new Hash(32);this.eHash=new Hash(40);this.hrHash=new Hash(24);this.fwHash=new Hash(40);
  this.buildFreeway();this.buildRamps();this.buildHillRoad();this.bakeTerrain();this.buildBlocks();this.buildPOIs();this.buildDecks();this.buildGraph();this.buildStuff();this.buildRaces();
  for(const s of this.solids)this.sHash.add(s,s.x0,s.z0,s.x1,s.z1);}

 /* ======== freeway loop (rounded rectangle, tunnels through Crest Ridge) ======== */
 buildFreeway(){const W=-245,E=455,N=-520,S=365,r=70,P=[];const arc=(cx,cz,a0,a1)=>{const n=Math.ceil(Math.abs(a1-a0)*r/6);for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/n;P.push({x:cx+Math.cos(a)*r,z:cz+Math.sin(a)*r});}};
  const line=(a,b)=>{const s=lineSamples(a,b,6);s.pop();P.push(...s);};
  line({x:W+r,z:S},{x:E-r,z:S});arc(E-r,S-r,Math.PI/2,0);line({x:E,z:S-r},{x:E,z:N+r});arc(E-r,N+r,0,-Math.PI/2);line({x:E-r,z:N},{x:W+r,z:N});arc(W+r,N+r,-Math.PI/2,-Math.PI);line({x:W,z:N+r},{x:W,z:S-r});arc(W+r,S-r,Math.PI,Math.PI/2);
  P.push({x:P[0].x,z:P[0].z});for(const p of P)p.y=FWY_Y;this.fwy=poly(P);
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];this.fwHash.add({a,b,i},Math.min(a.x,b.x)-20,Math.min(a.z,b.z)-20,Math.max(a.x,b.x)+20,Math.max(a.z,b.z)+20);}}
 fwyDist(x,z){let best=1e9,bi=0,bt=0;for(const o of this.fwHash.at(x,z)){const r=segDist(x,z,o.a.x,o.a.z,o.b.x,o.b.z);if(r.d<best){best=r.d;bi=o.i;bt=r.t;}}return{d:best,s:this.fwy[bi].s+bt*(this.fwy[bi+1].s-this.fwy[bi].s)};}
 /* ======== ramps (two-way, street level -> freeway) ======== */
 buildRamps(){const defs=[[[30,348],[75,348],[205,348],[250,358],[285,365]],[[-228,200],[-228,170],[-228,60],[-238,20],[-245,-15]],[[-262,90],[-262,60],[-262,-60],[-252,-105],[-245,-140]],[[472,-20],[472,10],[472,130],[462,175],[455,210]]];
  this.ramps=defs.map((d,k)=>{let pts=[];for(let i=0;i<d.length-1;i++){const s=lineSamples({x:d[i][0],z:d[i][1]},{x:d[i+1][0],z:d[i+1][1]},4);if(i)s.shift();pts.push(...s);}poly(pts);
   const climb=(()=>{let s=0;for(let i=1;i<=3;i++)s+=Math.hypot(d[i][0]-d[i-1][0],d[i][1]-d[i-1][1]);return s;})();for(const p of pts)p.y=.03+(FWY_Y-.03)*sstep(0,climb,p.s);
   // snap the merge end onto the freeway centreline sample
   const end=pts[pts.length-1];let bi=0,bd=1e9;this.fwy.forEach((q,i)=>{const dd=Math.hypot(q.x-end.x,q.z-end.z);if(dd<bd){bd=dd;bi=i;}});end.x=this.fwy[bi].x;end.z=this.fwy[bi].z;poly(pts);
   return{id:k,pts,G:{x:d[0][0],z:d[0][1]},fi:bi};});}
 /* ======== Crest Ridge winding road ======== */
 buildHillRoad(){const cp=[[-80,-350],[-80,-398],[-62,-430],[10,-452],[58,-482],[34,-508],[-50,-505],[-140,-522],[-186,-552],[-150,-588],[-62,-592],[6,-612],[18,-642],[-22,-668],[-80,-674]].map(([x,z])=>({x,z}));
  const P=poly(catmull(cp,4));this.summit={x:-80,z:-674,y:0};const H=96,L=P.len;const k=H/(L-30);for(const p of P)p.y=p.s<60?k*p.s*p.s/120:k*(p.s-30);this.summit.y=P[P.length-1].y;this.hill=P;
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];this.hrHash.add({a,b},Math.min(a.x,b.x)-24,Math.min(a.z,b.z)-24,Math.max(a.x,b.x)+24,Math.max(a.z,b.z)+24);}}
 hillDist(x,z){let best=1e9,y=0;for(const o of this.hrHash.at(x,z)){const r=segDist(x,z,o.a.x,o.a.z,o.b.x,o.b.z);if(r.d<best){best=r.d;y=lerp(o.a.y,o.b.y,r.t);}}return{d:best,y};}

 /* ======== terrain ======== */
 base(x,z){let h=0;if(z>BEACH)h=Math.max(-9,-(z-BEACH)*.05);if(x>QUAY&&z<=BEACH+2)h=-9;if(x>CANAL[0]&&x<CANAL[1]&&z>-420)h=Math.min(h,-7);
  if(z>BEACH&&x>QUAY)h=Math.min(h,-(z-BEACH)*.05-(x-QUAY)*.06);return h;}
 ridgeRaw(x,z){const n=95*(.78+.4*fbm(x/210+3,1.7))*sstep(0,1,1-(Math.abs(z+640)-30)/190)*sstep(0,1,(420-x)/140);
  const w=110*sstep(0,1,1-(Math.abs(x+780)-40)/240)*sstep(0,1,(520-z)/140);let h=Math.max(n,w);
  h+=60*sstep(-740,-820,z)+60*sstep(-800,-880,x);
  if(h>.01)h+=(fbm(x/70,z/70,4)-.5)*26*sstep(0,30,h)+(fbm(x/18,z/18,2)-.5)*3*sstep(0,10,h);return Math.max(0,h);}
 bakeTerrain(){const X0=this.TX0=-900,Z0=this.TZ0=-860,S=this.TS=5,NX=this.TNX=Math.ceil((640+900)/S)+1,NZ=this.TNZ=Math.ceil((60+860)/S)+1;const T=this.T=new Float32Array(NX*NZ),F=this.TF=new Uint8Array(NX*NZ);
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=X0+i*S,z=Z0+j*S;let h=this.ridgeRaw(x,z);
   const hr=this.hillDist(x,z);if(hr.d<24){const w=1-sstep(7,22,hr.d);h=h*(1-w)+(hr.y-.02)*w;}
   const ds=Math.hypot(x-this.summit.x,z-this.summit.z);if(ds<52){const w=1-sstep(36,52,ds);h=h*(1-w)+(this.summit.y-.02)*w;}
   if(h>2){const f=this.fwyDist(x,z);if(f.d<FWY_HW+5){if(h>FWY_Y-.5){h=Math.max(h,FWY_Y+10);F[j*NX+i]=1;}else F[j*NX+i]=2;}}
   T[j*NX+i]=h;}
  // portals: where the freeway passes between open air and the clamped roof
  let prev=null;for(let i=0;i<this.fwy.length;i++){const p=this.fwy[i],inT=this.ridgeAt(p.x,p.z)>FWY_Y+9;if(prev!==null&&inT!==prev){const q=this.fwy[Math.max(0,i-1)];this.portals.push({x:(p.x+q.x)/2,z:(p.z+q.z)/2,a:Math.atan2(p.x-q.x,p.z-q.z),s:p.s,enter:inT});}p.tun=inT;prev=inT;}
  // tunnel spans (by arc length)
  this.tunnels=[];let st=null;for(const p of this.fwy){if(p.tun&&st===null)st=p.s;if(!p.tun&&st!==null){this.tunnels.push([st,p.s]);st=null;}}if(st!==null)this.tunnels.push([st,this.fwy.len]);}
 ridgeAt(x,z){const fx=(x-this.TX0)/this.TS,fz=(z-this.TZ0)/this.TS;if(fx<0||fz<0||fx>=this.TNX-1||fz>=this.TNZ-1)return 0;const i=fx|0,j=fz|0,u=fx-i,v=fz-j,T=this.T,N=this.TNX;
  const a=T[j*N+i],b=T[j*N+i+1],c=T[(j+1)*N+i],d=T[(j+1)*N+i+1];return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
 terrainH(x,z){const r=this.ridgeAt(x,z);const b=this.base(x,z);return r>.02?Math.max(r,b):b;}
 inTunnel(x,z){if(this.ridgeAt(x,z)<FWY_Y+9)return false;return this.fwyDist(x,z).d<FWY_HW+3;}

 /* ======== blocks / districts ======== */
 district(cx,cz){if(cx>510)return'harbor';if(cx>257&&cx<393)return'canal';if(cz>310)return'beach';if(cz>200)return'strip';if(cx<-300)return'suburb';if(cx>-80&&cx<250&&cz<-20)return'downtown';if(cx>-80&&cx<30&&cz>90&&cz<200)return'park';return'midtown';}
 buildBlocks(){for(let i=0;i<XS.length-1;i++)for(let j=0;j<ZS.length-1;j++){const x0=XS[i]+RW,x1=XS[i+1]-RW,z0=ZS[j]+RW,z1=ZS[j+1]-RW;const cx=(x0+x1)/2,cz=(z0+z1)/2;
   if(XS[i]===250){this.blocks.push({x0,x1:CANAL[0],z0,z1,d:'canal',side:-1,i,j});this.blocks.push({x0:CANAL[1],x1,z0,z1,d:'canal',side:1,i,j});}
   else this.blocks.push({x0,x1,z0,z1,d:this.district(cx,cz),i,j});}
  this.blocks.push({x0:XS[9]+RW,x1:QUAY,z0:ZS[0]-RW-40,z1:ZS[7]+RW,d:'harbor',apron:1});
  this.blocks.push({x0:XS[0]-RW,x1:QUAY,z0:ZS[7]+RW,z1:BEACH,d:'boardwalk',walk:1});
  this.blocks.forEach((b,k)=>b.id=k);}
 blockAt(x,z){// fast lookup for grid blocks + special strips
  if(z>ZS[7]+RW&&z<BEACH&&x>XS[0]-RW&&x<QUAY)return(x>CANAL[0]&&x<CANAL[1])?null:this.blocks[this.blocks.length-1];
  if(x>XS[9]+RW&&x<QUAY&&z>ZS[0]-RW-40&&z<ZS[7]+RW)return this.blocks[this.blocks.length-2];
  if(x<XS[0]||x>XS[9]||z<ZS[0]||z>ZS[7])return null;let i=0;while(i<XS.length-2&&x>XS[i+1])i++;let j=0;while(j<ZS.length-2&&z>ZS[j+1])j++;
  if(x<XS[i]+RW||x>XS[i+1]-RW||z<ZS[j]+RW||z>ZS[j+1]-RW)return null;if(XS[i]===250&&x>CANAL[0]&&x<CANAL[1])return null;
  return this.blocks.find(b=>b.i===i&&b.j===j&&x>=b.x0&&x<=b.x1);}
 slabH(x,z){const b=this.blockAt(x,z);if(!b)return-99;return b.walk?(z>ZS[7]+RW+5?.36:SLAB):SLAB;}
 onStreet(x,z){if(x<XS[0]-RW-1||x>XS[9]+RW+1||z<ZS[0]-RW-1||z>ZS[7]+RW+1)return false;for(const X of XS)if(Math.abs(x-X)<RW)return true;for(const Z of ZS)if(Math.abs(z-Z)<RW)return true;return false;}
 excluded(x0,z0,x1,z1,m=0){for(const e of this.excl)if(x1>e.x0-m&&x0<e.x1+m&&z1>e.z0-m&&z0<e.z1+m)return true;return false;}
 nearHighway(x0,z0,x1,z1,m){for(let x=x0;x<=x1+.01;x+=Math.max(2,(x1-x0)/6))for(let z=z0;z<=z1+.01;z+=Math.max(2,(z1-z0)/6)){if(this.fwyDist(x,z).d<FWY_HW+m)return true;for(const r of this.ramps)for(let i=0;i<r.pts.length;i+=3){const p=r.pts[i];if(Math.abs(p.x-x)<8+m&&Math.abs(p.z-z)<8+m)return true;}}return false;}

 /* ======== POIs, stunt ramps (placed before buildings so lots stay clear) ======== */
 buildPOIs(){const P=this.pois=[];const add=(id,kind,name,x,z,o={})=>{const p={id,kind,name,x,z,...o};P.push(p);if(o.clear)this.excl.push({x0:x-o.clear,x1:x+o.clear,z0:z-o.clear,z1:z+o.clear});return p;};
  add('home','home','SAFEHOUSE',85,410.5,{car:[85,415,-Math.PI/2],face:Math.PI});
  add('garage','garage','BAYSIDE MOTORS',-135,99.5,{car:[-135,95.5,Math.PI/2],sign:'MOTORS'});
  add('spray','spray',"SPRAY 'N' SHINE",85,195,{sign:'SPRAY'});
  add('police','police','BAY PD · PRECINCT 9',-135,-29.5,{sign:'POLICE'});
  add('taxi1','taxi','CABBY DEPOT · DOWNTOWN',195,-120.5,{car:[195,-124.5,Math.PI/2],sign:'TAXI'});
  add('taxi2','taxi','CABBY DEPOT · WESTSIDE',-355,319.5,{car:[-355,315.5,Math.PI/2],sign:'TAXI'});
  add('deliv1','delivery','SALT DOCK COURIERS',519.5,60,{car:[515.5,60,Math.PI]});
  add('deliv2','delivery','PALMWOOD PARCELS',-455,99.5,{car:[-455,95.5,Math.PI/2]});
  add('heist1','heist','BRINKLINE DEPOT',85,-230.5,{});
  add('boost1','boost','DOCK 9 EXPORTS',519.5,-150,{});
  add('race1','race','DOWNTOWN DASH',30,-150,{});
  add('race2','race','PORT SALT SPRINT',400,40,{});
  add('race3','race','LOOP FURY',472,-5,{});
  add('trial1','trial','CREST CLIMB',-80,-345,{});
  add('trial2','trial','OCEAN DRIVE RUN',-470,420,{});
  add('photo','photo','SNAP HAPPY',-25,99.5,{});
  add('escape','escape','HOT PURSUIT',195,300.5,{});
  // unique stunt ramps: [x,z,heading,len,height]
  this.stunts=[[284,150,Math.PI/2,12,2.6,'CANAL LEAP'],[-200,433,0,10,2.2,'BOARDWALK BOOST'],[-80,-644,0,10,2.4,'RIDGE DROP'],[575,250,Math.PI,11,2.4,'CONTAINER HOP'],[-62,150,Math.PI/2,9,1.8,'FOUNTAIN FLIP'],[-470,236,-Math.PI/2,10,2.2,'PALMWOOD POP']].map(([x,z,a,len,h,name],k)=>({id:k,x,z,a,len,h,name,done:false}));
  for(const s of this.stunts){const ex=Math.abs(Math.sin(s.a))*s.len+6,ez=Math.abs(Math.cos(s.a))*s.len+6;this.excl.push({x0:s.x-ex,x1:s.x+ex,z0:s.z-ez,z1:s.z+ez});}
  this.excl.push({x0:-40,x1:-10,z0:97,z1:193});}

 /* ======== decks: freeway, ramps, bridges, piers, stunt wedges ======== */
 addDeckPoly(P,hw,rail,kind,o={}){const d={P,hw,rail,kind,...o};this.decksAll.push(d);for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];const L=Math.hypot(b.x-a.x,b.z-a.z);if(L<1e-4)continue;
   const seg={ax:a.x,az:a.z,ay:a.y,bx:b.x,bz:b.z,by:b.y,len:L,dx:(b.x-a.x)/L,dz:(b.z-a.z)/L,hw,rail,kind,deck:d};this.decks.push(seg);
   this.dHash.add(seg,Math.min(a.x,b.x)-hw-1,Math.min(a.z,b.z)-hw-1,Math.max(a.x,b.x)+hw+1,Math.max(a.z,b.z)+hw+1);}return d;}
 bridgeY(x){const t=(x-(CANAL[0]-6))/(CANAL[1]-CANAL[0]+12);return t<=0||t>=1?.03:.03+1.9*Math.sin(Math.PI*t);}
 buildDecks(){this.addDeckPoly(this.fwy,FWY_HW,true,'fwy');for(const r of this.ramps)this.addDeckPoly(r.pts,6.2,true,'ramp');
  for(const Z of ZS){const P=[];for(let x=CANAL[0]-6;x<=CANAL[1]+6.01;x+=3)P.push({x,z:Z,y:this.bridgeY(x)});poly(P);this.addDeckPoly(P,RW,true,'bridge',{Z});}
  for(const Z of[-130,90]){const P=poly([{x:QUAY-4,z:Z,y:.6},{x:QUAY+90,z:Z,y:.6}]);this.addDeckPoly(P,7,false,'pier');}
  for(const s of this.stunts){const fx=Math.sin(s.a),fz=Math.cos(s.a),g=this.groundBase(s.x,s.z);s.y0=g;const P=poly([{x:s.x-fx*s.len/2,z:s.z-fz*s.len/2,y:g},{x:s.x+fx*s.len/2,z:s.z+fz*s.len/2,y:g+s.h}]);this.addDeckPoly(P,2.8,false,'stunt',{stunt:s});s.P=P;}}
 // ground without decks
 groundBase(x,z){const t=this.terrainH(x,z),s=this.slabH(x,z);return Math.max(t,s);}

 /* ======== road graph ======== */
 addNode(x,z,kind,o={}){const n={id:this.nodes.length,x,z,y:o.y??.03,kind,edges:[],...o};this.nodes.push(n);return n;}
 addEdge(a,b,pts,kind,o={}){poly(pts);const e={id:this.edges.length,a:a.id,b:b.id,pts,len:pts.len,kind,lanes:kind==='fwy'?[3,8]:kind==='street'?[3.5]:[3],speed:kind==='fwy'?27:kind==='ramp'?19:kind==='hill'?13:15,...o};
  this.edges.push(e);a.edges.push(e.id);b.edges.push(e.id);for(let i=0;i<pts.length-1;i++){const p=pts[i],q=pts[i+1];this.eHash.add({e,i},Math.min(p.x,q.x)-12,Math.min(p.z,q.z)-12,Math.max(p.x,q.x)+12,Math.max(p.z,q.z)+12);}return e;}
 buildGraph(){const NX=XS.length,NZ=ZS.length,G=[];for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++)G[i*NZ+j]=this.addNode(XS[i],ZS[j],'grid',{i,j});
  const rampG=this.ramps.map(r=>r.G);
  const streetPts=(a,b)=>{const out=[];const L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(L/(a.z===b.z&&((a.x<CANAL[0]&&b.x>CANAL[1])||(b.x<CANAL[0]&&a.x>CANAL[1]))?3:10)));for(let k=0;k<=n;k++){const x=lerp(a.x,b.x,k/n),z=lerp(a.z,b.z,k/n);out.push({x,z,y:a.z===b.z?this.bridgeY(x):.03});}return out;};
  const link=(a,b)=>{// split at ramp junctions lying on this segment
   const mids=rampG.map((g,k)=>({g,k})).filter(({g})=>(a.x===b.x&&Math.abs(g.x-a.x)<.5&&g.z>Math.min(a.z,b.z)&&g.z<Math.max(a.z,b.z))||(a.z===b.z&&Math.abs(g.z-a.z)<.5&&g.x>Math.min(a.x,b.x)&&g.x<Math.max(a.x,b.x)));
   let prev=a;for(const{g,k}of mids.sort((p,q)=>Math.hypot(p.g.x-a.x,p.g.z-a.z)-Math.hypot(q.g.x-a.x,q.g.z-a.z))){const n=this.addNode(g.x,g.z,'ramp');this.ramps[k].node=n;this.addEdge(prev,n,streetPts(prev,n),'street');prev=n;}
   this.addEdge(prev,b,streetPts(prev,b),'street',{bridge:a.z===b.z&&a.x<CANAL[0]&&b.x>CANAL[1]});};
  for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){if(i<NX-1)link(G[i*NZ+j],G[(i+1)*NZ+j]);if(j<NZ-1)link(G[i*NZ+j],G[i*NZ+j+1]);}
  for(const n of G)n.light=n.edges.length>=3;
  // freeway loop split at merge points
  const F=this.ramps.map(r=>({r,i:r.fi})).sort((p,q)=>p.i-q.i);const fn=F.map(f=>{const p=this.fwy[f.i];const n=this.addNode(p.x,p.z,'fwy',{y:FWY_Y});f.r.fnode=n;return n;});
  for(let k=0;k<F.length;k++){const i0=F[k].i,i1=F[(k+1)%F.length].i;const pts=[];if(i1>i0){for(let i=i0;i<=i1;i++)pts.push({...this.fwy[i]});}else{for(let i=i0;i<this.fwy.length;i++)pts.push({...this.fwy[i]});for(let i=1;i<=i1;i++)pts.push({...this.fwy[i]});}
   this.addEdge(fn[k],fn[(k+1)%F.length],pts.map(p=>({x:p.x,z:p.z,y:FWY_Y})),'fwy');}
  for(const r of this.ramps)this.addEdge(r.node,r.fnode,r.pts.map(p=>({x:p.x,z:p.z,y:p.y})),'ramp');
  // hill road
  const top=this.addNode(this.summit.x,this.summit.z,'summit',{y:this.summit.y});const start=G[XS.indexOf(-80)*NZ+0];this.addEdge(start,top,this.hill.map(p=>({x:p.x,z:p.z,y:p.y})),'hill');
  this.gridNode=(i,j)=>G[i*NZ+j];}
 edgeAt(e,s,o={}){return polyAt(e.pts,s,o);}
 // closest point on any road edge
 nearestEdge(x,z,maxD=60){let best=null,bd=maxD;for(const r of[0,1]){const R=r?maxD:40;const list=this._ne||(this._ne=[]);this.eHash.near(x-R,z-R,x+R,z+R,list);
   for(const{e,i}of list){const p=e.pts[i],q=e.pts[i+1];const t=segDist(x,z,p.x,p.z,q.x,q.z);if(t.d<bd){bd=t.d;best={e,s:p.s+t.t*(q.s-p.s),d:t.d};}}if(best)break;}return best;}
 // A* between nodes
 astar(from,to){if(from===to)return[from];const N=this.nodes,open=new Set([from]),g=new Map([[from,0]]),f=new Map([[from,0]]),came=new Map();const h=n=>Math.hypot(N[n].x-N[to].x,N[n].z-N[to].z);let guard=0;
  while(open.size&&guard++<4000){let cur=-1,cf=1e18;for(const k of open){const v=f.get(k);if(v<cf){cf=v;cur=k;}}if(cur===to){const p=[to];let c=cur;while(came.has(c)){c=came.get(c).n;p.unshift(c);}return p;}
   open.delete(cur);for(const eid of N[cur].edges){const e=this.edges[eid],nb=e.a===cur?e.b:e.a;const ng=g.get(cur)+e.len;if(ng<(g.get(nb)??1e18)){came.set(nb,{n:cur,e:eid});g.set(nb,ng);f.set(nb,ng+h(nb));open.add(nb);}}}return null;}
 edgeBetween(a,b){for(const id of this.nodes[a].edges){const e=this.edges[id];if((e.a===a&&e.b===b)||(e.a===b&&e.b===a))return e;}return null;}
 // route polyline (array of {x,z,y}) from point A to point B along roads
 route(ax,az,bx,bz){const A=this.nearestEdge(ax,az,90),B=this.nearestEdge(bx,bz,90);if(!A||!B)return{pts:[{x:ax,z:az},{x:bx,z:bz}],len:Math.hypot(bx-ax,bz-az)};
  const seg=(e,s0,s1)=>{const out=[],st=s0<s1?1:-1;out.push(polyAt(e.pts,s0,{}));for(const p of(st>0?e.pts:[...e.pts].reverse()))if(st>0?(p.s>s0&&p.s<s1):(p.s<s0&&p.s>s1))out.push({x:p.x,z:p.z,y:p.y});out.push(polyAt(e.pts,s1,{}));return out;};
  if(A.e===B.e)return{pts:seg(A.e,A.s,B.s),len:Math.abs(A.s-B.s)};
  let best=null,bl=1e18;for(const[na,da]of[[A.e.a,A.s],[A.e.b,A.e.len-A.s]])for(const[nb,db]of[[B.e.a,B.s],[B.e.b,B.e.len-B.s]]){const p=this.astar(na,nb);if(!p)continue;let L=da+db;for(let k=1;k<p.length;k++)L+=this.edgeBetween(p[k-1],p[k]).len;if(L<bl){bl=L;best={p,na,nb};}}
  if(!best)return{pts:[{x:ax,z:az},{x:bx,z:bz}],len:Math.hypot(bx-ax,bz-az)};
  const out=seg(A.e,A.s,best.na===A.e.a?0:A.e.len);for(let k=1;k<best.p.length;k++){const e=this.edgeBetween(best.p[k-1],best.p[k]);const fw=e.a===best.p[k-1];out.push(...seg(e,fw?0:e.len,fw?e.len:0).slice(1));}
  out.push(...seg(B.e,best.nb===B.e.a?0:B.e.len,B.s).slice(1));return{pts:out,len:bl,nodes:best.p};}

 /* ======== buildings & props ======== */
 addSolid(x0,z0,x1,z1,y0,y1,kind,o){const s={x0:Math.min(x0,x1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),z1:Math.max(z0,z1),y0,y1,kind,...o};this.solids.push(s);return s;}
 box(x,z,w,d,h,y0,style,col,o={}){const b={x,z,w,d,h,y0,style,col,seed:this.R()*1000,lit:o.lit??(.3+this.R()*.35),...o};this.bld.push(b);if(!o.nosolid)this.addSolid(x-w/2,z-d/2,x+w/2,z+d/2,y0-2,y0+h,'bld');return b;}
 buildStuff(){const R=this.R,pick=a=>a[R()*a.length|0];
  const PASTEL=[0xf6c1d0,0xa8e6d8,0xfff1c9,0xb8d8ff,0xffd2a8,0xe9d5ff,0xffffff,0xc6f0e0,0xffb8c6];const CONC=[0xbfb8ad,0xa7a39b,0xd6d0c4,0x8f8b85,0xc9c2b5,0xe2dccf];const GLASS=[0x3a6f8f,0x2f8a8a,0x4a5f8a,0x5a7f9a,0x8a7a4a,0x3f5a6a];const BRICK=[0x9a5a45,0x8a4a3a,0xa86a50,0x7a5040];
  const SHOP=[0xff9a8a,0xffd36e,0x7fd6c8,0xd8a8ff,0xffffff,0xa0c8ff,0xffb0d8];
  for(const b of this.blocks){if(b.walk||b.d==='canal'||b.d==='park')continue;const ix0=b.x0+WALK,ix1=b.x1-WALK,iz0=b.z0+WALK,iz1=b.z1-WALK;const W=ix1-ix0,D=iz1-iz0;
   const ok=(x0,z0,x1,z1)=>!this.excluded(x0,z0,x1,z1,2)&&!this.nearHighway(x0,z0,x1,z1,4);
   if(b.d==='harbor'){this.harbor(b,ok);continue;}
   if(b.d==='suburb'){for(let x=ix0+8;x<ix1-6;x+=19)for(const side of[0,1]){const z=side?iz1-9:iz0+9,w=12+R()*3,d=10+R()*2,h=4.6+R()*1.6;if(!ok(x-w/2,z-d/2,x+w/2,z+d/2))continue;
      this.box(x,z,w,d,h,SLAB,3,pick(PASTEL),{lit:.5});this.roofs.push({x,z,w:w+1,d:d+1,y:SLAB+h,h:2.4+R(),ry:R()<.5?0:Math.PI/2,col:pick([0x7a3a2a,0x5a5a62,0x9a5a3a,0x3a4a5a])});
      if(R()<.7)this.trees.push({x:x+(R()-.5)*8,z:side?z-9:z+9,s:.8+R()*.5});if(R()<.4)this.palms.push({x:x+8,z:side?z-8:z+8,s:.8+R()*.4});}continue;}
   if(b.d==='beach'){// strips either side of the freeway: motels/diners behind, deco hotels on Ocean Drive
    for(const[z0,z1,fz]of[[iz0,349,-1],[382,iz1,1]]){if(z1-z0<12)continue;const n=Math.max(2,Math.round(W/34));const pw=W/n;for(let a=0;a<n;a++){const gap=2+R()*3;const x0=ix0+a*pw+gap,x1=ix0+(a+1)*pw-gap;let zz0=z0+(fz>0?0:1),zz1=z1-(fz>0?1:0);
     if(fz>0&&R()<.25){zz0+=4;}if(!ok(x0,zz0,x1,zz1)){if(R()<.7)this.palms.push({x:(x0+x1)/2,z:(zz0+zz1)/2,s:1});continue;}this.parcel('beach',(x0+x1)/2,(zz0+zz1)/2,x1-x0,zz1-zz0,a===0?-1:1,fz,{PASTEL,CONC,GLASS,BRICK,SHOP,pick});}}continue;}
   // split the lot into parcels
   const n=b.d==='downtown'?(W>70?2:1):b.d==='strip'?3:2;const m=b.d==='downtown'?(D>70?2:1):2;const pw=W/n,pd=D/m;
   for(let a=0;a<n;a++)for(let c=0;c<m;c++){const px0=ix0+a*pw,pz0=iz0+c*pd,px1=px0+pw,pz1=pz0+pd;const gap=b.d==='downtown'?2.5:1.5+R()*2.5;const x0=px0+gap,x1=px1-gap,z0=pz0+gap,z1=pz1-gap;
    if(!ok(x0,z0,x1,z1)){if(R()<.6)this.trees.push({x:(px0+px1)/2,z:(pz0+pz1)/2,s:1});continue;}
    const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;const faceZ=c===0?-1:1,faceX=a===0?-1:1;
    this.parcel(b.d,cx,cz,w,d,faceX,faceZ,{PASTEL,CONC,GLASS,BRICK,SHOP,pick});}}
  this.decorate();}
 parcel(dist,cx,cz,w,d,faceX,faceZ,C){const R=this.R,pick=C.pick;
  if(dist==='downtown'){const near=1-sstep(80,320,Math.hypot(cx-80,cz+180));const H=45+near*110+R()*45;const podH=10+R()*8;
   this.box(cx,cz,w,d,podH,SLAB,5,pick(C.CONC),{lit:.6});const ins=3+R()*5;const tw=w-ins*2,td=d-ins*2;const glass=R()<.65;
   const main=this.box(cx,cz,tw,td,H-podH,SLAB+podH,glass?0:1,glass?pick(C.GLASS):pick(C.CONC));let top=SLAB+H;
   if(H>90&&R()<.75){const cw=tw*(.55+R()*.2),cd=td*(.55+R()*.2),ch=8+R()*16;this.box(cx,cz,cw,cd,ch,top,glass?0:1,main.col);top+=ch;}
   const k=R();if(k<.35)this.roofProps.push({t:'heli',x:cx,z:cz,y:top,s:Math.min(tw,td)*.4});else if(k<.75)this.roofProps.push({t:'spire',x:cx,z:cz,y:top,s:8+R()*18});else this.roofProps.push({t:'ac',x:cx,z:cz,y:top,s:Math.min(tw,td)*.5});
   this.shopFront(cx,cz,w,d,faceX,faceZ,SLAB+podH*.55,R()<.4);return;}
  if(dist==='midtown'){const H=14+R()*34;const st=R()<.35?5:R()<.5?1:5;const col=st===5?pick(R()<.5?C.BRICK:C.CONC):pick(C.CONC);this.box(cx,cz,w,d,H,SLAB,R()<.3?6:st,col);
   if(R()<.5)this.roofProps.push({t:'ac',x:cx,z:cz,y:SLAB+H,s:Math.min(w,d)*.4});else if(R()<.4)this.roofProps.push({t:'tank',x:cx+w*.2,z:cz,y:SLAB+H,s:3});
   if(R()<.3&&H<30)this.boards.push(this.facing(cx,cz,w,d,faceX,faceZ,SLAB+H+5.5,14,6,'board'));this.shopFront(cx,cz,w,d,faceX,faceZ,SLAB+4.5,R()<.5);return;}
  if(dist==='strip'){const H=6+R()*10;this.box(cx,cz,w,d,H,SLAB,6,pick(C.SHOP),{lit:.75});this.shopFront(cx,cz,w,d,faceX,faceZ,SLAB+H*.62,true,true);
   if(R()<.45)this.boards.push(this.facing(cx,cz,w,d,faceX,faceZ,SLAB+H+4.5,12,5,'board'));return;}
  if(dist==='beach'){// deco hotels on the ocean side, motels/diners behind the freeway
   if(faceZ>0){const H=13+R()*22;const st=2;this.box(cx,cz,w*.92,d,H,SLAB,st,pick(C.PASTEL),{lit:.65});this.roofProps.push({t:'deco',x:cx,z:cz,y:SLAB+H,s:Math.min(w,d)*.3,col:pick(C.PASTEL)});this.shopFront(cx,cz,w*.92,d,faceX,faceZ,SLAB+H-3.2,true,true);
    if(R()<.5)this.palms.push({x:cx-w*.5,z:cz+d/2+2,s:1.1});}
   else{const H=6+R()*7;this.box(cx,cz,w,d,H,SLAB,6,pick(C.SHOP),{lit:.7});this.shopFront(cx,cz,w,d,faceX,faceZ,SLAB+H*.6,true,true);}
   return;}}
 // a sign/board placed on the facade facing the nearest road
 facing(cx,cz,w,d,fx,fz,y,sw,sh,type){const R=this.R;const useZ=R()<.6;const x=useZ?cx+(R()-.5)*w*.3:cx+fx*(w/2+.3),z=useZ?cz+fz*(d/2+.3):cz+(R()-.5)*d*.3;const ry=useZ?(fz>0?0:Math.PI):(fx>0?Math.PI/2:-Math.PI/2);
  return{x,y,z,ry,w:Math.min(sw,useZ?w*.8:d*.8),h:sh,idx:(R()*8|0)+(type==='board'?8:0),type};}
 shopFront(cx,cz,w,d,fx,fz,y,neon,many){if(!neon)return;const n=many?1+(this.R()<.5?1:0):1;for(let i=0;i<n;i++){const s=this.facing(cx,cz,w,d,fx,fz,y+i*2.6,Math.min(10,w*.7),2.4,'neon');s.idx=this.R()*8|0;this.signs.push(s);}}
 harbor(b,ok){const R=this.R;const CC=[0xc0392b,0x2b6cb0,0x2f855a,0xd69e2e,0x805ad5,0xdd6b20,0x718096,0x0e7490];
  // warehouses along the street side, container yard + cranes by the quay
  for(let z=b.z0+20;z<b.z1-40;z+=75){const w=34+R()*10,d=44+R()*16,x=b.x0+WALK+4+w/2;if(ok(x-w/2,z,x+w/2,z+d))this.box(x,z+d/2,w,d,10+R()*5,SLAB,4,pick2(R,[0x8a9aa8,0xa89a88,0x6a7a8a,0xb0a890]),{lit:.25});}
  for(let z=b.z0+30;z<b.z1-20;z+=16){if(R()<.25)continue;for(let x=575;x<612;x+=13.5){if(!ok(x-7,z-2,x+7,z+2)||R()<.2)continue;const n=1+(R()*3|0);for(let k=0;k<n;k++)this.containers.push({x,z,y:SLAB+k*2.6,col:CC[R()*CC.length|0],ry:0});this.addSolid(x-6.1,z-1.3,x+6.1,z+1.3,SLAB-1,SLAB+n*2.6,'cont');}}
  for(const z of[-280,-30,200]){this.cranes.push({x:QUAY-14,z});for(const dx of[-9,9])for(const dz of[-7,7])this.addSolid(QUAY-14+dx-1,z+dz-1,QUAY-14+dx+1,z+dz+1,0,40,'crane');}}
 decorate(){const R=this.R;
  // street lamps + hydrants along every street edge, palms on the coastal strips
  for(const e of this.edges){if(e.kind!=='street')continue;const a=this.nodes[e.a],b=this.nodes[e.b];const L=e.len,dx=(b.x-a.x)/L,dz=(b.z-a.z)/L;
   for(let s=18;s<L-14;s+=34){const x=a.x+dx*s,z=a.z+dz*s;if(e.bridge&&x>CANAL[0]-8&&x<CANAL[1]+8)continue;for(const side of[-1,1]){if((Math.floor(s/34)+(side>0?1:0))%2)continue;const ox=-dz*side*(RW+.9),oz=dx*side*(RW+.9);const lx=x+ox,lz=z+oz;if(!this.blockAt(lx,lz))continue;
     this.lamps.push({x:lx,z:lz,ry:Math.atan2(-ox,-oz)});this.addSolid(lx-.18,lz-.18,lx+.18,lz+.18,0,7,'pole');}}
   const coast=a.z===420&&b.z===420,palmSt=(a.z===b.z&&(a.z===310||a.z===200))||(a.x===b.x&&a.z>=200);
   if(coast||palmSt)for(let s=9;s<L-8;s+=coast?16:28)for(const side of[-1,1]){const x=a.x+dx*s-dz*side*(RW+3.3),z=a.z+dz*s+dx*side*(RW+3.3);if(this.blockAt(x,z)&&!this.excluded(x,z,x,z,1)&&!(this.fwyDist(x,z).d<FWY_HW+2)){this.palms.push({x,z,s:.9+R()*.45});this.addSolid(x-.3,z-.3,x+.3,z+.3,0,9,'palm');}}
   if(R()<.5){const s=L*.5,x=a.x+dx*s-dz*(RW+1.2),z=a.z+dz*s+dx*(RW+1.2);if(this.blockAt(x,z))this.hydrants.push({x,z});}}
  // boardwalk: palms, benches, beach umbrellas, lifeguard towers
  for(let x=-510;x<QUAY-10;x+=22){if(x>CANAL[0]-4&&x<CANAL[1]+4)continue;this.palms.push({x:x+R()*4,z:BEACH-2.2,s:1+R()*.4});if(R()<.5)this.benches.push({x:x+8,z:BEACH-4.5,ry:Math.PI});}
  for(let i=0;i<70;i++){const x=-500+R()*1120,z=BEACH+8+R()*16;if(x>CANAL[0]-6&&x<CANAL[1]+6)continue;this.umbrellas.push({x,z,col:[0xff5a6e,0x34c3d8,0xffd23f,0xffffff,0x7b5cff,0xff8a3d][R()*6|0],s:.9+R()*.3});}
  for(const x of[-380,-120,160,470]){this.towers.push({x,z:BEACH+20});this.addSolid(x-1.8,BEACH+18.2,x+1.8,BEACH+21.8,-2,5,'tower');}
  // canal railings with gaps for the stunt ramp, promenade trees
  for(const X of[CANAL[0],CANAL[1]])for(let j=0;j<ZS.length-1;j++){const z0=ZS[j]+RW+.5,z1=ZS[j+1]-RW-.5;const cut=this.stunts[0];let segs=[[z0,z1]];if(X===CANAL[0]&&cut.z>z0&&cut.z<z1)segs=[[z0,cut.z-4],[cut.z+4,z1]];
   for(const[a,b]of segs){this.railings.push({x0:X,z0:a,x1:X,z1:b});this.addSolid(X-.25,a,X+.25,b,-8,SLAB+1.05,'rail');}
   for(let z=z0+6;z<z1-4;z+=14)this.trees.push({x:X+(X===CANAL[0]?-8:8),z,s:.85+R()*.3});}
  // park: fountain, palms, trees, benches
  const pk=this.blocks.find(b=>b.d==='park');if(pk){const cx=(pk.x0+pk.x1)/2,cz=(pk.z0+pk.z1)/2;this.fountains.push({x:cx,z:cz,r:9});this.addSolid(cx-9,cz-9,cx+9,cz+9,0,SLAB+.8,'fountain');
   for(let i=0;i<26;i++){const a=R()*Math.PI*2,r=18+R()*30;const x=cx+Math.cos(a)*r*.9,z=cz+Math.sin(a)*r;if(Math.abs(x-cx)<5||Math.abs(z-cz)<5||Math.abs(z-150)<4)continue;if(x>pk.x0+6&&x<pk.x1-6&&z>pk.z0+6&&z<pk.z1-6)(R()<.5?this.palms:this.trees).push({x,z,s:.9+R()*.4});}
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;this.benches.push({x:cx+Math.cos(a)*14,z:cz+Math.sin(a)*14,ry:-a+Math.PI/2});}}
  // foothill scatter + ridge pines
  for(let i=0;i<900;i++){const x=-640+R()*1060,z=-760+R()*400;const h=this.terrainH(x,z);if(z>-360&&x>-530)continue;if(this.hillDist(x,z).d<10||this.fwyDist(x,z).d<FWY_HW+6||Math.hypot(x-this.summit.x,z-this.summit.z)<40)continue;
   const sl=Math.abs(this.terrainH(x+3,z)-h)+Math.abs(this.terrainH(x,z+3)-h);if(sl>3.2)continue;(h>14?this.pines:this.trees).push({x,z,y:h,s:.8+R()*.7});}
  for(let i=0;i<220;i++){const x=-760+R()*240,z=-300+R()*720;const h=this.terrainH(x,z);if(h<1||this.blockAt(x,z))continue;const sl=Math.abs(this.terrainH(x+3,z)-h)+Math.abs(this.terrainH(x,z+3)-h);if(sl>3.2)continue;this.pines.push({x,z,y:h,s:.8+R()*.7});}
  // hill road lamps
  for(let s=30;s<this.hill.len-20;s+=42){const p=polyAt(this.hill,s,{});const ox=-p.tz*8,oz=p.tx*8;this.lamps.push({x:p.x+ox,z:p.z+oz,y:this.terrainH(p.x+ox,p.z+oz),ry:Math.atan2(-ox,-oz)});}
  // traffic lights at lit grid junctions
  for(const n of this.nodes){if(!n.light)continue;for(const[sx,sz]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const x=n.x+sx*(RW+1.2),z=n.z+sz*(RW+1.2);if(!this.blockAt(x,z))continue;
    // each corner pole faces traffic approaching along one axis (the lane on that corner's right side)
    const axis=sx*sz>0?'z':'x';const ry=axis==='z'?(sz>0?0:Math.PI):(sx>0?Math.PI/2:-Math.PI/2);this.tlights.push({node:n.id,x,z,ry,axis});this.addSolid(x-.2,z-.2,x+.2,z+.2,0,6,'pole');}}
  // freeway pillars (skip roads), jersey barriers handled at render
  for(const D of this.decksAll){if(D.kind!=='fwy'&&D.kind!=='ramp')continue;for(let s=10;s<D.P.len;s+=D.kind==='fwy'?30:22){const p=polyAt(D.P,s,{});const g=this.groundBase(p.x,p.z);if(p.y-g<4||this.inTunnel(p.x,p.z))continue;if(this.onStreet(p.x,p.z))continue;
    this.pillars.push({x:p.x,z:p.z,y0:g,y1:p.y-1.1,a:Math.atan2(p.tx,p.tz),w:D.kind==='fwy'?2.6:1.8,cap:D.hw*1.6});this.addSolid(p.x-1.3,p.z-1.3,p.x+1.3,p.z+1.3,g-1,p.y-1.2,'pillar');}}
  // boats in the harbour + off the beach
  this.boats.push({t:'ship',x:QUAY+40,z:-160,ry:0},{t:'ship',x:QUAY+42,z:60,ry:0},{t:'tug',x:QUAY+90,z:-40,ry:.6},{t:'tug',x:QUAY+70,z:330,ry:2.1},{t:'yacht',x:200,z:530,ry:1.3},{t:'yacht',x:-120,z:560,ry:-.4},{t:'yacht',x:420,z:600,ry:.2},{t:'sail',x:-330,z:540,ry:.9},{t:'sail',x:40,z:620,ry:2.5},{t:'sail',x:620,z:520,ry:-1});
  // observatory
  this.observatory={x:this.summit.x-22,z:this.summit.z-14,y:this.summit.y};this.addSolid(this.observatory.x-9,this.observatory.z-9,this.observatory.x+9,this.observatory.z+9,this.summit.y-2,this.summit.y+14,'bld');}

 /* ======== race + trial routes ======== */
 buildRaces(){const node=(x,z)=>{let b=null,bd=1e9;for(const n of this.nodes){const d=Math.hypot(n.x-x,n.z-z);if(d<bd){bd=d;b=n;}}return b.id;};
  const chain=ws=>{const ids=ws.map(([x,z])=>node(x,z));let path=[ids[0]];for(let i=1;i<ids.length;i++){const p=this.astar(ids[i-1],ids[i]);path.push(...p.slice(1));}const pts=[];for(let k=1;k<path.length;k++){const e=this.edgeBetween(path[k-1],path[k]);const fw=e.a===path[k-1];const P=fw?e.pts:[...e.pts].reverse();for(const p of P){const q=pts[pts.length-1];if(!q||Math.hypot(q.x-p.x,q.z-p.z)>.5)pts.push({x:p.x,z:p.z,y:p.y});}}return poly(pts);};
  const cps=(P,step)=>{const o=[];for(let s=step;s<P.len-step*.4;s+=step){const p=polyAt(P,s,{});o.push({x:p.x,z:p.z,y:p.y,a:Math.atan2(p.tx,p.tz)});}const e=polyAt(P,P.len,{});o.push({x:e.x,z:e.z,y:e.y,a:Math.atan2(e.tx,e.tz),fin:true});return o;};
  this.races={race1:chain([[30,-130],[30,-350],[250,-350],[250,-20],[140,-20],[140,90],[-80,90],[-80,-240],[30,-240],[30,-130]]),
   race2:chain([[400,90],[400,-350],[510,-350],[510,420],[250,420],[250,310],[400,310],[400,90]]),
   race3:chain([[472,-20],[455,210],[-245,-140],[-262,90],[-190,90],[-190,310],[-80,310],[-80,420],[510,420],[510,-20],[472,-20]]),
   trial1:poly(this.hill.map(p=>({x:p.x,z:p.z,y:p.y}))),
   trial2:chain([[-520,420],[510,420],[510,310],[-520,310],[-520,420]])};
  this.raceCP={};for(const k in this.races)this.raceCP[k]=cps(this.races[k],k.startsWith('trial')?(k==='trial1'?70:130):150);}

 /* ======== physics queries ======== */
 // ground height under (x,z) for a body currently at height y; sets this.gDeck / this.gKind
 groundAt(x,z,y){let best=-1e9,deck=null;const t=this.terrainH(x,z);if(t<=y+STEP){best=t;}const s=this.slabH(x,z);if(s>best&&s<=y+STEP)best=s;
  const segs=this.dHash.at(x,z);for(let i=0;i<segs.length;i++){const g=segs[i];const px=x-g.ax,pz=z-g.az,u=px*g.dx+pz*g.dz;if(u<-.3||u>g.len+.3)continue;const lat=Math.abs(px*g.dz-pz*g.dx);if(lat>g.hw+.4)continue;
   const h=g.ay+(g.by-g.ay)*cl(u/g.len,0,1);if(h<=y+STEP&&h>best){best=h;deck=g;}}
  if(best<-1e8){best=Math.max(t,s);}this.gDeck=deck;return best;}
 surface(x,z,y){if(this.gDeck)return'road';if(y<WL-.3)return'water';if(z>BEACH-1&&this.terrainH(x,z)<.5)return'sand';if(this.onStreet(x,z))return'road';if(this.slabH(x,z)>0)return'walk';if(this.hillDist(x,z).d<6.5)return'road';return this.terrainH(x,z)>1?'dirt':'grass';}
 // deck side rails: returns push {nx,nz,pen} when a body at (x,z,y) radius r leaves the sides of a railed deck it is riding
 rail(x,z,y,r,deck){if(!deck||!deck.rail)return null;const g=deck,px=x-g.ax,pz=z-g.az,u=px*g.dx+pz*g.dz,lat=px*g.dz-pz*g.dx,h=g.ay+(g.by-g.ay)*cl(u/g.len,0,1);
  if(Math.abs(lat)<g.hw-r)return null;if(h-this.groundBase(x,z)<1.3&&!this.inTunnel(x,z))return null;
  for(const o of this.dHash.at(x,z)){if(o.deck===g.deck)continue;const qx=x-o.ax,qz=z-o.az,uu=qx*o.dx+qz*o.dz;if(uu<0||uu>o.len)continue;const ll=Math.abs(qx*o.dz-qz*o.dx);const hh=o.ay+(o.by-o.ay)*cl(uu/o.len,0,1);if(ll<o.hw-.5&&Math.abs(hh-y)<1.6)return null;}
  // also allow overlap with the next/prev segment of the same deck (corners)
  for(const o of this.dHash.at(x,z)){if(o.deck!==g.deck||o===g)continue;const qx=x-o.ax,qz=z-o.az,uu=qx*o.dx+qz*o.dz;if(uu<0||uu>o.len)continue;if(Math.abs(qx*o.dz-qz*o.dx)<o.hw-r)return null;}
  const s=Math.sign(lat);return{nx:-g.dz*s,nz:g.dx*s,pen:Math.abs(lat)-(g.hw-r)};}
 // push a vertical circle out of solids; returns total push and the last normal in out
 collide(x,z,r,y0,y1,out,list){out.px=0;out.pz=0;out.hit=false;out.top=-1e9;const S=this.sHash.at(x,z),S2=list;let cx=x,cz=z;
  const doList=A=>{for(let i=0;i<A.length;i++){const s=A[i];if(s.y1<=y0+.02||s.y0>=y1)continue;const qx=cl(cx,s.x0,s.x1),qz=cl(cz,s.z0,s.z1);let dx=cx-qx,dz=cz-qz;const d2=dx*dx+dz*dz;if(d2>=r*r)continue;
   let d=Math.sqrt(d2),nx,nz,pen;if(d<1e-5){const l=cx-s.x0,rr=s.x1-cx,t=cz-s.z0,b=s.z1-cz,m=Math.min(l,rr,t,b);if(m===l){nx=-1;nz=0;pen=l+r;}else if(m===rr){nx=1;nz=0;pen=rr+r;}else if(m===t){nx=0;nz=-1;pen=t+r;}else{nx=0;nz=1;pen=b+r;}}else{nx=dx/d;nz=dz/d;pen=r-d;}
   cx+=nx*pen;cz+=nz*pen;out.hit=true;out.nx=nx;out.nz=nz;out.s=s;if(s.y1>out.top)out.top=s.y1;}};
  doList(S);if(S2)doList(S2);out.px=cx-x;out.pz=cz-z;return out;}
 // highest solid top under (x,z) that is below y+step (for walking on low walls/containers)
 topUnder(x,z,y,step=.55){let best=-1e9;for(const s of this.sHash.at(x,z)){if(x<s.x0||x>s.x1||z<s.z0||z>s.z1)continue;if(s.y1<=y+step&&s.y1>best)best=s.y1;}return best;}
 // line of sight test against buildings (2D, ignores low props)
 los(ax,az,bx,bz,h=2){const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/8);for(let i=1;i<n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;for(const s of this.sHash.at(x,z)){if(s.kind!=='bld'&&s.kind!=='cont')continue;if(s.y1<h)continue;if(x>s.x0&&x<s.x1&&z>s.z0&&z<s.z1)return false;}if(this.terrainH(x,z)>h+4)return false;}return true;}
 // camera ray: fraction of the segment that is free
 rayFree(ax,ay,az,bx,by,bz){const d=Math.hypot(bx-ax,by-ay,bz-az),n=Math.max(2,Math.ceil(d/.5));for(let i=1;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t,z=az+(bz-az)*t;
   if(y<this.terrainH(x,z)+.3&&!this.inTunnel(x,z))return(i-1)/n;for(const s of this.sHash.at(x,z)){if(s.kind==='pole'||s.kind==='palm'||s.kind==='rail'||s.kind==='parked'||s.kind==='prop')continue;if(x>s.x0-.2&&x<s.x1+.2&&z>s.z0-.2&&z<s.z1+.2&&y>s.y0&&y<s.y1+.2)return(i-1)/n;}}return 1;}
 zone(x,z,y){if(z>BEACH+2)return this.terrainH(x,z)<WL?'sea':'sand';if(y>FWY_Y-2&&this.fwyDist(x,z).d<FWY_HW+1)return'freeway';if(x>QUAY)return'sea';if(z<-360||x<-530)return'hills';const b=this.blockAt(x,z);
  if(b){if(b.walk)return'beach';return b.d==='boardwalk'?'beach':b.d;}if(x>CANAL[0]&&x<CANAL[1])return'canal';return this.district(x,z);}}
function pick2(R,a){return a[R()*a.length|0];}
