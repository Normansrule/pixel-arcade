// AEONFALL — procedural low-poly models: champions, minions, monsters, structures, trees.
// Every rig part is merged into one vertex-coloured mesh (plus one glowing mesh), so a champion is ~12 draw calls.
// Animation is procedural (pose()). No model or image files.
import * as THREE from '../vendor/three.module.min.js';

const C=new THREE.Color(),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),Vs=new THREE.Vector3(),Vp=new THREE.Vector3();
export const TEAMC=['#4aa8ff','#ff4a5a'],TEAMC2=['#d8ecff','#ffd8d0'],TEAMDK=['#1d3a6e','#6e1d26'];
// geometry primitives (unit sized, centred)
const G={box:new THREE.BoxGeometry(1,1,1),sph:new THREE.IcosahedronGeometry(.5,1),sph2:new THREE.IcosahedronGeometry(.5,2),ico:new THREE.IcosahedronGeometry(.5,0),dod:new THREE.DodecahedronGeometry(.5,0),
 cyl:new THREE.CylinderGeometry(.5,.5,1,10),cyl6:new THREE.CylinderGeometry(.5,.5,1,6),cone:new THREE.ConeGeometry(.5,1,10),cone4:new THREE.ConeGeometry(.5,1,4),cone6:new THREE.ConeGeometry(.5,1,6),oct:new THREE.OctahedronGeometry(.5,0),
 tor:new THREE.TorusGeometry(.5,.08,6,20),tor2:new THREE.TorusGeometry(.5,.05,5,24,Math.PI),cap:new THREE.CapsuleGeometry(.5,1,3,8),tcyl:new THREE.CylinderGeometry(.36,.5,1,10),wedge:new THREE.CylinderGeometry(0,.5,1,3)};
{const sh=new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(1,0),new THREE.Vector2(0,1)]);const g=new THREE.ExtrudeGeometry(sh,{depth:1,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,-.5,0);G.tri=g;}
for(const k in G)G[k]=G[k].index?G[k].toNonIndexed():G[k];
// part list item: [geo, colour, [x,y,z], [sx,sy,sz], [rx,ry,rz]]
function merge(list){if(!list.length)return null;let n=0;for(const it of list)n+=G[it[0]].attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),Cc=new Float32Array(n*3);let o=0;
 const nm=new THREE.Matrix3();for(const[g,col,p=[0,0,0],s=[1,1,1],r=[0,0,0]]of list){const geo=G[g],pa=geo.attributes.position,na=geo.attributes.normal;C.set(col);E.set(r[0],r[1],r[2]);Q.setFromEuler(E);M4.compose(Vp.set(p[0],p[1],p[2]),Q,Vs.set(s[0],s[1],s[2]));nm.getNormalMatrix(M4);
  for(let i=0;i<pa.count;i++){Vp.fromBufferAttribute(pa,i).applyMatrix4(M4);P[o*3]=Vp.x;P[o*3+1]=Vp.y;P[o*3+2]=Vp.z;Vp.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N[o*3]=Vp.x;N[o*3+1]=Vp.y;N[o*3+2]=Vp.z;
   const sh=.86+.14*Math.max(0,Vp.y);Cc[o*3]=C.r*sh;Cc[o*3+1]=C.g*sh;Cc[o*3+2]=C.b*sh;o++;}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('color',new THREE.BufferAttribute(Cc,3));geo.computeBoundingSphere();return geo;}
// characters get a cool rim light so they read clearly against the ground from the top-down camera
function rim(m,k=.5){m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{vec3 vn=normalize(vNormal);float rm=pow(1.-abs(dot(vn,normalize(vViewPosition))),2.6);gl_FragColor.rgb+=vec3(.62,.7,.85)*rm*'+k.toFixed(2)+';}');};m.customProgramCacheKey=()=>'rim'+k;return m;}
export const MAT={body:rim(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.08})),flat:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true}),
 glow:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}),metal:rim(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.6}),.4)};
// a rig: named pivots with merged meshes. spec: {parts:{name:{parent,at:[x,y,z],solid:[],glow:[],metal:[]}}}
const cache=new Map();
function buildRig(key,spec){let geos=cache.get(key);if(!geos){geos={};for(const n in spec)geos[n]={s:merge(spec[n].solid||[]),g:merge(spec[n].glow||[]),m:merge(spec[n].metal||[])};cache.set(key,geos);}
 const root=new THREE.Group(),P={root};for(const n in spec){const sp=spec[n],g=new THREE.Group();g.position.set(...(sp.at||[0,0,0]));const gg=geos[n];
  if(gg.s){const m=new THREE.Mesh(gg.s,sp.flat?MAT.flat:MAT.body);m.castShadow=true;g.add(m);}if(gg.m){const m=new THREE.Mesh(gg.m,MAT.metal);m.castShadow=true;g.add(m);}if(gg.g){g.add(new THREE.Mesh(gg.g,MAT.glow));}P[n]=g;}
 for(const n in spec)(spec[n].parent?P[spec[n].parent]:root).add(P[n]);return{root,P};}
const glowC=(hex,k=1.6)=>{C.set(hex);return '#'+new THREE.Color(Math.min(1,C.r*k),Math.min(1,C.g*k),Math.min(1,C.b*k)).getHexString();};

