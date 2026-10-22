// KART GRAND PRIX — procedural models: karts (4 bodies, 4 wheel sets, 3 gliders), 8 rigged drivers, items, rescue drone.
// Karts are built from extruded, lathed and tubular parts merged into ONE geometry per rigid piece, drawn with one shared
// physical material: a per-vertex PBR attribute (roughness, metalness, clearcoat, emissive) lets glossy paint, chrome,
// rubber, carbon and lamps live in the same draw call, and a small decal atlas supplies race numbers and sponsor stickers.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,merge,M,lumpy} from './util.js';
import {kartAtlas,ATLAS,microNormal} from './tex.js';

export const modelOpts={detail:2};
const METAL=0xb8bcc6;
const matCache=new Map();
const furMatCache=new Map();
function furMat(rough=.75,metal=0){const k=rough+'_'+metal;if(!furMatCache.has(k)){const m=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:rough,metalness:metal,normalMap:microNormal(),normalScale:new THREE.Vector2(.35,.35)});if(!metal){m.sheen=.6;m.sheenRoughness=.5;m.sheenColor=new THREE.Color(1,1,1);}furMatCache.set(k,m);}return furMatCache.get(k);}
const glowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.4,2.4,2.4)});

/* ---------- the shared kart material ---------- */
let KMAT=null;
export function kartMat(){if(KMAT)return KMAT;const at=kartAtlas();
 const m=new THREE.MeshPhysicalMaterial({vertexColors:true,map:at.map,normalMap:at.normalMap,roughness:1,metalness:1,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.15});
 m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 pbr;varying vec4 vPbr;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPbr=pbr;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec4 vPbr;')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=vPbr.x;')
   .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=vPbr.y;')
   .replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat*=vPbr.z;\n#endif')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vPbr.w;');};
 m.customProgramCacheKey=()=>'kartPBR';return KMAT=m;}
// roughness, metalness, clearcoat, emissive
const PBR={paint:[.32,.35,1,0],pearl:[.22,.5,1,0],chrome:[.06,1,0,0],metal:[.3,.85,0,0],steel:[.42,.7,0,0],dark:[.55,.1,.25,0],plastic:[.42,0,.5,0],rubber:[.9,0,0,0],carbon:[.28,.25,1,0],seat:[.85,0,0,0],glow:[.4,0,0,2.2],lamp:[.15,0,1,3.2],decal:[.35,0,1,0]};
// parts: {g, m(matrix), c(colour), k(pbr kind), uv: ATLAS rect | null}
function kmerge(parts){const gs=parts.map(p=>{let g=p.g.index?p.g.toNonIndexed():p.g.clone();if(p.m)g.applyMatrix4(p.m);return[g,p];});let n=0;gs.forEach(([g])=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3),pb=new Float32Array(n*4);let o=0;const c=new THREE.Color();
 for(const[g,p]of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(!g.attributes.normal)g.computeVertexNormals();nor.set(g.attributes.normal.array,o*3);
  c.set(p.c??0xffffff);const P=PBR[p.k||'paint'];const r0=p.uv||ATLAS.white,e=4/512,r=[r0[0]+e,r0[1]+e,r0[2]-e,r0[3]-e],guv=g.attributes.uv;
  for(let i=0;i<k;i++){const j=o+i;col[j*3]=c.r;col[j*3+1]=c.g;col[j*3+2]=c.b;pb.set(P,j*4);
   if(p.uv&&guv){const gu=guv.getX(i),gv=guv.getY(i);uv[j*2]=r[0]+gu*(r[2]-r[0]);uv[j*2+1]=(1-r[3])+gv*(r[3]-r[1]);}else{uv[j*2]=(r[0]+r[2])/2;uv[j*2+1]=1-(r[1]+r[3])/2;}}
  o+=k;g.dispose();}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.setAttribute('color',new THREE.BufferAttribute(col,3));out.setAttribute('pbr',new THREE.BufferAttribute(pb,4));
 out.computeBoundingSphere();return out;}

/* ---------- shape helpers ---------- */
const D=()=>modelOpts.detail;
function rshape(pts){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();return s;}
// side-profile extrusion: shape in (z,y), thickness along x, centred on x=0
function sideEx(pts,th,bev=.04){const g=new THREE.ExtrudeGeometry(rshape(pts),{depth:Math.max(.01,th-2*bev),bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:D()>=2?3:1,curveSegments:4});g.translate(0,0,-(th-2*bev)/2);g.rotateY(-Math.PI/2);return g;}
// top-view extrusion: shape in (x,z), thickness along y going down from y=0
function topEx(pts,th,bev=.03){const g=new THREE.ExtrudeGeometry(rshape(pts),{depth:Math.max(.01,th-2*bev),bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:D()>=2?2:1});g.rotateX(Math.PI/2);return g;}
function rbox(w,h,d,r=.06){const s=new THREE.Shape(),x=w/2-r,y=h/2-r;s.moveTo(-x,-h/2);s.lineTo(x,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-y);s.lineTo(w/2,y);s.quadraticCurveTo(w/2,h/2,x,h/2);s.lineTo(-x,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,y);s.lineTo(-w/2,-y);s.quadraticCurveTo(-w/2,-h/2,-x,-h/2);
 const g=D()<1?new THREE.BoxGeometry(w,h,d):new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r*.8,bevelSegments:D()>=2?3:1,curveSegments:D()>=2?4:2});if(D()<1)return g;g.translate(0,0,-(d-2*r)/2);return g;}
function tube(pts,r,closed=false){const c=new THREE.CatmullRomCurve3(pts.map(p=>new V(...p)),closed,'catmullrom',.2);return new THREE.TubeGeometry(c,Math.max(D()>=1?6:4,pts.length*(D()>=2?6:D()>=1?3:2)),r,D()>=2?8:D()>=1?5:4,closed);}
function rod(a,b,r){const A=new V(...a),Bv=new V(...b),d=Bv.clone().sub(A),l=d.length();const g=new THREE.CylinderGeometry(r,r,l,D()>=2?8:D()>=1?5:4,1,D()<1);g.translate(0,l/2,0);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),d.normalize())));g.translate(A.x,A.y,A.z);return g;}
function spring(a,b,r,turns,wire){const A=new V(...a),Bv=new V(...b),d=Bv.clone().sub(A),l=d.length(),q=new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),d.clone().normalize());const pts=[];const N=turns*(D()>=2?10:5);
 for(let i=0;i<=N;i++){const t=i/N,a2=t*turns*Math.PI*2;pts.push(new V(Math.cos(a2)*r,t*l,Math.sin(a2)*r).applyQuaternion(q).add(A));}
 return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),N,wire,4,false);}
const plane=(w,h)=>new THREE.PlaneGeometry(w,h);
const disc=r=>new THREE.CircleGeometry(r,D()>=2?20:10);

