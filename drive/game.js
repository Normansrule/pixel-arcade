import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey} from '../js/fx3d.js';


/* ================= city layout ================= */
const N=8,SP=48,ROAD=14,B=SP-ROAD,WORLD=N*SP;
const rnd=(a=1)=>Math.random()*a,ri=n=>Math.random()*n|0,cl=(v,a,b)=>v<a?a:v>b?b:v;
const blocks=[];for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x0=i*SP+ROAD/2,z0=j*SP+ROAD/2;blocks.push({x0,z0,x1:x0+B,z1:z0+B,park:Math.random()<.12});}

/* ================= renderer ================= */
const canvas=document.getElementById('c');
const R=new THREE.WebGLRenderer({canvas,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;R.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();const SKY=0x070a1c;scene.background=new THREE.Color(SKY);scene.fog=new THREE.FogExp2(SKY,.011);
const cam=new THREE.PerspectiveCamera(62,1,.1,700);
scene.add(new THREE.HemisphereLight(0x5a6aa8,0x100c18,.7));const moon=new THREE.DirectionalLight(0x9ab0ff,.5);moon.position.set(-100,160,-60);scene.add(moon);
// stars + moon
{const g=new THREE.BufferGeometry(),p=[];for(let i=0;i<900;i++){const a=rnd(6.283),e=.15+rnd(1.3),r=500;p.push(Math.cos(a)*Math.cos(e)*r+WORLD/2,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r+WORLD/2);}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));const s=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.4,fog:false}));scene.add(s);
 const m=new THREE.Mesh(new THREE.SphereGeometry(14,20,16),new THREE.MeshBasicMaterial({color:0xfff2d0,fog:false}));m.position.set(-150,220,-120);scene.add(m);}

/* ================= textures ================= */
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const facade=(tint,lit)=>{const base=ctex(256,256,(x,w,h)=>{x.fillStyle=tint;x.fillRect(0,0,w,h);for(let i=0;i<3000;i++){x.fillStyle=`rgba(0,0,0,${rnd(.12)})`;x.fillRect(ri(w),ri(h),2,2);}for(let r=0;r<8;r++)for(let c=0;c<8;c++){x.fillStyle='#0b0d18';x.fillRect(c*32+6,r*32+8,20,16);}x.fillStyle='rgba(0,0,0,.35)';for(let r=0;r<8;r++)x.fillRect(0,r*32+30,w,2);});
 const em=ctex(256,256,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){if(Math.random()<lit){const hue=Math.random();x.fillStyle=hue<.7?`hsl(${40+rnd(15)},90%,${55+rnd(20)}%)`:hue<.85?'#9fd8ff':'#ff9ac8';x.fillRect(c*32+6,r*32+8,20,16);}}});return{base,em};};
const FAC=[facade('#3a3f55',.35),facade('#4a3a48',.3),facade('#2e4048',.4),facade('#55504a',.25)];
const asphalt=ctex(256,256,(x,w,h)=>{x.fillStyle='#1c1d22';x.fillRect(0,0,w,h);for(let i=0;i<6000;i++){const v=ri(40);x.fillStyle=`rgba(${v+30},${v+30},${v+36},.5)`;x.fillRect(ri(w),ri(h),1,1);}});asphalt.repeat.set(WORLD/8,WORLD/8);
const concrete=ctex(128,128,(x,w,h)=>{x.fillStyle='#4a4a52';x.fillRect(0,0,w,h);x.strokeStyle='#3a3a40';for(let i=0;i<=w;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}});
const grass=ctex(128,128,(x,w,h)=>{x.fillStyle='#1e4a26';x.fillRect(0,0,w,h);for(let i=0;i<2000;i++){x.fillStyle=`rgba(${60+ri(40)},${120+ri(60)},${50+ri(30)},.4)`;x.fillRect(ri(w),ri(h),1,2);}});

