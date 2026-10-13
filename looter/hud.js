// STARWARDEN — HUD: objective tracker, strike clock + power, boss bar (immune / exposed states), fireteam list, enemy health
// bars and elemental shield pips, damage numbers, abilities (super ring, grenade, melee), vitals, weapon stack, radar, loot toasts.
import * as THREE from '../vendor/three.module.min.js';
import {V,fmt,cl} from './util.js';
import {EL,RAR,ARCH} from './loot.js';
import {CLS} from './actors.js';

const $=id=>document.getElementById(id);
const ELC={kin:'#e9e4d8',solar:'#ff8a2a',arc:'#5fd8ff',void:'#b46bff'};
export class HUD{
 constructor(G){this.G=G;this.c={};this.el={objT:$('objT'),objP:$('objP'),objS:$('objS'),sn:$('strikeName'),clock:$('clock'),pl:$('pl'),boss:$('boss'),bossN:$('bossN'),bossP:$('bossP'),bossH:$('bossH'),bossD:$('bossD'),team:$('team'),tags:$('tags'),nums:$('nums'),
  cross:$('cross'),hitm:$('hitm'),banner:$('banner'),prompt:$('prompt'),toasts:$('toasts'),feed:$('feed'),sup:$('sup'),supC:$('supC'),supI:$('supI'),supN:$('supN'),abG:$('abG'),abM:$('abM'),abGn:$('abGn'),abMn:$('abMn'),
  shb:$('shb'),hpb:$('hpb'),wpns:$('wpns'),radar:$('radar'),down:$('down'),downT:$('downT'),downS:$('downS'),dmg:$('dmg'),scope:$('scope'),vig:$('vig'),flash:$('flash'),supfx:$('supfx')};
  this.rc=this.el.radar.getContext('2d');this.tagPool=[];this.numPool=[];this.hitT=0;this.banT=0;this.flashV=0;this.vigV=0;this.prm='';this.radarT=0;this.bossShow=1;}
 set(el,k,v,prop='textContent'){if(this.c[k]!==v){this.c[k]=v;el[prop]=v;}}
 reset(){const G=this.G,E=this.el;E.feed.innerHTML='';E.toasts.innerHTML='';E.dmg.innerHTML='';this.c={};E.down.hidden=true;E.boss.hidden=true;const C=CLS[G.me.cls];
  E.sn.textContent=G.dest.strike+' · '+G.dest.name;document.documentElement.style.setProperty('--sc',ELC[C.el]);E.supI.textContent={strider:'ϟ',bulwark:'☀',seer:'◉'}[G.me.cls];E.supN.textContent=C.sup;E.abGn.textContent=C.gren;E.abMn.textContent=C.mel;
  E.team.innerHTML=G.team.map((f,i)=>`<div style="--c:${ELC[CLS[f.cls].el]}"><span>${f.name}</span><i id="tm${i}">${CLS[f.cls].n}</i><s><em id="tb${i}"></em></s></div>`).join('');
  E.wpns.innerHTML=[0,1,2].map(i=>`<div class="w" id="w${i}"><p><span id="wr${i}"></span><b id="wn${i}"></b></p><em id="wa${i}"></em></div>`).join('')+'<div class="rl" id="wrl"><em></em></div>';}
 feed(html){const d=document.createElement('div');d.innerHTML=html;this.el.feed.prepend(d);setTimeout(()=>d.remove(),4500);while(this.el.feed.children.length>5)this.el.feed.lastChild.remove();}
 toast(it,head){const d=document.createElement('div');d.style.setProperty('--rc',RAR[it.r].c);d.innerHTML=`<p>${head||RAR[it.r].n+' ENGRAM DECODED'}</p><b style="color:${RAR[it.r].c}">${it.n}</b><span>${EL[it.el].n} ${ARCH[it.a].n} · ✦ ${it.p}</span>`;
  this.el.toasts.appendChild(d);setTimeout(()=>d.remove(),5200);while(this.el.toasts.children.length>4)this.el.toasts.firstChild.remove();}
 banner(t,s,col='#f2c55c',dur=2.4){const e=this.el.banner;e.querySelector('b').textContent=t;e.querySelector('b').style.color=col;e.querySelector('span').textContent=s||'';e.querySelector('span').style.display=s?'':'none';e.classList.add('on');this.banT=dur;}
 hit(kind){this.el.hitm.className=kind||'';this.hitT=kind==='k'?.45:.2;}
 damageFrom(ang){const i=document.createElement('i');i.style.transform=`rotate(${ang}rad)`;this.el.dmg.appendChild(i);setTimeout(()=>i.remove(),1100);while(this.el.dmg.children.length>6)this.el.dmg.firstChild.remove();}
 flash(v=.6){this.flashV=Math.max(this.flashV,v);}
 prompt(html){if(this.prm!==html){this.prm=html;this.el.prompt.innerHTML=html;this.el.prompt.classList.toggle('on',!!html);}}
 _tag(i){let e=this.tagPool[i];if(!e){e=document.createElement('div');this.el.tags.appendChild(e);this.tagPool[i]=e;}return e;}
 update(dt,cam){const G=this.G,me=G.me,E=this.el;if(!me)return;const W=innerWidth,H=innerHeight;
  this.hitT-=dt;E.hitm.style.opacity=this.hitT>0?Math.min(1,this.hitT*6):0;if(this.banT>0){this.banT-=dt;if(this.banT<=0)E.banner.classList.remove('on');}
  this.flashV=Math.max(0,this.flashV-dt*2.5);E.flash.style.opacity=this.flashV;E.supfx.style.opacity=me.superT>0?.55:0;
  // objective + clock
  this.set(E.objT,'ot',G.objT||'');this.set(E.objS,'os',G.objS||'');E.objP.style.width=(G.objP==null?0:cl(G.objP,0,1)*100)+'%';E.objP.parentNode.style.opacity=G.objP==null?0:1;
  this.set(E.clock,'clk',fmt(G.clock));E.clock.style.color=G.clock<=60?'#ff5a3a':'';this.set(E.pl,'pl','✦ '+G.power+' · '+G.dif.n);
  // boss
  const b=G.boss;E.boss.hidden=!(b&&b.alive);if(b&&b.alive){this.set(E.bossN,'bn',b.name);this.set(E.bossP,'bp',b.immune?'IMMUNE · DESTROY THE ANCHORS':b.exposed?'VULNERABLE · '+Math.ceil(b.exposedT)+'s':'PHASE '+b.phase);
   const f=cl(b.hp/b.hpMax,0,1);E.bossH.style.width=f*100+'%';this.bossShow=Math.max(f,this.bossShow-dt*.25);E.bossD.style.width=this.bossShow*100+'%';E.boss.className=b.immune?'imm':b.exposed?'exp':'';}
  // fireteam
  G.team.forEach((f,i)=>{const e=$('tb'+i);if(!e)return;e.style.width=f.alive&&!f.downed?cl((f.health+f.shield)/(f.maxSh+100),0,1)*100+'%':'0';const st=$('tm'+i);const txt=!f.alive?'RESPAWN '+Math.ceil(f.respawnT):f.downed?'DOWN '+Math.ceil(f.bleedT):CLS[f.cls].n;this.set(st,'tm'+i,txt);st.className=f.downed||!f.alive?'dn':'';});
  // abilities
  const sk=cl(me.superK,0,1);E.supC.style.strokeDasharray=(sk*276.5).toFixed(1)+' 300';E.sup.classList.toggle('rdy',sk>=1);
  const ab=(e,v)=>{e.firstElementChild.style.height=(cl(v,0,1)*100)+'%';e.classList.toggle('rdy',v>=1);};ab(E.abG,1-me.nadeT/me.nadeMax);ab(E.abM,1-me.meleeCD2/me.meleeMax);
  // vitals
  E.shb.style.width=cl(me.shield/me.maxSh,0,1)*100+'%';E.hpb.style.width=cl(me.health,0,100)+'%';E.hpb.parentNode.classList.toggle('low',me.health<40);
  const hurt=me.alive&&!me.downed?cl((1-me.health/100)*.8,0,1)*(me.shield<=0?1:.3):0;this.vigV+=(Math.max(hurt,G.hurtFx)-this.vigV)*Math.min(1,dt*8);E.vig.style.opacity=this.vigV;
  // weapons
  me.weapons.forEach((w,i)=>{if(!w)return;const it=w.it;const on=i===me.wi&&!(me.superT>0);const row=$('w'+i);row.className='w'+(on?' on':'');row.style.setProperty('--ec',ELC[it.el]);row.style.setProperty('--rc',RAR[it.r].c);
   this.set($('wr'+i),'wr'+i,RAR[it.r].n+' · '+EL[it.el].n);this.set($('wn'+i),'wn'+i,it.n);const a=$('wa'+i);const v=`${w.mag}<small>${w.res}</small>`;this.set(a,'wa'+i,v,'innerHTML');a.classList.toggle('low',w.mag<=Math.max(1,w.st.mag*.25));});
  const cw=me.weapons[me.wi];const rl=$('wrl');if(rl){rl.classList.toggle('on',me.reloadT>0);rl.firstChild.style.width=me.reloadT>0&&cw?(1-me.reloadT/cw.st.reload/me.reloadMul)*100+'%':'0';}
  // crosshair
  if(cw){const A=cw.st;this.set(E.cross,'cc',(me.superT>0?'sup':cw.it.a)+(G.aimFoe?' foe':''),'className');const sp=A.pel?A.spr:me.spread;E.cross.style.setProperty('--s',Math.round(6+sp*H*1.1)+'px');
   if(A.charge)E.cross.querySelector('circle').style.strokeDasharray=(me.chargeT/A.charge*151).toFixed(1)+' 200';E.scope.hidden=!(A.scope&&me.zoom>.6&&me.alive&&!me.downed);E.cross.style.display=E.scope.hidden?'':'none';}
  // downed
  E.down.hidden=!(me.downed||!me.alive);if(me.downed){this.set(E.downT,'dt',me.reviveK>0?'REVIVING '+Math.round(me.reviveK*100)+'%':Math.ceil(me.bleedT)+'');this.set(E.downS,'ds',me.reviveK>0?'HOLD ON — AN ALLY IS RAISING YOU':'WAITING FOR AN ALLY · SELF-REVIVE WHEN THE TIMER ENDS');}
  else if(!me.alive){this.set(E.downT,'dt',Math.ceil(me.respawnT)+'');this.set(E.downS,'ds','RETURNING TO THE LAST CHECKPOINT');}
  // tags: enemy health bars, allies, objective, engrams
  let ti=0;const p=new V();const put=(pos,html,cls)=>{p.copy(pos).project(cam);if(p.z>1||p.z<-1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1)return;const e=this._tag(ti++);e.style.display='';if(e._c!==cls){e._c=cls;e.className=cls;}if(e._h!==html){e._h=html;e.innerHTML=html;}
   e.style.transform=`translate(${(p.x*.5+.5)*W}px,${(-p.y*.5+.5)*H}px) translate(-50%,-100%)`;};
  for(const f of G.foes){if(!f.alive||f.boss||f.spawnT>0)continue;const d=f.pos.distanceTo(cam.position);const big=f.kind!=='grunt'&&f.kind!=='rusher';if(d>(big?55:38)||(!big&&G.time-f.hitT>4&&d>22))continue;
   const hp=f.pos.clone();hp.y+=f.h+.35;const sh=f.shield>0?`<s style="width:${cl(f.shield/f.shMax,0,1)*100}%;--sc:${ELC[f.shEl]}"></s>`:'';
   put(hp,`${big||f.pylon?f.name:''}<div class="hb"><em style="width:${cl(f.hp/f.hpMax,0,1)*100}%"></em>${sh}</div>`,big||f.pylon?'maj':'');}
  for(const f of G.team){if(f===me||!f.alive)continue;const hp=f.pos.clone();hp.y+=2.25;put(hp,f.downed?`<span style="color:#ff6a50">▼ ${f.name}</span>`:f.name,'ally');}
  if(G.objPos&&!G.boss){const hp=G.objPos.clone();hp.y+=2.6;put(hp,`<i></i>${G.objTag||''}<span>${Math.round(G.objPos.distanceTo(me.pos))}M</span>`,'obj');}
  for(const d of G.drops){if(d.kind!=='engram'||d.pos.distanceTo(me.pos)>30)continue;const hp=d.pos.clone();hp.y+=.8;put(hp,`<span style="color:${RAR[d.r].c}">◆ ENGRAM</span>`,'eng');}
  for(let i=ti;i<this.tagPool.length;i++)if(this.tagPool[i].style.display!=='none')this.tagPool[i].style.display='none';
  // damage numbers
  let ni=0;for(const n of G.nums){p.copy(n.p).project(cam);if(p.z>1)continue;let e=this.numPool[ni];if(!e){e=document.createElement('b');E.nums.appendChild(e);this.numPool[ni]=e;}ni++;e.style.display='';
   const cls=n.crit?'c':n.sh?'s':'';if(e._c!==cls){e._c=cls;e.className=cls;}const tx=String(n.v);if(e._t!==tx){e._t=tx;e.textContent=tx;}const k=n.t/1;e.style.opacity=cl(1-k*k,0,1);
   e.style.transform=`translate(${(p.x*.5+.5)*W+n.ox}px,${(-p.y*.5+.5)*H-k*36}px) translate(-50%,-50%) scale(${1+Math.max(0,.25-k)*2})`;}
  for(let i=ni;i<this.numPool.length;i++)if(this.numPool[i].style.display!=='none')this.numPool[i].style.display='none';
  this.radarT-=dt;if(this.radarT<=0){this.radarT=1/15;this.drawRadar();}}
 drawRadar(){const G=this.G,me=G.me,x=this.rc,S=200,c=S/2,R=40;x.clearRect(0,0,S,S);
  x.fillStyle='rgba(6,10,18,.6)';x.beginPath();x.arc(c,c,c-2,0,7);x.fill();x.strokeStyle='rgba(242,197,92,.35)';x.lineWidth=1.5;x.stroke();x.strokeStyle='rgba(242,197,92,.12)';for(const r of[.33,.66])x.beginPath(),x.arc(c,c,(c-2)*r,0,7),x.stroke();
  const cy=Math.cos(me.yaw),sy=Math.sin(me.yaw),k=(c-8)/R;const P=(px,pz)=>{const dx=px-me.pos.x,dz=pz-me.pos.z;const rx=dx*cy-dz*sy,ry=dx*sy+dz*cy;return[c+rx*k,c+ry*k,Math.hypot(rx,ry)];};
  if(G.objPos){let[px,py,d]=P(G.objPos.x,G.objPos.z);if(d>R){px=c+(px-c)*R/d;py=c+(py-c)*R/d;}x.save();x.translate(px,py);x.rotate(Math.PI/4);x.strokeStyle='#f2c55c';x.lineWidth=2;x.strokeRect(-5,-5,10,10);x.restore();}
  for(const f of G.foes){if(!f.alive||f.spawnT>0)continue;const[px,py,d]=P(f.pos.x,f.pos.z);if(d>R)continue;x.fillStyle=f.boss||f.kind==='heavy'||f.kind==='major'?'#ffcf3f':'#ff3d2e';x.beginPath();x.arc(px,py,f.boss?8:f.kind==='grunt'||f.kind==='rusher'?4:5.5,0,7);x.fill();}
  for(const f of G.team){if(f===me||!f.alive)continue;const[px,py,d]=P(f.pos.x,f.pos.z);if(d>R)continue;x.fillStyle=f.downed?'#ff6a50':'#5fb8ff';x.beginPath();x.arc(px,py,4.5,0,7);x.fill();}
  x.fillStyle='#fff';x.beginPath();x.moveTo(c,c-8);x.lineTo(c+5,c+6);x.lineTo(c,c+3);x.lineTo(c-5,c+6);x.fill();}}
