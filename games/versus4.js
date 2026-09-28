(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const mv=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};

A.add({id:'hex',name:'HEX',cat:'BOARD',vs:1,how:'P1 JOINS LEFT TO RIGHT, P2 TOP TO BOTTOM. A PLACES A STONE. NO DRAWS.',make(){
 const g={over:null,score:0},N=9;let b=Array(N*N).fill(0),p=0,c={x:4,y:4},think=0;const nb=i=>{const x=i%N,y=(i/N)|0;return[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]].map(d=>[x+d[0],y+d[1]]).filter(q=>q[0]>=0&&q[1]>=0&&q[0]<N&&q[1]<N).map(q=>q[1]*N+q[0]);};
 const dist=(pl)=>{const D=Array(N*N).fill(1e9),dq=[];for(let k=0;k<N;k++){const i=pl===1?k*N:k;if(b[i]===3-pl)continue;D[i]=b[i]===pl?0:1;dq.push(i);}while(dq.length){dq.sort((a,c)=>D[a]-D[c]);const cur=dq.shift();for(const n of nb(cur)){if(b[n]===3-pl)continue;const w=D[cur]+(b[n]===pl?0:1);if(w<D[n]){D[n]=w;dq.push(n);}}}let m=1e9;for(let k=0;k<N;k++){const i=pl===1?k*N+N-1:(N-1)*N+k;m=Math.min(m,D[i]);}return m;};
 const play=i=>{b[i]=p+1;S('hit');if(dist(p+1)===0){g.over=A.win(p);return;}p=1-p;think=0;};
 g.update=()=>{if(A.cpu&&p===1){if(++think>30){let best=1e9,mv_=-1;const cand=[...Array(N*N).keys()].filter(i=>!b[i]);const pool=A.lvl===0?cand.filter(()=>Math.random()<.4):cand;for(const i of (pool.length?pool:cand)){b[i]=2;const s=dist(2)-dist(1)*(A.lvl?1:.5)+rnd(.4);b[i]=0;if(s<best){best=s;mv_=i;}}play(mv_);}return;}const h=A.hit(human(p));mv(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(!b[i])play(i);else S('lose');}};
 g.draw=()=>{A.cls('#140a2a');const hx=(i)=>[48+(i%N)*20+((i/N)|0)*10,40+((i/N)|0)*18];R(30,34,4,170,K.c);R(292,34,4,170,K.c);R(40,26,190,4,K.p);R(128,206,190,4,K.p);for(let i=0;i<N*N;i++){const[x,y]=hx(i);C(x,y,9,b[i]===1?K.c:b[i]===2?K.p:'#2b2257');}if(!g.over&&!(A.cpu&&p===1)){const[x,y]=hx(c.y*N+c.x);A.ring(x,y,10,K.y);}A.hud2('','');T(A.nm(p)+(p?' TOP-BOTTOM':' LEFT-RIGHT'),160,6,p?K.p:K.c,1,'c');};
 return g;}});

