// STARSHIP SUSPECTS — the ship in 3D: floors, walls, hull, props, consoles, vents, doors, lights, fog-of-war mask, particles.
import * as THREE from '../vendor/three.module.min.js';
import * as M from './map.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a;
export const WALL_H=1.55;

/* ---------- helpers ---------- */
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.userData.canvas=c;return t;}
// merge [geometry, matrix, color] entries into one non-indexed geometry with vertex colours
export function merge(list){let n=0;const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;n+=g.attributes.position.count;return g;});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  const c=g.userData.c;if(c)for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));return r;}
const MX=(x=0,y=0,z=0,ry=0,sx=1,sy=1,sz=1,rx=0,rz=0)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const col=h=>new THREE.Color(h);

/* ---------- fog of war: a 2D visibility mask sampled by every ship / crew material ---------- */
const FS=8,FPAD=3;
export const FOG={canvas:null,ctx:null,tex:null,U:{uFog:{value:null},uFogO:{value:new THREE.Vector2(-FPAD,-FPAD)},uFogS:{value:new THREE.Vector2(M.MW+FPAD*2,M.MH+FPAD*2)},uFogOn:{value:1},uFogDim:{value:.13},uAlarm:{value:0},uTime:{value:0}}};
{const c=document.createElement('canvas');c.width=(M.MW+FPAD*2)*FS;c.height=(M.MH+FPAD*2)*FS;FOG.canvas=c;FOG.ctx=c.getContext('2d');FOG.tex=new THREE.CanvasTexture(c);FOG.tex.flipY=false;FOG.tex.colorSpace=THREE.NoColorSpace;FOG.tex.minFilter=THREE.LinearFilter;FOG.tex.generateMipmaps=false;FOG.U.uFog.value=FOG.tex;}
const polyBuf=[];
export function drawFog(x,z,R,fx,fz,cone,nearK,on){const g=FOG.ctx,W=FOG.canvas.width,H=FOG.canvas.height;FOG.U.uFogOn.value=on?1:0;if(!on)return;
 g.filter='none';g.globalCompositeOperation='source-over';g.fillStyle='#000';g.fillRect(0,0,W,H);
 const n=300,P=polyBuf;P.length=0;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);let r=R;if(cone){const d=dx*fx+dz*fz;r=R*(nearK+(1-nearK)*THREE.MathUtils.smoothstep(d,cone-.07,cone+.07));}
  const d=M.castRay(x,z,dx,dz,r);P.push((x+dx*Math.min(r,d+.08)+FPAD)*FS,(z+dz*Math.min(r,d+.08)+FPAD)*FS);}
 g.filter=`blur(${FS*.45}px)`;const gr=g.createRadialGradient((x+FPAD)*FS,(z+FPAD)*FS,0,(x+FPAD)*FS,(z+FPAD)*FS,R*FS);gr.addColorStop(0,'#fff');gr.addColorStop(.72,'#fff');gr.addColorStop(1,'#555');g.fillStyle=gr;
 g.beginPath();g.moveTo(P[0],P[1]);for(let i=2;i<P.length;i+=2)g.lineTo(P[i],P[i+1]);g.closePath();g.fill();g.filter='none';FOG.tex.needsUpdate=true;}
export function fogify(mat,o={}){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOG.U);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vFogXZ;').replace('#include <project_vertex>',`#include <project_vertex>
 {vec4 fwp=vec4(transformed,1.);vec3 fn=normal;
 #ifdef USE_INSTANCING
 fwp=instanceMatrix*fwp;fn=mat3(instanceMatrix)*fn;
 #endif
 fwp=modelMatrix*fwp;vec3 wn=normalize(mat3(modelMatrix)*fn);vFogXZ=fwp.xz+wn.xz*${(o.push??.38).toFixed(2)};}`);
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uFog;uniform vec2 uFogO,uFogS;uniform float uFogOn,uFogDim,uAlarm,uTime;varying vec2 vFogXZ;').replace('#include <opaque_fragment>',`
 {float fv=texture2D(uFog,(vFogXZ-uFogO)/uFogS).r;fv=mix(1.,fv,uFogOn);
  float lum=dot(outgoingLight,vec3(.3,.59,.11));vec3 mem=vec3(lum)*vec3(.55,.68,1.)*uFogDim;
  outgoingLight=mix(mem,outgoingLight,fv);
  outgoingLight+=vec3(.9,.05,.03)*uAlarm*(.5+.5*sin(uTime*5.))*.05*fv;}
 #include <opaque_fragment>`);};mat.customProgramCacheKey=()=>'fog'+(o.push??.38);return mat;}

