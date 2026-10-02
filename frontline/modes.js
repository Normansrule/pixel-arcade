// FRONTLINE OPS — modes: 3 scripted campaign missions, 6v6 team deathmatch, wave survival. Every mode runs on a clock.
import * as THREE from '../vendor/three.module.min.js';
import * as HUD from './hud.js';
import {makeHeli} from './world.js';
const V=THREE.Vector3,rr=(a,b)=>a+Math.random()*(b-a),PI=Math.PI;
export const MISSIONS=[
 {id:'raid',name:'NIGHTFALL',map:'blacksite',time:480,tag:'NIGHT RAID',desc:'Night raid. Slip through the south gate of a guarded compound, destroy its comms array, clear the command post and reach the LZ.'},
 {id:'hold',name:'HOLD THE LINE',map:'outpost',time:300,tag:'DEFEND',desc:'A road checkpoint at dusk. Keep attackers out of the zone until reinforcements roll in, then mop up.'},
 {id:'escort',name:'SAFE PASSAGE',map:'oldquarter',time:480,tag:'ESCORT',desc:'Extract a high-value asset from a safehouse and walk them through the old town, market and avenue to the evac bird.'}];
export const TDM_MAPS=[{id:'blacksite',name:'BLACKSITE',tag:'NIGHT'},{id:'oldquarter',name:'OLD QUARTER',tag:'DUSK'}];
export function makeMode(G,opt){if(opt.mode==='tdm')return tdm(G,opt);if(opt.mode==='survival')return survival(G,opt);return campaign(G,opt);}
const yawTo=(x,z,tx=0,tz=0)=>Math.atan2(tx-x,tz-z);
const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};

/* ================= TEAM DEATHMATCH ================= */
function tdm(G,opt){const M={kind:'tdm',map:opt.map||'blacksite',clock:480,limit:75,score:[0,0],label:'TEAM DEATHMATCH',corpse:5,pT:0,warned:false,
 init(){const L=G.level,s=L.spawns.a[0];G.makePlayer(s[0],s[1],yawTo(s[0],s[1]));const an=G.names(0,5),en=G.names(1,6);
  an.forEach((n,i)=>{const p=L.spawns.a[(i+1)%L.spawns.a.length];G.spawnBot({team:0,x:p[0]+rr(-1,1),z:p[1]+rr(-1,1),yaw:yawTo(p[0],p[1]),role:'tdm',weapon:G.pickWeapon(0),name:n});});
  en.forEach((n,i)=>{const p=L.spawns.b[i%L.spawns.b.length];G.spawnBot({team:1,x:p[0]+rr(-1,1),z:p[1]+rr(-1,1),yaw:yawTo(p[0],p[1]),role:'tdm',weapon:G.pickWeapon(1),name:n,att:Math.random()<.3?{supp:1}:{}});});
  HUD.banner(G,'TEAM DEATHMATCH',`FIRST TO ${M.limit} · ${L.name}`,'#ff4d00',2.6);},
 update(dt){M.clock-=dt*G.clockScale;if(M.clock<=60&&!M.warned){M.warned=true;HUD.ann(G,'ONE MINUTE REMAINING',3);G.snd.play('beep',1);}if(M.clock<=0){M.clock=0;M.end();return;}
  for(const a of G.actors){if(a.alive||a.isPlayer)continue;a.respT=(a.respT??4)-dt;if(a.respT<=0){a.respT=undefined;const s=G.spawnPoint(a.team);G.respawnActor(a,s.x,s.z,yawTo(s.x,s.z));}}
  const P=G.player;if(P&&!P.alive){M.pT-=dt;if(M.pT<=0){const s=G.spawnPoint(0);G.respawnPlayer(s.x,s.z,yawTo(s.x,s.z));}}},
 onKill(v,k){if(G.over)return;const t=k&&k.team!==v.team?k.team:1-v.team;M.score[t]++;if(M.score[t]>=M.limit)M.end();},
 onPlayerDeath(){M.pT=3.2;},
 end(){const s=M.score,res=s[0]>s[1]?'win':s[0]<s[1]?'lose':'draw';G.endMatch(res,res==='win'?'VICTORY':res==='lose'?'DEFEAT':'DRAW',`${s[0]} — ${s[1]}`);},
 points(){const P=G.player;return P.stats.score+(G.over&&G.over.res==='win'?1000:G.over&&G.over.res==='draw'?300:0);},
 top(){return{f:M.score[0],e:M.score[1],clock:M.clock,lbl:`FIRST TO ${M.limit}`};},
 objText(){return['TEAM DEATHMATCH','Eliminate enemy operators. First team to '+M.limit+' kills wins.'];},marks(){return[];},
 respawnLeft(){return M.pT;}};return M;}

