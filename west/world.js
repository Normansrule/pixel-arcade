// DUSTWATER — the frontier: heightfield desert with mesas, a canyon cut into the eastern tableland and a river, the town of
// Dustwater (saloon, sheriff's office + bounty board, general store, water tower, railway station), the railway loop with its
// trestles, three outlaw camps, vegetation (saguaro, prickly pear, scrub, cottonwoods, rocks, dry grass), the day-to-dusk sky,
// static colliders and ray queries. Terrain/water/grass-field techniques adapted from Storm Royale.
import * as THREE from '../vendor/three.module.min.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';
import {V,cl,lerp,smooth,rng,ctex,M,merge,lumpy,rayBox,rayCyl,boxNormal,wuv,normalFrom,tnoise,loft,vgrime,vnoise} from './util.js';
import {townMats,barrel as tBarrel,crate as tCrate,trough,hay,bench,lantern,sack,tent} from './townkit.js';
import {Scatter,item,terrainTextures,terrainMaterial,leafTex,sway,cards,saguaroGeo,yuccaGeo,ocotilloGeo,snagGeo,boulderGeo,stackGeo,rockTex} from './nature.js';

export const EXT=520,N=321,STEP=2*EXT/(N-1),WATER=1.2;
const G=10,gk=(i,k)=>(i+300)*1000+(k+300),Z0=new THREE.Matrix4().makeScale(0,0,0);
const MESAS=[{x:150,z:205,r:46,h:44},{x:-85,z:150,r:28,h:34},{x:255,z:85,r:30,h:46},{x:-430,z:-300,r:62,h:52},{x:440,z:430,r:58,h:64},{x:-410,z:430,r:46,h:46},{x:-10,z:-410,r:42,h:40},{x:-70,z:-235,r:20,h:28},
 {x:205,z:-165,r:9,h:34},{x:-250,z:60,r:8,h:26},{x:330,z:300,r:10,h:38},{x:60,z:470,r:34,h:36}];