/* ---------- textures ---------- */
function floorTex(){return ctex(512,512,(x,w,h)=>{x.fillStyle='#8c9097';x.fillRect(0,0,w,h);
 for(let i=0;i<9000;i++){const v=Math.random();x.fillStyle=v<.5?`rgba(0,0,0,${rnd(.07)})`:`rgba(255,255,255,${rnd(.05)})`;x.fillRect(rnd(w),rnd(h),1+rnd(2),1+rnd(2));}
 for(let i=0;i<40;i++){x.strokeStyle=`rgba(0,0,0,${.05+rnd(.08)})`;x.lineWidth=1;x.beginPath();const sx=rnd(w),sy=rnd(h);x.moveTo(sx,sy);x.lineTo(sx+rnd(60)-30,sy+rnd(60)-30);x.stroke();}
 x.strokeStyle='rgba(20,22,26,.85)';x.lineWidth=5;for(let i=0;i<=2;i++){x.beginPath();x.moveTo(i*256,0);x.lineTo(i*256,h);x.stroke();x.beginPath();x.moveTo(0,i*256);x.lineTo(w,i*256);x.stroke();}
 x.strokeStyle='rgba(255,255,255,.12)';x.lineWidth=2;for(let i=0;i<2;i++){x.beginPath();x.moveTo(i*256+4,0);x.lineTo(i*256+4,h);x.stroke();x.beginPath();x.moveTo(0,i*256+4);x.lineTo(w,i*256+4);x.stroke();}
 x.fillStyle='rgba(30,32,36,.9)';for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(const[u,v]of[[14,14],[242,14],[14,242],[242,242]]){x.beginPath();x.arc(a*256+u,b*256+v,4,0,7);x.fill();}
 x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;for(let a=0;a<2;a++)for(let b=0;b<2;b++){x.strokeRect(a*256+40,b*256+40,176,176);}});}
function roughTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#8a8a8a';x.fillRect(0,0,w,h);for(let i=0;i<3000;i++){const v=110+rnd(110)|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(rnd(w),rnd(h),1+rnd(4),1+rnd(4));}
 for(let i=0;i<14;i++){const g=x.createRadialGradient(rnd(w),rnd(h),0,rnd(w),rnd(h),20+rnd(50));g.addColorStop(0,'rgba(40,40,40,.5)');g.addColorStop(1,'rgba(40,40,40,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}},{srgb:false});}
function wallTex(){return ctex(512,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#7b828c');g.addColorStop(.5,'#9aa1ab');g.addColorStop(1,'#5d636c');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<4;i++){x.fillStyle='rgba(20,22,26,.85)';x.fillRect(i*128,0,5,h);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(i*128+5,0,2,h);}
 x.fillStyle='rgba(20,22,26,.6)';x.fillRect(0,h*.16,w,4);x.fillRect(0,h*.8,w,6);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(0,h*.16+4,w,2);
 for(let i=0;i<4;i++){x.fillStyle='rgba(30,34,40,.55)';x.fillRect(i*128+24,h*.3,80,h*.38);x.strokeStyle='rgba(255,255,255,.1)';x.strokeRect(i*128+24,h*.3,80,h*.38);
  for(let k=0;k<5;k++){x.fillStyle='rgba(15,16,20,.7)';x.fillRect(i*128+34,h*.34+k*16,60,5);}}
 for(let i=0;i<4000;i++){x.fillStyle=`rgba(0,0,0,${rnd(.06)})`;x.fillRect(rnd(w),rnd(h),2,2);}});}
function hullTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#23272e';x.fillRect(0,0,w,h);for(let i=0;i<60;i++){const s=10+rnd(60),sx=rnd(w),sy=rnd(h);x.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},255,${.02+rnd(.04)})`;x.fillRect(sx,sy,s,s*(.3+rnd(1)));x.strokeStyle='rgba(0,0,0,.4)';x.strokeRect(sx,sy,s,s*.6);}
 x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=3;x.strokeRect(0,0,w,h);x.beginPath();x.moveTo(w/2,0);x.lineTo(w/2,h);x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();});}
