// STARWARDEN — orbit screen (destination, loadout/vault with equip · infuse · dismantle · lock, subclass) and item cards.
import {EL,RAR,ARCH,PERKS,EXO,SLOTS,SLOT,wstats,itemLine,powerOf,equipped,byU,dismantle,infuse,infuseCost,storeSave} from './loot.js';
import {DEST} from './level.js';
import {CLS} from './actors.js';
const $=id=>document.getElementById(id);
const ELC={kin:'var(--kin)',solar:'var(--solar)',arc:'var(--arc)',void:'var(--void)'};
export function itemCard(it,o={}){return`<div class="itm r${it.r}${o.sel?' sel':''}${o.eq?' eq':''}" data-u="${it.u}" style="--ec:${ELC[it.el]}"><b>${it.n}</b><span>${RAR[it.r].n} · ${ARCH[it.a].n}</span><i></i><em>${it.p}</em>${it.nw&&!o.eq?'<s class="nw">NEW</s>':''}</div>`;}
export function perkText(it){const out=[];if(it.x)out.push([EXO[it.x].ip,EXO[it.x].d]);for(const k of it.k)out.push([PERKS[k].n,PERKS[k].d]);return out;}

export class Orbit{
 constructor(save,cb){this.s=save;this.cb=cb;this.tab='dest';this.filter='kin';this.sel=null;
  $('tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{this.tab=b.dataset.t;this.render();cb.sound&&cb.sound('swap');});
  $('vfilter').querySelectorAll('button').forEach(b=>b.onclick=()=>{this.filter=b.dataset.v;this.sel=null;this.render();});}
 render(){const s=this.s;const eq=equipped(s);$('mPow').textContent=powerOf(eq);$('mShard').textContent=s.shards+' SHARDS · '+s.inv.length+'/60 VAULT';
  $('tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===this.tab));for(const t of['dest','load','cls'])$('t-'+t).hidden=this.tab!==t;
  const opt=this.cb.opt();
  // destinations
  $('dests').innerHTML=DEST.map((d,i)=>`<div class="dest${opt.dest===i?' on':''}" data-i="${i}" style="--dc:${ELC[{hollow:'void',cinder:'solar',lattice:'arc'}[d.fac]]}"><p>${d.sub}</p><b>${d.name}</b><span>STRIKE · ${d.strike}</span><em>RECOMMENDED ✦ ${powerOf(eq)+[-10,0,15][opt.diff]}</em></div>`).join('');
  $('dests').querySelectorAll('.dest').forEach(e=>e.onclick=()=>{this.cb.setDest(+e.dataset.i);this.render();});
  $('mapdesc').textContent=DEST[opt.dest].desc;
  // loadout
  $('slots').innerHTML=SLOTS.map((k,i)=>`<div class="slot"><p>${SLOT[k].n}</p>${itemCard(eq[i],{eq:1,sel:this.sel===eq[i].u})}</div>`).join('');
  $('vfilter').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===this.filter));
  const list=s.inv.filter(i=>i.s===this.filter).sort((a,b)=>b.p-a.p||b.r-a.r);$('vcount').textContent=`${list.length} ${SLOT[this.filter].n} WEAPONS`;
  $('vault').innerHTML=list.map(it=>itemCard(it,{eq:s.eq.includes(it.u),sel:this.sel===it.u})).join('');
  for(const host of[$('slots'),$('vault')])host.querySelectorAll('.itm').forEach(e=>{e.onclick=()=>{this.sel=e.dataset.u;const it=byU(s,this.sel);if(it){it.nw=0;this.filter=it.s;}this.render();};e.ondblclick=()=>{this.equip(e.dataset.u);};});
  this.detail();
  // subclasses
  $('clss').innerHTML=Object.entries(CLS).map(([k,c])=>`<div class="cls${s.cls===k?' on':''}" data-k="${k}" style="--cc:${ELC[c.el]}"><p>${c.sub}</p><b>${c.n}</b><span>${c.desc}</span><ul><li><i>GRENADE</i>${c.gren}</li><li><i>MELEE</i>${c.mel}</li><li><i>SUPER</i>${c.sup}</li></ul></div>`).join('');
  $('clss').querySelectorAll('.cls').forEach(e=>e.onclick=()=>{s.cls=e.dataset.k;storeSave(s);this.cb.sound&&this.cb.sound('cast');this.render();});
  this.cb.onRender&&this.cb.onRender();}
 detail(){const s=this.s,el=$('detail');const it=this.sel&&byU(s,this.sel);if(!it){el.innerHTML='<span class="sub">SELECT A WEAPON TO INSPECT · DOUBLE-CLICK TO EQUIP</span>';return;}
  const st=wstats(it),A=ARCH[it.a],eqd=s.eq.includes(it.u),cur=equipped(s)[SLOTS.indexOf(it.s)],inf=infuseCost(s,it);
  const rpm=Math.round(60/(A.burst?A.rate/A.burst:st.rate||A.rate));const dd=(v,b)=>{const d=Math.round(v-b);return d?`<b style="color:${d>0?'#7dff9a':'#ff7a6a'}">${d>0?'+':''}${d}</b>`:'';};
  el.innerHTML=`<h4 style="color:${RAR[it.r].c}">${it.n}</h4><div class="sub">${RAR[it.r].n} · ${EL[it.el].n} ${A.n} · ${SLOT[it.s].n} · ✦ ${it.p} ${cur&&!eqd?dd(it.p,cur.p):''}</div>
   <div class="st"><i>IMPACT</i><span>${Math.round(st.dmg*(A.pel||1))}</span><i>RPM</i><span>${A.charge?'CHARGE':rpm}</span><i>MAGAZINE</i><span>${st.mag}</span><i>RANGE</i><span>${Math.round(st.range)}</span></div>
   ${perkText(it).map(([n,d])=>`<div class="perk"><b>${n}</b> — ${d}</div>`).join('')}
   <div class="acts"><button class="pri" id="d-eq" ${eqd?'disabled':''}>${eqd?'EQUIPPED':'EQUIP'}</button><button id="d-inf" ${!inf||s.shards<(inf?inf.cost:0)?'disabled':''}>${inf?`INFUSE → ✦ ${inf.to} (${inf.cost} SHARDS)`:'INFUSE (AT MAX)'}</button>
   <button id="d-lock">${it.lock?'UNLOCK':'LOCK'}</button><button id="d-dis" ${eqd||it.lock?'disabled':''}>DISMANTLE (+${[2,5,12,30][it.r]} SHARDS)</button></div>`;
  $('d-eq').onclick=()=>this.equip(it.u);$('d-inf').onclick=()=>{if(infuse(s,it.u)){storeSave(s);this.cb.sound&&this.cb.sound('engram');this.render();}};
  $('d-lock').onclick=()=>{it.lock=!it.lock;storeSave(s);this.render();};$('d-dis').onclick=()=>{if(dismantle(s,it.u)){this.sel=null;storeSave(s);this.cb.sound&&this.cb.sound('shieldPop');this.render();}};}
 equip(u){const s=this.s,it=byU(s,u);if(!it)return;s.eq[SLOTS.indexOf(it.s)]=u;it.nw=0;storeSave(s);this.cb.sound&&this.cb.sound('pickup');this.render();}}
