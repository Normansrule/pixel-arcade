// FRONTLINE OPS — HUD (minimap, feed, radio, markers, hit/kill confirms, damage + grenade indicators, streaks, flags),
// cinematic title cards, menus, loadout and results.
import * as THREE from '../vendor/three.module.min.js';
import {MAP_LIST} from './maps.js';
import {MODE_INFO} from './modes.js';
import {toast} from '../js/kit3d/ui.js';
const _el={},$=id=>_el[id]||(_el[id]=document.getElementById(id)),cl=(v,a,b)=>v<a?a:v>b?b:v,ang=a=>Math.atan2(Math.sin(a),Math.cos(a));
const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
let R=null;const st={banT:0,annT:0,hitT:0,hurtT:0,promptT:0,dmg:[],tagCache:new Map(),tagT:0,c:{},base:null,baseHalf:60,sweep:0,flashT:0};
const txt=(el,v,k)=>{if(st.c[k]!==v){st.c[k]=v;el.textContent=v;}},html=(el,v,k)=>{if(st.c[k]!==v){st.c[k]=v;el.innerHTML=v;}};
const V=THREE.Vector3,pv=new V();
const SKYDOT={sandgate:'#e8c890',harbor:'#ff9a5a',northwatch:'#cfe0f4',oldquarter:'#8a7ac8'};

export function init(G,refs){R=refs;
 const seg=(id,get,set,cast=x=>x)=>{const el=$(id);const upd=()=>el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(get())===b.dataset.v));el.onclick=e=>{const b=e.target.closest('button');if(!b||b.classList.contains('lock'))return;set(cast(b.dataset.v));upd();G.saveOpt();menuDesc(G);G.snd.play('ui');};upd();return upd;};
 const o=G.opt;st.updMode=seg('o-mode',()=>o.mode,v=>{o.mode=v;buildSub(G);G.menuMap&&G.menuMap();});seg('o-diff',()=>o.diff,v=>o.diff=v,Number);
 seg('o-sens',()=>o.sens,v=>o.sens=v,Number);seg('o-vol',()=>o.vol,v=>{o.vol=v;G.snd.setVol(v);},Number);buildSub(G);
 $('go').onclick=()=>G.start();$('loadbtn').onclick=()=>showLoadout(G,true);$('ldone').onclick=()=>showLoadout(G,false);
 $('resume').onclick=()=>G.pause(false);$('quit').onclick=()=>G.toMenu();$('again').onclick=()=>G.start();$('omenu').onclick=()=>G.toMenu();
 addEventListener('keydown',e=>{if(G.app==='menu'&&e.code==='Enter'&&!$('menu').hidden)G.start();});}
function buildSub(G){const o=G.opt,el=$('o-sub');let items;
 if(o.mode==='campaign'){items=R.MISSIONS.map((m,i)=>[String(i),`${i+1} · ${m.name}`,m.tag,SKYDOT[m.map]]);el.classList.add('three');}
 else{items=MAP_LIST.map(m=>[m.id,m.name,m.tag,SKYDOT[m.id]]);el.classList.remove('three');if(!MAP_LIST.some(m=>m.id===o.map))o.map='sandgate';}
 const cur=()=>o.mode==='campaign'?String(o.mission||0):o.map;
 el.innerHTML=items.map(([v,n,t,c])=>`<button data-v="${v}"><b>${n}</b><small>${t}</small><i style="background:${c}"></i></button>`).join('');const upd=()=>el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===cur()));
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(o.mode==='campaign')o.mission=+b.dataset.v;else o.map=b.dataset.v;upd();G.saveOpt();menuDesc(G);G.snd.play('ui');G.menuMap&&G.menuMap();};upd();menuDesc(G);}
function menuDesc(G){const o=G.opt;let d;if(o.mode==='campaign'){const m=R.MISSIONS[o.mission||0];d=`<b>${m.name}</b> — ${m.desc} ${mmss(m.time)} clock, 3 lives, checkpoints.`;}
 else d=`<b>${{tdm:'TEAM DEATHMATCH',dom:'DOMINATION',survival:'SURVIVAL'}[o.mode]}</b> — ${MODE_INFO[o.mode]}`;$('mdesc').innerHTML=d;}
