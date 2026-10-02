(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const X=new Proxy({},{get:(_,k)=>A.gx[k]}),ax=k=>(k.r?1:0)-(k.l?1:0);
const cur3=(x,y,w,h,col)=>{const p=1+Math.sin(A.t*.15)*.8;X.glow(x+w/2,y+h/2,Math.max(w,h)*.8,col||'#ffcf3f',.15);X.rrs(x-p,y-p,w+2*p,h+2*p,3,col||'#ffcf3f',1.5);};
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};

A.add({id:'sudoku6',name:'SUDOKU 6',cat:'PUZZLE',how:'FILL 1-6: NO REPEATS IN ROWS, COLUMNS OR 2X3 BOXES. A CYCLES A NUMBER.',make(){
 const g={over:null,score:0},fx=X.fx();let sol,giv,b,c={x:0,y:0},CU=c,t=0,lvl=0,pop={};
 const gen=()=>{lvl++;const base=[[1,2,3,4,5,6],[4,5,6,1,2,3],[2,3,1,5,6,4],[5,6,4,2,3,1],[3,1,2,6,4,5],[6,4,5,3,1,2]];const m=shuf([1,2,3,4,5,6]);const bands=shuf([0,1,2]),rows=[];bands.forEach(bd=>shuf([0,1]).forEach(r=>rows.push(bd*2+r)));const cols=[];shuf([0,1]).forEach(st=>shuf([0,1,2]).forEach(cc=>cols.push(st*3+cc)));
  sol=rows.map(r=>cols.map(cc=>m[base[r][cc]-1]));giv=sol.map(r=>r.map(()=>Math.random()<.52-lvl*.03));b=sol.map((r,y)=>r.map((v,x)=>giv[y][x]?v:0));t=0;};gen();
 const ok=()=>b.every((r,y)=>r.every((v,x)=>v===sol[y][x]));
 g.update=()=>{t++;for(const k in pop)if(pop[k]>0)pop[k]--;const h=A.hit(0);mvCur(h,c,6,6);if((h.a||h.b)&&!giv[c.y][c.x]){b[c.y][c.x]=(b[c.y][c.x]+(h.b?6:1))%7;pop[c.y*6+c.x]=6;S('hit');if(ok()){g.score+=Math.max(50,400-(t/60|0)*2);S('win');A.confetti();fx.flash('#ffffff',8);if(lvl>=5)g.over='ALL SOLVED! WIN';else gen();}}};
 g.draw=()=>{const CS=30,OX=70,OY=30,cx=A.c;X.cache('sudoku_bg',()=>{X.vg(0,0,W,H,['#f8f0dc','#e8dcc0']);X.shadow(OX+92,OY+186,96,6,.25);X.rr(OX-4,OY-4,6*CS+8,6*CS+8,4,'#3a3a4a');});
  for(let y=0;y<6;y++)for(let x=0;x<6;x++){const v=b[y][x],gv=giv[y][x];let bad=false;if(v)for(let k=0;k<6;k++){if(k!==x&&b[y][k]===v)bad=true;if(k!==y&&b[k][x]===v)bad=true;}const sameRC=x===CU.x||y===CU.y;cx.fillStyle=gv?'#e8dcc0':sameRC?'#fff8e0':'#ffffff';cx.fillRect(OX+x*CS,OY+y*CS,CS-1,CS-1);if(bad){cx.fillStyle='rgba(255,79,109,.18)';cx.fillRect(OX+x*CS,OY+y*CS,CS-1,CS-1);}
   if(v){const s=pop[y*6+x]?1+pop[y*6+x]*.06:1;cx.save();cx.translate(OX+x*CS+15,OY+y*CS+15);cx.scale(s,s);T(v,0,-5,gv?'#2a2a3a':bad?'#e03040':'#2b5ad6',2,'c',1);cx.restore();}}
  for(let i=0;i<=6;i++){cx.fillStyle='#3a3a4a';cx.fillRect(OX+i*CS-(i%3===0?1:0),OY,i%3===0?2:.6,6*CS);cx.fillRect(OX,OY+i*CS-(i%2===0?1:0),6*CS,i%2===0?2:.6);}
  cur3(OX+CU.x*CS-1,OY+CU.y*CS-1,CS+1,CS+1,'#ff4f9a');fx.draw();X.bar('PUZZLE '+lvl+'/5','SCORE '+g.score,'',K.w,K.y);T('A +1   B -1',160,222,'#5a4a3a',1,'c');};
 return g;}});

