// STORM ROYALE — building system: grid pieces (wall / floor / ramp / roof) in wood, stone and metal plus the
// prefab house materials. Instanced rendering, per-piece HP, collision boxes + walkable surfaces, ray hits,
// quick placement planning (ramp runs, level snapping), ghost previews and structural collapse.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,ctex,merge,wuv,rayBox,boxNormal,M} from './util.js';
export const CELL=4,H=4,TH=.24,ROOFH=1.7,COST=10;
export const D=[[0,1],[1,0],[0,-1],[-1,0]];
export const TYPES=['wall','floor','ramp','roof'];
// yield: material the pickaxe harvests from it (0 wood 1 stone 2 metal)
export const MATS=[{n:'WOOD',hp:150,bt:.6,yield:0},{n:'STONE',hp:300,bt:1.1,yield:1},{n:'METAL',hp:500,bt:1.7,yield:2},{n:'PLASTER',hp:300,bt:0,yield:0},{n:'SHINGLE',hp:220,bt:0,yield:0},{n:'PLANK',hp:260,bt:0,yield:0}];
const ck=(ix,iz)=>(ix+600)*4096+(iz+600);

/* ---------- textures ---------- */
const rnd=Math.random;
function grain(x,w,h,n,a){for(let i=0;i<n;i++){x.fillStyle=`rgba(${rnd()<.5?'0,0,0':'255,255,255'},${rnd()*a})`;x.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1);}}
function texWood(x,w,h){x.fillStyle='#b27a44';x.fillRect(0,0,w,h);const n=8,ph=h/n;for(let i=0;i<n;i++){const l=.85+rnd()*.3;x.fillStyle=`rgba(${150*l|0},${98*l|0},${52*l|0},1)`;x.fillRect(0,i*ph,w,ph);
  for(let k=0;k<26;k++){x.strokeStyle=`rgba(80,45,20,${.08+rnd()*.12})`;x.lineWidth=1;x.beginPath();const y=i*ph+rnd()*ph;x.moveTo(0,y);x.bezierCurveTo(w*.3,y+rnd()*4-2,w*.6,y+rnd()*4-2,w,y+rnd()*4-2);x.stroke();}
  x.fillStyle='rgba(50,25,8,.75)';x.fillRect(0,i*ph,w,2);x.fillStyle='rgba(255,220,170,.18)';x.fillRect(0,i*ph+2,w,1.5);const off=rnd()*w;x.fillStyle='rgba(50,25,8,.6)';x.fillRect(off,i*ph,2,ph);
  x.fillStyle='rgba(40,30,25,.8)';for(const px of[off-8,off+8]){x.beginPath();x.arc(px,i*ph+ph*.3,1.6,0,7);x.arc(px,i*ph+ph*.7,1.6,0,7);x.fill();}}
 x.strokeStyle='rgba(60,30,10,.9)';x.lineWidth=10;x.strokeRect(5,5,w-10,h-10);}
function texStone(x,w,h){x.fillStyle='#8c9097';x.fillRect(0,0,w,h);const rows=6,rh=h/rows;for(let r=0;r<rows;r++){let cx=(r%2)*-24;while(cx<w){const bw=40+rnd()*28,l=.82+rnd()*.3;x.fillStyle=`rgb(${142*l|0},${146*l|0},${152*l|0})`;x.fillRect(cx+3,r*rh+3,bw-6,rh-6);
  x.fillStyle='rgba(255,255,255,.14)';x.fillRect(cx+3,r*rh+3,bw-6,3);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(cx+3,r*rh+rh-6,bw-6,3);cx+=bw;}}grain(x,w,h,2500,.12);
 x.strokeStyle='rgba(40,42,48,.9)';x.lineWidth=8;x.strokeRect(4,4,w-8,h-8);}
