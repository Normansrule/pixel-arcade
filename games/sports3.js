(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const X=new Proxy({},{get:(_,k)=>A.gx[k]}),PC=['#2fd6c3','#ff4f9a'];
const crowd3=(y0,y1,seed,a)=>{const c=A.c;for(let y=y0;y<y1;y+=5)for(let x=(y/5%2)*3;x<W;x+=6){const k=((x|0)*31+(y|0)*17+seed)%7;c.globalAlpha=a||.5;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84','#c86dff','#ff9838'][k];c.fillRect(x,y+1,4,4);c.fillStyle=['#f1c7a3','#c68a5e','#6e4428'][k%3];c.fillRect(x+1,y-1,2,2);}c.globalAlpha=1;};
const stadium=(top)=>{X.sky(['#3a8ae0','#a8d8f8'],top);A.c.fillStyle='#3a3a48';A.c.fillRect(0,top,W,90-top);crowd3(top+4,88,5,.6);A.c.fillStyle='#e8e8f0';A.c.fillRect(0,88,W,2);};
const pb3=(x,y,f)=>{X.panel(x-3,y-3,16,86,'#ffffff');X.rr(x,y,10,80,4,'rgba(0,0,0,.4)');const h=f*76;X.rr(x+1,y+78-h,8,h,3,X.lg(0,y+78,0,y,['#3ddc84','#ffcf3f','#ff4f6d']));};
const tapper=(i,q)=>{if(A.cpu&&i===1){const tv=2+2*A.ai;q.v+=(tv-q.v)*.05+rnd(.1)-.05;return;}const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.45;}q.v*=.965;};
const runner=(x,y,col,st)=>A.person(x,y,{c:col,st:typeof st==='number'?st*Math.PI+(A.t*.35):0,s:1.05});

/* ---- TABLE KICK ---- */
A.add({id:'foos',name:'TABLE KICK',cat:'SPORTS',vs:1,how:'UP/DOWN SLIDE YOUR ROD. A KICKS. FIRST TO 5.',make(){
 const g={over:null,score:0},fx=X.fx();let rod=[120,120],b,sc=[0,0],wait=40,kickT=[0,0],tr=[];const RX=[[70,130],[190,250]];
 const reset=()=>{b={x:160,y:120,vx:rnd(2)-1,vy:rnd(2)-1};wait=40;tr=[];};reset();
 g.update=()=>{kickT=kickT.map(v=>v?v-1:0);if(wait>0){wait--;return;}if(A.cpu){const ty=b.y+(b.vx>0?0:(b.y<120?-20:20));A.bot({u:rod[1]>ty+3,d:rod[1]<ty-3,a:Math.abs(b.y-rod[1])<20&&Math.random()<.1*A.ai});}
  for(let i=0;i<2;i++){const k=A.in(i);rod[i]=cl(rod[i]+ay(k)*(i&&A.cpu?1.4+1.6*A.ai:3.2),60,180);const kick=A.hit(i).a;if(kick)kickT[i]=10;for(const x of RX[i])for(const off of[-46,0,46]){const my=rod[i]+off;if(Math.abs(b.x-x)<6&&Math.abs(b.y-my)<8){b.vx=(i?-1:1)*(kick?7.5:3.2);b.vy=(b.y-my)*.3+rnd(1)-.5;b.x=x+(i?-7:7);S(kick?'hit':'blip');fx.spark(b.x,b.y,kick?'#ffe080':'#ffffff',kick?8:3,kick?2.5:1.2);}}}
  tr.unshift([b.x,b.y]);if(tr.length>8)tr.pop();b.x+=b.vx;b.y+=b.vy;b.vx*=.997;b.vy*=.997;if(Math.abs(b.vx)<.3)b.vx+=(b.x<160?-.05:.05);if(b.y<30||b.y>210){b.vy*=-1;b.y=cl(b.y,30,210);}
  if(b.x<10||b.x>W-10){if(b.y>90&&b.y<150){const w=b.x<10?1:0;sc[w]++;S('score');fx.flash(PC[w],8);fx.spark(b.x<160?10:W-10,b.y,K.y,16,3);fx.pop(160,80,'GOAL!',K.y);if(sc[w]>=5)g.over=A.win(w);else reset();}else{b.vx*=-1;b.x=cl(b.x,10,W-10);S('blip');}}};
 const bg=()=>{X.vg(0,0,W,H,['#3a2010','#1a0e06']);X.rr(2,20,W-4,H-22,6,X.lg(0,20,0,H,['#8a5428','#5a3414']));X.turf(8,26,W-16,188,'#1f8a40','#25944a',20,true);X.vg(8,26,W-16,188,['rgba(255,255,255,.08)','rgba(0,0,0,.2)']);const c=A.c;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.2;c.strokeRect(10,28,W-20,184);c.beginPath();c.moveTo(160,28);c.lineTo(160,212);c.stroke();c.beginPath();c.arc(160,120,20,0,6.283);c.stroke();c.strokeRect(10,85,26,70);c.strokeRect(W-36,85,26,70);c.fillStyle='#111';c.fillRect(2,90,8,60);c.fillRect(W-10,90,8,60);};
 const man=(x,y,i,kk)=>{const col=PC[i],d=i?-1:1,c=A.c;c.save();c.translate(x,y);if(kk)c.rotate(d*-.5*(kk/10));X.shadow(2,3,6,4,.3);X.rr(-4,-7,8,14,3,X.lg(-4,0,4,0,[X.lt(col,.7),X.lt(col,1.3),X.lt(col,.7)]));X.disc(0,-9,3.4,'#f1c7a3');X.ell(0,-10.5,3.4,1.8,'#3a2a1a');c.fillStyle='#222';c.fillRect(d*2-2,6,4,3);c.restore();};
 g.draw=()=>{X.cache('foos_bg',bg);const c=A.c;
  tr.forEach((q,i)=>{c.globalAlpha=.25*(1-i/8);X.disc(q[0],q[1],3.5-i*.3,'#ffffff');});c.globalAlpha=1;X.shadow(b.x+1,b.y+2,4,3,.3);X.orb(b.x,b.y,4,'#ffffff');
  RX.forEach((xs,i)=>xs.forEach(x=>{c.fillStyle=X.lg(x-1.5,0,x+1.5,0,['#8a8aa0','#ffffff','#6a6a80']);c.fillRect(x-1.5,20,3,H-20);X.rr(x-4,i?H-14:12,8,12,3,'#222');[-46,0,46].forEach(o=>man(x,rod[i]+o,i,kickT[i]));}));
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- CURLING ---- */
A.add({id:'curling',name:'CURLING',cat:'SPORTS',vs:1,how:'A LOCKS AIM, A LOCKS POWER. NEAREST THE BUTTON SCORES.',make(){
 const g={over:null,score:0},BX=260,BY=120,fx=X.fx();let stones=[],p=0,n=0,ph=0,t=0,aim=0,pow=0,live=null,end=1,sc=[0,0],msg='',mt=0,trail=[];
 g.update=()=>{t++;if(mt>0)mt--;const cpu=A.cpu&&p===1,h=A.hit(human(p));
  if(live){if(A.t%3===0){trail.push([live.x,live.y]);if(trail.length>40)trail.shift();}live.x+=live.vx;live.y+=live.vy;live.vx*=.985;live.vy*=.985;for(const s of stones){const dx=s.x-live.x,dy=s.y-live.y,d=Math.hypot(dx,dy);if(d<12&&d>0){const nx=dx/d,ny=dy/d,rv=live.vx*nx+live.vy*ny;if(rv>0){s.vx=(s.vx||0)+rv*nx;s.vy=(s.vy||0)+rv*ny;live.vx-=rv*nx;live.vy-=rv*ny;S('hit');fx.spark((s.x+live.x)/2,(s.y+live.y)/2,'#ffffff',6,2);}}}
   stones.forEach(s=>{s.x+=s.vx||0;s.y+=s.vy||0;s.vx=(s.vx||0)*.98;s.vy=(s.vy||0)*.98;});if(Math.hypot(live.vx,live.vy)<.05){if(live.x>40&&live.x<W-6&&live.y>30&&live.y<210)stones.push(live);live=null;trail=[];n++;p=1-p;ph=0;t=0;
    if(n>=8){stones.sort((a,b)=>Math.hypot(a.x-BX,a.y-BY)-Math.hypot(b.x-BX,b.y-BY));let pts=0;const w=stones[0]?stones[0].o:0;for(const s of stones){if(s.o!==w||Math.hypot(s.x-BX,s.y-BY)>40)break;pts++;}if(stones.length){sc[w]+=pts;msg=A.nm(w)+' +'+pts;S('score');fx.ring(BX,BY,PC[w],50,20);}else msg='NO SCORE';mt=90;stones=[];n=0;end++;if(end>3){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}}}return;}
  if(ph===0){aim=Math.sin(t*.05)*.3;if(cpu?t>50:h.a){ph=1;t=0;if(cpu)aim=(rnd(.1)-.05)*(2-A.ai);}}else{pow=.5+.5*Math.sin(t*.07);if(cpu?t>30+rnd(20):h.a){if(cpu)pow=.55+rnd(.2)*(2-A.ai);live={x:30,y:120,vx:Math.cos(aim)*(2+pow*3.2),vy:Math.sin(aim)*(2+pow*3.2),o:p};S('shoot');}}};
 const bg=()=>{X.vg(0,0,W,H,['#eaf4fc','#cfe2f2']);const c=A.c;c.fillStyle='rgba(255,255,255,.6)';for(let i=0;i<200;i++)c.fillRect((i*67)%W,(i*41)%H,1,1);c.fillStyle='rgba(120,160,200,.15)';for(let i=0;i<60;i++)c.fillRect((i*89)%W,(i*53)%H,2,1);
  [[40,'#2a7ad8'],[28,'#ffffff'],[16,'#e03040'],[6,'#ffffff']].forEach(v=>X.disc(BX,BY,v[0],X.rg(BX,BY,v[0]*.6,BX,BY,v[0],[v[1],X.lt(v[1],.85)])));c.fillStyle='rgba(200,40,60,.7)';c.fillRect(40,28,2,184);c.fillStyle='rgba(60,60,80,.35)';c.fillRect(BX,28,1,184);c.fillRect(30,BY,W-30,1);c.fillStyle='#5a7a9a';c.fillRect(0,22,W,4);c.fillRect(0,214,W,4);};
 const stone=s=>{X.shadow(s.x+1,s.y+2,7,5,.3);X.disc(s.x,s.y,6.5,X.rg(s.x-2,s.y-2,1,s.x,s.y,6.5,['#b8b8c0','#6a6a74','#3a3a44']));X.disc(s.x,s.y,4,X.rg(s.x-1,s.y-1,0,s.x,s.y,4,[X.lt(PC[s.o],1.4),PC[s.o]]));A.c.fillStyle='#222';A.c.fillRect(s.x-.8,s.y-3,1.6,4);};
 g.draw=()=>{X.cache('curl_bg',bg);const c=A.c;c.strokeStyle='rgba(120,160,220,.35)';c.lineWidth=2;c.beginPath();trail.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke();
  stones.forEach(stone);if(live)stone(live);
  if(!live&&ph===0){c.globalAlpha=.85;for(let i=1;i<12;i++)X.disc(30+Math.cos(aim)*i*7,120+Math.sin(aim)*i*7,1.6-i*.08,'#ff9838');c.globalAlpha=1;stone({x:30,y:120,o:p});}if(!live&&ph===1){stone({x:30,y:120,o:p});pb3(8,40,pow);}
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);T('END '+Math.min(end,3)+'/3  STONE '+(n+1)+'/8  '+A.nm(p),160,6,K.w,1,'c');if(mt>0)X.ot(msg,160,196,K.y,2,'c');};
 return g;}});

/* ---- PUCK HOCKEY ---- */
A.add({id:'hockey',name:'PUCK HOCKEY',cat:'SPORTS',vs:1,how:'SKATE INTO THE PUCK. A SLAPSHOTS. FIRST TO 5.',make(){
 const g={over:null,score:0},fx=X.fx();let pl,b,sc=[0,0],wait=40,tr=[],sw=[0,0],netS=[0,0];const reset=()=>{pl=[{x:100,y:120,vx:0,vy:0,fx:1,fy:0},{x:220,y:120,vx:0,vy:0,fx:-1,fy:0}];b={x:160,y:120,vx:0,vy:0};wait=40;tr=[];};reset();
 g.update=()=>{sw=sw.map(v=>v?v-1:0);netS=netS.map(v=>v?v-1:0);if(wait>0){wait--;return;}if(A.cpu){const q=pl[1],vx=b.x-14,vy=b.y-120,n=Math.hypot(vx,vy)||1,ux=vx/n,uy=vy/n,beh=(q.x-b.x)*ux+(q.y-b.y)*uy>3,dd=Math.hypot(q.x-b.x,q.y-b.y);let tx,ty;if(beh){tx=b.x+ux*3;ty=b.y+uy*3;}else{tx=b.x+ux*24;ty=b.y+uy*24+(q.y<b.y?-18:18);}
   A.bot({l:q.x>tx+2,r:q.x<tx-2,u:q.y>ty+2,d:q.y<ty-2,a:beh&&dd<13&&A.t%5===0&&(b.x<200||Math.random()<.3)});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),acc=i&&A.cpu?.14+.12*A.ai:.28;q.vx=(q.vx+ax(k)*acc)*.93;q.vy=(q.vy+ay(k)*acc)*.93;if(ax(k)||ay(k)){const m=Math.hypot(ax(k),ay(k));q.fx=ax(k)/m;q.fy=ay(k)/m;}q.x=cl(q.x+q.vx,20,W-20);q.y=cl(q.y+q.vy,36,H-16);if(Math.hypot(q.vx,q.vy)>1.5&&A.t%4===0)fx.spark(q.x,q.y+2,'#ffffff',1,1);
   if(A.hit(i).a)sw[i]=10;const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<11){if(A.hit(i).a){b.vx=q.fx*7;b.vy=q.fy*7;S('hit');fx.spark(b.x,b.y,'#c8e8ff',8,2.5);A.shake=2;}else{b.vx=dx/(d||1)*2.5+q.vx;b.vy=dy/(d||1)*2.5+q.vy;}b.x=q.x+dx/(d||1)*11;b.y=q.y+dy/(d||1)*11;}}
  tr.unshift([b.x,b.y]);if(tr.length>8)tr.pop();b.x+=b.vx;b.y+=b.vy;b.vx*=.985;b.vy*=.985;if(Math.hypot(b.vx,b.vy)<.5&&(b.x<30||b.x>W-30||b.y<48||b.y>H-28)){b.vx+=(160-b.x)*.005;b.vy+=(120-b.y)*.005;}if(b.y<32||b.y>H-12){b.vy*=-1;b.y=cl(b.y,32,H-12);S('blip');}
  if(b.x<14||b.x>W-14){if(b.y>90&&b.y<150){const w=b.x<14?1:0;sc[w]++;S('score');netS[w?0:1]=20;fx.flash('#ffffff',8);fx.pop(160,80,'GOAL!',K.y);fx.spark(b.x,b.y,K.r,16,3);if(sc[w]>=5)g.over=A.win(w);else reset();}else{b.vx=(b.x<14?1:-1)*Math.max(1,Math.abs(b.vx)*.5);b.x=b.x<14?15:W-15;S('blip');}}if((b.y<40||b.y>H-20)&&(b.x<40||b.x>W-40)){b.vy+=(120-b.y)*.01;b.vx+=(160-b.x)*.01;}};
 const bg=()=>{X.sky(['#1a1a2e','#0a0a18']);X.rr(4,22,W-8,H-26,14,'#d8dce8');X.rr(8,26,W-16,H-34,12,X.rg(160,120,20,160,120,190,['#ffffff','#e8f2ff','#d0e2f8']));const c=A.c;c.fillStyle='rgba(180,210,240,.3)';for(let i=0;i<80;i++)c.fillRect((i*67)%W,24+(i*41)%210,6,1);
  c.fillStyle='rgba(220,40,60,.75)';c.fillRect(159,26,2,H-34);c.fillStyle='rgba(40,90,220,.7)';c.fillRect(100,26,3,H-34);c.fillRect(217,26,3,H-34);c.strokeStyle='rgba(40,90,220,.7)';c.lineWidth=1.2;c.beginPath();c.arc(160,120,24,0,6.283);c.stroke();for(const[x,y]of[[60,70],[60,170],[260,70],[260,170]]){c.strokeStyle='rgba(220,40,60,.6)';c.beginPath();c.arc(x,y,14,0,6.283);c.stroke();X.disc(x,y,2,'rgba(220,40,60,.8)');}
  c.fillStyle='rgba(220,40,60,.6)';c.fillRect(20,26,1.5,H-34);c.fillRect(W-21.5,26,1.5,H-34);X.disc(20,120,12,'rgba(80,140,255,.25)');X.disc(W-20,120,12,'rgba(80,140,255,.25)');};
 const net=(x,d,s)=>{const c=A.c,w=s?Math.sin(s)*1.5:0;c.fillStyle='rgba(255,255,255,.2)';c.fillRect(d<0?x-8:x,90,8,60);c.strokeStyle='rgba(120,120,140,.7)';c.lineWidth=.5;c.beginPath();for(let y=90;y<=150;y+=5){c.moveTo(x,y);c.lineTo(x+d*(8+w),y);}c.stroke();c.fillStyle='#e03040';c.fillRect(x-1,88,2,64);};
 g.draw=()=>{X.cache('hockey_bg',bg);const c=A.c;net(14,-1,netS[0]);net(W-14,1,netS[1]);
  tr.forEach((q,i)=>{c.globalAlpha=.2*(1-i/8);X.disc(q[0],q[1],3.5,'#333');});c.globalAlpha=1;X.shadow(b.x+1,b.y+2,4.5,2.5,.25);X.ell(b.x,b.y+1,4.2,2.6,'#000');X.ell(b.x,b.y,4.2,2.6,'#2a2a2a');
  pl.forEach((q,i)=>{const s=sw[i]?(sw[i]/10):0;X.shadow(q.x,q.y+9,7,2,.25);A.person(q.x,q.y+9,{s:.62,c:PC[i],pants:'#222',d:q.fx<0?-1:1,id:i*3+1,st:Math.hypot(q.vx,q.vy)>.5?A.t*.2:0,cap:i?'#ffcf3f':'#ffffff'});const sx=q.x+q.fx*(6+s*6),sy=q.y+5+q.fy*(6+s*6);X.stroke([[q.x+q.fx*2,q.y-6],[sx,sy],[sx+q.fx*5-q.fy*2,sy+q.fy*5+2]],'#8a5a2a',1.8);});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- LONG JUMP ---- */
A.add({id:'longjump',name:'LONG JUMP',cat:'SPORTS',how:'TAP LEFT/RIGHT TO RUN. A AT THE BOARD TO JUMP. 3 TRIES.',make(){
 const g={over:null,score:0},fx=X.fx();let q={p:0,v:0,last:''},air=null,tries=3,msg='',mt=0,best=0,marks=[];
 g.update=()=>{if(mt>0){mt--;if(mt===0){if(tries<=0)g.over=best.toFixed(2)+' M BEST';q={p:0,v:0,last:''};air=null;}return;}
  if(air){air.t++;air.x+=air.vx;air.y=air.vy*air.t-.18*air.t*air.t;if(air.y<0){const d=Math.max(0,(air.x-240)/22);msg=air.foul?'FOUL':d.toFixed(2)+' M';if(!air.foul){g.score=Math.max(g.score,Math.round(d*100));best=Math.max(best,d);marks.push(air.x);}mt=80;tries--;S(air.foul?'lose':'score');fx.debris(air.x,152,'#e8c77a',14,2.5);if(d>=best&&!air.foul&&d>0)fx.pop(160,80,'BEST!',K.g);}return;}
  tapper(0,q);q.p+=q.v*.5;if(q.v>2&&A.t%4===0)fx.spark(q.p,150,'#e8a070',1,1);if((A.hit(0).a&&q.p>170)||q.p>250){air={t:0,x:q.p,y:0,vx:q.v*.6,vy:2.5+q.v*.35,foul:q.p>246};S('jump');}};
 g.draw=()=>{const c=A.c;X.cache('lj_bg',()=>{stadium(30);X.vg(0,90,W,60,['#c4552d','#a8462a']);X.vg(0,150,W,90,['#d8603a','#c4552d']);c.fillStyle='#fff';A.c.fillStyle='rgba(255,255,255,.85)';A.c.fillRect(0,150,240,1.2);X.vg(240,140,W,100,['#f4dca0','#e8c77a','#d0aa60']);A.c.fillStyle='rgba(150,110,50,.25)';for(let i=0;i<80;i++)A.c.fillRect(240+(i*37)%80,140+(i*23)%100,1.5,1);A.c.fillStyle='#ffffff';A.c.fillRect(234,140,6,100);for(let m=1;m<=8;m++){A.c.fillStyle='rgba(255,255,255,.7)';A.c.fillRect(240+m*22,150,1,90);T(m,240+m*22-2,152,'#ffffff');}});
  marks.forEach(x=>X.ell(x,151,5,1.5,'rgba(120,80,30,.5)'));const x=air?air.x:q.p,y=air?150-air.y*8:150;X.shadow(x,151,8,2,.3);A.person(x,y,{c:'#2fd6c3',pants:'#222',s:1.05,num:7,st:air?1.3:q.p*.26,d:1,id:2,arm1:air?-2.6:undefined,arm2:air?-2.2:undefined});
  fx.draw();X.bar('TRIES '+tries,'BEST '+best.toFixed(2)+' M');X.meter(110,22,100,5,Math.min(1,q.v/4.5),'#ff9838');if(mt>0)X.ot(msg,160,60,msg==='FOUL'?K.r:K.y,3,'c');};
 return g;}});

/* ---- HURDLES ---- */
A.add({id:'hurdles',name:'HURDLES',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT TO RUN. A JUMPS HURDLES.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:0,last:'',j:0,fin:0},{p:0,v:0,last:'',j:0,fin:0}],t=-120,knock=[];const HU=[150,300,450,600,750];
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;tapper(i,q);if(q.j>0)q.j--;const nh=HU.find(h=>h>q.p-10);
   if(i===1&&A.cpu){if(nh&&nh-q.p<28+rnd(8)&&q.j===0&&Math.random()<.6)q.j=32;}else if(A.hit(i).a&&q.j===0){q.j=32;S('jump');}
   if(nh&&Math.abs(nh-q.p)<5&&(q.j<8||q.j>28)){if(!knock.includes(i+':'+nh)){knock.push(i+':'+nh);fx.debris(nh-(Math.max(r[0].p,r[1].p)-100)+40,150+i*55-10,'#ffffff',6,2);}q.v*=.3;S('hit');}q.p+=q.v*.5;if(q.p>=900){q.fin=t;S('coin');}}
  if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);}};
 g.draw=()=>{const c=A.c;X.cache('hur_bg',()=>{stadium(30);X.vg(0,90,W,150,['#d8603a','#c4552d','#a8462a']);});const cam=Math.max(r[0].p,r[1].p)-100;c.fillStyle='#ffffff';c.fillRect(900-cam+40,90,4,150);
  r.forEach((q,i)=>{const y=150+i*55;c.fillStyle='rgba(255,255,255,.85)';c.fillRect(0,y+4,W,1.2);HU.forEach(h=>{const x=h-cam+40,down=knock.includes(i+':'+h);if(x>-10&&x<W+10){c.fillStyle='#ddd';c.fillRect(x-7,y-16,1.5,20);c.fillRect(x+6,y-16,1.5,20);if(down){X.rr(x-8,y-2,16,4,1,'#ff4f6d');}else{X.rr(x-9,y-18,18,4,1,X.lg(x-9,0,x+9,0,['#ffffff','#ff4f6d','#ffffff','#ff4f6d','#ffffff']));}}});
   const jy=q.j>0?Math.sin(q.j/32*3.14)*22:0,x=q.p-cam+40;X.shadow(x,y+1,9-jy*.2,2,.3);A.person(x,y-jy,{c:PC[i],pants:'#222',st:q.j>0?1.2:q.p*.26,s:1.05,id:i*3,num:i+1,arm1:q.j>0?-2.2:undefined});X.ot(A.nm(i),6,y-30,i?K.p:K.c,1);});
  fx.draw();X.bar();X.ot(t<0?'SET...':(t/60).toFixed(1)+'S',160,22,K.y,2,'c');};
 return g;}});

