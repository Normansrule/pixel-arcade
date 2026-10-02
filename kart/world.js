// CRITTER KART — world visuals: sky, sea, island terrain, road, props, pickups, rings, start gate, hub doors.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,lerp,sstep,rng,fbm,ctex,speckle,merge,M4,lumpy,textSprite} from './util.js';
import {SEA,at,yawAt} from './course.js';
import {podMesh,berryGeo,coinGeo,ringMesh,balloonMesh,mat} from './models.js';

const TONE='\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
const col=c=>new THREE.Color(c);

/* ================= sky ================= */
function makeSky(T){const sun=new V(...T.sun).normalize();const U={uTop:{value:col(T.sky[0])},uHor:{value:col(T.sky[1])},uSun:{value:sun},uSunC:{value:col(T.sunC)},uNight:{value:T.night?1:0},uT:{value:0}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(4000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:U,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunC;uniform float uNight,uT;varying vec3 vD;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.03;a*=.5;}return s;}
  void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(uHor,uTop,pow(smoothstep(-.02,.7,y),.7));c=mix(c,uHor*.8,smoothstep(0.,-.3,y));
   float sd=max(0.,dot(d,uSun));c+=uSunC*(pow(sd,1200.)*14.+pow(sd,60.)*.5+pow(sd,6.)*.22)*(1.-uNight*.5);
   if(y>0.){vec2 q=d.xz/(y+.1)*1.2+vec2(uT*.004,uT*.001);float cl=smoothstep(.5,.85,fb(q))*smoothstep(0.,.15,y);vec3 cc=mix(vec3(1.),uHor,.3)*(1.-uNight*.8)+uSunC*pow(sd,4.)*.6;c=mix(c,cc,cl*.75);
    if(uNight>.5){vec2 g=floor(d.xz/(y+.35)*220.);float s=step(.994,h(g))*smoothstep(.04,.35,y);c+=vec3(.9,.95,1.)*s*(.5+.5*sin(uT*2.+h(g)*50.));
     c+=vec3(.25,.1,.45)*smoothstep(.6,.9,fb(d.xz/(y+.4)*2.5))*smoothstep(.1,.5,y)*.6;}}
   gl_FragColor=vec4(c,1.);${TONE}}`}));m.renderOrder=-10;m.frustumCulled=false;m.userData.U=U;return m;}

/* ================= sea ================= */
function makeSea(T,TR,fogU){const D=TR;const data=new Uint8Array(D.nx*D.nz);for(let i=0;i<data.length;i++)data[i]=cl((SEA-D.H[i])/14,0,1)*255|0;
 const tex=new THREE.DataTexture(data,D.nx,D.nz,THREE.RedFormat,THREE.UnsignedByteType);tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;
 const U={uDepth:{value:tex},uBox:{value:new THREE.Vector4(D.x0,D.z0,(D.nx-1)*D.cs,(D.nz-1)*D.cs)},uT:{value:0},uDeep:{value:col(T.water[0])},uShal:{value:col(T.water[1])},uSky:{value:col(T.sky[1])},uSkyT:{value:col(T.sky[0])},uSun:{value:new V(...T.sun).normalize()},uSunC:{value:col(T.sunC)},uFogC:fogU.c,uFogD:fogU.d,uNight:{value:T.night?1:0}};
 const g=new THREE.PlaneGeometry(9000,9000,1,1);g.rotateX(-Math.PI/2);
 const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:U,transparent:false,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform sampler2D uDepth;uniform vec4 uBox;uniform float uT,uFogD,uNight;uniform vec3 uDeep,uShal,uSky,uSkyT,uSun,uSunC,uFogC;varying vec3 vW;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float wv(vec2 p){return n(p*.11+vec2(uT*.13,uT*.07))*.6+n(p*.31-vec2(uT*.21,-uT*.17))*.3+n(p*.9+vec2(uT*.5,uT*.4))*.12;}
  void main(){vec2 uv=(vW.xz-uBox.xy)/uBox.zw;float dep=(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)?14.:texture2D(uDepth,uv).r*14.;
   float e=.6;float c0=wv(vW.xz),cx=wv(vW.xz+vec2(e,0.)),cz=wv(vW.xz+vec2(0.,e));vec3 N=normalize(vec3((c0-cx)*2.2,1.,(c0-cz)*2.2));
   vec3 V=normalize(cameraPosition-vW);float fr=.04+.96*pow(1.-max(dot(N,V),0.),5.);
   vec3 R=reflect(-V,N);vec3 sky=mix(uSky,uSkyT,smoothstep(0.,.6,R.y));
   vec3 base=mix(uShal,uDeep,smoothstep(.3,7.,dep));base*=.75+.25*smoothstep(0.,2.,dep)+(1.-smoothstep(0.,1.2,dep))*.2;
   vec3 c=mix(base,sky,fr*.85);float sp=pow(max(dot(R,uSun),0.),220.)*3.+pow(max(dot(R,uSun),0.),24.)*.25;c+=uSunC*sp*(1.-uNight*.6);
   float foam=(1.-smoothstep(0.,.9,dep))*(.55+.45*sin(uT*2.2-dep*9.+n(vW.xz*.4)*6.));foam+=smoothstep(.62,.7,n(vW.xz*.25+uT*.05))*.12*smoothstep(4.,1.,dep);c=mix(c,vec3(1.)*(uNight>.5?.55:1.),clamp(foam,0.,1.)*.85);
   if(uNight>.5)c+=vec3(.05,.3,.6)*smoothstep(.75,.95,n(vW.xz*.8+uT*.3))*.35;
   float fd=length(cameraPosition-vW);float f=1.-exp(-uFogD*uFogD*fd*fd);c=mix(c,uFogC,clamp(f,0.,1.));
   gl_FragColor=vec4(c,1.);${TONE}}`}));m.position.y=SEA;m.receiveShadow=false;m.userData.U=U;return m;}

