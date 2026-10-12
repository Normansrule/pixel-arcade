// STARSHIP SUSPECTS — the ship in 3D: themed floors, pastel walls, hull silhouette over open space, room props,
// consoles, vents, doors, lights, the fog-of-war mask and particles. Everything is procedural (no image files).
import * as THREE from '../vendor/three.module.min.js';
import * as M from './map.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a;
export const WALL_H=1.7;

/* ---------- helpers ---------- */
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.userData.canvas=c;return t;}
// merge [geometry, matrix, color] entries into one non-indexed geometry with vertex colours
export function merge(list){let n=0;const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;n+=g.attributes.position.count;return g;});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  const c=g.userData.c;if(c)for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));return r;}
export const MX=(x=0,y=0,z=0,ry=0,sx=1,sy=1,sz=1,rx=0,rz=0)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const col=h=>h instanceof THREE.Color?h:new THREE.Color(h);
const pastel=(h,k=.72)=>col(h).clone().lerp(new THREE.Color(1,1,1),k);

/* ---------- fog of war: a 2D visibility mask sampled by every ship / crew material ---------- */
const FS=8,FPAD=4;
export const FOG={canvas:null,ctx:null,tex:null,U:{uFog:{value:null},uFogO:{value:new THREE.Vector2(-FPAD,-FPAD)},uFogS:{value:new THREE.Vector2(M.MW+FPAD*2,M.MH+FPAD*2)},uFogOn:{value:1},uFogDim:{value:.5},uAlarm:{value:0},uTime:{value:0}}};
{const c=document.createElement('canvas');c.width=(M.MW+FPAD*2)*FS;c.height=(M.MH+FPAD*2)*FS;FOG.canvas=c;FOG.ctx=c.getContext('2d');FOG.tex=new THREE.CanvasTexture(c);FOG.tex.flipY=false;FOG.tex.colorSpace=THREE.NoColorSpace;FOG.tex.minFilter=THREE.LinearFilter;FOG.tex.generateMipmaps=false;FOG.U.uFog.value=FOG.tex;}
const polyBuf=[];
export function drawFog(x,z,R,fx,fz,cone,nearK,on){const g=FOG.ctx,W=FOG.canvas.width,H=FOG.canvas.height;FOG.U.uFogOn.value=on?1:0;if(!on)return;
 g.filter='none';g.globalCompositeOperation='source-over';g.fillStyle='#000';g.fillRect(0,0,W,H);
 const n=240,P=polyBuf;P.length=0;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);let r=R;if(cone){const d=dx*fx+dz*fz;r=R*(nearK+(1-nearK)*THREE.MathUtils.smoothstep(d,cone-.07,cone+.07));}
  const d=M.castRay(x,z,dx,dz,r);P.push((x+dx*Math.min(r,d+.1)+FPAD)*FS,(z+dz*Math.min(r,d+.1)+FPAD)*FS);}
 g.filter=`blur(${FS*.45}px)`;const gr=g.createRadialGradient((x+FPAD)*FS,(z+FPAD)*FS,0,(x+FPAD)*FS,(z+FPAD)*FS,R*FS);gr.addColorStop(0,'#fff');gr.addColorStop(.75,'#fff');gr.addColorStop(1,'#666');g.fillStyle=gr;
 g.beginPath();g.moveTo(P[0],P[1]);for(let i=2;i<P.length;i+=2)g.lineTo(P[i],P[i+1]);g.closePath();g.fill();g.filter='none';FOG.tex.needsUpdate=true;}
// outside the player's sight the ship stays readable but desaturated and cooler ("memory")
export function fogify(mat,o={}){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOG.U);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vFogXZ;').replace('#include <project_vertex>',`#include <project_vertex>
 {vec4 fwp=vec4(transformed,1.);vec3 fn=normal;
 #ifdef USE_INSTANCING
 fwp=instanceMatrix*fwp;fn=mat3(instanceMatrix)*fn;
 #endif
 fwp=modelMatrix*fwp;vec3 wn=normalize(mat3(modelMatrix)*fn);vFogXZ=fwp.xz+wn.xz*${(o.push??.38).toFixed(2)};}`);
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uFog;uniform vec2 uFogO,uFogS;uniform float uFogOn,uFogDim,uAlarm,uTime;varying vec2 vFogXZ;').replace('#include <opaque_fragment>',`
 {float fv=texture2D(uFog,(vFogXZ-uFogO)/uFogS).r;fv=mix(1.,fv,uFogOn);
  float lum=dot(outgoingLight,vec3(.3,.59,.11));vec3 mem=mix(vec3(lum),outgoingLight,.35)*vec3(.62,.7,.92)*uFogDim;
  outgoingLight=mix(mem,outgoingLight,fv);
  outgoingLight+=vec3(1.,.08,.05)*uAlarm*(.5+.5*sin(uTime*5.))*.08;}
 #include <opaque_fragment>`);};mat.customProgramCacheKey=()=>'fog'+(o.push??.38);return mat;}

