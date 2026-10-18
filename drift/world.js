// SIDEWAYS — world building for the four venues: road ribbons, guardrails, barriers, terrain, city, harbour, circuit dressing,
// lamps (pooled real lights + glow decals), skies, environment maps.
import * as THREE from '../vendor/three.module.min.js';
import {sampleTrack,clipPoints,lotLayout,nearestGlobal,frame} from './trackdata.js';
import {ctex,merge,M4,cl,lerp,smooth,fbm,seeded,vnoise,C} from './util.js';
import {Mirror,reflective} from './fx.js';
const V=THREE.Vector3;

// time of day. sky: zenith / horizon / ground colours (linear HDR), sun colour + direction, cloud cover + type, haze
export const TIMES={
 day:{fog:0xa9bccb,fogD:.0013,amb:[0xbfd8ff,0x6a5d4c,.95],sun:[0xfff1dc,3.4],sunPos:[-260,330,-180],exposure:.78,smokeAmb:[.5,.52,.56],lampCol:0xfff0d8,lampsOn:0,headI:0,wet:0,
  sky:{zen:[.16,.36,.86],hor:[.78,.86,.95],gnd:[.42,.44,.42],sun:[3.2,2.95,2.6],cloud:.42,ctype:0,lit:[1.25,1.22,1.18],dark:[.55,.6,.7],size:.0006,night:0}},
 sunset:{fog:0xd08a60,fogD:.0019,amb:[0xffb080,0x3a2a2a,.75],sun:[0xffa060,2.4],sunPos:[-420,70,-260],exposure:.92,smokeAmb:[.62,.48,.42],lampCol:0xffd8a0,lampsOn:1,headI:.35,wet:0,
  sky:{zen:[.1,.17,.42],hor:[1.15,.6,.3],gnd:[.32,.2,.16],sun:[4,1.9,.75],cloud:.5,ctype:1,lit:[1.6,.75,.42],dark:[.32,.16,.2],size:.0011,night:0}},
 night:{fog:0x070b16,fogD:.0042,amb:[0x3a4a78,0x0c0c10,.32],sun:[0x9ab0ff,.55],sunPos:[-160,220,120],exposure:1.05,smokeAmb:[.07,.08,.12],lampCol:0xffa04a,lampsOn:1,headI:1,wet:.22,
  sky:{zen:[.004,.008,.025],hor:[.05,.055,.085],gnd:[.02,.02,.025],sun:[.5,.55,.7],cloud:.35,ctype:0,lit:[.09,.07,.07],dark:[.012,.014,.022],size:0,night:1}},
 rain:{fog:0x141a22,fogD:.0075,amb:[0x5a6a80,0x101214,.42],sun:[0xa8b8d0,.3],sunPos:[120,200,-80],exposure:1.1,smokeAmb:[.12,.13,.15],lampCol:0xffb060,lampsOn:1,headI:1,wet:1,
  sky:{zen:[.04,.05,.065],hor:[.12,.135,.16],gnd:[.04,.045,.05],sun:[.2,.2,.22],cloud:.97,ctype:2,lit:[.17,.18,.2],dark:[.05,.055,.065],size:0,night:1}}};
export const TOD_KEYS=['day','sunset','night'];

/* ---------- sky: analytic scattering gradient, sun disc + glow, procedural cloud deck ---------- */
const SKY_FRAG=`uniform vec3 uSunDir,uSunCol,uZen,uHor,uGnd,uLit,uDark;uniform float uCloud,uType,uSize,uNight,uT;varying vec3 vP;
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
 void main(){vec3 d=normalize(vP);float h=d.y,hh=max(h,0.);
  vec3 c=mix(uHor,uZen,pow(hh,.42));
  float sd=max(dot(d,uSunDir),0.);
  c+=uSunCol*(pow(sd,5.)*.22+pow(sd,40.)*.35+pow(sd,400.)*.6)*(1.-.5*hh);
  c=mix(c,uHor*1.08,exp(-hh*18.)*.55);
  if(uSize>0.)c+=uSunCol*smoothstep(1.-uSize,1.-uSize*.55,sd)*14.;
  if(h>0.){vec2 uv=d.xz/(h+.12);uv*=uType==1.?vec2(.35,1.6):vec2(.7);uv+=uT*.004;
   float cv=fbm(uv*1.3+3.1);float cov=uCloud;float a=smoothstep(1.-cov*.85,1.-cov*.85+.28,cv)*smoothstep(0.,.1,h);
   if(uType==2.)a=.75+.25*smoothstep(.3,.7,cv);
   float c2=fbm((uv+uSunDir.xz*.08)*1.3+3.1);float lit=clamp((cv-c2)*5.+.55,0.,1.);
   vec3 cc=mix(uDark,uLit,lit)+uSunCol*pow(sd,6.)*.5*(1.-lit*.4);
   c=mix(c,cc,a*.92);}
  if(uNight>.5){c+=vec3(.16,.09,.04)*exp(-hh*10.)*.6;}
  c=mix(c,uGnd,smoothstep(0.,-.06,h));
  gl_FragColor=vec4(c,1.);}`;
function skyUniforms(time){const s=time.sky,v=a=>new THREE.Color(a[0],a[1],a[2]);
 return{uSunDir:{value:new V(...time.sunPos).normalize()},uSunCol:{value:v(s.sun)},uZen:{value:v(s.zen)},uHor:{value:v(s.hor)},uGnd:{value:v(s.gnd)},uLit:{value:v(s.lit)},uDark:{value:v(s.dark)},
  uCloud:{value:s.cloud},uType:{value:s.ctype},uSize:{value:s.size},uNight:{value:s.night},uT:{value:0}};}
function skyMesh(time){const U=skyUniforms(time);
 const m=new THREE.Mesh(new THREE.SphereGeometry(2600,48,24),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vP;void main(){vP=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',fragmentShader:SKY_FRAG}));m.renderOrder=-10;m.frustumCulled=false;m.userData.U=U;return m;}
function stars(n=1800){const p=[];const r=seeded(7);for(let i=0;i<n;i++){const a=r()*6.283,e=Math.asin(.06+r()*.94),R=2400;p.push(Math.cos(a)*Math.cos(e)*R,Math.sin(e)*R,Math.sin(a)*Math.cos(e)*R);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0xcfd8ff,size:1.5,sizeAttenuation:false,fog:false,transparent:true,opacity:.85}));}
function moon(){const t=ctex(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.36,'rgba(240,244,255,1)');g.addColorStop(.42,'rgba(160,180,255,.25)');g.addColorStop(1,'rgba(80,100,200,0)');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.fillStyle='rgba(150,160,190,.35)';for(const[a,b,r]of[[.42,.44,.07],[.55,.52,.05],[.48,.58,.04],[.58,.42,.03]]){x.beginPath();x.arc(w*a,h*b,w*r,0,7);x.fill();}},{clamp:true});
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,color:new THREE.Color(2.2,2.2,2.4),fog:false,depthWrite:false}));s.scale.set(260,260,1);s.position.set(-900,1300,700);return s;}

/* ---------- environment map for paint reflections (same sky, lamp cards, ground) ---------- */
function envMap(R,time){const s=new THREE.Scene();s.add(skyMesh(time));
 if(time.lampsOn){const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(time.lampCol).multiplyScalar(time.night?6:time.sky.night?6:1.2),side:THREE.DoubleSide});
  for(let i=0;i<10;i++){const a=i/10*6.283,m=new THREE.Mesh(new THREE.PlaneGeometry(40,14),lm);m.position.set(Math.cos(a)*300,90+i%3*30,Math.sin(a)*300);m.lookAt(0,0,0);s.add(m);}}
 // a ring of dark treeline/buildings on the horizon so reflections have a believable lower half
 const ring=new THREE.Mesh(new THREE.CylinderGeometry(900,900,120,32,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(...time.sky.gnd).multiplyScalar(.6),side:THREE.BackSide}));ring.position.y=40;s.add(ring);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshBasicMaterial({color:new THREE.Color(...time.sky.gnd).multiplyScalar(.5)}));fl.rotation.x=-Math.PI/2;fl.position.y=-5;s.add(fl);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.02,1,5000);pm.dispose();return rt.texture;}

/* ---------- textures (baked once per venue, cached by kind) ---------- */
const TEXC={};
// aggregate normal map: packed stones + fines, turned into a tangent-space normal map from a height field
function aggregateNormal(){if(TEXC.agg)return TEXC.agg.clone();const N=512,r=seeded(4242),H=new Float32Array(N*N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++)H[j*N+i]=fbm(i/9,j/9,3)*.35+r()*.18;
 for(let k=0;k<5200;k++){const cx=r()*N,cy=r()*N,rr=1.2+r()*r()*5.5,hgt=.5+r()*.6;const x0=Math.floor(cx-rr),x1=Math.ceil(cx+rr),y0=Math.floor(cy-rr),y1=Math.ceil(cy+rr);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const d=((x-cx)**2+(y-cy)**2)/(rr*rr);if(d>1)continue;const xi=(x+N)%N,yi=(y+N)%N;H[yi*N+xi]=Math.max(H[yi*N+xi],hgt*Math.sqrt(1-d));}}
 const t=ctex(N,N,x=>{const id=x.createImageData(N,N),d=id.data;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const L=H[j*N+(i-1+N)%N],Rr=H[j*N+(i+1)%N],U=H[((j-1+N)%N)*N+i],D=H[((j+1)%N)*N+i];
   let nx=(L-Rr)*2.2,ny=(U-D)*2.2,nz=1;const l=Math.hypot(nx,ny,nz);const k=(j*N+i)*4;d[k]=(nx/l*.5+.5)*255;d[k+1]=(ny/l*.5+.5)*255;d[k+2]=(nz/l*.5+.5)*255;d[k+3]=255;}x.putImageData(id,0,0);},{srgb:false});
 TEXC.agg=t;return t;}