/* ================= terrain ================= */
function makeTerrain(T,TR){const nx=TR.nx,nz=TR.nz,g=new THREE.BufferGeometry(),pos=new Float32Array(nx*nz*3),colr=new Float32Array(nx*nz*3),uv=new Float32Array(nx*nz*2),idx=[];
 const[cs,cg,cr,cw]=T.ground.map(col),tmp=new THREE.Color();
 for(let a=0;a<nz;a++)for(let b=0;b<nx;b++){const k=a*nx+b,x=TR.x0+b*TR.cs,z=TR.z0+a*TR.cs,h=TR.H[k];pos.set([x,h,z],k*3);uv.set([x*.08,z*.08],k*2);
  const hx=TR.H[a*nx+Math.min(nx-1,b+1)]-TR.H[a*nx+Math.max(0,b-1)],hz=TR.H[Math.min(nz-1,a+1)*nx+b]-TR.H[Math.max(0,a-1)*nx+b],slope=Math.hypot(hx,hz)/(2*TR.cs),nn=fbm(x*.05,z*.05,3);
  tmp.copy(cg);tmp.lerp(cs,sstep(2.2,.9,h+nn*.6));if(T.snow)tmp.lerp(cw,sstep(.7,.4,slope)*.85);tmp.lerp(cr,sstep(.55,.95,slope+nn*.15));if(!T.snow&&!T.night)tmp.lerp(cw,sstep(70,95,h+nn*8));
  if(h<SEA-.3)tmp.lerp(cs,.6).multiplyScalar(.75);const v=.9+nn*.18;colr.set([tmp.r*v,tmp.g*v,tmp.b*v],k*3);
  if(a<nz-1&&b<nx-1)idx.push(k,k+nx,k+1,k+1,k+nx,k+nx+1);}
 g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(colr,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const det=ctex(256,256,(x,w,h)=>{speckle(x,w,h,'#c8c8c8',.22,9000,2);for(let i=0;i<260;i++){x.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?40:255},0,.05)`;x.beginPath();x.arc(Math.random()*w,Math.random()*h,2+Math.random()*7,0,7);x.fill();}});
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:det,roughness:.95,metalness:0}));m.receiveShadow=true;return m;}

/* ================= road ================= */
function roadTex(style){let em=null;const map=ctex(256,512,(x,w,h)=>{
  if(style==='sand'){speckle(x,w,h,'#c9a26e',.2,16000);x.fillStyle='rgba(120,80,40,.22)';for(const c of[.27,.33,.67,.73])x.fillRect(c*w,0,10,h);x.fillStyle='rgba(255,255,255,.75)';x.fillRect(w/2-3,0,6,h*.4);}
  else if(style==='snow'){speckle(x,w,h,'#c8d4ec',.14,12000);x.fillStyle='rgba(120,140,190,.22)';for(const c of[.27,.33,.67,.73])x.fillRect(c*w,0,10,h);x.fillStyle='rgba(90,140,255,.5)';x.fillRect(w/2-3,0,6,h*.4);}
  else if(style==='stone'){speckle(x,w,h,'#7a6a58',.12,5000);for(let r=0;r<8;r++)for(let c=0;c<4;c++){const ox=(r%2)*32;x.fillStyle=`hsl(${28+Math.random()*16},${18+Math.random()*12}%,${38+Math.random()*12}%)`;x.fillRect(c*64+ox-30,r*64+3,60,58);}x.fillStyle='rgba(60,120,40,.3)';for(let i=0;i<60;i++)x.fillRect(Math.random()*w,Math.random()*h,8,3);}
  else{speckle(x,w,h,'#22224a',.14,9000);x.strokeStyle='rgba(120,140,255,.35)';x.lineWidth=2;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*h/4);x.lineTo(w,i*h/4);x.stroke();}}});
 if(style==='crystal')em=ctex(256,512,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.fillStyle='#3af0ff';x.fillRect(8,0,6,h);x.fillRect(w-14,0,6,h);x.fillStyle='#ff6af0';for(let i=0;i<4;i++)x.fillRect(w/2-3,i*h/4,6,h/8);});
 return{map,em};}
function ribbon(C,from,to,prof,yOff,tileU=1){const B=C.B,pos=[],uvs=[],idx=[];const n=B.n;let cnt=0;
 for(let k=from;k<=to;k++){const i=k%n;for(let j=0;j<prof.length;j++){const u=prof[j],yo=typeof yOff==='function'?yOff(i,j):yOff[j]??yOff;pos.push(B.x[i]+B.nx[i]*u,B.y[i]+yo,B.z[i]+B.nz[i]*u);uvs.push(j/(prof.length-1)*tileU,(k*B.step)/16);}cnt++;}
 for(let k=0;k<cnt-1;k++)for(let j=0;j<prof.length-1;j++){const o=k*prof.length+j;idx.push(o,o+prof.length,o+1,o+1,o+prof.length,o+prof.length+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function runs(B,ok){const out=[];let cur=null;for(let i=0;i<B.n;i++){if(ok(i)){if(!cur){cur=[i,i];out.push(cur);}else cur[1]=i;}else cur=null;}
 if(out.length>1&&out[0][0]===0&&out[out.length-1][1]===B.n-1){const l=out.pop();out[0]=[l[0],out[0][1]+B.n];}else if(out.length===1&&out[0][0]===0&&out[0][1]===B.n-1)out[0]=[0,B.n];return out;}
function makeRoad(C,T,grp,worldCol){const B=C.B,w=C.def.wd,{map,em}=roadTex(T.road);
 const rm=new THREE.MeshStandardMaterial({map,roughness:T.road==='crystal'?.35:.9,metalness:T.road==='crystal'?.3:0,emissiveMap:em,emissive:em?0xffffff:0,emissiveIntensity:em?1.4:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 const dry=runs(B,i=>!B.wet[i]);
 for(const[a,b]of dry){const g=ribbon(C,a,b,[-w,-w*.5,0,w*.5,w],[.04,.05,.06,.05,.04]);const m=new THREE.Mesh(g,rm);m.receiveShadow=true;grp.add(m);
  if(C.def.veh==='kart'||C.def.hub){const ct=ctex(64,64,(x,W,H)=>{x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle=worldCol;x.fillRect(0,0,W,H/2);});ct.magFilter=THREE.NearestFilter;
   const cm=new THREE.MeshStandardMaterial({map:ct,roughness:.6,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
   for(const s of[-1,1]){const g2=ribbon(C,a,b,s<0?[-w-1.3,-w-.6,-w]:[w,w+.6,w+1.3],s<0?[.02,.2,.07]:[.07,.2,.02]);const uv=g2.attributes.uv;for(let q=0;q<uv.count;q++)uv.setY(q,uv.getY(q)*4);const cmm=new THREE.Mesh(g2,cm);cmm.receiveShadow=true;grp.add(cmm);}}}
 // edge markers: posts / snow banks / stone blocks / crystals
 if(C.def.veh==='kart'||C.def.hub){const kind=T.road;const eg=kind==='sand'?merge([[new THREE.CylinderGeometry(.18,.22,1.6,6),M4(0,.8,0),0x8a6238],[new THREE.SphereGeometry(.26,8,6),M4(0,1.65,0),0xff5a3a]]):kind==='snow'?merge([[lumpy(new THREE.IcosahedronGeometry(1.1,1),.35,4),M4(0,.2,0,0,0,0,1.4,.7,1),0xf4f8ff]]):kind==='stone'?merge([[new THREE.BoxGeometry(1.2,1,1.2),M4(0,.5,0),0x8a7a62],[new THREE.BoxGeometry(.9,.25,.9),M4(0,1.1,0),0x6a9a4a]]):merge([[new THREE.OctahedronGeometry(.5,0),M4(0,.9,0,0,0,0,.6,1.6,.6),0x8af0ff]]);
  const pts=[];for(let i=0;i<B.n;i+=4){if(B.wet[i]||B.ramp[i]>0||B.ramp[(i+6)%B.n]>0)continue;if(i<10||i>B.n-6)continue;for(const sd of[-1,1]){const u=(w+2.6)*sd;pts.push([B.x[i]+B.nx[i]*u,B.y[i]-.25,B.z[i]+B.nz[i]*u,Math.atan2(B.tx[i],B.tz[i])]);}}
  const im=new THREE.InstancedMesh(eg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,emissive:kind==='crystal'?0x3a8aff:0,emissiveIntensity:kind==='crystal'?1.2:0,flatShading:kind!=='snow'}),pts.length);pts.forEach((p,k)=>im.setMatrixAt(k,M4(p[0],p[1],p[2],0,p[3],0)));im.castShadow=true;im.receiveShadow=true;grp.add(im);}
 // ramps: wedge decks
 for(const i0 of C.ramps){const len=Math.round(12/B.step),pos=[],idx=[];for(let k=0;k<=len;k++){const i=(i0+k)%B.n,h=Math.pow(k/len,1.4)*2.6;for(const u of[-w,w]){pos.push(B.x[i]+B.nx[i]*u,B.y[i]+h+.08,B.z[i]+B.nz[i]*u);}}
  for(let k=0;k<len;k++){const o=k*2;idx.push(o,o+1,o+2,o+1,o+3,o+2);}const iL=(i0+len)%B.n;for(const u of[-w,w]){pos.push(B.x[iL]+B.nx[iL]*u,B.y[iL]-.2,B.z[iL]+B.nz[iL]*u);}const e=(len+1)*2;idx.push(e-2,e,e-1,e-1,e,e+1);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const rt=ctex(64,64,(x,W,H)=>{x.fillStyle='#ffcf3a';x.fillRect(0,0,W,H);x.fillStyle='#1a1a22';for(let k=-2;k<4;k++){x.beginPath();x.moveTo(k*24,0);x.lineTo(k*24+12,0);x.lineTo(k*24+12+H,H);x.lineTo(k*24+H,H);x.fill();}});
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:rt,roughness:.5,side:THREE.DoubleSide}));m.castShadow=m.receiveShadow=true;grp.add(m);}
 // buoys along wet sections
 const wet=[];for(let i=0;i<B.n;i+=5)if(B.wet[i])for(const s of[-1,1])wet.push([B.x[i]+B.nx[i]*(w+1.5)*s,B.z[i]+B.nz[i]*(w+1.5)*s,s]);
 if(wet.length){const bg=merge([[new THREE.SphereGeometry(.7,12,8),M4(0,.3,0),0xffffff],[new THREE.CylinderGeometry(.72,.72,.3,12),M4(0,.3,0),0xff3a3a],[new THREE.CylinderGeometry(.08,.08,1.4,6),M4(0,1.1,0),0x333333],[new THREE.SphereGeometry(.2,8,6),M4(0,1.85,0),0xffe04a]]);
  const im=new THREE.InstancedMesh(bg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,emissive:0x221100}),wet.length);wet.forEach((p,k)=>im.setMatrixAt(k,M4(p[0],SEA,p[1])));im.castShadow=true;grp.add(im);}}

/* ================= props ================= */
function propGeo(kind,T){const r=rng(kind.length*31+7);
 switch(kind){
  case'palm':{const L=[];let x=0,y=0;for(let k=0;k<6;k++){L.push([new THREE.CylinderGeometry(.32-k*.03,.36-k*.03,1.5,7),M4(x,y+.75,0,0,0,-k*.06),k%2?0x8a6a44:0x7a5a38]);x+=Math.sin(k*.06)*1.5*.9+.12;y+=1.45;}
   for(let k=0;k<7;k++){const a=k/7*Math.PI*2;L.push([new THREE.ConeGeometry(.55,4.2,4),M4(x+Math.cos(a)*1.7,y-.5,Math.sin(a)*1.7,0,-a,Math.PI/2+.45,1,1,.25),k%2?0x3aa83a:0x2a9030]);}
   L.push([new THREE.SphereGeometry(.35,6,5),M4(x+.3,y-.4,.2),0x6a4a20],[new THREE.SphereGeometry(.35,6,5),M4(x-.25,y-.45,-.2),0x6a4a20]);return merge(L);}
  case'pine':{const L=[[new THREE.CylinderGeometry(.35,.5,2.2,6),M4(0,1.1,0),0x5a3a20]];for(let k=0;k<4;k++){L.push([new THREE.ConeGeometry(2.6-k*.5,2.8,8),M4(0,2.4+k*1.6,0),k%2?0x2a6a48:0x2f7a52]);if(T.snow)L.push([new THREE.ConeGeometry(1.4-k*.28,.9,8),M4(0,3.3+k*1.6,0),0xf4f8ff]);}return merge(L);}
  case'jtree':{const L=[[new THREE.CylinderGeometry(.45,.8,9,7),M4(0,4.5,0),0x6a4a2a]];for(let k=0;k<5;k++)L.push([lumpy(new THREE.IcosahedronGeometry(2.4+r()*1,1),.5,k),M4((r()-.5)*3,9+r()*2,(r()-.5)*3),[0x2a7a2a,0x3a8a24,0x226a30][k%3]]);L.push([new THREE.CylinderGeometry(.06,.06,6,4),M4(1.5,6,0),0x3a6a2a]);return merge(L);}
  case'fern':return merge([[lumpy(new THREE.IcosahedronGeometry(1.4,1),.5,2),M4(0,.8,0,0,0,0,1,.7,1),0x3a9a3a],[lumpy(new THREE.IcosahedronGeometry(1,1),.4,3),M4(1,.6,.4),0x4aaa3a],[new THREE.SphereGeometry(.25,6,5),M4(.4,1.6,.6),0xff6a8a]]);
  case'rock':return merge([[lumpy(new THREE.DodecahedronGeometry(1.6,1),.7,5),M4(0,.6,0,0,0,0,1.2,.8,1),T.snow?0x8a90a8:T.night?0x4a4a7a:0x9a8a78],[lumpy(new THREE.DodecahedronGeometry(.9,0),.4,6),M4(1.3,.3,.6),T.snow?0xa0a8c0:0x8a7a68]]);
  case'hut':return merge([[new THREE.CylinderGeometry(2,2.2,2.6,10),M4(0,1.3,0),0xd8b080],[new THREE.ConeGeometry(3.2,2.6,10),M4(0,3.8,0),0xc8a050],[new THREE.BoxGeometry(1,1.6,.2),M4(0,.8,2.1),0x5a3a20],[new THREE.ConeGeometry(.3,1,5),M4(0,5.4,0),0x8a6a30]]);
  case'flower':{const L=[];for(let k=0;k<6;k++){const a=k/6*Math.PI*2;L.push([new THREE.CylinderGeometry(.04,.04,.8,4),M4(Math.cos(a)*.8,.4,Math.sin(a)*.8),0x3a8a2a],[new THREE.SphereGeometry(.22,6,5),M4(Math.cos(a)*.8,.85,Math.sin(a)*.8),[0xff5a8a,0xffd03a,0xffffff,0xb06aff][k%4]]);}return merge(L);}
  case'ice':{const L=[];for(let k=0;k<5;k++){const a=r()*6.28,h=3+r()*5;L.push([new THREE.ConeGeometry(.6+r()*.5,h,5),M4(Math.cos(a)*1.2,h/2,Math.sin(a)*1.2,(r()-.5)*.5,0,(r()-.5)*.5),[0xaee8ff,0x8ad0ff,0xd0f4ff][k%3]]);}return merge(L);}
  case'igloo':return merge([[new THREE.SphereGeometry(3,14,8,0,Math.PI*2,0,Math.PI/2),M4(0,0,0),0xf0f6ff],[new THREE.CylinderGeometry(1.1,1.1,2,10,1,false,0,Math.PI),M4(0,.9,2.6,Math.PI/2,0,0),0xe0ecff]]);
  case'ruin':return merge([[new THREE.BoxGeometry(1.4,6,1.4),M4(-2,3,0),0x9a8a6a],[new THREE.BoxGeometry(1.4,4.5,1.4),M4(2,2.25,0),0x8a7a5a],[new THREE.BoxGeometry(5.6,1.2,1.6),M4(0,6.4,0,0,0,.08),0xa89878],[new THREE.BoxGeometry(1.2,1.2,1.2),M4(3,.6,1.5,.3,.4,0),0x8a7a5a],[lumpy(new THREE.IcosahedronGeometry(.8,0),.3,9),M4(-2,6.2,.6),0x3a8a2a]]);
  case'shroom':return merge([[new THREE.CylinderGeometry(.35,.5,3,8),M4(0,1.5,0),0xe8e0ff],[new THREE.SphereGeometry(1.8,14,8,0,Math.PI*2,0,Math.PI/2),M4(0,2.8,0,0,0,0,1,.7,1),0x60c0ff],[new THREE.CylinderGeometry(.2,.3,1.6,6),M4(1.4,.8,.6),0xe8e0ff],[new THREE.SphereGeometry(.8,10,6,0,Math.PI*2,0,Math.PI/2),M4(1.4,1.5,.6,0,0,0,1,.7,1),0xff70e0]]);
  case'crystal':{const L=[];for(let k=0;k<4;k++){const a=r()*6.28,h=2+r()*4;L.push([new THREE.OctahedronGeometry(1,0),M4(Math.cos(a)*1,h*.45,Math.sin(a)*1,(r()-.5)*.6,r(),(r()-.5)*.6,.6,h*.5,.6),[0x8a6aff,0x4ac8ff,0xff6ae0][k%3]]);}return merge(L);}
  case'lamp':return merge([[new THREE.CylinderGeometry(.12,.16,4,6),M4(0,2,0),0x2a2a3a],[new THREE.SphereGeometry(.45,10,8),M4(0,4.2,0),0xfff0a0]]);}}
function scatter(C,T,TR,grp,count){const B=C.B,r=rng((C.def.seed||1)*77),w=C.def.wd,kinds=T.props,L={};kinds.forEach(k=>L[k]=[]);
 const x0=TR.x0,z0=TR.z0,W=(TR.nx-1)*TR.cs,H=(TR.nz-1)*TR.cs;let tries=0;
 while(tries++<count*8){const x=x0+r()*W,z=z0+r()*H,d=TR.d(x,z),h=TR.h(x,z);if(h<.9||d<w+(C.def.veh==='plane'?2:7)||d>200)continue;
  const kind=kinds[d<w+30?(r()<.55?0:r()<.5?1:3):(r()*kinds.length|0)];if(kind==='hut'&&d<w+14)continue;if(kind==='lamp'&&d>w+12)continue;
  L[kind].push([x,h-.15,z,r()*6.28,.7+r()*.7]);if(Object.values(L).reduce((a,b)=>a+b.length,0)>=count)break;}
 if(T.props.includes('lamp'))for(let i=0;i<B.n;i+=14){if(B.wet[i])continue;for(const s of[-1,1]){const u=(w+3)*s,x=B.x[i]+B.nx[i]*u,z=B.z[i]+B.nz[i]*u;L.lamp.push([x,TR.h(x,z)-.1,z,0,1]);}}
 for(const k of kinds){if(!L[k].length)continue;const glow=k==='shroom'||k==='crystal'||k==='lamp'||k==='ice';
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:glow?.3:.85,metalness:0,emissive:glow?(k==='ice'?0x2a5a8a:k==='lamp'?0x8a7a30:0x5a4aff):0,emissiveIntensity:glow?(T.night?1.1:.35):0,flatShading:k==='rock'||k==='ice'||k==='crystal'||k==='ruin'});
  const im=new THREE.InstancedMesh(propGeo(k,T),m,L[k].length);L[k].forEach((p,i)=>im.setMatrixAt(i,M4(p[0],p[1],p[2],0,p[3],0,p[4])));im.castShadow=true;im.receiveShadow=true;grp.add(im);}
 return L;}
function clouds(grp,T,C,plane){const g=merge([0,1,2,3,4,5].map(k=>[new THREE.IcosahedronGeometry(1,2),M4((k-2.5)*1.6,Math.sin(k*1.7)*.5+(k%2)*.4,Math.cos(k*2.3)*.8,0,0,0,1.2+(k%3)*.4),0xffffff]));
 const n=plane?36:22,r=rng(99);const m=new THREE.MeshStandardMaterial({color:0xffffff,emissive:T.night?0x1a1a40:0x707070,emissiveIntensity:T.night?.6:.45,roughness:1,transparent:true,opacity:T.night?.55:.92,depthWrite:false});
 const im=new THREE.InstancedMesh(g,m,n);const B=C.B;for(let k=0;k<n;k++){let x,y,z;if(plane&&k<20){const i=r()*B.n|0,u=(r()<.5?-1:1)*(50+r()*60);x=B.x[i]+B.nx[i]*u;z=B.z[i]+B.nz[i]*u;y=B.y[i]+(r()-.5)*30;}
  else{const a=r()*6.28,d=250+r()*900;x=Math.cos(a)*d;z=Math.sin(a)*d;y=90+r()*90;}const s=plane&&k<20?3+r()*3:5+r()*7;im.setMatrixAt(k,M4(x,y,z,0,r()*6,0,s*1.6,s*.8,s));}
 im.renderOrder=2;grp.add(im);return im;}
function backdrop(grp,T,seed){const r=rng(seed),L=[];for(let k=0;k<26;k++){const a=k/26*Math.PI*2+r()*.2,d=1100+r()*900,h=60+r()*220,rad=120+r()*220;
  L.push([lumpy(new THREE.ConeGeometry(rad,h,9,3),rad*.12,k),M4(Math.cos(a)*d,h/2-8,Math.sin(a)*d,0,r()*6,0),T.snow?0xdde4ff:T.night?0x2a2a5a:T.key==='jungle'?0x3a5a2a:0x5a8a4a]);}
 const m=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));grp.add(m);}

/* ================= start gate ================= */
function startGate(C,grp,worldCol,label){const B=C.B,i=0,w=C.def.wd+2,plane=C.def.veh==='plane',x=B.x[i],z=B.z[i],y=B.y[i],yaw=Math.atan2(B.tx[i],B.tz[i]);
 const g=new THREE.Group();g.position.set(x,plane?y-10:y,z);g.rotation.y=yaw;const pm=mat(0x2a2a34,{r:.4,m:.4}),am=mat(new THREE.Color(worldCol).getHex(),{r:.4,e:new THREE.Color(worldCol).getHex(),ei:.25});
 const H=plane?20:8;for(const s of[-1,1]){const p1=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,H,10),pm);p1.castShadow=true;p1.position.set(s*w,H/2,0);g.add(p1);const p2=new THREE.Mesh(new THREE.SphereGeometry(.9,12,10),am);p2.position.set(s*w,H+.4,0);g.add(p2);}
 const bt=ctex(1024,128,(x2,W,Hh)=>{for(let k=0;k<32;k++)for(let j=0;j<4;j++){x2.fillStyle=(k+j)%2?'#111':'#fff';x2.fillRect(k*32,j*32,32,32);}x2.fillStyle=worldCol;x2.fillRect(240,10,544,108);x2.fillStyle='#fff';x2.font='76px Anton, Impact, sans-serif';x2.textAlign='center';x2.textBaseline='middle';x2.fillText(label,512,68);},{clamp:true});
 const ban=new THREE.Mesh(new THREE.BoxGeometry(w*2+1,2.2,.3),[pm,pm,pm,pm,new THREE.MeshStandardMaterial({map:bt,roughness:.6}),new THREE.MeshStandardMaterial({map:bt,roughness:.6})]);ban.position.y=H-1.2;ban.castShadow=true;g.add(ban);
 if(!plane){const ct=ctex(64,64,(x2,W,Hh)=>{for(let k=0;k<4;k++)for(let j=0;j<4;j++){x2.fillStyle=(k+j)%2?'#111':'#fff';x2.fillRect(k*16,j*16,16,16);}});ct.repeat.set(C.def.wd/2,.5);ct.magFilter=THREE.NearestFilter;
  const line=new THREE.Mesh(new THREE.PlaneGeometry(C.def.wd*2,2),new THREE.MeshStandardMaterial({map:ct,roughness:.7,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-4}));line.rotation.x=-Math.PI/2;line.position.y=.09;g.add(line);}
 grp.add(g);return g;}

/* ================= build everything ================= */
export function buildWorld(C,TR,T,opts={}){const grp=new THREE.Group(),B=C.B,plane=C.def.veh==='plane';
 const fogU={c:{value:col(T.fog)},d:{value:T.fogD*(plane?.75:1)}};
 const sky=makeSky(T);grp.add(sky);const sea=makeSea(T,TR,fogU);grp.add(sea);const ter=makeTerrain(T,TR);grp.add(ter);
 if(!plane)makeRoad(C,T,grp,opts.col||'#ff4d00');
 const props=scatter(C,T,TR,grp,plane?260:opts.hub?260:340);const cl3=clouds(grp,T,C,plane);backdrop(grp,T,(C.def.seed||3)*5);
 if(!opts.hub)startGate(C,grp,opts.col||'#ff4d00',C.def.n);
 // boost pads
 const bt=ctex(64,128,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=10;x.lineCap='round';for(let k=0;k<2;k++){x.beginPath();x.moveTo(10,k*64+50);x.lineTo(32,k*64+20);x.lineTo(54,k*64+50);x.stroke();}});
 const padMat=new THREE.MeshBasicMaterial({color:0xffb020,alphaMap:bt,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});bt.repeat.set(1,2);
 const pads=[];for(const p of C.boosts){const q=at(C,p.i,p.u),yaw=yawAt(C,p.i);const base=new THREE.Mesh(new THREE.PlaneGeometry(3.2,p.len),new THREE.MeshStandardMaterial({color:0x3a1a00,emissive:0xff6a00,emissiveIntensity:.4,roughness:.4,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
  base.rotation.set(-Math.PI/2,0,yaw+Math.PI);const yy=B.wet[p.i]?SEA+.08:q.y+.1;base.position.set(q.x,yy,q.z);grp.add(base);const ar=new THREE.Mesh(new THREE.PlaneGeometry(3,p.len),padMat);ar.rotation.copy(base.rotation);ar.position.set(q.x,yy+.03,q.z);grp.add(ar);pads.push(ar);}
 // item pods
 const pods=C.pods.map(p=>{const m=podMesh();const q=at(C,p.i,p.u);const gy=plane?q.y:Math.max(B.wet[p.i]?SEA:q.y,q.y);m.position.set(q.x,gy+(plane?0:1.6),q.z);grp.add(m);p.m=m;p.home=m.position.clone();return m;});
 // berries + coins
 const bIM=new THREE.InstancedMesh(berryGeo(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.25,emissive:0x5a0a1a,emissiveIntensity:.5}),C.berries.length);
 C.berries.forEach((b,k)=>{const q=at(C,b.i,b.u);b.p=new V(q.x,(plane?q.y+b.dy:Math.max(q.y,B.wet[b.i]?SEA:-99))+1,q.z);bIM.setMatrixAt(k,M4(b.p.x,b.p.y,b.p.z));});bIM.castShadow=true;grp.add(bIM);
 const cIM=new THREE.InstancedMesh(coinGeo(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.22,metalness:.55,emissive:0x8a9ab8,emissiveIntensity:.55}),C.coins.length);
 C.coins.forEach((c,k)=>{const q=at(C,c.i,c.u);c.p=new V(q.x,(plane?q.y+c.dy:Math.max(q.y,B.wet[c.i]?SEA:-99))+1.4,q.z);cIM.setMatrixAt(k,M4(c.p.x,c.p.y,c.p.z));});cIM.visible=false;grp.add(cIM);
 // rings
 const rings=C.rings.map(r=>{const m=ringMesh(r.gold,r.r);const q=at(C,r.i,0);m.position.copy(q);m.rotation.y=yawAt(C,r.i);m.rotation.x=-Math.atan(B.ty[r.i])*0;grp.add(m);r.m=m;r.p=q.clone();return m;});
 // lights
 const sunDir=new V(...T.sun).normalize();const hemi=new THREE.HemisphereLight(T.hemi[0],T.hemi[1],T.hemi[2]);grp.add(hemi);
 const sun=new THREE.DirectionalLight(T.sunC,T.sunI);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:500});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;grp.add(sun,sun.target);
 const fill=new THREE.DirectionalLight(T.sky[0],.35);fill.position.set(-sunDir.x*100,60,-sunDir.z*100);grp.add(fill);
 const W={grp,sky,sea,ter,props,clouds:cl3,pods,pads,bIM,cIM,rings,sun,sunDir,hemi,fogU,T,t:0,
  update(dt,focus){this.t+=dt;sky.material.uniforms.uT.value=this.t;sea.material.uniforms.uT.value=this.t;bt.offset.y-=dt*1.6;
   for(const p of C.pods){if(p.t>0){p.t-=dt;p.m.visible=p.t<=0;if(p.t<=0)p.m.scale.setScalar(.1);}const s=p.m.scale.x;if(s<1)p.m.scale.setScalar(Math.min(1,s+dt*3));p.m.userData.o.rotation.y+=dt*1.6;p.m.userData.o.rotation.x=Math.sin(this.t*1.3+p.i)*.3;p.m.userData.ring.rotation.z+=dt;p.m.position.y=p.home.y+Math.sin(this.t*2+p.i*.1)*.25;p.m.userData.m.emissive.setHSL((this.t*.15+p.i*.01)%1,.9,.5);}
   const tm=new THREE.Matrix4();C.berries.forEach((b,k)=>{if(b.t>0){b.t-=dt;}const s=b.t>0?0:1;bIM.setMatrixAt(k,tm.compose(new V(b.p.x,b.p.y+Math.sin(this.t*3+k)*.2,b.p.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,this.t*2+k,0)),new V(s,s,s)));});bIM.instanceMatrix.needsUpdate=true;
   if(cIM.visible){C.coins.forEach((c,k)=>{const s=c.got?0:1.2;cIM.setMatrixAt(k,tm.compose(c.p,new THREE.Quaternion().setFromEuler(new THREE.Euler(0,this.t*3+k,0)),new V(s,s,s)));});cIM.instanceMatrix.needsUpdate=true;}
   for(const r of C.rings){r.m.rotation.z+=dt*(r.gold?1.2:.5);if(r.flash>0){r.flash-=dt;const s=1+r.flash*.6;r.m.scale.setScalar(s);r.m.userData.m.emissiveIntensity=.45+r.flash*2;}else{r.m.scale.setScalar(1);r.m.userData.m.emissiveIntensity=.45;}}
   if(focus){sun.position.set(focus.x+sunDir.x*160,focus.y+sunDir.y*160+40,focus.z+sunDir.z*160);sun.target.position.copy(focus);}}};
 return W;}

/* ================= hub decorations: race doors + balloon tower ================= */
export function hubDoor(def,req,open,state,worldCol){const g=new THREE.Group();const stone=mat(0xd8c8a8,{r:.8,flat:true}),wc=new THREE.Color(worldCol).getHex(),acc=mat(wc,{r:.4,e:wc,ei:.2});
 for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(1.6,7,1.6),stone);p.position.set(s*4,3.5,0);p.castShadow=true;g.add(p);const c=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),acc);c.position.set(s*4,7.6,0);g.add(c);}
 const top=new THREE.Mesh(new THREE.BoxGeometry(10,1.6,2),stone);top.position.y=7.4;top.castShadow=true;g.add(top);
 const portal=new THREE.Mesh(new THREE.PlaneGeometry(6.4,6.6),new THREE.MeshBasicMaterial({color:open?wc:0x333344,transparent:true,opacity:open?.55:.85,side:THREE.DoubleSide,depthWrite:false}));portal.position.y=3.3;g.add(portal);
 const vIcon={kart:'KART',hover:'HOVER',plane:'PLANE'}[def.veh];
 const sign=textSprite([{t:def.n,f:'58px Anton, Impact, sans-serif',c:'#fff',y:70},{t:open?(state||vIcon):'🔒 '+req+' BALLOONS',f:'44px Anton, Impact, sans-serif',c:open?worldCol:'#ffb0a0',y:150},{t:def.boss?'BOSS RACE':vIcon,f:'34px JetBrains Mono, monospace',c:'#bbb',y:208}],{w:512,h:256,sx:8,border:worldCol});sign.position.y=11;g.add(sign);
 g.userData={portal,sign};return g;}
export {balloonMesh};
