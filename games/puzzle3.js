(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};

A.add({id:'sudoku6',name:'SUDOKU 6',cat:'PUZZLE',how:'FILL 1-6: NO REPEATS IN ROWS, COLUMNS OR 2X3 BOXES. A CYCLES A NUMBER.',make(){
 const g={over:null,score:0};let sol,giv,b,c={x:0,y:0},t=0,lvl=0;
 const gen=()=>{lvl++;const base=[[1,2,3,4,5,6],[4,5,6,1,2,3],[2,3,1,5,6,4],[5,6,4,2,3,1],[3,1,2,6,4,5],[6,4,5,3,1,2]];const m=shuf([1,2,3,4,5,6]);const bands=shuf([0,1,2]),rows=[];bands.forEach(bd=>shuf([0,1]).forEach(r=>rows.push(bd*2+r)));const cols=[];shuf([0,1]).forEach(st=>shuf([0,1,2]).forEach(cc=>cols.push(st*3+cc)));
  sol=rows.map(r=>cols.map(cc=>m[base[r][cc]-1]));giv=sol.map(r=>r.map(()=>Math.random()<.52-lvl*.03));b=sol.map((r,y)=>r.map((v,x)=>giv[y][x]?v:0));t=0;};gen();
 const ok=()=>b.every((r,y)=>r.every((v,x)=>v===sol[y][x]));
 g.update=()=>{t++;const h=A.hit(0);mvCur(h,c,6,6);if((h.a||h.b)&&!giv[c.y][c.x]){b[c.y][c.x]=(b[c.y][c.x]+(h.b?6:1))%7;if(ok()){g.score+=Math.max(50,400-(t/60|0)*2);S('win');A.confetti();if(lvl>=5)g.over='ALL SOLVED! WIN';else gen();}}};
 g.draw=()=>{A.cls('#fff3d6');const CS=30,OX=70,OY=30;for(let y=0;y<6;y++)for(let x=0;x<6;x++){const v=b[y][x];let bad=false;if(v)for(let k=0;k<6;k++){if(k!==x&&b[y][k]===v)bad=true;if(k!==y&&b[k][x]===v)bad=true;}R(OX+x*CS,OY+y*CS,CS-1,CS-1,giv[y][x]?'#e8dcc0':'#ffffff');if(v)T(v,OX+x*CS+15,OY+y*CS+10,giv[y][x]?K.k:bad?K.r:'#2b3bd6',2,'c');}
  for(let i=0;i<=6;i++){R(OX+i*CS-(i%3===0?1:0),OY,i%3===0?2:1,6*CS,'#333');R(OX,OY+i*CS-(i%2===0?1:0),6*CS,i%2===0?2:1,'#333');}A.box(OX+c.x*CS-1,OY+c.y*CS-1,CS+1,CS+1,K.p);T('PUZZLE '+lvl+'/5',6,6,K.k,2);T('SCORE '+g.score,W-6,6,K.k,1,'r');};
 return g;}});

A.add({id:'watersort',name:'WATER SORT',cat:'PUZZLE',low:1,how:'A PICKS A TUBE, A AGAIN POURS. ONE COLOUR PER TUBE.',make(){
 const g={over:null,score:0},CO=[K.r,K.y,K.c,K.p,K.g,K.o];let tubes,sel=-1,c=0,lvl=0;
 const gen=()=>{lvl++;const n=Math.min(6,3+lvl);let w=[];for(let i=0;i<n;i++)for(let k=0;k<4;k++)w.push(i);shuf(w);tubes=[];for(let i=0;i<n;i++)tubes.push(w.slice(i*4,i*4+4));tubes.push([],[]);sel=-1;c=0;};gen();
 const solved=()=>tubes.every(t=>t.length===0||(t.length===4&&t.every(v=>v===t[0])));
 g.update=()=>{const h=A.hit(0);if(h.l)c=(c+tubes.length-1)%tubes.length;if(h.r)c=(c+1)%tubes.length;if(h.l||h.r)S('blip');if(h.a){if(sel<0){if(tubes[c].length){sel=c;S('blip');}}else{if(c!==sel){const a=tubes[sel],b=tubes[c],top=a[a.length-1];let moved=0;while(a.length&&a[a.length-1]===top&&b.length<4&&(!b.length||b[b.length-1]===top)){b.push(a.pop());moved++;}if(moved){g.score++;S('coin');if(solved()){S('win');A.confetti();if(lvl>=4)g.over='SORTED IN '+g.score+' POURS! WIN';else gen();}}else S('lose');}sel=-1;}}};
 g.draw=()=>{A.cls('#1a1238');const n=tubes.length,sp=Math.min(44,280/n);tubes.forEach((t,i)=>{const x=160-n*sp/2+i*sp+sp/2,y=sel===i?60:80;R(x-12,y,24,100,'rgba(255,255,255,.12)');A.box(x-12,y,24,100,i===c?K.y:'#8d86b8');t.forEach((v,k)=>R(x-10,y+76-k*24,20,22,CO[v]));});T('LEVEL '+lvl+'/4',6,6,K.w,2);T('POURS '+g.score,W-6,6,K.y,2,'r');};
 return g;}});

