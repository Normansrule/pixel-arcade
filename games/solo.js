(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};
const hsl=(h,s,l)=>'hsl('+(h%360)+','+s+'%,'+l+'%)';

/* ---- TOWER STACK ---- */
A.add({id:'stack',name:'TOWER STACK',cat:'CLASSICS',how:'A DROPS THE BLOCK. OVERHANG GETS CUT.',make(){
 const g={over:null,score:0},fx=X.fx(),BH=14;let base={x:110,w:100},cur={x:0,w:100,d:1},y=210-BH,blocks=[],cam=0,perfect=0,chips=[],land=0,pf=0,cut=0;
 g.update=()=>{if(land)land--;if(pf)pf--;if(cut)cut--;chips.forEach(q=>{q.vy+=.25;q.y+=q.vy;q.x+=q.vx;q.r+=q.vr;});chips=chips.filter(q=>q.y+cam<H+40);
  cur.x+=cur.d*(1.6+g.score*.05);if(cur.x<0||cur.x+cur.w>W)cur.d*=-1;if(A.hit(0).a){const l=Math.max(cur.x,base.x),r=Math.min(cur.x+cur.w,base.x+base.w);if(r-l<4){g.over='TOPPLED';S('lose');A.shake=7;fx.flash('#ff4040',8);chips.push({x:cur.x,y,w:cur.w,vx:cur.d*1.5,vy:-1,r:0,vr:.05*cur.d,h:g.score});return;}
  const sy=y+cam+BH/2;if(Math.abs(cur.x-base.x)<3){perfect++;pf=24;cur.x=base.x;cur.w=base.w;if(perfect>2&&base.w<110){base.w+=4;cur.w=base.w;}S('coin');fx.ring(cur.x+cur.w/2,sy,'#ffffff',cur.w*.7,16);fx.ring(cur.x+cur.w/2,sy,hsl(g.score*12,90,70),cur.w*.95,24);fx.spark(cur.x,sy,'#fff6c0',6,2);fx.spark(cur.x+cur.w,sy,'#fff6c0',6,2);fx.flash('#ffffff',3);}
  else{perfect=0;cut=10;A.shake=3;const col=hsl(g.score*12,70,55);if(cur.x<l){chips.push({x:cur.x,y,w:l-cur.x,vx:-1.2,vy:-1.5,r:0,vr:-.07,h:g.score});fx.debris(l,sy,col,6,1.6);}if(cur.x+cur.w>r){chips.push({x:r,y,w:cur.x+cur.w-r,vx:1.2,vy:-1.5,r:0,vr:.07,h:g.score});fx.debris(r,sy,col,6,1.6);}cur.x=l;cur.w=r-l;S('hit');}
  blocks.push({x:cur.x,w:cur.w,y,h:g.score,p:pf>0});land=8;base={x:cur.x,w:cur.w};fx.spark(cur.x+2,y+cam+BH,'#ffffff',3,1.2);fx.spark(cur.x+cur.w-2,y+cam+BH,'#ffffff',3,1.2);y-=BH;g.score++;cur={x:cur.d>0?0:W-cur.w,w:cur.w,d:cur.d};}
  const t=Math.max(0,120-y);cam+=(t-cam)*.15;};
 const slab=(x,y,w,h,hue,a,gl)=>{const c=A.c,dx=7,dy=6;if(a!==undefined)c.globalAlpha=a;X.poly([[x,y],[x+dx,y-dy],[x+w+dx,y-dy],[x+w,y]],X.lg(0,y-dy,0,y,[hsl(hue,80,82),hsl(hue,75,66)]));c.fillStyle=X.lg(0,y,0,y+h,[hsl(hue,78,60),hsl(hue,72,46),hsl(hue,70,34)]);c.fillRect(x,y,w,h);X.poly([[x+w,y],[x+w+dx,y-dy],[x+w+dx,y+h-dy],[x+w,y+h]],hsl(hue,60,26));
  c.fillStyle='rgba(255,255,255,.45)';c.fillRect(x,y,w,1);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(x+2,y+3,w-4,2);c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x,y+h-1.5,w,1.5);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x,y,1,h);if(gl){c.globalAlpha=(a===undefined?1:a)*gl;c.fillStyle='#ffffff';c.fillRect(x,y,w,h);X.poly([[x,y],[x+dx,y-dy],[x+w+dx,y-dy],[x+w,y]],'#ffffff');}c.globalAlpha=1;};
 const cloud=(x,y,s,a)=>{const c=A.c;c.globalAlpha=a;X.ell(x+12*s,y+6*s,26*s,6*s,'rgba(120,140,190,.5)');X.disc(x,y,10*s,'#f4f8ff');X.disc(x+13*s,y-5*s,13*s,'#ffffff');X.disc(x+27*s,y,9*s,'#eef4ff');X.ell(x+13*s,y+4*s,24*s,6*s,'#e4ecfa');c.globalAlpha=1;};
 g.draw=()=>{const k=cl(cam/700,0,1),c=A.c;c.fillStyle=X.lg(0,0,0,H,[A.mix('#3c8ef0','#05051a',k),A.mix('#8cc8ff','#1a1050',k),A.mix('#e8f6ff','#5a3a8a',k)]);c.fillRect(0,0,W,H);
  if(k>.25){c.globalAlpha=Math.min(1,(k-.25)*1.6);X.stars(80,4,0,-cam*.08,H,.95);c.globalAlpha=1;}
  const sy=40+cam*.05;if(k<.9){X.glow(260,sy,70,'#fff2c0',.5*(1-k));X.disc(260,sy,14,A.mix('#fffbe0','#ffd890',k));}else{X.glow(70,50,40,'#bfd0ff',.3);X.disc(70,50,9,'#e8eeff');X.disc(74,47,8,A.mix('#5ab0ff','#05051a',k));}
  for(let i=0;i<7;i++){const yy=((i*67+cam*(.25+i%3*.1))%420)-70,xx=(i*113+20)%(W+40)-30;cloud(xx,yy,.6+(i%3)*.25,.85*(1-k*.8));}
  X.hills(170+cam*.3,38,A.mix('#7aa6d8','#20184a',k),0,.012,5);X.hills(196+cam*.55,28,A.mix('#5a9a7a','#141030',k),40,.02,2);
  const gy=210+cam;if(gy<H+30){X.hills(gy+4,14,'#4a8a4a',90,.03,7);X.vg(0,gy,W,Math.max(1,H-gy+30),['#7ad05a','#3a8a3a','#24602a']);for(let i=0;i<14;i++){const tx=(i*41+7)%W;if(Math.abs(tx-160)<70)continue;X.ell(tx,gy+6,7,2,'rgba(0,0,0,.2)');c.fillStyle='#5a3a1a';c.fillRect(tx-1,gy-6,2,10);X.orb(tx,gy-9,6,'#3aa84a',0);}
   X.vg(92,gy,136,10,['#c8c0b0','#8a8070']);X.vg(98,gy-2,124,3,['#e8e0d0','#b0a898']);X.poly([[110,gy],[117,gy-6],[217,gy-6],[210,gy]],'#d8d2c4');X.block(110,gy,100,BH,'#a49c8c',1);X.poly([[210,gy],[217,gy-6],[217,gy+BH-6],[210,gy+BH]],'#6a6458');for(let i=0;i<5;i++){c.fillStyle='rgba(0,0,0,.15)';c.fillRect(120+i*20,gy+2,1,BH-4);}}
  if(!g.over&&blocks.length<200){const b=blocks.length?blocks[blocks.length-1]:null,ty=y+cam+BH;c.globalAlpha=.22+.1*Math.sin(A.t*.15);c.fillStyle='#ffffff';c.fillRect(base.x,ty-60,1,60);c.fillRect(base.x+base.w-1,ty-60,1,60);c.globalAlpha=1;}
  blocks.forEach((b,i)=>{const by=b.y+cam;if(by>-20&&by<H+20){const top=i===blocks.length-1;slab(b.x,by+(top&&land?-land*.4:0),b.w,BH,b.h*12,undefined,top&&land&&b.p?land/14:0);}});
  if(!g.over){const l=Math.max(cur.x,base.x),r=Math.min(cur.x+cur.w,base.x+base.w);if(r>l)X.vg(l,y+cam+BH-2,r-l,4,['rgba(0,0,0,.28)','rgba(0,0,0,0)']);X.glow(cur.x+cur.w/2,y+cam-2+BH/2,cur.w*.65,hsl(g.score*12,90,70),.25);slab(cur.x,y+cam-6+Math.sin(A.t*.12),cur.w,BH,g.score*12);}
  chips.forEach(q=>{c.save();c.translate(q.x+q.w/2,q.y+cam+BH/2);c.rotate(q.r);slab(-q.w/2,-BH/2,q.w,BH,q.h*12,.9);c.restore();});
  X.vignette(.3);fx.draw();X.panel(118,4,84,30,perfect>1?K.y:'#ffffff');X.ot(g.score,160,8,K.w,3,'c');A.text('FLOORS',160,26,'rgba(255,255,255,.6)',1,'c');
  if(pf){c.globalAlpha=Math.min(1,pf/8);const s=pf>18?2+(pf-18)*.15:2;X.ot(perfect>1?'PERFECT X'+perfect:'PERFECT',160,46,K.y,s>2.4?3:2,'c');c.globalAlpha=1;}if(perfect>1){X.panel(8,6,62,14,K.y);X.ot('COMBO X'+perfect,39,10,K.y,1,'c');}
  if(base.w<100){X.meter(W-66,10,58,6,base.w/100,base.w<30?K.r:base.w<60?K.y:K.g);A.text('WIDTH',W-37,19,'rgba(255,255,255,.6)',1,'c');}};
 return g;}});

