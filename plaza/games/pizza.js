// PIZZA RUSH — build fishy pizzas to order, bake them golden, serve hungry penguins before they lose patience.
import {THREE,V3,Particles,baseScene,ctex,textSprite,toScreen} from './common.js';
import {Penguin} from '../penguin.js';
import {merge,M,cl,rnd,pick,damp,lerp} from '../util.js';
import {BODY_COLORS,WEAR} from '../items.js';
const ING=[{k:'sauce',n:'Sauce',e:'🍅',key:'1'},{k:'cheese',n:'Cheese',e:'🧀',key:'2'},{k:'fish',n:'Fish',e:'🐟',key:'3'},{k:'shrimp',n:'Shrimp',e:'🦐',key:'4'},{k:'kelp',n:'Kelp',e:'🌿',key:'5'},{k:'squid',n:'Squid',e:'🦑',key:'6'}];
const TOPS=['fish','shrimp','kelp','squid'];
export default{id:'pizza',name:'PIZZA RUSH',room:'coffee',time:90,music:'cozy',medals:[50,120,200],
 desc:'Build fishy pizzas to order, bake them golden in the oven and serve hungry customers before their patience runs out.',
 long:'Customers order pizzas at the counter. Add the exact toppings they asked for, slide the pizza into the oven and pull it out when the bar is in the golden zone. Then serve it to the right customer. Wrong pizzas, burnt pizzas and customers who give up count as strikes - four strikes and the shift is over.',
 keys:[['Add ingredient','1-6 · click a tub'],['Bake / take out','Space · O · click the oven'],['Serve customer','Q W E · click the customer'],['Bin the pizza','X · Backspace · click the bin']],
 create(ctx){const{R,snd}=ctx;const B=baseScene(R,{sky:false,bg:0x2a1a14,fog:0x2a1a14,fogD:.02,hs:0xffe0c0,hg:0x6a4030,hi:.9,sunCol:0xfff0dc,si:1.6,sunDir:new V3(.3,1,.6).normalize(),shadowSize:12});
  const{scene,cam}=B;cam.fov=44;cam.position.set(0,7.4,10.4);cam.lookAt(0,1.4,-.4);
  // ---- kitchen ----
  const floorT=ctex(128,128,(x,w,h)=>{for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#e8dcc8':'#3a3040';x.fillRect(i*32,j*32,32,32);}});floorT.repeat.set(10,10);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({map:floorT,roughness:.4}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;scene.add(fl);
  const wallT=ctex(128,128,(x,w,h)=>{x.fillStyle='#f4ecdc';x.fillRect(0,0,w,h);x.strokeStyle='#d8ccb4';x.lineWidth=3;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*32);x.lineTo(w,i*32);x.stroke();x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32,h);x.stroke();}});wallT.repeat.set(12,4);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(40,12),new THREE.MeshStandardMaterial({map:wallT,roughness:.5}));wall.position.set(0,6,-6.5);wall.receiveShadow=true;scene.add(wall);
  const L=[];const P=(g,x,y,z,c,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>L.push([g,M(x,y,z,rx,ry,rz,sx,sy,sz),c]);
  P(new THREE.BoxGeometry(15,1.3,1.4),0,.65,-1.6,0x8a4a2a);P(new THREE.BoxGeometry(18,.6,2.4),0,.3,-3.6,0x5a3a2a);P(new THREE.BoxGeometry(15.4,.14,1.7),0,1.34,-1.6,0xe8dcc8);
  P(new THREE.BoxGeometry(15,1,4.6),0,.5,1.7,0x6a4a3a);P(new THREE.BoxGeometry(15.4,.12,4.9),0,1.04,1.7,0xc8c0b8);
  for(let i=0;i<5;i++)P(new THREE.BoxGeometry(2.6,.1,.6),-6+i*3,4.2,-6.2,0x8a5a3a);for(let i=0;i<14;i++)P(new THREE.CylinderGeometry(.18,.18,.5,10),-6.6+i*.95+rnd(.2),4.52,-6.2,pick([0xd84a3a,0xf2c230,0x5ab05a,0xe8e0d0]));
  P(new THREE.BoxGeometry(4,2.6,.2),-3.5,7.4,-6.35,0x6a4a3a);
  const kitchen=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}));kitchen.castShadow=kitchen.receiveShadow=true;scene.add(kitchen);
  {const win=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.2),new THREE.MeshBasicMaterial({color:new THREE.Color(.7,.85,1.2)}));win.position.set(-3.5,7.4,-6.2);scene.add(win);
   const sg=textSprite('PIZZA RUSH',{size:64,bg:'rgba(200,60,30,.95)',scale:1.1});sg.position.set(3.6,7.6,-6.2);scene.add(sg);}
  // oven
  const oven=new THREE.Group();{const bt=ctex(128,64,(x,w,h)=>{x.fillStyle='#8a4a3a';x.fillRect(0,0,w,h);x.fillStyle='#a85a44';for(let r=0;r<4;r++)for(let c=0;c<5;c++)x.fillRect(c*26+(r%2)*13+2,r*16+2,22,12);});bt.repeat.set(3,2);
   const dome=new THREE.Mesh(new THREE.SphereGeometry(1.7,24,14,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({map:bt,roughness:.85}));dome.castShadow=true;oven.add(dome);
   const mouth=new THREE.Mesh(new THREE.CircleGeometry(.85,20,0,Math.PI),new THREE.MeshBasicMaterial({color:new THREE.Color(3,1.2,.3)}));mouth.position.set(0,.02,1.62);oven.add(mouth);oven.userData.mouth=mouth;
   const base=new THREE.Mesh(new THREE.CylinderGeometry(1.8,1.8,.2,24),new THREE.MeshStandardMaterial({color:0x5a3a30}));oven.add(base);}
  oven.position.set(5.3,1.1,.3);scene.add(oven);const ovenLight=new THREE.PointLight(0xff8030,6,8,1.5);ovenLight.position.set(5.3,1.8,2);scene.add(ovenLight);
  const trash=new THREE.Mesh(new THREE.CylinderGeometry(.55,.45,.9,16),new THREE.MeshStandardMaterial({color:0x5a6070,metalness:.6,roughness:.3}));trash.position.set(-6.1,1.5,.6);scene.add(trash);
  {const ts=textSprite('BIN · X',{size:40,bg:'rgba(20,20,30,.8)',scale:.45});ts.position.set(-6.1,2.35,.6);scene.add(ts);}
  // ingredient tubs
  const tubs=[];const fillC={sauce:0xd83a2a,cheese:0xffd84a,fish:0xff9a4a,shrimp:0xff8aa0,kelp:0x3aa04a,squid:0xe8e0f0};
  ING.forEach((g,i)=>{const x=-5+i*2;const tub=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.75,.65,.5,20),new THREE.MeshStandardMaterial({color:0xd8dce4,metalness:.7,roughness:.25}));tub.add(b);
   const f=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,.06,20),new THREE.MeshStandardMaterial({color:fillC[g.k],roughness:.6}));f.position.y=.22;tub.add(f);tub.position.set(x,1.3,3.45);scene.add(tub);
   const lb=textSprite(`${g.key} ${g.n.toUpperCase()}`,{size:40,bg:'rgba(20,20,30,.85)',scale:.42});lb.position.set(x,1.95,3.9);scene.add(lb);tubs.push({g,tub,x});});
  // ---- pizza ----
  const topGeo={fish:merge([[new THREE.SphereGeometry(.12,8,6),M(0,0,0,0,0,0,1.6,.4,.8),0xff9a4a]]),shrimp:merge([[new THREE.TorusGeometry(.09,.045,6,10,Math.PI*1.4),M(0,0,0,Math.PI/2,0,0),0xff8aa0]]),kelp:merge([[new THREE.SphereGeometry(.13,6,4),M(0,0,0,0,0,0,1.4,.2,.6),0x3aa04a]]),squid:merge([[new THREE.TorusGeometry(.09,.04,6,12),M(0,0,0,Math.PI/2,0,0),0xf0e8f8]])};
  const pz=new THREE.Group();const doughM=new THREE.MeshStandardMaterial({color:0xf0d8a8,roughness:.8});
  const dough=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,.1,32),doughM);pz.add(dough);const crust=new THREE.Mesh(new THREE.TorusGeometry(1.12,.1,8,32),doughM);crust.rotation.x=Math.PI/2;crust.position.y=.05;pz.add(crust);
  const sauceM=new THREE.MeshStandardMaterial({color:0xc8301e,roughness:.4}),cheeseM=new THREE.MeshStandardMaterial({color:0xffd860,roughness:.5});
  const sauce=new THREE.Mesh(new THREE.CylinderGeometry(1.02,1.02,.02,32),sauceM);sauce.position.y=.06;pz.add(sauce);
  const chG=new THREE.CylinderGeometry(.98,.98,.03,32,1);const cheese=new THREE.Mesh(chG,cheeseM);cheese.position.y=.085;pz.add(cheese);
  const topMeshes={};for(const k of TOPS){const im=new THREE.InstancedMesh(topGeo[k],new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5}),15);im.count=0;im.position.y=.12;pz.add(im);topMeshes[k]=im;}
  pz.traverse(n=>{if(n.isMesh)n.castShadow=true;});scene.add(pz);const board=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,.06,32),new THREE.MeshStandardMaterial({color:0xb07a50,roughness:.7}));board.position.set(0,1.12,1.5);scene.add(board);
  // ---- customers ----
  const SLOTX=[-4.2,0,4.2];const cust=[null,null,null];
  const D=[{pat:34,gap:7,strikes:5,maxTop:2,maxCnt:2},{pat:28,gap:5.5,strikes:4,maxTop:3,maxCnt:3},{pat:22,gap:4.2,strikes:4,maxTop:3,maxCnt:3}][ctx.diff];
  const parts=new Particles(scene,500,'normal'),glit=new Particles(scene,300,'add');
  let t=0,score=0,served=0,strikes=0,spawnT=1.2,state='build',bake=0,cur=null,perfect=0,burnt=0,lastTip=0,orders=0,pops=[];
  const newPizza=()=>({sauce:0,cheese:0,tops:{fish:0,shrimp:0,kelp:0,squid:0}});cur=newPizza();
  function makeOrder(){orders++;const lvl=Math.min(1,t/60),nt=1+Math.floor(Math.random()*(1+lvl*(D.maxTop-1)+.3)),tops={};const pool=TOPS.slice().sort(()=>Math.random()-.5);
   for(let i=0;i<Math.min(nt,D.maxTop);i++)tops[pool[i]]=1+Math.floor(Math.random()*Math.min(D.maxCnt,1+lvl*D.maxCnt));return{sauce:1,cheese:Math.random()<.8?1:0,tops};}
  function spawnCust(i){const pg=new Penguin({color:pick(BODY_COLORS).hex,wear:{hat:Math.random()<.7?pick(WEAR.filter(w=>w.slot==='hat')).id:null,neck:Math.random()<.5?pick(WEAR.filter(w=>w.slot==='neck')).id:null},scale:1.3});
   pg.group.position.set(SLOTX[i]+(i===0?-6:i===2?6:-8),.6,-3.4);scene.add(pg.group);const hit=new THREE.Mesh(new THREE.BoxGeometry(2.4,2.6,1.6),new THREE.MeshBasicMaterial({visible:false}));hit.position.set(SLOTX[i],2.1,-3.2);scene.add(hit);
   cust[i]={pg,hit,order:makeOrder(),pat:D.pat*(1-Math.min(.35,t/200)),max:0,leave:0,mood:0,x:pg.group.position.x};cust[i].max=cust[i].pat;}
  function leave(i,mood){const c=cust[i];if(!c||c.leave)return;c.leave=1;c.mood=mood;c.pg.play(mood>0?'cheer':'sad');}
  function add(k){if(state!=='build')return;if(k==='sauce')cur.sauce=Math.min(1,cur.sauce+1);else if(k==='cheese')cur.cheese=Math.min(1,cur.cheese+1);else cur.tops[k]=Math.min(5,cur.tops[k]+1);snd.play('chop');
   const tb=tubs.find(x=>x.g.k===k);if(tb){tb.tub.position.y=1.2;parts.burst(new V3(tb.x,1.7,3.45),6,2,new THREE.Color(fillC[k]),.25,.4,{up:true,grav:8});}drawPizza();}
  function drawPizza(){sauce.visible=cur.sauce>0;cheese.visible=cur.cheese>0;const m4=new THREE.Matrix4(),q=new THREE.Quaternion();
   for(const k of TOPS){const im=topMeshes[k],n=cur.tops[k]*3;im.count=n;let s=TOPS.indexOf(k)*7.7;for(let j=0;j<n;j++){const a=s+j*2.39996,r=.25+((j*37+TOPS.indexOf(k)*13)%10)/10*.6;q.setFromAxisAngle(new V3(0,1,0),a*3);m4.compose(new V3(Math.cos(a)*r,.0,Math.sin(a)*r),q,new V3(1,1,1));im.setMatrixAt(j,m4);}im.instanceMatrix.needsUpdate=true;}}
  function bakeAct(){if(state==='build'){if(!cur.sauce&&!cur.cheese&&!TOPS.some(k=>cur.tops[k])){ctx.msg('ADD SOME TOPPINGS FIRST','#ffb38a',.8);return;}state='bake';bake=0;snd.play('sizzle');}
   else if(state==='bake'){state='ready';snd.play('oven');const q=quality();ctx.msg(q==='burnt'?'BURNT!':q==='raw'?'DOUGHY...':bake>=.85?'PERFECT BAKE!':'GOLDEN!',q==='golden'?'#ffe09a':'#ff9a7a',.9);}}
  const quality=()=>bake>1.05?'burnt':bake<.72?'raw':'golden';
  function serve(i){if(state!=='ready')return;const c=cust[i];if(!c||c.leave||c.x!==SLOTX[i]&&Math.abs(c.pg.group.position.x-SLOTX[i])>.5)return;const o=c.order,q=quality();
   const ok=o.sauce===cur.sauce&&o.cheese===cur.cheese&&TOPS.every(k=>(o.tops[k]||0)===cur.tops[k])&&q!=='burnt';
   if(ok){const n=TOPS.reduce((a,k)=>a+cur.tops[k],0),tip=Math.round(6*c.pat/c.max),bq=q==='golden'?(bake>=.85?8:5):-3;const pts=10+n*2+tip+bq;score+=pts;served++;if(bake>=.85&&q==='golden')perfect++;lastTip=tip;
    snd.play('ding');snd.play('coins',3);glit.burst(new V3(SLOTX[i],3,-2.6),40,5,[new THREE.Color(2.4,1.8,.4),new THREE.Color(2,2,2)],.35,.9,{up:true,grav:4});pops.push({txt:'+'+pts,p:new V3(SLOTX[i],3.8,-3),t:1.3,col:'#ffe09a'});leave(i,1);}
   else{strikes++;snd.play('buzz');pops.push({txt:q==='burnt'?'BURNT!':'WRONG!',p:new V3(SLOTX[i],3.8,-3),t:1.3,col:'#ff7a6a'});if(q==='burnt')burnt++;leave(i,-1);score=Math.max(0,score-5);}
   state='build';cur=newPizza();resetPizza();}
  function trashIt(){if(state==='bake')return;cur=newPizza();state='build';resetPizza();snd.play('splat');}
  function resetPizza(){bake=0;drawPizza();doughM.color.set(0xf0d8a8);cheeseM.color.set(0xffd860);sauceM.color.set(0xc8301e);pz.position.set(0,1.18,1.5);pz.scale.setScalar(1);}
  resetPizza();
  const hits=[...tubs.map(tb=>({obj:tb.tub,act:()=>add(tb.g.k)})),{obj:oven,act:bakeAct},{obj:trash,act:trashIt}];const ray=new THREE.Raycaster();
  const inst={scene,camera:cam,score:0,particles:[parts,glit],post:{exposure:.95,bloomThreshold:1.3,bloom:.35},
   idle(dt){vis(dt);},
   update(dt,inp){t+=dt;
    // keys
    ING.forEach((g,i)=>{if(inp.e('Digit'+(i+1))||inp.e('Numpad'+(i+1)))add(g.k);});
    if(inp.e('Space')||inp.e('KeyO')||inp.e('PadA'))bakeAct();if(inp.e('KeyQ'))serve(0);if(inp.e('KeyW'))serve(1);if(inp.e('KeyE'))serve(2);if(inp.e('KeyX')||inp.e('Backspace'))trashIt();
    if(inp.mouse.click){const r=inp.ray(cam);ray.ray.copy(r);let done=false;for(let i=0;i<3;i++){const c=cust[i];if(c&&!c.leave&&ray.intersectObject(c.hit).length){serve(i);done=true;break;}}
     if(!done)for(const h of hits){if(ray.intersectObject(h.obj,true).length){h.act();break;}}}
    if(state==='bake'){bake+=dt/3.3;if(bake>1.35){bake=1.35;}if(bake>1.05&&Math.random()<dt*20)parts.emit(5.3+rnd(-.4,.4),2.2,1,rnd(-.2,.2),rnd(1,2),0,.25,.22,.22,.8,1.6,-.3,.4);}
    // customers
    spawnT-=dt;for(let i=0;i<3;i++){const c=cust[i];if(!c){if(spawnT<=0){spawnCust(i);spawnT=D.gap*(1-Math.min(.45,t/150))+rnd(1.5);snd.play('door');}continue;}
     if(!c.leave){c.pat-=dt;if(c.pat<=0){strikes++;snd.play('buzz');pops.push({txt:'TOO SLOW!',p:new V3(SLOTX[i],3.8,-3),t:1.3,col:'#ff7a6a'});leave(i,-1);}}}
    if(strikes>=D.strikes){inst.done=true;inst.doneReason='strikes';inst.endText='SHIFT OVER!';}
    inst.score=score;vis(dt);},
   hud(){const W=innerWidth,H=innerHeight;let h='';
    for(let i=0;i<3;i++){const c=cust[i];if(!c||c.leave)continue;const s=toScreen(new V3(SLOTX[i],3.75,-3.2),cam,W,H);const o=c.order,pr=c.pat/c.max;
     const it=[`🍅`,o.cheese?'🧀':'<s style="opacity:.5">🧀</s>',...TOPS.filter(k=>o.tops[k]).map(k=>`${ING.find(g=>g.k===k).e}×${o.tops[k]}`)];
     h+=`<div class="mgpanel" style="left:${s.x}px;top:${s.y}px;transform:translate(-50%,-100%);text-align:center;padding:8px 10px;min-width:120px"><div style="font-size:1.05rem;letter-spacing:.04em">${it.join(' ')}</div><div style="height:5px;margin-top:6px;border-radius:9px;background:rgba(255,255,255,.12)"><div style="height:100%;width:${pr*100}%;border-radius:9px;background:${pr>.5?'#5ad06a':pr>.25?'#f2c230':'#ff5a3a'}"></div></div><span style="font-size:.58rem;color:#8a8f9a">${'QWE'[i]} TO SERVE</span></div>`;}
    const os=toScreen(new V3(5.3,3.3,.3),cam,W,H);const zone=`<i style="position:absolute;left:${.72/1.35*100}%;width:${(1.05-.72)/1.35*100}%;top:0;bottom:0;background:rgba(255,200,58,.35)"></i><i style="position:absolute;left:${.85/1.35*100}%;width:${.2/1.35*100}%;top:0;bottom:0;background:rgba(255,220,90,.55)"></i>`;
    h+=`<div class="mgpanel" style="left:${os.x}px;top:${os.y}px;transform:translate(-50%,-100%);width:150px;padding:8px 10px;text-align:center"><div style="font-size:.6rem;letter-spacing:.14em;color:#8a8f9a">${state==='bake'?'BAKING · SPACE TO TAKE OUT':state==='ready'?'READY · SERVE IT!':'SPACE TO BAKE'}</div><div style="position:relative;height:10px;margin-top:6px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden">${zone}<i style="position:absolute;left:0;top:0;bottom:0;width:${bake/1.35*100}%;background:${bake>1.05?'#6a3a2a':'#ff8a3a'}"></i></div></div>`;
    const mine=[cur.sauce?'🍅':'',cur.cheese?'🧀':'',...TOPS.filter(k=>cur.tops[k]).map(k=>`${ING.find(g=>g.k===k).e}×${cur.tops[k]}`)].filter(Boolean).join(' ')||'empty';
    h+=`<div class="mgpanel" style="left:18px;top:16px"><b>STRIKES</b> <span class="hearts">${'✕'.repeat(strikes)}<span style="opacity:.25">${'✕'.repeat(Math.max(0,D.strikes-strikes))}</span></span><br>SERVED ${served} · PERFECT ${perfect}<br>ON THE BOARD: ${mine}</div>`;
    h+=pops.map(p=>{const s=toScreen(p.p,cam,W,H);return `<div class="mgp" style="left:${s.x}px;top:${s.y-(1.3-p.t)*40}px;transform:translate(-50%,-50%);font:400 1.7rem Anton,Impact,sans-serif;color:${p.col};opacity:${Math.min(1,p.t*2)}">${p.txt}</div>`;}).join('');ctx.hud.innerHTML=h;},
   result(){const md=score>=200?3:score>=120?2:score>=50?1:0;return{score,medal:md,coins:Math.round(score*.28)+3,stats:[['Pizzas served',served],['Perfect bakes',perfect],['Strikes',strikes+' / '+D.strikes],['Burnt pizzas',burnt]],sub:inst.doneReason==='strikes'?'TOO MANY STRIKES':'SHIFT COMPLETE'};},
   cheat:{win(){score=230;served=14;},lose(){strikes=99;}},add,bakeAct,serve,trashIt,get cust(){return cust;},get cur(){return cur;},get state(){return state;},get bake(){return bake;},setBake(v){bake=v;}};
  function vis(dt){for(const tb of tubs)tb.tub.position.y=damp(tb.tub.position.y,1.3,10,dt);
   const tt=performance.now()/1000;oven.userData.mouth.material.color.setRGB(3+Math.sin(tt*9)*.4,1.2+Math.sin(tt*7)*.2,.3);ovenLight.intensity=6+Math.sin(tt*11)*1.2+(state==='bake'?4:0);
   // pizza position: board → oven → board
   const tgt=state==='bake'?new V3(5.3,1.35,.6):new V3(0,1.18,1.5);pz.position.lerp(tgt,1-Math.exp(-dt*8));pz.scale.setScalar(damp(pz.scale.x,state==='bake'?.75:1,8,dt));
   if(state==='bake'||state==='ready'){const k=Math.min(1,bake);doughM.color.setRGB(lerp(.94,.82,k),lerp(.85,.55,k),lerp(.66,.3,k));cheeseM.color.setRGB(1,lerp(.85,.62,k),lerp(.38,.15,k));if(bake>1.05){const b=cl((bake-1.05)/.3,0,1);doughM.color.multiplyScalar(1-b*.7);cheeseM.color.multiplyScalar(1-b*.7);}}
   for(let i=0;i<3;i++){const c=cust[i];if(!c)continue;const g=c.pg.group;if(c.leave){c.leave+=dt;g.position.x+=(i===0?-1:1)*dt*6*(c.leave>.6?1:0);g.rotation.y=damp(g.rotation.y,(i===0?-1:1)*Math.PI/2,8,dt);if(c.leave>2.4){scene.remove(g);scene.remove(c.hit);cust[i]=null;}}
    else{g.position.x=damp(g.position.x,SLOTX[i],3,dt);g.rotation.y=damp(g.rotation.y,0,6,dt);c.x=Math.abs(g.position.x-SLOTX[i])<.3?SLOTX[i]:g.position.x;if(c.pat/c.max<.25&&Math.random()<dt)c.pg.play('nod');}
    c.pg.update(dt,c.leave?(c.leave>.6?4:0):Math.abs(g.position.x-SLOTX[i])>.3?3:0);}
   for(let i=pops.length-1;i>=0;i--){pops[i].t-=dt;if(pops[i].t<=0)pops.splice(i,1);}parts.update(dt);glit.update(dt);}
  return inst;}};