A.add({id:'iceslide',name:'ICE SLIDE',cat:'PUZZLE',low:1,how:'ARROWS SLIDE UNTIL YOU HIT A ROCK. REACH THE FLAG.',make(){
 const g={over:null,score:0},N=10;let m,p,goal,lvl=0,anim=null;
 const solve=()=>{const seen=new Set([p.x+','+p.y]),q=[[p.x,p.y,0]];while(q.length){const[x,y,d]=q.shift();if(x===goal.x&&y===goal.y)return d;for(const v of[[1,0],[-1,0],[0,1],[0,-1]]){let nx=x,ny=y;while(nx+v[0]>=0&&ny+v[1]>=0&&nx+v[0]<N&&ny+v[1]<N&&!m[ny+v[1]][nx+v[0]]){nx+=v[0];ny+=v[1];if(nx===goal.x&&ny===goal.y)break;}const k=nx+','+ny;if(!seen.has(k)){seen.add(k);q.push([nx,ny,d+1]);}}}return -1;};
 const gen=()=>{lvl++;for(let tr=0;tr<200;tr++){m=[];for(let y=0;y<N;y++){m.push([]);for(let x=0;x<N;x++)m[y].push(Math.random()<.16?1:0);}p={x:ri(N),y:ri(N)};goal={x:ri(N),y:ri(N)};m[p.y][p.x]=0;m[goal.y][goal.x]=0;const d=solve();if(d>=3+Math.min(4,lvl))return;}};gen();
 g.update=()=>{if(anim){p.x+=anim[0];p.y+=anim[1];const nx=p.x+anim[0],ny=p.y+anim[1];if((p.x===goal.x&&p.y===goal.y)||nx<0||ny<0||nx>=N||ny>=N||m[ny][nx]){anim=null;if(p.x===goal.x&&p.y===goal.y){S('win');A.burst(40+p.x*24+12,20+p.y*21+10,K.y,16);if(lvl>=6)g.over='ALL FLAGS IN '+g.score+' MOVES! WIN';else gen();}}return;}
  const h=A.hit(0),v=h.l?[-1,0]:h.r?[1,0]:h.u?[0,-1]:h.d?[0,1]:null;if(v){const nx=p.x+v[0],ny=p.y+v[1];if(nx>=0&&ny>=0&&nx<N&&ny<N&&!m[ny][nx]){anim=v;g.score++;S('blip');}}};
 g.draw=()=>{A.cls('#9fd8ff');for(let y=0;y<N;y++)for(let x=0;x<N;x++){const X=40+x*24,Y=20+y*21;R(X,Y,23,20,(x+y)%2?'#dff4ff':'#cfeaff');if(m[y][x]){C(X+12,Y+11,10,'#6a6a78');}}R(40+goal.x*24+10,20+goal.y*21+2,2,16,K.k);R(40+goal.x*24+12,20+goal.y*21+2,8,6,K.r);C(40+p.x*24+12,20+p.y*21+10,7,K.b);T('LEVEL '+lvl+'/6',6,6,K.k,1);T('MOVES '+g.score,W-6,6,K.k,1,'r');};
 return g;}});

