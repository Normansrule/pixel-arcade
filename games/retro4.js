(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);const CO=[K.r,K.y,K.b,K.g,K.p,K.o];

/* ---- TUBE WARS (Tempest-style) ---- */
A.add({id:'tubewars',name:'TUBE WARS',cat:'CLASSICS',how:'LEFT/RIGHT MOVE AROUND THE RIM. HOLD A TO FIRE DOWN THE TUBE. STOP CLIMBERS REACHING YOU.',make(){
 const g={over:null,score:0},N=16;let seg=0,sh=[],en=[],t=0,lives=3,wave=1,inv=0,left=12;const rim=(i,d)=>{const a=(i+.5)/N*6.283-1.57,r=18+d*92,sq=1-.25*Math.abs(Math.sin(a*2));return[160+Math.cos(a)*r*1.15*sq,128+Math.sin(a)*r*sq];};
 g.update=()=>{t++;if(inv)inv--;const h=A.hit(0);if(h.l)seg=(seg+N-1)%N;if(h.r)seg=(seg+1)%N;if(A.fire(6)&&sh.length<8){sh.push({s:seg,d:1});S('shoot');}
  if(left>0&&t%Math.max(30,90-wave*8)===0){en.push({s:ri(N),d:0,v:.004+wave*.0008,k:Math.random()<.2?1:0});left--;}sh.forEach(s=>s.d-=.05);
  for(const e of en){e.d+=e.v;if(e.k&&e.d>.3&&t%50===0)e.s=(e.s+(Math.random()<.5?1:N-1))%N;for(const s of sh)if(s.s===e.s&&Math.abs(s.d-e.d)<.06){e.dead=1;s.d=-1;g.score+=e.k?150:100;S('hit');A.burst(...rim(e.s,e.d),e.k?K.p:K.r,10);}if(e.d>=1){e.dead=1;if(e.s===seg||e.k){if(inv===0){lives--;inv=90;S('boom');A.shake=8;if(lives<=0)g.over='CAUGHT ON THE RIM';}}}}
  en=en.filter(e=>!e.dead);sh=sh.filter(s=>s.d>0);if(left===0&&!en.length){wave++;left=10+wave*3;g.score+=wave*200;S('win');}};
 g.draw=()=>{A.cls('#050510');for(let i=0;i<N;i++){const a=rim(i,1),b=rim((i+1)%N,1),c=rim(i,0),d=rim((i+1)%N,0);L(a[0],a[1],b[0],b[1],i===seg?K.y:K.b,i===seg?2:1);L(c[0],c[1],d[0],d[1],'#2a2a7a');L(a[0],a[1],c[0],c[1],'#2a2a8a');}
  en.forEach(e=>{const p=rim(e.s,e.d),s=2+e.d*6;if(e.k){L(p[0]-s,p[1]-s,p[0]+s,p[1]+s,K.p,2);L(p[0]+s,p[1]-s,p[0]-s,p[1]+s,K.p,2);}else{A.ring(p[0],p[1],s,K.r);C(p[0],p[1],s*.5,K.r);}});sh.forEach(s=>{const p=rim(s.s,s.d);C(p[0],p[1],2,K.y);});
  const a=rim(seg,1.02),b=rim((seg+1)%N,1.02);if(inv%8<5){L(a[0],a[1],(a[0]+b[0])/2+(a[0]-160)*.08,(a[1]+b[1])/2+(a[1]-128)*.08,K.y,2);L(b[0],b[1],(a[0]+b[0])/2+(a[0]-160)*.08,(a[1]+b[1])/2+(a[1]-128)*.08,K.y,2);}T('SCORE '+g.score,6,6,K.y,1);T('WAVE '+wave+'  LIVES '+lives,W-6,6,K.w,1,'r');};
 return g;}});

