// NEON BAY — lofted car bodies: rounded cross-sections swept along the length, real wheel arches,
// a glass greenhouse with painted pillars and roof, and the small parts that sell it (lights, grille, mirrors, seams, plates).
import {THREE,M,merge} from './util.js';
const C=h=>new THREE.Color(h);
export const TRIM=C(0x121315),CHROME=C(0xc9ced6),RUBBER=C(0x0b0b0c),PLATE=C(0xe8e8e2),GRILLE=C(0x0a0b0c),LENS=C(0x2a2c30);
// piecewise-linear lookup in [[z,v],...]
function pl(K,z){if(z<=K[0][0])return K[0][1];for(let i=1;i<K.length;i++)if(z<=K[i][0]){const a=K[i-1],b=K[i],t=(z-a[0])/(b[0]-a[0]||1);return a[1]+(b[1]-a[1])*t;}return K[K.length-1][1];}
const sm=t=>t*t*(3-2*t);
// half-width in plan: a rounded rectangle (superellipse ends)
function halfW(d,z){const L2=d.L/2,t=Math.abs(z)/L2,nose=z>0?(d.noseN??7):(d.tailN??8);const k=Math.pow(Math.max(0,1-Math.pow(t,nose)),1/nose);const taper=1-(d.taper??.04)*t*t;return d.W/2*k*taper;}
// bottom of the body at z: sill height, raised into a round arch over each wheel
function bottom(d,z){let y=d.bot??.3;for(const wz of[d.wf,d.wr]){const R=d.r+.07,dz=z-wz;if(Math.abs(dz)<R){y=Math.max(y,d.r+Math.sqrt(R*R-dz*dz)*.98);}}return y;}
function stationsFor(d,n,extra=[],ak=6){const L2=d.L/2,s=new Set();for(let i=0;i<=n;i++){const u=-1+2*i/n;s.add(+(Math.sign(u)*Math.pow(Math.abs(u),.85)*L2).toFixed(4));}
 for(const t of(ak<3?[.99]:[.999,.995,.985,.965]))for(const sg of[-1,1])s.add(+(sg*t*L2).toFixed(4));s.add(-L2);s.add(L2);
 for(const wz of[d.wf,d.wr]){const R=d.r+.07;for(let k=-ak;k<=ak;k++)s.add(+(wz+R*Math.sin(k/ak*Math.PI/2)).toFixed(4));}
 for(const z of extra)s.add(+z.toFixed(4));return[...s].filter(z=>z>=-L2-1e-6&&z<=L2+1e-6).sort((a,b)=>a-b);}
// generic loft: rings[i] = array of [x,y] at station z[i]; classify(i,j) -> class name for the quad between ring i..i+1, segment j..j+1
function loft(zs,rings,classify,out){const nr=rings[0].length,pos=[],idx=[];zs.forEach((z,i)=>{for(const[x,y]of rings[i])pos.push(x,y,z);});
 const tris={};for(let i=0;i<zs.length-1;i++)for(let j=0;j<nr-1;j++){const a=i*nr+j,b=a+1,c=(i+1)*nr+j,e=c+1;const k=classify(i,j);if(!k)continue;(tris[k]=tris[k]||[]).push(a,c,b,b,c,e);idx.push(a,c,b,b,c,e);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const P=g.attributes.position.array,N=g.attributes.normal.array;
 for(const k in tris){const t=tris[k],p=new Float32Array(t.length*3),n=new Float32Array(t.length*3);t.forEach((v,q)=>{p.set(P.subarray(v*3,v*3+3),q*3);n.set(N.subarray(v*3,v*3+3),q*3);});
  const h=new THREE.BufferGeometry();h.setAttribute('position',new THREE.BufferAttribute(p,3));h.setAttribute('normal',new THREE.BufferAttribute(n,3));h.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(t.length*2),2));(out[k]=out[k]||[]).push(h);}
 g.dispose();}
const B=(w,h,d,x,y,z,rx=0,ry=0,rz=0)=>{const g=new THREE.BoxGeometry(w,h,d);g.applyMatrix4(M(x,y,z,rx,ry,rz));return g;};
const RB=(w,h,d,r,x,y,z,rx=0,ry=0,rz=0)=>{const s=new THREE.Shape();const hw=w/2-r,hh=h/2-r;s.absarc(hw,hh,r,0,Math.PI/2);s.absarc(-hw,hh,r,Math.PI/2,Math.PI);s.absarc(-hw,-hh,r,Math.PI,Math.PI*1.5);s.absarc(hw,-hh,r,Math.PI*1.5,Math.PI*2);
 const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:3});g.translate(0,0,-d/2);g.applyMatrix4(M(x,y,z,rx,ry,rz));return g;};
