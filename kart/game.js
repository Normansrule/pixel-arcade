import * as THREE from './three.module.min.js';

/* ---------- characters ---------- */
const CH=[
 {n:'FOXY',c:0xff7a2a,c2:0xfff3d6,sp:1.0,acc:1.0,w:1.0,d:'balanced',ears:'point',tail:true},
 {n:'CROAK',c:0x3dff8b,c2:0xffe36a,sp:.95,acc:1.15,w:.9,d:'quick off the line',ears:'none'},
 {n:'WADDLE',c:0x1a1a2a,c2:0xffffff,sp:1.05,acc:.9,w:1.0,d:'fast, heavy',ears:'none',beak:true},
 {n:'BAMBOO',c:0xffffff,c2:0x111111,sp:.9,acc:.95,w:1.3,d:'heavyweight, shoves',ears:'round'},
 {n:'THUMPER',c:0xd9c7ff,c2:0xff9ac8,sp:1.02,acc:1.1,w:.75,d:'light, nimble',ears:'long'},
 {n:'SNAPPER',c:0x2a8a3a,c2:0xbfe36a,sp:1.08,acc:.85,w:1.25,d:'top speed king',ears:'none',snout:true},
 {n:'HOOT',c:0x8a5c33,c2:0xffd9a8,sp:.97,acc:1.05,w:.85,d:'great handling',ears:'tuft'},
 {n:'TRUFFLE',c:0xffb0c8,c2:0xff7aa0,sp:.93,acc:1.0,w:1.15,d:'sturdy',ears:'flop',snout:true}];

function makeCritter(ch){
 const g=new THREE.Group();const m=c=>new THREE.MeshStandardMaterial({color:c,roughness:.7});
 const body=new THREE.Mesh(new THREE.SphereGeometry(.42,14,12),m(ch.c));body.scale.set(1,.85,.9);body.position.y=.55;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.34,14,12),m(ch.c));head.position.set(0,1.15,.05);g.add(head);
 const belly=new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),m(ch.c2));belly.position.set(0,.5,.28);belly.scale.set(.9,.9,.5);g.add(belly);
 const em=new THREE.MeshStandardMaterial({color:0x111111});const wm=new THREE.MeshStandardMaterial({color:0xffffff});
 [-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),wm);w.position.set(s*.13,1.22,.32);g.add(w);const e=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),em);e.position.set(s*.13,1.22,.39);g.add(e);});
 if(ch.ears==='point'||ch.ears==='long'||ch.ears==='tuft'){const h=ch.ears==='long'?.5:.25;[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.ConeGeometry(.1,h,8),m(ch.c));e.position.set(s*.2,1.42+h/2,0);e.rotation.z=-s*.25;g.add(e);});}
 if(ch.ears==='round'||ch.ears==='flop'){[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.11,8,8),m(ch.ears==='round'?ch.c2:ch.c));e.position.set(s*.27,ch.ears==='round'?1.42:1.15,0);g.add(e);});}
 if(ch.beak){const b=new THREE.Mesh(new THREE.ConeGeometry(.08,.22,8),m(0xff9838));b.rotation.x=1.57;b.position.set(0,1.1,.42);g.add(b);}
 if(ch.snout){const s=new THREE.Mesh(new THREE.BoxGeometry(.22,.14,.22),m(ch.c2));s.position.set(0,1.05,.42);g.add(s);}
 if(ch.tail){const t=new THREE.Mesh(new THREE.ConeGeometry(.12,.5,8),m(ch.c));t.rotation.x=-1.2;t.position.set(0,.55,-.55);g.add(t);}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}

