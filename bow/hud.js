// LONGBOW KEEP — HUD: captures + clock, flag status, compass with flag markers, kill feed, vitals, weapon slots, crosshair with draw ring,
// hit markers, damage arcs, world markers (flags, carriers, allies), bomb arc preview, respawn panel and the Tab scoreboard.
import * as THREE from '../vendor/three.module.min.js';
import {TEAMS} from './gfx.js';
import {toast} from '../js/kit3d/ui.js';
const $=id=>document.getElementById(id);
export const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const _v=new THREE.Vector3();
export class HUD{
 constructor(G){this.G=G;this.banT=0;this.hits=[];this.dmg=[];this.cache={};this.ov=$('ov');this.ox=this.ov.getContext('2d');this.cp=$('compass');this.cx=this.cp.getContext('2d');this.flash=0;this.hurtA=0;this.msgT=0;}
 show(on){$('hud').hidden=!on;this.ov.style.display=on?'block':'none';}
 set(id,v){if(this.cache[id]!==v){this.cache[id]=v;$(id).textContent=v;}}
 html(id,v){if(this.cache[id]!==v){this.cache[id]=v;$(id).innerHTML=v;}}
 banner(t,s,col,dur=2.4){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';const b=$('banner');b.classList.remove('on');void b.offsetWidth;b.classList.add('on');this.banT=dur;}
 msg(t,dur=2){this.set('hint',t);$('hint').classList.add('on');this.msgT=dur;}
 feed(a,ta,mid,b,tb){toast($('feed'),(a?`<b style="color:${TEAMS[ta].css}">${esc(a)}</b>`:'')+`<i>${mid}</i>`+(b?`<b style="color:${TEAMS[tb].css}">${esc(b)}</b>`:''),5200,6);}
 hit(kind){this.hits.push({t:kind==='kill'||kind==='head'?.45:.22,kind});}
 hurt(ang){this.dmg.push({a:ang,t:1});this.flash=Math.min(1,this.flash+.45);}
 clear(){$('feed').innerHTML='';this.hits.length=0;this.dmg.length=0;this.flash=0;$('banner').classList.remove('on');this.banT=0;}
 update(dt,cam){const G=this.G,me=G.me;if(!me)return;
  if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}if(this.msgT>0){this.msgT-=dt;if(this.msgT<=0)$('hint').classList.remove('on');}
  this.set('c0',G.caps[0]);this.set('c1',G.caps[1]);this.set('clock',G.phase==='count'?mmss(G.clock):mmss(G.clock));$('clock').classList.toggle('low',G.clock<=30&&G.phase==='live');
  for(const t of[0,1]){const f=G.flags[t];let s=f.state==='home'?'HOME':f.state==='carried'?'TAKEN · '+(f.carrier?f.carrier.name:''):'DROPPED · '+Math.ceil(f.dropT)+'s';this.set('fs'+t,s);$('fs'+t).className='fs '+f.state;$('f'+t).className='fl '+f.state;}
  // vitals
  const hp=Math.max(0,Math.ceil(me.hp));this.set('hp',hp);$('hpb').style.width=hp+'%';$('vit').classList.toggle('low',hp<35&&me.alive);
  const W=G.WPN[me.loadout];this.set('ammo',me.weapon==='bow'?me.ammo:me.weapon==='bomb'?me.bombs:me.weapon==='build'?me.planks:'—');
  this.set('aname',me.weapon==='bow'?(me.loadout==='cross'?'BOLTS':'ARROWS'):me.weapon==='bomb'?'FIRE POTS':me.weapon==='build'?'PLANKS':'SWORD · SHIELD');
  this.set('wname',me.weapon==='bow'?W.n:me.weapon==='sword'?'ARMING SWORD':me.weapon==='bomb'?'FIRE POT':'BUILD · '+(G.buildType==='wall'?'BARRICADE ('+G.BUILD.wall.cost+')':'RAMP ('+G.BUILD.ramp.cost+')'));
  $('ammo').classList.toggle('low',me.weapon==='bow'&&me.ammo<=3);
  this.html('slots',[['bow',1,W.n.slice(0,5)],['sword',2,'SWORD'],['bomb',3,'POTS ×'+me.bombs],['build',4,'BUILD ×'+me.planks]].map(([k,n,l])=>`<span class="${me.weapon===k?'on':''}${k==='bomb'&&!me.bombs||k==='build'&&me.planks<2?' empty':''}"><b>${n}</b>${l}</span>`).join(''));
  $('carry').classList.toggle('on',!!me.carrying);$('carryov').style.opacity=me.carrying?.55+.2*Math.sin(G.time*4):0;
  this.flash=Math.max(0,this.flash-dt*1.4);$('hurt').style.opacity=Math.min(1,this.flash+(me.alive&&me.hp<30?.25+.12*Math.sin(G.time*5):0));
  // respawn panel
  const dead=!me.alive&&G.app==='play'&&G.phase!=='end';$('dead').hidden=!dead;
  if(dead){this.html('dkill',me.killer?`SLAIN BY <b style="color:${TEAMS[me.killer.team].css}">${esc(me.killer.name)}</b>${me.killHow?' · '+me.killHow:''}`:me.killHow||'YOU FELL');this.set('dtime',Math.max(1,Math.ceil(me.respawnT)));
   document.querySelectorAll('#dload button').forEach(b=>b.classList.toggle('on',b.dataset.v===me.nextLoadout));}
  // countdown
  const cd=$('cd');if(G.phase==='count'){cd.textContent=Math.max(1,Math.ceil(G.countT));cd.style.opacity=1;}else if(G.phase==='live'&&G.liveT<1){cd.textContent='FIGHT!';cd.style.opacity=1-G.liveT;}else cd.style.opacity=0;
  if(G.boardOn)this.board();$('board').hidden=!G.boardOn;
  this.compass();this.overlay(dt,cam);}
 board(){const G=this.G;const rows=t=>G.players.filter(p=>p.team===t).sort((a,b)=>b.stats.score-a.stats.score).map(p=>`<tr class="${p===G.me?'me':''}${p.alive?'':' dead'}"><td>${p.carrying?'⚑ ':''}${esc(p.name)}</td><td>${p.stats.kills}</td><td>${p.stats.deaths}</td><td>${p.stats.caps}</td><td>${p.stats.returns}</td><td>${p.stats.score}</td></tr>`).join('');
  const k=t=>G.players.filter(p=>p.team===t).reduce((s,p)=>s+p.stats.kills,0);
  this.html('board',[0,1].map(t=>`<div class="bt t${t}"><h4><span>${TEAMS[t].n}</span><em>${G.caps[t]} CAPTURES · ${k(t)} KILLS</em></h4><table><tr><th>SOLDIER</th><th>K</th><th>D</th><th>CAP</th><th>RET</th><th>SCORE</th></tr>${rows(t)}</table></div>`).join(''));}
 compass(){const G=this.G,me=G.me,x=this.cx,w=this.cp.width,h=this.cp.height;x.clearRect(0,0,w,h);const yaw=me.yaw,half=Math.PI*.55,px=a=>{let d=a-(-yaw);while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
  // bearing: 0 = north (-z). A world direction (dx,dz) has bearing atan2(dx,-dz).
  x.font='700 11px "PA Mono",monospace';x.textAlign='center';x.textBaseline='middle';
  for(let i=0;i<72;i++){const a=i/72*Math.PI*2;const d=px(a);if(Math.abs(d)>half)continue;const X=w/2+d/half*w/2;const big=i%18===0,mid=i%9===0;x.fillStyle=big?'#fff':'rgba(255,255,255,.45)';
   if(big){x.fillText(['N','E','S','W'][i/18],X,h*.36);}else x.fillRect(X-.5,h*(mid?.24:.3),1,h*(mid?.24:.14));}
  for(const t of[1,0]){const f=G.flags[t];const dx=f.pos.x-me.pos.x,dz=f.pos.z-me.pos.z,a=Math.atan2(dx,-dz);let d=px(a);const off=Math.abs(d)>half;d=Math.max(-half,Math.min(half,d));const X=w/2+d/half*(w/2-12);
   x.fillStyle=TEAMS[t].css;x.globalAlpha=off?.55:1;x.beginPath();x.moveTo(X-1,h*.58);x.lineTo(X-1,h*.98);x.lineTo(X+1,h*.98);x.lineTo(X+1,h*.58);x.fill();x.beginPath();x.moveTo(X+1,h*.58);x.lineTo(X+11,h*.66);x.lineTo(X+1,h*.76);x.fill();
   x.fillStyle='#fff';x.font='700 9px "PA Mono",monospace';x.fillText(Math.round(Math.hypot(dx,dz))+'m',X-12*Math.sign(d||1)+(d<0?24:0)-6,h*.84);x.globalAlpha=1;}
  x.fillStyle='#ff4d00';x.beginPath();x.moveTo(w/2-5,h);x.lineTo(w/2,h-7);x.lineTo(w/2+5,h);x.fill();}
 overlay(dt,cam){const G=this.G,me=G.me,c=this.ov,x=this.ox,W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio,2);if(c.width!==W*dpr||c.height!==H*dpr){c.width=W*dpr;c.height=H*dpr;}x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);
  const proj=(p,y=0)=>{_v.set(p.x,p.y+y,p.z).project(cam);const behind=_v.z>1;let sx=(_v.x*.5+.5)*W,sy=(-_v.y*.5+.5)*H;if(behind){sx=W-sx;sy=H-sy;}return{sx,sy,behind,on:!behind&&sx>0&&sx<W&&sy>0&&sy<H};};
  const clampE=(q,m=36)=>{if(q.on)return q;let dx=q.sx-W/2,dy=q.sy-H/2;if(q.behind&&dy<0)dy=Math.abs(dy)+H;const k=Math.min((W/2-m)/Math.abs(dx||1e-4),(H/2-m)/Math.abs(dy||1e-4));return{sx:W/2+dx*k,sy:H/2+dy*k,on:false};};
  x.textAlign='center';x.textBaseline='middle';
  // allies' name pips
  for(const p of G.players){if(p===me||!p.alive)continue;const d=Math.hypot(p.pos.x-me.pos.x,p.pos.z-me.pos.z);const ally=p.team===me.team;if(!ally&&!p.carrying)continue;if(d>90&&!p.carrying)continue;
   const q=proj(p.pos,2.25);if(!q.on)continue;const a=Math.max(.35,1-d/90);x.globalAlpha=a;x.fillStyle=TEAMS[p.team].css;x.beginPath();x.moveTo(q.sx-6,q.sy-8);x.lineTo(q.sx+6,q.sy-8);x.lineTo(q.sx,q.sy);x.fill();
   if(d<40){x.font='700 10px "PA Mono",monospace';x.fillStyle='#fff';x.fillText(p.name,q.sx,q.sy-17);}x.globalAlpha=1;}
  // flag markers (always visible)
  for(const t of[0,1]){const f=G.flags[t];const q=clampE(proj(f.pos,f.state==='carried'?2.9:3.4));const mine=t===me.team;const d=Math.hypot(f.pos.x-me.pos.x,f.pos.z-me.pos.z);if(f.state==='carried'&&f.carrier===me)continue;
   const pulse=f.state!=='home'?1+.15*Math.sin(G.time*8):1;const cd=Math.hypot(q.sx-W/2,q.sy-H/2);x.globalAlpha=cd<60?.35+cd/60*.65:1;x.save();x.translate(q.sx,q.sy);x.scale(pulse,pulse);x.fillStyle='rgba(8,8,10,.6)';x.beginPath();x.arc(0,0,15,0,7);x.fill();x.strokeStyle=TEAMS[t].css;x.lineWidth=2;x.stroke();
   x.fillStyle=TEAMS[t].css;x.fillRect(-5,-8,2,16);x.beginPath();x.moveTo(-3,-8);x.lineTo(8,-4);x.lineTo(-3,1);x.fill();x.restore();
   x.font='700 10px "PA Mono",monospace';x.fillStyle='#fff';x.fillText((f.state==='home'?(mine?'DEFEND':'CAPTURE'):f.state==='carried'?(mine?'KILL CARRIER':'ESCORT'):(mine?'RETURN':'TAKE'))+' · '+Math.round(d)+'m',q.sx,q.sy+25);x.globalAlpha=1;}
  // own base marker when carrying
  if(me.carrying){const q=clampE(proj(G.homes[me.team],2.6));x.strokeStyle='#ffd04a';x.lineWidth=3;x.beginPath();x.arc(q.sx,q.sy,13+3*Math.sin(G.time*6),0,7);x.stroke();x.font='700 11px "PA Mono",monospace';x.fillStyle='#ffd04a';x.fillText(G.flags[me.team].state==='home'?'CAPTURE HERE':'YOUR FLAG MUST BE HOME',q.sx,q.sy+26);}
  // bomb arc preview
  if(me.alive&&me.weapon==='bomb'&&me.bombAim&&G.bombArc){x.fillStyle='rgba(255,200,120,.9)';for(let i=0;i<G.bombArc.length;i++){const q=proj(G.bombArc[i]);if(!q.on)continue;x.globalAlpha=1-i/G.bombArc.length*.7;x.beginPath();x.arc(q.sx,q.sy,2.4,0,7);x.fill();}x.globalAlpha=1;}
  // crosshair
  if(me.alive&&G.app==='play'){const cxp=W/2,cyp=H/2;x.lineWidth=2;x.lineCap='round';
   if(me.weapon==='bow'&&me.loadout!=='cross'){const d=me.draw,full=d>=1;const gap=4+(1-d)*16;x.strokeStyle=full?(me.holdT>2.2?'#ffb14a':'#fff'):'rgba(255,255,255,.85)';
    for(const[a,b]of[[0,-1],[0,1],[-1,0],[1,0]]){x.beginPath();x.moveTo(cxp+a*gap,cyp+b*gap);x.lineTo(cxp+a*(gap+7),cyp+b*(gap+7));x.stroke();}
    if(d>0){x.strokeStyle=full?'rgba(255,77,0,.95)':'rgba(255,255,255,.5)';x.lineWidth=3;x.beginPath();x.arc(cxp,cyp,24,-Math.PI/2,-Math.PI/2+d*Math.PI*2);x.stroke();}}
   else if(me.weapon==='bow'){x.strokeStyle=me.loaded?'#fff':'rgba(255,255,255,.35)';x.beginPath();x.arc(cxp,cyp,7,0,7);x.stroke();x.fillStyle=x.strokeStyle;x.fillRect(cxp-1,cyp-1,2,2);
    if(!me.loaded&&me.reload>0){x.strokeStyle='rgba(255,77,0,.95)';x.lineWidth=3;x.beginPath();x.arc(cxp,cyp,24,-Math.PI/2,-Math.PI/2+me.reload*Math.PI*2);x.stroke();}}
   else if(me.weapon==='sword'){x.strokeStyle='rgba(255,255,255,.8)';x.beginPath();x.arc(cxp,cyp,10,-.5,.5);x.stroke();x.beginPath();x.arc(cxp,cyp,10,Math.PI-.5,Math.PI+.5);x.stroke();}
   else{x.fillStyle='#fff';x.beginPath();x.arc(cxp,cyp,2,0,7);x.fill();}
   // hit markers
   for(let i=this.hits.length-1;i>=0;i--){const h=this.hits[i];h.t-=dt;if(h.t<=0){this.hits.splice(i,1);continue;}const r=h.kind==='kill'||h.kind==='head'?13:9;x.strokeStyle=h.kind==='head'?'#ffd04a':h.kind==='kill'?'#ff4d00':'#fff';x.lineWidth=h.kind==='hit'?2:3;x.globalAlpha=Math.min(1,h.t*5);
    for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]]){x.beginPath();x.moveTo(cxp+a*r*.45,cyp+b*r*.45);x.lineTo(cxp+a*r,cyp+b*r);x.stroke();}x.globalAlpha=1;}
   // damage direction arcs
   for(let i=this.dmg.length-1;i>=0;i--){const d=this.dmg[i];d.t-=dt*.9;if(d.t<=0){this.dmg.splice(i,1);continue;}const rel=d.a+me.yaw;x.strokeStyle=`rgba(255,60,40,${d.t*.9})`;x.lineWidth=7;x.beginPath();x.arc(cxp,cyp,90,-Math.PI/2+rel-.3,-Math.PI/2+rel+.3);x.stroke();}}}}
