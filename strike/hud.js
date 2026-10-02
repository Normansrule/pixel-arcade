// STRIKE ZONE — HUD: vitals, ammo + slots, weapon wheel, radar, feed, banners, hit markers, damage direction, finisher prompt, boss bar.
import {WPN,ORDER,AMMO} from './weapons.js';
import {CS} from './levels.js';
const $=id=>document.getElementById(id);
const mmss=t=>{t=Math.max(0,Math.ceil(t));return (t/60|0)+':'+String(t%60).padStart(2,'0');};
export class HUD{
 constructor(G){this.G=G;this.banT=0;this.hitT=0;this.dmg=[];const di=$('dmgind');for(let i=0;i<6;i++){const e=document.createElement('i');di.appendChild(e);this.dmg.push({e,t:0,a:0});}
  $('slots').innerHTML=ORDER.map((id,k)=>`<span data-w="${id}"><b>${k+1}</b>${WPN[id].name.split(' ').pop().slice(0,6)}</span>`).join('');this.slotEls=[...$('slots').children];
  const wh=$('wheel');wh.innerHTML=ORDER.map((id,k)=>{const a=-Math.PI/2+k/6*Math.PI*2;return`<div data-w="${id}" style="left:${190+Math.cos(a)*128}px;top:${190+Math.sin(a)*128}px"><b>${WPN[id].name}</b><span></span></div>`;}).join('');this.wheelEls=[...wh.children];
  this.radar=$('radar').getContext('2d');this.cache={};}
 show(on){$('hud').hidden=!on;}
 set(id,v){if(this.cache[id]!==v){this.cache[id]=v;$(id).textContent=v;}}
 banner(t,s,col,dur=2.2){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('banner').classList.add('on');this.banT=dur;}
 feed(txt,cls='k'){const f=$('feed');const d=document.createElement('div');d.className=cls;d.textContent=txt;f.prepend(d);setTimeout(()=>d.remove(),3200);while(f.children.length>6)f.lastChild.remove();}
 hitmark(kind){const h=$('hit');h.className=kind;h.style.opacity=1;this.hitT=kind==='kill'?.3:.15;}
 hurt(ang,yaw){const s=this.dmg.find(x=>x.t<=0)||this.dmg[0];s.t=1;s.a=ang;}
 clear(){$('feed').innerHTML='';this.banT=0;$('banner').classList.remove('on');for(const s of this.dmg){s.t=0;s.e.style.opacity=0;}}
 wheel(on,sel){$('wheel').hidden=!on;if(!on)return;const P=this.G.player;this.wheelEls.forEach(e=>{const id=e.dataset.w;const own=P.weapons[id];e.className=(own?'own':'none')+(id===sel?' sel':'');e.querySelector('span').textContent=own?P.ammo[WPN[id].ammo]:'—';});}
 update(dt){const G=this.G,P=G.player;if(!P||$('hud').hidden)return;
  this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');this.hitT-=dt;if(this.hitT<=0)$('hit').style.opacity=0;
  for(const s of this.dmg){if(s.t>0){s.t-=dt*1.1;s.e.style.opacity=Math.max(0,s.t);s.e.style.transform=`rotate(${P.yaw-s.a+Math.PI}rad)`;}}
  this.set('score',G.score.toLocaleString());const cb=$('combo');if(G.combo>1){cb.classList.add('on');this.set('combo','×'+G.combo+' CHAIN');}else cb.classList.remove('on');
  this.set('arena',G.L.def.name+(G.mode==='endless'?' · ENDLESS':' · ARENA '+(G.arenaIdx+1)+' / 3'));
  this.set('clock',mmss(G.clock));$('clock').className=G.clock<30?'low':'';
  this.set('wave',G.phase==='clear'?'ARENA CLEAR':G.phase==='boss'?'BOSS':G.mode==='endless'?'WAVE '+G.wave:'WAVE '+G.wave+' / '+G.waveMax);
  this.set('atime',G.phase==='clear'?'FIND THE EXIT PORTAL':'ARENA TIME '+mmss(G.arenaT).replace(/^0:/,'0:')+(G.par?' · PAR '+mmss(G.par):''));
  $('kills').innerHTML=`<b>${G.stats.kills}</b> KILLS · <b>${G.left()}</b> LEFT<br>SECRETS <b>${G.stats.secrets}</b>/${G.stats.secretsTotal}`;
  const hp=Math.ceil(P.hp),ar=Math.ceil(P.armor);this.set('hp',hp);this.set('ar',ar);$('hpb').style.width=Math.min(100,P.hp)+'%';$('arb').style.width=Math.min(100,P.armor/1.5)+'%';
  const hpE=document.querySelector('#vit .hp');hpE.classList.toggle('low',P.hp<30);hpE.classList.toggle('over',P.hp>100);
  const dz=document.querySelectorAll('#dash i');dz.forEach((e,k)=>{const f=k<P.dashes?1:k===P.dashes?1-P.dashCD/P.dashRe:0;e.style.setProperty('--f',(f*100).toFixed(0)+'%');});
  $('quad').hidden=!(G.quadT>0);if(G.quadT>0)this.set('quadt',Math.ceil(G.quadT));
  const w=WPN[P.cur];const am=P.ammo[w.ammo];this.set('ammo',am);$('ammo').className=am<=w.use*3?'low':'';this.set('aname',w.ammo.toUpperCase());
  this.slotEls.forEach(e=>{const id=e.dataset.w;const own=P.weapons[id];e.className=(own?'own':'')+(id===P.cur?' on':'')+(own&&P.ammo[WPN[id].ammo]<WPN[id].use?' empty':'');});
  const sp=Math.hypot(P.vel.x,P.vel.z);this.set('ups',sp.toFixed(1));$('spd').className=sp>12?'fast':'';
  const cr=$('cross');cr.className=P.cur==='sg'||P.cur==='ssg'?'ring':'';cr.style.setProperty('--g',(6+Math.min(14,(P.spread||0)*300)+(P.onGround?0:3))+'px');
  // finisher prompt
  const pr=$('prompt');if(G.gloryTarget){pr.innerHTML='<kbd>F</kbd> FINISH '+G.gloryTarget.def.name;pr.classList.add('on');}else pr.classList.remove('on');
  // overlays
  $('hurtov').style.opacity=Math.min(1,G.hurtFx*1.4+(P.hp<25&&P.alive?.25+.15*Math.sin(G.time*6):0));$('quadov').style.opacity=G.quadT>0?.55+.2*Math.sin(G.time*5):0;$('lavaov').style.opacity=G.lavaFx;$('gloryov').style.opacity=G.gloryFx;
  // boss
  const boss=G.monsters.find(m=>m.type==='boss'&&m.alive);$('boss').hidden=!boss;if(boss)$('bossb').style.width=(Math.max(0,boss.hp)/boss.hpMax*100)+'%';
  this.drawRadar();}
 drawRadar(){const G=this.G,P=G.player,x=this.radar,S=300,c=S/2,sc=c/34;x.clearRect(0,0,S,S);x.save();x.beginPath();x.arc(c,c,c-2,0,7);x.clip();x.translate(c,c);x.rotate(P.yaw);
  // arena outline (walls/void cells near the player)
  const L=G.L;const pi=Math.floor(P.pos.x/CS),pj=Math.floor(P.pos.z/CS);for(let j=pj-18;j<=pj+18;j++)for(let i=pi-18;i<=pi+18;i++){if(i<0||j<0||i>=L.W||j>=L.H)continue;const k=j*L.W+i,ch=L.ch[k];const x0=(i*CS-P.pos.x)*sc,z0=(j*CS-P.pos.z)*sc;
   if(ch==='#'||ch==='H'||ch==='C'){x.fillStyle='rgba(255,170,120,.28)';x.fillRect(x0,z0,CS*sc+.5,CS*sc+.5);}else if(ch==='L'){x.fillStyle='rgba(255,90,0,.35)';x.fillRect(x0,z0,CS*sc+.5,CS*sc+.5);}else if(ch==='v')continue;else if(L.top[k]>.6){x.fillStyle=`rgba(255,255,255,${Math.min(.18,.05+L.top[k]*.025)})`;x.fillRect(x0,z0,CS*sc+.5,CS*sc+.5);}}
  for(const it of G.items.list){if(!it.active)continue;x.fillStyle=it.kind==='quad'?'#c070ff':it.kind==='weapon'?'#ffb040':it.kind==='hp'||it.kind==='mega'||it.kind==='orb'?'#50ff90':it.kind.includes('armor')||it.kind==='shard'?'#5ac8ff':'rgba(255,220,120,.6)';x.fillRect((it.pos.x-P.pos.x)*sc-2,(it.pos.z-P.pos.z)*sc-2,4,4);}
  if(G.exit){x.strokeStyle='#ffd04a';x.lineWidth=3;x.beginPath();x.arc((G.exit.x-P.pos.x)*sc,(G.exit.z-P.pos.z)*sc,7+Math.sin(G.time*6)*2,0,7);x.stroke();}
  for(const m of G.monsters){if(!m.alive)continue;const mx=(m.pos.x-P.pos.x)*sc,mz=(m.pos.z-P.pos.z)*sc;const r=m.type==='boss'?9:m.type==='brute'?6:4;x.fillStyle=m.staggered?'#ffd04a':m.type==='eye'?'#c0ff80':'#ff4a2a';x.beginPath();x.arc(mx,mz,r,0,7);x.fill();
   if(m.pos.y>P.pos.y+2){x.strokeStyle='#fff';x.lineWidth=1.5;x.beginPath();x.moveTo(mx-3,mz-r-2);x.lineTo(mx,mz-r-6);x.lineTo(mx+3,mz-r-2);x.stroke();}}
  x.restore();x.fillStyle='#fff';x.beginPath();x.moveTo(c,c-9);x.lineTo(c-6,c+6);x.lineTo(c,c+3);x.lineTo(c+6,c+6);x.fill();
  x.strokeStyle='rgba(255,120,60,.25)';x.lineWidth=1;x.beginPath();x.arc(c,c,c*.5,0,7);x.stroke();}}
export {mmss};
