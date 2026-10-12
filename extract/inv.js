// EXFIL — grid inventory: placement/stacking rules, equipment slots, and the drag-and-drop DOM widgets (stash, loadout, containers, trader).
import {ITEMS,RAR,AMMO,CAL,WPN,money,itemValue,itemKg,wstats} from './data.js';
import {iconFor} from './tex.js';

export const sz=(it,r)=>{const d=ITEMS[it.id];return r?[d.h,d.w]:[d.w,d.h];};
export function newGrid(w,h){return{w,h,items:[]};}
export function fits(g,it,x,y,r,ign){const[w,h]=sz(it,r);if(x<0||y<0||x+w>g.w||y+h>g.h)return false;for(const e of g.items){if(e===ign||e.it===ign)continue;const[ew,eh]=sz(e.it,e.r);if(x<e.x+ew&&x+w>e.x&&y<e.y+eh&&y+h>e.y)return false;}return true;}
export function findSpot(g,it){for(const r of[false,true]){const[w,h]=sz(it,r);if(r&&w===h)continue;for(let y=0;y+h<=g.h;y++)for(let x=0;x+w<=g.w;x++)if(fits(g,it,x,y,r))return{x,y,r};}return null;}
export function place(g,it,x,y,r){const e={it,x,y,r:!!r};g.items.push(e);return e;}
export function removeIt(g,it){const i=g.items.findIndex(e=>e.it===it);if(i>=0){g.items.splice(i,1);return true;}return false;}
// rules: what may enter a given grid kind
export function allowIn(kind,it){const d=ITEMS[it.id];if(kind==='bag'||kind==='pouch'||kind==='pockets')return d.c!=='bag';return true;}
export function stackInto(g,it){const d=ITEMS[it.id];if(!d.stack)return false;for(const e of g.items){if(e.it.id!==it.id||e.it===it)continue;const room=d.stack-e.it.n;if(room<=0)continue;const k=Math.min(room,it.n);e.it.n+=k;it.n-=k;if(it.n<=0)return true;}return it.n<=0;}
export function autoAdd(g,it,kind='stash'){if(!allowIn(kind,it))return false;if(stackInto(g,it))return true;const s=findSpot(g,it);if(!s)return false;place(g,it,s.x,s.y,s.r);return true;}
export function* walk(g){if(!g)return;for(const e of g.items){yield e.it;if(e.it.g)yield* walk(e.it.g);}}
// loadout: {primary, secondary, helmet, armor, bag, pockets, pouch}
export const SLOTS=['primary','secondary','helmet','armor','bag'];
export function slotAccept(slot,it){const d=ITEMS[it.id];if(slot==='primary')return d.c==='weapon';if(slot==='secondary')return d.c==='weapon'&&WPN[d.wid].cls==='PISTOL';if(slot==='helmet')return d.c==='helmet';if(slot==='armor')return d.c==='armor';if(slot==='bag')return d.c==='bag';return false;}
export function loGrids(lo,withPouch=true){const g=[lo.pockets];if(lo.bag)g.push(lo.bag.g);if(withPouch)g.push(lo.pouch);return g;}
export function* loItems(lo,withPouch=true){for(const s of SLOTS){const it=lo[s];if(!it)continue;yield it;if(it.mods)for(const k in it.mods)if(it.mods[k])yield it.mods[k];if(it.g)yield* walk(it.g);}yield* walk(lo.pockets);if(withPouch)yield* walk(lo.pouch);}
export function loKg(lo){let k=0;for(const s of SLOTS)if(lo[s])k+=itemKg(lo[s]);for(const e of lo.pockets.items)k+=itemKg(e.it);for(const e of lo.pouch.items)k+=itemKg(e.it);return k;}
export function loValue(lo){let v=0;for(const s of SLOTS)if(lo[s])v+=itemValue(lo[s]);for(const e of lo.pockets.items)v+=itemValue(e.it);for(const e of lo.pouch.items)v+=itemValue(e.it);return v;}
export function countId(grids,id,fir){let n=0;for(const g of grids)for(const it of walk(g))if(it.id===id&&(!fir||it.fir))n+=ITEMS[id].stack?it.n:1;return n;}
export function findGridOf(grids,it){for(const g of grids){if(g.items.some(e=>e.it===it))return g;for(const e of g.items)if(e.it.g){const r=findGridOf([e.it.g],it);if(r)return r;}}return null;}
export function takeId(grids,id,n,fir){for(const g of grids){for(const e of g.items.slice()){if(n<=0)return 0;if(e.it.g){n=takeId([e.it.g],id,n,fir);}if(e.it.id!==id||(fir&&!e.it.fir))continue;const d=ITEMS[id];if(d.stack){const k=Math.min(n,e.it.n);e.it.n-=k;n-=k;if(e.it.n<=0)removeIt(g,e.it);}else{removeIt(g,e.it);n--;}}}return n;}