A.add({id:'uttt',name:'ULTIMATE TTT',cat:'BOARD',vs:1,how:'9 SMALL BOARDS. YOUR SQUARE CHOOSES YOUR RIVAL\'S NEXT BOARD. WIN 3 BOARDS IN A ROW.',make(){
 const g={over:null,score:0},LN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];let b=Array(81).fill(0),big=Array(9).fill(0),p=0,next=-1,c={x:4,y:4},think=0;
 const win=(arr,v)=>LN.some(l=>l.every(i=>arr[i]===v));const legal=()=>{const out=[];for(let i=0;i<81;i++){const bb=(i/9|0);if(!b[i]&&!big[bb]&&(next<0||next===bb))out.push(i);}return out;};const idx=(x,y)=>((y/3|0)*3+(x/3|0))*9+(y%3)*3+(x%3);
 const play=i=>{b[i]=p+1;S('hit');const bb=i/9|0,sub=b.slice(bb*9,bb*9+9);if(win(sub,p+1)){big[bb]=p+1;S('score');A.burst(0,0,K.y,1);}else if(sub.every(v=>v))big[bb]=3;if(win(big,p+1)){g.over=A.win(p);return;}const cell=i%9;next=big[cell]?-1:cell;p=1-p;think=0;if(!legal().length)g.over='DRAW!';};
 g.update=()=>{if(A.cpu&&p===1){if(++think>25){const L_=legal();let best=-1e9,m=L_[0];for(const i of L_){b[i]=2;const bb=i/9|0,sub=b.slice(bb*9,bb*9+9);let s=win(sub,2)?10:0;b[i]=1;if(win(b.slice(bb*9,bb*9+9),1))s+=6;b[i]=0;const nx=i%9;if(!big[nx]){const nsub=b.slice(nx*9,nx*9+9);if(LN.some(l=>l.filter(j=>nsub[j]===1).length===2&&l.some(j=>!nsub[j])))s-=5*A.ai;}s+=rnd(A.lvl===0?8:1);if(s>best){best=s;m=i;}}play(m);}return;}
  const h=A.hit(human(p));mv(h,c,9,9);if(h.a){const i=idx(c.x,c.y);if(legal().includes(i))play(i);else S('lose');}};
 g.draw=()=>{A.cls('#140a2a');const CS=22,OX=61,OY=22;for(let bb=0;bb<9;bb++){const bx=OX+(bb%3)*CS*3,by=OY+((bb/3)|0)*CS*3;R(bx+1,by+1,CS*3-2,CS*3-2,(next===bb||next<0)&&!big[bb]&&!g.over?'#2b2257':'#1a1238');if(big[bb]===1||big[bb]===2){C(bx+CS*1.5,by+CS*1.5,28,big[bb]===1?'#178a7d':'#a0205a');}}
  for(let i=0;i<81;i++){const bb=i/9|0,cc=i%9,x=OX+(bb%3)*CS*3+(cc%3)*CS+CS/2,y=OY+((bb/3)|0)*CS*3+((cc/3)|0)*CS+CS/2;if(b[i]===1){L(x-6,y-6,x+6,y+6,K.c,2);L(x+6,y-6,x-6,y+6,K.c,2);}if(b[i]===2)A.ring(x,y,6,K.p);}
  for(let k=1;k<3;k++){R(OX+k*CS*3-1,OY,2,CS*9,K.y);R(OX,OY+k*CS*3-1,CS*9,2,K.y);}if(!g.over&&!(A.cpu&&p===1))A.box(OX+c.x*CS,OY+c.y*CS,CS,CS,K.w);A.hud2('','');T(A.nm(p)+' TO MOVE',160,6,p?K.p:K.c,1,'c');};
 return g;}});

