// SIDEWAYS — procedural car models. Bodies are lofted from cross-sections (wheel arches carved into the sill line),
// tinted glass cabin with a visible interior (bucket seats, cage, helmeted driver), painted roof, flares, wings,
// projector headlights, honeycomb grille, plates, tow hooks, and spinning/steering wheels with lettered tyres,
// drilled discs, arc calipers, lug nuts and four rim styles.
// The paint shader draws panel shut lines, metallic flake, sill grime and the livery from object-space position,
// so recolouring never rebuilds geometry.
import * as THREE from '../vendor/three.module.min.js';
import {merge,M4,cl,smooth,ctex,seeded} from './util.js';
const V=THREE.Vector3,C=h=>new THREE.Color(h);

// body definitions: overhangs, half-width, roof, top-line keyframes (t: 0 rear -> 1 front), cabin span
export const SHAPES={
 sparrow:{fo:.78,ro:.74,W:.83,top:[[0,.62],[.04,.86],[.16,.9],[.27,.9],[.3,.88],[.62,.84],[.9,.8],[.97,.74],[1,.6]],cab:[.2,.3,.56,.66],roof:1.3,cw:.9,wing:'none',lights:'square',flare:0,clear:.17,belt:.11,doors:2},
 kestrel:{fo:.92,ro:.8,W:.87,top:[[0,.64],[.04,.86],[.12,.9],[.24,.89],[.6,.82],[.88,.76],[.97,.7],[1,.56]],cab:[.12,.36,.52,.64],roof:1.27,cw:.88,wing:'duck',lights:'slim',flare:.02,clear:.15,belt:.1,doors:2},
 bruiser:{fo:.98,ro:1.06,W:.93,top:[[0,.66],[.04,.92],[.18,.95],[.24,.95],[.28,.93],[.66,.9],[.92,.86],[.98,.78],[1,.64]],cab:[.25,.33,.6,.7],roof:1.42,cw:.9,wing:'none',lights:'quad',flare:.0,clear:.18,belt:.12,doors:4},
 tempest:{fo:.9,ro:.82,W:.9,top:[[0,.66],[.04,.9],[.14,.93],[.24,.92],[.6,.84],[.88,.78],[.97,.72],[1,.56]],cab:[.17,.32,.55,.66],roof:1.27,cw:.86,wing:'gt',lights:'slim',flare:.09,clear:.13,belt:.1,doors:2},
 wraith:{fo:.98,ro:.9,W:.94,top:[[0,.7],[.04,.92],[.12,.96],[.3,.98],[.38,.96],[.55,.88],[.8,.7],[.96,.62],[1,.5]],cab:[.3,.42,.58,.7],roof:1.14,cw:.84,wing:'tall',lights:'slim',flare:.07,clear:.11,belt:.12,doors:2}};

function keyLerp(k,t){if(t<=k[0][0])return k[0][1];for(let i=1;i<k.length;i++)if(t<=k[i][0]){const a=k[i-1],b=k[i],f=(t-a[0])/(b[0]-a[0]),s=f*f*(3-2*f);return a[1]+(b[1]-a[1])*s;}return k[k.length-1][1];}

export function bodyFn(spec,sh){const a=spec.wb*(1-spec.fr),b=spec.wb*spec.fr,zF=a+sh.fo,zR=-b-sh.ro,len=zF-zR;
 const wheels=[a,-b];
 return{zF,zR,len,a,b,
  t:z=>(z-zR)/len,
  sec(z){const t=(z-zR)/len;const ends=Math.min(t,1-t)*len;// metres from either end
   const round=Math.pow(cl(ends/.55,0,1),.42);let w=sh.W*(.78+.22*round);
   for(const wz of wheels){const d=Math.abs(z-wz);w+=sh.flare*smooth(.75,.35,d);}
   let yt=keyLerp(sh.top,t);let yb=sh.clear+(1-round)*.12;
   for(const wz of wheels){const d=Math.abs(z-wz),ra=.43;if(d<ra)yb=Math.max(yb,.3+Math.sqrt(ra*ra-d*d)*.98);}
   const ys=yt-sh.belt;yb=Math.min(yb,ys-.12);return{w,yb,ys,yt};}};}

// cross-section: sill tuck, rocker, a character crease below the shoulder, shoulder, tumblehome to the deck
function ring(s,crown=.015){const{w,yb,ys,yt}=s;const mid=yb+(ys-yb)*.55;
 const half=[[w*.84,yb],[w*.95,yb+.035],[w*.985,yb+.09],[w*.995,mid-.02],[w,mid+.015],[w*.992,ys-.05],[w,ys-.012],[w*.985,ys+.02],[w*.93,yt-.035],[w*.8,yt-.01],[w*.55,yt+crown*.5],[w*.25,yt+crown*.9]];
 return[[0,yb],...half,[0,yt+crown],...half.slice().reverse().map(([x,y])=>[-x,y])];}
function loft(zs,ringAt,capF=true,capR=true){const rows=zs.map(z=>ringAt(z)),n=rows[0].length,pos=[],idx=[];
 zs.forEach((z,i)=>rows[i].forEach(([x,y])=>pos.push(x,y,z)));
 for(let i=0;i<zs.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=(i+1)*n+j,d=(i+1)*n+(j+1)%n;idx.push(a,b,c,b,d,c);}
 const cap=(i,flip)=>{const r=rows[i];let cx=0,cy=0;r.forEach(([x,y])=>{cx+=x;cy+=y;});const ci=pos.length/3;pos.push(cx/n,cy/n,zs[i]);for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;flip?idx.push(ci,a,b):idx.push(ci,b,a);}};
 if(capR)cap(0,false);if(capF)cap(zs.length-1,true);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
// a thin tube through points (roll cage, mouldings)
function tube(pts,r,seg=10,rad=6){const c=new THREE.CatmullRomCurve3(pts.map(p=>new V(...p)),false,'catmullrom',.1);return new THREE.TubeGeometry(c,seg,r,rad,false);}

