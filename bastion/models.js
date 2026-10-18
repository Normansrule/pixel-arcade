// BASTION LINE — procedural low-poly models (no model files): every model is a list of primitives merged into one vertex-coloured
// geometry per layer (solid + unlit glow). Towers get a static base and a turning head, with extra pieces for each upgrade tier
// (blue trim = path A, red trim = path B, gold = tier 3). Enemies are instanced per type, with separate wing parts for flyers.
import * as THREE from '../vendor/three.module.min.js';

const C=new THREE.Color(),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),Eu=new THREE.Euler(),Vs=new THREE.Vector3(),Vp=new THREE.Vector3();
const G={box:new THREE.BoxGeometry(1,1,1),sph:new THREE.IcosahedronGeometry(.5,1),sph2:new THREE.IcosahedronGeometry(.5,2),ico:new THREE.IcosahedronGeometry(.5,0),dod:new THREE.DodecahedronGeometry(.5,0),
 cyl:new THREE.CylinderGeometry(.5,.5,1,14),cyl6:new THREE.CylinderGeometry(.5,.5,1,6),cyl8:new THREE.CylinderGeometry(.5,.5,1,8),cone:new THREE.ConeGeometry(.5,1,12),cone4:new THREE.ConeGeometry(.5,1,4),cone6:new THREE.ConeGeometry(.5,1,6),
 oct:new THREE.OctahedronGeometry(.5,0),tor:new THREE.TorusGeometry(.5,.08,6,24),tcyl:new THREE.CylinderGeometry(.38,.5,1,12),tcyl8:new THREE.CylinderGeometry(.42,.5,1,8),hemi:new THREE.SphereGeometry(.5,14,8,0,Math.PI*2,0,Math.PI/2),
 wedge:new THREE.CylinderGeometry(0,.5,1,3),ring:new THREE.TorusGeometry(.5,.035,4,32),cap:new THREE.CapsuleGeometry(.5,1,3,8)};
for(const k in G)G[k]=G[k].index?G[k].toNonIndexed():G[k];
// item: [geo, colour, [x,y,z], [sx,sy,sz], [rx,ry,rz]]
export function merge(list){if(!list.length)return null;let n=0;for(const it of list)n+=G[it[0]].attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),Cc=new Float32Array(n*3);let o=0;const nm=new THREE.Matrix3();
 for(const[g,col,p=[0,0,0],s=[1,1,1],r=[0,0,0]]of list){const geo=G[g],pa=geo.attributes.position,na=geo.attributes.normal;C.set(col);
  Eu.set(r[0],r[1],r[2]);Q.setFromEuler(Eu);M4.compose(Vp.set(p[0],p[1],p[2]),Q,Vs.set(s[0],s[1],s[2]));nm.getNormalMatrix(M4);
  for(let i=0;i<pa.count;i++){Vp.fromBufferAttribute(pa,i).applyMatrix4(M4);P[o*3]=Vp.x;P[o*3+1]=Vp.y;P[o*3+2]=Vp.z;Vp.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N[o*3]=Vp.x;N[o*3+1]=Vp.y;N[o*3+2]=Vp.z;
   const sh=.8+.2*Math.max(0,Vp.y);Cc[o*3]=C.r*sh;Cc[o*3+1]=C.g*sh;Cc[o*3+2]=C.b*sh;o++;}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('color',new THREE.BufferAttribute(Cc,3));geo.computeBoundingSphere();return geo;}
function rim(m,k=.4,c='.75,.8,1.'){m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{vec3 vn=normalize(vNormal);float rm=pow(1.-abs(dot(vn,normalize(vViewPosition))),2.6);gl_FragColor.rgb+=vec3('+c+')*rm*'+k.toFixed(2)+';}');};m.customProgramCacheKey=()=>'rim'+k+c;return m;}
export const MAT={solid:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.08}),metal:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.38,metalness:.55}),
 unit:rim(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.15}),.5,'1.,.6,.45'),hero:rim(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.3}),.7,'.6,.85,1.'),
 glow:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}),ghost:new THREE.MeshBasicMaterial({color:'#9affb0',transparent:true,opacity:.42,depthWrite:false})};
