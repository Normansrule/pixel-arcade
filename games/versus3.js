(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const die=(x,y,v,col)=>{R(x,y,22,22,col||K.w);A.box(x,y,22,22,K.k);const P={1:[[11,11]],2:[[6,6],[16,16]],3:[[6,6],[11,11],[16,16]],4:[[6,6],[16,6],[6,16],[16,16]],5:[[6,6],[16,6],[11,11],[6,16],[16,16]],6:[[6,5],[16,5],[6,11],[16,11],[6,17],[16,17]]}[v]||[];P.forEach(p=>R(x+p[0]-1.5,y+p[1]-1.5,3,3,K.k));};

A.add({id:'battleship',name:'SEA BATTLE',cat:'BOARD',vs:1,how:'MOVE THE CURSOR ON THE ENEMY GRID. A FIRES. SINK ALL 4 SHIPS.',make(){
 const g={over:null,score:0},N=8,SH=[4,3,3,2];let bd=[[],[]],shots=[new Set(),new Set()],p=0,c={x:3,y:3},think=0,msg='',mt=0,hunt=[];
 const place=()=>{const b=Array(N*N).fill(0);SH.forEach((l,k)=>{for(let tr=0;tr<200;tr++){const h=Math.random()<.5,x=ri(h?N-l+1:N),y=ri(h?N:N-l+1),cs=[];for(let q=0;q<l;q++)cs.push((h?y:y+q)*N+(h?x+q:x));if(cs.every(i=>!b[i])){cs.forEach(i=>b[i]=k+1);return;}}});return b;};bd=[place(),place()];
 const sunk=(b,s,k)=>b.every((v,i)=>v!==k||s.has(i));const allSunk=(b,s)=>SH.every((_,k)=>sunk(b,s,k+1));
 const shoot=i=>{const tb=bd[1-p],s=shots[p];if(s.has(i))return false;s.add(i);if(tb[i]){msg=sunk(tb,s,tb[i])?'SUNK!':'HIT!';S(msg==='SUNK!'?'score':'hit');if(p===1)hunt.push(i);if(allSunk(tb,s)){g.over=A.win(p);return true;}}else{msg='MISS';S('blip');p=1-p;}mt=40;think=0;return true;};
 g.update=()=>{if(mt>0){mt--;return;}if(A.cpu&&p===1){if(++think<30)return;const s=shots[1];let i=-1;if(A.lvl>0){for(const hi of hunt){const x=hi%N,y=(hi/N)|0;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+d[0],ny=y+d[1],ni=ny*N+nx;if(nx>=0&&ny>=0&&nx<N&&ny<N&&!s.has(ni)){i=ni;break;}}if(i>=0)break;}}if(i<0){const opts=[...Array(N*N).keys()].filter(k=>!s.has(k)&&(A.lvl<2||((k%N)+((k/N)|0))%2===0));i=(opts.length?opts:[...Array(N*N).keys()].filter(k=>!s.has(k)))[ri(opts.length||1)];}shoot(i);return;}
  const h=A.hit(human(p));mvCur(h,c,N,N);if(h.a&&!shoot(c.y*N+c.x))S('lose');};
 g.draw=()=>{A.cls('#0b2a55');const grid=(ox,b,s,show,cur)=>{for(let i=0;i<N*N;i++){const x=ox+(i%N)*16,y=40+((i/N)|0)*16;R(x,y,15,15,'#1b4a88');if(show&&b[i])R(x+2,y+2,11,11,'#8a8aa0');if(s.has(i)){if(b[i])C(x+7.5,y+7.5,5,K.r);else C(x+7.5,y+7.5,2,K.w);}}if(cur)A.box(ox+c.x*16-1,40+c.y*16-1,17,17,K.y);};
  const me=A.cpu?0:p;grid(20,bd[me],shots[1-me],true,false);grid(172,bd[1-me],shots[me],!!g.over,p===me||!A.cpu);T(A.cpu?'YOUR FLEET':A.nm(me)+' FLEET',84,28,K.c,1,'c');T('ENEMY WATERS',236,28,K.p,1,'c');T(A.nm(p)+' FIRES',160,184,K.w,2,'c');if(mt)T(msg,160,206,msg==='MISS'?K.gr:K.y,2,'c');};
 return g;}});

