import {toast} from '../js/kit3d/ui.js';
// STRIKE ZONE — HUD: vitals, ammo + slots, match clock and scores, rotating minimap with shot pings, kill feed, hit markers,
// damage direction, medals, banners, name tags, killcam panel and the Tab scoreboard.
const $=id=>document.getElementById(id);
export const mmss=t=>{t=Math.max(0,Math.ceil(t));return (t/60|0)+':'+String(t%60).padStart(2,'0');};
const MODE_N={ffa:'FREE FOR ALL',tdm:'TEAM DEATHMATCH',ladder:'GUN LADDER'};
export class HUD{
 constructor(G){this.G=G;this.banT=0;this.hitT=0;this.cache={};this.dmg=[];const di=$('dmgind');for(let i=0;i<6;i++){const e=document.createElement('i');di.appendChild(e);this.dmg.push({e,t:0,a:0});}
  this.mini=$('mini').getContext('2d');this.tagPool=[];this.boardOn=false;this.boardT=0;}
 show(on){$('hud').hidden=!on;}
 set(id,v){if(this.cache[id]!==v){this.cache[id]=v;$(id).textContent=v;}}
 html(id,v){if(this.cache[id]!==v){this.cache[id]=v;$(id).innerHTML=v;}}
 banner(t,s,col,dur=2.2){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('bs').style.display=s?'':'none';$('banner').classList.add('on');this.banT=dur;}
 feed(e){const c=t=>t===0?'#ff9a5a':t===1?'#7cbcff':'#fff';
  const d=toast($('feed'),(e.k?`<b style="color:${e.kc||c(e.kt)}">${e.k}</b>`:'')+`<span class="w">${e.w}</span>${e.hs?'<span class="hs">◉</span> ':''}<b style="color:${e.vc||c(e.vt)}">${e.v}</b>`,5200,6);if(e.me)d.className='me';}
 medal(txt,pts,cls=''){toast($('medals'),txt+(pts?` <b>+${pts}</b>`:''),1400,4,false).className=cls;}
 hitmark(kind){const h=$('hit');h.className=kind||'';h.style.opacity=1;this.hitT=kind==='kill'?.32:.14;}
 hurt(ang){const s=this.dmg.find(x=>x.t<=0)||this.dmg[0];s.t=1;s.a=ang;}
 clear(){$('feed').innerHTML='';$('medals').innerHTML='';this.banT=0;$('banner').classList.remove('on');for(const s of this.dmg){s.t=0;s.e.style.opacity=0;}this.cache={};$('tags').innerHTML='';this.tagPool=[];}
 buildMini(L){const S=5,W=Math.ceil((L.X1-L.X0)*S),H=Math.ceil((L.Z1-L.Z0)*S);const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle=L.ground?'rgba(70,66,62,.55)':'rgba(0,0,0,0)';x.fillRect(0,0,W,H);
  const list=L.boxes.filter(b=>b.coll&&b.kind!=='bound'&&b.y1>.3).sort((a,b)=>a.y1-b.y1);
  for(const b of list){const tall=b.y1>3.5&&(b.y1-b.y0)>2.5,walk=b.kind==='slab'||b.kind==='step'||b.kind==='catwalk'||b.kind==='bridge'||b.kind==='gantry'||b.kind==='deck'||b.kind==='helipad'||b.kind==='roofslab'||b.kind==='terrace'||b.kind==='dock'||b.kind==='tower'||b.kind==='floor'||b.kind==='bridgefloor';
   x.fillStyle=b.kind==='roofslab'?'rgba(80,84,96,.75)':walk?`rgba(${120+b.y1*12|0},${110+b.y1*10|0},${100+b.y1*8|0},.7)`:tall?'rgba(230,220,210,.85)':'rgba(170,160,150,.75)';x.fillRect((b.x0-L.X0)*S,(b.z0-L.Z0)*S,Math.max(1,(b.x1-b.x0)*S),Math.max(1,(b.z1-b.z0)*S));}
  this.mm={c,S,L};}
 board(on){this.boardOn=on;$('board').hidden=!on;if(on)this.drawBoard();}
 drawBoard(){const G=this.G;const rows=G.actors.slice().sort((a,b)=>G.mode==='ladder'?(b.ladder-a.ladder||b.stats.k-a.stats.k):(b.stats.score-a.stats.score||b.stats.k-a.stats.k));
  const row=a=>`<tr class="${a.isPlayer?'me ':''}${G.mode==='tdm'?'t'+a.team:''}${a.alive?'':' dead'}"><td><span style="color:${a.css}">■</span> ${a.name}</td><td>${a.stats.k}</td><td>${a.stats.d}</td><td>${a.stats.a}</td><td>${G.mode==='ladder'?(a.ladder+1)+'/9':a.stats.best}</td><td>${a.stats.score}</td></tr>`;
  const head=`<tr><th>FIGHTER</th><th>K</th><th>D</th><th>A</th><th>${G.mode==='ladder'?'TIER':'BEST'}</th><th>SCORE</th></tr>`;let body='';
  if(G.mode==='tdm'){for(const t of[0,1]){body+=`<tr class="sep"><td colspan="6">${t===0?'EMBER SQUAD':'TIDE SQUAD'} · ${G.teamScore[t]}</td></tr>`+rows.filter(a=>a.team===t).map(row).join('');}}else body=rows.map(row).join('');
  $('board').innerHTML=`<h3>SCOREBOARD<em>.</em><span>${MODE_N[G.mode]} · ${G.L.def.name} · ${mmss(G.clock)}</span></h3><table>${head}${body}</table>`;}
 dead(on,info){$('dead').hidden=!on;if(!on)return;$('deadby').textContent=info.by;$('deadby').style.color=info.col||'#fff';$('deadw').textContent=info.w;}
 update(dt){const G=this.G,P=G.player;if(!P||$('hud').hidden)return;
  this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');this.hitT-=dt;if(this.hitT<=0)$('hit').style.opacity=0;
  for(const s of this.dmg){if(s.t>0){s.t-=dt*.9;s.e.style.opacity=Math.max(0,s.t);s.e.style.transform=`rotate(${P.yaw-s.a+Math.PI}rad)`;}}
  // clock + scores
  this.set('clock',mmss(G.clock));$('clock').className=G.clock<30?'low':'';const top=$('top');top.classList.toggle('tdm',G.mode==='tdm');
  if(G.mode==='tdm'){this.set('tlL','EMBER');this.set('tlR','TIDE');this.set('scL',G.teamScore[0]);this.set('scR',G.teamScore[1]);this.set('mlabel','TEAM DEATHMATCH · FIRST TO '+G.limit);}
  else if(G.mode==='ladder'){const lead=G.leader();this.set('tlL','YOU · TIER');this.set('scL',(P.ladder+1)+'/9');this.set('scR',lead?(lead.ladder+1)+'/9':'-');this.set('tlR',lead&&lead!==P?lead.name:'LEADING');this.set('mlabel','GUN LADDER · '+G.wname(P));}
  else{const lead=G.leader(P);this.set('tlL','YOU');this.set('scL',P.stats.k);this.set('scR',lead?lead.stats.k:0);this.set('tlR',lead?lead.name:'-');this.set('mlabel','FREE FOR ALL · FIRST TO '+G.limit);}
  // vitals
  const hp=Math.max(0,Math.ceil(P.hp));this.set('hp',hp);$('hpb').style.width=hp+'%';const hpE=document.querySelector('#vit .hp');hpE.classList.toggle('low',P.hp<35&&P.alive);hpE.classList.toggle('regen',P.alive&&P.hp<100&&G.time-P.lastHurt>4.5);
  this.html('streak',P.stats.streak>=2?`${P.stats.streak}<span>STREAK</span>`:'');
  // weapon
  const g=P.gun();if(g){this.set('wname',g.w.name);if(g.w.melee){this.set('amag','—');this.set('ares','');}else{this.set('amag',g.mag);this.set('ares','/ '+g.res);}$('amag').className=!g.w.melee&&g.mag<=Math.ceil(g.w.mag*.25)?'low':'';}
  this.set('frags','◆'.repeat(P.frags)+'◇'.repeat(Math.max(0,2-P.frags))+' FRAG');this.set('rel',P.reloadT>0?'RELOADING':g&&!g.w.melee&&g.mag===0&&g.res===0?'NO AMMO':g&&!g.w.melee&&g.mag<=Math.ceil(g.w.mag*.25)&&g.res>0?'R · RELOAD':'');
  const sl=P.slots.map((s,i)=>s?`<span class="${i===P.cur?'on':''}"><b>${i+1}</b>${s.w.name.split(' ')[0]}</span>`:'').join('');this.html('slots',sl);
  // crosshair: spread in px, hidden when aiming
  const cr=$('cross');const ads=P.adsK>.6;cr.className=(ads&&g&&!g.w.melee?'ads':'')+(g&&g.w.melee?' melee':'')+(G.app!=='play'||!P.alive?' off':'');const fovR=G.cam.fov*Math.PI/180;const px=(G.spreadNow||0)/Math.tan(fovR/2)*innerHeight/2;cr.style.setProperty('--g',Math.max(4,Math.min(60,px+3))+'px');
  // overlays
  $('hurtov').style.opacity=Math.min(1,G.hurtFx*1.2);$('lowov').style.opacity=P.alive&&P.hp<35?.5+.25*Math.sin(G.time*6):0;
  this.set('loc',G.L.zoneAt(P.pos.x,P.pos.y,P.pos.z));
  this.drawMini();this.tags();if(this.boardOn){this.boardT-=dt;if(this.boardT<=0){this.boardT=.25;this.drawBoard();}}}
 drawMini(){const G=this.G,P=G.player,x=this.mini,S=340,c=S/2,mm=this.mm;if(!mm)return;const sc=4.8;x.clearRect(0,0,S,S);x.save();x.beginPath();x.roundRect?x.roundRect(0,0,S,S,26):x.rect(0,0,S,S);x.clip();x.translate(c,c);x.rotate(P.yaw);
  x.drawImage(mm.c,(mm.L.X0-P.pos.x)*sc,(mm.L.Z0-P.pos.z)*sc,mm.c.width*sc/mm.S,mm.c.height*sc/mm.S);
  for(const p of G.pickups){if(!p.active)continue;x.fillStyle=p.k==='hp'?'#5cff96':p.k==='rl'?'#ffb040':'#d8d0c0';x.fillRect((p.x-P.pos.x)*sc-3,(p.z-P.pos.z)*sc-3,6,6);}
  for(const a of G.actors){if(a===P||!a.alive)continue;const ally=G.mode==='tdm'&&a.team===P.team;const ping=G.time-(a.lastFire||-9)<1.6;if(!ally&&!ping)continue;const mx=(a.pos.x-P.pos.x)*sc,mz=(a.pos.z-P.pos.z)*sc;
   x.fillStyle=ally?'#ff9a5a':'#ff3a2a';x.beginPath();x.arc(mx,mz,ally?6:7,0,7);x.fill();if(!ally){x.strokeStyle='rgba(255,60,40,.5)';x.lineWidth=2;x.beginPath();x.arc(mx,mz,10+((G.time*20)%10),0,7);x.stroke();}}
  x.restore();x.fillStyle='#fff';x.beginPath();x.moveTo(c,c-12);x.lineTo(c-8,c+8);x.lineTo(c,c+4);x.lineTo(c+8,c+8);x.fill();}
 tags(){const G=this.G,P=G.player,cam=G.cam;const el=$('tags');let k=0;const W=innerWidth,H=innerHeight;const v=G.tv||(G.tv=new G.V3());
  for(const a of G.actors){if(a===P||!a.alive)continue;const ally=G.mode==='tdm'&&a.team===P.team;const aimed=G.aimedAt===a;if(!ally&&!aimed)continue;v.set(a.pos.x,a.pos.y+2.1,a.pos.z).project(cam);if(v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1)continue;
   let d=this.tagPool[k];if(!d){d=document.createElement('div');d.innerHTML='<span></span><i><em></em></i>';el.appendChild(d);this.tagPool.push(d);}d.style.display='';d.style.left=((v.x+1)/2*W)+'px';d.style.top=((1-v.y)/2*H)+'px';d.style.color=ally?'#ffb080':'#ff5a4a';
   d.firstChild.textContent=a.name;d.lastChild.firstChild.style.width=Math.max(0,a.hp)+'%';k++;}
  for(let i=k;i<this.tagPool.length;i++)this.tagPool[i].style.display='none';}}