const STONE='#9a948a',STONE2='#7e786e',STONE3='#b4ada0',WOOD='#8a5a34',WOOD2='#6a4226',ROOF='#3a5a8a',IRON='#4a4e56',BRASS='#c89a40',GOLD='#ffd050',PA='#3f7ae0',PB='#d8463a';
const ring=(n,r,y,f)=>{const o=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.push(f(Math.cos(a)*r,Math.sin(a)*r,a,i));}return o;};
// a stone plinth every tower stands on; trim ring shows which path is upgraded
function plinth(a,b,h=.7,r=1.15){const L=[['cyl8',STONE2,[0,h/2-.05,0],[r*2.1,h,r*2.1]],['cyl8',STONE3,[0,h,0],[r*2.2,.14,r*2.2]],
 ...ring(8,r*1.02,0,(x,z,ang,i)=>['box',i%2?STONE:STONE2,[x,h*.45,z],[.5,h*.7,.3],[0,-ang,0]])];
 const tc=a>b?PA:b>a?PB:a?'#b8a8ff':null;if(tc)L.push(['ring',tc,[0,h+.04,0],[r*2.14,r*2.14,2],[1.5708,0,0]]);if(a===3||b===3)L.push(['ring',GOLD,[0,h+.1,0],[r*1.96,r*1.96,2],[1.5708,0,0]]);return L;}