/* ---- ROBO RIOT (twin-stick) ---- */
A.add({id:'roboriot',name:'ROBO RIOT',cat:'ACTION',mouse:1,how:'ARROWS MOVE, HOLD A TO FIRE (MOUSE AIMS). SAVE HUMANS, CLEAR WAVES.',make(){
 const g={over:null,score:0};let p={x:160,y:120,fx:1,fy:0},bl=[],rb=[],hu=[],wave=0,lives=3,inv=0;
 const nw=()=>{wave++;rb=[];hu=[];for(let i=0;i<6+wave*3;i++){let x,y;do{x=rnd(W);y=24+rnd(H-24);}while(Math.hypot(x-160,y-120)<70);rb.push({x,y,k:i%5===4&&wave>1?1:0});}for(let i=0;i<3;i++)hu.push({x:rnd(W),y:30+rnd(190),vx:rnd(1)-.5,vy:rnd(1)-.5});p.x=160;p.y=120;inv=60;};nw();
 g.update=()=>{if(inv)inv--;const k=A.in(0);const dx=ax(k),dy=ay(k);p.x=cl(p.x+dx*2.2,6,W-6);p.y=cl(p.y+dy*2.2,26,H-6);if(dx||dy){const m=Math.hypot(dx,dy);p.fx=dx/m;p.fy=dy/m;}if(A.mouse.t>0){const m=Math.hypot(A.mouse.x-p.x,A.mouse.y-p.y)||1;p.fx=(A.mouse.x-p.x)/m;p.fy=(A.mouse.y-p.y)/m;}
  if(A.fire(5)){bl.push({x:p.x,y:p.y,vx:p.fx*6,vy:p.fy*6});S('shoot');}bl.forEach(b=>{b.x+=b.vx;b.y+=b.vy;});bl=bl.filter(b=>b.x>0&&b.x<W&&b.y>20&&b.y<H);
  for(const r of rb){const d=Math.hypot(p.x-r.x,p.y-r.y)||1,sp=(.35+wave*.05)*(r.k?.6:1);r.x+=(p.x-r.x)/d*sp;r.y+=(p.y-r.y)/d*sp;for(const b of bl)if(Math.hypot(b.x-r.x,b.y-r.y)<7){if(r.k){r.hp=(r.hp||3)-1;b.x=-99;if(r.hp>0)continue;}r.dead=1;b.x=-99;g.score+=r.k?100:50;S('hit');A.burst(r.x,r.y,r.k?K.o:K.r,8);}
   if(d<8&&inv===0){lives--;inv=90;S('boom');A.shake=6;if(lives<=0){g.over='OVERRUN ON WAVE '+wave;return;}}for(const h of hu)if(!h.dead&&Math.hypot(h.x-r.x,h.y-r.y)<7){h.dead=1;S('lose');}}rb=rb.filter(r=>!r.dead);
  hu.forEach(h=>{if(h.dead||h.saved)return;h.x=cl(h.x+h.vx,6,W-6);h.y=cl(h.y+h.vy,26,H-6);if(Math.random()<.02){h.vx=rnd(1)-.5;h.vy=rnd(1)-.5;}if(Math.hypot(h.x-p.x,h.y-p.y)<10){h.saved=1;g.score+=500;S('coin');A.burst(h.x,h.y,K.g,10);}});if(!rb.length){S('win');nw();}};
 g.draw=()=>{A.cls('#0a0418');A.box(2,22,W-4,H-24,K.p);hu.forEach(h=>{if(!h.dead&&!h.saved)A.person(h.x,h.y+6,{c:K.g,s:.45,id:1,st:A.t*.3});});rb.forEach(r=>{R(r.x-5,r.y-6,10,12,r.k?K.o:'#c83a4a');R(r.x-3,r.y-4,2,2,K.y);R(r.x+1,r.y-4,2,2,K.y);R(r.x-7,r.y-2,2,6,'#888');R(r.x+5,r.y-2,2,6,'#888');});
  bl.forEach(b=>R(b.x-1,b.y-1,3,3,K.w));if(inv%8<5){C(p.x,p.y,5,K.c);L(p.x,p.y,p.x+p.fx*8,p.y+p.fy*8,K.w,2);}T('SCORE '+g.score,6,6,K.y,1);T('WAVE '+wave,160,6,K.w,1,'c');T('LIVES '+lives,W-6,6,K.w,1,'r');};
 return g;}});