function rankUI(G){const xp=G.prog.xp,r=R.rankOf(xp),a=R.rankXP(r),b=R.rankXP(r+1);$('rname').textContent=`${r+1} · ${R.RANKS[r]}`;$('rxp').textContent=r>=R.RANKS.length-1?`${xp} XP · MAX RANK`:`${xp-a} / ${b-a} XP TO NEXT RANK`;$('rbar').style.width=(r>=R.RANKS.length-1?100:100*(xp-a)/(b-a))+'%';}
export function showMenu(G){document.body.classList.remove('results');$('hud').style.visibility='';$('menu').hidden=false;$('keys').hidden=false;$('hud').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('load').hidden=true;$('scope').hidden=true;$('cine').hidden=true;$('hurt').style.opacity=0;$('lowhp').style.opacity=0;rankUI(G);st.updMode&&st.updMode();buildSub(G);}
export function startMatch(G){document.body.classList.remove('results');$('hud').style.visibility='';for(const id of['menu','keys','over','pause','load'])$(id).hidden=true;$('hud').hidden=false;for(const id of['feed','radio','xp','dmg','kc'])$(id).innerHTML='';
 $('dead').hidden=true;$('objbar').style.display='none';st.dmg=[];st.c={};st.banT=0;$('banner').classList.remove('on');$('ann').classList.remove('on');$('flags').innerHTML='';}
export function showPause(on){$('pause').hidden=!on;}
function showLoadout(G,on){$('load').hidden=!on;$('menu').hidden=on;$('keys').hidden=on;if(on)buildLoadout(G);else{G.saveLoad();rankUI(G);}}
function buildLoadout(G){const L=G.load,W=R.WEAPONS,rank=R.rankOf(G.prog.xp)+1;
 $('lweap').innerHTML=R.PRIMARIES.map(id=>`<button data-w="${id}" class="${L.primary===id?'on':''}">${W[id].name}<small>${W[id].cls}</small></button>`).join('')+`<div class="sec">SECONDARY <b>${W.pistol.name}</b><br>LETHAL <b>FRAG ×2</b> · TACTICAL <b>SMOKE ×1</b><br>RANK <b>${rank} · ${R.RANKS[rank-1]}</b></div>`;
 $('lweap').onclick=e=>{const b=e.target.closest('button');if(!b)return;L.primary=b.dataset.w;G.snd.play('ui');buildLoadout(G);G.previewGun&&G.previewGun();};
 const w=W[L.primary],att=L.att[L.primary]=L.att[L.primary]||{};const bar=(n,v)=>`<div class="stat">${n}<div><i style="width:${Math.round(cl(v,.04,1)*100)}%"></i></div></div>`;
 $('ldetail').innerHTML=`<h4>${w.name}</h4><p class="cls">${w.cls} · ${w.mag} ROUNDS · ${w.rpm} RPM</p>${bar('DAMAGE',(w.dmg[0]*(w.pellets||1)*.6)/110)}${bar('FIRE RATE',w.rpm/950)}${bar('RANGE',w.range[1]/140)}${bar('MOBILITY',(w.speed-.85)/.25)}${bar('CONTROL',1-w.recoil[0]/3.6)}
  <div class="atts">${w.att.map(k=>{const a=R.ATT[k],lock=rank<a.rank;return`<button data-a="${k}" class="${att[k]&&!lock?'on':''} ${lock?'lock':''}">${a.name}<small>${lock?'UNLOCKS AT RANK '+a.rank:a.desc}</small></button>`;}).join('')}</div>`;
 $('ldetail').onclick=e=>{const b=e.target.closest('button');if(!b||b.classList.contains('lock'))return;const k=b.dataset.a;att[k]=att[k]?0:1;G.snd.play('ui');buildLoadout(G);};}

/* ================= cinematic title card ================= */
export function cine(G,on,lines,t){const el=$('cine');el.hidden=!on;$('hud').style.visibility=on?'hidden':'';if(!on||!lines)return;txt($('cop'),lines[0],'cop');txt($('cwh'),lines[1],'cwh');
 const s=lines[2]||'',n=Math.floor(cl((t-1.2)*42,0,s.length));txt($('cln'),s.slice(0,n),'cln');}

