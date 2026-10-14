(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const X=new Proxy({},{get:(_,k)=>A.gx[k]}),PC=['#2fd6c3','#ff4f9a'];
const crowd3=(y0,y1,seed,a)=>{const c=A.c;for(let y=y0;y<y1;y+=5)for(let x=(y/5%2)*3;x<W;x+=6){const k=((x|0)*31+(y|0)*17+seed)%7;c.globalAlpha=a||.5;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84','#c86dff','#ff9838'][k];c.fillRect(x,y+1,4,4);c.fillStyle=['#f1c7a3','#c68a5e','#6e4428'][k%3];c.fillRect(x+1,y-1,2,2);}c.globalAlpha=1;};
const pb3=(x,y,f)=>{X.panel(x-3,y-3,16,86,'#ffffff');X.rr(x,y,10,80,4,'rgba(0,0,0,.4)');const h=f*76;X.rr(x+1,y+78-h,8,h,3,X.lg(0,y+78,0,y,['#3ddc84','#ffcf3f','#ff4f6d']));};
const tapper=(i,q)=>{if(A.cpu&&i===1){const tv=2+2*A.ai;q.v+=(tv-q.v)*.05+rnd(.1)-.05;return;}const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.45;}q.v*=.965;};
const runner=(x,y,col,st)=>A.person(x,y,{c:col,st:typeof st==='number'?st*Math.PI+(A.t*.35):0,s:1.05});
const CRW=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84','#c86dff','#ff9838'],SKN=['#f1c7a3','#c68a5e','#6e4428'];
const scr3=(key,fn,off,y0,h,dy)=>{const c=A.c,o=((off%W)+W)%W;c.save();c.beginPath();c.rect(0,y0,W,h);c.clip();c.translate(-o,dy||0);X.cache(key,fn);c.translate(W,0);X.cache(key,fn);c.restore();};
const arena3=(cam,ch)=>{const c=A.c;X.cache('ar3_sky',()=>{const c=A.c;X.sky(['#0c1634','#24427e','#5a8ace'],40);X.stars(30,3,0,0,22,.5);for(const x of[26,294]){c.fillStyle='#2a2e3e';c.fillRect(x-1.5,18,3,10);X.rr(x-10,13,20,8,2,'#3a3e50');for(let i=0;i<4;i++)for(let j=0;j<2;j++)X.disc(x-7+i*4.6,15+j*3.5,1.4,'#fff8e0');}});
 for(const x of[26,294])X.glow(x,17,34,'#fff4d0',.4);
 scr3('ar3_crowd',()=>{const c=A.c;X.vg(0,26,W,8,['#4a4e62','#1c1e2a']);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(0,26,W,1);X.vg(0,33,W,52,['#1e2030','#2c2e40']);for(let y=35;y<80;y+=5)for(let x=(y/5%2)*2.5;x<W;x+=5){const k=Math.abs(Math.sin(x*12.99+y*78.23)*43758|0)%7;c.globalAlpha=.55+(y-35)/100;c.fillStyle=CRW[k];c.fillRect(x,y+1,3.6,3.4);c.fillStyle=SKN[k%3];c.fillRect(x+.8,y-1,2,2);}c.globalAlpha=1;for(let x=38;x<W;x+=80){X.vg(x,33,5,48,['#3a3c4c','#4a4c5c']);c.fillStyle='rgba(255,255,255,.12)';for(let y=35;y<80;y+=4)c.fillRect(x,y,5,1);}X.vg(0,33,W,14,['rgba(0,0,0,.45)','rgba(0,0,0,0)']);c.fillStyle='#9aa0b4';c.fillRect(0,80,W,1.5);},cam*.45,26,56,ch?-Math.abs(Math.sin(A.t*.5))*1.5:0);
 if(A.gfx!=='off')for(let i=0;i<(ch?6:2);i++){c.globalAlpha=Math.random();c.fillStyle='#ffffff';c.fillRect(Math.random()*W,36+Math.random()*42,1.5,1.5);}c.globalAlpha=1;
 scr3('ar3_ads',()=>{const c=A.c,ws=['SPRINT','PIXEL','GO!','ARCADE','RUN','JUMP','FAST','TRACK'],cs=['#d0304e','#1a5ab0','#e8a020','#1a8a5a','#7a3ac0','#e05a20','#2a2a3a','#0a8aa0'];ws.forEach((w,i)=>{X.vg(i*40,82,40,9,[X.lt(cs[i],1.3),cs[i],X.lt(cs[i],.6)]);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(i*40,82,1,9);A.text(w,i*40+20,84,'#ffffff',1,'c');});c.fillStyle='#e8e8f0';c.fillRect(0,91,W,1.5);},cam,82,10);};

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
 const g={over:null,score:0},BX=260,BY=120,fx=X.fx();let stones=[],p=0,n=0,ph=0,t=0,aim=0,pow=0,live=null,end=1,sc=[0,0],msg='',mt=0,trail=[],marks=[],ghost=[],sw=0;
 g.update=()=>{t++;if(mt>0)mt--;const cpu=A.cpu&&p===1,h=A.hit(human(p));
  if(live){const lsp=Math.hypot(live.vx,live.vy);live.r=(live.r||0)+lsp*.04*(live.o?-1:1);sw+=.35;if(A.t%3===0){trail.push([live.x,live.y]);if(trail.length>40)trail.shift();}
   if(lsp>.5&&live.x>44&&A.t%2===0){const ux=live.vx/lsp,uy=live.vy/lsp,o=Math.sin(sw)*5;marks.push([live.x+ux*11-uy*o,live.y+uy*11+ux*o,ux,uy,A.t]);if(marks.length>260)marks.shift();if(A.t%10===0)fx.spark(live.x+ux*12,live.y+uy*12,'#ffffff',2,.8);}
   live.x+=live.vx;live.y+=live.vy;live.vx*=.985;live.vy*=.985;for(const s of stones){const dx=s.x-live.x,dy=s.y-live.y,d=Math.hypot(dx,dy);if(d<12&&d>0){const nx=dx/d,ny=dy/d,rv=live.vx*nx+live.vy*ny;if(rv>0){s.vx=(s.vx||0)+rv*nx;s.vy=(s.vy||0)+rv*ny;live.vx-=rv*nx;live.vy-=rv*ny;S('hit');const mx=(s.x+live.x)/2,my=(s.y+live.y)/2;fx.spark(mx,my,'#ffffff',6+(rv*4|0),2+rv*.5);fx.ring(mx,my,'#cfe6ff',8+rv*6,12);if(rv>1.2){A.shake=Math.min(7,2+rv*2|0);fx.pop(mx,my-12,'CLACK!',K.w);}}}}
   stones.forEach(s=>{s.x+=s.vx||0;s.y+=s.vy||0;s.vx=(s.vx||0)*.98;s.vy=(s.vy||0)*.98;s.r=(s.r||0)+Math.hypot(s.vx,s.vy)*.05;});if(Math.hypot(live.vx,live.vy)<.05){if(live.x>40&&live.x<W-6&&live.y>30&&live.y<210)stones.push(live);else fx.pop(live.x<40?60:Math.min(live.x,W-30),cl(live.y,40,200),'OUT',K.r);live=null;trail=[];n++;p=1-p;ph=0;t=0;
    if(n>=8){stones.sort((a,b)=>Math.hypot(a.x-BX,a.y-BY)-Math.hypot(b.x-BX,b.y-BY));let pts=0;const w=stones[0]?stones[0].o:0;for(const s of stones){if(s.o!==w||Math.hypot(s.x-BX,s.y-BY)>40)break;pts++;}
     ghost=stones.map((s,i)=>Object.assign({},s,{hit:i<pts}));if(stones.length){sc[w]+=pts;msg=A.nm(w)+' +'+pts;S('score');fx.ring(BX,BY,PC[w],50,20);if(pts){fx.ring(BX,BY,K.y,64,30);fx.flash(PC[w],6);fx.spark(BX,BY,PC[w],14+pts*4,2.6);A.shake=3;if(pts>1)A.confetti();}}else msg='NO SCORE';mt=90;stones=[];marks=[];n=0;end++;if(end>3){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}}}return;}
  if(ph===0){aim=Math.sin(t*.05)*.3;if(cpu?t>50:h.a){ph=1;t=0;if(cpu)aim=(rnd(.1)-.05)*(2-A.ai);S('blip');}}else{pow=.5+.5*Math.sin(t*.07);if(cpu?t>30+rnd(20):h.a){if(cpu)pow=.55+rnd(.2)*(2-A.ai);live={x:30,y:120,vx:Math.cos(aim)*(2+pow*3.2),vy:Math.sin(aim)*(2+pow*3.2),o:p,r:0};sw=0;S('shoot');fx.spark(30,120,'#ffffff',8,1.6);}}};
 const bg=()=>{const c=A.c;
  /* arena: dark stands, crowd, boards */
  X.vg(0,0,W,H,['#141a2c','#0a0e18']);crowd3(222,240,9,.55);X.vg(0,221,W,19,['rgba(8,10,24,.55)','rgba(8,10,24,.25)']);c.fillStyle='rgba(255,255,255,.08)';for(let i=0;i<W;i+=40)c.fillRect(i+8,224,1,16);
  const brd=(y,h)=>{X.vg(0,y,W,h,['#ffffff','#c8d4e2']);const cols=['#2a7ad8','#e03040','#ffcf3f','#2fb86a','#7a4ad8'];for(let i=0;i<8;i++){const x=6+i*40;X.rr(x,y+1.5,32,h-3,1.5,X.lg(0,y,0,y+h,[X.lt(cols[i%5],1.2),cols[i%5]]));c.fillStyle='rgba(255,255,255,.75)';c.fillRect(x+4,y+h/2-.6,10+(i*7)%12,1.2);X.disc(x+27,y+h/2,1.6,'rgba(255,255,255,.8)');}c.fillStyle='#ffcf3f';c.fillRect(0,y+h-1,W,1);};
  brd(18,8);brd(214,7);
  /* ice: cold gradient, light pools, pebble */
  X.vg(0,26,W,188,['#f4f9fe','#e2eef8','#d6e6f3']);for(let i=0;i<4;i++){const lx=40+i*80;X.ell(lx,120,60,90,X.rg(lx,120,0,lx,120,90,['rgba(255,255,255,.4)','rgba(255,255,255,0)']));}
  /* house rings painted under the ice */
  [[40,'#1f6cc8'],[28,'#f4f8fc'],[16,'#d8283c'],[6,'#f4f8fc']].forEach(v=>{X.disc(BX,BY,v[0],X.rg(BX-4,BY-6,v[0]*.2,BX,BY,v[0],[X.lt(v[1],1.12),v[1],X.lt(v[1],.8)]));X.disc(BX,BY,v[0]-.6,X.rgba('#ffffff',0));c.strokeStyle='rgba(0,20,60,.25)';c.lineWidth=.8;c.beginPath();c.arc(BX,BY,v[0],0,6.283);c.stroke();});
  X.disc(BX,BY,40,X.rg(BX,BY,20,BX,BY,40,['rgba(230,242,252,.12)','rgba(230,242,252,.32)']));
  /* far house edge behind the hack */
  c.globalAlpha=.35;X.disc(-14,120,26,'#1f6cc8');X.disc(-14,120,18,'#f4f8fc');X.disc(-14,120,10,'#d8283c');c.globalAlpha=1;
  /* lines: hog, tee, back, centre, sidelines */
  c.fillStyle='rgba(200,30,50,.75)';c.fillRect(40,26,2.2,188);c.fillStyle='rgba(30,40,70,.45)';c.fillRect(BX-.5,26,1,188);c.fillRect(30,BY-.5,W-30,1);c.fillStyle='rgba(30,40,70,.6)';c.fillRect(BX+40,26,1.4,188);
  c.fillStyle='rgba(20,40,90,.55)';c.fillRect(0,26,W,1.5);c.fillRect(0,212.5,W,1.5);
  /* hack */
  X.rr(15,113,7,5,1.5,'#1a1a22');X.rr(15,122,7,5,1.5,'#1a1a22');c.fillStyle='rgba(255,255,255,.25)';c.fillRect(16,113.6,5,.8);c.fillRect(16,122.6,5,.8);
  /* pebble + frost over everything on the sheet */
  for(let i=0;i<2600;i++){const hh=(i*2654435761)>>>0,x=hh%W,y=26+(hh>>>10)%188;c.fillStyle='rgba(255,255,255,.55)';c.fillRect(x,y,.7,.7);c.fillStyle='rgba(90,130,180,.26)';c.fillRect(x+.6,y+.6,.7,.7);}
  c.strokeStyle='rgba(150,180,215,.22)';c.lineWidth=.5;for(let i=0;i<26;i++){const hh=(i*40503)>>>0,x=60+hh%240,y=34+(hh>>>7)%170;c.beginPath();c.moveTo(x,y);c.lineTo(x+8+i%12,y+(i%5)-2);c.stroke();}
  X.vg(0,26,W,8,['rgba(40,60,100,.22)','rgba(40,60,100,0)']);X.vg(0,204,W,9,['rgba(40,60,100,0)','rgba(40,60,100,.2)']);};
 const SPK=[];for(let i=0;i<14;i++)SPK.push([Math.cos(i*2.4)*(1.5+(i*7)%4),Math.sin(i*2.4)*(1.5+(i*7)%4),i%3]);
 const stone=(s,al)=>{const c=A.c,x=s.x,y=s.y,col=PC[s.o];if(al!==undefined)c.globalAlpha=al;X.shadow(x+1.6,y+2.4,7.6,5.6,.32);
  X.disc(x,y,7,X.rg(x-2.5,y-3,.5,x,y,7,['#d4d4dc','#8a8a96','#4a4a56']));c.strokeStyle='rgba(30,30,40,.6)';c.lineWidth=1;c.beginPath();c.arc(x,y,6.2,0,6.283);c.stroke();
  c.save();c.translate(x,y);c.rotate(s.r||0);for(const q of SPK){c.fillStyle=q[2]===0?'rgba(30,30,40,.55)':q[2]===1?'rgba(255,255,255,.5)':'rgba(120,90,90,.45)';c.fillRect(q[0],q[1],.8,.8);}
  X.disc(0,0,4.1,X.rg(-1.2,-1.6,.3,0,0,4.1,[X.lt(col,1.6),col,X.lt(col,.55)]));X.rr(-1.3,-1.6,2.6,7.4,1.2,X.lg(-1.3,0,1.3,0,[X.lt(col,.45),X.lt(col,.85),X.lt(col,.4)]));c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-.4,-1,.8,5.6);X.disc(0,0,1.6,X.lt(col,.6));c.restore();
  X.ell(x-2.4,y-3.4,2.4,1.2,'rgba(255,255,255,.7)',-.5);if(al!==undefined)c.globalAlpha=1;};
 /* top-down sweeper: shoulders, head, broom to the ice */
 const sweeper=(x,y,o,bx,by)=>{const col=PC[o];X.stroke([[x,y],[bx,by]],'#6a4a2a',1.2);X.rr(bx-3.2,by-1.4,6.4,2.8,1,X.lt(col,.5));X.shadow(x+1,y+2,5,3,.25);X.ell(x,y,5,3.4,X.lg(x-5,0,x+5,0,[X.lt(col,.7),X.lt(col,1.25),X.lt(col,.7)]));X.disc(x,y-.4,2.4,'#3a2a1a');X.disc(x+.6,y-1,1.6,'#f1c7a3');};
 g.draw=()=>{X.cache('curl2_bg',bg);const c=A.c,tn=A.t;
  /* sweep scratches */
  c.lineWidth=.6;for(const m of marks){const a=Math.max(0,.55-(tn-m[4])/700);if(a<=0)continue;c.strokeStyle='rgba(120,160,210,'+a.toFixed(2)+')';c.beginPath();c.moveTo(m[0]-m[3]*3,m[1]+m[2]*3);c.lineTo(m[0]+m[3]*3,m[1]-m[2]*3);c.stroke();c.strokeStyle='rgba(255,255,255,'+(a*.9).toFixed(2)+')';c.beginPath();c.moveTo(m[0]-m[3]*3+.6,m[1]+m[2]*3+.6);c.lineTo(m[0]+m[3]*3+.6,m[1]-m[2]*3+.6);c.stroke();}
  c.strokeStyle='rgba(120,160,220,.3)';c.lineWidth=2;c.beginPath();trail.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke();
  if(mt>45&&ghost.length){const a=(mt-45)/45;ghost.forEach(s=>{stone(s,a);if(s.hit){c.globalAlpha=a;X.glow(s.x,s.y,12,K.y,.5);c.strokeStyle=K.y;c.lineWidth=1.4;c.beginPath();c.arc(s.x,s.y,9+Math.sin(tn*.3)*1.2,0,6.283);c.stroke();c.globalAlpha=1;}});}
  stones.forEach(s=>stone(s));
  if(live){const sp=Math.hypot(live.vx,live.vy);if(sp>.5&&live.x>44){const ux=live.vx/sp,uy=live.vy/sp;for(const sd of[-1,1]){const o=Math.sin(sw+(sd>0?0:1.5))*4,bx=live.x+ux*12-uy*(o+sd*2),by=live.y+uy*12+ux*(o+sd*2);sweeper(live.x+ux*4-uy*sd*14,live.y+uy*4+ux*sd*14,live.o,bx,by);}}stone(live);if(sp>2)X.glow(live.x,live.y,10,'#cfe6ff',.25);}
  if(!live){X.shadow(17,121,6,4,.3);X.ell(18,120,4.5,6,X.lg(14,0,22,0,[X.lt(PC[p],.7),X.lt(PC[p],1.25),X.lt(PC[p],.7)]));X.disc(16.5,120,2.5,'#3a2a1a');X.disc(17.2,120,1.7,'#f1c7a3');X.stroke([[19,123],[24,121]],X.lt(PC[p],.8),1.6);}
  if(!live&&ph===0){const L=Math.min(232,(BX-30)/Math.max(.2,Math.cos(aim)));for(let i=1;i<26;i++){const d=i*9+(tn*.4)%9;if(d>L)break;c.globalAlpha=.85*(1-d/L*.7);X.disc(30+Math.cos(aim)*d,120+Math.sin(aim)*d,1.5-d/L*.6,'#ff9838');}c.globalAlpha=1;
   const tx=30+Math.cos(aim)*L,ty=120+Math.sin(aim)*L;c.strokeStyle='rgba(255,152,56,.9)';c.lineWidth=1.2;c.beginPath();c.arc(tx,ty,4+Math.sin(tn*.2),0,6.283);c.stroke();X.stroke([[tx-6,ty],[tx+6,ty]],'rgba(255,152,56,.9)',.8);X.stroke([[tx,ty-6],[tx,ty+6]],'rgba(255,152,56,.9)',.8);
   stone({x:30,y:120,o:p,r:aim});X.ot('AIM',30,103,K.o,1,'c');}
  if(!live&&ph===1){stone({x:30,y:120,o:p,r:aim});pb3(8,40,pow);X.ot('WEIGHT',13,148,K.w,1,'c');}
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);T('END '+Math.min(end,3)+'/3  STONE '+(n+1)+'/8  '+A.nm(p),160,6,K.w,1,'c');
  /* stones left per team on the boards */
  for(let k=n;k<8;k++){const o=(p+(k-n))%2,j=(k>>1);X.orb(o?W-10-j*9:10+j*9,232,3.2,PC[o]);}
  if(mt>0){c.globalAlpha=Math.min(1,mt/15);X.panel(98,186,124,22,mt>0&&msg!=='NO SCORE'?K.y:'#ffffff');X.ot(msg,160,192,K.y,2,'c');c.globalAlpha=1;}};
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
 const g={over:null,score:0},fx=X.fx();let q={p:0,v:0,last:''},air=null,tries=3,msg='',mt=0,best=0,marks=[],tr=[],ch=0,res=[];
 g.update=()=>{if(ch)ch--;if(mt>0){mt--;if(mt===0){if(tries<=0)g.over=best.toFixed(2)+' M BEST';q={p:0,v:0,last:''};air=null;tr=[];}return;}
  if(air){air.t++;air.x+=air.vx;air.y=air.vy*air.t-.18*air.t*air.t;tr.unshift([air.x,150-Math.max(0,air.y)*8]);if(tr.length>8)tr.pop();if(air.y<0){const d=Math.max(0,(air.x-240)/22);msg=air.foul?'FOUL':d.toFixed(2)+' M';const nb=!air.foul&&d>best&&d>0;if(!air.foul){g.score=Math.max(g.score,Math.round(d*100));best=Math.max(best,d);marks.push({x:air.x,d});}mt=80;tries--;res.push(air.foul?-1:d);S(air.foul?'lose':'score');fx.debris(air.x,150,'#e8c77a',22,3);fx.debris(air.x,150,'#f8e8b0',10,2);A.shake=air.foul?2:4;if(nb){fx.pop(160,80,'BEST!',K.g);ch=80;fx.ring(air.x,150,'#ffcf3f',36);}}return;}
  tapper(0,q);q.p+=q.v*.5;if(q.v>2&&A.t%4===0)fx.spark(q.p-4,150,'#f0a080',1,1);if((A.hit(0).a&&q.p>170)||q.p>250){air={t:0,x:q.p,y:0,vx:q.v*.6,vy:2.5+q.v*.35,foul:q.p>246};S('jump');fx.debris(q.p,150,'#ffffff',5,1.5);if(air.foul){fx.flash('#ff2040',5);A.shake=2;}}};
 const trk=()=>{const c=A.c;X.vg(0,92,W,148,['#b84a2a','#d0583a','#c4552d','#a8462a']);c.fillStyle='rgba(0,0,0,.05)';for(let i=0;i<500;i++)c.fillRect((i*131)%W,92+(i*67)%148,1,1);X.vg(0,132,244,24,['#e06a42','#d0603a']);c.fillStyle='rgba(255,255,255,.85)';c.fillRect(0,131,244,1.3);c.fillRect(0,156,244,1.3);
  X.vg(0,166,W,74,['#3a8a3a','#2e7a32','#24622a']);c.fillStyle='rgba(255,255,255,.05)';for(let x=0;x<W;x+=40)c.fillRect(x,166,20,74);c.fillStyle='rgba(255,255,255,.7)';c.fillRect(0,166,W,1.5);X.rr(242,124,82,46,3,X.lg(0,124,0,170,['#7a5a34','#5a3e20']));X.rr(246,128,80,38,2,X.lg(0,128,0,166,['#f8e4b0','#ecd08a','#d0aa60']));c.fillStyle='rgba(150,110,50,.25)';for(let i=0;i<80;i++)c.fillRect(248+(i*37)%72,130+(i*23)%34,1.5,1);c.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<24;i++)c.fillRect(250+(i*53)%70,132+(i*31)%30,3,.8);
  X.rr(230,134,10,22,1,X.lg(0,134,0,156,['#ffffff','#e0e0e8']));c.fillStyle='rgba(0,0,0,.2)';c.fillRect(230,155,10,1);c.fillStyle='#e8343c';c.fillRect(240,134,3,22);for(let m=1;m<=3;m++){const x=240+m*22;c.fillStyle='rgba(255,255,255,.55)';c.fillRect(x,128,1,38);X.rr(x-6,112,12,9,2,'#1a2a4a');A.text(m+'M',x,114,'#ffffff',1,'c');c.fillStyle='#d0d0d8';c.fillRect(x-.5,121,1,7);}};
 g.draw=()=>{const c=A.c;arena3(0,ch);X.cache('lj_trk2',trk);
  marks.forEach(m=>{X.ell(m.x,151,5,1.6,'rgba(120,80,30,.55)');const b=m.d>=best-1e-6;c.fillStyle='#ddd';c.fillRect(m.x-.5,136,1,15);X.poly([[m.x,136],[m.x+9,139],[m.x,142]],b?'#ffcf3f':'#ffffff');});
  if(air&&tr.length>1){for(let k=tr.length-1;k>0;k--){c.globalAlpha=.25*(1-k/tr.length);A.person(tr[k][0],tr[k][1],{c:'#2fd6c3',pants:'#222',s:1.1,st:1.3,d:1,id:2,arm1:-2.6,arm2:-2.2});}c.globalAlpha=1;}
  const x=air?air.x:q.p,y=air?150-Math.max(0,air.y)*8:150;X.shadow(x,151,9-(150-y)*.08,2.2,.35);if(q.v>2.6&&!air&&A.gfx!=='off'){c.fillStyle='rgba(47,214,195,.35)';for(let k=0;k<4;k++)c.fillRect(x-14-k*9-(A.t*3+k*7)%9,y-22+k*5,8,1);}A.person(x,y,{c:'#2fd6c3',pants:'#222',s:1.1,num:7,st:air?1.3:q.p*.26,d:1,id:2,arm1:air?-2.6:undefined,arm2:air?-2.2:undefined});
  if(!air&&!mt&&q.p>150&&q.p<=246&&A.t%12<8){X.ot('A',x,y-46,q.p>215?K.r:K.y,2,'c');}
  fx.draw();X.bar('','BEST '+best.toFixed(2)+' M');T('TRIES',6,6,K.w,1);for(let i=0;i<3;i++)X.orb(38+i*9,8,3,i<tries?'#3ddc84':'#3a3a4a',i<tries?undefined:0);X.panel(108,20,104,12);X.meter(140,23,68,6,Math.min(1,q.v/4.5),q.v>3.5?'#ff4f6d':'#ff9838');T('SPEED',112,24,'#ffffff',1);X.panel(70,184,180,44,'#ffcf3f');T('JUMP',78,190,'#ffcf3f',1);T('RESULT',242,190,'#ffcf3f',1,'r');for(let i=0;i<3;i++){const y=201+i*9,m=res[i];T(String(i+1),80,y,'#ffffff',1);T(m===undefined?'-':m<0?'FOUL':m.toFixed(2)+' M',242,y,m===undefined?'#8a8aa0':m<0?K.r:m>0&&m===best?K.g:'#ffffff',1,'r');}if(mt>0)X.ot(msg,160,56,msg==='FOUL'?K.r:K.y,3,'c');};
 return g;}});

