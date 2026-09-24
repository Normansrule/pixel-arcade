(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};

/* ---- SNAKE DUEL ---- */
A.add({id:'snakeduel',name:'SNAKE DUEL',cat:'VERSUS',vs:1,how:'STEER. EAT TO GROW. CRASH AND YOU LOSE. FIRST TO 3.',make(){
 const g={over:null,score:0},CW=32,CH=21;let s,d,nd,f,t=0,sc=[0,0],wait=40;
 const occ=(x,y)=>s[0].some(c=>c[0]===x&&c[1]===y)||s[1].some(c=>c[0]===x&&c[1]===y);
 const reset=()=>{s=[[[6,10],[5,10],[4,10]],[[25,10],[26,10],[27,10]]];d=[[1,0],[-1,0]];nd=[[1,0],[-1,0]];f=[16,10];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}
  if(A.cpu){const h=s[1][0],opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(v=>!(v[0]===-d[1][0]&&v[1]===-d[1][1]));let best=null,bs=-1e9;for(const v of opts){const nx=h[0]+v[0],ny=h[1]+v[1];if(nx<0||ny<0||nx>=CW||ny>=CH||occ(nx,ny))continue;let sc_=-Math.abs(nx-f[0])-Math.abs(ny-f[1]);let room=0;for(const w of opts){const px=nx+w[0],py=ny+w[1];if(px>=0&&py>=0&&px<CW&&py<CH&&!occ(px,py))room++;}sc_+=room*3*A.ai+rnd(A.ai<.6?4:.5);if(sc_>bs){bs=sc_;best=v;}}if(best)nd[1]=best;}
  for(let i=0;i<(A.cpu?1:2);i++){const h=A.hit(i);if(h.l&&d[i][0]!==1)nd[i]=[-1,0];if(h.r&&d[i][0]!==-1)nd[i]=[1,0];if(h.u&&d[i][1]!==1)nd[i]=[0,-1];if(h.d&&d[i][1]!==-1)nd[i]=[0,1];}
  if(++t<6)return;t=0;const dead=[0,0];for(let i=0;i<2;i++){d[i]=nd[i];const n=[s[i][0][0]+d[i][0],s[i][0][1]+d[i][1]];if(n[0]<0||n[1]<0||n[0]>=CW||n[1]>=CH||occ(n[0],n[1]))dead[i]=1;else{s[i].unshift(n);if(n[0]===f[0]&&n[1]===f[1]){S('coin');f=[ri(CW),ri(CH)];}else s[i].pop();}}
  if(s[0][0][0]===s[1][0][0]&&s[0][0][1]===s[1][0][1])dead[0]=dead[1]=1;if(dead[0]||dead[1]){S('boom');if(dead[0]!==dead[1]){const w=dead[0]?1:0;sc[w]++;if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 g.draw=()=>{A.cls();R(0,0,W,20,K.d);A.hud2(sc[0],sc[1]);s.forEach((sn,i)=>sn.forEach((c,j)=>R(c[0]*10+1,c[1]*10+21,8,8,j?(i?'#a0205a':'#178a7d'):(i?K.p:K.c))));R(f[0]*10+2,f[1]*10+22,6,6,K.y);if(wait>0)T('READY',160,110,K.y,2,'c');};
 return g;}});

/* ---- BLAST MAZE ---- */
A.add({id:'blast',name:'BLAST MAZE',cat:'VERSUS',vs:1,how:'MOVE. A DROPS A BOMB. BLOW UP CRATES AND YOUR RIVAL. FIRST TO 3.',make(){
 const g={over:null,score:0},GW=15,GH=11,CS=18,OX=25,OY=24;let m,p,bombs,fire,sc=[0,0],wait=40;
 const reset=()=>{m=[];for(let y=0;y<GH;y++){m.push([]);for(let x=0;x<GW;x++)m[y].push(x===0||y===0||x===GW-1||y===GH-1||(x%2===0&&y%2===0)?1:Math.random()<.55?2:0);}[[1,1],[2,1],[1,2],[GW-2,GH-2],[GW-3,GH-2],[GW-2,GH-3]].forEach(c=>m[c[1]][c[0]]=0);p=[{x:1,y:1,fx:1,fy:1,mv:0},{x:GW-2,y:GH-2,fx:GW-2,fy:GH-2,mv:0}];bombs=[];fire=[];wait=40;};reset();
 const dang=(x,y)=>bombs.some(b=>(b.x===x&&Math.abs(b.y-y)<=2)||(b.y===y&&Math.abs(b.x-x)<=2))||fire.some(f=>f.x===x&&f.y===y);
 g.update=()=>{if(wait>0){wait--;return;}
  if(A.cpu){const q=p[1],o=p[0];let o2={};const opts=[[1,0,'r'],[-1,0,'l'],[0,1,'d'],[0,-1,'u']].filter(v=>m[q.y+v[1]][q.x+v[0]]===0&&!bombs.some(b=>b.x===q.x+v[0]&&b.y===q.y+v[1]));
   if(dang(q.x,q.y)){const safe=opts.filter(v=>!dang(q.x+v[0],q.y+v[1]));const v=(safe.length?safe:opts)[0];if(v)o2[v[2]]=1;}
   else{const near=Math.abs(o.x-q.x)+Math.abs(o.y-q.y)<=2,crate=[[1,0],[-1,0],[0,1],[0,-1]].some(v=>m[q.y+v[1]][q.x+v[0]]===2);if((near||crate)&&Math.random()<.04+.06*A.ai&&!bombs.some(b=>b.o===1)&&opts.some(v=>!dang(q.x+v[0],q.y+v[1])))o2.a=1;else if(Math.random()<.5){let best=opts.filter(v=>!dang(q.x+v[0],q.y+v[1]));best.sort((a,b)=>(Math.abs(o.x-q.x-a[0])+Math.abs(o.y-q.y-a[1]))-(Math.abs(o.x-q.x-b[0])+Math.abs(o.y-q.y-b[1])));if(best.length){const v=Math.random()<A.ai?best[0]:best[ri(best.length)];o2[v[2]]=1;}}}A.bot(o2);}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i);if(q.mv>0){q.mv--;q.fx+=(q.x-q.fx)*.35;q.fy+=(q.y-q.fy)*.35;}else{q.fx=q.x;q.fy=q.y;const dx=ax(k),dy=dx?0:ay(k);if((dx||dy)&&m[q.y+dy][q.x+dx]===0&&!bombs.some(b=>b.x===q.x+dx&&b.y===q.y+dy)){q.x+=dx;q.y+=dy;q.mv=i&&A.cpu?9-3*A.ai:6;}}
   if(A.hit(i).a&&!bombs.some(b=>b.x===q.x&&b.y===q.y)&&bombs.filter(b=>b.o===i).length<2){bombs.push({x:q.x,y:q.y,t:120,o:i});S('blip');}}
  for(const b of bombs){b.t--;if(b.t<=0){b.dead=1;S('boom');fire.push({x:b.x,y:b.y,t:20});for(const v of[[1,0],[-1,0],[0,1],[0,-1]])for(let n=1;n<=2;n++){const x=b.x+v[0]*n,y=b.y+v[1]*n;if(m[y][x]===1)break;fire.push({x,y,t:20});if(m[y][x]===2){m[y][x]=0;break;}const ob=bombs.find(o=>o.x===x&&o.y===y&&!o.dead);if(ob)ob.t=1;}}}
  bombs=bombs.filter(b=>!b.dead);fire.forEach(f=>f.t--);fire=fire.filter(f=>f.t>0);const dead=p.map(q=>fire.some(f=>f.x===q.x&&f.y===q.y));
  if(dead[0]||dead[1]){if(dead[0]!==dead[1]){const w=dead[0]?1:0;sc[w]++;if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 g.draw=()=>{A.cls('#1e8a45');m.forEach((row,y)=>row.forEach((v,x)=>{const X=OX+x*CS,Y=OY+y*CS;if(v===1){R(X,Y,CS,CS,'#4a4570');R(X+2,Y+2,CS-4,CS-4,'#6a65a0');}else if(v===2){R(X+1,Y+1,CS-2,CS-2,'#b5651d');A.box(X+1,Y+1,CS-2,CS-2,'#5b3a1e');}}));
  bombs.forEach(b=>{C(OX+b.x*CS+9,OY+b.y*CS+9,b.t%20<10?6:7,K.k);R(OX+b.x*CS+8,OY+b.y*CS+1,2,3,K.o);});fire.forEach(f=>R(OX+f.x*CS+2,OY+f.y*CS+2,CS-4,CS-4,f.t%4<2?K.y:K.o));
  p.forEach((q,i)=>{const X=OX+q.fx*CS,Y=OY+q.fy*CS;R(X+4,Y+6,10,10,i?K.p:K.c);R(X+5,Y+1,8,6,'#ffd9a8');});A.hud2(sc[0],sc[1]);if(wait>0)T('FIGHT!',160,110,K.y,3,'c');};
 return g;}});

/* ---- TUG OF WAR ---- */
A.add({id:'tug',name:'TUG OF WAR',cat:'VERSUS',vs:1,how:'TAP LEFT/RIGHT FAST. PULL THE FLAG OVER YOUR LINE.',make(){
 const g={over:null,score:0};let pos=0,last=['',''],t=-90;
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){if(A.cpu&&i===1){pos+=(.28+.32*A.ai)*(Math.random()<.9?1:0);continue;}const h=A.hit(i);for(const n of['l','r'])if(h[n]&&last[i]!==n){last[i]=n;pos+=i?1.6:-1.6;}}pos*=.995;if(Math.abs(pos)>=60){g.over=A.win(pos<0?0:1);S('win');}};
 g.draw=()=>{A.cls('#2a5db0');R(0,180,W,60,'#1e8a45');R(100,120,2,70,K.c);R(218,120,2,70,K.p);R(158,100,4,90,K.w);const fx=160+pos;L(30+pos,150,290+pos,150,'#8a5c33',3);R(fx-2,130,4,40,K.k);R(fx+2,132,14,10,K.y);
  [0,1].forEach(i=>{const x=(i?250:70)+pos,d=i?-1:1,lean=Math.sin(t*.3)*3;R(x-6,150-24,12,18,i?K.p:K.c);R(x-4,150-32,8,8,'#ffd9a8');R(x+d*6-2,150-20,d*12+lean,3,'#ffd9a8');R(x-6,150-6,4,10,K.w);R(x+2,150-6,4,10,K.w);});
  T(t<0?'READY...':'PULL!',160,40,K.y,3,'c');A.hud2('','');};
 return g;}});

/* ---- LASER PAINT ---- */
A.add({id:'paint',name:'LASER PAINT',cat:'VERSUS',vs:1,how:'MOVE TO PAINT TILES. A FIRES A LASER THAT PAINTS A LINE. MOST TILES IN 45 SEC.',make(){
 const g={over:null,score:0},GW=20,GH=13,CS=14,OX=20,OY=26;let gr=new Uint8Array(GW*GH),p=[{x:2,y:6,fx:1,fy:0,cd:0},{x:17,y:6,fx:-1,fy:0,cd:0}],time=2700,t=0,lasers=[];
 g.update=()=>{time--;t++;if(A.cpu){const q=p[1];let best=null,bs=-1;for(const v of[[1,0,'r'],[-1,0,'l'],[0,1,'d'],[0,-1,'u']]){let n=0,x=q.x,y=q.y;for(let k=0;k<6;k++){x+=v[0];y+=v[1];if(x<0||y<0||x>=GW||y>=GH)break;if(gr[y*GW+x]!==2)n++;}n+=rnd(A.ai<.6?4:1);if(n>bs){bs=n;best=v;}}A.bot({[best[2]]:t%2===0,a:bs>3&&Math.random()<.08*A.ai});}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i);if(q.cd>0)q.cd--;if(t%(i&&A.cpu?7-2*A.ai:5)===0){const dx=ax(k),dy=dx?0:ay(k);if(dx||dy){q.fx=dx;q.fy=dy;const nx=q.x+dx,ny=q.y+dy;if(nx>=0&&ny>=0&&nx<GW&&ny<GH&&!p.some((o,j)=>j!==i&&o.x===nx&&o.y===ny)){q.x=nx;q.y=ny;}}}gr[q.y*GW+q.x]=i+1;
   if(A.hit(i).a&&q.cd===0){q.cd=60;let x=q.x,y=q.y;const cells=[];for(let n=0;n<8;n++){x+=q.fx;y+=q.fy;if(x<0||y<0||x>=GW||y>=GH)break;gr[y*GW+x]=i+1;cells.push([x,y]);}lasers.push({c:cells,t:10,i});S('shoot');}}
  lasers.forEach(l=>l.t--);lasers=lasers.filter(l=>l.t>0);if(time<=0){let a=0,b=0;for(const v of gr){if(v===1)a++;if(v===2)b++;}g.over=a===b?'DRAW!':A.win(a>b?0:1);}};
 g.draw=()=>{A.cls();let a=0,b=0;for(let i=0;i<GW*GH;i++){const v=gr[i];if(v===1)a++;if(v===2)b++;R(OX+(i%GW)*CS,OY+((i/GW)|0)*CS,CS-1,CS-1,v===1?'#178a7d':v===2?'#a0205a':'#1a1440');}
  lasers.forEach(l=>l.c.forEach(c=>R(OX+c[0]*CS+4,OY+c[1]*CS+4,CS-9,CS-9,K.w)));p.forEach((q,i)=>{const X=OX+q.x*CS,Y=OY+q.y*CS;R(X+2,Y+2,CS-5,CS-5,i?K.p:K.c);R(X+6+q.fx*4,Y+6+q.fy*4,3,3,K.w);});
  A.hud2(a,b);T(Math.ceil(time/60),160,4,K.w,2,'c');};
 return g;}});

