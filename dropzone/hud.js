// DROPZONE — HUD: rotating minimap + full tactical map (pre-rendered city plan), compass, kill feed, vitals, weapon panel, hit markers, banners.
import {RAR,WPN,AMMO,gunName,modList,wstats} from './weapons.js';
import {ROADS,RW,SW} from './map.js';
import {LAND} from './world.js';
const $=id=>document.getElementById(id);
export const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
const EXT=360,MS=1024,K=MS/(EXT*2);// map canvas covers -360..360 m

function planImage(MAP){const c=document.createElement('canvas');c.width=c.height=MS;const x=c.getContext('2d');const P=v=>(v+EXT)*K;
 x.fillStyle='#1f3d4a';x.fillRect(0,0,MS,MS);
 // shallow water band + land
 x.fillStyle='#2c5660';x.fillRect(P(-LAND-14),P(-LAND-14),(LAND+14)*2*K,(LAND+14)*2*K);x.fillStyle='#bdb59c';x.fillRect(P(-LAND),P(-LAND),LAND*2*K,LAND*2*K);
 x.fillStyle='#aaa58e';for(const b of MAP.blocks)x.fillRect(P(b.x0),P(b.z0),(b.x1-b.x0)*K,(b.z1-b.z0)*K);
 x.fillStyle='#8aa06a';for(const p of MAP.parks)x.fillRect(P(p[0]),P(p[1]),(p[2]-p[0])*K,(p[3]-p[1])*K);
 // roads with sidewalks
 for(const r of ROADS){x.fillStyle='#d4cfc0';x.fillRect(P(r-RW-SW),P(-LAND),(RW+SW)*2*K,LAND*2*K);x.fillRect(P(-LAND),P(r-RW-SW),LAND*2*K,(RW+SW)*2*K);}
 for(const r of ROADS){x.fillStyle='#5a5c5e';x.fillRect(P(r-RW),P(-LAND),RW*2*K,LAND*2*K);x.fillRect(P(-LAND),P(r-RW),LAND*2*K,RW*2*K);}
 x.strokeStyle='rgba(230,220,160,.35)';x.setLineDash([4,5]);x.lineWidth=1;for(const r of ROADS){x.beginPath();x.moveTo(P(r),P(-LAND));x.lineTo(P(r),P(LAND));x.moveTo(P(-LAND),P(r));x.lineTo(P(LAND),P(r));x.stroke();}x.setLineDash([]);
 // buildings by height
 const col={tower:'#59606a',bld:'#7c7a74',office:'#6c727a',ware:'#857e70',house:'#8e7a66',cool:'#9a9890',mast:'#a04040',silo:'#8a7a62',stack:'#7a4a3a'};
 for(const f of [...MAP.foot].sort((a,b)=>a.h-b.h)){const h=Math.min(1,f.h/40);x.fillStyle=f.col||col[f.k]||'#7a7872';x.globalAlpha=.85;x.fillRect(P(f.x0),P(f.z0),(f.x1-f.x0)*K,(f.z1-f.z0)*K);x.globalAlpha=1;
  x.fillStyle=`rgba(0,0,0,${.12+h*.25})`;x.fillRect(P(f.x0)+2,P(f.z1),(f.x1-f.x0)*K,2);x.fillRect(P(f.x1),P(f.z0)+2,2,(f.z1-f.z0)*K);
  x.strokeStyle='rgba(20,20,20,.45)';x.lineWidth=1;x.strokeRect(P(f.x0)+.5,P(f.z0)+.5,(f.x1-f.x0)*K-1,(f.z1-f.z0)*K-1);}
 // grid
 x.strokeStyle='rgba(255,255,255,.07)';for(let g=-300;g<=300;g+=100){x.beginPath();x.moveTo(P(g),0);x.lineTo(P(g),MS);x.moveTo(0,P(g));x.lineTo(MS,P(g));x.stroke();}
 return c;}