/* ---- HURDLES ---- */
A.add({id:'hurdles',name:'HURDLES',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT TO RUN. A JUMPS HURDLES.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:0,last:'',j:0,fin:0},{p:0,v:0,last:'',j:0,fin:0}],t=-120,knock=[],cam=-100,ch=0;const HU=[150,300,450,600,750],sx=p=>p-cam+40;
 g.update=()=>{t++;if(ch)ch--;if(t<0)return;if(t===0){S('shoot');fx.flash('#ffffff',6);}for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;tapper(i,q);if(q.j>0){q.j--;if(q.j===0)fx.debris(sx(q.p),150+i*55,'#e8906a',4,1.2);}const nh=HU.find(h=>h>q.p-10);
   if(i===1&&A.cpu){if(nh&&nh-q.p<28+rnd(8)&&q.j===0&&Math.random()<.6)q.j=32;}else if(A.hit(i).a&&q.j===0){q.j=32;S('jump');}
   if(nh&&Math.abs(nh-q.p)<5&&(q.j<8||q.j>28)){if(!knock.includes(i+':'+nh)){knock.push(i+':'+nh);fx.debris(sx(nh),150+i*55-10,'#ffffff',8,2.2);fx.debris(sx(nh),150+i*55-10,'#ff4f6d',5,2);fx.pop(sx(nh),150+i*55-40,'CLIP!','#ff8a9a');if(!(A.cpu&&i===1))A.shake=4;}q.v*=.3;S('hit');}
   if(q.v>2.6&&A.t%4===0)fx.spark(sx(q.p)-4,150+i*55,'#f0a080',1,1);q.p+=q.v*.5;if(q.p>=900){q.fin=t;S('coin');ch=90;fx.flash(PC[i],8);A.burst(sx(900),150+i*55-20,PC[i],22,2.5);}}
  cam=Math.max(r[0].p,r[1].p)-100;if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);}};
 const hurdle=(x,y,down)=>{const c=A.c;if(down){X.shadow(x+2,y+1,11,1.5,.3);c.save();c.translate(x+2,y-2);c.rotate(.12);c.fillStyle='#d8d8e0';c.fillRect(-9,0,18,1.5);X.rr(-10,-3,20,4,1,X.lg(-10,0,10,0,['#ffffff','#ff4f6d','#ffffff','#ff4f6d','#ffffff']));c.restore();return;}
  X.shadow(x,y+1,11,1.8,.3);c.fillStyle='#b8bcc8';c.fillRect(x-8,y-16,1.8,17);c.fillRect(x+6.5,y-16,1.8,17);c.fillStyle='#8a8e9a';c.fillRect(x-11,y-.5,6,1.5);c.fillRect(x+4.5,y-.5,6,1.5);X.rr(x-10,y-19,20,5,1,X.lg(x-10,0,x+10,0,['#ffffff','#ff4f6d','#ffffff','#ff4f6d','#ffffff']));c.fillStyle='rgba(255,255,255,.6)';c.fillRect(x-9,y-18.5,18,1);};
 const trk=()=>{const c=A.c;X.vg(0,92,W,148,['#b84a2a','#d0583a','#c4552d','#a8462a']);c.fillStyle='rgba(0,0,0,.05)';for(let i=0;i<500;i++)c.fillRect((i*131)%W,92+(i*67)%148,1,1);for(const[y0,y1]of[[122,156],[177,211]])X.vg(0,y0,W,y1-y0,['rgba(255,255,255,.05)','rgba(255,255,255,0)']);c.fillStyle='rgba(255,255,255,.85)';for(const y of[121,156,211,236])c.fillRect(0,y,W,1.3);X.vg(0,236,W,4,['#3a7a3a','#2a5a2a']);};
 g.draw=()=>{const c=A.c;arena3(cam,ch);X.cache('hur_trk',trk);c.fillStyle='rgba(255,255,255,.45)';for(let x=-((cam%25)+25)%25;x<W;x+=25)for(const y of[156,211])c.fillRect(x,y-3,1.2,3);
  for(let i=0;i<2;i++){const lx=sx(-30);if(lx>10)X.ot(''+(i+1),lx,150+i*55-24,'rgba(255,255,255,.5)',3,'c');}
  const fx_=sx(900);if(fx_>-10&&fx_<W+10){for(let y=122;y<236;y+=4){c.fillStyle=((y-122)/4)%2?'#111':'#fff';c.fillRect(fx_,y,3,4);c.fillStyle=((y-122)/4)%2?'#fff':'#111';c.fillRect(fx_+3,y,3,4);}c.fillStyle='#d0d0d8';c.fillRect(fx_-1,96,2,26);c.fillRect(fx_+6,96,2,26);X.rr(fx_-8,94,24,9,2,'#d0304e');T('FINISH',fx_+4,96,'#ffffff',1,'c');}
  r.forEach((q,i)=>{const y=150+i*55;HU.forEach(h=>{const x=sx(h);if(x>-14&&x<W+14)hurdle(x,y,knock.includes(i+':'+h));});
   const jy=q.j>0?Math.sin(q.j/32*3.14)*22:0,x=sx(q.p);if(q.v>2.6&&A.gfx!=='off'){c.fillStyle=X.rgba(PC[i],.35);for(let k=0;k<4;k++)c.fillRect(x-14-k*9-(A.t*3+k*7)%9,y-22+k*5-jy,8,1);}X.shadow(x,y+1,9-jy*.2,2,.35-jy*.008);A.person(x,y-jy,{c:PC[i],pants:'#222',st:q.j>0?1.2:q.p*.26,s:1.1,id:i*3,num:i+1,arm1:q.j>0?-2.2:undefined});X.ot(A.nm(i),cl(x,14,W-14),y-jy-40,i?K.p:K.c,1,'c');if(q.fin)X.ot('FINISHED',cl(x,20,W-20),y-jy-50,K.y,1,'c');
   const nh=HU.find(h=>h>q.p-10);if(!(A.cpu&&i===1)&&nh&&nh-q.p<40&&nh-q.p>8&&q.j===0&&A.t%12<8&&sx(nh)<W-8)X.ot('A',sx(nh),y-34,K.y,2,'c');});
  fx.draw();X.bar();r.forEach((q,i)=>{T(A.nm(i),i?W-6:6,4,PC[i],1,i?'r':'l');X.meter(i?W-86:6,11,80,4,Math.min(1,q.p/900),PC[i]);});X.ot(t<0?(t<-60?'ON YOUR MARKS':'SET...'):(t/60).toFixed(1)+'S',160,t<0?50:4,t<0?K.y:K.w,2,'c');if(t>=0&&t<40)X.ot('GO!',160,50,'#3dff8b',3,'c');};
 return g;}});