A.add({id:'sumten',name:'SUM TEN',cat:'PUZZLE',how:'A SELECTS A NUMBER, A ON A NEIGHBOUR. PAIRS THAT MAKE 10 CLEAR. 90 SEC.',make(){
 const g={over:null,score:0},N=7;let b=[],c={x:3,y:3},sel=null,time=5400;const nv=()=>1+ri(9);for(let i=0;i<N*N;i++)b.push(nv());
 g.update=()=>{time--;if(time<=0){g.over='TIME UP';return;}const h=A.hit(0);mvCur(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(sel===null){sel=i;S('blip');}else{const sx=sel%N,sy=(sel/N)|0,adj=Math.abs(sx-c.x)+Math.abs(sy-c.y)===1;if(adj&&b[sel]+b[i]===10){g.score+=10;S('coin');A.burst(80+c.x*24,50+c.y*24,K.y,10);b[sel]=nv();b[i]=nv();}else if(i!==sel)S('lose');sel=null;}}};
 g.draw=()=>{A.cls('#1a1238');for(let i=0;i<N*N;i++){const x=68+(i%N)*26,y=36+((i/N)|0)*26;R(x,y,24,24,i===sel?K.y:'#2b2257');T(b[i],x+12,y+8,i===sel?K.k:[K.w,K.c,K.p,K.g,K.o,K.y,K.b,K.r,K.w][b[i]-1],2,'c');}A.box(68+c.x*26-1,36+c.y*26-1,26,26,K.c);T('SCORE '+g.score,6,6,K.y,2);T(Math.ceil(time/60),W-6,6,K.w,2,'r');};
 return g;}});

A.add({id:'tilepairs',name:'TILE PAIRS',cat:'PUZZLE',how:'MATCH TWO FREE TILES (NOTHING ON TOP, A SIDE OPEN). CLEAR THE STACK.',make(){
 const g={over:null,score:0},SYM=['@','#','$','%','&','*','+','?','!','='],CO=[K.r,K.b,K.g,K.p,K.o,K.c,K.y,'#b070ff',K.r,K.b];let tiles=[],c=0,sel=null;
 const pos=[];for(let y=0;y<4;y++)for(let x=0;x<8;x++)pos.push({x,y,z:0});for(let y=1;y<3;y++)for(let x=2;x<6;x++)pos.push({x,y,z:1});pos.push({x:3.5,y:1.5,z:2},{x:3.5,y:1.5,z:3});
 const ids=[];for(let i=0;i<pos.length/2;i++){ids.push(i%10,i%10);}shuf(ids);tiles=pos.map((p,i)=>({...p,s:ids[i],gone:false}));
 const free=t=>!t.gone&&!tiles.some(o=>!o.gone&&o.z>t.z&&Math.abs(o.x-t.x)<1&&Math.abs(o.y-t.y)<1)&&(!tiles.some(o=>!o.gone&&o.z===t.z&&o.y===t.y&&o.x===t.x-1)||!tiles.some(o=>!o.gone&&o.z===t.z&&o.y===t.y&&o.x===t.x+1));
 g.update=()=>{const live=tiles.map((t,i)=>i).filter(i=>free(tiles[i]));if(!live.includes(c))c=live[0]??0;const h=A.hit(0);if(h.l||h.r||h.u||h.d){const cur=tiles[c];const dir=h.l?[-1,0]:h.r?[1,0]:h.u?[0,-1]:[0,1];let best=null,bd=1e9;for(const i of live){if(i===c)continue;const t=tiles[i],dx=t.x-cur.x,dy=t.y-cur.y;if(dx*dir[0]+dy*dir[1]<=0)continue;const d=Math.abs(dx)+Math.abs(dy)+Math.abs(dx*dir[1]+dy*dir[0])*2;if(d<bd){bd=d;best=i;}}if(best!==null){c=best;S('blip');}}
  if(h.a){if(sel===null){sel=c;S('blip');}else if(sel!==c&&tiles[sel].s===tiles[c].s){tiles[sel].gone=tiles[c].gone=true;g.score+=10;S('coin');sel=null;if(tiles.every(t=>t.gone)){g.over='BOARD CLEAR! WIN';A.confetti();}else if(!(()=>{const f=tiles.filter(free);return f.some((a,i)=>f.some((b,j)=>j>i&&a.s===b.s));})())g.over='NO MOVES LEFT';}else{sel=null;S('lose');}}};
 g.draw=()=>{A.cls('#0f5a2a');tiles.slice().sort((a,b)=>a.z-b.z).forEach(t=>{if(t.gone)return;const i=tiles.indexOf(t),x=40+t.x*30-t.z*3,y=40+t.y*40-t.z*4;R(x+3,y+3,28,38,'rgba(0,0,0,.35)');R(x,y,28,38,free(t)?'#fff3d6':'#cfc4a8');A.box(x,y,28,38,i===sel?K.y:i===c?K.p:'#8a7a5a');T(SYM[t.s],x+14,y+13,CO[t.s],2,'c');});T('SCORE '+g.score,6,6,K.y,2);};
 return g;}});