/* ---- SLIDE 15 ---- */
A.add({id:'slide',name:'SLIDE 15',cat:'PUZZLE',low:1,how:'ARROWS SLIDE A TILE INTO THE GAP. ORDER 1-15.',make(){
 const g={over:null,score:0},fx=X.fx();let b=[...Array(16).keys()].map(i=>(i+1)%16),an={i:-1,dx:0,dy:0},glow=Array(16).fill(0);const gap=()=>b.indexOf(0);
 for(let i=0;i<300;i++){const e=gap(),ds=[e%4>0?e-1:-1,e%4<3?e+1:-1,e>3?e-4:-1,e<12?e+4:-1].filter(v=>v>=0),t=ds[ri(ds.length)];b[e]=b[t];b[t]=0;}
 g.update=()=>{an.dx*=.55;an.dy*=.55;glow=glow.map(v=>v?v-1:0);const h=A.hit(0),e=gap();let t=-1;if(h.l&&e%4<3)t=e+1;if(h.r&&e%4>0)t=e-1;if(h.u&&e<12)t=e+4;if(h.d&&e>3)t=e-4;if(t>=0){b[e]=b[t];b[t]=0;an={i:e,dx:((t%4)-(e%4))*40,dy:(((t/4)|0)-((e/4)|0))*40};g.score++;S('blip');if(b[e]===e+1){glow[e]=24;fx.spark(80+(e%4)*40+19,40+((e/4)|0)*40+19,'#3ddc84',8,1.8);fx.ring(80+(e%4)*40+19,40+((e/4)|0)*40+19,'#3ddc84',26,16);S('coin');}else if(b[t]===0&&b[e]===t+1){A.shake=1;}if(b.every((v,i)=>v===(i+1)%16)){g.over='SOLVED! WIN';S('win');A.confetti();fx.flash('#3ddc84',8);}}};
 const bg=()=>{const c=A.c;X.wood(0,0,W,H,'#3a2416');X.vg(0,0,W,H,['rgba(255,190,120,.10)','rgba(0,0,0,.3)']);X.glow(160,60,190,'#ffcf8a',.22);X.shadow(162,214,100,10,.45);
  X.rr(66,26,188,188,12,X.lg(0,26,0,214,['#a06a3a','#7a4a24','#4a2a12']));c.fillStyle='rgba(255,255,255,.18)';c.fillRect(76,27,168,1.5);X.rrs(66.5,26.5,187,187,12,'rgba(0,0,0,.5)',1);X.rr(76,36,168,168,5,'#120a04');X.vg(76,36,168,14,['rgba(0,0,0,.6)','rgba(0,0,0,0)']);for(let i=0;i<16;i++){const x=80+(i%4)*40,y=40+((i/4)|0)*40;X.rrs(x+.5,y+.5,37,37,4,'rgba(255,220,160,.06)',1);}
  for(const[x,y]of[[72,32],[248,32],[72,208],[248,208]]){X.disc(x,y,2.2,'#d8b070');X.disc(x-.5,y-.6,.8,'rgba(255,255,255,.6)');}
  X.panel(6,40,58,82,'#ffcf3f');A.text('GOAL',35,45,'#ffcf3f',1,'c');for(let i=0;i<15;i++){const x=11+(i%4)*12,y=57+((i/4)|0)*15;X.rr(x,y,11,13,2,X.lg(0,y,0,y+13,['#c8f0b0','#6ac050']));A.text(String(i+1),x+5.5,y+4,'#1a4a10',1,'c');}
  X.panel(258,40,56,160,'#3ddc84');A.text('PLACED',286,45,'#3ddc84',1,'c');X.vignette(.5);};
 g.draw=()=>{X.cache('slidebg2',bg);const c=A.c,e=gap(),n=b.filter((v,i)=>v===i+1).length;
  {const x=80+(e%4)*40,y=40+((e/4)|0)*40;X.rr(x+2,y+2,34,34,4,'rgba(255,207,63,'+(.06+.04*Math.sin(A.t*.12)).toFixed(3)+')');}
  b.forEach((v,i)=>{if(!v)return;const x=80+(i%4)*40+(an.i===i?an.dx:0),y=40+((i/4)|0)*40+(an.i===i?an.dy:0),ok=v===i+1;X.rr(x+1.5,y+3.5,38,38,5,'rgba(0,0,0,.45)');if(ok&&glow[i]&&A.gfx!=='off')X.glow(x+19,y+19,30+glow[i],'#3ddc84',glow[i]/40);X.rr(x,y,38,38,5,X.lg(0,y,0,y+38,ok?['#d0f8b8','#7ad060','#3a8a2a']:['#fce4b4','#e8b070','#a8743a']));c.fillStyle=ok?'rgba(0,60,0,.07)':'rgba(90,40,0,.09)';for(let k=5;k<36;k+=5)c.fillRect(x+3,y+k+(i%3),32,1);c.fillStyle='rgba(255,255,255,.45)';c.fillRect(x+4,y+2,30,2);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x+4,y+35,30,1.5);X.rrs(x+.5,y+.5,37,37,5,ok?'rgba(20,80,10,.7)':'rgba(70,35,10,.6)',1);X.disc(x+19,y+19,12,ok?'rgba(255,255,255,.18)':'rgba(255,240,210,.22)');T(v,x+19.5,y+14,'rgba(255,255,255,.5)',2,'c',1);T(v,x+19,y+13,ok?'#1a4a10':'#5a3010',2,'c',1);});
  X.meter(279,56,14,136,0,'#3ddc84');const mh=134*n/15;if(mh>0)X.rr(280,57+134-mh,12,mh,5,X.lg(0,57,0,191,['#b8ffb0','#3ddc84','#1a8a4a']));T(n+'/15',286,194,K.g,1,'c');
  fx.draw();X.bar('MOVES '+g.score,'',' ',K.w);T(n===15?'SOLVED!':'IN PLACE '+n+'/15',W-6,6,K.g,1,'r');};
 return g;}});