function makeKart(ch,col){
 const g=new THREE.Group();const m=(c,r)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.5,metalness:.2});
 const body=new THREE.Mesh(new THREE.BoxGeometry(1.1,.32,1.9),m(col));body.position.y=.38;g.add(body);
 const nose=new THREE.Mesh(new THREE.BoxGeometry(.7,.24,.6),m(col));nose.position.set(0,.36,1.1);g.add(nose);
 const seat=new THREE.Mesh(new THREE.BoxGeometry(.7,.3,.5),m(0x222233));seat.position.set(0,.6,-.35);g.add(seat);
 const bumper=new THREE.Mesh(new THREE.BoxGeometry(1.2,.16,.16),m(0x222233));bumper.position.set(0,.3,-1);g.add(bumper);
 const wheels=[];[[-.62,.7],[.62,.7],[-.62,-.7],[.62,-.7]].forEach(p=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.22,14),m(0x151515,.9));w.rotation.z=1.57;w.position.set(p[0],.26,p[1]);g.add(w);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.24,8),m(0xcccccc,.3));hub.rotation.z=1.57;hub.position.copy(w.position);g.add(hub);wheels.push(w);});
 const crit=makeCritter(ch);crit.scale.setScalar(.55);crit.position.set(0,.45,-.3);g.add(crit);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});g.userData.wheels=wheels;g.userData.crit=crit;return g;}