A.add({id:'watersort',name:'WATER SORT',cat:'PUZZLE',low:1,how:'A PICKS A TUBE, A AGAIN POURS. ONE COLOUR PER TUBE.',make(){
 const g={over:null,score:0},CO=['#ff4f6d','#ffcf3f','#2fd6c3','#ff4f9a','#3ddc84','#ff9838'],fx=X.fx();let tubes,sel=-1,c=0,lvl=0,pour=null;
 const gen=()=>{lvl++;const n=Math.min(6,3+lvl);let w=[];for(let i=0;i<n;i++)for(let k=0;k<4;k++)w.push(i);shuf(w);tubes=[];for(let i=0;i<n;i++)tubes.push(w.slice(i*4,i*4+4));tubes.push([],[]);sel=-1;c=0;};gen();
 const solved=()=>tubes.every(t=>t.length===0||(t.length===4&&t.every(v=>v===t[0])));
 const tx=i=>{const n=tubes.length,sp=Math.min(44,280/n);return 160-n*sp/2+i*sp+sp/2;};
 g.update=()=>{if(pour&&--pour.t<=0)pour=null;const h=A.hit(0);if(h.l)c=(c+tubes.length-1)%tubes.length;if(h.r)c=(c+1)%tubes.length;if(h.l||h.r)S('blip');if(h.a){if(sel<0){if(tubes[c].length){sel=c;S('blip');}}else{if(c!==sel){const a=tubes[sel],b=tubes[c],top=a[a.length-1];let moved=0;while(a.length&&a[a.length-1]===top&&b.length<4&&(!b.length||b[b.length-1]===top)){b.push(a.pop());moved++;}if(moved){g.score++;S('coin');pour={f:sel,to:c,col:CO[top],t:14};if(b.length===4&&b.every(v=>v===b[0])){fx.spark(tx(c),80,CO[top],12,2.5);fx.ring(tx(c),130,CO[top],30);}if(solved()){S('win');A.confetti();fx.flash('#ffffff',8);if(lvl>=4)g.over='SORTED IN '+g.score+' POURS! WIN';else gen();}}else S('lose');}sel=-1;}}};
 g.draw=()=>{X.cache('wsort_bg',()=>{X.sky(['#1a1238','#0a0618']);X.glow(160,140,140,'#3a6aff',.15);X.vg(0,190,W,50,['#2a2050','#140c28']);});const cx=A.c;
  tubes.forEach((t,i)=>{const x=tx(i),y=sel===i?60:80;X.shadow(x,184,14,3,.35);cx.save();cx.beginPath();if(cx.roundRect)cx.roundRect(x-11,y,22,100,[0,0,11,11]);else cx.rect(x-11,y,22,100);if(cx.clip)cx.clip();t.forEach((v,k)=>{const yy=y+76-k*24;cx.fillStyle=X.lg(x-11,0,x+11,0,[X.lt(CO[v],.7),X.lt(CO[v],1.25),X.lt(CO[v],.75)]);cx.fillRect(x-11,yy,22,24.5);if(k===t.length-1){cx.fillStyle='rgba(255,255,255,.35)';cx.fillRect(x-11,yy,22,2);}});cx.restore();
   X.rrs(x-12,y-2,24,104,6,i===c?'#ffcf3f':'rgba(200,220,255,.6)',i===c?1.6:1);cx.fillStyle='rgba(255,255,255,.18)';cx.fillRect(x-8,y+4,3,88);X.rr(x-14,y-4,28,4,2,'rgba(200,220,255,.5)');});
  if(pour){const a=tx(pour.f),b=tx(pour.to);X.stroke([[a,58],[(a+b)/2,40],[b,76]],pour.col,3);}
  fx.draw();X.bar('LEVEL '+lvl+'/4','POURS '+g.score,'',K.w,K.y);};
 return g;}});