/* ---- PINBALL ---- */
A.add({id:'pinball',name:'PINBALL',cat:'CLASSICS',how:'A/LEFT + B/RIGHT FLIP. DOWN LAUNCHES.',make(){
 const g={over:null,score:0},fx=X.fx();let b=null,balls=3,fl=[0,0],fa=[0,0],tr=[],bumps=[{x:110,y:70,r:11},{x:190,y:70,r:11},{x:150,y:115,r:11},{x:70,y:130,r:8},{x:230,y:130,r:8}],pl=0;
 const launch=()=>{b={x:298,y:200,vx:0,vy:-9-rnd(1.5)};tr=[];};
 g.update=()=>{const k=A.in(0);fl[0]=(k.a||k.l)?1:0;fl[1]=(k.b||k.r)?1:0;fa=fa.map((v,i)=>v+((fl[i]?1:0)-v)*.5);if(!b){pl=k.d?Math.min(1,pl+.05):0;if(A.hit(0).d){launch();S('shoot');}return;}
  tr.unshift([b.x,b.y]);if(tr.length>7)tr.pop();
  b.vy+=.14;b.x+=b.vx;b.y+=b.vy;if(b.x>290){if(b.y<30){b.x=286;b.vx=-2;}else if(b.x>306){b.x=306;b.vx=-Math.abs(b.vx)*.5;}}
  if(b.x<9){b.x=9;b.vx=Math.abs(b.vx)*.8;}if(b.x>282&&b.x<290&&b.y>40){b.x=282;b.vx=-Math.abs(b.vx)*.8;}if(b.y<9){b.y=9;b.vy=Math.abs(b.vy)*.8;}
  for(const q of bumps){const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<q.r+5){b.vx=dx/d*4.5;b.vy=dy/d*4.5;b.x=q.x+dx/d*(q.r+5);b.y=q.y+dy/d*(q.r+5);const pts=q.r>9?100:50;g.score+=pts;q.t=12;S('hit');fx.ring(q.x,q.y,'#ffffff',q.r+10,12);fx.spark(b.x,b.y,'#ffe080',6,2);fx.pop(q.x,q.y-q.r-8,'+'+pts,K.y);}if(q.t)q.t--;}
  [[9,150,90,200],[282,150,201,200]].forEach(w=>{const[x1,y1,x2,y2]=w,dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy,t=cl(((b.x-x1)*dx+(b.y-y1)*dy)/l,0,1),px=x1+dx*t,py=y1+dy*t,d=Math.hypot(b.x-px,b.y-py);if(d<5){const nx=(b.x-px)/d,ny=(b.y-py)/d;b.x=px+nx*5;b.y=py+ny*5;const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.8*dot*nx;b.vy-=1.8*dot*ny;}}});
  [[90,200,1,fl[0]],[201,200,-1,fl[1]]].forEach(f=>{const[fx_,fy,d,up]=f,a=up?-.55*d:.35*d,ex=fx_+d*40*Math.cos(a),ey=fy+40*Math.sin(a);const dx=ex-fx_,dy=ey-fy,l=dx*dx+dy*dy,t=cl(((b.x-fx_)*dx+(b.y-fy)*dy)/l,0,1),px=fx_+dx*t,py=fy+dy*t,dd=Math.hypot(b.x-px,b.y-py);if(dd<6&&b.vy>-1){b.y=py-6;b.vy=up?-7-t*3:-Math.abs(b.vy)*.5;b.vx+=d*(up?1.5:0);S('blip');if(up)fx.spark(b.x,b.y+4,'#ffffff',4,1.5);}});
  if(b.y>H+10){balls--;b=null;S('lose');fx.flash(K.r,8);if(balls<=0)g.over='GAME OVER';}};
 const bg=()=>{X.sky(['#0a0620','#140a30']);X.rr(5,5,289,H,8,X.lg(0,0,0,H,['#3a2a7a','#241a50','#1a1238']));const c=A.c;c.strokeStyle='rgba(160,140,255,.12)';c.lineWidth=1;for(let i=0;i<14;i++){c.beginPath();c.arc(150,95,20+i*14,0,6.283);c.stroke();}
  X.glow(150,95,110,'#ff4f9a',.12);for(const[x,y,col]of[[60,40,'#ffcf3f'],[240,40,'#2fd6c3'],[150,30,'#ff4f9a']]){X.glow(x,y,10,col,.4);X.disc(x,y,3,col);}
  X.vg(282,40,8,H,['#8a86b8','#4a4570']);X.vg(292,40,16,H,['#1a1238','#120c28']);c.fillStyle='rgba(255,255,255,.08)';for(let y=60;y<H;y+=16)c.fillRect(294,y,12,1);
  X.stroke([[9,150],[90,200]],'#2fd6c3',4);X.stroke([[282,150],[201,200]],'#2fd6c3',4);X.stroke([[9,150],[90,200]],'rgba(255,255,255,.5)',1);X.stroke([[282,150],[201,200]],'rgba(255,255,255,.5)',1);X.disc(90,200,4,'#8a86b8');X.disc(201,200,4,'#8a86b8');};
 g.draw=()=>{X.cache('pinbg',bg);const c=A.c;
  bumps.forEach(q=>{const lit=q.t>0;if(lit)X.glow(q.x,q.y,q.r*2.6,q.r>9?'#ff4f9a':'#ff9838',.6);X.shadow(q.x+2,q.y+3,q.r,q.r*.8,.35);X.disc(q.x,q.y,q.r+1.5,'#e8e8f0');X.orb(q.x,q.y,q.r,lit?'#ffffff':q.r>9?'#ff4f9a':'#ff9838');X.disc(q.x,q.y,q.r-4.5,lit?'#fff8c0':'#ffcf3f');X.ell(q.x-q.r*.3,q.y-q.r*.4,q.r*.3,q.r*.2,'rgba(255,255,255,.7)');});
  [[90,200,1,fa[0]],[201,200,-1,fa[1]]].forEach(f=>{const[fx_,fy,d,u]=f,a=(.35-.9*u)*d;c.save();c.translate(fx_,fy);c.rotate(d>0?a:Math.PI-a);X.shadow(20,4,20,3,.3);c.fillStyle=X.lg(0,-5,0,5,['#ff9aa8','#ff4f6d','#a01a30']);c.beginPath();c.arc(0,0,5,1.5708,4.712);c.lineTo(40,-2);c.arc(40,0,2,-1.5708,1.5708);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.4)';c.fillRect(2,-3.5,34,1);X.disc(0,0,2.2,'#e8e8f0');c.restore();});
  tr.forEach((q,i)=>{c.globalAlpha=.3*(1-i/7);X.disc(q[0],q[1],4.5-i*.4,'#c8d8ff');});c.globalAlpha=1;
  if(b){X.shadow(b.x+2,b.y+3,4.5,3.5,.3);X.orb(b.x,b.y,5,'#d8e0f0');}else{const py=205+pl*14;X.orb(298,py,5,'#d8e0f0');c.fillStyle=X.lg(0,0,0,1,['#c8c8d8','#6a6a7a']);c.fillStyle='#c8c8d8';c.fillRect(294,py+6,8,H-py);if(A.t%50<35)X.ot('DOWN TO LAUNCH',150,150,K.w,1,'c');}
  fx.draw();X.panel(10,8,110,16,K.y);T('SCORE '+g.score,16,13,K.y,1);X.panel(220,8,60,16,K.c);for(let i=0;i<balls;i++)X.orb(232+i*12,16,4,'#d8e0f0');};
 return g;}});

