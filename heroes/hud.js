// ZENITH PROTOCOL — HUD: objective panel (payload track with checkpoints / control point percentages, clock, overtime), team rosters
// with portraits, health bar, ability + ultimate cooldowns, ammo, crosshair, hit markers, damage arcs, projected ally/enemy bars,
// revealed-enemy markers, objective markers, kill feed, banners, death screen and the Tab scoreboard.
import * as THREE from '../vendor/three.module.min.js';
import {V,fmt,cl} from './util.js';
import {WPN} from './weapons.js';
import {HEROES,ROLES,ORDER} from './heroes.js';

const $=id=>document.getElementById(id);
export const TEAMS=[{n:'HALCYON',css:'#4aa8ff',suit:0x1d3e78,glow:[.35,.95,3.2]},{n:'VERMILION',css:'#ff4a3a',suit:0x7a1c22,glow:[3.2,.55,.35]}];
// 24x24 ability glyphs
export const ICON={barrier:'M3 4h18v14l-9 4-9-4z M6 7v9l6 3 6-3V7z',charge:'M2 12l8-7v4h12v6H10v4z',slam:'M12 2l2 7h7l-6 4 2 8-5-5-5 5 2-8-6-4h7z',dome:'M2 18a10 10 0 0 1 20 0z M5 18a7 7 0 0 1 14 0z',
 leap:'M3 21c2-9 8-15 16-16l-3-3h6v6l-3-3C13 7 8 12 6 21z',well:'M12 3a9 9 0 1 0 .1 0z M12 7a5 5 0 1 0 .1 0z M12 10a2 2 0 1 0 .1 0z',blink:'M2 10h10V5l9 7-9 7v-5H2z M2 6h4v2H2z M2 16h4v2H2z',
 shock:'M13 2L4 14h6l-2 8 10-13h-6l3-7z',volley:'M4 20l6-6 M10 20l6-6 M16 20l6-6 M8 12l4-8 4 8z',hook:'M11 2h2v12a4 4 0 1 1-6 3h2a2 2 0 1 0 2-2z M8 5l4-3 4 3z',
 scan:'M12 4a8 8 0 1 0 .1 0z M12 8a4 4 0 1 0 .1 0z M12 11a1 1 0 1 0 .1 0z',mark:'M11 1h2v6h-2z M11 17h2v6h-2z M1 11h6v2H1z M17 11h6v2h-6z M12 6a6 6 0 1 0 .1 0z',
 jet:'M12 2l6 10h-4v4h-4v-4H6z M8 18h8l-4 5z',firewall:'M3 20h18v2H3z M5 19c0-5 4-6 3-11 4 2 5 6 4 9 1-2 3-3 3-6 3 3 4 6 3 8z',meteor:'M14 2l8 8-4 1-3 3a6 6 0 1 1-6-6l3-3z',
 gdash:'M12 3l3 6 6 1-4 4 1 7-6-3-6 3 1-7-4-4 6-1z',sanct:'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',revive:'M12 2l2 6 6-3-3 6 6 2-6 2 3 6-6-3-2 6-2-6-6 3 3-6-6-2 6-2-3-6 6 3z',
 tempo:'M9 3h12v4H13v11a3 3 0 1 1-4-3z',bionade:'M12 5a8 8 0 1 0 .1 0z M10 1h4v4h-4z M7 13h10M12 8v10',amp:'M3 9h4l5-5v16l-5-5H3z M15 8a5 5 0 0 1 0 8 M18 5a9 9 0 0 1 0 14'};
