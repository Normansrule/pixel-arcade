// ZENITH PROTOCOL — dresses a map description: stylized buildings (plaster, terracotta gables, shutters, awnings / brick, metal,
// lit windows, neon signs), props (stalls, palms, lamps, planters, containers), the payload track, checkpoint arches, skies,
// sea or skyline backdrops, lights and a planar mirror for the wet night streets.
import * as THREE from '../vendor/three.module.min.js';
import {V,M4,merge,boxUV,ctex,rng} from './util.js';
import {stuccoSet,roofSet,cobbleSet,asphaltSet,woodSet,corrugatedSet,concreteSet,panelSet,awningTex,glowTex,hexTex} from './tex.js';

const C=(r,g,b)=>new THREE.Color(r,g,b),col=h=>new THREE.Color(h);
export const THEMES={
 coast:{sky:'day',fog:[0xc6dcf0,.0042],hemi:[0xdde9ff,0x9a8466,.85],sun:[0xfff0d4,2.7,[.42,.74,-.42]],exp:.86,bloom:.32,thr:.94,sat:1.14,tint:'#fff6ea',trim:C(3,2.1,.9),glass:0x2c4a66,frame:0xf4efe2,lit:0},
 neon:{sky:'night',fog:[0x1c1430,.0105],hemi:[0x7078c8,0x2a1a30,.55],sun:[0xa8b4ff,.85,[-.35,.62,.45]],exp:1.1,bloom:.82,thr:.72,sat:1.16,tint:'#f6f0ff',trim:C(2.6,.6,2.2),glass:0x0c1018,frame:0x24262e,lit:1}};

/* ---------- planar reflection (wet streets) ---------- */
export class Mirror{constructor(scale=.5){this.rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType});this.cam=new THREE.PerspectiveCamera();this.mat=new THREE.Matrix4();this.scale=scale;this.on=true;this.y=0;
  this.U={tRefl:{value:this.rt.texture},uTexMat:{value:this.mat},uReflStr:{value:.5},uMirY:{value:0}};}
 render(R,scene,cam,w,h,hide){if(!this.on)return;const rw=Math.max(4,w*this.scale|0),rh=Math.max(4,h*this.scale|0);if(this.rt.width!==rw||this.rt.height!==rh)this.rt.setSize(rw,rh);const Y=this.y;this.U.uMirY.value=Y;
  const vc=this.cam,d=new V(0,0,-1).applyQuaternion(cam.quaternion),up=new V(0,1,0).applyQuaternion(cam.quaternion);if(cam.position.y<Y+.05)return;
  vc.position.set(cam.position.x,2*Y-cam.position.y,cam.position.z);vc.up.set(up.x,-up.y,up.z);vc.lookAt(cam.position.x+d.x,2*Y-(cam.position.y+d.y),cam.position.z+d.z);
  vc.near=cam.near;vc.far=cam.far;vc.updateMatrixWorld();vc.projectionMatrix.copy(cam.projectionMatrix);
  this.mat.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
  const pl=new THREE.Plane(new V(0,1,0),-Y).applyMatrix4(vc.matrixWorldInverse),cp=new THREE.Vector4(pl.normal.x,pl.normal.y,pl.normal.z,pl.constant),pm=vc.projectionMatrix.elements;
  const q=new THREE.Vector4((Math.sign(cp.x)+pm[8])/pm[0],(Math.sign(cp.y)+pm[9])/pm[5],-1,(1+pm[10])/pm[14]);cp.multiplyScalar(2/cp.dot(q));pm[2]=cp.x;pm[6]=cp.y;pm[10]=cp.z+1-.003;pm[14]=cp.w;
  vc.layers.set(0);hide.forEach(o=>o.visible=false);const prev=R.getRenderTarget(),sh=R.shadowMap.autoUpdate;R.shadowMap.autoUpdate=false;R.setRenderTarget(this.rt);R.clear();R.render(scene,vc);R.setRenderTarget(prev);R.shadowMap.autoUpdate=sh;hide.forEach(o=>o.visible=true);}}
function reflective(mat,U){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 uTexMat;varying vec4 vRefl;varying vec3 vWP;varying vec3 vWN;').replace('#include <project_vertex>','#include <project_vertex>\nvec4 wpR=modelMatrix*vec4(transformed,1.);vRefl=uTexMat*wpR;vWP=wpR.xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tRefl;uniform float uReflStr,uMirY;varying vec4 vRefl;varying vec3 vWP;varying vec3 vWN;').replace('#include <opaque_fragment>',`
 if(vWN.y>.9&&abs(vWP.y-uMirY)<.05){vec2 ruv=vRefl.xy/vRefl.w;vec2 j=(normal.xy)*.03;
  vec3 rc=(texture2D(tRefl,ruv+j).rgb*.4+texture2D(tRefl,ruv+j+vec2(.004,0.)).rgb*.2+texture2D(tRefl,ruv+j-vec2(.004,0.)).rgb*.2+texture2D(tRefl,ruv+j+vec2(0.,.006)).rgb*.2);
  float fr=.3+.7*pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);float rough=texture2D(roughnessMap,vRoughnessMapUv).g;outgoingLight+=rc*uReflStr*fr*(1.15-rough);}
 #include <opaque_fragment>`);};mat.customProgramCacheKey=()=>'refl';return mat;}

/* ---------- geometry helpers ---------- */
function cylUV(g,R,scale){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)*scale,p.getZ(i)*scale);else uv.setXY(i,Math.atan2(p.getZ(i),p.getX(i))*R*scale,p.getY(i)*scale);}return g;}
function wedge(r){const{x0,z0,x1,z1,axis,dir,y0,y1}=r;const P=(u,w,y)=>axis==='x'?[u,y,w]:[w,y,u];const u0=axis==='x'?x0:z0,u1=axis==='x'?x1:z1,w0=axis==='x'?z0:x0,w1=axis==='x'?z1:x1;const lo=dir>0?u0:u1,hi=dir>0?u1:u0;
 const tri=[];const q=(a,b,c,d)=>tri.push(a,b,c,a,c,d);const A=P(lo,w0,y0),B=P(lo,w1,y0),Ct=P(hi,w1,y1),Dt=P(hi,w0,y1),Cb=P(hi,w1,y0),Db=P(hi,w0,y0);
 q(A,B,Ct,Dt);q(Db,Dt,Ct,Cb);tri.push(A,Dt,Db);tri.push(B,Cb,Ct);q(A,Db,Cb,B);
 const pos=new Float32Array(tri.length*3);tri.forEach((p,i)=>pos.set(p,i*3));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(tri.length*2),2));g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal,cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2;for(let i=0;i<p.count;i+=3){const mx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3-cx,my=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3-cy,mz=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3-cz;
  if(mx*n.getX(i)+my*n.getY(i)+mz*n.getZ(i)<0){const t=[p.getX(i+1),p.getY(i+1),p.getZ(i+1)];p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,...t);}}
 g.computeVertexNormals();boxUV(g,.25);return g;}