/* ================= minimap ================= */
export function mapChanged(G){const L=G.level,s=4,N=L.half*2*s;const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');
 x.fillStyle='rgba(150,150,140,.14)';x.fillRect(0,0,N,N);x.fillStyle='rgba(220,220,210,.16)';for(const r of L.roads){x.save();x.translate((r.x+L.half)*s,(r.z+L.half)*s);x.rotate(-(r.rot||0));x.fillRect(-r.w/2*s,-r.len/2*s,r.w*s,r.len*s);x.restore();}
 for(const b of L.boxes){if(!b.solid||b.y0>2.5||b.y1<.5||b.pass)continue;const tall=b.y1>1.6;x.fillStyle=tall?'rgba(232,236,240,.6)':'rgba(205,210,215,.32)';x.fillRect((b.x0+L.half)*s,(b.z0+L.half)*s,Math.max(1,(b.x1-b.x0)*s),Math.max(1,(b.z1-b.z0)*s));}
 for(const b of L.blds){x.fillStyle='rgba(170,175,180,.35)';x.fillRect((b.x0+L.half)*s,(b.z0+L.half)*s,(b.x1-b.x0)*s,(b.z1-b.z0)*s);}
 st.base=c;st.baseHalf=L.half;st.baseS=s;}
function drawMini(G){const cv=$('mini'),x=cv.getContext('2d'),P=G.player,W=cv.width,H=cv.height,k=1.5,s=st.baseS,hf=st.baseHalf;x.clearRect(0,0,W,H);if(!P||!st.base)return;
 x.save();x.beginPath();x.arc(W/2,H/2,W/2,0,7);x.clip();x.translate(W/2,H/2);x.rotate(P.yaw-Math.PI);x.scale(k/s,k/s);x.translate(-(P.pos.x+hf)*s,-(P.pos.z+hf)*s);x.drawImage(st.base,0,0);
 const wp=(p)=>[(p.x+hf)*s,(p.z+hf)*s];const sc=s/k;
 if(G.mode&&G.mode.marks)for(const m of G.mode.marks()){const[a,b]=wp(m.p);if(m.flag){const f=m.flag;x.fillStyle=f.own===0?'#4aa8ff':f.own===1?'#ff3b30':'#e8e4dc';x.beginPath();x.arc(a,b,9*sc,0,7);x.fill();x.fillStyle='#111';x.font=`${12*sc}px Anton, Impact`;x.textAlign='center';x.textBaseline='middle';x.fillText(f.id,a,b+.5*sc);continue;}
  x.fillStyle=m.cls==='vip'?'#5fe08a':'#ffd23f';x.save();x.translate(a,b);x.rotate(Math.PI/4);x.fillRect(-5*sc,-5*sc,10*sc,10*sc);x.restore();}
 const uav=G.streak.uav>0;if(uav)st.sweep=(st.sweep+.016*2.2)%(Math.PI*2);
 for(const a of G.actors){if(!a.alive||a.isPlayer)continue;const[ax,az]=wp(a.pos);
  if(a.team===0){x.save();x.translate(ax,az);x.rotate(-a.yaw);x.fillStyle=a.vip?'#5fe08a':'#4aa8ff';x.beginPath();x.moveTo(0,6*sc);x.lineTo(4*sc,-4*sc);x.lineTo(-4*sc,-4*sc);x.fill();x.restore();}
  else{const shown=uav||(a.firingT>0&&!(a.att&&a.att.supp));if(!shown)continue;x.fillStyle=`rgba(255,59,48,${uav?1:cl(a.firingT/.6,0,1)})`;x.beginPath();x.arc(ax,az,4.4*sc,0,7);x.fill();}}
 for(const n of G.nades){if(n.kind!=='frag')continue;const[a,b]=wp(n.p);x.strokeStyle='#ff3b30';x.lineWidth=1.5*sc;x.beginPath();x.arc(a,b,5*sc,0,7);x.stroke();}
 if(G.streak.drone){const[a,b]=wp(G.streak.drone.pos);x.fillStyle='#ffd23f';x.fillRect(a-3*sc,b-3*sc,6*sc,6*sc);}
 if(G.streak.air&&G.streak.air.tgt){const[a,b]=wp(G.streak.air.tgt);x.strokeStyle='#ff4d00';x.lineWidth=2*sc;x.beginPath();x.arc(a,b,10*sc,0,7);x.stroke();}
 x.restore();
 if(uav){x.save();x.translate(W/2,H/2);x.rotate(st.sweep);const g=x.createLinearGradient(0,0,W/2,0);g.addColorStop(0,'rgba(255,210,63,0)');g.addColorStop(1,'rgba(255,210,63,.4)');x.strokeStyle=g;x.lineWidth=3;x.beginPath();x.moveTo(0,0);x.lineTo(W/2,0);x.stroke();x.restore();}
 x.save();x.translate(W/2,H/2);x.fillStyle='rgba(255,255,255,.08)';x.beginPath();x.moveTo(0,0);x.arc(0,0,W/2,-Math.PI/2-.6,-Math.PI/2+.6);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(0,-8);x.lineTo(6,6);x.lineTo(0,2);x.lineTo(-6,6);x.fill();x.restore();}

