// STARFALL VANGUARD — HUD: objective card + mission clock, shield/health arc, boss bar, squad roster, radio transcript,
// weapon card with energy heat, vehicle card, crosshair, motion tracker, projected objective markers and squad tags.
import * as THREE from '../vendor/three.module.min.js';
import {V,fmt,cl} from './util.js';
import {WPN} from './weapons.js';
import {SPEAK} from './missions.js';

const $=id=>document.getElementById(id);
export class HUD{
 constructor(G){this.G=G;this.c={};const ids=['objt','clock','mname','prog','shb','hpb','boss','bossS','bossH','bossn','squad','radio','rwho','rtxt','tags','cross','hitm','dmg','scope','prompt','toast','title','tt1','tt2','tt3','radar','wname','mag','res','heat','walt','rl','nf','np','veh','vname','vhp','vinfo','dead','dtxt','vig','flash'];
  this.el={};for(const k of ids)this.el[k]=$(k);this.rc=this.el.radar.getContext('2d');this.tagPool=[];this.hitT=0;this.flashV=0;this.vigV=0;this.sweep=0;this.prm='';this.radarT=0;this.rq=[];this.rT=0;this.toastT=0;this.titleT=0;}
 set(el,k,v,prop='textContent'){if(this.c[k]!==v){this.c[k]=v;el[prop]=v;}}
 reset(){this.el.dmg.innerHTML='';this.c={};this.rq=[];this.rT=0;this.el.radio.classList.remove('on');this.el.dead.hidden=true;this.el.boss.hidden=true;this.el.title.classList.remove('on');this.el.toast.classList.remove('on');this.prompt('');}
 objective(t){this.set(this.el.objt,'obj',t);const ob=this.el.objt.parentNode;ob.classList.remove('new');void ob.offsetWidth;ob.classList.add('new');}
 radio(who,text){this.rq.push([who,text]);}
 toast(t,d=2.2){this.el.toast.textContent=t;this.el.toast.classList.add('on');this.toastT=d;}
 title(a,b,c,d=4.5){this.el.tt1.textContent=a;this.el.tt2.textContent=b;this.el.tt3.textContent=c;this.el.title.classList.add('on');this.titleT=d;}
 hit(kind){this.el.hitm.className=kind||'';this.hitT=kind==='k'?.45:.22;}
 damageFrom(ang){const i=document.createElement('i');i.style.transform=`rotate(${ang}rad)`;this.el.dmg.appendChild(i);setTimeout(()=>i.remove(),1100);while(this.el.dmg.children.length>6)this.el.dmg.firstChild.remove();}
 flash(v=.7){this.flashV=Math.max(this.flashV,v);}
 prompt(html){if(this.prm!==html){this.prm=html;this.el.prompt.innerHTML=html;this.el.prompt.classList.toggle('on',!!html);}}
 _tag(i){let e=this.tagPool[i];if(!e){e=document.createElement('div');this.el.tags.appendChild(e);this.tagPool[i]=e;}return e;}
 update(dt,cam){const G=this.G,me=G.me,E=this.el;if(!me)return;
  this.hitT-=dt;E.hitm.style.opacity=this.hitT>0?Math.min(1,this.hitT*6):0;this.flashV=Math.max(0,this.flashV-dt*2.5);E.flash.style.opacity=this.flashV;
  // radio queue
  this.rT-=dt;if(this.rT<=0){if(this.rq.length){const[w,t]=this.rq.shift();this.set(E.rwho,'rw',SPEAK[w]||w);this.set(E.rtxt,'rt',t);E.radio.className='on'+(w==='VASH'?' enemy':w==='AI'?' ai':'');this.rT=Math.max(3.2,t.length*.055);G.sfx('radio');}else if(E.radio.classList.contains('on'))E.radio.classList.remove('on');}
  if(this.toastT>0){this.toastT-=dt;if(this.toastT<=0)E.toast.classList.remove('on');}if(this.titleT>0){this.titleT-=dt;if(this.titleT<=0)E.title.classList.remove('on');}
  // clock + objective progress
  this.set(E.clock,'clk',fmt(G.clock));E.clock.classList.toggle('low',G.clock<=60);
  const pr=G.progress;E.prog.hidden=!(pr>0);if(pr>0)E.prog.firstChild.style.width=(pr*100).toFixed(1)+'%';
  // vitals
  E.shb.style.width=(me.shield/me.maxSh*100)+'%';E.shb.parentNode.classList.toggle('low',me.alive&&me.shield<25);E.shb.parentNode.classList.toggle('chg',me.shDelay<=0&&me.shield<me.maxSh);
  E.hpb.style.width=(me.health/me.maxHp*100)+'%';E.hpb.parentNode.classList.toggle('low',me.health<35);
  const hurt=me.alive?cl((1-me.health/me.maxHp)*.8+(me.shield<=0?.2:0),0,1)*(me.shield<=0?1:.25):0;this.vigV+=(Math.max(hurt,G.hurtFx)-this.vigV)*Math.min(1,dt*8);E.vig.style.opacity=this.vigV;
  // boss
  const boss=G.boss;E.boss.hidden=!(boss&&boss.alive);if(boss&&boss.alive){E.bossS.style.width=(boss.shield/boss.maxSh*100)+'%';E.bossH.style.width=(boss.health/boss.maxHp*100)+'%';}
  // squad roster
  const sq=G.actors.filter(a=>a.squad);const sh=sq.map(a=>`<div class="${a.alive?'':'kia'}">${a.name}<i><em style="width:${a.alive?a.health/a.maxHp*100:0}%"></em></i></div>`).join('');this.set(E.squad,'sq',sh,'innerHTML');
  // weapon / vehicle
  const V0=me.veh;E.veh.hidden=!V0;(this._wp||(this._wp=document.getElementById('wpn'))).style.visibility=V0?'hidden':'';
  if(V0){this.set(E.vname,'vn',V0.S.name+(me.seat==='driver'?'':' · '+me.seat.toUpperCase()));E.vhp.style.width=cl(V0.hp/V0.S.hp,0,1)*100+'%';this.set(E.vinfo,'vi',V0.kind==='tank'?(V0.fireCD>0?'CANNON RELOADING':'CANNON READY')+' · RMB COAX':'GUNNER: '+(V0.seats.gunner?V0.seats.gunner.name:'— EMPTY —'));}
  const w=me.weapons[me.wi];if(w){const d=WPN[w.id];this.set(E.wname,'wn',d.name);
   if(d.energy){this.set(E.mag,'mag',String(Math.ceil(w.bat)));this.set(E.res,'res','% BATTERY');E.heat.hidden=false;E.heat.firstChild.style.width=(w.vent>0?w.vent/d.vent:w.heat)*100+'%';E.heat.classList.toggle('vent',w.vent>0);E.mag.classList.toggle('low',w.bat<15);}
   else{this.set(E.mag,'mag',String(w.mag));E.mag.classList.toggle('low',w.mag<=Math.max(1,d.mag*.25));this.set(E.res,'res','/ '+w.res);E.heat.hidden=true;}
   const o=me.weapons[1-me.wi];this.set(E.walt,'alt',o?WPN[o.id].name+' · '+(WPN[o.id].energy?Math.ceil(o.bat)+'%':o.mag+'/'+o.res):'— EMPTY SLOT —');
   E.rl.classList.toggle('on',me.reloadT>0);E.rl.firstChild.style.width=me.reloadT>0?(1-me.reloadT/d.reload)*100+'%':'0';
   const cls=(V0?'veh':w.id)+(G.aimFoe?' foe':G.aimAlly?' ally':'');this.set(E.cross,'cc',cls,'className');const sp=V0?.02:d.pel?d.spr:me.spread;E.cross.style.setProperty('--s',Math.round(6+sp*innerHeight*1.1)+'px');
   E.scope.hidden=!(d.scope&&me.zoom>.6&&me.alive&&!V0);E.cross.style.display=E.scope.hidden?'':'none';}
  this.set(E.nf,'nf','◆ FRAG '+me.nades.frag);this.set(E.np,'np','● PULSE '+me.nades.stick);E.nf.classList.toggle('on',me.nadeSel==='frag');E.np.classList.toggle('on',me.nadeSel==='stick');
  E.dead.hidden=me.alive||G.phase!=='play';
  // projected tags + objective marker
  let ti=0;const W=innerWidth,H=innerHeight,p=new V();const put=(pos,html,cls,clamp)=>{p.copy(pos).project(cam);let behind=p.z>1;if(behind&&!clamp)return;if(behind){p.x=-p.x;p.y=-p.y;}
   let x=(p.x*.5+.5)*W,y=(-p.y*.5+.5)*H;if(clamp){if(behind)y=H-40;x=cl(x,40,W-40);y=cl(y,70,H-40);}const e=this._tag(ti++);e.style.display='';e.className=cls;if(e._h!==html){e._h=html;e.innerHTML=html;}e.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;e.style.left=e.style.top='0';};
  for(const a of G.actors){if(a===me||!a.alive||a.hidden)continue;const hp=(a.veh?a.veh.pos:a.pos).clone();hp.y+=(a.veh?3.2:a.K.h+.45);const d=hp.distanceTo(cam.position);
   if(a.squad&&d<70)put(hp,a.name,'ally');else if(a===G.aimTarget&&a.team&&d<90)put(hp,a.K.name,'foe');}
  for(const v of G.vehicles)if(!v.dead&&v!==me.veh){const hp=v.pos.clone();hp.y+=3.6;if(hp.distanceTo(cam.position)<60&&G.step&&G.mark&&G.mark.distanceTo(v.pos)>3)put(hp,v.S.name,'veh');}
  if(G.mark&&G.phase==='play'){const hp=G.mark.clone();hp.y+=3;const d=Math.round(G.mark.distanceTo(me.veh?me.veh.pos:me.pos));put(hp,`<i></i>${d}M`,'obj',true);}
  for(let i=ti;i<this.tagPool.length;i++)if(this.tagPool[i].style.display!=='none')this.tagPool[i].style.display='none';
  this.radarT-=dt;if(this.radarT<=0){this.radarT=1/20;this.drawRadar();}}
 drawRadar(){const G=this.G,me=G.me,x=this.rc,S=200,c=S/2,R=40;this.sweep=(this.sweep+.04)%1;x.clearRect(0,0,S,S);
  x.fillStyle='rgba(8,14,10,.62)';x.beginPath();x.arc(c,c,c-2,0,7);x.fill();x.strokeStyle='rgba(159,232,106,.4)';x.lineWidth=1.5;x.stroke();
  x.strokeStyle='rgba(159,232,106,.14)';for(const r of[.33,.66])x.beginPath(),x.arc(c,c,(c-2)*r,0,7),x.stroke();x.beginPath();x.moveTo(c,4);x.lineTo(c,S-4);x.moveTo(4,c);x.lineTo(S-4,c);x.stroke();
  const g=x.createConicGradient?x.createConicGradient(this.sweep*Math.PI*2-Math.PI/2,c,c):null;if(g){g.addColorStop(0,'rgba(159,232,106,.22)');g.addColorStop(.12,'rgba(159,232,106,0)');g.addColorStop(1,'rgba(159,232,106,0)');x.fillStyle=g;x.beginPath();x.arc(c,c,c-3,0,7);x.fill();}
  const mp=me.veh?me.veh.pos:me.pos,yaw=G.camYaw;const cy=Math.cos(yaw),sy=Math.sin(yaw),k=(c-8)/R;const P=(px,pz)=>{const dx=px-mp.x,dz=pz-mp.z;const rx=dx*cy-dz*sy,ry=dx*sy+dz*cy;return[c+rx*k,c+ry*k,Math.hypot(rx,ry)];};
  if(G.mark){let[px,py,d]=P(G.mark.x,G.mark.z);if(d>R){px=c+(px-c)*R/d;py=c+(py-c)*R/d;}x.save();x.translate(px,py);x.rotate(Math.PI/4);x.strokeStyle='#ffb03a';x.lineWidth=2;x.strokeRect(-5,-5,10,10);x.restore();}
  for(const v of G.vehicles){if(v.dead||v===me.veh)continue;const[px,py,d]=P(v.pos.x,v.pos.z);if(d>R)continue;x.fillStyle='#ffd080';x.fillRect(px-4,py-4,8,8);}
  for(const a of G.actors){if(a===me||!a.alive||a.hidden)continue;const ap=a.veh?a.veh.pos:a.pos;const sp=Math.hypot(a.vel.x,a.vel.z);const loud=a.team===0||a.lastFire>G.time-1.2||sp>2.2||a.K.fixed;if(!loud)continue;const[px,py,d]=P(ap.x,ap.z);if(d>R)continue;
   x.fillStyle=a.team===0?'#9fe86a':'#ff3d2e';x.beginPath();x.arc(px,py,a.K.boss||a.kind==='ravager'?7:a.kind==='skitter'?3.5:5,0,7);x.fill();}
  x.fillStyle='#fff';x.beginPath();x.moveTo(c,c-8);x.lineTo(c+5,c+6);x.lineTo(c,c+3);x.lineTo(c-5,c+6);x.fill();}}
