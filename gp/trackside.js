// KART GRAND PRIX — trackside dressing: grandstands with an animated instanced crowd, sponsor hoardings and a
// banner bridge (one atlas, one draw call), tyre walls on the outside of corners, and a layered horizon ring.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,merge,M,rng,fbm,sstep} from './util.js';
import {query,F} from './trackmath.js';
import {bannerAtlas} from './tex.js';

const CROWD=[0xe8443a,0xf4f0e8,0x2a6aff,0xffd23a,0x2ac06a,0xff8a1e,0x9a6aff,0x1a1c24,0xff6aa0,0x30d0e0];
const _b=new THREE.Matrix4(),_x=new V(),_y=new V(0,1,0),_z=new V();
// basis: local x along the track, local z away from the road on `side`
function frame(B,i,side,u,yOff=0){const t=new V(B.tx[i],0,B.tz[i]),n=new V(B.nx[i],0,B.nz[i]);_x.copy(t).multiplyScalar(-side);_z.copy(n).multiplyScalar(side);
 const p=new V(B.x[i]+B.nx[i]*u,B.y[i]+yOff,B.z[i]+B.nz[i]*u);return new THREE.Matrix4().makeBasis(_x,_y,_z).setPosition(p);}

function standGeo(len,tiers,seatC,r){const L=[];const td=.95,th=.48;
 L.push([new THREE.BoxGeometry(len+1,7,1),M(0,-3.2,-.4),0x8a8a90]);// front base wall
 for(let t=0;t<tiers;t++){L.push([new THREE.BoxGeometry(len,th,td),M(0,t*th+th/2,t*td+td/2),0xb8b8bc]);// concrete step
  L.push([new THREE.BoxGeometry(len,.22,.42),M(0,t*th+th+.11,t*td+.55),t%2?seatC:new THREE.Color(seatC).multiplyScalar(.75).getHex()]);}// seat row
 const D=tiers*td,Ht=tiers*th;
 L.push([new THREE.BoxGeometry(len+1,Ht+8,.4),M(0,Ht/2-3,D+.2),0x9a9aa2]);// back wall
 for(const s of[-1,1])L.push([new THREE.BoxGeometry(.4,Ht+8,D+.6),M(s*(len/2+.3),Ht/2-3,D/2),0x9a9aa2]);// side walls
 // roof on slim columns, tilted toward the track
 const rh=Ht+3.6;for(let k=0;k<=Math.max(1,Math.round(len/12));k++){const x=-len/2+k*len/Math.max(1,Math.round(len/12));L.push([new THREE.CylinderGeometry(.14,.14,rh,8),M(x,rh/2,D-.2),0x3a3c44]);}
 L.push([new THREE.BoxGeometry(len+2,.3,D+3),M(0,rh+.3,D/2-1,-.12,0,0),0xe8e8ec]);L.push([new THREE.BoxGeometry(len+2,.5,.2),M(0,rh+.05,-2.4,-.12,0,0),seatC]);
 // front rail
 L.push([new THREE.BoxGeometry(len,.06,.06),M(0,1.05,-.1),0xdddddd]);for(let x=-len/2;x<=len/2;x+=2)L.push([new THREE.BoxGeometry(.05,1.05,.05),M(x,.52,-.1),0xdddddd]);
 return{g:merge(L),D,th,td};}
function personGeo(lo){const L=[];
 L.push([new THREE.CylinderGeometry(.17,.21,.62,lo?4:6,1,true),M(0,.31,0),0xffffff]);
 L.push([new THREE.SphereGeometry(.13,lo?4:6,lo?3:4),M(0,.76,0),0xffd8b8]);
 if(!lo){L.push([new THREE.CylinderGeometry(.05,.05,.5,3,1,true),M(.24,.78,0,0,0,-.35),0xffffff]);L.push([new THREE.CylinderGeometry(.05,.05,.5,3,1,true),M(-.24,.78,0,0,0,.35),0xffffff]);}
 return merge(L);}
