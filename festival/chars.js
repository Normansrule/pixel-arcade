// LANTERN STREET — procedural characters: Wren (the player) and the cardboard costume parts, the heroic Lighthouse Knight battle
// form, the three residents (Granny Fern, Teodor, Juno) and the mischief creatures (Puffkins, Old Bellows). Built from primitives,
// with a tiny pose animator. All designs are original.
import {THREE,ctex,mat,rnd} from './util.js';
const G=()=>new THREE.Group();
const S=(r,w=14,h=10,...a)=>new THREE.SphereGeometry(r,w,h,...a),C=(rt,rb,h,s=14,open=false)=>new THREE.CylinderGeometry(rt,rb,h,s,1,open),B=(x,y,z)=>new THREE.BoxGeometry(x,y,z),CAP=(r,l,s=10)=>new THREE.CapsuleGeometry(r,l,4,s);
function m(geo,mt,par,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx){const o=new THREE.Mesh(geo,mt);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.castShadow=true;par.add(o);return o;}
const pv=(par,x,y,z)=>{const g=G();g.position.set(x,y,z);par.add(g);return g;};

/* ---------- textures ---------- */
let TX=null;
export function tex(){if(TX)return TX;
 const card=ctex(256,256,(x,w,h)=>{x.fillStyle='#c79a62';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=6){x.fillStyle=i%12?'rgba(255,240,210,.10)':'rgba(90,60,30,.12)';x.fillRect(i,0,3,h);}
  for(let k=0;k<900;k++){x.fillStyle=`rgba(${Math.random()<.5?80:255},${Math.random()<.5?50:230},30,.05)`;x.fillRect(Math.random()*w,Math.random()*h,2,2);}
  x.fillStyle='rgba(220,226,232,.85)';x.fillRect(0,96,w,22);x.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<w;i+=9)x.fillRect(i,96,4,22);
  x.strokeStyle='rgba(60,40,20,.5)';x.lineWidth=2;x.setLineDash([6,5]);x.strokeRect(10,10,w-20,h-20);});
 // marker-painted stripes on cardboard (homemade tower)
 const stripes=ctex(256,256,(x,w,h)=>{x.fillStyle='#d1a46a';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=6){x.fillStyle=i%12?'rgba(255,240,210,.10)':'rgba(90,60,30,.12)';x.fillRect(i,0,3,h);}
  for(let b=0;b<3;b++){const y0=20+b*84;x.fillStyle='#d63a2e';for(let i=0;i<w;i+=2){x.fillRect(i,y0+Math.sin(i*.07+b)*3,2,40+Math.sin(i*.13)*2);}x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=1;for(let i=0;i<40;i++){x.beginPath();x.moveTo(Math.random()*w,y0+Math.random()*40);x.lineTo(Math.random()*w,y0+Math.random()*40);x.stroke();}}
  x.fillStyle='rgba(225,230,236,.9)';x.fillRect(0,0,w,10);x.fillRect(0,h-10,w,10);});
 const emblem=ctex(256,256,(x,w,h)=>{x.fillStyle='#d8c08a';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=6){x.fillStyle='rgba(120,80,30,.08)';x.fillRect(i,0,3,h);}
  x.save();x.translate(w/2,h/2);x.fillStyle='#2a4a7a';x.beginPath();x.arc(0,0,104,0,6.283);x.fill();x.fillStyle='#f2e6c8';x.beginPath();x.arc(0,0,86,0,6.283);x.fill();
  x.fillStyle='#ffcf4a';x.beginPath();x.moveTo(0,-40);x.lineTo(-90,-80);x.lineTo(-90,-10);x.closePath();x.fill();x.beginPath();x.moveTo(0,-40);x.lineTo(90,-80);x.lineTo(90,-10);x.closePath();x.fill();
  x.fillStyle='#d63a2e';x.beginPath();x.moveTo(-18,60);x.lineTo(-11,-30);x.lineTo(11,-30);x.lineTo(18,60);x.fill();x.fillStyle='#f2e6c8';x.fillRect(-15,0,30,12);x.fillRect(-17,30,34,12);x.fillStyle='#2a4a7a';x.fillRect(-14,-48,28,18);x.fillStyle='#ffcf4a';x.fillRect(-9,-45,18,12);
  x.fillStyle='#4a90c8';x.beginPath();x.moveTo(-86,62);for(let i=0;i<=8;i++)x.quadraticCurveTo(-86+i*21.5+10,52,-86+i*21.5+21.5,62);x.lineTo(86,90);x.lineTo(-86,90);x.fill();x.restore();});
 const knit=ctex(64,64,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='rgba(0,0,0,.18)';x.lineWidth=2;for(let j=0;j<h;j+=8)for(let i=0;i<w;i+=8){x.beginPath();x.moveTo(i,j);x.lineTo(i+4,j+7);x.lineTo(i+8,j);x.stroke();}},{rep:[3,3]});
 const fishScale=ctex(128,64,(x,w,h)=>{x.fillStyle='#ff7a3a';x.fillRect(0,0,w,h);x.strokeStyle='#ffd08a';x.lineWidth=2;for(let j=0;j<h;j+=10)for(let i=(j/10%2)*8;i<w;i+=16){x.beginPath();x.arc(i,j,8,0,Math.PI);x.stroke();}x.fillStyle='rgba(255,255,255,.2)';x.fillRect(0,0,w,6);});
 return TX={card,stripes,emblem,knit,fishScale};}

