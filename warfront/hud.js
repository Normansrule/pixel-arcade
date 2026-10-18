// IRON VANGUARD — HUD: tickets + clock, flag strip, capture bar, minimap (pre-rendered valley map), kill feed, radio,
// squad list, class / gadget / weapon / vehicle panels, reticles + lock box, world markers (flags, spotted enemies, downed
// allies), ally tags, deploy screen (class cards + spawn map), scoreboard, menus and results.
import * as THREE from '../vendor/three.module.min.js';
import {EXT,WL,HQ,BRIDGE,PLAY} from './terrain.js';
import {pickers,toast} from '../js/kit3d/ui.js';
const _el={},$=id=>_el[id]||(_el[id]=document.getElementById(id)),cl=(v,a,b)=>v<a?a:v>b?b:v,ang=a=>Math.atan2(Math.sin(a),Math.cos(a));
const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
let R=null;const st={banT:0,annT:0,hitT:0,hurtT:0,promptT:0,dmg:[],tagCache:new Map(),tagT:0,c:{},base:null,flashT:0,dmT:0,dsig:''};
const txt=(el,v,k)=>{if(st.c[k]!==v){st.c[k]=v;el.textContent=v;}},html=(el,v,k)=>{if(st.c[k]!==v){st.c[k]=v;el.innerHTML=v;}};
const pv=new THREE.Vector3();
export const TEAM=['VANGUARD','KORVAN BLOC'],COL=['#4aa8ff','#ff3b30'],SQN=['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF','HOTEL'];
const ownCls=o=>o===0?'own':o===1?'foe':'';

export function init(G,refs){R=refs;
 const seg=pickers(G.opt,G.saveOpt),ui=()=>G.snd.play('ui');seg('o-diff','diff',true,ui);seg('o-len','len',true,ui);seg('o-sens','sens',true,ui);seg('o-vol','vol',true,v=>{G.snd.setVol(v);ui();});
 $('go').onclick=()=>G.start();$('resume').onclick=()=>G.pause(false);$('quit').onclick=()=>G.toMenu();$('again').onclick=()=>G.start();$('omenu').onclick=()=>G.toMenu();
 $('dgo').onclick=()=>G.deployNow();$('dquit').onclick=()=>G.toMenu();
 $('classes').onclick=e=>{const w=e.target.closest('[data-w]');if(w){G.setWeapon(w.dataset.w);G.snd.play('ui');buildClasses(G);return;}const b=e.target.closest('.ccard');if(!b)return;G.setClass(b.dataset.c);G.snd.play('ui');buildClasses(G);};
 $('dmapw').onclick=e=>{const b=e.target.closest('.sp');if(!b)return;G.spawnSel=b.dataset.s;G.snd.play('ui');st.dsig='';deployMap(G);};
 addEventListener('keydown',e=>{if(G.app==='menu'&&e.code==='Enter'&&!$('menu').hidden)G.start();else if(G.app==='play'&&G.deploy&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();G.deployNow();}});
 buildBase(G);}

/* ================= map base (1 px per metre) ================= */
function buildBase(G){const W=G.W,S=800,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
 const n=200,img=x.createImageData(n,n),d=img.data,st4=2*EXT/n;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const wx=-EXT+(i+.5)*st4,wz=-EXT+(j+.5)*st4,h=W.height(wx,wz),k=(j*n+i)*4;let r,g,b;
  if(h<WL){const dd=cl((WL-h)/3,0,1);r=40-dd*14;g=78-dd*20;b=96-dd*16;}
  else{const hx=W.height(wx+2,wz)-W.height(wx-2,wz),hz=W.height(wx,wz+2)-W.height(wx,wz-2),sh=cl(1-(hx*.55-hz*.4)*.18,.55,1.35),t=cl((h-2)/30,0,1),f=W.forestK?W.forestK(wx,wz):0;
   r=(72+t*40-f*22)*sh;g=(88+t*26-f*10)*sh;b=(54+t*26-f*12)*sh;if(Math.max(Math.abs(wx),Math.abs(wz))>PLAY){r*=.55;g*=.55;b*=.55;}}
  d[k]=r;d[k+1]=g;d[k+2]=b;d[k+3]=255;}
 const t=document.createElement('canvas');t.width=t.height=n;t.getContext('2d').putImageData(img,0,0);x.imageSmoothingEnabled=true;x.drawImage(t,0,0,S,S);
 const px=v=>v+EXT;x.lineCap=x.lineJoin='round';
 x.strokeStyle='rgba(215,200,160,.55)';x.lineWidth=5;for(const rd of W.roads){x.beginPath();rd.forEach(([a,b],i)=>i?x.lineTo(px(a),px(b)):x.moveTo(px(a),px(b)));x.stroke();}
 x.fillStyle='rgba(30,44,24,.55)';for(const tr of W.trees)if(tr.alive!==false){x.beginPath();x.arc(px(tr.x),px(tr.z),1.6*(tr.s||1),0,7);x.fill();}
 x.fillStyle='rgba(236,232,222,.85)';for(const h of W.houses){const b=h.box;x.fillRect(px(b.x0)+1,px(b.z0)+1,b.x1-b.x0-2,b.z1-b.z0-2);}
 x.fillStyle='rgba(205,205,200,.9)';x.fillRect(px(BRIDGE.x-BRIDGE.hw),px(BRIDGE.z-BRIDGE.hl),BRIDGE.hw*2,BRIDGE.hl*2);
 for(let t2=0;t2<2;t2++){const h=HQ[t2];x.fillStyle=t2?'rgba(255,59,48,.22)':'rgba(74,168,255,.22)';x.fillRect(px(h.x-34),px(h.z-22),68,44);x.strokeStyle=COL[t2];x.lineWidth=2;x.strokeRect(px(h.x-34),px(h.z-22),68,44);}
 x.strokeStyle='rgba(255,60,40,.5)';x.setLineDash([8,6]);x.lineWidth=2;x.strokeRect(px(-PLAY),px(-PLAY),PLAY*2,PLAY*2);x.setLineDash([]);
 st.base=c;}
