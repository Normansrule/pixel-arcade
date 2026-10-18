// TIDEWAY COURIER — the sunny flooded harbor: sky, sea (depth-tinted from the island heightfield), islands, road,
// quay walls, the arched Tide Bridge and plank bridge, the lighthouse, the Post House landmark with its clock tower,
// pastel town houses, trees, lamps, bunting, boats, shoal buoys, numbered checkpoint gates and the parcel pads.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,lerp,sstep,rng,fbm,ctex,speckle,merge,M4,label} from './util.js';
import {SEA,LAND,ROADY,at,yawAt,runs,query} from './track.js';

const TONE='\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
const col=c=>new THREE.Color(c);
export const SKY={top:0x4fa8ef,hor:0xd6f0ff,sun:[.45,.62,.38],sunC:0xfff0d0,fog:0xcfe9f7,fogD:.0011,deep:0x157ab0,shal:0x5fe6dc};

function makeSky(){const sun=new V(...SKY.sun).normalize();const U={uTop:{value:col(SKY.top)},uHor:{value:col(SKY.hor)},uSun:{value:sun},uSunC:{value:col(SKY.sunC)},uT:{value:0}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(4000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:U,fog:false,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform vec3 uTop,uHor,uSun,uSunC;uniform float uT;varying vec3 vD;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.03;a*=.5;}return s;}
  void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(uHor,uTop,pow(smoothstep(-.02,.6,y),.65));c=mix(c,uHor*.92,smoothstep(0.,-.3,y));
   float sd=max(0.,dot(d,uSun));c+=uSunC*(pow(sd,1400.)*10.+pow(sd,50.)*.35+pow(sd,5.)*.16);
   if(y>0.){vec2 q=d.xz/(y+.12)*1.1+vec2(uT*.004,uT*.0015);float cl=smoothstep(.52,.8,fb(q))*smoothstep(0.,.18,y);c=mix(c,vec3(1.,.99,.97)+uSunC*pow(sd,3.)*.2,cl*.8);}
   gl_FragColor=vec4(c,1.);${TONE}}`}));m.renderOrder=-10;m.frustumCulled=false;m.userData.U=U;return m;}

function makeSea(T,fogU){const D=T.H;const data=new Uint8Array(D.nx*D.nz);for(let i=0;i<data.length;i++)data[i]=cl((SEA-D.H[i])/6,0,1)*255|0;
 const tex=new THREE.DataTexture(data,D.nx,D.nz,THREE.RedFormat,THREE.UnsignedByteType);tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;
 const U={uDepth:{value:tex},uBox:{value:new THREE.Vector4(D.x0,D.z0,(D.nx-1)*D.cs,(D.nz-1)*D.cs)},uT:{value:0},uDeep:{value:col(SKY.deep)},uShal:{value:col(SKY.shal)},uSky:{value:col(SKY.hor)},uSkyT:{value:col(SKY.top)},uSun:{value:new V(...SKY.sun).normalize()},uSunC:{value:col(SKY.sunC)},uFogC:fogU.c,uFogD:fogU.d,uCalm:{value:0}};
 const g=new THREE.PlaneGeometry(9000,9000,1,1);g.rotateX(-Math.PI/2);
 const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:U,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform sampler2D uDepth;uniform vec4 uBox;uniform float uT,uFogD,uCalm;uniform vec3 uDeep,uShal,uSky,uSkyT,uSun,uSunC,uFogC;varying vec3 vW;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float wv(vec2 p){return n(p*.13+vec2(uT*.13,uT*.07))*.6+n(p*.37-vec2(uT*.21,-uT*.17))*.3+n(p*1.1+vec2(uT*.5,uT*.4))*.12;}
  void main(){vec2 uv=(vW.xz-uBox.xy)/uBox.zw;float dep=(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)?6.:texture2D(uDepth,uv).r*6.;
   float e=.6,amp=1.6*(1.-uCalm*.7);float c0=wv(vW.xz),cx=wv(vW.xz+vec2(e,0.)),cz=wv(vW.xz+vec2(0.,e));vec3 N=normalize(vec3((c0-cx)*amp,1.,(c0-cz)*amp));
   vec3 V=normalize(cameraPosition-vW);float fr=.03+.97*pow(1.-max(dot(N,V),0.),5.);
   vec3 R=reflect(-V,N);vec3 sky=mix(uSky,uSkyT,smoothstep(0.,.6,R.y));
   vec3 base=mix(uShal,uDeep,smoothstep(.2,4.5,dep));base=mix(base,vec3(.93,.87,.68),(1.-smoothstep(0.,.9,dep))*.55);
   // sun-dappled caustics in the shallows
   float ca=pow(n(vW.xz*.7+vec2(uT*.4,-uT*.3))*n(vW.xz*.9-vec2(uT*.3,uT*.2)),2.)*2.;base+=vec3(.6,.9,.8)*ca*(1.-smoothstep(.5,3.,dep))*.35;
   vec3 c=mix(base,sky,fr*.7);float sp=pow(max(dot(R,uSun),0.),260.)*3.5+pow(max(dot(R,uSun),0.),30.)*.22;c+=uSunC*sp;
   float foam=(1.-smoothstep(0.,.6,dep))*(.5+.5*sin(uT*2.-dep*10.+n(vW.xz*.4)*6.));foam+=smoothstep(.66,.72,n(vW.xz*.3+uT*.05))*.1*smoothstep(3.,.8,dep);c=mix(c,vec3(1.),clamp(foam,0.,1.)*.8);
   float fd=length(cameraPosition-vW);float f=1.-exp(-uFogD*uFogD*fd*fd);c=mix(c,uFogC,clamp(f,0.,1.));
   gl_FragColor=vec4(c,1.);${TONE}}`}));m.position.y=SEA;m.userData.U=U;return m;}

function makeTerrain(T){const D=T.H,nx=D.nx,nz=D.nz,g=new THREE.BufferGeometry(),pos=new Float32Array(nx*nz*3),colr=new Float32Array(nx*nz*3),uv=new Float32Array(nx*nz*2),idx=[];
 const GR=col(0x86c95a),GR2=col(0x5fae4a),PAV=col(0xe6cfaa),PAV2=col(0xcdb08a),SAND=col(0xf1dfae),WET=col(0xcdb784),tmp=new THREE.Color();
 for(let a=0;a<nz;a++)for(let b=0;b<nx;b++){const k=a*nx+b,x=D.x0+b*D.cs,z=D.z0+a*D.cs,h=D.H[k],kind=D.K[k],nn=fbm(x*.04,z*.04,3);pos.set([x,h,z],k*3);uv.set([x*.12,z*.12],k*2);
  if(kind===1)tmp.copy(PAV).lerp(PAV2,cl(.5+nn,0,1)*.6);else tmp.copy(GR).lerp(GR2,cl(.5+nn*1.3,0,1));
  tmp.lerp(SAND,sstep(.62,.32,h));tmp.lerp(WET,sstep(.12,-.2,h));const v=.94+nn*.12;colr.set([tmp.r*v,tmp.g*v,tmp.b*v],k*3);
  if(a<nz-1&&b<nx-1){const deep=D.H[k]<-2&&D.H[k+1]<-2&&D.H[k+nx]<-2&&D.H[k+nx+1]<-2;if(!deep)idx.push(k,k+nx,k+1,k+1,k+nx,k+nx+1);}}
 g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(colr,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const det=ctex(256,256,(x,w,h)=>{speckle(x,w,h,'#d0d0d0',.16,7000,2);for(let i=0;i<180;i++){x.fillStyle=`rgba(${Math.random()<.5?40:255},${Math.random()<.5?90:255},40,.05)`;x.beginPath();x.arc(Math.random()*w,Math.random()*h,2+Math.random()*6,0,7);x.fill();}});
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:det,roughness:.95}));m.receiveShadow=true;return m;}

