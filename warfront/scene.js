// IRON VANGUARD — scene construction for the valley: sky, splat-shaded terrain + far ridges, river, villages (merged walls,
// pitched roofs, instanced windows), bridge truss, props, destructible instances, chunked tree/bush LOD and a camera-following grass field.
import * as THREE from '../vendor/three.module.min.js';
import {V,PI,cl,merge,M4,BX,CY,SP,prof,mulberry,fbm} from './util.js';
import {EXT,N,WL,DECK,BRIDGE,HQ,POINTS,PLAY,riverZ} from './terrain.js';

/* ================= sky: gradient + sun glare + self-shadowed drifting clouds ================= */
const SKY_V='varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const SKY_F=`uniform vec3 uTop,uMid,uHor,uSunC,uSun,uCloudC,uGround;uniform float uCloud,uT,uSunSize;varying vec3 vP;
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*nn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){vec3 d=normalize(vP);float y=d.y;float s=max(0.,dot(d,uSun));
 vec3 c=mix(uHor,uMid,smoothstep(0.,.3,y));c=mix(c,uTop,smoothstep(.25,.9,y));
 float hz=1.-smoothstep(0.,.5,abs(y));
 c+=uSunC*(pow(s,4.)*.2*(.35+hz)+pow(s,30.)*.35+pow(s,400.)*1.2);
 c+=uSunC*smoothstep(1.-uSunSize,1.-uSunSize*.5,s)*9.;
 if(y>0.){vec2 uv=d.xz/(y+.12)*1.15+vec2(uT*.006,uT*.002);float f=fbm(uv);float cov=smoothstep(.46-uCloud*.3,.86,f);
  vec2 sd=normalize(uSun.xz+1e-4)*.11;float f2=fbm(uv+sd);float lit=clamp(.5+(f-f2)*3.2,0.,1.);
  float fade=smoothstep(0.,.14,y);vec3 dark=uCloudC*.38+uHor*.2;vec3 cc=mix(dark,uCloudC,lit);
  cc+=uSunC*pow(s,6.)*.55*(1.-cov*.4)+uSunC*pow(s,14.)*(1.-cov)*1.6;
  c=mix(c,cc,cov*fade*.96);}
 else c=mix(uHor,uGround,smoothstep(0.,-.25,y));
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
// golden hour: low warm sun raking across the valley, haze, broken cloud
export const LOOK={name:'GOLDEN HOUR',fog:{c:0xc4bca8,d:.0019},hemi:{s:0xbccbe2,g:0x6a5640,i:.85},sun:{c:0xffdcae,i:3.0,dir:[.62,.5,.36]},sky:{top:0x3c5f9c,mid:0x8ea8c6,hor:0xeccfa6,clouds:.6,cloud:0xfff0e0,sunK:1.35},exp:1.0,env:.62,tint:[1.04,1,.94],sat:1.08};
export function makeSky(look){const U={uTop:{value:new THREE.Color(look.sky.top)},uMid:{value:new THREE.Color(look.sky.mid)},uHor:{value:new THREE.Color(look.sky.hor)},uGround:{value:new THREE.Color(look.fog.c)},uSun:{value:new V(...look.sun.dir).normalize()},uSunC:{value:new THREE.Color(look.sun.c).multiplyScalar(look.sky.sunK??1)},
  uCloudC:{value:new THREE.Color(look.sky.cloud??0xffffff)},uCloud:{value:look.sky.clouds??.5},uT:{value:0},uSunSize:{value:.0009}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(1800,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,vertexShader:SKY_V,fragmentShader:SKY_F}));m.renderOrder=-10;m.frustumCulled=false;m.userData.U=U;return m;}

/* ================= tree geometry (atlas regions in uv space) ================= */
const ATL={bark:[0,.25,0,1],pine:[.25,.625,.5,1],leaf:[.625,1,.625,1],dense:[.625,1,.5,.625],pineI:[.25,.5,0,.5],oakI:[.5,1,0,.5]};
function atlasUV(g,r){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,r[0]+cl(uv.getX(i),0,1)*(r[1]-r[0]),r[2]+cl(uv.getY(i),0,1)*(r[3]-r[2]));return g;}
// soft round shading for foliage: normals point out of the crown and up
function crownNormals(g,cy){const p=g.attributes.position,n=g.attributes.normal,v=new V();for(let i=0;i<p.count;i++){v.set(p.getX(i),(p.getY(i)-cy)*.8+1.1,p.getZ(i)).normalize();n.setXYZ(i,v.x,v.y,v.z);}return g;}
// world-space box mapping (texture scale sc metres) for merged hard-surface geometry
function boxUV(g,sc){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let a,b;if(ax>=ay&&ax>=az){a=p.getZ(i);b=p.getY(i);}else if(ay>=az){a=p.getX(i);b=p.getZ(i);}else{a=p.getX(i);b=p.getY(i);}u.setXY(i,a/sc,b/sc);}u.needsUpdate=true;return g;}
function pineHiGeo(r){const trunk=atlasUV(new THREE.CylinderGeometry(.07,.3,7.8,7,1,true).translate(0,3.9,0),ATL.bark);
 const cr=[{geo:atlasUV(new THREE.ConeGeometry(.95,5.4,7,1,true).translate(0,5.1,0),ATL.dense)}];
 for(let j=0;j<7;j++){const y=2.2+j*.8,len=2.75*(1-j/7.8)+.35,n=j>4?5:6;for(let k=0;k<n;k++){const th=k/n*PI*2+j*.55+r()*.3,droop=.3+r()*.3,roll=(r()-.5)*.6;
   const pl=atlasUV(new THREE.PlaneGeometry(len*.9,len).translate(0,len/2,0),ATL.pine);
   const m=new THREE.Matrix4().makeRotationY(th).multiply(new THREE.Matrix4().makeRotationX(PI/2+droop)).multiply(new THREE.Matrix4().makeRotationY(roll));m.setPosition(0,y,0);cr.push({geo:pl,m});}}
 return merge([{geo:trunk},{geo:crownNormals(merge(cr),4.6)}]);}