/* ================= SURVIVAL ================= */
function survival(G,opt){const M={kind:'survival',map:'outpost',wave:0,phase:'inter',clock:7,toSpawn:0,spawnT:0,label:'SURVIVAL',corpse:6,maxWave:10,killsW:0,
 init(){const L=G.level,s=L.pts.start;G.makePlayer(s.x,s.z,s.yaw);HUD.banner(G,'SURVIVAL','HOLD OUT FOR 10 WAVES','#ff4d00',2.6);HUD.radio(G,'HQ','Enemy columns inbound from the north. Dig in.',true);},
 alive(){return G.actors.filter(a=>a.alive&&a.team===1).length;},
 update(dt){M.clock-=dt*G.clockScale;const P=G.player;const L=G.level;
  if(M.phase==='inter'){if(M.clock<=0)M.startWave();return;}
  M.spawnT-=dt;const max=Math.min(11,4+M.wave);if(M.toSpawn>0&&M.spawnT<=0&&M.alive()<max){M.spawnT=Math.max(.7,2.6-M.wave*.18);M.toSpawn--;
   const pool=L.spawns.b.concat(M.wave>=3?L.spawns.flank:[]).filter(p=>Math.hypot(p[0]-P.pos.x,p[1]-P.pos.z)>26);const p=pool[Math.random()*pool.length|0]||L.spawns.b[0];
   const rush=M.wave>=3&&Math.random()<.35;const a=G.spawnBot({team:1,x:p[0]+rr(-2,2),z:p[1]+rr(-2,2),yaw:yawTo(p[0],p[1],0,0),role:'hunt',hunt:()=>G.player&&G.player.alive?G.player.pos:L.pts.start,weapon:rush?'shotgun':G.pickWeapon(1),name:'HOSTILE',hp:100+M.wave*6});a.ai.alerted=M.wave>2;}
  const left=M.toSpawn+M.alive();if(left===0){M.cleared();return;}
  if(M.clock<=0){M.clock=0;G.endMatch('lose','OVERRUN',`WAVE ${M.wave} TIMER EXPIRED`);}},
 startWave(){M.wave++;M.phase='fight';M.toSpawn=Math.min(30,4+M.wave*2);M.clock=70+M.wave*12;M.spawnT=.5;HUD.banner(G,'WAVE '+M.wave,`${M.toSpawn} HOSTILES · ${mmss(M.clock)} ON THE CLOCK`,'#ff4d00',2.2);G.snd.play('beep',1);
  for(const a of G.actors.slice())if(!a.alive&&a.team===1)G.removeActor(a);},
 cleared(){const P=G.player;const b=200*M.wave;P.stats.score+=b;HUD.xp(G,b,'WAVE '+M.wave+' CLEARED');G.refill();P.hp=P.maxHp;
  if(M.wave>=M.maxWave){G.endMatch('win','SURVIVED',`ALL ${M.maxWave} WAVES CLEARED`);return;}M.phase='inter';M.clock=9;HUD.banner(G,'WAVE '+M.wave+' CLEARED','AMMO RESUPPLIED · NEXT WAVE IN 9s','#5fe08a',2.4);G.snd.play('obj');},
 onKill(v,k){},onPlayerDeath(){if(!G.over)G.endMatch('lose','OVERRUN',`FELL ON WAVE ${M.wave}`);},
 points(){return G.player.stats.score+M.wave*150;},
 top(){return{solo:true,clock:M.clock,lbl:M.phase==='inter'?'NEXT WAVE':`WAVE ${M.wave}/${M.maxWave}`};},
 objText(){return M.phase==='inter'?['RESUPPLY',M.wave?'Wave cleared. Ammo restocked. Get ready.':'Take position at the checkpoint.']:[`WAVE ${M.wave} OF ${M.maxWave}`,`${M.toSpawn+M.alive()} hostiles left. Clear them before the timer runs out.`];},marks(){return[];},
 skip(){for(const a of G.actors)if(a.alive&&a.team===1)a.hp=0,a.alive=false;M.toSpawn=0;}};return M;}