function wpos(x,z){return[x+EXT,z+EXT];}
function drawPoint(x,p,a,b,s){const col=p.own===0?'#4aa8ff':p.own===1?'#ff3b30':'#e8e4dc';x.fillStyle='rgba(10,11,13,.55)';x.beginPath();x.arc(a,b,11*s,0,7);x.fill();
 x.strokeStyle=col;x.lineWidth=2.5*s;x.beginPath();x.arc(a,b,11*s,0,7);x.stroke();if(p.prog){x.strokeStyle=p.prog>0?'#4aa8ff':'#ff3b30';x.lineWidth=3*s;x.beginPath();x.arc(a,b,14*s,-Math.PI/2,-Math.PI/2+Math.abs(p.prog)*Math.PI*2*(p.prog>0?1:-1),p.prog<0);x.stroke();}
 x.fillStyle=col;x.font=`${13*s}px Anton, Impact`;x.textAlign='center';x.textBaseline='middle';x.fillText(p.id,a,b+.5*s);}

/* ================= menus ================= */
function rankUI(G){const xp=G.prog.xp,r=R.rankOf(xp),a=R.rankXP(r),b=R.rankXP(r+1);$('rname').textContent=`${r+1} · ${R.RANKS[r]}`;$('rxp').textContent=r>=R.RANKS.length-1?`${xp} XP · MAX RANK`:`${xp-a} / ${b-a} XP TO NEXT RANK`;$('rbar').style.width=(r>=R.RANKS.length-1?100:100*(xp-a)/(b-a))+'%';}
export function showMenu(G){document.body.classList.remove('results');$('menu').hidden=false;$('keys').hidden=false;for(const id of['hud','over','pause','deploy','scope'])$(id).hidden=true;$('hurt').style.opacity=0;$('lowhp').style.opacity=0;rankUI(G);}
export function startMatch(G){document.body.classList.remove('results');for(const id of['menu','keys','over','pause'])$(id).hidden=true;$('hud').hidden=false;for(const id of['feed','radio','xp','dmg','kc'])$(id).innerHTML='';
 $('dead').hidden=true;st.dmg=[];st.c={};st.banT=0;st.dsig='';$('banner').classList.remove('on');$('ann').classList.remove('on');
 html($('flags'),G.points.map(p=>`<div>${p.id}<em></em></div>`).join(''),'flagsInit');st.flagEls=[...$('flags').children];}
export function showPause(on){$('pause').hidden=!on;}
const ICON={assault:'<path d="M6 26h22l4-4h6v4l-4 3H14l-3 6H6z" fill="currentColor"/><circle cx="31" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>',
 medic:'<path d="M16 6h8v10h10v8H24v10h-8V24H6v-8h10z" fill="currentColor"/>',engineer:'<path d="M8 30l14-14m-4-6a7 7 0 0 0 10 10l6 6-4 4-6-6a7 7 0 0 1-10-10l4 4 4-4z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
 recon:'<circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M20 3v10M20 27v10M3 20h10M27 20h10" stroke="currentColor" stroke-width="2.5"/><circle cx="20" cy="20" r="2.5" fill="currentColor"/>'};
export function buildClasses(G){const C=R.CLASSES,cur=G.cls;html($('classes'),Object.keys(C).map(k=>{const c=C[k],on=k===cur;
  return`<button class="ccard${on?' on':''}" data-c="${k}"><svg viewBox="0 0 40 40" style="color:${on?'#ffc95a':'#e8e4dc'}">${ICON[k]}</svg><div><b>${c.name}</b><small>${c.desc}</small>${on?`<div class="wsel">${c.prim.map(w=>`<span data-w="${w}" class="${G.wsel[k]===w?'on':''}">${R.WEAPONS[w].name}</span>`).join('')}</div>`:''}</div></button>`;}).join(''),'cls'+cur+JSON.stringify(G.wsel));}
