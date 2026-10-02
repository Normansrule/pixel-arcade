// SKATE CITY — turns level primitives into merged, textured meshes (one draw call per material) plus set dressing:
// warehouse shell with skylights and light shafts, downtown towers and a harbor, a school with fences and houses.
import * as THREE from '../vendor/three.module.min.js';
import {ctex,facade,srand} from './tex.js';
import {TM,toWorld} from './world.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a;

/* ---------------- materials ---------------- */
export function makeMaterials(T){const S=(o)=>new THREE.MeshStandardMaterial(o);const M={};
 M.floor={m:S({map:T.floor,roughness:.62,metalness:0,bumpMap:T.floor,bumpScale:.6,envMapIntensity:.55}),s:4};
 M.conc={m:S({map:T.conc,roughness:.85,bumpMap:T.conc,bumpScale:.8}),s:2.2};
 M.ramp={m:S({map:T.ramp,roughness:.55,bumpMap:T.ramp,bumpScale:.3,envMapIntensity:.6}),s:2.44};
 M.ply={m:S({map:T.ply,roughness:.8}),s:2.44};
 M.plate={m:S({map:T.plate,roughness:.42,metalness:.75,bumpMap:T.plate,bumpScale:1.2}),s:1.2};
 M.metal={m:S({map:T.metal,color:0xd0d4da,roughness:.28,metalness:1}),s:1};
 M.rail={m:S({color:0xc9ced6,roughness:.22,metalness:1}),s:1};
 M.paintrail={m:S({color:0xe8b020,roughness:.4,metalness:.5}),s:1};
 M.brick={m:S({map:T.brick,roughness:.9,bumpMap:T.brick,bumpScale:1.5}),s:3};
 M.block={m:S({map:T.block,roughness:.85,color:0xb8c4d0}),s:3};
 M.asphalt={m:S({map:T.asphalt,roughness:.92,bumpMap:T.asphalt,bumpScale:1}),s:6};
 M.pavers={m:S({map:T.pavers,roughness:.8,bumpMap:T.pavers,bumpScale:.8}),s:4};
 M.slab={m:S({map:T.slab,roughness:.82}),s:2};
 M.wood={m:S({map:T.wood,roughness:.75}),s:1.5};
 M.crate={m:S({map:T.wood,color:0x9a8a70,roughness:.85}),s:1.2};
 M.roof={m:S({map:T.roof,roughness:.95,bumpMap:T.roof,bumpScale:1}),s:3};
 M.pool={m:S({map:T.pool,roughness:.5,envMapIntensity:.7}),s:3};
 M.tile={m:S({map:T.tile,roughness:.3,envMapIntensity:.8}),s:.8};
 M.kiosk={m:S({map:T.kiosk,roughness:.6}),face:true};
 M.roofk={m:S({color:0x2a5a4a,roughness:.5,metalness:.6}),s:2};
 M.glass2={m:S({color:0x9fc4d8,roughness:.05,metalness:.1,transparent:true,opacity:.35,envMapIntensity:1.5,depthWrite:false}),s:2,noShadow:true};
 M.skylight={m:S({color:0x9fd0ff,roughness:.05,metalness:.2,emissive:0x2a4a66,envMapIntensity:1.6}),s:2};
 M.grass={m:S({map:T.grass,roughness:1}),s:4};
 M.dark={m:S({color:0x2a2c30,roughness:.7,metalness:.4}),s:2};
 const fac=(k,seed,col)=>{const f=facade(k,seed);return{m:S({map:f.map,emissiveMap:f.em,emissive:new THREE.Color(col||0xffffff),emissiveIntensity:1,roughness:.75,envMapIntensity:.6}),s:8};};
 M.school=fac('school',11,0xffe0b0);M.gym=fac('stone',23,0xffd8a0);M.facB=fac('brick',5);M.facG=fac('glass',9);M.facS=fac('stone',17);
 for(const k in M){const t=M[k].m.map;if(t){t.wrapS=t.wrapT=THREE.RepeatWrapping;}}
 return M;}

/* ---------------- geometry bag: collects world-space triangles per material, merges at the end ---------------- */
class Bag{constructor(){this.m=new Map();}
 add(k,g,mode='world'){if(!this.m.has(k))this.m.set(k,[]);this.m.get(k).push({g:g.index?g.toNonIndexed():g,mode});}
 tris(k,arr,uv){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();this.add(k,g,uv?'keep':'world');}
 build(scene,M,list){for(const[k,arr]of this.m){const mat=M[k];if(!mat)continue;const s=mat.s||2;let n=0;arr.forEach(e=>n+=e.g.attributes.position.count);
   const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
   for(const{g,mode}of arr){const P=g.attributes.position.array,N=g.attributes.normal?g.attributes.normal.array:null,U=g.attributes.uv?g.attributes.uv.array:null,c=g.attributes.position.count;pos.set(P,o*3);if(N)nor.set(N,o*3);
    for(let i=0;i<c;i++){const j=(o+i)*2;if(mode==='keep'&&U){uv[j]=U[i*2];uv[j+1]=U[i*2+1];continue;}
     const t=Math.floor(i/3)*3;// face normal of this triangle picks the projection
     const ax=P[t*3],ay=P[t*3+1],az=P[t*3+2],bx=P[t*3+3]-ax,by=P[t*3+4]-ay,bz=P[t*3+5]-az,cx=P[t*3+6]-ax,cy=P[t*3+7]-ay,cz=P[t*3+8]-az;
     const nx=Math.abs(by*cz-bz*cy),ny=Math.abs(bz*cx-bx*cz),nz=Math.abs(bx*cy-by*cx);const x=P[i*3],y=P[i*3+1],z=P[i*3+2];
     if(ny>=nx&&ny>=nz){uv[j]=x/s;uv[j+1]=z/s;}else if(nx>=nz){uv[j]=z/s;uv[j+1]=y/s;}else{uv[j]=x/s;uv[j+1]=y/s;}}
    o+=c;g.dispose();}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
   const mesh=new THREE.Mesh(geo,mat.m);mesh.userData.noAO=!!mat.noShadow;mesh.castShadow=!mat.noShadow&&k!=='floor';mesh.receiveShadow=true;scene.add(mesh);list.push(mesh);}}}

