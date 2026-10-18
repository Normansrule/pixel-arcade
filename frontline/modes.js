// FRONTLINE OPS — modes: a three-mission cinematic campaign, 6v6 team deathmatch, 6v6 domination and wave survival.
// Every mode runs on a clock that ends the session with a results screen.
import * as THREE from '../vendor/three.module.min.js';
import * as HUD from './hud.js';
import {makeHeli} from './world.js';
const V=THREE.Vector3,rr=(a,b)=>a+Math.random()*(b-a),PI=Math.PI;
export const MISSIONS=[
 {id:'coldopen',name:'COLD OPEN',map:'northwatch',time:480,tag:'RAID',when:'06:40 · NORTHWATCH RADAR STATION',desc:'Dawn raid on a snowbound radar station. Breach the fence, blow the radar, clear the bunker and get to the bird.'},
 {id:'deadcalm',name:'DEAD CALM',map:'harbor',time:480,tag:'RECON · DEFEND',when:'18:55 · HARBOR 9 CONTAINER TERMINAL',desc:'Golden hour at a smuggling port. Inspect three flagged containers, upload the manifest from the warehouse and hold until it is sent.'},
 {id:'highnoon',name:'HIGH NOON',map:'sandgate',time:480,tag:'ESCORT',when:'12:10 · SANDGATE MARKET TOWN',desc:'Pull a defector out of a walled desert town at midday, through the market ambush and up the main street to the north gate.'}];
export const MODE_INFO={campaign:'Three short story missions with objectives, checkpoints and a squad at your side.',tdm:'You and five squadmates against six enemy operators. First to 75 kills or most kills when the clock hits zero.',
 dom:'Capture and hold three flags. Each flag you own ticks points. First to 150, or the leader at the buzzer.',
 hp:'One hardpoint at a time, and it moves every minute. Hold it alone to score a point a second. First to 200 wins.',survival:'Hold out alone against 10 escalating waves. Each wave has its own timer. Ammo restocks between waves.'};
export function makeMode(G,opt){if(opt.mode==='tdm')return tdm(G,opt);if(opt.mode==='dom')return dom(G,opt);if(opt.mode==='hp')return hardpoint(G,opt);if(opt.mode==='survival')return survival(G,opt);return campaign(G,opt);}
const yawTo=(x,z,tx=0,tz=0)=>Math.atan2(tx-x,tz-z);
const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
// fill both sides with squads (player squad = 0/1, enemies = 2/3)
function teams(G,role,o={}){const L=G.level,s=L.spawns.a[0];G.makePlayer(s[0],s[1],yawTo(s[0],s[1]));const an=G.names(0,5),en=G.names(1,6);
 an.forEach((n,i)=>{const p=L.spawns.a[(i+1)%L.spawns.a.length];G.spawnBot({team:0,x:p[0]+rr(-1,1),z:p[1]+rr(-1,1),yaw:yawTo(p[0],p[1]),role,squad:i<2?0:1,weapon:G.pickWeapon(0),name:n});});
 en.forEach((n,i)=>{const p=L.spawns.b[i%L.spawns.b.length];G.spawnBot({team:1,x:p[0]+rr(-1,1),z:p[1]+rr(-1,1),yaw:yawTo(p[0],p[1]),role,squad:i<3?2:3,weapon:G.pickWeapon(1),name:n,att:Math.random()<.3?{supp:1}:{}});});void o;}
function respawnLoop(G,M,dt){const sp=t=>M.fwd?fwdSpawn(G,t):G.spawnPoint(t);for(const a of G.actors){if(a.alive||a.isPlayer)continue;a.respT=(a.respT??(M.resp||4))-dt;if(a.respT<=0){a.respT=undefined;const s=sp(a.team);G.respawnActor(a,s.x,s.z,yawTo(s.x,s.z));}}
 const P=G.player;if(P&&!P.alive){M.pT-=dt;if(M.pT<=0){const s=sp(0);G.respawnPlayer(s.x,s.z,yawTo(s.x,s.z));}}}
// forward spawns: base points plus the map's hot spots, picking one ~M.fwd metres from the nearest enemy (never closer than 24 m) so respawns rejoin the fight instead of walking across the whole map
function fwdSpawn(G,team){const L=G.level,M=G.mode,foes=G.actors.filter(b=>b.alive&&b.team!==team&&!b.ghost);if(!foes.length)return G.spawnPoint(team);let best=null,bs=-1e9;
 for(const p of(team===0?L.spawns.a:L.spawns.b).concat(L.hot)){let md=1e9;for(const b of foes)md=Math.min(md,Math.hypot(b.pos.x-p[0],b.pos.z-p[1]));if(md<24)continue;const s=-Math.abs(md-M.fwd)+Math.random()*8;if(s>bs){bs=s;best=p;}}
 return best?{x:best[0]+rr(-1.5,1.5),z:best[1]+rr(-1.5,1.5)}:G.spawnPoint(team);}

