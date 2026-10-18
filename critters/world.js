// HARBOR PALS — the harbor: walkable regions (heights, stairs as ramps), merged static geometry, procedural textures,
// tide water, dusk sky, lamps, and the task props (dig mounds, broken pier gap, winch + motor, the boat "Puffin").
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,C=c=>new THREE.Color(c),cl=(v,a,b)=>v<a?a:v>b?b:v;
export function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ================= walkable regions =================
   {x0,x1,z0,z1,h} or a ramp {.., ax:'x'|'z', a:h at min edge, b:h at max edge}. kind: stone|wood|sand|solid.
   heightAt = highest region containing the point; nothing = open water. A step up of more than STEP is a wall. */
export const STEP=.55;
const REG=[];const DYN=[];
const reg=(x0,x1,z0,z1,h,kind='stone',ramp)=>{const r={x0,x1,z0,z1,h,kind};if(ramp)Object.assign(r,ramp);REG.push(r);return r;};
const solid=(x0,x1,z0,z1,h=12)=>reg(x0,x1,z0,z1,h,'solid');
// layout (x east, z toward the sea; the camera looks seaward)
export const SPOTS={start:new V(0,3,-15),post:new V(-4.5,3,-19.5),shed:new V(-17.6,1.2,-8.2),beach:new V(-18.5,1,4.5),pier:new V(16.3,1,9.5),
 gap:new V(15.5,1,15.2),gapFar:new V(15.5,.9,20.4),winch:new V(7,1.2,.2),motor:new V(9.6,1.2,-.6),boat:new V(10.2,.42,23.6),boatHome:new V(7,0,4.4),pierSafe:new V(15.5,1,13)};
// terrace (upper town), its retaining wall + rail, cottages
reg(-22,22,-24,-12,3,'stone');
solid(-30,30,-34,-24.4,12);solid(-30,-22,-34,-12,12);solid(22,30,-34,-12,12);
// rail along the terrace edge with the two stair openings
solid(-22,-14.2,-12.3,-12,4.2);solid(-10.8,11.8,-12.3,-12,4.2);solid(15.2,22,-12.3,-12,4.2);
// stairs A (straight) and stairs B (landing + a corner)
reg(-14,-11,-12,-6,0,'stone',{ax:'z',a:3,b:1.2});
reg(12,15,-12,-9,0,'stone',{ax:'z',a:3,b:2.2});reg(12,15,-9,-6.5,2.2,'stone');REG[REG.length-1].flag=1;reg(15,19,-9,-6.5,0,'stone',{ax:'x',a:2.2,b:1.2});
// quay
reg(-22,22,-12,2.2,1.2,'stone');
// net shed (open front, dark inside) walls
solid(-21.2,-13.8,-11.2,-10.6,7.6);solid(-21.2,-20.6,-11.2,-4.6,7.6);solid(-14.4,-13.8,-11.2,-4.6,7.6);solid(-21.2,-19.4,-5.2,-4.6,7.6);solid(-15.6,-13.8,-5.2,-4.6,7.6);
// winch shed behind the winch, crates, barrels, boat house wall
solid(4.4,10.6,-9.4,-4.2,7);solid(-6,-3.6,-10.8,-9,2.8);solid(1.5,3,-1.2,.4,2.6);solid(-2.6,-1.2,-4,-2.6,2.6);solid(17.6,19.2,-2,-.4,2.6);solid(22,30,-12,2.2,2.5);
// sea wall curbs where the quay meets deep water
solid(-4,4.4,2.1,2.5,1.9);solid(9.8,14,2.1,2.5,1.9);solid(17.1,22,2.1,2.5,1.9);
// props that block walking (and the camera): kennel, bench, flower boxes, lamps, barrels, pots, dinghy, winch, motor
solid(-5.8,-3.2,-20.5,-18.5,5.7);solid(2.5,5.5,-23.5,-22.8,4.1);for(const x of[-18,-6,6,18])solid(x-1,x+1,-23.6,-22.9,3.6);
for(const[x,z,y]of[[-12,-13.1,3],[10.5,-13.1,3],[-6,1.5,1.2],[12,1.5,1.2],[16.8,6,1],[16.8,13.4,1],[-20,-3.8,1.2],[20.5,-8,1.2]])solid(x-.2,x+.2,z-.2,z+.2,y+3.3);
solid(-1.7,.1,-1.9,-.5,2.3);solid(19.9,21.5,-4.5,-2.7,2.3);for(const[x,z]of[[-10,-2],[13,-9.6],[-3,-7.6]])solid(x-.6,x+.6,z-.35,z+.35,1.85);
solid(-8.4,-5.6,3.7,4.7,2.2);solid(5.9,8.1,-.45,.85,2.4);solid(9,10.2,-1.1,-.1,2.4);
// beach (slopes to the sea), its cliff, the slipway
reg(-22,-4,2.2,11,0,'sand',{ax:'z',a:1.2,b:.45});solid(-30,-22,-12,14,8);solid(-4,-3.2,2.2,6,1.9);
reg(4.4,9.8,2.2,15,0,'stone',{ax:'z',a:1.2,b:-1.1});
// pier (broken at the end) and the sandbar landing stage
reg(14,17,2.2,16,1,'wood');reg(14,17,19.6,21.6,.9,'wood');reg(5,20,21.6,27.5,.42,'sand');reg(6.5,18.5,20.2,21.6,.42,'sand');
// the bridge Stilt makes across the gap (added while bridging)
export const BRIDGE={x0:14.75,x1:16.25,z0:15.6,z1:19.95,h:0,ax:'z',a:1.12,b:1.05,kind:'wood'};
export function setBridge(on){const i=DYN.indexOf(BRIDGE);if(on&&i<0)DYN.push(BRIDGE);if(!on&&i>=0)DYN.splice(i,1);}
function rh(r,x,z){if(!r.ax)return r.h;const t=r.ax==='x'?(x-r.x0)/(r.x1-r.x0):(z-r.z0)/(r.z1-r.z0);return r.a+(r.b-r.a)*cl(t,0,1);}
export function ground(x,z){let h=-99,k=null;for(const L of[REG,DYN])for(const r of L)if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1){const v=rh(r,x,z);if(v>h){h=v;k=r;}}return{h,kind:k?k.kind:'water',r:k};}
export const heightAt=(x,z)=>ground(x,z).h;
export const onFar=(p)=>p.z>16.2&&p.x>4&&p.x<21; // beyond the gap (the bridge or the sandbar)