/* ================= world geometry ================= */
const ground=new THREE.Mesh(new THREE.PlaneGeometry(WORLD+200,WORLD+200),new THREE.MeshStandardMaterial({map:asphalt,roughness:.85,metalness:.1}));ground.rotation.x=-Math.PI/2;ground.position.set(WORLD/2,0,WORLD/2);scene.add(ground);
const walkM=new THREE.MeshStandardMaterial({map:concrete,roughness:.9}),parkM=new THREE.MeshStandardMaterial({map:grass,roughness:1});
const bldMats=FAC.map(f=>new THREE.MeshStandardMaterial({map:f.base,emissiveMap:f.em,emissive:0xffffff,emissiveIntensity:1.1,roughness:.75,metalness:.25}));
const roofM=new THREE.MeshStandardMaterial({color:0x22232c,roughness:.9});const neonCols=[0xff4d00,0x2fe8d0,0xff3f8e,0xffcf3f,0x7a5cff];
const solids=[];
function box(w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);scene.add(m);return m;}
function building(x,z,w,d,h){const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv,nm=g.attributes.normal;for(let i=0;i<uv.count;i++){const ny=Math.abs(nm.getY(i))>.5,nx=Math.abs(nm.getX(i))>.5;const su=ny?w:nx?d:w,sv=ny?d:h;uv.setXY(i,uv.getX(i)*su/16,uv.getY(i)*sv/16);}
 const mats=[0,0,1,1,0,0].map((v,k)=>k===2||k===3?roofM:bldMats[ri(bldMats.length)]);const m=new THREE.Mesh(g,mats);m.position.set(x,h/2+.3,z);scene.add(m);
 if(Math.random()<.45){const nc=neonCols[ri(neonCols.length)];const s=new THREE.Mesh(new THREE.BoxGeometry(w+.2,.35,d+.2),new THREE.MeshBasicMaterial({color:nc}));s.position.set(x,h*.3+rnd(h*.5),z);scene.add(s);}
 if(h>40&&Math.random()<.6){const a=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,8,6),roofM);a.position.set(x,h+4.3,z);scene.add(a);const bl=new THREE.Mesh(new THREE.SphereGeometry(.4,8,6),new THREE.MeshBasicMaterial({color:0xff2030}));bl.position.set(x,h+8.4,z);scene.add(bl);blinkers.push(bl);}}
const blinkers=[],treeG=new THREE.ConeGeometry(2,5,7),trunkG=new THREE.CylinderGeometry(.3,.35,1.6,6),treeM=new THREE.MeshStandardMaterial({color:0x1f6a3a,roughness:.9}),trunkM=new THREE.MeshStandardMaterial({color:0x4a3020});
for(const b of blocks){const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;box(B+3,.3,B+3,walkM,cx,.15,cz);
 if(b.park){box(B-2,.32,B-2,parkM,cx,.16,cz);for(let t=0;t<9;t++){const tx=b.x0+3+rnd(B-6),tz=b.z0+3+rnd(B-6);const tr=new THREE.Mesh(trunkG,trunkM);tr.position.set(tx,1.1,tz);scene.add(tr);const cn=new THREE.Mesh(treeG,treeM);cn.position.set(tx,4,tz);cn.scale.setScalar(.8+rnd(.6));scene.add(cn);}b.solid=false;continue;}
 b.solid=true;solids.push(b);const lots=Math.random()<.4?1:2;const lw=B/lots;for(let a=0;a<lots;a++)for(let c=0;c<lots;c++){const h=lots===1?40+rnd(50):10+rnd(45)*(Math.random()<.2?2:1);building(b.x0+lw*(a+.5),b.z0+lw*(c+.5),lw-2,lw-2,h);}}
// lane markings + crosswalks (instanced)
{const dash=new THREE.InstancedMesh(new THREE.BoxGeometry(3,.05,.25),new THREE.MeshBasicMaterial({color:0xffcf3f}),N*1+1>0?(N+1)*N*6*2:0);let k=0;const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),rot=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);
 for(let l=0;l<=N;l++)for(let seg=0;seg<N;seg++)for(let d=0;d<6;d++){const along=seg*SP+ROAD/2+3+d*5.5;m4.compose(new THREE.Vector3(along,.03,l*SP),q,s);dash.setMatrixAt(k++,m4);m4.compose(new THREE.Vector3(l*SP,.03,along),rot,s);dash.setMatrixAt(k++,m4);}dash.count=k;scene.add(dash);}
// street lights at corners
const lampPos=[];{const poleG=new THREE.CylinderGeometry(.12,.15,7,6),poleM=new THREE.MeshStandardMaterial({color:0x2a2a30,metalness:.6,roughness:.4}),bulbM=new THREE.MeshBasicMaterial({color:0xffd9a0});
 for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){if((i+j)%2)continue;const x=i*SP+ROAD/2+.8,z=j*SP+ROAD/2+.8;const p=new THREE.Mesh(poleG,poleM);p.position.set(x,3.5,z);scene.add(p);const bl=new THREE.Mesh(new THREE.BoxGeometry(1.2,.25,.5),bulbM);bl.position.set(x-.5,7,z-.5);scene.add(bl);lampPos.push(new THREE.Vector3(x-.5,6.8,z-.5));}}