/* ================= CAMPAIGN ================= */
function campaign(G,opt){const def=MISSIONS[opt.mission||0];const M={kind:'campaign',map:def.map,clock:def.time,label:def.name,def,corpse:40,i:0,lives:3,cp:null,respawnIn:0,objDone:0,objs:[],heli:null,extra:[],fire:null,warned:false,
 init(){SCRIPTS[def.id](G,M);M.cp=M.cpNow();M.enter();HUD.banner(G,def.name,def.tag+' · '+G.level.name,'#ff4d00',3);},
 cpNow(){const P=G.player;return{x:P.pos.x,z:P.pos.z,yaw:P.yaw};},
 enter(){const o=M.objs[M.i];if(!o)return;if(o.enter)o.enter();HUD.objective(G,o.t,o.s);},
 update(dt){M.clock-=dt*G.clockScale;const P=G.player;if(M.clock<=60&&!M.warned){M.warned=true;HUD.ann(G,'ONE MINUTE REMAINING',3);}
  if(M.clock<=0){M.clock=0;M.fail('OUT OF TIME');return;}
  if(M.heli){const h=M.heli;h.t+=dt;const k=Math.min(1,h.t/9);h.m.position.y=h.y0+(1-k*k*(3-2*k))*36;h.m.userData.rotor.rotation.y+=dt*28;h.m.userData.tr.rotation.x+=dt*40;h.m.userData.beacon.visible=(G.time*1.5|0)%2===0;if(h.t<9&&Math.random()<dt*2)G.snd.play('heli');}
  if(M.fire&&Math.random()<dt*30){const f=M.fire;G.fx.sparks.emit(f.x+rr(-1,1),rr(.3,2.5),f.z+rr(-1,1),rr(-.3,.3),rr(1.5,3),rr(-.3,.3),4,1.6+Math.random(),.4,rr(.4,.9),rr(.4,.9),-1,1);if(Math.random()<.4)G.fx.smoke.emit(f.x+rr(-1,1),2,f.z+rr(-1,1),rr(-.2,.2),rr(1,2),rr(-.2,.2),.1,.1,.1,1.5,4,0,.3,1.2);}
  if(P&&!P.alive){if(M.respawnIn>0){M.respawnIn-=dt;if(M.respawnIn<=0)M.restore();}return;}
  const o=M.objs[M.i];if(!o)return;if(o.update(dt)){M.objDone++;if(o.done)o.done();M.i++;P.stats.score+=500;HUD.xp(G,500,'OBJECTIVE COMPLETE');G.snd.play('obj');
   if(M.i>=M.objs.length){G.endMatch('win','MISSION COMPLETE',def.name+' · '+mmss(def.time-M.clock));return;}
   M.cp=M.cpNow();HUD.ann(G,'CHECKPOINT REACHED',2.4);M.enter();}},
 restore(){const c=M.cp;G.respawnPlayer(c.x,c.z,c.yaw);G.refill();HUD.objective(G,M.objs[M.i].t,M.objs[M.i].s);
  for(const a of G.actors)if(!a.alive&&a.team===0&&!a.isPlayer&&!a.vip)G.respawnActor(a,c.x+rr(-2,2),c.z+rr(-2,2),c.yaw);},
 fail(why){G.endMatch('lose','MISSION FAILED',why);},
 onKill(v,k){if(G.over)return;if(v.vip)M.fail('THE ASSET WAS KILLED');},
 onPlayerDeath(){if(G.over)return;M.lives--;if(M.lives<0){M.fail('KILLED IN ACTION');return;}M.respawnIn=3.5;},
 points(){const P=G.player,s=P.stats;return s.kills*100+s.heads*50+M.objDone*500+(G.over&&G.over.res==='win'?2000+Math.round(M.clock)*5:0)-s.deaths*200;},
 top(){return{solo:true,clock:M.clock,lbl:def.name};},
 objText(){const o=M.objs[M.i];return o?[o.t,o.sub?o.sub():o.s]:['',''];},
 marks(){const o=M.objs[M.i];const out=[];if(o&&o.mark){const p=o.mark();if(p)out.push({p,label:o.ml||'OBJECTIVE',cls:''});}if(M.vip&&M.vip.alive&&M.vip.ai.fol)out.push({p:M.vip.pos,label:'ASSET',cls:'vip',h:2.1});return out;},
 respawnLeft(){return M.respawnIn;},
 skip(){const o=M.objs[M.i];if(o&&o.force)o.force();else if(o)o.update=()=>true;},
 dispose(){if(M.heli)G.scene.remove(M.heli.m);for(const x of M.extra)G.scene.remove(x);}};
 return M;}

