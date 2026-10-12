// IRONCLAD — battlefields: heightfield terrain, three original maps, destructible props, collision + raycasts, nav grid, minimap layer.
import * as THREE from '../vendor/three.module.min.js';
import {V3,cl,sstep,mulberry,fbm,noise,merge,M,boxUV,canvas} from './util.js';
import {groundTex,facadeTex,roofTex,rockTex,leafTex,rustTex} from './tex.js';

export const B=108;            // playable half-extent (metres)
const SIZE=320,RES=160,CELL=SIZE/RES;
export const MAPS=[
 {id:'desert',n:'SANDGLASS RUINS',d:'Sun-bleached ruins, dunes and an oasis'},
 {id:'snow',n:'FROSTFALL HAMLET',d:'Snowbound village, pine woods and a frozen lake'},
 {id:'port',n:'RUSTWATER DOCKS',d:'Container yard, warehouses and cranes at dusk'}];
const THEME={
 desert:{ground:'sand',zen:0x3b6db4,hor:0xe9d2ad,sunCol:0xfff0d8,sunI:3.1,sun:[.55,.62,.3],hemi:[0xc4d6ff,0x9a7a52,1.05],fog:0xe6cfa6,fogD:.0042,exp:.92,rough:.97,water:0x2f7a7a,
  vc:{base:[1,1,1],alt:[.9,.84,.76],rock:[.62,.55,.48],road:[.92,.83,.7]}},
 snow:{ground:'snow',zen:0x6f86a6,hor:0xdbe3ec,sunCol:0xffe6cc,sunI:2.2,sun:[-.45,.38,-.5],hemi:[0xd4e2ff,0x8c96a6,1.25],fog:0xd6dee8,fogD:.0068,exp:.86,rough:.86,water:0x9cc4dc,
  vc:{base:[1,1,1],alt:[.86,.9,.98],rock:[.36,.36,.38],road:[.62,.56,.5]}},
 port:{ground:'concrete',zen:0x24335e,hor:0xf09a64,sunCol:0xffb27a,sunI:2.6,sun:[-.75,.2,.35],hemi:[0x8ea4d8,0x5a4a40,1.0],fog:0xb88a74,fogD:.0046,exp:1.0,rough:.9,water:0x1b3a4a,
  vc:{base:[1,1,1],alt:[.82,.82,.84],rock:[.5,.48,.46],road:[.55,.56,.58]}}};

/* ---------------- terrain ---------------- */
export class Terrain{constructor(fn){this.h=new Float32Array((RES+1)*(RES+1));for(let j=0;j<=RES;j++)for(let i=0;i<=RES;i++)this.h[j*(RES+1)+i]=fn(-SIZE/2+i*CELL,-SIZE/2+j*CELL);}
 height(x,z){const fx=cl((x+SIZE/2)/CELL,0,RES-1e-4),fz=cl((z+SIZE/2)/CELL,0,RES-1e-4),i=fx|0,j=fz|0,u=fx-i,v=fz-j,H=this.h,n=RES+1;
  return(H[j*n+i]*(1-u)+H[j*n+i+1]*u)*(1-v)+(H[(j+1)*n+i]*(1-u)+H[(j+1)*n+i+1]*u)*v;}
 normal(x,z,o=new V3()){const e=1.2;return o.set(this.height(x-e,z)-this.height(x+e,z),2*e,this.height(x,z-e)-this.height(x,z+e)).normalize();}}

/* ---------------- obstacle helpers ---------------- */
// obstacle: {x,z,hx,hz,rot,c,s,y0,h,kind,hp,max,alive,ram,pass,mat,r}
export function mkOb(o){o.c=Math.cos(o.rot||0);o.s=Math.sin(o.rot||0);o.rot=o.rot||0;o.alive=true;o.max=o.hp=o.hp??Infinity;o.ram=o.ram??Infinity;o.r=Math.hypot(o.hx,o.hz);return o;}
const _l={};
// segment p0->p1 vs oriented box (yaw only). returns t in [0,1] and world normal, or null
export function segBox(o,p0,p1,pad=0){const dx=p0.x-o.x,dz=p0.z-o.z,ex=p1.x-p0.x,ez=p1.z-p0.z;
 const ox=dx*o.c-dz*o.s,oz=dx*o.s+dz*o.c,vx=ex*o.c-ez*o.s,vz=ex*o.s+ez*o.c,oy=p0.y-o.y0,vy=p1.y-p0.y;
 let t0=0,t1=1,ax=-1,sg=0;const sl=(O,Vd,lo,hi,a)=>{if(Math.abs(Vd)<1e-9){return O>=lo&&O<=hi;}let ta=(lo-O)/Vd,tb=(hi-O)/Vd,s=-1;if(ta>tb){const t=ta;ta=tb;tb=t;s=1;}if(ta>t0){t0=ta;ax=a;sg=s;}if(tb<t1)t1=tb;return t0<=t1;};
 if(!sl(ox,vx,-o.hx-pad,o.hx+pad,0)||!sl(oz,vz,-o.hz-pad,o.hz+pad,2)||!sl(oy,vy,-pad,o.h+pad,1))return null;
 if(ax<0)return{t:0,nx:0,ny:1,nz:0,inside:true};
 _l.t=t0;if(ax===0){_l.nx=sg*o.c;_l.nz=-sg*o.s;_l.ny=0;}else if(ax===2){_l.nx=sg*o.s;_l.nz=sg*o.c;_l.ny=0;}else{_l.nx=0;_l.nz=0;_l.ny=sg;}_l.inside=false;_l.axis=ax;return _l;}
// 2D SAT: push box A out of box B. returns {x,z,d} (push for A) or null
const _p={x:0,z:0,d:0};
export function obbPush(ax,az,ahx,ahz,ac,as,b,pad=0){const axes=[[ac,-as],[as,ac],[b.c,-b.s],[b.s,b.c]];const dx=b.x-ax,dz=b.z-az;let best=1e9,bx=0,bz=0;
 for(const[nx,nz]of axes){const ra=ahx*Math.abs(ac*nx-as*nz)+ahz*Math.abs(as*nx+ac*nz);const rb=b.hx*Math.abs(b.c*nx-b.s*nz)+b.hz*Math.abs(b.s*nx+b.c*nz);const d=dx*nx+dz*nz;const ov=ra+rb+pad-Math.abs(d);if(ov<=0)return null;if(ov<best){best=ov;const sg=d>0?-1:1;bx=nx*sg;bz=nz*sg;}}
 _p.x=bx;_p.z=bz;_p.d=best;return _p;}
export function pointIn(o,x,z,pad=0){const dx=x-o.x,dz=z-o.z;const lx=dx*o.c-dz*o.s,lz=dx*o.s+dz*o.c;return Math.abs(lx)<=o.hx+pad&&Math.abs(lz)<=o.hz+pad;}

