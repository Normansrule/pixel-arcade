// ABYSS DIVER — marine life: instanced fish schools, veilrays, razorjaws, jellies, crabs and the HOLLOWMAW leviathan.
import * as THREE from '../vendor/three.module.min.js';
import {cl,lerp,sm,mulberry,n2,merge,paint,xf} from './util.js';
import {wmat} from './water.js';
import {heightAt,weights,WORLD} from './world.js';

const V=THREE.Vector3,TAU=Math.PI*2;
/* ---------- parametric fish body (length 1, head toward +Z) ---------- */
function fishGeo(o,lod=0){const L=1,H=o.h,W=o.w,nu=lod?8:16,nv=lod?6:12;const pos=[],colA=[],idx=[];const top=new THREE.Color(o.top),bel=new THREE.Color(o.belly),st=new THREE.Color(o.stripeCol||0x000000),c=new THREE.Color();
 for(let i=0;i<=nu;i++){const u=i/nu;const z=L*(.5-u);let r=Math.pow(Math.sin(Math.PI*Math.min(u*1.04+.02,1)),o.blunt||.7)*(1-.72*sm(.62,1,u));r=Math.max(r,.04);
  for(let j=0;j<=nv;j++){const v=j/nv*TAU;const y=Math.sin(v)*H*.5*r+(o.hump||0)*r*H*.2,x=Math.cos(v)*W*.5*r;pos.push(x,y,z);
   const up=sm(-.5,.6,Math.sin(v));c.copy(bel).lerp(top,up);if(o.stripes){const s=Math.sin(u*Math.PI*o.stripes*2+.6);if(s>.55&&u>.15&&u<.8)c.lerp(st,.85);}if(o.lat){const lat=Math.abs(Math.sin(v))<.18&&u>.1&&u<.85;if(lat)c.lerp(st,.8);}colA.push(c.r,c.g,c.b);}}
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));body.setAttribute('color',new THREE.Float32BufferAttribute(colA,3));body.setIndex(idx);body.computeVertexNormals();
 const parts=[body];const fin=new THREE.Color(o.fin||o.top);
 const tri=(pts,cc)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts.flat(),3));g.computeVertexNormals();paint(g,cc);return g;};
 const t0=-L*.42,tl=o.tail||.32,th=H*(o.tailH||.75);parts.push(tri([[0,0,t0],[0,th,t0-tl],[0,0,t0-tl*.55]],fin),tri([[0,0,t0],[0,0,t0-tl*.55],[0,-th,t0-tl]],fin));
 if(o.dorsal!==0){const dh=H*(o.dorsal||.45);parts.push(tri([[0,H*.42,L*.12],[0,H*.42+dh,-L*.08],[0,H*.36,-L*.26]],fin));}
 for(const s of[-1,1])parts.push(tri([[s*W*.45,-H*.1,L*.18],[s*(W*.45+H*.35),-H*.28,L*.02],[s*W*.42,-H*.18,L*.04]],fin));
 for(const s of[-1,1]){const e=new THREE.SphereGeometry(o.eye||H*.12,lod?4:8,lod?3:6);e.translate(s*W*.36,H*.1,L*.3);paint(e,0x080808);parts.push(e);const g=new THREE.SphereGeometry((o.eye||H*.12)*.45,lod?3:6,lod?2:4);g.translate(s*(W*.36+(o.eye||H*.12)*.75),H*.1+(o.eye||H*.12)*.3,L*.32);paint(g,0xffffff);parts.push(g);}
 if(o.lure){const st2=new THREE.CylinderGeometry(.008,.008,.3,4);xf(st2,{r:[1.1,0,0],p:[0,H*.55,L*.52]});paint(st2,0x222222);parts.push(st2);const b=new THREE.SphereGeometry(.05,8,6);b.translate(0,H*.62,L*.66);paint(b,0xffffff);parts.push(b);}
 return merge(parts);}

const FISH={
 glowfin:{len:.42,geo:{h:.3,w:.15,top:0x2a5a9a,belly:0xd8f0ff,fin:0x6ae8ff,stripeCol:0x6ae8ff,lat:1},emi:0x1a7acc,ei:.9,sp:[1.6,4.6],beat:13},
 sandskip:{len:.5,geo:{h:.56,w:.14,top:0xf2c030,belly:0xfff0b0,stripes:3,stripeCol:0x1a1a1a,fin:0xffd060,dorsal:.6},sp:[1.5,4.2],beat:12},
 bulbeye:{len:.55,geo:{h:.8,w:.6,top:0xff6a2a,belly:0xffe0b8,fin:0xffa060,eye:.16,blunt:.45,tail:.25},sp:[.9,2.6],beat:8},
 needle:{len:1.15,geo:{h:.14,w:.11,top:0x5a8ab0,belly:0xeef6ff,fin:0x8ac0e0,stripeCol:0x2a4a6a,lat:1,dorsal:.6,tail:.22},sp:[2,6],beat:10},
 duskwing:{len:.62,geo:{h:.9,w:.13,top:0x6a3aa8,belly:0xf0d8ff,stripes:2,stripeCol:0xffffff,fin:0xb080ff,dorsal:.9,tailH:1},sp:[1.4,3.8],beat:9},
 gloomlure:{len:.8,geo:{h:.42,w:.3,top:0x1a1a26,belly:0x3a3a4a,fin:0x2a2a3a,lure:1,eye:.06,stripeCol:0x40ffe0,lat:1},emi:0x40ffe0,ei:2.2,sp:[1,3],beat:7},
};