/* ---- DARTS ---- */
A.add({id:'darts',name:'DARTS 301',cat:'SPORTS',low:1,how:'A LOCKS X, A LOCKS Y. GET FROM 301 TO EXACTLY 0.',make(){
 const g={over:null,score:0},fx=X.fx(),SEG=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];let left=301,ph=0,cx=160,cy=120,t=0,darts=0,msg='',mt=0,marks=[];
 g.update=()=>{t++;if(mt>0)mt--;if(ph===0){cx=160+Math.sin(t*.06)*70;if(A.hit(0).a){ph=1;t=0;S('blip');}}else if(ph===1){cy=120+Math.sin(t*.075)*60;if(A.hit(0).a){const x=cx+rnd(6)-3,y=cy+rnd(6)-3,d=Math.hypot(x-160,y-120);let a=Math.atan2(y-120,x-160)+Math.PI/2+Math.PI/20;a=((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI);const seg=SEG[Math.floor(a/(Math.PI/10))%20];
   let p=d<4?50:d<9?25:d<28?seg:d<33?seg*3:d<52?seg:d<57?seg*2:0;darts++;g.score=darts;marks.push([x,y,ri(3)]);if(marks.length>6)marks.shift();fx.spark(x,y,'#ffe0a0',6,1.8);A.shake=2;if(left-p===0){left=0;g.over='CHECKOUT! WIN';S('win');return;}if(left-p<0){msg='BUST';p=0;}else{msg=p?(d<4?'BULLSEYE! ':d>=28&&d<33?'TREBLE ':d>=52&&d<57?'DOUBLE ':'')+'-'+p:'MISS';left-=p;}S(p?'hit':'lose');if(p>=40)fx.ring(x,y,K.y,20);ph=2;t=0;mt=50;}}
  else if(t>50)ph=0;};
 const board=()=>{X.vg(0,0,W,H,['#4a2e1a','#2a180c']);const c=A.c;c.fillStyle='rgba(0,0,0,.15)';for(let x=0;x<W;x+=24)c.fillRect(x,0,2,H);X.glow(160,120,110,'#ffe0a0',.18);X.disc(160,124,74,'rgba(0,0,0,.45)');X.disc(160,120,72,X.lg(0,48,0,192,['#3a3a3a','#141414']));
  for(let i=0;i<20;i++){const a=i*Math.PI/10-Math.PI/2,a0=a-Math.PI/20,a1=a+Math.PI/20,dark=i%2===0;const ring=(r0,r1,col)=>{c.fillStyle=col;c.beginPath();c.arc(160,120,r1,a0,a1);c.arc(160,120,r0,a1,a0,true);c.closePath();c.fill();};
   ring(9,28,dark?'#1a1a1a':'#f0e4c0');ring(28,33,dark?'#d0283a':'#1a9a4a');ring(33,52,dark?'#1a1a1a':'#f0e4c0');ring(52,57,dark?'#d0283a':'#1a9a4a');T(SEG[i],160+Math.cos(a)*65,120+Math.sin(a)*65-2,'#f0f0f0',1,'c');}
  X.disc(160,120,9,'#1a9a4a');X.disc(160,120,4,'#d0283a');c.strokeStyle='rgba(200,200,200,.55)';c.lineWidth=.5;for(const r of[4,9,28,33,52,57]){c.beginPath();c.arc(160,120,r,0,6.283);c.stroke();}for(let i=0;i<20;i++){const a=i*Math.PI/10-Math.PI/2-Math.PI/20;c.beginPath();c.moveTo(160+Math.cos(a)*9,120+Math.sin(a)*9);c.lineTo(160+Math.cos(a)*57,120+Math.sin(a)*57);c.stroke();}};
 g.draw=()=>{X.cache('dartbg',board);const c=A.c;
  marks.forEach(m=>{const col=['#ff4f6d','#4dabff','#ffcf3f'][m[2]];X.stroke([[m[0],m[1]],[m[0]+6,m[1]+7]],'#c8c8d0',1.2);X.poly([[m[0]+5,m[1]+6],[m[0]+12,m[1]+7],[m[0]+8,m[1]+10]],col);X.poly([[m[0]+5,m[1]+6],[m[0]+6,m[1]+13],[m[0]+8,m[1]+10]],X.lt(col,.7));X.disc(m[0],m[1],1,'#222');});
  if(ph<2){c.globalAlpha=.6;X.stroke([[cx,46],[cx,194]],'#7ff0ff',1);if(ph===1)X.stroke([[86,cy],[234,cy]],'#ff7fc0',1);c.globalAlpha=1;const yy=ph?cy:120;X.glow(cx,yy,10,'#7ff0ff',.4);A.ring(cx,yy,5,'#ffffff');}
  fx.draw();X.bar('LEFT '+left,'DARTS '+darts);T(ph===0?'A: LOCK X':ph===1?'A: LOCK Y':'',160,6,K.c,1,'c');if(mt>0)X.ot(msg,160,210,msg==='BUST'||msg==='MISS'?K.r:K.y,2,'c');};
 return g;}});

/* ---- RHYTHM TAP ---- */
A.add({id:'rhythm',name:'RHYTHM TAP',cat:'PUZZLE',how:'HIT THE ARROW WHEN IT REACHES THE LINE.',make(){
 const g={over:null,score:0},KS=['l','d','u','r'],LX=[100,140,180,220],COL=['#ff4f9a','#2fd6c3','#3ddc84','#ffcf3f'],fx=X.fx();let notes=[],t=0,miss=0,combo=0,bpm=90,flash={},hf=0,beat=0,jt=0,jk=0;
 for(let i=0;i<400;i++)notes.push({k:ri(4),t:120+i*(3600/bpm)*(1-Math.min(.5,i/300)),ok:0});
 g.update=()=>{t++;if(hf>0)hf--;if(jt)jt--;if(beat>0)beat--;const h=A.hit(0);for(const n of notes){if(n.ok)continue;const dy=n.t-t;if(dy<-14){n.ok=2;miss++;combo=0;S('lose');fx.pop(LX[n.k],170,'MISS',K.r);A.shake=2;if(miss>=8)g.over='OFF BEAT';}else if(Math.abs(dy)<=14&&h[KS[n.k]]){n.ok=1;const p=Math.abs(dy)<5?3:1;combo++;g.score+=p*Math.min(combo,10);flash[n.k]=10;hf=p;jt=24;jk=p;if(combo%10===0){fx.ring(160,40,K.y,46,20);fx.spark(160,40,K.y,12,2.6);}beat=8;S(p>1?'coin':'blip');fx.ring(LX[n.k],190,COL[n.k],20,12);fx.spark(LX[n.k],190,COL[n.k],p>1?10:5,2.5);h[KS[n.k]]=false;}}
  for(const k in flash)if(flash[k]>0)flash[k]--;if(t>notes[notes.length-1].t+30)g.over='SONG CLEAR! WIN';};
 const arrow=(x,y,k,col,s)=>{s=s||1;const rot=[Math.PI,Math.PI/2,-Math.PI/2,0][k],c=A.c;c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);X.poly([[9,0],[0,-9],[0,-4],[-8,-4],[-8,4],[0,4],[0,9]],X.lg(-8,-9,8,9,[X.lt(col,1.5),col,X.lt(col,.55)]));X.polys([[9,0],[0,-9],[0,-4],[-8,-4],[-8,4],[0,4],[0,9]],'rgba(255,255,255,.6)',.8);c.restore();};
 g.draw=()=>{X.cache('rhybg2',()=>{X.sky(['#1a0a3a','#0c0620','#05030e']);X.glow(160,60,160,'#5a2aaa',.35);const c=A.c;X.vg(78,0,164,H,['rgba(30,16,70,.85)','rgba(14,8,36,.95)']);for(let i=0;i<4;i++){c.fillStyle=X.lg(0,0,0,H,[X.rgba(COL[i],0),X.rgba(COL[i],.12)]);c.fillRect(LX[i]-18,0,36,H);c.fillStyle='rgba(255,255,255,.05)';c.fillRect(LX[i]+19,0,1,H);}c.fillStyle=X.lg(0,0,0,H,['rgba(255,255,255,0)','rgba(255,255,255,.35)']);c.fillRect(78,0,2,H);c.fillRect(240,0,2,H);
   for(const sx of[38,282]){X.rr(sx-26,120,52,104,6,X.lg(0,120,0,224,['#2a2440','#141022']));X.rrs(sx-25.5,120.5,51,103,6,'rgba(255,255,255,.12)');X.disc(sx,150,16,'#0a0812');X.disc(sx,150,13,X.rg(sx-4,146,1,sx,150,13,['#4a4460','#16121e']));X.disc(sx,196,20,'#0a0812');X.disc(sx,196,17,X.rg(sx-5,191,1,sx,196,17,['#4a4460','#16121e']));}});const c=A.c,pulse=beat/8;
  for(const sx of[38,282]){X.glow(sx,196,22+pulse*12,'#9a6aff',.25+pulse*.3);X.disc(sx,196,5+pulse*3,'#6a5a90');X.disc(sx,150,4+pulse*2,'#6a5a90');for(let i=0;i<6;i++){const hh=6+Math.abs(Math.sin(t*.07+i*1.3+sx))*30*(.5+pulse*.8);c.fillStyle=X.lg(0,110-hh,0,110,[COL[i%4],X.rgba(COL[i%4],.2)]);c.fillRect(sx-24+i*8.4,110-hh,6,hh);}}
  X.glow(160,190,90+pulse*30,'#7a4aff',.15+pulse*.15);c.fillStyle=X.lg(80,0,240,0,['rgba(255,255,255,.2)','rgba(255,255,255,.85)','rgba(255,255,255,.2)']);c.fillRect(80,189,160,2);
  for(let i=0;i<4;i++){if(flash[i]){const f=flash[i]/10;c.globalAlpha=f;c.fillStyle=X.lg(0,40,0,190,[X.rgba(COL[i],0),X.rgba(COL[i],.55)]);c.fillRect(LX[i]-17,40,34,150);c.globalAlpha=1;X.glow(LX[i],190,28,COL[i],.7*f);}X.disc(LX[i],190,13,'rgba(0,0,0,.35)');A.ring(LX[i],190,13,flash[i]?COL[i]:'rgba(255,255,255,.25)');arrow(LX[i],190,i,flash[i]?'#ffffff':'#5a5488',flash[i]?1.2:1);}
  notes.forEach(n=>{if(n.ok)return;const y=190-(n.t-t)*1.5;if(y>-10&&y<H){c.globalAlpha=.35;c.fillStyle=X.lg(0,y-24,0,y,[X.rgba(COL[n.k],0),COL[n.k]]);c.fillRect(LX[n.k]-3,y-24,6,24);c.globalAlpha=1;X.glow(LX[n.k],y,14,COL[n.k],.3);arrow(LX[n.k],y,n.k,COL[n.k]);}});
  fx.draw();X.bar('SCORE '+g.score,'','',K.y);A.text('LIVES',W-92,6,'rgba(255,255,255,.6)',1,'r');for(let i=0;i<8;i++)X.block(W-86+i*10,5,8,7,i<8-miss?(miss>4?'#ff4f6d':'#3ddc84'):'#2a2a3a',2);
  if(combo>4){const s=combo>=20?3:2;X.ot(combo+'',160,30,combo>=20?K.y:K.w,s,'c');A.text('COMBO',160,30+s*7+3,'rgba(255,255,255,.7)',1,'c');}
  if(jt){c.globalAlpha=Math.min(1,jt/10);X.ot(jk>1?'PERFECT':'GOOD',160,160-(24-jt)*.4,jk>1?K.y:K.c,jk>1?2:1,'c');c.globalAlpha=1;}};
 return g;}});

