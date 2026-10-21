// SWELL GUARD — the ocean. One analytic wave model drives both the physics (JS) and the GPU (GLSL), so the surfer rides
// exactly the surface you see. Sets of swell lines roll in from the horizon, shoal, pitch at a peak and peel along the
// crest (lefts, rights or A-frames). Each breaking section throws a curling lip (its own mesh, so it can overhang and
// make a barrel), lands, and turns into a whitewater bore that runs up the beach as swash.
//
// Wave k: W0=(zc crest line z, x0 peak x, A height m, mode -1 left / 0 A-frame / 1 right),
//         W1=(tb seconds since the peak pitched (<0 unbroken), ps peel speed m/s, zB break line z, fade 0..1).
// Shore is z=0 (sand landward, z<0); waves travel toward -z at C m/s.
import * as THREE from '../vendor/three.module.min.js';
export const C=5.2,TLIP=1.6,NW=8;
const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
export const sandY=z=>z<0?-z*.065+(z<-40?(-40-z)*.09:0):-Math.min(z*.045,9)+.7*Math.exp(-Math.pow((z-58)/16,2));

// ---------- JS mirror of the GLSL height function ----------
export function waveTerm(w,x,z,o){const dx=x-w.x0,adx=Math.abs(dx);if(w.A<=.01||w.fade<=0)return 0;
 const sp=(w.mode===0||dx*w.mode>0)?w.ps:w.ps*.45,ab=w.tb-adx/sp;
 let a=w.A*w.fade*(.5+.5*Math.exp(-dx*dx/7200))*sm(240,150,adx)*(.35+.65*sm(w.zB+150,w.zB,w.zc));
 const br=sm(TLIP*.6,TLIP+.5,ab);a*=1+(.45+.25*Math.exp(-Math.max(ab-TLIP,0)*.35)-1)*br;
 a*=(.22+.78*sm(0,16,w.zc))*sm(-9,-2,w.zc);
 const stp=sm(-2.5,-.2,ab)*(1-sm(TLIP,TLIP+.8,ab)),wf=a*(1.5-.8*stp)+.6,wb=a*3.2+3,u=z-w.zc;
 let p;if(u<0){const t=-u/wf;p=Math.exp(-Math.pow(t,2-1.1*stp));}else{const t=u/wb;p=Math.exp(-t*t);}
 if(o){o.a=a;o.u=u;o.ab=ab;o.wf=wf;o.wb=wb;o.br=br;o.stp=stp;o.sp=sp;}
 return a*p;}
export function ambient(x,z,t,amb){const k=amb*Math.min(1,Math.max(0,(z+2)/30));
 return k*(.16*Math.sin(.105*z+.02*x+t*1.1)+.1*Math.sin(.07*z-.05*x+t*.8+1.3)+.06*Math.sin(.21*z+.13*x+t*1.9+2.1));}

