// ORBIT LAB — visuals: procedural planet/moon shaders, scattering atmosphere, clouds, stars, sun, rocket parts,
// exhaust plumes with shock diamonds, reentry plasma, particles, station, launch site, assembly hangar, orbit ribbons.
import * as THREE from '../vendor/three.module.min.js';
import {VERDA,LUNE,LAUNCH,SUN} from './physics.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a;

/* ---------- shared GLSL ---------- */
const VS_HEAD='#include <common>\n#include <logdepthbuf_pars_vertex>\n';
const FS_HEAD='#include <logdepthbuf_pars_fragment>\n';
const NOISE=`
float h13(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float vn(vec3 x){vec3 i=floor(x),f=fract(x),u=f*f*(3.-2.*f);
 return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),u.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),u.x),u.y),
  mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),u.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),u.x),u.y),u.z);}
float lbias(vec3 n){vec3 dl=n-vec3(1,0,0),dc=n-vec3(.9945,0.,-.1045);return .38*exp(-dot(dl,dl)/.006)-.42*exp(-dot(dc,dc)/.004);}
float continent(vec3 n){vec3 p=n*1.7+vec3(3.1,1.3,5.7);float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec3(1.7,.3,2.9);a*=.5;}
 return s-.5+lbias(n);}
float fbmN(vec3 p,float oct){float a=.5,s=0.,w=0.;for(int i=0;i<14;i++){float fi=float(i);if(fi>=oct)break;float k=clamp(oct-fi,0.,1.);s+=a*k*vn(p);w+=a*k;p=p*2.07+vec3(.31,.73,.19);a*=.5;}return s/max(w,1e-4);}
vec3 bump(vec3 P,vec3 n,float h){vec3 dx=dFdx(P),dy=dFdy(P);float hx=dFdx(h),hy=dFdy(h);vec3 r1=cross(dy,n),r2=cross(n,dx);float det=dot(dx,r1);vec3 g=sign(det)*(hx*r1+hy*r2);return normalize(abs(det)*n-g);}
`;

/* ---------- planet VERDA ---------- */
export function planetMaterial(){
 return new THREE.ShaderMaterial({uniforms:{uSun:{value:new V(...SUN)},uCam:{value:new V()},uPix:{value:.0012},uTime:{value:0},uR:{value:VERDA.R},uAtm:{value:VERDA.atm}},
  vertexShader:VS_HEAD+'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);\n#include <logdepthbuf_vertex>\n}',
  fragmentShader:FS_HEAD+`uniform vec3 uSun,uCam;uniform float uPix,uTime,uR,uAtm;varying vec3 vP;${NOISE}
  void main(){
   #include <logdepthbuf_fragment>
   vec3 n=normalize(vP);float dist=length(uCam-vP);float ps=dist*uPix;
   float c=continent(n);
   float oct=clamp(log2(9000./max(ps*1.5,.5)),2.,13.);
   float t=fbmN(vP/9000.,oct);float t2=fbmN(n*23.+7.,clamp(oct-2.,1.,6.));
   float land=smoothstep(-.002,.004,c);float lat=abs(n.y);
   float cr=c-max(lbias(n),0.)*.9;float elev=max(cr,0.)*1.4+(t-.5)*.35*land;
   // launch complex: flat concrete apron
   float dLs=length(n-vec3(1,0,0))*uR;float pad=1.-smoothstep(160.,240.,dLs);
   vec3 deep=vec3(.004,.02,.07),shal=vec3(.02,.12,.17);vec3 col=mix(deep,shal,smoothstep(-.1,0.,c));
   vec3 grass=vec3(.09,.19,.05),forest=vec3(.03,.09,.03),sand=vec3(.5,.43,.3),desert=vec3(.55,.38,.21),rock=vec3(.24,.21,.19),snow=vec3(.88,.9,.95);
   vec3 L=mix(grass,forest,smoothstep(.42,.62,t));L=mix(L,desert,smoothstep(.58,.74,t2+(1.-lat)*.1-.08)*.85);
   L=mix(sand,L,smoothstep(.0,.012,c));float hr=cr+(t-.5)*.25;L=mix(L,rock,smoothstep(.13,.22,hr));L=mix(L,snow,clamp(smoothstep(.24,.32,hr)+smoothstep(.78,.88,lat+(t-.5)*.15),0.,1.));
   L*=.8+.4*fbmN(vP/600.,clamp(oct-4.,0.,8.));
   L=mix(L,vec3(.36,.36,.37)*(.85+.15*vn(vP*.08)),pad);
   col=mix(col,L,land);
   vec3 N=land>.5?bump(vP,n,elev*2600.*(1.-pad)):n;
   float ndl=dot(N,uSun),term=smoothstep(-.08,.12,dot(n,uSun));
   vec3 Vd=normalize(uCam-vP);vec3 H=normalize(uSun+Vd);
   vec3 lit=col*(max(ndl,0.)*1.25*term+.015)*vec3(1.,.97,.92);
   float fres=pow(1.-max(dot(n,Vd),0.),5.);
   lit+=(1.-land)*(pow(max(dot(n,H),0.),260.)*2.4+fres*.12)*vec3(1.,.9,.75)*term;
   // night lights
   float city=smoothstep(.62,.8,vn(n*70.))*smoothstep(.55,.78,vn(n*420.+3.))*land*(1.-smoothstep(.15,.3,c));
   lit+=vec3(1.,.62,.28)*city*1.6*(1.-smoothstep(-.15,.05,dot(n,uSun)));
   lit+=vec3(1.,.8,.5)*pad*.25*(1.-term);
   // aerial perspective (inside or near the atmosphere)
   float camAlt=length(uCam)-uR;float k=1.-exp(-dist/(camAlt<uAtm?120000.:260000.));
   vec3 sky=mix(vec3(.25,.45,.85),vec3(.9,.55,.35),pow(1.-max(dot(n,uSun),0.),6.))*smoothstep(-.15,.2,dot(n,uSun));
   lit=mix(lit,sky*.55,k*.55*smoothstep(uAtm*3.,0.,camAlt));
   gl_FragColor=vec4(lit,1.);}`});}