/* ---------- kart bodies ---------- */
const STICKERS=[0,2,3,4,5,6,7,1];
function bodyParts(id,col,num,acc){const P=[];const p=(g,m,k='paint',c=col,uv=null)=>P.push({g,m,k,c,uv});const mir=f=>{f(1);f(-1);};
 const FRAME=0xb8bec8,DARKP=0x1c1e24,ACC=acc;const st=STICKERS[num%8];
 // common chassis: floor tray, frame rails, axles, chain sprocket
 p(topEx([[-.5,-1.2],[.5,-1.2],[.55,.9],[.42,1.4],[-.42,1.4],[-.55,.9]],.05,.015),M(0,.3,0),'carbon',0xffffff,ATLAS.carbon);
 mir(s=>p(tube([[s*.42,.29,1.48],[s*.52,.29,.95],[s*.54,.29,-.4],[s*.46,.29,-1.28]],.038),null,'metal',FRAME));
 p(tube([[-.46,.29,-1.28],[0,.29,-1.34],[.46,.29,-1.28]],.036),null,'metal',FRAME);
 p(rod([-.84,.38,-.95],[.84,.38,-.95],.045),null,'steel',0x9aa0aa);p(rod([-.36,.33,1.0],[.36,.33,1.0],.04),null,'steel',0x9aa0aa);
 if(D()>=1)p(new THREE.CylinderGeometry(.16,.16,.03,D()>=2?18:10),M(.34,.38,-.95,0,0,Math.PI/2),'metal',0x3a3c44);
 // steering column + pedals
 p(rod([0,.36,1.25],[0,.92,.42],.03),null,'steel',0x8a8e98);if(D()>=1)mir(s=>p(new THREE.BoxGeometry(.09,.2,.05),M(s*.13,.42,1.18,-.5,0,0),'chrome',0xdddddd));
 // suspension: wishbones + coil-overs per corner
 const spC=acc;
 if(D()>=1)for(const[zc,fr]of[[1.0,1],[-.95,0]])mir(s=>{const hx=s*(fr?.68:.66);
  p(rod([s*.4,.31,zc+.1],[hx,.36,zc],.018),null,'steel',0x9aa0aa);p(rod([s*.4,.31,zc-.1],[hx,.36,zc],.018),null,'steel',0x9aa0aa);
  p(rod([s*.38,.48,zc],[hx,.47,zc],.016),null,'steel',0x9aa0aa);
  p(spring([s*.36,.3,zc+(fr?-.16:.16)],[s*.5,.64,zc+(fr?-.16:.16)],.045,6,.011),null,'paint',spC);
  p(rod([s*.36,.3,zc+(fr?-.16:.16)],[s*.5,.64,zc+(fr?-.16:.16)],.018),null,'chrome',0xffffff);
  p(new THREE.CylinderGeometry(.06,.06,.08,D()>=2?12:6),M(hx,.37,zc,0,0,Math.PI/2),'metal',0x5a5c64);});
 // seat (shell + bolsters)
 const seat=[0,.0,0];
 // engine block with cooling fins, air box and twin chrome exhausts
 const ez=-1.02;p(rbox(.36,.3,.36,.04),M(0,.5,ez),'metal',0x50535c);for(let i=0;i<(D()>=2?6:D()>=1?3:1);i++)p(new THREE.BoxGeometry(.42,.018,.4),M(0,.6+i*.04,ez),'chrome',0xd8dce4);
 p(new THREE.CylinderGeometry(.13,.13,.22,D()>=2?16:8),M(-.3,.6,ez+.05,0,0,Math.PI/2),'plastic',DARKP);p(disc(.12),M(-.415,.6,ez+.05,0,-Math.PI/2,0),'chrome',0xcccccc);
 mir(s=>{p(tube([[s*.1,.52,ez-.12],[s*.2,.5,ez-.35],[s*.26,.62,-1.5],[s*.25,.76,-1.66]],.042),null,'chrome',0xffffff);p(new THREE.CylinderGeometry(.065,.055,.16,D()>=2?14:8,1,true),M(s*.25,.78,-1.72,Math.PI/2.3,0,0),'chrome',0xffffff);});
 const meta={seat:[0,.56,-.42],wheel:[0,.98,.36],ax:[.78,1.0,-.95],exh:[.25,.8,-1.72]};
 switch(id){
  case'racer':{
   // sidepods with sponsor stickers
   mir(s=>{p(sideEx([[-.6,.3],[.5,.3],[.62,.4],[.58,.6],[.3,.68],[-.45,.64],[-.64,.5]],.26,.05),M(s*.67,0,0));p(plane(.86,.2),M(s*(.67+.135),.49,-.03,0,s*Math.PI/2,0),'decal',0xffffff,ATLAS.sticker(st));
    p(new THREE.BoxGeometry(.02,.05,.5),M(s*(.67+.14),.6,-.05),'dark',DARKP);});
   // nose cone + number + headlights
   p(sideEx([[.82,.3],[1.62,.3],[1.68,.38],[1.52,.5],[1.12,.6],[.85,.6],[.8,.44]],.88,.07));
   p(disc(.15),M(0,.645,1.2,-Math.PI/2+.22,0,0),'decal',0xffffff,ATLAS.num(num));
   p(plane(.5,.06),M(0,.62,1.42,-Math.PI/2+.4,0,0),'decal',0xffffff,ATLAS.stripe);
   mir(s=>{p(disc(.065),M(s*.24,.45,1.665,0,0,0),'lamp',0xfff2d0);p(new THREE.TorusGeometry(.07,.012,4,D()>=2?14:8),M(s*.24,.45,1.66),'chrome',0xffffff);});
   p(tube([[-.62,.33,1.5],[-.36,.31,1.82],[.36,.31,1.82],[.62,.33,1.5]],.04),null,'chrome',0xffffff);
   // rear bumper + tail lights + small spoiler
   p(rbox(1.9,.2,.28,.07),M(0,.42,-1.52),'plastic',DARKP);p(rbox(1.7,.05,.22,.02),M(0,.54,-1.52),'paint',col);
   mir(s=>p(rbox(.18,.07,.03,.01),M(s*.6,.43,-1.67),'lamp',0xff2a20));
   p(rbox(.9,.04,.24,.015),M(0,.95,-1.32,.12,0,0),'paint',col);mir(s=>p(rod([s*.3,.5,-1.25],[s*.3,.93,-1.3],.02),null,'steel',0x8a8e98));
   // seat
   p(rbox(.7,.12,.6,.04),M(0,.5,-.42),'seat',0x2a2a30);p(rbox(.72,.72,.14,.05),M(0,.84,-.78,-.25,0,0),'seat',0x2a2a30);mir(s=>p(rbox(.1,.4,.5,.04),M(s*.36,.68,-.55,0,0,s*.12),'seat',0x34343c));
   break;}
  case'dart':{
   mir(s=>{p(sideEx([[-.7,.3],[.6,.3],[.7,.37],[.5,.52],[-.5,.56],[-.72,.44]],.2,.04),M(s*.64,0,0));p(plane(.8,.16),M(s*(.64+.105),.43,-.05,0,s*Math.PI/2,0),'decal',0xffffff,ATLAS.sticker(st));});
   p(sideEx([[.72,.3],[1.96,.3],[2.0,.35],[1.2,.52],[.8,.6],[.7,.44]],.74,.06));
   p(disc(.14),M(0,.6,1.15,-Math.PI/2+.2,0,0),'decal',0xffffff,ATLAS.num(num));
   mir(s=>{p(new THREE.BoxGeometry(.6,.03,.3),M(s*.42,.33,1.75,0,s*.15,0),'carbon',0xffffff,ATLAS.carbon);p(disc(.05),M(s*.18,.42,1.82,0,0,0),'lamp',0xd8f0ff);});
   // big rear wing on swan-neck struts
   p(sideEx([[-.22,0],[.22,0],[.2,.05],[-.22,.03]],1.8,.015),M(0,1.18,-1.42),'paint');p(rbox(1.6,.025,.12,.01),M(0,1.25,-1.55),'carbon',0xffffff,ATLAS.carbon);
   mir(s=>{p(new THREE.BoxGeometry(.03,.42,.56),M(s*.92,1.15,-1.45),'paint');p(plane(.5,.3),M(s*.937,1.15,-1.45,0,s*Math.PI/2,0),'decal',0xffffff,ATLAS.sticker((st+1)%8));p(tube([[s*.25,.6,-1.15],[s*.27,.95,-1.3],[s*.3,1.18,-1.42]],.022),null,'steel',0x8a8e98);});
   p(rbox(1.7,.16,.22,.06),M(0,.4,-1.52),'plastic',DARKP);mir(s=>p(rbox(.14,.06,.03,.01),M(s*.55,.41,-1.64),'lamp',0xff2a20));
   p(rbox(.7,.12,.6,.04),M(0,.46,-.4),'seat',0x2a2a30);p(rbox(.7,.66,.13,.05),M(0,.78,-.76,-.32,0,0),'seat',0x2a2a30);
   meta.seat=[0,.52,-.4];meta.wheel=[0,.92,.3];meta.ax=[.75,1.05,-.95];break;}
  case'rover':{
   p(rbox(1.5,.42,1.0,.12),M(0,.78,.92));p(plane(.4,.2),M(0,1.0,1.42,-.2,0,0),'decal',0xffffff,ATLAS.grille);
   p(disc(.15),M(0,1.0,.75,-Math.PI/2,0,0),'decal',0xffffff,ATLAS.num(num));
   mir(s=>{p(rbox(.32,.42,2.0,.08),M(s*.72,.72,-.1));p(plane(1.3,.2),M(s*.885,.74,-.1,0,s*Math.PI/2,0),'decal',0xffffff,ATLAS.sticker(st));
    // fenders arching over the wheels
    for(const z of[1.0,-.95])p(new THREE.CylinderGeometry(.62,.62,.5,D()>=2?14:7,1,true,-Math.PI*.42,Math.PI*.84),M(s*.86,.62,z,0,0,Math.PI/2),'paint');
    p(rbox(.24,.12,.06,.02),M(s*.5,.82,1.43),'lamp',0xfff2d0);});
   // roll cage + light bar
   mir(s=>{p(tube([[s*.52,.6,-.78],[s*.5,1.55,-.72],[s*.36,1.72,-.66]],.04),null,'metal',0x2a2c34);p(tube([[s*.52,.95,.55],[s*.46,1.55,-.2],[s*.4,1.7,-.62]],.035),null,'metal',0x2a2c34);});
   p(tube([[-.38,1.72,-.66],[0,1.76,-.66],[.38,1.72,-.66]],.04),null,'metal',0x2a2c34);
   p(rbox(.9,.1,.12,.03),M(0,1.84,-.62),'dark',DARKP);for(let i=0;i<4;i++)p(disc(.04),M(-.3+i*.2,1.84,-.555),'lamp',0xfff8e0);
   p(rbox(1.3,.06,.5,.02),M(0,.38,1.5,.3,0,0),'chrome',0xffffff);
   p(rbox(1.7,.2,.3,.07),M(0,.5,-1.52),'plastic',DARKP);mir(s=>p(rbox(.16,.07,.03,.01),M(s*.62,.52,-1.68),'lamp',0xff2a20));
   p(new THREE.CylinderGeometry(.42,.42,.24,D()>=2?20:10),M(0,.98,-1.32,Math.PI/2,0,0),'rubber',0x18181c);p(new THREE.CylinderGeometry(.22,.22,.26,D()>=2?14:8),M(0,.98,-1.32,Math.PI/2,0,0),'chrome',0xffffff);
   p(rbox(.78,.12,.66,.04),M(0,.66,-.4),'seat',0x2a2a30);p(rbox(.78,.8,.14,.05),M(0,1.0,-.78,-.2,0,0),'seat',0x2a2a30);
   meta.seat=[0,.72,-.4];meta.wheel=[0,1.1,.36];meta.ax=[.82,1.0,-.95];meta.exh=[.25,.8,-1.72];break;}
  case'brick':{
   p(rbox(1.8,.62,1.3,.14),M(0,.8,.72));p(rbox(1.8,.5,.95,.12),M(0,.74,-1.0));
   p(plane(.9,.3),M(0,.78,1.38),'decal',0xffffff,ATLAS.grille);mir(s=>{p(rbox(.26,.16,.04,.02),M(s*.62,.82,1.38),'lamp',0xfff2d0);p(plane(.9,.24),M(s*.905,.85,.7,0,s*Math.PI/2,0),'decal',0xffffff,ATLAS.sticker(st));});
   p(disc(.17),M(0,1.115,.75,-Math.PI/2,0,0),'decal',0xffffff,ATLAS.num(num));
   // chrome push bar
   p(tube([[-.95,.45,1.4],[-.8,.42,1.62],[.8,.42,1.62],[.95,.45,1.4]],.055),null,'chrome',0xffffff);mir(s=>p(rod([s*.45,.42,1.62],[s*.45,.9,1.5],.04),null,'chrome',0xffffff));
   p(tube([[-.45,.9,1.5],[0,.95,1.52],[.45,.9,1.5]],.04),null,'chrome',0xffffff);
   // twin vertical stacks
   mir(s=>{p(new THREE.CylinderGeometry(.08,.08,.9,D()>=2?14:8),M(s*.6,1.3,-1.18),'chrome',0xffffff);p(new THREE.CylinderGeometry(.1,.08,.12,D()>=2?14:8),M(s*.6,1.8,-1.18),'chrome',0xffffff);p(rbox(.14,.08,.03,.01),M(s*.7,.62,-1.48),'lamp',0xff2a20);});
   p(rbox(.8,.14,.6,.04),M(0,.62,-.35),'seat',0x2a2a30);p(rbox(.8,.7,.15,.05),M(0,.95,-.62,-.2,0,0),'seat',0x2a2a30);
   meta.seat=[0,.68,-.35];meta.wheel=[0,1.08,.38];meta.ax=[.86,1.0,-1.0];meta.exh=[.6,1.86,-1.18];meta.stack=true;break;}}
 return{g:kmerge(P),meta};}

