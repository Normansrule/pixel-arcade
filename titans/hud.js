// HARDFALL — HUD: attrition score bar, pilot health + frame meter, frame hull/shield/dash/ordnance panel, weapon card, dynamic
// crosshairs (incl. seeker locks), radar, projected tags (allies, your frame, drop beacons), kill feed, medals, banners,
// damage arcs, death screen and scoreboard.
import * as THREE from '../vendor/three.module.min.js';
import {V,fmt,cl} from './util.js';
import {WPN,MECH} from './weapons.js';
import {toast} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id);
export const TEAMCSS=['#3d9bff','#ff6a2a'],TEAMN=['KESTREL','ASHEN'];
export class HUD{
 constructor(G){this.G=G;this.c={};this.el={};for(const k of['clock','modeTag','feed','tags','cross','hitm','streak','medals','prompt','cd','hpb','mtr','mtrT','wname','mag','res','walt','rl','nf','dead','killer','kwpn','rsp','board','dmg','vig','flash','radar','vit','mvit','hullb','mshb','dashp','rkc','agc','cockpit','s0','s1','p0','p1','boot','mwname','mmag'])this.el[k]=$(k);
  this.rc=this.el.radar.getContext('2d');this.tagPool=[];this.hitT=0;this.streakT=0;this.flashV=0;this.vigV=0;this.prm='';this.radarT=0;this.bootT=0;}
 set(el,k,v,prop='textContent'){if(this.c[k]!==v){this.c[k]=v;el[prop]=v;}}
 reset(){const E=this.el;E.feed.innerHTML='';E.medals.innerHTML='';E.dmg.innerHTML='';this.c={};E.modeTag.textContent='ATTRITION · '+this.G.cap;E.dead.hidden=true;E.board.hidden=true;}
 feed(k,v,w,mine,vName){const col=f=>f?TEAMCSS[f.team]:'#aaa';const nm=f=>f.kind==='grunt'?TEAMN[f.team]+' GRUNT':f.name;
  const d=toast(this.el.feed,(k&&k!==v?`<span style="color:${col(k)}">${nm(k)}</span><span class="w">${w}</span>`:`<span class="w">${w}</span>`)+`<span style="color:${col(v)}">${vName||nm(v)}</span>`,5200,6);if(mine)d.className='me';}
 sys(t,col='#9fe8ff'){toast(this.el.feed,`<span class="w" style="margin:0;color:${col}">${t}</span>`,4200);}
 medal(name,col='#ffcf3f',glyph='★'){const d=toast(this.el.medals,`<i>${glyph}</i><span>${name}</span>`,2600,4,false);d.className='medal';d.style.setProperty('--mc',col);}
 banner(t,s,col='#ff6a2a',dur=2.2){const e=this.el.streak;e.querySelector('b').textContent=t;e.querySelector('b').style.color=col;e.querySelector('span').textContent=s||'';e.querySelector('span').style.display=s?'':'none';e.classList.add('on');this.streakT=dur;}
 boot(){this.bootT=2.2;this.el.boot.classList.add('on');}
 hit(kind){this.el.hitm.className=kind||'';this.hitT=kind==='k'?.45:.22;}
 damageFrom(ang){const i=document.createElement('i');i.style.transform=`rotate(${ang}rad)`;this.el.dmg.appendChild(i);setTimeout(()=>i.remove(),1100);while(this.el.dmg.children.length>6)this.el.dmg.firstChild.remove();}
 flash(v=.7){this.flashV=Math.max(this.flashV,v);}
 prompt(html){if(this.prm!==html){this.prm=html;this.el.prompt.innerHTML=html;this.el.prompt.classList.toggle('on',!!html);}}
 _tag(i){let e=this.tagPool[i];if(!e){e=document.createElement('div');this.el.tags.appendChild(e);this.tagPool[i]=e;}return e;}
 update(dt,cam){const G=this.G,me=G.me,E=this.el;if(!me)return;const m=me.mech&&me.mech.state!=='dead'?me.mech:null;
  this.hitT-=dt;E.hitm.style.opacity=this.hitT>0?Math.min(1,this.hitT*6):0;if(this.streakT>0){this.streakT-=dt;if(this.streakT<=0)E.streak.classList.remove('on');}
  if(this.bootT>0){this.bootT-=dt;if(this.bootT<=0)E.boot.classList.remove('on');}
  this.flashV=Math.max(0,this.flashV-dt*2.5);E.flash.style.opacity=this.flashV;
  // top bar
  const s=G.teamScore,cap=G.cap;this.set(E.s0,'s0',String(Math.floor(s[me.team])));this.set(E.s1,'s1',String(Math.floor(s[1-me.team])));E.p0.style.width=cl(s[me.team]/cap,0,1)*100+'%';E.p1.style.width=cl(s[1-me.team]/cap,0,1)*100+'%';
  this.set(E.clock,'clk',fmt(G.clock));E.clock.style.color=G.clock<=30?'#ff6a2a':'';
  const cd=G.phase==='countdown'?String(Math.max(1,Math.ceil(G.cdT))):(G.phase==='play'&&G.goT>0?'FIGHT':'');this.set(E.cd,'cd',cd);E.cd.style.opacity=cd?(cd==='FIGHT'?Math.min(1,G.goT*2):1):0;
  // pilot vs frame panels
  const inM=!!m&&m.state==='piloted';E.vit.hidden=inM;E.mvit.hidden=!inM;E.cockpit.classList.toggle('on',inM);document.body.classList.toggle('inmech',inM);
  if(!inM){E.hpb.style.width=me.health+'%';E.hpb.parentNode.classList.toggle('low',me.health<35);}
  const mt=me.meter;E.mtr.style.setProperty('--p',(cl(mt,0,1)*100).toFixed(1));const own=G.mechOf(me);
  this.set(E.mtrT,'mtrT',own?(own.state==='idle'?'FRAME STANDING BY':own.state==='drop'?'FRAME INBOUND':'FRAME ONLINE'):mt>=1?'FRAME READY · PRESS V':'FRAME '+Math.floor(mt*100)+'%');E.mtr.classList.toggle('ready',mt>=1&&!own);
  if(inM){E.hullb.style.width=cl(m.hp/MECH.hp,0,1)*100+'%';E.hullb.parentNode.classList.toggle('low',m.hp<MECH.hp*.3);E.mshb.style.width=cl(m.sh/MECH.sh,0,1)*100+'%';
   this.set(E.dashp,'dp','<i class="'+(m.dash.n>=1?'on':'')+'"></i><i class="'+(m.dash.n>=2?'on':'')+'"></i>','innerHTML');
   const cdTxt=(t,max)=>t>0?Math.ceil(t)+'s':'READY';this.set(E.rkc,'rk',m.rk.cd>0?'SALVO '+cdTxt(m.rk.cd):'SALVO · RMB/Q');E.rkc.classList.toggle('on',m.rk.cd<=0);
   this.set(E.agc,'ag',m.shieldT>0?'AEGIS '+Math.ceil(m.shieldT)+'s':m.aegis.cd>0?'AEGIS '+cdTxt(m.aegis.cd):'AEGIS · F');E.agc.classList.toggle('on',m.aegis.cd<=0||m.shieldT>0);
   this.set(E.mwname,'mwn',MECH.cg.name);this.set(E.mmag,'mmag',m.cg.reloadT>0?'RELOAD':String(m.cg.mag));}
  // vignette
  const hurt=inM?cl(1-m.hp/MECH.hp,0,1)*.5:me.alive?cl((1-me.health/100)*1.1,0,1):0;this.vigV+=(Math.max(hurt,G.hurtFx)-this.vigV)*Math.min(1,dt*8);E.vig.style.opacity=this.vigV;
  // weapon card
  E.wpn=E.wpn||$('wpn');E.wpn.hidden=inM;
  const w=me.weapons[me.wi];if(w&&!inM){const d=WPN[w.id];this.set(E.wname,'wn',d.name);this.set(E.mag,'mag',String(w.mag));E.mag.classList.toggle('low',w.mag<=Math.max(1,d.mag*.25));this.set(E.res,'res','/ '+d.mag);
   this.set(E.walt,'alt',me.weapons.map((x,i)=>`<span class="${i===me.wi?'on':''}">${i+1} ${WPN[x.id].name.split(' ')[0]}</span>`).join(''),'innerHTML');
   E.rl.classList.toggle('on',me.reloadT>0);E.rl.firstChild.style.width=me.reloadT>0?(1-me.reloadT/d.reload)*100+'%':'0';
   this.set(E.cross,'cc',w.id+(G.aimFoe?' foe':G.aimAlly?' ally':''),'className');const sp=d.pel?d.spr:me.spread;const px=Math.round(6+sp*innerHeight*1.1);E.cross.style.setProperty('--s',px+'px');}
  else if(inM){this.set(E.cross,'cc','mech'+(G.aimFoe?' foe':''),'className');E.cross.style.setProperty('--s',Math.round(14+m.cg.spread*innerHeight)+'px');}
  E.cross.style.display=me.alive?'':'none';
  this.set(E.nf,'nf','◆ FRAG '+me.nades);
  // death screen
  E.dead.hidden=me.alive||G.phase!=='play';if(!me.alive){this.set(E.killer,'kl',me.killedBy?(me.killedBy.kind==='grunt'?TEAMN[me.killedBy.team]+' GRUNT':me.killedBy.name):'THE FALL');this.set(E.kwpn,'kw',me.killedWith||'');this.set(E.rsp,'rsp','REDEPLOY '+Math.max(0,Math.ceil(me.respawnT)));}
  // tags
  let ti=0;const W=innerWidth,H=innerHeight,p=new V();const put=(pos,html,cls,col)=>{p.copy(pos).project(cam);if(p.z>1||p.z<-1)return false;const e=this._tag(ti++);e.style.display='';e.className=cls;if(e._h!==html){e._h=html;e.innerHTML=html;}e.style.color=col||'';
   e.style.transform=`translate(${(p.x*.5+.5)*W}px,${(-p.y*.5+.5)*H}px) translate(-50%,-100%)`;return true;};
  const camP=cam.position;
  for(const f of G.fighters){if(f===me||!f.alive||f.mech)continue;const ally=f.team===me.team;if(ally&&f.kind==='pilot'||f===G.aimTarget){const hp=f.pos.clone();hp.y+=2.2;if(ally||hp.distanceTo(camP)<120)put(hp,f.kind==='grunt'?'GRUNT':f.name,ally?'ally':'foe');}}
  for(const mm of G.mechs){if(mm.state==='dead')continue;const mine=mm.owner===me,ally=mm.team===me.team;if(mm===m)continue;const hp=mm.pos.clone();hp.y+=7.2;
   if(mine&&mm.state!=='piloted'){put(hp,`<i></i>YOUR FRAME<span>${Math.round(mm.pos.distanceTo(me.pos))}M</span>`,'obj',TEAMCSS[me.team]);}
   else if(ally&&mm.state==='piloted')put(hp,(mm.pilot?mm.pilot.name:'')+'<s style="width:'+(cl(mm.hp/MECH.hp,0,1)*100)+'%"></s>','ally mt');
   else if(!ally&&(mm===G.aimTarget||hp.distanceTo(camP)<60))put(hp,'FRAME<s style="width:'+(cl(mm.hp/MECH.hp,0,1)*100)+'%"></s>','foe mt');}
  for(const b of G.beacons){const bp=b.p.clone();bp.y+=2;put(bp,`<i></i>${b.team===me.team?'FRAME DROP':'HOSTILE DROP'}<span>${Math.max(0,b.t).toFixed(1)}s</span>`,'obj',b.team===me.team?TEAMCSS[me.team]:'#ff4a3a');}
  if(!inM&&me.alive&&w&&w.id==='seeker'&&me.locks)for(const[t,k]of me.locks){if(k<=0||!t.alive)continue;const need=t.kind==='grunt'?1:3;const hp=t.pos.clone();hp.y+=t.slideT>0?1:1.5;
   put(hp,'<b class="lk'+(k>=need?' full':'')+'">'+'▮'.repeat(Math.min(need,Math.floor(k)))+'▯'.repeat(Math.max(0,need-Math.floor(k)))+'</b>','lock');}
  for(let i=ti;i<this.tagPool.length;i++)if(this.tagPool[i].style.display!=='none')this.tagPool[i].style.display='none';
  this.radarT-=dt;if(this.radarT<=0){this.radarT=1/15;this.drawRadar();}}
 drawRadar(){const G=this.G,me=G.me,x=this.rc,S=200,c=S/2,R=48;x.clearRect(0,0,S,S);const tc=me.team?'255,106,42':'61,155,255';
  x.fillStyle='rgba(6,10,16,.6)';x.beginPath();x.arc(c,c,c-2,0,7);x.fill();x.strokeStyle=`rgba(${tc},.4)`;x.lineWidth=1.5;x.stroke();
  x.strokeStyle=`rgba(${tc},.14)`;for(const r of[.33,.66])x.beginPath(),x.arc(c,c,(c-2)*r,0,7),x.stroke();
  const yaw=me.yaw,cy=Math.cos(yaw),sy=Math.sin(yaw),k=(c-8)/R;const P=(px,pz)=>{const dx=px-me.pos.x,dz=pz-me.pos.z;const rx=dx*cy-dz*sy,ry=dx*sy+dz*cy;return[c+rx*k,c+ry*k,Math.hypot(rx,ry)];};
  for(const f of G.fighters){if(f===me||!f.alive||f.mech)continue;const ally=f.team===me.team;const loud=f.lastFire>G.time-1.2||Math.hypot(f.vel.x,f.vel.z)>6||!f.onGround;if(!ally&&!loud)continue;
   const[px,py,d]=P(f.pos.x,f.pos.z);if(d>R)continue;x.fillStyle=ally?'#5fb8ff':'#ff3d2e';x.beginPath();x.arc(px,py,f.kind==='grunt'?2.5:4,0,7);x.fill();}
  for(const m of G.mechs){if(m.state==='dead')continue;let[px,py,d]=P(m.pos.x,m.pos.z);if(d>R){if(m.owner!==me)continue;px=c+(px-c)*R/d;py=c+(py-c)*R/d;}const ally=m.team===me.team;
   x.save();x.translate(px,py);x.rotate(-(m.legYaw-me.yaw));x.fillStyle=m.owner===me?'#fff':ally?'#5fb8ff':'#ff3d2e';x.fillRect(-6,-6,12,12);x.fillStyle='rgba(0,0,0,.6)';x.fillRect(-2,-6,4,5);x.restore();}
  x.fillStyle='#fff';x.beginPath();x.moveTo(c,c-8);x.lineTo(c+5,c+6);x.lineTo(c,c+3);x.lineTo(c-5,c+6);x.fill();}
 board(on){const G=this.G,e=this.el.board;e.hidden=!on;if(!on)return;const rows=G.fighters.filter(f=>f.kind==='pilot').sort((a,b)=>b.stats.pts-a.stats.pts);
  const tr=f=>`<tr class="${f===G.me?'me ':''}t${f.team}${f.alive?'':' dead'}"><td>${f.name}${f.mech?' ▣':''}</td><td>${f.stats.pts}</td><td>${f.stats.kills}</td><td>${f.stats.grunts}</td><td>${f.stats.frames}</td><td>${f.stats.deaths}</td></tr>`;
  const head=`<tr><th>PILOT</th><th>ATTR</th><th>PK</th><th>GK</th><th>FK</th><th>D</th></tr>`;
  const html=`<h4>ATTRITION · ${G.mapDef.name}</h4><table class="sb">${head}${[0,1].map(t=>`<tr class="hd"><td colspan="6" style="color:${TEAMCSS[t]}">${TEAMN[t]} · ${Math.floor(G.teamScore[t])}</td></tr>`+rows.filter(f=>f.team===t).map(tr).join('')).join('')}</table>`;if(e._h!==html){e._h=html;e.innerHTML=html;}}}