A.add({id:'bumper',name:'BUMPER CARS',cat:'VERSUS',vs:1,how:'STEER AND RAM. KNOCK YOUR RIVAL INTO THE SPARKING WALL. FIRST TO 5.',make(){
 const g={over:null,score:0};let c,sc=[0,0],wait=40;const reset=()=>{c=[{x:90,y:120,a:0,v:0,vx:0,vy:0},{x:230,y:120,a:3.14,v:0,vx:0,vy:0}];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=c[1],o=c[0];const want=Math.atan2(o.y-q.y,o.x-q.x);let da=want-q.a;while(da>3.14)da-=6.28;while(da<-3.14)da+=6.28;const nearWall=q.x<50||q.x>270||q.y<60||q.y>200;A.bot({l:da<-.1,r:da>.1,u:!nearWall||Math.random()<.5,d:nearWall&&Math.random()<.3*A.ai});}
  for(let i=0;i<2;i++){const q=c[i],k=A.in(i);q.a+=ax(k)*.07;const th=-ay(k)*(i&&A.cpu?.12+.1*A.ai:.22);q.vx+=Math.cos(q.a)*th;q.vy+=Math.sin(q.a)*th;q.vx*=.96;q.vy*=.96;q.x+=q.vx;q.y+=q.vy;
   if(q.x<22||q.x>298||q.y<42||q.y>218){const w=1-i;sc[w]++;S('boom');A.burst(q.x,q.y,K.y,24,3);if(sc[w]>=5){g.over=A.win(w);return;}reset();return;}}
  const dx=c[1].x-c[0].x,dy=c[1].y-c[0].y,d=Math.hypot(dx,dy);if(d<20&&d>0){const nx=dx/d,ny=dy/d,rv=(c[1].vx-c[0].vx)*nx+(c[1].vy-c[0].vy)*ny;if(rv<0){c[0].vx+=rv*nx*1.2;c[0].vy+=rv*ny*1.2;c[1].vx-=rv*nx*1.2;c[1].vy-=rv*ny*1.2;S('hit');A.burst((c[0].x+c[1].x)/2,(c[0].y+c[1].y)/2,K.w,6,2);}const o=(20-d)/2;c[0].x-=nx*o;c[0].y-=ny*o;c[1].x+=nx*o;c[1].y+=ny*o;}};
 g.draw=()=>{A.cls('#2a2a38');R(20,40,280,180,'#3a3a4a');for(let x=20;x<300;x+=20)for(let y=40;y<220;y+=20)if((x+y)%40===20)R(x,y,20,20,'#404052');A.box(20,40,280,180,A.t%8<4?K.y:K.o);
  c.forEach((q,i)=>{A.c.save();A.c.translate(q.x,q.y);A.c.rotate(q.a);R(-12,-9,24,18,'#222222');R(-10,-8,20,16,i?K.p:K.c);C(-2,0,4,'#ffd9a8');R(8,-6,3,12,K.w);A.c.restore();R(q.x-1,q.y-24,2,12,'#888888');});A.hud2(sc[0],sc[1]);if(wait>0)T('BUMP!',160,120,K.y,3,'c');};
 return g;}});

A.add({id:'swordduel',name:'SWORD DUEL',cat:'VERSUS',vs:1,how:'UP/DOWN SETS YOUR GUARD HIGH OR LOW. A THRUSTS. HIT WHERE THEY DON\'T GUARD. FIRST TO 5.',make(){
 const g={over:null,score:0};let f,sc=[0,0],wait=40;const reset=()=>{f=[{x:110,g:0,th:0,cd:0},{x:210,g:0,th:0,cd:0}];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=f[1],o=f[0],d=q.x-o.x;const read=Math.random()<.4+A.ai*.4;A.bot({l:d>44,r:d<34,u:read?o.th>0&&o.g===-1||o.g===1&&Math.random()<.02:Math.random()<.02,d:read?o.th>0&&o.g===1:Math.random()<.02,a:d<48&&q.cd===0&&Math.random()<.05+.05*A.ai});}
  for(let i=0;i<2;i++){const q=f[i],k=A.in(i),h=A.hit(i),d=i?-1:1;if(h.u)q.g=-1;if(h.d)q.g=1;if(!k.u&&!k.d&&A.t%40===0)q.g=0;q.x=cl(q.x+ax(k)*1.8,20,300);if(q.cd>0)q.cd--;if(h.a&&q.cd===0){q.th=14;q.cd=30;S('shoot');}if(q.th>0){q.th--;if(q.th===7){const o=f[1-i];if(Math.abs(o.x-q.x)<52){const tgt=q.g;if(o.g===tgt&&tgt!==0||(tgt===0&&o.th===7)){S('hit');A.burst(q.x+d*30,150+tgt*14,K.w,8);q.x-=d*10;}else{sc[i]++;S('score');A.burst(o.x,150+tgt*14,K.r,16,3);if(sc[i]>=5){g.over=A.win(i);return;}reset();return;}}}}}
  if(f[0].x>f[1].x-24){const m=(f[0].x+f[1].x)/2;f[0].x=m-12;f[1].x=m+12;}};
 g.draw=()=>{A.cls('#3a2a18');R(0,190,W,50,'#5b3a1e');for(let i=0;i<W;i+=40)R(i,190,38,4,'#7a4a28');f.forEach((q,i)=>{const d=i?-1:1,c=i?K.p:K.c;R(q.x-6,150,12,30,c);C(q.x,144,6,'#ffd9a8');R(q.x-6,180,5,10,K.k);R(q.x+1,180,5,10,K.k);const sx=q.x+d*8,sy=160+q.g*14,len=24+(q.th>7?(14-q.th)*3:q.th*3);L(sx,sy,sx+d*len,sy-q.g*2,'#e8e8f8',2);R(sx-2,sy-3,4,6,K.y);});A.hud2(sc[0],sc[1]);T('GUARD: UP HIGH / DOWN LOW',160,224,K.gr,1,'c');};
 return g;}});