const pl=[];for(let i=0;i<6;i++){const l=new THREE.PointLight(0xffc890,40,28,1.8);scene.add(l);pl.push(l);}

/* ================= cars ================= */
const carPalette=[0xd8d8e0,0x202028,0xb01818,0x1c4ab0,0xe0b020,0x1a7a4a,0x6a2a8a,0xff6a1a];
function makeCar(col,taxi){const g=new THREE.Group(),m=(c,r,me)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.35,metalness:me??.6});
 const body=new THREE.Mesh(new THREE.BoxGeometry(1.9,.6,4.2),m(col));body.position.y=.65;g.add(body);const low=new THREE.Mesh(new THREE.BoxGeometry(1.95,.25,4.3),m(0x15151a,.8,.2));low.position.y=.38;g.add(low);
 const cab=new THREE.Mesh(new THREE.BoxGeometry(1.6,.55,2),m(0x0c1420,.1,.9));cab.position.set(0,1.2,-.2);g.add(cab);const roof=new THREE.Mesh(new THREE.BoxGeometry(1.62,.08,1.7),m(col));roof.position.set(0,1.5,-.25);g.add(roof);
 const hl=new THREE.MeshBasicMaterial({color:0xfff6d8}),tl=new THREE.MeshBasicMaterial({color:0xff1a1a});[-.65,.65].forEach(x=>{const h=new THREE.Mesh(new THREE.BoxGeometry(.45,.16,.05),hl);h.position.set(x,.7,2.12);g.add(h);const t=new THREE.Mesh(new THREE.BoxGeometry(.45,.14,.05),tl);t.position.set(x,.72,-2.12);g.add(t);});
 const wG=new THREE.CylinderGeometry(.38,.38,.3,14),wM=m(0x0a0a0a,.9,0);[[-.95,1.35],[.95,1.35],[-.95,-1.35],[.95,-1.35]].forEach(p=>{const w=new THREE.Mesh(wG,wM);w.rotation.z=Math.PI/2;w.position.set(p[0],.38,p[1]);g.add(w);});
 if(taxi){const s=new THREE.Mesh(new THREE.BoxGeometry(.8,.25,.35),new THREE.MeshBasicMaterial({color:0xffcf3f}));s.position.set(0,1.67,-.3);g.add(s);}scene.add(g);return g;}

/* ================= player ================= */
const P={x:SP/2,z:SP*.5+ROAD/2,a:0,vx:0,vz:0,dmg:100,cash:0,time:60,fares:0,best:0,drift:0};
const car=makeCar(0xffcf3f,true);const beamL=new THREE.SpotLight(0xfff0d0,60,55,.45,.5,1.2);beamL.position.set(0,1,1.5);car.add(beamL);car.add(beamL.target);beamL.target.position.set(0,0,20);
const glowUnder=new THREE.PointLight(0xff4d00,6,6,2);glowUnder.position.set(0,.3,0);car.add(glowUnder);

/* ================= traffic ================= */
let traffic=[];function spawnTraffic(){traffic.forEach(t=>scene.remove(t.g));traffic=[];for(let i=0;i<26;i++){const ax=Math.random()<.5?'x':'z',line=ri(N+1),dir=Math.random()<.5?1:-1;traffic.push({g:makeCar(carPalette[ri(carPalette.length)]),ax,line,along:rnd(WORLD),dir,v:9+rnd(5),cv:10,turnCD:0});}}
const tpos=t=>{const off=t.dir*3.3;return t.ax==='x'?[t.along,t.line*SP+off]:[t.line*SP-off,t.along];};

/* ================= mission ================= */
const beacon=new THREE.Group();{const cyl=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,60,24,1,true),new THREE.MeshBasicMaterial({color:0xff4d00,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false}));cyl.position.y=30;beacon.add(cyl);const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.8,32),new THREE.MeshBasicMaterial({color:0xff4d00,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;beacon.add(ring);
 const ped=new THREE.Group();const pm=new THREE.MeshStandardMaterial({color:0x2fe8d0,roughness:.6});const bd=new THREE.Mesh(new THREE.BoxGeometry(.6,1.1,.35),pm);bd.position.y=1.2;ped.add(bd);const hd=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),new THREE.MeshStandardMaterial({color:0xffd9a8}));hd.position.y=2;ped.add(hd);[-.15,.15].forEach(x=>{const l=new THREE.Mesh(new THREE.BoxGeometry(.2,.7,.2),new THREE.MeshStandardMaterial({color:0x222}));l.position.set(x,.35,0);ped.add(l);});beacon.add(ped);beacon.userData={cyl,ring,ped};}