/* ---- PILL DOCTOR (Dr Mario-style) ---- */
A.add({id:'pilldoc',name:'PILL DOCTOR',cat:'PUZZLE',how:'MOVE, A ROTATES, DOWN DROPS. LINE UP 4 OF A COLOUR. CLEAR EVERY GERM.',make(){
 const g={over:null,score:0},GW=8,GH=16,CS=12,OX=112,OY=26,PC=[K.r,K.y,K.b];let b,lvl=0,pc,drop=0,fall=0,clearing=0;
 const gen=()=>{lvl++;b=[...Array(GW*GH)].map(()=>null);let n=4*lvl+4;while(n>0){const x=ri(GW),y=6+ri(GH-6);if(!b[y*GW+x]){b[y*GW+x]={c:ri(3),germ:1};n--;}}spawn();};
 const spawn=()=>{pc={x:3,y:0,r:0,a:ri(3),b:ri(3)};if(b[3]||b[4])g.over='BOTTLE FULL';};
 const cells=p=>{const o=[[0,0],[1,0],[0,1],[-1,0],[0,-1]][p.r%2?2:1],sw=p.r>=2;return[[p.x,p.y,sw?p.b:p.a],[p.x+o[0],p.y+o[1],sw?p.a:p.b]];};const at=(x,y)=>x<0||x>=GW||y>=GH?{wall:1}:y<0?null:b[y*GW+x];
 const fits=p=>cells(p).every(([x,y])=>!at(x,y));
 const clear=()=>{const kill=new Set();for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=b[y*GW+x];if(!c)continue;for(const[dx,dy]of[[1,0],[0,1]]){let n=1;while(at(x+dx*n,y+dy*n)&&!at(x+dx*n,y+dy*n).wall&&at(x+dx*n,y+dy*n).c===c.c)n++;if(n>=4)for(let k=0;k<n;k++)kill.add((y+dy*k)*GW+x+dx*k);}}
  kill.forEach(i=>{if(b[i].germ){g.score+=100*lvl;}const pr=b[i].pair;if(pr!==undefined&&b[pr])delete b[pr].pair;b[i]=null;});if(kill.size){S('score');A.burst(OX+GW*CS/2,OY+GH*CS/2,K.w,kill.size*2);}return kill.size>0;};
 const gravity=()=>{let moved=false;for(let y=GH-2;y>=0;y--)for(let x=0;x<GW;x++){const i=y*GW+x,c=b[i];if(!c||c.germ)continue;if(c.pair!==undefined){const j=c.pair;if(j===i+1||j===i-1){const ox=j-i;if(!b[i+GW]&&!b[j+GW]&&y<GH-1&&ox===1){b[i+GW]=c;b[j+GW]=b[j];b[i]=null;b[j]=null;c.pair=j+GW;b[j+GW].pair=i+GW;moved=true;}continue;}if(j===i-GW){if(!b[i+GW]){b[i+GW]=c;b[j+GW]=b[j];b[j]=null;c.pair=j+GW;b[i].pair=i+GW;moved=true;}continue;}}if(!b[i+GW]){b[i+GW]=c;b[i]=null;moved=true;}}return moved;};
 gen();g._t=()=>({get b(){return b;},set b(v){b=v;},set pc(v){pc=v;},get pc(){return pc;}});
 g.update=()=>{if(g.over)return;if(clearing>0){clearing--;if(clearing===0){if(gravity())clearing=6;else if(clear())clearing=10;else{if(!b.some(c=>c&&c.germ)){g.score+=1000;S('win');A.confetti();if(lvl>=5)g.over='ALL CURED! WIN';else gen();}else spawn();}}return;}
  const h=A.hit(0);const tryM=(dx,dy,dr)=>{const n={...pc,x:pc.x+dx,y:pc.y+dy,r:(pc.r+dr)%4};if(fits(n)){pc=n;return true;}return false;};if(h.l)tryM(-1,0,0);if(h.r)tryM(1,0,0);if(h.a){if(!tryM(0,0,1))tryM(-1,0,1);S('blip');}
  if(++drop>=(A.in(0).d?2:Math.max(8,30-lvl*3))){drop=0;if(!tryM(0,1,0)){const cs=cells(pc);const i0=cs[0][1]*GW+cs[0][0],i1=cs[1][1]*GW+cs[1][0];b[i0]={c:cs[0][2],pair:i1};b[i1]={c:cs[1][2],pair:i0};S('hit');clearing=clear()?10:1;if(!clearing)spawn();}}};
 g.draw=()=>{A.cls('#1a1238');R(OX-4,OY-4,GW*CS+8,GH*CS+8,'#d8e8f8');R(OX,OY,GW*CS,GH*CS,'#0a0a1a');b.forEach((c,i)=>{if(!c)return;const x=OX+(i%GW)*CS,y=OY+((i/GW)|0)*CS;if(c.germ){C(x+6,y+6,5,PC[c.c]);R(x+3,y+4,2,2,K.k);R(x+7,y+4,2,2,K.k);}else{R(x+1,y+1,CS-2,CS-2,PC[c.c]);R(x+2,y+2,3,2,'rgba(255,255,255,.5)');}});
  if(!clearing&&pc)cells(pc).forEach(([x,y,c])=>{if(y>=0){R(OX+x*CS+1,OY+y*CS+1,CS-2,CS-2,PC[c]);R(OX+x*CS+2,OY+y*CS+2,3,2,'rgba(255,255,255,.5)');}});T('LEVEL '+lvl+'/5',50,40,K.w,1,'c');T('GERMS',50,70,K.w,1,'c');T(b.filter(c=>c&&c.germ).length,50,82,K.r,2,'c');T('SCORE',270,40,K.w,1,'c');T(g.score,270,52,K.y,1,'c');};
 return g;}});

