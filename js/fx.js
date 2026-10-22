/* Scroll polish shared by the hub and the docs site: a reading-progress bar, sections that rise in as they reach
   the viewport, pixel headings that decode from scrambled glyphs, and the scrolling marquee of world names.
   Everything here is decoration: with reduced motion, or without IntersectionObserver, the page is simply static. */
(function(){
 const root=document.documentElement,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const bar=document.querySelector('.progress');
 if(bar){const f=()=>{const h=root.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0).toFixed(4)+')';};addEventListener('scroll',f,{passive:true});addEventListener('resize',f);f();}
 // the marquee repeats its list twice so the loop is seamless; names come from the elements data-from points at
 document.querySelectorAll('.marquee[data-from]').forEach(mq=>{
  const names=[...document.querySelectorAll(mq.dataset.from)].map(e=>e.textContent.trim()).filter(Boolean);if(!names.length)return;
  const run=document.createElement('div');run.className='mrun';
  for(let k=0;k<2;k++)names.forEach(n=>{const s=document.createElement('span');s.textContent=n;if(k)s.setAttribute('aria-hidden','true');run.appendChild(s);});
  mq.replaceChildren(run);});
 if(RM||!window.IntersectionObserver)return;
 root.classList.add('fx');
 const G='ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#+=<>/';
 function decode(el){
  const t=el.textContent;if(!t.trim()||el.children.length)return;
  el.setAttribute('aria-label',t);const t0=performance.now(),dur=Math.min(900,280+t.length*28);
  const step=now=>{const k=(now-t0)/dur;let o='';
   for(let i=0;i<t.length;i++){const c=t[i];o+=c===' '||k*1.25>i/t.length+.25?c:G[(Math.random()*G.length)|0];}
   el.textContent=k>=1?t:o;if(k<1)requestAnimationFrame(step);else el.removeAttribute('aria-label');};
  requestAnimationFrame(step);}
 const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const el=e.target;io.unobserve(el);el.classList.add('in');
  el.querySelectorAll('[data-decode]').forEach(decode);if(el.matches('[data-decode]'))decode(el);}},{rootMargin:'0px 0px -10% 0px'});
 const tag=(sel,stagger)=>document.querySelectorAll(sel).forEach((el,i)=>{el.setAttribute('data-reveal','');if(stagger)el.style.setProperty('--d',(i%stagger)*70+'ms');io.observe(el);});
 document.querySelectorAll('.sec-head h2,.doc h2').forEach(h=>h.setAttribute('data-decode',''));
 tag('.sec-head,.mkcard,.sign,.spot-copy,.spot-fresh,.doc>*:not(h1):not(.lead)',0);
 tag('.fc',4);
 // posters and the console lean a few degrees toward the pointer
 if(matchMedia('(hover:hover) and (pointer:fine)').matches)document.querySelectorAll('.fc,[data-tilt]').forEach(c=>{
  c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
   c.style.setProperty('--ry',(x*7).toFixed(2)+'deg');c.style.setProperty('--rx',(-y*6).toFixed(2)+'deg');});
  c.addEventListener('pointerleave',()=>{c.style.removeProperty('--rx');c.style.removeProperty('--ry');});});
})();
