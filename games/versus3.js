(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const hudv=(a,b,m)=>X.bar(A.nm(0)+' '+a,b+' '+A.nm(1),m,K.c,K.p);
/* pretty die: x,y top-left, size s, value v, body colour, rotation */
const dieP=(x,y,v,col,s,rot)=>{s=s||22;const c=A.c,h=s/2;c.save();c.translate(x+h,y+h);if(rot)c.rotate(rot);X.rr(-h+1,-h+3,s,s,s*.2,'rgba(0,0,0,.35)');X.rr(-h,-h,s,s,s*.2,X.lg(0,-h,0,h,[X.lt(col||'#ffffff',1.05),col||'#f4f0e6',X.lt(col||'#f4f0e6',.78)]));X.rrs(-h+.5,-h+.5,s-1,s-1,s*.2,'rgba(0,0,0,.35)',1);c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-h+s*.2,-h+1,s*.6,1.2);
 const P={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[v]||[],o=s*.27;P.forEach(p=>{X.disc(p[0]*o,p[1]*o,s*.085,v===1?'#d0283c':'#1a1a2a');X.disc(p[0]*o-s*.02,p[1]*o-s*.03,s*.03,'rgba(255,255,255,.35)');});c.restore();};
const felt=(key,c1,c2)=>X.cache(key,()=>{X.vg(0,0,W,H,[c1,c2]);A.c.fillStyle='rgba(0,0,0,.06)';for(let i=0;i<500;i++)A.c.fillRect((i*73)%W,(i*131)%H,1,1);X.vignette(.55);});
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const die=(x,y,v,col)=>{R(x,y,22,22,col||K.w);A.box(x,y,22,22,K.k);const P={1:[[11,11]],2:[[6,6],[16,16]],3:[[6,6],[11,11],[16,16]],4:[[6,6],[16,6],[6,16],[16,16]],5:[[6,6],[16,6],[11,11],[6,16],[16,16]],6:[[6,5],[16,5],[6,11],[16,11],[6,17],[16,17]]}[v]||[];P.forEach(p=>R(x+p[0]-1.5,y+p[1]-1.5,3,3,K.k));};

A.add({id:'battleship',name:'SEA BATTLE',cat:'BOARD',vs:1,how:'MOVE THE CURSOR ON THE ENEMY GRID. A FIRES. SINK ALL 4 SHIPS.',make(){
 const g={over:null,score:0},N=8,SH=[4,3,3,2],fx=X.fx();let bd=[[],[]],shots=[new Set(),new Set()],p=0,c={x:3,y:3},think=0,msg='',mt=0,hunt=[];const CU=c;
 const place=()=>{const b=Array(N*N).fill(0);SH.forEach((l,k)=>{for(let tr=0;tr<200;tr++){const h=Math.random()<.5,x=ri(h?N-l+1:N),y=ri(h?N:N-l+1),cs=[];for(let q=0;q<l;q++)cs.push((h?y:y+q)*N+(h?x+q:x));if(cs.every(i=>!b[i])){cs.forEach(i=>b[i]=k+1);return;}}});return b;};bd=[place(),place()];
 const sunk=(b,s,k)=>b.every((v,i)=>v!==k||s.has(i));const allSunk=(b,s)=>SH.every((_,k)=>sunk(b,s,k+1));
 const shoot=i=>{const tb=bd[1-p],s=shots[p];if(s.has(i))return false;s.add(i);const ox=A.cpu&&p===1?20:172,cx=ox+(i%N)*16+7.5,cy=40+((i/N)|0)*16+7.5;if(tb[i]){msg=sunk(tb,s,tb[i])?'SUNK!':'HIT!';S(msg==='SUNK!'?'score':'hit');fx.spark(cx,cy,'#ffb040',14,2.4);fx.ring(cx,cy,'#ffcf3f',16);A.shake=msg==='SUNK!'?6:3;if(msg==='SUNK!')fx.flash('#ff8a3a',6);if(p===1)hunt.push(i);if(allSunk(tb,s)){g.over=A.win(p);return true;}}else{msg='MISS';S('blip');fx.ring(cx,cy,'#cfe8ff',12);fx.spark(cx,cy,'#9fd0ff',6,1.4);p=1-p;}mt=40;think=0;return true;};
 g.update=()=>{if(mt>0){mt--;return;}if(A.cpu&&p===1){if(++think<30)return;const s=shots[1];let i=-1;if(A.lvl>0){for(const hi of hunt){const x=hi%N,y=(hi/N)|0;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+d[0],ny=y+d[1],ni=ny*N+nx;if(nx>=0&&ny>=0&&nx<N&&ny<N&&!s.has(ni)){i=ni;break;}}if(i>=0)break;}}if(i<0){const opts=[...Array(N*N).keys()].filter(k=>!s.has(k)&&(A.lvl<2||((k%N)+((k/N)|0))%2===0));i=(opts.length?opts:[...Array(N*N).keys()].filter(k=>!s.has(k)))[ri(opts.length||1)];}shoot(i);return;}
  const h=A.hit(human(p));mvCur(h,c,N,N);if(h.a&&!shoot(c.y*N+c.x))S('lose');};
 const bg=()=>{X.vg(0,0,W,H,['#0c3a70','#072448','#041530']);const cx=A.c;cx.fillStyle='rgba(120,200,255,.08)';for(let j=8;j<H;j+=7)for(let i=0;i<W;i+=30)cx.fillRect((i+j*5)%W,j,12,1);X.vignette(.5);};
 const ship=(ox,b,k,sk)=>{const cs=[];b.forEach((v,i)=>{if(v===k)cs.push(i);});if(!cs.length)return;const xs=cs.map(i=>i%N),ys=cs.map(i=>(i/N)|0),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),hz=y0===y1;const X0=ox+x0*16,Y0=40+y0*16,w=hz?(x1-x0+1)*16-2:11,hh=hz?11:(y1-y0+1)*16-2,px=hz?X0+1:X0+2,py=hz?Y0+2:Y0+1,col=sk?'#4a4a58':'#9aa4b8';
  X.rr(px,py,w,hh,5.5,hz?X.lg(0,py,0,py+hh,[X.lt(col,1.3),col,X.lt(col,.6)]):X.lg(px,0,px+w,0,[X.lt(col,1.3),col,X.lt(col,.6)]));X.rrs(px+.5,py+.5,w-1,hh-1,5,'rgba(0,0,0,.45)',1);cs.forEach(i=>{const cx=ox+(i%N)*16+7.5,cy=40+((i/N)|0)*16+7.5;X.disc(cx,cy,2.6,sk?'#2a2a32':'#5a6478');X.disc(cx-.6,cy-.7,1,'rgba(255,255,255,.4)');});};
 const grid=(ox,b,s,show,cur,acc,title)=>{X.panel(ox-6,22,140,158,acc);X.ot(title,ox+64,26,acc,1,'c');const cx=A.c;
  for(let i=0;i<N*N;i++){const x=ox+(i%N)*16,y=40+((i/N)|0)*16,sh=.5+.5*Math.sin(A.t*.05+i*.7);X.rr(x,y,15,15,2,'rgba('+(30+sh*14|0)+','+(100+sh*20|0)+',190,.55)');cx.fillStyle='rgba(255,255,255,.08)';cx.fillRect(x+2,y+5+((A.t*.1+i)%6),6,1);}
  for(let k=1;k<=SH.length;k++){const sk=sunk(b,s,k);if(show||sk)ship(ox,b,k,sk);}
  for(let i=0;i<N*N;i++){if(!s.has(i))continue;const x=ox+(i%N)*16+7.5,y=40+((i/N)|0)*16+7.5;if(b[i]){const f=Math.sin(A.t*.4+i);X.glow(x,y,10,'#ff6a1a',.5);X.poly([[x-4,y+3],[x-2,y-4-f],[x,y-1],[x+2,y-6+f],[x+4,y+3]],'#ff8a2a');X.poly([[x-2,y+3],[x,y-3],[x+2,y+3]],'#ffe060');cx.fillStyle='rgba(60,60,60,.5)';cx.fillRect(x-1+Math.sin(A.t*.1+i)*2,y-10-(A.t*.3+i*3)%5,2,2);}else{X.disc(x,y,2.2,'#d8f0ff');A.ring(x,y,4+Math.sin(A.t*.1+i),'rgba(200,235,255,.45)');}}
  SH.forEach((l,k)=>{const sk=sunk(b,s,k+1),y=172,x0=ox+2+[0,36,66,96][k];for(let q=0;q<l;q++)X.rr(x0+q*7,y,6,4,1.5,sk?'#ff4f6d':'#8aa0c0');if(sk)A.line(x0-1,y+2,x0+l*7,y+2,'#ffffff',1);});
  if(cur){const x=ox+CU.x*16+7.5,y=40+CU.y*16+7.5,r=9+Math.sin(A.t*.25)*1.5;A.ring(x,y,r,K.y);A.line(x-r-3,y,x-r+3,y,K.y,1.5);A.line(x+r-3,y,x+r+3,y,K.y,1.5);A.line(x,y-r-3,x,y-r+3,K.y,1.5);A.line(x,y+r-3,x,y+r+3,K.y,1.5);X.glow(x,y,10,K.y,.25);}};
 g.draw=()=>{X.cache('bship_bg',bg);const me=A.cpu?0:p;grid(20,bd[me],shots[1-me],true,false,K.c,A.cpu?'YOUR FLEET':A.nm(me)+' FLEET');grid(172,bd[1-me],shots[me],!!g.over,p===me||!A.cpu,K.p,'ENEMY WATERS');
  X.ot(A.nm(p)+' FIRES',160,188,A.cpu&&p===1?K.p:K.c,2,'c');if(mt){const sc=1+Math.max(0,(mt-30)/10);X.ot(msg,160,212-sc*2,msg==='MISS'?'#9fd0ff':msg==='SUNK!'?K.o:K.y,2,'c');}fx.draw();};
 return g;}});