// triangle soup -> geometry (flat normals); uvs given per vertex
function soup(pos,uv){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(uv),2));g.computeVertexNormals();return g;}
// gable roof over [x0,x1]x[z0,z1] at height y, ridge along the long side; returns {roof, ends}
function gableRoof(x0,z0,x1,z1,y,ov=.45){const alongX=x1-x0>=z1-z0,w=alongX?z1-z0:x1-x0,rh=Math.min(3.2,w*.32);const P=(u,v,h)=>alongX?[u,h,v]:[v,h,u];
 const u0=(alongX?x0:z0)-ov,u1=(alongX?x1:z1)+ov,v0=(alongX?z0:x0)-ov,v1=(alongX?z1:x1)+ov,vc=(v0+v1)/2,drop=ov*rh/(w/2);const pos=[],uv=[];const sl=Math.hypot(w/2+ov,rh+drop);
 const quad=(a,b,c,d,ua,ub,uc,ud)=>{pos.push(...a,...b,...c,...a,...c,...d);uv.push(...ua,...ub,...uc,...ua,...uc,...ud);};
 quad(P(u0,v0,y-drop),P(u1,v0,y-drop),P(u1,vc,y+rh),P(u0,vc,y+rh),[u0*.5,0],[u1*.5,0],[u1*.5,sl*.5],[u0*.5,sl*.5]);
 quad(P(u1,v1,y-drop),P(u0,v1,y-drop),P(u0,vc,y+rh),P(u1,vc,y+rh),[u1*.5,0],[u0*.5,0],[u0*.5,sl*.5],[u1*.5,sl*.5]);
 const roof=soup(pos,uv);const ep=[],eu=[];const a0=alongX?x0:z0,a1=alongX?x1:z1,b0=alongX?z0:x0,b1=alongX?z1:x1,bc=(b0+b1)/2;
 for(const a of[a0,a1]){const t=[P(a,b0,y),P(a,b1,y),P(a,bc,y+rh)];for(const tt of[t,t.slice().reverse()])for(const p of tt){ep.push(...p);eu.push((alongX?p[2]:p[0])*.25,p[1]*.25);}}
 const ends=soup(ep,eu);const ridge=new THREE.BoxGeometry(alongX?u1-u0:.32,.22,alongX?.32:u1-u0);ridge.translate(alongX?(u0+u1)/2:vc,y+rh+.05,alongX?vc:(u0+u1)/2);return{roof,ends,ridge,rh};}

/* ---------- materials ---------- */
const setCache={};const cached=(k,f)=>setCache[k]||(setCache[k]=f());
function makeMats(T,mirror,theme){const std=o=>new THREE.MeshStandardMaterial(o);const M={};
 const st=cached('stucco',()=>stuccoSet(3));
 M.house=std({...st,roughness:.92,metalness:0,vertexColors:true});
 M.stone=std({...cached('stone',()=>stuccoSet(9)),color:theme==='coast'?0xe2d2b2:0x8a8890,roughness:.9,vertexColors:true});
 M.paving=std({...cached('cobble',()=>cobbleSet()),roughness:1,metalness:0});M.paving.map.repeat.set(1,1);
 const asp=cached('asphalt',()=>asphaltSet());M.asphalt=std({...asp,roughness:1,metalness:.1});reflective(M.asphalt,mirror.U);mirror.U.uReflStr.value=.85;
 M.wood=std({...cached('wood',()=>woodSet('#9a6a40')),roughness:.75,metalness:0});M.crate=std({...cached('crate',()=>woodSet('#b07a44',9)),roughness:.8,metalness:0});
 M.roof=std({...cached('roof',()=>roofSet()),roughness:.8,metalness:0,side:THREE.DoubleSide});
 const co=cached('corr',()=>corrugatedSet());M.metal=std({...co,roughness:.6,metalness:.55,vertexColors:true});M.container=std({...co,roughness:.55,metalness:.5,vertexColors:true});
 M.concrete=std({...cached('conc',()=>concreteSet()),roughness:.9,metalness:0,vertexColors:true});M.brick=std({...cached('brick',()=>brickSet()),roughness:.9,metalness:0,vertexColors:true});
 M.grate=std({...cached('panel',()=>panelSet('#3a3e48',17)),roughness:.45,metalness:.8});M.rail=std({color:theme==='coast'?0x2a2e34:0x30333c,roughness:.4,metalness:.8});
 M.barrel=std({color:0xffffff,roughness:.45,metalness:.5,vertexColors:true});M.iron=std({color:0x24272c,roughness:.5,metalness:.7});M.white=std({color:0xf2efe6,roughness:.6});
 M.glass=std({color:T.glass,roughness:.08,metalness:.9,envMapIntensity:1.6});M.frame=std({color:T.frame,roughness:.55,metalness:.1,vertexColors:true});
 M.leaf=std({color:0xffffff,roughness:.8,flatShading:true,vertexColors:true});M.bark=std({color:0x7a5a3c,roughness:.95});M.glow=new THREE.MeshBasicMaterial({vertexColors:true});
 M.fabric=std({color:0xffffff,roughness:.85,vertexColors:true,side:THREE.DoubleSide});return M;}
function brickSet(){const n=256,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),r=rng(5);x.fillStyle='#8a8580';x.fillRect(0,0,n,n);const bh=n/16,bw=n/6;
 for(let j=0;j<16;j++)for(let i=-1;i<7;i++){const k=.8+r()*.35;x.fillStyle=`rgb(${190*k|0},${185*k|0},${180*k|0})`;x.fillRect(i*bw+(j%2?bw/2:0)+2,j*bh+2,bw-4,bh-4);}
 const h=document.createElement('canvas');h.width=h.height=n;const hx=h.getContext('2d');hx.drawImage(c,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return{map:t};}