A.add({id:'heliduel',name:'HELI DUEL',cat:'VERSUS',vs:1,how:'FLY WITH ALL DIRECTIONS. A FIRES ROCKETS FORWARD. 5 HITS WINS.',make(){
 const g={over:null,score:0};let h,sh=[],sc=[0,0],wait=40;const reset=()=>{h=[{x:60,y:120,d:1,cd:0},{x:260,y:120,d:-1,cd:0}];sh=[];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=h[1],o=h[0],inc=sh.find(s=>s.o===0&&Math.abs(s.y-q.y)<14&&(q.x-s.x)*s.vx>0);A.bot({u:inc?q.y>120:q.y>o.y+3,d:inc?q.y<=120:q.y<o.y-3,l:q.x>200&&Math.abs(q.x-o.x)>90,r:q.x<260&&Math.abs(q.x-o.x)<70,a:Math.abs(q.y-o.y)<12&&q.cd===0&&Math.random()<.1+.1*A.ai});}
  for(let i=0;i<2;i++){const q=h[i],k=A.in(i);q.x=cl(q.x+ax(k)*2,20,300);q.y=cl(q.y+ay(k)*2,30,215);q.d=h[1-i].x>q.x?1:-1;if(q.cd>0)q.cd--;if(A.hit(i).a&&q.cd===0){q.cd=22;sh.push({x:q.x+q.d*14,y:q.y,vx:q.d*5,o:i});S('shoot');}}
  for(const s of sh){s.x+=s.vx;const o=h[1-s.o];if(Math.abs(s.x-o.x)<14&&Math.abs(s.y-o.y)<8){s.x=-99;sc[s.o]++;S('boom');A.burst(o.x,o.y,K.o,20,3);if(sc[s.o]>=5){g.over=A.win(s.o);return;}reset();return;}}sh=sh.filter(s=>s.x>0&&s.x<W);};
 g.draw=()=>{A.skyband('#1a2a6a','#ff9a5a',H);R(0,220,W,20,'#3a2a18');for(let i=0;i<6;i++)R(i*56,190-(i%3)*20,40,30+(i%3)*20,'#2a1a38');h.forEach((q,i)=>{const c=i?K.p:K.c;R(q.x-12,q.y-5,24,10,c);R(q.x-q.d*20,q.y-2,12,3,c);R(q.x+q.d*4,q.y-3,6,5,'#9fd8ff');R(q.x-16+(A.t%4)*2,q.y-9,32-(A.t%4)*4,2,K.w);R(q.x-8,q.y+5,16,2,'#333333');});sh.forEach(s=>{R(s.x-4,s.y-1,8,3,K.y);R(s.x-s.vx*1.5-2,s.y-1,3,3,K.o);});A.hud2(sc[0],sc[1]);};
 return g;}});

const SUITS=['H','D','C','S'],RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];const dk=()=>{const d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({s,r});for(let i=d.length-1;i>0;i--){const j=ri(i+1);[d[i],d[j]]=[d[j],d[i]];}return d;};
const card=(x,y,c,sc)=>{sc=sc||1;R(x,y,24*sc,32*sc,K.k);R(x+1,y+1,24*sc-2,32*sc-2,'#fff3d6');if(!c)return;const col=c.s<2?'#d02040':'#111111';T(RK[c.r],x+3,y+3,col,sc);T(SUITS[c.s],x+24*sc-8*sc,y+32*sc-9*sc,col,sc);};