/* ======================= champions ======================= */
function weapon(kind,L){const w={solid:[],glow:[],metal:[]};const{main,trim,glow}=L;
 switch(kind){
  case'greatsword':w.metal.push(['box','#cfd3da',[0,0,.95],[.08,.22,1.5]],['box',trim,[0,0,.12],[.12,.5,.08]]);w.solid.push(['cyl','#3a2418',[0,0,-.12],[.07,.4,.07],[Math.PI/2,0,0]]);w.glow.push(['box',glow,[0,0,1],[.1,.06,1.3]]);break;
  case'anchor':w.metal.push(['cyl','#6a7a80',[0,0,.6],[.09,1.5,.09],[Math.PI/2,0,0]],['tor2','#8a9aa0',[0,0,1.25],[.9,.9,1.6],[Math.PI/2,0,Math.PI]],['box','#8a9aa0',[0,0,.1],[.6,.08,.08]]);w.glow.push(['sph',glow,[0,0,1.3],[.22,.22,.22]]);break;
  case'staff':w.solid.push(['cyl','#4a2f20',[0,0,.4],[.07,1.9,.07],[Math.PI/2,0,0]],['tor',trim,[0,0,1.35],[.5,.5,.5],[0,0,0]]);w.glow.push(['oct',glow,[0,0,1.38],[.34,.42,.34]],['sph','#ffffff',[0,0,1.38],[.14,.14,.14]]);break;
  case'orb':w.glow.push(['sph2',glow,[0,.15,.25],[.42,.42,.42]]);w.solid.push(['tor',trim,[0,.15,.25],[.62,.62,.62],[Math.PI/2,0,0]]);break;
  case'bow':w.solid.push(['tor2',main,[0,0,.1],[1.4,1.4,1.4],[0,Math.PI/2,Math.PI/2]],['box',trim,[0,0,.1],[.1,.25,.1]]);w.glow.push(['box',glow,[0,0,-.02],[.02,1.35,.02]]);break;
  case'gun':w.metal.push(['box','#5a4a3a',[0,0,.35],[.2,.24,.9]],['cyl','#8a8a92',[.05,.05,.95],[.08,.5,.08],[Math.PI/2,0,0]],['cyl','#8a8a92',[-.05,-.05,.95],[.08,.5,.08],[Math.PI/2,0,0]]);w.solid.push(['box',trim,[0,-.15,.05],[.12,.3,.14]]);w.glow.push(['tor',glow,[0,0,.55],[.32,.32,.32]],['tor',glow,[0,0,.75],[.3,.3,.3]]);break;
  case'flower':w.solid.push(['cyl','#3a6a2a',[0,0,.4],[.06,1.7,.06],[Math.PI/2,0,0]]);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;w.solid.push(['sph',trim,[Math.cos(a)*.2,Math.sin(a)*.2,1.28],[.24,.24,.1]]);}w.glow.push(['sph',glow,[0,0,1.3],[.16,.16,.16]]);break;
  case'daggers':w.metal.push(['cone4','#d8d0e8',[0,0,.45],[.12,.7,.04],[Math.PI/2,0,0]]);w.glow.push(['box',glow,[0,0,.4],[.02,.02,.5]]);break;
  case'claws':for(const x of[-.08,0,.08])w.solid.push(['cone','#e8e0c8',[x,0,.25],[.06,.4,.06],[Math.PI/2,0,0]]);w.glow.push(['sph',glow,[0,0,.05],[.05,.05,.05]]);break;
  case'fists':w.solid.push(['dod',L.skin,[0,0,.05],[.55,.55,.55]]);w.glow.push(['box',glow,[0,.2,.1],[.3,.05,.3]]);break;}
 return w;}
function head(kind,L){const h={solid:[],glow:[],metal:[]};const{skin,main,trim,glow,hair}=L;
 switch(kind){
  case'rock':h.solid.push(['dod',skin,[0,.12,0],[.55,.45,.5]]);h.glow.push(['box',glow,[-.12,.15,.24],[.1,.05,.04]],['box',glow,[.12,.15,.24],[.1,.05,.04]]);break;
  case'helm':h.metal.push(['sph2','#9aa8b0',[0,.18,0],[.5,.52,.5]],['box','#9aa8b0',[0,.12,.2],[.36,.16,.14]]);h.solid.push(['box',trim,[0,.48,-.02],[.06,.22,.5]]);h.glow.push(['box',glow,[0,.16,.27],[.28,.04,.02]]);break;
  case'hair':h.solid.push(['sph2',skin,[0,.15,0],[.42,.46,.42]],['sph',hair,[0,.28,-.05],[.46,.34,.46]]);for(let i=0;i<5;i++)h.solid.push(['cone',hair,[(i-2)*.09,.42,-.12],[.12,.32,.12],[-.8,0,(i-2)*.25]]);h.solid.push(['box','#1a1a1a',[0,.18,.2],[.24,.04,.03]]);break;
  case'hood':h.solid.push(['sph2',skin,[0,.12,.03],[.38,.42,.38]],['cone',main,[0,.32,-.08],[.6,.7,.62],[-.3,0,0]]);h.glow.push(['oct',glow,[0,.42,.22],[.08,.1,.04]]);h.solid.push(['box','#2a1a3a',[0,.14,.19],[.2,.05,.03]]);break;
  case'crown':h.solid.push(['sph2',skin,[0,.15,0],[.42,.46,.42]],['sph',hair,[0,.24,-.06],[.46,.34,.46]]);for(let i=0;i<5;i++){const a=(i-2)*.38;h.glow.push(['cone4',glow,[Math.sin(a)*.2,.48,Math.cos(a)*.2-.04],[.07,.32,.07],[.2*Math.cos(a),0,-a*.4]]);}break;
  case'goggles':h.solid.push(['sph2',skin,[0,.15,0],[.42,.46,.42]],['sph',hair,[0,.3,-.04],[.44,.3,.44]]);h.metal.push(['tor','#a08040',[-.1,.2,.18],[.16,.16,.16]],['tor','#a08040',[.1,.2,.18],[.16,.16,.16]]);h.glow.push(['sph',glow,[-.1,.2,.2],[.1,.1,.03]],['sph',glow,[.1,.2,.2],[.1,.1,.03]]);break;
  case'mask':h.solid.push(['sph2',main,[0,.15,0],[.44,.48,.44]],['cone',main,[0,.35,-.18],[.3,.5,.3],[-1.2,0,0]]);h.glow.push(['box',glow,[0,.17,.21],[.28,.05,.02]]);break;
  case'beast':h.solid.push(['sph2',skin,[0,.12,.02],[.5,.44,.5]],['box',skin,[0,.03,.32],[.24,.2,.32]],['cone','#e8e0c8',[0,-.04,.48],[.06,.12,.06],[Math.PI,0,0]],['cone',main,[-.2,.4,-.02],[.14,.32,.1],[0,0,.3]],['cone',main,[.2,.4,-.02],[.14,.32,.1],[0,0,-.3]]);h.glow.push(['box',glow,[-.12,.17,.24],[.08,.04,.02]],['box',glow,[.12,.17,.24],[.08,.04,.02]]);break;
  case'flower':h.solid.push(['sph2',skin,[0,.15,0],[.42,.46,.42]],['sph',hair,[0,.26,-.08],[.48,.36,.5]]);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;h.solid.push(['sph',trim,[Math.cos(a)*.18+.12,.46,Math.sin(a)*.18-.05],[.16,.06,.16]]);}h.glow.push(['sph',glow,[.12,.48,-.05],[.1,.1,.1]]);break;}
 return h;}