A.add({id:'artillery',name:'ARTILLERY DUEL',cat:'VERSUS',vs:1,how:'UP/DOWN ANGLE, LEFT/RIGHT POWER, A FIRES. MIND THE WIND. 3 HITS WINS.',make(){
 const g={over:null,score:0};let land=[],tk,p=0,sh=null,wind=0,sc=[0,0],think=0,ex=null,plan=null;
 const gen=()=>{land=[];let y=170;for(let x=0;x<=W;x+=4){y=cl(y+rnd(8)-4+(x>140&&x<180?-2:0),110,200);land.push(y);}tk=[{x:40,a:.8,pw:.6},{x:280,a:.8,pw:.6}];wind=rnd(.06)-.03;plan=null;};gen();
 const gy=x=>land[cl(Math.round(x/4),0,land.length-1)];
 const fire=()=>{const q=tk[p],d=p?-1:1,v=3+q.pw*6;sh={x:q.x,y:gy(q.x)-10,vx:Math.cos(q.a)*v*d,vy:-Math.sin(q.a)*v};S('shoot');};
 g.update=()=>{if(ex){ex.r+=1.5;if(ex.r>18){ex=null;p=1-p;think=0;plan=null;wind=cl(wind+rnd(.02)-.01,-.04,.04);}return;}
  if(sh){sh.vy+=.12;sh.vx+=wind;sh.x+=sh.vx;sh.y+=sh.vy;if(sh.x<0||sh.x>W){sh=null;ex={x:-99,y:0,r:17};return;}if(sh.y>=gy(sh.x)){ex={x:sh.x,y:sh.y,r:1};S('boom');A.burst(sh.x,sh.y,K.o,20,3);for(let i=0;i<land.length;i++){const dx=i*4-sh.x;if(Math.abs(dx)<16)land[i]=Math.min(236,land[i]+Math.sqrt(256-dx*dx)*.6);}
    for(let i=0;i<2;i++)if(Math.abs(tk[i].x-sh.x)<14){sc[1-i]+=i===p?0:1;if(i===p)sc[1-i]++;if(sc[1-i]>=3){g.over=A.win(1-i);}}sh=null;}return;}
  const q=tk[p];if(A.cpu&&p===1){if(!plan){let best=null,bd=1e9;for(let a=.3;a<1.4;a+=.05)for(let pw=.2;pw<=1;pw+=.05){let x=q.x,y=gy(q.x)-10,v=3+pw*6,vx=-Math.cos(a)*v,vy=-Math.sin(a)*v;for(let s=0;s<400;s++){vy+=.12;vx+=wind;x+=vx;y+=vy;if(x<0||x>W||y>=gy(x))break;}const dd=Math.abs(x-tk[0].x);if(dd<bd){bd=dd;best={a,pw};}}const err=(1-A.ai)*.18;plan={a:best.a+rnd(err*2)-err,pw:cl(best.pw+rnd(err)-err/2,.1,1)};}q.a+=(plan.a-q.a)*.1;q.pw+=(plan.pw-q.pw)*.1;if(++think>70)fire();return;}
  const k=A.in(human(p));q.a=cl(q.a-ay(k)*.02,.2,1.5);q.pw=cl(q.pw+ax(k)*(p?-1:1)*.01,.1,1);if(A.hit(human(p)).a)fire();};
 g.draw=()=>{A.skyband('#1a2a6a','#ff9838',H);A.c.fillStyle='#3f6a3a';A.c.beginPath();A.c.moveTo(0,H);land.forEach((y,i)=>A.c.lineTo(i*4,y));A.c.lineTo(W,H);A.c.fill();A.c.fillStyle='#2f5a2a';A.c.beginPath();A.c.moveTo(0,H);land.forEach((y,i)=>A.c.lineTo(i*4,y+6));A.c.lineTo(W,H);A.c.fill();
  tk.forEach((q,i)=>{const y=gy(q.x),d=i?-1:1;R(q.x-10,y-8,20,8,i?K.p:K.c);C(q.x,y-9,5,i?K.p:K.c);L(q.x,y-9,q.x+Math.cos(q.a)*14*d,y-9-Math.sin(q.a)*14,K.w,2);if(i===p&&!sh&&!ex){R(i?W-66:6,24,60,5,K.k);R(i?W-66:6,24,60*q.pw,5,K.y);}});
  if(sh)C(sh.x,sh.y,2.5,K.w);if(ex&&ex.x>0){C(ex.x,ex.y,ex.r,'rgba(255,152,56,.7)');}A.hud2(sc[0],sc[1]);T('WIND '+(wind>0?'>':'<').repeat(Math.ceil(Math.abs(wind)*100)),160,6,K.w,1,'c');};
 return g;}});

