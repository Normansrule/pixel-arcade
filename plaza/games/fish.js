// FROSTY FISHING — a cut-away ice-fishing diorama: lower the hook, hook fish, reel them up past jellyfish, crabs and a grumpy shark.
import {THREE,V3,Particles,baseScene,ctex,toScreen} from './common.js';
import {Penguin} from '../penguin.js';
import {merge,M,cl,rnd,pick,damp,lerp} from '../util.js';
import {snowMaterial,instancedPines} from '../env.js';
const TYPES=[{k:'minnow',pts:1,sz:.5,sp:2.6,col:0xff9a3a,col2:0xffd08a,dmin:1.5,dmax:6,w:.45},{k:'trout',pts:2,sz:.72,sp:3.2,col:0x2fb8b0,col2:0xb8fff0,dmin:4,dmax:10,w:.3},{k:'grouper',pts:4,sz:1.05,sp:2,col:0x8a55d0,col2:0xe0c8ff,dmin:8,dmax:13,w:.18,heavy:1},{k:'golden',pts:8,sz:.6,sp:5,col:0xffc83a,col2:0xfff4c0,dmin:3,dmax:12,w:.06,gold:1}];
const BOT=-14.2;
function fishGeo(t){return merge([[new THREE.SphereGeometry(.5,18,12),M(0,0,0,0,0,0,1.25,.78,.5),t.col],[new THREE.SphereGeometry(.48,14,10),M(.06,-.08,.02,0,0,0,1.05,.55,.46),t.col2],[new THREE.ConeGeometry(.42,.6,4),M(-.78,0,0,0,0,Math.PI/2,1,1,.25),t.col],[new THREE.ConeGeometry(.22,.38,4),M(0,.42,0,0,0,-.4,1,1,.2),t.col],[new THREE.SphereGeometry(.09,8,6),M(.42,.1,.2),0x111111],[new THREE.SphereGeometry(.09,8,6),M(.42,.1,-.2),0x111111],[new THREE.SphereGeometry(.03,6,4),M(.47,.13,.26),0xffffff]]);}
export default{id:'fish',name:'FROSTY FISHING',room:'dock',time:90,music:'cozy',medals:[18,40,70],
 desc:'Drop a line through the ice. Hook fish and reel them up, but keep them away from jellyfish, crabs and the grumpy shark.',
 long:'Move your hook up and down through the water. Touch a fish to hook it, then bring it up to the hole to land it. Big fish are heavy and slow to reel. Jellyfish knock your catch loose, crabs on the sea floor steal your worm, and the shark steals both. Grab floating worm cans to restock. Land fish in a row to build a combo.',
 keys:[['Move hook','mouse up/down · W S · ↑ ↓'],['Reel fast','hold Space / left mouse'],['Worms','3 · lose them all and the shift ends'],['Fish','minnow 1 · trout 2 · grouper 4 · golden 8']],
 create(ctx){const{R,snd}=ctx;const B=baseScene(R,{hour:10.5,fogD:.012,fog:0x9cc8e8,shadowSize:22});const{scene,sun,cam}=B;cam.fov=46;cam.position.set(0,-3.8,24);cam.lookAt(0,-4.4,0);
  sun.position.set(12,30,18);sun.target.position.set(0,0,0);
  // ---- ice slab with the hole ----
  const iceM=snowMaterial({vc:false,color:0xe8f4ff});for(const sx of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(40,1,8.5),iceM);m.position.set(sx*(20+.9),-.5,-2.75);m.receiveShadow=m.castShadow=true;scene.add(m);}
  {const ed=new THREE.Mesh(new THREE.BoxGeometry(82,.25,.2),new THREE.MeshStandardMaterial({color:0xbfe8ff,roughness:.05,transparent:true,opacity:.8,emissive:0x4aa0d0,emissiveIntensity:.4}));ed.position.set(0,-1,1.55);scene.add(ed);}
  const snowTop=new THREE.Mesh(new THREE.PlaneGeometry(90,40),snowMaterial({vc:false}));snowTop.rotation.x=-Math.PI/2;snowTop.position.set(0,.02,-26);snowTop.receiveShadow=true;scene.add(snowTop);
  instancedPines(scene,Array.from({length:40},(_,i)=>({x:-40+i*2+rnd(-1,1),y:0,z:-14-rnd(18),s:.8+rnd(.9)})));
  {const hut=new THREE.Group();const w=new THREE.Mesh(new THREE.BoxGeometry(5,3.4,4),new THREE.MeshStandardMaterial({color:0x3f86e0,roughness:.7}));w.position.y=1.7;hut.add(w);const rf=new THREE.Mesh(new THREE.ConeGeometry(3.9,1.8,4),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8}));rf.position.y=4.3;rf.rotation.y=Math.PI/4;hut.add(rf);hut.position.set(-10,0,-3);hut.traverse(n=>{if(n.isMesh)n.castShadow=true;});scene.add(hut);}
  // ---- underwater: backdrop, caustics, seabed, kelp, light shafts ----
  const U={uT:{value:0}};
  const back=new THREE.Mesh(new THREE.PlaneGeometry(80,18),new THREE.ShaderMaterial({uniforms:U,fog:false,vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`uniform float uT;varying vec2 vU;void main(){vec3 top=vec3(.18,.55,.75),bot=vec3(.02,.08,.2);vec3 c=mix(bot,top,pow(vU.y,1.4));vec2 p=vU*vec2(30.,7.);float k=sin(p.x+uT*.7+sin(p.y*1.3+uT))*sin(p.y*1.7-uT*.5+sin(p.x*.8));c+=vec3(.2,.45,.5)*pow(max(k,0.),6.)*vU.y*.6;gl_FragColor=vec4(c,1.);}`}));
  back.position.set(0,-8,-7);scene.add(back);
  const fogBox=new THREE.Mesh(new THREE.BoxGeometry(80,15,.1),new THREE.MeshBasicMaterial({color:0x0a3a5a,transparent:true,opacity:.18,depthWrite:false}));fogBox.position.set(0,-8.5,1.4);scene.add(fogBox);
  {const g=new THREE.PlaneGeometry(80,14,60,4);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,Math.sin(p.getX(i)*.4)*.4+rnd(.3));g.computeVertexNormals();const sb=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xc8b48a,roughness:.95}));sb.position.set(0,BOT-.6,0);sb.receiveShadow=true;scene.add(sb);
   const rk=[];for(let i=0;i<26;i++)rk.push([new THREE.IcosahedronGeometry(.5+rnd(.9),0),M(rnd(-30,30),BOT-.4,rnd(-5,-1),rnd(3),rnd(3),0,1,.6,1),pick([0x5a6a7a,0x6a5a6a,0x4a5a6a])]);const rm=new THREE.Mesh(merge(rk),new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.9}));scene.add(rm);}
  const kelp=[];{const kg=new THREE.PlaneGeometry(.5,1,1,10);kg.translate(0,.5,0);for(let i=0;i<22;i++){const h=3+rnd(6);const m=new THREE.Mesh(kg,new THREE.MeshStandardMaterial({color:pick([0x2f8a4a,0x3a9a3a,0x5a8a2a]),side:THREE.DoubleSide,roughness:.8}));m.scale.set(1,h,1);m.position.set(rnd(-26,26),BOT-.5,rnd(-5,-.5));kelp.push(m);scene.add(m);}
   for(const k of kelp){const mm=k.material;mm.onBeforeCompile=sh=>{sh.uniforms.uT=U.uT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(uT*1.3+position.y*3.+modelMatrix[3][0])*position.y*.35;');};}}
  {const sg=new THREE.PlaneGeometry(2.4,18);sg.translate(0,-9,0);const sm=new THREE.MeshBasicMaterial({color:0x6ad0ff,transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});for(let i=0;i<7;i++){const m=new THREE.Mesh(sg,sm);m.position.set(-18+i*6+rnd(-2,2),-.8,-3);m.rotation.z=.25;scene.add(m);}}
  // ---- fisher penguin ----
  const me=new Penguin({color:ctx.look.color,wear:ctx.look.wear,scale:1.2});me.pose='sit';me.group.position.set(-2.1,0,0);me.group.rotation.y=Math.PI/2*.6;scene.add(me.group);
  {const st=new THREE.Mesh(new THREE.CylinderGeometry(.45,.38,.6,14),new THREE.MeshStandardMaterial({color:0x8a5a3a}));st.position.set(-2.1,.3,0);scene.add(st);}
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.03,.06,3.2,6),new THREE.MeshStandardMaterial({color:0x3a2a20}));rod.position.set(-.9,2,0);rod.rotation.z=-1.05;scene.add(rod);
  const tip=new V3(.45,2.75,0);
  const lineG=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0,0],3));const line=new THREE.Line(lineG,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.8}));line.frustumCulled=false;scene.add(line);
  const hook=new THREE.Group();{const h=new THREE.Mesh(new THREE.TorusGeometry(.18,.04,6,12,Math.PI*1.3),new THREE.MeshStandardMaterial({color:0xc0c8d0,metalness:.9,roughness:.2}));h.rotation.z=Math.PI*.9;hook.add(h);
   const worm=new THREE.Mesh(new THREE.TorusGeometry(.14,.06,6,12,Math.PI*1.5),new THREE.MeshStandardMaterial({color:0xff7a8a,roughness:.6,emissive:0x401018}));worm.position.set(.05,-.12,0);hook.add(worm);hook.userData.worm=worm;
   const bob=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),new THREE.MeshStandardMaterial({color:0xff3030,roughness:.3}));bob.position.y=.8;hook.add(bob);}scene.add(hook);
  // ---- creatures ----
  const geos=TYPES.map(fishGeo),fmat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,envMapIntensity:1.2}),gmat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.2,metalness:.6,emissive:0xff9a00,emissiveIntensity:.7});
  const fish=[];const D=[{n:7,jelly:2,shark:22},{n:8,jelly:3,shark:15},{n:9,jelly:4,shark:10}][ctx.diff];
  function spawnFish(){let t=TYPES[0];const r=Math.random(),acc=[];let a=0;for(const T of TYPES){a+=T.w;acc.push(a);}const k=acc.findIndex(v=>r*a<v);t=TYPES[k<0?0:k];const dir=Math.random()<.5?1:-1;
   const m=new THREE.Mesh(geos[TYPES.indexOf(t)],t.gold?gmat:fmat);m.scale.setScalar(t.sz*1.6);scene.add(m);const f={t,m,dir,x:-dir*(22+rnd(6)),y:-lerp(t.dmin,t.dmax,Math.random()),z:rnd(-1.5,1.5),sp:t.sp*(.8+rnd(.4))*(1+ctx.diff*.12),ph:rnd(7),hooked:false,dead:false};fish.push(f);}
  for(let i=0;i<D.n;i++){spawnFish();fish[i].x=rnd(-18,18);}
  const jellyGeo=merge([[new THREE.SphereGeometry(.7,16,10,0,Math.PI*2,0,Math.PI/2),M(0,0,0,0,0,0,1,.8,1),0xff8ad8]]),tentG=new THREE.CylinderGeometry(.03,.01,1.6,4);tentG.translate(0,-.8,0);
  const jm=new THREE.MeshStandardMaterial({color:0xff8ad8,emissive:0xd040a0,emissiveIntensity:.8,transparent:true,opacity:.7,roughness:.2,vertexColors:true});
  const jellies=[];for(let i=0;i<D.jelly;i++){const g=new THREE.Group();g.add(new THREE.Mesh(jellyGeo,jm));for(let k=0;k<6;k++){const t=new THREE.Mesh(tentG,jm);t.position.set(Math.cos(k)*.4,0,Math.sin(k)*.4);g.add(t);}scene.add(g);jellies.push({g,x:rnd(-16,16),y:-rnd(3,12),vx:rnd(.6,1.4)*(Math.random()<.5?1:-1),ph:rnd(7)});}
  const crabG=merge([[new THREE.SphereGeometry(.5,14,10),M(0,0,0,0,0,0,1.3,.6,1),0xe0503a],[new THREE.SphereGeometry(.18,8,6),M(.75,.15,.3),0xe0503a],[new THREE.SphereGeometry(.18,8,6),M(-.75,.15,.3),0xe0503a],[new THREE.SphereGeometry(.08,6,4),M(.2,.4,.3),0x111111],[new THREE.SphereGeometry(.08,6,4),M(-.2,.4,.3),0x111111]]);
  const crab={m:new THREE.Mesh(crabG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5})),x:4,vx:1.6+ctx.diff*.5};crab.m.position.y=BOT+.1;scene.add(crab.m);
  const sharkG=merge([[new THREE.SphereGeometry(1,20,12),M(0,0,0,0,0,0,3,.9,.8),0x6a7a8a],[new THREE.SphereGeometry(.95,16,10),M(.3,-.25,0,0,0,0,2.6,.55,.7),0xd8e0e8],[new THREE.ConeGeometry(.6,1.4,4),M(0,1,0,0,0,-.3,1,1,.25),0x6a7a8a],[new THREE.ConeGeometry(.9,1.6,4),M(-3.3,0,0,0,0,Math.PI/2,1,1,.25),0x6a7a8a],[new THREE.SphereGeometry(.13,8,6),M(2.2,.25,.55),0x111111]]);
  const shark={m:new THREE.Mesh(sharkG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4})),on:false,x:0,y:-6,dir:1,warn:0,next:D.shark};shark.m.visible=false;scene.add(shark.m);
  const can={m:new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.5,12),new THREE.MeshStandardMaterial({color:0x5ad06a,metalness:.5,roughness:.3,emissive:0x1a5a20})),on:false,x:0,y:0,next:20};can.m.visible=false;scene.add(can.m);
  const bub=new Particles(scene,500,'normal'),spl=new Particles(scene,400,'normal');
  // ---- state ----
  let hy=-3,hx=.45,target=-3,carry=null,worms=3,score=0,combo=0,caught=0,lost=0,stun=0,t=0,pops=[],best=0;const counts={minnow:0,trout:0,grouper:0,golden:0};
  const pop=(txt,x,y,col)=>{pops.push({txt,p:new V3(x,y,0),t:1.2,col});};
  const inst={scene,camera:cam,score:0,particles:[bub,spl],post:{exposure:.85,bloomThreshold:1.4,bloom:.4},
   idle(dt){vis(dt);},
   update(dt,inp){t+=dt;
    // input: mouse Y maps to depth
    if(inp.mouse.ny!==undefined&&inp.mouse.moved!==false){const r=inp.ray(cam);if(Math.abs(r.direction.z)>1e-3){const k=-r.origin.z/r.direction.z,y=r.origin.y+r.direction.y*k;if(inp.mouse.ny!==inst._lny){target=cl(y,BOT+.3,-.2);inst._lny=inp.mouse.ny;}}}
    if(inp.up())target=Math.min(-.2,target+9*dt);if(inp.down())target=Math.max(BOT+.3,target-9*dt);
    const fast=inp.k('Space')||inp.mouse.down||inp.k('PadA');if(carry&&fast)target=Math.min(-.2,target+12*dt);
    const spd=(carry?(carry.t.heavy?3:5):8)*(fast&&carry?1.6:1)*(stun>0?.2:1);stun-=dt;hy+=cl(target-hy,-spd*dt,spd*dt);hx=.45+Math.sin(t*1.3)*.25;
    // fish
    for(const f of fish){if(f.hooked||f.dead)continue;f.x+=f.dir*f.sp*dt;f.y+=Math.sin(t*1.5+f.ph)*.3*dt;f.z=Math.sin(t*.4+f.ph)*1.2;if(Math.abs(f.x)>26){f.dead=true;}
     if(!carry&&worms>0&&hook.userData.worm.visible&&Math.abs(f.x-hx)<.55+f.t.sz*.6&&Math.abs(f.y-hy)<.35+f.t.sz*.4){f.hooked=true;carry=f;snd.play('bite');spl.burst(new V3(hx,hy,0),14,2,new THREE.Color(.8,.95,1),.3,.5,{});}}
    for(let i=fish.length-1;i>=0;i--)if(fish[i].dead){scene.remove(fish[i].m);fish.splice(i,1);}
    while(fish.filter(f=>!f.hooked).length<D.n+Math.floor(t/30))spawnFish();
    // jellyfish
    for(const j of jellies){j.x+=j.vx*dt;j.y+=Math.sin(t*1.2+j.ph)*1.1*dt;if(Math.abs(j.x)>20)j.vx*=-1;j.y=cl(j.y,-13,-2.2);
     if(carry&&Math.hypot(j.x-hx,j.y-(hy-.4))<1.1&&stun<=0){loseFish('ZAP! It got away');stun=1.2;}}
    // crab
    crab.x+=crab.vx*dt;if(Math.abs(crab.x)>8)crab.vx*=-1;if(hy<BOT+1.2&&Math.abs(crab.x-hx)<1&&hook.userData.worm.visible){stealWorm('A crab stole your worm!');}
    // shark
    shark.next-=dt;if(!shark.on&&shark.next<=0){shark.on=true;shark.dir=Math.random()<.5?1:-1;shark.x=-shark.dir*30;shark.y=-rnd(3,11);shark.warn=1.6;snd.play('buzz');ctx.msg('SHARK!','#ff6a5a',1.2);}
    if(shark.on){if(shark.warn>0)shark.warn-=dt;else{shark.x+=shark.dir*9*dt;if(Math.abs(shark.x)>32){shark.on=false;shark.next=D.shark+rnd(6);}if(Math.abs(shark.x-hx)<3&&Math.abs(shark.y-hy)<1.3){if(carry)loseFish('The shark took it!');stealWorm('...and your worm!');}}}
    // worm can
    can.next-=dt;if(!can.on&&can.next<=0){can.on=true;can.x=rnd(-6,6);can.y=0;}if(can.on){can.y-=1.4*dt;if(can.y<BOT){can.on=false;can.next=18+rnd(8);}if(Math.hypot(can.x-hx,can.y-hy)<.9){can.on=false;can.next=20+rnd(8);worms=Math.min(5,worms+1);snd.play('chime');pop('+1 WORM',hx,hy,'#8f8');if(!carry)hook.userData.worm.visible=true;}}
    // landing
    if(carry&&hy>-.6){const f=carry,mul=1+Math.min(4,combo)*.25,p=Math.round(f.t.pts*mul*(f.t.gold?1:1));score+=p;combo++;caught++;counts[f.t.k]++;best=Math.max(best,combo);carry=null;f.dead=true;f.m.visible=false;
     snd.play('splash');snd.play(f.t.gold?'coins':'coin',3);spl.burst(new V3(.5,.3,0),40,6,new THREE.Color(.85,.95,1),.5,.9,{up:true,grav:14});pop(`+${p}${combo>1?' ×'+mul.toFixed(2).replace(/0$/,'').replace(/\.0$/,''):''}`,1.5,1.2,f.t.gold?'#ffd84a':'#fff');me.play('cheer');
     flop.push({m:f.m.clone(),t:1.2,x:.5,vy:6,vx:2.5});scene.add(flop.at(-1).m);flop.at(-1).m.visible=true;}
    if(!carry&&!hook.userData.worm.visible&&worms>0&&hy>-.8){hook.userData.worm.visible=true;}
    if(worms<=0&&!carry){inst.done=true;inst.doneReason='worms';inst.endText='OUT OF WORMS!';}
    inst.score=score;vis(dt);},
   hud(){const pp=pops.map(p=>{const s=toScreen(p.p,cam,innerWidth,innerHeight);return `<div class="mgp" style="left:${s.x}px;top:${s.y-(1.2-p.t)*40}px;transform:translate(-50%,-50%);font:400 1.6rem Anton,Impact,sans-serif;color:${p.col};opacity:${Math.min(1,p.t*2)}">${p.txt}</div>`;}).join('');
    ctx.hud.innerHTML=`<div class="mgpanel" style="left:18px;top:16px"><b>WORMS</b> <span class="hearts" style="color:#ff7a8a">${'●'.repeat(Math.max(0,worms))}<span style="opacity:.25">${'●'.repeat(Math.max(0,3-worms))}</span></span><br>COMBO ×${combo} · CAUGHT ${caught}${carry?`<br><span style="color:#ffe09a">HOOKED: ${carry.t.k.toUpperCase()} - REEL UP!</span>`:''}</div>${pp}`;},
   result(){const md=score>=70?3:score>=40?2:score>=18?1:0;return{score,medal:md,coins:Math.round(score*.75)+3,stats:[['Fish landed',caught],['Minnow · trout · grouper',`${counts.minnow} · ${counts.trout} · ${counts.grouper}`],['Golden fish',counts.golden],['Best combo',best],['Fish lost',lost],['Worms left',worms]],sub:inst.doneReason==='worms'?'OUT OF WORMS':'SHIFT OVER'};},
   cheat:{win(){score=80;caught=20;},lose(){worms=0;carry=null;}},get worms(){return worms;},get carry(){return carry;},get hook(){return{x:hx,y:hy};},fish,setTarget(y){target=y;}};
  const flop=[];
  function loseFish(msg){if(!carry)return;carry.hooked=false;carry.dir=Math.random()<.5?1:-1;carry.sp*=1.6;carry=null;combo=0;lost++;snd.play('miss');ctx.msg(msg,'#ff9a8a',1);}
  function stealWorm(msg){if(!hook.userData.worm.visible)return;hook.userData.worm.visible=false;worms--;combo=0;snd.play('buzz');ctx.msg(msg,'#ff9a8a',1.1);if(carry){loseFish(msg);} }
  function vis(dt){U.uT.value+=dt;for(const m of [iceM,snowTop.material])m.userData.U.uT.value=U.uT.value;
   hook.position.set(hx,hy,0);hook.children[2].position.y=Math.max(.8,-hy+.05);const lp=lineG.attributes.position;lp.setXYZ(0,tip.x,tip.y,tip.z);lp.setXYZ(1,hx,hy+.2,0);lp.needsUpdate=true;
   for(const f of fish){if(f.hooked){f.x=hx+Math.sin(U.uT.value*14)*.15;f.y=hy-.25-f.t.sz*.5;f.z=0;f.m.rotation.set(0,0,Math.PI/2+Math.sin(U.uT.value*16)*.4);}else{f.m.rotation.set(0,f.dir>0?0:Math.PI,Math.sin(U.uT.value*6+f.ph)*.08);}
    f.m.position.set(f.x,f.y,f.z);}
   for(const j of jellies){j.g.position.set(j.x,j.y,-.5);const k=1+Math.sin(U.uT.value*3+j.ph)*.15;j.g.children[0].scale.set(k,1/k,k);}
   crab.m.position.x=crab.x;crab.m.rotation.z=Math.sin(U.uT.value*10)*.08;
   shark.m.visible=shark.on&&shark.warn<=0;shark.m.position.set(shark.x,shark.y,.3);shark.m.rotation.y=shark.dir>0?0:Math.PI;
   can.m.visible=can.on;can.m.position.set(can.x,can.y,0);can.m.rotation.z+=dt;
   for(let i=flop.length-1;i>=0;i--){const f=flop[i];f.t-=dt;f.vy-=18*dt;f.x+=f.vx*dt;f.m.position.set(f.x,Math.max(.3,f.m.position.y+f.vy*dt),0);f.m.rotation.z+=dt*8;if(f.t<=0){scene.remove(f.m);flop.splice(i,1);}}
   if(Math.random()<dt*14)bub.emit(rnd(-20,20),BOT,rnd(-4,2),0,rnd(1,2),0,.8,.95,1,.18,6,-.05,.1);bub.update(dt);spl.update(dt);
   for(let i=pops.length-1;i>=0;i--){pops[i].t-=dt;if(pops[i].t<=0)pops.splice(i,1);}
   rod.rotation.z=-1.05+(carry?Math.sin(U.uT.value*12)*.05-.1:0);me.update(dt,0);me.fl[0].rotation.x=-1.2;me.fl[1].rotation.x=-1.2;
   cam.position.y=damp(cam.position.y,-3.8+cl(hy+6,-5,5)*.16,2,dt);cam.lookAt(0,cam.position.y-.4,0);}
  return inst;}};