/* ---- BLOB DROP (Puyo-style) ---- */
A.add({id:'blobdrop',name:'BLOB DROP',cat:'PUZZLE',how:'MOVE, A ROTATES, DOWN DROPS. CONNECT 4 OF A COLOUR TO POP. CHAIN THEM.',make(){
 const g={over:null,score:0},GW=6,GH=12,CS=15,OX=115,OY=24,PC=[K.r,K.g,K.b,K.y];let b=Array(GW*GH).fill(-1),pc,drop=0,busy=0,chain=0;
 const spawn=()=>{pc={x:2,y:1,r:0,a:ri(4),b:ri(4)};if(b[2+GW]>=0)g.over='STACKED OUT';};spawn();const off=r=>[[0,-1],[1,0],[0,1],[-1,0]][r];
 const cells=p=>{const o=off(p.r);return[[p.x,p.y,p.a],[p.x+o[0],p.y+o[1],p.b]];};const free=(x,y)=>x>=0&&x<GW&&y<GH&&(y<0||b[y*GW+x]<0);const fits=p=>cells(p).every(([x,y])=>free(x,y));
 const settle=()=>{let m=false;for(let x=0;x<GW;x++){let w=GH-1;for(let y=GH-1;y>=0;y--){const v=b[y*GW+x];if(v>=0){if(w!==y){b[w*GW+x]=v;b[y*GW+x]=-1;m=true;}w--;}}}return m;};
 const pop=()=>{const seen=new Set(),kill=[];for(let i=0;i<GW*GH;i++){if(b[i]<0||seen.has(i))continue;const grp=[],st=[i];while(st.length){const j=st.pop();if(seen.has(j)||b[j]!==b[i])continue;seen.add(j);grp.push(j);const x=j%GW,y=(j/GW)|0;if(x>0)st.push(j-1);if(x<GW-1)st.push(j+1);if(y>0)st.push(j-GW);if(y<GH-1)st.push(j+GW);}if(grp.length>=4)kill.push(...grp);}if(kill.length){chain++;g.score+=kill.length*10*chain*chain;kill.forEach(i=>{A.burst(OX+(i%GW)*CS+7,OY+((i/GW)|0)*CS+7,PC[b[i]],3);b[i]=-1;});S(chain>1?'score':'coin');}return kill.length>0;};
 g.update=()=>{if(g.over)return;if(busy>0){if(--busy===0){if(settle())busy=6;else if(pop())busy=14;else{chain=0;spawn();}}return;}const h=A.hit(0);const tr=n=>{if(fits(n)){pc=n;return true;}return false;};if(h.l)tr({...pc,x:pc.x-1});if(h.r)tr({...pc,x:pc.x+1});if(h.a){const n={...pc,r:(pc.r+1)%4};if(!tr(n)&&!tr({...n,x:n.x-1}))tr({...n,x:n.x+1});S('blip');}
  if(++drop>=(A.in(0).d?2:26)){drop=0;if(!tr({...pc,y:pc.y+1})){cells(pc).forEach(([x,y,c])=>{if(y>=0)b[y*GW+x]=c;});S('hit');busy=4;}}};
 const blob=(x,y,c)=>{C(x+7,y+7,7,PC[c]);C(x+5,y+5,2,'rgba(255,255,255,.7)');R(x+4,y+7,2,2,K.k);R(x+8,y+7,2,2,K.k);};
 g.draw=()=>{A.cls('#241a4d');R(OX-3,OY-3,GW*CS+6,GH*CS+6,'#8a7ab8');R(OX,OY,GW*CS,GH*CS,'#120a24');for(let i=0;i<GW*GH;i++)if(b[i]>=0)blob(OX+(i%GW)*CS,OY+((i/GW)|0)*CS,b[i]);if(!busy&&pc)cells(pc).forEach(([x,y,c])=>{if(y>=0)blob(OX+x*CS,OY+y*CS,c);});T('SCORE',60,40,K.w,1,'c');T(g.score,60,52,K.y,1,'c');if(chain>1)T(chain+' CHAIN!',60,90,K.p,2,'c');};
 return g;}});

/* ---- JEWEL COLUMNS ---- */
A.add({id:'columns',name:'JEWEL COLUMNS',cat:'PUZZLE',how:'LEFT/RIGHT MOVE, A CYCLES THE 3 JEWELS, DOWN DROPS. 3 IN A ROW (ANY DIRECTION) CLEAR.',make(){
 const g={over:null,score:0},GW=6,GH=13,CS=14,OX=118,OY=22,JC=[K.r,K.y,K.b,K.g,K.p,K.o];let b=Array(GW*GH).fill(-1),pc,drop=0,busy=0,chain=0,lvl=1,cleared=0;
 const spawn=()=>{pc={x:2,y:-2,j:[ri(5),ri(5),ri(5)]};if(b[2]>=0)g.over='COLUMN FULL';};spawn();const free=(x,y)=>x>=0&&x<GW&&y<GH&&(y<0||b[y*GW+x]<0);
 const settle=()=>{let m=false;for(let x=0;x<GW;x++){let w=GH-1;for(let y=GH-1;y>=0;y--){const v=b[y*GW+x];if(v>=0){if(w!==y){b[w*GW+x]=v;b[y*GW+x]=-1;m=true;}w--;}}}return m;};
 const match=()=>{const kill=new Set();for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const v=b[y*GW+x];if(v<0)continue;for(const[dx,dy]of[[1,0],[0,1],[1,1],[1,-1]]){let n=1;while(x+dx*n>=0&&x+dx*n<GW&&y+dy*n>=0&&y+dy*n<GH&&b[(y+dy*n)*GW+x+dx*n]===v)n++;if(n>=3)for(let k=0;k<n;k++)kill.add((y+dy*k)*GW+x+dx*k);}}if(kill.size){chain++;g.score+=kill.size*10*chain*lvl;cleared+=kill.size;kill.forEach(i=>{A.burst(OX+(i%GW)*CS+7,OY+((i/GW)|0)*CS+7,JC[b[i]],3);b[i]=-1;});S('score');if(cleared>=30*lvl)lvl++;}return kill.size>0;};
 g.update=()=>{if(g.over)return;if(busy>0){if(--busy===0){if(settle())busy=5;else if(match())busy=12;else{chain=0;spawn();}}return;}const h=A.hit(0);if(h.l&&free(pc.x-1,pc.y+2))pc.x--;if(h.r&&free(pc.x+1,pc.y+2))pc.x++;if(h.a){pc.j.unshift(pc.j.pop());S('blip');}
  if(++drop>=(A.in(0).d?2:Math.max(6,28-lvl*3))){drop=0;if(free(pc.x,pc.y+3))pc.y++;else{if(pc.y<0){g.over='COLUMN FULL';return;}pc.j.forEach((j,k)=>b[(pc.y+k)*GW+pc.x]=j);S('hit');busy=3;}}};
 const gem=(x,y,c)=>{A.poly([[x+7,y+1],[x+13,y+7],[x+7,y+13],[x+1,y+7]],JC[c],1);A.poly([[x+7,y+3],[x+10,y+6],[x+7,y+6]],'rgba(255,255,255,.6)',1);};
 g.draw=()=>{A.cls('#1a0f2e');R(OX-3,OY-3,GW*CS+6,GH*CS+6,'#c8a040');R(OX,OY,GW*CS,GH*CS,'#0a0614');for(let i=0;i<GW*GH;i++)if(b[i]>=0)gem(OX+(i%GW)*CS,OY+((i/GW)|0)*CS,b[i]);if(!busy&&pc)pc.j.forEach((j,k)=>{if(pc.y+k>=0)gem(OX+pc.x*CS,OY+(pc.y+k)*CS,j);});T('SCORE',60,40,K.w,1,'c');T(g.score,60,52,K.y,1,'c');T('LEVEL '+lvl,60,80,K.w,1,'c');if(chain>1)T('CHAIN X'+chain,60,110,K.p,1,'c');};
 return g;}});

