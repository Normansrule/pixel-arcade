// FRONTLINE OPS — set dressing and atmosphere for MEDIUM and HIGH (LOW never builds any of this).
// Everything here is visual only (no collision), generated from the level layout with its own seeded
// random stream, and drawn as a handful of instanced meshes: window surrounds, balconies, wall AC units,
// downpipes, blade signs, overhead cables, street debris, weeds / snow drifts, puddles, potted plants,
// distant skyline silhouettes and two layered haze rings. Also bakes the ground contact-shadow map.
import * as THREE from '../vendor/three.module.min.js';
import {merge,M4} from './world.js';
const V=THREE.Vector3,PI=Math.PI;
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(rt,rb,h,s=8)=>new THREE.CylinderGeometry(rt,rb,h,s,1);
const std=o=>new THREE.MeshStandardMaterial(o);
const ROT={n:PI,s:0,w:-PI/2,e:PI/2},NRM={n:[0,-1],s:[0,1],w:[-1,0],e:[1,0]};

/* ---------- ground contact shadows: blurred footprints of everything standing on the ground ---------- */
export function contactMap(L){const S=512,ext=L.half+6,k=S/(ext*2),c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,S,S);const P=(v)=>(v+ext)*k;
 const draw=(blur,grow,alpha)=>{x.filter=`blur(${blur}px)`;for(const b of L.boxes){if(!b.solid&&!b.ao&&b.mat!=='sandbag')continue;if(b.y0>.6||b.y1-b.y0<.25||b.mat==='fence'||b.mat==='lamp')continue;
   const h=Math.min(1,(b.y1-b.y0)/2.2);x.fillStyle=`rgba(0,0,0,${alpha*(.45+.55*h)})`;x.fillRect(P(b.x0-grow),P(b.z0-grow),(b.x1-b.x0+grow*2)*k,(b.z1-b.z0+grow*2)*k);}
  for(const p of L.props){if(p.y>.3)continue;const r=({truck:2.2,tanker:2.2,jeep:1.5,car:1.4,pickup:1.6,wreck:1.4,forklift:1,fueltank:1.6,dumpster:1,gen:1,crateL:.9,stall:1.2,palm:.5,tree:.6,pine:.6,radome:5,cable:.8})[p.kind];
   if(!r)continue;x.fillStyle=`rgba(0,0,0,${alpha*.7})`;x.beginPath();x.ellipse(P(p.x),P(p.z),(r+grow)*k*(p.s||1),(r*(p.kind.match(/truck|tanker|jeep|car|pickup|wreck/)?2:1)+grow)*k*(p.s||1),-(p.rot||0),0,7);x.fill();}};
 draw(10,.5,.32);draw(3,.08,.42);x.filter='none';
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.userData={ext};return t;}
// patch a material so its indirect light (and a little direct) is occluded by the contact map
export function withContact(m,tex,k=1){const prev=m.onBeforeCompile;m.onBeforeCompile=(s,r)=>{if(prev)prev(s,r);s.uniforms.uCt={value:tex};s.uniforms.uCtE={value:tex.userData.ext};s.uniforms.uCtK={value:k};
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vCtP;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n{vec4 cw=modelMatrix*vec4(transformed,1.);vCtP=cw.xz;}');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vCtP;uniform sampler2D uCt;uniform float uCtE,uCtK;')
   .replace('#include <aomap_fragment>',`#include <aomap_fragment>
 {vec2 cu=(vCtP+uCtE)/(2.*uCtE);float ins=step(0.,cu.x)*step(cu.x,1.)*step(0.,cu.y)*step(cu.y,1.);float ct=mix(1.,texture2D(uCt,vec2(cu.x,1.-cu.y)).r,ins*uCtK);
  reflectedLight.indirectDiffuse*=ct;reflectedLight.indirectSpecular*=ct;reflectedLight.directDiffuse*=mix(1.,ct,.45);}`);};
 const pk=m.customProgramCacheKey?m.customProgramCacheKey.bind(m):()=>'';m.customProgramCacheKey=()=>pk()+'ct';return m;}