/* ---------- ribbons along the course ---------- */
function ribbon(T,from,to,prof,yOff,vScale=1/16){const B=T.B,n=B.n,pos=[],uvs=[],idx=[];let cnt=0;
 for(let k=from;k<=to;k++){const i=((k%n)+n)%n;for(let j=0;j<prof.length;j++){const u=typeof prof[j]==='function'?prof[j](i):prof[j],yo=typeof yOff==='function'?yOff(i,j):Array.isArray(yOff)?yOff[j]:yOff;
   pos.push(B.x[i]+B.nx[i]*u,B.y[i]+yo,B.z[i]+B.nz[i]*u);uvs.push(j/(prof.length-1),k*B.step*vScale);}cnt++;}
 for(let k=0;k<cnt-1;k++)for(let j=0;j<prof.length-1;j++){const o=k*prof.length+j;idx.push(o,o+prof.length,o+1,o+1,o+prof.length,o+prof.length+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(idx);g.computeVertexNormals();return g;}
const flip=g=>{const ix=g.index.array;for(let i=0;i<ix.length;i+=3){const t=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=t;}g.computeVertexNormals();return g;};

function roadTex(){return ctex(256,512,(x,w,h)=>{speckle(x,w,h,'#6a6670',.12,9000);for(let i=0;i<40;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.06})`;x.fillRect(Math.random()*w,Math.random()*h,30+Math.random()*60,8+Math.random()*30);}
  x.fillStyle='#f8f4ea';x.fillRect(10,0,9,h);x.fillRect(w-19,0,9,h);x.fillStyle='rgba(255,250,235,.85)';x.fillRect(w/2-3,0,6,h*.4);});}
function deckTex(){return ctex(256,256,(x,w,h)=>{for(let r=0;r<16;r++){x.fillStyle=`hsl(${26+Math.random()*8},${38+Math.random()*12}%,${40+Math.random()*10}%)`;x.fillRect(0,r*16,w,15);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,r*16+15,w,1);
  for(let k=0;k<3;k++){x.fillStyle='rgba(60,30,10,.5)';x.fillRect(((r*37+k*90)%w),r*16+6,3,3);}}x.fillStyle='#f8f4ea';x.fillRect(8,0,8,h);x.fillRect(w-16,0,8,h);});}

function buildRoad(T,grp){const B=T.B,n=B.n;
 const rt=roadTex(),rm=new THREE.MeshStandardMaterial({map:rt,roughness:.85,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 const dm=new THREE.MeshStandardMaterial({map:deckTex(),roughness:.8});
 const W=i=>B.w[i],nW=i=>-B.w[i];
 for(const[a,b]of runs(n,i=>!B.bridge[i])){const m=new THREE.Mesh(flip(ribbon(T,a-1,b+1,[W,i=>W(i)*.5,0,i=>-W(i)*.5,nW],.06)),rm);m.receiveShadow=true;grp.add(m);}
 for(const[a,b]of runs(n,i=>B.bridge[i])){const m=new THREE.Mesh(flip(ribbon(T,a-1,b+1,[W,0,nW],.06,1/10)),dm);m.receiveShadow=true;m.castShadow=true;grp.add(m);
  // deck fascia and underside
  const fas=merge([[ribbon(T,a-1,b+1,[i=>W(i)+.35,i=>W(i)+.35],[.1,-.7]),null,0xe9dcc4],[flip(ribbon(T,a-1,b+1,[i=>-W(i)-.35,i=>-W(i)-.35],[.1,-.7])),null,0xe9dcc4],[ribbon(T,a-1,b+1,[i=>W(i)+.35,i=>-W(i)-.35],-.7),null,0xb8a48a]]);
  const fm=new THREE.Mesh(fas,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide}));fm.castShadow=true;grp.add(fm);}
 // kerbs in the corners (red/white), plain stone edging elsewhere
 const kt=ctex(64,64,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#e8483a';x.fillRect(0,0,w,h/2);});kt.magFilter=THREE.NearestFilter;
 const km=new THREE.MeshStandardMaterial({map:kt,roughness:.6,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 for(const[a,b]of runs(n,i=>!B.bridge[i]&&Math.abs(B.curv[i])>.012))for(const s of[-1,1]){const g=ribbon(T,a,b,s>0?[i=>W(i)+1.1,i=>W(i)+.5,W]:[nW,i=>-W(i)-.5,i=>-W(i)-1.1],s>0?[.03,.14,.07]:[.07,.14,.03],1/4);flip(g);const m=new THREE.Mesh(g,km);m.receiveShadow=true;grp.add(m);}}

// quay walls (stone with a teal rail), bridge rails (white posts and timber), marker posts on the open beach edges
function buildEdges(T,grp,cols){const B=T.B,n=B.n,L=[],posts=[],bposts=[],mark=[];
 for(const s of[1,-1]){const wall=i=>s>0?B.wallL[i]:B.wallR[i];
  for(const[a,b]of runs(n,i=>wall(i)>0&&!B.bridge[i])){const U=i=>s*(B.w[i]+wall(i)),U2=i=>s*(B.w[i]+wall(i)+.6);
   let g=ribbon(T,a,b,[U,U],[-.2,.95],1/4);if(s<0)flip(g);L.push([g,null,0xd9c9ae]);
   L.push([ribbon(T,a,b,s>0?[U,U2]:[U2,U],1.0,1/4),null,0xf0e6d2]);
   g=ribbon(T,a,b,[U2,U2],[1.0,-.6],1/4);if(s<0)flip(g);L.push([g,null,0xc8b89c]);
   for(let i=a;i<=b;i+=3){const k=i%n,u=U(k)+s*.3;posts.push([B.x[k]+B.nx[k]*u,B.y[k]+1,B.z[k]+B.nz[k]*u]);}}
  for(const[a,b]of runs(n,i=>B.bridge[i])){const U=i=>s*(B.w[i]+B.wallL[i]);for(let i=a-1;i<=b+1;i+=2){const k=((i%n)+n)%n,u=U(k);bposts.push([B.x[k]+B.nx[k]*u,B.y[k]+.06,B.z[k]+B.nz[k]*u]);}
   let g=ribbon(T,a-1,b+1,[i=>U(i),i=>U(i)],[1.05,1.3],1/4);L.push([g,null,0xfaf6ee]);g=ribbon(T,a-1,b+1,[i=>U(i),i=>U(i)],[1.3,1.05],1/4);L.push([g,null,0xfaf6ee]);
   g=ribbon(T,a-1,b+1,[i=>U(i),i=>U(i)],[.55,.7],1/4);L.push([g,null,0xfaf6ee]);g=ribbon(T,a-1,b+1,[i=>U(i),i=>U(i)],[.7,.55],1/4);L.push([g,null,0xfaf6ee]);}
  for(const[a,b]of runs(n,i=>wall(i)===0&&!B.bridge[i]))for(let i=a;i<=b;i+=5){const k=i%n,u=s*(B.w[k]+1.8);mark.push([B.x[k]+B.nx[k]*u,B.y[k]-.1,B.z[k]+B.nz[k]*u,Math.atan2(B.tx[k],B.tz[k])]);}}
 const m=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide}));m.castShadow=true;m.receiveShadow=true;grp.add(m);
 const inst=(geo,mt,list,f)=>{const im=new THREE.InstancedMesh(geo,mt,list.length);list.forEach((p,k)=>im.setMatrixAt(k,f(p)));im.castShadow=true;im.receiveShadow=true;grp.add(im);return im;};
 const vc=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6});
 inst(merge([[new THREE.CylinderGeometry(.06,.06,.75,6),M4(0,.4,0),0x2f8f8f],[new THREE.SphereGeometry(.09,6,5),M4(0,.8,0),0x2f8f8f]]),vc,posts,p=>M4(p[0],p[1],p[2]));
 inst(merge([[new THREE.BoxGeometry(.22,1.35,.22),M4(0,.68,0),0xfaf6ee],[new THREE.BoxGeometry(.3,.12,.3),M4(0,1.4,0),0xe86a4a]]),vc,bposts,p=>M4(p[0],p[1],p[2]));
 inst(merge([[new THREE.BoxGeometry(.22,1.1,.22),M4(0,.55,0),0xfafafa],[new THREE.BoxGeometry(.24,.3,.24),M4(0,.9,0),0xe8483a]]),vc,mark,p=>M4(p[0],p[1],p[2],0,p[3],0));
 // bridge piers: stone arches standing in the water
 const P=[];for(const[a,b]of runs(n,i=>B.bridge[i])){const len=b-a;if(len>=12)for(let k=a+4;k<b-2;k+=7){const i=k%n,y=B.y[i],w=B.w[i]+.6,yaw=Math.atan2(B.tx[i],B.tz[i]);
   P.push([new THREE.BoxGeometry(w*2,y+3.2-.6,1.6),M4(B.x[i],(y-.6-3.2)/2,B.z[i],0,yaw,0),0xd7c7a8],[new THREE.BoxGeometry(w*2+.6,.5,2.2),M4(B.x[i],.1,B.z[i],0,yaw,0),0xb9a684]);}
  else for(let k=a+3;k<b-1;k+=5){const i=k%n,yaw=Math.atan2(B.tx[i],B.tz[i]);for(const s of[-1,1])P.push([new THREE.CylinderGeometry(.3,.35,4,8),M4(B.x[i]+B.nx[i]*s*(B.w[i]-.4),-1.6+B.y[i]-ROADY,B.z[i]+B.nz[i]*s*(B.w[i]-.4)),0x6a4a30]);}}
 if(P.length){const pm=new THREE.Mesh(merge(P),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}));pm.castShadow=true;pm.receiveShadow=true;grp.add(pm);}}

/* ---------- buildings ---------- */
function facadeTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.04})`;x.fillRect(Math.random()*w,Math.random()*h,6,6);}
  for(let r=0;r<2;r++)for(let c=0;c<2;c++){const X=28+c*124,Y=34+r*118;x.fillStyle='#2f4a62';x.fillRect(X,Y,76,64);x.fillStyle='#8fc6e8';x.fillRect(X+6,Y+6,30,24);x.fillRect(X+40,Y+6,30,24);x.fillStyle='rgba(143,198,232,.6)';x.fillRect(X+6,Y+34,30,24);x.fillRect(X+40,Y+34,30,24);
   x.fillStyle='#f6efe0';x.fillRect(X-4,Y+64,84,8);x.fillStyle=['#3c8f86','#d0663e','#4c6fb0'][(r+c)%3];x.fillRect(X-16,Y,12,64);x.fillRect(X+80,Y,12,64);if(r===1){x.fillStyle='#e05a7a';x.fillRect(X,Y+72,76,8);x.fillStyle='#5bb04a';x.fillRect(X+4,Y+66,68,6);}}
  x.fillStyle='rgba(0,0,0,.12)';x.fillRect(0,h-10,w,10);});}
