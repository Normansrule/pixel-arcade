// ABYSS DIVER — the sea floor: biomes, terrain, flora, landmarks and gatherable resources.
import * as THREE from '../vendor/three.module.min.js';
import {cl,lerp,sm,mulberry,n2,n3,merge,paint,displace,smoothNormals,xf,canvasTex,normalTex,fbmField,mergeByMaterial} from './util.js';
import {wmat,caster} from './water.js';
import {panelTex} from './gear.js';

export const WORLD=300;
/* ---------- biome weights ---------- */
const reefW=(x,z,r)=>sm(0,30,x)*sm(0,30,-z)*(1-sm(115,165,r));
const kelpW=(x,z,r)=>sm(-30,-75,x)*sm(-120,-70,z)*(1-sm(200,240,r));
const plateauW=(x,z)=>sm(70,135,z+n2(x*.01,5)*24);
const pitW=(x,z)=>1-sm(28,82,Math.hypot(x+125,z+140)+n2(x*.03,z*.03)*12);
const abyssW=(x,z)=>sm(110,185,x+34*n2(z*.007,11));
export function weights(x,z){const r=Math.hypot(x,z);return{reef:reefW(x,z,r),kelp:kelpW(x,z,r),plat:plateauW(x,z),pit:pitW(x,z),abyss:abyssW(x,z),r};}
export function heightAt(x,z){const r=Math.hypot(x,z);
 let h=-15+sm(0,16,r)*0-sm(25,150,r)*22;h+=n2(x*.018,z*.018)*4.5+n2(x*.055,z*.055)*1.5+n2(x*.19,z*.19)*.35;
 const rf=reefW(x,z,r);h+=rf*(Math.max(0,n2(x*.04+7,z*.04))*10-2.5);
 h-=kelpW(x,z,r)*13;
 const pl=plateauW(x,z);h-=pl*52;h+=pl*Math.abs(n2(x*.03,z*.03+4))*9;
 const pt=pitW(x,z);h-=Math.pow(pt,1.4)*150;
 const ab=abyssW(x,z);if(ab>0){const floor=-392+n2(x*.02,z*.02)*16+Math.max(0,n2(x*.05+3,z*.05))*18;h=lerp(h,floor,Math.pow(ab,1.25));h+=ab*(1-ab)*n2(x*.09,z*.09)*22;}
 const rim=sm(250,296,Math.max(Math.abs(x),Math.abs(z)));h=Math.min(h,lerp(h,-330,rim));
 return Math.min(h,-5);}
export function region(x,z,d){const w=weights(x,z);if(w.abyss>.55)return d>300?'EMBERDEEP':'THE DROP';if(w.abyss>.2)return 'THE DROP';if(w.pit>.35)return 'LUMEN HOLLOW';if(w.plat>.5)return 'RED SPIRE PLATEAU';if(w.kelp>.5)return 'KELP CATHEDRAL';if(w.reef>.45)return 'CORAL GARDENS';if(w.r>240)return 'VOID EDGE';return 'SUNLIT SHOALS';}
export const WRECK=new THREE.Vector3(-58,0,60);export const RIBS=new THREE.Vector3(218,0,36);

/* ---------- textures ---------- */
function makeTextures(){
 // sand: wind-less current ripples (domain-warped, so they bend and fork) over grainy fbm; 512 albedo + normals
 const SN=512;const sandH=fbmField(SN,SN,3,3,(v,i,j)=>{const x=i/SN,y=j/SN;const warp=v*1.6;const r=Math.sin((x*6+y*1)*Math.PI*2+warp*2.2);const rip=Math.pow(1-Math.abs(r),1.6);return rip*.55+v*.35;});
 const R0=mulberry(91);
 const sand=canvasTex(SN,SN,(x,w,h)=>{const im=x.createImageData(w,h);for(let k=0;k<w*h;k++){const g=R0();const v=.8+sandH[k]*.14+(g-.5)*.12;const dark=g<.035?.55:g>.985?1.18:1;
   im.data[k*4]=255*cl(v*1.03*dark,0,1);im.data[k*4+1]=255*cl(v*.97*dark,0,1);im.data[k*4+2]=255*cl(v*.86*dark,0,1);im.data[k*4+3]=255;}x.putImageData(im,0,0);
  // scattered shell grit and darker pebbles
  for(let i=0;i<420;i++){const px=R0()*w,py=R0()*h,r=.6+R0()*1.8;x.fillStyle=R0()<.6?`rgba(255,248,232,${.25+R0()*.4})`:`rgba(70,60,52,${.2+R0()*.35})`;x.beginPath();x.ellipse(px,py,r,r*(.5+R0()*.5),R0()*3,0,6.3);x.fill();}});
 const sandN=normalTex(SN,SN,sandH,5);sandN.repeat.set(90,90);
 // rock: ridged fbm with cracks; .r carries brightness and doubles as a bump height
 const RN=256;const rockH=fbmField(RN,RN,5,9,(v)=>Math.abs(v));const crackH=fbmField(RN,RN,3,17,(v)=>Math.pow(cl(1-Math.abs(v)*7,0,1),3));
 const rock=canvasTex(RN,RN,(x,w,h)=>{const im=x.createImageData(w,h);for(let k=0;k<w*h;k++){const v=.56+rockH[k]*.62-crackH[k]*.32+(Math.random()-.5)*.07;im.data[k*4]=255*cl(v,0,1);im.data[k*4+1]=255*cl(v*.97,0,1);im.data[k*4+2]=255*cl(v*.94,0,1);im.data[k*4+3]=255;}x.putImageData(im,0,0);});
 const veinH=fbmField(128,128,3,21,(v)=>Math.pow(1-Math.abs(v)*2.2,9));
 const vein=canvasTex(128,128,(x,w,h)=>{const im=x.createImageData(w,h);for(let k=0;k<w*h;k++){const v=cl(veinH[k],0,1);im.data[k*4]=im.data[k*4+1]=im.data[k*4+2]=255*v;im.data[k*4+3]=255;}x.putImageData(im,0,0);},{srgb:false});
 const fan=canvasTex(256,256,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#fff';x.lineCap='round';const R=mulberry(7);
  const br=(px,py,a,l,wd,d)=>{const ex=px+Math.cos(a)*l,ey=py-Math.sin(a)*l;x.lineWidth=wd;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo((px+ex)/2+(R()-.5)*l*.3,(py+ey)/2,ex,ey);x.stroke();if(d>0){br(ex,ey,a+.3+R()*.2,l*.8,wd*.72,d-1);br(ex,ey,a-.3-R()*.2,l*.8,wd*.72,d-1);}};
  for(let i=0;i<6;i++)br(128,252,Math.PI/2+(i-2.5)*.33,62,7,6);x.lineWidth=1.1;for(let i=0;i<900;i++){x.globalAlpha=.75;x.beginPath();const a=R()*Math.PI,r=30+R()*92;x.moveTo(128+Math.cos(a)*r,252-Math.sin(a)*r);x.lineTo(128+Math.cos(a+.05)*(r+9),252-Math.sin(a+.05)*(r+9));x.stroke();}x.globalAlpha=1;},{rep:1});
 return{sand,sandN,rock,vein,fan};}

/* ---------- geometry builders ---------- */
function rockGeo(seed,det=3){const g=new THREE.IcosahedronGeometry(1,det);displace(g,.3,1.1,seed);xf(g,{s:[1,.68,1]});smoothNormals(g);
 return paint(g,(c,x,y,z,nx,ny)=>{const a=n3(x*2+seed,y*2,z*2);const moss=sm(.35,.75,ny+a*.25);c.setRGB(.52+a*.06,.5+a*.05,.5+a*.04).lerp(new THREE.Color(.42,.5,.3),moss*.7);});}