/* ---- ARENA BLAST ---- */
A.add({id:'arena',name:'ARENA BLAST',cat:'VERSUS',vs:1,how:'MOVE. A FIRES WHERE YOU FACE. 5 HITS WINS.',make(){
 const g={over:null,score:0},PIL=[[80,70],[240,70],[80,170],[240,170],[160,120]];let p,sh=[],sc=[0,0],wait=30;
 const blk=(x,y)=>x<12||x>W-12||y<28||y>H-12||PIL.some(c=>Math.hypot(c[0]-x,c[1]-y)<14);
 const reset=()=>{p=[{x:40,y:120,fx:1,fy:0,cd:0},{x:280,y:120,fx:-1,fy:0,cd:0}];sh=[];wait=30;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=p[1],o=p[0],dx=o.x-q.x,dy=o.y-q.y,al=Math.abs(dx)<8,alY=Math.abs(dy)<8;const rowBlk=PIL.some(c=>Math.abs(c.y-o.y)<16&&(c.x-q.x)*(c.x-o.x)<0),colBlk=PIL.some(c=>Math.abs(c.x-o.x)<16&&(c.y-q.y)*(c.y-o.y)<0);
   const near=sh.find(s=>s.o===0&&Math.hypot(s.x-q.x,s.y-q.y)<90&&(Math.abs(s.vx)>1?Math.abs(s.y-q.y)<14&&(s.x-q.x)*s.vx<0:Math.abs(s.x-q.x)<14&&(s.y-q.y)*s.vy<0));let o2={};
   if(near&&A.ai>.55){o2[Math.abs(near.vx)>Math.abs(near.vy)?(q.y<120?'d':'u'):(q.x<160?'r':'l')]=1;}
   else if((alY&&!rowBlk)||(al&&!colBlk)){o2={l:alY&&dx<0,r:alY&&dx>0,u:al&&dy<0,d:al&&dy>0,a:q.cd===0&&Math.random()<.15+.25*A.ai};}
   else{let mx=0,my=0;if(!rowBlk&&!alY)my=dy<0?-1:1;else if(!colBlk&&!al)mx=dx<0?-1:1;else{const lane=q.y<120?40:200;if(Math.abs(q.y-lane)>6)my=lane<q.y?-1:1;else mx=dx<0?-1:1;}
    if(mx&&blk(q.x+mx*22,q.y)){my=q.y<120?-1:1;mx=0;}else if(my&&blk(q.x,q.y+my*22)){mx=q.x<160?-1:1;my=0;}o2={l:mx<0,r:mx>0,u:my<0,d:my>0};if(Math.random()<.15-.12*A.ai)o2={[['l','r','u','d'][ri(4)]]:1};}A.bot(o2);}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),sp=i&&A.cpu?1.2+1.2*A.ai:2.4,dx=ax(k),dy=ay(k);if(dx||dy){q.fx=dx;q.fy=dy;if(!blk(q.x+dx*sp,q.y))q.x+=dx*sp;if(!blk(q.x,q.y+dy*sp))q.y+=dy*sp;}if(q.cd>0)q.cd--;
   if(A.hit(i).a&&q.cd===0){q.cd=25;const m=Math.hypot(q.fx,q.fy)||1;sh.push({x:q.x+q.fx/m*10,y:q.y+q.fy/m*10,vx:q.fx/m*5,vy:q.fy/m*5,o:i});S('shoot');}}
  for(const s of sh){s.x+=s.vx;s.y+=s.vy;if(blk(s.x,s.y))s.dead=1;const o=p[1-s.o];if(Math.hypot(s.x-o.x,s.y-o.y)<8){s.dead=1;sc[s.o]++;S('boom');if(sc[s.o]>=5){g.over=A.win(s.o);return;}reset();return;}}sh=sh.filter(s=>!s.dead);};
 g.draw=()=>{A.cls('#2a2d3e');R(0,0,W,24,K.bg);for(let x=12;x<W-12;x+=24)for(let y=28;y<H-12;y+=24)R(x,y,23,23,(x/24+y/24)%2<1?'#333649':'#2e3144');PIL.forEach(c=>{C(c[0],c[1],12,'#6a65a0');C(c[0],c[1],8,'#8d86b8');});
  p.forEach((q,i)=>{C(q.x,q.y,8,i?K.p:K.c);const m=Math.hypot(q.fx,q.fy)||1;L(q.x,q.y,q.x+q.fx/m*12,q.y+q.fy/m*12,K.w,3);});sh.forEach(s=>C(s.x,s.y,3,s.o?K.p:K.c));A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- CHECKERS ---- */
A.add({id:'checkers',name:'CHECKERS',cat:'BOARD',vs:1,how:'PICK A PIECE, PICK A SQUARE. JUMPS CAPTURE. KINGS GO BACK.',make(){
 const g={over:null,score:0};let b=Array(64).fill(0),p=0,c={x:0,y:5},sel=-1,think=0;for(let i=0;i<64;i++){const x=i%8,y=(i/8)|0;if((x+y)%2){if(y<3)b[i]=2;if(y>4)b[i]=1;}}
 const own=(v,pl)=>v&&((v===1||v===3)?pl===0:pl===1);
 const moves=(bd,pl)=>{const out=[],caps=[];for(let i=0;i<64;i++){const v=bd[i];if(!own(v,pl))continue;const x=i%8,y=(i/8)|0,dirs=v>2?[[1,1],[-1,1],[1,-1],[-1,-1]]:pl===0?[[1,-1],[-1,-1]]:[[1,1],[-1,1]];
   for(const d of dirs){const nx=x+d[0],ny=y+d[1];if(nx<0||ny<0||nx>7||ny>7)continue;const t=ny*8+nx;if(!bd[t])out.push([i,t,-1]);else if(!own(bd[t],pl)){const jx=nx+d[0],jy=ny+d[1];if(jx>=0&&jy>=0&&jx<8&&jy<8&&!bd[jy*8+jx])caps.push([i,jy*8+jx,t]);}}}return caps.length?caps:out;};
 const apply=(bd,m)=>{let v=bd[m[0]];bd[m[0]]=0;if(m[2]>=0)bd[m[2]]=0;const y=(m[1]/8)|0;if(v===1&&y===0)v=3;if(v===2&&y===7)v=4;bd[m[1]]=v;};
 const ev=bd=>{let s=0;for(const v of bd)s+=v===2?1:v===4?2:v===1?-1:v===3?-2:0;return s;};
 const mm=(bd,pl,dp)=>{const ms=moves(bd,pl);if(!ms.length)return pl===1?-99:99;if(dp===0)return ev(bd);let best=pl===1?-1e9:1e9;for(const m of ms){const nb=bd.slice();apply(nb,m);const v=mm(nb,1-pl,dp-1);best=pl===1?Math.max(best,v):Math.min(best,v);}return best;};
 const play=m=>{apply(b,m);S('hit');p=1-p;sel=-1;think=0;if(!moves(b,p).length){g.over=A.win(1-p);}};
 g.update=()=>{if(A.cpu&&p===1){if(++think>35){const ms=moves(b,1);let best=-1e9,mv=ms[0];for(const m of ms){const nb=b.slice();apply(nb,m);const v=mm(nb,0,[0,1,3][A.lvl])+rnd(A.lvl?.3:3);if(v>best){best=v;mv=m;}}play(mv);}return;}
  const h=A.hit(human(p));mvCur(h,c,8,8);if(h.a){const i=c.y*8+c.x,ms=moves(b,p);if(sel>=0){const m=ms.find(m=>m[0]===sel&&m[1]===i);if(m)play(m);else if(own(b[i],p))sel=i;else S('lose');}else if(ms.some(m=>m[0]===i)){sel=i;S('blip');}else S('lose');}};
 g.draw=()=>{A.cls();const ms=moves(b,p);for(let i=0;i<64;i++){const x=76+(i%8)*21,y=36+((i/8)|0)*21,dk=(i%8+((i/8)|0))%2;R(x,y,21,21,dk?'#5b3a1e':'#e8c77a');if(sel>=0&&ms.some(m=>m[0]===sel&&m[1]===i))R(x+8,y+8,5,5,K.y);const v=b[i];if(v){C(x+10.5,y+10.5,8,v%2?K.c:K.p);if(v>2)C(x+10.5,y+10.5,3,K.y);}}
  if(!(A.cpu&&p===1))A.box(76+c.x*21,36+c.y*21,21,21,sel===c.y*8+c.x?K.g:K.y);if(sel>=0)A.box(77+(sel%8)*21,37+((sel/8)|0)*21,19,19,K.g);A.hud2('','');T(A.nm(p)+' TO MOVE',160,6,p?K.p:K.c,2,'c');};
 return g;}});

/* ---- NIM STICKS ---- */
A.add({id:'nim',name:'NIM STICKS',cat:'BOARD',vs:1,how:'PICK A ROW, TAKE 1+ STICKS. TAKE THE LAST STICK TO WIN.',make(){
 const g={over:null,score:0};let rows=[1,3,5,7],p=0,row=0,take=1,think=0;
 const play=(r,n)=>{rows[r]-=n;S('hit');if(rows.every(v=>!v)){g.over=A.win(p);return;}p=1-p;row=rows.findIndex(v=>v);take=1;think=0;};
 g.update=()=>{if(A.cpu&&p===1){if(++think>40){let x=rows.reduce((a,v)=>a^v,0),mv=null;if(x&&Math.random()<[.4,.8,1][A.lvl])for(let r=0;r<4;r++){const t=rows[r]^x;if(t<rows[r]){mv=[r,rows[r]-t];break;}}if(!mv){const rs=rows.map((v,i)=>i).filter(i=>rows[i]);const r=rs[ri(rs.length)];mv=[r,1+ri(rows[r])];}play(mv[0],mv[1]);}return;}
  const h=A.hit(human(p));if(h.u||h.d){do{row=(row+(h.u?3:1))%4;}while(!rows[row]);take=1;S('blip');}if(h.l)take=Math.max(1,take-1);if(h.r)take=Math.min(rows[row],take+1);if(h.a)play(row,take);};
 g.draw=()=>{A.cls();rows.forEach((n,r)=>{const y=50+r*40;for(let i=0;i<n;i++){const x=160-(n-1)*12+i*24,hi=r===row&&i>=n-take&&!(A.cpu&&p===1);R(x-3,y,6,30,hi?K.y:'#c4915a');R(x-3,y,6,4,hi?K.w:K.r);}if(r===row&&!(A.cpu&&p===1))T('>',60,y+10,K.y,2);});
  A.hud2('','');T(A.nm(p)+(A.cpu&&p===1?' THINKS':' TAKES '+take),160,6,p?K.p:K.c,2,'c');T('UP/DOWN ROW  LEFT/RIGHT AMOUNT  A TAKE',160,222,K.gr,1,'c');};
 return g;}});

/* ---- DOTS AND BOXES ---- */
A.add({id:'dots',name:'DOTS AND BOXES',cat:'BOARD',vs:1,how:'PICK AN EDGE, PRESS A. CLOSE A BOX TO SCORE AND GO AGAIN.',make(){
 const g={over:null,score:0},N=5;let hE=[],vE=[],box=[],p=0,c={x:0,y:0,v:0},sc=[0,0],think=0;for(let i=0;i<N*(N-1);i++){hE.push(0);vE.push(0);}for(let i=0;i<(N-1)*(N-1);i++)box.push(0);
 const sides=(bx,by)=>hE[by*(N-1)+bx]+hE[(by+1)*(N-1)+bx]+vE[by*N+bx]+vE[by*N+bx+1];
 const place=(v,i)=>{(v?vE:hE)[i]=1;let got=0;for(let by=0;by<N-1;by++)for(let bx=0;bx<N-1;bx++)if(!box[by*(N-1)+bx]&&sides(bx,by)===4){box[by*(N-1)+bx]=p+1;sc[p]++;got++;}S(got?'score':'blip');if(box.every(v=>v)){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);return;}if(!got)p=1-p;think=0;};
 const gain=(v,i)=>{(v?vE:hE)[i]=1;let g_=0,bad=0;for(let by=0;by<N-1;by++)for(let bx=0;bx<N-1;bx++){const s=sides(bx,by);if(!box[by*(N-1)+bx]){if(s===4)g_++;if(s===3)bad++;}}(v?vE:hE)[i]=0;return[g_,bad];};
 g.update=()=>{if(A.cpu&&p===1){if(++think>35){let best=-1e9,mv=null;for(let v=0;v<2;v++)for(let i=0;i<N*(N-1);i++){if((v?vE:hE)[i])continue;const[g_,bad]=gain(v,i);let s=g_*10-(A.lvl?bad*5:0)+rnd(A.lvl===2?.5:3);if(s>best){best=s;mv=[v,i];}}place(mv[0],mv[1]);}return;}
  const h=A.hit(human(p));if(h.b){c.v^=1;}if(h.l)c.x=(c.x+(c.v?N:N-1)-1)%(c.v?N:N-1);if(h.r)c.x=(c.x+1)%(c.v?N:N-1);if(h.u)c.y=(c.y+(c.v?N-1:N)-1)%(c.v?N-1:N);if(h.d)c.y=(c.y+1)%(c.v?N-1:N);if(h.a){const i=c.v?c.y*N+c.x:c.y*(N-1)+c.x;if(!(c.v?vE:hE)[i])place(c.v,i);else S('lose');}};
 g.draw=()=>{A.cls();const S_=36,OX=88,OY=48;box.forEach((v,i)=>{if(v)R(OX+(i%(N-1))*S_+4,OY+((i/(N-1))|0)*S_+4,S_-8,S_-8,v===1?'#178a7d':'#a0205a');});
  hE.forEach((v,i)=>{if(v)R(OX+(i%(N-1))*S_,OY+((i/(N-1))|0)*S_-1,S_,3,K.w);});vE.forEach((v,i)=>{if(v)R(OX+(i%N)*S_-1,OY+((i/N)|0)*S_,3,S_,K.w);});
  for(let i=0;i<N*N;i++)C(OX+(i%N)*S_,OY+((i/N)|0)*S_,3,K.y);if(!(A.cpu&&p===1)){if(c.v)R(OX+c.x*S_-2,OY+c.y*S_,5,S_,K.g);else R(OX+c.x*S_,OY+c.y*S_-2,S_,5,K.g);}
  A.hud2(sc[0],sc[1]);T(A.nm(p)+' TO MOVE',160,6,p?K.p:K.c,2,'c');T('B FLIPS EDGE DIRECTION',160,222,K.gr,1,'c');};
 return g;}});