/* ---- PAPER ROUTE (Paperboy-style) ---- */
A.add({id:'paperroute',name:'PAPER ROUTE',cat:'CLASSICS',how:'UP/DOWN STEER. A THROWS PAPERS AT GREEN MAILBOXES. DODGE CARS AND DOGS.',make(){
 const g={over:null,score:0};let y=150,d=0,papers=30,thrown=[],houses=[],haz=[],lives=3,inv=0,nh=40,nz=120;
 g.update=()=>{d+=2.2;if(inv)inv--;y=cl(y+ay(A.in(0))*2,110,210);if(A.hit(0).a&&papers>0){papers--;thrown.push({x:60,y,vx:2,vy:-2.8});S('shoot');}
  if((nh-=2.2)<=0){nh=60;houses.push({x:W+30,sub:Math.random()<.65,hit:false});}if((nz-=2.2)<=0){nz=70+rnd(90);haz.push({x:W+20,y:115+rnd(95),k:ri(3),v:ri(3)===0?-.8:0});}
  houses.forEach(h=>h.x-=2.2);haz.forEach(z=>{z.x-=2.2;z.y+=z.v;});thrown.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;});
  thrown=thrown.filter(p=>{for(const h of houses)if(!h.hit&&Math.abs(p.x-(h.x+26))<8&&p.y<96){h.hit=true;if(h.sub){g.score+=100;S('coin');A.burst(h.x+26,92,K.g,8);}else{g.score=Math.max(0,g.score-50);S('lose');}return false;}return p.y<110||p.vy<0;});
  for(const z of haz)if(inv===0&&Math.abs(z.x-60)<12&&Math.abs(z.y-y)<10){lives--;inv=80;S('boom');A.shake=6;if(lives<=0){g.over='CRASHED THE BIKE';return;}}houses=houses.filter(h=>h.x>-60);haz=haz.filter(z=>z.x>-20);if(papers===0&&!thrown.length)g.over='ROUTE DONE';if(A.t%30===0)g.score++;};
 g.draw=()=>{A.cls('#6aa84a');R(0,104,W,4,'#c8c8c8');R(0,108,W,112,'#5a5a64');for(let x=-(d%40);x<W;x+=40)R(x,160,20,2,K.y);houses.forEach(h=>{R(h.x,40,52,50,h.sub?'#c4a080':'#8a8a98');A.poly([[h.x-4,40],[h.x+26,18],[h.x+56,40]],h.sub?'#a04a3a':'#5a5a6a',1);R(h.x+20,64,12,26,'#5b3a1e');R(h.x+24,90,4,14,'#333');R(h.x+20,86,12,6,h.sub?K.g:K.r);if(h.hit)R(h.x+22,82,8,3,K.w);});
  haz.forEach(z=>{if(z.k===0){R(z.x-12,z.y-6,24,12,K.r);R(z.x-8,z.y-4,8,8,'#9fd8ff');}else if(z.k===1)E('🐕',z.x,z.y,16);else R(z.x-8,z.y-3,16,6,'#222');});thrown.forEach(p=>R(p.x-3,p.y-2,6,4,K.w));
  if(inv%8<5){R(52,y+2,16,2,'#222');C(52,y+6,4,'#222');C(68,y+6,4,'#222');A.person(60,y+2,{c:K.b,cap:K.r,st:d*.2,s:.6,id:2});}T('SCORE '+g.score,6,6,K.w,1);T('PAPERS '+papers,160,6,K.y,1,'c');T('LIVES '+lives,W-6,6,K.w,1,'r');};
 return g;}});