function kelpGeo(H){const parts=[];const stalk=new THREE.CylinderGeometry(.06,.12,H,4,14);stalk.translate(0,H/2,0);paint(stalk,(c,x,y)=>c.setRGB(.36,.34,.14).lerp(new THREE.Color(.62,.55,.2),y/H));parts.push(stalk);
 const R=mulberry(H*13|0);const nl=13;for(let i=0;i<nl;i++){const y=1.2+i*(H-1.5)/nl,a=i*2.39+R();const L=1.4+R()*1.2;const leaf=new THREE.PlaneGeometry(.42,L,1,4);leaf.translate(0,L/2,0);
  const p=leaf.attributes.position;for(let k=0;k<p.count;k++){const ly=p.getY(k);p.setZ(k,Math.pow(ly/L,2)*.6);p.setX(k,p.getX(k)*(1-Math.pow(ly/L,3)*.7));}leaf.computeVertexNormals();
  xf(leaf,{r:[0,0,-.75-R()*.4]});xf(leaf,{r:[0,a,0],p:[0,y,0]});paint(leaf,(c,x,yy)=>c.setRGB(.55,.52,.16).lerp(new THREE.Color(.82,.72,.28),cl((yy-y)/1.6,0,1)));parts.push(leaf);
  if(i%2===0){const b=new THREE.SphereGeometry(.14,5,3);xf(b,{p:[Math.cos(a)*.18,y+.05,-Math.sin(a)*.18],s:[1,1.3,1]});paint(b,0xc8a040);parts.push(b);}}
 const top=new THREE.SphereGeometry(.22,6,5);xf(top,{p:[0,H+.1,0],s:[1,1.5,1]});paint(top,0xe0b850);parts.push(top);return merge(parts);}
function grassGeo(){const parts=[];const R=mulberry(3);for(let i=0;i<6;i++){const h=.5+R()*.9;const b=new THREE.PlaneGeometry(.08,h,1,2);b.translate(0,h/2,0);const p=b.attributes.position;for(let k=0;k<p.count;k++){const t=p.getY(k)/h;p.setX(k,p.getX(k)*(1-t*.85));p.setZ(k,t*t*.25);}b.computeVertexNormals();
  xf(b,{r:[0,R()*6.3,0],p:[(R()-.5)*.6,0,(R()-.5)*.6]});paint(b,(c,x,y)=>c.setRGB(.3,.35,.25).lerp(new THREE.Color(1,1,.9),cl(y/h,0,1)));parts.push(b);}return merge(parts);}
function staghornGeo(seed){const R=mulberry(seed);const parts=[];const v=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const br=(p,d,len,rad,depth)=>{const g=new THREE.CylinderGeometry(rad*.7,rad,len,5,1);g.translate(0,len/2,0);const q=new THREE.Quaternion().setFromUnitVectors(up,d);g.applyQuaternion(q);g.translate(p.x,p.y,p.z);const tip=depth===0;paint(g,(c,x,y)=>c.setRGB(.7,.7,.7).lerp(new THREE.Color(1,1,1),tip?.8:.2));parts.push(g);
  const e=p.clone().addScaledVector(d,len);if(depth>0){const k=2+(R()<.4?1:0);for(let i=0;i<k;i++){const nd=d.clone().add(v.set(R()-.5,R()*.3,R()-.5).multiplyScalar(1.3)).normalize();if(nd.y<.15)nd.y=.15;nd.normalize();br(e,nd,len*(.65+R()*.2),rad*.7,depth-1);}}
  else{const s=new THREE.SphereGeometry(rad*.75,4,3);s.translate(e.x,e.y,e.z);paint(s,0xffffff);parts.push(s);}};
 for(let i=0;i<3;i++)br(new THREE.Vector3((R()-.5)*.3,0,(R()-.5)*.3),new THREE.Vector3(R()-.5,1.4,R()-.5).normalize(),.55,.1,3);return merge(parts);}
function brainGeo(){const g=new THREE.SphereGeometry(1,30,16);const p=g.attributes.position;const v=new THREE.Vector3();const ridge=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const r=Math.abs(Math.sin(n3(v.x*1.6,v.y*1.6,v.z*1.6)*9));ridge.push(r);v.multiplyScalar(1+r*.1);p.setXYZ(i,v.x,Math.max(v.y,-.15)*.62,v.z);}g.computeVertexNormals();
 const c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const k=.62+ridge[i]*.38;c[i*3]=k;c[i*3+1]=k;c[i*3+2]=k*.95;}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;}
function tableGeo(){const parts=[];const stem=new THREE.CylinderGeometry(.16,.3,1,7);stem.translate(0,.5,0);
 for(const[y,r,o]of[[1.05,1.5,0],[.7,.9,.5]]){const t=new THREE.CylinderGeometry(r,r*.85,.12,26,1);const p=t.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x);p.setY(i,p.getY(i)+Math.sin(a*5)*.06*Math.hypot(x,z)/r);}t.computeVertexNormals();t.translate(o,y,o*.4);paint(t,(c,x,yy,z)=>c.setRGB(.75,.75,.75).lerp(new THREE.Color(1,1,1),Math.hypot(x-o,z-o*.4)/r));parts.push(t);}
 parts.push(paint(stem,0x8c8c8c));return merge(parts);}
function tubesGeo(seed){const R=mulberry(seed);const parts=[];for(let i=0;i<6;i++){const h=.6+R()*1.7,r=.13+R()*.12;const t=new THREE.CylinderGeometry(r,r*.85,h,7,1,true);t.translate((R()-.5)*.8,h/2,(R()-.5)*.8);paint(t,(c,x,y)=>c.setRGB(.5,.5,.5).lerp(new THREE.Color(1,1,1),cl(y/h,0,1)));parts.push(t);
}return merge(parts);}
function anemoneGeo(){const parts=[];const base=new THREE.CylinderGeometry(.32,.42,.4,10);base.translate(0,.2,0);paint(base,0x7a7a7a);parts.push(base);const R=mulberry(5);
 for(let i=0;i<22;i++){const a=R()*6.3,rr=R()*.28,h=.5+R()*.4;const t=new THREE.ConeGeometry(.04,h,3,2);t.translate(0,h/2,0);xf(t,{r:[Math.sin(a)*.6*rr*3,0,Math.cos(a)*.6*rr*3]});t.translate(Math.cos(a)*rr,.38,Math.sin(a)*rr);paint(t,(c,x,y)=>c.setRGB(.6,.6,.6).lerp(new THREE.Color(1,1,1),cl((y-.4)/.6,0,1)));parts.push(t);}return merge(parts);}
function spireGeo(seed){const g=new THREE.CylinderGeometry(.55,1,1,11,26);g.translate(0,.5,0);const p=g.attributes.position;const v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=1+n3(v.x*2+seed,v.y*6,v.z*2)*.28+Math.sin(v.y*30+seed)*.04;p.setXYZ(i,v.x*k,v.y,v.z*k);}g.computeVertexNormals();
 return paint(g,(c,x,y)=>{const b=Math.sin(y*38+n3(x,y*4,seed)*2)*.5+.5;c.setRGB(.66,.42,.36).lerp(new THREE.Color(.82,.62,.46),b*.6);});}
function archGeo(seed){const g=new THREE.TorusGeometry(1,.24,12,30,Math.PI);displace(g,.18,2.2,seed);return paint(g,(c,x,y)=>{const b=Math.sin(y*14)*.5+.5;c.setRGB(.6,.4,.35).lerp(new THREE.Color(.8,.6,.45),b*.5);});}
function lanternTreeGeo(){const parts=[];const st=new THREE.CylinderGeometry(.07,.16,6,6,8);st.translate(0,3,0);const p=st.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)+Math.sin(y*.6)*.25);}st.computeVertexNormals();paint(st,0x302018);parts.push(st);
 for(let i=0;i<7;i++){const a=i*.9,y=3.2+i*.42;const b=new THREE.SphereGeometry(.2+(i%3)*.05,8,6);xf(b,{p:[Math.cos(a)*.45+Math.sin(y*.6)*.25,y,Math.sin(a)*.45],s:[1,1.4,1]});paint(b,0xffffff);parts.push(b);}return merge(parts);}
function capGeo(){const parts=[];const st=new THREE.CylinderGeometry(.12,.2,1,8,6);st.translate(0,.5,0);const p=st.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)+Math.sin(y*3)*.08);}st.computeVertexNormals();paint(st,0x1c1c24);parts.push(st);
 const cap=new THREE.SphereGeometry(.7,20,8,0,Math.PI*2,0,Math.PI*.5);xf(cap,{p:[.08,1,0],s:[1,.42,1]});paint(cap,(c,x,y,z)=>{const r=Math.hypot(x-.08,z)/.7;const spot=Math.sin(x*19)*Math.sin(z*17)>.7&&r<.8;c.setRGB(.32,.32,.4);if(r>.9||spot)c.setRGB(.95,.95,.95);});parts.push(cap);
 const gill=new THREE.CircleGeometry(.68,24,0,Math.PI*2);gill.rotateX(Math.PI/2);gill.translate(.08,1,0);paint(gill,(c,x,y,z)=>{const a=Math.atan2(z,x-.08);const rr=Math.hypot(x-.08,z)/.68;const k=(Math.sin(a*24)>.2?.7:.45)*(.55+.45*rr);c.setRGB(k,k,k);});parts.push(gill);
 for(let i=0;i<5;i++){const s=new THREE.SphereGeometry(.06,5,4);const a=i*1.26;s.translate(.08+Math.cos(a)*.42,1.2,Math.sin(a)*.42);paint(s,0xffffff);parts.push(s);}return merge(parts);}