A.add({id:'joust',name:'SKY JOUST',cat:'VERSUS',vs:1,how:'A FLAPS, LEFT/RIGHT STEER. HIT YOUR RIVAL FROM ABOVE. FIRST TO 5.',make(){
 const g={over:null,score:0},PL=[[40,80,70],[210,80,70],[120,150,80],[0,215,320]];let b,sc=[0,0],wait=40;const reset=()=>{b=[{x:70,y:60,vx:0,vy:0,d:1,inv:0},{x:250,y:60,vx:0,vy:0,d:-1,inv:0}];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=b[1],o=b[0];A.bot({a:q.y>o.y-20&&Math.random()<.18+.12*A.ai||q.y>180&&Math.random()<.3,l:q.x>o.x+6,r:q.x<o.x-6});}
  for(let i=0;i<2;i++){const q=b[i],k=A.in(i);if(A.hit(i).a){q.vy=-2.6;S('jump');}q.vx=cl(q.vx+ax(k)*.15,-2.4,2.4);q.vx*=.99;if(ax(k))q.d=ax(k);q.vy+=.1;q.x+=q.vx;q.y+=q.vy;if(q.x<-10)q.x=W+10;if(q.x>W+10)q.x=-10;if(q.y<10){q.y=10;q.vy=0;}if(q.inv>0)q.inv--;
   for(const p of PL)if(q.vy>0&&q.y>=p[1]-10&&q.y-q.vy<p[1]-10+1&&q.x>p[0]&&q.x<p[0]+p[2]){q.y=p[1]-10;q.vy=0;q.vx*=.9;}}
  const[a,c2]=b;if(Math.hypot(a.x-c2.x,a.y-c2.y)<16&&!a.inv&&!c2.inv){if(Math.abs(a.y-c2.y)<3){a.vx*=-1;c2.vx*=-1;a.inv=c2.inv=20;S('hit');}else{const w=a.y<c2.y?0:1;sc[w]++;S('score');A.burst(b[1-w].x,b[1-w].y,K.w,16,3);if(sc[w]>=5){g.over=A.win(w);return;}reset();}}};
 g.draw=()=>{A.cls('#1a1238');for(let i=0;i<30;i++)R((i*97)%W,(i*41)%200,1,1,K.gr);R(0,222,W,18,'#c43a1a');PL.forEach(p=>{R(p[0],p[1],p[2],6,'#8d86b8');R(p[0],p[1],p[2],2,'#b8b0e6');});
  b.forEach((q,i)=>{const c=i?K.p:K.c,fl=Math.sin(A.t*.5)*4*(q.vy<0?1:.3);R(q.x-8,q.y-4,16,8,'#ffcf3f');R(q.x+q.d*6,q.y-7,5,4,'#ffcf3f');R(q.x-6,q.y-6-fl,12,3,'#d9a55b');R(q.x-4,q.y-14,8,8,c);R(q.x-2,q.y-18,4,4,'#ffd9a8');L(q.x+q.d*2,q.y-10,q.x+q.d*14,q.y-12,K.w,2);});A.hud2(sc[0],sc[1]);};
 return g;}});