A.add({id:'parking',name:'PARKING JAM',cat:'PUZZLE',low:1,how:'A PICKS A CAR, ARROWS SLIDE IT. GET THE RED CAR OUT THE RIGHT EXIT.',make(){
 const g={over:null,score:0},N=6,CO=[K.b,K.g,K.y,K.p,K.o,K.c,'#b070ff','#8a5c33'];let cars,sel=0,lvl=0;
 const occ=(cs,ex)=>{const o=new Set();cs.forEach((c,i)=>{if(i===ex)return;for(let k=0;k<c.l;k++)o.add((c.h?c.x+k:c.x)+','+(c.h?c.y:c.y+k));});return o;};
 const can=(cs,i,d)=>{const c=cs[i],o=occ(cs,i);if(c.h){const nx=d>0?c.x+c.l:c.x-1;return nx>=0&&nx<N&&!o.has(nx+','+c.y);}const ny=d>0?c.y+c.l:c.y-1;return ny>=0&&ny<N&&!o.has(c.x+','+ny);};
 const gen=()=>{lvl++;for(let tr=0;tr<300;tr++){const cs=[{x:4,y:2,l:2,h:1}];for(let k=0;k<6+Math.min(5,lvl);k++){const h=Math.random()<.5,l=Math.random()<.7?2:3,x=ri(h?N-l+1:N),y=ri(h?N:N-l+1);if(h&&y===2)continue;const test={x,y,l,h};const o=occ(cs,-1);let bad=false;for(let q=0;q<l;q++)if(o.has((h?x+q:x)+','+(h?y:y+q)))bad=true;if(!bad)cs.push(test);}
   for(let s=0;s<600;s++){const i=ri(cs.length),d=Math.random()<.5?1:-1;if(can(cs,i,d)){if(cs[i].h)cs[i].x+=d;else cs[i].y+=d;}}if(cs[0].x<=1){cars=cs;sel=0;return;}}cars=[{x:0,y:2,l:2,h:1}];sel=0;};gen();
 g.update=()=>{const h=A.hit(0);if(h.a||h.b){sel=(sel+(h.b?cars.length-1:1))%cars.length;S('blip');return;}const c=cars[sel];let d=0;if(c.h){if(h.l)d=-1;if(h.r)d=1;}else{if(h.u)d=-1;if(h.d)d=1;}
  if(d){if(sel===0&&c.x+c.l===N&&d>0){g.score++;S('win');A.confetti();if(lvl>=6)g.over='ALL PARKED OUT IN '+g.score+'! WIN';else gen();return;}if(can(cars,sel,d)){if(c.h)c.x+=d;else c.y+=d;g.score++;S('hit');}else S('lose');}};
 g.draw=()=>{A.cls('#2a2a38');const CS=32,OX=64,OY=24;R(OX-4,OY-4,N*CS+8,N*CS+8,'#555');R(OX,OY,N*CS,N*CS,'#3a3a48');R(OX+N*CS,OY+2*CS+4,8,CS-8,'#3a3a48');for(let i=0;i<N;i++)for(let j=0;j<N;j++)A.box(OX+i*CS,OY+j*CS,CS,CS,'#44445a');
  cars.forEach((c,i)=>{const x=OX+c.x*CS+3,y=OY+c.y*CS+3,w=(c.h?c.l:1)*CS-6,hh=(c.h?1:c.l)*CS-6;R(x,y,w,hh,i===0?K.r:CO[i%CO.length]);R(x+(c.h?w-10:4),y+(c.h?4:hh-10),c.h?6:hh>0?w-8:0,c.h?hh-8:6,'#9fd8ff');if(i===sel)A.box(x-2,y-2,w+4,hh+4,K.w);});T('LEVEL '+lvl+'/6',6,6,K.w,1);T('MOVES '+g.score,W-6,6,K.y,1,'r');T('A/B NEXT CAR',160,230,K.gr,1,'c');};
 return g;}});