/* ---------- humanoid ---------- */
// face: eyes with highlights, cheeks, optional nose
function face(head,r,o={}){const eye=mat(0x1a1410,{r:.3}),hi=new THREE.MeshBasicMaterial({color:0xffffff}),ch=mat(o.cheek??0xf08a80,{r:.9});
 for(const s of[-1,1]){const e=m(S(r*.13,10,8),eye,head,s*r*.36,r*.08,r*.9,0,0,0,1,1.2,.6);e.castShadow=false;m(S(r*.045,6,4),hi,e,r*.04,r*.06,r*.08).castShadow=false;m(S(r*.14,10,6),ch,head,s*r*.6,-r*.22,r*.74,0,0,0,1,.6,.4).castShadow=false;}
 if(o.nose)m(S(r*.16,10,8),mat(o.nose,{r:.8}),head,0,-r*.08,r*.98);
 if(o.mouth!==false){const mo=m(new THREE.TorusGeometry(r*.12,r*.03,6,12,Math.PI),eye,head,0,-r*.32,r*.92,0,0,Math.PI);mo.castShadow=false;}}
export function human(o){const root=G(),body=pv(root,0,0,0);const sk=mat(o.skin??0xf2c09a,{r:.8});
 const hipY=o.hip,leg=o.leg??hipY*.9;const lL=pv(body,-o.lw,hipY,0),lR=pv(body,o.lw,hipY,0);
 const legM=mat(o.legC,{r:.85}),shoe=mat(o.shoe,{r:.6});
 for(const L of[lL,lR]){m(CAP(o.lr,leg-o.lr*2),legM,L,0,-leg/2,0);m(S(o.lr*1.35,10,8),shoe,L,0,-leg+o.lr*.6,o.lr*.5,0,0,0,1,.7,1.5);}
 const torso=pv(body,0,hipY,0);const top=mat(o.top,{r:.85,map:o.topMap||null});
 if(o.skirt)m(new THREE.LatheGeometry(o.skirt.map(([r,y])=>new THREE.Vector2(r,y)),18),top,torso,0,-hipY*.95,0);
 m(C(o.tw*.82,o.tw,o.th,16),top,torso,0,o.th/2,0);m(S(o.tw*.84,16,10),top,torso,0,o.th,0,0,0,0,1,.55,1);
 const neck=pv(torso,0,o.th,0),head=pv(neck,0,o.hr*.95,0);m(S(o.hr,22,16),sk,head);face(head,o.hr,o.face||{});
 const arm=o.arm??o.th*.95,aM=mat(o.sleeve??o.top,{r:.85});const aL=pv(torso,-(o.tw+o.ar*.8),o.th*.92,0),aR=pv(torso,o.tw+o.ar*.8,o.th*.92,0);
 for(const A of[aL,aR]){m(CAP(o.ar,arm-o.ar*2),aM,A,0,-arm/2,0);m(S(o.ar*1.25,10,8),sk,A,0,-arm,0);}aL.rotation.z=-.12;aR.rotation.z=.12;
 return{root,body,torso,head,neck,lL,lR,aL,aR,hipY,arm,leg,sk,t:rnd(9),walk:0};}