/* ---- SKY FURY ---- */
A.add({id:'skyfury',name:'SKY FURY',cat:'CLASSICS',how:'FLY. A FIRES. SHOOT EVERYTHING.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:200},en=[],bl=[],eb=[],lives=3,inv=0,t=0,pw=0,bank=0;
 g.update=()=>{t++;const k=A.in(0);p.x=cl(p.x+ax(k)*3,8,W-8);p.y=cl(p.y+ay(k)*2.5,30,H-10);bank+=(ax(k)-bank)*.2;if(inv>0)inv--;
  if(A.hit(0).a||A.in(0).a&&t%(pw?5:9)===0){bl.push({x:p.x-4,y:p.y-8});bl.push({x:p.x+4,y:p.y-8});S('shoot');}
  if(t%Math.max(18,50-(t/200|0))===0){const big=Math.random()<.15;en.push({x:rnd(W-40)+20,y:-10,vx:rnd(1.6)-.8,vy:big?.6:1.2+rnd(.8),hp:big?6:1,big,w:0,hit:0});}
  bl.forEach(b=>b.y-=6);bl=bl.filter(b=>b.y>-10);
  for(const e of en){e.x+=e.vx;e.y+=e.vy;if(e.hit)e.hit--;if(e.x<10||e.x>W-10)e.vx*=-1;e.w++;if(e.w%(e.big?40:90)===0&&e.y>0){const d=Math.hypot(p.x-e.x,p.y-e.y);eb.push({x:e.x,y:e.y,vx:(p.x-e.x)/d*2,vy:(p.y-e.y)/d*2});}
   for(const b of bl)if(Math.abs(b.x-e.x)<(e.big?12:7)&&Math.abs(b.y-e.y)<(e.big?12:7)){b.y=-99;e.hp--;e.hit=4;fx.spark(b.x,b.y,'#fff0a0',3,1.5);if(e.hp<=0){g.score+=e.big?200:10;S(e.big?'boom':'hit');fx.spark(e.x,e.y,e.big?K.p:K.o,e.big?24:10,3);fx.debris(e.x,e.y,'#5a5a6a',e.big?10:4,2);fx.ring(e.x,e.y,'#ffd080',e.big?36:16);if(e.big){fx.pop(e.x,e.y-14,'+200',K.y);if(!pw){pw=600;S('win');fx.pop(p.x,p.y-24,'RAPID FIRE!',K.g);}}}}
   if(inv===0&&Math.abs(p.x-e.x)<(e.big?14:8)&&Math.abs(p.y-e.y)<(e.big?14:8)){e.hp=0;lives--;inv=90;S('boom');fx.flash(K.r,8);fx.spark(p.x,p.y,K.c,16,3);if(lives<=0)g.over='SHOT DOWN';}}
  en=en.filter(e=>e.hp>0&&e.y<H+10);for(const b of eb){b.x+=b.vx;b.y+=b.vy;if(inv===0&&Math.abs(b.x-p.x)<5&&Math.abs(b.y-p.y)<6){b.y=999;lives--;inv=90;S('boom');fx.flash(K.r,8);if(lives<=0)g.over='SHOT DOWN';}}eb=eb.filter(b=>b.y<H&&b.y>-10&&b.x>0&&b.x<W);if(pw>0)pw--;};
 const plane=(x,y,s,body,wing,dir,bank_)=>{const c=A.c;c.save();c.translate(x,y);c.scale(s*(1-Math.abs(bank_||0)*.15),s*dir);X.poly([[-14,1],[14,1],[12,-2],[-12,-2]],X.lg(-14,0,14,0,[X.lt(wing,.7),X.lt(wing,1.3),X.lt(wing,.7)]));X.poly([[-5,9],[5,9],[4,7],[-4,7]],wing);X.ell(0,0,3.2,10,X.lg(-3,0,3,0,[X.lt(body,.7),X.lt(body,1.4),X.lt(body,.7)]));X.ell(0,-3,1.6,3,'rgba(160,230,255,.9)');c.restore();};
 g.draw=()=>{const c=A.c;X.cache('skyseabg',()=>{X.sky(['#1a5a9a','#2a7ab8','#1a5a9a']);});const sc=t*.8;
  for(let i=0;i<4;i++){const yy=((i*110+sc)%440)-60,xx=(i*137)%W;X.ell(xx,yy,30,18,'#3a9a5a');X.ell(xx,yy,26,15,'#4ab86a');X.ell(xx-6,yy-4,10,6,'#6ad08a');X.ell(xx,yy,34,22,'rgba(255,255,255,.08)');}
  c.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<30;i++){const yy=((i*29+sc)%260)-10;c.fillRect((i*71)%W,yy,8,1);}
  en.forEach(e=>{X.shadow(e.x+14,e.y+18,e.big?16:8,e.big?5:3,.18);});X.shadow(p.x+16,p.y+22,10,3,.2);
  en.forEach(e=>{if(e.hit)c.globalAlpha=.6;plane(e.x,e.y,e.big?1.5:.9,e.big?'#c84a8a':'#d04040',e.big?'#a03a70':'#a83030',-1,0);c.globalAlpha=1;if(e.big){X.meter(e.x-12,e.y-20,24,3,e.hp/6,'#ff4f6d');}});
  bl.forEach(b=>{X.glow(b.x,b.y+3,5,pw?'#3ddc84':'#ffd060',.6);c.fillStyle=pw?'#c0ffd0':'#fff0b0';c.fillRect(b.x-.8,b.y,1.6,6);});eb.forEach(b=>{X.glow(b.x,b.y,6,'#ff6020',.6);X.disc(b.x,b.y,2,'#ffd0a0');});
  for(let i=0;i<5;i++){const yy=((i*120+sc*1.8)%480)-80,xx=(i*97+40)%W;c.globalAlpha=.55;X.disc(xx,yy,14,'#ffffff');X.disc(xx+14,yy+4,12,'#ffffff');X.disc(xx-12,yy+5,10,'#ffffff');c.globalAlpha=1;}
  if(inv%8<5){X.glow(p.x,p.y+11,6,'#ff8030',.6);plane(p.x,p.y,1.1,'#e8eef8','#4dabff',1,bank);}
  fx.draw();X.bar('SCORE '+g.score,'',pw>0?'RAPID FIRE '+Math.ceil(pw/60):'');for(let i=0;i<lives;i++)X.heart(W-10-i*11,8,1);};
 return g;}});