/* ---- SWIM SPRINT ---- */
A.add({id:'swim',name:'SWIM SPRINT',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT IN RHYTHM. STEADY BEATS FAST.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:0,last:'',lt:0,fin:0},{p:0,v:0,last:'',lt:0,fin:0}],t=-100,lap=[0,0],good=[0,0];
 g.update=()=>{t++;good=good.map(v=>v?v-1:0);if(t<0)return;if(t===0)fx.flash('#ffffff',6);for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;if(A.cpu&&i===1){q.v+=(1.4+1.4*A.ai-q.v)*.05;}else{const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){const gap=t-q.lt;q.last=n;q.lt=t;const ok=gap>8&&gap<22;q.v+=ok?.5:.15;if(ok)good[i]=10;}q.v*=.97;}
   q.p+=q.v*.5;const x=lap[i]?296-(q.p-280):20+q.p;if(A.t%5===0&&q.v>.6)fx.spark(x+(lap[i]?14:-14),100+i*60,'#ffffff',2,1.2);if(lap[i]===0&&q.p>=280){lap[i]=1;q.v*=.5;fx.ring(296,100+i*60,'#ffffff',16,10);}if(lap[i]===1&&q.p>=560){q.fin=t;S('coin');}}
  if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);}};
 const bg=()=>{X.vg(0,0,W,40,['#d8dce8','#a8b0c0']);X.water(0,40,W,200,'#3ab0e0','#1a7ab8',0);const c=A.c;c.fillStyle='rgba(20,60,120,.35)';c.fillRect(0,98,W,4);c.fillRect(0,158,W,4);c.fillRect(0,218,W,4);c.fillStyle='#e8f0f8';c.fillRect(0,36,W,6);c.fillRect(18,40,6,200);c.fillRect(294,40,6,200);
  for(const y of[70,130,190])for(let x=0;x<W;x+=8){X.disc(x+4,y,2.6,((x/8)|0)%6<3?'#ff4f6d':'#ffffff');}};
 g.draw=()=>{X.cache('swim_bg',bg);const c=A.c;c.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<16;i++){const x=((i*47+A.t*.3)%W),y=50+(i*29)%180;c.fillRect(x,y+Math.sin(A.t*.05+i)*2,10,1);}
  r.forEach((q,i)=>{const dir=lap[i]?-1:1,x=lap[i]?296-(q.p-280):20+q.p,y=100+i*60,s=Math.sin(t*.4+i)*4,col=PC[i];c.fillStyle='rgba(0,40,80,.3)';X.ell(x,y+2,16,5,'rgba(0,40,80,.3)');X.ell(x,y,14,4.5,X.lg(0,y-4,0,y+4,[X.lt(col,1.3),col]));X.disc(x+dir*15,y-1,4,col);X.ell(x+dir*16,y-3,3.5,2,'#ffffff');c.fillStyle='#f1c7a3';X.ell(x-dir*4+s*dir,y-5,4,1.8,'#f1c7a3',s*.2);X.ell(x+dir*6-s*dir,y+4,4,1.8,'#f1c7a3',-s*.2);if(q.v>.5){c.globalAlpha=.6;X.ell(x-dir*16,y,5,2,'#ffffff');c.globalAlpha=1;}X.ot(A.nm(i),6,y-22,i?K.p:K.c,1);if(good[i])X.ot('GOOD',x,y-16,K.g,1,'c');});
  fx.draw();X.ot(t<0?'TAKE YOUR MARKS':(t/60).toFixed(1)+'S',160,14,K.w,2,'c');};
 return g;}});

