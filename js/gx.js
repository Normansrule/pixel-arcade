/* ---- A.gx: shared paint kit for the canvas game packs; loaded after js/engine/ (see games/index.json) (gradients, glossy blocks, glow, HUD panels, cached backdrops, local fx) ---- */
(function(){const A=window.A;if(A.gx)return;const W=320,H=240;
const hx=h=>{if(typeof h!=='string'||h[0]!=='#')return[128,128,128];if(h.length===4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];const n=parseInt(h.slice(1,7),16);return[n>>16,(n>>8)&255,n&255];};
const lt=(h,f)=>{const c=hx(h).map(v=>Math.max(0,Math.min(255,f>1?v+(255-v)*(f-1):v*f))|0);return'rgb('+c[0]+','+c[1]+','+c[2]+')';};
const rgba=(h,a)=>{const c=hx(h);return'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';};
const ok=g=>g&&g.addColorStop;
const stops=(g,cols)=>{const n=cols.length;cols.forEach((c,i)=>g.addColorStop(n>1?i/(n-1):0,c));return g;};
const lg=(x0,y0,x1,y1,cols)=>{const c=A.c,g=c.createLinearGradient&&c.createLinearGradient(x0,y0,x1,y1);return ok(g)?stops(g,cols):cols[cols.length>>1];};
const rg=(x,y,r0,x1,y1,r1,cols)=>{const c=A.c,g=c.createRadialGradient&&c.createRadialGradient(x,y,Math.max(0,r0),x1,y1,Math.max(.01,r1));return ok(g)?stops(g,cols):cols[0];};
const fr=(x,y,w,h,f)=>{const c=A.c;c.fillStyle=f;c.fillRect(x,y,w,h);};
const rrp=(x,y,w,h,r)=>{const c=A.c;r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();};
const X={hx,lt,rgba,lg,rg,
 vg:(x,y,w,h,cols)=>fr(x,y,w,h,lg(0,y,0,y+h,cols)),
 hg:(x,y,w,h,cols)=>fr(x,y,w,h,lg(x,0,x+w,0,cols)),
 sky:(cols,h)=>fr(0,0,W,h||H,lg(0,0,0,h||H,cols)),
 rr:(x,y,w,h,r,f)=>{rrp(x,y,w,h,r);A.c.fillStyle=f;A.c.fill();},
 rrs:(x,y,w,h,r,s,lw)=>{rrp(x,y,w,h,r);A.c.strokeStyle=s;A.c.lineWidth=lw||1;A.c.stroke();},
 ell:(x,y,rx,ry,f,rot)=>{const c=A.c;c.fillStyle=f;c.beginPath();if(c.ellipse)c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,6.2832);c.fill();},
 shadow:(x,y,rx,ry,a)=>X.ell(x,y,rx,ry,'rgba(0,0,0,'+(a===undefined?.3:a)+')'),
 disc:(x,y,r,f)=>{const c=A.c;c.fillStyle=f;c.beginPath();c.arc(x,y,Math.max(.1,r),0,6.2832);c.fill();},
 /* glossy sphere: base color, rim shade, specular dot */
 orb:(x,y,r,col,spec)=>{r=Math.max(.6,r);X.disc(x,y,r,rg(x-r*.35,y-r*.4,r*.05,x,y,r,[lt(col,1.55),col,lt(col,.45)]));if(spec!==0&&r>2.5)X.ell(x-r*.33,y-r*.42,r*.32,r*.2,'rgba(255,255,255,.75)',-.5);},
 /* soft additive glow */
 glow:(x,y,r,col,a)=>{const c=A.c,o=c.globalCompositeOperation;c.globalCompositeOperation='lighter';X.disc(x,y,r,rg(x,y,0,x,y,r,[rgba(col,a===undefined?.55:a),rgba(col,0)]));c.globalCompositeOperation=o||'source-over';},
 /* beveled glossy block (bricks, tiles, platforms) */
 block:(x,y,w,h,col,r)=>{r=r===undefined?Math.min(3,w/4,h/4):r;X.rr(x,y,w,h,r,lg(0,y,0,y+h,[lt(col,1.35),col,lt(col,.62)]));const c=A.c;c.fillStyle='rgba(255,255,255,.28)';c.fillRect(x+r,y+1,w-2*r,Math.max(1,h*.22));c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x+r,y+h-1.2,w-2*r,1.2);X.rrs(x+.5,y+.5,w-1,h-1,r,'rgba(0,0,0,.35)',1);},
 /* gem / crystal cell */
 gem:(x,y,s,col)=>{const c=A.c,h=s/2;X.poly([[x,y-h],[x+h,y],[x,y+h],[x-h,y]],lg(x-h,y-h,x+h,y+h,[lt(col,1.6),col,lt(col,.5)]));X.poly([[x,y-h],[x+h*.5,y-h*.2],[x,y],[x-h*.5,y-h*.2]],'rgba(255,255,255,.35)');},
 poly:(pts,f)=>{const c=A.c;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=f;c.fill();},
 polys:(pts,s,lw)=>{const c=A.c;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.strokeStyle=s;c.lineWidth=lw||1;c.stroke();},
 stroke:(pts,s,lw,cap)=>{const c=A.c;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.strokeStyle=s;c.lineWidth=lw||1;c.lineCap=cap||'round';c.lineJoin='round';c.stroke();c.lineCap='butt';},
 /* deterministic twinkling stars; scroll px offsets for parallax */
 stars:(n,seed,sx,sy,h,bright)=>{const c=A.c;h=h||H;for(let i=0;i<n;i++){const k=(i*7919+seed*104729)%100003,x=((k*13)%W+W-((sx||0)*(1+i%3)/3)%W)%W,y=((k*29)%h+h-((sy||0)*(1+i%3)/3)%h)%h,tw=.35+.65*Math.abs(Math.sin(A.t*.03+i)),s=i%9===0?1.6:i%3===0?1:.7;c.fillStyle='rgba(255,255,'+(220+i%36)+','+(tw*(bright||.9)).toFixed(2)+')';c.fillRect(x,y,s,s);}},
 /* silhouette hills/skyline band: y base, amplitude, color, scroll offset, frequency */
 hills:(y,amp,col,off,fq,seed)=>{const c=A.c;fq=fq||.02;seed=seed||1;c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=4){const u=(x+(off||0))*fq;c.lineTo(x,y-amp*(.5+.3*Math.sin(u+seed)+.2*Math.sin(u*2.3+seed*3)));}c.lineTo(W,H);c.closePath();c.fillStyle=col;c.fill();},
 skyline:(y,col,off,seed,win)=>{const c=A.c;off=off||0;let x=-((off%40)+40)%40-40,i=Math.floor(off/40);for(;x<W+40;x+=20,i++){const k=((i*2654435761)>>>0)%997,bh=18+k%46,bw=14+k%10;c.fillStyle=col;c.fillRect(x,y-bh,bw,bh+H);if(win)for(let wy=y-bh+4;wy<y-3;wy+=6)for(let wx=x+3;wx<x+bw-3;wx+=5)if((wx*7+wy*13+k)%5<2){c.fillStyle=win;c.fillRect(wx,wy,2,3);}}},
 vignette:(a)=>fr(0,0,W,H,rg(W/2,H/2,H*.35,W/2,H/2,H*.95,['rgba(0,0,0,0)','rgba(0,0,0,'+(a||.45)+')'])),
 grid:(y0,col,off,n)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=.6;c.beginPath();for(let i=-12;i<=12;i++){c.moveTo(160+i*8,y0);c.lineTo(160+i*60,H);}for(let j=0;j<(n||10);j++){const t=((j+((off||0)%1))/(n||10)),yy=y0+(H-y0)*t*t;c.moveTo(0,yy);c.lineTo(W,yy);}c.stroke();},
 /* HUD panel + outlined text */
 panel:(x,y,w,h,acc)=>{X.rr(x,y,w,h,3,lg(0,y,0,y+h,['rgba(30,24,70,.82)','rgba(8,6,24,.86)']));X.rrs(x+.5,y+.5,w-1,h-1,3,acc?rgba(acc,.7):'rgba(255,255,255,.18)',1);A.c.fillStyle='rgba(255,255,255,.12)';A.c.fillRect(x+3,y+1,w-6,1);},
 ot:(s,x,y,col,sc,al)=>{const c=A.c,a=c.globalAlpha;c.globalAlpha=a*.8;for(const d of[[-1,0],[1,0],[0,-1],[0,1]])A.text(s,x+d[0],y+d[1],'#000000',sc,al,1);c.globalAlpha=a;A.text(s,x,y,col,sc,al,1);},
 /* top HUD bar: left text, right text, centre text */
 bar:(l,r,m,lc,rc)=>{fr(0,0,W,17,lg(0,0,0,17,['rgba(10,6,30,.92)','rgba(10,6,30,.55)']));fr(0,17,W,1,'rgba(255,255,255,.12)');if(l!==undefined&&l!=='')A.text(l,6,4,lc||A.K.y,2);if(r!==undefined&&r!=='')A.text(r,W-6,4,rc||A.K.w,2,'r');if(m)A.text(m,W/2,6,A.K.c,1,'c');},
 meter:(x,y,w,h,f,col,bg)=>{f=Math.max(0,Math.min(1,f||0));X.rr(x,y,w,h,h/2,bg||'rgba(0,0,0,.55)');if(f>0)X.rr(x+1,y+1,(w-2)*f,h-2,(h-2)/2,lg(0,y,0,y+h,[lt(col,1.5),col,lt(col,.65)]));A.c.fillStyle='rgba(255,255,255,.25)';A.c.fillRect(x+2,y+1,Math.max(0,(w-4)*f),1);},
 heart:(x,y,s,col)=>{s=s||1;X.disc(x-2*s,y,2.3*s,col||'#ff4f6d');X.disc(x+2*s,y,2.3*s,col||'#ff4f6d');X.poly([[x-4.2*s,y+.6*s],[x+4.2*s,y+.6*s],[x,y+5*s]],col||'#ff4f6d');A.c.fillStyle='rgba(255,255,255,.6)';A.c.fillRect(x-3*s,y-1.2*s,1.2*s,1.2*s);},
 /* textures */
 turf:(x,y,w,h,c1,c2,band,vert)=>{fr(x,y,w,h,c1);A.c.fillStyle=c2;band=band||16;if(vert){for(let i=0;i<w;i+=band*2)A.c.fillRect(x+i,y,Math.min(band,w-i),h);}else for(let i=0;i<h;i+=band*2)A.c.fillRect(x,y+i,w,Math.min(band,h-i));},
 wood:(x,y,w,h,col,vert)=>{fr(x,y,w,h,col);const c=A.c;c.fillStyle='rgba(0,0,0,.12)';if(vert)for(let i=0;i<w;i+=7)c.fillRect(x+i,y,1,h);else for(let i=0;i<h;i+=7)c.fillRect(x,y+i,w,1);c.fillStyle='rgba(255,255,255,.06)';if(vert)for(let i=3;i<w;i+=13)c.fillRect(x+i,y,2,h);else for(let i=3;i<h;i+=13)c.fillRect(x,y+i,w,2);},
 water:(x,y,w,h,c1,c2,t)=>{fr(x,y,w,h,lg(0,y,0,y+h,[c1,c2]));const c=A.c;c.fillStyle='rgba(255,255,255,.14)';for(let j=y+4;j<y+h;j+=9)for(let i=0;i<w;i+=26){const o=((t||0)*.5+j*3)%26;c.fillRect(x+((i+o)%w),j+Math.sin((i+j+(t||0)*.1))*1,9,1);}},
 /* cached static layer, re-rendered when key changes. fn draws in logical coords */
 cache:(key,fn)=>{if(typeof document==='undefined'||!A.c||!A.c.drawImage){fn();return;}let e=X._c[key];if(!e){if(Object.keys(X._c).length>40)X._c={};const cv=document.createElement('canvas');cv.width=640;cv.height=480;const cx=cv.getContext('2d');cx.scale(2,2);const sv=A.c;A.c=cx;try{fn();}finally{A.c=sv;}e=X._c[key]=cv;}A.c.drawImage(e,0,0,W,H);},_c:{},
 /* local effects: rings, sparks, flashes, floating text. create one per game */
 fx:()=>{const L=[];let fl=0,flc='#ffffff';const o={
  ring:(x,y,col,r1,t)=>L.push({k:0,x,y,c:col,r1:r1||24,t:t||18,m:t||18}),
  spark:(x,y,col,n,sp)=>{for(let i=0;i<(n||10);i++){const a=Math.random()*6.283,v=(sp||2.5)*(.4+Math.random());L.push({k:1,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,c:col,t:14+Math.random()*14|0,m:28});}},
  debris:(x,y,col,n,sp)=>{for(let i=0;i<(n||8);i++){const a=Math.random()*6.283,v=(sp||2)*(.5+Math.random());L.push({k:3,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,c:col,t:30+Math.random()*20|0,m:50,s:1.5+Math.random()*2.5,r:Math.random()*6});}},
  pop:(x,y,txt,col)=>L.push({k:2,x,y,txt:String(txt),c:col||'#ffcf3f',t:40,m:40}),
  flash:(col,t)=>{fl=t||8;flc=col||'#ffffff';},
  draw:()=>{const c=A.c;for(const p of L){p.t--;const f=p.t/p.m;if(p.k===0){c.globalAlpha=Math.max(0,f);c.strokeStyle=p.c;c.lineWidth=1+2*f;c.beginPath();c.arc(p.x,p.y,Math.max(.5,p.r1*(1-f)+2),0,6.2832);c.stroke();}else if(p.k===1){p.x+=p.vx;p.y+=p.vy;p.vx*=.9;p.vy*=.9;c.globalAlpha=Math.max(0,f*1.4>1?1:f*1.4);c.strokeStyle=p.c;c.lineWidth=1.2;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*3,p.y-p.vy*3);c.stroke();}else if(p.k===3){p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.r+=.2;c.globalAlpha=Math.min(1,f*2);c.save();c.translate(p.x,p.y);c.rotate(p.r);c.fillStyle=p.c;c.fillRect(-p.s/2,-p.s/2,p.s,p.s);c.restore();}else{p.y-=.6;c.globalAlpha=Math.min(1,f*2);A.text(p.txt,p.x,p.y,p.c,1,'c');}}c.globalAlpha=1;for(let i=L.length-1;i>=0;i--)if(L[i].t<=0)L.splice(i,1);if(L.length>300)L.splice(0,L.length-300);if(fl>0){c.globalAlpha=fl/16;c.fillStyle=flc;c.fillRect(0,0,W,H);c.globalAlpha=1;fl--;}},
  clear:()=>{L.length=0;fl=0;}};return o;},
 /* squash/stretch helper: returns scale pair from a 0..1 impulse */
 sq:v=>[1+v*.35,1-v*.3]
};
A.gx=X;})();