/* pose animator: state = idle | walk | talk | dance | wave | cheer | sit | play | worry */
export function pose(r,dt,st,spd=0,o={}){r.t+=dt;const t=r.t;r.walk=(r.walk+dt*spd*2.6)%(Math.PI*2);const w=r.walk,amp=Math.min(1,spd/2.5);
 const L=(a,b,k)=>a+(b-a)*Math.min(1,dt*k);let lx=0,rx=0,ax=0,bx=0,az=.12,bz=.12,by=0,bob=0,hx=0,hy=0,hz=0,ty=0;
 if(spd>.05){lx=Math.sin(w)*.75*amp;rx=-lx;ax=-lx*.8;bx=lx*.8;bob=Math.abs(Math.sin(w))*.06*amp;hz=Math.sin(w)*.03;}
 else if(st==='dance'){const k=t*5.2;bob=Math.abs(Math.sin(k))*.12;ax=-2.4+Math.sin(k)*.4;bx=-2.4-Math.sin(k)*.4;az=-.5;bz=.5;ty=Math.sin(t*2.6)*.5;hz=Math.sin(k)*.12;lx=Math.max(0,Math.sin(k))*.4;rx=Math.max(0,-Math.sin(k))*.4;}
 else if(st==='cheer'){const k=t*7;bob=Math.max(0,Math.sin(k))*.14;ax=bx=-2.8;az=-.35;bz=.35;hx=-.2;}
 else if(st==='wave'){bx=-2.6;bz=.5+Math.sin(t*9)*.35;bob=Math.sin(t*2)*.01;hz=.1;}
 else if(st==='talk'){bob=Math.abs(Math.sin(t*6))*.015;ax=-.3+Math.sin(t*3)*.25;az=-.3;hx=Math.sin(t*4)*.06;hy=Math.sin(t*1.7)*.1;}
 else if(st==='play'){bob=Math.abs(Math.sin(t*4))*.03;ax=-1.1+Math.sin(t*4)*.25;bx=-1.1-Math.sin(t*4)*.25;az=-.7-Math.sin(t*4)*.2;bz=.7+Math.sin(t*4)*.2;hx=.1;hz=Math.sin(t*2)*.15;}
 else if(st==='worry'){hy=Math.sin(t*.7)*.5;hx=.12;ax=-.5;bx=-.5;az=-.6;bz=.6;bob=Math.sin(t*1.6)*.01;}
 else if(st==='sit'){lx=rx=-1.4;bob=-r.hipY*.55;hx=.15+Math.sin(t*.9)*.05;hy=Math.sin(t*.4)*.3;ax=-.2;bx=-.2;}
 else if(st==='ladle'){bx=-.9+Math.sin(t*3)*.35;bz=.25;ax=-.4;hx=.15;bob=Math.sin(t*1.5)*.01;}
 else{bob=Math.sin(t*1.8)*.012;hy=Math.sin(t*.5)*.25;az=.12+Math.sin(t*1.8)*.03;bz=az;}
 if(o.hold){ax=Math.min(ax,-.9);az=-.25;}
 r.lL.rotation.x=L(r.lL.rotation.x,lx,14);r.lR.rotation.x=L(r.lR.rotation.x,rx,14);r.aL.rotation.x=L(r.aL.rotation.x,ax,12);r.aR.rotation.x=L(r.aR.rotation.x,bx,12);
 r.aL.rotation.z=L(r.aL.rotation.z,-az,10);r.aR.rotation.z=L(r.aR.rotation.z,bz,10);r.aR.rotation.y=L(r.aR.rotation.y,by,10);
 r.body.position.y=L(r.body.position.y,bob,18);r.body.rotation.y=L(r.body.rotation.y,ty,6);r.head.rotation.x=L(r.head.rotation.x,hx,8);r.head.rotation.y=L(r.head.rotation.y,hy,6);r.head.rotation.z=L(r.head.rotation.z,hz,8);}

