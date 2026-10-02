// BREACH POINT — DOM HUD: score bar, vitals, ammo, money, dynamic crosshair, hitmarkers, damage arcs, kill feed,
// minimap with callouts, buy menu with spray previews, scoreboard, banners, spectator + death cards.
import {CS} from './maps.js';
const $=id=>document.getElementById(id);
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
export class HUD{
 constructor(G,X){this.G=G;this.X=X;this.buyOpen=false;this.boardOn=false;this.c={};this.banT=0;this.hitT=0;this.toastT=0;this.cashT=0;this.arcs=[];this.flashK=0;this.boardT=0;
  this.mini=$('mini');this.mx=this.mini.getContext('2d');this.buildBuy();
  const arcs=$('dmgind');for(let i=0;i<6;i++){const d=document.createElement('i');arcs.appendChild(d);this.arcs.push({el:d,t:0,ang:0});}}
 show(on){$('hud').hidden=!on;if(!on){$('flashov').style.opacity=0;$('smokeov').style.opacity=0;$('hurtov').style.opacity=0;$('scope').hidden=true;}}
 set(el,v,k){if(this.c[k]!==v){this.c[k]=v;el.textContent=v;}}
 html(el,v,k){if(this.c[k]!==v){this.c[k]=v;el.innerHTML=v;}}
 roundStart(){$('dead').hidden=true;$('spec').hidden=true;this.flashK=0;$('flashov').style.opacity=0;}
 banner(t,s,col,dur){$('bt').textContent=t;$('bt').style.color=col;$('bs').textContent=s;$('bs').style.display=s?'':'none';$('banner').classList.add('on');this.banT=dur;}
 toast(m){if(!m)return;$('toast').textContent=m;$('toast').classList.add('on');this.toastT=2;}
 cash(d,why){const el=$('cashd');el.textContent=(d>0?'+$':'-$')+Math.abs(d)+'  '+why;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');}
 clearFeed(){$('feed').innerHTML='';$('radio').innerHTML='';}
 radio(n,t){const d=document.createElement('div');d.innerHTML=`<b>${n}</b> ${t}`;$('radio').append(d);setTimeout(()=>d.remove(),4500);while($('radio').children.length>3)$('radio').firstChild.remove();}
 feed(e){const G=this.G,S=this.X.SIDE;const d=document.createElement('div');if(e.me)d.className='me';
  d.innerHTML=`${e.k?`<b style="color:${S[e.ks].css}">${e.k}</b>`:''}<i>${e.w}${e.hs?' <em>◉</em>':''}${e.wb?' <em>⫽</em>':''}</i><b style="color:${S[e.vs].css}">${e.v}</b>`;$('feed').prepend(d);setTimeout(()=>d.remove(),6500);while($('feed').children.length>6)$('feed').lastChild.remove();}
 hitmark(kind,kill){const h=$('hit');h.className=kind+(kill?' kill':'');h.style.opacity=1;this.hitT=kill?.45:.22;}
 hurt(ang,yaw,dmg){const a=this.arcs.find(x=>x.t<=0)||this.arcs[0];a.t=1.4;a.ang=ang;a.el.style.opacity=Math.min(1,.4+dmg/40);$('hurtov').style.opacity=Math.min(.75,dmg/60);}
 flash(k){this.flashK=Math.max(this.flashK,k);}
 died(k,w,hs){const X=this.X;$('dead').hidden=false;$('deadby').innerHTML=k?`ELIMINATED BY <b>${k.name}</b> · ${X.WPN[w]?X.WPN[w].name:X.NADE[w]?X.NADE[w].name:'CHARGE'}${hs?' · HEADSHOT':''} · ${k.hp>0?k.hp+' HP LEFT':''}`:'ELIMINATED';setTimeout(()=>{$('dead').hidden=true;},3200);}

 /* ---------------- per-frame ---------------- */
 update(dt){const G=this.G,X=this.X,S=X.SIDE;if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}
  if(this.toastT>0){this.toastT-=dt;if(this.toastT<=0)$('toast').classList.remove('on');}
  if(G.app!=='match'&&G.app!=='paused')return;const P=G.player;if(!P)return;const my=G.side(P),en=my==='atk'?'def':'atk';
  // score bar
  this.set($('scL'),G.score[0],'sl');this.set($('scR'),G.score[1],'sr');this.set($('tL'),S[my].s,'tl');this.set($('tR'),S[en].s,'tr');$('top').style.setProperty('--cl',S[my].css);$('top').style.setProperty('--cr',S[en].css);
  const pips=s=>G.agents.filter(a=>G.side(a)===s).map(a=>`<i class="${a.alive?'on':''}${a===P?' me':''}"></i>`).join('');this.html($('alL'),pips(my),'pl');this.html($('alR'),pips(en),'pr');
  let clk,lab='';if(G.phase==='freeze'){clk=fmt(G.freezeT);lab='BUY PHASE';}else if(G.phase==='live'){clk=fmt(G.timer);lab='ROUND '+(G.round+1)+(G.ot?' · OT':'');}else if(G.phase==='planted'){clk='◆';lab='CHARGE PLANTED';}else{clk=fmt(G.endT);lab='ROUND OVER';}
  this.set($('clock'),clk,'clk');this.set($('phase'),lab,'ph');$('clock').classList.toggle('bomb',G.phase==='planted');$('clock').classList.toggle('low',G.phase==='live'&&G.timer<=15);
  if(G.phase==='planted')$('clock').style.opacity=.55+.45*Math.abs(Math.sin(G.time*(G.bomb.fuse<10?9:4)));else $('clock').style.opacity=1;
  // vitals + money + weapon
  const Q=P.alive||!G.spec?P:G.spec;
  this.set($('hp'),Math.max(0,Math.ceil(Q.hp)),'hp');this.set($('ar'),Math.ceil(Q.armor),'ar');$('vitals').classList.toggle('low',Q.hp<=25);$('helm').style.display=Q.helmet&&Q.armor>0?'':'none';$('kit').style.display=Q.kit?'':'none';
  this.set($('cash'),'$'+P.money,'cash');
  const g=Q.gun();let nm='',am,rs;if(Q.cur===4){nm=X.NADE[Q.nadeSel].name;am=Q.nades[Q.nadeSel];rs='';}else if(Q.cur===5){nm='BREACH CHARGE';am='';rs=G.L.site(Q.pos.x,Q.pos.z)?'HOLD E ON SITE':'FIND A SITE';}else if(g){nm=Q===P?'':g.def.name;am=g.def.mag?g.mag:'';rs=g.def.mag?'/ '+g.res:'';}
  this.set($('wname'),nm||'','wn');this.set($('amag'),am,'am');this.set($('ares'),rs,'ar2');$('amag').classList.toggle('low',g&&g.def.mag&&g.mag<=Math.ceil(g.def.mag*.2));
  const sl=[[1,P.slots[1]?P.slots[1].def.name:''],[2,P.slots[2]?P.slots[2].def.name:''],[3,'KNIFE'],[4,X.NADE_ORDER.filter(k=>P.nades[k]>0).map(k=>({frag:'FR',smoke:'SM',flash:'FL',inc:'IN'}[k]+(P.nades[k]>1?'×'+P.nades[k]:''))).join(' ')],[5,P.hasBomb?'CHARGE':'']];
  $('slots').style.display=P.alive?'':'none';$('money').style.visibility=P.alive||G.phase==='freeze'?'':'hidden';
  this.html($('slots'),sl.filter(s=>s[1]).map(s=>`<span class="${P.cur===s[0]?'on':''}${s[0]===5?' bomb':''}"><kbd>${s[0]}</kbd>${s[1]}</span>`).join(''),'slots');
  // crosshair spread
  const inacc=G.inaccuracy(P),h=innerHeight,f=h/(2*Math.tan(36*Math.PI/180));const gap=Math.round(4+Math.tan(inacc)*f*.9);$('cross').style.setProperty('--g',Math.min(70,gap)+'px');$('cross').style.display=P.alive&&!(P.zoom>0)&&P.cur!==5?'':'none';
  if(this.hitT>0){this.hitT-=dt;if(this.hitT<=0)$('hit').style.opacity=0;}
  for(const a of this.arcs){if(a.t>0){a.t-=dt;const rel=a.ang-(P.yaw+Math.PI);a.el.style.transform=`rotate(${-rel*180/Math.PI}deg)`;if(a.t<=0)a.el.style.opacity=0;else if(a.t<.6)a.el.style.opacity=a.t/.6;}}
  const ho=$('hurtov');ho.style.opacity=Math.max(0,(+ho.style.opacity||0)-dt*1.2);
  // flash + smoke overlays
  const bl=P.alive?Math.min(1,P.blind/1.6):0;this.flashK=Math.max(0,Math.min(this.flashK,1));$('flashov').style.opacity=Math.max(bl,0);
  const sm=G.fx?G.fx.inSmoke(G.player.alive?P.pos.x:0,P.pos.y+P.eye,P.pos.z):0;$('smokeov').style.opacity=P.alive?Math.min(.97,sm*1.1):0;
  // progress
  let prog=null;if(P.planting)prog=['PLANTING CHARGE',P.plantT/3];else if(P.defusing)prog=[(P.kit?'DEFUSING · KIT':'DEFUSING'),P.defuseT/(P.kit?5:10)];
  $('prog').hidden=!prog;if(prog){this.set($('progt'),prog[0],'pt');$('progb').style.width=(prog[1]*100).toFixed(1)+'%';}
  // hints
  let hint='';if(P.alive){if(P.hasBomb&&G.L.site(P.pos.x,P.pos.z)&&G.phase==='live'&&!P.planting)hint='HOLD <kbd>E</kbd> TO PLANT THE CHARGE';else if(my==='def'&&G.bomb.state==='planted'&&P.pos.distanceTo(G.bomb.pos)<1.7&&!P.defusing)hint='HOLD <kbd>E</kbd> TO DEFUSE'+(P.kit?'':' · NO KIT (10 s)');
   else if(G.canBuy(P)&&!this.buyOpen)hint='<kbd>B</kbd> BUY MENU';else{const d=G.drops.find(d=>!d.bomb&&Math.hypot(d.pos.x-P.pos.x,d.pos.z-P.pos.z)<1.8);if(d)hint=`<kbd>E</kbd> PICK UP ${d.gun.def.name}`;}}
  this.html($('hint'),hint,'hint');
  // spectator
  $('spec').hidden=P.alive||!G.spec;if(!P.alive&&G.spec){this.html($('specn'),`<b style="color:${S[G.side(G.spec)].css}">${G.spec.name}</b> · ${Math.ceil(G.spec.hp)} HP · ${G.spec.gun()?G.spec.gun().def.name:''}`,'spn');}
  this.set($('loc'),G.L.callout(P.alive?P.pos.x:(G.spec||P).pos.x,P.alive?P.pos.z:(G.spec||P).pos.z),'loc');
  this.drawMini();
  if(this.buyOpen){if(!G.canBuy(P)){this.closeBuy();}else{this.set($('buycash'),'$'+P.money,'bc');this.set($('buytime'),G.phase==='freeze'?'BUY TIME '+fmt(G.freezeT+X.BUY_WINDOW):'BUY TIME '+fmt(X.BUY_WINDOW-(X.ROUND_T-G.timer)),'bt');}}
  if(this.boardOn&&(this.boardT-=dt)<=0){this.boardT=.25;this.renderBoard();}}