/* ---- SODA SLIDE (Tapper-style) ---- */
A.add({id:'sodaslide',name:'SODA SLIDE',cat:'CLASSICS',how:'UP/DOWN CHANGE COUNTER. A SLIDES A DRINK. CATCH EMPTY CUPS. DON\'T LET CUSTOMERS REACH YOU.',make(){
 const g={over:null,score:0};let lane=0,cust=[],drinks=[],empties=[],lives=3,t=0,lvl=1,served=0;const LY=[60,110,160,210];
 const miss=()=>{lives--;S('boom');A.shake=5;if(lives<=0)g.over='BAR CLOSED';};
 g.update=()=>{t++;const h=A.hit(0);if(h.u)lane=(lane+3)%4;if(h.d)lane=(lane+1)%4;if(h.a){drinks.push({l:lane,x:270});S('shoot');}if(t%Math.max(40,130-lvl*12)===0)cust.push({l:ri(4),x:10,back:0});
  cust.forEach(c=>{if(c.back>0){c.x-=2;c.back--;if(c.back===0)empties.push({l:c.l,x:c.x});}else c.x+=.25+lvl*.05;});drinks.forEach(d=>d.x-=3.5);empties.forEach(e=>e.x+=1.5);
  for(const d of drinks){const c=cust.filter(c=>c.l===d.l&&c.back===0).sort((a,b)=>b.x-a.x)[0];if(c&&d.x<c.x+10){d.done=1;c.back=40;served++;g.score+=50;S('coin');if(served%12===0)lvl++;}else if(d.x<0){d.done=1;miss();}}for(const e of empties){if(e.x>=268){e.done=1;if(e.l===lane){g.score+=20;S('hit');}else miss();}}for(const c of cust)if(c.x>=262&&c.back===0){c.gone=1;miss();}
  cust=cust.filter(c=>!c.gone&&c.x>0);drinks=drinks.filter(d=>!d.done);empties=empties.filter(e=>!e.done);};
 g.draw=()=>{A.cls('#3a2418');LY.forEach((y,i)=>{R(0,y,280,8,'#8a5c33');R(0,y+8,280,4,'#5b3a1e');R(282,y-18,30,30,'#6a6a78');});cust.forEach(c=>A.person(c.x,LY[c.l],{c:[K.p,K.o,K.g,K.y][c.l],s:.7,id:c.l+2,st:c.back?0:A.t*.2}));drinks.forEach(d=>E('🥤',d.x,LY[d.l]-6,12));empties.forEach(e=>R(e.x-3,LY[e.l]-8,6,8,'#c8e8ff'));
  A.person(292,LY[lane]+8,{c:K.w,pants:'#222',s:.8,id:6});T('SCORE '+g.score,6,6,K.y,1);T('LIVES '+lives,W-6,6,K.w,1,'r');T('LEVEL '+lvl,160,6,K.w,1,'c');};
 return g;}});

/* ---- BOULDER DIG (Boulder Dash-style) ---- */
A.add({id:'boulderdig',name:'BOULDER DIG',cat:'CLASSICS',how:'DIG, COLLECT GEMS, THEN REACH THE EXIT. DON\'T GET CRUSHED BY BOULDERS.',make(){
 const g={over:null,score:0},GW=20,GH=13,CS=16;let m,p,need,got,mvT=0,lvl=0,tick=0,time;
 const gen=()=>{lvl++;m=[];for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const edge=x===0||y===0||x===GW-1||y===GH-1;m.push(edge?'#':Math.random()<.12+lvl*.02?'o':Math.random()<.08?'*':Math.random()<.06?' ':'.');}p={x:1,y:1};m[GW+1]=' ';m[GW+2]='.';m[2*GW+1]='.';m[(GH-2)*GW+GW-2]='E';need=Math.min(m.filter(c=>c==='*').length,6+lvl*2);got=0;time=150*60;};gen();
 const at=(x,y)=>m[y*GW+x],set=(x,y,v)=>m[y*GW+x]=v;
 g.update=()=>{time--;if(time<=0){g.over='OUT OF TIME';return;}const k=A.in(0);if(mvT>0)mvT--;else{const dx=ax(k),dy=dx?0:ay(k);if(dx||dy){const nx=p.x+dx,ny=p.y+dy,c=at(nx,ny);if(c==='.'||c===' '||c==='*'){if(c==='*'){got++;g.score+=10;S('coin');}set(nx,ny,' ');p.x=nx;p.y=ny;mvT=5;}else if(c==='o'&&dy===0&&at(nx+dx,ny)===' '){set(nx+dx,ny,'o');set(nx,ny,' ');p.x=nx;mvT=8;S('hit');}else if(c==='E'&&got>=need){g.score+=Math.ceil(time/60)*2+200;S('win');A.confetti();if(lvl>=5)g.over='ALL CAVES CLEARED! WIN';else gen();return;}}}
  if(++tick%8===0){for(let y=GH-2;y>=1;y--)for(let x=1;x<GW-1;x++){const c=at(x,y);if(c!=='o'&&c!=='*'&&c!=='O'&&c!=='S')continue;const fallingNow=c==='O'||c==='S',base=c==='O'||c==='o'?'o':'*';const below=at(x,y+1);
   if(below===' '&&!(p.x===x&&p.y===y+1)){set(x,y+1,base==='o'?'O':'S');set(x,y,' ');}else if(p.x===x&&p.y===y+1&&fallingNow){g.over='CRUSHED';S('boom');A.shake=10;return;}else if((below==='o'||below==='*')&&!fallingNow){for(const dx of[-1,1])if(at(x+dx,y)===' '&&at(x+dx,y+1)===' '&&!(p.x===x+dx&&(p.y===y||p.y===y+1))){set(x+dx,y,base==='o'?'O':'S');set(x,y,' ');break;}}else if(fallingNow)set(x,y,base);}}};
 g.draw=()=>{A.cls('#000000');const ox=cl(p.x*CS-160,0,GW*CS-W),oy=cl(p.y*CS-120,-20,GH*CS-H+20);for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=at(x,y),sx=x*CS-ox,sy=y*CS-oy;if(sx<-CS||sx>W||sy<-CS||sy>H)continue;
  if(c==='#')R(sx,sy,CS,CS,'#6a6a78');else if(c==='.'){R(sx,sy,CS,CS,'#6a4020');R(sx+3,sy+4,2,2,'#8a5a30');R(sx+10,sy+9,2,2,'#8a5a30');}else if(c==='o'||c==='O')C(sx+8,sy+8,7,'#8a8a98');else if(c==='*'||c==='S')E('💎',sx+8,sy+8,13);else if(c==='E'){R(sx,sy,CS,CS,got>=need&&A.t%20<10?K.g:'#2a5a2a');}}
  A.person(p.x*CS-ox+8,p.y*CS-oy+16,{c:K.o,cap:K.y,s:.5,id:4,st:A.t*.3});R(0,0,W,12,'rgba(0,0,0,.7)');T('GEMS '+got+'/'+need,6,3,got>=need?K.g:K.y,1);T('CAVE '+lvl+'/5',160,3,K.w,1,'c');T(Math.ceil(time/60),W-6,3,K.w,1,'r');};
 return g;}});