/* ================= events ================= */
export function feed(G,att,v,w,head){if(G.app!=='play')return;const cls=a=>a?(a.isPlayer?'me':a.team===0?'f':'e'):'';
 toast($('feed'),att&&att!==v?`<span class="${cls(att)}">${att.name}</span><span class="w">${head?'<span class="hs">◉ </span>':''}${w||''}</span><span class="${cls(v)}">${v.name}</span>`:`<span class="${cls(v)}">${v.name}</span><span class="w">${w==='FALL'?'FELL':'DOWN'}</span>`,5000,6);}
export function radio(G,name,text,hq){const d=toast($('radio'),`<b>${name}</b>${text}`,5600,4,false);if(hq)d.className='hq';}
export function banner(G,t,s,col,dur){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('bs').style.display=s?'':'none';$('banner').classList.add('on');st.banT=dur||2;}
export function ann(G,t,dur){$('ann').textContent=t;$('ann').classList.add('on');st.annT=dur||2;}
export function xp(G,n,label){if(G.xpGain)G.xpGain(n);toast($('xp'),`+${n}<small>${label}</small>`,900,3,false);}
export function hitmark(head,kill){const h=$('hit');h.className=kill?'kill':head?'head':'';st.hitT=kill?.5:.24;h.style.transform=`scale(${kill?1.25:1})`;}
export function killConfirm(G,v,head,kind){const d=toast($('kc'),`<b>${head?'HEADSHOT':kind==='knife'?'MELEE':kind==='frag'?'GRENADE':'ELIMINATED'}</b><span>${v.name}</span>`,1500,2);if(head)d.className='hs';}
export function hurt(G,att,dm){st.hurtT=Math.min(.7,.25+dm/80);const P=G.player;if(!P||!att||!att.pos)return;const a=Math.atan2(att.pos.x-P.pos.x,att.pos.z-P.pos.z);const el=document.createElement('div');$('dmg').appendChild(el);st.dmg.push({a,t:1.6,el});if(st.dmg.length>6){const o=st.dmg.shift();o.el.remove();}}
export function dead(G,on,att,w){$('dead').hidden=!on;if(on){$('deadby').textContent=att&&att!==G.player&&att.name?`KILLED BY ${att.name}${w?' · '+w:''}`:'YOU DIED';}}
export function objective(){st.c.objt=null;}
export function objBar(G,v){const b=$('objbar');if(v<0){b.style.display='none';return;}b.style.display='block';b.firstChild.style.width=Math.round(cl(v,0,1)*100)+'%';}
export function prompt(G,t,p){if(!t){st.promptT=0;return;}txt($('ptxt'),t,'pt');$('prompt').querySelector('.pb i').style.width=Math.round((p||0)*100)+'%';st.promptT=.15;}
export function flash(k){st.flashT=Math.max(st.flashT,k);}