/* ---------- moon LUNE (craters via 3-D cellular noise) ---------- */
export function moonMaterial(){
 return new THREE.ShaderMaterial({uniforms:{uSun:{value:new V(...SUN)},uCam:{value:new V()},uPix:{value:.0012},uR:{value:LUNE.R},uPl:{value:new V(-1,0,0)}},
  vertexShader:VS_HEAD+'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);\n#include <logdepthbuf_vertex>\n}',
  fragmentShader:FS_HEAD+`uniform vec3 uSun,uCam,uPl;uniform float uPix,uR;varying vec3 vP;${NOISE}
  float crater(vec3 p){vec3 i=floor(p),f=fract(p);float h=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){vec3 g=vec3(x,y,z);float r=h13(i+g);
    vec3 o=vec3(h13(i+g+11.3),h13(i+g+27.1),h13(i+g+43.7));float d=length(g+o-f);float rad=.18+.3*r;if(r>.55)continue;float q=d/rad;
    h+=q<1.?(smoothstep(0.,1.,q)*q-1.)*.8:(q<1.4?(1.-smoothstep(1.,1.4,q))*.3*smoothstep(1.,1.08,q):0.);}return h;}
  void main(){
   #include <logdepthbuf_fragment>
   vec3 n=normalize(vP);float dist=length(uCam-vP);float ps=dist*uPix;
   float oct=clamp(log2(6000./max(ps*1.5,.5)),2.,12.);
   float t=fbmN(vP/6000.,oct);float mar=smoothstep(.45,.62,fbmN(n*2.3+5.,5.));
   float e=crater(n*7.)*.6+crater(n*23.)*.35+crater(vP/2600.)*.25*smoothstep(80000.,10000.,dist)+crater(vP/420.)*.12*smoothstep(9000.,800.,dist)+(t-.5)*.5;
   vec3 col=mix(vec3(.3,.295,.285),vec3(.13,.13,.14),mar)*(.75+.5*t);
   vec3 N=bump(vP,n,e*1400.);float ndl=max(dot(N,uSun),0.);
   gl_FragColor=vec4(col*(ndl*1.35*smoothstep(-.05,.1,dot(n,uSun))+.035*vec3(.75,.85,1.)*(.6+.4*max(dot(N,normalize(uPl)),0.))),1.);}`});}

/* ---------- atmosphere (single scattering, Rayleigh + Mie) ---------- */
export function atmosphereMaterial(){
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
  uniforms:{uSun:{value:new V(...SUN)},uCam:{value:new V()},uR:{value:VERDA.R},uRa:{value:VERDA.R+VERDA.atm},uH:{value:VERDA.H},uInt:{value:11}},
  vertexShader:VS_HEAD+'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);\n#include <logdepthbuf_vertex>\n}',
  fragmentShader:FS_HEAD+`uniform vec3 uSun,uCam;uniform float uR,uRa,uH,uInt;varying vec3 vP;
  vec2 rs(vec3 o,vec3 d,float r){float b=dot(o,d),c=dot(o,o)-r*r,h=b*b-c;if(h<0.)return vec2(1e20,-1e20);h=sqrt(h);return vec2(-b-h,-b+h);}
  void main(){
   #include <logdepthbuf_fragment>
   vec3 ro=uCam,rd=normalize(vP-uCam);vec2 ta=rs(ro,rd,uRa);if(ta.y<0.)discard;
   float t0=max(ta.x,0.),t1=ta.y;vec2 tp=rs(ro,rd,uR);bool ground=tp.x>0.;if(ground)t1=min(t1,tp.x);
   const vec3 bR=vec3(7.5e-6,17.5e-6,40e-6)*1.7;const float bM=14e-6;const float HM=1400.;
   float ds=(t1-t0)/12.;vec3 sR=vec3(0),sM=vec3(0);float odR=0.,odM=0.;
   for(int i=0;i<12;i++){vec3 p=ro+rd*(t0+ds*(float(i)+.5));float h=length(p)-uR;float dR=exp(-h/uH)*ds,dM=exp(-h/HM)*ds;odR+=dR;odM+=dM;
    vec2 tl=rs(p,uSun,uRa);vec2 tg=rs(p,uSun,uR);if(tg.x>0.)continue;float dl=tl.y/4.;float lR=0.,lM=0.;
    for(int j=0;j<4;j++){vec3 q=p+uSun*dl*(float(j)+.5);float hq=length(q)-uR;lR+=exp(-hq/uH)*dl;lM+=exp(-hq/HM)*dl;}
    vec3 att=exp(-(bR*(odR+lR)+bM*1.1*(odM+lM)));sR+=dR*att;sM+=dM*att;}
   float mu=dot(rd,uSun);float pR=.0597*(1.+mu*mu);float g=.76;float pM=.1194*((1.-g*g)*(1.+mu*mu))/((2.+g*g)*pow(1.+g*g-2.*g*mu,1.5));
   vec3 col=uInt*(sR*bR*pR+sM*bM*pM);vec3 tr=exp(-(bR*odR+bM*1.1*odM));float a=ground?1.-dot(tr,vec3(.333)):clamp(1.-dot(tr,vec3(.333)),0.,1.);
   gl_FragColor=vec4(col,a*(ground?.55:1.));}`});}

