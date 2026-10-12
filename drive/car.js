// NIGHT DRIVE — car models (merged geometry: paint + glow) and arcade car physics with drift, handbrake, ramps, air time, collisions, damage.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v;

export const CARS=[
 {id:'cab',name:'CHECKER CAB',blurb:'The company car. Balanced, honest, yellow.',unlock:0,max:47,acc:15,brake:30,grip:7.5,drift:1.6,steer:2.2,dur:1,mass:1,paint:0xffc21a,shape:'cab'},
 {id:'mule',name:'MULE VAN',blurb:'Tanky box on wheels. +30% delivery pay, shrugs off crashes.',unlock:1500,max:40,acc:11,brake:26,grip:7,drift:1.8,steer:1.9,dur:.55,mass:1.5,paint:0x2ab0a0,shape:'van'},
 {id:'viper',name:'VIPER V8',blurb:'Muscle. Huge torque, loose rear end.',unlock:4000,max:58,acc:19,brake:30,grip:6,drift:1.3,steer:2.15,dur:.9,mass:1.2,paint:0xd0201a,shape:'muscle'},
 {id:'kitsune',name:'KITSUNE GT',blurb:'Drift coupe. Slides forever, drift tips ×1.5.',unlock:8000,max:54,acc:17,brake:32,grip:6.5,drift:1.05,steer:2.5,dur:.95,mass:.95,paint:0xc020ff,shape:'coupe'},
 {id:'phantom',name:'PHANTOM RS',blurb:'Hypercar. Brutal speed and grip, glass jaw.',unlock:15000,max:70,acc:24,brake:38,grip:8.5,drift:1.5,steer:2.3,dur:1.35,mass:.9,paint:0x18181c,shape:'super'}];
export const POLICE={id:'police',name:'INTERCEPTOR',max:56,acc:19,brake:34,grip:8,drift:1.6,steer:2.3,dur:.7,mass:1.3,paint:0x101418,shape:'police'};
export const RIVAL={id:'rival',max:53,acc:17,brake:32,grip:7.8,drift:1.6,steer:2.3,dur:.8,mass:1,shape:'coupe'};