/* ---------------- sky ---------------- */
function skyDome(T){const sd=new V3(...T.sun).normalize();return new THREE.Mesh(new THREE.SphereGeometry(1400,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{uZen:{value:new THREE.Color(T.zen)},uHor:{value:new THREE.Color(T.hor)},uSun:{value:sd},uSunC:{value:new THREE.Color(T.sunCol)},uT:{value:0}},
 vertexShader:'varying vec3 vP;void main(){vP=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 uZen,uHor,uSun,uSunC;uniform float uT;varying vec3 vP;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fb(vec2 p){float a=0.,m=.5;for(int i=0;i<5;i++){a+=n(p)*m;p*=2.1;m*=.5;}return a;}
 void main(){vec3 d=normalize(vP);float y=d.y;vec3 c=mix(uHor,uZen,pow(smoothstep(-.02,.6,y),.7));
  float s=max(0.,dot(d,uSun));c+=uSunC*(pow(s,600.)*8.+pow(s,24.)*.35+pow(s,4.)*.12);
  if(y>0.){vec2 cp=d.xz/(y+.12)*1.6+vec2(uT*.004,0.);float cl=smoothstep(.5,.85,fb(cp));c=mix(c,mix(uHor*1.05,vec3(1.),.4)*(.8+.4*s),cl*.55*smoothstep(0.,.25,y));}
  c=mix(c,uHor*.92,smoothstep(.0,-.25,y));gl_FragColor=vec4(c,1.);}`}));}
function envFrom(R,T){const s=new THREE.Scene();s.add(skyDome(T));const g=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshBasicMaterial({color:new THREE.Color(T.hor).multiplyScalar(.45)}));g.rotation.x=-Math.PI/2;g.position.y=-30;s.add(g);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}

/* ---------------- builder kit ---------------- */
export function buildWorld(R,id,seed=1){const T=THEME[id],rnd=mulberry(seed*7919+id.length*131);const root=new THREE.Group();
 const W={id,name:MAPS.find(m=>m.id===id).n,T,root,obs:[],bushes:[],houses:[],anim:[],drops:[],dirty:true,time:0};
 /* ----- heights ----- */
 const edge=(x,z)=>sstep(B-6,B+40,Math.max(Math.abs(x),Math.abs(z)));
 let hf;
 if(id==='desert'){hf=(x,z)=>{const d=Math.hypot(x,z),town=1-sstep(34,58,d);let h=fbm(x/70,z/70,4,1)*4.2+Math.sin((x*.55+z)/19+fbm(x/40,z/40,2,3)*4)*1.6*(1-town);
  h*=1-town*.9;h+=town*.4;// hill with a mesa top
  const hd=Math.hypot(x-68,z-4);h+=9*(1-sstep(14,36,hd));
  const od=Math.hypot(x+64,z-6);h-=2.2*(1-sstep(6,20,od));
  return h+edge(x,z)*(18+fbm(x/30,z/30,3,5)*12);};}
 else if(id==='snow'){hf=(x,z)=>{const d=Math.hypot(x,z),vil=1-sstep(30,56,d);let h=fbm(x/85,z/85,4,2)*7+fbm(x/28,z/28,3,6)*1.3;h*=1-vil*.75;
  const ld=Math.hypot(x+62,z+4);const lake=1-sstep(20,30,ld);h=h*(1-lake)+(-1.2)*lake;
  const hd=Math.hypot(x-64,z);h+=6.5*(1-sstep(10,40,hd));
  return h+edge(x,z)*(24+fbm(x/26,z/26,3,8)*16);};}
 else{hf=(x,z)=>{let h=fbm(x/50,z/50,2,4)*.25;if(x<-86)h-=sstep(-86,-90,x)*5.2;const e=sstep(B,B+30,Math.max(Math.abs(z),x));return h+e*2;};}
 const ter=W.terrain=new Terrain(hf);const H=(x,z)=>ter.height(x,z);
 /* ----- terrain mesh ----- */
 const gt=groundTex(T.ground);gt.map.repeat.set(SIZE/7,SIZE/7);gt.normal.repeat.set(SIZE/7,SIZE/7);
 const tg=new THREE.PlaneGeometry(SIZE,SIZE,RES,RES);tg.rotateX(-Math.PI/2);const pa=tg.attributes.position,colA=new Float32Array(pa.count*3);
 const roads=[];W.roads=roads;
 const roadD=(x,z)=>{let m=1e9;for(const r of roads)for(let i=0;i<r.length-1;i++){const[a,b]=[r[i],r[i+1]];const ex=b[0]-a[0],ez=b[1]-a[1],L2=ex*ex+ez*ez;const t=cl(((x-a[0])*ex+(z-a[1])*ez)/L2,0,1);m=Math.min(m,Math.hypot(x-a[0]-ex*t,z-a[1]-ez*t));}return m;};
 if(id==='desert')roads.push([[0,-140],[0,-60],[6,-30],[0,0],[-6,30],[0,60],[0,140]],[[-140,10],[-64,6],[-30,0],[0,0],[34,-2],[68,4]]);
 if(id==='snow')roads.push([[-140,30],[-70,26],[-30,10],[0,0],[30,-8],[64,-2],[140,-20]],[[0,-140],[4,-60],[0,0],[-4,60],[0,140]]);
 if(id==='port')roads.push([[-80,-140],[-80,140]],[[-140,0],[140,0]],[[30,-140],[30,140]]);
 for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,H(x,z));}
 tg.computeVertexNormals();const na=tg.attributes.normal;
 for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i),y=pa.getY(i),ny=na.getY(i);const v=T.vc;let c=[...v.base];
  const n1=fbm(x/22,z/22,3,11)*.5+.5;for(let k=0;k<3;k++)c[k]=c[k]*(1-n1*.5)+v.alt[k]*n1*.5;
  const rk=sstep(.9,.78,ny);for(let k=0;k<3;k++)c[k]=c[k]*(1-rk)+v.rock[k]*rk;
  const rd=roadD(x,z),rw=1-sstep(3,6.5,rd+noise(x/6,z/6)*2);for(let k=0;k<3;k++)c[k]=c[k]*(1-rw*.8)+v.road[k]*rw*.8;
  if(id==='snow'&&y<-.6){c=[.78,.88,.98];}
  if(id==='port'&&x<-86){c=[.5,.45,.4];}
  colA[i*3]=c[0];colA[i*3+1]=c[1];colA[i*3+2]=c[2];}
 tg.setAttribute('color',new THREE.BufferAttribute(colA,3));
 const tm=new THREE.MeshStandardMaterial({map:gt.map,normalMap:gt.normal,normalScale:new THREE.Vector2(.9,.9),vertexColors:true,roughness:T.rough,metalness:0,envMapIntensity:.4});
 if(id==='snow'){tm.roughness=.78;}
 const terrainMesh=new THREE.Mesh(tg,tm);terrainMesh.receiveShadow=true;root.add(terrainMesh);W.terrainMesh=terrainMesh;
 const sky=skyDome(T);root.add(sky);W.sky=sky;
 W.env=envFrom(R,T);
 // water
 const waterAt=[];
 if(id==='port')waterAt.push({x:-200,z:0,w:240,d:SIZE*1.4,y:-1.3});
 if(id==='desert')waterAt.push({x:-64,z:6,w:26,d:26,y:-.9,round:true});
 if(id==='snow')waterAt.push({x:-62,z:-4,w:58,d:58,y:-1.05,round:true,ice:true});
 const wn=normalWave();W.waterTex=wn;
 for(const w of waterAt){const g=w.round?new THREE.CircleGeometry(w.w/2,48):new THREE.PlaneGeometry(w.w,w.d);g.rotateX(-Math.PI/2);
  const m=new THREE.MeshStandardMaterial({color:T.water,roughness:w.ice?.12:.05,metalness:w.ice?0:.1,normalMap:wn,normalScale:new THREE.Vector2(w.ice?.15:.6,w.ice?.15:.6),transparent:!w.ice,opacity:w.ice?1:.88,envMapIntensity:1.2});
  const mesh=new THREE.Mesh(g,m);mesh.position.set(w.x,w.y,w.z);mesh.receiveShadow=true;root.add(mesh);}
 W.ice=id==='snow'?{x:-62,z:-4,r:24}:null;
 /* ----- keep-out & placement ----- */
 const spawnZ=96;W.spawns=[[],[]];for(let t=0;t<2;t++)for(let i=0;i<6;i++)W.spawns[t].push({x:(i-2.5)*12,z:(t?-1:1)*(spawnZ-(i%2)*6),yaw:t?0:Math.PI});
 W.flags=[{x:id==='port'?14:0,z:80},{x:id==='port'?-14:0,z:-80}];
 W.points=id==='desert'?[{x:-56,z:-2,n:'A'},{x:0,z:0,n:'B'},{x:66,z:4,n:'C'}]:id==='snow'?[{x:-58,z:-4,n:'A'},{x:0,z:2,n:'B'},{x:62,z:0,n:'C'}]:[{x:-64,z:0,n:'A'},{x:0,z:0,n:'B'},{x:62,z:0,n:'C'}];
 const keep=[...W.spawns.flat().map(s=>({x:s.x,z:s.z,r:9})),...W.flags.map(f=>({x:f.x,z:f.z,r:9})),...W.points.map(p=>({x:p.x,z:p.z,r:7}))];
 const free=(x,z,r,hx=r,hz=r,rot=0)=>{if(Math.abs(x)>B-4||Math.abs(z)>B-4)return false;for(const k of keep)if(Math.hypot(x-k.x,z-k.z)<k.r+r)return false;const c=Math.cos(rot),s=Math.sin(rot);for(const o of W.obs){if(Math.hypot(x-o.x,z-o.z)>o.r+Math.hypot(hx,hz)+.6)continue;if(obbPush(x,z,hx,hz,c,s,o,.5))return false;}return true;};
 const baseY=(x,z,hx,hz,c,s)=>{let m=1e9;for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1],[0,0]]){const lx=a*hx,lz=b*hz;m=Math.min(m,H(x+lx*c+lz*s,z-lx*s+lz*c));}return m;};
 /* ----- instanced prop families ----- */
 const fam={};const famDefs=[];
 const addFam=(k,geo,mat,shadow=true)=>{fam[k]={geo,mat,list:[],shadow};famDefs.push(k);};
 const place=(k,o,mtx,color)=>{fam[k].list.push({o,m:mtx,color});if(o){o.fam=k;o.fi=fam[k].list.length-1;}};
 /* ----- materials ----- */
 const mats={};const fmat=(k,o={})=>mats[k]||(mats[k]=new THREE.MeshStandardMaterial({map:facadeTex(k),roughness:.9,metalness:k==='metal'?.35:0,...o}));
 const rt=rockTex();const rockM=new THREE.MeshStandardMaterial({map:rt.map,normalMap:rt.normal,roughness:.95,vertexColors:true});
 /* ----- prop constructors ----- */
 const S=W.obs;
 function house(x,z,w,d,h,rot,style,tint){const c=Math.cos(rot),s=Math.sin(rot);const y0=baseY(x,z,w/2,d/2,c,s)-.4;const hh=h+.4;
  const o=mkOb({x,z,hx:w/2,hz:d/2,rot,y0,h:hh+(style==='wood'?d*.32:0),kind:'house',hp:style==='metal'?520:style==='wood'?240:300,mat:style==='wood'?'wood':style==='metal'?'metal':'stone',pass:false});
  const g=new THREE.Group();g.position.set(x,y0,z);g.rotation.y=rot;
  const bodyM=fmat(style).clone();if(tint)bodyM.color.set(tint);
  const body=new THREE.Mesh(boxUV(w,hh,d,4,3.2),bodyM);body.position.y=hh/2;body.castShadow=body.receiveShadow=true;g.add(body);
  // fix vertical UV so windows sit on each storey
  if(style==='wood'){const rg=new THREE.BufferGeometry();const r0=d/2+.5,ry=d*.34,ov=.6;const v=[-w/2-ov,hh,-r0, w/2+ov,hh,-r0, w/2+ov,hh+ry,0, -w/2-ov,hh+ry,0, -w/2-ov,hh,r0, w/2+ov,hh,r0, w/2+ov,hh+ry,0, -w/2-ov,hh+ry,0];
   rg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));rg.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,w/4,0,w/4,1,0,1, 0,0,w/4,0,w/4,1,0,1],2));rg.setIndex([0,2,1,0,3,2,4,5,6,4,6,7]);rg.computeVertexNormals();
   const roof=new THREE.Mesh(rg,mats.snowroof||(mats.snowroof=new THREE.MeshStandardMaterial({map:roofTex('snow'),roughness:.75,side:THREE.DoubleSide})));roof.castShadow=true;g.add(roof);
   const gab=new THREE.BufferGeometry();gab.setAttribute('position',new THREE.Float32BufferAttribute([w/2,hh,d/2, w/2,hh,-d/2, w/2,hh+ry*.93,0, -w/2,hh,-d/2, -w/2,hh,d/2, -w/2,hh+ry*.93,0],3));gab.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,d/4,0,d/8,.5,0,0,d/4,0,d/8,.5],2));gab.computeVertexNormals();
   const gm=new THREE.Mesh(gab,bodyM);gm.castShadow=true;g.add(gm);
   const ch=new THREE.Mesh(new THREE.BoxGeometry(.9,2.2,.9),fmat('brick'));ch.position.set(w*.25,hh+ry*.7,-d*.15);ch.castShadow=true;g.add(ch);}
  else if(style==='adobe'){const pm=fmat('adobe');for(const[px,pz,pw,pd]of[[0,d/2,w+.3,.3],[0,-d/2,w+.3,.3],[w/2,0,.3,d],[-w/2,0,.3,d]]){const p=new THREE.Mesh(boxUV(pw,.6,pd,4,3.2),pm);p.position.set(px,hh+.3,pz);p.castShadow=true;g.add(p);}
   const top=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mats.flatroof||(mats.flatroof=new THREE.MeshStandardMaterial({color:0xb8996e,roughness:1})));top.rotation.x=-Math.PI/2;top.position.y=hh+.01;g.add(top);
   if(rnd()<.6){const aw=new THREE.Mesh(new THREE.BoxGeometry(w*.5,.08,2.2),new THREE.MeshStandardMaterial({color:[0xb04a2a,0x2a6a8a,0xd8c8a0][rnd()*3|0],roughness:.9}));aw.position.set(0,2.5,d/2+1.1);aw.rotation.x=.18;aw.castShadow=true;g.add(aw);}}
  else if(style==='metal'){const rf=new THREE.Mesh(new THREE.BoxGeometry(w+.6,.4,d+.6),mats.mroof||(mats.mroof=new THREE.MeshStandardMaterial({map:roofTex('metal'),roughness:.6,metalness:.4})));rf.position.y=hh+.2;rf.castShadow=true;g.add(rf);
   const door=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(8,w*.4),Math.min(6,hh*.7)),new THREE.MeshStandardMaterial({color:0x50555a,roughness:.6,metalness:.5}));door.position.set(0,Math.min(6,hh*.7)/2,d/2+.02);g.add(door);}
  else if(style==='brick'){const rf=new THREE.Mesh(new THREE.BoxGeometry(w+.4,.35,d+.4),fmat('concrete'));rf.position.y=hh+.17;rf.castShadow=true;g.add(rf);}
  root.add(g);o.group=g;o.style=style;o.dims=[w,hh,d];S.push(o);W.houses.push(o);return o;}
 const wallGeo={};
 function wall(x0,z0,x1,z1,kind,h,gap=0){const L=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(L/4)),rot=Math.atan2(x1-x0,z1-z0)+Math.PI/2;
  for(let i=0;i<n;i++){if(rnd()<gap)continue;const t=(i+.5)/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;const thin=kind==='fence'||kind==='chain';if(!free(x,z,1.2,L/n/2-.8,thin?.2:.4,rot))continue;const hh=h*(kind==='stone'&&rnd()<.35?.45+rnd()*.4:1);const c=Math.cos(rot),s=Math.sin(rot);const y0=baseY(x,z,2,.4,c,s)-.3;
   const o=mkOb({x,z,hx:L/n/2,hz:kind==='fence'||kind==='chain'?.12:.45,rot,y0,h:hh+.3,kind:kind==='fence'||kind==='chain'?'fence':'wall',hp:kind==='fence'||kind==='chain'?1:kind==='jersey'?70:110,ram:kind==='fence'||kind==='chain'?1.5:kind==='jersey'?14:20,pass:kind==='fence'||kind==='chain',mat:kind==='fence'?'wood':kind==='chain'?'metal':'stone'});
   S.push(o);place(kind,o,M(x,y0,z,0,rot,0,L/n/4,thin?1:(hh+.3),1));}}
 function tree(x,z,kind,s=1){if(!free(x,z,1.4))return;const y0=H(x,z)-.2;const o=mkOb({x,z,hx:.55*s,hz:.55*s,rot:0,y0,h:9*s,kind:'tree',hp:25,ram:3.5,pass:true,mat:'wood'});S.push(o);const ry=rnd()*6.28;o.ry=ry;o.sc=s;place(kind,o,M(x,y0,z,0,ry,0,s));}
 function rock(x,z,s){if(!free(x,z,s*1.2))return;const y0=H(x,z)-s*.45;const v=rnd()*3|0;const ry=rnd()*6.28;const o=mkOb({x,z,hx:s*.85,hz:s*.85,rot:ry,y0:y0-1,h:s*1.6+1,kind:'rock',mat:'stone'});S.push(o);place('rock'+v,o,M(x,y0,z,rnd()*.3,ry,rnd()*.3,s,s*(.7+rnd()*.4),s));}
 function bush(x,z,s){if(Math.abs(x)>B-3||Math.abs(z)>B-3)return;for(const k of keep)if(Math.hypot(x-k.x,z-k.z)<k.r+s+1)return;for(const o of S)if(o.kind!=='fence'&&Math.hypot(x-o.x,z-o.z)<o.r+s*.6)return;const y=H(x,z)-.2;W.bushes.push({x,z,r:s*1.25,y});place('bush',null,M(x,y,z,0,rnd()*6.28,0,s,s*(.75+rnd()*.35),s));}
 function column(x,z,h){if(!free(x,z,1.2))return;const y0=H(x,z)-.4;const o=mkOb({x,z,hx:.9,hz:.9,rot:0,y0,h:h+.4,kind:'column',hp:160,ram:Infinity,pass:false,mat:'stone'});S.push(o);place('column',o,M(x,y0,z,0,rnd()*6,0,1,(h+.4)/8,1));}
 function container(x,z,rot,stack){const c=Math.cos(rot),s=Math.sin(rot);const y0=baseY(x,z,6.1,1.2,c,s);const o=mkOb({x,z,hx:6.1,hz:1.25,rot,y0,h:stack*2.6,kind:'container',mat:'metal'});S.push(o);
  const pal=[0xb83a2a,0x2a6ab8,0x2a8a5a,0xd8a030,0x8a8f96,0xe06a1a,0x5a3a8a,0xc8c8c8];for(let k=0;k<stack;k++){place('cont',k===0?o:null,M(x,y0+k*2.6,z,0,rot+(k?(rnd()-.5)*.06:0),0),new THREE.Color(pal[rnd()*pal.length|0]));}}
 function tank(x,z,r,h){const y0=H(x,z);const o=mkOb({x,z,hx:r*.85,hz:r*.85,rot:0,y0,h,kind:'silo',mat:'metal'});S.push(o);place('silo',null,M(x,y0,z,0,0,0,r,h,r));}
 /* ----- geometry for families ----- */
 {const g=boxUV(4,1,.9,4,1);g.translate(0,.5,0);addFam('stone',g,fmat('stone'));}
 {const g=boxUV(4,1,.9,4,1);g.translate(0,.5,0);addFam('brick',g,fmat('brick'));}
 {const sh=new THREE.Shape();sh.moveTo(-.4,0);sh.lineTo(.4,0);sh.lineTo(.18,.3);sh.lineTo(.12,1);sh.lineTo(-.12,1);sh.lineTo(-.18,.3);const g=new THREE.ExtrudeGeometry(sh,{depth:4,bevelEnabled:false});g.translate(0,0,-2);g.rotateY(Math.PI/2);
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/1.2);addFam('jersey',g,fmat('concrete'));}
 {const parts=[];const wd=new THREE.Color(id==='snow'?0x8a6a4a:0x9a7a52);for(let i=0;i<9;i++){const g=new THREE.BoxGeometry(.12,.9+(i%2)*.15,.05);parts.push([g,M(-1.9+i*.475,.5,0),wd]);}
  parts.push([new THREE.BoxGeometry(4,.1,.06),M(0,.75,.06),wd],[new THREE.BoxGeometry(4,.1,.06),M(0,.3,.06),wd]);for(const px of[-2,2])parts.push([new THREE.BoxGeometry(.16,1.2,.16),M(px,.6,0),wd.clone().multiplyScalar(.8)]);
  addFam('fence',merge(parts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));}
 {const parts=[];const mc=new THREE.Color(0x8a9096);for(const px of[-2,2])parts.push([new THREE.CylinderGeometry(.06,.06,2.2,6),M(px,1.1,0),mc]);parts.push([new THREE.CylinderGeometry(.04,.04,4,5),M(0,2.15,0,0,0,Math.PI/2),mc]);
  const cm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.6});addFam('chainF',merge(parts),cm);
  const tex=canvas(64,64,(x)=>{x.strokeStyle='#cfd4d8';x.lineWidth=2;for(let i=-64;i<128;i+=10){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();x.beginPath();x.moveTo(i+64,0);x.lineTo(i,64);x.stroke();}});
  const ct=new THREE.CanvasTexture(tex);ct.wrapS=ct.wrapT=THREE.RepeatWrapping;const pg=new THREE.PlaneGeometry(4,2.1);pg.translate(0,1.1,0);const uv=pg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*6,uv.getY(i)*3.2);
  addFam('chain',pg,new THREE.MeshStandardMaterial({map:ct,alphaMap:ct,transparent:true,alphaTest:.3,side:THREE.DoubleSide,color:0xb8bec4,metalness:.5,roughness:.5}),false);}
 // pines (snow-capped on the snow map)
 {const parts=[];const trunk=new THREE.Color(0x4a3426),gc=new THREE.Color(0x24432c),sc=new THREE.Color(0xeef3f8);parts.push([new THREE.CylinderGeometry(.22,.32,3,6),M(0,1.5,0),trunk]);
  for(let i=0;i<4;i++){const r=2.4-i*.5,y=2.2+i*1.6;const cg=new THREE.ConeGeometry(r,2.6,8,1);const pos=cg.attributes.position;for(let k=0;k<pos.count;k++){pos.setX(k,pos.getX(k)*(1+(Math.sin(k*3.1)*.12)));}
   parts.push([cg,M(0,y+1.3,0),gc.clone().multiplyScalar(.85+i*.08)]);if(id==='snow')parts.push([new THREE.ConeGeometry(r*.82,1.2,8,1),M(0,y+2.05,0),sc]);}
  const g=merge(parts);addFam('pine',g,windMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,flatShading:true}),.05,W));}
 // palms
 {const parts=[];const tc=new THREE.Color(0x8a6a48),lc=new THREE.Color(0x4f7a32);for(let i=0;i<6;i++){const y=i*1.3;parts.push([new THREE.CylinderGeometry(.26-i*.02,.3-i*.02,1.35,7),M(Math.sin(i*.35)*i*.18,y+.65,0,0,0,-.05*i),tc.clone().multiplyScalar(i%2?.9:1.05)]);}
  for(let i=0;i<8;i++){const a=i/8*6.283;const fg=new THREE.PlaneGeometry(.9,4.4,1,4);fg.translate(0,2.2,0);const p=fg.attributes.position;for(let k=0;k<p.count;k++){const t=p.getY(k)/4.4;p.setZ(k,-t*t*1.8);}parts.push([fg,M(1.6,7.8,0,-1.15,a,0),lc.clone().multiplyScalar(.8+((i*37)%10)/25)]);}
  addFam('palm',merge(parts),windMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,side:THREE.DoubleSide}),.12,W));}
 // bushes
 {const parts=[];const bc=id==='snow'?new THREE.Color(0x34503a):id==='desert'?new THREE.Color(0x8a8350):new THREE.Color(0x5a6a3a);for(let i=0;i<7;i++){const a=i/7*6.28,r=i?.85:0;const g=new THREE.IcosahedronGeometry(i?.85:1.05,1);const p=g.attributes.position;for(let k=0;k<p.count;k++){const f=1+noise(p.getX(k)*2+i,p.getY(k)*2,p.getZ(k)*2)*.35;p.setXYZ(k,p.getX(k)*f,p.getY(k)*f*.85,p.getZ(k)*f);}
   parts.push([g,M(Math.cos(a)*r,.7+(i?0:.35),Math.sin(a)*r),bc.clone().multiplyScalar(.75+((i*53)%10)/25)]);}
  const g=merge(parts);if(id==='snow'){const p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color;for(let k=0;k<p.count;k++)if(n.getY(k)>.55&&p.getY(k)>.9){c.setXYZ(k,.93,.96,1);}}
  addFam('bush',g,windMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,map:leafTex(),flatShading:true}),.08,W));}
 // rocks
 for(let v=0;v<3;v++){const g=new THREE.IcosahedronGeometry(1,2);const p=g.attributes.position;const r2=mulberry(v*17+3);const off=[r2()*9,r2()*9,r2()*9];
  const cc=[];for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k);const f=1+noise(x*1.3+off[0],y*1.3+off[1],z*1.3+off[2])*.45;p.setXYZ(k,x*f,Math.max(-.4,y*f*.8),z*f);const s=id==='snow'&&y>.35?1:0;cc.push(s?.95:.95,s?.97:.92,s?1:.88);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));g.computeVertexNormals();addFam('rock'+v,g,rockM);}
 {const g=new THREE.CylinderGeometry(.75,.85,8,12,1);g.translate(0,4,0);const parts=[[g],[new THREE.BoxGeometry(2,.6,2),M(0,.3,0)],[new THREE.BoxGeometry(1.9,.5,1.9),M(0,7.9,0)]];addFam('column',merge(parts),new THREE.MeshStandardMaterial({map:facadeTex('adobe'),color:0xf0e6d6,roughness:.9}));}
 {const g=boxUV(12.2,2.6,2.5,2,2.6);g.translate(0,1.3,0);const tex=canvas(128,128,(x,w,h)=>{x.fillStyle='#ddd';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=8){x.fillStyle='rgba(0,0,0,.22)';x.fillRect(i,0,3,h);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(i+4,0,2,h);}x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,w,6);x.fillRect(0,h-6,w,6);for(let i=0;i<50;i++){x.fillStyle=`rgba(110,50,20,${Math.random()*.3})`;x.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*6,4+Math.random()*20);}});
  const t=new THREE.CanvasTexture(tex);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;addFam('cont',g,new THREE.MeshStandardMaterial({map:t,roughness:.65,metalness:.35}));}
 {const g=new THREE.CylinderGeometry(1,1,1,24,1);g.translate(0,.5,0);addFam('silo',g,new THREE.MeshStandardMaterial({color:0xd8d4cc,roughness:.5,metalness:.4,map:facadeTex('metal')}));}
 /* ----- map layouts ----- */
 if(id==='desert'){
  const town=[[-18,-16,10,8,5],[18,-18,9,9,4.5],[-20,18,11,8,4],[19,17,8,10,6],[-38,-2,9,12,4.5],[38,-6,10,8,4],[0,-36,12,8,5],[2,36,10,9,4.5],[-30,-34,8,8,4],[30,34,8,8,4],[-34,32,9,7,5],[33,-34,9,8,4.5],[-48,-24,8,7,4],[48,26,8,7,4]];
  for(const[x,z,w,d,h]of town)if(free(x,z,Math.hypot(w,d)/2))house(x,z,w,d,h,(rnd()-.5)*.12+(rnd()<.5?0:Math.PI/2),'adobe');
  // ruined ring wall with gaps
  for(let i=0;i<28;i++){const a0=i/28*6.283,a1=(i+1)/28*6.283;if(i%4===0)continue;wall(Math.cos(a0)*56,Math.sin(a0)*56,Math.cos(a1)*56,Math.sin(a1)*56,'stone',2.6,.25);}
  // temple on the mesa
  for(let i=0;i<10;i++){const a=i/10*6.283;column(68+Math.cos(a)*11,4+Math.sin(a)*8,rnd()<.3?3+rnd()*3:8);}
  wall(60,-6,76,-6,'stone',2.2,.3);wall(60,14,76,14,'stone',2.2,.3);
  // oasis palms
  for(let i=0;i<14;i++){const a=rnd()*6.283,r=13+rnd()*8;tree(-64+Math.cos(a)*r,6+Math.sin(a)*r,'palm',.85+rnd()*.35);}
  for(let i=0;i<10;i++){tree((rnd()-.5)*190,(rnd()-.5)*190,'palm',.8+rnd()*.3);}
  // dune walls and walled compounds in each half
  for(const s of[-1,1]){wall(-40,s*66,-14,s*66,'stone',2.4,.15);wall(14,s*66,40,s*66,'stone',2.4,.15);wall(-70,s*48,-70,s*72,'stone',2.4,.2);wall(70,s*40,70,s*68,'stone',2.4,.2);
   house(-56,s*72,10,8,4,0,'adobe');house(56,s*76,8,8,4.5,0,'adobe');wall(-46,s*78,-46,s*98,'fence',1.2);wall(46,s*78,46,s*98,'fence',1.2);}
  for(let i=0;i<70;i++){const x=(rnd()-.5)*2*(B-6),z=(rnd()-.5)*2*(B-6);rock(x,z,1.2+rnd()*2.6);}
  for(let i=0;i<110;i++){const x=(rnd()-.5)*2*(B-4),z=(rnd()-.5)*2*(B-4);bush(x,z,.9+rnd()*.8);}
  for(let i=0;i<30;i++){const a=rnd()*6.283,r=12+rnd()*16;bush(-64+Math.cos(a)*r,6+Math.sin(a)*r,1+rnd()*.6);}
 }else if(id==='snow'){
  const tints=[0x9a3a2a,0x8a5a2a,0x3a5a7a,0x6a7a4a,0xb08a4a,0x7a3a4a];
  const vil=[[-16,-18,9,7,4],[17,-16,10,7,4],[-18,18,9,8,4],[17,19,8,7,4],[-36,0,8,10,4],[37,4,9,7,4],[0,-38,10,7,4],[-2,36,9,7,4],[-30,-34,8,7,3.6],[32,32,8,7,3.6],[-34,30,9,7,4],[32,-32,8,7,4]];
  for(const[x,z,w,d,h]of vil){const r=Math.atan2(-x,-z)+(rnd()<.5?0:Math.PI/2);const rr=Math.round(r/(Math.PI/2))*(Math.PI/2)+(rnd()-.5)*.1;if(free(x,z,Math.hypot(w,d)/2))house(x,z,w,d,h,rr,'wood',tints[rnd()*tints.length|0]);}
  // chapel
  {const o=house(-6,-62,9,14,6,0,'wood',0xd8d0c0);const g=o.group;const tw=new THREE.Mesh(boxUV(3.4,7,3.4,4,3.2),fmat('wood').clone());tw.material.color.set(0xd8d0c0);tw.position.set(0,9,5);tw.castShadow=true;g.add(tw);
   const sp=new THREE.Mesh(new THREE.ConeGeometry(2.8,5,4),new THREE.MeshStandardMaterial({color:0x3a4250,roughness:.6,metalness:.3}));sp.position.set(0,15,5);sp.rotation.y=Math.PI/4;sp.castShadow=true;g.add(sp);o.h+=8;}
  // yard fences
  for(const[x,z,w,d]of vil){const r=w/2+3.5,q=d/2+3.5;if(rnd()<.75){wall(x-r,z+q,x+r,z+q,'fence',1.2,.15);wall(x+r,z-q,x+r,z+q,'fence',1.2,.2);wall(x-r,z-q,x-r,z+q,'fence',1.2,.2);}}
  // field stone walls
  for(const s of[-1,1]){wall(-90,s*50,-40,s*56,'stone',1.5,.15);wall(40,s*58,90,s*52,'stone',1.5,.15);wall(-24,s*74,24,s*74,'stone',1.5,.25);}
  // forests
  for(let i=0;i<55;i++){const a=rnd()*6.283,r=rnd()*30;tree(64+Math.cos(a)*r,Math.sin(a)*r*1.3,'pine',.8+rnd()*.5);}
  for(let i=0;i<70;i++){const x=(rnd()-.5)*2*(B-6),z=(rnd()-.5)*2*(B-6);if(Math.hypot(x+62,z+4)<32||Math.hypot(x,z)<46)continue;tree(x,z,'pine',.75+rnd()*.5);}
  for(let i=0;i<24;i++){const x=(rnd()-.5)*2*(B-6),z=(rnd()-.5)*2*(B-6);if(Math.hypot(x+62,z+4)<30)continue;rock(x,z,1+rnd()*2);}
  for(let i=0;i<90;i++){const x=(rnd()-.5)*2*(B-4),z=(rnd()-.5)*2*(B-4);if(Math.hypot(x+62,z+4)<27)continue;bush(x,z,.9+rnd()*.7);}
 }else{
  // quay cranes
  W.cranes=[];for(const z of[-50,0,50]){const x=-80;const legs=[[x-4,z-5],[x+4,z-5],[x-4,z+5],[x+4,z+5]];for(const[lx,lz]of legs){const o=mkOb({x:lx,z:lz,hx:.7,hz:.7,rot:0,y0:-1,h:30,kind:'crane',mat:'metal'});S.push(o);}W.cranes.push({x,z});}
  // container yard
  for(let gx=0;gx<4;gx++)for(let gz=0;gz<7;gz++){const x=8+gx*17,z=-60+gz*20;if(rnd()<.18)continue;for(let k=0;k<2;k++){if(rnd()<.25)continue;const zz=z+(k?3.2:0)-1.6;if(free(x,zz,4))container(x,zz,0,1+(rnd()*3|0));}}
  for(let i=0;i<14;i++){const x=-60+rnd()*40,z=(rnd()-.5)*170;if(free(x,z,6))container(x,z,rnd()<.5?0:Math.PI/2,1+(rnd()*2|0));}
  // warehouses & offices
  house(-40,-56,26,16,9,0,'metal');house(-40,56,26,16,9,0,'metal');house(-44,0,12,16,7,0,'metal');
  house(62,-80,12,9,5,0,'brick');house(62,80,12,9,5,0,'brick');house(-62,-82,9,9,5,0,'brick');house(-62,82,9,9,5,0,'brick');house(84,-30,10,12,6,0,'brick');house(84,30,10,12,6,0,'brick');
  for(const s of[-1,1]){tank(88,s*78,5,9);tank(98,s*66,4,8);}
  // chain fences & jersey barriers
  for(const s of[-1,1]){wall(-28,s*40,-28,s*76,'chain',2.1,.1);wall(-28,s*40,-56,s*40,'chain',2.1,.15);wall(44,s*62,80,s*62,'chain',2.1,.1);wall(-100,s*24,-62,s*24,'chain',2.1,.1);}
  for(let i=0;i<34;i++){const x=(rnd()-.5)*2*(B-12),z=(rnd()-.5)*2*(B-12);const r=rnd()*3.14;if(free(x,z,3))wall(x-Math.cos(r)*2,z+Math.sin(r)*2,x+Math.cos(r)*2,z-Math.sin(r)*2,'jersey',1.1);}
  for(let i=0;i<50;i++){const x=(rnd()-.5)*2*(B-4),z=(rnd()-.5)*2*(B-4);if(x<-84)continue;bush(x,z,.8+rnd()*.6);}
  for(let i=0;i<22;i++){const x=40+rnd()*60,z=(rnd()-.5)*190;bush(x,z,.9+rnd()*.6);}
 }
 /* ----- boundary walls (invisible colliders) ----- */
 for(const[x,z,hx,hz]of[[B+3,0,3,B+6],[-B-3,0,3,B+6],[0,B+3,B+6,3],[0,-B-3,B+6,3]]){const o=mkOb({x,z,hx,hz,rot:0,y0:-20,h:60,kind:'bound'});S.push(o);}
 /* ----- instantiate families ----- */
 W.fam=fam;const m4=new THREE.Matrix4();
 for(const k of famDefs){const f=fam[k];if(!f.list.length)continue;let mesh;
  if(k==='chain'){// chain mesh copies chain-fence transforms
   continue;}
  mesh=new THREE.InstancedMesh(f.geo,f.mat,f.list.length);f.list.forEach((e,i)=>{mesh.setMatrixAt(i,e.m);if(e.color)mesh.setColorAt(i,e.color);});
  mesh.castShadow=f.shadow;mesh.receiveShadow=true;root.add(mesh);f.mesh=mesh;}
 if(fam.chain&&fam.chain.list.length){const f=fam.chain;f.mesh=new THREE.InstancedMesh(f.geo,f.mat,f.list.length);f.list.forEach((e,i)=>f.mesh.setMatrixAt(i,e.m));root.add(f.mesh);
  const fr=fam.chainF;fr.mesh=new THREE.InstancedMesh(fr.geo,fr.mat,f.list.length);f.list.forEach((e,i)=>fr.mesh.setMatrixAt(i,e.m));fr.mesh.castShadow=true;root.add(fr.mesh);}
 // cranes (decor) and the moored ship
 if(id==='port'){const cm=new THREE.MeshStandardMaterial({color:0xd8a020,roughness:.6,metalness:.5});for(const c of W.cranes){const parts=[];for(const[lx,lz]of[[-4,-5],[4,-5],[-4,5],[4,5]])parts.push([new THREE.BoxGeometry(1.2,30,1.2),M(c.x+lx,14,c.z+lz)]);
   parts.push([new THREE.BoxGeometry(60,2,2),M(c.x-14,29,c.z-5)],[new THREE.BoxGeometry(60,2,2),M(c.x-14,29,c.z+5)],[new THREE.BoxGeometry(8,4,12),M(c.x,31,c.z)],[new THREE.BoxGeometry(10,1,1),M(c.x,22,c.z-5)],[new THREE.BoxGeometry(10,1,1),M(c.x,22,c.z+5)],[new THREE.BoxGeometry(3,2,3),M(c.x-30,26,c.z)]);
   for(let i=0;i<6;i++)parts.push([new THREE.BoxGeometry(.4,10,.4),M(c.x-6-i*8,24,c.z-5,0,0,.6)],[new THREE.BoxGeometry(.4,10,.4),M(c.x-6-i*8,24,c.z+5,0,0,.6)]);
   const m=new THREE.Mesh(merge(parts),cm);m.castShadow=true;root.add(m);}
  const hull=new THREE.Mesh(merge([[new THREE.BoxGeometry(22,10,170),M(-118,2,0)],[new THREE.BoxGeometry(18,8,22),M(-118,11,62)],[new THREE.BoxGeometry(6,10,6),M(-118,20,62)]]),new THREE.MeshStandardMaterial({color:0x2a3a4a,roughness:.6,metalness:.4}));hull.castShadow=true;root.add(hull);
  const pal=[0xb83a2a,0x2a6ab8,0x2a8a5a,0xd8a030,0xe06a1a];const cg=new THREE.BoxGeometry(2.4,2.6,12.2);const im=new THREE.InstancedMesh(cg,new THREE.MeshStandardMaterial({roughness:.6,metalness:.3}),60);let n=0;
  for(let i=0;i<5;i++)for(let j=0;j<12&&n<60;j++){im.setMatrixAt(n,M(-125+i*2.6+2,8.3+(j%3)*2.6,-50+(j/3|0)*13));im.setColorAt(n,new THREE.Color(pal[(i*7+j*3)%5]));n++;}im.count=n;root.add(im);
  // lamp posts along the quay
  const lp=[];for(let z=-100;z<=100;z+=25)lp.push([new THREE.CylinderGeometry(.15,.2,9,6),M(-88,4.5,z)],[new THREE.BoxGeometry(1.4,.3,.5),M(-87.5,9,z)]);root.add(new THREE.Mesh(merge(lp),new THREE.MeshStandardMaterial({color:0x40464c,metalness:.6,roughness:.5})));
  const bulbs=[];for(let z=-100;z<=100;z+=25)bulbs.push([new THREE.BoxGeometry(1.1,.12,.4),M(-87.3,8.82,z)]);root.add(new THREE.Mesh(merge(bulbs),new THREE.MeshBasicMaterial({color:new THREE.Color(4,3,1.8)})));}
 // distant scenery ring
 if(id!=='port'){const parts=[];const r2=mulberry(77);for(let i=0;i<34;i++){const a=i/34*6.283+r2()*.12,d=250+r2()*80;const h=id==='snow'?40+r2()*60:18+r2()*26,w=id==='snow'?50+r2()*40:70+r2()*50;
   const g=new THREE.ConeGeometry(1,1,10,4);g.translate(0,.5,0);const p=g.attributes.position;const o=r2()*50;for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k);const f=1+noise(x*2+o,y*2,z*2)*.35;const yy=id==='desert'?Math.pow(y,1.6):y;p.setXYZ(k,x*f,yy*(1+noise(x*3,z*3,o)*.15),z*f);}
   g.computeVertexNormals();const cc=[];for(let k=0;k<p.count;k++){const y=p.getY(k);const sn=id==='snow'?(y>.45?1:y>.3?.6:0):0;const c=id==='snow'?[.45+.53*sn,.48+.5*sn,.52+.48*sn]:[.86,.72,.52];cc.push(...c);}g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
   parts.push([g,M(Math.cos(a)*d,-6,Math.sin(a)*d,0,r2()*3,0,w,h,w*(.6+r2()*.6))]);}
  const m=new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:id==='snow'}));root.add(m);}
 else{// port: city skyline silhouettes across the water and behind the yard
  const parts=[];const r2=mulberry(31);for(let i=0;i<70;i++){const a=i/70*6.283,d=260+r2()*90;const h=12+r2()*50,w=8+r2()*16;parts.push([new THREE.BoxGeometry(w,h,w*(.6+r2())),M(Math.cos(a)*d,h/2-2,Math.sin(a)*d,0,a,0)]);}
  root.add(new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({color:0x3a3e48,roughness:.9})));}
 // supply drop zones
 const dz=id==='desert'?[[-30,0],[30,-4],[0,-56],[0,56],[-82,-40],[82,40],[-80,44],[80,-46],[66,4],[-64,-24]]:id==='snow'?[[-24,0],[26,0],[0,-50],[0,50],[-60,-40],[60,44],[-84,40],[84,-40],[-44,-4],[60,-34]]:[[-14,0],[24,0],[0,-44],[0,44],[-60,-30],[60,30],[-70,30],[70,-30],[48,-48],[-48,48]];
 W.dropZones=dz.map(([x,z])=>{let px=x,pz=z;for(let k=0;k<20&&!clearAt(W,px,pz,3);k++){px=x+(Math.random()-.5)*16;pz=z+(Math.random()-.5)*16;}return{x:px,z:pz};});
 // lights & fog
 W.fog=new THREE.FogExp2(T.fog,T.fogD);
 W.update=(dt,cam)=>{W.time+=dt;sky.material.uniforms.uT.value=W.time;wn.offset.x=(W.time*.01)%1;wn.offset.y=(W.time*.006)%1;if(W.windU)W.windU.value=W.time;
  for(let i=W.anim.length-1;i>=0;i--){const a=W.anim[i];a.t+=dt;if(a.f(a,dt)===false)W.anim.splice(i,1);}};
 W.navDirty=true;W.minimapDirty=true;
 return W;}
function windMat(m,amp,W){W.windU=W.windU||{value:0};const U=W.windU;m.onBeforeCompile=sh=>{sh.uniforms.uWind=U;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uWind;').replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 float ph=instanceMatrix[3][0]*.13+instanceMatrix[3][2]*.17;float k=max(0.,position.y)*${amp.toFixed(3)};transformed.x+=sin(uWind*1.7+ph)*k;transformed.z+=cos(uWind*1.3+ph*1.3)*k*.6;
 #endif`);};m.customProgramCacheKey=()=>'wind'+amp;return m;}
