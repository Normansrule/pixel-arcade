// DUSTWATER — the frontier: heightfield desert with mesas, a canyon cut into the eastern tableland and a river, the town of
// Dustwater (saloon, sheriff's office + bounty board, general store, water tower, railway station), the railway loop with its
// trestles, three outlaw camps, vegetation (saguaro, prickly pear, scrub, cottonwoods, rocks, dry grass), the day-to-dusk sky,
// static colliders and ray queries. Terrain/water/grass-field techniques adapted from Storm Royale.
import * as THREE from '../vendor/three.module.min.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';
import {V,cl,lerp,smooth,rng,ctex,M,merge,lumpy,rayBox,rayCyl,boxNormal,wuv,normalFrom,tnoise} from './util.js';

export const EXT=520,N=321,STEP=2*EXT/(N-1),WATER=1.2;
const G=10,gk=(i,k)=>(i+300)*1000+(k+300),Z0=new THREE.Matrix4().makeScale(0,0,0);
const MESAS=[{x:150,z:205,r:46,h:44},{x:-85,z:150,r:28,h:34},{x:255,z:85,r:30,h:46},{x:-430,z:-300,r:62,h:52},{x:440,z:430,r:58,h:64},{x:-410,z:430,r:46,h:46},{x:-10,z:-410,r:42,h:40},{x:-70,z:-235,r:20,h:28},
 {x:205,z:-165,r:9,h:34},{x:-250,z:60,r:8,h:26},{x:330,z:300,r:10,h:38},{x:60,z:470,r:34,h:36}];
const CANYON=[[120,-205],[190,-255],[262,-300],[330,-358],[372,-430],[400,-540]];
const RIVER=[[-330,-560],[-268,-420],[-292,-305],[-232,-210],[-190,-110],[-178,-20],[-212,120],[-168,250],[-196,400],[-160,560]];
const LOOP=[[160,-64],[300,-118],[405,-25],[392,175],[262,330],[40,392],[-178,345],[-340,205],[-392,25],[-300,-112],[-150,-64],[0,-62]];
export const CAMPS=[
 {id:0,n:'RATTLESNAKE CANYON',x:328,z:-352,kind:'canyon'},
 {id:1,n:'HOLLOW CREEK',x:-238,z:-300,kind:'river'},
 {id:2,n:'RED MESA RUINS',x:84,z:262,kind:'ruins'}];
// town layout: street along x at z=0; s=+1 north side (z<0, fronts face +z), s=-1 south side (z>0, fronts face -z)
export const BUILD=[
 {x:-54,s:-1,w:12,d:12,h:7.2,ff:2.4,c:0xd8c7a2,sign:'HOTEL',st:2},
 {x:-35,s:-1,w:16,d:14,h:7.6,ff:2.6,c:0x8a3a28,sign:'SALOON',st:2,bal:1,bat:1},
 {x:-16,s:-1,w:11,d:11,h:5.6,ff:1.8,c:0x9a5a3c,sign:'BANK',brick:1},
 {x:13,s:-1,w:11,d:10,h:4.6,ff:2.2,c:0x7f97a2,sign:'DOCTOR'},
 {x:32,s:-1,w:13,d:11,h:4.8,ff:2.4,c:0x66734f,sign:'GUNSMITH'},
 {x:51,s:-1,w:10,d:10,h:4.2,ff:1.6,c:0xa38464,sign:''},
 {x:-52,s:1,w:15,d:14,h:6.4,ff:1.2,c:0x7a3a24,sign:'LIVERY',barn:1},
 {x:-31,s:1,w:14,d:12,h:5,ff:2.6,c:0xb89a68,sign:'GENERAL STORE'},
 {x:-11,s:1,w:12,d:11,h:4.6,ff:2.2,c:0x6b5a48,sign:'SHERIFF',sheriff:1},
 {x:9,s:1,w:11,d:10,h:4.6,ff:2,c:0x9a8a70,sign:'TELEGRAPH'},
 {x:29,s:1,w:12,d:11,h:4.6,ff:2,c:0x4f4a48,sign:'UNDERTAKER'},
 {x:49,s:1,w:10,d:10,h:4.2,ff:1.4,c:0xb08a62,sign:''}];
export const STATION={x:12,z:-50};

function segDist(px,pz,P){let best=1e9,bt=0,acc=0;for(let i=0;i<P.length-1;i++){const[ax,az]=P[i],[bx,bz]=P[i+1],dx=bx-ax,dz=bz-az,L2=dx*dx+dz*dz,t=cl(((px-ax)*dx+(pz-az)*dz)/L2,0,1),qx=ax+dx*t,qz=az+dz*t,d=Math.hypot(px-qx,pz-qz);const L=Math.sqrt(L2);if(d<best){best=d;bt=acc+t*L;}acc+=L;}return[best,bt];}

export class World{
 constructor(seed=7){const r=this.r=rng(seed);this.sn=new SimplexNoise({random:r});this.obs=[];this.grid=new Map();this.time=0;this.dusk=0;
  this.camps=CAMPS.map(c=>({...c}));this.mesas=MESAS;this.river=RIVER;
  this.flats=[{x0:-112,z0:-78,x1:112,z1:44,y:0,blend:34,town:1}];
  for(const c of this.camps){const r=c.kind==='canyon'?9:20;this.flats.push({x0:c.x-r,z0:c.z-r,x1:c.x+r,z1:c.z+r,y:0,blend:c.kind==='canyon'?7:18});}
  for(const f of this.flats){let s=0,n=0;for(let i=0;i<=4;i++)for(let k=0;k<=4;k++){s+=this.rawH(lerp(f.x0,f.x1,i/4),lerp(f.z0,f.z1,k/4));n++;}f.y=s/n;}
  this.townY=this.flats[0].y;this.buildTrack();this.genHeights();for(const c of this.camps)c.y=this.heightAt(c.x,c.z);this.scatter();}