A.add({id:'snowball',name:'SNOWBALL FIGHT',cat:'VERSUS',vs:1,how:'MOVE BEHIND FORTS. HOLD A TO PACK, RELEASE TO THROW. 5 HITS WINS.',make(){
 const g={over:null,score:0},FORT=[[90,70],[90,170],[230,70],[230,170],[160,120]];let p,balls=[],sc=[0,0],wait=40;const reset=()=>{p=[{x:40,y:120,pack:0},{x:280,y:120,pack:0}];balls=[];wait=40;};reset();
 const blk=(x,y)=>FORT.some(f=>Math.abs(x-f[0])<14&&Math.abs(y-f[1])<8);
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=p[1],o=p[0],inc=balls.find(b=>b.o===0&&b.vx>0&&Math.abs(b.y-q.y)<16);const lane=Math.abs(o.y-120)<22?(A.t%400<200?95:145):o.y,ty=inc?(q.y<120?q.y-30:q.y+30):lane;A.bot({u:q.y>ty+3,d:q.y<ty-3,l:q.x>270,r:q.x<250,a:q.pack<(.5+A.ai*.4)&&!inc});}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),nx=cl(q.x+ax(k)*2,i?180:14,i?W-14:140),ny=cl(q.y+ay(k)*2,30,H-14);if(!blk(nx,q.y))q.x=nx;if(!blk(q.x,ny))q.y=ny;if(k.a)q.pack=Math.min(1,q.pack+.02);else if(q.pack>.15){const o=p[1-i],dx=o.x-q.x,dy=o.y-q.y,d=Math.hypot(dx,dy)||1,v=2.5+q.pack*3.5;balls.push({x:q.x,y:q.y,vx:dx/d*v,vy:dy/d*v,o:i,life:40+q.pack*60});q.pack=0;S('shoot');}else q.pack=0;}
  for(const b of balls){b.x+=b.vx;b.y+=b.vy;b.life--;if(blk(b.x,b.y)){b.life=0;A.burst(b.x,b.y,K.w,6);}const o=p[1-b.o];if(b.life>0&&Math.hypot(b.x-o.x,b.y-o.y)<9){b.life=0;sc[b.o]++;S('boom');A.burst(o.x,o.y,K.w,14,2.5);if(sc[b.o]>=5){g.over=A.win(b.o);return;}reset();return;}}balls=balls.filter(b=>b.life>0&&b.x>0&&b.x<W);};
 g.draw=()=>{A.cls('#eef4ff');for(let i=0;i<40;i++)R((i*83)%W,(i*47+A.t*.5)%H,2,2,'#cfdcf2');FORT.forEach(f=>{R(f[0]-14,f[1]-8,28,16,'#dbe9f4');A.box(f[0]-14,f[1]-8,28,16,'#9fb8d8');});
  p.forEach((q,i)=>{C(q.x,q.y,7,i?K.p:K.c);C(q.x,q.y-9,5,'#ffd9a8');R(q.x-5,q.y-15,10,3,i?K.p:K.c);if(q.pack>0){C(q.x+(i?-9:9),q.y,2+q.pack*3,K.w);}});balls.forEach(b=>C(b.x,b.y,3,'#ffffff'));A.hud2(sc[0],sc[1]);};
 return g;}});