/* ---------- Wren, the player ---------- */
export function makeWren(){const T=tex();const r=human({hip:.5,lw:.11,lr:.085,legC:0x2c3550,shoe:0xd8483a,top:0x2fa39a,tw:.25,th:.42,hr:.3,ar:.075,face:{cheek:0xf28a7a}});
 const hair=mat(0x4a2c1c,{r:.9});m(S(.315,18,12,0,6.283,0,1.7),hair,r.head,0,.04,-.02);m(C(0,.09,.22,8),hair,r.head,.05,.33,-.02,.4,0,-.3);
 m(new THREE.TorusGeometry(.2,.06,8,16),mat(0xf2c240,{r:.9}),r.neck,0,-.02,0,Math.PI/2);// scarf
 m(C(.27,.25,.14,16),mat(0x268a82,{r:.9}),r.torso,0,.02,0);// hoodie hem
 // little paper lantern on a stick (before the costume)
 const lan=pv(r.aR,0,-r.arm,.02);m(C(.012,.012,.55,6),mat(0x6a4a2a),lan,0,-.05,.22,1.2);const lb=pv(lan,0,-.2,.45);m(new THREE.CylinderGeometry(.002,.002,.18,4),mat(0x333333),lb,0,.06,0);
 const paper=new THREE.MeshStandardMaterial({color:0xff9a40,emissive:0xff7a20,emissiveIntensity:1.6,roughness:.7});m(S(.11,12,10),paper,lb,0,-.07,0,0,0,0,1,1.15,1).castShadow=false;m(C(.06,.06,.03,10),mat(0x3a2a1a),lb,0,.06,0);m(C(.05,.05,.03,10),mat(0x3a2a1a),lb,0,-.2,0);
 r.lantern=lan;r.paper=paper;
 // costume pieces (hidden until assembled)
 const cb=mat(0xffffff,{map:T.card,r:.9}),st=mat(0xffffff,{map:T.stripes,r:.9});
 const helm=pv(r.head,0,.02,0);m(B(.7,.62,.66),cb,helm,0,.02,0);const hole=new THREE.MeshBasicMaterial({color:0x1a120a});m(B(.42,.13,.02),hole,helm,0,.04,.335).castShadow=false;
 const jar=new THREE.MeshStandardMaterial({color:0xfff2b0,emissive:0xffc040,emissiveIntensity:2.2,roughness:.2,transparent:true,opacity:.92});m(C(.17,.17,.26,14),jar,helm,0,.46,0);m(C(.2,.2,.04,14),mat(0x8a8a90,{m:.6,r:.4}),helm,0,.34,0);
 m(new THREE.ConeGeometry(.26,.24,14),mat(0xd63a2e,{r:.8}),helm,0,.71,0);m(S(.04,8,6),mat(0xffd040,{e:0xffa000,ei:.8}),helm,0,.85,0);
 const body=pv(r.torso,0,0,0);m(C(.36,.4,.66,18,true),st,body,0,.26,0).material.side=THREE.DoubleSide;m(new THREE.TorusGeometry(.38,.035,6,20),mat(0xe8e8e8,{r:.6}),body,0,.58,0,Math.PI/2);
 const shield=pv(r.aL,-.08,-r.arm*.6,.05);m(C(.34,.34,.05,22),mat(0xffffff,{map:T.emblem,r:.85}),shield,0,0,0,0,0,Math.PI/2);m(new THREE.TorusGeometry(.34,.03,6,24),mat(0x9a6a3a,{r:.8}),shield,-.02,0,0,0,Math.PI/2);
 helm.visible=body.visible=shield.visible=false;r.parts={helm,body,shield};r.jar=jar;
 r.setCostume=(c)=>{for(const k in r.parts)r.parts[k].visible=!!c[k];r.lantern.visible=!c.helm;};
 return r;}