function glowTubeGeo(seed){const R=mulberry(seed);const parts=[];for(let i=0;i<7;i++){const h=.4+R()*1.3,r=.04+R()*.05;const t=new THREE.CylinderGeometry(r,r*1.2,h,5);const x=(R()-.5)*.6,z=(R()-.5)*.6;t.translate(x,h/2,z);paint(t,0x202028);parts.push(t);const tip=new THREE.SphereGeometry(r*1.9,6,4);tip.translate(x,h,z);paint(tip,0xffffff);parts.push(tip);}return merge(parts);}
function ventGeo(seed){const g=new THREE.CylinderGeometry(.7,3,7,12,10,true);g.translate(0,3.5,0);displace(g,.22,.7,seed);return paint(g,(c,x,y)=>c.setRGB(.14,.12,.12).lerp(new THREE.Color(1,.5,.2),sm(5.4,6.9,y)));}
function ribGeo(){const parts=[];for(let i=0;i<10;i++){const s=1-Math.abs(i-3.5)/8;const r=new THREE.TorusGeometry(9*s+2,.55*s+.25,7,22,Math.PI*1.15);r.rotateY(Math.PI/2);r.rotateX(.08*i);r.translate(i*5.2-18,-1.2,0);parts.push(r);
  const v=new THREE.SphereGeometry(1.4*s+.6,9,7);xf(v,{p:[i*5.2-18,9*s+2,0],s:[1.3,.9,1]});parts.push(v);}
 const skull=new THREE.SphereGeometry(4.2,16,12);displace(skull,.18,.4,4);xf(skull,{p:[-26,4,0],s:[1.6,.8,1]});parts.push(skull);
 for(let i=0;i<8;i++){const t=new THREE.CylinderGeometry(.4-i*.03,.5-i*.03,4.4,6);xf(t,{p:[34+i*4.2,1.2-i*.3,Math.sin(i*.7)*1.5],r:[0,0,Math.PI/2]});parts.push(t);}
 const g=merge(parts);return paint(g,(c,x,y,z,nx,ny)=>c.setRGB(.78,.74,.64).lerp(new THREE.Color(.45,.48,.42),sm(.3,.9,ny)*.5));}

/* natural rock arch: a noisy tube swept along a lopsided curve, thick at the feet, banded strata and an algae crown */
function arch2Geo(seed,span=1){const R=mulberry(seed);const pts=[];for(let i=0;i<=8;i++){const t=i/8,a=Math.PI*t;pts.push(new THREE.Vector3(-Math.cos(a)*span,Math.sin(a)*.9+(R()-.5)*.08,(R()-.5)*.18+Math.sin(a*2)*.1));}
 pts[0].y=-.35;pts[8].y=-.35;const curve=new THREE.CatmullRomCurve3(pts);const g=new THREE.TubeGeometry(curve,64,1,14,false);g.userData.curve=curve;
 const p=g.attributes.position,v=new THREE.Vector3(),c=new THREE.Vector3();for(let i=0;i<p.count;i++){const ring=Math.floor(i/15),t=ring/64;curve.getPointAt(Math.min(1,t),c);v.fromBufferAttribute(p,i).sub(c);
  const foot=1+Math.pow(Math.abs(t-.5)*2,3)*.9;const r=(.2+.07*foot)*(1+n3(c.x*3+seed,c.y*3+v.y*4,c.z*3+v.x*4)*.38+n3(c.x*9,c.y*9+seed,v.z*9)*.1);v.normalize().multiplyScalar(r);v.y*=1.15;p.setXYZ(i,c.x+v.x,c.y+v.y,c.z+v.z);}
 g.computeVertexNormals();smoothNormals(g);
 return paint(g,(c,x,y,z,nx,ny)=>{const b=Math.sin(y*16+n3(x*2,y*3,z*2)*3)*.5+.5;c.setRGB(.58,.5,.44).lerp(new THREE.Color(.76,.66,.52),b*.55);c.lerp(new THREE.Color(.42,.5,.3),sm(.45,.9,ny)*.6);});}
function barrelGeo(seed){const R=mulberry(seed);const prof=[];for(let i=0;i<=10;i++){const t=i/10;prof.push(new THREE.Vector2(.25+Math.sin(t*2.6)*.55+t*.25,t*1.6));}for(let i=10;i>=0;i--){const t=i/10;prof.push(new THREE.Vector2(.18+Math.sin(t*2.6)*.5+t*.2,.12+t*1.46));}
 const g=new THREE.LatheGeometry(prof,22);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x);const k=1+Math.pow(Math.abs(Math.sin(a*7)),3)*.12;p.setX(i,x*k);p.setZ(i,z*k);}g.computeVertexNormals();
 return paint(g,(c,x,y,z)=>{const a=Math.atan2(z,x);const ridge=Math.pow(Math.abs(Math.sin(a*7)),3);const inner=Math.hypot(x,z)<.18+Math.sin(cl(y/1.6,0,1)*2.6)*.5+cl(y/1.6,0,1)*.2-.02&&y>.2;c.setRGB(.8,.8,.8).lerp(new THREE.Color(1,1,1),ridge*.5);if(inner)c.multiplyScalar(.45);});}
function whipGeo(seed){const R=mulberry(seed);const parts=[];for(let i=0;i<7;i++){const h=1.6+R()*2.2;const t=new THREE.CylinderGeometry(.018,.045,h,4,8);t.translate(0,h/2,0);const p=t.attributes.position;const bx=(R()-.5)*1.2,bz=(R()-.5)*1.2;for(let k=0;k<p.count;k++){const y=p.getY(k)/h;p.setX(k,p.getX(k)+bx*y*y);p.setZ(k,p.getZ(k)+bz*y*y);}t.computeVertexNormals();t.translate((R()-.5)*.3,0,(R()-.5)*.3);paint(t,(c,x,y)=>c.setRGB(.75,.75,.75).lerp(new THREE.Color(1,1,1),cl(y/h,0,1)));parts.push(t);}return merge(parts);}
function pillarGeo(seed){const R=mulberry(seed);const parts=[];for(let i=0;i<9;i++){const h=.6+R()*1.6,r=.1+R()*.08;const t=new THREE.CapsuleGeometry(r,h,3,7);t.translate((R()-.5)*.7,h/2,(R()-.5)*.7);paint(t,(c,x,y)=>c.setRGB(.82,.8,.74).lerp(new THREE.Color(1,1,.96),cl(y/h,0,1)*.6));parts.push(t);}
 const base=new THREE.SphereGeometry(.55,10,6,0,Math.PI*2,0,Math.PI/2);xf(base,{s:[1,.35,1]});paint(base,0x9a968a);parts.push(base);return merge(parts);}
function urchinGeo(){const parts=[];const b=new THREE.SphereGeometry(.16,10,8);xf(b,{s:[1,.75,1],p:[0,.1,0]});paint(b,0x2a1a30);parts.push(b);const R=mulberry(4);
 for(let i=0;i<34;i++){const d=new THREE.Vector3(R()-.5,R()*.9-.15,R()-.5).normalize();const l=.25+R()*.25;const sp=new THREE.ConeGeometry(.012,l,3);sp.translate(0,l/2,0);sp.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d));sp.translate(d.x*.13,.1+d.y*.1,d.z*.13);paint(sp,0x3a2442);parts.push(sp);}return merge(parts);}