/* ---------- the dressing itself ---------- */
export function buildDressing(L,TX,q,look){const G=new THREE.Group();let s=(L._s||7)*31+17;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 const id=L.id,snow=id==='northwatch',desert=id==='sandgate',town=id==='oldquarter',port=id==='harbor';const hi=q>=2;
 const inst=(geo,mat,list,cast=true)=>{if(!list.length)return null;const im=new THREE.InstancedMesh(geo,mat,list.length),c=new THREE.Color();list.forEach((p,i)=>{im.setMatrixAt(i,p.m);if(p.c!=null)im.setColorAt(i,c.set(p.c));else im.setColorAt(i,c.set(0xffffff));});im.castShadow=cast;im.receiveShadow=true;G.add(im);return im;};
 // wall frame: local +z is out of the wall, origin on the wall centre line at the window's sill height
 const onWall=(w,dx,dy,dz,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{const r=ROT[w.side];const m=M4(w.x,w.y,w.z,0,r,0);return m.multiply(M4(dx,dy,dz,rx,ry,rz,sx,sy,sz));};
 /* window surrounds: jambs + lintel + inner reveal so every opening reads with depth */
 const trimC=desert?[0xe8dcc4,0xd8c8a8,0x8a6a4a]:town?[0xf2ece0,0x5a4030,0x3a4a3a,0xe8e0d0]:port?[0x8a9098,0xd8d8d0]:[0xe8ecf0,0x6a7078];
 const frame=merge([{geo:BX(.11,1.62,.13),m:M4(-.68,.7,.21)},{geo:BX(.11,1.62,.13),m:M4(.68,.7,.21)},{geo:BX(1.6,.14,.15),m:M4(0,1.5,.22)},{geo:BX(1.3,.05,.06),m:M4(0,.02,.2)}]);
 const fl=[],bal=[],acs=[],sigs=[];
 for(const w of L.windows){fl.push({m:onWall(w,0,0,0),c:trimC[(Math.abs(w.x*7+w.z*13)|0)%trimC.length]});
  const r=rnd();if(w.y>3&&(desert||town)&&r<.22)bal.push({m:onWall(w,0,-.06,0),c:town?0x2a2c2e:0x4a3a2c});
  else if(!snow&&r>.82)acs.push({m:onWall(w,(rnd()-.5)*.3,w.y>3?-.75:-.85,0),c:0xd8d8d2});}
 inst(frame,std({map:TX.concrete.map,roughness:.85,color:0xffffff}),fl,true);
 if(bal.length){const bp=[{geo:BX(2,.1,.9),m:M4(0,0,.6)},{geo:BX(2,.05,.05),m:M4(0,1.02,1.03)},{geo:BX(.05,.05,.86),m:M4(-.98,1.02,.6)},{geo:BX(.05,.05,.86),m:M4(.98,1.02,.6)}];
  for(let i=0;i<=12;i++)bp.push({geo:BX(.025,.97,.025),m:M4(-.97+i*1.94/12,.52,1.03)});for(const x of[-.97,.97])for(let i=1;i<4;i++)bp.push({geo:BX(.025,.97,.025),m:M4(x,.52,.2+i*.2)});
  bp.push({geo:BX(.08,.12,.6),m:M4(-.8,-.1,.45,-.5)},{geo:BX(.08,.12,.6),m:M4(.8,-.1,.45,-.5)});inst(merge(bp),std({color:0xffffff,roughness:.55,metalness:.6}),bal,true);}
 if(acs.length){const ap=[{geo:BX(.82,.56,.4),m:M4(0,0,.36)},{geo:new THREE.CylinderGeometry(.2,.2,.02,16),m:M4(.12,0,.565,PI/2),c:0x2a2a2a},{geo:BX(.06,.06,.4),m:M4(-.3,-.31,.32),c:0x555555},{geo:BX(.06,.06,.4),m:M4(.3,-.31,.32),c:0x555555},{geo:CY(.012,.012,1.2,4),m:M4(-.36,-.8,.2),c:0x9a9a9a}];
  inst(merge(ap),std({map:TX.metal.map,roughness:.5,metalness:.35,vertexColors:true}),acs,true);}
 /* per building: downpipes at corners, blade signs, wall-base debris and weeds/drifts, cables to the neighbour across the street */
 const pipes=[],rubble=[],bags=[],planks=[],weeds=[],drifts=[],pots=[],puddles=[],wires=[];
 for(const b of L.blds){const h=b.h;for(const[cx,cz,sx,sz]of[[b.x0,b.z0,-1,-1],[b.x1,b.z0,1,-1],[b.x0,b.z1,-1,1],[b.x1,b.z1,1,1]])if(rnd()<.55)pipes.push({m:M4(cx+sx*.22,0,cz+sz*.22,0,0,0,1,h+.2,1),c:port||snow?0x8a9096:0x9a8a78});
  for(const side of['n','s','w','e']){const[nx,nz]=NRM[side],along=side==='n'||side==='s',a0=along?b.x0:b.z0,a1=along?b.x1:b.z1,fx=side==='w'?b.x0:side==='e'?b.x1:0,fz=side==='n'?b.z0:side==='s'?b.z1:0;
   const at=(t,o)=>along?[t,fz+nz*o]:[fx+nx*o,t];
   if(!snow&&h>3.5&&rnd()<.4){const t=a0+1.5+rnd()*(a1-a0-3),[x,z]=at(t,0);sigs.push({m:M4(x,2.95,z,0,ROT[side],0).multiply(M4(0,0,.15)),c:[0xc8402a,0x2a5a8a,0xe8c040,0x2a7a5a,0xe8e4d8][(rnd()*5)|0]});}
   for(let t=a0+.6;t<a1-.6;t+=.7+rnd()*1.4){const o=.4+rnd()*.7,[x,z]=at(t,o);if(!L.free(x,z))continue;const r=rnd();
    if(snow){if(r<.55)drifts.push({m:M4(x+nx*.1,0,z+nz*.1,0,rnd()*6,0,.6+rnd()*1.1,.18+rnd()*.25,.5+rnd()*.6)});continue;}
    if(r<.3)rubble.push({m:M4(x,.04,z,rnd()*3,rnd()*6,rnd()*3,.12+rnd()*.22,.07+rnd()*.12,.12+rnd()*.2),c:[0xb8b0a4,0x8a8278,0xa89070,0x6a6058][(rnd()*4)|0]});
    else if(r<.42){const k=.24+rnd()*.14;bags.push({m:M4(x,k*.6,z,0,rnd()*6,(rnd()-.5)*.4,k,k*.85,k*1.1),c:[0x1a1c1a,0x2a3a2a,0x3a3a3c,0x5a5040][(rnd()*4)|0]});}
    else if(r<.5)planks.push({m:M4(x,.03+rnd()*.05,z,(rnd()-.5)*.15,rnd()*6,(rnd()-.5)*.2,.6+rnd()*.8,1,1),c:[0x8a6a48,0x6a5038,0xa8a49c][(rnd()*3)|0]});
    else if(r<.85)weeds.push({m:M4(x+nx*-.15,0,z+nz*-.15,0,rnd()*3,0,.5+rnd()*.7,.5+rnd()*.9,.5+rnd()*.7)});
    else if(r<.9&&(desert||town)&&o<.8)pots.push({m:M4(x,0,z,0,rnd()*6,0,.8+rnd()*.5,.8+rnd()*.5,.8+rnd()*.5),c:[0xa8583a,0xc87a4a,0x8a4a30,0xd8d0c0][(rnd()*4)|0]});}}
  // cable to a neighbouring building across a street
  if(rnd()<.6)for(const o of L.blds){if(o===b||wires.length>=(hi?40:24))break;const gx=Math.max(o.x0-b.x1,b.x0-o.x1),gz=Math.max(o.z0-b.z1,b.z0-o.z1);
   if(Math.max(gx,gz)<4||Math.max(gx,gz)>16||Math.min(gx,gz)>-2)continue;if(rnd()<.6)continue;const y=Math.min(b.h,o.h)-.5-rnd()*1.2;
   const ax=gx>gz?(o.x0>b.x1?b.x1:b.x0):Math.max(b.x0,o.x0)+rnd()*Math.max(.5,Math.min(b.x1,o.x1)-Math.max(b.x0,o.x0));const az=gx>gz?Math.max(b.z0,o.z0)+rnd()*Math.max(.5,Math.min(b.z1,o.z1)-Math.max(b.z0,o.z0)):(o.z0>b.z1?b.z1:b.z0);
   const bx=gx>gz?(o.x0>b.x1?o.x0:o.x1):ax+(rnd()-.5)*3,bz=gx>gz?az+(rnd()-.5)*3:(o.z0>b.z1?o.z0:o.z1);wires.push([ax,y,az,bx,y+(rnd()-.5)*.6,bz]);}}
 inst(CY(.055,.055,1,6).translate(0,.5,0),std({color:0xffffff,roughness:.45,metalness:.6}),pipes,true);
 if(sigs.length){const sg=merge([{geo:BX(.05,.05,.7),m:M4(0,.42,.35),c:0x222222},{geo:BX(.06,.62,.9),m:M4(0,0,.6)},{geo:BX(.08,.66,.04),m:M4(0,0,1.06),c:0x2a2a2a}]);
  const sm=std({map:TX.stripe,roughness:.6,vertexColors:true,emissive:look.lampsOn?0x553311:0});inst(sg,sm,sigs,true);}
 const rock=new THREE.IcosahedronGeometry(1,0);
 inst(rock,std({map:TX.concrete.map,normalMap:TX.concrete.normalMap,roughness:.95}),rubble,false);
 inst(new THREE.SphereGeometry(1,8,6),std({color:0xffffff,roughness:.32,metalness:0}),bags,false);
 inst(BX(1,.03,.14),std({map:TX.wood.map,roughness:.9}),planks,false);
 if(weeds.length&&TX.grassCard){const g=new THREE.PlaneGeometry(.7,.5);g.translate(0,.24,0);const cross=merge([{geo:g},{geo:g.clone().rotateY(PI/2)}]);const n=cross.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);
  inst(cross,std({map:TX.grassCard,alphaTest:.45,side:THREE.DoubleSide,roughness:1,color:new THREE.Color(desert?0xb8a870:L.grassCol??0x9aa878)}),weeds,false);}
 if(drifts.length)inst(new THREE.SphereGeometry(1,10,5,0,PI*2,0,PI/2),std({color:0xf2f6ff,roughness:.75}),drifts,false);
 if(pots.length){inst(CY(.26,.18,.45,10).translate(0,.22,0),std({color:0xffffff,roughness:.8}),pots,true);inst(new THREE.IcosahedronGeometry(.42,1).scale(1,1.1,1).translate(0,.75,0),std({map:TX.leaf,color:desert?0x7a9a4a:0x5a8a4a,roughness:.9}),pots.map(p=>({m:p.m})),true);}
 /* puddles: wet patches on the street (town after rain, harbour, slush in the snow) */
 if(!desert){const nP=hi?34:20;for(let i=0;i<nP*4&&puddles.length<nP;i++){const x=(rnd()*2-1)*L.half*.9,z=(rnd()*2-1)*L.half*.9;if(!L.free(x,z)||!L.free(x+1.5,z)||!L.free(x-1.5,z))continue;puddles.push({m:M4(x,.05+i*.0001,z,-PI/2,0,rnd()*6,1.2+rnd()*2.4,.8+rnd()*1.6,1)});}
  const pg=new THREE.CircleGeometry(1,20);const pp=pg.attributes.position;for(let i=1;i<pp.count;i++){const a=Math.atan2(pp.getY(i),pp.getX(i)),r=1+.22*Math.sin(a*3+1)+.12*Math.sin(a*5+2);pp.setXY(i,pp.getX(i)*r,pp.getY(i)*r);}
  const pm=std({color:snow?0x6a7480:0x2a2c30,roughness:.04,metalness:0,transparent:true,opacity:snow?.55:.78,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,envMapIntensity:1.6});
  const im=inst(pg,pm,puddles,false);if(im)im.renderOrder=1;}
 /* overhead cables between buildings */
 if(wires.length){const parts=[];for(const[ax,ay,az,bx,by,bz]of wires){const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new V(ax+(bx-ax)*t,ay+(by-ay)*t-Math.sin(t*PI)*(.5+Math.hypot(bx-ax,bz-az)*.04),az+(bz-az)*t));}
   parts.push({geo:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.016,4,false)});}const me=new THREE.Mesh(merge(parts),std({color:0x161616,roughness:.6}));me.castShadow=hi;G.add(me);}
 /* distant skyline silhouettes past the terrain, sat on the terrain height */
 const sk=[],tY=L.tY||(()=>0);const ring=(n,r0,r1,fn)=>{for(let i=0;i<n;i++){const a=rnd()*PI*2,r=r0+rnd()*(r1-r0),x=Math.cos(a)*r,z=Math.sin(a)*r;if(L.terrain&&L.terrain.seaSide&&L.terrain.seaSide(x,z))continue;fn(x,tY(x,z)-1,z,a);}};
 if(desert){ring(80,210,320,(x,y,z,a)=>{const w=8+rnd()*16,h=4+rnd()*8;sk.push({geo:BX(w,h,8+rnd()*12),m:M4(x,y+h/2,z,0,a,0)});if(rnd()<.1){sk.push({geo:CY(1.4,1.8,h+16,8),m:M4(x+4,y+(h+16)/2,z,0,a,0)},{geo:new THREE.SphereGeometry(2.4,10,6),m:M4(x+4,y+h+16,z)});}if(rnd()<.14)sk.push({geo:new THREE.SphereGeometry(w*.35,12,6,0,PI*2,0,PI/2),m:M4(x,y+h,z)});});}
 else if(port){ring(70,240,360,(x,y,z,a)=>{if(x<20)return;const r=rnd();if(r<.15){const h=34+rnd()*16;for(const s of[-1,1])sk.push({geo:BX(1.6,h,1.6),m:M4(x,y+h/2,z,0,a,0).multiply(M4(s*5,0,0))});sk.push({geo:BX(12,2,2),m:M4(x,y+h,z,0,a,0)},{geo:BX(2,2,34),m:M4(x,y+h+2,z,0,a,0).multiply(M4(0,0,6))});}
   else if(r<.55){const h=18+rnd()*40;sk.push({geo:BX(12+rnd()*10,h,12+rnd()*10),m:M4(x,y+h/2,z,0,a,0)});}else{const h=6+rnd()*8;sk.push({geo:BX(20+rnd()*20,h,12+rnd()*14),m:M4(x,y+h/2,z,0,a,0)});}});}
 else if(town){ring(110,170,280,(x,y,z,a)=>{const w=8+rnd()*8,d=6+rnd()*6,h=7+rnd()*7,g=new THREE.CylinderGeometry(0,w*.75,w*.45,4,1);g.rotateY(PI/4);g.scale(1,1,d/w);
   sk.push({geo:BX(w,h,d),m:M4(x,y+h/2,z,0,a,0)},{geo:g,m:M4(x,y+h+w*.22,z,0,a,0)});if(rnd()<.05){sk.push({geo:BX(4,26,4),m:M4(x,y+13,z,0,a,0)},{geo:new THREE.ConeGeometry(3,12,4),m:M4(x,y+32,z,0,a+PI/4,0)});}});}
 else ring(40,180,300,(x,y,z,a)=>{if(rnd()<.2){sk.push({geo:CY(.4,.6,30,5),m:M4(x,y+15,z)});}else{const h=4+rnd()*4;sk.push({geo:BX(10+rnd()*10,h,8),m:M4(x,y+h/2,z,0,a,0)});}});
 if(sk.length){const fc=new THREE.Color(look.fog.c),fa=new THREE.Color(L.terrain&&L.terrain.far?L.terrain.far.c:look.fog.c);const me=new THREE.Mesh(merge(sk),std({color:fa.lerp(fc,.3).multiplyScalar(look.lampsOn?.45:.8),roughness:1}));G.add(me);}
 /* aerial perspective: two haze bands hugging the horizon, brighter toward the sun */
 const sd=new V(...look.sun.dir).normalize();const hz=(R,H,k)=>{const g=new THREE.CylinderGeometry(R,R,H,64,1,true);g.translate(0,H/2-6,0);
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,fog:false,uniforms:{uF:{value:new THREE.Color(look.fog.c)},uS:{value:new THREE.Color(look.sun.c)},uD:{value:sd},uK:{value:k}},
   vertexShader:'varying vec3 vW;varying float vY;void main(){vY=uv.y;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:'uniform vec3 uF,uS,uD;uniform float uK;varying vec3 vW;varying float vY;void main(){vec3 d=normalize(vW-cameraPosition);float sun=pow(max(0.,dot(normalize(d.xz),normalize(uD.xz))),6.)*(1.-uD.y*.8);float a=pow(1.-smoothstep(0.,1.,vY),1.6)*uK;gl_FragColor=vec4(mix(uF,uF*.6+uS*.7,sun*.6),a);}'});
  const me=new THREE.Mesh(g,m);me.renderOrder=2;me.frustumCulled=false;G.add(me);};
 const hk=look.haze??1;hz(135,34,.5*hk);hz(320,90,.62*hk);
 return G;}