A.add({id:'memgrid',name:'MEMORY GRID',cat:'PUZZLE',how:'WATCH THE LIT CELLS, THEN SELECT THEM ALL WITH A.',make(){
 const g={over:null,score:0};let N=3,lit=[],pick=new Set(),ph='show',t=0,c={x:0,y:0},lives=3;const gen=()=>{N=Math.min(6,3+(g.score/3|0));const n=Math.min(N*N-2,3+g.score);lit=shuf([...Array(N*N).keys()]).slice(0,n);pick=new Set();ph='show';t=0;c={x:0,y:0};};gen();
 g.update=()=>{t++;if(ph==='show'){if(t>70+lit.length*8){ph='pick';t=0;}return;}if(ph==='res'){if(t>40)gen();return;}const h=A.hit(0);mvCur(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(pick.has(i))return;if(lit.includes(i)){pick.add(i);S('coin');if(pick.size===lit.length){g.score++;ph='res';t=0;S('win');}}else{lives--;S('lose');ph='res';t=0;if(lives<=0)g.over='MEMORY FULL';}}};
 g.draw=()=>{A.cls('#0d0926');const CS=Math.floor(180/N),OX=160-N*CS/2,OY=128-N*CS/2;for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS,on=(ph==='show'||ph==='res')&&lit.includes(i)||pick.has(i);R(x+2,y+2,CS-4,CS-4,on?K.c:'#2b2257');}if(ph==='pick')A.box(OX+c.x*CS,OY+c.y*CS,CS,CS,K.y);T('ROUND '+(g.score+1),6,6,K.w,2);T('LIVES '+lives,W-6,6,K.r,2,'r');T(ph==='show'?'WATCH':ph==='pick'?'FIND '+(lit.length-pick.size):'',160,222,K.y,2,'c');};
 return g;}});

A.add({id:'balance',name:'BALANCE',cat:'PUZZLE',how:'LEFT/RIGHT PICK A WEIGHT. A DROPS IT. BALANCE THE SCALE. 60 SEC.',make(){
 const g={over:null,score:0};let L_,R_,opts,sel=0,time=3600,tilt=0,fl=0;const gen=()=>{L_=[];for(let i=0;i<2+ri(2);i++)L_.push(1+ri(9));const sum=L_.reduce((a,b)=>a+b);const a=1+ri(Math.min(9,sum-1));R_=[a];const need=sum-a;opts=shuf([need,need+1+ri(3),Math.max(1,need-1-ri(3)),need+4]);sel=0;};gen();
 g.update=()=>{time--;if(fl>0)fl--;if(time<=0){g.over='TIME UP';return;}const h=A.hit(0);if(h.l)sel=(sel+3)%4;if(h.r)sel=(sel+1)%4;if(h.a){const tot=R_[0]+opts[sel],sum=L_.reduce((a,b)=>a+b);if(tot===sum){g.score+=10;S('coin');fl=20;gen();}else{tilt=tot>sum?1:-1;time-=180;S('lose');fl=-20;}}tilt*=.95;};
 g.draw=()=>{A.cls('#1a1238');const a=tilt*.2;R(157,100,6,90,'#8a8aa0');A.poly([[140,190],[180,190],[160,170]],'#8a8aa0',1);A.c.save();A.c.translate(160,100);A.c.rotate(a);R(-110,-3,220,6,'#b8b8c8');A.c.restore();
  const side=(arr,x,y,c)=>{R(x-40,y,80,4,'#b8b8c8');arr.forEach((v,i)=>{R(x-36+i*26,y-22,22,22,c);T(v,x-25+i*26,y-15,K.k,1,'c');});};side(L_,70,100-Math.sin(a)*90,K.c);side(R_.concat(['?']),250,100+Math.sin(a)*90,K.p);
  opts.forEach((v,i)=>{R(70+i*50,205,36,24,i===sel?K.y:'#2b2257');T(v,88+i*50,212,i===sel?K.k:K.w,2,'c');});T('SCORE '+g.score,6,6,K.y,2);T(Math.ceil(time/60),W-6,6,K.w,2,'r');if(fl>0)R(0,0,W,H,'rgba(61,255,139,.1)');};
 return g;}});

