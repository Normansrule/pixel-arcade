// FORTRESS BREACH — DOM HUD: score bar + round clock, objective strip, floor-aware minimap (live wall holes),
// projected markers (pings, teammates, objective, heartbeats), vitals + gadgets, ammo, crosshair, kill feed,
// drone / camera overlays, operator pick + ban screens, scoreboard.
import * as THREE from '../vendor/three.module.min.js';
import {FH,BX0,BX1,BZ0,BZ1,CELL} from './level.js';
const $=id=>document.getElementById(id);
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
const V=THREE.Vector3;
export class HUD{
 constructor(G,C,X){this.G=G;this.C=C;this.X=X;this.c={};this.banT=0;this.hitT=0;this.toastT=0;this.arcs=[];this.boardOn=false;this.mmT=0;this.marks=[];
  this.mini=$('mini');this.mx=this.mini.getContext('2d');const arcs=$('dmgind');for(let i=0;i<6;i++){const d=document.createElement('i');arcs.appendChild(d);this.arcs.push({el:d,t:0,ang:0});}
  const mk=$('marks');for(let i=0;i<24;i++){const d=document.createElement('div');d.className='mk';mk.appendChild(d);this.marks.push(d);}this.pv=new V();}
 show(on){$('hud').hidden=!on;if(!on){$('flashov').style.opacity=0;$('hurtov').style.opacity=0;$('scope').hidden=true;$('viewov').hidden=true;}}
 set(el,v,k){if(this.c[k]!==v){this.c[k]=v;el.textContent=v;}}
 html(el,v,k){if(this.c[k]!==v){this.c[k]=v;el.innerHTML=v;}}
 roundStart(){$('dead').hidden=true;$('spec').hidden=true;this.c={};}
 banner(t,s,col,dur){$('bt').textContent=t;$('bt').style.color=col;$('bs').textContent=s;$('bs').style.display=s?'':'none';$('banner').classList.add('on');this.banT=dur;}
 toast(m){if(!m)return;$('toast').textContent=m;$('toast').classList.add('on');this.toastT=2.2;}
 toast2(m){this.toast(m);}
 clearFeed(){$('feed').innerHTML='';}
 feed(e){const S=this.X.SIDE;const d=document.createElement('div');if(e.me)d.className='me';
  d.innerHTML=`${e.k?`<b style="color:${S[e.ks].css}">${e.k}</b>`:''}<i>${e.w}${e.hs?' <em>◉</em>':''}${e.wb?' <em>⫽</em>':''}</i><b style="color:${S[e.vs].css}">${e.v}</b>`;$('feed').prepend(d);setTimeout(()=>d.remove(),6500);while($('feed').children.length>6)$('feed').lastChild.remove();}
 hitmark(kind,kill){const h=$('hit');h.className=kind+(kill?' kill':'');h.style.opacity=1;this.hitT=kill?.45:.22;}
 hurt(ang,yaw,dmg){const a=this.arcs.find(x=>x.t<=0)||this.arcs[0];a.t=1.4;a.ang=ang;a.el.style.opacity=Math.min(1,.4+dmg/40);$('hurtov').style.opacity=Math.min(.75,dmg/60);}
 died(k,w,hs){$('dead').hidden=false;$('deadby').innerHTML=k&&k!==this.G.player?`ELIMINATED BY <b>${k.name}</b> · ${w}${hs?' · HEADSHOT':''}${k.hp>0?' · '+Math.ceil(k.hp)+' HP LEFT':''}`:'ELIMINATED · '+w;setTimeout(()=>{$('dead').hidden=true;},3500);}
 board(on){this.boardOn=on;$('board').hidden=!on;if(on)this.drawBoard();}
 drawBoard(){const G=this.G,S=this.X.SIDE;const me=G.player;const my=me?G.side(me):'atk';const rows=s=>G.agents.filter(a=>a.squad===s).sort((p,q)=>q.stats.score-p.stats.score).map(a=>`<tr class="${a.alive?'':'dead'}${a.human?' me':''}"><td><i style="background:${S[G.side(a)].css}"></i>${a.name} <em>${a.op?a.op.n:''}</em></td><td>${a.stats.k}</td><td>${a.stats.d}</td><td>${a.stats.a}</td><td>${a.stats.breach||0}</td><td>${a.stats.score}</td></tr>`).join('');
  const hist=G.history.map(h=>`<i class="${h.squad===0?'w':'l'}">${h.win==='atk'?'A':'D'}</i>`).join('');
  $('board').innerHTML=`<div class="bh"><b style="color:${S[my].css}">YOUR TEAM · ${G.score[0]}</b><span>BEST OF ${G.len().target*2-1} · ROUND ${G.round+1}<br>${G.opt.mode==='secure'?'SECURE THE OBJECTIVE':'CAPTURE THE AREA'}</span><b style="color:${S[my==='atk'?'def':'atk'].css}">${G.score[1]} · ENEMY</b></div><div class="hist">${hist}</div>
   <table><tr><th>OPERATOR</th><th>K</th><th>D</th><th>A</th><th>BREACH</th><th>SCORE</th></tr>${rows(0)}</table><table><tr><th>OPERATOR</th><th>K</th><th>D</th><th>A</th><th>BREACH</th><th>SCORE</th></tr>${rows(1)}</table>`;}
 /* ---------------- pick + ban screens ---------------- */
 opCard(k,o={}){const op=this.X.OPS[k],G=this.X.GAD[op.gad],W=this.X.WPN;const st=n=>'●'.repeat(n)+'○'.repeat(3-n);
  return`<button class="opc${o.on?' on':''}${o.ban?' ban':''}" data-k="${k}" ${o.dis?'disabled':''} style="--oc:#${op.col.toString(16).padStart(6,'0')}"><b>${op.n}</b><span class="role">${op.role}</span><span class="gad">${G.n}${op.gn>1?' ×'+op.gn:''}</span>
   <span class="ld">${W[op.pri].n} · ${W[op.sec].n} · ${this.X.THR[op.util].n}${op.un>1?' ×'+op.un:''}</span><span class="st">ARMOR ${st(op.arm)} SPEED ${st(4-op.arm)}</span>${o.ban?'<em>BANNED</em>':''}</button>`;}
 showBan(){const X=this.X;$('ban').hidden=false;let ba=null,bd=null;const draw=()=>{$('banA').innerHTML=X.ATK_OPS.map(k=>this.opCard(k,{ban:ba===k})).join('');$('banD').innerHTML=X.DEF_OPS.map(k=>this.opCard(k,{ban:bd===k})).join('');
   $('banA').querySelectorAll('button').forEach(b=>b.onclick=()=>{ba=ba===b.dataset.k?null:b.dataset.k;draw();});$('banD').querySelectorAll('button').forEach(b=>b.onclick=()=>{bd=bd===b.dataset.k?null:b.dataset.k;draw();});};draw();
  $('banGo').onclick=()=>{$('ban').hidden=true;this.G.ban(ba,bd);};}
 showPick(){const G=this.G,X=this.X;const me=G.player;const sd=G.side(me);$('pick').hidden=false;const avail=G.available(sd);const list=(sd==='atk'?X.ATK_OPS:X.DEF_OPS);const rk=sd==='atk'?'recruitA':'recruitD';
  const key=sd==='atk'?'atkOp':'defOp';if(!avail.includes(G.opt[key])&&G.opt[key]!==rk)G.opt[key]=avail[0]||rk;
  $('pkeye').textContent=`ROUND ${G.round+1} · ${G.score[0]} – ${G.score[1]} · BEST OF ${G.len().target*2-1}`;$('pkt').innerHTML=sd==='atk'?'YOU <em style="color:#ff8a3d">ATTACK</em>':'YOU <em style="color:#4fb2ff">DEFEND</em>';
  $('pkhow').textContent=sd==='atk'?'Prep phase: you drive a drone to find the objective and tag defenders. Then breach: soft walls fall to charges and shotguns, reinforced walls only to the Arc Lance.':'Prep phase: reinforce walls (hold F, team pool of 10), barricade doors and windows, lay your gadget. Security cameras: press 5.';
  const draw=()=>{$('pkops').innerHTML=[...list,rk].map(k=>this.opCard(k,{on:G.opt[key]===k,ban:G.bans[sd].includes(k),dis:G.bans[sd].includes(k)})).join('');
   $('pkops').querySelectorAll('button').forEach(b=>b.onclick=()=>{G.opt[key]=b.dataset.k;draw();});
   const op=X.OPS[G.opt[key]];$('pkbio').innerHTML=`<b>${op.n}</b> — ${op.bio}<br><span>${X.GAD[op.gad].d}</span>`;
   if(sd==='atk'){$('pkwhere').innerHTML='<label>SPAWN</label>'+Object.keys(X.SPAWNS).map(k=>`<button data-v="${k}" class="${G.opt.spawn===k?'on':''}">${X.SPAWNS[k].n}</button>`).join('');$('pkwhere').querySelectorAll('button').forEach(b=>b.onclick=()=>{G.opt.spawn=b.dataset.v;draw();});}
   else{$('pkwhere').innerHTML='<label>DEFEND</label>'+X.SITES.map(s=>`<button data-v="${s.id}" class="${G.opt.site===s.id?'on':''}">${s.n} · ${s.f?'2F':'1F'}</button>`).join('');$('pkwhere').querySelectorAll('button').forEach(b=>b.onclick=()=>{G.opt.site=b.dataset.v;draw();});}};draw();
  this.pickT=20;$('pkgo').onclick=()=>{$('pick').hidden=true;this.pickT=0;G.confirmPick();};}
 /* ---------------- minimap ---------------- */
 drawMini(){const G=this.G,L=this.X.L,x=this.mx,W=this.mini.width,H=this.mini.height;const P=G.player;if(!P)return;const f=G.view==='drone'&&P.drone?(P.drone.pos.y>2?1:0):G.view==='cam'?(this.C.GX.cams[G.camI]&&this.C.GX.cams[G.camI].pos.y>4?1:0):(P.pos.y>2?1:0);
  const s=W/34,ox=W/2,oz=H/2;const X=v=>ox+v*s,Z=v=>oz+v*s;x.clearRect(0,0,W,H);x.fillStyle='rgba(10,12,16,.55)';x.fillRect(0,0,W,H);
  // rooms
  for(const r of L.rooms){if(r.f!==f)continue;const site=G.site&&G.site.id===r.id&&(G.side(P)==='def'||G.siteKnown);x.fillStyle=site?'rgba(255,77,0,.22)':'rgba(255,255,255,.06)';x.fillRect(X(r.r[0]),Z(r.r[2]),(r.r[1]-r.r[0])*s,(r.r[3]-r.r[2])*s);}
  if(f===0){x.fillStyle='rgba(255,255,255,.12)';x.fillRect(X(2),Z(-3),2*s,6*s);}
  // walls (cell columns with a solid cell at waist height)
  for(const pn of L.panels){if(!pn.active||pn.f!==f)continue;const ax=pn.axis==='x';x.strokeStyle=pn.kind==='bar'?'#c08040':pn.rein?'#9ab':'#e8e4dc';x.lineWidth=pn.rein?3:pn.kind==='bar'?2:1.6;x.beginPath();
   const r=Math.min(pn.rows-1,Math.floor((pn.y0+1.2-pn.y0)/CELL));let run=-1;for(let c=0;c<=pn.cols;c++){const sol=c<pn.cols&&(pn.cells[r*pn.cols+c]||pn.cells[Math.min(pn.rows-1,r+2)*pn.cols+c]&&pn.kind!=='bar'&&pn.cells[Math.max(0,r-3)*pn.cols+c]);
    if(sol&&run<0)run=c;else if(!sol&&run>=0){const a=pn.u0+run*CELL,b=pn.u0+c*CELL;if(ax){x.moveTo(X(a),Z(pn.c));x.lineTo(X(b),Z(pn.c));}else{x.moveTo(X(pn.c),Z(a));x.lineTo(X(pn.c),Z(b));}run=-1;}}x.stroke();}
  for(const b of L.boxes)if(b.kind==='wall'&&b.f===f){x.fillStyle='#bbb';x.fillRect(X(b.x0),Z(b.z0),(b.x1-b.x0)*s,(b.z1-b.z0)*s);}
  // hatches
  for(const h of L.hatches){x.strokeStyle=h.state==='open'?'#ff4d00':h.rein?'#9ab':'#a07040';x.lineWidth=1.5;x.strokeRect(X(h.x)+1,Z(h.z)+1,s-2,s-2);}
  // objective
  if(G.site&&(G.side(P)==='def'||G.siteKnown)&&G.site.f===f){x.fillStyle='#ff4d00';x.font='700 9px JetBrains Mono, monospace';x.textAlign='center';x.fillText('◆',X(G.site.c[0]),Z(G.site.c[1])+3);}
  if(G.defuser.state==='planted'){x.fillStyle=(G.time*3%1)<.5?'#ff2a10':'#ffd04a';x.beginPath();x.arc(X(G.defuser.pos.x),Z(G.defuser.pos.z),4,0,7);x.fill();}
  // agents
  const my=G.side(P);for(const a of G.agents){if(!a.alive)continue;const mine=G.side(a)===my;if(!mine&&!G.spotted(a,my))continue;const af=a.pos.y>2?1:0;x.globalAlpha=af===f?1:.35;const px=Math.max(4,Math.min(W-4,X(a.pos.x))),pz=Math.max(4,Math.min(H-4,Z(a.pos.z)));
   x.fillStyle=a===P?'#fff':mine?(my==='atk'?'#ff8a3d':'#4fb2ff'):'#ff3030';x.save();x.translate(px,pz);x.rotate(-a.yaw);x.beginPath();x.moveTo(0,-5);x.lineTo(3.5,4);x.lineTo(-3.5,4);x.closePath();x.fill();x.restore();}
  x.globalAlpha=1;for(const d of this.C.GX.drones){if(!d.alive||G.side(d.owner)!==my)continue;x.fillStyle='#8cf';x.fillRect(X(d.pos.x)-2,Z(d.pos.z)-2,4,4);}
  if(my==='def')for(const c of this.C.GX.cams){if(!c.alive)continue;x.fillStyle=c.dis>0?'#555':'#7cf';x.fillRect(X(c.pos.x)-2,Z(c.pos.z)-2,4,4);}
  x.fillStyle='rgba(255,255,255,.5)';x.font='700 8px JetBrains Mono, monospace';x.textAlign='left';x.fillText(f?'2F':'1F',5,11);}
 /* ---------------- projected markers ---------------- */
 marksUpdate(){const G=this.G,P=G.player,cam=this.C.cam;let i=0;const W=innerWidth,H=innerHeight;const my=P?G.side(P):null;
  const put=(p,cls,txt)=>{if(i>=this.marks.length)return;const v=this.pv.copy(p).project(cam);if(v.z>1||v.z<-1)return;const el=this.marks[i++];const x=(v.x*.5+.5)*W,y=(-v.y*.5+.5)*H;if(x<-40||x>W+40||y<-40||y>H+40){el.style.display='none';return;}
   el.style.display='';el.className='mk '+cls;el.style.transform=`translate(${x|0}px,${y|0}px)`;if(el._t!==txt){el._t=txt;el.innerHTML=txt;}};
  if(P&&G.app==='match'&&G.phase!=='end'){
   for(const a of G.agents){if(!a.alive||a===P)continue;const p=new V(a.pos.x,a.pos.y+(a.proneV>.5?.6:2.05),a.pos.z);const d=p.distanceTo(cam.position)|0;
    if(G.side(a)===my){if(d<40)put(p,'tm '+my,d<14?`<i></i><span>${a.name}</span>`:'<i></i>');}else if(G.spotted(a,my))put(new V(a.pos.x,a.pos.y+1.2,a.pos.z),'en',`<i></i><span>${d}m</span>`);}
   for(const h of G.scanHits){if(G.time-h.t>1.2||!h.v.alive)continue;put(new V(h.v.pos.x,h.v.pos.y+1.2,h.v.pos.z),'hb','<i></i>');}
   const showObj=my==='def'||G.siteKnown;if(showObj&&G.site&&G.defuser.state!=='planted')put(new V(G.site.c[0],G.site.f*FH+1.4,G.site.c[1]),'obj',`<i>◆</i><span>${G.site.n}</span>`);
   if(G.defuser.state==='planted')put(G.defuser.pos.clone().add(new V(0,.8,0)),'obj def',`<i>⬢</i><span>DEFUSER ${Math.ceil(G.defuser.t)}s</span>`);
   if(G.defuser.state==='dropped'&&my==='atk')put(G.defuser.pos.clone().add(new V(0,.5,0)),'obj',`<i>⬢</i><span>DEFUSER</span>`);
   for(const o of this.C.GX.list){if(!o.alive||o.owner!==P)continue;if(o.type==='charge'||o.type==='cutter')put(o.pos,'gd',`<i>${o.type==='charge'?'✱':'◎'}</i>`);}}
  for(;i<this.marks.length;i++)this.marks[i].style.display='none';}
 /* ---------------- per-frame ---------------- */
 update(dt){const G=this.G,X=this.X,S=X.SIDE;if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}if(this.toastT>0){this.toastT-=dt;if(this.toastT<=0)$('toast').classList.remove('on');}
  if(G.app==='pick'&&this.pickT>0){this.pickT-=dt;$('pkgo').textContent='READY · '+Math.ceil(this.pickT);if(this.pickT<=0){$('pick').hidden=true;G.confirmPick();}}
  if(G.app!=='match'&&G.app!=='paused')return;const P=G.player;if(!P)return;const my=G.side(P),en=my==='atk'?'def':'atk';
  this.set($('scL'),G.score[0],'sl');this.set($('scR'),G.score[1],'sr');this.set($('tL'),S[my].s,'tl');this.set($('tR'),S[en].s,'tr');$('top').style.setProperty('--cl',S[my].css);$('top').style.setProperty('--cr',S[en].css);
  const pips=s=>G.agents.filter(a=>G.side(a)===s).map(a=>`<i class="${a.alive?'on':''}${a===P?' me':''}" title="${a.name}">${a.op?a.op.n[0]:''}</i>`).join('');this.html($('alL'),pips(my),'pl');this.html($('alR'),pips(en),'pr');
  let clk,lab;if(G.phase==='prep'){clk=fmt(G.timer);lab='PREP PHASE';}else if(G.phase==='action'){clk=fmt(G.timer);lab='ROUND '+(G.round+1);}else if(G.phase==='post'){clk=fmt(G.defuser.t);lab='DEFUSER RUNNING';}else{clk=fmt(G.endT);lab='ROUND OVER';}
  this.set($('clock'),clk,'clk');this.set($('phase'),lab,'ph');$('clock').classList.toggle('low',G.phase==='action'&&G.timer<=20);$('clock').classList.toggle('bomb',G.phase==='post');
  // objective strip
  let ob='';const s=G.site;if(G.phase==='prep')ob=my==='def'?`DEFEND <b>${s.n}</b> · ${s.f?'2F':'1F'} · REINFORCEMENTS <b>${G.rein}</b>`:G.siteKnown?`OBJECTIVE FOUND · <b>${s.n}</b> · ${s.f?'2F':'1F'}`:'LOCATE THE OBJECTIVE WITH YOUR DRONE';
  else if(G.phase==='post')ob=my==='atk'?`PROTECT THE DEFUSER · <b>${Math.ceil(G.defuser.t)}s</b>`:`DISABLE THE DEFUSER · <b>${Math.ceil(G.defuser.t)}s</b>`;
  else if(G.phase==='action'){if(G.opt.mode==='capture')ob=`${my==='atk'?'SECURE':'HOLD'} <b>${(my==='def'||G.siteKnown)?s.n:'???'}</b> · ${Math.round(G.cap*100)}%${G.contested?' · CONTESTED':''}`;else ob=my==='atk'?(G.siteKnown?`PLANT THE DEFUSER IN <b>${s.n}</b> · ${s.f?'2F':'1F'}`:'OBJECTIVE UNKNOWN · SCOUT'):`DEFEND <b>${s.n}</b>`;
   if(my==='atk'&&G.defuser.carrier===P)ob+=' · <b style="color:#ffd04a">YOU CARRY THE DEFUSER</b>';}
  this.html($('obj'),ob,'ob');
  // vitals
  const Q=P.alive||!G.spec?P:G.spec;this.set($('hp'),Math.max(0,Math.ceil(Q.hp)),'hp');$('vitals').classList.toggle('low',Q.hp<=30);this.set($('opn'),Q.op?Q.op.n+' · '+Q.op.role:'','opn');
  $('hpbar').style.width=(Math.max(0,Q.hp)/Q.maxHp*100)+'%';
  const g=Q.gun();let nm='',am='',rs='';if(g){nm=g.def.n;am=g.def.mag?g.mag:'';rs='/ '+g.res;}else if(Q.cur===3){nm=X.GAD[Q.op.gad].n;am=Q.op.gad==='scan'?'∞':Q.gn;}else{nm=X.THR[Q.op.util].n;am=Q.un;}
  this.set($('wname'),nm,'wn');this.set($('amag'),am,'am');this.set($('ares'),rs,'ar2');$('amag').classList.toggle('low',!!(g&&g.mag<=Math.ceil(g.def.mag*.2)));
  const charges=this.C.GX.list.some(o=>o.alive&&o.owner===P&&o.type==='charge');
  const sl=[[1,P.slots[1].def.n],[2,P.slots[2].def.n],[3,X.GAD[P.op.gad].n+(P.op.gad==='scan'?'':' ×'+P.gn)],[4,X.THR[P.op.util].n+' ×'+P.un],[5,my==='atk'?'DRONE'+(P.drone&&P.drone.alive?'':' ✕'):'CAMERAS']];
  $('slots').style.display=P.alive?'':'none';this.html($('slots'),sl.map(x=>`<span class="${P.cur===x[0]?'on':''}${(x[0]===3&&P.gn<=0&&P.op.gad!=='scan')||(x[0]===4&&P.un<=0)?' out':''}"><kbd>${x[0]}</kbd>${x[1]}</span>`).join('')+(charges?'<span class="det"><kbd>X</kbd>DETONATE</span>':''),'slots');
  // crosshair
  const inacc=G.spreadOf(P),h=innerHeight,f=h/(2*Math.tan(this.C.cam.fov*Math.PI/360));const gap=Math.round(3+Math.tan(inacc)*f);$('cross').style.setProperty('--g',Math.min(80,gap)+'px');$('cross').style.display=P.alive&&G.view==='body'&&!(g&&g.def.scope&&P.ads>.8)&&!(P.ads>.8&&g)?'':'none';
  $('cross').classList.toggle('ads',P.ads>.5);
  if(this.hitT>0){this.hitT-=dt;if(this.hitT<=0)$('hit').style.opacity=0;}
  for(const a of this.arcs){if(a.t>0){a.t-=dt;const rel=a.ang-(P.yaw+Math.PI);a.el.style.transform=`rotate(${-rel*180/Math.PI}deg)`;if(a.t<=0)a.el.style.opacity=0;else if(a.t<.6)a.el.style.opacity=a.t/.6;}}
  const ho=$('hurtov');ho.style.opacity=Math.max(0,(+ho.style.opacity||0)-dt*1.2);$('flashov').style.opacity=P.alive?Math.min(1,P.blind/1.4):0;
  $('smokeov').style.opacity=P.alive&&G.view==='body'?Math.min(.95,(G.fxRef||this.C.fx).inSmoke(P.pos.x,P.pos.y+P.eye,P.pos.z)*1.1):0;
  // progress
  let prog=null;if(P.act)prog=[P.act.label,P.act.t/P.act.T];else{const cu=this.C.GX.list.find(o=>o.alive&&o.owner===P&&o.type==='cutter');if(cu)prog=[cu.jam?'ARC LANCE JAMMED':'ARC LANCE BURNING',(cu.prog||0)/cu.dur];}
  if(!prog&&G.opt.mode==='capture'&&G.phase==='action'&&G.cap>0)prog=[G.contested?'CONTESTED':'SECURING AREA',G.cap];
  $('prog').hidden=!prog;if(prog){this.set($('progt'),prog[0],'pt');$('progb').style.width=(Math.min(1,prog[1])*100).toFixed(1)+'%';}
  // hints
  let hint='';if(P.alive&&G.view==='body'&&!P.act){const it=G.interactTarget(P);if(it)hint=`HOLD <kbd>F</kbd> ${({rein:'REINFORCE ('+G.rein+' LEFT)',hrein:'REINFORCE HATCH ('+G.rein+' LEFT)',bar:'BARRICADE',plant:'PLANT DEFUSER',disarm:'DISABLE DEFUSER'})[it.kind]}`;
   else if(charges)hint='<kbd>X</kbd> DETONATE CHARGES';else if(P.cur===3&&P.op.gad==='scan')hint='HOLD <kbd>LMB</kbd> SCAN FOR HEARTBEATS';else if(P.cur===3)hint='<kbd>LMB</kbd> DEPLOY '+X.GAD[P.op.gad].n;
   else if(G.phase==='prep'&&my==='atk')hint='<kbd>5</kbd> BACK TO DRONE';}
  else if(G.view==='drone')hint='<kbd>WASD</kbd> DRIVE · <kbd>SPACE</kbd> HOP · <kbd>LMB</kbd> PING · <kbd>5</kbd> EXIT';else if(G.view==='cam')hint='<kbd>A</kbd>/<kbd>D</kbd> SWITCH · <kbd>LMB</kbd> PING · <kbd>5</kbd> EXIT';
  this.html($('hint'),hint,'hint');
  // drone / cam overlay
  const vo=$('viewov');if(G.view==='drone'||G.view==='cam'){vo.hidden=false;let t,stat=0;if(G.view==='drone'){const d=P.drone;t='DRONE · '+(d?this.X.L.callout(d.pos.x,d.pos.z,d.pos.y):'');stat=d&&d.jammed?1:0;if(stat)t+=' · SIGNAL JAMMED';}else{const c=this.C.GX.cams[G.camI];t='CAM '+(G.camI+1)+' · '+(c?c.n:'');stat=c&&c.dis>0?1:0;if(stat)t+=' · EMP DISRUPTED';}
   this.set($('vot'),t,'vot');vo.classList.toggle('stat',!!stat);vo.classList.toggle('cam',G.view==='cam');}else vo.hidden=true;
  // location
  const lp=G.view==='drone'&&P.drone?P.drone.pos:P.pos;this.set($('loc'),this.X.L.callout(lp.x,lp.z,lp.y),'loc');
  // spectate
  $('spec').hidden=P.alive||!G.spec||G.phase==='end';if(!P.alive&&G.spec)this.set($('specn'),G.spec.name+' · '+(G.spec.op?G.spec.op.n:''),'spn');
  if((this.mmT-=dt)<=0){this.mmT=.1;this.drawMini();}this.marksUpdate();
  if(this.boardOn&&(this.bdT=(this.bdT||0)-dt)<=0){this.bdT=.5;this.drawBoard();}}}