/* ---------- skies ---------- */
const SKYV='varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}';
const NOISE=`float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=vn(p)*a;p*=2.03;a*=.5;}return s;}
float stars(vec3 d,float dens){vec3 q=d*dens;vec3 id=floor(q);float s=h3(id);vec3 f=fract(q)-.5-(vec3(h3(id+3.),h3(id+5.),h3(id+7.))-.5)*.6;return step(.965,s)*smoothstep(.09,0.,length(f))*(.4+1.6*h3(id+1.));}`;
function skyMat(kind,sunDir){const U={uSun:{value:sunDir.clone()}};let f;
 if(kind==='day')f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;
  vec3 zen=vec3(.12,.34,.78),hor=vec3(.62,.78,.96),low=vec3(.78,.86,.94);vec3 c=mix(hor,zen,pow(clamp(y,0.,1.),.5));c=mix(c,low,smoothstep(0.,-.1,y));
  float cl=fbm(vec3(d.xz/(abs(y)+.25)*1.6,1.));float cl2=fbm(vec3(d.xz/(abs(y)+.25)*4.,3.));float cm=smoothstep(.5,.78,cl*.8+cl2*.3)*smoothstep(.02,.28,y);
  vec3 ccol=mix(vec3(.82,.86,.94),vec3(1.06,1.04,1.),smoothstep(.4,.9,cl2));c=mix(c,ccol,cm*.85);
  float sd=max(dot(d,uSun),0.);c+=vec3(1.,.92,.75)*(pow(sd,1400.)*40.+pow(sd,70.)*.5+pow(sd,6.)*.14);gl_FragColor=vec4(c,1.);}`;
 else f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;
  vec3 top=vec3(.012,.012,.05),mid=vec3(.08,.04,.16),hor=vec3(.55,.18,.38);vec3 c=mix(hor,mid,smoothstep(-.02,.2,y));c=mix(c,top,smoothstep(.15,.7,y));c=mix(c,vec3(.1,.04,.12),smoothstep(0.,-.2,y));
  c+=vec3(.9,.9,1.)*stars(d,300.)*smoothstep(.12,.5,y)*1.3;float cl=fbm(vec3(d.x*3.,d.y*10.,d.z*3.));c=mix(c,c*.6+vec3(.22,.06,.2),smoothstep(.55,.78,cl)*smoothstep(.45,.08,y)*.8);
  float m=dot(d,normalize(vec3(.4,.38,-.83)));float disc=smoothstep(.9985,.9989,m);float cr=fbm(d*70.);c=mix(c,vec3(1.,.97,.9)*(.8+cr*.35),disc);c+=vec3(.5,.55,.9)*pow(max(m,0.),80.)*.4;
  gl_FragColor=vec4(c,1.);}`;
 return new THREE.ShaderMaterial({uniforms:U,vertexShader:SKYV,fragmentShader:f,side:THREE.BackSide,depthWrite:false,fog:false});}

/* ---------- house dressing ---------- */
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
function dressHouse(H,T,theme,bounds,out,r){const{x0,z0,x1,z1,y0,h}=H,top=y0+h;const wc=col(H.col||'#e8dcc8');const mat=H.mat||'house';
 // walls
 const g=BX(x1-x0,h,z1-z0);g.translate((x0+x1)/2,y0+h/2,(z0+z1)/2);boxUV(g,.25);(out[mat]||(out[mat]=[])).push([g,null,wc]);
 // plinth + cornice
 const trimC=theme==='coast'?col('#f6f1e6'):col('#2a2c34');
 const pl=BX(x1-x0+.16,.5,z1-z0+.16);pl.translate((x0+x1)/2,y0+.25,(z0+z1)/2);boxUV(pl,.25);out.stone.push([pl,null,theme==='coast'?col('#c8b896'):col('#55555e')]);
 const cn=BX(x1-x0+.3,.28,z1-z0+.3);cn.translate((x0+x1)/2,top-.14,(z0+z1)/2);out.frame.push([cn,null,trimC]);
 // roof
 if(H.roof==='gable'){const R=gableRoof(x0,z0,x1,z1,top);out.roof.push([R.roof]);out.roof.push([R.ridge]);out[mat].push([R.ends,null,wc]);}
 else{const pt=.3,ph=.7;for(const[cx,cz,w,d]of[[(x0+x1)/2,z0+pt/2,x1-x0,pt],[(x0+x1)/2,z1-pt/2,x1-x0,pt],[x0+pt/2,(z0+z1)/2,pt,z1-z0],[x1-pt/2,(z0+z1)/2,pt,z1-z0]]){const p=BX(w,ph,d);p.translate(cx,top+ph/2,cz);boxUV(p,.25);out[mat].push([p,null,wc.clone().multiplyScalar(.92)]);}
  // rooftop clutter
  const n=Math.max(1,((x1-x0)*(z1-z0)/60)|0);for(let i=0;i<n;i++){const ax=x0+1.5+r()*(x1-x0-3),az=z0+1.5+r()*(z1-z0-3);if(r()<.5){const a=BX(1.4,1,1.1);a.translate(ax,top+.5,az);out.grate.push([a]);}else{const t=new THREE.CylinderGeometry(.7,.7,1.6,12);t.translate(ax,top+.8,az);out.iron.push([t]);}}}
 // windows per face (skip faces that look out of the playable area)
 const faces=[[x0,z0,x1,z0,0,-1],[x1,z1,x0,z1,0,1],[x0,z1,x0,z0,-1,0],[x1,z0,x1,z1,1,0]];const[b0,b1,b2,b3]=bounds;
 const shutC=col(H.shut||'#3c8a6a');let best=null,bestD=1e9;
 for(const[ax,az,bx,bz,nx,nz]of faces){const L=Math.hypot(bx-ax,bz-az),mx=(ax+bx)/2+nx*2,mz=(az+bz)/2+nz*2;if(mx<b0-1||mx>b1+1||mz<b2-1||mz>b3+1)continue;
  const dc=Math.hypot(mx,mz);if(dc<bestD){bestD=dc;best=[ax,az,bx,bz,nx,nz,L];}
  const cols=Math.floor((L-1.2)/3.1);if(cols<1)continue;const sp=L/cols,ux=(bx-ax)/L,uz=(bz-az)/L,ry=Math.atan2(nx,nz);const floors=Math.floor((h-.6)/3.3);
  const awn=H.awn&&((H.awn==='s'&&nz<0)||(H.awn==='n'&&nz>0)||(H.awn==='w'&&nx<0)||(H.awn==='e'&&nx>0));
  for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){const u=(c+.5)*sp,px=ax+ux*u,pz=az+uz*u,py=y0+1.7+f*3.3;const P=(du,dv,dn)=>[px+ux*du+nx*dn,py+dv,pz+uz*du+nz*dn];
   const put=(list,w,hh,d,du,dv,dn,c2)=>{const b=BX(w,hh,d);const p=P(du,dv,dn);list.push([b,M4(p[0],p[1],p[2],0,ry,0),c2]);};
   if(f===0&&y0===0){// ground floor: doors / shop fronts
    if(c%2===0||awn){put(out.glassL,1.5,2.3,.06,0,-.25,0);put(out.frame,1.74,.14,.16,0,.97,.06,trimC);put(out.frame,.12,2.4,.16,-.81,-.2,.06,trimC);put(out.frame,.12,2.4,.16,.81,-.2,.06,trimC);
     if(awn){const a=new THREE.PlaneGeometry(2.4,1.3);a.rotateX(-1.05);const p=P(0,1.35,.55);out.awn.push([a,M4(p[0],p[1],p[2],0,ry,0)]);}}
    continue;}
   const lit=T.lit&&r()<.42;put(lit?out.litW:out.glassL,1,1.45,.06,0,0,0,lit?(r()<.6?C(2.6,1.7,.8):r()<.5?C(.7,1.6,2.6):C(2.4,.8,2)):undefined);
   put(out.frame,1.24,.12,.14,0,.78,.05,trimC);put(out.frame,1.36,.1,.28,0,-.78,.1,trimC);put(out.frame,.1,1.5,.12,-.57,0,.05,trimC);put(out.frame,.1,1.5,.12,.57,0,.05,trimC);
   if(theme==='coast'){if(r()<.28)put(out.frame,1,1.42,.08,0,0,.06,shutC);else{put(out.frame,.5,1.46,.06,-.84,0,.07,shutC);put(out.frame,.5,1.46,.06,.84,0,.07,shutC);}
    if(r()<.3){put(out.wood,1.1,.25,.3,0,-.95,.25);for(let k=0;k<3;k++){const fl=new THREE.IcosahedronGeometry(.13,0);const p=P(-.35+k*.35,-.7,.28);out.leaf.push([fl,M4(p[0],p[1],p[2]),r()<.5?C(.9,.2,.3):C(.95,.55,.85)]);}}}
   else if(r()<.25){put(out.grate,.9,.6,.5,.6,-1.3,.3);}}}
 // neon: roof-edge tube + sign on the face that looks toward the map centre
 if(H.neon){const nc=col(H.neon).multiplyScalar(2.6);for(const[ax,az,bx,bz,nx,nz]of faces){const L=Math.hypot(bx-ax,bz-az),mx=(ax+bx)/2,mz=(az+bz)/2;const t=BX(nz?L:.08,.08,nx?L:.08);t.translate(mx+nx*.2,top-.42,mz+nz*.2);out.neon.push([t,null,nc]);}
  if(best&&H.sign)out.signs.push({x:(best[0]+best[2])/2+best[4]*.35,y:Math.min(top-2.2,y0+6),z:(best[1]+best[3])/2+best[5]*.35,nx:best[4],nz:best[5],text:H.sign,col:H.neon});}
 if(H.tower){}}