/* ================= TEAM DEATHMATCH ================= */
function tdm(G,opt){const M={kind:'tdm',map:opt.map||'sandgate',clock:480,limit:75,score:[0,0],label:'TEAM DEATHMATCH',corpse:6,skirm:1,resp:4,fwd:48,pT:0,warned:false,
 init(){teams(G,'tdm');HUD.banner(G,'TEAM DEATHMATCH',`FIRST TO ${M.limit} · ${G.level.name}`,'#ff4d00',2.6);},
 update(dt){M.clock-=dt*G.clockScale;if(M.clock<=60&&!M.warned){M.warned=true;HUD.ann(G,'ONE MINUTE REMAINING',3);G.snd.play('beep',1);}if(M.clock<=0){M.clock=0;M.end();return;}respawnLoop(G,M,dt);},
 onKill(v,k){if(G.over)return;const t=k&&k.team!==v.team?k.team:1-v.team;M.score[t]++;if(M.score[t]>=M.limit)M.end();},
 onPlayerDeath(){M.pT=3.2;},
 end(){const s=M.score,res=s[0]>s[1]?'win':s[0]<s[1]?'lose':'draw';G.endMatch(res,res==='win'?'VICTORY':res==='lose'?'DEFEAT':'DRAW',`${s[0]} — ${s[1]}`);},
 points(){const P=G.player;return P.stats.score+(G.over&&G.over.res==='win'?1000:G.over&&G.over.res==='draw'?300:0);},
 top(){return{f:M.score[0],e:M.score[1],clock:M.clock,lbl:`FIRST TO ${M.limit}`};},
 objText(){return['TEAM DEATHMATCH','First team to '+M.limit+' kills wins.'];},marks(){return[];},respawnLeft(){return M.pT;}};return M;}

/* ================= DOMINATION ================= */
function dom(G,opt){const M={kind:'dom',map:opt.map||'sandgate',clock:480,limit:150,score:[0,0],label:'DOMINATION',corpse:6,pT:0,warned:false,tick:0,flags:[],
 init(){const L=G.level;M.flags=L.flags.map(f=>({id:f.id,x:f.x,z:f.z,r:5,own:-1,prog:0,cap:-1,n:[0,0]}));
  // home flags start owned
  M.flags[0].own=0;M.flags[0].prog=1;M.flags[2].own=1;M.flags[2].prog=1;teams(G,'dom');G.pickFlag=M.pickFlag;M.fx=M.flags.map(f=>zoneFx(G,f.x,f.z,f.r));
  HUD.banner(G,'DOMINATION',`CAPTURE AND HOLD · ${L.name}`,'#ff4d00',2.6);HUD.radio(G,'HQ','Take B and hold two flags. That wins it.',true);},
 pickFlag(a){const t=a.team,F=M.flags,sq=a.ai.squad,odd=sq===1||sq===3;const B=F[1],home=F[t===0?0:2],away=F[t===0?2:0];
  // main squads fight for B; flank squads raid the enemy's home flag or defend their own when it is threatened
  if(!odd){if(B.own!==t)return B;if(away.own!==t&&Math.random()<.6)return away;return home.own!==t?home:B;}
  if(home.own!==t||home.contested)return home;if(away.own!==t&&Math.random()<.7)return away;return B.own!==t?B:away;},
 update(dt){M.clock-=dt*G.clockScale;if(M.clock<=60&&!M.warned){M.warned=true;HUD.ann(G,'ONE MINUTE REMAINING',3);G.snd.play('beep',1);}if(M.clock<=0){M.clock=0;M.end();return;}respawnLoop(G,M,dt);
  const P=G.player;
  for(const f of M.flags){f.n[0]=f.n[1]=0;for(const a of G.actors){if(!a.alive||a.vip)continue;if(Math.hypot(a.pos.x-f.x,a.pos.z-f.z)<f.r)f.n[a.team]++;}
   const a0=f.n[0],a1=f.n[1];const side=a0&&!a1?0:a1&&!a0?1:-1;f.contested=a0&&a1;
   if(side>=0){const rate=dt/6*Math.min(2.5,1+(Math.max(a0,a1)-1)*.5);if(f.own===side){f.prog=Math.min(1,f.prog+rate);}
    else{if(f.cap!==side&&f.prog>0&&f.own!==-1){f.prog-=rate;if(f.prog<=0){f.prog=0;const was=f.own;f.own=-1;f.cap=side;if(was===0)HUD.ann(G,`FLAG ${f.id} LOST`,2);}}else{f.cap=side;f.prog=f.own===-1?f.prog+rate:f.prog;if(f.own===-1&&f.prog>=1){f.prog=1;f.own=side;f.cap=-1;
      G.snd.play(side===0?'capture':'lost');HUD.ann(G,side===0?`FLAG ${f.id} SECURED`:`ENEMY TOOK ${f.id}`,2);if(side===0&&P&&P.alive&&Math.hypot(P.pos.x-f.x,P.pos.z-f.z)<f.r){P.stats.score+=200;HUD.xp(G,200,'FLAG CAPTURED');}
      for(const b of G.actors)if(b.ai&&b.ai.flag===f&&b.team===side)b.ai.flagT=-99;}}}}
   else if(!f.contested&&f.own===-1&&f.prog>0&&f.n[0]+f.n[1]===0)f.prog=Math.max(0,f.prog-dt/12);}
  if(M.fx)M.flags.forEach((f,i)=>M.fx[i].set(f.contested?'con':f.own===0?'own':f.own===1?'foe':'neu',G.time));
  M.tick+=dt;if(M.tick>=2){M.tick-=2;for(const f of M.flags)if(f.own>=0)M.score[f.own]++;if(M.score[0]>=M.limit||M.score[1]>=M.limit)M.end();}},
 onKill(v,k){if(G.over||!k||k===v||k.team===v.team)return;for(const f of M.flags){if(Math.hypot(v.pos.x-f.x,v.pos.z-f.z)<f.r+3&&k.isPlayer){k.stats.score+=50;HUD.xp(G,50,f.own===k.team?'DEFENDED':'ATTACKED');break;}}},
 onPlayerDeath(){M.pT=3.2;},
 end(){const s=M.score,res=s[0]>s[1]?'win':s[0]<s[1]?'lose':'draw';G.endMatch(res,res==='win'?'VICTORY':res==='lose'?'DEFEAT':'DRAW',`${s[0]} — ${s[1]}`);},
 points(){const P=G.player;return P.stats.score+M.score[0]*4+(G.over&&G.over.res==='win'?1000:G.over&&G.over.res==='draw'?300:0);},
 top(){return{f:M.score[0],e:M.score[1],clock:M.clock,lbl:`FIRST TO ${M.limit}`,flags:M.flags};},
 objText(){const own=M.flags.filter(f=>f.own===0).length;return['DOMINATION',`You hold ${own} of 3 flags. Capture and defend.`];},
 marks(){return M.flags.map(f=>({p:new V(f.x,0,f.z),label:f.id,cls:'flag '+(f.own===0?'own':f.own===1?'foe':'neu')+(f.contested?' con':''),h:2.2,flag:f}));},
 respawnLeft(){return M.pT;},skip(){for(const f of M.flags){f.own=0;f.prog=1;}},dispose(){if(M.fx)M.fx.forEach(z=>z.dispose());}};return M;}

