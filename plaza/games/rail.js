// RAIL RIDER — a mine-cart dash through a glowing ice cave: switch rails, jump gaps, duck beams, grab coins.
import {THREE,V3,Particles,baseScene,ctex,toScreen} from './common.js';
import {Penguin} from '../penguin.js';
import {merge,M,cl,rnd,pick,damp,rng} from '../util.js';
const LX=[-2.2,0,2.2],SEG=24;
export default{id:'rail',name:'RAIL RIDER',room:'light',time:75,music:'race',medals:[500,1000,1500],
 desc:'Ride a mine cart through the glimmering ice caves. Switch rails, jump gaps and barriers, duck under beams and grab coins.',
 long:'Your cart speeds up the longer you ride. Hop between the three rails to dodge blocked tracks, jump over barriers and missing rail, and duck under low beams. Coins are worth 5 points, blue gems give a speed burst and 25 points. Crashing costs a heart - lose all three and you wipe out.',
 keys:[['Switch rail','A D · ← →'],['Jump','W · ↑ · Space'],['Duck','S · ↓'],['Score','distance + coins ×5 + gems ×25']],
 create(ctx){const{R,snd}=ctx;const B=baseScene(R,{sky:false,bg:0x050a14,fog:0x0a1830,fogD:.022,hs:0x6aa0ff,hg:0x101828,hi:.8,sunCol:0xa0c8ff,si:.9,sunDir:new V3(.3,1,.4).normalize(),shadow:false});
  const{scene,cam}=B;cam.fov=62;
  // curved-world bend shared by every material in this scene
  const BU={uBx:{value:0},uBy:{value:0}};
  const bend=m=>{const prev=m.onBeforeCompile;m.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);Object.assign(sh.uniforms,BU);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uBx,uBy;').replace('#include <project_vertex>',`vec4 mvPosition=vec4(transformed,1.);
   #ifdef USE_INSTANCING
   mvPosition=instanceMatrix*mvPosition;
   #endif
   mvPosition=modelViewMatrix*mvPosition;float bz=min(0.,mvPosition.z);mvPosition.x+=uBx*bz*bz;mvPosition.y+=uBy*bz*bz;gl_Position=projectionMatrix*mvPosition;`);};m.customProgramCacheKey=()=>'bend'+(m.vertexColors?1:0)+(m.map?1:0);return m;};
  const std=(o)=>bend(new THREE.MeshStandardMaterial(o)),basic=(o)=>bend(new THREE.MeshBasicMaterial(o));
  // ---- tunnel segments (recycled) ----
  const segGeo=(()=>{const L=[];const tex=null;void tex;
   for(let i=0;i<10;i++){const a=Math.PI*(i/9);L.push([new THREE.BoxGeometry(2.2,2.2,SEG),M(Math.cos(a)*8.6,Math.sin(a)*7.2-.6,-SEG/2,0,0,a+Math.PI/2,1,1,1),i%2?0x3a5a7a:0x34506e]);}
   L.push([new THREE.BoxGeometry(18,.6,SEG),M(0,-.6,-SEG/2),0x2a3a4e]);
   for(let k=0;k<8;k++)L.push([new THREE.BoxGeometry(7.2,.16,.5),M(0,-.22,-k*3-1),0x5a4030]);
   for(const x of LX)for(const s of[-.55,.55])L.push([new THREE.BoxGeometry(.12,.14,SEG),M(x+s,-.06,-SEG/2),0x9aa4b4]);
   for(const sx of[-1,1]){L.push([new THREE.BoxGeometry(.5,6,.5),M(sx*6.5,2.2,-2),0x5a4030],[new THREE.BoxGeometry(13.5,.5,.5),M(0,5.2,-2),0x5a4030]);}
   return merge(L);})();
  const crysG=(()=>{const L=[];const r=rng(3);for(let i=0;i<14;i++){const sd=r()<.5?-1:1,a=r()*Math.PI*.8+.1;L.push([new THREE.OctahedronGeometry(.22+r()*.35,0),M(Math.cos(a)*7.6*sd,Math.sin(a)*6.6-.2,-r()*SEG,r(),r(),r(),1,1.8+r(),1),[0x60d0ff,0xa080ff,0x60ffd0][i%3]]);}return merge(L);})();
  const segM=std({vertexColors:true,roughness:.6,metalness:.1}),crysM=basic({vertexColors:true,color:new THREE.Color(1.6,1.6,1.8)});
  const segs=[];for(let i=0;i<9;i++){const g=new THREE.Group();g.add(new THREE.Mesh(segGeo,segM));const c=new THREE.Mesh(crysG,crysM);c.rotation.z=i%2?Math.PI*0:0;c.scale.x=i%2?-1:1;g.add(c);
   const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),basic({color:new THREE.Color(3,2,1)}));lamp.position.set(0,4.85,-2);g.add(lamp);scene.add(g);segs.push({g,z:-i*SEG+SEG});}
  const lights=[0,1,2].map(()=>{const l=new THREE.PointLight(0xffb070,18,22,1.6);scene.add(l);return l;});
  // ---- obstacles + pickups (instanced pools) ----
  const pool=(geo,mat,n)=>{const m=new THREE.InstancedMesh(geo,mat,n);m.count=0;m.frustumCulled=false;scene.add(m);return m;};
  const barG=merge([[new THREE.BoxGeometry(1.6,.9,.3),M(0,.45,0),0xd8383e],[new THREE.BoxGeometry(1.6,.18,.32),M(0,.55,0),0xffffff],[new THREE.BoxGeometry(.18,.9,.32),M(-.7,.45,0),0x333333],[new THREE.BoxGeometry(.18,.9,.32),M(.7,.45,0),0x333333]]);
  const beamG=merge([[new THREE.BoxGeometry(2,.4,.4),M(0,1.85,0),0xffc83a],[new THREE.BoxGeometry(2,.12,.42),M(0,1.85,0),0x222222],[new THREE.BoxGeometry(.2,2.1,.2),M(-.95,1,0),0x5a4030],[new THREE.BoxGeometry(.2,2.1,.2),M(.95,1,0),0x5a4030]]);
  const blockG=merge([[new THREE.BoxGeometry(1.9,1.8,2.4),M(0,.9,0),0x6a5040],[new THREE.BoxGeometry(1.95,.2,2.45),M(0,1.2,0),0x9aa4b4],[new THREE.BoxGeometry(1.95,.2,2.45),M(0,.5,0),0x9aa4b4]]);
  const gapG=new THREE.PlaneGeometry(1.8,3.2);gapG.rotateX(-Math.PI/2);
  const coinG=new THREE.CylinderGeometry(.32,.32,.08,16);coinG.rotateX(Math.PI/2);const gemG=new THREE.OctahedronGeometry(.42,0);
  const P={bar:pool(barG,std({vertexColors:true,roughness:.5}),40),beam:pool(beamG,std({vertexColors:true,roughness:.5}),40),block:pool(blockG,std({vertexColors:true,roughness:.6}),40),gap:pool(gapG,basic({color:0x000000}),30),
   coin:pool(coinG,std({color:0xffc83a,metalness:.9,roughness:.25,emissive:0xff9a00,emissiveIntensity:.6}),120),gem:pool(gemG,basic({color:new THREE.Color(.6,1.8,3)}),20),heart:pool(new THREE.SphereGeometry(.35,10,8),basic({color:new THREE.Color(3,.6,.8)}),6)};
  const items=[];const r=rng(100+ctx.diff*7);let genZ=-40;
  function gen(){// pattern generator; ahead of the cart in -z
   const z=genZ,k=r(),diffK=Math.min(1,dist/1400)+ctx.diff*.15;
   if(k<.22){const l=r()*3|0;items.push({z,lane:l,type:'bar'});if(r()<diffK)items.push({z,lane:(l+1+(r()*2|0))%3,type:'bar'});}
   else if(k<.42){const l=r()*3|0;items.push({z,lane:l,type:'beam'});if(r()<diffK*.7)items.push({z,lane:(l+1)%3,type:'beam'});}
   else if(k<.64){const open=r()*3|0;for(let l=0;l<3;l++)if(l!==open&&(r()<.55+diffK*.4||l===(open+1)%3))items.push({z,lane:l,type:'block'});for(let i=0;i<5;i++)items.push({z:z+4-i*1.6,lane:open,type:'coin'});}
   else if(k<.76){const l=r()*3|0;items.push({z,lane:l,type:'gap'});items.push({z:z-1.4,lane:l,type:'coin',y:1.8});}
   else{const l=r()*3|0;for(let i=0;i<7;i++)items.push({z:z-i*1.6,lane:l,type:'coin',y:i>1&&i<5?.9:.6});if(r()<.35)items.push({z:z-13,lane:(l+1)%3,type:'gem'});if(r()<.06)items.push({z:z-8,lane:(l+2)%3,type:'heart'});}
   genZ-=Math.max(11,22-diffK*8)+r()*8;}
  // ---- cart + penguin ----
  const cart=new THREE.Group();{const body=new THREE.Mesh(merge([[new THREE.BoxGeometry(1.5,.9,2),M(0,.75,0),0x7a5a3a],[new THREE.BoxGeometry(1.6,.12,2.1),M(0,1.2,0),0x9aa4b4],[new THREE.BoxGeometry(1.6,.12,2.1),M(0,.4,0),0x9aa4b4]]),std({vertexColors:true,roughness:.5,metalness:.4}));cart.add(body);
   const wg=new THREE.CylinderGeometry(.28,.28,.14,14);wg.rotateZ(Math.PI/2);for(const x of[-.55,.55])for(const z of[-.6,.6]){const w=new THREE.Mesh(wg,std({color:0x333338,metalness:.8,roughness:.3}));w.position.set(x,.28,z);cart.add(w);}}
  const me=new Penguin({color:ctx.look.color,wear:ctx.look.wear,scale:1.05});me.group.position.y=.55;me.group.rotation.y=Math.PI;cart.add(me.group);me.group.traverse(n=>{if(!n.isMesh||!n.material||n.material===me.mat||n.material.userData.bent)return;n.material=n.material.clone();bend(n.material);n.material.userData.bent=1;});bend(me.mat);me.mat.customProgramCacheKey=()=>'bendpeng';me.mat.userData.bent=1;
  scene.add(cart);
  const parts=new Particles(scene,900,'add'),dust=new Particles(scene,400,'normal');
  // ---- state ----
  let z=0,v=15,lane=1,lx=0,y=0,vy=0,duck=0,hearts=3,inv=0,coins=0,gems=0,dist=0,t=0,boost=0,crashes=0,pops=[],sparkT=0;
  while(genZ>-300)gen();
  const inst={scene,camera:cam,score:0,particles:[parts,dust],post:{exposure:1.05,bloomThreshold:1,bloom:.65,bloomRadius:.55},
   idle(dt){vis(dt);},
   update(dt,inp){t+=dt;
    if(inp.e('KeyA')||inp.e('ArrowLeft')||inp.e('GpLeft')){if(lane>0){lane--;snd.play('whoosh');}}if(inp.e('KeyD')||inp.e('ArrowRight')||inp.e('GpRight')){if(lane<2){lane++;snd.play('whoosh');}}
    if((inp.e('KeyW')||inp.e('ArrowUp')||inp.e('Space')||inp.e('PadA')||inp.e('GpUp'))&&y<=0.01){vy=9.5;duck=0;snd.play('jump');}
    if(inp.e('KeyS')||inp.e('ArrowDown')||inp.e('GpDown')){duck=.75;if(y>0)vy=Math.min(vy,-12);snd.play('whoosh');}
    duck=Math.max(0,duck-dt);vy-=26*dt;y=Math.max(0,y+vy*dt);if(y<=0&&vy<-1){vy=0;sparks(10);}
    const target=17+Math.min(22,t*.38)+ctx.diff*2.5;v=damp(v,target+(boost>0?12:0),inv>1.2?6:1.2,dt);boost-=dt;inv-=dt;z-=v*dt;dist+=v*dt;lx=damp(lx,LX[lane],14,dt);
    while(genZ>z-300)gen();
    // collisions
    for(const it of items){if(it.done)continue;const dz=it.z-z;if(dz>3){it.done=true;continue;}if(Math.abs(dz)>.9)continue;const same=Math.abs(LX[it.lane]-lx)<1.1;if(!same)continue;
     if(it.type==='coin'){if(Math.abs((it.y??.6)-(y+.6))<1.3){it.done=true;coins++;snd.play('coin');parts.burst(new V3(LX[it.lane],(it.y??.6),it.z),8,4,new THREE.Color(2.4,1.8,.4),.25,.4,{});}}
     else if(it.type==='gem'){it.done=true;gems++;boost=2.2;snd.play('boost');ctx.msg('BOOST!','#8ad8ff',.8);parts.burst(new V3(LX[it.lane],.9,it.z),30,6,new THREE.Color(.6,1.6,3),.35,.6,{});}
     else if(it.type==='heart'){it.done=true;hearts=Math.min(3,hearts+1);snd.play('chime');}
     else if(inv<=0){let hit=false;if(it.type==='bar')hit=y<.95;else if(it.type==='beam')hit=duck<=0&&y<2.4||y>.6;else if(it.type==='block')hit=y<1.9;else if(it.type==='gap')hit=y<.3&&Math.abs(dz)<.6;
      if(hit){it.done=true;crash();}else if(it.type!=='gap'&&!it.cleared){it.cleared=true;if(it.type==='bar'&&y>.95){pops.push({txt:'NICE HOP!',p:new V3(lx,2.4,z),t:.8,col:'#9ad0ff'});}}}}
    for(let i=items.length-1;i>=0;i--)if(items[i].done&&items[i].z>z+5)items.splice(i,1);
    sparkT-=dt;if(sparkT<=0){sparkT=.05;if(y<=0)sparks(2);if(Math.random()<.2)snd.play('rail');}
    if(hearts<=0){inst.done=true;inst.doneReason='wipeout';inst.endText='WIPEOUT!';}
    inst.score=Math.round(dist/2)+coins*5+gems*25;vis(dt);},
   hud(){const W=innerWidth,H=innerHeight;ctx.hud.innerHTML=`<div class="mgpanel" style="left:18px;top:16px"><span class="hearts">${'♥'.repeat(Math.max(0,hearts))}<span style="opacity:.25">${'♥'.repeat(Math.max(0,3-hearts))}</span></span><br>${Math.round(dist)} M · ${Math.round(v*3.6)} KM/H<br>● ${coins} · ◆ ${gems}</div>`+
    pops.map(p=>{const s=toScreen(p.p,cam,W,H);return `<div class="mgp" style="left:${s.x}px;top:${s.y}px;transform:translate(-50%,-50%);font:400 1.4rem Anton,Impact,sans-serif;color:${p.col};opacity:${Math.min(1,p.t*2)}">${p.txt}</div>`;}).join('');},
   result(){const s=Math.round(dist/2)+coins*5+gems*25;const md=s>=1500?3:s>=1000?2:s>=500?1:0;return{score:s,medal:md,coins:Math.round(s/28)+3,title:inst.doneReason==='wipeout'?'WIPEOUT!':undefined,stats:[['Distance',Math.round(dist)+' m'],['Coins',coins],['Gems',gems],['Crashes',crashes],['Hearts left',Math.max(0,hearts)]],sub:inst.doneReason==='wipeout'?'OUT OF HEARTS':'MADE IT OUT'};},
   cheat:{win(){dist=3200;coins=60;},lose(){hearts=0;}},get state(){return{z,lane,y,duck,hearts,dist,coins,v};},items,setLane(l){lane=l;}};
  function crash(){hearts--;crashes++;inv=2;v*=.45;snd.play('crash');me.play('hit');ctx.msg(hearts>0?'OUCH!':'WIPEOUT!','#ff7a6a',.8);dust.burst(new V3(lx,1,z-1),40,6,new THREE.Color(.7,.8,.9),.6,.8,{up:true,grav:6});}
  function sparks(n){for(let i=0;i<n;i++)parts.emit(lx+(Math.random()<.5?-.55:.55),.05,z+.7,rnd(-1.5,1.5),rnd(1,3),rnd(1,4),3,1.6,.4,.12,.3,9,1);}
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),one=new V3(1,1,1),tv=new V3();
  function vis(dt){const tt=performance.now()/1000;BU.uBx.value=Math.sin(t*.13)*.0028+Math.sin(t*.051)*.0014;BU.uBy.value=Math.sin(t*.09+1)*.0012-.0006;
   for(const s of segs){if(s.z>z+SEG+6)s.z-=segs.length*SEG;s.g.position.z=s.z;}
   const ls=segs.slice().sort((a,b)=>Math.abs(a.z-z+20)-Math.abs(b.z-z+20));lights.forEach((l,i)=>{l.position.set(0,4.4,ls[i].z-2);});
   const cnt={bar:0,beam:0,block:0,gap:0,coin:0,gem:0,heart:0};
   for(const it of items){if(it.done||it.z<z-160)continue;const pm=P[it.type];const i=cnt[it.type]++;if(i>=pm.instanceMatrix.count)continue;
    if(it.type==='coin'||it.type==='gem'||it.type==='heart'){q.setFromAxisAngle(new V3(0,1,0),tt*3+it.z);m4.compose(tv.set(LX[it.lane],(it.y??.6)+(it.type!=='coin'?.4+Math.sin(tt*3)*.1:0),it.z),q,one);}
    else m4.compose(tv.set(LX[it.lane],it.type==='gap'?-.02:0,it.z),q.identity(),one);pm.setMatrixAt(i,m4);}
   for(const k in P){P[k].count=cnt[k];P[k].instanceMatrix.needsUpdate=true;}
   cart.position.set(lx,y,z);cart.rotation.z=(LX[lane]-lx)*-.12;cart.rotation.x=vy*.012;cart.visible=inv<=0||Math.floor(inv*10)%2===0;
   me.pose=duck>0?'crouch':'stand';me.update(dt,0);if(duck<=0&&y<=0){me.fl[0].rotation.z=.9;me.fl[1].rotation.z=-.9;}
   parts.update(dt);dust.update(dt);for(let i=pops.length-1;i>=0;i--){pops[i].t-=dt;if(pops[i].t<=0)pops.splice(i,1);}
   cam.position.set(lx*.6,3.6+y*.35,z+6.2);cam.lookAt(lx*.4,1.2,z-8);cam.fov=damp(cam.fov,60+v*.32+(boost>0?8:0),3,dt);cam.updateProjectionMatrix();}
  return inst;}};