/* ================= per-frame ================= */
const markEls=[],tagEls=[];
function pool(arr,host,i){while(arr.length<=i){const d=document.createElement('div');host.appendChild(d);arr.push(d);}return arr[i];}
export function update(G,dt){if(st.banT>0){st.banT-=dt;if(st.banT<=0)$('banner').classList.remove('on');}if(st.annT>0){st.annT-=dt;if(st.annT<=0)$('ann').classList.remove('on');}
 st.flashT=Math.max(0,st.flashT-dt*1.4);$('flashov').style.opacity=Math.min(.85,st.flashT);
 if(G.app!=='play'&&G.app!=='paused')return;const P=G.player,M=G.mode;if(!P||!M)return;const cam=G.cam,w=P.weapon,s=P.slots[P.cur];
 const t=M.top();const top=$('top');top.classList.toggle('solo',!!t.solo);if(!t.solo){txt($('sf'),String(t.f),'sf');txt($('se'),String(t.e),'se');}txt($('clock'),mmss(t.clock),'clk');txt($('clkl'),t.lbl,'clkl');$('clock').style.color=t.clock<=30?'#ff3b30':'';
 if(t.flags)html($('flags'),t.flags.map(f=>`<div class="${f.own===0?'own':f.own===1?'foe':''}${f.contested?' con':''}">${f.id}</div>`).join(''),'fl');
 const ot=M.objText();txt($('objt'),ot[0],'objt');txt($('objs'),ot[1],'objs');
 // weapon panel
 const ms=Math.round(R.WEAPONS[s.id].mag*(s.att.ext?1.5:1));txt($('wname'),w.name+(P.reloadT>0?' · RELOADING':''),'wn');txt($('amag'),String(s.mag),'am');$('amag').classList.toggle('low',s.mag<=ms*.25);txt($('ares'),'/ '+s.res,'ar');
 html($('efrag'),'<i'+(P.frags>0?'':' class="x"')+'></i><i'+(P.frags>1?'':' class="x"')+'></i>','ef');html($('esmoke'),'<u'+(P.smokes?'':' class="x"')+'></u>','es');txt($('watt'),Object.keys(s.att).filter(k=>s.att[k]).map(k=>R.ATT[k].name).join(' · '),'wa');
 const hpw=Math.round(cl(P.hp/P.maxHp,0,1)*100);if(st.c.hp!==hpw){st.c.hp=hpw;$('hp').firstChild.style.width=hpw+'%';$('hp').classList.toggle('low',hpw<35);}
 // streak cards
 const ks=P.ks||{},sk=[['uav',3,'UAV',3],['air',5,'AIRSTRIKE',4],['drone',7,'DRONE',5]];html($('streaks'),sk.map(([k,n,nm,key])=>{const v=ks[k];const on=(k==='uav'&&G.streak.uav>0)||(k==='drone'&&G.streak.drone)||(k==='air'&&(G.streak.air||G.streak.designate));
  return`<div class="${v===1?'rdy':on?'on':''}"><kbd>${key}</kbd>${nm}<em><i style="width:${v===1||on?100:Math.round(100*Math.min(P.streak,n)/n)}%"></i></em></div>`;}).join(''),'sk');
 // crosshair spread
 const moving=Math.min(1,Math.hypot(P.vel.x,P.vel.z)/5);const spread=(w.hip*(1+moving*w.move*.35+(P.onGround?0:.8))*(P.crouchV>.5?.75:1)+P.bloom);const px=Math.tan(spread*Math.PI/180)/Math.tan(cam.fov*Math.PI/360)*innerHeight/2;
 const gap=Math.round(5+px),cr=$('cross');cr.style.opacity=P.alive&&!G.streak.designate&&P.adsV<.35&&!(w.scope&&P.adsV>.1)?(P.sprint?0:1-P.adsV*2.5):0;if(st.c.gap!==gap){st.c.gap=gap;cr.children[0].style.top=(-gap-9)+'px';cr.children[1].style.top=gap+'px';cr.children[2].style.left=(-gap-9)+'px';cr.children[3].style.left=gap+'px';}
 st.hitT=Math.max(0,st.hitT-dt);$('hit').style.opacity=st.hitT>0?Math.min(1,st.hitT*6):0;
 for(let i=st.dmg.length-1;i>=0;i--){const d=st.dmg[i];d.t-=dt;if(d.t<=0){d.el.remove();st.dmg.splice(i,1);continue;}const rel=ang(d.a-P.yaw);d.el.style.transform=`rotate(${-rel}rad)`;d.el.style.opacity=Math.min(1,d.t);}
 st.hurtT=Math.max(0,st.hurtT-dt);const low=1-P.hp/P.maxHp;$('hurt').style.opacity=P.alive?cl(st.hurtT*1.4,0,1):.8;$('lowhp').style.opacity=P.alive?cl((low-.35)*1.6,0,.9):.6;
 $('scope').hidden=!(P.alive&&w.scope&&P.adsV>.92);
 st.promptT-=dt;$('prompt').style.opacity=st.promptT>0?1:0;
 // grenade warnings
 const nh=$('nades');let ni=0;for(const n of G.nades){if(n.kind!=='frag'||n.owner===P)continue;const d=Math.hypot(n.p.x-P.pos.x,n.p.z-P.pos.z);if(d>9)continue;const rel=ang(Math.atan2(n.p.x-P.pos.x,n.p.z-P.pos.z)-P.yaw);const el=pool(st.nadeEls||(st.nadeEls=[]),nh,ni++);el.style.display='grid';el.textContent=Math.round(d)+'m';
  el.style.left=(innerWidth/2+Math.sin(-rel)*120)+'px';el.style.top=(innerHeight/2-Math.cos(-rel)*120)+'px';}if(st.nadeEls)for(let i=ni;i<st.nadeEls.length;i++)st.nadeEls[i].style.display='none';
 // world markers
 const ms2=M.marks?M.marks():[];let mi=0;for(const m of ms2){if(!m.p)continue;pv.set(m.p.x,(m.p.y||0)+(m.h||1.4),m.p.z).project(cam);let x=pv.x,y=pv.y;const behind=pv.z>1;if(behind){x=-x;y=-y;}
  const mg=.9;if(behind||Math.abs(x)>mg||Math.abs(y)>mg){const k=mg/Math.max(Math.abs(x),Math.abs(y),1e-3);x*=k;y*=k;if(behind&&y>-.6)y=-.85;}
  const el=pool(markEls,$('marks'),mi++);el.className=m.cls||'';el.style.display='';el.style.left=((x+1)/2*innerWidth)+'px';el.style.top=((1-y)/2*innerHeight)+'px';const d=Math.round(Math.hypot(m.p.x-P.pos.x,m.p.z-P.pos.z));
  html(el,m.flag?`<i></i><b>${m.label}</b>${d}m`:`<i></i>${m.label} ${d}m`,'mk'+mi+m.cls+m.label+d);}
 for(let i=mi;i<markEls.length;i++)markEls[i].style.display='none';
 // ally name tags (cached LOS)
 st.tagT-=dt;const reLOS=st.tagT<=0;if(reLOS)st.tagT=.3;let ti=0;for(const a of G.actors){if(!a.alive||a.team!==0||a.isPlayer)continue;const d=a.pos.distanceTo(P.pos);if(d>40)continue;
  if(reLOS){pv.set(a.pos.x,a.pos.y+1.5,a.pos.z);st.tagCache.set(a.id,G.level.los(cam.position,pv));}if(!st.tagCache.get(a.id))continue;pv.set(a.pos.x,a.pos.y+(a.crouchV>.5?1.5:2.05),a.pos.z).project(cam);if(pv.z>1||Math.abs(pv.x)>1||Math.abs(pv.y)>1)continue;
  const el=pool(tagEls,$('tags'),ti++);el.className=a.vip?'vip':'';el.style.display='';el.style.left=((pv.x+1)/2*innerWidth)+'px';el.style.top=((1-pv.y)/2*innerHeight)+'px';el.style.opacity=d>25?.6:1;if(el._n!==a.name){el._n=a.name;el.textContent=a.name;}}
 for(let i=ti;i<tagEls.length;i++)tagEls[i].style.display='none';
 if(!P.alive){const r=M.respawnLeft?M.respawnLeft():0;txt($('deadt'),G.over?'':r>0?'REDEPLOY IN '+Math.ceil(r):'','dt');}
 const sb=$('board');sb.hidden=!G.scoreboard;if(G.scoreboard&&(st.c.sbT=(st.c.sbT||0)-dt)<=0){st.c.sbT=.25;sb.innerHTML=boardHTML(G);}
 drawMini(G);}