/* ---- GOLD DIGGER (Lode Runner-style) ---- */
const LR=['                    ','  $     H    $      ','#####   H  ######## ','        H         H ','   $    H   $     H ','  ######H########-H-','        H         H ','  $     H    $    H ','#########H##########','         H          ','  $  E   H    $  E  ','####################'];
A.add({id:'golddigger',name:'GOLD DIGGER',cat:'CLASSICS',how:'ARROWS RUN AND CLIMB. A DIGS LEFT, B DIGS RIGHT. TRAP GUARDS IN HOLES. GRAB ALL GOLD.',make(){
 const g={over:null,score:0},GW=20,GH=12,CS=16,OY=48;let m,p,guards,holes=[],gold,mvT=0,lives=3;
 const load=()=>{m=LR.map(r=>r.padEnd(GW).split(''));guards=[];m.forEach((r,y)=>r.forEach((c,x)=>{if(c==='E'){guards.push({x,y,mv:0,stuck:0});r[x]=' ';}}));p={x:1,y:1};gold=m.flat().filter(c=>c==='$').length;holes=[];};load();
 const at=(x,y)=>x<0||x>=GW||y<0||y>=GH?'#':m[y][x];const solid=(x,y)=>{const c=at(x,y);return c==='#'&&!holes.some(h=>h.x===x&&h.y===y);};const standable=(x,y)=>solid(x,y+1)||at(x,y+1)==='H'||at(x,y)==='H'||at(x,y)==='-'||guards.some(gd=>gd.stuck&&gd.x===x&&gd.y===y+1);
 const step=(e,dx,dy)=>{const nx=e.x+dx,ny=e.y+dy;if(solid(nx,ny))return false;if(dy<0&&at(e.x,e.y)!=='H')return false;e.x=nx;e.y=ny;return true;};
 g.update=()=>{holes.forEach(h=>h.t--);holes=holes.filter(h=>{if(h.t<=0){if(p.x===h.x&&p.y===h.y){die();}guards.forEach(gd=>{if(gd.x===h.x&&gd.y===h.y){gd.x=1+ri(18);gd.y=1;gd.stuck=0;g.score+=75;}});return false;}return true;});
  if(mvT>0)mvT--;else{const k=A.in(0),h=A.hit(0);if(!standable(p.x,p.y)){p.y++;mvT=3;}else{if(h.a&&solid(p.x-1,p.y+1)&&at(p.x-1,p.y)===' '){holes.push({x:p.x-1,y:p.y+1,t:300});S('hit');}else if(h.b&&solid(p.x+1,p.y+1)&&at(p.x+1,p.y)===' '){holes.push({x:p.x+1,y:p.y+1,t:300});S('hit');}else if(k.l)step(p,-1,0),mvT=5;else if(k.r)step(p,1,0),mvT=5;else if(k.u&&at(p.x,p.y)==='H')step(p,0,-1),mvT=5;else if(k.d&&(at(p.x,p.y+1)==='H'||!solid(p.x,p.y+1)))step(p,0,1),mvT=5;}
   if(at(p.x,p.y)==='$'){m[p.y][p.x]=' ';gold--;g.score+=100;S('coin');if(gold===0){for(let y=0;y<GH;y++)if(m[y][9]===' '||m[y][9]==='#')m[y][9]='H';}}if(gold===0&&p.y===0){g.score+=1000;S('win');A.confetti();g.over='ALL GOLD ESCAPED! WIN';}}
  for(const gd of guards){if(gd.stuck){if(--gd.stuck===0)gd.y--;continue;}if(++gd.mv<14)continue;gd.mv=0;if(holes.some(h=>h.x===gd.x&&h.y===gd.y)){gd.stuck=180;continue;}if(!standable(gd.x,gd.y)){gd.y++;continue;}if(gd.y>p.y&&at(gd.x,gd.y)==='H')step(gd,0,-1);else if(gd.y<p.y&&(at(gd.x,gd.y+1)==='H'||!solid(gd.x,gd.y+1)))step(gd,0,1);else step(gd,Math.sign(p.x-gd.x)||1,0);if(gd.x===p.x&&gd.y===p.y)die();}};
 const die=()=>{lives--;S('boom');A.shake=6;if(lives<=0){g.over='CAUGHT';return;}const s=g.score;load();g.score=s;};
 g.draw=()=>{A.cls('#0a0a1a');for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const c=m[y][x],sx=x*CS,sy=OY+y*CS-40;const hole=holes.find(h=>h.x===x&&h.y===y);if(c==='#'&&!hole){R(sx,sy,CS,CS,'#a0503a');R(sx,sy+7,CS,1,'#6a2a1a');R(sx+7,sy,1,7,'#6a2a1a');}if(c==='H'){R(sx+2,sy,2,CS,'#c8c8d8');R(sx+12,sy,2,CS,'#c8c8d8');for(let k=2;k<CS;k+=5)R(sx+2,sy+k,12,1,'#c8c8d8');}if(c==='-')R(sx,sy+2,CS,2,'#c8c8d8');if(c==='$')E('💰',sx+8,sy+8,12);}
  guards.forEach(gd=>A.person(gd.x*CS+8,OY+gd.y*CS-40+CS,{c:K.r,s:.5,id:3,st:A.t*.2}));A.person(p.x*CS+8,OY+p.y*CS-40+CS,{c:K.c,s:.5,id:1,st:A.t*.3});T('GOLD LEFT '+gold,6,210,K.y,1);T('LIVES '+lives,W-6,210,K.w,1,'r');if(gold===0)T('LADDER UP APPEARED - CLIMB TO THE TOP',160,222,K.g,1,'c');};
 return g;}});