/* ---------- clouds ---------- */
export function cloudMaterial(){
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uSun:{value:new V(...SUN)},uTime:{value:0},uCam:{value:new V()}},
  vertexShader:VS_HEAD+'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);\n#include <logdepthbuf_vertex>\n}',
  fragmentShader:FS_HEAD+`uniform vec3 uSun,uCam;uniform float uTime;varying vec3 vP;${NOISE}
  void main(){
   #include <logdepthbuf_fragment>
   vec3 n=normalize(vP);vec3 q=n*5.+vec3(uTime*.002,0.,uTime*.001);
   float w=fbmN(q*.6,4.);float c=fbmN(q+w*1.5,6.);c+=.18*fbmN(n*60.,4.)-.09;
   float lat=abs(n.y);float band=.62-.1*smoothstep(.0,.25,abs(lat-.55))-.06*(1.-smoothstep(.0,.15,lat));
   float a=smoothstep(band,band+.16,c);float dl=length(n-vec3(1,0,0));a*=smoothstep(.015,.2,dl);
   float ndl=dot(n,uSun);float lit=smoothstep(-.12,.25,ndl);vec3 col=mix(vec3(.9,.55,.38),vec3(1.),smoothstep(0.,.4,ndl))*lit*.78+.01;
   float dist=length(uCam-vP);a*=smoothstep(200.,2500.,dist);
   gl_FragColor=vec4(col,a*.92);}`});}

/* ---------- stars + sun ---------- */
export function makeStars(n=9000){const pos=new Float32Array(n*3),col=new Float32Array(n*3),sz=new Float32Array(n);
 for(let i=0;i<n;i++){let x,y,z;if(i<n*.35){const a=rnd(Math.PI*2),b=(Math.random()+Math.random()+Math.random()-1.5)*.18;x=Math.cos(a);z=Math.sin(a);y=b;const rr=Math.hypot(x,y,z);x/=rr;y/=rr;z/=rr;const t=.5;[x,y]=[x*Math.cos(t)-y*Math.sin(t),x*Math.sin(t)+y*Math.cos(t)];}
  else{const u=rnd(2)-1,a=rnd(Math.PI*2),s=Math.sqrt(1-u*u);x=s*Math.cos(a);y=u;z=s*Math.sin(a);}
  pos.set([x*1e8,y*1e8,z*1e8],i*3);const T=Math.random();const c=T<.15?[.7,.8,1.2]:T<.3?[1.2,1,.8]:[1,1,1];const b=Math.pow(Math.random(),3)*1.6+.15;col.set(c.map(v=>v*b),i*3);sz[i]=1+Math.pow(Math.random(),6)*2.6;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('size',new THREE.BufferAttribute(sz,1));
 const m=new THREE.ShaderMaterial({uniforms:{uFade:{value:1}},depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,
  vertexShader:VS_HEAD+'attribute float size;varying vec3 vC;uniform float uFade;void main(){vC=color*uFade;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*1.4;gl_Position=projectionMatrix*mv;\n#include <logdepthbuf_vertex>\n}',
  fragmentShader:FS_HEAD+'varying vec3 vC;void main(){\n#include <logdepthbuf_fragment>\nfloat d=length(gl_PointCoord-.5);gl_FragColor=vec4(vC*smoothstep(.5,0.,d),1.);}'});
 const p=new THREE.Points(g,m);p.frustumCulled=false;p.renderOrder=-10;return p;}
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
export function makeSun(){const t=ctex(256,256,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.06,'rgba(255,250,235,1)');g.addColorStop(.14,'rgba(255,214,150,.45)');g.addColorStop(.4,'rgba(255,170,90,.09)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true});
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,color:new THREE.Color(6,5.5,5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.renderOrder=-9;return s;}

/* ---------- textures for parts ---------- */
const TEX={};
function panelTex(kind){if(TEX[kind])return TEX[kind];const t=ctex(512,512,(x,w,h)=>{
  if(kind==='tank'){x.fillStyle='#e9e9ec';x.fillRect(0,0,w,h);for(let i=0;i<8;i++){x.fillStyle=`rgba(0,0,0,${.02+rnd(.03)})`;x.fillRect(i*w/8,0,w/8,h);}
   x.fillStyle='#1b1d22';for(let i=0;i<4;i++)x.fillRect(i*w/4,h*.06,w/8,h*.05);x.fillStyle='#ff4d00';x.fillRect(0,h*.86,w,h*.05);x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=2;for(let j=1;j<4;j++){x.beginPath();x.moveTo(0,h*j/4);x.lineTo(w,h*j/4);x.stroke();}
   for(let i=0;i<220;i++){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(rnd(w),rnd(h),2,2);}}
  else if(kind==='tankL'){x.fillStyle='#d9733a';x.fillRect(0,0,w,h);for(let i=0;i<3000;i++){x.fillStyle=`rgba(${120+rnd(60)},${50+rnd(30)},20,.25)`;x.fillRect(rnd(w),rnd(h),3+rnd(6),2);}
   x.fillStyle='#ececec';x.fillRect(0,0,w,h*.08);x.fillRect(0,h*.92,w,h*.08);x.fillStyle='#1b1d22';x.fillRect(w*.1,h*.3,w*.06,h*.4);}
  else if(kind==='pod'){x.fillStyle='#dcdde2';x.fillRect(0,0,w,h);x.strokeStyle='rgba(0,0,0,.22)';x.lineWidth=2;for(let i=0;i<12;i++){x.beginPath();x.moveTo(i*w/12,0);x.lineTo(i*w/12,h);x.stroke();}for(let j=1;j<5;j++){x.beginPath();x.moveTo(0,j*h/5);x.lineTo(w,j*h/5);x.stroke();}
   x.fillStyle='#10141c';for(let i=0;i<3;i++){x.beginPath();x.roundRect(w*(.08+i*.33),h*.45,w*.12,h*.18,8);x.fill();}x.fillStyle='#ff4d00';x.fillRect(0,h*.86,w,h*.04);}
  else if(kind==='hazard'){x.fillStyle='#1a1a1a';x.fillRect(0,0,w,h);x.fillStyle='#f5c400';for(let i=-8;i<16;i++){x.beginPath();x.moveTo(i*w/8,0);x.lineTo(i*w/8+w/16,0);x.lineTo(i*w/8+w/16-h*.5,h);x.lineTo(i*w/8-h*.5,h);x.fill();}}
  else if(kind==='solar'){x.fillStyle='#0b1a3a';x.fillRect(0,0,w,h);x.strokeStyle='#8aa0c8';x.lineWidth=2;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*w/8,0);x.lineTo(i*w/8,h);x.stroke();}for(let j=0;j<=16;j++){x.beginPath();x.moveTo(0,j*h/16);x.lineTo(w,j*h/16);x.stroke();}
   const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(120,160,255,.25)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}
  else if(kind==='metal'){x.fillStyle='#6c6f76';x.fillRect(0,0,w,h);for(let i=0;i<4000;i++){x.fillStyle=`rgba(255,255,255,${rnd(.05)})`;x.fillRect(rnd(w),rnd(h),rnd(40),1);}}
  else if(kind==='canopy'){for(let i=0;i<16;i++){x.fillStyle=i%2?'#f2f2f2':'#ff5a12';x.fillRect(i*w/16,0,w/16,h);}}
  else if(kind==='foil'){x.fillStyle='#c9a227';x.fillRect(0,0,w,h);for(let i=0;i<1400;i++){x.fillStyle=`rgba(${rnd()<.5?255:90},${rnd()<.5?220:70},40,.35)`;x.beginPath();x.moveTo(rnd(w),rnd(h));x.lineTo(rnd(w),rnd(h));x.lineTo(rnd(w),rnd(h));x.fill();}}
 });return TEX[kind]=t;}
const MAT={};
function mat(k){if(MAT[k])return MAT[k];const S=THREE.MeshStandardMaterial;let m;switch(k){
 case'tank':m=new S({map:panelTex('tank'),roughness:.45,metalness:.1});break;case'tankL':m=new S({map:panelTex('tankL'),roughness:.75,metalness:0});break;
 case'pod':m=new S({map:panelTex('pod'),roughness:.4,metalness:.15});break;case'shield':m=new S({color:0x3a2a20,roughness:.9});break;
 case'metal':m=new S({map:panelTex('metal'),roughness:.35,metalness:.85});break;case'dark':m=new S({color:0x22252b,roughness:.5,metalness:.6});break;
 case'bell':m=new S({color:0x2a2b30,roughness:.32,metalness:.95,emissive:0xff5a10,emissiveIntensity:0,side:THREE.DoubleSide});break;
 case'hazard':m=new S({map:panelTex('hazard'),roughness:.6,metalness:.2});break;case'solar':m=new S({map:panelTex('solar'),roughness:.25,metalness:.6,emissive:0x0a1430,emissiveIntensity:.4});break;
 case'white':m=new S({color:0xe4e4e8,roughness:.5,metalness:.1});break;case'orange':m=new S({color:0xff4d00,roughness:.45,metalness:.1});break;
 case'canopy':m=new S({map:panelTex('canopy'),roughness:.8,side:THREE.DoubleSide});break;case'foil':m=new S({map:panelTex('foil'),roughness:.3,metalness:.9});break;
 case'glass':m=new S({color:0x0a1220,roughness:.05,metalness:.9});break;}
 return MAT[k]=m;}
const lathe=(pts,seg=40)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);
const cyl=(rt,rb,h,seg=40,open=false)=>new THREE.CylinderGeometry(rt,rb,h,seg,1,open);
function M(g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,typeof m==='string'?mat(m):m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;return o;}

