// SNOW FORT SHOWDOWN — 3v3 team snowball fight with CPU allies and rivals: duck behind forts, pack snow, lob snowballs.
import {THREE,V3,Particles,baseScene,follow,snowMaterial,textSprite,toScreen} from './common.js';
import {Penguin} from '../penguin.js';
import {instancedPines} from '../env.js';
import {merge,M,cl,rnd,pick,damp,dampAng} from '../util.js';
import {BODY_COLORS,WEAR} from '../items.js';
const AW=22,AD=15,G=20;
const WALLS=[{x:-6,z:0,hw:2,hd:.45,h:1.3},{x:6,z:0,hw:2,hd:.45,h:1.3}];for(const s of[1,-1])WALLS.push({x:-11,z:7*s,hw:1.8,hd:.45,h:1.25},{x:0,z:6*s,hw:1.8,hd:.45,h:1.25},{x:11,z:7*s,hw:1.8,hd:.45,h:1.25});
const PILES=[[-17,3,1.1],[17,-3,1.1],[-17,-4,1],[17,4,1]];
export default{id:'snow',name:'SNOW FORT SHOWDOWN',room:'stage',time:90,music:'game',medals:[50,110,170],
 desc:'Team snowball fight! You and two CPU friends against three rivals. Duck behind the forts, pack snow and lob it at the red team.',
 long:'Three hits make a penguin dizzy for a few seconds - that is a knockout for your team. Click where you want to throw: snowballs arc over walls, so duck behind a fort when the red team winds up. Stand still to pack fresh snowballs. The team with more knockouts when time runs out wins, or the first to ten.',
 keys:[['Move','W A S D · arrows'],['Throw at cursor','left click · F'],['Duck (hold)','Space · right mouse'],['Pack snow','stand still · R'],['Score','hit 10 · knockout 25 · win 50']],
 create(ctx){const{R,snd}=ctx;const B=baseScene(R,{hour:16.6,fogD:.007,shadowSize:30});const{scene,sun,cam}=B;cam.fov=46;const flags=[];
  // ---- arena ----
  const g=new THREE.PlaneGeometry(110,80,70,50);g.rotateX(-Math.PI/2);const p=g.attributes.position,col=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const e=Math.max(Math.abs(x)-AW,Math.abs(z)-AD,0);p.setY(i,e>0?Math.min(6,e*.3)+Math.sin(x*.2+z*.3)*Math.min(1,e*.1):Math.sin(x*.5)*Math.sin(z*.4)*.05);
   const tz=cl(z/AD,-1,1),ins=Math.abs(x)<AW&&Math.abs(z)<AD;col.push(ins&&tz<-.3?.97:.86,.9,ins&&tz>.3?1:.95);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();const field=new THREE.Mesh(g,snowMaterial());field.receiveShadow=true;scene.add(field);
  const tp=[];for(let i=0;i<70;i++){const a=rnd(7),r=rnd(30,48);tp.push({x:Math.cos(a)*r*1.2,y:1.5,z:Math.sin(a)*r*.85,s:.9+rnd(.9)});}instancedPines(scene,tp);
  {const L=[];for(const w of WALLS){L.push([new THREE.BoxGeometry(w.hw*2,w.h,w.hd*2),M(w.x,w.h/2,w.z),0xffffff]);for(let i=0;i<Math.round(w.hw*2/.9);i++)L.push([new THREE.BoxGeometry(.7,.38,w.hd*2),M(w.x-w.hw+.45+i*.9,w.h+.19,w.z),0xffffff]);}
   for(const[x,z,r]of PILES)L.push([new THREE.SphereGeometry(r,14,10),M(x,0,z,0,0,0,1.2,.75,1.2),0xffffff]);
   const wm=new THREE.Mesh(merge(L),snowMaterial());wm.castShadow=wm.receiveShadow=true;scene.add(wm);
   const FL=[];for(const s of[1,-1]){for(const x of[-AW+1,AW-1])FL.push([new THREE.CylinderGeometry(.08,.08,4,6),M(x,2,s*(AD-1)),0x444444]);}
   const fm=new THREE.Mesh(merge(FL),new THREE.MeshStandardMaterial({vertexColors:true}));scene.add(fm);
   for(const s of[1,-1])for(const x of[-AW+1,AW-1]){const f=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1),new THREE.MeshStandardMaterial({color:s>0?0x2f7aff:0xff3a3a,side:THREE.DoubleSide,roughness:.7}));f.position.set(x+.8,3.4,s*(AD-1));scene.add(f);flags.push(f);}
   const bline=new THREE.Mesh(new THREE.PlaneGeometry(AW*2,.25),new THREE.MeshBasicMaterial({color:0x8ab0e0,transparent:true,opacity:.5}));bline.rotation.x=-Math.PI/2;bline.position.y=.03;scene.add(bline);}
  // ---- penguins ----
  const names=['Pebble','Taffy','Bramble','Coco','Juniper','Kipper','Maple'].sort(()=>Math.random()-.5);
  const D=[{cd:1.6,err:1.6,lead:.4,dodge:.25,react:.5},{cd:1.15,err:1,lead:.75,dodge:.5,react:.35},{cd:.85,err:.55,lead:1,dodge:.8,react:.22}][ctx.diff];
  const pens=[];const mk=(team,i,me)=>{const scarf=team?'n_scarf_r':'n_scarf_s';const pg=new Penguin({color:me?ctx.look.color:pick(BODY_COLORS).hex,wear:me?{...ctx.look.wear,neck:scarf}:{hat:Math.random()<.6?pick(WEAR.filter(w=>w.slot==='hat')).id:null,neck:scarf},scale:1.2});scene.add(pg.group);
   const tag=me?null:textSprite(team?'RED':'BLUE',{size:36,bg:team?'rgba(220,50,50,.85)':'rgba(40,110,255,.85)',scale:.32});if(tag){tag.position.y=2.75;pg.group.add(tag);}
   const a={team,me,pg,name:me?ctx.name:names.pop(),x:0,z:0,vx:0,vz:0,ry:team?0:Math.PI,hp:3,ammo:5,cd:rnd(1),ko:0,duck:0,pack:0,still:0,inv:0,hits:0,kos:0,ai:{t:rnd(.5),goal:null,tgt:null,peek:0}};spawn(a,i);pens.push(a);return a;};
  function spawn(a,i){const s=a.team?-1:1;a.x=(i===undefined?rnd(-8,8):[-8,0,8][i]);a.z=s*(AD-2.5);a.hp=3;a.ammo=4;a.ko=0;a.inv=1.5;a.ry=a.team?0:Math.PI;}
  const me=mk(0,1,true);mk(0,0);mk(0,2);mk(1,0);mk(1,1);mk(1,2);
  // ---- snowballs ----
  const ballG=new THREE.SphereGeometry(.2,10,8),ballM=snowMaterial({vc:false,spark:0});const balls=[];
  function throwAt(a,tx,ty,tz){if(a.ammo<=0||a.cd>0||a.ko>0)return false;a.ammo--;a.cd=a.me?.42:D.cd*(.8+rnd(.4));a.duck=0;a.pack=0;const sx=a.x+Math.sin(a.ry)*.5,sz=a.z+Math.cos(a.ry)*.5,sy=1.75;
   a.ry=Math.atan2(tx-a.x,tz-a.z);a.pg.play('throw');let dx=tx-sx,dz=tz-sz,d=Math.hypot(dx,dz);if(d>26){dx*=26/d;dz*=26/d;d=26;}const T=cl(d/21,.3,.95);
   const m=new THREE.Mesh(ballG,ballM);m.castShadow=true;scene.add(m);balls.push({m,p:new V3(sx,sy,sz),v:new V3(dx/T,(ty-sy+.5*G*T*T)/T,dz/T),team:a.team,owner:a,life:2.5});snd.play('throw');return true;}
  // ---- state ----
  const parts=new Particles(scene,1200,'normal');
  let t=0,score=[0,0],pops=[],playerScore=0,thrown=0,hitsTaken=0;
  const blocked=(x0,z0,x1,z1)=>WALLS.some(w=>{for(let k=0;k<=8;k++){const x=x0+(x1-x0)*k/8,z=z0+(z1-z0)*k/8;if(Math.abs(x-w.x)<w.hw&&Math.abs(z-w.z)<w.hd)return true;}return false;});
  const coverSpots=t2=>{const sd=t2?-1:1;return WALLS.filter(w=>w.z*sd>=0).map(w=>({x:w.x+rnd(-w.hw*.6,w.hw*.6),z:w.z+sd*(w.hd+.9)}));};
  const inst={scene,camera:cam,score:0,particles:[parts],post:{exposure:.82,bloomThreshold:1.8,bloom:.35},
   idle(dt){vis(dt);},
   update(dt,inp){t+=dt;
    // player
    if(me.ko<=0){let ix=(inp.right()?1:0)-(inp.left()?1:0),iz=(inp.down()?1:0)-(inp.up()?1:0);if(Math.abs(inp.ax)>.25)ix=inp.ax;if(Math.abs(inp.ay)>.25)iz=inp.ay;
     me.duck=(inp.k('Space')||inp.mouse.rdown||inp.k('ShiftLeft')||inp.k('PadB'))?.15:0;const il=Math.hypot(ix,iz);
     if(il>0&&!me.duck){me.vx=damp(me.vx,ix/Math.max(1,il)*6,12,dt);me.vz=damp(me.vz,iz/Math.max(1,il)*6,12,dt);me.ry=dampAng(me.ry,Math.atan2(ix,iz),12,dt);me.still=0;}else{me.vx=damp(me.vx,0,12,dt);me.vz=damp(me.vz,0,12,dt);me.still+=dt;}
     if(inp.mouse.click||inp.e('KeyF')||inp.e('PadX')){const r=inp.ray(cam);if(r.direction.y<0){const k=(1.1-r.origin.y)/r.direction.y;if(throwAt(me,r.origin.x+r.direction.x*k,1.1,r.origin.z+r.direction.z*k))thrown++;else if(me.ammo<=0){ctx.msg('OUT OF SNOW - STAND STILL TO PACK','#ffb38a',.9);}}}
     if((me.still>.45||inp.k('KeyR'))&&me.ammo<6&&!me.duck){me.pack+=dt;if(me.pack>.42){me.pack=0;me.ammo++;snd.play('pop',me.ammo*.3);}}else me.pack=0;}
    // AI
    for(const a of pens)if(!a.me)think(a,dt);
    // movement + collisions
    for(const a of pens){a.cd-=dt;a.inv-=dt;if(a.ko>0){a.ko-=dt;if(a.ko<=0)spawn(a);continue;}a.x+=a.vx*dt;a.z+=a.vz*dt;a.x=cl(a.x,-AW+.6,AW-.6);a.z=cl(a.z,-AD+.6,AD-.6);
     for(const w of WALLS){const dx=a.x-w.x,dz=a.z-w.z,px=w.hw+.55-Math.abs(dx),pz=w.hd+.55-Math.abs(dz);if(px>0&&pz>0){if(px<pz)a.x+=Math.sign(dx)*px;else a.z+=Math.sign(dz)*pz;}}
     for(const[x,z,r]of PILES){const dx=a.x-x,dz=a.z-z,d=Math.hypot(dx,dz);if(d<r*1.2+.5){a.x=x+dx/d*(r*1.2+.5);a.z=z+dz/d*(r*1.2+.5);}}}
    for(let i=0;i<pens.length;i++)for(let j=i+1;j<pens.length;j++){const A=pens[i],Bq=pens[j];if(A.ko>0||Bq.ko>0)continue;const dx=A.x-Bq.x,dz=A.z-Bq.z,d=Math.hypot(dx,dz);if(d<1.1&&d>1e-3){const k=(1.1-d)/2;A.x+=dx/d*k;A.z+=dz/d*k;Bq.x-=dx/d*k;Bq.z-=dz/d*k;}}
    // balls
    for(let i=balls.length-1;i>=0;i--){const b=balls[i];b.v.y-=G*dt;b.p.addScaledVector(b.v,dt);b.life-=dt;let dead=b.p.y<.05||b.life<0;
     if(!dead)for(const w of WALLS)if(Math.abs(b.p.x-w.x)<w.hw+.15&&Math.abs(b.p.z-w.z)<w.hd+.15&&b.p.y<w.h+.35){dead=true;break;}
     if(!dead)for(const a of pens){if(a.team===b.team||a.ko>0||a.inv>0)continue;const dx=b.p.x-a.x,dz=b.p.z-a.z;if(dx*dx+dz*dz<.55&&b.p.y<(a.duck>0?.95:1.95)){dead=true;hit(a,b);break;}}
     if(dead){parts.burst(b.p,14,3.5,new THREE.Color(1,1,1),.45,.6,{up:true,grav:9});scene.remove(b.m);balls.splice(i,1);if(b.p.distanceTo(me.pg.group.position)<20)snd.play('splat');}}
    if(score[0]>=10||score[1]>=10){inst.done=true;inst.doneReason='ten';inst.endText=score[0]>=10?'BLUE WINS!':'RED WINS!';}
    playerScore=me.hits*10+me.kos*25;inst.score=playerScore;vis(dt);},
   hud(){const W=innerWidth,H=innerHeight;let h=`<div class="mgpanel" style="left:50%;top:78px;transform:translateX(-50%);display:flex;gap:14px;align-items:center;padding:6px 16px"><b style="color:#5a9aff">BLUE ${score[0]}</b><span style="color:#8a8f9a">—</span><b style="color:#ff5a5a">${score[1]} RED</b></div>`;
    h+=`<div class="mgpanel" style="left:18px;top:16px"><span class="hearts">${'♥'.repeat(Math.max(0,me.hp))}<span style="opacity:.25">${'♥'.repeat(Math.max(0,3-me.hp))}</span></span><br>SNOWBALLS ${'●'.repeat(me.ammo)}<span style="opacity:.25">${'●'.repeat(6-me.ammo)}</span>${me.pack>0?'<br><span style="color:#ffe09a">PACKING…</span>':''}${me.duck?'<br><span style="color:#8ad8ff">DUCKING</span>':''}</div>`;
    if(me.ko>0)h+=`<div class="mgp" style="left:50%;top:58%;transform:translateX(-50%);font:400 2rem Anton,Impact,sans-serif;color:#ffe09a">DIZZY! BACK IN ${Math.ceil(me.ko)}</div>`;
    h+=pops.map(p=>{const s=toScreen(p.p,cam,W,H);return `<div class="mgp" style="left:${s.x}px;top:${s.y-(1-p.t)*30}px;transform:translate(-50%,-50%);font:400 1.3rem Anton,Impact,sans-serif;color:${p.col};opacity:${Math.min(1,p.t*2)}">${p.txt}</div>`;}).join('');ctx.hud.innerHTML=h;},
   finish(){},
   result(){const won=score[0]>score[1],draw=score[0]===score[1];const s=me.hits*10+me.kos*25+(won?50:draw?20:0);const md=s>=170?3:s>=110?2:s>=50?1:0;
    return{score:s,medal:md,coins:Math.round(s*.28)+3,title:won?'VICTORY!':draw?'DRAW!':'DEFEAT',sub:`BLUE ${score[0]} — ${score[1]} RED`,stats:[['Your hits',me.hits],['Your knockouts',me.kos],['Times you got dizzy',hitsTaken],['Snowballs thrown',thrown],['Team result',won?'WIN +50':draw?'DRAW +20':'LOSS']]};},
   cheat:{win(){score=[10,0];me.hits=8;me.kos=4;},lose(){score=[0,10];}},pens,me,get teamScore(){return score;},balls,throwAt};
  function hit(a,b){a.hp--;a.pg.play('hit');a.vx+=b.v.x*.15;a.vz+=b.v.z*.15;const o=b.owner;if(o){o.hits++;}if(a.me)snd.play('splat');
   pops.push({txt:'HIT!',p:new V3(a.x,2.6,a.z),t:1,col:a.team?'#8ab8ff':'#ff9a9a'});
   if(a.hp<=0){a.ko=3.2;a.vx=a.vz=0;score[b.team]++;if(o)o.kos++;if(a.me)hitsTaken++;snd.play(b.team===0?'chime':'buzz');pops.push({txt:'KNOCKOUT!',p:new V3(a.x,3.2,a.z),t:1.4,col:'#ffe09a'});if(o&&o.me)ctx.msg('KNOCKOUT!','#ffe09a',.9);}}
  function think(a,dt){const ai=a.ai;ai.t-=dt;if(a.ko>0){a.vx=a.vz=0;return;}const s=a.team?-1:1;
   const foes=pens.filter(o=>o.team!==a.team&&o.ko<=0);
   // dodge incoming
   if(Math.random()<D.dodge*dt*6)for(const b of balls){if(b.team===a.team)continue;const tl=-b.v.y>0?.6:.9;const fx=b.p.x+b.v.x*tl,fz=b.p.z+b.v.z*tl;if(Math.hypot(fx-a.x,fz-a.z)<1.4){const px=-b.v.z,pz=b.v.x,l=Math.hypot(px,pz)||1;ai.dodge={x:px/l*(Math.random()<.5?1:-1),z:pz/l,t:.4};if(Math.random()<.4)a.duck=.6;break;}}
   if(ai.t<=0){ai.t=D.react+rnd(.2);
    ai.tgt=foes.sort((p1,p2)=>Math.hypot(p1.x-a.x,p1.z-a.z)-Math.hypot(p2.x-a.x,p2.z-a.z))[Math.random()<.7?0:1]||foes[0]||null;
    if(a.ammo===0){const cs=coverSpots(a.team).sort((c1,c2)=>Math.hypot(c1.x-a.x,c1.z-a.z)-Math.hypot(c2.x-a.x,c2.z-a.z));ai.goal=cs[0]?{x:cs[0].x,z:cs[0].z}:{x:a.x,z:s*(AD-2)};ai.mode='reload';}
    else if(!ai.goal||Math.random()<.18||Math.hypot(ai.goal.x-a.x,ai.goal.z-a.z)<.6&&Math.random()<.35){const cs=coverSpots(a.team);const c=pick(cs);ai.goal=c?{x:c.x+rnd(-.6,.6),z:c.z}:{x:rnd(-10,10),z:s*rnd(3,10)};ai.mode='fight';
     if(Math.random()<.25)ai.goal={x:cl(a.x+rnd(-5,5),-AW+2,AW-2),z:s*rnd(2,9)};}}
   let gx=0,gz=0;if(ai.goal){const dx=ai.goal.x-a.x,dz=ai.goal.z-a.z,d=Math.hypot(dx,dz);if(d>.4){gx=dx/d;gz=dz/d;}}
   if(ai.dodge&&ai.dodge.t>0){ai.dodge.t-=dt;gx=ai.dodge.x;gz=ai.dodge.z;}
   const reloading=ai.mode==='reload'&&ai.goal&&Math.hypot(ai.goal.x-a.x,ai.goal.z-a.z)<.8;
   if(reloading){gx=gz=0;a.duck=.2;a.pack+=dt;if(a.pack>.5){a.pack=0;a.ammo++;if(a.ammo>=4){ai.mode='fight';ai.goal=null;}}}else{a.duck=Math.max(0,a.duck-dt);a.pack=0;}
   const sp=a.duck>0?0:5;a.vx=damp(a.vx,gx*sp,8,dt);a.vz=damp(a.vz,gz*sp,8,dt);if(gx||gz)a.ry=dampAng(a.ry,Math.atan2(gx,gz),8,dt);
   const tg=ai.tgt;if(tg&&!reloading&&a.cd<=0&&a.ammo>0&&a.duck<=0){const d=Math.hypot(tg.x-a.x,tg.z-a.z);if(d<25&&Math.random()<dt*4){const T=cl(d/21,.3,.95),e=D.err*(.4+d/25);
     const tx=tg.x+tg.vx*T*D.lead+rnd(-e,e),tz=tg.z+tg.vz*T*D.lead+rnd(-e,e);throwAt(a,tx,tg.duck>0?.6:1.1,tz);}}}
  const cpos=new V3();let camInit=false;
  function vis(dt){const tt=performance.now()/1000;
   for(const a of pens){const pg=a.pg;pg.group.position.set(a.x,0,a.z);pg.group.rotation.y=a.ry;pg.pose=a.ko>0?'sit':a.duck>0||a.pack>0?'crouch':'stand';pg.update(dt,Math.hypot(a.vx,a.vz)/1.2);
    if(a.ko>0&&Math.random()<dt*10)parts.emit(a.x+Math.cos(tt*6)*.5,2.1,a.z+Math.sin(tt*6)*.5,0,.2,0,1,.9,.3,.2,.4);pg.group.visible=!(a.inv>0&&a.ko<=0&&Math.floor(a.inv*10)%2===0);}
   for(const b of balls)b.m.position.copy(b.p);for(const f of flags)f.rotation.y=Math.sin(tt*3+f.position.x)*.25;
   parts.update(dt,0);for(let i=pops.length-1;i>=0;i--){pops[i].t-=dt;if(pops[i].t<=0)pops.splice(i,1);}
   cpos.set(me.x*.7,17.5,me.z*.55+13.5);if(!camInit){cam.position.copy(cpos);camInit=true;}else cam.position.lerp(cpos,1-Math.exp(-dt*4));cam.lookAt(me.x*.7,0,me.z*.55-1.5);follow(sun,new V3(me.x*.5,0,me.z*.5),B.pal.sunDir);field.material.userData.U.uT.value=tt;}
  return inst;}};