const banner=(x,y,z,c,h=1)=>[['cyl','#5a4030',[x,y+h*.6,z],[.06,h*1.2,.06]],['box',c,[x+.22,y+h*.95,z],[.42,.5*h,.03]],['cone',GOLD,[x,y+h*1.25,z],[.1,.16,.1]]];
// returns {s,h,g,hg,headY,muzzle}: s/g static solid+glow, h/hg head solid+glow (rotates about y), muzzle in head space
const TM={
 archer(a,b){const s=plinth(a,b),h=[],g=[],hg=[];const H=.7;
  for(const[x,z]of[[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])s.push(['box',WOOD2,[x,H+1,z],[.2,2,.2]]);s.push(['box',WOOD2,[0,H+.8,0],[1.5,.12,.12],[0,.78,0]],['box',WOOD2,[0,H+.8,0],[1.5,.12,.12],[0,-.78,0]]);
  s.push(['box',WOOD,[0,H+2.05,0],[1.9,.18,1.9]]);for(const[x,z,w,d]of[[0,.9,1.9,.12],[0,-.9,1.9,.12],[.9,0,.12,1.9],[-.9,0,.12,1.9]])s.push(['box',WOOD,[x,H+2.4,z],[w,.55,d]]);
  for(let i=0;i<4;i++){const ax=i%2?.9:-.9,az=i<2?.9:-.9;s.push(['box',WOOD2,[ax,H+2.75,az],[.18,.4,.18]]);}
  if(a>=1)s.push(...banner(-.85,H+2.4,-.85,PA,1+a*.25));if(b>=1)s.push(...banner(.85,H+2.4,-.85,PB,1+b*.25));
  if(a>=2||b>=2){s.push(['cone4',a>=b?'#2d4f86':'#8a2e28',[0,H+4.2,0],[2.9,1.4,2.9],[0,Math.PI/4,0]]);for(const[x,z]of[[-.85,-.85],[.85,-.85],[-.85,.85],[.85,.85]])s.push(['box',WOOD2,[x,H+3.1,z],[.12,1.4,.12]]);}
  // head: crossbow on a swivel
  const bw=1.2+b*.25;h.push(['cyl',IRON,[0,0,0],[.35,.25,.35]],['box',WOOD,[0,.25,.2],[.18,.16,1.2]],['box',WOOD2,[0,.3,.7],[bw,.1,.12]],['box','#e8e0d0',[0,.3,.45],[bw*.9,.02,.02]],['cone',IRON,[0,.34,1.05],[.08,.25,.08],[1.57,0,0]]);
  for(let i=1;i<Math.min(3,1+a);i++)h.push(['box',WOOD2,[0,.3+i*.2,.6],[bw*.85,.08,.1]]);if(b>=2)h.push(['cyl','#1a1a20',[.15,.48,.3],[.08,.5,.08],[1.57,0,0]]);if(b>=3)hg.push(['box','#ff5a40',[.15,.48,.56],[.06,.06,.02]]);if(a>=3)hg.push(['box','#7ab8ff',[0,.52,.6],[bw*.9,.04,.04]]);
  return{s,h,g,hg,headY:H+2.3,muzzle:[0,.35,1.1]};},
 cannon(a,b){const s=plinth(a,b,.5,1.3),h=[],g=[],hg=[];const H=.5,R=1.15;
  s.push(['tcyl',STONE,[0,H+.9,0],[R*2,1.8,R*2]],['cyl',STONE3,[0,H+1.85,0],[R*2.1,.2,R*2.1]],...ring(8,R*.92,0,(x,z,ang,i)=>['box',i%2?STONE:STONE2,[x,H+2.15,z],[.42,.4,.32],[0,-ang,0]]));
  s.push(['box','#3a3530',[0,H+.6,R*.98],[.5,.8,.1]],['box',WOOD2,[0,H+.62,R*1.0],[.42,.72,.06]]);if(a)s.push(...banner(R*.7,H+1.9,-R*.7,PA,.9+a*.2));if(b)s.push(...banner(-R*.7,H+1.9,-R*.7,PB,.9+b*.2));
  if(b>=1)s.push(...ring(6,R*1.05,0,(x,z,ang)=>['box',IRON,[x,H+1.1,z],[.18,1.4,.12],[0,-ang,0]]));
  const len=1.5+b*.25,rad=.32+b*.06,nb=a>=2?2:1;h.push(['box',WOOD2,[0,.15,0],[1.1,.3,1.1]],['box',WOOD,[.45,.45,0],[.12,.5,.8]],['box',WOOD,[-.45,.45,0],[.12,.5,.8]]);
  for(let i=0;i<nb;i++){const ox=nb>1?(i?.24:-.24):0;h.push(['cyl',b>=3?'#3a3a40':'#b08040',[ox,.6,.5],[rad*2,len,rad*2],[1.57,0,0]],['cyl',b>=3?'#2a2a30':'#8a6030',[ox,.6,.5+len/2],[rad*2.4,.22,rad*2.4],[1.57,0,0]],['sph','#8a6030',[ox,.6,-.2],[rad*2.2,rad*2.2,rad*2.2]]);}
  if(a>=3)hg.push(['cyl','#ff8a30',[0,.6,.52+len/2],[rad*1.6,.05,rad*1.6],[1.57,0,0]]);
  return{s,h,g,hg,headY:H+2,muzzle:[0,.6,.6+len/2]};},
 frost(a,b){const s=plinth(a,b,.6,1.05),h=[],g=[],hg=[];const H=.6,ICE='#bfe8ff';
  s.push(['tcyl8','#c8d4e0',[0,H+.5,0],[1.4,1,1.4]],['cyl8','#9ab0c8',[0,H+1.05,0],[1.5,.12,1.5]]);
  for(let i=0;i<5;i++){const ang=i/5*6.28,r=.45;s.push(['oct',i%2?'#a8dcff':'#d8f2ff',[Math.cos(ang)*r,H+1.6,Math.sin(ang)*r],[.35,1.4+(i%2)*.5,.35],[Math.sin(ang)*.3,0,Math.cos(ang)*.3]]);}
  g.push(['oct','#9ae8ff',[0,H+3.3+b*.2,0],[.7+a*.12,1.3+a*.2,.7+a*.12]]);g.push(['ring','#bff4ff',[0,H+3.3+b*.2,0],[1.8+b*.4,1.8+b*.4,1.8+b*.4],[1.57,0,0]]);
  if(b>=2)g.push(['ring','#bff4ff',[0,H+3.3+b*.2,0],[2.6+b*.3,2.6+b*.3,2.6+b*.3],[1.2,0,.4]]);if(a>=2)for(let i=0;i<3;i++){const ang=i/3*6.28;g.push(['oct',ICE,[Math.cos(ang)*.9,H+2.6,Math.sin(ang)*.9],[.25,.6,.25]]);}
  if(a>=3)s.push(['cyl8',GOLD,[0,H+1.2,0],[1.2,.08,1.2]]);return{s,h,g,hg,headY:H+3.3,muzzle:[0,0,0],spin:1};},
 tesla(a,b){const s=plinth(a,b,.5,1.1),h=[],g=[],hg=[];const H=.5;s.push(['cyl8',IRON,[0,H+.3,0],[1.6,.6,1.6]]);
  const n=4+b;for(let i=0;i<n;i++){s.push(['cyl',i%2?'#c87a3a':'#2e3138',[0,H+.8+i*.42,0],[1.1-i*.08,.36,1.1-i*.08]]);if(i%2)s.push(['tor','#e0a050',[0,H+.8+i*.42,0],[1.2-i*.08,1.2-i*.08,1.6],[1.57,0,0]]);}
  const top=H+.8+n*.42;s.push(['cyl',IRON,[0,top,0],[.16,.6,.16]]);g.push(['sph2','#d8b0ff',[0,top+.55,0],[.8+b*.12,.8+b*.12,.8+b*.12]]);g.push(['ring','#c890ff',[0,top+.55,0],[1.3,1.3,1.3],[1.2,.3,0]]);
  for(let i=0;i<Math.min(3,a+(a?1:0));i++){const ang=i/3*6.28+.5,x=Math.cos(ang)*1.15,z=Math.sin(ang)*1.15;s.push(['cyl',IRON,[x,H+1.1,z],[.14,1.6,.14]],['cyl','#c87a3a',[x,H+1.4,z],[.3,.5,.3]]);g.push(['sph','#c8a0ff',[x,H+2,z],[.3,.3,.3]]);}
  return{s,h,g,hg,headY:top+.55,muzzle:[0,0,0],orb:[0,top+.55,0]};},
 mortar(a,b){const s=[['cyl8',STONE2,[0,.2,0],[2.6,.4,2.6]]],h=[],g=[],hg=[];
  for(let i=0;i<12;i++){const ang=i/12*6.28;s.push(['cap','#b0a078',[Math.cos(ang)*1.15,.6,Math.sin(ang)*1.15],[.42,.36,.6],[0,-ang,1.57]]);}for(let i=0;i<8;i++){const ang=i/8*6.28+.3;s.push(['cap','#a49470',[Math.cos(ang)*1.1,.92,Math.sin(ang)*1.1],[.38,.3,.55],[0,-ang,1.57]]);}
  if(a)s.push(...banner(1.2,.9,-.4,PA,.8+a*.2));if(b)s.push(...banner(-1.2,.9,-.4,PB,.8+b*.2));if(a>=2)s.push(['box','#6a3a20',[.6,.5,.6],[.4,.5,.4]],['box','#6a3a20',[-.5,.5,.7],[.4,.5,.4]]);
  const rad=.42+b*.07;h.push(['cyl',IRON,[0,.15,0],[1,.3,1]],['box',WOOD2,[0,.4,0],[.9,.3,.6]],['cyl',b>=3?'#2a2a30':'#3a3c42',[0,.95,.25],[rad*2,1.3,rad*2],[-.75,0,0]],['cyl','#2a2c30',[0,1.45,.68],[rad*2.3,.25,rad*2.3],[-.75,0,0]]);
  if(a>=1)hg.push(['cyl','#ff7a20',[0,1.55,.77],[rad*1.7,.05,rad*1.7],[-.75,0,0]]);return{s,h,g,hg,headY:.5,muzzle:[0,1.5,.75]};},
 sniper(a,b){const s=plinth(a,b,.5,.95),h=[],g=[],hg=[];const H=.5;
  s.push(['tcyl8',STONE,[0,H+2,0],[1.5,4,1.5]],['cyl8',STONE3,[0,H+4.05,0],[1.9,.2,1.9]],...ring(6,.82,0,(x,z,ang,i)=>['box',i%2?STONE:STONE2,[x,H+4.35,z],[.36,.45,.26],[0,-ang,0]]));
  s.push(['box','#2a2a30',[0,H+2.6,.72],[.24,.5,.06]],['box','#2a2a30',[0,H+1.4,.72],[.24,.5,.06]]);if(a)s.push(...banner(.6,H+4.2,-.6,PA,.9+a*.2));if(b)s.push(...banner(-.6,H+4.2,-.6,PB,.9+b*.2));
  const bl=2.2+a*.3,nb=b>=3?2:1;h.push(['box','#4a5a3a',[0,.2,0],[.5,.4,.6]],['sph','#c89a78',[0,.6,-.2],[.32,.32,.32]],['hemi','#4a6a3a',[0,.68,-.2],[.4,.3,.4]]);
  for(let i=0;i<nb;i++){const ox=nb>1?(i?.12:-.12):0;h.push(['cyl',a>=3?BRASS:'#2a2a30',[ox,.42,bl/2],[.1,bl,.1],[1.57,0,0]]);}h.push(['box',WOOD,[0,.36,.2],[.14,.16,.8]],['cyl','#1a1a1e',[0,.58,.5],[.12,.5,.12],[1.57,0,0]]);hg.push(['cyl','#9affb0',[0,.58,.76],[.08,.02,.08],[1.57,0,0]]);
  return{s,h,g,hg,headY:H+4.2,muzzle:[0,.42,bl]};},
 mint(a,b){const s=plinth(a,b,.4,1.25),h=[],g=[],hg=[];const H=.4;
  s.push(['box','#d8c8a0',[0,H+.8,0],[2,1.6,1.7]],['box','#b8a880',[0,H+.08,0],[2.15,.16,1.85]],['cone4',a>=2?'#e0b040':'#8a3a2a',[0,H+2.15,0],[2.7,1.2,2.4],[0,Math.PI/4,0]],['box','#5a3a20',[0,H+.55,.86],[.5,.9,.06]]);
  for(const x of[-.6,.6])s.push(['box','#4a6a9a',[x,H+1.05,.86],[.36,.36,.05]]);s.push(['box',STONE2,[.6,H+2.3,-.4],[.3,1,.3]]);if(b>=1)s.push(['box',IRON,[-1.25,H+.5,0],[.5,.9,1]],['box',GOLD,[-1.26,H+.55,0],[.52,.12,.6]]);
  if(b>=2)s.push(...banner(-1,H+1.6,.8,PB,.9));if(a>=1)s.push(['cyl',GOLD,[.95,H+.2,.95],[.4,.3,.4]],['cyl',GOLD,[1,H+.4,.95],[.35,.12,.35]]);
  g.push(['cyl','#ffd860',[0,0,0],[1+a*.15,.16,1+a*.15],[1.57,0,0]]);g.push(['cyl','#fff0a0',[0,0,0],[.6+a*.1,.18,.6+a*.1],[1.57,0,0]]);
  return{s,h,g,hg,headY:H+3.4,muzzle:[0,0,0],coin:1};}};
const towerCache={};
export function towerParts(type,a,b){const k=type+a+b;if(towerCache[k])return towerCache[k];const d=TM[type](a,b);return towerCache[k]={...d,s:merge(d.s),h:merge(d.h),g:merge(d.g),hg:merge(d.hg)};}
export function towerModel(type,a,b,ghost){const d=towerParts(type,a,b);const root=new THREE.Group(),head=new THREE.Group();head.position.y=d.headY;root.add(head);
 const mk=(geo,mat,par,shadow)=>{if(!geo)return null;const m=new THREE.Mesh(geo,ghost?MAT.ghost:mat);m.castShadow=shadow&&!ghost;m.receiveShadow=!ghost;par.add(m);return m;};
 mk(d.s,MAT.solid,root,true);const gm=mk(d.g,MAT.glow,root,false);mk(d.h,MAT.metal,head,true);mk(d.hg,MAT.glow,head,false);
 if((d.spin||d.coin)&&gm){gm.position.y=d.coin?d.headY:0;}
 return{root,head,glow:gm,d};}
/* ---------------- enemies ---------------- */
const SKIN='#c89a78',DARK='#2a2228',RUST='#8a3a24',ASH='#5a4a48';
const EM={
 raider:{s:[['box',RUST,[0,.85,0],[.6,.6,.38]],['box','#4a3a30',[0,.5,0],[.62,.2,.42]],['box',ASH,[-.16,.25,0],[.2,.5,.22]],['box',ASH,[.16,.25,0],[.2,.5,.22]],['sph',SKIN,[0,1.35,0],[.38,.4,.38]],['hemi','#6a6a72',[0,1.42,0],[.46,.4,.46]],
  ['box','#6a6a72',[0,1.42,.2],[.08,.3,.06]],['cyl',WOOD2,[.38,1,.15],[.06,1.8,.06],[.25,0,0]],['cone','#9a9aa0',[.38,1.9,.38],[.1,.3,.1],[.25,0,0]],['box','#6a2a20',[0,.95,-.24],[.5,.8,.06],[.15,0,0]]],g:[['box','#ffb050',[0,1.38,.19],[.2,.05,.02]]],sc:1},
 runner:{s:[['box','#6a3a2a',[0,.8,0],[.46,.5,.32],[.35,0,0]],['box',ASH,[-.13,.3,.05],[.16,.55,.18]],['box',ASH,[.13,.3,-.05],[.16,.55,.18]],['sph',SKIN,[0,1.2,.22],[.32,.34,.32]],['cone','#c8662a',[0,1.32,.16],[.42,.5,.42],[-.3,0,0]],
  ['box','#e0e0e8',[.3,.8,.3],[.05,.05,.5]],['box','#e0e0e8',[-.3,.8,.3],[.05,.05,.5]],['box','#d8702a',[0,1.02,-.05],[.5,.12,.3]]],g:[['box','#ffe080',[0,1.24,.38],[.18,.04,.02]]],sc:.9},
 brute:{s:[['box','#6a6e78',[0,1.05,0],[1.1,.9,.7]],['box','#4a4e58',[0,.55,0],[.9,.3,.6]],['box',DARK,[-.25,.3,0],[.3,.6,.34]],['box',DARK,[.25,.3,0],[.3,.6,.34]],['sph','#7a7e88',[-.65,1.35,0],[.5,.42,.5]],['sph','#7a7e88',[.65,1.35,0],[.5,.42,.5]],
  ['box','#5a5e68',[0,1.68,.05],[.52,.5,.5]],['cone','#d8d0c0',[-.32,1.98,0],[.12,.4,.12],[0,0,.5]],['cone','#d8d0c0',[.32,1.98,0],[.12,.4,.12],[0,0,-.5]],['box','#7a7e88',[.72,.9,.25],[.2,.7,.2]],['dod','#3a3a40',[.72,.6,.45],[.45,.45,.45]],['box','#8a3a24',[0,1.05,.36],[.6,.5,.04]]],g:[['box','#ff7040',[0,1.7,.31],[.32,.06,.02]]],sc:1.15},
 harpy:{s:[['sph','#4a3a5a',[0,1,0],[.6,.55,.85]],['sph','#c8a890',[0,1.3,.45],[.34,.34,.34]],['cone','#e0b040',[0,1.27,.66],[.1,.22,.1],[1.57,0,0]],['cone','#3a2a4a',[0,.95,-.6],[.4,.7,.2],[-1.4,0,0]],['box','#2a2030',[-.15,.55,.1],[.08,.4,.08]],['box','#2a2030',[.15,.55,.1],[.08,.4,.08]]],
  g:[['box','#9af0ff',[-.08,1.35,.6],[.05,.05,.02]],['box','#9af0ff',[.08,1.35,.6],[.05,.05,.02]]],wing:[['box','#5a4a7a',[.7,0,0],[1.4,.06,.6]],['box','#7a6a9a',[1.3,0,-.15],[.6,.05,.4]]],wy:1.1,sc:1},
 aegis:{s:[['box','#8a8a96',[0,.95,0],[.7,.7,.45]],['box','#5a5a66',[0,.45,0],[.6,.25,.4]],['box',DARK,[-.16,.22,0],[.22,.45,.24]],['box',DARK,[.16,.22,0],[.22,.45,.24]],['sph2','#9a9aa8',[0,1.5,0],[.46,.5,.46]],['box','#2a2a30',[0,1.5,.2],[.3,.08,.1]],
  ['box','#c8b070',[-.5,1,.3],[.12,1.3,.9]],['box','#3a6ac0',[-.57,1,.3],[.04,.8,.5]],['cone','#c8b070',[0,1.85,0],[.1,.3,.1]]],g:[['box','#9ad8ff',[0,1.52,.25],[.24,.04,.02]]],sc:1.05},
 brood:{s:[['sph2','#6a3a7a',[0,.95,0],[1.3,1.1,1.4]],['sph2','#7a4a8a',[0,1.3,-.2],[.9,.8,.9]],['box','#3a2040',[-.4,.25,.3],[.12,.5,.12]],['box','#3a2040',[.4,.25,.3],[.12,.5,.12]],['box','#3a2040',[-.4,.25,-.3],[.12,.5,.12]],['box','#3a2040',[.4,.25,-.3],[.12,.5,.12]]],
  g:[['sph','#c8ff60',[.4,1.2,.4],[.22,.22,.22]],['sph','#c8ff60',[-.35,1.4,.3],[.18,.18,.18]],['sph','#c8ff60',[.1,1.6,-.3],[.2,.2,.2]],['sph','#c8ff60',[-.5,.9,-.2],[.16,.16,.16]]],sc:1},
 broodling:{s:[['sph2','#7a4a8a',[0,.45,0],[.6,.5,.7]],['box','#3a2040',[-.2,.12,.1],[.06,.25,.06]],['box','#3a2040',[.2,.12,.1],[.06,.25,.06]]],g:[['sph','#c8ff60',[0,.6,.25],[.14,.14,.14]]],sc:1},
 mender:{s:[['cone','#3a7a5a',[0,.8,0],[.8,1.5,.8]],['sph',SKIN,[0,1.62,0],[.34,.36,.34]],['cone','#2a5a40',[0,1.8,-.03],[.46,.55,.46]],['cyl',WOOD,[.4,1,.2],[.06,2,.06]],['box','#e0d8b0',[0,1.1,.36],[.12,.5,.04]]],
  g:[['sph2','#7aff9a',[.4,2.1,.2],[.32,.32,.32]],['box','#7aff9a',[0,1.62,.17],[.18,.04,.02]]],sc:1},
 jugg:{s:[['box','#5a5258',[0,1.5,0],[1.8,1.4,2.6]],['box','#7a6e6a',[0,2.2,-.1],[1.6,.3,2.2]],['box','#3a3438',[-.6,.5,.8],[.5,1,.5]],['box','#3a3438',[.6,.5,.8],[.5,1,.5]],['box','#3a3438',[-.6,.5,-.8],[.5,1,.5]],['box','#3a3438',[.6,.5,-.8],[.5,1,.5]],
  ['box','#6a6268',[0,1.6,1.55],[1,.9,.8]],['cone','#e0d8c8',[-.45,2.1,1.7],[.18,.8,.18],[.8,0,.4]],['cone','#e0d8c8',[.45,2.1,1.7],[.18,.8,.18],[.8,0,-.4]],['box','#8a3a24',[0,1.5,0],[1.85,.4,1.6]],['box','#9a9aa0',[0,2.5,-.6],[.3,.5,.3]],['box','#9a9aa0',[0,2.5,.3],[.3,.5,.3]]],
  g:[['box','#ff5030',[-.25,1.75,1.96],[.14,.1,.02]],['box','#ff5030',[.25,1.75,1.96],[.14,.1,.02]]],sc:1.1},
 colossus:{s:[['box','#4a4650',[0,3.4,0],[2.8,2.6,1.8]],['box','#5a5660',[0,2,0],[2.2,1,1.5]],['box','#3a363e',[-.7,1,0],[.9,2,1]],['box','#3a363e',[.7,1,0],[.9,2,1]],['box','#5a5660',[0,5.1,.1],[1.3,1,1.2]],
  ['sph','#6a6670',[-1.9,4.3,0],[1.4,1.2,1.4]],['sph','#6a6670',[1.9,4.3,0],[1.4,1.2,1.4]],['box','#4a4650',[-2.1,2.8,.2],[.8,2.4,.8]],['box','#4a4650',[2.1,2.8,.2],[.8,2.4,.8]],['dod','#3a363e',[-2.1,1.4,.3],[1.2,1.2,1.2]],['dod','#3a363e',[2.1,1.4,.3],[1.2,1.2,1.2]],
  ['cone','#8a3a24',[-.5,5.9,0],[.3,.9,.3],[0,0,.3]],['cone','#8a3a24',[.5,5.9,0],[.3,.9,.3],[0,0,-.3]],['box','#8a3a24',[0,3.4,.92],[1.6,.4,.06]]],
  g:[['sph2','#ff6a20',[0,3.5,.86],[.9,.9,.4]],['box','#ffb040',[-.3,5.2,.71],[.25,.12,.02]],['box','#ffb040',[.3,5.2,.71],[.25,.12,.02]],['box','#ff8a30',[-1.9,4.3,.7],[.5,.12,.02]],['box','#ff8a30',[1.9,4.3,.7],[.5,.12,.02]]],sc:1.45}};
const enemyCache={};
export function enemyGeo(type){if(enemyCache[type])return enemyCache[type];const d=EM[type];return enemyCache[type]={s:merge(d.s),g:merge(d.g),wing:d.wing?merge(d.wing):null,wy:d.wy||0,sc:d.sc};}
/* ---------------- heroes ---------------- */
export function heroModel(type){const s=[],g=[],w=[];
 if(type==='wren'){s.push(['box','#3a5aa0',[0,1.05,0],[.7,.75,.45]],['box','#c8c8d0',[0,1.15,.05],[.76,.5,.5]],['sph','#d8d8e0',[-.45,1.4,0],[.36,.3,.36]],['sph','#d8d8e0',[.45,1.4,0],[.36,.3,.36]],['box','#2a3a60',[-.17,.35,0],[.24,.7,.26]],['box','#2a3a60',[.17,.35,0],[.24,.7,.26]],
   ['sph2','#c8c8d0',[0,1.75,0],[.46,.5,.46]],['cone','#3a6ad8',[0,2.15,-.05],[.12,.5,.5],[-.3,0,0]],['box','#1a1a2a',[0,1.75,.22],[.3,.06,.06]],['box','#2a4ab0',[0,1,-.3],[.7,1.2,.06],[.12,0,0]]);
  w.push(['cyl','#c8b080',[.5,1.2,.6],[.08,3,.08],[1.3,0,0]],['cone','#e0e8ff',[.5,1.48,2.05],[.16,.6,.16],[1.3,0,0]],['box','#3a6ad8',[.5,1.32,1.55],[.03,.3,.36],[1.3,0,0]]);g.push(['box','#9ad8ff',[0,1.76,.25],[.22,.03,.02]]);}
 else{s.push(['cone','#5a3a8a',[0,.9,0],[.95,1.8,.95]],['box','#7a5ab0',[0,1.4,0],[.6,.5,.4]],['sph',SKIN,[0,1.9,0],[.36,.38,.36]],['cone','#3a2a6a',[0,2.35,-.05],[.6,.9,.6],[-.15,0,0]],['box','#e8d070',[0,1.42,.21],[.5,.08,.02]]);
  w.push(['cyl','#4a3020',[.5,1.3,.1],[.07,2.4,.07]],['tor','#e8d070',[.5,2.5,.1],[.4,.4,.4]]);g.push(['sph2','#d8a0ff',[.5,2.5,.1],[.36,.36,.36]],['box','#e0c0ff',[0,1.92,.18],[.2,.04,.02]]);}
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);const mk=(L,mat,par)=>{if(!L.length)return;const m=new THREE.Mesh(merge(L),mat);m.castShadow=true;par.add(m);return m;};
 mk(s,MAT.hero,body);const arm=new THREE.Group();body.add(arm);mk(w,MAT.hero,arm);const gm=new THREE.Mesh(merge(g),MAT.glow);body.add(gm);body.scale.setScalar(1.25);return{root,body,arm};}