function signMesh(s){const t=ctex(512,128,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.font='86px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#fff';x.shadowBlur=16;x.fillStyle='#fff';x.fillText(s.text,w/2,h/2+4);
  x.shadowBlur=0;x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=5;x.strokeRect(10,10,w-20,h-20);},{clamp:true});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(s.w||6.4,(s.w||6.4)/4),new THREE.MeshBasicMaterial({map:t,color:col(s.col).multiplyScalar(2.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
 m.position.set(s.x,s.y,s.z);m.rotation.y=Math.atan2(s.nx,s.nz);return m;}

/* ---------- props ---------- */
function dressProps(D,T,theme,out,r,root,anim){
 const leafC=()=>theme==='coast'?C(.28+r()*.12,.5+r()*.15,.18):C(.1,.4,.25);
 for(const p of D.props){const{x,y,z}=p;
  if(p.type==='stall'){const w=p.w||3,d=p.d||1.6;for(const sx of[-1,1])for(const sz of[-1,1]){const g=BX(.1,2.4,.1);g.translate(x+sx*(w/2-.1),y+1.2,z+sz*(d/2-.1));out.iron.push([g]);}
   const a=new THREE.PlaneGeometry(w+.6,d+.9,1,1);a.rotateX(-Math.PI/2+.2);a.translate(x,y+2.5,z);out.awnC.push([a,null,{c1:p.c1,c2:p.c2}]);
   for(let i=0;i<6;i++){const b=BX(.5,.25,.4);b.translate(x-w/2+.5+i%3*(w/3),y+1.18,z-.3+(i/3|0)*.6);out.crate.push([b]);for(let k=0;k<3;k++){const f=new THREE.IcosahedronGeometry(.09,0);f.translate(x-w/2+.4+i%3*(w/3)+k*.12,y+1.37,z-.3+(i/3|0)*.6);out.leaf.push([f,null,[C(.95,.3,.15),C(.95,.75,.15),C(.4,.75,.2)][i%3]]);}}}
  else if(p.type==='planter'){const w=p.w||2.4,d=p.d||1.2;for(let i=0;i<5;i++){const b=new THREE.IcosahedronGeometry(.4+r()*.2,1);b.translate(x-w/2+.4+i*(w-.8)/4,y+1+r()*.15,z+(r()-.5)*.3);out.leaf.push([b,null,leafC()]);}
   if(theme==='coast')for(let i=0;i<8;i++){const f=new THREE.IcosahedronGeometry(.1,0);f.translate(x-w/2+.3+r()*(w-.6),y+1.3+r()*.2,z+(r()-.5)*.6);out.leaf.push([f,null,r()<.5?C(.95,.35,.5):C(1,.85,.3)]);}}
  else if(p.type==='tree'){const t=new THREE.CylinderGeometry(.16,.24,2.6,8);t.translate(x,y+1.3,z);out.bark.push([t]);for(let i=0;i<5;i++){const b=new THREE.IcosahedronGeometry(1+r()*.5,1);b.translate(x+(r()-.5)*1.6,y+3+r()*1.4,z+(r()-.5)*1.6);out.leaf.push([b,null,leafC()]);}}
  else if(p.type==='palm'){let px=x,pz=z,py=y;const lean=r()*6.28,lx=Math.cos(lean)*.12,lz=Math.sin(lean)*.12;for(let i=0;i<7;i++){const s=new THREE.CylinderGeometry(.17-i*.012,.2-i*.012,1,8);s.translate(px,py+.5,pz);out.bark.push([s]);px+=lx*(1+i*.3);pz+=lz*(1+i*.3);py+=.95;}
   for(let i=0;i<8;i++){const a=i/8*6.28+r()*.3;const f=new THREE.ConeGeometry(.42,3.2,4,1);f.scale(1,1,.18);f.translate(0,-1.6,0);f.rotateZ(Math.PI/2+.55);f.rotateY(-a);f.translate(px,py+.1,pz);out.leaf.push([f,null,C(.24+r()*.1,.48+r()*.1,.16)]);}}
  else if(p.type==='lamp'){const t=new THREE.CylinderGeometry(.06,.1,3.6,8);t.translate(x,y+1.8,z);out.iron.push([t]);const a=BX(.08,.08,.7);a.translate(x,y+3.5,z+(z>0?-.3:.3));out.iron.push([a]);
   const b=new THREE.SphereGeometry(.17,12,8);b.translate(x,y+3.32,z+(z>0?-.6:.6));out.lamps.push([b,null,theme==='coast'?C(2.6,2,1.2):(r()<.5?C(.5,2.4,3):C(3,.6,2.4))]);}
  else if(p.type==='fountain'){const w=new THREE.Mesh(new THREE.CircleGeometry((p.r||1.5)-.15,32),waterMat(anim,true));w.rotation.x=-Math.PI/2;w.position.set(x,y+.85,z);root.add(w);
   const sp=new THREE.CylinderGeometry(.18,.28,1.6,10);sp.translate(x,y+1.6,z);out.stone.push([sp,null,col('#e8dcc0')]);const bowl=new THREE.CylinderGeometry(.6,.2,.3,16);bowl.translate(x,y+2.4,z);out.stone.push([bowl,null,col('#e8dcc0')]);}
  else if(p.type==='bench'){const s=BX(p.rot?.5:1.9,.08,p.rot?1.9:.5);s.translate(x,y+.48,z);out.wood.push([s]);const b=BX(p.rot?.08:1.9,.45,p.rot?1.9:.08);b.translate(x+(p.rot?-.22:0),y+.75,z+(p.rot?0:.22));out.wood.push([b]);}}}
function waterMat(anim,small){const U=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uT:{value:0}}]);anim.push(t=>U.uT.value=t);return new THREE.ShaderMaterial({uniforms:U,transparent:small,fog:!small,
 vertexShader:'#include <fog_pars_vertex>\nvarying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
 fragmentShader:`#include <fog_pars_fragment>
uniform float uT;varying vec3 vW;void main(){vec2 p=vW.xz;float w=sin(p.x*.35+uT*1.1)*.5+sin(p.y*.5-uT*.8+p.x*.2)*.5+sin((p.x+p.y)*1.3+uT*2.)*.25+sin(p.x*2.7-p.y*1.9+uT*2.6)*.15;
  vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(V.y,0.),4.);vec3 deep=vec3(.03,.22,.36),shal=vec3(.12,.48,.58),sky=vec3(.62,.8,.98);vec3 c=mix(deep,shal,.5+w*.25);c=mix(c,sky,fr*.75);
  float glint=pow(max(0.,w),6.)*.6*(1.-fr);c+=vec3(1.,.95,.8)*glint;float foam=smoothstep(.9,1.15,w);c=mix(c,vec3(.9,.95,1.),foam*.3);gl_FragColor=vec4(c*${small?'1.15':'1.'},${small?'.85':'1.'});
#include <fog_fragment>
}`});}