function normalWave(){const c=canvas(256,256,(x,w,h)=>{const id=x.createImageData(w,h),d=id.data;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const u=i/w*6.283,v=j/h*6.283;const dx=Math.cos(u*3+v*2)*.3+Math.cos(u*7-v*5)*.15+Math.cos(u*13+v*11)*.06,dy=Math.sin(v*4-u)*.3+Math.sin(v*9+u*6)*.15+Math.sin(u*12-v*15)*.06;const l=Math.hypot(dx,dy,1);const k=(j*w+i)*4;d[k]=(dx/l*.5+.5)*255;d[k+1]=(dy/l*.5+.5)*255;d[k+2]=(1/l*.5+.5)*255;d[k+3]=255;}x.putImageData(id,0,0);});
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(30,30);return t;}
export function clearAt(W,x,z,r){for(const o of W.obs){if(!o.alive||o.kind==='bound')continue;if(Math.hypot(x-o.x,z-o.z)<o.r+r)return false;}return true;}

/* ---------------- queries ---------------- */
// first hit along segment against live obstacles (optionally ignoring pass-through ones); returns {o,t,n}
const _hn=new V3();
export function rayObs(W,p0,p1,skipPass=false,pad=0){let best=null,bt=2;const mx=Math.min(p0.x,p1.x),Mx=Math.max(p0.x,p1.x),mz=Math.min(p0.z,p1.z),Mz=Math.max(p0.z,p1.z);
 for(const o of W.obs){if(!o.alive)continue;if(skipPass&&o.pass)continue;if(o.x+o.r<mx||o.x-o.r>Mx||o.z+o.r<mz||o.z-o.r>Mz)continue;const h=segBox(o,p0,p1,pad);if(h&&h.t<bt&&!h.inside){bt=h.t;best={o,t:h.t,n:new V3(h.nx,h.ny,h.nz)};}}return best;}