const CANYON=[[120,-205],[190,-255],[262,-300],[330,-358],[372,-430],[400,-540]];
const RIVER=[[-330,-560],[-268,-420],[-292,-305],[-232,-210],[-190,-110],[-178,-20],[-212,120],[-168,250],[-196,400],[-160,560]];
const LOOP=[[160,-64],[300,-118],[405,-25],[392,175],[262,330],[40,392],[-178,345],[-340,205],[-392,25],[-300,-112],[-150,-64],[0,-62]];
// wagon roads out of town toward each piece of country (packed dirt, no scatter on them)
export const ROADS=[[[112,-6],[128,-60],[126,-130],[132,-196],[176,-240],[232,-282]],[[-112,-8],[-150,-60],[-182,-120],[-214,-180],[-236,-226]],[[40,44],[52,100],[46,160],[60,206]],[[-112,10],[-170,40],[-240,60],[-330,64]]];
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
 clearOf(x,z,pad){if(x>-120-pad&&x<120+pad&&z>-84-pad&&z<50+pad)return false;for(const R of ROADS)if(segDist(x,z,R)[0]<4.5+pad)return false;for(const c of this.camps)if(Math.hypot(x-c.x,z-c.z)<26+pad)return false;const t=this.trackNear(x,z);if(t&&t.d<6+pad)return false;return true;}
 scatter(){const r=rng(99);this.cacti=[];this.pears=[];this.scrub=[];this.trees=[];this.rocks=[];this.boulders=[];this.yucca=[];this.ocot=[];this.snags=[];this.forms=[];
  const slope=(x,z)=>1-this.normalAt(x,z).y;
  for(let n=0;n<26000&&this.cacti.length<520;n++){const x=(r()*2-1)*EXT*.97,z=(r()*2-1)*EXT*.97,h=this.heightAt(x,z);if(h<WATER+1.5||slope(x,z)>.18||!this.clearOf(x,z,3))continue;const[dr]=segDist(x,z,RIVER);if(dr<26)continue;
   if(r()>.35+.65*(this.fbm(x*.01+20,z*.01)*.5+.5))continue;const s=.75+r()*.55;this.cacti.push(this.addObs({k:'cactus',x,z,y:h,s,rot:r()*6.28,v:r()*4|0,r:.42*s,y0:h-1,y1:h+5.5*s}));}
  for(let n=0;n<14000&&this.pears.length<420;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER+1.2||slope(x,z)>.25||!this.clearOf(x,z,1))continue;this.pears.push([x,h,z,.6+r()*.7,r()*6.28]);}
  for(let n=0;n<30000&&this.scrub.length<1700;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER+.6||slope(x,z)>.35||!this.clearOf(x,z,0))continue;const[dr]=segDist(x,z,RIVER);this.scrub.push([x,h,z,.5+r()*.9,r()*6.28,dr<40?1:0]);}
  for(let n=0;n<12000&&this.yucca.length<380;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER+1||slope(x,z)>.3||!this.clearOf(x,z,0))continue;if(this.fbm(x*.013-9,z*.013)<-.05)continue;this.yucca.push([x,h,z,.7+r()*.7,r()*6.28]);}
  for(let n=0;n<9000&&this.ocot.length<150;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER+2||slope(x,z)>.32||!this.clearOf(x,z,2))continue;const[dr]=segDist(x,z,RIVER);if(dr<30)continue;this.ocot.push([x,h,z,.8+r()*.5,r()*6.28]);}
  // cottonwoods along the river, dead snags here and there
  for(let n=0;n<6000&&this.trees.length<150;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,[dr]=segDist(x,z,RIVER);if(dr<12||dr>34)continue;const h=this.heightAt(x,z);if(h<WATER+.8||slope(x,z)>.3||!this.clearOf(x,z,4))continue;const s=.85+r()*.6;this.trees.push(this.addObs({k:'tree',x,z,y:h,s,rot:r()*6.28,r:.5*s,y0:h-1,y1:h+7*s,tint:.85+r()*.3}));}
  for(let n=0;n<5000&&this.snags.length<44;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER+.5||slope(x,z)>.25||!this.clearOf(x,z,3))continue;const s=.8+r()*.6;this.snags.push(this.addObs({k:'tree',x,z,y:h,s,rot:r()*6.28,r:.25*s,y0:h-1,y1:h+3.5*s}));}
  for(let n=0;n<9000&&this.rocks.length<380;n++){const x=(r()*2-1)*EXT,z=(r()*2-1)*EXT,h=this.heightAt(x,z);if(h<WATER-1||!this.clearOf(x,z,2))continue;const sl=slope(x,z);if(sl>.42||sl<.12&&r()<.75)continue;const s=.6+r()*(sl>.2?2.6:1.8);this.rocks.push(this.addObs({k:'rock',x,z,y:h-s*sl*.9,s,rot:r()*6.28,r:s*.85,y0:h-2,y1:h+s*.7,tint:.8+r()*.35}));}
  // talus: fallen blocks around the foot of every mesa and butte
  for(const m of MESAS){const cnt=Math.round(m.r*.9);for(let k=0;k<cnt;k++){const a=r()*6.28,d=m.r+3+r()*r()*28,x=m.x+Math.cos(a)*d,z=m.z+Math.sin(a)*d,h=this.heightAt(x,z);if(h<WATER||!this.clearOf(x,z,2))continue;const sl=slope(x,z);const s=.9+r()*r()*4.2;this.rocks.push(this.addObs({k:'rock',x,z,y:h-s*Math.min(sl,.4)*.8,s,rot:r()*6.28,r:s*.85,y0:h-2,y1:h+s*.7,tint:.78+r()*.3}));}}
  // landforms: hoodoo clusters, needle spires beside the big mesas, a few balanced rocks
  const form=(k,x,z,H,s)=>{const h=this.heightAt(x,z);if(h<WATER+1||!this.clearOf(x,z,4))return;this.forms.push(this.addObs({k:'rock',x,z,y:h-.4,H,form:k,s,rot:r()*6.28,r:k==='spire'?H*.1:k==='hoodoo'?H*.09:1.6,y0:h-2,y1:h+H}));};
  for(const[cx,cz,n0]of[[175,-150,7],[-150,-250,5],[230,40,5],[-330,120,4],[380,260,5],[-40,330,4],[-470,-130,4]]){for(let k=0;k<n0;k++)form('hoodoo',cx+(r()-.5)*40,cz+(r()-.5)*40,5+r()*8,1);}
  for(const m of MESAS)if(m.r>25&&r()<.8){const a=r()*6.28,d=m.r+10+r()*16;form('spire',m.x+Math.cos(a)*d,m.z+Math.sin(a)*d,m.h*(.55+r()*.35),1);}
  for(const[x,z]of[[-120,-150],[200,120],[-300,330],[60,-260]])form('balance',x,z,6,1.5+r());
  // camp cover: boulders around each camp
  for(const c of this.camps){c.cover=[];const rc=rng(c.id*31+5);for(let i=0;i<7;i++){const a=i/7*6.28+rc()*.6,d=14+rc()*10,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,h=this.heightAt(x,z),s=1.3+rc()*.9;this.boulders.push(this.addObs({k:'rock',x,z,y:h,s,rot:rc()*6.28,r:s*.9,y0:h-2,y1:h+s*.75,tint:.85+rc()*.2}));c.cover.push({x,z,r:s*.9});}}}
 /* ---------------- visuals ---------------- */
 build(scene){const out=this.vis={};this.scene=scene;
  this.buildTerrain(scene);this.buildWater(scene);this.buildSky(scene);this.buildVeg(scene);this.buildTown(scene);this.buildRail(scene);this.buildCamps(scene);this.drawMap();return out;}
 buildTerrain(scene){const geo=new THREE.PlaneGeometry(2*EXT,2*EXT,N-1,N-1);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=new Float32Array(pos.count*3),spl=new Float32Array(pos.count*4),gcol=new Uint8Array(pos.count*4),c=new THREE.Color(),nrm=new V();
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
   {let rd=1e9;for(const RR of ROADS)rd=Math.min(rd,segDist(x,z,RR)[0]);const road=Math.max(1-smooth(2.4,4.6,rd),Math.abs(x)<150?smooth(10,6.5,Math.abs(z))*smooth(160,112,Math.abs(x)):0,smooth(10,2,dd)*.6);
    const nc=this.fbm(x*.006+40,z*.006,3)*.5+.5,crack=Math.max(smooth(.56,.76,nc)*(1-smooth(.06,.16,s))*.9,(1-smooth(9,24,dr))*smooth(WATER+.3,WATER+1,h)*.8,smooth(14,8,dd)*.3);
    let tal=0;for(const m of MESAS){const dm=Math.hypot(x-m.x,z-m.z)-m.r;if(dm>-4&&dm<34)tal=Math.max(tal,(1-smooth(4,34,dm))*.95);}const peb=Math.max(smooth(.07,.2,s)*(1-smooth(.36,.5,s)),tal,(1-smooth(4,12,dr))*smooth(WATER-.6,WATER+.4,h)*.8,smooth(.62,.8,this.fbm(x*.02-7,z*.02+3,2)*.5+.5)*.7);
    spl[v*4]=crack*(1-road);spl[v*4+1]=(gm+(1-smooth(14,40,dr))*.5)*(1-road);spl[v*4+2]=peb*(1-road*.8);spl[v*4+3]=road;}
   const gc=c.clone().lerp(new THREE.Color(0xd8b060),.55).lerp(new THREE.Color(0x9a9a50),(1-smooth(14,50,dr))*.6);gcol[v*4]=gc.r*255;gcol[v*4+1]=gc.g*255;gcol[v*4+2]=gc.b*255;gcol[v*4+3]=gm*255;}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  geo.setAttribute('aSplat',new THREE.BufferAttribute(spl,4));this.terrT=terrainTextures(512);const tm=this.terrM=terrainMaterial(this.terrT,true);
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
 buildVeg(scene){this.lowOnly=this.lowOnly||[];this.lowHide=this.lowHide||[];const vr=rng(17),U=this.windU={uT:{value:0},uWind:{value:1}},S=this.scatters=[];const add=(sc,base,f)=>{sc.base=base;if(f==='hide')sc.hideLow=true;if(f==='only')sc.onlyLow=true;S.push(sc);return sc;};
  const col=(t,g=1,b=1)=>[t,t*g,t*b];
  // saguaro: ribbed trunk + curving arms, spine-dotted rib texture
  const cactT=ctex(128,256,(x,w,h)=>{x.fillStyle='#c8c8c8';x.fillRect(0,0,w,h);for(let i=0;i<10;i++){const cx=i*w/10;const g=x.createLinearGradient(cx,0,cx+w/10,0);g.addColorStop(0,'#7a7a7a');g.addColorStop(.5,'#f4f4f4');g.addColorStop(1,'#7a7a7a');x.fillStyle=g;x.fillRect(cx,0,w/10,h);}
   for(let i=0;i<900;i++){const cx=(vr()*10|0)*w/10+w/20,cy=vr()*h;x.fillStyle=`rgba(255,248,215,${.5+vr()*.5})`;x.fillRect(cx-.6,cy,1.4,1.4);x.strokeStyle='rgba(250,240,200,.35)';x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+(vr()-.5)*5,cy-2-vr()*3);x.stroke();}
   for(let i=0;i<30;i++){x.fillStyle=`rgba(120,110,70,${.08+vr()*.12})`;x.fillRect(0,vr()*h,w,2+vr()*8);}});cactT.repeat.set(1,.25);
  const cn=normalFrom(cactT.image,3);cn.repeat.set(1,.25);const cm=new THREE.MeshStandardMaterial({vertexColors:true,map:cactT,normalMap:cn,roughness:.62,envMapIntensity:.8});
  for(let v=0;v<4;v++){const L=this.cacti.filter(c=>c.v===v).map(c=>item(c.x,c.y-.15,c.z,c.rot,c.s,col(.85+vr()*.3,1,.9)));add(new Scatter(scene,[{d:120,parts:[{geo:saguaroGeo(v,0),mat:cm,shadow:true}]},{d:440,parts:[{geo:saguaroGeo(v,1),mat:cm,shadow:true}]}],L,{colors:true}),1,'hide');}
  add(new Scatter(scene,[{d:440,parts:[{geo:saguaroGeo(0,1),mat:cm}]}],this.cacti.map(c=>item(c.x,c.y-.15,c.z,c.rot,c.s,col(.85+vr()*.3,1,.9))),{colors:true}),1,'only');
  // prickly pear: flattened pads + fruit
  const padG=(()=>{const parts=[];const pr=rng(3);for(let i=0;i<7;i++){const a=pr()*6.28,lv=i<3?0:1,y=.35+lv*.55+pr()*.1,x=Math.cos(a)*(.25+lv*.15),z=Math.sin(a)*(.25+lv*.15);parts.push([new THREE.SphereGeometry(.34,9,7),M(x,y,z,pr()*.6-.3,a,pr()*.8-.4,1,1.05,.26),i%3?0x6f8a46:0x7d9550]);for(let k=0;k<(pr()<.6?2:0);k++)parts.push([new THREE.SphereGeometry(.055,6,5),M(x+(pr()-.5)*.25,y+.33,z,0,0,0,1,1.3,1),0xc8405a]);}return merge(parts);})();
  const pm=new THREE.MeshStandardMaterial({vertexColors:true,map:cactT,roughness:.6,envMapIntensity:.8});add(new Scatter(scene,[{d:110,parts:[{geo:padG,mat:pm,shadow:true}]}],this.pears.map(p=>item(p[0],p[1]-.1,p[2],p[4],p[3],col(.85+vr()*.3,1,.85))),{colors:true}),1,'hide');
  // desert scrub: twiggy foliage cards round a dark core, swaying; a soft blob far away
  const scrubT=leafTex('scrub',5),fm=sway(new THREE.MeshStandardMaterial({vertexColors:true,map:scrubT,alphaTest:.45,side:THREE.DoubleSide,roughness:.9,envMapIntensity:.6}),U,.12,1.4);this.foliageM=fm;
  const bush=(()=>{const L=[];for(let i=0;i<7;i++){const a=i/7*6.28+vr()*.4;L.push([Math.cos(a)*.18,-.05,Math.sin(a)*.18,1.3+vr()*.4,1+vr()*.35,a+Math.PI/2,(vr()-.5)*.35]);}
   return merge([...cards(L,0x9a9a72,{cy:0}),[lumpy(new THREE.IcosahedronGeometry(.42,1),.2,4).scale(1.2,.65,1.2).translate(0,.18,0),null,0x5a5a40]]);})();
  const far=merge([[lumpy(new THREE.IcosahedronGeometry(.55,0),.25,9).scale(1.3,.7,1.3).translate(0,.25,0),null,0x8a8a64]]);const farM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
  add(new Scatter(scene,[{d:130,parts:[{geo:bush,mat:fm,shadow:true}]},{d:300,parts:[{geo:far,mat:farM}]}],this.scrub.map((b,i)=>item(b[0],b[1]-.08,b[2],b[4],b[3],b[5]?col(.66+(i%7)*.04,1.22,.8):col(.8+(i%7)*.05,.98,.78),b[3]*(.8+(i%5)*.08))),{colors:true}),1);
  // yucca rosettes and ocotillo whips
  const plantM=sway(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75,envMapIntensity:.7}),U,.05,1.6);
  add(new Scatter(scene,[{d:100,parts:[{geo:yuccaGeo(3),mat:plantM,shadow:true}]}],this.yucca.map(p=>item(p[0],p[1]-.05,p[2],p[4],p[3],col(.85+vr()*.3,1,.9))),{colors:true}),1,'hide');
  const ocM=sway(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}),U,.025,2);add(new Scatter(scene,[{d:150,parts:[{geo:ocotilloGeo(4),mat:ocM,shadow:true}]}],this.ocot.map(p=>item(p[0],p[1]-.05,p[2],p[4],p[3],col(.9+vr()*.2))),{colors:true}),1,'hide');
  // cottonwoods: lofted trunk + limbs, a canopy of leaf cards that sways; puffs far away
  const barkT=ctex(128,256,(x,w,h)=>{x.fillStyle='#c8c0b8';x.fillRect(0,0,w,h);for(let i=0;i<260;i++){const v=90+vr()*120|0;x.fillStyle=`rgb(${v},${v-4},${v-10})`;x.fillRect(vr()*w,vr()*h,1+vr()*3,14+vr()*70);}for(let i=0;i<40;i++){x.fillStyle='rgba(40,34,28,.6)';x.fillRect(vr()*w,vr()*h,1.5,20+vr()*60);}});
  const barkM=new THREE.MeshStandardMaterial({vertexColors:true,map:barkT,normalMap:normalFrom(barkT.image,3),roughness:.92});
  const limb=(x0,y0,z0,x1,y1,z1,r0,r1)=>[loft([{c:[x0,y0,z0],rx:r0,ry:r0},{c:[(x0+x1)/2,(y0+y1)/2+.2,(z0+z1)/2],rx:(r0+r1)/2,ry:(r0+r1)/2},{c:[x1,y1,z1],rx:r1,ry:r1}],7,{sub:2}),null,0x7a6a58];
  const tB=merge([[loft([{c:[0,-.3,0],rx:.55,ry:.5},{c:[0,.4,0],rx:.42,ry:.4},{c:[.15,2.2,.1],rx:.34,ry:.32},{c:[.1,3.8,0],rx:.28,ry:.26},{c:[-.1,4.8,.1],rx:.18,ry:.18}],9,{sub:2}),null,0x7a6a58],
   limb(.1,3.6,0,1.9,5.6,.6,.2,.07),limb(.05,3.9,0,-1.8,5.8,-.5,.18,.06),limb(0,4.4,0,.4,6.8,1.5,.15,.05),limb(0,4.2,0,-.5,6.6,-1.6,.15,.05),limb(.1,3.2,0,.8,4.6,-1.7,.14,.05)]);wuv(tB,.9);
  const leafT=leafTex('leaf',8),lm=sway(new THREE.MeshStandardMaterial({vertexColors:true,map:leafT,alphaTest:.45,side:THREE.DoubleSide,roughness:.8,envMapIntensity:.7}),U,.035,1.25);
  const canopy=(()=>{const L=[],cr=rng(21),C=[[1.9,5.8,.6],[-1.8,6,-.5],[.4,7.2,1.5],[-.5,7,-1.6],[.8,5,-1.7],[0,7.6,0],[1.2,6.8,-.6],[-1.2,6.6,.8]];for(const[cx,cy,cz]of C)for(let k=0;k<3;k++)L.push([cx+(cr()-.5),cy-1.1+(cr()-.5)*.6,cz+(cr()-.5),2.6+cr(),2.2+cr()*.6,cr()*6.28,(cr()-.5)*.6]);
   return merge(cards(L,0x7a9a3a,{cx:0,cy:6.2,cz:0}));})();
  const puff=(r,amt,seed,x,y,z)=>lumpy(new THREE.IcosahedronGeometry(r,1),amt,seed).translate(x,y,z);
  const tL=merge([[puff(2.4,.7,3,0,6,0),null,0x56702a],[puff(1.9,.6,4,1.8,5.4,.6),null,0x5e7830],[puff(1.8,.6,5,-1.6,5.7,-.6),null,0x4e6a28]]);const tLM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,envMapIntensity:.5});
  const tItems=this.trees.map(t=>item(t.x,t.y-.2,t.z,t.rot,t.s,[t.tint,t.tint,t.tint*.8]));
  add(new Scatter(scene,[{d:170,parts:[{geo:tB,mat:barkM,shadow:true},{geo:canopy,mat:lm,shadow:true}]},{d:620,parts:[{geo:tB,mat:barkM},{geo:tL,mat:tLM}]}],tItems,{colors:true}),1,'hide');
  {const tBc=tB.clone();const c=tBc.attributes.color;for(let i=0;i<c.count;i++)c.setXYZ(i,.36,.3,.24);add(new Scatter(scene,[{d:620,parts:[{geo:merge([[tBc,null,null],[tL,null,null]]),mat:tLM}]}],tItems,{colors:true}),1,'only');}
  add(new Scatter(scene,[{d:260,parts:[{geo:snagGeo(2),mat:barkM,shadow:true}]}],this.snags.map(t=>item(t.x,t.y-.1,t.z,t.rot,t.s,[1,1,1])),{colors:true}),1,'hide');
  // rocks: four layered sandstone boulders (near detail / far simple), hoodoos, spires, balanced rocks
  const RT=rockTex(),rockM=this.rockM=new THREE.MeshStandardMaterial({vertexColors:true,map:RT.map,normalMap:RT.normal,normalScale:new THREE.Vector2(.9,.9),roughness:.88,envMapIntensity:.6});
  const all=[...this.rocks,...this.boulders];for(let v=0;v<4;v++){const L=all.filter((o,i)=>i%4===v).map(o=>item(o.x,o.y-.2,o.z,o.rot,o.s,[o.tint,o.tint*.9,o.tint*.82]));
   add(new Scatter(scene,[{d:130,parts:[{geo:boulderGeo(11+v*7,3),mat:rockM,shadow:true}]},{d:520,parts:[{geo:boulderGeo(11+v*7,1),mat:rockM,shadow:true}]}],L,{colors:true}),1,'hide');}
  add(new Scatter(scene,[{d:520,parts:[{geo:boulderGeo(11,1),mat:rockM}]}],all.map(o=>item(o.x,o.y-.2,o.z,o.rot,o.s,[o.tint,o.tint*.9,o.tint*.82])),{colors:true}),1,'only');
  const fr=rng(77),FL=[];for(const k of['hoodoo','spire','balance']){const L=this.forms.filter(f=>f.form===k);if(!L.length)continue;
   for(let v=0;v<2;v++){const g=stackGeo(5+v*11+(k==='spire'?100:k==='hoodoo'?200:300),k,2),gf=stackGeo(5+v*11+(k==='spire'?100:k==='hoodoo'?200:300),k,1),hh=g.userData.h;
    add(new Scatter(scene,[{d:260,parts:[{geo:g,mat:rockM,shadow:true}]},{d:1500,parts:[{geo:gf,mat:rockM,shadow:true}]}],L.filter((f,i)=>i%2===v).map(f=>item(f.x,f.y,f.z,f.rot,k==='balance'?f.s*.8:f.H/hh*(k==='spire'?.9:1.1),[.9+fr()*.15,.88,.85],k==='balance'?f.s*.8:f.H/hh)),{colors:true}),1,'hide');
    if(v===0)for(const f of L)FL.push([gf,new THREE.Matrix4().fromArray(item(f.x,f.y,f.z,f.rot,k==='balance'?f.s*.8:f.H/hh*(k==='spire'?.9:1.1),null,k==='balance'?f.s*.8:f.H/hh).e),null]);}}
  // LOW: every hoodoo / spire / balanced rock as one static merged mesh (one draw call)
  {const fm2=new THREE.Mesh(merge(FL),rockM);fm2.visible=false;scene.add(fm2);this.lowOnly.push(fm2);}
  // cap-rock ledges along every mesa rim: breaks the smooth heightfield silhouette
  {const rim=[],rr=rng(5);for(const m of this.mesas){const n=Math.round(m.r*.75);for(let k=0;k<n;k++){const a=k/n*6.28+rr()*.2;let d=m.r*.5;const top=this.heightAt(m.x,m.z);while(d<m.r+12&&this.heightAt(m.x+Math.cos(a)*d,m.z+Math.sin(a)*d)>top-2.5)d+=.8;
     const x=m.x+Math.cos(a)*(d-1.6),z=m.z+Math.sin(a)*(d-1.6),y=this.heightAt(m.x+Math.cos(a)*(d-4),m.z+Math.sin(a)*(d-4));if(k%2)continue;rim.push(item(x,y-1.1,z,a+rr(),3.5+rr()*3,[.82+rr()*.15,.8,.78],.9+rr()*.6));}}
   add(new Scatter(scene,[{d:240,parts:[{geo:boulderGeo(91,2,{sy:1,clip:.45}),mat:rockM,shadow:true}]},{d:1600,parts:[{geo:boulderGeo(91,1,{sy:1,clip:.45}),mat:rockM}]}],rim,{colors:true}),1);}
  this.leafM=fm;}
 // vegetation distance scale per quality + per-frame culling
 setScatterQ(q){const k=[.62,1,1.4][q]??1;for(const s of this.scatters){s.setScale(k*s.base);s.setLow(q===0);}}
 /* ---------------- town ---------------- */
 buildTown(scene){const y0=this.townY,P=[],GL=[],r=rng(4);this.town={doors:{},y:y0};
  const TM=this.tm=townMats(),plankT=this.plankT=TM.plankT,woodM=this.woodM=TM.woodM,glassM=this.glassM=TM.glassM,RF=[],MT=[],WT=[];
  const brickT=ctex(256,256,(x,w,h)=>{x.fillStyle='#8a8580';x.fillRect(0,0,w,h);for(let j=0;j<16;j++)for(let i=0;i<9;i++){const v=150+r()*80|0;x.fillStyle=`rgb(${v},${v*.96|0},${v*.92|0})`;x.fillRect(i*32+(j%2)*16-16,j*16+1,30,14);x.fillStyle=`rgba(255,255,255,${r()*.12})`;x.fillRect(i*32+(j%2)*16-16+r()*20,j*16+3,6,4);}});
  const brickM=new THREE.MeshStandardMaterial({vertexColors:true,map:brickT,normalMap:normalFrom(brickT.image,2.5),roughness:.9,envMapIntensity:.6});
  const put=([W,Mm,X,Gl])=>{P.push(...W);MT.push(...Mm);if(X)WT.push(...X);if(Gl)GL.push(...Gl);};
  // sign atlas
  const signs=BUILD.map(b=>b.sign).filter(Boolean).concat(['DUSTWATER','WANTED','DEPOT']);const asp=BUILD.filter(b=>b.sign).map(b=>Math.min(b.w-1.2,b.sign.length>8?10:7)/Math.min(1.7,b.ff+.2)).concat([8/.9,6,5/.9]);const sDraw=(x,w,h)=>{x.fillStyle='#2a2018';x.fillRect(0,0,w,h);signs.forEach((s,i)=>{const yy=i*(h/16);x.fillStyle=i%3===0?'#efe2c0':i%3===1?'#e8d49c':'#f2e6c8';x.fillRect(4,yy+4,w-8,h/16-8);x.strokeStyle='#3a2414';x.lineWidth=5;x.strokeRect(10,yy+10,w-20,h/16-20);
    x.fillStyle=i%2?'#5a1a10':'#2a1a10';x.font=`50px Anton, Impact, sans-serif`;x.textAlign='center';x.textBaseline='middle';const sy=.82,sx=sy*16/(asp[i]||5);x.save();x.translate(w/2,yy+h/32+3);x.scale(sx,sy);x.fillText(s,0,0,(w-70)/sx);x.restore();const rr=rng(i+3);for(let k=0;k<60;k++){x.fillStyle=`rgba(${rr()<.5?255:60},${rr()<.5?245:50},${rr()<.5?225:40},${.05+rr()*.12})`;x.fillRect(8+rr()*(w-16),yy+8+rr()*(h/16-16),2+rr()*14,1+rr()*2);}for(let k=0;k<8;k++){x.strokeStyle='rgba(60,40,24,.18)';x.lineWidth=1;const ly=yy+10+rr()*(h/16-20);x.beginPath();x.moveTo(8,ly);x.lineTo(w-8,ly+(rr()-.5)*3);x.stroke();}});};const SA=ctex(1024,1024,sDraw,{clamp:true});if(document.fonts)document.fonts.load('50px Anton').then(()=>{sDraw(SA.image.getContext('2d'),1024,1024);SA.needsUpdate=true;}).catch(()=>{});
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
   {const ang=b.barn?.55:.32,hw=b.w/2+.35,sl=hw/Math.cos(ang),rise=Math.tan(ang)*hw;for(const k of[-1,1])RF.push(B(sl,.14,b.d+.5,b.x+k*hw/2,fy+b.h+rise/2+.05,cz,0x7a6a5a,0,0,-k*ang));
    P.push([new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-hw+.3,0),new THREE.Vector2(hw-.3,0),new THREE.Vector2(0,rise-.1)]),{depth:b.d,bevelEnabled:false}),M(b.x,fy+b.h,Math.min(fz,bz)),c]);
    if(!b.barn&&r()<.75){const px=b.x+(r()-.5)*b.w*.5,pz=cz+(r()-.5)*b.d*.4;MT.push([new THREE.CylinderGeometry(.13,.13,2.4+rise,8),M(px,fy+b.h+1.2,pz),0x2a2826],[new THREE.ConeGeometry(.25,.25,8),M(px,fy+b.h+2.5+rise*.5,pz),0x2a2826]);}}
   // corner boards + base
   for(const sx of[-1,1])P.push(B(.25,b.h+b.ff,.25,b.x+sx*b.w/2,fy+(b.h+b.ff)/2,fz-s*.12,trim));P.push(B(b.w+.1,.35,b.d+.1,b.x,fy+.17,cz,0x4a3a2c));
   // door + windows on the front
   const fl=b.st||1,doorW=b.barn?4:b.bat?2:1.4,doorH=b.barn?4.2:2.5;if(b.bat)GL.push(B(doorW,doorH,.1,b.x,fy+.4+doorH/2,fz+s*.02,0x1b1712));else{P.push(B(doorW,doorH,.1,b.x,fy+.4+doorH/2,fz+s*.03,0x4a3222));for(const py of[.3,.72])P.push(B(doorW*.7,doorH*.28,.04,b.x,fy+.4+doorH*py,fz+s*.09,0x5a3c28));MT.push([new THREE.SphereGeometry(.04,6,5),M(b.x+doorW*.36,fy+1.45,fz+s*.12),0xb09050]);if(!b.barn)GL.push(B(doorW*.5,doorH*.18,.04,b.x,fy+.4+doorH*.86,fz+s*.08,0x1b1712));}P.push(B(doorW+.4,.25,.2,b.x,fy+.45+doorH,fz+s*.05,trim));
   for(const sx of[-1,1])P.push(B(.2,doorH,.2,b.x+sx*(doorW/2+.1),fy+.4+doorH/2,fz+s*.05,trim));
   if(b.bat)for(const sx of[-1,1])P.push(B(.95,1.1,.08,b.x+sx*.5,fy+1.7,fz+s*.35,0x6a3a20,sx*s*.5));
   const nw=Math.max(1,Math.floor((b.w-doorW-2)/4));for(let f=0;f<fl;f++){const wy=fy+1.9+f*3.1;for(const sx of[-1,1])for(let k=0;k<nw;k++){if(f===0&&b.barn)continue;const wx=b.x+sx*(doorW/2+1.3+k*2.3);if(f===1&&Math.abs(wx-b.x)<1)continue;
    GL.push(B(1.2,1.5,.1,wx,wy,fz+s*.02,0x1b1712));P.push(B(1.2,.06,.1,wx,wy,fz+s*.07,trim),B(1.5,.15,.25,wx,wy-.8,fz+s*.08,trim),B(1.5,.15,.22,wx,wy+.8,fz+s*.08,trim),B(.12,1.6,.22,wx-.7,wy,fz+s*.08,trim),B(.12,1.6,.22,wx+.7,wy,fz+s*.08,trim),B(.08,1.5,.12,wx,wy,fz+s*.06,trim));}
    if(f===1){GL.push(B(1.2,2.3,.1,b.x,fy+1.4+3.1,fz+s*.02,0x1b1712));}}
   // porch: deck, posts, awning (+ balcony)
   const pd=3.2,pz=fz+s*pd/2;P.push(B(b.w+.4,.3,pd,b.x,fy+.3,pz,0x7a5a3c));for(let k=0;k<6;k++)P.push(B(b.w+.4,.02,.04,b.x,fy+.46,fz+s*(k*.55+.2),0x3a2a1c));
   const npost=Math.max(2,Math.round(b.w/4)+1);for(let k=0;k<npost;k++){const px=b.x-b.w/2+.15+k*(b.w-.3)/(npost-1);P.push(B(.22,3.3,.22,px,fy+1.95,fz+s*(pd-.2),0x6a4a30));}
   if(b.bal){RF.push(B(b.w+.6,.12,pd+.5,b.x,fy+6.45,fz+s*(pd/2+.1),0x6a5a4a,0,s*-.12));P.push(B(b.w+.4,.25,pd,b.x,fy+3.7,pz,0x6a4a30));for(let k=0;k<b.w*2.5;k++)P.push(B(.06,.9,.06,b.x-b.w/2+k*.4,fy+4.3,fz+s*(pd-.15),0x5a3a20));P.push(B(b.w+.4,.1,.12,b.x,fy+4.75,fz+s*(pd-.15),0x5a3a20));for(let k=0;k<npost;k++){const px=b.x-b.w/2+.15+k*(b.w-.3)/(npost-1);P.push(B(.18,2.6,.18,px,fy+5,fz+s*(pd-.2),0x6a4a30));}}
   else RF.push(B(b.w+.6,.12,pd+.5,b.x,fy+3.65,fz+s*(pd/2+.1),0x6a5a4a,0,s*-.1));
   for(let k=0;k<Math.max(2,Math.round(b.w/4)+1);k+=2){const px=b.x-b.w/2+.15+k*(b.w-.3)/(Math.max(2,Math.round(b.w/4)+1)-1);put(lantern(px,fy+2.9,fz+s*(pd-.45)));MT.push(B(.04,.04,.3,px,fy+3.15,fz+s*(pd-.32),0x2a2826));}
   if(r()<.7)put(bench(b.x+(r()<.5?-1:1)*(b.w/2-1.4),fy+.45,fz+s*.55,s<0?Math.PI:0));
   if(r()<.6)put(trough(b.x+2,fy,fz+s*(pd+2.6),0));
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
  const barrel=(x,z,s=1)=>{put(tBarrel(x,y0,z,s,[0x7a5232,0x6a4628,0x8a6038][r()*3|0]));this.addObs({k:'barrel',x,z,r:.45*s,y0:y0-1,y1:y0+1.1*s});};
  const crate=(x,z,s=1,ry=0)=>{put(tCrate(x,y0,z,s,ry));this.box(x-.5*s,y0-1,z-.5*s,x+.5*s,y0+s,z+.5*s,'crate');};
  for(const[x,z]of[[-44,-12.6],[-27,-12.4],[3,13],[22,13.2],[40,-12.6],[-62,12.8]])barrel(x,z);barrel(-43.2,-13.3,.9);
  for(const[x,z]of[[-24,13.4],[-25.2,13.6],[42,12.8],[-6,-12.2]])crate(x,z,1,r()*.4);
  for(const[x,z]of[[-27.6,13.6],[-28.4,14.4],[-29.2,13.5]])put(sack(x,y0+.45,z,r()*3));for(const[x,z,ry]of[[-46,13.5,.2],[-47.3,13.8,-.1],[-58,13,1.4],[-46.6,14.4,.4]])put(hay(x,y0,z,ry));
  for(const[x,z]of[[-23,-12.8],[33,13.6],[-57,12.6]])crate(x,z,.8,r());put(trough(-50,y0,21.6,0));
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
  const tg=merge(P);wuv(tg,.42);vgrime(tg,y0-.3,y0+2.4,.5);vnoise(tg,.1,.35,7);const tmesh=new THREE.Mesh(tg,woodM);tmesh.castShadow=tmesh.receiveShadow=true;scene.add(tmesh);
  {const rg=merge(RF);wuv(rg,.5);vnoise(rg,.15,.3,9);const rm=new THREE.Mesh(rg,TM.roofM);rm.castShadow=rm.receiveShadow=true;scene.add(rm);
   const mg=merge(MT);const mm=new THREE.Mesh(mg,TM.metalM);mm.castShadow=true;scene.add(mm);this.lowHide.push(mm);if(WT.length){const wm=new THREE.Mesh(merge(WT),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.04,metalness:.1,envMapIntensity:1.4}));scene.add(wm);this.lowHide.push(wm);}}
  if(bricks.length){const bg=merge(bricks);wuv(bg,.5);vgrime(bg,y0-.3,y0+2.4,.55);const bm=new THREE.Mesh(bg,brickM);bm.castShadow=bm.receiveShadow=true;scene.add(bm);}
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
 buildCamps(scene){const P=[],CV=[],AD=[],MTc=[],canvasC=[0xe6dcc4,0xd4c49e,0xc4ac84];this.fires=[];const TM=this.tm;
  const B=(w,h,d,x,y,z,c,ry=0,rx=0,rz=0)=>[new THREE.BoxGeometry(w,h,d),M(x,y,z,rx,ry,rz),c];
  const put=([w,m,c])=>{P.push(...w);if(m)MTc.push(...m);if(c)CV.push(...c);};
  const stone=(x,y,z,s,r,c=0x6a625a)=>{const g=new THREE.IcosahedronGeometry(s,0);g.scale(1,.62,.9);return[g,M(x,y,z,r()*.4,r()*6,r()*.4),c];};
  for(const c of this.camps){const y=c.y,r=rng(c.id+11);c.spots=[];
   // fire pit: flattened stone ring, ash bed, charred logs in a teepee, spare firewood + a coffee pot on a stone
   for(let k=0;k<13;k++){const a=k/13*6.28+r()*.2,rr=.95+r()*.1;P.push(stone(c.x+Math.cos(a)*rr,y+.06,c.z+Math.sin(a)*rr,.2+r()*.08,r,k%3?0x6a625a:0x55504a));}
   P.push([new THREE.CircleGeometry(.85,14).rotateX(-Math.PI/2),M(c.x,y+.03,c.z),0x2a2622]);
   for(let k=0;k<5;k++){const a=k/5*6.28+.3,g=new THREE.CylinderGeometry(.05,.075,1.1,6);g.translate(0,.55,0);P.push([g,M(c.x+Math.cos(a)*.42,y+.02,c.z+Math.sin(a)*.42,0,0,0).multiply(new THREE.Matrix4().makeRotationAxis(new V(-Math.sin(a),0,Math.cos(a)),-.62)),k%2?0x241a14:0x3a2a1c]);}
   for(let k=0;k<4;k++){const a=2.4+k*.12,x=c.x+Math.cos(a)*1.9,z=c.z+Math.sin(a)*1.9;P.push([new THREE.CylinderGeometry(.07,.08,.9,6).rotateZ(Math.PI/2).rotateY(a+.2*k),M(x,y+.08+(k>1?.14:0),z),0x5a4430]);}
   P.push(stone(c.x+1.4,y+.1,c.z-.6,.22,r));MTc.push([new THREE.CylinderGeometry(.07,.09,.2,8),M(c.x+1.4,y+.32,c.z-.6),0x4a4a4c],[new THREE.ConeGeometry(.07,.08,8),M(c.x+1.4,y+.46,c.z-.6),0x4a4a4c]);
   this.fires.push({x:c.x,y:y+.4,z:c.z,camp:c});
   // tents (A-frame canvas, doors facing the fire)
   for(let k=0;k<3;k++){const a=.6+k*2.1+r()*.4,d=7+r()*2,tx=c.x+Math.cos(a)*d,tz=c.z+Math.sin(a)*d,ry=Math.atan2(-Math.cos(a),-Math.sin(a)),ty=this.heightAt(tx,tz);
    put(tent(tx,ty-.05,tz,ry,2.6+r()*.4,3.1+r()*.5,1.8+r()*.3,canvasC[k%3]));P.push([new THREE.BoxGeometry(.7,.06,1.8),M(tx-Math.cos(a)*.3,ty+.04,tz-Math.sin(a)*.3,0,ry),k?0x7a2a20:0x3a4a6a]);
    this.addObs({k:'tent',x:tx,z:tz,r:1.6,y0:ty-1,y1:ty+2});c.spots.push({x:tx-Math.cos(a)*2.6,z:tz-Math.sin(a)*2.6});}
   // crates, barrels, sacks, logs to sit on
   for(let k=0;k<6;k++){const a=r()*6.28,d=4+r()*9,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,yy=this.heightAt(x,z);if(k<3){put(tCrate(x,yy,z,1,r()*1.5));this.box(x-.5,yy-1,z-.5,x+.5,yy+1,z+.5,'crate');}else if(k<5){put(tBarrel(x,yy,z,1));this.addObs({k:'barrel',x,z,r:.42,y0:yy-1,y1:yy+1.05});}else put(sack(x,yy,z,r()*3));}
   for(let k=0;k<3;k++){const a=k*2.1+1,x=c.x+Math.cos(a)*2.6,z=c.z+Math.sin(a)*2.6,lg=new THREE.CylinderGeometry(.25,.29,2.2,9);P.push([lg,M(x,y+.24,z,0,-a,Math.PI/2),0x5a4430]);for(const e of[-1.1,1.1])P.push([new THREE.CircleGeometry(.24,9),M(x+Math.sin(a)*e*1.005,y+.24,z-Math.cos(a)*e*1.005,0,-a+(e>0?Math.PI/2:-Math.PI/2),0),0xb08860]);c.spots.push({x:c.x+Math.cos(a)*2.1,z:c.z+Math.sin(a)*2.1,sit:true,face:a+Math.PI});}
   // ruins: crumbling adobe walls with stepped broken tops, protruding viga beams and fallen bricks
   if(c.kind==='ruins'){for(let k=0;k<6;k++){const a=k/6*6.28+.3,x=c.x+Math.cos(a)*16,z=c.z+Math.sin(a)*16,yy=this.heightAt(x,z),h=1.4+r()*2.4,w=4+r()*3,ry=-a+Math.PI/2,ca=Math.cos(ry),sa=Math.sin(ry);
     const n=4+(r()*3|0);for(let q=0;q<n;q++){const u=-w/2+(q+.5)*w/n,hh=h*(.55+.45*Math.sin((q+1)/(n+1)*Math.PI))*(.8+r()*.3);const gw=new THREE.BoxGeometry(w/n+.02,hh,.7,2,3,1);AD.push([gw,M(x+u*ca,yy+hh/2-.3,z-u*sa,0,ry),0xd2a07a]);}
     for(let q=0;q<2;q++){const u=(r()-.5)*w*.7;AD.push([new THREE.BoxGeometry(.18,.18,1.4),M(x+u*ca,yy+h*.7,z-u*sa,0,ry),0x5a4430]);}
     for(let q=0;q<4;q++){const u=(r()-.5)*w,o=(r()<.5?-1:1)*(.7+r()*.8);AD.push(B(.4,.14,.24,x+u*ca+o*sa,yy+.05,z-u*sa+o*ca,0xb88a64,r()*3,r()*.3,r()*.3));}
     this.addObs({k:'wall',b:[x-Math.abs(ca)*w/2-Math.abs(sa)*.35,yy-1,z-Math.abs(sa)*w/2-Math.abs(ca)*.35,x+Math.abs(ca)*w/2+Math.abs(sa)*.35,yy+h-.3,z+Math.abs(sa)*w/2+Math.abs(ca)*.35],x,z,y0:yy-1,y1:yy+h});c.cover.push({x,z,r:w/2});}}
   // hitching rail for their horses
   const ha=r()*6.28,hx=c.x+Math.cos(ha)*11,hz=c.z+Math.sin(ha)*11,hy=this.heightAt(hx,hz),pc=Math.cos(ha+1.57),ps=Math.sin(ha+1.57);P.push([new THREE.CylinderGeometry(.06,.07,4,7).rotateZ(Math.PI/2).rotateY(-ha),M(hx,hy+1.1,hz),0x5a3a20]);for(const e of[-1.8,1.8])P.push([new THREE.CylinderGeometry(.08,.1,1.25,7),M(hx+pc*e,hy+.6,hz-ps*-e),0x4a3020]);c.hitch={x:hx,z:hz,a:ha};
   // lookout tower for the canyon camp: splayed legs, X-bracing, ladder, plank deck with rails
   if(c.kind==='canyon'){const lx=c.x+12,lz=c.z+6,ly=this.heightAt(lx,lz);for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])P.push([new THREE.CylinderGeometry(.1,.13,4.7,7),M(lx+sx*1.32,ly+2.2,lz+sz*1.32,sz*.06,0,-sx*.06),0x5a4030]);
    for(const f of[-1,1])for(const hb of[1.2,3])P.push([new THREE.BoxGeometry(.08,2.6,.1),M(lx,ly+hb,lz+f*1.3,0,0,.75),0x4e3a2a],[new THREE.BoxGeometry(.08,2.6,.1),M(lx,ly+hb,lz+f*1.3,0,0,-.75),0x4e3a2a],[new THREE.BoxGeometry(.1,2.6,.08),M(lx+f*1.3,ly+hb,lz,.75,0,0),0x4e3a2a]);
    for(let q=0;q<6;q++)P.push(B(.5,.08,3.1,lx-1.25+q*.5,ly+4.42,lz,q%2?0x6a4a30:0x765236));for(const f of[-1,1]){P.push(B(3,.08,.08,lx,ly+5.2,lz+f*1.45,0x6a4a30),B(.08,.08,3,lx+f*1.45,ly+5.2,lz,0x6a4a30));for(const u of[-1.45,0,1.45])P.push(B(.08,.8,.08,lx+u,ly+4.8,lz+f*1.45,0x5a4030));}
    for(const e of[-.25,.25])P.push(B(.07,4.6,.07,lx+e,ly+2.2,lz+1.75,0x5a4030,0,-.12));for(let q=0;q<10;q++)P.push(B(.55,.05,.05,lx,ly+.3+q*.44,lz+1.72-q*.44*.12,0x6a4a30));
    this.box(lx-1.5,ly+4.2,lz-1.5,lx+1.5,ly+4.5,lz+1.5,'porch');c.tower={x:lx,z:lz,y:ly+4.5};}}
  const g=merge(P);wuv(g,.5);vnoise(g,.12,.5,5);const m=new THREE.Mesh(g,this.woodM);m.castShadow=m.receiveShadow=true;scene.add(m);
  if(CV.length){const cg=merge(CV);wuv(cg,.6);const cm=new THREE.Mesh(cg,TM.canvasM);cm.castShadow=cm.receiveShadow=true;scene.add(cm);}
  if(AD.length){const ag=merge(AD);wuv(ag,.45);vnoise(ag,.1,.4,9);const am=new THREE.Mesh(ag,TM.adobeM);am.castShadow=am.receiveShadow=true;scene.add(am);}
  if(MTc.length){const mm=new THREE.Mesh(merge(MTc),TM.metalM);mm.castShadow=true;scene.add(mm);this.lowHide.push(mm);}}

 /* ---------------- dynamic ---------------- */
 // dusk 0 (afternoon) .. 1 (sunset): sun height, colours, fog, window glow
 setTime(u){this.dusk=u;}
 setQuality(q){this.q=q;this.setScatterQ(q);for(const m of this.lowOnly||[])m.visible=q===0;for(const m of this.lowHide||[])m.visible=q>0;if(!this.field)return;this.field.visible=q>0;this.field.count=q>=2?16000:7000;this.fieldU.uS.value=q>=2?70:46;}
 update(dt,time,cam,camObj){this.time=time;this.waterU.uT.value=time;this.fieldU.uT.value=time;this.skyU.uT.value=time;this.windU.uT.value=time;this.windU.uWind.value=.75+.35*Math.sin(time*.23)+.2*Math.sin(time*.71);if(cam)this.fieldU.uCam.value.copy(cam);
  if(cam&&camObj){camObj.getWorldDirection(this._fw||(this._fw=new V()));for(const sc of this.scatters)sc.update(cam,this._fw,dt);}if(this.vis.fan)this.vis.fan.rotation.z=time*1.6;
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