export function showDeploy(G,on){$('deploy').hidden=!on;if(on){$('hud').hidden=true;buildClasses(G);st.dsig='';deployMap(G);}else $('hud').hidden=!(G.app==='play');}
export function deployMap(G){buildClasses(G);const cv=$('dmap'),x=cv.getContext('2d'),S=cv.width,k=S/800;x.clearRect(0,0,S,S);if(st.base)x.drawImage(st.base,0,0,S,S);
 x.save();x.scale(k,k);for(const v of G.vehicles){if(!v.alive||v.team!==0)continue;const[a,b]=wpos(v.p.x,v.p.z);x.fillStyle='rgba(156,202,255,.9)';x.fillRect(a-4,b-3,8,6);}
 for(const a of G.actors){if(a.team!==0||!a.alive||a.isPlayer)continue;const[ax,az]=wpos(a.pos.x,a.pos.z);x.fillStyle=a.downed?'#ff9a8a':'rgba(124,192,255,.85)';x.beginPath();x.arc(ax,az,2.6,0,7);x.fill();}
 for(const p of G.points){const[a,b]=wpos(p.x,p.z);drawPoint(x,p,a,b,1.6);}x.restore();
 const opts=G.spawnOptions(),sig=opts.map(o=>o.id).join(',')+'|'+G.spawnSel;if(!opts.some(o=>o.id===G.spawnSel))G.spawnSel=opts[0]?opts[0].id:'hq';
 if(sig!==st.dsig){st.dsig=sig;const w=$('dmapw');w.querySelectorAll('.sp').forEach(e=>e.remove());for(const o of opts){const e=document.createElement('div');e.className='sp '+o.kind+(o.id===G.spawnSel?' on':'');e.dataset.s=o.id;e.textContent=o.label;w.appendChild(e);o.el=e;}}
 const w=$('dmapw');const els=w.querySelectorAll('.sp');els.forEach(e=>{const o=opts.find(q=>q.id===e.dataset.s);if(!o)return;e.style.left=((o.x+EXT)/8)+'%';e.style.top=((o.z+EXT)/8)+'%';});
 const sel=opts.find(o=>o.id===G.spawnSel);const c=R.CLASSES[G.cls];html($('dsel'),`<b>${c.name}</b> · ${R.WEAPONS[G.wsel[G.cls]].name} · SPAWN <b>${sel?sel.name:'HQ'}</b>`,'dsel');
 html($('dtix'),`TICKETS <span style="color:#9ccaff">${Math.ceil(G.tickets[0])}</span> — <span style="color:#ff9a90">${Math.ceil(G.tickets[1])}</span> · ${mmss(G.clock)} LEFT`,'dtix');
 const r=G.respawnLeft();txt($('dcnt'),r>0?`REDEPLOY IN ${Math.ceil(r)}`:'READY · ENTER TO DEPLOY','dcnt');$('dgo').disabled=r>0;$('dgo').style.opacity=r>0?.45:1;}

/* ================= events ================= */
export function feed(G,att,v,w,head){if(G.app!=='play')return;const cls=a=>a?(a.isPlayer?'me':a.team===0?'f':'e'):'';
 toast($('feed'),att&&att!==v?`<span class="${cls(att)}">${att.name}</span><span class="w">${head?'<span class="hs">◉ </span>':''}${w||''}</span><span class="${cls(v)}">${v.name}</span>`:`<span class="${cls(v)}">${v.name}</span><span class="w">${w||'DOWN'}</span>`,5000,6);}
export function radio(G,name,text,hq){if(G.app!=='play')return;const d=toast($('radio'),`<b>${name}</b>${text}`,5600,4,false);if(hq)d.className='hq';}
export function banner(G,t,s,col,dur){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('bs').style.display=s?'':'none';$('banner').classList.add('on');st.banT=dur||2;}
export function ann(G,t,dur){$('ann').textContent=t;$('ann').classList.add('on');st.annT=dur||2;}
export function xp(G,n,label){if(G.app!=='play')return;toast($('xp'),`+${n}<small>${label}</small>`,900,3,false);}
export function hitmark(head,kill){const h=$('hit');h.className=kill?'kill':head?'head':'';st.hitT=kill?.5:.24;h.style.transform=`scale(${kill?1.25:1})`;}
export function killConfirm(G,v,label){const d=toast($('kc'),`<b>${label}</b><span>${v.name||v}</span>`,1500,2);if(label==='HEADSHOT')d.className='hs';}
export function hurt(G,src,dm){st.hurtT=Math.min(.7,.25+dm/80);const P=G.player;if(!P||!src)return;const a=Math.atan2(src.x-P.pos.x,src.z-P.pos.z);const el=document.createElement('div');$('dmg').appendChild(el);st.dmg.push({a,t:1.6,el});if(st.dmg.length>6){const o=st.dmg.shift();o.el.remove();}}
export function dead(G,mode,att,w){$('dead').hidden=!mode;if(!mode)return;$('dead').firstChild.textContent=mode==='down'?'DOWNED':'K.I.A.';$('deadby').textContent=att&&att!==G.player&&att.name?`${mode==='down'?'DOWNED':'KILLED'} BY ${att.name}${w?' · '+w:''}`:mode==='down'?'YOU ARE DOWN':'YOU DIED';}
export function prompt(G,t,p){if(!t){st.promptT=0;return;}txt($('ptxt'),t,'pt');$('prompt').querySelector('.pb i').style.width=Math.round((p||0)*100)+'%';$('prompt').querySelector('.pb').style.display=p>0?'':'none';st.promptT=.15;}
export function flash(k){st.flashT=Math.max(st.flashT,k);}