// ---------- GLSL ----------
export const GL_WAVES=`
#define NW ${NW}
#define TLIP ${TLIP.toFixed(3)}
uniform vec4 uW0[NW];uniform vec4 uW1[NW];uniform float uT,uAmb,uTurb;
float sandY(float z){return z<0.?-z*.065+(z<-40.?(-40.-z)*.09:0.):-min(z*.045,9.)+.7*exp(-pow((z-58.)/16.,2.));}
float waveTerm(int k,vec2 p,out float foam,out float hv,out float ww){vec4 A=uW0[k],B=uW1[k];foam=0.;hv=0.;ww=0.;if(A.z<=.01||B.w<=0.)return 0.;
 float dx=p.x-A.y,adx=abs(dx);float sp=(A.w==0.||dx*A.w>0.)?B.y:B.y*.45;float ab=B.x-adx/sp;
 float a=A.z*B.w*(.5+.5*exp(-dx*dx/7200.))*(1.-smoothstep(150.,240.,adx))*(.35+.65*(1.-smoothstep(B.z,B.z+150.,A.x)));
 float br=smoothstep(TLIP*.6,TLIP+.5,ab);a*=1.+(.45+.25*exp(-max(ab-TLIP,0.)*.35)-1.)*br;
 a*=(.22+.78*smoothstep(0.,16.,A.x))*smoothstep(-9.,-2.,A.x);
 float stp=smoothstep(-2.5,-.2,ab)*(1.-smoothstep(TLIP,TLIP+.8,ab));float wf=a*(1.5-.8*stp)+.6,wb=a*3.2+3.,u=p.y-A.x;
 float pr;if(u<0.){float t=-u/wf;pr=exp(-pow(t,2.-1.1*stp));}else{float t=u/wb;pr=exp(-t*t);}
 // foam: crest feathering while pitching, the whitewater bore, lace trailing behind it
 float crest=exp(-pow(max(u+.15*wf,0.)/(.14*wf+.2),2.))*smoothstep(-.4,.3,ab)*(1.-br)*smoothstep(.6,1.4,a)*.55;
 float bore=br*smoothstep(-wf*1.35,-wf*.75,u)*exp(-max(u,0.)/(5.+min(ab,8.)*2.2))*(.6+.4*exp(-max(ab-TLIP,0.)*.12));
 float lace=br*smoothstep(-wf,0.,u)*exp(-max(u,0.)/22.)*.36;
 foam=max(max(crest*.85,bore),lace)*smoothstep(.15,.6,a);ww=bore;hv=pr*smoothstep(.3,1.5,a)*(u<0.?1.:.6);
 return a*pr;}
float ambient(vec2 p){float k=uAmb*clamp((p.y+2.)/30.,0.,1.);return k*(.16*sin(.105*p.y+.02*p.x+uT*1.1)+.1*sin(.07*p.y-.05*p.x+uT*.8+1.3)+.06*sin(.21*p.y+.13*p.x+uT*1.9+2.1));}
float oceanH(vec2 p,out float foam,out float hv){float h=ambient(p);foam=0.;hv=0.;float ww=0.;
 for(int k=0;k<NW;k++){float f,v,w;h+=waveTerm(k,p,f,v,w);foam=max(foam,f);hv=max(hv,v);ww=max(ww,w);}
 // churning whitewater: lumpy turbulence riding on the bore (visual only)
 h+=ww*uTurb*(sin(p.x*1.31+uT*3.1)*sin(p.y*1.7-uT*2.3)*.5+sin(p.x*2.9-uT*4.)*sin(p.y*3.3+uT*3.)*.25)*.32;
 return h;}
float oceanH0(vec2 p){float f,v;return oceanH(p,f,v);}
`;
export const GL_SKY=`
uniform vec3 uSun,uSunC;uniform sampler2D tCloud;uniform float uCloudT;
vec3 skyCol(vec3 d,float clouds){float sd=dot(d,uSun);float y=max(d.y,0.);
 vec3 horC=mix(vec3(.42,.53,.74),vec3(1.0,.7,.45),pow(sd*.5+.5,3.5));
 vec3 zen=vec3(.03,.11,.36);vec3 c=mix(horC,zen,pow(y,.38));
 c+=vec3(1.,.6,.3)*pow(max(sd,0.),12.)*.32+vec3(1.,.78,.5)*pow(max(sd,0.),420.)*1.0;
 if(clouds>0.&&d.y>0.){vec2 uv=d.xz/(d.y+.08)*.11+vec2(uCloudT*.0035,uCloudT*.0012);float n=texture2D(tCloud,uv).r*.65+texture2D(tCloud,uv*2.7+.3).r*.35;
  float cov=smoothstep(.46,.7,n)*smoothstep(.0,.12,d.y)*clouds;vec3 cc=mix(vec3(.62,.56,.66),vec3(1.35,.95,.66),pow(sd*.5+.5,2.5));cc*=.75+.35*smoothstep(.5,.85,n);c=mix(c,cc,cov*.85);}
 if(d.y<0.)c=mix(horC*.72,vec3(.05,.12,.17),smoothstep(0.,-.25,d.y));
 return c;}
`;
// shared water shading: geometric normal + scrolling ripple normals, Fresnel sky reflection, sun glitter,
// depth/shallow colour over sand, subsurface glow through thin crests and lips, foam lace
const GL_SHADE=`
uniform sampler2D tWaterN,tFoam;uniform vec3 uCam;uniform float uHiQ;
vec3 shadeWater(vec3 wp,vec3 N,float foam,float hv,float depth,float thin,float facing){
 vec3 V=normalize(uCam-wp);float dist=length(uCam-wp);
 vec2 q1=wp.xz*.085+vec2(uT*.011,uT*.019),q2=wp.xz*.23-vec2(uT*.024,-uT*.009);
 vec3 n1=texture2D(tWaterN,q1).xyz*2.-1.,n2=texture2D(tWaterN,q2).xyz*2.-1.;float dk=(.22*exp(-dist/70.)+.05)*(1.-.6*thin);
 N=normalize(N+vec3(n1.x+n2.x*.7,0.,n1.y+n2.y*.7)*dk);
 float NdV=max(dot(N,V),0.);float F=.02+.98*pow(1.-NdV,5.);F=mix(F,.02+.3*pow(1.-NdV,3.),thin);
 vec3 R=reflect(-V,N);R.y=max(R.y,.015);vec3 refl=skyCol(normalize(R),uHiQ);
 float rl=max(dot(R,uSun),0.);vec3 spec=uSunC*(pow(rl,1100.)*45.*uHiQ+pow(rl,160.)*.8+pow(rl,18.)*.04);
 float dl=max(dot(N,uSun),0.);
 vec3 deep=vec3(.004,.03,.07),mid=vec3(.012,.11,.15),shal=vec3(.1,.34,.32);
 vec3 body=mix(deep,mid,exp(-max(depth,0.)*.09));body=mix(body,shal,exp(-max(depth,0.)*.75)*.85);body=mix(body,vec3(.42,.36,.25),exp(-max(depth,0.)*2.5)*.7);
 vec3 amb=skyCol(vec3(0.,1.,0.),0.)*.35;
 vec3 col=body*(amb+uSunC*(.12+.25*dl));
 // subsurface: light scattered through the upper face toward a viewer looking into the sun, plus a little everywhere it is thin
 float back=pow(clamp(dot(V,-normalize(uSun+vec3(0.,-.25,0.))),0.,1.),3.);float sss=hv*(back*1.7+.1)+thin*(back*2.2+.2);
 col+=vec3(.06,.62,.5)*uSunC*sss*.55*(1.-F*.6);
 col=mix(col,refl,F)+spec*(1.-clamp(foam*1.3,0.,1.));
 // foam
 vec2 f1=wp.xz*.19+vec2(uT*.006,-uT*.02),f2=wp.xz*.47+vec2(-uT*.01,uT*.008);float ft=texture2D(tFoam,f1).r*.62+texture2D(tFoam,f2).r*.38;
 float m=clamp(foam,0.,1.3);float cov=smoothstep(1.-m,1.-m+.16,ft)+smoothstep(.85,1.15,m)*.8;cov=clamp(cov,0.,1.);
 vec3 fc=vec3(.92,.95,.98)*(amb*1.5+uSunC*(.25+.55*dl))+vec3(.4,.6,.55)*uSunC*back*.25;
 col=mix(col,fc,cov*(.45+.51*smoothstep(.35,.8,m)));
 vec3 fd=wp-uCam;float fl=length(fd.xz);vec3 hz=skyCol(normalize(vec3(fd.x,.02*fl,fd.z)),0.);col=mix(col,hz,1.-exp(-dist*dist*1.5e-6));
 return col;}
`;