A.add({id:'snap',name:'SNAP',cat:'CARDS',vs:1,how:'PRESS A WHEN THE TOP TWO CARDS MATCH. WRONG SNAPS COST A POINT. FIRST TO 10.',make(){
 const g={over:null,score:0};let d=dk(),pile=[],sc=[0,0],t=0,cpuAt=-1,msg='',mt=0;
 g.update=()=>{if(mt>0){mt--;return;}t++;if(t%Math.max(24,48-(sc[0]+sc[1])*2)===0){if(!d.length)d=dk();pile.push(d.pop());S('blip');const m=pile.length>1&&pile[pile.length-1].r===pile[pile.length-2].r;cpuAt=m?t+Math.round(30-A.ai*18+rnd(10)):(Math.random()<.04*(1-A.ai)?t+10:-1);}
  const match=pile.length>1&&pile[pile.length-1].r===pile[pile.length-2].r;if(A.cpu)A.bot({a:t===cpuAt});if(g.wt>0)g.wt--;for(let i=0;i<2;i++)if(A.hit(i).a){if(match){sc[i]++;msg=A.nm(i)+' SNAP!';S('score');A.burst(160,120,i?K.p:K.c,20,3);pile=[];mt=30;}else{sc[i]=Math.max(0,sc[i]-1);msg=A.nm(i)+' WRONG';S('lose');g.wt=30;}if(sc[i]>=10)g.over=A.win(i);break;}};
 g.draw=()=>{A.cls('#0f5a2a');pile.slice(-4).forEach((c_,i,a)=>card(120+i*6,70+i*4,c_,1.6));A.hud2(sc[0],sc[1]);if(mt||g.wt)T(msg,160,210,K.y,2,'c');};
 return g;}});

A.add({id:'war',name:'CARD WAR',cat:'CARDS',vs:1,how:'HIGHER CARD TAKES BOTH. TIES MEAN WAR. A FLIPS FASTER. MOST CARDS WINS.',make(){
 const g={over:null,score:0};let d=dk(),hands=[d.slice(0,26),d.slice(26)],table=[],cur=null,t=0,flips=0,msg='';
 const flip=()=>{if(!hands[0].length||!hands[1].length){g.over=A.win(hands[0].length>hands[1].length?0:1);return;}const a=hands[0].shift(),b=hands[1].shift();table.push(a,b);cur=[a,b];flips++;const va=(a.r+12)%13,vb=(b.r+12)%13;if(va===vb){msg='WAR!';S('boom');for(let i=0;i<2;i++)for(let k=0;k<2&&hands[i].length>1;k++)table.push(hands[i].shift());}else{const w=va>vb?0:1;hands[w].push(...table);table=[];msg=A.nm(w)+' TAKES';S(w?'lose':'coin');}if(flips>=26&&!table.length){const n=[hands[0].length,hands[1].length];g.over=n[0]===n[1]?'DRAW!':A.win(n[0]>n[1]?0:1);}};
 g.update=()=>{t++;if(A.hit(0).a||A.hit(1).a||t>70){t=0;flip();}};
 g.draw=()=>{A.cls('#0f5a2a');if(cur){card(90,70,cur[0],1.8);card(186,70,cur[1],1.8);}T(A.nm(0)+' '+hands[0].length,60,30,K.c,2,'c');T(hands[1].length+' '+A.nm(1),260,30,K.p,2,'c');T(msg,160,190,K.y,2,'c');T('FLIP '+flips+'/26',160,214,K.w,1,'c');};
 return g;}});