export const svgIcon=(id,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24"><path d="${ICON[id]||ICON.barrier}" fill="currentColor" fill-rule="evenodd"/></svg>`;

export class HUD{
 constructor(G){this.G=G;this.c={};this.el={};for(const k of['obj','rA','rB','feed','tags','cross','hitm','banner','prompt','cd','hpFill','hpN','hpM','mePor','meName','meRole','ab1','ab2','ult','ultP','ultRing','mag','magM','wname','rl','dead','killer','kwpn','rsp','swap','board','dmg','scope','vig','flash','meBuffs'])this.el[k]=$(k);
  this.tagPool=[];this.hitT=0;this.banT=0;this.flashV=0;this.vigV=0;this.prm='';this.dmgSeen=new Map();}
 set(el,k,v,prop='textContent'){if(this.c[k]!==v){this.c[k]=v;el[prop]=v;}}
 reset(){const G=this.G,E=this.el;E.feed.innerHTML='';E.dmg.innerHTML='';this.c={};E.dead.hidden=true;E.board.hidden=true;this.dmgSeen.clear();
  if(G.mode==='payload'){const att=G.attTeam===G.me.team;const cps=G.D.cps.map(s=>`<i class="cpm" style="left:${(s/G.pl.total*100).toFixed(1)}%"></i>`).join('');
   E.obj.className='pl '+(att?'att':'def');E.obj.innerHTML=`<div class="side">${att?'ATTACK':'DEFEND'}<small>${att?'ESCORT THE CARGO CORE':'STOP THE CARGO CORE'}</small></div><div class="clk"><b id="clock">0:00</b><span id="ot">OVERTIME</span></div>
    <div class="trk"><div class="fill" id="plFill"></div>${cps}<i class="cpm end" style="left:100%"></i><div class="cart" id="plCart"><em></em></div></div><div class="pst" id="plSt"></div>`;}
  else E.obj.innerHTML=`<div class="cpt"><div class="tm a"><b id="pA">0%</b><i>${TEAMS[G.me.team].n}</i></div><div class="ring" id="cpRing"><svg viewBox="0 0 60 60"><circle class="bg" cx="30" cy="30" r="25"/><circle class="fg" id="cpArc" cx="30" cy="30" r="25"/></svg><b id="cpL">A</b></div><div class="tm b"><b id="pB">0%</b><i>${TEAMS[1-G.me.team].n}</i></div></div><div class="clk"><b id="clock">0:00</b><span id="ot">OVERTIME</span></div><div class="pst" id="plSt"></div>`,E.obj.className='cp';
  const chip=f=>`<div class="chip ${f===G.me?'me':''}" data-i="${G.fighters.indexOf(f)}"><img src="${G.portraits[f.hero]||''}"><s></s><b></b></div>`;
  E.rA.innerHTML=G.fighters.filter(f=>f.team===G.me.team).map(chip).join('');E.rB.innerHTML=G.fighters.filter(f=>f.team!==G.me.team).map(chip).join('');this.meHero='';}
 feed(k,v,w,crit,mine){const d=document.createElement('div');const nm=f=>`<span style="color:${TEAMS[f.team].css}"><img src="${this.G.portraits[f.hero]||''}">${f.name}</span>`;
  d.innerHTML=(k&&k!==v?nm(k)+`<span class="w">${w}${crit?' <span class="hs">◉</span>':''}</span>`:`<span class="w">${w}</span>`)+nm(v);if(mine)d.className='me';
  this.el.feed.prepend(d);setTimeout(()=>d.remove(),5200);while(this.el.feed.children.length>6)this.el.feed.lastChild.remove();}
 sys(t,col){const d=document.createElement('div');d.innerHTML=`<span class="w" style="margin:0;color:${col||''}">${t}</span>`;this.el.feed.prepend(d);setTimeout(()=>d.remove(),4200);}
 banner(t,s,col='#ffd23f',dur=2.2){const e=this.el.banner;e.querySelector('b').textContent=t;e.querySelector('b').style.color=col;e.querySelector('span').textContent=s||'';e.querySelector('span').style.display=s?'':'none';e.classList.add('on');this.banT=dur;}
 hit(kind){this.el.hitm.className=kind||'';this.hitT=kind==='k'?.45:.2;}
 damageFrom(ang){const i=document.createElement('i');i.style.transform=`rotate(${ang}rad)`;this.el.dmg.appendChild(i);setTimeout(()=>i.remove(),1100);while(this.el.dmg.children.length>6)this.el.dmg.firstChild.remove();}
 flash(v=.7){this.flashV=Math.max(this.flashV,v);}
 prompt(html){if(this.prm!==html){this.prm=html;this.el.prompt.innerHTML=html;this.el.prompt.classList.toggle('on',!!html);}}
 _tag(i){let e=this.tagPool[i];if(!e){e=document.createElement('div');this.el.tags.appendChild(e);this.tagPool[i]=e;}return e;}
 update(dt,cam){const G=this.G,me=G.me,E=this.el;if(!me)return;const H=HEROES[me.hero];
  this.hitT-=dt;E.hitm.style.opacity=this.hitT>0?Math.min(1,this.hitT*6):0;if(this.banT>0){this.banT-=dt;if(this.banT<=0)E.banner.classList.remove('on');}
  this.flashV=Math.max(0,this.flashV-dt*2.5);E.flash.style.opacity=this.flashV;
  // objective
  const ck=$('clock');if(ck){this.set(ck,'clk',fmt(G.clock));ck.style.color=G.clock<=30?'#ff5a3a':'';}const ot=$('ot');if(ot)ot.style.opacity=G.ot?(.6+Math.sin(G.time*10)*.4):0;
  if(G.mode==='payload'){const P=G.pl;$('plFill').style.width=(P.s/P.total*100).toFixed(2)+'%';$('plCart').style.left=(P.s/P.total*100).toFixed(2)+'%';
   const st=P.contested?'<b style="color:#ffd23f">CONTESTED</b>':P.att>0?`<b style="color:${TEAMS[G.attTeam].css}">${'›'.repeat(Math.min(3,P.att))} PUSHING</b>`:P.back?'<b style="color:#ff8a5a">ROLLING BACK</b>':`<span>${G.phase==='countdown'?'SETUP':'IDLE'}</span>`;this.set($('plSt'),'pst',st,'innerHTML');
   $('plCart').className='cart'+(P.contested?' con':P.att>0?' mv':'');}
  else{const Cp=G.cpt,mt=me.team;this.set($('pA'),'pa',Math.floor(Cp.pct[mt])+'%');this.set($('pB'),'pb',Math.floor(Cp.pct[1-mt])+'%');const arc=$('cpArc');const prog=Cp.capT>=0?Cp.prog:0;arc.style.strokeDasharray=(prog*157).toFixed(1)+' 200';arc.style.stroke=Cp.capT>=0?TEAMS[Cp.capT].css:'#fff';
   $('cpRing').style.color=Cp.owner<0?'#fff':TEAMS[Cp.owner].css;const st=Cp.locked>0?`<span>POINT UNLOCKS IN ${Math.ceil(Cp.locked)}</span>`:Cp.contested?'<b style="color:#ffd23f">CONTESTED</b>':Cp.capT>=0?`<b style="color:${TEAMS[Cp.capT].css}">CAPTURING</b>`:Cp.owner>=0?`<b style="color:${TEAMS[Cp.owner].css}">${Cp.owner===mt?'HOLDING':'ENEMY CONTROL'}</b>`:'<span>NEUTRAL</span>';this.set($('plSt'),'pst',st,'innerHTML');}
  // countdown
  const cd=G.phase==='countdown'?String(Math.max(1,Math.ceil(G.cdT))):(G.phase==='play'&&G.goT>0?'FIGHT':'');this.set(E.cd,'cd',cd);E.cd.style.opacity=cd?(cd==='FIGHT'?Math.min(1,G.goT*2):1):0;
  // rosters
  for(const box of[E.rA,E.rB])for(const ch of box.children){const f=G.fighters[+ch.dataset.i];if(!f)continue;ch.classList.toggle('dead',!f.alive);ch.children[1].style.width=(f.alive?f.hp/f.maxHp*100:0)+'%';const t=f.alive?(f.ult>=HEROES[f.hero].ult.cost&&f.team===me.team?'◆':''):Math.ceil(f.respawnT);if(ch._t!==t){ch._t=t;ch.children[2].textContent=t;}}
  // me: portrait, health, abilities, ammo
  if(this.meHero!==me.hero){this.meHero=me.hero;E.mePor.src=G.portraits[me.hero]||'';E.meName.textContent=H.name;E.meRole.textContent=ROLES[H.role].n;E.meRole.style.color=ROLES[H.role].css;
   for(const[k,el]of[['a1',E.ab1],['a2',E.ab2]])el.querySelector('.ic').innerHTML=svgIcon(H[k].id),el.querySelector('.nm').textContent=H[k].name;E.ult.querySelector('.ic').innerHTML=svgIcon(H.ult.id);}
  const hpF=me.hp/me.maxHp;E.hpFill.style.width=(cl(hpF,0,1)*100).toFixed(1)+'%';E.hpFill.parentNode.style.setProperty('--seg',(100/(me.maxHp/25)).toFixed(3)+'%');E.hpFill.parentNode.classList.toggle('low',hpF<.35);this.set(E.hpN,'hpn',String(Math.ceil(me.hp)));this.set(E.hpM,'hpm','/ '+me.maxHp);
  let bf='';if(me.ampT>0)bf+='<span style="color:#ffd23f">AMPLIFIED</span>';if(me.speedT>0)bf+='<span style="color:#60ffb0">UPTEMPO</span>';if(me.markT>0)bf+='<span style="color:#e08aff">HUNTING</span>';if(me.stunT>0)bf+='<span style="color:#fff">STUNNED</span>';if(me.revealT>0)bf+='<span style="color:#ff6a5a">REVEALED</span>';if(me.burnT>0)bf+='<span style="color:#ff8a30">BURNING</span>';this.set(E.meBuffs,'bf',bf,'innerHTML');
  for(const[k,el]of[['a1',E.ab1],['a2',E.ab2]]){const cdv=me.cd[k],max=H[k].cd;el.classList.toggle('cool',cdv>0);el.style.setProperty('--p',(cdv>0?cdv/max*100:0).toFixed(1)+'%');this.set(el.querySelector('.cdn'),'cd'+k,cdv>0?(cdv<1?cdv.toFixed(1):String(Math.ceil(cdv))):'');}
  const up=me.ult/H.ult.cost;const rdy=up>=1;E.ult.classList.toggle('rdy',rdy);E.ult.classList.toggle('on',me.ultOn>0);E.ultRing.style.strokeDasharray=(cl(up,0,1)*264).toFixed(1)+' 300';this.set(E.ultP,'ultp',rdy?'READY':Math.floor(up*100)+'%');
  const wd=WPN[H.wpn];this.set(E.wname,'wn',wd.name);if(wd.mag){this.set(E.mag,'mag',String(me.mag));E.mag.classList.toggle('low',me.mag<=Math.max(1,wd.mag*.25));this.set(E.magM,'magm','/ '+wd.mag);}else{this.set(E.mag,'mag','∞');this.set(E.magM,'magm',me.beamOn?me.beamHeal?'HEALING':'DAMAGE':'BEAM');}
  E.rl.classList.toggle('on',me.reloadT>0);E.rl.firstChild.style.width=me.reloadT>0?(1-me.reloadT/wd.reload)*100+'%':'0';
  this.set(E.cross,'cc',H.wpn+(G.aimFoe?' foe':G.aimAlly?' ally':''),'className');const sp=wd.pel?wd.spr:me.spread;E.cross.style.setProperty('--s',Math.round(6+sp*innerHeight*1.1)+'px');
  if(wd.scope){E.cross.querySelector('circle').style.strokeDasharray=(me.chargeT/wd.charge*151).toFixed(1)+' 200';}
  E.scope.hidden=!(wd.scope&&me.zoom>.6&&me.alive);E.cross.style.display=E.scope.hidden?'':'none';E.cross.style.visibility=me.alive?'':'hidden';
  // hurt vignette
  const hurt=me.alive?cl((1-hpF)*1.1-.15,0,1):0;this.vigV+=(Math.max(hurt*.8,G.hurtFx)-this.vigV)*Math.min(1,dt*8);E.vig.style.opacity=this.vigV;
  // death screen
  E.dead.hidden=me.alive||G.phase!=='play';if(!me.alive){this.set(E.killer,'kl',me.killedBy?me.killedBy.name+' · '+HEROES[me.killedBy.hero].name:'THE ENVIRONMENT');this.set(E.kwpn,'kw',me.killedWith||'');this.set(E.rsp,'rsp','RESPAWN '+Math.max(0,Math.ceil(me.respawnT)));
   const sw=ORDER.map((id,i)=>`<span class="${(me.nextHero||me.hero)===id?'on':''}"><kbd>${i+1}</kbd>${HEROES[id].name}</span>`).join('');this.set(E.swap,'sw',sw,'innerHTML');}
  // world tags: ally bars, damaged/revealed enemies, objective marker
  let ti=0;const W=innerWidth,Hh=innerHeight,p=new V();const put=(pos,html,cls,col)=>{p.copy(pos).project(cam);if(p.z>1||p.z<-1)return false;const e=this._tag(ti++);e.style.display='';if(e._c!==cls){e._c=cls;e.className=cls;}if(e._h!==html){e._h=html;e.innerHTML=html;}e.style.color=col||'';
   e.style.transform=`translate(${(p.x*.5+.5)*W|0}px,${(-p.y*.5+.5)*Hh|0}px) translate(-50%,-100%)`;return true;};
  for(const f of G.fighters){if(f===me||!f.alive)continue;const ally=f.team===me.team;const hp=f.pos.clone();hp.y+=2.25*(HEROES[f.hero].look.height||1);
   const bar=`<s><em style="width:${(f.hp/f.maxHp*100).toFixed(0)}%"></em></s>`;
   if(ally)put(hp,`<b>${f.name}</b>${bar}`,'ally');else{const rev=G.revealedTo(f,me.team);const seen=this.dmgSeen.get(f);if(rev||seen&&G.time-seen<3||f===G.aimTarget)put(hp,(rev?'<i></i>':'')+bar,'foe'+(rev?' rev':''));}}
  const op=G.mode==='payload'?G.pl.pos:G.cpt.p;if(op){const q=op.clone();q.y+=G.mode==='payload'?4.2:3;const d=Math.round(op.distanceTo(me.pos));const col=G.mode==='payload'?(G.pl.contested?'#ffd23f':G.pl.att>0?TEAMS[G.attTeam].css:'#fff'):(G.cpt.owner<0?'#fff':TEAMS[G.cpt.owner].css);
   put(q,`<i></i>${G.mode==='payload'?'CORE':'POINT'}<span>${d}M</span>`,'obj',col);}
  for(let i=ti;i<this.tagPool.length;i++)if(this.tagPool[i].style.display!=='none')this.tagPool[i].style.display='none';}
 board(on){const G=this.G,e=this.el.board;e.hidden=!on;if(!on)return;const rows=t=>G.fighters.filter(f=>f.team===t).map(f=>`<tr class="${f===G.me?'me':''}${f.alive?'':' dead'}"><td><img src="${G.portraits[f.hero]||''}">${HEROES[f.hero].name}</td><td>${f.name}</td><td>${f.stats.elims}</td><td>${f.stats.assists}</td><td>${f.stats.deaths}</td><td>${Math.round(f.stats.dmg)}</td><td>${Math.round(f.stats.heal)}</td><td>${Math.round(f.stats.mit)}</td><td>${Math.floor(f.stats.obj)}s</td></tr>`).join('');
  const head='<tr><th>HERO</th><th>PLAYER</th><th>E</th><th>A</th><th>D</th><th>DMG</th><th>HEAL</th><th>MIT</th><th>OBJ</th></tr>';const mt=G.me.team;
  const html=`<h4>${G.modeName} · ${G.mapDef.name}</h4><table class="sb t${mt}"><caption style="color:${TEAMS[mt].css}">${TEAMS[mt].n}</caption>${head}${rows(mt)}</table><table class="sb t${1-mt}"><caption style="color:${TEAMS[1-mt].css}">${TEAMS[1-mt].n}</caption>${head}${rows(1-mt)}</table>`;if(e._h!==html){e._h=html;e.innerHTML=html;}}}