function champSpec(L){
 const{body,skin,main,trim,glow}=L,S={};const g2=glowC(glow,1);
 let sh=.44,hip=1.0,torsoH=.78,legL=.95,arm=.82,width=.62;
 if(body==='golem'){sh=.72;hip=1;torsoH=.95;legL=.9;arm=1;width=1.1;}if(body==='slim'){sh=.38;width=.52;}if(body==='beast'){sh=.55;width=.8;}
 S.body={at:[0,hip,0],solid:[]};S.torso={parent:'body',at:[0,0,0],solid:[],glow:[],metal:[]};
 const T=S.torso;
 if(body==='golem'){T.solid.push(['dod',skin,[0,.55,0],[1.5,1.25,1.1]],['dod','#6a6258',[0,.05,0],[1,.6,.8]],['dod',main,[-.55,.95,-.1],[.6,.5,.6]],['dod',main,[.55,.95,-.1],[.6,.5,.6]]);T.glow.push(['box',g2,[0,.55,.52],[.5,.08,.04],[0,0,.5]],['box',g2,[-.2,.75,.5],[.06,.3,.04]],['box',g2,[.25,.35,.52],[.3,.06,.04],[0,0,-.4]]);}
 else if(body==='knight'){T.metal.push(['tcyl','#8a9aa0',[0,.42,0],[.66,.8,.48]],['sph','#9aa8b0',[-.42,.75,0],[.42,.36,.42]],['sph','#9aa8b0',[.42,.75,0],[.42,.36,.42]]);T.solid.push(['tcyl',main,[0,.05,0],[.6,.4,.46]],['box',main,[0,.45,-.28],[.7,.95,.05],[.15,0,0]],['box',trim,[0,.1,0],[.64,.1,.5]]);T.glow.push(['oct',g2,[0,.55,.26],[.14,.18,.06]]);}
 else if(body==='beast'){T.solid.push(['sph2',skin,[0,.45,-.05],[1,.95,.85]],['sph',main,[0,.85,-.15],[.9,.55,.8]],['cone',main,[-.25,.9,-.3],[.2,.5,.2],[-.6,0,.3]],['cone',main,[.25,.9,-.3],[.2,.5,.2],[-.6,0,-.3]],['cone',main,[0,1,-.35],[.2,.55,.2],[-.6,0,0]],['box',trim,[0,.05,0],[.7,.14,.55]]);T.glow.push(['box',g2,[-.3,.5,.4],[.05,.25,.03]],['box',g2,[.3,.5,.4],[.05,.25,.03]]);}
 else{const robe=L.robe;T.solid.push(['tcyl',main,[0,.4,0],[width*1.05,torsoH,width*.75]],['box',trim,[0,.02,0],[width*1.1,.1,width*.8]],['sph',main,[-sh,.72,0],[.32,.26,.32]],['sph',main,[sh,.72,0],[.32,.26,.32]]);
  T.glow.push(['box',g2,[0,.45,width*.38],[.06,.4,.02]]);if(robe)T.solid.push(['cone',main,[0,-.45,0],[width*1.55,1.05,width*1.35]],['tor',trim,[0,-.92,0],[width*1.5,width*1.5,1.2],[Math.PI/2,0,0]]);
  if(L.cape)T.solid.push(['box',L.cape,[0,.2,-.3],[width*1.2,1.2,.05],[.18,0,0]]);}
 S.head={parent:'torso',at:[0,body==='golem'?1.05:body==='beast'?1.0:torsoH+.05,body==='beast'?.25:0],...head(L.head,L)};
 const armCol=body==='golem'?skin:body==='knight'?'#8a9aa0':L.armC||skin;
 for(const s of[-1,1]){const n=s<0?'armL':'armR';S[n]={parent:'torso',at:[s*sh,body==='golem'?.9:.72,0],solid:[],glow:[]};
  if(body==='golem')S[n].solid.push(['dod',skin,[s*.15,-.35,0],[.45,.75,.45]]);else S[n].solid.push(['cap',armCol,[0,-arm*.42,0],[.2,arm*.5,.2]],['sph',main,[0,-.02,0],[.24,.22,.24]]);}
 S.hand={parent:'armR',at:[0,-arm*.9,.05],...weapon(L.weapon,L)};
 if(L.weapon==='fists'||L.weapon==='claws'||L.weapon==='daggers'){const w2=weapon(L.weapon,L);S.hand2={parent:'armL',at:[0,-arm*.9,.05],...w2};}
 if(!L.robe&&body!=='golem'){for(const s of[-1,1]){const n=s<0?'legL':'legR';S[n]={parent:'body',at:[s*.18*(width/.62),0,0],solid:[['cap',L.legC||main,[0,-legL*.45,0],[.24,legL*.5,.24]],['box',trim,[0,-legL+.08,.08],[.26,.16,.38]]]};}}
 if(body==='golem'){for(const s of[-1,1]){const n=s<0?'legL':'legR';S[n]={parent:'body',at:[s*.38,0,0],solid:[['dod','#6a6258',[0,-.5,0],[.55,.9,.55]]]};}}
 return S;}