const WHEEL_META={std:{r:.38,w:.32,rim:0xd0d4dc,k:'chrome'},slick:{r:.34,w:.46,rim:0xffc21a,k:'chrome'},monster:{r:.56,w:.42,rim:0x22242a,k:'steel'},cyber:{r:.4,w:.3,rim:0x2a2c34,k:'metal'}};
function wheelParts(id,brake){const m=WHEEL_META[id],P=[],R=m.r,Wd=m.w,rr=R*.58,seg=D()>=2?12:D()>=1?6:4;const p=(g,mm,k,c,uv=null)=>P.push({g,m:mm,k,c,uv});
 // tyre: four lathed quarter arcs so the tread texture repeats around the circumference
 const prof=[];const sh=Math.min(.07,Wd*.22);
 prof.push(new THREE.Vector2(rr*1.02,-Wd/2+.01),new THREE.Vector2(R*.86,-Wd/2),new THREE.Vector2(R-sh*.35,-Wd/2+sh*.25),new THREE.Vector2(R,-Wd/2+sh),new THREE.Vector2(R,Wd/2-sh),new THREE.Vector2(R-sh*.35,Wd/2-sh*.25),new THREE.Vector2(R*.86,Wd/2),new THREE.Vector2(rr*1.02,Wd/2-.01));
 for(let q=0;q<4;q++){const g=new THREE.LatheGeometry(prof,seg,q*Math.PI/2,Math.PI/2);g.rotateZ(Math.PI/2);p(g,null,'rubber',0xffffff,ATLAS.tread);}
 if(id==='monster'){for(let i=0;i<(D()>=1?14:8);i++){const a=i/14*Math.PI*2;for(const s of[-1,1])p(new THREE.BoxGeometry(Wd*.42,.07,.13),M(s*Wd*.22,Math.cos(a)*(R+.02),Math.sin(a)*(R+.02),a,s*.35,0),'rubber',0x1a1a1e);}}
 // rim barrel, face, spokes, centre lock, brake disc + caliper
 p(new THREE.CylinderGeometry(rr,rr,Wd*.92,D()>=2?20:10,1,true),M(0,0,0,0,0,Math.PI/2),m.k,m.rim);
 const nS=D()<1?4:id==='cyber'?6:id==='monster'?8:5;
 for(const s of[1]){p(new THREE.CylinderGeometry(rr*.98,rr*.98,.02,D()>=2?20:10),M(s*Wd*.28,0,0,0,0,Math.PI/2),'dark',0x15161a);
  for(let i=0;i<nS;i++){const a=i/nS*Math.PI*2;p(new THREE.BoxGeometry(.035,rr*.95,rr*.2),M(s*Wd*.33,Math.cos(a)*rr*.48,Math.sin(a)*rr*.48,a,0,0),m.k,m.rim);}
  p(new THREE.CylinderGeometry(rr*.28,rr*.32,.08,D()>=2?12:6),M(s*Wd*.34,0,0,0,0,Math.PI/2),m.k,m.rim);p(new THREE.CylinderGeometry(rr*.1,rr*.1,.12,6),M(s*Wd*.38,0,0,0,0,Math.PI/2),'chrome',0xffffff);}
 if(id==='cyber')p(new THREE.TorusGeometry(rr*.85,.022,5,D()>=2?28:14),M(Wd*.33,0,0,0,Math.PI/2,0),'glow',0x2ae0ff);
 p(new THREE.CylinderGeometry(rr*.8,rr*.8,.025,D()>=2?18:9),M(-Wd*.15,0,0,0,0,Math.PI/2),'steel',0x8a8c92);
 return{g:kmerge(P),m};}