A.add({id:'raceduel',name:'RACE DUEL',cat:'VERSUS',vs:1,how:'TOP-DOWN RACE. UP GAS, LEFT/RIGHT STEER. FIRST TO 3 LAPS.',make(){
 const g={over:null,score:0},TR=[[60,60],[260,60],[280,120],[260,180],[60,180],[40,120]];let c=[{x:60,y:170,a:0,v:0,lap:0,cp:0},{x:60,y:190,a:0,v:0,lap:0,cp:0}];
 const onTrack=(x,y)=>{for(let i=0;i<TR.length;i++){const a=TR[i],b=TR[(i+1)%TR.length],dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=cl(((x-a[0])*dx+(y-a[1])*dy)/l,0,1);if(Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)<24)return true;}return false;};
 g.update=()=>{if(A.cpu){const q=c[1],tg=TR[(q.cp+1)%TR.length];const want=Math.atan2(tg[1]-q.y,tg[0]-q.x);let da=want-q.a;while(da>3.14)da-=6.28;while(da<-3.14)da+=6.28;A.bot({l:da<-.08,r:da>.08,u:Math.abs(da)<1||Math.random()<.5});}
  for(let i=0;i<2;i++){const q=c[i],k=A.in(i);q.a+=ax(k)*.06*Math.min(1,q.v/1.5);const mx=(i&&A.cpu?2.2+A.ai*.8:3)*(onTrack(q.x,q.y)?1:.45);q.v=cl(q.v+(k.u?.08:k.d?-.1:-.02),0,mx);q.x+=Math.cos(q.a)*q.v;q.y+=Math.sin(q.a)*q.v;q.x=cl(q.x,5,315);q.y=cl(q.y,25,235);
   const nx=TR[(q.cp+1)%TR.length];if(Math.hypot(q.x-nx[0],q.y-nx[1])<30){q.cp=(q.cp+1)%TR.length;if(q.cp===0){q.lap++;S('coin');if(q.lap>=3){g.over=A.win(i);return;}}}}
  const dx=c[1].x-c[0].x,dy=c[1].y-c[0].y,d=Math.hypot(dx,dy);if(d<10&&d>0){c[0].x-=dx/d*2;c[0].y-=dy/d*2;c[1].x+=dx/d*2;c[1].y+=dy/d*2;c[0].v*=.8;c[1].v*=.8;S('hit');}};
 g.draw=()=>{A.cls('#3f8a3a');A.c.strokeStyle='#44444e';A.c.lineWidth=48;A.c.lineJoin='round';A.c.beginPath();TR.forEach((p,i)=>i?A.c.lineTo(p[0],p[1]):A.c.moveTo(p[0],p[1]));A.c.closePath();A.c.stroke();A.c.strokeStyle='#ffffff';A.c.lineWidth=1;A.c.setLineDash&&A.c.setLineDash([6,6]);A.c.stroke();A.c.setLineDash&&A.c.setLineDash([]);for(let i=0;i<6;i++)R(48+i*4,160+(i%2)*4,4,4,i%2?K.k:K.w);
  c.forEach((q,i)=>{A.c.save();A.c.translate(q.x,q.y);A.c.rotate(q.a);R(-8,-5,16,10,i?K.p:K.c);R(2,-4,4,8,'#9fd8ff');A.c.restore();});T(A.nm(0)+' LAP '+Math.min(3,c[0].lap+1),6,4,K.c,1);T(A.nm(1)+' LAP '+Math.min(3,c[1].lap+1),W-6,4,K.p,1,'r');};
 return g;}});