export function champModel(def){const L={...def.look};if(def.id==='lyra'||def.id==='morrow'||def.id==='elowen'){L.robe=1;}if(def.id==='kaelen')L.cape='#7a1a12';if(def.id==='oriel')L.cape='#1a4a5a';if(def.id==='kiro')L.cape='#2a1640';if(def.id==='nyra'){L.legC='#4a3a2a';L.cape='#3a6a3a';}if(def.id==='dex')L.legC='#3a3a44';
 const r=buildRig('c_'+def.id,champSpec(L));r.kind='champ';r.scale=1.3*(def.look.body==='golem'?1.08:def.look.body==='beast'?1.05:1);r.root.scale.setScalar(r.scale);r.robe=!!L.robe;r.body=L.body;r.weapon=L.weapon;return r;}

/* ======================= minions ======================= */
export function minionGeo(type,team){const tc=TEAMC[team],dk=TEAMDK[team],lt=TEAMC2[team],gl=glowC(tc,1.3),list=[],glow=[];
 if(type==='melee'){list.push(['tcyl',tc,[0,.75,0],[.62,.7,.5]],['sph2','#c8ccd4',[0,1.3,0],[.5,.5,.5]],['box',tc,[0,1.55,0],[.08,.2,.4]],['cap',dk,[-.16,.25,0],[.2,.4,.2]],['cap',dk,[.16,.25,0],[.2,.4,.2]],['box','#d0d4dc',[.42,.9,.35],[.06,.12,.8]],['cyl',tc,[-.4,.85,.1],[.55,.08,.55],[0,0,Math.PI/2]]);glow.push(['box',gl,[0,1.3,.25],[.25,.05,.02]]);}
 if(type==='caster'){list.push(['cone',tc,[0,.55,0],[.75,1.1,.75]],['sph2','#e0c8a8',[0,1.25,0],[.42,.44,.42]],['cone',tc,[0,1.6,-.05],[.5,.6,.5],[-.3,0,0]],['cyl','#5a4030',[.38,.9,.2],[.05,1.2,.05]]);glow.push(['sph2',gl,[.38,1.55,.2],[.28,.28,.28]]);}
 if(type==='siege'){list.push(['box',tc,[0,.75,0],[1.3,.6,1.7]],['cyl','#4a3a2a',[-.7,.45,.5],[.85,.15,.85],[0,0,Math.PI/2]],['cyl','#4a3a2a',[.7,.45,.5],[.85,.15,.85],[0,0,Math.PI/2]],['cyl','#4a3a2a',[-.7,.45,-.5],[.85,.15,.85],[0,0,Math.PI/2]],['cyl','#4a3a2a',[.7,.45,-.5],[.85,.15,.85],[0,0,Math.PI/2]],['cyl','#6a6e78',[0,1.25,.3],[.42,1.3,.42],[1.25,0,0]],['box',tc,[0,1.08,-.4],[1.1,.16,.6]]);glow.push(['tor',gl,[0,1.4,.82],[.48,.48,.48],[1.25,0,0]]);}
 if(type==='super'){list.push(['sph2',tc,[0,1.4,0],[1.5,1.4,1.2]],['sph2','#c8ccd4',[0,2.1,.35],[.7,.6,.6]],['cap',dk,[-.4,.45,0],[.4,.6,.4]],['cap',dk,[.4,.45,0],[.4,.6,.4]],['dod','#c8ccd4',[-.95,1.1,.3],[.6,.6,.6]],['dod','#c8ccd4',[.95,1.1,.3],[.6,.6,.6]],['cone',tc,[-.5,2.6,0],[.2,.6,.2],[0,0,.4]],['cone',tc,[.5,2.6,0],[.2,.6,.2],[0,0,-.4]]);glow.push(['box',gl,[0,2.15,.65],[.45,.08,.04]],['sph',gl,[0,1.5,.62],[.4,.4,.1]]);}
 const s=merge(list),g=merge(glow);return{s,g};}

