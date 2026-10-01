/* PUZZLE5 pack: 16 tactile logic puzzles. Every board is generated from a solved state or checked by a solver.
   Mouse: click / drag (mouse:1). Keyboard: arrows move a cursor, A acts, B is the secondary action. */
(function(){const A=window.A,{W,H,K}=A,T=A.text,S=A.sfx,cl=A.clamp,ri=A.ri,rnd=A.rnd;
const PAL=['#ff5a6e','#ffa53f','#ffd84a','#48d97c','#2fd6c3','#4d9fff','#a870ff','#ff6fcf','#b88a5a','#c8d0e0'];
const LC=new Map();
const lt=(h,f)=>{const k=h+f;let v=LC.get(k);if(v)return v;const n=parseInt(h.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;const m=x=>Math.max(0,Math.min(255,f>1?x+(255-x)*(f-1):x*f))|0;v='rgb('+m(r)+','+m(g)+','+m(b)+')';LC.set(k,v);return v;};
const rgba=(h,a)=>{const n=parseInt(h.slice(1),16);return'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')';};
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);const t=a[i];a[i]=a[j];a[j]=t;}return a;};
const fin=v=>isFinite(v)?v:0;
/* ---- drawing kit: rounded rects, bevels, wells, glows ---- */
const rr=(x,y,w,h,r)=>{const c=A.c;x=fin(x);y=fin(y);w=Math.max(0,fin(w));h=Math.max(0,fin(h));r=Math.max(0,Math.min(fin(r),w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
const fr=(x,y,w,h,r,col)=>{rr(x,y,w,h,r);A.c.fillStyle=col;A.c.fill();};
const sr=(x,y,w,h,r,col,lw)=>{rr(x,y,w,h,r);A.c.strokeStyle=col;A.c.lineWidth=lw||1;A.c.stroke();};
const grad=(x0,y0,x1,y1,stops)=>{const c=A.c;const g=c.createLinearGradient&&c.createLinearGradient(fin(x0),fin(y0),fin(x1),fin(y1));if(g&&g.addColorStop){stops.forEach((s,i)=>g.addColorStop(s[0],s[1]));return g;}return stops[0][1];};
const bev=(x,y,w,h,col,r,d)=>{r=r===undefined?4:r;d=d===undefined?2:d;fr(x+1,y+d+1,w,h,r,'rgba(0,0,0,.3)');fr(x,y+d,w,h,r,lt(col,.55));fr(x,y,w,h,r,grad(0,y,0,y+h,[[0,lt(col,1.25)],[1,lt(col,.92)]]));if(h>6&&w>6)fr(x+2,y+1,w-4,Math.min(8,Math.max(2,h*.32)),r*.7,'rgba(255,255,255,.2)');};
const well=(x,y,w,h,r,col)=>{fr(x,y,w,h,r,col||'rgba(0,0,0,.3)');fr(x+1,y,w-2,2,1,'rgba(0,0,0,.22)');};
const glow=(x,y,r,col,a)=>{const c=A.c;const g=c.createRadialGradient&&c.createRadialGradient(fin(x),fin(y),0,fin(x),fin(y),Math.max(1,fin(r)));c.globalAlpha=a===undefined?1:a;if(g&&g.addColorStop){g.addColorStop(0,rgba(col,.9));g.addColorStop(1,rgba(col,0));c.fillStyle=g;}else c.fillStyle=rgba(col,.3);c.beginPath();c.arc(fin(x),fin(y),Math.max(1,fin(r)),0,6.2832);c.fill();c.globalAlpha=1;};
const ln=(x1,y1,x2,y2,col,w,cap)=>{const c=A.c;c.lineCap=cap||'round';c.strokeStyle=col;c.lineWidth=w||1;c.beginPath();c.moveTo(fin(x1),fin(y1));c.lineTo(fin(x2),fin(y2));c.stroke();c.lineCap='butt';};
const bgd=col=>{A.cls(col);const c=A.c;const g=c.createRadialGradient&&c.createRadialGradient(160,120,70,160,120,230);if(g&&g.addColorStop){g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.5)');c.fillStyle=g;c.fillRect(0,0,W,H);}};
const pulse=(sp)=>.5+.5*Math.sin(A.t*(sp||.15));
const cbox=(x,y,w,h,r,col)=>{A.c.globalAlpha=.55+.45*pulse();sr(x,y,w,h,r,col||K.y,2);A.c.globalAlpha=1;};
const crown=(x,y,s,col,dark)=>{const c=A.c;const p=[[x-s,y+s*.55],[x-s,y-s*.35],[x-s*.5,y+s*.05],[x,y-s*.7],[x+s*.5,y+s*.05],[x+s,y-s*.35],[x+s,y+s*.55]];c.beginPath();c.moveTo(p[0][0],p[0][1]+1);p.forEach(q=>c.lineTo(q[0],q[1]+1));c.closePath();c.fillStyle='rgba(0,0,0,.35)';c.fill();A.poly(p,col,1);c.strokeStyle=dark||lt(col,.5);c.lineWidth=1;c.beginPath();c.moveTo(p[0][0],p[0][1]);p.forEach(q=>c.lineTo(q[0],q[1]));c.closePath();c.stroke();A.rect(x-s,y+s*.3,s*2,Math.max(1,s*.25),lt(col,.7));A.circ(x,y-s*.7,Math.max(1,s*.16),'#ff5a6e');A.circ(x-s,y-s*.35,Math.max(1,s*.13),'#4d9fff');A.circ(x+s,y-s*.35,Math.max(1,s*.13),'#4d9fff');};
/* ---- sprite cache: pre-render static pieces at 2x into offscreen canvases (falls back to direct drawing) ---- */
const SC=new Map();
const spr=(key,w,h,fn)=>{let e=SC.get(key);if(e===undefined){e=null;try{if(typeof document!=='undefined'&&document.createElement&&A.hd){const cv=document.createElement('canvas');cv.width=Math.ceil((w+8)*2);cv.height=Math.ceil((h+10)*2);const x=cv.getContext('2d');if(x){x.scale(2,2);const o=A.c;A.c=x;try{fn(4,4);}finally{A.c=o;}e=cv;}}}catch(err){e=null;}if(e||A.hd)SC.set(key,e);}return e;};
const blit=(key,x,y,w,h,fn)=>{const e=spr(key,w,h,fn);if(e)A.c.drawImage(e,fin(x)-4,fin(y)-4,w+8,h+10);else fn(x,y);};
const mmss=f=>{const s=Math.floor(f/60);return(s/60|0)+':'+String(s%60).padStart(2,'0');};
/* ---- pointer: absolute when free, virtual cursor under pointer lock; own click edges ---- */
const P={x:160,y:120,lx:160,ly:120,mv:0,dn:0,press:0,rel:0,rc:0,lock:0,used:0,ka:0,kb:0};let pd=0,pu=0,pb=0;
try{if(typeof document!=='undefined'&&document.addEventListener){document.addEventListener('pointerdown',e=>{if(e.target&&e.target.id==='scr'){if(e.button===2)pb++;else pd++;}},true);document.addEventListener('pointerup',e=>{if(e.button!==2)pu++;},true);}}catch(e){}
const pinit=()=>{const m=A.mouse;P.lx=m.x;P.ly=m.y;P.x=m.x;P.y=m.y;P.dn=0;P.used=0;pd=pu=pb=0;};
const RP={};const rep=k=>{if(!A.in(0)[k]){RP[k]=0;return false;}RP[k]=(RP[k]||0)+1;return RP[k]===1||(RP[k]>16&&RP[k]%4===0);};
const pstep=()=>{const m=A.mouse;let lock=false;try{lock=typeof document!=='undefined'&&!!document.pointerLockElement;}catch(e){}P.mv=0;
 if(lock){if(m.dx||m.dy){let s=1;try{const r=document.getElementById('scr').getBoundingClientRect();if(r.width>0)s=320/r.width;}catch(e){}P.x=cl(P.x+fin(m.dx)*s,0,W-1);P.y=cl(P.y+fin(m.dy)*s,0,H-1);P.mv=1;}}
 else if(m.x!==P.lx||m.y!==P.ly){P.x=fin(m.x);P.y=fin(m.y);P.mv=1;}
 P.lx=m.x;P.ly=m.y;P.lock=lock;P.press=pd>0;P.rel=pu>0&&!m.down;P.rc=pb>0;pd=pu=pb=0;P.dn=!!m.down;
 const h=A.hit(0);P.ka=h.a&&!P.press;P.kb=h.b&&!P.rc;P.d={l:rep('l'),r:rep('r'),u:rep('u'),d:rep('d')};
 if(P.mv||P.press||P.rc)P.used=1;if(P.d.l||P.d.r||P.d.u||P.d.d||P.ka)P.used=0;return P;};
const pcur=()=>{if(!P.lock)return;const x=P.x,y=P.y;A.poly([[x+1,y+1],[x+1,y+12],[x+4,y+9],[x+7,y+14],[x+9,y+13],[x+6,y+8],[x+10,y+8]],'rgba(0,0,0,.5)',1);A.poly([[x,y],[x,y+11],[x+3,y+8],[x+6,y+13],[x+8,y+12],[x+5,y+7],[x+9,y+7]],'#ffffff',1);};
const inR=(x,y,w,h)=>P.x>=x&&P.x<x+w&&P.y>=y&&P.y<y+h;
/* ---- grid cursor helper ---- */
const gcur=(c,w,h)=>{const d=P.d;let m=false;if(d.l&&c.x>0){c.x--;m=true;}if(d.r&&c.x<w-1){c.x++;m=true;}if(d.u&&c.y>0){c.y--;m=true;}if(d.d&&c.y<h-1){c.y++;m=true;}if(m)S('blip');return m;};
const gmouse=(c,ox,oy,cs,w,h)=>{if(!(P.mv||P.press||P.rc))return false;const x=Math.floor((P.x-ox)/cs),y=Math.floor((P.y-oy)/cs);if(x>=0&&y>=0&&x<w&&y<h){c.x=x;c.y=y;return true;}return false;};
/* ---- level flow: clear banner, score = level + speed + moves bonus ---- */
const LV=(g,n,next,end)=>({g,n,lvl:0,t:0,mv:0,clr:0,msg:'',sub:'',next,end});
const lvTick=st=>{if(st.clr>0){st.clr--;if(st.clr===0){if(st.lvl>=st.n)st.g.over=st.end||'ALL '+st.n+' SOLVED! WIN';else{st.lvl++;st.t=0;st.mv=0;st.next(st.lvl);}}return true;}st.t++;return false;};
const lvWin=(st,par,parMv,extra)=>{const s=st.t/60,base=100*st.lvl,sp=par?Math.max(0,Math.round((par-s)*2)):0,mb=parMv?Math.max(0,Math.round((parMv-st.mv)*8)):0,tot=base+sp+mb+(extra||0);st.g.score+=tot;st.clr=105;st.msg=st.lvl>=st.n?'ALL CLEAR!':'LEVEL '+st.lvl+' CLEAR';st.sub='+'+tot+(sp?'   SPEED +'+sp:'')+(mb?'   MOVES +'+mb:'');S('win');for(let i=0;i<7;i++)A.burst(40+rnd(240),50+rnd(130),PAL[i%8],14,2.6);};
const lvStart=st=>{st.lvl=1;st.t=0;st.mv=0;st.next(1);st.g.skip=()=>{if(st.lvl<st.n){st.lvl++;st.t=0;st.mv=0;st.clr=0;st.next(st.lvl);}};st.g.st=st;};
const lvDraw=st=>{if(st.clr<=0)return;const k=Math.min(1,(105-st.clr)/12),c=A.c;c.globalAlpha=.5*k;c.fillStyle='#000';c.fillRect(0,0,W,H);c.globalAlpha=1;const w=236*(.7+.3*k);bev(160-w/2,88,w,58,'#3b2f86',9,3);fr(160-w/2+4,92,w-8,50,7,'rgba(0,0,0,.18)');if(k>=1){T(st.msg,160,99,K.y,3,'c');T(st.sub,160,128,K.w,1,'c');}};
const hud=(g,st,mid,col)=>{const c=A.c;c.fillStyle='rgba(0,0,0,.42)';c.fillRect(0,0,W,16);c.fillStyle='rgba(255,255,255,.1)';c.fillRect(0,16,W,1);T('LEVEL '+st.lvl+'/'+st.n,6,5,K.w,1);if(mid)T(mid,160,5,col||K.c,1,'c');T('SCORE '+g.score,W-6,5,K.y,1,'r');};

/* ================= 1. BLOCK BLAST ================= */
const BSH=['#','##','#/#','###','#/#/#','##/##','##/#.','##/.#','#./##','.#/##','####','#/#/#/#','#./#./##','.#/.#/##','##/#./#.','##/.#/.#','###/#..','###/..#','#../###','..#/###','###/.#.','.#./###','#./##/#.','.#/##/.#','##./.##','.##/##.','#./##/.#','.#/##/#.','#####','#/#/#/#/#','##/##/##','###/###','###/###/###','###/#../#..','###/..#/..#','#../#../###','..#/..#/###'].map(s=>{const o=[];let w=0,h=0;s.split('/').forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='#'){o.push([x,y]);w=Math.max(w,x+1);h=Math.max(h,y+1);}}));return{c:o,w,h,tier:o.length<=3?0:o.length===4?1:2};});
A.add({id:'blockblast',name:'BLOCK BLAST',cat:'PUZZLE',mouse:1,time:600,how:'DRAG PIECES ONTO THE BOARD (B PICKS, A DROPS). FULL LINES BLAST. CHAIN COMBOS.',make(){
 const g={over:null,score:0},N=8,CS=23,OX=18,OY=32,TX=214,TY=30;pinit();
 let b=Array(N*N).fill(0),tray=[null,null,null],sel=0,cur={x:2,y:2},drag=0,combo=0,since=0,fx=[],lvl=1,need=300,end=0,msg='',mt=0,shownLvl=1;
 const pick=()=>{const w=[[.62,.33,.05],[.42,.43,.15],[.3,.45,.25],[.24,.41,.35]][Math.min(lvl-1,3)];const r=rnd(1),t=r<w[0]?0:r<w[0]+w[1]?1:2;const L=BSH.filter(s=>s.tier===t);return{...L[ri(L.length)],col:PAL[ri(8)]};};
 const fits=(p,x,y)=>x>=0&&y>=0&&x+p.w<=N&&y+p.h<=N&&p.c.every(q=>!b[(y+q[1])*N+x+q[0]]);
 const fitsAny=p=>{for(let y=0;y<=N-p.h;y++)for(let x=0;x<=N-p.w;x++)if(fits(p,x,y))return true;return false;};
 const deal=()=>{for(let t=0;t<40;t++){tray=[pick(),pick(),pick()];if(tray.some(fitsAny))break;}sel=0;};deal();
 const lines=(p,x,y)=>{const nb=b.slice();p.c.forEach(q=>nb[(y+q[1])*N+x+q[0]]=1);const R=[],C=[];for(let i=0;i<N;i++){let fr_=1,fc=1;for(let j=0;j<N;j++){if(!nb[i*N+j])fr_=0;if(!nb[j*N+i])fc=0;}if(fr_)R.push(i);if(fc)C.push(i);}return{R,C};};
 const clampCur=()=>{const p=tray[sel];if(!p)return;cur.x=cl(cur.x,0,N-p.w);cur.y=cl(cur.y,0,N-p.h);};
 const place=()=>{const p=tray[sel];if(!p)return;if(!fits(p,cur.x,cur.y)){S('hit');A.shake=3;return;}
  const {R,C}=lines(p,cur.x,cur.y);p.c.forEach(q=>b[(cur.y+q[1])*N+cur.x+q[0]]=p.col);g.score+=p.c.length;S('hit');
  const n=R.length+C.length;if(n){combo++;since=0;const base=[0,10,30,60,100,150,210,280][Math.min(n,7)];g.score+=base*combo;const kill=new Set();R.forEach(r=>{for(let j=0;j<N;j++)kill.add(r*N+j);});C.forEach(c=>{for(let j=0;j<N;j++)kill.add(j*N+c);});
   const cx=cur.x+p.w/2,cy=cur.y+p.h/2;kill.forEach(i=>{const x=i%N,y=i/N|0;fx.push({x,y,col:b[i]||p.col,t:-Math.round(Math.hypot(x+.5-cx,y+.5-cy)*1.6)});if((x+y)%2===0)A.burst(OX+x*CS+CS/2,OY+y*CS+CS/2,b[i]||p.col,4,1.8);b[i]=0;});
   msg=(n>=4?'INCREDIBLE!':n===3?'TRIPLE!':n===2?'DOUBLE!':'BLAST!')+(combo>1?'  COMBO X'+combo:'');mt=60;S(combo>2||n>2?'win':'score');A.shake=Math.min(10,2+n*2+combo);
   if(b.every(v=>!v)){g.score+=300;msg='BOARD CLEAR! +300';mt=80;A.confetti();}}
  else if(++since>=3)combo=0;
  tray[sel]=null;if(tray.every(v=>!v))deal();else sel=tray.findIndex(v=>v);
  while(g.score>=need){lvl++;need+=250*lvl;msg='LEVEL '+lvl+'!  BIGGER PIECES';mt=80;S('coin');}
  if(!tray.some(v=>v&&fitsAny(v))){end=80;S('lose');msg='NO SPACE LEFT';mt=90;}clampCur();};
 g.cheat=()=>{for(let x=1;x<N;x++){b[7*N+x]=PAL[x%8];b[x*N]=PAL[(x+3)%8];}b[0]=0;b[7*N]=0;tray[sel]={...BSH[0],col:PAL[2]};cur.x=0;cur.y=7;place();};
 const slot=(x,y)=>{for(let i=0;i<3;i++)if(x>=TX&&x<TX+98&&y>=TY+i*64&&y<TY+i*64+60)return i;return -1;};
 const onB=()=>P.x>=OX-6&&P.x<OX+N*CS+6&&P.y>=OY-6&&P.y<OY+N*CS+6;
 g.update=()=>{pstep();if(mt)mt--;fx.forEach(f=>f.t++);fx=fx.filter(f=>f.t<18);if(end){if(--end===0)g.over='NO SPACE LEFT';return;}
  const p=tray[sel];
  if((P.mv||P.press)&&p&&onB()){cur.x=Math.round((P.x-OX)/CS-p.w/2);cur.y=Math.round((P.y-OY)/CS-p.h/2);clampCur();}
  if(P.press){const i=slot(P.x,P.y);if(i>=0&&tray[i]){sel=i;drag=1;S('blip');}else if(onB()&&p)place();}
  if(P.rel&&drag){drag=0;if(onB()&&tray[sel])place();}
  if(gcur(cur,N,N))clampCur();
  if(P.kb){for(let k=1;k<=3;k++){const j=(sel+k)%3;if(tray[j]){sel=j;break;}}clampCur();S('blip');}
  if(P.ka)place();};
 const blk=(x,y,col,s)=>{s=s||CS;blit('bb'+col+s,x,y,s,s,(X,Y)=>{bev(X+1,Y+1,s-2,s-3,col,Math.max(2,s*.18),2);fr(X+s*.3,Y+s*.32,s*.4,s*.3,2,'rgba(255,255,255,.12)');});};
 g.draw=()=>{bgd('#22306a');const c=A.c;
  blit('bbboard',OX-7,OY-7,N*CS+14,N*CS+18,(X,Y)=>{bev(X,Y,N*CS+14,N*CS+14,'#2b2470',9,4);fr(X+4,Y+4,N*CS+6,N*CS+6,6,'#17123f');for(let i=0;i<N*N;i++){const x=X+7+(i%N)*CS,y=Y+7+(i/N|0)*CS;fr(x+1,y+1,CS-2,CS-2,3,'#211b55');}});
  const p=tray[sel],show=p&&(!P.used||onB()||drag);let ok=false,L={R:[],C:[]};if(show){ok=fits(p,cur.x,cur.y);if(ok)L=lines(p,cur.x,cur.y);}
  const hot=new Set();L.R.forEach(r=>{for(let j=0;j<N;j++)hot.add(r*N+j);});L.C.forEach(cc=>{for(let j=0;j<N;j++)hot.add(j*N+cc);});
  hot.forEach(i=>{const x=OX+(i%N)*CS,y=OY+(i/N|0)*CS;fr(x,y,CS,CS,3,rgba(p.col,.25+.2*pulse(.3)));});
  for(let i=0;i<N*N;i++)if(b[i]){const x=OX+(i%N)*CS,y=OY+(i/N|0)*CS;blk(x,y,b[i]);if(hot.has(i))fr(x+1,y+1,CS-2,CS-3,4,'rgba(255,255,255,'+(.2+.25*pulse(.3))+')');}
  if(show){p.c.forEach(q=>{const x=OX+(cur.x+q[0])*CS,y=OY+(cur.y+q[1])*CS;c.globalAlpha=ok?.55:.4;if(ok)blk(x,y,p.col);else fr(x+2,y+2,CS-4,CS-4,4,'#ff3050');c.globalAlpha=1;});}
  fx.forEach(f=>{if(f.t<0){blk(OX+f.x*CS,OY+f.y*CS,f.col);return;}const k=1-f.t/18,s=CS*k,x=OX+f.x*CS+(CS-s)/2,y=OY+f.y*CS+(CS-s)/2-f.t*.6;c.globalAlpha=k;fr(x,y,s,s,3,f.t<5?'#ffffff':f.col);c.globalAlpha=1;});
  for(let i=0;i<3;i++){const y=TY+i*64,q=tray[i],fit=q&&fitsAny(q);well(TX,y,98,60,8,i===sel&&q?'rgba(255,216,74,.14)':'rgba(0,0,0,.3)');if(i===sel&&q)cbox(TX,y,98,60,8);
   if(q&&!(drag&&i===sel)){const s=Math.min(12,Math.floor(52/Math.max(q.w,q.h)));const ox=TX+49-q.w*s/2,oy=y+30-q.h*s/2;c.globalAlpha=fit?1:.35;q.c.forEach(t=>blk(ox+t[0]*s,oy+t[1]*s,fit?q.col:'#8d86b8',s));c.globalAlpha=1;}}
  if(drag&&p&&!onB()){c.globalAlpha=.9;p.c.forEach(t=>blk(P.x-p.w*CS/2+t[0]*CS,P.y-p.h*CS/2+t[1]*CS-4,p.col));c.globalAlpha=1;}
  T('LEVEL '+lvl,6,5,K.w,1);if(combo)T('COMBO X'+combo,160,5,combo>2?K.o:K.c,1,'c');T('SCORE '+g.score,W-6,5,K.y,1,'r');
  {const f=cl((g.score-(need-250*lvl))/(250*lvl),0,1);fr(OX,OY-14,N*CS,4,2,'rgba(0,0,0,.4)');fr(OX,OY-14,N*CS*f,4,2,K.c);}
  if(mt){c.globalAlpha=Math.min(1,mt/20);T(msg,OX+N*CS/2,OY+N*CS/2-8,msg.startsWith('NO')?K.r:K.y,msg.length>14?1:2,'c');c.globalAlpha=1;}
  pcur();};
 return g;}});