/* ================= models ================= */
// bodies are extruded side profiles (wheel arches, raked glass, fender humps, tumblehome) with glass insets, merged into one vertex-coloured mesh
function geoBox(w,h,d,x,y,z,taper=0,tz=0){const g=new THREE.BoxGeometry(w,h,d);const p=g.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)>0){p.setX(i,p.getX(i)*(1-taper));p.setZ(i,p.getZ(i)*(1-taper*.6)+tz);}}g.translate(x,y,z);return g;}
function colorize(g,c){const n=g.attributes.position.count,a=new Float32Array(n*3);const col=new THREE.Color(c);for(let i=0;i<n;i++){a[i*3]=col.r;a[i*3+1]=col.g;a[i*3+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
function merge(list){// list of [geo,color] -> one indexed geometry
 let vc=0,ic=0;for(const[g]of list){vc+=g.attributes.position.count;ic+=g.index?g.index.count:g.attributes.position.count;}
 const P=new Float32Array(vc*3),N=new Float32Array(vc*3),C=new Float32Array(vc*3),UV=new Float32Array(vc*2),I=new Uint32Array(ic);let vo=0,io=0;
 for(const[g,c]of list){if(c!=null)colorize(g,c);const n=g.attributes.position.count;P.set(g.attributes.position.array,vo*3);N.set(g.attributes.normal.array,vo*3);C.set(g.attributes.color.array,vo*3);if(g.attributes.uv)UV.set(g.attributes.uv.array,vo*2);
  if(g.index){const a=g.index.array;for(let k=0;k<a.length;k++)I[io+k]=a[k]+vo;io+=a.length;}else{for(let k=0;k<n;k++)I[io+k]=vo+k;io+=n;}vo+=n;g.dispose();}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(N,3));out.setAttribute('color',new THREE.BufferAttribute(C,3));out.setAttribute('uv',new THREE.BufferAttribute(UV,2));out.setIndex(new THREE.BufferAttribute(I,1));out.computeBoundingSphere();return out;}
// side profile [[z,y]...] extruded across the car (x); th = tumblehome (top narrows) between y0..y1
function extrude(pts,w,o={}){const sh=new THREE.Shape();pts.forEach(([z,y],k)=>k?sh.lineTo(z,y):sh.moveTo(z,y));const b=o.bev??.05;
 const g=new THREE.ExtrudeGeometry(sh,{depth:w-2*b,bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelOffset:-b,bevelSegments:2,curveSegments:4});g.translate(0,0,-(w-2*b)/2);g.rotateY(-Math.PI/2);
 if(o.th){const p=g.attributes.position;for(let i=0;i<p.count;i++){const t=cl((p.getY(i)-o.y0)/(o.y1-o.y0),0,1);p.setX(i,p.getX(i)*(1-o.th*t));}}g.deleteAttribute('uv');g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;}
// flat convex polygon (fan) facing n
function poly(pts,n){const P=[],N=[];const a=new V(...pts[0]);for(let k=1;k<pts.length-1;k++){let b=new V(...pts[k]),c=new V(...pts[k+1]);const f=new V().subVectors(b,a).cross(new V().subVectors(c,a));if(f.dot(new V(...n))<0){const t=b;b=c;c=t;}P.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);N.push(...n,...n,...n);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(P.length/3*2),2));return g;}
const arch=(cz,cy,r,n=7)=>{const o=[];for(let k=0;k<=n;k++){const a=Math.PI*(1-k/n);o.push([cz+r*Math.cos(a),cy+r*Math.sin(a)]);}return o;};
// per-shape proportions: L length, W width, wb half wheelbase, r wheel radius, nose/hoodF/cowl/belt/deck/tail heights, zA windshield base, zRF/zRR roof ends, zC rear glass base, roof height, hl light height
const SHP={sedan:{L:4.6,W:1.92,wb:1.42,r:.37,nose:.42,hoodF:.8,cowl:.93,zA:.62,belt:.96,zC:-1.45,deck:.94,tail:.86,zRF:-.02,zRR:-1.05,roof:1.46,hl:.66,win:2},
 hatch:{L:4.0,W:1.84,wb:1.25,r:.35,nose:.44,hoodF:.82,cowl:.96,zA:.72,belt:.98,zC:-1.86,deck:.98,tail:.95,zRF:.05,zRR:-1.6,roof:1.5,hl:.7,win:2},
 muscle:{L:4.8,W:2.0,wb:1.5,r:.39,nose:.44,hoodF:.78,cowl:.9,zA:.3,belt:.92,zC:-1.78,deck:.9,tail:.86,zRF:-.34,zRR:-1.02,roof:1.32,hl:.64,win:1},
 coupe:{L:4.4,W:1.92,wb:1.36,r:.37,nose:.38,hoodF:.7,cowl:.84,zA:.5,belt:.86,zC:-1.82,deck:.86,tail:.84,zRF:-.22,zRR:-.98,roof:1.26,hl:.6,win:1},
 super:{L:4.6,W:2.04,wb:1.45,r:.37,nose:.34,hoodF:.58,cowl:.74,zA:.8,belt:.8,zC:-2.02,deck:.82,tail:.8,zRF:-.04,zRR:-.72,roof:1.13,hl:.52,win:1,sill:.26},
 van:{L:5.1,W:2.05,wb:1.65,r:.4,nose:.5,hoodF:1.0,cowl:1.22,zA:1.75,belt:1.28,zC:-2.52,deck:1.28,tail:1.28,zRF:1.06,zRR:-2.5,roof:2.06,hl:.82,win:0,th:.06}};
