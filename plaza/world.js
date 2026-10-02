// PENGUIN PLAZA — the island: terrain, rooms, buildings, interiors, props, lights, day/night, party decorations.
import {THREE,V3,M,merge,cl,lerp,rnd,sstep,ctex,textSprite,rng} from './util.js';
import {ImprovedNoise} from '../vendor/jsm/math/ImprovedNoise.js';
import {Batch,skyDome,palette,snowMaterial,pineGeometry,instancedPines,waterMaterial} from './env.js';
import {furnModel,PARTIES} from './items.js';
const G=THREE,PI=Math.PI;

export const ROOMS={
 town:{n:'Town Square',space:'out',x:0,z:0,r:24,entry:[0,9],map:[50,52]},
 ski:{n:'Ski Hill',space:'out',x:0,z:-62,r:30,entry:[3,-40],map:[50,14]},
 dock:{n:'Dock & Beach',space:'out',x:22,z:76,r:28,entry:[12,58],map:[60,88]},
 light:{n:'Lighthouse',space:'out',x:70,z:4,r:22,entry:[52,6],map:[88,50]},
 stage:{n:'Plaza Stage',space:'out',x:-50,z:20,r:26,entry:[-38,13],map:[16,60]},
 street:{n:'Igloo Street',space:'out',x:-48,z:-36,r:24,entry:[-34,-27],map:[20,30]},
 coffee:{n:'Coffee Shop',space:'coffee',o:[1000,0,0],entry:[0,5],map:[37,40]},
 club:{n:'Dance Club',space:'club',o:[1100,0,0],entry:[0,5],map:[63,40]},
 igloo:{n:'My Igloo',space:'igloo',o:[1200,0,0],entry:[0,5],map:[10,40]},
};
export const SPACE_ORIGIN={out:[0,0,0],coffee:[1000,0,0],club:[1100,0,0],igloo:[1200,0,0]};
const noise=new ImprovedNoise();
const FLAT=[{x:0,z:0,r:24,h:2},{x:-50,z:18,r:20,h:2},{x:-48,z:-36,r:22,h:2.2},{x:3,z:-44,r:9,h:4.2},{x:-48,z:36,r:12,h:2}];
function rawH(x,z){const a=Math.atan2(z,x),coast=106+7*Math.sin(a*3+1)+4*Math.sin(a*7+2),d=Math.hypot(x,z*1.04);
 let h=2.1+noise.noise(x*.035,z*.035,.5)*1.6+noise.noise(x*.12,z*.12,2.3)*.35;
 h-=sstep(58,90,z)*sstep(-46,-24,x)*(1-sstep(52,70,x))*3.4;
 h=lerp(h,-5,sstep(coast-16,coast+4,d));
 const md=Math.hypot(x*1.08,z+92);h+=36*Math.exp(-md*md/(2*22*22))+6*Math.exp(-md*md/(2*44*44));
 const lc=Math.hypot(x-78,z-4);h=lerp(h,7.6+noise.noise(x*.2,z*.2,4)*.3,1-sstep(13,21,lc));
 return h;}
export function height(x,z){let h=rawH(x,z);for(const f of FLAT){const d=Math.hypot(x-f.x,z-f.z);if(d<f.r)h=lerp(h,f.h,1-sstep(f.r*.6,f.r,d));}
 // lighthouse ramp
 const t=cl((x-50)/18,0,1);if(Math.abs(z-6)<4&&x>48&&x<70)h=Math.max(h,lerp(2,7.6,t*t*(3-2*t)));return h;}
const PATHS=[[[0,-12],[2,-42]],[[3,9],[12,58]],[[12,1],[52,6]],[[52,6],[68,6]],[[-12,4],[-38,13]],[[-10,-8],[-34,-27]],[[-30,-30],[-66,-44]],[[-42,16],[-47,30]],[[18,72],[34,88]],[[12,58],[16,72]]];
function pathD(x,z){let m=1e9;for(const[[ax,az],[bx,bz]]of PATHS){const dx=bx-ax,dz=bz-az,t=cl(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);m=Math.min(m,Math.hypot(x-ax-dx*t,z-az-dz*t));}return m;}
const PLAT=[{x:16,z:92,hw:2.2,hd:20,y:1.7,n:'pier'},{x:-61,z:18,hw:4.5,hd:8.5,y:3.2,n:'stage'},{x:40,z:98,r:10,y:.18,n:'ice'}];