/* ---- WHACK BOTS ---- */
A.add({id:'whack',name:'WHACK BOTS',cat:'PUZZLE',how:'MOVE TO A BOT, PRESS A. AVOID THE RED ONES. 45 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let c={x:1,y:1},bots=Array(9).fill(0),time=2700,t=0,sw=0,dizzy=Array(9).fill(0),bonk=null;
 g.update=()=>{time--;t++;if(sw)sw--;if(bonk&&--bonk[2]<=0)bonk=null;dizzy=dizzy.map(v=>v?v-1:0);if(time<=0){g.over='TIME UP';return;}const h=A.hit(0);mvCur(h,c,3,3);if(h.l||h.r||h.u||h.d)S('blip');if(t%Math.max(20,60-(time/60|0))===0){const i=ri(9);if(!bots[i])bots[i]=Math.random()<.22?-40:50+rnd(30);}
  bots=bots.map(v=>v>0?v-1:v<0?v+1:0);if(h.a){sw=10;const i=c.y*3+c.x,x=70+(i%3)*70,y=70+((i/3)|0)*60;if(bots[i]>0){g.score+=10;bots[i]=0;dizzy[i]=20;S('coin');A.burst(x,y-6,K.y,6);fx.spark(x,y,K.y,12,2.8);fx.spark(x,y,'#ffffff',6,2);fx.ring(x,y,'#ffffff',22,12);fx.debris(x,y,'#c8d0e8',5,1.8);A.shake=3;bonk=[x,y,10];}else if(bots[i]<0){g.score=Math.max(0,g.score-15);bots[i]=0;S('boom');A.shake=6;fx.flash(K.r,8);fx.spark(x,y,'#ffcf3f',16,3.2);fx.debris(x,y,'#ff4f6d',8,2.4);fx.ring(x,y,K.r,30,16);fx.pop(x,y-20,'-15',K.r);}else{S('blip');fx.spark(x,y+14,'#c8a070',6,1.4);}}};
 g.draw=()=>{const cx=A.c;X.cache('whackbg2',()=>{X.sky(['#3a8ae0','#8ac8f8','#d8f0ff'],50);X.glow(270,20,40,'#fff6c0',.5);X.disc(270,20,9,'#fffbe0');X.hills(44,16,'#6ab05a',0,.03,3);X.hills(48,8,'#4e9a40',40,.05,7);for(let i=0;i<9;i++){const x=12+i*38+(i%2)*8,y=40-(i%3)*2;cx.fillStyle='#6a4424';cx.fillRect(x-1,y,2,6);X.disc(x,y-3,7,'#2e8a3a');X.disc(x-2,y-5,4,'#46a84e');}X.turf(0,46,W,H-46,'#3a9a3a','#45a845',18);cx.fillStyle='#e8d8b8';cx.fillRect(0,46,W,2);for(let x=4;x<W;x+=12){X.rr(x,40,4,10,1,'#f0e6d0');}cx.fillStyle='#d8c8a8';cx.fillRect(0,43,W,1.5);X.vignette(.3);for(let i=0;i<9;i++){const x=70+(i%3)*70,y=70+((i/3)|0)*60;X.shadow(x,y+19,30,9,.25);X.ell(x,y+16,27,10.5,X.lg(0,y+6,0,y+26,['#a07a40','#6a4a20','#4a3014']));X.ell(x,y+15,22,8,X.lg(0,y+8,0,y+22,['#2a1808','#000000']));for(let k=0;k<6;k++)X.disc(x-22+k*9,y+22+Math.sin(k*2)*1.5,2,'#8a6430');}});
  for(let i=0;i<9;i++){const x=70+(i%3)*70,y=70+((i/3)|0)*60;if(bots[i]){const bad=bots[i]<0,up=Math.min(1,Math.abs(bots[i])/10),top=y+14-26*up;cx.save();cx.beginPath();cx.rect(x-30,y-40,60,y+15-(y-40));if(cx.clip)cx.clip();
    X.rr(x-12,top,24,30,8,X.lg(x-12,0,x+12,0,bad?['#a01020','#ff4f6d','#a01020']:['#7a8098','#d0d8f0','#7a8098']));X.rr(x-9,top+4,18,9,3,'#1a1a2a');const ec=bad?'#ff3030':'#3dff8b';X.glow(x-4,top+8,5,ec,.6);X.glow(x+4,top+8,5,ec,.6);X.disc(x-4,top+8,1.8,ec);X.disc(x+4,top+8,1.8,ec);
    cx.fillStyle='#555';cx.fillRect(x-.5,top-6,1,6);X.disc(x,top-6,1.8,bad?'#ff4f6d':'#ffcf3f');if(bad){X.poly([[x-12,top+4],[x-16,top],[x-12,top+10]],'#ffcf3f');X.poly([[x+12,top+4],[x+16,top],[x+12,top+10]],'#ffcf3f');}cx.restore();}
   if(dizzy[i]){const f=dizzy[i]/20,sy=y+14-10*f;X.rr(x-13-3*f,sy,26+6*f,6*f+3,3,X.lg(0,sy,0,sy+8,['#d0d8f0','#7a8098']));X.rr(x-8,sy+1,16,Math.max(1,3*f),1,'#1a1a2a');cx.fillStyle='#ffcf3f';cx.fillRect(x-4,sy+1,2,1);cx.fillRect(x+2,sy+1,2,1);}
   if(dizzy[i])for(let s=0;s<3;s++){const a=A.t*.2+s*2.1;X.disc(x+Math.cos(a)*10,y-14+Math.sin(a)*3,1.5,K.y);}
   X.ell(x,y+16.5,22,3,'rgba(120,80,30,.6)');}
  const hx=70+c.x*70,hy=70+c.y*60,ang=sw?-.2+sw*.12:.9;X.ell(hx,hy+16,25,9.5,'rgba(255,207,63,.12)');cx.strokeStyle='rgba(255,207,63,'+(.55+.3*Math.sin(A.t*.2)).toFixed(2)+')';cx.lineWidth=1.5;cx.beginPath();if(cx.ellipse)cx.ellipse(hx,hy+16,26,10,0,0,6.283);cx.stroke();
  cx.save();cx.translate(hx+20,hy+2);cx.rotate(-ang);X.rr(-2,-2.5,34,5,2,X.lg(0,-2.5,0,2.5,['#e0a870','#a06a38','#6a4020']));X.rr(26,-3,6,6,1.5,'#2a2a34');X.rr(-11,-11,17,22,4,X.lg(-11,0,6,0,['#ff8a9a','#e02a48','#8a1020']));X.rr(-12,-11,3,22,1.5,'#c8c8d8');X.rr(4,-11,3,22,1.5,'#c8c8d8');cx.fillStyle='rgba(255,255,255,.4)';cx.fillRect(-8,-10,10,2);cx.restore();
  if(bonk){const[bx,by,bt]=bonk,r=8+(10-bt)*1.5;cx.globalAlpha=bt/10;const P=[];for(let k=0;k<16;k++){const a=k*.3927,rr=k%2?r*.5:r;P.push([bx+Math.cos(a)*rr,by-6+Math.sin(a)*rr]);}X.poly(P,'#fff6a0');X.ot('BONK',bx,by-10,'#ff4f6d',1,'c');cx.globalAlpha=1;}
  fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),'',K.y,time<600?K.r:K.w);X.meter(110,6,100,6,time/2700,time<600?'#ff4f6d':'#3dff8b');};
 return g;}});