const W3=(p,lx,y,lz)=>{const[x,z]=toWorld(p,lx,lz);return[x,y,z];};
function quad(a,A,B,C,D){a.push(...A,...B,...C,...A,...C,...D);}
// box-like solid with a (possibly sloped) top given by corner heights; sides and top go to different materials
function prism(bag,p,yb,h00,h10,h01,h11,top,side,hw=p.hw,hd=p.hd,faceUV){const T=[],S=[],SU=[];const P=(lx,y,lz)=>W3(p,lx,y,lz);
 const B00=P(-hw,yb,-hd),B10=P(hw,yb,-hd),B01=P(-hw,yb,hd),B11=P(hw,yb,hd),T00=P(-hw,h00,-hd),T10=P(hw,h10,-hd),T01=P(-hw,h01,hd),T11=P(hw,h11,hd);
 T.push(...T00,...T01,...T11,...T00,...T11,...T10);
 const sides=[[B00,T00,T10,B10,2*hw],[B01,B11,T11,T01,2*hw],[B00,B01,T01,T00,2*hd],[B10,T10,T11,B11,2*hd]];
 for(const[a,b,c,d]of sides){S.push(...a,...b,...c,...a,...c,...d);}
 bag.tris(top,T);
 if(faceUV){const P=[1,0,1,1,0,1,1,0,0,1,0,0],Qd=[0,0,1,0,1,1,0,0,1,1,0,1];bag.tris(side,S,[...P,...Qd,...Qd,...P]);}
 else bag.tris(side,S);}

function qpGeo(bag,p,M){const N=16,R=p.R,H=R*(1-Math.cos(TM)),ul=R*(1-Math.sin(TM)),hl=p.len/2,y0=p.y0||0,dk=p.deck||0;const face=[],fu=[];
 const pt=th=>[R-R*Math.sin(th),y0+R-R*Math.cos(th)];
 for(let i=0;i<N;i++){const a=TM*i/N,b=TM*(i+1)/N,[za,ya]=pt(a),[zb,yb]=pt(b);const va=R*a/2.44,vb=R*b/2.44;
  const A=W3(p,-hl,ya,za),B=W3(p,hl,ya,za),C=W3(p,hl,yb,zb),D=W3(p,-hl,yb,zb);face.push(...A,...B,...C,...A,...C,...D);fu.push(-hl/2.44,va,hl/2.44,va,hl/2.44,vb,-hl/2.44,va,hl/2.44,vb,-hl/2.44,vb);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(face,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(fu,2));
 // smooth normals across the curve
 const nor=[];for(let i=0;i<N;i++){const a=TM*i/N,b=TM*(i+1)/N;const n=th=>{const lx=0,ly=Math.cos(th),lz=Math.sin(th);return[lx*p.c+lz*p.s,ly,-lx*p.s+lz*p.c];};const A=n(a),B=n(b);nor.push(...A,...A,...B,...A,...B,...B);}
 g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));bag.add(p.mat||'ramp',g,'keep');
 // side caps (fan from the back-bottom corner)
 for(const sx of[-1,1]){const S=[];const P0=W3(p,sx*hl,y0,-dk);const pts=[];for(let i=0;i<=N;i++){const[z,y]=pt(TM*i/N);pts.push(W3(p,sx*hl,y,z));}pts.push(W3(p,sx*hl,y0+H,-dk));
  for(let i=0;i<pts.length-1;i++){if(sx>0)S.push(...P0,...pts[i+1],...pts[i]);else S.push(...P0,...pts[i],...pts[i+1]);}bag.tris(p.side||'ply',S);}
 // deck + back
 if(dk>0){const T=[];quad(T,W3(p,-hl,y0+H,-dk),W3(p,-hl,y0+H,ul),W3(p,hl,y0+H,ul),W3(p,hl,y0+H,-dk));bag.tris(p.deckMat||'ply',T);}
 const Bk=[];quad(Bk,W3(p,-hl,y0,-dk),W3(p,-hl,y0+H,-dk),W3(p,hl,y0+H,-dk),W3(p,hl,y0,-dk));bag.tris(p.side||'ply',Bk);
 // coping pipe
 const cg=new THREE.CylinderGeometry(.045,.045,p.len,10,1);cg.rotateZ(Math.PI/2);cg.rotateY(p.r);const[cx,cz]=toWorld(p,0,ul);cg.translate(cx,y0+H,cz);bag.add('rail',cg,'keep');}