A.add({id:'iceslide',name:'ICE SLIDE',cat:'PUZZLE',low:1,how:'ARROWS SLIDE UNTIL YOU HIT A ROCK. REACH THE FLAG.',make(){
 const g={over:null,score:0},N=10,fx=X.fx();let m,p,goal,lvl=0,anim=null,trail=[],gid=0;
 const solve=()=>{const seen=new Set([p.x+','+p.y]),q=[[p.x,p.y,0]];while(q.length){const[x,y,d]=q.shift();if(x===goal.x&&y===goal.y)return d;for(const v of[[1,0],[-1,0],[0,1],[0,-1]]){let nx=x,ny=y;while(nx+v[0]>=0&&ny+v[1]>=0&&nx+v[0]<N&&ny+v[1]<N&&!m[ny+v[1]][nx+v[0]]){nx+=v[0];ny+=v[1];if(nx===goal.x&&ny===goal.y)break;}const k=nx+','+ny;if(!seen.has(k)){seen.add(k);q.push([nx,ny,d+1]);}}}return -1;};
 const gen=()=>{lvl++;gid=Math.random()*1e9|0;trail=[];for(let tr=0;tr<200;tr++){m=[];for(let y=0;y<N;y++){m.push([]);for(let x=0;x<N;x++)m[y].push(Math.random()<.16?1:0);}p={x:ri(N),y:ri(N)};goal={x:ri(N),y:ri(N)};m[p.y][p.x]=0;m[goal.y][goal.x]=0;const d=solve();if(d>=3+Math.min(4,lvl))return;}};gen();
 const px=x=>40+x*24+12,py=y=>20+y*21+10;
 g.update=()=>{if(anim){trail.push([p.x,p.y]);if(trail.length>12)trail.shift();p.x+=anim[0];p.y+=anim[1];const nx=p.x+anim[0],ny=p.y+anim[1];if((p.x===goal.x&&p.y===goal.y)||nx<0||ny<0||nx>=N||ny>=N||m[ny][nx]){fx.spark(px(p.x)+anim[0]*8,py(p.y)+anim[1]*8,'#ffffff',5,1.6);anim=null;S('hit');if(p.x===goal.x&&p.y===goal.y){S('win');fx.spark(px(p.x),py(p.y),K.y,16,2.5);fx.ring(px(p.x),py(p.y),K.y,24);if(lvl>=6)g.over='ALL FLAGS IN '+g.score+' MOVES! WIN';else gen();}}return;}
  const h=A.hit(0),v=h.l?[-1,0]:h.r?[1,0]:h.u?[0,-1]:h.d?[0,1]:null;if(v){const nx=p.x+v[0],ny=p.y+v[1];if(nx>=0&&ny>=0&&nx<N&&ny<N&&!m[ny][nx]){anim=v;g.score++;S('blip');}else S('lose');}};
 g.draw=()=>{const cx=A.c;X.cache('ice_bg'+gid,()=>{X.vg(0,0,W,H,['#bfe8ff','#8ac8f0']);X.rr(36,16,N*24+8,N*21+8,5,'#6aa8d8');for(let y=0;y<N;y++)for(let x=0;x<N;x++){const X0=40+x*24,Y0=20+y*21;A.c.fillStyle=X.lg(X0,Y0,X0+23,Y0+20,[(x+y)%2?'#f4fcff':'#e4f4ff','#cfeaff']);A.c.fillRect(X0,Y0,23,20);A.c.fillStyle='rgba(255,255,255,.6)';A.c.fillRect(X0+3,Y0+3,6,1);if(m[y][x]){X.shadow(X0+13,Y0+16,10,3,.3);X.poly([[X0+3,Y0+16],[X0+6,Y0+5],[X0+13,Y0+2],[X0+20,Y0+7],[X0+21,Y0+16]],X.lg(X0,Y0,X0+23,Y0+18,['#a8a8b8','#6a6a7a','#4a4a58']));A.c.fillStyle='rgba(255,255,255,.5)';A.c.fillRect(X0+8,Y0+6,4,1.5);}}});
  const fw=Math.sin(A.t*.15);cx.fillStyle='#333';cx.fillRect(px(goal.x)-2,py(goal.y)-9,1.5,17);X.poly([[px(goal.x)-.5,py(goal.y)-9],[px(goal.x)+9,py(goal.y)-6+fw],[px(goal.x)-.5,py(goal.y)-3]],'#ff4f6d');X.glow(px(goal.x),py(goal.y),12,'#ff4f6d',.25);
  trail.forEach((q,i)=>{cx.globalAlpha=.3*(i/trail.length);X.disc(px(q[0]),py(q[1]),5,'#ffffff');});cx.globalAlpha=1;X.shadow(px(p.x),py(p.y)+7,7,2,.3);X.orb(px(p.x),py(p.y),7,'#4dabff');X.disc(px(p.x)-2,py(p.y)-1,1.2,'#111');X.disc(px(p.x)+2,py(p.y)-1,1.2,'#111');
  fx.draw();X.bar('LEVEL '+lvl+'/6','MOVES '+g.score,'',K.w,K.y);};
 return g;}});

A.add({id:'sumten',name:'SUM TEN',cat:'PUZZLE',how:'A SELECTS A NUMBER, A ON A NEIGHBOUR. PAIRS THAT MAKE 10 CLEAR. 90 SEC.',make(){
 const g={over:null,score:0},N=7,fx=X.fx(),NC=['#ffffff','#2fd6c3','#ff4f9a','#3ddc84','#ff9838','#ffcf3f','#4dabff','#ff4f6d','#c86dff'];let b=[],c={x:3,y:3},CU=c,sel=null,time=5400,pop=Array(49).fill(0),bad=0;const nv=()=>1+ri(9);for(let i=0;i<N*N;i++)b.push(nv());
 g.update=()=>{time--;pop=pop.map(v=>v?v-1:0);if(bad)bad--;if(time<=0){g.over='TIME UP';return;}const h=A.hit(0);mvCur(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(sel===null){sel=i;S('blip');}else{const sx=sel%N,sy=(sel/N)|0,adj=Math.abs(sx-c.x)+Math.abs(sy-c.y)===1;if(adj&&b[sel]+b[i]===10){g.score+=10;S('coin');[sel,i].forEach(j=>{fx.spark(68+(j%N)*26+12,36+((j/N)|0)*26+12,NC[b[j]-1],8,2);pop[j]=10;});fx.pop(68+c.x*26+12,30+c.y*26,'10!',K.y);b[sel]=nv();b[i]=nv();}else if(i!==sel){S('lose');bad=10;}sel=null;}}};
 g.draw=()=>{X.cache('sumten_bg',()=>{X.sky(['#1e1640','#0e0a20']);X.rr(62,30,N*26+10,N*26+10,6,X.lg(0,30,0,222,['#3a2e70','#221a48']));});const cx=A.c,ox=bad?Math.sin(bad*2)*2:0;
  for(let i=0;i<N*N;i++){const x=68+(i%N)*26+ox,y=36+((i/N)|0)*26,s=pop[i]?1-pop[i]*.05:1,on=i===sel,col=NC[b[i]-1];if(on)X.glow(x+12,y+12,16,'#ffcf3f',.4);X.rr(x+12-12*s,y+12-12*s,24*s,24*s,4,on?X.lg(0,y,0,y+24,['#fff3a0','#ffcf3f']):X.lg(0,y,0,y+24,['#3a2e6a','#2a2052']));if(!on){cx.fillStyle=X.rgba(col,.35);cx.fillRect(x+4,y+21,16,1.5);}T(b[i],x+12,y+7,on?'#3a2a10':col,2,'c',1);}
  if(sel!==null){const sx=sel%N,sy=(sel/N)|0;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=sx+d[0],ny=sy+d[1];if(nx>=0&&ny>=0&&nx<N&&ny<N&&b[sel]+b[ny*N+nx]===10)X.rrs(68+nx*26+1,36+ny*26+1,22,22,4,'rgba(61,255,139,.6)',1);}}
  cur3(68+CU.x*26-1,36+CU.y*26-1,26,26,'#2fd6c3');fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),'',K.y,time<600?K.r:K.w);};
 return g;}});

