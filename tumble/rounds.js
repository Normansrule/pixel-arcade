// TUMBLE ROYALE — the rounds: course builders (geometry + colliders + moving obstacles) and per-round rules data.
import * as THREE from '../vendor/three.module.min.js';
import {mkBox,mkCyl,scratch,makeHex,Ball,G as GRAV,buildBins} from './physics.js';
import {rbox,merge,M,toyMat,ctex,CZ} from './models.js';
const V=THREE.Vector3,Q=THREE.Quaternion,YA=new V(0,1,0),XA=new V(1,0,0),ZA=new V(0,0,1),rnd=(a=1)=>Math.random()*a,TAU=Math.PI*2;

export function makeWorld(){return{cols:[],movers:[],hex:null,seesaws:[],balls:[],t:0};}

/* ---------- builder context ---------- */
function Ctx(scene,mats,W){const grp=new THREE.Group();scene.add(grp);const stat={};
 const c={grp,W,mats,
  add(geo,m,key){(stat[key]=stat[key]||[]).push([geo,m]);},
  block(x,y,z,w,h,d,key,o={}){const q=new Q().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0));const m=new THREE.Matrix4().compose(new V(x,y,z),q,new V(1,1,1));
   if(key)c.add(rbox(w,h,d,o.r??Math.min(.35,h*.32,w*.3,d*.3)),m,key);if(o.col===false)return null;const col=mkBox(new V(x,y,z),new V(w/2,h/2,d/2),Object.assign({q},o.cp||{}));W.cols.push(col);return col;},
  floor(x,z0,z1,w,key,y=0,th=1.2,o){return c.block(x,y-th/2,(z0+z1)/2,w,th,z1-z0,key,o);},
  // a slab from (z0,y0) to (z1,y1); dir 'x' makes it run along x instead
  ramp(x,z0,z1,y0,y1,w,key,o={}){const th=o.th??1.2,dz=z1-z0,dy=y1-y0,L=Math.hypot(dz,dy),a=Math.atan2(dy,dz);const n=new V(0,Math.cos(a),-Math.sin(a));if(n.y<0)n.negate();
   const mid=new V(x,(y0+y1)/2,(z0+z1)/2).addScaledVector(n,-th/2);if(o.dir==='x'){const t=mid.x;mid.x=mid.z;mid.z=t+(o.cz||0);mid.x+=o.cx||0;}
   const eu=o.dir==='x'?new THREE.Euler(0,0,a):new THREE.Euler(-a,0,0);const col=c.block(mid.x,mid.y,mid.z,o.dir==='x'?L:w,th,o.dir==='x'?w:L,key,{rx:eu.x,rz:eu.z,r:.3,cp:o.cp});
   if(o.rails)for(const s of[-1,1]){const rm=new V(s*(w/2+.3),0,0).add(mid).addScaledVector(n,th/2+.45);c.block(rm.x,rm.y,rm.z,.6,.9,L,'side',{rx:eu.x,r:.25});}return col;},
  cyl(x,y,z,r,h,key,o={}){const g=new THREE.CylinderGeometry(r,r,h,o.seg||40);if(key)c.add(g,M(x,y,z),key);if(o.col===false)return null;const col=mkCyl(new V(x,y,z),r,h/2,o.cp||{});W.cols.push(col);return col;},
  mover(vis,col,pose,o={}){col.pose=pose;col.vis=vis;col.visPiv=!!o.piv;col.danger=o.danger||'';col.scr=scratch(col);if(o.knock)col.knock=o.knock;grp.add(vis);W.cols.push(col);W.movers.push(col);pose(0,col);col.qi.copy(col.q).invert();return col;},
  mesh(geo,key,cast=true){const m=new THREE.Mesh(geo,typeof key==='string'?mats[key]:key);m.castShadow=cast;m.receiveShadow=true;return m;},
  deco(geo,m,key){c.add(geo,m,key);},
  finish(){for(const k in stat){const m=new THREE.Mesh(merge(stat[k]),mats[k]);m.castShadow=true;m.receiveShadow=true;grp.add(m);}},
  dispose(){scene.remove(grp);grp.traverse(o=>{if(o.geometry)o.geometry.dispose();});}};
 return c;}

/* ---------- obstacle kit ---------- */
function spinBar(c,cx,cy,cz,len,th,ang,rate,key,danger='low'){const col=mkBox(new V(cx,cy,cz),new V(len/2,th/2,th/2));const vis=c.mesh(rbox(len,th,th,th*.48),key);
 const g=new THREE.Group();g.add(vis);const cap=c.mesh(new THREE.CylinderGeometry(th*.9,th*.9,th*1.3,20),'white');g.add(cap);
 return c.mover(g,col,(t,o)=>{o.c.set(cx,cy,cz);o.q.setFromAxisAngle(YA,ang(t));o.v.set(0,0,0);o.w.set(0,rate(t),0);o.piv.set(cx,cy,cz);},{danger});}