// terrain hit along segment; returns t or -1
export function rayTerrain(W,p0,p1){const L=p0.distanceTo(p1),n=Math.max(2,Math.ceil(L/1.5));const T=W.terrain;let prev=0;
 for(let i=1;i<=n;i++){const t=i/n;const x=p0.x+(p1.x-p0.x)*t,y=p0.y+(p1.y-p0.y)*t,z=p0.z+(p1.z-p0.z)*t;if(y<T.height(x,z)){let a=prev,b=t;for(let k=0;k<8;k++){const m=(a+b)/2;const mx=p0.x+(p1.x-p0.x)*m,my=p0.y+(p1.y-p0.y)*m,mz=p0.z+(p1.z-p0.z)*m;if(my<T.height(mx,mz))b=m;else a=m;}return b;}prev=t;}return -1;}
export function los(W,a,b){if(rayTerrain(W,a,b)>=0)return false;const h=rayObs(W,a,b,true);return!h;}
// bushes crossed by a sight line (beyond `near` metres from the viewer)
export function bushesOn(W,a,b,near=14){let n=0;const ex=b.x-a.x,ez=b.z-a.z,L2=ex*ex+ez*ez,L=Math.sqrt(L2);for(const s of W.bushes){const t=((s.x-a.x)*ex+(s.z-a.z)*ez)/L2;if(t<0||t>1)continue;if(t*L<near)continue;const d=Math.hypot(a.x+ex*t-s.x,a.z+ez*t-s.z);if(d<s.r)n++;}return n;}
export function inBush(W,x,z){for(const s of W.bushes)if(Math.hypot(x-s.x,z-s.z)<s.r+1.4)return true;return false;}