/* ---- FISHING DERBY ---- */
A.add({id:'fishing',name:'FISHING DERBY',cat:'SPORTS',how:'LEFT/RIGHT MOVE. DOWN LOWERS THE HOOK, UP REELS. BIG FISH = BIG POINTS. 60 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let bx=160,hy=80,fish=[],time=3600,caught=null;for(let i=0;i<9;i++)fish.push({x:rnd(W),y:100+i*14,d:i%2?1:-1,s:1+ri(3),v:.5+rnd(1)});
 g.update=()=>{time--;const k=A.in(0);bx=cl(bx+ax(k)*2,20,W-20);hy=cl(hy+ay(k)*2,70,225);fish.forEach(f=>{f.x+=f.d*f.v/f.s*1.5;if(f.x<-20)f.x=W+20;if(f.x>W+20)f.x=-20;});
  if(caught){caught.x=bx;caught.y=hy;if(A.t%6===0)fx.spark(bx,hy,'#bfe8ff',1,1);if(hy<=72){const pts=caught.s*caught.s*10;g.score+=pts;S('score');fx.spark(bx+12,64,'#ffffff',12,2.5);fx.pop(bx,50,'+'+pts,K.y);fish.push({x:rnd(W),y:100+ri(9)*14,d:1,s:1+ri(3),v:.5+rnd(1)});fish.splice(fish.indexOf(caught),1);caught=null;}}
  else{const f=fish.find(f=>Math.abs(f.x-bx)<6*f.s&&Math.abs(f.y-hy)<6);if(f){caught=f;S('coin');fx.ring(bx,hy,'#ffffff',14,10);}}if(time<=0)g.over='TIME UP';};
 const bg=()=>{X.sky(['#ff9a6a','#ffd0a0','#a8e0ff'],62);X.disc(250,40,16,'rgba(255,240,200,.9)');X.glow(250,40,50,'#ffd080',.35);X.hills(62,16,'#5a9a6a',0,.02,3);X.vg(0,60,W,H-60,['#2a8ac8','#1a5fa8','#0a2a5a']);const c=A.c;
  for(let i=0;i<5;i++){c.fillStyle='rgba(255,255,255,.06)';c.beginPath();c.moveTo(40+i*60,60);c.lineTo(60+i*60,60);c.lineTo(20+i*70,H);c.lineTo(i*70,H);c.closePath();c.fill();}
  X.vg(0,226,W,14,['#8a7a5a','#5a4a3a']);for(let i=0;i<8;i++){const x=20+i*40;c.strokeStyle='#2a8a4a';c.lineWidth=2;c.beginPath();c.moveTo(x,230);c.quadraticCurveTo(x+6,210,x-2,190+(i%3)*8);c.stroke();}for(let i=0;i<6;i++)X.ell(30+i*55,230,8+(i%3)*3,4,'#6a6a7a');};
 g.draw=()=>{X.cache('fish_bg',bg);const c=A.c;c.fillStyle='rgba(255,255,255,.5)';c.fillRect(0,60,W,1.5);for(let i=0;i<20;i++){c.fillStyle='rgba(255,255,255,.25)';c.fillRect((i*53+A.t*.4)%W,61+(i%3),8,1);}
  X.shadow(bx,62,18,2,.2);X.rr(bx-18,50,36,10,4,X.lg(0,50,0,60,['#c8884a','#8a5428']));c.fillStyle='#5a3414';c.fillRect(bx-18,52,36,1.2);A.person(bx-4,50,{c:'#2fd6c3',pants:'#3a4a2a',cap:'#e8c040',s:.95,id:4,arm2:-1.3});X.stroke([[bx+2,34],[bx+12,26]],'#6a4020',1.4);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=.6;c.beginPath();c.moveTo(bx+12,26);c.lineTo(bx+12,hy);c.stroke();
  fish.forEach(f=>{const s=f.s;c.save();c.translate(f.x,f.y);if(f.d>0)c.scale(-1,1);A.emoji(['🐟','🐠','🐡'][s-1],0,0,12+s*9);c.restore();});
  for(let i=0;i<12;i++){const y=H-((i*37+A.t*.6)%150);A.ring((i*53+A.t*.3)%W,y,1.5,'rgba(255,255,255,.4)');}if(!caught){X.stroke([[bx+12,hy],[bx+12,hy+4],[bx+10,hy+5]],'#d8d8e0',1);X.disc(bx+12,hy-3,1.6,'#ff4f6d');}
  fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),'',K.y,time<600?K.r:K.w);};
 return g;}});