const SCREEN={wires:['#ffcf3f','WIRING'],swipe:['#64e1ff','CARD'],fuel:['#ff9a3c','FUEL'],shields:['#9f8bff','SHIELDS'],asteroids:['#ff5f6d','DEFENSE'],download:['#5cff9d','UPLINK'],align:['#ffb36b','THRUST'],scan:['#6cf7ff','SCAN'],fix:['#ff3b30','ALERT']};
function screenTex(type){const[c,label]=SCREEN[type]||SCREEN.fix;return ctex(256,160,(x,w,h)=>{x.fillStyle='#04070c';x.fillRect(0,0,w,h);x.strokeStyle=c;x.globalAlpha=.9;x.lineWidth=4;x.strokeRect(8,8,w-16,h-16);
 x.globalAlpha=.25;for(let i=0;i<h;i+=4){x.fillStyle=c;x.fillRect(0,i,w,1);}x.globalAlpha=1;x.fillStyle=c;x.font='bold 30px JetBrains Mono, monospace';x.textAlign='center';x.fillText(label,w/2,58);
 x.globalAlpha=.7;for(let i=0;i<6;i++){x.fillRect(30+i*34,130-(20+Math.random()*40),22,20+Math.random()*40);}x.globalAlpha=1;},{clamp:true});}
function windowTex(){return ctex(512,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#05061a');g.addColorStop(1,'#120624');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<3;i++){const n=x.createRadialGradient(rnd(w),rnd(h),0,rnd(w),rnd(h),120+rnd(80));n.addColorStop(0,`rgba(${120+rnd(100)|0},${40+rnd(60)|0},${180+rnd(70)|0},.35)`);n.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=n;x.fillRect(0,0,w,h);}
 for(let i=0;i<500;i++){const b=Math.random();x.fillStyle=`rgba(255,255,255,${.3+b*.7})`;x.fillRect(rnd(w),rnd(h),b>.97?2:1,b>.97?2:1);}
 const p=x.createRadialGradient(w*.72,h*.62,0,w*.72,h*.62,70);p.addColorStop(0,'#ffd9a0');p.addColorStop(.6,'#c4602a');p.addColorStop(1,'rgba(80,20,10,0)');x.fillStyle=p;x.beginPath();x.arc(w*.72,h*.62,70,0,7);x.fill();},{clamp:true});}