/* ---- SWIM SPRINT ---- */
A.add({id:'swim',name:'SWIM SPRINT',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT IN RHYTHM. STEADY BEATS FAST.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:0,last:'',lt:0,fin:0},{p:0,v:0,last:'',lt:0,fin:0}],t=-100,lap=[0,0],good=[0,0];
 g.update=()=>{t++;good=good.map(v=>v?v-1:0);if(t<0)return;if(t===0){fx.flash('#ffffff',6);S('shoot');}for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;if(A.cpu&&i===1){q.v+=(1.4+1.4*A.ai-q.v)*.05;}else{const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){const gap=t-q.lt;q.last=n;q.lt=t;const ok=gap>8&&gap<22;q.v+=ok?.5:.15;if(ok){good[i]=10;const x=lap[i]?296-(q.p-280):20+q.p;fx.spark(x,100+i*60,'#bff8ff',3,1.4);}}q.v*=.97;}
   q.p+=q.v*.5;const x=lap[i]?296-(q.p-280):20+q.p,dir=lap[i]?-1:1;if(A.t%5===0&&q.v>.6)fx.spark(x-dir*18,100+i*60,'#ffffff',2,1.2);if(lap[i]===0&&q.p>=280){lap[i]=1;q.v*=.5;fx.ring(296,100+i*60,'#ffffff',18,12);fx.debris(296,100+i*60,'#bfe8ff',6,1.6);fx.pop(280,84+i*60,'TURN',PC[i]);}if(lap[i]===1&&q.p>=560){q.fin=t;S('coin');fx.ring(20,100+i*60,PC[i],30,18);fx.spark(20,100+i*60,'#ffffff',14,2.6);}}
  if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);A.confetti();}};
 const bg=()=>{const c=A.c;X.vg(0,0,W,40,['#3a3a5a','#24243c']);crowd3(4,30,7,.5);X.vg(0,30,W,6,['#c8c8d8','#8a8aa0']);X.water(0,40,W,200,'#3ac0ec','#1666b0',0);
  c.strokeStyle='rgba(255,255,255,.07)';c.lineWidth=1;c.beginPath();for(let x=0;x<W;x+=16){c.moveTo(x,42);c.lineTo(x,H);}for(let y=48;y<H;y+=16){c.moveTo(0,y);c.lineTo(W,y);}c.stroke();
  c.fillStyle='rgba(10,40,100,.42)';for(const y of[100,160]){c.fillRect(30,y-2,260,4);c.fillRect(30,y-8,3,16);c.fillRect(287,y-8,3,16);}c.fillStyle='rgba(10,40,100,.2)';c.fillRect(0,218,W,4);
  X.vg(0,34,W,8,['#f4f8fc','#c8d4e0']);X.hg(0,40,20,200,['#c8d4e0','#f4f8fc']);X.hg(292,40,28,200,['#f4f8fc','#c8d4e0']);c.fillStyle='rgba(0,0,0,.12)';for(let y=40;y<H;y+=10){c.fillRect(0,y,20,1);c.fillRect(292,y,28,1);}
  for(const y of[70,130,190]){X.ell(160,y+3,160,2,'rgba(0,30,80,.25)');for(let x=0;x<W;x+=8)X.orb(x+4,y,2.8,((x/8)|0)%6<3?'#ff4f6d':'#ffffff',0);}
  for(const fx0 of[60,260]){c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=.6;c.beginPath();c.moveTo(fx0,40);c.lineTo(fx0,H);c.stroke();c.globalAlpha=.75;for(let y=46;y<H;y+=16)X.poly([[fx0-2.5,y],[fx0+2.5,y],[fx0,y+5]],(y/16|0)%2?'#ff4f6d':'#ffcf3f');c.globalAlpha=1;}
  [0,1].forEach(i=>{const y=100+i*60;X.shadow(10,y+12,10,3,.3);X.block(1,y-12,18,22,PC[i],3);T(String(i+1),10,y-6,'#ffffff',2,'c');X.block(293,y-12,18,22,PC[i],3);T(String(i+1),302,y-6,'#ffffff',2,'c');});};
 const swimmer=(x,y,dir,col,ph,v)=>{const c=A.c;c.globalAlpha=.35;X.ell(x,y+4,20,6,'#0a2a6a');c.globalAlpha=1;
  if(v>.3){c.globalAlpha=Math.min(.75,v*.45);X.stroke([[x-dir*26,y-8],[x-dir*8,y-3]],'#ffffff',1.2);X.stroke([[x-dir*26,y+8],[x-dir*8,y+3]],'#ffffff',1.2);X.ell(x-dir*21,y,5+v*2.5,3.5,'rgba(255,255,255,.8)');c.globalAlpha=1;}
  const k=Math.sin(ph*2.2)*2;X.ell(x-dir*14,y-2+k,6,1.8,'#e8b896');X.ell(x-dir*14,y+2-k,6,1.8,'#e8b896');X.ell(x,y,13,5.5,X.lg(0,y-5,0,y+5,[X.lt(col,1.45),col,X.lt(col,.55)]));
  const a1=Math.cos(ph),up=Math.sin(ph);X.ell(x+dir*(3+a1*9),y-5.5,6.5,2,up>0?'#f6d0b0':'#d8a888');X.ell(x+dir*(3-a1*9),y+5.5,6.5,2,up<0?'#f6d0b0':'#d8a888');if(Math.abs(a1)>.9&&v>.4){c.globalAlpha=.6;X.disc(x+dir*(3+Math.sign(a1)*13),y+(up>0?-6:6),2.2,'#ffffff');c.globalAlpha=1;}
  X.disc(x+dir*15,y,5,X.rg(x+dir*14,y-2,.5,x+dir*15,y,5,[X.lt(col,1.6),col]));X.rr(x+dir*16.5-1.5,y-3,3,6,1.2,'#1a1a2a');X.disc(x+dir*17,y-1.5,.8,'#bff8ff');};
 g.draw=()=>{X.cache('swim_bg3',bg);const c=A.c;c.globalAlpha=.1;for(let i=0;i<9;i++){const x=(i*61+A.t*.25)%(W+40)-20,y=50+(i*47)%180;X.ell(x,y+Math.sin(A.t*.03+i)*3,18,4,'#ffffff');}c.globalAlpha=1;c.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<16;i++){const x=((i*47+A.t*.3)%W),y=50+(i*29)%180;c.fillRect(x,y+Math.sin(A.t*.05+i)*2,10,1);}
  r.forEach((q,i)=>{const dir=lap[i]?-1:1,x=lap[i]?296-(q.p-280):20+q.p,y=100+i*60,col=PC[i];swimmer(x,y,dir,col,q.p*.22+i,q.v);X.ot(A.nm(i),24,y-24,i?K.p:K.c,1);if(good[i]){X.ot('GOOD',x,y-20,K.g,1,'c');if(A.gfx!=='off')X.glow(x,y,20,'#3dff8b',good[i]*.03);}});
  fx.draw();X.panel(104,3,112,22,'#ffffff');X.ot(t<0?'':(t/60).toFixed(1)+'S',160,8,K.w,2,'c');for(let i=0;i<2;i++){const f=Math.min(1,r[i].p/560),mx=i?220:4;X.panel(mx,5,96,16,PC[i]);X.meter(mx+4,9.5,88,7,f,PC[i]);}
  if(t<0){const n=Math.ceil(-t/33);X.ot('TAKE YOUR MARKS',160,48,'#fff3d6',2,'c');X.ot(String(n),160,118,'#ffcf3f',4,'c');}else if(t<40){c.globalAlpha=1-t/40;X.ot('GO!',160,110-t*.3,'#3dff8b',5,'c');c.globalAlpha=1;}};
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
 const g={over:null,score:0},fx=X.fx();let y=40,vy=0,rot=0,n=0,ph='wait',t=0,msg='',flips=0,clean=false,sp=[],rip=[],jd=[],tr=[],last=0;
 g.update=()=>{t++;sp.forEach(q=>{q.x+=q.vx;q.y+=q.vy;q.vy+=.16;q.t--;});sp=sp.filter(q=>q.t>0&&q.y<204);rip.forEach(r=>r.r+=.55);rip=rip.filter(r=>r.r<46);
  if(ph==='wait'){if(t>40){ph='fall';vy=0;y=40;rot=0;flips=0;tr=[];}return;}if(ph==='fall'){vy+=.09;y+=vy;if(A.in(0).a){rot+=.18;}rot+=.02;flips=rot/6.28;tr.unshift([y,rot]);if(tr.length>5)tr.pop();if(y>=200){const ang=Math.abs(((rot%6.28)+6.28)%6.28-6.28*0),e=Math.min(ang,6.28-ang);clean=e<.35;const p=Math.round(Math.floor(flips)*30+(clean?50:e<.9?20:0));g.score+=p;last=p;msg=(clean?'SPLASHLESS! ':e<.9?'OK ':'BELLY FLOP ')+'+'+p;n++;ph='res';t=0;S(clean?'score':'boom');fx.debris(110,200,'#bfe8ff',clean?6:22,clean?1.5:3.5);fx.ring(110,201,'#ffffff',clean?14:34);
   const big=!clean&&e>=.9,k=clean?12:big?46:26;for(let i=0;i<k;i++){const w=clean?4:big?26:14;sp.push({x:110+rnd(w)-w/2,y:200,vx:rnd(clean?.8:3.2)-(clean?.4:1.6),vy:-(clean?2.5+rnd(2.5):1.5+rnd(big?4.8:3.6)),t:50,s:1+rnd(1.6)});}rip.push({r:3},{r:-8},{r:-20});jd=[0,1,2].map(()=>Math.round((clean?9+rnd(1):e<.9?5.5+rnd(2.5):1.5+rnd(2.5))*2)/2);if(clean){fx.flash('#ffffff',4);fx.spark(110,198,'#ffffff',10,2.2);}if(big)A.shake=7;else if(!clean)A.shake=3;}}
  else if(t>70){if(n>=5)g.over='DIVES DONE';else{ph='wait';t=0;}}};
 const bg=()=>{const c=A.c;X.sky(['#2a6ad8','#7ab8f0','#ffd8b0'],200);X.glow(262,34,60,'#fff0b0',.4);X.disc(262,34,12,X.rg(259,31,1,262,34,12,['#ffffff','#fff8dc','#ffe8a0']));for(let i=0;i<3;i++){X.disc(170+i*40,30+(i%2)*12,8,'rgba(255,255,255,.9)');X.disc(181+i*40,26+(i%2)*12,10,'rgba(255,255,255,.9)');X.ell(176+i*40,36+(i%2)*12,16,3,'rgba(220,230,250,.9)');}X.hills(112,14,'rgba(80,120,170,.55)',0,.025,3);
  X.vg(0,96,W,8,['#f4f4fa','#a8a8c0']);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,104,W,3);X.vg(0,104,W,90,['#2a2a48','#3a3a5c']);crowd3(108,188,3,.5);c.fillStyle='rgba(0,0,0,.16)';for(let yy=112;yy<190;yy+=10)c.fillRect(0,yy,W,1);c.fillStyle='#c8c8dc';for(let x=10;x<W;x+=62)c.fillRect(x,96,2,98);
  X.vg(0,186,W,14,['#ece4d4','#b8ae9c']);c.fillStyle='rgba(0,0,0,.12)';for(let x=0;x<W;x+=12)c.fillRect(x,186,1,14);X.vg(0,184,W,3,['#ffffff','#c8c8d8']);
  X.water(0,200,W,40,'#4ac8f4','#0a4a98',0);c.fillStyle='rgba(255,255,255,.07)';for(let x=6;x<W;x+=18)c.fillRect(x,206,1,34);c.fillStyle='rgba(0,20,60,.25)';c.fillRect(0,226,W,3);c.fillStyle='rgba(255,255,255,.7)';c.fillRect(0,200,W,1);
  X.shadow(199,200,16,3,.4);X.hg(190,42,18,158,['#6a6a82','#dcdce8','#a8a8bc','#5a5a72']);c.fillStyle='rgba(0,0,0,.14)';for(let yy=52;yy<200;yy+=14)c.fillRect(190,yy,18,1);c.fillStyle='rgba(255,255,255,.1)';for(let yy=53;yy<200;yy+=14)c.fillRect(190,yy,18,1);
  c.fillStyle='rgba(0,0,0,.25)';c.fillRect(106,42,106,3);X.block(104,34,110,8,'#3a6ad0',2);c.fillStyle='#ffcf3f';c.fillRect(105,34,108,1.5);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(105,38,108,1);
  c.fillStyle='#c8c8d8';for(let yy=48;yy<200;yy+=8)c.fillRect(212,yy,8,1.5);c.fillRect(212,42,1.5,158);c.fillRect(219,42,1.5,158);X.stroke([[208,34],[214,22],[214,42]],'#c8c8d8',1.2);
  X.shadow(56,104,46,4,.4);X.rr(8,56,96,46,5,X.lg(0,56,0,102,['#2a2a48','#10101e']));X.rrs(8.5,56.5,95,45,5,'rgba(255,207,63,.6)',1);c.fillStyle='#5a5a78';c.fillRect(38,102,3,4);c.fillRect(71,102,3,4);};
 const diver=(x,yy,r,tuck,a)=>{const c=A.c;c.save();c.globalAlpha=a;c.translate(x,yy);c.rotate(r);if(tuck){X.ell(0,1,8,9,X.lg(-8,0,8,0,['#ff7a90','#e02a50']));X.rr(-2,4,9,4,2,'#f1c7a3');X.rr(4,-3,4,9,2,'#f1c7a3');X.disc(0,-10,5,X.rg(-1,-11,.5,0,-10,5,['#ffe0c8','#d8a07a']));X.disc(0,-12,4.8,'#3a2418');X.disc(1.5,-9,1,'#1a1a1a');}else A.person(0,18,{s:1.25,c:'#ff4f6d',pants:'#ff4f6d',d:1,id:2,arm1:-3.1,arm2:3.1});c.restore();};
 g.draw=()=>{X.cache('dive_bg3',bg);const c=A.c;c.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<12;i++)c.fillRect((i*37+A.t*.4)%W,204+(i%4)*8,10,1);
  rip.forEach(r=>{if(r.r<=0)return;c.globalAlpha=Math.max(0,1-r.r/46)*.8;c.strokeStyle='#ffffff';c.lineWidth=1.2;c.beginPath();if(c.ellipse)c.ellipse(110,201,r.r,r.r*.22,0,0,6.283);c.stroke();});c.globalAlpha=1;
  if(ph==='wait'){const wx=Math.max(112,196-t*2.4);A.person(wx,34,{s:1.2,c:'#ff4f6d',pants:'#ff4f6d',d:-1,id:2,st:wx>112?t*.3:0,arm1:t>30?-2.8:undefined,arm2:t>30?2.8:undefined});}
  else if(ph==='fall'){const tuck=A.in(0).a;tr.forEach((q,i)=>{if(i>0)diver(110,q[0],q[1],tuck,.14*(1-i/5));});diver(110,y,rot,tuck,1);if(tuck&&A.gfx!=='off')X.glow(110,y,18,'#ffcf3f',.18);
   const dx=284,dy=146,e=((rot%6.283)+6.283)%6.283,ok=Math.min(e,6.283-e)<.35;X.disc(dx,dy,17,'rgba(10,10,30,.6)');c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=1;c.beginPath();c.arc(dx,dy,14,0,6.283);c.stroke();c.strokeStyle='#3dff8b';c.lineWidth=3;c.beginPath();c.arc(dx,dy,14,-1.571-.35,-1.571+.35);c.stroke();X.stroke([[dx,dy],[dx+Math.sin(rot)*13,dy-Math.cos(rot)*13]],ok?'#3dff8b':'#ffcf3f',2);X.disc(dx,dy,2,'#ffffff');X.ot('ENTRY',dx,dy+20,'#fff3d6',1,'c');}
  sp.forEach(q=>{c.globalAlpha=Math.min(1,q.t/20);X.disc(q.x,q.y,q.s,q.s>1.8?'#e8f8ff':'#9ad8ff');});c.globalAlpha=1;
  fx.draw();X.ot('JUDGES',56,60,'#ffcf3f',1,'c');if(ph==='res'){jd.forEach((v,i)=>{const jx=26+i*30,k=Math.min(1,Math.max(0,(t-i*8)/8));if(k<=0)return;c.globalAlpha=k;X.block(jx-12,70,24,22,v>=9?'#2a8a50':v>=5.5?'#4a4a8a':'#8a2a3a',3);X.ot(String(v),jx,78,'#ffffff',1,'c');c.globalAlpha=1;});}else{for(let i=0;i<5;i++)X.disc(28+i*14,82,4,i<n?'#ffcf3f':'rgba(255,255,255,.18)');}
  X.bar('DIVE '+Math.min(n+1,5)+'/5','SCORE '+g.score,'',K.w,K.y);if(ph==='fall')X.ot('FLIPS '+flips.toFixed(1),160,24,K.w,1,'c');if(ph==='res'){const k=Math.min(1,t/6);c.globalAlpha=k;X.panel(60,112,200,30,clean?'#ffcf3f':last?'#2fd6c3':'#ff4f6d');X.ot(msg,160,120-(1-k)*8,clean?K.y:last?K.c:'#ff6a7a',2,'c');c.globalAlpha=1;}};
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
