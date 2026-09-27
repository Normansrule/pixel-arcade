(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

A.add({id:'stack3d',name:'STACK 3D',cat:'RETRO 3D',hd:1,how:'A DROPS THE SLIDING BLOCK. OVERHANG IS CUT. PERFECT DROPS GROW IT BACK.',make(){
 const g={over:null,score:0};let tower=[{x:0,z:0,w:3,d:3,y:0}],cur,axis=0,t=0,camY=2,perf=0,falls=[];const COL=i=>A.mix('#2fe8d0','#ff3f8e',(i%20)/20);
 const spawn=()=>{const top=tower[tower.length-1];axis=tower.length%2;cur={x:axis?top.x:-5,z:axis?-5:top.z,w:top.w,d:top.d,y:top.y+.5,dir:1};};spawn();
 g.update=()=>{t++;const sp=.06+tower.length*.002;if(axis){cur.z+=cur.dir*sp;if(Math.abs(cur.z)>5)cur.dir*=-1;}else{cur.x+=cur.dir*sp;if(Math.abs(cur.x)>5)cur.dir*=-1;}
  if(A.hit(0).a){const top=tower[tower.length-1];const off=axis?cur.z-top.z:cur.x-top.x,size=axis?top.d:top.w,ov=size-Math.abs(off);if(ov<=0){g.over='TOPPLED AT '+g.score;S('lose');falls.push({...cur,vy:0});return;}
   let nb;if(Math.abs(off)<.12){perf++;nb={...top,y:cur.y};if(perf>=3){if(axis)nb.d=Math.min(3,nb.d+.2);else nb.w=Math.min(3,nb.w+.2);}S('coin');}else{perf=0;if(axis){nb={x:top.x,z:top.z+off/2,w:top.w,d:ov,y:cur.y};falls.push({x:top.x,z:top.z+off/2+Math.sign(off)*(ov/2+Math.abs(off)/2),w:top.w,d:Math.abs(off),y:cur.y,vy:0});}else{nb={x:top.x+off/2,z:top.z,w:ov,d:top.d,y:cur.y};falls.push({x:top.x+off/2+Math.sign(off)*(ov/2+Math.abs(off)/2),z:top.z,w:Math.abs(off),d:top.d,y:cur.y,vy:0});}S('hit');}
   tower.push(nb);g.score++;spawn();}falls.forEach(f=>{f.vy-=.02;f.y+=f.vy;});falls=falls.filter(f=>f.y>-8);camY+=(tower.length*.5+1-camY)*.08;};
 g.draw=()=>{A.skyband(A.mix('#1a0a44','#0a2a55',Math.min(1,g.score/40)),'#ff9a8a',H);A.cam.x=7;A.cam.y=camY+5;A.cam.z=-7;A.cam.ry=-.785;A.cam.rx=-.45;A.cam.f=260;
  tower.slice(-16).forEach((b,i)=>B3(b.x,b.y-.5,b.z,b.w,.5,b.d,COL(tower.indexOf(b))));if(!g.over)B3(cur.x,cur.y-.5,cur.z,cur.w,.5,cur.d,COL(tower.length));falls.forEach(f=>B3(f.x,f.y-.5,f.z,f.w,.5,f.d,'#8d86b8'));A.flush();A.cam.f=210;T(g.score,160,10,K.w,4,'c');if(perf>1)T('PERFECT X'+perf,160,44,K.y,1,'c');};
 return g;}});

A.add({id:'tiltmaze',name:'TILT MAZE 3D',cat:'RETRO 3D',hd:1,how:'ARROWS TILT THE BOARD. ROLL THE BALL TO THE GREEN HOLE. AVOID BLACK HOLES.',make(){
 const g={over:null,score:0};let N=9,m,b,tx=0,tz=0,lvl=0,holes,goal,time=0;
 const gen=()=>{lvl++;m=[];for(let z=0;z<N;z++){m.push([]);for(let x=0;x<N;x++)m[z].push(x===0||z===0||x===N-1||z===N-1?1:0);}for(let i=0;i<8+lvl*2;i++){const x=1+ri(N-2),z=1+ri(N-2);if(!(x<3&&z<3)&&!(x>N-4&&z>N-4))m[z][x]=1;}holes=[];for(let i=0;i<lvl+1;i++){const x=1+ri(N-2),z=1+ri(N-2);if(!m[z][x]&&!(x<3&&z<3)&&!(x>N-4&&z>N-4))holes.push({x:x+.5,z:z+.5});}goal={x:N-1.5,z:N-1.5};b={x:1.5,z:1.5,vx:0,vz:0};time=0;};gen();
 g.update=()=>{time++;const k=A.in(0);tx+=(ax(k)*.25-tx)*.1;tz+=(-ay(k)*.25-tz)*.1;b.vx=(b.vx+tx*.012)*.985;b.vz=(b.vz+tz*.012)*.985;const r=.3;
  const nx=b.x+b.vx;if(m[Math.floor(b.z)][Math.floor(nx+Math.sign(b.vx)*r)]){b.vx*=-.4;S('blip');}else b.x=nx;const nz=b.z+b.vz;if(m[Math.floor(nz+Math.sign(b.vz)*r)][Math.floor(b.x)]){b.vz*=-.4;S('blip');}else b.z=nz;
  if(holes.some(h=>Math.hypot(h.x-b.x,h.z-b.z)<.35)){g.over='FELL IN ON LEVEL '+lvl;S('lose');}if(Math.hypot(goal.x-b.x,goal.z-b.z)<.4){g.score+=Math.max(50,500-(time/6|0));S('win');A.burst(160,120,K.g,20,3);if(lvl>=5)g.over='ALL MAZES DONE! WIN';else gen();}};
 g.draw=()=>{A.cls('#1a1238');A.cam.x=N/2;A.cam.y=N*1.25;A.cam.z=-N*.35;A.cam.ry=0;A.cam.rx=-1.05;const o=N/2,P=(x,y,z)=>[x,y+(x-o)*tx*-1+(z-o)*tz*-1,z];
  F([P(0,0,0),P(N,0,0),P(N,0,N),P(0,0,N)],'#c4915a');for(let z=0;z<N;z++)for(let x=0;x<N;x++)if(m[z][x]){const y0=0,y1=.6,Q=[[x,z],[x+1,z],[x+1,z+1],[x,z+1]];F(Q.map(q=>P(q[0],y1,q[1])),'#8a5c33');F([P(x,y0,z),P(x+1,y0,z),P(x+1,y1,z),P(x,y1,z)],'#6a4020');F([P(x+1,y0,z),P(x+1,y0,z+1),P(x+1,y1,z+1),P(x+1,y1,z)],'#7a4a28');}
  holes.forEach(h=>F([P(h.x-.3,.01,h.z-.3),P(h.x+.3,.01,h.z-.3),P(h.x+.3,.01,h.z+.3),P(h.x-.3,.01,h.z+.3)],'#111111',false));F([P(goal.x-.35,.01,goal.z-.35),P(goal.x+.35,.01,goal.z-.35),P(goal.x+.35,.01,goal.z+.35),P(goal.x-.35,.01,goal.z+.35)],K.g,false);A.flush();
  const s=A.p3(...P(b.x,.3,b.z));if(s[2]>.1)C(s[0],s[1],.3*210/s[2],'#c8c8d8');T('MAZE '+lvl+'/5',6,6,K.w,2);T('SCORE '+g.score,W-6,6,K.y,2,'r');};
 return g;}});

A.add({id:'crossy3d',name:'CROSSY 3D',cat:'RETRO 3D',hd:1,how:'UP HOPS FORWARD, LEFT/RIGHT SIDESTEP. CROSS ROADS AND RIVERS. DON\'T STALL.',make(){
 const g={over:null,score:0};let p={x:0,z:0,hop:0,fx:0,fz:0},rows=[],camZ=-4,best=0,t=0;
 const row=z=>{if(z<3)return{z,k:'g'};const r=Math.random();if(r<.45){const d=Math.random()<.5?1:-1;return{z,k:'r',d,v:.04+rnd(.05)+z*.0008,cars:[{x:rnd(14)-7},{x:rnd(14)-7}]};}if(r<.7){const d=Math.random()<.5?1:-1;return{z,k:'w',d,v:.025+rnd(.03),logs:[{x:-6},{x:1},{x:7}].map(l=>({x:l.x+rnd(2),w:2+rnd(1.5)}))};}return{z,k:'g',trees:[ri(13)-6,ri(13)-6].filter(x=>x!==0)};};
 for(let z=0;z<30;z++)rows.push(row(z));const R_=z=>rows[z];
 g.update=()=>{t++;if(p.hop>0){p.hop--;p.x+=p.fx/6;p.z+=p.fz/6;if(p.hop===0){p.x=Math.round(p.x);p.z=Math.round(p.z);}}else{const h=A.hit(0);let dx=0,dz=0;if(h.u)dz=1;else if(h.d&&p.z>0)dz=-1;else if(h.l)dx=-1;else if(h.r)dx=1;const nr=R_(p.z+dz);if((dx||dz)&&!(nr&&nr.trees&&nr.trees.includes(p.x+dx))&&Math.abs(p.x+dx)<=7){p.fx=dx;p.fz=dz;p.hop=6;S('jump');}}
  while(rows.length<p.z+25)rows.push(row(rows.length));best=Math.max(best,p.z);g.score=best;camZ+=(p.z-4-camZ)*.06+.004*Math.min(1,t/300);
  for(const r of rows){if(r.k==='r')r.cars.forEach(c=>{c.x+=r.d*r.v*3;if(c.x>9)c.x=-9;if(c.x<-9)c.x=9;});if(r.k==='w')r.logs.forEach(l=>{l.x+=r.d*r.v*3;if(l.x>10)l.x=-10;if(l.x<-10)l.x=10;});}
  const cr=R_(Math.round(p.z));if(p.hop===0&&cr){if(cr.k==='r'&&cr.cars.some(c=>Math.abs(c.x-p.x)<.9)){g.over='SQUASHED';S('boom');}if(cr.k==='w'){const on=cr.logs.find(l=>Math.abs(l.x-p.x)<l.w/2);if(on){p.x+=cr.d*cr.v*3;if(Math.abs(p.x)>8){g.over='SWEPT AWAY';S('lose');}}else{g.over='SPLASH';S('lose');}}}if(p.z<camZ-1){g.over='TOO SLOW';S('lose');}};
 g.draw=()=>{A.cls('#4dabff');A.cam.x=p.x*.5+2;A.cam.y=9;A.cam.z=camZ-2;A.cam.ry=-.25;A.cam.rx=-.85;A.fog={col:'#bfe4ff',near:18,far:34};
  for(let z=Math.max(0,Math.floor(camZ)-2);z<camZ+22&&z<rows.length;z++){const r=rows[z];const col=r.k==='r'?'#44444e':r.k==='w'?'#2a7ad8':(z%2?'#6aca4a':'#5aba3a');F([[-9,0,z-.5],[9,0,z-.5],[9,0,z+.5],[-9,0,z+.5]],col,false);
   if(r.k==='r')r.cars.forEach((c,i)=>{B3(c.x,0,z,1.6,.6,.8,[K.r,K.y,K.p][(z+i)%3]);B3(c.x,.6,z,.8,.35,.7,'#9fd8ff');});if(r.k==='w')r.logs.forEach(l=>B3(l.x,-.05,z,l.w,.3,.8,'#8a5c33'));if(r.trees)r.trees.forEach(x=>{B3(x,0,z,.3,.5,.3,'#5b3a1e');B3(x,.5,z,.8,.9,.8,'#1e8a45');});}
  const hy=p.hop>0?Math.sin((6-p.hop)/6*Math.PI)*.5:0;A.shadow3(p.x,p.z,.7,.7);B3(p.x,hy,p.z,.6,.6,.6,K.w);B3(p.x,hy+.6,p.z+.1,.3,.12,.3,K.r);B3(p.x,hy+.35,p.z+.35,.15,.1,.15,K.o);A.flush();A.fog=null;T(g.score,160,8,K.w,4,'c');};
 return g;}});

A.add({id:'skijump',name:'SKI JUMP',cat:'SPORTS',how:'A AT THE LIP TO JUMP. THEN HOLD UP TO STAY FLAT, DOWN BEFORE LANDING. 3 JUMPS.',make(){
 const g={over:null,score:0};let ph='ramp',s=0,v=0,x=0,y=0,vx=0,vy=0,lean=0,tries=3,best=0,msg='',mt=0,jumped=false;const hill=xx=>xx<0?-xx*.9:xx*.45-Math.min(xx,160)*.0;
 const reset=()=>{ph='ramp';s=0;v=0;lean=0;jumped=false;};
 g.update=()=>{if(mt>0){if(--mt===0){if(tries<=0){g.over=best.toFixed(1)+' M';return;}reset();}return;}
  if(ph==='ramp'){v+=.025;s+=v;x=-120+s*.9;y=-(x)*.7;if(x>=-4){ph='air';const bonus=A.hit(0).a||A.in(0).a&&x>-10?1.3:.8;vx=v*.9;vy=-v*.35*bonus;jumped=bonus>1;if(jumped)S('jump');}else if(A.hit(0).a&&x>-14){ph='air';vx=v*.9;vy=-v*.45;jumped=true;S('jump');}return;}
  if(ph==='air'){const k=A.in(0);lean=cl(lean+(k.u?.03:k.d?-.05:-.005),-.6,.6);vy+=.035-(lean>0?lean*.03:0);x+=vx;y+=vy;vx*=.999;const gy=x*.45;if(y>=gy){const d=x/3;const good=lean<.05;msg=good?d.toFixed(1)+' M':'CRASH! '+(d*.5).toFixed(1)+' M';const pts=good?d:d*.5;best=Math.max(best,pts);g.score=Math.round(best*10);tries--;mt=90;S(good?'score':'boom');if(!good)A.burst(160,140,K.w,20,3);ph='done';}}};
 g.draw=()=>{A.skyband('#4dabff','#e8f4ff',H);const cx=x-60,cy=y-120;A.c.fillStyle='#f4f8ff';A.c.beginPath();A.c.moveTo(-200-cx,H);A.c.lineTo(-200-cx,140-cy);A.c.lineTo(-cx,-cy);A.c.lineTo(0-cx,6-cy);A.c.lineTo(600-cx,270-cy);A.c.lineTo(600-cx,H);A.c.fill();for(let m=20;m<=200;m+=20){const px=m*3-cx,py=m*3*.45-cy;R(px,py,2,8,K.r);T(m,px-4,py+10,K.b);}
  const px=x-cx,py=y-cy;A.c.save();A.c.translate(px,py);A.c.rotate(ph==='air'?-lean-.3:.6);R(-12,-2,24,2,K.r);R(-3,-14,6,12,K.c);C(0,-17,3,'#ffd9a8');A.c.restore();T('JUMPS '+tries,6,6,K.k,2);T('BEST '+best.toFixed(1)+' M',W-6,6,K.k,2,'r');if(ph==='ramp'&&x>-40)T('PRESS A!',160,40,K.r,2,'c');if(mt)T(msg,160,40,K.y,2,'c');};
 return g;}});

A.add({id:'golfdrive',name:'LONG DRIVE',cat:'SPORTS',how:'A THREE TIMES: START SWING, SET POWER, HIT THE SWEET SPOT. 5 DRIVES.',make(){
 const g={over:null,score:0};let ph=0,t=0,pw=0,acc=0,ball=null,n=0,best=0,msg='',mt=0,wind=0;const nw=()=>{wind=rnd(6)-3;};nw();
 g.update=()=>{t++;if(mt>0){if(--mt===0){n++;if(n>=5){g.over=best.toFixed(0)+' YARDS';return;}ph=0;ball=null;nw();}return;}
  if(ball){ball.vy+=.08;ball.x+=ball.vx+wind*.01;ball.y+=ball.vy;ball.vx*=.998;if(ball.y>=0){if(Math.abs(ball.vy)>1){ball.vy*=-.3;ball.y=0;ball.vx*=.7;}else{ball.vx*=.9;ball.vy=0;ball.y=0;if(ball.vx<.05){const yd=ball.x/2;best=Math.max(best,yd);g.score=Math.round(best);msg=yd.toFixed(0)+' YARDS'+(ball.slice?' (SLICED)':'');mt=90;S('score');}}}return;}
  if(ph===0&&A.hit(0).a){ph=1;t=0;S('blip');}else if(ph===1){pw=Math.min(1,t/60);if(A.hit(0).a||t>=60){ph=2;t=0;S('blip');}}else if(ph===2){acc=t/30-1;if(A.hit(0).a||t>=60){const off=Math.abs(acc);ball={x:0,y:0,vx:pw*6*(1-off*.5),vy:-pw*3.4*(1-off*.3),slice:off>.3};S('shoot');}}};
 g.draw=()=>{A.skyband('#4dabff','#dff4ff',150);R(0,150,W,90,'#4a9a3a');const cam=ball?Math.max(0,ball.x-120):0;for(let yd=50;yd<=400;yd+=50){const x=yd*2-cam+40;if(x>0&&x<W){R(x,150,1,90,'rgba(255,255,255,.4)');T(yd,x+2,154,K.w);}}
  if(ball){C(ball.x-cam+40,150+ball.y*6,3,K.w);R(ball.x-cam+38,152,4,2,'rgba(0,0,0,.3)');}else{R(30,120,10,28,K.c);C(35,114,5,'#ffd9a8');C(44,149,2.5,K.w);R(20,200,120,10,K.d);R(20,200,120*pw,10,ph>=1?K.o:K.d);if(ph===2){R(160,200,120,10,K.d);R(218,198,4,14,K.g);R(220+acc*58,198,2,14,K.w);}}
  T('DRIVE '+Math.min(n+1,5)+'/5',6,6,K.k,2);T('BEST '+best.toFixed(0)+' YD',W-6,6,K.k,2,'r');T('WIND '+(wind>0?'>':'<').repeat(Math.ceil(Math.abs(wind))),160,20,K.k,1,'c');if(ph===0&&!ball)T('PRESS A',160,60,K.k,2,'c');if(mt)T(msg,160,60,K.y,2,'c');};
 return g;}});

A.add({id:'frisbee',name:'FRISBEE DOG',cat:'SPORTS',how:'UP/DOWN AIM, A THROWS. THE DOG CHASES. CATCHES FAR AWAY SCORE MORE. 10 THROWS.',make(){
 const g={over:null,score:0};let ang=.3,pw=0,ph=0,t=0,disc=null,dog={x:40,y:200,vx:0},n=0,msg='',mt=0,wind=0;
 g.update=()=>{t++;if(mt>0){if(--mt===0){n++;if(n>=10)g.over=g.score+' POINTS';disc=null;ph=0;dog.x=40;wind=rnd(.03)-.015;}return;}
  if(disc){disc.x+=disc.vx;disc.y+=disc.vy;disc.vy+=.02;disc.vx+=wind;disc.vx*=.998;dog.x+=cl(disc.x-dog.x,-3.4,3.4);if(Math.abs(disc.x-dog.x)<10&&disc.y>170&&disc.y<200){const p=Math.round(disc.x/10);g.score+=p;msg='CATCH! +'+p;mt=60;S('coin');A.burst(dog.x,185,K.y,10);}else if(disc.y>210){msg='DROPPED';mt=50;S('lose');}return;}
  const k=A.in(0);if(ph===0){ang=cl(ang-ay(k)*.02,0,.9);if(A.hit(0).a){ph=1;t=0;}}else{pw=.5+.5*Math.sin(t*.08);if(A.hit(0).a){disc={x:30,y:170,vx:2+pw*4*Math.cos(ang),vy:-pw*3*Math.sin(ang)-.5};S('shoot');}}};
 g.draw=()=>{A.skyband('#4dabff','#dff4ff',180);R(0,200,W,40,'#6aca4a');for(let x=50;x<W;x+=50){T(x/10,x,206,K.w);}R(22,172,10,28,K.c);C(27,166,5,'#ffd9a8');
  R(dog.x-10,188,20,10,'#8a5c33');C(dog.x+10,186,5,'#8a5c33');R(dog.x-8,196,3,6,'#5b3a1e');R(dog.x+5,196,3,6,'#5b3a1e');R(dog.x-13,186,4,3,'#8a5c33');if(disc){A.c.fillStyle=K.r;A.c.beginPath();A.c.ellipse(disc.x,disc.y,7,2.5,0,0,7);A.c.fill();}else if(ph===0)for(let i=1;i<7;i++)C(30+Math.cos(ang)*i*10,170-Math.sin(ang)*i*10,1.5,K.k);else{A.box(8,60,10,100,K.k);R(10,158-pw*96,6,pw*96,K.r);}
  T('SCORE '+g.score,6,6,K.k,2);T('THROW '+Math.min(n+1,10)+'/10',W-6,6,K.k,2,'r');if(mt)T(msg,160,60,K.y,2,'c');};
 return g;}});

A.add({id:'kite',name:'KITE FLYER',cat:'CLASSICS',how:'HOLD A TO PULL THE STRING, RELEASE TO LET IT DRIFT. CATCH STARS, DODGE BIRDS.',make(){
 const g={over:null,score:0};let k={x:160,y:100,vx:0,vy:0},st=[],birds=[],t=0,lives=3,inv=0;
 g.update=()=>{t++;if(inv>0)inv--;const wind=Math.sin(t*.01)*.05+.02,pull=A.in(0).a;k.vx+=wind+ax(A.in(0))*.05;k.vy+=pull?-.12:.06;k.vx*=.97;k.vy*=.97;k.x=cl(k.x+k.vx,20,W-20);k.y=cl(k.y+k.vy,20,180);
  if(t%50===0)st.push({x:W+10,y:20+rnd(150)});if(t%Math.max(40,120-t/60|0)===0)birds.push({x:-10,y:20+rnd(150),v:1.2+rnd(1)});st.forEach(s=>s.x-=1.2);birds.forEach(b=>b.x+=b.v);
  st=st.filter(s=>{if(Math.hypot(s.x-k.x,s.y-k.y)<14){g.score+=10;S('coin');A.burst(s.x,s.y,K.y,8);return false;}return s.x>-10;});for(const b of birds)if(inv===0&&Math.hypot(b.x-k.x,b.y-k.y)<12){lives--;inv=80;S('boom');if(lives<=0)g.over='KITE TORN';}birds=birds.filter(b=>b.x<W+10);};
 g.draw=()=>{A.skyband('#4dabff','#ffe0b0',H);R(0,210,W,30,'#6aca4a');R(158,196,6,16,K.b);C(161,192,4,'#ffd9a8');A.c.strokeStyle='rgba(255,255,255,.8)';A.c.beginPath();A.c.moveTo(161,196);A.c.quadraticCurveTo((161+k.x)/2,Math.max(k.y,196)-20,k.x,k.y+10);A.c.stroke();
  if(inv%8<5){A.poly([[k.x,k.y-12],[k.x+9,k.y],[k.x,k.y+12],[k.x-9,k.y]],K.p,1);L(k.x,k.y-12,k.x,k.y+12,K.w);for(let i=1;i<5;i++)R(k.x-2+Math.sin(t*.2+i)*4,k.y+12+i*6,4,3,[K.y,K.c][i%2]);}
  st.forEach(s=>A.poly([[s.x,s.y-6],[s.x+2,s.y-2],[s.x+6,s.y-2],[s.x+3,s.y+2],[s.x+4,s.y+6],[s.x,s.y+3],[s.x-4,s.y+6],[s.x-3,s.y+2],[s.x-6,s.y-2],[s.x-2,s.y-2]],K.y,1));birds.forEach(b=>{const f=Math.sin(t*.4)*4;L(b.x-7,b.y-f,b.x,b.y,K.k,2);L(b.x,b.y,b.x+7,b.y-f,K.k,2);});
  T('SCORE '+g.score,6,6,K.k,2);T('LIVES '+lives,W-6,6,K.r,2,'r');};
 return g;}});

A.add({id:'rocket',name:'ROCKET LANDING',cat:'CLASSICS',how:'HOLD A FOR THRUST, LEFT/RIGHT TILT. LAND UPRIGHT AND SLOW ON THE DRONE SHIP.',make(){
 const g={over:null,score:0};let r,ship,fuel,lvl=0,msg='',mt=0;const gen=()=>{lvl++;r={x:60+rnd(200),y:20,vx:rnd(1)-.5,vy:.5,a:rnd(.4)-.2};ship={x:60+rnd(200),v:lvl>2?.3+lvl*.05:0};fuel=100;};gen();
 g.update=()=>{if(mt>0){if(--mt===0){if(msg.startsWith('LANDED')){if(lvl>=6){g.over='FLEET LANDED! WIN';A.confetti();}else gen();}else g.over='BOOM';}return;}const k=A.in(0);r.a=cl(r.a+ax(k)*.03,-1,1);if(k.a&&fuel>0){fuel-=.5;r.vx+=Math.sin(r.a)*.08;r.vy-=Math.cos(r.a)*.08;if(A.t%4===0)A.burst(r.x-Math.sin(r.a)*14,r.y+Math.cos(r.a)*14,K.o,2,1);}
  r.vy+=.035;r.x+=r.vx;r.y+=r.vy;ship.x+=ship.v;if(ship.x<50||ship.x>270)ship.v*=-1;if(r.x<0||r.x>W){msg='LOST';mt=60;S('boom');}
  if(r.y>=196){const ok=Math.abs(r.x-ship.x)<26&&Math.abs(r.vy)<1.1&&Math.abs(r.vx-ship.v)<.8&&Math.abs(r.a)<.2;if(ok){g.score+=100+Math.round(fuel);msg='LANDED! +'+(100+Math.round(fuel));S('win');}else{msg='CRASHED';S('boom');A.burst(r.x,r.y,K.o,30,4);}mt=80;r.y=196;r.vx=r.vy=0;}};
 g.draw=()=>{A.skyband('#050318','#1a2a6a',H);for(let i=0;i<30;i++)R((i*97)%W,(i*41)%150,1,1,K.gr);R(0,206,W,34,'#0a2a55');for(let i=0;i<W;i+=10)R(i,206+Math.sin(A.t*.1+i)*1.5,10,2,'#1b6fb8');R(ship.x-30,198,60,8,'#8a8aa0');R(ship.x-2,198,4,2,K.y);T('X',ship.x,190,K.y,1,'c');
  A.c.save();A.c.translate(r.x,r.y);A.c.rotate(r.a);R(-4,-26,8,26,K.w);A.poly([[-4,-26],[4,-26],[0,-32]],K.w,1);R(-4,-12,8,3,K.k);R(-8,-4,4,4,'#8a8aa0');R(4,-4,4,4,'#8a8aa0');if(A.in(0).a&&fuel>0&&!mt)A.poly([[-3,0],[3,0],[0,8+Math.random()*6]],K.o,1);A.c.restore();
  R(6,6,80,6,K.k);R(6,6,80*fuel/100,6,fuel<25?K.r:K.y);T('FUEL',90,6,K.w);T('SHIP '+lvl+'/6',W-6,6,K.w,1,'r');T('V '+r.vy.toFixed(1),W-6,16,Math.abs(r.vy)<1.1?K.g:K.r,1,'r');if(mt)T(msg,160,80,K.y,2,'c');};
 return g;}});

A.add({id:'planethop',name:'PLANET HOP',cat:'CLASSICS',how:'YOU ORBIT A PLANET. A LAUNCHES YOU. LAND ON THE NEXT ONE.',make(){
 const g={over:null,score:0};let pl=[],cur=0,a=0,fly=null,cam={x:0,y:0};const addP=()=>{const l=pl[pl.length-1];pl.push({x:l.x+70+rnd(60),y:cl(l.y+rnd(120)-60,-100,100),r:12+rnd(14),c:[K.c,K.p,K.o,K.g,K.b][pl.length%5],s:(Math.random()<.5?1:-1)*(.03+rnd(.03))});};pl.push({x:0,y:0,r:20,c:K.c,s:.04});for(let i=0;i<6;i++)addP();
 g.update=()=>{if(fly){fly.x+=fly.vx;fly.y+=fly.vy;for(let i=0;i<pl.length;i++){const P_=pl[i],dx=P_.x-fly.x,dy=P_.y-fly.y,d=Math.hypot(dx,dy);if(i!==cur||fly.t>20){fly.vx+=dx/d/d*8;fly.vy+=dy/d/d*8;}if(d<P_.r+4&&(i!==cur||fly.t>20)){if(i>cur)g.score+=i-cur;cur=i;a=Math.atan2(fly.y-P_.y,fly.x-P_.x);fly=null;S('coin');while(pl.length<cur+6)addP();return;}}fly.t++;if(fly.t>400||Math.abs(fly.y-cam.y)>220){g.over='LOST IN SPACE';S('lose');}return;}
  const P_=pl[cur];a+=P_.s;if(A.hit(0).a){const x=P_.x+Math.cos(a)*(P_.r+4),y=P_.y+Math.sin(a)*(P_.r+4);fly={x,y,vx:Math.cos(a)*2.4,vy:Math.sin(a)*2.4,t:0};S('jump');}};
 g.draw=()=>{A.cls('#05030f');const f=fly||(()=>{const P_=pl[cur];return{x:P_.x+Math.cos(a)*(P_.r+4),y:P_.y+Math.sin(a)*(P_.r+4)};})();cam.x+=(f.x-100-cam.x)*.08;cam.y+=(f.y-cam.y)*.08;for(let i=0;i<60;i++)R(((i*97-cam.x*.3)%W+W)%W,((i*53-cam.y*.3)%H+H)%H,1,1,K.gr);
  pl.forEach(P_=>{const x=P_.x-cam.x,y=P_.y-cam.y+120;if(x>-40&&x<W+40){C(x,y,P_.r,P_.c);A.ring(x,y,P_.r+4,'rgba(255,255,255,.12)');}});C(f.x-cam.x,f.y-cam.y+120,3.5,K.y);if(!fly){const P_=pl[cur];for(let i=1;i<6;i++){const x=P_.x+Math.cos(a)*(P_.r+4+i*8)-cam.x,y=P_.y+Math.sin(a)*(P_.r+4+i*8)-cam.y+120;R(x,y,1,1,K.w);}}T(g.score,160,8,K.w,3,'c');};
 return g;}});

A.add({id:'lasertag',name:'LASER TAG',cat:'VERSUS',vs:1,how:'MOVE, A FIRES A BOUNCING LASER. HIT YOUR RIVAL 5 TIMES.',make(){
 const g={over:null,score:0},WL=[[100,60,12,50],[208,130,12,50],[140,110,40,12],[60,170,50,12],[210,60,50,12]];let p,shots=[],sc=[0,0],wait=40;
 const blk=(x,y)=>x<10||x>W-10||y<26||y>H-10||WL.some(w=>x>w[0]&&x<w[0]+w[2]&&y>w[1]&&y<w[1]+w[3]);const reset=()=>{p=[{x:30,y:120,fx:1,fy:0,cd:0},{x:290,y:120,fx:-1,fy:0,cd:0}];shots=[];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=p[1],o=p[0],dx=o.x-q.x,dy=o.y-q.y;const clear=(()=>{const d=Math.hypot(dx,dy)||1;for(let k=8;k<d;k+=4)if(blk(q.x+dx/d*k,q.y+dy/d*k))return false;return true;})();let b={};if(Math.abs(dy)<8)b={[dx<0?'l':'r']:0,a:q.cd===0&&Math.random()<.2+.3*A.ai};if(Math.abs(dx)<8)b={a:q.cd===0&&Math.random()<.2+.3*A.ai};const want=Math.abs(dx)>Math.abs(dy)?(dy<0?'u':'d'):(dx<0?'l':'r');b[want]=1;if(Math.abs(dy)<8)b={l:dx<0,r:dx>0,a:b.a};if(!clear)b.a=false;if(Math.random()<.15-.1*A.ai)b={[['l','r','u','d'][ri(4)]]:1};const inc=shots.find(sh=>sh.o===0&&Math.hypot(sh.x-q.x,sh.y-q.y)<70&&((Math.abs(sh.vy)<1&&Math.abs(sh.y-q.y)<10&&(q.x-sh.x)*sh.vx>0)||(Math.abs(sh.vx)<1&&Math.abs(sh.x-q.x)<10&&(q.y-sh.y)*sh.vy>0)));if(inc&&Math.random()<.5+.5*A.ai){b=Math.abs(inc.vy)<1?{[q.y<120?'d':'u']:1}:{[q.x<160?'r':'l']:1};}A.bot(b);}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),dx=ax(k),dy=dx?0:ay(k);if(dx||dy){q.fx=dx;q.fy=dy;const sp=i&&A.cpu?1.3+1*A.ai:2.2;if(!blk(q.x+dx*sp*2,q.y+dy*sp*2)){q.x+=dx*sp;q.y+=dy*sp;}}if(q.cd>0)q.cd--;if(A.hit(i).a&&q.cd===0){q.cd=30;shots.push({x:q.x+q.fx*8,y:q.y+q.fy*8,vx:q.fx*5,vy:q.fy*5,o:i,b:2,trail:[]});S('shoot');}}
  for(const s of shots){s.trail.push([s.x,s.y]);if(s.trail.length>6)s.trail.shift();s.x+=s.vx;if(blk(s.x,s.y)){s.x-=s.vx;s.vx*=-1;s.b--;}s.y+=s.vy;if(blk(s.x,s.y)){s.y-=s.vy;s.vy*=-1;s.b--;}if(s.b<0){s.dead=1;continue;}for(let i=0;i<2;i++){if(i===s.o&&s.b===2)continue;if(Math.hypot(p[i].x-s.x,p[i].y-s.y)<8){s.dead=1;sc[1-i]++;S('boom');A.burst(p[i].x,p[i].y,i?K.p:K.c,16,3);if(sc[1-i]>=5){g.over=A.win(1-i);return;}reset();return;}}}shots=shots.filter(s=>!s.dead);};
 g.draw=()=>{A.cls('#07030f');for(let x=10;x<W;x+=20)R(x,26,1,H,'#140a2a');for(let y=26;y<H;y+=20)R(10,y,W-20,1,'#140a2a');WL.forEach(w=>{R(w[0],w[1],w[2],w[3],'#2b2257');A.box(w[0],w[1],w[2],w[3],K.c);});A.box(10,26,W-20,H-36,K.p);
  shots.forEach(s=>{const c=s.o?K.p:K.c;s.trail.forEach((t,i)=>{A.c.globalAlpha=i/6;R(t[0]-1,t[1]-1,3,3,c);});A.c.globalAlpha=1;R(s.x-2,s.y-2,4,4,K.w);});p.forEach((q,i)=>{C(q.x,q.y,7,i?K.p:K.c);C(q.x+q.fx*4,q.y+q.fy*4,2,K.w);});A.hud2(sc[0],sc[1]);};
 return g;}});
})();