scene.add(beacon);const arrow=new THREE.Mesh(new THREE.ConeGeometry(.6,1.6,4),new THREE.MeshBasicMaterial({color:0xff4d00}));arrow.rotation.x=Math.PI/2;const arrowG=new THREE.Group();arrowG.add(arrow);scene.add(arrowG);
let mode='pickup',target=new THREE.Vector3(),fareStart=null;
function pickSpot(minD){for(let tr=0;tr<200;tr++){const onX=Math.random()<.5,line=1+ri(N-1),along=SP*ri(N)+ROAD/2+4+rnd(B-8),side=Math.random()<.5?1:-1;const x=onX?along:line*SP+side*(ROAD/2-1.2),z=onX?line*SP+side*(ROAD/2-1.2):along;if(Math.hypot(x-P.x,z-P.z)>=minD)return new THREE.Vector3(x,0,z);}return new THREE.Vector3(SP,0,SP);}
function newPickup(){mode='pickup';target=pickSpot(60);beacon.position.copy(target);setB(0xff4d00,true);}
function setB(c,ped){const u=beacon.userData;u.cyl.material.color.setHex(c);u.ring.material.color.setHex(c);u.ped.visible=ped;arrow.material.color.setHex(c);}

/* ================= input / state ================= */
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyC')camMode^=1;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});addEventListener('keyup',e=>keys[e.code]=false);
let snap=false,state='menu',camMode=0,popT=0,t=0;const $=id=>document.getElementById(id);
function pop(s){$('pop').textContent=s;popT=1.6;}
function reset(){Object.assign(P,{x:SP/2,z:SP+ROAD/2-3.3,a:Math.PI/2,vx:0,vz:0,dmg:100,cash:0,time:60,fares:0,drift:0});spawnTraffic();newPickup();}
function start(){reset();state='play';snap=true;$('menu').style.display='none';$('over').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');}
$('go').onclick=start;$('again').onclick=start;
function end(why){state='over';$('hud').hidden=true;$('over').hidden=false;document.body.classList.remove('playing');$('ototal').textContent='$'+P.cash;$('ostats').textContent=`${why} · ${P.fares} fares`;
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=5+Math.min(40,P.fares*4);localStorage.setItem('pxd_profile',JSON.stringify(pr));const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'drive3d';if(+(localStorage.getItem(k)||0)<P.cash)localStorage.setItem(k,P.cash);}catch(e){}}
$('post').onclick=()=>{let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] drive3d '+P.cash)+'&body='+encodeURIComponent(`Game: Night Drive\nCash: $${P.cash}\nFares: ${P.fares}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`),'_blank');};