/* ---------- track ---------- */
const CTRL=[[0,0],[60,10],[110,50],[120,110],[80,150],[20,170],[-40,150],[-70,100],[-110,70],[-120,10],[-80,-40],[-20,-30]].map(p=>new THREE.Vector3(p[0],0,p[1]));
const curve=new THREE.CatmullRomCurve3(CTRL,true,'catmullrom',.6);
const hillY=t=>Math.sin(t*6.283*2)*2.5+Math.sin(t*6.283*5+1)*1.2;
const posAt=t=>{const p=curve.getPointAt((t%1+1)%1);p.y=hillY(t);return p;};
const tanAt=t=>curve.getTangentAt((t%1+1)%1).normalize();
const N=400,WID=7;
function buildTrack(scene){
 const road=new THREE.BufferGeometry(),verts=[],uv=[],idx=[],kv=[],kidx=[],kcol=[];
 for(let i=0;i<=N;i++){const t=i/N,p=posAt(t),tg=tanAt(t),n=new THREE.Vector3(-tg.z,0,tg.x);const a=p.clone().addScaledVector(n,WID),b=p.clone().addScaledVector(n,-WID);verts.push(a.x,a.y+.02,a.z,b.x,b.y+.02,b.z);uv.push(0,t*40,1,t*40);
  const ka=p.clone().addScaledVector(n,WID+.9),kb=p.clone().addScaledVector(n,-WID-.9);kv.push(ka.x,ka.y+.06,ka.z,a.x,a.y+.06,a.z,b.x,b.y+.06,b.z,kb.x,kb.y+.06,kb.z);const c=(i>>2)%2?[1,.3,.3]:[1,1,1];kcol.push(...c,...c,...c,...c);
  if(i<N){const o=i*2;idx.push(o,o+1,o+2,o+1,o+3,o+2);const k=i*4;kidx.push(k,k+1,k+4,k+1,k+5,k+4,k+2,k+3,k+6,k+3,k+7,k+6);}}
 road.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));road.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));road.setIndex(idx);road.computeVertexNormals();
 const cv=document.createElement('canvas');cv.width=64;cv.height=256;const x=cv.getContext('2d');x.fillStyle='#3c3c46';x.fillRect(0,0,64,256);x.fillStyle='#4a4a56';for(let i=0;i<300;i++)x.fillRect(Math.random()*64|0,Math.random()*256|0,2,2);x.fillStyle='#e8e8e8';x.fillRect(30,0,4,120);const tex=new THREE.CanvasTexture(cv);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
 const rm=new THREE.Mesh(road,new THREE.MeshStandardMaterial({map:tex,roughness:.95,side:THREE.DoubleSide}));rm.receiveShadow=true;scene.add(rm);
 const kg=new THREE.BufferGeometry();kg.setAttribute('position',new THREE.Float32BufferAttribute(kv,3));kg.setAttribute('color',new THREE.Float32BufferAttribute(kcol,3));kg.setIndex(kidx);kg.computeVertexNormals();const km=new THREE.Mesh(kg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide}));km.receiveShadow=true;scene.add(km);
 // ground with hills following the track
 const gg=new THREE.PlaneGeometry(520,520,80,80);gg.rotateX(-1.57);const pa=gg.attributes.position;for(let i=0;i<pa.count;i++){const px=pa.getX(i),pz=pa.getZ(i);let best=1e9,bt=0;for(let j=0;j<60;j++){const q=posAt(j/60);const d=(q.x-px)**2+(q.z-pz)**2;if(d<best){best=d;bt=j/60;}}for(let dd=-.017;dd<=.017;dd+=.0017){const q=posAt(bt+dd);const d=(q.x-px)**2+(q.z-pz)**2;if(d<best){best=d;var bt2=bt+dd;}}if(bt2!==undefined)bt=bt2;bt2=undefined;const d=Math.sqrt(best);const y=hillY(bt)*Math.max(0,1-d/60)-Math.min(2.5,d/25)+Math.sin(px*.05)*Math.cos(pz*.04)*Math.min(1,d/30)*3;pa.setY(i,y-(d<WID+2?.9:.4));}gg.computeVertexNormals();
 const gm=new THREE.Mesh(gg,new THREE.MeshStandardMaterial({color:0x3f8a3a,roughness:1}));gm.receiveShadow=true;scene.add(gm);
 // scenery: trees, rocks, start arch, banners
 const treeG=new THREE.ConeGeometry(2.2,5,8),trunkG=new THREE.CylinderGeometry(.35,.45,2,6),tm=new THREE.MeshStandardMaterial({color:0x1e8a45,roughness:.9}),tm2=new THREE.MeshStandardMaterial({color:0x25a352,roughness:.9}),bm=new THREE.MeshStandardMaterial({color:0x5b3a1e});
 for(let i=0;i<140;i++){const t=Math.random(),side=Math.random()<.5?1:-1,off=WID+4+Math.random()*30,p=posAt(t),tg=tanAt(t),n=new THREE.Vector3(-tg.z,0,tg.x);const q=p.clone().addScaledVector(n,side*off);let bad=false;for(let j=0;j<60;j++){const r=posAt(j/60);if(r.distanceTo(q)<WID+3){bad=true;break;}}if(bad)continue;
  const g=new THREE.Group();const tr=new THREE.Mesh(trunkG,bm);tr.position.y=1;g.add(tr);const s=.8+Math.random()*.8;const c1=new THREE.Mesh(treeG,i%2?tm:tm2);c1.position.y=4;c1.scale.setScalar(s);g.add(c1);g.position.set(q.x,q.y-.3,q.z);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);}
 const rockG=new THREE.DodecahedronGeometry(1.2,0),rmat=new THREE.MeshStandardMaterial({color:0x8d86b8,roughness:1});for(let i=0;i<30;i++){const t=Math.random(),p=posAt(t),tg=tanAt(t),n=new THREE.Vector3(-tg.z,0,tg.x);const q=p.clone().addScaledVector(n,(Math.random()<.5?1:-1)*(WID+3+Math.random()*10));const r=new THREE.Mesh(rockG,rmat);r.position.set(q.x,q.y+.4,q.z);r.scale.setScalar(.6+Math.random()*1.2);r.rotation.set(Math.random(),Math.random(),0);r.castShadow=true;scene.add(r);}
 const p0=posAt(0),tg0=tanAt(0),n0=new THREE.Vector3(-tg0.z,0,tg0.x);const pm=new THREE.MeshStandardMaterial({color:0xffcf3f});[-1,1].forEach(s=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.6,7,.6),pm);const q=p0.clone().addScaledVector(n0,s*(WID+1.2));post.position.set(q.x,q.y+3.5,q.z);post.castShadow=true;scene.add(post);});const bar=new THREE.Mesh(new THREE.BoxGeometry(WID*2+3,.8,.8),new THREE.MeshStandardMaterial({color:0xff3f8e}));bar.position.set(p0.x,p0.y+7,p0.z);bar.lookAt(p0.clone().add(tg0));bar.castShadow=true;scene.add(bar);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(WID*2,3),new THREE.MeshStandardMaterial({map:(()=>{const c=document.createElement('canvas');c.width=64;c.height=16;const x=c.getContext('2d');for(let i=0;i<8;i++)for(let j=0;j<2;j++){x.fillStyle=(i+j)%2?'#fff':'#000';x.fillRect(i*8,j*8,8,8);}return new THREE.CanvasTexture(c);})()}));fl.rotation.x=-1.57;fl.position.set(p0.x,p0.y+.05,p0.z);fl.rotation.z=Math.atan2(tg0.x,tg0.z);fl.rotateOnWorldAxis(new THREE.Vector3(0,1,0),0);scene.add(fl);
}

