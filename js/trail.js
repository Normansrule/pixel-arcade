// Pixel spark cursor trail.
(()=>{if(matchMedia('(pointer:coarse)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const c=document.createElement('canvas');c.id='trail';document.body.appendChild(c);const x=c.getContext('2d');let W,H;const fit=()=>{W=c.width=innerWidth;H=c.height=innerHeight;};fit();addEventListener('resize',fit);
 const P=[],cols=['#ffcf3f','#ff3f8e','#2fe8d0'];let lx=0,ly=0;
 addEventListener('pointermove',e=>{if(document.body.classList.contains('playing'))return;const d=Math.hypot(e.clientX-lx,e.clientY-ly);lx=e.clientX;ly=e.clientY;for(let i=0;i<Math.min(4,d/6);i++)P.push({x:e.clientX,y:e.clientY,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2-.5,t:30,c:cols[Math.random()*3|0],s:2+Math.random()*3|0});});
 addEventListener('pointerdown',e=>{if(document.body.classList.contains('playing'))return;for(let i=0;i<24;i++){const a=Math.random()*6.28,v=2+Math.random()*4;P.push({x:e.clientX,y:e.clientY,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:34,c:cols[i%3],s:3});}});
 const loop=()=>{requestAnimationFrame(loop);x.clearRect(0,0,W,H);for(const p of P){p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.t--;x.globalAlpha=Math.max(0,p.t/30);x.fillStyle=p.c;x.fillRect(p.x|0,p.y|0,p.s,p.s);}for(let i=P.length-1;i>=0;i--)if(P[i].t<=0)P.splice(i,1);};loop();})();