/* ================= 2. NUT SORT ================= */
A.add({id:'nutsort',name:'NUT SORT',cat:'PUZZLE',mouse:1,time:900,how:'CLICK OR A LIFTS THE TOP NUTS, AGAIN DROPS. ONE COLOUR PER BOLT. B UNDOES.',make(){
 const g={over:null,score:0},CAP=4,NUTC=['#ff5a6e','#ffa53f','#ffd84a','#48d97c','#2fd6c3','#4d9fff','#a870ff','#ff6fcf'];pinit();
 let bolts=[],sel=-1,cur=0,par=10,undo=[],msg='',mt=0,hidden=0,path=[],spath=[];
 const solve=(B0)=>{const seen=new Set();let nodes=0,best=null;path=[];const key=B=>B.map(b=>b.join('')).sort().join('|');
  const done=B=>B.every(b=>!b.length||(b.length===CAP&&b.every(v=>v===b[0])));
  const rec=(B,d)=>{if(nodes++>25000||d>90)return false;if(done(B)){best=d;return true;}const k=key(B);if(seen.has(k))return false;seen.add(k);
   const mv=[];for(let i=0;i<B.length;i++){const a=B[i];if(!a.length)continue;const top=a[a.length-1];let run=1;while(run<a.length&&a[a.length-1-run]===top)run++;const uni=run===a.length;
    for(let j=0;j<B.length;j++){if(i===j)continue;const t=B[j];if(t.length>=CAP)continue;if(t.length&&t[t.length-1]!==top)continue;if(!t.length&&uni)continue;mv.push([i,j,t.length?0:1]);}}
   mv.sort((a,b)=>a[2]-b[2]);for(const[i,j]of mv){const NB=B.map(b=>b.slice());const a=NB[i],t=NB[j],top=a[a.length-1];while(a.length&&a[a.length-1]===top&&t.length<CAP)t.push(a.pop());path.push([i,j]);if(rec(NB,d+1))return true;path.pop();}return false;};
  return rec(B0,0)?best:-1;};
 const gen=l=>{const nc=[3,4,5,6,7][l-1],hid=l>=3;hidden=hid;for(let tr=0;tr<60;tr++){const w=[];for(let i=0;i<nc;i++)for(let k=0;k<CAP;k++)w.push(i);shuf(w);const B=[];for(let i=0;i<nc;i++)B.push(w.slice(i*CAP,i*CAP+CAP));B.push([],[]);if(B.some(b=>b.length===CAP&&b.every(v=>v===b[0])))continue;const d=solve(B);if(d>0||tr===59){par=d>0?d:nc*4;spath=path.slice();bolts=B.map(b=>b.map((c,k)=>({c,hid:hid&&k<b.length-1,t0:-99,d:0,fx:0,fy:0})));break;}}sel=-1;cur=0;undo=[];};
 const st=LV(g,5,gen);lvStart(st);
 g.cheat=()=>{bolts.forEach(b=>b.forEach(n=>{n.hid=false;}));sel=-1;spath.forEach(([i,j])=>{act(i);act(j);});};
 const lay=()=>{const n=bolts.length,sp=Math.min(58,300/n);return{n,sp,x0:160-(n-1)*sp/2,base:198,nw:Math.min(42,sp-5)};};
 const npos=(bi,k)=>{const L=lay();return[L.x0+bi*L.sp,L.base-10-k*16];};
 const run=b=>{if(!b.length)return 0;const top=b[b.length-1].c;let r=1;while(r<b.length&&b[b.length-1-r].c===top&&!b[b.length-1-r].hid)r++;return r;};
 const full=b=>b.length===CAP&&b.every(n=>n.c===b[0].c&&!n.hid);
 const solved=()=>bolts.every(b=>!b.length||full(b));
 const canTo=(i,j)=>{const a=bolts[i],t=bolts[j];if(!a.length||t.length>=CAP)return false;return!t.length||t[t.length-1].c===a[a.length-1].c;};
 const anyMove=()=>{for(let i=0;i<bolts.length;i++)for(let j=0;j<bolts.length;j++)if(i!==j&&canTo(i,j))return true;return false;};
 const liftY=(bi,k,r)=>{const L=lay();return L.base-10-(CAP-1)*16-34-(k-(bolts[bi].length-r))*16+Math.sin(A.t*.15)*2;};
 const act=i=>{if(sel<0){if(bolts[i].length&&!full(bolts[i])){sel=i;S('blip');}else S('hit');return;}
  if(i===sel){sel=-1;S('blip');return;}
  if(!canTo(sel,i)){S('hit');A.shake=2;if(bolts[i].length)sel=-1;else sel=-1;return;}
  undo.push(bolts.map(b=>b.slice()));const a=bolts[sel],t=bolts[i],r=run(a);let k=0;
  while(k<r&&a.length&&t.length<CAP){const nut=a[a.length-1];const p=[npos(sel,0)[0],liftY(sel,a.length-1,r)];nut.fx=p[0];nut.fy=p[1];nut.t0=A.t;nut.d=k*3;t.push(a.pop());k++;}
  st.mv++;S('coin');if(a.length&&a[a.length-1].hid){a[a.length-1].hid=false;const q=npos(sel,a.length-1);A.burst(q[0],q[1],'#ffffff',8,1.5);}
  bolts.forEach((b,k)=>{if(b.length===CAP&&b.every(n=>n.c===b[0].c)&&b.some(n=>n.hid)){b.forEach((n,j)=>{if(n.hid){n.hid=false;const q=npos(k,j);A.burst(q[0],q[1],'#ffffff',6,1.4);}});if(k!==i){S('score');g.score+=20;}}});
  if(full(t)){const q=npos(i,CAP);A.burst(q[0],q[1]-10,NUTC[t[0].c],18,2.2);S('score');g.score+=20;}
  sel=-1;if(solved())lvWin(st,40+bolts.length*12,par+2);else if(!anyMove()){msg='STUCK!  B UNDOES';mt=200;}};
 g.update=()=>{pstep();if(mt)mt--;if(lvTick(st))return;const L=lay();
  if(P.mv||P.press){const i=Math.round((P.x-L.x0)/L.sp);if(i>=0&&i<L.n&&Math.abs(P.x-(L.x0+i*L.sp))<L.sp/2&&P.y>30&&P.y<222)cur=i;}
  if(P.press&&P.y>30&&P.y<222&&Math.abs(P.x-(L.x0+cur*L.sp))<L.sp/2)act(cur);else if(P.press&&inR(262,220,54,16))P.kb=1;else if(P.press){sel=-1;}
  if(P.d.l){cur=(cur+L.n-1)%L.n;S('blip');}if(P.d.r){cur=(cur+1)%L.n;S('blip');}
  if(P.ka)act(cur);
  if(P.kb||P.rc){if(sel>=0)sel=-1;else if(undo.length){bolts=undo.pop();st.mv++;S('blip');mt=0;}}};
 const nut=(x,y,w,ci,hid,lift)=>{blit('nut'+ci+w+(hid?1:0),x-w/2,y-8,w,17,(X,Y)=>nut0(X+w/2,Y+8,w,ci,hid));if(lift)sr(x-w/2,y-7.5,w,15,3,'rgba(255,255,255,.6)',1);};
 const nut0=(x,y,w,ci,hid)=>{const h=15,col=NUTC[ci]||'#888888';fr(x-w/2+1,y-h/2+2,w,h,3,'rgba(0,0,0,.35)');const cc=hid?'#4a4f66':col;
  fr(x-w/2,y-h/2,w,h,3,grad(x-w/2,0,x+w/2,0,[[0,lt(cc,.55)],[.18,lt(cc,.8)],[.24,lt(cc,1.2)],[.5,lt(cc,1.05)],[.76,lt(cc,.95)],[.82,lt(cc,.7)],[1,lt(cc,.5)]]));
  fr(x-w/2+2,y-h/2,w-4,2,1,'rgba(255,255,255,.35)');fr(x-w/2+2,y+h/2-2,w-4,2,1,'rgba(0,0,0,.25)');fr(x-3,y-h/2,6,h,1,'rgba(0,0,0,.18)');
  if(hid)T('?',x,y-2,'#c8d0e0',1,'c');};
 g.draw=()=>{bgd('#2c3e5c');const c=A.c,L=lay();
  fr(10,L.base+4,300,14,4,grad(0,L.base+4,0,L.base+18,[[0,'#a87850'],[1,'#6a4428']]));fr(10,L.base+4,300,2,1,'rgba(255,255,255,.25)');
  const top=L.base-(CAP*16)-14;
  bolts.forEach((b,i)=>{const x=L.x0+i*L.sp;if(i===cur&&!st.clr)fr(x-L.sp/2+2,top-34,L.sp-4,L.base-top+40,6,'rgba(255,255,255,.07)');
   fr(x-L.nw/2-2,L.base-2,L.nw+4,8,3,grad(0,L.base-2,0,L.base+6,[[0,'#d8e0f0'],[1,'#68708a']]));
   blit('bolt'+(L.base-top),x-4,top,8,L.base-top,(X,Y)=>{fr(X+.5,Y,7,L.base-top,3,grad(X,0,X+8,0,[[0,'#5a6278'],[.45,'#f0f4ff'],[1,'#5a6278']]));for(let yy=Y+4;yy<Y+L.base-top-2;yy+=4)ln(X+1,yy+2,X+7,yy,'rgba(0,0,0,.22)',1,'butt');});
   const r=sel===i?run(b):0;b.forEach((n,k)=>{const p=(A.t-n.t0-n.d)/16;if(p<1&&n.t0>-99){if(p<0){nut(n.fx,n.fy,L.nw,n.c,n.hid,1);return;}const q=npos(i,k),e=p*p*(3-2*p);nut(n.fx+(q[0]-n.fx)*e,n.fy+(q[1]-n.fy)*e-Math.sin(Math.PI*p)*26,L.nw,n.c,n.hid);return;}
    if(r&&k>=b.length-r)nut(x,liftY(i,k,r),L.nw,n.c,n.hid,1);else{const q=npos(i,k);nut(q[0],q[1],L.nw,n.c,n.hid);}});
   if(full(b)){fr(x-L.nw/2+3,top-6,L.nw-6,6,3,grad(0,top-6,0,top,[[0,'#fff0a0'],[1,'#c89a20']]));glow(x,top-3,10,'#ffd84a',.4+.3*pulse());}});
  hud(g,st,'MOVES '+st.mv+'   '+mmss(st.t));if(hidden)T('HIDDEN NUTS SHOW WHEN ON TOP',6,222,K.gr,1);
  bev(262,220,54,14,'#4a5578',4,2);T('B UNDO',289,224,K.w,1,'c');
  if(mt)T(msg,160,24,K.r,1,'c');lvDraw(st);pcur();};
 return g;}});