/* ---------- game state ---------- */
const canvas=document.getElementById('c'),ui=document.getElementById('ui');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setScissorTest(true);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x8fd0ff);scene.fog=new THREE.Fog(0xa8d8ff,120,300);
const hemi=new THREE.HemisphereLight(0xbfe4ff,0x3f6a3a,.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff4d6,1.6);sun.position.set(80,120,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;sun.shadow.camera.far=400;scene.add(sun);scene.add(sun.target);
// sky dome + clouds
const skyG=new THREE.SphereGeometry(400,16,8);const skyM=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.66,.82,1.),vec3(.25,.45,.95),smoothstep(0.,.6,h));gl_FragColor=vec4(c,1.);}'});const sky=new THREE.Mesh(skyG,skyM);scene.add(sky);
const cloudM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85});for(let i=0;i<24;i++){const g=new THREE.Group();for(let j=0;j<4;j++){const c=new THREE.Mesh(new THREE.SphereGeometry(4+Math.random()*4,8,6),cloudM);c.position.set(j*5-8,Math.random()*2,Math.random()*3);g.add(c);}g.position.set(Math.random()*500-250,45+Math.random()*25,Math.random()*500-250);scene.add(g);}
buildTrack(scene);

const itemG=new THREE.BoxGeometry(1.4,1.4,1.4),itemM=new THREE.MeshStandardMaterial({color:0xffcf3f,emissive:0x664400,metalness:.6,roughness:.2,transparent:true,opacity:.9});
const boxes=[];for(let i=0;i<3;i++)for(let j=-1;j<=1;j++){const t=.12+i*.3,p=posAt(t),tg=tanAt(t),n=new THREE.Vector3(-tg.z,0,tg.x);const m=new THREE.Mesh(itemG,itemM);const q=p.clone().addScaledVector(n,j*4);m.position.set(q.x,q.y+1.2,q.z);m.castShadow=true;scene.add(m);boxes.push({m,t:0});}
const ITEMS=['BOOST','ACORN','PEEL','TRIPLE ACORN','SHIELD','STAR'];
let karts=[],projs=[],humans=1,skill=1,picks=[0,4],state='menu',raceT=0,lapsTotal=3,finished=[];
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Escape')toMenu();if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});addEventListener('keyup',e=>keys[e.code]=false);
const MAPS=[{f:'KeyW',b:'KeyS',l:'KeyA',r:'KeyD',i:'KeyF',d:'ShiftLeft'},{f:'ArrowUp',b:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',i:'Enter',d:'Slash'}];
function pad(i){const g=navigator.getGamepads?navigator.getGamepads()[i]:null;if(!g)return null;return{f:g.buttons[0]?.pressed||g.buttons[7]?.value>.3,b:g.buttons[1]?.pressed||g.buttons[6]?.value>.3,x:Math.abs(g.axes[0])>.15?g.axes[0]:0,i:g.buttons[2]?.pressed,d:g.buttons[5]?.pressed};}

function mkKart(ch,i,human){const col=[0x2fe8d0,0xff3f8e,0xffcf3f,0x4dabff,0xff9838,0xb070ff,0x3dff8b,0xffffff][i];const mesh=makeKart(ch,col);scene.add(mesh);
 const t=-.004*(i+1),p=posAt(t),tg=tanAt(t),n=new THREE.Vector3(-tg.z,0,tg.x);const q=p.clone().addScaledVector(n,(i%2?-1:1)*2.6-(i%4>1?1.3:0));
 return{ch,mesh,i,human,x:q.x,z:q.z,y:q.y,a:Math.atan2(tg.x,tg.z),v:0,steer:0,prog:(t+1)%1,lap:0,item:null,itemT:0,spin:0,boost:0,shield:0,star:0,cd:0,tOff:(Math.random()-.5)*4,ipress:false,fin:0,drift:0,vy:0,air:false};}

function startRace(){karts.forEach(k=>scene.remove(k.mesh));projs.forEach(p=>scene.remove(p.m));karts=[];projs=[];finished=[];const used=new Set();for(let h=0;h<humans;h++){karts.push(mkKart(CH[picks[h]],h,h));used.add(picks[h]);}
 let ci=0;for(let i=humans;i<8;i++){while(used.has(ci))ci++;karts.push(mkKart(CH[ci],i,-1));used.add(ci);}
 raceT=-3.5;state='race';document.getElementById('menu').style.display='none';document.getElementById('results').style.display='none';}
function toMenu(){state='menu';document.getElementById('menu').style.display='flex';document.getElementById('results').style.display='none';ui.innerHTML='';}

/* ---------- physics ---------- */
const tmp=new THREE.Vector3();
function nearestT(k){let t=k.prog,best=1e9,bt=t;for(let d=-.01;d<=.03;d+=.0025){const tt=(t+d+1)%1,p=posAt(tt);const dd=(p.x-k.x)**2+(p.z-k.z)**2;if(dd<best){best=dd;bt=tt;}}return[bt,Math.sqrt(best)];}
function useItem(k){if(!k.item)return;const it=k.item;k.item=null;
 if(it==='BOOST')k.boost=1.4;else if(it==='SHIELD')k.shield=8;else if(it==='STAR'){k.star=6;k.boost=6;}
 else if(it==='PEEL'){const b=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),new THREE.MeshStandardMaterial({color:0xffe36a}));b.scale.y=.5;const bx=k.x-Math.sin(k.a)*2.5,bz=k.z-Math.cos(k.a)*2.5;b.position.set(bx,groundY(bx,bz)+.25,bz);scene.add(b);projs.push({m:b,type:'peel',x:bx,z:bz,life:40,o:k});}
 else{const n=it==='TRIPLE ACORN'?3:1;for(let j=0;j<n;j++){const m=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),new THREE.MeshStandardMaterial({color:0x8a5c33}));scene.add(m);const target=karts.filter(o=>o!==k&&!o.fin).sort((a,b)=>rank(a)-rank(b)).find(o=>rank(o)<rank(k))||null;projs.push({m,type:'acorn',x:k.x+Math.sin(k.a)*2.5,z:k.z+Math.cos(k.a)*2.5,a:k.a,v:38,life:6+j*.6,o:k,target,delay:j*.25});}}}