/* ---------- build ---------- */
export function buildShip(scene){const out={consoles:new Map(),vents:[],doors:[],roomLights:[],anim:[],taskMarks:new Map(),fixScreens:[]};
 const fT=floorTex(),rT=roughTex();fT.repeat.set(1,1);
 // floor: one quad per room / hallway, world-space UVs, vertex colour = room tint
 const fl=[];const quad=(x0,x1,z0,z1,c)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0);g.rotateX(-Math.PI/2);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++){uv.setXY(i,(p.getX(i)+(x0+x1)/2)/4,(p.getZ(i)+(z0+z1)/2)/4);}fl.push([g,MX((x0+x1)/2,0,(z0+z1)/2),c]);};
 M.ROOMS.forEach(r=>quad(r.r[0],r.r[1],r.r[2],r.r[3],col(r.floor)));M.HALLS.forEach(h=>quad(h[0],h[1],h[2],h[3],col(0x5a6170)));
 const floorMat=fogify(new THREE.MeshStandardMaterial({map:fT,roughnessMap:rT,roughness:.75,metalness:.55,vertexColors:true,envMapIntensity:.6}),{push:0});
 const floor=new THREE.Mesh(merge(fl),floorMat);floor.receiveShadow=true;scene.add(floor);out.floor=floor;
 // hazard stripes where hallways meet rooms + hallway guide lights
 const strip=[],guide=[];
 for(let r=0;r<M.ROOMS.length;r++)for(const s of M.doorSpans(r)){const vert=s.x1-s.x0===1&&s.z1-s.z0>1;for(let k=0;k<6;k++){const g=new THREE.PlaneGeometry(vert?.12:(s.x1-s.x0)/6*.5,vert?(s.z1-s.z0)/6*.5:.12);g.rotateX(-Math.PI/2);
   const t=(k+.5)/6;strip.push([g,MX(vert?(s.x0+s.x1)/2:s.x0+(s.x1-s.x0)*t,.012,vert?s.z0+(s.z1-s.z0)*t:(s.z0+s.z1)/2,0,1,1,1),col(0xffc23d)]);}}
 for(const h of M.HALLS){const w=h[1]-h[0],d=h[3]-h[2],along=w>d;const L=along?w:d;for(let i=1;i<L;i+=2){const g=new THREE.PlaneGeometry(along?.5:.08,along?.08:.5);g.rotateX(-Math.PI/2);for(const s of[-1,1]){const off=(along?d:w)/2-.25;guide.push([g.clone(),MX(along?h[0]+i:(h[0]+h[1])/2+s*off,.012,along?(h[2]+h[3])/2+s*off:h[2]+i),null]);}g.dispose();}}
 const stripM=fogify(new THREE.MeshStandardMaterial({color:0xffc23d,roughness:.6,emissive:0x3a2a00,vertexColors:true}),{push:0});scene.add(new THREE.Mesh(merge(strip),stripM));
 const guideM=fogify(new THREE.MeshBasicMaterial({color:new THREE.Color(.25,1.4,2.2)}),{push:0});const gm=new THREE.Mesh(merge(guide),guideM);scene.add(gm);out.guide=guideM;
 // walls: vertical faces between floor and non-floor cells, merged into runs
 const wall=[],trim=[],base=[];const isF=(x,z)=>x>=0&&z>=0&&x<M.MW&&z<M.MH&&M.floor[z*M.MW+x]===1;
 const roomTint=(x,z)=>{const r=M.roomAt(x,z);return r>=0?col(M.ROOMS[r].light):col(0x7fb2ff);};
 const face=(cx,cz,len,dir,tint)=>{// dir: 0=-z wall (north),1=+z,2=-x,3=+x ; (cx,cz)=centre of the face line
  const g=new THREE.PlaneGeometry(len,WALL_H);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len/2.6+(dir<2?cx:cz)/2.6);
  const ry=[0,Math.PI,Math.PI/2,-Math.PI/2][dir];wall.push([g,MX(cx,WALL_H/2,cz,ry),null]);
  const t=new THREE.BoxGeometry(len,.05,.05);trim.push([t,MX(cx,WALL_H-.1,cz,ry).multiply(MX(0,0,.03)),tint]);const b=new THREE.BoxGeometry(len,.035,.03);base.push([b,MX(cx,.12,cz,ry).multiply(MX(0,0,.02)),tint.clone().multiplyScalar(.5)]);};
 for(const[dx,dz,dir]of[[0,-1,0],[0,1,1],[-1,0,2],[1,0,3]]){
  if(dz){for(let z=0;z<M.MH;z++){let x=0;while(x<M.MW){if(isF(x,z)&&!isF(x,z+dz)){let e=x;while(e<M.MW&&isF(e,z)&&!isF(e,z+dz))e++;face((x+e)/2,dz<0?z:z+1,e-x,dir,roomTint(x,z));x=e;}else x++;}}}
  else{for(let x=0;x<M.MW;x++){let z=0;while(z<M.MH){if(isF(x,z)&&!isF(x+dx,z)){let e=z;while(e<M.MH&&isF(x,e)&&!isF(x+dx,e))e++;face(dx<0?x:x+1,(z+e)/2,e-z,dir,roomTint(x,z));z=e;}else z++;}}}}
 const wT=wallTex();const wallMat=fogify(new THREE.MeshStandardMaterial({map:wT,bumpMap:wT,bumpScale:.6,roughness:.62,metalness:.45,envMapIntensity:.5}));
 const walls=new THREE.Mesh(merge(wall),wallMat);walls.castShadow=walls.receiveShadow=true;scene.add(walls);
 const trimM=fogify(new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.2,2.2,2.2)}),{push:.6});out.trim=trimM;scene.add(new THREE.Mesh(merge(trim),trimM));
 const baseM=fogify(new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.2,1.2,1.2)}),{push:.6});scene.add(new THREE.Mesh(merge(base),baseM));
 // hull top over every non-floor cell (rooms look carved out of the ship)
 const hull=[];for(let z=-3;z<M.MH+3;z++){let x=-3;while(x<M.MW+3){if(!isF(x,z)){let e=x;while(e<M.MW+3&&!isF(e,z))e++;const g=new THREE.PlaneGeometry(e-x,1);g.rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){uv.setXY(i,(x+uv.getX(i)*(e-x))/3,(z+uv.getY(i))/3);}hull.push([g,MX((x+e)/2,WALL_H,z+.5),null]);x=e;}else x++;}}
 const hullMat=fogify(new THREE.MeshStandardMaterial({map:hullTex(),roughness:.7,metalness:.6,color:0x9aa3b0}),{push:0});const hm=new THREE.Mesh(merge(hull),hullMat);hm.receiveShadow=true;scene.add(hm);
 // navigation window (east wall)
 const win=new THREE.Mesh(new THREE.PlaneGeometry(9.6,WALL_H*.78),fogify(new THREE.MeshBasicMaterial({map:windowTex(),color:new THREE.Color(1.6,1.6,1.6)}),{push:.8}));win.position.set(69.98,WALL_H*.5,21);win.rotation.y=-Math.PI/2;scene.add(win);
 props(scene,out);
 // room lights
 M.ROOMS.forEach((r,i)=>{const w=r.r[1]-r.r[0],d=r.r[3]-r.r[2];const L=new THREE.PointLight(r.light,0,Math.max(w,d)*1.15,1.4);L.position.set(r.cx,4.6,r.cz);L.userData.base=(22+w*d*.22)*r.li;L.userData.col=col(r.light);scene.add(L);out.roomLights.push(L);
  // ceiling lamp glow disc
  const g=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({color:col(r.light).multiplyScalar(2.2),transparent:true,opacity:.0,depthWrite:false}));g.rotation.x=-Math.PI/2;g.position.set(r.cx,3.38,r.cz);});
 return out;}