function bowlGeo(bag,p){const N=14,M=8,R=p.R,D=p.D,rc=p.rc,cx=p.hw-rc,cz=p.hd-rc,y0=p.y0||0;
 const ring=[];const corner=(sx,sz,a0)=>{for(let i=0;i<=M;i++){const a=a0+i/M*Math.PI/2;ring.push([sx*cx+Math.cos(a)*rc,sz*cz+Math.sin(a)*rc,Math.cos(a),Math.sin(a)]);}};
 corner(1,1,0);corner(-1,1,Math.PI/2);corner(-1,-1,Math.PI);corner(1,-1,Math.PI*1.5);ring.push(ring[0]);
 // perimeter distance at the lip for u
 const ext=R*Math.sin(TM);let us=[0];for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];us.push(us[i-1]+Math.hypot(b[0]+b[2]*ext-a[0]-a[2]*ext,b[1]+b[3]*ext-a[1]-a[3]*ext));}
 const prof=k=>{const th=TM*k/N;return{d:R*Math.sin(th),y:y0-D+R-R*Math.cos(th),nh:Math.sin(th),ny:Math.cos(th),v:R*th/2.6};};
 for(const part of['pool','tile']){const pos=[],nor=[],uv=[];const k0=part==='pool'?0:N-1,k1=part==='pool'?N-1:N;
  for(let k=k0;k<k1;k++){const A=prof(k),B=prof(k+1);for(let i=0;i<ring.length-1;i++){const r0=ring[i],r1=ring[i+1];
   const P=(r,pr)=>W3(p,r[0]+r[2]*pr.d,pr.y,r[1]+r[3]*pr.d);const Nn=(r,pr)=>{const lx=-r[2]*pr.nh,lz=-r[3]*pr.nh;return[lx*p.c+lz*p.s,pr.ny,-lx*p.s+lz*p.c];};
   const a=P(r0,A),b=P(r1,A),c=P(r1,B),d=P(r0,B);pos.push(...a,...b,...c,...a,...c,...d);const na=Nn(r0,A),nb=Nn(r1,A),nc=Nn(r1,B),nd=Nn(r0,B);nor.push(...na,...nb,...nc,...na,...nc,...nd);
   const u0=us[i]/2.6,u1=us[i+1]/2.6;uv.push(u0,A.v,u1,A.v,u1,B.v,u0,A.v,u1,B.v,u0,B.v);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bag.add(part,g,'keep');}
 // flat bottom
 const B=[];const c0=W3(p,0,y0-D,0);for(let i=0;i<ring.length-1;i++){const r0=ring[i],r1=ring[i+1];B.push(...c0,...W3(p,r1[0],y0-D,r1[1]),...W3(p,r0[0],y0-D,r0[1]));}bag.tris('pool',B);
 // stone coping ring
 const pts=ring.slice(0,-1).map(r=>{const w=W3(p,r[0]+r[2]*(ext+.04),y0+.02,r[1]+r[3]*(ext+.04));return new V(...w);});
 const tg=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),160,.075,8,true);bag.add('conc',tg,'world');
 return ring.map(r=>W3(p,r[0]+r[2]*ext,0,r[1]+r[3]*ext));}

function cylGeo(bag,p,water){const r=p.rad,h=p.h,y0=p.y0||0;
 if(water){const ri=water;const outer=new THREE.CylinderGeometry(r,r,h-y0,48,1,true);outer.translate(p.x,(h+y0)/2,p.z);bag.add(p.mat||'conc',outer);
  const top=new THREE.RingGeometry(ri,r,48,1);top.rotateX(-Math.PI/2);top.translate(p.x,h,p.z);bag.add(p.mat||'conc',top);
  const inner=new THREE.CylinderGeometry(ri,ri,.35,48,1,true);const ip=inner.attributes.position,inr=inner.attributes.normal;inner.index.array.reverse();for(let i=0;i<inr.count;i++)inr.setXYZ(i,-inr.getX(i),-inr.getY(i),-inr.getZ(i));inner.translate(p.x,h-.175,p.z);bag.add(p.mat||'conc',inner);return;}
 const g=new THREE.CylinderGeometry(r,r,h-y0,40);g.translate(p.x,(h+y0)/2,p.z);bag.add(p.mat||'conc',g);}

// stairs: each step is a block from its front edge to the top of the flight
function stairs(bag,p){const n=p.steps||8,dz=2*p.hd/n;const yb=p.y0||0;for(let i=0;i<n;i++){const top=p.h0+(p.h1-p.h0)*(i+1)/n;const z0=-p.hd+(i+.5)*dz,z1=p.hd;
  const q={x:0,z:0,c:p.c,s:p.s};const mz=(z0+z1)/2;const[wx,wz]=toWorld(p,0,mz);q.x=wx;q.z=wz;prism(bag,q,yb,top,top,top,top,p.mat||'conc',p.mat||'conc',p.hw,(z1-z0)/2);}}