/* ---------- payload track + checkpoint arches ---------- */
export function trackMesh(route,trimCol){const parts=[],glow=[],sAttr=[];let s0=0;const R=new THREE.MeshStandardMaterial({color:0x8a8f98,roughness:.3,metalness:.95});
 for(let i=0;i<route.length-1;i++){const a=route[i],b=route[i+1],L=a.distanceTo(b),ang=Math.atan2(b.x-a.x,b.z-a.z),cx=(a.x+b.x)/2,cz=(a.z+b.z)/2,nx=Math.cos(ang),nz=-Math.sin(ang);
  for(const s of[-.78,.78]){const g=BX(.1,.07,L+.2);parts.push([g,M4(cx+nx*s,.035,cz+nz*s,0,ang,0)]);}
  for(let k=.6;k<L;k+=1.3){const g=BX(2,.05,.22);parts.push([g,M4(a.x+(b.x-a.x)*k/L,.02,a.z+(b.z-a.z)*k/L,0,ang,0)]);}
  const g=new THREE.PlaneGeometry(.22,L+.2,1,8).toNonIndexed();g.rotateX(-Math.PI/2);g.rotateY(ang);g.translate(cx,.045,cz);const p=g.attributes.position;for(let k=0;k<p.count;k++){const px=p.getX(k)-a.x,pz=p.getZ(k)-a.z;sAttr.push(s0+Math.max(0,Math.min(L,(px*(b.x-a.x)+pz*(b.z-a.z))/L)));}glow.push(g);s0+=L;}
 const m=new THREE.Mesh(merge(parts),R);m.receiveShadow=true;const gg=merge(glow.map(g=>[g]));gg.setAttribute('aS',new THREE.BufferAttribute(new Float32Array(sAttr),1));
 const U={uS:{value:0},uA:{value:new THREE.Color(.4,1.2,3)},uN:{value:new THREE.Color(1.2,1.2,1.3)},uT:{value:0}};
 const gm=new THREE.Mesh(gg,new THREE.ShaderMaterial({uniforms:U,vertexShader:'attribute float aS;varying float vS;void main(){vS=aS;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uS,uT;uniform vec3 uA,uN;varying float vS;void main(){float done=step(vS,uS);float dash=step(.5,fract(vS*.5-uT*.8));vec3 c=mix(uN*(.35+.25*dash),uA*(.9+.3*dash),done);gl_FragColor=vec4(c,1.);}'}));
 const g=new THREE.Group();g.add(m,gm);g.userData.U=U;return g;}