/* ---------- props ---------- */
function props(scene,out){
 const metal=fogify(new THREE.MeshStandardMaterial({color:0x8c939e,roughness:.4,metalness:.8,vertexColors:true,envMapIntensity:.9}));
 const paint=fogify(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.2,vertexColors:true}));
 const glow=fogify(new THREE.MeshBasicMaterial({vertexColors:true}),{push:.2});
 const M_=[],P_=[],G_=[];const add=(arr,g,m,c)=>arr.push([g,m,c?col(c):null]);
 const cyl=(r,h,s=20)=>new THREE.CylinderGeometry(r,r,h,s),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
 for(const p of M.PROPS){const r=p.r,cx=(r[0]+r[1])/2,cz=(r[2]+r[3])/2,w=r[1]-r[0],d=r[3]-r[2];
  if(p.k==='table'){add(P_,cyl(.98,.08,32),MX(cx,.74,cz),0x7d8796);add(M_,cyl(.12,.7),MX(cx,.37,cz));add(M_,cyl(.5,.05,24),MX(cx,.03,cz));add(G_,new THREE.TorusGeometry(.98,.025,6,40),MX(cx,.74,cz,0,1,1,1,Math.PI/2),0x6fd8ff);
   for(let k=0;k<4;k++){const a=k/4*Math.PI*2+.4;add(P_,cyl(.22,.08,16),MX(cx+Math.cos(a)*1.35,.45,cz+Math.sin(a)*1.35),0x4a5160);add(M_,cyl(.05,.42,8),MX(cx+Math.cos(a)*1.35,.21,cz+Math.sin(a)*1.35));}}
  else if(p.k==='button'){add(M_,cyl(.62,.7,28),MX(cx,.35,cz),0x9aa3ad);add(P_,cyl(.66,.06,28),MX(cx,.72,cz),0x2a2f38);add(G_,cyl(.3,.08,24),MX(cx,.78,cz),0xff2a1a);
   const dome=new THREE.Mesh(new THREE.SphereGeometry(.42,24,12,0,Math.PI*2,0,Math.PI/2),fogify(new THREE.MeshStandardMaterial({color:0xbfe8ff,transparent:true,opacity:.22,roughness:.05,metalness:0,depthWrite:false})));dome.position.set(cx,.74,cz);scene.add(dome);
   const ring=new THREE.Mesh(new THREE.RingGeometry(1.15,1.5,48),fogify(new THREE.MeshStandardMaterial({map:ctex(256,32,(x,w,h)=>{for(let i=0;i<16;i++){x.fillStyle=i%2?'#111':'#f2b100';x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16+16,0);x.lineTo(i*16+8,h);x.lineTo(i*16-8,h);x.fill();}}),roughness:.7}),{push:0}));ring.rotation.x=-Math.PI/2;ring.position.set(cx,.013,cz);scene.add(ring);
   const bl=new THREE.PointLight(0xff3020,3,4,2);bl.position.set(cx,1.2,cz);scene.add(bl);out.buttonLight=bl;}
  else if(p.k==='bed'){add(M_,box(w*.8,.45,d*.9),MX(cx,.22,cz),0x9aa3ad);add(P_,box(w*.74,.14,d*.8),MX(cx,.52,cz+.05),0xe9f4f7);add(P_,box(w*.5,.1,.32),MX(cx,.62,cz-d*.33),0xffffff);add(G_,box(.5,.3,.04),MX(cx,1.15,r[2]+.04),0x5cffd5);}
  else if(p.k==='planter'){add(M_,box(w,.5,d*.9),MX(cx,.25,cz),0x5b6d5f);add(P_,box(w*.96,.04,d*.8),MX(cx,.51,cz),0x3b2a1e);
   for(let i=0;i<w*3;i++){const s=.18+rnd(.16);add(P_,new THREE.IcosahedronGeometry(s,0),MX(r[0]+.2+i/3,.56+s*.6,cz+rnd(.5)-.25,rnd(6),1,1.3,1),[0x2f9a4b,0x46b85c,0x6ad16e][i%3]);}
   add(G_,box(w*.9,.05,.12),MX(cx,1.45,cz),0xff4fd8);add(M_,cyl(.03,1,6),MX(r[0]+.2,.95,cz));add(M_,cyl(.03,1,6),MX(r[1]-.2,.95,cz));}
  else if(p.k==='helm'){add(M_,box(w*.9,.85,d),MX(cx,.42,cz),0x6f7884);add(G_,box(.04,.32,d*.86),MX(r[0]+.12,.9,cz,0,1,1,1,0,-.4),0x5fb7ff);
   for(let i=0;i<5;i++)add(G_,box(.05,.05,.3),MX(r[0]+.35,.86,r[2]+1+i,0),[0xff4040,0x40ff70,0xffd040][i%3]);}
  else if(p.k==='emitter'){add(M_,cyl(.85,.35,6),MX(cx,.17,cz),0x6a6f86);add(M_,cyl(.18,1.3,6),MX(cx,.9,cz));
   const core=new THREE.Mesh(new THREE.OctahedronGeometry(.42,0),new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,1,3.2)}));core.position.set(cx,1.25,cz);scene.add(core);out.anim.push(t=>{core.rotation.y=t*.8;core.position.y=1.25+Math.sin(t*1.7)*.07;});
   const L=new THREE.PointLight(0x9a7bff,4,6,2);L.position.set(cx,1.4,cz);scene.add(L);}
  else if(p.k==='rack'){for(let i=0;i<w;i++){add(M_,box(.9,1.35,d*.8),MX(r[0]+.5+i,.67,cz),0x3d434d);for(let k=0;k<6;k++)add(G_,box(.6,.03,.02),MX(r[0]+.5+i,.25+k*.18,r[2]+.18),k%2?0x43ffb0:0x2bd0ff);}
   add(M_,new THREE.SphereGeometry(.7,20,10,0,Math.PI*2,0,Math.PI/2.4),MX(cx,1.38,cz,0,1,1,1,-.5),0xc8ced8);}
  else if(p.k==='crate'){for(let i=0;i<w;i++)for(let k=0;k<d;k++){const h=.6+((i+k)%2)*.35;add(P_,box(.9,h,.9),MX(r[0]+.5+i,h/2,r[2]+.5+k,rnd(.2)-.1),[0x8a6a3d,0x6b7a4a,0x5a6170][(i+k)%3]);add(M_,box(.94,.06,.94),MX(r[0]+.5+i,h-.06,r[2]+.5+k),0x30343a);}}
  else if(p.k==='cabinet'){for(let k=0;k<d;k++){add(M_,box(.8,1.4,.9),MX(cx+.05,.7,r[2]+.5+k),0x4b5160);add(G_,box(.02,.5,.6),MX(cx+.46,.9,r[2]+.5+k),[0xffd23a,0x4dff88][k%2]);}}
  else if(p.k==='core'){add(M_,cyl(1.6,.4,32),MX(cx,.2,cz),0x59606c);add(M_,cyl(1.6,.3,32),MX(cx,2.6,cz),0x59606c);
   const coreMat=new THREE.ShaderMaterial({uniforms:{t:FOG.U.uTime,al:FOG.U.uAlarm},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float t,al;varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),1.6);float s=.5+.5*sin(vP.y*7.-t*4.+sin(atan(vP.x,vP.z)*3.+t)*1.5);vec3 c=mix(vec3(.2,.9,2.4),vec3(2.6,.3,.15),al);gl_FragColor=vec4(c*(.25+f*.9)*(.6+.6*s),1.);}'});
   const core=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,2.2,32,8,true),coreMat);core.position.set(cx,1.4,cz);scene.add(core);
   const inner=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,2.2,16),new THREE.MeshBasicMaterial({color:new THREE.Color(.9,2.2,3.2)}));inner.position.copy(core.position);scene.add(inner);out.coreInner=inner;
   for(let k=0;k<3;k++){const rg=new THREE.Mesh(new THREE.TorusGeometry(1.32,.06,8,40),metal);rg.position.set(cx,.7+k*.7,cz);rg.rotation.x=Math.PI/2;scene.add(rg);}
   const L=new THREE.PointLight(0x5fc8ff,10,9,1.6);L.position.set(cx,1.6,cz);scene.add(L);out.coreLight=L;}
  else if(p.k==='engine'){const g=new THREE.CylinderGeometry(1.35,1.5,d,28);g.rotateX(Math.PI/2);add(M_,g,MX(cx,1.15,cz),0x7d8590);
   const gr=new THREE.TorusGeometry(1.42,.08,8,40);add(G_,gr,MX(cx,1.15,r[2]+.3),0xff8a2a);add(G_,gr.clone(),MX(cx,1.15,r[3]-.3),0xff8a2a);
   const ex=new THREE.Mesh(new THREE.CircleGeometry(1.1,32),new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,.55,.14)}));ex.position.set(cx,1.15,r[3]+.02);scene.add(ex);out.anim.push(t=>{ex.material.color.setRGB(1.3+Math.sin(t*9)*.2,.5+Math.sin(t*7)*.08,.12);});
   const L=new THREE.PointLight(0xff8a3a,6,7,1.8);L.position.set(cx+2,1.4,cz+2);scene.add(L);}}
 // consoles for every station + fix panel
 const scr=new Map();const screenMat=type=>{if(!scr.has(type)){const m=fogify(new THREE.MeshBasicMaterial({map:screenTex(type),color:new THREE.Color(1.5,1.5,1.5)}),{push:.5});scr.set(type,m);}return scr.get(type);};
 const consoleAt=(st,type,fix)=>{if(!st.dx&&!st.dz){// floor pad (scanner)
   const pad=new THREE.Mesh(new THREE.CylinderGeometry(.75,.8,.08,32),metal);pad.position.set(st.x,.04,st.z);scene.add(pad);const ring=new THREE.Mesh(new THREE.TorusGeometry(.68,.04,8,40),new THREE.MeshBasicMaterial({color:new THREE.Color(.4,2,2.6)}));ring.rotation.x=Math.PI/2;ring.position.set(st.x,.1,st.z);scene.add(ring);out.consoles.set(st.id,{pos:new V(st.x,.1,st.z),ring});return;}
  const ang=Math.atan2(st.dx,st.dz);const cx=st.x+st.dx*.62,cz=st.z+st.dz*.62;
  add(M_,box(.9,.95,.42),MX(cx,.47,cz,ang),fix?0x6a5050:0x5a626e);
  const s=new THREE.Mesh(new THREE.PlaneGeometry(.72,.45),screenMat(type));s.position.set(cx-st.dx*.215,1.02,cz-st.dz*.215);s.rotation.set(0,ang+Math.PI,0);s.rotateX(-.45);scene.add(s);
  add(M_,box(.9,.06,.5),MX(cx-st.dx*.04,.98,cz-st.dz*.04,ang),0x2c3038);
  out.consoles.set(st.id,{pos:new V(cx,1.1,cz),screen:s,fix});};
 for(const st of M.STATIONS)consoleAt(st,st.type,false);
 for(const k in M.FIX)for(const st of M.FIX[k]){consoleAt(st,'fix',true);out.fixScreens.push(out.consoles.get(st.id));}
 // vents
 const ventTop=fogify(new THREE.MeshStandardMaterial({map:ctex(128,128,(x,w,h)=>{x.fillStyle='#2b3038';x.fillRect(0,0,w,h);x.fillStyle='#0b0c0f';for(let i=0;i<7;i++)x.fillRect(14,14+i*15,w-28,8);x.strokeStyle='#5d6570';x.lineWidth=6;x.strokeRect(3,3,w-6,h-6);}),roughness:.5,metalness:.8}),{push:0});
 for(const v of M.VENTS){add(M_,box(1.05,.06,.8),MX(v.x,.03,v.z),0x444b55);const lid=new THREE.Mesh(new THREE.PlaneGeometry(.9,.66),ventTop);lid.rotation.x=-Math.PI/2;const piv=new THREE.Group();piv.position.set(v.x,.065,v.z-.33);lid.position.set(0,0,.33);piv.add(lid);scene.add(piv);out.vents.push({v,piv,open:0,t:0});}
 // doors (two sliding halves per span)
 const doorMat=fogify(new THREE.MeshStandardMaterial({color:0xb0b7c2,roughness:.4,metalness:.75,map:ctex(128,128,(x,w,h)=>{x.fillStyle='#9aa1ab';x.fillRect(0,0,w,h);for(let i=0;i<8;i++){x.fillStyle=i%2?'#1b1b1b':'#e8b400';x.fillRect(0,i*16,w,8);}x.fillStyle='#7d848e';x.fillRect(0,20,w,88);x.fillStyle='#4a5058';x.fillRect(10,30,w-20,4);x.fillRect(10,94,w-20,4);})}));
 for(let r=0;r<M.ROOMS.length;r++)for(const s of M.doorSpans(r)){const vert=s.x1-s.x0===1&&s.z1-s.z0>1,len=vert?s.z1-s.z0:s.x1-s.x0,cx=(s.x0+s.x1)/2,cz=(s.z0+s.z1)/2;
  const halves=[];for(const sg of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(vert?.22:len/2,WALL_H,vert?len/2:.22),doorMat);m.castShadow=true;scene.add(m);halves.push({m,sg});}
  out.doors.push({room:r,vert,len,cx,cz,halves,k:0});}
 const mk=(arr,mat)=>{if(!arr.length)return;const m=new THREE.Mesh(merge(arr),mat);m.castShadow=m.receiveShadow=true;scene.add(m);return m;};
 mk(M_,metal);mk(P_,paint);const gl=mk(G_,glow);if(gl){gl.castShadow=false;}
 // task beacons (chevrons over the player's own stations)
 const chev=new THREE.ConeGeometry(.16,.3,4);chev.rotateX(Math.PI);const bm=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1.9,.3)});
 for(const[id,c]of out.consoles){const m=new THREE.Mesh(chev,bm);m.position.copy(c.pos).add(new V(0,.9,0));m.visible=false;scene.add(m);out.taskMarks.set(id,m);}}