// one stack part (from parts.layout) → Group with origin at the part's bottom
export function makePart(p){const d=p.def,g=new THREE.Group(),h=d.h,rt=p.dt/2,rb=p.db/2;g.userData={id:p.id};
 if(d.pod&&!d.probe){g.add(M(lathe([[0,0],[rb,0],[rb,.08],[rb*.96,.18],[rt*1.05,h*.9],[rt,h],[0,h]]),'pod'));g.add(M(cyl(rb*1.01,rb*1.01,.08),'shield',0,.03,0));
  const dock=M(cyl(rt*.55,rt*.7,.14,24),'metal',0,h+.03,0);g.add(dock);}
 else if(d.probe){g.add(M(cyl(rt,rb,h*.6,8),'foil',0,h*.3,0));g.add(M(cyl(rt*.92,rt*.92,h*.42,8),'dark',0,h*.79,0));g.add(M(cyl(.02,.02,.9,6),'metal',.35,h+.45,0));g.add(M(new THREE.SphereGeometry(.08,10,8),'white',.35,h+.9,0));}
 else if(d.chute){g.add(M(lathe([[rb,0],[rb*.98,.08],[rt,h*.8],[rt*.6,h],[0,h]],32),'orange'));const can=new THREE.Group();can.visible=false;
  const dome=M(new THREE.SphereGeometry(5.5,32,12,0,Math.PI*2,0,Math.PI*.42),'canopy',0,12,0);dome.scale.y=.75;can.add(dome);
  const lp=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2;lp.push(0,h,0,Math.cos(a)*4,12+.4,Math.sin(a)*4);}const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));can.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0xdddddd,transparent:true,opacity:.6})));
  g.add(can);g.userData.canopy=can;}
 else if(d.fuel!==undefined&&d.cat==='tank'){const L=d.size==='L';g.add(M(cyl(rt,rb,h-.08,48),L?'tankL':'tank',0,h/2,0));g.add(M(cyl(rt*.98,rt,.04,48),'metal',0,.02,0));g.add(M(cyl(rt,rt*.98,.04,48),'metal',0,h-.02,0));
  const tex=g.children[0].material.map;g.children[0].material=g.children[0].material.clone();g.children[0].material.map=tex.clone();g.children[0].material.map.repeat.set(1,Math.max(1,h/(L?3.75:1.9)));g.children[0].material.map.needsUpdate=true;}
 else if(d.thrust){const big=d.size==='L',nr=rb*(d.lander?.42:big?.36:.72),bh=h*(d.lander?.6:.62);
  g.add(M(cyl(rt,rt*.82,h-bh,big?40:28),'dark',0,bh+(h-bh)/2,0));
  const nCount=big?4:1;const bellG=lathe([[nr*.32,0],[nr*.38,bh*.25],[nr*.62,bh*.6],[nr,bh]].map(([r,y])=>[r,bh-y]),32);
  for(let i=0;i<nCount;i++){const a=i/nCount*Math.PI*2+.785;const ox=big?Math.cos(a)*rb*.48:0,oz=big?Math.sin(a)*rb*.48:0;const b=M(bellG,'bell',ox,0,oz);g.add(b);(g.userData.bells=g.userData.bells||[]).push(b);(g.userData.nozzles=g.userData.nozzles||[]).push(new V(ox,0,oz));}
  g.userData.nr=nr;g.userData.col=d.col;
  for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;g.add(M(cyl(.04,.04,bh*.8,6),'metal',Math.cos(a)*rt*.55,bh*.6,Math.sin(a)*rt*.55));}}
 else if(d.dec){g.add(M(cyl(rt,rb,h,48),'hazard',0,h/2,0));const tx=g.children[0].material=mat('hazard').clone();tx.map=panelTex('hazard').clone();tx.map.repeat.set(4,1);tx.map.needsUpdate=true;}
 else if(p.id==='adapt'){g.add(M(lathe([[rb,0],[rb,.06],[rt,h-.06],[rt,h]],48),'white'));}
 else if(d.fins){const r=rt;g.add(M(cyl(r*1.01,r*1.01,h,40),'dark',0,h/2,0));const sh=new THREE.Shape();const s=r/0.625;sh.moveTo(0,0);sh.lineTo(1.05*s,-.2*s);sh.lineTo(1.05*s,.25*s);sh.lineTo(0,1.6*s);sh.lineTo(0,0);
  const fg=new THREE.ExtrudeGeometry(sh,{depth:.05,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:1});fg.translate(0,0,-.025);
  for(let i=0;i<4;i++){const f=M(fg,i%2?'orange':'white');f.position.y=0;const a=i*Math.PI/2;f.rotation.y=-a;f.position.x=Math.cos(a)*r*.98;f.position.z=Math.sin(a)*r*.98;g.add(f);}}
 else if(d.legs){const r=rt;g.add(M(cyl(r*1.01,r*1.01,h,40),'dark',0,h/2,0));const legs=[];
  for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;const piv=new THREE.Group();piv.position.set(Math.cos(a)*r,h*.8,Math.sin(a)*r);piv.rotation.y=-a;
   const arm=new THREE.Group();piv.add(arm);arm.add(M(cyl(.05,.07,2.2,8),'metal',0,-1.1,0));arm.add(M(cyl(.22,.26,.07,16),'dark',0,-2.2,0));g.add(piv);legs.push(arm);}
  g.userData.legs=legs;}
 else if(d.solar){const r=rt;g.add(M(cyl(r*1.01,r*1.01,h,40),'dark',0,h/2,0));const wings=[];
  for(let i=0;i<2;i++){const piv=new THREE.Group();piv.position.set(i?-r:r,h/2,0);piv.rotation.y=i?Math.PI:0;const w=new THREE.Group();piv.add(w);
   for(let k=0;k<3;k++){const pnl=M(new THREE.BoxGeometry(1.1,.03,.9),'solar',.65+k*1.15,0,0);w.add(pnl);}w.add(M(cyl(.03,.03,3.5,6),'metal',1.8,0,0).rotateZ(Math.PI/2));g.add(piv);wings.push(w);}
  g.userData.wings=wings;}
 return g;}