/* ================= physics ================= */
function collideBlocks(x,z,r){for(const b of solids){const nx=cl(x,b.x0-1.5,b.x1+1.5),nz=cl(z,b.z0-1.5,b.z1+1.5);const dx=x-nx,dz=z-nz,d=Math.hypot(dx,dz);if(d<r){if(d===0)return{nx:x<(b.x0+b.x1)/2?-1:1,nz:0,pen:r};return{nx:dx/d,nz:dz/d,pen:r-d};}}return null;}
function step(dt){t+=dt;blinkers.forEach((b,i)=>b.visible=Math.sin(t*3+i)>0);if(popT>0)popT-=dt;
 const pr=beacon.userData;pr.ring.scale.setScalar(1+Math.sin(t*4)*.08);pr.ped.rotation.y+=dt;
 if(state!=='play')return;
 P.time-=dt;if(P.time<=0){P.time=0;end('TIME UP');return;}
 const k=keys,thr=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0),str=(k.KeyA||k.ArrowLeft?1:0)-(k.KeyD||k.ArrowRight?1:0),hb=k.Space;
 const fx=Math.sin(P.a),fz=Math.cos(P.a);let fwd=P.vx*fx+P.vz*fz,lat=P.vx*fz-P.vz*fx;
 fwd+=thr*(thr>0?16:24)*dt;if(fwd<0&&thr>=0)fwd+=10*dt;fwd-=fwd*(.35+(hb?1.2:0))*dt;fwd=cl(fwd,-10,46);
 const grip=hb?1.2:7;lat-=lat*Math.min(1,grip*dt);P.drift=Math.abs(lat);
 P.a+=str*dt*cl(fwd/9,-1,1)*(hb?2.6:1.7);
 const nfx=Math.sin(P.a),nfz=Math.cos(P.a);P.vx=nfx*fwd+nfz*lat;P.vz=nfz*fwd-nfx*lat;
 P.x+=P.vx*dt;P.z+=P.vz*dt;P.x=cl(P.x,-10,WORLD+10);P.z=cl(P.z,-10,WORLD+10);
 const hit=collideBlocks(P.x,P.z,1.6);if(hit){P.x+=hit.nx*hit.pen;P.z+=hit.nz*hit.pen;const vn=P.vx*hit.nx+P.vz*hit.nz;if(vn<0){P.vx-=1.6*vn*hit.nx;P.vz-=1.6*vn*hit.nz;const d=Math.abs(vn);if(d>6){P.dmg-=d*.6;pop('CRASH');}}P.vx*=.7;P.vz*=.7;}
 // traffic
 for(const c of traffic){let slow=c.v;const[cx,cz]=tpos(c);for(const o of traffic){if(o===c||o.ax!==c.ax||o.line!==c.line||o.dir!==c.dir)continue;const d=(o.along-c.along)*c.dir;if(d>0&&d<9)slow=Math.min(slow,o.cv*.9);}const pd=Math.hypot(P.x-cx,P.z-cz);const ahead=(c.ax==='x'?(P.x-cx):(P.z-cz))*c.dir;if(pd<10&&ahead>0)slow=Math.min(slow,2);
  c.cv+=(slow-c.cv)*Math.min(1,dt*2);const prev=c.along;c.along+=c.dir*c.cv*dt;if(c.turnCD>0)c.turnCD-=dt;
  const cross=Math.floor(prev/SP)!==Math.floor(c.along/SP)||(c.along<0||c.along>WORLD);if(cross&&c.turnCD<=0){const node=Math.round(c.along/SP);if(node<0||node>N||Math.random()<.45){c.ax=c.ax==='x'?'z':'x';const nl=cl(node,0,N);c.along=c.line*SP;c.line=nl;c.dir=c.along<=0?1:c.along>=WORLD?-1:(Math.random()<.5?1:-1);c.turnCD=1;}}
  if(c.along<-20||c.along>WORLD+20){c.dir*=-1;}
  const[nx,nz]=tpos(c);const yaw=c.ax==='x'?(c.dir>0?Math.PI/2:-Math.PI/2):(c.dir>0?0:Math.PI);c.g.position.set(nx,0,nz);c.g.rotation.y+=((yaw-c.g.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI)*Math.min(1,dt*8);
  const dx=P.x-nx,dz=P.z-nz,d=Math.hypot(dx,dz);if(d<2.6&&d>0){const n=[dx/d,dz/d];P.x+=n[0]*(2.6-d);P.z+=n[1]*(2.6-d);const rel=Math.hypot(P.vx,P.vz);if(rel>7){P.dmg-=rel*.5;pop('CRASH');}P.vx=n[0]*6;P.vz=n[1]*6;c.cv=0;}}
 if(P.dmg<=0){P.dmg=0;end('WRECKED');return;}
 // mission
 const spd=Math.hypot(P.vx,P.vz)*3.6,dT=Math.hypot(target.x-P.x,target.z-P.z);
 if(dT<5&&spd<18){if(mode==='pickup'){mode='drop';fareStart=new THREE.Vector3(P.x,0,P.z);target=pickSpot(110);beacon.position.copy(target);setB(0x3dff8b,false);P.time+=8;pop('PASSENGER IN · GO!');}else{const dist=fareStart.distanceTo(target),fare=Math.round(15+dist*.25+P.dmg/10);P.cash+=fare;P.fares++;P.time+=Math.round(6+dist/25);pop('+$'+fare);newPickup();}}
 // lights near car
 const near=lampPos.map(p=>[p,(p.x-P.x)**2+(p.z-P.z)**2]).sort((a,b)=>a[1]-b[1]).slice(0,pl.length);near.forEach((n,i)=>pl[i].position.copy(n[0]));
 car.position.set(P.x,0,P.z);car.rotation.y=P.a;car.rotation.z=cl(-lat*.02,-.08,.08);
 arrowG.position.set(P.x,3.2,P.z);arrowG.lookAt(target.x,3.2,target.z);}