/* ---- MANCALA ---- */
A.add({id:'mancala',name:'MANCALA',cat:'BOARD',vs:1,how:'PICK A PIT, A SOWS COUNTER-CLOCKWISE. MOST IN YOUR STORE WINS.',make(){
 const g={over:null,score:0};let b=Array(14).fill(4),p=0,cur=0,think=0;b[6]=b[13]=0;
 const move=(bd,pl,pit)=>{let i=pl?7+pit:pit,n=bd[i];bd[i]=0;while(n>0){i=(i+1)%14;if(i===(pl?6:13))continue;bd[i]++;n--;}const own=pl?i>=7&&i<13:i<6;if(own&&bd[i]===1&&bd[12-i]>0){bd[pl?13:6]+=bd[12-i]+1;bd[i]=0;bd[12-i]=0;}return i===(pl?13:6);};
 const finish=()=>{for(let i=0;i<6;i++){b[6]+=b[i];b[i]=0;b[13]+=b[i+7];b[i+7]=0;}g.over=b[6]===b[13]?'DRAW!':A.win(b[6]>b[13]?0:1);};
 const play=pit=>{const again=move(b,p,pit);S('hit');if(b.slice(0,6).every(v=>!v)||b.slice(7,13).every(v=>!v)){finish();return;}if(!again)p=1-p;think=0;cur=0;};
 g.update=()=>{if(A.cpu&&p===1){if(++think>40){let best=-1e9,mv=0;for(let i=0;i<6;i++){if(!b[7+i])continue;const nb=b.slice(),again=move(nb,1,i);let s=(nb[13]-b[13])*2+(again?4:0)+rnd(A.lvl===0?6:A.lvl===1?1.5:.2);if(A.lvl===2){let worst=0;for(let j=0;j<6;j++)if(nb[j]){const n2=nb.slice();move(n2,0,j);worst=Math.max(worst,n2[6]-nb[6]);}s-=worst*.7;}if(s>best){best=s;mv=i;}}play(mv);}return;}
  const h=A.hit(human(p));if(h.l)cur=(cur+5)%6;if(h.r)cur=(cur+1)%6;if(h.a){if(b[p?7+cur:cur])play(cur);else S('lose');}};
 g.draw=()=>{A.cls('#5b3a1e');R(20,60,280,120,'#8a5c33');const pit=(x,y,n,hi)=>{C(x,y,15,hi?K.y:'#3a2a18');for(let i=0;i<Math.min(n,12);i++)C(x-8+(i%4)*5.3,y-6+((i/4)|0)*6,2,i%2?K.c:K.p);T(n,x,y+18,K.w,1,'c');};
  for(let i=0;i<6;i++){pit(75+i*34,145,b[i],p===0&&cur===i&&!(A.cpu&&p===1));pit(75+(5-i)*34,95,b[7+i],p===1&&cur===i&&!(A.cpu&&p===1));}R(280-8,80,16,80,'#3a2a18');R(28,80,16,80,'#3a2a18');T(b[6],288,116,K.c,2,'c');T(b[13],36,116,K.p,2,'c');
  A.hud2('','');T(A.nm(p)+' TO SOW',160,6,p?K.p:K.c,2,'c');T('P1 BOTTOM ROW, STORE RIGHT   P2 TOP ROW, STORE LEFT',160,222,K.gr,1,'c');};
 return g;}});