export function buildTrackside(W,C,T,rnd,hgt,q){const B=C.main,grp=W.grp,key=T.key;W.occupied=[];
 if(key==='sky')return;
 const r=rng(B.n*7+3),night=!!T.night;
 // straights: runs of low curvature
 const straight=new Uint8Array(B.n);for(let i=0;i<B.n;i++)straight[i]=Math.abs(B.curv[i])<.006&&!(B.flag[i]&(F.gap|F.noWall))?1:0;
 const runsL=[];let a=-1;for(let i=0;i<=B.n;i++){const ok=i<B.n&&straight[i];if(ok&&a<0)a=i;if(!ok&&a>=0){runsL.push([a,i-1]);a=-1;}}
 if(runsL.length>1&&runsL[0][0]===0&&runsL[runsL.length-1][1]===B.n-1){const l=runsL.pop();runsL[0]=[l[0]-B.n,runsL[0][1]];}
 runsL.sort((x,y)=>(y[1]-y[0])-(x[1]-x[0]));
 const wallOff=i=>B.w[i]+B.sh[i]+(T.wall==='snowbank'?1.6:1);
 const clear=(i,side,u0,u1,len)=>{for(let du=u0;du<=u1;du+=3)for(let dl=-len/2;dl<=len/2;dl+=4){const k=((i+Math.round(dl/B.step))%B.n+B.n)%B.n,u=side*(wallOff(k)+du),x=B.x[k]+B.nx[k]*u,z=B.z[k]+B.nz[k]*u;const qq=query(C,x,z);if(qq.ok&&Math.abs(qq.u)<qq.lim+1.5&&!(qq.B===B&&Math.abs(qq.i-k)<6))return false;if(qq.ok&&qq.B===B&&Math.abs(qq.u)<wallOff(k)+du-2)return false;
   if(C.seaY!==undefined&&hgt(x,z)<C.seaY+.5)return false;if(B.flag[k]&(F.gap|F.noWall))return false;}return true;};
 /* ---------- grandstands + crowd ---------- */
 const stands=[];const maxStands=q>=2?3:q===1?3:2;
 const startRun=runsL.find(([s,e])=>s<=6&&e>=-6)||null;
 const cand=[];if(startRun)cand.push(startRun);for(const rn of runsL)if(rn!==startRun)cand.push(rn);
 for(const[s,e]of cand){if(stands.length>=maxStands)break;const lenM=(e-s)*B.step;if(lenM<36)continue;
  const mid=stands.length===0&&startRun?Math.round(Math.max(s+10,Math.min(e-10,-14/B.step))):Math.round((s+e)/2);const i=((mid%B.n)+B.n)%B.n;
  const len=Math.min(64,lenM*.7);let side=0;for(const sd of(r()<.5?[-1,1]:[1,-1]))if(clear(i,sd,1.5,13,len)){side=sd;break;}if(!side)continue;
  stands.push({i,side,len:Math.round(len/2)*2,tiers:q>=1?8:6});}
 const seatC=new THREE.Color(T.curb[0]).getHex();
 const sGeo=[],people=[];
 for(const st of stands){const u=st.side*(wallOff(st.i)+3.5);const Mx=frame(B,st.i,st.side,u,-.2);const sg=standGeo(st.len,st.tiers,seatC,r);sGeo.push([sg.g,Mx,null]);
  W.occupied.push({x:B.x[st.i]+B.nx[st.i]*(u+st.side*st.tiers*.5),z:B.z[st.i]+B.nz[st.i]*(u+st.side*st.tiers*.5),r:st.len/2+6});
  const dens=q>=2?.9:q===1?.65:.4;
  for(let t=0;t<st.tiers;t++)for(let x=-st.len/2+.5;x<st.len/2-.3;x+=.72){if(r()>dens*.88)continue;const lp=new V(x+(r()-.5)*.15,t*sg.th+sg.th,t*sg.td+.42).applyMatrix4(Mx);people.push([lp,r()]);}}
 if(sGeo.length){const g=merge(sGeo);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,envMapIntensity:.5}));m.castShadow=true;m.receiveShadow=true;grp.add(m);}
 if(people.length){const pg=personGeo(q===0);const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});const U={uT:{value:0},uCheer:{value:.4}};W.crowdU=U;
  mat.onBeforeCompile=s=>{Object.assign(s.uniforms,U);s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uCheer;')
   .replace('#include <begin_vertex>',`#include <begin_vertex>
    float idf=float(gl_InstanceID);float ph=fract(sin(idf*12.9898)*43758.5453);
    float jump=uCheer*max(0.,sin(uT*(5.+ph*4.)+ph*30.))*(.12+ph*.12);transformed.y+=jump;
    if(position.y>.55&&abs(position.x)>.12){transformed.y+=uCheer*(.25+.2*sin(uT*9.+ph*20.))*abs(position.x)*2.;}`)
   .replace('#include <color_vertex>',`#include <color_vertex>
    #ifdef USE_INSTANCING_COLOR
    if(position.y>.64&&abs(position.x)<.15){float sk=fract(sin(float(gl_InstanceID)*7.31)*913.7);vColor.xyz=mix(vec3(1.,.82,.66),vec3(.42,.27,.18),sk*sk);}
    #endif`);};
  mat.customProgramCacheKey=()=>'crowd';
  const im=new THREE.InstancedMesh(pg,mat,people.length);const c=new THREE.Color(),mm=new THREE.Matrix4();
  people.forEach(([p,k],j)=>{mm.makeRotationY(k*.6-.3);mm.setPosition(p);
   // face the track: rotate so +z faces the road — stands use the frame basis so derive yaw from nearest sample
   im.setMatrixAt(j,mm);c.set(CROWD[(k*CROWD.length)|0]).multiplyScalar(night?.8:1);im.setColorAt(j,c);});
  im.castShadow=q>=2;im.receiveShadow=true;im.computeBoundingSphere();grp.add(im);W.crowd=im;}
 /* ---------- sponsor hoardings + bridge ---------- */
 const atlas=bannerAtlas(),bp=[],bu=[],bi=[],posts=[];let vb=0;
 const quad=(p0,p1,y0,y1,cell,flip)=>{// vertical quad from p0 to p1 (world xz), texture cell 0..7
  const u0=(cell%2)*.5,v0=1-((cell>>1)+1)*.25,u1=u0+.5,v1=v0+.25;const A=flip?[p1,p0]:[p0,p1];
  bp.push(A[0].x,y0+A[0].y,A[0].z, A[1].x,y0+A[1].y,A[1].z, A[1].x,y1+A[1].y,A[1].z, A[0].x,y1+A[0].y,A[0].z);
  bu.push(u0,v0+.008,u1,v0+.008,u1,v1-.008,u0,v1-.008);bi.push(vb,vb+1,vb+2,vb,vb+2,vb+3);vb+=4;};
 if(T.wall!=='none'){let cell=(r()*8)|0;const stepN=Math.round(26/B.step),half=Math.round(2.6/B.step);
  for(let i=0;i<B.n;i+=stepN){for(const side of[-1,1]){if((i/stepN+(side>0?1:0))%2)continue;let ok=true;for(let k=-half;k<=half;k++){const j=(i+k+B.n)%B.n;if(B.flag[j]&(F.gap|F.noWall))ok=false;}if(!ok)continue;
    const ia=(i-half+B.n)%B.n,ib=(i+half)%B.n,u=k=>side*(wallOff(k)+.6);
    const pa=new V(B.x[ia]+B.nx[ia]*u(ia),B.y[ia],B.z[ia]+B.nz[ia]*u(ia)),pb=new V(B.x[ib]+B.nx[ib]*u(ib),B.y[ib],B.z[ib]+B.nz[ib]*u(ib));
    const mid=new V().addVectors(pa,pb).multiplyScalar(.5),qq=query(C,mid.x,mid.z);if(qq.ok&&qq.B!==B&&Math.abs(qq.u)<qq.lim+2)continue;
    if(stands.some(st=>{let d=Math.abs(i-st.i);d=Math.min(d,B.n-d);return d*B.step<st.len/2+4&&st.side===side;}))continue;
    quad(pa,pb,1.05,2.35,cell,side>0);quad(pb,pa,1.05,2.35,cell,side>0);cell=(cell+1)%8;
    for(const p of[pa,pb])posts.push([new THREE.BoxGeometry(.12,2.4,.12),M(p.x,p.y+1.2,p.z),0x2a2c34]);}}
  // banner bridge across the second-longest straight
  const rn=runsL.find(rr=>rr!==startRun&&(rr[1]-rr[0])*B.step>40);if(rn){const i=((Math.round((rn[0]+rn[1])/2))%B.n+B.n)%B.n,w=wallOff(i)+.8;const Mx=frame(B,i,1,0,0);
   for(const s of[-1,1]){posts.push([new THREE.BoxGeometry(1,8.6,1),new THREE.Matrix4().multiplyMatrices(Mx,M(0,4.3,s*w)),0x2a2c34]);}
   posts.push([new THREE.BoxGeometry(1.2,1.9,w*2+1),new THREE.Matrix4().multiplyMatrices(Mx,M(0,8.2,0)),0x22252e]);
   const t=new V(B.tx[i],0,B.tz[i]),n=new V(B.nx[i],0,B.nz[i]),c0=new V(B.x[i],B.y[i],B.z[i]);
   for(const fs of[-1,1]){const o=t.clone().multiplyScalar(fs*.62);let k=0;for(let x=-w+.4;x<w-4;x+=w-.4,k++){const p0=c0.clone().add(o).addScaledVector(n,x),p1=c0.clone().add(o).addScaledVector(n,Math.min(w-.4,x+w-.6));quad(fs<0?p1:p0,fs<0?p0:p1,7.35,9.05,(cell+k)%8,false);}}}}
 if(bp.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(bu,2));g.setIndex(bi);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:atlas,roughness:.45,metalness:0,envMapIntensity:.6,emissive:night?0xffffff:0,emissiveMap:night?atlas:null,emissiveIntensity:night?.55:0}));m.castShadow=q>=1;m.receiveShadow=true;grp.add(m);}
 if(posts.length){const m=new THREE.Mesh(merge(posts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.7}));m.castShadow=q>=1;grp.add(m);}
 /* ---------- tyre walls on the outside of tight corners ---------- */
 if(T.wall!=='none'&&T.wall!=='neon'){const tp=[];for(let i=0;i<B.n;i+=3){const cv=B.curv[i];if(Math.abs(cv)<.018||(B.flag[i]&(F.gap|F.noWall)))continue;const side=-Math.sign(cv),u=side*(wallOff(i)+.75);
   const x=B.x[i]+B.nx[i]*u,z=B.z[i]+B.nz[i]*u,qq=query(C,x,z);if(qq.ok&&qq.B!==B&&Math.abs(qq.u)<qq.lim+1.5)continue;tp.push([x,B.y[i]-.1,z,i]);}
  if(tp.length){const L=[];for(let k=0;k<4;k++)L.push([new THREE.CylinderGeometry(.56,.56,.31,q>=1?12:8,1,true),M(0,.17+k*.33,0),k%2?0xf2f2f2:0x18181c]);L.push([new THREE.RingGeometry(.3,.56,q>=1?12:8).rotateX(-Math.PI/2),M(0,1.33,0),0x18181c]);const g=merge(L);
   const im=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}),tp.length);const c=new THREE.Color();
   tp.forEach(([x,y,z,i],j)=>{im.setMatrixAt(j,M(x,y,z,0,j,0));c.set(j%5===0?T.curb[0]:0xffffff);im.setColorAt(j,c);});im.castShadow=q>=1;im.receiveShadow=true;im.computeBoundingSphere();grp.add(im);}}
}