A.add({id:'artillery',name:'ARTILLERY DUEL',cat:'VERSUS',vs:1,how:'UP/DOWN ANGLE, LEFT/RIGHT POWER, A FIRES. MIND THE WIND. 3 HITS WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let land=[],tk,p=0,sh=null,wind=0,sc=[0,0],think=0,ex=null,plan=null,trail=[],gid=0;
 const gen=()=>{land=[];let y=170;for(let x=0;x<=W;x+=4){y=cl(y+rnd(8)-4+(x>140&&x<180?-2:0),110,200);land.push(y);}tk=[{x:40,a:.8,pw:.6},{x:280,a:.8,pw:.6}];wind=rnd(.06)-.03;plan=null;gid++;};gen();
 const gy=x=>land[cl(Math.round(x/4),0,land.length-1)];
 const fire=()=>{const q=tk[p],d=p?-1:1,v=3+q.pw*6;sh={x:q.x,y:gy(q.x)-10,vx:Math.cos(q.a)*v*d,vy:-Math.sin(q.a)*v};trail=[];S('shoot');fx.spark(q.x+Math.cos(q.a)*14*d,gy(q.x)-10-Math.sin(q.a)*14,'#ffe0a0',8,1.6);A.shake=2;};
 g.update=()=>{if(ex){ex.r+=1.5;if(ex.r>18){ex=null;p=1-p;think=0;plan=null;wind=cl(wind+rnd(.02)-.01,-.04,.04);}return;}
  if(sh){sh.vy+=.12;sh.vx+=wind;sh.x+=sh.vx;sh.y+=sh.vy;trail.push([sh.x,sh.y]);if(trail.length>18)trail.shift();if(sh.x<0||sh.x>W){sh=null;ex={x:-99,y:0,r:17};return;}if(sh.y>=gy(sh.x)){ex={x:sh.x,y:sh.y,r:1};S('boom');A.burst(sh.x,sh.y,K.o,20,3);fx.debris(sh.x,sh.y,'#5a4030',12,2.5);fx.ring(sh.x,sh.y,'#ffcf3f',26);A.shake=5;for(let i=0;i<land.length;i++){const dx=i*4-sh.x;if(Math.abs(dx)<16)land[i]=Math.min(236,land[i]+Math.sqrt(256-dx*dx)*.6);}
    for(let i=0;i<2;i++)if(Math.abs(tk[i].x-sh.x)<14){sc[1-i]+=i===p?0:1;if(i===p)sc[1-i]++;fx.flash('#ffffff',6);fx.pop(tk[i].x,gy(tk[i].x)-26,'DIRECT HIT!',K.y);if(sc[1-i]>=3){g.over=A.win(1-i);}}sh=null;trail=[];}return;}
  const q=tk[p];if(A.cpu&&p===1){if(!plan){let best=null,bd=1e9;for(let a=.3;a<1.4;a+=.05)for(let pw=.2;pw<=1;pw+=.05){let x=q.x,y=gy(q.x)-10,v=3+pw*6,vx=-Math.cos(a)*v,vy=-Math.sin(a)*v;for(let s=0;s<400;s++){vy+=.12;vx+=wind;x+=vx;y+=vy;if(x<0||x>W||y>=gy(x))break;}const dd=Math.abs(x-tk[0].x);if(dd<bd){bd=dd;best={a,pw};}}const err=(1-A.ai)*.18;plan={a:best.a+rnd(err*2)-err,pw:cl(best.pw+rnd(err)-err/2,.1,1)};}q.a+=(plan.a-q.a)*.1;q.pw+=(plan.pw-q.pw)*.1;if(++think>70)fire();return;}
  const k=A.in(human(p));q.a=cl(q.a-ay(k)*.02,.2,1.5);q.pw=cl(q.pw+ax(k)*(p?-1:1)*.01,.1,1);if(A.hit(human(p)).a)fire();};
 const bg=()=>{X.sky(['#1a1f5a','#6a3a7a','#e86a48','#ffb860'],H);X.disc(230,150,26,X.rg(230,150,0,230,150,26,['#fff4c0','#ffd070','rgba(255,160,80,0)']));X.glow(230,150,70,'#ff9040',.35);X.stars(30,4,0,0,90,.6);
  X.hills(170,70,'rgba(90,50,100,.75)',0,.012,3);X.hills(185,45,'rgba(70,40,70,.85)',40,.02,7);const cx=A.c;cx.fillStyle='rgba(255,220,200,.25)';[[40,40,30],[120,60,40],[260,35,26]].forEach(cl=>{X.ell(cl[0],cl[1],cl[2],5,'rgba(255,200,190,.25)');X.ell(cl[0]+10,cl[1]-3,cl[2]*.6,5,'rgba(255,220,210,.25)');});};
 const tank=(q,i)=>{const y=gy(q.x),d=i?-1:1,col=i?K.p:K.c,cx=A.c,act=i===p&&!sh&&!ex;X.shadow(q.x,y+1,14,3,.4);
  cx.save();cx.translate(q.x,y-9);cx.strokeStyle='#222';cx.lineWidth=3;cx.lineCap='round';cx.beginPath();cx.moveTo(0,0);cx.lineTo(Math.cos(q.a)*15*d,-Math.sin(q.a)*15);cx.stroke();cx.strokeStyle=X.lt(col,1.4);cx.lineWidth=1.4;cx.stroke();cx.lineCap='butt';cx.restore();
  X.rr(q.x-12,y-6,24,7,3.5,'#2a2a34');for(let k=0;k<5;k++)X.disc(q.x-9+k*4.5,y-2.5,1.8,'#6a6a78');X.block(q.x-10,y-11,20,6,col,2);X.orb(q.x,y-10,5.5,col);if(act){X.glow(q.x,y-8,18,col,.25);const t=A.t*.15;A.c.fillStyle=X.rgba('#ffffff',.6+.4*Math.sin(t));A.text('V',q.x,y-30+Math.sin(t)*2,col,1,'c');}};
 const terrain=()=>{const cx=A.c;cx.beginPath();cx.moveTo(0,H);land.forEach((y,i)=>cx.lineTo(i*4,y));cx.lineTo(W,H);cx.closePath();cx.fillStyle=X.lg(0,110,0,H,['#5a8a3a','#3a5a2a','#2a2a1a']);cx.fill();
  cx.beginPath();land.forEach((y,i)=>i?cx.lineTo(i*4,y):cx.moveTo(0,y));cx.strokeStyle='#8ac850';cx.lineWidth=2;cx.stroke();cx.fillStyle='rgba(0,0,0,.15)';for(let i=0;i<land.length;i+=2)cx.fillRect(i*4,land[i]+6+(i*7)%10,3,2);cx.fillStyle='rgba(255,255,255,.08)';for(let i=1;i<land.length;i+=3)cx.fillRect(i*4,land[i]+14+(i*5)%20,2,1);};
 g.draw=()=>{X.cache('art_bg',bg);terrain();tk.forEach(tank);
  const q=tk[p];if(!sh&&!ex&&!(A.cpu&&p===1)){const d=p?-1:1,v=3+q.pw*6;let x=q.x,y=gy(q.x)-10,vx=Math.cos(q.a)*v*d,vy=-Math.sin(q.a)*v;for(let s=0;s<14;s++){vy+=.12;vx+=wind;x+=vx;y+=vy;if(s%2)X.disc(x,y,1.2,'rgba(255,255,255,'+(.7-s*.04)+')');}}
  trail.forEach((t,i)=>X.disc(t[0],t[1],.6+i*.08,'rgba(255,220,160,'+(i/trail.length*.6)+')'));if(sh){X.glow(sh.x,sh.y,7,'#ffd080',.6);X.orb(sh.x,sh.y,2.6,'#3a3a40');}
  if(ex&&ex.x>0){const f=ex.r/18;X.glow(ex.x,ex.y,ex.r*2,'#ff7020',.7*(1-f*.5));X.disc(ex.x,ex.y,ex.r,X.rgba('#ffb040',.8*(1-f)));X.disc(ex.x,ex.y,ex.r*.55,X.rgba('#fff0b0',1-f));}
  fx.draw();
  const wn=Math.round(wind*100),wl=Math.abs(wind)*700;hudv(sc[0],sc[1]);X.panel(120,20,80,16,'#ffffff');A.text('WIND',160,23,'#cfd8ff',1,'c',1);X.meter(128,31,64,3,.5,'#444',null);if(wn){const cx2=160,dir=wind>0?1:-1;X.stroke([[cx2,32.5],[cx2+dir*wl,32.5]],'#7ad8ff',3);X.poly([[cx2+dir*(wl+4),32.5],[cx2+dir*wl,29.5],[cx2+dir*wl,35.5]],'#7ad8ff');}
  if(!sh&&!ex){const px=p?W-80:8;X.panel(px,20,72,22,p?K.p:K.c);A.text('PWR',px+4,24,'#ffffff',1,'l',1);X.meter(px+24,24,44,5,q.pw,K.y);A.text('ANG '+Math.round(q.a*57.3),px+4,33,'#cfd8ff',1,'l',1);}};
 return g;}});