A.add({id:'tilepairs',name:'TILE PAIRS',cat:'PUZZLE',how:'MATCH TWO FREE TILES (NOTHING ON TOP, A SIDE OPEN). CLEAR THE STACK.',make(){
 const g={over:null,score:0},SYM=['@','#','$','%','&','*','+','?','!','='],CO=['#e03040','#2a6ad8','#1a9a4a','#d0307a','#e07020','#1aa8a0','#c89a10','#8a4ad8','#e03040','#2a6ad8'],fx=X.fx();let tiles=[],c=0,sel=null;
 const pos=[];for(let y=0;y<4;y++)for(let x=0;x<8;x++)pos.push({x,y,z:0});for(let y=1;y<3;y++)for(let x=2;x<6;x++)pos.push({x,y,z:1});pos.push({x:3.5,y:1.5,z:2},{x:3.5,y:1.5,z:3});
 const ids=[];for(let i=0;i<pos.length/2;i++){ids.push(i%10,i%10);}shuf(ids);tiles=pos.map((p,i)=>({...p,s:ids[i],gone:false,g:0}));
 const free=t=>!t.gone&&!tiles.some(o=>!o.gone&&o.z>t.z&&Math.abs(o.x-t.x)<1&&Math.abs(o.y-t.y)<1)&&(!tiles.some(o=>!o.gone&&o.z===t.z&&o.y===t.y&&o.x===t.x-1)||!tiles.some(o=>!o.gone&&o.z===t.z&&o.y===t.y&&o.x===t.x+1));
 const tp=t=>[40+t.x*30-t.z*3,40+t.y*40-t.z*4];
 g.update=()=>{tiles.forEach(t=>{if(t.gone&&t.g<20)t.g++;});const live=tiles.map((t,i)=>i).filter(i=>free(tiles[i]));if(!live.includes(c))c=live[0]??0;const h=A.hit(0);if(h.l||h.r||h.u||h.d){const cur=tiles[c];const dir=h.l?[-1,0]:h.r?[1,0]:h.u?[0,-1]:[0,1];let best=null,bd=1e9;for(const i of live){if(i===c)continue;const t=tiles[i],dx=t.x-cur.x,dy=t.y-cur.y;if(dx*dir[0]+dy*dir[1]<=0)continue;const d=Math.abs(dx)+Math.abs(dy)+Math.abs(dx*dir[1]+dy*dir[0])*2;if(d<bd){bd=d;best=i;}}if(best!==null){c=best;S('blip');}}
  if(h.a){if(sel===null){sel=c;S('blip');}else if(sel!==c&&tiles[sel].s===tiles[c].s){tiles[sel].gone=tiles[c].gone=true;[sel,c].forEach(j=>{const[x,y]=tp(tiles[j]);fx.spark(x+14,y+19,CO[tiles[j].s],8,2);});g.score+=10;S('coin');sel=null;if(tiles.every(t=>t.gone)){g.over='BOARD CLEAR! WIN';A.confetti();}else if(!(()=>{const f=tiles.filter(free);return f.some((a,i)=>f.some((b,j)=>j>i&&a.s===b.s));})())g.over='NO MOVES LEFT';}else{sel=null;S('lose');}}};
 g.draw=()=>{X.cache('tpairs_bg',()=>{X.turf(0,0,W,H,'#0f5a2a','#126330',20);X.vignette(.5);});const cx=A.c;
  tiles.slice().sort((a,b)=>a.z-b.z||a.y-b.y).forEach(t=>{if(t.gone&&t.g>=20)return;const i=tiles.indexOf(t),[x,y]=tp(t),fr=free(t);if(t.gone){cx.globalAlpha=1-t.g/20;}cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(x+4,y+4,28,38);X.rr(x+2,y+2,28,38,3,'#b8a880');X.rr(x,y,28,38,3,X.lg(0,y,0,y+38,fr?['#fffbf0','#f0e4c8']:['#d8ccb0','#c4b898']));cx.fillStyle='rgba(255,255,255,.5)';cx.fillRect(x+3,y+2,22,1.5);T(SYM[t.s],x+14,y+13,CO[t.s],2,'c',1);
   if(i===sel){X.glow(x+14,y+19,22,'#ffcf3f',.35);X.rrs(x-1,y-1,30,40,3,'#ffcf3f',1.6);}else if(i===c)X.rrs(x-1,y-1,30,40,3,'#ff4f9a',1.4);cx.globalAlpha=1;});
  fx.draw();X.bar('SCORE '+g.score,'LEFT '+tiles.filter(t=>!t.gone).length);};
 return g;}});