// helpers for scripts
function enemy(G,x,z,role,o={}){return G.spawnBot({team:1,x,z,role,weapon:o.weapon||G.pickWeapon(1,role),name:o.name||'HOSTILE',post:new V(x,0,z),...o});}
function heliIn(G,M,x,z,yaw=0){const m=makeHeli();m.position.set(x,40,z);m.rotation.y=yaw;G.scene.add(m);M.heli={m,t:0,y0:.12};}
const near=(a,p,r)=>a&&Math.hypot(a.pos.x-p.x,a.pos.z-p.z)<r;

const SCRIPTS={
 /* ---------- 1. NIGHTFALL ---------- */
 raid(G,M){const L=G.level,s=L.pts.start,P=G.makePlayer(s.x,s.z,s.yaw);const arr=L.pts.array,hq=L.pts.hq,lz=L.pts.lz;
  ['REYES','HOLT'].forEach((n,i)=>G.spawnBot({team:0,x:s.x+(i?1.6:-1.6),z:s.z+2,yaw:s.yaw,role:'follow',fol:P,slot:i?1.8:-1.8,weapon:i?'smg':'ar',att:{supp:1},name:n}));
  enemy(G,-6.5,27.4,'guard',{yaw:0});enemy(G,6.5,27.4,'guard',{yaw:0});enemy(G,-18,37,'patrol',{route:[[-18,37],[18,37],[18,41],[-18,41]]});
  enemy(G,-29.5,27.5,'guard',{static:true,y:4.45,weapon:'sniper',yaw:.4});enemy(G,29.5,27.5,'guard',{static:true,y:4.45,weapon:'sniper',yaw:-.4});
  enemy(G,-4,3.2,'guard',{yaw:PI});enemy(G,9,-1,'guard',{yaw:0});enemy(G,-10,0,'patrol',{route:L.patrol});enemy(G,-14,10,'guard',{yaw:0});
  enemy(G,17.5,-12,'guard',{yaw:0});enemy(G,24,-12,'guard',{yaw:0});enemy(G,14.5,-22,'guard',{yaw:-PI/2});enemy(G,-21,0,'guard',{yaw:PI/2});enemy(G,-22,17,'guard',{yaw:PI/2});
  for(const[x,z,y]of[[-9,-21,PI/2],[-11,-15.5,0],[1,-14.5,PI],[0,-22,0],[-7,-14.5,PI],[4,-19,-PI/2]])enemy(G,x,z,'guard',{tag:'hq',yaw:y});
  let plant=0,charge=-1;
  M.objs=[
   {t:'BREACH THE COMPOUND',s:'Move up the road and through the south gate. Suppressed weapons keep you hidden.',ml:'GATE',mark:()=>new V(0,0,30),update:()=>P.pos.z<28.5&&Math.abs(P.pos.x)<31,
    enter(){HUD.radio(G,'HQ','Overlord to Raven team. Compound is quiet. Keep it that way.',true);}},
   {t:'DESTROY THE COMMS ARRAY',s:'Hold [E] at the base of the antenna to plant a charge.',ml:'PLANT',mark:()=>charge<0?new V(arr.x,0,arr.z):null,
    sub:()=>charge>=0?`Charge set. Clear the blast radius! ${Math.ceil(charge)}`:'Hold [E] at the base of the antenna to plant a charge.',
    update(dt){if(charge>=0){charge-=dt;if(charge<=0){G.explode(new V(arr.x,1,arr.z),P,13,400,'frag');G.explode(new V(arr.x+2,3,arr.z-1.5),P,6,100,'frag');M.fire={x:arr.x,z:arr.z-1.6};HUD.radio(G,'HQ','Array is down. Good effect on target.',true);return true;}return false;}
     const nearA=Math.hypot(P.pos.x-arr.x,P.pos.z-arr.z)<2.8;if(nearA){HUD.prompt(G,'HOLD E — PLANT CHARGE',Math.min(1,P.interact/2.5));if(P.interact>=2.5){charge=6;G.snd.play('beep',1);HUD.radio(G,'REYES','Charge is live! Move, move!');}}else HUD.prompt(G,null);return false;},force(){charge=.01;}},
   {t:'SECURE THE COMMAND POST',s:'Clear every hostile inside the HQ building.',ml:'HQ',mark:()=>new V(hq.x,0,hq.z),
    sub:()=>`Clear every hostile inside the HQ building. ${G.actors.filter(a=>a.alive&&a.tag==='hq').length} left.`,
    enter(){for(const a of G.actors)if(a.tag==='hq'&&a.alive){a.ai.alerted=true;}for(const p of[[13,-38],[16,-42]])enemy(G,p[0],p[1],'hunt',{hunt:()=>P.pos});HUD.radio(G,'HOLT','They know we are here. Stack up on the HQ.');},
    update:()=>!G.actors.some(a=>a.alive&&a.tag==='hq')},
   {t:'EXFIL AT THE LZ',s:'Reach the helicopter landing zone north-east of the compound.',ml:'LZ',mark:()=>new V(lz.x,0,lz.z),
    enter(){heliIn(G,M,lz.x,lz.z,-.6);HUD.radio(G,'HQ','Bird is inbound to the LZ. Expect company.',true);for(const p of[[13,-44],[6,-47],[20,-46],[-4,-42],[26,-40],[13,-52]])enemy(G,p[0],p[1],'hunt',{hunt:()=>P.pos});},
    update:()=>near(P,lz,7)&&M.heli&&M.heli.t>8}];},
 /* ---------- 2. HOLD THE LINE ---------- */
 hold(G,M){const L=G.level,s=L.pts.start,P=G.makePlayer(s.x,s.z,s.yaw),Z=L.pts.zone;let hold=180,meter=0,spawnT=4,cav=false;
  [['MBEKI',14.5,-1],['STROUD',-17.5,-1],['VANCE',2,-2]].forEach(([n,x,z])=>G.spawnBot({team:0,x,z,yaw:PI,role:'guard',post:new V(x,0,z),weapon:n==='VANCE'?'smg':'ar',name:n}));
  const spawnFoe=()=>{const late=hold<120;const pool=L.spawns.b.concat(late?L.spawns.flank:[]);const p=pool[Math.random()*pool.length|0];const r=Math.random();
   enemy(G,p[0]+rr(-2,2),p[1]+rr(-2,2),r<.25?'hunt':'assault',{hold:new V(Z.x,0,Z.z),hunt:()=>P.pos,yaw:0,weapon:r<.25?'shotgun':undefined}).ai.alerted=true;};
  for(let i=0;i<3;i++)spawnFoe();
  M.objs=[
   {t:'HOLD THE CHECKPOINT',s:'Keep hostiles out of the zone until reinforcements arrive.',ml:'DEFEND',mark:()=>new V(Z.x,0,Z.z),
    sub:()=>`Reinforcements in ${mmss(hold)}. Don't let them take the zone.`,
    enter(){HUD.radio(G,'HQ','Hold that checkpoint. Armor is three minutes out.',true);HUD.objBar(G,0);},
    update(dt){hold-=dt*G.clockScale;spawnT-=dt;const max=4+G.diffI+(hold<90?2:0);if(spawnT<=0&&G.actors.filter(a=>a.alive&&a.team===1).length<max){spawnT=Math.max(1.6,4-G.diffI*.6-(180-hold)*.008);spawnFoe();}
     let en=0,fr=0;for(const a of G.actors){if(!a.alive)continue;if(Math.hypot(a.pos.x-Z.x,a.pos.z-Z.z)<Z.r){if(a.team===1)en++;else fr+=a.isPlayer?2:1;}}
     if(en>0&&en>=fr){meter+=dt*10*en;if(meter>35&&!M.warnZ){M.warnZ=1;HUD.ann(G,'CHECKPOINT CONTESTED',2);}}else meter=Math.max(0,meter-dt*6);HUD.objBar(G,meter/100);
     if(meter>=100){M.fail('CHECKPOINT OVERRUN');return false;}if(hold<=0){HUD.objBar(G,-1);return true;}return false;},force(){hold=0;}},
   {t:'MOP UP',s:'Reinforcements are here. Clear the remaining attackers.',ml:'',mark:()=>null,sub:()=>`Clear the remaining attackers. ${G.actors.filter(a=>a.alive&&a.team===1).length} left.`,
    enter(){HUD.radio(G,'HQ','Armor on site. Finish them.',true);for(const a of G.actors)if(a.alive&&a.team===1){a.ai.role='hunt';a.ai.hunt=()=>P.pos;a.ai.alerted=true;}},
    update:()=>!G.actors.some(a=>a.alive&&a.team===1)}];},
 /* ---------- 3. SAFE PASSAGE ---------- */
 escort(G,M){const L=G.level,s=L.pts.start,P=G.makePlayer(s.x,s.z,s.yaw),vp=L.pts.vip,pl=L.pts.plaza,av=L.pts.ave,lz=L.pts.lz;
  ['CRUZ','IKEDA'].forEach((n,i)=>G.spawnBot({team:0,x:s.x+2,z:s.z+(i?1.6:-1.6),yaw:s.yaw,role:'follow',fol:P,slot:i?1.8:-1.8,weapon:i?'shotgun':'ar',name:n}));
  const vip=M.vip=G.spawnBot({team:0,x:vp.x,z:vp.z,yaw:PI/2,role:'vip',vip:true,name:'ASSET',hp:160});vip.ai.fol=null;
  enemy(G,-48,24.5,'guard',{yaw:PI/2});enemy(G,-42,47,'guard',{yaw:PI});enemy(G,-24,22,'patrol',{route:[[-24,22],[-10,22],[-10,27],[-24,27]]});
  M.objs=[
   {t:'SECURE THE ASSET',s:'Reach the safehouse and make contact with the asset.',ml:'ASSET',mark:()=>vip.pos,update:()=>near(P,vip.pos,2.8)||vip.ai.fol,
    done(){vip.ai.fol=P;vip.ai.slot=0;HUD.radio(G,'ASSET','About time. Get me out of this town.',true);}},
   {t:'CROSS THE MARKET',s:'Escort the asset to the market square and clear the ambush.',ml:'MARKET',mark:()=>new V(pl.x,0,pl.z),
    sub:()=>`Escort the asset into the market and clear the ambush. ${G.actors.filter(a=>a.alive&&a.tag==='plaza').length} hostiles.`,
    enter(){for(const[x,z]of[[-8,-3.8],[8,-3.8],[-9,9],[9,9.4],[0,-8.5],[4.5,9]])enemy(G,x,z,'guard',{tag:'plaza',yaw:yawTo(x,z,-20,20)});enemy(G,30,22,'hunt',{hunt:()=>P.pos});HUD.radio(G,'CRUZ','Market looks too quiet. Eyes up.');},
    update:()=>near(vip,pl,12)&&!G.actors.some(a=>a.alive&&a.tag==='plaza')},
   {t:'MOVE UP THE AVENUE',s:'Push north along the main avenue to the crossroads.',ml:'CROSSROADS',mark:()=>new V(av.x,0,av.z),
    enter(){for(const[x,z]of[[-2,-38],[3,-31],[5.5,-46],[-5.5,-50]])enemy(G,x,z,'guard',{tag:'ave',yaw:0});},update:()=>near(vip,av,7)},
   {t:'REACH EXTRACTION',s:'Get the asset onto the evac helicopter in the north-east lot.',ml:'EVAC',mark:()=>new V(lz.x,0,lz.z),
    enter(){heliIn(G,M,lz.x,lz.z,PI/2);HUD.radio(G,'HQ','Evac bird on approach to the lot. Hostiles converging on you.',true);for(const[x,z]of[[44,-28],[52,-44],[40,-44],[30,-24],[20,-25]])enemy(G,x,z,'guard',{yaw:-PI/2});for(const[x,z]of[[30,-52],[20,-12],[45,-5]])enemy(G,x,z,'hunt',{hunt:()=>vip.pos});},
    update:()=>near(vip,lz,7)&&near(P,lz,12)&&M.heli&&M.heli.t>8}];}
};