// calipers sit on the (non-spinning) hub
function caliper(m,col){return kmerge([{g:rbox(.08,m.r*.5,m.r*.32,.02),m:M(-m.w*.15,m.r*.32,0),k:'paint',c:col}]);}

/* ---------- gliders ---------- */
function gliderGroup(id,col){const g=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color:col,roughness:.6,side:THREE.DoubleSide}),frame=new THREE.MeshStandardMaterial({color:0x2a2c34,metalness:.7,roughness:.35}),white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6,side:THREE.DoubleSide});
 if(id==='wing'){const s=new THREE.Shape();s.moveTo(0,1.2);s.lineTo(2.6,-.8);s.lineTo(0,-.4);s.lineTo(-2.6,-.8);s.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(s),cloth);m.rotation.x=-Math.PI/2+.12;g.add(m);
  const st=new THREE.Shape();st.moveTo(0,.6);st.lineTo(1.2,-.4);st.lineTo(0,-.2);st.closePath();const m2=new THREE.Mesh(new THREE.ShapeGeometry(st),white);m2.rotation.x=-Math.PI/2+.12;m2.position.y=.02;g.add(m2);
  const f=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,5.4,6),frame);f.rotation.z=Math.PI/2;f.position.set(0,0,-.5);g.add(f);}
 else if(id==='para'){const c=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,1.8,20,1,true,-Math.PI*.4,Math.PI*.8),cloth);c.rotation.set(Math.PI/2,0,Math.PI/2);c.scale.set(1,1,.45);c.position.y=.3;g.add(c);
  for(let i=0;i<5;i++){const st=new THREE.Mesh(new THREE.BoxGeometry(.04,.12,1.8),white);const a=-Math.PI*.4+i*Math.PI*.2;st.position.set(Math.sin(a)*2.6,Math.cos(a)*1.17+.3,0);st.rotation.z=-a;g.add(st);}}
 else{for(const s of[-1,1]){const box=new THREE.Mesh(new THREE.BoxGeometry(1.2,.7,1.2),cloth);box.position.set(s*1.3,0,0);g.add(box);const fr=new THREE.Mesh(new THREE.BoxGeometry(1.26,.74,.04),white);fr.position.set(s*1.3,0,.62);g.add(fr);}const f=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.8,6),frame);f.rotation.z=Math.PI/2;g.add(f);}
 for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.7,4),frame);r.position.set(s*.6,-.8,-.2);r.rotation.z=s*.35;g.add(r);}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}