/* ================= 3. HEX STACK SORT ================= */
const HEXC=['#ff5a6e','#ffd84a','#4d9fff','#48d97c','#a870ff','#ffa53f'];
const hexP=(x,y,r,ky)=>{const c=A.c;c.beginPath();for(let k=0;k<6;k++){const a=Math.PI/6+k*Math.PI/3;const px=x+r*Math.cos(a),py=y+r*Math.sin(a)*ky;if(k)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();};
const hexF=(x,y,r,ky,col)=>{hexP(fin(x),fin(y),r,ky);A.c.fillStyle=col;A.c.fill();};
A.add({id:'hexsort',name:'HEX STACK SORT',cat:'PUZZLE',mouse:1,time:900,how:'PLACE HEX STACKS. SAME TOP COLOURS SLIDE TOGETHER. 10 OF ONE COLOUR CLEAR.',make(){
 const g={over:null,score:0},R=3,s=16,KY=.78,TH=2.6,CX=106,CY=128,TX=218,TY=24;pinit();
 const cells=[],at={};for(let r=-R;r<=R;r++)for(let q=Math.max(-R,-R-r);q<=Math.min(R,R-r);q++){const c={q,r,x:CX+s*1.732*(q+r/2),y:CY+s*1.5*KY*r,st:[],rock:0,hide:0};at[q+','+r]=c;cells.push(c);}
 const DIR=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];const nb=c=>DIR.map(d=>at[(c.q+d[0])+','+(c.r+d[1])]).filter(Boolean);
 let tray=[],sel=0,cur=at['0,0'],drag=0,q=[],fly=[],pops=[],busy=0,chain=0,cleared=0,goal=25,ncol=3,msg='',mt=0,iter=0,hov=null;
 const top=c=>c.st[c.st.length-1];
 const runOf=c=>{const t=top(c);let n=0;for(let i=c.st.length-1;i>=0&&c.st[i]===t;i--)n++;return n;};
 const pure=c=>c.st.length>0&&c.st.every(v=>v===c.st[0]);
 const mkStack=()=>{const n=2+ri(4+Math.min(2,st.lvl>>1)),o=[];let c=ri(ncol);for(let i=0;i<n;i++){if(i>0&&rnd(1)<.32)c=(c+1+ri(ncol-1))%ncol;o.push(c);}return o;};
 const gen=l=>{goal=[25,40,55,70,90][l-1];ncol=[3,4,4,5,6][l-1];cells.forEach(c=>{c.st=[];c.rock=0;c.hide=0;});const nr=[0,2,4,6,8][l-1];let k=0;while(k<nr){const c=cells[ri(cells.length)];if(!c.rock&&(c.q||c.r)){c.rock=1;k++;}}cleared=0;tray=[mkStack(),mkStack(),mkStack()];sel=0;q=[];fly=[];pops=[];busy=0;};
 const st=LV(g,5,gen);lvStart(st);
 const transfer=(a,b)=>{const n=runOf(a),la=a.st.length,lb=b.st.length;for(let k=0;k<n;k++){const col=a.st.pop();b.st.push(col);fly.push({col,x0:a.x,y0:a.y-(la-1-k)*TH,c:b,idx:lb+k,t:-k*2});b.hide++;}S('blip');};
 const clearTop=c=>{const n=runOf(c),col=top(c);for(let k=0;k<n;k++){const i=c.st.length-1;pops.push({x:c.x,y:c.y-i*TH,col,t:-k});c.st.pop();}chain++;const pts=n*5*chain;g.score+=pts;cleared+=n;A.burst(c.x,c.y-12,HEXC[col],20,2.5);S(chain>1?'win':'score');A.shake=3+chain*2;msg=chain>1?'CHAIN X'+chain+'!  +'+pts:'CLEAR!  +'+pts;mt=60;};
 const proc=()=>{while(q.length&&iter++<400){const c=q.shift();if(!c.st.length||c.rock)continue;const col=top(c);const ns=nb(c).filter(n=>n.st.length&&!n.rock&&top(n)===col);
   if(ns.length){ns.sort((a,b)=>runOf(b)-runOf(a));let src=ns[0],dst=c;if(pure(src)&&!pure(c)){src=c;dst=ns[0];}transfer(src,dst);q.unshift(dst);if(src.st.length)q.push(src);return true;}
   if(runOf(c)>=10){clearTop(c);q.push(c,...nb(c));return true;}}return false;};
 const placeAt=c=>{if(!c||c.rock||c.st.length||!tray[sel]){S('hit');return;}c.st=tray[sel].slice();g.score+=c.st.length;tray[sel]=null;st.mv++;A.burst(c.x,c.y,'#ffffff',6,1.2);
  if(tray.every(v=>!v))tray=[mkStack(),mkStack(),mkStack()];if(!tray[sel])sel=tray.findIndex(v=>v);q=[c];busy=1;iter=0;chain=0;S('hit');};
 const slot=()=>{for(let i=0;i<3;i++)if(inR(TX,TY+i*66,92,62))return i;return -1;};
 g.cheat=()=>{const c0=at['0,0'];c0.st=[];c0.rock=0;nb(c0).forEach((n,k)=>{n.rock=0;n.st=k<2?[1,0,0,0,0,0]:k<4?[2,1]:[];});tray[sel]=[0];cur=c0;placeAt(c0);};
 const near=()=>{let b=null,bd=s*1.05;cells.forEach(c=>{const d=Math.hypot(P.x-c.x,(P.y-c.y)/KY);if(d<bd){bd=d;b=c;}});return b;};
 const kmove=()=>{const d=P.d;let n=null;if(d.l)n=at[(cur.q-1)+','+cur.r];if(d.r)n=at[(cur.q+1)+','+cur.r];if(d.u||d.d){const r=cur.r+(d.u?-1:1);let bd=1e9;cells.forEach(c=>{if(c.r===r){const dd=Math.abs(c.x-cur.x);if(dd<bd){bd=dd;n=c;}}});}if(n){cur=n;S('blip');}};
 g.update=()=>{pstep();if(mt)mt--;fly.forEach(f=>{f.t++;if(f.t===12)f.c.hide--;});fly=fly.filter(f=>f.t<12);pops.forEach(p=>p.t++);pops=pops.filter(p=>p.t<22);
  if(lvTick(st))return;if(P.mv||P.press)hov=near();if(hov&&(P.mv||P.press))cur=hov;
  if(busy){if(!fly.length&&!pops.length&&!proc()){busy=0;chain=0;if(cleared>=goal)lvWin(st,goal*3,0,0);else if(!cells.some(c=>!c.rock&&!c.st.length)){g.over='BOARD FULL';S('lose');}}return;}
  if(P.press){const i=slot();if(i>=0&&tray[i]){sel=i;drag=1;S('blip');}else if(hov)placeAt(hov);}
  if(P.rel&&drag){drag=0;if(hov&&!inR(TX,TY,92,198))placeAt(hov);}
  kmove();if(P.kb){for(let k=1;k<=3;k++){const j=(sel+k)%3;if(tray[j]){sel=j;break;}}S('blip');}if(P.ka)placeAt(cur);};
 const tile=(x,y,ci,rad,tp)=>blit('hx'+ci+rad+tp,x-rad,y-rad*KY,rad*2,rad*2*KY+TH,(X,Y)=>{const col=HEXC[ci],xx=X+rad,yy=Y+rad*KY;hexF(xx,yy+TH,rad,KY,lt(col,.5));hexF(xx,yy,rad,KY,tp?grad(0,yy-rad*KY,0,yy+rad*KY,[[0,lt(col,1.3)],[1,col]]):lt(col,.85));});
 const stack=(x,y,arr,n,rad,al)=>{for(let k=0;k<n;k++)tile(x,y-k*TH,arr[k],rad,k===n-1?1:0);
  if(n){const yy=y-(n-1)*TH;hexP(x,yy,rad*.62,KY);A.c.strokeStyle='rgba(255,255,255,.35)';A.c.lineWidth=1;A.c.stroke();let r=1;for(let i=n-2;i>=0&&arr[i]===arr[n-1];i--)r++;if(r>1)T(r,x,yy-3,'rgba(20,20,40,.85)',1,'c');}};
 g.draw=()=>{bgd('#3a2a5e');const c=A.c;
  blit('hxboard',CX-s*7.4,CY-s*7.4*KY,s*14.8,s*14.8*KY+6,(X,Y)=>{const ox=X-CX+s*7.4,oy=Y-CY+s*7.4*KY;hexF(CX+ox,CY+6+oy,s*7.3,KY,'rgba(0,0,0,.3)');hexF(CX+ox,CY+oy,s*7.3,KY,grad(0,CY+oy-90,0,CY+oy+90,[[0,'#5a4a8a'],[1,'#33275a']]));cells.forEach(e=>{hexF(e.x+ox,e.y+oy,s-1,KY,'rgba(10,6,30,.55)');hexP(e.x+ox,e.y+oy,s-1,KY);A.c.strokeStyle='rgba(255,255,255,.1)';A.c.lineWidth=1;A.c.stroke();});});
  cells.forEach(e=>{if(e.rock){hexF(e.x,e.y+3,s-1,KY,'#3a3a48');hexF(e.x,e.y,s-1,KY,grad(0,e.y-12,0,e.y+12,[[0,'#9a9aaa'],[1,'#5a5a6a']]));A.circ(e.x-4,e.y-2,3,'#7a7a8a');A.circ(e.x+4,e.y+2,2.5,'#6a6a7a');}});
  const show=tray[sel]&&!busy&&cur&&!cur.rock&&!cur.st.length&&(!P.used||hov===cur);
  cells.forEach(e=>{if(e.rock)return;const n=e.st.length-e.hide;if(e===cur&&!busy&&!st.clr){hexP(e.x,e.y,s,KY);c.strokeStyle=rgba('#ffd84a',.5+.5*pulse());c.lineWidth=2;c.stroke();}
   if(show&&e===cur){c.globalAlpha=.45;stack(e.x,e.y,tray[sel],tray[sel].length,s-2);c.globalAlpha=1;}if(n>0)stack(e.x,e.y,e.st,n,s-2);});
  fly.forEach(f=>{const p=cl(f.t/12,0,1),e=p*p*(3-2*p),tx=f.c.x,ty=f.c.y-f.idx*TH;const x=f.x0+(tx-f.x0)*e,y=f.y0+(ty-f.y0)*e-Math.sin(Math.PI*p)*22;tile(x,y,f.col,s-2,1);});
  pops.forEach(p=>{if(p.t<0){hexF(p.x,p.y,s-2,KY,HEXC[p.col]);return;}const k=1-p.t/22;c.globalAlpha=k;hexF(p.x,p.y-p.t*2.2,(s-2)*(1+p.t*.03),KY,p.t<4?'#ffffff':HEXC[p.col]);c.globalAlpha=1;});
  for(let i=0;i<3;i++){const y=TY+i*66,t=tray[i];well(TX,y,92,62,8,i===sel&&t?'rgba(255,216,74,.14)':'rgba(0,0,0,.3)');if(i===sel&&t)cbox(TX,y,92,62,8);if(t&&!(drag&&i===sel))stack(TX+46,y+40,t,t.length,14);}
  if(drag&&tray[sel]&&!hov)stack(P.x,P.y+6,tray[sel],tray[sel].length,s-2);
  hud(g,st,'CLEARED '+Math.min(cleared,goal)+'/'+goal);fr(8,20,196,4,2,'rgba(0,0,0,.4)');fr(8,20,196*Math.min(1,cleared/goal),4,2,K.g);
  if(mt){c.globalAlpha=Math.min(1,mt/20);T(msg,CX,214,chain>1?K.o:K.y,2,'c');c.globalAlpha=1;}lvDraw(st);pcur();};
 return g;}});

/* ================= 4. ARROW ESCAPE ================= */
const heart=(x,y,r,col)=>{A.circ(x-r*.5,y,r*.6,col);A.circ(x+r*.5,y,r*.6,col);A.poly([[x-r*1.05,y+r*.15],[x+r*1.05,y+r*.15],[x,y+r*1.2]],col,1);};
A.add({id:'arrowescape',name:'ARROW ESCAPE',cat:'PUZZLE',mouse:1,time:600,how:'TAP AN ARROW TO SLIDE IT OFF. IF IT HITS ANOTHER ARROW YOU LOSE A HEART.',make(){
 const g={over:null,score:0},DV=[[0,-1],[1,0],[0,1],[-1,0]],DC=['#4d9fff','#ffa53f','#48d97c','#ff6fcf'];pinit();
 let N=5,CS=36,OX=0,OY=0,arr=[],occ=[],cur={x:2,y:2},hearts=5,dead=0,total=0;
 const gen=l=>{N=[5,6,7,8,9,10][l-1];const maxL=[2,2,3,3,4,4][l-1];CS=Math.min(34,Math.floor(196/N));OX=Math.round(160-N*CS/2);OY=Math.round(23+(200-N*CS)/2);
  for(let tr=0;tr<20;tr++){arr=[];occ=Array(N*N).fill(-1);
   for(let k=0;k<N*N*12;k++){const x=ri(N),y=ri(N),d=ri(4),L=1+ri(maxL),v=DV[d],cells=[];let ok=true;for(let i=0;i<L;i++){const cx=x-v[0]*i,cy=y-v[1]*i;if(cx<0||cy<0||cx>=N||cy>=N||occ[cy*N+cx]>=0){ok=false;break;}cells.push([cx,cy]);}if(!ok)continue;
    let px=x+v[0],py=y+v[1];while(px>=0&&py>=0&&px<N&&py<N){if(occ[py*N+px]>=0){ok=false;break;}px+=v[0];py+=v[1];}if(!ok)continue;const id=arr.length;arr.push({cells,d,off:0,st:0,fl:0,sp:0,bt:0,bump:0});cells.forEach(c=>occ[c[1]*N+c[0]]=id);}
   if(occ.filter(v=>v>=0).length>=N*N*.72)break;}
  total=arr.length;cur={x:N>>1,y:N>>1};};
 const st=LV(g,6,gen);lvStart(st);
 g.cheat=()=>{for(let i=arr.length-1;i>=0;i--)tap(i);};
 const tap=id=>{const a=arr[id];if(!a||a.st)return;const v=DV[a.d],h=a.cells[0];let px=h[0]+v[0],py=h[1]+v[1],dist=0,blk=-1;while(px>=0&&py>=0&&px<N&&py<N){const o=occ[py*N+px];if(o>=0&&o!==id){blk=o;break;}dist++;px+=v[0];py+=v[1];}st.mv++;
  if(blk<0){a.st=1;a.sp=2;a.cells.forEach(c=>occ[c[1]*N+c[0]]=-1);g.score+=10+st.lvl*2;S('coin');}
  else{a.st=2;a.bt=0;a.bump=dist;arr[blk].fl=24;hearts--;S('hit');A.shake=5;const q=[OX+px*CS+CS/2,OY+py*CS+CS/2];A.burst(q[0],q[1],'#ff3050',10,1.8);}};
 g.update=()=>{pstep();if(lvTick(st))return;
  arr.forEach(a=>{if(a.fl)a.fl--;if(a.st===1){a.sp+=.9;a.off+=a.sp;if(a.off>CS*(N+a.cells.length)+60)a.st=3;}else if(a.st===2){a.bt++;const D=a.bump*CS+CS*.3;a.off=a.bt<8?D*a.bt/8:D*Math.max(0,1-(a.bt-8)/10);if(a.bt>=18){a.st=0;a.off=0;}}});
  const busy=arr.some(a=>a.st===1||a.st===2);
  if(hearts<=0){if(!busy){g.over='OUT OF HEARTS';S('lose');}return;}
  if(arr.every(a=>a.st===3)){hearts=Math.min(5,hearts+1);lvWin(st,N*8,total);return;}
  gmouse(cur,OX,OY,CS,N,N);gcur(cur,N,N);
  if((P.press&&inR(OX,OY,N*CS,N*CS))||P.ka){const id=occ[cur.y*N+cur.x];if(id>=0)tap(id);else S('blip');}};
 const dra=(a,hl)=>{const v=DV[a.d],h=a.cells[0],t=a.cells[a.cells.length-1],o=a.off,col=a.fl&&a.fl%8<4?'#ff3050':DC[a.d],w=CS*.34;
  const hx=OX+h[0]*CS+CS/2+v[0]*o,hy=OY+h[1]*CS+CS/2+v[1]*o,tx=OX+t[0]*CS+CS/2+v[0]*o-v[0]*CS*.22,ty=OY+t[1]*CS+CS/2+v[1]*o-v[1]*CS*.22;
  if(hl)glow((hx+tx)/2,(hy+ty)/2,CS*(a.cells.length*.5+.6),'#ffffff',.25);
  ln(tx+1,ty+3,hx+1,hy+3,'rgba(0,0,0,.35)',w);ln(tx,ty+2,hx,hy+2,lt(col,.5),w);ln(tx,ty,hx,hy,hl?lt(col,1.2):col,w);
  const pp=[-v[1],v[0]],hw=v[0]?0:1;ln(tx-hw*w*.2,ty-(1-hw)*w*.2,hx-hw*w*.2,hy-(1-hw)*w*.2,'rgba(255,255,255,.35)',w*.28);
  const tip=[hx+v[0]*CS*.44,hy+v[1]*CS*.44],b1=[hx+pp[0]*CS*.34-v[0]*CS*.04,hy+pp[1]*CS*.34-v[1]*CS*.04],b2=[hx-pp[0]*CS*.34-v[0]*CS*.04,hy-pp[1]*CS*.34-v[1]*CS*.04];
  A.poly([[tip[0]+1,tip[1]+3],[b1[0]+1,b1[1]+3],[b2[0]+1,b2[1]+3]],'rgba(0,0,0,.35)',1);A.poly([[tip[0],tip[1]+2],[b1[0],b1[1]+2],[b2[0],b2[1]+2]],lt(col,.5),1);A.poly([tip,b1,b2],lt(col,hl?1.35:1.15),1);};
 g.draw=()=>{bgd('#20385a');const c=A.c;bev(OX-8,OY-8,N*CS+16,N*CS+16,'#2e4a72',10,4);fr(OX-4,OY-4,N*CS+8,N*CS+8,7,'#182a46');
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)A.rect(OX+x*CS+CS/2-1,OY+y*CS+CS/2-1,2,2,'#2f4a70');
  const hid=occ[cur.y*N+cur.x];if(!st.clr){if(hid>=0&&arr[hid]&&!arr[hid].st){const a=arr[hid],v=DV[a.d];let px=a.cells[0][0]+v[0],py=a.cells[0][1]+v[1];c.globalAlpha=.35;while(px>=0&&py>=0&&px<N&&py<N){A.circ(OX+px*CS+CS/2,OY+py*CS+CS/2,2,'#ffffff');px+=v[0];py+=v[1];}c.globalAlpha=1;}cbox(OX+cur.x*CS+1,OY+cur.y*CS+1,CS-2,CS-2,5,'rgba(255,255,255,.5)');}
  arr.forEach((a,i)=>{if(a.st!==3)dra(a,i===hid&&!a.st);});
  hud(g,st,'');for(let i=0;i<5;i++)heart(140+i*10,8,4,i<hearts?'#ff5a6e':'#4a3a5a');
  T('ARROWS '+arr.filter(a=>a.st!==3&&a.st!==1).length,6,229,K.gr,1);T('MOVES '+st.mv,W-6,229,K.gr,1,'r');lvDraw(st);pcur();};
 return g;}});