function texMetal(x,w,h){const g=x.createLinearGradient(0,0,w,0);for(let i=0;i<=16;i++)g.addColorStop(i/16,i%2?'#7d858e':'#a7afb8');x.fillStyle=g;x.fillRect(0,0,w,h);grain(x,w,h,2000,.1);
 for(let i=0;i<14;i++){x.fillStyle=`rgba(150,80,30,${rnd()*.25})`;x.beginPath();x.arc(rnd()*w,rnd()*h,4+rnd()*18,0,7);x.fill();}
 x.fillStyle='#5f666e';x.fillRect(0,0,w,14);x.fillRect(0,h-14,w,14);x.fillRect(0,h/2-6,w,12);x.fillStyle='#cfd5da';for(let i=10;i<w;i+=26)for(const y of[7,h/2,h-7]){x.beginPath();x.arc(i,y,2.6,0,7);x.fill();}
 x.strokeStyle='#4a5058';x.lineWidth=8;x.strokeRect(4,4,w-8,h-8);}
function texPlaster(x,w,h){x.fillStyle='#f4efe6';x.fillRect(0,0,w,h);grain(x,w,h,6000,.07);x.fillStyle='#8a5a34';x.fillRect(0,h-22,w,22);x.fillRect(0,0,w,10);x.fillStyle='rgba(0,0,0,.15)';x.fillRect(0,h-24,w,2);
 x.fillStyle='#9a6a40';x.fillRect(0,0,9,h);x.fillRect(w-9,0,9,h);}
function texShingle(x,w,h){x.fillStyle='#e9e4dc';x.fillRect(0,0,w,h);const rows=8,rh=h/rows;for(let r=0;r<rows;r++)for(let c=-1;c<9;c++){const cx=c*32+(r%2)*16,l=.75+rnd()*.25;x.fillStyle=`rgb(${235*l|0},${230*l|0},${222*l|0})`;x.beginPath();x.moveTo(cx,r*rh);x.lineTo(cx+31,r*rh);x.lineTo(cx+31,r*rh+rh*.7);x.quadraticCurveTo(cx+16,r*rh+rh+4,cx,r*rh+rh*.7);x.closePath();x.fill();x.strokeStyle='rgba(60,50,45,.35)';x.stroke();}}
function texPlank(x,w,h){x.fillStyle='#8a5a36';x.fillRect(0,0,w,h);for(let i=0;i<6;i++){const l=.8+rnd()*.35;x.fillStyle=`rgb(${138*l|0},${92*l|0},${56*l|0})`;x.fillRect(i*w/6+1,0,w/6-2,h);x.fillStyle='rgba(0,0,0,.45)';x.fillRect(i*w/6,0,2,h);x.fillRect(i*w/6,rnd()*h,w/6,2);}grain(x,w,h,3000,.1);}

/* ---------- piece geometry (local space) ---------- */
const box=(x0,y0,z0,x1,y1,z1)=>[new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),M((x0+x1)/2,(y0+y1)/2,(z0+z1)/2)];
const WALLB={wall:[[-2,0,2,4]],door:[[-2,0,-.8,4],[.8,0,2,4],[-.8,2.75,.8,4]],window:[[-2,0,-.85,4],[.85,0,2,4],[-.85,0,.85,1.25],[-.85,2.85,.85,4]]};
function geoFor(kind){
 if(WALLB[kind])return wuv(merge(WALLB[kind].map(([a,y0,b,y1])=>box(a,y0,-TH/2,b,y1,TH/2))),.25);
 if(kind==='floor')return wuv(merge([box(-2,-TH,-2,2,0,2)]),.25);
 if(kind==='ramp'){const L=Math.hypot(CELL,H);const g=new THREE.BoxGeometry(CELL,TH,L);g.applyMatrix4(M(0,H/2-TH*.7,0,-Math.atan2(H,CELL)));const s1=new THREE.BoxGeometry(.18,.5,L);s1.applyMatrix4(M(-1.95,H/2-.3,0,-Math.atan2(H,CELL)));const s2=s1.clone();s2.translate(3.9,0,0);
  const r=merge([[g],[s1],[s2]]);const uv=r.attributes.uv,p=r.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)*.25,(p.getZ(i)+p.getY(i))*.18);return r;}
 if(kind==='roof'){const g=new THREE.ConeGeometry(CELL/Math.SQRT2,ROOFH,4,1);g.rotateY(Math.PI/4);g.translate(0,ROOFH/2,0);const r=merge([[g]]);const uv=r.attributes.uv,p=r.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+p.getZ(i))*.25,p.getY(i)*.6);return r;}}