/* ---------- distant mountain rings (two layers, atmospheric haze baked in the shader) ---------- */
export function horizon(W,C,T,rnd){const key=T.key;if(key==='city'||key==='sky')return;
 const cx=(C.bbox[0]+C.bbox[2])/2,cz=(C.bbox[1]+C.bbox[3])/2,rad0=Math.max(C.bbox[2]-C.bbox[0],C.bbox[3]-C.bbox[1])*.5;
 const P={seaside:[0x5a7a6a,140,.6],jungle:[0x2e5a40,220,.9],snow:[0x8a9ab8,380,1],desert:[0xb0683a,160,.6],volcano:[0x2a1814,260,.9],haunted:[0x1e1a30,170,.8],arena:[0xa0603a,140,.6]}[key]||[0x6a7a8a,150,.6];
 const fogC=new THREE.Color(T.fog[0]),sky=new THREE.Color(T.sky[1]),sun=new V(...T.sun).normalize();
 const layers=[{r:rad0+620,h:P[1],seed:1,haze:.55},{r:rad0+420,h:P[1]*.6,seed:2,haze:.3}];
 for(const L of layers){const N=240,pos=[],hh=[],idx=[];
  for(let k=0;k<=N;k++){const a=k/N*Math.PI*2;let h=(fbm(Math.cos(a)*3+L.seed*7,Math.sin(a)*3,5)*.5+.5);h=Math.pow(h,1.3)*L.h*P[2]+L.h*.12;
   if(key==='seaside'&&Math.cos(a)>.1)h*=sstep(.5,.1,Math.cos(a))*.3;
   const x=cx+Math.cos(a)*L.r,z=cz+Math.sin(a)*L.r;pos.push(x,-30,z,x,h-10,z);hh.push(0,h/(L.h*1.1));if(k<N){const o=k*2;idx.push(o,o+2,o+1,o+1,o+2,o+3);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('hh',new THREE.Float32BufferAttribute(hh,1));g.setIndex(idx);
  const m=new THREE.ShaderMaterial({uniforms:{uM:{value:new THREE.Color(P[0])},uF:{value:fogC},uS:{value:sky},uSun:{value:sun},uHaze:{value:L.haze},uSnow:{value:key==='snow'?1:key==='jungle'||key==='haunted'?0:.35}},side:THREE.DoubleSide,
   vertexShader:'attribute float hh;varying float vH;varying vec3 vW;void main(){vH=hh;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`uniform vec3 uM,uF,uS,uSun;uniform float uHaze,uSnow;varying float vH;varying vec3 vW;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    void main(){vec2 q=vW.xz*.02+vec2(0.,vW.y*.05);float rid=n(q)*.6+n(q*3.1)*.3+n(q*9.)*.1;
     vec3 c=uM*(.7+rid*.6);float snow=uSnow*smoothstep(.55,.75,vH+rid*.15);c=mix(c,vec3(.95,.97,1.),snow);
     c*=.8+.25*rid;
     float haze=clamp(uHaze+(1.-vH)*.55,0.,1.);c=mix(c,mix(uF,uS,.4),haze);gl_FragColor=vec4(c,1.);}`});
  const me=new THREE.Mesh(g,m);me.frustumCulled=false;me.renderOrder=-5;W.grp.add(me);}}

/* ---------- grass tufts / dry shrubs near the road (MEDIUM and up), swaying in the wind ---------- */
export function grassTufts(W,C,T,hgt,q){const key=T.key;if(q<1||!['seaside','jungle','haunted','desert','arena'].includes(key)||!C.main)return;
 const B=C.main,r=rng(91),N=q>=2?6000:2600,dry=key==='desert'||key==='arena';
 const pos=[],col=[];const blades=dry?7:6;
 for(let b=0;b<blades;b++){const a=b/blades*Math.PI*2+r(),lean=.15+r()*.25,h=(dry?.35:.45)+r()*.35,bx=Math.cos(a)*.08,bz=Math.sin(a)*.08,tx=Math.cos(a)*lean,tz=Math.sin(a)*lean,w=.05;
  const px=-Math.sin(a)*w,pz=Math.cos(a)*w;pos.push(bx+px,0,bz+pz, bx-px,0,bz-pz, tx,h,tz);col.push(.45,.45,.45, .45,.45,.45, 1.15,1.15,1.05);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
 {const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);}// soft lighting like a ground cover
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,side:THREE.DoubleSide});const U={uT:{value:0}};W.grassU=U;
 mat.onBeforeCompile=s=>{Object.assign(s.uniforms,U);s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>',`#include <begin_vertex>
  {vec4 ip=instanceMatrix*vec4(0.,0.,0.,1.);float w=sin(uT*1.7+ip.x*.13+ip.z*.11)*.5+sin(uT*3.1+ip.x*.4)*.2;transformed.x+=w*position.y*.35;transformed.z+=w*position.y*.15;}`);};
 mat.customProgramCacheKey=()=>'grass';
 const im=new THREE.InstancedMesh(g,mat,N);const base=new THREE.Color(dry?0xb09a5a:T.ground2),alt=new THREE.Color(dry?0x8a7a4a:T.ground),c=new THREE.Color(),m=new THREE.Matrix4(),qq=new THREE.Quaternion(),sc=new V();let n=0;
 for(let t=0;t<N*3&&n<N;t++){const i=(r()*B.n)|0,side=r()<.5?-1:1,u=side*(B.w[i]+B.sh[i]+1.6+Math.pow(r(),1.6)*(dry?60:42)),x=B.x[i]+B.nx[i]*u+(r()-.5)*3,z=B.z[i]+B.nz[i]*u+(r()-.5)*3;
  const qr=query(C,x,z);if(qr.ok&&Math.abs(qr.u)<qr.lim+1.2)continue;if(W.occupied&&W.occupied.some(o=>(o.x-x)**2+(o.z-z)**2<o.r*o.r))continue;const y=hgt(x,z);if(C.seaY!==undefined&&y<C.seaY+.4)continue;
  const s=(dry?.8:.7)+r()*.9;qq.setFromAxisAngle(_y,r()*6.28);m.compose(sc.set(x,y-.03,z),qq,new V(s,s*(.8+r()*.5),s));im.setMatrixAt(n,m);c.copy(base).lerp(alt,r()).multiplyScalar(dry?1:1.1);if(!dry&&r()<.04)c.setHex([0xffe060,0xff70a0,0xffffff][(r()*3)|0]);im.setColorAt(n,c);n++;}
 im.count=n;im.receiveShadow=true;im.computeBoundingSphere();W.grp.add(im);}