A.add({id:'twist',name:'TILE TWIST',cat:'PUZZLE',low:1,how:'A ROTATES A TILE. REBUILD THE PICTURE.',make(){
 const g={over:null,score:0},N=4;let rot=[],c={x:0,y:0},lvl=0,seed;const gen=()=>{lvl++;seed=rnd(100);rot=[];for(let i=0;i<N*N;i++)rot.push(ri(4));if(rot.every(v=>v===0))rot[0]=1;};gen();
 const pic=(x,y)=>{const cx=x-.5,cy=y-.5,d=Math.hypot(cx,cy);const a=Math.atan2(cy,cx)+seed;return d<.18?K.y:d<.3?(Math.sin(a*5)>0?K.p:K.o):d<.42?(y<.5?K.c:K.b):((x*6+y*6|0)%2?'#2b2257':'#3a2a78');};
 g.update=()=>{const h=A.hit(0);mvCur(h,c,N,N);if(h.a){rot[c.y*N+c.x]=(rot[c.y*N+c.x]+1)%4;g.score++;S('hit');if(rot.every(v=>v===0)){S('win');A.confetti();if(lvl>=4)g.over='GALLERY COMPLETE IN '+g.score+'! WIN';else gen();}}};
 g.draw=()=>{A.cls('#0d0926');const CS=46,OX=160-N*CS/2,OY=24,P=8;for(let ty=0;ty<N;ty++)for(let tx=0;tx<N;tx++){const r=rot[ty*N+tx];for(let py=0;py<P;py++)for(let px=0;px<P;px++){let u=px,v=py;for(let k=0;k<r;k++){[u,v]=[v,P-1-u];}const col=pic((tx*P+u+.5)/(N*P),(ty*P+v+.5)/(N*P));R(OX+tx*CS+px*CS/P,OY+ty*CS+py*CS/P,CS/P+.5,CS/P+.5,col);}A.box(OX+tx*CS,OY+ty*CS,CS,CS,'rgba(0,0,0,.4)');}A.box(OX+c.x*CS,OY+c.y*CS,CS,CS,K.w);T('PICTURE '+lvl+'/4',6,6,K.w,1);T('TURNS '+g.score,W-6,6,K.y,1,'r');};
 return g;}});

A.add({id:'merge3',name:'MERGE THREE',cat:'PUZZLE',how:'PLACE THE TILE WITH A. THREE OR MORE TOUCHING THE SAME MERGE UP.',make(){
 const g={over:null,score:0},N=5,CO=['#2b2257',K.g,K.c,K.b,K.p,K.o,K.y,K.r,K.w];let b=Array(N*N).fill(0),c={x:2,y:2},next=1;const nv=()=>Math.random()<.75?1:Math.random()<.8?2:3;next=nv();
 const group=(i,v,seen)=>{if(seen.has(i)||b[i]!==v)return;seen.add(i);const x=i%N,y=(i/N)|0;if(x>0)group(i-1,v,seen);if(x<N-1)group(i+1,v,seen);if(y>0)group(i-N,v,seen);if(y<N-1)group(i+N,v,seen);};
 g.update=()=>{const h=A.hit(0);mvCur(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(b[i]){S('lose');return;}b[i]=next;let merged=true;while(merged){merged=false;const s=new Set();group(i,b[i],s);if(s.size>=3&&b[i]<8){s.forEach(j=>b[j]=0);b[i]++;g.score+=b[i]*b[i]*5;merged=true;S('coin');A.burst(80+c.x*34,40+c.y*34,CO[b[i]],12);}}next=nv();S('blip');if(b.every(v=>v))g.over='BOARD FULL';}};
 g.draw=()=>{A.cls('#1a1238');for(let i=0;i<N*N;i++){const x=70+(i%N)*34,y=26+((i/N)|0)*34;R(x,y,32,32,CO[b[i]]);if(b[i])T(b[i],x+16,y+10,K.k,2,'c');}A.box(70+c.x*34-1,26+c.y*34-1,34,34,K.w);R(258,40,40,40,CO[next]);T(next,278,54,K.k,2,'c');T('NEXT',278,86,K.gr,1,'c');T('SCORE '+g.score,6,6,K.y,2);};
 return g;}});
})();