// arm that sweeps from a hub out to radius r1 (centre of the bar sits at (r0+r1)/2)
function sweepArm(c,cx,cy,cz,r0,r1,th,ang,rate,key,danger){const half=(r1-r0)/2,mid=(r0+r1)/2;const col=mkBox(new V(),new V(half,th/2,th/2));const vis=c.mesh(rbox(half*2,th,th,th*.48),key);
 return c.mover(vis,col,(t,o)=>{const a=ang(t);o.c.set(cx+Math.sin(a)*mid,cy,cz+Math.cos(a)*mid);o.q.setFromAxisAngle(YA,a-Math.PI/2);o.v.set(0,0,0);o.w.set(0,rate(t),0);o.piv.set(cx,cy,cz);},{danger});}
function pendulum(c,px,py,pz,L,amp,per,ph,key='pink'){const head=2.3;const col=mkBox(new V(),new V(head/2,head/2,head*.42));const g=new THREE.Group();
 const rod=c.mesh(new THREE.CylinderGeometry(.14,.14,L,10),'white');rod.position.y=-L/2;const hm=c.mesh(rbox(head,head,head*.84,.5),key);hm.position.y=-L;const band=c.mesh(new THREE.CylinderGeometry(head*.36,head*.36,head*.9,24),'yellow');band.rotation.x=Math.PI/2;band.position.y=-L;g.add(rod,hm,band);
 const k=TAU/per;return c.mover(g,col,(t,o)=>{const a=amp*Math.sin(k*t+ph),da=amp*k*Math.cos(k*t+ph);o.piv.set(px,py,pz);o.q.setFromAxisAngle(ZA,a);o.c.set(0,-L,0).applyQuaternion(o.q).add(o.piv);o.v.set(0,0,0);o.w.set(0,0,da);},{piv:true,danger:'tall'});}
function puncher(c,side,z,y,reach,per,ph,edge){const col=mkBox(new V(),new V(.7,.85,1.25));const g=new THREE.Group();const fist=c.mesh(rbox(1.4,1.7,2.5,.55),'bump');const rod=c.mesh(new THREE.CylinderGeometry(.22,.22,6,10),'white');rod.rotation.z=Math.PI/2;rod.position.x=side*3.6;g.add(fist,rod);
 return c.mover(g,col,(t,o)=>{const u=((t/per+ph)%1+1)%1;let e,ve;if(u<.12){e=reach*u/.12;ve=reach/(.12*per);}else if(u<.45){e=reach;ve=0;}else{e=reach*(1-(u-.45)/.55);ve=-reach/(.55*per);}
  o.c.set(side*(edge-e),y,z);o.q.identity();o.v.set(-side*ve,0,0);o.w.set(0,0,0);o.piv.copy(o.c);},{danger:'tall',knock:5});}
function disc(c,cx,cy,cz,r,rate,key,fins){const col=mkCyl(new V(cx,cy,cz),r,.5);const g=new THREE.Group();const m=c.mesh(new THREE.CylinderGeometry(r,r,1,48),key);g.add(m);const rim=c.mesh(new THREE.TorusGeometry(r,.18,8,64),'yellow');rim.rotation.x=Math.PI/2;rim.position.y=.5;g.add(rim);
 c.mover(g,col,(t,o)=>{o.c.set(cx,cy,cz);o.q.setFromAxisAngle(YA,rate*t);o.v.set(0,0,0);o.w.set(0,rate,0);o.piv.set(cx,cy,cz);});
 for(let i=0;i<fins;i++){const ph=i/fins*TAU,fc=mkBox(new V(),new V(.28,.95,(r-1.2)/2));const fv=c.mesh(rbox(.56,1.9,r-1.2,.26),'cyan');const rr=(r-1.2)/2+.8;
  c.mover(fv,fc,(t,o)=>{const a=rate*t+ph;o.c.set(cx+Math.sin(a)*rr,cy+.5+.95,cz+Math.cos(a)*rr);o.q.setFromAxisAngle(YA,a);o.v.set(0,0,0);o.w.set(0,rate,0);o.piv.set(cx,cy,cz);},{danger:'tall',knock:7});}}
function slider(c,x0,amp,y,z,per,ph,rx,size=[3,1.6,1.6]){const col=mkBox(new V(),new V(size[0]/2,size[1]/2,size[2]/2),{q:new Q().setFromAxisAngle(XA,rx)});const vis=c.mesh(rbox(...size,.4),'orange');const k=TAU/per;
 return c.mover(vis,col,(t,o)=>{o.c.set(x0+amp*Math.sin(k*t+ph),y,z);o.q.setFromAxisAngle(XA,rx);o.v.set(amp*k*Math.cos(k*t+ph),0,0);o.w.set(0,0,0);o.piv.copy(o.c);},{danger:'tall',knock:5.5});}