A.add({id:'filler',name:'HEX FILLER',cat:'BOARD',vs:1,how:'LEFT/RIGHT PICK A COLOUR, A TAKES IT. GROW FROM YOUR CORNER. MOST CELLS WINS.',make(){
 const g={over:null,score:0},NX=14,NY=10,CO=[K.r,K.y,K.g,K.b,K.p,K.o];let b=[],own=[],p=0,sel=0,think=0;for(let i=0;i<NX*NY;i++){b.push(ri(6));own.push(-1);}own[(NY-1)*NX]=0;own[NX-1]=1;if(b[(NY-1)*NX]===b[NX-1])b[NX-1]=(b[NX-1]+1)%6;
 const grow=(pl,col,dry)=>{const o=own.slice(),bb=b.slice();o.forEach((v,i)=>{if(v===pl)bb[i]=col;});let ch=true;while(ch){ch=false;for(let i=0;i<NX*NY;i++){if(o[i]!==-1||bb[i]!==col)continue;const x=i%NX,y=(i/NX)|0;if([[1,0],[-1,0],[0,1],[0,-1]].some(d=>{const nx=x+d[0],ny=y+d[1];return nx>=0&&ny>=0&&nx<NX&&ny<NY&&o[ny*NX+nx]===pl;})){o[i]=pl;ch=true;}}}if(!dry){own=o;b=bb;}return o.filter(v=>v===pl).length;};
 const cur=pl=>b[own.indexOf(pl)];const ok=c=>c!==cur(0)&&c!==cur(1);
 const play=c=>{grow(p,c,false);S('coin');const n=[0,1].map(i=>own.filter(v=>v===i).length);if(own.every(v=>v!==-1)||n[0]>NX*NY/2||n[1]>NX*NY/2){g.over=n[0]===n[1]?'DRAW!':A.win(n[0]>n[1]?0:1);return;}p=1-p;think=0;};
 g.update=()=>{if(A.cpu&&p===1){if(++think>30){let best=-1,bc=0;for(let c=0;c<6;c++){if(!ok(c))continue;const v=grow(1,c,true)+rnd(A.lvl===0?8:A.lvl===1?2:0);if(v>best){best=v;bc=c;}}play(bc);}return;}
  const h=A.hit(human(p));if(h.l||h.r){do{sel=(sel+(h.r?1:5))%6;}while(!ok(sel));S('blip');}if(!ok(sel)){for(let c=0;c<6;c++)if(ok(c)){sel=c;break;}}if(h.a)play(sel);};
 g.draw=()=>{A.cls('#0d0926');for(let i=0;i<NX*NY;i++){const x=20+(i%NX)*20+((i/NX|0)%2)*10,y=24+((i/NX)|0)*17;C(x,y,9,CO[b[i]]);if(own[i]>=0)A.ring(x,y,9,own[i]?'#ffffff':'#000000');}
  CO.forEach((c,i)=>{R(70+i*32,200,26,20,ok(i)?c:'#333');if(i===sel&&!(A.cpu&&p===1))A.box(68+i*32,198,30,24,K.w);});const n=[0,1].map(i=>own.filter(v=>v===i).length);A.hud2(n[0],n[1]);T(A.nm(p)+' PICKS',160,228,K.w,1,'c');};
 return g;}});

A.add({id:'armwrestle',name:'ARM WRESTLE',cat:'VERSUS',vs:1,how:'TAP A AS FAST AS YOU CAN. PIN YOUR RIVAL\'S HAND. BEST OF 3.',make(){
 const g={over:null,score:0};let pos=0,sc=[0,0],t=-80,pw=[0,0];
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){if(A.cpu&&i===1){pw[1]+=(.08+.1*A.ai)*(Math.random()<.9?1:0);}else if(A.hit(i).a){pw[i]+=1.1;}pw[i]*=.9;}pos+=(pw[1]-pw[0])*.03;pos*=.998;
  if(Math.abs(pos)>1){const w=pos<0?0:1;sc[w]++;S('score');pos=0;pw=[0,0];t=-60;if(sc[w]>=2)g.over=A.win(w);}};
 g.draw=()=>{A.cls('#3a2a18');R(40,150,240,20,'#8a5c33');R(40,170,240,70,'#5b3a1e');const a=pos*1.2-1.5708,hx=160+Math.cos(a)*50,hy=150+Math.sin(a)*50;L(100,160,160,150,K.c,10);L(220,160,160,150,K.p,10);L(160,150,hx,hy,'#ffd9a8',12);C(hx,hy,9,'#ffd9a8');R(34,120,40,40,K.c);R(246,120,40,40,K.p);C(54,106,14,'#ffd9a8');C(266,106,14,'#ffd9a8');
  A.hud2(sc[0],sc[1]);R(60,30,200,8,K.d);R(160,30,-pos*100,8,pos<0?K.c:K.p);T(t<0?'READY...':'TAP A!',160,60,K.y,2,'c');};
 return g;}});

