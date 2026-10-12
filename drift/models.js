// SIDEWAYS — procedural car models. Bodies are lofted from cross-sections (wheel arches carved into the sill line),
// glass cabin + painted roof, flares, wings, lights, and spinning/steering wheels with four rim styles.
// Livery is painted in the paint shader from object-space position, so recolouring never rebuilds geometry.
import * as THREE from '../vendor/three.module.min.js';
import {merge,M4,cl,smooth,ctex} from './util.js';
const V=THREE.Vector3;

// body definitions: overhangs, half-width, roof, top-line keyframes (t: 0 rear -> 1 front), cabin span
export const SHAPES={
 sparrow:{fo:.78,ro:.74,W:.83,top:[[0,.62],[.04,.86],[.16,.9],[.27,.9],[.3,.88],[.62,.84],[.9,.8],[.97,.74],[1,.6]],cab:[.2,.3,.56,.66],roof:1.3,cw:.9,wing:'none',lights:'square',flare:0,clear:.17,belt:.11},
 kestrel:{fo:.92,ro:.8,W:.87,top:[[0,.64],[.04,.86],[.12,.9],[.24,.89],[.6,.82],[.88,.76],[.97,.7],[1,.56]],cab:[.12,.36,.52,.64],roof:1.27,cw:.88,wing:'duck',lights:'slim',flare:.02,clear:.15,belt:.1},
 bruiser:{fo:.98,ro:1.06,W:.93,top:[[0,.66],[.04,.92],[.18,.95],[.24,.95],[.28,.93],[.66,.9],[.92,.86],[.98,.78],[1,.64]],cab:[.25,.33,.6,.7],roof:1.42,cw:.9,wing:'none',lights:'quad',flare:.0,clear:.18,belt:.12},
 tempest:{fo:.9,ro:.82,W:.9,top:[[0,.66],[.04,.9],[.14,.93],[.24,.92],[.6,.84],[.88,.78],[.97,.72],[1,.56]],cab:[.17,.32,.55,.66],roof:1.27,cw:.86,wing:'gt',lights:'slim',flare:.09,clear:.13,belt:.1},
 wraith:{fo:.98,ro:.9,W:.94,top:[[0,.7],[.04,.92],[.12,.96],[.3,.98],[.38,.96],[.55,.88],[.8,.7],[.96,.62],[1,.5]],cab:[.3,.42,.58,.7],roof:1.14,cw:.84,wing:'tall',lights:'slim',flare:.07,clear:.11,belt:.12}};

function keyLerp(k,t){if(t<=k[0][0])return k[0][1];for(let i=1;i<k.length;i++)if(t<=k[i][0]){const a=k[i-1],b=k[i],f=(t-a[0])/(b[0]-a[0]),s=f*f*(3-2*f);return a[1]+(b[1]-a[1])*s;}return k[k.length-1][1];}

export function bodyFn(spec,sh){const a=spec.wb*(1-spec.fr),b=spec.wb*spec.fr,zF=a+sh.fo,zR=-b-sh.ro,len=zF-zR;
 const wheels=[a,-b];
 return{zF,zR,len,a,b,
  t:z=>(z-zR)/len,
  sec(z){const t=(z-zR)/len;const ends=Math.min(t,1-t)*len;// metres from either end
   const round=Math.pow(cl(ends/.55,0,1),.42);let w=sh.W*(.78+.22*round);
   for(const wz of wheels){const d=Math.abs(z-wz);w+=sh.flare*smooth(.75,.35,d);}
   let yt=keyLerp(sh.top,t);let yb=sh.clear+(1-round)*.12;
   for(const wz of wheels){const d=Math.abs(z-wz),ra=.43;if(d<ra)yb=Math.max(yb,.3+Math.sqrt(ra*ra-d*d)*.98);}
   const ys=yt-sh.belt;yb=Math.min(yb,ys-.12);return{w,yb,ys,yt};}};}

function ring(s,crown=.015){const{w,yb,ys,yt}=s;const half=[[w*.86,yb],[w*.98,yb+.07],[w,ys-.05],[w*.985,ys+.015],[w*.93,yt-.035],[w*.74,yt-.004],[w*.36,yt+crown*.8]];
 return[[0,yb],...half,[0,yt+crown],...half.slice().reverse().map(([x,y])=>[-x,y])];}