/* ================= 5. UNTANGLE ================= */
const ccw=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const segX=(a,b,c,d)=>{const d1=ccw(c,d,a),d2=ccw(c,d,b),d3=ccw(a,b,c),d4=ccw(a,b,d);return((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));};
A.add({id:'untangle',name:'UNTANGLE',cat:'PUZZLE',mouse:1,time:900,how:'DRAG THE DOTS (OR A GRABS, A DROPS) UNTIL NO LINES CROSS.',make(){
 const g={over:null,score:0};pinit();
 let pts=[],E=[],grab=-1,gm=0,cx=160,cy=128,crossE=new Set(),ncross=0,hov=-1,wt=0,spd=1.2,orig=[];
 const crossings=()=>{crossE=new Set();let n=0;for(let i=0;i<E.length;i++)for(let j=i+1;j<E.length;j++){const[a,b]=E[i],[c,d]=E[j];if(a===c||a===d||b===c||b===d)continue;if(segX(pts[a],pts[b],pts[c],pts[d])){n++;crossE.add(i);crossE.add(j);}}return n;};
 const gen=l=>{const n=[6,8,10,12,14,16][l-1];for(let tr=0;tr<80;tr++){const Q=[];let k=0;while(Q.length<n&&k++<4000){const p={x:30+rnd(260),y:36+rnd(184)};if(Q.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>36))Q.push(p);}if(Q.length<n)continue;
   const cand=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)cand.push([i,j,Math.hypot(Q[i].x-Q[j].x,Q[i].y-Q[j].y)]);cand.sort((a,b)=>a[2]-b[2]);const deg=Array(n).fill(0),ed=[];
   for(const[i,j,d]of cand){if(d>135||deg[i]>=4||deg[j]>=4)continue;if(ed.some(([a,b])=>a!==i&&a!==j&&b!==i&&b!==j&&segX(Q[i],Q[j],Q[a],Q[b])))continue;let thru=false;for(let m=0;m<n;m++){if(m===i||m===j)continue;const t=((Q[m].x-Q[i].x)*(Q[j].x-Q[i].x)+(Q[m].y-Q[i].y)*(Q[j].y-Q[i].y))/(d*d);if(t>0&&t<1&&Math.abs(ccw(Q[i],Q[j],Q[m]))/d<10)thru=true;}if(thru)continue;ed.push([i,j]);deg[i]++;deg[j]++;}
   const par=[...Array(n).keys()];const f=x=>par[x]===x?x:(par[x]=f(par[x]));ed.forEach(([a,b])=>{par[f(a)]=f(b);});if(new Set(par.map(f)).size>1||ed.length<n||deg.some(d=>d<2))continue;
   E=ed;orig=Q.map(p=>({...p}));const ord=shuf([...Array(n).keys()]);pts=Q.map(()=>({x:160,y:128,dx:160,dy:128}));ord.forEach((i,k)=>{const a=k/n*6.2832-1.57;pts[i].x=160+Math.cos(a)*120;pts[i].y=128+Math.sin(a)*90;});ncross=crossings();if(ncross>=Math.max(2,n>>1))break;}
  grab=-1;wt=0;ncross=crossings();};
 const st=LV(g,6,gen);lvStart(st);
 g.cheat=()=>{orig.forEach((p,i)=>{pts[i].x=p.x;pts[i].y=p.y;});ncross=crossings();if(!ncross)wt=2;};
 g.update=()=>{pstep();if(lvTick(st))return;pts.forEach(p=>{p.dx+=(p.x-p.dx)*.25;p.dy+=(p.y-p.dy)*.25;});
  if(wt){if(--wt===0)lvWin(st,pts.length*7,Math.ceil(pts.length*1.2));return;}
  if(P.used){cx=P.x;cy=P.y;}else{const k=A.in(0),ax=(k.r?1:0)-(k.l?1:0),ay=(k.d?1:0)-(k.u?1:0);spd=ax||ay?Math.min(4.5,spd+.12):1.2;cx=cl(cx+ax*spd,8,312);cy=cl(cy+ay*spd,22,232);}
  hov=-1;let bd=14;pts.forEach((p,i)=>{const d=Math.hypot(p.x-cx,p.y-cy);if(d<bd){bd=d;hov=i;}});
  if(grab<0){if((P.press||P.ka)&&hov>=0){grab=hov;gm=P.press?1:0;S('blip');}}
  else{const p=pts[grab];p.x=cl(cx,10,310);p.y=cl(cy,24,230);ncross=crossings();
   if(gm?(P.rel||!P.dn):(P.ka||P.press)){grab=-1;st.mv++;S('hit');if(ncross===0){wt=45;S('coin');A.burst(160,128,K.g,24,3);}}}};
 g.draw=()=>{bgd('#15214a');const c=A.c;c.fillStyle='rgba(255,255,255,.035)';for(let x=0;x<W;x+=20)c.fillRect(x,17,1,H);for(let y=20;y<H;y+=20)c.fillRect(0,y,W,1);
  const ok=ncross===0;E.forEach(([a,b],i)=>{const p=pts[a],q=pts[b],x=crossE.has(i);ln(p.dx+1,p.dy+2,q.dx+1,q.dy+2,'rgba(0,0,0,.35)',3);ln(p.dx,p.dy,q.dx,q.dy,ok?(wt%10<5?'#7dffa8':'#48d97c'):x?'#ff5a6e':'#5fd0ff',x?3:2.5);ln(p.dx,p.dy-.5,q.dx,q.dy-.5,'rgba(255,255,255,.25)',.8);});
  pts.forEach((p,i)=>{const big=i===grab,r=big?8:i===hov?7:6;fr(p.dx-r+1,p.dy-r+3,r*2,r*2,r,'rgba(0,0,0,.35)');if(big)glow(p.dx,p.dy,18,'#ffd84a',.5);A.circ(p.dx,p.dy,r,big?'#ffd84a':i===hov?'#ffffff':'#c8d8ff');A.ring(p.dx,p.dy,r,big?'#a07a10':'#46507a');});
  if(!P.used&&grab<0&&!st.clr){A.ring(cx,cy,10,rgba('#ffd84a',.5+.4*pulse()));ln(cx-4,cy,cx+4,cy,K.y,1);ln(cx,cy-4,cx,cy+4,K.y,1);}
  hud(g,st,ok?'UNTANGLED!':'CROSSINGS '+ncross,ok?K.g:K.r);T('MOVES '+st.mv+'   '+mmss(st.t),160,229,K.gr,1,'c');lvDraw(st);pcur();};
 return g;}});

/* ================= 6. BRIDGES ================= */
A.add({id:'bridges',name:'BRIDGES',cat:'PUZZLE',mouse:1,time:900,how:'LINK ISLANDS WITH 1-2 BRIDGES TO MATCH THEIR NUMBERS. NO CROSSING. JOIN ALL.',make(){
 const g={over:null,score:0},DV=[[0,-1],[1,0],[0,1],[-1,0]];pinit();
 let sed=[],N=7,CS=28,OX=0,OY=0,isl=[],imap=[],pb={},cur=0,sel=-1,dragF=-1,dsx=0,dsy=0,wt=0,need=0,flash=0;
 const gen=l=>{N=[7,7,8,9,10][l-1];CS=Math.min(30,Math.floor(200/N));OX=Math.round(160-N*CS/2);OY=Math.round(22+(206-N*CS)/2);const target=Math.round(N*N*[.2,.24,.24,.25,.26][l-1]);
  for(let tr=0;tr<60;tr++){const gr=Array(N*N).fill(0),I=[],ed=[];const add=(x,y)=>{I.push({x,y,n:0});gr[y*N+x]=I.length;};add(1+ri(N-2),1+ri(N-2));
   for(let it=0;it<3000&&I.length<target;it++){const i=ri(I.length),v=DV[ri(4)],len=2+ri(Math.max(1,N-3)),a=I[i];let ok=true;
    for(let s=1;s<len;s++){const x=a.x+v[0]*s,y=a.y+v[1]*s;if(x<0||y<0||x>=N||y>=N||gr[y*N+x]!==0){ok=false;break;}}
    const tx=a.x+v[0]*len,ty=a.y+v[1]*len;if(!ok||tx<0||ty<0||tx>=N||ty>=N||gr[ty*N+tx]!==0)continue;
    if(DV.some(w=>{const x=tx+w[0],y=ty+w[1];return x>=0&&y>=0&&x<N&&y<N&&gr[y*N+x]>0;}))continue;
    for(let s=1;s<len;s++)gr[(a.y+v[1]*s)*N+a.x+v[0]*s]=-1;add(tx,ty);const c=rnd(1)<.35?2:1;ed.push([i,I.length-1,c]);I[i].n+=c;I[I.length-1].n+=c;}
   if(I.length<target*.85&&tr<59)continue;
   for(let i=0;i<I.length;i++)for(const d of[1,2]){const v=DV[d];let x=I[i].x+v[0],y=I[i].y+v[1];const path=[];while(x>=0&&y>=0&&x<N&&y<N&&gr[y*N+x]===0){path.push(y*N+x);x+=v[0];y+=v[1];}
    if(x<0||y<0||x>=N||y>=N||gr[y*N+x]<=0||!path.length)continue;const j=gr[y*N+x]-1;if(rnd(1)<.3){path.forEach(p=>{gr[p]=-1;});const c=rnd(1)<.3?2:1;ed.push([i,j,c]);I[i].n+=c;I[j].n+=c;}}
   isl=I;sed=ed;need=ed.reduce((s,e)=>s+e[2],0);break;}
  imap=Array(N*N).fill(-1);isl.forEach((o,i)=>{imap[o.y*N+o.x]=i;});pb={};sel=-1;cur=0;wt=0;};
 const st=LV(g,5,gen);lvStart(st);
 g.cheat=()=>{pb={};sed.forEach(([i,j,c])=>{pb[i<j?i+'-'+j:j+'-'+i]=c;});if(won())wt=2;};
 const key=(i,j)=>i<j?i+'-'+j:j+'-'+i;
 const nbr=(i,d)=>{const v=DV[d];let x=isl[i].x+v[0],y=isl[i].y+v[1];while(x>=0&&y>=0&&x<N&&y<N){const k=imap[y*N+x];if(k>=0)return k;x+=v[0];y+=v[1];}return -1;};
 const occ=()=>{const o=Array(N*N).fill(0);for(const k in pb){const[i,j]=k.split('-').map(Number),a=isl[i],b=isl[j],h=a.y===b.y;const dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y);let x=a.x+dx,y=a.y+dy;while(x!==b.x||y!==b.y){o[y*N+x]=h?1:2;x+=dx;y+=dy;}}return o;};
 const sum=i=>{let s=0;for(const k in pb){const[a,b]=k.split('-').map(Number);if(a===i||b===i)s+=pb[k];}return s;};
 const dirTo=(i,j)=>{const a=isl[i],b=isl[j];if(a.x===b.x)return b.y<a.y?0:2;if(a.y===b.y)return b.x>a.x?1:3;return -1;};
 const won=()=>{if(!isl.every((o,i)=>sum(i)===o.n))return false;const seen=new Set([0]),q=[0];while(q.length){const i=q.pop();for(const k in pb){const[a,b]=k.split('-').map(Number);const o=a===i?b:b===i?a:-1;if(o>=0&&!seen.has(o)){seen.add(o);q.push(o);}}}return seen.size===isl.length;};
 const cycle=(i,d)=>{const j=nbr(i,d);if(j<0){S('hit');return;}const k=key(i,j),c=pb[k]||0;
  if(!c){const o=occ(),v=DV[d],h=d%2===1?1:2;let x=isl[i].x+v[0],y=isl[i].y+v[1];while(x!==isl[j].x||y!==isl[j].y){if(o[y*N+x]&&o[y*N+x]!==h){S('hit');A.shake=3;flash=20;return;}x+=v[0];y+=v[1];}}
  pb[k]=(c+1)%3;if(!pb[k])delete pb[k];st.mv++;S(pb[k]?'blip':'hit');const a=isl[i],b=isl[j];if(pb[k])A.burst((a.x+b.x+1)*CS/2+OX,(a.y+b.y+1)*CS/2+OY,'#e8c090',6,1.2);if(won()){wt=40;S('coin');}};
 const hovI=()=>{let b=-1,bd=CS*.6;isl.forEach((o,i)=>{const d=Math.hypot(P.x-(OX+o.x*CS+CS/2),P.y-(OY+o.y*CS+CS/2));if(d<bd){bd=d;b=i;}});return b;};
 const best=(i,d)=>{const v=DV[d],a=isl[i];let b=-1,bs=1e9;isl.forEach((o,j)=>{if(j===i)return;const dx=o.x-a.x,dy=o.y-a.y,al=dx*v[0]+dy*v[1],pp=Math.abs(dx*v[1]-dy*v[0]);if(al<=0)return;const s=al+pp*2.5;if(s<bs){bs=s;b=j;}});return b;};
 g.update=()=>{pstep();if(flash)flash--;if(lvTick(st))return;if(wt){if(--wt===0)lvWin(st,isl.length*7,Math.ceil(need/1.5)+4);return;}
  const h=(P.mv||P.press||P.rel)?hovI():-1;if(h>=0&&(P.mv||P.press))cur=h;
  if(P.press){if(h>=0){const d=sel>=0&&h!==sel?dirTo(sel,h):-1;if(d>=0&&nbr(sel,d)===h){cycle(sel,d);sel=-1;}else{sel=h;dragF=h;dsx=P.x;dsy=P.y;S('blip');}}else sel=-1;}
  if(P.rel&&dragF>=0){let d=-1;if(h>=0&&h!==dragF){d=dirTo(dragF,h);if(d>=0&&nbr(dragF,d)!==h)d=-1;}else if(h<0){const dx=P.x-dsx,dy=P.y-dsy;if(Math.max(Math.abs(dx),Math.abs(dy))>CS*.6)d=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);}if(d>=0){cycle(dragF,d);sel=-1;}dragF=-1;}
  const D=P.d,kd=D.u?0:D.r?1:D.d?2:D.l?3:-1;
  if(kd>=0){if(sel>=0)cycle(sel,kd);else{const b=best(cur,kd);if(b>=0){cur=b;S('blip');}}}
  if(P.ka){sel=sel>=0?-1:cur;S('blip');}if(P.kb&&sel>=0)sel=-1;};
 g.draw=()=>{bgd('#1c6494');const c=A.c;for(let y=26;y<H;y+=16){const o=(A.t*.25+y*1.7)%28;c.fillStyle='rgba(255,255,255,.07)';for(let x=-28+o;x<W;x+=28)c.fillRect(x,y+Math.sin((x+A.t)*.05)*1.5,9,1);}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)A.rect(OX+x*CS+CS/2,OY+y*CS+CS/2,1,1,'rgba(255,255,255,.2)');
  const cx=i=>OX+isl[i].x*CS+CS/2,cy=i=>OY+isl[i].y*CS+CS/2;
  for(const k in pb){const[i,j]=k.split('-').map(Number),h=isl[i].y===isl[j].y,n=pb[k];for(let m=0;m<n;m++){const o=n===2?(m?3.2:-3.2):0,ox=h?0:o,oy=h?o:0;ln(cx(i)+ox,cy(i)+oy+2,cx(j)+ox,cy(j)+oy+2,'rgba(0,0,0,.35)',4.4,'butt');ln(cx(i)+ox,cy(i)+oy,cx(j)+ox,cy(j)+oy,'#6a4428',4.4,'butt');ln(cx(i)+ox,cy(i)+oy-.4,cx(j)+ox,cy(j)+oy-.4,flash%8>3?'#ff7a7a':'#e0ac6c',2.6,'butt');}}
  if(dragF>=0&&P.dn){c.globalAlpha=.6;ln(cx(dragF),cy(dragF),P.x,P.y,'#ffffff',1.5);c.globalAlpha=1;}
  if(sel>=0)for(let d=0;d<4;d++){const j=nbr(sel,d);if(j>=0){glow(cx(j),cy(j),CS*.7,'#ffd84a',.35+.25*pulse());}}
  const r=CS*.42;isl.forEach((o,i)=>{const s=sum(i),col=s===o.n?'#7ee08a':s>o.n?'#ff7a7a':'#f2d7a0',x=cx(i),y=cy(i);fr(x-r+1,y-r+3,r*2,r*2,r,'rgba(0,0,0,.35)');A.circ(x,y,r,col);A.ring(x,y,r,lt(col,.55));T(o.n,x+1,y-4,'#3a2a1a',2,'c');
   if(i===sel){A.ring(x,y,r+2.5,K.y);A.ring(x,y,r+3.5,rgba('#ffd84a',.6));}else if(i===cur&&!st.clr&&(!P.used||sel<0))A.ring(x,y,r+2.5,rgba('#ffffff',.5+.4*pulse()));});
  hud(g,st,'BRIDGES '+Object.values(pb).reduce((a,b)=>a+b,0)+'/'+need);T(sel>=0?'ARROW OR CLICK A NEIGHBOUR: +1 BRIDGE (3RD REMOVES)':'MOVES '+st.mv+'   '+mmss(st.t),160,229,K.w,1,'c');lvDraw(st);pcur();};
 return g;}});

/* ================= 7. MATH GRID ================= */
const D4=[[1,0],[-1,0],[0,1],[0,-1]];
const latin=n=>{const r=shuf([...Array(n).keys()]),c=shuf([...Array(n).keys()]),s=shuf([...Array(n).keys()].map(i=>i+1));const o=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++)o.push(s[(r[y]+c[x])%n]);return o;};
const padN=(g,N,OX,OY,CS,cur,v,lock,setV,PX)=>{/* number palette for mouse: returns true if a button was clicked */
 const cols=2,bw=34,bh=24;for(let k=0;k<=N;k++){const x=PX+(k%cols)*(bw+4),y=46+(k/cols|0)*(bh+6);if(P.press&&inR(x,y,bw,bh)){setV(k===N?0:k+1);return true;}}return false;};