function groundY(x,z){let best=1e9,bt=0;for(let j=0;j<24;j++){const q=posAt(j/24);const d=(q.x-x)**2+(q.z-z)**2;if(d<best){best=d;bt=j/24;}}for(let d=-.04;d<=.04;d+=.005){const q=posAt(bt+d);const dd=(q.x-x)**2+(q.z-z)**2;if(dd<best){best=dd;bt=bt+d;}}return hillY(bt);}
const rank=k=>-(k.lap+k.prog);const lapNo=k=>Math.max(1,Math.min(k.lap,lapsTotal));
function step(dt){if(state!=='race')return;raceT+=dt;
 const order=karts.slice().sort((a,b)=>rank(a)-rank(b));order.forEach((k,i)=>k.pos=i+1);
 for(const k of karts){if(k.fin){k.v=Math.max(0,k.v-10*dt);}
  let gas=0,steer=0,item=false,drift=false;
  if(raceT>0&&!k.fin){if(k.human>=0){const m=MAPS[k.human],gp=pad(k.human);gas=(keys[m.f]?1:0)-(keys[m.b]?.7:0);steer=(keys[m.l]?1:0)-(keys[m.r]?1:0);item=keys[m.i];drift=keys[m.d];if(gp){if(gp.f)gas=1;if(gp.b)gas=-.7;if(gp.x)steer=-gp.x;if(gp.i)item=true;if(gp.d)drift=true;}}
   else{const look=.012+k.v*.0006,tp=posAt(k.prog+look),tg=tanAt(k.prog+look),n=new THREE.Vector3(-tg.z,0,tg.x);tp.addScaledVector(n,k.tOff*(1+Math.sin(raceT*.3+k.i)*.3));const want=Math.atan2(tp.x-k.x,tp.z-k.z);let da=want-k.a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;steer=Math.max(-1,Math.min(1,da*2.2));gas=1;
    const lead=karts.filter(o=>o.human>=0).reduce((m,o)=>Math.max(m,o.lap+o.prog),0);const behind=(lead-(k.lap+k.prog));k.rubber=[.9,1,1.06][skill]+Math.max(-.08,Math.min(.1,behind*.4));
    if(k.item&&k.cd<=0&&Math.random()<.02*(1+skill)){item=true;}}}
  k.ipress=item&&!k.ipressPrev;k.ipressPrev=item;if(k.ipress&&k.item&&k.cd<=0){useItem(k);k.cd=.6;}k.cd-=dt;
  const ch=k.ch,mult=(k.human>=0?1:(k.rubber||1));const maxV=34*ch.sp*mult*(k.boost>0?1.45:1),acc=22*ch.acc*mult;
  if(k.spin>0){k.spin-=dt;k.v*=.96;k.a+=dt*9;}else{k.v+=gas*acc*dt-(k.v*.7)*dt;k.v=Math.max(-8,Math.min(maxV,k.v));const grip=drift&&Math.abs(steer)>0?1.6:1;k.steer+=(steer*grip-k.steer)*Math.min(1,dt*8);k.a+=k.steer*dt*(1.9+.5*(1-ch.w)+(drift?.6:0))*Math.min(1,Math.abs(k.v)/12)*Math.sign(k.v||1);k.drift=drift&&Math.abs(steer)>.3&&k.v>15?k.drift+dt:0;if(!drift&&k.drift>1.2){k.boost=Math.max(k.boost,.5);}if(!drift)k.drift=0;}
  if(k.boost>0)k.boost-=dt;if(k.shield>0)k.shield-=dt;if(k.star>0)k.star-=dt;
  k.x+=Math.sin(k.a)*k.v*dt;k.z+=Math.cos(k.a)*k.v*dt;const[nt,dist]=nearestT(k);const off=dist>WID+.6;if(off&&k.star<=0){k.v*=Math.pow(.25,dt);}if(dist>WID+18){const p=posAt(nt);k.x+=(p.x-k.x)*dt*2;k.z+=(p.z-k.z)*dt*2;}
  if(nt<k.prog-.5){k.lap++;if(k.lap>lapsTotal&&!k.fin){k.fin=raceT;finished.push(k);}}else if(nt>k.prog+.5){k.lap--;}k.prog=nt;
  const gy=hillY(nt);if(k.y>gy+.05){k.vy-=30*dt;k.y+=k.vy*dt;k.air=true;if(k.y<gy){k.y=gy;k.vy=0;k.air=false;}}else{k.y=gy;k.vy=0;k.air=false;}
  k.mesh.position.set(k.x,k.y,k.z);k.mesh.rotation.y=k.a;const tilt=(hillY(nt+.004)-hillY(nt-.004))/(curve.getLength()*.008);k.mesh.rotation.x=-Math.atan(tilt)*.8;k.mesh.rotation.z=-k.steer*.12+(k.spin>0?Math.sin(raceT*20)*.15:0);k.mesh.userData.wheels.forEach(w=>w.rotation.x+=k.v*dt*3);k.mesh.userData.crit.rotation.y=k.steer*.4;k.mesh.userData.crit.position.y=.45+(k.drift>0?Math.abs(Math.sin(raceT*12))*.15:0);
  if(k.star>0)k.mesh.traverse(o=>{if(o.isMesh&&o.material.emissive)o.material.emissive.setHSL((raceT*2)%1,.8,.3);});else if(k.starWas)k.mesh.traverse(o=>{if(o.isMesh&&o.material.emissive)o.material.emissive.set(0);});k.starWas=k.star>0;
  for(const b of boxes){if(b.t>0){b.t-=dt;b.m.visible=b.t<=0;continue;}if(!k.item&&Math.hypot(b.m.position.x-k.x,b.m.position.z-k.z)<2){b.t=4;b.m.visible=false;k.itemT=1.2;const pos=k.pos||4;const pool=pos<=2?['PEEL','ACORN','ACORN','BOOST']:pos<=5?['ACORN','BOOST','TRIPLE ACORN','SHIELD','PEEL']:['BOOST','TRIPLE ACORN','STAR','SHIELD','BOOST'];k.item=pool[Math.floor(Math.random()*pool.length)];}}
  if(k.itemT>0)k.itemT-=dt;}
 boxes.forEach(b=>{b.m.rotation.y+=dt*2;b.m.rotation.x+=dt;});
 for(let i=0;i<karts.length;i++)for(let j=i+1;j<karts.length;j++){const a=karts[i],b=karts[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<2.2&&d>0){const nx=dx/d,nz=dz/d,ov=(2.2-d)/2,wa=a.ch.w,wb=b.ch.w;a.x-=nx*ov*2*wb/(wa+wb);a.z-=nz*ov*2*wb/(wa+wb);b.x+=nx*ov*2*wa/(wa+wb);b.z+=nz*ov*2*wa/(wa+wb);if(a.star>0&&b.star<=0)b.spin=1;if(b.star>0&&a.star<=0)a.spin=1;const rv=(b.v-a.v);a.v+=rv*.1;b.v-=rv*.1;}}
 for(const p of projs){p.life-=dt;if(p.type==='acorn'){if(p.delay>0){p.delay-=dt;continue;}if(p.target&&!p.target.fin){const want=Math.atan2(p.target.x-p.x,p.target.z-p.z);let da=want-p.a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;p.a+=Math.max(-2.5*dt,Math.min(2.5*dt,da));}p.x+=Math.sin(p.a)*p.v*dt;p.z+=Math.cos(p.a)*p.v*dt;p.m.position.set(p.x,groundY(p.x,p.z)+.6,p.z);p.m.rotation.x+=dt*8;
   const[,dist]=[0,0];}
  for(const k of karts){if(k===p.o&&p.life>(p.type==='acorn'?5.5:39))continue;if(Math.hypot(k.x-p.x,k.z-p.z)<1.6){if(k.shield>0){k.shield=0;}else if(k.star<=0){k.spin=1.1;k.v*=.3;}p.life=0;break;}}}
 projs=projs.filter(p=>{if(p.life<=0){scene.remove(p.m);return false;}return true;});
 if(finished.length&&karts.filter(k=>k.human>=0).every(k=>k.fin)&&raceT-Math.max(...karts.filter(k=>k.human>=0).map(k=>k.fin))>3)showResults();
 const lead=karts[0];sun.position.set(lead.x+80,120,lead.z+40);sun.target.position.set(lead.x,0,lead.z);
}
function showResults(){state='results';const order=karts.slice().sort((a,b)=>(a.fin||1e9)-(b.fin||1e9)||rank(a)-rank(b));document.getElementById('rlist').innerHTML=order.map((k,i)=>`<li style="color:${k.human>=0?'#2fe8d0':'#fff3d6'}">${k.ch.n}${k.human>=0?' (P'+(k.human+1)+')':''} ${k.fin?(k.fin).toFixed(1)+'s':'DNF'}</li>`).join('');document.getElementById('results').style.display='flex';}