A.add({id:'joust',name:'SKY JOUST',cat:'VERSUS',vs:1,how:'A FLAPS, LEFT/RIGHT STEER. HIT YOUR RIVAL FROM ABOVE. FIRST TO 5.',make(){
 const g={over:null,score:0},fx=X.fx(),PL=[[40,80,70],[210,80,70],[120,150,80],[0,215,320]];let b,sc=[0,0],wait=40,fl=[0,0];const reset=()=>{b=[{x:70,y:60,vx:0,vy:0,d:1,inv:0},{x:250,y:60,vx:0,vy:0,d:-1,inv:0}];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=b[1],o=b[0];A.bot({a:q.y>o.y-20&&Math.random()<.18+.12*A.ai||q.y>180&&Math.random()<.3,l:q.x>o.x+6,r:q.x<o.x-6});}
  for(let i=0;i<2;i++){const q=b[i],k=A.in(i);if(A.hit(i).a){q.vy=-2.6;S('jump');fl[i]=10;}if(fl[i]>0)fl[i]--;q.vx=cl(q.vx+ax(k)*.15,-2.4,2.4);q.vx*=.99;if(ax(k))q.d=ax(k);q.vy+=.1;q.x+=q.vx;q.y+=q.vy;if(q.x<-10)q.x=W+10;if(q.x>W+10)q.x=-10;if(q.y<34){q.y=34;q.vy=Math.max(0,q.vy);}if(q.inv>0)q.inv--;
   for(const p of PL)if(q.vy>0&&q.y>=p[1]-10&&q.y-q.vy<p[1]-10+1&&q.x>p[0]&&q.x<p[0]+p[2]){q.y=p[1]-10;q.vy=0;q.vx*=.9;}}
  const[a,c2]=b;if(Math.hypot(a.x-c2.x,a.y-c2.y)<16&&!a.inv&&!c2.inv){if(Math.abs(a.y-c2.y)<3){a.vx*=-1;c2.vx*=-1;a.inv=c2.inv=20;S('hit');fx.spark((a.x+c2.x)/2,(a.y+c2.y)/2-8,'#ffffff',10,2.5);A.shake=2;}else{const w=a.y<c2.y?0:1;sc[w]++;S('score');const L2=b[1-w];A.burst(L2.x,L2.y,K.w,16,3);fx.debris(L2.x,L2.y-6,'#ffcf3f',12,2.2);fx.debris(L2.x,L2.y-10,w?K.c:K.p,6,2);fx.ring(L2.x,L2.y-6,w?K.p:K.c,28);fx.pop(L2.x,L2.y-24,'UNSEATED!',w?K.p:K.c);A.shake=6;fx.flash('#ffffff',5);if(sc[w]>=5){g.over=A.win(w);return;}reset();}}};
 const bg=()=>{X.sky(['#0a0620','#2a1240','#5a1a3a'],H);X.stars(70,9,0,0,170,.8);X.disc(260,46,16,'#f0e0c8');X.disc(254,42,15,'#2a1240');X.glow(262,46,40,'#ffe0c0',.15);
  const cx=A.c;[[20,60,26],[300,50,22],[150,40,18]].forEach(pl=>{cx.fillStyle='rgba(20,10,40,.85)';cx.fillRect(pl[0]-pl[2]/2,pl[1]+90,pl[2],H);X.poly([[pl[0]-pl[2]/2,pl[1]+90],[pl[0],pl[1]+60],[pl[0]+pl[2]/2,pl[1]+90]],'rgba(20,10,40,.85)');});X.hills(222,30,'#1a0a28',0,.03,4);};
 const ledge=p=>{const [x,y,w]=p,cx=A.c;X.poly([[x,y+5],[x+w,y+5],[x+w*.8,y+14],[x+w*.6,y+10],[x+w*.45,y+18],[x+w*.3,y+11],[x+w*.12,y+15]],'#3a2a50');X.block(x,y,w,6,'#8d86b8',2);cx.fillStyle='rgba(0,0,0,.2)';for(let i=x+6;i<x+w-4;i+=11)cx.fillRect(i,y+1,1,5);};
 const rider=(q,i)=>{const c=i?K.p:K.c,d=q.d,cx=A.c,fl2=fl[i]>0?Math.sin(fl[i]*.8)*6:(q.vy<0?Math.sin(A.t*.5)*4:Math.sin(A.t*.15)*1.5),blink=q.inv>0&&(A.t>>2)%2;if(blink)cx.globalAlpha=.45;const y=q.y,x=q.x;
  X.shadow(x,y+12,8,2,.25);cx.strokeStyle='#d08a20';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(x-2,y+3);cx.lineTo(x-3-Math.sin(A.t*.3)*2,y+10);cx.moveTo(x+2,y+3);cx.lineTo(x+3+Math.sin(A.t*.3)*2,y+10);cx.stroke();
  X.ell(x,y,9,5,X.lg(0,y-5,0,y+5,['#ffe070','#e0a020']));X.stroke([[x+d*6,y-1],[x+d*9,y-7],[x+d*10,y-9]],'#e0a020',3);X.orb(x+d*11,y-9,2.8,'#ffd040');X.poly([[x+d*13,y-10],[x+d*17,y-9],[x+d*13,y-8]],'#ff8020');X.disc(x+d*11.5,y-10,.8,'#000');
  X.poly([[x-d*8,y-2],[x-d*14,y-5],[x-d*13,y+1]],'#c08010');X.ell(x-d*1,y-2-fl2*.5,7,3+Math.abs(fl2)*.3,'#d89a28',fl2*.08*d);
  X.rr(x-3,y-13,7,9,2,X.lg(0,y-13,0,y-4,[X.lt(c,1.3),c,X.lt(c,.6)]));X.orb(x+.5,y-16,3.6,'#c8ccd8');cx.fillStyle='#1a1a2a';cx.fillRect(x+d*1-1+(d>0?0:-1),y-17,3,1.4);X.poly([[x-1,y-20],[x+1,y-24],[x+2,y-19]],c);
  X.stroke([[x+d*1,y-9],[x+d*16,y-12]],'#f4f0e6',2);X.poly([[x+d*16,y-13.5],[x+d*20,y-12],[x+d*16,y-10.5]],'#c8ccd8');cx.globalAlpha=1;};
 g.draw=()=>{X.cache('joust_bg',bg);const t=A.t,cx=A.c;X.vg(0,222,W,18,['#ff7a20','#c43a1a','#801a10']);X.glow(160,232,180,'#ff5a10',.25);for(let i=0;i<8;i++){const bx=(i*47+t*.3)%W,by=226+Math.sin(t*.07+i)*3;X.disc(bx,by,1.5+Math.sin(t*.1+i),'#ffd060');}
  PL.slice(0,3).forEach(ledge);X.block(0,215,W,7,'#6a6290',1);cx.fillStyle='rgba(0,0,0,.2)';for(let i=6;i<W;i+=14)cx.fillRect(i,216,1,6);
  b.forEach(rider);fx.draw();hudv(sc[0],sc[1],'FIRST TO 5');if(wait>20)X.ot('JOUST!',160,100,K.y,3,'c');};
 return g;}});