const padDraw=(N,PX,curV)=>{const bw=34,bh=24;T('PICK',PX+36,34,K.gr,1,'c');for(let k=0;k<=N;k++){const x=PX+(k%2)*(bw+4),y=46+(k/2|0)*(bh+6),val=k===N?0:k+1,on=val===curV&&val>0,ho=inR(x,y,bw,bh)&&P.used;bev(x,y,bw,bh,on?'#ffd84a':ho?'#7a8ad0':'#5a6aa8',5,3);T(k===N?'CLR':val,x+bw/2+(k===N?0:1),y+(k===N?9:7),on?'#3a2a10':K.w,k===N?1:2,'c');}};
A.add({id:'mathgrid',name:'MATH GRID',cat:'PUZZLE',mouse:1,time:900,how:'NO REPEATS PER ROW OR COLUMN. EACH CAGE MUST HIT ITS TARGET. A/B SET NUMBERS.',make(){
 const g={over:null,score:0},CT=['#fff2d6','#dcefff','#e3fbdc','#ffe3ef','#ece3ff','#fff8c8','#d8f6f2'];pinit();
 let N=4,CS=40,OX=0,OY=0,sol=[],cage=[],cages=[],v=[],lock=[],cur={x:0,y:0},hv={x:-1,y:-1},wt=0;
 const gen=l=>{N=[4,4,5,5,6][l-1];CS=[42,42,36,36,31][l-1];OX=Math.round(116-N*CS/2);OY=Math.round(24+(204-N*CS)/2);sol=latin(N);cage=Array(N*N).fill(-1);cages=[];
  for(const s0 of shuf([...Array(N*N).keys()])){if(cage[s0]>=0)continue;const r=rnd(1),want=r<.1?1:r<.6?2:r<.94?3:4,cs=[s0];cage[s0]=cages.length;
   while(cs.length<want){const fr_=[];cs.forEach(i=>{const x=i%N,y=i/N|0;D4.forEach(d=>{const nx=x+d[0],ny=y+d[1];if(nx>=0&&ny>=0&&nx<N&&ny<N&&cage[ny*N+nx]<0)fr_.push(ny*N+nx);});});if(!fr_.length)break;const p=fr_[ri(fr_.length)];cage[p]=cages.length;cs.push(p);}
   const vals=cs.map(i=>sol[i]);let op='',t=vals[0];if(cs.length===2){const a=Math.max(...vals),b=Math.min(...vals),r2=rnd(1);if(a%b===0&&r2<.4){op='/';t=a/b;}else if(r2<.65){op='-';t=a-b;}else if(r2<.85){op='+';t=a+b;}else{op='X';t=a*b;}}
   else if(cs.length>2){const p=vals.reduce((a,b)=>a*b,1);if(rnd(1)<.45&&p<=240){op='X';t=p;}else{op='+';t=vals.reduce((a,b)=>a+b,0);}}
   cs.sort((a,b)=>a-b);cages.push({cs,op,t,col:0});}
  cages.forEach((cg,k)=>{const used=new Set();cg.cs.forEach(i=>{const x=i%N,y=i/N|0;D4.forEach(d=>{const nx=x+d[0],ny=y+d[1];if(nx>=0&&ny>=0&&nx<N&&ny<N){const o=cage[ny*N+nx];if(o<k)used.add(cages[o].col);}});});let c=0;while(used.has(c))c++;cg.col=c;});
  v=Array(N*N).fill(0);lock=Array(N*N).fill(0);cages.forEach(cg=>{if(cg.cs.length===1){v[cg.cs[0]]=cg.t;lock[cg.cs[0]]=1;}});cur={x:0,y:0};wt=0;};
 const st=LV(g,5,gen);lvStart(st);
 g.cheat=()=>{v=sol.slice();if(won())wt=2;};
 const dup=i=>{const x=i%N,y=i/N|0,val=v[i];if(!val)return false;for(let k=0;k<N;k++){if(k!==x&&v[y*N+k]===val)return true;if(k!==y&&v[k*N+x]===val)return true;}return false;};
 const cageOK=cg=>{const vals=cg.cs.map(i=>v[i]);if(vals.some(x=>!x))return null;let r;if(cg.op==='')r=vals[0];else if(cg.op==='+')r=vals.reduce((a,b)=>a+b,0);else if(cg.op==='X')r=vals.reduce((a,b)=>a*b,1);else if(cg.op==='-')r=Math.abs(vals[0]-vals[1]);else{const a=Math.max(...vals),b=Math.min(...vals);r=a%b===0?a/b:-1;}return r===cg.t;};
 const won=()=>v.every(x=>x)&&!v.some((_,i)=>dup(i))&&cages.every(cg=>cageOK(cg)===true);
 const setV=val=>{const i=cur.y*N+cur.x;if(lock[i]){S('hit');return;}if(v[i]===val)return;v[i]=val;st.mv++;S('blip');const cg=cages[cage[i]];if(cageOK(cg)===true){const x=OX+(cg.cs[0]%N)*CS,y=OY+(cg.cs[0]/N|0)*CS;A.burst(x+8,y+6,K.g,6,1.2);}if(won()){wt=40;S('coin');}};
 const cyc=d=>{const i=cur.y*N+cur.x;setV((v[i]+d+N+1)%(N+1));};
 g.update=()=>{pstep();if(lvTick(st))return;if(wt){if(--wt===0)lvWin(st,N*N*5,0);return;}
  hv={x:-1,y:-1};const mx=Math.floor((P.x-OX)/CS),my=Math.floor((P.y-OY)/CS);if(P.used&&mx>=0&&my>=0&&mx<N&&my<N)hv={x:mx,y:my};
  if(!padN(g,N,OX,OY,CS,cur,v,lock,setV,232)){if((P.press||P.rc)&&hv.x>=0){if(hv.x===cur.x&&hv.y===cur.y)cyc(P.rc?-1:1);else{cur.x=hv.x;cur.y=hv.y;S('blip');}}}
  gcur(cur,N,N);if(P.ka)cyc(1);if(P.kb)cyc(-1);};
 g.draw=()=>{bgd('#33305a');const c=A.c;bev(OX-6,OY-6,N*CS+12,N*CS+12,'#e8dcc0',8,4);
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+(i/N|0)*CS;fr(x,y,CS,CS,0,CT[cages[cage[i]].col%CT.length]);if(hv.x===i%N&&hv.y===(i/N|0))fr(x,y,CS,CS,0,'rgba(80,100,200,.12)');}
  c.fillStyle='rgba(60,40,80,.18)';for(let k=1;k<N;k++){c.fillRect(OX+k*CS,OY,1,N*CS);c.fillRect(OX,OY+k*CS,N*CS,1);}
  for(let i=0;i<N*N;i++){const x=i%N,y=i/N|0;if(x<N-1&&cage[i]!==cage[i+1])A.rect(OX+(x+1)*CS-1,OY+y*CS-1,2,CS+2,'#3a2f55');if(y<N-1&&cage[i]!==cage[i+N])A.rect(OX+x*CS-1,OY+(y+1)*CS-1,CS+2,2,'#3a2f55');}
  sr(OX-1,OY-1,N*CS+2,N*CS+2,2,'#3a2f55',2.5);
  cages.forEach(cg=>{const i=cg.cs[0],ok=cageOK(cg);T(cg.t+cg.op,OX+(i%N)*CS+3,OY+(i/N|0)*CS+3,ok===true?'#1f9a4a':ok===false?'#d0303a':'#4a3a6a',1);});
  const ci=cur.y*N+cur.x;if(!st.clr){fr(OX+cur.x*CS+2,OY+cur.y*CS+2,CS-4,CS-4,4,'rgba(255,216,74,.35)');cbox(OX+cur.x*CS+1,OY+cur.y*CS+1,CS-2,CS-2,4,'#d89a10');}
  for(let i=0;i<N*N;i++)if(v[i]){const x=OX+(i%N)*CS+CS/2,y=OY+(i/N|0)*CS+CS/2;T(v[i],x+2,y-5,dup(i)?'#e0303a':lock[i]?'#2a2440':'#3557b0',3,'c');}
  padDraw(N,232,v[ci]);hud(g,st,'MOVES '+st.mv+'   '+mmss(st.t));T('CLICK AGAIN = +1',268,214,K.gr,1,'c');lvDraw(st);pcur();};
 return g;}});

/* ================= 8. LIGHT UP ================= */
A.add({id:'lightup',name:'LIGHT UP',cat:'PUZZLE',mouse:1,time:900,how:'CLICK OR A: BULB. B: MARK. LIGHT EVERY CELL. NO BULB MAY SHINE ON ANOTHER.',make(){
 const g={over:null,score:0};pinit();
 let solB=[],N=6,CS=30,OX=0,OY=0,wall=[],num=[],bulb=[],mark=[],lit=[],la=[],bad=[],cur={x:0,y:0},wt=0,par=0;
 const relight=()=>{lit=Array(N*N).fill(0);bad=Array(N*N).fill(0);for(let i=0;i<N*N;i++)if(bulb[i]){lit[i]=1;const x=i%N,y=i/N|0;for(const[dx,dy]of D4){let nx=x+dx,ny=y+dy;while(nx>=0&&ny>=0&&nx<N&&ny<N&&!wall[ny*N+nx]){const j=ny*N+nx;lit[j]=1;if(bulb[j]){bad[i]=1;bad[j]=1;}nx+=dx;ny+=dy;}}}};
 const gen=l=>{N=[6,7,7,8,9,10][l-1];CS=Math.min(32,Math.floor(200/N));OX=Math.round(160-N*CS/2);OY=Math.round(22+(204-N*CS)/2);
  for(let tr=0;tr<30;tr++){wall=Array(N*N).fill(0);for(let i=0;i<N*N;i++)if(rnd(1)<.11)wall[i]=wall[N*N-1-i]=1;
   const B=Array(N*N).fill(0),L=Array(N*N).fill(0);const light=i=>{L[i]=1;const x=i%N,y=i/N|0;for(const[dx,dy]of D4){let nx=x+dx,ny=y+dy;while(nx>=0&&ny>=0&&nx<N&&ny<N&&!wall[ny*N+nx]){L[ny*N+nx]=1;nx+=dx;ny+=dy;}}};
   for(const i of shuf([...Array(N*N).keys()])){if(wall[i]||L[i])continue;B[i]=1;light(i);}
   num=Array(N*N).fill(-1);for(let i=0;i<N*N;i++)if(wall[i]){const x=i%N,y=i/N|0;let c=0;D4.forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<N&&ny<N&&B[ny*N+nx])c++;});if(rnd(1)<.72||c>=3)num[i]=c;}
   par=B.filter(Boolean).length;solB=B;if(wall.filter(Boolean).length>=N)break;}
  bulb=Array(N*N).fill(0);mark=Array(N*N).fill(0);la=Array(N*N).fill(0);cur={x:N>>1,y:N>>1};wt=0;relight();};
 const st=LV(g,6,gen);lvStart(st);
 g.cheat=()=>{bulb=solB.slice();relight();if(won())wt=2;};
 const wn=i=>{const x=i%N,y=i/N|0;let c=0;D4.forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<N&&ny<N&&bulb[ny*N+nx])c++;});return c;};
 const won=()=>{for(let i=0;i<N*N;i++){if(wall[i]){if(num[i]>=0&&wn(i)!==num[i])return false;}else if(!lit[i]||bad[i])return false;}return true;};
 const tog=(i,b)=>{if(wall[i]){S('hit');return;}if(b){if(bulb[i])return;mark[i]^=1;S('blip');return;}bulb[i]^=1;mark[i]=0;st.mv++;relight();S(bulb[i]?(bad[i]?'hit':'coin'):'blip');if(bulb[i])A.burst(OX+(i%N)*CS+CS/2,OY+(i/N|0)*CS+CS/2,'#fff2a0',6,1.3);if(won()){wt=45;}};
 g.update=()=>{pstep();for(let i=0;i<la.length;i++)la[i]+=((lit[i]?1:0)-la[i])*.2;if(lvTick(st))return;if(wt){if(--wt===0)lvWin(st,N*N*2.2,par+2);return;}
  const on=gmouse(cur,OX,OY,CS,N,N);gcur(cur,N,N);const i=cur.y*N+cur.x;if((P.press&&on)||P.ka)tog(i,0);if((P.rc&&on)||P.kb)tog(i,1);};
 g.draw=()=>{bgd('#151530');const c=A.c;bev(OX-6,OY-6,N*CS+12,N*CS+12,'#2c2c50',8,4);
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+(i/N|0)*CS;if(wall[i]){const n=num[i],w=n>=0?wn(i):0;blit('luw'+CS,x,y,CS,CS,(X,Y)=>bev(X+1,Y+1,CS-2,CS-3,'#34344a',3,2));if(n>=0)T(n,x+CS/2+1,y+CS/2-6,w===n?'#7ee08a':w>n?'#ff6a7a':'#f0f0ff',2,'c');continue;}
   const a=cl(la[i],0,1);fr(x+1,y+1,CS-2,CS-2,3,A.mix('#262c4a','#ffe39a',a*.92));if(a>.05)fr(x+3,y+2,CS-6,CS*.3,2,'rgba(255,255,255,'+(.25*a)+')');}
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS+CS/2,y=OY+(i/N|0)*CS+CS/2;if(bulb[i]){glow(x,y,CS*.85,bad[i]?'#ff5a6e':'#fff6b0',.55);A.rect(x-CS*.1,y+CS*.12,CS*.2,CS*.14,'#8a8aa8');A.circ(x,y-1,CS*.22,bad[i]?'#ff5a6e':'#fff3b0');A.circ(x-CS*.07,y-CS*.1,Math.max(1,CS*.06),'#ffffff');}else if(mark[i])A.circ(x,y,Math.max(1.5,CS*.08),'#7a86c0');}
  if(!st.clr)cbox(OX+cur.x*CS+1,OY+cur.y*CS+1,CS-2,CS-2,4,'#ff8a3a');
  const left=lit.reduce((s,v,i)=>s+(!wall[i]&&!v?1:0),0);hud(g,st,'DARK CELLS '+left+'   '+mmss(st.t));lvDraw(st);pcur();};
 return g;}});

/* ================= 9. SLIDING KING (Klotski; layouts BFS-verified, par = optimal single-cell steps) ================= */
const KL=[['BBAA..AAE.....GCD.HF',9],['HEECFAACGAABJI.B..DD',21],['EAAHEAAD.GJDBI.CBFKC',35],['JAABIAABECFFEC.DHG.D',56],['AAEJAAECD.BCDHBI.FFG',83],['BAACBAACDFFEDGHEI..J',116]];
A.add({id:'slidingking',name:'SLIDING KING',cat:'PUZZLE',mouse:1,time:900,how:'DRAG BLOCKS (OR A PICKS, ARROWS SLIDE). GET THE RED KING OUT THE BOTTOM GAP.',make(){
 const g={over:null,score:0},CS=38,OX=84,OY=29;pinit();
 let bl=[],sel=-1,cur={x:1,y:2},grab=0,gax=0,gay=0,par=0,out=0;
 const gen=l=>{const s=KL[l-1][0],m={};par=KL[l-1][1];[...s].forEach((ch,i)=>{if(ch==='.')return;const x=i%4,y=i/4|0;if(!m[ch])m[ch]={x,y,x2:x,y2:y};else{const o=m[ch];o.x=Math.min(o.x,x);o.y=Math.min(o.y,y);o.x2=Math.max(o.x2,x);o.y2=Math.max(o.y2,y);}});
  bl=Object.keys(m).sort().map(k=>{const o=m[k];return{x:o.x,y:o.y,w:o.x2-o.x+1,h:o.y2-o.y+1,dx:o.x,dy:o.y-.6-rnd(.6),k:k==='A'};});sel=-1;grab=0;out=0;cur={x:1,y:2};};
 const st=LV(g,6,gen);lvStart(st);
 g.cheat=()=>{const k=bl.find(b=>b.k);bl.forEach(b=>{if(!b.k&&b.x<3&&b.x+b.w>1&&b.y+b.h>3){b.x=b.x<2?0:3;b.y=0;}});k.x=1;k.y=3;out=1;};
 const occ=skip=>{const o=Array(20).fill(-1);bl.forEach((b,i)=>{if(i===skip)return;for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){const yy=Math.round(b.y)+y;if(yy<5)o[yy*4+b.x+x]=i;}});return o;};
 const mv=(i,dx,dy)=>{const b=bl[i],o=occ(i),nx=b.x+dx,ny=b.y+dy;if(nx<0||ny<0||nx+b.w>4||ny+b.h>5)return false;for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++)if(o[(ny+y)*4+nx+x]>=0)return false;b.x=nx;b.y=ny;st.mv++;S('blip');if(b.k&&b.x===1&&b.y===3){out=1;S('coin');sel=-1;grab=0;}return true;};
 const tryE=(i,ex,ey)=>{const ax=Math.abs(ex)>=Math.abs(ey);const A1=ax?[Math.sign(ex),0,Math.abs(ex)]:[0,Math.sign(ey),Math.abs(ey)],A2=ax?[0,Math.sign(ey),Math.abs(ey)]:[Math.sign(ex),0,Math.abs(ex)];if(A1[2]>.55&&mv(i,A1[0],A1[1]))return;if(A2[2]>.55)mv(i,A2[0],A2[1]);};
 g.update=()=>{pstep();bl.forEach(b=>{b.dx+=(b.x-b.dx)*.35;b.dy+=(b.y-b.dy)*.35;});if(lvTick(st))return;
  if(out){out++;const k=bl.find(b=>b.k);if(out>8)k.y=3+(out-8)*.12;if(out===12)A.burst(OX+2*CS,OY+5*CS,K.y,20,2.5);if(out===50)lvWin(st,par*1.4+25,par);return;}
  const mx=Math.floor((P.x-OX)/CS),my=Math.floor((P.y-OY)/CS),inb=mx>=0&&my>=0&&mx<4&&my<5;
  if(P.press){if(inb){const i=occ(-1)[my*4+mx];if(i>=0){sel=i;grab=1;gax=mx-bl[i].x;gay=my-bl[i].y;cur={x:mx,y:my};S('blip');}else sel=-1;}else sel=-1;}
  if(grab){if(!P.dn||sel<0)grab=0;else{const b=bl[sel];tryE(sel,(P.x-OX)/CS-gax-.5-b.x,(P.y-OY)/CS-gay-.5-b.y);}}
  if(sel<0||P.used){if(!P.used)gcur(cur,4,5);if(P.ka){const i=occ(-1)[cur.y*4+cur.x];if(i>=0){sel=i;S('blip');}else S('hit');}}
  else{const D=P.d,d=D.l?[-1,0]:D.r?[1,0]:D.u?[0,-1]:D.d?[0,1]:null;if(d){if(mv(sel,d[0],d[1])){cur.x=cl(cur.x+d[0],0,3);cur.y=cl(cur.y+d[1],0,4);}else{S('hit');}}if(P.ka||P.kb)sel=-1;}};
 const CO=b=>b.k?'#e8454f':b.w===2?'#48d97c':b.h===2?'#4d9fff':'#ffc23a';
 g.draw=()=>{bgd('#2a1a14');const c=A.c;
  blit('skframe',OX-14,OY-14,4*CS+28,5*CS+28,(X,Y)=>{bev(X,Y,4*CS+28,5*CS+28,'#9a6438',12,5);for(let i=0;i<6;i++)fr(X+6,Y+10+i*36,4*CS+16,1,0,'rgba(60,30,10,.25)');fr(X+12,Y+12,4*CS+4,5*CS+4,5,grad(0,Y,0,Y+5*CS,[[0,'#3a2418'],[1,'#24160e']]));});
  fr(OX+CS+2,OY+5*CS+1,2*CS-4,15,0,'#1a0e08');for(let i=0;i<3;i++)A.poly([[OX+2*CS-6,OY+5*CS+4+i*4],[OX+2*CS+6,OY+5*CS+4+i*4],[OX+2*CS,OY+5*CS+8+i*4]],rgba('#ffd84a',.25+.25*((A.t/8+i)%3<1?1:0)),1);
  bl.forEach((b,i)=>{const x=OX+b.dx*CS+2,y=OY+b.dy*CS+2,w=b.w*CS-4,h=b.h*CS-5,col=CO(b);if(i===sel)glow(x+w/2,y+h/2,Math.max(w,h)*.8,'#ffffff',.25);
   blit('skb'+b.w+b.h+(b.k?1:0),x,y,w,h+2,(X,Y)=>{bev(X,Y,w,h,col,7,4);fr(X+5,Y+5,w-10,h-11,5,'rgba(0,0,0,.13)');fr(X+5,Y+4,w-10,2,1,'rgba(255,255,255,.15)');if(b.k)crown(X+w/2,Y+h/2-2,14,'#ffd84a','#8a5a10');else A.circ(X+w/2,Y+h/2-1,3,lt(col,.75));});
   if(i===sel)sr(x-1,y-1,w+2,h+6,8,rgba('#ffffff',.5+.5*pulse()),2);});
  if(!P.used&&!st.clr&&!out)cbox(OX+cur.x*CS+1,OY+cur.y*CS+1,CS-2,CS-2,6,sel>=0?'#ffffff':K.y);
  hud(g,st,mmss(st.t));T('MOVES',40,60,K.gr,1,'c');T(st.mv,40,72,K.w,2,'c');T('PAR',40,110,K.gr,1,'c');T(par,40,122,K.y,2,'c');
  T('EXIT',280,200,K.y,1,'c');T('BELOW',280,210,K.gr,1,'c');T(sel>=0&&!P.used?'ARROWS SLIDE':'',280,60,K.c,1,'c');lvDraw(st);pcur();};
 return g;}});

/* ================= 10. ROLL THE BLOCK (levels BFS-verified, par = optimal rolls) ================= */
const RL=[[['###.......','#S####....','#########.','.#########','.....##G##','......###.'],7],
 [['.....###.','.G####S##','.......##','.....####','.....####','.....####'],14],
 [['......#o...','.....o##...','.....o##...','.....So....','.....#o#...','.....##G#..','......#oo..'],16],
 [['####..##...','####..##...','.###..#S#..','.##....##..','.G#######..','.##........','.##........'],22],
 [['...G........','...oooo.....','...#ooo.....','...o#.#.....','.o#####..oo.','.#oS.#o..o#.','.....o######'],24],
 [['##o#.......','###oo#o##..','##.Go#.#o..','o#.o.#o####','###oo#..#o#','.#S#o......','...........'],28]];