// road albedo + roughness: multi-tone aggregate, tar snakes, patch repairs, polished wheel paths, worn paint
function asphaltTex(kind){const c=TEXC['a'+kind];if(c)return{map:c.map.clone(),rough:c.rough.clone()};const W=512,H=1024,r=seeded(kind.length*97+3),base=kind==='docks'?[58,59,61]:kind==='ring'?[46,46,48]:[44,44,46];
 const tar=[],patch=[];for(let i=0;i<10;i++){let px=r()*W,py=r()*H;const pts=[[px,py]];for(let k=0;k<14;k++){px+=(r()-.5)*36;py+=(r()-.5)*50;pts.push([px,py]);}tar.push(pts);}
 for(let i=0;i<9;i++)patch.push([r()*W,r()*H,40+r()*170,40+r()*220,r()<.5?-1:1]);
 const map=ctex(W,H,(x)=>{x.fillStyle=`rgb(${base})`;x.fillRect(0,0,W,H);
  const id=x.getImageData(0,0,W,H),d=id.data;for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=(j*W+i)*4;let n=(fbm(i/40,j/40,4)-.5)*24+(r()-.5)*22;if(r()<.05)n+=18+r()*26;if(r()<.03)n-=14;
   // darker rubbered wheel paths + lighter, oil-stained centre
   const u=i/W,wp=Math.exp(-(((u-.3)/.07)**2))+Math.exp(-(((u-.7)/.07)**2));n-=wp*8;if(kind!=='ring')n+=Math.exp(-(((u-.5)/.05)**2))*-4;
   d[k]+=n;d[k+1]+=n;d[k+2]+=n*1.02;}x.putImageData(id,0,0);
  for(const[px,py,w,h,s]of patch){x.fillStyle=s<0?'rgba(10,10,12,.22)':'rgba(120,120,118,.10)';x.fillRect(px,py,w,h);x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=1.5;x.strokeRect(px,py,w,h);}
  x.strokeStyle='rgba(6,6,8,.62)';x.lineCap='round';for(const pts of tar){x.lineWidth=2+r()*3;x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.stroke();}
  x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1;for(let i=0;i<30;i++){let px=r()*W,py=r()*H;x.beginPath();x.moveTo(px,py);for(let k=0;k<7;k++){px+=(r()-.5)*24;py+=(r()-.5)*24;x.lineTo(px,py);}x.stroke();}
  const paint=(col,a,fn)=>{x.fillStyle=col;fn();// wear: punch random holes in the paint
   };
  const worn=(cx,cy,w,h,col)=>{x.fillStyle=col;x.fillRect(cx,cy,w,h);x.fillStyle=`rgb(${base})`;for(let i=0;i<w*h/22;i++){x.globalAlpha=.25+r()*.5;x.fillRect(cx+r()*w,cy+r()*h,1+r()*2,1+r()*2);}x.globalAlpha=1;};
  if(kind==='pass'){worn(10,0,9,H,'rgba(236,236,226,.9)');worn(W-19,0,9,H,'rgba(236,236,226,.9)');for(let j=0;j<H;j+=128){worn(W/2-12,j,8,72,'rgba(240,190,40,.92)');worn(W/2+4,j,8,72,'rgba(240,190,40,.92)');}}
  if(kind==='docks'){worn(16,0,12,H,'rgba(230,190,40,.8)');worn(W-28,0,12,H,'rgba(230,190,40,.8)');for(let j=0;j<H;j+=256)worn(W/2-5,j,10,130,'rgba(220,220,220,.55)');}
  if(kind==='ring'){for(let i=0;i<40;i++){x.fillStyle=`rgba(0,0,0,${.05+r()*.1})`;const cx=W*.3+r()*W*.4;x.fillRect(cx,0,8+r()*20,H);}worn(6,0,10,H,'rgba(240,240,240,.88)');worn(W-16,0,10,H,'rgba(240,240,240,.88)');}
  // old rubber: donut arcs and lateral drift streaks laid down by earlier sessions
  x.lineCap='butt';for(let i=0;i<(kind==='ring'?26:12);i++){x.strokeStyle=`rgba(5,5,6,${.08+r()*.14})`;x.lineWidth=5+r()*4;const cx=W*.2+r()*W*.6,cy=r()*H,rr=60+r()*240,a0=r()*6.28;
   for(const o of[0,26]){x.beginPath();x.arc(cx+o,cy,rr,a0,a0+.4+r()*.9);x.stroke();}}
 });
 const rough=ctex(W,H,(x)=>{x.fillStyle=kind==='docks'?'#7a7a7a':'#cfcfcf';x.fillRect(0,0,W,H);
  const id=x.getImageData(0,0,W,H),d=id.data;for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=(j*W+i)*4,u=i/W;const wp=Math.exp(-(((u-.3)/.07)**2))+Math.exp(-(((u-.7)/.07)**2));const n=(r()-.5)*9-wp*26;d[k]+=n;d[k+1]+=n;d[k+2]+=n;}x.putImageData(id,0,0);
  x.strokeStyle='rgba(20,20,20,.8)';x.lineCap='round';for(const pts of tar){x.lineWidth=3+r()*3;x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.stroke();}
  if(kind==='docks'||kind==='lot'){for(let i=0;i<70;i++){const cx=r()*W,cy=r()*H,rr=20+r()*90;const g=x.createRadialGradient(cx,cy,0,cx,cy,rr);g.addColorStop(0,'rgba(78,78,78,.95)');g.addColorStop(.7,'rgba(84,84,84,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.save();x.translate(cx,cy);x.scale(1,1.8);x.translate(-cx,-cy);x.fillRect(cx-rr,cy-rr,rr*2,rr*2);x.restore();}}},{srgb:false});
 return TEXC['a'+kind]={map,rough};}
function noiseTex(c1,c2,scale=40,size=256){const key=c1+c2+scale+size;if(TEXC[key])return TEXC[key].clone();return TEXC[key]=ctex(size,size,(x,w,h)=>{const id=x.createImageData(w,h),d=id.data,a=new THREE.Color(c1),b=new THREE.Color(c2);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const t=fbm(i/scale,j/scale,5);const k=(j*w+i)*4;d[k]=(a.r+(b.r-a.r)*t)*255;d[k+1]=(a.g+(b.g-a.g)*t)*255;d[k+2]=(a.b+(b.b-a.b)*t)*255;d[k+3]=255;}x.putImageData(id,0,0);});}
// generic bumpy detail normal (grass, soil, rock, concrete)
function detailNormal(key,scale=6,amp=2){if(TEXC['n'+key])return TEXC['n'+key].clone();const N=256,r=seeded(key.length*13+7),H=new Float32Array(N*N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++)H[j*N+i]=fbm(i/scale,j/scale,4)+(key==='grass'?r()*.5:r()*.15);
 return TEXC['n'+key]=ctex(N,N,x=>{const id=x.createImageData(N,N),d=id.data;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const L=H[j*N+(i-1+N)%N],Rr=H[j*N+(i+1)%N],U=H[((j-1+N)%N)*N+i],D=H[((j+1)%N)*N+i];
  let nx=(L-Rr)*amp,ny=(U-D)*amp,nz=1;const l=Math.hypot(nx,ny,nz);const k=(j*N+i)*4;d[k]=(nx/l*.5+.5)*255;d[k+1]=(ny/l*.5+.5)*255;d[k+2]=(nz/l*.5+.5)*255;d[k+3]=255;}x.putImageData(id,0,0);},{srgb:false});}

/* ---------- ribbon helpers ---------- */
// sweep a profile [{o (metres past the wall line or offset), y, v}] along one side of the track. base: 'wall' (wl/wr) | 'edge' (hw) | 'centre'
function sweep(B,side,prof,base='wall',every=1,opt={}){const pos=[],uv=[],idx=[],n=B.n,nP=prof.length;let rows=0;
 for(let i=0;i<=n;i+=every){const k=i%n,b=base==='wall'?(side>0?B.wl[k]:B.wr[k]):base==='edge'?B.hw[k]:0;
  for(const q of prof){const lat=side*(b+q.o);pos.push(B.x[k]+B.nx[k]*lat,B.y[k]+q.y,B.z[k]+B.nz[k]*lat);const uu=(i===n?B.len:B.s[k])/(opt.uScale||4);uv.push(opt.flip&&side<0?-uu:uu,q.v);}rows++;}
 for(let i=0;i<rows-1;i++)for(let j=0;j<nP-1;j++){const a=i*nP+j,b=a+nP;if(opt.skip&&opt.skip(i*every%n))continue;side>0?idx.push(a,a+1,b,a+1,b+1,b):idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function roadGeo(B,lo,hi,uDiv){// strip from lateral lo(i) to hi(i) (functions), u across 0..1, v = s/uDiv
 const pos=[],uv=[],idx=[],n=B.n;for(let i=0;i<=n;i++){const k=i%n,s=i===n?B.len:B.s[k];for(const[f,u]of[[lo,0],[hi,1]]){const lat=f(k);pos.push(B.x[k]+B.nx[k]*lat,B.y[k]+.002,B.z[k]+B.nz[k]*lat);uv.push(u,s/uDiv);}}
 for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function inside(B,x,z){let c=false;for(let i=0,j=B.n-1;i<B.n;j=i++){if((B.z[i]>z)!==(B.z[j]>z)&&x<(B.x[j]-B.x[i])*(z-B.z[i])/(B.z[j]-B.z[i])+B.x[i])c=!c;}return c;}

/* ---------- lamps ---------- */
function lampHeads(list,time,group){if(!list.length)return;const col=time.lampCol,on=time.lampsOn;const g=new THREE.SphereGeometry(.42,10,6);g.scale(1.6,.45,1);
 const m=new THREE.InstancedMesh(g,on?new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(5.5),fog:true}):new THREE.MeshStandardMaterial({color:0xd8dde4,roughness:.15,metalness:.2}),list.length);const M=new THREE.Matrix4();
 list.forEach((l,i)=>{M.makeTranslation(l.x,l.y,l.z);m.setMatrixAt(i,M);});group.add(m);if(!on)return;
 // soft glow pools on the ground under each lamp
 const t=ctex(128,128,(x,w,h)=>{const gg=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gg.addColorStop(0,'rgba(255,255,255,.9)');gg.addColorStop(.45,'rgba(255,255,255,.32)');gg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gg;x.fillRect(0,0,w,h);},{clamp:true,srgb:false});
 const pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);const pm=new THREE.InstancedMesh(pg,new THREE.MeshBasicMaterial({map:t,color:new THREE.Color(col).multiplyScalar(.22),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4}),list.length);
 list.forEach((l,i)=>{M.compose(new V(l.gx??l.x,(l.gy??0)+.05,l.gz??l.z),new THREE.Quaternion(),new V(l.pool||22,1,l.pool||22));pm.setMatrixAt(i,M);});pm.renderOrder=2;group.add(pm);}

/* ================= public: build a venue ================= */
export function buildWorld(R,def,q=2,tod){const key=TIMES[tod]?tod:def.time,time=TIMES[key]||TIMES.night,group=new THREE.Group(),out={def,group,time,tod:key,lamps:[],clips:[],hideRefl:[],mirror:null,update:null,colliders:null,q};
 const lampCol=time.lampCol;
 out.sky=skyMesh(time);group.add(out.sky);if(key==='night'){group.add(stars());group.add(moon());}if(key==='rain'){const s=stars(300);s.material.opacity=.15;group.add(s);}
 out.env=envMap(R,time);
 out.fog=new THREE.FogExp2(time.fog,time.fogD);
 const hemi=new THREE.HemisphereLight(time.amb[0],time.amb[1],time.amb[2]);group.add(hemi);
 const sun=new THREE.DirectionalLight(time.sun[0],time.sun[1]);sun.position.set(...time.sunPos);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:10,far:900});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;group.add(sun,sun.target);out.sun=sun;out.sunOff=new V(...time.sunPos).normalize().multiplyScalar(400);
 if(def.ribbon)buildRibbon(R,def,out,time,q);else buildLot(R,def,out,time,q);
 // pooled real point lights placed at the lamps nearest the camera
 out.pool=[];for(let i=0;i<6;i++){const l=new THREE.SpotLight(lampCol,0,52,1.1,.75,2);group.add(l,l.target);out.pool.push(l);}
 out.lampTimer=0;return out;}

