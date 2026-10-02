/* ---- A.gx: shared paint kit for the classic packs (gradients, glossy blocks, glow, HUD panels, cached backdrops, local fx) ---- */
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
(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const crowd=(y0,y1,seed)=>{const c=A.c;for(let y=y0;y<y1;y+=5)for(let x=(y/5%2)*3;x<W;x+=6){const k=((x|0)*31+(y|0)*17+seed)%7;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84','#c86dff','#ff9838'][k];c.globalAlpha=.55;c.fillRect(x,y+1,4,4);c.fillStyle=['#f1c7a3','#c68a5e','#6e4428'][k%3];c.fillRect(x+1,y-1,2,2);}c.globalAlpha=1;};

/* ---- PADDLE DUEL ---- */
A.add({id:'pong',name:'PADDLE DUEL',cat:'SPORTS',vs:1,how:'UP/DOWN. FIRST TO 7.',make(){
 const g={over:null,score:0},fx=X.fx();let p=[104,104],sc=[0,0],b,serve,tr=[],hit=[0,0];
 const reset=d=>{b={x:160,y:120,vx:d*2.2,vy:rnd(2)-1};serve=50;tr=[];};reset(1);
 g.update=()=>{if(A.cpu){const ty=b.vx>0?b.y:120,c=p[1]+16;A.bot({u:c>ty+5,d:c<ty-5});}hit=hit.map(v=>v?v-1:0);
  for(let i=0;i<2;i++){const sp=i&&A.cpu?1.4+2*A.ai:3.2;p[i]=cl(p[i]+ay(A.in(i))*sp,22,H-36);}
  if(serve>0){serve--;return;}tr.unshift([b.x,b.y]);if(tr.length>10)tr.pop();b.x+=b.vx;b.y+=b.vy;
  if(b.y<24||b.y>H-6){b.vy*=-1;b.y=cl(b.y,24,H-6);S('blip');fx.spark(b.x,b.y,'#ffffff',4,1.5);}
  for(let i=0;i<2;i++){const px=i?304:16;if((i?b.vx>0:b.vx<0)&&Math.abs(b.x-px)<5&&b.y>p[i]-3&&b.y<p[i]+35){b.vx=cl(-b.vx*1.06,-6.5,6.5);b.vy=(b.y-p[i]-16)/5;S('hit');hit[i]=10;fx.spark(b.x,b.y,i?'#ff7fc0':'#7ff0e0',10,2.5);fx.ring(b.x,b.y,'#ffffff',14,10);if(Math.abs(b.vx)>5)A.shake=3;}}
  if(b.x<-5||b.x>W+5){const w=b.x<0?1:0;sc[w]++;S('score');fx.flash(w?'#ff4f9a':'#2fd6c3',10);fx.ring(b.x<0?0:W,b.y,'#ffffff',60,20);if(sc[w]>=7)g.over=A.win(w);else reset(w?-1:1);}};
 g.draw=()=>{X.cache('pongbg',()=>{X.sky(['#0a0628','#130a3a','#0a0628']);const c=A.c;c.strokeStyle='rgba(120,100,255,.08)';c.lineWidth=1;c.beginPath();for(let x=0;x<W;x+=20){c.moveTo(x,20);c.lineTo(x,H);}for(let y=20;y<H;y+=20){c.moveTo(0,y);c.lineTo(W,y);}c.stroke();X.glow(160,130,130,'#5a3aff',.12);for(let y=22;y<H;y+=12){c.fillStyle='rgba(180,170,255,.45)';c.fillRect(159,y,2,6);}A.ring(160,130,30,'rgba(180,170,255,.25)');c.fillStyle='rgba(180,170,255,.6)';c.fillRect(0,20,W,1);c.fillRect(0,H-1,W,1);});
  const c=A.c;c.globalAlpha=.22;T(sc[0],120,40,'#2fd6c3',6,'c',1);T(sc[1],200,40,'#ff4f9a',6,'c',1);c.globalAlpha=1;
  tr.forEach((q,i)=>{c.globalAlpha=.4*(1-i/10);X.disc(q[0],q[1],3-i*.2,'#ffffff');});c.globalAlpha=1;
  [0,1].forEach(i=>{const x=i?304:12,col=i?'#ff4f9a':'#2fd6c3',sq=hit[i]*.25;X.glow(x+2,p[i]+16,26,col,.3+hit[i]*.03);X.rr(x-sq/2+(i?sq:-sq)*.4,p[i]-sq,4+sq,32+sq*2,2,X.lg(x,0,x+4,0,[X.lt(col,1.5),col,X.lt(col,.6)]));});
  X.glow(b.x,b.y,12,'#ffffff',.5);X.orb(b.x,b.y,3,'#f0f0ff');fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(serve>0&&serve<40)X.ot('SERVE',160,100,K.y,1,'c');};
 return g;}});

/* ---- COURT TENNIS (pseudo-3D) ---- */
A.add({id:'tennis',name:'COURT TENNIS',cat:'SPORTS',vs:1,how:'MOVE. A SWINGS. HOLD SIDE TO AIM. FIRST TO 7.',make(){
 const g={over:null,score:0},GR=.0012,fx=X.fx();let pl,b,sc=[0,0],wait=0,srv=0,msg='';
 const pr=(x,y,z)=>{const s=1/(1+y*.5);return[160+x*125*s,218-(y/(1+y*.5))*150-(z||0)*70*s,s];};
 const shoot=(i,tx,ty,t)=>{b.vx=(tx-b.x)/t;b.vy=(ty-b.y)/t;b.vz=(.5*GR*t*t-b.z)/t;b.last=i;b.bn=0;S('hit');const p=pr(b.x,b.y,b.z);fx.spark(p[0],p[1],'#ffffa0',6,1.8);};
 const serve=()=>{pl=[{x:0,y:.15,sw:0},{x:0,y:1.85,sw:0}];b={x:0,y:srv?1.8:.2,z:.4,vx:0,vy:0,vz:0,last:srv,bn:0};shoot(srv,rnd(.8)-.4,srv?.55:1.45,62);wait=0;};
 const point=(w,m)=>{sc[w]++;msg=m;wait=70;srv=w;S('score');if(sc[w]>=7)g.over=A.win(w);};serve();
 g.update=()=>{if(wait>0){if(--wait===0)serve();return;}
  if(A.cpu){const q=pl[1];let tx=0,ty=1.7;if(b.last===0){const t=Math.max(0,(1.6-b.y)/(b.vy||.01));tx=b.x+b.vx*Math.min(t,80);ty=cl(b.y>1?b.y+.1:1.6,1.2,1.9);}
   const near=Math.abs(b.x-q.x)<.2&&Math.abs(b.y-q.y)<.22;A.bot({l:q.x>tx+.05,r:q.x<tx-.05,u:q.y<ty-.05,d:q.y>ty+.05,a:near&&b.last===0&&A.t%3===0});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),sp=(i&&A.cpu?.011+.012*A.ai:.024);q.x=cl(q.x+ax(k)*sp,-1.25,1.25);q.y=cl(q.y-ay(k)*sp,i?1.12:-.15,i?2.15:.88);
   if(q.sw>0)q.sw--;if(A.hit(i).a&&q.sw===0){q.sw=18;if(b.last!==i&&Math.abs(b.x-q.x)<.27&&Math.abs(b.y-q.y)<.27&&b.z<.85){const aim=ax(k)*.7+rnd(.3)-.15;shoot(i,cl(aim,-.92,.92),i?.35+rnd(.4):1.65-rnd(.4),50+rnd(12));}}}
  const oy=b.y;b.x+=b.vx;b.y+=b.vy;b.z+=b.vz;b.vz-=GR;
  if((oy-1)*(b.y-1)<=0&&oy!==b.y&&b.z<.13){point(1-b.last,'NET!');return;}
  if(b.z<0){b.z=0;b.vz*=-.72;b.bn++;const p=pr(b.x,b.y);fx.spark(p[0],p[1],'#e8d8b0',4,1.2);const inb=Math.abs(b.x)<=1.02&&(b.last===0?b.y>1&&b.y<=2.03:b.y<1&&b.y>=-.03);
   if(b.bn===1&&!inb)point(1-b.last,'OUT!');else if(b.bn===2)point(b.last,'POINT!');else S('blip');}};
 g.draw=()=>{X.cache('tennisbg',()=>{X.sky(['#4a8ad8','#a8d8f8'],70);crowd(40,70,3);X.vg(0,68,W,H-68,['#1a5a3a','#2a7a4a','#1a5a3a']);const q=(x,y)=>pr(x,y);X.poly([q(-1.25,-.15),q(1.25,-.15),q(1.25,2.15),q(-1.25,2.15)],'#2a8a5a');X.poly([q(-1,0),q(1,0),q(1,2),q(-1,2)],X.lg(0,70,0,218,['#3a7ad0','#2a6ab8']));
   [[-1,0,1,0],[-1,2,1,2],[-1,0,-1,2],[1,0,1,2],[-.75,0,-.75,2],[.75,0,.75,2],[-.75,.5,.75,.5],[-.75,1.5,.75,1.5],[0,.5,0,1.5]].forEach(l=>{const a=q(l[0],l[1]),c=q(l[2],l[3]);L(a[0],a[1],c[0],c[1],'rgba(255,255,255,.9)',1.2);});});
  const ents=[{y:pl[1].y,f:()=>man(1)},{y:1,f:()=>{const a=pr(-1.1,1),c=pr(1.1,1),t=pr(-1.1,1,.13),cx=A.c;cx.fillStyle='rgba(20,20,30,.35)';cx.fillRect(a[0],t[1],c[0]-a[0],a[1]-t[1]);cx.strokeStyle='rgba(255,255,255,.25)';cx.lineWidth=.5;cx.beginPath();for(let x=a[0];x<c[0];x+=3){cx.moveTo(x,t[1]);cx.lineTo(x,a[1]);}for(let y=t[1];y<a[1];y+=2){cx.moveTo(a[0],y);cx.lineTo(c[0],y);}cx.stroke();L(a[0],t[1],c[0],t[1],'#ffffff',1.5);X.vg(a[0]-2,t[1]-2,2,a[1]-t[1]+2,['#ddd','#888']);X.vg(c[0],t[1]-2,2,a[1]-t[1]+2,['#ddd','#888']);}},
   {y:b.y,f:()=>{const s=pr(b.x,b.y),p=pr(b.x,b.y,b.z);X.shadow(s[0],s[1],3*s[2]+.6,1.4*s[2]+.3,.35);X.glow(p[0],p[1],7*p[2]+2,'#e8ff60',.35);X.orb(p[0],p[1],2.8*p[2]+.8,'#e0ff40');}},{y:pl[0].y,f:()=>man(0)}];
  function man(i){const m=pl[i],p=pr(m.x,m.y),s=p[2]*1.05,sw=m.sw>8,a=sw?-2.2:-.6;A.person(p[0],p[1],{c:i?K.p:K.c,pants:'#f2f2f2',st:(m.x+m.y)*.4,s,id:i*3+2,cap:i?null:'#ffffff',arm2:a});const sx=p[0]+5*s,sy=p[1]-21*s,hx=sx-Math.sin(a)*10*s,hy=sy+Math.cos(a)*10*s,rx=hx-Math.sin(a)*6*s,ry=hy+Math.cos(a)*6*s;X.stroke([[hx,hy],[rx,ry]],'#333',1.2);A.c.strokeStyle='#ffcf3f';A.c.lineWidth=1.2;A.c.beginPath();if(A.c.ellipse)A.c.ellipse(rx-Math.sin(a)*3*s,ry+Math.cos(a)*3*s,3*s+.5,4*s+.5,a,0,6.283);A.c.stroke();}
  ents.sort((a,c)=>c.y-a.y).forEach(e=>e.f());fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(wait>0)X.ot(msg,160,60,K.y,3,'c');};
 return g;}});

/* ---- BEACH VOLLEY ---- */
A.add({id:'volley',name:'BEACH VOLLEY',cat:'SPORTS',vs:1,how:'MOVE. UP JUMPS. FIRST TO 7.',make(){
 const g={over:null,score:0},GY=212,fx=X.fx();let pl,b,sc=[0,0],wait=40,spin=0,sq=[0,0];
 const reset=s=>{pl=[{x:80,y:GY,vy:0},{x:240,y:GY,vy:0}];b={x:s?232:88,y:90,vx:0,vy:0};wait=40;};reset(0);
 g.update=()=>{spin+=b.vx*.05;sq=sq.map(v=>v?v-1:0);if(wait>0){wait--;return;}
  if(A.cpu){const q=pl[1];let tx=240;if(b.x>150){let x=b.x,y=b.y,vx=b.vx,vy=b.vy,n=0;while(y<GY-22&&n++<120){vy+=.16;x+=vx;y+=vy;if(x>W-7||x<167)vx=-vx;}tx=x+8;}
   A.bot({l:q.x>tx+4,r:q.x<tx-4,u:b.x>160&&Math.abs(b.x-q.x)<30&&b.y>GY-95&&b.y<GY-40&&Math.random()<A.ai});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),sp=i&&A.cpu?1.5+1.6*A.ai:3;q.x=cl(q.x+ax(k)*sp,i?180:16,i?W-16:140);if((k.u||k.a)&&q.y>=GY){q.vy=-5.2;S('jump');fx.spark(q.x,GY,'#f0d8a0',5,1.5);}q.vy+=.26;q.y+=q.vy;if(q.y>GY){if(q.vy>3)sq[i]=8;q.y=GY;q.vy=0;}
   const dx=b.x-q.x,dy=b.y-(q.y-2),d=Math.hypot(dx,dy);if(d<24&&dy<6){const nx=dx/(d||1),ny=dy/(d||1);b.x=q.x+nx*24;b.y=q.y-2+ny*24;const sp2=Math.max(4.2,Math.hypot(b.vx,b.vy)*.9);b.vx=nx*sp2+ax(k)*.8;b.vy=ny*sp2-1+q.vy*.4;S('hit');sq[i]=6;fx.ring(b.x,b.y,'#ffffff',12,10);fx.spark(b.x,b.y,'#fff8d0',5,1.8);}}
  b.vy+=.16;b.x+=b.vx;b.y+=b.vy;b.vx=cl(b.vx,-6,6);b.vy=cl(b.vy,-8,8);
  if(b.x<7){b.x=7;b.vx=Math.abs(b.vx);}if(b.x>W-7){b.x=W-7;b.vx=-Math.abs(b.vx);}if(b.y<7){b.y=7;b.vy=Math.abs(b.vy);}
  if(b.y>GY-62&&Math.abs(b.x-160)<10){if(b.y<GY-56&&b.vy>0){b.vy=-Math.abs(b.vy)*.8;b.y=GY-63;}else{b.vx=(b.x<160?-1:1)*Math.max(1.5,Math.abs(b.vx));b.x=160+(b.x<160?-10:10);}}
  if(b.y>GY-7){const w=b.x<160?1:0;sc[w]++;S('score');fx.debris(b.x,GY,'#f0d090',14,2.5);fx.ring(b.x,GY,'#ffffff',24);if(sc[w]>=7)g.over=A.win(w);else reset(w);}};
 const bg=()=>{X.sky(['#2a7ad8','#7ac0f0','#ffe0b0'],150);X.disc(262,52,18,X.rg(262,52,0,262,52,18,['#fffbe0','#ffe070','#ffb040']));X.glow(262,52,60,'#ffd070',.35);for(let i=0;i<3;i++){X.disc(40+i*90,40+(i%2)*14,7,'rgba(255,255,255,.85)');X.disc(50+i*90,36+(i%2)*14,9,'rgba(255,255,255,.85)');X.disc(62+i*90,41+(i%2)*14,6,'rgba(255,255,255,.85)');}
  X.vg(0,150,W,62,['#1a8ab8','#2ab0c8','#6ad8d0']);const c=A.c;c.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<30;i++)c.fillRect((i*47)%W,156+(i*13)%46,8+(i%3)*4,1);
  const palm=(x,h,f)=>{c.strokeStyle='#7a5a3a';c.lineWidth=3;c.beginPath();c.moveTo(x,GY);c.quadraticCurveTo(x+f*10,GY-h/2,x+f*4,GY-h);c.stroke();for(let i=0;i<6;i++){const a=i*1.05;X.stroke([[x+f*4,GY-h],[x+f*4+Math.cos(a)*16,GY-h+Math.sin(a)*6+4]],'#2a8a3a',2.5);}X.disc(x+f*4,GY-h+2,2.5,'#6a4a2a');};palm(18,70,1);palm(300,60,-1);
  X.vg(0,GY,W,28,['#f8e0a8','#e8c07a','#c89a58']);for(let i=0;i<80;i++){c.fillStyle=i%2?'rgba(160,110,50,.25)':'rgba(255,255,255,.25)';c.fillRect((i*37)%W,GY+3+(i*11)%24,1.5,1);}
  c.fillStyle='#ddd';c.fillRect(158,GY-58,4,58);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(150,GY-58,20,1);};
 const slime=(q,i)=>{const col=i?'#ff4f9a':'#2fd6c3',s=sq[i]*.04,c=A.c;X.shadow(q.x,GY+1,16-(GY-q.y)*.06,3,.3);c.save();c.translate(q.x,q.y);c.scale(1+s,1-s);c.fillStyle=X.lg(0,-17,0,0,[X.lt(col,1.5),col,X.lt(col,.6)]);c.beginPath();c.arc(0,0,17,Math.PI,0);c.fill();X.ell(-6,-11,5,2.5,'rgba(255,255,255,.45)',-.4);
  const ex=i?-6:6,ea=Math.atan2(b.y-(q.y-8),b.x-(q.x+ex));X.disc(ex,-8,4,'#ffffff');X.disc(ex+Math.cos(ea)*1.8,-8+Math.sin(ea)*1.8,1.9,'#111');c.fillStyle=i?'#ffcf3f':'#ff9838';c.fillRect(-12,-15,24,2.5);c.restore();};
 g.draw=()=>{X.cache('volleybg',bg);const c=A.c;c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.6;c.beginPath();for(let y=GY-56;y<GY-30;y+=4){c.moveTo(152,y);c.lineTo(168,y);}for(let x=152;x<=168;x+=4){c.moveTo(x,GY-56);c.lineTo(x,GY-30);}c.stroke();c.fillStyle='#fff';c.fillRect(150,GY-58,20,2);
  pl.forEach(slime);X.shadow(b.x,GY+2,6*(1-(GY-b.y)/300),1.6,.25);c.save();c.translate(b.x,b.y);X.orb(0,0,7,'#ffffff');c.rotate(spin);c.strokeStyle='#4dabff';c.lineWidth=1.4;c.beginPath();c.arc(0,0,6,0,1.6);c.stroke();c.strokeStyle='#ffcf3f';c.beginPath();c.arc(0,0,6,2.1,3.7);c.stroke();c.strokeStyle='#ff4f6d';c.beginPath();c.arc(0,0,6,4.2,5.8);c.stroke();c.restore();
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- HOOPS ONE ON ONE ---- */
A.add({id:'hoops',name:'HOOPS 1 ON 1',cat:'SPORTS',vs:1,how:'A SHOOTS / STEALS. UP BLOCKS. 60 SEC.',make(){
 const g={over:null,score:0},GY=205,HX=[296,24],HY=112,fx=X.fx();let pl,b,sc=[0,0],time=3600,clock=0,msg='',mt=0,net=[0,0];
 const give=i=>{pl=[{x:110,y:GY,vy:0,cd:0},{x:210,y:GY,vy:0,cd:0}];b={own:i,x:0,y:0,vx:0,vy:0,pts:2,by:i};clock=600;};give(0);
 g.update=()=>{if(mt>0)mt--;time--;net=net.map(v=>v?v-1:0);
  if(A.cpu){const q=pl[1],o=pl[0];let o2={};if(b.own===1){const d=q.x-HX[1];o2={l:d>95,a:d<=95+rnd(30)||clock<90||(Math.abs(q.x-o.x)<20&&Math.random()<.04)};}
   else if(b.own===0){const tx=o.x-10;o2={l:q.x>tx+4,r:q.x<tx-4,a:Math.abs(q.x-o.x)<18&&Math.random()<.05*A.ai};}
   else{const tx=b.own===-1?b.x:60;o2={l:q.x>tx+4,r:q.x<tx-4,u:b.own===-2&&b.by===0&&Math.abs(b.x-q.x)<26&&b.y>GY-90&&Math.random()<A.ai*.3};}A.bot(o2);}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),h=A.hit(i),sp=(b.own===i?2:2.4)*(i&&A.cpu?.6+.4*A.ai:1);q.x=cl(q.x+ax(k)*sp,14,W-14);if(q.cd>0)q.cd--;
   if(k.u&&q.y>=GY&&b.own!==i){q.vy=-4.6;}q.vy+=.25;q.y+=q.vy;if(q.y>GY){q.y=GY;q.vy=0;}
   if(h.a){if(b.own===i){const dx=HX[i]-q.x,dist=Math.abs(dx),t=38+dist*.12,def=Math.abs(pl[1-i].x-q.x)<26?1.8:1,err=(rnd(2)-1)*(dist*.011+.12)*def;b.x=q.x;b.y=q.y-30;b.vx=dx/t+err;b.vy=(HY-b.y-.5*.2*t*t)/t;b.own=-2;b.by=i;b.pts=dist>170?3:2;S('jump');}
    else if(b.own===1-i&&q.cd===0&&Math.abs(q.x-pl[1-i].x)<20){q.cd=40;if(Math.random()<.45){b.own=i;clock=600;S('coin');fx.pop(q.x,q.y-44,'STEAL!',K.y);}}}}
  if(b.own>=0){const q=pl[b.own];b.x=q.x+(b.own?-8:8);b.y=q.y-14-Math.abs(Math.sin(A.t*.25))*8;if(--clock<=0){msg='SHOT CLOCK!';mt=60;give(1-b.own);}}
  else{const oyb=b.y;b.vy+=.2;b.x+=b.vx;b.y+=b.vy;
   if(b.own===-2){const hx=HX[b.by];if(oyb<HY&&b.y>=HY&&Math.abs(b.x-hx)<9){sc[b.by]+=b.pts;msg=b.pts+' POINTS!';mt=60;S('score');net[b.by]=20;fx.spark(hx,HY+6,'#ffffff',12,2.5);fx.ring(hx,HY,K.y,24);give(1-b.by);return;}
    if(Math.abs(b.y-HY)<4&&Math.abs(Math.abs(b.x-hx)-11)<3){b.vx=-b.vx*.6;b.vy=-Math.abs(b.vy)*.5;S('blip');fx.spark(b.x,b.y,K.o,5,1.5);}
    const d=pl[1-b.by];if(Math.abs(b.x-d.x)<11&&Math.abs(b.y-(d.y-30))<12&&d.y<GY-6){b.vx=-b.vx*.4;b.vy=-2;b.own=-1;S('hit');fx.pop(d.x,d.y-46,'BLOCK!',K.c);fx.ring(b.x,b.y,'#ffffff',14,10);}}
   if(b.x<6||b.x>W-6){b.vx*=-.7;b.x=cl(b.x,6,W-6);}if(b.y>GY-4){b.y=GY-4;b.vy*=-.6;b.vx*=.85;b.own=-1;}
   if(b.own===-1||b.y>GY-45)for(let i=0;i<2;i++)if(b.own<0&&Math.abs(b.x-pl[i].x)<12&&b.y>pl[i].y-40&&(b.own===-1||i!==b.by)){b.own=i;clock=600;}}
  if(time<=0&&sc[0]!==sc[1])g.over=A.win(sc[0]>sc[1]?0:1);};
 const bg=()=>{X.sky(['#140c30','#2a1a50','#3a2050'],GY);crowd(60,130,7);X.glow(160,40,150,'#ffd890',.18);const c=A.c;for(const lx of[60,160,260]){X.glow(lx,22,30,'#fff0c0',.35);X.disc(lx,22,3,'#fffbe8');}
  X.vg(0,GY,W,H-GY,['#d89a5a','#b0703a','#7a4a24']);for(let x=0;x<W;x+=14){c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x,GY,1,H-GY);}c.fillStyle='rgba(255,240,200,.18)';c.fillRect(0,GY+6,W,3);c.fillStyle='#fff';c.fillRect(0,GY,W,1.5);c.fillRect(159.5,GY,1,H-GY);
  c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;c.beginPath();if(c.ellipse){c.ellipse(160,GY+16,26,8,0,0,6.283);}c.stroke();
  HX.forEach((hx,i)=>{const bx=i?4:W-8;X.vg(bx+1,HY+10,2,GY-HY-10,['#9aa0b0','#5a6070']);c.fillStyle='rgba(220,240,255,.35)';c.fillRect(bx-(i?0:2),HY-34,6,44);c.strokeStyle='#fff';c.lineWidth=1;c.strokeRect(bx-(i?0:2),HY-34,6,44);c.fillStyle='#ff6a3a';c.fillRect(bx+(i?4:-16),HY,16,2);});};
 g.draw=()=>{X.cache('hoopsbg',bg);const c=A.c;
  HX.forEach((hx,i)=>{const sw=net[i]?Math.sin(net[i]*.8)*2:0;c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=.7;c.beginPath();for(let n=0;n<4;n++){c.moveTo(hx-9+n*6,HY+2);c.lineTo(hx-6+n*4+sw,HY+14);}for(let y=HY+5;y<HY+14;y+=4){c.moveTo(hx-9+(y-HY)*.25,y);c.lineTo(hx+9-(y-HY)*.25+sw,y);}c.stroke();X.vg(hx-10,HY,20,2.5,['#ff9a5a','#d0401a']);});
  pl.forEach((q,i)=>{X.shadow(q.x,GY+1,9-(GY-q.y)*.05,2,.3);A.person(q.x,q.y,{c:i?K.p:K.c,pants:i?'#6a1a3a':'#0a4a44',num:i?7:23,st:q.y<GY?0:q.x*.25,d:i?-1:1,s:1.15,id:i*3+1,arm1:b.own===i&&i?-.4-Math.abs(Math.sin(A.t*.25)):q.y<GY?-2.8:undefined,arm2:b.own===i&&!i?.4+Math.abs(Math.sin(A.t*.25)):q.y<GY?2.8:undefined});});
  if(b.own<0)X.shadow(b.x,GY+1,4,1.2,.25);c.save();c.translate(b.x,b.y);X.orb(0,0,5,'#ff8a2a');c.rotate(b.x*.1);c.strokeStyle='rgba(60,20,0,.7)';c.lineWidth=.6;c.beginPath();c.moveTo(-5,0);c.lineTo(5,0);c.moveTo(0,-5);c.lineTo(0,5);c.stroke();c.restore();
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);X.panel(140,2,40,14,time<600?K.r:K.c);T(Math.max(0,Math.ceil(time/60)),160,4,time<0?K.r:K.w,2,'c');if(time<=0)X.ot('NEXT BASKET WINS',160,20,K.r,1,'c');
  if(b.own>=0)X.ot('SHOT '+Math.ceil(clock/60),160,28,clock<180?K.r:K.gr,1,'c');if(mt>0)X.ot(msg,160,70,K.y,3,'c');};
 return g;}});