A.add({id:'rollblock',name:'ROLL THE BLOCK',cat:'PUZZLE',mouse:1,hd:1,time:900,how:'ARROWS/CLICK ROLL THE BLOCK. STAND IT UP IN THE HOLE. ORANGE TILES CRACK.',make(){
 const g={over:null,score:0};pinit();
 let M=[],MW=0,MH=0,bx=0,by=0,bo=0,sx=0,sy=0,anim=null,fall=0,sink=0,fails=0,opt=0,scx=160,scy=120;
 const gen=l=>{let m=RL[l-1][0].slice();opt=RL[l-1][1];while(m.length&&/^\.+$/.test(m[m.length-1]))m.pop();while(m.length&&/^\.+$/.test(m[0]))m.shift();let a=99,b=0;m.forEach(r=>{const i=r.search(/[^.]/),j=r.length-1-[...r].reverse().join('').search(/[^.]/);if(i>=0){a=Math.min(a,i);b=Math.max(b,j);}});M=m.map(r=>r.slice(a,b+1));MH=M.length;MW=M[0].length;
  M.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='S'){sx=x;sy=y;}}));bx=sx;by=sy;bo=0;anim=null;fall=0;sink=0;};
 const st=LV(g,6,gen);lvStart(st);
 g.cheat=()=>{const gy=M.findIndex(r=>r.includes('G'));by=gy;bx=M[gy].indexOf('G');bo=0;anim=null;fall=0;sink=1;};
 const tl=(x,y)=>y>=0&&y<MH&&x>=0&&x<MW?M[y][x]:'.';
 const ok=(x,y,o)=>{if(o===0){const c=tl(x,y);return c!=='.'&&c!=='o';}const a=tl(x,y),b=o===1?tl(x+1,y):tl(x,y+1);return a!=='.'&&b!=='.';};
 const nx=(x,y,o,d)=>{if(o===0)return d===0?[x+1,y,1]:d===1?[x-2,y,1]:d===2?[x,y+1,2]:[x,y-2,2];if(o===1)return d===0?[x+2,y,0]:d===1?[x-1,y,0]:d===2?[x,y+1,1]:[x,y-1,1];return d===0?[x+1,y,2]:d===1?[x-1,y,2]:d===2?[x,y+2,0]:[x,y-1,0];};
 const wz=y=>MH-1-y;
 const bounds=(x,y,o)=>o===0?[x,x+1,0,2,wz(y),wz(y)+1]:o===1?[x,x+2,0,1,wz(y),wz(y)+1]:[x,x+1,0,1,wz(y)-1,wz(y)+1];
 const roll=d=>{if(anim||fall||sink)return;anim={d,t:0};st.mv++;S('jump');};
 g.update=()=>{pstep();if(lvTick(st))return;
  if(anim){anim.t++;if(anim.t>=9){[bx,by,bo]=nx(bx,by,bo,anim.d);anim=null;if(!ok(bx,by,bo)){fall=1;S('lose');A.shake=4;const c=bo===0?tl(bx,by):'';if(c==='o')A.burst(scx,scy+10,'#f0a040',14,2);}else if(bo===0&&tl(bx,by)==='G'){sink=1;S('coin');}else S('hit');}return;}
  if(fall){if(++fall>48){fall=0;fails++;bx=sx;by=sy;bo=0;}return;}
  if(sink){if(++sink===40)lvWin(st,opt*2.5+15,opt);return;}
  const h=A.hit(0);if(h.r)roll(0);else if(h.l)roll(1);else if(h.d)roll(2);else if(h.u)roll(3);
  if(P.press){const dx=P.x-scx,dy=P.y-scy;if(Math.abs(dx)>Math.abs(dy))roll(dx>0?0:1);else roll(dy>0?2:3);}};
 const corners=()=>{const[x0,x1,y0,y1,z0,z1]=bounds(bx,by,bo);const C=[];for(let i=0;i<8;i++)C.push([i&1?x1:x0,i&2?y1:y0,i&4?z1:z0]);
  if(anim){const th=Math.min(1,anim.t/9)*Math.PI/2,c=Math.cos(th),s=Math.sin(th),d=anim.d;C.forEach(p=>{if(d<2){const px=d===0?x1:x0,dx=p[0]-px,dy=p[1];if(d===0){p[0]=px+dx*c+dy*s;p[1]=-dx*s+dy*c;}else{p[0]=px+dx*c-dy*s;p[1]=dx*s+dy*c;}}else{const pz=d===2?z0:z1,dz=p[2]-pz,dy=p[1];if(d===3){p[2]=pz+dz*c+dy*s;p[1]=-dz*s+dy*c;}else{p[2]=pz+dz*c-dy*s;p[1]=dz*s+dy*c;}}});}
  const drop=fall?.004*fall*fall:sink?sink*.055:0;C.forEach(p=>{p[1]-=drop;});return C;};
 const drawBlock=()=>{const C=corners();if(!fall&&!sink){const[x0,x1,,, z0,z1]=bounds(bx,by,bo);A.shadow3((x0+x1)/2+.1,(z0+z1)/2-.1,x1-x0,z1-z0);}
  const F=[[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5],[0,1,3,2],[4,5,7,6]],col='#d8683e';F.forEach((f,k)=>A.face(f.map(i=>C[i]),k===1?'#f08a52':col));
  let cx=0,cy=0,cz=0;C.forEach(p=>{cx+=p[0]/8;cy+=p[1]/8;cz+=p[2]/8;});const q=A.p3(cx,cy,cz);if(isFinite(q[0])&&isFinite(q[1])&&q[2]>.1){scx=q[0];scy=q[1];}};
 g.draw=()=>{A.skyband('#0e1630','#2a3a6a',H);const c=A.c;for(let i=0;i<30;i++){const x=(i*97+13)%W,y=(i*53+7)%150;c.fillStyle='rgba(255,255,255,'+(.25+.25*Math.sin(A.t*.05+i))+')';c.fillRect(x,y,1,1);}
  const a=.95,D=Math.max(7,MW*.86,MH*1.45);A.cam.x=MW/2;A.cam.y=D*Math.sin(a);A.cam.z=MH/2-D*Math.cos(a)-.6;A.cam.rx=-a;A.cam.ry=0;A.cam.f=240;A.fog=null;
  const below=fall||sink;if(below)drawBlock(),A.flush();
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=M[y][x];if(t==='.')continue;const z=wz(y);if(t==='G'){A.box3(x+.5,-.3,z+.5,.96,.3,.96,'#1a1a2a');continue;}A.box3(x+.5,-.3,z+.5,.94,.3,.94,t==='o'?'#f0a040':t==='S'?'#9fd0ff':(x+y)%2?'#b4bdd6':'#a2abc6');}
  A.flush();{const gy=M.findIndex(r=>r.includes('G')),gx=gy>=0?M[gy].indexOf('G'):0,q=A.p3(gx+.5,0,wz(gy)+.5);if(q[2]>.1&&isFinite(q[0])){glow(q[0],q[1],22,'#ffb050',.45+.3*pulse(.1));const k=[[0,0],[1,0],[1,1],[0,1]].map(([a,b])=>A.p3(gx+.08+a*.84,.01,wz(gy)+.08+b*.84));if(k.every(p=>p[2]>.1))A.poly(k.map(p=>[p[0],p[1]]),rgba('#ffd84a',.5+.4*pulse(.1)));}}
  if(!below){drawBlock();A.flush();}
  hud(g,st,'MOVES '+st.mv+'   PAR '+opt+(fails?'   FALLS '+fails:''));lvDraw(st);pcur();};
 return g;}});