A.add({id:'parking',name:'PARKING JAM',cat:'PUZZLE',low:1,how:'A PICKS A CAR, ARROWS SLIDE IT. GET THE RED CAR OUT THE RIGHT EXIT.',make(){
 const g={over:null,score:0},N=6,CO=['#4dabff','#3ddc84','#ffcf3f','#ff4f9a','#ff9838','#2fd6c3','#b070ff','#a87444'],fx=X.fx();let cars,sel=0,lvl=0,exitAnim=0;
 const occ=(cs,ex)=>{const o=new Set();cs.forEach((c,i)=>{if(i===ex)return;for(let k=0;k<c.l;k++)o.add((c.h?c.x+k:c.x)+','+(c.h?c.y:c.y+k));});return o;};
 const can=(cs,i,d)=>{const c=cs[i],o=occ(cs,i);if(c.h){const nx=d>0?c.x+c.l:c.x-1;return nx>=0&&nx<N&&!o.has(nx+','+c.y);}const ny=d>0?c.y+c.l:c.y-1;return ny>=0&&ny<N&&!o.has(c.x+','+ny);};
 const gen=()=>{lvl++;for(let tr=0;tr<300;tr++){const cs=[{x:4,y:2,l:2,h:1}];for(let k=0;k<6+Math.min(5,lvl);k++){const h=Math.random()<.5,l=Math.random()<.7?2:3,x=ri(h?N-l+1:N),y=ri(h?N:N-l+1);if(h&&y===2)continue;const test={x,y,l,h};const o=occ(cs,-1);let bad=false;for(let q=0;q<l;q++)if(o.has((h?x+q:x)+','+(h?y:y+q)))bad=true;if(!bad)cs.push(test);}
   for(let s=0;s<600;s++){const i=ri(cs.length),d=Math.random()<.5?1:-1;if(can(cs,i,d)){if(cs[i].h)cs[i].x+=d;else cs[i].y+=d;}}if(cs[0].x<=1){cars=cs.map(c=>({...c,ox:0,oy:0}));sel=0;return;}}cars=[{x:0,y:2,l:2,h:1,ox:0,oy:0}];sel=0;};gen();
 const CS=32,OX=64,OY=24;
 g.update=()=>{cars.forEach(c=>{c.ox*=.6;c.oy*=.6;});const h=A.hit(0);if(h.a||h.b){sel=(sel+(h.b?cars.length-1:1))%cars.length;S('blip');return;}const c=cars[sel];let d=0;if(c.h){if(h.l)d=-1;if(h.r)d=1;}else{if(h.u)d=-1;if(h.d)d=1;}
  if(d){if(sel===0&&c.x+c.l===N&&d>0){g.score++;S('win');A.confetti();fx.spark(OX+N*CS,OY+2*CS+16,'#ff4f6d',16,3);if(lvl>=6)g.over='ALL PARKED OUT IN '+g.score+'! WIN';else gen();return;}if(can(cars,sel,d)){if(c.h){c.x+=d;c.ox=-d*CS;}else{c.y+=d;c.oy=-d*CS;}g.score++;S('hit');}else{S('lose');if(c.h)c.ox=d*4;else c.oy=d*4;}}};
 const car=(c,i)=>{const x=OX+c.x*CS+3+c.ox,y=OY+c.y*CS+3+c.oy,w=(c.h?c.l:1)*CS-6,hh=(c.h?1:c.l)*CS-6,col=i===0?'#e83040':CO[i%CO.length],cx=A.c;cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(x+2,y+3,w,hh);X.rr(x,y,w,hh,6,X.lg(x,y,c.h?x:x+w,c.h?y+hh:y,[X.lt(col,1.35),col,X.lt(col,.7)]));
  if(c.h){X.rr(x+w*.55,y+4,w*.18,hh-8,2,'rgba(30,50,80,.8)');X.rr(x+w*.2,y+4,w*.14,hh-8,2,'rgba(30,50,80,.6)');cx.fillStyle='#fff6c0';cx.fillRect(x+w-3,y+3,2,4);cx.fillRect(x+w-3,y+hh-7,2,4);}else{X.rr(x+4,y+hh*.55,w-8,hh*.18,2,'rgba(30,50,80,.8)');X.rr(x+4,y+hh*.2,w-8,hh*.14,2,'rgba(30,50,80,.6)');cx.fillStyle='#fff6c0';cx.fillRect(x+3,y+hh-3,4,2);cx.fillRect(x+w-7,y+hh-3,4,2);}
  cx.fillStyle='rgba(255,255,255,.3)';cx.fillRect(x+4,y+2,w-8,1.5);if(i===sel){X.glow(x+w/2,y+hh/2,Math.max(w,hh)*.6,'#ffffff',.18);X.rrs(x-2,y-2,w+4,hh+4,7,'#ffffff',1.5);}};
 g.draw=()=>{X.cache('park_bg',()=>{X.vg(0,0,W,H,['#2a2a38','#1a1a24']);X.rr(OX-6,OY-6,N*CS+12,N*CS+12,6,'#5a5a6a');X.vg(OX,OY,N*CS,N*CS,['#3e3e4c','#34343f']);A.c.fillStyle='rgba(255,255,255,.12)';for(let i=1;i<N;i++){A.c.fillRect(OX+i*CS,OY,1,N*CS);A.c.fillRect(OX,OY+i*CS,N*CS,1);}A.c.fillStyle='#34343f';A.c.fillRect(OX+N*CS,OY+2*CS+3,10,CS-6);for(let y=OY+2*CS+4;y<OY+3*CS-4;y+=6){A.c.fillStyle='#ffcf3f';A.c.fillRect(OX+N*CS+6,y,3,3);}});
  cars.forEach(car);X.poly([[OX+N*CS+12,OY+2*CS+10],[OX+N*CS+18,OY+2*CS+16],[OX+N*CS+12,OY+2*CS+22]],A.t%30<15?'#3ddc84':'#1a8a4a');fx.draw();X.bar('LEVEL '+lvl+'/6','MOVES '+g.score,'',K.w,K.y);T('A/B NEXT CAR',160,230,K.gr,1,'c');};
 return g;}});