/* ======================= monsters ======================= */
function monSpec(kind){const S={};const B=(o)=>Object.assign({solid:[],glow:[]},o);
 switch(kind){
  case'sentinel':S.body=B({at:[0,1.6,0]});S.body.solid.push(['dod','#4a5a7a',[0,.4,0],[2,1.8,1.6]],['dod','#6a7a9a',[-1.1,.8,0],[.9,.9,.9]],['dod','#6a7a9a',[1.1,.8,0],[.9,.9,.9]],['dod','#3a4660',[0,-.8,0],[1.2,.9,1]]);S.body.glow.push(['oct','#5ab8ff',[0,1.6,0],[.7,1.1,.7]],['oct','#5ab8ff',[-1.2,1.5,0],[.3,.6,.3]],['oct','#5ab8ff',[1.2,1.5,0],[.3,.6,.3]],['box','#8ad8ff',[0,.5,.8],[.6,.12,.05]]);
   S.armL=B({parent:'body',at:[-1.3,.4,0],solid:[['dod','#4a5a7a',[0,-.7,.1],[.8,1.4,.8]]]});S.armR=B({parent:'body',at:[1.3,.4,0],solid:[['dod','#4a5a7a',[0,-.7,.1],[.8,1.4,.8]]]});break;
  case'brute':S.body=B({at:[0,1.4,0]});S.body.solid.push(['sph2','#7a2a22',[0,.4,0],[2,1.7,1.7]],['sph2','#5a1a16',[0,1.1,.5],[1.1,.9,1]],['cone','#e8d8b0',[-.5,1.7,.6],[.25,.9,.25],[.4,0,.7]],['cone','#e8d8b0',[.5,1.7,.6],[.25,.9,.25],[.4,0,-.7]],['cap','#5a1a16',[-.55,-.8,0],[.55,.7,.55]],['cap','#5a1a16',[.55,-.8,0],[.55,.7,.55]]);S.body.glow.push(['box','#ff6a2a',[-.25,1.2,1],[.2,.08,.04]],['box','#ff6a2a',[.25,1.2,1],[.2,.08,.04]],['sph','#ff4a1a',[0,.4,.85],[.6,.6,.2]]);
   S.armL=B({parent:'body',at:[-1.1,.7,0],solid:[['cap','#7a2a22',[0,-.6,.2],[.5,.9,.5]]]});S.armR=B({parent:'body',at:[1.1,.7,0],solid:[['cap','#7a2a22',[0,-.6,.2],[.5,.9,.5]]]});break;
  case'wolf':case'pup':{const k=kind==='wolf'?1:.65;S.body=B({at:[0,.9*k,0]});S.body.solid.push(['cap','#3a3440',[0,0,0],[.7*k,1.2*k,.7*k],[Math.PI/2,0,0]],['sph2','#2a2430',[0,.25*k,.4*k],[.8*k,.7*k,.7*k]],['sph2','#3a3440',[0,.35*k,.95*k],[.5*k,.48*k,.55*k]],['box','#3a3440',[0,.25*k,1.25*k],[.26*k,.2*k,.4*k]],['cone','#2a2430',[-.15*k,.65*k,.9*k],[.14*k,.3*k,.1*k]],['cone','#2a2430',[.15*k,.65*k,.9*k],[.14*k,.3*k,.1*k]],['cone','#2a2430',[0,.15*k,-.85*k],[.18*k,.7*k,.18*k],[-2,0,0]]);
   for(const[x,z]of[[-.25,.45],[.25,.45],[-.25,-.4],[.25,-.4]])S.body.solid.push(['cap','#2a2430',[x*k,-.5*k,z*k],[.18*k,.5*k,.18*k]]);S.body.glow.push(['box','#c060ff',[-.12*k,.45*k,1.2*k],[.08*k,.04*k,.02]],['box','#c060ff',[.12*k,.45*k,1.2*k],[.08*k,.04*k,.02]]);break;}
  case'beak':case'chick':{const k=kind==='beak'?1:.6;S.body=B({at:[0,1*k,0]});S.body.solid.push(['sph2','#d8d0c0',[0,.2*k,0],[.9*k,.9*k,1.1*k]],['sph2','#c8a060',[0,.75*k,.35*k],[.55*k,.55*k,.55*k]],['cone','#ffb030',[0,.7*k,.75*k],[.18*k,.45*k,.18*k],[Math.PI/2,0,0]],['cone','#8a2a2a',[0,1.1*k,.3*k],[.12*k,.4*k,.3*k]],['cone','#d8d0c0',[0,.3*k,-.65*k],[.4*k,.6*k,.2*k],[-1.6,0,0]],['cyl','#ffb030',[-.2*k,-.55*k,0],[.06*k,.7*k,.06*k]],['cyl','#ffb030',[.2*k,-.55*k,0],[.06*k,.7*k,.06*k]]);S.body.glow.push(['sph','#ffe060',[-.15*k,.82*k,.6*k],[.07*k,.07*k,.04]],['sph','#ffe060',[.15*k,.82*k,.6*k],[.07*k,.07*k,.04]]);break;}
  case'krug':case'krugling':{const k=kind==='krug'?1:.6;S.body=B({at:[0,.9*k,0]});S.body.solid.push(['dod','#6a6050',[0,.35*k,0],[1.9*k,1.4*k,1.9*k]],['dod','#8a7a60',[-.4*k,.9*k,-.2*k],[.7*k,.6*k,.7*k]],['dod','#8a7a60',[.5*k,.8*k,.3*k],[.6*k,.5*k,.6*k]],['sph2','#5a5040',[0,0,.9*k],[.7*k,.6*k,.6*k]]);for(const[x,z]of[[-.6,.6],[.6,.6],[-.6,-.6],[.6,-.6]])S.body.solid.push(['cyl','#4a4034',[x*k,-.55*k,z*k],[.38*k,.6*k,.38*k]]);S.body.glow.push(['box','#ffb040',[-.15*k,.08*k,1.2*k],[.1*k,.05*k,.03]],['box','#ffb040',[.15*k,.08*k,1.2*k],[.1*k,.05*k,.03]]);break;}
  case'bog':S.body=B({at:[0,.9,0]});S.body.solid.push(['sph2','#4a6a3a',[0,.3,0],[2.2,1.4,2]],['sph2','#6a8a4a',[0,.8,.5],[1.6,.9,1.4]],['sph2','#c8d8a0',[0,0,.7],[1.5,.7,1.2]],['sph2','#5a7a40',[-.5,1.2,.7],[.5,.5,.5]],['sph2','#5a7a40',[.5,1.2,.7],[.5,.5,.5]],['cap','#4a6a3a',[-.9,-.4,-.4],[.5,.6,.5]],['cap','#4a6a3a',[.9,-.4,-.4],[.5,.6,.5]]);S.body.glow.push(['sph','#e0ff60',[-.5,1.3,.92],[.25,.25,.12]],['sph','#e0ff60',[.5,1.3,.92],[.25,.25,.12]]);for(let i=0;i<5;i++)S.body.glow.push(['sph','#b0ff40',[(i-2)*.4,1.1-.1*Math.abs(i-2),-.6],[.15,.15,.15]]);break;
  case'drake':{S.body=B({at:[0,2.5,0]});const R='#9a2a12',R2='#b8401a',D='#5a160a',BL='#f2a868',H='#f0dca0';
   S.body.solid.push(['sph2',R,[0,.2,.5],[1.7,1.45,1.9]],['sph2',R,[0,.05,-1],[1.35,1.2,1.6]],['sph2',BL,[0,-.42,.2],[1.25,.8,2.1]],
    ['cap',R2,[0,1.05,1.7],[.62,1.3,.62],[.75,0,0]],['sph2',R2,[0,1.85,2.35],[.8,.7,.95]],['box',R2,[0,1.7,3.05],[.55,.38,.95]],['box',D,[0,1.45,2.95],[.46,.16,.85],[.12,0,0]],
    ['cone',H,[-.32,2.25,2.05],[.16,.9,.16],[-1.2,0,.35]],['cone',H,[.32,2.25,2.05],[.16,.9,.16],[-1.2,0,-.35]],['cone',H,[-.5,1.95,2.2],[.1,.5,.1],[-1.4,0,.9]],['cone',H,[.5,1.95,2.2],[.1,.5,.1],[-1.4,0,-.9]]);
   for(let i=0;i<9;i++){const k=1-i/9;S.body.solid.push(['sph2',i%2?R:R2,[0,-.1-i*.12,-2.0-i*.45],[1.0*k+.18,.85*k+.15,.9*k+.25]]);}
   S.body.solid.push(['cone',D,[0,-1.15,-6.3],[.55,1.1,.2],[-1.7,0,0]]);
   for(let i=0;i<9;i++)S.body.solid.push(['cone4',i<3?H:'#ffc040',[0,1.05-Math.max(0,i-2)*.12+(i<2?.4:0),1.6-i*.75],[.28,.7-.04*i,.28]]);
   for(const[x,z,f]of[[-.95,1.1,1],[.95,1.1,1],[-.9,-1.1,0],[.9,-1.1,0]]){S.body.solid.push(['cap',D,[x,-1.35,z],[.55,1.2,.55]],['sph2',R,[x*.95,-.5,z],[.75,.8,.8]]);for(const c of[-.18,0,.18])S.body.solid.push(['cone',H,[x+c,-2.35,z+.35],[.09,.35,.09],[1.4,0,0]]);}
   S.body.glow.push(['box','#ffe060',[-.3,1.98,2.95],[.2,.09,.05],[0,0,-.3]],['box','#ffe060',[.3,1.98,2.95],[.2,.09,.05],[0,0,.3]],['sph','#ff8020',[0,1.5,3.5],[.45,.22,.22]]);
   for(let i=0;i<5;i++)S.body.glow.push(['sph','#ff7020',[0,-.46,1.2-i*.6],[.55-.06*i,.08,.2]]);
   for(const s of[-1,1]){const n=s<0?'wingL':'wingR',rz=s<0?Math.PI:0;S[n]=B({parent:'body',at:[s*.9,.9,.6],solid:[['box',D,[s*2.1,.12,.05],[4.3,.2,.22]],['cone',H,[s*4.3,.12,.3],[.13,.7,.13],[Math.PI/2,0,0]],
     ['tri','#c4401c',[0,0,0],[4.2,.07,3.2],[0,0,rz]],['tri','#a8321a',[s*1.6,-.02,0],[2.7,.07,2.4],[0,0,rz]],['tri','#d85a2a',[s*2.9,-.01,0],[1.4,.07,1.5],[0,0,rz]],
     ['cap',D,[s*1.5,.05,-1.2],[.08,2.2,.08],[Math.PI/2,0,s*.0],[0,0,0]]],glow:[['box','#ff8030',[s*2.1,.24,.05],[4,.03,.06]]]});S[n].solid[5][4]=[Math.PI/2,0,0];S[n].solid[5][2]=[s*1.3,.02,-1];}
   break;}
  case'warden':S.body=B({at:[0,3.2,0]});S.body.solid.push(['dod','#2a2448',[0,0,0],[3.4,3,2.6]],['dod','#3a3460',[0,1.9,.6],[1.9,1.6,1.7]],['cone','#c8b8ff',[-.9,3,.4],[.4,1.6,.4],[-.3,0,.5]],['cone','#c8b8ff',[.9,3,.4],[.4,1.6,.4],[-.3,0,-.5]],['dod','#2a2448',[-1.2,-2.2,0],[1.2,1.6,1.2]],['dod','#2a2448',[1.2,-2.2,0],[1.2,1.6,1.2]]);
   S.body.glow.push(['oct','#b080ff',[0,.2,1.25],[.9,1.4,.5]],['box','#e0c8ff',[-.45,2,1.42],[.35,.12,.05]],['box','#e0c8ff',[.45,2,1.42],[.35,.12,.05]],['tor','#9a6aff',[0,.3,0],[5,5,5],[Math.PI/2,0,0]]);
   S.armL=B({parent:'body',at:[-2,.8,0],solid:[['dod','#3a3460',[0,-1.3,.4],[1.2,2.6,1.2]]],glow:[['oct','#b080ff',[0,-2.7,.5],[.6,.9,.6]]]});S.armR=B({parent:'body',at:[2,.8,0],solid:[['dod','#3a3460',[0,-1.3,.4],[1.2,2.6,1.2]]],glow:[['oct','#b080ff',[0,-2.7,.5],[.6,.9,.6]]]});break;}
 return S;}