/* ================= 11. DOUBLE UP 2048 ================= */
A.add({id:'doubleup',name:'DOUBLE UP 2048',cat:'PUZZLE',mouse:1,time:900,how:'ARROWS OR SWIPE SLIDE. TWINS MERGE, X2 DOUBLES A TILE. GOALS CLIMB TO 2048.',make(){
 const g={over:null,score:0},TS=40,GP=5,OX=68,OY=28,GOALS=[128,256,512,1024,2048];pinit();
 const VC={2:'#9adcff',4:'#4d9fff',8:'#2fd6c3',16:'#48d97c',32:'#b6e04a',64:'#ffd84a',128:'#ffa53f',256:'#ff7a4a',512:'#ff5a6e',1024:'#ff6fcf',2048:'#a870ff'};
 let bd,ghosts=[],uid=0,moves=0,best=2,sw=null,dead=0;
 const empt=()=>{const e=[];bd.forEach((t,i)=>{if(!t)e.push(i);});return e;};
 const spawn=(k)=>{const e=empt();if(!e.length)return;const i=e[ri(e.length)];k=k||(st.lvl>=2&&rnd(1)<.06?'x':'n');bd[i]={id:uid++,k,v:k==='n'?(rnd(1)<.9?2:4):0,x:i%4,y:i/4|0,px:i%4,py:i/4|0,pop:0,born:8,l:k==='r'?7+ri(5):0,m:0};};
 const gen=l=>{if(l===1){bd=Array(16).fill(null);ghosts=[];moves=0;best=2;spawn('n');spawn('n');}};
 const st=LV(g,5,gen,'2048 REACHED! WIN');lvStart(st);
 g.cheat=()=>{const G=[128,256,512,1024,2048][st.lvl-1];bd[0]=null;bd[1]={id:uid++,k:'n',v:G/2,x:1,y:0,px:1,py:0,pop:0,born:0,l:0,m:0};bd[0]={id:uid++,k:'n',v:G/2,x:0,y:0,px:0,py:0,pop:0,born:0,l:0,m:0};go('l');};
 const line=(d,n)=>[0,1,2,3].map(i=>d==='l'?n*4+i:d==='r'?n*4+3-i:d==='u'?i*4+n:(3-i)*4+n);
 const canM=(a,b)=>a.k!=='r'&&b.k!=='r'&&((a.k==='n'&&b.k==='n'&&a.v===b.v)||((a.k==='x')!==(b.k==='x')));
 const slide=(B,d,real)=>{let moved=false,gain=0;for(let n=0;n<4;n++){let seg=[];const flush=()=>{const tiles=seg.map(i=>B[i]).filter(Boolean);seg.forEach(i=>{B[i]=null;});let k=0,last=null;
    for(const t of tiles){if(last&&!last.m&&canM(last,t)){const v=last.k==='n'&&t.k==='n'?last.v*2:(last.k==='n'?last.v:t.v)*2;last.k='n';last.v=v;last.m=1;gain+=v;moved=true;if(real){ghosts.push({k:t.k,v:t.v,px:t.px,py:t.py,tx:last.x,ty:last.y,t:0});last.pop=9;}}
     else{const p=seg[k],nx=p%4,ny=p/4|0;if(t.x!==nx||t.y!==ny)moved=true;t.x=nx;t.y=ny;B[p]=t;last=t;k++;}}seg=[];};
   for(const i of line(d,n)){if(B[i]&&B[i].k==='r')flush();else seg.push(i);}flush();}
  B.forEach(t=>{if(t)t.m=0;});return{moved,gain};};
 const can=()=>['l','r','u','d'].some(d=>slide(bd.map(t=>t&&{...t}),d,false).moved);
 const go=d=>{if(dead||st.clr)return;const r=slide(bd,d,true);if(!r.moved){S('blip');return;}g.score+=r.gain;st.mv++;moves++;
  bd.forEach((t,i)=>{if(t&&t.k==='r'&&--t.l<=0){bd[i]=null;A.burst(OX+GP+t.x*(TS+GP)+TS/2,OY+GP+t.y*(TS+GP)+TS/2,'#a0a0b0',14,2.2);A.shake=4;}});
  spawn();if(st.lvl>=3&&moves%8===0&&empt().length>4)spawn('r');S(r.gain>=64?'score':r.gain?'coin':'blip');
  bd.forEach(t=>{if(t&&t.k==='n')best=Math.max(best,t.v);});if(best>=GOALS[st.lvl-1]){lvWin(st,[70,110,180,280,420][st.lvl-1],0);return;}if(!can())dead=70;};
 g.update=()=>{pstep();bd&&bd.forEach(t=>{if(!t)return;t.px+=(t.x-t.px)*.4;t.py+=(t.y-t.py)*.4;if(t.pop)t.pop--;if(t.born)t.born--;});ghosts.forEach(q=>{q.t++;q.px+=(q.tx-q.px)*.4;q.py+=(q.ty-q.py)*.4;});ghosts=ghosts.filter(q=>q.t<7);
  if(lvTick(st))return;if(dead){if(--dead===0){g.over='NO MOVES LEFT';S('lose');}return;}
  const h=A.hit(0);if(h.l)go('l');else if(h.r)go('r');else if(h.u)go('u');else if(h.d)go('d');
  if(P.press)sw={x:P.x,y:P.y};if(sw){const dx=P.x-sw.x,dy=P.y-sw.y,m=Math.max(Math.abs(dx),Math.abs(dy));if(m>26||(P.rel&&m>10)){go(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'));sw=null;}else if(P.rel||!P.dn)sw=null;}};
 const tileD=(t,x,y,s)=>{const w=TS*s;x+=(TS-w)/2;y+=(TS-w)/2;if(t.k==='r'){bev(x,y,w,w,'#6a6a7a',7,3);ln(x+w*.3,y+w*.2,x+w*.45,y+w*.55,'#3a3a48',1.5);ln(x+w*.45,y+w*.55,x+w*.7,y+w*.7,'#3a3a48',1.5);T(t.l,x+w-6,y+w-9,'#d0d0e0',1,'c');return;}
  if(t.k==='x'){glow(x+w/2,y+w/2,w*.8,'#ffd84a',.35+.2*pulse());bev(x,y,w,w,'#8a4ad8',7,3);fr(x+4,y+4,w-8,w-8,5,grad(0,y,0,y+w,[[0,'#c890ff'],[1,'#7038c0']]));if(s>.6)T('X2',x+w/2+1,y+w/2-5,'#ffe878',2,'c');return;}
  const col=VC[t.v]||'#ffffff';bev(x,y,w,w,col,7,3);if(s>.6){const str=String(t.v),sc=str.length>=4?2:str.length===3?2:3;T(str,x+w/2+(sc===3?1:1),y+w/2-(sc===3?7:5),[2,8,16,32,64].includes(t.v)?'#1a2a4a':'#ffffff',sc,'c');}};
 const cell=i=>[OX+GP+(i%4)*(TS+GP),OY+GP+(i/4|0)*(TS+GP)];
 g.draw=()=>{bgd('#2a2352');const c=A.c;blit('dubd',OX,OY,4*TS+5*GP,4*TS+5*GP,(X,Y)=>{bev(X,Y,4*TS+5*GP,4*TS+5*GP,'#4a3f86',10,5);for(let i=0;i<16;i++){const x=X+GP+(i%4)*(TS+GP),y=Y+GP+(i/4|0)*(TS+GP);well(x,y,TS,TS,7,'rgba(10,6,40,.45)');}});
  ghosts.forEach(q=>{tileD(q,OX+GP+q.px*(TS+GP),OY+GP+q.py*(TS+GP),1);});
  bd.forEach(t=>{if(!t)return;const s=t.born?1-t.born/8:t.pop?1+Math.sin(t.pop/9*Math.PI)*.14:1,x=OX+GP+t.px*(TS+GP),y=OY+GP+t.py*(TS+GP);if(s===1&&t.k==='n')blit('du'+t.v,x,y,TS,TS+3,(X,Y)=>tileD(t,X,Y,1));else tileD(t,x,y,s);});
  const goal=GOALS[Math.min(st.lvl,5)-1];T('GOAL',34,42,K.gr,1,'c');tileD({k:'n',v:goal},14,52,1);T('BEST',34,112,K.gr,1,'c');tileD({k:'n',v:best},14,122,1);
  T('MOVES',286,42,K.gr,1,'c');T(moves,286,54,K.w,2,'c');T('TIME',286,82,K.gr,1,'c');T(mmss(st.t),286,94,K.w,1,'c');if(st.lvl>=2){T('X2 TILE',286,130,'#c890ff',1,'c');T('DOUBLES',286,140,K.gr,1,'c');}if(st.lvl>=3){T('ROCKS',286,166,'#a0a0b0',1,'c');T('CRUMBLE',286,176,K.gr,1,'c');}
  hud(g,st,'REACH '+goal);if(dead)T('NO MOVES LEFT',160,212,K.r,2,'c');lvDraw(st);pcur();};
 return g;}});

/* ================= 12. WORD SEARCH ================= */
const THEMES={SPACE:['PLANET','COMET','ORBIT','ROCKET','GALAXY','NEBULA','METEOR','SATURN','MARS','VENUS','STAR','MOON','ASTEROID','LUNAR','ECLIPSE'],OCEAN:['CORAL','WHALE','SHARK','WAVE','TIDE','SQUID','OYSTER','REEF','DOLPHIN','LOBSTER','SEAL','KELP','ANCHOR','SAILOR','CRAB'],
 FRUIT:['APPLE','MANGO','GRAPE','LEMON','CHERRY','BANANA','PEACH','PLUM','KIWI','MELON','ORANGE','PAPAYA','LIME','APRICOT','FIG'],ANIMALS:['TIGER','ZEBRA','PANDA','KOALA','OTTER','RABBIT','MONKEY','GIRAFFE','HIPPO','LLAMA','BEAVER','FALCON','WOLF','BISON','MOOSE'],
 SPORTS:['TENNIS','SOCCER','HOCKEY','GOLF','RUGBY','BOXING','KARATE','ROWING','CRICKET','SKIING','SURFING','POLO','JUDO','DIVING','CYCLING'],TECH:['ROBOT','LASER','PIXEL','CODE','CHIP','MODEM','SENSOR','BINARY','CIRCUIT','DIODE','KERNEL','ROUTER','CACHE','VOLTAGE','SILICON'],
 WEATHER:['STORM','CLOUD','RAIN','SNOW','THUNDER','WIND','FOG','HAIL','SUNNY','FROST','BREEZE','TORNADO','DRIZZLE','RAINBOW','SLEET']};
A.add({id:'wordsearch',name:'WORD SEARCH',cat:'PUZZLE',mouse:1,time:900,how:'DRAG ACROSS LETTERS (OR A, MOVE, A) TO CIRCLE EVERY WORD IN THE LIST.',make(){
 const g={over:null,score:0},DIRS=[[1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]],FILL='EEEEAAAIIIOONNRRTTSSLLCUDPMHGBFYWKV';pinit();
 let plc=[],N=8,CS=22,OX=0,OY=0,grid=[],words=[],found=[],caps=[],theme='',start=null,cur={x:0,y:0},ms=0,wt=0;const usedT=[];
 const gen=l=>{const cfg=[[8,5,2],[9,6,3],[10,7,4],[10,8,8],[10,9,8]][l-1];N=cfg[0];CS=Math.min(23,Math.floor(196/N));OX=Math.round(108-N*CS/2);OY=Math.round(23+(204-N*CS)/2);
  const tn=shuf(Object.keys(THEMES).filter(t=>!usedT.includes(t)));theme=tn[0]||'SPACE';usedT.push(theme);
  for(let tr=0;tr<40;tr++){grid=Array(N*N).fill('');plc=[];const pool=shuf(THEMES[theme].filter(w=>w.length<=N)).slice(0,cfg[1]).sort((a,b)=>b.length-a.length);let ok=true;
   for(const w of pool){let placed=false;for(let k=0;k<300&&!placed;k++){const d=DIRS[ri(cfg[2])],L=w.length,x=ri(N),y=ri(N),ex=x+d[0]*(L-1),ey=y+d[1]*(L-1);if(ex<0||ey<0||ex>=N||ey>=N)continue;let f=true;for(let i=0;i<L;i++){const c=grid[(y+d[1]*i)*N+x+d[0]*i];if(c&&c!==w[i]){f=false;break;}}if(!f)continue;for(let i=0;i<L;i++)grid[(y+d[1]*i)*N+x+d[0]*i]=w[i];placed=true;plc.push([x,y,d,L]);}if(!placed){ok=false;break;}}
   if(ok){words=pool.slice().sort();break;}}
  grid=grid.map(c=>c||FILL[ri(FILL.length)]);found=words.map(()=>0);caps=[];start=null;ms=0;wt=0;cur={x:N>>1,y:N>>1};};
 const st=LV(g,5,gen);lvStart(st);
 g.cheat=()=>{plc.forEach(([x,y,d,L])=>check({x,y},{x:x+d[0]*(L-1),y:y+d[1]*(L-1),ux:d[0],uy:d[1],len:L-1}));};
 const endOf=(s,c)=>{const dx=c.x-s.x,dy=c.y-s.y;if(!dx&&!dy)return{x:s.x,y:s.y,ux:0,uy:0,len:0};const o=Math.round(Math.atan2(dy,dx)/(Math.PI/4)),ux=Math.round(Math.cos(o*Math.PI/4)),uy=Math.round(Math.sin(o*Math.PI/4));let len=Math.max(Math.abs(dx),Math.abs(dy));while(len>0){const ex=s.x+ux*len,ey=s.y+uy*len;if(ex>=0&&ey>=0&&ex<N&&ey<N)break;len--;}return{x:s.x+ux*len,y:s.y+uy*len,ux,uy,len};};
 const check=(s,e)=>{let w='';for(let k=0;k<=e.len;k++)w+=grid[(s.y+e.uy*k)*N+s.x+e.ux*k];const r=[...w].reverse().join('');const i=words.findIndex((x,j)=>!found[j]&&(x===w||x===r));
  if(i>=0){found[i]=1;caps.push({x1:s.x,y1:s.y,x2:e.x,y2:e.y,col:PAL[(caps.length*3)%8]});g.score+=20+w.length*5;S('coin');const mx=OX+(s.x+e.x+1)*CS/2,my=OY+(s.y+e.y+1)*CS/2;A.burst(mx,my,PAL[(caps.length*3+5)%8],14,2);if(found.every(Boolean)){wt=40;}}else if(e.len>0)S('hit');if(e.len>0)st.mv++;};
 g.update=()=>{pstep();if(lvTick(st))return;if(wt){if(--wt===0)lvWin(st,words.length*14,0);return;}
  const on=gmouse(cur,OX,OY,CS,N,N);gcur(cur,N,N);
  if(P.press&&on){start={x:cur.x,y:cur.y};ms=1;S('blip');}
  if(ms&&(P.rel||!P.dn)){if(start)check(start,endOf(start,cur));start=null;ms=0;}
  if(P.ka){if(!start){start={x:cur.x,y:cur.y};ms=0;S('blip');}else{check(start,endOf(start,cur));start=null;}}if(P.kb)start=null;};
 g.draw=()=>{bgd('#2b3d63');const c=A.c;const cc=(x,y)=>[OX+x*CS+CS/2,OY+y*CS+CS/2];
  blit('wsb'+N,OX-7,OY-7,N*CS+14,N*CS+14,(X,Y)=>{bev(X,Y,N*CS+14,N*CS+14,'#f2e6c8',9,4);fr(X+5,Y+5,N*CS+4,N*CS+4,5,'#fbf4e2');});
  caps.forEach(p=>{const a=cc(p.x1,p.y1),b=cc(p.x2,p.y2);ln(a[0],a[1],b[0],b[1],rgba(p.col,.5),CS*.8);});
  if(start){const e=endOf(start,cur),a=cc(start.x,start.y),b=cc(e.x,e.y);ln(a[0],a[1],b[0],b[1],'rgba(255,190,40,.55)',CS*.84);}
  else if(!st.clr)cbox(OX+cur.x*CS+1,OY+cur.y*CS+1,CS-2,CS-2,CS/2-1,'#e08a20');
  for(let i=0;i<N*N;i++){const p=cc(i%N,i/N|0);T(grid[i],p[0]+1,p[1]-4,'#3a2f55',2,'c',1);}
  bev(214,22,100,208,'#3a4a7a',8,3);T(theme,264,30,K.y,1,'c');words.forEach((w,i)=>{const y=46+i*19;T(w,264,y,found[i]?'#8090b8':K.w,2,'c');if(found[i]){const tw=w.length*8;ln(264-tw/2-2,y+4,264+tw/2,y+4,'#ff7a7a',1.5);}});
  hud(g,st,'FOUND '+found.filter(Boolean).length+'/'+words.length+'   '+mmss(st.t));lvDraw(st);pcur();};
 return g;}});

/* ================= 13. WORD SCRAMBLE ================= */
const WSL={4:['GAME','TREE','BOOK','FISH','STAR','MOON','CAKE','BIRD','SHIP','LAMP','ROCK','WIND','GOLD','KING','DOOR','RAIN','SNOW','LION','FROG','MILK','JUMP','BLUE','DUCK','HAND'],
 5:['APPLE','HOUSE','PLANT','RIVER','TIGER','CLOUD','BEACH','CHAIR','BREAD','SMILE','TRAIN','OCEAN','PIZZA','MUSIC','ROBOT','LEMON','MELON','HEART','STORM','DREAM','LIGHT','CANDY','GHOST','PIANO'],
 6:['GARDEN','PLANET','CASTLE','BRIDGE','ROCKET','FOREST','WINTER','BUTTER','DRAGON','SPIRIT','PUZZLE','MARKET','ISLAND','SILVER','JUNGLE','CAMERA','PENCIL','ORANGE','TUNNEL','FLOWER','PIRATE','WIZARD'],
 7:['KITCHEN','BLANKET','DOLPHIN','LIBRARY','CAPTAIN','MONSTER','RAINBOW','PICTURE','VOLCANO','TEACHER','JOURNEY','HOLIDAY','PYRAMID','LANTERN','PENGUIN','CRYSTAL','THUNDER','FREEDOM','BALLOON','COMPASS','GIRAFFE','ORCHARD'],
 8:['ELEPHANT','DINOSAUR','MOUNTAIN','CHAMPION','UMBRELLA','SANDWICH','TREASURE','COMPUTER','BIRTHDAY','SKELETON','HOMEWORK','FIREWORK','SUNSHINE','KANGAROO','NOTEBOOK','PAINTING','SNOWBALL','AIRPLANE','BASEBALL','DAUGHTER']};
const WSALL=new Set(Object.values(WSL).flat());const srt=w=>[...w].sort().join('');
A.add({id:'wordscramble',name:'WORD SCRAMBLE',cat:'PUZZLE',typing:1,mouse:1,time:600,how:'TYPE THE WORD HIDING IN THE TILES BEFORE TIME RUNS OUT. ENTER SHUFFLES.',make(){
 const g={over:null,score:0},TY=158,AY=86;pinit();
 let word='',tiles=[],ans=[],tl=1,tmax=1,hearts=3,phase=0,pt=0,wi=0,kc=0,usedW=new Set(),shk=0;
 const sx=(k,n)=>160-(n*36-6)/2+k*36+15;
 const newWord=()=>{const L=st.lvl+3,pool=WSL[L].filter(w=>!usedW.has(w));word=pool.length?pool[ri(pool.length)]:WSL[L][ri(WSL[L].length)];usedW.add(word);let s=word;for(let k=0;k<50&&(s===word||WSALL.has(s));k++)s=shuf([...word]).join('');
  const sl=shuf([...Array(L).keys()]);tiles=[...s].map((ch,i)=>({ch,used:0,slot:i,x:160,y:TY+40+rnd(20),dl:i*3}));ans=[];tmax=tl=Math.round((9+L*3.5)*60);phase=0;kc=0;A.typed.length=0;};
 const gen=()=>{wi=0;newWord();};
 const st=LV(g,5,gen);lvStart(st);
 g.cheat=()=>{if(!phase)A.typed.push(...word);};
 const add=i=>{const t=tiles[i];if(!t||t.used||phase)return;t.used=1;ans.push(i);S('blip');if(ans.length===word.length){const s=ans.map(j=>tiles[j].ch).join('');if(s===word||(WSALL.has(s)&&srt(s)===srt(word))){word=s;phase=1;pt=55;const pts=word.length*10+Math.ceil(tl/60)*3;g.score+=pts;S('coin');for(let k=0;k<word.length;k++)A.burst(sx(k,word.length),AY,PAL[k%8],6,1.8);}else{phase=3;pt=26;S('hit');A.shake=4;}}};
 const back=()=>{if(phase||!ans.length)return;tiles[ans.pop()].used=0;S('blip');};
 const shuffle=()=>{if(phase)return;const fr_=tiles.filter(t=>!t.used),sl=shuf(fr_.map(t=>t.slot));fr_.forEach((t,i)=>{t.slot=sl[i];});S('jump');};
 const next=()=>{if(hearts<=0){g.over='OUT OF TIME';return;}wi++;if(wi>=4)lvWin(st,0,0,hearts*25);else newWord();};
 g.update=()=>{pstep();if(shk)shk--;tiles.forEach(t=>{if(t.dl>0){t.dl--;return;}const n=word.length,k=t.used?ans.indexOf(tiles.indexOf(t)):t.slot,tx=sx(k,n),ty=t.used?AY:TY;t.x+=(tx-t.x)*.3;t.y+=(ty-t.y)*.3;});
  if(lvTick(st)){A.typed.length=0;return;}
  if(phase===1||phase===2){if(--pt===0)next();A.typed.length=0;return;}if(phase===3){if(--pt===0){ans.forEach(i=>{tiles[i].used=0;});ans=[];phase=0;}A.typed.length=0;return;}
  if(--tl<=0){hearts--;phase=2;pt=100;S('lose');A.shake=6;return;}
  if(A.typed.length){while(A.typed.length&&!phase){const ch=A.typed.shift();if(ch==='<')back();else if(ch==='>')shuffle();else{const i=tiles.findIndex(t=>!t.used&&t.ch===ch);if(i>=0)add(i);else{S('hit');shk=10;}}}A.typed.length=0;return;}
  if(P.press){const n=word.length;let hit=-1;tiles.forEach((t,i)=>{if(!t.used&&Math.abs(P.x-t.x)<16&&Math.abs(P.y-t.y)<18)hit=i;});if(hit>=0)add(hit);else if(Math.abs(P.y-AY)<20&&Math.abs(P.x-160)<n*18+10)back();else if(inR(118,204,84,18))shuffle();}
  const n=word.length;if(P.d.l){kc=(kc+n-1)%n;S('blip');}if(P.d.r){kc=(kc+1)%n;S('blip');}if(P.ka){const i=tiles.findIndex(t=>t.slot===kc);if(i>=0&&!tiles[i].used)add(i);else S('hit');}if(P.kb||P.rc)back();};
 const tileG=(x,y,ch,col)=>{blit('wsc'+ch+col,x-15,y-17,30,34,(X,Y)=>{bev(X,Y,30,32,col,5,3);fr(X+3,Y+3,24,24,4,'rgba(255,255,255,.12)');T(ch,X+16,Y+8,'#4a3018',3,'c');});};
 g.draw=()=>{bgd('#3b2a52');const c=A.c,n=word.length,f=cl(tl/tmax,0,1);
  well(20,26,280,9,4);fr(21,27,278*f,7,3,f>.5?'#48d97c':f>.25?'#ffd84a':(A.t%20<10?'#ff5a6e':'#ff8a6a'));
  T('WORD '+Math.min(wi+1,4)+'/4',20,42,K.gr,1);T(n+' LETTERS',300,42,K.gr,1,'r');
  for(let k=0;k<n;k++)well(sx(k,n)-15,AY-17,30,34,5,'rgba(0,0,0,.35)');
  if(phase===2){for(let k=0;k<n;k++){tileG(sx(k,n),AY,word[k],'#ff9a8a');}}
  const sh=phase===3?Math.sin(pt*1.3)*4:0;tiles.forEach((t,i)=>{if(phase===2&&t.used)return;const col=phase===1&&t.used?'#8ee89a':phase===3&&t.used?'#ff8a8a':'#f3d9a4';tileG(t.x+(t.used?sh:shk?Math.sin(shk*1.5)*2:0),t.y-(phase===1&&t.used?Math.sin((55-pt)/55*Math.PI)*8:0),t.ch,col);if(!P.used&&!phase&&!t.used&&t.slot===kc&&!st.clr)cbox(t.x-17,t.y-19,34,38,6);});
  bev(118,204,84,16,'#5a6aa8',5,2);T('SHUFFLE',160,209,K.w,1,'c');T(phase===2?'THE WORD WAS':'',160,AY-30,K.r,1,'c');T(phase===1?'NICE!':'',160,AY-30,K.g,1,'c');
  hud(g,st,'');for(let i=0;i<3;i++)heart(150+i*10,8,4,i<hearts?'#ff5a6e':'#4a3a5a');T('TYPE, BACKSPACE, ENTER',160,229,K.gr,1,'c');lvDraw(st);pcur();};
 return g;}});

/* ================= 14. BINARY GRID ================= */
A.add({id:'binarygrid',name:'BINARY GRID',cat:'PUZZLE',mouse:1,time:900,how:'FILL 0S AND 1S: EQUAL COUNT PER LINE, NO THREE IN A ROW, NO TWO LINES ALIKE.',make(){
 const g={over:null,score:0};pinit();
 let N=6,CS=30,OX=0,OY=0,sol=[],v=[],giv=[],cur={x:0,y:0},wt=0,bad=new Set(),rs=[],cs=[];
 const rowsFor=n=>{const o=[];for(let m=0;m<(1<<n);m++){let c=0;for(let i=0;i<n;i++)if(m>>i&1)c++;if(c!==n/2)continue;let ok=true;for(let i=0;i+2<n;i++){const a=m>>i&1;if(a===(m>>(i+1)&1)&&a===(m>>(i+2)&1)){ok=false;break;}}if(ok)o.push(m);}return o;};
 const mkSol=n=>{const R=rowsFor(n);for(let tr=0;tr<60;tr++){const rows=[],ones=Array(n).fill(0);let nodes=0;
   const rec=r=>{if(r===n){const cols=new Set();for(let c=0;c<n;c++){let m=0;for(let y=0;y<n;y++)m|=(rows[y]>>c&1)<<y;cols.add(m);}return cols.size===n;}
    for(const m of shuf(R.slice())){if(nodes++>4000)return false;if(rows.includes(m))continue;let good=true;for(let c=0;c<n&&good;c++){const b=m>>c&1;if(r>=2&&(rows[r-1]>>c&1)===b&&(rows[r-2]>>c&1)===b)good=false;const o1=ones[c]+b,o0=r+1-o1;if(o1>n/2||o0>n/2)good=false;}
     if(!good)continue;rows.push(m);for(let c=0;c<n;c++)ones[c]+=m>>c&1;if(rec(r+1))return true;rows.pop();for(let c=0;c<n;c++)ones[c]-=m>>c&1;}return false;};
   if(rec(0)){const o=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++)o.push(rows[y]>>x&1);return o;}}return null;};
 const lineOK=(a,n)=>{let c0=0,c1=0;for(let i=0;i<n;i++){if(a[i]===0)c0++;else if(a[i]===1)c1++;if(i>=2&&a[i]>=0&&a[i]===a[i-1]&&a[i]===a[i-2])return false;}return c0<=n/2&&c1<=n/2;};
 const deduce=(G0,n)=>{const G=G0.slice(),row=y=>G.slice(y*n,y*n+n),col=x=>{const o=[];for(let y=0;y<n;y++)o.push(G[y*n+x]);return o;};let ch=true;
  while(ch){ch=false;for(let i=0;i<n*n;i++){if(G[i]>=0)continue;const x=i%n,y=i/n|0,okv=[];for(const val of[0,1]){G[i]=val;if(lineOK(row(y),n)&&lineOK(col(x),n))okv.push(val);}G[i]=-1;if(!okv.length)return false;if(okv.length===1){G[i]=okv[0];ch=true;}}}return G.every(x=>x>=0);};
 const gen=l=>{N=[6,6,8,8,10][l-1];CS=Math.min(30,Math.floor(186/N));OX=Math.round(156-N*CS/2);OY=Math.round(22+(198-N*CS)/2);sol=mkSol(N);
  if(!sol){sol=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)sol.push(((x>>1)+(y>>1)+y)%2);}
  const pz=sol.slice();for(const i of shuf([...Array(N*N).keys()])){const s=pz[i];pz[i]=-1;if(!deduce(pz,N))pz[i]=s;}
  let extra=[5,2,4,1,0][l-1];for(const i of shuf([...Array(N*N).keys()])){if(extra<=0)break;if(pz[i]<0){pz[i]=sol[i];extra--;}}
  v=pz.slice();giv=pz.map(x=>x>=0?1:0);cur={x:0,y:0};wt=0;chk();};
 const chk=()=>{bad=new Set();rs=[];cs=[];const n=N;const lines=[];for(let y=0;y<n;y++){const ids=[];for(let x=0;x<n;x++)ids.push(y*n+x);lines.push(['r',y,ids]);}for(let x=0;x<n;x++){const ids=[];for(let y=0;y<n;y++)ids.push(y*n+x);lines.push(['c',x,ids]);}
  const full={r:{},c:{}};lines.forEach(([t,k,ids])=>{const a=ids.map(i=>v[i]);let st_=0;for(let i=2;i<n;i++)if(a[i]>=0&&a[i]===a[i-1]&&a[i]===a[i-2]){bad.add(ids[i]);bad.add(ids[i-1]);bad.add(ids[i-2]);st_=2;}
   const c0=a.filter(x=>x===0).length,c1=a.filter(x=>x===1).length;if(c0>n/2||c1>n/2)st_=2;if(!st_&&c0+c1===n){st_=1;const key=a.join('');if(full[t][key]!==undefined){st_=2;(t==='r'?rs:cs)[full[t][key]]=2;}else full[t][key]=k;}(t==='r'?rs:cs)[k]=Math.max(st_,(t==='r'?rs:cs)[k]||0);});};
 const st=LV(g,5,gen);lvStart(st);
 g.cheat=()=>{v=sol.slice();chk();if(won())wt=2;};
 const won=()=>v.every(x=>x>=0)&&!bad.size&&rs.every(x=>x===1)&&cs.every(x=>x===1);
 const cyc=d=>{const i=cur.y*N+cur.x;if(giv[i]){S('hit');return;}v[i]=d>0?(v[i]===-1?0:v[i]===0?1:-1):(v[i]===-1?1:v[i]===1?0:-1);st.mv++;S('blip');chk();if(won()){wt=40;S('coin');}};
 g.update=()=>{pstep();if(lvTick(st))return;if(wt){if(--wt===0)lvWin(st,N*N*2.5,0);return;}const on=gmouse(cur,OX,OY,CS,N,N);gcur(cur,N,N);if((P.press&&on)||P.ka)cyc(1);if((P.rc&&on)||P.kb)cyc(-1);};
 const tile=(x,y,val,gv)=>blit('bin'+val+gv+CS,x,y,CS,CS,(X,Y)=>{const col=val?(gv?'#c8701c':'#ffb04e'):(gv?'#2a62bc':'#62adff');bev(X+1,Y+1,CS-2,CS-4,col,5,3);if(gv)sr(X+3,Y+3,CS-6,CS-8,3,'rgba(0,0,0,.25)',1);T(val,X+CS/2+(CS>=24?1:0),Y+CS/2-(CS>=24?8:6),gv?'#ffffff':'#1a2040',CS>=24?3:2,'c');});
 g.draw=()=>{bgd('#1c2a3e');bev(OX-6,OY-6,N*CS+12,N*CS+12,'#2c3e5c',8,4);
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+(i/N|0)*CS;if(v[i]<0)well(x+2,y+2,CS-4,CS-4,5,'rgba(0,0,0,.35)');else tile(x,y,v[i],giv[i]);if(bad.has(i))fr(x+2,y+2,CS-4,CS-5,5,'rgba(255,40,70,'+(.35+.2*pulse(.3))+')');}
  const SC=['#4a5a78','#48d97c','#ff5a6e'];for(let k=0;k<N;k++){A.circ(OX+N*CS+11,OY+k*CS+CS/2,3,SC[rs[k]||0]);A.circ(OX+k*CS+CS/2,OY+N*CS+11,3,SC[cs[k]||0]);}
  if(!st.clr)cbox(OX+cur.x*CS+1,OY+cur.y*CS+1,CS-2,CS-2,5,'#ffffff');
  const z=v.filter(x=>x<0).length;hud(g,st,'EMPTY '+z+'   '+mmss(st.t));T('DOTS: LINE OK / BROKEN',8,229,K.gr,1);lvDraw(st);pcur();};
 return g;}});

/* ================= 15. SKYSCRAPERS ================= */
const vis=a=>{let m=0,c=0;for(const x of a){if(x>m){m=x;c++;}}return c;};
A.add({id:'skyscrapers',name:'SKYSCRAPERS',cat:'PUZZLE',mouse:1,time:900,how:'FILL HEIGHTS, NO REPEATS PER LINE. EACH CLUE = TOWERS SEEN FROM THAT SIDE.',make(){
 const g={over:null,score:0},TC=['#8fd8ff','#4d9fff','#a870ff','#ff6fcf','#ffa53f','#ffd84a'];pinit();
 let N=4,CS=36,OX=0,OY=0,sol=[],clue={t:[],b:[],l:[],r:[]},gv=[],v=[],cur={x:0,y:0},hv={x:-1,y:-1},wt=0;
 const count=(C,G,limit,cap)=>{const n=N,g2=Array(n*n).fill(0),ru=Array(n).fill(0),cu=Array(n).fill(0);let nodes=0,found=0;
  const rec=i=>{if(found>=limit)return;if(nodes++>cap){found=99;return;}if(i===n*n){found++;return;}const x=i%n,y=i/n|0;
   for(let val=1;val<=n;val++){if(G[i]&&G[i]!==val)continue;const bit=1<<val;if(ru[y]&bit||cu[x]&bit)continue;g2[i]=val;let ok=true;
    if(x===n-1){const row=g2.slice(y*n,y*n+n);if(C.l[y]&&vis(row)!==C.l[y])ok=false;if(ok&&C.r[y]&&vis(row.reverse())!==C.r[y])ok=false;}else if(C.l[y]){const vv=vis(g2.slice(y*n,y*n+x+1));if(vv>C.l[y]||(val===n&&vv!==C.l[y]))ok=false;}
    if(ok){const col=[];for(let k=0;k<=y;k++)col.push(g2[k*n+x]);if(y===n-1){if(C.t[x]&&vis(col)!==C.t[x])ok=false;if(ok&&C.b[x]&&vis(col.reverse())!==C.b[x])ok=false;}else if(C.t[x]){const vv=vis(col);if(vv>C.t[x]||(val===n&&vv!==C.t[x]))ok=false;}}
    if(ok){ru[y]|=bit;cu[x]|=bit;rec(i+1);ru[y]&=~bit;cu[x]&=~bit;}g2[i]=0;if(found>=limit)return;}};rec(0);return found;};
 const gen=l=>{N=[4,4,5,5,6][l-1];CS=[34,34,30,30,26][l-1];OX=Math.round(118-N*CS/2);OY=Math.round(20+CS+(206-(N+2)*CS)/2);sol=latin(N);
  const line=(k,s)=>{const o=[];for(let i=0;i<N;i++)o.push(s==='t'||s==='b'?sol[i*N+k]:sol[k*N+i]);return s==='b'||s==='r'?o.reverse():o;};
  clue={t:[],b:[],l:[],r:[]};for(const s of['t','b','l','r'])for(let k=0;k<N;k++)clue[s][k]=vis(line(k,s));
  gv=Array(N*N).fill(0);const cap=N<5?60000:N<6?25000:9000;let guard=0;while(count(clue,gv,2,cap)!==1&&guard++<N*N){const e=[];gv.forEach((x,i)=>{if(!x)e.push(i);});const i=e[ri(e.length)];gv[i]=sol[i];}
  const keys=[];for(const s of['t','b','l','r'])for(let k=0;k<N;k++)keys.push([s,k]);shuf(keys);const tries=Math.round(keys.length*[.35,.6,.6,.8,.85][l-1]);
  for(let q=0;q<tries;q++){const[s,k]=keys[q];const sv=clue[s][k];clue[s][k]=0;if(count(clue,gv,2,cap)!==1)clue[s][k]=sv;}
  if(l>=3)for(const i of shuf([...Array(N*N).keys()])){if(!gv[i])continue;const sv=gv[i];gv[i]=0;if(count(clue,gv,2,cap)!==1)gv[i]=sv;}
  v=gv.slice();cur={x:0,y:0};wt=0;};
 const st=LV(g,5,gen);lvStart(st);
 g.cheat=()=>{v=sol.slice();if(won())wt=2;};
 const dup=i=>{const x=i%N,y=i/N|0,val=v[i];if(!val)return false;for(let k=0;k<N;k++){if(k!==x&&v[y*N+k]===val)return true;if(k!==y&&v[k*N+x]===val)return true;}return false;};
 const lineV=(k,s)=>{const o=[];for(let i=0;i<N;i++)o.push(s==='t'||s==='b'?v[i*N+k]:v[k*N+i]);return s==='b'||s==='r'?o.reverse():o;};
 const cst=(k,s)=>{const c=clue[s][k];if(!c)return 0;const a=lineV(k,s);if(a.every(x=>x))return vis(a)===c?1:2;let m=0,n=0;for(const x of a){if(!x)break;if(x>m){m=x;n++;}}return n>c?2:0;};
 const won=()=>v.every(x=>x)&&!v.some((_,i)=>dup(i))&&['t','b','l','r'].every(s=>clue[s].every((c,k)=>!c||cst(k,s)===1));
 const setV=val=>{const i=cur.y*N+cur.x;if(gv[i]){S('hit');return;}if(v[i]===val)return;v[i]=val;st.mv++;S('blip');if(won()){wt=40;S('coin');}};
 const cyc=d=>{const i=cur.y*N+cur.x;setV((v[i]+d+N+1)%(N+1));};
 g.update=()=>{pstep();if(lvTick(st))return;if(wt){if(--wt===0)lvWin(st,N*N*5,0);return;}
  hv={x:-1,y:-1};const mx=Math.floor((P.x-OX)/CS),my=Math.floor((P.y-OY)/CS);if(P.used&&mx>=0&&my>=0&&mx<N&&my<N)hv={x:mx,y:my};
  if(!padN(g,N,OX,OY,CS,cur,v,gv,setV,236)){if((P.press||P.rc)&&hv.x>=0){if(hv.x===cur.x&&hv.y===cur.y)cyc(P.rc?-1:1);else{cur.x=hv.x;cur.y=hv.y;S('blip');}}}
  gcur(cur,N,N);if(P.ka)cyc(1);if(P.kb)cyc(-1);};
 const tower=(x,y,val,given)=>blit('sky'+val+CS+given,x,y,CS,CS,(X,Y)=>{const h=CS*(.22+.62*val/N),w=CS*.5,bx=X+CS*.36,by=Y+CS-4,col=TC[(val-1)%6];
  A.poly([[bx+w,by],[bx+w+4,by-3],[bx+w+4,by-h-3],[bx+w,by-h]],lt(col,.55),1);A.poly([[bx,by-h],[bx+4,by-h-3],[bx+w+4,by-h-3],[bx+w,by-h]],lt(col,1.35),1);fr(bx,by-h,w,h,0,grad(bx,0,bx+w,0,[[0,lt(col,1.1)],[1,lt(col,.8)]]));
  for(let wy=by-h+3;wy<by-3;wy+=4)for(let wx=bx+2;wx<bx+w-2;wx+=3)A.rect(wx,wy,1.4,1.6,'rgba(255,250,200,.55)');T(val,X+3,Y+3,given?'#ffd84a':'#ffffff',CS>=30?2:1);});
 g.draw=()=>{bgd('#1a1f3a');const c=A.c;bev(OX-CS-4,OY-CS-4,(N+2)*CS+8,(N+2)*CS+8,'#262c52',10,4);
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+(i/N|0)*CS;fr(x+1,y+1,CS-2,CS-2,3,(i%N+(i/N|0))%2?'#323a64':'#2c335a');if(hv.x===i%N&&hv.y===(i/N|0))fr(x+1,y+1,CS-2,CS-2,3,'rgba(255,255,255,.08)');if(v[i]){tower(x,y,v[i],gv[i]?1:0);if(dup(i))fr(x+1,y+1,CS-2,CS-2,3,'rgba(255,40,70,'+(.3+.2*pulse(.3))+')');}}
  const SCL=['#e8e4ff','#7ee08a','#ff6a7a'];const cl_=(x,y,k,s)=>{const n=clue[s][k];if(!n)return;const col=SCL[cst(k,s)];A.circ(x,y,CS*.3,col);T(n,x+1,y-(CS>=30?4:2),'#1a1f3a',CS>=30?2:1,'c');};
  for(let k=0;k<N;k++){cl_(OX+k*CS+CS/2,OY-CS/2,k,'t');cl_(OX+k*CS+CS/2,OY+N*CS+CS/2,k,'b');cl_(OX-CS/2,OY+k*CS+CS/2,k,'l');cl_(OX+N*CS+CS/2,OY+k*CS+CS/2,k,'r');}
  if(!st.clr)cbox(OX+cur.x*CS+1,OY+cur.y*CS+1,CS-2,CS-2,4,K.y);padDraw(N,236,v[cur.y*N+cur.x]);hud(g,st,'MOVES '+st.mv+'   '+mmss(st.t));lvDraw(st);pcur();};
 return g;}});