/* ---- HALFPIPE ---- */
A.add({id:'halfpipe',name:'HALFPIPE',cat:'SPORTS',how:'A AT THE LIP LAUNCHES. TAP A IN THE AIR FOR TRICKS. 45 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let a=0,va=.02,air=0,h=0,vh=0,spins=0,time=2700,msg='',mt=0,rot=0;
 g.update=()=>{time--;if(mt>0)mt--;if(air){h+=vh;vh-=.25;if(A.hit(0).a){spins++;S('blip');}rot+=(spins*6.283-rot)*.25;if(h<=0){air=0;h=0;const p=spins*50+(spins>3?100:0);g.score+=p;msg=spins?['','KICKFLIP','360','540','720','900+'][Math.min(spins,5)]+' +'+p:'';mt=50;spins=0;rot=0;S(p?'score':'hit');const x=160+Math.sin(a)*150,y=80+Math.cos(a)*150;fx.spark(x,y,'#ffffff',p?10:4,2);if(p)fx.ring(x,y,K.y,20);}return;}
  a+=va;if(Math.abs(a)>1.4){va*=-1;a=cl(a,-1.4,1.4);if(A.hit(0).a||A.in(0).a){air=1;vh=3+Math.abs(va)*60;S('jump');}}else{va+=(a<0?1:-1)*-.0006;va*=1.004;}if(A.t%6===0&&!air)fx.spark(160+Math.sin(a)*150,80+Math.cos(a)*150,'rgba(200,200,220,.8)',1,1);
  if(time<=0)g.over='SESSION OVER';};
 const bg=()=>{X.sky(['#2a6ad8','#8ac8f8','#ffd8a8']);X.disc(250,50,18,'rgba(255,250,220,.9)');X.glow(250,50,60,'#ffe0a0',.3);X.skyline(150,'#6a7aa8',0,6,'rgba(255,240,200,.5)');const c=A.c;
  c.fillStyle=X.lg(0,80,0,H,['#b8b8c8','#8a8a9a','#6a6a78']);c.beginPath();c.moveTo(0,H);c.lineTo(0,80);c.arc(160,80,160,3.1416,0,true);c.lineTo(W,80);c.lineTo(W,H);c.closePath();c.fill();c.fillStyle='#ffffff';c.beginPath();c.moveTo(0,80);c.arc(160,80,160,3.1416,0,true);c.lineTo(W,80);c.lineTo(W,H);c.lineTo(0,H);c.closePath();
  c.fillStyle=X.lg(0,80,0,H,['#9898a8','#c8c8d4','#a8a8b8']);c.beginPath();c.arc(160,80,160,0,3.1416);c.arc(160,80,150,3.1416,0,true);c.closePath();c.fill();c.strokeStyle='#e8e8f0';c.lineWidth=2.5;c.beginPath();c.arc(160,80,160,0,3.1416);c.stroke();c.fillStyle='#d8d8e0';c.fillRect(-2,76,6,8);c.fillRect(W-4,76,6,8);c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=1;for(let i=1;i<6;i++){const an=i*.52;c.beginPath();c.moveTo(160+Math.cos(an)*150,80+Math.sin(an)*150);c.lineTo(160+Math.cos(an)*160,80+Math.sin(an)*160);c.stroke();}};
 g.draw=()=>{X.cache('hp_bg',bg);const c=A.c,x=160+Math.sin(a)*150,y=80+Math.cos(a)*150-h*4,tilt=air?rot:-a;c.save();c.translate(x,y);c.rotate(tilt);X.shadow(0,2,9,1.5,.2);X.rr(-10,-1,20,3,1.5,'#ff4f6d');c.fillStyle='#222';c.fillRect(-7,2,3,2);c.fillRect(4,2,3,2);A.person(0,-1,{s:.6,c:'#ffcf3f',pants:'#2a3a7a',cap:'#ff4f6d',d:a<0?1:-1,id:1,arm1:air?-2.4:-.8,arm2:air?2.4:.8});c.restore();
  fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),air?'TRICKS '+spins:'');if(mt>0)X.ot(msg,160,40,K.y,2,'c');};
 return g;}});

