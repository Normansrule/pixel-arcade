// BREACH POINT — scene construction: merged level geometry with baked vertex AO, sky dome, lighting moods, rain, props, skyline.
import * as THREE from '../vendor/three.module.min.js';
import {CS} from './maps.js';
import {letterTex} from './tex.js';
const V=THREE.Vector3;

/* ---------- geometry builder ---------- */
class GB{constructor(scale=4){this.p=[];this.n=[];this.uv=[];this.c=[];this.i=[];this.s=scale;}
 quad(a,b,c,d,n,ua,ub,uc,ud,ca,cb,cc,cd){const k=this.p.length/3;this.p.push(...a,...b,...c,...d);for(let q=0;q<4;q++)this.n.push(...n);this.uv.push(...ua,...ub,...uc,...ud);this.c.push(ca,ca,ca,cb,cb,cb,cc,cc,cc,cd,cd,cd);this.i.push(k,k+1,k+2,k,k+2,k+3);}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setIndex(this.i);g.computeBoundingSphere();return g;}
 get empty(){return this.p.length===0;}}

/* ---------- baked occlusion field ---------- */
function bakeAO(L){const ppm=4,W=L.W*CS*ppm,H=L.H*CS*ppm;const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
 const occ=mk(),x=occ.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.filter='blur(5px)';x.fillStyle='#000';
 const tx=v=>(v+L.hw)*ppm,tz=v=>(v+L.hh)*ppm;
 for(const b of L.boxes){if(!b.coll||b.y0>1.5||b.y1<.5||b.mat==='water')continue;const pad=b.kind==='crate'||b.kind==='barrel'?.05:.15;x.globalAlpha=b.y1>2?.95:.6;x.fillRect(tx(b.x0-pad),tz(b.z0-pad),(b.x1-b.x0+pad*2)*ppm,(b.z1-b.z0+pad*2)*ppm);}
 x.globalAlpha=1;const roof=mk(),y=roof.getContext('2d');y.fillStyle='#fff';y.fillRect(0,0,W,H);y.filter='blur(6px)';y.fillStyle='#000';
 for(let r=0;r<L.H;r++)for(let c=0;c<L.W;c++){const px=L.cx(c),pz=L.cz(r);if(L.isRoofed(px,pz))y.fillRect(tx(px-CS/2),tz(pz-CS/2),CS*ppm,CS*ppm);}
 const od=x.getImageData(0,0,W,H).data,rd=y.getImageData(0,0,W,H).data;
 const S=(d,px,pz)=>{const i=Math.max(0,Math.min(W-1,tx(px)|0)),j=Math.max(0,Math.min(H-1,tz(pz)|0));return d[(j*W+i)*4]/255;};
 return(px,py,pz,nx=0,nz=0)=>{const o=S(od,px+nx*.45,pz+nz*.45),r=S(rd,px+nx*.3,pz+nz*.3);const near=1-(1-o)*.62*Math.exp(-Math.max(0,py-L.floorH(px,pz))/1.5);const rf=1-(1-r)*.5*(py<5.5?1:0);return Math.max(.18,near*rf);};}

// bake a group's meshes (relative to the group) into one mesh per material
function mergeGroup(src,cast=true){src.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(src.matrixWorld).invert();const by=new Map();
 src.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!by.has(o.material))by.set(o.material,[]);by.get(o.material).push(g);});
 const out=new THREE.Group();out.position.copy(src.position);out.quaternion.copy(src.quaternion);out.scale.copy(src.scale);
 for(const[m,list]of by){let n=0;for(const g of list)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;
  for(const g of list){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)U.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P,3));G.setAttribute('normal',new THREE.BufferAttribute(N,3));G.setAttribute('uv',new THREE.BufferAttribute(U,2));G.computeBoundingSphere();
  const mesh=new THREE.Mesh(G,m);mesh.castShadow=cast;mesh.receiveShadow=true;out.add(mesh);}return out;}
/* ---------- materials ---------- */
function mat(t,o={}){const m=new THREE.MeshStandardMaterial({map:t.map,normalMap:t.normalMap,roughnessMap:t.roughnessMap||null,roughness:o.r??.9,metalness:o.m??0,vertexColors:true,color:o.col??0xffffff,envMapIntensity:o.env??1});if(o.ns)m.normalScale.set(o.ns,o.ns);return m;}