 /* ---------------- terrain ---------------- */
 fbm(x,z,o=4){let a=0,f=1,amp=1,s=0;for(let i=0;i<o;i++){a+=this.sn.noise(x*f,z*f)*amp;s+=amp;f*=2.03;amp*=.5;}return a/s;}
 rawH(x,z){const sn=this.sn;let h=9+this.fbm(x*.0035,z*.0035)*8+this.fbm(x*.017+3,z*.017)*1.6+Math.abs(this.sn.noise(x*.06,z*.012))*.5;
  // eastern tableland with a winding canyon cut through it
  const ex=x+sn.noise(x*.02,z*.02)*14,ez=z+sn.noise(z*.02+4,x*.02)*14;let tb=32*smooth(-178,-196,ez)*smooth(110,128,ex);
  if(tb>0){const[dc]=segDist(x,z,CANYON),w=17+sn.noise(x*.03,z*.03)*5;tb*=smooth(w,w+9,dc);h+=tb;}
  // mesas and buttes: noisy rims, steep cliffs, talus aprons
  for(const m of MESAS){const dx=x-m.x,dz=z-m.z,d=Math.hypot(dx,dz);if(d>m.r+40)continue;const a=Math.atan2(dz,dx),rr=m.r*(1+.14*sn.noise(Math.cos(a)*1.4+m.x,Math.sin(a)*1.4+m.z)+.05*sn.noise(Math.cos(a)*4+m.z,Math.sin(a)*4));
   const top=m.h*(1-smooth(rr-4,rr+2.5,d))+(d<rr?sn.noise(x*.08,z*.08)*.8:0),ap=m.h*.3*(1-smooth(rr-2,rr+26,d));h+=Math.max(top,ap);}
  // river valley
  const[dr]=segDist(x,z,RIVER),bw=9+sn.noise(x*.01,z*.01)*3;if(dr<60){const bed=WATER-1.25;const k=1-smooth(bw,bw+30,dr);h=lerp(h,Math.min(h,bed+smooth(bw*.4,bw,dr)*2.6),k);h-=.55*(1-smooth(0,bw,dr));}
  return h;}
 flatH(x,z){let y=this.rawH(x,z);for(const f of this.flats){const dx=Math.max(f.x0-x,0,x-f.x1),dz=Math.max(f.z0-z,0,z-f.z1),dr=Math.hypot(dx,dz),w=1-smooth(1,f.blend,dr);if(w>0)y=lerp(y,f.y,w);}return y;}
 buildTrack(){const curve=new THREE.CatmullRomCurve3(LOOP.map(([x,z])=>new V(x,0,z)),true,'centripetal');const L=curve.getLength(),n=Math.round(L/2.5);
  const P=curve.getSpacedPoints(n);P.pop();const S=P.length,ys=new Float32Array(S);for(let i=0;i<S;i++){ys[i]=this.flatH(P[i].x,P[i].z);}
  // smooth the grade (circular moving average), keep it above the river
  let y2=Float32Array.from(ys);for(let pass=0;pass<4;pass++){const o=new Float32Array(S);for(let i=0;i<S;i++){let s=0;for(let k=-24;k<=24;k++)s+=y2[(i+k+S)%S];o[i]=s/49;}y2=o;}
  for(let i=0;i<S;i++)y2[i]=Math.max(y2[i],WATER+4.2);for(let pass=0;pass<2;pass++){const o=new Float32Array(S);for(let i=0;i<S;i++){let s=0;for(let k=-10;k<=10;k++)s+=y2[(i+k+S)%S];o[i]=Math.max(s/21,WATER+4.2);}y2=o;}
  const tan=[],rt=[];for(let i=0;i<S;i++){const a=P[(i+1)%S],b=P[(i-1+S)%S],t=new V(a.x-b.x,0,a.z-b.z).normalize();tan.push(t);rt.push(new V(-t.z,0,t.x));P[i].y=y2[i];}
  this.track={P,tan,rt,S,len:S*L/n,step:L/n,grid:new Map()};for(let i=0;i<S;i++){const key=gk(Math.floor(P[i].x/20),Math.floor(P[i].z/20));let a=this.track.grid.get(key);if(!a)this.track.grid.set(key,a=[]);a.push(i);}}
 trackNear(x,z){const T=this.track,ci=Math.floor(x/20),ck=Math.floor(z/20);let bd=1e9,bi=-1;for(let i=ci-1;i<=ci+1;i++)for(let k=ck-1;k<=ck+1;k++){const a=T.grid.get(gk(i,k));if(a)for(const j of a){const p=T.P[j],d=(p.x-x)**2+(p.z-z)**2;if(d<bd){bd=d;bi=j;}}}
  if(bi<0)return null;const p=T.P[bi],t=T.tan[bi];const along=(x-p.x)*t.x+(z-p.z)*t.z,lat=Math.abs((x-p.x)*-t.z+(z-p.z)*t.x);return{i:bi,d:lat+Math.max(0,Math.abs(along)-T.step*.6),y:p.y};}
 // position + heading on the loop at arc length s
 trackAt(s,out){const T=this.track;s=((s%T.len)+T.len)%T.len;const f=s/T.step,i=Math.floor(f)%T.S,j=(i+1)%T.S,k=f-Math.floor(f);out.p.lerpVectors(T.P[i],T.P[j],k);out.yaw=Math.atan2(lerp(T.tan[i].x,T.tan[j].x,k),lerp(T.tan[i].z,T.tan[j].z,k));out.pitch=Math.atan2(T.P[j].y-T.P[i].y,T.step);return out;}
 genHeights(){const h=this.H=new Float32Array(N*N);this.bridge=new Uint8Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-EXT+i*STEP,z=-EXT+j*STEP;let y=this.flatH(x,z);const t=this.trackNear(x,z);
   if(t&&t.d<26){const w=1-smooth(4.5,22,t.d);if(t.y-y>3.2&&t.d<9)this.bridge[j*N+i]=1;else if(w>0){const tg=t.y-.35;y=lerp(y,tg,w*(t.y-y>3.2?.0:1));}}
   h[j*N+i]=y;}}
 heightAt(x,z){const gx=(x+EXT)/STEP,gz=(z+EXT)/STEP;if(gx<0||gz<0||gx>=N-1||gz>=N-1)return 10;const i=gx|0,j=gz|0,fx=gx-i,fz=gz-j,h=this.H,a=h[j*N+i],b=h[j*N+i+1],c=h[(j+1)*N+i],d=h[(j+1)*N+i+1];
  return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;}
 normalAt(x,z,out=new V()){const e=1.6;return out.set(this.heightAt(x-e,z)-this.heightAt(x+e,z),2*e,this.heightAt(x,z-e)-this.heightAt(x,z+e)).normalize();}
 // ground under a point: terrain, the railway deck on trestles, building porches, rocks
 groundAt(x,z,y){let g=this.heightAt(x,z);const t=this.trackNear(x,z);if(t&&t.d<2.6&&t.y>g&&y>t.y-1.2)g=t.y;const s=this.support(x,z,y,.6,.3);return Math.max(g,s);}
 waterDepth(x,z){return WATER-this.heightAt(x,z);}

 /* ---------------- obstacles ---------------- */
 addObs(o){o.alive=true;this.obs.push(o);const bb=o.b||[o.x-o.r,0,o.z-o.r,o.x+o.r,0,o.z+o.r];for(let i=Math.floor(bb[0]/G);i<=Math.floor(bb[3]/G);i++)for(let k=Math.floor(bb[2]/G);k<=Math.floor(bb[5]/G);k++){const key=gk(i,k);let a=this.grid.get(key);if(!a){a=[];this.grid.set(key,a);}a.push(o);}return o;}
 box(x0,y0,z0,x1,y1,z1,k='wall'){return this.addObs({k,b:[Math.min(x0,x1),y0,Math.min(z0,z1),Math.max(x0,x1),y1,Math.max(z0,z1)],x:(x0+x1)/2,z:(z0+z1)/2,y0,y1});}
 obsNear(x0,z0,x1,z1,cb){const seen=this._seen||(this._seen=new Set());seen.clear();for(let i=Math.floor(x0/G);i<=Math.floor(x1/G);i++)for(let k=Math.floor(z0/G);k<=Math.floor(z1/G);k++){const a=this.grid.get(gk(i,k));if(a)for(const o of a){if(!o.alive||seen.has(o))continue;seen.add(o);cb(o);}}}
 collide(pos,r,ht,step){let hit=false;this.obsNear(pos.x-r-1,pos.z-r-1,pos.x+r+1,pos.z+r+1,o=>{if(o.y1<=pos.y+step||o.y0>=pos.y+ht||o.k==='deco')return;
   if(o.b){const b=o.b,qx=cl(pos.x,b[0],b[3]),qz=cl(pos.z,b[2],b[5]),dx=pos.x-qx,dz=pos.z-qz,d2=dx*dx+dz*dz;if(d2>=r*r)return;if(d2>1e-8){const d=Math.sqrt(d2);pos.x+=dx/d*(r-d);pos.z+=dz/d*(r-d);}else{const pen=[pos.x-b[0],b[3]-pos.x,pos.z-b[2],b[5]-pos.z];let m=0;for(let j=1;j<4;j++)if(pen[j]<pen[m])m=j;if(m===0)pos.x=b[0]-r;else if(m===1)pos.x=b[3]+r;else if(m===2)pos.z=b[2]-r;else pos.z=b[5]+r;}hit=true;return;}
   const dx=pos.x-o.x,dz=pos.z-o.z,d=Math.hypot(dx,dz),m=o.r+r;if(d<m){if(d>1e-4){pos.x=o.x+dx/d*m;pos.z=o.z+dz/d*m;}else pos.x+=m;hit=true;}});return hit;}
 support(x,z,y,step,r){let h=-1e9;this.obsNear(x-r-1,z-r-1,x+r+1,z+r+1,o=>{if(o.k==='cactus'||o.k==='tree'||o.k==='deco')return;let top=-1e9;if(o.b){const b=o.b;if(x>=b[0]-r*.5&&x<=b[3]+r*.5&&z>=b[2]-r*.5&&z<=b[5]+r*.5)top=b[4];}else if(Math.hypot(x-o.x,z-o.z)<o.r+r*.5)top=o.y1;if(top<=y+step&&top>h)h=top;});return h;}
 rayTerrain(o,d,maxT){let t=0,prev=0;let diff=o.y-this.heightAt(o.x,o.z);if(diff<0)return 0;
  for(let n=0;n<700;n++){const st=cl(diff*.45,.35,12);t=Math.min(maxT,t+st);const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;diff=y-this.heightAt(x,z);
   if(diff<0){let a=prev,b=t;for(let k=0;k<10;k++){const m=(a+b)/2;if(o.y+d.y*m-this.heightAt(o.x+d.x*m,o.z+d.z*m)<0)b=m;else a=m;}return b;}prev=t;if(t>=maxT||(d.y>0&&y>140))break;}return -1;}
 rayObs(o,d,maxT){let best=null,bt=maxT;const seen=new Set();let ix=Math.floor(o.x/G),iz=Math.floor(o.z/G);const sx=Math.sign(d.x),sz=Math.sign(d.z);
  const tdx=sx?G/Math.abs(d.x):1e9,tdz=sz?G/Math.abs(d.z):1e9;let tmx=sx?((sx>0?(ix+1)*G:ix*G)-o.x)/d.x:1e9,tmz=sz?((sz>0?(iz+1)*G:iz*G)-o.z)/d.z:1e9,t=0;
  for(let n=0;n<200;n++){const a=this.grid.get(gk(ix,iz));if(a)for(const ob of a){if(!ob.alive||seen.has(ob)||ob.k==='deco')continue;seen.add(ob);const tt=ob.b?rayBox(o.x,o.y,o.z,d.x,d.y,d.z,ob.b,bt):rayCyl(o.x,o.y,o.z,d.x,d.y,d.z,ob,bt);if(tt>=0&&tt<bt){bt=tt;best={t:tt,obs:ob};}}
   if(best&&best.t<=t)break;if(tmx<tmz){t=tmx;tmx+=tdx;ix+=sx;}else{t=tmz;tmz+=tdz;iz+=sz;}if(t>bt)break;}
  if(best){const p=new V().copy(d).multiplyScalar(best.t).add(o),ob=best.obs;best.n=ob.b?boxNormal(p.x,p.y,p.z,ob.b):(Math.abs(p.y-ob.y1)<.02?new V(0,1,0):new V(p.x-ob.x,0,p.z-ob.z).normalize());}return best;}
 // nearest solid hit along a ray (terrain or obstacle): {t,k,n}
 ray(o,d,maxT){const tt=this.rayTerrain(o,d,maxT),ob=this.rayObs(o,d,tt>=0?tt:maxT);if(ob)return{t:ob.t,k:ob.obs.k,n:ob.n,obs:ob.obs};if(tt>=0){const p=new V().copy(d).multiplyScalar(tt).add(o);return{t:tt,k:'ground',n:this.normalAt(p.x,p.z)};}return null;}

 /* ---------------- scatter ---------------- */
 clearOf(x,z,pad){if(x>-120-pad&&x<120+pad&&z>-84-pad&&z<50+pad)return false;for(const c of this.camps)if(Math.hypot(x-c.x,z-c.z)<26+pad)return false;const t=this.trackNear(x,z);if(t&&t.d<6+pad)return false;return true;}
 scatter(){const r=rng(99);this.cacti=[];this.pears=[];this.scrub=[];this.trees=[];this.rocks=[];this.boulders=[];
  const slope=(x,z)=>1-this.normalAt(x,z).y;
  for(let n=0;n<26000&&this.cacti.length<520;n++){const x=(r()*2-1)*EXT*.97,z=(r()*2-1)*EXT*.97,h=this.heightAt(x,z);if(h<WATER+1.5||slope(x,z)>.18||!this.clearOf(x,z,3))continue;const[dr]=segDist(x,z,RIVER);if(dr<26)continue;
   if(r()>.35+.65*(this.fbm(x*.01+20,z*.01)*.5+.5))continue;const s=.75+r()*.6;this.cacti.push(this.addObs({k:'cactus',x,z,y:h,s,rot:r()*6.28,v:r()*3|0,r:.42*s,y0:h-1,y1:h+5.5*s}));}
  for(let n=0;n<14000&&this.pears.length<420;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER+1.2||slope(x,z)>.25||!this.clearOf(x,z,1))continue;this.pears.push([x,h,z,.6+r()*.7,r()*6.28]);}
  for(let n=0;n<30000&&this.scrub.length<1700;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER+.6||slope(x,z)>.35||!this.clearOf(x,z,0))continue;const[dr]=segDist(x,z,RIVER);this.scrub.push([x,h,z,.5+r()*.9,r()*6.28,dr<40?1:0]);}
  // cottonwoods along the river
  for(let n=0;n<6000&&this.trees.length<150;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,[dr]=segDist(x,z,RIVER);if(dr<12||dr>34)continue;const h=this.heightAt(x,z);if(h<WATER+.8||slope(x,z)>.3||!this.clearOf(x,z,4))continue;const s=.85+r()*.6;this.trees.push(this.addObs({k:'tree',x,z,y:h,s,rot:r()*6.28,r:.5*s,y0:h-1,y1:h+7*s,tint:.85+r()*.3}));}
  for(let n=0;n<9000&&this.rocks.length<380;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER-1||!this.clearOf(x,z,2))continue;const sl=slope(x,z);if(sl>.42||sl<.12&&r()<.75)continue;const s=.6+r()*(sl>.2?2.6:1.8);this.rocks.push(this.addObs({k:'rock',x,z,y:h-s*sl*.9,s,rot:r()*6.28,r:s*.85,y0:h-2,y1:h+s*.7,tint:.8+r()*.35}));}
  // camp cover: boulders around each camp
  for(const c of this.camps){c.cover=[];const rc=rng(c.id*31+5);for(let i=0;i<7;i++){const a=i/7*6.28+rc()*.6,d=14+rc()*10,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,h=this.heightAt(x,z),s=1.3+rc()*.9;this.boulders.push(this.addObs({k:'rock',x,z,y:h,s,rot:rc()*6.28,r:s*.9,y0:h-2,y1:h+s*.75,tint:.85+rc()*.2}));c.cover.push({x,z,r:s*.9});}}}

 /* ---------------- visuals ---------------- */
 build(scene){const out=this.vis={};this.scene=scene;
  this.buildTerrain(scene);this.buildWater(scene);this.buildSky(scene);this.buildVeg(scene);this.buildTown(scene);this.buildRail(scene);this.buildCamps(scene);this.drawMap();return out;}
 buildTerrain(scene){const geo=new THREE.PlaneGeometry(2*EXT,2*EXT,N-1,N-1);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=new Float32Array(pos.count*3),gcol=new Uint8Array(pos.count*4),c=new THREE.Color(),nrm=new V();
  const sand=new THREE.Color(0xd8a46a),sand2=new THREE.Color(0xe6bd84),red=new THREE.Color(0xb86a40),dirt=new THREE.Color(0xc29468),road=new THREE.Color(0xd9b48a),green=new THREE.Color(0x8c8a4c),wet=new THREE.Color(0x6e5a40),pale=new THREE.Color(0xeccfa0);
  for(let v=0;v<pos.count;v++){const x=pos.getX(v),z=pos.getZ(v),gi=Math.round((x+EXT)/STEP),gj=Math.round((z+EXT)/STEP),h=this.H[gj*N+gi];pos.setY(v,h);this.normalAt(x,z,nrm);
   const n1=this.fbm(x*.012,z*.012,3)*.5+.5,n2=this.fbm(x*.05+3,z*.05,2)*.5+.5,n3=this.fbm(x*.004+17,z*.004-4,2)*.5+.5;
   c.copy(sand).lerp(sand2,smooth(.35,.75,n1)*.8).lerp(red,smooth(.55,.85,n3)*.55).lerp(pale,smooth(.7,.95,n2)*.25);
   const[dr]=segDist(x,z,RIVER);c.lerp(green,(1-smooth(14,40,dr))*.55*(.6+.4*n2));c.lerp(wet,1-smooth(WATER-.2,WATER+1.1,h));
   let dd=1e9;for(const f of this.flats){const dx=Math.max(f.x0-x,0,x-f.x1),dz=Math.max(f.z0-z,0,z-f.z1);dd=Math.min(dd,Math.hypot(dx,dz));}c.lerp(dirt,smooth(14,0,dd)*.45);
   if(Math.abs(z)<10&&Math.abs(x)<160)c.lerp(road,smooth(10,5,Math.abs(z))*.55*smooth(160,110,Math.abs(x)));
   const t=this.trackNear(x,z);if(t&&t.d<6)c.lerp(new THREE.Color(0x8a7462),smooth(6,2.5,t.d)*.7);
   const s=1-nrm.y;c.lerp(red,smooth(.25,.5,s)*.4);
   col[v*3]=c.r;col[v*3+1]=c.g;col[v*3+2]=c.b;
   const gm=smooth(WATER+.4,WATER+1.6,h)*(1-smooth(.2,.32,s))*smooth(2,14,dd)*(.35+.65*smooth(.3,.7,n1))*(t?smooth(4,9,t.d):1)*(Math.abs(z)<12&&Math.abs(x)<170?0:1);
   const gc=c.clone().lerp(new THREE.Color(0xd8b060),.55).lerp(new THREE.Color(0x9a9a50),(1-smooth(14,50,dr))*.6);gcol[v*4]=gc.r*255;gcol[v*4+1]=gc.g*255;gcol[v*4+2]=gc.b*255;gcol[v*4+3]=gm*255;}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  const nf=tnoise(256,8,3,4),detail=ctex(256,256,(x,w,h)=>{const img=x.createImageData(w,h);for(let i=0;i<w*h;i++){const v=172+nf[i]*70|0;img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=v;img.data[i*4+3]=255;}x.putImageData(img,0,0);
   const r=rng(21);for(let i=0;i<2600;i++){const v=140+r()*110|0;x.fillStyle=`rgba(${v},${v},${v},.7)`;x.fillRect(r()*w,r()*h,1+r()*1.5,1+r()*1.5);}
   x.strokeStyle='rgba(70,60,50,.35)';for(let i=0;i<40;i++){x.lineWidth=.6+r();x.beginPath();let px=r()*w,py=r()*h;x.moveTo(px,py);for(let k=0;k<4;k++){px+=(r()-.5)*28;py+=(r()-.5)*28;x.lineTo(px,py);}x.stroke();}
   for(let i=0;i<160;i++){x.fillStyle=`rgba(90,70,55,${.12+r()*.2})`;x.beginPath();x.arc(r()*w,r()*h,1+r()*3,0,7);x.fill();}});detail.repeat.set(170,170);
  const dn=normalFrom(detail.image,2.2);dn.repeat.set(170,170);
  const tm=new THREE.MeshStandardMaterial({vertexColors:true,map:detail,normalMap:dn,normalScale:new THREE.Vector2(.8,.8),roughness:.95,metalness:0,envMapIntensity:.35});
  tm.onBeforeCompile=s=>{s.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
   s.fragmentShader='varying vec3 vWP;varying vec3 vWN;\n'+s.fragmentShader.replace('#include <map_fragment>',`vec4 sampledDiffuseColor=mix(texture2D(map,vMapUv),texture2D(map,vMapUv*.217+vec2(.37,.11)),.5);
    float stp=smoothstep(.36,.66,1.-normalize(vWN).y);float bnd=vWP.y*.95+sin(vWP.x*.045)*1.6+sin(vWP.z*.039+1.)*1.6;float s1=fract(bnd*.16);
    vec3 sc=mix(vec3(.55,.22,.11),vec3(.78,.42,.24),smoothstep(.15,.45,s1));sc=mix(sc,vec3(.9,.68,.48),smoothstep(.72,.92,s1)*.75);sc=mix(sc,vec3(.42,.17,.09),smoothstep(.05,0.,abs(s1-.6))*.6);
    float vt=mix(texture2D(map,vec2(vWP.x+vWP.z,vWP.y*2.2)*.05).r,texture2D(map,vec2(vWP.x-vWP.z,vWP.y)*.21).r,.5);
    diffuseColor.rgb=mix(diffuseColor.rgb*sampledDiffuseColor.rgb*1.1,sc*(.55+.6*vt),stp);`);};
  const terr=new THREE.Mesh(geo,tm);terr.receiveShadow=true;scene.add(terr);this.vis.terrain=terr;
  {const hh=new Uint16Array(N*N);for(let i=0;i<N*N;i++)hh[i]=THREE.DataUtils.toHalfFloat(this.H[i]);const t=this.hTex=new THREE.DataTexture(hh,N,N,THREE.RedFormat,THREE.HalfFloatType);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;
   const ct=this.cTex=new THREE.DataTexture(gcol,N,N,THREE.RGBAFormat);ct.magFilter=ct.minFilter=THREE.LinearFilter;ct.needsUpdate=true;}
  // dry grass field following the camera (offsets wrap in the vertex shader; height/colour/mask from the lookup textures)
  {const cl3=new THREE.BufferGeometry(),p=[],cc=[];for(let k=0;k<4;k++){const a=k*1.7+.3,ox=Math.cos(a)*.1,oz=Math.sin(a)*.1,ca=Math.cos(a+1.57)*.025,sa=Math.sin(a+1.57)*.025,lean=.14+k*.05,lx=Math.cos(a)*lean,lz=Math.sin(a)*lean,h=.32+k*.1;
    const P=(t,w)=>[ox+lx*t*t+ca*w,h*t,oz+lz*t*t+sa*w];const v=[P(0,-1),P(0,1),P(.5,-.7),P(.5,.7),P(1,0)];for(const[i,j,l]of[[0,1,2],[1,3,2],[2,3,4]]){p.push(...v[i],...v[j],...v[l]);for(const q of[i,j,l])cc.push(q<2?0:q<4?.5:1,0,0);}}
   cl3.setAttribute('position',new THREE.Float32BufferAttribute(p,3));cl3.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));const nn=new Float32Array(p.length);for(let i=1;i<nn.length;i+=3)nn[i]=1;cl3.setAttribute('normal',new THREE.BufferAttribute(nn,3));
   const MAXG=16000,off=new Float32Array(MAXG*4),r=rng(77);for(let i=0;i<MAXG*4;i++)off[i]=r();cl3.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,4));
   const U=this.fieldU={uCam:{value:new V()},uS:{value:70},uT:{value:0},uHT:{value:this.hTex},uCT:{value:this.cTex}};
   const fm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,side:THREE.DoubleSide,envMapIntensity:.3});
   fm.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader=`uniform vec3 uCam;uniform float uS,uT;uniform sampler2D uHT,uCT;attribute vec4 aOff;\n`+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
     vec2 cp=uCam.xz,wp=cp+mod(aOff.xy*uS-cp,uS)-uS*.5;vec2 tuv=((wp+${EXT.toFixed(1)})/${STEP.toFixed(6)}+.5)/${N}.;float gy=texture2D(uHT,tuv).r;vec4 tc=texture2D(uCT,tuv);
     float d=length(wp-cp)/(uS*.5),sc=step(.35,tc.a*(.6+.8*aOff.z))*(1.-smoothstep(.6,1.,d))*(.7+.8*aOff.z);float an=aOff.w*6.2832,cs=cos(an),sn=sin(an);
     transformed.xz=mat2(cs,-sn,sn,cs)*transformed.xz;transformed*=vec3(sc,sc*(.8+.6*fract(aOff.z*7.3)),sc);float ht=position.y;
     transformed.x+=(sin(uT*1.6+wp.x*.3+wp.y*.2)*.14+sin(uT*3.1+wp.x*1.3)*.04)*ht;transformed.z+=cos(uT*1.3+wp.y*.3)*.08*ht;transformed.xz+=wp;transformed.y+=gy-.05;
     vColor=mix(tc.rgb*.5,tc.rgb*1.12+vec3(.08,.06,.0),color.r)*(.85+.3*fract(aOff.z*13.1));`);};
   const fg=this.field=new THREE.InstancedMesh(cl3,fm,MAXG);fg.frustumCulled=false;fg.receiveShadow=true;fg.count=MAXG;scene.add(fg);}}
 buildWater(scene){const hd=new Uint8Array(N*N*4);for(let i=0;i<N*N;i++){const v=cl((this.H[i]+10)/40,0,1)*255|0;hd[i*4]=hd[i*4+1]=hd[i*4+2]=v;hd[i*4+3]=255;}const ht=new THREE.DataTexture(hd,N,N,THREE.RGBAFormat);ht.magFilter=ht.minFilter=THREE.LinearFilter;ht.needsUpdate=true;
  const wU=this.waterU={uT:{value:0},uH:{value:ht},uSun:{value:new V(0,1,0)},uFogC:{value:new THREE.Color()},uFogN:{value:200},uFogF:{value:1300},uSky:{value:new THREE.Color()},uHor:{value:new THREE.Color()}};
  const water=new THREE.Mesh(new THREE.PlaneGeometry(2*EXT,2*EXT,1,1).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:wU,transparent:true,depthWrite:false,
   vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`uniform float uT,uFogN,uFogF;uniform sampler2D uH;uniform vec3 uSun,uFogC,uSky,uHor;varying vec3 vW;
    void main(){vec2 uv=(vW.xz+${EXT}.)/${(2*EXT).toFixed(1)};float h=texture2D(uH,uv).r*40.-10.;float dep=${WATER.toFixed(2)}-h;if(dep<-.05)discard;vec2 p=vW.xz;float t=uT;
     vec3 n=normalize(vec3(.06*cos(p.x*.3+t*1.3)+.04*cos((p.x+p.y)*.5+t*1.9)+.03*cos(p.y*.9-t*2.6),1.,.06*cos(p.y*.25+t*1.1)+.04*cos((p.x-p.y)*.45+t*1.6)+.025*cos(p.x*1.1+t*2.4)));
     vec3 Vv=normalize(cameraPosition-vW);float fr=.05+.95*pow(1.-max(dot(n,Vv),0.),5.);
     vec3 base=mix(vec3(.36,.42,.26),vec3(.12,.26,.27),smoothstep(.2,2.,dep));vec3 R=reflect(-Vv,n);vec3 sky=mix(uHor,uSky,clamp(R.y*1.4,0.,1.));vec3 c=mix(base,sky,fr*.8);
     float sp=pow(max(dot(R,uSun),0.),180.)*4.+pow(max(dot(R,uSun),0.),18.)*.25;float foam=smoothstep(.45,0.,dep)*(.5+.5*sin(dep*14.-t*3.+p.x*.3));c=mix(c,vec3(.85,.8,.68),clamp(foam,0.,1.)*.5);c+=sp*vec3(1.,.8,.55);
     float a=mix(.6,.95,smoothstep(.1,1.6,dep));float d=length(cameraPosition-vW);c=mix(c,uFogC,smoothstep(uFogN,uFogF,d));gl_FragColor=vec4(c,a);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`}));water.position.y=WATER;water.renderOrder=1;scene.add(water);this.vis.water=water;}
 buildSky(scene){const U=this.skyU={uSun:{value:new V(0,.3,1)},uDusk:{value:0},uT:{value:0}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(2400,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,
   vertexShader:'varying vec3 vP;void main(){vP=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
   fragmentShader:`uniform vec3 uSun;uniform float uDusk,uT;varying vec3 vP;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fb(vec2 p){float a=0.,w=.5;for(int i=0;i<5;i++){a+=n(p)*w;p=p*2.07+vec2(3.1,1.7);w*=.5;}return a;}
    void main(){vec3 d=normalize(vP);float y=d.y;vec3 top=mix(vec3(.19,.39,.72),vec3(.17,.2,.42),uDusk),hor=mix(vec3(.93,.8,.62),vec3(1.,.56,.3),uDusk),low=mix(vec3(.86,.68,.5),vec3(.75,.38,.24),uDusk);
     float sd=max(dot(d,uSun),0.);vec3 c=mix(hor,top,pow(clamp(y,0.,1.),.5));c=mix(c,low,smoothstep(.0,-.2,y));
     c+=mix(vec3(1.,.72,.42),vec3(1.,.42,.16),uDusk)*(pow(sd,6.)*.45+pow(sd,2.)*.12)*(1.-clamp(y,0.,1.)*.6);
     vec2 cp=d.xz/(max(y,.02)+.12);float cl=fb(cp*vec2(1.1,3.2)+vec2(uT*.006,0.))*.75+fb(cp*3.+vec2(-uT*.01,4.))*.35;float cov=smoothstep(.52,.9,cl)*smoothstep(.02,.18,y);
     vec3 cc=mix(vec3(1.,.97,.92),vec3(1.,.62,.45),uDusk);cc=mix(cc*.82,cc*1.15+vec3(.2,.1,0.)*uDusk,pow(sd,3.));c=mix(c,cc,cov*.85);
     c=pow(c,vec3(2.2))*1.3;c+=vec3(1.,.9,.7)*pow(sd,900.)*9.;gl_FragColor=vec4(c,1.);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`}));sky.renderOrder=-2;sky.frustumCulled=false;scene.add(sky);this.vis.sky=sky;
  // distant mesa silhouettes on the horizon
  const r=rng(8),seg=180,p=[],idx=[],hs=[];for(let i=0;i<seg;i++){const a=i/seg;let h=40+r()*30;const b=Math.sin(a*37)*.5+Math.sin(a*91+1)*.3;h+=b>.45?110+r()*20:b>.2?60:0;hs.push(h);}
  for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,h=hs[i%seg],R=1800;p.push(Math.cos(a)*R,-30,Math.sin(a)*R,Math.cos(a)*R,h,Math.sin(a)*R);if(i<seg){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.Float32BufferAttribute(p,3));mg.setIndex(idx);
  const mu=this.farU={uC:{value:new THREE.Color()},uC2:{value:new THREE.Color()}};const far=new THREE.Mesh(mg,new THREE.ShaderMaterial({uniforms:mu,fog:false,side:THREE.DoubleSide,depthWrite:false,
   vertexShader:'varying float vY;void main(){vY=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 uC,uC2;varying float vY;void main(){vec3 c=mix(uC2,uC,smoothstep(-30.,140.,vY));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));far.renderOrder=-1;far.frustumCulled=false;scene.add(far);this.vis.far=far;}
 buildVeg(scene){const vr=rng(17);
  const cactT=ctex(128,256,(x,w,h)=>{x.fillStyle='#c8c8c8';x.fillRect(0,0,w,h);for(let i=0;i<16;i++){const cx=i*w/16;const g=x.createLinearGradient(cx,0,cx+w/16,0);g.addColorStop(0,'#8a8a8a');g.addColorStop(.5,'#f0f0f0');g.addColorStop(1,'#8a8a8a');x.fillStyle=g;x.fillRect(cx,0,w/16,h);}
   x.fillStyle='rgba(255,250,220,.9)';for(let i=0;i<500;i++){const cx=(vr()*16|0)*w/16+w/32;x.fillRect(cx-1,vr()*h,2,2);}});
  const cm=new THREE.MeshStandardMaterial({vertexColors:true,map:cactT,normalMap:normalFrom(cactT.image,3),roughness:.7});
  const ribbed=(r0,r1,h,seg=16)=>{const g=new THREE.CylinderGeometry(r0,r1,h,seg,6,false);g.translate(0,h/2,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),k=1+.07*Math.cos(a*8);p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);}g.computeVertexNormals();return g;};
  const cap=(r,y)=>{const g=new THREE.SphereGeometry(r,16,8,0,Math.PI*2,0,Math.PI/2);g.translate(0,y,0);return g;};
  const arm=(s,y,len,up,out)=>{const parts=[];const a=s*1;parts.push([new THREE.CylinderGeometry(.24,.26,out,12),M(s*(out/2+.2),y,0,0,0,Math.PI/2),0x5a7a3a]);parts.push([ribbed(.24,.25,up,12),M(s*(out+.2),y-.05,0),0x5f803c]);parts.push([cap(.24,0),M(s*(out+.2),y+up-.05,0),0x6a8a44]);return parts;};
  const sag=v=>{const H=[4.6,5.4,3.8][v];const parts=[[ribbed(.4,.46,H),null,0x5a7c3a],[cap(.4,H),null,0x6a8c44]];if(v!==2)parts.push(...arm(1,H*.42,1.6,.6,.7));if(v===1)parts.push(...arm(-1,H*.55,1.3,.7,.6));if(v===0)parts.push(...arm(-1,H*.35,1.1,.4,.5));return merge(parts);};
  for(let v=0;v<3;v++){const list=this.cacti.filter(c=>c.v===v);const im=new THREE.InstancedMesh(sag(v),cm,list.length);list.forEach((c,i)=>{im.setMatrixAt(i,M(c.x,c.y-.15,c.z,0,c.rot,0,c.s));const t=.85+vr()*.3;im.setColorAt(i,new THREE.Color(t,t,t*.9));});im.castShadow=im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}
  // prickly pear: flattened pads
  const padG=(()=>{const parts=[];const pr=rng(3);for(let i=0;i<7;i++){const a=pr()*6.28,lv=i<3?0:1,y=.35+lv*.55+pr()*.1,x=Math.cos(a)*(.25+lv*.15),z=Math.sin(a)*(.25+lv*.15);parts.push([new THREE.SphereGeometry(.34,10,8),M(x,y,z,pr()*.6-.3,a,pr()*.8-.4,1,1.05,.28),i%3?0x6f8a46:0x7d9550]);if(pr()<.6)parts.push([new THREE.SphereGeometry(.06,6,5),M(x,y+.36,z),0xd8506a]);}return merge(parts);})();
  const pim=new THREE.InstancedMesh(padG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65}),this.pears.length);this.pears.forEach((p,i)=>{pim.setMatrixAt(i,M(p[0],p[1]-.1,p[2],0,p[4],0,p[3]));});pim.castShadow=true;pim.receiveShadow=true;pim.frustumCulled=false;scene.add(pim);
  // scrub / sagebrush: lumpy clusters; greener near the river
  const leafT=ctex(128,128,(x,w,h)=>{x.fillStyle='#b8b8b8';x.fillRect(0,0,w,h);for(let i=0;i<500;i++){const v=150+vr()*100|0;x.fillStyle=`rgb(${v},${v},${v})`;x.beginPath();x.ellipse(vr()*w,vr()*h,3+vr()*3,1.5,vr()*6,0,7);x.fill();}});
  const leafM=new THREE.MeshStandardMaterial({vertexColors:true,map:leafT,normalMap:normalFrom(leafT.image,2),roughness:.85});
  const puff=(r,amt,seed,x,y,z,sx=1,sy=1,sz=1,det=1)=>{const g=lumpy(new THREE.IcosahedronGeometry(r,det),amt,seed);g.applyMatrix4(M(x,y,z,0,0,0,sx,sy,sz));const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new V(p.getX(i)-x,(p.getY(i)-y)*.8+.3*r,p.getZ(i)-z).normalize();n.setXYZ(i,v.x,v.y,v.z);}return g;};
  const shadeY=(g,y0,y1,lo=.55,hi=1.15)=>{const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const k=lerp(lo,hi,smooth(y0,y1,p.getY(i)));c.setXYZ(i,c.getX(i)*k,c.getY(i)*k,c.getZ(i)*k);}return g;};
  const scrubG=shadeY(merge([[puff(.6,.35,12,0,.25,0,1.3,.7,1.3),null,0x9a9a70],[puff(.45,.25,13,.5,.2,.25,1,.8,1,0),null,0x8c8f66],[puff(.4,.25,14,-.45,.18,-.3,1,.8,1,0),null,0xa0a078],[new THREE.CylinderGeometry(.03,.05,.4,4),M(.1,.1,0,0,0,.3),0x6a5038]]),-.1,.7,.5,1.15);wuv(scrubG,.9);
  const sim=new THREE.InstancedMesh(scrubG,leafM,this.scrub.length);this.scrub.forEach((b,i)=>{sim.setMatrixAt(i,M(b[0],b[1]-.1,b[2],0,b[4],0,b[3],b[3]*(.8+(i%5)*.08),b[3]));const t=.8+(i%7)*.05;sim.setColorAt(i,b[5]?new THREE.Color(t*.75,t*.95,t*.55):new THREE.Color(t,t*.97,t*.85));});sim.castShadow=true;sim.receiveShadow=true;sim.frustumCulled=false;scene.add(sim);
  // cottonwoods
  const barkT=ctex(128,256,(x,w,h)=>{x.fillStyle='#d0c8c0';x.fillRect(0,0,w,h);for(let i=0;i<180;i++){const v=110+vr()*110|0;x.fillStyle=`rgb(${v},${v-4},${v-10})`;x.fillRect(vr()*w,vr()*h,1+vr()*4,10+vr()*60);}});
  const barkM=new THREE.MeshStandardMaterial({vertexColors:true,map:barkT,normalMap:normalFrom(barkT.image,3),roughness:.9});
  const trunk=(r0,r1,h,seg=7)=>{const g=new THREE.CylinderGeometry(r0,r1,h,seg,3);g.translate(0,h/2,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)+Math.sin(y*1.1)*.12);}g.computeVertexNormals();return g;};
  const tB=shadeY(merge([[trunk(.25,.5,4.6),null,0x7a6a58],[new THREE.CylinderGeometry(.09,.17,2.6,5),M(.8,4.2,.1,0,0,-.75),0x7a6a58],[new THREE.CylinderGeometry(.08,.15,2.3,5),M(-.7,4.5,-.3,.3,0,.8),0x7a6a58]]),0,3,.6,1.05);
  const tL=shadeY(merge([[puff(2.4,.7,3,0,6,0),null,0x7a9a3a],[puff(1.9,.6,4,1.8,5.4,.6),null,0x86a440],[puff(1.8,.6,5,-1.6,5.7,-.6),null,0x6f9236],[puff(1.6,.5,6,.2,7.6,.2),null,0x8aaa48],[puff(1.4,.5,7,-.4,5.3,1.5),null,0x7a9a3a]]),3.5,8.5,.45,1.2);wuv(tB,.9);wuv(tL,.4);
  const ib=new THREE.InstancedMesh(tB,barkM,this.trees.length),il=new THREE.InstancedMesh(tL,leafM,this.trees.length);this.trees.forEach((t,i)=>{const m=M(t.x,t.y-.2,t.z,0,t.rot,0,t.s);ib.setMatrixAt(i,m);il.setMatrixAt(i,m);il.setColorAt(i,new THREE.Color(t.tint,t.tint,t.tint*.8));});
  for(const im of[ib,il]){im.castShadow=im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}
  // rocks (sandstone)
  const rockT=ctex(256,256,(x,w,h)=>{const f=tnoise(256,6,41,5),img=x.createImageData(w,h);for(let i=0;i<w*h;i++){const v=150+f[i]*100|0;img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=v;img.data[i*4+3]=255;}x.putImageData(img,0,0);x.strokeStyle='rgba(60,50,45,.45)';for(let i=0;i<30;i++){x.lineWidth=1+vr();x.beginPath();x.moveTo(0,vr()*h);x.lineTo(w,vr()*h);x.stroke();}});
  const rockG=lumpy(new THREE.IcosahedronGeometry(1,1),.5,9);rockG.scale(1,.72,1);wuv(rockG,.7);const rockM=this.rockM=new THREE.MeshStandardMaterial({color:0xc08060,map:rockT,normalMap:normalFrom(rockT.image,3),roughness:.9,flatShading:true});
  const all=[...this.rocks,...this.boulders],rim=new THREE.InstancedMesh(rockG,rockM,all.length);all.forEach((o,i)=>{rim.setMatrixAt(i,M(o.x,o.y-.2,o.z,0,o.rot,0,o.s));rim.setColorAt(i,new THREE.Color(o.tint,o.tint*.9,o.tint*.82));});rim.castShadow=rim.receiveShadow=true;rim.frustumCulled=false;scene.add(rim);
  this.leafM=leafM;}

 /* ---------------- town ---------------- */
 buildTown(scene){const y0=this.townY,P=[],GL=[],r=rng(4);this.town={doors:{},y:y0};
  const plankT=this.plankT=ctex(256,256,(x,w,h)=>{x.fillStyle='#d8d8d8';x.fillRect(0,0,w,h);for(let j=0;j<16;j++){const v=170+r()*70|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(0,j*16,w,15);x.fillStyle='rgba(40,40,40,.55)';x.fillRect(0,j*16+15,w,1);
    for(let k=0;k<40;k++){x.fillStyle=`rgba(90,90,90,${r()*.25})`;x.fillRect(r()*w,j*16+r()*14,8+r()*40,1);}const cut=r()*w;x.fillStyle='rgba(30,30,30,.5)';x.fillRect(cut,j*16,1,15);x.fillStyle='rgba(20,20,20,.6)';x.fillRect(cut+3,j*16+7,2,2);}});
  const brickT=ctex(256,256,(x,w,h)=>{x.fillStyle='#909090';x.fillRect(0,0,w,h);for(let j=0;j<16;j++)for(let i=0;i<9;i++){const v=170+r()*70|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(i*32+(j%2)*16-16,j*16+1,30,14);}});
  const woodM=this.woodM=new THREE.MeshStandardMaterial({vertexColors:true,map:plankT,normalMap:normalFrom(plankT.image,2.5),roughness:.85});
  const brickM=new THREE.MeshStandardMaterial({vertexColors:true,map:brickT,normalMap:normalFrom(brickT.image,2.5),roughness:.9});
  const glassM=this.glassM=new THREE.MeshStandardMaterial({color:0x1b1712,roughness:.15,metalness:.4,emissive:0xffa040,emissiveIntensity:0});
  // sign atlas
  const signs=BUILD.map(b=>b.sign).filter(Boolean).concat(['DUSTWATER','WANTED','DEPOT']);const asp=BUILD.filter(b=>b.sign).map(b=>Math.min(b.w-1.2,b.sign.length>8?10:7)/Math.min(1.7,b.ff+.2)).concat([8/.9,6,5/.9]);const sDraw=(x,w,h)=>{x.fillStyle='#2a2018';x.fillRect(0,0,w,h);signs.forEach((s,i)=>{const yy=i*(h/16);x.fillStyle=i%3===0?'#efe2c0':i%3===1?'#e8d49c':'#f2e6c8';x.fillRect(4,yy+4,w-8,h/16-8);x.strokeStyle='#3a2414';x.lineWidth=5;x.strokeRect(10,yy+10,w-20,h/16-20);
    x.fillStyle=i%2?'#5a1a10':'#2a1a10';x.font=`50px Anton, Impact, sans-serif`;x.textAlign='center';x.textBaseline='middle';const sy=.82,sx=sy*16/(asp[i]||5);x.save();x.translate(w/2,yy+h/32+3);x.scale(sx,sy);x.fillText(s,0,0,(w-70)/sx);x.restore();});};const SA=ctex(1024,1024,sDraw,{clamp:true});if(document.fonts)document.fonts.load('50px Anton').then(()=>{sDraw(SA.image.getContext('2d'),1024,1024);SA.needsUpdate=true;}).catch(()=>{});
  const signM=new THREE.MeshStandardMaterial({map:SA,roughness:.8});const sgeo=[];
  const signAt=(text,x,y,z,w,h,ry)=>{const i=signs.indexOf(text);if(i<0)return;const g=new THREE.PlaneGeometry(w,h);const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setY(k,1-(i+1-uv.getY(k))/16);g.applyMatrix4(M(x,y,z,0,ry,0));sgeo.push([g,null,0xffffff]);};
  const B=(w,h,d,x,y,z,c,ry=0,rx=0,rz=0)=>[new THREE.BoxGeometry(w,h,d),M(x,y,z,rx,ry,rz),c];
  const bricks=[];
  for(const b of BUILD){const s=b.s,fz=-s*9,bz=fz-s*b.d,cz=(fz+bz)/2,ry=s<0?Math.PI:0,c=b.c,dk=new THREE.Color(c).multiplyScalar(.55).getHex(),trim=0xe8dcc0,list=b.brick?bricks:P;
   const fy=y0;list.push(B(b.w,b.h,b.d,b.x,fy+b.h/2,cz,c));
   // false front + cornice
   P.push(B(b.w+.3,b.ff+.4,.3,b.x,fy+b.h+b.ff/2-.2,fz-s*.15,c),B(b.w+.7,.3,.6,b.x,fy+b.h+b.ff,fz-s*.1,trim),B(b.w+.5,.18,.45,b.x,fy+b.h+b.ff-.35,fz-s*.1,dk));
   if(b.barn){P.push(B(b.w*.6,b.h*.3,.2,b.x,fy+b.h+.1,fz-s*.2,c));}
   // roof slab behind the false front
   P.push(B(b.w+.2,.25,b.d+.2,b.x,fy+b.h+.1,cz,0x5a4a3c,0,s*.05));
   // corner boards + base
   for(const sx of[-1,1])P.push(B(.25,b.h+b.ff,.25,b.x+sx*b.w/2,fy+(b.h+b.ff)/2,fz-s*.12,trim));P.push(B(b.w+.1,.35,b.d+.1,b.x,fy+.17,cz,0x4a3a2c));
   // door + windows on the front
   const fl=b.st||1,doorW=b.barn?4:b.bat?2:1.4,doorH=b.barn?4.2:2.5;GL.push(B(doorW,doorH,.1,b.x,fy+.4+doorH/2,fz+s*.02,0x1b1712));P.push(B(doorW+.4,.25,.2,b.x,fy+.45+doorH,fz+s*.05,trim));
   for(const sx of[-1,1])P.push(B(.2,doorH,.2,b.x+sx*(doorW/2+.1),fy+.4+doorH/2,fz+s*.05,trim));
   if(b.bat)for(const sx of[-1,1])P.push(B(.95,1.1,.08,b.x+sx*.5,fy+1.7,fz+s*.35,0x6a3a20,sx*s*.5));
   const nw=Math.max(1,Math.floor((b.w-doorW-2)/4));for(let f=0;f<fl;f++){const wy=fy+1.9+f*3.1;for(const sx of[-1,1])for(let k=0;k<nw;k++){if(f===0&&b.barn)continue;const wx=b.x+sx*(doorW/2+1.3+k*2.3);if(f===1&&Math.abs(wx-b.x)<1)continue;
    GL.push(B(1.2,1.5,.1,wx,wy,fz+s*.02,0x1b1712));P.push(B(1.5,.15,.25,wx,wy-.8,fz+s*.08,trim),B(1.5,.15,.22,wx,wy+.8,fz+s*.08,trim),B(.12,1.6,.22,wx-.7,wy,fz+s*.08,trim),B(.12,1.6,.22,wx+.7,wy,fz+s*.08,trim),B(.08,1.5,.12,wx,wy,fz+s*.06,trim));}
    if(f===1){GL.push(B(1.2,2.3,.1,b.x,fy+1.4+3.1,fz+s*.02,0x1b1712));}}
   // porch: deck, posts, awning (+ balcony)
   const pd=3.2,pz=fz+s*pd/2;P.push(B(b.w+.4,.3,pd,b.x,fy+.3,pz,0x7a5a3c));for(let k=0;k<6;k++)P.push(B(b.w+.4,.02,.04,b.x,fy+.46,fz+s*(k*.55+.2),0x3a2a1c));
   const npost=Math.max(2,Math.round(b.w/4)+1);for(let k=0;k<npost;k++){const px=b.x-b.w/2+.15+k*(b.w-.3)/(npost-1);P.push(B(.22,3.3,.22,px,fy+1.95,fz+s*(pd-.2),0x6a4a30));}
   if(b.bal){P.push(B(b.w+.4,.25,pd,b.x,fy+3.7,pz,0x6a4a30));for(let k=0;k<b.w*2.5;k++)P.push(B(.06,.9,.06,b.x-b.w/2+k*.4,fy+4.3,fz+s*(pd-.15),0x5a3a20));P.push(B(b.w+.4,.1,.12,b.x,fy+4.75,fz+s*(pd-.15),0x5a3a20));for(let k=0;k<npost;k++){const px=b.x-b.w/2+.15+k*(b.w-.3)/(npost-1);P.push(B(.18,2.6,.18,px,fy+5,fz+s*(pd-.2),0x6a4a30));}P.push(B(b.w+.6,.18,pd+.4,b.x,fy+6.35,fz+s*(pd/2),0x4a3a2c,0,s*-.12));}
   else P.push(B(b.w+.6,.16,pd+.5,b.x,fy+3.65,fz+s*(pd/2+.1),0x4a3a2c,0,s*-.1));
   if(b.sign)signAt(b.sign,b.x,fy+b.h+b.ff*.5-.15,fz+s*.2,Math.min(b.w-1.2,b.sign.length>8?10:7),Math.min(1.7,b.ff+.2),ry);
   // hitching rail
   P.push(B(4,.12,.12,b.x+2,fy+1.05,fz+s*(pd+1.4),0x6a4a30));for(const k of[0,4])P.push(B(.14,1.1,.14,b.x+k,fy+.55,fz+s*(pd+1.4),0x5a3a20));
   // colliders: body (front wall at fz), porch walkable, posts
   const w=this.box(b.x-b.w/2,fy-2,Math.min(fz,bz),b.x+b.w/2,fy+b.h+b.ff,Math.max(fz,bz));w.bld=b;this.box(b.x-b.w/2-.2,fy-2,Math.min(fz,fz+s*pd),b.x+b.w/2+.2,fy+.45,Math.max(fz,fz+s*pd),'porch');
   this.box(b.x+2-2,fy-1,fz+s*(pd+1.4)-.1,b.x+4,fy+1.1,fz+s*(pd+1.4)+.1,'deco');
   b.door={x:b.x,z:fz+s*(pd+.5)};this.town.doors[b.sign||('h'+b.x)]=b;
   if(b.sheriff){this.town.sheriff=b;this.town.board={x:b.x-3.4,y:fy+1.9,z:fz+s*.32,ry,face:ry};
    P.push(B(2.5,1.9,.14,b.x-3.4,fy+1.95,fz+s*.18,0x4a3020),B(2.7,.16,.22,b.x-3.4,fy+3,fz+s*.22,0x3a2416));signAt('WANTED',b.x-3.4,fy+3.25,fz+s*.3,2.4,.4,ry);}}
  // barrels, crates, lamp posts, wagon on the street
  const barrel=(x,z,s=1)=>{P.push([new THREE.CylinderGeometry(.42*s,.42*s,1.1*s,12),M(x,y0+.55*s,z),0x7a5232],[new THREE.CylinderGeometry(.44*s,.44*s,.08,12),M(x,y0+.25*s,z),0x333333],[new THREE.CylinderGeometry(.44*s,.44*s,.08,12),M(x,y0+.85*s,z),0x333333]);this.addObs({k:'barrel',x,z,r:.45*s,y0:y0-1,y1:y0+1.1*s});};
  const crate=(x,z,s=1,ry=0)=>{P.push(B(1*s,1*s,1*s,x,y0+.5*s,z,0x9a7448,ry),B(1.02*s,.12*s,1.02*s,x,y0+.5*s,z,0x6a4a2a,ry));this.box(x-.5*s,y0-1,z-.5*s,x+.5*s,y0+s,z+.5*s,'crate');};
  for(const[x,z]of[[-44,-12.6],[-27,-12.4],[3,13],[22,13.2],[40,-12.6],[-62,12.8]])barrel(x,z);barrel(-43.2,-13.3,.9);
  for(const[x,z]of[[-24,13.4],[-25.2,13.6],[42,12.8],[-6,-12.2]])crate(x,z,1,r()*.4);
  for(let k=-3;k<=3;k++){const x=k*20+6;for(const s of[-1,1]){const z=s*11;P.push(B(.16,4,.16,x,y0+2,z,0x3a2a1c),B(.8,.1,.1,x,y0+3.9,z-s*.3,0x3a2a1c));GL.push(B(.35,.45,.35,x,y0+3.6,z-s*.65,0x1b1712));}}
  // wagon
  const wg=(x,z,ry)=>{const c=Math.cos(ry),sn=Math.sin(ry),tp=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c];const parts=[B(1.8,.5,3.6,0,1,0,0x7a5a38),B(1.8,.6,.1,0,1.5,1.75,0x6a4a30),B(1.8,.6,.1,0,1.5,-1.75,0x6a4a30),B(.1,.6,3.6,.9,1.5,0,0x6a4a30),B(.1,.6,3.6,-.9,1.5,0,0x6a4a30),B(.12,.12,2.4,0,.75,2.9,0x5a3a20)];
   for(const sx of[-1,1])for(const sz of[-1.2,1.2]){parts.push([new THREE.TorusGeometry(.62,.07,6,18),M(sx*1,.65,sz,0,Math.PI/2),0x3a2a1c]);for(let k=0;k<6;k++)parts.push(B(.05,1.2,.05,sx*1,.65,sz,0x5a3a20,0,k*Math.PI/6+Math.PI/2*0,0));}
   const cover=new THREE.CylinderGeometry(1.05,1.05,2.8,14,1,true,-Math.PI/2,Math.PI);cover.rotateX(Math.PI/2);parts.push([cover,M(0,1.75,-.2),0xe8dcc0]);const g=merge(parts);g.applyMatrix4(M(x,y0,z,0,ry,0));P.push([g,null,null]);
   const [ax,az]=tp(0,0);this.addObs({k:'wagon',x:ax,z:az,r:1.6,y0:y0-1,y1:y0+2.6});};
  wg(66,6,.3);wg(-74,-6,-1.2);
  // water tower by the depot
  {const tx=-26,tz=-52,ty=this.heightAt(tx,tz);const parts=[];for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]]){parts.push(B(.35,9,.35,tx+sx*2,ty+4.5,tz+sz*2,0x5a4030,0,sx*sz*.04,0));this.addObs({k:'post',x:tx+sx*2,z:tz+sz*2,r:.3,y0:ty-1,y1:ty+9});}
   for(const h of[2.5,5.5])for(const[a,b2,c2]of[[0,-2,4.2],[0,2,4.2]])parts.push(B(c2,.18,.18,tx+a,ty+h,tz+b2,0x5a4030)),parts.push(B(.18,.18,c2,tx+b2,ty+h,tz+a,0x5a4030));
   parts.push([new THREE.CylinderGeometry(3,3,4.4,20),M(tx,ty+11.2,tz),0x8a6a48],[new THREE.ConeGeometry(3.4,1.8,20),M(tx,ty+14.3,tz),0x5a4a3c],[new THREE.CylinderGeometry(3.05,3.05,.15,20),M(tx,ty+10,tz),0x2a2a2a],[new THREE.CylinderGeometry(3.05,3.05,.15,20),M(tx,ty+12.3,tz),0x2a2a2a],[new THREE.CylinderGeometry(3.3,3.3,.2,20),M(tx,ty+9,tz),0x5a4030],
    [new THREE.CylinderGeometry(.16,.16,3.2,8),M(tx+1.4,ty+8.2,tz-3.6,1.1),0x3a3a3a]);P.push([wuv(merge(parts),.6),null,null]);}
  // depot building + platform (between town and the railway)
  {const sx=STATION.x,sz=STATION.z,sy=this.heightAt(sx,sz);const parts=[B(16,4.6,7,sx,sy+2.3,sz,0xa8743c),B(17,.3,8,sx,sy+4.8,sz,0x5a3a28,0,.0,0),B(17.5,.25,4.5,sx,sy+5.4,sz-1.8,0x4a3a2c,0,-.25),B(17.5,.25,4.5,sx,sy+5.4,sz+1.8,0x4a3a2c,0,.25),B(.4,2.4,.4,sx+3,sy+6.4,sz,0x7a5a3c)];
   const tP=this.trackNear(sx,sz-11);const py=(tP?tP.y:sy)+.1;parts.push(B(34,.6,4.6,sx,py-.05,sz-7.5,0x7a5a3c));for(let k=0;k<9;k++)parts.push(B(.24,3.6,.24,sx-16+k*4,py+1.8,sz-9.4,0x6a4a30));parts.push(B(34.5,.18,3.8,sx,py+3.65,sz-7.8,0x4a3a2c,0,-.08));
   GL.push(B(1.5,2.5,.1,sx,sy+1.65,sz-3.53,0x1b1712));for(const k of[-5,5])GL.push(B(1.4,1.5,.1,sx+k,sy+2.1,sz-3.53,0x1b1712));signAt('DEPOT',sx,sy+3.9,sz-3.6,5,.9,Math.PI);signAt('DUSTWATER',sx,sy+3.9,sz+3.6,8,.9,0);
   P.push([wuv(merge(parts),.5),null,null]);this.box(sx-8,sy-2,sz-3.5,sx+8,sy+5.5,sz+3.5);this.box(sx-17,py-3,sz-9.8,sx+17,py+.25,sz-5.2,'porch');this.station={x:sx,z:sz-7.5,y:py};}
  // chapel at the east end
  {const cx=96,cz=-30,cy=this.heightAt(cx,cz);const parts=[B(8,5,13,cx,cy+2.5,cz,0xe8e0cc),B(8.6,.2,7.3,cx,cy+6.4,cz-3,0x4a3a2c,0,0,-.0),B(3,7,3,cx,cy+3.5,cz+5,0xe8e0cc),[new THREE.ConeGeometry(2.3,4,4),M(cx,cy+9,cz+5,0,Math.PI/4),0x4a3a2c],B(.2,1.6,.2,cx,cy+11.8,cz+5,0x2a2a2a),B(1,.2,.2,cx,cy+12.1,cz+5,0x2a2a2a)];
   const roof=new THREE.CylinderGeometry(.01,5.4,2.6,4,1);roof.rotateY(Math.PI/4);roof.scale(1,1,2);parts.push([roof,M(cx,cy+6.3,cz+.5,0,0,0),0x4a3a2c]);GL.push(B(.1,2.6,1.3,cx-4.02,cy+2.6,cz,0x1b1712),B(.1,2.6,1.3,cx+4.02,cy+2.6,cz,0x1b1712),B(1.6,2.6,.1,cx,cy+1.5,cz+6.52,0x1b1712));
   P.push([wuv(merge(parts),.5),null,null]);this.box(cx-4,cy-2,cz-7.5,cx+4,cy+8,cz+6.5);}
  // graveyard + fences behind the undertaker
  {const parts=[];for(let k=0;k<10;k++){const x=22+k*2.6+(k%2)*.4,z=34+(k%3)*2.4,y=this.heightAt(x,z);parts.push(B(.12,1.1,.12,x,y+.55,z,0x6a5a48),B(.6,.12,.12,x,y+.8,z,0x6a5a48));}
   for(let k=0;k<14;k++){const x=18+k*2.2,z=30,y=this.heightAt(x,z);parts.push(B(2.2,.1,.08,x+1.1,y+.9,z,0x7a6a54),B(2.2,.1,.08,x+1.1,y+.5,z,0x7a6a54),B(.12,1.1,.12,x,y+.55,z,0x5a4a38));}P.push([merge(parts),null,null]);}
  const tg=merge(P);wuv(tg,.42);const tmesh=new THREE.Mesh(tg,woodM);tmesh.castShadow=tmesh.receiveShadow=true;scene.add(tmesh);
  if(bricks.length){const bg=merge(bricks);wuv(bg,.5);const bm=new THREE.Mesh(bg,brickM);bm.castShadow=bm.receiveShadow=true;scene.add(bm);}
  const gm=new THREE.Mesh(merge(GL),glassM);scene.add(gm);const sm=new THREE.Mesh(merge(sgeo),signM);scene.add(sm);
  // windpump on the edge of town
  {const wx=-92,wz=30,wy=this.heightAt(wx,wz);const parts=[];for(const[a,b2]of[[-1,-1],[1,-1],[-1,1],[1,1]])parts.push(B(.16,12,.16,wx+a*1.1,wy+6,wz+b2*1.1,0x5a5048,0,0,a*.07));for(let h=2;h<12;h+=3)parts.push(B(2.4-h*.12,.1,.1,wx,wy+h,wz-1.1+h*.07,0x5a5048),B(2.4-h*.12,.1,.1,wx,wy+h,wz+1.1-h*.07,0x5a5048));
   const t=new THREE.Mesh(merge(parts),woodM);t.castShadow=true;scene.add(t);const hub=new THREE.Group();hub.position.set(wx,wy+12.3,wz);scene.add(hub);const bl=[];for(let k=0;k<14;k++)bl.push(B(.32,1.7,.04,0,1.1,0,0xd8d0c0,0,0,0)),bl[bl.length-1][1]=M(Math.sin(k/14*6.28)*1.1,Math.cos(k/14*6.28)*1.1,0,0,0,-k/14*6.28);
   bl.push(B(.2,.2,2,0,0,-1.2,0x3a3a3a),B(.05,1,1.2,0,0,-2.3,0xd8d0c0));const fan=new THREE.Mesh(merge(bl),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.3}));fan.castShadow=true;hub.add(fan);this.vis.fan=fan;this.addObs({k:'post',x:wx,z:wz,r:1.3,y0:wy-1,y1:wy+12});}}

 /* ---------------- railway ---------------- */
 buildRail(scene){const T=this.track,S=T.S;const tieG=new THREE.BoxGeometry(2.6,.18,.32),tieM=new THREE.MeshStandardMaterial({color:0x5a4634,roughness:.9,map:this.plankT});const ties=new THREE.InstancedMesh(tieG,tieM,Math.ceil(S*T.step/1.05));let ti=0;
  for(let s=0;s<T.len&&ti<ties.count;s+=1.05){const o=this.trackAt(s,{p:new V()});ties.setMatrixAt(ti++,M(o.p.x,o.p.y+.08,o.p.z,0,o.yaw+Math.PI/2,0));}ties.count=ti;ties.receiveShadow=true;ties.frustumCulled=false;scene.add(ties);
  // rails + ballast ribbons
  const rp=[],rn=[],bp=[],bn=[],bc=[],idxR=[],idxB=[];for(let i=0;i<=S;i++){const k=i%S,p=T.P[k],rt=T.rt[k];
   for(const sd of[-.72,.72])for(const[ox,oy]of[[-.05,.36],[.05,.36],[.05,.18],[-.05,.18]]){rp.push(p.x+rt.x*(sd+ox),p.y+oy-.1,p.z+rt.z*(sd+ox));}
   for(const[ox,oy]of[[-2.4,-.5],[-1.6,0],[1.6,0],[2.4,-.5]]){bp.push(p.x+rt.x*ox,p.y+oy-.02,p.z+rt.z*ox);bc.push(.55,.48,.42);}}
  for(let i=0;i<S;i++){for(let rr=0;rr<2;rr++){const a=i*8+rr*4,b=(i+1)*8+rr*4;for(let f=0;f<3;f++){idxR.push(a+f,b+f,a+f+1,a+f+1,b+f,b+f+1);}}const a=i*4,b=(i+1)*4;for(let f=0;f<3;f++)idxB.push(a+f,b+f,a+f+1,a+f+1,b+f,b+f+1);}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(rp,3));rg.setIndex(idxR);rg.computeVertexNormals();const rails=new THREE.Mesh(rg,new THREE.MeshStandardMaterial({color:0x8a8078,roughness:.35,metalness:.85,side:THREE.DoubleSide}));rails.receiveShadow=true;scene.add(rails);
  const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(bc,3));bg.setIndex(idxB);bg.computeVertexNormals();const uv=[];for(let i=0;i<bp.length/3;i++)uv.push((i%4)*.6,Math.floor(i/4)*.8);bg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const gravT=ctex(128,128,(x,w,h)=>{const r=rng(6);x.fillStyle='#909090';x.fillRect(0,0,w,h);for(let i=0;i<900;i++){const v=90+r()*140|0;x.fillStyle=`rgb(${v},${v},${v})`;x.beginPath();x.arc(r()*w,r()*h,1+r()*2.4,0,7);x.fill();}});
  const ballast=new THREE.Mesh(bg,new THREE.MeshStandardMaterial({vertexColors:true,map:gravT,normalMap:normalFrom(gravT.image,3),roughness:.95,polygonOffset:true,polygonOffsetFactor:-1}));ballast.receiveShadow=true;scene.add(ballast);
  // trestles where the grade runs over low ground (river crossings)
  const posts=[];for(let s=0;s<T.len;s+=3.2){const o=this.trackAt(s,{p:new V()}),g=this.heightAt(o.p.x,o.p.z);if(o.p.y-g<2.2)continue;const c=Math.cos(o.yaw),sn=Math.sin(o.yaw);for(const sd of[-1.25,1.25]){const x=o.p.x+c*sd,z=o.p.z-sn*sd,gy=Math.min(this.heightAt(x,z),WATER-1),h=o.p.y-gy;posts.push([new THREE.BoxGeometry(.3,h,.3),M(x,gy+h/2,z,0,o.yaw,sd*.06),0x5a4432]);}
   const gy=Math.min(g,WATER-1);for(let y=gy+2;y<o.p.y-1;y+=3)posts.push([new THREE.BoxGeometry(2.8,.18,.18),M(o.p.x,y,o.p.z,0,o.yaw+Math.PI/2*0,.0),0x5a4432]);posts.push([new THREE.BoxGeometry(3,.3,.4),M(o.p.x,o.p.y-.25,o.p.z,0,o.yaw),0x4a3626]);}
  if(posts.length){const pm=new THREE.Mesh(merge(posts),new THREE.MeshStandardMaterial({vertexColors:true,map:this.plankT,roughness:.9}));pm.castShadow=pm.receiveShadow=true;scene.add(pm);}
  // telegraph poles along the line
  const pl=[];for(let s=0;s<T.len;s+=42){const o=this.trackAt(s,{p:new V()}),c=Math.cos(o.yaw),sn=Math.sin(o.yaw),x=o.p.x+c*5.5,z=o.p.z-sn*5.5,g=this.heightAt(x,z);if(g<WATER+.3)continue;pl.push([new THREE.CylinderGeometry(.11,.15,7,6),M(x,g+3.5,z),0x5a4a3a],[new THREE.BoxGeometry(1.6,.12,.12),M(x,g+6.6,z,0,o.yaw),0x5a4a3a]);}
  const plm=new THREE.Mesh(merge(pl),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}));plm.castShadow=true;scene.add(plm);}

 /* ---------------- camps ---------------- */
 buildCamps(scene){const P=[],canvasC=[0xe0d0b0,0xc8b48a,0xb89a70];this.fires=[];
  const B=(w,h,d,x,y,z,c,ry=0,rx=0,rz=0)=>[new THREE.BoxGeometry(w,h,d),M(x,y,z,rx,ry,rz),c];
  for(const c of this.camps){const y=c.y,r=rng(c.id+11);c.spots=[];
   // fire pit
   for(let k=0;k<9;k++){const a=k/9*6.28;P.push([new THREE.DodecahedronGeometry(.22,0),M(c.x+Math.cos(a)*.85,y+.08,c.z+Math.sin(a)*.85,r(),r(),r()),0x6a625a]);}
   for(let k=0;k<4;k++)P.push([new THREE.CylinderGeometry(.08,.1,1.3,6),M(c.x,y+.25,c.z,Math.PI/2-.4,k*.8,0),0x3a2a1c]);
   this.fires.push({x:c.x,y:y+.4,z:c.z,camp:c});
   // tents
   for(let k=0;k<3;k++){const a=.6+k*2.1+r()*.4,d=7+r()*2,tx=c.x+Math.cos(a)*d,tz=c.z+Math.sin(a)*d,ry=-a+Math.PI/2,ty=this.heightAt(tx,tz);const tg=new THREE.CylinderGeometry(1.6,1.6,3.4,3,1,false);tg.rotateX(Math.PI/2);tg.rotateZ(Math.PI/2);tg.scale(1.1,1,1);
    P.push([tg,M(tx,ty+.75,tz,0,ry),canvasC[k%3]],B(.08,2.2,.08,tx,ty+1.1,tz,0x4a3a2a));this.addObs({k:'tent',x:tx,z:tz,r:1.6,y0:ty-1,y1:ty+2});c.spots.push({x:tx+Math.cos(a)*2.4,z:tz+Math.sin(a)*2.4});}
   // crates, barrels, bedrolls, logs to sit on
   for(let k=0;k<5;k++){const a=r()*6.28,d=4+r()*9,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,yy=this.heightAt(x,z);if(k<3){P.push(B(1,1,1,x,yy+.5,z,0x8a6440,r()),B(1.02,.12,1.02,x,yy+.5,z,0x5a4028,r()));this.box(x-.5,yy-1,z-.5,x+.5,yy+1,z+.5,'crate');}else{P.push([new THREE.CylinderGeometry(.4,.4,1.05,10),M(x,yy+.52,z),0x6a4a2c]);this.addObs({k:'barrel',x,z,r:.42,y0:yy-1,y1:yy+1.05});}}
   for(let k=0;k<3;k++){const a=k*2.1+1,x=c.x+Math.cos(a)*2.6,z=c.z+Math.sin(a)*2.6;P.push([new THREE.CylinderGeometry(.25,.28,2.2,8),M(x,y+.25,z,0,-a,Math.PI/2),0x5a4430]);c.spots.push({x:c.x+Math.cos(a)*2.1,z:c.z+Math.sin(a)*2.1,sit:true,face:a+Math.PI});}
   for(let k=0;k<2;k++){const a=r()*6.28,x=c.x+Math.cos(a)*5,z=c.z+Math.sin(a)*5;P.push([new THREE.CylinderGeometry(.22,.22,1.8,8),M(x,this.heightAt(x,z)+.2,z,Math.PI/2,a,0),k?0x7a2a20:0x3a4a6a]);}
   // ruins: broken adobe walls
   if(c.kind==='ruins'){for(let k=0;k<6;k++){const a=k/6*6.28+.3,x=c.x+Math.cos(a)*16,z=c.z+Math.sin(a)*16,yy=this.heightAt(x,z),h=1.4+r()*2.4,w=4+r()*3;P.push(B(w,h,.7,x,yy+h/2-.3,z,0xc4906a,-a+Math.PI/2));const ca=Math.cos(-a+Math.PI/2),sa=Math.sin(-a+Math.PI/2);
     this.addObs({k:'wall',b:[x-Math.abs(ca)*w/2-Math.abs(sa)*.35,yy-1,z-Math.abs(sa)*w/2-Math.abs(ca)*.35,x+Math.abs(ca)*w/2+Math.abs(sa)*.35,yy+h-.3,z+Math.abs(sa)*w/2+Math.abs(ca)*.35],x,z,y0:yy-1,y1:yy+h});c.cover.push({x,z,r:w/2});}}
   // hitching posts for their horses
   const ha=r()*6.28,hx=c.x+Math.cos(ha)*11,hz=c.z+Math.sin(ha)*11,hy=this.heightAt(hx,hz);P.push(B(4,.14,.14,hx,hy+1.1,hz,0x5a3a20,-ha),B(.16,1.2,.16,hx+Math.cos(ha+1.57)*2,hy+.6,hz-Math.sin(ha+1.57)*-2,0x4a3020));c.hitch={x:hx,z:hz,a:ha};
   // lookout ladder/platform for the canyon camp
   if(c.kind==='canyon'){const lx=c.x+12,lz=c.z+6,ly=this.heightAt(lx,lz);for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])P.push(B(.22,4.4,.22,lx+sx*1.2,ly+2.2,lz+sz*1.2,0x5a4030));P.push(B(3,.2,3,lx,ly+4.4,lz,0x6a4a30),B(3,.8,.1,lx,ly+4.9,lz-1.45,0x6a4a30),B(3,.8,.1,lx,ly+4.9,lz+1.45,0x6a4a30));this.box(lx-1.5,ly+4.2,lz-1.5,lx+1.5,ly+4.5,lz+1.5,'porch');c.tower={x:lx,z:lz,y:ly+4.5};}}
  const g=merge(P);wuv(g,.5);const m=new THREE.Mesh(g,this.woodM);m.castShadow=m.receiveShadow=true;scene.add(m);}

 /* ---------------- dynamic ---------------- */
 // dusk 0 (afternoon) .. 1 (sunset): sun height, colours, fog, window glow
 setTime(u){this.dusk=u;}
 setQuality(q){if(!this.field)return;this.field.visible=q>0;this.field.count=q>=2?16000:7000;this.fieldU.uS.value=q>=2?70:46;}
 update(dt,time,cam){this.time=time;this.waterU.uT.value=time;this.fieldU.uT.value=time;this.skyU.uT.value=time;if(cam)this.fieldU.uCam.value.copy(cam);if(this.vis.fan)this.vis.fan.rotation.z=time*1.6;
  this.glassM.emissiveIntensity=smooth(.45,1,this.dusk)*1.6;}
 // top-down map image (minimap / map screen)
 drawMap(){const S=512,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),img=x.createImageData(S,S),cc=new THREE.Color();
  for(let j=0;j<S;j++)for(let i=0;i<S;i++){const wx=-EXT+(i+.5)/S*2*EXT,wz=-EXT+(j+.5)/S*2*EXT,h=this.heightAt(wx,wz);
   if(h<WATER)cc.setRGB(.25,.45,.5);else{cc.setRGB(.86,.68,.46);cc.lerp(new THREE.Color(.7,.38,.24),cl((h-14)/40,0,1));const sh=this.heightAt(wx-3,wz-3)-h;cc.multiplyScalar(1+cl(sh*.06,-.3,.3));}
   const k=(j*S+i)*4;img.data[k]=cc.r*255;img.data[k+1]=cc.g*255;img.data[k+2]=cc.b*255;img.data[k+3]=255;}
  x.putImageData(img,0,0);const sc=S/(2*EXT),P=v=>(v+EXT)*sc;
  x.strokeStyle='rgba(50,35,25,.85)';x.lineWidth=2;x.setLineDash([4,3]);x.beginPath();this.track.P.forEach((p,i)=>i?x.lineTo(P(p.x),P(p.z)):x.moveTo(P(p.x),P(p.z)));x.closePath();x.stroke();x.setLineDash([]);
  for(const b of BUILD){x.fillStyle='#4a3424';const fz=-b.s*9,bz=fz-b.s*b.d;x.fillRect(P(b.x-b.w/2),P(Math.min(fz,bz)),b.w*sc,b.d*sc);}
  x.fillStyle='rgba(40,90,40,.6)';for(const t of this.trees){x.beginPath();x.arc(P(t.x),P(t.z),1.6,0,7);x.fill();}
  this.map=c;this.mapScale=sc;}
}
