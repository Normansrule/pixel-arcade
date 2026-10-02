// NIGHT DRIVE — world meshes: roads, sidewalks, buildings (merged per facade), neon signs, lamps, trees, highway, bridges, river, hill tunnel,
// park, harbour, kickers, garages, skyline; plus time of day (sky, sun/moon, fog, window lights), rain and wet-road neon reflections.
import * as THREE from '../vendor/three.module.min.js';
import {N,SP,ROAD,HALF,WALK,HY,WORLD,rng} from './city.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;

class GB{constructor(){this.p=[];this.n=[];this.u=[];this.i=[];this.c=[];}
 quad(a,b,c,d,n,uv,col){const k=this.p.length/3;this.p.push(...a,...b,...c,...d);for(let q=0;q<4;q++){this.n.push(...n);if(col)this.c.push(col.r,col.g,col.b);}this.u.push(...uv);this.i.push(k,k+1,k+2,k,k+2,k+3);}
 // axis-aligned box with metre-based UVs (us/vs = metres per texture repeat)
 box(x0,y0,z0,x1,y1,z1,o={}){const us=o.us||16,vs=o.vs||16,col=o.col,skip=o.skip||{};const vo=o.v0||0;
  if(!skip.top&&!o.noTop)this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],[x0/us,z1/us,x1/us,z1/us,x1/us,z0/us,x0/us,z0/us],col);
  if(o.bottom)this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],[0,0,1,0,1,1,0,1],col);
  const v0=(y0-vo)/vs,v1=(y1-vo)/vs;
  if(!skip.pz)this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],[x0/us,v0,x1/us,v0,x1/us,v1,x0/us,v1],col);
  if(!skip.nz)this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],[-x1/us,v0,-x0/us,v0,-x0/us,v1,-x1/us,v1],col);
  if(!skip.px)this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],[z1/us,v0,z0/us,v0,z0/us,v1,z1/us,v1].map((v,k)=>k%2?v:-v),col);
  if(!skip.nx)this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],[z0/us,v0,z1/us,v0,z1/us,v1,z0/us,v1],col);}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));if(this.c.length)g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setIndex(this.i);g.computeBoundingSphere();return g;}
 get empty(){return!this.p.length;}}

const NOISE=`float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}`;

// time-of-day keyframes: hour -> look
const TOD=[
 {h:17.0,el:22,sun:[1,.86,.66],si:2.6,hs:[.95,.85,.75],hg:[.32,.28,.24],hi:.9,top:[.24,.42,.72],hor:[1,.72,.48],fog:[.7,.6,.55],fd:.0011,exp:.9,night:0},
 {h:18.4,el:6,sun:[1,.56,.3],si:1.8,hs:[.8,.6,.6],hg:[.25,.18,.18],hi:.7,top:[.16,.22,.5],hor:[1,.45,.3],fog:[.55,.36,.38],fd:.0021,exp:.95,night:.25},
 {h:19.3,el:-3,sun:[.8,.4,.5],si:.35,hs:[.42,.38,.62],hg:[.12,.1,.16],hi:.45,top:[.06,.08,.22],hor:[.5,.22,.38],fog:[.18,.13,.24],fd:.0026,exp:1.0,night:.7},
 {h:20.3,el:-12,sun:[.55,.65,1],si:.3,hs:[.3,.36,.6],hg:[.07,.07,.1],hi:.3,top:[.015,.022,.06],hor:[.12,.08,.18],fog:[.035,.035,.06],fd:.0026,exp:.92,night:1},
 {h:26.0,el:-12,sun:[.55,.65,1],si:.3,hs:[.28,.34,.58],hg:[.06,.06,.09],hi:.28,top:[.01,.015,.045],hor:[.1,.07,.16],fog:[.03,.03,.055],fd:.0026,exp:.92,night:1}];
export function todAt(h){let a=TOD[0],b=TOD[TOD.length-1];for(let k=0;k<TOD.length-1;k++)if(h>=TOD[k].h&&h<=TOD[k+1].h){a=TOD[k];b=TOD[k+1];break;}if(h<TOD[0].h)return TOD[0];const t=b.h===a.h?0:cl((h-a.h)/(b.h-a.h),0,1);const o={};for(const k in a){o[k]=Array.isArray(a[k])?a[k].map((v,i)=>lerp(v,b[k][i],t)):lerp(a[k],b[k],t);}return o;}