const CY=(r,len,x,y,z,rx=Math.PI/2,ry=0,rz=0,seg=10)=>{const g=new THREE.CylinderGeometry(r,r,len,seg);g.applyMatrix4(M(x,y,z,rx,ry,rz));return g;};

/* body definitions: L, W, wheel z (front/rear), wheel radius, sill height, belt line [[z,y]], crown, greenhouse [zA base of windshield, zB roof front, zC roof rear, zD base of rear glass, roof y], cabin width factor */
export const DEFS={
 pip:{L:3.9,W:1.76,wf:1.28,wr:-1.22,r:.32,bot:.3,belt:[[-1.95,.86],[-1.75,.97],[1.0,.95],[1.55,.86],[1.95,.6]],crown:.05,cab:[1.0,.28,-1.3,-1.8,1.54],cw:.92,noseN:5,tailN:9,hatch:1},
 cabby:{L:4.7,W:1.86,wf:1.5,wr:-1.45,r:.34,bot:.3,belt:[[-2.35,.8],[-2.15,.97],[-1.6,1.0],[1.35,.98],[2.0,.85],[2.35,.62]],crown:.05,cab:[1.25,.42,-1.05,-1.72,1.5],cw:.9},
 police:{L:4.9,W:1.9,wf:1.55,wr:-1.5,r:.35,bot:.3,belt:[[-2.45,.82],[-2.2,.99],[-1.65,1.02],[1.4,1.0],[2.05,.87],[2.45,.64]],crown:.05,cab:[1.3,.45,-1.1,-1.8,1.52],cw:.9},
 marlin:{L:5.1,W:1.96,wf:1.6,wr:-1.6,r:.37,bot:.28,belt:[[-2.55,.84],[-2.3,1.0],[-1.7,1.02],[1.5,1.0],[2.2,.86],[2.55,.62]],crown:.06,cab:[1.35,.38,-1.2,-1.95,1.47],cw:.9,noseN:9},
 hauler:{L:5.2,W:1.98,wf:1.72,wr:-1.62,r:.42,bot:.52,belt:[[-2.6,1.22],[-2.5,1.28],[1.4,1.3],[2.15,1.16],[2.6,.95]],crown:.04,cab:[1.4,.95,-.22,-.38,2.0],cw:.94,bed:[-2.5,-.45],noseN:12,tailN:16},
 bruiser:{L:4.85,W:1.98,wf:1.55,wr:-1.45,r:.36,bot:.28,belt:[[-2.42,.88],[-2.2,.97],[1.5,.95],[2.2,.86],[2.42,.7]],crown:.04,cab:[1.1,.32,-.55,-1.95,1.36],cw:.88,noseN:12,tailN:12},
 zephyr:{L:4.45,W:2.0,wf:1.42,wr:-1.38,r:.35,bot:.22,belt:[[-2.22,.82],[-1.95,.9],[-.3,.86],[.9,.78],[1.8,.62],[2.22,.48]],crown:.06,cab:[.95,.12,-.55,-1.6,1.18],cw:.8,noseN:5,tailN:10,taper:.1},
 parcel:{L:5.2,W:2.02,wf:1.75,wr:-1.7,r:.38,bot:.35,belt:[[-2.6,1.15],[1.7,1.15],[2.3,1.02],[2.6,.82]],crown:.03,cab:[2.25,1.55,-2.55,-2.6,2.45],cw:.97,van:1,noseN:10,tailN:30},
 vault:{L:6.2,W:2.3,wf:2.1,wr:-1.9,r:.48,bot:.55,belt:[[-3.1,1.35],[2.1,1.35],[2.75,1.25],[3.1,1.05]],crown:.03,cab:[2.7,2.1,-3.05,-3.1,2.9],cw:.98,van:1,armored:1,noseN:14,tailN:40}};