A.add({id:'triplepong',name:'TRIPLE PONG',cat:'VERSUS',vs:1,how:'THREE BALLS AT ONCE. UP/DOWN MOVE. FIRST TO 11.',make(){
 const g={over:null,score:0};let p=[100,100],balls=[],sc=[0,0];const nb=d=>({x:160,y:60+rnd(120),vx:d*(2+rnd(1)),vy:rnd(2)-1});for(let i=0;i<3;i++)balls.push(nb(i%2?1:-1));
 g.update=()=>{if(A.cpu){const inc=balls.filter(b=>b.vx>0).sort((a,b)=>b.x-a.x)[0];const ty=inc?inc.y:120,c_=p[1]+20;A.bot({u:c_>ty+4,d:c_<ty-4});}for(let i=0;i<2;i++){p[i]=cl(p[i]+ay(A.in(i))*(i&&A.cpu?1.6+1.6*A.ai:3.4),24,H-44);}
  for(const b of balls){b.x+=b.vx;b.y+=b.vy;if(b.y<22||b.y>H-4){b.vy*=-1;b.y=cl(b.y,22,H-4);}for(let i=0;i<2;i++){const px=i?304:16;if((i?b.vx>0:b.vx<0)&&Math.abs(b.x-px)<5&&b.y>p[i]-3&&b.y<p[i]+43){b.vx=cl(-b.vx*1.05,-6,6);b.vy=(b.y-p[i]-20)/6;S('hit');}}if(b.x<-5||b.x>W+5){const w=b.x<0?1:0;sc[w]++;S('score');Object.assign(b,nb(w?-1:1));if(sc[w]>=11){g.over=A.win(w);return;}}}};
 g.draw=()=>{A.cls();for(let y=22;y<H;y+=12)R(159,y,2,6,K.d);A.hud2(sc[0],sc[1]);R(12,p[0],4,40,K.c);R(304,p[1],4,40,K.p);balls.forEach((b,i)=>C(b.x,b.y,3,[K.w,K.y,K.o][i]));};
 return g;}});

A.add({id:'ctf',name:'CAPTURE FLAG',cat:'VERSUS',vs:1,how:'GRAB THEIR FLAG, BRING IT HOME. RUN INTO A CARRIER ON YOUR SIDE TO TAG. FIRST TO 3.',make(){
 const g={over:null,score:0};let p,flags,sc=[0,0],wait=40;const home=[[30,120],[290,120]];const reset=()=>{p=[{x:40,y:120,has:false},{x:280,y:120,has:false}];flags=[{x:30,y:120,held:-1},{x:290,y:120,held:-1}];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=p[1],o=p[0];let tx,ty;if(q.has){[tx,ty]=home[1];}else if(o.has&&o.x>160){tx=o.x;ty=o.y;}else{tx=flags[0].x;ty=flags[0].y;}A.bot({l:q.x>tx+3,r:q.x<tx-3,u:q.y>ty+3,d:q.y<ty-3});}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),sp=(i&&A.cpu?1.3+1*A.ai:2.2)*(q.has?.8:1);q.moving=!!(ax(k)||ay(k));q.x=cl(q.x+ax(k)*sp,10,310);q.y=cl(q.y+ay(k)*sp,30,230);const ef=flags[1-i];if(!q.has&&ef.held<0&&Math.hypot(q.x-ef.x,q.y-ef.y)<10){q.has=true;ef.held=i;S('coin');}if(q.has){ef.x=q.x;ef.y=q.y-10;if(Math.hypot(q.x-home[i][0],q.y-home[i][1])<16){sc[i]++;S('score');A.confetti();if(sc[i]>=3){g.over=A.win(i);return;}reset();return;}}}
  const[a,b]=p;if(Math.hypot(a.x-b.x,a.y-b.y)<12){const side=a.x<160?0:1;const carrier=side===0?b:a,def=carrier===a?b:a;if(carrier.has&&def.moving){const ci=p.indexOf(carrier);carrier.has=false;flags[1-ci].held=-1;flags[1-ci].x=home[1-ci][0];flags[1-ci].y=home[1-ci][1];carrier.x=home[ci][0]+(ci?-10:10);carrier.y=120;S('boom');A.burst(a.x,a.y,K.w,14);}}};
 g.draw=()=>{A.cls('#3f8a3a');R(0,24,160,H,'#357a32');R(158,24,4,H,K.w);[[30,120,K.c],[290,120,K.p]].forEach(h=>A.ring(h[0],h[1],16,h[2]));flags.forEach((f,i)=>{R(f.x-1,f.y-10,2,14,K.w);R(f.x+1,f.y-10,10,6,i?K.p:K.c);});p.forEach((q,i)=>{C(q.x,q.y,7,i?K.p:K.c);C(q.x,q.y-9,4,'#ffd9a8');});A.hud2(sc[0],sc[1]);};
 return g;}});
})();