/* ---------- drivers ---------- */
// returns {torso, head, eyes, armL, armR, earL, earR, tail, extra} meshes, all positioned in driver space (origin = seat)
function driverParts(ch){const c=ch.col,c2=ch.col2,sp=ch.sp;const T=[],H=[],E=[],EAR=[],TL=[],ARM=[],GL=[];
 const S=(r,ws=16,hs=12)=>new THREE.SphereGeometry(r,D()<1?Math.max(6,ws*.55|0):ws,D()<1?Math.max(4,hs*.55|0):hs);
 const heavy=ch.cls==='heavy',light=ch.cls==='light';const tr=heavy?.46:light?.3:.36,hr=heavy?.42:light?.44:.4;
 const headY=tr*1.6+hr*.8,headZ=.02;
 // torso
 if(sp==='bot'||sp==='mech'){T.push([new THREE.BoxGeometry(tr*2,tr*2.1,tr*1.6),M(0,tr*1.05,0),c]);T.push([new THREE.BoxGeometry(tr*1.4,tr*1.1,.1),M(0,tr*1.1,tr*.82),c2]);
  if(sp==='mech'){T.push([new THREE.BoxGeometry(tr*.9,tr*.6,tr*1.3),M(tr*1.2,tr*1.9,0),c2]);T.push([new THREE.BoxGeometry(tr*.9,tr*.6,tr*1.3),M(-tr*1.2,tr*1.9,0),c2]);GL.push([new THREE.CircleGeometry(tr*.28,12),M(0,tr*1.2,tr*.88),0xff9a2a]);}}
 else if(sp==='chick'){T.push([S(tr*1.25),M(0,tr*1.1,0,0,0,0,1,1.05,1),c]);}
 else{T.push([S(tr),M(0,tr*1.1,0,0,0,0,1,1.25,.9),c]);T.push([S(tr*.72),M(0,tr*.95,tr*.38,0,0,0,1,1.2,.6),c2]);
  if(sp!=='frog'){T.push([new THREE.TorusGeometry(tr*.62,tr*.2,8,16),M(0,tr*2.0,0,Math.PI/2),ch.kart]);}}
 // head
 const face=hr*.92;
 if(sp==='bot'){H.push([new THREE.BoxGeometry(hr*2.1,hr*1.7,hr*1.8),M(0,headY,headZ),c]);H.push([new THREE.BoxGeometry(hr*1.7,hr*1.2,.08),M(0,headY,headZ+hr*.9),0x0a0e18]);
  E.push([new THREE.BoxGeometry(hr*.36,hr*.5,.05),M(-hr*.38,headY+hr*.05,headZ+hr*.95),0x40fff0]);E.push([new THREE.BoxGeometry(hr*.36,hr*.5,.05),M(hr*.38,headY+hr*.05,headZ+hr*.95),0x40fff0]);
  EAR.push([new THREE.CylinderGeometry(.03,.03,hr*.9,5),M(0,hr*.45,0),METAL]);EAR.push([S(.09,8,6),M(0,hr*.95,0),0xff4d00]);}
 else if(sp==='mech'){H.push([new THREE.BoxGeometry(hr*1.9,hr*1.5,hr*1.7),M(0,headY,headZ),c]);H.push([new THREE.BoxGeometry(hr*1.6,hr*.4,.1),M(0,headY+hr*.1,headZ+hr*.85),0x101014]);
  E.push([new THREE.BoxGeometry(hr*1.4,hr*.18,.05),M(0,headY+hr*.1,headZ+hr*.92),0xff8c1a]);H.push([new THREE.BoxGeometry(hr*.3,hr*.6,hr*.6),M(hr*1.05,headY,headZ),c2]);H.push([new THREE.BoxGeometry(hr*.3,hr*.6,hr*.6),M(-hr*1.05,headY,headZ),c2]);
  EAR.push([new THREE.CylinderGeometry(.04,.02,hr*1.1,5),M(0,hr*.55,0),METAL]);EAR.push([S(.07,8,6),M(0,hr*1.1,0),0xff3a3a]);}
 else{H.push([S(hr,20,16),M(0,headY,headZ,0,0,0,1.05,.95,1),c]);
  const ey=headY+hr*.12,ez=headZ+hr*.82,ex=hr*.36;
  if(sp==='frog'){for(const s of[-1,1]){H.push([S(hr*.32),M(s*hr*.5,headY+hr*.75,headZ+hr*.35),c]);E.push([S(hr*.24),M(s*hr*.5,headY+hr*.8,headZ+hr*.52),0xffffff]);E.push([S(hr*.12),M(s*hr*.5,headY+hr*.82,headZ+hr*.74),0x111111]);}H.push([new THREE.TorusGeometry(hr*.5,.025,4,16,Math.PI),M(0,headY-hr*.15,headZ+hr*.82,0,0,Math.PI),0x2a4a2a]);H.push([S(hr*.7),M(0,headY-hr*.35,headZ+hr*.35,0,0,0,1,.5,.8),c2]);}
  else{for(const s of[-1,1]){E.push([S(hr*.2,12,10),M(s*ex,ey,ez,0,0,0,1,1.25,.6),0xffffff]);E.push([S(hr*.12,10,8),M(s*ex,ey-.01,ez+hr*.1,0,0,0,1,1.3,.6),0x15151a]);E.push([S(hr*.045,6,5),M(s*ex+.03,ey+.05,ez+hr*.16),0xffffff]);}}
  if(sp==='chick'){H.push([new THREE.ConeGeometry(hr*.22,hr*.5,4),M(0,headY-hr*.15,headZ+hr*1.0,Math.PI/2,0,0,1.3,1,.7),0xff8a1e]);for(let i=-1;i<=1;i++)H.push([new THREE.ConeGeometry(.06,.3,5),M(i*.08,headY+hr*1.02,headZ,0,0,i*.4),c2]);
   ARM.push([S(tr*.5,10,8),M(0,-tr*.35,0,0,0,0,.45,1.3,.9),c]);}
  if(sp==='bunny'){H.push([S(hr*.11),M(0,headY-hr*.12,headZ+hr*.98),0xff8ab0]);H.push([new THREE.BoxGeometry(hr*.22,hr*.2,.05),M(0,headY-hr*.38,headZ+hr*.86),0xffffff]);
   EAR.push([new THREE.CapsuleGeometry(hr*.17,hr*1.1,4,10),M(0,hr*.65,0,0,0,0,1,1,.55),c]);EAR.push([new THREE.CapsuleGeometry(hr*.1,hr*.9,4,8),M(0,hr*.65,hr*.06,0,0,0,1,1,.4),c2]);
   TL.push([S(tr*.35,10,8),M(0,0,0),0xffffff]);}
  if(sp==='fox'||sp==='cat'){H.push([new THREE.ConeGeometry(hr*.38,hr*.6,8),M(0,headY-hr*.18,headZ+hr*.95,Math.PI/2,0,0,1.15,1,.75),sp==='fox'?c2:c]);H.push([S(hr*.09),M(0,headY-hr*.08,headZ+hr*1.27),0x15151a]);
   H.push([S(hr*.45),M(0,headY-hr*.45,headZ+hr*.55,0,0,0,1,.6,.8),c2]);
   EAR.push([new THREE.ConeGeometry(hr*.3,hr*(sp==='fox'?.7:.55),4),M(0,hr*.3,0,0,Math.PI/4,0,1,1,.5),c]);EAR.push([new THREE.ConeGeometry(hr*.17,hr*.42,4),M(0,hr*.24,hr*.06,0,Math.PI/4,0,1,1,.3),sp==='fox'?0x2a1a14:0xff9ac0]);
   if(sp==='cat'){for(const s of[-1,1])for(let i=0;i<2;i++)H.push([new THREE.BoxGeometry(hr*.7,.012,.012),M(s*hr*.6,headY-hr*.2-i*.05,headZ+hr*.95,0,0,s*(i?.15:-.1)),0xffffff]);
    TL.push([new THREE.TorusGeometry(tr*1.2,tr*.13,6,14,Math.PI*.9),M(0,tr*1.2,0,0,Math.PI/2,0),c]);}
   else{TL.push([new THREE.CapsuleGeometry(tr*.38,tr*1.6,4,10),M(0,tr*.6,-tr*.6,-1.1,0,0),c]);TL.push([S(tr*.42,10,8),M(0,tr*1.25,-tr*1.25,0,0,0,1,1.1,1),c2]);}}
  if(sp==='bear'){H.push([S(hr*.42),M(0,headY-hr*.28,headZ+hr*.72,0,0,0,1.1,.8,.9),c2]);H.push([S(hr*.13),M(0,headY-hr*.12,headZ+hr*1.08,0,0,0,1.3,.9,1),0x15151a]);
   EAR.push([S(hr*.3,12,10),M(0,hr*.1,0,0,0,0,1,1,.6),c]);EAR.push([S(hr*.17,10,8),M(0,hr*.1,hr*.1,0,0,0,1,1,.4),c2]);TL.push([S(tr*.25,8,6),M(0,0,0),c]);}}
 // arms (shoulder at origin, pointing -y)
 if(!ARM.length){const ar=sp==='mech'?tr*.32:tr*.24,al=heavy?.62:.5;ARM.push([new THREE.CapsuleGeometry(ar,al,4,8),M(0,-al/2,0),sp==='bot'?METAL:c]);ARM.push([S(ar*1.35,10,8),M(0,-al-ar*.6,0),sp==='bot'||sp==='mech'?0x2a2c34:c2]);}
 return{T,H,E,EAR,TL,ARM,GL,tr,hr,headY};}