export function monsterModel(kind){const r=buildRig('m_'+kind,monSpec(kind));r.kind='mon';r.mk=kind;return r;}

/* ======================= structures ======================= */
export function structModel(kind,team){const tc=TEAMC[team],gl=glowC(tc,1.25),dk=TEAMDK[team],sp={};
 if(kind==='tower'){sp.base={solid:[['cyl6','#8a8478',[0,.5,0],[3.2,1,3.2]],['cyl6','#b0aa9c',[0,1.2,0],[2.6,.5,2.6]],['tcyl','#c4bdae',[0,3.1,0],[1.6,3.4,1.6]],['cyl6','#9a9488',[0,4.9,0],[2.3,.4,2.3]],['box','#7a7468',[0,2.4,0],[1.8,.22,1.8]],
   ['box',tc,[0,3.4,.82],[.7,1.6,.04]],['box',tc,[0,3.4,-.82],[.7,1.6,.04]],['box',tc,[.82,3.4,0],[.04,1.6,.7]],['box',tc,[-.82,3.4,0],[.04,1.6,.7]],['cone6',dk,[0,5.6,0],[2.2,1,2.2]]],
   metal:[['cone6','#d8b870',[-1,5.2,-1],[.25,.8,.25]],['cone6','#d8b870',[1,5.2,-1],[.25,.8,.25]],['cone6','#d8b870',[-1,5.2,1],[.25,.8,.25]],['cone6','#d8b870',[1,5.2,1],[.25,.8,.25]],['tor','#d8b870',[0,1.45,0],[2.7,2.7,2.7],[Math.PI/2,0,0]]],
   glow:[['box',gl,[0,3.4,.85],[.12,1.2,.02]],['box',gl,[0,3.4,-.85],[.12,1.2,.02]],['box',gl,[.85,3.4,0],[.02,1.2,.12]],['box',gl,[-.85,3.4,0],[.02,1.2,.12]]]};
  sp.gem={at:[0,6.9,0],glow:[['oct',gl,[0,0,0],[.75,1.25,.75]],['oct','#ffffff',[0,0,0],[.35,.6,.35]]],metal:[['tor','#d8b870',[0,0,0],[1.4,1.4,1.4],[Math.PI/2,0,0]]]};}
 if(kind==='inhib'){sp.base={solid:[['cyl6','#8a8478',[0,.4,0],[4,.8,4]],['cyl6','#a09a8c',[0,.95,0],[3,.4,3]],['cyl6',dk,[0,1.25,0],[2.4,.3,2.4]]],metal:[['cone6','#c8b070',[1.6,1.3,0],[.3,1.2,.3]],['cone6','#c8b070',[-1.6,1.3,0],[.3,1.2,.3]],['cone6','#c8b070',[0,1.3,1.6],[.3,1.2,.3]],['cone6','#c8b070',[0,1.3,-1.6],[.3,1.2,.3]]],glow:[['tor',gl,[0,1.45,0],[3,3,3],[Math.PI/2,0,0]]]};
  sp.gem={at:[0,3.2,0],glow:[['sph2',gl,[0,0,0],[2,2,2]],['sph2','#ffffff',[0,0,0],[1,1,1]]],solid:[['tor',dk,[0,0,0],[3,3,3],[Math.PI/2,0,0]],['tor',dk,[0,0,0],[2.8,2.8,2.8],[0,0,0]]]};}
 if(kind==='core'){sp.base={solid:[['cyl6','#8a8478',[0,.6,0],[8,1.2,8]],['cyl6','#a09a8c',[0,1.5,0],[6.4,.7,6.4]],['cyl6',dk,[0,2.1,0],[5,.5,5]],['tcyl','#9a9488',[0,3.2,0],[2.6,2,2.6]]],metal:[],glow:[['tor',gl,[0,2.4,0],[5.2,5.2,5.2],[Math.PI/2,0,0]]]};
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;sp.base.metal.push(['cone6','#c8b070',[Math.cos(a)*3.6,3.2,Math.sin(a)*3.6],[.5,3.2,.5]]);sp.base.glow.push(['oct',gl,[Math.cos(a)*3.6,5.2,Math.sin(a)*3.6],[.4,.7,.4]]);}
  sp.gem={at:[0,7.4,0],glow:[['oct',gl,[0,0,0],[3.2,5,3.2]],['oct','#ffffff',[0,0,0],[1.6,2.6,1.6]]],solid:[['tor',dk,[0,0,0],[5,5,5],[Math.PI/2,0,0]],['tor','#c8b070',[0,0,0],[6,6,6],[Math.PI/2.4,0,0]]]};}
 if(kind==='fountain'){sp.base={solid:[['cyl','#8a8478',[0,.25,0],[11,.5,11]],['cyl','#a09a8c',[0,.6,0],[8,.4,8]]],metal:[],glow:[['cyl',gl,[0,.82,0],[7,.05,7]],['tor',gl,[0,.8,0],[8,8,8],[Math.PI/2,0,0]]]};
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;sp.base.solid.push(['cyl6','#a09a8c',[Math.cos(a)*5,2,Math.sin(a)*5],[.6,4,.6]]);sp.base.glow.push(['oct',gl,[Math.cos(a)*5,4.5,Math.sin(a)*5],[.5,.9,.5]]);}
  sp.gem={at:[0,3,0],glow:[['oct',gl,[0,0,0],[1.4,2.4,1.4]]]};}
 const r=buildRig('s_'+kind+team,sp);r.kind=kind;return r;}