export class HUD{
 constructor(MAP){this.MAP=MAP;this.plan=planImage(MAP);this.mini=$('mini').getContext('2d');this.comp=$('comp').getContext('2d');this.big=$('bmc').getContext('2d');this.cache={};this.feedL=[];this.notesL=[];this.hmT=0;this.banT=0;this.ddT=0;this.fr=0;}
 set(id,v,prop='textContent'){if(this.cache[id+prop]===v)return;this.cache[id+prop]=v;$(id)[prop]=v;}
 reset(){this.feedL=[];$('feed').innerHTML='';$('notes').innerHTML='';this.banT=0;$('banner').classList.remove('on');this.cache={};}
 feed(k,w,v,o={}){const el=document.createElement('div');el.className='fe'+(o.me?' me':'')+(o.cage?' cage':'');el.innerHTML=(k?`<b>${k}</b><i>${w}${o.head?' · HEAD':''}</i>`:`<i>${w}</i>`)+`<s>${v}</s>`;const F=$('feed');F.prepend(el);while(F.children.length>6)F.lastChild.remove();setTimeout(()=>el.classList.add('out'),6000);setTimeout(()=>el.remove(),6600);}
 note(t,cls=''){const el=document.createElement('div');el.className='nt '+cls;el.textContent=t;const N=$('notes');N.prepend(el);while(N.children.length>4)N.lastChild.remove();setTimeout(()=>el.remove(),2600);}
 banner(t,s='',dur=3,cls=''){$('bt').textContent=t;$('bs').textContent=s;$('banner').className='on '+cls;this.banT=dur;}
 hit(kind){const h=$('hm');h.className='';void h.offsetWidth;h.className='on '+kind;this.hmT=.22;}
 hurtDir(a){const d=$('ddir');d.style.transform=`translate(-50%,-50%) rotate(${a}rad)`;d.className='on';this.ddT=1.1;}
 tick(dt){if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}if(this.ddT>0){this.ddT-=dt;if(this.ddT<=0)$('ddir').className='';}}
 // ---- per-frame panel text
 panels(G,P){const it=P.guns[P.cur];
  this.set('alive',String(G.remaining));this.set('kills',String(P.kills));
  const g=G.gas;let gl,gv;if(g.state==='wait'){gl='CIRCLE CLOSES IN';gv=mmss(g.left);}else if(g.state==='shrink'){gl='CIRCLE CLOSING';gv=mmss(g.left);}else{gl='FINAL CIRCLE';gv='';}
  this.set('gasl',gl);this.set('gasv',gv);this.set('mtime',mmss(G.matchLeft));
  const arm=P.armor;for(let i=0;i<3;i++){const f=Math.max(0,Math.min(1,(arm-i*50)/50));const k='arm'+i,v=(f*100).toFixed(0)+'%';if(this.cache[k]!==v){this.cache[k]=v;$('armor').children[i].firstChild.style.width=v;}}
  const hp=Math.max(0,P.hp);const hv=hp.toFixed(0)+'%';if(this.cache.hpw!==hv){this.cache.hpw=hv;$('hpf').style.width=hv;$('hpb').classList.toggle('low',hp<35);}
  this.set('plates','PLATES '+P.plates);this.set('cash','$'+P.cash.toLocaleString());
  if(it){const s=wstats(it);this.set('wn',gunName(it));const c=RAR[it.r].c;if(this.cache.wc!==c){this.cache.wc=c;$('wn').style.color=c;}
   this.set('wa',String(it.mag));this.set('wr',String(P.ammo[WPN[it.w].ammo]));this.set('wm',(modList(it).join(' · ')||'NO ATTACHMENTS'));const lo=it.mag<=Math.ceil(s.mag*.25);if(this.cache.wlo!==lo){this.cache.wlo=lo;$('wa').classList.toggle('low',lo);}}
  else{this.set('wn','UNARMED');this.set('wa','-');this.set('wr','');this.set('wm','');}
  const o=P.guns[1-P.cur];this.set('w2',o?'[1] '+WPN[o.w].n+' · '+o.mag:'');
  this.set('pname',G.zone||'');}
 // ---- compass strip
 compass(yaw,marks){const x=this.comp,W=420,H=34;x.clearRect(0,0,W,H);const b=((Math.PI-yaw)*180/Math.PI%360+360)%360;const px=W/120;
  x.fillStyle='rgba(8,10,12,.45)';x.fillRect(0,6,W,22);x.textAlign='center';x.textBaseline='middle';
  for(let d=Math.floor((b-62)/5)*5;d<=b+62;d+=5){const dd=((d%360)+360)%360;const sx=W/2+(d-b)*px;const card={0:'N',45:'NE',90:'E',135:'SE',180:'S',225:'SW',270:'W',315:'NW'}[dd];
   x.fillStyle=card?'#fff':'rgba(255,255,255,.55)';if(card){x.font='700 13px JetBrains Mono,monospace';x.fillText(card,sx,17);}else if(dd%15===0){x.font='10px JetBrains Mono,monospace';x.fillText(String(dd),sx,17);}else x.fillRect(sx-.5,20,1,5);}
  for(const m of marks){let d=m.b-b;d=((d+540)%360)-180;if(Math.abs(d)>60)continue;const sx=W/2+d*px;x.fillStyle=m.c;x.beginPath();x.moveTo(sx,6);x.lineTo(sx-5,0);x.lineTo(sx+5,0);x.fill();if(m.t){x.font='9px JetBrains Mono,monospace';x.fillText(m.t,sx,32);}}
  x.fillStyle='#ffb020';x.fillRect(W/2-1,4,2,24);}
 // ---- rotating minimap
 minimap(G,P,viewYaw){const x=this.mini,S=200,c=S/2,z=1.55;x.save();x.clearRect(0,0,S,S);x.beginPath();x.arc(c,c,c-2,0,Math.PI*2);x.clip();
  x.translate(c,c);x.rotate(viewYaw+Math.PI);x.scale(z,z);x.translate(-P.pos.x,-P.pos.z);
  if(!P.inGulag){x.drawImage(this.plan,-EXT,-EXT,EXT*2,EXT*2);this.circles(x,G,1/z);
   if(G.plane&&G.plane.show){x.strokeStyle='rgba(255,255,255,.7)';x.setLineDash([6,5]);x.lineWidth=1.6/z;x.beginPath();x.moveTo(G.plane.a.x,G.plane.a.z);x.lineTo(G.plane.a.x+G.plane.dir.x*G.plane.len,G.plane.a.z+G.plane.dir.z*G.plane.len);x.stroke();x.setLineDash([]);}
   for(const d of G.depots){this.icon(x,d.x,d.z,'#2aff8a',1/z,'$');}
   for(const d of G.drops)if(!d.opened){this.icon(x,d.pos.x,d.pos.z,'#ff4a2a',1/z,'L');}
   for(const c of G.cars)if(!c.dead&&!c.driver)this.icon(x,c.pos.x,c.pos.z,'#c8d0d8',1/z,'V');
   // enemies: UAV reveals all, gunfire pings briefly
   for(const a of G.actors){if(a===P||!a.alive||a.inGulag||a.state==='plane')continue;const ping=G.time-(a.pingT||-99)<2.2;if(!(G.uavT>0||ping))continue;x.fillStyle=ping?'#ff3a2a':'#ff6a4a';x.beginPath();x.arc(a.pos.x,a.pos.z,(ping?3.2:2.4)/z,0,7);x.fill();}}
  else{x.fillStyle='#3a3836';x.fillRect(380,-30,80,60);x.fillStyle='#8a8680';x.fillRect(402,-12,36,24);for(const a of G.actors)if(a!==P&&a.inGulag&&a.alive){x.fillStyle='#ff3a2a';x.beginPath();x.arc(a.pos.x,a.pos.z,2/z,0,7);x.fill();}}
  x.restore();
  // player arrow (always pointing up)
  x.fillStyle='#ffd23a';x.strokeStyle='#000';x.lineWidth=1.5;x.beginPath();x.moveTo(c,c-8);x.lineTo(c-6,c+6);x.lineTo(c,c+3);x.lineTo(c+6,c+6);x.closePath();x.fill();x.stroke();
  x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=2;x.beginPath();x.arc(c,c,c-2,0,Math.PI*2);x.stroke();
  // N marker on the rim
  const na=-(viewYaw+Math.PI)-Math.PI/2;x.fillStyle='#fff';x.font='700 12px JetBrains Mono,monospace';x.textAlign='center';x.textBaseline='middle';x.fillText('N',c+Math.cos(na)*(c-12),c+Math.sin(na)*(c-12));}
 circles(x,G,lw){const g=G.gas;x.save();x.beginPath();x.rect(-2000,-2000,4000,4000);x.arc(g.cur.x,g.cur.z,Math.max(.1,g.cur.r),0,Math.PI*2,true);x.fillStyle='rgba(230,120,20,.32)';x.fill('evenodd');x.restore();
  x.strokeStyle='#ff8a1a';x.lineWidth=2.2*lw;x.beginPath();x.arc(g.cur.x,g.cur.z,Math.max(.1,g.cur.r),0,Math.PI*2);x.stroke();
  if(g.state!=='closed'){x.strokeStyle='#fff';x.lineWidth=1.6*lw;x.setLineDash([5*lw,4*lw]);x.beginPath();x.arc(g.next.x,g.next.z,Math.max(.1,g.next.r),0,Math.PI*2);x.stroke();x.setLineDash([]);}}
 icon(x,px,pz,c,s,t){x.fillStyle='rgba(0,0,0,.6)';x.beginPath();x.arc(px,pz,6*s,0,7);x.fill();x.fillStyle=c;x.font=`700 ${9*s}px JetBrains Mono,monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText(t,px,pz+.5*s);}
 // ---- full map (M)
 bigmap(G,P){const x=this.big,S=800,k=S/(EXT*2);x.save();x.clearRect(0,0,S,S);x.scale(k,k);x.translate(EXT,EXT);x.drawImage(this.plan,-EXT,-EXT,EXT*2,EXT*2);this.circles(x,G,1/k);
  if(G.plane&&G.plane.show){x.strokeStyle='rgba(255,255,255,.85)';x.setLineDash([8,6]);x.lineWidth=2/k;x.beginPath();x.moveTo(G.plane.a.x,G.plane.a.z);x.lineTo(G.plane.a.x+G.plane.dir.x*G.plane.len,G.plane.a.z+G.plane.dir.z*G.plane.len);x.stroke();x.setLineDash([]);
   x.fillStyle='#fff';x.beginPath();x.arc(G.plane.pos.x,G.plane.pos.z,5/k,0,7);x.fill();}
  x.textAlign='center';x.textBaseline='middle';for(const p of this.MAP.pois){x.font=`${13/k}px Anton,Impact,sans-serif`;x.fillStyle='rgba(0,0,0,.55)';x.fillText(p.n,p.x+1/k,p.z+1/k);x.fillStyle='#fff';x.fillText(p.n,p.x,p.z);}
  for(const d of G.depots)this.icon(x,d.x,d.z,'#2aff8a',1.4/k,'$');for(const d of G.drops)if(!d.opened)this.icon(x,d.pos.x,d.pos.z,'#ff4a2a',1.4/k,'L');for(const c of G.cars)if(!c.dead&&!c.driver)this.icon(x,c.pos.x,c.pos.z,'#c8d0d8',1.4/k,'V');
  if(G.uavT>0)for(const a of G.actors){if(a===P||!a.alive||a.inGulag||a.state==='plane')continue;x.fillStyle='#ff4a2a';x.beginPath();x.arc(a.pos.x,a.pos.z,4/k,0,7);x.fill();}
  if(!P.inGulag){x.save();x.translate(P.pos.x,P.pos.z);x.rotate(-P.yaw+Math.PI);x.fillStyle='#ffd23a';x.strokeStyle='#000';x.lineWidth=2/k;x.beginPath();x.moveTo(0,-11/k);x.lineTo(-8/k,8/k);x.lineTo(0,4/k);x.lineTo(8/k,8/k);x.closePath();x.fill();x.stroke();x.restore();}
  x.restore();}
}