A.add({id:'snowball',name:'SNOWBALL FIGHT',cat:'VERSUS',vs:1,how:'MOVE BEHIND FORTS. HOLD A TO PACK, RELEASE TO THROW. 5 HITS WINS.',make(){
 const g={over:null,score:0},fx=X.fx(),FORT=[[90,70],[90,170],[230,70],[230,170],[160,120]];let p,balls=[],sc=[0,0],wait=40,hitT=[0,0];const reset=()=>{p=[{x:40,y:120,pack:0},{x:280,y:120,pack:0}];balls=[];wait=40;};reset();
 const blk=(x,y)=>FORT.some(f=>Math.abs(x-f[0])<14&&Math.abs(y-f[1])<8);
 g.update=()=>{for(let i=0;i<2;i++)if(hitT[i]>0)hitT[i]--;if(wait>0){wait--;return;}if(A.cpu){const q=p[1],o=p[0],inc=balls.find(b=>b.o===0&&b.vx>0&&Math.abs(b.y-q.y)<16);const lane=Math.abs(o.y-120)<22?(A.t%400<200?95:145):o.y,ty=inc?(q.y<120?q.y-30:q.y+30):lane;A.bot({u:q.y>ty+3,d:q.y<ty-3,l:q.x>270,r:q.x<250,a:q.pack<(.5+A.ai*.4)&&!inc});}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),nx=cl(q.x+ax(k)*2,i?180:14,i?W-14:140),ny=cl(q.y+ay(k)*2,30,H-14);q.mv=(nx!==q.x||ny!==q.y);if(!blk(nx,q.y))q.x=nx;if(!blk(q.x,ny))q.y=ny;if(k.a)q.pack=Math.min(1,q.pack+.02);else if(q.pack>.15){const o=p[1-i],dx=o.x-q.x,dy=o.y-q.y,d=Math.hypot(dx,dy)||1,v=2.5+q.pack*3.5;balls.push({x:q.x,y:q.y,vx:dx/d*v,vy:dy/d*v,o:i,life:40+q.pack*60,s:2.5+q.pack*1.5});q.pack=0;q.th=10;S('shoot');}else q.pack=0;if(q.th>0)q.th--;}
  for(const b of balls){b.x+=b.vx;b.y+=b.vy;b.life--;if(blk(b.x,b.y)){b.life=0;A.burst(b.x,b.y,K.w,6);fx.debris(b.x,b.y,'#ffffff',6,1.6);}const o=p[1-b.o];if(b.life>0&&Math.hypot(b.x-o.x,b.y-o.y)<9){b.life=0;sc[b.o]++;S('boom');A.burst(o.x,o.y,K.w,14,2.5);fx.debris(o.x,o.y-8,'#ffffff',14,2.4);fx.ring(o.x,o.y-8,'#bfe0ff',20);fx.pop(o.x,o.y-34,'SPLAT!','#ffffff');A.shake=4;hitT[1-b.o]=40;if(sc[b.o]>=5){g.over=A.win(b.o);return;}reset();return;}}balls=balls.filter(b=>b.life>0&&b.x>0&&b.x<W);};
 const bg=()=>{X.vg(0,0,W,H,['#dfe9f8','#f4f8ff','#e2ecf8']);const cx=A.c;for(let i=0;i<160;i++){cx.fillStyle=i%2?'rgba(160,190,230,.25)':'rgba(255,255,255,.9)';X.ell((i*83)%W,(i*47)%H,4+(i%5),1.2,cx.fillStyle);}
  [[8,30],[10,90],[6,160],[12,215],[312,40],[308,110],[314,180],[306,226]].forEach(t=>{const[x,y]=t;X.shadow(x+4,y+2,9,3,.18);X.rr(x-1.5,y-4,3,6,1,'#6a4a30');for(let k=0;k<3;k++){X.poly([[x-10+k*2,y-4-k*7],[x,y-16-k*7],[x+10-k*2,y-4-k*7]],k%2?'#2a6a4a':'#1f5a3e');X.poly([[x-7+k*2,y-6-k*7],[x,y-16-k*7],[x+3,y-10-k*7]],'rgba(255,255,255,.8)');}});
  cx.fillStyle='rgba(120,160,220,.25)';for(let y=24;y<H;y+=6)cx.fillRect(159,y,2,3);};
 const fort=f=>{const[x,y]=f;X.shadow(x+2,y+9,16,3,.2);for(let r=0;r<2;r++)for(let k=0;k<3-r%2;k++){const bx=x-14+k*10+(r%2)*5,by=y-8+r*8;X.rr(bx,by,9.5,8,2.5,X.lg(0,by,0,by+8,['#ffffff','#e4eefa','#b8cce6']));}X.ell(x,y-8,14,2.5,'#ffffff');};
 g.draw=()=>{X.cache('snow_bg',bg);const cx=A.c;const ents=[];FORT.forEach(f=>ents.push({y:f[1]+8,d:()=>fort(f)}));
  p.forEach((q,i)=>ents.push({y:q.y+8,d:()=>{const col=i?K.p:K.c,d=i?-1:1,hit=hitT[i]>0,wob=hit?Math.sin(A.t*.8)*.3:0,arm=q.pack>0?-2.6:q.th>0?(-1.4):0;if(hit)cx.globalAlpha=.6+.4*((A.t>>2)%2);
   cx.save();cx.translate(q.x,q.y+8);cx.rotate(wob);A.person(0,0,{s:.8,c:col,pants:'#2a3a5a',cap:X.lt(col,.6),st:q.mv?A.t*.3:0,d,arm1:d>0?.3:arm*-1,arm2:d>0?arm:-.3});cx.restore();cx.globalAlpha=1;
   if(q.pack>0){const r=2+q.pack*3,hx=q.x+d*(4+r),hy=q.y-20;X.orb(hx,hy,r,'#ffffff');X.meter(q.x-10,q.y+11,20,3,q.pack,col);}if(hit){for(let k=0;k<3;k++){const a=A.t*.2+k*2.1;X.disc(q.x+Math.cos(a)*7,q.y-22+Math.sin(a)*2,1.3,K.y);}}}}));
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
  balls.forEach(b=>{const lift=Math.sin(Math.min(1,(100-b.life)/40)*3.14)*0+6;X.shadow(b.x,b.y+4,b.s,b.s*.35,.2);X.orb(b.x,b.y-lift,b.s,'#ffffff');});
  fx.draw();for(let i=0;i<30;i++){const x=(i*61+A.t*(.3+i%3*.2))%W,y=(i*37+A.t*(.6+i%4*.15))%H;X.disc(x,y,.8+i%3*.4,'rgba(255,255,255,.85)');}
  hudv(sc[0],sc[1],'5 HITS WINS');if(wait>20)X.ot('READY... THROW!',160,110,'#2a5aa0',2,'c');};
 return g;}});

