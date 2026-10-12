// LONGBOW KEEP — graphics helpers: seeded noise, procedural textures, geometry batching, sky, clouds, water, waving cloth, particles.
import * as THREE from '../vendor/three.module.min.js';
export const V=THREE.Vector3,C=THREE.Color;
export const TEAMS=[
 {n:'AZURE',css:'#4c9bff',col:0x2f6fe0,dark:0x1b3b7a,light:0x9cc6ff,glow:new C(.35,.6,1.6)},
 {n:'CRIMSON',css:'#ff4b3e',col:0xc8302a,dark:0x6e1714,light:0xffa090,glow:new C(1.6,.38,.28)}];

/* ---------- seeded random + value noise ---------- */
export function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function makeNoise(seed){const r=rng(seed),P=new Uint16Array(512),G=new Float32Array(512);for(let i=0;i<256;i++){P[i]=i;G[i]=r()*2-1;}
 for(let i=255;i>0;i--){const j=r()*(i+1)|0;const t=P[i];P[i]=P[j];P[j]=t;}for(let i=0;i<256;i++){P[i+256]=P[i];G[i+256]=G[i];}
 const n=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,X=xi&255,Y=yi&255;const a=G[P[P[X]+Y]],b=G[P[P[X+1]+Y]],c=G[P[P[X]+Y+1]],d=G[P[P[X+1]+Y+1]];
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
 n.fbm=(x,y,o=4)=>{let s=0,a=1,t=0;for(let i=0;i<o;i++){s+=n(x,y)*a;t+=a;a*=.5;x=x*2.03+17.1;y=y*2.03+9.7;}return s/t;};return n;}
export const sstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- canvas textures ---------- */
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')];}
export function canvasTex(c,srgb=true,rep=true){const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
function normalFrom(hc,str){const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data;const[c,x]=cv(w,h);const img=x.createImageData(w,h),d=img.data;
 const H=(i,j)=>src[((((j+h)%h)*w)+((i+w)%w))*4]/255;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(H(i-1,j)-H(i+1,j))*str,dy=(H(i,j+1)-H(i,j-1))*str,l=Math.hypot(dx,dy,1),k=(j*w+i)*4;d[k]=(dx/l*.5+.5)*255;d[k+1]=(dy/l*.5+.5)*255;d[k+2]=(1/l*.5+.5)*255;d[k+3]=255;}
 x.putImageData(img,0,0);return canvasTex(c,false);}