/* ================= minimap ================= */
function drawMini(G){const cv=$('mini'),x=cv.getContext('2d'),P=G.player,W=cv.width,H=cv.height;x.clearRect(0,0,W,H);if(!P||!st.base)return;const vp=G.viewPos,yaw=G.viewYaw,air=P.veh&&(P.veh.kind==='jet'||P.veh.kind==='heli');
 const k=air?(P.veh.kind==='jet'?.36:.62):1.05;x.save();x.beginPath();x.arc(W/2,H/2,W/2,0,7);x.clip();x.fillStyle='#1a2016';x.fillRect(0,0,W,H);x.translate(W/2,H/2);x.rotate(yaw-Math.PI);x.scale(k,k);x.translate(-(vp.x+EXT),-(vp.z+EXT));x.drawImage(st.base,0,0);
 const s=1/k;
 for(const p of G.points){const[a,b]=wpos(p.x,p.z);x.save();x.translate(a,b);x.rotate(-(yaw-Math.PI));drawPoint(x,p,0,0,s);x.restore();}
 for(const v of G.vehicles){if(!v.alive||v.team!==0&&!(v.spotT>G.time))continue;const[a,b]=wpos(v.p.x,v.p.z);x.save();x.translate(a,b);x.rotate(-v.yaw);x.fillStyle=v.team===0?'#9ccaff':'#ff6a5e';
  if(v.kind==='jet'){x.beginPath();x.moveTo(0,7*s);x.lineTo(5*s,-5*s);x.lineTo(-5*s,-5*s);x.fill();}else if(v.kind==='heli'){x.beginPath();x.arc(0,0,4*s,0,7);x.fill();x.fillRect(-.8*s,-9*s,1.6*s,9*s);}else x.fillRect(-3*s,-4.5*s,6*s,9*s);x.restore();}
 for(const a of G.actors){if(!a.alive||a.isPlayer||a.veh)continue;const[ax,az]=wpos(a.pos.x,a.pos.z);
  if(a.team===0){x.save();x.translate(ax,az);x.rotate(-a.yaw);x.fillStyle=a.downed?'#ff9a8a':a.ai&&a.ai.squad===P.squad?'#7dffa8':'#4aa8ff';x.beginPath();x.moveTo(0,5*s);x.lineTo(3.4*s,-3.4*s);x.lineTo(-3.4*s,-3.4*s);x.fill();x.restore();}
  else{const sp=a.spotT>G.time,fire=a.firingT>0&&Math.hypot(a.pos.x-vp.x,a.pos.z-vp.z)<90;if(!sp&&!fire||a.downed)continue;x.fillStyle=`rgba(255,59,48,${sp?1:cl(a.firingT/.6,0,1)})`;x.beginPath();x.arc(ax,az,3.6*s,0,7);x.fill();}}
 for(const n of G.nades){const[a,b]=wpos(n.p.x,n.p.z);x.strokeStyle='#ff3b30';x.lineWidth=1.5*s;x.beginPath();x.arc(a,b,4*s,0,7);x.stroke();}
 x.restore();
 x.save();x.translate(W/2,H/2);x.fillStyle='rgba(255,255,255,.08)';x.beginPath();x.moveTo(0,0);x.arc(0,0,W/2,-Math.PI/2-.55,-Math.PI/2+.55);x.fill();x.fillStyle='#ffd23f';x.beginPath();x.moveTo(0,-8);x.lineTo(6,6);x.lineTo(0,2);x.lineTo(-6,6);x.fill();x.restore();}