// returns {body:[[geo,color,paint]], glow:[[geo,color,k]], glass:geo}
export function buildCar(id,detail=2){const d=DEFS[id];const body=[],glow=[],out={};const lo=detail<=0,ul=detail<0;
 const b=(g,c,p=0)=>body.push([g,c,p]),gl=(g,c,k)=>glow.push([g,c,k]);
 const L2=d.L/2,W=d.W,[zA,zB,zC,zD,roofY]=d.cab;const beltAt=z=>pl(d.belt,z);
 // ---- lower body loft ----
 const zs=stationsFor(d,ul?5:lo?10:22,[zA,zD],ul?2:lo?4:6);const ring=(z)=>{const w=halfW(d,z),y0=bottom(d,z),y1=beltAt(z),cr=d.crown*Math.min(1,w/(W/2)*1.2);const h=y1-y0;
  const L=ul?[[-w*.92,y0],[-w,y0+h*.5],[-w*.92,y1-.01],[-w*.5,y1+cr*.8],[0,y1+cr]]:[[-w*.9,y0],[-w*.985,y0+h*.2],[-w,y0+h*.52],[-w*.985,y0+h*.8],[-w*.94,y1-.02],[-w*.8,y1+cr*.45],[-w*.42,y1+cr*.9],[0,y1+cr]];if(lo&&!ul)L.splice(3,1);const R=L.slice(0,-1).reverse().map(([x,y])=>[-x,y]);return L.concat(R);};
 const rings=zs.map(ring),nr=rings[0].length,half=(nr-1)/2;
 loft(zs,rings,(i,j)=>{const z=(zs[i]+zs[i+1])/2,t=Math.abs(z)/L2;const lowSeg=j<1||j>=nr-2;
  if(t>.93&&lowSeg)return'trim';// lower valance / diffuser
  return'paint';},out);
 // floor pan
 if(!ul){const zz=zs,rr=zz.map(z=>{const w=halfW(d,z)*.9,y=bottom(d,z);return[[w,y],[-w,y]];});loft(zz,rr,()=>'under',out);}
 // ---- greenhouse ----
 const cz=[];const nC=ul?3:lo?6:10;for(let i=0;i<=nC;i++)cz.push(zD+(zA-zD)*i/nC);for(const z of[zB,zC,zB-.04,zC+.04,(zB+zC)/2-.06,(zB+zC)/2+.06])if(z>zD&&z<zA)cz.push(z);cz.sort((a,b)=>a-b);
 const roofAt=z=>{if(z>=zB)return beltAt(zA)+(roofY-beltAt(zA))*sm(1-(z-zB)/(zA-zB||1));if(z<=zC)return beltAt(zD)+(roofY-beltAt(zD))*sm((z-zD)/(zC-zD||1));return roofY;};
 const cring=z=>{const w0=halfW(d,z)*d.cw,y0=beltAt(z)+d.crown*.4,y1=Math.max(y0+.02,roofAt(z)),h=y1-y0,tum=Math.min(.22,h*.28);const w1=w0-tum;
  const L=[[-w0,y0],[-w0+tum*.25,y0+h*.4],[-w1,y1-.06*Math.min(1,h/.3)],[-w1*.86,y1],[-w1*.4,y1+.025],[0,y1+.03]];if(ul)L.splice(4,1);const R=L.slice(0,-1).reverse().map(([x,y])=>[-x,y]);return L.concat(R);};
 const crs=cz.map(cring),cn=crs[0].length;const bp=(zB+zC)/2;
 loft(cz,crs,(i,j)=>{const z=(cz[i]+cz[i+1])/2;const side=j<2||j>=cn-3,corner=j===2||j===cn-4;if(ul)return j<2||j>=cn-3?((z<zB-.02&&z>zC+.02)||d.van?'glass':'paint'):(z<zB-.02&&z>zC+.02)?'paint':'glass';const flat=z<zB-.02&&z>zC+.02;const pillarB=Math.abs(z-bp)<.06&&!d.van;
  if(d.van){if(corner)return'paint';if(!side)return z>zB?'glass':'paint';return(z>zB-(d.armored?.5:.9)&&z<zA-.05)?'glass':'paint';}
  if(corner)return'paint';if(side)return flat&&!pillarB?'glass':'paint';return flat?'paint':'glass';},out);
 // ---- body-class geometry to lists ----
 const cls={paint:[null,1],trim:[TRIM,0],under:[C(0x050506),0]};for(const k in cls)for(const g of out[k]||[])b(g,cls[k][0],cls[k][1]);
 const glass=out.glass?merge(out.glass.map(g=>[g])):null;
 // ---- details ----
 const fz=L2,rz=-L2,surfZ=(x,front)=>{// z where the plan outline reaches lateral offset x
  let z=front?L2:-L2;const s=front?-1:1;for(let k=0;k<60;k++){if(halfW(d,z)>=Math.abs(x)+.02)break;z+=s*.01;}return z;};
 const hy=beltAt(L2-.2)-.14,ty=beltAt(-L2+.2)-.14;
 if(!ul){// headlights: lens housings that follow the nose
  for(const sd of[-1,1]){const x=sd*(W/2-(d.noseN<7?.42:.36)),z=surfZ(x,true)-.03;const a=Math.atan2(x-sd*(W/2-.1),z-surfZ(sd*(W/2-.1),true))*0+sd*(d.noseN<7?.35:.12);
   b(RB(.5,.2,.08,.05,x,hy,z,0,a,0),LENS);gl(RB(.38,.11,.05,.04,x,hy,z+.035,0,a,0),C(0xffffff),0);if(!lo)gl(B(.36,.025,.04,x,hy-.1,z+.04,0,a,0),C(0xbfe8ff),0);}
  // tail lights
  const wide=id==='zephyr'||id==='marlin'||id==='bruiser';for(const sd of[-1,1]){const x=sd*(W/2-(wide?.5:.32)),z=surfZ(x,false)+.03;b(RB(wide?.8:.42,.16,.08,.04,x,ty,z,0,0,0),C(0x260406));gl(RB(wide?.74:.36,.1,.05,.03,x,ty,z-.035),C(1,.06,.05),1);}
  if(wide&&!lo){b(B(W-1.6,.06,.06,0,ty,surfZ(0,false)-.01),C(0x260406));gl(B(W-1.7,.03,.04,0,ty,surfZ(0,false)-.035),C(1,.08,.06),1);}
  // grille + plates
  const gz=surfZ(0,true);b(RB(Math.min(1.1,W*.5),.22,.06,.04,0,hy-.12,gz-.01),GRILLE);if(!lo)b(B(Math.min(1.12,W*.52),.03,.07,0,hy-.0,gz),CHROME);
  b(B(.52,.13,.03,0,(d.bot??.3)+.12,gz+.0),PLATE);b(B(.52,.13,.03,0,ty-.24,surfZ(0,false)-.0),PLATE);
  if(!lo){// exhausts
   for(const sd of(id==='bruiser'||id==='zephyr'?[-1,1]:[1]))b(CY(.045,.25,sd*(W/2-.45),(d.bot??.3)+.05,surfZ(sd*(W/2-.45),false)+.05,Math.PI/2,0,0,8),CHROME);}}
 // mirrors, door seams, handles, sill trim
 if(!ul)for(const sd of[-1,1]){const mz=zA-.15,mx=sd*(halfW(d,mz)*d.cw+.12),my=beltAt(mz)+.12;b(RB(.18,.12,.2,.04,mx,my,mz),null,1);b(B(.12,.03,.04,mx-sd*.08,my-.04,mz-.02),TRIM);
  if(!lo){const doors=d.van?[zA+.05,zB-.75]:[zA+.08,bp+.02,zC-.08];for(const z of doors){const x=sd*(halfW(d,z)+.004);b(B(.012,beltAt(z)-bottom(d,z)-.12,.012,x,(beltAt(z)+bottom(d,z))/2,z),TRIM);}
   for(const z of(d.van?[zA-.4]:[zA-.38,bp-.4])){const x=sd*(halfW(d,z)+.012);b(B(.02,.035,.16,x,beltAt(z)-.12,z),CHROME);}
   b(B(.03,.06,Math.abs(d.wf-d.wr)-2*(d.r+.12),sd*(halfW(d,0)*.985),(d.bot??.3)+.05,(d.wf+d.wr)/2),TRIM);}
  // window trim along the belt
  if(!lo&&!d.van){const len=zA-zD;b(B(.02,.025,len*.9,sd*(halfW(d,(zA+zD)/2)*d.cw+.003),beltAt((zA+zD)/2)+.05,(zA+zD)/2),CHROME);}}
 // ---- per-model extras ----
 if(ul){for(const sd of[-1,1]){gl(B(.36,.12,.05,sd*(W/2-.36),hy,surfZ(sd*(W/2-.36),true)),C(.8,.82,.85),0);gl(B(.4,.12,.05,sd*(W/2-.34),ty,surfZ(sd*(W/2-.34),false)),C(.5,.04,.04),1);}}
 if(d.bed&&!ul){const[z0,z1]=d.bed,y=beltAt((z0+z1)/2);b(B(W-.24,.04,z1-z0,0,y-.25,(z0+z1)/2),C(0x1a1a1c));b(B(W-.2,.5,.06,0,y-.22,z0),null,1);for(const sd of[-1,1])b(B(.07,.5,z1-z0,sd*(W/2-.1),y-.2,(z0+z1)/2),TRIM);
  b(B(W*.94,.06,.06,0,y+.04,z1+.02),CHROME);for(const sd of[-1,1])b(CY(.03,.6,sd*.78,y+.3,z1+.04,0,0,0,6),CHROME);b(B(1.66,.05,.05,0,y+.6,z1+.04),CHROME);}
 if(ul){}else if(id==='cabby'){gl(RB(.78,.24,.32,.06,0,roofY+.15,(zB+zC)/2),C(1,.8,.25),4);b(B(.82,.04,.36,0,roofY+.03,(zB+zC)/2),TRIM);for(const sd of[-1,1])for(let k=0;k<10;k++)b(B(.012,.1,.22,sd*(halfW(d,-1.4+k*.32)+.006),.8,-1.6+k*.32),k%2?C(0xf4f4f4):C(0x0a0a0a));}
 if(id==='police'){for(const sd of[-1,1]){b(B(.012,.5,2.3,sd*(halfW(d,.1)+.006),.68,.1),C(0xf4f4f4));}b(B(1.3,.08,.32,0,roofY+.06,(zB+zC)/2),TRIM);gl(RB(.52,.12,.26,.05,-.33,roofY+.14,(zB+zC)/2),C(1,.1,.1),2);gl(RB(.52,.12,.26,.05,.33,roofY+.14,(zB+zC)/2),C(.15,.35,1),3);
  b(B(1.4,.45,.12,0,(d.bot??.3)+.3,L2+.08),TRIM);for(const x of[-.5,.5])b(B(.08,.45,.18,x,(d.bot??.3)+.3,L2+.02),TRIM);}
 if(id==='bruiser'){b(RB(.62,.14,1.2,.05,0,beltAt(1.2)+.07,1.25),C(0x15161a));for(const x of[-.24,.24])b(B(.18,.012,3.4,x,beltAt(.5)+d.crown+.004,.6),C(0xf2f2f2));b(B(W-.1,.05,.4,0,beltAt(-2.1)+.05,-2.15),TRIM);}
 if(id==='zephyr'){b(B(1.86,.04,.42,0,beltAt(-2)+.32,-2.0,.08,0,0),null,1);for(const sd of[-1,1]){b(B(.05,.3,.22,sd*.68,beltAt(-2)+.16,-2.0),TRIM);b(B(.03,.22,.75,sd*(halfW(d,-.6)+.01),.58,-.6),TRIM);}gl(B(W-.5,.025,.04,0,hy+.13,surfZ(0,true)-.04),C(.4,.9,1),0);}
 if(id==='hauler'){b(B(W+.08,.28,.24,0,.62,L2+.06),CHROME);for(const sd of[-1,1])b(B(.14,.08,.6,sd*(W/2+.06),beltAt(1.6)+.02,1.6),TRIM);}
 if(id==='parcel'){for(const sd of[-1,1])b(B(.012,.38,3.2,sd*(halfW(d,-.9)+.006),1.75,-.9),C(0xff4d00));b(B(W-.2,.05,.05,0,2.0,-L2-.02),TRIM);}
 if(id==='vault'){for(const sd of[-1,1]){b(B(.014,.6,3.6,sd*(halfW(d,-.9)+.007),1.9,-.9),C(0x1d3a2a));for(let k=0;k<5;k++)b(CY(.03,.02,sd*(halfW(d,-2.4+k*.9)+.012),2.5,-2.4+k*.9,0,0,Math.PI/2,6),CHROME);}
  b(B(W-.3,1.7,.04,0,1.9,-L2-.01),C(0x3a3d40));b(B(.02,1.6,.05,0,1.9,-L2-.03),TRIM);b(B(W+.1,.32,.3,0,.7,L2+.1),TRIM);gl(RB(.5,.1,.2,.03,0,roofY+.08,zB-.3),C(1,.62,.1),4);}
 if(id==='pip'&&!lo)b(B(.72,.035,.9,0,roofY+.04,-.55),TRIM);
 return{body,glow,glass,def:d,cab:[[zD,beltAt(zD)],[zC,roofY],[zB,roofY],[zA,beltAt(zA)]]};}