export function makeDriver(ch){const d=driverParts(ch),g=new THREE.Group(),rough=ch.sp==='bot'||ch.sp==='mech'?.4:.8,metal=ch.sp==='bot'||ch.sp==='mech'?.5:0;const fm=furMat(rough,metal);
 const mk=(L,mat=fm)=>{if(!L.length)return null;const m=new THREE.Mesh(merge(L),mat);m.castShadow=true;return m;};
 const torso=mk(d.T);g.add(torso);if(d.GL.length){const gl=mk(d.GL,glowMat);torso.add(gl);}
 const headPiv=new THREE.Group();headPiv.position.y=d.tr*1.6;g.add(headPiv);const head=mk(d.H);head.position.y=-d.tr*1.6;headPiv.add(head);
 const eyesMat=ch.sp==='bot'||ch.sp==='mech'?glowMat:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.15});const eyes=mk(d.E,eyesMat);eyes.position.y=-d.tr*1.6;
 const eyePiv=new THREE.Group();eyePiv.position.y=d.headY;eyes.position.y=-d.headY;eyePiv.add(eyes);eyePiv.position.y=d.headY-d.tr*1.6;headPiv.add(eyePiv);
 const ears=[];if(d.EAR.length){const geo=merge(d.EAR);const n=ch.sp==='bot'||ch.sp==='mech'?1:2;for(let i=0;i<n;i++){const piv=new THREE.Group();const m=new THREE.Mesh(i?geo:geo,fm);m.castShadow=true;piv.add(m);
   const s=n===1?0:(i?1:-1);piv.position.set(s*d.hr*(ch.sp==='bear'?.7:.45),d.headY-d.tr*1.6+d.hr*(ch.sp==='bear'?.62:.72),0);piv.rotation.z=-s*(ch.sp==='bunny'?.18:.3);piv.userData.base=piv.rotation.z;headPiv.add(piv);ears.push({piv,v:0,a:0});}}
 let tail=null;if(d.TL.length){tail=new THREE.Group();const m=mk(d.TL);tail.add(m);tail.position.set(0,d.tr*.6,-d.tr*.9);g.add(tail);}
 const arms=[];for(const s of[-1,1]){const piv=new THREE.Group();const m=mk(d.ARM);piv.add(m);piv.position.set(s*d.tr*(ch.sp==='chick'?1.15:1.05),d.tr*1.55,d.tr*.1);g.add(piv);arms.push(piv);}
 // scarf in kart colour for the critters
 let scarf=null;if(!['bot','mech','frog'].includes(ch.sp)){scarf=new THREE.Group();scarf.position.set(d.tr*.3,d.tr*2.0,-d.tr*.6);const sm=furMat(.8,0);const L=[];for(let i=0;i<4;i++)L.push([new THREE.BoxGeometry(.16-i*.015,.05,.22),M(Math.sin(i*1.3)*.03*i,-i*.03,-i*.2-.1,i*.12,0,0),ch.kart]);const seg=new THREE.Mesh(merge(L),sm);seg.castShadow=true;scarf.add(seg);g.add(scarf);}
 return{g,torso,headPiv,eyePiv,ears,tail,arms,scarf,tr:d.tr,hr:d.hr,headY:d.headY};}