/* ---------- textures ---------- */
function noise(x,w,h,n,a,dark=true){for(let i=0;i<n;i++){x.fillStyle=(dark&&Math.random()<.6)?`rgba(0,0,0,${rnd(a)})`:`rgba(255,255,255,${rnd(a)})`;x.fillRect(rnd(w),rnd(h),1+rnd(2),1+rnd(2));}}
function rivets(x,pts,c='rgba(60,70,90,.55)'){x.fillStyle=c;for(const[u,v]of pts){x.beginPath();x.arc(u,v,3.5,0,7);x.fill();}}
const PAT={
 tile(x,w,h){const n=4,s=w/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){x.fillStyle=(i+j)%2?'#f7eedd':'#ead2ad';x.fillRect(i*s,j*s,s,s);}
  noise(x,w,h,5000,.05);x.strokeStyle='#c9ad86';x.lineWidth=4;for(let i=0;i<=n;i++){x.beginPath();x.moveTo(i*s,0);x.lineTo(i*s,h);x.stroke();x.beginPath();x.moveTo(0,i*s);x.lineTo(w,i*s);x.stroke();}
  x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=2;for(let i=0;i<n;i++)for(let j=0;j<n;j++)x.strokeRect(i*s+5,j*s+5,s-10,s-10);},
 deck(x,w,h){x.fillStyle='#d6dfec';x.fillRect(0,0,w,h);noise(x,w,h,4000,.05);const s=w/2;for(let i=0;i<2;i++)for(let j=0;j<2;j++){const g=x.createLinearGradient(i*s,j*s,i*s+s,j*s+s);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(120,140,170,.18)');x.fillStyle=g;x.fillRect(i*s+6,j*s+6,s-12,s-12);
   rivets(x,[[i*s+16,j*s+16],[i*s+s-16,j*s+16],[i*s+16,j*s+s-16],[i*s+s-16,j*s+s-16]]);}
  x.strokeStyle='#8e9cb4';x.lineWidth=5;for(let i=0;i<=2;i++){x.beginPath();x.moveTo(i*s,0);x.lineTo(i*s,h);x.stroke();x.beginPath();x.moveTo(0,i*s);x.lineTo(w,i*s);x.stroke();}
  x.fillStyle='rgba(79,163,255,.35)';x.fillRect(0,h/2-6,w,12);},
 plank(x,w,h){const n=8,s=h/n;for(let j=0;j<n;j++){const off=(j%3)*w/3;for(let k=-1;k<3;k++){x.fillStyle=['#dda873','#cf9864','#e4b582','#d39e69'][(j+k+4)%4];x.fillRect(off+k*w/2,j*s,w/2,s);
   x.strokeStyle='rgba(120,70,30,.18)';x.lineWidth=1.5;for(let g=0;g<4;g++){x.beginPath();const y=j*s+4+rnd(s-8);x.moveTo(off+k*w/2,y);x.bezierCurveTo(off+k*w/2+60,y+rnd(6)-3,off+k*w/2+150,y+rnd(6)-3,off+k*w/2+w/2,y);x.stroke();}
   x.fillStyle='#8a5a32';x.fillRect(off+k*w/2,j*s,3,s);}x.fillStyle='#9a6638';x.fillRect(0,j*s,w,3);}noise(x,w,h,3000,.05);},
 star(x,w,h){x.fillStyle='#b9b0ea';x.fillRect(0,0,w,h);noise(x,w,h,9000,.07);
  for(let i=0;i<46;i++){const u=rnd(w),v=rnd(h),r=3+rnd(7);x.fillStyle=`rgba(255,250,255,${.5+rnd(.4)})`;x.beginPath();for(let k=0;k<8;k++){const a=k/8*Math.PI*2,rr=k%2?r*.35:r;x.lineTo(u+Math.cos(a)*rr,v+Math.sin(a)*rr);}x.fill();}
  x.strokeStyle='rgba(130,110,210,.4)';x.lineWidth=3;x.strokeRect(0,0,w,h);},
 moss(x,w,h){x.fillStyle='#86bf6c';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){x.fillStyle=Math.random()<.5?`rgba(40,110,40,${rnd(.25)})`:`rgba(200,255,150,${rnd(.2)})`;x.fillRect(rnd(w),rnd(h),1.5,2+rnd(4));}
  const s=w/4;for(let i=0;i<4;i++)for(let j=0;j<4;j++){if((i*3+j)%5===0)continue;x.fillStyle='#e7dfc6';x.beginPath();x.roundRect(i*s+10+rnd(6),j*s+10+rnd(6),s-24,s-24,18);x.fill();x.fillStyle='rgba(0,0,0,.07)';x.beginPath();x.roundRect(i*s+14,j*s+s-22,s-30,8,4);x.fill();}
  noise(x,w,h,2500,.05);},
 hex(x,w,h){x.fillStyle='#a6dcd5';x.fillRect(0,0,w,h);const r=w/8,hh=r*Math.sqrt(3);for(let j=-1;j<h/hh+1;j++)for(let i=-1;i<w/(r*1.5)+1;i++){const cx=i*r*1.5,cy=j*hh+(i%2?hh/2:0);x.beginPath();for(let k=0;k<6;k++){const a=k/6*Math.PI*2;x.lineTo(cx+Math.cos(a)*(r-3),cy+Math.sin(a)*(r-3));}x.closePath();x.fillStyle=(i*7+j*3)%9===0?'#cdeee9':'#e4efee';x.fill();}
  noise(x,w,h,3000,.04);},
 grate(x,w,h){x.fillStyle='#bdb4aa';x.fillRect(0,0,w,h);noise(x,w,h,5000,.06);const s=32;for(let j=0;j<h/s;j++)for(let i=0;i<w/s;i++){x.save();x.translate(i*s+s/2,j*s+s/2);x.rotate((i+j)%2?.7:-.7);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(-9,-2.5,18,5);x.fillStyle='rgba(60,50,40,.25)';x.fillRect(-9,2.5,18,2);x.restore();}
  x.strokeStyle='#7d736a';x.lineWidth=5;x.strokeRect(0,0,w,h);x.beginPath();x.moveTo(w/2,0);x.lineTo(w/2,h);x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();},
 hazard(x,w,h){x.fillStyle='#d9cfb8';x.fillRect(0,0,w,h);for(let i=0;i<14;i++){const g=x.createRadialGradient(rnd(w),rnd(h),0,rnd(w),rnd(h),40+rnd(70));g.addColorStop(0,'rgba(120,100,70,.18)');g.addColorStop(1,'rgba(120,100,70,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}
  noise(x,w,h,7000,.07);x.fillStyle='#f2b21f';x.fillRect(0,0,w,10);x.fillRect(0,0,10,h);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,10,w,2);},
 grate2(x,w,h){x.fillStyle='#d3cfae';x.fillRect(0,0,w,h);noise(x,w,h,4000,.06);for(let j=0;j<16;j++)for(let i=0;i<16;i++){x.fillStyle='rgba(70,70,40,.35)';x.fillRect(i*32+9,j*32+9,14,14);x.fillStyle='rgba(255,255,230,.4)';x.fillRect(i*32+9,j*32+23,14,2);}
  x.strokeStyle='#8a8460';x.lineWidth=6;x.strokeRect(0,0,w,h);},
 carpet(x,w,h){x.fillStyle='#f4bcd2';x.fillRect(0,0,w,h);noise(x,w,h,12000,.06);for(let j=0;j<8;j++)for(let i=0;i<8;i++){x.fillStyle=(i+j)%2?'rgba(255,255,255,.35)':'rgba(255,120,170,.22)';x.beginPath();x.arc(i*64+32,j*64+32,(i+j)%2?9:5,0,7);x.fill();}},
 hall(x,w,h){x.fillStyle='#c9d0dc';x.fillRect(0,0,w,h);noise(x,w,h,5000,.05);const s=w/4;x.strokeStyle='#97a2b4';x.lineWidth=4;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*s,0);x.lineTo(i*s,h);x.stroke();}x.lineWidth=2;for(let j=0;j<=4;j++){x.beginPath();x.moveTo(0,j*s);x.lineTo(w,j*s);x.stroke();}
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)rivets(x,[[i*s+12,j*s+12],[i*s+s-12,j*s+s-12]],'rgba(80,90,110,.4)');},
};
function wallTex(){return ctex(512,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#ffffff');g.addColorStop(.55,'#eef1f6');g.addColorStop(1,'#c9d0dc');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<4;i++){x.fillStyle='rgba(120,130,150,.55)';x.fillRect(i*128,0,4,h);x.fillStyle='rgba(255,255,255,.8)';x.fillRect(i*128+4,0,2,h);
  x.fillStyle='rgba(150,160,180,.18)';x.beginPath();x.roundRect(i*128+18,h*.2,92,h*.5,10);x.fill();x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=2;x.stroke();
  for(let k=0;k<3;k++){x.fillStyle='rgba(110,120,140,.35)';x.beginPath();x.roundRect(i*128+30,h*.3+k*18,68,6,3);x.fill();}}
 x.fillStyle='rgba(90,100,120,.45)';x.fillRect(0,h*.84,w,h*.16);x.fillStyle='rgba(255,255,255,.5)';x.fillRect(0,h*.84,w,2);noise(x,w,h,2500,.035);});}
function hullTex(){return ctex(512,512,(x,w,h)=>{x.fillStyle='#8592a8';x.fillRect(0,0,w,h);
 for(let i=0;i<8;i++)for(let j=0;j<8;j++){const v=Math.random()*18-9|0;x.fillStyle=`rgb(${133+v},${146+v},${168+v})`;x.fillRect(i*64+2,j*64+2,60,60);}
 for(let i=0;i<18;i++){const sx=(rnd(8)|0)*64,sy=(rnd(8)|0)*64,sw=64*(1+(rnd(2)|0)),sh=64*(1+(rnd(2)|0));x.fillStyle=Math.random()<.5?'rgba(255,255,255,.12)':'rgba(30,40,60,.12)';x.fillRect(sx+3,sy+3,sw-6,sh-6);}
 x.strokeStyle='rgba(40,50,70,.55)';x.lineWidth=3;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,h);x.stroke();x.beginPath();x.moveTo(0,i*64);x.lineTo(w,i*64);x.stroke();}
 x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=1.5;for(let i=0;i<8;i++){x.beginPath();x.moveTo(i*64+3,0);x.lineTo(i*64+3,h);x.stroke();}
 for(let i=0;i<10;i++){const sx=rnd(w-60),sy=rnd(h-30);x.fillStyle='rgba(40,48,64,.5)';x.beginPath();x.roundRect(sx,sy,46,22,5);x.fill();x.fillStyle='rgba(20,26,36,.6)';for(let k=0;k<4;k++)x.fillRect(sx+6+k*10,sy+5,5,12);}
 noise(x,w,h,6000,.06);});}
function spaceTex(){return ctex(1024,1024,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#141a52');g.addColorStop(.5,'#0d1238');g.addColorStop(1,'#1d0f44');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(const[c,n]of[['rgba(255,110,200,.20)',4],['rgba(90,170,255,.22)',5],['rgba(120,255,220,.10)',3]])for(let i=0;i<n;i++){const u=rnd(w),v=rnd(h),r=180+rnd(260);for(const[du,dv]of[[0,0],[w,0],[-w,0],[0,h],[0,-h]]){const n2=x.createRadialGradient(u+du,v+dv,0,u+du,v+dv,r);n2.addColorStop(0,c);n2.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=n2;x.fillRect(0,0,w,h);}}
 for(let i=0;i<2200;i++){const b=Math.random();x.fillStyle=`rgba(${220+rnd(35)|0},${220+rnd(35)|0},255,${.35+b*.65})`;const s=b>.985?3:b>.9?2:1;x.fillRect(rnd(w),rnd(h),s,s);}
 for(let i=0;i<30;i++){const u=rnd(w),v=rnd(h);const gr=x.createRadialGradient(u,v,0,u,v,9);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(u-9,v-9,18,18);}});}