export function updateLamps(W,focus,dt,force){W.lampTimer-=dt;if(W.lampTimer>0&&!force)return;W.lampTimer=.3;
 const L=W.lamps;if(!L.length||!W.time.lampsOn){W.nearLamps=[];W.pool.forEach(l=>l.intensity=0);return;}
 const sorted=L.map((l,i)=>[(l.x-focus.x)**2+(l.z-focus.z)**2,i]).sort((a,b)=>a[0]-b[0]);
 W.pool.forEach((pl,k)=>{const e=sorted[k];if(!e||e[0]>120*120){pl.intensity=0;return;}const l=L[e[1]];pl.position.set(l.x,l.y-.3,l.z);pl.target.position.set(l.gx??l.x,(l.gy??0),l.gz??l.z);pl.intensity=(l.I||300)*.3;pl.color.set(l.col||W.time.lampCol);});
 W.nearLamps=sorted.slice(0,8).map(e=>L[e[1]]);}

/* ---------- ribbon venues ---------- */
function buildRibbon(R,def,out,time,q){const B=sampleTrack(def),g=out.group;out.B=B;out.clips=clipPoints(B);
 const kind=def.id,tex=asphaltTex(kind);tex.map.repeat.set(1,1);
 const flat=kind==='docks';
 const wet=time.wet,agg=aggregateNormal();agg.repeat.set(kind==='ring'?11:7,12);
 const roadM=new THREE.MeshStandardMaterial({map:tex.map,roughnessMap:tex.rough,normalMap:agg,normalScale:new THREE.Vector2(.85,.85).multiplyScalar(1-wet*.8),roughness:(kind==='docks'?.95:kind==='ring'?.9:.85)-wet*.38,metalness:0,envMapIntensity:.5+wet*.8});
 if(flat){out.mirror=new Mirror(.5);reflective(roadM,out.mirror.U,'road'+kind);out.mirror.U.uReflStr.value=.12+.78*wet;}
 const road=new THREE.Mesh(roadGeo(B,k=>-B.hw[k],k=>B.hw[k],18),roadM);road.receiveShadow=true;g.add(road);out.hideRefl.push(road);out.road=road;
 // shoulders
 const shM=new THREE.MeshStandardMaterial({map:kind==='ring'?noiseTex('#2f4a22','#4a6a2a',22):noiseTex('#2c2b29','#4a4640',18),normalMap:detailNormal(kind==='ring'?'grass':'gravel',3,3),roughness:.95-wet*.3,envMapIntensity:.3});shM.map.repeat.set(1,6);shM.normalMap.repeat.set(2,24);
 if(flat&&kind==='docks')reflective(shM,out.mirror.U,'sh');
 for(const s of[-1,1]){const sg=roadGeo(B,s>0?k=>B.hw[k]:k=>-B.wr[k]-(kind==='ring'?0:.3),s>0?k=>B.wl[k]+(kind==='ring'?0:.3):k=>-B.hw[k],8);sg.translate(0,-.01,0);const m=new THREE.Mesh(sg,shM);m.receiveShadow=true;g.add(m);out.hideRefl.push(m);}
 // start/finish gantry line
 {const k=0,lat=B.hw[k];const sl=new THREE.Mesh(new THREE.PlaneGeometry(lat*2,1.2),new THREE.MeshStandardMaterial({map:ctex(256,32,(x,w,h)=>{for(let i=0;i<16;i++)for(let j=0;j<2;j++){x.fillStyle=(i+j)%2?'#eee':'#111';x.fillRect(i*16,j*16,16,16);}}),roughness:.7}));
  sl.rotation.x=-Math.PI/2;sl.rotation.z=Math.atan2(B.tx[k],B.tz[k]);sl.position.set(B.x[k],B.y[k]+.02,B.z[k]);g.add(sl);}
 const rr=seeded(def.id.length*31+5);
 if(kind==='pass')dressPass(R,B,out,time,q,rr);else if(kind==='docks')dressDocks(R,B,out,time,q,rr);else dressRing(R,B,out,time,q,rr);
 // clipping-point markers (glowing posts + painted zones)
 const cm=new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,.55,.12)}),zone=[],posts=[];
 for(const c of out.clips){const k=c.i,side=c.kind==='outer'?c.side:c.side,lat=side*(B.wl[k]-.25);posts.push([new THREE.CylinderGeometry(.05,.05,1.1,6),M4(B.x[k]+B.nx[k]*lat,B.y[k]+.55,B.z[k]+B.nz[k]*lat)]);
  posts.push([new THREE.SphereGeometry(.11,8,6),M4(B.x[k]+B.nx[k]*lat,B.y[k]+1.14,B.z[k]+B.nz[k]*lat)]);}
 if(posts.length)g.add(new THREE.Mesh(merge(posts),cm));
 const zt=ctex(128,128,(x,w,h)=>{x.strokeStyle='rgba(255,170,40,.9)';x.lineWidth=7;x.setLineDash([16,12]);x.beginPath();x.arc(w/2,h/2,w/2-6,0,7);x.stroke();x.fillStyle='rgba(255,140,30,.12)';x.fill();},{clamp:true});
 const zg=new THREE.PlaneGeometry(1,1);zg.rotateX(-Math.PI/2);const zm=new THREE.InstancedMesh(zg,new THREE.MeshBasicMaterial({map:zt,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}),out.clips.length||1);
 out.clips.forEach((c,i)=>{zm.setMatrixAt(i,new THREE.Matrix4().compose(new V(c.x,c.y+.03,c.z),new THREE.Quaternion(),new V(c.r*2,1,c.r*2)));});zm.count=out.clips.length;g.add(zm);out.clipMesh=zm;
 const k0=0;out.spawn={x:B.x[k0]+B.tx[k0]*6,z:B.z[k0]+B.tz[k0]*6,yaw:Math.atan2(B.tx[k0],B.tz[k0]),i:k0};
 lampHeads(out.lamps,time,g);}