A.add({id:'filler',name:'HEX FILLER',cat:'BOARD',vs:1,how:'LEFT/RIGHT PICK A COLOUR, A TAKES IT. GROW FROM YOUR CORNER. MOST CELLS WINS.',make(){
 const g={over:null,score:0},NX=14,NY=10,CO=[K.r,K.y,K.g,K.b,K.p,K.o],fx=X.fx();let b=[],own=[],p=0,sel=0,think=0,ft=[];for(let i=0;i<NX*NY;i++){b.push(ri(6));own.push(-1);ft.push(-99);}own[(NY-1)*NX]=0;own[NX-1]=1;if(b[(NY-1)*NX]===b[NX-1])b[NX-1]=(b[NX-1]+1)%6;
 const grow=(pl,col,dry)=>{const o=own.slice(),bb=b.slice();o.forEach((v,i)=>{if(v===pl)bb[i]=col;});let ch=true;while(ch){ch=false;for(let i=0;i<NX*NY;i++){if(o[i]!==-1||bb[i]!==col)continue;const x=i%NX,y=(i/NX)|0;if([[1,0],[-1,0],[0,1],[0,-1]].some(d=>{const nx=x+d[0],ny=y+d[1];return nx>=0&&ny>=0&&nx<NX&&ny<NY&&o[ny*NX+nx]===pl;})){o[i]=pl;ch=true;}}}if(!dry){own=o;b=bb;}return o.filter(v=>v===pl).length;};
 const cur=pl=>b[own.indexOf(pl)];const ok=c=>c!==cur(0)&&c!==cur(1);
 const pos=i=>[20+(i%NX)*20+((i/NX|0)%2)*10,28+((i/NX)|0)*16.5];
 const play=c=>{const prev=own.slice();grow(p,c,false);let n0=0;own.forEach((v,i)=>{if(v!==prev[i]){ft[i]=A.t+n0*.6;n0++;}});if(n0){const last=own.findIndex((v,i)=>v!==prev[i]);const[x,y]=pos(last);fx.pop(x,y-10,'+'+n0,CO[c]);}S('coin');const n=[0,1].map(i=>own.filter(v=>v===i).length);if(own.every(v=>v!==-1)||n[0]>NX*NY/2||n[1]>NX*NY/2){g.over=n[0]===n[1]?'DRAW!':A.win(n[0]>n[1]?0:1);return;}p=1-p;think=0;};
 g.update=()=>{if(A.cpu&&p===1){if(++think>30){let best=-1,bc=0;for(let c=0;c<6;c++){if(!ok(c))continue;const v=grow(1,c,true)+rnd(A.lvl===0?8:A.lvl===1?2:0);if(v>best){best=v;bc=c;}}play(bc);}return;}
  const h=A.hit(human(p));if(h.l||h.r){do{sel=(sel+(h.r?1:5))%6;}while(!ok(sel));S('blip');}if(!ok(sel)){for(let c=0;c<6;c++)if(ok(c)){sel=c;break;}}if(h.a)play(sel);};
 const hex=(x,y,r)=>{const pts=[];for(let k=0;k<6;k++){const a=k*1.0472+.5236;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}return pts;};
 const bg=()=>{X.vg(0,0,W,H,['#1a1040','#0d0926','#06041a']);const cx=A.c;cx.strokeStyle='rgba(255,255,255,.04)';for(let y=0;y<H;y+=18)for(let x=0;x<W;x+=21)X.polys(hex(x+((y/18)%2)*10.5,y,10),'rgba(255,255,255,.035)',1);X.vignette(.5);};
 g.draw=()=>{X.cache('filler_bg',bg);const cx=A.c;
  for(let i=0;i<NX*NY;i++){const[x,y]=pos(i),o=own[i],col=CO[b[i]],dt=A.t-ft[i],pop=dt>=0&&dt<14?1-dt/14:0,r=10.6+pop*2;X.poly(hex(x,y+1.2,r),'rgba(0,0,0,.4)');X.poly(hex(x,y,r),X.lg(0,y-r,0,y+r,[X.lt(col,o>=0?1.5:1.15),o>=0?col:X.lt(col,.72),X.lt(col,o>=0?.6:.45)]));
   if(o>=0){X.polys(hex(x,y,r-1.2),o?'#ffd0e8':'#c0fff4',1.4);X.disc(x,y,2,'rgba(255,255,255,.55)');}else X.poly([[x-5,y-6],[x+5,y-6],[x+2,y-3],[x-3,y-3]],'rgba(255,255,255,.18)');if(pop>0)X.poly(hex(x,y,r),'rgba(255,255,255,'+(pop*.7)+')');}
  [[(NY-1)*NX,0],[NX-1,1]].forEach(([i,pl])=>{const[x,y]=pos(i);X.glow(x,y,16,pl?K.p:K.c,.35+.15*Math.sin(A.t*.1));});
  const human2=!(A.cpu&&p===1),acc=p?K.p:K.c;X.panel(56,194,208,28,acc);CO.forEach((c,i)=>{const x=64+i*33,y=199,on=ok(i),s=i===sel&&human2,bob=s?Math.sin(A.t*.2)*1.5:0;if(on){X.block(x,y-bob,26,18,c,4);}else{X.rr(x,y,26,18,4,'#2a2638');A.line(x+8,y+5,x+18,y+13,'#555',2);A.line(x+18,y+5,x+8,y+13,'#555',2);}if(s){X.rrs(x-2,y-2-bob,30,22,5,'#ffffff',2);X.poly([[x+13,y+24],[x+9,y+29],[x+17,y+29]],'#ffffff');}});
  const n=[0,1].map(i=>own.filter(v=>v===i).length);hudv(n[0],n[1],A.nm(p)+(A.cpu&&p===1?' THINKS...':' PICKS'));const fr=n[0]/(NX*NY),fr2=n[1]/(NX*NY);X.rr(60,227,200,5,2.5,'rgba(0,0,0,.5)');X.rr(60,227,200*fr,5,2.5,K.c);X.rr(260-200*fr2,227,200*fr2,5,2.5,K.p);A.line(160,225,160,234,'#ffffff',1);fx.draw();};
 return g;}});