const PASTEL=[0xf6c9a8,0xf3e3a6,0xa9dcd3,0xf5b5b0,0xc4d7f2,0xf7efe2,0xe8c4e8,0xb8e0a8];
const ROOF=[0xd8643c,0xc8502e,0x2f8f8f,0xe0823c,0x4f6fa8];
function house(L,R,x,z,yaw,w,d,h,rr,y0){const c=PASTEL[rr()*PASTEL.length|0],rc=ROOF[rr()*ROOF.length|0];
 L.push([new THREE.BoxGeometry(w,h,d),M4(x,y0+h/2,z,0,yaw,0),c]);
 const rf=new THREE.CylinderGeometry(0,1,1,4,1);rf.rotateY(Math.PI/4);R.push([rf,M4(x,y0+h+.9,z,0,yaw,0,w*.78,1.8,d*.78),rc]);
 if(rr()<.6)R.push([new THREE.BoxGeometry(.6,1.4,.6),M4(x+Math.cos(yaw)*w*.25,y0+h+1.3,z-Math.sin(yaw)*w*.25,0,yaw,0),0xb06a4a]);}
function buildTown(T,grp,cols){const B=T.B,n=B.n,rr=rng(11),L=[],R=[],D=T.H;const keep=[];
 const free=(x,z,r)=>keep.every(k=>Math.hypot(k[0]-x,k[1]-z)>k[2]+r);
 const post=T.post.i;{const d=T.drop.i;keep.push([B.x[d]+B.nx[d]*-(B.w[d]+19),B.z[d]+B.nz[d]*-(B.w[d]+19),24]);}keep.push([B.x[0],B.z[0],10]);
 const pick=T.pick.i;keep.push([B.x[pick]+B.nx[pick]*-(B.w[pick]+8),B.z[pick]+B.nz[pick]*-(B.w[pick]+8),9]);
 for(let i=0;i<n;i+=1){if(B.kindR[i]!==1||B.bridge[i])continue;if(i%5)continue;
  for(let row=0;row<2;row++){const u=-(B.w[i]+B.wallR[i]+5.5+row*9+rr()*1.5),x=B.x[i]+B.nx[i]*u,z=B.z[i]+B.nz[i]*u,hh=D.h(x,z);if(hh<.6)continue;
   const w=6+rr()*2.5,d=6+rr()*2,h=5+rr()*4+row*1.5,r=Math.max(w,d)*.62;if(!free(x,z,r))continue;
   // keep clear of the road everywhere (corners bring other parts of the loop close)
   const q=query(T,x,z,-1,{});if(Math.abs(q.u)<q.w+q.wall+r+.5)continue;keep.push([x,z,r]);
   house(L,R,x,z,Math.atan2(B.tx[i],B.tz[i]),w,d,h,rr,LAND-.1);}}
 // a few houses on the outlying islets
 const isl=[[-60,-40],[30,70],[-175,20],[120,-108],[150,45]];for(const[x,z]of isl){for(let k=0;k<3;k++){const a=rr()*6.28,d=rr()*5,X=x+Math.cos(a)*d,Z=z+Math.sin(a)*d,hh=D.h(X,Z);if(hh<.7||!free(X,Z,4))continue;keep.push([X,Z,4]);house(L,R,X,Z,rr()*6,5+rr()*2,5+rr()*2,4+rr()*3,rr,hh-.2);}}
 // flooded houses: older buildings standing in the shallows on stone plinths, with plank walkways and ivy
 const S=[],qq={};let tries=0,placed=0;while(placed<14&&tries++<4000){const x=D.x0+rr()*(D.nx-1)*D.cs,z=D.z0+rr()*(D.nz-1)*D.cs,hh=D.h(x,z);if(hh>-.35||hh<-1.8)continue;
  query(T,x,z,-1,qq);if(Math.abs(qq.u)<qq.w+10)continue;if(!free(x,z,5))continue;keep.push([x,z,5]);placed++;const yaw=rr()*6.28,w=5+rr()*2,d=5+rr()*2,h=4+rr()*3;
  S.push([new THREE.BoxGeometry(w+1.2,2.4,d+1.2),M4(x,-.8,z,0,yaw,0),0xcbb894],[new THREE.BoxGeometry(1.2,.16,6),M4(x+Math.sin(yaw)*(d/2+3.4),.45,z+Math.cos(yaw)*(d/2+3.4),0,yaw,0),0xa07a50]);
  for(const k of[-1,1])S.push([new THREE.CylinderGeometry(.12,.12,2,5),M4(x+Math.sin(yaw)*(d/2+5.5)+Math.cos(yaw)*k*.5,-.4,z+Math.cos(yaw)*(d/2+5.5)-Math.sin(yaw)*k*.5),0x6a4a30]);
  if(rr()<.7)S.push([new THREE.BoxGeometry(w*.5,h*.7,.3),M4(x+Math.cos(yaw)*w*.2+Math.sin(yaw)*(d/2+.1),.4+h*.35,z-Math.sin(yaw)*w*.2+Math.cos(yaw)*(d/2+.1),0,yaw,0),0x5a9e48]);
  house(L,R,x,z,yaw,w,d,h,rr,.4);}
 if(S.length){const sm=new THREE.Mesh(merge(S),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}));sm.castShadow=sm.receiveShadow=true;grp.add(sm);}
 const fm=new THREE.MeshStandardMaterial({vertexColors:true,map:facadeTex(),roughness:.75});const hm=new THREE.Mesh(merge(L),fm);hm.castShadow=hm.receiveShadow=true;grp.add(hm);
 const rm=new THREE.Mesh(merge(R),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,flatShading:true}));rm.castShadow=rm.receiveShadow=true;grp.add(rm);
 return keep;}