// open-frame dune buggy: tube cage, tub, seat, spare; returns the same structure as buildCar
export function buildBuggy(detail=2){const body=[],glow=[];const b=(g,c,p=0)=>body.push([g,c,p]),gl=(g,c,k)=>glow.push([g,c,k]);
 const tube=(a,bb,r=.035,c=TRIM)=>{const v=new THREE.Vector3(bb[0]-a[0],bb[1]-a[1],bb[2]-a[2]),l=v.length();const g=new THREE.CylinderGeometry(r,r,l,detail?6:4);g.translate(0,l/2,0);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());g.applyQuaternion(q);g.translate(...a);b(g,c);};
 b(RB(1.5,.34,2.6,.12,0,.62,-.1),null,1);b(RB(1.2,.2,1.1,.08,0,.86,1.15,-.25,0,0),null,1);b(B(1.62,.08,.9,0,.5,1.55),TRIM);b(B(1.62,.08,.6,0,.55,-1.5),TRIM);
 for(const sd of[-1,1]){b(RB(.42,.5,.45,.08,sd*.3,.98,-.35,-.25,0,0),C(0x1a1a1c));tube([sd*.62,.8,.6],[sd*.55,1.75,.1]);tube([sd*.55,1.75,.1],[sd*.55,1.75,-.8]);tube([sd*.55,1.75,-.8],[sd*.66,.8,-1.2]);tube([sd*.62,.8,.6],[sd*.85,.55,1.5],.03);tube([sd*.66,.8,-1.2],[sd*.85,.55,-1.4],.03);
  for(const z of[1.35,-1.25])tube([sd*.4,.55,z],[sd*.95,.62,z],.04,CHROME);}
 tube([-.55,1.75,.1],[.55,1.75,.1]);tube([-.55,1.75,-.8],[.55,1.75,-.8]);tube([-.55,1.75,-.35],[.55,1.75,-.35]);b(B(1.3,.18,.18,0,1.82,.1),TRIM);
 for(const x of[-.3,-.1,.1,.3])gl(CY(.07,.05,x,1.84,.2,Math.PI/2,0,0,8),C(1,1,1),0);b(CY(.38,.24,0,1.0,-1.45,0,0,Math.PI/2,detail?14:8),RUBBER);
 for(const sd of[-1,1])gl(RB(.12,.08,.04,.02,sd*.6,.6,-1.62),C(1,.06,.05),1);
 return{body,glow,glass:null,def:{L:3.7,W:1.95,wf:1.38,wr:-1.3,r:.45},cab:[[-.9,.9],[-.6,1.6],[.2,1.6],[.6,.9]]};}