function starGeo(){const sh=new THREE.Shape();for(let i=0;i<=10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?.11:.34;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?sh.lineTo(x,y):sh.moveTo(x,y);}
 const g=new THREE.ExtrudeGeometry(sh,{depth:.035,bevelEnabled:true,bevelThickness:.035,bevelSize:.05,bevelSegments:2,curveSegments:2});g.rotateX(-Math.PI/2);g.translate(0,.03,0);
 return paint(g,(c,x,y,z)=>{const r=Math.hypot(x,z);const dot=Math.sin(x*60)*Math.sin(z*60)>.6;c.setRGB(1,1,1).multiplyScalar(.75+y*3);if(dot)c.multiplyScalar(1.25);if(r<.06)c.multiplyScalar(.8);});}
function clamGeo(){const parts=[];for(const s of[-1,1]){const h=new THREE.SphereGeometry(.5,16,8,0,Math.PI,0,Math.PI);const p=h.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const a=Math.atan2(y,z);const k=1+Math.abs(Math.sin(a*5))*.12;p.setXYZ(i,x*k*.55,y*k,z*k);}h.computeVertexNormals();
  xf(h,{r:[0,0,s>0?0:Math.PI],p:[0,.25,0]});xf(h,{r:[0,0,s*.35]});paint(h,(c,x,y,z,nx,ny)=>{c.setRGB(.82,.78,.7);});parts.push(h);}
 const mantle=new THREE.TorusGeometry(.42,.07,6,18,Math.PI);mantle.rotateY(Math.PI/2);mantle.translate(0,.32,0);paint(mantle,(c,x,y,z)=>{c.setRGB(.15,.55,1);if(Math.sin(z*40)>.3)c.setRGB(.3,1,.9);});parts.push(mantle);return merge(parts);}

/* ---------- resource node geometry ---------- */
function outcropGeo(vein,seed){const parts=[];const R=mulberry(seed);for(let i=0;i<3;i++){const g=new THREE.DodecahedronGeometry(.55+R()*.35,1);displace(g,.18,1.4,seed+i);xf(g,{p:[(R()-.5)*.9,.2+R()*.2,(R()-.5)*.9],s:[1,.75,1]});
  paint(g,(c,x,y,z)=>{const v=Math.pow(Math.abs(n3(x*3+seed,y*3,z*3)),.6);c.setRGB(.36,.36,.38).lerp(new THREE.Color(vein),v>.55?1:0);});parts.push(g);}return merge(parts);}
function crystalGeo(seed,n=6,len=1.4){const R=mulberry(seed);const parts=[];for(let i=0;i<n;i++){const l=len*(.5+R()*.7),r=.12+R()*.1;const g=new THREE.CylinderGeometry(0,r,l*.25,6,1);g.translate(0,l*.5+l*.125,0);const b=new THREE.CylinderGeometry(r,r,l*.5,6,1);b.translate(0,l*.25,0);
  const m=merge([g,b]);xf(m,{r:[(R()-.5)*1.1,R()*6,(R()-.5)*1.1]});paint(m,(c,x,y)=>c.setRGB(.7,.7,.7).lerp(new THREE.Color(1,1,1),cl(y/l,0,1)));parts.push(m);}
 const base=new THREE.DodecahedronGeometry(.4,0);xf(base,{s:[1.2,.5,1.2]});paint(base,0x404048);parts.push(base);return merge(parts);}
function gelGeo(){const parts=[];const R=mulberry(11);for(let i=0;i<5;i++){const g=new THREE.SphereGeometry(.22+R()*.18,12,8);g.translate((R()-.5)*.7,.25,(R()-.5)*.7);paint(g,0xffffff);parts.push(g);}const st=new THREE.CylinderGeometry(.05,.12,.4,5);st.translate(0,.2,0);paint(st,0x222);parts.push(st);return merge(parts);}
function bulbGeo(){const parts=[];const st=new THREE.CylinderGeometry(.03,.06,.9,5,3);st.translate(0,.45,0);paint(st,0x3a5a3a);parts.push(st);const b=new THREE.SphereGeometry(.24,14,10);xf(b,{p:[0,1.05,0],s:[1,1.25,1]});paint(b,0xffffff);parts.push(b);
 for(let i=0;i<3;i++){const l=new THREE.PlaneGeometry(.12,.5);l.translate(0,.25,0);xf(l,{r:[0,i*2.1,-.6]});paint(l,0x4a7a3a);parts.push(l);}return merge(parts);}
function scrapGeo(seed){const R=mulberry(seed);const parts=[];for(let i=0;i<3;i++){const g=new THREE.BoxGeometry(.9+R()*.8,.08,.6+R()*.6);xf(g,{p:[(R()-.5)*.6,.1+i*.1,(R()-.5)*.6],r:[(R()-.5)*.6,R()*3,(R()-.5)*.6]});paint(g,i===1?0xc86a30:0xb8bcc4);parts.push(g);}
 const pipe=new THREE.CylinderGeometry(.09,.09,1.2,8);xf(pipe,{r:[0,0,1.4],p:[0,.3,.2]});paint(pipe,0x8a8e96);parts.push(pipe);return merge(parts);}

export const RES={
 titanium:{n:'TITANIUM',label:'METAL OUTCROP',col:0x9fb4c8,d:[4,95],count:46,give:2},
 copper:{n:'COPPER',label:'COPPER OUTCROP',col:0x3fb890,d:[16,150],count:36,give:2},
 quartz:{n:'QUARTZ',label:'QUARTZ CLUSTER',col:0xe8f6ff,d:[8,130],count:36,give:1},
 lithium:{n:'LITHIUM',label:'LITHIUM CRYSTAL',col:0x7aff6a,d:[70,230],count:30,give:1},
 gel:{n:'LUMEN GEL',label:'LUMEN SAC',col:0x46f0ff,d:[100,430],count:34,give:1},
 ember:{n:'EMBERSTONE',label:'EMBERSTONE',col:0xff5a2a,d:[270,440],count:26,give:1},
 scrap:{n:'TITANIUM',label:'HULL SCRAP',col:0xb8bcc4,d:[0,999],count:16,give:2,as:'titanium'},
 bulb:{n:'BRINE BULB',label:'BRINE BULB',col:0x9ae8ff,d:[5,70],count:70,give:1},
};