function speckle(x,w,h,n,a,r){for(let i=0;i<n;i++){const v=Math.random();x.fillStyle=`rgba(${v>.5?255:0},${v>.5?255:0},${v>.5?255:0},${a*Math.random()})`;x.fillRect(Math.random()*w,Math.random()*h,r,r);}}
export function makeTextures(){const T={};
 // stone blocks (colour + height -> normal)
 {const S=512;const[c,x]=cv(S,S),[hc,hx]=cv(S,S);x.fillStyle='#7d776f';x.fillRect(0,0,S,S);hx.fillStyle='#000';hx.fillRect(0,0,S,S);let y=0;
  while(y<S){const rh=Math.min(S-y,44+Math.random()*26|0);let xx=-(Math.random()*60|0);while(xx<S){const bw=70+Math.random()*80|0;const g=150+Math.random()*60|0,tint=Math.random()*14-7;
    x.fillStyle=`rgb(${g+tint},${g-3},${g-8-tint})`;x.fillRect(xx+3,y+3,bw-6,rh-6);
    const gr=x.createLinearGradient(0,y,0,y+rh);gr.addColorStop(0,'rgba(255,255,255,.12)');gr.addColorStop(1,'rgba(0,0,0,.18)');x.fillStyle=gr;x.fillRect(xx+3,y+3,bw-6,rh-6);
    hx.fillStyle=`rgb(${190+Math.random()*50|0},0,0)`;hx.fillRect(xx+4,y+4,bw-8,rh-8);hx.fillStyle='rgba(255,0,0,.35)';hx.fillRect(xx+8,y+8,bw-16,rh-16);
    for(let wrap of[0,S])if(xx+bw>S&&wrap){x.fillStyle=`rgb(${g+tint},${g-3},${g-8-tint})`;x.fillRect(xx+3-S,y+3,bw-6,rh-6);hx.fillStyle='rgb(210,0,0)';hx.fillRect(xx+4-S,y+4,bw-8,rh-8);}
    xx+=bw;}y+=rh;}
  speckle(x,S,S,9000,.12,2);for(let i=0;i<40;i++){x.fillStyle=`rgba(60,80,40,${Math.random()*.12})`;x.beginPath();x.arc(Math.random()*S,Math.random()*S,10+Math.random()*30,0,7);x.fill();}
  T.stone=canvasTex(c);T.stoneN=normalFrom(hc,2.2);}
 // wood planks
 {const S=256;const[c,x]=cv(S,S),[hc,hx]=cv(S,S);hx.fillStyle='#fff';hx.fillRect(0,0,S,S);const pw=S/5;
  for(let i=0;i<5;i++){const g=120+Math.random()*40|0;x.fillStyle=`rgb(${g+30},${g},${g-40})`;x.fillRect(i*pw,0,pw,S);for(let k=0;k<26;k++){x.strokeStyle=`rgba(60,35,15,${.12+Math.random()*.2})`;x.lineWidth=1+Math.random()*1.5;x.beginPath();const ox=i*pw+Math.random()*pw;x.moveTo(ox,0);x.bezierCurveTo(ox+6*Math.random()-3,S*.3,ox-6*Math.random()+3,S*.6,ox+Math.random()*4-2,S);x.stroke();}
   x.fillStyle='rgba(30,15,5,.65)';x.fillRect(i*pw,0,2,S);hx.fillStyle='#000';hx.fillRect(i*pw,0,3,S);const ky=Math.random()*S;x.fillStyle='rgba(50,25,10,.5)';x.beginPath();x.ellipse(i*pw+pw/2,ky,4,7,0,0,7);x.fill();
   x.fillStyle='#3a3a3a';x.fillRect(i*pw+pw/2-2,10,4,4);x.fillRect(i*pw+pw/2-2,S-14,4,4);}
  T.wood=canvasTex(c);T.woodN=normalFrom(hc,1.5);}
 // roof shingles
 {const S=256;const[c,x]=cv(S,S);x.fillStyle='#777';x.fillRect(0,0,S,S);const rh=S/8;for(let r=0;r<8;r++){const off=r%2?16:0;for(let i=-1;i<9;i++){const g=170+Math.random()*60|0;x.fillStyle=`rgb(${g},${g},${g})`;x.beginPath();x.roundRect(i*32+off+1,r*rh,30,rh+4,[0,0,10,10]);x.fill();x.fillStyle='rgba(0,0,0,.25)';x.fillRect(i*32+off+1,r*rh+rh,30,3);}}
  T.roof=canvasTex(c);}
 // terrain detail grain
 {const S=256;const[c,x]=cv(S,S);x.fillStyle='#e8e8e8';x.fillRect(0,0,S,S);speckle(x,S,S,14000,.22,2);for(let i=0;i<220;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.06})`;x.beginPath();x.arc(Math.random()*S,Math.random()*S,3+Math.random()*12,0,7);x.fill();}
  for(let i=0;i<500;i++){x.strokeStyle=`rgba(255,255,255,${Math.random()*.25})`;x.beginPath();const px=Math.random()*S,py=Math.random()*S;x.moveTo(px,py);x.lineTo(px+Math.random()*3-1.5,py-3-Math.random()*5);x.stroke();}
  T.grain=canvasTex(c);}
 // soft puff (clouds, smoke)
 {const S=128;const[c,x]=cv(S,S);for(let i=0;i<9;i++){const px=S/2+(Math.random()-.5)*S*.35,py=S/2+(Math.random()-.5)*S*.25,r=S*(.18+Math.random()*.16);const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,S,S);}
  T.puff=canvasTex(c,true,false);}
 // water normal
 {const S=256;const n=makeNoise(7);const[hc,hx]=cv(S,S);const img=hx.createImageData(S,S);for(let j=0;j<S;j++)for(let i=0;i<S;i++){const v=(n.fbm(i/32,j/32,4)*.5+.5)*255;const k=(j*S+i)*4;img.data[k]=img.data[k+1]=img.data[k+2]=v;img.data[k+3]=255;}hx.putImageData(img,0,0);T.waterN=normalFrom(hc,3);}
 return T;}

// heraldic banner cloth per team (original emblems: a tower for AZURE, crossed arrows for CRIMSON)
export function bannerTex(team){const W=128,H=256;const[c,x]=cv(W,H);const t=TEAMS[team];x.fillStyle='#'+new C(t.col).getHexString();x.fillRect(0,0,W,H);
 x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,0,W,10);x.fillStyle='#f3e6c4';x.fillRect(0,14,W,5);x.fillRect(0,H-46,W,5);
 x.save();x.translate(W/2,H*.45);x.fillStyle='#f3e6c4';
 if(team===0){x.fillRect(-22,-10,44,52);for(let i=-2;i<=2;i+=2)x.fillRect(i*9-5,-22,10,14);x.fillStyle='#'+new C(t.col).getHexString();x.beginPath();x.arc(0,30,9,Math.PI,0);x.fill();x.fillRect(-9,30,18,12);}
 else{for(const s of[-1,1]){x.save();x.rotate(s*.7);x.fillRect(-3,-46,6,92);x.beginPath();x.moveTo(-10,-40);x.lineTo(0,-58);x.lineTo(10,-40);x.fill();x.fillRect(-9,36,18,4);x.fillRect(-9,42,18,4);x.restore();}}
 x.restore();for(let i=0;i<4;i++){x.fillStyle='#f3e6c4';x.beginPath();x.moveTo(i*32,H-30);x.lineTo(i*32+16,H);x.lineTo(i*32+32,H-30);x.fill();}
 x.globalCompositeOperation='destination-out';for(let i=0;i<4;i++){x.beginPath();x.moveTo(i*32,H);x.lineTo(i*32+16,H-26);x.lineTo(i*32+32,H);x.fill();}
 return canvasTex(c,true,false);}

/* ---------- geometry ---------- */
// Box with UVs scaled to world size so textures tile at a constant density.
export function boxGeo(w,h,d,ts=2.5,ox=0,oy=0){const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
 for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*dims[f][0]/ts+ox,uv.getY(i)*dims[f][1]/ts+oy);}return g;}
const _m3=new THREE.Matrix3(),_v=new V();
export class Batch{constructor(){this.p=[];this.n=[];this.u=[];this.c=[];this.i=[];this.v=0;}
 add(g,m,col){const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,CA=g.attributes.color;_m3.getNormalMatrix(m);
  for(let k=0;k<P.count;k++){_v.fromBufferAttribute(P,k).applyMatrix4(m);this.p.push(_v.x,_v.y,_v.z);_v.fromBufferAttribute(N,k).applyMatrix3(_m3).normalize();this.n.push(_v.x,_v.y,_v.z);
   if(U)this.u.push(U.getX(k),U.getY(k));else this.u.push(0,0);const r=col?col.r:1,gg=col?col.g:1,b=col?col.b:1;if(CA)this.c.push(CA.getX(k)*r,CA.getY(k)*gg,CA.getZ(k)*b);else this.c.push(r,gg,b);}
  if(g.index){for(let k=0;k<g.index.count;k++)this.i.push(g.index.getX(k)+this.v);}else for(let k=0;k<P.count;k++)this.i.push(k+this.v);this.v+=P.count;return this;}
 get empty(){return this.v===0;}
 build(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setIndex(this.i);g.computeBoundingSphere();g.computeBoundingBox();return g;}}
const _q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new V(),_p=new V();
export function mat4(p=[0,0,0],r=[0,0,0],s=[1,1,1]){return new THREE.Matrix4().compose(_p.set(p[0],p[1],p[2]),_q.setFromEuler(_e.set(r[0],r[1],r[2])),_s.set(s[0],s[1],s[2]));}
// merge a list of [geometry, colour, pos, rot, scale] into one vertex-coloured geometry
export function merge(list){const b=new Batch();for(const[g,c,p,r,s]of list)b.add(g,mat4(p,r,s),c===undefined||c===null?null:new C(c));return b.build();}

/* ---------- sky dome + environment ---------- */
const SKY_VS='varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=vec4(p.xy,p.w*.99999,p.w);}';
const SKY_FS=`uniform vec3 uTop,uHor,uBot,uSun,uSunC;uniform float uHaze;varying vec3 vD;
void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(uHor,uTop,pow(clamp(h,0.,1.),.38));c=mix(c,uBot,smoothstep(.0,-.3,h));
 float s=max(0.,dot(d,normalize(uSun)));c+=uSunC*(smoothstep(.9994,.9997,s)*6.+pow(s,24.)*.35+pow(s,4.)*uHaze);
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export function makeSky(s){const U={uTop:{value:new C(s.top)},uHor:{value:new C(s.hor)},uBot:{value:new C(s.bot)},uSun:{value:new V(...s.sun)},uSunC:{value:new C(s.sunC)},uHaze:{value:s.haze??.12}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),new THREE.ShaderMaterial({uniforms:U,vertexShader:SKY_VS,fragmentShader:SKY_FS,side:THREE.BackSide,depthWrite:false,fog:false}));m.frustumCulled=false;m.renderOrder=-10;m.userData.U=U;return m;}
export function makeEnv(R,s){const sc=new THREE.Scene();const sky=makeSky(s);sky.scale.setScalar(.05);sc.add(sky);
 const gnd=new THREE.Mesh(new THREE.CircleGeometry(60,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:new C(s.gnd??0x4a5a38).multiplyScalar(.6)}));gnd.position.y=-4;sc.add(gnd);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(sc,.03);pm.dispose();return rt.texture;}