/* ================= per-frame ================= */
const markEls=[],tagEls=[];
function pool(arr,host,i){while(arr.length<=i){const d=document.createElement('div');host.appendChild(d);arr.push(d);}return arr[i];}
function project(x,y,z,clamp){pv.set(x,y,z).project(R.cam);let px=pv.x,py=pv.y;const behind=pv.z>1;if(!clamp)return behind||Math.abs(px)>1.05||Math.abs(py)>1.05?null:[(px+1)/2*innerWidth,(1-py)/2*innerHeight];
 if(behind){px=-px;py=-py;}const mg=.9;if(behind||Math.abs(px)>mg||Math.abs(py)>mg){const k=mg/Math.max(Math.abs(px),Math.abs(py),1e-3);px*=k;py*=k;if(behind&&py>-.6)py=-.85;}return[(px+1)/2*innerWidth,(1-py)/2*innerHeight];}
export function update(G,dt){if(st.banT>0){st.banT-=dt;if(st.banT<=0)$('banner').classList.remove('on');}if(st.annT>0){st.annT-=dt;if(st.annT<=0)$('ann').classList.remove('on');}
 st.flashT=Math.max(0,st.flashT-dt*1.4);$('flashov').style.opacity=Math.min(.85,st.flashT);
 if(G.app!=='play'&&G.app!=='paused')return;const P=G.player;if(!P)return;
 if(G.deploy){st.dmT-=dt;if(st.dmT<=0){st.dmT=.4;deployMap(G);}return;}
 const cam=R.cam,V=P.veh;
 // tickets / clock / flags
 const T=G.tickets,MT=G.maxTickets;txt($('tf'),String(Math.ceil(T[0])),'tf');txt($('te'),String(Math.ceil(T[1])),'te');const w0=Math.round(100*T[0]/MT),w1=Math.round(100*T[1]/MT);
 if(st.c.w0!==w0){st.c.w0=w0;$('tfb').style.width=w0+'%';}if(st.c.w1!==w1){st.c.w1=w1;$('teb').style.width=w1+'%';}
 $('tkf').classList.toggle('bleed',G.bleed[0]>0);$('tke').classList.toggle('bleed',G.bleed[1]>0);txt($('clock'),mmss(G.clock),'clk');$('clock').style.color=G.clock<=60?'#ff3b30':'';
 if(st.flagEls)G.points.forEach((p,i)=>{const e=st.flagEls[i],c=ownCls(p.own)+(p.contest?' con':'')+(G.orders&&G.orders[0]===p?' ord':'');if(e._c!==c){e._c=c;e.className=c;}const d=Math.round(Math.hypot(p.x-P.pos.x,p.z-P.pos.z));if(e._d!==d){e._d=d;e.lastChild.textContent=d+'m';}});
 // capture bar
 const cp=G.capPoint;if(cp){$('cap').classList.add('on');const k=cp.prog;txt($('capt'),`${cp.id} · ${cp.name}`,'capt');const u=$('capb');u.style.left=k<0?(50+k*50)+'%':'50%';u.style.width=Math.abs(k)*50+'%';u.style.background=k>0?'#4aa8ff':'#ff3b30';
  txt($('caps'),cp.n0>cp.n1?(cp.own===0&&Math.abs(k)>=1?'SECURED':cp.own===1?'NEUTRALIZING':'CAPTURING')+` · ${cp.n0} v ${cp.n1}`:cp.n1>cp.n0?`LOSING · ${cp.n0} v ${cp.n1}`:cp.n0?`CONTESTED · ${cp.n0} v ${cp.n1}`:'','caps');}else $('cap').classList.remove('on');
 // squad
 if((st.c.sqT=(st.c.sqT||0)-dt)<=0){st.c.sqT=.5;const mates=G.actors.filter(a=>a.team===0&&!a.isPlayer&&a.ai&&a.ai.squad===P.squad);
  html($('squad'),`<h5>SQUAD ${SQN[P.squad]}</h5>`+mates.map(a=>`<div class="${!a.alive||a.downed?'dn':''}">${a.name} · ${R.CLASSES[a.cls].short} · ${!a.alive?'KIA':a.downed?'DOWN':a.veh?R.VSPEC[a.veh.kind].name.split(' ')[0]:Math.round(a.pos.distanceTo(P.pos))+'m'}</div>`).join(''),'sq');}
 // vitals + gadgets
 const C=R.CLASSES[P.cls];html($('cls'),`<span><b>${C.name}</b></span><span>${P.stats.score} PTS</span>`,'clsh');
 const hpw=Math.round(cl((V?P.hp:P.hp)/P.maxHp,0,1)*100);if(st.c.hp!==hpw){st.c.hp=hpw;$('hp').firstChild.style.width=hpw+'%';$('hp').classList.toggle('low',hpw<35);}
 const ab=P.abilityT>0?1-P.abilityT/C.cd:1;html($('gad'),`<div class="${ab>=1?'rdy':''}"><kbd>F</kbd>${C.ability}<em><i style="width:${Math.round(ab*100)}%"></i></em></div>`+(P.cls==='engineer'?`<div class="${P.rpg>0?'rdy':''}"><kbd>3</kbd>RPG ×${P.rpg+(P.slots[2]?P.slots[2].mag:0)}<em><i style="width:${P.rpg+P.slots[2].mag>0?100:0}%"></i></em></div><div><kbd>4</kbd>TORCH<em><i style="width:${Math.round(100*(1-P.heat))}%"></i></em></div>`:'')+`<div class="${P.frags>0?'rdy':''}"><kbd>Q</kbd>FRAG ×${P.frags}<em><i style="width:${P.frags>0?100:0}%"></i></em></div>`,'gad'+Math.round(ab*20)+P.frags+P.rpg+(P.slots[2]?P.slots[2].mag:0)+Math.round(P.heat*10)+P.cls);
 // weapon / vehicle panel
 $('wpn').hidden=!!V;$('veh').hidden=!V;
 if(!V&&P.alive){const s=P.slots[P.cur],w=P.weapon;txt($('wname'),w.name+(P.reloadT>0?' · RELOADING':''),'wn');
  if(w.tool){txt($('amag'),Math.round(100*(1-P.heat))+'%','am');txt($('ares'),P.heat>.98?'OVERHEAT':'','ar');}else{txt($('amag'),String(s.mag),'am');txt($('ares'),'/ '+s.res,'ar');}$('amag').classList.toggle('low',!w.tool&&s.mag<=Math.ceil(w.mag*.25));
  html($('efrag'),'',  'ef');txt($('watt'),w.cls,'wa');}
 if(V){const S=R.VSPEC[V.kind];txt($('vname'),S.name,'vn');txt($('vsub'),S.cls+' · '+S.seats[P.seat],'vs');const vh=Math.round(cl(V.hp/S.hp,0,1)*100);if(st.c.vh!==vh){st.c.vh=vh;$('vhp').firstChild.style.width=vh+'%';$('vhp').classList.toggle('low',vh<30);}
  const spd=Math.round((V.kind==='heli'||V.kind==='jet'?Math.hypot(V.vel.x,V.vel.z,V.vy||0):Math.abs(V.v))*3.6),alt=Math.round(V.p.y-G.W.height(V.p.x,V.p.z));
  html($('vrows'),`<span>SPD<b>${V.kind==='jet'?Math.round(V.speed*3.6):spd}</b></span>`+(V.kind==='heli'||V.kind==='jet'?`<span>ALT<b>${alt}</b></span>`:'')+`<span>HP<b>${Math.ceil(V.hp)}</b></span>`+(V.sys&&(V.kind==='tank'||V.kind==='jeep')?['mob','eng','tur'].map(k=>`<span class="z${V.sys[k]<=0?' dz':V.sys[k]<.5?' wz':''}">${k==='mob'?(V.kind==='tank'?'TRK':'WHL'):k==='eng'?'ENG':'TUR'}<b>${Math.round(V.sys[k]*100)}</b></span>`).join(''):''),'vr'+spd+alt+Math.ceil(V.hp)+(V.sys?Math.round(V.sys.mob*20)+'.'+Math.round(V.sys.eng*20)+'.'+Math.round(V.sys.tur*20):''));
  txt($('vw'),G.vehWeaponText(),'vw');}
 // reticles
 const cr=$('cross');const ret=G.reticle;
 if(V){cr.style.opacity=P.seat===0&&V.kind==='jeep'?0:1;const r=$('vret');if(ret&&ret.pt){const q=project(ret.pt.x,ret.pt.y,ret.pt.z,false);if(q){r.style.display='block';r.style.left=q[0]+'px';r.style.top=q[1]+'px';r.className=ret.sq?'sq':'';r.style.marginLeft=r.style.marginTop='';}else r.style.display='none';}else r.style.display='none';
  const lb=$('lockbox');if(V.lock&&V.lock.alive){const t=V.lock.p,q=project(t.x,t.y+1,t.z,false);if(q){lb.style.display='block';lb.style.left=q[0]+'px';lb.style.top=q[1]+'px';lb.className=V.lockT>=1.2?'on':'';}else lb.style.display='none';}else lb.style.display='none';
  if(st.c.gap!==-1){st.c.gap=-1;cr.children[0].style.top='-12px';cr.children[1].style.top='3px';cr.children[2].style.left='-12px';cr.children[3].style.left='3px';}}
 else{$('vret').style.display='none';$('lockbox').style.display='none';const w=P.weapon,moving=Math.min(1,Math.hypot(P.vel.x,P.vel.z)/5);const spread=(w.hip*(1+moving*w.move*.35+(P.onGround?0:.8))*(P.crouchV>.5?.75:1)+P.bloom);const px=Math.tan(spread*Math.PI/180)/Math.tan(cam.fov*Math.PI/360)*innerHeight/2;
  const gap=Math.round(5+px);cr.style.opacity=P.alive&&!P.downed&&P.adsV<.35&&!(w.scope&&P.adsV>.1)?(P.sprint?0:1-P.adsV*2.5):0;if(st.c.gap!==gap){st.c.gap=gap;cr.children[0].style.top=(-gap-9)+'px';cr.children[1].style.top=gap+'px';cr.children[2].style.left=(-gap-9)+'px';cr.children[3].style.left=gap+'px';}}
 st.hitT=Math.max(0,st.hitT-dt);$('hit').style.opacity=st.hitT>0?Math.min(1,st.hitT*6):0;
 const yawV=G.viewYaw;for(let i=st.dmg.length-1;i>=0;i--){const d=st.dmg[i];d.t-=dt;if(d.t<=0){d.el.remove();st.dmg.splice(i,1);continue;}const rel=ang(d.a-yawV);d.el.style.transform=`rotate(${-rel}rad)`;d.el.style.opacity=Math.min(1,d.t);}
 st.hurtT=Math.max(0,st.hurtT-dt);const low=1-(V?V.hp/V.S.hp:P.hp/P.maxHp);$('hurt').style.opacity=P.alive&&!P.downed?cl(st.hurtT*1.4,0,1):.8;$('lowhp').style.opacity=P.alive&&!P.downed?cl((low-.4)*1.6,0,.9):.6;
 $('scope').hidden=!(P.alive&&!V&&P.weapon.scope&&P.adsV>.92);
 st.promptT-=dt;$('prompt').style.opacity=st.promptT>0?1:0;
 const oob=G.oobT>0;$('oob').style.display=oob?'block':'none';if(oob)txt($('oobt'),'RETURN WITHIN '+Math.ceil(G.oobT)+'s','oob');
 // grenade warnings
 const nh=$('nades');let ni=0;if(!V)for(const n of G.nades){if(n.owner===P)continue;const d=Math.hypot(n.p.x-P.pos.x,n.p.z-P.pos.z);if(d>9)continue;const rel=ang(Math.atan2(n.p.x-P.pos.x,n.p.z-P.pos.z)-yawV);const el=pool(st.nadeEls||(st.nadeEls=[]),nh,ni++);el.style.display='grid';el.textContent=Math.round(d)+'m';
  el.style.left=(innerWidth/2+Math.sin(-rel)*120)+'px';el.style.top=(innerHeight/2-Math.cos(-rel)*120)+'px';}if(st.nadeEls)for(let i=ni;i<st.nadeEls.length;i++)st.nadeEls[i].style.display='none';
 // world markers: flags, spotted enemies, downed allies
 const vp=G.viewPos;let mi=0;const mk=(x,y,z,cls,label,clamp,key)=>{const q=project(x,y,z,clamp);if(!q)return;if(cls.startsWith('flag')&&q[1]<150)q[1]=150;const el=pool(markEls,$('marks'),mi++);if(el._c!==cls){el._c=cls;el.className=cls;}el.style.display='';el.style.left=q[0]+'px';el.style.top=q[1]+'px';if(el._l!==key){el._l=key;el.innerHTML=label;}};
 for(const p of G.points){const d=Math.round(Math.hypot(p.x-vp.x,p.z-vp.z));if(d<p.r*.7&&!V)continue;{const od=G.orders&&G.orders[0]===p;mk(p.x,p.y+11,p.z,'flag '+ownCls(p.own)+(od?' ord':''),`<i></i><b>${p.id}</b>${od?(p.own===0?'DEFEND ':'ATTACK '):''}${d}m`,false,p.id+d+p.own+od);}}
 for(const a of G.actors){if(!a.alive||a.isPlayer)continue;if(a.team===1&&a.spotT>G.time&&!a.downed){const d=a.pos.distanceTo(vp);if(d<350)mk(a.pos.x,a.pos.y+(a.veh?3.4:2.25),a.pos.z,'spot','<i></i>',false,'s');}
  else if(a.team===0&&a.downed){const d=a.pos.distanceTo(vp);if(d<(P.cls==='medic'?80:30))mk(a.pos.x,a.pos.y+1.1,a.pos.z,'rev',`<i></i>${P.cls==='medic'?'REVIVE ':''}${Math.round(d)}m`,P.cls==='medic'&&d<40,'r'+Math.round(d));}}
 for(const v of G.vehicles){if(!v.alive||v.team!==1||!(v.spotT>G.time))continue;mk(v.p.x,v.p.y+4.5,v.p.z,'spot','<i></i>',false,'s');}
 for(let i=mi;i<markEls.length;i++)markEls[i].style.display='none';
 // ally name tags (cached LOS)
 st.tagT-=dt;const reLOS=st.tagT<=0;if(reLOS)st.tagT=.3;let ti=0;for(const a of G.actors){if(!a.alive||a.team!==0||a.isPlayer||a.veh||a.downed)continue;const d=a.pos.distanceTo(vp);if(d>55)continue;
  if(reLOS){pv.set(a.pos.x,a.pos.y+1.5,a.pos.z);st.tagCache.set(a.id,G.W.los(cam.position,pv));}if(!st.tagCache.get(a.id))continue;const q=project(a.pos.x,a.pos.y+(a.crouchV>.5?1.5:2.05),a.pos.z,false);if(!q)continue;
  const el=pool(tagEls,$('tags'),ti++);const sq=a.ai&&a.ai.squad===P.squad?'sq':'';if(el._c!==sq){el._c=sq;el.className=sq;}el.style.display='';el.style.left=q[0]+'px';el.style.top=q[1]+'px';el.style.opacity=d>30?.6:1;const nm=a.name+(sq?' · '+R.CLASSES[a.cls].short:'');if(el._n!==nm){el._n=nm;el.textContent=nm;}}
 for(let i=ti;i<tagEls.length;i++)tagEls[i].style.display='none';
 if(P.downed)txt($('deadt'),`BLEEDING OUT ${Math.ceil(P.downT)}`,'dt');else if(!P.alive)txt($('deadt'),'','dt');
 txt($('deadh'),P.downed?(G.medicNear?'A MEDIC IS ON THE WAY · HOLD SPACE TO GIVE UP':'HOLD SPACE TO GIVE UP'):'','dh');
 const sb=$('board');sb.hidden=!G.scoreboard;if(G.scoreboard&&(st.c.sbT=(st.c.sbT||0)-dt)<=0){st.c.sbT=.25;sb.innerHTML=boardHTML(G);}
 drawMini(G);}