function railMeshes(bag,world){for(const R of world.rails){if(R.kind==='coping')continue;
  for(const s of R.segs){const a=new V(s.a.x,s.a.y,s.a.z),b=new V(s.b.x,s.b.y,s.b.z);
   if(R.kind==='ledge'){// steel angle on the edge
    const g=new THREE.BoxGeometry(.075,.05,s.len+.02);const m=new THREE.Matrix4().lookAt(a,b,new V(0,1,0));g.applyMatrix4(m);const mid=a.clone().add(b).multiplyScalar(.5);g.translate(mid.x,mid.y-.022,mid.z);bag.add('metal',g,'keep');continue;}
   const g=new THREE.CylinderGeometry(.034,.034,s.len,10,1);g.rotateX(Math.PI/2);const m=new THREE.Matrix4().lookAt(a,b,new V(0,1,0));g.applyMatrix4(m);const mid=a.clone().add(b).multiplyScalar(.5);g.translate(mid.x,mid.y,mid.z);bag.add(R.paint?'paintrail':'rail',g,'keep');
   const np=Math.max(1,Math.round(s.len/2.6));for(let i=0;i<=np;i++){if(i===0&&s!==R.segs[0])continue;const t=i/np,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,z=a.z+(b.z-a.z)*t;const gh=world.H(x,z);if(y-gh<.12)continue;
    const pg=new THREE.CylinderGeometry(.028,.032,y-gh,8,1);pg.translate(x,(y+gh)/2,z);bag.add('rail',pg,'keep');}}}}

/* ---------------- pickups: voxel letters + secret tape ---------------- */
const FONT={S:['.####','#....','.###.','....#','####.'],K:['#...#','#..#.','###..','#..#.','#...#'],A:['.###.','#...#','#####','#...#','#...#'],T:['#####','..#..','..#..','..#..','..#..'],E:['#####','#....','####.','#....','#####']};
function letterMesh(ch){const gs=[],s=.13;FONT[ch].forEach((row,r)=>[...row].forEach((c,i)=>{if(c==='#'){const g=new THREE.BoxGeometry(s*.94,s*.94,s*1.4);g.translate((i-2)*s,(2-r)*s,0);gs.push(g);}}));
 const g=mergeG(gs);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xffa040,emissive:0xff6a10,emissiveIntensity:2.2,roughness:.3,metalness:.3}));return m;}
function tapeMesh(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.62,.4,.1),new THREE.MeshStandardMaterial({color:0x1a1a22,roughness:.4,emissive:0x2a0a40,emissiveIntensity:.6}));g.add(body);
 const lab=ctex(256,160,(x,w,h)=>{const gr=x.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#ff3fa4');gr.addColorStop(1,'#3dd6ff');x.fillStyle=gr;x.fillRect(0,0,w,h);x.fillStyle='#111';x.fillRect(40,60,176,56);x.fillStyle='#fff';x.font='bold 30px Anton, Impact';x.textAlign='center';x.fillText('SECRET TAPE',w/2,42);for(const cx of[86,170]){x.beginPath();x.arc(cx,88,20,0,7);x.fillStyle='#ddd';x.fill();x.fillStyle='#111';x.beginPath();x.arc(cx,88,8,0,7);x.fill();}},{clamp:true});
 for(const z of[.052,-.052]){const l=new THREE.Mesh(new THREE.PlaneGeometry(.56,.34),new THREE.MeshStandardMaterial({map:lab,emissive:0xffffff,emissiveMap:lab,emissiveIntensity:1.4,roughness:.5}));l.position.z=z;if(z<0)l.rotation.y=Math.PI;g.add(l);}return g;}
const beamMat=()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{c:{value:new THREE.Color(1,.5,.15)},a:{value:1}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 c;uniform float a;varying vec2 vU;void main(){float f=smoothstep(0.,.08,vU.y)*(1.-vU.y)*(1.-vU.y)*.4*a;gl_FragColor=vec4(c*f,1.);}',side:THREE.DoubleSide});
function mergeG(list){let n=0;const gs=list.map(g=>g.index?g.toNonIndexed():g);gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
 for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));return r;}

