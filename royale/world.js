// STORM ROYALE — the island: heightfield terrain, stylised water + sky + clouds, vegetation, named locations,
// prefab houses (built from destructible build pieces), harvestable trees / rocks / metal, static colliders and ray queries.
import * as THREE from '../vendor/three.module.min.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';
import {V,cl,lerp,smooth,rng,ctex,M,merge,lumpy,rayBox,rayCyl,boxNormal} from './util.js';
import {CELL,H,D} from './build.js';

export const EXT=420,N=337,STEP=2*EXT/(N-1),ISLAND=290;
export const SUN=new V(.42,.78,.46).normalize();
export const SKY={top:new THREE.Color(0x2f86e0),hor:new THREE.Color(0xcfeaff),fog:0xc4e2f7};
const G=8,gk=(i,k)=>(i+200)*1000+(k+200);
const POIS=[
 {n:'DRIFTWOOD DOCKS',ang:2.62,kind:'docks',houses:3,r:34},
 {n:'PINECREST',x:-95,z:-140,kind:'village',houses:5,r:44},
 {n:'COPPER QUARRY',x:150,z:-100,kind:'quarry',houses:2,r:38},
 {n:'RUSTBOLT YARD',x:165,z:55,kind:'yard',houses:2,r:40},
 {n:'SUNNY SUBURBS',x:5,z:15,kind:'suburb',houses:7,r:50},
 {n:'WINDMILL HILL',x:-135,z:5,kind:'hill',houses:2,r:30},
 {n:'LANTERN LAKE',x:60,z:150,kind:'lake',houses:4,r:48,lab:20},
 {n:'TUMBLEWEED RANCH',x:-70,z:150,kind:'ranch',houses:3,r:40,lab:-6}];
const PLASTER=[0xf3e6c8,0xcfe6f7,0xf8cdbb,0xd6f0c6,0xfff0a6,0xe6d2f2,0xffffff],ROOF=[0xd0533c,0x3d70c8,0x47a05a,0x7a52a0,0xe08a2c,0x2e9ca0];

export class World{
 constructor(seed=11){const r=this.r=rng(seed);this.sn=new SimplexNoise({random:r});this.time=0;
  this.pois=POIS.map(p=>({...p}));this.houses=[];this.obs=[];this.grid=new Map();this.spots=[];this.shaking=new Set();
  // docks: find the coastline along the docks bearing
  const dk=this.pois[0];for(let d=120;d<400;d+=2){const x=Math.cos(dk.ang)*d,z=Math.sin(dk.ang)*d;if(this.rawH(x,z)<.2){dk.coast=d;dk.x=Math.cos(dk.ang)*(d-34);dk.z=Math.sin(dk.ang)*(d-34);break;}}
  this.layout();this.genHeights();this.scatter();}