A.add({id:'memgrid',name:'MEMORY GRID',cat:'PUZZLE',how:'WATCH THE LIT CELLS, THEN SELECT THEM ALL WITH A.',make(){
 const g={over:null,score:0},fx=X.fx();let N=3,lit=[],pick=new Set(),ph='show',t=0,c={x:0,y:0},lives=3,wrong=-1;const gen=()=>{N=Math.min(6,3+(g.score/3|0));const n=Math.min(N*N-2,3+g.score);lit=shuf([...Array(N*N).keys()]).slice(0,n);pick=new Set();ph='show';t=0;c={x:0,y:0};wrong=-1;};gen();
 g.update=()=>{t++;if(ph==='show'){if(t>70+lit.length*8){ph='pick';t=0;}return;}if(ph==='res'){if(t>40)gen();return;}const h=A.hit(0);mvCur(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(pick.has(i))return;const CS=Math.floor(180/N),OX=160-N*CS/2,OY=128-N*CS/2;if(lit.includes(i)){pick.add(i);S('coin');fx.ring(OX+c.x*CS+CS/2,OY+c.y*CS+CS/2,'#2fd6c3',CS*.6,12);if(pick.size===lit.length){g.score++;ph='res';t=0;S('win');fx.flash('#2fd6c3',6);}}else{lives--;wrong=i;S('lose');fx.flash(K.r,8);ph='res';t=0;if(lives<=0)g.over='MEMORY FULL';}}};
 g.draw=()=>{X.cache('memg_bg',()=>{X.sky(['#140c30','#08051a']);X.glow(160,128,120,'#3a2aaa',.2);});const CS=Math.floor(180/N),OX=160-N*CS/2,OY=128-N*CS/2;
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS,show=(ph==='show'||ph==='res')&&lit.includes(i),on=show||pick.has(i),f=ph==='show'?Math.min(1,t/10):1;if(on){X.glow(x+CS/2,y+CS/2,CS*.7,'#2fd6c3',.35*f);X.rr(x+2,y+2,CS-4,CS-4,5,X.lg(0,y,0,y+CS,['#9ffff0','#2fd6c3','#0e8a80']));}else X.rr(x+2,y+2,CS-4,CS-4,5,X.lg(0,y,0,y+CS,['#3a2e70','#241a4e']));if(i===wrong&&ph==='res')X.rr(x+2,y+2,CS-4,CS-4,5,'rgba(255,79,109,.8)');}
  if(ph==='pick')cur3(OX+c.x*CS+1,OY+c.y*CS+1,CS-2,CS-2,'#ffcf3f');fx.draw();X.bar('ROUND '+(g.score+1),'');for(let i=0;i<3;i++)X.heart(W-10-i*11,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.15)');X.ot(ph==='show'?'WATCH':ph==='pick'?'FIND '+(lit.length-pick.size):'',160,222,K.y,2,'c');};
 return g;}});