/* ---------- instanced batches ---------- */
class Batch{constructor(geo,mat,cap){this.cap=cap;this.mesh=new THREE.InstancedMesh(geo,mat,cap);this.mesh.count=0;this.mesh.castShadow=this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;
  this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3).fill(1),3);this.items=[];}
 add(p){if(this.items.length>=this.cap)return false;p.bi=this.items.length;this.items.push(p);this.mesh.count=this.items.length;this.set(p);return true;}
 remove(p){const i=p.bi;if(i<0)return;const last=this.items.pop();if(last!==p){this.items[i]=last;last.bi=i;this.set(last);}this.mesh.count=this.items.length;p.bi=-1;this.dirty();}
 set(p){this.mesh.setMatrixAt(p.bi,p.mx);this.mesh.setColorAt(p.bi,p.col);this.dirty();}
 dirty(){this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor.needsUpdate=true;}}

const _c=new THREE.Color(),_q=new THREE.Quaternion(),_s=new V(),_p=new V(),_e=new THREE.Euler();
export class Build{
 constructor(scene,world){this.scene=scene;this.world=world;this.keys=new Map();this.grid=new Map();this.all=new Set();this.batches=new Map();this.growing=new Set();this.falling=[];this.onBreak=null;this.built=0;
  const tx=[texWood,texStone,texMetal,texPlaster,texShingle,texPlank].map(f=>ctex(256,256,f));
  this.mats=tx.map((t,i)=>new THREE.MeshStandardMaterial({map:t,roughness:i===2?.42:.85,metalness:i===2?.55:0,envMapIntensity:i===2?1.2:.7}));
  this.geos={};for(const k of['wall','door','window','floor','ramp','roof'])this.geos[k]=geoFor(k);
  // ghost
  this.ghostMat=new THREE.MeshBasicMaterial({color:0x58b8ff,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
  this.ghostLine=new THREE.LineBasicMaterial({color:0xa8e0ff,transparent:true,opacity:.9});
  this.ghost=new THREE.Group();this.ghost.visible=false;scene.add(this.ghost);this.ghostParts={};
  for(const k of['wall','floor','ramp','roof']){const m=new THREE.Mesh(this.geos[k],this.ghostMat),l=new THREE.LineSegments(new THREE.EdgesGeometry(this.geos[k],30),this.ghostLine);const g=new THREE.Group();g.add(m,l);g.visible=false;this.ghost.add(g);this.ghostParts[k]=g;}}
 batch(kind,mat){const key=kind+'|'+mat;let b=this.batches.get(key);if(!b){b=new Batch(this.geos[kind],this.mats[mat],kind==='wall'||kind==='floor'?1400:kind==='roof'?600:500);this.batches.set(key,b);this.scene.add(b.mesh);}return b;}
 clear(){for(const p of[...this.all])this.remove(p);this.keys.clear();this.grid.clear();this.growing.clear();this.falling=[];this.built=0;}

 /* ----- create ----- */
 // wall: dir gives which edge of cell (ix,iz) it sits on. Returns the piece or null if occupied / at capacity.
 key(type,ix,iz,dir,base){const lv=Math.round(base*2);if(type==='wall'){if(dir===0||dir===2){const zl=dir===0?iz+1:iz;return'wx'+ix+','+zl+','+lv;}const xl=dir===1?ix+1:ix;return'wz'+xl+','+iz+','+lv;}return type[0]+type[1]+ix+','+iz+','+lv;}
 occupied(type,ix,iz,dir,base){return this.keys.has(this.key(type,ix,iz,dir,base));}
 place(type,mat,ix,iz,dir,base,o={}){const k=this.key(type,ix,iz,dir,base);if(this.keys.has(k))return null;
  const kind=type==='wall'?(o.variant||'wall'):type,p={type,kind,mat,ix,iz,dir,base,key:k,hp:0,max:o.hp||MATS[mat].hp,t:o.instant?1:0,bt:MATS[mat].bt||.01,anchor:!!o.anchor,tint:new THREE.Color(o.tint??0xffffff),col:new THREE.Color(),mx:new THREE.Matrix4(),flash:0,cells:[],boxes:[],owner:o.owner||null,bi:-1,alive:true};
  p.hp=o.instant?p.max:Math.max(1,p.max*.15);
  const cx=(ix+.5)*CELL,cz=(iz+.5)*CELL;let rot=0;
  if(type==='wall'){if(dir===0||dir===2){const zl=dir===0?iz+1:iz;p.x=cx;p.z=zl*CELL;rot=0;p.cells=[[ix,zl-1],[ix,zl]];}else{const xl=dir===1?ix+1:ix;p.x=xl*CELL;p.z=cz;rot=Math.PI/2;p.cells=[[xl-1,iz],[xl,iz]];}
   p.axis=rot?1:0;for(const[a,y0,b,y1]of WALLB[kind])p.boxes.push(rot?[p.x-TH/2,base+y0,p.z+a,p.x+TH/2,base+y1,p.z+b]:[p.x+a,base+y0,p.z-TH/2,p.x+b,base+y1,p.z+TH/2]);}
  else{p.x=cx;p.z=cz;p.cells=[[ix,iz]];rot=type==='ramp'?[0,Math.PI/2,Math.PI,-Math.PI/2][dir]:0;
   if(type==='floor')p.boxes.push([ix*CELL,base-TH,iz*CELL,(ix+1)*CELL,base,(iz+1)*CELL]);}
  p.rot=rot;const b=this.batch(kind,mat);if(!b.add(p))return null;
  // bounding box
  const bb=type==='wall'?p.boxes.reduce((a,x)=>[Math.min(a[0],x[0]),Math.min(a[1],x[1]),Math.min(a[2],x[2]),Math.max(a[3],x[3]),Math.max(a[4],x[4]),Math.max(a[5],x[5])],[1e9,1e9,1e9,-1e9,-1e9,-1e9]):
   type==='floor'?p.boxes[0].slice():type==='ramp'?[ix*CELL,base,iz*CELL,(ix+1)*CELL,base+H,(iz+1)*CELL]:[ix*CELL,base,iz*CELL,(ix+1)*CELL,base+ROOFH,(iz+1)*CELL];p.aabb=bb;
  this.keys.set(k,p);this.all.add(p);for(const[a,c]of p.cells){const g=ck(a,c);let s=this.grid.get(g);if(!s){s=new Set();this.grid.set(g,s);}s.add(p);}
  this.batches.get(kind+'|'+mat);p.batch=b;if(!o.instant)this.growing.add(p);this.refresh(p);if(o.owner)this.built++;return p;}
 refresh(p){const g=p.t>=1?1:1-Math.pow(1-p.t,3);_q.setFromEuler(_e.set(0,p.rot,0));_s.set(1,.04+.96*g,1);if(p.type!=='wall'){_s.set(.3+.7*g,.04+.96*g,.3+.7*g);}_p.set(p.x,p.base,p.z);p.mx.compose(_p,_q,_s);
  const dmg=.55+.45*cl(p.hp/p.max,0,1),build=p.t<1?1+(1-p.t)*.9:1;_c.copy(p.tint).multiplyScalar(dmg*(1+p.flash*.8));if(p.t<1){_c.r*=.7;_c.g*=build*.95;_c.b*=build*1.25;}p.col.copy(_c);p.batch.set(p);}
 remove(p){if(!p.alive)return;p.alive=false;p.batch.remove(p);this.keys.delete(p.key);this.all.delete(p);this.growing.delete(p);for(const[a,c]of p.cells){const s=this.grid.get(ck(a,c));if(s){s.delete(p);if(!s.size)this.grid.delete(ck(a,c));}}}

 /* ----- damage & collapse ----- */
 damage(p,dmg,src){if(!p.alive)return false;p.hp-=dmg;p.flash=1;if(p.hp<=0){this.destroy(p,src);return true;}this.refresh(p);this.growing.add(p);return false;}
 destroy(p,src){if(!p.alive)return;this.remove(p);this.onBreak&&this.onBreak(p,src);this.collapseFrom(p);}
 near(bb,pad,cb){const x0=Math.floor((bb[0]-pad)/CELL)-1,x1=Math.floor((bb[3]+pad)/CELL)+1,z0=Math.floor((bb[2]-pad)/CELL)-1,z1=Math.floor((bb[5]+pad)/CELL)+1;const seen=new Set();
  for(let i=x0;i<=x1;i++)for(let k=z0;k<=z1;k++){const s=this.grid.get(ck(i,k));if(s)for(const q of s){if(seen.has(q))continue;seen.add(q);cb(q);}}}
 touching(p,cb){const a=p.aabb,e=.18;this.near(a,e,q=>{if(q===p)return;const b=q.aabb;if(a[0]-e<=b[3]&&a[3]+e>=b[0]&&a[1]-e<=b[4]&&a[4]+e>=b[1]&&a[2]-e<=b[5]&&a[5]+e>=b[2])cb(q);});}
 grounded(p){if(p.anchor)return true;const W=this.world;const a=p.aabb;let h=-1e9;for(const[u,v]of[[.5,.5],[.1,.1],[.9,.1],[.1,.9],[.9,.9]])h=Math.max(h,W.heightAt(a[0]+(a[3]-a[0])*u,a[2]+(a[5]-a[2])*v));return a[1]<=h+.45;}
 collapseFrom(p){const seeds=[];this.touching(p,q=>seeds.push(q));const done=new Set();
  for(const s of seeds){if(done.has(s)||!s.alive)continue;const comp=[s],seen=new Set([s]);let ok=false;
   for(let i=0;i<comp.length&&comp.length<700;i++){const q=comp[i];if(this.grounded(q)){ok=true;break;}this.touching(q,r=>{if(!seen.has(r)&&r.alive){seen.add(r);comp.push(r);}});}
   comp.forEach(q=>done.add(q));if(!ok){const o=s.aabb;comp.forEach((q,i)=>this.falling.push({p:q,t:.08+i*.035+Math.random()*.05}));}}}
 update(dt){for(const p of this.growing){if(p.t<1){p.t=Math.min(1,p.t+dt/p.bt);p.hp=Math.min(p.max,p.hp+p.max*.85*dt/p.bt);}p.flash=Math.max(0,p.flash-dt*6);this.refresh(p);if(p.t>=1&&p.flash<=0)this.growing.delete(p);}
  for(let i=this.falling.length-1;i>=0;i--){const f=this.falling[i];f.t-=dt;if(f.t<=0){this.falling.splice(i,1);if(f.p.alive){this.remove(f.p);this.onBreak&&this.onBreak(f.p,null);}}}}

 /* ----- queries ----- */
 // highest walkable surface under (x,z) that is <= y+step. returns {h,p}
 support(x,z,y,step,r,out){out.h=-1e9;out.p=null;const ix=Math.floor(x/CELL),iz=Math.floor(z/CELL);
  for(let i=ix-1;i<=ix+1;i++)for(let k=iz-1;k<=iz+1;k++){const s=this.grid.get(ck(i,k));if(!s)continue;for(const p of s){let h=-1e9;
   if(p.type==='ramp'){const dx=x-p.x,dz=z-p.z,Dv=D[p.dir],al=dx*Dv[0]+dz*Dv[1],lat=Math.abs(dx*Dv[1]-dz*Dv[0]);if(lat<=2+r*.5&&al>=-2-r*.6&&al<=2+r*.6)h=p.base+H*(cl(al,-2,2)+2)/4;}
   else if(p.type==='roof'){const m=Math.max(Math.abs(x-p.x),Math.abs(z-p.z));if(m<=2+r*.4)h=p.base+ROOFH*(1-Math.min(m,2)/2);}
   else for(const b of p.boxes){if(x>=b[0]-r*.6&&x<=b[3]+r*.6&&z>=b[2]-r*.6&&z<=b[5]+r*.6&&b[4]>h&&b[4]<=y+step)h=b[4];}
   if(h<=y+step&&h>out.h){out.h=h;out.p=p;}}}return out;}
 // push a vertical cylinder (feet y, height ht, radius r) out of wall/floor boxes; returns true if pushed
 collide(pos,r,ht,step,cb){let hit=false;const ix=Math.floor(pos.x/CELL),iz=Math.floor(pos.z/CELL);
  for(let i=ix-1;i<=ix+1;i++)for(let k=iz-1;k<=iz+1;k++){const s=this.grid.get(ck(i,k));if(!s)continue;for(const p of s){if(!p.boxes.length)continue;for(const b of p.boxes){
   if(b[4]<=pos.y+step||b[1]>=pos.y+ht)continue;const qx=cl(pos.x,b[0],b[3]),qz=cl(pos.z,b[2],b[5]),dx=pos.x-qx,dz=pos.z-qz,d2=dx*dx+dz*dz;if(d2>=r*r)continue;
   if(d2>1e-8){const d=Math.sqrt(d2);pos.x+=dx/d*(r-d);pos.z+=dz/d*(r-d);}
   else{const pen=[pos.x-b[0]+r,b[3]-pos.x+r,pos.z-b[2]+r,b[5]-pos.z+r];let m=0;for(let j=1;j<4;j++)if(pen[j]<pen[m])m=j;if(m===0)pos.x=b[0]-r;else if(m===1)pos.x=b[3]+r;else if(m===2)pos.z=b[2]-r;else pos.z=b[5]+r;}
   hit=true;cb&&cb(p);}}}return hit;}
 // lowest box bottom above head (for ceilings)
 ceiling(x,z,y,r){let c=1e9;const ix=Math.floor(x/CELL),iz=Math.floor(z/CELL);for(let i=ix-1;i<=ix+1;i++)for(let k=iz-1;k<=iz+1;k++){const s=this.grid.get(ck(i,k));if(!s)continue;for(const p of s){
  if(p.type==='ramp'){const dx=x-p.x,dz=z-p.z,Dv=D[p.dir],al=dx*Dv[0]+dz*Dv[1],lat=Math.abs(dx*Dv[1]-dz*Dv[0]);if(lat<2&&Math.abs(al)<2){const h=p.base+H*(al+2)/4-TH*1.4;if(h>y&&h<c)c=h;}continue;}
  for(const b of p.boxes)if(x>b[0]-r*.5&&x<b[3]+r*.5&&z>b[2]-r*.5&&z<b[5]+r*.5&&b[1]>y&&b[1]<c)c=b[1];}}return c;}
 // ray through grid cells (DDA). returns {t,p,n} or null
 ray(o,d,maxT){if(!this.all.size)return null;let best=null,bt=maxT;const seen=new Set();
  const test=p=>{if(seen.has(p))return;seen.add(p);
   if(p.type==='ramp'){const Dv=D[p.dir],nx=-Dv[0],nz=-Dv[1],ny=1,den=d.x*nx+d.y*ny+d.z*nz;if(Math.abs(den)<1e-6)return;const px=p.x-Dv[0]*2,pz=p.z-Dv[1]*2,t=((px-o.x)*nx+(p.base-o.y)*ny+(pz-o.z)*nz)/den;
    if(t<0||t>=bt)return;const hx=o.x+d.x*t-p.x,hz=o.z+d.z*t-p.z;if(Math.abs(hx)>2||Math.abs(hz)>2)return;bt=t;best={t,p,n:new V(nx,ny,nz).normalize().multiplyScalar(den<0?1:-1)};return;}
   if(p.type==='roof'){const b=[p.x-2,p.base,p.z-2,p.x+2,p.base+ROOFH*.55,p.z+2],t=rayBox(o.x,o.y,o.z,d.x,d.y,d.z,b,bt);if(t>=0&&t<bt){bt=t;best={t,p,n:new V(0,1,0)};}return;}
   for(const b of p.boxes){const t=rayBox(o.x,o.y,o.z,d.x,d.y,d.z,b,bt);if(t>=0&&t<bt){bt=t;best={t,p,n:null,b};}}};
  let ix=Math.floor(o.x/CELL),iz=Math.floor(o.z/CELL);const sx=Math.sign(d.x),sz=Math.sign(d.z);
  const tdx=sx?CELL/Math.abs(d.x):1e9,tdz=sz?CELL/Math.abs(d.z):1e9;let tmx=sx?((sx>0?(ix+1)*CELL:ix*CELL)-o.x)/d.x:1e9,tmz=sz?((sz>0?(iz+1)*CELL:iz*CELL)-o.z)/d.z:1e9,t=0;
  for(let n=0;n<400;n++){for(const[a,c]of[[ix,iz],[ix-1,iz],[ix+1,iz],[ix,iz-1],[ix,iz+1]]){const s=this.grid.get(ck(a,c));if(s)for(const p of s)test(p);}
   if(best&&best.t<=t)break;if(tmx<tmz){t=tmx;tmx+=tdx;ix+=sx;}else{t=tmz;tmz+=tdz;iz+=sz;}if(t>bt)break;}
  if(best&&!best.n){const h=_p.copy(d).multiplyScalar(best.t).add(o);best.n=boxNormal(h.x,h.y,h.z,best.b);}return best;}

 /* ----- placement planning ----- */
 // level a new piece snaps to, given the actor's footing; prefers lining up with nearby structures
 level(a,ix,iz){const s=a.support||a.coyote;let L;
  if(s){L=s.type==='ramp'?s.base+H*Math.round((a.pos.y-s.base)/H):s.type==='roof'?s.base:s.type==='wall'?s.base+H:s.base;}
  else L=Math.round(a.pos.y*4)/4;
  let best=null,bd=.75;this.near([ix*CELL,0,iz*CELL,(ix+1)*CELL,0,(iz+1)*CELL],2,q=>{const c=q.base+H*Math.round((L-q.base)/H),dd=Math.abs(c-L);if(dd<bd){bd=dd;best=c;}});return best??L;}
 plan(a,type,out={}){const f=a.yaw,fx=Math.sin(f),fz=Math.cos(f);let dir=((Math.round(Math.atan2(fx,fz)/(Math.PI/2))%4)+4)%4;const Dv=D[dir];
  let ix=Math.floor(a.pos.x/CELL),iz=Math.floor(a.pos.z/CELL);const fr=(dir===0?a.pos.z/CELL-iz:dir===2?1-(a.pos.z/CELL-iz):dir===1?a.pos.x/CELL-ix:1-(a.pos.x/CELL-ix));
  const s=a.support||a.coyote,onRamp=s&&s.type==='ramp'&&s.dir===dir;let base;
  if(onRamp){ix=s.ix+Dv[0];iz=s.iz+Dv[1];base=s.base+H;if(type==='ramp'&&this.occupied('ramp',ix,iz,dir,base)){ix+=Dv[0];iz+=Dv[1];base+=H;}}
  else{if(type==='floor'){if((a.pitch??0)>-.55){ix+=Dv[0];iz+=Dv[1];}}else if(type==='ramp'){if(fr>.5){ix+=Dv[0];iz+=Dv[1];}}
   base=this.level(a,ix,iz);if(type==='roof')base+=H;
   if(type==='ramp'&&this.occupied('ramp',ix,iz,dir,base)){ix+=Dv[0];iz+=Dv[1];}
   if(type==='floor'&&this.occupied('floor',ix,iz,dir,base)&&(a.pitch??0)<=-.55){ix+=Dv[0];iz+=Dv[1];}}
  out.type=type;out.ix=ix;out.iz=iz;out.dir=dir;out.base=base;out.ok=!this.occupied(type,ix,iz,dir,base);return out;}
 showGhost(pl,ok){for(const k in this.ghostParts)this.ghostParts[k].visible=false;if(!pl){this.ghost.visible=false;return;}this.ghost.visible=true;const g=this.ghostParts[pl.type];g.visible=true;
  const cx=(pl.ix+.5)*CELL,cz=(pl.iz+.5)*CELL;if(pl.type==='wall'){const d=pl.dir;if(d===0||d===2){g.position.set(cx,pl.base,(d===0?pl.iz+1:pl.iz)*CELL);g.rotation.y=0;}else{g.position.set((d===1?pl.ix+1:pl.ix)*CELL,pl.base,cz);g.rotation.y=Math.PI/2;}}
  else{g.position.set(cx,pl.base,cz);g.rotation.y=pl.type==='ramp'?[0,Math.PI/2,Math.PI,-Math.PI/2][pl.dir]:0;}
  this.ghostMat.color.set(ok?0x58b8ff:0xff5a4a);this.ghostLine.color.set(ok?0xbfe8ff:0xffb0a0);}
}