/* ================= procedural textures ================= */
function cv(n,f){const c=document.createElement('canvas');c.width=c.height=n;f(c.getContext('2d'),n);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function texCobble(){return cv(256,(x,n)=>{const r=mulberry(3);x.fillStyle='#6a5444';x.fillRect(0,0,n,n);const rows=8;for(let j=0;j<rows;j++){const off=(j%2)*16;for(let i=-1;i<8;i++){const w=30+r()*6,h=n/rows-4,cx=i*32+off+2,cy=j*n/rows+2,v=150+r()*70|0,t=r()*16-8;
 x.fillStyle=`rgb(${v+t|0},${v*.9+t|0},${v*.74|0})`;x.beginPath();x.roundRect(cx,cy,w-4,h,7);x.fill();x.fillStyle='rgba(255,255,255,.10)';x.beginPath();x.roundRect(cx+2,cy+2,w-10,h*.35,5);x.fill();}}
 for(let i=0;i<900;i++){x.fillStyle=`rgba(0,0,0,${r()*.12})`;x.fillRect(r()*n,r()*n,2,2);}});}
function texFlag(){return cv(256,(x,n)=>{const r=mulberry(17);x.fillStyle='#7a6450';x.fillRect(0,0,n,n);const rows=[0,64,128,192,256];for(let j=0;j<4;j++){let px=-r()*40;while(px<n){const w=50+r()*60,v=185+r()*45|0;x.fillStyle=`rgb(${v},${v*.88|0},${v*.72|0})`;x.fillRect(px+2,rows[j]+2,w-4,60);
 x.fillStyle='rgba(255,255,255,.08)';x.fillRect(px+3,rows[j]+3,w-6,10);for(let k=0;k<30;k++){x.fillStyle=`rgba(90,60,40,${r()*.15})`;x.fillRect(px+2+r()*(w-6),rows[j]+2+r()*58,2+r()*3,2+r()*3);}px+=w;}}});}
function texPlank(){return cv(256,(x,n)=>{const r=mulberry(5);for(let j=0;j<8;j++){const v=130+r()*60|0;x.fillStyle=`rgb(${v},${v*.72|0},${v*.5|0})`;x.fillRect(0,j*32,n,32);
 for(let k=0;k<26;k++){x.strokeStyle=`rgba(60,30,10,${.08+r()*.12})`;x.lineWidth=1;x.beginPath();const y=j*32+3+r()*26;x.moveTo(0,y);x.bezierCurveTo(80,y+r()*4-2,170,y+r()*4-2,n,y);x.stroke();}
 x.fillStyle='rgba(30,15,5,.55)';x.fillRect(0,j*32,n,2);const cut=r()*n;x.fillRect(cut,j*32,2,32);x.fillStyle='rgba(30,20,10,.6)';for(const q of[cut-8,cut+8]){x.beginPath();x.arc(q,j*32+9,1.6,0,7);x.arc(q,j*32+23,1.6,0,7);x.fill();}}});}
function texRoof(){return cv(256,(x,n)=>{const r=mulberry(9);x.fillStyle='#5a2a20';x.fillRect(0,0,n,n);for(let j=0;j<8;j++)for(let i=-1;i<9;i++){const v=170+r()*60|0,cx=i*32+(j%2)*16,cy=j*32;
 const g=x.createLinearGradient(0,cy,0,cy+32);g.addColorStop(0,`rgb(${v},${v*.5|0},${v*.38|0})`);g.addColorStop(1,`rgb(${v*.62|0},${v*.28|0},${v*.2|0})`);x.fillStyle=g;x.beginPath();x.moveTo(cx+1,cy);x.lineTo(cx+31,cy);x.lineTo(cx+31,cy+22);x.quadraticCurveTo(cx+16,cy+36,cx+1,cy+22);x.fill();}});}
function texSand(){return cv(256,(x,n)=>{const r=mulberry(11);x.fillStyle='#d9bf8e';x.fillRect(0,0,n,n);for(let i=0;i<5000;i++){const v=r();x.fillStyle=v<.5?`rgba(120,90,50,${r()*.18})`:`rgba(255,250,230,${r()*.25})`;x.fillRect(r()*n,r()*n,1+r()*2,1+r()*2);}
 x.strokeStyle='rgba(150,115,70,.18)';x.lineWidth=3;for(let i=0;i<9;i++){x.beginPath();const y=r()*n;x.moveTo(0,y);x.bezierCurveTo(90,y+12,170,y-12,n,y);x.stroke();}});}
function texPlaster(){return cv(128,(x,n)=>{const r=mulberry(13);x.fillStyle='#e8e2d6';x.fillRect(0,0,n,n);for(let i=0;i<1600;i++){x.fillStyle=`rgba(${r()<.5?0:255},${r()<.5?0:255},${r()<.5?0:255},${r()*.05})`;x.fillRect(r()*n,r()*n,3,3);}
 x.fillStyle='rgba(120,100,80,.08)';for(let i=0;i<5;i++)x.fillRect(0,r()*n,n,1);});}
function texWaterN(){// tiling normal map for ripples
 const n=256,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),img=x.createImageData(n,n),hgt=new Float32Array(n*n),r=mulberry(21);
 const waves=[];for(let i=0;i<14;i++)waves.push([Math.floor(1+r()*6)*(r()<.5?-1:1),Math.floor(1+r()*6)*(r()<.5?-1:1),r()*6.28,.3+r()]);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){let h=0;for(const w of waves)h+=Math.sin((i*w[0]+j*w[1])/n*6.2832+w[2])*w[3];hgt[j*n+i]=h;}
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const dx=hgt[j*n+(i+1)%n]-hgt[j*n+(i+n-1)%n],dz=hgt[((j+1)%n)*n+i]-hgt[((j+n-1)%n)*n+i],k=(j*n+i)*4;const v=new V(-dx*.6,-dz*.6,1).normalize();img.data[k]=(v.x*.5+.5)*255;img.data[k+1]=(v.y*.5+.5)*255;img.data[k+2]=(v.z*.5+.5)*255;img.data[k+3]=255;}
 x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
export function softDot(){return cv(64,(x,n)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,n,n);});}