export function buildWorld(city,T,renderer){const R=rng(1234);const group=new THREE.Group();const std=o=>new THREE.MeshStandardMaterial(o);const W=WORLD;
 const M={
  road:std({map:T.asphalt,roughnessMap:T.asphaltR,roughness:.9,metalness:.15}),walk:std({map:T.walk,roughness:.85,metalness:0}),grass:std({map:T.grass,roughness:1}),dirt:std({map:T.dirt,roughness:1}),
  line:std({color:0xe8e4d8,roughness:.6,emissive:0xffffff,emissiveIntensity:.02}),yline:std({color:0xe0b020,roughness:.6,emissive:0xffb000,emissiveIntensity:.02}),
  roof:std({map:T.roof,roughness:.9}),concrete:std({map:T.concrete,roughness:.85}),deck:std({map:T.asphalt,roughnessMap:T.asphaltR,roughness:.9,metalness:.15}),planks:std({map:T.planks,roughness:.9}),rock:std({map:T.rock,roughness:1}),
  water:std({color:0x0a141c,roughness:.08,metalness:.9}),barrier:std({color:0xb0b0a8,roughness:.6,map:T.concrete}),metal:std({color:0x50565c,roughness:.4,metalness:.8}),pole:std({color:0x2a2c30,roughness:.5,metalness:.7})};
 const FAC={};for(const k of['glass','office','brick','ind','house'])FAC[k]=std({map:T[k].map,emissiveMap:T[k].em,emissive:0xffffff,emissiveIntensity:0,roughness:k==='glass'?.3:.8,metalness:k==='glass'?.35:.05,envMapIntensity:k==='glass'?.45:.25});
 const wetMats=[M.road,M.deck];

 /* ---------- ground: outskirts dirt + roads + sidewalks ---------- */
 {const gg=new GB();const pd=city.pondC;const cell=(x0,z0,x1,z1,c)=>{for(let x=x0;x<x1;x+=c)for(let z=z0;z<z1;z+=c){const xa=x,xb=Math.min(x1,x+c),za=z,zb=Math.min(z1,z+c);if(Math.hypot((xa+xb)/2-pd.x,(za+zb)/2-pd.z)<pd.r+1)continue;gg.quad([xa,-.05,zb],[xb,-.05,zb],[xb,-.05,za],[xa,-.05,za],[0,1,0],[xa/24,zb/24,xb/24,zb/24,xb/24,za/24,xa/24,za/24]);}};
  cell(-320,-320,6*SP+HALF,W+320,32);cell(7*SP-HALF,-320,W+38,W+320,8);const ground=new THREE.Mesh(gg.geo(),M.dirt);ground.receiveShadow=true;group.add(ground);}
 const roads=new GB(),walks=new GB(),lines=new GB(),ylines=new GB();
 for(const e of city.edges){const A=city.nodes[e.a],B=city.nodes[e.b];const y=.02;
  if(e.ax==='x'){const x0=A.x+HALF,x1=B.x-HALF,z=A.z;roads.box(x0,-.2,z-HALF,x1,y,z+HALF,{skip:{pz:1,nz:1,px:1,nx:1},us:12});
   for(let s=x0+2;s<x1-2;s+=6){ylines.box(s,y,z-.08-.18,s+3,y+.01,z-.08,{noTop:0,skip:{pz:1,nz:1,px:1,nx:1}});ylines.box(s,y,z+.08,s+3,y+.01,z+.26,{skip:{pz:1,nz:1,px:1,nx:1}});}
   for(const sd of[-1,1]){let s=x0+3;while(s<x1-3){lines.box(s,y,z+sd*3.5-.07,s+2.4,y+.01,z+sd*3.5+.07,{skip:{pz:1,nz:1,px:1,nx:1}});s+=5;}lines.box(x0,y,z+sd*(HALF-.45)-.08,x1,y+.01,z+sd*(HALF-.45)+.08,{skip:{pz:1,nz:1,px:1,nx:1}});}}
  else{const z0=A.z+HALF,z1=B.z-HALF,x=A.x;roads.box(x-HALF,-.2,z0,x+HALF,y,z1,{skip:{pz:1,nz:1,px:1,nx:1},us:12});
   for(let s=z0+2;s<z1-2;s+=6){ylines.box(x-.26,y,s,x-.08,y+.01,s+3,{skip:{pz:1,nz:1,px:1,nx:1}});ylines.box(x+.08,y,s,x+.26,y+.01,s+3,{skip:{pz:1,nz:1,px:1,nx:1}});}
   for(const sd of[-1,1]){let s=z0+3;while(s<z1-3){lines.box(x+sd*3.5-.07,y,s,x+sd*3.5+.07,y+.01,s+2.4,{skip:{pz:1,nz:1,px:1,nx:1}});s+=5;}lines.box(x+sd*(HALF-.45)-.08,y,z0,x+sd*(HALF-.45)+.08,y+.01,z1,{skip:{pz:1,nz:1,px:1,nx:1}});}}}
 // intersections + crosswalks
 for(const n of city.nodes){if(!n.alive||!n.nb.length)continue;roads.box(n.x-HALF,-.2,n.z-HALF,n.x+HALF,.02,n.z+HALF,{skip:{pz:1,nz:1,px:1,nx:1},us:12});
  for(const nb of n.nb){const o=city.nodes[nb];const dx=Math.sign(o.x-n.x),dz=Math.sign(o.z-n.z);for(let k=-5;k<=5;k++){if(dx){const x=n.x+dx*(HALF+1.6);lines.box(x-1.2,.025,n.z+k*1.15-.35,x+1.2,.035,n.z+k*1.15+.35,{skip:{pz:1,nz:1,px:1,nx:1}});}else{const z=n.z+dz*(HALF+1.6);lines.box(n.x+k*1.15-.35,.025,z-1.2,n.x+k*1.15+.35,.035,z+1.2,{skip:{pz:1,nz:1,px:1,nx:1}});}}}}
 // sidewalks: raised slabs around blocks
 for(const b of city.blocks){if(b.d==='river'||b.d==='park'||b.d==='hill')continue;const h=.18;walks.box(b.x0,-.2,b.z0,b.x1,h,b.z0+WALK,{us:4});walks.box(b.x0,-.2,b.z1-WALK,b.x1,h,b.z1,{us:4});walks.box(b.x0,-.2,b.z0+WALK,b.x0+WALK,h,b.z1-WALK,{us:4});walks.box(b.x1-WALK,-.2,b.z0+WALK,b.x1,h,b.z1-WALK,{us:4});
  walks.box(b.x0+WALK,-.2,b.z0+WALK,b.x1-WALK,.05,b.z1-WALK,{skip:{pz:1,nz:1,px:1,nx:1},us:4});}
 const roadMesh=new THREE.Mesh(roads.geo(),M.road);roadMesh.receiveShadow=true;group.add(roadMesh);M.road.map.repeat.set(1,1);
 const wm=new THREE.Mesh(walks.geo(),M.walk);wm.receiveShadow=true;group.add(wm);group.add(new THREE.Mesh(lines.geo(),M.line));group.add(new THREE.Mesh(ylines.geo(),M.yline));

 /* ---------- buildings ---------- */
 const FB={glass:new GB(),office:new GB(),brick:new GB(),ind:new GB(),house:new GB()},roofB=new GB(),houseRoof=new GB();
 const signB=new GB(),signs=[],beacons=[];const signCell=(k)=>{const c=k%4,r=(k/4)|0;return[c*.25,1-(r+1)*.125,(c+1)*.25,1-r*.125];};
 const addSign=(x,y,z,w,h,face,k)=>{// face: 'px','nx','pz','nz' — plane slightly off the wall
  const[u0,v0,u1,v1]=signCell(k);const o=.12;let a,b,c,d,n;if(face==='pz'){a=[x-w/2,y,z+o];b=[x+w/2,y,z+o];c=[x+w/2,y+h,z+o];d=[x-w/2,y+h,z+o];n=[0,0,1];}else if(face==='nz'){a=[x+w/2,y,z-o];b=[x-w/2,y,z-o];c=[x-w/2,y+h,z-o];d=[x+w/2,y+h,z-o];n=[0,0,-1];}
  else if(face==='px'){a=[x+o,y,z+w/2];b=[x+o,y,z-w/2];c=[x+o,y+h,z-w/2];d=[x+o,y+h,z+w/2];n=[1,0,0];}else{a=[x-o,y,z-w/2];b=[x-o,y,z+w/2];c=[x-o,y+h,z+w/2];d=[x-o,y+h,z-w/2];n=[-1,0,0];}
  signB.quad(a,b,c,d,n,[u0,v0,u1,v0,u1,v1,u0,v1]);signs.push({x:(a[0]+c[0])/2,y:y+h/2,z:(a[2]+c[2])/2,col:new THREE.Color(T.signCols[k]),w});};
 for(const L of city.lots){const fk=L.kind==='house'?'house':L.kind==='warehouse'?'ind':L.kind==='containers'?null:L.d==='downtown'?'glass':L.d==='strip'?'brick':L.col%2?'office':'glass';
  if(L.kind==='containers'){continue;}
  const gb=FB[fk];const off={us:16,vs:16,v0:-(R()*4|0)*4};
  if(L.setback){const h1=L.h*.62;gb.box(L.x0,0,L.z0,L.x1,h1,L.z1,{...off,noTop:1});roofB.box(L.x0,h1,L.z0,L.x1,h1+.01,L.z1,{skip:{pz:1,nz:1,px:1,nx:1},us:8});const ix=(L.x1-L.x0)*.18,iz=(L.z1-L.z0)*.18;gb.box(L.x0+ix,h1,L.z0+iz,L.x1-ix,L.h,L.z1-iz,{...off,noTop:1});roofB.box(L.x0+ix,L.h,L.z0+iz,L.x1-ix,L.h+.6,L.z1-iz,{us:8});}
  else{gb.box(L.x0,0,L.z0,L.x1,L.h,L.z1,{...off,noTop:1});if(L.kind==='house'){// pitched roof
    const cx=(L.x0+L.x1)/2,y=L.h,ry=y+3;const roofC=new THREE.Color([0x5a2a22,0x2a3a4a,0x3a3a3a,0x4a3020,0x2a4030,0x5a4a3a][L.col]);houseRoof.quad([L.x0-.5,y,L.z1+.5],[L.x1+.5,y,L.z1+.5],[L.x1+.5,ry,(L.z0+L.z1)/2],[L.x0-.5,ry,(L.z0+L.z1)/2],[0,.7,.7],[0,0,1,0,1,1,0,1],roofC);
    houseRoof.quad([L.x1+.5,y,L.z0-.5],[L.x0-.5,y,L.z0-.5],[L.x0-.5,ry,(L.z0+L.z1)/2],[L.x1+.5,ry,(L.z0+L.z1)/2],[0,.7,-.7],[0,0,1,0,1,1,0,1],roofC);
    houseRoof.quad([L.x0,y,L.z0],[L.x0,y,L.z1],[L.x0,ry,(L.z0+L.z1)/2],[L.x0,ry,(L.z0+L.z1)/2],[-1,0,0],[0,0,1,0,1,1,0,1],new THREE.Color(.8,.78,.72));houseRoof.quad([L.x1,y,L.z1],[L.x1,y,L.z0],[L.x1,ry,(L.z0+L.z1)/2],[L.x1,ry,(L.z0+L.z1)/2],[1,0,0],[0,0,1,0,1,1,0,1],new THREE.Color(.8,.78,.72));}
   else roofB.box(L.x0,L.h,L.z0,L.x1,L.h+.5,L.z1,{us:8});}
  // rooftop clutter + beacons
  if(L.kind==='tower'&&L.h>30){const n=2+(R()*3|0);for(let k=0;k<n;k++){const x=lerp(L.x0+3,L.x1-3,R()),z=lerp(L.z0+3,L.z1-3,R());const top=L.setback?L.h+.6:L.h+.5;roofB.box(x-1.5,top,z-1,x+1.5,top+1.6,z+1,{us:4});}if(L.h>70){const cx=(L.x0+L.x1)/2,cz=(L.z0+L.z1)/2;roofB.box(cx-.2,L.h,cz-.2,cx+.2,L.h+10,cz+.2,{us:4});beacons.push(new V(cx,L.h+10.4,cz));}}
  // neon: strip gets blade signs + marquees, downtown gets big rooftop/high signs
  const faces=[['pz',(L.x0+L.x1)/2,L.z1],['nz',(L.x0+L.x1)/2,L.z0],['px',L.x1,(L.z0+L.z1)/2],['nx',L.x0,(L.z0+L.z1)/2]];
  if(L.d==='strip'){for(const[f,x,z]of faces){if(R()<.85){const w=Math.min(10,(f==='pz'||f==='nz'?L.x1-L.x0:L.z1-L.z0)*.6);addSign(x,3.2+R()*.8,z,w,w/2,f,(R()*T.signCount)|0);}if(R()<.6&&L.h>14)addSign(x+(f==='pz'||f==='nz'?(R()-.5)*4:0),7+R()*(L.h-12),z+(f==='px'||f==='nx'?(R()-.5)*4:0),5,2.5,f,(R()*T.signCount)|0);}}
  else if(L.d==='downtown'&&R()<.6){const[f,x,z]=faces[(R()*4)|0];addSign(x,L.h*(.55+R()*.35),z,14,7,f,(R()*T.signCount)|0);}
  else if((L.d==='midtown')&&R()<.35){const[f,x,z]=faces[(R()*4)|0];addSign(x,3.4,z,8,4,f,(R()*T.signCount)|0);}
  else if(L.kind==='warehouse'&&R()<.5){const[f,x,z]=faces[(R()*4)|0];addSign(x,L.h-4,z,10,5,f,14);}}
 for(const k in FB){if(FB[k].empty)continue;const m=new THREE.Mesh(FB[k].geo(),FAC[k]);m.castShadow=true;m.receiveShadow=true;group.add(m);}
 {const m=new THREE.Mesh(roofB.geo(),M.roof);m.castShadow=m.receiveShadow=true;group.add(m);const hr=new THREE.Mesh(houseRoof.geo(),std({vertexColors:true,roughness:.8,side:THREE.DoubleSide}));hr.castShadow=true;group.add(hr);}
 const signMat=new THREE.MeshBasicMaterial({map:T.signs,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(1.6,1.6,1.6),side:THREE.DoubleSide,fog:true});const signMesh=new THREE.Mesh(signB.geo(),signMat);signMesh.renderOrder=2;group.add(signMesh);
 // containers (instanced, coloured)
 {const cs=city.lots.filter(l=>l.kind==='containers');let n=0;for(const c of cs)n+=c.stack;const im=new THREE.InstancedMesh(new THREE.BoxGeometry(12,2.55,2.5),std({color:0xffffff,roughness:.6,metalness:.5}),n);const m4=new THREE.Matrix4();let k=0;const cols=[0xb03020,0x2060a0,0x30804a,0xc08020,0x6a6a70];
  for(const c of cs)for(let s=0;s<c.stack;s++){m4.makeTranslation((c.x0+c.x1)/2,1.28+s*2.6,(c.z0+c.z1)/2);im.setMatrixAt(k,m4);im.setColorAt(k,new THREE.Color(cols[(c.col+s)%5]));k++;}im.castShadow=im.receiveShadow=true;group.add(im);}

 /* ---------- street lamps (instanced) ---------- */
 const lamps=city.lamps;const poleG=new THREE.CylinderGeometry(.11,.15,8,6);poleG.translate(0,4,0);const armG=new THREE.BoxGeometry(.12,.12,2.4);const headG=new THREE.BoxGeometry(.5,.16,.9);
 const poles=new THREE.InstancedMesh(poleG,M.pole,lamps.length),arms=new THREE.InstancedMesh(armG,M.pole,lamps.length);const headM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1.9,1.3)});const heads=new THREE.InstancedMesh(headG,headM,lamps.length);
 {const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new V(1,1,1);lamps.forEach((l,k)=>{m4.makeTranslation(l.x,0,l.z);poles.setMatrixAt(k,m4);const inward=-l.side;const yaw=l.ax==='x'?0:Math.PI/2;q.setFromAxisAngle(new V(0,1,0),yaw);
   const hx=l.ax==='x'?l.x:l.x+inward*1.2,hz=l.ax==='x'?l.z+inward*1.2:l.z;m4.compose(new V(hx,7.9,hz),q,s);arms.setMatrixAt(k,m4);const lx=l.ax==='x'?l.x:l.x+inward*2.2,lz=l.ax==='x'?l.z+inward*2.2:l.z;m4.compose(new V(lx,7.8,lz),q,s);heads.setMatrixAt(k,m4);l.hx=lx;l.hz=lz;});}
 poles.castShadow=true;group.add(poles,arms,heads);

 /* ---------- trees (instanced) ---------- */
 {const tr=city.trees;const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.26,2.4,6).translate(0,1.2,0),std({color:0x3a2a1e,roughness:1}),tr.length);const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2,1),std({color:0xffffff,roughness:.9,flatShading:true}),tr.length);
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sv=new V();tr.forEach((t,k)=>{m4.compose(new V(t.x,0,t.z),q,sv.set(t.s,t.s,t.s));trunk.setMatrixAt(k,m4);q.setFromEuler(new THREE.Euler(R(),R()*6,R()));m4.compose(new V(t.x,2.4*t.s+1.5*t.s,t.z),q,sv.set(t.s*1.1,t.s*(1+R()*.4),t.s*1.1));crown.setMatrixAt(k,m4);crown.setColorAt(k,new THREE.Color().setHSL(.25+R()*.08,.45,.18+R()*.1));q.identity();});
  trunk.castShadow=crown.castShadow=true;crown.receiveShadow=true;group.add(trunk,crown);}

 /* ---------- highway, ramps, pillars, bridges ---------- */
 {const deck=new GB(),bar=new GB(),barGlow=new GB(),dl=new GB();const D=8;
  for(const s of city.surfaces){if(s.kind==='deck'){deck.box(s.x0,s.top-.9,s.z0,s.x1,s.top,s.z1,{us:12,bottom:1});}}
  for(const r of city.ramps){const n=24;for(let k=0;k<n;k++){const xa=lerp(r.x0,r.x1,k/n),xb=lerp(r.x0,r.x1,(k+1)/n);const ha=r.dir>0?(xa-r.x0)/120*HY:(r.x1-xa)/120*HY,hb=r.dir>0?(xb-r.x0)/120*HY:(r.x1-xb)/120*HY;
    deck.quad([xa,ha,r.z1],[xb,hb,r.z1],[xb,hb,r.z0],[xa,ha,r.z0],[0,1,0],[xa/12,r.z1/12,xb/12,r.z1/12,xb/12,r.z0/12,xa/12,r.z0/12]);deck.quad([xb,hb-.9,r.z1],[xa,ha-.9,r.z1],[xa,ha-.9,r.z0],[xb,hb-.9,r.z0],[0,-1,0],[0,0,1,0,1,1,0,1]);
    for(const z of[r.z0,r.z1]){bar.quad([xa,ha,z],[xb,hb,z],[xb,hb+1.1,z],[xa,ha+1.1,z],[0,0,z===r.z0?-1:1],[0,0,1,0,1,1,0,1]);barGlow.quad([xa,ha+1.12,z],[xb,hb+1.12,z],[xb,hb+1.2,z],[xa,ha+1.2,z],[0,0,1],[0,0,1,0,1,1,0,1]);}}
   const pz=r.dir>0?[r.x0+20,r.x0+50,r.x0+80,r.x0+110]:[r.x1-20,r.x1-50,r.x1-80,r.x1-110];for(const x of pz){const h=r.dir>0?(x-r.x0)/120*HY:(r.x1-x)/120*HY;bar.box(x-.6,0,(r.z0+r.z1)/2-.6,x+.6,h-.9,(r.z0+r.z1)/2+.6,{us:4});}}
  // barriers along the ring (with gaps where ramps merge)
  const gaps=[[2*SP+120,2*SP+150,'s'],[7*SP-150,7*SP-120,'n']];const runBar=(x0,z0,x1,z1,side,skip)=>{const L=Math.hypot(x1-x0,z1-z0);const step=8;for(let s=0;s<L;s+=step){const t0=s/L,t1=Math.min(1,(s+step)/L);const ax=lerp(x0,x1,t0),az=lerp(z0,z1,t0),bx=lerp(x0,x1,t1),bz=lerp(z0,z1,t1);if(skip&&skip(ax,az,bx,bz))continue;
    bar.quad([ax,HY,az],[bx,HY,bz],[bx,HY+1.1,bz],[ax,HY+1.1,az],[0,0,1],[0,0,1,0,1,1,0,1]);bar.quad([bx,HY,bz],[ax,HY,az],[ax,HY+1.1,az],[bx,HY+1.1,bz],[0,0,-1],[0,0,1,0,1,1,0,1]);barGlow.quad([ax,HY+1.12,az],[bx,HY+1.12,bz],[bx,HY+1.2,bz],[ax,HY+1.2,az],[0,0,1],[0,0,1,0,1,1,0,1]);}};
  runBar(-D,-D,W+D,-D,0,(ax,az,bx)=>bx>gaps[1][0]&&ax<gaps[1][1]);runBar(-D,D,W+D,D,0,(ax,az,bx)=>false);runBar(-D,W-D,W+D,W-D,0);runBar(-D,W+D,W+D,W+D,0,(ax,az,bx)=>bx>gaps[0][0]&&ax<gaps[0][1]);
  runBar(-D,-D,-D,W+D);runBar(D,D,D,W-D);runBar(W-D,D,W-D,W-D);runBar(W+D,-D,W+D,W+D);
  // inner barriers would block the deck corners: the inner rails above are only between corners
  for(const p of city.pillars){bar.box(p.x-.8,-.1,p.z-.8,p.x+.8,HY-.9,p.z+.8,{us:4});bar.box(p.x-1.4,HY-1.6,p.z-1.4,p.x+1.4,HY-.9,p.z+1.4,{us:4});}
  // lane dashes on the deck
  for(const s of city.hwy){const along=s.x1-s.x0>s.z1-s.z0;for(const off of[-4,0,4]){const len=along?s.x1-s.x0:s.z1-s.z0;for(let t=2;t<len;t+=7){if(along)dl.box(s.x0+t,HY+.01,(s.z0+s.z1)/2+off-.08,s.x0+t+3.5,HY+.02,(s.z0+s.z1)/2+off+.08,{skip:{pz:1,nz:1,px:1,nx:1}});else dl.box((s.x0+s.x1)/2+off-.08,HY+.01,s.z0+t,(s.x0+s.x1)/2+off+.08,HY+.02,s.z0+t+3.5,{skip:{pz:1,nz:1,px:1,nx:1}});}}}
  const dm=new THREE.Mesh(deck.geo(),M.deck);dm.castShadow=dm.receiveShadow=true;group.add(dm);const bm=new THREE.Mesh(bar.geo(),M.barrier);bm.castShadow=true;group.add(bm);
  group.add(new THREE.Mesh(barGlow.geo(),new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,.9,.2)})));group.add(new THREE.Mesh(dl.geo(),M.line));}
 // river: water + embankments + bridge railings/arches
 const water=new THREE.Mesh(new THREE.PlaneGeometry(SP-ROAD,W+640),M.water);water.rotation.x=-Math.PI/2;water.position.set(6.5*SP,-3,W/2);group.add(water);
 {const emb=new GB(),rail=new GB();const x0=6*SP+HALF,x1=7*SP-HALF;emb.box(x0-.5,-5,-60,x0,0,W+60,{us:4});emb.box(x1,-5,-60,x1+.5,0,W+60,{us:4});
  for(let j=0;j<=N;j++){const z=j*SP;rail.box(x0-2,-.6,z-HALF-.4,x1+2,1.0,z-HALF,{us:4});rail.box(x0-2,-.6,z+HALF,x1+2,1.0,z+HALF+.4,{us:4});rail.box(x0,-.8,z-HALF,x1,-.2,z+HALF,{us:4,skip:{}});
   for(let k=0;k<3;k++){const ax=lerp(x0+6,x1-6,k/2);rail.box(ax-1,-4,z-HALF+1,ax+1,-.8,z+HALF-1,{us:4});}}
  const em=new THREE.Mesh(emb.geo(),M.concrete);em.receiveShadow=true;group.add(em);const rm=new THREE.Mesh(rail.geo(),M.concrete);rm.castShadow=true;group.add(rm);
  // bridge decks (asphalt over the water)
  const bd=new GB();for(let j=0;j<=N;j++){const z=j*SP;bd.box(x0-.5,-.2,z-HALF,x1+.5,.02,z+HALF,{skip:{pz:1,nz:1,px:1,nx:1},us:12});}const bdm=new THREE.Mesh(bd.geo(),M.road);bdm.receiveShadow=true;group.add(bdm);}
 // sea + docks (east)
 {const sea=new THREE.Mesh(new THREE.PlaneGeometry(900,W+900),M.water);sea.rotation.x=-Math.PI/2;sea.position.set(W+38+450,-3,W/2);group.add(sea);const dk=new GB();dk.box(W+HALF,-3,-40,W+38,0,W+40,{us:6});const dm=new THREE.Mesh(dk.geo(),M.planks);dm.receiveShadow=true;group.add(dm);
  const crane=new GB();for(const z of[60,190,300]){crane.box(W+30,0,z-6,W+31.5,26,z-4.5,{us:4});crane.box(W+30,0,z+4.5,W+31.5,26,z+6,{us:4});crane.box(W+12,26,z-6,W+70,28,z+6,{us:4});crane.box(W+28,28,z-1,W+33,34,z+1,{us:4});}const cm=new THREE.Mesh(crane.geo(),std({color:0xd09020,roughness:.5,metalness:.6}));cm.castShadow=true;group.add(cm);
  for(const z of[60,190,300])beacons.push(new V(W+69,28.6,z));city.addSolid(W+37,-60,W+40,W+60,{kind:'rail'});city.hash();}
 // hill + tunnel
 {const h=city.hill;const nx=64,nz=64;const g=new THREE.PlaneGeometry(h.x1-h.x0+20,h.z1-h.z0+20,nx,nz);g.rotateX(-Math.PI/2);const p=g.attributes.position;const cx=(h.x0+h.x1)/2,cz=(h.z0+h.z1)/2;
  for(let i=0;i<p.count;i++){const x=p.getX(i)+cx,z=p.getZ(i)+cz;const e=Math.min(x-h.x0,h.x1-x,z-h.z0,h.z1-z);let y=e<0?-.5:Math.min(1,e/14)**.8*22+Math.sin(x*.07)*Math.cos(z*.06)*3*Math.min(1,e/14);if(Math.abs(z-h.tz)<10&&e>-2)y=Math.max(y,9.5+Math.max(0,e)*.2);p.setY(i,y);p.setX(i,x);p.setZ(i,z);}
  g.computeVertexNormals();M.rock.map.repeat.set(8,8);const hm=new THREE.Mesh(g,std({map:T.rock,roughness:1}));hm.receiveShadow=hm.castShadow=true;group.add(hm);
  const tun=new GB();tun.box(h.x0-1,0,h.tz-HALF-1,h.x1+1,7.6,h.tz-HALF,{us:4,skip:{}});tun.box(h.x0-1,0,h.tz+HALF,h.x1+1,7.6,h.tz+HALF+1,{us:4});tun.box(h.x0-1,7.2,h.tz-HALF-1,h.x1+1,7.8,h.tz+HALF+1,{us:4,bottom:1});
  for(const x of[h.x0-1,h.x1+1]){tun.box(x-.6,0,h.tz-HALF-6,x+.6,9.5,h.tz-HALF,{us:4});tun.box(x-.6,0,h.tz+HALF,x+.6,9.5,h.tz+HALF+6,{us:4});tun.box(x-.6,7.4,h.tz-HALF,x+.6,9.5,h.tz+HALF,{us:4});}
  const tm=new THREE.Mesh(tun.geo(),M.concrete);tm.castShadow=tm.receiveShadow=true;group.add(tm);const tl=new GB();for(let x=h.x0+4;x<h.x1-2;x+=8)tl.box(x,7.1,h.tz-.5,x+3,7.2,h.tz+.5,{});group.add(new THREE.Mesh(tl.geo(),new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,1.6,.6)})));}
 // park: grass, paths, pond
 {const p=city.park;const gb=new GB();for(let x=p.x0;x<p.x1;x+=6)for(let z=p.z0;z<p.z1;z+=6){const xb=Math.min(p.x1,x+6),zb=Math.min(p.z1,z+6);if(Math.hypot((x+xb)/2-city.pondC.x,(z+zb)/2-city.pondC.z)<city.pondC.r+.5)continue;gb.quad([x,.06,zb],[xb,.06,zb],[xb,.06,z],[x,.06,z],[0,1,0],[x/8,zb/8,xb/8,zb/8,xb/8,z/8,x/8,z/8]);}const gm=new THREE.Mesh(gb.geo(),M.grass);gm.receiveShadow=true;group.add(gm);
  const pd=city.pondC;const pond=new THREE.Mesh(new THREE.CircleGeometry(pd.r,40),M.water);pond.rotation.x=-Math.PI/2;pond.position.set(pd.x,-.9,pd.z);group.add(pond);const bank=new THREE.Mesh(new THREE.CylinderGeometry(pd.r+.5,pd.r-1,1.2,40,1,true),M.dirt);bank.position.set(pd.x,-.5,pd.z);group.add(bank);
  const path=new GB();const mz=(p.z0+p.z1)/2;path.box(p.x0,.07,mz-2.5,p.x1,.08,mz+2.5,{skip:{pz:1,nz:1,px:1,nx:1},us:4});const mx=(p.x0+p.x1)/2-20;path.box(mx-2.5,.07,p.z0,mx+2.5,.08,mz-2.5,{skip:{pz:1,nz:1,px:1,nx:1},us:4});group.add(new THREE.Mesh(path.geo(),M.walk));}
 // kickers
 {const kg=new GB();const km=std({map:T.chevron,roughness:.6,metalness:.3});for(const k of city.kickers){const fx=k.fx,fz=k.fz,rx=fz,rz=-fx;const b0=[k.x-fx*k.len/2,k.z-fz*k.len/2],b1=[k.x+fx*k.len/2,k.z+fz*k.len/2];const w=k.w/2;
   const p=(b,s,y)=>[b[0]+rx*w*s,y,b[1]+rz*w*s];kg.quad(p(b0,1,.02),p(b0,-1,.02),p(b1,-1,k.hmax),p(b1,1,k.hmax),[0,1,0],[0,0,1,0,1,1,0,1]);kg.quad(p(b1,1,k.hmax),p(b1,-1,k.hmax),p(b1,-1,0),p(b1,1,0),[fx,0,fz],[0,0,1,0,1,.3,0,.3]);
   kg.quad(p(b0,1,0),p(b1,1,0),p(b1,1,k.hmax),p(b0,1,0),[rx,0,rz],[0,0,1,0,1,.3,0,.3]);kg.quad(p(b1,-1,0),p(b0,-1,0),p(b0,-1,0),p(b1,-1,k.hmax),[-rx,0,-rz],[0,0,1,0,1,.3,0,.3]);}
  const kmesh=new THREE.Mesh(kg.geo(),km);kmesh.castShadow=kmesh.receiveShadow=true;group.add(kmesh);}
 // garages (repair shops): sign + lit apron
 for(const s of city.shops){const sg=new THREE.Mesh(new THREE.PlaneGeometry(8,2),new THREE.MeshBasicMaterial({map:T.shop,color:new THREE.Color(1.8,1.8,1.8)}));const back=s.a===0?-1:-1;
  if(s.a===0){sg.position.set(s.x,5,s.z-WALK+.2+back*.1);}else{sg.position.set(s.x-WALK+.2,5,s.z);sg.rotation.y=Math.PI/2;}group.add(sg);
  const ap=new THREE.Mesh(new THREE.CircleGeometry(5,32),new THREE.MeshBasicMaterial({map:T.ring,color:new THREE.Color(1.6,.8,.25),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));ap.rotation.x=-Math.PI/2;ap.position.set(s.x,.25,s.z);group.add(ap);s.mesh=ap;}
 // beacons (blinking red)
 const beaconM=new THREE.MeshBasicMaterial({color:new THREE.Color(4,.2,.2)});const bIm=new THREE.InstancedMesh(new THREE.SphereGeometry(.45,8,6),beaconM,Math.max(1,beacons.length));beacons.forEach((b,k)=>bIm.setMatrixAt(k,new THREE.Matrix4().makeTranslation(b.x,b.y,b.z)));group.add(bIm);
 // distant skyline ring
 {const sk=new GB();const SR=rng(5);for(let k=0;k<70;k++){const a=k/70*Math.PI*2,d=700+SR()*250;const x=W/2+Math.cos(a)*d,z=W/2+Math.sin(a)*d;if(x>W+100&&Math.abs(z-W/2)<500&&SR()<.7)continue;const w=20+SR()*40,h=40+SR()*180;sk.box(x-w/2,0,z-w/2,x+w/2,h,z+w/2,{us:16,vs:16});}
  const m=new THREE.Mesh(sk.geo(),std({map:T.office.map,emissiveMap:T.glass.em,emissive:0xffffff,emissiveIntensity:0,color:0x30343c,roughness:.9}));group.add(m);FAC.sky=m.material;}

 /* ---------- sky dome ---------- */
 const skyU={uT:{value:0},top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunDir:{value:new V(0,1,0)},sunCol:{value:new THREE.Color()},night:{value:0},rain:{value:0}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vd;void main(){vd=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform float uT,night,rain;uniform vec3 top,hor,sunDir,sunCol;varying vec3 vd;${NOISE}
  void main(){float y=vd.y;vec3 c=mix(hor,top,pow(clamp(y,0.,1.),.55));c=mix(c,hor*.6,smoothstep(.0,-.2,y));
   float sd=max(0.,dot(vd,normalize(sunDir)));c+=sunCol*(pow(sd,600.)*6.+pow(sd,12.)*.35)*(1.-night*.9)*(1.-rain*.8);
   vec2 q=vd.xz/(y+.25);float cl=fbm(q*1.4+vec2(uT*.01,0.));float cov=smoothstep(.45-rain*.3,.8,cl)*smoothstep(0.,.25,y);vec3 cc=mix(hor*1.1,top*1.6+vec3(.05),.5)*(1.-night*.6);c=mix(c,cc,cov*.7);
   // stars + moon at night
   vec3 sp=floor(vd*300.);float st=step(.9975,h21(sp.xy+sp.z*7.))*smoothstep(.1,.5,y)*night*(1.-cov)*(1.-rain);c+=vec3(st)*1.2;
   vec3 md=normalize(vec3(-.4,.45,-.6));float m=dot(vd,md);c+=vec3(1.,.95,.85)*smoothstep(.9994,.9997,m)*night*1.6*(1.-rain*.7)+vec3(.4,.45,.6)*pow(max(0.,m),40.)*.25*night;
   // city glow near the horizon
   c+=vec3(.5,.28,.45)*pow(max(0.,1.-abs(y)*3.5),3.)*night*.35;c=mix(c,vec3(dot(c,vec3(.33)))*.9,rain*.5);
   gl_FragColor=vec4(c,1.);}`}));sky.renderOrder=-1;group.add(sky);

 /* ---------- lights ---------- */
 const hemi=new THREE.HemisphereLight(0xffffff,0x202020,.8);group.add(hemi);
 const sun=new THREE.DirectionalLight(0xffffff,2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:1,far:600});sun.shadow.bias=-.0004;sun.shadow.normalBias=.06;group.add(sun,sun.target);
 const pool=[];for(let k=0;k<8;k++){const l=new THREE.PointLight(0xffc890,0,36,1.6);group.add(l);pool.push(l);}
 const fog=new THREE.FogExp2(0x000000,.002);

 /* ---------- rain (shader line streaks around the camera) ---------- */
 const RN=2600;const rg=new THREE.BufferGeometry();const rp=new Float32Array(RN*2*3),rs=new Float32Array(RN*2*3),re=new Float32Array(RN*2);for(let i=0;i<RN;i++){const s=[Math.random(),Math.random(),Math.random()];for(let e=0;e<2;e++){rs.set(s,(i*2+e)*3);re[i*2+e]=e;}}
 rg.setAttribute('position',new THREE.BufferAttribute(rp,3));rg.setAttribute('seed',new THREE.BufferAttribute(rs,3));rg.setAttribute('endp',new THREE.BufferAttribute(re,1));
 const rainU={uT:{value:0},uC:{value:new V()},uAmt:{value:0},uWind:{value:new V(2,0,1)},uCol:{value:new THREE.Color(.6,.65,.75)}};
 const rain=new THREE.LineSegments(rg,new THREE.ShaderMaterial({uniforms:rainU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`attribute vec3 seed;attribute float endp;uniform float uT,uAmt;uniform vec3 uC,uWind;varying float vA;void main(){vec3 box=vec3(60.,30.,60.);vec3 p=seed*box;p.y=fract(seed.y-uT*.9*(.8+seed.x*.4))*box.y;p.xz+=uWind.xz*(p.y/box.y)*.6;
   vec3 o=uC-box*.5;o.y=uC.y-10.;vec3 w=mod(p-o,box)+o;w.y=o.y+p.y;w+= -vec3(uWind.x*.04,1.,uWind.z*.04)*endp*.9;vA=step(seed.z,uAmt)*(1.-endp*.7);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
  fragmentShader:'uniform vec3 uCol;varying float vA;void main(){if(vA<.01)discard;gl_FragColor=vec4(uCol*vA*.32,1.);}'}));rain.frustumCulled=false;group.add(rain);

 /* ---------- wet-road reflections: instanced streaks under nearby lights ---------- */
 const SN=140;const sgeo=new THREE.PlaneGeometry(1,1);sgeo.rotateX(-Math.PI/2);sgeo.translate(0,0,-.5);const smat=new THREE.MeshBasicMaterial({map:T.streak,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0xffffff,fog:true});
 const streaks=new THREE.InstancedMesh(sgeo,smat,SN);streaks.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(SN*3),3);streaks.count=0;streaks.frustumCulled=false;streaks.renderOrder=1;group.add(streaks);
 const lightSrc=[...lamps.map(l=>({x:l.hx,y:7.8,z:l.hz,col:new THREE.Color(1,.78,.5),lamp:1})),...signs.map(s=>({x:s.x,y:s.y,z:s.z,col:s.col,w:s.w}))];

 /* ---------- environment for reflections ---------- */
 let env=null,envDay=null;try{const es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(10,24,12),new THREE.MeshBasicMaterial({color:0x0c0e18,side:THREE.BackSide})));const cols=[0xff3fa0,0x30e0ff,0xffc060,0xa050ff,0xff6020,0x40ff90];
  for(let k=0;k<18;k++){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.4+Math.random()*2,.6+Math.random()),new THREE.MeshBasicMaterial({color:new THREE.Color(cols[k%6]).multiplyScalar(3),side:THREE.DoubleSide}));const a=k/18*Math.PI*2;p.position.set(Math.cos(a)*8,.5+Math.random()*4,Math.sin(a)*8);p.lookAt(0,0,0);es.add(p);}
  const top=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.MeshBasicMaterial({color:0x202a40,side:THREE.DoubleSide}));top.position.y=9;top.rotation.x=Math.PI/2;es.add(top);const pm=new THREE.PMREMGenerator(renderer);env=pm.fromScene(es,.02).texture;
  // daytime: warm sky gradient dome, dark ground
  const ds=new THREE.Scene();const dg=new THREE.SphereGeometry(10,32,16);const col=[];const pp=dg.attributes.position;for(let i=0;i<pp.count;i++){const y=pp.getY(i)/10;const c=y>0?new THREE.Color(1,.72,.5).lerp(new THREE.Color(.35,.5,.8),Math.pow(y,.6)):new THREE.Color(.12,.11,.1);col.push(c.r,c.g,c.b);}dg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));ds.add(new THREE.Mesh(dg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const sunp=new THREE.Mesh(new THREE.CircleGeometry(1.2,16),new THREE.MeshBasicMaterial({color:new THREE.Color(6,4.5,3),side:THREE.DoubleSide}));sunp.position.set(5,2,-7);sunp.lookAt(0,0,0);ds.add(sunp);envDay=pm.fromScene(ds,.02).texture;pm.dispose();}catch(e){}

 /* ---------- per-frame ---------- */
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sv=new V(),pv=new V(),tc=new THREE.Color();let t=0,blink=0;const state={night:0,wet:0,rain:0,hour:17};
 function setTime(hour,rainAmt,wet){const k=todAt(hour);state.night=k.night;state.rain=rainAmt;state.wet=wet;state.hour=hour;
  skyU.top.value.setRGB(...k.top).multiplyScalar(1-rainAmt*.35);skyU.hor.value.setRGB(...k.hor).lerp(new THREE.Color(.25,.26,.3).multiplyScalar(.3+(1-k.night)*.7),rainAmt*.6);skyU.night.value=k.night;skyU.rain.value=rainAmt;
  const el=k.el*Math.PI/180,az=-.9;const sd=new V(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az));skyU.sunDir.value.copy(sd);skyU.sunCol.value.setRGB(...k.sun);
  const night=k.night;const moon=new V(.4,.6,.6).normalize();const ld=night>.6?moon:sd.y>.05?sd:sd.clone().setY(.08).normalize();sun.userData.dir=ld;sun.color.setRGB(...k.sun);sun.intensity=k.si*(1-rainAmt*.6);
  hemi.color.setRGB(...k.hs);hemi.groundColor.setRGB(...k.hg);hemi.intensity=k.hi*(1-rainAmt*.25);fog.color.setRGB(...k.fog).lerp(new THREE.Color(.11,.12,.15).multiplyScalar(.35+(1-night)*1.5),rainAmt*.45);fog.density=k.fd*(1+rainAmt*.7);
  const win=cl((night-.15)/.6,0,1);for(const k2 in FAC)FAC[k2].emissiveIntensity=win*(k2==='ind'?.5:k2==='glass'?.55:.65);headM.color.setRGB(2.4,1.9,1.3).multiplyScalar(.1+.9*cl(night*1.6,0,1));signMat.color.setScalar(.35+1.5*cl(night*1.4,0,1));
  for(const m of wetMats){m.roughness=lerp(1,.34,wet);m.metalness=lerp(.05,.45,wet);m.envMapIntensity=lerp(.04,.85,wet);m.color.setScalar(lerp(1,.6,wet));}
  const useNight=night>.45;if(state.envNight!==useNight){state.envNight=useNight;state.env=useNight?env:envDay;}
  M.walk.roughness=lerp(.85,.45,wet);rainU.uAmt.value=rainAmt;state.exp=k.exp;}
 function update(dt,cam,focus){t+=dt;skyU.uT.value=t;rainU.uT.value=t;rainU.uC.value.copy(cam.position);sky.position.copy(cam.position);
  blink+=dt;beaconM.color.setRGB(blink%1.4<.5?4:.2,.15,.15);
  // sun shadow follows the focus
  const d=sun.userData.dir||new V(0,1,0);sun.position.set(focus.x+d.x*200,focus.y+d.y*200,focus.z+d.z*200);sun.target.position.set(focus.x,focus.y,focus.z);
  // street light pool: nearest lamps at night
  const lit=cl((state.night-.2)/.5,0,1);if(lit>0){const near=[];for(const l of lamps){const dd=(l.hx-focus.x)**2+(l.hz-focus.z)**2;if(dd<110*110)near.push([dd,l]);}near.sort((a,b)=>a[0]-b[0]);pool.forEach((p,k)=>{const n=near[k];if(n){p.position.set(n[1].hx,7.4,n[1].hz);p.intensity=lit*26;}else p.intensity=0;});}else pool.forEach(p=>p.intensity=0);
  // reflection streaks
  const amt=state.wet*(.25+.75*cl(state.night*1.4,0,1));let k=0;if(amt>.02){const cx=cam.position.x,cz=cam.position.z;const cand=[];for(const s of lightSrc){const dd=(s.x-cx)**2+(s.z-cz)**2;if(dd<150*150)cand.push([dd,s]);}cand.sort((a,b)=>a[0]-b[0]);
   for(const[dd,s]of cand){if(k>=SN)break;const dist=Math.sqrt(dd);const dx=cx-s.x,dz=cz-s.z;const yaw=Math.atan2(-dx,-dz);const len=lerp(4,18,cl(dist/80,0,1))+s.y*.6,wid=s.lamp?1.6:Math.min(4,(s.w||4)*.45);
    q.setFromAxisAngle(sv.set(0,1,0),yaw+Math.PI);m4.compose(pv.set(s.x,.06+city.heightAt(s.x,s.z,1)*0,s.z),q,sv.set(wid,1,len));streaks.setMatrixAt(k,m4);tc.copy(s.col).multiplyScalar(amt*(s.lamp?.55:.9)*cl(1.4-dist/150,0,1));streaks.setColorAt(k,tc);k++;}}
  streaks.count=k;if(k){streaks.instanceMatrix.needsUpdate=true;streaks.instanceColor.needsUpdate=true;}}
 state.env=envDay;return{group,update,setTime,state,sun,hemi,fog,env,envDay,M,FAC,pool,signs,lamps,beacons,rain};}