function gateMesh(gt,T,theme,M){const g=new THREE.Group();const w=gt.w,h=gt.tall||5.2;const pm=theme==='coast'?M.stone:M.grate;const parts=[];
 for(const s of[-1,1]){parts.push([BX(.7,h,.7),M4(0,h/2,s*w/2)]);parts.push([BX(.9,.4,.9),M4(0,.2,s*w/2)]);}parts.push([BX(.8,.6,w+.7),M4(0,h+.3,0)]);
 const m=new THREE.Mesh(merge(parts),pm);m.castShadow=true;g.add(m);const tc=gt.cp?(gt.cp===2?C(3,2.2,.6):C(1.6,2.4,3)):T.trim;
 const lt=new THREE.Mesh(BX(.12,.12,w-.2),new THREE.MeshBasicMaterial({color:tc}));lt.position.set(.42,h+.1,0);g.add(lt);const lt2=lt.clone();lt2.position.x=-.42;g.add(lt2);
 for(const s of[-1,1]){const v=new THREE.Mesh(BX(.08,h-.6,.08),new THREE.MeshBasicMaterial({color:tc}));v.position.set(.37,h/2,s*(w/2-.36));g.add(v);}
 if(gt.cp){const t=ctex(512,128,(x,W,H)=>{x.fillStyle='rgba(0,0,0,0)';x.clearRect(0,0,W,H);x.font='72px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.fillText(gt.cp===2?'DESTINATION':'CHECKPOINT',W/2,H/2+4);},{clamp:true});
  for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w-1,7),1.6),new THREE.MeshBasicMaterial({map:t,color:tc.clone().multiplyScalar(.8),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));p.position.set(s*.45,h-.6,0);p.rotation.y=s*Math.PI/2;g.add(p);}}
 g.position.set(gt.x,0,gt.z);g.rotation.y=gt.ang;return g;}

/* ---------- backdrops ---------- */
function coastBackdrop(root,anim,r,M){
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(3000,1400),waterMat(anim,false));sea.rotation.x=-Math.PI/2;sea.position.set(0,-1.4,-731);root.add(sea);
 const quay=BX(170,2.4,3);quay.translate(0,-1.2,-32.2);const qm=new THREE.Mesh(quay,M.stone);root.add(qm);
 // hillside town to the north + headlands
 const walls=[],roofs=[],ends=[],leaves=[];
 for(let i=0;i<150;i++){const x=-170+r()*340,z=40+r()*130,base=(z-40)*.28+Math.sin(x*.03)*3,w=5+r()*8,d=5+r()*6,h=5+r()*7;const g=BX(w,h+base+6,d);g.translate(x,(h+base+6)/2-6,z);boxUV(g,.25);
  const c=new THREE.Color().setHSL(.07+r()*.08,.35+r()*.3,.72+r()*.18);walls.push([g,null,c]);if(r()<.8){const R=gableRoof(x-w/2,z-d/2,x+w/2,z+d/2,h+base,.35);roofs.push([R.roof]);ends.push([R.ends,null,c]);}}
 for(let i=0;i<60;i++){const x=-170+r()*340,z=44+r()*120,base=(z-40)*.28;const t=new THREE.ConeGeometry(.9+r()*.4,6+r()*4,7);t.translate(x,base+3+r()*2,z);leaves.push([t,null,C(.14,.3,.12)]);}
 root.add(new THREE.Mesh(merge(walls.concat(ends)),M.house),new THREE.Mesh(merge(roofs),M.roof),new THREE.Mesh(merge(leaves),M.leaf));
 const hills=[];for(let i=0;i<14;i++){const x=-500+i*80+r()*40,z=200+r()*120,h=50+r()*80;const g=new THREE.ConeGeometry(70+r()*60,h,9);g.translate(x,h/2-8,z);hills.push([g,null,C(.42,.52,.36)]);}
 for(const[x,z,s]of[[-380,-420,60],[320,-520,90],[620,-300,50]]){const g=new THREE.ConeGeometry(s*1.6,s*.6,10);g.translate(x,s*.25-4,z);hills.push([g,null,C(.45,.55,.42)]);}
 root.add(new THREE.Mesh(merge(hills),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true})));
 // boats + lighthouse
 const bp=[];for(const[x,z,a]of[[-40,-70,.3],[30,-110,-.4],[95,-60,1.2],[-110,-140,.8]]){bp.push([BX(2.2,1,7),M4(x,-.9,z,0,a,0),C(.95,.95,.92)],[BX(1.6,.9,2.4),M4(x,.05,z+.5,0,a,0),C(.2,.45,.75)]);const s=new THREE.ConeGeometry(2,6,3);s.scale(1,1,.05);bp.push([s,M4(x,3,z,0,a,0),C(1,.98,.94)]);}
 const lh=[[new THREE.CylinderGeometry(2.2,3,22,16),M4(110,10,-56),C(.96,.96,.94)],[new THREE.CylinderGeometry(2.25,2.25,3,16),M4(110,5,-56),C(.85,.2,.18)],[new THREE.CylinderGeometry(2.25,2.25,3,16),M4(110,14,-56),C(.85,.2,.18)],[new THREE.CylinderGeometry(6,8,6,12),M4(110,-3,-56),C(.5,.48,.44)],[new THREE.ConeGeometry(2.6,2.4,16),M4(110,24.4,-56),C(.85,.2,.18)]];
 root.add(new THREE.Mesh(merge(bp.concat(lh)),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6})));
 const beacon=new THREE.Mesh(new THREE.SphereGeometry(.9,12,8),new THREE.MeshBasicMaterial({color:C(3,2.6,1.6)}));beacon.position.set(110,22.4,-56);root.add(beacon);}