/* ================= objective zones in the world: ground ring, faint fill, light column (column MEDIUM+) ================= */
const ZC={own:0x4aa8ff,foe:0xff3b30,neu:0xeae4d6,con:0xffd23f};
function zoneFx(G,x,z,r){const T=G.THREE,g=new T.Group();g.position.set(x,0,z);
 const ringM=new T.MeshBasicMaterial({color:ZC.neu,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide,fog:false}),ring=new T.Mesh(new T.RingGeometry(r-.22,r,72),ringM);ring.rotation.x=-PI/2;ring.position.y=.07;g.add(ring);
 const fillM=new T.MeshBasicMaterial({color:ZC.neu,transparent:true,opacity:.07,depthWrite:false,fog:false}),fill=new T.Mesh(new T.CircleGeometry(r-.22,48),fillM);fill.rotation.x=-PI/2;fill.position.y=.065;g.add(fill);
 let colU=null;if((G.gfx??1)>0){colU={value:new T.Color(ZC.neu)};const bm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{uC:colU,uT:{value:0}},
  vertexShader:'varying float vY;varying vec3 vN,vV;void main(){vY=uv.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;varying float vY;varying vec3 vN,vV;void main(){float e=1.-abs(dot(vN,vV));gl_FragColor=vec4(uC*(1.-vY)*(1.-vY)*(.12+e*.25),1.);}'});
  const beam=new T.Mesh(new T.CylinderGeometry(r,r,7,48,1,true),bm);beam.position.y=3.5;g.add(beam);}
 G.scene.add(g);return{g,set(k,t){const c=ZC[k];ringM.color.setHex(c);fillM.color.setHex(c);ringM.opacity=k==='con'?.55+.35*Math.sin(t*10):.8;if(colU)colU.value.setHex(c);},dispose(){G.scene.remove(g);}};}