export function rubbleModel(kind,team){const dk=TEAMDK[team],list=[];const n=kind==='core'?14:kind==='inhib'?8:9,R=kind==='core'?4:2;
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+Math.random(),r=Math.random()*R;list.push(['dod',i%3?'#7a7468':dk,[Math.cos(a)*r,.3+Math.random()*.6,Math.sin(a)*r],[.6+Math.random()*1.1,.5+Math.random()*.8,.6+Math.random()*1.1],[Math.random()*3,Math.random()*3,0]]);}
 list.push(['cyl6','#6a6458',[0,.4,0],[R*1.4,.8,R*1.4]]);const m=new THREE.Mesh(merge(list),MAT.flat);m.castShadow=m.receiveShadow=true;return m;}
export function wardModel(team){const tc=TEAMC[team];const r=buildRig('w'+team,{base:{solid:[['cyl','#5a4a3a',[0,.5,0],[.12,1,.12]]],glow:[['oct',glowC(tc,1.3),[0,1.15,0],[.35,.5,.35]]]}});return r;}

/* ======================= scenery ======================= */
export function treeGeo(kind){const l=[];if(kind===0){l.push(['cyl6','#5a3e2a',[0,.9,0],[.45,1.8,.45]],['ico','#2f6a3a',[0,2.4,0],[2.6,2.2,2.6]],['ico','#3c7e42',[.3,3.4,.2],[2,1.8,2]],['ico','#4a9050',[-.1,4.2,-.1],[1.3,1.3,1.3]]);}
 else if(kind===1){l.push(['cyl6','#4a3424',[0,.8,0],[.4,1.6,.4]],['cone6','#24583a',[0,2.4,0],[2.6,2.4,2.6]],['cone6','#2c6a44',[0,3.6,0],[2,2,2]],['cone6','#38804e',[0,4.6,0],[1.3,1.6,1.3]]);}
 else{l.push(['cyl6','#6a4a3a',[0,1,0],[.4,2,.4]],['ico','#6a3a7a',[0,2.8,0],[2.6,2,2.6]],['ico','#8a4a9a',[.2,3.6,0],[1.6,1.4,1.6]]);}
 return merge(l);}