/* ================= tooltip text ================= */
export function describe(it){const d=ITEMS[it.id];const rows=[];
 if(d.c==='weapon'){const s=wstats(it);rows.push(`${CAL[s.cal]} · ${s.modes.join('/').toUpperCase()} · ${s.rpm} RPM`,`MAG ${it.ammo}/${s.mag} ${ITEMS[it.at]?ITEMS[it.at].s:''}`,`RECOIL ${Math.round(s.kick*s.rec*100)} · ADS ${Math.round(s.ergo*1000)}ms${s.sup?' · SUPPRESSED':''}`);const m=Object.values(it.mods||{}).filter(Boolean).map(x=>ITEMS[x.id].s);if(m.length)rows.push('MODS: '+m.join(', '));}
 else if(d.c==='ammo'){const a=AMMO[d.ammo];rows.push(`${CAL[a.cal]} · DMG ${a.dmg}${a.pel?'×'+a.pel:''} · PEN ${a.pen}`,`${it.n} ROUNDS`);}
 else if(d.c==='armor'||d.c==='helmet')rows.push(`CLASS ${d.cls} · DURABILITY ${Math.round(it.dur)}/${d.dur}`,d.c==='armor'?'PROTECTS THORAX + STOMACH':'PROTECTS HEAD');
 else if(d.c==='bag')rows.push(`STORAGE ${d.gw}×${d.gh}`);
 else if(d.c==='mod'){const f=d.fits.map(w=>WPN[w].n).join(', ');rows.push(`${d.slot.toUpperCase()} · FITS ${f}`);if(d.rec)rows.push(`RECOIL ${Math.round(d.rec*100)}%`);if(d.mag)rows.push(`CAPACITY ${d.mag}`);if(d.zoom)rows.push(`${d.zoom}× ZOOM`);if(d.sup)rows.push('SUPPRESSED · QUIETER');}
 else if(d.c==='med'){if(d.med==='band')rows.push(`STOPS BLEEDING · ${it.uses} USES`);if(d.med==='kit')rows.push(`HEALS ${Math.round(it.hp)} HP · STOPS BLEEDING`);if(d.med==='splint')rows.push('FIXES FRACTURES');if(d.med==='pills')rows.push(`NO PAIN FOR 90 S · ${it.uses} USES`);if(d.med==='stim')rows.push('STAMINA + SPEED FOR 45 S');if(d.med==='surg')rows.push(`RESTORES A DESTROYED LIMB · ${it.uses} USES`);rows.push(`USE TIME ${d.t}s`);}
 else if(d.c==='key')rows.push('OPENS A LOCKED DOOR');else if(d.c==='card')rows.push('OPENS THE GATEHOUSE EXTRACT');else if(d.c==='flare')rows.push('CALLS THE TOWER PICKUP');else if(d.c==='quest')rows.push('QUEST ITEM');else if(d.c==='cash')rows.push('PAYS THE PIER BOATMAN');
 return rows;}

