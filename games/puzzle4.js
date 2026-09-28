(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const mv=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};const CO=[K.r,K.y,K.c,K.p,K.g,K.o];

A.add({id:'samegame',name:'SAME GAME',cat:'PUZZLE',how:'A REMOVES A GROUP OF 2+ SAME COLOURS. BIGGER GROUPS SCORE MORE.',make(){
 const g={over:null,score:0},NX=12,NY=9;let b=[],c={x:0,y:8};for(let x=0;x<NX;x++){b.push([]);for(let y=0;y<NY;y++)b[x].push(ri(4));}
 const grp=(x,y)=>{const v=b[x][y];if(v<0)return[];const s=new Set(),st=[[x,y]];while(st.length){const[i,j]=st.pop(),k=i+','+j;if(s.has(k)||i<0||j<0||i>=NX||j>=NY||b[i][j]!==v)continue;s.add(k);st.push([i+1,j],[i-1,j],[i,j+1],[i,j-1]);}return[...s].map(k=>k.split(',').map(Number));};
 const any=()=>{for(let x=0;x<NX;x++)for(let y=0;y<NY;y++)if(b[x][y]>=0&&grp(x,y).length>1)return true;return false;};
 g.update=()=>{const h=A.hit(0);mv(h,c,NX,NY);if(h.a){const gg=grp(c.x,c.y);if(gg.length>1){gg.forEach(([x,y])=>{b[x][y]=-1;A.burst(20+x*24+12,20+y*22+10,CO[0],2);});g.score+=(gg.length-1)**2;S('coin');for(let x=0;x<NX;x++){const col=b[x].filter(v=>v>=0);b[x]=Array(NY-col.length).fill(-1).concat(col);}b=b.filter(col=>col.some(v=>v>=0));while(b.length<NX)b.push(Array(NY).fill(-1));if(b.every(col=>col.every(v=>v<0))){g.score+=1000;g.over='BOARD CLEARED! WIN';A.confetti();}else if(!any())g.over='NO MOVES LEFT';}else S('lose');}};
 g.draw=()=>{A.cls('#140a2a');const gg=b[c.x]&&b[c.x][c.y]>=0?grp(c.x,c.y):[];const hs=new Set(gg.map(p=>p.join(',')));for(let x=0;x<NX;x++)for(let y=0;y<NY;y++){const v=b[x][y];if(v<0)continue;C(20+x*24+12,20+y*22+11,hs.has(x+','+y)?11:9,CO[v]);}A.box(20+c.x*24,20+c.y*22,24,22,K.w);T('SCORE '+g.score,6,6,K.y,1);if(gg.length>1)T('+'+(gg.length-1)**2,W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'spotodd',name:'SPOT THE ODD',cat:'PUZZLE',how:'ONE TILE IS A SLIGHTLY DIFFERENT SHADE. FIND IT WITH A. 60 SEC.',make(){
 const g={over:null,score:0};let N=2,odd,base,c={x:0,y:0},time=3600;const gen=()=>{N=Math.min(8,2+(g.score/2|0));odd=ri(N*N);base=[ri(200)+30,ri(200)+30,ri(200)+30];c={x:0,y:0};};gen();
 g.update=()=>{time--;if(time<=0){g.over='TIME UP';return;}const h=A.hit(0);mv(h,c,N,N);if(h.a){if(c.y*N+c.x===odd){g.score++;S('coin');A.burst(160,120,K.y,10);gen();}else{time-=180;S('lose');A.shake=4;}}};
 g.draw=()=>{A.cls('#0d0926');const CS=Math.floor(190/N),OX=160-N*CS/2,OY=30,d=Math.max(8,40-g.score*2);for(let i=0;i<N*N;i++){const v=i===odd?base.map(x=>Math.min(255,x+d)):base;A.c.fillStyle=`rgb(${v[0]},${v[1]},${v[2]})`;A.c.fillRect(OX+(i%N)*CS+2,OY+((i/N)|0)*CS+2,CS-4,CS-4);}A.box(OX+c.x*CS,OY+c.y*CS,CS,CS,K.w);T('FOUND '+g.score,6,6,K.y,2);T(Math.ceil(time/60),W-6,6,K.w,2,'r');};
 return g;}});

A.add({id:'sortit',name:'SORT IT',cat:'PUZZLE',low:1,how:'A PICKS A BAR, A AGAIN SWAPS. SORT SHORT TO TALL IN FEW SWAPS.',make(){
 const g={over:null,score:0};let n=6,bars,sel=-1,c=0,lvl=0;const gen=()=>{lvl++;n=Math.min(10,5+lvl);bars=shuf([...Array(n).keys()].map(i=>i+1));if(bars.every((v,i)=>v===i+1))[bars[0],bars[1]]=[bars[1],bars[0]];sel=-1;c=0;};gen();
 g.update=()=>{const h=A.hit(0);if(h.l)c=(c+n-1)%n;if(h.r)c=(c+1)%n;if(h.l||h.r)S('blip');if(h.a){if(sel<0)sel=c;else{if(sel!==c){[bars[sel],bars[c]]=[bars[c],bars[sel]];g.score++;S('hit');}sel=-1;if(bars.every((v,i)=>v===i+1)){S('win');A.confetti();if(lvl>=5)g.over='SORTED IN '+g.score+' SWAPS! WIN';else gen();}}}};
 g.draw=()=>{A.cls('#1a1238');const w=260/n;bars.forEach((v,i)=>{const x=30+i*w,hh=v*16;R(x+2,210-hh,w-4,hh,i===sel?K.y:v===i+1?K.g:A.mix('#ff3f8e','#2fe8d0',v/n));T(v,x+w/2,214,K.w,1,'c');});A.box(30+c*w,20,w,200,K.w);T('LEVEL '+lvl+'/5',6,6,K.w,1);T('SWAPS '+g.score,W-6,6,K.y,1,'r');};
 return g;}});

A.add({id:'symmetry',name:'SYMMETRY',cat:'PUZZLE',how:'MIRROR THE LEFT PATTERN ONTO THE RIGHT GRID. A TOGGLES A CELL.',make(){
 const g={over:null,score:0},N=5;let L_,Rg,c={x:0,y:0},lvl=0,t=0;const gen=()=>{lvl++;L_=[];for(let i=0;i<N*N;i++)L_.push(Math.random()<.35+lvl*.03?1:0);Rg=Array(N*N).fill(0);t=0;};gen();
 const done=()=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(L_[y*N+x]!==Rg[y*N+(N-1-x)])return false;return true;};
 g.update=()=>{t++;const h=A.hit(0);mv(h,c,N,N);if(h.a){Rg[c.y*N+c.x]^=1;S('blip');if(done()){g.score+=Math.max(20,200-(t/30|0));S('win');A.burst(240,120,K.c,20);if(lvl>=8)g.over='PERFECT MIRROR! WIN';else gen();}}};
 g.draw=()=>{A.cls('#0d0926');const CS=24;for(let i=0;i<N*N;i++){const x=(i%N),y=(i/N)|0;R(30+x*CS,50+y*CS,CS-2,CS-2,L_[i]?K.p:'#2b2257');R(170+x*CS,50+y*CS,CS-2,CS-2,Rg[i]?K.c:'#2b2257');}R(158,40,2,140,K.y);A.box(170+c.x*CS-1,50+c.y*CS-1,CS+1,CS+1,K.w);T('LEVEL '+lvl+'/8',6,6,K.w,1);T('SCORE '+g.score,W-6,6,K.y,1,'r');};
 return g;}});

A.add({id:'countdots',name:'COUNT FAST',cat:'PUZZLE',how:'DOTS FLASH BRIEFLY. LEFT/RIGHT PICK HOW MANY, A CONFIRMS. 3 STRIKES.',make(){
 const g={over:null,score:0};let dots,n,ph,t,guess,strikes=0;const gen=()=>{n=3+ri(4+Math.min(10,g.score));dots=[];for(let i=0;i<n;i++)dots.push({x:40+rnd(240),y:40+rnd(150),c:CO[ri(6)]});ph='show';t=0;guess=5;};gen();
 g.update=()=>{t++;if(ph==='show'){if(t>Math.max(25,90-g.score*4)){ph='ask';t=0;}return;}if(ph==='res'){if(t>50){if(strikes>=3)g.over='3 STRIKES';else gen();}return;}const h=A.hit(0);if(h.l)guess=Math.max(1,guess-1);if(h.r)guess=Math.min(30,guess+1);if(h.a){if(guess===n){g.score++;S('coin');}else{strikes++;S('lose');}ph='res';t=0;}};
 g.draw=()=>{A.cls('#0d0926');if(ph==='show')dots.forEach(d=>C(d.x,d.y,6,d.c));if(ph==='ask'){T('HOW MANY?',160,80,K.w,2,'c');T('< '+guess+' >',160,120,K.y,4,'c');}if(ph==='res'){T(guess===n?'CORRECT':'IT WAS '+n,160,110,guess===n?K.g:K.r,3,'c');}T('SCORE '+g.score,6,6,K.y,2);T('X'.repeat(strikes),W-6,6,K.r,2,'r');};
 return g;}});

A.add({id:'patterncopy',name:'PATTERN COPY',cat:'PUZZLE',how:'COPY THE TARGET: A CYCLES A CELL\'S COLOUR. FEWER PRESSES = MORE POINTS.',make(){
 const g={over:null,score:0},N=4;let tgt,b,c={x:0,y:0},lvl=0,pr=0;const gen=()=>{lvl++;const k=Math.min(4,2+(lvl/2|0));tgt=[...Array(N*N)].map(()=>ri(k));b=Array(N*N).fill(0);pr=0;};gen();
 g.update=()=>{const h=A.hit(0);mv(h,c,N,N);if(h.a){const k=Math.min(4,2+(lvl/2|0));const i=c.y*N+c.x;b[i]=(b[i]+1)%k;pr++;S('blip');if(b.every((v,j)=>v===tgt[j])){g.score+=Math.max(10,100-pr*2);S('win');A.confetti();if(lvl>=8)g.over='ALL COPIED! WIN';else gen();}}};
 g.draw=()=>{A.cls('#140a2a');const CS=30;for(let i=0;i<N*N;i++){const x=i%N,y=(i/N)|0;R(24+x*CS/2,60+y*CS/2,CS/2-2,CS/2-2,CO[tgt[i]]);R(130+x*CS,40+y*CS,CS-3,CS-3,CO[b[i]]);if(b[i]===tgt[i])R(130+x*CS+CS/2-3,40+y*CS+CS/2-3,4,4,K.w);}T('TARGET',54,48,K.w,1,'c');A.box(130+c.x*CS-1,40+c.y*CS-1,CS+1,CS+1,K.w);T('LEVEL '+lvl+'/8',6,6,K.w,1);T('SCORE '+g.score,W-6,6,K.y,1,'r');};
 return g;}});

A.add({id:'magicsquare',name:'MAGIC SQUARE',cat:'PUZZLE',how:'FILL 1-9 SO EVERY ROW, COLUMN AND DIAGONAL SUMS TO 15. A CYCLES A NUMBER.',make(){
 const g={over:null,score:0};const sols=[[2,7,6,9,5,1,4,3,8]];let s=sols[0].slice();for(let k=ri(4);k>0;k--)s=[s[6],s[3],s[0],s[7],s[4],s[1],s[8],s[5],s[2]];if(Math.random()<.5)s=[s[2],s[1],s[0],s[5],s[4],s[3],s[8],s[7],s[6]];
 let giv=[0,1,2,3,4,5,6,7,8].map(()=>false);shuf([0,1,2,3,4,5,6,7,8]).slice(0,3).forEach(i=>giv[i]=true);let b=s.map((v,i)=>giv[i]?v:0),c={x:0,y:0},t=0;
 const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 g.update=()=>{t++;const h=A.hit(0);mv(h,c,3,3);const i=c.y*3+c.x;if(h.a&&!giv[i]){b[i]=b[i]%9+1;S('blip');if(lines.every(l=>l.reduce((a,j)=>a+b[j],0)===15)&&new Set(b).size===9){g.score=Math.max(50,1000-(t/6|0));S('win');A.confetti();g.over='MAGIC! WIN';}}};
 g.draw=()=>{A.cls('#1a1238');for(let i=0;i<9;i++){const x=100+(i%3)*40,y=40+((i/3)|0)*40;R(x,y,38,38,giv[i]?'#3a2a78':'#2b2257');if(b[i])T(b[i],x+19,y+12,giv[i]?K.gr:K.w,3,'c');}A.box(100+c.x*40-1,40+c.y*40-1,40,40,K.y);
  lines.forEach((l,k)=>{const s_=l.reduce((a,j)=>a+b[j],0);const col=s_===15?K.g:s_>15?K.r:K.gr;if(k<3)T(s_,230,52+k*40,col,1);else if(k<6)T(s_,119+(k-3)*40,168,col,1,'c');else T(s_,k===6?230:86,168,col,1);});T('TARGET 15',160,210,K.y,1,'c');};
 return g;}});

A.add({id:'sequence',name:'NEXT NUMBER',cat:'PUZZLE',how:'FIND THE PATTERN. LEFT/RIGHT PICK THE NEXT NUMBER, A CONFIRMS. 3 STRIKES.',make(){
 const g={over:null,score:0};let seq,ans,opts,sel,strikes=0,fl=0,msg='';const gen=()=>{const k=ri(Math.min(5,2+g.score/3|0)),a=1+ri(9),d=1+ri(6);seq=[];for(let i=0;i<5;i++)seq.push(k===0?a+d*i:k===1?a*Math.pow(2,i):k===2?(i+1)*(i+1)+a:k===3?[1,1,2,3,5,8,13,21][i]+a:a+d*i*(i%2?-1:1));const nx=k===0?a+d*5:k===1?a*32:k===2?36+a:k===3?13+a:a-d*5;ans=nx;const o=new Set([ans]);while(o.size<4)o.add(ans+ri(11)-5);opts=shuf([...o]);sel=0;};gen();
 g.update=()=>{if(fl>0){if(--fl===0){if(strikes>=3)g.over='3 STRIKES';else gen();}return;}const h=A.hit(0);if(h.l)sel=(sel+3)%4;if(h.r)sel=(sel+1)%4;if(h.a){if(opts[sel]===ans){g.score++;msg='CORRECT';S('coin');}else{strikes++;msg='IT WAS '+ans;S('lose');}fl=45;}};
 g.draw=()=>{A.cls('#0d0926');T(seq.join('  ')+'  ?',160,70,K.w,2,'c');opts.forEach((o,i)=>{R(40+i*62,130,54,30,i===sel?K.y:'#2b2257');T(o,67+i*62,141,i===sel?K.k:K.w,1,'c');});if(fl)T(msg,160,190,msg==='CORRECT'?K.g:K.r,2,'c');T('SCORE '+g.score,6,6,K.y,2);T('X'.repeat(strikes),W-6,6,K.r,2,'r');};
 return g;}});

A.add({id:'shiftgrid',name:'SHIFT GRID',cat:'PUZZLE',low:1,how:'UP/DOWN PICK A ROW, LEFT/RIGHT SLIDES IT. B SWITCHES TO COLUMNS. MATCH THE TARGET.',make(){
 const g={over:null,score:0},N=4;let tgt,b,row=0,col=false,lvl=0;
 const gen=()=>{lvl++;tgt=[...Array(N*N)].map((_,i)=>CO[(i%N+((i/N)|0))%4]);b=tgt.slice();for(let k=0;k<2+lvl*2;k++){const r=ri(N),d=Math.random()<.5?1:-1;shift(ri(2)===1,r,d);}if(b.every((v,i)=>v===tgt[i]))shift(false,0,1);g.score_=0;};
 const shift=(isCol,r,d)=>{const idx=[...Array(N).keys()].map(k=>isCol?k*N+r:r*N+k);const vals=idx.map(i=>b[i]);idx.forEach((ix,k)=>b[ix]=vals[(k-d+N)%N]);};gen();
 g.update=()=>{const h=A.hit(0);if(h.b){col=!col;S('blip');}if(col){if(h.l)row=(row+N-1)%N;if(h.r)row=(row+1)%N;if(h.u||h.d){shift(true,row,h.d?1:-1);g.score++;S('hit');}}else{if(h.u)row=(row+N-1)%N;if(h.d)row=(row+1)%N;if(h.l||h.r){shift(false,row,h.r?1:-1);g.score++;S('hit');}}
  if(b.every((v,i)=>v===tgt[i])){S('win');A.confetti();if(lvl>=6)g.over='ALIGNED IN '+g.score+' MOVES! WIN';else gen();}};
 g.draw=()=>{A.cls('#1a1238');const CS=36;for(let i=0;i<N*N;i++){const x=i%N,y=(i/N)|0;R(120+x*CS,40+y*CS,CS-3,CS-3,b[i]);R(20+x*18,60+y*18,16,16,tgt[i]);}T('TARGET',56,48,K.w,1,'c');if(col)A.box(120+row*CS-2,38,CS+1,N*CS+2,K.w);else A.box(118,40+row*CS-2,N*CS+2,CS+1,K.w);T('LEVEL '+lvl+'/6',6,6,K.w,1);T('MOVES '+g.score,W-6,6,K.y,1,'r');T(col?'COLUMN MODE (B)':'ROW MODE (B)',230,200,K.gr,1,'c');};
 return g;}});

A.add({id:'pathlink',name:'PATH LINK',cat:'PUZZLE',how:'A ROTATES A ROAD TILE. CONNECT THE HOUSE TO THE SHOP BEFORE TIME RUNS OUT.',make(){
 const g={over:null,score:0},N=6;let b,c={x:0,y:0},lvl=0,time=0,sr,er,path=[];
 const conn=t=>{let s=t.k===0?[[1,0],[-1,0]]:t.k===1?[[1,0],[0,1]]:[[1,0],[-1,0],[0,1]];for(let i=0;i<t.r;i++)s=s.map(d=>[-d[1],d[0]]);return s;};
 const gen=()=>{lvl++;b=[];for(let i=0;i<N*N;i++)b.push({k:ri(3),r:ri(4)});sr=ri(N);er=ri(N);let x=0,y=sr,prev=[-1,0];const route=[[x,y]];while(x<N-1||y!==er){let nx=x,ny=y;if(x<N-1&&(y===er||Math.random()<.5))nx++;else ny+=er>y?1:-1;route.push([nx,ny]);x=nx;y=ny;}route.forEach((p,i)=>{const pr=i?route[i-1]:[p[0]-1,p[1]],nx=route[i+1]||[p[0]+1,p[1]];const a=[pr[0]-p[0],pr[1]-p[1]],bb=[nx[0]-p[0],nx[1]-p[1]];b[p[1]*N+p[0]]={k:a[0]===-bb[0]&&a[1]===-bb[1]?0:1,r:ri(4)};});time=Math.max(20,60-lvl*4)*60;};gen();
 const check=()=>{let x=0,y=sr,from=[-1,0];path=[];for(let s=0;s<60;s++){if(x<0||y<0||x>=N||y>=N)return false;const cs=conn(b[y*N+x]),inD=[-from[0],-from[1]];if(!cs.some(d=>d[0]===inD[0]&&d[1]===inD[1]))return false;path.push(y*N+x);if(x===N-1&&y===er&&cs.some(d=>d[0]===1&&d[1]===0))return true;const out=cs.find(d=>!(d[0]===inD[0]&&d[1]===inD[1])&&!(x+d[0]<0));if(!out)return false;x+=out[0];y+=out[1];from=out;}return false;};
 g.update=()=>{time--;if(time<=0){g.over='TOO SLOW';return;}const h=A.hit(0);mv(h,c,N,N);if(h.a){const t=b[c.y*N+c.x];t.r=(t.r+1)%4;S('blip');if(check()){g.score+=Math.ceil(time/60)*5;S('win');A.burst(290,40+er*30,K.g,20);if(lvl>=6)g.over='TOWN CONNECTED! WIN';else gen();}}};
 g.draw=()=>{A.cls('#6aa84a');const CS=30,OX=70,OY=36;R(OX-26,OY+sr*CS+6,22,18,K.r);A.poly([[OX-28,OY+sr*CS+8],[OX-15,OY+sr*CS-2],[OX-2,OY+sr*CS+8]],'#8a3a2a',1);R(OX+N*CS+4,OY+er*CS+6,24,18,K.b);T('SHOP',OX+N*CS+16,OY+er*CS+12,K.w,1,'c');
  b.forEach((t,i)=>{const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS;R(x,y,CS-1,CS-1,'#5a983a');const on=path.includes(i);conn(t).forEach(d=>R(x+CS/2-4+Math.min(0,d[0])*11,y+CS/2-4+Math.min(0,d[1])*11,8+Math.abs(d[0])*11,8+Math.abs(d[1])*11,on?'#8a8a9a':'#6a6a78'));R(x+CS/2-4,y+CS/2-4,8,8,on?'#8a8a9a':'#6a6a78');});A.box(OX+c.x*CS,OY+c.y*CS,CS,CS,K.y);T('TOWN '+lvl+'/6',6,6,K.k,1);T(Math.ceil(time/60),W-6,6,K.k,2,'r');};
 return g;}});
})();