A.add({id:'armwrestle',name:'ARM WRESTLE',cat:'VERSUS',vs:1,how:'TAP A AS FAST AS YOU CAN. PIN YOUR RIVAL\'S HAND. BEST OF 3.',make(){
 const g={over:null,score:0},fx=X.fx();let pos=0,sc=[0,0],t=-80,pw=[0,0],tap=[0,0];
 g.update=()=>{t++;for(let i=0;i<2;i++)if(tap[i]>0)tap[i]--;if(t<0)return;for(let i=0;i<2;i++){if(A.cpu&&i===1){pw[1]+=(.08+.1*A.ai)*(Math.random()<.9?1:0);if(A.t%7===0)tap[1]=4;}else if(A.hit(i).a){pw[i]+=1.1;tap[i]=4;}pw[i]*=.9;}pos+=(pw[1]-pw[0])*.03;pos*=.998;
  if(Math.abs(pos)>1){const w=pos<0?0:1;sc[w]++;S('score');const hx=w?100:220;fx.spark(hx,150,'#ffffff',18,3);fx.ring(hx,150,w?K.p:K.c,30);fx.pop(160,80,A.nm(w)+' PINS!',w?K.p:K.c);fx.flash('#ffffff',6);A.shake=7;pos=0;pw=[0,0];t=-60;if(sc[w]>=2)g.over=A.win(w);}};
 const bg=()=>{X.vg(0,0,W,H,['#2a1a10','#4a2e1a','#2a1a0c']);X.wood(0,0,W,120,'#4a2e1a',true);const cx=A.c;cx.fillStyle='rgba(0,0,0,.25)';cx.fillRect(0,116,W,4);
  [[30,40],[250,40]].forEach(([x,y])=>{X.rr(x,y+18,44,4,1,'#6a4228');for(let k=0;k<4;k++){const bc=['#3a8a4a','#8a3a2a','#c8a040','#3a5a9a'][k];X.rr(x+3+k*10,y+(k%2?4:0),7,18-(k%2?4:0),2,X.lg(x+3+k*10,0,x+10+k*10,0,[X.lt(bc,1.4),bc,X.lt(bc,.5)]));cx.fillStyle='rgba(255,255,255,.3)';cx.fillRect(x+4+k*10,y+4+(k%2?4:0),1,10);}});
  X.glow(160,10,110,'#ffc070',.35);X.poly([[150,0],[170,0],[176,14],[144,14]],'#3a2a1a');X.disc(160,15,4,'#fff0c0');X.poly([[144,14],[176,14],[230,120],[90,120]],'rgba(255,220,150,.05)');
  X.ot('ARM WRESTLING',160,24,'#ffcf3f',1,'c');X.vg(20,150,280,90,['#8a5c33','#6a4220','#3a2410']);X.wood(20,150,280,8,'#9a6a3c');cx.fillStyle='rgba(255,255,255,.12)';cx.fillRect(20,150,280,1);X.vignette(.55);};
 const wrestler=(i,hx,hy)=>{const d=i?-1:1,col=i?K.p:K.c,cx=A.c,bx=i?240:80,strain=Math.min(1,pw[i]*.25),skin=i?'#c88a5a':'#f0c090',ex=160-d*12,ey=152;
  X.rr(bx-30,96,60,64,18,X.lg(bx-30,0,bx+30,0,[X.lt(col,1.25),col,X.lt(col,.55)]));cx.fillStyle='rgba(0,0,0,.15)';cx.fillRect(bx-2,104,4,40);
  X.stroke([[bx+d*20,108],[ex-d*10,ey-4],[ex,ey]],col,13);X.stroke([[ex,ey],[hx,hy]],skin,10);X.stroke([[ex,ey],[hx,hy]],X.lt(skin,1.15),4);
  X.stroke([[bx-d*22,110],[bx-d*34,146]],col,11);X.orb(bx-d*34,150,6,skin);
  const sh=tap[i]>0?(Math.random()-.5)*2:0,hy2=74+sh;X.rr(bx-7,82,14,14,3,skin);X.orb(bx+sh,hy2,17,skin,0);cx.fillStyle=i?'#2a1a10':'#6a3a1a';X.ell(bx+sh,hy2-12,16,8,cx.fillStyle);
  if(strain>.2)X.ell(bx+sh,hy2+4,12,7,'rgba(255,40,40,'+(strain*.35)+')');const eyx=bx+sh+d*4;X.disc(eyx-4,hy2-2,2.4,'#ffffff');X.disc(eyx+5,hy2-2,2.4,'#ffffff');X.disc(eyx-4+d*1,hy2-2,1.2,'#1a1a1a');X.disc(eyx+5+d*1,hy2-2,1.2,'#1a1a1a');
  A.line(eyx-7,hy2-6-strain*2,eyx-1,hy2-5,'#2a1a10',1.5);A.line(eyx+2,hy2-5,eyx+8,hy2-6-strain*2,'#2a1a10',1.5);if(strain>.3){X.rr(eyx-5,hy2+6,10,4,1.5,'#ffffff');A.line(eyx-5,hy2+8,eyx+5,hy2+8,'#888',.6);}else X.rr(eyx-3,hy2+7,7,1.6,1,'#8a3a2a');
  if(strain>.5&&(A.t>>3)%3===i){X.disc(bx-d*12,hy2-8+(A.t%24)*.5,1.6,'#9fd8ff');}X.ot(A.nm(i),bx,170,col,1,'c');};
 g.draw=()=>{X.cache('arm_bg',bg);const a=-pos*1.2-1.5708,hx=160+Math.cos(a)*50,hy=150+Math.sin(a)*50;
  X.rr(84,146,30,8,3,'#ff4f6d');X.rr(206,146,30,8,3,K.c);X.ell(160,154,10,3,'rgba(0,0,0,.4)');
  wrestler(0,hx,hy);wrestler(1,hx,hy);X.orb(hx,hy,10,'#e0a878',0);A.line(hx-5,hy-4,hx+5,hy-4,'rgba(80,40,20,.5)',1);A.line(hx-6,hy,hx+6,hy,'rgba(80,40,20,.5)',1);if(tap[0]||tap[1])X.glow(hx,hy,16,'#ffffff',.25);
  hudv(sc[0],sc[1],'BEST OF 3');X.panel(58,34,204,14,'#ffffff');X.rr(62,38,196,6,3,'rgba(0,0,0,.6)');const f=cl(-pos,-1,1);if(f>0)X.rr(160,38,96*f,6,3,X.lg(160,0,256,0,[K.c,X.lt(K.c,1.5)]));else if(f<0)X.rr(160+96*f,38,-96*f,6,3,X.lg(64,0,160,0,[X.lt(K.p,1.5),K.p]));A.line(160,36,160,46,'#ffffff',1.5);
  for(let i=0;i<2;i++){const x=i?W-14:8,hgt=Math.min(1,pw[i]*.25)*40;X.rr(x,100,6,42,3,'rgba(0,0,0,.5)');if(hgt>0)X.rr(x+1,141-hgt,4,hgt,2,i?K.p:K.c);}
  if(t<0){X.ot(t<-20?'READY...':'GRIP!',160,60,K.y,2,'c');}else{const pul=1+(A.t>>3)%2;X.ot('TAP A!',160,60,pul>1?K.y:'#ffffff',2,'c');}fx.draw();};
 return g;}});