// the landmark: the Tideway Post House — a long hall with an arched gateway, a clock tower and a flag, facing the drop bay
function buildPostHouse(T,grp,anim){const B=T.B,i=T.drop.i,w=B.w[i],u=-(w+B.wallR[i]+18),x=B.x[i]+B.nx[i]*u,z=B.z[i]+B.nz[i]*u,yaw=Math.atan2(B.tx[i],B.tz[i]);
 const g=new THREE.Group();g.position.set(x,LAND-.1,z);g.rotation.y=yaw+Math.PI/2;g.scale.setScalar(1.25);grp.add(g);
 const L=[[new THREE.BoxGeometry(26,8,11),M4(0,4,0),0xf3d9b8],[new THREE.BoxGeometry(27,1,12),M4(0,8.3,0),0xfff4e2],[new THREE.BoxGeometry(27,.8,12),M4(0,.4,0),0xc9a985],
  // arcade of columns in front
  ...[-10,-6,-2,2,6,10].map(c=>[new THREE.CylinderGeometry(.45,.5,6,10),M4(c,3,6.2),0xfff4e2]),[new THREE.BoxGeometry(24,1,2),M4(0,6.4,6.4),0xfff4e2],
  // central gate block + tower
  [new THREE.BoxGeometry(9,11,12.5),M4(0,5.5,0),0xeec29a],[new THREE.BoxGeometry(5.5,10,5.5),M4(0,16,0),0xf3d9b8],[new THREE.BoxGeometry(6.4,.8,6.4),M4(0,11.3,0),0xfff4e2],[new THREE.BoxGeometry(6.2,.8,6.2),M4(0,21.2,0),0xfff4e2],
  [new THREE.BoxGeometry(4,3,4),M4(0,23,0),0xfff4e2]];
 const body=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75}));body.castShadow=body.receiveShadow=true;g.add(body);
 const rf=new THREE.CylinderGeometry(0,1,1,4,1);rf.rotateY(Math.PI/4);const rf2=rf.clone();
 const roofs=merge([[rf,M4(-9,10.2,0,0,0,0,9,3.2,8.6),0x2f8f8f],[rf2,M4(9,10.2,0,0,0,0,9,3.2,8.6),0x2f8f8f],[new THREE.ConeGeometry(4.2,7,4,1),M4(0,28,0,0,Math.PI/4,0),0xd8643c],[new THREE.SphereGeometry(.5,10,8),M4(0,31.8,0),0xffd04a]]);
 const rm=new THREE.Mesh(roofs,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,flatShading:true}));rm.castShadow=true;g.add(rm);
 // arch opening (dark) and the clock faces
 const arch=new THREE.Mesh(new THREE.CircleGeometry(3,24,0,Math.PI),new THREE.MeshStandardMaterial({color:0x3a2a30,roughness:1}));arch.position.set(0,5,6.27);g.add(arch);
 const door=new THREE.Mesh(new THREE.PlaneGeometry(6,5),arch.material);door.position.set(0,2.5,6.27);g.add(door);
 const ct=ctex(256,256,(x,w,h)=>{x.fillStyle='#fffaf0';x.beginPath();x.arc(128,128,120,0,7);x.fill();x.strokeStyle='#2a2833';x.lineWidth=10;x.stroke();for(let k=0;k<12;k++){const a=k/12*Math.PI*2;x.fillStyle='#2a2833';x.fillRect(128+Math.cos(a)*96-5,128+Math.sin(a)*96-5,10,10);}},{clamp:true});
 const cm=new THREE.MeshStandardMaterial({map:ct,transparent:true,roughness:.5,emissive:0xfff2d0,emissiveMap:ct,emissiveIntensity:.25});const hands=[];
 for(const[px,pz,ry]of[[0,2.8,0],[0,-2.8,Math.PI],[2.8,0,Math.PI/2],[-2.8,0,-Math.PI/2]]){const f=new THREE.Mesh(new THREE.CircleGeometry(1.9,24),cm);f.position.set(px,16.5,pz);f.rotation.y=ry;g.add(f);
  const hd=new THREE.Mesh(new THREE.BoxGeometry(.18,1.4,.06),new THREE.MeshStandardMaterial({color:0x2a2833}));hd.geometry.translate(0,.6,0);hd.position.set(px*1.01,16.5,pz*1.01);hd.rotation.y=ry;g.add(hd);hands.push(hd);}
 // sign over the gate
 const st=label('TIDEWAY POST',{w:1024,h:160,bg:'#2f8f8f',fg:'#fff8e6',border:'#ffd04a'});const sign=new THREE.Mesh(new THREE.PlaneGeometry(10,1.6),new THREE.MeshStandardMaterial({map:st,roughness:.5,emissive:0xffffff,emissiveMap:st,emissiveIntensity:.15}));sign.position.set(0,9.4,6.3);g.add(sign);
 // flag
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(3,1.8,8,1),new THREE.MeshStandardMaterial({color:0xff6a4d,side:THREE.DoubleSide,roughness:.7}));fl.position.set(1.7,34,0);g.add(fl);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,4,6),new THREE.MeshStandardMaterial({color:0xeeeeee}));pole.position.set(0,33,0);g.add(pole);
 const fp=fl.geometry.attributes.position,fx0=Float32Array.from(fp.array);
 anim.push(t=>{hands.forEach((h,k)=>h.rotation.z=-t*.5);for(let k=0;k<fp.count;k++){const xx=fx0[k*3];fp.setZ(k,Math.sin(t*5+xx*2)*.25*(xx+1.5)/3);}fp.needsUpdate=true;});
 return{x,z,r:16};}