// whole vessel: Group whose children are part groups, laid out bottom→top (y from 0)
export function buildStack(ps){const g=new THREE.Group();const list=[];for(const p of ps){const m=makePart(p);m.position.y=p.y0;g.add(m);list.push({p,m});}g.userData.list=list;return g;}
export function animateParts(g,st,dt){for(const {p,m}of g.userData.list||[]){const u=m.userData;
 if(u.legs){const tgt=st.legs?-.62:0;for(const a of u.legs){a.rotation.z+=(tgt-a.rotation.z)*Math.min(1,dt*2.5);}}
 if(u.wings){const tgt=st.solar?1:0;for(const w of u.wings){w.scale.x+=(Math.max(.08,tgt)-w.scale.x)*Math.min(1,dt*1.5);w.rotation.x=st.time*.0;}}
 if(u.canopy){u.canopy.visible=st.chute>0&&st.chuteOpen>.02;const s=Math.max(.05,st.chuteOpen);u.canopy.scale.set(s,.3+.7*s,s);}
 if(u.bells){for(const b of u.bells)b.material.emissiveIntensity=st.hot?.25+st.thr*.6:0;}}}

/* ---------- exhaust plume: core + expanding shell with shock diamonds ---------- */
export function makePlume(nr,col){const geo=new THREE.CylinderGeometry(1,1,1,28,40,true);geo.translate(0,-.5,0);
 const mk=(core)=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  uniforms:{uT:{value:0},uThr:{value:0},uP:{value:1},uR:{value:nr},uL:{value:8},uCol:{value:new THREE.Color(col)},uCore:{value:core?1:0}},
  vertexShader:VS_HEAD+`uniform float uT,uThr,uP,uR,uL,uCore;varying float vY;varying vec3 vN;varying vec3 vV;
   void main(){float y=-position.y;vY=y;float spread=mix(3.2,1.1,uP);float r=uR*(uCore>.5?.55:1.)*(1.+y*spread*(uCore>.5?.35:.8)+ (uCore>.5?0.:.08*sin(y*18.-uT*40.)*uP));
    vec3 p=vec3(position.x*r,-y*uL*(uCore>.5?.55:1.),position.z*r);vec4 mv=modelViewMatrix*vec4(p,1.);vV=normalize(-mv.xyz);vN=normalize(normalMatrix*normalize(vec3(position.x,0.,position.z)));gl_Position=projectionMatrix*mv;
    #include <logdepthbuf_vertex>
   }`,
  fragmentShader:FS_HEAD+`uniform float uT,uThr,uP,uCore;uniform vec3 uCol;varying float vY;varying vec3 vN;varying vec3 vV;
   float h(float x){return fract(sin(x*91.7)*43758.5);}
   void main(){
    #include <logdepthbuf_fragment>
    float rim=pow(abs(dot(vN,vV)),uCore>.5?.6:1.4);float fade=pow(1.-vY,uCore>.5?1.6:1.2);
    float dia=uP*(.55+.45*smoothstep(.55,1.,sin(vY*34.-uT*2.)))*smoothstep(.75,.0,vY);
    float flick=.86+.14*h(floor(uT*30.)+vY*3.);
    vec3 c=uCore>.5?mix(vec3(2.4,2.1,1.7),uCol*2.2,vY*1.6)*(1.+dia*1.4):mix(uCol*1.3,vec3(.35,.45,1.),smoothstep(.1,.9,vY)*(1.-uP*.6))*(.55+dia*.8);
    float a=rim*fade*uThr*flick*(uCore>.5?1.25:mix(.5,.85,uP));gl_FragColor=vec4(c*a,a);}`});
 const g=new THREE.Group();const shell=new THREE.Mesh(geo,mk(false)),core=new THREE.Mesh(geo,mk(true));shell.renderOrder=core.renderOrder=6;shell.frustumCulled=core.frustumCulled=false;g.add(shell,core);
 g.userData={set(thr,pr,t,L){for(const m of[shell,core]){const u=m.material.uniforms;u.uThr.value=thr;u.uP.value=pr;u.uT.value=t;u.uL.value=L;}g.visible=thr>.01;}};return g;}