/* ---------- render ---------- */
const cams=[0,1].map(()=>new THREE.PerspectiveCamera(60,1,.1,600));
function render(dt){const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==w*renderer.getPixelRatio()|0)renderer.setSize(w,h,false);
 const hum=karts.filter(k=>k.human>=0);const views=state==='menu'?1:hum.length;
 for(let v=0;v<views;v++){const cam=cams[v];let vx=0,vy=0,vw=w,vh=h;if(views===2){vh=h/2;vy=v===0?h/2:0;}cam.aspect=vw/vh;cam.updateProjectionMatrix();
  if(state==='menu'||!hum[v]){const t=(performance.now()*.00002)%1,p=posAt(t),q=posAt(t+.03);cam.position.set(p.x+Math.sin(t*20)*10,p.y+9,p.z+Math.cos(t*20)*10);cam.lookAt(q.x,q.y+1,q.z);}
  else{const k=hum[v],back=8,up=3.6;const tx=k.x-Math.sin(k.a)*back,tz=k.z-Math.cos(k.a)*back;cam.position.lerp(new THREE.Vector3(tx,k.y+up,tz),Math.min(1,dt*6));cam.lookAt(k.x+Math.sin(k.a)*4,k.y+1.2,k.z+Math.cos(k.a)*4);}
  renderer.setViewport(vx,vy,vw,vh);renderer.setScissor(vx,vy,vw,vh);renderer.render(scene,cam);}
 if(state==='race')drawHUD(hum,views,w,h);}