function rowsOf(G,t){return G.actors.filter(a=>a.team===t).sort((a,b)=>b.stats.score-a.stats.score);}
function boardHTML(G){const row=a=>`<tr class="t${a.team}${a.isPlayer?' me':''}${a.alive&&!a.downed?'':' dead'}"><td>${a.name}</td><td>${R.CLASSES[a.cls].short}</td><td>${a.stats.score}</td><td>${a.stats.kills}</td><td>${a.stats.deaths}</td></tr>`,hd=`<tr><th>SOLDIER</th><th>KIT</th><th>SCORE</th><th>K</th><th>D</th></tr>`;
 return`<h4>CONQUEST · <span style="color:#9ccaff">${Math.ceil(G.tickets[0])}</span> — <span style="color:#ff9a90">${Math.ceil(G.tickets[1])}</span></h4><div class="cols"><table>${hd}${rowsOf(G,0).map(row).join('')}</table><table>${hd}${rowsOf(G,1).map(row).join('')}</table></div>`;}

/* ================= results ================= */
export function showOver(G){$('hud').hidden=true;$('deploy').hidden=true;$('scope').hidden=true;$('hurt').style.opacity=0;$('lowhp').style.opacity=0;const a=G.lastAward,o=G.over;
 $('oeye').textContent=`CONQUEST · ASHVALE VALLEY · ${G.lenName} · ${G.diff.n}`;$('ores').textContent=o.title;$('ores').style.color=o.res==='win'?'#5fe08a':o.res==='draw'?'#ffd23f':'#ff3b30';
 $('ofs').innerHTML=`<span class="f">${Math.ceil(G.tickets[0])}</span> — <span class="e">${Math.ceil(G.tickets[1])}</span> <small style="font:700 11px var(--mono);letter-spacing:.16em;color:#bbb">${o.sub||''}</small>`;
 const row=r=>`<tr class="t${r.team}${r.isPlayer?' me':''}"><td>${r.name}</td><td>${R.CLASSES[r.cls].short}</td><td>${r.stats.score}</td><td>${r.stats.kills}</td><td>${r.stats.deaths}</td><td>${r.stats.revives||0}</td></tr>`,hd='<tr><th>SOLDIER</th><th>KIT</th><th>SCORE</th><th>K</th><th>D</th><th>REV</th></tr>';
 const r0s=rowsOf(G,0),top=r0s.slice(0,10);if(!top.includes(G.player))top[9]=G.player;$('stats').innerHTML=`<table>${hd}${top.map(row).join('')}</table><table>${hd}${rowsOf(G,1).slice(0,10).map(row).join('')}</table>`;
 const r0=R.rankOf(a.xpBefore),r1=R.rankOf(a.xpAfter),lo=R.rankXP(r1),hi=R.rankXP(r1+1);$('oxpt').textContent=`+${a.pts} XP · ${r1>r0?'PROMOTED TO ':'RANK '}${r1+1} ${R.RANKS[r1]}${r1>r0?'!':''} · ${a.kills} KILLS · ${a.caps} FLAGS · ${a.revives} REVIVES`;$('oxpb').style.width='0%';
 setTimeout(()=>{$('oxpb').style.width=(r1>=R.RANKS.length-1?100:100*(a.xpAfter-lo)/(hi-lo))+'%';},60);if(r1>r0)G.snd.play('rank');
 $('otok').textContent=`+${a.tok} TOKENS · ${a.pts} POINTS · BEST ${G.best()}`;$('over').hidden=false;document.body.classList.add('results');}