/* ---------- reentry plasma sheath ---------- */
export function makePlasma(){const geo=new THREE.SphereGeometry(1,40,24,0,Math.PI*2,0,Math.PI*.62);
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uI:{value:0},uT:{value:0}},
  vertexShader:VS_HEAD+'varying vec3 vN,vV;varying float vY;void main(){vY=position.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;\n#include <logdepthbuf_vertex>\n}',
  fragmentShader:FS_HEAD+'uniform float uI,uT;varying vec3 vN,vV;varying float vY;float h(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}void main(){\n#include <logdepthbuf_fragment>\nfloat f=pow(1.-abs(dot(vN,vV)),1.6);float n=.7+.3*h(floor(vec2(vY*40.,uT*20.)));vec3 c=mix(vec3(2.,.6,.25),vec3(1.4,.5,1.6),smoothstep(.2,1.,vY));float a=uI*(f*1.2+.12)*n*smoothstep(.0,.5,vY+.2);gl_FragColor=vec4(c*a,a);}'});
 const s=new THREE.Mesh(geo,m);s.renderOrder=7;s.frustumCulled=false;return s;}

/* ---------- particles in universe coordinates (float64 on the CPU, uploaded relative to the floating origin) ---------- */
export class Particles{constructor(scene,n=5000){this.n=n;this.P=new Float64Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.grow=new Float32Array(n);
  this.life=new Float32Array(n);this.max=new Float32Array(n);this.drag=new Float32Array(n);this.add=new Uint8Array(n);this.i=0;this.pos=new Float32Array(n*3);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};
  const mk=(add)=>new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,vertexColors:true,
   vertexShader:VS_HEAD+'attribute float size;uniform float uScale;varying vec3 vC;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vA=size>0.?1.:0.;gl_PointSize=min(400.,size*uScale/max(.1,-mv.z));gl_Position=projectionMatrix*mv;\n#include <logdepthbuf_vertex>\n}',
   fragmentShader:FS_HEAD+(add?'varying vec3 vC;varying float vA;void main(){\n#include <logdepthbuf_fragment>\nfloat d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC*a,1.);}':'varying vec3 vC;varying float vA;void main(){\n#include <logdepthbuf_fragment>\nfloat d=length(gl_PointCoord-.5);float a=smoothstep(.5,.15,d)*vA;float l=max(vC.r,max(vC.g,vC.b));gl_FragColor=vec4(vC/max(l,.001)*.8,a*min(1.,l));}')});
  this.geo=geo;this.ptsA=new THREE.Points(geo,mk(true));this.ptsA.frustumCulled=false;this.ptsA.renderOrder=8;
  // smoke uses a second index range via a separate geometry
  this.sm=new SmokeSet(scene,1600,this.U);scene.add(this.ptsA);}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,drag=0,grow=0){const i=this.i;this.i=(i+1)%this.n;this.P[i*3]=x;this.P[i*3+1]=y;this.P[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.drag[i]=drag;this.grow[i]=grow;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=rnd(2)-1,dy=rnd(2)-1,dz=rnd(2)-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;const s=speed*(.3+rnd(.7));const c=Array.isArray(col)?col[rnd(col.length)|0]:col;
  this.emit(p[0],p[1],p[2],dx*s+(o.v?o.v[0]:0),dy*s+(o.v?o.v[1]:0),dz*s+(o.v?o.v[2]:0),c.r,c.g,c.b,size*(.5+rnd(.8)),life*(.5+rnd(.7)),o.drag??1.2,o.grow??0);}}
 update(dt,origin){const{P,v,c,oc,s,os,life,max,drag,grow,pos}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   for(let j=0;j<3;j++){v[i*3+j]*=dr;P[i*3+j]+=v[i*3+j]*dt;pos[i*3+j]=P[i*3+j]-origin[j];}const f=k*k;c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f;c[i*3+2]=oc[i*3+2]*f;s[i]=os[i]*(grow[i]?1+grow[i]*(1-k):(.4+.6*k));}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;this.sm.update(dt,origin);}
 clear(){this.life.fill(0);this.sm.life.fill(0);}}