/* ---- BOMB CATCHER (Kaboom-style) ---- */
A.add({id:'bombcatch',name:'BOMB CATCHER',cat:'CLASSICS',how:'LEFT/RIGHT MOVE THE BUCKETS. CATCH EVERY BOMB THE BOMBER DROPS. EACH MISS COSTS A BUCKET.',make(){
 const g={over:null,score:0};let x=160,bx=160,bv=2,bombs=[],buckets=3,t=0,wave=1,dropped=0;
 g.update=()=>{t++;x=cl(x+ax(A.in(0))*5,20,W-20);if(A.mouse.t>0)x=cl(A.mouse.x,20,W-20);bx+=bv;if(bx<30||bx>W-30||Math.random()<.02+wave*.004)bv=-bv*(1+rnd(.1));bv=cl(bv,-2-wave*.6,2+wave*.6);
  if(t%Math.max(10,34-wave*3)===0){bombs.push({x:bx,y:44,v:1.2+wave*.25});dropped++;if(dropped>=20+wave*5){wave++;dropped=0;S('win');}}
  for(const b of bombs){b.y+=b.v;for(let k=0;k<buckets;k++){const by=190+k*12;if(Math.abs(b.y-by)<5&&Math.abs(b.x-x)<18){b.caught=1;g.score+=wave;S('coin');A.burst(b.x,by,K.c,4);break;}}if(b.y>H&&!b.caught){buckets--;S('boom');A.shake=8;bombs.forEach(q=>q.caught=1);if(buckets<=0){g.over='OUT OF BUCKETS';return;}break;}}bombs=bombs.filter(b=>!b.caught&&b.y<H+10);};
 g.draw=()=>{A.cls('#1a4a6a');R(0,0,W,40,'#0a2a3a');A.person(bx,40,{c:'#222222',pants:'#222',cap:'#111',s:.9,id:0,st:A.t*.3});bombs.forEach(b=>{C(b.x,b.y,5,'#1a1a1a');R(b.x-1,b.y-8,2,3,K.o);if(A.t%6<3)C(b.x,b.y-9,1.5,K.y);});
  for(let k=0;k<buckets;k++){const by=190+k*12;A.poly([[x-16,by-4],[x+16,by-4],[x+12,by+6],[x-12,by+6]],'#3a8ad8',1);R(x-16,by-5,32,2,'#8ac8ff');}T('SCORE '+g.score,6,6,K.y,1);T('WAVE '+wave,W-6,6,K.w,1,'r');};
 return g;}});
})();