/* ---------------- destruction ---------------- */
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new V3(),_v=new V3();
export function hideInst(W,o){const f=W.fam[o.fam];if(!f||!f.mesh)return;_m.makeScale(0,0,0);f.mesh.setMatrixAt(o.fi,_m);f.mesh.instanceMatrix.needsUpdate=true;
 if(o.fam==='chain'){const fr=W.fam.chainF;fr.mesh.setMatrixAt(o.fi,_m);fr.mesh.instanceMatrix.needsUpdate=true;}}
// knock down: returns true if it broke. dir = impact direction (world)
export function breakOb(W,o,dir){if(!o.alive)return false;o.alive=false;W.navDirty=true;W.minimapDirty=true;(W.broken||(W.broken=[])).push(o);
 if(o.kind==='tree'){const f=W.fam[o.fam];const ax=new V3(dir.z,0,-dir.x).normalize();const base=new V3(o.x,o.y0,o.z);const m0=f.list[o.fi].m.clone();const sc=o.sc;
  W.anim.push({t:0,v:0,a:0,f:(a,dt)=>{a.v+=dt*(1.2+a.a*3);a.a=Math.min(Math.PI/2-.08,a.a+a.v*dt);_q.setFromAxisAngle(ax,a.a);const q2=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,o.ry,0));_q.multiply(q2);_m.compose(base,_q,_s.set(sc,sc,sc));
   if(a.t>14){const k=Math.min(1,(a.t-14)/2);_m.compose(_v.copy(base).setY(o.y0-k*2),_q,_s.set(sc,sc,sc));}f.mesh.setMatrixAt(o.fi,_m);f.mesh.instanceMatrix.needsUpdate=true;return a.t<16.5;}});return true;}
 if(o.kind==='house'){o.group.visible=false;const[w,h,d]=o.dims;const parts=[];const r=mulberry(o.x*13+o.z*7|0);const cc=new THREE.Color(o.style==='adobe'?0xbfa27a:o.style==='wood'?0x6a5040:o.style==='metal'?0x7a8088:0x8a5a48);
  for(let i=0;i<26;i++){const s=.6+r()*1.8;parts.push([new THREE.BoxGeometry(s,s*.6,s*1.2),M((r()-.5)*w*.9,s*.2+r()*.6,(r()-.5)*d*.9,r(),r()*3,r()),cc.clone().multiplyScalar(.6+r()*.5)]);}
  for(let i=0;i<4;i++){const ww=w*(.3+r()*.4);parts.push([new THREE.BoxGeometry(ww,.5+r()*1.6,.5),M((r()-.5)*w*.5,.6,(r()<.5?-1:1)*d*.45,0,(r()-.5)*.4,(r()-.5)*.3),cc]);}
  const rub=new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:facadeTex(o.style==='wood'?'wood':o.style==='metal'?'metal':'stone')}));rub.position.set(o.x,o.y0+.3,o.z);rub.rotation.y=o.rot;rub.castShadow=rub.receiveShadow=true;W.root.add(rub);o.rubble=rub;return true;}
 hideInst(W,o);return true;}