A.add({id:'rps',name:'RPS SHOWDOWN',cat:'VERSUS',vs:1,how:'LEFT ROCK, UP PAPER, RIGHT SCISSORS. THE CPU LEARNS YOUR HABITS. FIRST TO 5.',make(){
 const g={over:null,score:0},NM=['ROCK','PAPER','SCISSORS'];let pick=[-1,-1],sc=[0,0],hist=[],mt=0,msg='',last=null;
 const beats=(a,b)=>(a-b+3)%3===1;
 g.update=()=>{if(mt>0){mt--;if(mt===0){pick=[-1,-1];if(sc[0]>=5||sc[1]>=5)g.over=A.win(sc[0]>=5?0:1);}return;}
  for(let i=0;i<2;i++){if(pick[i]>=0)continue;if(A.cpu&&i===1){if(pick[0]>=0){let pred=ri(3);if(hist.length>=2&&Math.random()<.35+A.ai*.4){const c=[0,0,0];for(let k=1;k<hist.length;k++)if(hist[k-1]===hist[hist.length-1])c[hist[k]]++;pred=c.indexOf(Math.max(...c));}pick[1]=(pred+1)%3;}continue;}const h=A.hit(i);const v=h.l?0:h.u?1:h.r?2:-1;if(v>=0){pick[i]=v;S('blip');}}
  if(pick[0]>=0&&pick[1]>=0){hist.push(pick[0]);const w=pick[0]===pick[1]?-1:beats(pick[0],pick[1])?0:1;if(w>=0)sc[w]++;msg=w<0?'DRAW':A.nm(w)+' WINS';last=pick.slice();mt=70;S(w===0?'score':w===1?'lose':'blip');}};
 const hand=(x,y,v,c)=>{if(v===0)C(x,y,14,c);else if(v===1)R(x-14,y-18,28,34,c);else{L(x-4,y+14,x-12,y-16,c,6);L(x+4,y+14,x+12,y-16,c,6);C(x,y+14,8,c);}};
 g.draw=()=>{A.cls('#1a1238');A.hud2(sc[0],sc[1]);if(mt&&last){hand(90,120,last[0],K.c);hand(230,120,last[1],K.p);T(NM[last[0]],90,150,K.c,1,'c');T(NM[last[1]],230,150,K.p,1,'c');T(msg,160,190,K.y,2,'c');}else{const b=Math.abs(Math.sin(A.t*.15))*10;C(90,120-b,14,K.c);C(230,120-b,14,K.p);T(pick[0]>=0?'READY':'CHOOSE',90,160,K.c,1,'c');T(pick[1]>=0?'READY':'...',230,160,K.p,1,'c');T('LEFT ROCK   UP PAPER   RIGHT SCISSORS',160,210,K.gr,1,'c');}};
 return g;}});

A.add({id:'pig',name:'PIG DICE',cat:'BOARD',vs:1,how:'A ROLLS, B BANKS. ROLL A 1 AND YOU LOSE THE TURN\'S POINTS. FIRST TO 50.',make(){
 const g={over:null,score:0};let sc=[0,0],turn=0,p=0,dv=1,roll=0,think=0,msg='';
 const doRoll=()=>{roll=12;S('blip');};const bank=()=>{sc[p]+=turn;turn=0;S('coin');msg=A.nm(p)+' BANKS';if(sc[p]>=50){g.over=A.win(p);return;}p=1-p;think=0;};
 g.update=()=>{if(roll>0){dv=1+ri(6);if(--roll===0){if(dv===1){turn=0;msg=A.nm(p)+' ROLLED 1!';S('lose');p=1-p;think=0;}else{turn+=dv;msg='';}}return;}
  if(A.cpu&&p===1){if(++think<30)return;think=0;const target=[12,20,20][A.lvl],need=50-sc[1];if(turn>=Math.min(target,need)||(A.lvl===2&&sc[0]>=40&&turn<need&&false))bank();else doRoll();return;}
  const h=A.hit(human(p));if(h.a)doRoll();else if(h.b&&turn>0)bank();};
 g.draw=()=>{A.cls('#0f5a2a');A.ring(160,120,90,'#1e8a45');die(149,90,dv);T('TURN +'+turn,160,130,K.y,2,'c');A.hud2(sc[0],sc[1]);[0,1].forEach(i=>{R(i?W-110:10,24,100,6,K.k);R(i?W-110:10,24,sc[i]*2,6,i?K.p:K.c);});T(msg||A.nm(p)+(A.cpu&&p===1?' THINKS':'   A ROLL   B BANK'),160,190,K.w,1,'c');};
 return g;}});