/* ================= HARDPOINT ================= */
function hardpoint(G,opt){const M={kind:'hp',map:opt.map||'sandgate',clock:480,limit:200,score:[0,0],label:'HARDPOINT',corpse:6,skirm:1,resp:4,fwd:44,pT:0,warned:false,zi:-1,zt:0,ZT:60,zones:[],z:null,acc:[0,0],mine:0,fx:null,
 init(){const L=G.level,cand=[L.flags[1],L.flags[0],L.flags[2]].map(f=>[f.x,f.z]).concat(L.hot);const pts=[];for(const p of cand){if(pts.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<22))continue;if(Math.abs(p[1])>44)continue;pts.push(p);if(pts.length>=5)break;}
  M.zones=pts.map((p,i)=>({id:'P'+(i+1),x:p[0],z:p[1],r:6,own:-1,contested:false,n:[0,0]}));teams(G,'dom');G.pickFlag=()=>M.z;M.next(true);
  HUD.banner(G,'HARDPOINT',`HOLD THE ZONE · ${L.name}`,'#ff4d00',2.6);HUD.radio(G,'HQ','Hardpoint is live. Get in the zone and stay there.',true);},
 next(first){if(M.fx)M.fx.dispose();M.zi=(M.zi+1)%M.zones.length;M.z=M.zones[M.zi];M.z.own=-1;M.zt=M.ZT;M.fx=zoneFx(G,M.z.x,M.z.z,M.z.r);for(const b of G.actors)if(b.ai){b.ai.flagT=-99;b.ai.flag=M.z;}
  if(!first){HUD.ann(G,'HARDPOINT MOVED',2.2);G.snd.play('beep',1);}},
 update(dt){M.clock-=dt*G.clockScale;if(M.clock<=60&&!M.warned){M.warned=true;HUD.ann(G,'ONE MINUTE REMAINING',3);G.snd.play('beep',1);}if(M.clock<=0){M.clock=0;M.end();return;}respawnLoop(G,M,dt);
  M.zt-=dt;if(M.zt<=0){M.next();return;}const z=M.z,P=G.player;z.n[0]=z.n[1]=0;for(const a of G.actors){if(!a.alive||a.vip)continue;if(Math.hypot(a.pos.x-z.x,a.pos.z-z.z)<z.r)z.n[a.team]++;}
  const side=z.n[0]&&!z.n[1]?0:z.n[1]&&!z.n[0]?1:-1;z.contested=!!(z.n[0]&&z.n[1]);if(side!==z.own&&side>=0){HUD.ann(G,side===0?'HARDPOINT SECURED':'ENEMY HOLDS THE HARDPOINT',1.6);G.snd.play(side===0?'capture':'lost');}z.own=side;
  if(M.fx)M.fx.set(z.contested?'con':side===0?'own':side===1?'foe':'neu',G.time);
  if(side>=0){M.acc[side]+=dt;while(M.acc[side]>=1){M.acc[side]-=1;M.score[side]++;}}
  if(P&&P.alive&&side===0&&Math.hypot(P.pos.x-z.x,P.pos.z-z.z)<z.r){M.mine+=dt;if(M.mine>=5){M.mine-=5;P.stats.score+=50;HUD.xp(G,50,'HARDPOINT');}}
  if(M.score[0]>=M.limit||M.score[1]>=M.limit)M.end();},
 onKill(v,k){if(G.over||!k||k===v||k.team===v.team||!k.isPlayer)return;const z=M.z;const dv=Math.hypot(v.pos.x-z.x,v.pos.z-z.z),dk=Math.hypot(k.pos.x-z.x,k.pos.z-z.z);if(dk<z.r){k.stats.score+=50;HUD.xp(G,50,'ZONE DEFENCE');}else if(dv<z.r+2){k.stats.score+=50;HUD.xp(G,50,'ZONE ATTACK');}},
 onPlayerDeath(){M.pT=3.2;},
 end(){const s=M.score,res=s[0]>s[1]?'win':s[0]<s[1]?'lose':'draw';G.endMatch(res,res==='win'?'VICTORY':res==='lose'?'DEFEAT':'DRAW',`${s[0]} — ${s[1]}`);},
 points(){const P=G.player;return P.stats.score+M.score[0]*3+(G.over&&G.over.res==='win'?1000:G.over&&G.over.res==='draw'?300:0);},
 top(){return{f:M.score[0],e:M.score[1],clock:M.clock,lbl:`ZONE ${M.zi+1} · MOVES ${mmss(M.zt)}`,flags:[{id:'HP',own:M.z.own,contested:M.z.contested}]};},
 objText(){const z=M.z;return['HARDPOINT',z.contested?'Zone contested. Clear it out.':z.own===0?'Your team holds the zone. Keep it.':z.own===1?'Enemy holds the zone. Push in.':'Zone is empty. Get on it.'];},
 marks(){const z=M.z,out=[{p:new V(z.x,0,z.z),label:'HP',cls:'flag '+(z.own===0?'own':z.own===1?'foe':'neu')+(z.contested?' con':''),h:2.2,flag:{id:'HP',own:z.own}}];
  if(M.zt<12){const n=M.zones[(M.zi+1)%M.zones.length];out.push({p:new V(n.x,0,n.z),label:'NEXT',cls:'',h:1.4});}return out;},
 respawnLeft(){return M.pT;},skip(){M.score[0]=M.limit-1;},dispose(){if(M.fx)M.fx.dispose();}};return M;}