export function buildWorld(R,scene,opts={}){
 const W={rooms:ROOMS,triggers:[],emit:[],obst:{out:[],coffee:[],club:[],igloo:[]},seats:{},spots:{},anim:[],signs:[],coins:[],partyG:null,party:null,space:'out'};
 const solid=new Batch(),glow=new Batch(),snowB=new Batch(),winIn=new Batch();
 const ROCK=0x7a808c,WOOD=0x8a5a3a,WOODL=0xb07a50,DARK=0x2a2a30,WARM=new G.Color(1,.72,.38);
 const groundY=(x,z)=>{let h=height(x,z);for(const p of PLAT){const ins=p.r?Math.hypot(x-p.x,z-p.z)<p.r:Math.abs(x-p.x)<p.hw&&Math.abs(z-p.z)<p.hd;if(ins)h=Math.max(h,p.y);}return h;};
 W.height=height;
 W.ground=(space,x,z)=>space==='out'?groundY(x,z):0;
 W.onPlatform=(x,z)=>PLAT.some(p=>p.r?Math.hypot(x-p.x,z-p.z)<p.r:Math.abs(x-p.x)<p.hw&&Math.abs(z-p.z)<p.hd);
 const BOUNDS={coffee:{hw:9.3,hd:[-6.2,7.6]},club:{hw:8.3,hd:[-6.6,7.6]},igloo:{r:8.2}};
 W.walkable=(space,x,z)=>{if(space==='out'){const on=W.onPlatform(x,z);return on||height(x,z)>.35&&Math.hypot(x,z)<118;}
  const o=SPACE_ORIGIN[space],lx=x-o[0],lz=z-o[2],b=BOUNDS[space];if(b.r)return Math.hypot(lx,lz)<b.r||(Math.abs(lx)<1.5&&lz>0&&lz<9);return Math.abs(lx)<b.hw&&lz>b.hd[0]&&lz<b.hd[1];};
 W.collide=(space,p,r=.55)=>{for(const o of W.obst[space]){if(o.r!==undefined){const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz),m=o.r+r;if(d<m&&d>1e-4){p.x=o.x+dx/d*m;p.z=o.z+dz/d*m;}}
  else{const dx=p.x-o.x,dz=p.z-o.z,px=o.hw+r-Math.abs(dx),pz=o.hd+r-Math.abs(dz);if(px>0&&pz>0){if(px<pz)p.x+=Math.sign(dx)*px;else p.z+=Math.sign(dz)*pz;}}}};
 W.roomAt=(space,x,z)=>{if(space!=='out')return{coffee:'coffee',club:'club',igloo:'igloo'}[space];let best='town',bd=1e9;for(const k in ROOMS){const r=ROOMS[k];if(r.space!=='out')continue;const d=Math.hypot(x-r.x,z-r.z)/r.r;if(d<bd){bd=d;best=k;}}return best;};
 W.entryPos=(id)=>{const r=ROOMS[id],o=SPACE_ORIGIN[r.space];return new V3(o[0]+r.entry[0],0,o[2]+r.entry[1]);};
 const ob=(space,o)=>W.obst[space].push(o);

 /* ---------- sky, fog, lights ---------- */
 const sky=skyDome(600);scene.add(sky);W.sky=sky;sky.onBeforeRender=(r,sc,c)=>{sky.matrixWorld.setPosition(c.position);};
 scene.fog=new G.FogExp2(0xd8e8fa,.0042);
 const hemi=new G.HemisphereLight(0xc0d8ff,0xf0f0f4,.8);scene.add(hemi);
 const sun=new G.DirectionalLight(0xfff4e4,2.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:1,far:220});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;scene.add(sun,sun.target);
 const pts=[];for(let i=0;i<5;i++){const p=new G.PointLight(0xffb060,0,16,1.6);scene.add(p);pts.push(p);}
 W.sun=sun;W.hemi=hemi;W.pts=pts;

 /* ---------- terrain ---------- */
 {const S=300,N=200,g=new G.PlaneGeometry(S,S,N,N);g.rotateX(-PI/2);const p=g.attributes.position,col=new Float32Array(p.count*3),c=new G.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,height(x,z));}
  g.computeVertexNormals();const nr=g.attributes.normal;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),ny=nr.getY(i);c.setRGB(.86,.9,.97);
   const n=noise.noise(x*.08,z*.08,7)*.5+.5;c.offsetHSL(0,0,-n*.04);
   const pd=pathD(x,z);if(pd<3.2)c.lerp(new G.Color(.8,.86,.95),(1-sstep(1.8,3.2,pd))*.8);
   const sand=sstep(1.4,.3,y)*sstep(56,70,z);if(sand>0)c.lerp(new G.Color(.88,.8,.64),sand*.8);
   if(y<.1)c.lerp(new G.Color(.45,.6,.7),sstep(.1,-2,y));
   const rock=sstep(.86,.7,ny);if(rock>0)c.lerp(new G.Color(.5,.53,.6),rock*.85);
   col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  g.setAttribute('color',new G.BufferAttribute(col,3));
  const m=new G.Mesh(g,snowMaterial());m.receiveShadow=true;scene.add(m);W.terrain=m;W.snowMats=[m.material];}
 const water=new G.Mesh(new G.PlaneGeometry(1400,1400,80,80),waterMaterial());water.rotation.x=-PI/2;water.position.y=-.05;scene.add(water);W.water=water;
 // ice floes
 {const L=[];const r=rng(7);for(let i=0;i<46;i++){const a=r()*PI*2,d=114+r()*40;L.push([new G.CylinderGeometry(1,1.2,.5,7),M(Math.cos(a)*d,.05,Math.sin(a)*d*1.04,0,r()*7,0,1.5+r()*3,1,1.2+r()*2.5),0xf0f8ff]);}
  const m=new G.Mesh(merge(L),snowMaterial());m.receiveShadow=true;scene.add(m);W.snowMats.push(m.material);}

 /* ---------- helpers ---------- */
 const Bx=(w,h,d)=>new G.BoxGeometry(w,h,d),Cy=(a,b,h,s=12)=>new G.CylinderGeometry(a,b,h,s),Sp=(r,a=12,b=8)=>new G.SphereGeometry(r,a,b),Pl=(w,h)=>new G.PlaneGeometry(w,h);
 const at=(x,y,z,ry=0)=>M(x,y,z,0,ry,0);
 const L=(P,lx,ly,lz,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>P.clone().multiply(M(lx,ly,lz,rx,ry,rz,sx,sy,sz));
 const prism=(w,h,d)=>{const s=new G.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const g=new G.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);return g;};
 const sign=(text,x,y,z,o={})=>{const s=textSprite(text,{size:64,bg:o.bg??'rgba(16,18,28,.82)',color:o.color??'#fff',scale:o.scale??1.1});s.position.set(x,y,z);scene.add(s);W.signs.push(s);return s;};
 const lamp=(x,z,space='out',y)=>{const gy=y??W.ground(space,x,z),P=at(x,gy,z);solid.add(Cy(.09,.13,3.6,8),L(P,0,1.8,0),DARK).add(Cy(.3,.3,.1,8),L(P,0,3.65,0),DARK).add(new G.ConeGeometry(.42,.35,8),L(P,0,4.25,0),DARK);snowB.add(new G.ConeGeometry(.4,.18,8),L(P,0,4.42,0),0xffffff);
  glow.add(Cy(.22,.18,.5,8),L(P,0,3.95,0),WARM);W.emit.push({space,x,y:gy+3.9,z,col:0xffb468,i:14,night:true});ob(space,{x,z,r:.3});};
 const bench=(x,z,ry,room,space='out')=>{const gy=W.ground(space,x,z),P=at(x,gy,z,ry);solid.add(Bx(2.4,.12,.7),L(P,0,.62,0),WOODL).add(Bx(2.4,.6,.1),L(P,0,1,-.34,-.15),WOODL);for(const s of[-1,1])solid.add(Bx(.1,.6,.6),L(P,s*1.05,.3,0),DARK);
  snowB.add(Bx(2.3,.08,.5),L(P,.1,.72,-.05),0xffffff);ob(space,{x,z,r:1});(W.seats[room]=W.seats[room]||[]).push({x:x+Math.sin(ry)*.15-Math.cos(ry)*.55,z:z+Math.cos(ry)*.15+Math.sin(ry)*.55,ry,y:gy+1.0},{x:x+Math.sin(ry)*.15+Math.cos(ry)*.55,z:z+Math.cos(ry)*.15-Math.sin(ry)*.55,ry,y:gy+1.0});};
 const snowman=(x,z,ry=0,s=1)=>{const gy=height(x,z),P=M(x,gy,z,0,ry,0,s);snowB.add(Sp(.9,16,12),L(P,0,.8,0),0xffffff).add(Sp(.65,16,12),L(P,0,1.95,0),0xffffff).add(Sp(.45,14,10),L(P,0,2.85,0),0xffffff);
  solid.add(new G.ConeGeometry(.09,.5,8),L(P,0,2.85,.6,PI/2),0xff7a1a).add(Sp(.06),L(P,.16,2.98,.38),0x111111).add(Sp(.06),L(P,-.16,2.98,.38),0x111111).add(Cy(.04,.04,1.3,5),L(P,.8,2.1,0,0,0,1.1),WOOD).add(Cy(.04,.04,1.3,5),L(P,-.8,2.1,0,0,0,-1.1),WOOD).add(new G.TorusGeometry(.5,.12,8,18),L(P,0,2.45,0,PI/2),0xd8383e);ob('out',{x,z,r:1});};
 const house=(o)=>{const gy=o.y??height(o.x,o.z),P=at(o.x,gy,o.z,o.ry),w=o.w,d=o.d,h=o.h;
  solid.add(Bx(w,h,d),L(P,0,h/2,0),o.wall);for(const sx of[-1,1])for(const sz of[-1,1])solid.add(Bx(.35,h+.1,.35),L(P,sx*w/2,h/2,sz*d/2),o.trim??WOOD);
  solid.add(Bx(w+.3,.4,d+.3),L(P,0,.2,0),ROCK);
  if(o.flat){solid.add(Bx(w+.6,.4,d+.6),L(P,0,h+.2,0),o.roof);snowB.add(Bx(w+.5,.35,d+.5),L(P,0,h+.55,0),0xffffff);}
  else{const rh=w*.42;solid.add(prism(w+1.4,rh,d+1.2),L(P,0,h,0),o.roof);snowB.add(prism(w+1.5,rh*.98,d+1.3),L(P,0,h+.22,0),0xffffff);
   if(o.chimney){solid.add(Bx(.9,2.4,.9),L(P,w*.25,h+rh*.6,-d*.15),ROCK);snowB.add(Bx(1,.2,1),L(P,w*.25,h+rh*.6+1.25,-d*.15),0xffffff);W.smoke=W.smoke||[];const e=new V3(w*.25,h+rh*.6+1.4,-d*.15).applyMatrix4(P);W.smoke.push(e);}}
  solid.add(Bx(2.1,2.9,.25),L(P,0,1.45,d/2+.06),o.trim??WOOD);glow.add(Pl(1.6,2.5),L(P,0,1.3,d/2+.2),o.doorGlow??WARM);
  snowB.add(Bx(2.4,.12,.5),L(P,0,3,d/2+.25),0xffffff);
  const wins=o.wins??[[-w*.3,h*.55],[w*.3,h*.55]];for(const[wx,wy]of wins){solid.add(Bx(1.5,1.4,.2),L(P,wx,wy,d/2+.04),o.trim??WOOD);glow.add(Pl(1.2,1.1),L(P,wx,wy,d/2+.15),WARM);snowB.add(Bx(1.6,.12,.35),L(P,wx,wy-.75,d/2+.18),0xffffff);}
  for(const sz of[-1,1]){solid.add(Bx(.2,1.4,1.5),L(P,sz*(w/2+.04),h*.55,0),o.trim??WOOD);glow.add(Pl(1.2,1.1),L(P,sz*(w/2+.15),h*.55,0,0,sz*PI/2),WARM);}
  const fx=Math.sin(o.ry),fz=Math.cos(o.ry),c=Math.cos(o.ry),s=Math.sin(o.ry);
  if(Math.abs(s)<.01)ob('out',{x:o.x,z:o.z,hw:w/2+.2,hd:d/2+.2});else ob('out',{x:o.x,z:o.z,hw:d/2+.2,hd:w/2+.2});
  const door={x:o.x+fx*(d/2+1.1),z:o.z+fz*(d/2+1.1)};if(o.sign)sign(o.sign,o.x+fx*(d/2+.5),gy+h+(o.flat?1.6:w*.42*.5+.6),o.z+fz*(d/2+.5),{bg:o.signBg});void c;return{door,gy,P};};
 const trig=(t)=>{W.triggers.push(t);return t;};

 /* ================= TOWN SQUARE ================= */
 {// plaza paving ring
  const g=new G.RingGeometry(4.5,15,64,4);g.rotateX(-PI/2);const cob=ctex(128,128,(x,w,h)=>{x.fillStyle='#9aa4b4';x.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=-1;c<4;c++){const v=196+((r*7+c*13+20)%5)*9;x.fillStyle=`rgb(${v-16},${v-6},${v+10})`;x.beginPath();x.roundRect(c*32+(r%2)*16+2,r*32+2,28,28,7);x.fill();}});
  const pv=new G.Mesh(g,new G.MeshStandardMaterial({map:cob,roughness:.8}));pv.position.y=2.04;pv.receiveShadow=true;
  const uv=g.attributes.uv,pp=g.attributes.position;for(let i=0;i<uv.count;i++){const x=pp.getX(i),z=pp.getZ(i);uv.setXY(i,(Math.atan2(z,x)/PI/2+.5)*36,(Math.hypot(x,z)-4.5)/2.2);}pv.material.map.wrapS=pv.material.map.wrapT=G.RepeatWrapping;scene.add(pv);
  // frozen fountain
  const P=at(0,2,0);solid.add(Cy(4.4,4.6,.9,32),L(P,0,.45,0),0xa8b4c8).add(Cy(1,1.2,2.2,16),L(P,0,1.1,0),0xa8b4c8).add(Cy(1.8,1.6,.4,20),L(P,0,2.2,0),0xa8b4c8);snowB.add(new G.TorusGeometry(4.3,.25,8,40),L(P,0,.95,0,PI/2),0xffffff);
  const ice=new G.Mesh(merge([[Cy(4,4,.15,32),L(P,0,.8,0)],[Cy(1.6,1.6,.1,20),L(P,0,2.42,0)]]),new G.MeshStandardMaterial({color:0xa8e0ff,roughness:.05,metalness:.1,envMapIntensity:1.8,transparent:true,opacity:.85}));scene.add(ice);
  // ice sculpture: a giant snowflake
  const flake=[];for(let i=0;i<6;i++){const a=i*PI/3;flake.push([Bx(.28,3.2,.28),M(0,0,0,0,0,a)]);for(const k of[.8,1.25])for(const sd of[-1,1])flake.push([Bx(.18,.8,.18),M(-Math.sin(a)*k+Math.sin(a+sd*.8)*.3,Math.cos(a)*k-Math.cos(a+sd*.8)*.3,0,0,0,a+sd*.8)]);}
  const fl=new G.Mesh(merge(flake),new G.MeshStandardMaterial({color:0xc8f0ff,roughness:.04,metalness:.15,envMapIntensity:2.2,emissive:0x2a6a9a,emissiveIntensity:.35,transparent:true,opacity:.9}));fl.position.set(0,6.4,0);fl.castShadow=true;scene.add(fl);W.anim.push(dt=>{fl.rotation.y+=dt*.3;});ob('out',{x:0,z:0,r:4.8});
  // giant twinkle tree
  {const t=new G.Mesh(pineGeometry(true),new G.MeshStandardMaterial({vertexColors:true,roughness:.85}));t.scale.setScalar(2.1);t.position.set(-11,2,10);t.castShadow=true;scene.add(t);ob('out',{x:-11,z:10,r:2.6});
   const bl=[];for(let i=0;i<70;i++){const h=1.4+rnd(5.6),r=(2.1-((h-1.3)/1.15)*.5)*.9,a=rnd(7);bl.push([Sp(.11,6,4),M(Math.cos(a)*r,h,Math.sin(a)*r),[0xff4040,0xffd040,0x40c0ff,0xff60c0,0x60ff90][i%5]]);}
   const lights=new G.Mesh(merge(bl),new G.MeshBasicMaterial({vertexColors:true}));lights.scale.setScalar(2.1);lights.position.copy(t.position);scene.add(lights);W.treeLights=lights;
   const star=new G.Mesh(new G.OctahedronGeometry(.6),new G.MeshBasicMaterial({color:new G.Color(3,2.5,.8)}));star.position.set(-11,2+7.6*2.1-1,10);scene.add(star);W.anim.push(dt=>{star.rotation.y+=dt;});}
  for(let i=0;i<8;i++){const a=i/8*PI*2+PI/8;lamp(Math.cos(a)*16.5,Math.sin(a)*16.5);}
  for(const a of[.35,1.25,2.6,3.6,4.4,5.8])bench(Math.cos(a)*11.5,Math.sin(a)*11.5,-a-PI/2,'town');
  snowman(14,12,-.6);snowman(-17,-3,.8,.85);
  // party board + booth
  {const P=at(9,2,10,-.6);solid.add(Bx(3.2,2.2,.25),L(P,0,2.4,0),WOOD).add(Bx(.2,2.4,.2),L(P,-1.4,1.2,0),WOOD).add(Bx(.2,2.4,.2),L(P,1.4,1.2,0),WOOD);snowB.add(Bx(3.4,.2,.45),L(P,0,3.55,0),0xffffff);
   const bt=ctex(512,320,()=>{});const bm=new G.Mesh(Pl(2.9,1.9),new G.MeshStandardMaterial({map:bt,roughness:.9,emissive:0xffffff,emissiveMap:bt,emissiveIntensity:.25}));bm.position.set(0,2.4,.14);bm.applyMatrix4(P);scene.add(bm);W.board={tex:bt,mesh:bm};ob('out',{x:9,z:10,r:1.6});
   trig({kind:'party',space:'out',x:9+Math.sin(-.6)*1.8,z:10+Math.cos(-.6)*1.8,r:1.8,label:'PARTY BOARD'});}
  // signpost
  {const P=at(5.5,2,-6.5,.3);solid.add(Cy(.12,.12,4,8),L(P,0,2,0),WOOD);const dirs=[['SKI HILL',-PI/2+.1,3.4],['DOCK',PI/2,2.8],['LIGHTHOUSE',0,2.2],['STAGE',PI,1.6],['IGLOOS',-PI+.6,1]];
   for(const[t,a,y]of dirs){const tx=ctex(256,48,(x,w,h)=>{x.fillStyle='#b07a50';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='bold 28px JetBrains Mono, monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(t,w/2-10,h/2+1);});
    const m=new G.Mesh(Bx(2.4,.45,.08),[0,0,0,0,1,1].map(i=>i?new G.MeshStandardMaterial({map:tx,roughness:.8}):new G.MeshStandardMaterial({color:WOODL})));m.position.set(Math.cos(a)*1.1,y,Math.sin(a)*1.1);m.rotation.y=-a;m.applyMatrix4(P);m.castShadow=true;scene.add(m);}ob('out',{x:5.5,z:-6.5,r:.4});}
  // coffee shop + dance club
  const cf=house({x:-15,z:-18,ry:0,w:10,d:8,h:4.6,wall:0x9a6040,roof:0xb83a3a,chimney:true,sign:'☕ COFFEE SHOP',signBg:'rgba(120,40,30,.9)'});
  trig({kind:'door',space:'out',x:cf.door.x,z:cf.door.z,r:1.5,to:'coffee',label:'COFFEE SHOP'});W.doorOut={coffee:[cf.door.x,cf.door.z+1.6]};
  const cb=house({x:15,z:-18,ry:0,w:10,d:8,h:5.2,wall:0x3a2a5a,roof:0x2a1f44,trim:0x1a1430,flat:true,sign:'♪ DANCE CLUB',signBg:'rgba(80,20,120,.9)',doorGlow:new G.Color(1,.35,.9),wins:[]});
  trig({kind:'door',space:'out',x:cb.door.x,z:cb.door.z,r:1.5,to:'club',label:'DANCE CLUB'});W.doorOut.club=[cb.door.x,cb.door.z+1.6];
  {const P=at(15,2,-18);const neon=[0xff3cac,0x2fe0ff,0xffe14a];for(let i=0;i<3;i++)glow.add(Bx(10.2,.14,.14),L(P,0,1.2+i*1.3,4.1),new G.Color(neon[i]).multiplyScalar(1.6));
   W.clubNeon=neon;for(const sx of[-1,1])glow.add(Bx(.14,5,.14),L(P,sx*5.1,2.6,4.1),new G.Color(neon[0]).multiplyScalar(1.6));W.emit.push({space:'out',x:15,y:3,z:-12.5,col:0xd040ff,i:10,night:true});}
  W.emit.push({space:'out',x:-15,y:2.5,z:-12.6,col:0xffa050,i:10,night:true});
 }

 /* ================= SKI HILL ================= */
 {const lodge=house({x:-13,z:-46,ry:.35,w:8,d:7,h:4,wall:0x7a4a30,roof:0x2f5a8a,chimney:true,sign:'SKI LODGE',signBg:'rgba(30,60,110,.9)'});void lodge;
  // chair lift: base station + pylons up the mountain + moving chairs
  const base=new V3(10,height(10,-46),-46),top=new V3(8,height(8,-86),-86);
  solid.add(Bx(4,3.6,3),at(base.x,base.y+1.8,base.z),0x5a6a8a).add(Bx(4.6,.4,3.6),at(base.x,base.y+3.8,base.z),0x2f5a8a);snowB.add(Bx(4.4,.3,3.4),at(base.x,base.y+4.1,base.z),0xffffff);
  solid.add(Bx(3,3,2.6),at(top.x,top.y+1.5,top.z),0x5a6a8a);snowB.add(Bx(3.4,.3,3),at(top.x,top.y+3.1,top.z),0xffffff);ob('out',{x:base.x,z:base.z,hw:2.2,hd:1.7});
  const cab=[];for(let i=0;i<=5;i++){const t=i/5,x=lerp(base.x,top.x,t),z=lerp(base.z,top.z,t),y=height(x,z);for(const sx of[-1,1]){}solid.add(Cy(.18,.25,9,8),at(x,y+4.5,z),0x6a7080).add(Bx(3.4,.25,.25),at(x,y+9,z),0x6a7080);cab.push(new V3(x+1.5,y+8.8,z),new V3(x-1.5,y+8.8,z));}
  const cg=[];for(const sx of[1.5,-1.5]){const a=new V3(base.x+sx,base.y+5,base.z),b=new V3(top.x+sx,top.y+5,top.z);void a;void b;}
  for(const sx of[1.5,-1.5]){const pts=[];for(let i=0;i<=5;i++){const t=i/5,x=lerp(base.x,top.x,t)+sx,z=lerp(base.z,top.z,t);pts.push(new V3(x,height(x-sx,z)+8.8,z));}
   for(let i=0;i<5;i++){const a=pts[i],b=pts[i+1],m=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b);const g=Cy(.03,.03,len,4);const q=new G.Quaternion().setFromUnitVectors(new V3(0,1,0),b.clone().sub(a).normalize());cg.push([g,new G.Matrix4().compose(m,q,new V3(1,1,1)),0x222222]);}}
  scene.add(new G.Mesh(merge(cg),new G.MeshBasicMaterial({color:0x222228})));
  const chairs=[];const chairGeo=merge([[Bx(1.1,.1,.6),M(0,0,0),0x3f86e0],[Bx(1.1,.6,.1),M(0,.3,-.3),0x3f86e0],[Cy(.03,.03,1.6,4),M(0,.85,-.1),0x333333]]);const chm=new G.MeshStandardMaterial({vertexColors:true,roughness:.6});
  for(let i=0;i<10;i++){const c=new G.Mesh(chairGeo,chm);c.castShadow=true;scene.add(c);chairs.push({m:c,u:i/10});}
  W.anim.push(dt=>{for(const c of chairs){c.u=(c.u+dt*.02)%1;const up=c.u<.5,t=up?c.u*2:2-c.u*2,sx=up?1.5:-1.5,x=lerp(base.x,top.x,t)+sx,z=lerp(base.z,top.z,t);c.m.position.set(x,height(x-sx,z)+8.8-1.75,z);c.m.rotation.y=up?PI:0;}});
  // sled race start gate
  {const P=at(3,4.2,-44);solid.add(Cy(.15,.15,4,8),L(P,-2.6,2,0),0xd8383e).add(Cy(.15,.15,4,8),L(P,2.6,2,0),0xd8383e);
   const bn=ctex(512,96,(x,w,h)=>{x.fillStyle='#d8383e';x.fillRect(0,0,w,h);for(let i=0;i<16;i++){x.fillStyle=i%2?'#fff':'#111';x.fillRect(i*32,0,32,12);x.fillRect(i*32+(i%2?-32:32)*0,h-12,32,12);}x.fillStyle='#fff';x.font='56px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('SLED DASH',w/2,h/2+3);});
   const m=new G.Mesh(Bx(5.4,1,.1),new G.MeshStandardMaterial({map:bn,roughness:.6}));m.position.set(0,3.9,0);m.applyMatrix4(P);scene.add(m);}
  // slalom flags up the slope
  for(let i=0;i<10;i++){const z=-52-i*3.6,x=Math.sin(i*1.3)*4+(i%2?3:-3),y=height(x,z);solid.add(Cy(.05,.05,1.6,5),at(x,y+.8,z),0x333333);glow.add(Pl(.6,.4),M(x+.3,y+1.4,z),i%2?new G.Color(1,.15,.1):new G.Color(.1,.4,1));}
 }

 /* ================= DOCK & BEACH ================= */
 {// pier
  const pl=[];for(let z=73;z<112;z+=.9)pl.push([Bx(4.6,.18,.8),M(16,1.6,z,0,0,0),[0x9a6a48,0x8a5a3a,0xa87a52][(z*3|0)%3]]);for(let z=74;z<112;z+=4)for(const sx of[-2.2,2.2])pl.push([Cy(.2,.2,4,8),M(16+sx,0,z),0x6a4a32]);
  for(const sx of[-2.25,2.25])pl.push([Bx(.12,.12,38),M(16+sx,2.4,92),0x7a5a40]);for(let z=74;z<112;z+=2)for(const sx of[-2.25,2.25])pl.push([Bx(.1,.8,.1),M(16+sx,2,z),0x7a5a40]);
  const pier=new G.Mesh(merge(pl),new G.MeshStandardMaterial({vertexColors:true,roughness:.85}));pier.castShadow=pier.receiveShadow=true;scene.add(pier);
  ob('out',{x:13.6,z:92,hw:.15,hd:19});ob('out',{x:18.4,z:92,hw:.15,hd:19});
  // boat
  {const bg=merge([[new G.SphereGeometry(2,16,8,0,PI*2,PI/2,PI/2),M(0,.4,0,0,0,0,1,.5,2.2),0xd8383e],[Bx(3.2,.2,7),M(0,.42,0),0xb07a50],[Cy(.08,.08,5,6),M(0,2.8,.6),0x6a4a32],[new G.ConeGeometry(1.4,3.4,3),M(.2,3.2,.6,0,PI/2,0,.08,1,1),0xffffff]]);
   const boat=new G.Mesh(bg,new G.MeshStandardMaterial({vertexColors:true,roughness:.6}));boat.position.set(22,0,104);boat.castShadow=true;scene.add(boat);W.anim.push((dt,t)=>{boat.position.y=Math.sin(t*1.1)*.15;boat.rotation.z=Math.sin(t*.9)*.05;boat.rotation.x=Math.sin(t*.7)*.03;});}
  // beach umbrellas + towels + loungers
  for(const[x,z,c]of[[-6,70,0xff6f9a],[2,76,0x2fc4d8],[30,70,0xffd84a],[-14,66,0x8a55d0]]){const y=height(x,z);solid.add(Cy(.07,.07,3.6,6),at(x,y+1.8,z),0xeeeeee).add(new G.ConeGeometry(2.2,.9,10),at(x,y+3.7,z),c).add(Bx(1.4,.04,2.4),M(x+1.4,y+.03,z+.6,0,.3,0),c);ob('out',{x,z,r:.4});}
  for(const[x,z]of[[-2,64],[24,64]]){const y=height(x,z),P=at(x,y,z,.2);solid.add(Bx(1,.12,2.4),L(P,0,.5,0,.15),0xffffff).add(Bx(1,.1,1),L(P,0,.9,-1.1,-.9),0xffffff);(W.seats.dock=W.seats.dock||[]).push({x,z:z+.3,ry:.2,y:y+.95});ob('out',{x,z,r:.9});}
  // ice-fishing cove: ice sheet + hut
  {const ice=new G.Mesh(Cy(10,10.4,.4,40),snowMaterial({vc:false,color:0xdff2ff}));ice.position.set(40,-.02,98);ice.receiveShadow=true;scene.add(ice);W.snowMats.push(ice.material);
   const hole=new G.Mesh(new G.CircleGeometry(1,24),new G.MeshStandardMaterial({color:0x0a3a5a,roughness:.1}));hole.rotation.x=-PI/2;hole.position.set(41,.2,97);scene.add(hole);
   house({x:44,z:103,ry:-.6,w:4.5,d:4,h:3,y:.18,wall:0x3f86e0,roof:0xffffff,sign:'FISHING',signBg:'rgba(20,60,120,.9)',wins:[[0,1.9]]});
   solid.add(Bx(.6,.5,.6),at(39,.4,96.4),0x8a5a3a);}
  for(let i=0;i<6;i++){const a=i/6*PI;const x=16+Math.cos(a)*14-6,z=118+Math.sin(a)*4;solid.add(Sp(.5,10,8),at(x,.2,z),i%2?0xff4d4d:0xffffff);}
  lamp(13.4,76,'out',1.7);lamp(18.6,90,'out',1.7);lamp(13.4,104,'out',1.7);
  for(let z=80;z<108;z+=6)(W.seats.dock=W.seats.dock||[]).push({x:17.6,z,ry:PI/2,y:2.08});
 }

 /* ================= LIGHTHOUSE ================= */
 {const x=80,z=4,y=height(x,z);const rings=[];for(let i=0;i<7;i++)rings.push([Cy(2.6-i*.16,2.6-(i+1)*.16,2.4,24),M(x,y+1.2+i*2.4,z),i%2?0xffffff:0xd8383e]);
  rings.push([Cy(2.2,2.2,.3,24),M(x,y+17,z),0x333333],[Cy(1.5,1.5,.2,20),M(x,y+20.2,z),0x333333],[new G.ConeGeometry(1.7,1.6,20),M(x,y+21.1,z),0xd8383e],[Sp(.25),M(x,y+22,z),0xffd84a]);
  for(let i=0;i<16;i++){const a=i/16*PI*2;rings.push([Cy(.04,.04,1,4),M(x+Math.cos(a)*2.1,y+17.6,z+Math.sin(a)*2.1),0x333333]);}rings.push([new G.TorusGeometry(2.1,.05,4,32),M(x,y+18.1,z,PI/2),0x333333]);
  const lh=new G.Mesh(merge(rings),new G.MeshStandardMaterial({vertexColors:true,roughness:.5}));lh.castShadow=lh.receiveShadow=true;scene.add(lh);ob('out',{x,z,r:3});
  const lens=new G.Mesh(Cy(1.3,1.3,2.8,16),new G.MeshStandardMaterial({color:0xfff2c0,emissive:0xffd890,emissiveIntensity:1,transparent:true,opacity:.75,roughness:.1}));lens.position.set(x,y+18.8,z);scene.add(lens);W.lens=lens;
  const bg=new G.ConeGeometry(4,46,24,1,true);bg.translate(0,-23,0);bg.rotateZ(PI/2);const beamM=new G.ShaderMaterial({transparent:true,depthWrite:false,blending:G.AdditiveBlending,side:G.DoubleSide,uniforms:{uA:{value:0}},
   vertexShader:'varying float vX;varying vec3 vN,vV;void main(){vX=-position.x/46.;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA;varying float vX;varying vec3 vN,vV;void main(){float f=pow(abs(dot(vN,vV)),1.5);gl_FragColor=vec4(vec3(1.,.9,.65)*uA*(1.-vX)*(1.-vX)*f*.5,1.);}'});
  const beam=new G.Group();for(const r of[0,PI]){const b=new G.Mesh(bg,beamM);b.rotation.y=r;beam.add(b);}beam.position.set(x,y+18.8,z);scene.add(beam);W.beam={g:beam,m:beamM};
  house({x:70,z:-6,ry:.2,w:5,d:4.5,h:3.2,wall:0xf0e8d8,roof:0x2f5a8a,sign:'KEEPER',signBg:'rgba(40,40,60,.85)'});
  // mine entrance (rail rider)
  {const P=at(62,height(62,15),15,-1.2);solid.add(Bx(6,5,3),L(P,0,2,-1.5),ROCK).add(Bx(1,4.4,1),L(P,-2,2.2,0),WOOD).add(Bx(1,4.4,1),L(P,2,2.2,0),WOOD).add(Bx(5.4,.8,1),L(P,0,4.4,0),WOOD);
   const dk=new G.Mesh(Pl(3,3.6),new G.MeshBasicMaterial({color:0x05070c}));dk.position.set(0,1.8,.05);dk.applyMatrix4(P);scene.add(dk);
   for(const sx of[-.6,.6])solid.add(Bx(.12,.1,6),L(P,sx,.08,2.5),0x8a8f9a);for(let i=0;i<7;i++)solid.add(Bx(1.8,.1,.3),L(P,0,.03,i*.9),WOOD);
   for(let i=0;i<5;i++)glow.add(new G.OctahedronGeometry(.4),L(P,-2.8+i*1.4,4.9+(i%2)*.3,.3,rnd(1),rnd(1),0),new G.Color(.4,1.6,2.2));
   solid.add(Bx(1.6,.9,1.2),L(P,0,.55,2.2),0x6a5040);ob('out',{x:62,z:15,r:3.2});sign('GLIMMER MINE',...new V3(0,6,.5).applyMatrix4(P).toArray(),{bg:'rgba(30,60,90,.9)'});
   W.emit.push({space:'out',...new V3(0,4.5,1).applyMatrix4(P),col:0x60d0ff,i:8,night:true});}
  bench(64,-2,.5,'light');bench(72,12,PI-.2,'light');lamp(58,8,'out');lamp(70,9);
 }

 /* ================= PLAZA STAGE ================= */
 {const sx=-61,sz=18,P=at(sx,2,sz,PI/2);solid.add(Bx(17,1.2,9),L(P,0,.6,0),0x6a4a5a).add(Bx(17.5,.15,9.4),L(P,0,1.25,0),WOODL);
  // back wall + arch + curtains
  solid.add(Bx(18,9,.6),L(P,0,4.5,-4.2),0x3a2a4a).add(Bx(1.2,9,1),L(P,-8.5,4.5,-3.5),0x5a3a6a).add(Bx(1.2,9,1),L(P,8.5,4.5,-3.5),0x5a3a6a).add(Bx(18,1.4,1),L(P,0,9.2,-3.5),0x5a3a6a);
  const cur=new G.CylinderGeometry(.5,.5,7.6,10,1,true,0,PI);for(let i=0;i<7;i++)for(const s of[-1,1])solid.add(cur,L(P,s*(4.6+i*.55),4.9,-3.4,0,PI,0),0xb02838);
  for(let i=0;i<18;i++)glow.add(Sp(.12,6,4),L(P,-8+i*.94,9.9,-2.95),new G.Color(1.6,1.3,.6));
  W.stageP=P;sign('PLAZA STAGE',...new V3(0,11.4,-3).applyMatrix4(P).toArray(),{bg:'rgba(120,30,50,.9)',scale:1.4});
  for(const s of[-1,1]){solid.add(Cy(.1,.1,6,6),L(P,s*10,3,4),DARK).add(Cy(.4,.25,.8,10),L(P,s*10,6,4,.7),DARK);glow.add(new G.CircleGeometry(.24,10),L(P,s*10,5.8,4.42,.7+PI/2),new G.Color(2,1.8,1.2));}
  ob('out',{x:sx,z:sz,hw:4.6,hd:8.8});
  // audience benches
  for(let r=0;r<3;r++)for(const s of[-1,1])bench(-48+r*3.4,sz+s*3.6,-PI/2,'stage');
  lamp(-44,8);lamp(-44,28);
  // snow fort field
  for(const[x,z,ry]of[[-52,33,0],[-44,38,.4],[-56,40,-.3]]){const P2=at(x,height(x,z),z,ry);snowB.add(Bx(3.6,1.3,1),L(P2,0,.65,0),0xffffff);for(let i=0;i<4;i++)snowB.add(Bx(.7,.5,1),L(P2,-1.35+i*.9,1.5,0),0xffffff);ob('out',{x,z,r:1.9});}
  for(let i=0;i<9;i++){const x=-50+rnd(-7,7),z=36+rnd(-5,5);snowB.add(Sp(.35,8,6),at(x,height(x,z)+.2,z),0xffffff);}
 }

 /* ================= IGLOO STREET + PET SHOP ================= */
 {const igloos=[];const icol=[0xe8f4ff,0xffe8f2,0xe8fff0,0xfff8e0,0xf0e8ff,0xe8f8ff];
  const spots=[[-30,-38,.2],[-40,-43,.15],[-62,-30,PI-.4],[-52,-26,PI-.3],[-66,-46,.5],[-42,-25,PI]];let my=null;
  spots.forEach(([x,z,ry],i)=>{const y=height(x,z),P=at(x,y,z,ry);igloos.push([new G.SphereGeometry(3.4,28,14,0,PI*2,0,PI/2),L(P,0,0,0),icol[i]],[new G.CylinderGeometry(1.3,1.3,2.4,16,1,true,0,PI),L(P,0,0,3.2,PI/2,0,0),icol[i]]);
   solid.add(new G.CircleGeometry(.95,16,0,PI),L(P,0,.02,4.42),0x1a2a40);ob('out',{x,z,r:3.6});if(i===5){my={x:x+Math.sin(ry)*5,z:z+Math.cos(ry)*5,P};}});
  const tex=ctex(256,128,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='rgba(120,150,190,.55)';x.lineWidth=2;for(let r=0;r<8;r++){const y=r*h/8;x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke();for(let c=0;c<12;c++){const xx=c*w/12+(r%2)*w/24;x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+h/8);x.stroke();}}});
  const im=snowMaterial({spark:.6});im.map=tex;const igm=new G.Mesh(merge(igloos),im);igm.castShadow=igm.receiveShadow=true;scene.add(igm);W.snowMats.push(im);
  // my igloo flag + door
  {const P=my.P;solid.add(Cy(.06,.06,4,6),L(P,2,3.6,0),0x666666);const fl=new G.Mesh(Pl(1.6,1),new G.MeshStandardMaterial({color:0xff4d00,side:G.DoubleSide,roughness:.7}));fl.position.set(2.8,5,0);fl.applyMatrix4(P);scene.add(fl);W.myFlag=fl;
   W.anim.push((dt,t)=>{fl.rotation.y=Math.sin(t*3)*.2;});trig({kind:'door',space:'out',x:my.x,z:my.z,r:1.5,to:'igloo',label:'MY IGLOO'});W.doorOut.igloo=[my.x,my.z+0];W.myIglooFront=my;
   sign('MY IGLOO',...new V3(0,4.6,2).applyMatrix4(P).toArray(),{bg:'rgba(255,77,0,.9)',scale:.9});}
  // pet shop
  {const x=-38,z=-50,ry=.35,y=height(x,z),P=at(x,y,z,ry);solid.add(Bx(9,4.4,6),L(P,0,2.2,-.5),0xf8c8d8).add(Bx(9.4,.4,6.4),L(P,0,4.6,-.5),0x2fb0a8);snowB.add(Bx(9.2,.35,6.2),L(P,0,4.95,-.5),0xffffff);
   const aw=ctex(256,32,(x2,w,h)=>{for(let i=0;i<16;i++){x2.fillStyle=i%2?'#fff':'#2fb0a8';x2.fillRect(i*16,0,16,h);}});const awn=new G.Mesh(Pl(9.4,1.6),new G.MeshStandardMaterial({map:aw,side:G.DoubleSide,roughness:.8}));awn.position.set(0,4,3.2);awn.rotation.x=-.9;awn.applyMatrix4(P);awn.castShadow=true;scene.add(awn);
   solid.add(Bx(7,1.1,1),L(P,0,.55,2.4),0xffffff).add(Bx(7.2,.12,1.2),L(P,0,1.15,2.4),0x2fb0a8);glow.add(Pl(8,3.2),L(P,0,2.3,2.52),new G.Color(1,.82,.7));
   ob('out',{x,z,r:4.8});sign('POMLET PETS',...new V3(0,6.2,2.8).applyMatrix4(P).toArray(),{bg:'rgba(47,176,168,.95)'});
   const front=new V3(0,0,4.6).applyMatrix4(P);trig({kind:'shop',space:'out',x:front.x,z:front.z,r:1.8,tab:'pets',label:'POMLET PETS'});W.petShop={P,front};
   W.emit.push({space:'out',...new V3(0,3,3).applyMatrix4(P),col:0xffc0d0,i:9,night:true});}
  // pomlet pen (roundup game)
  {const cx=-60,cz=-20;const fl=[];for(let i=0;i<20;i++){const a=i/20*PI*2;if(i===5||i===6)continue;const x=cx+Math.cos(a)*5,z=cz+Math.sin(a)*5,y=height(x,z);fl.push([Cy(.09,.09,1.2,6),M(x,y+.6,z),0xffffff]);const a2=(i+1)/20*PI*2;if(i!==4){const x2=cx+Math.cos(a2)*5,z2=cz+Math.sin(a2)*5;fl.push([Bx(.08,.08,Math.hypot(x2-x,z2-z)),M((x+x2)/2,y+.9,(z+z2)/2,0,-Math.atan2(z2-z,x2-x)+PI/2,0),0xff8ac0]);}}
   const fm=new G.Mesh(merge(fl),new G.MeshStandardMaterial({vertexColors:true,roughness:.6}));fm.castShadow=true;scene.add(fm);W.penAt={x:cx,z:cz};}
  bench(-46,-33,.35,'street');bench(-56,-38,PI+.3,'street');lamp(-36,-32);lamp(-50,-40);lamp(-62,-38);snowman(-34,-46,.9,.8);
 }

 /* ================= trees, rocks, mounds ================= */
 {const r=rng(42),pt=[];let n=0;const busy=[[0,0,24],[-50,18,22],[-48,-36,24],[70,4,16],[16,80,18],[40,98,14],[3,-44,10],[-13,-46,8],[10,-46,6],[-60,-20,7],[-48,36,10]];
  while(pt.length<300&&n++<8000){const x=r()*230-115,z=r()*230-115,h=height(x,z);if(h<1.2||Math.hypot(x,z)>106)continue;if(busy.some(([a,b,c])=>Math.hypot(x-a,z-b)<c))continue;if(pathD(x,z)<4.5)continue;if(z<-48&&Math.abs(x-3)<9)continue;if(z<-44&&Math.abs(x-9)<4)continue;
   pt.push({x,y:h-.2,z,s:.6+r()*.8});}
  W.trees=instancedPines(scene,pt);for(const p of pt)if(p.s>.75)ob('out',{x:p.x,z:p.z,r:.7*p.s});
  const rk=[];for(let i=0;i<70;i++){const x=r()*220-110,z=r()*220-110,h=height(x,z);if(h<-.5||busy.some(([a,b,c])=>Math.hypot(x-a,z-b)<c)||pathD(x,z)<3)continue;const s=.5+r()*1.4;rk.push([new G.IcosahedronGeometry(1,0),M(x,h,z,r(),r()*7,r(),s*1.4,s*.8,s),0x7a808c]);snowB.add(new G.IcosahedronGeometry(1,1),M(x,h+s*.45,z,0,r()*7,0,s*1.1,s*.4,s*.8),0xffffff);if(s>.9)ob('out',{x,z,r:s});}
  const rm=new G.Mesh(merge(rk),new G.MeshStandardMaterial({vertexColors:true,roughness:.9,flatShading:true}));rm.castShadow=rm.receiveShadow=true;scene.add(rm);}

 /* ================= INTERIORS ================= */
 const shell=(o,w,h,d,tex,col)=>{const g=new G.BoxGeometry(w,h,d);g.translate(o[0],h/2-.02,o[2]);const m=new G.Mesh(g,new G.MeshStandardMaterial({map:tex||null,color:col??0xffffff,side:G.BackSide,roughness:.85}));m.receiveShadow=true;scene.add(m);return m;};
 const planks=(c1,c2)=>ctex(256,256,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?c1:c2;x.fillRect(0,i*h/8,w,h/8);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,i*h/8,w,2);x.fillRect(((i*97)%w),i*h/8,2,h/8);}for(let k=0;k<400;k++){x.fillStyle=`rgba(0,0,0,${Math.random()*.06})`;x.fillRect(Math.random()*w,Math.random()*h,8,1);}});
 const floor=(o,w,d,tex,rep=[4,3])=>{tex.repeat.set(...rep);const m=new G.Mesh(new G.PlaneGeometry(w,d),new G.MeshStandardMaterial({map:tex,roughness:.6,envMapIntensity:.5}));m.rotation.x=-PI/2;m.position.set(o[0],.01,o[2]);m.receiveShadow=true;scene.add(m);return m;};
 const exitMat=(space,o)=>{const g=new G.RingGeometry(.8,1.1,32);g.rotateX(-PI/2);const m=new G.Mesh(g,new G.MeshBasicMaterial({color:new G.Color(1.6,1.1,.6),transparent:true,opacity:.7}));m.position.set(o[0],.04,o[2]+7.6);scene.add(m);trig({kind:'exit',space,x:o[0],z:o[2]+7.9,r:1.3,label:'EXIT'});};
 // ---- COFFEE SHOP ----
 {const o=SPACE_ORIGIN.coffee,P=at(o[0],0,o[2]);
  const wall=ctex(256,256,(x,w,h)=>{x.fillStyle='#f4e2c4';x.fillRect(0,0,w,h);for(let i=0;i<16;i++){x.fillStyle=i%2?'#ecd6b4':'#f4e2c4';x.fillRect(i*w/16,0,w/16,h*.62);}x.fillStyle='#8a5a3a';x.fillRect(0,h*.62,w,h*.38);x.fillStyle='#6a4028';x.fillRect(0,h*.62,w,6);});wall.repeat.set(4,1);
  shell(o,20,7,16,wall);floor(o,20,16,planks('#a8703e','#9a6434'),[3,3]);
  // counter + kitchen
  solid.add(Bx(11,1.3,1.4),L(P,-3,.65,-4.4),0x7a4a2a).add(Bx(11.3,.14,1.7),L(P,-3,1.35,-4.4),0xe8dcc8).add(Bx(1.4,1.3,4),L(P,-9,.65,-3),0x7a4a2a);
  solid.add(Bx(1.4,1.1,.8),L(P,-6,1.95,-4.6),0xc0c4cc).add(Cy(.12,.12,.3,8),L(P,-6.3,1.6,-4.2),0x333333).add(Bx(.9,.6,.6),L(P,-1.2,1.7,-4.5),0x333338);
  glow.add(Bx(2.6,.9,.9),L(P,-3.6,1.88,-4.4),new G.Color(1.2,1,.8));for(let i=0;i<8;i++)solid.add(Sp(.14,8,6),L(P,-4.5+i*.26,1.6+(i%2)*.3,-4.3),[0xd88a4a,0xf2c060,0xff8ac0,0x8a5030][i%4]);
  // menu board + shelves + windows
  {const mt=ctex(512,256,(x,w,h)=>{x.fillStyle='#1e2a24';x.fillRect(0,0,w,h);x.strokeStyle='#8a5a3a';x.lineWidth=14;x.strokeRect(0,0,w,h);x.fillStyle='#fff';x.font='40px Anton, Impact, sans-serif';x.textAlign='center';x.fillText('TODAY\'S MENU',w/2,52);x.font='26px JetBrains Mono, monospace';x.textAlign='left';
    [['Hot Cocoa','5'],['Snowmallow Latte','7'],['Fish Pizza','12'],['Kelp Tea','4']].forEach(([a,b],i)=>{x.fillStyle=['#ffd8a8','#ffb8d8','#b8e8ff','#c8ffb8'][i];x.fillText(a,40,100+i*38);x.textAlign='right';x.fillText(b+'c',w-40,100+i*38);x.textAlign='left';});});
   const m=new G.Mesh(Pl(5,2.5),new G.MeshStandardMaterial({map:mt,roughness:.9,emissive:0xffffff,emissiveMap:mt,emissiveIntensity:.15}));m.position.set(o[0]-3,4.2,o[2]-7.95);scene.add(m);}
  for(const wx of[4.5,8])winIn.add(Pl(2.4,2.4),L(P,wx,3.8,-7.96),0xffffff);for(const wz of[-3,2])winIn.add(Pl(2.4,2.4),L(P,-9.96,3.8,wz,0,PI/2,0),0xffffff);
  for(const wx of[4.5,8])solid.add(Bx(2.7,.15,.3),L(P,wx,2.55,-7.85),0x6a4028);
  // fireplace on left wall
  solid.add(Bx(1.2,3.4,4),L(P,-9.4,1.7,3),0x9a8a84).add(Bx(1.3,.3,4.4),L(P,-9.3,3.45,3),0x6a4028).add(Bx(.7,1.4,2.2),L(P,-8.9,.8,3),0x1a1210);
  const fire=new G.Mesh(merge([[new G.ConeGeometry(.35,1,8),M(-8.75,.7,3)],[new G.ConeGeometry(.25,.7,8),M(-8.75,.55,2.6)],[new G.ConeGeometry(.25,.7,8),M(-8.75,.55,3.4)]]),new G.MeshBasicMaterial({color:new G.Color(4,1.6,.4)}));fire.position.x=o[0];fire.position.z=o[2];scene.add(fire);W.anim.push((dt,t)=>{fire.scale.y=1+Math.sin(t*13)*.12+Math.sin(t*7.3)*.08;});
  W.emit.push({space:'coffee',x:o[0]-8.2,y:1,z:o[2]+3,col:0xff7a30,i:22});ob('coffee',{x:o[0]-9.4,z:o[2]+3,hw:.8,hd:2.2});
  // tables + stools + hanging lamps
  for(const[tx,tz]of[[-4,0],[1,1.5],[5.5,-1],[3,5],[-5,4.5]]){solid.add(Cy(.9,.9,.1,20),L(P,tx,1.05,tz),0xb07a50).add(Cy(.1,.14,1,8),L(P,tx,.5,tz),0x4a3020).add(Cy(.5,.55,.06,16),L(P,tx,.03,tz),0x4a3020);
   solid.add(Cy(.25,.18,.25,10),L(P,tx+.1,1.22,tz+.2),0xffffff);ob('coffee',{x:o[0]+tx,z:o[2]+tz,r:1});
   for(let k=0;k<2;k++){const a=k*PI+.6,sx=tx+Math.cos(a)*1.55,sz=tz+Math.sin(a)*1.55;solid.add(Cy(.38,.32,.6,12),L(P,sx,.3,sz),0xd8383e);(W.seats.coffee=W.seats.coffee||[]).push({x:o[0]+sx,z:o[2]+sz,ry:Math.atan2(tx-sx,tz-sz),y:1.0});}
   solid.add(Cy(.01,.01,2.6,4),L(P,tx,5.7,tz),0x222222).add(new G.ConeGeometry(.42,.4,12,1,true),L(P,tx,4.3,tz),0xe8c890);glow.add(Sp(.16,8,6),L(P,tx,4.05,tz),WARM.clone().multiplyScalar(2));W.emit.push({space:'coffee',x:o[0]+tx,y:3.8,z:o[2]+tz,col:0xffb070,i:16});}
  ob('coffee',{x:o[0]-3,z:o[2]-4.4,hw:5.7,hd:.9});ob('coffee',{x:o[0]-9,z:o[2]-3,hw:.9,hd:2.2});
  {const pl=furnModel('fu_plant');pl.position.set(o[0]+8.4,0,o[2]+6);scene.add(pl);const pl2=furnModel('fu_plant');pl2.position.set(o[0]-8.6,0,o[2]-6.4);scene.add(pl2);const bb=furnModel('fu_bean');bb.position.set(o[0]+8,0,o[2]+2.5);bb.rotation.y=-1.3;scene.add(bb);}
  // kitchen door → pizza rush
  solid.add(Bx(2.4,3.2,.3),L(P,6.5,1.6,-7.85),0x6a4028);glow.add(Pl(1.9,2.8),L(P,6.5,1.4,-7.68),new G.Color(1.4,.9,.5));
  exitMat('coffee',o);}
 // ---- DANCE CLUB ----
 {const o=SPACE_ORIGIN.club,P=at(o[0],0,o[2]);shell(o,18,8,16,null,0x2a2048);
  const tiles=new G.InstancedMesh(new G.BoxGeometry(1.86,.1,1.86),new G.MeshBasicMaterial({color:0xffffff}),9*8);let i=0;const m4=new G.Matrix4();for(let a=0;a<9;a++)for(let b=0;b<8;b++){m4.makeTranslation(o[0]-8+a*2,.03,o[2]-6.5+b*1.95);tiles.setMatrixAt(i,m4);tiles.setColorAt(i++,new G.Color(1,1,1));}scene.add(tiles);W.clubTiles=tiles;
  solid.add(Bx(8,1,3),L(P,0,.5,-6.3),0x18142a).add(Bx(4,1.2,1.2),L(P,0,1.6,-6),0x101018).add(Cy(.45,.45,.06,20),L(P,-1,2.23,-6),0x111111).add(Cy(.45,.45,.06,20),L(P,1,2.23,-6),0x111111);
  for(const s of[-1,1]){solid.add(Bx(1.6,3.6,1.4),L(P,s*7.6,1.8,-6.6),0x15151c);for(const y of[1,2.6])solid.add(Cy(.55,.55,.1,16),L(P,s*7.6,y,-5.88,PI/2),0x333340);}
  for(const y of[2,4.5,7])glow.add(Bx(18,.12,.12),L(P,0,y,-7.92),new G.Color(1.6,.4,1.6));for(const y of[2,4.5,7])glow.add(Bx(.12,.12,16),L(P,-8.92,y,0),new G.Color(.4,1.4,1.8));
  {const ds=ctex(512,128,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.font='92px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#ff3cac';x.shadowBlur=20;x.fillStyle='#ffd0f0';x.fillText('DISCO FLOE',w/2,h/2+4);});
   const m=new G.Mesh(Pl(7,1.75),new G.MeshBasicMaterial({map:ds,transparent:true,blending:G.AdditiveBlending,color:new G.Color(1.6,1.6,1.6)}));m.position.set(o[0],5.6,o[2]-7.9);scene.add(m);}
  const ball=new G.Mesh(new G.IcosahedronGeometry(.9,2),new G.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:.18,flatShading:true,envMapIntensity:1.1}));ball.position.set(o[0],6.4,o[2]);scene.add(ball);
  const beams=new G.Group();const bm=new G.ShaderMaterial({transparent:true,depthWrite:false,blending:G.AdditiveBlending,side:G.DoubleSide,uniforms:{},vertexShader:'varying float vY;void main(){vY=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying float vY;void main(){gl_FragColor=vec4(vec3(.5,.35,.9)*vY*.35,1.);}'});
  for(let k=0;k<6;k++){const g=new G.ConeGeometry(1.2,7,12,1,true);g.translate(0,-3.5,0);const c=new G.Mesh(g,bm);c.rotation.set(.5,k/6*PI*2,0,'YXZ');beams.add(c);}beams.position.copy(ball.position);scene.add(beams);
  W.club={ball,beams,o};W.anim.push((dt,t)=>{ball.rotation.y+=dt*.6;beams.rotation.y+=dt*.5;beams.children.forEach((c,k)=>c.rotation.x=.45+Math.sin(t*1.3+k)*.25);});
  for(const s of[-1,1]){solid.add(Bx(1.2,.7,4),L(P,s*7.8,.35,3),0x6a2a6a).add(Bx(.4,1.2,4),L(P,s*8.4,.9,3),0x6a2a6a);ob('club',{x:o[0]+s*7.8,z:o[2]+3,hw:.8,hd:2});for(const z of[2,4])(W.seats.club=W.seats.club||[]).push({x:o[0]+s*7.6,z:o[2]+z,ry:-s*PI/2,y:1.08});}
  ob('club',{x:o[0],z:o[2]-6.3,hw:4.2,hd:1.6});ob('club',{x:o[0]-7.6,z:o[2]-6.6,hw:.9,hd:.8});ob('club',{x:o[0]+7.6,z:o[2]-6.6,hw:.9,hd:.8});
  W.emit.push({space:'club',x:o[0]-4,y:5,z:o[2]-2,col:0xff40c0,i:30},{space:'club',x:o[0]+4,y:5,z:o[2]-2,col:0x40c0ff,i:30},{space:'club',x:o[0],y:4,z:o[2]+4,col:0xb070ff,i:24});
  exitMat('club',o);}
 // ---- MY IGLOO ----
 {const o=SPACE_ORIGIN.igloo;const tex=ctex(512,256,(x,w,h)=>{x.fillStyle='#eef6ff';x.fillRect(0,0,w,h);x.strokeStyle='rgba(120,150,190,.45)';x.lineWidth=3;for(let r=0;r<10;r++){const y=r*h/10;x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke();for(let c=0;c<20;c++){const xx=c*w/20+(r%2)*w/40;x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+h/10);x.stroke();}}});
  const dome=new G.Mesh(new G.SphereGeometry(9,40,20,0,PI*2,0,PI/2),new G.MeshStandardMaterial({map:tex,side:G.BackSide,roughness:.7,color:0xf4f8ff}));dome.position.set(o[0],0,o[2]);dome.receiveShadow=true;scene.add(dome);
  const fl=new G.Mesh(new G.CircleGeometry(9,48),new G.MeshStandardMaterial({map:planks('#9ab8d8','#8aaccc'),roughness:.4,envMapIntensity:.9}));fl.material.map.repeat.set(3,3);fl.rotation.x=-PI/2;fl.position.set(o[0],.01,o[2]);fl.receiveShadow=true;scene.add(fl);
  winIn.add(new G.CircleGeometry(1.2,20),M(o[0],5.2,o[2]-7.3,.5,0,0),0xffffff);
  W.iglooRoot=new G.Group();W.iglooRoot.position.set(o[0],0,o[2]);scene.add(W.iglooRoot);W.emit.push({space:'igloo',x:o[0],y:5,z:o[2],col:0xffd0a0,i:26},{space:'igloo',x:o[0]-4,y:3,z:o[2]+2,col:0xa0c8ff,i:12});
  exitMat('igloo',o);}

 /* ---------- finalize batches ---------- */
 const solidM=new G.MeshStandardMaterial({vertexColors:true,roughness:.78,envMapIntensity:.5});scene.add(solid.mesh(solidM));
 const glowM=new G.MeshBasicMaterial({vertexColors:true,color:new G.Color(1,1,1)});const gm=glow.mesh(glowM,{cast:false,recv:false});scene.add(gm);W.glowM=glowM;
 const sm=snowMaterial();scene.add(snowB.mesh(sm));W.snowMats.push(sm);
 const winM=new G.MeshBasicMaterial({vertexColors:true,color:new G.Color(.6,.8,1)});scene.add(winIn.mesh(winM,{cast:false,recv:false}));W.winM=winM;

 /* ---------- game spots ---------- */
 const SPOT={sled:{space:'out',x:3,z:-41,n:'SLED DASH',ly:5.6},fish:{space:'out',x:38,z:95,n:'FROSTY FISHING'},pizza:{space:'coffee',x:6.5,z:-5.6,n:'PIZZA RUSH'},dance:{space:'club',x:-4.8,z:-3.6,n:'DISCO FLOE'},
  pets:{space:'out',x:-55,z:-22,n:'POMLET ROUNDUP'},rail:{space:'out',x:59,z:17,n:'RAIL RIDER'},snow:{space:'out',x:-45,z:31,n:'SNOW FORT SHOWDOWN'}};
 const ringG=new G.TorusGeometry(1.5,.08,8,48);ringG.rotateX(PI/2);const colG=new G.CylinderGeometry(1.5,1.5,3,32,1,true);colG.translate(0,1.5,0);
 const colM=new G.ShaderMaterial({transparent:true,depthWrite:false,blending:G.AdditiveBlending,side:G.DoubleSide,uniforms:{uT:{value:0},uC:{value:new G.Color(1,.45,.15)}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT;uniform vec3 uC;varying vec2 vU;void main(){float a=(1.-vU.y)*(1.-vU.y)*(.55+.45*sin(vU.x*40.+uT*3.));gl_FragColor=vec4(uC*a*.38,1.);}'});W.spotM=colM;
 for(const k in SPOT){const s=SPOT[k],o=SPACE_ORIGIN[s.space],x=o[0]+s.x,z=o[2]+s.z,y=W.ground(s.space,x,z);const g=new G.Group();g.position.set(x,y+.05,z);
  g.add(new G.Mesh(ringG,new G.MeshBasicMaterial({color:new G.Color(2.2,.9,.3)})));g.add(new G.Mesh(colG,colM));const sp=textSprite('★ '+s.n,{size:56,bg:'rgba(255,77,0,.92)',color:'#111',scale:.9});sp.position.y=s.ly||3.6;g.add(sp);scene.add(g);
  W.spots[k]={...s,x,z,y,g,sp};trig({kind:'game',space:s.space,x,z,r:1.6,game:k,label:s.n});}

 /* ---------- golden snowflake tokens (daily collectibles) ---------- */
 const COIN_AT=[[-3,-100],[28,-60],[-30,-70],[84,14],[66,-14],[16,110],[-24,72],[48,40],[-82,8],[-75,-50],[-20,-56],[30,-20],[-28,40],[0,30],[56,70],[-60,60]];
 {const g=new G.OctahedronGeometry(.5,0);g.scale(1,1.3,.35);const m=new G.InstancedMesh(g,new G.MeshStandardMaterial({color:0xffc83a,metalness:.9,roughness:.25,emissive:0xff9a00,emissiveIntensity:.5,envMapIntensity:1.6}),COIN_AT.length);m.frustumCulled=false;scene.add(m);W.coinMesh=m;
  W.coins=COIN_AT.map(([x,z])=>({x,z,y:groundY(x,z)+1.2,got:false}));}
 W.resetCoins=()=>W.coins.forEach(c=>c.got=false);

 /* ---------- party decorations ---------- */
 W.setParty=(p)=>{if(W.partyG){scene.remove(W.partyG);W.partyG.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material&&n.material.map)n.material.map.dispose();});}
  const g=new G.Group();W.partyG=g;W.party=p;const cols=p.cols.map(c=>new G.Color(c));
  // bunting between plaza lamps
  const fl=[],tri=new G.BufferGeometry();tri.setAttribute('position',new G.Float32BufferAttribute([-.26,0,0,.26,0,0,0,-.5,0],3));tri.computeVertexNormals();
  const ends=[];for(let i=0;i<8;i++){const a=i/8*PI*2+PI/8;ends.push([Math.cos(a)*16.5,7.8,Math.sin(a)*16.5]);}ends.push([0,9.5,0]);
  const strings=[];for(let i=0;i<8;i++)strings.push([ends[i],ends[(i+1)%8]]);
  const lineG=[];strings.forEach(([a,b],si)=>{const n=Math.round(Math.hypot(b[0]-a[0],b[2]-a[2])/.9);for(let k=0;k<=n;k++){const t=k/n,x=lerp(a[0],b[0],t),z=lerp(a[2],b[2],t),y=lerp(a[1],b[1],t)-Math.sin(t*PI)*1.1+2;
   if(k<n)fl.push([tri,M(x,y,z,0,-Math.atan2(b[2]-a[2],b[0]-a[0]),0),cols[(k+si)%cols.length]]);if(k<n){const t2=(k+1)/n,x2=lerp(a[0],b[0],t2),z2=lerp(a[2],b[2],t2),y2=lerp(a[1],b[1],t2)-Math.sin(t2*PI)*1.1+2;lineG.push(x,y,z,x2,y2,z2);}}});
  const bm=new G.Mesh(merge(fl),new G.MeshStandardMaterial({vertexColors:true,side:G.DoubleSide,roughness:.7,emissive:0x111111}));g.add(bm);
  const lg=new G.BufferGeometry();lg.setAttribute('position',new G.Float32BufferAttribute(lineG,3));g.add(new G.LineSegments(lg,new G.LineBasicMaterial({color:0x444444})));
  // lanterns / bulbs on the strings (glow at night)
  const bl=[];strings.forEach(([a,b],si)=>{for(let k=1;k<6;k++){const t=k/6;bl.push([Sp(.16,8,6),M(lerp(a[0],b[0],t),lerp(a[1],b[1],t)-Math.sin(t*PI)*1.1+1.6,lerp(a[2],b[2],t)),cols[(k+si)%cols.length].clone().multiplyScalar(1.4)]);}});
  const bulbs=new G.Mesh(merge(bl),new G.MeshBasicMaterial({vertexColors:true}));g.add(bulbs);W.partyBulbs=bulbs;
  // balloon clusters at the room entrances
  const bal=[];for(const[x,z]of[[13.5,13.5],[-6,-12.5],[6,-12.5],[17.5,-2],[-18,6],[-36,12],[-33,-25],[50,6],[12,56],[-3,-38]]){const y=height(x,z);for(let k=0;k<5;k++){const bx=x+rnd(-.8,.8),bz=z+rnd(-.8,.8),by=y+3.2+rnd(1.4);bal.push([Sp(.42,12,10),M(bx,by,bz,0,0,0,1,1.18,1),cols[k%cols.length]]);bal.push([Cy(.01,.01,by-y-.3,3),M((bx+x)/2,(by+y)/2,(bz+z)/2),0xdddddd]);}}
  const bmesh=new G.Mesh(merge(bal),new G.MeshStandardMaterial({vertexColors:true,roughness:.25,envMapIntensity:1.2}));bmesh.castShadow=true;g.add(bmesh);W.balloons=bmesh;
  // banner over the plaza
  const bt=ctex(1024,160,(x,w,h)=>{const gr=x.createLinearGradient(0,0,w,0);cols.forEach((c,i)=>gr.addColorStop(i/(cols.length-1),'#'+c.getHexString()));x.fillStyle=gr;x.fillRect(0,0,w,h);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,h-14,w,14);x.font='96px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=10;x.strokeStyle='rgba(0,0,0,.45)';x.strokeText(p.n.toUpperCase(),w/2,h/2);x.fillStyle='#fff';x.fillText(p.n.toUpperCase(),w/2,h/2);});
  const ban=new G.Mesh(new G.PlaneGeometry(13,2),new G.MeshStandardMaterial({map:bt,side:G.DoubleSide,roughness:.8,emissive:0xffffff,emissiveMap:bt,emissiveIntensity:.15}));ban.position.set(0,13.5,-15);g.add(ban);
  for(const sx of[-6.6,6.6]){const pole=new G.Mesh(new G.CylinderGeometry(.12,.12,13,8),new G.MeshStandardMaterial({color:0x444448}));pole.position.set(sx,8.5,-15);g.add(pole);}
  // party-specific extras
  if(p.id==='lantern'||p.id==='cocoa'||p.id==='aurora'){const lt=[];for(let i=0;i<24;i++){const a=i/24*PI*2;lt.push([Cy(.3,.3,.6,10),M(Math.cos(a)*20,4.5+Math.sin(i*1.7)*.4,Math.sin(a)*20),cols[i%cols.length].clone().multiplyScalar(1.8)]);}g.add(new G.Mesh(merge(lt),new G.MeshBasicMaterial({vertexColors:true})));}
  if(p.id==='beach'){const tk=[];for(const[x,z]of[[-4,72],[8,70],[28,74],[20,66]]){const y=height(x,z);tk.push([Cy(.1,.12,2.6,6),M(x,y+1.3,z),0x8a5a3a]);}g.add(new G.Mesh(merge(tk),new G.MeshStandardMaterial({vertexColors:true})));for(const[x,z]of[[-4,72],[8,70],[28,74],[20,66]]){const f=new G.Mesh(new G.ConeGeometry(.25,.7,8),new G.MeshBasicMaterial({color:new G.Color(4,1.5,.3)}));f.position.set(x,height(x,z)+2.9,z);f.userData.flicker=1;g.add(f);}}
  if(p.id==='music'||p.id==='pom'){const nt=[];for(let i=0;i<12;i++){const x=-61+rnd(-2,2),z=18+rnd(-8,8);nt.push([Sp(.3,8,6),M(x+3,5+rnd(4),z),cols[i%3]]);}g.add(new G.Mesh(merge(nt),new G.MeshBasicMaterial({vertexColors:true})));}
  scene.add(g);
  // board texture
  const bt2=W.board.tex,c=bt2.image,x=c.getContext('2d');x.fillStyle='#f4ecd8';x.fillRect(0,0,c.width,c.height);x.fillStyle='#'+cols[0].getHexString();x.fillRect(0,0,c.width,70);x.fillStyle='#fff';x.font='48px Anton, Impact, sans-serif';x.textAlign='center';x.fillText('TODAY',c.width/2,52);
  x.fillStyle='#2a2a30';x.font='44px Anton, Impact, sans-serif';x.fillText(p.n.toUpperCase(),c.width/2,140);x.font='24px JetBrains Mono, monospace';x.fillText('Free party hat here!',c.width/2,200);x.fillText('Press E / click to claim',c.width/2,240);bt2.needsUpdate=true;};

 /* ---------- spaces + lighting ---------- */
 const IN={coffee:{hs:0xffd8b0,hg:0x6a4030,hi:.75,sun:0xffd8a8,si:1.2,fog:0x2a1a14},club:{hs:0x8a60ff,hg:0x301040,hi:.55,sun:0xc8a0ff,si:.7,fog:0x100818},igloo:{hs:0xd8e8ff,hg:0xa8b8d0,hi:.9,sun:0xfff0e0,si:1.3,fog:0x8aa0c0}};
 W.setSpace=(s)=>{W.space=s;};
 const tmpC=new G.Color();let lightT=0;
 W.update=(dt,t,hour,focus,cam)=>{const pal=palette(hour),U=sky.userData.U;W.pal=pal;U.time.value=t;
  const sp=W.space,inside=sp!=='out';
  U.top.value.copy(pal.top);U.hor.value.copy(pal.hor);U.bot.value.copy(pal.hor).lerp(new G.Color(.9,.95,1),.3);U.sunDir.value.copy(pal.sunDir);U.sunCol.value.copy(pal.sun);U.stars.value=pal.night;U.moonDir.value.copy(pal.moonDir);
  U.aurora.value=Math.max(0,pal.night-.4)/.6*(W.party&&W.party.id==='aurora'?1.6:1);
  if(!inside){scene.fog.color.copy(pal.fog);scene.fog.density=.0042;hemi.color.copy(pal.hs);hemi.groundColor.copy(pal.hg);hemi.intensity=pal.hi;sun.color.copy(pal.sun);sun.intensity=pal.si;sun.position.copy(focus).addScaledVector(pal.lightDir,90);}
  else{const c=IN[sp];scene.fog.color.set(c.fog);scene.fog.density=.003;hemi.color.set(c.hs);hemi.groundColor.set(c.hg);hemi.intensity=c.hi;sun.color.set(c.sun);sun.intensity=c.si;sun.position.copy(focus).add(new V3(10,40,22));}
  sun.target.position.copy(focus);sun.target.updateMatrixWorld();
  const n=pal.night;W.glowM.color.setScalar(inside?1.8:.55+n*1.9);W.winM.color.copy(pal.hor).lerp(pal.top,.4).multiplyScalar(inside?1.1:1);
  if(W.treeLights)W.treeLights.material.color.setScalar(.6+n*2.2+Math.sin(t*3)*.15*n);if(W.partyBulbs)W.partyBulbs.material.color.setScalar(.4+n*2.4);
  W.lens.material.emissiveIntensity=.6+n*4;W.beam.g.rotation.y+=dt*.6;W.beam.m.uniforms.uA.value=sstep(.3,.9,n);
  for(const m of W.snowMats){m.userData.U.uT.value=t;m.userData.U.uSpark.value=inside?0:1-n*.6;}
  W.water.material.userData.U.uT.value=t;colM.uniforms.uT.value=t;
  for(const f of W.anim)f(dt,t);
  if(W.partyG)W.partyG.traverse(o=>{if(o.userData.flicker)o.scale.y=1+Math.sin(t*12+o.position.x)*.15;});
  if(W.balloons)W.balloons.position.y=Math.sin(t*1.2)*.12;
  // spots bob
  for(const k in W.spots){const s=W.spots[k];s.sp.position.y=(s.ly||3.6)+Math.sin(t*2+s.x)*.15;}
  // club floor
  if(W.clubTiles&&sp==='club'){const tl=W.clubTiles;let i=0;const beat=t*2.07;for(let a=0;a<9;a++)for(let b=0;b<8;b++){const v=Math.sin(a*.9+b*.7+beat*PI)*.5+.5,hue=((a+b)*.07+beat*.05)%1;tmpC.setHSL(hue,.85,.2+v*.3).multiplyScalar(.3+v*.6);tl.setColorAt(i++,tmpC);}tl.instanceColor.needsUpdate=true;}
  // coins
  {const m4=new G.Matrix4(),q=new G.Quaternion();W.coins.forEach((c,i)=>{q.setFromAxisAngle(new V3(0,1,0),t*2+i);m4.compose(new V3(c.x,c.y+Math.sin(t*2.5+i)*.25,c.z),q,new V3(1,1,1).multiplyScalar(c.got||inside?0:1));W.coinMesh.setMatrixAt(i,m4);});W.coinMesh.instanceMatrix.needsUpdate=true;}
  // point light pool: nearest emitters in this space
  lightT-=dt;if(lightT<=0){lightT=.25;const list=W.emit.filter(e=>e.space===sp&&(!e.night||n>.15)).map(e=>({e,d:(e.x-focus.x)**2+(e.z-focus.z)**2})).sort((a,b)=>a.d-b.d);
   pts.forEach((p,i)=>{const it=list[i];if(!it||it.d>60*60){p.userData.target=0;return;}p.position.set(it.e.x,it.e.y,it.e.z);p.color.set(it.e.col);p.distance=inside?18:16;p.userData.target=it.e.i*(it.e.night?sstep(.15,.6,n):1);});}
  pts.forEach(p=>{p.intensity=lerp(p.intensity,p.userData.target||0,Math.min(1,dt*4));});};
 W.setShadowQuality=q=>{sun.castShadow=q>0;const s=q>=2?2048:1024;if(sun.shadow.mapSize.x!==s){sun.shadow.mapSize.set(s,s);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}};
 W.PARTIES=PARTIES;return W;}