/* ---------- full racer ---------- */
const IDS={bodies:['racer','dart','rover','brick'],wheels:['std','slick','monster','cyber'],gliders:['wing','para','kite']};
export function makeRacer(ch,parts={body:0,wheels:0,glider:0},paint=null,o={}){
 const bid=IDS.bodies[parts.body],wid=IDS.wheels[parts.wheels],gid=IDS.gliders[parts.glider],WM=WHEEL_META[wid];
 const root=new THREE.Group(),chassis=new THREE.Group();root.add(chassis);const col=paint??ch.kart;const KM=kartMat();
 const num=o.num||(([...ch.id].reduce((a,c)=>a+c.charCodeAt(0),0))%16)+1;
 const bp=bodyParts(bid,col,num,ch.col2===0xffffff||ch.col2===0xfff4f6?0xffc21a:ch.col2),BM=bp.meta;
 const body=new THREE.Mesh(bp.g,KM);body.castShadow=true;body.receiveShadow=true;chassis.add(body);
 const lift=WM.r-.38;chassis.position.y=lift;
 // steering wheel (its own mesh so it can turn)
 const sw=new THREE.Group();sw.position.set(...BM.wheel);sw.rotation.x=-.9;
 const swm=new THREE.Mesh(kmerge([{g:new THREE.TorusGeometry(.19,.032,D()>=2?8:5,D()>=2?22:12),k:'rubber',c:0x1c1c20},{g:new THREE.BoxGeometry(.34,.035,.03),k:'metal',c:0x8a8e98},{g:new THREE.CylinderGeometry(.06,.06,.05,D()>=2?14:8),m:M(0,0,.02,Math.PI/2,0,0),k:'paint',c:col},{g:new THREE.BoxGeometry(.12,.05,.02),m:M(0,.07,.03),k:'lamp',c:0x40ff80}]),KM);sw.add(swm);chassis.add(sw);
 // driver
 const drv=makeDriver(ch);drv.g.position.set(...BM.seat);chassis.add(drv.g);
 // wheels
 const wg=wheelParts(wid),wheels=[];const ax=BM.ax;
 for(const[x,z,front]of[[ax[0],ax[1],1],[-ax[0],ax[1],1],[ax[0],ax[2],0],[-ax[0],ax[2],0]]){const piv=new THREE.Group();piv.position.set(x+Math.sign(x)*(WM.w-.32)/2,WM.r,z);const spin=new THREE.Group();const t=new THREE.Mesh(wg.g,KM);t.castShadow=D()>=1;if(x<0)t.rotation.y=Math.PI;spin.add(t);piv.add(spin);root.add(piv);wheels.push({piv,spin,front,base:WM.r});}
 // exhaust flames (boost)
 const flameMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uC:{value:new THREE.Color(2.6,1.2,.3)},uS:{value:1}},
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT,uS;uniform vec3 uC;varying vec2 vU;void main(){float f=1.-vU.y;float n=sin(vU.x*20.+uT*40.)*.15+.85+sin(vU.y*30.-uT*60.)*.1;float a=pow(f,1.5)*n*uS;vec3 c=mix(uC,vec3(3.,3.,2.6),pow(f,5.));gl_FragColor=vec4(c*a,1.);}'});
 const flames=[];const E=BM.exh;for(const s of[-1,1]){const f=new THREE.Mesh(new THREE.ConeGeometry(.17,1.3,10,1,true),flameMat);if(BM.stack){f.position.set(s*E[0],E[1]+lift+.6,E[2]-.1);f.rotation.x=-.5;}else{f.rotation.x=-Math.PI/2;f.position.set(s*E[0],E[1]+lift,E[2]-.62);}f.visible=false;root.add(f);flames.push(f);}
 // glider
 const gl=gliderGroup(gid,col);gl.position.set(0,2.4+lift,-.3);gl.scale.setScalar(.001);gl.visible=false;root.add(gl);
 // aura shell
 const aura=new THREE.Mesh(new THREE.SphereGeometry(1.9,24,16),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;varying float vY;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vY=position.y;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uT,uA;varying vec3 vN,vV;varying float vY;vec3 hue(float h){return clamp(abs(mod(h*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);}void main(){float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(hue(fract(uT*.8+vY*.3))*f*uA*2.2,1.);}'}));
 aura.position.y=.9;aura.scale.set(1,.75,1.25);aura.visible=false;root.add(aura);
 // balloons (battle)
 const bal=new THREE.Group();bal.visible=false;root.add(bal);const balloons=[];
 for(let i=0;i<5;i++){const b=new THREE.Group();const m=new THREE.Mesh(new THREE.SphereGeometry(.42,14,12).scale(1,1.15,1),new THREE.MeshPhysicalMaterial({color:col,roughness:.15,clearcoat:1}));m.position.y=.3;m.castShadow=true;b.add(m);
  const str=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,1.4,3),new THREE.MeshBasicMaterial({color:0xdddddd}));str.position.y=-.5;b.add(str);b.position.set((i-1)*.45,2.4+lift,-1.3);bal.add(b);balloons.push(b);}
 const blob=null;
 root.userData={chassis,sw,drv,wheels,flames,flameMat,glider:gl,aura,bal,balloons,blob,lift,W:WM,B:BM,col,susp:0,suspV:0,blinkT:2+Math.random()*3,squash:0,squashV:0,celebrate:0,headLook:0,gl:0,body};
 return root;}

export function poseRacer(m,s,dt,t){const u=m.userData;const d=u.drv;
 // suspension + squash springs
 u.suspV+=(-u.susp*180-u.suspV*12)*dt;u.susp=cl(u.susp+u.suspV*dt,-.15,.12);if(s.land){u.suspV-=s.land*1.6;u.squashV+=s.land*1.4;s.land=0;}
 u.squashV+=(-u.squash*160-u.squashV*10)*dt;u.squash=cl(u.squash+u.squashV*dt,-.3,.35);
 u.chassis.position.y=u.lift+u.susp+(s.idle?Math.sin(t*28)*.012:0);u.chassis.rotation.z=-s.steer*.05*s.spdF;u.chassis.rotation.x=-s.accel*.025;
 d.g.scale.set(1+u.squash*.5,1-u.squash,1+u.squash*.5);
 d.g.rotation.z=-s.steer*.28*Math.min(1,s.spdF+.2)+(s.driftDir?-s.driftDir*.12:0);d.g.rotation.x=s.boost?-.18:0;
 u.sw.rotation.z=s.steer*1.4;
 // arms follow the wheel; celebrate pose overrides
 const cel=u.celebrate;d.arms.forEach((a,i)=>{const sd=i?1:-1;const wave=Math.sin(t*10+i*2)*.3;
  a.rotation.x=cl(-1.15+cel*(-1.6+wave),-3,0);a.rotation.z=sd*(.25+cel*.5)+s.steer*.55*(1-cel);a.rotation.y=0;});
 // head: look toward rivals / back / wobble when hurt
 let look=s.lookBack?Math.PI*.85:s.look||0;if(s.hurt>0)look=Math.sin(t*14)*.6;u.headLook+=(look-u.headLook)*Math.min(1,dt*8);d.headPiv.rotation.y=u.headLook;d.headPiv.rotation.x=s.hurt>0?Math.sin(t*9)*.25:cel*-.25;d.headPiv.rotation.z=s.trick?Math.sin(t*20)*.2:0;
 // blink
 u.blinkT-=dt;let bl=1;if(u.blinkT<0){bl=.12;if(u.blinkT<-.12)u.blinkT=2+Math.random()*4;}if(s.hurt>0)bl=.25;d.eyePiv.scale.y=bl;
 // ears + tail + scarf physics-lite
 for(const e of d.ears){const tgt=-s.spd*.012-s.accel*.04+(s.air?.4:0);e.v+=((tgt-e.a)*60-e.v*6)*dt;e.a+=e.v*dt;e.piv.rotation.x=cl(e.a,-1.2,.8);}
 if(d.tail){d.tail.rotation.y=Math.sin(t*4.5)*.35+s.steer*.4;d.tail.rotation.x=Math.sin(t*3)*.1;}
 if(d.scarf){d.scarf.children.forEach((c,i)=>{c.position.y=Math.sin(t*14-i*1.2)*.04*(1+s.spdF);c.rotation.y=Math.sin(t*9-i)*.3;c.position.x=Math.sin(t*7-i)*.04*i;});d.scarf.rotation.x=.15+s.spdF*.3;}
 // wheels
 for(const w of u.wheels){if(w.front)w.piv.rotation.y=s.steer*.45;w.spin.rotation.x+=s.spd*dt/w.base;}
 // flames
 u.flames.forEach(f=>{f.visible=!!s.boost;if(s.boost){f.scale.set(1,.8+Math.random()*.5*(s.boostLvl||1),1);}});u.flameMat.uniforms.uT.value=t;u.flameMat.uniforms.uC.value.set(...(s.boostCol||[2.6,1.2,.3]));
 // glider
 const gt=s.glide?1:0;u.gl+=(gt-u.gl)*Math.min(1,dt*(gt?5:8));u.glider.visible=u.gl>.02;u.glider.scale.setScalar(Math.max(.001,u.gl));u.glider.rotation.z=-s.steer*.3;
 // aura
 u.aura.visible=s.aura>0;if(s.aura>0){u.aura.material.uniforms.uT.value=t;u.aura.material.uniforms.uA.value=Math.min(1,s.aura);}
 // balloons
 if(s.balloons!==undefined){u.bal.visible=true;u.balloons.forEach((b,i)=>{b.visible=i<s.balloons;b.position.x=(i-(s.balloons-1)/2)*.5;b.rotation.x=-.25-s.spdF*.4+Math.sin(t*3+i)*.08;b.rotation.z=Math.sin(t*2.2+i*1.7)*.12;});}else u.bal.visible=false;}