A.add({id:'dicepoker',name:'DICE POKER',cat:'BOARD',vs:1,how:'ROLL 5 DICE. A HOLDS A DIE, B REROLLS (ONCE). BEST HAND WINS THE ROUND. FIRST TO 3.',make(){
 const g={over:null,score:0},RN=['NOTHING','PAIR','TWO PAIR','THREE','STRAIGHT','FULL HOUSE','FOUR','FIVE'];let d=[[],[]],hold=[0,0,0,0,0],p=0,c=0,ph=0,sc=[0,0],mt=0,msg='',think=0;
 const rollAll=i=>{d[i]=d[i].length?d[i].map((v,k)=>hold[k]?v:1+ri(6)):[1,2,3,4,5].map(()=>1+ri(6));};
 const rank=a=>{const cnt={};a.forEach(v=>cnt[v]=(cnt[v]||0)+1);const v=Object.values(cnt).sort((x,y)=>y-x),s=a.slice().sort().join('');const r=v[0]===5?7:v[0]===4?6:v[0]===3&&v[1]===2?5:(s==='12345'||s==='23456')?4:v[0]===3?3:v[0]===2&&v[1]===2?2:v[0]===2?1:0;return r*100+a.reduce((x,y)=>x+y,0);};
 const start=()=>{d=[[],[]];hold=[0,0,0,0,0];p=0;ph=0;rollAll(0);};start();
 const endTurn=()=>{if(p===0){p=1;hold=[0,0,0,0,0];rollAll(1);ph=0;think=0;}else{const a=rank(d[0]),b=rank(d[1]);const w=a===b?-1:a>b?0:1;if(w>=0)sc[w]++;msg=w<0?'TIE':A.nm(w)+' TAKES IT';mt=100;S(w===0?'score':'lose');}};
 g.update=()=>{if(mt>0){if(--mt===0){if(sc[0]>=3||sc[1]>=3)g.over=A.win(sc[0]>=3?0:1);else start();}return;}
  if(A.cpu&&p===1){if(++think<40)return;think=0;if(ph===0){const cnt={};d[1].forEach(v=>cnt[v]=(cnt[v]||0)+1);const best=+Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||b-a)[0];hold=d[1].map(v=>v===best&&cnt[best]>1?1:0);if(A.lvl===0)hold=hold.map(()=>Math.random()<.3?1:0);rollAll(1);ph=1;S('blip');}else endTurn();return;}
  const h=A.hit(human(p));if(h.l)c=(c+4)%5;if(h.r)c=(c+1)%5;if(h.a){hold[c]^=1;S('blip');}if(h.b){if(ph===0){rollAll(p);ph=1;S('blip');}else endTurn();}};
 g.draw=()=>{A.cls('#0f5a2a');[0,1].forEach(i=>{const y=i?50:150;T(A.nm(i),20,y+6,i?K.p:K.c,1);if(d[i].length)d[i].forEach((v,k)=>{die(70+k*34,y,v,(i===p&&hold[k]&&!mt)?K.y:K.w);if(i===p&&k===c&&!(A.cpu&&p===1)&&!mt)A.box(68+k*34,y-2,26,26,K.p);});if(d[i].length)T(RN[(rank(d[i])/100)|0],250,y+8,K.w,1,'c');});
  A.hud2(sc[0],sc[1]);T(mt?msg:A.nm(p)+(ph===0?'   A HOLD   B REROLL':'   B STAND'),160,215,K.y,1,'c');};
 return g;}});
})();