A.add({id:'balance',name:'BALANCE',cat:'PUZZLE',how:'LEFT/RIGHT PICK A WEIGHT. A DROPS IT. BALANCE THE SCALE. 60 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let L_,R_,opts,sel=0,time=3600,tilt=0,fl=0;const gen=()=>{L_=[];for(let i=0;i<2+ri(2);i++)L_.push(1+ri(9));const sum=L_.reduce((a,b)=>a+b);const a=1+ri(Math.min(9,sum-1));R_=[a];const need=sum-a;opts=shuf([need,need+1+ri(3),Math.max(1,need-1-ri(3)),need+4]);sel=0;};gen();
 g.update=()=>{time--;if(fl>0)fl--;if(fl<0)fl++;if(time<=0){g.over='TIME UP';return;}const h=A.hit(0);if(h.l)sel=(sel+3)%4;if(h.r)sel=(sel+1)%4;if(h.l||h.r)S('blip');if(h.a){const tot=R_[0]+opts[sel],sum=L_.reduce((a,b)=>a+b);if(tot===sum){g.score+=10;S('coin');fl=20;fx.spark(160,100,'#3ddc84',14,2.5);fx.pop(160,80,'BALANCED!',K.g);gen();}else{tilt=tot>sum?1:-1;time-=180;S('lose');fl=-20;fx.pop(160,80,'-3 SEC',K.r);}}tilt*=.95;};
 const wt=(x,y,v,col)=>{X.shadow(x,y+1,10,2,.3);X.poly([[x-10,y],[x+10,y],[x+7,y-20],[x-7,y-20]],X.lg(x-10,0,x+10,0,[X.lt(col,.7),X.lt(col,1.3),X.lt(col,.7)]));X.rr(x-3,y-24,6,5,2,'#8a8aa0');T(v,x,y-14,'#1a1a2a',1,'c',1);};
 g.draw=()=>{X.cache('bal_bg',()=>{X.vg(0,0,W,H,['#2a1e3a','#140e1e']);X.glow(160,100,140,'#ffd890',.12);X.vg(0,196,W,44,['#3a2a4a','#1a1424']);A.c.fillStyle=X.lg(156,0,164,0,['#8a8aa0','#e8e8f0','#8a8aa0']);A.c.fillRect(156,100,8,92);X.poly([[136,194],[184,194],[160,170]],X.lg(0,170,0,194,['#c8c8d8','#6a6a7a']));});const c=A.c,a=tilt*.2;
  c.save();c.translate(160,100);c.rotate(a);c.fillStyle=X.lg(0,-3,0,3,['#e8e8f0','#9a9aaa']);c.fillRect(-110,-3,220,6);X.disc(0,0,5,'#ffcf3f');c.restore();
  const side=(arr,x,y,col)=>{X.stroke([[x-36,y],[x,y-30],[x+36,y]],'rgba(200,200,220,.6)',.8);X.rr(x-40,y,80,4,2,X.lg(0,y,0,y+4,['#e8e8f0','#8a8aa0']));arr.forEach((v,i)=>wt(x-26+i*26,y,v,col));};side(L_,70,100-Math.sin(a)*90,'#2fd6c3');side(R_.concat(['?']),250,100+Math.sin(a)*90,'#ff4f9a');
  opts.forEach((v,i)=>{const x=88+i*50,on=i===sel;if(on)X.glow(x,217,22,'#ffcf3f',.3);X.rr(x-18,205,36,24,5,on?X.lg(0,205,0,229,['#fff3a0','#ffcf3f']):'rgba(255,255,255,.1)');T(v,x,212,on?'#3a2a10':'#f0f0e8',2,'c',1);});
  if(fl>0){c.fillStyle='rgba(61,255,139,'+fl/150+')';c.fillRect(0,0,W,H);}fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),'',K.y,time<600?K.r:K.w);};
 return g;}});