/* ---- HIGH DIVE ---- */
A.add({id:'dive',name:'HIGH DIVE',cat:'SPORTS',how:'A TUCKS TO SPIN. RELEASE TO STRAIGHTEN. ENTER VERTICAL. 5 DIVES.',make(){
 const g={over:null,score:0},fx=X.fx();let y=40,vy=0,rot=0,n=0,ph='wait',t=0,msg='',flips=0,clean=false;
 g.update=()=>{t++;if(ph==='wait'){if(t>40){ph='fall';vy=0;y=40;rot=0;flips=0;}return;}if(ph==='fall'){vy+=.09;y+=vy;if(A.in(0).a){rot+=.18;}rot+=.02;flips=rot/6.28;if(y>=200){const ang=Math.abs(((rot%6.28)+6.28)%6.28-6.28*0),e=Math.min(ang,6.28-ang);clean=e<.35;const p=Math.round(Math.floor(flips)*30+(clean?50:e<.9?20:0));g.score+=p;msg=(clean?'SPLASHLESS! ':e<.9?'OK ':'BELLY FLOP ')+'+'+p;n++;ph='res';t=0;S(clean?'score':'boom');fx.debris(110,200,'#bfe8ff',clean?6:22,clean?1.5:3.5);fx.ring(110,201,'#ffffff',clean?14:34);}}
  else if(t>70){if(n>=5)g.over='DIVES DONE';else{ph='wait';t=0;}}};
 const bg=()=>{X.sky(['#2a7ad8','#9ad0f8','#e0f2ff'],200);for(let i=0;i<3;i++){X.disc(200+i*40,40+(i%2)*14,9,'rgba(255,255,255,.9)');X.disc(212+i*40,36+(i%2)*14,11,'rgba(255,255,255,.9)');}crowd3(120,196,3,.35);X.water(0,200,W,40,'#3ab0e0','#1a6aa8',0);const c=A.c;
  c.fillStyle=X.lg(150,0,166,0,['#8a8aa0','#d8d8e8','#8a8aa0']);c.fillRect(150,42,14,160);c.fillStyle='rgba(0,0,0,.15)';for(let y=50;y<200;y+=12)c.fillRect(150,y,14,1);X.block(60,36,104,6,'#5a6a8a',2);c.fillStyle='#ffcf3f';c.fillRect(60,36,104,1.5);c.fillStyle='#c8c8d8';for(let y=48;y<200;y+=8)c.fillRect(170,y,8,1.5);c.fillRect(170,42,1.5,158);c.fillRect(177,42,1.5,158);};
 g.draw=()=>{X.cache('dive_bg',bg);const c=A.c;c.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<10;i++)c.fillRect((i*37+A.t*.4)%W,204+(i%4)*8,10,1);
  if(ph==='wait'){A.person(80+t,36,{s:.9,c:'#ff4f6d',pants:'#ff4f6d',d:1,id:2,st:t*.2});}
  else if(ph==='fall'){const tuck=A.in(0).a;c.save();c.translate(110,y);c.rotate(rot);if(tuck){X.disc(0,0,7,'#ff4f6d');X.disc(0,-7,4,'#f1c7a3');c.fillStyle='#f1c7a3';c.fillRect(3,-3,4,6);}else{A.person(0,14,{s:.85,c:'#ff4f6d',pants:'#ff4f6d',d:1,id:2,arm1:-3.1,arm2:3.1});}c.restore();}
  fx.draw();X.bar('DIVE '+Math.min(n+1,5)+'/5','SCORE '+g.score,'',K.w,K.y);if(ph==='fall')X.ot('FLIPS '+flips.toFixed(1),160,60,K.w,1,'c');if(ph==='res')X.ot(msg,160,100,clean?K.y:K.c,2,'c');};
 return g;}});

