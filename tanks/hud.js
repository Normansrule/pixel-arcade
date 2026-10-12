// IRONCLAD — HUD: scoreboard + objectives, vitals, reload, gun marker, nameplates, damage numbers, hit info, minimap, death screen, tab board.
import * as THREE from '../vendor/three.module.min.js';
import {fmt,cl} from './util.js';
import {TEAMC} from './tanks.js';
import {B,minimapLayer} from './maps.js';
const $=id=>document.getElementById(id);
const V=new THREE.Vector3();
export class HUD{
 constructor(G){this.G=G;this.c={};this.banT=0;this.msgT=0;this.hitT=0;this.deadOn=false;this.miniT=0;this.firedT=0;this.goT=0;
  this.plates=[];for(let i=0;i<24;i++){const d=document.createElement('div');d.innerHTML='<span></span><i><b></b></i>';d.style.display='none';$('plates').appendChild(d);this.plates.push({d,s:d.firstChild,i:d.querySelector('i'),b:d.querySelector('b'),last:''});}
  this.nums=[];for(let i=0;i<16;i++){const s=document.createElement('span');s.style.display='none';$('nums').appendChild(s);this.nums.push({s,t:0,p:new THREE.Vector3()});}
  this.dirs=[];for(let i=0;i<6;i++){const e=document.createElement('i');$('dmgdir').appendChild(e);this.dirs.push({e,t:0,p:new THREE.Vector3()});}
  this.mini=$('mini').getContext('2d');this.miniBase=null;}
 show(on){$('hud').hidden=!on;if(!on){$('vig').style.opacity=0;}}
 reset(){$('feed').innerHTML='';this.banT=0;$('banner').classList.remove('on');this.msgT=0;$('msg').classList.remove('on');this.dead(false);this.zoom(false,1);this.hitT=0;$('hitinfo').classList.remove('on');for(const n of this.nums){n.t=0;n.s.style.display='none';}for(const d of this.dirs){d.t=0;d.e.style.opacity=0;}this.miniBase=null;this.c={};}
 set(id,v){if(this.c[id]!==v){this.c[id]=v;$(id).textContent=v;}}
 banner(t,s,col,dur=2.2){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('bs').style.display=s?'':'none';$('banner').classList.add('on');this.banT=dur;}
 msg(t,col){const m=$('msg');m.textContent=t;m.style.color=col||'#fff';m.classList.add('on');this.msgT=2.8;}
 feed(html,team,me,raw){const f=$('feed');const d=document.createElement('div');d.className=(team===0?'b':team===1?'r':'')+(me?' me':'');if(raw)d.innerHTML=html;else d.textContent=html;f.prepend(d);f.prepend(document.createElement('br'));setTimeout(()=>{d.remove();},5200);while(f.children.length>12)f.lastChild.remove();}
 dmgNum(p,amt,crit,kill){const n=this.nums.find(n=>n.t<=0)||this.nums[0];n.t=1.1;n.p.copy(p);n.s.textContent=kill?'✸ '+Math.round(amt):Math.round(amt);n.s.className=crit?'c':kill?'k':'';n.s.style.display='';}
 hit(t,col){if(!t)return;const h=$('hitinfo');h.textContent=t;h.style.color=col||'#fff';h.classList.add('on');this.hitT=1.3;}
 hurt(from){const d=this.dirs.find(d=>d.t<=0)||this.dirs[0];d.t=1.2;d.p.copy(from);}
 dead(on,killer){this.deadOn=on;$('dead').hidden=!on;if(on){$('killer').textContent=killer?`${killer.name} · ${killer.H.n} / ${killer.T.n}`:'DESTROYED';}}
 fired(){this.firedT=.15;}
 go(){this.goT=.9;}
 zoom(on,lv){$('scope').hidden=!on;$('zoomlv').textContent=(lv||1)+'×';$('reticle').style.opacity=on?0:1;}
 proj(p,cam,w,h){V.copy(p).project(cam);if(V.z>1||V.z<-1)return null;return[(V.x+1)/2*w,(1-V.y)/2*h];}
 update(dt,o){const G=this.G,P=G.player,cam=o.cam,w=innerWidth,h=innerHeight;
  // timers
  if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}
  if(this.msgT>0){this.msgT-=dt;if(this.msgT<=0)$('msg').classList.remove('on');}
  if(this.hitT>0){this.hitT-=dt;if(this.hitT<=0)$('hitinfo').classList.remove('on');}
  // board
  this.set('s0',Math.floor(G.score[0]));this.set('s1',Math.floor(G.score[1]));this.set('clock',fmt(o.clock));const low=o.clock<=30;if(this.c.low!==low){this.c.low=low;$('clock').className=low?'low':'';}
  this.set('goal',`FIRST TO ${o.goal} ${G.mode==='tdm'?'KILLS':G.mode==='ctf'?'CAPS':'PTS'}`);
  // objectives strip
  let ob='';if(G.cps){ob=G.cps.map(c=>{const col=c.prog>0?TEAMC[0].css:c.prog<0?TEAMC[1].css:'#888';const me=P.alive&&Math.hypot(P.p.x-c.x,P.p.z-c.z)<c.r;const own=c.owner===0?'rgba(30,70,170,.95)':c.owner===1?'rgba(170,30,25,.95)':'rgba(10,12,18,.9)';
    return`<div class="cp${me?' me':''}" style="--c:${col};--p:${Math.round(Math.abs(c.prog)*100)}%;--in:${own}"><span>${c.n}</span></div>`;}).join('');}
  else if(G.flags){const st=f=>f.state==='home'?'AT BASE':f.state==='dropped'?'DROPPED '+Math.ceil(f.dropT)+'S':'TAKEN · '+f.carrier.name;
   ob=`<div class="fl b${G.flags[0].state!=='home'?' warn':''}">⚑ BLUE ${st(G.flags[0])}</div><div class="fl r">⚑ RED ${st(G.flags[1])}</div>`;}
  if(this.c.ob!==ob){this.c.ob=ob;$('obj').innerHTML=ob;}
  // countdown
  const cd=$('cd');if(o.phase==='countdown'){const n=Math.max(1,Math.ceil(o.cdT));this.set('cd',n);cd.className='';cd.style.opacity=Math.min(1,(o.cdT%1)*2+.2);cd.style.transform=`scale(${1+(o.cdT%1)*.3})`;}
  else if(this.goT>0){this.goT-=dt;this.set('cd','ROLL OUT!');cd.className='go';cd.style.opacity=Math.min(1,this.goT*2);cd.style.transform=`scale(${1+(.9-this.goT)*.2})`;}else cd.style.opacity=0;
  // vitals
  this.set('tname',P.H.n);this.set('tspd',Math.round(Math.abs(P.v)*3.6)+' KM/H');const hf=Math.max(0,P.hp/P.max);$('hpb').style.width=(hf*100).toFixed(1)+'%';this.set('hpt',Math.ceil(Math.max(0,P.hp))+' / '+P.max);
  const hcl='hp'+(hf<.3?' low':hf<.6?' mid':'');if(this.c.hcl!==hcl){this.c.hcl=hcl;document.querySelector('#tankp .hp').className=hcl;}
  let bf='';if(P.buffs.dmg>0)bf+=`<span class="dmg">DOUBLE DMG ${Math.ceil(P.buffs.dmg)}</span>`;if(P.buffs.speed>0)bf+=`<span class="speed">SPEED ${Math.ceil(P.buffs.speed)}</span>`;if(P.buffs.armor>0)bf+=`<span class="armor">ARMOUR ${Math.ceil(P.buffs.armor)}</span>`;
  if(P.crit.track>0)bf+='<span class="crit">TRACKS BROKEN</span>';if(P.crit.turret>0)bf+='<span class="crit">TURRET RING</span>';if(P.crit.engine>0)bf+='<span class="crit">ENGINE HIT</span>';if(G.carrierOf&&G.carrierOf(P))bf+='<span class="flag">⚑ FLAG CARRIER</span>';if(P.prot>0&&P.alive)bf+='<span class="armor">SPAWN SHIELD</span>';
  if(this.c.bf!==bf){this.c.bf=bf;$('buffs').innerHTML=bf;}
  $('vig').style.opacity=P.alive?Math.max(0,(.35-hf)*2.2)*(.75+Math.sin(G.time*6)*.25):0;
  // weapon
  const T=P.T;this.set('gname',T.n);let pips='';if(T.mag>1){for(let i=0;i<T.mag;i++)pips+=`<i class="${i<P.ammo&&!(P.ammo<=0)?'':'e'}"></i>`;}if(this.c.pips!==pips){this.c.pips=pips;$('pips').innerHTML=pips;}
  let frac=1,st='READY';if(P.charge>0){frac=P.charge/T.charge;st='CHARGING';}else if(P.reload>0){const full=P.ammo>0?T.rof:T.reload;frac=1-P.reload/full;st=P.ammo>0?'READY':'RELOADING '+P.reload.toFixed(1);}
  $('rlb').style.width=(frac*100).toFixed(1)+'%';const ok=st==='READY';if(this.c.rok!==ok){this.c.rok=ok;document.querySelector('#gunp .rb').className='rb'+(ok?' ok':'');}this.set('rst',st);
  // gun marker
  const mk=$('marker');if(o.pred&&P.alive&&o.phase!=='end'){const s=this.proj(o.pred.p,cam,w,h);if(s){mk.style.display='';const rad=cl(P.disp/Math.tan(cam.fov*Math.PI/360)*h/2,7,160)*(1+this.firedT*1.5);this.firedT=Math.max(0,this.firedT-dt);
    mk.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-50%)`;mk.style.width=mk.style.height=(rad*2)+'px';const cls=o.pred.tank?(o.pred.tank.team===P.team?'a':o.pred.face==='front'&&o.pred.tank.lo.hull==='behemoth'?'w':'e'):'';if(this.c.mk!==cls){this.c.mk=cls;mk.className=cls;}
    const rl=mk.querySelector('.rl');const d=(frac*276.5).toFixed(1);if(this.c.rl!==d){this.c.rl=d;rl.setAttribute('stroke-dasharray',d+' 400');}}else mk.style.display='none';}else mk.style.display='none';
  // damage numbers
  for(const n of this.nums){if(n.t<=0)continue;n.t-=dt;if(n.t<=0){n.s.style.display='none';continue;}V.copy(n.p);V.y+=(1.1-n.t)*2.2;const s=this.proj(V,cam,w,h);if(!s){n.s.style.display='none';continue;}n.s.style.display='';n.s.style.left=s[0]+'px';n.s.style.top=s[1]+'px';n.s.style.opacity=Math.min(1,n.t*2.5);}
  // damage direction
  for(const d of this.dirs){if(d.t<=0)continue;d.t-=dt;const a=Math.atan2(d.p.x-P.p.x,d.p.z-P.p.z);const rel=o.camYaw-a;d.e.style.opacity=Math.max(0,d.t);d.e.style.transform=`rotate(${rel}rad)`;}
  // nameplates + objective markers
  let pi=0;const plate=(p,txt,cls,hp)=>{if(pi>=this.plates.length)return;const s=this.proj(p,cam,w,h);if(!s||s[0]<-50||s[0]>w+50||s[1]<-30||s[1]>h+30)return;const e=this.plates[pi++];e.d.style.display='';e.d.style.left=s[0]+'px';e.d.style.top=s[1]+'px';
   if(e.last!==txt+cls){e.last=txt+cls;e.s.textContent=txt;e.d.className=cls;}if(hp==null){e.i.style.display='none';}else{e.i.style.display='';e.b.style.width=(hp*100).toFixed(0)+'%';}};
  for(const t of G.tanks){if(t===P||!t.alive)continue;const ally=t.team===P.team;const d=t.p.distanceTo(cam.position);if(d>260)continue;if(!ally&&!G.isSpotted(P.team,t))continue;
   V.set(t.p.x,t.p.y+t.d.y1+2.3+d*.012,t.p.z);plate(V.clone(),t.name,(ally?'a':'e')+(G.carrierOf&&G.carrierOf(t)?' fc':''),t.hp/t.max);}
  if(G.cps)for(const c of G.cps){V.set(c.x,G.W.terrain.height(c.x,c.z)+9,c.z);const d=Math.hypot(c.x-P.p.x,c.z-P.p.z);plate(V.clone(),`◆ ${c.n} · ${Math.round(d)}m`,c.owner===0?'a':c.owner===1?'e':'',null);}
  if(G.flags)for(const f of G.flags){if(f.state==='carried')continue;V.set(f.x,G.W.terrain.height(f.x,f.z)+6,f.z);const d=Math.hypot(f.x-P.p.x,f.z-P.p.z);plate(V.clone(),`⚑ ${f.team===P.team?'OUR':'ENEMY'} FLAG · ${Math.round(d)}m`,f.team===P.team?'a':'e',null);}
  for(const d of G.drops){if(d.state==='gone')continue;const dd=Math.hypot(d.x-P.p.x,d.z-P.p.z);if(dd>140)continue;V.set(d.x,d.y+2.2,d.z);plate(V.clone(),`▼ ${d.n}`,'',null);}
  for(;pi<this.plates.length;pi++){const e=this.plates[pi];if(e.d.style.display!=='none')e.d.style.display='none';}
  // death screen
  if(this.deadOn)this.set('respawn',P.respawnT>0?`RESPAWN IN ${Math.ceil(P.respawnT)}`:'');
  // minimap
  this.miniT-=dt;if(!this.miniBase||(G.W.minimapDirty&&this.miniT<=0)){this.miniBase=minimapLayer(G.W,256);G.W.minimapDirty=false;this.miniT=1.5;}this.drawMini(o.camYaw);
  // tab board
  const tb=$('tab');if(o.tab){tb.hidden=false;if(!this.tabT||G.time-this.tabT>.5){this.tabT=G.time;const ranked=G.tanks.slice().sort((a,b)=>(b.stats.dmg+b.stats.k*100)-(a.stats.dmg+a.stats.k*100));
    tb.innerHTML=`<table><tr><th>COMMANDER</th><th>TANK</th><th>K</th><th>D</th><th>DMG</th>${G.mode==='ctf'?'<th>CAPS</th>':G.mode==='cp'?'<th>CAP</th>':''}<th>STATUS</th></tr>`+[0,1].map(tm=>ranked.filter(t=>t.team===tm).map(t=>`<tr class="t${tm}${t.human?' me':''}"><td>${t.name}</td><td>${t.H.n}<small>${t.T.n}</small></td><td>${t.stats.k}</td><td>${t.stats.d}</td><td>${Math.round(t.stats.dmg)}</td>${G.mode==='ctf'?`<td>${t.stats.caps}</td>`:G.mode==='cp'?`<td>${Math.round(t.stats.cp)}</td>`:''}<td>${t.alive?Math.ceil(t.hp)+' HP':'✸ '+Math.ceil(t.respawnT)+'S'}</td></tr>`).join('')).join('')+'</table>';}}
  else tb.hidden=true;}
 drawMini(camYaw){const G=this.G,P=G.player,x=this.mini,S=220,k=S/(2*B);x.clearRect(0,0,S,S);x.save();x.beginPath();x.roundRect(0,0,S,S,14);x.clip();x.globalAlpha=.9;x.drawImage(this.miniBase,0,0,S,S);x.globalAlpha=1;
  const M=(px,pz)=>[(px+B)*k,(pz+B)*k];
  if(G.cps)for(const c of G.cps){const[a,b]=M(c.x,c.z);x.strokeStyle=c.owner===0?TEAMC[0].css:c.owner===1?TEAMC[1].css:'#fff';x.lineWidth=2;x.beginPath();x.arc(a,b,c.r*k,0,7);x.stroke();x.fillStyle=x.strokeStyle;x.font='bold 11px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(c.n,a,b);}
  if(G.flags)for(const f of G.flags){const[a,b]=M(f.home.x,f.home.z);x.strokeStyle=TEAMC[f.team].css;x.lineWidth=1.5;x.beginPath();x.arc(a,b,5*k,0,7);x.stroke();const[c,d]=M(f.x,f.z);x.fillStyle=TEAMC[f.team].css;x.fillRect(c-1,d-9,2,10);x.beginPath();x.moveTo(c+1,d-9);x.lineTo(c+8,d-6);x.lineTo(c+1,d-3);x.fill();}
  for(const d of G.drops){if(d.state==='gone')continue;const[a,b]=M(d.x,d.z);x.fillStyle={repair:'#2fbf5a',dmg:'#ff4d00',speed:'#ffcf3f',armor:'#3d8bff'}[d.kind];x.fillRect(a-3,b-3,6,6);x.strokeStyle='#000';x.lineWidth=1;x.strokeRect(a-3,b-3,6,6);}
  for(const t of G.tanks){if(!t.alive||t===P)continue;if(t.team!==P.team&&!G.isSpotted(P.team,t))continue;const[a,b]=M(t.p.x,t.p.z);x.save();x.translate(a,b);x.rotate(-t.yaw);x.fillStyle=t.team===P.team?'#5fa0ff':'#ff4a3a';x.beginPath();x.moveTo(0,5);x.lineTo(3.5,-3.5);x.lineTo(-3.5,-3.5);x.closePath();x.fill();x.restore();}
  if(P.alive){const[a,b]=M(P.p.x,P.p.z);x.save();x.translate(a,b);x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.moveTo(0,0);x.arc(0,0,46,Math.PI/2-camYaw-.5,Math.PI/2-camYaw+.5);x.closePath();x.fill();x.rotate(-P.yaw);x.fillStyle='#fff';x.beginPath();x.moveTo(0,7);x.lineTo(4.5,-4.5);x.lineTo(-4.5,-4.5);x.closePath();x.fill();x.restore();}
  x.restore();}}