/* ---- CLOUD HOP ---- */
A.add({id:'cloudhop',name:'CLOUD HOP',cat:'CLASSICS',how:'LEFT/RIGHT MOVE. BOUNCE UP. DON\'T FALL.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:180,vy:0,f:1},pl=[],cam=0,top=0,sq=0,tr=[],ms=0;const mk=q=>{q.s=ri(9999);q.n=3+q.s%3;return q;};for(let i=0;i<9;i++)pl.push(mk({x:rnd(W-40)+20,y:200-i*28,w:40,m:i>4&&Math.random()<.3?1:0,d:1,b:0}));pl[0].x=160;pl[0].w=60;
 g.update=()=>{const k=A.in(0);if(sq)sq--;if(ms)ms--;if(ax(k))p.f=ax(k);p.x=(p.x+ax(k)*3+W)%W;p.vy+=.18;p.y+=p.vy;for(const q of pl){if(q.b)q.b--;if(q.m){q.x+=q.d*1.2;if(q.x<20||q.x>W-20)q.d*=-1;}if(p.vy>0&&p.y>q.y-4&&p.y<q.y+6&&Math.abs(p.x-q.x)<q.w/2+4){p.vy=-6.2;q.b=12;sq=9;S('jump');fx.ring(p.x,q.y-cam,q.m?'#7fd4ff':'#ffffff',18,14);fx.debris(p.x,q.y-cam,q.m?'#cfeeff':'#ffffff',6,1.3);}}
  tr.unshift([p.x,p.y]);if(tr.length>8)tr.pop();const want=p.y-140;if(want<cam)cam=want;const s0=g.score;g.score=Math.max(g.score,-cam/5|0);if(g.score>=100&&s0<100||g.score>=250&&s0<250||g.score>=500&&s0<500||g.score>=1000&&s0<1000){ms=60;S('score');fx.flash('#ffffff',5);A.confetti&&A.confetti(160,40);}for(const q of pl)if(q.y>cam+H+10){q.y-=9*28;q.x=rnd(W-40)+20;q.w=Math.max(22,40-g.score/40);q.m=Math.random()<.35?1:0;mk(q);}if(p.y>cam+H+20){g.over='FELL';A.shake=6;}};
 const puff=(x,y,w,q)=>{const c=A.c,n=q.n,mv=q.m,tp=mv?'#e6f6ff':['#ffffff','#fff6ee','#f8f4ff'][q.s%3],bt=mv?'#7ab8e8':['#a8b8dc','#d8b8c0','#b4a8d8'][q.s%3];X.ell(x,y+9,w/2+3,3.5,'rgba(20,40,110,.22)');if(mv)X.glow(x,y,w*.6,'#5ab8ff',.25);
  for(let i=0;i<n;i++){const u=n>1?i/(n-1):.5,r=(5+((q.s>>i)%4))*(.7+.6*Math.sin(u*3.14)),px=x-w/2+5+u*(w-10);X.disc(px,y-2-r*.55,r+.8,bt);}X.rr(x-w/2-1,y-4,w+2,10,5,X.lg(0,y-4,0,y+6,[tp,bt]));
  for(let i=0;i<n;i++){const u=n>1?i/(n-1):.5,r=(5+((q.s>>i)%4))*(.7+.6*Math.sin(u*3.14)),px=x-w/2+5+u*(w-10);X.disc(px,y-3-r*.55,r,X.rg(px-r*.3,y-3-r,r*.2,px,y-3-r*.55,r*1.2,[tp,tp,bt]));}
  c.fillStyle='rgba(255,255,255,.9)';c.fillRect(x-w/2+5,y-3,w-10,1);c.fillStyle='rgba(70,90,150,.18)';c.fillRect(x-w/2+3,y+4,w-6,1.5);if(mv){const d=q.d,a=.5+.3*Math.sin(A.t*.2);c.globalAlpha=a;X.stroke([[x-d*(w/2+4),y-1],[x-d*(w/2+12),y-1]],'#ffffff',1);X.stroke([[x-d*(w/2+2),y+3],[x-d*(w/2+9),y+3]],'#ffffff',1);c.globalAlpha=1;}};
 const hero=(x,y,s)=>{const c=A.c,f=p.f;c.save();c.translate(x,y);c.scale(1+s,1-s+(p.vy<-3?.1:0));X.shadow(0,1,7,2,.15);c.fillStyle='#e8a030';c.fillRect(-5,-3,3,3);c.fillRect(2,-3,3,3);X.orb(0,-11,10,'#4fd04a');X.ell(0,-6,6,3,'#9af07a');
  X.stroke([[1,-20],[3*f+1,-25]],'#2a7a2a',1.4);X.ell(3*f+3,-25.5,3.5,1.8,'#7ae05a',-.4*f);X.disc(-3.5+2*f,-13,3,'#fff');X.disc(3.5+2*f,-13,3,'#fff');X.disc(-3.5+3.3*f,-12.6,1.5,'#16202a');X.disc(3.5+3.3*f,-12.6,1.5,'#16202a');X.disc(-6.5+f,-8.5,1.6,'rgba(255,110,120,.6)');X.disc(6.5+f,-8.5,1.6,'rgba(255,110,120,.6)');
  if(p.vy<0)X.ell(2*f,-7.5,2,1.4,'#1a4a1a');else X.ell(2*f,-7.5,1.6,.9,'#1a4a1a');c.restore();};
 g.draw=()=>{const k=cl(-cam/2500,0,1),k2=cl(-cam/2500-1,0,1),c=A.c,m3=(a,b,d)=>k2>0?A.mix(b,d,k2):A.mix(a,b,k),top=m3('#1a5cc8','#3a2a8a','#04041a'),mid=m3('#4c94e6','#e0708a','#1a1048'),bot=m3('#b4dcff','#ffc890','#4a2a6a');c.fillStyle=X.lg(0,0,0,H,[top,mid,bot]);c.fillRect(0,0,W,H);
  if(k>.3){c.globalAlpha=Math.min(1,(k-.3)*1.5);X.stars(70,2,0,cam*.05,H,.9);c.globalAlpha=1;}const sy=60+k*120-cam*.01;X.glow(250,sy,80,k>.5?'#ff9a6a':'#fff4c0',.45*(1-k2));X.disc(250,sy,15,A.mix('#fffbe8','#ffb070',k));
  const gy=232-cam*.5;if(gy<H+40){X.hills(gy-14,26,'rgba(120,160,210,.6)',0,.013,4);X.hills(gy,20,'#6ab06a',30,.022,1);}
  for(let i=0;i<9;i++){const sp=.12+(i%3)*.1,y=((i*61-cam*sp)%(H+80)+H+80)%(H+80)-40,x=((i*97+A.t*(.05+(i%3)*.04))%(W+80))-40,s=.6+(i%3)*.35;c.globalAlpha=.1+(i%3)*.06;X.disc(x,y,12*s,'#ffffff');X.disc(x+16*s,y-5*s,15*s,'#ffffff');X.disc(x+32*s,y,11*s,'#ffffff');X.ell(x+16*s,y+4*s,26*s,6*s,'#ffffff');c.globalAlpha=1;}
  for(let i=Math.floor(-cam/500);i<=Math.floor(-(cam-H)/500)+1;i++){if(i<1)continue;const yy=-i*500-cam+140;if(yy<-10||yy>H+10)continue;c.globalAlpha=.6;for(let x=0;x<W;x+=8)c.fillRect(x,yy,4,1);c.globalAlpha=1;X.ot(i*100+'M',W-4,yy-9,'#ffffff',1,'r');}
  pl.forEach(q=>{const y=q.y-cam+(q.b?Math.sin(q.b*.6)*2.5:0);if(y<-30||y>H+30)return;c.save();c.translate(q.x,y);const b=q.b?q.b/12:0;c.scale(1+b*.12,1-b*.15);puff(0,0,q.w,q);c.restore();});
  if(p.vy<-2)tr.forEach((t,i)=>{c.globalAlpha=.25*(1-i/8);X.disc(t[0],t[1]-cam-10,8-i*.7,'#bff0a0');});c.globalAlpha=1;
  const y=p.y-cam,s=sq*.045;hero(p.x,y,s);if(p.x<14)hero(p.x+W,y,s);if(p.x>W-14)hero(p.x-W,y,s);
  if(p.vy>3&&y>H-70){c.globalAlpha=Math.min(.6,(y-(H-70))/70);X.vg(0,H-40,W,40,['rgba(255,40,60,0)','rgba(255,40,60,.7)']);c.globalAlpha=1;}
  X.vignette(.28);fx.draw();X.panel(124,3,72,26,ms?K.y:'#ffffff');X.ot(g.score,160,7,K.w,2,'c');A.text('METRES',160,21,'rgba(255,255,255,.6)',1,'c');
  if(ms){c.globalAlpha=Math.min(1,ms/12);X.ot(g.score+'M!',160,60+(60-ms)*.2,K.y,3,'c');c.globalAlpha=1;}};
 return g;}});