function buildLighthouse(T,grp,anim){const{x,z}=T.light,y=T.H.h(x,z);const g=new THREE.Group();g.position.set(x,y-.2,z);grp.add(g);
 const L=[[new THREE.CylinderGeometry(3.6,4,1.2,16),M4(0,.6,0),0xd8cdb6]];for(let k=0;k<5;k++)L.push([new THREE.CylinderGeometry(2.3-k*.22,2.5-k*.22,3,16),M4(0,2.7+k*3,0),k%2?0xe8483a:0xfafafa]);
 L.push([new THREE.CylinderGeometry(1.9,1.9,.5,16),M4(0,16.7,0),0x2a2833],[new THREE.CylinderGeometry(1.7,1.7,.3,16),M4(0,19.4,0),0x2a2833],[new THREE.ConeGeometry(1.9,2,16),M4(0,20.5,0),0xe8483a],[new THREE.BoxGeometry(2.2,2.4,3),M4(3.6,1.6,0),0xfafafa],[new THREE.ConeGeometry(2.2,1.4,4),M4(3.6,3.5,0,0,Math.PI/4,0),0xd8643c]);
 const m=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}));m.castShadow=m.receiveShadow=true;g.add(m);
 const lamp=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,2.4,16),new THREE.MeshStandardMaterial({color:0xfff6c8,emissive:0xffe08a,emissiveIntensity:1.6,transparent:true,opacity:.85}));lamp.position.y=18;g.add(lamp);
 const beam=new THREE.Mesh(new THREE.ConeGeometry(2.4,26,16,1,true),new THREE.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));beam.rotation.z=Math.PI/2;beam.geometry.translate(0,-13,0);
 const bp=new THREE.Group();bp.position.y=18;bp.add(beam);g.add(bp);anim.push(t=>{bp.rotation.y=t*.6;});return{x,z,r:4.2};}

/* ---------- vegetation, lamps, bunting, boats, buoys ---------- */
function treeGeo(kind,seed){const r=rng(seed);
 if(kind===0){const L=[[new THREE.CylinderGeometry(.22,.32,2.2,7),M4(0,1.1,0),0x8a6040]];for(let k=0;k<4;k++)L.push([new THREE.IcosahedronGeometry(1.3+r()*.5,1),M4((r()-.5)*1.6,2.8+r()*1.2,(r()-.5)*1.6),[0x5cae48,0x6dbd52,0x4f9e44][k%3]]);return merge(L);}
 if(kind===1){const L=[];let x=0,y=0;for(let k=0;k<6;k++){L.push([new THREE.CylinderGeometry(.24-k*.02,.28-k*.02,1.3,7),M4(x,y+.65,0,0,0,-k*.07),k%2?0xa07a50:0x8c6844]);x+=Math.sin(k*.07)*1.3+.1;y+=1.25;}
  for(let k=0;k<7;k++){const a=k/7*Math.PI*2;L.push([new THREE.ConeGeometry(.5,3.6,4),M4(x+Math.cos(a)*1.5,y-.4,Math.sin(a)*1.5,0,-a,Math.PI/2+.5,1,1,.25),k%2?0x48b048:0x3a9a40]);}return merge(L);}
 const L=[];for(let k=0;k<5;k++){const a=k/5*6.28;L.push([new THREE.IcosahedronGeometry(.7+r()*.3,1),M4(Math.cos(a)*.7,.5,Math.sin(a)*.7),0x6dbd52],[new THREE.SphereGeometry(.18,6,5),M4(Math.cos(a)*.9,1,Math.sin(a)*.9),[0xff6a8a,0xffd04a,0xffffff][k%3]]);}return merge(L);}
function buildNature(T,grp,keep,cols){const B=T.B,D=T.H,r=rng(5),L=[[],[],[]],q={};const W=(D.nx-1)*D.cs,H=(D.nz-1)*D.cs;let tries=0;
 while(tries++<9000&&L[0].length+L[1].length+L[2].length<420){const x=D.x0+r()*W,z=D.z0+r()*H,h=D.h(x,z);if(h<.55)continue;
  query(T,x,z,-1,q);const d=Math.abs(q.u)-q.w;if(d<6)continue;if(q.wall>0&&d<q.wall+1)continue;if(!keep.every(k=>Math.hypot(k[0]-x,k[1]-z)>k[2]+1.5))continue;if(D.kind(x,z)===1&&r()<.75)continue;
  const kind=h<.75&&r()<.6?1:r()<.25?2:r()<.7?0:1;L[kind].push([x,h-.1,z,r()*6.28,.8+r()*.6]);if(kind<2&&d<14)cols.push({x,z,r:.55});}
 const vm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});
 L.forEach((list,k)=>{if(!list.length)return;const im=new THREE.InstancedMesh(treeGeo(k,k*13+3),vm,list.length);list.forEach((p,i)=>im.setMatrixAt(i,M4(p[0],p[1],p[2],0,p[3],0,p[4])));im.castShadow=true;im.receiveShadow=true;grp.add(im);});}