 /* ---------------- minimap ---------------- */
 buildMini(L){this.L=L;const W=L.W*CS,H=L.H*CS,size=480;const s=this.ms=Math.min((size-16)/W,(size-16)/H);this.mox=(size-W*s)/2;this.moy=(size-H*s)/2;
  const bg=document.createElement('canvas');bg.width=bg.height=size;const x=bg.getContext('2d');const noon=L.def.mood==='noon';
  const col={'#':null,'%':null,'*':null,'@':null,'.':noon?'#a48a63':'#4a525c',',':noon?'#97805e':'#454c55',';':noon?'#9b8259':'#4f5458',a:noon?'#b8925a':'#5f5a46',b:noon?'#b8925a':'#5f5a46',K:'#3d5a78',T:'#7a4a2c',t:noon?'#6e5a40':'#353b42',u:'#565c62',d:noon?'#8a7350':'#4a5058',r:noon?'#b49a70':'#5c636c','1':noon?'#b49a70':'#5c636c','2':noon?'#c0a67a':'#666d76','3':noon?'#c8ae82':'#707780','~':'#1d3a4a',c:'#6a5232',C:'#5a4428',o:'#4a4e56',L:noon?'#8a7558':'#5a6068',k:'#7a3a2a','|':'#3a3028','-':'#3a3028'};
  x.fillStyle='rgba(10,12,16,.0)';x.fillRect(0,0,size,size);
  for(let r=0;r<L.H;r++)for(let c=0;c<L.W;c++){const ch=L.g[r][c];const cc=col[ch];if(!cc)continue;x.fillStyle=cc;x.fillRect(this.mox+c*CS*s,this.moy+r*CS*s,CS*s+.6,CS*s+.6);}
  // walls outline glow
  x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=1.5;for(let r=1;r<L.H-1;r++)for(let c=1;c<L.W-1;c++){const ch=L.g[r][c];if(col[ch]!==null&&col[ch]!==undefined)continue;for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=L.g[r+dr][c+dc];if(col[n]){x.beginPath();const X0=this.mox+c*CS*s,Y0=this.moy+r*CS*s,k=CS*s;if(dc===1){x.moveTo(X0+k,Y0);x.lineTo(X0+k,Y0+k);}if(dc===-1){x.moveTo(X0,Y0);x.lineTo(X0,Y0+k);}if(dr===1){x.moveTo(X0,Y0+k);x.lineTo(X0+k,Y0+k);}if(dr===-1){x.moveTo(X0,Y0);x.lineTo(X0+k,Y0);}x.stroke();}}}
  // site letters + callouts
  x.textAlign='center';x.textBaseline='middle';for(const sname of['A','B']){const p=L.def.sites[sname].c;x.font='bold 54px Anton, Impact, sans-serif';x.fillStyle=noon?'rgba(140,30,15,.55)':'rgba(240,180,40,.5)';x.fillText(sname,this.mox+(p[0]+.5)*CS*s,this.moy+(p[1]+.5)*CS*s);}
  x.font='700 19px "JetBrains Mono", monospace';for(const[n,c,r]of L.def.callouts){if(n==='A SITE'||n==='B SITE')continue;const px=this.mox+(c+.5)*CS*s,py=this.moy+(r+.5)*CS*s;x.fillStyle='rgba(0,0,0,.55)';x.fillText(n,px+1,py+1);x.fillStyle='rgba(255,255,255,.78)';x.fillText(n,px,py);}
  this.mbg=bg;}
 drawMini(){const G=this.G,L=this.L,x=this.mx,s=this.ms,S=this.X.SIDE;if(!L)return;const P=G.player,my=G.side(P);x.clearRect(0,0,480,480);x.drawImage(this.mbg,0,0);
  const M=(px,pz)=>[this.mox+(px+L.hw)*s,this.moy+(pz+L.hh)*s];
  // smokes / fires
  for(const c of G.fx.clouds){const[a,b]=M(c.x,c.z);x.fillStyle='rgba(220,224,230,.55)';x.beginPath();x.arc(a,b,Math.max(2,c.r*s),0,7);x.fill();}
  for(const f of G.fx.fires){const[a,b]=M(f.x,f.z);x.fillStyle='rgba(255,110,30,.55)';x.beginPath();x.arc(a,b,f.r*s,0,7);x.fill();}
  for(const a of G.agents){const side=G.side(a);const ally=side===my;if(!ally&&!(a.alive&&G.time-(a.spotT[my]||-9)<1.6))continue;const[px,py]=M(a.pos.x,a.pos.z);
   if(!a.alive){if(ally){x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=2.5;x.beginPath();x.moveTo(px-5,py-5);x.lineTo(px+5,py+5);x.moveTo(px+5,py-5);x.lineTo(px-5,py+5);x.stroke();}continue;}
   x.save();x.translate(px,py);x.rotate(-a.yaw);x.fillStyle=ally?S[side].css:'#ff3030';x.beginPath();if(a===P){x.moveTo(0,-13);x.lineTo(8,8);x.lineTo(0,4);x.lineTo(-8,8);x.closePath();x.fill();x.strokeStyle='#fff';x.lineWidth=2;x.stroke();}else{x.arc(0,0,7,0,7);x.fill();x.fillRect(-1.5,-14,3,8);}
   x.restore();if(a.hasBomb&&ally){x.fillStyle='#ffd040';x.fillRect(px-4,py+8,8,5);}}
  const b=G.bomb;if(b.state==='dropped'&&my==='atk'||b.state==='planted'){const[px,py]=M(b.pos.x,b.pos.z);const on=b.state==='dropped'||(G.time%.6)<.3;if(on){x.fillStyle=b.state==='planted'?'#ff3a1a':'#ffd040';x.fillRect(px-7,py-5,14,10);x.strokeStyle='#000';x.lineWidth=1.5;x.strokeRect(px-7,py-5,14,10);}}}

 /* ---------------- buy menu ---------------- */
 buildBuy(){const X=this.X,el=$('buylist');const SHOP=[['PISTOLS',['kestrel','wasp','hawk']],['SMG · HEAVY',['mako','bulwark']],['RIFLES',['lynx','vanta','sentry','longbow']],['GEAR',['vest','helm','kit']],['GRENADES',['frag','smoke','flash','inc']]];
  el.innerHTML=SHOP.map(([cat,items])=>`<div class="cat"><h4>${cat}</h4>${items.map(id=>{const w=X.WPN[id],n=X.NADE[id],g=X.GEAR[id];const name=(w||n||g).name;let sub='';
   if(w)sub=`${w.pellets?w.pellets+'×':''}${w.dmg} DMG · ${Math.round(60/w.rate)} RPM · ${w.mag} RD · KILL $${w.kill}`;else if(n)sub={frag:'Lethal blast · 9 m',smoke:'18 s cloud · blocks vision',flash:'Blinds anyone facing it',inc:'7 s fire · area denial'}[id];else sub={vest:'100 armour · body',helm:'100 armour + headshot protection',kit:'Defuse in 5 s instead of 10'}[id];
   const tag=w&&w.side?`<em class="${w.side}">${w.side==='atk'?'ATTACK':'DEFENCE'}</em>`:g&&g.side?'<em class="def">DEFENCE</em>':'';return`<button data-id="${id}"><b>${name}${tag}</b><span>${sub}</span><i data-p="${id}">$${(w||n||g).price}</i></button>`;}).join('')}</div>`).join('');
  el.querySelectorAll('button').forEach(b=>{b.onclick=()=>{X.buy(b.dataset.id);this.refreshBuy();};b.onmouseenter=()=>this.preview(b.dataset.id);});
  $('autobuy').onclick=()=>{X.autobuy();this.refreshBuy();};$('buyclose').onclick=()=>{this.closeBuy();};}
 openBuy(){this.buyOpen=true;$('buy').hidden=false;this.refreshBuy();this.preview(this.G.player&&this.G.player.slots[1]?this.G.player.slots[1].id:'vanta');}
 closeBuy(){if(!this.buyOpen)return;this.buyOpen=false;$('buy').hidden=true;}
 refreshBuy(){const G=this.G,P=G.player,X=this.X;if(!P)return;const side=G.side(P);$('buy').dataset.side=side;
  $('buylist').querySelectorAll('button').forEach(b=>{const id=b.dataset.id;const w=X.WPN[id],g=X.GEAR[id],n=X.NADE[id];const sideLock=(w&&w.side&&w.side!==side)||(g&&g.side&&g.side!==side);const price=G.priceOf(P,id);
   const owned=(w&&P.slots[w.slot]&&P.slots[w.slot].id===id)||(id==='kit'&&P.kit)||(id==='vest'&&P.armor>=100)||(id==='helm'&&P.armor>=100&&P.helmet)||(n&&P.nades[id]>=n.max);
   b.querySelector('i').textContent=owned?'OWNED':'$'+price;b.classList.toggle('lock',!!sideLock);b.classList.toggle('poor',!owned&&P.money<price);b.classList.toggle('own',!!owned);b.style.display=sideLock?'none':'';});
  this.set($('buycash'),'$'+P.money,'bc');}
 preview(id){const w=this.X.WPN[id];const c=$('spray'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);const info=$('sprayi');
  if(!w||!w.pat){info.textContent=w?w.name:'';return;}info.innerHTML=`<b>${w.name}</b> SPRAY PATTERN · pull against it`;x.strokeStyle='rgba(255,255,255,.15)';x.beginPath();x.moveTo(c.width/2,0);x.lineTo(c.width/2,c.height);x.stroke();
  let px=0,py=0;const sc=7;const n=Math.min(w.mag,w.pat.length);const pts=[[0,0]];for(let i=0;i<n-1;i++){px+=w.pat[i][0];py+=w.pat[i][1];pts.push([px,py]);}const maxY=Math.max(...pts.map(p=>p[1]),1);const k=Math.min(sc,(c.height-20)/maxY);
  pts.forEach((p,i)=>{const X0=c.width/2+p[0]*k,Y0=c.height-10-p[1]*k;x.fillStyle=i===0?'#fff':`hsl(${20+i*4},100%,${60-i}%)`;x.beginPath();x.arc(X0,Y0,i===0?3.5:2.6,0,7);x.fill();});}

 /* ---------------- scoreboard ---------------- */
 board(on){this.boardOn=on;$('board').hidden=!on;if(on){this.boardT=0;this.renderBoard();}}
 renderBoard(){const G=this.G,S=this.X.SIDE,P=G.player;if(!P)return;const my=G.side(P);const rows=sq=>G.agents.filter(a=>a.squad===sq).sort((a,b)=>b.stats.score-a.stats.score).map(a=>{const side=G.side(a),ally=side===my;
   return`<tr class="${a.alive?'':'dead'}${a===P?' me':''}"><td><i style="background:${S[side].css}"></i>${a.name}${a.hasBomb&&ally?' <em class="bm">◆</em>':''}${a.kit&&ally?' <em class="kt">✚</em>':''}</td><td>${ally?'$'+a.money:''}</td><td>${a.stats.k}</td><td>${a.stats.a}</td><td>${a.stats.d}</td><td class="st">${'★'.repeat(Math.min(5,a.stats.mvp))}${a.stats.mvp>5?'+'+(a.stats.mvp-5):''}</td><td>${a.stats.score}</td></tr>`;}).join('');
  const hist=G.history.map(h=>`<i class="${h.squad===0?'w':'l'}" title="${h.reason}">${{elim:'✕',bomb:'✸',defuse:'✂',time:'◷'}[h.reason]}</i>`).join('');
  const head='<tr><th>OPERATOR</th><th>$</th><th>K</th><th>A</th><th>D</th><th>MVP</th><th>SCORE</th></tr>';
  $('board').innerHTML=`<div class="bh"><b style="color:${S[my].css}">${S[my].n} ${G.score[0]}</b><span>${this.L.def.name} · ROUND ${G.round+(G.phase==='end'?0:1)} · FIRST TO ${G.target}<br>MATCH CLOCK ${fmt(G.matchT)} / ${fmt(G.limit)}</span><b style="color:${S[my==='atk'?'def':'atk'].css}">${G.score[1]} ${S[my==='atk'?'def':'atk'].n}</b></div><div class="hist">${hist}</div><table>${head}${rows(0)}</table><table class="en">${head}${rows(1)}</table>`;}
}