/* ================= build ================= */
export function buildWorld(scene){const T=makeTextures();const R=mulberry(1234);const dummy=new THREE.Object3D();const col=new THREE.Color();
 const out={pickups:[],kelp:[],vents:[],glowSpots:[],meshes:{},T,balls:[],cols:[],chunks:[]};
 const place=(n,filter,tries=40)=>{const pts=[];for(let t=0;t<n*tries&&pts.length<n;t++){const x=(R()*2-1)*(WORLD-8),z=(R()*2-1)*(WORLD-8),y=heightAt(x,z);const w=weights(x,z);if(filter(-y,w,x,z))pts.push([x,y,z,w]);}return pts;};
 const slopeAt=(x,z)=>{const e=1.2;const dx=heightAt(x+e,z)-heightAt(x-e,z),dz=heightAt(x,z+e)-heightAt(x,z-e);return Math.hypot(dx,dz)/(2*e);};
 const CELL=110;const inst=(geo,mat,pts,fn,name,chunk=true)=>{const mats=[],cols=[];let hasCol=false;
  pts.forEach((q,i)=>{fn(q,i,dummy,col);dummy.updateMatrix();mats.push(dummy.matrix.clone());cols.push(col.__set?col.clone():null);if(col.__set)hasCol=true;col.__set=false;});
  const groups=new Map();pts.forEach((q,i)=>{const key=chunk?Math.floor((q[0]+WORLD)/CELL)+','+Math.floor((q[2]+WORLD)/CELL):'all';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);});if(!groups.size)groups.set('all',[]);
  const list=[];for(const[,idx]of groups){const im=new THREE.InstancedMesh(geo,mat,Math.max(1,idx.length));im.count=idx.length;idx.forEach((i,j)=>{im.setMatrixAt(j,mats[i]);if(hasCol)im.setColorAt(j,cols[i]||col.set(0xffffff));});
   if(im.instanceColor)im.instanceColor.needsUpdate=true;if(idx.length)im.computeBoundingSphere();scene.add(im);list.push(im);if(chunk)out.chunks.push(im);}
  if(name)out.meshes[name]=list;return list[0];};
 out.cull=(cam,view)=>{const p=cam.position;for(const im of out.chunks){const b=im.boundingSphere;if(!b){im.visible=false;continue;}const dx=p.x-b.center.x,dz=p.z-b.center.z,dy=p.y-b.center.y;im.visible=Math.sqrt(dx*dx+dz*dz+dy*dy*.25)-b.radius<view;}};
 const setC=(c,h)=>{c.set(h);c.__set=true;};

 /* terrain */
 const terrainGeo=(SEG)=>{const geo=new THREE.PlaneGeometry(WORLD*2,WORLD*2,SEG,SEG);geo.rotateX(-Math.PI/2);{const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,heightAt(p.getX(i),p.getZ(i)));geo.computeVertexNormals();const nn=geo.attributes.normal;
  const C=new Float32Array(p.count*3),RK=new Float32Array(p.count),GL=new Float32Array(p.count),tmp=new THREE.Color(),c2=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),w=weights(x,z),d=-y,nz=n2(x*.05,z*.05);
   tmp.setRGB(.8,.72,.56);tmp.lerp(c2.setRGB(.86,.7,.62),w.reef*.6);tmp.lerp(c2.setRGB(.6,.58,.42),w.kelp*.75);tmp.lerp(c2.setRGB(.68,.42,.38),w.plat*.85);tmp.lerp(c2.setRGB(.26,.25,.36),w.pit*sm(40,110,d));tmp.lerp(c2.setRGB(.2,.19,.23),w.abyss*sm(90,200,d));
   tmp.multiplyScalar(.92+nz*.08);C.set([tmp.r,tmp.g,tmp.b],i*3);RK[i]=cl(w.plat*.4+w.abyss*sm(120,220,d)+w.pit*sm(60,120,d)*.7,0,1);GL[i]=cl(w.pit*sm(90,150,d)+w.abyss*sm(250,360,d),0,1)*(.4+.6*sm(-.2,.4,n2(x*.02+9,z*.02)));}
  geo.setAttribute('color',new THREE.BufferAttribute(C,3));geo.setAttribute('aRk',new THREE.BufferAttribute(RK,1));geo.setAttribute('aGl',new THREE.BufferAttribute(GL,1));}return geo;};const geo=terrainGeo(260);let geoLow=null;
 const tm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0,normalMap:T.sandN,normalScale:new THREE.Vector2(.7,.7)});
 wmat(tm,{caus:1,key:'terrain',uniforms:{tSand:{value:T.sand},tRock:{value:T.rock},tVein:{value:T.vein}},
  vpars:'attribute float aRk;attribute float aGl;varying float vRk;varying float vGl;',vert:'vRk=aRk;vGl=aGl;',
  fpars:'uniform sampler2D tSand,tRock,tVein;varying float vRk;varying float vGl;',
  diffuse:`vec3 tn=abs(vWN);tn/=tn.x+tn.y+tn.z;vec3 rk=texture2D(tRock,vWP.zy*.07).rgb*tn.x+texture2D(tRock,vWP.xy*.07).rgb*tn.z+texture2D(tRock,vWP.xz*.07).rgb*tn.y;
   vec3 sd=texture2D(tSand,vWP.xz*.11).rgb*mix(.82,1.12,texture2D(tSand,vWP.xz*.0131+.37).r);float sl=smoothstep(.62,.86,vWN.y)*(1.-vRk*.85);diffuseColor.rgb*=mix(rk*vec3(.9,.88,.86),sd,sl);
   float alg=smoothstep(.15,.6,texture2D(tVein,vWP.xz*.009+.5).r+texture2D(tSand,vWP.xz*.021).r*.4-.3)*smoothstep(-70.,-12.,vWP.y)*sl;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.62,.72,.48),alg*.55);`,
  bump:`vec3 tb=abs(vWN);tb/=tb.x+tb.y+tb.z;float rh=texture2D(tRock,vWP.zy*.07).r*tb.x+texture2D(tRock,vWP.xy*.07).r*tb.z+texture2D(tRock,vWP.xz*.07).r*tb.y;
   rh+=(texture2D(tRock,vWP.zy*.29).r*tb.x+texture2D(tRock,vWP.xy*.29).r*tb.z+texture2D(tRock,vWP.xz*.29).r*tb.y)*.35;bh=rh*(1.-smoothstep(.62,.86,vWN.y)*(1.-vRk*.85));`,bumpS:.55,
  emis:`float vn=smoothstep(.7,.98,texture2D(tVein,vWP.xz*.022).r);float vn2=smoothstep(.75,.98,texture2D(tVein,vWP.xz*.051+.3).r);totalEmissiveRadiance+=mix(vec3(.15,.95,1.),vec3(.55,.35,1.),smoothstep(-.4,.4,sin(vWP.x*.02+vWP.z*.013)))*(vn*.7+vn2*.35)*vGl*smoothstep(.55,.9,vWN.y)*(.75+.25*sin(uTime*1.1+vWP.x*.05));`});
 const terrain=new THREE.Mesh(geo,tm);scene.add(terrain);out.terrain=terrain;
 out.setLOD=(low)=>{if(low&&!geoLow)geoLow=terrainGeo(170);terrain.geometry=low?geoLow:geo;};

 /* rocks */
 {const rm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92}),{caus:1,key:'rock',uniforms:{tRock:{value:T.rock}},fpars:'uniform sampler2D tRock;',
   diffuse:`vec3 tn=abs(vWN);tn/=tn.x+tn.y+tn.z;vec3 rt=texture2D(tRock,vWP.zy*.13).rgb*tn.x+texture2D(tRock,vWP.xy*.13).rgb*tn.z+texture2D(tRock,vWP.xz*.13).rgb*tn.y;diffuseColor.rgb*=rt*1.12;
   float shallow=smoothstep(-80.,-15.,vWP.y);float top=smoothstep(.35,.8,vWN.y+rt.r*.3-.15);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.34,.4,.22)*rt*1.4,top*shallow*.55);
   float coralline=smoothstep(.55,.75,rt.r)*(1.-top)*shallow;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.42,.52)*rt*1.3,coralline*.35);`,
   bump:`vec3 tb=abs(vWN);tb/=tb.x+tb.y+tb.z;bh=texture2D(tRock,vWP.zy*.13).r*tb.x+texture2D(tRock,vWP.xy*.13).r*tb.z+texture2D(tRock,vWP.xz*.13).r*tb.y;bh+=(texture2D(tRock,vWP.zy*.5).r*tb.x+texture2D(tRock,vWP.xy*.5).r*tb.z+texture2D(tRock,vWP.xz*.5).r*tb.y)*.3;`,bumpS:.35});
  for(let v=0;v<3;v++){const pts=place(230,(d,w)=>d<380||w.abyss>.5);inst(rockGeo(v*7+1,v===2?3:2),rm,pts,(q,i,o,c)=>{const big=R()<.12;const s=big?4+R()*6:.4+Math.pow(R(),2.5)*3.2;o.position.set(q[0],q[1]+s*.05,q[2]);o.rotation.set((R()-.5)*.4,R()*6.3,(R()-.5)*.4);o.scale.set(s*(.8+R()*.5),s*(.6+R()*.6),s*(.8+R()*.5));if(s>2.2)out.balls.push({x:q[0],y:q[1]+s*.05,z:q[2],r:Math.min(o.scale.x,o.scale.z)*.85,ry:o.scale.y*.68});
   const w=q[3];c.setRGB(1,1,1);c.lerp(col.clone().setRGB(1.05,.78,.7),w.plat);c.lerp(col.clone().setRGB(.5,.5,.62),w.pit);c.lerp(col.clone().setRGB(.42,.4,.44),w.abyss);c.__set=true;},'rocks'+v);}
  // spires + arches on the plateau
  const sp=place(34,(d,w,x,z)=>w.plat>.7&&d<120);inst(spireGeo(3),rm,sp,(q,i,o,c)=>{const h=14+R()*30,r=2+R()*3;o.position.set(q[0],q[1]-1,q[2]);o.rotation.set((R()-.5)*.12,R()*6.3,(R()-.5)*.12);o.scale.set(r,h,r);setC(c,0xffffff);out.cols.push({x:q[0],z:q[2],r:r*.9,y0:q[1]-2,y1:q[1]-1+h});},'spires');
  const archBalls=(g,o)=>{o.updateMatrix();const v=new THREE.Vector3();for(let k=0;k<=12;k++){g.userData.curve.getPointAt(k/12,v);v.applyMatrix4(o.matrix);const r=.3*Math.min(o.scale.x,o.scale.y);out.balls.push({x:v.x,y:v.y,z:v.z,r,ry:r});}};
  const aG=[arch2Geo(5,1),arch2Geo(9,1.25)];
  const ar=place(6,(d,w)=>w.plat>.8&&d<115);inst(aG[0],rm,ar,(q,i,o,c)=>{const s=8+R()*6;o.position.set(q[0],q[1]-1,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.set(s,s*1.15,s*.9);setC(c,0xffd8c8);archBalls(aG[0],o);},'arches');
  const shoal=[[36,-30,7.5,.4],[-26,44,6.5,2.2],[66,-70,9,1.1],[14,-52,5.5,-.6],[-70,-20,7,1.6]].map(([x,z,s,r])=>[x,heightAt(x,z),z,s,r]);
  inst(aG[1],rm,shoal,(q,i,o,c)=>{const s=q[3];o.position.set(q[0],q[1]-.6,q[2]);o.rotation.set(0,q[4],0);o.scale.set(s,s,s*.95);setC(c,0xffffff);archBalls(aG[1],o);},'arch2');
  out.arches=shoal;
  // ribcage landmark on the abyss floor
  const rg=new THREE.Mesh(ribGeo(),wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,emissive:0x0a1416}),{caus:0}));rg.position.set(RIBS.x,heightAt(RIBS.x,RIBS.z)+.5,RIBS.z);rg.rotation.y=.4;scene.add(rg);RIBS.y=rg.position.y;out.ribs=rg;}

 /* kelp */
 {const km=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,side:THREE.DoubleSide}),{caus:.6,key:'kelp',emis:'totalEmissiveRadiance+=diffuseColor.rgb*vec3(.55,.5,.16)*.42*exp(-uKd*max(-vWP.y,0.))*(.6+.4*smoothstep(-.2,.8,normalize(vWN).y*-1.+.5));',vert:`float kk=pow(max(position.y,0.)/16.,1.4);transformed.x+=sin(uTime*.7+iph+position.y*.16)*kk*1.9+sin(uTime*2.1+position.y*1.3+iph)*.06*kk;transformed.z+=cos(uTime*.55+iph*1.3+position.y*.12)*kk*1.5;`});
  const geos=[kelpGeo(14),kelpGeo(19),kelpGeo(24)];
  for(let v=0;v<3;v++){const pts=place(v===2?110:160,(d,w,x,z)=>d>12&&d<62&&(w.kelp>.4&&n2(x*.03,z*.03)>-.35||w.reef>.3&&n2(x*.05+3,z*.05)>.55||w.r<70&&n2(x*.04+8,z*.04)>.62));
   const Hh=[14,19,24][v];inst(geos[v],km,pts,(q,i,o,c)=>{const s=Math.min(.75+R()*.55,(-q[1]-2)/Hh);o.position.set(q[0],q[1]-.3,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(Math.max(.3,s));setC(c,0xffffff);out.kelp.push({x:q[0],y:q[1],z:q[2],h:Hh*Math.max(.3,s),cd:0});},'kelp'+v);}}

 /* sea grass */
 {const gm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide}),{caus:.8,key:'grass',vert:`float gk=position.y*position.y;transformed.x+=sin(uTime*1.3+iph+position.y)*.18*gk;transformed.z+=cos(uTime*1.1+iph*1.7)*.14*gk;
   vec3 ip=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;transformed*=smoothstep(80.,58.,distance(ip.xz,cameraPosition.xz));`});
  const pts=place(3600,(d,w,x,z)=>d<120&&w.abyss<.1&&w.pit<.3&&n2(x*.035+1,z*.035)>-.2,6);inst(grassGeo(),gm,pts,(q,i,o,c)=>{const w=q[3];o.position.set(q[0],q[1]-.05,q[2]);o.rotation.set(0,R()*6.3,0);const s=.7+R()*.9;o.scale.set(s,s*(.8+w.kelp*.6+w.plat*.5),s);
   c.setRGB(.42,.7,.32);c.lerp(col.clone().setRGB(.62,.66,.3),w.kelp);c.lerp(col.clone().setRGB(.95,.3,.25),w.plat);c.lerp(col.clone().setRGB(.3,.75,.6),w.reef*.6);c.__set=true;},'grass');}

 /* coral */
 {const CC=[0xff7a4a,0xe2477c,0x9a5ae0,0xffc84a,0x40c8b4,0xd8383e,0xff9ac0,0x6ac0ff,0xf08a30];
  const cm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62}),{caus:1,key:'coral',rim:.55});
  const swayM=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}),{caus:.8,key:'anem',rim:.6,vert:`float ak=max(position.y-.35,0.);transformed.x+=sin(uTime*1.6+iph+position.z*6.)*.12*ak;transformed.z+=cos(uTime*1.3+iph+position.x*6.)*.1*ak;`});
  const fanM=wmat(new THREE.MeshStandardMaterial({map:T.fan,alphaTest:.45,side:THREE.DoubleSide,roughness:.7}),{caus:.8,key:'fan',vert:`transformed.z+=sin(uTime*1.1+iph)*.12*position.y;`});
  const reefF=(k,lo=8,hi=58)=>(d,w,x,z)=>d>lo&&d<hi&&(w.reef>.35&&n2(x*.045+k,z*.045)>-.25||w.r<90&&n2(x*.06+k,z*.06)>.62);
  const pickC=(c,i,k)=>{setC(c,CC[(i*7+k)%CC.length]);c.lerp(col2.setRGB(.55,.5,.5),.18);c.multiplyScalar(.8+R()*.25);};const col2=new THREE.Color();
  for(let v=0;v<3;v++)inst(staghornGeo(v*5+2),cm,place(70,reefF(1)),(q,i,o,c)=>{const s=1.2+R()*1.6;o.position.set(q[0],q[1]-.1,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);pickC(c,i,v);},'stag'+v);
  inst(brainGeo(),cm,place(150,reefF(2)),(q,i,o,c)=>{const s=.6+R()*1.3;o.position.set(q[0],q[1]-.15*s,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.set(s,s*(.8+R()*.5),s);pickC(c,i,3);},'brain');
  inst(tableGeo(),cm,place(80,reefF(3,10,50)),(q,i,o,c)=>{const s=1+R()*1.4;o.position.set(q[0],q[1],q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);pickC(c,i,1);},'table');
  for(let v=0;v<2;v++)inst(tubesGeo(v+9),cm,place(70,reefF(4)),(q,i,o,c)=>{const s=.8+R()*1.1;o.position.set(q[0],q[1]-.1,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);pickC(c,i,4+v);},'tubes'+v);
  inst(anemoneGeo(),swayM,place(150,reefF(5,6,60)),(q,i,o,c)=>{const s=.8+R()*1.2;o.position.set(q[0],q[1]-.05,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);pickC(c,i,6);},'anem');
  const fg=new THREE.PlaneGeometry(2,2);fg.translate(0,1,0);inst(fg,fanM,place(170,reefF(6,8,70)),(q,i,o,c)=>{const s=.8+R()*1.4;o.position.set(q[0],q[1]-.1,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);setC(c,[0xb04ad0,0xe05050,0xff8a3a,0xffd04a][i%4]);},'fans');
  const whipM=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}),{caus:.6,key:'whip',rim:.4,vert:`float wk=position.y*position.y*.05;transformed.x+=sin(uTime*1.2+iph+position.y*.8)*wk;transformed.z+=cos(uTime*.9+iph*1.3)*wk*.8;`});
  inst(barrelGeo(3),cm,place(70,reefF(7,8,62)),(q,i,o,c)=>{const s=.8+R()*1.5;o.position.set(q[0],q[1]-.12,q[2]);o.rotation.set((R()-.5)*.15,R()*6.3,(R()-.5)*.15);o.scale.set(s,s*(.8+R()*.5),s);setC(c,[0xd8702a,0x8a4ab0,0xc84a4a,0xb89a5a][i%4]);},'barrel');
  for(let v=0;v<2;v++)inst(whipGeo(v+21),whipM,place(90,reefF(8+v,6,65)),(q,i,o,c)=>{const s=.8+R()*.8;o.position.set(q[0],q[1]-.05,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);setC(c,[0xe8a03a,0xd83a5a,0x9a6aff,0xffd84a][(i+v)%4]);},'whip'+v);
  inst(pillarGeo(5),cm,place(46,reefF(11,8,50)),(q,i,o,c)=>{const s=1+R()*1.3;o.position.set(q[0],q[1]-.1,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);setC(c,[0xd8c8a0,0xb8d0a0,0xe8b8a0][i%3]);},'pillar');
  inst(clamGeo(),cm,place(46,reefF(12,6,45)),(q,i,o,c)=>{const s=.8+R()*.8;o.position.set(q[0],q[1]-.08,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);setC(c,0xffffff);},'clam');
  const dm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7}),{caus:1,key:'decor'});
  inst(urchinGeo(),dm,place(300,(d,w,x,z)=>d>6&&d<95&&w.abyss<.2&&w.pit<.3&&n2(x*.05+5,z*.05)>-.1,8),(q,i,o,c)=>{const s=.8+R()*.9;o.position.set(q[0],q[1]-.02,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);setC(c,[0xffffff,0xc0a0ff,0x80a0c0][i%3]);},'urchin');
  inst(starGeo(),dm,place(260,(d,w)=>d>5&&d<75&&w.abyss<.1&&w.pit<.2,8),(q,i,o,c)=>{const s=.7+R()*.9;o.position.set(q[0],q[1]+.01,q[2]);o.rotation.set((R()-.5)*.1,R()*6.3,(R()-.5)*.1);o.scale.setScalar(s);setC(c,[0xe8541e,0xd8302a,0x8a3ab8,0xf0a030,0x3a6ad8][i%5]);},'star');}

 /* plateau lantern trees */
 {const lm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,emissive:0xffffff}),{caus:.5,key:'lant',vert:'transformed.x+=sin(uTime*.6+iph)*.03*position.y*position.y*.1;',emis:'totalEmissiveRadiance=vColor*vColor*vColor*(1.3+.4*sin(uTime*1.7+vIph*5.));'});
  inst(lanternTreeGeo(),lm,place(60,(d,w)=>w.plat>.55&&d>40),(q,i,o,c)=>{const s=.9+R()*.9;o.position.set(q[0],q[1]-.2,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);setC(c,i%3?0xffa040:0xff6a3a);},'lantern');}

 /* bioluminescent deep flora */
 {const gm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,emissive:0xffffff}),{caus:0,key:'glow',emis:'totalEmissiveRadiance=vColor*vColor*vColor*1.7*(.7+.3*sin(uTime*1.2+vIph*3.));'});
  inst(capGeo(),gm,place(90,(d,w)=>w.pit>.4&&d>70),(q,i,o,c)=>{const s=1.6+R()*3.6;o.position.set(q[0],q[1]-.2,q[2]);o.rotation.set((R()-.5)*.2,R()*6.3,(R()-.5)*.2);o.scale.set(s,s*(.8+R()*.8),s);setC(c,[0x60e8ff,0x9a7aff,0x60f0b0][i%3]);out.glowSpots.push(new THREE.Vector3(q[0],q[1]+s,q[2]));},'capsPit');
  inst(capGeo(),gm,place(130,(d,w)=>w.abyss>.6&&d>250),(q,i,o,c)=>{const s=3+R()*8;o.position.set(q[0],q[1]-.2,q[2]);o.rotation.set((R()-.5)*.2,R()*6.3,(R()-.5)*.2);o.scale.set(s,s*(.7+R()*.9),s);setC(c,[0x50e8d0,0x6aa8ff,0xa070ff,0x80f0a0][i%4]);out.glowSpots.push(new THREE.Vector3(q[0],q[1]+s,q[2]));},'capsAbyss');
  for(let v=0;v<2;v++)inst(glowTubeGeo(v+3),gm,place(110,(d,w)=>(w.pit>.35&&d>60)||(w.abyss>.4&&d>150)),(q,i,o,c)=>{const s=1+R()*1.6;o.position.set(q[0],q[1]-.1,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);setC(c,[0x40ffe0,0xff60c0,0x80a0ff][(i+v)%3]);},'gtubes'+v);
  const vm=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,emissive:0xffffff}),{caus:0,key:'vent',emis:'totalEmissiveRadiance=vColor*vColor*vColor*vec3(2.4,1.2,.6)*smoothstep(.3,.9,vColor.r)*(.85+.15*sin(uTime*3.+vIph*7.));'});
  inst(ventGeo(2),vm,place(12,(d,w)=>w.abyss>.75&&d>340),(q,i,o,c)=>{const s=.8+R()*.8;o.position.set(q[0],q[1]-.5,q[2]);o.rotation.set(0,R()*6.3,0);o.scale.setScalar(s);setC(c,0xffffff);out.vents.push(new THREE.Vector3(q[0],q[1]+6.4*s,q[2]));},'vents');}

 /* wreck of the HALCYON */
{const g=new THREE.Group();const PT=panelTex();const tm=(r)=>{const t=PT.map.clone();t.needsUpdate=true;t.repeat.set(r[0],r[1]);return t;},trm=(r)=>{const t=PT.rough.clone();t.needsUpdate=true;t.repeat.set(r[0],r[1]);return t;};
  // rust bleeds down from seams, algae settles on top: driven by the world normal so it reads at any scale
  const wear=`float up=smoothstep(.2,.9,vWN.y);float rn=texture2D(map,vMapUv*3.7).r;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.24,.12)*(.6+rn*.6),smoothstep(.55,.25,rn)*.55+(1.-up)*.12);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.3,.38,.2),up*.6*smoothstep(.3,.7,rn));`;
  const hullM=wmat(new THREE.MeshStandardMaterial({color:0xb8bec6,map:tm([5,2]),roughnessMap:trm([5,2]),roughness:.8,metalness:.5}),{caus:1,key:'hull',diffuse:wear});const darkM=wmat(new THREE.MeshStandardMaterial({color:0x5a5e66,map:tm([2,1]),roughness:.8,metalness:.4}),{caus:.6,key:'hulld',diffuse:wear});
  const orangeM=wmat(new THREE.MeshStandardMaterial({color:0xd8641e,map:tm([3,1]),roughness:.7,metalness:.2}),{caus:1,key:'hullo',diffuse:wear});const redL=new THREE.MeshStandardMaterial({color:0xff3020,emissive:0xff2010,emissiveIntensity:3});
  const shell=new THREE.CylinderGeometry(7,7,34,22,6,true,0,Math.PI*1.25);const p=shell.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>12)p.setX(i,p.getX(i)+n2(y*.3,p.getZ(i))*1.5);}shell.computeVertexNormals();
  const s1=new THREE.Mesh(shell,hullM);s1.rotation.set(0,0,Math.PI/2+.12);s1.material.side=THREE.DoubleSide;g.add(s1);
  for(let i=0;i<7;i++){const rib=new THREE.Mesh(new THREE.TorusGeometry(7.1,.32,6,20,Math.PI*1.3),darkM);rib.rotation.set(0,Math.PI/2,.4);rib.position.set(-15+i*5,0,0);g.add(rib);}
  const deck=new THREE.Mesh(new THREE.BoxGeometry(30,.5,9),darkM);deck.position.set(0,-2.5,0);deck.rotation.z=.12;g.add(deck);
  const stripe=new THREE.Mesh(new THREE.CylinderGeometry(7.08,7.08,4,22,1,true,0,Math.PI*1.25),orangeM);stripe.rotation.copy(s1.rotation);stripe.position.x=6;stripe.material.side=THREE.DoubleSide;g.add(stripe);
  // superstructure, windows and the ship's name
  const winM=new THREE.MeshStandardMaterial({color:0x203038,emissive:0x7ad8ff,emissiveIntensity:.9});const wg=[];for(let i=0;i<14;i++){const w=new THREE.BoxGeometry(.9,.55,.1);w.translate(-15+i*2.2,2.2+(i%3===0?0:.0),6.95);wg.push(w);}
  const winMesh=new THREE.Mesh(merge(wg),winM);winMesh.rotation.z=.12;g.add(winMesh);
  const bridge=new THREE.Group();const b1=new THREE.Mesh(new THREE.BoxGeometry(8,4,6),hullM);b1.position.y=2;bridge.add(b1);const b2=new THREE.Mesh(new THREE.BoxGeometry(5.5,2.4,4.4),hullM);b2.position.set(-.6,5.2,0);bridge.add(b2);
  const bw=new THREE.Mesh(new THREE.BoxGeometry(5.6,.7,4.5),winM);bw.position.set(-.6,5.4,0);bridge.add(bw);const ant2=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,6,6),darkM);ant2.position.set(1,9,0);bridge.add(ant2);
  bridge.position.set(-6,-2.2,1.5);bridge.rotation.set(.1,.2,.35);g.add(bridge);
  const nameT=canvasTex(512,96,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='rgba(30,34,40,.92)';x.font='bold 74px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('HALCYON',w/2,h/2+4);},{rep:1});
  const name=new THREE.Mesh(new THREE.PlaneGeometry(10,1.9),new THREE.MeshStandardMaterial({map:nameT,transparent:true,roughness:.6,depthWrite:false}));name.position.set(9,.4,7.12);name.rotation.z=.12;g.add(name);
  // tapered bow (torn open on one side), engine block with three nozzles, stabiliser fins and loose plating
  {const prof=[];for(let i=0;i<=12;i++){const t=i/12;prof.push(new THREE.Vector2(7*(1-t)*(1-t*.15)+1.2*t,t*13));}const bow=new THREE.LatheGeometry(prof,22,.3,Math.PI*1.55);
   const bp=bow.attributes.position;for(let i=0;i<bp.count;i++){const y=bp.getY(i);if(y>8)bp.setX(i,bp.getX(i)+n2(y*.4,bp.getZ(i)*.4)*.8);}bow.computeVertexNormals();
   const b=new THREE.Mesh(bow,hullM);b.material.side=THREE.DoubleSide;b.rotation.z=-Math.PI/2+.12;b.position.set(16.8,2.0,0);g.add(b);
   const eng=new THREE.Mesh(new THREE.CylinderGeometry(7.2,6.4,4,22,1,false),darkM);eng.rotation.z=Math.PI/2+.12;eng.position.set(-18.5,-2.3,0);g.add(eng);
   for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.4;const nz=new THREE.Mesh(new THREE.CylinderGeometry(1.7,2.5,3.4,20,1,true),darkM);nz.material.side=THREE.DoubleSide;nz.rotation.z=Math.PI/2+.12;nz.position.set(-22,-2.7+Math.sin(a)*3.4,Math.cos(a)*3.4);g.add(nz);
    const gl=new THREE.Mesh(new THREE.TorusGeometry(1.8,.18,8,24),orangeM);gl.rotation.y=Math.PI/2;gl.position.set(-20.4,-2.5+Math.sin(a)*3.4,Math.cos(a)*3.4);g.add(gl);}
   const fs=new THREE.Shape();fs.moveTo(0,0);fs.lineTo(7,0);fs.lineTo(9,5);fs.lineTo(3,4.6);fs.closePath();const fg=new THREE.ExtrudeGeometry(fs,{depth:.3,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:1});
   const f1=new THREE.Mesh(fg,hullM);f1.position.set(-21,4.2,-.15);f1.rotation.z=.12;g.add(f1);const f2=new THREE.Mesh(fg,hullM);f2.position.set(-21,-3,6.5);f2.rotation.set(-1.2,0,.12);g.add(f2);
   for(let i=0;i<9;i++){const pl=new THREE.Mesh(new THREE.BoxGeometry(2.4+R()*3,.12,1.5+R()*2),i%3?hullM:darkM);pl.position.set(-26+R()*56,-5+R()*1.5,-12+R()*26);pl.rotation.set((R()-.5)*.8,R()*3,(R()-.5)*.8);g.add(pl);}}
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.3,.4,18,8),darkM);mast.position.set(4,8,-2);mast.rotation.set(.5,0,-.7);g.add(mast);
  for(let i=0;i<4;i++){const box=new THREE.Mesh(new THREE.BoxGeometry(5,2.4,2.4),i%2?orangeM:hullM);box.position.set(-20+i*13+R()*4,-4+R(),8+R()*8);box.rotation.set((R()-.5)*.4,R()*3,(R()-.5)*.3);g.add(box);}
  for(let i=0;i<5;i++){const l=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),redL);l.position.set(-14+i*7,2.5+R()*2,5.6);g.add(l);out.glowSpots.push(null);}
  const y=heightAt(WRECK.x,WRECK.z);g.position.set(WRECK.x,y+3,WRECK.z);g.rotation.y=.7;g.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.material.emissiveIntensity)o.castShadow=true;});const gm=mergeByMaterial(g);scene.add(gm);WRECK.y=y;out.wreck=gm;}

 /* gatherable resources (instanced; removal = zero scale) */
 {const mk={titanium:()=>outcropGeo(0xe6eef8,3),copper:()=>outcropGeo(0x40d8a0,7),quartz:()=>crystalGeo(2,7,1.3),lithium:()=>crystalGeo(5,6,1.6),gel:gelGeo,ember:()=>crystalGeo(8,7,1.8),scrap:()=>scrapGeo(4),bulb:bulbGeo};
  const glowRes={quartz:.25,lithium:1.2,gel:1.5,ember:2.2,bulb:.6,titanium:.08,copper:.18};
  for(const[k,r]of Object.entries(RES)){let pts;
   if(k==='scrap'){pts=[];for(let i=0;i<r.count;i++){const a=R()*6.3,d=8+R()*30;const x=WRECK.x+Math.cos(a)*d,z=WRECK.z+Math.sin(a)*d;pts.push([x,heightAt(x,z),z]);}}
   else if(k==='gel')pts=place(r.count,(d,w)=>(w.pit>.3&&d>105)||(w.abyss>.6&&d>200));
   else if(k==='ember')pts=place(r.count,(d,w)=>w.abyss>.6&&d>=r.d[0]);
   else if(k==='lithium')pts=place(r.count,(d,w)=>d>=r.d[0]&&d<=r.d[1]&&(w.plat>.5||w.pit>.3||w.abyss>.2));
   else pts=place(r.count,(d,w)=>d>=r.d[0]&&d<=r.d[1]&&w.abyss<.35);
   // make sure early materials exist close to the lifepod
   if(k==='titanium'||k==='quartz'||k==='bulb'){for(let i=0;i<(k==='bulb'?8:5);i++){const a=i*1.3+R(),d=12+R()*26;const x=Math.cos(a)*d,z=Math.sin(a)*d;pts[i]=[x,heightAt(x,z),z];}}
   const em=glowRes[k]||0;const mat=wmat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:k==='titanium'||k==='copper'||k==='scrap'?.55:.15,metalness:k==='titanium'||k==='scrap'?.6:.1,emissive:em?0xffffff:0,emissiveIntensity:1,transparent:k==='gel',opacity:k==='gel'?.85:1}),
    {caus:.7,key:'res'+k,emis:em?`totalEmissiveRadiance=vColor*vColor*${em.toFixed(2)}*(.8+.2*sin(uTime*2.+vIph*5.));`:''});
   const im=inst(mk[k](),mat,pts,(q,i,o,c)=>{const s=k==='bulb'?.8+R()*.4:k==='gel'?1+R()*.5:.9+R()*.4;o.position.set(q[0],q[1]-.05,q[2]);o.rotation.set((R()-.5)*.2,R()*6.3,(R()-.5)*.2);o.scale.setScalar(s);setC(c,r.col);
    out.pickups.push({k,i,im:null,pos:new THREE.Vector3(q[0],q[1]+.6*s,q[2]),alive:true,s,m:o.matrix.clone()});},'res_'+k,false);
   im.userData.k=k;for(const pk of out.pickups)if(pk.k===k&&!pk.im)pk.im=im;}}
 out.hide=(pk)=>{pk.alive=false;dummy.position.set(0,-9999,0);dummy.scale.setScalar(0);dummy.rotation.set(0,0,0);dummy.updateMatrix();pk.im.setMatrixAt(pk.i,dummy.matrix);pk.im.instanceMatrix.needsUpdate=true;};
 out.show=(pk)=>{pk.alive=true;pk.im.setMatrixAt(pk.i,pk.m);pk.im.instanceMatrix.needsUpdate=true;};
 out.glowSpots=out.glowSpots.filter(Boolean);
 const CAST=/^(rocks|spires|arches|arch2|kelp|stag|table|tubes|brain|fans|barrel|pillar|lantern|capsPit|capsAbyss|vents|clam)/;
 for(const[k,list]of Object.entries(out.meshes))if(CAST.test(k))list.forEach(im=>caster(im));
 out.ribs.castShadow=true;
 out.decor=['urchin','star','whip0','whip1','clam','barrel','pillar'].flatMap(k=>out.meshes[k]||[]);
 return out;}