/* ================= static geometry kit: everything with one material merges into one mesh ================= */
class Kit{
 constructor(){this.L={};}
 add(mat,geo,col){(this.L[mat]||(this.L[mat]=[])).push([geo,C(col)]);return geo;}
 // axis box from min/max corners; uvs in metres / ts
 box(mat,x0,y0,z0,x1,y1,z1,col,ts=2){const w=x1-x0,h=y1-y0,d=z1-z0;const g=new THREE.BoxGeometry(w,h,d);uvScale(g,w/ts,h/ts,d/ts);g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);return this.add(mat,g,col);}
 boxR(mat,cx,cy,cz,w,h,d,ry,col,ts=2,rx=0,rz=0){const g=new THREE.BoxGeometry(w,h,d);uvScale(g,w/ts,h/ts,d/ts);g.rotateX(rx);g.rotateZ(rz);g.rotateY(ry);g.translate(cx,cy,cz);return this.add(mat,g,col);}
 cyl(mat,x,y,z,r0,r1,h,col,seg=8,rx=0,rz=0,ry=0){const g=new THREE.CylinderGeometry(r0,r1,h,seg);g.rotateX(rx);g.rotateZ(rz);g.rotateY(ry);g.translate(x,y,z);return this.add(mat,g,col);}
 sph(mat,x,y,z,sx,sy,sz,col,d=1){const g=new THREE.IcosahedronGeometry(1,d);g.scale(sx,sy,sz);g.translate(x,y,z);return this.add(mat,g,col);}
 // gabled roof: ridge along x when ry=0
 gable(mat,cx,y,cz,w,d,h,col,ry=0,over=.35){const W=w+over*2,D=d+over*2,s=Math.hypot(D/2,h),a=Math.atan2(h,D/2);
  for(const sd of[-1,1]){const g=new THREE.BoxGeometry(W,.16,s);uvScale(g,W/2,.08,s/2);g.rotateX(sd*a);g.translate(0,y+h/2,sd*D/4);g.rotateY(ry);g.translate(cx,0,cz);this.add(mat,g,col);}}
 gableEnd(mat,cx,y,cz,w,d,h,col,ry=0){const sh=new THREE.Shape();sh.moveTo(-d/2,0);sh.lineTo(d/2,0);sh.lineTo(0,h);sh.lineTo(-d/2,0);
  for(const sd of[-1,1]){const g=new THREE.ShapeGeometry(sh);g.rotateY(Math.PI/2*sd);g.translate(sd*w/2,y,0);g.rotateY(ry);g.translate(cx,0,cz);this.add(mat,g,col);}}
 build(scene,mats,shadow=true){const out=[];for(const k in this.L){const m=mergeColored(this.L[k]);const mesh=new THREE.Mesh(m,mats[k]);mesh.castShadow=shadow&&k!=='glow';mesh.receiveShadow=k!=='glow';scene.add(mesh);out.push(mesh);}this.L={};return out;}}
function uvScale(g,w,h,d){const uv=g.attributes.uv;const S=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*S[f][0],uv.getY(k)*S[f][1]);}}
export function mergeColored(list){let n=0;const gs=list.map(([g,c])=>{const q=g.index?g.toNonIndexed():g;if(!q.attributes.normal)q.computeVertexNormals();n+=q.attributes.position.count;return[q,c];});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3);let o=0;
 for(const[q,c]of gs){const k=q.attributes.position.count;pos.set(q.attributes.position.array,o*3);nor.set(q.attributes.normal.array,o*3);if(q.attributes.uv)uv.set(q.attributes.uv.array,o*2);
  for(let i=0;i<k;i++){const y=q.attributes.position.getY(i),ny=q.attributes.normal.getY(i),f=(1+ny*.04);col[(o+i)*3]=c.r*f;col[(o+i)*3+1]=c.g*f;col[(o+i)*3+2]=c.b*f;}o+=k;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeBoundingSphere();return geo;}

// a sand shelf: flat walkable top that slopes away under the water on every side (no cut slab edges)
function shelf(K,x0,x1,z0,z1,h,ext,sides=[1,1,1,1]){const nx=Math.ceil((x1-x0+ext*2)/.7),nz=Math.ceil((z1-z0+ext*2)/.7),g=new THREE.PlaneGeometry(x1-x0+ext*2,z1-z0+ext*2,nx,nz);g.rotateX(-Math.PI/2);const p=g.attributes.position,cx=(x0+x1)/2,cz=(z0+z1)/2;
 for(let i=0;i<p.count;i++){const x=p.getX(i)+cx,z=p.getZ(i)+cz;const dx=Math.max(x0-x,0,x-x1),dz=Math.max(z0-z,0,z-z1),d=Math.hypot(dx,dz);p.setXYZ(i,x,h-Math.min(1.6,d*d*.55+d*.35)+Math.sin(x*1.3+z)*.02,z);}
 const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(x1-x0+ext*2)/3,uv.getY(i)*(z1-z0+ext*2)/3);g.computeVertexNormals();K.add('sand',g,'#f0d9ac');}