/* ---- BADMINTON ---- */
A.add({id:'badminton',name:'BADMINTON',cat:'SPORTS',vs:1,how:'MOVE. UP JUMPS. A SMASHES. FIRST TO 7.',make(){
 const g={over:null,score:0},GY=210,fx=X.fx();let pl,b,sc=[0,0],wait=40,sw=[0,0];const reset=s=>{pl=[{x:70,y:GY,vy:0},{x:250,y:GY,vy:0}];b={x:s?250:70,y:120,vx:0,vy:0};wait=40;};reset(0);
 g.update=()=>{sw=sw.map(v=>v?v-1:0);if(wait>0){wait--;return;}if(A.cpu){const q=pl[1];let tx=250;if(b.x>160){let x=b.x,y=b.y,vx=b.vx,vy=b.vy,n=0;while(y<GY-30&&n++<200){vy+=.09;vy*=.985;vx*=.985;x+=vx;y+=vy;}tx=cl(x-10,175,W-16);}A.bot({l:q.x>tx+3,r:q.x<tx-3,u:b.x>160&&Math.abs(b.x-q.x)<24&&b.y>GY-90&&b.y<GY-50&&Math.random()<A.ai*.8,a:Math.abs(b.x-q.x)<24&&Math.abs(b.y-q.y+20)<26&&Math.random()<.3});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),sp=i&&A.cpu?1.4+1.6*A.ai:3;q.x=cl(q.x+ax(k)*sp,i?175:16,i?W-16:145);if(k.u&&q.y>=GY){q.vy=-4.5;S('jump');}q.vy+=.22;q.y+=q.vy;if(q.y>GY){q.y=GY;q.vy=0;}if(A.hit(i).a)sw[i]=10;
   const dx=b.x-q.x,dy=b.y-(q.y-20),d=Math.hypot(dx,dy);if(d<24&&(A.hit(i).a||d<12)){const sm=A.hit(i).a&&q.y<GY-10;b.vx=(i?-1:1)*(sm?5.5:2.8+rnd(1));b.vy=sm?2.5:-4.2-rnd(1);S('hit');fx.spark(b.x,b.y,'#ffffff',sm?10:4,sm?2.5:1.5);if(sm){fx.pop(b.x,b.y-14,'SMASH!',K.y);A.shake=3;}}}
  b.vy+=.09;b.vx*=.985;b.vy*=.985;b.x+=b.vx;b.y+=b.vy;if(b.x<5){b.x=5;b.vx=Math.abs(b.vx);}if(b.x>W-5){b.x=W-5;b.vx=-Math.abs(b.vx);}
  if(b.y>GY-70&&Math.abs(b.x-160)<6){b.vx=(b.x<160?-1:1)*Math.abs(b.vx)*.5;b.x=160+(b.x<160?-6:6);}
  if(b.y>GY-4){const w=b.x<160?1:0;sc[w]++;S('score');fx.spark(b.x,GY,'#ffffff',8,2);fx.ring(b.x,GY,PC[w],20);if(sc[w]>=7)g.over=A.win(w);else reset(w);}};
 const bg=()=>{X.sky(['#1a1238','#2a1a50'],GY);crowd3(70,130,11,.35);for(const lx of[60,160,260]){X.glow(lx,24,30,'#fff0c0',.3);X.disc(lx,24,3,'#fffbe8');}X.vg(0,GY,W,30,['#2a9a5a','#1a7a44']);const c=A.c;c.fillStyle='#ffffff';c.fillRect(0,GY,W,1.5);c.fillRect(30,GY,1,30);c.fillRect(290,GY,1,30);c.fillStyle='#ddd';c.fillRect(158,GY-68,4,68);c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=.5;c.beginPath();for(let y=GY-66;y<GY-40;y+=4){c.moveTo(150,y);c.lineTo(170,y);}for(let x=150;x<=170;x+=4){c.moveTo(x,GY-66);c.lineTo(x,GY-40);}c.stroke();c.fillStyle='#fff';c.fillRect(148,GY-68,24,2);};
 g.draw=()=>{X.cache('bad_bg',bg);const c=A.c;
  pl.forEach((q,i)=>{const d=i?-1:1,arm=sw[i]?(-2.6+(10-sw[i])*.3)*d:-1.2*d;X.shadow(q.x,GY+1,9-(GY-q.y)*.05,2,.3);A.person(q.x,q.y,{c:PC[i],pants:'#f2f2f2',st:q.x*.2,d,s:1.1,id:i*4+2,arm2:d>0?arm:undefined,arm1:d<0?arm:undefined});const sx=q.x+5*d,sy=q.y-23,hx=sx-Math.sin(arm)*11,hy=sy+Math.cos(arm)*11,rx=hx-Math.sin(arm)*8,ry=hy+Math.cos(arm)*8;X.stroke([[hx,hy],[rx,ry]],'#555',1.2);c.strokeStyle='#ffcf3f';c.lineWidth=1.2;c.beginPath();if(c.ellipse)c.ellipse(rx-Math.sin(arm)*4,ry+Math.cos(arm)*4,3.5,5,arm,0,6.283);c.stroke();});
  const an=Math.atan2(b.vy,b.vx);c.save();c.translate(b.x,b.y);c.rotate(an);X.poly([[0,-2],[-9,-5],[-9,5],[0,2]],'rgba(255,255,255,.9)');c.strokeStyle='rgba(180,180,200,.8)';c.lineWidth=.5;c.beginPath();c.moveTo(-9,-3);c.lineTo(0,0);c.moveTo(-9,3);c.lineTo(0,0);c.stroke();X.disc(1,0,2.2,'#ffcf3f');c.restore();
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);};
 return g;}});
})();
