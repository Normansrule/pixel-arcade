// GLOSS RIOT — HUD: crew icons + clock, live turf coverage bar, zone counts, ink tank by the crosshair, special ring,
// reticle per weapon, hit markers, damage arcs, kill feed, banners, projected name tags, ink minimap and scoreboard.
import * as THREE from '../vendor/three.module.min.js';
import {V,fmt,cl} from './util.js';
import {WPN} from './weapons.js';

const $=id=>document.getElementById(id);
export class HUD{
 constructor(G){this.G=G;this.c={};this.el={};for(const k of['sq0','sq1','clock','modeTag','covA','covB','pA','pB','zonebar','zA','zB','zS','tags','feed','dmg','cross','hitm','tank','tankF','tankT','banner','prompt','sp','spC','spT','wname','mini','dead','killer','rsp','board','vig','flash','hud'])this.el[k]=$(k);
  this.mc=this.el.mini.getContext('2d');this.tagPool=[];this.hitT=0;this.banT=0;this.prm='';this.miniT=0;this.flashV=0;this.vigV=0;this.icons=new Map();}
 set(el,k,v,prop='textContent'){if(this.c[k]!==v){this.c[k]=v;el[prop]=v;}}
 reset(){const G=this.G,E=this.el;E.feed.innerHTML='';E.dmg.innerHTML='';this.c={};E.modeTag.textContent=G.M.n;E.dead.hidden=true;E.board.hidden=true;E.zonebar.hidden=G.mode!=='zone';this.icons.clear();
  for(const t of[0,1]){const box=E['sq'+t];box.innerHTML='';for(const f of G.fighters.filter(f=>f.team===t)){const i=document.createElement('i');i.style.setProperty('--c',G.pal.c[t]);i.textContent=WPN[f.wpn].glyph;if(f===G.me)i.className='me';box.appendChild(i);this.icons.set(f,i);}}
  const[x0,x1,z0,z1]=G.D.def.bounds;const asp=(x1-x0)/(z1-z0);E.mini.height=320;E.mini.width=Math.round(320*asp);this.banT=0;E.banner.classList.remove('on');}
 feed(k,v,how,mine){const G=this.G,d=document.createElement('div');const col=f=>G.pal.c[f.team];
  d.innerHTML=(k?`<span style="color:${col(k)}">${k.name}</span><span class="w">${how}</span>`:`<span class="w">${how}</span>`)+`<span style="color:${col(v)}">${v.name}</span>`;if(mine)d.className='me';
  this.el.feed.prepend(d);setTimeout(()=>d.remove(),5000);while(this.el.feed.children.length>6)this.el.feed.lastChild.remove();}
 banner(t,s='',dur=1.6,col){const e=this.el.banner;e.querySelector('b').textContent=t;e.querySelector('b').style.color=col||'';const sp=e.querySelector('span');sp.textContent=s;sp.style.display=s?'':'none';e.classList.add('on');this.banT=dur;}
 hit(kind){this.el.hitm.className=kind||'';this.hitT=kind==='k'?.45:.2;}
 damageFrom(ang){const i=document.createElement('i');i.style.transform=`rotate(${ang}rad)`;this.el.dmg.appendChild(i);setTimeout(()=>i.remove(),1000);while(this.el.dmg.children.length>5)this.el.dmg.firstChild.remove();}
 flash(v=.6){this.flashV=Math.max(this.flashV,v);}
 prompt(html){if(this.prm!==html){this.prm=html;this.el.prompt.innerHTML=html;this.el.prompt.classList.toggle('on',!!html);}}
 _tag(i){let e=this.tagPool[i];if(!e){e=document.createElement('div');this.el.tags.appendChild(e);this.tagPool[i]=e;}return e;}
 update(dt,cam){const G=this.G,me=G.me,E=this.el;if(!me)return;
  this.hitT-=dt;E.hitm.style.opacity=this.hitT>0?Math.min(1,this.hitT*6):0;if(this.banT>0){this.banT-=dt;if(this.banT<=0)E.banner.classList.remove('on');}
  this.flashV=Math.max(0,this.flashV-dt*2.5);E.flash.style.opacity=this.flashV;
  this.set(E.clock,'clk',fmt(G.clock));E.clock.style.color=G.clock<=30?'#ffd21a':'';
  for(const[f,i]of this.icons){const cls=(f===me?'me ':'')+(f.alive?'':'dead ')+(f.special>=100&&f.alive?'sp':'');if(i._c!==cls){i._c=cls;i.className=cls;}}
  const[a,b]=G.P.share();E.covA.style.width=(a*100).toFixed(1)+'%';E.covB.style.width=(b*100).toFixed(1)+'%';this.set(E.pA,'pa',(a*100).toFixed(0)+'%');this.set(E.pB,'pb',(b*100).toFixed(0)+'%');
  if(G.mode==='zone'){const z=G.zone;this.set(E.zA,'za',String(Math.ceil(z.count[0])));this.set(E.zB,'zb',String(Math.ceil(z.count[1])));this.set(E.zS,'zs',z.owner<0?'ZONE NEUTRAL':(z.owner===me.team?'WE HAVE THE ZONE':'THEY HAVE THE ZONE'));E.zS.style.background=z.owner<0?'':G.pal.c[z.owner];E.zS.style.color=z.owner<0?'':'#1d1426';}
  // vignette: hurt or standing in enemy ink
  const hurt=me.alive?cl((1-me.hp/100)*.9,0,1):0;const want=Math.max(hurt*.8,G.hurtFx,me.alive&&me.under>0&&me.under!==me.team+1?.35:0);this.vigV+=(want-this.vigV)*Math.min(1,dt*8);E.vig.style.opacity=this.vigV;
  // tank + special
  E.tankF.style.height=me.ink.toFixed(1)+'%';E.tank.classList.toggle('low',me.ink<20);this.set(E.tankT,'tt',me.sub&&me.ink<100?'+ INK':me.ink<20?'LOW':'INK');E.tank.style.opacity=me.alive?(me.ink>=99.5&&!me.sub?.55:1):0;
  const sp=me.special;E.spC.style.strokeDasharray=(sp/100*263.9).toFixed(1)+' 300';this.set(E.spT,'spt',sp>=100?'GO!':String(Math.floor(sp)));E.sp.classList.toggle('full',sp>=100);
  const w=WPN[me.wpn];this.set(E.wname,'wn',w.name);this.set(E.cross,'cc',me.wpn+(G.aimFoe?' foe':''),'className');
  if(me.wpn==='charger')E.cross.querySelector('circle').style.strokeDasharray=(me.chargeT/w.charge*151).toFixed(1)+' 200';
  E.cross.style.display=me.alive&&!me.swim&&G.phase==='play'?'':'none';
  E.dead.hidden=me.alive||G.phase!=='play';if(!me.alive){this.set(E.killer,'kl',me.killedBy?me.killedBy.name:'THE TIDE');this.set(E.rsp,'rsp','RESPAWN '+Math.max(0,Math.ceil(me.respawnT)));}
  // tags
  let ti=0;const Wd=innerWidth,H=innerHeight,p=new V();const put=(pos,html,cls,col)=>{p.copy(pos).project(cam);if(p.z>1||p.z<-1)return;const e=this._tag(ti++);e.style.display='';e.className=cls;if(e._h!==html){e._h=html;e.innerHTML=html;}e.style.color=col||'';
   e.style.transform=`translate(${(p.x*.5+.5)*Wd}px,${(-p.y*.5+.5)*H}px) translate(-50%,-100%)`;};
  for(const f of G.fighters){if(f===me||!f.alive)continue;const ally=f.team===me.team;if(ally||f===G.aimTarget){const hp=f.pos.clone();hp.y+=f.swim?1:2.05;if(ally||hp.distanceTo(cam.position)<60)put(hp,f.name,'',G.pal.c[f.team]);}}
  if(G.mode==='zone'&&G.D.zones[0]){const z=G.D.zones[0],hp=new V((z.x0+z.x1)/2,z.y+2.6,(z.z0+z.z1)/2);put(hp,`<i></i>ZONE`,'obj',G.zone.owner<0?'#ffffff':G.pal.c[G.zone.owner]);}
  for(let i=ti;i<this.tagPool.length;i++)if(this.tagPool[i].style.display!=='none')this.tagPool[i].style.display='none';
  this.miniT-=dt;if(this.miniT<=0){this.miniT=.2;this.drawMini();}}
 drawMini(){const G=this.G,me=G.me,x=this.mc,cv=this.el.mini,W=cv.width,H=cv.height;x.clearRect(0,0,W,H);const src=G.P.drawMini();x.imageSmoothingEnabled=true;
  // team 0 base at the bottom: flip vertically
  x.save();x.translate(0,H);x.scale(1,-1);x.drawImage(src,0,0,W,H);x.restore();
  const[x0,x1,z0,z1]=G.D.def.bounds;const P=(px,pz)=>[(px-x0)/(x1-x0)*W,H-(pz-z0)/(z1-z0)*H];
  for(const f of G.fighters){if(!f.alive||f===me)continue;const ally=f.team===me.team;if(!ally&&!(f.lastFire>G.time-1.2&&!f.sub)&&f!==G.aimTarget)continue;const[px,py]=P(f.pos.x,f.pos.z);
   x.fillStyle=G.pal.c[f.team];x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(px,py,6,0,7);x.fill();x.stroke();}
  if(me.alive){const[px,py]=P(me.pos.x,me.pos.z);x.save();x.translate(px,py);x.rotate(-me.yaw+Math.PI);x.fillStyle='#fff';x.strokeStyle='#1d1426';x.lineWidth=2;x.beginPath();x.moveTo(0,-11);x.lineTo(8,8);x.lineTo(0,4);x.lineTo(-8,8);x.closePath();x.fill();x.stroke();x.restore();}}
 board(on){const G=this.G,e=this.el.board;this.el.hud.classList.toggle('bigmap',on);e.hidden=!on;if(!on)return;
  const tr=f=>`<tr class="t${f.team}${f===G.me?' me':''}"><td>${f.name}</td><td>${WPN[f.wpn].short}</td><td>${Math.round(f.stats.turf)}p</td><td>${f.stats.splats}</td><td>${f.stats.deaths}</td><td>${f.stats.specials}</td></tr>`;
  const html=`<h4>${G.M.n} · ${G.D.def.name}</h4><table class="sb"><tr><th>INKER</th><th>WEAPON</th><th>TURF</th><th>SPLATS</th><th>DEATHS</th><th>SPECIALS</th></tr>${[0,1].map(t=>G.fighters.filter(f=>f.team===t).sort((a,b)=>b.stats.turf-a.stats.turf).map(tr).join('')).join('')}</table>`;
  if(e._h!==html){e._h=html;e.innerHTML=html;}}}