/* ================= the world ================= */
export function buildWorld(scene,R){
 const T={flag:texFlag(),cob:texCobble(),plank:texPlank(),roof:texRoof(),sand:texSand(),plaster:texPlaster()};
 const std=(o)=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,...o});
 const M={flag:std({map:T.flag,bumpMap:T.flag,bumpScale:1,roughness:.8}),stone:std({map:T.cob,bumpMap:T.cob,bumpScale:1.4}),wood:std({map:T.plank,bumpMap:T.plank,bumpScale:1,roughness:.8}),roof:std({map:T.roof,bumpMap:T.roof,bumpScale:1.5,roughness:.7}),
  sand:std({map:T.sand,roughness:.95}),plaster:std({map:T.plaster,roughness:.9}),paint:std({roughness:.6}),glow:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:true}),rock:std({map:T.sand,roughness:.92,flatShading:true}),metal:std({roughness:.45,metalness:.5})};
 const K=new Kit();const W={M,T,lamps:[],gulls:[],mounds:[],time:0};
 /* ---- ground surfaces from the regions ---- */
 for(const r of REG){if(r.kind==='solid')continue;const mat=r.kind==='sand'?'sand':r.kind==='wood'?'wood':'stone';const col=r.kind==='stone'?(r.h>2.5&&!r.ax?'#e4d2bf':'#d6c8b8'):r.kind==='wood'?'#b98c62':'#f2dcb0';
  if(r.ax){// stairs (stone/wood treads) or the sloping beach/slipway
   if(r.kind==='sand'||r.x0===4.4){const g=new THREE.PlaneGeometry(r.x1-r.x0,r.z1-r.z0,8,8);g.rotateX(-Math.PI/2);const p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i)+(r.x0+r.x1)/2,z=p.getZ(i)+(r.z0+r.z1)/2;p.setXYZ(i,x,rh(r,x,z)+(r.kind==='sand'?Math.sin(x*.7)*Math.cos(z*.9)*.04:0),z);}
    const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(r.x1-r.x0)/3,uv.getY(i)*(r.z1-r.z0)/3);g.computeVertexNormals();K.add(mat,g,r.kind==='sand'?col:'#a9a39b');
    // substructure under the slope
    if(r.kind!=='sand')K.box('stone',r.x0,-3,r.z0,r.x1,Math.min(r.a,r.b)-.05,r.z1,'#8b8178');else{K.box('sand',r.x0,-3,r.z0,r.x1,.3,r.z1-.2,'#d9c08f');shelf(K,r.x0+.5,r.x1-.5,r.z1-1.2,r.z1-.05,r.b,1.6);}
    continue;}
   const n=Math.max(3,Math.round(Math.abs(r.a-r.b)/.2)),len=r.ax==='z'?r.z1-r.z0:r.x1-r.x0;
   for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,h=r.a+(r.b-r.a)*((t0+t1)/2)+.1;if(r.ax==='z')K.box('flag',r.x0,0,r.z0+len*t0,r.x1,h,r.z0+len*t1,i%2?'#f0dcc4':'#e2ccb2',1.5);else K.box('flag',r.x0+len*t0,0,r.z0,r.x0+len*t1,h,r.z1,i%2?'#f0dcc4':'#e2ccb2',1.5);}
   continue;}
  if(r.kind==='wood'){// pier deck on posts
   K.box('wood',r.x0,r.h-.22,r.z0,r.x1,r.h,r.z1,col,1.2);for(let z=r.z0+.4;z<r.z1;z+=2.2)for(const x of[r.x0+.15,r.x1-.15])K.cyl('wood',x,r.h-2.2,z,.16,.18,4.2,'#6a4a32',7);
   continue;}
  if(r.kind==='sand'&&r.h<.5){if(r.z1>27){shelf(K,r.x0,r.x1,r.z0,r.z1,r.h,1.8);shelf(K,6.5,18.5,20.2,22,r.h,1.2);}continue;}
  const top=r.h,bot=r.kind==='sand'?-1.5:-3;K.box(r.kind==='stone'&&r.h>2.5?'flag':mat,r.x0,bot,r.z0,r.x1,top,r.z1,r.kind==='stone'&&r.h>2.5?'#f0dcc4':col,r.kind==='sand'?3:r.h>2?3:2);}
 // quay sea-facing wall faces get a darker band (wet stone) — a skirt slightly proud of the walls at the waterline
 K.box('stone',-4,-1.2,2.18,4.4,.15,2.3,'#6f675f');K.box('stone',9.8,-1.2,2.18,14,.15,2.3,'#6f675f');K.box('stone',17,-1.2,2.18,22,.15,2.3,'#6f675f');
 // curbs + bollards
 for(const[x0,x1]of[[-4,4.4],[9.8,14],[17.1,22]]){K.box('stone',x0,1.2,2.1,x1,1.55,2.5,'#c9b8a4',1);for(let x=x0+.8;x<x1-.3;x+=2.6){K.cyl('metal',x,1.55+.3,2.3,.18,.22,.6,'#2c3a48',10);K.sph('metal',x,2.18,2.3,.22,.12,.22,'#2c3a48');}}
 // terrace rail: posts + top bar
 for(const[x0,x1]of[[-22,-14.2],[-10.8,11.8],[15.2,22]]){K.box('paint',x0,3.9,-12.22,x1,4.02,-12.08,'#2f4a5c');K.box('paint',x0,3.4,-12.2,x1,3.46,-12.1,'#2f4a5c');for(let x=x0+.2;x<=x1;x+=1.3)K.box('paint',x-.05,3,-12.2,x+.05,4,-12.1,'#2f4a5c');}
 K.box('stone',-22,1.2,-12.3,22,3,-12,'#a29587');// retaining wall face
 // cliffs and outer walls (rocks)
 const rr=mulberry(41);for(let i=0;i<34;i++){const z=-12+i*.8,x=-23+rr()*1.4;K.sph('rock',x-1.5,rr()*2+1,z,2.2+rr(),2.5+rr()*2.5,1.4+rr(),['#9a8478','#8a7a70','#a48c7c'][i%3],1);}
 for(let i=0;i<10;i++)K.sph('rock',-22+rr()*2.2,.1,11+rr()*4,1.2+rr(),.9+rr(),1.2+rr(),'#8a7870',1);
 // breakwater + lighthouse (east)
 for(let i=0;i<30;i++){const z=-10+i*1.55+rr()*.8;K.sph('rock',24.2+rr()*3.6,rr()*.9-.1,z,1.2+rr()*1.6,.8+rr()*1.3,1+rr()*1.4,['#8a7870','#9a8478','#7e6c66'][i%3],1);}
 K.box('stone',22,1.2,-12,26,2.5,2.2,'#b9a998');
 const lh=new V(27,0,32);for(let i=0;i<9;i++)K.sph('rock',lh.x+Math.cos(i*.7)*3.8,rr()*.5-.1,lh.z+Math.sin(i*.7)*3.8,1.2+rr()*1.1,.9+rr()*.9,1.2+rr()*1.1,['#8a7870','#9a8478'][i%2],1);K.cyl('stone',lh.x,1,lh.z,3.4,3.8,3,'#8a8079',12);K.cyl('plaster',lh.x,7,lh.z,1.5,2.1,10,'#f4efe6',14);for(let k=0;k<3;k++)K.cyl('paint',lh.x,4+k*3,lh.z,1.95-k*.18,2.02-k*.18,1.1,'#c8433a',14);
 K.cyl('paint',lh.x,12.3,lh.z,1.7,1.7,.3,'#2a3440',14);K.cyl('glow',lh.x,13.1,lh.z,1.05,1.05,1.3,'#fff2c0',12);K.cyl('paint',lh.x,14.2,lh.z,.2,1.4,.9,'#c8433a',12);
 W.lighthouse=lh;
 /* ---- cottages on the terrace (back row) ---- */
 const tints=['#f3d9c4','#cfe3e6','#f1e2b6','#d9e6cf','#f0cfcf','#e3d6ef'];
 const house=(cx,cz,w,d,h,ti,ry=0,door=true)=>{const t=tints[ti%tints.length];K.boxR('plaster',cx,3+h/2,cz,w,h,d,ry,t,2);K.gable('roof',cx,3+h,cz,w,d,h*.55,['#c96a4a','#8a5a7a','#4f7f8a'][ti%3],ry);K.gableEnd('plaster',cx,3+h,cz,w,d,h*.55,t,ry);
  const cs=Math.cos(ry),sn=Math.sin(ry),loc=(lx,lz)=>[cx+lx*cs+lz*sn,cz-lx*sn+lz*cs];
  for(let i=0;i<Math.floor(w/2.2);i++){const lx=-w/2+1.3+i*2.2;if(door&&Math.abs(lx)<.8)continue;const[x,z]=loc(lx,d/2+.03);K.boxR('glow',x,3+h*.62,z,.8,.9,.06,ry,'#ffd890');K.boxR('paint',x,3+h*.62,z+.02*cs,.95,.12,.08,ry,'#3d5566');K.boxR('paint',x,3+h*.62-.52,z,1.05,.1,.25,ry,'#7a5a3a');
   K.boxR('paint',x,3+h*.62-.45,z+.12,.9,.18,.18,ry,'#5c8a3a');for(let f=0;f<3;f++)K.sph('paint',x-.3+f*.3,3+h*.62-.3,z+.14,.11,.11,.11,['#ff7a8a','#ffd04a','#f4f0ff'][f],0);}
  if(door){const[x,z]=loc(0,d/2+.03);K.boxR('paint',x,3+.95,z,.95,1.9,.08,ry,['#2f6d8a','#a84a3a','#3d7a4a'][ti%3]);K.boxR('glow',x,3+2.15,z,.9,.25,.07,ry,'#ffcf80');}
  const[ch,cz2]=loc(w*.3,-d*.15);K.box('stone',ch-.3,3+h,cz2-.3,ch+.3,3+h*1.55,cz2+.3,'#9a8a80',1);};
 house(-17,-27,7,5,4.4,0,0);house(-9,-27.4,7.5,5.5,5,1,0);house(-.8,-27,7,5,4.2,2,0);house(7.4,-27.4,7.6,5.4,5.2,3,0);house(15.6,-27,7.4,5,4.4,4,0);
 house(-25.5,-18,6,8,4.6,5,Math.PI/2,false);house(25.5,-18.5,6,9,4.4,1,-Math.PI/2,false);
 // terrace dressing: flower boxes, benches, the Pal Post (a little kennel hut where the pals rest)
 for(const x of[-18,-6,6,18]){K.box('wood',x-1,3,-23.6,x+1,3.5,-22.9,'#8a5a3a',1);for(let f=0;f<5;f++)K.sph('paint',x-.8+f*.4,3.6,-23.25,.18,.16,.18,['#ff6a7a','#ffd04a','#ffffff','#ff9a3a','#c08aff'][f],0);}
 K.box('wood',2.5,3.4,-23.4,5.5,3.5,-22.8,'#9a6a44',1);K.box('wood',2.6,3,-23.2,2.8,3.4,-23,'#5a3a2a');K.box('wood',5.2,3,-23.2,5.4,3.4,-23,'#5a3a2a');K.box('wood',2.5,3.5,-23.5,5.5,4.1,-23.4,'#9a6a44',1);
 const pp=SPOTS.post;K.box('wood',pp.x-1.3,3,pp.z-1,pp.x+1.3,4.6,pp.z+1,'#c7854a',1.2);K.gable('roof',pp.x,4.6,pp.z,2.6,2,1,'#3f7a8a',0,.25);K.gableEnd('wood',pp.x,4.6,pp.z,2.6,2,1,'#c7854a');
 K.box('paint',pp.x-.55,3,pp.z+.98,pp.x+.55,4.1,pp.z+1.04,'#3a2a22');K.sph('paint',pp.x,4.1,pp.z+1.03,.55,.55,.03,'#3a2a22',1);K.box('glow',pp.x-.7,4.35,pp.z+1.06,pp.x+.7,4.55,pp.z+1.1,'#ffe0a0');
 /* ---- the net shed (dark inside) ---- */
 {const x0=-21.2,x1=-13.8,z0=-11.2,z1=-4.6,h=4.2;K.box('wood',x0,1.2,z0,x1,1.2+h,z0+.6,'#7a3a32',1.2);K.box('wood',x0,1.2,z0,x0+.6,1.2+h,z1,'#7a3a32',1.2);K.box('wood',x1-.6,1.2,z0,x1,1.2+h,z1,'#7a3a32',1.2);
  K.box('wood',x0,1.2,z1-.6,-19.4,1.2+h,z1,'#7a3a32',1.2);K.box('wood',-15.6,1.2,z1-.6,x1,1.2+h,z1,'#7a3a32',1.2);K.box('wood',-19.4,1.2+3.1,z1-.6,-15.6,1.2+h,z1,'#7a3a32',1.2);
  K.gable('roof',(x0+x1)/2,1.2+h,(z0+z1)/2,x1-x0,z1-z0,1.8,'#55606a',0,.4);K.gableEnd('wood',(x0+x1)/2,1.2+h,(z0+z1)/2,x1-x0,z1-z0,1.8,'#7a3a32');
  for(let i=0;i<4;i++)K.boxR('paint',-20.2+i*1.8,3.2,-10.5,1.5,2.2,.05,0,'#355a4a',2,0,.05*i);
  K.box('wood',-20.4,1.2,-10.4,-18.8,2,-9,'#8a6a4a',1);K.cyl('paint',-15.2,1.6,-9.8,.45,.45,.8,'#5a7a8a',10);K.cyl('paint',-15.2,2.4,-9.8,.45,.45,.8,'#4a6a7a',10);}
 /* ---- winch shed + harbour clutter ---- */
 K.box('wood',4.4,1.2,-9.4,10.6,5,-4.2,'#3f6a7a',1.2);K.gable('roof',7.5,5,-6.8,6.2,5.2,1.5,'#b8543a');K.gableEnd('wood',7.5,5,-6.8,6.2,5.2,1.5,'#3f6a7a');
 K.box('paint',6.4,1.2,-4.18,8.6,3.6,-4.12,'#2a3a44');K.box('glow',5,3.2,-4.17,6,3.9,-4.12,'#ffd890');K.box('glow',9,3.2,-4.17,10,3.9,-4.12,'#ffd890');
 const crate=(x,z,s,c='#b0864e',y=1.2)=>{K.box('wood',x-s/2,y,z-s/2,x+s/2,y+s,z+s/2,c,1);K.box('paint',x-s/2-.02,y+s*.42,z-s/2-.02,x+s/2+.02,y+s*.58,z+s/2+.02,'#6a4a2a');};
 crate(2.25,-.4,1.2);crate(2.1,-.5,.8,'#c49a5e',2.4);crate(-1.9,-3.3,1.2);crate(18.4,-1.2,1.4,'#a07a48');crate(-5,-10,1.4);crate(-4.6,-10.2,.9,'#c49a5e',2.6);
 for(const[x,z]of[[-1.2,-1.4],[-.4,-1],[20.4,-4],[21,-3.2]]){K.cyl('wood',x,1.2+.5,z,.38,.34,1,'#8a5a32',10);K.cyl('metal',x,1.2+.25,z,.4,.4,.08,'#3a3a3a',10);K.cyl('metal',x,1.2+.75,z,.38,.38,.08,'#3a3a3a',10);}
 for(const[x,z]of[[12.5,-.6],[-8,0.8]]){K.cyl('paint',x,1.32,z,.6,.6,.18,'#c8b48a',14);K.cyl('paint',x,1.48,z,.48,.48,.14,'#b8a47a',14);} // rope coils
 for(const[x,z]of[[-10,-2],[13,-9.6],[-3,-7.6]]){K.box('wood',x-.6,1.2,z-.35,x+.6,1.75,z+.35,'#4a6a8a',1);for(let k=0;k<3;k++)K.box('paint',x-.62,1.25+k*.18,z-.37,x+.62,1.29+k*.18,z+.37,'#2a3a4a');} // lobster pots
 // beach dressing: upturned dinghy, rocks, shells
 {const y0=heightAt(-7,4.2);const g=new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2);g.scale(.8,.62,1.5);g.rotateY(Math.PI/2);g.translate(-7,y0-.05,4.2);K.add('paint',g,'#2f6d9a');const st=new THREE.CylinderGeometry(1,1,.12,20,1,true);st.scale(.82,1,1.52);st.rotateY(Math.PI/2);st.translate(-7,y0+.05,4.2);K.add('paint',st,'#f4efe6');K.box('wood',-8.5,y0+.56,4.15,-5.5,y0+.66,4.25,'#8a5a3a');K.boxR('wood',-6.2,heightAt(-6.2,5.6)+.05,5.6,.14,.06,2.2,.5,'#c09a6a',1);K.boxR('wood',-6.6,heightAt(-6.6,5.8)+.05,5.8,.14,.06,2.2,.3,'#c09a6a',1);}
 for(let i=0;i<9;i++){const x=-21+rr()*16,z=3+rr()*8;if(Math.hypot(x+15.5,z-5.4)<1.6||Math.hypot(x+9.2,z-8.2)<1.6||Math.hypot(x+18.4,z-8.9)<1.6)continue;K.sph('rock',x,heightAt(x,z)+.02,z,.2+rr()*.25,.1+rr()*.12,.2+rr()*.25,'#b8aa98',1);}
 for(let i=0;i<12;i++){const x=-21+rr()*16,z=3+rr()*8;K.sph('paint',x,heightAt(x,z)+.03,z,.07,.03,.06,['#fff0e6','#ffc8b0','#f4e0c8'][i%3],1);}
 /* ---- lamps ---- */
 const lamp=(x,z,y)=>{K.cyl('metal',x,y+1.4,z,.07,.1,2.8,'#26323c',8);K.cyl('metal',x,y+.1,z,.22,.26,.2,'#26323c',8);K.cyl('glow',x,y+3,z,.2,.16,.45,'#ffd28a',8);K.cyl('metal',x,y+3.3,z,.05,.3,.18,'#26323c',8);W.lamps.push(new V(x,y+3,z));};
 lamp(-12,-13.1,3);lamp(10.5,-13.1,3);lamp(-6,1.5,1.2);lamp(12,1.5,1.2);lamp(16.8,6,1);lamp(16.8,13.4,1);lamp(-20,-3.8,1.2);lamp(20.5,-8,1.2);
 // bunting between lamps on the terrace and quay
 const bunt=(a,b,n=14)=>{for(let i=0;i<n;i++){const t=(i+.5)/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t-Math.sin(t*Math.PI)*.8;const g=new THREE.ConeGeometry(.16,.34,3);g.rotateX(Math.PI);g.rotateY(Math.atan2(b.x-a.x,b.z-a.z)+Math.PI/2);g.translate(x,y-.17,z);K.add('paint',g,['#ff6a5a','#ffd04a','#4ab8c8','#f4f0ff','#7ac85a'][i%5]);}};
 bunt(new V(-12,6.1,-13.1),new V(10.5,6.1,-13.1),26);bunt(new V(-6,4.3,1.5),new V(12,4.3,1.5),20);
 /* ---- the broken pier end + gap posts + a warning board ---- */
 for(const x of[14.3,16.7]){K.cyl('wood',x,-.5,16.9,.17,.19,2.6,'#5a3e2a',7);K.cyl('wood',x,-.6,18.6,.17,.19,2.4,'#5a3e2a',7);}
 K.boxR('wood',14.6,.75,16.3,.5,.1,1.3,0,'#9a7350',1,.4,.1);K.boxR('wood',16.5,.6,16.4,.4,.1,1.0,0,'#9a7350',1,.6,-.2);
 K.box('paint',13.9,1,15.2,14.05,2.2,15.35,'#3a2a22');K.boxR('paint',13.98,2.1,15.28,.08,.6,.9,0,'#ffcf3a');for(let k=0;k<3;k++)K.boxR('paint',14.0,1.92+k*.18,15.28-.25+k*.25,.06,.08,.3,0,'#2a2a2a',2,.8);
 // sandbar landing stage posts + seaweed tufts + tide pole
 for(let i=0;i<14;i++){const x=6+rr()*13,z=21.8+rr()*5.4;K.sph('paint',x,.45,z,.3+rr()*.3,.08,.2+rr()*.2,'#4a6a3a',0);}
 const tp=new V(12.2,0,12.5);for(let k=0;k<10;k++)K.cyl('paint',tp.x,-1.6+k*.4+.2,tp.z,.12,.12,.4,k%2?'#f4f0e6':'#c8433a',8);K.cyl('paint',tp.x,2.5,tp.z,.18,.18,.12,'#2a3440',8);W.tidePole=tp;
 /* ---- distant headlands + far islands ---- */
 const far=(x,z,r,h,c,seed)=>{const q=mulberry(seed),g=new THREE.ConeGeometry(r,h,16,4);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),k=(y+h/2)/h;if(k<.99){const a=Math.atan2(p.getZ(i),p.getX(i)),w=1+Math.sin(a*3+seed)*.18+Math.sin(a*7+seed*2)*.08;p.setX(i,p.getX(i)*w);p.setZ(i,p.getZ(i)*w);}p.setY(i,y*(1-.25*Math.pow(k,3))+Math.sin(i*1.3)*h*.03*(1-k));}
  g.translate(x,h/2-2,z);K.add('rock',g,c);};
 far(-60,95,42,16,'#a07e8e',1);far(-18,120,36,11,'#ae8c98',2);far(38,108,46,18,'#98788c',3);far(84,82,30,12,'#a07e8e',4);far(-96,62,30,20,'#94768a',5);far(10,140,50,9,'#b498a0',6);
 // seabed
 K.box('sand',-80,-4,-12,90,-3.2,140,'#6a8a7a',8);
 W.meshes=K.build(scene,M);
 for(const m of W.meshes)if(m.material===M.glow)m.castShadow=false;

 /* ---- water (tide) ---- */
 const wn=texWaterN();wn.repeat.set(18,18);
 const wmat=new THREE.MeshStandardMaterial({color:0x1f6a7c,roughness:.2,metalness:.05,transparent:true,opacity:.88,normalMap:wn,normalScale:new THREE.Vector2(.3,.3),envMapIntensity:.75});
 const water=new THREE.Mesh(new THREE.PlaneGeometry(260,240,1,1).rotateX(-Math.PI/2),wmat);water.position.set(0,0,90);water.receiveShadow=true;scene.add(water);W.water=water;W.wn=wn;
 // shoreline foam ring around the sandbar + beach line (thin translucent strips that ride the tide)
 const fm=new THREE.MeshBasicMaterial({color:0xfff6ea,transparent:true,opacity:.5,depthWrite:false});W.foamMat=fm;
 const foam=new THREE.Group();const strip=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0);const m=new THREE.Mesh(new THREE.PlaneGeometry(L,.45).rotateX(-Math.PI/2),fm);m.position.set((x0+x1)/2,0,(z0+z1)/2);m.rotation.y=-Math.atan2(z1-z0,x1-x0);foam.add(m);};
 strip(5,21.3,20,21.3);strip(5,27.8,20,27.8);strip(4.7,21.5,4.7,27.6);strip(20.3,21.5,20.3,27.6);strip(-22,11.2,-4,11.2);strip(14,2.6,14,16);strip(17,2.6,17,16);
 scene.add(foam);W.foam=foam;
 W.setTide=(y)=>{water.position.y=y;foam.position.y=y+.02;W.level=y;};W.setTide(-.5);

 /* ---- dig mounds (one hides the winch crank; positions fixed, the real one is chosen per run) ---- */
 const moundGeo=new THREE.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI/2);moundGeo.scale(.85,.42,.75);
 const holeGeo=new THREE.CircleGeometry(.62,16).rotateX(-Math.PI/2);
 const mMat=new THREE.MeshStandardMaterial({color:0xcaa36a,map:T.sand,roughness:.95}),hMat=new THREE.MeshStandardMaterial({color:0x4a3520,roughness:1});
 for(const[x,z]of[[-15.5,5.4],[-9.2,8.2],[-18.4,8.9]]){const y=heightAt(x,z);const g=new THREE.Group();g.position.set(x,y,z);const m=new THREE.Mesh(moundGeo,mMat);m.castShadow=m.receiveShadow=true;g.add(m);
  const hole=new THREE.Mesh(holeGeo,hMat);hole.position.y=.04;hole.visible=false;g.add(hole);const pile=new THREE.Mesh(moundGeo,mMat);pile.scale.set(.6,.7,.5);pile.position.set(.9,0,.2);pile.visible=false;g.add(pile);
  // pebble crosses on every mound (all mounds look alike); the flag marks the real one on EASY / NORMAL
  for(let k=0;k<4;k++){const pb=new THREE.Mesh(new THREE.IcosahedronGeometry(.07,0),new THREE.MeshStandardMaterial({color:0xe8e0d0,roughness:.6}));pb.position.set(Math.cos(k*1.57)*.25,.4,Math.sin(k*1.57)*.25);g.add(pb);}
  const flag=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.2,6),new THREE.MeshStandardMaterial({color:0xf4efe6}));pole.position.y=.6;flag.add(pole);
  const pen=new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new V(0,1.2,0),new V(.45,1.06,0),new V(0,.92,0)]),new THREE.MeshStandardMaterial({color:0xe8433a,side:THREE.DoubleSide,emissive:0x400800}));pen.geometry.computeVertexNormals();flag.add(pen);flag.position.set(-.55,0,-.3);flag.visible=false;g.add(flag);
  scene.add(g);W.mounds.push({x,z,y,g,mound:m,hole,pile,flag,pebbles:g.children.slice(3,7)});}
 /* ---- winch, motor, crank, the boat ---- */
 const wg=new THREE.Group();wg.position.copy(SPOTS.winch);scene.add(wg);const paint=c=>new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:.15});
 const add=(g,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
 add(wg,new THREE.BoxGeometry(2.2,.3,1.3),paint(0x3a4a58),0,.15,0);for(const s of[-1,1])add(wg,new THREE.BoxGeometry(.18,1.1,.9),paint(0x2f6d8a),s*.95,.85,0);
 const drum=add(wg,new THREE.CylinderGeometry(.42,.42,1.6,16).rotateZ(Math.PI/2),paint(0x8a6a4a),0,1,0);const rings=add(drum,new THREE.TorusGeometry(.43,.05,6,18).rotateY(Math.PI/2),paint(0xd0b070),.6,0,0);add(drum,new THREE.TorusGeometry(.43,.05,6,18).rotateY(Math.PI/2),paint(0xd0b070),-.6,0,0);
 const socket=add(wg,new THREE.CylinderGeometry(.12,.12,.2,10).rotateZ(Math.PI/2),paint(0x222222),-1.12,1,0);
 const crankW=new THREE.Group();crankW.position.set(-1.2,1,0);wg.add(crankW);add(crankW,new THREE.BoxGeometry(.08,.08,.7),paint(0xc8a040),-.05,0,.3);add(crankW,new THREE.CylinderGeometry(.06,.06,.4,8).rotateZ(Math.PI/2),paint(0xa83a2a),-.2,0,.62);crankW.visible=false;
 W.winch={g:wg,drum,crank:crankW,socket};
 const mg=new THREE.Group();mg.position.copy(SPOTS.motor);scene.add(mg);add(mg,new THREE.BoxGeometry(1.2,1,1),paint(0x5a6a3a),0,.5,0);add(mg,new THREE.CylinderGeometry(.35,.35,1.05,12).rotateZ(Math.PI/2),paint(0x3a3a3a),0,.62,0);
 const bulbMat=new THREE.MeshStandardMaterial({color:0x552222,emissive:0x220000,emissiveIntensity:1,roughness:.3});const bulb=add(mg,new THREE.SphereGeometry(.14,10,8),bulbMat,0,1.18,0);
 for(let k=0;k<3;k++)add(mg,new THREE.BoxGeometry(.06,.5,.9),paint(0x2a2a2a),-.45+k*.45,.62,0);
 const cable=add(mg,new THREE.CylinderGeometry(.04,.04,2.6,6).rotateZ(Math.PI/2),paint(0x1a1a1a),-1.3,.15,.4);
 W.motor={g:mg,bulb,bulbMat};
 // the Puffin: a little red-and-cream harbour boat
 const bg=new THREE.Group();scene.add(bg);const hull=new THREE.Group();bg.add(hull);
 const hullGeo=new THREE.SphereGeometry(1,20,10,0,Math.PI*2,Math.PI/2,Math.PI/2);hullGeo.scale(1.25,.9,2.7);add(hull,hullGeo,paint(0xc8433a),0,.75,0);
 add(hull,new THREE.CylinderGeometry(1,1,.4,20,1,true).scale(1.25,1,2.7),new THREE.MeshStandardMaterial({color:0xe6dccb,roughness:.7,side:THREE.DoubleSide}),0,.95,0);
 add(hull,new THREE.CylinderGeometry(1,1,.1,20).scale(1.16,1,2.6),paint(0xb98c62),0,.92,0);
 add(hull,new THREE.BoxGeometry(1.3,1,1.3),paint(0xd8cdb8),0,1.45,-.4);add(hull,new THREE.BoxGeometry(1.5,.12,1.5),paint(0x2f6d8a),0,2,-.4);
 const port=new THREE.MeshStandardMaterial({color:0xffe0a0,emissive:0xffb050,emissiveIntensity:.9});for(const s of[-1,1])add(hull,new THREE.CircleGeometry(.16,12).rotateY(s*Math.PI/2),port,s*.66,1.5,-.4);
 add(hull,new THREE.CylinderGeometry(.05,.06,2.6,6),paint(0x6a4a32),0,2.4,.7);add(hull,new THREE.BoxGeometry(.04,.5,.7),new THREE.MeshStandardMaterial({color:0xffd04a,side:THREE.DoubleSide}),0,3.35,.4);
 add(hull,new THREE.TorusGeometry(.28,.08,6,14).rotateY(Math.PI/2),paint(0xff7a3a),.0,1.45,.3).position.set(.67,1.35,.4);
 const bow=new THREE.Object3D();bow.position.set(0,1.05,2.55);hull.add(bow);add(hull,new THREE.TorusGeometry(.1,.03,6,10),paint(0xd0b070),0,1.05,2.62);
 W.boat={g:bg,hull,bow,port};
 /* ---- sky dome + sun ---- */
 const sunDir=new V(-.55,.2,.82).normalize();W.sunDir=sunDir;
 const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sd:{value:sunDir}},vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform vec3 sd;varying vec3 vD;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
  void main(){float y=vD.y;vec3 zen=vec3(.20,.27,.52),mid=vec3(.62,.46,.66),hor=vec3(1.,.66,.45);vec3 c=mix(hor,mid,smoothstep(0.,.22,y));c=mix(c,zen,smoothstep(.2,.75,y));
   float s=max(dot(vD,sd),0.);c+=vec3(1.,.55,.25)*pow(s,8.)*.4+vec3(1.,.85,.6)*pow(s,400.)*2.2;
   vec2 q=vD.xz/(y+.25)*2.;float cl=n(q*1.3)*.6+n(q*2.9)*.3+n(q*6.)*.1;cl=smoothstep(.55,.85,cl)*smoothstep(.02,.25,y)*(1.-smoothstep(.5,.9,y));
   c=mix(c,mix(vec3(1.,.72,.62),vec3(1.,.9,.75),pow(s,3.)),cl*.75);if(y<0.)c=mix(hor*.85,vec3(.25,.35,.45),smoothstep(0.,-.3,y));gl_FragColor=vec4(c,1.);}`});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),skyMat);sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);W.sky=sky;
 // env map for reflections (sky only)
 {const pm=new THREE.PMREMGenerator(R),es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),skyMat));const rt=pm.fromScene(es,.02);scene.environment=rt.texture;W.env=rt;}
 /* ---- gulls ---- */
 const gullGeo=new THREE.BufferGeometry();gullGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.5,.12,0,0,0,.1,0,0,-.1, .5,.12,0,0,0,-.1,0,0,.1],3));gullGeo.computeVertexNormals();
 const gm=new THREE.MeshBasicMaterial({color:0xf8f4ee,side:THREE.DoubleSide});for(let i=0;i<7;i++){const m=new THREE.Mesh(gullGeo,gm);scene.add(m);W.gulls.push({m,c:new V(-10+rr()*30,9+rr()*6,8+rr()*24),r:6+rr()*10,s:.25+rr()*.25,p:rr()*6.28});}
 W.update=(dt,t)=>{W.time=t;wn.offset.set(t*.012,t*.02);fm.opacity=.32+Math.sin(t*1.7)*.12;
  for(const g of W.gulls){const a=t*g.s+g.p;g.m.position.set(g.c.x+Math.cos(a)*g.r,g.c.y+Math.sin(a*2)*.6,g.c.z+Math.sin(a)*g.r);g.m.rotation.set(0,-a,0);g.m.scale.y=1+Math.sin(t*9+g.p)*.8;}};
 return W;}