function buildLamps(T,grp){const B=T.B,n=B.n,P=[],Fl=[];for(let i=2;i<n;i+=9){if(B.bridge[i])continue;for(const s of[1,-1]){const wall=s>0?B.wallL[i]:B.wallR[i];if(!wall)continue;const u=s*(B.w[i]+wall+.25);P.push([B.x[i]+B.nx[i]*u,B.y[i]+1,B.z[i]+B.nz[i]*u]);}}
 const lg=merge([[new THREE.CylinderGeometry(.08,.12,3.6,6),M4(0,1.8,0),0x2a5a5a],[new THREE.CylinderGeometry(.24,.18,.5,8),M4(0,3.75,0),0x2a5a5a]]);
 const im=new THREE.InstancedMesh(lg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5}),P.length);P.forEach((p,k)=>im.setMatrixAt(k,M4(p[0],p[1],p[2])));im.castShadow=true;grp.add(im);
 const bm=new THREE.InstancedMesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshStandardMaterial({color:0xfff2c0,emissive:0xffd890,emissiveIntensity:1.2}),P.length);P.forEach((p,k)=>bm.setMatrixAt(k,M4(p[0],p[1]+3.45,p[2])));grp.add(bm);
 // bunting across the town straights: little triangles on a sagging line
 const tri=new THREE.BufferGeometry();tri.setAttribute('position',new THREE.Float32BufferAttribute([-.28,0,0,.28,0,0,0,-.55,0],3));tri.computeVertexNormals();
 const flags=[];const C=[0xff6a4d,0xffd04a,0x46c9a0,0x4f8fe8,0xfafafa];
 for(let i=6;i<n;i+=22){if(B.wallL[i]===0||B.wallR[i]===0||B.bridge[i])continue;const a={x:B.x[i]+B.nx[i]*(B.w[i]+1.4),z:B.z[i]+B.nz[i]*(B.w[i]+1.4)},b={x:B.x[i]-B.nx[i]*(B.w[i]+1.4),z:B.z[i]-B.nz[i]*(B.w[i]+1.4)},yaw=Math.atan2(B.tx[i],B.tz[i]);
  for(let k=0;k<=18;k++){const f=k/18,y=B.y[i]+6.2-Math.sin(f*Math.PI)*1.3;flags.push([lerp(a.x,b.x,f),y,lerp(a.z,b.z,f),yaw,C[k%5]]);}}
 const fm=new THREE.InstancedMesh(tri,new THREE.MeshStandardMaterial({roughness:.7,side:THREE.DoubleSide}),flags.length);flags.forEach((p,k)=>{fm.setMatrixAt(k,M4(p[0],p[1],p[2],0,p[3]+Math.PI/2,0));fm.setColorAt(k,col(p[4]));});grp.add(fm);
 return fm;}
function boatGeo(c){return merge([[new THREE.BoxGeometry(2.2,.8,5),M4(0,.2,0),c],[new THREE.ConeGeometry(1.1,1.6,4,1),M4(0,.2,3.2,Math.PI/2,0,0,1.4,1,.55),c],[new THREE.BoxGeometry(2.3,.18,5.1),M4(0,.65,0),0xfafafa],[new THREE.BoxGeometry(1.2,.9,1.4),M4(0,1.1,-1),0xfafafa],
 [new THREE.CylinderGeometry(.07,.07,4.5,5),M4(0,2.6,.6),0x6a5040],[new THREE.ConeGeometry(1.4,3.6,3,1),M4(.05,2.9,1.2,0,Math.PI/2,0,.05,1,1),0xfffaf0]]);}
function buildBoats(T,grp,anim){const r=rng(21),D=T.H,list=[],q={};let tries=0;while(list.length<14&&tries++<3000){const x=D.x0+r()*(D.nx-1)*D.cs,z=D.z0+r()*(D.nz-1)*D.cs;if(D.h(x,z)>-2.2)continue;query(T,x,z,-1,q);if(Math.abs(q.u)<q.w+12||Math.abs(q.u)>q.w+80)continue;
  if(list.some(b=>Math.hypot(b.x-x,b.z-z)<14))continue;list.push({x,z,yaw:r()*6.28,ph:r()*6});}
 const G=[0xff6a4d,0x2f8f8f,0xffd04a,0x4f6fa8].map(boatGeo),vm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6});
 const ms=list.map((b,k)=>{const m=new THREE.Mesh(G[k%4],vm);m.castShadow=true;m.position.set(b.x,0,b.z);m.rotation.y=b.yaw;grp.add(m);return m;});
 anim.push(t=>ms.forEach((m,k)=>{const b=list[k];m.position.y=Math.sin(t*1.3+b.ph)*.12-.1;m.rotation.z=Math.sin(t*1.1+b.ph)*.05;m.rotation.x=Math.sin(t*.9+b.ph*2)*.03;}));}
function buildShoalMarks(T,grp,anim){const B=T.B,n=B.n,P=[];for(const[a,b]of runs(n,i=>B.shoal[i]))for(let i=a+2;i<=b;i+=6){const k=i%n,u=-(B.w[k]+26);P.push([B.x[k]+B.nx[k]*u,B.z[k]+B.nz[k]*u]);}
 const bg=merge([[new THREE.SphereGeometry(.6,12,8),M4(0,.15,0),0xfafafa],[new THREE.CylinderGeometry(.62,.62,.28,12),M4(0,.15,0),0xe8483a],[new THREE.CylinderGeometry(.07,.07,1.3,6),M4(0,.9,0),0x333333],[new THREE.SphereGeometry(.18,8,6),M4(0,1.6,0),0xffd04a]]);
 const im=new THREE.InstancedMesh(bg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4}),P.length);P.forEach((p,k)=>im.setMatrixAt(k,M4(p[0],0,p[1])));im.castShadow=true;grp.add(im);
 // "SHALLOWS" boards at the edge of the sweep: tells you it is a safe run-off
 const i=T.shoalI,tex=label('SHALLOWS · SAFE RUN-OFF',{w:1024,h:128,bg:'#fff6e0',fg:'#2f6f8f',border:'#2f8f8f'});
 for(const k of[-14,0,14]){const j=(i+k+n)%n,u=-(B.w[j]+4.5),x=B.x[j]+B.nx[j]*u,z=B.z[j]+B.nz[j]*u;const g=new THREE.Group();g.position.set(x,LAND-.1,z);g.rotation.y=Math.atan2(B.tx[j],B.tz[j])+Math.PI/2;
  const s=new THREE.Mesh(new THREE.PlaneGeometry(4.8,.6),new THREE.MeshStandardMaterial({map:tex,roughness:.6,side:THREE.DoubleSide}));s.position.y=1.5;g.add(s);
  for(const sx of[-2,2]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.6,5),new THREE.MeshStandardMaterial({color:0x5a4030}));p.position.set(sx,.8,0);g.add(p);}grp.add(g);}}
function gulls(grp,anim){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-1,.25,0,0,0,.2,0,0,-.2, 0,0,.2,1,.25,0,0,0,-.2],3));g.computeVertexNormals();
 const N=14,im=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x8a9aa8,emissiveIntensity:.4,side:THREE.DoubleSide}),N),r=rng(31),B=[];
 for(let k=0;k<N;k++)B.push({cx:-120+r()*300,cz:-150+r()*200,R:20+r()*40,h:18+r()*20,sp:(.15+r()*.2)*(r()<.5?-1:1),ph:r()*6});grp.add(im);const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new V(),sc=new V();
 anim.push(t=>{B.forEach((b,k)=>{const a=b.ph+t*b.sp;v.set(b.cx+Math.cos(a)*b.R,b.h+Math.sin(t*.7+k)*2,b.cz+Math.sin(a)*b.R);const flap=1+Math.sin(t*9+k)*.35;e.set(0,-a+(b.sp>0?0:Math.PI),Math.sin(a)*.2);q.setFromEuler(e);sc.set(.9,flap*.9,.9);m.compose(v,q,sc);im.setMatrixAt(k,m);});im.instanceMatrix.needsUpdate=true;});}