/* ================= camera + HUD ================= */
const camPos=new THREE.Vector3(),look=new THREE.Vector3();const mini=$('mini').getContext('2d');
function updateCam(dt){if(state==='menu'){const a=t*.05;camPos.set(WORLD/2+Math.cos(a)*170,70,WORLD/2+Math.sin(a)*170);cam.position.copy(camPos);cam.lookAt(WORLD/2,10,WORLD/2);return;}
 const back=camMode?22:9,up=camMode?16:3.6,fx=Math.sin(P.a),fz=Math.cos(P.a);const want=new THREE.Vector3(P.x-fx*back,up,P.z-fz*back);if(snap){cam.position.copy(want);snap=false;}else cam.position.lerp(want,Math.min(1,dt*5));look.set(P.x+fx*6,1.2,P.z+fz*6);cam.lookAt(look);const spd=Math.hypot(P.vx,P.vz);cam.fov=62+Math.min(18,spd*.4);cam.updateProjectionMatrix();}
function hud(){if($('hud').hidden)return;$('cash').textContent='$'+P.cash;$('time').textContent=Math.ceil(P.time);$('time').style.color=P.time<10?'#ff4d00':'';$('spd').textContent=Math.round(Math.hypot(P.vx,P.vz)*3.6);$('dmg').firstChild.style.width=P.dmg+'%';$('fare').textContent=mode==='pickup'?'FIND THE PASSENGER':'DRIVE TO THE GREEN MARK';$('pop').style.opacity=popT>0?1:0;
 const s=.55,cx=90,cy=90;mini.clearRect(0,0,180,180);mini.save();mini.beginPath();mini.arc(cx,cy,89,0,7);mini.clip();mini.fillStyle='#0a0a10';mini.fillRect(0,0,180,180);mini.translate(cx,cy);mini.rotate(P.a+Math.PI);mini.translate(-P.x*s,-P.z*s);
 mini.fillStyle='#2a2a34';for(let l=0;l<=N;l++){mini.fillRect(-20*s,l*SP*s-ROAD/2*s,(WORLD+40)*s,ROAD*s);mini.fillRect(l*SP*s-ROAD/2*s,-20*s,ROAD*s,(WORLD+40)*s);}
 traffic.forEach(c=>{const[x,z]=tpos(c);mini.fillStyle='#8a8a9a';mini.fillRect(x*s-1.5,z*s-1.5,3,3);});mini.fillStyle=mode==='pickup'?'#ff4d00':'#3dff8b';mini.beginPath();mini.arc(target.x*s,target.z*s,5,0,7);mini.fill();mini.restore();
 mini.fillStyle='#ffcf3f';mini.beginPath();mini.moveTo(cx,cy-7);mini.lineTo(cx-5,cy+5);mini.lineTo(cx+5,cy+5);mini.fill();}

const POST={exposure:1.15,bloom:1.05,bloomThreshold:.55,bloomRadius:.65,vignette:.42,saturation:1.15,ao:false};let fx=cinematic(R,scene,cam,POST);bindQualityKey(()=>fx.q,()=>{fx=cinematic(R,scene,cam,POST);fx.setSize(innerWidth,innerHeight);});
function resize(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();fx.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
spawnTraffic();newPickup();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);if(state==='menu')stepTrafficOnly(dt);updateCam(dt);hud();fx.render();requestAnimationFrame(loop);}
function stepTrafficOnly(dt){const s=state;state='play';const saved={...P};P.time=999;P.x=-999;P.z=-999;try{for(const c of traffic){c.along+=c.dir*c.v*dt;if(c.along<0||c.along>WORLD)c.dir*=-1;const[nx,nz]=tpos(c);c.g.position.set(nx,0,nz);c.g.rotation.y=c.ax==='x'?(c.dir>0?Math.PI/2:-Math.PI/2):(c.dir>0?0:Math.PI);}}finally{Object.assign(P,saved);state=s;}}
requestAnimationFrame(loop);
window.DRIVE={step,P,start,updateCam,get state(){return state;},get mode(){return mode;},get target(){return target;},get traffic(){return traffic;},keys};