function drawHUD(hum,views,w,h){let html='';hum.forEach((k,v)=>{const top=views===2?(v===0?0:h/2):0,vh=views===2?h/2:h;const pos=k.pos||1,sfx=['ST','ND','RD','TH','TH','TH','TH','TH'][pos-1];
  html+=`<div class="hud big" style="left:16px;top:${top+12}px;color:#ffcf3f">${pos}<span style="font-size:.8rem">${sfx}</span></div><div class="hud" style="left:16px;top:${top+52}px">LAP ${lapNo(k)}/${lapsTotal}</div><div class="hud" style="right:16px;top:${top+12}px">${Math.round(k.v*3.2)} KM/H</div><div class="item" style="right:16px;top:${top+40}px;border-color:${k.itemT>0?'#ffcf3f':'#fff'}">${k.itemT>0?ITEMS[Math.floor(performance.now()/60)%ITEMS.length]:(k.item||'')}</div>`;
  if(k.shield>0)html+=`<div class="hud" style="right:16px;top:${top+104}px;color:#4dabff">SHIELD</div>`;if(k.fin)html+=`<div class="msg" style="top:${top+vh*.4}px">FINISHED ${pos}${sfx}</div>`;
  if(raceT<0)html+=`<div class="msg" style="top:${top+vh*.4}px">${Math.ceil(-raceT)}</div>`;else if(raceT<1)html+=`<div class="msg" style="top:${top+vh*.4}px;color:#3dff8b">GO!</div>`;
  if(k.lap===lapsTotal&&k.prog<.05&&!k.fin)html+=`<div class="hud" style="left:50%;transform:translateX(-50%);top:${top+vh*.2}px;color:#ff3f8e;font-size:1rem">FINAL LAP</div>`;});
 if(views===2)html+=`<div style="position:absolute;left:0;right:0;top:${h/2-2}px;height:4px;background:#07030f"></div>`;ui.innerHTML=html;}