/* ---------- paint: clearcoat + flake + shut lines + grime + livery ---------- */
const numTex=new Map();
function numberTexture(n){if(numTex.has(n))return numTex.get(n);const t=ctex(256,256,(x,w,h)=>{x.fillStyle='#fff';x.beginPath();x.arc(w/2,h/2,w*.48,0,7);x.fill();x.fillStyle='#000';x.font='bold 150px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(n),w/2,h/2+8);},{clamp:true});numTex.set(n,t);return t;}
// seams: x = front door line z, y = rear door line z (or -99), z = hood seam z, w = boot seam z ; sill: y of the door bottom; hw: half width for the bonnet/boot side seams
export function paintMaterial(look,num=22,seams=null){const m=new THREE.MeshPhysicalMaterial({color:look.paint,metalness:.55,roughness:.32,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1.15});
 const U={uLiv:{value:look.livery|0},uLivCol:{value:new THREE.Color(look.liv)},uNum:{value:numberTexture(num)},uLen:{value:2.2},uSeam:{value:seams?new THREE.Vector4(...seams.z):new THREE.Vector4(-99,-99,-99,-99)},uSeam2:{value:seams?new THREE.Vector4(...seams.y):new THREE.Vector4(0,0,0,0)}};m.userData.U=U;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;varying vec3 vON;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=position;vON=normal;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;varying vec3 vON;uniform int uLiv;uniform vec3 uLivCol;uniform sampler2D uNum;uniform float uLen;uniform vec4 uSeam,uSeam2;float gSeam=0.,gDirt=0.,gFlake=0.;\nfloat sGap(float d){return 1.-smoothstep(.0022,.0062,abs(d));}float sLip(float d){return smoothstep(.005,.008,d)*(1.-smoothstep(.008,.014,d));}\nfloat hsh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}').replace('#include <color_fragment>',`#include <color_fragment>
  {vec3 p=vOP;float side=abs(vON.x),top=vON.y;float k=0.;
   if(uLiv==1){float ax=abs(p.x);k=step(.07,ax)*step(ax,.2)*step(.55,top);}
   else if(uLiv==2){float d=p.y-.55+p.z*.18;k=step(.45,side)*smoothstep(-.09,-.07,d)*(1.-smoothstep(.07,.09,d));k=max(k,step(.45,side)*smoothstep(-.03,-.01,d-.18)*(1.-smoothstep(.01,.03,d-.18)));}
   else if(uLiv==3){k=step(p.y,.6)*step(.2,side+0.)+step(p.y,.6)*step(top,.5);k=min(k,1.);}
   else if(uLiv==4){vec2 q=vec2(p.z*sign(p.x)*-1.,p.y-.58)/.36+.5;if(side>.5&&q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.){vec4 t=texture2D(uNum,q);diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.02),vec3(.95),t.r),t.a);}
    k=step(.07,abs(p.x))*step(abs(p.x),.13)*step(.55,top);}
   else if(uLiv==5){float s=fract((p.z+p.y)*2.2);k=step(.5,s)*step(p.y,.5)*step(1.4,abs(p.z));}
   diffuseColor.rgb=mix(diffuseColor.rgb,uLivCol,k);
   // shut lines: door verticals on the sides, bonnet and boot outlines on the top
   float sideM=smoothstep(.55,.8,side),topM=smoothstep(.35,.6,top);float g=0.,lip=0.;
   float inDoor=step(uSeam2.x,p.y)*step(p.y,uSeam2.y);
   g=max(g,sideM*inDoor*sGap(p.z-uSeam.x));lip=max(lip,sideM*inDoor*sLip(p.z-uSeam.x));
   if(uSeam.y>-50.){g=max(g,sideM*inDoor*sGap(p.z-uSeam.y));}
   float doorEnd=uSeam.y>-50.?uSeam.y-.9:uSeam.x-1.12;g=max(g,sideM*step(doorEnd,p.z)*step(p.z,uSeam.x)*sGap(p.y-uSeam2.x));
   g=max(g,sideM*step(doorEnd,p.z)*step(p.z,uSeam.x)*sGap(p.y-uSeam2.y+.03));
   float ax=abs(p.x);
   g=max(g,topM*step(ax,uSeam2.z)*sGap(p.z-uSeam.z));lip=max(lip,topM*step(ax,uSeam2.z)*sLip(uSeam.z-p.z));
   g=max(g,topM*step(uSeam.z,p.z)*sGap(ax-uSeam2.z));
   g=max(g,topM*step(ax,uSeam2.w)*sGap(p.z-uSeam.w));g=max(g,topM*step(p.z,uSeam.w)*sGap(ax-uSeam2.w));
   // fuel flap on the rear quarter
   float fd=length(vec2(p.z-(doorEnd-.62),p.y-(uSeam2.y-.12)));g=max(g,step(.5,p.x)*sideM*sGap(fd-.075));
   gSeam=g;diffuseColor.rgb*=1.-.88*g;diffuseColor.rgb+=lip*.035;
   // road grime creeping up the sills and bumpers
   gDirt=(1.-smoothstep(.16,.46,p.y))*(.55+.45*hsh(floor(p*vec3(9.,40.,9.))));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.13,.115,.1),gDirt*.38);
   gFlake=hsh(floor(p*900.));}`).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(gFlake-.5)*.16+gDirt*.35+gSeam*.6,.04,1.);')
   .replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\nmaterial.clearcoatRoughness=clamp(material.clearcoatRoughness+gDirt*.4+gSeam*.5,0.,1.);');};
 m.customProgramCacheKey=()=>'livery2';return m;}

/* ---------- canvas textures (baked once, cached) ---------- */
const TX={};
function tyreTex(){if(TX.tyre)return TX.tyre;// u: around the tyre, v: along the lathe profile (sidewall, shoulder, tread, shoulder, sidewall)
 const W=1024,H=128,r=seeded(77);
 const draw=(x,bump)=>{x.fillStyle=bump?'#808080':'#1d1d1f';x.fillRect(0,0,W,H);
  // tread band rows ~ 40..88 : circumferential grooves + sipes
  const t0=40,t1=88;x.fillStyle=bump?'#9a9a9a':'#222224';x.fillRect(0,t0,W,t1-t0);
  x.fillStyle=bump?'#202020':'#0c0c0d';for(const y of[50,63,76])x.fillRect(0,y,W,3);
  for(let i=0;i<W;i+=12){x.fillRect(i,t0,2,9);x.fillRect(i+6,t1-9,2,9);}
  // sidewall lettering, twice per side, raised
  x.font='bold 15px "JetBrains Mono", monospace';x.textBaseline='middle';
  for(const[y,flip]of[[20,false],[108,true]])for(let k=0;k<2;k++){x.save();x.translate(k*W/2+40,y);if(flip){x.scale(-1,1);x.translate(-W/2+80,0);}
   x.fillStyle=bump?'#c8c8c8':'#46464a';x.fillText('SIDEWAYS  RS-02  265/35 ZR18',0,0);x.font='bold 9px "JetBrains Mono", monospace';x.fillText('TREADWEAR 200  ·  DIRECTIONAL ▶',300,1);x.font='bold 15px "JetBrains Mono", monospace';x.restore();}
  // rim protector ridge + fine moulding lines
  x.fillStyle=bump?'#b0b0b0':'#262628';x.fillRect(0,4,W,2);x.fillRect(0,H-6,W,2);
  if(!bump){for(let i=0;i<1600;i++){x.fillStyle=`rgba(${r()<.5?0:90},${r()<.5?0:80},${r()<.5?0:70},${.05+r()*.06})`;x.fillRect(r()*W,r()*H,1+r()*3,1);}}};
 const map=ctex(W,H,x=>draw(x,false)),bump=ctex(W,H,x=>draw(x,true),{srgb:false});TX.tyre={map,bump};return TX.tyre;}
function discTex(){if(TX.disc)return TX.disc;TX.disc=ctex(256,256,(x,w,h)=>{const c=w/2;x.fillStyle='#202022';x.fillRect(0,0,w,h);
  const g=x.createRadialGradient(c,c,c*.45,c,c,c);g.addColorStop(0,'#5d6066');g.addColorStop(.5,'#9a9ea6');g.addColorStop(.9,'#7c7f86');g.addColorStop(1,'#3a3b3e');x.fillStyle=g;x.beginPath();x.arc(c,c,c,0,7);x.fill();
  // machining rings
  for(let i=0;i<60;i++){x.strokeStyle=`rgba(255,255,255,${Math.random()*.06})`;x.beginPath();x.arc(c,c,c*(.55+Math.random()*.42),0,7);x.stroke();}
  // heat tint band
  x.strokeStyle='rgba(120,70,140,.18)';x.lineWidth=10;x.beginPath();x.arc(c,c,c*.78,0,7);x.stroke();
  // cross-drilled holes + slots
  x.fillStyle='#0b0b0c';for(let k=0;k<3;k++)for(let i=0;i<18;i++){const a=i/18*6.283+k*.12,rr=c*(.66+k*.1);x.beginPath();x.arc(c+Math.cos(a)*rr,c+Math.sin(a)*rr,3.2,0,7);x.fill();}
  x.strokeStyle='rgba(10,10,10,.8)';x.lineWidth=2.5;for(let i=0;i<6;i++){const a=i/6*6.283+.3;x.beginPath();x.arc(c,c,c*.86,a,a+.35);x.stroke();}
  // hat
  const hg=x.createRadialGradient(c,c,0,c,c,c*.5);hg.addColorStop(0,'#2a2b2e');hg.addColorStop(1,'#56585e');x.fillStyle=hg;x.beginPath();x.arc(c,c,c*.5,0,7);x.fill();
  x.fillStyle='#111';for(let i=0;i<5;i++){const a=i/5*6.283;x.beginPath();x.arc(c+Math.cos(a)*c*.3,c+Math.sin(a)*c*.3,6,0,7);x.fill();}},{clamp:true});return TX.disc;}
function lampTex(kind){if(TX[kind])return TX[kind];TX[kind]=ctex(256,128,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);
 if(kind==='head'){// chrome reflector bowls, two projector lenses, a DRL bar along the bottom
  for(const cx of[w*.3,w*.72]){const g=x.createRadialGradient(cx,h*.46,0,cx,h*.46,h*.42);g.addColorStop(0,'#ffffff');g.addColorStop(.25,'#fff6e0');g.addColorStop(.32,'#3a3a40');g.addColorStop(.55,'#8a8c94');g.addColorStop(.8,'#2a2b30');g.addColorStop(1,'#111');x.fillStyle=g;x.beginPath();x.arc(cx,h*.46,h*.42,0,7);x.fill();
   x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=2;x.beginPath();x.arc(cx,h*.46,h*.2,0,7);x.stroke();}
  x.fillStyle='#e8f2ff';x.fillRect(w*.08,h*.86,w*.84,h*.07);}
 else{// tail: ring elements in a red lens with a hex grain
  x.fillStyle='#3a0402';x.fillRect(0,0,w,h);for(let j=0;j<h;j+=8)for(let i=(j/8%2)*5;i<w;i+=10){x.fillStyle='rgba(255,60,40,.22)';x.fillRect(i,j,6,5);}
  for(const cx of[w*.25,w*.75]){x.strokeStyle='#ff4a30';x.lineWidth=12;x.beginPath();x.arc(cx,h/2,h*.3,0,7);x.stroke();x.fillStyle='#ff9a80';x.beginPath();x.arc(cx,h/2,h*.1,0,7);x.fill();}
  x.fillStyle='#fff';x.fillRect(w*.46,h*.3,w*.08,h*.4);}},{});return TX[kind];}
function grilleTex(){if(TX.grille)return TX.grille;TX.grille=ctex(128,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#fff';
 for(let j=0;j<h;j+=8)for(let i=((j/8)%2)*6;i<w;i+=12){x.beginPath();for(let k=0;k<6;k++){const a=k/6*6.283;x.lineTo(i+Math.cos(a)*5.2,j+Math.sin(a)*4.2);}x.closePath();x.fill();}
 x.globalCompositeOperation='destination-out';for(let j=0;j<h;j+=8)for(let i=((j/8)%2)*6;i<w;i+=12){x.beginPath();for(let k=0;k<6;k++){const a=k/6*6.283;x.lineTo(i+Math.cos(a)*3.4,j+Math.sin(a)*2.6);}x.closePath();x.fill();}},{srgb:false});return TX.grille;}
function plateTex(){if(TX.plate)return TX.plate;TX.plate=ctex(256,64,(x,w,h)=>{x.fillStyle='#e9e6dc';x.fillRect(0,0,w,h);x.strokeStyle='#222';x.lineWidth=4;x.strokeRect(3,3,w-6,h-6);
 x.fillStyle='#16233a';x.font='bold 40px "JetBrains Mono", monospace';x.textAlign='center';x.textBaseline='middle';x.fillText('SDW·22',w/2,h/2+2);
 x.fillStyle='rgba(60,40,20,.25)';for(let i=0;i<120;i++)x.fillRect(Math.random()*w,h*.7+Math.random()*h*.3,2,1);},{});return TX.plate;}

/* ---------- wheels ---------- */
function tireGeo(R,w,lo){const ri=R*.68,sh=.045,pts=[];// inner bead -> bulged sidewall -> rounded shoulder -> flat tread -> back down
 const side=(sgn)=>{const o=[];for(let i=0;i<=4;i++){const t=i/4,rr=ri+(R-sh-ri)*t,bul=Math.sin(t*Math.PI)*.012;o.push([rr,sgn*(w/2+bul)]);}return o;};
 const L=side(-1);for(const[r,y]of L)pts.push(new THREE.Vector2(r,y));
 for(let i=1;i<=4;i++){const a=-Math.PI/2+i/4*Math.PI/2;pts.push(new THREE.Vector2(R-sh+Math.cos(a)*sh,-w/2+sh+Math.sin(a)*sh));}
 for(let i=0;i<=4;i++){const a=i/4*Math.PI/2;pts.push(new THREE.Vector2(R-sh+Math.cos(a)*sh,w/2-sh+Math.sin(a)*sh));}
 const Rr=side(1).reverse();for(let i=1;i<Rr.length;i++)pts.push(new THREE.Vector2(Rr[i][0],Rr[i][1]));
 const g=new THREE.LatheGeometry(pts,lo?16:40);g.rotateZ(Math.PI/2);
 // remap v to fixed bands of the tyre texture: sidewall 0..30, shoulder, tread 40..88, sidewall 98..128 (of 128)
 const uv=g.attributes.uv,n=pts.length,VP=[4,10,16,22,28,31,34,37,40,88,91,94,97,100,106,112,118,124];
 for(let i=0;i<uv.count;i++){const j=i%n;uv.setY(i,1-VP[Math.min(j,VP.length-1)]/128);}
 return g;}
function rimGeo(style,Rr,w,lo){const L=[];const face=w/2-.02,S=lo?.55:1,sg=n=>Math.max(8,Math.round(n*S));
 L.push([new THREE.CylinderGeometry(Rr,Rr,w*.9,sg(28),1,true),M4(0,0,0,0,0,Math.PI/2),C(0x6a6c70)]);// barrel (darker)
 if(!lo)L.push([new THREE.TorusGeometry(Rr-.006,.016,6,32),M4(face,0,0,0,Math.PI/2,0),C(0xffffff)]);// polished lip
 L.push([new THREE.CylinderGeometry(Rr+.005,Rr-.004,.02,sg(32),1,true),M4(face+.004,0,0,0,0,Math.PI/2),C(0xeeeeee)]);
 L.push([new THREE.CylinderGeometry(.06,.066,.05,14),M4(face-.03,0,0,0,0,Math.PI/2)]);
 L.push([new THREE.CylinderGeometry(.034,.04,.02,12),M4(face-.002,0,0,0,0,Math.PI/2),C(0x202022)]);// centre cap
 if(!lo)for(let i=0;i<5;i++){const a=i/5*Math.PI*2;L.push([new THREE.CylinderGeometry(.011,.013,.03,6),M4(face-.01,Math.cos(a)*.085,Math.sin(a)*.085,0,0,Math.PI/2),C(0xdddddd)]);}// lug nuts
 if(style===0){for(let i=0;i<16;i++){const a=i/16*Math.PI*2;L.push([new THREE.BoxGeometry(.012,Rr*1.02,.018),M4(face-.03,Math.cos(a)*Rr*.5,Math.sin(a)*Rr*.5,a+.35,0,0)]);L.push([new THREE.BoxGeometry(.012,Rr*1.02,.018),M4(face-.03,Math.cos(a)*Rr*.5,Math.sin(a)*Rr*.5,a-.35,0,0)]);}}
 else if(style===1){for(let i=0;i<6;i++){const a=i/6*Math.PI*2;// tapered, dished spokes: two boxes per spoke (inner thick, outer slim, angled to the lip)
   L.push([new THREE.BoxGeometry(.04,Rr*.5,.075),M4(face-.045,Math.cos(a)*Rr*.33,Math.sin(a)*Rr*.33,a+Math.PI/2,0,0)]);
   L.push([new THREE.BoxGeometry(.03,Rr*.55,.055),M4(face-.022,Math.cos(a)*Rr*.72,Math.sin(a)*Rr*.72,a+Math.PI/2,0,0,1,1,1)]);}}
 else if(style===2){L.push([new THREE.CylinderGeometry(Rr*.8,Rr*.8,.02,sg(28)),M4(face-.07,0,0,0,0,Math.PI/2)]);L.push([new THREE.CylinderGeometry(Rr,Rr*.82,.07,sg(28),1,true),M4(face-.035,0,0,0,0,Math.PI/2),C(0xf4f4f4)]);
  if(!lo)for(let i=0;i<10;i++){const a=i/10*Math.PI*2;L.push([new THREE.CylinderGeometry(.008,.008,.02,6),M4(face-.005,Math.cos(a)*Rr*.92,Math.sin(a)*Rr*.92,0,0,Math.PI/2),C(0xcccccc)]);}}// split-rim bolts
 else{for(let i=0;i<12;i++){const a=i/12*Math.PI*2;L.push([new THREE.BoxGeometry(.02,Rr*.9,.05),M4(face-.03,Math.cos(a)*Rr*.5,Math.sin(a)*Rr*.5,a,.5,0)]);}L.push([new THREE.CylinderGeometry(Rr*.32,Rr*.32,.03,16),M4(face-.04,0,0,0,0,Math.PI/2)]);}
 return merge(L);}
const tireMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,metalness:0,envMapIntensity:.5});
const discMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.38,metalness:.85});
const hubMat=new THREE.MeshStandardMaterial({color:0x18181a,roughness:.7,metalness:.4});
let _tg=null,_dg=null,_hg=null;
export function makeWheel(R,w,style,rimMat,caliperMat,right){const piv=new THREE.Group(),inner=new THREE.Group(),spin=new THREE.Group();
 piv.add(inner);inner.add(spin);if(right)inner.rotation.y=Math.PI;
 if(!tireMat.map){const t=tyreTex();tireMat.map=t.map;tireMat.bumpMap=t.bump;tireMat.bumpScale=1.2;discMat.map=discTex();}
 // full-detail tyre and rim for MEDIUM+, a light pair for LOW (qVis shows one or the other: same draw count)
 const t=new THREE.Mesh(tireGeo(R,w),tireMat);t.castShadow=true;t.userData.minQ=1;spin.add(t);
 const r=new THREE.Mesh(rimGeo(style,R*.66,w),rimMat);r.userData.minQ=1;spin.add(r);
 const tl=new THREE.Mesh(tireGeo(R,w,true),tireMat);tl.userData.maxQ=0;tl.visible=false;spin.add(tl);
 const rl=new THREE.Mesh(rimGeo(style,R*.66,w,true),rimMat);rl.userData.maxQ=0;rl.visible=false;spin.add(rl);
 const dg=new THREE.CylinderGeometry(R*.53,R*.53,.026,20);const d=new THREE.Mesh(dg,discMat);d.rotation.z=Math.PI/2;d.position.x=w/2-.14;spin.add(d);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(R*.62,R*.62,.02,20),hubMat);hub.rotation.z=Math.PI/2;hub.position.x=-w/2+.06;hub.userData.minQ=1;inner.add(hub);// dark backplate so the rim never shows sky through it
 const cg=new THREE.TorusGeometry(R*.47,.042,6,10,1.15);cg.scale(1,1,1);const cal=new THREE.Mesh(cg,caliperMat);cal.rotation.y=Math.PI/2;cal.rotation.x=2.05;cal.scale.set(1,1,1.5);cal.position.set(w/2-.115,0,0);cal.userData.minQ=1;inner.add(cal);
 return{piv,spin,right,rim:r,rimLo:rl};}

/* ---------- full car ---------- */
const glassMat=new THREE.MeshPhysicalMaterial({color:0x0b1016,metalness:.1,roughness:.03,clearcoat:1,envMapIntensity:1.7,transparent:true,opacity:.66,depthWrite:false});
const trimMat=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.62,metalness:.15});
const chromeMat=new THREE.MeshStandardMaterial({color:0xd8dadf,roughness:.16,metalness:1});
const intMat=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.78,metalness:.05,envMapIntensity:.4});
const BLACK=C(0x0d0d0f),SATIN=C(0x1c1d20),RUB=C(0x08080a);
export function makeCar(spec,look,num){const sh=SHAPES[spec.shape],F=bodyFn(spec,sh),g=new THREE.Group(),body=new THREE.Group();g.add(body);
 const[c0,c1,c2,c3]=sh.cab,zc=t=>F.zR+F.len*t;
 // seams for the paint shader: door front line just behind the front wheel, rear door line, bonnet and boot seams
 const zDoorF=Math.min(zc(c3)+.02,F.a-.5),zDoorR=sh.doors===4?zc((c1+c2)/2)-.05:-99,zHood=zc(c3)+.05,zBoot=Math.max(zc(c0)-.04,-F.b+.2);
 const midS=F.sec(zc((c1+c2)/2));
 const paint=paintMaterial(look,num,{z:[zDoorF,zDoorR,zHood,zBoot],y:[sh.clear+.2,midS.ys,F.sec(zHood+.3).w*.72,F.sec(zBoot-.2).w*.7]});
 const N=72,zs=[];for(let i=0;i<=N;i++){const t=i/N;zs.push(F.zR+F.len*(.5-Math.cos(t*Math.PI)*.5));}
 const bodyM=new THREE.Mesh(loft(zs,z=>ring(F.sec(z))),paint);bodyM.castShadow=true;bodyM.userData.minQ=1;body.add(bodyM);
 const zl=[];for(let i=0;i<=34;i++){const t=i/34;zl.push(F.zR+F.len*(.5-Math.cos(t*Math.PI)*.5));}
 const bodyLo=new THREE.Mesh(loft(zl,z=>ring(F.sec(z))),paint);bodyLo.userData.maxQ=0;bodyLo.visible=false;body.add(bodyLo);// LOW body: same paint, fewer rows
 // cabin (glass) + roof panel (paint)
 const cz=[];for(let i=0;i<=24;i++)cz.push(zc(c0+(c3-c0)*i/24));
 const cabTop=z=>{const t=F.t(z);const base=F.sec(z).yt;if(t<c1)return base+(sh.roof-base)*smooth(c0,c1,t)**.7;if(t>c2)return base+(sh.roof-base)*smooth(c3,c2,t)**.8;return sh.roof;};
 const cabRing=(z,inset=0)=>{const s=F.sec(z),yb=s.yt-.03,yt=cabTop(z)+inset,wb=s.w*sh.cw,tw=wb*.74;const h=[[wb,yb],[wb*.96,yb+(yt-yb)*.45],[tw*1.02,yt-.05],[tw*.82,yt-.01],[tw*.4,yt+.005]];return[[0,yb],...h,[0,yt+.01],...h.slice().reverse().map(([x,y])=>[-x,y])];};
 // greenhouse: one tinted-glass loft; the shader paints the roof skin, A/B/C pillars and roof rails in body colour
 // (picked out by the loft's own normals), with a black ceramic frit border and a sun strip across the windscreen
 const zb=zc((c1+c2)/2)+(sh.doors===4?-.05:-.3);
 const gm=glassMat.clone();gm.depthWrite=true;gm.userData.U={uBand:{value:new THREE.Color(look.liv)},uPaint:{value:new THREE.Color(look.paint)},uBz:{value:new THREE.Vector4(zc(c2)+.02,sh.roof-.11,zb,sh.roof-.03)},uRoofZ:{value:new THREE.Vector2(zc(c1)-.02,zc(c2)+.02)}};
 gm.onBeforeCompile=s=>{Object.assign(s.uniforms,gm.userData.U);s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;varying vec3 vON;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=position;vON=normal;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;varying vec3 vON;uniform vec3 uBand,uPaint;uniform vec4 uBz;uniform vec2 uRoofZ;float gOpq=0.;').replace('#include <color_fragment>',`#include <color_fragment>
  {vec3 n=normalize(vON);float ax=abs(n.x);
   float pil=smoothstep(.3,.36,ax)*(1.-smoothstep(.78,.84,ax));
   float roof=step(uRoofZ.x,vOP.z)*step(vOP.z,uRoofZ.y)*step(uBz.w,vOP.y);
   float bp=step(abs(vOP.z-uBz.z),.05)*step(.6,ax);
   float opq=max(max(pil,roof),bp);
   float frit=(smoothstep(.2,.3,ax)*(1.-smoothstep(.3,.36,ax))+smoothstep(.78,.84,ax)*(1.-smoothstep(.84,.9,ax)))*(1.-roof);
   float bnd=step(uBz.x,vOP.z)*step(uBz.y,vOP.y)*(1.-opq);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.01),frit);diffuseColor.a=mix(diffuseColor.a,1.,max(frit,bnd));
   diffuseColor.rgb=mix(diffuseColor.rgb,uBand*.8,bnd);
   diffuseColor.rgb=mix(diffuseColor.rgb,uPaint,opq);diffuseColor.a=mix(diffuseColor.a,1.,opq);gOpq=opq;}`)
  .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,.55,gOpq);roughnessFactor=mix(roughnessFactor,.3,gOpq);');};
 gm.customProgramCacheKey=()=>'glass3';
 const cab=new THREE.Mesh(loft(cz,z=>cabRing(z)),gm);cab.renderOrder=3;cab.castShadow=true;body.add(cab);
 // painted extras: mirror shells
 const pil=[];for(const side of[-1,1]){const mz=zc(c3)-.1,ms=F.sec(mz);const shell=new THREE.SphereGeometry(.09,12,8);shell.scale(.75,.62,1.05);pil.push([shell,M4(side*(ms.w*sh.cw+.12),ms.yt+.1,mz-.02)]);}
 body.add(new THREE.Mesh(merge(pil),paint));
 // trim: bumpers lips, splitter, diffuser, sills, mirror stalks + glass, belt and drip mouldings, door handles, wipers, tow hooks
 const fs=F.sec(F.zF-.12),rs=F.sec(F.zR+.12),T=[];const tr=(geo,m,c=BLACK)=>T.push([geo,m,c]);
 tr(new THREE.BoxGeometry(fs.w*1.84,.035,.3),M4(0,fs.yb-.005,F.zF-.16),SATIN);// splitter
 tr(new THREE.BoxGeometry(fs.w*1.1,.1,.05),M4(0,fs.yb+.07,F.zF-.02));// lower intake
 tr(new THREE.BoxGeometry(rs.w*1.6,.06,.4),M4(0,rs.yb+.01,F.zR+.2),SATIN);// diffuser floor
 for(let i=-3;i<=3;i++)tr(new THREE.BoxGeometry(.012,.09,.36),M4(i*rs.w*.2,rs.yb+.05,F.zR+.2));// diffuser fins
 for(const s of[-1,1]){const mz=zc(c3)-.1,ms=F.sec(mz);tr(new THREE.BoxGeometry(.1,.025,.05),M4(s*(ms.w*sh.cw+.05),ms.yt+.07,mz));
  tr(new THREE.BoxGeometry(.012,.09,.15),M4(s*(ms.w*sh.cw+.205),ms.yt+.1,mz-.02),C(0x5a6068));// mirror glass
  const sz=(F.a-F.b)/2,sl=spec.wb*.62;tr(new THREE.BoxGeometry(.06,.06,sl),M4(s*(F.sec(sz).w*.97),sh.clear+.08,sz),SATIN);// side skirt
  // belt moulding + drip rail along the glass
  const belt=[],drip=[];for(let i=0;i<=10;i++){const z=zc(c0+.02+(c3-c0-.04)*i/10),se=F.sec(z);belt.push([s*(se.w*sh.cw+.004),se.yt-.02,z]);}
  for(let i=0;i<=8;i++){const z=zc(c1+(c2-c1)*i/8),se=F.sec(z),tw=se.w*sh.cw*.74;drip.push([s*tw*1.0,sh.roof-.045,z]);}
  tr(tube(belt,.011,16,4),null,RUB);
  const hz=zDoorF-.42,hs=F.sec(hz);tr(new THREE.BoxGeometry(.02,.025,.12),M4(s*(hs.w*.99+.008),hs.ys-.06,hz),C(0x2a2b2e));// door handle
 }
 const cowl=F.sec(zc(c3)+.02);for(const s of[-1,1])tr(new THREE.BoxGeometry(.5,.012,.02),M4(s*.22,cowl.yt+.03,zc(c3)-.02,-.5,s*.25,0),RUB);// wipers
 tr(new THREE.TorusGeometry(.04,.012,5,10),M4(fs.w*.6,fs.yb+.04,F.zF-.02,0,Math.PI/2,0),C(0xd01818));tr(new THREE.TorusGeometry(.04,.012,5,10),M4(-rs.w*.5,rs.yb+.04,F.zR+.01,0,Math.PI/2,0),C(0xd01818));// tow hooks
 tr(new THREE.CylinderGeometry(.006,.003,.5,4),M4(-midS.w*.6,sh.roof+.2,zc(c1)-.1,-.2,0,0),RUB);// antenna
 const trim=new THREE.Mesh(merge(T),trimMat);trim.castShadow=true;body.add(trim);
 // grille + plates
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(fs.w*1.05,.14),new THREE.MeshStandardMaterial({color:0x0a0a0b,map:grilleTex(),alphaMap:grilleTex(),alphaTest:.4,roughness:.5,metalness:.4,side:THREE.DoubleSide}));
 gr.material.map=null;gr.position.set(0,fs.yb+.2,F.zF+.004);gr.userData.minQ=1;body.add(gr);
 const grBack=new THREE.Mesh(new THREE.PlaneGeometry(fs.w*1.05,.14),new THREE.MeshBasicMaterial({color:0x020202}));grBack.position.set(0,fs.yb+.2,F.zF-.02);grBack.userData.minQ=1;body.add(grBack);
 const pm=new THREE.MeshStandardMaterial({map:plateTex(),roughness:.45,metalness:.3});const plG=new THREE.PlaneGeometry(.5,.125);
 const pg=merge([[plG,M4(fs.w*.0,fs.yb+.07,F.zF+.035)],[plG,M4(0,rs.ys-.17,F.zR-.012,0,Math.PI,0)]]);pg.deleteAttribute('color');const plm=new THREE.Mesh(pg,pm);plm.userData.minQ=1;body.add(plm);
 // exhaust: polished tip with a sooty inside
 const exP=new V(-rs.w*.55,rs.yb+.08,F.zR+.03);
 const ex=new THREE.Mesh(merge([[new THREE.CylinderGeometry(.05,.052,.2,16,1,true),M4(exP.x,exP.y,exP.z,Math.PI/2,0,0),C(0xffffff)],[new THREE.CircleGeometry(.048,16),M4(exP.x,exP.y,exP.z+.04,0,Math.PI,0),C(0x050505)],[new THREE.TorusGeometry(.05,.006,6,16),M4(exP.x,exP.y,exP.z-.1),C(0xffffff)]]),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.2,metalness:1,side:THREE.DoubleSide}));body.add(ex);
 // wing / spoiler
 if(sh.wing!=='none'){const W=[];const t=F.sec(F.zR+.25);
  if(sh.wing==='duck')W.push([new THREE.BoxGeometry(t.w*1.8,.04,.22),M4(0,t.yt+.04,F.zR+.16,-.35,0,0)]);
  else{const hgt=sh.wing==='tall'?.42:.3;for(const s of[-1,1])W.push([new THREE.BoxGeometry(.035,hgt,.14),M4(s*.42,t.yt+hgt/2,F.zR+.32,0,0,0)]);
   // aerofoil: an extruded cambered section
   const af=new THREE.Shape();af.moveTo(-.17,0);af.quadraticCurveTo(-.02,.055,.17,.012);af.lineTo(.17,-.004);af.quadraticCurveTo(-.02,.02,-.17,-.012);af.closePath();
   const ag=new THREE.ExtrudeGeometry(af,{depth:t.w*2.05,bevelEnabled:false,curveSegments:6});ag.translate(0,0,-t.w*1.025);ag.rotateY(Math.PI/2);W.push([ag,M4(0,t.yt+hgt+.02,F.zR+.24,0,0,0)]);
   for(const s of[-1,1])W.push([new THREE.BoxGeometry(.012,.17,.42),M4(s*t.w*1.03,t.yt+hgt+.01,F.zR+.24)]);}
  const wm=new THREE.Mesh(merge(W),sh.wing==='duck'?paint:new THREE.MeshPhysicalMaterial({color:0x111214,roughness:.35,metalness:.3,clearcoat:1}));wm.castShadow=true;body.add(wm);}
 // interior: dash, bucket seats, cage, wheel and a helmeted driver (seen through the tint)
 {const I=[],zm=zc((c1+c2)/2),drv=-midS.w*sh.cw*.42,seatZ=zm-.08,floor=sh.clear+.16,belt=midS.yt;const it=(geo,m,c)=>I.push([geo,m,c]);
  const dashZ=zc(c3)-.18,ds=F.sec(dashZ);it(new THREE.BoxGeometry(ds.w*sh.cw*1.8,.12,.3),M4(0,belt-.02,dashZ),C(0x141416));
  for(const x of[drv,-drv]){it(new THREE.BoxGeometry(.4,.1,.42),M4(x,floor+.12,seatZ+.05),C(0x18181a));const back=new THREE.BoxGeometry(.42,.62,.1);it(back,M4(x,floor+.45,seatZ-.17,-.18,0,0),C(0x8a1414));
   it(new THREE.BoxGeometry(.06,.5,.14),M4(x+.2,floor+.42,seatZ-.13,-.18,0,0),C(0x111113));it(new THREE.BoxGeometry(.06,.5,.14),M4(x-.2,floor+.42,seatZ-.13,-.18,0,0),C(0x111113));}
  // steering wheel + column
  it(new THREE.TorusGeometry(.16,.018,6,18),M4(drv,belt+.06,dashZ-.22,-.45,0,0),C(0x111111));it(new THREE.CylinderGeometry(.02,.02,.3,6),M4(drv,belt,dashZ-.12,1.1,0,0),C(0x222222));
  // cage: main hoop, door bars, A-pillar bars, harness bar
  const cw=midS.w*sh.cw*.86,hz=seatZ-.38,ry=sh.roof-.07,cc=C(0x3a3d42),ccol=look.paint==='#111114'?C(0xc21a2a):C(0xd8dadf);
  it(tube([[cw,floor,hz],[cw*.97,belt+.12,hz],[cw*.72,ry,hz],[-cw*.72,ry,hz],[-cw*.97,belt+.12,hz],[-cw,floor,hz]],.022,22,6),null,ccol);
  for(const s of[-1,1]){it(tube([[s*cw*.72,ry,hz],[s*cw*.7,ry-.01,zm+.2],[s*cw*.9,belt+.05,dashZ+.05],[s*cw*.95,floor+.05,dashZ+.12]],.02,14,6),null,ccol);
   it(tube([[s*cw*.98,floor+.1,hz],[s*cw*1.0,belt-.08,zm+.1],[s*cw*.96,floor+.12,dashZ]],.018,10,5),null,ccol);}
  it(tube([[cw*.8,belt+.02,hz],[-cw*.8,belt+.02,hz]],.018,4,5),null,ccol);
  // driver: suit, arms to the wheel, helmet with a dark visor
  const suit=C(0x1a2230),glove=C(0x111111);
  it(new THREE.CapsuleGeometry(.15,.3,4,8),M4(drv,floor+.5,seatZ-.06,-.18,0,0),suit);it(new THREE.SphereGeometry(.14,10,8),M4(drv,floor+.27,seatZ+.12,0,0,0,1.1,.7,1.3),suit);
  for(const s of[-1,1]){it(new THREE.CapsuleGeometry(.045,.32,3,6),M4(drv+s*.15,belt+.04,seatZ+.12,-1.1,0,s*.18),suit);it(new THREE.SphereGeometry(.04,6,5),M4(drv+s*.13,belt+.1,dashZ-.24),glove);}
  const hy=Math.min(sh.roof-.19,floor+.88);it(new THREE.SphereGeometry(.13,14,10),M4(drv,hy,seatZ-.05,0,0,0,1,1.05,1.1),C(look.liv==='#111114'?0xf2f2f2:look.liv));
  it(new THREE.SphereGeometry(.132,12,8,Math.PI/2-1.1,2.2,1.15,.65),M4(drv,hy,seatZ-.05),C(0x050608));
  const im=new THREE.Mesh(merge(I),intMat);body.add(im);im.userData.interior=true;im.userData.minQ=1;}
 // lights (emissive with projector/lens maps; intensities driven by the game)
 const head=new THREE.MeshStandardMaterial({color:0x111111,emissive:0xfff2d8,emissiveMap:lampTex('head'),emissiveIntensity:3,roughness:.12,metalness:.3});
 const tail=new THREE.MeshStandardMaterial({color:0x200000,emissive:0xff2a14,emissiveMap:lampTex('tail'),emissiveIntensity:1.6,roughness:.2});
 const H=[],Tl=[];const hz=F.zF-.06,hs=F.sec(hz-.1);
 for(const s of[-1,1]){if(sh.lights==='square')H.push([new THREE.BoxGeometry(.3,.11,.05),M4(s*hs.w*.62,hs.yt-.1,hz-.02)]);
  else if(sh.lights==='quad'){H.push([new THREE.CylinderGeometry(.065,.065,.05,16),M4(s*hs.w*.46,hs.yt-.12,hz-.02,Math.PI/2,0,0)]);H.push([new THREE.CylinderGeometry(.065,.065,.05,16),M4(s*hs.w*.74,hs.yt-.12,hz-.03,Math.PI/2,0,0)]);}
  else H.push([new THREE.BoxGeometry(.34,.06,.12),M4(s*hs.w*.62,hs.yt-.06,hz-.07,-.35,s*.12,0)]);
  const ts=F.sec(F.zR+.06);Tl.push([new THREE.BoxGeometry(sh.lights==='slim'?.5:.34,sh.lights==='slim'?.055:.11,.04),M4(s*ts.w*.6,ts.ys+.02,F.zR+.01)]);}
 if(spec.shape==='wraith'||spec.shape==='tempest'){const ts=F.sec(F.zR+.06);Tl.push([new THREE.BoxGeometry(ts.w*1.0,.025,.03),M4(0,ts.ys+.02,F.zR)]);}
 const hm=new THREE.Mesh(merge(H),head),tm=new THREE.Mesh(merge(Tl),tail);body.add(hm,tm);
 // wheels
 const rimMat=new THREE.MeshStandardMaterial({color:look.rims,vertexColors:true,metalness:.85,roughness:.26,envMapIntensity:1.25});
 const calMat=new THREE.MeshPhysicalMaterial({color:0xd01818,roughness:.35,metalness:.3,clearcoat:1});
 const tw=spec.tw/2+sh.flare*.6,tirew=spec.shape==='sparrow'?.2:sh.flare>.05?.27:.235,R=.32,wheels=[];
 for(const[z,front]of[[F.a,1],[-F.b,0]])for(const s of[1,-1]){const wh=makeWheel(R,tirew,look.rim|0,rimMat,calMat,s<0);wh.piv.position.set(s*tw,R,z);wh.front=!!front;wh.base=R;g.add(wh.piv);wheels.push(wh);}
 // ground contact shadow blob
 const blob=new THREE.Mesh(new THREE.PlaneGeometry(F.sec(0).w*2.6,F.len*1.1),new THREE.MeshBasicMaterial({map:blobTex(),transparent:true,depthWrite:false,opacity:.82,color:0x000000}));
 blob.rotation.x=-Math.PI/2;blob.position.y=.03;g.add(blob);
 g.userData={body,paint,rimMat,wheels,head,tail,exhaust:exP,zF:F.zF,zR:F.zR,len:F.len,halfW:F.sec(0).w,bodyM,tw,R,spec,blob,glass:gm,
  frontLamp:new V(0,hs.yt-.1,hz),rearLamp:new V(0,F.sec(F.zR+.06).ys,F.zR)};
 return g;}
let _blob=null;function blobTex(){if(_blob)return _blob;_blob=ctex(64,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.6,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.save();x.scale(1,2);x.fillStyle=g;x.fillRect(0,0,w,h/2);x.restore();},{clamp:true,srgb:false});return _blob;}
export function setLook(car,look){const u=car.userData;u.paint.color.set(look.paint);u.paint.userData.U.uLiv.value=look.livery|0;u.paint.userData.U.uLivCol.value.set(look.liv);u.rimMat.color.set(look.rims);if(u.glass){u.glass.userData.U.uBand.value.set(look.liv);u.glass.userData.U.uPaint.value.set(look.paint);}}
export function disposeCar(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