 /* ---------------- terrain ---------------- */
 fbm(x,z,o=4){let a=0,f=1,amp=1,s=0;for(let i=0;i<o;i++){a+=this.sn.noise(x*f,z*f)*amp;s+=amp;f*=2.03;amp*=.5;}return a/s;}
 rawH(x,z){const sn=this.sn,d=Math.hypot(x,z),an=Math.atan2(z,x);
  const edge=ISLAND*(1+.12*sn.noise(Math.cos(an)*1.2+5,Math.sin(an)*1.2+5)+.06*sn.noise(Math.cos(an)*3.5+9,Math.sin(an)*3.5));
  const m=1-smooth(.74,1.03,d/edge);
  let land=3.4+(this.fbm(x*.0055,z*.0055)*.5+.5)*13+Math.max(0,this.fbm(x*.021+9,z*.021))*4;
  land+=44*Math.exp(-((x-82)**2+(z+62)**2)/(2*46*46))*(.85+.15*this.fbm(x*.03,z*.03));
  land+=15*Math.exp(-((x+135)**2+(z-5)**2)/(2*34*34));
  let h=-17+m*(17+land);h-=15*Math.exp(-((x-60)**2+(z-150)**2)/(2*21*21));return h;}
 genHeights(){const h=this.H=new Float32Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-EXT+i*STEP,z=-EXT+j*STEP;let y=this.rawH(x,z);
   for(const f of this.flats){const dx=Math.max(f.x0-x,0,x-f.x1),dz=Math.max(f.z0-z,0,z-f.z1),dr=Math.hypot(dx,dz),w=1-smooth(1,f.blend,dr);if(w>0)y=lerp(y,f.y,w);}
   h[j*N+i]=y;}}
 heightAt(x,z){const gx=(x+EXT)/STEP,gz=(z+EXT)/STEP;if(gx<0||gz<0||gx>=N-1||gz>=N-1)return -18;const i=gx|0,j=gz|0,fx=gx-i,fz=gz-j,h=this.H,a=h[j*N+i],b=h[j*N+i+1],c=h[(j+1)*N+i],d=h[(j+1)*N+i+1];
  return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;}
 normalAt(x,z,out=new V()){const e=1.2;return out.set(this.heightAt(x-e,z)-this.heightAt(x+e,z),2*e,this.heightAt(x,z-e)-this.heightAt(x,z+e)).normalize();}
 isLand(x,z,m=.6){return this.heightAt(x,z)>m;}

 /* ---------------- locations + houses ---------------- */
 layout(){const r=this.r;this.flats=[];const rects=[];
  const free=(x0,z0,x1,z1,pad)=>rects.every(q=>x1+pad<=q[0]||x0-pad>=q[2]||z1+pad<=q[1]||z0-pad>=q[3]);
  for(const poi of this.pois){let made=0,tries=0;
   if(poi.kind==='hill'){poi.mill={x:poi.x,z:poi.z};rects.push([poi.x-8,poi.z-8,poi.x+8,poi.z+8]);}
   if(poi.kind==='docks'){const ca=Math.cos(poi.ang),sa=Math.sin(poi.ang);poi.pier={x:ca*(poi.coast-6),z:sa*(poi.coast-6)};poi.light={x:ca*(poi.coast-14)-sa*16,z:sa*(poi.coast-14)+ca*16};}
   while(made<poi.houses&&tries++<400){let w=2+(r()*2|0),d=2+(r()*2|0),st=r()<.45?2:1,kind='house';
    if(poi.kind==='yard'){w=3;d=4;st=1;kind='warehouse';if(r()<.5)[w,d]=[d,w];}
    if(poi.kind==='ranch'&&made===0){w=3;d=4;st=2;kind='barn';}
    const a=r()*Math.PI*2,rr=(poi.kind==='lake'?.72+r()*.28:Math.sqrt(r()))*poi.r;let cx=poi.x+Math.cos(a)*rr,cz=poi.z+Math.sin(a)*rr;
    const ix=Math.round(cx/CELL-w/2),iz=Math.round(cz/CELL-d/2),x0=ix*CELL,z0=iz*CELL,x1=x0+w*CELL,z1=z0+d*CELL;
    if(!free(x0,z0,x1,z1,9))continue;let mn=1e9,mx=-1e9;for(const[u,v]of[[0,0],[1,0],[0,1],[1,1],[.5,.5]]){const y=this.rawH(lerp(x0,x1,u),lerp(z0,z1,v));mn=Math.min(mn,y);mx=Math.max(mx,y);}
    if(mn<1.6||mx-mn>7.5)continue;const base=Math.round((mx*.6+mn*.4+.2)*4)/4;rects.push([x0,z0,x1,z1]);
    const hc={x:(x0+x1)/2,z:(z0+z1)/2},to=[poi.x-hc.x,poi.z-hc.z];let door=Math.abs(to[0])>Math.abs(to[1])?(to[0]>0?1:3):(to[1]>0?0:2);if(poi.kind==='lake'||Math.hypot(...to)<3)door=r()*4|0;
    const h={poi,kind,ix,iz,w,d,st,base,door,x0,z0,x1,z1,cx:hc.x,cz:hc.z,tint:kind==='barn'?0xc4483a:kind==='warehouse'?[0x9fb0bf,0xc0a070,0x8fb39a][r()*3|0]:PLASTER[r()*PLASTER.length|0],roof:kind==='barn'?0x6a4a3a:ROOF[r()*ROOF.length|0],seed:r()*1e9|0};
    this.houses.push(h);this.flats.push({x0,z0,x1,z1,y:base-.22,blend:9});made++;}
   if(poi.kind==='hill'){this.flats.push({x0:poi.x-5,z0:poi.z-5,x1:poi.x+5,z1:poi.z+5,y:this.rawH(poi.x,poi.z),blend:12});}
   if(poi.kind==='docks'){const y=Math.max(1.4,this.rawH(poi.light.x,poi.light.z));this.flats.push({x0:poi.light.x-4,z0:poi.light.z-4,x1:poi.light.x+4,z1:poi.light.z+4,y,blend:8});poi.light.y=y;}}
  this.rects=rects;
  for(const h of this.houses){const r2=rng(h.seed);const cells=[];for(let i=0;i<h.w;i++)for(let k=0;k<h.d;k++)cells.push([h.ix+i,h.iz+k]);h.cells=cells;
   // interior ramp for two-storey buildings: bottom cell + direction that stays inside
   if(h.st>1){const opts=[];for(const[i,k]of cells)for(let dd=0;dd<4;dd++){const ni=i+D[dd][0],nk=k+D[dd][1];if(ni>=h.ix&&ni<h.ix+h.w&&nk>=h.iz&&nk<h.iz+h.d)opts.push([i,k,dd]);}h.ramp=opts[r2()*opts.length|0];}
   const inner=cells.filter(c=>!(h.ramp&&c[0]===h.ramp[0]&&c[1]===h.ramp[1]));
   const doorCell=this.doorCell(h);h.doorCell=doorCell;
   const spot=(c,y,kind,off=1.15)=>{let dx=0,dz=0;const ws=[];for(let dd=0;dd<4;dd++){const ni=c[0]+D[dd][0],nk=c[1]+D[dd][1];if(ni<h.ix||ni>=h.ix+h.w||nk<h.iz||nk>=h.iz+h.d)ws.push(dd);}
    if(ws.length){const dd=ws[r2()*ws.length|0];dx=D[dd][0]*off;dz=D[dd][1]*off;}this.spots.push({kind,x:(c[0]+.5)*CELL+dx,y,z:(c[1]+.5)*CELL+dz,face:Math.atan2(-dx,-dz),house:h,story:Math.round((y-h.base)/H)});};
   const gc=inner.filter(c=>!(c[0]===doorCell[0]&&c[1]===doorCell[1])),pool=gc.length?gc:inner;const shuffled=pool.slice().sort(()=>r2()-.5);
   spot(shuffled[0],h.base,'chest');if(shuffled[1])spot(shuffled[1],h.base,'loot',0);else spot(doorCell,h.base,'loot',0);if(r2()<.5&&shuffled[2])spot(shuffled[2],h.base,'ammo',1.3);
   if(h.kind==='warehouse'&&shuffled[3])spot(shuffled[3],h.base,'chest');
   for(let s=1;s<h.st;s++){const up=cells.filter(c=>!(h.ramp&&c[0]===h.ramp[0]&&c[1]===h.ramp[1])).sort(()=>r2()-.5);spot(up[0],h.base+s*H,r2()<.6?'chest':'loot');if(up[1])spot(up[1],h.base+s*H,'loot',0);}}}
 doorCell(h){const s=h.door;if(s===0)return[h.ix+(h.w>>1),h.iz+h.d-1];if(s===2)return[h.ix+(h.w>>1),h.iz];if(s===1)return[h.ix+h.w-1,h.iz+(h.d>>1)];return[h.ix,h.iz+(h.d>>1)];}
 doorOut(h){const c=h.doorCell,Dv=D[h.door];return{x:(c[0]+.5)*CELL+Dv[0]*4.2,z:(c[1]+.5)*CELL+Dv[1]*4.2,ix:(c[0]+.5)*CELL,iz:(c[1]+.5)*CELL};}
 inHouse(x,z,pad=0){for(const h of this.houses)if(x>h.x0-pad&&x<h.x1+pad&&z>h.z0-pad&&z<h.z1+pad)return h;return null;}
 // spawn all prefab structures as build pieces (called at every match start; they are destructible)
 spawnStructures(B){const P={anchor:true,instant:true};
  for(const h of this.houses){const r2=rng(h.seed+7),wallMat=h.kind==='warehouse'?2:h.kind==='barn'?0:3,flMat=h.kind==='warehouse'?1:5;
   for(let s=0;s<h.st;s++){const y=h.base+s*H;
    for(const[i,k]of h.cells){if(!(s>0&&h.ramp&&i===h.ramp[0]&&k===h.ramp[1]))B.place('floor',flMat,i,k,0,y,{...P});
     for(let dd=0;dd<4;dd++){const ni=i+D[dd][0],nk=k+D[dd][1];if(ni>=h.ix&&ni<h.ix+h.w&&nk>=h.iz&&nk<h.iz+h.d)continue;
      const isDoor=s===0&&dd===h.door&&i===h.doorCell[0]&&k===h.doorCell[1];let variant=isDoor?'door':(r2()<(h.kind==='warehouse'?.15:.45)?'window':'wall');
      if(h.kind==='warehouse'&&s===0&&!isDoor&&r2()<.12)variant='door';B.place('wall',wallMat,i,k,dd,y,{...P,variant,tint:h.kind==='warehouse'?h.tint:h.tint});}}}
   if(h.ramp)B.place('ramp',5,h.ramp[0],h.ramp[1],h.ramp[2],h.base,{...P});
   const top=h.base+h.st*H;for(const[i,k]of h.cells){B.place('floor',flMat,i,k,0,top,{...P});if(h.kind!=='warehouse')B.place('roof',4,i,k,0,top,{...P,tint:h.roof});}}
  // docks pier
  const dk=this.pois[0];if(dk.pier){const ca=Math.cos(dk.ang),sa=Math.sin(dk.ang),dir=Math.abs(ca)>Math.abs(sa)?(ca>0?1:3):(sa>0?0:2),Dv=D[dir],sx=Math.floor(dk.pier.x/CELL),sz=Math.floor(dk.pier.z/CELL);
   const side=[Dv[1],-Dv[0]];for(let n=0;n<9;n++)for(let w=0;w<2;w++)B.place('floor',5,sx+Dv[0]*n+side[0]*w,sz+Dv[1]*n+side[1]*w,0,1.9,{...P});
   const ex=sx+Dv[0]*8,ez=sz+Dv[1]*8;for(let w=-1;w<3;w++)B.place('floor',5,ex+side[0]*w+Dv[0],ez+side[1]*w+Dv[1],0,1.9,{...P});dk.pierEnd={x:(ex+.5)*CELL,z:(ez+.5)*CELL};}}

 /* ---------------- obstacles (trees, rocks, metal, props) ---------------- */
 addObs(o){o.alive=true;o.hp=o.max;this.obs.push(o);const bb=o.b||[o.x-o.r,0,o.z-o.r,o.x+o.r,0,o.z+o.r];for(let i=Math.floor(bb[0]/G);i<=Math.floor(bb[3]/G);i++)for(let k=Math.floor(bb[2]/G);k<=Math.floor(bb[5]/G);k++){const key=gk(i,k);let a=this.grid.get(key);if(!a){a=[];this.grid.set(key,a);}a.push(o);}return o;}
 clearOf(x,z,pad){for(const q of this.rects)if(x>q[0]-pad&&x<q[2]+pad&&z>q[1]-pad&&z<q[3]+pad)return false;return true;}
 scatter(){const r=rng(99);this.trees=[];this.rocks=[];this.metal=[];this.bushes=[];this.grass=[];
  const slope=(x,z)=>1-this.normalAt(x,z).y;
  // trees
  for(let n=0;n<5200&&this.trees.length<720;n++){const x=(r()*2-1)*ISLAND*1.05,z=(r()*2-1)*ISLAND*1.05,h=this.heightAt(x,z);if(h<2.6||h>48||slope(x,z)>.3||!this.clearOf(x,z,6))continue;
   let near=null;for(const p of this.pois){if(Math.hypot(p.x-x,p.z-z)<p.r*.55&&p.kind!=='village'){near=p;break;}}if(near)continue;
   const dens=.35+.65*(this.fbm(x*.012+40,z*.012)*.5+.5)+(Math.hypot(x+95,z+140)<70?.6:0);if(r()>dens*.75)continue;
   const pine=h>22||Math.hypot(x+95,z+140)<75?r()<.85:r()<.25,s=.8+r()*.55;
   this.trees.push(this.addObs({k:'tree',pine,x,z,y:h,s,rot:r()*6.28,r:.55*s,y0:h-1,y1:h+4.5*s,max:pine?150:200,yield:0,tint:.85+r()*.3}));}
  // rocks (quarry is dense)
  for(let n=0;n<4000&&this.rocks.length<240;n++){const qz=n<900;const p=this.pois[2];const x=qz?p.x+(r()*2-1)*p.r*1.3:(r()*2-1)*ISLAND,z=qz?p.z+(r()*2-1)*p.r*1.3:(r()*2-1)*ISLAND,h=this.heightAt(x,z);
   if(h<1.2||!this.clearOf(x,z,4)||(qz&&this.rocks.length>60))continue;if(!qz&&r()<.55)continue;const s=qz?1.4+r()*2.4:.9+r()*2.2;
   this.rocks.push(this.addObs({k:'rock',x,z,y:h,s,rot:r()*6.28,r:s*.85,y0:h-2,y1:h+s*.72,max:Math.round(140+s*90),yield:1,tint:.8+r()*.35}));}
  // metal: shipping containers in the yard + scattered
  const cont=(x,z,y,alongX,stackOn)=>{const L=6.2,Wd=2.5,Ht=2.6,b=alongX?[x-L/2,y,z-Wd/2,x+L/2,y+Ht,z+Wd/2]:[x-Wd/2,y,z-L/2,x+Wd/2,y+Ht,z+L/2];const o=this.addObs({k:'metal',x,z,y,b,alongX,y0:y,y1:y+Ht,max:450,yield:2,tint:[0xc84a32,0x2f74c0,0x3aa08a,0xe0a030,0x8a5ac0][r()*5|0]});if(stackOn)stackOn.above=o;this.metal.push(o);return o;};
  const yd=this.pois[3];for(let row=0;row<3;row++)for(let c=0;c<4;c++){const x=yd.x-18+c*10+(r()-.5)*2,z=yd.z+28+row*5.6;if(!this.clearOf(x,z,3))continue;const h=this.heightAt(x,z);if(h<1)continue;const lo=cont(x,z,h-.1,false);if(r()<.4)cont(x,z,h+2.5,false,lo);}
  for(let n=0;n<600&&this.metal.length<44;n++){const x=(r()*2-1)*ISLAND*.8,z=(r()*2-1)*ISLAND*.8,h=this.heightAt(x,z);if(h<2||slope(x,z)>.12||!this.clearOf(x,z,5)||r()<.6)continue;cont(x,z,h-.1,r()<.5);}
  // landmark props
  const hill=this.pois[5];hill.mill.y=this.heightAt(hill.mill.x,hill.mill.z);this.addObs({k:'prop',x:hill.mill.x,z:hill.mill.z,r:2.6,y0:hill.mill.y-1,y1:hill.mill.y+13,max:1e9});
  const dk=this.pois[0];if(dk.light)this.addObs({k:'prop',x:dk.light.x,z:dk.light.z,r:2.2,y0:dk.light.y-1,y1:dk.light.y+19,max:1e9});
  // decoration
  for(let n=0;n<9000&&this.bushes.length<420;n++){const x=(r()*2-1)*ISLAND,z=(r()*2-1)*ISLAND,h=this.heightAt(x,z);if(h<2.4||h>40||!this.clearOf(x,z,2))continue;this.bushes.push([x,h,z,.7+r()*.9,r()*6.28]);}
  for(let n=0;n<40000&&this.grass.length<6500;n++){const x=(r()*2-1)*ISLAND,z=(r()*2-1)*ISLAND,h=this.heightAt(x,z);if(h<2.5||h>36||slope(x,z)>.35||!this.clearOf(x,z,.5))continue;this.grass.push([x,h,z,.6+r()*.8,r()*6.28,r()<.07?(r()*4|0)+1:0]);}
  // outdoor loot spots
  for(let n=0;n<3000;n++){const kinds=this.spots.filter(s=>!s.house).length;if(kinds>70)break;const x=(r()*2-1)*ISLAND*.82,z=(r()*2-1)*ISLAND*.82,h=this.heightAt(x,z);if(h<2||slope(x,z)>.25||!this.clearOf(x,z,3))continue;
   const roll=r();this.spots.push({kind:roll<.16?'chest':roll<.36?'ammo':'loot',x,y:h,z,face:r()*6.28,house:null});}}
 obsNear(x0,z0,x1,z1,cb){const seen=new Set();for(let i=Math.floor(x0/G);i<=Math.floor(x1/G);i++)for(let k=Math.floor(z0/G);k<=Math.floor(z1/G);k++){const a=this.grid.get(gk(i,k));if(a)for(const o of a){if(!o.alive||seen.has(o))continue;seen.add(o);cb(o);}}}
 // push actor cylinder out of obstacles; tops of rocks / containers are walkable via support()
 collide(pos,r,ht,step){let hit=false;this.obsNear(pos.x-r-1,pos.z-r-1,pos.x+r+1,pos.z+r+1,o=>{if(o.y1<=pos.y+step||o.y0>=pos.y+ht)return;
   if(o.b){const b=o.b,qx=cl(pos.x,b[0],b[3]),qz=cl(pos.z,b[2],b[5]),dx=pos.x-qx,dz=pos.z-qz,d2=dx*dx+dz*dz;if(d2>=r*r)return;if(d2>1e-8){const d=Math.sqrt(d2);pos.x+=dx/d*(r-d);pos.z+=dz/d*(r-d);}else{const pen=[pos.x-b[0],b[3]-pos.x,pos.z-b[2],b[5]-pos.z];let m=0;for(let j=1;j<4;j++)if(pen[j]<pen[m])m=j;if(m===0)pos.x=b[0]-r;else if(m===1)pos.x=b[3]+r;else if(m===2)pos.z=b[2]-r;else pos.z=b[5]+r;}hit=true;return;}
   const dx=pos.x-o.x,dz=pos.z-o.z,d=Math.hypot(dx,dz),m=o.r+r;if(d<m){if(d>1e-4){pos.x=o.x+dx/d*m;pos.z=o.z+dz/d*m;}else pos.x+=m;hit=true;}});return hit;}
 support(x,z,y,step,r){let h=-1e9;this.obsNear(x-r-1,z-r-1,x+r+1,z+r+1,o=>{if(o.k==='tree')return;let top=-1e9;if(o.b){const b=o.b;if(x>=b[0]-r*.5&&x<=b[3]+r*.5&&z>=b[2]-r*.5&&z<=b[5]+r*.5)top=b[4];}else if(Math.hypot(x-o.x,z-o.z)<o.r+r*.5)top=o.y1;if(top<=y+step&&top>h)h=top;});return h;}
 rayTerrain(o,d,maxT){let t=0,prev=0;let diff=o.y-this.heightAt(o.x,o.z);if(diff<0)return 0;
  for(let n=0;n<900;n++){const st=cl(diff*.45,.4,10);t=Math.min(maxT,t+st);const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;diff=y-this.heightAt(x,z);
   if(diff<0){let a=prev,b=t;for(let k=0;k<10;k++){const m=(a+b)/2;if(o.y+d.y*m-this.heightAt(o.x+d.x*m,o.z+d.z*m)<0)b=m;else a=m;}return b;}prev=t;if(t>=maxT||(d.y>0&&y>90))break;}return -1;}
 rayObs(o,d,maxT){let best=null,bt=maxT;const seen=new Set();let ix=Math.floor(o.x/G),iz=Math.floor(o.z/G);const sx=Math.sign(d.x),sz=Math.sign(d.z);
  const tdx=sx?G/Math.abs(d.x):1e9,tdz=sz?G/Math.abs(d.z):1e9;let tmx=sx?((sx>0?(ix+1)*G:ix*G)-o.x)/d.x:1e9,tmz=sz?((sz>0?(iz+1)*G:iz*G)-o.z)/d.z:1e9,t=0;
  for(let n=0;n<200;n++){const a=this.grid.get(gk(ix,iz));if(a)for(const ob of a){if(!ob.alive||seen.has(ob))continue;seen.add(ob);const tt=ob.b?rayBox(o.x,o.y,o.z,d.x,d.y,d.z,ob.b,bt):rayCyl(o.x,o.y,o.z,d.x,d.y,d.z,ob,bt);if(tt>=0&&tt<bt){bt=tt;best={t:tt,obs:ob};}}
   if(best&&best.t<=t)break;if(tmx<tmz){t=tmx;tmx+=tdx;ix+=sx;}else{t=tmz;tmz+=tdz;iz+=sz;}if(t>bt)break;}
  if(best){const p=new V().copy(d).multiplyScalar(best.t).add(o),ob=best.obs;best.n=ob.b?boxNormal(p.x,p.y,p.z,ob.b):(Math.abs(p.y-ob.y1)<.02?new V(0,1,0):new V(p.x-ob.x,0,p.z-ob.z).normalize());}return best;}
 // damage an obstacle (pickaxe / bullets); returns true when it breaks
 hitObs(o,dmg){if(!o.alive||o.k==='prop')return false;o.hp-=dmg;o.shake=1;this.shaking.add(o);if(o.hp<=0){this.killObs(o);return true;}return false;}
 killObs(o){o.alive=false;this.shaking.delete(o);this.setObsMatrix(o,true);if(o.above&&o.above.alive)this.killObs(o.above);this.onBreak&&this.onBreak(o);}
 reset(){for(const o of this.obs){o.alive=true;o.hp=o.max;o.shake=0;this.setObsMatrix(o);}this.shaking.clear();}

 /* ---------------- visuals ---------------- */
 setObsMatrix(o,hide){if(!o.inst)return;const{mesh,i}=o.inst;if(hide)mesh.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));else{let m=o.inst.m;if(o.shake>0){const s=o.shake;m=m.clone().multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.sin(this.time*40)*.05*s,0,Math.cos(this.time*37)*.05*s)));}mesh.setMatrixAt(i,m);}mesh.instanceMatrix.needsUpdate=true;}
 build(scene){const out=this.vis={};
  // --- terrain mesh with vertex colours
  const geo=new THREE.PlaneGeometry(2*EXT,2*EXT,N-1,N-1);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=new Float32Array(pos.count*3),c=new THREE.Color(),tmp=new THREE.Color(),nrm=new V();
  const sand=new THREE.Color(0xf0dca0),wet=new THREE.Color(0xc9b27a),g1=new THREE.Color(0x76c84a),g2=new THREE.Color(0x4fa63c),g3=new THREE.Color(0x9ad35a),rock=new THREE.Color(0x8d8578),snow=new THREE.Color(0xf4f8ff),dirt=new THREE.Color(0xb8925e),deep=new THREE.Color(0x7d6f52);
  for(let v=0;v<pos.count;v++){const x=pos.getX(v),z=pos.getZ(v),gi=Math.round((x+EXT)/STEP),gj=Math.round((z+EXT)/STEP),h=this.H[gj*N+gi];pos.setY(v,h);this.normalAt(x,z,nrm);
   const n1=this.fbm(x*.03,z*.03,2)*.5+.5,n2=this.fbm(x*.11+3,z*.11,2)*.5+.5;c.copy(g2).lerp(g1,n1).lerp(g3,smooth(.6,.9,n2)*.5);
   if(h<3.2)c.lerp(sand,smooth(3.2,2.2,h));if(h<.4)c.copy(wet).lerp(deep,smooth(.4,-8,h));
   let dd=1e9;for(const f of this.flats){const dx=Math.max(f.x0-x,0,x-f.x1),dz=Math.max(f.z0-z,0,z-f.z1);dd=Math.min(dd,Math.hypot(dx,dz));}c.lerp(dirt,smooth(6,1,dd)*.65);
   const s=1-nrm.y;c.lerp(rock,smooth(.28,.45,s));c.lerp(rock,smooth(36,44,h)*.8);c.lerp(snow,smooth(50,55,h+n2*3));
   col[v*3]=c.r;col[v*3+1]=c.g;col[v*3+2]=c.b;}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  const detail=ctex(256,256,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=200+Math.random()*55|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(Math.random()*w,Math.random()*h,2,2+Math.random()*3);}});detail.repeat.set(120,120);
  const terr=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,map:detail,roughness:.95,metalness:0,envMapIntensity:.5}));terr.receiveShadow=true;scene.add(terr);out.terrain=terr;
  // --- water
  const hd=new Uint8Array(N*N*4);for(let i=0;i<N*N;i++){const v=cl((this.H[i]+20)/40,0,1)*255|0;hd[i*4]=v;hd[i*4+1]=v;hd[i*4+2]=v;hd[i*4+3]=255;}const ht=new THREE.DataTexture(hd,N,N,THREE.RGBAFormat);ht.magFilter=ht.minFilter=THREE.LinearFilter;ht.needsUpdate=true;
  const wU=this.waterU={uT:{value:0},uH:{value:ht},uSun:{value:SUN},uExt:{value:EXT},uFogC:{value:new THREE.Color(SKY.fog)},uFogN:{value:150},uFogF:{value:950},uSky:{value:SKY.top},uHor:{value:SKY.hor}};
  const water=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000,1,1).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:wU,transparent:true,depthWrite:false,
   vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`uniform float uT,uExt,uFogN,uFogF;uniform sampler2D uH;uniform vec3 uSun,uFogC,uSky,uHor;varying vec3 vW;
    void main(){vec2 uv=vW.xz/(2.*uExt)+.5;float h=(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)?-20.:texture2D(uH,uv).r*40.-20.;float dep=max(-h,0.);vec2 p=vW.xz;float t=uT;
     vec3 n=normalize(vec3(.07*cos(p.x*.16+t*1.1)+.05*cos((p.x+p.y)*.23+t*1.7)+.035*cos(p.y*.53-t*2.3)+.02*cos(p.x*1.1+p.y*.7+t*3.),1.,.07*cos(p.y*.14+t*.9)+.05*cos((p.x-p.y)*.27+t*1.3)+.035*cos(p.x*.49+t*2.2)+.02*cos(p.y*1.2-p.x*.6-t*2.7)));
     vec3 Vv=normalize(cameraPosition-vW);float fr=.04+.96*pow(1.-max(dot(n,Vv),0.),5.);
     vec3 shallow=vec3(.16,.78,.78),mid=vec3(.05,.48,.72),deepc=vec3(.02,.2,.46);vec3 base=mix(shallow,mid,smoothstep(.3,4.,dep));base=mix(base,deepc,smoothstep(4.,16.,dep));
     vec3 R=reflect(-Vv,n);vec3 sky=mix(uHor,uSky,clamp(R.y*1.6,0.,1.));vec3 c=mix(base,sky,fr*.75);
     float sp=pow(max(dot(R,uSun),0.),220.)*5.+pow(max(dot(R,uSun),0.),24.)*.25;
     float ring=sin(dep*5.5-t*2.2+(sin(p.x*.21)+cos(p.y*.19))*1.8)*.5+.5;float foam=smoothstep(1.4,0.,dep)*(.45+.55*ring)+smoothstep(.35,0.,dep);
     c=mix(c,vec3(.97,1.,1.),clamp(foam,0.,1.)*.85);c+=sp;
     float a=mix(.55,.97,smoothstep(.2,5.,dep));a=max(a,clamp(foam,0.,1.));
     float d=length(cameraPosition-vW);c=mix(c,uFogC,smoothstep(uFogN,uFogF*1.6,d));gl_FragColor=vec4(c,a);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`}));water.renderOrder=1;scene.add(water);out.water=water;
  // --- sky dome + clouds
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1800,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uSun:{value:SUN},uTop:{value:SKY.top},uHor:{value:SKY.hor}},
   vertexShader:'varying vec3 vP;void main(){vP=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
   fragmentShader:`uniform vec3 uSun,uTop,uHor;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=d.y;vec3 c=mix(uHor,uTop,pow(clamp(h,0.,1.),.55));c=mix(c,uHor*1.02,smoothstep(.0,-.15,h));
    float s=max(dot(d,uSun),0.);c+=vec3(1.,.9,.7)*pow(s,500.)*7.+vec3(1.,.85,.6)*pow(s,10.)*.22;gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);out.sky=sky;
  const cr=rng(5),cloudN=320,cg=new THREE.IcosahedronGeometry(1,2),cm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,emissive:0x9fb4cc,emissiveIntensity:.42,flatShading:true});
  const clouds=new THREE.InstancedMesh(cg,cm,cloudN);let ci=0;for(let k=0;k<46&&ci<cloudN;k++){const a=cr()*Math.PI*2,d=80+cr()*620,cx=Math.cos(a)*d,cz=Math.sin(a)*d,cy=150+cr()*90,n=5+(cr()*4|0);
   for(let j=0;j<n&&ci<cloudN;j++){const s=10+cr()*16;clouds.setMatrixAt(ci++,M(cx+(cr()-.5)*n*11,cy+(cr()-.3)*7,cz+(cr()-.5)*24,0,cr()*6,0,s*1.3,s*.75,s));}}
  clouds.count=ci;clouds.frustumCulled=false;scene.add(clouds);out.clouds=clouds;
  // --- trees (two kinds) — trunk + crown merged per kind
  const trunkG=new THREE.CylinderGeometry(.24,.42,3.6,7);trunkG.translate(0,1.8,0);
  const roundG=merge([[trunkG,null,0x7a5232],[lumpy(new THREE.IcosahedronGeometry(2.3,1),.7,3),M(0,4.6,0),0x58b33e],[lumpy(new THREE.IcosahedronGeometry(1.7,1),.6,4),M(1.3,4,.5),0x6cc447],[lumpy(new THREE.IcosahedronGeometry(1.6,1),.6,5),M(-1.1,4.2,-.6),0x4ea436],[lumpy(new THREE.IcosahedronGeometry(1.4,1),.5,6),M(.1,5.9,.2),0x7ad050]],true);
  const pineG=merge([[trunkG,null,0x6a4428],[new THREE.ConeGeometry(2.5,3.4,8),M(0,3.4,0),0x2f8a4a],[new THREE.ConeGeometry(2,2.9,8),M(0,4.9,0),0x369a52],[new THREE.ConeGeometry(1.4,2.4,8),M(0,6.3,0),0x40a85a]],true);
  const treeMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true});
  for(const pine of[false,true]){const list=this.trees.filter(t=>t.pine===pine),im=new THREE.InstancedMesh(pine?pineG:roundG,treeMat,list.length);
   list.forEach((t,i)=>{t.inst={mesh:im,i,m:M(t.x,t.y-.2,t.z,0,t.rot,0,t.s)};im.setMatrixAt(i,t.inst.m);im.setColorAt(i,new THREE.Color(t.tint,t.tint,t.tint*.95));});im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);}
  // --- rocks
  const rockG=lumpy(new THREE.IcosahedronGeometry(1,1),.55,9);rockG.scale(1,.78,1);const rockM=new THREE.MeshStandardMaterial({color:0x9a958c,roughness:.9,flatShading:true});
  const rim=new THREE.InstancedMesh(rockG,rockM,this.rocks.length);this.rocks.forEach((o,i)=>{o.inst={mesh:rim,i,m:M(o.x,o.y-.15,o.z,0,o.rot,0,o.s)};rim.setMatrixAt(i,o.inst.m);rim.setColorAt(i,new THREE.Color(o.tint,o.tint*.97,o.tint*.92));});
  rim.castShadow=rim.receiveShadow=true;rim.frustumCulled=false;scene.add(rim);
  // --- containers
  const ctx=ctex(256,128,(x,w,h)=>{x.fillStyle='#ddd';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=8){x.fillStyle=i%16?'#bcbcbc':'#f2f2f2';x.fillRect(i,0,5,h);}x.fillStyle='rgba(120,60,20,.25)';for(let i=0;i<20;i++){x.beginPath();x.arc(Math.random()*w,Math.random()*h,3+Math.random()*10,0,7);x.fill();}x.strokeStyle='#777';x.lineWidth=6;x.strokeRect(3,3,w-6,h-6);});
  const contG=new THREE.BoxGeometry(6.2,2.6,2.5);contG.translate(0,1.3,0);const cim=new THREE.InstancedMesh(contG,new THREE.MeshStandardMaterial({map:ctx,roughness:.5,metalness:.45}),this.metal.length);
  this.metal.forEach((o,i)=>{o.inst={mesh:cim,i,m:M(o.x,o.y,o.z,0,o.alongX?0:Math.PI/2,0)};cim.setMatrixAt(i,o.inst.m);cim.setColorAt(i,new THREE.Color(o.tint));});cim.castShadow=cim.receiveShadow=true;cim.frustumCulled=false;scene.add(cim);
  // --- bushes + grass
  const bushG=lumpy(new THREE.IcosahedronGeometry(1,1),.4,12);bushG.scale(1.2,.75,1.2);const bim=new THREE.InstancedMesh(bushG,new THREE.MeshStandardMaterial({color:0x4c9c38,roughness:.9,flatShading:true}),this.bushes.length);
  this.bushes.forEach((b,i)=>{bim.setMatrixAt(i,M(b[0],b[1]+.25*b[3],b[2],0,b[4],0,b[3]));});bim.castShadow=true;bim.receiveShadow=true;bim.frustumCulled=false;scene.add(bim);
  const blade=new THREE.BufferGeometry();{const p=[],cc=[];for(let k=0;k<5;k++){const a=k/5*Math.PI*2,dx=Math.cos(a)*.18,dz=Math.sin(a)*.18,lx=Math.cos(a+1.4)*.07,lz=Math.sin(a+1.4)*.07,tx=dx*2.2,tz=dz*2.2;p.push(dx-lx,0,dz-lz,dx+lx,0,dz+lz,tx,.5+k%2*.2,tz);cc.push(.55,.55,.55,.55,.55,.55,1.25,1.25,1.25);}
   blade.setAttribute('position',new THREE.Float32BufferAttribute(p,3));blade.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));blade.computeVertexNormals();const nn=blade.attributes.normal;for(let i=0;i<nn.count;i++)nn.setXYZ(i,0,1,0);}
  const gU={value:0};this.grassT=gU;const gm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,side:THREE.DoubleSide});
  gm.onBeforeCompile=s=>{s.uniforms.uTime=gU;s.vertexShader='uniform float uTime;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 ip=instanceMatrix*vec4(0.,0.,0.,1.);transformed.x+=sin(uTime*2.1+ip.x*.35+ip.z*.2)*.16*position.y;transformed.z+=cos(uTime*1.7+ip.z*.3)*.1*position.y;');};
  const gim=new THREE.InstancedMesh(blade,gm,this.grass.length),FL=[0xffffff,0xfff07a,0xff8ab0,0xa8c8ff,0xffffff];
  this.grass.forEach((g,i)=>{gim.setMatrixAt(i,M(g[0],g[1]-.05,g[2],0,g[4],0,g[3]));const base=new THREE.Color(0x5fb840).lerp(new THREE.Color(0x9ad85a),Math.random());if(g[5])base.set(FL[g[5]]);gim.setColorAt(i,base);});gim.receiveShadow=true;gim.frustumCulled=false;scene.add(gim);
  // --- windmill + lighthouse
  const pm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7});const hill=this.pois[5].mill;
  const tower=new THREE.Mesh(merge([[new THREE.CylinderGeometry(1.6,2.7,12,8),M(0,6,0),0xcfc6b4],[new THREE.ConeGeometry(2.3,2.6,8),M(0,13.3,0),0xb8443a],[new THREE.BoxGeometry(1.2,2.2,.3),M(0,1.1,2.4,-.12),0x6a4428],[new THREE.BoxGeometry(.8,.8,.3),M(0,7,1.95,-.08),0x3a5a8a]]),pm);
  tower.position.set(hill.x,hill.y-.5,hill.z);tower.castShadow=tower.receiveShadow=true;scene.add(tower);
  const blades=new THREE.Mesh(merge([[new THREE.CylinderGeometry(.35,.35,1,8),M(0,0,0,Math.PI/2),0x5a3a20],...[0,1,2,3].map(k=>[new THREE.BoxGeometry(1.3,6.5,.12),M(Math.sin(k*Math.PI/2)*3.6,Math.cos(k*Math.PI/2)*3.6,.3,0,0,-k*Math.PI/2),0xf6f0e2]),...[0,1,2,3].map(k=>[new THREE.BoxGeometry(.18,7,.18),M(Math.sin(k*Math.PI/2)*3.4,Math.cos(k*Math.PI/2)*3.4,.2,0,0,-k*Math.PI/2),0x6a4428])]),pm);
  const bh=new THREE.Group();bh.position.set(hill.x,hill.y+10.5,hill.z);bh.rotation.y=Math.atan2(-hill.x,-hill.z);blades.position.z=2.6;bh.add(blades);blades.castShadow=true;scene.add(bh);out.blades=blades;
  const dk=this.pois[0];if(dk.light){const lt=new THREE.Mesh(merge([[new THREE.CylinderGeometry(1.5,2.4,6,10),M(0,3,0),0xf4f4f4],[new THREE.CylinderGeometry(1.35,1.5,6,10),M(0,9,0),0xd8363a],[new THREE.CylinderGeometry(1.2,1.35,5,10),M(0,14.5,0),0xf4f4f4],[new THREE.CylinderGeometry(1.7,1.7,.4,10),M(0,17.2,0),0x333a44],[new THREE.CylinderGeometry(1.4,1.4,1.6,10),M(0,18.2,0),0xffe9a0],[new THREE.ConeGeometry(1.6,1.6,10),M(0,19.8,0),0xd8363a]]),pm);
   lt.position.set(dk.light.x,dk.light.y-.4,dk.light.z);lt.castShadow=lt.receiveShadow=true;scene.add(lt);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.9,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.6,1.5)}));lamp.position.set(dk.light.x,dk.light.y+17.8,dk.light.z);scene.add(lamp);}
  // pier posts
  if(dk.pierEnd||dk.pier){const posts=[];const ca=Math.cos(dk.ang),sa=Math.sin(dk.ang);for(let n=0;n<10;n++)for(const s of[-1,3]){const x=dk.pier.x+ca*n*4-sa*s*2+.0,z=dk.pier.z+sa*n*4+ca*s*2;posts.push([new THREE.CylinderGeometry(.22,.22,8,6),M(x,-2.2,z),0x5a3c22]);}
   const pp=new THREE.Mesh(merge(posts),pm);scene.add(pp);}
  this.drawMap();return out;}
 update(dt,time){this.time=time;this.waterU.uT.value=time;this.grassT.value=time;if(this.vis.blades)this.vis.blades.rotation.z=time*.9;
  for(const o of this.shaking){o.shake=Math.max(0,o.shake-dt*4);this.setObsMatrix(o);if(o.shake<=0)this.shaking.delete(o);}}
 // top-down island image for minimap / full map
 drawMap(){const S=512,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),img=x.createImageData(S,S),cc=new THREE.Color();
  for(let j=0;j<S;j++)for(let i=0;i<S;i++){const wx=-EXT+(i+.5)/S*2*EXT,wz=-EXT+(j+.5)/S*2*EXT,h=this.heightAt(wx,wz);
   if(h<.1){const d=cl(-h/12,0,1);cc.setRGB(.18-.12*d,.62-.3*d,.78-.22*d);if(h>-1.2)cc.lerp(new THREE.Color(.75,.92,.95),.5);}
   else if(h<2.8)cc.set(0xe8d49a);else{cc.set(0x5fae44).lerp(new THREE.Color(0x3e8a34),cl((h-6)/30,0,1));if(h>36)cc.lerp(new THREE.Color(0x8e877c),cl((h-36)/8,0,1));if(h>50)cc.set(0xf0f4fa);
    const sh=this.heightAt(wx-2,wz-2)-h;cc.multiplyScalar(1+cl(sh*.08,-.25,.25));}
   const k=(j*S+i)*4;img.data[k]=cc.r*255;img.data[k+1]=cc.g*255;img.data[k+2]=cc.b*255;img.data[k+3]=255;}
  x.putImageData(img,0,0);const sc=S/(2*EXT),P=v=>(v+EXT)*sc;
  for(const t of this.trees){x.fillStyle=t.pine?'rgba(20,80,40,.55)':'rgba(40,110,40,.45)';x.beginPath();x.arc(P(t.x),P(t.z),1.4,0,7);x.fill();}
  for(const h of this.houses){x.fillStyle='#'+new THREE.Color(h.roof).getHexString();x.fillRect(P(h.x0),P(h.z0),(h.x1-h.x0)*sc,(h.z1-h.z0)*sc);x.strokeStyle='rgba(0,0,0,.5)';x.strokeRect(P(h.x0),P(h.z0),(h.x1-h.x0)*sc,(h.z1-h.z0)*sc);}
  for(const o of this.metal){x.fillStyle='#'+new THREE.Color(o.tint).getHexString();const b=o.b;x.fillRect(P(b[0]),P(b[2]),(b[3]-b[0])*sc,(b[5]-b[2])*sc);}
  this.map=c;this.mapScale=sc;}
}