function windowTex(){return ctex(256,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#1d2a78');g.addColorStop(1,'#3a1a6a');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<2;i++){const n=x.createRadialGradient(rnd(w),rnd(h),0,rnd(w),rnd(h),90);n.addColorStop(0,'rgba(255,140,220,.4)');n.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=n;x.fillRect(0,0,w,h);}
 for(let i=0;i<160;i++){const b=Math.random();x.fillStyle=`rgba(255,255,255,${.4+b*.6})`;x.fillRect(rnd(w),rnd(h),b>.95?2:1,b>.95?2:1);}
 x.fillStyle='rgba(255,255,255,.18)';x.beginPath();x.moveTo(30,0);x.lineTo(70,0);x.lineTo(20,h);x.lineTo(-20,h);x.fill();
 x.strokeStyle='#e9eef6';x.lineWidth=10;x.strokeRect(0,0,w,h);x.strokeStyle='#9aa6ba';x.lineWidth=3;x.strokeRect(6,6,w-12,h-12);},{clamp:true});}
// console screens: one per task type (and an alert panel for repairs)
const SCREEN={cook:['#ff9a3c','RATIONS'],trash:['#ff7ab8','TIDY'],stars:['#b59bff','STARS'],beacon:['#ffd23a','BEACON'],radio:['#5cf2d6','RADIO'],water:['#7dff6a','SPROUTS'],mix:['#4fe3ff','SAMPLE'],pipes:['#4fa3ff','COOLANT'],crates:['#ffb020','CARGO'],scan:['#6cf7ff','GRAVITY'],fix:['#ff3b30','REPAIR']};
function screenTex(type){const[c,label]=SCREEN[type]||SCREEN.fix;return ctex(256,160,(x,w,h)=>{x.fillStyle='#0b1424';x.fillRect(0,0,w,h);const g=x.createRadialGradient(w/2,h/2,10,w/2,h/2,150);g.addColorStop(0,c+'55');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.strokeStyle=c;x.lineWidth=6;x.beginPath();x.roundRect(8,8,w-16,h-16,14);x.stroke();x.fillStyle=c;x.font='bold 30px JetBrains Mono, monospace';x.textAlign='center';x.fillText(label,w/2,62);
 x.globalAlpha=.8;if(type==='fix'){x.font='bold 54px JetBrains Mono, monospace';x.fillText('!',w/2,130);}else for(let i=0;i<6;i++){const hh=14+((i*37+label.length*11)%40);x.beginPath();x.roundRect(36+i*32,132-hh,20,hh,4);x.fill();}x.globalAlpha=1;},{clamp:true});}

/* ---------- materials shared by props ---------- */
function mats(){return{
 paint:fogify(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.62,metalness:.05,vertexColors:true})),
 metal:fogify(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.42,metalness:.5,vertexColors:true,envMapIntensity:.8})),
 glow:fogify(new THREE.MeshBasicMaterial({vertexColors:true}),{push:.2}),
 glass:fogify(new THREE.MeshStandardMaterial({color:0xcfefff,roughness:.1,metalness:0,transparent:true,opacity:.18,depthWrite:false,envMapIntensity:.6}),{push:.2}),
};}