/* ---------- the Lighthouse Knight: the costume's battle form ---------- */
export function makeKnight(){const T=tex();const root=G(),b=pv(root,0,0,0);
 const white=mat(0xf4efe4,{r:.35,m:.15}),red=mat(0xd8382c,{r:.35,m:.15}),gold=mat(0xe8b040,{r:.3,m:.8}),navy=mat(0x24365a,{r:.6}),dark=mat(0x1a2030,{r:.5,m:.4});
 const lL=pv(b,-.24,1.0,0),lR=pv(b,.24,1.0,0);for(const L of[lL,lR]){m(CAP(.15,.6),navy,L,0,-.45,0);m(B(.32,.2,.46),dark,L,0,-.95,.06);m(C(.19,.17,.3,12),red,L,0,-.62,0);}
 const torso=pv(b,0,1.0,0);m(C(.5,.62,.5,20),white,torso,0,.25,0);m(C(.45,.5,.32,20),red,torso,0,.66,0);m(C(.42,.45,.32,20),white,torso,0,.98,0);
 for(const y of[.5,.83,1.15])m(new THREE.TorusGeometry(y===.5?.56:.47,.04,8,24),gold,torso,0,y,0,Math.PI/2);
 const gal=m(C(.62,.62,.07,24),dark,torso,0,1.18,0);for(let i=0;i<16;i++){const a=i/16*6.283;m(C(.015,.015,.18,4),gold,torso,Math.cos(a)*.58,1.27,Math.sin(a)*.58);}m(new THREE.TorusGeometry(.58,.02,4,24),gold,torso,0,1.36,0,Math.PI/2);
 const head=pv(torso,0,1.22,0);const glass=new THREE.MeshStandardMaterial({color:0xfff6c8,emissive:0xffcc50,emissiveIntensity:3.2,roughness:.1,transparent:true,opacity:.95});
 m(C(.33,.33,.46,16),glass,head,0,.3,0);for(let i=0;i<6;i++){const a=i/6*6.283;m(B(.04,.48,.04),dark,head,Math.cos(a)*.33,.3,Math.sin(a)*.33);}
 m(new THREE.SphereGeometry(.38,16,8,0,6.283,0,Math.PI/2),red,head,0,.53,0);m(new THREE.ConeGeometry(.06,.3,8),gold,head,0,1.0,0);m(S(.06,8,6),gold,head,0,.92,0);
 const visor=m(B(.4,.1,.05),new THREE.MeshBasicMaterial({color:0x40e0ff}),head,0,.28,.31);visor.castShadow=false;
 const lamp=new THREE.PointLight(0xffd070,6,9,1.6);lamp.position.set(0,.3,0);head.add(lamp);
 const aL=pv(torso,-.62,1.05,0),aR=pv(torso,.62,1.05,0);for(const A of[aL,aR]){m(S(.2,12,8),red,A,0,0,0);m(CAP(.12,.5),white,A,0,-.4,0);m(C(.16,.14,.28,10),gold,A,0,-.72,0);}
 const sh=pv(aL,-.14,-.6,.12);m(C(.55,.55,.08,28),mat(0xffffff,{map:T.emblem,r:.4,m:.2}),sh,0,0,0,0,0,Math.PI/2);m(new THREE.TorusGeometry(.55,.05,8,28),gold,sh,-.03,0,0,0,Math.PI/2);
 const lance=pv(aR,0,-.78,.05);m(C(.05,.05,1.6,8),gold,lance,0,0,.55,Math.PI/2);const beam=new THREE.MeshBasicMaterial({color:0xffe080,transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false});m(new THREE.ConeGeometry(.5,3.6,20,1,true),beam,lance,0,0,3.1,-Math.PI/2).castShadow=false;
 const cape=m(new THREE.PlaneGeometry(1.1,1.5,4,6),mat(0x2a4a8a,{side:THREE.DoubleSide,r:.7}),torso,0,.5,-.5,.12);
 root.scale.setScalar(1.05);return{root,body:b,torso,head,lL,lR,aL,aR,sh,lance,beam,glass,lamp,cape,t:0,hipY:1,arm:.8,neck:head,walk:0};}

/* ---------- residents ---------- */
export function makeFern(){const r=human({hip:.34,lw:.1,lr:.08,legC:0x4a3a4a,shoe:0x3a2a2a,top:0x7a3a6a,tw:.3,th:.36,hr:.28,ar:.08,skin:0xeab48e,
  skirt:[[0,.0],[.5,.02],[.46,.18],[.38,.5],[.3,.7],[.2,.8]],face:{nose:0xe0a080,cheek:0xe88a8a}});
 const hair=mat(0xe8e4dc,{r:.9});m(S(.29,16,12,0,6.283,0,1.5),hair,r.head,0,.03,-.02);m(S(.15,12,10),hair,r.head,0,.3,-.1);m(C(.01,.01,.36,5),mat(0x2a8a7a),r.head,.02,.34,-.1,0,0,1.3);
 const gl=mat(0x2a2a2a,{m:.6,r:.3});for(const s of[-1,1])m(new THREE.TorusGeometry(.075,.012,6,16),gl,r.head,s*.1,.03,.27);
 m(new THREE.TorusGeometry(.32,.09,8,18),mat(0x2a8a7a,{r:.95,map:tex().knit}),r.neck,0,-.06,0,Math.PI/2,0,0,1,1,.6);// shawl
 m(B(.36,.44,.04),mat(0xf2ead8,{r:.9}),r.torso,0,-.05,.31,-.12);// apron
 const lad=pv(r.aR,0,-r.arm,0);m(C(.015,.015,.5,6),mat(0x8a6a3a),lad,0,-.05,.2,1.3);m(new THREE.SphereGeometry(.08,10,6,0,6.283,Math.PI/2,Math.PI/2),mat(0xb0b0b8,{m:.7,r:.3}),lad,0,-.2,.4);
 return r;}