/* ================= DOM widgets ================= */
const CELL=46;
export class InvUI{
 constructor(snd){this.views=new Set();this.drag=null;this.snd=snd;this.ctx={};this.tip=document.createElement('div');this.tip.className='itip';this.tip.hidden=true;document.body.appendChild(this.tip);
  this.menuEl=document.createElement('div');this.menuEl.className='imenu';this.menuEl.hidden=true;document.body.appendChild(this.menuEl);
  addEventListener('pointermove',e=>this.move(e));addEventListener('pointerup',e=>this.up(e));addEventListener('keydown',e=>{if(this.drag&&e.code==='KeyR'){this.drag.r=!this.drag.r;this.ghostSize();e.preventDefault();}});
  addEventListener('pointerdown',e=>{if(!this.menuEl.hidden&&!this.menuEl.contains(e.target))this.menuEl.hidden=true;},true);}
 cell(){return innerWidth<820?32:innerWidth<1180||innerHeight<640?38:CELL;}
 refresh(){for(const v of this.views)if(v.el.isConnected)v.render();else this.views.delete(v);this.ctx.onChange&&this.ctx.onChange();}
 itemEl(it,r,o={}){const d=ITEMS[it.id],C=this.cell();const[w,h]=sz(it,r);const el=document.createElement('div');el.className='iitem r'+d.r+(o.hidden?' hid':'');el.style.width=(w*C-2)+'px';el.style.height=(h*C-2)+'px';
  if(o.hidden){el.innerHTML=`<i class="q">?</i>`;if(o.prog!==undefined)el.innerHTML+=`<b class="sp" style="--p:${o.prog}"></b>`;return el;}
  const img=document.createElement('img');img.src=iconFor(it,r);img.draggable=false;el.appendChild(img);
  let badge='';if(d.stack)badge=d.c==='cash'?Math.round(it.n).toLocaleString():it.n;else if(d.c==='weapon')badge=it.ammo+'';else if(d.c==='armor'||d.c==='helmet')badge=Math.round(it.dur)+'/'+d.dur;else if(d.c==='med')badge=d.hp?Math.round(it.hp):it.uses+'×';
  el.insertAdjacentHTML('beforeend',`<span class="nm">${d.s}</span>${badge!==''?`<span class="bd">${badge}</span>`:''}${it.fir?'<span class="fir">✓</span>':''}`);
  el.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();if(e.shiftKey||e.ctrlKey){o.quick&&o.quick(it);return;}this.start(e,it,r,o);};
  el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();if(o.menu)this.showMenu(o.menu(it),e.clientX,e.clientY);};
  el.ondblclick=e=>{o.dbl&&o.dbl(it);};
  el.onpointerenter=e=>this.showTip(it,e);el.onpointerleave=()=>{this.tip.hidden=true;};return el;}
 showTip(it,e){if(this.drag)return;const d=ITEMS[it.id];const extra=this.ctx.price?this.ctx.price(it):'';this.tip.innerHTML=`<b style="color:${RAR[d.r].c}">${d.n}</b><span class="rr" style="color:${RAR[d.r].c}">${RAR[d.r].n}${it.fir?' · FOUND IN RAID':''}</span>${describe(it).map(r=>`<p>${r}</p>`).join('')}<p class="vv">${money(itemValue(it))} · ${itemKg(it).toFixed(2)} KG</p>${extra?`<p class="pr">${extra}</p>`:''}<p class="hint">DRAG · SHIFT-CLICK MOVE · RIGHT-CLICK MENU · R ROTATE</p>`;
  this.tip.hidden=false;const r=e.currentTarget.getBoundingClientRect();let x=r.right+8,y=r.top;if(x+260>innerWidth)x=r.left-268;this.tip.style.left=Math.max(4,x)+'px';this.tip.style.top=Math.min(innerHeight-160,y)+'px';}
 showMenu(items,x,y){if(!items||!items.length)return;this.menuEl.innerHTML='';for(const[l,fn,dis]of items){const b=document.createElement('button');b.textContent=l;if(dis)b.disabled=true;b.onclick=()=>{this.menuEl.hidden=true;fn();this.refresh();};this.menuEl.appendChild(b);}this.menuEl.hidden=false;this.menuEl.style.left=Math.min(x,innerWidth-190)+'px';this.menuEl.style.top=Math.min(y,innerHeight-items.length*34-10)+'px';this.tip.hidden=true;}
 // grid view. o: {kind, label, hidden:Set|fn(it)->prog, quick(it), menu(it), dbl(it), accept(it)}
 gridView(host,g,o={}){const v={el:document.createElement('div'),g,o,render:null};v.el.className='igrid';v.el.dataset.kind=o.kind||'stash';v.el._view=v;host.appendChild(v.el);
  v.render=()=>{const C=this.cell();const gg=v.g;v.el.style.width=(gg.w*C)+'px';v.el.style.height=(gg.h*C)+'px';v.el.style.setProperty('--c',C+'px');v.el.innerHTML='';
   for(const e of gg.items){const hid=o.hidden?o.hidden(e.it):null;const el=this.itemEl(e.it,e.r,{hidden:hid!==null&&hid!==undefined,prog:hid,quick:o.quick,menu:o.menu,dbl:o.dbl,src:{g:gg,e}});el._src={g:gg,e,v};el.style.left=(e.x*C+1)+'px';el.style.top=(e.y*C+1)+'px';if(hid!==null&&hid!==undefined)el.onpointerdown=null;v.el.appendChild(el);}};
  v.render();this.views.add(v);return v;}
 slotView(host,label,get,set,accept,o={}){const v={el:document.createElement('div'),render:null};v.el.className='islot';v.el._slot={get,set,accept,o};host.appendChild(v.el);
  v.render=()=>{const C=this.cell();const it=get();v.el.innerHTML=`<i class="lb">${label}</i>`;v.el.style.minHeight=(o.h||2)*C+'px';v.el.style.width=(o.w||4)*C+'px';if(it){const el=this.itemEl(it,false,{quick:o.quick,menu:o.menu,dbl:o.dbl});el._slot=v.el._slot;el.style.position='relative';el.style.maxWidth='100%';v.el.appendChild(el);}};v.render();this.views.add(v);return v;}
 start(e,it,r,o){const src=e.currentTarget._src||null,slot=e.currentTarget._slot||null;const rect=e.currentTarget.getBoundingClientRect();const C=this.cell();
  this.drag={it,r,src,slot,ox:Math.floor((e.clientX-rect.left)/C),oy:Math.floor((e.clientY-rect.top)/C),moved:false,x0:e.clientX,y0:e.clientY};const gh=this.ghost=this.itemEl(it,r,{});gh.classList.add('ghost');gh.style.position='fixed';gh.style.pointerEvents='none';document.body.appendChild(gh);this.tip.hidden=true;this.move(e);this.snd&&this.snd.pick();}
 ghostSize(){if(!this.ghost)return;const C=this.cell();const[w,h]=sz(this.drag.it,this.drag.r);this.ghost.style.width=(w*C-2)+'px';this.ghost.style.height=(h*C-2)+'px';const img=this.ghost.querySelector('img');if(img)img.src=iconFor(this.drag.it,this.drag.r);[this.drag.ox,this.drag.oy]=[0,0];}
 move(e){if(!this.drag)return;const C=this.cell();this.ghost.style.left=(e.clientX-this.drag.ox*C-C/2)+'px';this.ghost.style.top=(e.clientY-this.drag.oy*C-C/2)+'px';
  document.querySelectorAll('.igrid.hov,.islot.hov,.sellzone.hov').forEach(x=>x.classList.remove('hov'));const t=this.target(e);if(t)t.el.classList.add('hov');}
 target(e,gh=this.ghost){if(gh)gh.style.display='none';const el=document.elementFromPoint(e.clientX,e.clientY);if(gh)gh.style.display='';if(!el)return null;const g=el.closest('.igrid'),s=el.closest('.islot'),sz2=el.closest('.sellzone'),drop=el.closest('.dropzone');if(g)return{el:g,type:'grid'};if(s)return{el:s,type:'slot'};if(sz2)return{el:sz2,type:'sell'};if(drop)return{el:drop,type:'drop'};return null;}
 up(e){if(!this.drag)return;const D=this.drag;this.drag=null;const gh=this.ghost;this.ghost=null;document.querySelectorAll('.hov').forEach(x=>x.classList.remove('hov'));const t=gh?this.target(e,gh):null;gh&&gh.remove();
  const it=D.it,C=this.cell();let ok=false;
  const detach=()=>{if(D.src)removeIt(D.src.g,it);else if(D.slot)D.slot.set(null);};const reattach=()=>{};
  if(t&&t.type==='grid'){const v=t.el._view,g=v.g,kind=v.o.kind||'stash';const r=t.el.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/C)-D.ox,y=Math.floor((e.clientY-r.top)/C)-D.oy;
   const accept=v.o.accept?v.o.accept(it):true;const self=it.g&&(it.g===g||[...walk(it.g)].some(x=>x.g===g));
   if(accept&&allowIn(kind,it)&&!self){// drop onto another item: stack / attach mod / load ammo
    const cx=Math.floor((e.clientX-r.left)/C),cy=Math.floor((e.clientY-r.top)/C);const under=g.items.find(en=>{const[w,h]=sz(en.it,en.r);return en.it!==it&&cx>=en.x&&cx<en.x+w&&cy>=en.y&&cy<en.y+h;});
    if(under&&this.ctx.combine&&this.ctx.combine(it,under.it)){detach();if(ITEMS[it.id].stack&&it.n>0){if(!D.src||!g.items.includes(D.src.e))autoAdd(D.src?D.src.g:g,it);}ok=true;}
    else if(under&&ITEMS[it.id].stack&&under.it.id===it.id){const room=ITEMS[it.id].stack-under.it.n;if(room>0){const k=Math.min(room,it.n);under.it.n+=k;it.n-=k;if(it.n<=0)detach();ok=true;}}
    else if(fits(g,it,x,y,D.r,D.src&&D.src.g===g?D.src.e:null)){if(this.ctx.canMove&&!this.ctx.canMove(it,D,g)){}else{detach();place(g,it,x,y,D.r);ok=true;}}}}
  else if(t&&t.type==='slot'){const s=t.el._slot;const prev=s.get();
   if(s.accept(it)&&prev!==it&&!(this.ctx.canMove&&!this.ctx.canMove(it,D,null))){detach();
    if(!prev){s.set(it);ok=true;}
    else{s.set(null);let back=false;if(D.src&&fits(D.src.g,prev,D.src.e.x,D.src.e.y,D.src.e.r)){place(D.src.g,prev,D.src.e.x,D.src.e.y,D.src.e.r);back=true;}else if(this.ctx.home)back=this.ctx.home(prev);
     if(back){s.set(it);ok=true;}else{if(D.src)place(D.src.g,it,D.src.e.x,D.src.e.y,D.src.e.r);else if(D.slot)D.slot.set(it);s.set(prev);}}}}
  else if(t&&t.type==='sell'&&this.ctx.sell){if(this.ctx.sell(it,D)){ok=true;}}
  else if(t&&t.type==='drop'&&this.ctx.drop){if(this.ctx.drop(it,D)){detach();ok=true;}}
  if(ok){this.snd&&this.snd.pick();}else if(Math.hypot(e.clientX-D.x0,e.clientY-D.y0)>6)this.snd&&this.snd.err();this.refresh();}
}