/* ---------------- level ---------------- */
export function buildLevel(L,world,M,T){const root=new THREE.Group(),bag=new Bag(),meshes=[],anim=[];srand(L.id.length*977+3);
 const holes=[];
 for(const p of world.prims){switch(p.t){
  case'box':prism(bag,p,p.y0,p.h,p.h,p.h,p.h,p.mat||'conc',p.side||p.mat||'conc',p.hw,p.hd,!!(M[p.side]&&M[p.side].face));break;
  case'wedge':prism(bag,p,p.y0,p.h0,p.h0,p.h1,p.h1,p.mat||'ramp',p.side||'ply');break;
  case'stairs':stairs(bag,p);break;
  case'qp':qpGeo(bag,p,M);break;
  case'bowl':holes.push(bowlGeo(bag,p));break;
  case'cyl':cylGeo(bag,p,world.hazards.find(h=>Math.hypot(h.x-p.x,h.z-p.z)<.1)?world.hazards[0].r:0);break;}}
 railMeshes(bag,world);
 // floor with holes cut for bowls
 {const b=L.bounds,pad=L.env==='indoor'?0:60;const sh=new THREE.Shape([new THREE.Vector2(b[0]-pad,-(b[2]-pad)),new THREE.Vector2(b[1]+pad,-(b[2]-pad)),new THREE.Vector2(b[1]+pad,-(b[3]+pad)),new THREE.Vector2(b[0]-pad,-(b[3]+pad))]);
  for(const h of holes){sh.holes.push(new THREE.Path(h.slice(0,-1).map(w=>new THREE.Vector2(w[0],-w[2]))));}
  const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);g.translate(0,world.base,0);bag.add(L.floor,g,'world');}
 // fountain water + sculpture
 for(const hz of world.hazards){const w=new THREE.Mesh(new THREE.CircleGeometry(hz.r,48),new THREE.MeshStandardMaterial({map:T.water,color:0x6ab8d0,roughness:.08,metalness:.1,transparent:true,opacity:.88,envMapIntensity:1.4}));w.rotation.x=-Math.PI/2;w.position.set(hz.x,.42,hz.z);T.water.repeat.set(2,2);root.add(w);anim.push(t=>{T.water.offset.set(t*.03,t*.02);});
  const col=new THREE.CylinderGeometry(.35,.5,1.6,16);col.translate(hz.x,.8,hz.z);bag.add('slab',col);const bw=new THREE.CylinderGeometry(1.1,.4,.35,24);bw.translate(hz.x,1.7,hz.z);bag.add('slab',bw);}
 decor[L.env](L,world,bag,root,M,T,anim);
 bag.build(root,M,meshes);
 // pickups
 const letters=L.letters.map((pos,i)=>{const g=new THREE.Group();const m=letterMesh('SKATE'[i]);g.add(m);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,12,10,1,true),beamMat());beam.userData.noAO=true;beam.position.y=6.4;g.add(beam);g.position.set(...pos);root.add(g);return{g,m,pos:new V(...pos),ch:'SKATE'[i],got:false};});
 const tg=new THREE.Group();const tm=tapeMesh();tg.add(tm);const tb=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,12,10,1,true),beamMat());tb.userData.noAO=true;tb.material.uniforms.c.value.setRGB(.6,.2,1);tb.position.y=6.4;tg.add(tb);tg.position.set(...L.tape);root.add(tg);
 const tape={g:tg,m:tm,pos:new V(...L.tape),got:false};
 return{root,meshes,letters,tape,update(t){for(const f of anim)f(t);for(const l of letters){l.g.visible=!l.got;l.m.rotation.y=t*2.2;l.m.position.y=Math.sin(t*2.4+l.pos.x)*.12;}tape.g.visible=!tape.got;tm.rotation.y=t*1.6;tm.position.y=Math.sin(t*2)*.1;},
  dispose(){root.traverse(o=>{if(o.geometry)o.geometry.dispose();});}};}