A.add({id:'twist',name:'TILE TWIST',cat:'PUZZLE',low:1,how:'A ROTATES A TILE. REBUILD THE PICTURE.',make(){
 const g={over:null,score:0},N=4,fx=X.fx();let rot=[],c={x:0,y:0},CU=c,lvl=0,seed,spin=Array(16).fill(0);const gen=()=>{lvl++;seed=rnd(100);rot=[];for(let i=0;i<N*N;i++)rot.push(ri(4));if(rot.every(v=>v===0))rot[0]=1;};gen();
 const pic=(x,y)=>{const cx=x-.5,cy=y-.5,d=Math.hypot(cx,cy);const a=Math.atan2(cy,cx)+seed;return d<.18?'#ffcf3f':d<.3?(Math.sin(a*5)>0?'#ff4f9a':'#ff9838'):d<.42?(y<.5?'#2fd6c3':'#4dabff'):((x*6+y*6|0)%2?'#2b2257':'#3a2a78');};
 g.update=()=>{spin=spin.map(v=>v?v-1:0);const h=A.hit(0);mvCur(h,c,N,N);if(h.a){rot[c.y*N+c.x]=(rot[c.y*N+c.x]+1)%4;spin[c.y*N+c.x]=8;g.score++;S('hit');if(rot[c.y*N+c.x]===0)fx.spark(160-N*23+c.x*46+23,24+c.y*46+23,'#3ddc84',4,1.5);if(rot.every(v=>v===0)){S('win');A.confetti();fx.flash('#ffffff',10);if(lvl>=4)g.over='GALLERY COMPLETE IN '+g.score+'! WIN';else gen();}}};
 g.draw=()=>{X.cache('twist_bg',()=>{X.sky(['#1a1236','#0a0618']);X.rr(160-N*23-6,18,N*46+12,N*46+12,6,X.lg(0,18,0,214,['#c8a060','#7a5428']));});const CS=46,OX=160-N*CS/2,OY=24,P=8,cx=A.c;
  for(let ty=0;ty<N;ty++)for(let tx=0;tx<N;tx++){const r=rot[ty*N+tx],sp=spin[ty*N+tx];cx.save();cx.translate(OX+tx*CS+CS/2,OY+ty*CS+CS/2);if(sp)cx.rotate(-sp/8*1.5708);for(let py=0;py<P;py++)for(let px=0;px<P;px++){let u=px,v=py;for(let k=0;k<r;k++){[u,v]=[v,P-1-u];}cx.fillStyle=pic((tx*P+u+.5)/(N*P),(ty*P+v+.5)/(N*P));cx.fillRect(-CS/2+px*CS/P,-CS/2+py*CS/P,CS/P+.5,CS/P+.5);}cx.strokeStyle=r===0?'rgba(61,255,139,.25)':'rgba(0,0,0,.45)';cx.lineWidth=1;cx.strokeRect(-CS/2+.5,-CS/2+.5,CS-1,CS-1);cx.restore();}
  cur3(OX+CU.x*CS,OY+CU.y*CS,CS,CS,'#ffffff');fx.draw();X.bar('PICTURE '+lvl+'/4','TURNS '+g.score,'',K.w,K.y);X.ot('DONE '+rot.filter(v=>v===0).length+'/16',160,222,K.g,1,'c');};
 return g;}});

A.add({id:'merge3',name:'MERGE THREE',cat:'PUZZLE',how:'PLACE THE TILE WITH A. THREE OR MORE TOUCHING THE SAME MERGE UP.',make(){
 const g={over:null,score:0},N=5,CO=['#2b2257','#3ddc84','#2fd6c3','#4dabff','#c86dff','#ff9838','#ffcf3f','#ff4f6d','#ffffff'],fx=X.fx();let b=Array(N*N).fill(0),c={x:2,y:2},CU=c,next=1,pop=Array(25).fill(0);const nv=()=>Math.random()<.75?1:Math.random()<.8?2:3;next=nv();
 const group=(i,v,seen)=>{if(seen.has(i)||b[i]!==v)return;seen.add(i);const x=i%N,y=(i/N)|0;if(x>0)group(i-1,v,seen);if(x<N-1)group(i+1,v,seen);if(y>0)group(i-N,v,seen);if(y<N-1)group(i+N,v,seen);};
 g.update=()=>{pop=pop.map(v=>v?v-1:0);const h=A.hit(0);mvCur(h,c,N,N);if(h.a){const i=c.y*N+c.x;if(b[i]){S('lose');return;}b[i]=next;pop[i]=8;let merged=true;while(merged){merged=false;const s=new Set();group(i,b[i],s);if(s.size>=3&&b[i]<8){s.forEach(j=>{if(j!==i)fx.spark(86+(j%N)*34,42+((j/N)|0)*34,CO[b[i]],5,1.8);b[j]=0;});b[i]++;g.score+=b[i]*b[i]*5;pop[i]=12;merged=true;S('coin');fx.ring(86+c.x*34,42+c.y*34,CO[b[i]],26);fx.pop(86+c.x*34,30+c.y*34,'+'+b[i]*b[i]*5,K.y);}}next=nv();S('blip');if(b.every(v=>v))g.over='BOARD FULL';}};
 g.draw=()=>{X.cache('merge3_bg',()=>{X.sky(['#1a1238','#0a0618']);X.rr(64,20,N*34+10,N*34+10,6,X.lg(0,20,0,200,['#3a2e70','#221a48']));for(let i=0;i<N*N;i++)X.rr(70+(i%N)*34,26+((i/N)|0)*34,32,32,5,'#16102e');X.panel(250,34,56,62,'#ffffff');});
  for(let i=0;i<N*N;i++){if(!b[i])continue;const x=70+(i%N)*34,y=26+((i/N)|0)*34,s=pop[i]?1+pop[i]*.03:1,col=CO[b[i]];if(b[i]>=5)X.glow(x+16,y+16,22,col,.3);A.c.save();A.c.translate(x+16,y+16);A.c.scale(s,s);X.block(-16,-16,32,32,col,6);T(b[i],0,-5,'#1a1a2a',2,'c',1);A.c.restore();}
  cur3(70+CU.x*34-1,26+CU.y*34-1,34,34,'#ffffff');const bob=Math.sin(A.t*.1)*2;X.block(258,42+bob,40,40,CO[next],6);T(next,278,56+bob,'#1a1a2a',2,'c',1);T('NEXT',278,88,K.gr,1,'c');fx.draw();X.bar('SCORE '+g.score,'');};
 return g;}});
})();