/* ================= 16. QUEENS ================= */
A.add({id:'queens',name:'QUEENS',cat:'PUZZLE',mouse:1,time:900,how:'A/CLICK: QUEEN. B: X. ONE PER ROW, COLUMN AND COLOUR. QUEENS MAY NOT TOUCH.',make(){
 const g={over:null,score:0},RC=['#ef8080','#f7b267','#f4e285','#9fd88a','#7fd3d0','#8fb3f0','#b99af0','#f4a6e0','#c8b090'];pinit();
 let scol=[],N=5,CS=36,OX=0,OY=0,reg=[],q=[],mk=[],cur={x:0,y:0},wt=0,bad=new Set(),nq=0;
 const place=n=>{const cols=[];const rec=r=>{if(r===n)return true;for(const c of shuf([...Array(n).keys()])){if(cols.includes(c))continue;if(r>0&&Math.abs(cols[r-1]-c)<=1)continue;cols.push(c);if(rec(r+1))return true;cols.pop();}return false;};rec(0);return cols;};
 const grow=(n,cols)=>{const R=Array(n*n).fill(-1);cols.forEach((c,r)=>{R[r*n+c]=r;});let left=n*n-n,guard=0;while(left>0&&guard++<30000){const k=ri(n),cand=[];for(let i=0;i<n*n;i++)if(R[i]===k){const x=i%n,y=i/n|0;D4.forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<n&&ny<n&&R[ny*n+nx]<0)cand.push(ny*n+nx);});}if(cand.length){R[cand[ri(cand.length)]]=k;left--;}}return R;};
 const countQ=(n,R,limit)=>{let found=0;const cu=[],ru=new Set();const rec=(r,prev)=>{if(found>=limit)return;if(r===n){found++;return;}for(let c=0;c<n;c++){if(cu[c]||(r>0&&Math.abs(prev-c)<=1))continue;const k=R[r*n+c];if(ru.has(k))continue;cu[c]=1;ru.add(k);rec(r+1,c);cu[c]=0;ru.delete(k);}};rec(0,-9);return found;};
 const gen=l=>{N=[5,6,7,8,9][l-1];CS=Math.min(38,Math.floor(198/N));OX=Math.round(160-N*CS/2);OY=Math.round(22+(204-N*CS)/2);
  for(let tr=0;tr<200;tr++){const cols=place(N),R=grow(N,cols);if(R.some(x=>x<0))continue;reg=R;scol=cols;if(countQ(N,R,2)===1)break;}
  const cm=shuf([...Array(9).keys()]);reg=reg.map(k=>cm[k]);q=Array(N*N).fill(0);mk=Array(N*N).fill(0);cur={x:0,y:0};wt=0;conf();};
 const conf=()=>{bad=new Set();const Q=[];q.forEach((x,i)=>{if(x)Q.push(i);});for(let a=0;a<Q.length;a++)for(let b=a+1;b<Q.length;b++){const i=Q[a],j=Q[b],xi=i%N,yi=i/N|0,xj=j%N,yj=j/N|0;if(xi===xj||yi===yj||reg[i]===reg[j]||(Math.abs(xi-xj)<=1&&Math.abs(yi-yj)<=1)){bad.add(i);bad.add(j);}}nq=Q.length;};
 const st=LV(g,5,gen);lvStart(st);
 g.cheat=()=>{q=Array(N*N).fill(0);scol.forEach((c,r)=>{q[r*N+c]=1;});conf();if(nq===N&&!bad.size)wt=2;};
 const tog=(i,b)=>{if(b){if(q[i])return;mk[i]^=1;S('blip');return;}q[i]^=1;mk[i]=0;st.mv++;conf();S(q[i]?(bad.has(i)?'hit':'coin'):'blip');if(q[i]&&bad.has(i))A.shake=2;if(nq===N&&!bad.size){wt=45;S('win');}};
 g.update=()=>{pstep();if(lvTick(st))return;if(wt){if(--wt===0)lvWin(st,N*N*2,N+2);return;}const on=gmouse(cur,OX,OY,CS,N,N);gcur(cur,N,N);const i=cur.y*N+cur.x;if((P.press&&on)||P.ka)tog(i,0);if((P.rc&&on)||P.kb)tog(i,1);};
 g.draw=()=>{bgd('#2e2445');const c=A.c;bev(OX-6,OY-6,N*CS+12,N*CS+12,'#4a3a6a',8,4);
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+(i/N|0)*CS,col=RC[reg[i]%9];fr(x,y,CS,CS,0,grad(0,y,0,y+CS,[[0,lt(col,1.08)],[1,lt(col,.92)]]));if(q[i]&&bad.has(i))fr(x,y,CS,CS,0,'rgba(255,40,70,.35)');}
  c.fillStyle='rgba(40,20,60,.25)';for(let k=1;k<N;k++){c.fillRect(OX+k*CS,OY,1,N*CS);c.fillRect(OX,OY+k*CS,N*CS,1);}
  for(let i=0;i<N*N;i++){const x=i%N,y=i/N|0;if(x<N-1&&reg[i]!==reg[i+1])A.rect(OX+(x+1)*CS-1,OY+y*CS-1,2,CS+2,'#2a1a3a');if(y<N-1&&reg[i]!==reg[i+N])A.rect(OX+x*CS-1,OY+(y+1)*CS-1,CS+2,2,'#2a1a3a');}
  sr(OX-1,OY-1,N*CS+2,N*CS+2,2,'#2a1a3a',2.5);
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS+CS/2,y=OY+(i/N|0)*CS+CS/2;if(q[i]){const b=bad.has(i);if(wt)glow(x,y,CS*.7,'#ffd84a',.5);crown(x+(b?Math.sin(A.t*.8):0),y+1,CS*.3,b?'#ff5a6e':'#ffd84a',b?'#7a1020':'#8a5a10');}else if(mk[i]){ln(x-CS*.14,y-CS*.14,x+CS*.14,y+CS*.14,'rgba(60,30,80,.6)',2);ln(x+CS*.14,y-CS*.14,x-CS*.14,y+CS*.14,'rgba(60,30,80,.6)',2);}}
  if(!st.clr)cbox(OX+cur.x*CS+1,OY+cur.y*CS+1,CS-2,CS-2,4,'#ffffff');hud(g,st,'QUEENS '+nq+'/'+N+'   '+mmss(st.t),bad.size?K.r:K.c);lvDraw(st);pcur();};
 return g;}});
})();