function clouds(grp){const g=merge([0,1,2,3,4,5].map(k=>[new THREE.IcosahedronGeometry(1,2),M4((k-2.5)*1.5,Math.sin(k*1.7)*.4+(k%2)*.35,Math.cos(k*2.3)*.8,0,0,0,1.2+(k%3)*.4),0xffffff]));
 const n=26,r=rng(99);const m=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x9ab0c0,emissiveIntensity:.55,roughness:1,transparent:true,opacity:.95,depthWrite:false,fog:false});
 const im=new THREE.InstancedMesh(g,m,n);for(let k=0;k<n;k++){const a=r()*6.28,d=280+r()*800,s=6+r()*8;im.setMatrixAt(k,M4(Math.cos(a)*d,70+r()*80,Math.sin(a)*d,0,r()*6,0,s*1.6,s*.7,s));}im.renderOrder=2;grp.add(im);}
function backdrop(grp){const r=rng(8),L=[];for(let k=0;k<22;k++){const a=k/22*Math.PI*2+r()*.2,d=900+r()*700,h=24+r()*70,rad=70+r()*120;
  L.push([new THREE.ConeGeometry(rad,h,9,1),M4(Math.cos(a)*d,h/2-4,Math.sin(a)*d,0,r()*6,0),[0x6aa86a,0x7cb87a,0x5f9d70][k%3]],[new THREE.CylinderGeometry(rad*1.05,rad*1.12,3,9),M4(Math.cos(a)*d,-1,Math.sin(a)*d),0xead7a8]);}
 const m=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));grp.add(m);}

/* ---------- start gantry, checkpoint gates, parcel pads ---------- */
function startGate(T,grp){const B=T.B,i=0,w=B.w[i]+B.wallL[i]+.4,g=new THREE.Group();g.position.set(B.x[i],B.y[i],B.z[i]);g.rotation.y=Math.atan2(B.tx[i],B.tz[i]);grp.add(g);
 const pm=new THREE.MeshStandardMaterial({color:0x2f8f8f,roughness:.5});for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.8,7.4,.8),pm);p.position.set(s*w,3.7,0);p.castShadow=true;g.add(p);}
 const bt=ctex(1024,128,(x,W,H)=>{for(let k=0;k<32;k++)for(let j=0;j<4;j++){x.fillStyle=(k+j)%2?'#2a2833':'#fff';x.fillRect(k*32,j*32,32,32);}x.fillStyle='#ffd04a';x.fillRect(200,10,624,108);x.fillStyle='#2a2833';x.font='74px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('START · FINISH',512,68);},{clamp:true});
 const bm=new THREE.MeshStandardMaterial({map:bt,roughness:.6});const ban=new THREE.Mesh(new THREE.BoxGeometry(w*2+.8,1.9,.3),[pm,pm,pm,pm,bm,bm]);ban.position.y=6.6;ban.castShadow=true;g.add(ban);
 const ct=ctex(64,64,(x)=>{for(let k=0;k<4;k++)for(let j=0;j<4;j++){x.fillStyle=(k+j)%2?'#2a2833':'#fff';x.fillRect(k*16,j*16,16,16);}});ct.repeat.set(B.w[i]/2,.5);ct.magFilter=THREE.NearestFilter;
 const line=new THREE.Mesh(new THREE.PlaneGeometry(B.w[i]*2,2),new THREE.MeshStandardMaterial({map:ct,roughness:.7,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-4}));line.rotation.x=-Math.PI/2;line.position.y=.08;g.add(line);}
function gates(T,grp){const B=T.B,out=[];for(const cp of T.cps){if(cp.k===0)continue;const i=cp.i,w=B.w[i],yaw=Math.atan2(B.tx[i],B.tz[i]);
  const tex=ctex(128,128,(x,W,H)=>{x.fillStyle='#fff8e8';x.beginPath();x.arc(64,64,60,0,7);x.fill();x.lineWidth=8;x.strokeStyle='#2a2833';x.stroke();x.fillStyle='#2a2833';x.font='84px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(cp.k),64,70);},{clamp:true});
  const bm=new THREE.MeshStandardMaterial({map:tex,roughness:.5,transparent:true,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.15,side:THREE.DoubleSide});
  const g=new THREE.Group();g.position.set(B.x[i],B.y[i],B.z[i]);g.rotation.y=yaw;grp.add(g);const flagM=new THREE.MeshStandardMaterial({color:0xffd04a,roughness:.6,side:THREE.DoubleSide,emissive:0x000000});
  for(const s of[-1,1]){const u=s*(w+(s>0?B.wallL[i]:B.wallR[i])+.9);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,5,6),new THREE.MeshStandardMaterial({color:0xfafafa}));pole.position.set(u,2.5,0);g.add(pole);
   const b=new THREE.Mesh(new THREE.CircleGeometry(.9,24),bm);b.position.set(u,5.4,0);b.rotation.y=Math.PI;g.add(b);const f=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.8),flagM);f.position.set(u-s*.75,4.1,0);g.add(f);}
  // a strip of flags over the road so the gate line reads
  const tri=new THREE.BufferGeometry();tri.setAttribute('position',new THREE.Float32BufferAttribute([-.3,0,0,.3,0,0,0,-.5,0],3));tri.computeVertexNormals();
  const N=12,im=new THREE.InstancedMesh(tri,flagM,N);for(let k=0;k<N;k++){const f=(k+.5)/N,x=lerp(-w-.9,w+.9,f);im.setMatrixAt(k,M4(x,5.2-Math.sin(f*Math.PI)*.6,0));}g.add(im);
  out.push({g,flagM,cp});}
 return out;}