SHP.cab=SHP.sedan;SHP.police=SHP.sedan;
function bodyParts(s,P,body){const S=SHP[s],{L,W,wb,r}=S,h=L/2,sill=S.sill??.3,ar=r+.05,wy=r,top=wy+ar+.07;
 // top line front -> rear, with fender humps over the wheels
 let tl=[[h-.14,S.hoodF],[S.zA,S.cowl],[S.zC,S.belt]];if(S.zC>-h+.26)tl.push([-h+.2,S.deck]);tl.push([-h+.02,S.tail]);
 const yAt=z=>{for(let k=0;k<tl.length-1;k++){const[a0,b0]=tl[k],[a1,b1]=tl[k+1];if(z<=a0&&z>=a1)return b0+(b1-b0)*(a0-z)/((a0-a1)||1);}return tl[tl.length-1][1];};
 const fz=[];for(const c of[wb,-wb])for(const d of[.62,.32,0,-.32,-.62])fz.push(c+d);for(const z of fz)if(z<h-.16&&z>-h+.04)tl.push([z,yAt(z)]);tl.sort((p,q)=>q[0]-p[0]);
 tl=tl.map(([z,y])=>{let m=y;for(const c of[wb,-wb]){const d=Math.abs(z-c);if(d<.66)m=Math.max(m,top-(d>.34?(d-.34)*.25:0));}return[z,m];});
 const lower=[[-h+.12,sill+.04],[-wb-ar,sill],...arch(-wb,wy,ar),[-wb+ar,sill],[wb-ar,sill],...arch(wb,wy,ar),[wb+ar,sill],[h-.12,sill+.04],[h,S.nose],[h,S.hl+.12],...tl,[-h,S.tail-.1],[-h,sill+.16]];
 body.push([extrude(lower,W,{bev:.06}),P]);
 // greenhouse (painted) + glass insets
 const ru=(S.zRF-S.zRR);const cab=[[S.zA+.02,S.cowl-.04],[S.zA+(S.zRF-S.zA)*.88,S.cowl+(S.roof-S.cowl)*.93],[S.zRF-ru*.12,S.roof],[S.zRR+ru*.12,S.roof],[S.zRR+(S.zC-S.zRR)*.1,S.roof-(S.roof-S.belt)*.06],[S.zC-.02,S.belt-.04]];
 const Wc=W-.18,th=S.th??.2,y0=Math.min(S.cowl,S.belt),y1=S.roof,xs=y=>(Wc/2)*(1-th*cl((y-y0)/(y1-y0),0,1));body.push([extrude(cab,Wc,{bev:.05,th,y0,y1}),s==='police'?0xf0f0f0:P]);
 const fzA=y=>S.zA+(S.zRF-S.zA)*((y-S.cowl)/(S.roof-S.cowl)),rzC=y=>S.zC+(S.zRR-S.zC)*((y-S.belt)/(S.roof-S.belt));
 // windshield + rear glass
 const ws=(z0,y0_,z1,y1_,front)=>{const dz=z1-z0,dy=y1_-y0_,l=Math.hypot(dz,dy);const n=front?[0,-dz/l,dy/l]:[0,dz/l,-dy/l];const o=.045;const pa=[z0+dz*.07,y0_+dy*.07],pb=[z0+dz*.9,y0_+dy*.9];
  const pts=[[-(xs(pa[1])-.07),pa[1],pa[0]],[xs(pa[1])-.07,pa[1],pa[0]],[xs(pb[1])-.1,pb[1],pb[0]],[-(xs(pb[1])-.1),pb[1],pb[0]]].map(([x,y,z])=>[x,y+n[1]*o,z+n[2]*o]);body.push([poly(pts,n),GLASS]);};
 ws(S.zA,S.cowl,S.zRF,S.roof,true);if(S.win)ws(S.zC,S.belt,S.zRR,S.roof,false);
 // side windows (B pillar split on 4-doors, front-only on the van)
 const yb=Math.max(S.cowl,S.belt)+.06,yt=S.roof-.08;const fr=[fzA(yb)-.1,fzA(yt)-.1],re=S.win?[rzC(yb)+.1,rzC(yt)+.1]:[S.zA-.9,S.zA-.9];const zm=(S.zRF+S.zRR)/2-.1;
 const spans=S.win===2?[[zm+.06,9],[-9,zm-.06]]:[[-9,9]];
 for(const sd of[-1,1])for(const[za,zb]of spans){const pts=[[Math.max(za,re[0]),yb],[Math.min(zb,fr[0]),yb],[Math.min(zb,fr[1]),yt],[Math.max(za,re[1]),yt]];body.push([poly(pts.map(([z,y])=>[sd*(xs(y)+.012),y,z]),[sd,0,0]),GLASS]);}
 // door seams, handles, sills, bumpers, grille, mirrors
 for(const sd of[-1,1]){const x=sd*(W/2+.003);const dz=S.win===2?[S.zA-.05,zm,S.zC+.15]:[S.zA-.05,S.zC+.2];if(s!=='van')for(const z of dz)body.push([geoBox(.012,Math.max(.2,S.belt-sill-.12),.025,x,(S.belt+sill)/2+.02,z),DARK]);
  body.push([geoBox(.03,.035,.16,sd*(W/2+.01),S.belt-.1,S.zA-.3),CHROME]);if(S.win===2)body.push([geoBox(.03,.035,.16,sd*(W/2+.01),S.belt-.1,zm-.3),CHROME]);
  body.push([geoBox(.05,.1,2*wb-2*ar-.1,sd*(W/2-.01),sill+.06,0),DARK]);body.push([geoBox(.14,.1,.18,sd*(W/2+.07),Math.max(S.cowl,S.belt)+.08,S.zA-.12,.2),P]);body.push([geoBox(.012,.07,.13,sd*(W/2+.14),Math.max(S.cowl,S.belt)+.08,S.zA-.12),GLASS]);}
 body.push([geoBox(W+.03,.16,.14,0,sill+.14,h-.04),DARK]);body.push([geoBox(W+.03,.18,.14,0,sill+.15,-h+.04),DARK]);body.push([geoBox(W*.42,.13,.04,0,S.hl-.04,h+.005),0x0a0a0c]);body.push([geoBox(W*.42,.02,.03,0,S.hl+.04,h+.02),CHROME]);
 return S;}