function neonBackdrop(root,anim,r,M){
 const win=ctex(256,512,(x,w,h)=>{x.fillStyle='#07080e';x.fillRect(0,0,w,h);for(let j=0;j<64;j++)for(let i=0;i<16;i++){const v=Math.random();if(v<.38){x.fillStyle=v<.12?'#ffd890':v<.22?'#9fd8ff':v<.27?'#ff70c0':'#6a7090';x.fillRect(i*16+3,j*8+2,10,5);}}});
 const tm=new THREE.MeshStandardMaterial({color:0x14161e,roughness:.6,metalness:.4,emissiveMap:win,emissive:0xffffff,emissiveIntensity:1.4,map:win});
 const parts=[];for(let i=0;i<120;i++){const a=r()*Math.PI*2,d=150+r()*260,w=14+r()*26,h=30+r()*110,x=Math.cos(a)*d*1.3,z=Math.sin(a)*d;const g=BX(w,h,w*(.6+r()*.6));g.translate(x,h/2-4,z);
  const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*w/18,uv.getY(k)*h/36);parts.push([g]);}
 root.add(new THREE.Mesh(merge(parts),tm));
 const bb=[['ZENITH',0x3dd8ff,-60,-170,0],['NOVA LIFE',0xff3d9a,120,-150,-.5],['KAIZEN',0xffd23d,-180,40,1.4],['LUMEN',0xb05aff,170,90,-1.8]];
 for(const[t,c,x,z,ry]of bb){const m=signMesh({text:t,col:'#'+new THREE.Color(c).getHexString(),x,y:46,z,nx:0,nz:1,w:40});m.rotation.y=ry;root.add(m);}
 const bk=[];for(let i=0;i<40;i++){const a=r()*Math.PI*2,d=170+r()*230;const g=new THREE.SphereGeometry(.8,6,4);g.translate(Math.cos(a)*d*1.3,60+r()*80,Math.sin(a)*d);bk.push([g,null,C(3,.3,.2)]);}
 const bm=new THREE.Mesh(merge(bk),M.glow);root.add(bm);anim.push(t=>{bm.visible=(t*1.3%1)<.55;});
 // elevated rail viaduct along the north edge
 const via=[];for(let x=-130;x<=130;x+=10){via.push([BX(1.2,9,1.2),M4(x,4.5,48)]);}via.push([BX(270,1.2,6),M4(0,9.6,48)]);root.add(new THREE.Mesh(merge(via),M.grate));
 const vl=BX(270,.1,.1);vl.translate(0,10.3,45);root.add(new THREE.Mesh(vl,new THREE.MeshBasicMaterial({color:C(2.6,.6,2.2)})));}

/* ---------- build ---------- */
export function buildScene(D,R,gfx){const def=D.def,theme=def.theme,T=THEMES[theme],root=new THREE.Group(),anim=[];const r=rng(def.seed+5);
 const sunDir=new V(...T.sun[2]).normalize();const mirror=new Mirror(.5);mirror.on=theme==='neon';const M=makeMats(T,mirror,theme);
 const out={house:[],stone:[],paving:[],asphalt:[],wood:[],crate:[],roof:[],metal:[],container:[],concrete:[],brick:[],grate:[],rail:[],barrel:[],iron:[],frame:[],glassL:[],litW:[],leaf:[],bark:[],awn:[],awnC:[],lamps:[],neon:[],signs:[]};
 // generic solids
 for(const s of D.solids){if(s.o.novis||s.mat==='none'||s.mat==='house')continue;const h=s.b[1]-s.a[1];const c=s.col?col(s.col):(s.mat==='barrel'?C(.75,.22,.16):s.mat==='container'?C(.5,.55,.6):s.mat==='stone'&&theme==='neon'?C(.85,.85,.9):undefined);
  if(s.c){const g=new THREE.CylinderGeometry(s.R,s.R,h,Math.max(14,Math.min(48,s.R*10|0)),1);g.translate(s.cx,s.a[1]+h/2,s.cz);cylUV(g,s.R,.25);(out[s.mat]||out.stone).push([g,null,c]);
   if(s.o.trim){const t=new THREE.TorusGeometry(s.R+.02,.06,6,64);t.rotateX(Math.PI/2);t.translate(s.cx,s.b[1]-.05,s.cz);out.neon.push([t,null,T.trim]);}
   if(s.o.tower){const cap=new THREE.ConeGeometry(s.R+.5,4,8);cap.translate(s.cx,s.b[1]+2,s.cz);out.roof.push([cap]);const bel=new THREE.CylinderGeometry(s.R+.25,s.R+.25,.5,16);bel.translate(s.cx,s.b[1]-.2,s.cz);out.frame.push([bel,null,col('#f6f1e6')]);
    const face=ctex(256,256,(x,w,hh)=>{x.fillStyle='#f6f0e0';x.beginPath();x.arc(w/2,hh/2,120,0,7);x.fill();x.strokeStyle='#2a2a30';x.lineWidth=8;x.stroke();for(let k=0;k<12;k++){const a=k/12*Math.PI*2;x.fillStyle='#2a2a30';x.fillRect(w/2+Math.cos(a)*100-4,hh/2+Math.sin(a)*100-4,8,8);}
     x.lineWidth=10;x.beginPath();x.moveTo(w/2,hh/2);x.lineTo(w/2+50,hh/2-40);x.moveTo(w/2,hh/2);x.lineTo(w/2-10,hh/2+85);x.stroke();},{clamp:true});
    for(let k=0;k<4;k++){const a=k*Math.PI/2;const p=new THREE.Mesh(new THREE.CircleGeometry(1.4,32),new THREE.MeshStandardMaterial({map:face,roughness:.6}));p.position.set(s.cx+Math.sin(a)*(s.R+.06),s.b[1]-1.8,s.cz+Math.cos(a)*(s.R+.06));p.rotation.y=a;root.add(p);}}
   continue;}
  const w=s.b[0]-s.a[0],d=s.b[2]-s.a[2],cx=(s.a[0]+s.b[0])/2,cz=(s.a[2]+s.b[2])/2;const g=BX(w,h,d);g.translate(cx,s.a[1]+h/2,cz);boxUV(g,s.mat==='container'?.38:.25);(out[s.mat]||out.stone).push([g,null,c]);
  if(s.mat==='container'){for(const sx of[-1,1]){const e=BX(w<d?w+.04:.12,h+.04,w<d?.12:d+.04);e.translate(cx+(w<d?0:sx*(w/2-.04)),s.a[1]+h/2,cz+(w<d?sx*(d/2-.04):0));out.iron.push([e]);}}}
 for(const rp of D.ramps)(out[rp.mat]||out.stone).push([wedge(rp),null,theme==='neon'&&rp.mat==='stone'?C(.85,.85,.9):undefined]);
 for(const H of D.houses)dressHouse(H,T,theme,def.bounds,out,r);
 dressProps(D,T,theme,out,r,root,anim);
 const solidMeshes=[];
 for(const k in out){const L=out[k];if(!L.length||k==='signs'||k==='awnC'||k==='litW'||k==='neon'||k==='lamps'||k==='awn')continue;const mt=k==='glassL'?M.glass:M[k]||M.stone;const m=new THREE.Mesh(merge(L),mt);m.castShadow=k!=='paving'&&k!=='asphalt'&&k!=='glassL';m.receiveShadow=true;root.add(m);solidMeshes.push(m);if(k==='paving'||k==='asphalt')m.castShadow=false;}
 for(const k of['litW','neon','lamps'])if(out[k].length)root.add(new THREE.Mesh(merge(out[k]),M.glow));
 if(out.awn.length){const at=awningTex('#d84a3a','#f4efe4');root.add(new THREE.Mesh(merge(out.awn),new THREE.MeshStandardMaterial({map:at,roughness:.8,side:THREE.DoubleSide})));}
 for(const[g,,o]of out.awnC){const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:awningTex(o.c1||'#d84a3a',o.c2||'#f4efe4'),roughness:.8,side:THREE.DoubleSide}));m.castShadow=true;root.add(m);}
 for(const s of out.signs)root.add(signMesh(s));for(const s of D.signs)root.add(signMesh(s));
 for(const gt of D.gates)root.add(gateMesh(gt,T,theme,M));
 const track=trackMesh(D.route,T.trim);root.add(track);
 // sky (baked once to a cubemap) + env
 const skyScene=new THREE.Scene();const sky=new THREE.Mesh(new THREE.SphereGeometry(5000,48,24),skyMat(T.sky,sunDir));sky.frustumCulled=false;skyScene.add(sky);
 const crt=new THREE.WebGLCubeRenderTarget(gfx>=2?1024:512,{type:THREE.HalfFloatType});const cc=new THREE.CubeCamera(1,20000,crt);cc.position.set(0,4,0);skyScene.add(cc);cc.update(R,skyScene);sky.geometry.dispose();
 const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{uC:{value:crt.texture}},vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform samplerCube uC;varying vec3 vD;void main(){gl_FragColor=vec4(textureCube(uC,normalize(vD)).rgb,1.);}'})));
 if(theme==='coast'){const g=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshBasicMaterial({color:0x8a8070,side:THREE.DoubleSide}));g.rotation.x=-Math.PI/2;g.position.y=-8;envScene.add(g);}
 else for(const[x,c]of[[-40,0xff3d9a],[40,0x3dd8ff],[0,0xffa03d]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(40,6),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.5),side:THREE.DoubleSide}));p.position.set(x,20,0);p.rotation.x=Math.PI/2;envScene.add(p);}
 const pm=new THREE.PMREMGenerator(R);const env=pm.fromScene(envScene,.03).texture;pm.dispose();
 if(theme==='coast')coastBackdrop(root,anim,r,M);else neonBackdrop(root,anim,r,M);
 // lights
 const hemi=new THREE.HemisphereLight(T.hemi[0],T.hemi[1],T.hemi[2]);root.add(hemi);
 const sun=new THREE.DirectionalLight(T.sun[0],T.sun[1]);const[b0,b1,b2,b3]=def.bounds,cx=(b0+b1)/2,cz=(b2+b3)/2,ext=Math.max(b1-b0,b3-b2)/2+6;
 sun.position.set(cx+sunDir.x*160,sunDir.y*160,cz+sunDir.z*160);sun.target.position.set(cx,0,cz);sun.castShadow=true;sun.shadow.mapSize.set(gfx>=2?4096:2048,gfx>=2?4096:2048);
 Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext*.75,bottom:-ext*.75,near:40,far:360});sun.shadow.bias=-.0004;sun.shadow.normalBias=.06;root.add(sun,sun.target);
 for(const l of D.lights){const p=new THREE.PointLight(l.c,l.i,l.d,1.6);p.position.copy(l.p);root.add(p);}
 return{root,env,sun,hemi,mirror,anim,theme:T,themeId:theme,track,fog:new THREE.FogExp2(T.fog[0],T.fog[1]),bg:crt.texture,solidMeshes,glow:glowTex(),update(t){for(const f of anim)f(t);track.userData.U.uT.value=t;}};}