function guardrail(B,side,g,metal,every=1){// W-beam on posts at the wall line
 const prof=[{o:.12,y:.52,v:0},{o:.18,y:.6,v:.25},{o:.1,y:.68,v:.5},{o:.18,y:.76,v:.75},{o:.12,y:.84,v:1}];
 const m=new THREE.Mesh(sweep(B,side,prof,'wall',every,{uScale:4}),metal);m.castShadow=true;g.add(m);
 const posts=[],refl=[];const st=Math.round(4/B.step);
 for(let i=0;i<B.n;i+=st){const lat=side*(B.wl[i]+.28);posts.push([new THREE.BoxGeometry(.12,.85,.12),M4(B.x[i]+B.nx[i]*lat,B.y[i]+.42,B.z[i]+B.nz[i]*lat,0,Math.atan2(B.tx[i],B.tz[i]),0)]);
  if(i%(st*3)===0)refl.push([new THREE.BoxGeometry(.03,.1,.06),M4(B.x[i]+B.nx[i]*(lat-side*.22),B.y[i]+.72,B.z[i]+B.nz[i]*(lat-side*.22),0,Math.atan2(B.tx[i],B.tz[i]),0)]);}
 const pm=new THREE.Mesh(merge(posts),metal);pm.castShadow=true;g.add(pm);
 g.add(new THREE.Mesh(merge(refl),new THREE.MeshStandardMaterial({color:0x331a00,emissive:side>0?0xff8a20:0xffffff,emissiveIntensity:.9})));}

function dressPass(R,B,out,time,q,rr){const g=out.group;
 const metal=new THREE.MeshStandardMaterial({color:0xa8adb4,metalness:.85,roughness:.35,envMapIntensity:.9,side:THREE.DoubleSide});
 guardrail(B,1,g,metal);guardrail(B,-1,g,metal);
 // terrain carved around the road: peak inside the loop, falling away to the valley outside
 const cx=150,cz=-10,S=1500,N=q>=2?200:150;const tg=new THREE.PlaneGeometry(S,S,N,N);tg.rotateX(-Math.PI/2);const P=tg.attributes.position,col=new Float32Array(P.count*3);
 const ca=new THREE.Color(0x34452a),cb=new THREE.Color(0x4a4434),cr=new THREE.Color(0x6e6a62),cg=new THREE.Color(0x58663a),tmp=new THREE.Color();const fr={};
 for(let i=0;i<P.count;i++){const x=P.getX(i)+cx,z=P.getZ(i)+cz;const k=nearestGlobal(B,x,z);const f=frame(B,x,z,k,fr);const d=Math.abs(f.d),ins=inside(B,x,z);
  const nat=ins?f.y+3+Math.pow(Math.max(0,d-6),.95)*.5+fbm(x/60,z/60)*14:f.y-2-Math.pow(Math.max(0,d-6),1.08)*.42-fbm(x/80,z/80)*18;
  const wall=B.wl[f.i]+1.2,t=smooth(wall,wall+(ins?10:14),d);let h=lerp(f.y-.35,nat,t);
  const far=Math.hypot(x-cx,z-cz);if(!ins)h=Math.max(h,-150)-smooth(500,740,far)*40;
  P.setY(i,h);const rock=ins?smooth(4,30,d)*.85:smooth(10,40,d)*.25;const verge=1-smooth(wall,wall+5,d);
  tmp.copy(ca).lerp(cb,fbm(x/30,z/30)).lerp(cr,rock*(.45+.55*vnoise(x/9,z/9))).lerp(cg,verge*.7);col.set([tmp.r,tmp.g,tmp.b],i*3);}
 P.needsUpdate=true;tg.translate(cx,0,cz);tg.setAttribute('color',new THREE.BufferAttribute(col,3));tg.computeVertexNormals();
 const tm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,map:noiseTex('#8a8a8a','#ffffff',8,256),normalMap:detailNormal('soil',5,3),envMapIntensity:.25});tm.map.repeat.set(160,160);tm.normalMap.repeat.set(220,220);
 const terr=new THREE.Mesh(tg,tm);terr.receiveShadow=true;g.add(terr);
 const hAt=(x,z)=>{const fx=(x-cx+S/2)/S*N,fz=(z-cz+S/2)/S*N,i=Math.floor(fx),j=Math.floor(fz);if(i<0||j<0||i>=N||j>=N)return-999;const a=fx-i,b=fz-j,Y=(ii,jj)=>P.getY(jj*(N+1)+ii);
  return(Y(i,j)*(1-a)+Y(i+1,j)*a)*(1-b)+(Y(i,j+1)*(1-a)+Y(i+1,j+1)*a)*b;};
 // pine forest (detailed tiers at MEDIUM+, a lighter build at LOW), denser near the road
 const spots=[];for(let i=0;i<5000&&spots.length<(q>=2?1300:q>=1?900:600);i++){const near=i%3===0,x=cx+(rr()-.5)*S*(near?.45:.9),z=cz+(rr()-.5)*S*(near?.45:.9);const k=nearestGlobal(B,x,z),f=frame(B,x,z,k,fr);if(Math.abs(f.d)<B.wl[f.i]+5)continue;
  const hy=hAt(x,z);if(hy<-120)continue;spots.push([x,hy-.2,z]);}
 forest(g,spots,'pine',rr,true,q);
 // boulders on the cut slopes inside the loop
 const rk=[];for(let i=0;i<4000&&rk.length<(q>=1?180:60);i++){const k=(rr()*B.n)|0,side=rr()<.5?1:-1,lat=side*(B.wl[k]+2+rr()*9),x=B.x[k]+B.nx[k]*lat,z=B.z[k]+B.nz[k]*lat;if(!inside(B,x,z))continue;const hy=hAt(x,z);if(hy<-100)continue;rk.push([x,hy,z,.5+rr()*1.6]);}
 if(q>=1)rocks(g,rk,rr);
 // hairpins: tyre bundles against the outer guardrail, spectators on the bank behind (MEDIUM+)
 const pins=[];for(let i=0;i<B.n;i++){const c=Math.abs(B.curv[i]);if(c>.03&&(!pins.length||Math.min(...pins.map(p=>Math.min(Math.abs(p-i),B.n-Math.abs(p-i))))>40))pins.push(i);}
 tyreWalls(g,B,pins.map(i=>[i-10,i+10,-Math.sign(B.curv[i])]),rr,q);
 if(q>=1){const ppl=[];for(const i of pins)for(let k=-14;k<=14;k+=1){const kk=(i+k+B.n)%B.n,side=-Math.sign(B.curv[i]);for(let r2=0;r2<2;r2++){if(rr()<.35)continue;const lat=side*(B.wl[kk]+1.6+r2*.9+rr()*.4),x=B.x[kk]+B.nx[kk]*lat,z=B.z[kk]+B.nz[kk]*lat;const hy=hAt(x,z);if(hy<-100)continue;ppl.push([x,Math.max(hy,B.y[kk]-.3),z,Math.atan2(-B.nx[kk]*side,-B.nz[kk]*side)]);}}
  out.crowd=crowd(g,ppl,rr);if(out.crowd)out.hideRefl.push(out.crowd.bm,out.crowd.hm);}
 // streetlights: pole + arm hanging over the road, alternating sides
 const st=Math.round(38/B.step),pole=[];
 for(let i=0,k=0;i<B.n;i+=st,k++){const side=k%2?1:-1,lat=side*(B.wl[i]+.7),hx=B.x[i]+B.nx[i]*lat,hz=B.z[i]+B.nz[i]*lat,y0=B.y[i];const yaw=Math.atan2(B.nx[i]*-side,B.nz[i]*-side);
  pole.push([new THREE.CylinderGeometry(.09,.13,8,8),M4(hx,y0+4,hz)]);pole.push([new THREE.BoxGeometry(.08,.08,2.6),M4(hx-B.nx[i]*side*1.3,y0+7.9,hz-B.nz[i]*side*1.3,0,yaw,0)]);
  const lx=hx-B.nx[i]*side*2.5,lz=hz-B.nz[i]*side*2.5;out.lamps.push({x:lx,y:y0+7.75,z:lz,gx:lx-B.nx[i]*side*.5,gz:lz-B.nz[i]*side*.5,gy:y0,pool:20,I:320});}
 const pm=new THREE.Mesh(merge(pole),new THREE.MeshStandardMaterial({color:0x3a3d42,metalness:.3,roughness:.75}));g.add(pm);
 // the city in the valley below
 city(g,-1200,-60,1100,1300,-150,q,rr,time);
 // distant ridges
 ridges(g,1900,time,.45,-60,240,rr);}

function city(g,cx,cz,w,d,y,q,rr,time){const dayL=time&&!time.lampsOn;const n=q>=2?2600:1500,geo=new THREE.BoxGeometry(1,1,1);geo.translate(0,.5,0);
 const wt=ctex(64,128,(x,W,H)=>{x.fillStyle='#000';x.fillRect(0,0,W,H);for(let j=4;j<H;j+=8)for(let i=3;i<W;i+=7){if(Math.random()<.42){const c=Math.random();x.fillStyle=c<.6?'#ffcf86':c<.85?'#bfe0ff':'#ff9a5a';x.globalAlpha=.4+Math.random()*.6;x.fillRect(i,j,4,5);}}x.globalAlpha=1;});
 const m=new THREE.MeshStandardMaterial({color:dayL?0x9aa0aa:0x07080b,roughness:.8,emissiveMap:wt,emissive:0xffffff,emissiveIntensity:dayL?.03:1.4,map:dayL?null:wt,fog:true});
 const im=new THREE.InstancedMesh(geo,m,n);for(let i=0;i<n;i++){const x=cx+(rr()-.5)*w,z=cz+(rr()-.5)*d,dc=Math.hypot(x-cx,z-cz)/(w*.5),h=8+rr()*rr()*(dc<.4?160:60),bw=10+rr()*24;im.setMatrixAt(i,M4(x,y,z,0,rr()*.3,0,bw,h,10+rr()*22));}g.add(im);
 if(dayL){const gr=new THREE.Mesh(new THREE.PlaneGeometry(w*1.6,d*1.6),new THREE.MeshStandardMaterial({color:0x4a4c44,roughness:1}));gr.rotation.x=-Math.PI/2;gr.position.set(cx,y-.2,cz);g.add(gr);return;}
 const pts=[],cols=[];for(let i=0;i<(q>=2?9000:4000);i++){const x=cx+(rr()-.5)*w*1.3,z=cz+(rr()-.5)*d*1.3;pts.push(x,y+1+rr()*2,z);const c=rr();cols.push(1,c<.7?.62:.9,c<.7?.25:.8);}
 const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));pg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
 g.add(new THREE.Points(pg,new THREE.PointsMaterial({size:2.2,vertexColors:true,transparent:true,opacity:.9,fog:false,depthWrite:false,blending:THREE.AdditiveBlending})));
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(w*1.6,d*1.6),new THREE.MeshBasicMaterial({color:0x07070a}));gr.rotation.x=-Math.PI/2;gr.position.set(cx,y-.2,cz);g.add(gr);}