/* ---------- instanced wheel: lathe tyre with rounded sidewalls + five-spoke alloy + disc + caliper ---------- */
export function wheelGeo(detail=2){const seg=detail?16:10;const prof=[[.62,-.5],[.86,-.52],[.96,-.46],[1,-.3],[1,.3],[.96,.46],[.86,.52],[.62,.5]];
 const tyre=new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(r,y)),seg);tyre.rotateZ(Math.PI/2);
 const parts=[[tyre,null,RUBBER,0]];
 const rim=new THREE.CylinderGeometry(.64,.64,.9,seg,1,true);rim.rotateZ(Math.PI/2);parts.push([rim,null,C(0x8a8e96),1]);
 const disc=new THREE.CylinderGeometry(.5,.5,.2,seg);disc.rotateZ(Math.PI/2);parts.push([disc,M(-.12,0,0),C(0x3a3c40),1]);
 const face=new THREE.CylinderGeometry(.62,.62,.04,seg);face.rotateZ(Math.PI/2);if(detail){for(const sx of[-1,1]){parts.push([face.clone(),M(sx*.44,0,0),C(0x1c1d20),0]);
   for(let k=0;k<5;k++){const a=k/5*Math.PI*2;const sp=new THREE.BoxGeometry(.05,.5,.13);sp.translate(0,.32,0);sp.rotateX(a);sp.translate(sx*.47,0,0);parts.push([sp,null,C(0xd0d4da),1]);}
   const hub=new THREE.CylinderGeometry(.14,.16,.08,10);hub.rotateZ(Math.PI/2);parts.push([hub,M(sx*.48,0,0),C(0xb8bcc4),1]);}}
 else for(const sx of[-1,1])parts.push([face.clone(),M(sx*.44,0,0),C(0x9a9ea6),1]);
 const g=merge(parts,{k:true});g.setAttribute('aM',g.getAttribute('aK'));g.deleteAttribute('aK');return g;}