export function makeTeo(){const r=human({hip:1.0,lw:.12,lr:.075,legC:0x2a2a3a,shoe:0x5a3a22,top:0x3a7a4a,tw:.24,th:.62,hr:.27,ar:.07,skin:0xe8b088,arm:.78,face:{nose:0xd08870,mouth:false}});
 m(C(.27,.34,.7,14,true),mat(0x3a7a4a,{r:.85,side:THREE.DoubleSide}),r.torso,0,-.28,0);// long coat skirt
 m(B(.34,.7,.05),mat(0x9a7a5a,{r:.9}),r.torso,0,.05,.25);// apron
 const ms=mat(0x6a4a3a,{r:.95});for(const s of[-1,1])m(S(.12,10,8),ms,r.head,s*.1,-.12,.24,0,0,s*.4,1.3,.6,.8);m(S(.1,10,8),ms,r.head,0,-.02,.27,0,0,0,1,.5,.5);
 const hat=mat(0xd04a3a,{r:.95,map:tex().knit});m(new THREE.ConeGeometry(.27,.62,14),hat,r.head,.06,.42,-.04,-.12,0,-.25);m(C(.28,.28,.1,14),mat(0xf2e6d0,{r:.95,map:tex().knit}),r.head,0,.15,0);m(S(.09,10,8),mat(0xf2e6d0,{r:.95}),r.head,.22,.72,-.1);
 const sc=mat(0xf0902a,{r:.95,map:tex().knit});m(new THREE.TorusGeometry(.2,.07,8,16),sc,r.neck,0,-.04,0,Math.PI/2);m(B(.12,.6,.05),sc,r.torso,.12,.35,.24,0,0,.1);
 // squeezebox (shown when he plays)
 const box=pv(r.torso,0,.25,.4);const bm=mat(0xc83a3a,{r:.5});m(B(.2,.3,.22),bm,box,-.22,0,0);m(B(.2,.3,.22),bm,box,.22,0,0);for(let i=0;i<5;i++)m(B(.05,.28,.2),mat(i%2?0x1a1a1a:0xf2ead8),box,-.1+i*.05,0,0);box.visible=false;r.box=box;
 return r;}
export function makeJuno(){const r=human({hip:.32,lw:.09,lr:.075,legC:0xd8483a,shoe:0xd8483a,top:0xf2c030,tw:.22,th:.32,hr:.27,ar:.07,face:{cheek:0xf08a80},
  skirt:[[0,0],[.3,.0],[.3,.08],[.24,.36],[.2,.42]]});
 const hat=mat(0xf2c030,{r:.7});m(new THREE.SphereGeometry(.29,16,10,0,6.283,0,1.4),hat,r.head,0,.04,0);m(C(.42,.42,.03,18),hat,r.head,0,.11,0,.1);
 const hair=mat(0x2a1a14,{r:.9});for(const s of[-1,1])m(S(.08,8,6),hair,r.head,s*.27,-.08,-.02);
 // fish lantern on a pole
 const pole=pv(r.aR,0,-r.arm,0);m(C(.012,.012,1.1,6),mat(0x6a4a2a),pole,0,.25,.1,.2);const fish=pv(pole,0,.85,.25);
 const fm=new THREE.MeshStandardMaterial({color:0xffffff,map:tex().fishScale,emissive:0xff6a20,emissiveIntensity:.05,roughness:.7});
 m(S(.2,14,10),fm,fish,0,0,0,0,0,0,1.6,1,1);m(new THREE.ConeGeometry(.16,.24,4),fm,fish,-.38,0,0,0,0,Math.PI/2,1,1,.3);const ey=mat(0x1a1a1a);for(const s of[-1,1])m(S(.035,6,4),ey,fish,.22,.05,s*.13);
 r.fish=fish;r.fishMat=fm;return r;}