// navigation occupancy (cell = 3m)
export const NAV={cell:3};
export function navGrid(W,old){const c=NAV.cell,n=Math.ceil(2*B/c);const g=old||{n,cell:c,blk:new Uint8Array(n*n),cost:new Float32Array(n*n)};g.blk.fill(0);g.cost.fill(0);
 const T=W.terrain;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=-B+(i+.5)*c,z=-B+(j+.5)*c;const h=T.height(x,z);const s=Math.max(Math.abs(T.height(x+c,z)-h),Math.abs(T.height(x,z+c)-h));if(s>2.3)g.blk[j*n+i]=1;if(W.id==='port'&&x<-86)g.blk[j*n+i]=1;}
 for(const o of W.obs){if(!o.alive||o.kind==='bound')continue;const R=o.r+2.6;const i0=Math.max(0,Math.floor((o.x-R+B)/c)),i1=Math.min(n-1,Math.floor((o.x+R+B)/c)),j0=Math.max(0,Math.floor((o.z-R+B)/c)),j1=Math.min(n-1,Math.floor((o.z+R+B)/c));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=-B+(i+.5)*c,z=-B+(j+.5)*c;if(pointIn(o,x,z,o.pass?.6:2.2))g.blk[j*n+i]=o.pass?Math.max(g.blk[j*n+i],0):1;else if(pointIn(o,x,z,4.5))g.cost[j*n+i]+=o.pass?.5:2;}}
 return g;}