function padMesh(T,pad,kind){const B=T.B,n=B.n,i0=pad.i,len=pad.len,u0=pad.side*pad.u0;const pos=[],uv=[],idx=[];
 for(let k=-1;k<=len;k++){const i=(i0+k+n)%n,u1=pad.side*B.w[i];for(const[j,u]of[[0,u0],[1,u1]]){pos.push(B.x[i]+B.nx[i]*u,B.y[i]+.1,B.z[i]+B.nz[i]*u);uv.push(j,(k+1)/(len+1));}}
 for(let k=0;k<len+1;k++){const o=k*2;idx.push(o,o+2,o+1,o+1,o+2,o+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const word=kind==='pick'?'PICK UP':'DROP';const c=kind==='pick'?'#ffd04a':'#46e0b0';
 const tex=ctex(128,512,(x,w,h)=>{x.fillStyle=c;x.fillRect(0,0,w,h);x.fillStyle='rgba(42,40,51,.85)';for(let k=-4;k<12;k++){x.beginPath();x.moveTo(0,k*48);x.lineTo(w,k*48+40);x.lineTo(w,k*48+64);x.lineTo(0,k*48+24);x.fill();}
  x.fillStyle=c;x.fillRect(10,140,w-20,232);x.save();x.translate(w/2,h/2);x.rotate(-Math.PI/2);x.fillStyle='#2a2833';x.font='64px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(word,0,4);x.restore();},{clamp:true});
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:tex,roughness:.6,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.25,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,side:THREE.DoubleSide}));m.receiveShadow=true;
 // floating marker: a beam of light, a spinning parcel and a word board
 const mid=(i0+(len>>1))%n,um=pad.side*(pad.u0+B.w[mid])/2,mk=new THREE.Group();mk.position.set(B.x[mid]+B.nx[mid]*um,B.y[mid],B.z[mid]+B.nz[mid]*um);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.6,14,20,1,true),new THREE.MeshBasicMaterial({color:kind==='pick'?0xffe27a:0x7affd0,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));beam.position.y=7;mk.add(beam);
 const box=new THREE.Mesh(merge([[new THREE.BoxGeometry(1.4,1,1.1),M4(),0xd9a25c],[new THREE.BoxGeometry(1.42,1.02,.22),M4(),0xfff1c8],[new THREE.BoxGeometry(.22,1.02,1.12),M4(),0xfff1c8]]),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,emissive:0x3a2a10}));box.position.y=4.2;box.castShadow=true;mk.add(box);
 const arrow=new THREE.Mesh(new THREE.ConeGeometry(.6,1.1,4),new THREE.MeshStandardMaterial({color:kind==='pick'?0xffd04a:0x46e0b0,emissive:kind==='pick'?0xffb020:0x20c090,emissiveIntensity:.6}));arrow.rotation.x=Math.PI;arrow.position.y=2.6;mk.add(arrow);
 const wt=label(kind==='pick'?'PARCELS':'DELIVER',{w:512,h:128,bg:kind==='pick'?'#ffd04a':'#46e0b0',fg:'#2a2833'});const wb=new THREE.Sprite(new THREE.SpriteMaterial({map:wt,depthWrite:false}));wb.scale.set(4,1,1);wb.position.y=6.2;mk.add(wb);
 return{m,mk,box,beam,arrow,on:true};}
function buildDepot(T,grp){const B=T.B,i=T.pick.i,u=-(B.w[i]+B.wallR[i]+6),x=B.x[i]+B.nx[i]*u,z=B.z[i]+B.nz[i]*u,yaw=Math.atan2(B.tx[i],B.tz[i]);const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;grp.add(g);
 const L=[[new THREE.BoxGeometry(14,.5,9),M4(0,.75,0),0xb08458]];for(const px of[-6,-2,2,6])for(const pz of[-3.6,3.6])L.push([new THREE.CylinderGeometry(.25,.25,3,6),M4(px,-.8,pz),0x6a4a30]);
 L.push([new THREE.BoxGeometry(7,4,5),M4(-2,3,.5),0xa9dcd3],[new THREE.BoxGeometry(8,.4,6),M4(-2,5.2,.5),0xd8643c]);
 for(let k=0;k<6;k++)L.push([new THREE.BoxGeometry(1.2,.9,1),M4(3+(k%3)*1.3,1.45+(k>2?.9:0),-2+(k%2)*.3),0xd9a25c]);
 L.push([new THREE.CylinderGeometry(.18,.18,8,6),M4(5,4.8,2.5),0x2f8f8f],[new THREE.BoxGeometry(.3,.3,6),M4(5,8.6,0),0x2f8f8f]);
 const m=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7}));m.castShadow=m.receiveShadow=true;g.add(m);
 const st=label('BREAKWATER DEPOT',{w:1024,h:128,bg:'#fff6e0',fg:'#2a2833',border:'#d8643c'});const s=new THREE.Mesh(new THREE.PlaneGeometry(6.6,.82),new THREE.MeshStandardMaterial({map:st,roughness:.6}));s.position.set(-2,4.2,3.02);g.add(s);
 s.rotation.y=0;const s2=s.clone();s2.position.z=-2.02;s2.rotation.y=Math.PI;g.add(s2);}

/* ---------- build everything ---------- */
export function buildWorld(T){const grp=new THREE.Group(),anim=[],cols=[];
 const fogU={c:{value:col(SKY.fog)},d:{value:SKY.fogD}};
 const sky=makeSky();grp.add(sky);const sea=makeSea(T,fogU);grp.add(sea);grp.add(makeTerrain(T));
 buildRoad(T,grp);buildEdges(T,grp,cols);const keep=buildTown(T,grp,cols);
 const ph=buildPostHouse(T,grp,anim);const lh=buildLighthouse(T,grp,anim);cols.push({x:lh.x,z:lh.z,r:lh.r});keep.push([lh.x,lh.z,8]);
 buildDepot(T,grp);buildNature(T,grp,keep,cols);const bunting=buildLamps(T,grp);buildBoats(T,grp,anim);buildShoalMarks(T,grp,anim);gulls(grp,anim);clouds(grp);backdrop(grp);startGate(T,grp);
 const gts=gates(T,grp);const pads={pick:padMesh(T,T.pick,'pick'),drop:padMesh(T,T.drop,'drop')};for(const p of Object.values(pads)){grp.add(p.m,p.mk);}
 // collider grid for the props near the road
 const G=new Map(),key=(x,z)=>(Math.floor(x/8)+1000)*4000+Math.floor(z/8)+1000;for(const c of cols){for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const k=key(c.x+a*8,c.z+b*8);if(!G.has(k))G.set(k,[]);const l=G.get(k);if(!l.includes(c))l.push(c);}}
 const near=(x,z)=>G.get(key(x,z))||[];
 // lights
 const sunDir=new V(...SKY.sun).normalize();const hemi=new THREE.HemisphereLight(0xcfeaff,0xc8b48a,1.0);grp.add(hemi);
 const sun=new THREE.DirectionalLight(SKY.sunC,3.0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:400});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;grp.add(sun,sun.target);
 const fill=new THREE.DirectionalLight(0x9fd0ff,.45);fill.position.set(-sunDir.x*100,60,-sunDir.z*100);grp.add(fill);
 const W={grp,sky,sea,sun,sunDir,hemi,fogU,pads,gates:gts,cols:near,post:ph,t:0,
  update(dt,focus){this.t+=dt;const t=this.t;for(const a of anim)a(t,dt);sky.material.uniforms.uT.value=t;sea.material.uniforms.uT.value=t;
   for(const p of Object.values(pads)){p.mk.visible=p.on;if(!p.on)continue;p.box.rotation.y+=dt*1.4;p.box.position.y=4.2+Math.sin(t*2.2)*.3;p.arrow.position.y=2.4+Math.sin(t*4)*.25;p.beam.material.opacity=.14+Math.sin(t*3)*.05;}
   if(focus){sun.position.set(focus.x+sunDir.x*150,focus.y+sunDir.y*150,focus.z+sunDir.z*150);sun.target.position.copy(focus);}}};
 return W;}