/* ---- GOMOKU ---- */
A.add({id:'gomoku',name:'GOMOKU',cat:'BOARD',vs:1,how:'PLACE STONES. FIVE IN A ROW WINS.',make(){
 const g={over:null,score:0},N=11;let b=Array(N*N).fill(0),p=0,c={x:5,y:5},think=0,winL=null;
 const line=(bd,i,v)=>{const x=i%N,y=(i/N)|0;for(const d of[[1,0],[0,1],[1,1],[1,-1]]){const cells=[i];for(const s of[1,-1]){let nx=x+d[0]*s,ny=y+d[1]*s;while(nx>=0&&ny>=0&&nx<N&&ny<N&&bd[ny*N+nx]===v){cells.push(ny*N+nx);nx+=d[0]*s;ny+=d[1]*s;}}if(cells.length>=5)return cells;}return null;};
 const score=(bd,i,v)=>{let s=0;const x=i%N,y=(i/N)|0;for(const d of[[1,0],[0,1],[1,1],[1,-1]]){let n=1,open=0;for(const sg of[1,-1]){let nx=x+d[0]*sg,ny=y+d[1]*sg;while(nx>=0&&ny>=0&&nx<N&&ny<N&&bd[ny*N+nx]===v){n++;nx+=d[0]*sg;ny+=d[1]*sg;}if(nx>=0&&ny>=0&&nx<N&&ny<N&&!bd[ny*N+nx])open++;}s+=n>=5?1e6:n===4?(open===2?1e4:open?1e3:0):n===3?(open===2?500:open?50:0):n===2?open*8:1;}return s;};
 const play=i=>{b[i]=p+1;S('hit');const w=line(b,i,p+1);if(w){winL=w;g.over=A.win(p);}else if(b.every(v=>v))g.over='DRAW!';else p=1-p;think=0;};
 g.update=()=>{if(A.cpu&&p===1){if(++think>30){let best=-1,mv=60;for(let i=0;i<N*N;i++){if(b[i])continue;const s=score(b,i,2)+score(b,i,1)*(A.lvl?.9:.3)+rnd(A.lvl===2?2:A.lvl===1?30:200);if(s>best){best=s;mv=i;}}play(mv);}return;}
  const h=A.hit(human(p));mvCur(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(!b[i])play(i);else S('lose');}};
 g.draw=()=>{A.cls();R(60,22,200,200,'#d9a55b');for(let i=0;i<N;i++){L(70+i*18,32,70+i*18,32+180,'#5b3a1e');L(70,32+i*18,70+180,32+i*18,'#5b3a1e');}b.forEach((v,i)=>{if(v)C(70+(i%N)*18,32+((i/N)|0)*18,7,v===1?K.c:K.p);});if(winL)winL.forEach(i=>A.ring(70+(i%N)*18,32+((i/N)|0)*18,8,A.t%20<10?K.w:K.y));
  if(!g.over&&!(A.cpu&&p===1))A.box(70+c.x*18-9,32+c.y*18-9,18,18,K.y);A.hud2('','');T(A.nm(p)+' TO MOVE',160,6,p?K.p:K.c,2,'c');};
 return g;}});
})();
