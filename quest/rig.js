// WILD QUEST — procedural articulated character rigs (hero, Mossback grunts/archers, Rune Colossus, Ashen Warden) and a pose animator.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,G=()=>new THREE.Group();
const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??.75,metalness:o.m??0,emissive:o.e??0,emissiveIntensity:o.ei??1,flatShading:!!o.flat});
function mesh(geo,mat,parent,x=0,y=0,z=0,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;}
const cap=(r,l,s=8)=>new THREE.CapsuleGeometry(r,l,3,s);
// limb hanging down from its joint: mesh centred at -len/2
function limb(parent,r0,len,mat,r1){const g=r1?new THREE.CylinderGeometry(r1,r0,len,9):cap(r0,Math.max(.01,len-r0*2));const m=mesh(g,mat,parent,0,-len/2,0);return m;}

/* procedural cloth / leather / wood textures (canvas) */
function ctx(w,h,f,rep=1){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const rn=(()=>{let a=4242;return()=>{a=(a*16807)%2147483647;return a/2147483647;};})();
let TX=null;function tex(){if(TX)return TX;
 const weave=ctx(64,64,(x,w,h)=>{x.fillStyle='#d8d8d8';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=2){x.fillStyle=`rgba(255,255,255,${.12+rn()*.1})`;x.fillRect(i,0,1,h);x.fillStyle=`rgba(0,0,0,${.08+rn()*.08})`;x.fillRect(0,i,w,1);}
  for(let k=0;k<160;k++){x.fillStyle=`rgba(${rn()<.5?0:255},${rn()<.5?0:255},${rn()<.5?0:255},.05)`;x.fillRect(rn()*w,rn()*h,1+rn()*3,1);}},4);
 const leather=ctx(128,128,(x,w,h)=>{x.fillStyle='#c8c8c8';x.fillRect(0,0,w,h);for(let k=0;k<1400;k++){const v=rn()*255|0;x.fillStyle=`rgba(${v},${v},${v},.10)`;x.beginPath();x.arc(rn()*w,rn()*h,.6+rn()*1.6,0,6.283);x.fill();}
  x.strokeStyle='rgba(60,40,30,.35)';for(let k=0;k<14;k++){x.lineWidth=.6+rn();x.beginPath();let px=rn()*w,py=rn()*h;x.moveTo(px,py);for(let i=0;i<4;i++){px+=(rn()-.5)*30;py+=(rn()-.5)*30;x.lineTo(px,py);}x.stroke();}
  x.strokeStyle='rgba(30,20,10,.5)';x.setLineDash([3,3]);x.lineWidth=1;x.strokeRect(5,5,w-10,h-10);},2);
 const wood=ctx(256,256,(x,w,h)=>{for(let i=0;i<5;i++){const v=120+rn()*40|0;x.fillStyle=`rgb(${v+20},${v-15|0},${v-55|0})`;x.fillRect(i*w/5,0,w/5,h);for(let k=0;k<60;k++){x.strokeStyle=`rgba(40,20,5,${.1+rn()*.15})`;x.lineWidth=1;x.beginPath();const gx=i*w/5+rn()*w/5;x.moveTo(gx,0);x.bezierCurveTo(gx+(rn()-.5)*8,h*.3,gx+(rn()-.5)*8,h*.7,gx+(rn()-.5)*6,h);x.stroke();}
   x.fillStyle='rgba(20,10,0,.6)';x.fillRect(i*w/5,0,2,h);}
  x.save();x.translate(w/2,h/2);x.fillStyle='#c4471c';x.beginPath();x.arc(0,0,64,0,6.283);x.fill();x.fillStyle='#e8c070';for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.beginPath();x.moveTo(-9,52);x.lineTo(0,92);x.lineTo(9,52);x.fill();}
  x.fillStyle='#1e6e68';x.beginPath();x.arc(0,0,40,0,6.283);x.fill();x.fillStyle='#e8c070';x.beginPath();x.moveTo(0,-26);x.lineTo(15,12);x.lineTo(-15,12);x.closePath();x.fill();x.restore();
  for(let k=0;k<500;k++){x.fillStyle=`rgba(255,240,220,${rn()*.12})`;x.fillRect(rn()*w,rn()*h,rn()*5,1);}});
 return TX={weave,leather,wood};}
/* merge static dressing per (joint, material): far fewer draw calls than one mesh per piece */
function dresser(){const B=new Map();const add=(parent,mat,geo,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>{const m=new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
  const k=parent.uuid+mat.uuid;if(!B.has(k))B.set(k,{parent,mat,list:[]});B.get(k).list.push(geo.applyMatrix4(m));};
 add.flush=()=>{for(const{parent,mat,list}of B.values()){const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;gs.forEach(g=>n+=g.attributes.position.count);const P=new Float32Array(n*3),N=new Float32Array(n*3),UV=new Float32Array(n*2);let o=0;
  for(const g of gs){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)UV.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('uv',new THREE.BufferAttribute(UV,2));const m=new THREE.Mesh(g,mat);m.castShadow=true;parent.add(m);}B.clear();};return add;}
const lathe=(pts,seg=14,open)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);

/* ---------------- weapons & gear ---------------- */
export function makeSword(kind='traveler'){const g=G(),add=dresser();const rune=kind==='rune';const blade=rune?std(0xcfe9ff,{m:.9,r:.22,e:0x2aa8b8,ei:.6}):std(0xdfe3e8,{m:.95,r:.24});const gold=std(rune?0x9ab8d0:0xb08a3a,{m:.9,r:.32}),grip=new THREE.MeshStandardMaterial({color:0x4a2c18,roughness:.85,map:tex().leather,bumpMap:tex().leather,bumpScale:2});
 const sh=new THREE.Shape();sh.moveTo(-.03,0);sh.lineTo(-.028,.78);sh.quadraticCurveTo(-.026,.86,0,.92);sh.quadraticCurveTo(.026,.86,.028,.78);sh.lineTo(.03,0);sh.closePath();
 const bg=new THREE.ExtrudeGeometry(sh,{depth:.004,bevelEnabled:true,bevelThickness:.006,bevelSize:.012,bevelSegments:1,curveSegments:6});bg.translate(0,0,-.002);bg.rotateX(Math.PI/2);bg.translate(0,0,.13);add(g,blade,bg);
 add(g,rune?std(0x000000,{e:0x40f0ff,ei:3}):std(0x9aa0a8,{m:.95,r:.4}),new THREE.BoxGeometry(.012,.016,.62),0,0,.46);
 const gd=new THREE.TorusGeometry(.13,.016,6,14,1.3);gd.rotateZ(Math.PI/2-.65);gd.translate(0,-.1,0);gd.rotateX(-Math.PI/2);add(g,gold,gd,0,0,.02);
 for(const sx of[-1,1])add(g,gold,new THREE.SphereGeometry(.022,8,6),sx*.105,0,.14);add(g,gold,new THREE.BoxGeometry(.07,.03,.05),0,0,.125);
 add(g,grip,new THREE.CylinderGeometry(.021,.024,.2,8).rotateX(Math.PI/2),0,0,.01);for(let i=0;i<4;i++)add(g,gold,new THREE.TorusGeometry(.024,.006,4,10),0,0,-.07+i*.05);
 add(g,gold,new THREE.SphereGeometry(.034,10,8),0,0,-.11,0,0,0,1,1,1.2);if(rune)add(g,std(0x000000,{e:0x40f0ff,ei:3}),new THREE.OctahedronGeometry(.03),0,0,-.15);
 add.flush();g.userData.tip=new V(0,0,1.05);g.userData.base=new V(0,0,.18);g.userData.kind=kind;return g;}