/* ---------- build ---------- */
export function buildShip(scene){const out={consoles:new Map(),vents:[],doors:[],roomLights:[],anim:[],taskMarks:new Map(),fixScreens:[],pads:[]};
 const isF=(x,z)=>x>=0&&z>=0&&x<M.MW&&z<M.MH&&M.floor[z*M.MW+x]===1;
 // ---- floors: one merged mesh per pattern, world-space UVs (1 texture tile = 4 units)
 const byPat={};const quad=(x0,x1,z0,z1,pat,c)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0);g.rotateX(-Math.PI/2);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++){uv.setXY(i,(p.getX(i)+(x0+x1)/2)/4,-(p.getZ(i)+(z0+z1)/2)/4);}(byPat[pat]=byPat[pat]||[]).push([g,MX((x0+x1)/2,0,(z0+z1)/2),c]);};
 M.ROOMS.forEach(r=>quad(r.r[0],r.r[1],r.r[2],r.r[3],r.pat,col(r.floor)));
 for(const h of M.HALLS){// hall cells that are not inside a room
  quad(h[0],h[1],h[2],h[3],'hall',col(0xffffff));}
 for(const pat in byPat){const t=ctex(512,512,PAT[pat]);const m=fogify(new THREE.MeshStandardMaterial({map:t,roughness:pat==='deck'||pat==='grate'||pat==='grate2'||pat==='hall'?.5:.78,metalness:pat==='deck'||pat==='grate'||pat==='grate2'||pat==='hall'?.25:0,vertexColors:true,envMapIntensity:.6,polygonOffset:pat==='hall',polygonOffsetFactor:1,polygonOffsetUnits:1}),{push:0});
  const mesh=new THREE.Mesh(merge(byPat[pat]),m);mesh.receiveShadow=true;if(pat==='hall')mesh.position.y=-.004;scene.add(mesh);}
 // ---- floor decals: hazard stripes at doorways, hallway guide lights, rugs
 const P_=[],MT=[],G_=[],GL=[];const add=(arr,g,m,c)=>arr.push([g,m,c==null?null:col(c)]);
 for(let r=0;r<M.ROOMS.length;r++)for(const s of M.doorSpans(r)){const vert=s.x1-s.x0===1&&s.z1-s.z0>1;const len=vert?s.z1-s.z0:s.x1-s.x0;for(let k=0;k<len*3;k++){const g=new THREE.PlaneGeometry(vert?.5:.16,vert?.16:.5);g.rotateX(-Math.PI/2);
   const t=(k+.5)/(len*3);add(P_,g,MX(vert?(s.x0+s.x1)/2:s.x0+(s.x1-s.x0)*t,.012,vert?s.z0+(s.z1-s.z0)*t:(s.z0+s.z1)/2,vert?0:0,1,1,1,0,0),k%2?0x2a2d36:0xffc23d);}}
 for(const h of M.HALLS){const w=h[1]-h[0],d=h[3]-h[2],along=w>d;const L=along?w:d;for(let i=1;i<L;i+=2){for(const s of[-1,1]){const g=new THREE.PlaneGeometry(along?.55:.1,along?.1:.55);g.rotateX(-Math.PI/2);const off=(along?d:w)/2-.18;add(G_,g,MX(along?h[0]+i:(h[0]+h[1])/2+s*off,.014,along?(h[2]+h[3])/2+s*off:h[2]+i),new THREE.Color(.5,1.6,2.4));}}}
 // ---- walls: vertical faces between floor and non-floor cells, merged into runs; trim + baseboard tinted by room accent
 const wall=[],trim=[],base=[],windows=[];
 const roomOf=(x,z)=>M.roomAt(x,z);
 const face=(cx,cz,len,dir,ri,outX,outZ)=>{const tint=ri>=0?pastel(M.ROOMS[ri].acc,.82):col(0xe2e8f2),acc=ri>=0?col(M.ROOMS[ri].acc):col(0x6fb8ff);
  const g=new THREE.PlaneGeometry(len,WALL_H);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len/2.6+(dir<2?cx:cz)/2.6);
  const ry=[0,Math.PI,Math.PI/2,-Math.PI/2][dir];wall.push([g,MX(cx,WALL_H/2,cz,ry),tint]);
  trim.push([new THREE.BoxGeometry(len,.07,.05),MX(cx,WALL_H-.16,cz,ry).multiply(MX(0,0,.03)),acc.clone().multiplyScalar(1.8)]);
  base.push([new THREE.BoxGeometry(len,.16,.06),MX(cx,.08,cz,ry).multiply(MX(0,0,.03)),acc.clone().lerp(new THREE.Color(.2,.22,.28),.45)]);
  // windows on thick outer hull walls of rooms
  if(ri>=0&&len>=2.5&&M.ROOMS[ri].id!=='gal'){let thick=true;const a0=Math.round((dir<2?cx:cz)-len/2);
   for(let k=1;k<=3&&thick;k++)for(let t=0;t<len;t++){const o=dir<2?(outZ<0?cz-k:cz+k-1):(outX<0?cx-k:cx+k-1);const sx=dir<2?a0+t:o,sz=dir<2?o:a0+t;if(isF(sx,sz)){thick=false;break;}}
   if(thick){const n=Math.max(1,Math.floor(len/3.2));for(let k=0;k<n;k++){const off=(k+.5)/n*len-len/2;const wx=dir<2?cx+off:cx,wz=dir<2?cz:cz+off;
    if([...M.STATIONS,...Object.values(M.FIX).flat()].some(s=>Math.hypot(s.x-wx,s.z-wz)<1.5))continue;windows.push([new THREE.PlaneGeometry(1.7,.82),MX(wx,WALL_H*.55,wz,ry).multiply(MX(0,0,.02)),null]);}}}};
 for(const[dx,dz,dir]of[[0,-1,0],[0,1,1],[-1,0,2],[1,0,3]]){
  if(dz){for(let z=0;z<M.MH;z++){let x=0;while(x<M.MW){if(isF(x,z)&&!isF(x,z+dz)){const ri=roomOf(x,z);let e=x;while(e<M.MW&&isF(e,z)&&!isF(e,z+dz)&&roomOf(e,z)===ri)e++;face((x+e)/2,dz<0?z:z+1,e-x,dir,ri,0,dz);x=e;}else x++;}}}
  else{for(let x=0;x<M.MW;x++){let z=0;while(z<M.MH){if(isF(x,z)&&!isF(x+dx,z)){const ri=roomOf(x,z);let e=z;while(e<M.MH&&isF(x,e)&&!isF(x+dx,e)&&roomOf(x,e)===ri)e++;face(dx<0?x:x+1,(z+e)/2,e-z,dir,ri,dx,0);z=e;}else z++;}}}}
 const wT=wallTex();const wallMat=fogify(new THREE.MeshStandardMaterial({map:wT,roughness:.7,metalness:.05,vertexColors:true}));
 const walls=new THREE.Mesh(merge(wall),wallMat);walls.castShadow=walls.receiveShadow=true;scene.add(walls);
 const trimM=fogify(new THREE.MeshBasicMaterial({vertexColors:true,color:0xffffff}),{push:.6});out.trim=trimM;scene.add(new THREE.Mesh(merge(trim),trimM));
 scene.add(new THREE.Mesh(merge(base),fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.3}),{push:.6})));
 if(windows.length){const wm=new THREE.Mesh(merge(windows),fogify(new THREE.MeshBasicMaterial({map:windowTex(),color:new THREE.Color(1.25,1.25,1.35)}),{push:.8}));scene.add(wm);}
 // ---- hull roof: non-floor cells near the ship (silhouette) plus enclosed pockets; open space beyond
 const PAD=6,GW=M.MW+PAD*2,GH=M.MH+PAD*2,hullC=new Uint8Array(GW*GH);
 const outside=new Uint8Array(GW*GH);{const st=[0];outside[0]=1;while(st.length){const i=st.pop(),x=i%GW,z=i/GW|0;for(const[ax,az]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+ax,nz=z+az;if(nx<0||nz<0||nx>=GW||nz>=GH)continue;const j=nz*GW+nx;if(outside[j]||isF(nx-PAD,nz-PAD))continue;outside[j]=1;st.push(j);}}}
 for(let z=0;z<GH;z++)for(let x=0;x<GW;x++){const wx=x-PAD,wz=z-PAD;if(isF(wx,wz))continue;let near=!outside[z*GW+x];for(let a=-2;a<=2&&!near;a++)for(let b=-2;b<=2;b++)if(isF(wx+a,wz+b)){near=true;break;}if(near)hullC[z*GW+x]=1;}
 const hull=[],edge=[];for(let z=0;z<GH;z++){let x=0;while(x<GW){if(hullC[z*GW+x]){let e=x;while(e<GW&&hullC[z*GW+e])e++;const x0=x-PAD,x1=e-PAD,zz=z-PAD;const g=new THREE.PlaneGeometry(x1-x0,1);g.rotateX(-Math.PI/2);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(p.getX(i)+(x0+x1)/2)/4,-(p.getZ(i)+zz+.5)/4);hull.push([g,MX((x0+x1)/2,WALL_H,zz+.5),null]);x=e;}else x++;}}
 // hull outer edge: a skirt down the side plus a glowing rim
 for(let z=0;z<GH;z++)for(let x=0;x<GW;x++){if(!hullC[z*GW+x])continue;for(const[ax,az,dir]of[[0,-1,0],[0,1,1],[-1,0,2],[1,0,3]]){const nx=x+ax,nz=z+az;const o=nx<0||nz<0||nx>=GW||nz>=GH||(!hullC[nz*GW+nx]&&!isF(nx-PAD,nz-PAD));if(!o)continue;
  const cx=x-PAD+.5+ax*.5,cz=z-PAD+.5+az*.5,ry=[Math.PI,0,-Math.PI/2,Math.PI/2][dir];const g=new THREE.PlaneGeometry(1,2.4);edge.push([g,MX(cx,WALL_H-1.2,cz,ry),col(0x5d6880)]);G_.push([new THREE.BoxGeometry(1,.06,.06),MX(cx,WALL_H-.02,cz,ry),new THREE.Color(.6,1.4,2.2)]);}}
 {let sd=7;const rr=()=>(sd=(sd*16807)%2147483647)/2147483647;for(let z=0;z<GH;z++)for(let x=0;x<GW;x++){if(!hullC[z*GW+x]||rr()>.05)continue;const c=rr()<.5?new THREE.Color(.4,1.6,2.4):new THREE.Color(2.4,1.3,.3);G_.push([new THREE.BoxGeometry(.16,.05,.16),MX(x-PAD+.5,WALL_H+.02,z-PAD+.5),c]);}}
 const hullMat=fogify(new THREE.MeshStandardMaterial({map:hullTex(),roughness:.55,metalness:.35,color:0xd4dbe6,envMapIntensity:.8}),{push:0});const hm=new THREE.Mesh(merge(hull),hullMat);hm.receiveShadow=true;scene.add(hm);
 scene.add(new THREE.Mesh(merge(edge),fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.4,side:THREE.DoubleSide}),{push:0})));
 // open space far below the hull: stars, nebula, a ringed planet
 const sp=spaceTex();sp.repeat.set(3,3);const spaceM=new THREE.Mesh(new THREE.PlaneGeometry(360,360),new THREE.MeshBasicMaterial({map:sp,color:new THREE.Color(1.1,1.1,1.2)}));spaceM.rotation.x=-Math.PI/2;spaceM.position.set(M.MW/2,-26,M.MH/2);scene.add(spaceM);out.space=spaceM;
 const planet=new THREE.Mesh(new THREE.SphereGeometry(9,40,24),new THREE.MeshStandardMaterial({color:0xff9a6a,roughness:.8,emissive:0x40160a}));planet.position.set(-14,-18,52);scene.add(planet);
 const ring=new THREE.Mesh(new THREE.RingGeometry(12,17,64),new THREE.MeshBasicMaterial({color:new THREE.Color(1.1,.85,.7),transparent:true,opacity:.55,side:THREE.DoubleSide}));ring.position.copy(planet.position);ring.rotation.x=-1.2;ring.rotation.y=.3;scene.add(ring);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(4,30,18),new THREE.MeshStandardMaterial({color:0x9fd4ff,roughness:.7,emissive:0x0a2040}));moon.position.set(84,-20,-10);scene.add(moon);
 out.anim.push(t=>{planet.rotation.y=t*.02;});
 props(scene,out,{P_,MT,G_,GL,add});
 // ---- room lights (no shadows: the sun light handles those)
 M.ROOMS.forEach((r,i)=>{const w=r.r[1]-r.r[0],d=r.r[3]-r.r[2];const L=new THREE.PointLight(r.light,0,Math.max(w,d)*1.25,1.2);L.position.set(r.cx,4.2,r.cz);L.userData.base=(4+w*d*.022)*r.li;L.userData.col=col(r.light);scene.add(L);out.roomLights.push(L);});
 return out;}