/* ---------- items ---------- */
export function orbMesh(kind){const g=new THREE.Group();const col=kind==='seeker'?0xff2a3a:0x2ae08a,glow=kind==='seeker'?new THREE.Color(3,.4,.4):new THREE.Color(.4,3,1.4);
 const shell=new THREE.Mesh(new THREE.SphereGeometry(.55,20,14),new THREE.MeshPhysicalMaterial({color:col,roughness:.15,clearcoat:1,metalness:.2,emissive:col,emissiveIntensity:.35}));shell.castShadow=true;g.add(shell);
 const band=new THREE.Mesh(new THREE.TorusGeometry(.56,.07,6,24),new THREE.MeshBasicMaterial({color:glow}));band.rotation.x=Math.PI/2;g.add(band);
 if(kind==='seeker'){for(const s of[-1,1]){const f=new THREE.Mesh(new THREE.ConeGeometry(.18,.5,4),new THREE.MeshStandardMaterial({color:0xffe04a,metalness:.4,roughness:.3}));f.position.set(s*.55,.15,-.1);f.rotation.z=-s*1.2;g.add(f);}
  for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));e.position.set(s*.2,.18,.48);g.add(e);}}
 g.userData.band=band;return g;}
export function peelMesh(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xffd83a,roughness:.5,side:THREE.DoubleSide}),m2=new THREE.MeshStandardMaterial({color:0xfff2b0,roughness:.7});
 for(let i=0;i<3;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.55,10,8,0,Math.PI*.5,0,Math.PI*.55),m);f.rotation.y=i*Math.PI*2/3;f.scale.set(1,1.1,1);f.position.y=.1;f.castShadow=true;g.add(f);}
 const c=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),m2);c.position.y=.32;g.add(c);const st=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,.3,6),new THREE.MeshStandardMaterial({color:0x5a3a10}));st.position.y=.55;g.add(st);return g;}
export function bombMesh(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.75,20,16),new THREE.MeshPhysicalMaterial({color:0x22242c,roughness:.3,metalness:.3,clearcoat:.8}));b.castShadow=true;g.add(b);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.2,10),new THREE.MeshStandardMaterial({color:0x8a8c94,metalness:.8,roughness:.3}));cap.position.y=.78;g.add(cap);
 const fuse=new THREE.Mesh(new THREE.TorusGeometry(.25,.04,5,10,Math.PI),new THREE.MeshStandardMaterial({color:0xc8a060}));fuse.position.set(.25,.9,0);g.add(fuse);
 const spark=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(4,3,1)}));spark.position.set(.5,.92,0);g.add(spark);g.userData.spark=spark;
 const eyes=new THREE.Mesh(merge([[new THREE.SphereGeometry(.12,8,6),M(-.22,.15,.66,0,0,0,1,1.4,.5),0xffffff],[new THREE.SphereGeometry(.12,8,6),M(.22,.15,.66,0,0,0,1,1.4,.5),0xffffff]]),new THREE.MeshBasicMaterial({vertexColors:true}));g.add(eyes);return g;}
export function pepperMesh(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.7,4,10),new THREE.MeshPhysicalMaterial({color:0xff2a1a,roughness:.2,clearcoat:1}));b.rotation.z=.4;g.add(b);
 const s=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,.3,6),new THREE.MeshStandardMaterial({color:0x2ab03a}));s.position.set(-.25,.5,0);s.rotation.z=.6;g.add(s);return g;}
export function droneMesh(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.SphereGeometry(.7,16,12).scale(1.3,.6,1.3),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.3,clearcoat:1}));g.add(body);
 const eye=new THREE.Mesh(new THREE.BoxGeometry(.8,.18,.05),new THREE.MeshBasicMaterial({color:new THREE.Color(.3,2.6,2.2)}));eye.position.set(0,.05,.86);g.add(eye);
 const props=[];for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;const arm=new THREE.Mesh(new THREE.BoxGeometry(1.2,.08,.12),new THREE.MeshStandardMaterial({color:0x2a2c34}));arm.position.set(Math.cos(a)*.8,.2,Math.sin(a)*.8);arm.rotation.y=-a;g.add(arm);
  const p=new THREE.Mesh(new THREE.BoxGeometry(.9,.02,.12),new THREE.MeshStandardMaterial({color:0xff4d00}));p.position.set(Math.cos(a)*1.3,.3,Math.sin(a)*1.3);g.add(p);props.push(p);}
 const line=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,2,4),new THREE.MeshBasicMaterial({color:0x888888}));line.position.y=-1;g.add(line);const hook=new THREE.Mesh(new THREE.TorusGeometry(.18,.04,6,12,Math.PI*1.4),new THREE.MeshStandardMaterial({color:0x888888,metalness:.9}));hook.position.y=-2.1;g.add(hook);
 g.userData.props=props;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
// a glass "ghost" copy for time-trial ghosts
export function ghostify(root){root.traverse(o=>{if(o.isMesh){o.castShadow=false;const m=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,.9,1.6),transparent:true,opacity:.28,depthWrite:false});o.material=m;}});return root;}