const paintCache=new Map();
function paintMat(){if(!paintCache.has('p'))paintCache.set('p',new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.32,metalness:.3,clearcoat:.85,clearcoatRoughness:.08,envMapIntensity:.7}));return paintCache.get('p');}
const glowMat=new THREE.MeshBasicMaterial({vertexColors:true});
// wheel: tyre (rounded lathe) + 5-spoke alloy + hub in one vertex-coloured mesh
const wheelGeo=(()=>{const r=.37,w=.27,pr=[];for(let k=0;k<=4;k++){const a=-Math.PI/2+Math.PI*k/4;pr.push(new THREE.Vector2(r-.05+Math.cos(a)*.05,Math.sin(a)*w/2));}pr.unshift(new THREE.Vector2(.25,-w/2+.02));pr.push(new THREE.Vector2(.25,w/2-.02));
 const tyre=new THREE.LatheGeometry(pr,14);const parts=[[tyre,0x101012]];const rim=new THREE.CylinderGeometry(.25,.25,w-.03,12,1,true);parts.push([rim,0x2a2c30]);
 for(const sd of[-1,1]){const disc=new THREE.CylinderGeometry(.08,.08,.03,6).translate(0,sd*(w/2-.04),0);parts.push([disc,0xd0d4dc]);for(let k=0;k<5;k++){const sp=new THREE.BoxGeometry(.055,.03,.21).translate(0,sd*(w/2-.05),.12);sp.rotateY(k/5*Math.PI*2);parts.push([sp,0xc0c4cc]);}
  const lip=new THREE.CylinderGeometry(.25,.25,.025,12,1,true).translate(0,sd*(w/2-.03),0);parts.push([lip,0xd8dce4]);}
 const g=merge(parts);g.rotateZ(Math.PI/2);return g;})();
const wheelMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.55,envMapIntensity:.8});
// soft contact shadow + headlight wash on the road (both shared, faded per frame by setCarFx)
const blobTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,4,32,32,32);g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(.55,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const beamTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');for(let y=0;y<128;y++){const t=1-y/127,hw=6+t*26,a=Math.pow(1-t,1.6)*Math.min(1,t*6);const g=x.createLinearGradient(32-hw,0,32+hw,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,y,64,1);}const t=new THREE.CanvasTexture(c);return t;})();
const blobMat=new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,color:0xffffff});
export const beamMat=new THREE.MeshBasicMaterial({map:beamTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0x000000,polygonOffset:true,polygonOffsetFactor:-3});
const blobGeo=new Map(),beamGeo=new THREE.PlaneGeometry(4.6,15).rotateX(-Math.PI/2).rotateY(Math.PI).translate(0,.07,7.5);
export function setCarFx(night,wet){beamMat.color.setRGB(1,.92,.78).multiplyScalar(cl((night-.3)*1.6,0,1)*(.32+wet*.25));}
const DARK=0x15161a,GLASS=0x080d16,CHROME=0xc8ccd4,HEAD=0xffffff,TAIL=0xff1020;
const geoCache=new Map();
export function carModel(spec,paint,o={}){const s=spec.shape,P=paint??spec.paint;const key=s+'|'+P;let G=geoCache.get(key);
 if(!G){const body=[],glow=[];const b=(w,h,d,x,y,z,c,t,tz)=>body.push([geoBox(w,h,d,x,y,z,t,tz),c]);const gl=(w,h,d,x,y,z,c)=>glow.push([geoBox(w,h,d,x,y,z),c]);
  let L=4.5,W=1.95,wb=1.4,hl=.72,wr=.37;
  if(s==='truck'){L=6.4;W=2.2;wb=2.1;wr=.4;b(W,1.0,1.9,0,1.05,2.1,P,.04);b(1.9,.45,.5,0,1.5,2.75,GLASS,.05);b(W+.1,2.2,4.2,0,1.75,-.95,0xe8e8e8);b(W+.06,.06,4.22,0,2.86,-.95,0xb8b8b8);for(let k=0;k<6;k++)b(W+.12,.05,.05,0,1.0+k*.36,-3.04,0xa0a0a0);b(W+.04,.25,L,0,.45,0,DARK);b(.1,.5,.08,-W/2+.05,1.6,2.0,DARK);b(.1,.5,.08,W/2-.05,1.6,2.0,DARK);hl=.9;}
  else{const S=bodyParts(s,P,body);L=S.L;W=S.W;wb=S.wb;hl=S.hl;wr=S.r;const R=S.roof,zr=(S.zRF+S.zRR)/2;
   if(s==='cab'){for(let k=0;k<9;k++)b(.03,.1,.24,-W/2-.005,S.belt-.2,-1.5+k*.33,k%2?0xffffff:0x111111);for(let k=0;k<9;k++)b(.03,.1,.24,W/2+.005,S.belt-.2,-1.5+k*.33,k%2?0xffffff:0x111111);b(.84,.06,.3,0,R+.04,zr,DARK);gl(.78,.22,.26,0,R+.17,zr,0xffe060);}
   if(s==='police'){b(1.2,.07,.34,0,R+.04,zr,DARK);for(const sd of[-1,1])b(.03,.3,1.5,sd*(W/2+.004),S.belt-.24,.1,0xf0f0f0);b(W*.62,.16,.12,0,S.nose+.04,L/2+.06,0x222428);}
   if(s==='muscle'){b(.62,.12,1.0,0,S.hoodF+.08,1.15,DARK,.25);b(W*.86,.05,.34,0,S.tail+.06,-L/2+.2,P);for(const sd of[-1,1])b(.12,.07,.6,sd*.55,.26,-L/2+.05,0x9a9ca0);}
   if(s==='coupe'){b(1.74,.05,.34,0,S.deck+.34,-L/2+.3,P);for(const sd of[-1,1])b(.06,.3,.18,sd*.6,S.deck+.16,-L/2+.32,DARK);gl(W-.1,.03,L-.9,0,.22,0,0xff30d0);}
   if(s==='super'){b(1.9,.05,.46,0,S.deck+.3,-L/2+.25,DARK);for(const sd of[-1,1]){b(.06,.24,.24,sd*.66,S.deck+.15,-L/2+.3,DARK);b(.04,.2,.7,sd*(W/2+.003),.55,-.55,0x050506);}b(W*.8,.1,.1,0,.32,-L/2+.02,0x050506);gl(W-.1,.025,.06,0,S.hl+.08,L/2+.01,0x30e0ff);gl(W-.3,.035,.05,0,S.tail-.06,-L/2-.01,0xff2030);}
   if(s==='van'){b(W+.01,.1,L-1.4,0,1.06,-.5,0xffffff);b(W-.3,.08,L-1.2,0,R+.06,-.4,DARK);for(const sd of[-1,1])b(.02,.85,.02,sd*(W/2+.003),.95,-.3,DARK);b(.02,.9,.02,0,1.05,-L/2-.01,DARK);}}
  // lights
  const fz=L/2+.01,rz=-L/2-.01,hw=W/2-.3;
  gl(.42,.13,.05,-hw,hl,fz,HEAD);gl(.42,.13,.05,hw,hl,fz,HEAD);gl(.1,.05,.05,-W/2+.12,hl-.12,fz,0xffa020);gl(.1,.05,.05,W/2-.12,hl-.12,fz,0xffa020);
  gl(.5,.12,.05,-hw+.02,s==='truck'?.9:hl+.06,rz,TAIL);gl(.5,.12,.05,hw-.02,s==='truck'?.9:hl+.06,rz,TAIL);if(s!=='truck'&&s!=='super')gl(W*.42,.03,.04,0,hl+.06,rz,0x5a0000);gl(.18,.05,.05,0,hl+.2+(s==='van'?.6:0),rz,0xff2020);
  G={body:merge(body),glow:merge(glow),L,W,wb,hl,wr};geoCache.set(key,G);}
 const{L,W,wb}=G;const g=new THREE.Group();const bm=new THREE.Mesh(G.body,paintMat());bm.castShadow=!o.noShadow;bm.receiveShadow=false;g.add(bm);const gm=new THREE.Mesh(G.glow,glowMat);g.add(gm);
 const bk=L+'x'+W;if(!blobGeo.has(bk))blobGeo.set(bk,new THREE.PlaneGeometry(W+1.1,L+1.2).rotateX(-Math.PI/2).translate(0,.04,0));const blob=new THREE.Mesh(blobGeo.get(bk),blobMat);blob.renderOrder=1;g.add(blob);
 const beam=new THREE.Mesh(beamGeo,beamMat);beam.position.z=L/2;beam.renderOrder=1;beam.frustumCulled=false;g.add(beam);
 const wheels=[];const ws=G.wr/.37;for(const[x,z]of[[-W/2+.17,wb],[W/2-.17,wb],[-W/2+.17,-wb],[W/2-.17,-wb]]){const pivot=new THREE.Group();pivot.position.set(x,G.wr,z);const w=new THREE.Mesh(wheelGeo,wheelMat);w.scale.setScalar(ws);w.castShadow=!o.noShadow;pivot.add(w);g.add(pivot);wheels.push({pivot,w,front:z>0});}
 g.userData={body:bm,glow:gm,wheels,L,W,blob,beam};return g;}