/* ---- DUCK GALLERY ---- */
A.add({id:'gallery',name:'DUCK GALLERY',cat:'SPORTS',how:'MOVE THE SIGHT. A SHOOTS. 30 SHOTS.',make(){
 const g={over:null,score:0},fx=X.fx();let cx=160,cy=120,ducks=[],shots=30,t=0,hitT=0,down=[],rec=0;
 g.update=()=>{t++;if(hitT>0)hitT--;if(rec)rec--;down.forEach(d=>{d.r+=.15;d.y+=d.vy;d.vy+=.2;});down=down.filter(d=>d.y<H+20);const k=A.in(0);if(A.mouse.t>0){cx=cl(A.mouse.x,10,W-10);cy=cl(A.mouse.y,30,200);}else{cx=cl(cx+ax(k)*3.5,10,W-10);cy=cl(cy+ay(k)*3.5,30,200);}if(t%50===0){const row=ri(3);ducks.push({x:row%2?W+10:-10,y:70+row*45,d:row%2?-1:1,v:1+rnd(1.5)+t/3000,big:Math.random()<.2});}
  ducks.forEach(d=>d.x+=d.d*d.v);ducks=ducks.filter(d=>d.x>-20&&d.x<W+20);
  if(A.hit(0).a&&shots>0){shots--;rec=6;S('shoot');fx.spark(cx,cy,'#fff0c0',4,1.5);const d=ducks.find(d=>Math.abs(d.x-cx)<(d.big?8:12)&&Math.abs(d.y-cy)<10);if(d){ducks.splice(ducks.indexOf(d),1);g.score+=d.big?50:10;hitT=15;S('coin');down.push({x:d.x,y:d.y,vy:-2,r:0,d:d.d,big:d.big});fx.debris(d.x,d.y,d.big?'#ffcf3f':'#ffffff',8,1.8);fx.pop(d.x,d.y-14,d.big?'+50':'+10',d.big?K.y:K.w);}if(shots===0)g.over='OUT OF SHOTS';}};
 const duck=(x,y,d,big,rot)=>{const s=big?.7:1,col=big?'#ffcf3f':'#f0f0f0',c=A.c;c.save();c.translate(x,y);if(rot)c.rotate(rot);c.scale(s*d,s);c.fillStyle='#8a5c33';c.fillRect(-1.5,6,3,10);X.ell(0,0,10,6,X.lg(0,-6,0,6,[X.lt(col,1.1),col,X.lt(col,.75)]));X.ell(-2,-1,5,3,X.lt(col,.85));X.disc(7,-7,4.5,col);X.poly([[10,-8],[16,-6.5],[10,-5]],'#ff9838');X.disc(8,-8,1,'#111');c.restore();};
 g.draw=()=>{X.cache('gallery_bg',()=>{X.sky(['#1a3a6a','#2a5a9a']);const c=A.c;for(let i=0;i<12;i++){c.fillStyle=i%2?'#d02a3a':'#f4f0e8';c.fillRect(i*W/12,0,W/12,24);}for(let i=0;i<12;i++)X.disc(i*W/12+W/24,24,W/24,i%2?'#d02a3a':'#f4f0e8');c.fillStyle='rgba(0,0,0,.2)';c.fillRect(0,30,W,3);
   [80,125,170].forEach((y,i)=>{X.vg(0,y-4,W,8,[['#d8a060','#a86a30'][i%2],'#6a3a14']);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,y+4,W,2);for(let x=0;x<W;x+=16){c.fillStyle=['#2a7ad0','#2a90e0'][i%2];c.beginPath();c.arc(x+8,y+12,8,Math.PI,0);c.fill();}});X.vg(0,196,W,44,['#7a4a20','#4a2810']);c.fillStyle='#e8c070';c.fillRect(0,196,W,3);X.vignette(.45);});const c=A.c;
  ducks.forEach(d=>duck(d.x,d.y-4,d.d,d.big,0));down.forEach(d=>duck(d.x,d.y-4,d.d,d.big,d.r*d.d));
  const r=rec?9:7;c.globalAlpha=.9;A.ring(cx,cy,r,hitT?K.y:'#ffffff');A.ring(cx,cy,r+.6,'rgba(0,0,0,.5)');X.stroke([[cx-12,cy],[cx-4,cy]],'#ffffff',1.2);X.stroke([[cx+4,cy],[cx+12,cy]],'#ffffff',1.2);X.stroke([[cx,cy-12],[cx,cy-4]],'#ffffff',1.2);X.stroke([[cx,cy+4],[cx,cy+12]],'#ffffff',1.2);X.disc(cx,cy,.9,'#ff3040');c.globalAlpha=1;
  fx.draw();X.panel(4,204,120,14,K.y);T('SCORE '+g.score,10,209,K.y,1);X.panel(196,204,120,14,shots<6?K.r:K.w);for(let i=0;i<30;i++){c.fillStyle=i<shots?'#ffcf3f':'rgba(255,255,255,.15)';c.fillRect(200+i*3.8,207,2,8);}};
 return g;}});

/* ---- ORBIT HOP ---- */
A.add({id:'orbit',name:'ORBIT HOP',cat:'PUZZLE',how:'A JUMPS TO THE NEXT RING. LAND ON THE PAD.',make(){
 const g={over:null,score:0},fx=X.fx();let ring=0,a=0,dir=1,rings=[],jump=null,life=3,tr=[];const mk=i=>({y:200-i*45,r:26+ri(14),pa:rnd(6.28),pw:.9-Math.min(.5,i*.04),sp:.03+i*.003,h:ri(360)});for(let i=0;i<8;i++)rings.push(mk(i));
 const pos=()=>{const q=rings[ring],n=rings[ring+1]||q;if(jump){const r=q.r+(n.r-q.r)*jump.t;return[160+Math.cos(a)*r,q.y+(n.y-q.y)*jump.t-Math.sin(jump.t*3.14)*20];}return[160+Math.cos(a)*q.r,q.y+Math.sin(a)*q.r*.35];};
 g.update=()=>{const ps=pos();tr.unshift(ps);if(tr.length>10)tr.pop();const q=rings[ring];if(jump){jump.t+=.08;if(jump.t>=1){jump=null;ring++;const n=rings[ring];let d=Math.abs(((a-n.pa)%6.283+9.425)%6.283-3.1416);const[px,py]=pos();if(d<n.pw){const pts=d<n.pw*.4?30:10;g.score+=pts;S('coin');dir*=-1;fx.ring(px,py,pts>10?K.y:K.g,18,12);fx.pop(px,py-12,pts>10?'PERFECT +30':'+10',pts>10?K.y:K.g);}else{life--;S('boom');fx.spark(px,py,K.r,12,2.5);fx.flash(K.r,6);A.shake=5;if(life<=0)g.over='MISSED';}if(ring>=6){rings.shift();ring--;rings.push(mk(rings.length+ring*0+rings[rings.length-1].id||0));rings[rings.length-1].y=rings[rings.length-2].y-45;rings.forEach(r=>r.y+=45);}}return;}
  a+=dir*q.sp;if(A.hit(0).a){jump={t:0};S('jump');}};
 const seg=(q,a0,a1,front,col,lw)=>{let run=[];const out=()=>{if(run.length>1)X.stroke(run,col,lw);run=[];};const n=Math.max(4,Math.ceil((a1-a0)/.08));for(let i=0;i<=n;i++){const t=a0+(a1-a0)*i/n,f=Math.sin(t)>=0;if(f===front)run.push([160+Math.cos(t)*q.r,q.y+Math.sin(t)*q.r*.35]);else out();}out();};
 g.draw=()=>{X.cache('orbbg2',()=>{X.sky(['#02010a','#0a0620','#1a0a34']);X.glow(60,50,110,'#5a1a8a',.35);X.glow(270,170,120,'#0a5a8a',.35);X.glow(200,90,70,'#8a1a5a',.2);X.stars(110,7,0,0,H,.85);const c=A.c;X.orb(292,214,44,'#3a4a8a');X.ell(292,214,70,9,'rgba(200,190,255,.0)');c.strokeStyle='rgba(200,190,255,.35)';c.lineWidth=2;c.beginPath();if(c.ellipse)c.ellipse(292,214,66,10,-.25,3.3,6.1);c.stroke();X.vignette(.4);});const c=A.c;
  rings.forEach((q,i)=>{const cur=i===ring,col=hsl(q.h,80,60),rc=cur?'rgba(127,240,255,.9)':i<ring?'rgba(140,130,200,.15)':'rgba(170,160,230,.45)',pr=7+(q.r-26)*.2;
   for(const fr of[false,true]){c.globalAlpha=cur?.25:.12;seg(q,0,6.2832,fr,cur?'#7ff0ff':'#a090ff',cur?6:4);c.globalAlpha=1;seg(q,0,6.2832,fr,rc,cur?1.6:1);
    if(i>ring){c.globalAlpha=.35;seg(q,q.pa-q.pw,q.pa+q.pw,fr,K.y,9);c.globalAlpha=1;seg(q,q.pa-q.pw,q.pa+q.pw,fr,'#ffcf3f',4);seg(q,q.pa-q.pw*.4,q.pa+q.pw*.4,fr,'#fffbe0',2);}
    if(!fr){X.glow(160,q.y,pr*2.6,col,.35);X.orb(160,q.y,pr,col);c.globalAlpha=.25;X.ell(160,q.y+pr*.15,pr,pr*.22,'#ffffff');c.globalAlpha=1;}}});
  tr.forEach((p,i)=>{c.globalAlpha=.45*(1-i/10);X.disc(p[0],p[1],5-i*.4,i<3?'#c8ffd8':'#3ddc84');});c.globalAlpha=1;const[x,y]=pos();X.glow(x,y,16,'#3ddc84',.7);X.orb(x,y,5.5,'#5aff8a');
  fx.draw();X.panel(4,3,72,24,K.y);X.ot(String(g.score),40,8,K.y,2,'c');for(let i=0;i<3;i++)X.heart(W-12-i*13,10,1.2,i<life?'#3ddc84':'#2a2a3a');};
 return g;}});
})();
