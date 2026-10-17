// EXFIL — in-raid HUD: compass with extract bearings, raid clock, body-part health, stamina, weapon panel, prompts, hit markers, damage direction.
import {ITEMS,RAR} from './data.js';
import {toast} from '../js/kit3d/ui.js';
const $=id=>document.getElementById(id);
const wrap=a=>{a=((a+180)%360+360)%360-180;return a;};
export const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
export class HUD{
 constructor(){this.c={};this.strip=$('cstrip');this.ticks=[];const L={0:'N',45:'NE',90:'E',135:'SE',180:'S',225:'SW',270:'W',315:'NW'};
  for(let d=0;d<360;d+=15){const s=document.createElement('span');if(L[d]!==undefined){s.className='c';s.textContent=L[d];}else{s.textContent=d;}this.strip.appendChild(s);this.ticks.push({el:s,d});}
  this.marks={};this.banT=0;this.hmT=0;this.exT=0;}
 set(id,v){if(this.c[id]!==v){this.c[id]=v;$(id).textContent=v;}}
 html(id,v){if(this.c[id]!==v){this.c[id]=v;$(id).innerHTML=v;}}
 banner(t,s,col,dur=2.6){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('bs').hidden=!s;$('banner').classList.add('on');this.banT=dur;}
 note(t,cls=''){const d=toast($('notes'),'',4200,6,false);d.textContent=t;d.className=cls;}
 hit(kind){const h=$('hm');h.className=kind||'';h.style.opacity=1;this.hmT=kind==='kill'?.5:.22;}
 hurtDir(ang){const i=document.createElement('i');i.style.transform=`rotate(${ang}rad)`;$('ddir').appendChild(i);setTimeout(()=>i.remove(),1200);}
 showEx(t=6){this.exT=t;}
 update(G,dt){const P=G.P,raid=G.raid;if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}
  if(this.hmT>0){this.hmT-=dt;if(this.hmT<=0)$('hm').style.opacity=0;}
  // clock
  this.set('clock',mmss(raid.clock));const low=raid.clock<120;if(this.c.low!==low){this.c.low=low;$('clockw').classList.toggle('low',low);}
  // compass
  const head=((-P.yaw*180/Math.PI)%360+360)%360;const W=this.strip.parentElement.clientWidth||520,ppd=W/120;
  for(const t of this.ticks){const x=wrap(t.d-head)*ppd+W/2;const vis=x>-20&&x<W+20;t.el.style.display=vis?'':'none';if(vis)t.el.style.left=x+'px';}
  for(const e of G.extracts){let m=this.marks[e.id];if(!m){m=document.createElement('span');m.className='x';this.strip.appendChild(m);this.marks[e.id]=m;}
   const st=raid.ex[e.id];const dx=e.x-P.pos.x,dz=e.z-P.pos.z;const b=Math.atan2(dx,-dz)*180/Math.PI;const x=wrap(b-head)*ppd+W/2;const vis=x>-20&&x<W+20;m.style.display=vis?'':'none';
   if(vis){m.style.left=x+'px';m.textContent='▼'+Math.round(Math.hypot(dx,dz))+'m';m.classList.toggle('closed',!st.open);}}
  // extract list (O)
  if(this.exT>0||G.keys.KeyO){this.exT-=dt;let h='';for(const e of G.extracts){const st=raid.ex[e.id];const d=Math.round(Math.hypot(e.x-P.pos.x,e.z-P.pos.z));const cls=st.open?'ok':st.cond?'cond':'';h+=`<div class="${cls}"><b>${e.n}</b><i>${st.label} · ${d}m</i></div>`;}this.html('exl',h);$('exl').classList.add('on');}else $('exl').classList.remove('on');
  // quests tracker
  this.html('quests',G.questLines||'');
  // health
  const parts={head:'b-head',thorax:'b-thorax',stomach:'b-stomach',larm:'b-larm',rarm:'b-rarm',lleg:'b-lleg',rleg:'b-rleg'};let tot=0,mx=0;
  for(const k in parts){const f=Math.max(0,P.hp[k])/P.max[k];tot+=Math.max(0,P.hp[k]);mx+=P.max[k];const col=P.hp[k]<=0?'rgba(30,30,30,.9)':f>.66?'rgba(111,224,138,.78)':f>.33?'rgba(255,197,61,.85)':'rgba(255,74,58,.9)';if(this.c[k]!==col){this.c[k]=col;$(parts[k]).style.fill=col;}}
  this.set('hpt',Math.round(tot));
  let fx='';if(Object.values(P.bleed).some(Boolean))fx+='<i>BLEEDING</i>';if(Object.values(P.frac).some(Boolean))fx+='<i class="y">FRACTURE</i>';if(P.pain>0)fx+='<i class="g">PAINKILLER '+Math.ceil(P.pain)+'</i>';if(P.stim>0)fx+='<i class="b">ADRENAL '+Math.ceil(P.stim)+'</i>';if(G.kg>G.KG_HEAVY)fx+='<i class="y">'+(G.kg>G.KG_MAX?'OVERLOADED':'HEAVY')+'</i>';if(P.light)fx+='<i class="g">LIGHT</i>';
  this.html('fx',fx);$('stam').style.width=P.stamina+'%';$('stam').classList.toggle('low',P.stamina<20);this.set('kg',G.kg.toFixed(1)+' KG');
  // weapon
  const w=G.wpn();if(w){const d=ITEMS[w.id];const st=G.ws;this.set('wn',d.s+(G.P.reload>0?' · RELOADING':''));this.set('wa',w.ammo+' / '+st.mag);this.set('wm',(st.modes[G.P.mode[G.P.cur]||0]||'semi').toUpperCase()+' · '+ITEMS[w.at].s);this.set('wr','RESERVE '+G.reserve());$('wa').classList.toggle('low',w.ammo<=Math.ceil(st.mag*.2));}
  else{this.set('wn','UNARMED');this.set('wa','—');this.set('wm','');this.set('wr','');}
  $('xh').classList.toggle('ads',P.adsV>.6);}
}