function oakHiGeo(r){const tr=[{geo:atlasUV(new THREE.CylinderGeometry(.17,.36,4.6,7,1,true).translate(0,2.3,0),ATL.bark)}];
 for(const[a,b,len]of[[.7,0,2.6],[-.6,2.1,2.4],[.5,4,2.2]]){const l=atlasUV(new THREE.CylinderGeometry(.05,.13,len,5,1,true).translate(0,len/2,0),ATL.bark);const m=new THREE.Matrix4().makeRotationY(b).multiply(new THREE.Matrix4().makeRotationZ(a));m.setPosition(0,3.4,0);tr.push({geo:l,m});}
 const cr=[{geo:atlasUV(new THREE.IcosahedronGeometry(1.5,0).scale(1.45,1,1.45).translate(0,5.4,0),ATL.dense)}];
 for(let i=0;i<13;i++){const a=r()*PI*2,e=r()*.9-.25,px=Math.cos(a)*Math.cos(e)*2.3,py=5.3+Math.sin(e)*1.7,pz=Math.sin(a)*Math.cos(e)*2.3,s=1.9+r()*.9,ax=r()*PI,ay=r()*PI;
  for(let k=0;k<3;k++){const pl=atlasUV(new THREE.PlaneGeometry(s,s),ATL.leaf);const m=new THREE.Matrix4().makeRotationY(ay+k*PI/3).multiply(new THREE.Matrix4().makeRotationX(ax*.5+(k===2?PI/2:0)));m.setPosition(px,py,pz);cr.push({geo:pl,m});}}
 return merge([...tr,{geo:crownNormals(merge(cr),5)}]);}
function impGeo(w,h,reg,n=3){const L=[];for(let k=0;k<n;k++){const pl=atlasUV(new THREE.PlaneGeometry(w,h).translate(0,h/2,0),reg);const nn=pl.attributes.normal,p=pl.attributes.position,v=new V();for(let i=0;i<p.count;i++){v.set(p.getX(i)/w*1.6,.9,.35).normalize();nn.setXYZ(i,v.x,v.y,v.z);}L.push({geo:pl,m:new THREE.Matrix4().makeRotationY(k*PI/n)});}return merge(L);}

const std=o=>new THREE.MeshStandardMaterial(o);
const Z0=new THREE.Matrix4().makeScale(0,0,0);
const NOISE_GLSL='float th(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float tn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(th(i),th(i+vec2(1,0)),f.x),mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x),f.y);}';