/* ---- PIXEL SOCCER ---- */
A.add({id:'soccer',name:'PIXEL SOCCER',cat:'SPORTS',vs:1,how:'RUN INTO BALL. A KICKS. FIRST TO 5.',make(){
 const g={over:null,score:0},fx=X.fx();let pl,kp,b,sc=[0,0],time=5400,wait=50,spin=0,netS=[0,0];
 const reset=()=>{pl=[{x:100,y:125,fx:1,fy:0},{x:220,y:125,fx:-1,fy:0}];kp=[125,125];b={x:160,y:125,vx:0,vy:0};wait=50;};reset();
 g.update=()=>{netS=netS.map(v=>v?v-1:0);spin+=Math.hypot(b.vx,b.vy)*.15;if(wait>0){wait--;return;}time--;
  if(A.cpu){const q=pl[1],vx=b.x-14,vy=b.y-125,n=Math.hypot(vx,vy)||1,ux=vx/n,uy=vy/n,beh=(q.x-b.x)*ux+(q.y-b.y)*uy>2,dd=Math.hypot(q.x-b.x,q.y-b.y);let tx,ty;if(beh){tx=b.x+ux*2;ty=b.y+uy*2;}else{tx=b.x+ux*22;ty=b.y+uy*22+(q.y<b.y?-16:16);}
   A.bot({l:q.x>tx+1.5,r:q.x<tx-1.5,u:q.y>ty+1.5,d:q.y<ty-1.5,a:beh&&dd<9&&A.t%4===0&&(b.x<190||Math.random()<.3)});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),dx=ax(k),dy=ay(k),sp=i&&A.cpu?1.1+.9*A.ai:1.9;q.mv=!!(dx||dy);if(dx||dy){const m=Math.hypot(dx,dy);q.fx=dx/m;q.fy=dy/m;q.x=cl(q.x+q.fx*sp,14,W-14);q.y=cl(q.y+q.fy*sp,30,H-14);}
   const ddx=b.x-q.x,ddy=b.y-q.y,d=Math.hypot(ddx,ddy);if(d<9){if(A.hit(i).a){b.vx=q.fx*5.5;b.vy=q.fy*5.5;S('hit');fx.ring(b.x,b.y,'#ffffff',12,10);fx.spark(b.x,b.y,'#c8ffc8',5,2);}else{b.vx=ddx/(d||1)*2.3+q.fx*.5;b.vy=ddy/(d||1)*2.3+q.fy*.5;}}
   const ty=cl(b.y,100,150),ks=.9+.5*(i&&A.cpu?A.ai:.7);kp[i]+=cl(ty-kp[i],-ks,ks);const kx=i?W-18:18;if(Math.abs(b.x-kx)<6&&Math.abs(b.y-kp[i])<10){b.vx=(i?-1:1)*(2.5+rnd(2));b.vy=rnd(4)-2;S('blip');fx.pop(kx,kp[i]-24,'SAVE!',K.c);}}
  b.x+=b.vx;b.y+=b.vy;b.vx*=.975;b.vy*=.975;if(Math.hypot(b.vx,b.vy)<.4&&(b.x<24||b.x>W-24||b.y<40||b.y>H-24)){b.vx+=(160-b.x)*.004;b.vy+=(125-b.y)*.004;}if(b.y<28||b.y>H-12){b.vy*=-1;b.y=cl(b.y,28,H-12);}
  const inG=b.y>95&&b.y<155;if(b.x<12||b.x>W-12){if(inG){const w=b.x<12?1:0;sc[w]++;S('score');netS[w?0:1]=24;fx.flash('#ffffff',8);fx.pop(160,80,'GOAL!',K.y);fx.debris(b.x,b.y,K.y,14,3);if(sc[w]>=5){g.over=A.win(w);return;}reset();}else{b.vx*=-1;b.x=cl(b.x,12,W-12);}}
  if(time<=0){if(sc[0]!==sc[1])g.over=A.win(sc[0]>sc[1]?0:1);else time=600;}};
 const bg=()=>{X.turf(0,18,W,H-18,'#1f7a3a','#25883f',20,true);X.vg(0,18,W,H-18,['rgba(255,255,255,.06)','rgba(0,0,0,.18)']);const c=A.c;c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.2;c.strokeRect(10,26,W-20,H-36);c.beginPath();c.moveTo(160,26);c.lineTo(160,H-10);c.stroke();c.beginPath();c.arc(160,125,28,0,6.283);c.stroke();c.strokeRect(10,85,34,80);c.strokeRect(W-44,85,34,80);c.strokeRect(10,105,14,40);c.strokeRect(W-24,105,14,40);X.disc(160,125,1.6,'#fff');X.disc(34,125,1.2,'#fff');X.disc(W-34,125,1.2,'#fff');
  for(const[x,y,a0]of[[10,26,0],[W-10,26,1.57],[W-10,H-10,3.14],[10,H-10,4.71]]){c.beginPath();c.arc(x,y,5,a0,a0+1.57);c.stroke();}X.vignette(.35);};
 const goal=(x,dir,s)=>{const c=A.c,sw=s?Math.sin(s*.6)*1.5:0;c.fillStyle='rgba(255,255,255,.12)';c.fillRect(dir<0?x-8:x,95,8,60);c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=.5;c.beginPath();for(let y=95;y<=155;y+=4){c.moveTo(x,y);c.lineTo(x+dir*(8+sw),y);}for(let i=0;i<=8;i+=3){c.moveTo(x+dir*(i+sw*(i/8)),95);c.lineTo(x+dir*(i+sw*(i/8)),155);}c.stroke();c.fillStyle='#fff';c.fillRect(dir<0?x-1:x-1,94,2,62);};
 g.draw=()=>{X.cache('soccerbg',bg);goal(11,-1,netS[0]);goal(W-11,1,netS[1]);
  kp.forEach((y,i)=>A.person((i?W-18:18),y+9,{c:i?'#ffb3d1':'#a8fff5',pants:'#222',s:.6,id:i*2+1,arm1:-2.4,arm2:2.4,d:i?-1:1}));pl.forEach((q,i)=>A.person(q.x,q.y+7,{c:i?K.p:K.c,pants:'#f2f2f2',num:i?9:10,st:q.mv?(q.x+q.y)*.3:0,d:q.fx<0?-1:1,s:.62,id:i*2}));
  const c=A.c;X.shadow(b.x+1,b.y+3,3.5,1.3,.3);c.save();c.translate(b.x,b.y);X.orb(0,0,3.6,'#ffffff');c.rotate(spin);c.fillStyle='#222';c.fillRect(-1,-1,2,2);c.fillRect(1.6,-2.6,1.2,1.2);c.fillRect(-2.8,1.2,1.2,1.2);c.restore();
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);X.panel(140,2,40,14,K.c);T(Math.ceil(time/60),160,4,K.w,2,'c');if(wait>0)X.ot('KICK OFF',160,60,K.y,3,'c');};
 return g;}});