function bumper(c,x,y,z,r=.85){c.cyl(x,y+.8,z,r,1.6,'bump',{cp:{bounce:1.15,tag:'bumper'}});c.deco(new THREE.TorusGeometry(r+.02,.12,8,24),M(x,y+1.62,z,Math.PI/2),'white');}
function arch(c,z,y,w,label='FINISH'){const h=6.5;for(const s of[-1,1]){c.block(s*(w/2+.6),y+h/2,z,1.2,h,1.2,'yellow',{r:.5});}c.block(0,y+h+.6,z,w+2.6,1.4,1.3,'pink',{col:false,r:.5});
 const tex=ctex(1024,128,(x,W,Ht)=>{for(let i=0;i<32;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#fff':'#23243a';x.fillRect(i*32,j*32,32,32);}x.fillStyle='#ff4f9a';x.fillRect(300,10,424,108);x.fillStyle='#fff';x.font='88px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,512,68);},{clamp:true});
 const ban=new THREE.Mesh(new THREE.PlaneGeometry(w,w/8),new THREE.MeshStandardMaterial({map:tex,roughness:.6,side:THREE.DoubleSide}));ban.position.set(0,y+h-.45-w/16,z-.05);ban.rotation.y=Math.PI;c.grp.add(ban);
 c.block(0,y+.02,z,w,.06,1.6,'check',{col:false,r:.02});}
function startPad(c,w,key,z0=-13,z1=4){c.floor(0,z0,z1,w,key);c.block(0,1.2,z0-.3,w,2.4,.6,'side');for(const s of[-1,1])c.block(s*(w/2+.3),1.2,(z0+z1)/2,.6,2.4,z1-z0,'side');
 const gate=mkBox(new V(0,1.6,z1-.3),new V(w/2,1.6,.2));c.W.cols.push(gate);const vis=c.mesh(rbox(w,3.2,.4,.18),'pink');vis.position.copy(gate.c);c.grp.add(vis);
 for(const s of[-1,1])c.block(s*(w/2+.5),2.2,z1-.3,1,4.4,1,'yellow',{r:.4});return{col:gate,vis,y0:1.6};}
function rails(c,z0,z1,y,w){for(const s of[-1,1])c.block(s*(w/2+.3),y+.45,(z0+z1)/2,.6,.9,z1-z0,'side',{r:.25});}
function grid(n,cx,cz,cols,dx,dz,y=0,yaw=0){const out=[];for(let i=0;i<n;i++){const r=i/cols|0,k=i%cols;out.push([cx+(k-(cols-1)/2)*dx+(r%2?dx*.5:0)+rnd(.2)-.1,y,cz-r*dz,yaw]);}return out.sort(()=>Math.random()-.5);}
function ring(n,cx,cz,r0,r1,y=0){const out=[];for(let i=0;i<n;i++){const a=i/n*TAU+rnd(.2),r=r0+(r1-r0)*((i*7)%5)/4;const x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r;out.push([x,y,z,Math.atan2(cx-x,cz-z)]);}return out;}
const raceIntro=(fz,fy)=>[[7,fy+7,fz+12,0,fy+1,fz-6],[-10,fy+8,fz*.72,0,fy*.6+1,fz*.5],[10,7,fz*.4,0,1,fz*.18],[-6,5,fz*.12,0,1,-2],[0,4.2,-17,0,1.4,-2]];
const arenaIntro=(y=0)=>[[0,y+16,CZ+26,0,y,CZ],[20,y+10,CZ+6,0,y,CZ],[6,y+8,CZ-18,0,y,CZ],[0,y+5.5,CZ-16,0,y+1,CZ]];

/* ================= ROUND DEFINITIONS ================= */
export const ROUNDS={
 /* ---- race: spinning sweepers, turntables, hammers, punchers ---- */
 spin:{name:'WHIRL WAY',kind:'race',time:120,tag:'RACE',desc:'Hop the spinning sweepers, ride the turntables, dodge the hammers and punching gloves. First to the line qualify!',
  build(c){const gate=startPad(c,24,'floor');c.floor(0,4,38,14,'floor2');
   for(const s of[-1,1])c.block(s*7.2,.12,21,.5,.25,34,'side',{col:false,r:.12});
   [9,19,29].forEach((z,i)=>{c.cyl(0,.95,z,.5,1.9,'white');const r=i%2?-1.5:1.55,a0=i*1.1;spinBar(c,0,.6,z,14.6,.5,t=>a0+r*t,()=>r,i%2?'bar2':'bar');});
   c.floor(0,37.5,40.6,6,'floor');disc(c,0,-.5,47,7,.55,'floor3',2);c.floor(0,53.6,56.6,5,'floor');disc(c,0,-.5,63,7,-.6,'floor2',3);c.floor(0,69.5,72.6,6,'floor');
   c.floor(0,72,96,12,'floor3');[78,85,92].forEach((z,i)=>{pendulum(c,0,9.4,z,7.7,1.05,2.9,i*2.1,i%2?'orange':'pink');for(const s of[-1,1])c.block(s*6.9,4.9,z,.8,9.8,.8,'white',{r:.3});c.block(0,10,z,14.6,.9,.9,'yellow',{col:false,r:.35});});
   c.floor(0,96,118,16,'floor');[[101,-1],[106,1],[111,-1],[115.5,1]].forEach(([z,s],i)=>{c.block(s*8.7,1.3,z,1.4,2.6,3.2,'wall');puncher(c,s,z,.95,5.6,2.6,i*.27,8.7);});
   bumper(c,2.8,0,103.5);bumper(c,-2.6,0,108.6);bumper(c,1.5,0,113.4);
   c.ramp(0,118,126,0,2.5,16,'floor2');c.floor(0,126,144,20,'floor',2.5);arch(c,128,2.5,20);
   return{gate,finishZ:128,finishY:2.5,killY:-8,spawns:n=>grid(n,0,-2.5,6,1.9,1.9),
    cps:[{z:-6,x:8,y:0},{z:36.5,x:5,y:0},{z:73.5,x:4.5,y:0},{z:97.5,x:5.5,y:0}],
    path:[{z:4,w:5},{z:37.6,w:4.5},{z:40.6,w:1.8},{z:47,w:2.6},{z:53.6,w:1.6},{z:56.6,w:1.6},{z:63,w:2.6},{z:69.5,w:2},{z:72.6,w:2},{z:96,w:4},{z:118,w:5},{z:127,w:6},{z:136,w:6}],
    intro:raceIntro(128,2.5)};}},
 /* ---- race: rows of doors, some are fakes ---- */
 doors:{name:'DOOR DECOY',kind:'race',time:120,tag:'RACE',desc:'Five walls of doors. Some burst open, some are solid fakes. Pick fast, follow the crowd... or trust your luck!',
  build(c){const gate=startPad(c,24,'floor');c.floor(0,4,48,22,'floor');c.floor(0,48,92,22,'floor2');c.floor(0,92,138,22,'floor3');
   for(const s of[-1,1])c.block(s*11.6,1.7,71,1.2,3.4,134,'wall');c.block(0,1.7,138.6,24.4,3.4,1.2,'wall');
   const rows=[];[[14,6,3],[28,6,3],[42,5,2],[56,5,2],[70,5,2],[84,4,2],[98,4,1],[112,4,1]].forEach(([z,N,real],ri)=>{const dw=(22-(N+1)*.6)/N;c.block(0,5.4,z,22,4,.7,'wall',{r:.3});
    const ids=[...Array(N).keys()].sort(()=>Math.random()-.5).slice(0,real);const doors=[];
    for(let i=0;i<=N;i++)c.block(-11+.3+i*(dw+.6),1.7,z,.6,3.4,.7,'white',{r:.22});
    for(let i=0;i<N;i++){const x=-11+.6+dw/2+i*(dw+.6);const col=mkBox(new V(x,1.7,z),new V(dw/2-.04,1.68,.22),{bounce:.5});col.real=ids.includes(i);col.x=x;col.row=ri;col.hp=.22;if(col.real)col.bounce=.05;
     const g=new THREE.Group();g.position.set(x,0,z);const m=c.mesh(rbox(dw-.1,3.36,.44,.16),'door');m.position.y=1.68;g.add(m);const knob=c.mesh(new THREE.SphereGeometry(.16,10,8),'yellow');knob.position.set(dw*.32,1.6,-.28);g.add(knob);
     const star=c.mesh(new THREE.TorusGeometry(.45,.12,8,20),'white',false);star.position.set(0,2.4,-.24);g.add(star);c.grp.add(g);col.vis=g;col.door=true;
     col.touch=(b,col,n,s)=>{if(n.z>-.4)return;if(col.real){col.hp-=1/120*(s===1?1:.5);col.wob=Math.max(col.wob||0,.35);if(!col.broken&&col.hp<=0){col.broken=true;col.on=false;col.bt=0;col.hitV=Math.max(4,b.v.z);c.onDoor&&c.onDoor(col,b,true);}}else{col.knownFake=true;col.wob=1;const fresh=b.lastFake!==col||c.W.t-(b.lastFakeT||0)>.9;b.lastFake=col;if(fresh){b.lastFakeT=c.W.t;c.onDoor&&c.onDoor(col,b,false);}}};
     c.W.cols.push(col);doors.push(col);}rows.push({z,doors});});
   c.ramp(0,18,20.5,0,1,22,'floor2');c.floor(0,20.5,22,22,'floor2',1);c.ramp(0,22,24.5,1,0,22,'floor2');
   for(const[z,dir]of[[35,1],[63,-1],[91,1]])for(const s of[-1,1]){const x=s*5.6,r=dir*s*1.6;c.cyl(x,.95,z,.45,1.9,'white');spinBar(c,x,.6,z,9.6,.46,t=>r*t+s,()=>r,s>0?'bar':'bar2');}
   bumper(c,-6,0,48);bumper(c,5,0,50);bumper(c,0,0,77);bumper(c,-7,0,78);bumper(c,7,0,79);bumper(c,-4,0,105);bumper(c,4,0,106);bumper(c,0,0,119);
   arch(c,126,0,22);
   return{gate,rows,finishZ:126,finishY:0,killY:-8,spawns:n=>grid(n,0,-2.5,6,1.9,1.9),
    cps:[{z:-6,x:8,y:0},{z:17,x:9,y:0},{z:31,x:9,y:0},{z:45,x:9,y:0},{z:59,x:9,y:0},{z:73,x:9,y:0},{z:87,x:9,y:0},{z:101,x:9,y:0},{z:115,x:9,y:0}],
    update(t,dt){for(const r of rows)for(const d of r.doors){if(d.broken&&d.bt<2){d.bt+=dt;const k=Math.min(1,d.bt*2.2);d.vis.rotation.x=k*k*1.5;d.vis.position.y=-Math.max(0,d.bt-.6)*1.2;d.vis.visible=d.bt<1.8;}
     if(d.wob>0){d.wob=Math.max(0,d.wob-dt*2.5);d.vis.rotation.z=Math.sin(d.wob*30)*d.wob*.05;}}},
    intro:raceIntro(126,0)};}},
 /* ---- race: tilting see-saws ---- */
 tilt:{name:'TILT TRACK',kind:'race',time:120,tag:'RACE',desc:'Giant see-saws tip under every bean that stands on them. Keep to the high side and don\'t slide off!',
  build(c){const gate=startPad(c,20,'floor');c.floor(0,3.9,5.6,8,'floor');const rows=[];
   const plan=[[12.5,[[0,10]]],[31.5,[[-4.7,8.6],[4.7,8.6]]],[50.5,[[0,9]]],[69.5,[[-4.7,8.6],[4.7,8.6]]]];
   plan.forEach(([z,boards],ri)=>{const row={z,boards:[]};for(const[x,w]of boards){const col=mkBox(new V(x,-.3,z),new V(w/2,.3,7),{slip:1});const vis=new THREE.Group();const m=c.mesh(rbox(w,.6,14,.25),ri%2?'floor3':'floor2');vis.add(m);
     const stripe=c.mesh(new THREE.BoxGeometry(.5,.62,14),'yellow');vis.add(stripe);vis.position.copy(col.c);c.grp.add(vis);col.vis=vis;
     const sw={col,ang:0,angV:0,axis:ZA,k:.4,spring:1.4,damp:2.2,max:.4};c.W.cols.push(col);c.W.seesaws.push(sw);row.boards.push({x,w,sw});
     c.deco(new THREE.CylinderGeometry(.5,1.6,2.6,3),M(x,-1.9,z,0,0,0),'purple');c.deco(new THREE.CylinderGeometry(.35,.35,14.4,12),M(x,-.62,z,Math.PI/2),'white');}
    rows.push(row);if(ri<3)c.floor(0,z+7,z+12,14,'floor');});
   c.floor(0,76.5,100,18,'floor');arch(c,88,0,18);
   return{gate,rows,finishZ:88,finishY:0,killY:-8,spawns:n=>grid(n,0,-2.5,6,1.9,1.9),
    cps:[{z:-6,x:7,y:0},{z:22,x:5,y:0},{z:41,x:5,y:0},{z:60,x:5,y:0},{z:79,x:6,y:0}],
    path:[{z:4,w:3},{z:5.6,w:1.5},{z:12.5,row:0,w:1.4},{z:19.5,row:0,w:1.4},{z:22,w:3},{z:24.5,w:2},{z:31.5,row:1,w:1.2},{z:38.5,row:1,w:1.2},{z:41,w:3},{z:43.5,w:2},{z:50.5,row:2,w:1.2},{z:57.5,row:2,w:1.2},{z:60,w:3},{z:62.5,w:2},{z:69.5,row:3,w:1.2},{z:76.5,row:3,w:1.2},{z:84,w:5},{z:94,w:5}],
    intro:raceIntro(88,0)};}},
 /* ---- race: climb while the goo rises ---- */
 goo:{name:'GOO RISE',kind:'race',time:120,tag:'RACE',goo:true,desc:'Climb the slopes past boulders, hammers and sliders. The goo is rising behind you, and it eliminates!',
  build(c){const gate=startPad(c,16,'floor');c.ramp(0,4,22,0,5,14,'floor2',{rails:true});c.floor(0,22,30,14,'floor',5);rails(c,22,30,5,14);
   c.cyl(0,5.95,26,.5,1.9,'white');spinBar(c,0,5.6,26,13.4,.5,t=>1.4*t,()=>1.4,'bar');
   c.ramp(0,30,50,5,10,12,'floor3',{rails:true});c.floor(0,50,58,14,'floor',10);rails(c,50,58,10,14);pendulum(c,0,19.6,54,7.7,1.1,2.7,0,'pink');for(const s of[-1,1])c.block(s*7.6,14.8,54,.8,9.6,.8,'white',{r:.3});c.block(0,20,54,16,.9,.9,'yellow',{col:false,r:.35});
   const a3=Math.atan2(5,20);c.ramp(0,58,78,10,15,10,'floor2',{rails:true});[[62,0],[68,2.1],[74,4.2]].forEach(([z,ph])=>{const y=10+(z-58)/20*5;slider(c,0,3.3,y+.85,z,2.8,ph,-a3);});
   c.floor(0,78,86,14,'floor',15);rails(c,78,86,15,14);c.cyl(0,15.95,82,.5,1.9,'white');spinBar(c,0,15.6,82,13.4,.5,t=>-1.7*t,()=>-1.7,'bar2');
   c.ramp(0,86,104,15,20,9,'floor3',{rails:true});[[90,-2.2],[94.5,2.2],[99,-2.2]].forEach(([z,x])=>bumper(c,x,15+(z-86)/18*5,z,.75));
   c.floor(0,104,122,18,'floor',20);arch(c,108,20,18);
   // boulders
   const bm=toyMat(0xff7a1f,{col2:0xffd23a,pat:2,scale:.7,rough:.3});const balls=[];for(let i=0;i<7;i++){const b=new Ball(1.15,3,6.5);b.on=false;b.mesh=c.mesh(new THREE.IcosahedronGeometry(1.15,3),bm);b.mesh.visible=false;c.grp.add(b.mesh);balls.push(b);c.W.balls.push(b);}
   const gm=new THREE.Mesh(new THREE.BoxGeometry(60,40,190),c.gooMat?c.gooMat(0x5ee03c,0x0d4a12,[.5,1,.4]):c.mats.lime);gm.position.set(0,-26,55);c.grp.add(gm);
   const goo={y:-5};let spawnT=1;
   return{gate,goo,finishZ:108,finishY:20,killY:-30,spawns:n=>grid(n,0,-2.5,6,1.9,1.9),
    cps:[{z:-6,x:6,y:0},{z:23,x:5,y:5},{z:51,x:5,y:10},{z:79,x:5,y:15}],
    path:[{z:4,w:4},{z:22,w:4.5},{z:30,w:4.5},{z:50,w:3.8},{z:58,w:3.8},{z:78,w:3.5},{z:86,w:3},{z:104,w:3},{z:110,w:5},{z:118,w:5}],
    update(t,dt,G){if(G.playing)goo.y=Math.min(21,-5+Math.max(0,G.pt-4)*.235);gm.position.y=goo.y-20;
     if(G.playing&&(spawnT-=dt)<=0){spawnT=1.8+rnd(1);const b=balls.find(b=>!b.on);if(b){b.on=true;b.p.set(rnd(8)-4,12.2,49.5);b.v.set(rnd(2)-1,0,-3);b.mesh.visible=true;}}
     for(const b of balls){if(!b.on)continue;if(b.p.z<31||b.p.y<-6){b.on=false;b.mesh.visible=false;G.puff&&G.puff(b.p);continue;}b.mesh.position.copy(b.p);b.mesh.quaternion.copy(b.q);}},
    intro:raceIntro(108,20)};}},
 /* ---- survival: keep (or steal) a tail ---- */
 tail:{name:'TAIL TAG',kind:'tail',time:75,tag:'SURVIVAL',desc:'Only beans holding a tail when the clock hits zero go through. Grab a tail-holder from behind to steal theirs!',
  build(c){c.cyl(0,-.6,CZ,17,1.2,'floor');c.deco(new THREE.TorusGeometry(17,.35,10,96),M(0,0,CZ,Math.PI/2),'side');
   c.block(0,1,CZ,8,2,8,'floor2',{r:.4});c.ramp(0,CZ-9,CZ-4,0,2,4,'floor3');c.ramp(0,CZ+9,CZ+4,0,2,4,'floor3');c.ramp(0,-9,-4,0,2,4,'floor3',{dir:'x',cz:CZ});c.ramp(0,9,4,0,2,4,'floor3',{dir:'x',cz:CZ});
   for(const s of[-1,1]){c.cyl(s*9.5,.95,CZ,.5,1.9,'white');const r=s*.95;spinBar(c,s*9.5,.6,CZ,8,.5,t=>r*t,()=>r,'bar2');}
   for(const[x,z]of[[7,7],[-7,7],[7,-7],[-7,-7]])bumper(c,x,0,CZ+z);
   return{killY:-8,spawns:n=>ring(n,0,CZ,12,15),cps:[{x0:0,z:CZ,r:13,y:0}],center:new V(0,0,CZ),radius:15.5,intro:arenaIntro(2)};}},
 /* ---- survival: jump the low sweeper, stay grounded for the high one ---- */
 skip:{name:'SKIP SWEEP',kind:'survival',time:90,tag:'SURVIVAL',desc:'A low bar to jump and a high bar to duck - both speed up, and the outer ring falls away. Last beans standing qualify!',
  build(c){c.cyl(0,-.6,CZ,7.6,1.2,'floor');const segs=[];const N=14;
   for(let i=0;i<N;i++){const a=(i+.5)/N*TAU,cx=Math.sin(a)*10.5,cz=CZ+Math.cos(a)*10.5;const q=new Q().setFromAxisAngle(YA,a);const col=mkBox(new V(cx,-.6,cz),new V(2.95,.6,2.9),{q});c.W.cols.push(col);
    const m=c.mesh(rbox(5.9,1.2,5.8,.3),i%2?'floor2':'floor3');m.position.copy(col.c);m.quaternion.copy(q);c.grp.add(m);segs.push({col,m,a,drop:i%2?70:40,y:-.6,vy:0,i});}
   c.cyl(0,1.7,CZ,1.6,3.4,'white',{cp:{bounce:.9}});c.deco(new THREE.SphereGeometry(1.7,24,12,0,TAU,0,Math.PI/2),M(0,3.4,CZ),'pink');
   const lw=t=>.8+.011*t,la=t=>.8*t+.0055*t*t,hw=t=>-(.55+.0075*t),ha=t=>2-(.55*t+.00375*t*t);
   sweepArm(c,0,.55,CZ,1.6,13.8,.48,la,lw,'bar','low');sweepArm(c,0,2.35,CZ,1.6,13.8,.44,ha,hw,'bar2','high');
   return{killY:-6,spawns:n=>ring(n,0,CZ,4.5,10),center:new V(0,0,CZ),radius:12.8,segs,
    drops:[40,70],safeR:t=>t>70?6.4:t>40?9.5:12.2,
    update(t,dt,G){const pt=G.pt;for(const s of segs){if(s.gone)continue;if(G.playing&&pt>s.drop-2.2&&pt<s.drop){s.m.position.y=s.y+Math.sin(t*60+s.i)*.06;s.warn=true;}
     if(G.playing&&pt>=s.drop){s.col.on=false;s.vy-=GRAV*.6*dt;s.y+=s.vy*dt;s.m.position.y=s.y;if(s.y<-40){s.gone=true;s.m.visible=false;}}}},
    intro:arenaIntro(2)};}},
 /* ---- team: push giant balls into the other goal ---- */
 ball:{name:'BALL BRAWL',kind:'team',time:90,tag:'TEAM',desc:'Two teams, two giant balls. Shove them into the other team\'s goal. The losing team is eliminated!',
  build(c){const X=13,Z=19,GW=13,D=6;c.floor(0,CZ-Z,CZ+Z,X*2,'floor3');c.block(0,.02,CZ,X*2,.06,.5,'white',{col:false,r:.02});c.deco(new THREE.TorusGeometry(5,.2,8,48),M(0,.02,CZ,Math.PI/2,0,0,1,1,.2),'white');
   for(const s of[-1,1])c.block(s*(X+.6),1.7,CZ,1.2,3.4,(Z+D)*2+2.4,'side');
   const TC=[0xff7a1f,0x18c6d6];
   for(const s of[-1,1]){c.floor(0,s>0?CZ+Z:CZ-Z-D,s>0?CZ+Z+D:CZ-Z,X*2,s>0?'floor2':'floor');c.block(0,3.4,CZ+s*(Z+D+.6),X*2+2.4,6.8,1.2,'white');
    for(const q of[-1,1])c.block(q*(X+.6),4.6,CZ+s*Z,1.4,9.2,1.4,s>0?'cyan':'orange',{r:.5});c.block(0,9.6,CZ+s*Z,X*2+2.8,1.2,1.4,s>0?'cyan':'orange',{col:false,r:.5});
    c.block(0,.03,CZ+s*Z,X*2,.06,.6,'white',{col:false,r:.02});
    const net=new THREE.Mesh(new THREE.PlaneGeometry(X*2,6.4),new THREE.MeshStandardMaterial({color:TC[s>0?1:0],roughness:.5,side:THREE.DoubleSide}));net.position.set(0,3.3,CZ+s*(Z+D-.02));c.grp.add(net);}
   const bg=new THREE.SphereGeometry(2.2,32,20);const col=[];const pa=bg.attributes.position;const cs=[0xff5fa2,0xffffff,0xffd23a,0xffffff,0x3fd4ff,0xffffff].map(h=>new THREE.Color(h));
   for(let i=0;i<pa.count;i++){const a=Math.atan2(pa.getZ(i),pa.getX(i));const k=Math.floor((a+Math.PI)/TAU*6)%6;const cc=Math.abs(pa.getY(i))>2.0?new THREE.Color(1,1,1):cs[k];col.push(cc.r,cc.g,cc.b);}bg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
   const balls=[0,1].map(i=>{const b=new Ball(2.2,1.5,99);b.mesh=c.mesh(bg,toyMat(0xffffff,{vc:true,rough:.22}));c.grp.add(b.mesh);c.W.balls.push(b);b.home=new V(i?5.5:-5.5,2.4,CZ);b.p.copy(b.home);return b;});
   return{killY:-8,Z,X,GW,balls,center:new V(0,0,CZ),teamCols:['#ff7a1f','#18c6d6'],teamNames:['SUNSET','LAGOON'],
    spawns:(n,team)=>{const out=[];for(let i=0;i<n;i++){const s=team[i]?1:-1;const k=out.filter((o,j)=>team[j]===team[i]).length;out.push([((k%5)-2)*2.3,0,CZ+s*(10+(k/5|0)*2.3),s>0?Math.PI:0]);}return out;},
    update(t,dt){for(const b of balls){b.mesh.position.copy(b.p);b.mesh.quaternion.copy(b.q);}},intro:arenaIntro(0)};}},
 /* ---- final: hexagon floors fall away ---- */
 hex:{name:'HEX HAVOC',kind:'final',time:120,tag:'FINAL',desc:'Three floors of hexagon tiles that drop the moment you touch them. Last bean standing takes the crown!',
  build(c){const S=1.25;const layers=[{y:24,n:6,cx:0,cz:CZ},{y:16,n:6,cx:0,cz:CZ},{y:8,n:6,cx:0,cz:CZ},{y:0,n:6,cx:0,cz:CZ}];const hx=makeHex(layers,S);c.W.hex=hx;
   const pal=[[0x3fd4ff,0x8fe9ff],[0xff5fa2,0xffa8d6],[0xffc93a,0xffe48a],[0x8a5cff,0xb99bff]];const geo=new THREE.CylinderGeometry(S*.965,S*.88,.6,6);
   const mat=toyMat(0xffffff,{rough:.25,col2:0xffffff});const vis=hx.layers.map((L,li)=>{const im=new THREE.InstancedMesh(geo,mat,L.tiles.length);im.castShadow=true;im.receiveShadow=true;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    L.tiles.forEach((t,i)=>{t.base=new THREE.Color(pal[li][(t.q*3+t.r*5+99)%3?0:1]);im.setColorAt(i,t.base);});c.grp.add(im);c.deco(new THREE.TorusGeometry(S*1.732*(L.n+.62),.3,8,72),M(0,L.y-.3,CZ,Math.PI/2),'white');return im;});
   const m4=new THREE.Matrix4(),q=new Q(),col=new THREE.Color(),hot=new THREE.Color(1,.25,.3),one=new V(1,1,1);
   const draw=(t)=>{hx.layers.forEach((L,li)=>{const im=vis[li];for(const tl of L.tiles){if(tl.st>=3){m4.makeScale(0,0,0);im.setMatrixAt(tl.i,m4);continue;}
     const sh=tl.st===1?Math.sin(t*70+tl.i)*.05*tl.t/.6:0;q.setFromAxisAngle(XA,tl.st===2?tl.dy*.02:0);m4.compose(new V(tl.x+sh,L.y-.3+tl.dy-(tl.st===1?tl.t*.12:0),tl.z),q,one);im.setMatrixAt(tl.i,m4);
     col.copy(tl.base);if(tl.st>=1)col.lerp(hot,Math.min(1,tl.st===2?1:tl.t/.55));im.setColorAt(tl.i,col);}im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;});};draw(0);
   return{killY:-5,hx,fuse:.62,center:new V(0,24,CZ),spawns:n=>ring(n,0,CZ,3.5,10,24.2),update(t){draw(t);},intro:[[0,8,CZ+30,0,10,CZ],[24,20,CZ+8,0,14,CZ],[8,34,CZ-22,0,20,CZ],[0,30,CZ-15,0,24,CZ]]};}},
 /* ---- lobby / podium (menu + crown celebration) ---- */
 lobby:{name:'LOBBY',kind:'lobby',time:0,
  build(c){c.cyl(0,-.6,CZ,9,1.2,'floor2');c.deco(new THREE.TorusGeometry(9,.32,10,80),M(0,0,CZ,Math.PI/2),'side');c.cyl(0,.45,CZ,1.7,.9,'yellow');c.cyl(0,1.15,CZ,1.3,.5,'white');
   for(const[x,z]of[[-5,3],[5,3]]){c.cyl(x,.25,CZ+z,1.4,.5,'cyan');}
   for(let i=0;i<8;i++){const a=i/8*TAU;c.cyl(Math.sin(a)*12,1.5,CZ+Math.cos(a)*12,.35,3,'white',{col:false});c.deco(new THREE.SphereGeometry(.7,14,10),M(Math.sin(a)*12,3.4,CZ+Math.cos(a)*12),i%2?'pink':'yellow');}
   return{killY:-8,spawns:n=>ring(n,0,CZ,3.4,5.4),center:new V(0,0,CZ),podium:new V(0,1.4,CZ)};}}};

export const RACES=['spin','doors','tilt','goo'],SURV=['tail','skip','ball'];
export function buildRound(id,scene,mats,hooks={}){const W=makeWorld();const c=Ctx(scene,mats,W);Object.assign(c,hooks);const spec=ROUNDS[id].build(c);c.finish();buildBins(W);
 return Object.assign({id,def:ROUNDS[id],W,ctx:c,kind:ROUNDS[id].kind},spec);}