/* ================= physics ================= */
export class Car{
 constructor(spec,model){this.spec=spec;this.model=model;this.x=0;this.y=0;this.z=0;this.a=0;this.vx=0;this.vz=0;this.vy=0;this.w=0;this.onGround=true;this.air=0;this.dmg=0;this.slip=0;this.rampVy=0;this.surf=null;this.pitch=0;this.roll=0;this.spin=0;this.steerVis=0;this.nitro=1;this.nitroOn=false;this.hits=[];this.landed=0;this.lastImpact=0;this.water=0;}
 get speed(){return Math.hypot(this.vx,this.vz);}
 get fwdSpeed(){return this.vx*Math.sin(this.a)+this.vz*Math.cos(this.a);}
 place(x,z,a,city,y=.5){this.x=x;this.z=z;this.a=a;this.vx=this.vz=this.vy=this.w=0;this.y=city?city.heightAt(x,z,y):0;this.onGround=true;this.air=0;}
 step(inp,dt,city,opt={}){const S=this.spec,c=this;this.hits.length=0;const sa=Math.sin(c.a),ca=Math.cos(c.a);let vf=c.vx*sa+c.vz*ca,vr=c.vx*ca-c.vz*sa;
  const dmgK=1-Math.min(.45,c.dmg/220);const surfGrip=opt.grip??1;const wet=opt.wet||0;
  if(c.onGround){const top=S.max*dmgK*(c.nitroOn?1.22:1)*(opt.topK||1);
   if(inp.thr>0){if(vf<-.5)vf+=S.brake*inp.thr*dt;else{const k=1-Math.max(0,vf)/top;vf+=S.acc*inp.thr*Math.max(k<0?k*2:.06,k)*(c.nitroOn?1.5:1)*dt;}}
   if(inp.brk>0){if(vf>.5)vf-=S.brake*inp.brk*dt;else vf=Math.max(-13,vf-S.acc*.55*inp.brk*dt);}
   vf-=vf*(.08+(inp.thr||inp.brk?0:.32))*dt;if(Math.abs(vf)<.05&&!inp.thr&&!inp.brk)vf=0;
   if(inp.hb){vf-=Math.sign(vf)*Math.min(Math.abs(vf),2.4*dt);}
   const grip=(inp.hb?S.drift:S.grip*2.4*(1-wet*.25))*surfGrip;const lat0=vr;vr-=vr*Math.min(1,grip*dt);vf-=Math.sign(vf)*Math.min(Math.abs(vf),Math.abs(lat0-vr)*.14);
   const sp=Math.abs(vf);const steerK=Math.min(1,sp/5)/(1+sp*.022);let target=inp.steer*S.steer*steerK*(vf<-.3?-1:1)*(inp.hb?1.45:1);
   // counter-steer assist + slide yaw: lateral slip feeds yaw so drifts hold
   target+=cl(vr*.035,-.6,.6)*(inp.hb||Math.abs(vr)>3?1:0)*-Math.sign(vf||1)*0;
   c.w+=(target-c.w)*Math.min(1,dt*(inp.hb?6:9));}
  else{vf-=vf*.015*dt;c.w+=(inp.steer*.9-c.w)*Math.min(1,dt*1.5);}
  // velocity stays in world space; the body yaws underneath it (that is what makes slides and drifts)
  c.vx=sa*vf+ca*vr;c.vz=ca*vf-sa*vr;c.a+=c.w*dt;const sb=Math.sin(c.a),cb=Math.cos(c.a);c.slip=Math.abs(vr);c.vf=vf;
  // water: heavy drag
  if(c.water>0){c.vx*=Math.exp(-dt*2.2);c.vz*=Math.exp(-dt*2.2);}
  // move with walled-surface edges
  let nx=c.x+c.vx*dt,nz=c.z+c.vz*dt;
  if(c.onGround&&c.surf&&c.surf.walled){const gh=city.heightAt(nx,nz,c.y);if(gh<c.y-1.1){const s=c.surf;let n=null;if(nx<s.x0&&c.x>=s.x0)n=[1,0];else if(nx>s.x1&&c.x<=s.x1)n=[-1,0];else if(nz<s.z0&&c.z>=s.z0)n=[0,1];else if(nz>s.z1&&c.z<=s.z1)n=[0,-1];
    if(n){const vn=c.vx*n[0]+c.vz*n[1];if(vn<0){c.vx-=1.35*vn*n[0];c.vz-=1.35*vn*n[1];c.hits.push({imp:-vn,n,kind:'rail',x:c.x,z:c.z});}c.vx*=.92;c.vz*=.92;nx=c.x+c.vx*dt;nz=c.z+c.vz*dt;if(city.heightAt(nx,nz,c.y)<c.y-1.1){nx=c.x;nz=c.z;}}}}
  c.x=nx;c.z=nz;
  // vertical
  const g=city.heightAt(c.x,c.z,c.y);c.surf=city._sf;
  if(c.onGround){if(g<c.y-.7){c.onGround=false;c.vy=c.rampVy*1.2;c.air=0;}else{const rv=(g-c.y)/Math.max(dt,1e-3);c.rampVy=c.rampVy*.6+rv*.4;c.y=g;c.vy=0;}}
  else{c.vy-=21*dt;c.y+=c.vy*dt;c.air+=dt;const g2=city.heightAt(c.x,c.z,c.y+.6);if(c.y<=g2){c.lastImpact=-c.vy;c.y=g2;c.vy=0;c.onGround=true;c.landed=c.air;c.rampVy=0;}}
  c.water=city.baseGround(c.x,c.z)<-.5&&c.y<-.3?1:0;
  // solids: two circles along the body
  const L=(c.model&&c.model.userData.L||4.5)*.3,r=1.05;for(const off of[L,-L]){const px=c.x+sb*off,pz=c.z+cb*off;for(const s of city.near(px,pz)){if(s.y0>c.y+1.6||s.y1<c.y+.2)continue;
    const qx=cl(px,s.x0,s.x1),qz=cl(pz,s.z0,s.z1);let dx=px-qx,dz=pz-qz,d=Math.hypot(dx,dz);if(d>=r)continue;if(d<1e-4){const ex=[px-s.x0,s.x1-px,pz-s.z0,s.z1-pz];const m=Math.min(...ex);const k=ex.indexOf(m);dx=k===0?-1:k===1?1:0;dz=k===2?-1:k===3?1:0;d=0;}else{dx/=d;dz/=d;}
    const pen=r-d;c.x+=dx*pen;c.z+=dz*pen;const vn=c.vx*dx+c.vz*dz;if(vn<0){c.vx-=1.3*vn*dx;c.vz-=1.3*vn*dz;c.vx*=.8;c.vz*=.8;c.w+=(off>0?1:-1)*vn*.02*(Math.random()<.5?1:-1);c.hits.push({imp:-vn,n:[dx,dz],kind:s.kind,x:px,z:pz,solid:s});}}}
  // visuals
  const sp=c.speed;c.spin+=(c.vf||0)*dt/.38;c.steerVis+=(inp.steer*.45-c.steerVis)*Math.min(1,dt*10);
  const wantPitch=c.onGround?cl(-(inp.thr-inp.brk)*.02*Math.min(1,sp/8),-.04,.04)+(c.rampVy?cl(-c.rampVy/Math.max(sp,4),-.3,.3):0):cl(-c.vy*.02,-.35,.35);c.pitch+=(wantPitch-c.pitch)*Math.min(1,dt*6);
  c.roll+=(cl(-c.w*sp*.006,-.09,.09)-c.roll)*Math.min(1,dt*6);
  const m=c.model;if(m){m.position.set(c.x,c.y,c.z);m.rotation.set(0,c.a,0);m.rotateX(c.pitch);m.rotateZ(c.roll);const W=m.userData.wheels;for(const w of W){w.w.rotation.x=c.spin;if(w.front)w.pivot.rotation.y=c.steerVis;}}}}

// steer an AI car toward a point at a desired speed; returns an input object
export function aiInput(c,tx,tz,want,o={}){const dx=tx-c.x,dz=tz-c.z;const ang=Math.atan2(dx,dz);let d=((ang-c.a+Math.PI*3)%(Math.PI*2))-Math.PI;const sp=c.fwdSpeed;
 const steer=cl(d*2.4,-1,1);const sharp=Math.abs(d);let thr=sp<want?1:0,brk=sp>want+3?1:0;if(sharp>.9&&sp>12){thr=0;brk=.6;}if(o.reverse){return{thr:0,brk:1,steer:-steer,hb:false};}
 return{thr,brk,steer,hb:sharp>1.1&&sp>16&&o.drift};}