/* ================= build ================= */
export function buildWorld(W,TX,q){const G=new THREE.Group(),S={group:G,W,q,chunks:[],timeU:{value:0}};const r=mulberry(99);
 // ----- splat (1024²): R = roads, distance-coded (1 on the centre line) so the shader can cut tyre ruts; G = tank tracks across the fields
 // (distance-coded); B = churned ground (~.3) and shell craters (radial .36 at the rim -> 1 at the centre)
 const RS=1024,rc=document.createElement('canvas');rc.width=rc.height=RS;const rx=rc.getContext('2d',{willReadFrequently:true});rx.fillStyle='#000';rx.fillRect(0,0,RS,RS);const px=x=>(x+EXT)/(2*EXT)*RS,mpx=RS/(2*EXT);
 rx.globalCompositeOperation='lighten';rx.lineCap=rx.lineJoin='round';
 const coded=(path,width,ch,steps)=>{for(let k=0;k<steps;k++){const v=Math.round(255*(k+1)/steps);rx.strokeStyle=ch==='r'?`rgb(${v},0,0)`:`rgb(0,${v},0)`;rx.lineWidth=Math.max(.6,width*(1-k/steps)*mpx);rx.beginPath();path.forEach(([x,z],i)=>i?rx.lineTo(px(x),px(z)):rx.moveTo(px(x),px(z)));rx.stroke();}};
 for(const rd of W.roads)coded(rd,6.5,'r',13);rx.fillStyle='#ff0000';for(const h of HQ)rx.fillRect(px(h.x-34),px(h.z-22),68*mpx,44*mpx);
 const tr=mulberry(404);for(let i=0;i<14;i++){const t=i%2,h=HQ[t],p=POINTS[tr()*POINTS.length|0];let x=h.x+(tr()-.5)*50,z=h.z+(t?30:-30)*(.5+tr()),a=Math.atan2(p.z-z,p.x-x);const pts=[[x,z]];
  for(let s=0;s<120;s++){a+=(Math.atan2(p.z-z,p.x-x)-a)*.12+(tr()-.5)*.3;x+=Math.cos(a)*7;z+=Math.sin(a)*7;pts.push([x,z]);if(Math.hypot(p.x-x,p.z-z)<18)break;}coded(pts,3.6,'g',10);}
 const blob=(x,z,r,v)=>{const g=rx.createRadialGradient(px(x),px(z),0,px(x),px(z),r*mpx);g.addColorStop(0,`rgb(0,0,${v|0})`);g.addColorStop(.6,`rgb(0,0,${v|0})`);g.addColorStop(1,'rgb(0,0,0)');rx.fillStyle=g;rx.beginPath();rx.arc(px(x),px(z),r*mpx,0,7);rx.fill();};
 for(const p of POINTS)if(p.kind!=='bridge')blob(p.x,p.z,15,74);for(const h of HQ)for(let i=0;i<10;i++)blob(h.x+(tr()-.5)*60,h.z+(tr()-.5)*36,8+tr()*8,70);
 for(let i=0;i<80;i++){const x=(tr()*2-1)*(PLAY-40),z=(tr()*2-1)*160;blob(x,z,4+tr()*9,36+tr()*40);}
 for(const c of W.craters||[]){const cx=px(c.x),cz=px(c.z),R=c.r*mpx,g=rx.createRadialGradient(cx,cz,0,cx,cz,R*1.9);g.addColorStop(0,'rgb(0,0,255)');g.addColorStop(.52,'rgb(0,0,92)');g.addColorStop(.75,'rgb(0,0,76)');g.addColorStop(1,'rgb(0,0,0)');rx.fillStyle=g;rx.beginPath();rx.arc(cx,cz,R*1.9,0,7);rx.fill();}
 rx.globalCompositeOperation='source-over';
 S.roadData=rx.getImageData(0,0,RS,RS).data;S.RS=RS;const roadTex=new THREE.CanvasTexture(rc);roadTex.colorSpace=THREE.NoColorSpace;
 S.onRoad=(x,z)=>{const i=cl(px(x)|0,0,RS-1),j=cl(px(z)|0,0,RS-1),k=(j*RS+i)*4;return S.roadData[k]>20||S.roadData[k+1]>70||S.roadData[k+2]>60;};
 // ----- terrain mesh: grass / lush grass / rock / dirt road / mud blended per pixel, ruts + tank tracks + craters + puddles, per-layer normals and wetness
 const seg=q>=2?224:q===1?176:128,gg=new THREE.PlaneGeometry(EXT*2,EXT*2,seg,seg);gg.rotateX(-PI/2);const gp=gg.attributes.position,aF=new Float32Array(gp.count*3);
 for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=gp.getZ(i);gp.setY(i,W.height(x,z));aF[i*3]=cl(W.forestK(x,z)-.15,0,1);}
 gg.setAttribute('aF',new THREE.BufferAttribute(aF,3));gg.computeVertexNormals();
 const nrm=TX.meadow.normalMap.clone();nrm.needsUpdate=true;nrm.repeat.set(EXT*2/6,EXT*2/6);
 const tm=std({map:TX.meadow.map,normalMap:nrm,normalScale:new THREE.Vector2(1,1),roughness:.95});
 tm.onBeforeCompile=s=>{Object.assign(s.uniforms,{uG2:{value:TX.grass.map},uRock:{value:TX.rock.map},uRockN:{value:TX.rock.normalMap},uMud:{value:TX.mud.map},uMudN:{value:TX.mud.normalMap},uDirt:{value:TX.dirt.map},uRoad:{value:roadTex},uExt:{value:EXT},uWL:{value:WL}});
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aF;varying vec3 vF,vWP,vWN;').replace('#include <fog_vertex>','#include <fog_vertex>\nvF=aF;vWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normal;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vF,vWP,vWN;uniform sampler2D uG2,uRock,uRockN,uMud,uMudN,uDirt,uRoad;uniform float uExt,uWL;\n'+NOISE_GLSL)
   .replace('#include <map_fragment>',`vec2 wu=vWP.xz/7.;float nz=tn(vWP.xz*.45),nz2=tn(vWP.xz*.09+5.);
 float far=smoothstep(30.,170.,distance(vWP,cameraPosition));vec4 col=texture2D(map,wu);col=mix(col,texture2D(map,wu*.19+.37)*.55+texture2D(uG2,wu*.13+.71)*.45,far*.8);vec4 g2=texture2D(uG2,wu*.63+.31);float mk=smoothstep(.3,.7,tn(vWP.xz*.028)*.7+tn(vWP.xz*.11)*.3);col=mix(col,g2,mk*.75);
 col.rgb*=mix(vec3(1.),vec3(.6,.54,.4),vF.r);float mac=tn(vWP.xz*.006+3.);col.rgb*=mix(vec3(1.1,1.03,.82),vec3(.9,1.,.96),smoothstep(.25,.75,mac));
 float sl=1.-normalize(vWN).y;float tRk=smoothstep(.15,.3,sl+(tn(vWP.xz*.21)-.5)*.12);col=mix(col,texture2D(uRock,wu*.8),tRk);
 vec2 su=(vWP.xz+uExt)/(2.*uExt);vec2 suv=vec2(su.x,1.-su.y);vec4 sp=texture2D(uRoad,suv);vec4 mud=texture2D(uMud,wu*.9);
 float churn=smoothstep(.04,.28,sp.b+(nz-.5)*.14)*(1.-tRk*.5);float crat=smoothstep(.42,.95,sp.b);col=mix(col,mud,churn*.85);
 float rd=smoothstep(.03,.2,sp.r+(nz-.5)*.18)*(1.-tRk*.6);float dd=(1.-sp.r)*3.25;col=mix(col,texture2D(uDirt,wu*1.3)*vec4(1.04,1.,.94,1.),rd);
 float rut=(1.-smoothstep(.12,.42,abs(dd-1.2)))*step(.06,sp.r)*rd;float td=(1.-sp.g)*1.8;float trk=(1.-smoothstep(.16,.42,abs(td-1.25)))*step(.06,sp.g)*(.55+.45*nz)*(1.-tRk);
 float ruts=max(rut,trk);col=mix(col,mud*vec4(.8,.76,.72,1.),ruts*.85);col.rgb=mix(col.rgb,col.rgb*vec3(.5,.45,.4),crat*.75);
 float wet=1.-smoothstep(uWL+.4,uWL+2.2,vWP.y+(tn(vWP.xz*.3)-.5)*.6);col=mix(col,mud*vec4(.82,.8,.78,1.),wet);col.rgb*=.86+.26*tn(vWP.xz*.013);
 float tPud=clamp(smoothstep(.58,.66,tn(vWP.xz*.32+7.))*ruts+smoothstep(.82,.96,sp.b)+smoothstep(.64,.72,nz2)*churn*.6,0.,1.);col.rgb=mix(col.rgb,col.rgb*.4+vec3(.024,.028,.032),tPud*.85);
 float tWet=clamp(max(max(wet,ruts*.7),max(churn*.3,tPud)),0.,1.);float tMud=clamp(max(max(churn,ruts),max(wet,crat)),0.,1.);
 float ee=1.2/1024.;vec2 tGrad=vec2(texture2D(uRoad,suv+vec2(ee,0.)).b-texture2D(uRoad,suv-vec2(ee,0.)).b,texture2D(uRoad,suv-vec2(0.,ee)).b-texture2D(uRoad,suv+vec2(0.,ee)).b)/(ee*4.*uExt)*step(.3,sp.b);
 diffuseColor*=col;`)
   .replace('#include <roughnessmap_fragment>','float roughnessFactor=mix(mix(roughness,.6,tWet),.08,tPud);')
   .replace('#include <normal_fragment_maps>',`vec2 wn=vec2(vWP.x,-vWP.z)/7.;vec3 mapN=mix(texture2D(normalMap,vNormalMapUv).xyz,texture2D(uRockN,wn*.8).xyz,tRk);mapN=mix(mapN,texture2D(uMudN,wn*.9).xyz,tMud*.9)*2.-1.;
 mapN.xy*=normalScale*(1.-tPud*.85);normal=normalize(tbn*mapN);normal=normalize(normal+(viewMatrix*vec4(tGrad.x*2.6,0.,tGrad.y*2.6,0.)).xyz);`);};
 const ground=new THREE.Mesh(gg,tm);ground.receiveShadow=true;G.add(ground);S.ground=ground;
 // ----- far ridges beyond the playable square
 {const fg=new THREE.PlaneGeometry(4200,4200,70,70);fg.rotateX(-PI/2);const p=fg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),e=Math.max(Math.abs(x),Math.abs(z));let y;
   if(e<EXT-8)y=-40;else{const k=Math.min(1,(e-EXT+8)/500);y=W.height(cl(x,-EXT+1,EXT-1),cl(z,-EXT+1,EXT-1))*(1-k)+k*(70+fbm(x*.004,z*.004,4,2)*110)+fbm(x*.015,z*.015,3,7)*14*k;}p.setY(i,y);}
  fg.computeVertexNormals();const fm=std({map:TX.rock.map,color:0x8a9478,roughness:1});fm.map=TX.meadow.map.clone();fm.map.repeat.set(300,300);fm.map.needsUpdate=true;const fr=new THREE.Mesh(fg,fm);fr.receiveShadow=false;G.add(fr);}
 // ----- river water: two drifting ripple layers, fresnel opacity, murky green-brown body
 {const wn=TX.waterN.clone();wn.needsUpdate=true;wn.repeat.set(70,70);const wm=std({color:0x2a3a30,roughness:.05,metalness:.1,normalMap:wn,normalScale:new THREE.Vector2(.32,.32),transparent:true,opacity:.9,envMapIntensity:1.5});
  wm.onBeforeCompile=s=>{s.uniforms.uT=S.timeU;s.fragmentShader='uniform float uT;\n'+s.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 mapN=texture2D(normalMap,vNormalMapUv).xyz*2.-1.;vec3 m2=texture2D(normalMap,vNormalMapUv*.31+vec2(uT*.0035,-uT*.005)).xyz*2.-1.;
 mapN=normalize(vec3(mapN.xy+m2.xy*.8,mapN.z));mapN.xy*=normalScale;normal=normalize(tbn*mapN);`)
   .replace('#include <opaque_fragment>','float fres=pow(1.-clamp(dot(normalize(vViewPosition),normal),0.,1.),4.);diffuseColor.a=mix(.8,.985,fres);\n#include <opaque_fragment>');};
  const w=new THREE.Mesh(new THREE.PlaneGeometry(EXT*2+200,EXT*2+200),wm);w.rotation.x=-PI/2;w.position.y=WL;w.renderOrder=1;G.add(w);S.water=wm;}
 // ----- generic visible boxes (bunker, bridge deck, piers, rails)
 {const acc={};const quads=(A,b,uvs,col)=>{const{x0,y0,z0,x1,y1,z1}=b;const F=[[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0]],[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0]],[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0]],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0]],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1]],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1]]];
   for(const f of F){const base=A.p.length/3;for(let k=0;k<4;k++){const v=f[k],nn=f[4];A.p.push(...v);A.n.push(...nn);A.u.push((nn[0]?v[2]:v[0])/uvs,(nn[1]?v[2]:v[1])/uvs);const ao=nn[1]===0?.62+.38*cl((v[1]-y0)/2,0,1):1;A.c.push(col*ao,col*ao,col*ao);}A.i.push(base,base+1,base+2,base,base+2,base+3);}};
  for(const b of W.boxes){if(!b.vis)continue;const m=b.mat==='metal'?'metal':b.mat==='stone'?'stone':'concrete';const A=acc[m]=acc[m]||{p:[],n:[],u:[],c:[],i:[]};quads(A,b,m==='metal'?2:3.2,m==='metal'?.55:.9);}
  for(const k in acc){const A=acc[k],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(A.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));g.setIndex(A.i);
   const me=new THREE.Mesh(g,std({map:TX[k].map,normalMap:TX[k].normalMap,roughness:k==='metal'?.5:.92,metalness:k==='metal'?.4:0,vertexColors:true}));me.castShadow=me.receiveShadow=true;G.add(me);}}
 // ----- houses: walls, roofs, trims, windows, doors, chimneys
 {const walls={plaster:[],stone:[],wood:[]},roofs=[],trims=[],doors=[],wins=[];
  for(const h of W.houses){const{x,z,w,d,y,h:wh}=h,c=new THREE.Color(h.col||0xe0d4bc),wm=walls[h.kind==='barn'?'wood':W.houses.indexOf(h)%3===0&&h.kind!=='chapel'?'stone':h.kind==='chapel'?'stone':'plaster'];
   wm.push({geo:BX(w,wh+1.5,d),m:M4(x,y+(wh-1.5)/2,z),c,us:w/3,vs:(wh+1.5)/3});trims.push({geo:BX(w+.12,.5,d+.12),m:M4(x,y+.15,z),c:0x6a6460},{geo:BX(w+.2,.2,d+.2),m:M4(x,y+wh-.05,z),c:0xd8d0c0});
   const alongX=w>=d,span=alongX?d:w,len=alongX?w:d,rise=span*(h.kind==='chapel'?.62:h.kind==='barn'?.5:.42),ov=.5;
   // roof: two slabs + gables
   const a=Math.atan2(rise,span/2),Lh=span/2+ov,sl=Lh/Math.cos(a),cy=y+wh+rise-rise*Lh/span;for(const s of[-1,1])roofs.push({geo:BX(len+ov*2,.22,sl),m:alongX?M4(x,cy,z+s*Lh/2,s*a,0,0):M4(x+s*Lh/2,cy,z,0,PI/2,0).multiply(M4(0,0,0,s*a,0,0)),c:new THREE.Color(h.roof||0x7a3a24),us:(len+ov*2)/2.2,vs:sl/2.2});
   const gab=new THREE.Shape();gab.moveTo(-span/2,0);gab.lineTo(span/2,0);gab.lineTo(0,rise);gab.closePath();const gg=new THREE.ExtrudeGeometry(gab,{depth:.3,bevelEnabled:false});gg.translate(0,0,-.15);
   for(const s of[-1,1])wm.push({geo:gg,m:alongX?M4(x+s*(len/2-.15),y+wh,z,0,PI/2,0):M4(x,y+wh,z+s*(len/2-.15)),c,us:.3,vs:.3});
   if(h.kind!=='barn'&&r()<.75)trims.push({geo:BX(.7,1.8,.7),m:M4(x+(alongX?len*.25:span*.2),y+wh+rise*.6,z+(alongX?span*.2:len*.25)),c:0x8a7a6a});
   if(h.kind==='chapel'){const tz=z-7.6;wm.push({geo:BX(4,17,4),m:M4(x,y+8.5,tz),c,us:4/3,vs:17/3});roofs.push({geo:new THREE.ConeGeometry(3.1,5,4).rotateY(PI/4),m:M4(x,y+19.5,tz),c:new THREE.Color(0x3a3c40)});trims.push({geo:BX(.18,1.6,.18),m:M4(x,y+22.6,tz),c:0x2a2a2a},{geo:BX(.9,.18,.18),m:M4(x,y+22.9,tz),c:0x2a2a2a});
    for(const s of[-1,1])doors.push({geo:new THREE.PlaneGeometry(1.4,2.2),m:M4(x+s*2.02,y+13.5,tz,0,s*PI/2,0)},{geo:new THREE.PlaneGeometry(1.4,2.2),m:M4(x,y+13.5,tz+s*2.02,0,s>0?0:PI,0)});}
   // doors (front long side) + windows on all sides
   const fz=alongX?z+d/2+.02:z,fx=alongX?x:x+w/2+.02;doors.push({geo:new THREE.PlaneGeometry(h.kind==='barn'?3.6:1.3,h.kind==='barn'?3.6:2.3),m:alongX?M4(fx,y+(h.kind==='barn'?1.8:1.15),fz):M4(fx,y+1.15,fz,0,PI/2,0)});
   const floors=wh>5?2:1;for(let f=0;f<floors;f++){const wy=y+1.05+f*3;for(const[side,L]of[['n',w],['s',w],['w',d],['e',d]]){const n=Math.max(1,Math.floor(L/2.7));for(let k=0;k<n;k++){const c2=-L/2+(k+.5)*L/n;if(f===0&&Math.abs(c2)<1.3&&((alongX&&side==='s')||(!alongX&&side==='e')))continue;if(h.kind==='barn'&&f===0)continue;
     const px2=side==='w'?x-w/2-.02:side==='e'?x+w/2+.02:x+c2,pz2=side==='n'?z-d/2-.02:side==='s'?z+d/2+.02:z+c2;wins.push({x:px2,y:wy,z:pz2,ry:{n:PI,s:0,w:-PI/2,e:PI/2}[side],v:r()<.15?3:r()*3|0});}}}}
  for(const k in walls)if(walls[k].length){const t=TX[k==='wood'?'wood':k];const me=new THREE.Mesh(merge(walls[k]),std({map:t.map,normalMap:t.normalMap,roughness:.92,vertexColors:true}));me.castShadow=me.receiveShadow=true;G.add(me);}
  const rm=new THREE.Mesh(merge(roofs),std({map:TX.tiles.map,normalMap:TX.tiles.normalMap,roughness:.82,vertexColors:true}));rm.castShadow=rm.receiveShadow=true;G.add(rm);
  const trm=new THREE.Mesh(merge(trims),std({color:0xffffff,roughness:.8,vertexColors:true}));trm.castShadow=true;trm.receiveShadow=true;G.add(trm);
  const dm=new THREE.Mesh(merge(doors),std({color:0x3a2a1e,map:TX.wood.map,roughness:.8}));G.add(dm);
  const geo=new THREE.PlaneGeometry(1.15,1.35);const byV=[[],[],[],[]];for(const w of wins)byV[w.v&3].push(w);const wmat=std({map:TX.win,roughness:.25,metalness:.2,envMapIntensity:1.3});
  byV.forEach((list,vi)=>{if(!list.length)return;const g=geo.clone(),uv=g.attributes.uv,ox=(vi%2)*.5,oy=vi<2?.5:0;for(let i=0;i<uv.count;i++)uv.setXY(i,ox+uv.getX(i)*.5,oy+uv.getY(i)*.5);
   const im=new THREE.InstancedMesh(g,wmat,list.length);list.forEach((w,i)=>im.setMatrixAt(i,M4(w.x,w.y+.62,w.z,0,w.ry,0)));im.receiveShadow=true;G.add(im);});}
 // ----- bridge: riveted steel through-truss (Pratt panels, inclined end posts, top struts + X sway bracing, floor beams, gusset plates), rusty paint
 {const parts=[],B=BRIDGE,np=8,L=B.hl*2,z0=B.z-B.hl,Ht=6.6,y0=DECK+.1,up=new V(0,1,0),side=new V(1,0,0);
  const memb=(a,b,w,h,ibeam=true)=>{const d=new V().subVectors(b,a),l=d.length(),m=new THREE.Matrix4().lookAt(a,b,Math.abs(d.y)/l>.98?side:up).setPosition(a.clone().add(b).multiplyScalar(.5));
   if(ibeam)parts.push({geo:BX(w,.07,l),m:m.clone().multiply(M4(0,h/2-.035,0))},{geo:BX(w,.07,l),m:m.clone().multiply(M4(0,-h/2+.035,0))},{geo:BX(.06,h-.12,l),m});else parts.push({geo:BX(w,h,l),m});};
  const zs=i=>z0+L*i/np;
  for(const s of[-1,1]){const x=B.x+s*(B.hw-.15),P=(i,top)=>new V(x,top?y0+Ht:y0,zs(i));
   memb(P(0,0),P(np,0),.42,.62);memb(P(1,1),P(np-1,1),.5,.56);memb(P(0,0),P(1,1),.5,.56);memb(P(np,0),P(np-1,1),.5,.56);
   for(let i=1;i<np;i++){memb(P(i,0),P(i,1),.3,.32);if(i<np/2)memb(P(i,1),P(i+1,0),.26,.3);else if(i>np/2)memb(P(i,1),P(i-1,0),.26,.3);}
   memb(P(np/2,1),P(np/2-1,0),.22,.26);memb(P(np/2,1),P(np/2+1,0),.22,.26);
   for(let i=0;i<=np;i++)for(const top of[0,1]){if(top&&(i===0||i===np))continue;const p=P(i,top);parts.push({geo:BX(.05,.95,1.05),m:M4(x+s*.26,p.y+(top?-.2:.15),p.z)},{geo:BX(.05,.95,1.05),m:M4(x-s*.26,p.y+(top?-.2:.15),p.z)});}}
  const xl=B.x-B.hw+.15,xr=B.x+B.hw-.15;
  for(let i=1;i<np;i++){memb(new V(xl,y0+Ht-.1,zs(i)),new V(xr,y0+Ht-.1,zs(i)),.26,.42);if(i<np-1){memb(new V(xl,y0+Ht+.05,zs(i)),new V(xr,y0+Ht+.05,zs(i+1)),.12,.12,false);memb(new V(xr,y0+Ht+.05,zs(i)),new V(xl,y0+Ht+.05,zs(i+1)),.12,.12,false);}}
  for(const i of[1,np-1]){memb(new V(xl,y0+Ht-1.4,zs(i)),new V(xr,y0+Ht-1.4,zs(i)),.22,.5);for(const s of[-1,1])memb(new V(s<0?xl:xr,y0+Ht-2.6,zs(i)),new V(B.x+s*1.6,y0+Ht-1.4,zs(i)),.12,.12,false);}
  for(let i=0;i<=np;i++)parts.push({geo:BX(B.hw*2+.2,.55,.34),m:M4(B.x,DECK-.98,zs(i))});for(const xx of[-2.6,0,2.6])parts.push({geo:BX(.28,.42,L),m:M4(B.x+xx,DECK-.92,B.z)});
  const g=merge(parts);boxUV(g,1.7);const me=new THREE.Mesh(g,std({map:TX.steel.map,normalMap:TX.steel.normalMap,roughnessMap:TX.steel.roughnessMap,roughness:1,metalness:.55,envMapIntensity:.8}));me.castShadow=true;me.receiveShadow=true;G.add(me);}
 // ----- props
 const groups={};for(const p of W.props)(groups[p.kind]=groups[p.kind]||[]).push(p);
 const inst=(geo,mat,list,cast=true,fn)=>{const im=new THREE.InstancedMesh(geo,mat,list.length);const c=new THREE.Color();list.forEach((p,i)=>{im.setMatrixAt(i,fn?fn(p):M4(p.x,p.y,p.z,0,p.rot||0,0,p.s||1,p.s||1,p.s||1));c.set(p.col??0xffffff);im.setColorAt(i,c);});im.castShadow=cast;im.receiveShadow=true;G.add(im);return im;};
 if(groups.well)inst(merge([{geo:CY(.9,.9,.9,14),m:M4(0,.45,0)},{geo:BX(.1,1.6,.1),m:M4(.8,1.3,0)},{geo:BX(.1,1.6,.1),m:M4(-.8,1.3,0)},{geo:new THREE.ConeGeometry(1.2,.7,4).rotateY(PI/4),m:M4(0,2.35,0)}]),std({map:TX.stone.map,roughness:.9}),groups.well);
 if(groups.grave)inst(merge([{geo:BX(.6,.9,.15),m:M4(0,.45,0)},{geo:BX(.9,.12,1.6),m:M4(0,.06,.8)}]),std({map:TX.concrete.map,color:0xa8a49c,roughness:.95}),groups.grave);
 if(groups.silo)inst(merge([{geo:CY(2.6,2.6,11,24),m:M4(0,5.5,0)},{geo:new THREE.SphereGeometry(2.6,24,8,0,PI*2,0,PI/2),m:M4(0,11,0)}]),std({map:TX.metal.map,color:0xc8ccd0,roughness:.5,metalness:.5}),groups.silo);
 if(groups.radome)inst(merge([{geo:new THREE.SphereGeometry(5.6,32,18,0,PI*2,0,PI*.62),m:M4(0,5.6,0)},{geo:CY(5.2,5.4,4.2,32),m:M4(0,2.1,0)}]),std({color:0xf2f4f6,roughness:.55}),groups.radome);
 if(groups.mast){const L=[];for(let i=0;i<4;i++){const a=i/4*PI*2+PI/4;L.push({geo:CY(.06,.06,24,5),m:M4(Math.cos(a)*.7,12,Math.sin(a)*.7)});}for(let y=1;y<24;y+=2)L.push({geo:BX(1.5,.06,.06),m:M4(0,y,.7)},{geo:BX(1.5,.06,.06),m:M4(0,y,-.7)},{geo:BX(.06,.06,1.5),m:M4(.7,y+1,0)},{geo:BX(.06,.06,1.5),m:M4(-.7,y+1,0)});L.push({geo:CY(.5,.5,.3,12),m:M4(0,20,.8,PI/2)});inst(merge(L),std({color:0xb8bcc0,roughness:.4,metalness:.7}),groups.mast);}
 if(groups.container)inst(merge([{geo:BX(6.06,2.59,2.44),m:M4(0,1.3,0)}]),std({map:TX.metal.map,normalMap:TX.metal.normalMap,roughness:.55,metalness:.3}),groups.container.map(p=>({...p,y:p.y-.2})));
 if(groups.wreck)inst(merge([{geo:prof([[-2.2,.36],[2.15,.36],[2.22,.62],[2.12,.82],[.95,.92],[.35,1.38],[-1.1,1.4],[-1.75,.95],[-2.2,.9]],1.82,.08)},{geo:BX(1.84,.16,4.34),m:M4(0,.42,0),c:0x111111}]),std({map:TX.metal.map,color:0x4a3a2e,roughness:.95,metalness:.2}),groups.wreck.map(p=>({...p,col:0x6a5a4a})));
 if(groups.pad){const m=std({map:TX.pad,roughness:.8,polygonOffset:true,polygonOffsetFactor:-3});for(const p of groups.pad){const me=new THREE.Mesh(new THREE.CircleGeometry(p.r,32),m);me.rotation.x=-PI/2;me.position.set(p.x,p.y+.06,p.z);me.receiveShadow=true;G.add(me);}}
 // ----- destructibles (one instanced mesh per kind; destroyed -> zero matrix)
 {const DG={shed:merge([{geo:BX(3.4,2.4,3.2),m:M4(0,1.2,0),c:0x8a6a4a},{geo:BX(3.9,.12,3.8),m:M4(0,2.6,0,.12),c:0x5a5450},{geo:BX(1,1.9,.05),m:M4(.6,.95,1.62),c:0x3a2a1e}]),wall:merge([{geo:BX(4.2,1.35,.62),m:M4(0,.67,0)},{geo:BX(4.3,.12,.7),m:M4(0,1.38,0),c:0xb0aca4}]),
   sand:(()=>{const L=[];for(let row=0;row<3;row++)for(let i=0;i<4;i++){const g=new THREE.CapsuleGeometry(.2,.48,3,8);g.rotateZ(PI/2);L.push({geo:g,m:M4(-1.2+i*.8+(row%2)*.4-.2,.18+row*.34,0,0,0,0,1,.85,1.9)});}return merge(L);})(),
   fence:merge([{geo:BX(4,.12,.06),m:M4(0,.85,0)},{geo:BX(4,.12,.06),m:M4(0,.45,0)},...[-1.9,-.6,.6,1.9].map(x=>({geo:BX(.12,1.05,.12),m:M4(x,.52,0)}))]),
   crates:merge([{geo:BX(1.2,1.2,1.2),m:M4(-.6,.6,0)},{geo:BX(1.1,1.1,1.1),m:M4(.6,.55,.05,0,.2,0)},{geo:BX(.9,.9,.9),m:M4(-.4,1.65,0,0,.4,0)}]),hay:new THREE.CylinderGeometry(.85,.85,1.6,14).rotateZ(PI/2).translate(0,.85,0),
   tent:merge([{geo:new THREE.CylinderGeometry(2.1,2.1,5,3,1,false).rotateZ(PI/2).rotateX(PI/6),m:M4(0,1.05,0,0,0,0,1,1,1)},{geo:BX(5.1,.1,.1),m:M4(0,2.1,0)}])};
  const DM={shed:std({map:TX.wood.map,roughness:.9,vertexColors:true}),wall:std({map:TX.stone.map,normalMap:TX.stone.normalMap,roughness:.92,vertexColors:true}),sand:std({map:TX.sandbag.map,normalMap:TX.sandbag.normalMap,roughness:1}),fence:std({map:TX.wood.map,color:0x9a7a58,roughness:.9}),
   crates:std({map:TX.crate.map,normalMap:TX.crate.normalMap,roughness:.85}),hay:std({map:TX.dirt.map,color:0xe8c870,roughness:1}),tent:std({map:TX.cloth,color:0x6a7048,roughness:1,side:THREE.DoubleSide})};
  const by={};for(const D of W.dest)(by[D.kind]=by[D.kind]||[]).push(D);S.destMesh={};
  for(const k in by){const list=by[k];const im=new THREE.InstancedMesh(DG[k],DM[k],list.length);list.forEach((D,i)=>{D.mesh=im;D.mi=i;D.mat=M4(D.x,D.y,D.z,0,D.rot?PI/2:0,0);im.setMatrixAt(i,D.mat);});im.castShadow=true;im.receiveShadow=true;G.add(im);S.destMesh[k]=im;}}
 // ----- rocks: faceted boulders (lighter than before) with moss on the upward faces
 {const g=new THREE.IcosahedronGeometry(1,1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=Math.sin(x*12.9+y*78.2+z*37.7)*43758.5;const s=.78+(k-Math.floor(k))*.36+Math.sin(x*3+z*2)*.1;p.setXYZ(i,x*s*1.15,Math.max(-.3,y)*s*.66,z*s);}g.computeVertexNormals();
  const rm=std({map:TX.rock.map,normalMap:TX.rock.normalMap,normalScale:new THREE.Vector2(1.3,1.3),color:0xc0bab0,roughness:.92});
  rm.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying float vUp;varying vec3 vRP;').replace('#include <fog_vertex>','#include <fog_vertex>\nvUp=normalize(mat3(modelMatrix*instanceMatrix)*objectNormal).y;vRP=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float vUp;varying vec3 vRP;\n'+NOISE_GLSL).replace('#include <map_fragment>','#include <map_fragment>\nfloat moss=smoothstep(.45,.85,vUp+(tn(vRP.xz*1.7)-.5)*.5);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.2,.26,.1)*(.7+.6*tn(vRP.xz*6.)),moss*.8);');};
  inst(g,rm,W.rocks.map(r=>({...r,y:r.y-.15})));}
 {const pl=new THREE.PlaneGeometry(.5,1.6);pl.translate(0,.8,0);const reed=merge([{geo:pl},{geo:pl.clone().rotateY(PI/2)},{geo:pl.clone().rotateY(PI/4)}]);inst(reed,std({map:TX.grassCard,alphaTest:.45,side:THREE.DoubleSide,color:0xa8b070,roughness:1}),W.decor.filter(d=>d.kind==='reed'),false);}
 // ----- trees + bushes: card-built crowns on one atlas material (bark, needle sprays, leaf clusters, impostors), so trunk + crown is a single
 // instanced draw per chunk; far LOD = crossed impostor cards. Wind sway in the vertex shader, no back-face darkening, a touch of leaf translucency.
 const treeM=std({map:TX.trees,alphaTest:.5,side:THREE.DoubleSide,roughness:.88,metalness:0});
 treeM.onBeforeCompile=s=>{s.uniforms.uT=S.timeU;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 wp0=instanceMatrix*vec4(0.,0.,0.,1.);float sw=max(0.,position.y-1.5)*.016;transformed.x+=sin(uT*1.3+wp0.x*.13+wp0.z*.07)*sw;transformed.z+=cos(uT*1.1+wp0.z*.11)*sw*.7;');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(.05,.07,.03);');};
 const trr=mulberry(31);const pineHi=pineHiGeo(trr),oakHi=oakHiGeo(trr),pineLo=impGeo(5,8.8,ATL.pineI),oakLo=impGeo(9,9,ATL.oakI);
 const bushG=(()=>{const L=[];for(let k=0;k<4;k++){const pl=new THREE.PlaneGeometry(2.1,1.5);pl.translate(0,.55,0);atlasUV(pl,ATL.leaf);L.push({geo:pl,m:new THREE.Matrix4().makeRotationY(k*PI/4+trr()).multiply(new THREE.Matrix4().makeRotationX((trr()-.5)*.6))});}return crownNormals(merge(L),.1);})();
 const CS=100,CN=Math.ceil(EXT*2/CS);for(let j=0;j<CN;j++)for(let i=0;i<CN;i++)S.chunks.push({i,j,cx:-EXT+(i+.5)*CS,cz:-EXT+(j+.5)*CS,trees:[[],[]],bushes:[],hi:[],lo:[],hiK:[null,null],loK:[null,null],bush:null,state:-1});
 const chunkOf=(x,z)=>S.chunks[cl(Math.floor((z+EXT)/CS),0,CN-1)*CN+cl(Math.floor((x+EXT)/CS),0,CN-1)];
 for(const t of W.trees){const c=chunkOf(t.x,t.z);t.chunk=c;t.ci=c.trees[t.kind].length;c.trees[t.kind].push(t);}for(const b of W.bushes)chunkOf(b.x,b.z).bushes.push(b);
 const tm4=t=>M4(t.x,t.y-.2,t.z,0,t.rot,0,t.s,t.s*(t.kind?1:1.05),t.s);
 for(const c of S.chunks){for(let k=0;k<2;k++){const L=c.trees[k];if(!L.length)continue;
   const mk=(geo,cast)=>{const im=new THREE.InstancedMesh(geo,treeM,L.length);L.forEach((t,i)=>im.setMatrixAt(i,t.alive?tm4(t):Z0));im.castShadow=cast;im.receiveShadow=true;im.visible=false;im.computeBoundingSphere();G.add(im);return im;};
   c.hi.push(c.hiK[k]=mk(k?oakHi:pineHi,true));c.lo.push(c.loK[k]=mk(k?oakLo:pineLo,false));}
  if(c.bushes.length){const im=new THREE.InstancedMesh(bushG,treeM,c.bushes.length);c.bushes.forEach((b,i)=>im.setMatrixAt(i,M4(b.x,b.y-.1,b.z,0,b.rot,0,b.s,b.s,b.s)));im.receiveShadow=true;im.visible=false;im.computeBoundingSphere();G.add(im);c.bush=im;}}
 S.killTree=t=>{const c=t.chunk;for(const im of[c.hiK[t.kind],c.loK[t.kind]])if(im){im.setMatrixAt(t.ci,Z0);im.instanceMatrix.needsUpdate=true;}};
 S.killDest=D=>{D.mesh.setMatrixAt(D.mi,Z0);D.mesh.instanceMatrix.needsUpdate=true;};
 // ----- grass field that follows the camera
 S.grass=null;if(q>0){const n=q>=2?9000:4200,geo=new THREE.PlaneGeometry(.7,.55);geo.translate(0,.26,0);const cross=merge([{geo},{geo:geo.clone().rotateY(PI/2)}]);{const nn=cross.attributes.normal;for(let i=0;i<nn.count;i++)nn.setXYZ(i,0,1,0);}
  const gm=std({map:TX.grassCard,alphaTest:.45,side:THREE.DoubleSide,roughness:1,color:0x9aa868});gm.onBeforeCompile=s=>{s.uniforms.uT=S.timeU;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 wp0=instanceMatrix*vec4(0.,0.,0.,1.);transformed.x+=sin(uT*1.7+wp0.x*.4+wp0.z*.3)*.08*position.y;');s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);');};
  const im=new THREE.InstancedMesh(cross,gm,n);im.frustumCulled=false;im.receiveShadow=true;G.add(im);S.grass={im,n,cx:1e9,cz:1e9,R:q>=2?52:40};}
 S.update=(cam,dt)=>{S.timeU.value+=dt;const cx=cam.x,cz=cam.z;S.lodT=(S.lodT||0)-dt;
  if(S.lodT<=0){S.lodT=.25;const far=q>=2?620:q===1?480:330,near=q>=2?150:q===1?115:80,bushD=q>=2?170:q===1?120:70;
   for(const c of S.chunks){const d=Math.max(0,Math.hypot(c.cx-cx,c.cz-cz)-CS*.71);const st=d<near?2:d<far?1:0;if(st!==c.state){c.state=st;for(const m of c.hi)m.visible=st===2;for(const m of c.lo)m.visible=st===1;}if(c.bush)c.bush.visible=d<bushD;}}
  const g=S.grass;if(g&&Math.hypot(cx-g.cx,cz-g.cz)>6){g.cx=cx;g.cz=cz;const R=g.R,side=Math.ceil(Math.sqrt(g.n)),step=R*2/side,ox=Math.floor(cx/step)*step,oz=Math.floor(cz/step)*step,m=new THREE.Matrix4(),qq=new THREE.Quaternion(),e=new THREE.Euler(),sc=new V(),p=new V();let k=0;
   for(let jj=0;jj<side&&k<g.n;jj++)for(let ii=0;ii<side&&k<g.n;ii++){const gx=ox-R+ii*step,gz=oz-R+jj*step,hsh=Math.sin(gx*12.9898+gz*78.233)*43758.5453,hr=hsh-Math.floor(hsh),hsh2=Math.sin(gx*39.3+gz*11.1)*24634.6345,h2=hsh2-Math.floor(hsh2);
    const x=gx+hr*step,z=gz+h2*step,y=W.height(x,z);const dd=Math.hypot(x-cx,z-cz);let ok=dd<R&&y>WL+.5&&!S.onRoad(x,z)&&!(Math.abs(x-BRIDGE.x)<BRIDGE.hw+2.5&&Math.abs(z-BRIDGE.z)<BRIDGE.hl+4)&&Math.max(Math.abs(x),Math.abs(z))<EXT-4;if(ok){const nz=W.normal(x,z,p);ok=nz.y>.86;}
    if(!ok){g.im.setMatrixAt(k++,Z0);continue;}const s=(.55+hr*.8)*(1-Math.max(0,(dd-R*.7)/(R*.3))*.6);m.compose(p.set(x,y-.03,z),qq.setFromEuler(e.set(0,h2*6.28,0)),sc.set(s,s*(.8+h2*.6),s));g.im.setMatrixAt(k++,m);}
   g.im.count=k;g.im.instanceMatrix.needsUpdate=true;}
  if(S.water&&S.water.normalMap){S.water.normalMap.offset.x+=dt*.006;S.water.normalMap.offset.y+=dt*.011;}};
 return S;}

/* ================= capture flags ================= */
export function makeFlag(TX){const g=new THREE.Group();const pole=new THREE.Mesh(CY(.07,.09,9,8),std({color:0xd0d4d8,roughness:.3,metalness:.8}));pole.position.y=4.5;pole.castShadow=true;g.add(pole);
 const ball=new THREE.Mesh(SP(.16,10,8),pole.material);ball.position.y=9.05;g.add(ball);
 const geo=new THREE.PlaneGeometry(2.2,1.3,10,4);geo.translate(1.1,0,0);const mat=std({color:0xe8e4dc,side:THREE.DoubleSide,roughness:.8,map:TX.cloth});const cloth=new THREE.Mesh(geo,mat);cloth.position.y=8.2;cloth.castShadow=true;g.add(cloth);
 const base=new THREE.Mesh(CY(.8,1,.4,12),std({map:TX.concrete.map,roughness:.9}));base.position.y=.2;g.add(base);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.986,1,128),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide,fog:true}));ring.rotation.x=-PI/2;g.add(ring);
 g.userData={cloth,mat,ring,geo,p0:geo.attributes.position.array.slice()};return g;}
export function waveFlag(f,t,k){const u=f.userData,p=u.geo.attributes.position;for(let i=0;i<p.count;i++){const x=u.p0[i*3];p.setZ(i,Math.sin(x*2.4-t*5)*.16*x/2.2);p.setY(i,u.p0[i*3+1]-x*x*.02);}p.needsUpdate=true;u.cloth.position.y=1.4+6.8*k;}