A.add({id:'rps',name:'RPS SHOWDOWN',cat:'VERSUS',vs:1,how:'LEFT ROCK, UP PAPER, RIGHT SCISSORS. THE CPU LEARNS YOUR HABITS. FIRST TO 5.',make(){
 const g={over:null,score:0},NM=['ROCK','PAPER','SCISSORS'],fx=X.fx();let pick=[-1,-1],sc=[0,0],hist=[],mt=0,msg='',last=null,lw=-1;
 const beats=(a,b)=>(a-b+3)%3===1;
 g.update=()=>{if(mt>0){mt--;if(mt===0){pick=[-1,-1];if(sc[0]>=5||sc[1]>=5)g.over=A.win(sc[0]>=5?0:1);}return;}
  for(let i=0;i<2;i++){if(pick[i]>=0)continue;if(A.cpu&&i===1){if(pick[0]>=0){let pred=ri(3);if(hist.length>=2&&Math.random()<.35+A.ai*.4){const c=[0,0,0];for(let k=1;k<hist.length;k++)if(hist[k-1]===hist[hist.length-1])c[hist[k]]++;pred=c.indexOf(Math.max(...c));}pick[1]=(pred+1)%3;}continue;}const h=A.hit(i);const v=h.l?0:h.u?1:h.r?2:-1;if(v>=0){pick[i]=v;S('blip');}}
  if(pick[0]>=0&&pick[1]>=0){hist.push(pick[0]);const w=pick[0]===pick[1]?-1:beats(pick[0],pick[1])?0:1;lw=w;if(w>=0){sc[w]++;fx.spark(w?230:90,120,w?K.p:K.c,20,3);fx.ring(w?230:90,120,w?K.p:K.c,36);A.shake=4;}else fx.ring(160,120,'#ffffff',30);msg=w<0?'DRAW':A.nm(w)+' WINS';last=pick.slice();mt=70;S(w===0?'score':w===1?'lose':'blip');}};
 /* hand: v 0 rock 1 paper 2 scissors -1 fist(bobbing); d direction; sleeve colour */
 const hand=(x,y,v,d,sl,sc2)=>{const cx=A.c,sk='#f0c090',sk2='#c89060';cx.save();cx.translate(x,y);cx.scale(d*(sc2||1),sc2||1);
  X.rr(-90,-10,70,20,4,X.lg(0,-10,0,10,[X.lt(sl,1.3),sl,X.lt(sl,.55)]));X.rr(-24,-11,6,22,2,X.lt(sl,1.5));X.rr(-19,-8,8,16,3,sk);
  if(v===1){X.rr(-12,-12,16,24,5,X.lg(0,-12,0,12,[sk,sk2]));for(let k=0;k<4;k++)X.rr(2,-11+k*5.6,16-Math.abs(k-1.5)*2,4.6,2.3,X.lg(0,0,20,0,[sk,X.lt(sk,1.05)]));X.rr(-6,-17,10,5,2.5,sk);}
  else if(v===2){X.rr(-12,-10,18,21,7,X.lg(0,-10,0,11,[sk,sk2]));cx.save();cx.rotate(-.3);X.rr(0,-9,26,5,2.5,sk);cx.restore();cx.save();cx.rotate(.3);X.rr(0,3,26,5,2.5,sk);cx.restore();for(let k=0;k<2;k++)A.line(2,1+k*4,6,1+k*4,sk2,1);X.rr(-6,-15,8,5,2.5,sk);}
  else{X.rr(-12,-11,22,22,8,X.lg(0,-11,0,11,[X.lt(sk,1.08),sk,sk2]));for(let k=0;k<3;k++)A.line(4,-5+k*5,9,-5+k*5,'rgba(120,60,30,.5)',1);X.rr(-6,-15,10,5,2.5,sk);}
  cx.restore();};
 const bg=()=>{X.vg(0,0,W,H,['#1a0f3a','#120a28','#05030f']);X.vg(0,170,W,70,['#2a1a4a','#0a061a']);const cx=A.c;cx.fillStyle='rgba(255,255,255,.05)';for(let i=0;i<W;i+=20)cx.fillRect(i,170,1,70);
  [[90,K.c],[230,K.p]].forEach(([x,c])=>{X.poly([[x-8,0],[x+8,0],[x+50,190],[x-50,190]],X.lg(0,0,0,190,[X.rgba(c,.25),X.rgba(c,.02)]));X.ell(x,186,50,9,X.rgba(c,.18));});X.vignette(.5);};
 g.draw=()=>{X.cache('rps_bg',bg);
  if(mt&&last){const pr=Math.min(1,(70-mt)/8),wob=Math.sin(A.t*.5)*(1-pr)*3;for(let i=0;i<2;i++){const win=lw===i,lose=lw===1-i,s=win?1.15+.05*Math.sin(A.t*.2):lose?.9:1;if(win)X.glow(i?230:90,120,40,i?K.p:K.c,.3);hand(i?250:70,120+wob,last[i],i?-1:1,i?K.p:K.c,s);X.ot(NM[last[i]],i?230:90,152,i?K.p:K.c,1,'c');}
   X.ot(msg,160,186,lw<0?'#ffffff':K.y,2,'c');if(lw>=0)A.text(NM[last[lw]]+' BEATS '+NM[last[1-lw]],160,206,'#cfc8ff',1,'c',1);}
  else{const ph=Math.abs(Math.sin(A.t*.15)),b=ph*12;for(let i=0;i<2;i++){const rd=pick[i]>=0;hand(i?250:70,114-b*(rd?.3:1),-1,i?-1:1,i?K.p:K.c);X.panel(i?190:30,150,100,16,rd?K.g:(i?K.p:K.c));X.ot(rd?'LOCKED IN':(i&&A.cpu?'THINKING...':'CHOOSE'),i?240:80,154,rd?K.g:'#ffffff',1,'c');}
   X.ot(['ROCK...','PAPER...','SCISSORS...'][(A.t>>5)%3],160,82,K.y,1,'c');X.panel(36,194,248,22,'#ffffff');[['< ROCK',76],['^ PAPER',160],['SCISSORS >',244]].forEach(([s,x])=>A.text(s,x,201,'#e8e0ff',1,'c',1));}
  for(let i=0;i<2;i++)for(let k=0;k<5;k++){const x=i?W-14-k*9:14+k*9;X.disc(x,26,3.2,'rgba(0,0,0,.5)');if(k<sc[i])X.orb(x,26,3,i?K.p:K.c);}
  hudv(sc[0],sc[1],'FIRST TO 5');fx.draw();};
 return g;}});