/* ---------- menu ---------- */
const chars=document.getElementById('chars');const thumbR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});thumbR.setSize(180,140,false);thumbR.setClearColor(0x000000,0);
CH.forEach((ch,i)=>{const d=document.createElement('div');d.className='ch'+(i===picks[0]?' p1':i===picks[1]?' p2':'');const cv=document.createElement('canvas');cv.width=180;cv.height=140;d.appendChild(cv);const lb=document.createElement('b');lb.textContent=ch.n;d.appendChild(lb);const li=document.createElement('i');li.textContent=ch.d;d.appendChild(li);d.onclick=e=>{if(e.shiftKey)picks[1]=i;else picks[0]=i;if(picks[0]===picks[1])picks[1]=(i+1)%8;refreshChars();};chars.appendChild(d);
 const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xffffff,0x444466,1.2));const l=new THREE.DirectionalLight(0xffffff,1.5);l.position.set(2,4,3);s.add(l);const k=makeKart(ch,[0x2fe8d0,0xff3f8e,0xffcf3f,0x4dabff,0xff9838,0xb070ff,0x3dff8b,0xffffff][i]);k.rotation.y=-.6;s.add(k);const c=new THREE.PerspectiveCamera(40,180/140,.1,50);c.position.set(2.4,1.8,3.2);c.lookAt(0,.7,0);thumbR.render(s,c);cv.getContext('2d').drawImage(thumbR.domElement,0,0);});
thumbR.dispose();
function refreshChars(){[...chars.children].forEach((d,i)=>d.className='ch'+(i===picks[0]?' p1':i===picks[1]?' p2':''));}
document.querySelectorAll('#players .opt').forEach(b=>b.onclick=()=>{humans=+b.dataset.n;document.querySelectorAll('#players .opt').forEach(x=>x.classList.toggle('on',x===b));});
document.querySelectorAll('#skill .opt').forEach(b=>b.onclick=()=>{skill=+b.dataset.s;document.querySelectorAll('#skill .opt').forEach(x=>x.classList.toggle('on',x===b));});
document.getElementById('go').onclick=startRace;document.getElementById('again').onclick=startRace;
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render(dt);requestAnimationFrame(loop);}
window.KART={startRace,get karts(){return karts;},get state(){return state;},get raceT(){return raceT;},set humans(v){humans=v;},step};
requestAnimationFrame(loop);