/* ---------- payload: the cargo core ---------- */
export function makePayload(){const g=new THREE.Group(),std=o=>new THREE.MeshStandardMaterial(o);const body=std({color:0xe8e4da,roughness:.35,metalness:.4}),dark=std({color:0x2a2d34,roughness:.5,metalness:.7}),gold=std({color:0xd8a840,roughness:.3,metalness:.9});
 const P=[];const add=(geo,m,x,y,z,rx=0,ry=0,rz=0)=>P.push([geo,m,M4(x,y,z,rx,ry,rz)]);
 add(BX(2.2,.5,3.6),dark,0,.55,0);add(BX(2.3,.35,3.2),body,0,.95,0);add(BX(2.4,.12,3.7),gold,0,1.16,0);
 for(const sx of[-1,1])for(const sz of[-1.15,0,1.15]){const w=new THREE.CylinderGeometry(.38,.38,.3,18);add(w,dark,sx*1.12,.38,sz,0,0,Math.PI/2);const hb=new THREE.CylinderGeometry(.16,.16,.32,10);add(hb,gold,sx*1.13,.38,sz,0,0,Math.PI/2);}
 for(const sz of[-1,1]){add(BX(2.4,.9,.5),body,0,1.6,sz*1.55);add(BX(.5,.9,.5),dark,0,1.6,sz*1.85);}
 for(const sx of[-1,1])for(const sz of[-1,1])add(new THREE.CylinderGeometry(.07,.07,2.1,8),gold,sx*.95,2.2,sz*1.05);
 add(new THREE.TorusGeometry(1.05,.08,8,40),gold,0,3.25,0,Math.PI/2);add(new THREE.TorusGeometry(1.05,.08,8,40),gold,0,1.25,0,Math.PI/2);
 const by=new Map();for(const[geo,m,mx]of P){let a=by.get(m);if(!a)by.set(m,a=[]);a.push([geo,mx]);}for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);o.castShadow=true;o.receiveShadow=true;g.add(o);}
 const U={uT:{value:0},uC:{value:new THREE.Color(1,1,1)}};
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.72,3),new THREE.ShaderMaterial({uniforms:U,vertexShader:'varying vec3 vN,vV,vP;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uT;uniform vec3 uC;varying vec3 vN,vV,vP;void main(){float f=pow(1.-abs(dot(vN,vV)),1.5);float b=sin(vP.y*14.+uT*4.)*.5+.5;gl_FragColor=vec4(uC*(.7+f*1.6+b*.25),1.);}'}));core.position.y=2.25;g.add(core);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.95,.035,6,48),new THREE.MeshBasicMaterial({color:C(1,1,1)}));ring.position.y=2.25;g.add(ring);
 const zone=new THREE.Mesh(new THREE.RingGeometry(3.3,3.6,64),new THREE.MeshBasicMaterial({color:C(1,1,1),transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));zone.rotation.x=-Math.PI/2;zone.position.y=.06;g.add(zone);
 const light=new THREE.PointLight(0xffffff,6,10,1.6);light.position.y=2.4;g.add(light);
 g.userData={U,core,ring,zone,light};return g;}