/* ================= SURVIVAL ================= */
function survival(G,opt){const M={kind:'survival',map:opt.map||'northwatch',wave:0,phase:'inter',clock:8,toSpawn:0,spawnT:0,label:'SURVIVAL',corpse:6,maxWave:10,
 init(){const L=G.level,s=L.flags[1];G.makePlayer(s.x,s.z+3,PI);HUD.banner(G,'SURVIVAL','HOLD OUT FOR 10 WAVES','#ff4d00',2.6);HUD.radio(G,'HQ','Hostile columns inbound. Dig in at the centre.',true);},
 alive(){return G.actors.filter(a=>a.alive&&a.team===1).length;},
 update(dt){M.clock-=dt*G.clockScale;const P=G.player;const L=G.level;
  if(M.phase==='inter'){if(M.clock<=0)M.startWave();return;}
  M.spawnT-=dt;const max=Math.min(11,4+M.wave);if(M.toSpawn>0&&M.spawnT<=0&&M.alive()<max){M.spawnT=Math.max(.7,2.6-M.wave*.18);M.toSpawn--;
   const pool=L.spawns.b.concat(M.wave>=3?L.spawns.a:[]).filter(p=>Math.hypot(p[0]-P.pos.x,p[1]-P.pos.z)>26);const p=pool[Math.random()*pool.length|0]||L.spawns.b[0];
   const rush=M.wave>=3&&Math.random()<.35;const a=G.spawnBot({team:1,x:p[0]+rr(-2,2),z:p[1]+rr(-2,2),yaw:yawTo(p[0],p[1],0,0),role:'hunt',hunt:()=>G.player&&G.player.alive?G.player.pos:new V(0,0,0),weapon:rush?'shotgun':G.pickWeapon(1),name:'HOSTILE',hp:100+M.wave*6});a.ai.alerted=M.wave>2;}
  const left=M.toSpawn+M.alive();if(left===0){M.cleared();return;}
  if(M.clock<=0){M.clock=0;G.endMatch('lose','OVERRUN',`WAVE ${M.wave} TIMER EXPIRED`);}},
 startWave(){M.wave++;M.phase='fight';M.toSpawn=Math.min(30,4+M.wave*2);M.clock=70+M.wave*12;M.spawnT=.5;HUD.banner(G,'WAVE '+M.wave,`${M.toSpawn} HOSTILES · ${mmss(M.clock)} ON THE CLOCK`,'#ff4d00',2.2);G.snd.play('beep',1);
  for(const a of G.actors.slice())if(!a.alive&&a.team===1)G.removeActor(a);},
 cleared(){const P=G.player;const b=200*M.wave;P.stats.score+=b;HUD.xp(G,b,'WAVE '+M.wave+' CLEARED');G.refill();P.hp=P.maxHp;
  if(M.wave>=M.maxWave){G.endMatch('win','SURVIVED',`ALL ${M.maxWave} WAVES CLEARED`);return;}M.phase='inter';M.clock=9;HUD.banner(G,'WAVE '+M.wave+' CLEARED','AMMO RESUPPLIED · NEXT WAVE IN 9s','#5fe08a',2.4);G.snd.play('obj');},
 onKill(){},onPlayerDeath(){if(!G.over)G.endMatch('lose','OVERRUN',`FELL ON WAVE ${M.wave}`);},
 points(){return G.player.stats.score+M.wave*150;},
 top(){return{solo:true,clock:M.clock,lbl:M.phase==='inter'?'NEXT WAVE':`WAVE ${M.wave}/${M.maxWave}`};},
 objText(){return M.phase==='inter'?['RESUPPLY',M.wave?'Wave cleared. Ammo restocked. Get ready.':'Take position. First wave incoming.']:[`WAVE ${M.wave} OF ${M.maxWave}`,`${M.toSpawn+M.alive()} hostiles left. Clear them before the timer runs out.`];},marks(){return[];},
 skip(){for(const a of G.actors)if(a.alive&&a.team===1){a.hp=0;a.alive=false;}M.toSpawn=0;}};return M;}

/* ================= CAMPAIGN ================= */
function campaign(G,opt){const def=MISSIONS[opt.mission||0];const M={kind:'campaign',map:def.map,clock:def.time,label:def.name,def,corpse:40,i:0,lives:3,cp:null,respawnIn:0,objDone:0,objs:[],heli:null,extra:[],fire:null,warned:false,intro:null,
 init(){SCRIPTS[def.id](G,M);M.cp=M.cpNow();M.enter();M.intro=M.intro||null;},
 cpNow(){const P=G.player;return{x:P.pos.x,z:P.pos.z,yaw:P.yaw};},
 enter(){const o=M.objs[M.i];if(!o)return;if(o.enter)o.enter();HUD.objective(G,o.t,o.s);},
 update(dt){const P=G.player;if(!G.cine)M.clock-=dt*G.clockScale;if(M.clock<=60&&!M.warned){M.warned=true;HUD.ann(G,'ONE MINUTE REMAINING',3);}
  if(M.clock<=0){M.clock=0;M.fail('OUT OF TIME');return;}
  if(M.heli){const h=M.heli;h.t+=dt;const k=Math.min(1,h.t/9);h.m.position.y=h.y0+(1-k*k*(3-2*k))*36;h.m.position.x=h.x+(1-k)*30;h.m.userData.rotor.rotation.y+=dt*28;h.m.userData.tr.rotation.x+=dt*40;h.m.userData.beacon.visible=(G.time*1.5|0)%2===0;if(Math.random()<dt*1.5)G.snd.play('heli',Math.max(.2,1-P.pos.distanceTo(h.m.position)/80));
   if(Math.random()<dt*20){const p=h.m.position;G.fx.smoke.emit(p.x+rr(-5,5),.3,p.z+rr(-5,5),rr(-4,4),.5,rr(-4,4),.7*G.fx.dustK,.64*G.fx.dustK,.55*G.fx.dustK,1.6,1.6,0,1.5,1.4);}}
  if(M.fire&&Math.random()<dt*30){const f=M.fire;G.fx.sparks.emit(f.x+rr(-1,1),f.y+rr(.3,2.5),f.z+rr(-1,1),rr(-.3,.3),rr(1.5,3),rr(-.3,.3),4,1.6+Math.random(),.4,rr(.4,.9),rr(.4,.9),-1,1);if(Math.random()<.5)G.fx.smoke.emit(f.x+rr(-1,1),f.y+2,f.z+rr(-1,1),rr(-.2,.2),rr(1.5,2.5),rr(-.2,.2),.12,.11,.1,2,5,0,.3,1.2);}
  if(G.cine)return;
  if(P&&!P.alive){if(M.respawnIn>0){M.respawnIn-=dt;if(M.respawnIn<=0)M.restore();}return;}
  const o=M.objs[M.i];if(!o)return;if(o.update(dt)){M.objDone++;if(o.done)o.done();M.i++;P.stats.score+=500;HUD.xp(G,500,'OBJECTIVE COMPLETE');G.snd.play('obj');
   if(M.i>=M.objs.length){G.endMatch('win','MISSION COMPLETE',def.name+' · '+mmss(def.time-M.clock));return;}
   M.cp=M.cpNow();HUD.ann(G,'CHECKPOINT',2.2);M.enter();}},
 restore(){const c=M.cp;G.respawnPlayer(c.x,c.z,c.yaw);G.refill();HUD.objective(G,M.objs[M.i].t,M.objs[M.i].s);
  for(const a of G.actors)if(!a.alive&&a.team===0&&!a.isPlayer&&!a.vip)G.respawnActor(a,c.x+rr(-2,2),c.z+rr(-2,2),c.yaw);},
 fail(why){G.endMatch('lose','MISSION FAILED',why);},
 onKill(v){if(G.over)return;if(v.vip)M.fail('THE ASSET WAS KILLED');},
 onPlayerDeath(){if(G.over)return;M.lives--;if(M.lives<0){M.fail('KILLED IN ACTION');return;}M.respawnIn=3.5;},
 points(){const P=G.player,s=P.stats;return Math.max(0,s.kills*100+s.heads*50+M.objDone*500+(G.over&&G.over.res==='win'?2000+Math.round(M.clock)*5:0)-s.deaths*200);},
 top(){return{solo:true,clock:M.clock,lbl:def.name};},
 objText(){const o=M.objs[M.i];return o?[o.t,o.sub?o.sub():o.s]:['',''];},
 marks(){const o=M.objs[M.i];const out=[];if(o&&o.mark){const p=o.mark();if(Array.isArray(p))p.forEach(q=>out.push({p:q,label:o.ml||'OBJECTIVE',cls:''}));else if(p)out.push({p,label:o.ml||'OBJECTIVE',cls:''});}if(M.vip&&M.vip.alive&&M.vip.ai.fol)out.push({p:M.vip.pos,label:'ASSET',cls:'vip',h:2.1});return out;},
 respawnLeft(){return M.respawnIn;},
 skip(){const o=M.objs[M.i];if(o&&o.force)o.force();else if(o)o.update=()=>true;},
 dispose(){if(M.heli)G.scene.remove(M.heli.m);for(const x of M.extra)G.scene.remove(x);}};
 return M;}