export function makeShield(){const g=G(),add=dresser();const wood=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75,map:tex().wood,bumpMap:tex().wood,bumpScale:1.5}),rim=std(0x8b8f96,{m:.85,r:.35}),gold=std(0xb08a3a,{m:.9,r:.35});
 add(g,wood,new THREE.CylinderGeometry(.3,.3,.05,28).rotateX(Math.PI/2).rotateZ(Math.PI/2));add(g,rim,new THREE.TorusGeometry(.3,.024,8,32));
 add(g,rim,new THREE.SphereGeometry(.06,12,8,0,Math.PI*2,0,Math.PI/2).rotateX(Math.PI/2),0,0,.026);for(let i=0;i<10;i++){const a=i/10*6.283;add(g,gold,new THREE.SphereGeometry(.013,6,4),Math.cos(a)*.26,Math.sin(a)*.26,.026);}
 for(const y of[-.12,.12])add(g,rim,new THREE.BoxGeometry(.56,.03,.012),0,y,-.03);add.flush();return g;}
export function makeBow(col=0x5a3a1c){const g=G();const wood=std(col,{r:.7});const pts=[];for(let i=0;i<=12;i++){const t=i/12-.5;pts.push(new V(0,t*1.1,-Math.cos(t*Math.PI)*.16+.16));}
 const curve=new THREE.CatmullRomCurve3(pts);mesh(new THREE.TubeGeometry(curve,16,.02,5),wood,g);const s=new THREE.BufferGeometry().setFromPoints([new V(0,.55,.0),new V(0,-.55,0)]);
 const str=new THREE.Line(s,new THREE.LineBasicMaterial({color:0xe8e0c8}));g.add(str);g.userData.str=str;mesh(new THREE.CylinderGeometry(.03,.03,.16,6),std(0x2a1a10),g,0,0,.02);return g;}
export function makeClub(){const g=G();const w=std(0x5b3a1e,{r:.9}),st=std(0x7d776c,{r:.8,flat:true});mesh(new THREE.CylinderGeometry(.09,.04,.9,7).rotateX(Math.PI/2),w,g,0,0,.42);
 for(let i=0;i<5;i++){const a=i*1.26;mesh(new THREE.ConeGeometry(.04,.12,4),st,g,Math.cos(a)*.08,Math.sin(a)*.08,.68+(i%2)*.12,Math.PI/2*Math.sin(a),0,-Math.cos(a)*Math.PI/2);}
 g.userData.tip=new V(0,0,.9);g.userData.base=new V(0,0,.3);return g;}
export function makeGreatsword(){const g=G();const b=std(0x2a2a30,{m:.9,r:.32}),edge=std(0x000000,{e:0xff5a14,ei:2.6}),gold=std(0x6a4a2a,{m:.8,r:.4});
 mesh(new THREE.BoxGeometry(.16,.04,2.3),b,g,0,0,1.45);mesh(new THREE.BoxGeometry(.03,.05,2.2),edge,g,.085,0,1.45);mesh(new THREE.BoxGeometry(.03,.05,2.2),edge,g,-.085,0,1.45);
 mesh(new THREE.BoxGeometry(.55,.1,.1),gold,g,0,0,.27);mesh(new THREE.CylinderGeometry(.04,.04,.45,6).rotateX(Math.PI/2),std(0x1a1210),g,0,0,.02);
 g.userData.tip=new V(0,0,2.6);g.userData.base=new V(0,0,.4);return g;}