const MOODS={
 noon:{sky:{top:0x2f6fc4,hor:0xd9e4ee,gnd:0xb39a78,sun:new V(.45,.8,.32).normalize(),sunCol:0xfff2d8,clouds:.25,cloudCol:0xffffff},hemi:[0xc4d8ff,0x9c7a50,.72],sun:[0xfff0d8,3.7],fog:[0xdacdb4,.0052],exp:.9,bloom:.3,thr:.93,sat:1.1,tint:0xfff4e6},
 dusk:{sky:{top:0x1b2233,hor:0xd07848,gnd:0x16181c,sun:new V(-.82,.12,.25).normalize(),sunCol:0xffa060,clouds:.85,cloudCol:0x54586a},hemi:[0x7484a8,0x2c2826,.75],sun:[0xff9a5c,1.55],fog:[0x3b4352,.0145],exp:1.18,bloom:.55,thr:.8,sat:1.0,tint:0xe8ecff}};
export {MOODS};

function makeSky(o){const g=new THREE.SphereGeometry(450,32,16);const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{top:{value:new THREE.Color(o.top)},hor:{value:new THREE.Color(o.hor)},gnd:{value:new THREE.Color(o.gnd)},sunDir:{value:o.sun.clone()},sunCol:{value:new THREE.Color(o.sunCol)},cl:{value:o.clouds},clc:{value:new THREE.Color(o.cloudCol)},time:{value:0}},
 vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 top,hor,gnd,sunCol,clc;uniform vec3 sunDir;uniform float cl,time;varying vec3 vD;
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
 void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(hor,top,pow(clamp(h,0.,1.),.5));c=mix(c,gnd,smoothstep(0.,-.12,h));
  float s=max(dot(d,sunDir),0.);c+=sunCol*(pow(s,900.)*14.+pow(s,12.)*.4+pow(s,3.)*.12);
  if(cl>0.&&h>0.){vec2 p=d.xz/(h+.12)*.9+vec2(time*.004,time*.002);float n=fbm(p*1.3);float k=smoothstep(.5-cl*.25,.95,n)*smoothstep(0.,.18,h)*min(1.,cl*1.2);vec3 cc=clc*(.75+.5*n)+sunCol*pow(s,4.)*.5;c=mix(c,cc,k);}
  gl_FragColor=vec4(c,1.);}`});const s=new THREE.Mesh(g,m);s.renderOrder=-10;s.frustumCulled=false;return s;}

/* ---------- world ---------- */
export function buildWorld(L,TX,mood,R){const group=new THREE.Group();const M=MOODS[mood];const noon=mood==='noon';const ao=bakeAO(L);
 const MAT={
  wall:mat(TX.wall,{r:.92,ns:1.2}),wall2:mat(TX.wall2,{r:.9}),tower:mat(TX.tower,{r:.88}),wallLow:mat(noon?TX.wall:TX.tower,{r:.9}),low:mat(TX.low,{r:.9}),
  thin:mat(TX.thin,noon?{r:.8}:{r:.45,m:.55}),container:mat(TX.container||TX.metal,{r:.55,m:.5}),roof:mat(TX.roof,{r:.95}),hull:mat(TX.container||TX.wall,{r:.6,m:.4}),
  floor0:mat(TX.floor0,{r:noon?.95:1}),floor1:mat(TX.floor1,{r:noon?.9:1}),floor2:mat(TX.floor2,{r:noon?.95:1}),site:mat(TX.site,{r:noon?.85:1}),raised:mat(TX.raised,{r:.9}),indoor:mat(TX.indoor||TX.floor2,{r:noon?.9:1})};
 if(!noon){for(const k of['floor0','floor1','floor2','site'])MAT[k].envMapIntensity=1.6;MAT.indoor.envMapIntensity=.8;}
 const SCALE={wall:4,wall2:4,tower:6,wallLow:4,low:3,thin:3,container:2.6,roof:4,hull:6};
 const gbs={};const gb=k=>gbs[k]||(gbs[k]=new GB(SCALE[k]||4));
 const KMAT={wall:'wall',wall2:'wall2',tower:'tower',wallLow:'wallLow',lintel:'wall',raised:'wall',lowwall:'low',container:'container',thin:'thin',roof:'roof',roofHi:'roof',hull:'hull'};
 const CONT=[[.62,.16,.12],[.14,.3,.55],[.2,.42,.26],[.82,.45,.12],[.5,.5,.52]];
 // ---- boxes
 for(const b of L.boxes){if(!b.vis)continue;let k=KMAT[b.kind];if(!k)continue;if(b.ch==='H')k='hull';const G=gb(k),s=G.s;let tint=[1,1,1];if(b.kind==='container')tint=CONT[b.col||0];if(k==='hull')tint=[.42,.16,.13];
  const col=(x,y,z,nx,nz)=>{const a=ao(x,y,z,nx,nz);return[a*tint[0],a*tint[1],a*tint[2]];};
  const ys=[b.y0];if(b.y1-b.y0>1.8&&b.y0<.7)ys.push(b.y0+1.3);ys.push(b.y1);
  const isRoof=b.kind==='roof'||b.kind==='roofHi';
  // sides
  const sides=[[0,'x0',-1],[0,'x1',1],[2,'z0',-1],[2,'z1',1]];
  for(const[ax,f,sg]of sides){const fx=b[f];if(ax===0&&(fx<=-L.hw+.01||fx>=L.hw-.01)&&b.ch!=='H')continue;if(ax===2&&(fx<=-L.hh+.01||fx>=L.hh-.01))continue;
   if(b.kind==='raised'||b.kind==='lintel'){/* fine */}
   const a0=ax===0?b.z0:b.x0,a1=ax===0?b.z1:b.x1,len=a1-a0,nseg=Math.max(1,Math.round(len/2));const nx=ax===0?sg:0,nz=ax===2?sg:0;
   for(let si=0;si<nseg;si++){const u0=a0+len*si/nseg,u1=a0+len*(si+1)/nseg;for(let yi=0;yi<ys.length-1;yi++){const y0=ys[yi],y1=ys[yi+1];
     const P=(u,y)=>ax===0?[fx,y,u]:[u,y,fx];const U=(u,y)=>[u/s*(ax===0?-sg:sg),y/s];
     let p0=P(u0,y0),p1=P(u1,y0),p2=P(u1,y1),p3=P(u0,y1);let q0=U(u0,y0),q1=U(u1,y0),q2=U(u1,y1),q3=U(u0,y1);
     if((ax===0&&sg<0)||(ax===2&&sg>0)){}else{[p0,p1]=[p1,p0];[p2,p3]=[p3,p2];[q0,q1]=[q1,q0];[q2,q3]=[q3,q2];}
     const C=p=>col(p[0],p[1],p[2],nx,nz);G.quad(p0,p1,p2,p3,[nx,0,nz],q0,q1,q2,q3,...C(p0),...C(p1),...C(p2),...C(p3));}}}
  // top (not for raised floors: the floor grid draws those) + underside for roofs/lintels
  const topY=b.y1;if(b.kind!=='raised'){const nx=Math.max(1,Math.round((b.x1-b.x0)/2)),nz=Math.max(1,Math.round((b.z1-b.z0)/2));for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x0=b.x0+(b.x1-b.x0)*i/nx,x1=b.x0+(b.x1-b.x0)*(i+1)/nx,z0=b.z0+(b.z1-b.z0)*j/nz,z1=b.z0+(b.z1-b.z0)*(j+1)/nz;
    const t=(x,z)=>col(x,topY,z);G.quad([x0,topY,z1],[x1,topY,z1],[x1,topY,z0],[x0,topY,z0],[0,1,0],[x0/s,-z1/s],[x1/s,-z1/s],[x1/s,-z0/s],[x0/s,-z0/s],...t(x0,z1),...t(x1,z1),...t(x1,z0),...t(x0,z0));
    if(isRoof||b.kind==='lintel'){const y=b.y0,d=(x,z)=>{const a=ao(x,y,z)*.8;return[a*tint[0],a*tint[1],a*tint[2]];};G.quad([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],[0,-1,0],[x0/s,z0/s],[x1/s,z0/s],[x1/s,z1/s],[x0/s,z1/s],...d(x0,z0),...d(x1,z0),...d(x1,z1),...d(x0,z1));}}}}
 // ---- floor grid (1 m quads), height from heightfield
 const FM={'.':'floor0',',':'floor1',';':'floor2',a:'site',b:'site',K:'floor1',T:'floor1',t:'floor2',u:'indoor',d:'floor1',r:'raised','1':'raised','2':'raised','3':'raised'};
 const floorKind=(c,r)=>{const ch=L.g[r][c];if(FM[ch])return FM[ch];if('cCoLk|-'.includes(ch)){for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]){const n=L.g[r+dr]?.[c+dc];if(n&&FM[n]&&n!=='r'&&!(n>='1'&&n<='3'))return FM[n];}return'floor0';}return null;};
 const FG={};for(let r=0;r<L.H;r++)for(let c=0;c<L.W;c++){const k=floorKind(c,r);if(!k)continue;const G=FG[k]||(FG[k]=new GB(4));const X0=(c-L.W/2)*CS,Z0=(r-L.H/2)*CS;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){const x0=X0+i,x1=x0+1,z0=Z0+j,z1=z0+1,e=1e-3;const h=(x,z)=>L.floorH(x+(x<(x0+x1)/2?e:-e),z+(z<(z0+z1)/2?e:-e));
   const y00=h(x0,z0),y10=h(x1,z0),y11=h(x1,z1),y01=h(x0,z1);const C=(x,y,z)=>{const a=ao(x,y,z);return[a,a,a];};
   // normal from slope
   const n=new V(y00-y10+y01-y11,2,y00-y01+y10-y11).normalize();
   G.quad([x0,y01,z1],[x1,y11,z1],[x1,y10,z0],[x0,y00,z0],[n.x,n.y,n.z],[x0/4,-z1/4],[x1/4,-z1/4],[x1/4,-z0/4],[x0/4,-z0/4],...C(x0,y01,z1),...C(x1,y11,z1),...C(x1,y10,z0),...C(x0,y00,z0));}}
 // ramp side walls
 for(const R of L.def.ramps){const ns=R[4]==='N'||R[4]==='S';const X=c=>(c-L.W/2)*CS,Z=r=>(r-L.H/2)*CS;const G=gb('wall');
  const edges=ns?[[X(R[0]),-1],[X(R[2]+1),1]]:[[Z(R[1]),-1],[Z(R[3]+1),1]];
  for(const[e,sg]of edges){const a0=ns?Z(R[1]):X(R[0]),a1=ns?Z(R[3]+1):X(R[2]+1),n=8;for(let i=0;i<n;i++){const u0=a0+(a1-a0)*i/n,u1=a0+(a1-a0)*(i+1)/n;const hp=u=>ns?L.floorH(e-sg*.01,u):L.floorH(u,e-sg*.01);const h0=hp(u0+.001),h1=hp(u1-.001);
    const outside=ns?L.floorH(e+sg*.5,(u0+u1)/2):L.floorH((u0+u1)/2,e+sg*.5);if(outside>=Math.max(h0,h1)-.01)continue;
    const P=(u,y)=>ns?[e,y,u]:[u,y,e];let p=[P(u0,0),P(u1,0),P(u1,h1),P(u0,h0)];if((ns&&sg<0)||(!ns&&sg>0)){p=[p[1],p[0],p[3],p[2]];}const nn=ns?[sg,0,0]:[0,0,sg];
    G.quad(p[0],p[1],p[2],p[3],nn,[0,0],[.5,0],[.5,.3],[0,.3],.7,.7,.7,.7,.7,.7,.8,.8,.8,.8,.8,.8);}}}
 const meshes=[];
 for(const k in gbs){if(gbs[k].empty)continue;const m=new THREE.Mesh(gbs[k].geo(),MAT[k]);m.castShadow=true;m.receiveShadow=true;group.add(m);meshes.push(m);}
 for(const k in FG){const m=new THREE.Mesh(FG[k].geo(),MAT[k]);m.receiveShadow=true;group.add(m);meshes.push(m);}
 // ---- trims on raised platform edges (hazard paint at the port, stone curb in town)
 {const trims=new THREE.Group();const tm=noon?new THREE.MeshStandardMaterial({color:0xcdb488,roughness:.9}):new THREE.MeshStandardMaterial({map:TX.hazard.map,roughness:.6});
  for(const b of L.boxes){if(b.kind!=='raised')continue;const y=b.y1;for(const[x0,z0,x1,z1]of[[b.x0,b.z0,b.x1,b.z0+.14],[b.x0,b.z1-.14,b.x1,b.z1],[b.x0,b.z0,b.x0+.14,b.z1],[b.x1-.14,b.z0,b.x1,b.z1]]){
   const cx=(x0+x1)/2,cz=(z0+z1)/2;if(L.floorH(cx+(x1-x0>1?0:(x0<b.x0+.2?-.3:.3)),cz+(z1-z0>1?0:(z0<b.z0+.2?-.3:.3)))>=y-.01)continue;
   const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,.05,z1-z0),tm);m.position.set(cx,y+.02,cz);trims.add(m);}}group.add(mergeGroup(trims,false));}
 // ---- water (drydock)
 let water=null;{const cells=[];for(let r=0;r<L.H;r++)for(let c=0;c<L.W;c++)if(L.g[r][c]==='~')cells.push([c,r]);
  if(cells.length){let c0=1e9,c1=-1,r0=1e9,r1=-1;for(const[c,r]of cells){c0=Math.min(c0,c);c1=Math.max(c1,c);r0=Math.min(r0,r);r1=Math.max(r1,r);}
   const wn=TX.waterN||makeWaterNormal();const wm=new THREE.MeshStandardMaterial({color:0x0c1a20,roughness:.06,metalness:.1,normalMap:wn,envMapIntensity:1.4});wn.repeat.set(6,10);wm.normalScale.set(.6,.6);
   const w=new THREE.Mesh(new THREE.PlaneGeometry((c1-c0+1)*CS,(r1-r0+1)*CS),wm);w.rotation.x=-Math.PI/2;w.position.set((L.cx(c0)+L.cx(c1))/2,-1.1,(L.cz(r0)+L.cz(r1))/2);w.receiveShadow=true;group.add(w);water={m:w,t:wn};
   // quay wall face
   const qx=L.cx(c0)-CS/2;const G=new GB(4);const z0=L.cz(r0)-CS/2,z1=L.cz(r1)+CS/2;for(let z=z0;z<z1;z+=2)G.quad([qx,-1.6,z],[qx,-1.6,z+2],[qx,0,z+2],[qx,0,z],[1,0,0],[0,0],[.5,0],[.5,.4],[0,.4],.5,.5,.5,.5,.5,.5,.8,.8,.8,.8,.8,.8);
   const qm=new THREE.Mesh(G.geo(),MAT.tower);group.add(qm);
   // edge bollards + yellow edge strip
   const strip=new THREE.Mesh(new THREE.BoxGeometry(.3,.06,z1-z0),new THREE.MeshStandardMaterial({map:TX.hazard.map,roughness:.6}));TX.hazard.map.repeat.set(1,40);strip.position.set(qx-.15,.03,(z0+z1)/2);group.add(strip);}}
 // ---- props: crates, barrels (instanced)
 const crates=L.props.filter(p=>p.k==='crate'),barrels=L.props.filter(p=>p.k==='barrel');
 if(crates.length){const cm=new THREE.MeshStandardMaterial({map:TX.wood.map,normalMap:TX.wood.normalMap,roughness:.85});const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.82,1),cm,crates.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
  crates.forEach((p,i)=>{q.setFromAxisAngle(new V(0,1,0),p.rot);m4.compose(new V(p.x,p.y+p.s*.41,p.z),q,new V(p.s,p.s,p.s));im.setMatrixAt(i,m4);const v=.75+((i*37)%10)/40;c.setRGB(v,v*.97,v*.92);im.setColorAt(i,c);});im.castShadow=im.receiveShadow=true;group.add(im);meshes.push(im);}
 if(barrels.length){const bm=new THREE.MeshStandardMaterial({map:TX.metal.map,normalMap:TX.metal.normalMap,roughness:.5,metalness:.6});const g=new THREE.CylinderGeometry(.33,.33,.95,14);g.translate(0,.475,0);const im=new THREE.InstancedMesh(g,bm,barrels.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
  const pal=noon?[[.2,.35,.6],[.65,.18,.12],[.75,.6,.2]]:[[.55,.22,.1],[.15,.3,.45],[.2,.35,.2]];barrels.forEach((p,i)=>{q.setFromAxisAngle(new V(0,1,0),i);m4.compose(new V(p.x,p.y,p.z),q,new V(1,1,1));im.setMatrixAt(i,m4);const k=pal[i%3];c.setRGB(k[0],k[1],k[2]);im.setColorAt(i,c);});im.castShadow=im.receiveShadow=true;group.add(im);meshes.push(im);}
 // ---- doors: jambs + open leaves
 if(L.doors.length){const jm=new THREE.MeshStandardMaterial({color:noon?0x6a4a2e:0x3a3e44,roughness:.7,metalness:noon?0:.6});const lm=new THREE.MeshStandardMaterial({map:TX.wood.map,color:noon?0x9a6a40:0x56606a,roughness:.75,metalness:noon?0:.5});
  const dg=new THREE.Group();for(const d of L.doors){const g=new THREE.Group();g.position.set(d.x,0,d.z);if(!d.ew)g.rotation.y=Math.PI/2;
   for(const s of[-1,1]){const j=new THREE.Mesh(new THREE.BoxGeometry(.18,2.5,.3),jm);j.position.set(s*.91,1.25,0);g.add(j);}const top=new THREE.Mesh(new THREE.BoxGeometry(2,.18,.3),jm);top.position.y=2.42;g.add(top);
   // only one leaf per door cell, swung open against the frame
   const leaf=new THREE.Mesh(new THREE.BoxGeometry(.9,2.3,.06),lm);leaf.position.set(((d.c+d.r)%2?1:-1)*.92,1.15,.5);leaf.rotation.y=Math.PI/2;g.add(leaf);dg.add(g);}group.add(mergeGroup(dg));}
 // ---- site letters on the floor + painted on a wall
 for(const s of['A','B']){const S=L.def.sites[s],p=L.P(S.c);const m=new THREE.Mesh(new THREE.PlaneGeometry(5.5,5.5),new THREE.MeshStandardMaterial({map:letterTex(s,noon?'#7a1e10':'#e8b020'),transparent:true,depthWrite:false,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2}));
  m.rotation.x=-Math.PI/2;m.position.set(p.x,L.floorH(p.x,p.z)+.03,p.z);m.receiveShadow=true;group.add(m);}
 // ---- skyline beyond the border (non-colliding silhouettes)
 {const G=new GB(6);let sd=5;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;const hw=L.hw,hh=L.hh;
  const put=(x,z,w,d,h)=>{const x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;const c=.55+rnd()*.3;for(const[nx,nz,a,b2,e]of[[0,-1,x0,x1,z0],[0,1,x0,x1,z1],[-1,0,z0,z1,x0],[1,0,z0,z1,x1]]){const P=(u,y)=>nx?[e,y,u]:[u,y,e];let p=[P(a,0),P(b2,0),P(b2,h),P(a,h)];if(nz<0||nx>0)p=[p[1],p[0],p[3],p[2]];G.quad(p[0],p[1],p[2],p[3],[nx,0,nz],[0,0],[w/6,0],[w/6,h/6],[0,h/6],c*.6,c*.6,c*.6,c*.6,c*.6,c*.6,c,c,c,c,c,c);}
   G.quad([x0,h,z1],[x1,h,z1],[x1,h,z0],[x0,h,z0],[0,1,0],[0,0],[1,0],[1,1],[0,1],c,c,c,c,c,c,c,c,c,c,c,c);};
  for(let i=0;i<70;i++){const side=i%4;const t=rnd()*2-1;let x,z;const off=8+rnd()*40;if(side===0){x=t*(hw+30);z=-hh-off;}else if(side===1){x=t*(hw+30);z=hh+off;}else if(side===2){x=-hw-off;z=t*(hh+30);}else{x=hw+off+(noon?0:30);z=t*(hh+30);}
   put(x,z,6+rnd()*14,6+rnd()*14,(noon?5:7)+rnd()*(noon?12:16));}
  const m=new THREE.Mesh(G.geo(),noon?MAT.wall2:MAT.wall);m.castShadow=false;group.add(m);}
 // ---- mood dressing
 const lamps=[],blink=[];
 const lampGeo=new THREE.SphereGeometry(.16,10,8),lampM=new THREE.MeshBasicMaterial({color:new THREE.Color(noon?4:6,noon?2.6:3.4,noon?1.2:1.2)});
 const addLamp=(x,y,z,col,int,dist,pole)=>{const l=new THREE.PointLight(col,int,dist,1.7);l.position.set(x,y,z);group.add(l);lamps.push(l);const b=new THREE.Mesh(lampGeo,lampM);b.position.set(x,y+.05,z);group.add(b);
  if(pole){const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,y,8),new THREE.MeshStandardMaterial({color:0x2a2c30,metalness:.7,roughness:.5}));p.position.set(pole.x,y/2,pole.z);p.castShadow=true;group.add(p);const arm=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,1),p.material);arm.position.set((x+pole.x)/2,y+.1,(z+pole.z)/2);arm.lookAt(x,y+.1,z);group.add(arm);}};
 // lamps in roofed spaces (both moods) — spread out
 const roofedCells=[];for(let r=1;r<L.H-1;r++)for(let c=1;c<L.W-1;c++){const x=L.cx(c),z=L.cz(r);if(L.isRoofed(x,z)&&!'cCoLk|-'.includes(L.g[r][c]))roofedCells.push({x,z});}
 const pickSpread=(list,n,minD)=>{const out=[];for(const p of list){if(out.length>=n)break;if(out.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>minD))out.push(p);}return out;};
 for(const p of pickSpread(roofedCells,noon?3:4,12)){const top=L.roofAt(p.x,p.z);addLamp(p.x,Math.min(top,5.6)-.4,p.z,noon?0xffc070:0xd8e4ff,noon?14:20,13,null);}
 if(!noon){// sodium poles along walls in open areas
  const open=[];for(let r=2;r<L.H-2;r+=3)for(let c=2;c<L.W-2;c+=3){const x=L.cx(c),z=L.cz(r);const ch=L.g[r][c];if(L.isRoofed(x,z)||!'.,;abKT'.includes(ch))continue;let wall=null;for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]])if(L.g[r+dr][c+dc]==='#'){wall=[dc,dr];break;}if(wall)open.push({x,z,w:wall});}
  for(const p of pickSpread(open,6,16)){addLamp(p.x+p.w[0]*.2,5.2,p.z+p.w[1]*.2,0xffa548,26,20,{x:p.x+p.w[0]*.85,z:p.z+p.w[1]*.85});}
  // gantry cranes over the water
  const cm=new THREE.MeshStandardMaterial({color:0xb8442a,roughness:.6,metalness:.4});const crane=(z)=>{const g=new THREE.Group();const x0=L.hw-6,x1=L.hw+22;for(const x of[x0,x1])for(const dz of[-5,5]){const leg=new THREE.Mesh(new THREE.BoxGeometry(1,30,1),cm);leg.position.set(x,15,z+dz);g.add(leg);}
   const beam=new THREE.Mesh(new THREE.BoxGeometry(60,2.2,2.2),cm);beam.position.set((x0+x1)/2-8,30,z);g.add(beam);for(const dz of[-5,5]){const b=new THREE.Mesh(new THREE.BoxGeometry(x1-x0+2,1.2,1.2),cm);b.position.set((x0+x1)/2,16,z+dz);g.add(b);}
   const cab=new THREE.Mesh(new THREE.BoxGeometry(4,3,4),new THREE.MeshStandardMaterial({color:0x30343a,roughness:.5}));cab.position.set(x0-6,27.5,z);g.add(cab);const red=new THREE.Mesh(new THREE.SphereGeometry(.4,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(8,.4,.3)}));red.position.set((x0+x1)/2-37,31.6,z);blink.push(red);const mg=mergeGroup(g,false);mg.add(red);group.add(mg);};
  crane(-L.hh*.45);crane(L.hh*.3);
 }else{// awnings + palms
  const aw=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,side:THREE.DoubleSide,map:stripeTex()});
  const deco=new THREE.Group();let n=0;for(const d of L.doors){if(n++>6)break;const a=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.6),aw);a.position.set(d.x,2.9,d.z);a.rotation.set(-Math.PI/2+.45,d.ew?0:Math.PI/2,0);deco.add(a);}
  const trunkM=new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:.95}),leafM=new THREE.MeshStandardMaterial({color:0x4f6a2a,roughness:.8,side:THREE.DoubleSide});
  const spots=[];for(let r=2;r<L.H-2;r++)for(let c=2;c<L.W-2;c++){if(L.g[r][c]!=='.'&&L.g[r][c]!==';')continue;let walls=0;for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]])if(L.g[r+dr][c+dc]==='#')walls++;if(walls>=2)spots.push({x:L.cx(c),z:L.cz(r)});}
  for(const p of pickSpread(spots,5,14)){const g=new THREE.Group();g.position.set(p.x,0,p.z);let y=0,x=0;for(let i=0;i<7;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(.16-i*.01,.19-i*.01,1.1,7),trunkM);x+=.07;s.position.set(x,y+.55,0);s.rotation.z=-.07;g.add(s);y+=1.08;}
   for(let k=0;k<8;k++){const lf=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.6),leafM);lf.geometry.translate(1.6,0,0);lf.position.set(x,y,0);lf.rotation.set(Math.random()*.5,k*Math.PI/4,-.35);g.add(lf);}deco.add(g);}group.add(mergeGroup(deco));}
 // ---- lights
 const hemi=new THREE.HemisphereLight(M.hemi[0],M.hemi[1],M.hemi[2]);group.add(hemi);
 const sun=new THREE.DirectionalLight(M.sun[0],M.sun[1]);const sd=M.sky.sun.clone();sun.position.copy(sd).multiplyScalar(120);sun.target.position.set(0,0,0);sun.castShadow=true;
 const ext=Math.hypot(L.hw,L.hh)+4;Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:10,far:260});sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;sun.shadow.mapSize.set(2048,2048);group.add(sun,sun.target);
 const sky=makeSky(M.sky);group.add(sky);
 // env map from the sky
 let env=null;{const s=new THREE.Scene();const sk=makeSky(M.sky);s.add(sk);const gl=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshBasicMaterial({color:new THREE.Color(M.sky.gnd).multiplyScalar(.6)}));gl.rotation.x=-Math.PI/2;gl.position.y=-2;s.add(gl);const pm=new THREE.PMREMGenerator(R);env=pm.fromScene(s,.04).texture;pm.dispose();}
 // ---- rain
 let rain=null;if(!noon){const N=2600,pos=new Float32Array(N*6),vel=new Float32Array(N);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
  const m=new THREE.LineBasicMaterial({color:new THREE.Color(.5,.55,.65),transparent:true,opacity:.22,depthWrite:false});const ls=new THREE.LineSegments(g,m);ls.frustumCulled=false;group.add(ls);
  for(let i=0;i<N;i++){vel[i]=17+Math.random()*6;pos[i*6]=(Math.random()-.5)*44;pos[i*6+1]=Math.random()*16;pos[i*6+2]=(Math.random()-.5)*44;}rain={ls,pos,vel,N,g,ox:0,oz:0};}
 let t=0;
 function update(dt,cam,splash){t+=dt;sky.material.uniforms.time.value=t;if(water){water.t.offset.x=t*.012;water.t.offset.y=t*.02;}for(const b of blink)b.visible=(t%1.6)<.8;
  if(rain){const{pos,vel,N}=rain;const cx=cam.position.x,cz=cam.position.z,cy=cam.position.y;const drift=1.6;
   for(let i=0;i<N;i++){let k=i*6;let x=pos[k],y=pos[k+1],z=pos[k+2];y-=vel[i]*dt;x+=drift*dt;
    let rx=x-cx,rz=z-cz;if(rx>22)x-=44;else if(rx<-22)x+=44;if(rz>22)z-=44;else if(rz<-22)z+=44;
    const fl=L.isRoofed(x,z)?L.roofAt(x,z)+.4:L.floorH(x,z);if(Math.abs(x-cx)<1.4&&Math.abs(z-cz)<1.4&&y<cy+1.5&&y>cy-2){x+=2.8*Math.sign(x-cx||1);}
    if(y<fl){if(splash&&Math.random()<.08&&Math.abs(x-cx)<12&&Math.abs(z-cz)<12&&fl<1.9)splash(x,fl+.02,z);y=cy+8+Math.random()*6;x=cx+(Math.random()-.5)*44;z=cz+(Math.random()-.5)*44;}
    pos[k]=x;pos[k+1]=y;pos[k+2]=z;pos[k+3]=x-drift*.025;pos[k+4]=y+.3;pos[k+5]=z;}rain.g.attributes.position.needsUpdate=true;}}
 group.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&!o.material.envMap){}});
 return{group,meshes,sun,hemi,sky,env,lamps,update,M,fog:new THREE.FogExp2(M.fog[0],M.fog[1]),MAT};}

function stripeTex(){const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');for(let i=0;i<8;i++){x.fillStyle=i%2?'#e8dcc0':'#a83a24';x.fillRect(i*8,0,8,64);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,1);return t;}
function makeWaterNormal(){const s=256,c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');const img=x.createImageData(s,s);
 for(let j=0;j<s;j++)for(let i=0;i<s;i++){const a=i/s*Math.PI*2,b=j/s*Math.PI*2;const dx=Math.cos(a*3+b*2)*.5+Math.cos(a*7-b*5)*.3+Math.cos(a*13+b*11)*.15,dy=Math.sin(b*4+a)*.5+Math.cos(b*9-a*6)*.3+Math.sin(a*12+b*14)*.15;const k=(j*s+i)*4;img.data[k]=128+dx*50;img.data[k+1]=128+dy*50;img.data[k+2]=255;img.data[k+3]=255;}
 x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