export class Life{
 constructor(scene,diff){this.scene=scene;this.diff=diff;this.schools=[];this.creatures=[];this.t=0;this.R=mulberry(77);const R=this.R;
  this.tmp=new V();this.q=new THREE.Quaternion();this.d=new THREE.Object3D();
  /* fish species meshes */
  this.fishMesh={};for(const[k,f]of Object.entries(FISH)){const g=fishGeo(f.geo);const m=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.25,side:THREE.DoubleSide,emissive:f.emi||0,emissiveIntensity:f.ei||0}),{caus:.8,rim:.35,key:'fish'+k,
    vert:`float fi=float(gl_InstanceID);float tw=smoothstep(.35,-.5,position.z);transformed.x+=sin(uTime*${f.beat.toFixed(1)}+fi*2.1-position.z*7.)*(.03+tw*.16);`,
    emis:f.emi?'totalEmissiveRadiance*=vColor*vColor*1.5;':''});
   this.fishMesh[k]={g,gl:fishGeo(f.geo,1),m,len:f.len,sp:f.sp};}
  this.spawnSchools();this.buildRays();this.buildRazor();this.buildJelly();this.buildCrabs();this.buildMaw();this.buildTurtles();}
 setLOD(low){for(const s of this.schools){const fm=this.fishMesh[s.kind];s.im.geometry=low?fm.gl:fm.g;}}
 place(filter,tries=400){const R=this.R;for(let t=0;t<tries;t++){const x=(R()*2-1)*(WORLD-20),z=(R()*2-1)*(WORLD-20),y=heightAt(x,z);if(filter(-y,weights(x,z),x,z))return[x,y,z];}return[0,-12,0];}
 spawnSchools(){const R=this.R;const plan=[['glowfin',7,22,(d,w)=>d<45&&w.abyss<.1&&w.pit<.2],['sandskip',6,16,(d,w)=>w.reef>.4&&d<50],['bulbeye',8,5,(d,w)=>d<60&&w.abyss<.1&&w.pit<.2&&w.r<170],['needle',5,14,(d,w)=>w.kelp>.5&&d<60],['duskwing',5,12,(d,w)=>w.plat>.6],['gloomlure',7,8,(d,w)=>(w.pit>.4&&d>80)||(w.abyss>.6&&d>200)]];
  for(const[k,ns,per,f]of plan){const fm=this.fishMesh[k];const total=ns*per;const im=new THREE.InstancedMesh(fm.g,fm.m,total);im.frustumCulled=false;this.scene.add(im);
   for(let s=0;s<ns;s++){let c=this.place(f);if(k==='glowfin'&&s<2){const a=s*2.4;c=[Math.cos(a)*16,heightAt(Math.cos(a)*16,Math.sin(a)*16),Math.sin(a)*16];}
    const home=new V(c[0],Math.min(c[1]+3+R()*6,-2.5),c[2]);const fish=[];for(let i=0;i<per;i++)fish.push({p:home.clone().add(new V(R()*6-3,R()*3-1.5,R()*6-3)),v:new V(R()-.5,0,R()-.5),off:s*per+i,gone:0});
    this.schools.push({kind:k,im,f:fish,home,c:home.clone(),goal:home.clone(),len:fm.len,sp:fm.sp,phase:R()*10});}}}
 /* ---------- VEILRAY: giant gentle ray with trailing veils ---------- */
 buildRays(){const nx=24,nz=12;const pos=[],col=[],idx=[];const cTop=new THREE.Color(0x3a4a6a),cBel=new THREE.Color(0xd8e4ee),cSpot=new THREE.Color(0x9af0ff);
  for(let s=0;s<2;s++){const base=pos.length/3;for(let i=0;i<=nx;i++){const x=i/nx*2-1,ax=Math.abs(x);const zf=.55*(1-ax*ax)+.08-ax*.32,zb=-.42*(1-Math.pow(ax,.8))-.05;
    for(let j=0;j<=nz;j++){const t=j/nz,z=lerp(zb,zf,t);const th=.13*Math.pow(1-ax,1.6)*Math.sin(Math.PI*t)+.004;pos.push(x*6.5,s?-th*6.5*.6:th*6.5,z*6.5);
     const spot=s===0&&Math.sin(x*16)*Math.sin(t*10)>.82&&ax<.85;const c=s?cBel:(spot?cSpot:cTop.clone().lerp(new THREE.Color(0x6a7aa0),t*.4));col.push(c.r,c.g,c.b);}}
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=base+i*(nz+1)+j,b=a+nz+1;if(s)idx.push(a,a+1,b,b,a+1,b+1);else idx.push(a,b,a+1,b,b+1,a+1);}}
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));body.setAttribute('color',new THREE.Float32BufferAttribute(col,3));body.setIndex(idx);body.computeVertexNormals();
  const tail=new THREE.CylinderGeometry(.02,.16,9,5,10);xf(tail,{r:[Math.PI/2,0,0],p:[0,0,-7.1]});paint(tail,0x2a3a5a);
  const eyes=[-1,1].map(s=>{const e=new THREE.SphereGeometry(.18,8,6);e.translate(s*1.1,.35,3.2);paint(e,0x9af0ff);return e;});
  const lobes=[-1,1].map(s=>{const l=new THREE.ConeGeometry(.35,1.6,6);xf(l,{r:[Math.PI/2+.2,0,0],p:[s*1.25,.1,4.1]});paint(l,0x3a4a6a);return l;});
  const g=merge([body,tail,...eyes,...lobes]);
  const m=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.1,side:THREE.DoubleSide,emissive:0xffffff}),{caus:.8,key:'ray',uniforms:{uPh:{value:0}},vpars:'uniform float uPh;',
   vert:`float ax=abs(position.x)/6.5;transformed.y+=sin(uTime*.9+uPh-ax*1.6)*pow(ax,1.4)*2.4;transformed.x*=1.-.05*sin(uTime*.9+uPh)*ax;if(position.z<-5.){transformed.x+=sin(uTime*1.3+uPh+position.z*.5)*.5*(-position.z-5.)*.25;}`,
   emis:'totalEmissiveRadiance=vec3(.3,.9,1.)*smoothstep(.75,.95,vColor.g)*smoothstep(.85,1.,vColor.b)*1.6;'});
  // trailing veils (translucent ribbons)
  const vg=new THREE.PlaneGeometry(.9,14,1,16);vg.translate(0,-7,0);vg.rotateX(Math.PI/2);
  const vm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPh:{value:0}},
   vertexShader:'uniform float uTime,uPh;varying float vT;void main(){vec3 p=position;vT=-p.z/14.;p.x+=sin(uTime*1.2+uPh+p.z*.35)*vT*1.6;p.y+=sin(uTime*.9+uPh-.6+p.z*.25)*vT*1.2;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
   fragmentShader:'varying float vT;void main(){float a=(1.-vT)*smoothstep(0.,.12,vT)*.35;gl_FragColor=vec4(vec3(.4,.85,1.)*a,1.);}'});
  this.rays=[];const R=this.R;
  for(let i=0;i<4;i++){const mm=m.clone();mm.onBeforeCompile=m.onBeforeCompile;mm.customProgramCacheKey=m.customProgramCacheKey;const ph={value:i*1.7};const ob=mm.onBeforeCompile;mm.onBeforeCompile=sh=>{ob(sh);sh.uniforms.uPh=ph;};
   const grp=new THREE.Group();const mesh=new THREE.Mesh(g,mm);grp.add(mesh);for(const s of[-1,1]){const vmi=vm.clone();vmi.uniforms.uPh={value:i*1.7+s};vmi.uniforms.uTime=this.uT||(this.uT={value:0});const v=new THREE.Mesh(vg,vmi);v.position.set(s*6.2,0,-1.2);grp.add(v);}
   const c=i===0?[52,0,-50]:this.place((d,w)=>(w.plat>.4||w.reef>.3||w.kelp>.3)&&d>25&&d<110);grp.position.set(c[0],-24,c[2]);grp.scale.setScalar(i===0?.85:1+R()*.3);this.scene.add(grp);
   this.creatures.push({kind:'veilray',g:grp,ph,center:new V(c[0],0,c[2]),rad:i===0?24:35+R()*35,a:R()*TAU,dir:R()<.5?1:-1,y:-24,size:9,hp:1});}}
 /* ---------- RAZORJAW: reef predator ---------- */
 buildRazor(){const g=fishGeo({h:.26,w:.2,top:0x2a3440,belly:0xb8c4c8,fin:0x1a2028,stripeCol:0xff6a2a,lat:1,dorsal:.9,tail:.34,tailH:1,eye:.025,blunt:.6});
  const teeth=[];for(let i=0;i<7;i++){const t=new THREE.ConeGeometry(.012,.05,3);xf(t,{r:[Math.PI,0,0],p:[(i-3)*.018,-.02,.47]});paint(t,0xffffff);teeth.push(t);}
  const eyeG=[-1,1].map(s=>{const e=new THREE.SphereGeometry(.022,6,4);e.translate(s*.07,.04,.38);paint(e,0xffa020);return e;});
  const geo=merge([g,...teeth,...eyeG]);
  const m=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.35,side:THREE.DoubleSide,emissive:0xffffff}),{caus:.8,key:'razor',vert:`float fi=float(gl_InstanceID);float tw=smoothstep(.3,-.5,position.z);transformed.x+=sin(uTime*7.+fi*2.1-position.z*6.)*(.02+tw*.13);`,
   emis:'totalEmissiveRadiance=vColor*smoothstep(.6,.9,vColor.r-vColor.b)*2.5;'});
  const homes=[[62,-36],[96,-74],[-70,-40],[30,95],[-20,-118],[120,10]];const im=new THREE.InstancedMesh(geo,m,homes.length);im.frustumCulled=false;this.scene.add(im);this.razorMesh=im;
  homes.forEach(([x,z],i)=>{const y=heightAt(x,z)+5;this.creatures.push({kind:'razorjaw',idx:i,pos:new V(x,y,z),vel:new V(),home:new V(x,y,z),state:'patrol',cd:0,scare:0,hits:0,size:3,t:this.R()*10});});}
 /* ---------- LANTERN JELLY (instanced bell + threads) ---------- */
 buildJelly(){const n=46;const bell=new THREE.SphereGeometry(1,20,10,0,TAU,0,Math.PI*.55);const p=bell.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x);const k=1+Math.sin(a*8)*.04;p.setX(i,x*k);p.setZ(i,z*k);}bell.computeVertexNormals();paint(bell,(c,x,y)=>c.setRGB(.5,.8,1).lerp(new THREE.Color(1,1,1),y));
  const inner=new THREE.SphereGeometry(.45,10,6);inner.translate(0,.25,0);paint(inner,0xffb0f0);const bg=merge([bell,inner]);
  const bm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.55,roughness:.2,side:THREE.DoubleSide,depthWrite:false,emissive:0xffffff}),{caus:0,key:'jelly',vert:'float pl=sin(uTime*2.2+float(gl_InstanceID)*1.7);transformed.xz*=1.+pl*.13;transformed.y*=1.-pl*.12;',emis:'totalEmissiveRadiance=vColor*vec3(.35,.55,1.)*(1.1+.5*sin(uTime*2.2+float(0)));'});
  const parts=[];for(let i=0;i<10;i++){const a=i/10*TAU;const t=new THREE.PlaneGeometry(.05,4,1,10);t.translate(0,-2,0);xf(t,{r:[0,a,0],p:[Math.cos(a)*.7,0,Math.sin(a)*.7]});parts.push(t);}const tg=merge(parts);
  const tm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:this.uT||(this.uT={value:0})},
   vertexShader:'uniform float uTime;varying float vY;void main(){vec3 p=position;vY=-p.y/4.;float fi=float(gl_InstanceID);p.x+=sin(uTime*1.7+fi+p.y*1.4)*.25*vY;p.z+=cos(uTime*1.3+fi*2.+p.y)*.25*vY;gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(p,1.);}',
   fragmentShader:'varying float vY;void main(){gl_FragColor=vec4(vec3(.45,.75,1.)*(1.-vY)*.55,1.);}'});
  this.jellyBell=new THREE.InstancedMesh(bg,bm,n);this.jellyThr=new THREE.InstancedMesh(tg,tm,n);this.jellyBell.frustumCulled=this.jellyThr.frustumCulled=false;this.scene.add(this.jellyBell,this.jellyThr);
  for(let i=0;i<n;i++){const c=this.place((d,w)=>(d>60&&(w.pit>.3||w.abyss>.2||w.plat>.6)));const fy=c[1];this.creatures.push({kind:'jelly',idx:i,pos:new V(c[0],Math.min(lerp(fy+6,-45,this.R()),-30),c[2]),t:this.R()*10,size:1.5,sting:0,s:.8+this.R()*.8});}}
 /* ---------- QUARTZBACK CRAB ---------- */
 buildCrabs(){const parts=[];const shell=new THREE.DodecahedronGeometry(.6,1);xf(shell,{s:[1.25,.5,1]});paint(shell,0xb8d8f0);parts.push(shell);
  for(let i=0;i<7;i++){const s=new THREE.ConeGeometry(.09,.5,5);xf(s,{p:[(i%3-1)*.3,.38,(Math.floor(i/3)-1)*.25],r:[(i%2-.5)*.4,0,(i%3-1)*.3]});paint(s,0xffffff);parts.push(s);}
  for(let i=0;i<6;i++){const sd=i<3?-1:1;const l=new THREE.CylinderGeometry(.04,.03,.9,4);xf(l,{r:[0,0,sd*1.0],p:[sd*.95,-.1,(i%3-1)*.36]});paint(l,0x7088a0);parts.push(l);}
  for(const sd of[-1,1]){const cw=new THREE.BoxGeometry(.25,.16,.45);xf(cw,{p:[sd*.45,0,.75],r:[0,sd*.4,0]});paint(cw,0x9ab8d8);parts.push(cw);}
  const g=merge(parts);const m=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.15,metalness:.2,emissive:0xffffff}),{caus:.5,key:'crab',vert:'if(abs(position.x)>.6&&position.y<.0)transformed.y+=sin(uTime*14.+iph*3.+position.z*5.)*.07;',emis:'totalEmissiveRadiance=vec3(.4,.8,1.)*smoothstep(.95,1.,vColor.r)*1.6;'});
  const n=26;this.crabMesh=new THREE.InstancedMesh(g,m,n);this.crabMesh.frustumCulled=false;this.scene.add(this.crabMesh);
  for(let i=0;i<n;i++){const c=this.place((d,w)=>(w.abyss>.6&&d>250)||(w.pit>.5&&d>120));this.creatures.push({kind:'crab',idx:i,pos:new V(c[0],c[1]+.5,c[2]),dir:this.R()*TAU,t:this.R()*10,size:1.2,pinch:0});}}
 /* ---------- HOLLOWMAW leviathan ---------- */
 buildMaw(){const NS=26;this.NS=NS;
  const seg=new THREE.SphereGeometry(1,16,10);xf(seg,{s:[1,.82,1.55]});paint(seg,(c,x,y,z)=>{c.setRGB(.24,.26,.36).lerp(new THREE.Color(.6,.58,.66),sm(.2,-.7,y));if(Math.abs(y+.05)<.09&&Math.abs(x)>.85&&Math.sin(z*5)>-.2)c.setRGB(1,1,1);});
  const plates=[];for(let i=0;i<3;i++){const p=new THREE.ConeGeometry(.28,.9,4);xf(p,{p:[0,.82,(i-1)*.5],r:[-.5,0,0]});paint(p,0xb8b0a0);plates.push(p);}
  const lant=[-1,1].map(s=>{const l=new THREE.SphereGeometry(.17,8,6);l.translate(s*.62,.45,0);paint(l,0xffffff);return l;});
  const segG=merge([seg,...plates,...lant]);
  const sm2=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.25,emissive:0xffffff}),{caus:.5,key:'maw',emis:'totalEmissiveRadiance=vec3(.3,.95,1.)*smoothstep(.95,1.,vColor.b)*smoothstep(.95,1.,vColor.r)*(2.4+1.2*sin(uTime*3.+vIph*2.));'});
  this.mawSeg=new THREE.InstancedMesh(segG,sm2,NS);this.mawSeg.frustumCulled=false;this.scene.add(this.mawSeg);
  const fr=new THREE.PlaneGeometry(1.7,1.3,4,2);fr.translate(.85+.75,0,0);const fr2=fr.clone();fr2.rotateY(Math.PI);const frG=merge([fr,fr2]);
  const fm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:this.uT||(this.uT={value:0})},
   vertexShader:'uniform float uTime;varying float vX;void main(){vec3 p=position;vX=abs(p.x);float fi=float(gl_InstanceID);p.y+=sin(uTime*3.+fi*.7+vX*1.4)*.35*max(vX-.8,0.);gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(p,1.);}',
   fragmentShader:'varying float vX;void main(){float a=smoothstep(.75,1.2,vX)*smoothstep(2.45,1.6,vX);gl_FragColor=vec4(vec3(.45,.3,1.)*a*.22,1.);}'});
  this.mawFrill=new THREE.InstancedMesh(frG,fm,NS);this.mawFrill.frustumCulled=false;this.scene.add(this.mawFrill);
  // head
  const head=new THREE.Group();const hm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.25,emissive:0xffffff}),{caus:.5,key:'mawh',emis:'totalEmissiveRadiance=vec3(1.,.6,.15)*smoothstep(.9,1.,vColor.r)*smoothstep(.5,.7,vColor.g)*smoothstep(.3,.1,vColor.b)*4.;'});
  const skull=new THREE.SphereGeometry(1,20,14);xf(skull,{s:[1.15,.9,2.1],p:[0,0,-.3]});paint(skull,(c,x,y,z)=>{c.setRGB(.24,.26,.36).lerp(new THREE.Color(.6,.58,.66),sm(.2,-.7,y));if(Math.abs(y+.05)<.07&&Math.abs(x)>.9)c.setRGB(1,.62,.2);});
  const crest=[];for(let i=0;i<4;i++){const s=i<2?-1:1;const h=new THREE.ConeGeometry(.16,2.4,5);xf(h,{r:[-1.25,0,s*.35],p:[s*(.5+(i%2)*.3),.7,-1.4-(i%2)*.6]});paint(h,0xc8c0b0);crest.push(h);}
  const eyes=[];for(let i=0;i<4;i++){const s=i%2?1:-1;const e=new THREE.SphereGeometry(.17,8,6);e.translate(s*.98,.25-(i>1?.4:0),.9-(i>1?.35:0));paint(e,0xffa820);eyes.push(e);}
  const throat=new THREE.CircleGeometry(.75,16);throat.translate(0,0,1.62);paint(throat,0xff9a20);
  head.add(new THREE.Mesh(merge([skull,...crest,...eyes,throat]),hm));
  const petals=[];const pg=new THREE.SphereGeometry(1,12,8,0,Math.PI*.5,0,Math.PI*.5);pg.rotateZ(-Math.PI/4);xf(pg,{s:[.95,.95,1.5]});paint(pg,(c,x,y,z)=>c.setRGB(.2,.18,.26).lerp(new THREE.Color(.85,.8,.7),sm(.6,1.4,z)));
  const tooth=[];for(let i=0;i<4;i++){const t=new THREE.ConeGeometry(.06,.35,4);xf(t,{r:[Math.PI*.85,0,0],p:[(i-1.5)*.16,.5,1.15]});paint(t,0xf0e8d8);tooth.push(t);}const petG=merge([pg,...tooth]);
  for(let i=0;i<4;i++){const piv=new THREE.Group();piv.position.set(0,0,.2);piv.rotation.z=i*Math.PI/2;const pm=new THREE.Mesh(petG,hm);pm.position.z=-.2;const hinge=new THREE.Group();hinge.add(pm);piv.add(hinge);head.add(piv);petals.push(hinge);}
  head.scale.setScalar(2.9);this.scene.add(head);
  const start=new V(170,-150,-40);const trail=[];for(let i=0;i<NS*6;i++)trail.push(start.clone().add(new V(0,0,-i*.6)));
  this.maw={kind:'maw',head,petals,pos:start.clone(),vel:new V(0,0,8),trail,state:'roam',t:0,cd:0,open:0,wp:start.clone(),size:12,stateT:0,roared:0,hitFlash:0};
  this.creatures.push(this.maw);}


 /* ---------- SHELLBACK: curious sea turtle. Scute-patterned carapace, beaked head, four pivoting flippers ---------- */
 buildTurtles(){const R=this.R;const shell=new THREE.SphereGeometry(1,32,18);const p=shell.attributes.position;const v=new V();
  // scutes: nearest of a few fixed centres on the dome -> darker grooves at the borders
  const cen=[[0,1,0],[0,.8,.6],[0,.8,-.6],[.62,.75,.2],[-.62,.75,.2],[.62,.72,-.35],[-.62,.72,-.35],[0,.55,.95],[0,.5,-.95],[.95,.3,0],[-.95,.3,0],[.8,.4,.6],[-.8,.4,.6],[.8,.4,-.6],[-.8,.4,-.6]].map(a=>new V(...a).normalize());
  const col=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const under=v.y<0;let d1=9,d2=9;for(const c of cen){const d=v.distanceTo(c);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}
   const edge=sm(.0,.09,d2-d1);const rad=sm(.0,.5,d1);const k=under?.0:1;let r=.36+.18*rad,g=.27+.12*rad,b=.16+.05*rad;r*=.55+.45*edge;g*=.55+.45*edge;b*=.55+.45*edge;if(under){r=.85;g=.78;b=.55;}
   col[i*3]=r;col[i*3+1]=g;col[i*3+2]=b;const y=v.y>0?v.y*.42:v.y*.16;p.setXYZ(i,v.x*.95,y,v.z*1.25*(1-.12*Math.max(0,-v.z)));}
  shell.setAttribute('color',new THREE.BufferAttribute(col,3));shell.computeVertexNormals();
  const skin=(c,x,y,z)=>{const sp=Math.sin(x*40)*Math.sin(z*37)*Math.sin(y*31)>.25;c.setRGB(.42,.46,.36);if(sp)c.setRGB(.62,.6,.42);if(y<-.02)c.lerp(new THREE.Color(.82,.8,.66),.6);};
  const head=new THREE.SphereGeometry(.26,16,12);xf(head,{s:[.9,.75,1.3],p:[0,.02,1.55]});paint(head,skin);const neck=new THREE.CylinderGeometry(.17,.22,.5,12);xf(neck,{r:[Math.PI/2,0,0],p:[0,0,1.25]});paint(neck,skin);
  const eyes=[-1,1].map(s=>{const e=new THREE.SphereGeometry(.045,8,6);e.translate(s*.17,.08,1.66);paint(e,0x0a0a0a);return e;});const beak=new THREE.ConeGeometry(.09,.18,8);xf(beak,{r:[Math.PI/2,0,0],p:[0,-.04,1.86],s:[1.3,.7,1]});paint(beak,0x6a5a3a);
  const tail=new THREE.ConeGeometry(.1,.4,8);xf(tail,{r:[-Math.PI/2,0,0],p:[0,0,-1.35]});paint(tail,skin);
  const body=merge([shell,head,neck,...eyes,beak,tail]);
  const fsh=(L,W)=>{const s=new THREE.Shape();s.moveTo(0,-W*.5);s.quadraticCurveTo(L*.6,-W*.6,L,-W*.1);s.quadraticCurveTo(L*.7,W*.25,0,W*.5);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.04,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:2,curveSegments:6});g.translate(0,0,-.02);g.rotateX(Math.PI/2);paint(g,skin);return g;};
  const fFront=fsh(1.5,.55),fRear=fsh(.62,.4);
  const m=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.05}),{caus:.9,key:'turtle',rim:.25,
   bump:'bh=sin(vWP.x*30.)*sin(vWP.z*28.)*sin(vWP.y*25.)*.5;',bumpS:.02});
  this.turtles=[];const spots=[[24,-26],[-30,30],[60,-60],[-90,-10],[10,70]];const NT=spots.length;
  // one instanced draw for all shells, one for front flippers, one for rear flippers
  this.tBody=new THREE.InstancedMesh(body,m,NT);this.tFront=new THREE.InstancedMesh(fFront,m,NT*4);this.tRear=this.tFront;
  for(const im of[this.tBody,this.tFront]){im.castShadow=true;this.scene.add(im);}
  for(let i=0;i<NT;i++){const g=new THREE.Object3D();const fl=[];let fi=0,ri=0;
   for(const[side,front]of[[1,1],[-1,1],[1,0],[-1,0]]){const piv=new THREE.Object3D();piv.position.set(side*.78,-.02,front?.62:-.75);const fm=new THREE.Object3D();fm.rotation.y=side>0?(front?.35:1.1):Math.PI-(front?.35:1.1);if(!front)fm.scale.set(.45,1,.75);piv.add(fm);g.add(piv);fl.push({piv,fm,side,front,slot:i*4+(fi++)});}
   const [x,z]=spots[i];const y=Math.min(heightAt(x,z)+4,-4);g.position.set(x,y,z);const sc=1.1+R()*.5;g.scale.setScalar(sc);g.userData.idx=i;
   const c={kind:'shellback',g,fl,pos:g.position,vel:new V(R()-.5,0,R()-.5),home:new V(x,y,z),state:'roam',t:R()*10,cd:R()*10,size:2.2*sc,wp:new V(x,y,z),yaw:R()*6};this.creatures.push(c);this.turtles.push(c);}}
 stepTurtle(c,dt,P,G){c.t+=dt;if(c.cd>0)c.cd-=dt;const to=this.tmp.copy(P.pos).sub(c.pos);const dist=to.length();
  if(c.state==='roam'){if(c.pos.distanceTo(c.wp)<4||this.R()<dt*.05){const a=this.R()*TAU,r=10+this.R()*30;c.wp.set(c.home.x+Math.cos(a)*r,0,c.home.z+Math.sin(a)*r);c.wp.y=Math.min(heightAt(c.wp.x,c.wp.z)+3+this.R()*8,-4);}
   if(dist<24&&!P.inSub&&c.cd<=0&&P.depth>1.5){c.state='curious';c.ct=0;G.curious&&G.curious(c);}}
  else if(c.state==='curious'){c.ct+=dt;const ang=c.t*.25;c.wp.set(P.pos.x+Math.cos(ang)*5.5,P.pos.y+Math.sin(c.t*.4)*1.2,P.pos.z+Math.sin(ang)*5.5);if(c.ct>14||dist>40||P.inSub){c.state='roam';c.cd=25;}}
  const want=this.tmp2||(this.tmp2=new V());want.copy(c.wp).sub(c.pos);const wl=want.length();if(wl>.01)want.multiplyScalar(1/wl);const fy=heightAt(c.pos.x,c.pos.z);if(c.pos.y<fy+1.8)want.y+=.8;if(c.pos.y>-2.5)want.y-=.8;
  const sp=(c.state==='curious'?2.2:1.6)*Math.min(1,wl/2+.4);c.vel.lerp(want.multiplyScalar(sp),Math.min(1,dt*.7));c.pos.addScaledVector(c.vel,dt);
  const g=c.g;const yaw=Math.atan2(c.vel.x,c.vel.z);let dy=yaw-c.yaw;while(dy>Math.PI)dy-=TAU;while(dy<-Math.PI)dy+=TAU;c.yaw+=dy*Math.min(1,dt*1.5);
  const stroke=Math.sin(c.t*1.6);g.rotation.set(-c.vel.y*.25+stroke*.04,c.yaw,cl(-dy*.6,-.3,.3),'YXZ');g.position.y+=stroke*.004;
  for(const f of c.fl){const s=f.side;if(f.front){f.piv.rotation.set(0,s*(.15+Math.cos(c.t*1.6)*.3),s*(stroke*.55));}else f.piv.rotation.set(0,s*Math.sin(c.t*1.6+1)*.25,s*.1);}
  g.updateMatrixWorld(true);this.tBody.setMatrixAt(g.userData.idx,g.matrixWorld);for(const f of c.fl)this.tFront.setMatrixAt(f.slot,f.fm.matrixWorld);
  this.tBody.instanceMatrix.needsUpdate=this.tFront.instanceMatrix.needsUpdate=true;this.tDirty=true;}
 /* ================= simulation ================= */
 step(dt,P,G){this.t+=dt;if(this.uT)this.uT.value=this.t;const d=this.d;const ppos=P.pos;
  // fish schools
  for(const s of this.schools){const far=s.c.distanceToSquared(ppos)>170*170;if(far&&((this.t*10|0)+s.f.length)%4)continue;const sdt=far?dt*4:dt;
   if(s.goal.distanceToSquared(s.c)<16||this.R()<.003){const a=this.R()*TAU,r=this.R()*24;s.goal.set(s.home.x+Math.cos(a)*r,0,s.home.z+Math.sin(a)*r);s.goal.y=Math.min(heightAt(s.goal.x,s.goal.z)+2+this.R()*7,-2);}
   s.c.set(0,0,0);let alive=0;for(const f of s.f)if(!f.gone){s.c.add(f.p);alive++;}if(alive)s.c.multiplyScalar(1/alive);
   const tmp=this.tmp;for(let i=0;i<s.f.length;i++){const f=s.f[i];if(f.gone>0){f.gone-=sdt;if(f.gone<=0){f.p.copy(s.home).add(tmp.set(this.R()*8-4,this.R()*3,this.R()*8-4));f.gone=0;}d.position.set(0,-9999,0);d.scale.setScalar(0);d.updateMatrix();s.im.setMatrixAt(f.off,d.matrix);continue;}
    const acc=tmp.copy(s.goal).sub(f.p).setLength(.7);acc.x+=(s.c.x-f.p.x)*.3;acc.y+=(s.c.y-f.p.y)*.3;acc.z+=(s.c.z-f.p.z)*.3;
    for(let j=i%3;j<s.f.length;j+=3){const o=s.f[j];if(o===f||o.gone)continue;const dx=f.p.x-o.p.x,dy=f.p.y-o.p.y,dz=f.p.z-o.p.z,dd=dx*dx+dy*dy+dz*dz;if(dd<1.4&&dd>1e-4){const k=(1.2-Math.sqrt(dd))*4/Math.sqrt(dd);acc.x+=dx*k;acc.y+=dy*k;acc.z+=dz*k;}}
    const pdx=f.p.x-ppos.x,pdy=f.p.y-ppos.y,pdz=f.p.z-ppos.z,pd=Math.sqrt(pdx*pdx+pdy*pdy+pdz*pdz);const fearR=P.inSub?11:(s.kind==='bulbeye'?3:6.5);if(pd<fearR&&pd>.01){const k=(fearR-pd)*(s.kind==='sandskip'?3.2:1.8)/pd;acc.x+=pdx*k;acc.y+=pdy*k;acc.z+=pdz*k;}
    const fy=heightAt(f.p.x,f.p.z);if(f.p.y<fy+1.2)acc.y+=4;if(f.p.y>-1.5)acc.y-=4;
    f.v.addScaledVector(acc,sdt);const sp=f.v.length(),mx=s.sp[1]*(pd<fearR?1.5:1);if(sp>mx)f.v.multiplyScalar(mx/sp);if(sp<s.sp[0])f.v.multiplyScalar(s.sp[0]/Math.max(sp,.01));f.p.addScaledVector(f.v,sdt);
    d.position.copy(f.p);this.q.setFromUnitVectors(V.FWD||(V.FWD=new V(0,0,1)),tmp.copy(f.v).normalize());d.quaternion.copy(this.q);d.scale.setScalar(s.len*(.85+(f.off%5)*.06));d.updateMatrix();s.im.setMatrixAt(f.off,d.matrix);}
   s.im.instanceMatrix.needsUpdate=true;s.dist=s.c.distanceTo(ppos);}
  // creatures
  for(const c of this.creatures){if(c.kind==='veilray')this.stepRay(c,dt);else if(c.kind==='razorjaw')this.stepRazor(c,dt,P,G);else if(c.kind==='jelly')this.stepJelly(c,dt,P,G);else if(c.kind==='crab')this.stepCrab(c,dt,P,G);else if(c.kind==='maw')this.stepMaw(c,dt,P,G);else if(c.kind==='shellback')this.stepTurtle(c,dt,P,G);}
  this.cullFar(ppos);if(this.tDirty){this.tDirty=false;this.tBody.computeBoundingSphere();this.tFront.computeBoundingSphere();}this.razorMesh.instanceMatrix.needsUpdate=true;this.jellyBell.instanceMatrix.needsUpdate=true;this.jellyThr.instanceMatrix.needsUpdate=true;this.crabMesh.instanceMatrix.needsUpdate=true;}
 stepRay(c,dt){c.a+=dt*c.dir*4/c.rad;const x=c.center.x+Math.cos(c.a)*c.rad,z=c.center.z+Math.sin(c.a)*c.rad;const fy=heightAt(x,z);const ty=Math.min(Math.max(fy+9,-60)+Math.sin(this.t*.13+c.ph.value)*5,-7);c.y=lerp(c.y,ty,dt*.25);
  const g=c.g;const np=new V(x,c.y,z);const dir=np.clone().sub(g.position);g.position.copy(np);if(dir.lengthSq()>1e-6){const yaw=Math.atan2(dir.x,dir.z);g.rotation.set(-dir.y*.5,yaw,-c.dir*.18);}c.pos=g.position;}
 stepRazor(c,dt,P,G){const D=this.diff;c.t+=dt;const to=this.tmp.copy(P.pos).sub(c.pos);const dist=to.length();const vis=P.depth>4&&!G.safe;
  if(c.scare>0){c.scare-=dt;c.state='flee';if(c.scare<=0)c.state='patrol';}
  else{const hd=c.home.distanceTo(P.pos),terr=18*D.notice;
   if(c.state==='patrol'&&hd<terr&&dist<30&&vis){c.state='warn';c.wt=0;G.territory&&G.territory(c);}
   else if(c.state==='warn'){c.wt+=dt;if(hd>terr*1.25||!vis)c.state='patrol';else if(c.wt>3.4/D.notice||dist<3.2){c.state='chase';G.alert&&G.alert('RAZORJAW',c);}}
   else if(c.state==='chase'&&(hd>terr*2.1||dist>48||!vis))c.state='patrol';}
  if(c.cd>0){c.cd-=dt;if(c.cd<=0&&c.state==='retreat')c.state='patrol';}
  let dir;if(c.state==='chase')dir=to.normalize();else if(c.state==='warn'){const a=c.t*1.3;dir=new V(P.pos.x+Math.cos(a)*7-c.pos.x,P.pos.y+1-c.pos.y,P.pos.z+Math.sin(a)*7-c.pos.z).normalize();}else if(c.state==='flee'||c.state==='retreat')dir=to.normalize().negate().add(new V(0,.2,0)).normalize();else dir=new V(Math.cos(c.t*.3),Math.sin(c.t*.5)*.15,Math.sin(c.t*.3)).add(c.home.clone().sub(c.pos).multiplyScalar(.04)).normalize();
  const sp=(c.state==='warn'?6.5:c.state==='chase'?(P.inSub?7:8.6):c.state==='flee'?12:c.state==='retreat'?9:3.5)*D.speed;c.vel.lerp(dir.multiplyScalar(sp),Math.min(1,dt*2.2));c.pos.addScaledVector(c.vel,dt);
  const fy=heightAt(c.pos.x,c.pos.z)+1.5;if(c.pos.y<fy)c.pos.y=fy;if(c.pos.y>-2.5)c.pos.y=-2.5;
  if(c.state==='chase'&&dist<(P.inSub?4.2:2.6)&&c.cd<=0){G.hurt(P.inSub?8*D.dmg:20*D.dmg,'RAZORJAW',c.pos);c.state='retreat';c.cd=4.5;}
  const d=this.d;d.position.copy(c.pos);d.lookAt(this.tmp.copy(c.pos).add(c.vel));d.scale.setScalar(3.2);d.updateMatrix();this.razorMesh.setMatrixAt(c.idx,d.matrix);}
 stepJelly(c,dt,P,G){c.t+=dt;c.pos.y+=Math.sin(c.t*2.2)*dt*.5;c.pos.x+=Math.sin(c.t*.11+c.idx)*dt*.35;c.pos.z+=Math.cos(c.t*.09+c.idx)*dt*.35;const d=this.d;d.position.copy(c.pos);d.rotation.set(Math.sin(c.t*.4)*.15,c.t*.1,Math.cos(c.t*.3)*.15);d.scale.setScalar(c.s);d.updateMatrix();
  this.jellyBell.setMatrixAt(c.idx,d.matrix);this.jellyThr.setMatrixAt(c.idx,d.matrix);if(!P.inSub&&c.pos.distanceToSquared(P.pos)<(2.4*c.s)**2&&(c.sting-=dt)<=0){c.sting=1.6;G.hurt(6*this.diff.dmg,'LANTERN JELLY',c.pos);}}
 stepCrab(c,dt,P,G){c.t+=dt;if(this.R()<.01)c.dir+=this.R()*2-1;const dp=c.pos.distanceTo(P.pos);const sp=dp<8&&!P.inSub?2.2:.8;if(dp<8)c.dir=Math.atan2(c.pos.z-P.pos.z,c.pos.x-P.pos.x);
  c.pos.x+=Math.cos(c.dir)*dt*sp;c.pos.z+=Math.sin(c.dir)*dt*sp;c.pos.y=heightAt(c.pos.x,c.pos.z)+.45;const d=this.d;d.position.copy(c.pos);d.rotation.set(0,-c.dir+Math.PI/2,0);d.scale.setScalar(1.1);d.updateMatrix();this.crabMesh.setMatrixAt(c.idx,d.matrix);
  if(dp<1.6&&!P.inSub&&(c.pinch-=dt)<=0){c.pinch=2;G.hurt(5*this.diff.dmg,'QUARTZBACK CRAB',c.pos);}}
 stepMaw(m,dt,P,G){const D=this.diff;m.t+=dt;m.stateT+=dt;if(m.cd>0)m.cd-=dt;const to=this.tmp.copy(P.pos).sub(m.pos),dist=to.length();
  const inTerr=weights(P.pos.x,P.pos.z).abyss>.08&&P.depth>45;const noticeR=(P.inSub?95:75)*D.notice*(P.light?1.15:1);
  let target=m.wp,speed=7*D.speed;
  if(m.state==='roam'){if(m.pos.distanceTo(m.wp)<12||m.stateT>40){const a=this.R()*TAU;const x=cl(150+this.R()*130,140,285),z=(this.R()*2-1)*260;const f=heightAt(x,z);m.wp.set(x,lerp(f+25,-70,this.R()*.7),z);m.stateT=0;}
   if(G.app==='play'&&inTerr&&dist<noticeR&&m.cd<=0){m.state='stalk';m.stateT=0;if(m.roared<=0){G.roar&&G.roar(m.pos);m.roared=25;}}}
  else if(m.state==='stalk'){const ang=m.t*.35;target=this.tmp2||(this.tmp2=new V());target.set(P.pos.x+Math.cos(ang)*30,P.pos.y+6,P.pos.z+Math.sin(ang)*30);speed=11*D.speed;
   if(!inTerr||dist>noticeR*1.6){m.state='roam';m.stateT=0;}else if(m.stateT>(5.5-D.notice*1.5)){m.state='charge';m.stateT=0;G.roar&&G.roar(m.pos,1);}}
  else if(m.state==='charge'){target=P.pos;speed=(P.inSub?20:17)*D.speed;m.open=Math.min(1,m.open+dt*2);
   if(dist<(P.inSub?7:5.5)){G.hurt((P.inSub?34:55)*D.dmg,'HOLLOWMAW',m.pos,true);m.state='retreat';m.stateT=0;m.cd=14;}else if(m.stateT>6){m.state='retreat';m.stateT=0;m.cd=6;}}
  else if(m.state==='retreat'){target=this.tmp2||(this.tmp2=new V());target.copy(m.pos).add(to.clone().negate().setLength(40));target.y=Math.min(target.y,-60);speed=14*D.speed;if(m.stateT>9){m.state='roam';m.stateT=0;}}
  if(m.state!=='charge')m.open=Math.max(0,m.open-dt*1.2);m.roared-=dt;
  // steering (keeps to the deep east)
  const want=new V().copy(target).sub(m.pos);if(want.lengthSq()>1e-4)want.normalize();if(m.pos.x<120)want.x+=.8;const fy=heightAt(m.pos.x,m.pos.z);if(m.pos.y<fy+6)want.y+=1.2;if(m.pos.y>-30)want.y-=1;want.normalize();
  m.vel.lerp(want.multiplyScalar(speed),Math.min(1,dt*(m.state==='charge'?1.6:.9)));m.pos.addScaledVector(m.vel,dt);m.pos.x=cl(m.pos.x,95,WORLD-5);m.pos.z=cl(m.pos.z,-WORLD+5,WORLD-5);
  // trail + segments
  const tr=m.trail;if(tr[0].distanceToSquared(m.pos)>.36){tr.pop();tr.unshift(m.pos.clone());}
  m.head.position.copy(m.pos);const fwd=this.tmp3||(this.tmp3=new V());fwd.copy(m.vel);if(fwd.lengthSq()<.01)fwd.set(0,0,1);m.head.lookAt(fwd.add(m.pos));
  m.petals.forEach((p,i)=>{p.rotation.x=-(.08+m.open*.75+Math.sin(m.t*3+i)*.04);});
  const d=this.d;for(let i=0;i<this.NS;i++){const k=Math.min(tr.length-2,Math.floor((i+1)*3.8));const a=tr[k],b=tr[k+1];const sc=lerp(2.1,.45,Math.pow(i/(this.NS-1),1.3))*(i<2?1.05:1);
   const sw=Math.sin(m.t*2.4-i*.5)*Math.min(1,i*.2)*.9;d.position.copy(a);d.position.x+=sw*(a.z-b.z);d.position.z-=sw*(a.x-b.x);d.lookAt(this.tmp.copy(a).sub(b).add(d.position));d.scale.set(sc,sc,sc*1.15);d.updateMatrix();this.mawSeg.setMatrixAt(i,d.matrix);this.mawFrill.setMatrixAt(i,d.matrix);}
  this.mawSeg.instanceMatrix.needsUpdate=true;this.mawFrill.instanceMatrix.needsUpdate=true;}
 cullFar(p){const near=(v,r)=>v.distanceToSquared(p)<r*r;const vis={};for(const s of this.schools)if(s.dist<170)vis[s.kind]=1;for(const s of this.schools)s.im.visible=!!vis[s.kind];
  let rz=false,cr=false,je=false;for(const c of this.creatures){if(c.kind==='razorjaw'&&!rz)rz=near(c.pos,160);else if(c.kind==='crab'&&!cr)cr=near(c.pos,140);else if(c.kind==='jelly'&&!je)je=near(c.pos,150);else if(c.kind==='veilray')c.g.visible=near(c.g.position,175);}
  this.razorMesh.visible=rz;this.crabMesh.visible=cr;this.jellyBell.visible=this.jellyThr.visible=je;const mv=near(this.maw.pos,230);this.mawSeg.visible=this.mawFrill.visible=this.maw.head.visible=mv;}
 /* scare predators near a point (flare, knife, shock pulse) */
 scare(p,r,t,maw=false){let n=0;for(const c of this.creatures){if(c.kind==='razorjaw'&&c.pos.distanceTo(p)<r){c.scare=t;n++;}if(c.kind==='maw'&&maw&&c.pos.distanceTo(p)<r*1.4&&c.state!=='roam'){c.state='retreat';c.stateT=0;c.cd=16;n++;}}return n;}
 /* candidates for scanning: {kind,pos,size} */
 targets(){const out=[];for(const c of this.creatures){out.push({kind:c.kind,pos:c.pos||c.g.position,size:c.size});}for(const s of this.schools)out.push({kind:s.kind,pos:s.c,size:2.5});return out;}
 /* try to catch an edible fish in front of the player */
 catchFish(pos,dir){let best=null,bd=2.6;for(const s of this.schools){if(s.dist>30)continue;for(const f of s.f){if(f.gone)continue;const v=this.tmp.copy(f.p).sub(pos);const dd=v.length();if(dd<bd&&v.normalize().dot(dir)>.5){bd=dd;best={s,f};}}}
  if(best){best.f.gone=40;return best.s.kind;}return null;}
}