/* ---------- props ---------- */
function props(scene,out,A){const{P_,MT,G_,GL,add}=A;const K=mats();
 const cyl=(r,h,s=18,r2=r)=>new THREE.CylinderGeometry(r,r2,h,s),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z),sph=(r,a=16,b=10)=>new THREE.SphereGeometry(r,a,b);
 const room=id=>M.ROOMS[M.RI[id]];
 const plant=(x,z,s=1,pot=0xff8a5c)=>{add(P_,cyl(.22*s,.36*s,14,.17*s),MX(x,.18*s,z),pot);add(P_,cyl(.24*s,.05*s,14),MX(x,.37*s,z),0x6b4a30);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;add(P_,sph(.16*s,10,8),MX(x+Math.cos(a)*.12*s,.55*s+k%2*.08*s,z+Math.sin(a)*.12*s,0,1,1.25,1),[0x4fd16a,0x37b158,0x6fe07a][k%3]);}add(P_,sph(.15*s,10,8),MX(x,.72*s,z),0x5ad46a);};
 const stool=(x,z,c)=>{add(MT,cyl(.04,.42,8),MX(x,.21,z),0x9aa3b4);add(P_,cyl(.2,.08,16),MX(x,.45,z),c);};
 const STOOL=[0xff6b5e,0x4fa3ff,0xffd23a,0x4fd16a,0xb27bff,0xff7ab8];
 for(const p of M.PROPS){const r=p.r,cx=(r[0]+r[1])/2,cz=(r[2]+r[3])/2,w=r[1]-r[0],d=r[3]-r[2];
  if(p.k==='table'){add(P_,cyl(.95,.1,32),MX(cx,.74,cz),0xe8edf5);add(G_,new THREE.TorusGeometry(.95,.03,6,40),MX(cx,.74,cz,0,1,1,1,Math.PI/2),new THREE.Color(1.8,1.2,.6));add(MT,cyl(.1,.7,10),MX(cx,.36,cz),0xb7c0cf);add(MT,cyl(.45,.06,20),MX(cx,.03,cz),0x9aa3b4);
   for(let k=0;k<3;k++){const a=k/3*Math.PI*2+cx;add(P_,cyl(.16,.04,16),MX(cx+Math.cos(a)*.55,.81,cz+Math.sin(a)*.55),0xf2f6ff);add(P_,sph(.07,8,6),MX(cx+Math.cos(a)*.55,.86,cz+Math.sin(a)*.55),[0xff6b5e,0xffd23a,0x7dd36a][k]);}
   add(P_,cyl(.13,.16,12,.1),MX(cx,.86,cz),0x4fa3ff);
   for(let k=0;k<4;k++){const a=k/4*Math.PI*2+.4;stool(cx+Math.cos(a)*1.35,cz+Math.sin(a)*1.35,STOOL[(k+Math.round(cx))%6]);}}
  else if(p.k==='button'){add(MT,cyl(.62,.66,28,.72),MX(cx,.33,cz),0xdfe5ef);add(P_,cyl(.68,.08,28),MX(cx,.68,cz),0x2a2f3a);add(P_,cyl(.5,.05,28),MX(cx,.73,cz),0xffd23a);
   const btn=new THREE.Mesh(new THREE.SphereGeometry(.34,28,14,0,Math.PI*2,0,Math.PI/2),fogify(new THREE.MeshStandardMaterial({color:0xff2a1a,emissive:0xff1a0a,emissiveIntensity:.9,roughness:.25})));btn.position.set(cx,.74,cz);btn.scale.y=.7;scene.add(btn);out.button=btn;
   const dome=new THREE.Mesh(new THREE.SphereGeometry(.46,24,12,0,Math.PI*2,0,Math.PI/2),K.glass);dome.position.set(cx,.74,cz);scene.add(dome);
   const ring=new THREE.Mesh(new THREE.RingGeometry(1.25,1.6,48),fogify(new THREE.MeshStandardMaterial({map:ctex(256,32,(x,w,h)=>{for(let i=0;i<16;i++){x.fillStyle=i%2?'#20232b':'#ffc23d';x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16+16,0);x.lineTo(i*16+8,h);x.lineTo(i*16-8,h);x.fill();}}),roughness:.7}),{push:0}));ring.rotation.x=-Math.PI/2;ring.position.set(cx,.016,cz);scene.add(ring);
   // big round rug under the gathering spot
   const rug=new THREE.Mesh(new THREE.CircleGeometry(3.6,48),fogify(new THREE.MeshStandardMaterial({map:ctex(256,256,(x,w,h)=>{x.fillStyle='#ff9a5c';x.fillRect(0,0,w,h);for(let i=0;i<5;i++){x.strokeStyle=['#ffd23a','#fff1d6','#ff6b5e','#ffd23a','#fff1d6'][i];x.lineWidth=8;x.beginPath();x.arc(128,128,124-i*14,0,7);x.stroke();}noise(x,w,h,3000,.08);},{clamp:true}),roughness:.95}),{push:0}));rug.rotation.x=-Math.PI/2;rug.position.set(cx,.008,cz);scene.add(rug);}
  else if(p.k==='counter'){add(P_,box(w,.86,d*.95),MX(cx,.43,cz+.02),0xfff4e4);add(P_,box(w+.04,.07,d+.06),MX(cx,.89,cz),0xff8a3d);
   for(let k=0;k<w;k++){add(P_,box(.85,.6,.04),MX(r[0]+.5+k,.42,r[3]+.0),0xf2e0c4);add(MT,box(.3,.04,.04),MX(r[0]+.5+k,.62,r[3]+.03),0x9aa3b4);}
   if(cx<33){add(MT,cyl(.18,.24,14),MX(r[0]+1,1.05,cz),0xc8ced8);add(MT,cyl(.2,.14,14),MX(r[0]+2.2,1,cz),0x3a3f4a);add(P_,sph(.12),MX(r[0]+3.2,1,cz),0xffd23a);add(P_,sph(.1),MX(r[0]+3.4,1,cz+.1),0xff6b5e);}
   else{add(MT,box(.5,.5,.4),MX(r[0]+.8,1.17,cz),0x3a3f4a);add(G_,box(.18,.08,.02),MX(r[0]+.8,1.25,cz+.21),new THREE.Color(.4,2,1));add(P_,cyl(.07,.16,10),MX(r[0]+2,1.01,cz),0xffffff);add(P_,cyl(.07,.16,10),MX(r[0]+2.25,1.01,cz),0x4fa3ff);
    add(P_,box(.9,1.9,.9),MX(r[1]-.5,.95,cz-.05),0xe9f1ff);add(MT,box(.04,.6,.06),MX(r[1]-.85,1.2,cz+.42),0x9aa3b4);}}
  else if(p.k==='chair'){add(P_,box(1.1,.4,.9),MX(cx,.4,cz),0x4fa3ff);add(P_,box(1.1,.9,.2),MX(cx,.85,cz+.42),0x3a7fd0);add(MT,cyl(.08,.3,10),MX(cx,.15,cz),0x9aa3b4);add(P_,box(.2,.25,.8),MX(cx-.6,.68,cz),0x2f5f9a);add(P_,box(.2,.25,.8),MX(cx+.6,.68,cz),0x2f5f9a);}
  else if(p.k==='rack'){add(MT,box(.8,1.5,d*.95),MX(cx,.75,cz),0x5a6474);for(let k=0;k<d*2;k++){add(G_,box(.02,.06,.25),MX(r[1]-.01,.35+(k%4)*.3,r[2]+.4+(k>>1)*.9),[new THREE.Color(.4,2,1),new THREE.Color(2,1.6,.3),new THREE.Color(2,.4,.3)][k%3]);add(MT,cyl(.06,.04,10),MX(r[1]+.0,.6+(k%3)*.3,r[2]+.6+(k>>1)*.8,0,1,1,1,0,Math.PI/2),0xdfe5ef);}}
  else if(p.k==='scope'){add(MT,cyl(.9,.3,24,1.1),MX(cx,.15,cz),0xb7a6ef);add(MT,cyl(.18,1.1,12),MX(cx,.8,cz),0x8f84c6);
   const tube=new THREE.Group();tube.position.set(cx,1.35,cz);const tm=new THREE.Mesh(new THREE.CylinderGeometry(.32,.42,2.4,20),fogify(new THREE.MeshStandardMaterial({color:0xf4f0ff,roughness:.3,metalness:.4})));tm.rotation.z=1.05;tube.add(tm);
   const lens=new THREE.Mesh(new THREE.CircleGeometry(.3,20),new THREE.MeshBasicMaterial({color:new THREE.Color(.8,1.4,2.6)}));lens.position.set(1.04,.6,0);lens.rotation.y=Math.PI/2;lens.rotation.x=-1.05+Math.PI/2;tube.add(lens);
   const band=new THREE.Mesh(new THREE.TorusGeometry(.4,.05,8,24),fogify(new THREE.MeshStandardMaterial({color:0xa77bff,roughness:.4})));band.rotation.y=Math.PI/2;band.rotation.x=1.05;tube.add(band);tube.traverse(o=>{if(o.isMesh)o.castShadow=true;});
   scene.add(tube);out.anim.push(t=>{tube.rotation.y=Math.sin(t*.15)*1.4;});
   for(const[bx,bz,c]of[[52.6,8.6,0xff7ab8],[52.8,5.2,0x4fa3ff]])add(P_,sph(.45,14,10),MX(bx,.28,bz,0,1,.6,1),c);}
  else if(p.k==='globe'){add(MT,cyl(.3,.6,14,.4),MX(cx,.3,cz),0x8f84c6);const gl=new THREE.Mesh(new THREE.SphereGeometry(.5,24,16),new THREE.MeshBasicMaterial({map:spaceTex(),color:new THREE.Color(1.4,1.4,1.6)}));gl.position.set(cx,1.1,cz);scene.add(gl);out.anim.push(t=>{gl.rotation.y=t*.4;});add(G_,new THREE.TorusGeometry(.62,.025,6,40),MX(cx,1.1,cz,0,1,1,1,1.2),new THREE.Color(1.6,1.2,2.6));}
  else if(p.k==='bed'){add(P_,box(w*.98,.42,d*.9),MX(cx,.21,cz),0xc98b5c);add(P_,box(w*.94,.06,d*.78),MX(cx,.43,cz),0x5b3a24);
   for(let k=0;k<w*2;k++){const x=r[0]+.25+k*.5,s=.7+((k*7)%5)*.08;const kind=k%4;
    if(kind===0){add(P_,sph(.2*s,10,8),MX(x,.6,cz,0,1,1.3,1),0x4fd16a);add(P_,sph(.09,8,6),MX(x,.85,cz),0xff6b5e);}
    else if(kind===1){add(P_,cyl(.03,.5,6),MX(x,.68,cz),0x3fa34f);add(P_,sph(.12,10,8),MX(x,.95,cz),0xffd23a);}
    else if(kind===2){for(let q=0;q<3;q++)add(P_,sph(.13,8,6),MX(x+(q-1)*.1,.55,cz+(q%2-.5)*.15,0,1,1.6,1),0x2fbf5c);}
    else{add(P_,cyl(.02,.4,6),MX(x,.62,cz),0x3fa34f);add(P_,sph(.11,8,6),MX(x,.84,cz),0xb27bff);add(P_,sph(.08,8,6),MX(x+.08,.72,cz+.06),0xff7ab8);}}
   for(let k=0;k<3;k++)add(G_,box(.5,.04,.12),MX(r[0]+1.2+k*3,1.7,cz),new THREE.Color(2.2,.9,2));}
  else if(p.k==='tree'){add(P_,cyl(1.05,.5,24,1.15),MX(cx,.25,cz),0xd98c5f);add(P_,cyl(.18,1.6,10,.26),MX(cx,1.1,cz),0x8a5a32);for(let k=0;k<7;k++){const a=k/7*Math.PI*2;add(P_,sph(.55,14,10),MX(cx+Math.cos(a)*.55,2+Math.sin(k*2.1)*.25,cz+Math.sin(a)*.55),[0x4fd16a,0x3fb85a,0x6fe07a][k%3]);}add(P_,sph(.6,14,10),MX(cx,2.4,cz),0x5ad46a);
   for(let k=0;k<6;k++){const a=k*1.7;add(P_,sph(.09,8,6),MX(cx+Math.cos(a)*.75,1.9+k%3*.2,cz+Math.sin(a)*.75),0xff6b5e);}}
  else if(p.k==='tanks'){for(let k=0;k<d;k++){const z=r[2]+.5+k;add(MT,cyl(.42,.2,18),MX(cx-.05,.1,z),0x9aa3b4);add(MT,cyl(.42,.14,18),MX(cx-.05,1.5,z),0x9aa3b4);
    const liq=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,1.1,18),new THREE.MeshBasicMaterial({color:[new THREE.Color(.15,1.,.75),new THREE.Color(.95,.25,1.1),new THREE.Color(.25,.7,1.3)][k%3]}));liq.position.set(cx-.05,.78,z);scene.add(liq);
    const gl=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,1.26,18,1,true),K.glass);gl.position.copy(liq.position);scene.add(gl);out.anim.push(t=>{liq.scale.y=.85+.1*Math.sin(t*1.3+k);liq.position.y=.72+.055*Math.sin(t*1.3+k);});}}
  else if(p.k==='bench'){add(P_,box(w,.08,d*.9),MX(cx,.86,cz),0xbfe3e0);add(MT,box(w*.95,.82,d*.8),MX(cx,.42,cz),0x9aa6b8);
   for(let k=0;k<5;k++){const x=r[0]+.4+k*.55;add(K.glassArr||P_,cyl(.07,.24,10,.12),MX(x,1.02,cz-.2+(k%2)*.3),0xe9fbff);add(G_,cyl(.06,.1,10,.1),MX(x,.96,cz-.2+(k%2)*.3),[new THREE.Color(.3,2,1),new THREE.Color(2,.5,1.6),new THREE.Color(2,1.6,.3)][k%3]);}
   add(MT,box(.3,.06,.4),MX(r[1]-.5,.92,cz),0x3a3f4a);add(MT,cyl(.05,.5,8),MX(r[1]-.5,1.2,cz-.1,0,1,1,1,.3),0x3a3f4a);add(MT,cyl(.08,.2,10),MX(r[1]-.5,1.45,cz),0x3a3f4a);}
  else if(p.k==='core'){add(MT,cyl(1.7,.36,32,1.9),MX(cx,.18,cz),0x8a93a6);add(MT,new THREE.TorusGeometry(1.0,.36,10,40),MX(cx,1.62,cz,0,1,1,.45,Math.PI/2),0x5d6680);add(G_,new THREE.TorusGeometry(1.36,.05,6,40),MX(cx,1.66,cz,0,1,1,1,Math.PI/2),new THREE.Color(1.6,.9,.3));
   const coreMat=new THREE.ShaderMaterial({uniforms:{t:FOG.U.uTime,al:FOG.U.uAlarm},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float t,al;varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),1.6);float s=.5+.5*sin(vP.y*7.-t*4.+sin(atan(vP.x,vP.z)*3.+t)*1.5);vec3 c=mix(vec3(1.,.55,.18),vec3(1.6,.15,.08),al);gl_FragColor=vec4(c*(.25+f*.8)*(.6+.6*s),1.);}'});
   const core=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,1.25,32,6,true),coreMat);core.position.set(cx,.98,cz);scene.add(core);
   const inner=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,1.25,16),new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,.95,.4)}));inner.position.copy(core.position);scene.add(inner);out.coreInner=inner;
   for(let k=0;k<3;k++){const rg=new THREE.Mesh(new THREE.TorusGeometry(1.32,.07,8,40),K.metal);rg.geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(rg.geometry.attributes.position.count*3).fill(.8),3));rg.position.set(cx,.55+k*.42,cz);rg.rotation.x=Math.PI/2;scene.add(rg);out.anim.push(t=>{rg.rotation.z=t*(k%2?.6:-.4);});}
   // pipes along the engine-room walls
   const er=room('eng').r;for(const z of[er[2]+.25])for(let x=er[0]+.5;x<er[1];x+=1){if(x>30&&x<36)continue;add(MT,cyl(.12,1.0,10),MX(x,.9,z+.05,0,1,1,1,0,Math.PI/2),0xd98c5f);}
   add(MT,cyl(.14,er[3]-er[2]-.6,10),MX(er[0]+.2,.5,(er[2]+er[3])/2,0,1,1,1,Math.PI/2),0xd98c5f);add(MT,cyl(.14,er[3]-er[2]-.6,10),MX(er[1]-.2,.5,(er[2]+er[3])/2,0,1,1,1,Math.PI/2),0x4fa3ff);
   for(const[gx,gz]of[[er[0]+.15,40.2],[er[1]-.15,43.2]]){add(P_,cyl(.22,.06,18),MX(gx,1.1,gz,0,1,1,1,0,Math.PI/2),0xf2f6ff);add(G_,box(.02,.02,.16),MX(gx+(gx<33?.04:-.04),1.12,gz,0,1,1,1,.6),new THREE.Color(2.4,.4,.3));}}
  else if(p.k==='crate'){for(let i=0;i<w;i++)for(let k=0;k<d;k++){const h=.62+((i*3+k)%3)*.25;const c=[0xd99a4e,0x6fb3d9,0x7fc96a,0xe86a5c,0xb08ad9][(i+k*2+r[0])%5];add(P_,box(.92,h,.92),MX(r[0]+.5+i,h/2,r[2]+.5+k,((i+k)%3-1)*.06),c);
    add(P_,box(.95,.07,.95),MX(r[0]+.5+i,h-.05,r[2]+.5+k,((i+k)%3-1)*.06),col(c).clone().multiplyScalar(.7));add(P_,box(.95,.07,.95),MX(r[0]+.5+i,.08,r[2]+.5+k,((i+k)%3-1)*.06),col(c).clone().multiplyScalar(.7));
    if((i+k)%2===0)add(P_,box(.5,.3,.5),MX(r[0]+.5+i,h+.15,r[2]+.5+k,.3),0xf2e0c4);}}
  else if(p.k==='gen'){add(MT,box(w*.95,1.2,d*.9),MX(cx,.6,cz),0x7a8496);add(P_,box(w*.97,.12,d*.92),MX(cx,1.24,cz),0xffe03d);
   for(let k=0;k<4;k++)add(G_,box(.04,.5,.3),MX(r[1]-.05,.6,r[2]+.6+k*.95),k%2?new THREE.Color(2.4,2,.3):new THREE.Color(.4,2.2,1));
   const fan=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.08,6),fogify(new THREE.MeshStandardMaterial({color:0x3a3f4a,roughness:.4,metalness:.6})));fan.position.set(cx,1.34,cz);scene.add(fan);out.anim.push(t=>{fan.rotation.y=t*6;});
   for(let k=0;k<5;k++)add(P_,cyl(.05,1.6,6),MX(r[1]+.8,.04,r[2]+.6+k*.7,0,1,1,1,0,Math.PI/2),[0xff6b5e,0x4fa3ff,0xffd23a][k%3]);}
  else if(p.k==='cabinet'){for(let k=0;k<d;k++){add(MT,box(.82,1.45,.9),MX(cx+.05,.72,r[2]+.5+k),0x8a93a6);add(G_,box(.02,.08,.5),MX(cx+.47,1.15,r[2]+.5+k),k%3?new THREE.Color(.4,2.2,1):new THREE.Color(2.4,1.8,.2));add(P_,box(.02,.5,.6),MX(cx+.47,.6,r[2]+.5+k),0xffe03d);}}
  else if(p.k==='bunk'){const blanket=[0x4fa3ff,0xff7ab8,0xffd23a][(r[0]+r[2])%3];for(const y of[.32,1.12]){add(MT,box(w,.1,d*.92),MX(cx,y,cz),0xc8ced8);add(P_,box(w*.94,.18,d*.84),MX(cx,y+.14,cz),0xffffff);add(P_,box(w*.66,.06,d*.86),MX(cx+w*.16,y+.25,cz),y>1?pastel(blanket,.2):blanket);add(P_,box(.5,.14,d*.6),MX(r[0]+.4,y+.3,cz),0xfff6fa);}
   for(const x of[r[0]+.05,r[1]-.05])for(const z of[r[2]+.08,r[3]-.08])add(MT,box(.08,1.5,.08),MX(x,.75,z),0x9aa3b4);
   if(r[2]<6)add(P_,sph(.16,10,8),MX(r[1]-.6,1.55,cz),0xc98b5c);}
  else if(p.k==='locker'){for(let k=0;k<d;k++){add(MT,box(.85,1.6,.92),MX(cx,.8,r[2]+.5+k),[0x4fa3ff,0xff7ab8,0x4fd16a,0xffd23a][k%4]);for(let q=0;q<3;q++)add(P_,box(.02,.04,.4),MX(cx-.43,1.25+q*.08,r[2]+.5+k),0x2a2f3a);}}
 }
 // ---- extra dressing per room (not blocking)
 const gr=room('gal').r;plant(gr[0]+.5,gr[2]+1.5,1.1);plant(gr[1]-.5,gr[3]-.5,1.1,0x4fa3ff);plant(gr[0]+.5,gr[3]-.5,1,0xffd23a);
 const bn=room('bnk').r;add(P_,new THREE.CircleGeometry(1.5,32).rotateX(-Math.PI/2),MX(12,.01,9),0xffe9f2);plant(bn[0]+.5,bn[3]-.6,.9,0xff7ab8);
 const br=room('brg').r;for(let k=0;k<3;k++)add(P_,box(1.2,.7,.5),MX(br[0]+.8,.35,br[2]+2.5+k*1.4,0),0x5a6474);add(G_,box(.04,.3,.36),MX(br[0]+1.42,.6,br[2]+2.5),new THREE.Color(.5,1.6,2.6));
 const holo=new THREE.Mesh(new THREE.IcosahedronGeometry(.45,1),new THREE.MeshBasicMaterial({color:new THREE.Color(.5,1.6,2.6),wireframe:true}));holo.position.set(36,1.3,5);scene.add(holo);add(MT,cyl(.4,.6,18,.5),MX(36,.3,5),0x5a6474);add(G_,cyl(.32,.04,18),MX(36,.62,5),new THREE.Color(.5,1.6,2.6));out.anim.push(t=>{holo.rotation.y=t*.7;holo.rotation.x=t*.3;holo.position.y=1.3+Math.sin(t*1.5)*.06;});
 const rd=room('rad').r;const dish=new THREE.Mesh(new THREE.SphereGeometry(.6,20,10,0,Math.PI*2,0,Math.PI/2.6),fogify(new THREE.MeshStandardMaterial({color:0xf2f6ff,roughness:.4,metalness:.3,side:THREE.DoubleSide})));dish.position.set(rd[1]-1,1.25,rd[3]-1.2);dish.rotation.x=-.9;scene.add(dish);add(MT,cyl(.06,1.1,8),MX(rd[1]-1,.55,rd[3]-1.2),0x9aa3b4);out.anim.push(t=>{dish.rotation.z=Math.sin(t*.6)*.6;});
 add(P_,new THREE.CircleGeometry(1.3,30).rotateX(-Math.PI/2),MX(21.5,.012,5),0xffc23d);plant(rd[0]+1.4,rd[3]-.6,.8);
 const lb=room('lab').r;plant(lb[0]+.5,lb[3]-.6,.8,0x2fd6c8);
 const cg=room('crg').r;for(const[bx,bz,c]of[[cg[0]+3.3,cg[2]+.5,0xe86a5c],[cg[0]+4.1,cg[2]+.5,0x4fa3ff],[cg[1]-.6,cg[3]-.6,0x7fc96a]]){add(MT,cyl(.32,.85,16),MX(bx,.43,bz),c);add(MT,cyl(.33,.05,16),MX(bx,.86,bz),col(c).clone().multiplyScalar(.7));}
 const pw=room('pwr').r;for(let k=0;k<3;k++){add(MT,cyl(.28,1.1,14),MX(pw[0]+8+k*.7,.55,pw[3]-.5),0x5a6474);add(G_,cyl(.29,.12,14),MX(pw[0]+8+k*.7,.8,pw[3]-.5),new THREE.Color(.4,2.2,1));}
 const ob=room('obs').r;add(P_,new THREE.CircleGeometry(2.2,40).rotateX(-Math.PI/2),MX(56.5,.012,6.5),0x8f7fd9);
 const gh=room('grn').r;for(const[x,z]of[[gh[0]+.6,gh[2]+.6],[gh[1]-.6,gh[2]+.6]])plant(x,z,1.2,0xd98c5f);add(P_,cyl(.18,.3,12,.14),MX(54,.15,23.3),0x4fa3ff);add(P_,cyl(.03,.25,6),MX(54.2,.35,23.3,0,1,1,1,0,-.9),0x4fa3ff);
 // consoles for every station + fix panel
 const scr=new Map();const screenMat=type=>{if(!scr.has(type)){const m=fogify(new THREE.MeshBasicMaterial({map:screenTex(type),color:new THREE.Color(1.35,1.35,1.35)}),{push:.5});scr.set(type,m);}return scr.get(type);};
 const consoleAt=(st,type,fix)=>{if(!st.dx&&!st.dz){// floor pad (gravity test)
   add(MT,cyl(.85,.1,32,.9),MX(st.x,.05,st.z),0xdfe5ef);const rg=new THREE.Mesh(new THREE.TorusGeometry(.72,.05,8,40),new THREE.MeshBasicMaterial({color:new THREE.Color(.4,2,2.6)}));rg.rotation.x=Math.PI/2;rg.position.set(st.x,.12,st.z);scene.add(rg);
   const beam=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,2.4,24,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(.3,1.4,2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.set(st.x,1.2,st.z);scene.add(beam);
   out.consoles.set(st.id,{pos:new V(st.x,.1,st.z),ring:rg,beam});out.pads.push({st,beam,ring:rg});return;}
  const ang=Math.atan2(st.dx,st.dz);const cx=st.x+st.dx*.62,cz=st.z+st.dz*.62;const ri=M.roomAt(st.x,st.z),acc=ri>=0?M.ROOMS[ri].acc:0x9aa3b4;
  add(MT,box(.95,.92,.42),MX(cx,.46,cz,ang),fix?0xd8dde6:0xe9edf3);add(P_,box(.97,.08,.44),MX(cx,.1,cz,ang),fix?0xff5a4d:acc);
  const s=new THREE.Mesh(new THREE.PlaneGeometry(.78,.48),screenMat(fix?'fix':type));s.position.set(cx-st.dx*.22,1.05,cz-st.dz*.22);s.rotation.set(0,ang+Math.PI,0);s.rotateX(-.5);scene.add(s);
  add(MT,box(.95,.07,.52),MX(cx-st.dx*.05,.96,cz-st.dz*.05,ang),0x3a3f4a);
  for(let k=0;k<3;k++)add(G_,box(.08,.04,.08),MX(cx-st.dx*.24+Math.cos(ang)*(k-1)*.22,.75,cz-st.dz*.24-Math.sin(ang)*(k-1)*.22,ang),[new THREE.Color(2.2,.4,.3),new THREE.Color(.4,2.2,.8),new THREE.Color(2.2,1.8,.3)][k]);
  out.consoles.set(st.id,{pos:new V(cx,1.1,cz),screen:s,fix});};
 for(const st of M.STATIONS)consoleAt(st,st.type,false);
 for(const k in M.FIX)for(const st of M.FIX[k]){consoleAt(st,'fix',true);out.fixScreens.push(out.consoles.get(st.id));}
 // vents: round floor hatches with a hinged lid
 const ventTop=fogify(new THREE.MeshStandardMaterial({map:ctex(128,128,(x,w,h)=>{x.fillStyle='#5d6880';x.beginPath();x.arc(64,64,62,0,7);x.fill();x.fillStyle='#232733';for(let i=0;i<6;i++){x.beginPath();x.roundRect(22,22+i*15,84,8,4);x.fill();}x.strokeStyle='#c8d0de';x.lineWidth=6;x.beginPath();x.arc(64,64,58,0,7);x.stroke();},{clamp:true}),transparent:true,alphaTest:.5,roughness:.4,metalness:.6}),{push:0});
 for(const v of M.VENTS){add(MT,cyl(.5,.06,24),MX(v.x,.03,v.z),0x3a3f4a);add(G_,new THREE.TorusGeometry(.5,.025,6,28),MX(v.x,.06,v.z,0,1,1,1,Math.PI/2),new THREE.Color(.6,.75,1));
  const lid=new THREE.Mesh(new THREE.PlaneGeometry(.92,.92),ventTop);lid.rotation.x=-Math.PI/2;const piv=new THREE.Group();piv.position.set(v.x,.07,v.z-.46);lid.position.set(0,0,.46);piv.add(lid);scene.add(piv);out.vents.push({v,piv,open:0,t:0});}
 // doors (two sliding halves per span, hazard striped)
 const doorMat=fogify(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.4,metalness:.4,map:ctex(128,128,(x,w,h)=>{x.fillStyle='#dfe5ef';x.fillRect(0,0,w,h);for(let i=0;i<8;i++){x.fillStyle=i%2?'#20232b':'#ffc23d';x.fillRect(0,i*8,w,8);}x.fillStyle='#c4ccd9';x.fillRect(0,64,w,64);x.fillStyle='#ff5a4d';x.fillRect(10,84,w-20,10);})}));
 for(let r=0;r<M.ROOMS.length;r++)for(const s of M.doorSpans(r)){const vert=s.x1-s.x0===1&&s.z1-s.z0>1,len=vert?s.z1-s.z0:s.x1-s.x0,cx=(s.x0+s.x1)/2,cz=(s.z0+s.z1)/2;
  const halves=[];for(const sg of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(vert?.22:len/2,WALL_H,vert?len/2:.22),doorMat);m.castShadow=true;m.visible=false;scene.add(m);halves.push({m,sg});}
  out.doors.push({room:r,vert,len,cx,cz,halves,k:0});}
 const mk=(arr,mat,shadow=true)=>{if(!arr.length)return;const m=new THREE.Mesh(merge(arr),mat);m.castShadow=shadow;m.receiveShadow=true;scene.add(m);return m;};
 mk(MT,K.metal);mk(P_,K.paint);mk(G_,K.glow,false);
 // task beacons: a bobbing arrow + a pulsing floor ring over the player's own stations (and repair panels)
 const chev=new THREE.ConeGeometry(.2,.38,4);chev.rotateX(Math.PI);const ringG=new THREE.RingGeometry(.5,.62,32);ringG.rotateX(-Math.PI/2);
 for(const[id,c]of out.consoles){const g=new THREE.Group();const am=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1.9,.3)});const a=new THREE.Mesh(chev,am);a.position.copy(c.pos).add(new V(0,.95,0));g.add(a);
  const st=[...M.STATIONS,...Object.values(M.FIX).flat()].find(s=>s.id===id);const rm=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1.9,.3),transparent:true,opacity:.8,depthWrite:false});const ring=new THREE.Mesh(ringG,rm);ring.position.set(st.x,.03,st.z);g.add(ring);
  g.visible=false;g.userData={arrow:a,ring,am,rm,y:a.position.y};scene.add(g);out.taskMarks.set(id,g);}}