/* ---------- mischief creatures ---------- */
export function makePuffkin(seed=0){const root=G(),b=pv(root,0,0,0);const fur=new THREE.MeshStandardMaterial({color:0xa79cc8,roughness:1,emissive:0x2a2040,emissiveIntensity:.6});
 const P=[[0,0,0,.42],[.26,.12,-.05,.26],[-.26,.14,-.04,.27],[.05,.3,-.08,.28],[.18,-.18,-.06,.24],[-.2,-.16,-.06,.24],[0,-.05,-.22,.32]];for(const[x,y,z,s]of P)m(S(s,14,10),fur,b,x,y,z);
 const ew=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3}),ep=mat(0x16101e,{r:.3});for(const s of[-1,1]){const e=m(S(.11,12,8),ew,b,s*.13,.1,.35,0,0,0,1,1.2,.7);m(S(.055,8,6),ep,e,0,-.01,.08);}
 const ch=mat(0xf090b0,{r:.9});for(const s of[-1,1])m(S(.13,10,8),ch,b,s*.24,-.06,.27,0,0,0,1,.85,.7);
 const mo=m(new THREE.TorusGeometry(.045,.02,6,10),mat(0x3a2040),b,0,-.08,.41);for(const s of[-1,1])m(S(.07,8,6),fur,b,s*.42,-.12,.08);
 const tail=m(new THREE.ConeGeometry(.12,.5,8),fur,b,0,-.3,-.35,-2.2);root.userData={b,mo,tail,seed,t:rnd(9)};return root;}
export function animPuffkin(p,dt,o={}){const u=p.userData;u.t+=dt;const t=u.t;u.b.position.y=Math.sin(t*2.2+u.seed)*.12+(o.lift||0);u.b.rotation.z=Math.sin(t*1.7+u.seed)*.12;
 const puff=o.blow?1+Math.abs(Math.sin(t*10))*.25:1+Math.sin(t*3)*.04;u.b.scale.set(puff,1/puff*1.02,puff);u.mo.scale.setScalar(o.blow?1.8:1);u.tail.rotation.y=Math.sin(t*3)*.4;}
export function makeBellows(){const root=G(),b=pv(root,0,0,0);const wood=mat(0x8a5a32,{r:.8}),pleat=mat(0x6a2a3a,{r:.9}),pl2=mat(0xd8c49a,{r:.9}),brass=mat(0xd8a838,{m:.8,r:.3});
 const top=pv(b,0,1.0,0),bot=pv(b,0,.35,0);m(C(.85,.75,.12,7),wood,top,0,0,0);m(C(.75,.85,.12,7),wood,bot,0,0,0);
 const pl=pv(b,0,.35,0);for(let i=0;i<5;i++)m(C(.78-(i%2)*.06,.78-((i+1)%2)*.06,.13,7),i%2?pl2:pleat,pl,0,.07+i*.13,0);
 const nz=m(new THREE.ConeGeometry(.16,.7,10),brass,b,0,.68,.92,Math.PI/2);
 const ew=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3}),ep=mat(0x16101e,{r:.3});for(const s of[-1,1]){const e=m(S(.17,12,8),ew,top,s*.3,.16,.45);m(S(.08,8,6),ep,e,0,0,.13);m(B(.3,.07,.08),mat(0x3a2a1a),top,s*.3,.38,.45,0,0,-s*.35);}
 for(const s of[-1,1]){const lg=m(CAP(.08,.25),wood,b,s*.4,.1,0);}m(B(.12,.5,.12),wood,top,0,.3,-.7,.4);m(S(.1,8,6),brass,top,0,.58,-.82);
 b.scale.setScalar(1.25);root.userData={b,top,pl,nz,t:0};return root;}
export function animBellows(p,dt,o={}){const u=p.userData;u.t+=dt;const t=u.t;const k=o.inhale?1.35+Math.sin(t*3)*.05:o.blow?.7+Math.abs(Math.sin(t*14))*.15:1+Math.sin(t*2)*.08;
 u.pl.scale.y=k;u.top.position.y=.35+.65*k;u.b.position.y=Math.abs(Math.sin(t*2))*.04;u.b.rotation.y=Math.sin(t*.8)*.12;}
