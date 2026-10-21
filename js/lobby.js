/* PIXEL ARCADE · Lobby: genre shelves of cartridge spines, the cartridge box panel, search, favourites, views and theme.
   Registers A.lobby, which js/engine/12-hub.js calls once the engine has booted. Shared bits for js/console.js live on A.shelf. */
(function(){
'use strict';
if(typeof document==='undefined'||!window.A)return;
const A=window.A;
const $=id=>document.getElementById(id);
const ls=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}},lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const RM=matchMedia('(prefers-reduced-motion: reduce)'),SHEET=matchMedia('(max-width: 980px)');
const fmt=s=>Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');
const REPO='https://github.com/Normansrule/pixel-arcade/blob/main/';
const BL={SPORTS:'Courts, pitches, lanes and slopes.',CLASSICS:'The golden age, rebuilt from scratch.',VERSUS:'Grab a friend or fight the machine.','RETRO 3D':'Polygon worlds with fog, shadows and speed.',BOARD:'Real search behind every CPU move.',PUZZLE:'Think, then think faster.',ACTION:'Shooters, brawlers and a fighting roster.',CARDS:'Green felt, proper suits, house rules.',SIM:'Zoos, farms, pets and reefs to look after.',PARTY:'Quick head-to-head rounds. Loud, fast, fair.'};
// game rules are written in engine capitals; the box prints them in sentence case but keeps keys (A, W/S) and acronyms
const KEEP=new Set(['CPU','HP','KO','UFO','AI','WASD','NPC','PVP','XP','MP','HUD','DJ','TV','VS']);
const sentence=t=>(t||'').replace(/[A-Z][A-Z']+/g,w=>KEEP.has(w)?w:w.toLowerCase()).replace(/(^|[.!?]\s+)([a-z])/g,(m,p,c)=>p+c.toUpperCase());

/* artwork: the prerendered thumbnail (docs/thumbs, made by thumbs.py), else the game rendered live, a few per frame */
const Q=[];let pumping=false;
const pump=()=>{if(pumping)return;pumping=true;const run=()=>{if(A._e.state!=='hub'){setTimeout(run,300);return;}const t0=performance.now();while(Q.length&&performance.now()-t0<12)Q.shift()();if(Q.length)requestAnimationFrame(run);else pumping=false;};requestAnimationFrame(run);};
const live=(gm,cv)=>{const scr=$('scr'),sv=A.silent,sc=A.cpu,sf=A.fx;A.silent=true;A.cpu=true;A.fx=[];let ok=true;
 try{const t=gm.make();for(let i=0;i<(gm.warm||45);i++){A.bot({});t.update();if(t.over)break;}A.cls();t.draw();A.flush&&A.flush();const x=cv.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(scr,0,0,cv.width,cv.height);}catch(e){ok=false;}
 A.silent=sv;A.cpu=sc;A.fx=sf;return ok;};
// fills holder with an <img>, swapping to a live-rendered <canvas> when there is no thumbnail; done(ok) reports the result
function art(gm,holder,done){
 const im=new Image();im.alt='';im.decoding='async';im.loading='lazy';im.draggable=false;
 im.onload=()=>{done&&done(true);};
 im.onerror=()=>{const cv=document.createElement('canvas');cv.width=320;cv.height=240;im.replaceWith(cv);Q.push(()=>{const ok=live(gm,cv);done&&done(ok);});pump();};
 holder.appendChild(im);im.src=gm.img||'docs/thumbs/'+gm.id+'.jpg';
}
const modeOf=gm=>gm.href?'3D world, free roam':gm.vs?'Vs CPU or 2 players':'Solo, beat your best';
const capOf=gm=>gm.href||gm.hd?'3D':gm.vs?'VS':'1P';
const bestOf=gm=>{try{const u=A.profile&&A.profile.user;const v=localStorage.getItem('pxd_hs_'+(u?u.toLowerCase()+'_':'')+gm.id);return v===null?null:+v;}catch(e){return null;}};
const play=gm=>{if(!gm)return;if(gm.href){A.played(gm.id);location.href=gm.href;}else A.open(gm);};
const playable=()=>A.games.filter(g=>!g.href);
A.shelf={art,live,fmt,play,modeOf,capOf,RM};

A.lobby=()=>{
 const E=A._e,tc=E.tc,grid=$('grid'),chips=$('chips'),q=$('q'),box=$('box'),cnt=$('libcount');
 if(!grid)return;
 const favs=new Set(ls('pxd_favs',[]));let recent=ls('pxd_recent',[]);let filt='All',sel=null,selEl=null,stopPrev=null;
 A.played=id=>{recent=[id].concat(recent.filter(x=>x!==id)).slice(0,12);lsSet('pxd_recent',recent);syncChips();};
 {const _o=A.open;A.open=g=>{if(g&&g.id)A.played(g.id);return _o(g);};}

 /* shelves */
 const cats=[...new Set(A.games.map(g=>g.cat))],rows={},byId={};
 const frag=document.createDocumentFragment();
 cats.forEach(c=>{
  const sec=document.createElement('section');sec.className='shelf';sec.id='cat-'+c.replace(/\W/g,'');sec.setAttribute('aria-labelledby',sec.id+'-h');
  const n=A.games.filter(g=>g.cat===c).length;
  sec.innerHTML='<header class="sec-head"><h2></h2><span class="cnt"></span><p></p></header><div class="spines" role="group"></div>';
  const h=sec.querySelector('h2');h.id=sec.id+'-h';h.textContent=tc(c);sec.querySelector('.cnt').textContent=n+(n===1?' game':' games');sec.querySelector('p').textContent=BL[c]||'';
  rows[c]=sec.querySelector('.spines');rows[c].setAttribute('aria-labelledby',h.id);frag.appendChild(sec);
 });
 A.games.forEach(gm=>{
  const el=document.createElement('button');el.type='button';el.className='spine'+(gm.href?' world':'');el.dataset.cat=gm.cat;el.dataset.id=gm.id;el.tabIndex=-1;el.setAttribute('aria-pressed','false');
  el._tags=((gm.tags||'')+' '+(gm.how||'')).toLowerCase();el._name=tc(gm.name);
  el.innerHTML='<span class="cap"></span><span class="nm"></span><span class="clk"></span>';
  el.querySelector('.cap').textContent=capOf(gm);el.querySelector('.nm').textContent=el._name;
  el.querySelector('.clk').textContent=gm.href?'FREE':fmt(A.limitOf(gm));
  el.setAttribute('aria-label',el._name+', '+tc(gm.cat)+', '+(gm.href?'3D world':fmt(A.limitOf(gm))+' round')+', '+modeOf(gm));
  el.title=el._name;
  el.onclick=()=>{if(sel===gm&&!SHEET.matches)play(gm);else pick(gm,el);};
  byId[gm.id]=el;rows[gm.cat].appendChild(el);
 });
 grid.querySelector('.skeleton')?.remove();grid.appendChild(frag);
 syncFavMarks();

 /* roving focus: one tab stop per shelf, arrows walk it */
 const visible=row=>[...row.children].filter(x=>!x.hidden);
 function resetStops(){Object.values(rows).forEach(r=>{const v=visible(r);[...r.children].forEach(x=>{x.tabIndex=-1;});const s=v.find(x=>x===selEl)||v[0];if(s)s.tabIndex=0;});}
 grid.addEventListener('keydown',e=>{
  const el=e.target.closest('.spine');if(!el)return;const v=visible(el.parentNode),i=v.indexOf(el);let j=-1;
  const cols=el.parentNode.classList.contains('boxes')?Math.max(1,Math.round(el.parentNode.clientWidth/el.offsetWidth)):1;
  if(e.key==='ArrowRight')j=i+1;else if(e.key==='ArrowLeft')j=i-1;else if(e.key==='ArrowDown')j=i+cols;else if(e.key==='ArrowUp')j=i-cols;else if(e.key==='Home')j=0;else if(e.key==='End')j=v.length-1;else return;
  e.preventDefault();j=Math.max(0,Math.min(v.length-1,j));el.tabIndex=-1;v[j].tabIndex=0;v[j].focus();
 });

 /* the box: the selected cartridge's art, facts and actions */
 const bcv=$('boxcv'),nosig=box.querySelector('.nosig'),bfull=$('boxfull'),bempty=$('boxempty');
 function drawBoxArt(gm){
  const x=bcv.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,320,240);nosig.hidden=true;
  const im=new Image();im.onload=()=>{if(sel===gm)x.drawImage(im,0,0,320,240);};
  im.onerror=()=>{if(sel!==gm)return;if(!live(gm,bcv))nosig.hidden=false;};
  im.src=gm.img||'docs/thumbs/'+gm.id+'.jpg';
  if(stopPrev){stopPrev();stopPrev=null;}
  if(!gm.href&&!RM.matches)setTimeout(()=>{if(sel===gm&&!stopPrev)stopPrev=A.preview(gm,bcv,30);},500);
 }
 function fillBox(gm){
  bempty.hidden=true;bfull.hidden=false;bfull.style.animation='none';void bfull.offsetWidth;bfull.style.animation='';
  $('boxcat').textContent=tc(gm.cat);$('boxname').textContent=tc(gm.name);
  $('boxtime').textContent=gm.href?'Free roam':fmt(A.limitOf(gm));$('boxmode').textContent=modeOf(gm);
  const b=bestOf(gm),bb=$('boxbest');bb.parentNode.hidden=!!(gm.href||gm.vs);bb.textContent=b===null?'None yet':String(b);bb.classList.toggle('none',b===null);
  $('boxhow').textContent=sentence(gm.how)||(gm.href?'A full 3D world. Press G inside it to change the graphics quality.':'');
  $('boxplay').textContent=gm.href?'Enter world':'Play';
  $('boxtop').hidden=!!(gm.href||gm.vs);
  const s=$('boxsrc');s.hidden=!gm.src;if(gm.src)s.href=REPO+gm.src;
  syncFavBtn();drawBoxArt(gm);
 }
 function pick(gm,el){
  if(selEl)selEl.setAttribute('aria-pressed','false');
  sel=gm;selEl=el||byId[gm.id];selEl.setAttribute('aria-pressed','true');resetStops();fillBox(gm);
  if(SHEET.matches){box.classList.add('open');$('boxplay').focus({preventScroll:true});}
 }
 function closeSheet(){if(!box.classList.contains('open'))return false;box.classList.remove('open');if(stopPrev){stopPrev();stopPrev=null;}if(selEl)selEl.focus({preventScroll:true});return true;}
 $('boxclose').onclick=()=>{if(!closeSheet()){if(selEl){selEl.setAttribute('aria-pressed','false');selEl.focus({preventScroll:true});}sel=selEl=null;if(stopPrev){stopPrev();stopPrev=null;}bfull.hidden=true;bempty.hidden=false;}};
 $('boxplay').onclick=()=>play(sel);
 $('boxtop').onclick=()=>{if(sel)A.showBoard(sel);};
 $('boxfav').onclick=()=>{if(!sel)return;favs.has(sel.id)?favs.delete(sel.id):favs.add(sel.id);lsSet('pxd_favs',[...favs]);syncFavBtn();syncFavMarks();syncChips();};
 function syncFavBtn(){const on=!!sel&&favs.has(sel.id),b=$('boxfav');b.setAttribute('aria-pressed',on);b.textContent=on?'Favorited':'Favorite';}
 function syncFavMarks(){Object.values(byId).forEach(el=>{const on=favs.has(el.dataset.id),f=el.querySelector('.fav');if(on&&!f){const i=document.createElement('i');i.className='fav';i.setAttribute('aria-hidden','true');el.appendChild(i);}else if(!on&&f)f.remove();});}
 addEventListener('keydown',e=>{if(E.state!=='hub')return;
  if(e.key==='Escape'&&$('board')&&!$('board').hidden)return;
  if(e.key==='Escape'&&closeSheet()){e.preventDefault();return;}
  if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){e.preventDefault();q.focus();q.select();}
 });
 SHEET.addEventListener&&SHEET.addEventListener('change',()=>{if(!SHEET.matches)box.classList.remove('open');});

 /* filters: All, Recent, Favorites, then one chip per shelf */
 const chip=(c,label,n)=>{const b=document.createElement('button');b.type='button';b.dataset.c=c;b.setAttribute('aria-pressed','false');b.innerHTML='<span></span> <span class="n"></span>';b.firstChild.textContent=label;b.lastChild.textContent=n;b.onclick=()=>{filt=filt===c&&c!=='All'?'All':c;show();const lib=$('library');if(lib.getBoundingClientRect().top<0||c!=='All')lib.scrollIntoView({behavior:RM.matches?'auto':'smooth',block:'start'});};chips.appendChild(b);return b;};
 chip('All','All',A.games.length);const cRec=chip('RECENT','Recent',0),cFav=chip('FAV','Favorites',0);
 cats.forEach(c=>chip(c,tc(c),A.games.filter(g=>g.cat===c).length));
 function syncChips(){cRec.lastChild.textContent=recent.length;cFav.lastChild.textContent=favs.size;cRec.hidden=!recent.length&&filt!=='RECENT';cFav.hidden=!favs.size&&filt!=='FAV';if(filt==='RECENT'||filt==='FAV')show();}

 /* search: name, id, then word n-grams of tags and rules ("tow def" finds tower defence) */
 const norm=v=>(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const tagHit=(el,s)=>{if(!el._grams){const w=el._tags.split(/[^a-z0-9]+/).filter(Boolean),g=[];for(let i=0;i<w.length;i++)for(let k=1;k<=3&&i+k<=w.length;k++)g.push(w.slice(i,i+k).join(''));el._grams=g;}return el._grams.some(x=>x.startsWith(s));};
 function show(){
  const s=norm(q.value);let n=0;
  Object.values(byId).forEach(el=>{const id=el.dataset.id,ok=(filt==='All'||el.dataset.cat===filt||(filt==='FAV'&&favs.has(id))||(filt==='RECENT'&&recent.includes(id)))&&(!s||id.includes(s)||norm(el._name).includes(s)||tagHit(el,s));el.hidden=!ok;if(ok)n++;});
  grid.querySelectorAll('.shelf').forEach(sec=>{sec.hidden=!sec.querySelector('.spine:not([hidden])');});
  chips.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===filt));
  cnt.textContent=n===A.games.length?n+' cartridges':n+' of '+A.games.length+' cartridges';
  const em=$('empty');em.hidden=n>0;
  if(!n){$('emptyq').textContent=q.value.trim()||(filt==='FAV'?'your favorites':'this shelf');
   const sg=$('emptysugg');sg.innerHTML='';
   const pool=playable(),first=s.slice(0,2),near=first?pool.filter(g=>norm(g.name).startsWith(first)):[];
   const pickN=[...near.slice(0,2)];while(pickN.length<4){const g=pool[Math.random()*pool.length|0];if(!pickN.includes(g))pickN.push(g);}
   pickN.forEach(g=>{const b=document.createElement('button');b.type='button';b.className='btn small';b.textContent=tc(g.name);b.onclick=()=>{clearAll();pick(g);byId[g.id].scrollIntoView({behavior:RM.matches?'auto':'smooth',block:'center'});byId[g.id].focus({preventScroll:true});};sg.appendChild(b);});}
  resetStops();
 }
 const clearAll=()=>{q.value='';filt='All';show();};
 $('emptyclear').onclick=()=>{clearAll();q.focus();};
 q.addEventListener('input',show);
 q.addEventListener('keydown',e=>{if(e.key==='Escape'&&q.value){e.stopPropagation();clearAll();}else if(e.key==='Enter'){const f=grid.querySelector('.spine:not([hidden])');if(f){e.preventDefault();$('library').scrollIntoView({block:'start'});f.focus();}}});

 /* views: printed spines on planks, or box fronts with artwork */
 const vbtn=[...document.querySelectorAll('.views [data-view]')];
 function setView(v){
  vbtn.forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===v));lsSet('pxd_view',v);
  Object.values(rows).forEach(r=>r.classList.toggle('boxes',v==='boxes'));
  if(v==='boxes')Object.values(byId).forEach(el=>{if(el._art)return;const gm=A.games.find(g=>g.id===el.dataset.id),h=document.createElement('span');h.className='art loading';h.setAttribute('aria-hidden','true');el.insertBefore(h,el.firstChild);el._art=h;
   if(window.IntersectionObserver){(A._artIO=A._artIO||new IntersectionObserver(es=>{for(const en of es)if(en.isIntersecting){A._artIO.unobserve(en.target);en.target._go();}},{rootMargin:'400px 0px'}));h._go=()=>art(gm,h,()=>h.classList.remove('loading'));A._artIO.observe(h);}else art(gm,h,()=>h.classList.remove('loading'));});
 }
 vbtn.forEach(b=>b.onclick=()=>setView(b.dataset.view));
 setView(ls('pxd_view','shelf')==='boxes'?'boxes':'shelf');

 /* odds and ends: counts, random picks, theme */
 const st={games:A.games.length,worlds:A.games.filter(g=>g.href).length};
 document.querySelectorAll('[data-stat]').forEach(el=>{if(st[el.dataset.stat])el.textContent=st[el.dataset.stat];});
 document.querySelectorAll('[data-random]').forEach(b=>b.onclick=()=>{const p=playable();play(p[Math.random()*p.length|0]);});
 if(matchMedia('(max-width: 720px)').matches)q.placeholder='Search';
 const tb=$('themeBtn');
 if(tb){const cur=()=>document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const lab=()=>tb.setAttribute('aria-label',cur()==='dark'?'Switch to light mode':'Switch to dark mode');
  tb.onclick=()=>{const t=cur()==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('pxd_theme',t);}catch(e){}lab();};lab();}
 syncChips();show();
};
})();