function loft(zs,ringAt,capF=true,capR=true){const rows=zs.map(z=>ringAt(z)),n=rows[0].length,pos=[],idx=[];
 zs.forEach((z,i)=>rows[i].forEach(([x,y])=>pos.push(x,y,z)));
 for(let i=0;i<zs.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=(i+1)*n+j,d=(i+1)*n+(j+1)%n;idx.push(a,c,b,b,c,d);}
 const cap=(i,flip)=>{const r=rows[i];let cx=0,cy=0;r.forEach(([x,y])=>{cx+=x;cy+=y;});const ci=pos.length/3;pos.push(cx/n,cy/n,zs[i]);for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;flip?idx.push(ci,a,b):idx.push(ci,b,a);}};
 if(capR)cap(0,false);if(capF)cap(zs.length-1,true);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}

/* ---------- paint with procedural livery ---------- */
const numTex=new Map();
function numberTexture(n){if(numTex.has(n))return numTex.get(n);const t=ctex(256,256,(x,w,h)=>{x.fillStyle='#fff';x.beginPath();x.arc(w/2,h/2,w*.48,0,7);x.fill();x.fillStyle='#000';x.font='bold 150px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(n),w/2,h/2+8);},{clamp:true});numTex.set(n,t);return t;}
export function paintMaterial(look,num=22){const m=new THREE.MeshPhysicalMaterial({color:look.paint,metalness:.5,roughness:.3,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.1});
 const U={uLiv:{value:look.livery|0},uLivCol:{value:new THREE.Color(look.liv)},uNum:{value:numberTexture(num)},uLen:{value:2.2}};m.userData.U=U;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;varying vec3 vON;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=position;vON=normal;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;varying vec3 vON;uniform int uLiv;uniform vec3 uLivCol;uniform sampler2D uNum;uniform float uLen;').replace('#include <color_fragment>',`#include <color_fragment>
  {vec3 p=vOP;float side=abs(vON.x),top=vON.y;float k=0.;
   if(uLiv==1){float ax=abs(p.x);k=step(.07,ax)*step(ax,.2)*step(.55,top);}
   else if(uLiv==2){float d=p.y-.55+p.z*.18;k=step(.45,side)*smoothstep(-.09,-.07,d)*(1.-smoothstep(.07,.09,d));k=max(k,step(.45,side)*smoothstep(-.03,-.01,d-.18)*(1.-smoothstep(.01,.03,d-.18)));}
   else if(uLiv==3){k=step(p.y,.6)*step(.2,side+0.)+step(p.y,.6)*step(top,.5);k=min(k,1.);}
   else if(uLiv==4){vec2 q=vec2(p.z*sign(p.x)*-1.,p.y-.58)/.36+.5;if(side>.5&&q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.){vec4 t=texture2D(uNum,q);diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.02),vec3(.95),t.r),t.a);}
    k=step(.07,abs(p.x))*step(abs(p.x),.13)*step(.55,top);}
   else if(uLiv==5){float s=fract((p.z+p.y)*2.2);k=step(.5,s)*step(p.y,.5)*step(1.4,abs(p.z));}
   diffuseColor.rgb=mix(diffuseColor.rgb,uLivCol,k);}`);};
 m.customProgramCacheKey=()=>'livery';return m;}

/* ---------- wheels ---------- */
function tireGeo(R,w){const pts=[];const ri=R*.66,sh=.035;pts.push(new THREE.Vector2(ri,-w/2));pts.push(new THREE.Vector2(R-sh,-w/2));
 for(let i=0;i<=5;i++){const a=-Math.PI/2+i/5*Math.PI/2;pts.push(new THREE.Vector2(R-sh+Math.cos(a)*sh,-w/2+sh+Math.sin(a)*sh));}
 for(let i=0;i<=5;i++){const a=i/5*Math.PI/2;pts.push(new THREE.Vector2(R-sh+Math.cos(a)*sh,w/2-sh+Math.sin(a)*sh));}pts.push(new THREE.Vector2(ri,w/2));
 const g=new THREE.LatheGeometry(pts,28);g.rotateZ(Math.PI/2);return g;}
function rimGeo(style,Rr,w){const L=[];const face=w/2-.02;
 L.push([new THREE.CylinderGeometry(Rr,Rr,w*.9,24,1,true),M4(0,0,0,0,0,Math.PI/2)]);
 L.push([new THREE.TorusGeometry(Rr-.008,.014,6,28),M4(face,0,0,0,Math.PI/2,0)]);
 L.push([new THREE.CylinderGeometry(.055,.06,.05,12),M4(face-.03,0,0,0,0,Math.PI/2)]);
 if(style===0){for(let i=0;i<16;i++){const a=i/16*Math.PI*2;L.push([new THREE.BoxGeometry(.012,Rr*1.02,.018),M4(face-.03,Math.cos(a)*Rr*.5,Math.sin(a)*Rr*.5,a+.35,0,0)]);L.push([new THREE.BoxGeometry(.012,Rr*1.02,.018),M4(face-.03,Math.cos(a)*Rr*.5,Math.sin(a)*Rr*.5,a-.35,0,0)]);}}
 else if(style===1){for(let i=0;i<6;i++){const a=i/6*Math.PI*2;L.push([new THREE.BoxGeometry(.04,Rr*.95,.07),M4(face-.035,Math.cos(a)*Rr*.47,Math.sin(a)*Rr*.47,a+Math.PI/2,0,0)]);}}
 else if(style===2){L.push([new THREE.CylinderGeometry(Rr*.8,Rr*.8,.02,24),M4(face-.07,0,0,0,0,Math.PI/2)]);L.push([new THREE.CylinderGeometry(Rr,Rr*.82,.07,24,1,true),M4(face-.035,0,0,0,0,Math.PI/2)]);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;L.push([new THREE.CylinderGeometry(.018,.018,.03,8),M4(face-.06,Math.cos(a)*.08,Math.sin(a)*.08,0,0,Math.PI/2)]);}}
 else{for(let i=0;i<12;i++){const a=i/12*Math.PI*2;L.push([new THREE.BoxGeometry(.02,Rr*.9,.05),M4(face-.03,Math.cos(a)*Rr*.5,Math.sin(a)*Rr*.5,a,.5,0)]);}L.push([new THREE.CylinderGeometry(Rr*.32,Rr*.32,.03,16),M4(face-.04,0,0,0,0,Math.PI/2)]);}
 return merge(L);}
const tireMat=new THREE.MeshStandardMaterial({color:0x111113,roughness:.88,metalness:0});
const discMat=new THREE.MeshStandardMaterial({color:0x6a6d72,roughness:.35,metalness:.9});
export function makeWheel(R,w,style,rimMat,caliperMat,right){const piv=new THREE.Group(),inner=new THREE.Group(),spin=new THREE.Group();
 piv.add(inner);inner.add(spin);if(right)inner.rotation.y=Math.PI;
 const t=new THREE.Mesh(tireGeo(R,w),tireMat);t.castShadow=true;spin.add(t);
 const r=new THREE.Mesh(rimGeo(style,R*.66,w),rimMat);spin.add(r);
 const d=new THREE.Mesh(new THREE.CylinderGeometry(R*.52,R*.52,.025,20),discMat);d.rotation.z=Math.PI/2;d.position.x=w/2-.13;spin.add(d);
 const cal=new THREE.Mesh(new THREE.BoxGeometry(.06,.12,.16),caliperMat);cal.position.set(w/2-.11,.1,-.08);inner.add(cal);
 return{piv,spin,right,rim:r};}

/* ---------- full car ---------- */
const glassMat=new THREE.MeshPhysicalMaterial({color:0x0a0d12,metalness:.2,roughness:.04,clearcoat:1,envMapIntensity:1.6,transparent:true,opacity:.92});
const trimMat=new THREE.MeshStandardMaterial({color:0x0c0c0e,roughness:.6,metalness:.2});
const chromeMat=new THREE.MeshStandardMaterial({color:0xd8dadf,roughness:.18,metalness:1});
export function makeCar(spec,look,num){const sh=SHAPES[spec.shape],F=bodyFn(spec,sh),g=new THREE.Group(),body=new THREE.Group();g.add(body);
 const paint=paintMaterial(look,num),N=64,zs=[];for(let i=0;i<=N;i++){const t=i/N;zs.push(F.zR+F.len*(t<.5?.5-Math.cos(t*Math.PI)*.5:.5-Math.cos(t*Math.PI)*.5));}
 const bodyM=new THREE.Mesh(loft(zs,z=>ring(F.sec(z))),paint);bodyM.castShadow=true;body.add(bodyM);
 // cabin (glass) + roof panel (paint)
 const[c0,c1,c2,c3]=sh.cab,zc=t=>F.zR+F.len*t,cz=[];for(let i=0;i<=24;i++)cz.push(zc(c0+(c3-c0)*i/24));
 const cabTop=z=>{const t=F.t(z);const base=F.sec(z).yt;if(t<c1)return base+(sh.roof-base)*smooth(c0,c1,t)**.7;if(t>c2)return base+(sh.roof-base)*smooth(c3,c2,t)**.8;return sh.roof;};
 const cabRing=(z,inset=0)=>{const s=F.sec(z),yb=s.yt-.03,yt=cabTop(z)+inset,wb=s.w*sh.cw,tw=wb*.74;const h=[[wb,yb],[wb*.96,yb+(yt-yb)*.45],[tw*1.02,yt-.05],[tw*.82,yt-.01],[tw*.4,yt+.005]];return[[0,yb],...h,[0,yt+.01],...h.slice().reverse().map(([x,y])=>[-x,y])];};
 const cab=new THREE.Mesh(loft(cz,z=>cabRing(z)),glassMat);body.add(cab);
 const rz=[];for(let i=0;i<=12;i++)rz.push(zc(c1-.025+(c2-c1+.05)*i/12));
 const roof=new THREE.Mesh(loft(rz,z=>{const r=cabRing(z,.006);return r.filter(([x,y])=>y>cabTop(z)-.06);},true,true),paint);roof.castShadow=true;body.add(roof);
 // pillars (A and C) as thin painted strips
 const pil=[];for(const side of[-1,1]){for(const[t0,t1]of[[c2,c3],[c0,c1]]){const z0=zc(t0),z1=zc(t1),p0=new V(side*F.sec(z0).w*sh.cw*.77,cabTop(z0)-.02,z0),p1=new V(side*F.sec(z1).w*sh.cw*.97,F.sec(z1).yt,z1);
  const len=p0.distanceTo(p1),mid=p0.clone().add(p1).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),p1.clone().sub(p0).normalize());pil.push([new THREE.BoxGeometry(.07,len,.06),new THREE.Matrix4().compose(mid,q,new V(1,1,1))]);}}
 body.add(new THREE.Mesh(merge(pil),paint));
 // trim: bumpers, grille, sills, diffuser, mirrors
 const fs=F.sec(F.zF-.12),rs=F.sec(F.zR+.12),T=[];
 T.push([new THREE.BoxGeometry(fs.w*1.9,.12,.18),M4(0,fs.yb+.04,F.zF-.08)]);T.push([new THREE.BoxGeometry(fs.w*1.1,.12,.06),M4(0,fs.yb+.2,F.zF-.02)]);
 T.push([new THREE.BoxGeometry(rs.w*1.85,.14,.16),M4(0,rs.yb+.05,F.zR+.07)]);
 for(const s of[-1,1]){const mz=zc(c3)-.08,ms=F.sec(mz);T.push([new THREE.BoxGeometry(.14,.08,.12),M4(s*(ms.w*sh.cw+.05),ms.yt+.06,mz,0,0,0)]);
  T.push([new THREE.BoxGeometry(.05,.07,F.wbLen||spec.wb*.62),M4(s*(F.sec(0).w-.01),sh.clear+.06,(F.a-F.b)/2)]);}
 const trim=new THREE.Mesh(merge(T),trimMat);trim.castShadow=true;body.add(trim);
 // exhaust tip
 const ex=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.18,12,1,true),chromeMat);ex.rotation.x=Math.PI/2;const exP=new V(-rs.w*.55,rs.yb+.08,F.zR+.03);ex.position.copy(exP);body.add(ex);
 // wing / spoiler
 if(sh.wing!=='none'){const W=[];const t=F.sec(F.zR+.25);
  if(sh.wing==='duck')W.push([new THREE.BoxGeometry(t.w*1.8,.04,.22),M4(0,t.yt+.04,F.zR+.16,-.35,0,0)]);
  else{const hgt=sh.wing==='tall'?.42:.3;for(const s of[-1,1])W.push([new THREE.BoxGeometry(.04,hgt,.14),M4(s*.42,t.yt+hgt/2,F.zR+.32)]);
   W.push([new THREE.BoxGeometry(t.w*2.05,.035,.34),M4(0,t.yt+hgt+.02,F.zR+.24,.12,0,0)]);for(const s of[-1,1])W.push([new THREE.BoxGeometry(.02,.16,.4),M4(s*t.w*1.03,t.yt+hgt,F.zR+.24)]);}
  const wm=new THREE.Mesh(merge(W),sh.wing==='duck'?paint:trimMat);wm.castShadow=true;body.add(wm);}
 // lights (emissive; intensities driven by the game)
 const head=new THREE.MeshStandardMaterial({color:0x222222,emissive:0xfff2d8,emissiveIntensity:3,roughness:.2});
 const tail=new THREE.MeshStandardMaterial({color:0x220000,emissive:0xff1a10,emissiveIntensity:1.6,roughness:.3});
 const H=[],Tl=[];const hz=F.zF-.06,hs=F.sec(hz-.1);
 for(const s of[-1,1]){if(sh.lights==='square')H.push([new THREE.BoxGeometry(.3,.1,.05),M4(s*hs.w*.62,hs.yt-.1,hz-.02)]);
  else if(sh.lights==='quad'){H.push([new THREE.CylinderGeometry(.065,.065,.05,14),M4(s*hs.w*.46,hs.yt-.12,hz-.02,Math.PI/2,0,0)]);H.push([new THREE.CylinderGeometry(.065,.065,.05,14),M4(s*hs.w*.74,hs.yt-.12,hz-.03,Math.PI/2,0,0)]);}
  else H.push([new THREE.BoxGeometry(.34,.055,.12),M4(s*hs.w*.62,hs.yt-.06,hz-.07,-.35,s*.12,0)]);
  const ts=F.sec(F.zR+.06);Tl.push([new THREE.BoxGeometry(sh.lights==='slim'?.5:.34,sh.lights==='slim'?.05:.11,.04),M4(s*ts.w*.6,ts.ys+.02,F.zR+.01)]);}
 if(spec.shape==='wraith'||spec.shape==='tempest'){const ts=F.sec(F.zR+.06);Tl.push([new THREE.BoxGeometry(ts.w*1.0,.025,.03),M4(0,ts.ys+.02,F.zR)]);}
 const hm=new THREE.Mesh(merge(H),head),tm=new THREE.Mesh(merge(Tl),tail);body.add(hm,tm);
 // wheels
 const rimMat=new THREE.MeshStandardMaterial({color:look.rims,metalness:.85,roughness:.28,envMapIntensity:1.2});
 const calMat=new THREE.MeshStandardMaterial({color:0xd01818,roughness:.4,metalness:.3});
 const tw=spec.tw/2+sh.flare*.6,tirew=spec.shape==='sparrow'?.2:sh.flare>.05?.27:.235,R=.32,wheels=[];
 for(const[z,front]of[[F.a,1],[-F.b,0]])for(const s of[1,-1]){const wh=makeWheel(R,tirew,look.rim|0,rimMat,calMat,s<0);wh.piv.position.set(s*tw,R,z);wh.front=!!front;wh.base=R;g.add(wh.piv);wheels.push(wh);}
 // ground contact shadow blob
 const blob=new THREE.Mesh(new THREE.PlaneGeometry(F.sec(0).w*2.5,F.len*1.08),new THREE.MeshBasicMaterial({map:blobTex(),transparent:true,depthWrite:false,opacity:.75,color:0x000000}));
 blob.rotation.x=-Math.PI/2;blob.position.y=.03;g.add(blob);
 g.userData={body,paint,rimMat,wheels,head,tail,exhaust:exP,zF:F.zF,zR:F.zR,len:F.len,halfW:F.sec(0).w,bodyM,tw,R,spec,blob,
  frontLamp:new V(0,hs.yt-.1,hz),rearLamp:new V(0,F.sec(F.zR+.06).ys,F.zR)};
 return g;}
let _blob=null;function blobTex(){if(_blob)return _blob;_blob=ctex(64,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.6,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.save();x.scale(1,2);x.fillStyle=g;x.fillRect(0,0,w,h/2);x.restore();},{clamp:true,srgb:false});return _blob;}
export function setLook(car,look){const u=car.userData;u.paint.color.set(look.paint);u.paint.userData.U.uLiv.value=look.livery|0;u.paint.userData.U.uLivCol.value.set(look.liv);u.rimMat.color.set(look.rims);}
export function disposeCar(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
