// POMLET ROUNDUP — herd skittish fluffy pomlets into the pen. Each colour has its own personality.
import {THREE,V3,Particles,baseScene,follow,snowMaterial,textSprite,toScreen} from './common.js';
import {Penguin} from '../penguin.js';
import {makePomlet,animPomlet} from '../items.js';
import {instancedPines} from '../env.js';
import {merge,M,cl,rnd,pick,damp,dampAng} from '../util.js';
const FW=18,FD=12,PEN={x:0,z:-FD,w:6,d:5,gate:3.2};
const KINDS={pink:{c:0xff8ac0,sp:4.6,fear:5.5,pts:10},blue:{c:0x58a8ff,sp:6.6,fear:7.5,pts:10},green:{c:0x6ad86a,sp:4.8,fear:5.5,pts:10,hop:1},yellow:{c:0xffd84a,sp:3.6,fear:3,pts:10,sleepy:1},purple:{c:0xb07aff,sp:5.2,fear:4.5,pts:15,curious:1},gold:{c:0xffc23a,sp:8,fear:8,pts:50,gold:1}};
export default{id:'pets',name:'POMLET ROUNDUP',room:'street',time:80,music:'game',medals:[60,110,160],
 desc:'The pomlets escaped! Herd the fluffy runaways back into their pen. Each colour has its own personality.',
 long:'Pomlets run away from you, so walk around behind them and push them toward the pen gate at the top of the field. Blue ones are fast and jumpy, green ones bounce around, yellow ones doze off and need a nudge, purple ones are curious and sneak up behind you, and the golden one is very quick. Whistle to spook every pomlet nearby. Catch them all for a time bonus.',
 keys:[['Walk','W A S D · arrows · hold left mouse'],['Whistle (scare nearby)','Space · 3s cooldown'],['Points','10 each · purple 15 · golden 50'],['Bonus','catch them all: +2 per second left']],
 create(ctx){const{R,snd}=ctx;const B=baseScene(R,{hour:15.5,fogD:.006,shadowSize:28});const{scene,sun,cam}=B;cam.fov=48;
  // ---- field ----
  const g=new THREE.PlaneGeometry(90,70,60,40);g.rotateX(-Math.PI/2);const p=g.attributes.position,col=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const edge=Math.max(Math.abs(x)-FW,Math.abs(z)-FD,0);p.setY(i,edge>0?Math.min(5,edge*.25)+Math.sin(x*.3)*Math.min(1,edge*.1):Math.sin(x*.4+z*.3)*.06);col.push(.88,.92,.98);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();const field=new THREE.Mesh(g,snowMaterial());field.receiveShadow=true;scene.add(field);
  const tp=[];for(let i=0;i<60;i++){const a=rnd(7),r=rnd(26,40);tp.push({x:Math.cos(a)*r*1.2,y:1,z:Math.sin(a)*r*.9,s:.9+rnd(.8)});}instancedPines(scene,tp);
  // fence + pen
  const L=[];const post=(x,z)=>L.push([new THREE.CylinderGeometry(.1,.12,1.2,6),M(x,.6,z),0xffffff]);const rail=(x1,z1,x2,z2,c=0xff8ac0)=>{const d=Math.hypot(x2-x1,z2-z1);L.push([new THREE.BoxGeometry(.1,.1,d),M((x1+x2)/2,.95,(z1+z2)/2,0,Math.atan2(x2-x1,z2-z1),0),c],[new THREE.BoxGeometry(.08,.08,d),M((x1+x2)/2,.5,(z1+z2)/2,0,Math.atan2(x2-x1,z2-z1),0),c]);};
  const seg=(x1,z1,x2,z2,c)=>{const n=Math.ceil(Math.hypot(x2-x1,z2-z1)/2.5);for(let i=0;i<=n;i++)post(x1+(x2-x1)*i/n,z1+(z2-z1)*i/n);rail(x1,z1,x2,z2,c);};
  seg(-FW,-FD,-PEN.gate,-FD,0x6ab0ff);seg(PEN.gate,-FD,FW,-FD,0x6ab0ff);seg(FW,-FD,FW,FD,0x6ab0ff);seg(FW,FD,-FW,FD,0x6ab0ff);seg(-FW,FD,-FW,-FD,0x6ab0ff);
  const pz0=-FD,pz1=-FD-PEN.d*2;seg(-PEN.w,pz0,-PEN.w,pz1);seg(-PEN.w,pz1,PEN.w,pz1);seg(PEN.w,pz1,PEN.w,pz0);seg(-PEN.w,pz0,-PEN.gate,pz0);seg(PEN.gate,pz0,PEN.w,pz0);
  // pen floor + hay + sign
  L.push([new THREE.BoxGeometry(PEN.w*2,.08,PEN.d*2),M(0,.02,-FD-PEN.d),0xf2d890]);for(let i=0;i<5;i++)L.push([new THREE.BoxGeometry(1.2,.6,.8),M(-4+i*2,.3,pz1+.8,0,rnd(.4),0),0xe8c060]);
  const fm=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7}));fm.castShadow=fm.receiveShadow=true;scene.add(fm);
  {const s=textSprite('POMLET PEN',{size:56,bg:'rgba(47,176,168,.95)',scale:1});s.position.set(0,3,pz1);scene.add(s);const arrow=textSprite('▼ GATE ▼',{size:44,color:'#fff',bg:'rgba(255,77,0,.85)',scale:.7});arrow.position.set(0,2.2,-FD+.5);scene.add(arrow);}
  // obstacles (rocks + bushes) inside the field
  const obs=[[-9,3,1.6],[8,-4,1.4],[11,6,1.8],[-12,-6,1.3],[0,6,1.2],[-4,-3,1]];{const OL=[];for(const[x,z,r]of obs){OL.push([new THREE.IcosahedronGeometry(r,1),M(x,r*.35,z,0,rnd(3),0,1,.7,1),0x8a929e],[new THREE.IcosahedronGeometry(r*.8,1),M(x,r*.75,z,0,0,0,1,.35,1),0xffffff]);}
   const om=new THREE.Mesh(merge(OL),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,flatShading:true}));om.castShadow=om.receiveShadow=true;scene.add(om);}
  // ---- player ----
  const me=new Penguin({color:ctx.look.color,wear:ctx.look.wear,scale:1.3});scene.add(me.group);const pl={x:0,z:8,ry:Math.PI,v:new V3()};
  const whistleRing=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),new THREE.MeshBasicMaterial({color:new THREE.Color(2,1.6,.6),transparent:true,opacity:0,side:THREE.DoubleSide}));whistleRing.rotation.x=-Math.PI/2;whistleRing.position.y=.1;scene.add(whistleRing);
  // ---- pomlets ----
  const D=[{n:9,spd:.85},{n:11,spd:1},{n:13,spd:1.12}][ctx.diff];const order=['pink','pink','blue','green','yellow','purple','pink','blue','green','yellow','purple','pink','blue'].slice(0,D.n);order.push('gold');
  const poms=order.map((k,i)=>{const K=KINDS[k];const m=makePomlet(K.c);m.scale.setScalar(K.gold?1.9:2.2);scene.add(m);const a=i/order.length*Math.PI*2;return{k,K,m,x:Math.cos(a)*rnd(5,14),z:Math.sin(a)*rnd(2,8)+2,vx:0,vz:0,ry:rnd(7),caught:false,sleep:K.sleepy?rnd(2,6):0,wander:rnd(7),hopT:rnd(2),air:0,vy:0,cT:0};});
  const parts=new Particles(scene,600,'normal'),glit=new Particles(scene,500,'add');
  let t=0,score=0,caught=0,whistle=0,whT=0,bonus=0,pops=[];
  const inst={scene,camera:cam,score:0,particles:[parts,glit],post:{exposure:.82,bloomThreshold:1.8,bloom:.35},
   idle(dt){vis(dt);},
   update(dt,inp){t+=dt;
    // player move
    let ix=(inp.right()?1:0)-(inp.left()?1:0),iz=(inp.down()?1:0)-(inp.up()?1:0);if(Math.abs(inp.ax)>.25)ix=inp.ax;if(Math.abs(inp.ay)>.25)iz=inp.ay;
    if(!ix&&!iz&&inp.mouse.down){const r=inp.ray(cam);if(r.direction.y<0){const k=-r.origin.y/r.direction.y,hx=r.origin.x+r.direction.x*k,hz=r.origin.z+r.direction.z*k;const dx=hx-pl.x,dz=hz-pl.z,d=Math.hypot(dx,dz);if(d>.4){ix=dx/d;iz=dz/d;}}}
    const il=Math.hypot(ix,iz);const sp=6.4;if(il>0){pl.v.x=damp(pl.v.x,ix/Math.max(1,il)*sp,10,dt);pl.v.z=damp(pl.v.z,iz/Math.max(1,il)*sp,10,dt);pl.ry=dampAng(pl.ry,Math.atan2(ix,iz),12,dt);}else{pl.v.x=damp(pl.v.x,0,10,dt);pl.v.z=damp(pl.v.z,0,10,dt);}
    pl.x=cl(pl.x+pl.v.x*dt,-FW+.6,FW-.6);pl.z=cl(pl.z+pl.v.z*dt,-FD+.6,FD-.6);for(const[ox,oz,r]of obs){const dx=pl.x-ox,dz=pl.z-oz,d=Math.hypot(dx,dz);if(d<r+.6){pl.x=ox+dx/d*(r+.6);pl.z=oz+dz/d*(r+.6);}}
    // whistle
    whistle-=dt;if((inp.act()||inp.e('KeyE'))&&whistle<=0){whistle=3;whT=.6;snd.play('whistle');me.play('cheer');for(const q of poms){if(q.caught)continue;const dx=q.x-pl.x,dz=q.z-pl.z,d=Math.hypot(dx,dz);if(d<9.5){q.vx+=dx/d*14*(1-d/12);q.vz+=dz/d*14*(1-d/12);q.sleep=0;q.air=.01;q.vy=5;}}}
    // pomlets
    for(const q of poms)pomAI(q,dt);
    // pomlet-pomlet separation
    for(let a=0;a<poms.length;a++)for(let b=a+1;b<poms.length;b++){const A=poms[a],Bq=poms[b],dx=A.x-Bq.x,dz=A.z-Bq.z,d=Math.hypot(dx,dz);if(d<1.1&&d>1e-3){const k=(1.1-d)*.5;A.x+=dx/d*k;A.z+=dz/d*k;Bq.x-=dx/d*k;Bq.z-=dz/d*k;}}
    if(caught===poms.length&&!inst.done){bonus=Math.ceil(ctx.tLeft)*2;score+=bonus;inst.done=true;inst.doneReason='all';inst.endText='ALL CAUGHT!';snd.play('cheer');}
    inst.score=score;vis(dt);},
   hud(){const W=innerWidth,H=innerHeight;ctx.hud.innerHTML=`<div class="mgpanel" style="left:18px;top:16px"><b>${caught} / ${poms.length}</b> CAUGHT<br>${poms.filter(q=>!q.caught).map(q=>`<i style="display:inline-block;width:12px;height:12px;border-radius:50%;margin:3px 2px 0 0;background:#${new THREE.Color(q.K.c).getHexString()}"></i>`).join('')}<br><span style="color:${whistle<=0?'#ffe09a':'#8a8f9a'}">WHISTLE ${whistle<=0?'READY · SPACE':Math.ceil(whistle)+'s'}</span></div>`+
    pops.map(p=>{const s=toScreen(p.p,cam,W,H);return `<div class="mgp" style="left:${s.x}px;top:${s.y-(1.2-p.t)*40}px;transform:translate(-50%,-50%);font:400 1.6rem Anton,Impact,sans-serif;color:${p.col};opacity:${Math.min(1,p.t*2)}">${p.txt}</div>`;}).join('')+
    poms.filter(q=>q.sleep>0&&!q.caught).map(q=>{const s=toScreen(new V3(q.x,1.6,q.z),cam,W,H);return `<div class="mgp" style="left:${s.x}px;top:${s.y}px;font:700 .9rem JetBrains Mono,monospace;color:#cfe">z<sup>z</sup></div>`;}).join('');},
   result(){const md=score>=160?3:score>=110?2:score>=60?1:0;return{score,medal:md,coins:Math.round(score*.3)+3,stats:[['Pomlets penned',`${caught} / ${poms.length}`],['Golden pomlet',poms.find(q=>q.K.gold).caught?'caught!':'escaped'],['Time bonus',bonus]],sub:inst.doneReason==='all'?'EVERY POMLET PENNED':'TIME UP'};},
   cheat:{win(){for(const q of poms){q.x=0;q.z=-FD-3;}},lose(){}},poms,pl,PEN,FD};
  function inPen(x,z){return z<-FD-.3&&z>-FD-PEN.d*2&&Math.abs(x)<PEN.w;}
  function pomAI(q,dt){const K=q.K;q.hopT-=dt;
   if(q.caught){q.cT+=dt;q.wander+=dt*rnd(.5,1.5);q.vx=damp(q.vx,Math.cos(q.wander)*1.2,2,dt);q.vz=damp(q.vz,Math.sin(q.wander)*1.2,2,dt);q.x=cl(q.x+q.vx*dt,-PEN.w+.6,PEN.w-.6);q.z=cl(q.z+q.vz*dt,-FD-PEN.d*2+.6,-FD-.8);return;}
   const dx=q.x-pl.x,dz=q.z-pl.z,d=Math.hypot(dx,dz)||1;let ax=0,az=0;
   if(K.sleepy){if(q.sleep>0){q.sleep-=dt*(d<2.4?6:0);if(d>2.4)q.sleep=Math.max(q.sleep,.01);if(q.sleep<=0){q.awake=4;}}else{q.awake=(q.awake||0)-dt;if(q.awake<=0&&d>6&&Math.random()<dt*.25)q.sleep=4+rnd(4);}}
   const asleep=q.sleep>0;
   if(!asleep){if(d<K.fear){const f=(1-d/K.fear);ax+=dx/d*f*K.sp*3;az+=dz/d*f*K.sp*3;if(f>.6&&Math.random()<dt*2)snd.play('squeak',Math.random());}
    else if(K.curious&&d>7){ax-=dx/d*2;az-=dz/d*2;}
    q.wander+=rnd(-1,1)*dt*2;ax+=Math.cos(q.wander)*1.2;az+=Math.sin(q.wander)*1.2;
    if(K.hop&&q.hopT<=0&&q.air<=0){q.hopT=1+rnd(1.5);q.air=.01;q.vy=6;q.vx+=rnd(-5,5);q.vz+=rnd(-5,5);}
    // avoid fences (soft), but the gate gap stays open
    const m=2.5;if(q.x<-FW+m)ax+=(-FW+m-q.x)*3;if(q.x>FW-m)ax-=(q.x-FW+m)*3;if(q.z>FD-m)az-=(q.z-FD+m)*3;if(q.z<-FD+m&&Math.abs(q.x)>PEN.gate-.5)az+=(-FD+m-q.z)*3;
    for(const[ox,oz,r]of obs){const ex=q.x-ox,ez=q.z-oz,e=Math.hypot(ex,ez);if(e<r+1.6){ax+=ex/e*4;az+=ez/e*4;}}}
   const mx=K.sp*D.spd*(asleep?0:1);q.vx=damp(q.vx,cl(q.vx+ax*dt*4,-mx,mx),3,dt);q.vz=damp(q.vz,cl(q.vz+az*dt*4,-mx,mx),3,dt);if(asleep){q.vx*=Math.exp(-dt*6);q.vz*=Math.exp(-dt*6);}
   q.x+=q.vx*dt;q.z+=q.vz*dt;
   // hard walls with the gate gap
   q.x=cl(q.x,-FW+.5,FW-.5);q.z=Math.min(q.z,FD-.5);if(q.z<-FD+.5&&!(Math.abs(q.x)<PEN.gate-.4)){q.z=-FD+.5;q.vz=Math.abs(q.vz)*.5;}
   for(const[ox,oz,r]of obs){const ex=q.x-ox,ez=q.z-oz,e=Math.hypot(ex,ez);if(e<r+.5){q.x=ox+ex/e*(r+.5);q.z=oz+ez/e*(r+.5);}}
   if(inPen(q.x,q.z)){q.caught=true;caught++;score+=K.pts;snd.play('chime');glit.burst(new V3(q.x,1,q.z),30,4,[new THREE.Color(2.2,1.8,.6),new THREE.Color(K.c).multiplyScalar(2)],.35,.8,{up:true,grav:3});pops.push({txt:'+'+K.pts,p:new V3(q.x,2,q.z),t:1.2,col:K.gold?'#ffd84a':'#fff'});if(K.gold)ctx.msg('GOLDEN POMLET!','#ffd84a',1.2);}
   if(q.z<-FD-PEN.d*2+.5)q.z=-FD-PEN.d*2+.5;}
  let camInit=false;const cpos=new V3();
  function vis(dt){t+=0;for(const q of poms){if(q.air>0){q.vy-=20*dt;q.air+=q.vy*dt;if(q.air<=0){q.air=0;parts.burst(new V3(q.x,.1,q.z),6,2,new THREE.Color(1,1,1),.3,.4,{up:true,grav:6});}}
    q.m.position.set(q.x,q.air,q.z);const sp=Math.hypot(q.vx,q.vz);if(sp>.3)q.ry=dampAng(q.ry,Math.atan2(q.vx,q.vz),10,dt);q.m.rotation.y=q.ry;animPomlet(q.m,dt*(q.K.gold?1.6:1),sp>.6,q.caught?.6:0);if(q.sleep>0){q.m.userData.eyes.scale.y=.1;}
    if(q.K.gold&&Math.random()<dt*20)glit.emit(q.x+rnd(-.4,.4),.6+rnd(.5),q.z+rnd(-.4,.4),0,.6,0,2,1.6,.5,.25,.6);}
   me.group.position.set(pl.x,0,pl.z);me.group.rotation.y=pl.ry;me.update(dt,Math.hypot(pl.v.x,pl.v.z)/1.3);
   whT=Math.max(0,whT-dt);whistleRing.position.set(pl.x,.1,pl.z);const k=1-whT/.6;whistleRing.scale.setScalar(.5+k*9.5);whistleRing.material.opacity=whT>0?(1-k)*.9:0;
   parts.update(dt);glit.update(dt);for(let i=pops.length-1;i>=0;i--){pops[i].t-=dt;if(pops[i].t<=0)pops.splice(i,1);}
   cpos.set(pl.x*.4,21,pl.z*.35+16.5);if(!camInit){cam.position.copy(cpos);camInit=true;}else cam.position.lerp(cpos,1-Math.exp(-dt*4));cam.lookAt(pl.x*.45,0,pl.z*.4-3);follow(sun,new V3(0,0,-2),B.pal.sunDir);field.material.userData.U.uT.value+=dt;}
  return inst;}};
