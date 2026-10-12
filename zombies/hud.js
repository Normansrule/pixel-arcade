// NIGHTFALL — heads-up display: round tally, points with pop-ups, dawn clock, weapon + ammo, perks, power-ups, prompts, markers, hit markers.
import * as THREE from '../vendor/three.module.min.js';
import {perkIcon} from './map.js';
const $=id=>document.getElementById(id);
export const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
const PUP={ammo:{n:'AMMO CACHE',c:'#9be24a'},double:{n:'DOUBLE BOUNTY',c:'#ffd04a'},insta:{n:'DEATHTOUCH',c:'#ff5a3a'},nuke:{n:'DAYBREAK FLARE',c:'#ffb340'},board:{n:'BOARD UP',c:'#c8a070'}};
export {PUP};

export class HUD{
 constructor(){this.c={};this.banT=0;this.hitT=0;this.feedEl=$('feed');this.pop=$('ptsPop');this.lastPts=null;this.perkEls={};this.marks={};this.dmg=[];this.icons={};
  for(const id of['hide','hand','wind','fang']){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');perkIcon(x,id,32,32,22);this.icons[id]=c.toDataURL();}}
 show(on){$('hud').hidden=!on;}
 set(id,v){if(this.c[id]!==v){this.c[id]=v;$(id).textContent=v;}}
 banner(t,s,col='#ff4d00',dur=2.4){$('bt').textContent=t;$('bt').style.color=col;$('bs').textContent=s||'';$('bs').style.display=s?'':'none';const b=$('banner');b.classList.remove('on');void b.offsetWidth;b.classList.add('on');this.banT=dur;}
 feed(t,cls=''){const d=document.createElement('div');d.textContent=t;d.className=cls;this.feedEl.prepend(d);setTimeout(()=>d.remove(),4200);while(this.feedEl.children.length>5)this.feedEl.lastChild.remove();}
 points(n){const d=document.createElement('i');d.textContent=(n>0?'+':'')+n;if(n<0)d.className='neg';else if(n>=100)d.className='big';d.style.left=(Math.random()*40)+'px';this.pop.appendChild(d);setTimeout(()=>d.remove(),900);while(this.pop.children.length>8)this.pop.firstChild.remove();}
 hitmark(kind){const h=$('hit');h.className='on '+(kind||'');void h.offsetWidth;this.hitT=.18;}
 hurt(ang){const d=document.createElement('i');d.style.transform=`translate(-50%,-50%) rotate(${ang}rad)`;$('dmgind').appendChild(d);setTimeout(()=>d.remove(),1100);}
 prompt(t,cost,can){const p=$('prompt');const k=t+'|'+cost+'|'+can;if(this.c.pr===k)return;this.c.pr=k;if(!t){p.innerHTML='';p.style.opacity=0;return;}p.style.opacity=1;
  p.innerHTML=t.replace(/\[(\w+)\]/g,'<kbd>$1</kbd>')+(cost?` <b class="${can?'':'no'}">${cost.toLocaleString()}</b>`:'');}
 bar(v){const b=$('revbar');if(v==null){b.hidden=true;return;}b.hidden=false;b.firstElementChild.style.width=(Math.min(1,v)*100).toFixed(1)+'%';}
 marker(key,on,x,y,html,cls){let m=this.marks[key];if(!m){m=document.createElement('div');m.className='mk';$('marks').appendChild(m);this.marks[key]=m;}if(!on){m.style.display='none';return;}m.style.display='';m.style.transform=`translate(${x.toFixed(0)}px,${y.toFixed(0)}px) translate(-50%,-100%)`;if(m._h!==html){m._h=html;m.innerHTML=html;}m.className='mk '+(cls||'');}
 update(G,dt){const P=G.player;if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}if(this.hitT>0){this.hitT-=dt;if(this.hitT<=0)$('hit').className='';}
  this.set('roundN',G.round||'');this.set('points',P.points.toLocaleString());
  this.set('clock',mmss(G.clock));const prog=1-G.clock/G.nightLen;$('dawnBar').style.width=(prog*100).toFixed(2)+'%';$('clock').classList.toggle('low',G.clock<60);
  const w=P.weapons[P.cur];if(w){const s=G.wstats(w);this.set('wname',s.name);this.set('mag',w.forging?'—':w.mag);this.set('res',w.forging?'FORGING':'/ '+w.res);$('mag').classList.toggle('low',!w.forging&&w.mag<=Math.ceil(s.mag*.25));$('wname').classList.toggle('up',!!w.up);}
  else{this.set('wname','');this.set('mag','');this.set('res','');}
  const ng=P.grenades;if(this.c.ng!==ng){this.c.ng=ng;$('nades').innerHTML='<i></i>'.repeat(ng);}
  // perks
  const pk=[...P.perks].join();if(this.c.pk!==pk){this.c.pk=pk;$('perks').innerHTML=[...P.perks].map(id=>`<i class="pk ${id}"><img src="${this.icons[id]}"></i>`).join('');}
  // power-ups
  let ph='';for(const k of['double','insta']){const t=G.pup[k];if(t>0)ph+=`<div class="pu ${k}${t<5?' blink':''}" style="--c:${PUP[k].c}"><b>${k==='double'?'×2':'☠'}</b><span>${Math.ceil(t)}</span></div>`;}if(this.c.ph!==ph){this.c.ph=ph;$('pups').innerHTML=ph;}
  // ally card
  const A=G.ally;if(A&&!G.solo){$('allyCard').hidden=false;const st=A.dead?'BLED OUT · BACK NEXT ROUND':A.downed?'DOWN · '+Math.ceil(A.bleed)+'s':'';this.set('allyState',st);$('allyHp').style.width=(A.dead||A.downed?0:A.hp/A.hpMax*100).toFixed(0)+'%';$('allyCard').classList.toggle('down',A.downed);}else $('allyCard').hidden=true;
  this.set('areaName',G.areaName||'');
  // boss
  const boss=G.zombies.find(z=>z.type==='boss'&&z.alive);$('boss').hidden=!boss;if(boss)$('bossb').style.width=(boss.hp/boss.hpMax*100).toFixed(1)+'%';
  // vignettes
  const hpk=P.hp/P.maxHp;$('lowov').style.opacity=P.downed?.9:Math.max(0,(.55-hpk)*1.6).toFixed(3);$('hurtov').style.opacity=G.hurtFx.toFixed(3);
  $('downov').hidden=!P.downed;if(P.downed)this.set('downT',G.solo||!G.ally||G.ally.downed||G.ally.dead?(P.selfRevive>0?'SECOND WIND · GETTING UP '+Math.ceil(P.bleed)+'s':'NO ONE IS COMING'):'ROOK IS COMING · BLEEDING OUT '+Math.ceil(P.bleed)+'s');
  // crosshair spread
  const spr=G.crossSpread||0;const px=(8+spr*520).toFixed(1);if(this.c.cs!==px){this.c.cs=px;$('cross').style.setProperty('--s',px+'px');}$('cross').style.opacity=P.ads?0:(P.sprint?.25:1);}
}