/* ---------------- landmarks: the bastion keep and the spawn gates ---------------- */
export function keepModel(){const s=[],g=[];const W='#b8b0a0',W2='#9a9284';
 s.push(['box',W2,[0,.4,0],[7,.8,7]]);for(const[x,z]of[[-3,-3],[3,-3],[-3,3],[3,3]]){s.push(['cyl8',W,[x,2.6,z],[2.2,5.2,2.2]],['cyl8',W2,[x,5.3,z],[2.6,.3,2.6]],['cone8'in G?'cone8':'cone','#3a5a9a',[x,6.6,z],[2.8,2.4,2.8]],['cone',GOLD,[x,7.9,z],[.16,.4,.16]]);}
 for(const[x,z,w,d]of[[0,-3,4.2,.9],[0,3,4.2,.9],[-3,0,.9,4.2],[3,0,.9,4.2]]){s.push(['box',W,[x,1.9,z],[w,3.8,d]]);for(let i=-1.5;i<=1.5;i+=1)s.push(['box',W2,[x+(w>1?i:0),4.05,z+(d>1?i:0)],[.5,.5,.5]]);}
 s.push(['box',W,[0,3.6,0],[3.2,7.2,3.2]],['cone4','#2e4f8a',[0,8.4,0],[4.6,2.4,4.6],[0,Math.PI/4,0]],['box','#3a2a20',[0,1.3,-3.46],[1.6,2.6,.1]],['cyl','#5a4030',[0,10.4,0],[.08,2.4,.08]],['box','#3a6ad8',[.55,11.1,0],[1.1,.7,.04]]);
 for(const[x,z]of[[-1.2,1.62],[1.2,1.62],[1.62,-1.2],[-1.62,1.2]])g.push(['box','#ffd890',[x,5.2,z],[.3,.5,.05]]);
 const root=new THREE.Group();const m=new THREE.Mesh(merge(s),MAT.solid);m.castShadow=m.receiveShadow=true;root.add(m);root.add(new THREE.Mesh(merge(g),MAT.glow));return root;}
export function gateModel(){const s=[],g=[];s.push(['box','#3a3438',[-2.4,2.2,0],[1.2,4.4,1.4]],['box','#3a3438',[2.4,2.2,0],[1.2,4.4,1.4]],['box','#2a2428',[0,4.7,0],[6,1,1.6]],['cone','#5a2a24',[-2.4,5.6,0],[.5,1.4,.5]],['cone','#5a2a24',[2.4,5.6,0],[.5,1.4,.5]],
 ['cone','#d8d0c0',[-1,5.3,.8],[.12,.6,.12],[1,0,0]],['cone','#d8d0c0',[1,5.3,.8],[.12,.6,.12],[1,0,0]]);g.push(['box','#ff4a20',[0,2.1,0],[3.6,4.2,.12]]);
 const root=new THREE.Group();const m=new THREE.Mesh(merge(s),MAT.solid);m.castShadow=true;root.add(m);const gm=new THREE.Mesh(merge(g),new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false,transparent:true,opacity:.75,side:THREE.DoubleSide}));root.add(gm);root.userData.portal=gm;return root;}
export {G as PRIM};