export function rockGeo(){return merge([['dod','#7a7468',[0,.3,0],[1.4,1,1.2]],['dod','#8a8478',[.5,.2,.3],[.7,.6,.7]]]);}
export function bushGeo(){return merge([['ico','#3a7a3a',[0,.4,0],[1.3,.9,1.3]],['ico','#4a8a40',[.5,.35,.2],[.9,.7,.9]],['ico','#358038',[-.4,.3,-.2],[.8,.6,.8]]]);}
export function crystalGeo(){return merge([['oct','#7ac8ff',[0,.6,0],[.5,1.4,.5]],['oct','#9ad8ff',[.35,.4,.1],[.3,.8,.3],[0,0,.4]],['oct','#8ad0ff',[-.3,.35,-.1],[.3,.7,.3],[0,0,-.4]]]);}

/* ======================= animation ======================= */
// st: {mv (0..1 move blend), t (time), atk (0..1 swing), cast (0..1), air (0..1), dead (0..1), size}
export function pose(r,st){const P=r.P,t=st.t;
 if(r.kind==='champ'){const w=st.mv,ph=t*9.5,s=Math.sin(ph),c=Math.cos(ph);const b=P.body;b.position.y=(r.body==='golem'?1:1)+Math.abs(c)*.08*w+Math.sin(t*2)*.02*(1-w);b.rotation.x=.08*w;
  if(P.legL){P.legL.rotation.x=s*.75*w;P.legR.rotation.x=-s*.75*w;}
  if(P.torso)P.torso.rotation.y=s*.08*w;
  const a=st.atk,k=a>0?Math.sin((1-a)*Math.PI):0;const cs=st.cast>0?Math.sin(st.cast/.35*Math.PI):0;
  P.armL.rotation.x=-s*.6*w-cs*1.6+(r.weapon==='bow'?-1.2:0);P.armL.rotation.z=-.15-cs*.3;
  let ar=s*.6*w-cs*2;let az=.15;if(r.weapon==='greatsword'||r.weapon==='anchor'){ar=-.5+s*.3*w-k*2.6+(1-a)*k*1.5;}else if(r.weapon==='bow'){ar=-1.4-k*.2;az=.4;}else if(r.weapon==='gun'){ar=-1.45+k*.25;}else if(r.weapon==='staff'||r.weapon==='flower'||r.weapon==='orb'){ar=-.6+s*.3*w-k*1.2-cs*1.2;}else ar-=k*2.2;
  P.armR.rotation.x=ar;P.armR.rotation.z=az;if(P.hand2){P.armL.rotation.x-=k*1.4*(st.alt?1:0);}
  P.head.rotation.x=-.05+(cs*-.2);
  const air=st.air||0;r.root.position.y=air*1.6+(st.dead||0)*-.4;r.root.rotation.x=(st.dead||0)*-1.45;}
 else if(r.kind==='mon'){const b=P.body,w=st.mv;if(!b.userData.y0)b.userData.y0=b.position.y;b.position.y=b.userData.y0+Math.sin(t*(w?10:2.2))*(w?.12:.05);const k=st.atk>0?Math.sin((1-st.atk)*Math.PI):0;b.rotation.x=-k*.35+(w?.06:0);
  if(P.armL){P.armL.rotation.x=-k*1.8+Math.sin(t*2)*.1;P.armR.rotation.x=-k*1.8-Math.sin(t*2)*.1;}if(P.wingL){const f=Math.sin(t*(w?9:3))*.5;P.wingL.rotation.z=f;P.wingR.rotation.z=-f;}
  r.root.position.y=(st.air||0)*1.4;r.root.rotation.x=(st.dead||0)*-1.2;}}