class SmokeSet{constructor(scene,n,U){this.n=n;this.P=new Float64Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.oc=new Float32Array(n*3);this.pos=new Float32Array(n*3);this.i=0;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('col',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));g.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));this.geo=g;
  const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
   vertexShader:VS_HEAD+'attribute float size;attribute vec4 col;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=col;gl_PointSize=min(700.,size*uScale/max(.1,-mv.z));gl_Position=projectionMatrix*mv;\n#include <logdepthbuf_vertex>\n}',
   fragmentShader:FS_HEAD+'varying vec4 vC;void main(){\n#include <logdepthbuf_fragment>\nvec2 q=gl_PointCoord-.5;float d=length(q);float a=smoothstep(.5,.1,d)*vC.a*(.8+.2*sin(q.x*9.+q.y*7.));gl_FragColor=vec4(vC.rgb,a);}'});
  this.pts=new THREE.Points(g,m);this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);}
 emit(x,y,z,vx,vy,vz,shade,size,life,alpha=.5){const i=this.i;this.i=(i+1)%this.n;this.P.set([x,y,z],i*3);this.v.set([vx,vy,vz],i*3);this.oc.set([shade,shade,shade*1.02],i*3);this.c[i*4+3]=alpha;this.os[i]=size;this.life[i]=this.max[i]=life;}
 update(dt,origin){const{P,v,c,s,os,life,max,pos,oc}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i])s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-.6*dt);
   for(let j=0;j<3;j++){v[i*3+j]*=dr;P[i*3+j]+=v[i*3+j]*dt;pos[i*3+j]=P[i*3+j]-origin[j];}s[i]=os[i]*(1+2.5*(1-k));c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=Math.min(1,(1-k)*12)*k*.75;}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.col.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

/* ---------- orbit ribbons (constant pixel width) ---------- */
export class Ribbon{constructor(scene,n,color,opa=1){this.n=n;this.pos=new Float32Array(n*2*3);this.col=new Float32Array(n*2*3);this.color=new THREE.Color(color);this.opa=opa;const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.col,3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));this.mesh.frustumCulled=false;this.mesh.renderOrder=9;scene.add(this.mesh);this.count=0;}
 // pts: array of [x,y,z] in universe coords
 set(pts,cam,origin,px,dash=false,fade=0){const n=Math.min(pts.length,this.n);this.count=n;const cp=cam.position,k=2*Math.tan(cam.fov*Math.PI/360)/innerHeight*px;
  const P=i=>{const p=pts[Math.min(n-1,Math.max(0,i))];return[p[0]-origin[0],p[1]-origin[1],p[2]-origin[2]];};
  for(let i=0;i<this.n;i++){if(i>=n){for(let j=0;j<6;j++){this.pos[i*6+j]=0;this.col[i*6+j]=0;}continue;}const p=P(i),a=P(i-1),b=P(i+1);const tx=b[0]-a[0],ty=b[1]-a[1],tz=b[2]-a[2];const vx=cp.x-p[0],vy=cp.y-p[1],vz=cp.z-p[2];
   let sx=ty*vz-tz*vy,sy=tz*vx-tx*vz,sz=tx*vy-ty*vx;const sl=Math.hypot(sx,sy,sz)||1;const w=Math.hypot(vx,vy,vz)*k;sx*=w/sl;sy*=w/sl;sz*=w/sl;
   this.pos.set([p[0]+sx,p[1]+sy,p[2]+sz,p[0]-sx,p[1]-sy,p[2]-sz],i*6);let a2=this.opa*(dash&&((i>>2)&1)?.15:1)*(fade?1-fade*i/n:1);
   for(let j=0;j<2;j++){this.col[i*6+j*3]=this.color.r*a2;this.col[i*6+j*3+1]=this.color.g*a2;this.col[i*6+j*3+2]=this.color.b*a2;}}
  const g=this.mesh.geometry;g.attributes.position.needsUpdate=g.attributes.color.needsUpdate=true;g.setDrawRange(0,Math.max(0,(n-1)*6));this.mesh.visible=n>1;}
 hide(){this.mesh.visible=false;}}

/* ---------- space station ---------- */
export function makeStation(){const g=new THREE.Group();const S=THREE.MeshStandardMaterial;
 g.add(M(cyl(.12,.12,26,8),'metal').rotateZ(Math.PI/2));
 for(const[x,l,c]of[[0,6,'white'],[-4.5,4,'white'],[4.2,3.6,'pod']]){const m=M(cyl(1.4,1.4,l,32),c);m.rotation.z=Math.PI/2;m.position.x=x;g.add(m);}
 g.add(M(new THREE.SphereGeometry(1.5,24,16),'white',-7,0,0));g.add(M(cyl(1,1,3,24),'foil',0,0,2.2).rotateX(Math.PI/2));
 for(const s of[-1,1])for(const x of[-11,11]){const p=M(new THREE.BoxGeometry(3.2,.05,9),'solar',x,0,s*5.4);g.add(p);}
 for(const x of[-11,11])g.add(M(cyl(.08,.08,20,6),'metal',x,0,0).rotateX(Math.PI/2));
 const ring=M(new THREE.TorusGeometry(3.2,.22,10,48),'white',0,0,0);ring.rotation.y=Math.PI/2;g.add(ring);
 const blink=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(8,1,.5)}));blink.position.set(-8.5,0,0);g.add(blink);g.userData.blink=blink;
 const blink2=blink.clone();blink2.material=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,4,1)});blink2.position.set(6.2,0,0);g.add(blink2);g.userData.blink2=blink2;
 return g;}