// parafoil glider: cambered airfoil wing with sewn cells, ribs and suspension lines
export function makeGlider(){const g=G();const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');const cols=['#e8541a','#f1e6cc','#1d6b66','#f1e6cc','#e8541a','#c23a12'];
 for(let i=0;i<24;i++){x.fillStyle=cols[[0,1,2,1][i%4]];x.fillRect(i*512/24,0,512/24,64);x.fillStyle='rgba(0,0,0,.28)';x.fillRect(i*512/24,0,1.5,64);x.fillStyle='rgba(255,255,255,.08)';x.fillRect(i*512/24+2,0,3,64);}
 for(let k=0;k<1500;k++){x.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},.04)`;x.fillRect(Math.random()*512,Math.random()*64,2,1);}x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,512,3);x.fillRect(0,61,512,3);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 const SP=28,K=10,pos=[],uv=[],idx=[],Rr=1.8;const foil=cc=>.6*(.2969*Math.sqrt(cc)-.126*cc-.3516*cc*cc+.2843*cc*cc*cc-.1015*cc**4);
 for(let i=0;i<=SP;i++){const sN=i/SP*2-1,a=sN*1.0,ch=1.05*(1-.38*sN*sN);const ax=Math.sin(a)*Rr,ay=Math.cos(a)*Rr-Rr+1.2,nx=Math.sin(a),ny=Math.cos(a);
  for(let k=0;k<=2*K;k++){const top=k<=K,cc=top?1-k/K:(k-K)/K;const th=foil(Math.max(cc,.0001))*ch*(top?1:-.45)+(top?0:.02);const z=(.42-cc)*ch;pos.push(ax+nx*th,ay+ny*th,z);uv.push(i/SP,k/(2*K));}}
 for(let i=0;i<SP;i++)for(let k=0;k<2*K;k++){const a=i*(2*K+1)+k,b=a+2*K+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 mesh(geo,new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:.72,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.14}),g);
 const lines=[];for(const sN of[-.92,-.7,-.45,-.2,.2,.45,.7,.92])for(const cc of[.08,.55]){const a=sN*1.0,ch=1.05*(1-.38*sN*sN);const ax=Math.sin(a)*Rr,ay=Math.cos(a)*Rr-Rr+1.2;const hx=sN<0?-.16:.16;lines.push(new V(hx,0,.02),new V(ax*.995,ay-.03,(.42-cc)*ch));}
 g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines),new THREE.LineBasicMaterial({color:0x2a2018,transparent:true,opacity:.75})));
 mesh(new THREE.CylinderGeometry(.016,.016,.42,6).rotateZ(Math.PI/2),std(0x3a2a20,{m:.4,r:.5}),g,0,0,0);for(const sx of[-1,1])mesh(new THREE.SphereGeometry(.03,8,6),std(0x7a4a2a),g,sx*.21,0,0);return g;}
// hero cloak: an 5x9 cloth strip hung from the shoulders, deformed every frame by speed, fall and glide with travelling ripples
function makeCloak(r,parent,S){const W=4,Hh=8;const geo=new THREE.PlaneGeometry(1,1,W,Hh);const n=geo.attributes.position.count;geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
 const c=document.createElement('canvas');c.width=128;c.height=256;const x=c.getContext('2d');x.fillStyle='#8c2e1c';x.fillRect(0,0,128,256);for(let i=0;i<128;i+=2){x.fillStyle=`rgba(255,255,255,${.04+Math.random()*.05})`;x.fillRect(i,0,1,256);}for(let j=0;j<256;j+=2){x.fillStyle=`rgba(0,0,0,${.05+Math.random()*.05})`;x.fillRect(0,j,128,1);}
 const gr=x.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(0,0,0,.35)');gr.addColorStop(.3,'rgba(0,0,0,0)');gr.addColorStop(.85,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(30,10,0,.4)');x.fillStyle=gr;x.fillRect(0,0,128,256);
 x.fillStyle='#d8b060';x.fillRect(0,226,128,6);x.fillRect(0,238,128,2);for(let i=0;i<16;i++){x.beginPath();x.moveTo(i*8,250);x.lineTo(i*8+4,256);x.lineTo(i*8+8,250);x.fill();}
 x.strokeStyle='rgba(216,176,96,.75)';x.lineWidth=3;x.beginPath();x.arc(64,150,18,0,6.283);x.stroke();x.beginPath();x.moveTo(64,126);x.lineTo(64,174);x.moveTo(40,150);x.lineTo(88,150);x.stroke();
 for(let k=0;k<40;k++){x.fillStyle='rgba(40,20,10,.25)';x.fillRect(Math.random()*128,240+Math.random()*16,2,3);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:t,roughness:.92,side:THREE.DoubleSide,bumpMap:t,bumpScale:.4}));m.castShadow=true;m.frustumCulled=false;parent.add(m);
 r.cloak={m,geo,W,Hh,th:new Float32Array(Hh+1).fill(.15),tv:new Float32Array(Hh+1),top:S.ch*.93,L:.66};}
function updateCloak(r,st,dt){const C=r.cloak,t=st.t,sp=Math.min(10,st.speed||0),mode=st.mode;const p=C.geo.attributes.position;
 let base=.1+sp*.09+(mode==='air'?(st.vy<0?.9:.35):0)+(mode==='glide'?1.25:0)+(mode==='swim'?.9:0)+(mode==='roll'?.6:0);if(mode==='climb')base=.05;base-=(r.j.spine.rotation.x+r.j.chest.rotation.x)*.8;base=Math.max(.06,Math.min(1.45,base));
 const amp=.04+sp*.013+(mode==='glide'?.09:0);
 for(let k=0;k<=C.Hh;k++){const f=k/C.Hh;const want=base*(.55+f*.6)+Math.sin(t*(5+sp*.7)-f*4.5)*amp*f*2;const acc=(want-C.th[k])*120-C.tv[k]*14;C.tv[k]+=acc*Math.min(dt,.05);C.th[k]+=C.tv[k]*Math.min(dt,.05);}
 const seg=C.L/C.Hh;let y=C.top,z=-.16;const rows=[];for(let k=0;k<=C.Hh;k++){rows.push([y,z]);const a=C.th[k];y-=seg*Math.cos(a);z-=seg*Math.sin(a);}
 for(let k=0;k<=C.Hh;k++){const f=k/C.Hh,[ry,rz]=rows[k];const w=.19+.12*f;for(let i=0;i<=C.W;i++){const u=i/C.W*2-1;const idx=k*(C.W+1)+i;const wav=Math.sin(t*(7+sp)+f*6+u*2.2)*amp*.6*f;
   p.setXYZ(idx,u*w*(1-.12*Math.abs(u)*(1-f)),ry+wav*.3,rz+u*u*.07*(1-f*.6)+wav);}}
 p.needsUpdate=true;C.geo.computeVertexNormals();}

/* ---------------- rig ---------------- */
const JOINTS=['hips','spine','chest','neck','head','shL','armL','foreL','handL','shR','armR','foreR','handR','legL','kneeL','footL','legR','kneeR','footR'];
export function makeRig(kind='hero'){
 const S={hero:{hip:.92,sp:.24,ch:.28,shW:.2,ua:.3,fa:.27,hipW:.1,th:.44,sh:.42,head:.125},
  grunt:{hip:.72,sp:.26,ch:.32,shW:.3,ua:.34,fa:.32,hipW:.15,th:.34,sh:.34,head:.2},
  archer:{hip:.86,sp:.24,ch:.28,shW:.22,ua:.33,fa:.3,hipW:.11,th:.42,sh:.4,head:.16},
  golem:{hip:1.6,sp:.6,ch:.9,shW:1.05,ua:.9,fa:.95,hipW:.4,th:.75,sh:.8,head:.32},
  boss:{hip:1.65,sp:.5,ch:.65,shW:.58,ua:.7,fa:.65,hipW:.25,th:.8,sh:.82,head:.26}}[kind];
 const r={kind,S,root:G(),j:{},rot:{},hy:S.hip,glow:[]};const j=r.j;for(const n of JOINTS){j[n]=G();r.rot[n]=new THREE.Euler();}
 r.root.add(j.hips);j.hips.position.y=S.hip;j.hips.add(j.spine);j.spine.add(j.chest);j.chest.position.y=S.sp;j.chest.add(j.neck);j.neck.position.y=S.ch;j.neck.add(j.head);j.head.position.y=.06;
 for(const[s,sx]of[['L',1],['R',-1]]){j.chest.add(j['sh'+s]);j['sh'+s].position.set(sx*S.shW,S.ch*.86,0);j['sh'+s].add(j['arm'+s]);j['arm'+s].add(j['fore'+s]);j['fore'+s].position.y=-S.ua;j['fore'+s].add(j['hand'+s]);j['hand'+s].position.y=-S.fa;
  j.hips.add(j['leg'+s]);j['leg'+s].position.set(sx*S.hipW,-.02,0);j['leg'+s].add(j['knee'+s]);j['knee'+s].position.y=-S.th;j['knee'+s].add(j['foot'+s]);j['foot'+s].position.y=-S.sh;}
 ({hero:dressHero,grunt:dressGrunt,archer:dressArcher,golem:dressGolem,boss:dressBoss})[kind](r);
 r.root.traverse(o=>{if(o.isMesh){o.castShadow=true;}});return r;}

function dressHero(r){const{j,S}=r;const T=tex(),add=dresser();const cloth=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??.85,map:o.map??T.weave,bumpMap:o.map??T.weave,bumpScale:o.b??.5,side:o.side??THREE.FrontSide});
 const skin=std(0xd9a27a,{r:.55}),tunic=cloth(0x1f6a64),tunic2=cloth(0x17504b,{side:THREE.DoubleSide}),pants=cloth(0xb59a72,{r:.9}),boot=cloth(0x5a3a24,{map:T.leather,r:.7,b:2}),belt=cloth(0x4a2e1a,{map:T.leather,r:.6,b:2}),
  hair=std(0x2a1a12,{r:.6}),scarf=cloth(0xff5a12,{r:.85}),dark=std(0x111111,{r:.3}),white=std(0xf0ece4,{r:.4}),gold=std(0xb8903c,{m:.9,r:.32}),trim=cloth(0xd8b060,{r:.7});
 // torso: lathed waist + chest, flared skirt with a woven hem
 add(j.spine,tunic,lathe([[.0,-.02],[.15,-.02],[.148,.1],[.16,.2],[.168,S.sp+.03],[0,S.sp+.03]],16),0,0,0,0,0,0,1,1,.78);
 add(j.chest,tunic,lathe([[0,-.01],[.17,-.01],[.19,.08],[.205,.17],[.19,.24],[.13,.29],[.07,.31],[0,.31]],16),0,0,0,0,0,0,1,1,.72);
 add(j.hips,tunic2,lathe([[.17,.04],[.19,-.06],[.215,-.16],[.25,-.25]],18),0,0,0,0,0,0,1,1,.82);add(j.hips,trim,new THREE.TorusGeometry(.25,.012,5,24).rotateX(Math.PI/2),0,-.25,0,0,0,0,1,1,.82);
 // belt with buckle and pouches, chest strap, collar
 add(j.spine,belt,new THREE.CylinderGeometry(.172,.172,.06,16),0,.02,0,0,0,0,1,1,.8);add(j.spine,gold,new THREE.TorusGeometry(.028,.008,4,12),0,.02,.142,0,0,0,1.3,1,1);
 for(const sx of[-1,1]){add(j.spine,belt,new THREE.BoxGeometry(.07,.08,.05),sx*.15,-.02,.04,0,sx*.9,0);add(j.spine,belt,new THREE.SphereGeometry(.04,8,4,0,Math.PI*2,0,Math.PI/2),sx*.15,.02,.04,0,sx*.9,0,1,.5,.75);}
 add(j.chest,belt,new THREE.TorusGeometry(.215,.018,5,28),0,.14,0,0,0,.75,1,1,.78);add(j.chest,gold,new THREE.TorusGeometry(.022,.006,4,10),.08,.2,.155);
 add(j.chest,tunic2,new THREE.TorusGeometry(.105,.035,6,16).rotateX(Math.PI/2),0,.29,-.01,0,0,0,1,1,.85);
 mesh(new THREE.TorusGeometry(.1,.045,8,16).rotateX(Math.PI/2),scarf,j.neck,0,.0,0);r.scarf=G();j.neck.add(r.scarf);r.scarf.position.set(.04,0,-.1);const sc=mesh(new THREE.BoxGeometry(.09,.36,.02,1,4,1),scarf,r.scarf,0,-.18,0);sc.castShadow=true;
 add(j.neck,skin,cap(.055,.04),0,.03,0);makeCloak(r,j.chest,S);
 // head: face, ears, nose, brows, eyes; hair cap, fringe, side locks, ponytail with an orange tie
 const hd=j.head,H=S.head;add(hd,skin,new THREE.SphereGeometry(H,20,16),0,.1,0,0,0,0,.92,1.05,1);add(hd,skin,new THREE.SphereGeometry(.06,12,8),0,.04,.045,0,0,0,1.1,.8,1);
 add(hd,skin,new THREE.SphereGeometry(.016,8,6),0,.095,.122,0,0,0,.8,1,1.1);for(const sx of[-1,1]){add(hd,skin,new THREE.SphereGeometry(.025,8,6),sx*.112,.1,0,0,0,0,.5,1,.8);
  add(hd,white,new THREE.SphereGeometry(.019,8,6),sx*.043,.117,.1,0,0,0,1,.8,.6);add(hd,dark,new THREE.SphereGeometry(.012,8,6),sx*.043,.117,.11);add(hd,hair,new THREE.BoxGeometry(.045,.012,.015),sx*.045,.148,.112,0,0,-sx*.15);}
 add(hd,cloth(0xa8604a,{r:.6}),new THREE.BoxGeometry(.035,.007,.01),0,.058,.112);
 add(hd,hair,new THREE.SphereGeometry(H*1.1,18,12,0,Math.PI*2,0,Math.PI*.56),0,.118,-.012,-.25);
 for(let i=0;i<6;i++){const x=-.07+i*.028;add(hd,hair,new THREE.ConeGeometry(.026,.09,5),x,.17,.085+Math.cos(x*9)*.015,2.6,0,x*3);}
 for(const sx of[-1,1])add(hd,hair,new THREE.ConeGeometry(.03,.16,6),sx*.1,.07,.03,Math.PI+.15,0,sx*.12);
 [[.17,-.135,.052],[.1,-.16,.045],[.03,-.17,.038],[-.04,-.165,.03]].forEach(([y,z,r0])=>add(hd,hair,new THREE.SphereGeometry(r0,10,8),0,y,z,0,0,0,1,1.35,1));add(hd,scarf,new THREE.TorusGeometry(.04,.012,5,12).rotateX(Math.PI/2),0,.2,-.13,-.5);
 // limbs: leather pauldron + bracers + gloves, sleeve cuffs, knee guards, cuffed boots with soles
 for(const[s,sx]of[['L',1],['R',-1]]){add(j['sh'+s],tunic,new THREE.SphereGeometry(.075,12,8));
  if(s==='L'){add(j.shL,belt,new THREE.SphereGeometry(.105,14,8,0,Math.PI*2,0,Math.PI*.45),.01,.01,0,0,0,-.3,1,.9,1);add(j.shL,gold,new THREE.TorusGeometry(.085,.008,4,18).rotateX(Math.PI/2),.04,-.03,0,0,0,-.3);}
  add(j['arm'+s],tunic,cap(.058,Math.max(.01,S.ua-.116),10),0,-S.ua/2,0);add(j['arm'+s],tunic2,new THREE.TorusGeometry(.058,.016,5,14).rotateX(Math.PI/2),0,-S.ua+.03,0);
  add(j['fore'+s],skin,cap(.048,Math.max(.01,S.fa-.096),10),0,-S.fa/2,0);add(j['fore'+s],belt,new THREE.CylinderGeometry(.058,.05,.14,12),0,-S.fa*.62,0);
  for(const y of[-.11,-.2])add(j['fore'+s],gold,new THREE.TorusGeometry(.057,.006,4,14).rotateX(Math.PI/2),0,y,0);
  add(j['hand'+s],belt,new THREE.SphereGeometry(.048,10,8),0,-.03,0,0,0,0,.9,1.1,1);add(j['hand'+s],belt,cap(.016,.03,6),sx*.04,-.02,.025,-.4,0,sx*.5);
  add(j['leg'+s],pants,cap(.075,Math.max(.01,S.th-.15),10),0,-S.th/2,0);add(j['knee'+s],belt,new THREE.SphereGeometry(.06,10,6,0,Math.PI*2,0,Math.PI*.5),0,.0,.035,1.25,0,0,1,1,.6);
  add(j['knee'+s],boot,new THREE.CylinderGeometry(.068,.06,S.sh,12),0,-S.sh/2-.01,0);add(j['knee'+s],boot,new THREE.TorusGeometry(.072,.02,6,16).rotateX(Math.PI/2),0,-.07,0);
  add(j['foot'+s],boot,new THREE.BoxGeometry(.1,.07,.18),0,-.015,.03);add(j['foot'+s],boot,new THREE.SphereGeometry(.052,10,8),0,-.02,.12,0,0,0,1,.7,1.2);add(j['foot'+s],dark,new THREE.BoxGeometry(.108,.022,.27),0,-.055,.06);}
 add.flush();
 // gear
 r.sword=makeSword();r.shield=makeShield();r.bow=makeBow();r.glider=makeGlider();r.glider.visible=false;r.root.add(r.glider);r.glider.position.y=2.02;
 r.slots={handR:j.handR,handL:j.foreL,back:j.chest,bowHand:j.handL};r.gear={sword:'back',shield:'back',bow:'back'};placeGear(r);}
export function placeGear(r){const{j}=r;const g=r.gear;
 if(g.sword==='hand'){j.handR.add(r.sword);r.sword.position.set(0,-.05,0);r.sword.rotation.set(0,0,0);}else{j.chest.add(r.sword);r.sword.position.set(.06,.12,-.25);r.sword.rotation.set(-2.5,0,.6);}
 if(g.shield==='hand'){j.foreL.add(r.shield);r.shield.position.set(.07,-r.S.fa*.5,0);r.shield.rotation.set(0,Math.PI/2,0);}else{j.chest.add(r.shield);r.shield.position.set(.02,.0,-.27);r.shield.rotation.set(0,Math.PI,.2);r.shield.scale.setScalar(.85);}if(g.shield==='hand')r.shield.scale.setScalar(1);
 if(g.bow==='hand'){j.handL.add(r.bow);r.bow.position.set(0,-.04,.03);r.bow.rotation.set(-Math.PI/2,0,0);}else{j.chest.add(r.bow);r.bow.position.set(-.1,.08,-.32);r.bow.rotation.set(0,0,-.7);}}
let SKN=null;function skinTex(){if(SKN)return SKN;SKN=ctx(128,128,(x,w,h)=>{x.fillStyle='#b8b8b8';x.fillRect(0,0,w,h);for(let k=0;k<900;k++){const v=150+rn()*105|0,rr=.6+rn()*2.6;x.fillStyle=`rgba(${v},${v},${v},.35)`;x.beginPath();x.arc(rn()*w,rn()*h,rr,0,6.283);x.fill();}
 for(let k=0;k<140;k++){x.fillStyle='rgba(40,40,40,.25)';x.beginPath();x.arc(rn()*w,rn()*h,1+rn()*3,0,6.283);x.fill();}x.strokeStyle='rgba(60,60,60,.25)';for(let k=0;k<30;k++){x.lineWidth=.6;x.beginPath();let px=rn()*w,py=rn()*h;x.moveTo(px,py);for(let i=0;i<5;i++){px+=(rn()-.5)*14;py+=(rn()-.5)*14;x.lineTo(px,py);}x.stroke();}},2);return SKN;}
const lath=(pts,seg=12)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);
// muscled limb segment hanging from its joint: lathe profile (radius, depth below joint)
const flesh=(r0,r1,len,bulge=1.15,seg=10)=>lath([[0,.02],[r0*.8,.01],[r0,-len*.08],[(r0+r1)/2*bulge,-len*.42],[r1*1.02,-len*.8],[r1*.8,-len],[0,-len-.01]],seg);
function dressGrunt(r){const{j,S}=r;const T=tex(),SK=skinTex(),add=dresser();const sk=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??.72,map:SK,bumpMap:SK,bumpScale:o.b??1.6});
 const skin=sk(0x5f7a34),belly=sk(0x9aa462,{r:.8}),hide=new THREE.MeshStandardMaterial({color:0x8a6a4a,roughness:.95,map:T.leather,bumpMap:T.leather,bumpScale:2,side:THREE.DoubleSide}),mask=std(0xc9ab78,{r:.6}),paint=std(0xa8301c,{r:.7}),bone=std(0xe8dcc0,{r:.5}),dark=std(0x1a1410,{r:.8}),eye=std(0x000000,{e:0xffc040,ei:2.5});
 // gut + barrel chest with a hunched back
 add(j.spine,skin,lath([[0,-.06],[.25,-.04],[.31,.08],[.32,.2],[.28,.3],[0,.32]],14),0,0,0,0,0,0,1.05,1,.92);add(j.spine,belly,new THREE.SphereGeometry(.24,14,10),0,.1,.11,0,0,0,1,.95,.75);
 add(j.chest,skin,lath([[0,-.02],[.3,0],[.37,.13],[.37,.26],[.26,.36],[.12,.4],[0,.41]],14),0,0,0,0,0,0,1.2,1,.88);add(j.chest,skin,new THREE.SphereGeometry(.24,12,10),0,.28,-.14,0,0,0,1.3,.9,1);
 add(j.chest,belly,new THREE.SphereGeometry(.17,12,8),.1,.2,.2,0,0,0,1,.8,.6);add(j.chest,belly,new THREE.SphereGeometry(.17,12,8),-.1,.2,.2,0,0,0,1,.8,.6);
 add(j.chest,hide,new THREE.TorusGeometry(.33,.03,5,20),0,.12,0,Math.PI/2,0,.5,1.15,.88,1);for(let i=0;i<3;i++)add(j.chest,bone,new THREE.ConeGeometry(.025,.09,5),-.22+i*.05,.27-i*.05,.25,-.4,0,0);
 // belt, loincloth flaps, hanging bones
 add(j.hips,hide,new THREE.CylinderGeometry(.29,.31,.09,14),0,-.02,0);add(j.hips,dark,new THREE.TorusGeometry(.04,.012,5,10),0,-.02,.29);
 add(j.hips,hide,new THREE.PlaneGeometry(.3,.36,1,2),0,-.22,.27,.08,0,0);add(j.hips,hide,new THREE.PlaneGeometry(.38,.32,1,2),0,-.2,-.27,-.08,0,0);for(const sx of[-1,1])add(j.hips,hide,new THREE.PlaneGeometry(.16,.24),sx*.27,-.18,0,0,sx*1.4,0);
 // head: skull, heavy jaw, tusks, ears, wooden war-mask with horns
 const hd=j.head;add(hd,skin,new THREE.SphereGeometry(S.head,16,12),0,.12,0,0,0,0,1.1,1,1.05);add(hd,skin,new THREE.SphereGeometry(.15,12,8),0,.04,.08,0,0,0,1.25,.7,1.1);
 for(const sx of[-1,1]){add(hd,bone,new THREE.ConeGeometry(.024,.12,6),sx*.08,.09,.19,-.5,0,-sx*.25);add(hd,skin,new THREE.ConeGeometry(.06,.2,5),sx*.22,.17,-.01,0,0,sx*1.35,1,1,.35);}
 add(hd,mask,new THREE.SphereGeometry(S.head*1.02,14,10,0,Math.PI*2,0,Math.PI*.55),0,.14,.05,Math.PI/2-.15,0,0,1.05,.5,1.1);add(hd,paint,new THREE.BoxGeometry(.25,.03,.03),0,.19,.17);add(hd,paint,new THREE.BoxGeometry(.03,.13,.03),0,.12,.18);
 for(const sx of[-1,1]){add(hd,eye,new THREE.SphereGeometry(.028,8,6),sx*.07,.15,.17);add(hd,dark,new THREE.TorusGeometry(.04,.01,5,10),sx*.07,.15,.165);const h1=new THREE.ConeGeometry(.045,.26,7);h1.translate(0,.13,0);add(hd,bone,h1,sx*.13,.25,-.02,-.25,0,-sx*.55);}
 // limbs: lathed muscle, bone bracers, clawed hands and toes
 for(const[s,sx]of[['L',1],['R',-1]]){add(j['sh'+s],skin,new THREE.SphereGeometry(.13,12,10),0,0,0,0,0,0,1.1,1,1);if(s==='L'){add(j.shL,bone,new THREE.SphereGeometry(.16,12,8,0,Math.PI*2,0,Math.PI*.45),.02,.04,0,0,0,-.35,1,.85,1);for(let i=0;i<3;i++)add(j.shL,bone,new THREE.ConeGeometry(.03,.14,5),.04+i*.04,.16,(i-1)*.07,0,0,-.5);}
  add(j['arm'+s],skin,flesh(.1,.085,S.ua,1.25));add(j['fore'+s],skin,flesh(.09,.075,S.fa,1.2));add(j['fore'+s],hide,new THREE.CylinderGeometry(.095,.085,.12,10),0,-S.fa*.65,0);
  add(j['hand'+s],skin,new THREE.SphereGeometry(.085,10,8),0,-.04,0,0,0,0,1,1.1,.9);for(let i=0;i<3;i++)add(j['hand'+s],bone,new THREE.ConeGeometry(.018,.07,5),(i-1)*.04,-.12,.04,Math.PI,0,0);
  add(j['leg'+s],skin,flesh(.11,.09,S.th,1.2));add(j['knee'+s],skin,flesh(.09,.07,S.sh,1.25));add(j['knee'+s],hide,new THREE.CylinderGeometry(.085,.075,.1,10),0,-S.sh*.75,0);
  add(j['foot'+s],skin,new THREE.SphereGeometry(.1,10,8),0,-.03,.05,0,0,0,.8,.55,1.35);for(let i=0;i<3;i++)add(j['foot'+s],bone,new THREE.ConeGeometry(.016,.06,5),(i-1)*.035,-.05,.18,Math.PI/2,0,0);}
 add.flush();r.weapon=makeClub();j.handR.add(r.weapon);r.weapon.position.set(0,-.06,0);r.eyes=eye;}
function dressArcher(r){const{j,S}=r;const T=tex(),SK=skinTex(),add=dresser();const skin=new THREE.MeshStandardMaterial({color:0x8a4a2c,roughness:.7,map:SK,bumpMap:SK,bumpScale:1.4}),hood=new THREE.MeshStandardMaterial({color:0x34402c,roughness:.95,map:T.weave,bumpMap:T.weave,bumpScale:.8,side:THREE.DoubleSide}),
  cloth=new THREE.MeshStandardMaterial({color:0x4a3220,roughness:.95,map:T.leather,bumpMap:T.leather,bumpScale:1.5,side:THREE.DoubleSide}),mask=std(0xdac9a0,{r:.55}),dark=std(0x14100c,{r:.8}),eye=std(0x000000,{e:0xff7040,ei:2.5}),bone=std(0xe8dcc0,{r:.5});
 add(j.spine,cloth,lath([[0,-.04],[.16,-.02],[.18,.1],[.17,S.sp+.02],[0,S.sp+.04]],12),0,0,0,0,0,0,1,1,.85);add(j.chest,skin,lath([[0,0],[.18,0],[.23,.12],[.22,S.ch*.85],[.12,S.ch],[0,S.ch+.01]],12),0,0,0,0,0,0,1.05,1,.78);
 add(j.chest,hood,lath([[.05,S.ch*1.05],[.2,S.ch*.9],[.3,S.ch*.55],[.34,S.ch*.25]],12),0,0,-.02,0,0,0,1.05,1,.9);add(j.chest,cloth,new THREE.TorusGeometry(.2,.02,5,16),0,S.ch*.5,0,0,0,.7,1,1,.78);
 const qv=new THREE.CylinderGeometry(.06,.05,.5,8);add(j.chest,cloth,qv,-.1,.15,-.2,.3,0,.4);for(let i=0;i<4;i++)add(j.chest,bone,new THREE.ConeGeometry(.015,.06,4),-.17+i*.03,.46,-.11+i*.01,.3,0,.4);
 add(j.hips,cloth,lath([[.17,.04],[.2,-.08],[.24,-.24],[.27,-.32]],12),0,0,0,0,0,0,1,1,.85);
 const hd=j.head;add(hd,skin,new THREE.SphereGeometry(S.head,14,10),0,.11,0);add(hd,hood,lath([[0,.42],[.08,.38],[.17,.3],[.21,.16],[.22,.0],[.2,-.06]],12),0,0,-.03,-.15,0,0,1,1,1.05);
 add(hd,mask,new THREE.SphereGeometry(S.head*.95,12,8,0,Math.PI*2,0,Math.PI*.5),0,.1,.06,Math.PI/2,0,0,1,.6,1.1);add(hd,dark,new THREE.BoxGeometry(.13,.015,.02),0,.07,.15);for(const sx of[-1,1]){add(hd,eye,new THREE.SphereGeometry(.022,6,5),sx*.055,.13,.15);add(hd,skin,new THREE.ConeGeometry(.04,.16,5),sx*.17,.13,-.02,0,0,sx*1.4,1,1,.3);}
 for(const[s,sx]of[['L',1],['R',-1]]){add(j['arm'+s],skin,flesh(.065,.055,S.ua,1.15,8));add(j['fore'+s],skin,flesh(.06,.05,S.fa,1.12,8));add(j['fore'+s],cloth,new THREE.CylinderGeometry(.065,.058,.14,8),0,-S.fa*.6,0);add(j['hand'+s],skin,new THREE.SphereGeometry(.06,8,6),0,-.03,0);
  add(j['leg'+s],cloth,flesh(.08,.065,S.th,1.1,8));add(j['knee'+s],skin,flesh(.065,.05,S.sh,1.15,8));add(j['knee'+s],cloth,new THREE.CylinderGeometry(.065,.055,.16,8),0,-S.sh*.7,0);add(j['foot'+s],skin,new THREE.SphereGeometry(.07,8,6),0,-.02,.05,0,0,0,.8,.55,1.4);}
 add.flush();r.weapon=makeBow(0x3a2414);j.handL.add(r.weapon);r.weapon.position.set(0,-.04,.03);r.weapon.rotation.set(-Math.PI/2,0,0);r.eyes=eye;}
function dressGolem(r){const{j,S}=r;const st=std(0x6c6a62,{r:.92,flat:true}),moss=std(0x3c5a22,{r:.95,flat:true}),glow=std(0x000000,{e:0x30e8ff,ei:3});
 const rock=(p,w,h,d,y,x=0,z=0)=>{const m=mesh(new THREE.DodecahedronGeometry(1,0),st,p,x,y,z);m.scale.set(w,h,d);return m;};
 rock(j.spine,.75,.55,.6,.3);rock(j.chest,1.15,.75,.85,.55);mesh(new THREE.DodecahedronGeometry(1,0),moss,j.chest,0,1.05,-.1).scale.set(.9,.25,.6);
 mesh(new THREE.TorusGeometry(.35,.05,6,18),glow,j.chest,0,.6,.72);r.core=mesh(new THREE.SphereGeometry(.22,12,10),glow,j.chest,0,.6,.75);
 const hd=j.head;rock(hd,.42,.36,.4,.25);r.eye=mesh(new THREE.SphereGeometry(.11,12,10),glow,hd,0,.28,.33);
 for(const[s,sx]of[['L',1],['R',-1]]){rock(j['sh'+s],.5,.45,.5,0);rock(j['arm'+s],.38,.55,.38,-S.ua*.5);rock(j['fore'+s],.42,.6,.42,-S.fa*.5);rock(j['hand'+s],.52,.42,.5,-.2);
  rock(j['leg'+s],.4,.5,.4,-S.th*.5);rock(j['knee'+s],.38,.55,.4,-S.sh*.5);rock(j['foot'+s],.45,.22,.6,-.1,0,.12);mesh(new THREE.BoxGeometry(.06,.5,.06),glow,j['fore'+s],sx*.3,-S.fa*.5,.3);}
 r.glow.push(glow);}
function dressBoss(r){const{j,S}=r;const iron=std(0x24242a,{m:.85,r:.38}),iron2=std(0x3a3a44,{m:.8,r:.45}),ember=std(0x000000,{e:0xff4a10,ei:3.2}),cape=std(0x3a0d0a,{r:.95}),horn=std(0x1a1614,{r:.6});
 mesh(new THREE.CylinderGeometry(.42,.38,S.sp+.1,10),iron2,j.spine,0,S.sp/2,0).scale.set(1,1,.8);mesh(new THREE.CylinderGeometry(.62,.45,S.ch,10),iron,j.chest,0,S.ch/2,0).scale.set(1,1,.72);
 mesh(new THREE.BoxGeometry(.08,.5,.05),ember,j.chest,0,S.ch*.45,.38);mesh(new THREE.CylinderGeometry(.42,.6,.65,12,1,true),iron2,j.hips,0,-.25,0);
 r.cape=G();j.chest.add(r.cape);r.cape.position.set(0,S.ch*.9,-.36);mesh(new THREE.BoxGeometry(1.15,2.2,.04),cape,r.cape,0,-1.1,0);
 const hd=j.head;mesh(new THREE.CylinderGeometry(.24,.27,.42,10),iron,hd,0,.2,0);mesh(new THREE.BoxGeometry(.32,.05,.05),ember,hd,0,.24,.24);mesh(new THREE.ConeGeometry(.28,.3,10),iron,hd,0,.55,0);
 for(const sx of[-1,1]){const h=mesh(new THREE.ConeGeometry(.06,.6,7),horn,hd,sx*.3,.5,.02,0,0,-sx*1.0);h.rotation.x=-.3;}
 for(const[s,sx]of[['L',1],['R',-1]]){const p=mesh(new THREE.SphereGeometry(.32,12,8,0,Math.PI*2,0,Math.PI*.6),iron,j['sh'+s],0,.06,0);p.scale.set(1.1,.9,1.1);mesh(new THREE.ConeGeometry(.07,.3,6),horn,j['sh'+s],sx*.12,.3,0,0,0,-sx*.4);
  limb(j['arm'+s],.15,S.ua,iron2);limb(j['fore'+s],.14,S.fa,iron);mesh(new THREE.BoxGeometry(.2,.2,.2),iron2,j['hand'+s],0,-.08,0);limb(j['leg'+s],.18,S.th,iron2);limb(j['knee'+s],.16,S.sh,iron);mesh(new THREE.BoxGeometry(.26,.14,.4),iron,j['foot'+s],0,-.04,.08);}
 r.weapon=makeGreatsword();j.handR.add(r.weapon);r.weapon.position.set(0,-.08,0);r.glow.push(ember);}

/* ---------------- animator ---------------- */
const T={};for(const n of JOINTS)T[n]=[0,0,0];
function zero(){for(const n of JOINTS){const t=T[n];t[0]=t[1]=t[2]=0;}}
const lerpK=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
// keyframed arm moves: [p, chestY, chestX, armRx, armRz, foreRx, armLx, armLz, foreLx]
const MOVES={
 slash1:[[0,-.7,-.05,-2.3,-.7,-1.3,-.4,.3,-.6,0],[.42,.55,.12,-1.25,.65,-.2,-.2,.4,-.3,1.15],[1,.75,.1,-.7,.85,-.5,-.1,.3,-.4,0.9]],
 slash2:[[0,.8,-.05,-1.35,1.,-.7,-.3,.3,-.5,0.6],[.42,-.6,.12,-1.45,-.95,-.15,-.5,.2,-.4,1.2],[1,-.85,.08,-1.0,-1.25,-.5,-.3,.2,-.5,0.9]],
 chop:[[0,0,-.3,-3.0,-.15,-1.3,-2.6,.2,-1.0,-0.3],[.45,0,.42,-1.0,.05,-.1,-1.,.1,-.3,0.55],[1,0,.35,-.55,.05,-.3,-.5,.1,-.4,0.6]],
 spin:[[0,-.5,.05,-1.55,-.35,-.1,-1.2,.6,-.3,1.3],[.5,0,.08,-1.55,-.4,-.05,-1.2,.6,-.3,1.3],[1,.3,.05,-1.4,-.3,-.2,-1.,.5,-.4,1.2]],
 smash:[[0,0,-.35,-2.9,-.1,-.8,-.6,.4,-.4,0],[.5,0,.5,-.6,0,-.1,-.4,.3,-.3,0.35],[1,0,.45,-.45,0,-.2,-.3,.3,-.3,0.4]],
 sweep:[[0,-1.,.05,-1.4,-1.2,-.3,-1.2,.2,-.6,1.0],[.5,.8,.15,-1.45,.9,-.1,-1.,-.2,-.6,1.15],[1,1.1,.1,-1.2,1.1,-.3,-.8,-.2,-.6,1.0]],
 slam2:[[0,0,-.35,-2.9,-.3,-.6,-2.9,.3,-.6,0],[.5,0,.6,-.4,-.2,0,-.4,.2,0,0.4],[1,0,.55,-.3,-.2,-.1,-.3,.2,-.1,0.4]],
 thrust:[[0,-.4,-.1,-1.,-.5,-1.8,-.3,.3,-.6,1.4],[.4,.2,.25,-1.6,.1,0,-.3,.3,-.6,1.5],[1,.15,.2,-1.5,.05,-.1,-.3,.3,-.6,1.5]]};
function moveAt(name,p){const k=MOVES[name];let i=0;while(i<k.length-2&&p>k[i+1][0])i++;const a=k[i],b=k[i+1],f=sm(Math.min(1,Math.max(0,(p-a[0])/(b[0]-a[0]))));return a.map((v,n)=>lerpK(v,b[n],f));}
/* st: {mode, speed, run, t, atk:{name,p}, block, aim (0..1), pitch, hurt, roll:{p,dir}, look} */
export function animate(r,st,dt){zero();const t=st.t,S=r.S;let hipY=S.hip,direct=null;r.ph=r.ph||0;
 const mode=st.mode;const sp=st.speed||0;
 if(mode==='move'||mode==='idle'){const run=Math.min(1,Math.max(0,(sp-2.5)/5)),stride=lerpK(1.5,2.6,run)*S.hip/.92;r.ph+=sp*dt/stride*Math.PI;const s=Math.sin(r.ph),c=Math.cos(r.ph);
  const w=Math.min(1,sp/1.2);const A=lerpK(.45,.95,run)*w,K=lerpK(.75,1.7,run)*w,AA=lerpK(.45,.9,run)*w;
  T.legL[0]=-s*A;T.legR[0]=s*A;T.kneeL[0]=.08+K*Math.max(0,c);T.kneeR[0]=.08+K*Math.max(0,-c);T.footL[0]=-T.legL[0]*.3-.1*w;T.footR[0]=-T.legR[0]*.3-.1*w;
  T.armL[0]=s*AA;T.armR[0]=-s*AA;T.foreL[0]=-.25-run*.9*w;T.foreR[0]=-.25-run*.9*w;T.armL[2]=.12;T.armR[2]=-.12;
  T.spine[0]=lerpK(.04,.26,run)*w+(st.sprint?.12:0);T.hips[1]=s*.12*w;T.chest[1]=-s*.18*w;T.head[0]=-T.spine[0]*.6;
  hipY-=Math.abs(Math.sin(r.ph))*.05*w*(1+run)-(1-w)*0;
  const br=Math.sin(t*1.7)*(1-w);T.chest[0]+=br*.025;T.armL[2]+=.04*(1-w)+br*.02;T.armR[2]-=.04*(1-w)+br*.02;T.head[1]=Math.sin(t*.4)*.25*(1-w)*(st.idleLook??1);
  if(st.crouch){hipY-=.25;T.spine[0]+=.35;T.legL[0]-=.55;T.legR[0]-=.55;T.kneeL[0]+=.9;T.kneeR[0]+=.9;T.footL[0]-=.35;T.footR[0]-=.35;}}
 else if(mode==='air'){const up=st.vy>0?1:0;T.legL[0]=-.7;T.kneeL[0]=1.1;T.legR[0]=.15+up*-.3;T.kneeR[0]=.5;T.armL[0]=-.4;T.armR[0]=-.2;T.armL[2]=.8;T.armR[2]=-.8;T.foreL[0]=T.foreR[0]=-.4;T.spine[0]=.1;
  const f=Math.sin(t*9)*.08*(1-up);T.armL[2]+=f;T.armR[2]-=f;}
 else if(mode==='glide'){T.armL[0]=T.armR[0]=-2.85;T.armL[2]=.22;T.armR[2]=-.22;T.foreL[0]=T.foreR[0]=-.15;const sw=Math.sin(t*2.2);T.legL[0]=.1+sw*.15;T.legR[0]=.1-sw*.15;T.kneeL[0]=.5+sw*.2;T.kneeR[0]=.5-sw*.2;T.spine[0]=-.08;T.hips[2]=st.bank||0;}
 else if(mode==='climb'){r.ph+=(st.cmove||0)*dt*3.2;const s=Math.sin(r.ph);T.armL[0]=-2.55+s*.45;T.armR[0]=-2.55-s*.45;T.armL[2]=.35;T.armR[2]=-.35;T.foreL[0]=-.55-Math.max(0,-s)*.6;T.foreR[0]=-.55-Math.max(0,s)*.6;
  T.legL[0]=-.75-s*.45;T.legR[0]=-.75+s*.45;T.kneeL[0]=1.3+s*.3;T.kneeR[0]=1.3-s*.3;T.legL[2]=.25;T.legR[2]=-.25;T.spine[0]=-.12;T.head[0]=-.35;hipY-=.15;}
 else if(mode==='swim'){r.ph+=(.8+sp*.7)*dt*2.4;const s=Math.sin(r.ph),u=s*.5+.5;T.hips[0]=1.25*Math.min(1,.3+sp*.4);T.head[0]=-1.0*Math.min(1,.3+sp*.4);T.armL[0]=-2.5+u*1.1;T.armR[0]=-2.5+u*1.1;T.armL[2]=.2+u*1.1;T.armR[2]=-.2-u*1.1;T.foreL[0]=T.foreR[0]=-.4-u*.5;
  T.legL[0]=Math.sin(r.ph*2)*.3;T.legR[0]=-Math.sin(r.ph*2)*.3;T.kneeL[0]=T.kneeR[0]=.35;hipY=S.hip*.45;}
 else if(mode==='sit'){hipY=S.hip*.5;T.legL[0]=T.legR[0]=-1.45;T.kneeL[0]=T.kneeR[0]=1.5;T.legL[2]=.3;T.legR[2]=-.3;T.spine[0]=.25;T.armL[0]=T.armR[0]=-.6;T.foreL[0]=T.foreR[0]=-.8;T.chest[0]=Math.sin(t*1.3)*.03;}
 else if(mode==='sleep'){hipY=S.hip*.35;direct={z:1.45};T.legL[0]=-.9;T.kneeL[0]=1.3;T.legR[0]=-.5;T.kneeR[0]=.9;T.armL[0]=-.6;T.armR[0]=-1.2;T.foreR[0]=-1.2;T.chest[0]=Math.sin(t*1.1)*.05+.2;}
 else if(mode==='dead'){const p=Math.min(1,st.dp||1);hipY=lerpK(S.hip,S.hip*.3,p);direct={x:-1.45*sm(p)};T.armL[2]=1.2;T.armR[2]=-1.2;T.legL[2]=.2;T.legR[2]=-.2;T.kneeL[0]=.3;}
 else if(mode==='roll'){const p=st.roll.p;const d=st.roll.dir;if(d==='back'){direct={x:-sm(p)*Math.PI*2};hipY+=Math.sin(p*Math.PI)*.7;}else if(d==='left'||d==='right'){direct={z:(d==='left'?-1:1)*Math.sin(p*Math.PI)*.35};hipY+=Math.sin(p*Math.PI)*.4;}else{direct={x:sm(p)*Math.PI*2};hipY=lerpK(S.hip,S.hip*.55,Math.sin(p*Math.PI));}
  T.legL[0]=T.legR[0]=-1.3*Math.sin(p*Math.PI);T.kneeL[0]=T.kneeR[0]=2*Math.sin(p*Math.PI);T.armL[0]=T.armR[0]=-1.*Math.sin(p*Math.PI);T.foreL[0]=T.foreR[0]=-1.5*Math.sin(p*Math.PI);T.spine[0]=.6*Math.sin(p*Math.PI);}
 // overlays
 if(st.atk){const m=moveAt(st.atk.name,st.atk.p);T.chest[1]=m[1];T.chest[0]+=m[2];T.armR[0]=m[3];T.armR[2]=m[4];T.foreR[0]=m[5];if(!st.block&&!st.oneHand){T.armL[0]=m[6];T.armL[2]=m[7];T.foreL[0]=m[8];}T.spine[1]=m[1]*.3;T.handR[0]=m[9];
  if(st.atk.name==='spin'||st.atk.name==='sweep'){T.legL[0]=-.3;T.legR[0]=.35;T.kneeL[0]=.5;T.kneeR[0]=.3;}}
 if(st.block){T.armL[0]=-1.35;T.armL[2]=-.35;T.foreL[0]=-1.35;T.armL[1]=.4;T.chest[1]+=.15;if(mode!=='move'||sp<.5){T.legL[0]=-.35;T.kneeL[0]=.5;T.legR[0]=.3;T.kneeR[0]=.3;hipY-=.06;}}
 if(st.aim>0){const a=st.aim,p=st.pitch||0;T.chest[1]=-.25;T.armL[0]=-1.57-p;T.armL[2]=-.05;T.foreL[0]=0;T.armL[1]=.3;T.armR[0]=-1.5-p;T.armR[2]=lerpK(.1,.45,a);T.foreR[0]=lerpK(-.6,-2.1,a);T.armR[1]=-.4;T.head[0]=-p*.6;T.head[1]=.2;}
 if(st.hurt>0){T.spine[0]-=.35*st.hurt;T.head[0]-=.3*st.hurt;}
 if(st.look!==undefined&&!st.aim)T.head[0]+=st.look*.4;
 // apply with smoothing
 const k=1-Math.exp(-dt*(st.snap?60:18));for(const n of JOINTS){const e=r.j[n].rotation,t=T[n];e.x+=(t[0]-e.x)*k;e.y+=(t[1]-e.y)*k;e.z+=(t[2]-e.z)*k;if(e.x!==e.x||e.y!==e.y||e.z!==e.z)e.set(0,0,0);}
 if(direct){if(direct.x!==undefined)r.j.hips.rotation.x=direct.x;if(direct.z!==undefined)r.j.hips.rotation.z=direct.z;}
 r.hy+=(hipY-r.hy)*Math.min(1,dt*(direct?40:14));r.j.hips.position.y=r.hy;
 // secondary motion: scarf/cape
 if(r.scarf){r.sv=r.sv||0;const target=-.5-Math.min(1.3,sp*.13)-(mode==='glide'?1.:0)-(mode==='air'&&st.vy<0?.8:0);r.scarf.rotation.x+=(target+Math.sin(t*9)*.08*(.3+sp*.1)-r.scarf.rotation.x)*Math.min(1,dt*8);r.scarf.rotation.z=Math.sin(t*6.3)*.15;}
 if(r.cloak)updateCloak(r,st,dt);
 if(r.cape){r.cape.rotation.x+=(-.12-Math.min(.6,sp*.08)+Math.sin(t*2)*.05-r.cape.rotation.x)*Math.min(1,dt*5);}}
// world positions of a gear tip/base (for hit trails)
export function gearPoints(obj,a,b){obj.updateWorldMatrix(true,false);a.copy(obj.userData.base).applyMatrix4(obj.matrixWorld);b.copy(obj.userData.tip).applyMatrix4(obj.matrixWorld);}