// ---------- sky dome ----------
export function makeSky(T,sun,sunC){const U={uSun:{value:sun},uSunC:{value:sunC},tCloud:{value:T.cloud},uCloudT:{value:0}};
 const m=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:GL_SKY+`varying vec3 vD;void main(){vec3 d=normalize(vD);vec3 c=skyCol(d,1.);float sd=dot(d,uSun);c+=vec3(14.,10.,6.)*smoothstep(.99955,.9998,sd);gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),m);mesh.scale.setScalar(3000);mesh.frustumCulled=false;mesh.renderOrder=-10;mesh.userData.U=U;return mesh;}

// ---------- ocean surface: one camera-following grid, dense near the focus and stretched to the horizon ----------
function warpedGrid(n,a,b){const g=new THREE.BufferGeometry(),P=new Float32Array(n*n*3),I=[];const f=s=>Math.sign(s)*a*Math.abs(s)/(1-b*Math.abs(s));
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=(j*n+i)*3;P[k]=f(i/(n-1)*2-1);P[k+1]=0;P[k+2]=f(j/(n-1)*2-1);}
 for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){const a0=j*n+i,a1=a0+1,b0=a0+n,b1=b0+1;I.push(a0,b0,a1,a1,b0,b1);}
 g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setIndex(I);g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e5);return g;}

export class OceanView{
 constructor(scene,T,sun,sunC){this.scene=scene;this.T=T;
  this.W0=[...Array(NW)].map(()=>new THREE.Vector4());this.W1=[...Array(NW)].map(()=>new THREE.Vector4(-99,8,60,0));
  this.U={uW0:{value:this.W0},uW1:{value:this.W1},uT:{value:0},uAmb:{value:1},uTurb:{value:1},uSun:{value:sun},uSunC:{value:sunC},tCloud:{value:T.cloud},uCloudT:{value:0},
   tWaterN:{value:T.waterN},tFoam:{value:T.foam},uCam:{value:new THREE.Vector3()},uHiQ:{value:1},uCenter:{value:new THREE.Vector2()},uEps:{value:.25},uSwash:{value:0}};
  this.mat=new THREE.ShaderMaterial({uniforms:{},transparent:true,
   vertexShader:GL_WAVES+`uniform vec2 uCenter;uniform float uEps;varying vec3 vWP,vN;varying float vFoam,vHv;
    void main(){vec2 p=position.xz+uCenter;float f,hv;float h=oceanH(p,f,hv);float e=uEps*(1.+length(position.xz)*.02);
     float hx=oceanH0(p+vec2(e,0.)),hz=oceanH0(p+vec2(0.,e));vN=normalize(vec3(h-hx,e,h-hz));
     vWP=vec3(p.x,h,p.y);vFoam=f;vHv=hv;float d=h-sandY(p.y);vFoam=max(vFoam,(1.-smoothstep(.05,.45,d))*.9*step(-.5,d));
     vec4 mv=viewMatrix*vec4(vWP,1.);gl_Position=projectionMatrix*mv;
    }`,
   fragmentShader:GL_WAVES+GL_SKY+GL_SHADE+`varying vec3 vWP,vN;varying float vFoam,vHv;
    void main(){float depth=vWP.y-sandY(vWP.z);if(depth<-.02)discard;
     vec3 c=shadeWater(vWP,normalize(vN),vFoam,vHv,depth,0.,1.);
     float a=smoothstep(-.02,.1,depth);gl_FragColor=vec4(c,a);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  Object.assign(this.mat.uniforms,this.U);
  this.mesh=null;this.lips=[];this.q=-1;this.lipGeo=null;}
 // quality: 0 LOW = coarse grid, no sky reflections or glitter detail; 1 MEDIUM; 2 ULTRA
 setQuality(q){if(this.q===q)return;this.q=q;if(this.mesh){this.scene.remove(this.mesh);this.mesh.geometry.dispose();}
  const n=[120,200,288][q];this.mesh=new THREE.Mesh(warpedGrid(n,[70,64,60][q],.972),this.mat);this.mesh.frustumCulled=false;this.mesh.renderOrder=1;this.scene.add(this.mesh);
  this.U.uHiQ.value=q>0?1:0;this.U.uEps.value=[.45,.3,.22][q];
  for(const l of this.lips){this.scene.remove(l.mesh);}this.lips=[];if(this.lipGeo)this.lipGeo.dispose();
  const na=[24,40,56][q],nb=[8,14,18][q];this.lipGeo=new THREE.PlaneGeometry(1,1,na,nb);this.lipGeo.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e5);
  for(let k=0;k<NW*2;k++){const U={...this.U,uK:{value:k>>1},uSide:{value:k&1?1:-1}};const m=new THREE.ShaderMaterial({uniforms:{},transparent:true,side:THREE.DoubleSide,depthWrite:true,
    vertexShader:GL_WAVES+`uniform int uK;uniform float uSide;varying vec3 vWP,vN;varying float vFoam,vAl,vB;
      vec3 lipPos(float al,float b,out float alpha,out float tip){vec4 A=uW0[0],B=uW1[0];for(int i=0;i<NW;i++)if(i==uK){A=uW0[i];B=uW1[i];}
      float sp=(A.w==0.||A.w==uSide)?B.y:B.y*.45;float ab=mix(-.8,TLIP+.45,al);float x=A.y+uSide*sp*max(B.x-ab,0.);
      float f,hv,w;vec2 pc=vec2(x,A.x);float own=waveTerm(uK,pc,f,hv,w);float hc=oceanH0(pc);
      // local (unbroken) height of this wave at x: the lip throws a fraction of it
      float dx=x-A.y;float a=A.z*B.w*(.5+.5*exp(-dx*dx/7200.))*smoothstep(240.,150.,abs(dx))*(.35+.65*(1.-smoothstep(B.z,B.z+150.,A.x)))*(.22+.78*smoothstep(0.,16.,A.x));
      float q=clamp(ab/TLIP,0.,1.);float fe=smoothstep(-.8,.05,ab);
      float L=a*(.3*fe+1.2*pow(q,.6)),D=a*1.08*q*q;
      float dz=-L*b+a*.25*pow(b,3.)*q*q,dy=a*.42*b*(1.-b)*q-D*pow(b,2.2)-a*.06;
      alpha=fe*(1.-smoothstep(TLIP,TLIP+.4,ab))*step(.4,a)*step(0.,B.x-ab);tip=smoothstep(.72,1.,b)*q*.85+smoothstep(TLIP-.3,TLIP+.2,ab)*.6*smoothstep(.3,.7,b);
      return vec3(x,hc+dy+a*.04,A.x+dz+a*.12-b*a*.04);}
     void main(){float al=uv.x,b=1.-uv.y;float alpha,tip,a2,t2;vec3 p=lipPos(al,b,alpha,tip);
      vec3 pa=lipPos(min(al+.02,1.),b,a2,t2)-lipPos(max(al-.02,0.),b,a2,t2);vec3 pb=lipPos(al,min(b+.05,1.),a2,t2)-lipPos(al,max(b-.05,0.),a2,t2);
      vN=normalize(cross(pa,pb));vWP=p;vFoam=tip;vAl=alpha;vB=b;
      vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader:GL_WAVES+GL_SKY+GL_SHADE+`varying vec3 vWP,vN;varying float vFoam,vAl,vB;
      void main(){if(vAl<.01)discard;vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;
      float ff=gl_FrontFacing?1.:0.;vec3 c=shadeWater(vWP,N,vFoam*1.1,mix(.25,.45+vB*.4,ff),8.,mix(.12,.35+vB*.4,ff),1.);c*=mix(vec3(.55,.8,.78),vec3(1.),ff);gl_FragColor=vec4(c,clamp(vAl*(.97-vB*.15),0.,1.));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
   Object.assign(m.uniforms,U);const mesh=new THREE.Mesh(this.lipGeo,m);mesh.frustumCulled=false;mesh.renderOrder=2;mesh.visible=false;this.scene.add(mesh);this.lips.push({mesh,k:k>>1,side:k&1?1:-1});}}
 update(sim,cam,center,t){const U=this.U;U.uT.value=t;U.uCloudT.value=t;U.uCam.value.copy(cam.position);U.uCenter.value.set(center.x,center.z);U.uAmb.value=sim.amb;
  for(let k=0;k<NW;k++){const w=sim.waves[k];if(w){this.W0[k].set(w.zc,w.x0,w.A,w.mode);this.W1[k].set(w.tb,w.ps,w.zB,w.fade);}else{this.W0[k].set(0,0,0,0);this.W1[k].set(-99,8,60,0);}}
  for(const l of this.lips){const w=sim.waves[l.k];l.mesh.visible=!!(w&&w.tb>-.8&&w.A*w.fade>.4&&w.zc>3&&(w.mode===0||w.mode===l.side||true)&&w.tb<60);}}
}
// ---------- wave simulation (JS side) ----------
export const SURF_CFG=[{A:[1.35,1.8],setGap:[15,21],per:[2,3],ps:[6.2,7.2],amb:.8},{A:[1.9,2.5],setGap:[14,20],per:[2,4],ps:[7,8.2],amb:1},{A:[2.6,3.3],setGap:[13,18],per:[3,4],ps:[7.8,9.2],amb:1.2}];
export class Swell{
 constructor(diff,rand=Math.random){this.cfg=SURF_CFG[diff];this.amb=this.cfg.amb;this.waves=[];this.t=0;this.rand=rand;this.next=1;this.queue=[];this.big=0;this.ids=0;this.onBreak=null;}
 r(a,b){return a+(b-a)*this.rand();}
 prime(){// fill the ocean as if it had been running: one set already breaking, one on its way
  this.spawnSet(0,66,true);this.spawnSet(0,175,true);this.next=this.r(...this.cfg.setGap)*.7;}
 spawnSet(big=0,z0=205,now=false){const c=this.cfg,n=Math.round(this.r(c.per[0],c.per[1]+.49)),x0=this.r(-26,26),mode=[-1,1,0,1,-1][Math.floor(this.rand()*5)];
  for(let i=0;i<n;i++){const A=this.r(c.A[0],c.A[1])*(big?1.55:1)*(i===1?1.08:1);const gap=this.r(6.5,8.5);this.queue.push({delay:now?0:i*gap,w:{id:++this.ids,zc:z0+(now?i*gap*C:0),x0:x0+this.r(-7,7),A,mode,tb:-99,ps:this.r(...c.ps)*(big?1.12:1),zB:40+A*9+this.r(-3,3),fade:now?1:0,big:!!big,broke:false,riders:0}});}}
 update(dt){this.t+=dt;this.next-=dt;if(this.next<=0){this.spawnSet(this.big>0?1:0);if(this.big>0)this.big--;this.next=this.r(...this.cfg.setGap);}
  for(const q of this.queue)q.delay-=dt;for(let i=0;i<this.queue.length&&this.waves.length<NW;i++)if(this.queue[i].delay<=0){this.waves.push(this.queue[i].w);this.queue.splice(i--,1);}
  for(const w of this.waves){w.zc-=C*dt;w.fade=Math.min(1,w.fade+dt*.25);if(!w.broke&&w.zc<=w.zB){w.broke=true;w.tb=0;if(this.onBreak)this.onBreak(w);}else if(w.broke)w.tb+=dt;}
  this.waves=this.waves.filter(w=>w.zc>-9.5);}
 height(x,z){let h=ambient(x,z,this.t,this.amb);for(const w of this.waves)h+=waveTerm(w,x,z);return h;}
 // the wave that dominates (x,z) with its local frame: crest offset u, break age ab, face width...
 sample(x,z,o={}){let best=null,bh=0;const tmp={};o.h=ambient(x,z,this.t,this.amb);
  for(const w of this.waves){const h=waveTerm(w,x,z,tmp);o.h+=h;if(h>bh){bh=h;best=w;Object.assign(o,{a:tmp.a,u:tmp.u,ab:tmp.ab,wf:tmp.wf,wb:tmp.wb,br:tmp.br,stp:tmp.stp,sp:tmp.sp,hw:h});}}
  o.w=best;if(!best){o.a=0;o.u=99;o.ab=-99;o.br=0;o.hw=0;o.wf=1;o.wb=1;o.stp=0;}return o;}
 sampleWave(w,x,z,o={}){o.h=this.height(x,z);o.hw=waveTerm(w,x,z,o);o.w=w;return o;}
 grad(x,z,e=.2){const h=this.height(x,z);return[(this.height(x+e,z)-h)/e,(this.height(x,z+e)-h)/e,h];}
 // where is this wave's peel point (the curl) on a given side, right now
 peelX(w,side){const sp=(w.mode===0||w.mode===side)?w.ps:w.ps*.45;return w.x0+side*sp*Math.max(0,w.tb);}
}