/* ---------------- set dressing per environment ---------------- */
const decor={
 indoor(L,W,bag,root,M,T,anim){const[x0,x1,z0,z1]=L.bounds,H=13;
  // walls: block lower band, brick above
  const wall=(ax,az,bx,bz,nx,nz)=>{const len=Math.hypot(bx-ax,bz-az),cx=(ax+bx)/2+nx*.5,cz=(az+bz)/2+nz*.5;for(const[y0,y1,m]of[[0,3.2,'block'],[3.2,H,'brick']]){const g=new THREE.BoxGeometry(Math.abs(nx)?1:len+2,y1-y0,Math.abs(nz)?1:len+2);g.translate(cx,(y0+y1)/2,cz);bag.add(m,g);}};
  wall(x0,z0,x1,z0,0,-1);wall(x0,z1,x1,z1,0,1);wall(x0,z0,x0,z1,-1,0);wall(x1,z0,x1,z1,1,0);
  // roof with skylights
  const sky=[[-18,-6,-10,6],[-4,8,-10,6],[12,24,-10,6],[-18,-6,12,20],[12,24,12,20]];
  {const sh=new THREE.Shape([new THREE.Vector2(x0-1,z0-1),new THREE.Vector2(x1+1,z0-1),new THREE.Vector2(x1+1,z1+1),new THREE.Vector2(x0-1,z1+1)]);for(const s of sky)sh.holes.push(new THREE.Path([new THREE.Vector2(s[0],s[2]),new THREE.Vector2(s[0],s[3]),new THREE.Vector2(s[1],s[3]),new THREE.Vector2(s[1],s[2])]));
   const g=new THREE.ShapeGeometry(sh);g.rotateX(Math.PI/2);g.translate(0,H,0);bag.add('dark',g);const g2=g.clone();g2.translate(0,.3,0);const ip=g2.attributes.normal;for(let i=0;i<ip.count;i++)ip.setY(i,-ip.getY(i));g2.index.array.reverse();bag.add('dark',g2);}
  const glass=new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.8,2.1),side:THREE.DoubleSide});
  const shaftM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{t:{value:0}},vertexShader:'varying vec3 vP;varying float vY;void main(){vP=position;vY=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'varying float vY;uniform float t;void main(){float f=smoothstep(0.,13.,vY)*.022+.004;gl_FragColor=vec4(vec3(1.,.93,.8)*f,1.);}'});
  const sun=new V(.42,1,.3).normalize();
  for(const s of sky){const p=new THREE.Mesh(new THREE.PlaneGeometry(s[1]-s[0],s[3]-s[2]),glass);p.rotation.x=Math.PI/2;p.position.set((s[0]+s[1])/2,H+.25,(s[2]+s[3])/2);root.add(p);
   // light shaft: skylight footprint swept down along the sun direction
   const top=[[s[0],s[2]],[s[1],s[2]],[s[1],s[3]],[s[0],s[3]]];const pos=[];const off=k=>[-sun.x/sun.y*k,-sun.z/sun.y*k];const [ox,oz]=off(H);
   for(let i=0;i<4;i++){const a=top[i],b=top[(i+1)%4];pos.push(a[0],H,a[1],b[0],H,b[1],b[0]+ox,0,b[1]+oz,a[0],H,a[1],b[0]+ox,0,b[1]+oz,a[0]+ox,0,a[1]+oz);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const m=new THREE.Mesh(g,shaftM);m.renderOrder=5;m.userData.noAO=true;root.add(m);}
  // trusses and lamps
  for(let x=x0+6;x<x1;x+=9){const g=new THREE.BoxGeometry(.35,.6,z1-z0);g.translate(x,H-1.2,0);bag.add('dark',g);for(let z=z0+4;z<z1;z+=6){const d=new THREE.BoxGeometry(.12,1.2,.12);d.translate(x,H-.6,z);bag.add('dark',d);}}
  for(let z=z0+3;z<z1;z+=9){const g=new THREE.BoxGeometry(x1-x0,.3,.25);g.translate(0,H-1.5,z);bag.add('dark',g);}
  const lampG=new THREE.BoxGeometry(.32,.08,2.6),lampM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.9,2.6)});const lamps=new THREE.InstancedMesh(lampG,lampM,40);let li=0;const mt=new THREE.Matrix4();
  for(let x=x0+6;x<x1&&li<40;x+=9)for(let z=z0+8;z<z1-4&&li<40;z+=10){mt.makeTranslation(x+.6,H-2.4,z);lamps.setMatrixAt(li++,mt);const w=new THREE.CylinderGeometry(.01,.01,1,4);w.translate(x+.6,H-1.9,z);bag.add('dark',w);}lamps.count=li;root.add(lamps);
  // high windows
  const win=new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,1.8,2.2)});for(let x=x0+4;x<x1-3;x+=7){for(const z of[z0+.02,z1-.02]){const p=new THREE.Mesh(new THREE.PlaneGeometry(4.5,1.6),win);p.position.set(x,H-3.6,z);p.rotation.y=z<0?0:Math.PI;root.add(p);}}
  // graffiti + banner
  const gfx=(i,x,y,z,ry,w)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.375),new THREE.MeshStandardMaterial({map:T.gfx[i%T.gfx.length],transparent:true,roughness:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));p.position.set(x,y,z);p.rotation.y=ry;root.add(p);};
  gfx(0,0,7.6,z0+.05,0,16);gfx(1,x0+.05,5,10,Math.PI/2,9);gfx(2,x1-.05,4.6,-12,-Math.PI/2,9);gfx(3,-22,2.4,z1-.05,Math.PI,8);gfx(4,22,2.4,z1-.05,Math.PI,8);gfx(5,x1-.05,4.8,16,-Math.PI/2,8);
  // crates / barrels on the corner stacks
  for(const[x,z]of[[31.5,-24],[33.5,-22.2]]){const g=new THREE.CylinderGeometry(.35,.35,.9,14);g.translate(x,1.6+.45,z);bag.add('paintrail',g);}
 },
 day(L,W,bag,root,M,T,anim){const[x0,x1,z0,z1]=L.bounds;srand(42);const r=(a)=>Math.random()*a;
  // towers on three sides
  const tower=(ax,az,w,d,h,m)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(ax,h/2,az);bag.add(m,g);const c=new THREE.BoxGeometry(w+.6,.6,d+.6);c.translate(ax,h,az);bag.add('dark',c);};
  const facs=['facB','facG','facS'];let k=0;
  for(let x=x0-6;x<x1+10;){const w=10+r(10),h=16+r(28);tower(x+w/2,z0-6-r(4),w,10,h,facs[k++%3]);x+=w+.5;}
  for(let z=z0;z<z1-8;){const w=10+r(8),h=14+r(20);tower(x0-8,z+w/2,10,w,h,facs[k++%3]);tower(x1+8,z+w/2,10,w,h,facs[k++%3]);z+=w+.5;}
  // harbor to the south: quay, railing, water, cranes, containers
  {const q=new THREE.BoxGeometry(x1-x0+120,1.5,6);q.translate(0,-.75,z1+3);bag.add('conc',q);
   const water=new THREE.Mesh(new THREE.PlaneGeometry(1600,900),new THREE.MeshStandardMaterial({color:0x22495a,roughness:.12,metalness:.3,envMapIntensity:1.2}));water.rotation.x=-Math.PI/2;water.position.set(0,-1.6,z1+456);root.add(water);
   for(let x=x0;x<=x1;x+=2.2){const p=new THREE.CylinderGeometry(.04,.04,1.05,6);p.translate(x,.52,z1-.1);bag.add('rail',p,'keep');}
   for(const y of[1.05,.6]){const g=new THREE.CylinderGeometry(.03,.03,x1-x0,6);g.rotateZ(Math.PI/2);g.translate(0,y,z1-.1);bag.add('rail',g,'keep');}
   const crane=(cx,cz,s)=>{const legs=[[-6,-5],[6,-5],[-6,5],[6,5]];for(const[a,b]of legs){const g=new THREE.BoxGeometry(1*s,40*s,1*s);g.translate(cx+a*s,20*s,cz+b*s);bag.add('paintrail',g,'keep');}
    const t=new THREE.BoxGeometry(14*s,2.5*s,12*s);t.translate(cx,41*s,cz);bag.add('paintrail',t,'keep');const boom=new THREE.BoxGeometry(2*s,2*s,70*s);boom.translate(cx,44*s,cz-10*s);bag.add('paintrail',boom,'keep');};
   crane(-70,150,1.1);crane(-20,175,1.2);crane(40,160,1.1);crane(100,190,1.25);
   const cols=[0xb03a2e,0x2e6fb0,0x2f8f5a,0xd09030,0x6a6a72];for(let i=0;i<40;i++){const g=new THREE.BoxGeometry(6,2.6,2.4);g.translate(-120+r(260),1.3+(r(1)<.4?2.6:0),110+r(30));const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:cols[i%5],roughness:.7,metalness:.3}));root.add(m);}}
  // street lamps
  const lp=[];for(let x=-38;x<=38;x+=12.5){lp.push([x,-30],[x,32]);}for(let z=-16;z<=28;z+=11){lp.push([-32,z],[36,z]);}
  const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.07,.1,5,8),new THREE.MeshStandardMaterial({color:0x2c3036,roughness:.5,metalness:.7}),lp.length),head=new THREE.InstancedMesh(new THREE.SphereGeometry(.28,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,2.1,1.6)}),lp.length);const mt=new THREE.Matrix4();
  lp.forEach(([x,z],i)=>{const y=W.H(x,z);mt.makeTranslation(x,y+2.5,z);pole.setMatrixAt(i,mt);mt.makeTranslation(x,y+5.1,z);head.setMatrixAt(i,mt);});pole.castShadow=true;root.add(pole,head);
  trees(root,[[-14,-8,.75],[14,-8,.75],[-36,-30,1.5],[-18,-31,1.5],[18,-31,1.5],[36,-30,1.5]],W);
  // terrace front face graffiti + plaza banner
  const gp=new THREE.Mesh(new THREE.PlaneGeometry(10,3.75),new THREE.MeshStandardMaterial({map:T.gfx[1],transparent:true,depthWrite:false,roughness:.8}));gp.position.set(-18,1.5/2+.1,-23.98);gp.scale.set(.4,.4,1);root.add(gp);
  // street-level shop fronts on the side towers (lit awnings)
  const awn=new THREE.MeshStandardMaterial({color:0xd1361f,roughness:.6});for(let z=-20;z<28;z+=12){for(const x of[x0-2.6,x1+2.6]){const a=new THREE.Mesh(new THREE.BoxGeometry(1.4,.25,6),awn);a.position.set(x,3.4,z);root.add(a);}}
 },
 dusk(L,W,bag,root,M,T,anim){const[x0,x1,z0,z1]=L.bounds;srand(77);const r=a=>Math.random()*a;
  // chain-link fence on the open sides
  const fenceM=new THREE.MeshStandardMaterial({map:T.chain,transparent:true,alphaTest:.4,side:THREE.DoubleSide,roughness:.5,metalness:.6});T.chain.repeat.set(30,1.5);
  const fence=(ax,az,bx,bz)=>{const len=Math.hypot(bx-ax,bz-az);const p=new THREE.Mesh(new THREE.PlaneGeometry(len,3.4),fenceM.clone());p.material.map=T.chain.clone();p.material.map.repeat.set(len/1.2,2.8);p.material.map.needsUpdate=true;p.position.set((ax+bx)/2,1.7,(az+bz)/2);p.rotation.y=Math.atan2(bx-ax,bz-az)+Math.PI/2;root.add(p);
   for(let t=0;t<=len;t+=3){const x=ax+(bx-ax)*t/len,z=az+(bz-az)*t/len;const g=new THREE.CylinderGeometry(.045,.045,3.5,6);g.translate(x,1.75,z);bag.add('rail',g,'keep');}
   const tg=new THREE.CylinderGeometry(.035,.035,len,6);tg.rotateZ(Math.PI/2);tg.rotateY(-Math.atan2(bz-az,bx-ax));tg.translate((ax+bx)/2,3.4,(az+bz)/2);bag.add('rail',tg,'keep');};
  fence(x1,-30,x1,z1);fence(x0,z1,x1,z1);fence(x0,-26,x0,18);fence(2.2,-44,8,-44);
  // houses + trees beyond the fence
  const house=(x,z,ry)=>{const w=8+r(4),d=8+r(3),h=4+r(2);const g=new THREE.BoxGeometry(w,h,d);g.rotateY(ry);g.translate(x,h/2,z);bag.add(Math.random()<.5?'facB':'facS',g);
   const roof=new THREE.CylinderGeometry(.01,w*.75,3,4,1);roof.rotateY(Math.PI/4);roof.scale(1,1,d/w);roof.rotateY(ry);roof.translate(x,h+1.5,z);bag.add('dark',roof);};
  for(let z=z0;z<z1;z+=13){house(x1+14+r(4),z,0);house(x1+30,z+5,0);}for(let x=x0;x<x1;x+=13){house(x,z1+14+r(4),0);house(x+5,z1+30,0);}for(let z=-20;z<z1;z+=13)house(x0-16,z,0);
  const tr=[];for(let i=0;i<40;i++){const side=i%3;tr.push(side===0?[x1+6+r(30),z0+r(z1-z0),0]:side===1?[x0+r(x1-x0),z1+6+r(30),0]:[x0-6-r(26),-20+r(60),0]);}trees(root,tr,W,1.4);
  // court lines + hoops
  const court=ctex(512,256,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='rgba(240,240,230,.85)';x.lineWidth=4;x.strokeRect(6,6,w-12,h-12);x.beginPath();x.moveTo(w/2,6);x.lineTo(w/2,h-6);x.stroke();x.beginPath();x.arc(w/2,h/2,34,0,7);x.stroke();
   for(const s of[0,1]){x.save();if(s){x.translate(w,0);x.scale(-1,1);}x.strokeRect(6,h/2-38,90,76);x.beginPath();x.arc(96,h/2,38,-Math.PI/2,Math.PI/2);x.stroke();x.beginPath();x.arc(20,h/2,110,-1.2,1.2);x.stroke();x.restore();}
   x.fillStyle='rgba(200,60,40,.25)';x.fillRect(6,h/2-38,90,76);x.fillRect(w-96,h/2-38,90,76);},{clamp:true});
  const cp=new THREE.Mesh(new THREE.PlaneGeometry(28,14),new THREE.MeshStandardMaterial({map:court,transparent:true,depthWrite:false,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2}));cp.rotation.x=-Math.PI/2;cp.position.set(26,.01,12);root.add(cp);
  for(const s of[-1,1]){const x=26+s*13.2;const g=new THREE.CylinderGeometry(.08,.08,3.4,8);g.translate(x+s*.8,1.7,12);bag.add('paintrail',g,'keep');const b=new THREE.BoxGeometry(.08,1.05,1.8);b.translate(x,3.2,12);bag.add('dark',b,'keep');
   const rim=new THREE.Mesh(new THREE.TorusGeometry(.23,.02,6,16),new THREE.MeshStandardMaterial({color:0xff5a10,roughness:.4,metalness:.5}));rim.rotation.x=Math.PI/2;rim.position.set(x-s*.3,2.95,12);root.add(rim);}
  // clock face on the tower
  const clock=ctex(256,256,(x,w,h)=>{x.fillStyle='#f4ecd8';x.beginPath();x.arc(128,128,120,0,7);x.fill();x.strokeStyle='#222';x.lineWidth=8;x.stroke();for(let i=0;i<12;i++){const a=i/12*Math.PI*2;x.fillStyle='#222';x.fillRect(128+Math.sin(a)*96-4,128-Math.cos(a)*96-10,8,20);}
   x.lineWidth=10;x.beginPath();x.moveTo(128,128);x.lineTo(128+60,128-30);x.stroke();x.lineWidth=6;x.beginPath();x.moveTo(128,128);x.lineTo(128-10,128-95);x.stroke();},{clamp:true});
  const cf=new THREE.Mesh(new THREE.CircleGeometry(1.4,32),new THREE.MeshStandardMaterial({map:clock,emissive:0xffe0a0,emissiveMap:clock,emissiveIntensity:.6,roughness:.6}));cf.position.set(-25,8.6,-39.97);root.add(cf);
  // flagpole + planters' trees on the quad
  {const g=new THREE.CylinderGeometry(.06,.08,11,8);g.translate(6,5.5,16);bag.add('rail',g,'keep');const fl=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.3,8,1),new THREE.MeshStandardMaterial({color:0xff4d00,side:THREE.DoubleSide,roughness:.8}));fl.position.set(7.15,10.2,16);root.add(fl);
   const fp=fl.geometry.attributes.position,base=fp.array.slice();anim.push(t=>{for(let i=0;i<fp.count;i++){const x=base[i*3];fp.setZ(i,Math.sin(x*2.4-t*6)*.18*(x+1.1));}fp.needsUpdate=true;});}
  trees(root,[[-38,28,2],[-20,32,2]],W,1);
  // distant hills
  const hill=new THREE.Mesh(new THREE.CylinderGeometry(420,440,40,48,1,true),new THREE.MeshStandardMaterial({color:0x2a2440,roughness:1,side:THREE.BackSide,fog:true}));hill.position.y=-8;root.add(hill);
  // school name sign
  const sign=ctex(1024,128,(x,w,h)=>{x.fillStyle='#24324a';x.fillRect(0,0,w,h);x.fillStyle='#f4ecd8';x.font='84px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.font='64px Anton, Impact, sans-serif';x.fillText('HARBOR HEIGHTS HIGH SCHOOL',w/2,h/2+4);},{clamp:true});
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(16,2),new THREE.MeshStandardMaterial({map:sign,roughness:.6}));sg.position.set(-24,3.6,-25.97);root.add(sg);
  const gfx=new THREE.Mesh(new THREE.PlaneGeometry(10,3.75),new THREE.MeshStandardMaterial({map:T.gfx[3],transparent:true,depthWrite:false,roughness:.8}));gfx.position.set(26,2.2,-29.97);root.add(gfx);
 }};
function trees(root,list,W,sc=1){const tg=[],fg=[];for(const[x,z,y]of list){const gy=y??W.H(x,z);const s=sc*(.8+Math.random()*.5);const t=new THREE.CylinderGeometry(.12*s,.18*s,2.6*s,7);t.translate(x,gy+1.3*s,z);tg.push(t);
  for(let i=0;i<4;i++){const f=new THREE.IcosahedronGeometry((1.1+Math.random()*.6)*s,1);f.translate(x+(Math.random()-.5)*1.4*s,gy+(2.8+Math.random()*1.4)*s,z+(Math.random()-.5)*1.4*s);fg.push(f);}}
 if(!tg.length)return;const a=new THREE.Mesh(mergeG(tg),new THREE.MeshStandardMaterial({color:0x4a3626,roughness:.9}));const b=new THREE.Mesh(mergeG(fg),new THREE.MeshStandardMaterial({color:0x3f6a2c,roughness:.85,flatShading:true}));a.castShadow=b.castShadow=true;root.add(a,b);}