/* ---------- environment map for metal reflections ---------- */
export function makeEnv(R){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.03,.035,.05),vec3(.12,.14,.2),smoothstep(-.3,.6,h));gl_FragColor=vec4(c,1.);}'})));
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const m=new THREE.Mesh(new THREE.PlaneGeometry(10,1.5),new THREE.MeshBasicMaterial({color:new THREE.Color(3,3.1,3.4),side:THREE.DoubleSide}));m.position.set(Math.cos(a)*20,14,Math.sin(a)*20);m.lookAt(0,0,0);s.add(m);}
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}

/* ---------- particles ---------- */
export class Particles{constructor(scene,n=2000){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.i=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
   vertexShader:'attribute float size;uniform float uScale;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC*a,1.);}'}));this.pts.frustumCulled=false;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;}
 burst(p,n,speed,c,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.up)dy=Math.abs(dy)*(o.up===2?2:1);const s=speed*(.35+Math.random()*.65);const cc=Array.isArray(c)?c[Math.random()*c.length|0]:c;this.emit(p.x,p.y,p.z,dx*s,dy*s,dz*s,cc.r,cc.g,cc.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-1.6*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;if(p[i*3+1]<.03&&g[i]>0){p[i*3+1]=.03;v[i*3+1]*=-.35;}
   const f=k*k;c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f;c[i*3+2]=oc[i*3+2]*f;s[i]=os[i]*(.4+.6*k);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

/* ---------- eject scene: open space outside the airlock ---------- */
export function buildSpace(){const s=new THREE.Scene();s.background=new THREE.Color(0x02030a);
 const n=3000,pos=new Float32Array(n*3),cl=new Float32Array(n*3);for(let i=0;i<n;i++){const r=60+Math.random()*120,a=Math.random()*Math.PI*2,b=Math.acos(Math.random()*2-1);pos[i*3]=r*Math.sin(b)*Math.cos(a);pos[i*3+1]=r*Math.cos(b);pos[i*3+2]=r*Math.sin(b)*Math.sin(a)-40;const w=.6+Math.random()*1.4;cl[i*3]=w*(.8+Math.random()*.2);cl[i*3+1]=w*.9;cl[i*3+2]=w;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(cl,3));
 const dot=ctex(32,32,(x,w)=>{const gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'rgba(255,255,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);},{clamp:true});
 const stars=new THREE.Points(g,new THREE.PointsMaterial({size:.9,map:dot,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,sizeAttenuation:true}));s.add(stars);
 const neb=new THREE.Mesh(new THREE.PlaneGeometry(260,140),new THREE.MeshBasicMaterial({map:windowTex(),transparent:true,opacity:.55,depthWrite:false}));neb.position.set(0,0,-150);s.add(neb);
 const planet=new THREE.Mesh(new THREE.SphereGeometry(22,48,24),new THREE.MeshStandardMaterial({color:0x6a3a2a,roughness:.9,emissive:0x1a0802}));planet.position.set(46,-30,-90);s.add(planet);
 s.add(new THREE.AmbientLight(0x404a70,.6));const sun=new THREE.DirectionalLight(0xffe2c0,3);sun.position.set(-30,20,30);s.add(sun);
 const hull=new THREE.Mesh(new THREE.BoxGeometry(10,30,14),new THREE.MeshStandardMaterial({color:0x5a616c,metalness:.7,roughness:.5,map:hullTex()}));hull.position.set(-15,0,-6);s.add(hull);
 const lock=new THREE.Mesh(new THREE.TorusGeometry(2.2,.18,12,40),new THREE.MeshBasicMaterial({color:new THREE.Color(1.3,.45,.15)}));lock.position.set(-9.9,0,-2);lock.rotation.y=Math.PI/2;s.add(lock);
 const cam=new THREE.PerspectiveCamera(46,1,.1,600);cam.position.set(0,1,9);cam.lookAt(0,0,0);return{scene:s,cam,stars};}