function ridges(g,R0,time,depth,y0,hgt,rr){const sk=time.sky,col=new THREE.Color(sk.gnd[0]*(1-depth)+sk.hor[0]*depth,sk.gnd[1]*(1-depth)+sk.hor[1]*depth,sk.gnd[2]*(1-depth)+sk.hor[2]*depth).multiplyScalar(.75);const pos=[],idx=[],N=120;for(let i=0;i<=N;i++){const a=i/N*6.283,h=y0+hgt*(.35+.65*fbm(i*.08,3.3,4))*(.6+.4*Math.sin(a*3+1)**2);pos.push(Math.cos(a)*R0,y0-200,Math.sin(a)*R0,Math.cos(a)*R0,h,Math.sin(a)*R0);}
 for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);
 const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,fog:false}));g.add(m);}

function dressDocks(R,B,out,time,q,rr){const g=out.group,fr={};
 // jersey barriers both sides
 const bt=ctex(256,64,(x,w,h)=>{x.fillStyle='#8f8c86';x.fillRect(0,0,w,h);for(let i=0;i<900;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.15})`;x.fillRect(Math.random()*w,Math.random()*h,2,2);}x.fillStyle='#d9a400';for(let i=-2;i<10;i++){x.save();x.translate(i*32,44);x.transform(1,0,-.8,1,0,0);x.fillRect(0,0,16,20);x.restore();}x.fillStyle='#111';});
 bt.repeat.set(1,1);const bm=new THREE.MeshStandardMaterial({map:bt,roughness:.75-time.wet*.25,envMapIntensity:.4,normalMap:detailNormal('concrete',4,1.2)});
 const prof=[{o:-.05,y:0,v:1},{o:-.02,y:.25,v:.75},{o:.22,y:.4,v:.55},{o:.32,y:.95,v:0},{o:.6,y:.95,v:0},{o:.7,y:.4,v:.55},{o:.95,y:.25,v:.75},{o:.98,y:0,v:1}];
 for(const s of[-1,1]){const m=new THREE.Mesh(sweep(B,s,prof,'wall',1,{uScale:5}),bm);m.castShadow=true;m.receiveShadow=true;g.add(m);}
 {const rngs=[];let i0=-1;for(let i=0;i<=B.n;i++){const on=i<B.n&&Math.abs(B.curv[i])>.02;if(on&&i0<0)i0=i;if(!on&&i0>=0){if(i-i0>5)rngs.push([i0-4,i+4,-Math.sign(B.curv[(i0+i>>1)%B.n])]);i0=-1;}}
  tyreWalls(g,{...B,wl:B.wl.map(v=>v-.75)},rngs,rr,q);}
 // ground: wet concrete apron (reflective); water west of the quay
 const QX=-24,gm=new THREE.MeshStandardMaterial({map:noiseTex('#2c2d2f','#3e3f42',30),roughnessMap:asphaltTex('lot').rough,roughness:.6,envMapIntensity:1});gm.map.repeat.set(60,60);gm.roughnessMap.repeat.set(12,6);reflective(gm,out.mirror.U,'apron');
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,1000),gm);ground.rotation.x=-Math.PI/2;ground.position.set(QX+450,-.03,0);ground.receiveShadow=true;g.add(ground);out.hideRefl.push(ground);
 const quay=new THREE.Mesh(new THREE.BoxGeometry(2,4,1000),new THREE.MeshStandardMaterial({color:0x3a3936,roughness:.9}));quay.position.set(QX-1,-2,0);g.add(quay);
 const wm=new THREE.MeshStandardMaterial({color:0x02060a,roughness:.08,metalness:.4,envMapIntensity:.9,normalMap:detailNormal('water',9,1.4),normalScale:new THREE.Vector2(.35,.35)});wm.normalMap.repeat.set(80,80);reflective(wm,out.mirror.U,'water');out.water=wm;
 const water=new THREE.Mesh(new THREE.PlaneGeometry(1600,2000),wm);water.rotation.x=-Math.PI/2;water.position.set(QX-800,-1.6,0);g.add(water);out.hideRefl.push(water);
 // container stacks off the racing line
 const cont=new THREE.BoxGeometry(12.2,2.6,2.44);cont.translate(0,1.3,0);
 const ct=ctex(256,64,(x,w,h)=>{x.fillStyle='#bbb';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=6){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(i,0,2,h);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(i+3,0,1,h);}x.fillStyle='rgba(0,0,0,.4)';x.fillRect(0,0,w,3);x.fillRect(0,h-3,w,3);for(let i=0;i<300;i++){x.fillStyle=`rgba(90,50,20,${Math.random()*.2})`;x.fillRect(Math.random()*w,Math.random()*h,3,2);}});
 const cm=new THREE.MeshStandardMaterial({map:ct,roughness:.7,metalness:.35,envMapIntensity:.5});
 const C=[0x8a2a1c,0x1f4f8a,0x2d6a3a,0x9a9a96,0xc05a14,0x6a1a1a,0xd8d4c8,0x1a3a5a,0xa88a1a];const items=[];
 for(let x=-6;x<440;x+=14)for(let z=-280;z<300;z+=3.2){if(rr()<.12)continue;const k=nearestGlobal(B,x,z),f=frame(B,x,z,k,fr);if(Math.abs(f.d)<B.wl[f.i]+3.5)continue;
  const near=[-6,6].every(o=>{const f2=frame(B,x+o,z,k,{});return Math.abs(f2.d)>B.wl[f2.i]+3;});if(!near)continue;const st=1+(rr()*4|0);for(let s=0;s<st;s++)items.push([x+(rr()-.5)*.3,s*2.62,z,C[rr()*C.length|0]]);}
 const im=new THREE.InstancedMesh(cont,cm,items.length);const col=new THREE.Color();items.forEach((it,i)=>{im.setMatrixAt(i,M4(it[0],it[1],it[2]));im.setColorAt(i,col.set(it[3]));});im.castShadow=true;im.receiveShadow=true;g.add(im);
 // gantry cranes on the quay
 const red=new THREE.MeshStandardMaterial({color:0xb02a1a,roughness:.55,metalness:.5}),parts=[];
 for(const z of[-200,-60,80,220]){const X=QX+6;for(const dz of[-9,9])for(const dx of[-4,-18]){parts.push([new THREE.BoxGeometry(1.2,36,1.2),M4(X+dx,18,z+dz)]);}
  for(const dx of[-4,-18])parts.push([new THREE.BoxGeometry(1.2,1.2,20),M4(X+dx,36,z)]);parts.push([new THREE.BoxGeometry(70,2.2,3),M4(X-24,38,z-6)]);parts.push([new THREE.BoxGeometry(70,2.2,3),M4(X-24,38,z+6)]);
  parts.push([new THREE.BoxGeometry(7,5,8),M4(X-12,34,z)]);for(let k=0;k<6;k++)parts.push([new THREE.BoxGeometry(.4,.4,18),M4(X-50+k*11,40,z,0,0,.0)]);
  out.lamps.push({x:X-2,y:34,z,gx:X+8,gz:z,pool:34,I:900,col:0xdde8ff});}
 const crane=new THREE.Mesh(merge(parts),red);crane.castShadow=true;g.add(crane);
 // aviation lights + ship
 const av=[];for(const z of[-200,-60,80,220])av.push([new THREE.SphereGeometry(.5,8,6),M4(QX-58,40,z)],[new THREE.SphereGeometry(.5,8,6),M4(QX+2,39.5,z)]);
 const avm=new THREE.MeshBasicMaterial({color:new THREE.Color(6,.3,.2)});g.add(new THREE.Mesh(merge(av),avm));out.blink=avm;
 const hull=new THREE.Mesh(new THREE.BoxGeometry(34,14,260),new THREE.MeshStandardMaterial({color:0x101418,roughness:.6,metalness:.3}));hull.position.set(QX-40,3,10);g.add(hull);
 const deck=[];for(let z=-110;z<120;z+=13)for(let x=-12;x<=12;x+=2.6)if(rr()<.85)for(let s=0;s<1+(rr()*3|0);s++)deck.push([x,10+s*2.6,z]);
 const dm=new THREE.InstancedMesh(cont,cm,deck.length);deck.forEach((d,i)=>{dm.setMatrixAt(i,M4(QX-40+d[0],d[1],10+d[2],0,Math.PI/2,0));dm.setColorAt(i,col.set(C[rr()*C.length|0]));});g.add(dm);
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(30,16,10),new THREE.MeshStandardMaterial({color:0xd8d8d0,roughness:.6,emissive:0xffd8a0,emissiveIntensity:.0}));bridge.position.set(QX-40,18,-120);g.add(bridge);
 // floodlight masts along the track
 const mast=[],st=Math.round(64/B.step);for(let i=0,k=0;i<B.n;i+=st,k++){const side=k%2?1:-1,lat=side*(B.wl[i]+2.2),x=B.x[i]+B.nx[i]*lat,z=B.z[i]+B.nz[i]*lat;
  mast.push([new THREE.CylinderGeometry(.2,.32,16,8),M4(x,8,z)],[new THREE.BoxGeometry(2.6,.5,.8),M4(x,16,z,0,Math.atan2(B.tx[i],B.tz[i]),0)]);
  out.lamps.push({x:x-B.nx[i]*side*1,y:15.6,z:z-B.nz[i]*side*1,gx:B.x[i]+B.nx[i]*side*(B.hw[i]*.4),gz:B.z[i]+B.nz[i]*side*(B.hw[i]*.4),pool:30,I:700,col:k%3?0xffb060:0xd8e6ff});}
 g.add(new THREE.Mesh(merge(mast),new THREE.MeshStandardMaterial({color:0x5a5d62,metalness:.6,roughness:.5})));
 city(g,600,700,1500,500,-2,q,rr,time);ridges(g,2000,time,.5,-20,120,rr);}

function dressRing(R,B,out,time,q,rr){const g=out.group;
 // grass everywhere, mown in stripes, with a blade-scale normal map
 const gt=ctex(256,256,(x,w,h)=>{const id=x.createImageData(w,h),d=id.data;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(j*w+i)*4,st=(i<w/2?1:.82),n=fbm(i/18,j/18,4)*.5+Math.random()*.25;d[k]=(60+n*40)*st;d[k+1]=(96+n*58)*st;d[k+2]=(38+n*20)*st;d[k+3]=255;}x.putImageData(id,0,0);});
 const gm=new THREE.MeshStandardMaterial({map:gt,normalMap:detailNormal('grass',1.5,3),roughness:.93,envMapIntensity:.25});gm.map.repeat.set(150,150);gm.normalMap.repeat.set(900,900);
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),gm);gr.rotation.x=-Math.PI/2;gr.position.set(160,-.06,-40);gr.receiveShadow=true;g.add(gr);
 // concrete wall with sponsor boards, catch fence on top (MEDIUM+)
 const prof=[{o:0,y:0,v:1},{o:0,y:1.1,v:0},{o:.3,y:1.1,v:0},{o:.3,y:0,v:1}];
 for(const s of[-1,1]){const bt=bannerTex(s>0?'a':'b');bt.repeat.y=-1;bt.offset.y=1;/* the wall profile runs v top-down */const wm=new THREE.MeshStandardMaterial({map:bt,roughness:.55,normalMap:detailNormal('concrete',4,1.2)});const m=new THREE.Mesh(sweep(B,s,prof,'wall',1,{uScale:16,flip:true}),wm);m.castShadow=true;m.receiveShadow=true;g.add(m);}
 if(q>=1){const ft=ctex(64,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='rgba(210,214,220,.95)';x.lineWidth=2;for(let i=-64;i<128;i+=10){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();x.beginPath();x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();}},{srgb:false});ft.repeat.set(1,3);
  const fm=new THREE.MeshStandardMaterial({color:0xb8bcc4,alphaMap:ft,alphaTest:.35,side:THREE.DoubleSide,metalness:.6,roughness:.45});
  for(const s of[-1,1]){const fp=[{o:.15,y:1.1,v:0},{o:.15,y:3.4,v:1}];const geo=sweep(B,s,fp,'wall',1,{uScale:1.2,skip:i=>Math.abs(B.curv[i])<.006});g.add(new THREE.Mesh(geo,fm));}}
 // kerbs on the edges of the corners
 const kt=ctex(64,64,(x,w,h)=>{x.fillStyle='#d01818';x.fillRect(0,0,w,h/2);x.fillStyle='#f0f0f0';x.fillRect(0,h/2,w,h/2);x.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<200;i++)x.fillRect(Math.random()*w,Math.random()*h,2,2);});kt.repeat.set(1,1);
 const km=new THREE.MeshStandardMaterial({map:kt,roughness:.55,normalMap:aggregateNormal(),normalScale:new THREE.Vector2(.4,.4)});
 for(const s of[-1,1]){const kprof=[{o:-.02,y:.0,v:0},{o:.5,y:.07,v:.5},{o:1.1,y:.02,v:1}];const skip=i=>Math.abs(B.curv[i])<.008;const geo=sweep(B,s,kprof,'edge',1,{uScale:3,skip});
  const m=new THREE.Mesh(geo,km);m.receiveShadow=true;g.add(m);}
 // tyre walls round the outside of every proper corner
 const rngs=[];let i0=-1;for(let i=0;i<=B.n;i++){const on=i<B.n&&Math.abs(B.curv[i])>.012;if(on&&i0<0)i0=i;if(!on&&i0>=0){if(i-i0>6)rngs.push([i0-3,i+3,-Math.sign(B.curv[(i0+i>>1)%B.n])]);i0=-1;}}
 // tyre walls sit just inside the outer wall
 const B2={...B,wl:B.wl.map(v=>v-.7)};tyreWalls(g,B2,rngs,rr,q);
 // grandstand along the main straight + crowd, judges' tower
 const k0=Math.round(60/B.step),gx=-B.wr[k0]-4;const ppl=grandstand(g,gx,-20,0,150,q>=1?10:7,rr,q);if(ppl.length&&q>=1){out.crowd=crowd(g,ppl,rr);out.hideRefl.push(out.crowd.bm,out.crowd.hm);}
 const tower=new THREE.Mesh(merge([[new THREE.BoxGeometry(6,12,6),M4(0,6,0),C(0x3a3d42)],[new THREE.BoxGeometry(9,4,9),M4(0,14,0),C(0x2a2c30)],[new THREE.BoxGeometry(9.1,2.2,9.1),M4(0,14.2,0),C(0x0a0e14)],[new THREE.BoxGeometry(10,.3,10),M4(0,16.15,0),C(0xd8dadf)]]),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.5,emissive:0xff8a40,emissiveIntensity:time.lampsOn?.05:0}));tower.position.set(120,0,-120);tower.castShadow=true;g.add(tower);
 // trees: broadleaf belt with a few pines
 const sp=[],fr={};for(let i=0;i<3000&&sp.length<(q>=2?700:q>=1?520:380);i++){const a=rr()*6.283,r=200+rr()*700,x=160+Math.cos(a)*r,z=-40+Math.sin(a)*r;const k=nearestGlobal(B,x,z),f=frame(B,x,z,k,fr);if(Math.abs(f.d)<B.wl[f.i]+14)continue;sp.push([x,-.1,z]);}
 for(let i=0;i<500&&sp.length<(q>=2?900:q>=1?680:480);i++){const x=-60+rr()*420,z=-320+rr()*560;const k=nearestGlobal(B,x,z),f=frame(B,x,z,k,fr);if(Math.abs(f.d)<B.wl[f.i]+10)continue;if(x<gx+2&&x>gx-24&&z>-110&&z<70)continue;sp.push([x,-.1,z]);}
 forest(g,sp.filter((p,i)=>i%5),'leaf',rr,true,q);forest(g,sp.filter((p,i)=>!(i%5)),'pine',rr,true,q);
 const tw=[],st=Math.round(120/B.step);for(let i=0,k=0;i<B.n;i+=st,k++){const side=k%2?1:-1,lat=side*(B.wl[i]+4),x=B.x[i]+B.nx[i]*lat,z=B.z[i]+B.nz[i]*lat;tw.push([new THREE.CylinderGeometry(.3,.45,22,8),M4(x,11,z)],[new THREE.BoxGeometry(4,2,.6),M4(x,22,z,0,Math.atan2(B.nx[i],B.nz[i]),0)]);
  out.lamps.push({x:x-B.nx[i]*side,y:21.5,z:z-B.nz[i]*side,gx:B.x[i],gz:B.z[i],pool:34,I:500,col:0xffe2b8});}
 g.add(new THREE.Mesh(merge(tw),new THREE.MeshStandardMaterial({color:0x6a6d72,metalness:.6,roughness:.5})));
 ridges(g,1700,time,.35,-10,160,rr);ridges(g,2100,time,.6,-10,260,rr);}

/* ---------- the lot ---------- */
function buildLot(R,def,out,time,q){const g=out.group,lot=lotLayout(def);out.lot=lot;out.clips=lot.clips.map(c=>({...c}));
 const W=lot.W,L=lot.L;out.mirror=new Mirror(.5);out.mirror.U.uReflStr.value=.5;
 const lt=ctex(1024,768,(x,w,h)=>{x.fillStyle='#2b2b2d';x.fillRect(0,0,w,h);const id=x.getImageData(0,0,w,h),d=id.data;for(let k=0;k<d.length;k+=4){const n=(Math.random()-.5)*22;d[k]+=n;d[k+1]+=n;d[k+2]+=n;}x.putImageData(id,0,0);
  const X=v=>(v+W)/(2*W)*w,Z=v=>(v+L)/(2*L)*h;x.strokeStyle='rgba(235,235,225,.75)';x.lineWidth=2;
  for(const zz of[-38,38])for(let xx=-W+6;xx<W-6;xx+=3.2){if(Math.abs(xx%70)<15)continue;for(const s of[-1,1]){x.beginPath();x.moveTo(X(xx),Z(zz+s*3.2));x.lineTo(X(xx),Z(zz+s*9));x.stroke();}}
  x.strokeStyle='rgba(230,190,40,.8)';x.lineWidth=3;x.strokeRect(X(-W+2),Z(-L+2),X(W-2)-X(-W+2),Z(L-2)-Z(-L+2));
  x.fillStyle='rgba(235,235,225,.7)';x.font='bold 22px JetBrains Mono, monospace';x.fillText('LOT 22',X(-8),Z(2));
  for(let i=0;i<40;i++){x.fillStyle=`rgba(0,0,0,${.05+Math.random()*.1})`;x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*60,6+Math.random()*30,Math.random()*3,0,7);x.fill();}});
 const rough=asphaltTex('lot').rough;rough.repeat.set(4,3);
 const gm=new THREE.MeshStandardMaterial({map:lt,roughnessMap:rough,roughness:.68,envMapIntensity:.9});reflective(gm,out.mirror.U,'lot');
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(2*W,2*L),gm);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;g.add(ground);out.hideRefl.push(ground);out.road=ground;
 const outer=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshStandardMaterial({color:0x101112,roughness:.95}));outer.rotation.x=-Math.PI/2;outer.position.y=-.05;g.add(outer);
 // perimeter: low concrete wall + fence
 const P=[],fence=[];for(const[x,z,w,d]of[[0,L+.3,2*W+1.2,.6],[0,-L-.3,2*W+1.2,.6],[W+.3,0,.6,2*L],[-W-.3,0,.6,2*L]]){P.push([new THREE.BoxGeometry(w,.9,d),M4(x,.45,z)]);fence.push([new THREE.BoxGeometry(w,2.4,d*.1+.02),M4(x,2.1,z)]);}
 g.add(new THREE.Mesh(merge(P),new THREE.MeshStandardMaterial({color:0x6e6c68,roughness:.85})));
 const ft=ctex(64,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='rgba(200,200,200,.8)';x.lineWidth=2;for(let i=-64;i<128;i+=12){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();x.beginPath();x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();}});ft.repeat.set(80,1);
 g.add(new THREE.Mesh(merge(fence),new THREE.MeshStandardMaterial({map:ft,transparent:true,alphaTest:.3,side:THREE.DoubleSide,metalness:.6,roughness:.5})));
 // islands (painted curbs), light poles, pillars
 const isl=[];for(const b of lot.boxes)isl.push([new THREE.BoxGeometry(b.hx*2,b.h,b.hz*2),M4(b.x,b.h/2,b.z)]);
 g.add(new THREE.Mesh(merge(isl),new THREE.MeshStandardMaterial({color:0x8a8780,roughness:.8,map:ctex(64,64,(x,w,h)=>{x.fillStyle='#bdb8ac';x.fillRect(0,0,w,h);x.fillStyle='#c8a020';x.fillRect(0,0,w,6);x.fillRect(0,h-6,w,6);})})));
 const poles=[],pil=[];for(const c of lot.circles){if(c.kind==='pole'){poles.push([new THREE.CylinderGeometry(.2,.3,11,8),M4(c.x,5.5,c.z)],[new THREE.BoxGeometry(3,.3,.5),M4(c.x,11,c.z)]);for(const s of[-1,1])out.lamps.push({x:c.x+s*1.3,y:10.7,z:c.z,gx:c.x+s*4,gz:c.z,pool:30,I:520,col:0xe6eeff});}
  else pil.push([new THREE.CylinderGeometry(c.r,c.r,7,20),M4(c.x,3.5,c.z)]);}
 g.add(new THREE.Mesh(merge(poles),new THREE.MeshStandardMaterial({color:0x5a5d62,metalness:.6,roughness:.5})));
 const pt=ctex(128,256,(x,w,h)=>{x.fillStyle='#9a968c';x.fillRect(0,0,w,h);for(let i=0;i<w*2;i+=24){x.fillStyle='#e0b000';x.save();x.translate(i-w,h-60);x.transform(1,-.6,0,1,0,0);x.fillRect(0,0,12,80);x.restore();}x.fillStyle='rgba(0,0,0,.6)';x.fillRect(0,h-62,w,2);});
 const pm=new THREE.Mesh(merge(pil),new THREE.MeshStandardMaterial({map:pt,roughness:.8}));pm.castShadow=true;g.add(pm);
 // surrounding buildings with lit signage
 const bl=[],sg=[];const sign=ctex(512,96,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.font='64px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#ff3a6a';x.shadowColor='#ff3a6a';x.shadowBlur=20;x.fillText('NITE MARKET',w/2,h/2+4);});
 bl.push([new THREE.BoxGeometry(2*W+40,22,30),M4(0,11,L+40)],[new THREE.BoxGeometry(60,30,80),M4(W+60,15,-20)],[new THREE.BoxGeometry(70,16,50),M4(-W-55,8,30)],[new THREE.BoxGeometry(2*W,12,24),M4(-20,6,-L-36)]);
 g.add(new THREE.Mesh(merge(bl),new THREE.MeshStandardMaterial({color:0x1a1b1e,roughness:.85})));
 const sm=new THREE.Mesh(new THREE.PlaneGeometry(60,11),new THREE.MeshBasicMaterial({map:sign,color:new THREE.Color(2.4,2.4,2.4),transparent:true,blending:THREE.AdditiveBlending}));sm.position.set(0,16,L+24.9);sm.rotation.y=Math.PI;g.add(sm);
 for(let i=0;i<14;i++)out.lamps.push({x:-W+i*(2*W/13),y:9,z:L+24,gx:-W+i*(2*W/13),gz:L-4,pool:16,I:120,col:0xffb080});
 city(g,0,-900,2600,800,-1,q,seeded(9),time);ridges(g,2100,time,.5,-10,140,seeded(4));
 lampHeads(out.lamps,time,g);
 // traffic cones (knockable)
 out.cones=[];const coneG=merge([[new THREE.ConeGeometry(.22,.7,10),M4(0,.38,0),new THREE.Color(0xff5a10)],[new THREE.CylinderGeometry(.16,.19,.1,10),M4(0,.4,0),new THREE.Color(0xf0f0f0)],[new THREE.BoxGeometry(.5,.05,.5),M4(0,.025,0),new THREE.Color(0xff5a10)]]);
 const cmI=new THREE.InstancedMesh(coneG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}),40);
 const cpos=[];for(let i=0;i<8;i++)cpos.push([-40+i*12,-70]);for(let i=0;i<8;i++){const a=i/8*6.283;cpos.push([0+Math.cos(a)*14,62+Math.sin(a)*14*.0+Math.sin(a)*8]);}for(let i=0;i<12;i++)cpos.push([60+i*4.5,-18+(i%2)*1.5]);
 for(let i=0;i<cpos.length;i++)out.cones.push({x:cpos[i][0],z:cpos[i][1],y:0,hx:cpos[i][0],hz:cpos[i][1],vx:0,vy:0,vz:0,rx:0,rz:0,wr:0,down:false});cmI.count=out.cones.length;g.add(cmI);out.coneMesh=cmI;
 out.spawn={x:0,z:-20,yaw:Math.PI/2,i:-1};}

/* ================= shared trackside props ================= */
// pines: trunk + stacked, jittered needle tiers with dark-core / light-tip vertex colours
function pineGeo(seed,lo){const r=seeded(seed),L=[[new THREE.CylinderGeometry(.13,.24,3,lo?5:7),M4(0,1.5,0),C(0x3a2a1e)]];const T=lo?3:5;
 for(let t=0;t<T;t++){const f=t*5/T,rad=2.4-f*.42,hgt=(2.4-f*.2)*(lo?1.5:1),y=2.2+f*1.35;const g=new THREE.ConeGeometry(rad,hgt,lo?7:10,lo?1:2,true);const P=g.attributes.position,col=[];
  for(let i=0;i<P.count;i++){const px=P.getX(i),py=P.getY(i),pz=P.getZ(i),rr=Math.hypot(px,pz);if(rr>.05){const k=1+(r()-.5)*.35;P.setX(i,px*k);P.setZ(i,pz*k);P.setY(i,py-(rr/rad)*.35*r());}
   const tip=rr/rad,c=new THREE.Color(0x0f2214).lerp(new THREE.Color(0x2e5530),tip*.8+t*.04);col.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();L.push([g,M4(0,y,0,0,r()*6,0)]);}
 return merge(L);}
// broadleaf: trunk + clumps of displaced icospheres, darker underneath (baked ambient occlusion)
function leafGeo(seed,tint=0x2f5222,lo){const r=seeded(seed),L=[[new THREE.CylinderGeometry(.18,.32,3.4,lo?5:7),M4(0,1.7,0),C(0x4a3626)]];
 for(let k=0;k<(lo?3:6);k++){const g=new THREE.IcosahedronGeometry((1.6+r()*1.2)*(lo?1.25:1),lo?0:1);const P=g.attributes.position,col=[];const ox=(r()-.5)*2.6,oy=4.4+r()*2.6,oz=(r()-.5)*2.6;
  for(let i=0;i<P.count;i++){const px=P.getX(i),py=P.getY(i),pz=P.getZ(i);const k2=1+(Math.sin(px*3.1+seed)+Math.cos(pz*2.7+py*1.9))*.09;P.setXYZ(i,px*k2,py*k2*.85,pz*k2);
   const ao=Math.min(1,Math.max(0,(py+oy-3.6)/4.2));const c=new THREE.Color(tint).multiplyScalar(.45+.75*ao).lerp(new THREE.Color(0x6a8a3a),r()*.18);col.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();L.push([g,M4(ox,oy,oz)]);}
 return merge(L);}
function treeMat(){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,normalMap:detailNormal('leaf',1.6,4),normalScale:new THREE.Vector2(1.2,1.2),envMapIntensity:.35});m.normalMap.repeat.set(3,3);return m;}
// instanced trees: two variants share the slots
function forest(g,spots,kind,rr,shadow=true,q=2){if(!spots.length)return;const lo=q<1;const geos=kind==='pine'?[pineGeo(11,lo),pineGeo(29,lo)]:[leafGeo(5,0x2f5222,lo),leafGeo(17,0x3a5a24,lo)];const mat=treeMat();
 geos.forEach((geo,v)=>{const mine=spots.filter((s,i)=>i%2===v);const im=new THREE.InstancedMesh(geo,mat,mine.length);
  mine.forEach((s,i)=>{const sc=s[3]||(.75+rr()*.6);im.setMatrixAt(i,M4(s[0],s[1],s[2],0,rr()*6.28,0,sc,sc*(.85+rr()*.35),sc));});im.castShadow=shadow;im.receiveShadow=true;g.add(im);});}
// boulders: displaced dodecahedra, lichen-tinted
function rocks(g,spots,rr){if(!spots.length)return;const geo=new THREE.DodecahedronGeometry(1,1);const P=geo.attributes.position,col=[];
 for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),k=1+(fbm(x*2+3,z*2+y,3)-.5)*.6;P.setXYZ(i,x*k,y*k*.7,z*k);const c=new THREE.Color(0x5a5650).lerp(new THREE.Color(0x3c4a2e),Math.max(0,y)*.5*fbm(x*4,z*4,2));col.push(c.r,c.g,c.b);}
 geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.computeVertexNormals();
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,normalMap:detailNormal('rock',4,3.5)});m.normalMap.repeat.set(2,2);
 const im=new THREE.InstancedMesh(geo,m,spots.length);spots.forEach((s,i)=>{const sc=s[3]||1;im.setMatrixAt(i,M4(s[0],s[1],s[2],rr()*3,rr()*6,rr()*3,sc*(.8+rr()*.6),sc*(.6+rr()*.5),sc*(.8+rr()*.6)));});im.castShadow=true;im.receiveShadow=true;g.add(im);}
// spectators: instanced bodies (shirt colours) + heads (skin tones); each person [x,y,z,yaw]
const SHIRTS=['#e8e2d6','#1a1a1c','#c21a2a','#2a6dff','#ff4d00','#ffcf3f','#3a6a3a','#6a6e76','#f0f0f0','#2a2a5a','#8a2a6a','#16b8c8'],SKIN=['#f1c7a5','#d9a37a','#a8714c','#6b4630','#e0b48c'];
function crowd(g,people,rr){if(!people.length)return;const body=merge([[new THREE.CapsuleGeometry(.2,.62,2,6),M4(0,.92,0)],[new THREE.CylinderGeometry(.09,.08,.5,5,1,true),M4(-.1,.25,0)],[new THREE.CylinderGeometry(.09,.08,.5,5,1,true),M4(.1,.25,0)]]);
 const head=new THREE.SphereGeometry(.13,7,5);head.translate(0,1.58,0);const col=new THREE.Color();
 const bm=new THREE.InstancedMesh(body,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}),people.length),hm=new THREE.InstancedMesh(head,new THREE.MeshStandardMaterial({roughness:.6}),people.length);
 people.forEach((p,i)=>{const s=.92+rr()*.16,m=M4(p[0],p[1],p[2],0,p[3]+(rr()-.5)*.8,0,s,s*(.95+rr()*.12),s);bm.setMatrixAt(i,m);hm.setMatrixAt(i,m);bm.setColorAt(i,col.set(SHIRTS[rr()*SHIRTS.length|0]));hm.setColorAt(i,col.set(SKIN[rr()*SKIN.length|0]));});
 g.add(bm,hm);return{bm,hm,people};}// no crowd shadows: the stand roof and the crowd's own shading carry it
// tyre walls: stacks of 3-4 tyres bolted together, alternating painted bands, with a conveyor belt face
function tyreWalls(g,B,ranges,rr,q){if(q<1)return;/* LOW keeps its old draw budget */const tyre=q<1?new THREE.TorusGeometry(.3,.14,4,8):q<2?new THREE.TorusGeometry(.3,.14,5,11):new THREE.TorusGeometry(.3,.14,6,12);tyre.rotateX(Math.PI/2);const pts=[],cols=[],belt=[];const C1=new THREE.Color(),cyc=[0x151517,0x151517,0xe8e8e8,0x151517,0xd01818];
 for(const[i0,i1,side]of ranges){for(let i=i0;i<i1;i+=1){const k=(i+B.n)%B.n;const lat=side*(B.wl[k]+.25);if((i-i0)%Math.max(1,Math.round(.62/B.step)))continue;
   for(let h=2;h<4;h++){pts.push([B.x[k]+B.nx[k]*lat,B.y[k]+.15+h*.28,B.z[k]+B.nz[k]*lat]);cols.push(h===3?cyc[(i/7|0)%cyc.length]:0x151517);}}
  // the belt: a dark strap facing the road (it hides the two lower rows, so only the top two are built)
  const prof=[{o:-.2,y:.02,v:1},{o:-.2,y:1.18,v:0}];belt.push(sweepRange(B,side,prof,i0,i1));}
 if(pts.length){const im=new THREE.InstancedMesh(tyre,new THREE.MeshStandardMaterial({roughness:.9,normalMap:detailNormal('rubber',2,1.5)}),pts.length);pts.forEach((p,i)=>{im.setMatrixAt(i,M4(p[0],p[1],p[2],0,rr()*6,0));im.setColorAt(i,C1.set(cols[i]));});im.castShadow=true;im.receiveShadow=true;g.add(im);}
 if(belt.length){const bm=new THREE.Mesh(mergeIdx(belt),new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.7,side:THREE.DoubleSide}));bm.receiveShadow=true;g.add(bm);}}
// a sweep restricted to [i0,i1) samples
function sweepRange(B,side,prof,i0,i1){const pos=[],idx=[],nP=prof.length;let rows=0;for(let i=i0;i<=i1;i++){const k=(i+B.n)%B.n;for(const q of prof){const lat=side*(B.wl[k]+q.o);pos.push(B.x[k]+B.nx[k]*lat,B.y[k]+q.y,B.z[k]+B.nz[k]*lat);}rows++;}
 for(let i=0;i<rows-1;i++)for(let j=0;j<nP-1;j++){const a=i*nP+j,b=a+nP;side>0?idx.push(a,a+1,b,a+1,b+1,b):idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function mergeIdx(list){return merge(list.map(g=>[g]));}
// sponsor board texture (all invented brands)
function bannerTex(kind){const key='ban'+kind;if(TEXC[key])return TEXC[key].clone();return TEXC[key]=ctex(1024,64,(x,w,h)=>{const sets={
 a:[['SIDEWAYS','#ff4d00','#111'],['KOGANE OIL','#111','#ffcf3f'],['VOLTRA TYRES','#fff','#c21a2a'],['NORTHLINE','#2a6dff','#fff'],['APEX FUEL','#111','#7dffa8']],
 b:[['HAYATE PARTS','#e8e2d6','#1a1a1c'],['PIXEL ARCADE','#ff4d00','#fff'],['RIDGE RADIO 88.1','#111','#3de0ff'],['SMOKE IS POINTS','#ffcf3f','#111'],['VOLTRA','#c21a2a','#fff']]}[kind]||[];
 let px=0;for(const[t,bg,fg]of sets){x.font='40px Anton, Impact, sans-serif';const wd=x.measureText(t).width+60;x.fillStyle=bg;x.fillRect(px,0,wd,h);x.fillStyle=fg;x.textBaseline='middle';x.fillText(t,px+30,h/2+2);px+=wd;}
 if(px<w){x.drawImage(x.canvas,0,0,px,h,px,0,px,h);}
 x.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<600;i++)x.fillRect(Math.random()*w,Math.random()*h,2,1);});}
// grandstand: steel frame, stepped seat rows in team colours, cantilever roof, crowd
function grandstand(g,x0,z0,yaw,len,rows,rr,q){const L=[],seat=[],cos=Math.cos(yaw),sin=Math.sin(yaw);const P=(lx,ly,lz)=>[x0+lx*cos+lz*sin,ly,z0-lx*sin+lz*cos];
 for(let t=0;t<rows;t++){const[x,y,z]=P(-t*.9-1,.25+t*.5,0);L.push([new THREE.BoxGeometry(.9,.12,len),M4(x,y,z,0,yaw,0),C(0x8a8d94)]);seat.push([new THREE.BoxGeometry(.4,.36,len*.98),M4(...P(-t*.9-1.05,.43+t*.5,0),0,yaw,0),C(t%2?0x1f3f8a:0x2a56b8)]);}
 for(let s=-len/2;s<=len/2;s+=len/8){for(const lx of[-1,-rows*.9-.6]){const h=lx<-1?rows*.5+5:2;L.push([new THREE.BoxGeometry(.18,h,.18),M4(...P(lx,h/2,s),0,yaw,0),C(0x5a5d62)]);}}
 L.push([new THREE.BoxGeometry(rows*.9+3,.14,len+2),M4(...P(-rows*.45-.2,rows*.5+5.1,0),0,yaw,-.09),C(0xd8dadf)]);
 L.push([new THREE.BoxGeometry(.2,rows*.5+5,len),M4(...P(-rows*.9-.7,(rows*.5+5)/2,0),0,yaw,0),C(0x2a2c30)]);
 const m=new THREE.Mesh(merge([...L,...seat]),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.35}));m.castShadow=true;m.receiveShadow=true;g.add(m);
 const ppl=[];for(let t=0;t<rows;t++)for(let s=-len/2+.5;s<len/2-.4;s+=.62)if(rr()<(q>=2?.78:.5))ppl.push([...P(-t*.9-1.15,.31+t*.5,s+(rr()-.5)*.2),yaw+Math.PI/2]);
 return ppl;}
