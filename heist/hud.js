// HALCYON HEIST — DOM HUD: phase + heist clock + assault bar, objectives, take counter, crew cards, vitals, ammo + kit,
// crosshair/hitmarkers/damage arcs, interaction prompt with progress, detection meters over watchers, drill readout, feed.
const $=id=>document.getElementById(id);
export const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
export const money=v=>'$'+Math.round(v).toLocaleString('en-US');
export class HUD{
 constructor(G){this.G=G;this.c={};this.banT=0;this.hitT=0;this.toastT=0;this.arcs=[];this.det=[];
  const arcs=$('dmgind');for(let i=0;i<6;i++){const d=document.createElement('i');arcs.appendChild(d);this.arcs.push({el:d,t:0,ang:0});}
  const dz=$('det');for(let i=0;i<14;i++){const d=document.createElement('div');d.className='dm';d.innerHTML='<i></i><b></b>';dz.appendChild(d);this.det.push(d);}}
 show(on){$('hud').hidden=!on;if(!on){$('hurtov').style.opacity=0;$('maskov').style.opacity=0;$('downov').hidden=true;}}
 set(el,v,k){if(this.c[k]!==v){this.c[k]=v;el.textContent=v;}}
 html(el,v,k){if(this.c[k]!==v){this.c[k]=v;el.innerHTML=v;}}
 banner(t,s,col,dur,cls=''){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('bs').style.display=s?'':'none';const b=$('banner');b.className='on '+cls;this.banT=dur;}
 toast(m,col){if(!m)return;const t=$('toast');t.textContent=m;t.style.color=col||'';t.classList.add('on');this.toastT=2.4;}
 feed(html,cls=''){const d=document.createElement('div');d.className=cls;d.innerHTML=html;$('feed').prepend(d);setTimeout(()=>d.remove(),6000);while($('feed').children.length>5)$('feed').lastChild.remove();}
 clear(){$('feed').innerHTML='';this.c={};}
 hitmark(kind,kill){const h=$('hit');h.className=kind+(kill?' kill':'');h.style.opacity=1;this.hitT=kill?.45:.22;}
 hurt(ang,dmg){const a=this.arcs.find(x=>x.t<=0)||this.arcs[0];a.t=1.4;a.ang=ang;a.el.style.opacity=Math.min(1,.4+dmg/30);this.hurtK=Math.min(.8,(this.hurtK||0)+dmg/40);}
 update(dt,X){const G=this.G,P=G.player;if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}
  if(this.toastT>0){this.toastT-=dt;if(this.toastT<=0)$('toast').classList.remove('on');}
  if(this.hitT>0){this.hitT-=dt;if(this.hitT<=0)$('hit').style.opacity=0;}
  for(const a of this.arcs){if(a.t>0){a.t-=dt;a.el.style.transform=`rotate(${(-(a.ang-P.yaw)*180/Math.PI+180)}deg)`;if(a.t<=0)a.el.style.opacity=0;else if(a.t<.5)a.el.style.opacity=a.t*2;}}
  this.hurtK=Math.max(0,(this.hurtK||0)-dt*.8);$('hurtov').style.opacity=Math.max(this.hurtK,P.alive&&!P.down?Math.max(0,.5-P.hp/100):.6).toFixed(2);
  // phase + clock
  const ph=G.loud?(G.wave.phase==='assault'?'POLICE ASSAULT':G.wave.phase==='regroup'?'POLICE REGROUPING':'ALARM · POLICE EN ROUTE'):(P.masked?'STEALTH':'CASING · MASK OFF');
  this.set($('phase'),ph,'ph');$('top').className=G.loud?(G.wave.phase==='assault'?'assault':'loud'):'';const cl=$('clock');this.set(cl,fmt(G.timeLeft),'clk');cl.classList.toggle('low',G.timeLeft<90);
  $('abar').style.setProperty('--k',G.loud&&G.wave.phase==='assault'?Math.min(1,G.wave.t/G.wave.dur):G.loud&&G.wave.phase!=='assault'?0:0);
  // take
  const sec=G.secured.reduce((s,b)=>s+b.value,0);this.set($('tval'),money(sec+G.loose),'tv');this.set($('tbags'),G.secured.length+' / '+G.def.minBags+'+ BAGS SECURED','tb');
  this.set($('tloose'),G.loose>0?'LOOSE CASH '+money(G.loose):'','tl');
  // objectives
  this.html($('objl'),X.objectives().map(o=>`<li class="${o.done?'done':''}">${o.t}</li>`).join(''),'obj');
  // crew cards
  const cards=[P,...G.crew].map(a=>{const st=a.custody?'CUSTODY':a.down?'DOWN '+Math.ceil(a.bleed):a.standby?'IN THE VAN':a===P?'YOU':a.order==='hold'?'HOLDING':a.order==='loot'?'CARRYING LOOT':'FOLLOWING';
   const hp=a.custody?0:a.down?0:a.hp/a.maxHp*100,ar=a.custody||a.down?0:a.armor/a.maxArmor*100;return`<div class="cc m${a.maskId}${a.down?' dn':''}${a.custody?' cu':''}"><i class="mk"></i><div><b>${a.name}</b><span>${st}</span><p><em style="width:${ar.toFixed(0)}%"></em></p><p class="h"><em style="width:${hp.toFixed(0)}%"></em></p></div>${a.bag?'<u>BAG</u>':''}</div>`;}).join('');
  this.html($('crewp'),cards,'crew');
  // vitals + weapon
  $('arb').style.width=(P.armor/P.maxArmor*100).toFixed(1)+'%';$('hpb').style.width=(P.down?0:P.hp/P.maxHp*100).toFixed(1)+'%';this.set($('hpt'),P.down?'DOWN':Math.ceil(P.hp)+'','hpt');$('vitals').classList.toggle('low',P.hp<35);
  const g=P.gun();if(P.masked&&g){this.set($('wname'),g.def.name,'wn');const am=$('amag');this.set(am,g.mag+'','am');am.classList.toggle('low',g.mag<=Math.ceil(g.def.mag*.25));this.set($('ares'),'/ '+g.res,'ar');}
  else{this.set($('wname'),'MASK OFF · HOLD M TO MASK UP','wn');this.set($('amag'),'—','am');this.set($('ares'),'','ar');}
  this.html($('kit'),`<span class="${G.hasCard?'on':''}">KEYCARD</span><span>TIES ${G.ties}</span><span>PAGERS ${G.pagersUsed}/${G.diff.pagers}</span>${P.bag?`<span class="on">${P.bag.kind.toUpperCase()} BAG · Q THROW</span>`:''}`,'kit');
  // crosshair spread
  $('cross').style.setProperty('--g',(5+X.spread()*7).toFixed(1)+'px');$('cross').style.opacity=P.masked&&!X.ads()?1:0;
  // prompt
  const it=X.prompt();const pr=$('prompt');if(it){pr.classList.add('on');this.html($('ptxt'),it.t,'pt');$('pbar').style.width=(it.p*100).toFixed(1)+'%';pr.classList.toggle('hold',it.hold);pr.classList.toggle('bad',!!it.bad);}else pr.classList.remove('on');
  // drill
  const d=G.drill;if(d&&d.state!=='idle'&&d.state!=='done'){$('drillw').hidden=false;this.set($('drillt'),d.state==='jam'?'DRILL JAMMED · FIX IT (E)':G.def.drill.label+' DRILL · '+fmt((d.total-d.p)/(d.speed||1)),'dt');$('drillb').style.width=(d.p/d.total*100).toFixed(1)+'%';$('drillw').classList.toggle('jam',d.state==='jam');}else $('drillw').hidden=true;
  // downed
  $('downov').hidden=!P.down;if(P.down)this.set($('bleed'),'BLEEDING OUT · '+Math.ceil(P.bleed)+'s · DOWNS LEFT '+Math.max(0,G.diff.downs-P.downs),'bl');
  $('maskov').style.opacity=P.masked?'.85':'0';
  // detection meters projected over the watchers
  const list=X.detection();let i=0;for(const m of list){if(i>=this.det.length)break;const el=this.det[i++];el.style.display='block';el.style.left=m.x+'px';el.style.top=m.y+'px';el.className='dm '+m.kind+(m.v>=1?' full':m.v>.5?' hi':'');
   el.style.setProperty('--v',Math.min(1,m.v).toFixed(3));el.style.setProperty('--r',(m.rot||0)+'deg');el.lastChild.textContent=m.v>=1?'!':'?';}
  for(;i<this.det.length;i++)this.det[i].style.display='none';}}