/* ---------- environment map for metal reflections ---------- */
export function makeEnv(R){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.22,.21,.26),vec3(.5,.55,.68),smoothstep(-.3,.7,h));gl_FragColor=vec4(c,1.);}'})));
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const m=new THREE.Mesh(new THREE.PlaneGeometry(10,2),new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,1.45,1.4),side:THREE.DoubleSide}));m.position.set(Math.cos(a)*20,16,Math.sin(a)*20);m.lookAt(0,0,0);s.add(m);}
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
export function buildSpace(){const s=new THREE.Scene();s.background=new THREE.Color(0x0b1036);
 const n=3000,pos=new Float32Array(n*3),cl=new Float32Array(n*3);for(let i=0;i<n;i++){const r=60+Math.random()*120,a=Math.random()*Math.PI*2,b=Math.acos(Math.random()*2-1);pos[i*3]=r*Math.sin(b)*Math.cos(a);pos[i*3+1]=r*Math.cos(b);pos[i*3+2]=r*Math.sin(b)*Math.sin(a)-40;const w=.6+Math.random()*1.4;cl[i*3]=w*(.8+Math.random()*.2);cl[i*3+1]=w*.9;cl[i*3+2]=w;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(cl,3));
 const dot=ctex(32,32,(x,w)=>{const gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'rgba(255,255,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);},{clamp:true});
 const stars=new THREE.Points(g,new THREE.PointsMaterial({size:.9,map:dot,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,sizeAttenuation:true}));s.add(stars);
 const neb=new THREE.Mesh(new THREE.PlaneGeometry(320,320),new THREE.MeshBasicMaterial({map:spaceTex(),transparent:true,opacity:.95,depthWrite:false}));neb.position.set(0,0,-150);s.add(neb);
 const planet=new THREE.Mesh(new THREE.SphereGeometry(22,48,24),new THREE.MeshStandardMaterial({color:0xff9a6a,roughness:.85,emissive:0x2a0c04}));planet.position.set(46,-30,-90);s.add(planet);
 const ring=new THREE.Mesh(new THREE.RingGeometry(28,40,64),new THREE.MeshBasicMaterial({color:new THREE.Color(1,.8,.65),transparent:true,opacity:.5,side:THREE.DoubleSide}));ring.position.copy(planet.position);ring.rotation.x=-1.25;s.add(ring);
 s.add(new THREE.AmbientLight(0x8090d0,1.2));const sun=new THREE.DirectionalLight(0xffe2c0,3);sun.position.set(-30,20,30);s.add(sun);
 const hull=new THREE.Mesh(new THREE.BoxGeometry(10,30,14),new THREE.MeshStandardMaterial({color:0xc4ccd9,metalness:.4,roughness:.5,map:hullTex()}));hull.position.set(-15,0,-6);s.add(hull);
 const lock=new THREE.Mesh(new THREE.TorusGeometry(2.2,.18,12,40),new THREE.MeshBasicMaterial({color:new THREE.Color(2,.8,.3)}));lock.position.set(-9.9,0,-2);lock.rotation.y=Math.PI/2;s.add(lock);
 const cam=new THREE.PerspectiveCamera(46,1,.1,600);cam.position.set(0,1,9);cam.lookAt(0,0,0);return{scene:s,cam,stars};}