A.add({id:'pig',name:'PIG DICE',cat:'BOARD',vs:1,how:'A ROLLS, B BANKS. ROLL A 1 AND YOU LOSE THE TURN\'S POINTS. FIRST TO 50.',make(){
 const g={over:null,score:0},fx=X.fx();let sc=[0,0],turn=0,p=0,dv=1,roll=0,think=0,msg='',bust=0;
 const doRoll=()=>{roll=12;S('blip');};const bank=()=>{const sx=p?250:70;fx.pop(sx,60,'+'+turn,K.y);fx.spark(sx,70,K.y,12,2);sc[p]+=turn;turn=0;S('coin');msg=A.nm(p)+' BANKS';if(sc[p]>=50){g.over=A.win(p);return;}p=1-p;think=0;};
 g.update=()=>{if(bust>0)bust--;if(roll>0){dv=1+ri(6);if(--roll===0){if(dv===1){turn=0;msg=A.nm(p)+' ROLLED 1!';S('lose');bust=30;A.shake=5;fx.flash('#ff2040',6);fx.spark(160,110,'#ff4f6d',16,2.5);p=1-p;think=0;}else{turn+=dv;msg='';fx.ring(160,110,K.y,26);fx.pop(160,80,'+'+dv,K.y);}}return;}
  if(A.cpu&&p===1){if(++think<30)return;think=0;const target=[12,20,20][A.lvl],need=50-sc[1];if(turn>=Math.min(target,need)||(A.lvl===2&&sc[0]>=40&&turn<need&&false))bank();else doRoll();return;}
  const h=A.hit(human(p));if(h.a)doRoll();else if(h.b&&turn>0)bank();};
 g.draw=()=>{felt('pig_bg','#1a7a3a','#0a3a1a');const cx=A.c;X.ell(160,112,96,62,'rgba(0,0,0,.18)');A.c.strokeStyle='rgba(255,230,150,.35)';A.c.lineWidth=2;A.c.beginPath();if(A.c.ellipse)A.c.ellipse(160,110,92,58,0,0,6.283);A.c.stroke();X.ot('PIG',160,64,'rgba(255,230,150,.5)',1,'c');
  const rl=roll>0,jx=rl?Math.sin(A.t*1.3)*14:0,jy=rl?-Math.abs(Math.sin(A.t*.9))*16:0;X.shadow(160+jx,132,16-(-jy)*.3,4,.4);dieP(144+jx,92+jy,dv,'#f4f0e6',32,rl?A.t*.5:0);
  const chips=Math.min(12,Math.ceil(turn/2));for(let k=0;k<chips;k++){X.ell(206,150-k*3,9,3.5,'rgba(0,0,0,.3)');X.ell(206,148-k*3,9,3.5,k%2?'#ffcf3f':'#ff4f6d');X.ell(206,147.5-k*3,6,2,'rgba(255,255,255,.3)');}
  X.panel(104,140,80,22,K.y);X.ot('POT +'+turn,144,147,bust?'#ff4f6d':K.y,1,'c');
  [0,1].forEach(i=>{const x=i?W-118:10,act=p===i;X.panel(x,22,108,26,act?(i?K.p:K.c):null);A.text(A.nm(i)+' '+sc[i]+'/50',x+6,26,i?K.p:K.c,1,'l',1);X.meter(x+6,36,96,7,sc[i]/50,i?K.p:K.c);if(act)X.glow(x+54,35,40,i?K.p:K.c,.15);});
  hudv(sc[0],sc[1],'FIRST TO 50');const m=msg||(A.nm(p)+(A.cpu&&p===1?' THINKS...':'   A ROLL   B BANK'));X.panel(40,196,240,20,bust?'#ff4f6d':'#ffffff');X.ot(m,160,202,bust?'#ff8a9a':'#ffffff',1,'c');fx.draw();};
 return g;}});

A.add({id:'dicepoker',name:'DICE POKER',cat:'BOARD',vs:1,how:'ROLL 5 DICE. A HOLDS A DIE, B REROLLS (ONCE). BEST HAND WINS THE ROUND. FIRST TO 3.',make(){
 const g={over:null,score:0},RN=['NOTHING','PAIR','TWO PAIR','THREE','STRAIGHT','FULL HOUSE','FOUR','FIVE'],fx=X.fx();let d=[[],[]],hold=[0,0,0,0,0],p=0,c=0,ph=0,sc=[0,0],mt=0,msg='',think=0,rt=[[0,0,0,0,0],[0,0,0,0,0]];
 const rollAll=i=>{d[i]=d[i].length?d[i].map((v,k)=>hold[k]?v:1+ri(6)):[1,2,3,4,5].map(()=>1+ri(6));rt[i]=rt[i].map((v,k)=>hold[k]&&d[i].length?0:12+k*3);};
 const rank=a=>{const cnt={};a.forEach(v=>cnt[v]=(cnt[v]||0)+1);const v=Object.values(cnt).sort((x,y)=>y-x),s=a.slice().sort().join('');const r=v[0]===5?7:v[0]===4?6:v[0]===3&&v[1]===2?5:(s==='12345'||s==='23456')?4:v[0]===3?3:v[0]===2&&v[1]===2?2:v[0]===2?1:0;return r*100+a.reduce((x,y)=>x+y,0);};
 const start=()=>{d=[[],[]];hold=[0,0,0,0,0];p=0;ph=0;rollAll(0);};start();
 const endTurn=()=>{if(p===0){p=1;hold=[0,0,0,0,0];rollAll(1);ph=0;think=0;}else{const a=rank(d[0]),b=rank(d[1]);const w=a===b?-1:a>b?0:1;if(w>=0){sc[w]++;fx.spark(160,w?62:162,w?K.p:K.c,18,3);fx.flash(w?K.p:K.c,5);}msg=w<0?'TIE':A.nm(w)+' TAKES IT';mt=100;S(w===0?'score':'lose');}};
 g.update=()=>{rt.forEach(r=>r.forEach((v,k)=>{if(v>0)r[k]--;}));if(mt>0){if(--mt===0){if(sc[0]>=3||sc[1]>=3)g.over=A.win(sc[0]>=3?0:1);else start();}return;}
  if(A.cpu&&p===1){if(++think<40)return;think=0;if(ph===0){const cnt={};d[1].forEach(v=>cnt[v]=(cnt[v]||0)+1);const best=+Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||b-a)[0];hold=d[1].map(v=>v===best&&cnt[best]>1?1:0);if(A.lvl===0)hold=hold.map(()=>Math.random()<.3?1:0);rollAll(1);ph=1;S('blip');}else endTurn();return;}
  const h=A.hit(human(p));if(h.l)c=(c+4)%5;if(h.r)c=(c+1)%5;if(h.a){hold[c]^=1;S('blip');}if(h.b){if(ph===0){rollAll(p);ph=1;S('blip');}else endTurn();}};
 g.draw=()=>{felt('dpk_bg','#1a6a4a','#08301e');[0,1].forEach(i=>{const y=i?44:144,act=i===p&&!mt,col=i?K.p:K.c;X.panel(10,y-14,300,58,act?col:null);X.ot(A.nm(i),18,y-10,col,1,'l');
   if(d[i].length){d[i].forEach((v,k)=>{const r=rt[i][k],held=i===p&&hold[k]&&!mt,x=58+k*38,yy=y+(held?-5:0)+(r>0?-Math.abs(Math.sin(r*.6))*6:0),fv=r>0?1+((r*7+k)%6):v;X.shadow(x+13,y+29,12,3,.35);dieP(x,yy,fv,held?'#fff0b0':'#f4f0e6',26,r>0?r*.4:0);if(held){X.rrs(x-1.5,yy-1.5,29,29,6,K.y,1.5);A.text('HELD',x+13,y+33,K.y,1,'c',1);}
     if(i===p&&k===c&&!(A.cpu&&p===1)&&!mt){const bb=Math.sin(A.t*.25)*2;X.poly([[x+13,y-7+bb],[x+8,y-13+bb],[x+18,y-13+bb]],'#ffffff');}});
    const rk=(rank(d[i])/100)|0;X.rr(250,y+2,56,16,8,rk>=4?X.lg(0,y,0,y+16,['#ffe080','#d09020']):rk>=1?'rgba(255,255,255,.18)':'rgba(0,0,0,.3)');A.text(RN[rk],278,y+7,rk>=4?'#3a2000':'#ffffff',1,'c',1);}
   for(let k=0;k<3;k++)X.disc(298-k*9,y-8,3,k<sc[i]?col:'rgba(0,0,0,.4)');});
  hudv(sc[0],sc[1],'FIRST TO 3');X.panel(30,208,260,18,mt?K.y:'#ffffff');X.ot(mt?msg:A.nm(p)+(A.cpu&&p===1?' THINKS...':ph===0?'   A HOLD   B REROLL':'   B STAND'),160,213,K.y,1,'c');fx.draw();};
 return g;}});
})();