/* ---- AIR HOCKEY ---- */
A.add({id:'airhockey',name:'AIR HOCKEY',cat:'SPORTS',vs:1,how:'SLIDE MALLET. SCORE 7.',make(){
 const g={over:null,score:0},fx=X.fx();let m,b,sc=[0,0],wait=40,tr=[];
 const reset=s=>{m=[{x:50,y:125,vx:0,vy:0},{x:270,y:125,vx:0,vy:0}];b={x:s?190:130,y:125,vx:0,vy:0};wait=40;tr=[];};reset(0);
 g.update=()=>{if(wait>0){wait--;return;}
  if(A.cpu){const q=m[1],gy=m[0].y<125?150:100,gx=6,dx=gx-b.x,dy=gy-b.y,dl=Math.hypot(dx,dy)||1,ux=dx/dl,uy=dy/dl;let tx=278,ty=cl(b.y,90,160);
   if(b.x>162){const bx=b.x-ux*16,by=b.y-uy*16,behind=(q.x-b.x)*-ux+(q.y-b.y)*-uy>6;if(behind){tx=b.x+ux*6;ty=b.y+uy*6;}else{tx=bx+(q.y<b.y?0:0);ty=by+(Math.abs(q.y-by)<12?(q.y<by?-14:14):0);}if(b.vx>2.5&&b.x>q.x-30){tx=278;ty=cl(b.y+b.vy*8,95,155);}}
   A.bot({l:q.x>tx+2,r:q.x<tx-2,u:q.y>ty+2,d:q.y<ty-2});}
  for(let i=0;i<2;i++){const q=m[i],k=A.in(i),acc=i&&A.cpu?.35+.45*A.ai:.8;q.vx=(q.vx+ax(k)*acc)*.86;q.vy=(q.vy+ay(k)*acc)*.86;q.x=cl(q.x+q.vx,i?172:22,i?W-22:148);q.y=cl(q.y+q.vy,40,H-24);
   const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<17){const nx=dx/(d||1),ny=dy/(d||1);b.x=q.x+nx*17;b.y=q.y+ny*17;const rv=(b.vx-q.vx)*nx+(b.vy-q.vy)*ny;if(rv<0){b.vx-=1.9*rv*nx;b.vy-=1.9*rv*ny;S('hit');fx.spark(b.x-nx*6,b.y-ny*6,'#ffffff',6,2);if(rv<-3){fx.ring(b.x,b.y,'#ffe060',16,10);A.shake=2;}}}}
  const sp=Math.hypot(b.vx,b.vy);if(sp>7){b.vx*=7/sp;b.vy*=7/sp;}if(sp<.3){g.st=(g.st||0)+1;if(g.st>240){b.vx=(b.x<160?1:-1)*1.2;b.vy=A.rnd(1)-.5;g.st=0;}}else g.st=0;tr.unshift([b.x,b.y]);if(tr.length>8)tr.pop();b.x+=b.vx;b.y+=b.vy;b.vx*=.994;b.vy*=.994;
  if(b.y<35||b.y>H-19){b.vy*=-1;b.y=cl(b.y,35,H-19);S('blip');fx.spark(b.x,b.y<100?30:H-14,'#9fd0ff',4,1.5);}
  if(b.x<17||b.x>W-17){if(b.y>95&&b.y<155){if(b.x<6||b.x>W-6){const w=b.x<17?1:0;sc[w]++;S('score');fx.flash(w?'#ff4f9a':'#2fd6c3',10);fx.spark(b.x<160?8:W-8,b.y,K.y,18,3);fx.pop(160,80,'GOAL!',K.y);if(sc[w]>=7)g.over=A.win(w);else reset(w?0:1);}}else{b.vx*=-1;b.x=cl(b.x,17,W-17);S('blip');}}};
 const bg=()=>{X.sky(['#1a1a2e','#0a0a18']);X.rr(4,22,W-8,H-28,10,X.lg(0,22,0,H,['#c8ccd8','#6a6e80']));X.rr(10,28,W-20,H-40,8,X.lg(0,28,0,H-12,['#f8fcff','#dce8f4']));const c=A.c;
  c.fillStyle='rgba(90,120,170,.25)';for(let y=36;y<H-16;y+=8)for(let x=18+(y/8%2)*4;x<W-16;x+=8)c.fillRect(x,y,1,1);c.fillStyle='rgba(255,255,255,.45)';c.fillRect(14,30,W-28,6);
  c.strokeStyle='rgba(255,79,109,.8)';c.lineWidth=2;c.beginPath();c.moveTo(160,28);c.lineTo(160,H-12);c.stroke();c.beginPath();c.arc(160,125,26,0,6.283);c.stroke();c.strokeStyle='rgba(77,171,255,.7)';c.lineWidth=1.5;c.beginPath();c.arc(10,125,34,-1.57,1.57);c.stroke();c.beginPath();c.arc(W-10,125,34,1.57,4.71);c.stroke();
  c.fillStyle='#111';c.fillRect(4,95,8,60);c.fillRect(W-12,95,8,60);};
 const mallet=(q,i)=>{const col=i?'#ff4f9a':'#2fd6c3';X.shadow(q.x+2,q.y+3,12,9,.25);X.disc(q.x,q.y,11.5,X.rg(q.x-4,q.y-4,1,q.x,q.y,11.5,[X.lt(col,1.4),col,X.lt(col,.5)]));X.disc(q.x,q.y,7,X.lt(col,.7));X.orb(q.x,q.y-1,5,col);};
 g.draw=()=>{X.cache('ahbg',bg);const c=A.c;tr.forEach((q,i)=>{c.globalAlpha=.25*(1-i/8);X.disc(q[0],q[1],6,'#ffcf3f');});c.globalAlpha=1;
  m.forEach(mallet);X.shadow(b.x+1,b.y+2,6.5,5,.3);X.disc(b.x,b.y,6.4,'#1a1a1a');X.disc(b.x,b.y,5,X.rg(b.x-1,b.y-2,0,b.x,b.y,5,['#fff090','#ffcf3f','#c89010']));X.glow(b.x,b.y,10,'#ffcf3f',.25+Math.min(.4,Math.hypot(b.vx,b.vy)*.05));
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);};
 return g;}});
})();