/* ---------------- minimap base layer ---------------- */
export function minimapLayer(W,S=256){if(!W.miniTer||W.miniTer.width!==S)W.miniTer=terrainLayer(W,S);return canvas(S,S,(x,w,h)=>{const k=w/(2*B);x.drawImage(W.miniTer,0,0);
 for(const s of W.bushes){x.fillStyle='rgba(40,90,40,.55)';x.beginPath();x.arc((s.x+B)*k,(s.z+B)*k,s.r*k,0,7);x.fill();}
 for(const o of W.obs){if(o.kind==='bound')continue;x.save();x.translate((o.x+B)*k,(o.z+B)*k);x.rotate(-o.rot);
  x.fillStyle=!o.alive?(o.kind==='house'?'rgba(60,50,40,.45)':'rgba(0,0,0,0)'):o.kind==='house'?'#2a2a2e':o.kind==='container'?'#4a4e56':o.kind==='tree'?'#2f5a34':o.kind==='fence'?'rgba(40,30,20,.55)':o.kind==='rock'?'#6a6258':'#3e3a36';
  x.fillRect(-o.hx*k,-o.hz*k,o.hx*2*k,Math.max(1,o.hz*2*k));x.restore();}});}
function terrainLayer(W,S){return canvas(S,S,(x,w,h)=>{const T=W.terrain,k=w/(2*B);const id=x.createImageData(w,h),d=id.data;const base={desert:[176,150,110],snow:[205,214,224],port:[96,100,104]}[W.id];
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const wx=-B+i/k,wz=-B+j/k;const hh=T.height(wx,wz);const sl=T.height(wx+1,wz+1)-hh;let f=.75+hh*.025-sl*.25;let c=base;
  if(W.id==='port'&&wx<-86)c=[30,60,80];if(W.ice&&Math.hypot(wx-W.ice.x,wz-W.ice.z)<W.ice.r)c=[170,200,225];const q=(j*w+i)*4;d[q]=c[0]*f;d[q+1]=c[1]*f;d[q+2]=c[2]*f;d[q+3]=255;}
 x.putImageData(id,0,0);});}
