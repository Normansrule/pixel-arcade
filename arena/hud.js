// NOVA ARENA — HUD: score bar per mode, shields/health/jet fuel, weapon card, dynamic crosshair, motion-tracker radar,
// projected name tags + objective markers, kill feed, medals, streak banners, damage arcs, death screen, scoreboard.
import * as THREE from '../vendor/three.module.min.js';
import {V,fmt,cl} from './util.js';
import {WPN} from './weapons.js';

const $=id=>document.getElementById(id);
export const TEAMCSS=['#3d9bff','#ff5a2a'];
export class HUD{
 constructor(G){this.G=G;this.c={};this.el={sc:$('sc'),clock:$('clock'),mode:$('modeTag'),feed:$('feed'),tags:$('tags'),cross:$('cross'),hitm:$('hitm'),streak:$('streak'),medals:$('medals'),prompt:$('prompt'),cd:$('cd'),
  shb:$('shb'),ovb:$('ovb'),hpb:$('hpb'),fub:$('fub'),pows:$('pows'),wname:$('wname'),mag:$('mag'),res:$('res'),walt:$('walt'),rl:$('rl'),nf:$('nf'),np:$('np'),dead:$('dead'),killer:$('killer'),kwpn:$('kwpn'),rsp:$('rsp'),
  board:$('board'),dmg:$('dmg'),scope:$('scope'),vig:$('vig'),flash:$('flash'),radar:$('radar')};
  this.rc=this.el.radar.getContext('2d');this.tagPool=[];this.hitT=0;this.streakT=0;this.cdLast='';this.flashV=0;this.vigV=0;this.sweep=0;this.prm='';this.radarT=0;}
 set(el,k,v,prop='textContent'){if(this.c[k]!==v){this.c[k]=v;el[prop]=v;}}
 reset(){const G=this.G;this.el.feed.innerHTML='';this.el.medals.innerHTML='';this.el.dmg.innerHTML='';this.c={};this.el.mode.textContent=G.M.n;this.el.dead.hidden=true;this.el.board.hidden=true;
  this.el.sc.innerHTML=G.M.team?`<div class="t az"><b id="s0">0</b><i>AZURE</i><s class="pb" id="p0"></s></div><div class="t em"><b id="s1">0</b><i>EMBER</i><s class="pb" id="p1"></s></div>${G.mode==='koth'?'<div class="hl"><span>HILL</span><b id="hs">—</b></div>':''}`
   :`<div class="t me"><b id="s0">0</b><i>YOU</i><s class="pb" id="p0"></s></div><div class="t ld"><b id="s1">0</b><i id="ln">LEADER</i><s class="pb" id="p1"></s></div>`;}
 feed(k,v,w,head,mine){const d=document.createElement('div');const col=f=>f?(this.G.M.team?TEAMCSS[f.team]:f.css):'#aaa';
  d.innerHTML=(k&&k!==v?`<span style="color:${col(k)}">${k.name}</span><span class="w">${w}${head?' <span class="hs">◉</span>':''}</span>`:`<span class="w">${w}</span>`)+`<span style="color:${col(v)}">${v.name}</span>`;if(mine)d.className='me';
  this.el.feed.prepend(d);setTimeout(()=>d.remove(),5200);while(this.el.feed.children.length>6)this.el.feed.lastChild.remove();}
 medal(name,col='#ffcf3f',glyph='★'){const d=document.createElement('div');d.className='medal';d.style.setProperty('--mc',col);d.innerHTML=`<i>${glyph}</i><span>${name}</span>`;this.el.medals.appendChild(d);setTimeout(()=>d.remove(),2600);while(this.el.medals.children.length>4)this.el.medals.firstChild.remove();}
 banner(t,s,col='#ff4d00',dur=2.2){const e=this.el.streak;e.querySelector('b').textContent=t;e.querySelector('b').style.color=col;e.querySelector('span').textContent=s||'';e.querySelector('span').style.display=s?'':'none';e.classList.add('on');this.streakT=dur;}
 hit(kind){this.el.hitm.className=kind||'';this.hitT=kind==='k'?.45:.22;}
 damageFrom(ang){const i=document.createElement('i');i.style.transform=`rotate(${ang}rad)`;this.el.dmg.appendChild(i);setTimeout(()=>i.remove(),1100);while(this.el.dmg.children.length>6)this.el.dmg.firstChild.remove();}
 flash(v=.7){this.flashV=Math.max(this.flashV,v);}
 prompt(html){if(this.prm!==html){this.prm=html;this.el.prompt.innerHTML=html;this.el.prompt.classList.toggle('on',!!html);}}
 _tag(i){let e=this.tagPool[i];if(!e){e=document.createElement('div');this.el.tags.appendChild(e);this.tagPool[i]=e;}return e;}
 update(dt,cam){const G=this.G,me=G.me,E=this.el;if(!me)return;
  this.hitT-=dt;E.hitm.style.opacity=this.hitT>0?Math.min(1,this.hitT*6):0;if(this.streakT>0){this.streakT-=dt;if(this.streakT<=0)E.streak.classList.remove('on');}
  this.flashV=Math.max(0,this.flashV-dt*2.5);E.flash.style.opacity=this.flashV;
  // top bar
  const cap=G.cap;if(G.M.team){const s=G.teamScore;this.set($('s0'),'s0',String(Math.floor(s[0])));this.set($('s1'),'s1',String(Math.floor(s[1])));$('p0').style.width=cl(s[0]/cap,0,1)*100+'%';$('p1').style.width=cl(s[1]/cap,0,1)*100+'%';
   if(G.mode==='koth'){const h=G.hillState;this.set($('hs'),'hs',h.owner<0?(h.contested?'CONTESTED':'NEUTRAL'):(h.owner?'EMBER':'AZURE')+' '+Math.ceil(G.hillT)+'s');$('hs').style.color=h.owner<0?(h.contested?'#ffcf3f':'#fff'):TEAMCSS[h.owner];}}
  else{const ranked=G.fighters.slice().sort((a,b)=>b.stats.score-a.stats.score);const lead=ranked[0]===me?ranked[1]:ranked[0];this.set($('s0'),'s0',String(me.stats.score));this.set($('s1'),'s1',String(lead?lead.stats.score:0));
   this.set($('ln'),'ln',ranked[0]===me?'2ND · '+(lead?lead.name:''):'LEADER · '+(lead?lead.name:''));$('p0').style.width=cl(me.stats.score/cap,0,1)*100+'%';$('p1').style.width=cl((lead?lead.stats.score:0)/cap,0,1)*100+'%';}
  this.set(E.clock,'clk',fmt(G.clock));E.clock.style.color=G.clock<=30?'#ff4d00':'';
  // countdown
  const cd=G.phase==='countdown'?String(Math.max(1,Math.ceil(G.cdT))):(G.phase==='play'&&G.goT>0?'FIGHT':'');this.set(E.cd,'cd',cd);E.cd.style.opacity=cd?(cd==='FIGHT'?Math.min(1,G.goT*2):1):0;E.cd.style.color=cd==='FIGHT'?'#ff4d00':'#fff';
  // vitals
  const shF=me.shield/100;E.shb.style.width=shF*100+'%';E.ovb.style.width=cl(me.over/100,0,1)*100+'%';E.shb.parentNode.classList.toggle('low',me.alive&&me.shield<25);E.hpb.style.width=me.health+'%';E.hpb.parentNode.classList.toggle('low',me.health<35);
  E.fub.style.width=me.fuel*100+'%';E.fub.style.background=me.fuel<.2?'#ff5a3a':'#ffb34a';
  let pw='';if(me.over>0)pw+=`<span style="color:#ffd040">OVERSHIELD</span>`;if(me.speedT>0)pw+=`<span style="color:#60ff9a">SPEED ${Math.ceil(me.speedT)}</span>`;if(me.camoT>0)pw+=`<span style="color:#9fd8ff">CAMO ${Math.ceil(me.camoT)}</span>`;this.set(E.pows,'pw',pw,'innerHTML');
  // hurt vignette
  const hurt=me.alive?cl((1-me.health/100)*.8+(me.shield<=0?.25:0),0,1)*(me.shield<=0?1:.3):0;this.vigV+=(Math.max(hurt,G.hurtFx)-this.vigV)*Math.min(1,dt*8);E.vig.style.opacity=this.vigV;
  // weapon card
  const w=me.weapons[me.wi];if(w){const d=WPN[w.id];this.set(E.wname,'wn',d.name);this.set(E.mag,'mag',String(w.mag));E.mag.classList.toggle('low',w.mag<=Math.max(1,d.mag*.25));this.set(E.res,'res',d.noReload?'CHARGES':'/ '+w.res);
   const o=me.weapons[1-me.wi];this.set(E.walt,'alt',o?WPN[o.id].name+' · '+o.mag+'/'+o.res:'— EMPTY SLOT —');
   E.rl.classList.toggle('on',me.reloadT>0);E.rl.firstChild.style.width=me.reloadT>0?(1-me.reloadT/d.reload)*100+'%':'0';
   this.set(E.cross,'cc',w.id+(G.aimFoe?' foe':G.aimAlly?' ally':''),'className');const sp=d.pel?d.spr:me.spread;const px=Math.round(6+sp*innerHeight*1.1);E.cross.style.setProperty('--s',px+'px');
   if(w.id==='rail')E.cross.querySelector('circle').style.strokeDasharray=(me.chargeT/d.charge*151).toFixed(1)+' 200';
   E.scope.hidden=!(d.scope&&me.zoom>.6&&me.alive);E.cross.style.display=E.scope.hidden?'':'none';}
  this.set(E.nf,'nf','◆ FRAG '+me.nades.frag);this.set(E.np,'np','● PLASMA '+me.nades.plasma);E.nf.classList.toggle('on',me.nadeSel==='frag');E.np.classList.toggle('on',me.nadeSel==='plasma');
  // death screen
  E.dead.hidden=me.alive||G.phase!=='play';if(!me.alive){this.set(E.killer,'kl',me.killedBy?me.killedBy.name:'THE VOID');this.set(E.kwpn,'kw',me.killedWith||'');this.set(E.rsp,'rsp','RESPAWN '+Math.max(0,Math.ceil(me.respawnT)));}
  // name tags, objective markers
  let ti=0;const W=innerWidth,H=innerHeight,p=new V();const put=(pos,html,cls,col)=>{p.copy(pos).project(cam);if(p.z>1||p.z<-1)return false;const e=this._tag(ti++);e.style.display='';e.className=cls;if(e._h!==html){e._h=html;e.innerHTML=html;}e.style.color=col||'';
   e.style.transform=`translate(${(p.x*.5+.5)*W}px,${(-p.y*.5+.5)*H}px) translate(-50%,-100%)`;e.style.left=e.style.top='0';return true;};
  for(const f of G.fighters){if(f===me||!f.alive)continue;const ally=G.M.team&&f.team===me.team;if(ally||f===G.aimTarget){const hp=f.pos.clone();hp.y+=2.2;const d=hp.distanceTo(cam.position);if(ally||d<120)put(hp,f.name+(ally?'':''),ally?'ally':'foe');}}
  if(G.mode==='koth'&&G.hill()){const h=G.hill(),hp=h.p.clone();hp.y+=2.6;const st=G.hillState;const d=Math.round(h.p.distanceTo(me.pos));const col=st.owner<0?(st.contested?'#ffcf3f':'#ffffff'):TEAMCSS[st.owner];put(hp,`<i></i>HILL<span>${d}M</span>`,'obj',col);}
  for(let i=ti;i<this.tagPool.length;i++)if(this.tagPool[i].style.display!=='none')this.tagPool[i].style.display='none';
  // radar
  this.radarT-=dt;if(this.radarT<=0){this.radarT=1/20;this.drawRadar();}}
 drawRadar(){const G=this.G,me=G.me,x=this.rc,S=200,c=S/2,R=30;this.sweep=(this.sweep+.05)%1;x.clearRect(0,0,S,S);
  x.fillStyle='rgba(6,10,18,.62)';x.beginPath();x.arc(c,c,c-2,0,7);x.fill();x.strokeStyle='rgba(95,216,255,.35)';x.lineWidth=1.5;x.stroke();
  x.strokeStyle='rgba(95,216,255,.14)';for(const r of[.33,.66])x.beginPath(),x.arc(c,c,(c-2)*r,0,7),x.stroke();x.beginPath();x.moveTo(c,4);x.lineTo(c,S-4);x.moveTo(4,c);x.lineTo(S-4,c);x.stroke();
  const g=x.createConicGradient?x.createConicGradient(this.sweep*Math.PI*2-Math.PI/2,c,c):null;if(g){g.addColorStop(0,'rgba(95,216,255,.22)');g.addColorStop(.12,'rgba(95,216,255,0)');g.addColorStop(1,'rgba(95,216,255,0)');x.fillStyle=g;x.beginPath();x.arc(c,c,c-3,0,7);x.fill();}
  const cy=Math.cos(me.yaw),sy=Math.sin(me.yaw),k=(c-8)/R;const P=(px,pz)=>{const dx=px-me.pos.x,dz=pz-me.pos.z;const rx=dx*cy-dz*sy,ry=dx*sy+dz*cy;return[c+rx*k,c+ry*k,Math.hypot(rx,ry)];};
  if(G.mode==='koth'&&G.hill()){const h=G.hill();let[px,py,d]=P(h.p.x,h.p.z);if(d>R){px=c+(px-c)*R/d;py=c+(py-c)*R/d;}x.save();x.translate(px,py);x.rotate(Math.PI/4);x.strokeStyle='#fff';x.lineWidth=2;x.strokeRect(-5,-5,10,10);x.restore();}
  for(const f of G.fighters){if(f===me||!f.alive)continue;const ally=G.M.team&&f.team===me.team;const sp=Math.hypot(f.vel.x,f.vel.z);const loud=f.lastFire>G.time-1.2||sp>3.2||f.jetting||!f.onGround;
   if(!ally&&(!loud||f.camoT>0&&f.lastFire<G.time-1))continue;const[px,py,d]=P(f.pos.x,f.pos.z);if(d>R)continue;const dy=f.pos.y-me.pos.y;
   x.fillStyle=ally?'#5fb8ff':'#ff3d2e';x.beginPath();x.arc(px,py,dy>2.5||dy<-2.5?3.5:5,0,7);x.fill();if(dy>2.5||dy<-2.5){x.strokeStyle=x.fillStyle;x.lineWidth=1.5;x.beginPath();x.arc(px,py,6.5,dy>0?Math.PI:0,dy>0?Math.PI*2:Math.PI);x.stroke();}}
  x.fillStyle='#fff';x.beginPath();x.moveTo(c,c-8);x.lineTo(c+5,c+6);x.lineTo(c,c+3);x.lineTo(c-5,c+6);x.fill();}
 board(on){const G=this.G,e=this.el.board;e.hidden=!on;if(!on)return;const rows=G.fighters.slice().sort((a,b)=>b.stats.score-a.stats.score||b.stats.kills-a.stats.kills);
  const tr=f=>`<tr class="${f===G.me?'me ':''}${G.M.team?'t'+f.team:''}${f.alive?'':' dead'}"><td>${f.name}</td><td>${f.stats.score}</td><td>${f.stats.kills}</td><td>${f.stats.deaths}</td><td>${f.stats.assists}</td>${G.mode==='koth'?`<td>${Math.floor(f.stats.hill)}s</td>`:''}<td>${f.streak}</td></tr>`;
  const head=`<tr><th>FIGHTER</th><th>SCORE</th><th>K</th><th>D</th><th>A</th>${G.mode==='koth'?'<th>HILL</th>':''}<th>STREAK</th></tr>`;
  const html=`<h4>${G.M.n} · ${G.mapDef.name}</h4><table class="sb">${head}${G.M.team?[0,1].map(t=>rows.filter(f=>f.team===t).map(tr).join('')).join(''):rows.map(tr).join('')}</table>`;if(e._h!==html){e._h=html;e.innerHTML=html;}}}
