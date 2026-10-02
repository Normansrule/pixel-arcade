// NIGHT DRIVE — HUD: cash + target, shift clock + time of day, rotating minimap with GPS line and icons, wanted stars, job panel,
// dispatch board, speedo/damage/nitro, radio, toasts and stunt pops.
import {N,SP,HALF,WORLD,HY} from './city.js';
import {JOBC} from './missions.js';
const $=id=>document.getElementById(id);
export const mmss=t=>{t=Math.max(0,Math.ceil(t));return (t/60|0)+':'+String(t%60).padStart(2,'0');};
const money=v=>(v<0?'-$':'$')+Math.abs(Math.round(v)).toLocaleString();
const hex=c=>'#'+c.toString(16).padStart(6,'0');
export class HUD{
 constructor(G,city){this.G=G;this.city=city;this.cache={};this.toastT=0;this.popT=0;this.radioT=0;this.mini=$('mini').getContext('2d');this.buildMap();}
 show(on){$('hud').hidden=!on;}
 set(id,v){if(this.cache[id]!==v){this.cache[id]=v;$(id).textContent=v;}}
 buildMap(){// pre-render the city at 1 px = 1 m (with margin)
  const C=this.city,M=160,S=WORLD+2*M;const cv=document.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d');this.mapM=M;this.map=cv;
  x.fillStyle='#0b0e14';x.fillRect(0,0,S,S);x.translate(M,M);
  x.fillStyle='#0f2a3a';x.fillRect(6*SP+HALF,-M,SP-2*HALF,S);x.fillRect(WORLD+38,-M,M,S);const p=C.park;x.fillStyle='#12301c';x.fillRect(p.x0,p.z0,p.x1-p.x0,p.z1-p.z0);x.fillStyle='#0f2a3a';x.beginPath();x.arc(C.pondC.x,C.pondC.z,C.pondC.r,0,7);x.fill();
  const h=C.hill;x.fillStyle='#1a2a1a';x.fillRect(h.x0,h.z0,h.x1-h.x0,h.z1-h.z0);
  x.fillStyle='#1c2028';for(const b of C.blocks){if(b.d==='river'||b.d==='park'||b.d==='hill')continue;x.fillRect(b.x0,b.z0,b.x1-b.x0,b.z1-b.z0);}
  x.fillStyle='#2a3040';for(const L of C.lots){x.fillRect(L.x0,L.z0,L.x1-L.x0,L.z1-L.z0);}
  x.strokeStyle='#5a6274';x.lineWidth=ROADW;x.lineCap='square';for(const e of C.edges){const A=C.nodes[e.a],B=C.nodes[e.b];x.strokeStyle=e.tunnel?'#3a4050':'#545c6e';x.beginPath();x.moveTo(A.x,A.z);x.lineTo(B.x,B.z);x.stroke();}
  // highway ring + ramps
  x.strokeStyle='rgba(255,140,40,.55)';x.lineWidth=10;x.strokeRect(0,0,WORLD,WORLD);x.fillStyle='rgba(255,140,40,.45)';for(const r of C.ramps)x.fillRect(r.x0,r.z0,r.x1-r.x0,r.z1-r.z0);
  this.mapS=S;}
 job(a){const w=$('jobw');if(!a){w.hidden=true;$('board').hidden=false;return;}w.hidden=false;$('board').hidden=true;const col=hex(JOBC[a.type]);w.style.setProperty('--jc',col);}
 toast(t,col='#fff',dur=2.2){const e=$('toast');e.textContent=t;e.style.color=col;e.classList.add('on');this.toastT=dur;}
 pop(t){const e=$('pop');e.textContent=t;e.classList.add('on');this.popT=1.4;}
 cash(d,why){const e=$('cashd');e.textContent=(d>=0?'+':'')+money(d)+(why?' · '+why:'');e.classList.toggle('neg',d<0);e.classList.remove('on');void e.offsetWidth;e.classList.add('on');}
 radio(st){this.set('rname',st.name);this.set('rtag',st.tag);this.radioT=3.5;}
 prompt(t){const e=$('prompt');if(t){e.textContent=t;e.classList.add('on');}else e.classList.remove('on');}
 update(dt){const G=this.G,P=G.car;if(!P||$('hud').hidden)return;
  this.toastT-=dt;if(this.toastT<=0)$('toast').classList.remove('on');this.popT-=dt;if(this.popT<=0)$('pop').classList.remove('on');this.radioT-=dt;$('radiow').classList.toggle('dim',this.radioT<=0);
  this.set('cash',money(G.cash));const tf=Math.min(1,G.cash/G.target);$('tgtb').style.width=(tf*100)+'%';$('tgtb').className=tf>=1?'met':'';this.set('tgtt',tf>=1?'TARGET MET · KEEP EARNING':'SHIFT TARGET '+money(G.target));
  this.set('shift',mmss(G.shiftLeft));$('shift').className=G.shiftLeft<30?'low':'';const hh=Math.floor(G.hour)%24,mm=Math.floor((G.hour%1)*60);this.set('tod',String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+' · '+(G.rain>.6?'HEAVY RAIN':G.rain>.15?'RAIN':G.hour<19?'CLEAR':'CLEAR NIGHT'));
  this.set('kmh',Math.round(P.speed*3.6));$('dmgb').style.width=Math.max(0,100-P.dmg)+'%';$('dmgb').style.background=P.dmg>70?'#ff4030':P.dmg>40?'#ffb020':'#9be27a';$('nitb').style.width=(P.nitro*100)+'%';
  this.set('dist',G.tunnel?'CRESTVIEW TUNNEL':P.y>HY-2?'SKYWAY RING':this.city.districtAt(P.x,P.z));
  const st=$('stars');const sw=G.wanted;let s='';for(let i=0;i<5;i++)s+=i<sw?'<b>★</b>':'★';if(this.cache.stars!==s){this.cache.stars=s;st.innerHTML=s;}st.classList.toggle('blink',sw>0&&G.escapeT>2);
  $('bust').hidden=!(G.bustT>0);if(G.bustT>0)$('bustb').style.width=(G.bustT/2.5*100)+'%';
  // job panel
  const a=G.jobs.active;if(a){const names={fare:'FARE · '+(a.pax?a.pax.n:''),delivery:'DELIVERY · FRAGILE',race:'STREET RACE',getaway:'GETAWAY · LOSE THE HEAT OR NOT'};this.set('jt',names[a.type]);
   if(a.type==='race'){this.set('jn',a.stage==='count'?'GET READY':a.stage==='done'?'FINISHED':'CHECKPOINT '+Math.min(a.cpi+1,a.total)+' / '+a.total);this.set('jtime',a.stage==='go'?'P'+(a.place||1)+' / 3':'');this.set('jx','RIVALS: NOVA · VANDAL');$('jbar').style.width=(a.cpi/a.total*100)+'%';}
   else{this.set('jn',a.stage==='board'?(a.type==='delivery'?'LOADING…':'BOARDING…'):a.type==='fare'?'DROP AT THE GREEN BEACON':a.type==='delivery'?'DELIVER TO THE BLUE BEACON':'SAFEHOUSE · YELLOW BEACON');this.set('jtime',mmss(a.left));$('jtime').className=a.left<10?'low':'';
    this.set('jx',a.type==='fare'?'TIPS $'+Math.round(a.tips)+' · RATING '+Math.round(a.sat*100)+'%':a.type==='delivery'?'CARGO '+Math.max(30,Math.round(100-(P.dmg-a.dmg0)/60*100))+'%':'HEAT '+G.wanted+'★');$('jbar').style.width=(Math.max(0,a.left/a.limit)*100)+'%';}}
  else{const o=G.jobs.offers.slice().sort((p,q)=>Math.hypot(p.x-P.x,p.z-P.z)-Math.hypot(q.x-P.x,q.z-P.z)).slice(0,5);const html=o.map(j=>`<div style="--c:${hex(JOBC[j.type])}"><span>${{fare:'FARE',delivery:'DELIVERY',race:'RACE',getaway:'GETAWAY'}[j.type]}</span><i>${Math.round(Math.hypot(j.x-P.x,j.z-P.z))} M</i></div>`).join('');if(this.cache.off!==html){this.cache.off=html;$('offers').innerHTML=html;}}
  this.drawMini();}
 drawMini(){const G=this.G,P=G.car,x=this.mini,S=440,c=S/2;const zoom=1.25-Math.min(.55,P.speed*.012);const M=this.mapM;x.save();x.clearRect(0,0,S,S);x.beginPath();x.arc(c,c,c-2,0,7);x.clip();x.fillStyle='#0b0e14';x.fillRect(0,0,S,S);
  x.translate(c,c);x.rotate(P.a+Math.PI);x.scale(zoom,zoom);x.translate(-P.x,-P.z);x.drawImage(this.map,-M,-M);
  // route
  const rt=G.route;if(rt&&rt.length>1){x.strokeStyle=hex(G.jobs.active?JOBC[G.jobs.active.type==='fare'?'drop':G.jobs.active.type]:0xffffff);x.lineWidth=7/zoom+2;x.lineJoin='round';x.globalAlpha=.9;x.beginPath();x.moveTo(rt[0][0],rt[0][1]);for(const p of rt)x.lineTo(p[0],p[1]);x.stroke();x.globalAlpha=1;}
  const dot=(px,pz,col,r)=>{x.fillStyle=col;x.beginPath();x.arc(px,pz,r/zoom,0,7);x.fill();};
  for(const s of G.city.shops){x.fillStyle='#ffb050';x.fillRect(s.x-7/zoom,s.z-7/zoom,14/zoom,14/zoom);}
  for(const k of G.jobs.stunts){if(!k.done)dot(k.k.x,k.k.z,'#ff7a10',6);}
  if(!G.jobs.active)for(const o of G.jobs.offers)dot(o.x,o.z,hex(JOBC[o.type]),11);
  const tg=G.jobs.target();if(tg)dot(tg.x,tg.z,'#ffffff',13);if(tg)dot(tg.x,tg.z,hex(G.jobs.active.type==='fare'?JOBC.drop:JOBC[G.jobs.active.type]),9);
  for(const r of G.jobs.rivals)dot(r.car.x,r.car.z,'#ff60c0',7);
  const flash=Math.sin(G.time*14)>0;for(const cp of G.police.cops)dot(cp.x,cp.z,flash?'#ff3040':'#3070ff',8);
  x.restore();
  // edge arrow toward an off-map target
  x.fillStyle='#fff';x.beginPath();x.moveTo(c,c-12);x.lineTo(c-8,c+9);x.lineTo(c,c+4);x.lineTo(c+8,c+9);x.fill();
  if(tg){const dx=tg.x-P.x,dz=tg.z-P.z;const d=Math.hypot(dx,dz);if(d*zoom>c-14){const ang=Math.atan2(dz,dx)-(P.a+Math.PI)*0;const a2=Math.atan2(dx,dz)-P.a;const ex=c-Math.sin(a2)*(c-16),ey=c-Math.cos(a2)*(c-16);x.fillStyle=hex(G.jobs.active.type==='fare'?JOBC.drop:JOBC[G.jobs.active.type]);x.beginPath();x.arc(ex,ey,10,0,7);x.fill();}}
  x.fillStyle='rgba(255,255,255,.75)';x.font='bold 20px monospace';x.textAlign='center';x.fillText('N',c+Math.sin(P.a+Math.PI)*(c-22)*-1*0+Math.sin(-(P.a+Math.PI))*-(c-22),c-Math.cos(-(P.a+Math.PI))*(c-22)+7);}}
const ROADW=16;