function boardHTML(G){const rows=G.actors.filter(a=>!a.vip).sort((a,b)=>a.team-b.team||b.stats.score-a.stats.score);const M=G.mode;
 return`<h4>${M.label}${M.score?` · ${M.score[0]} — ${M.score[1]}`:''}</h4><table><tr><th>OPERATOR</th><th>SCORE</th><th>K</th><th>D</th><th>A</th></tr>${rows.map(a=>`<tr class="t${a.team}${a.isPlayer?' me':''}${a.alive?'':' dead'}"><td>${a.name}</td><td>${a.stats.score}</td><td>${a.stats.kills}</td><td>${a.stats.deaths}</td><td>${a.stats.assists}</td></tr>`).join('')}</table>`;}

/* ================= results ================= */
export function showOver(G){$('hud').hidden=true;$('scope').hidden=true;$('hurt').style.opacity=0;$('lowhp').style.opacity=0;const a=G.lastAward,M=G.mode,P=G.player,o=G.over;
 $('oeye').textContent=`${M.label} · ${G.level.name} · ${G.level.look.name} · ${G.diff.n}`;$('ores').textContent=o.title;$('ores').style.color=o.res==='win'?'#5fe08a':o.res==='draw'?'#ffd23f':'#ff3b30';
 $('ofs').innerHTML=M.score?`<span class="f">${M.score[0]}</span> — <span class="e">${M.score[1]}</span>`:o.sub||'';
 const acc=P.stats.shots?Math.round(100*P.stats.hits/P.stats.shots):0;
 const row=r=>`<tr class="t${r.team}${r.isPlayer?' me':''}"><td>${r.name}</td><td>${r.stats.score}</td><td>${r.stats.kills}</td><td>${r.stats.deaths}</td><td>${r.stats.assists}</td></tr>`,hd='<tr><th>OPERATOR</th><th>SCORE</th><th>K</th><th>D</th><th>A</th></tr>';
 if(M.score){const t0=G.actors.filter(x=>!x.vip&&x.team===0).sort((x,y)=>y.stats.score-x.stats.score),t1=G.actors.filter(x=>!x.vip&&x.team===1).sort((x,y)=>y.stats.score-x.stats.score);
  $('stats').innerHTML=`<table>${hd}${t0.map(row).join('')}</table><table>${hd}${t1.map(row).join('')}</table>`;}
 else $('stats').innerHTML=`<table><tr><th>OPERATOR</th><th>POINTS</th><th>K</th><th>D</th><th>HS</th><th>ACC</th></tr><tr class="t0 me"><td>YOU</td><td>${a.pts}</td><td>${P.stats.kills}</td><td>${P.stats.deaths}</td><td>${P.stats.heads}</td><td>${acc}%</td></tr>`+
  G.actors.filter(x=>x.team===0&&!x.isPlayer&&!x.vip).map(r=>`<tr class="t0"><td>${r.name}</td><td>${r.stats.score}</td><td>${r.stats.kills}</td><td>${r.stats.deaths}</td><td>—</td><td>—</td></tr>`).join('')+'</table>';
 const r0=R.rankOf(a.xpBefore),r1=R.rankOf(a.xpAfter),lo=R.rankXP(r1),hi=R.rankXP(r1+1);$('oxpt').textContent=`+${a.pts} XP · ${r1>r0?'PROMOTED TO ':'RANK '}${r1+1} ${R.RANKS[r1]}${r1>r0?'!':''}`;$('oxpb').style.width='0%';
 setTimeout(()=>{$('oxpb').style.width=(r1>=R.RANKS.length-1?100:100*(a.xpAfter-lo)/(hi-lo))+'%';},60);if(r1>r0)G.snd.play('rank');
 $('otok').textContent=`+${a.tok} TOKENS · ${a.pts} POINTS · BEST ${G.best()}`;$('over').hidden=false;document.body.classList.add('results');}