function enemy(G,x,z,role,o={}){return G.spawnBot({team:1,x,z,role,weapon:o.weapon||G.pickWeapon(1,role),name:o.name||'HOSTILE',post:new V(x,0,z),...o});}
function heliIn(G,M,x,z,yaw=0){const m=makeHeli();m.position.set(x+30,40,z);m.rotation.y=yaw;G.scene.add(m);M.heli={m,t:0,y0:.12,x};}
const near=(a,p,r)=>a&&Math.hypot(a.pos.x-p.x,a.pos.z-p.z)<r;
// hold-E interaction helper: returns true once complete
function holdE(G,P,p,r,dur,label){const nearIt=Math.hypot(P.pos.x-p.x,P.pos.z-p.z)<r;if(!nearIt){HUD.prompt(G,null);return false;}HUD.prompt(G,'HOLD E — '+label,Math.min(1,P.interact/dur));return P.interact>=dur;}
// intro camera shots: [from, to, lookFrom, lookTo, seconds]
const shot=(a,b,la,lb,d)=>({a:new V(...a),b:new V(...b),la:new V(...la),lb:new V(...lb),d});

const SCRIPTS={
 /* ---------- 1. COLD OPEN (Northwatch, morning) ---------- */
 coldopen(G,M){const L=G.level,s=L.pts.start,P=G.makePlayer(s.x,s.z,s.yaw);const rad=L.pts.radar,bk=L.pts.bunker,lz=L.pts.lz;
  ['REYES','HOLT','MBEKI'].forEach((n,i)=>G.spawnBot({team:0,x:s.x+(i-1)*1.8,z:s.z+1.5,yaw:s.yaw,role:'follow',fol:P,slot:(i-1)*1.8,weapon:['ar','smg','lmg'][i],att:{supp:i<2?1:0},name:n}));
  enemy(G,-5,49,'guard',{yaw:0});enemy(G,5,49,'guard',{yaw:0});enemy(G,-20,40,'patrol',{route:[[-20,40],[20,40],[20,46],[-20,46]]});enemy(G,-12,20,'guard',{yaw:0});enemy(G,14,22,'guard',{yaw:0});
  enemy(G,-4,4,'guard',{yaw:0,tag:'rad'});enemy(G,5,6,'guard',{yaw:.3,tag:'rad'});enemy(G,-10,-12,'patrol',{route:[[-10,-12],[10,-12],[10,-24],[-10,-24]]});enemy(G,20,-6,'guard',{yaw:PI/2});enemy(G,-24,6,'guard',{yaw:-PI/2});
  for(const[x,z,y]of[[34,-20,PI/2],[44,-18,0],[40,-25,PI],[36,-8,0],[46,-8,0]])enemy(G,x,z,'guard',{tag:'bunker',yaw:y});
  let charge=-1;
  M.intro={shots:[shot([60,30,90],[20,18,70],[0,6,0],[0,4,-8],4.2),shot([-14,4,62],[-6,2.4,58],[0,3,40],[0,2,52],3.6)],lines:['OPERATION COLD OPEN',def(M).when,'Raven team, the station radar is painting our birds. Take it off the air.']};
  M.objs=[
   {t:'BREACH THE PERIMETER',s:'Push through the fence gate. Suppressed rifles keep you quiet.',ml:'GATE',mark:()=>new V(0,0,54),update:()=>P.pos.z<48,enter(){HUD.radio(G,'REYES','Gate guards ahead. Take them quiet.');}},
   {t:'DESTROY THE RADAR',s:'Hold [E] at the radar tower door to plant a charge.',ml:'RADAR',mark:()=>charge<0?new V(rad.x,0,rad.z):null,
    sub:()=>charge>=0?`Charge set. Clear the blast radius! ${Math.ceil(charge)}`:'Hold [E] at the radar tower door to plant a charge.',
    update(dt){if(charge>=0){charge-=dt;if(charge<=0){G.explode(new V(rad.x,2,rad.z-3),P,12,400,'frag');G.explode(new V(rad.x,9,rad.z-6),null,8,0,'frag');M.fire={x:rad.x,y:7,z:rad.z-8};G.shake(1.2);HUD.radio(G,'HQ','Radar is off the air. Good effect.',true);return true;}return false;}
     if(holdE(G,P,rad,2.8,2.4,'PLANT CHARGE')){charge=6;G.snd.play('beep',1);HUD.prompt(G,null);HUD.radio(G,'HOLT','Charge is live! Move!');}return false;},force(){charge=.01;}},
   {t:'CLEAR THE BUNKER',s:'Clear every hostile at the east bunker.',ml:'BUNKER',mark:()=>new V(bk.x,0,bk.z),sub:()=>`Clear the east bunker. ${G.actors.filter(a=>a.alive&&a.tag==='bunker').length} hostiles left.`,
    enter(){for(const a of G.actors)if(a.tag==='bunker'&&a.alive)a.ai.alerted=true;for(const p of[[30,-50],[40,-50]])enemy(G,p[0],p[1],'hunt',{hunt:()=>P.pos});HUD.radio(G,'MBEKI','Bunker is waking up. Stack on the west door.');},
    update:()=>!G.actors.some(a=>a.alive&&a.tag==='bunker')},
   {t:'EXFIL',s:'Get to the landing zone west of the radar.',ml:'LZ',mark:()=>new V(lz.x,0,lz.z),
    enter(){heliIn(G,M,lz.x,lz.z,-.6);HUD.radio(G,'HQ','Bird inbound. Quick reaction force is rolling on you.',true);for(const p of[[-20,-50],[-34,-50],[-46,-40],[-10,-50],[0,-50],[-46,-30]])enemy(G,p[0],p[1],'hunt',{hunt:()=>P.pos});},
    update:()=>near(P,lz,7)&&M.heli&&M.heli.t>8.5}];},
 /* ---------- 2. DEAD CALM (Harbor 9, golden hour) ---------- */
 deadcalm(G,M){const L=G.level,s=L.pts.start,P=G.makePlayer(s.x,s.z,s.yaw);const C=[L.pts.c1,L.pts.c2,L.pts.c3],up=L.pts.up,lz=L.pts.lz;const done=[0,0,0];let upl=0,meter=0,spawnT=3;
  ['CRUZ','IKEDA'].forEach((n,i)=>G.spawnBot({team:0,x:s.x+(i?1.6:-1.6),z:s.z+1.5,yaw:s.yaw,role:'follow',fol:P,slot:i?1.8:-1.8,weapon:i?'shotgun':'ar',name:n}));
  for(const[x,z,y]of[[-44,18,PI],[-38,8,-PI/2],[24,-6,PI/2],[18,-2,PI],[-22,24,PI],[-14,34,PI],[0,-4,0],[-6,6,PI/2],[8,10,PI],[30,-40,0],[36,-30,PI/2]])enemy(G,x,z,'guard',{yaw:y});
  enemy(G,-30,0,'patrol',{route:[[-30,-20],[-30,20],[-24,20],[-24,-20]]});enemy(G,30,10,'patrol',{route:[[27,-20],[27,20]]});
  M.intro={shots:[shot([-110,14,40],[-80,10,10],[-60,4,0],[0,6,-5],4.2),shot([-56,3,56],[-50,2.2,52],[-40,2,30],[-46,1.6,42],3.6)],lines:['OPERATION DEAD CALM',def(M).when,'Three boxes on that terminal carry the weapons shipment. Find them, then send us the manifest.']};
  M.objs=[
   {t:'INSPECT THE CONTAINERS',s:'Find the three flagged containers and hold [E] to check each one.',ml:'CHECK',mark:()=>C.filter((c,i)=>!done[i]).map(c=>new V(c.x,0,c.z)),
    sub:()=>`Hold [E] at each flagged container. ${done.filter(Boolean).length} of 3 checked.`,
    update(){let any=false;C.forEach((c,i)=>{if(done[i])return;const n=Math.hypot(P.pos.x-c.x,P.pos.z-c.z)<2.6;if(n){any=true;HUD.prompt(G,'HOLD E — INSPECT CONTAINER',Math.min(1,P.interact/1.6));if(P.interact>=1.6){done[i]=1;P.interact=0;G.snd.play('obj');HUD.xp(G,150,'INTEL');P.stats.score+=150;HUD.radio(G,'HQ',['First one confirmed. Rifles and mortar tubes.','Second container confirmed. Two to go... one to go.','That is the last one. Get to the warehouse terminal.'][done.filter(Boolean).length-1],true);}}});if(!any)HUD.prompt(G,null);return done.every(Boolean);},force(){done.fill(1);}},
   {t:'UPLOAD THE MANIFEST',s:'Hold [E] at the warehouse terminal, then defend it while it uploads.',ml:'TERMINAL',mark:()=>new V(up.x,0,up.z),
    sub:()=>upl>0?`Uploading ${Math.min(100,Math.round(upl/60*100))}%. Keep hostiles away from the terminal.`:'Hold [E] at the warehouse terminal to start the upload.',
    enter(){HUD.radio(G,'IKEDA','Terminal is inside warehouse four.');},
    update(dt){if(upl<=0){if(holdE(G,P,up,2.6,2,'START UPLOAD')){upl=.01;HUD.prompt(G,null);G.snd.play('beep',1);HUD.radio(G,'HQ','Upload started. They will come for that terminal.',true);HUD.objBar(G,0);}return false;}
     upl+=dt*G.clockScale;spawnT-=dt;const max=4+G.diffI;if(spawnT<=0&&G.actors.filter(a=>a.alive&&a.team===1).length<max){spawnT=Math.max(2,4.5-G.diffI*.7);const p=L.spawns.b[Math.random()*L.spawns.b.length|0];enemy(G,p[0],p[1],'assault',{hold:new V(up.x,0,up.z),yaw:0}).ai.alerted=true;}
     let en=0;for(const a of G.actors)if(a.alive&&a.team===1&&Math.hypot(a.pos.x-up.x,a.pos.z-up.z)<7)en++;if(en)meter+=dt*8*en;else meter=Math.max(0,meter-dt*5);HUD.objBar(G,Math.min(1,upl/60));
     if(meter>=100){M.fail('TERMINAL LOST');return false;}if(upl>=60){HUD.objBar(G,-1);return true;}return false;},force(){upl=60;}},
   {t:'EXFIL',s:'Reach the helicopter pad on the south road.',ml:'LZ',mark:()=>new V(lz.x,0,lz.z),enter(){heliIn(G,M,lz.x,lz.z,PI/2);HUD.radio(G,'HQ','Manifest received. Bird is on the south road. Go!',true);for(const a of G.actors)if(a.alive&&a.team===1){a.ai.role='hunt';a.ai.hunt=()=>P.pos;}},
    update:()=>near(P,lz,7)&&M.heli&&M.heli.t>8.5}];},
 /* ---------- 3. HIGH NOON (Sandgate, midday) ---------- */
 highnoon(G,M){const L=G.level,s=L.pts.start,P=G.makePlayer(s.x,s.z,s.yaw),vp=L.pts.vip,pl=L.pts.plaza,lz=L.pts.lz;
  ['VANCE','OKORO'].forEach((n,i)=>G.spawnBot({team:0,x:s.x+2,z:s.z+(i?1.6:-1.6),yaw:s.yaw,role:'follow',fol:P,slot:i?1.8:-1.8,weapon:i?'lmg':'ar',name:n}));
  const vip=M.vip=G.spawnBot({team:0,x:vp.x,z:vp.z,yaw:PI,role:'vip',vip:true,name:'ASSET',hp:240});vip.ai.fol=null;
  enemy(G,-24,28,'patrol',{route:[[-30,27],[-10,27]]});enemy(G,-36,24,'guard',{yaw:PI});
  M.intro={shots:[shot([0,40,95],[0,22,62],[0,4,0],[0,3,20],4.2),shot([-38,3.4,56],[-42,2.4,52],[-44,2,40],[-44,1.6,44],3.6)],lines:['OPERATION HIGH NOON',def(M).when,'The defector is in a safehouse by the south wall. Walk him out the north gate.']};
  M.objs=[
   {t:'LINK UP WITH THE ASSET',s:'Reach the safehouse and make contact.',ml:'ASSET',mark:()=>vip.pos,update:()=>near(P,vip.pos,2.8)||vip.ai.fol,done(){vip.ai.fol=P;vip.ai.slot=0;HUD.radio(G,'ASSET','About time. Get me out of this oven.',true);}},
   {t:'CROSS THE MARKET',s:'Escort the asset into the market square and clear the ambush.',ml:'MARKET',mark:()=>new V(pl.x,0,pl.z),sub:()=>`Escort the asset into the market and clear the ambush. ${G.actors.filter(a=>a.alive&&a.tag==='plaza').length} hostiles.`,
    enter(){for(const[x,z]of[[-8,-4],[8,-4],[-11,9],[11,9],[0,-10],[5,12]])enemy(G,x,z,'guard',{tag:'plaza',yaw:PI});enemy(G,24,20,'hunt',{hunt:()=>P.pos,tag:'plaza'});HUD.radio(G,'OKORO','Market is too quiet. Eyes up.');},
    update:()=>near(vip,pl,13)&&!G.actors.some(a=>a.alive&&a.tag==='plaza')},
   {t:'REACH THE NORTH GATE',s:'Get the asset onto the helicopter at the north gate.',ml:'EVAC',mark:()=>new V(lz.x,0,lz.z),
    enter(){heliIn(G,M,lz.x,lz.z,PI/2);HUD.radio(G,'HQ','Evac is landing at the north gate. Hostiles converging on the street.',true);for(const[x,z]of[[-3,-30],[4,-36],[-10,-27],[12,-27],[0,-44]])enemy(G,x,z,'guard',{yaw:0});for(const[x,z]of[[30,-50],[-30,-50],[45,-27]])enemy(G,x,z,'hunt',{hunt:()=>vip.pos});},
    update:()=>near(vip,lz,7)&&near(P,lz,12)&&M.heli&&M.heli.t>8.5}];}
};
function def(M){return M.def;}
