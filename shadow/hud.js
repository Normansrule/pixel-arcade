// SILENT CONTRACT — HUD: disguise and zone status, contract clock and detection state, target dossiers, opportunity tracker,
// notification feed, suspicion meters over heads (with edge arrows when off screen), instinct markers, prompts with hold bars,
// inventory, health, banners and the villa map.
import * as THREE from '../vendor/three.module.min.js';
import {ZONES,ALLOW,HOSTILE,ZNAME,GW,GH,X0,Z0,CELL} from './level.js';
import {DNAME} from './actors.js';
import {toast} from '../js/kit3d/ui.js';
const $=id=>document.getElementById(id);
export const fmt=s=>{s=Math.max(0,Math.ceil(s));return(s/60|0)+':'+String(s%60).padStart(2,'0');};
const DIC={suit:'S',guest:'G',waiter:'W',chef:'C',guard:'S',mech:'M'};
export class HUD{
 constructor(G){this.G=G;this.pool=[];this.mpool=[];this.last={};this.v=new THREE.Vector3();this.bannerT=0;}
 init(){const G=this.G;$('tgts').innerHTML=G.targets.map((t,i)=>`<div class="tg" id="tg${i}"><i>${i+1}</i><div><b>${t.name}</b><span id="tgs${i}"></span></div></div>`).join('');this.opps();this.last={};$('feed').innerHTML='';}
 opps(){const G=this.G;$('oppl').innerHTML=G.opps.map(o=>`<li class="${o.done?'done':''}"><b>${o.done?'✓ ':''}${o.name}</b>${o.steps.map((s,i)=>`<span class="${o.at>i||o.done?'d':''}">${i?' · ':''}${s}</span>`).join('')}</li>`).join('');}
 feed(html,cls='info',ms=4200){toast($('feed'),html,ms,5).className=cls;}
 banner(t,s,ms=2600){$('bt').textContent=t;$('bs').textContent=s||'';$('banner').classList.add('on');this.bannerT=ms/1000;}
 set(id,v,prop='textContent'){if(this.last[id+prop]===v)return;this.last[id+prop]=v;$(id)[prop]=v;}
 tick(dt,cam,W,H){const G=this.G,P=G.player,L=G.L;if(this.bannerT>0){this.bannerT-=dt;if(this.bannerT<=0)$('banner').classList.remove('on');}
  // disguise + zone
  this.set('disname',DNAME[P.disguise]||'');this.set('disic',DIC[P.disguise]||'?');
  const z=L.zoneAt(P.pos.x,P.pos.z),ok=(ALLOW[P.disguise]||[0]).includes(z),host=!ok&&HOSTILE.includes(z);
  this.set('zonet',P.hidden?'HIDDEN · '+P.hidden.name:(L.rooms[L.roomAt(P.pos.x,P.pos.z)]?.name||'GROUNDS')+' · '+(ok?'ALLOWED':host?'HOSTILE AREA':'TRESPASSING'));this.set('zone',ok||P.hidden?'':host?'host':'tres','className');
  let enf=false;for(const n of G.npcs)if(n.enforcer&&n.enforcerOf===P.disguise&&!n.down&&P.disguise!=='suit'&&n.pos.distanceTo(P.pos)<9){enf=true;break;}$('enf').hidden=!enf;
  // clock + status
  this.set('clock',fmt(G.timeLeft));this.set('clock',G.timeLeft<60?'low':'','className');
  const st=P.hidden?['hidden','HIDDEN']:G.combatNow?['combat','COMBAT']:G.searching?['search','SEARCHING']:G.maxSus>.05?['sus','SUSPICIOUS']:G.compromised?['sus','COMPROMISED']:['ok','UNDETECTED'];
  this.set('status',st[1]);this.set('status',st[0],'className');
  // targets
  G.targets.forEach((t,i)=>{const n=t.npc;const s=n.alive?(L.rooms[L.roomAt(n.pos.x,n.pos.z)]?.name||'GROUNDS'):'ELIMINATED · '+(t.how||'');this.set('tgs'+i,s);this.set('tg'+i,'tg'+(n.alive?'':' dead'),'className');});
  // inventory
  const it=[];if(P.coins)it.push(`<span>COINS <b>×${P.coins}</b></span>`);for(const k in P.items)if(P.items[k])it.push(`<span><b>${k==='poison'?'RAT POISON':'WRENCH'}</b></span>`);this.set('items',it.join(''),'innerHTML');
  this.set('mag',String(P.mag));this.set('res','/ '+P.res);$('ammo').style.opacity=P.aimK>.1||P.reloadT>0?1:.55;
  $('hp').className=P.hp<100?(P.hp<35?'on low':'on'):'';$('hpb').style.width=Math.max(0,P.hp)+'%';$('hurtov').style.opacity=Math.max(0,P.hurtT)*.9;
  $('cross').className=P.aimK>.4?'on'+(G.aimHit?' hitm':''):'';
  // prompts
  const pr=G.prompts.map(p=>`<div class="${p.no?'no':p.bad?'bad':''}"><kbd>${p.k}</kbd>${p.t}</div>`).join('');this.set('pkeys',pr,'innerHTML');
  const hb=G.holdK;$('prompt').querySelector('.bar').classList.toggle('on',hb>0);$('pbar').style.width=(hb*100)+'%';
  this.marks(cam,W,H);}
 // suspicion meters + instinct markers
 marks(cam,W,H){const G=this.G,P=G.player,host=$('marks');let pi=0,mi=0;const v=this.v;
  const put=(pool,i,cls,x,y)=>{let e=pool[i];if(!e){e=document.createElement('div');host.appendChild(e);pool[i]=e;}if(e.className!==cls)e.className=cls;e.style.display='';e.style.left=x+'px';e.style.top=y+'px';return e;};
  const proj=(x,y,z)=>{v.set(x,y,z).project(cam);return{x:(v.x*.5+.5)*W,y:(-v.y*.5+.5)*H,on:v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05,z:v.z};};
  for(const n of G.npcs){if(n.down||n.hidden)continue;const d=n.pos.distanceTo(P.pos);const sv=n.state==='combat'?1:n.sus;
   if(sv>.03&&d<45){const p=proj(n.pos.x,n.y+2.15,n.pos.z);const cls='sm'+(sv>=1?' full':sv>.5?' hi':'');let x=p.x,y=p.y,edge=false;
    if(!p.on||p.z>1){const a=Math.atan2(n.pos.x-P.pos.x,n.pos.z-P.pos.z)-G.camYaw;x=W/2-Math.sin(a)*Math.min(W,H)*.36;y=H/2-Math.cos(a)*Math.min(W,H)*.36;edge=true;}
    const e=put(this.pool,pi++,cls+(edge?' edge':''),x,y);if(!e.firstChild)e.innerHTML='<i></i><b></b>';e.style.setProperty('--v',Math.min(1,sv).toFixed(3));if(edge)e.style.setProperty('--r',(-(Math.atan2(n.pos.x-P.pos.x,n.pos.z-P.pos.z)-G.camYaw)*57.3+180)+'deg');
    const t=sv>=1?'!':n.say==='?'?'?':'';if(e.lastChild.textContent!==t)e.lastChild.textContent=t;}
   if(G.instinct&&d<60){if(n.role==='target'){const p=proj(n.pos.x,n.y+2.2,n.pos.z);if(p.on){const e=put(this.mpool,mi++,'mk t',p.x,p.y);e.innerHTML='<i></i>'+n.name;}}
    else if(n.enforcer&&n.enforcerOf===P.disguise&&d<40){const p=proj(n.pos.x,n.y+2.1,n.pos.z);if(p.on){const e=put(this.mpool,mi++,'mk e',p.x,p.y);e.innerHTML='<i></i>';}}}}
  if(G.instinct){for(const u of G.L.uses){if(u.id==='exit'&&!G.canExit())continue;const d=Math.hypot(u.x-P.pos.x,u.z-P.pos.z);if(d>30)continue;const p=proj(u.x,u.y+.4,u.z);if(!p.on)continue;const e=put(this.mpool,mi++,'mk o',p.x,p.y);e.innerHTML='<i></i>'+(d<14?u.name:'');}
   for(const it of G.L.items){if(it.taken)continue;const d=Math.hypot(it.x-P.pos.x,it.z-P.pos.z);if(d>30)continue;const p=proj(it.x,it.y+.3,it.z);if(!p.on)continue;const e=put(this.mpool,mi++,'mk o',p.x,p.y);e.innerHTML='<i></i>'+(d<14?it.name:'');}
   for(const c of G.L.containers){const d=Math.hypot(c.x-P.pos.x,c.z-P.pos.z);if(d>16)continue;const p=proj(c.x,c.y+1,c.z);if(!p.on)continue;const e=put(this.mpool,mi++,'mk c',p.x,p.y);e.innerHTML='<i></i>'+(d<8?c.name+(c.body?' (FULL)':''):'');}}
  for(let i=pi;i<this.pool.length;i++)this.pool[i].style.display='none';for(let i=mi;i<this.mpool.length;i++)this.mpool[i].style.display='none';}
 // ---- map
 drawMap(){const G=this.G,L=G.L,c=$('mapc'),x=c.getContext('2d'),S=c.width;const x0=-66,z0=-76,span=148,k=S/span;
  if(!this.mapBase){const b=document.createElement('canvas');b.width=b.height=S;const bx=b.getContext('2d');bx.fillStyle='#0d0c10';bx.fillRect(0,0,S,S);
   // sea
   bx.fillStyle='#10202a';bx.fillRect(0,(31-z0)*k,S,S);
   const zc=['#2a2620','#6a6250','#3a5a6a','#3a5a6a','#7a2a30','#7a2a30','#2a5a5a'];
   for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const id=j*GW+i;const fh=L.fh[id];if(fh!==fh)continue;const wx=X0+i*CELL,wz=Z0+j*CELL;if(wx<x0||wz<z0||wx>x0+span||wz>z0+span)continue;
    let col=zc[L.zone[id]]||'#333';if(!L.walk[id])col='#1a1816';bx.fillStyle=col;bx.globalAlpha=L.indoor(wx+.25,wz+.25)?1:.72;bx.fillRect((wx-x0)*k,(wz-z0)*k,CELL*k+.6,CELL*k+.6);}
   bx.globalAlpha=1;bx.fillStyle='#e8e0d0';for(const bb of L.boxes){if(!bb.sight||bb.x1-bb.x0>30&&bb.z1-bb.z0>30)continue;bx.fillRect((bb.x0-x0)*k,(bb.z0-z0)*k,Math.max(1,(bb.x1-bb.x0)*k),Math.max(1,(bb.z1-bb.z0)*k));}
   bx.font='600 10px JetBrains Mono, monospace';bx.textAlign='center';bx.fillStyle='rgba(255,255,255,.75)';
   const lbl=[['BALLROOM',0,-12],['KITCHEN',-23.5,-12],['FOYER',0,-26.5],['STUDY',23.5,-8.5],['SECURITY',23.5,-27],['LIBRARY',10,-26.5],['TERRACE',0,5.5],['GARDEN',-20,21],['SERVICE YARD',-46,-14],['FRONT COURT',10,-43],['DRIVE',0,-60],['HELIPAD',49,-30],['BOATHOUSE',41,49.5],['PIER',55,60],['WINE CELLAR (BELOW)',-24,-39],['SHED',-54,-20],['CLIFF STAIRS',51.5,38]];
   for(const[t,wx,wz]of lbl)bx.fillText(t,(wx-x0)*k,(wz-z0)*k);this.mapBase=b;}
  x.drawImage(this.mapBase,0,0);const pt=(wx,wz)=>[(wx-x0)*k,(wz-z0)*k];
  x.lineWidth=2;for(const u of L.uses){const[a,b]=pt(u.x,u.z);if(u.id==='radio'||u.id==='fuse'){x.fillStyle='#9cc8ff';x.fillRect(a-2,b-2,4,4);continue;}x.strokeStyle='#e8c26a';x.save();x.translate(a,b);x.rotate(PI4);x.strokeRect(-4,-4,8,8);x.restore();}
  for(const it of L.items){if(it.taken)continue;const[a,b]=pt(it.x,it.z);x.fillStyle='#e8c26a';x.beginPath();x.arc(a,b,3,0,7);x.fill();}
  for(const t of G.targets){if(!t.npc.alive)continue;const[a,b]=pt(t.npc.pos.x,t.npc.pos.z);x.fillStyle='#e3283a';x.save();x.translate(a,b);x.rotate(PI4);x.fillRect(-5,-5,10,10);x.restore();x.fillStyle='#fff';x.fillText(t.name.split(' ')[1],a,b-10);}
  const[a,b]=pt(G.player.pos.x,G.player.pos.z);x.save();x.translate(a,b);x.rotate(-G.player.yaw+Math.PI);x.fillStyle='#fff';x.beginPath();x.moveTo(0,-9);x.lineTo(6,7);x.lineTo(0,3);x.lineTo(-6,7);x.closePath();x.fill();x.restore();}
}
const PI4=Math.PI/4;