/* ---------- launch complex (local frame: +Y up, built at the launch site) ---------- */
export function makeLaunchSite(){const g=new THREE.Group();const conc=new THREE.MeshStandardMaterial({color:0x8a8a8c,roughness:.9});
 const pad=M(cyl(26,30,2.2,48),conc,0,-1.1,0);g.add(pad);const trench=M(new THREE.BoxGeometry(4,2.3,22),new THREE.MeshStandardMaterial({color:0x1d1d1f,roughness:1}),0,-1.05,14);g.add(trench);
 const red=new THREE.MeshStandardMaterial({color:0xb83a1c,roughness:.6,metalness:.5});const steel=mat('metal');
 // tower
 const tw=new THREE.Group();tw.position.set(-9,0,0);for(const[x,z]of[[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4]])tw.add(M(new THREE.BoxGeometry(.3,34,.3),red,x,17,z));
 for(let y=2;y<34;y+=3){tw.add(M(new THREE.BoxGeometry(3.1,.2,.2),red,0,y,-1.4));tw.add(M(new THREE.BoxGeometry(3.1,.2,.2),red,0,y,1.4));tw.add(M(new THREE.BoxGeometry(.2,.2,3.1),red,-1.4,y,0));tw.add(M(new THREE.BoxGeometry(.2,.2,3.1),red,1.4,y,0));
  const d=M(new THREE.BoxGeometry(.12,4.2,.12),red,0,y+1.5,-1.4);d.rotation.z=.75;tw.add(d);}
 for(const y of[10,22,30])tw.add(M(new THREE.BoxGeometry(4.6,.25,.6),steel,2.8,y,0));
 const lamp=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(9,1.5,.6)}));lamp.position.set(0,34.6,0);tw.add(lamp);g.userData.lamp=lamp;g.add(tw);
 // service buildings + tanks
 const wall=new THREE.MeshStandardMaterial({color:0xd9dadf,roughness:.7});
 const vab=M(new THREE.BoxGeometry(60,46,40),wall,-120,23,-90);g.add(vab);const door=M(new THREE.BoxGeometry(.5,36,16),new THREE.MeshStandardMaterial({color:0x2a2d33}),-89.8,18,-90);g.add(door);
 const stripe=M(new THREE.BoxGeometry(60.2,3,40.2),mat('orange'),-120,40,-90);g.add(stripe);
 for(const[x,z,r]of[[40,-30,5],[52,-30,5],[40,-44,4]]){g.add(M(new THREE.SphereGeometry(r,24,16),wall,x,r+1.5,z));g.add(M(cyl(.3,.3,r+1.5,6),steel,x,(r+1.5)/2,z));}
 for(let i=0;i<6;i++){const b=M(new THREE.BoxGeometry(10+rnd(16),5+rnd(9),10+rnd(12)),wall,-60+i*24+rnd(6),0,120+rnd(30));b.position.y=b.geometry.parameters.height/2;g.add(b);}
 const road=M(new THREE.BoxGeometry(8,.1,170),new THREE.MeshStandardMaterial({color:0x55565a,roughness:.95}),-60,.06,-30);road.rotation.y=.9;g.add(road);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;}

/* ---------- assembly hangar (VAB scene) ---------- */
export function makeHangar(){const g=new THREE.Group();
 const floorT=ctex(1024,1024,(x,w,h)=>{x.fillStyle='#1a1c21';x.fillRect(0,0,w,h);for(let i=0;i<4000;i++){x.fillStyle=`rgba(255,255,255,${rnd(.03)})`;x.fillRect(rnd(w),rnd(h),2,2);}x.strokeStyle='rgba(255,255,255,.07)';x.lineWidth=2;for(let i=0;i<=16;i++){x.beginPath();x.moveTo(i*w/16,0);x.lineTo(i*w/16,h);x.stroke();x.beginPath();x.moveTo(0,i*h/16);x.lineTo(w,i*h/16);x.stroke();}
  x.strokeStyle='#ff4d00';x.lineWidth=6;x.beginPath();x.arc(w/2,h/2,w*.16,0,Math.PI*2);x.stroke();x.fillStyle='#f5c400';for(let i=0;i<24;i++){const a=i/24*Math.PI*2;x.save();x.translate(w/2+Math.cos(a)*w*.2,h/2+Math.sin(a)*h*.2);x.rotate(a);x.fillRect(-10,-3,20,6);x.restore();}});
 floorT.repeat.set(1,1);const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({map:floorT,roughness:.35,metalness:.3}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;g.add(floor);
 const wallM=new THREE.MeshStandardMaterial({color:0x2a2d35,roughness:.8,metalness:.2,side:THREE.BackSide});const box=new THREE.Mesh(new THREE.BoxGeometry(80,70,80),wallM);box.position.y=35;box.receiveShadow=true;g.add(box);
 const rib=new THREE.MeshStandardMaterial({color:0x3b3f4a,roughness:.6,metalness:.6});for(let i=-3;i<=3;i++){g.add(M(new THREE.BoxGeometry(1.2,70,1.2),rib,i*11,35,-39.4));g.add(M(new THREE.BoxGeometry(1.2,70,1.2),rib,-39.4,35,i*11));g.add(M(new THREE.BoxGeometry(1.2,70,1.2),rib,39.4,35,i*11));}
 for(let y=12;y<70;y+=14){g.add(M(new THREE.BoxGeometry(80,.8,.8),rib,0,y,-39));g.add(M(new THREE.BoxGeometry(.8,.8,80),rib,-39,y,0));g.add(M(new THREE.BoxGeometry(.8,.8,80),rib,39,y,0));}
 const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(6,5.6,5)});for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const l=new THREE.Mesh(new THREE.BoxGeometry(3,.3,.8),lm);l.position.set(i*14,68,j*14);g.add(l);}
 const stripeM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.9,.2)});for(const z of[-38.9]){const s=new THREE.Mesh(new THREE.BoxGeometry(80,.4,.1),stripeM);s.position.set(0,2,z);g.add(s);}
 const plat=M(cyl(5,5.6,.6,48),'metal',0,.3,0);g.add(plat);
 // gantry arm
 const gan=new THREE.Group();gan.add(M(new THREE.BoxGeometry(1,40,1),rib,-9,20,-2));gan.add(M(new THREE.BoxGeometry(8,.6,1.4),rib,-5,30,-2));gan.add(M(new THREE.BoxGeometry(8,.6,1.4),rib,-5,16,-2));g.add(gan);
 return g;}

/* ---------- environment map for metal reflections ---------- */
export function makeEnv(R,warm=false){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.04,.05,.07),${warm?'vec3(.25,.24,.26)':'vec3(.25,.4,.7)'},smoothstep(-.1,.4,h));c=mix(c,${warm?'vec3(.6,.58,.55)':'vec3(.05,.08,.16)'},smoothstep(.5,1.,h));gl_FragColor=vec4(c,1.);}`})));
 const l=new THREE.Mesh(new THREE.PlaneGeometry(40,20),new THREE.MeshBasicMaterial({color:new THREE.Color(8,7.5,7),side:THREE.DoubleSide}));l.position.set(50,60,30);l.lookAt(0,0,0);s.add(l);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}