/* ---------- billboard clouds: one draw call ---------- */
export function makeClouds(tex,list,col=0xffffff,shade=0x9aa6bf){const P=[],Cn=[],S=[],A=[];const r=Math.random;
 for(const c of list){const n=c.n||7;for(let i=0;i<n;i++){const px=c.x+(r()-.5)*c.w,py=c.y+(r()-.3)*c.h,pz=c.z+(r()-.5)*c.d,s=c.s*(.6+r()*.7),a=.55+r()*.45;for(const[u,v]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){P.push(px,py,pz);Cn.push(u,v);S.push(s);A.push(a);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('corner',new THREE.Float32BufferAttribute(Cn,2));g.setAttribute('size',new THREE.Float32BufferAttribute(S,1));g.setAttribute('alpha',new THREE.Float32BufferAttribute(A,1));
 const U={uTex:{value:tex},uCol:{value:new C(col)},uShade:{value:new C(shade)},uTime:{value:0}};
 const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,
  vertexShader:'attribute vec2 corner;attribute float size,alpha;uniform float uTime;varying vec2 vUv;varying float vA,vY;void main(){vec3 p=position;p.x+=sin(uTime*.02+p.z*.01)*6.;vec4 mv=modelViewMatrix*vec4(p,1.);mv.xy+=corner*size;vUv=corner*.5+.5;vA=alpha*smoothstep(2200.,900.,-mv.z);vY=corner.y;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D uTex;uniform vec3 uCol,uShade;varying vec2 vUv;varying float vA,vY;void main(){float a=texture2D(uTex,vUv).a*vA;if(a<.01)discard;gl_FragColor=vec4(mix(uShade,uCol,smoothstep(-1.,.6,vY)),a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
 m.frustumCulled=false;m.renderOrder=-5;m.userData.U=U;return m;}

/* ---------- water ---------- */
export function makeWaterMat(T,col=0x2f6f86){const n=T.waterN.clone();n.needsUpdate=true;n.wrapS=n.wrapT=THREE.RepeatWrapping;n.repeat.set(1,1);
 const m=new THREE.MeshStandardMaterial({color:col,roughness:.08,metalness:.1,transparent:true,opacity:.82,normalMap:n,normalScale:new THREE.Vector2(.35,.35)});m.userData.n=n;return m;}

/* ---------- waving cloth (banners + flags) ---------- */
export function clothMat(opts,U,hang){const m=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.85,...opts});
 m.onBeforeCompile=s=>{s.uniforms.uTime=U;s.vertexShader='uniform float uTime;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  float fx=${hang?'(1.-uv.y)':'uv.x'};vec4 wp=modelMatrix*vec4(0.,0.,0.,1.);float ph=${hang?'position.y*1.3':'position.x*1.6'}+wp.x*.37+wp.z*.23;
  transformed.z+=(sin(ph*1.7-uTime*3.1)*.16+sin(ph*3.3-uTime*5.2)*.05)*fx;transformed.${hang?'x':'y'}+=sin(ph*2.1-uTime*2.4)*.03*fx;`);};
 m.customProgramCacheKey=()=>'cloth'+(hang?1:0);return m;}

/* ---------- particles (additive sparks or alpha-blended dust/snow) ---------- */
export class Particles{constructor(scene,n=3000,additive=true,tex=null){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*4);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.grow=new Float32Array(n);this.i=0;this.add=additive;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500},uTex:{value:tex},uNear:{value:.2}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 color;uniform float uScale,uNear;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vC.a*=smoothstep(uNear,uNear*3.+1.,-mv.z);gl_PointSize=min(256.,size*uScale/max(.1,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d)*vC.a;gl_FragColor=vec4(vC.rgb*a,1.);}'
    :(tex?'uniform sampler2D uTex;varying vec4 vC;void main(){float a=texture2D(uTex,gl_PointCoord).a*vC.a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb,a);\n#include <colorspace_fragment>\n}'
     :'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.2,d)*vC.a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb,a);\n#include <colorspace_fragment>\n}')}));
  this.pts.frustumCulled=false;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,a,size,life,grav=0,drag=0,grow=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*4]=r;this.oc[i*4+1]=g;this.oc[i*4+2]=b;this.oc[i*4+3]=a;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.grow[i]=grow;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const sp=o.spread??.6;dx=dx*sp+o.dir.x;dy=dy*sp+o.dir.y;dz=dz*sp+o.dir.z;}if(o.up)dy=Math.abs(dy);const s=speed*(.35+Math.random()*.65);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;const j=o.jit??0;this.emit(p.x+(Math.random()-.5)*j,p.y+(Math.random()-.5)*j,p.z+(Math.random()-.5)*j,dx*s,dy*s,dz*s,c.r,c.g,c.b,o.alpha??1,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.grow??0);}}
 update(dt,floor){const{p,v,c,oc,s,os,life,max,g,drag,grow}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(floor&&g[i]>0){const f=floor(p[i*3],p[i*3+2]);if(p[i*3+1]<f+.03){p[i*3+1]=f+.03;v[i*3+1]*=-.3;v[i*3]*=.6;v[i*3+2]*=.6;}}
   if(this.add){const f=k*k;c[i*4]=oc[i*4]*f;c[i*4+1]=oc[i*4+1]*f;c[i*4+2]=oc[i*4+2]*f;c[i*4+3]=oc[i*4+3];s[i]=os[i]*(.4+.6*k);}
   else{c[i*4]=oc[i*4];c[i*4+1]=oc[i*4+1];c[i*4+2]=oc[i*4+2];c[i*4+3]=oc[i*4+3]*Math.min(1,k*2.5)*Math.min(1,(1-k)*8+.2);s[i]=os[i]*(1+grow[i]*(1-k));}}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}
 clear(){this.life.fill(0);}}
