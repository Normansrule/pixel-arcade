(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),PI=Math.PI,TAU=PI*2;
const wrap=a=>{a=(a+PI)%TAU;if(a<0)a+=TAU;return a-PI;};
const alpha=(a,f)=>{A.c.globalAlpha=a;f();A.c.globalAlpha=1;};
const hud=(h)=>R(0,0,W,h||15,'rgba(0,0,0,.55)');
const el=(x,y,rx,ry,col,rot)=>{const c=A.c;c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),rot||0,0,TAU);c.fill();};
const lg=(x0,y0,x1,y1,st)=>{const c=A.c,g=c.createLinearGradient&&c.createLinearGradient(x0,y0,x1,y1);if(!g||!g.addColorStop)return st[0][1];st.forEach(s=>g.addColorStop(s[0],s[1]));return g;};
const fill=(x,y,w,h,col)=>{A.c.fillStyle=col;A.c.fillRect(x,y,w,h);};
const SKN=['#f1c7a3','#e0a57c','#c68a5e','#9a6440','#6e4428'],CRW=['#e84a4a','#4a8ae8','#f0d040','#40c070','#f0f0f0','#e08a30','#a060d0','#3a3a4a'];
const crowd=(x0,y0,w,rows,sz,t,ex)=>{for(let r=0;r<rows;r++){const y=y0+r*sz*1.7;for(let i=0,x=x0+(r%2)*sz*.65;x<x0+w;x+=sz*1.3,i++){const k=(i*7+r*13)%8,j=ex?Math.max(0,Math.sin(t*.3+i*1.7+r))*ex:0;fill(x,y+sz*.55-j,sz,sz*1.1,CRW[k]);fill(x+sz*.15,y-sz*.3-j,sz*.7,sz*.75,SKN[(i*3+r)%5]);}}};
const meter=(x,y,w,h,f,col,lab)=>{R(x-1,y-1,w+2,h+2,'#101018');fill(x,y,w*cl(f,0,1),h,col);if(lab)T(lab,x,y-7,K.w,1);};
const ord=n=>n+(['ST','ND','RD'][n-1]||'TH');
/* helmet / cap drawn over an A.person head (hx,hy = head centre) */
const helm=(hx,hy,s,col,front,mask)=>{C(hx,hy-.5*s,4.75*s,col);if(front){const w=Math.max(.6,.55*s);alpha(.95,()=>{L(hx-3.6*s,hy+1.3*s,hx+3.6*s,hy+1.3*s,mask||'#d0d0d0',w);L(hx-3*s,hy+3*s,hx+3*s,hy+3*s,mask||'#d0d0d0',w);L(hx,hy+.4*s,hx,hy+3.8*s,mask||'#d0d0d0',w);});}else L(hx,hy-5.2*s,hx,hy+1*s,'#ffffff',Math.max(.6,.8*s));};

/* =========================== FIELD GOAL =========================== */
A.add({id:'fieldgoal',name:'FIELD GOAL',cat:'SPORTS',how:'LEFT/RIGHT AIM. HOLD A, LET GO TO KICK. LEFT/RIGHT CURVES THE BALL IN FLIGHT.',make(){
 const g={over:null,score:0},FC=260,CH=3,HOR=118,CZ=11;
 let yd=20,miss=0,made=0,ph,aim,pw,pd,ball,wind,msg='',good=false,mt=0,t=0,cheer=0,trail,rt,note='',nt=0;
 const pj=(x,y,z)=>{const dz=Math.max(.6,z+CZ),s=FC/dz;return[160+x*s,HOR-(y-CH)*s,s];};
 const reset=()=>{ph='aim';aim=0;pw=0;pd=1;ball=null;trail=[];rt=0;wind=Math.round((rnd(2)-1)*Math.min(14,(yd-15)*.4));};reset();
 const D=()=>yd*.9144;
 const res=(ok,txt)=>{msg=txt;good=ok;mt=100;ph='res';if(ok){made++;g.score+=yd;cheer=100;S('score');const p=pj(ball.x,ball.y,ball.z);A.burst(p[0],p[1],K.y,20,2.5);A.burst(p[0],p[1],K.w,10,2);}else{miss++;S('lose');A.shake=4;}};
 g.update=()=>{t++;if(cheer)cheer--;if(nt)nt--;
  if(mt>0){if(--mt===0){if(good){if(yd>=60){g.over='60 YARD LEGEND - WIN';return;}yd+=5;}else if(miss>=3){g.over='3 MISSES - '+made+' MADE';return;}reset();}return;}
  const k=A.in(0);
  if(ph==='aim'){aim=cl(aim+ax(k)*.004,-.22,.22);if(A.hit(0).a)ph='charge';}
  else if(ph==='charge'){pw+=pd*.024;if(pw>=1){pw=1;pd=-1;}else if(pw<=0){pw=0;pd=1;}if(!k.a){ph='run';rt=0;}}
  else if(ph==='run'){if(++rt>=16){const v=15+pw*17,e=.62;ball={x:0,y:.2,z:0,vx:v*Math.cos(e)*Math.sin(aim),vy:v*Math.sin(e),vz:v*Math.cos(e)*Math.cos(aim),hook:pw>.93?(rnd(1)<.5?-1:1)*(2.5+rnd(2)):0,r:0};ph='fly';S('hit');A.shake=3;const p=pj(0,.2,0);A.burst(p[0],p[1],'#8a5a2a',8,1.5);if(ball.hook){note='SHANKED IT!';nt=70;}}}
  else if(ph==='fly'){const b=ball,dt=1/60,px=b.x,py=b.y,pz=b.z;b.vx+=(wind*.13+ax(k)*1.5+b.hook)*dt;b.vy-=9.8*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.r+=.35;if(t%2===0){trail.push([b.x,b.y,b.z]);if(trail.length>12)trail.shift();}
   const d=D();if(pz<d&&b.z>=d){const f=(d-pz)/(b.z-pz),x=px+(b.x-px)*f,y=py+(b.y-py)*f;if(Math.abs(x)<2.82&&y>3.05)res(true,'GOOD!');else if(Math.abs(x)<2.82)res(false,'SHORT - UNDER THE BAR');else res(false,x<0?'WIDE LEFT':'WIDE RIGHT');}else if(b.y<=0)res(false,'SHORT');}};
 const drawBall=()=>{if(!ball)return;trail.forEach((p,i)=>{const q=pj(p[0],p[1],p[2]);alpha(i/trail.length*.6,()=>C(q[0],q[1],Math.max(1,q[2]*.12),'#ffffff'));});const b=ball,s=pj(b.x,0,b.z),p=pj(b.x,b.y,b.z),r=Math.max(2,p[2]*.3);alpha(.35,()=>el(s[0],s[1],r,r*.35,'#000'));el(p[0],p[1],r,Math.max(.8,r*(.35+.65*Math.abs(Math.cos(b.r)))),'#7a3e1a',b.r*.2);if(r>3)L(p[0]-r*.4,p[1],p[0]+r*.4,p[1],'#f4f0e0',1);};
 g.draw=()=>{A.skyband('#1d3a7a','#8cc0ec',60);
  R(0,40,W,HOR-40,'#262a3e');crowd(-4,47,W+8,6,4,t,cheer?3:0);R(0,HOR-7,W,7,'#162030');for(let x=0;x<W;x+=40)R(x+2,HOR-6,34,4,['#c02a3a','#e8e8f0','#2a5ab0'][(x/40)%3]);
  [[14,19],[306,19]].forEach(([x,y])=>{R(x-1,y+10,3,26,'#5a6070');R(x-11,y,23,11,'#c8ced8');for(let i=0;i<4;i++)for(let j=0;j<2;j++)R(x-9+i*5,y+2+j*4,4,3,'#fff6c8');});
  R(0,HOR,W,H-HOR,'#2f8a3a');const d=D(),gl=d-9.144;let i=0;for(let z=-CZ+1;z<d+14;z+=4.572,i++){const a=pj(0,0,z)[1],b=pj(0,0,z+4.572)[1];fill(0,b,W,a-b+1,i%2?'#2f8a3a':'#38984a');}
  const ez=[pj(-24.4,0,gl),pj(24.4,0,gl),pj(24.4,0,d),pj(-24.4,0,d)];A.poly(ez.map(p=>[p[0],p[1]]),'#1f5aa0',1);
  for(let n=0;;n++){const z=gl-n*4.572;if(z<-CZ+2)break;const a=pj(-24.4,0,z),b=pj(24.4,0,z);alpha(n?.55:.9,()=>L(a[0],a[1],b[0],b[1],'#ffffff',n?1:2));}
  {const a=pj(-24.4,0,d),b=pj(24.4,0,d);L(a[0],a[1],b[0],b[1],'#ffffff',1);}
  [-1,1].forEach(sd=>{const n=pj(sd*24.4,0,-CZ+1.5),f=pj(sd*24.4,0,240);A.poly([[sd<0?0:W,HOR],[f[0],f[1]],[n[0],n[1]],[sd<0?0:W,H]],'#24702c',1);L(n[0],n[1],f[0],f[1],'#ffffff',2);});
  if(ball&&ball.z>d)drawBall();
  {const s=pj(0,0,d)[2],w=Math.max(1.2,.14*s),P0=pj(0,0,d+1.2),P1=pj(0,3.05,d+1.2),P2=pj(0,3.05,d),Lc=pj(-2.82,3.05,d),Rc=pj(2.82,3.05,d),Lt=pj(-2.82,10,d),Rt=pj(2.82,10,d);
   R(P0[0]-w*1.3,P0[1]-w*7,w*2.6,w*7,'#2a5ab0');L(P0[0],P0[1],P1[0],P1[1],'#e0b818',w*1.4);L(P1[0],P1[1],P2[0],P2[1],'#e0b818',w);L(Lc[0],Lc[1],Rc[0],Rc[1],'#ffd83a',w);L(Lc[0],Lc[1],Lt[0],Lt[1],'#ffd83a',w);L(Rc[0],Rc[1],Rt[0],Rt[1],'#ffd83a',w);
   [Lt,Rt].forEach(p=>{const fl=wind*.8+Math.sin(t*.3)*1.2;A.poly([[p[0],p[1]],[p[0]+fl,p[1]+1.5],[p[0],p[1]+3.5]],'#ff5a3a',1);});}
  if(ph==='aim'||ph==='charge')for(let s=2;s<=22;s+=2.5){const p=pj(Math.sin(aim)*s,0,Math.cos(aim)*s);alpha(.85,()=>C(p[0],p[1],Math.max(1,p[2]*.05),'#ffe36a'));}
  if(!ball||ball.z<=d)drawBall();
  const hp=pj(-.62,0,.35),hs=1.85*hp[2]/33;A.c.save();A.c.translate(hp[0],hp[1]);A.c.scale(1,.72);A.person(0,0,{s:hs,c:'#b01e32',pants:'#f0f0f0',num:11,arm2:-1.25,id:2});A.c.restore();helm(hp[0],hp[1]-28.5*hs*.72,hs,'#b01e32',true);
  if(!ball){const p=pj(0,.25,0),r=p[2]*.12;el(p[0],p[1]-r,r*.65,r,'#7a3e1a');L(p[0],p[1]-r*1.5,p[0],p[1]-r*.5,'#f4f0e0',1);}
  const f=ph==='run'?rt/16:ph==='aim'||ph==='charge'?0:1,kp=pj(-1.5+1.15*f,0,-2.8+2.3*f),ks=1.85*kp[2]/33;
  A.person(kp[0],kp[1],{s:ks,c:'#b01e32',pants:'#f0f0f0',num:3,st:ph==='run'?rt*.8:0,id:4,arm1:ph==='fly'||ph==='res'?1.1:undefined,arm2:ph==='fly'||ph==='res'?-1.1:undefined});helm(kp[0],kp[1]-28.5*ks,ks,'#b01e32',false);
  if(ph==='charge'||ph==='aim'){R(296,128,14,82,'#101018');fill(298,130,10,78*.07,'#c02020');fill(298,130+78*(1-pw),10,78*pw,pw>.93?'#ff4a3a':pw>.6?'#3dff8b':'#ffcf3f');T('PWR',303,214,K.w,1,'c');}
  hud(16);T('KICK '+yd+' YD',5,4,K.y,2);T('WIND '+Math.abs(wind)+(wind>0?' >>':wind<0?' <<':''),160,5,wind?K.c:K.gr,1,'c');T('MADE '+made,W-44,4,K.w,1,'r');for(let m=0;m<3;m++)T('X',W-36+m*12,3,m<miss?K.r:'#444455',2);
  if(ph==='aim')T('LEFT/RIGHT AIM   HOLD A',160,26,K.w,1,'c');if(mt)T(msg,160,24,good?K.y:K.r,msg.length>12?2:3,'c');if(nt)T(note,160,48,K.o,2,'c');};
 return g;}});

/* =========================== PITCHER'S MOUND =========================== */
const PT=[['FASTBALL',30,0,-.15,'#ffffff'],['CURVE',46,-.35,1.25,'#ffd83a'],['SLIDER',38,1.05,.35,'#4dabff'],['CHANGEUP',48,0,.3,'#3dff8b']];
A.add({id:'pitcher',name:"PITCHER'S MOUND",cat:'SPORTS',time:300,how:'ARROWS PICK THE SPOT, B CHANGES PITCH, A THROWS. MIX IT UP - BATTERS LEARN.',make(){
 const g={over:null,score:0},ZX=160,ZY=104,CW=11,CHh=13,SKL=[.02,-.03,.06,.1,.05,-.04,0,-.06,.03];
 let tg={x:2,y:2},ty=0,ph='set',u=0,wu=0,pc=null,cnt={b:0,s:0},outs=0,inn=1,runs=0,bs=[0,0,0],bat=0,hist=[],msg='',mc=K.w,mt=0,t=0,np=0,ks=0,hitB=null,swA=-1,cheer=0;
 const cell=(x,y)=>[ZX+(x-2)*CW,ZY+(y-2)*CHh];
 const guess=()=>{const tw=[0,0,0,0];let gx=0,gy=0,wt=0;hist.forEach((h,i)=>{const w=Math.pow(.72,hist.length-1-i);tw[h.ty]+=w;gx+=h.x*w;gy+=h.y*w;wt+=w;});let gt=0;for(let i=1;i<4;i++)if(tw[i]>tw[gt])gt=i;return wt?{t:gt,x:gx/wt,y:gy/wt,c:tw[gt]/wt}:{t:0,x:2,y:2,c:0};};
 const say=(m,c)=>{msg=m;mc=c||K.w;};
 const next=()=>{cnt={b:0,s:0};bat++;};
 const out=k=>{outs++;if(!k)g.score+=30;next();if(outs>=3){outs=0;bs=[0,0,0];inn++;if(inn>3){g.score+=Math.max(0,300-runs*60);g.over='COMPLETE GAME - WIN';return;}say('SIDE RETIRED',K.c);}};
 const strike=m=>{cnt.s++;g.score+=5;if(cnt.s>=3){ks++;g.score+=100;say('STRIKEOUT!',K.y);S('score');cheer=60;A.burst(ZX,ZY,K.y,16,2);out(true);}else say(m,K.y);};
 const walk=()=>{if(bs[0]){if(bs[1]){if(bs[2])runs++;bs[2]=1;}bs[1]=1;}bs[0]=1;};
 const hit=(n,m)=>{for(let i=2;i>=0;i--)if(bs[i]){bs[i]=0;if(i+n>=3)runs++;else bs[i+n]=1;}if(n>=4)runs++;else bs[n-1]=1;say(m,K.r);S(n>=4?'boom':'hit');next();if(runs>=5)g.over='PULLED - '+runs+' RUNS ALLOWED';};
 g.update=()=>{t++;if(cheer)cheer--;if(hitB){hitB.x+=hitB.vx;hitB.y+=hitB.vy;hitB.vy+=.06;hitB.r+=.12;if(++hitB.t>70)hitB=null;}
  if(ph==='res'){if(--mt<=0){ph='set';swA=-1;}return;}
  const h=A.hit(0);
  if(ph==='set'){if(h.l&&tg.x>0)tg.x--;if(h.r&&tg.x<4)tg.x++;if(h.u&&tg.y>0)tg.y--;if(h.d&&tg.y<4)tg.y++;if(h.l||h.r||h.u||h.d)S('blip');if(h.b){ty=(ty+1)%4;S('blip');}if(h.a){ph='wind';wu=0;}return;}
  if(ph==='wind'){if(++wu>=20){const sg=.28+np*.004+(ty===1?.08:0);pc={ty,fx:tg.x+(rnd(2)-1)*sg*1.4,fy:tg.y+(rnd(2)-1)*sg*1.4,dec:false,sw:false,q:0};ph='fly';u=0;S('shoot');}return;}
  if(ph==='fly'){const p=pc;u+=1/PT[p.ty][1];
   if(!p.dec&&u>=.55){p.dec=true;const inZ=p.fx>=.5&&p.fx<=3.5&&p.fy>=.5&&p.fy<=3.5,od=Math.max(0,.5-p.fx,p.fx-3.5,.5-p.fy,p.fy-3.5),G=guess(),l2=hist.length>=2&&hist[hist.length-1].ty===0&&hist[hist.length-2].ty===0,edge=inZ&&(Math.abs(p.fx-2)>.9||Math.abs(p.fy-2)>.9);
    const pS=inZ?.6+(cnt.s===2?.28:0)+(p.ty===0?.05:0):.12+(p.ty===1||p.ty===2?.2:0)+(cnt.s===2?.18:0)-.12*od;p.sw=rnd(1)<pS;p.inZ=inZ;
    p.q=.57+SKL[bat%9]+(inn-1)*.03+(p.ty===G.t?.2*G.c+.08:-.14)-.11*Math.hypot(p.fx-G.x,p.fy-G.y)-(p.ty===0?.05:0)-(p.ty===3&&l2?.25:0)-(edge?.07:0)-od*.35+rnd(.34)-.17+(cnt.s===2?.04:0);}
   if(p.sw&&u>=.8&&swA<0)swA=0;if(swA>=0)swA=Math.min(1,swA+.12);
   if(u>=1){hist.push({ty:p.ty,x:p.fx,y:p.fy});if(hist.length>10)hist.shift();np++;ph='res';mt=70;const [bx,by]=cell(p.fx,p.fy);
    if(!p.sw){if(p.inZ)strike('CALLED STRIKE');else{cnt.b++;if(cnt.b>=4){walk();say('WALK',K.o);next();}else say('BALL',K.w);}}
    else{const q=p.q;if(q<.28)strike('SWINGING STRIKE');else{hitB={x:bx,y:by,vx:(rnd(2)-1)*2.5,vy:-2.5-rnd(2),r:2,t:0};if(q<.44){if(cnt.s<2)cnt.s++;say('FOUL BALL',K.w);hitB.vx=(rnd(1)<.5?-1:1)*3.5;S('hit');}else if(q<.62){say(['GROUNDOUT','FLY OUT','POP UP','LINEOUT'][ri(4)],K.c);S('hit');out(false);}else if(q<.8)hit(1,'SINGLE');else if(q<.9)hit(2,'DOUBLE');else if(q<.95)hit(3,'TRIPLE');else{hitB.vy=-5;hit(4,'HOME RUN');}}}}}};
 g.draw=()=>{A.skyband('#14204a','#3a5a9a',22);R(0,20,W,66,'#2a2e44');crowd(-2,26,W+4,7,4,t,cheer?2:0);alpha(.12,()=>{for(let x=0;x<W;x+=6)L(x,20,x,92,'#ffffff');});
  R(0,84,W,14,'#1e4a32');for(let x=4;x<W;x+=52)R(x,87,44,8,['#e8e8f0','#c02a3a','#2a5ab0','#ffcf3f'][(x/52|0)%4]);
  fill(0,98,W,H-98,lg(0,98,0,H,[[0,'#3c8c3c'],[1,'#2a6e2e']]));for(let i=0;i<6;i++)alpha(.08,()=>fill(0,104+i*24,W,12,'#ffffff'));
  el(160,134,96,26,'#b8804a');el(160,134,86,20,'#c48c56');alpha(.7,()=>{L(160,140,-40,240,'#ffffff',2);L(160,140,360,240,'#ffffff',2);A.box(118,126,22,18,'#ffffff');A.box(180,126,22,18,'#ffffff');});
  el(160,238,70,20,'#c08a50');R(150,226,20,3,'#ffffff');A.poly([[154,136],[166,136],[167,139],[160,142],[153,139]],'#f8f8f8',1);
  A.person(160,128,{s:1,c:'#1a1a2a',pants:'#606070',id:3});C(160,99.5,3.6,'#202028');
  const [mx,my]=cell(tg.x,tg.y);A.c.save();A.c.translate(160,141);A.c.scale(1,.7);A.person(0,0,{s:1.05,c:'#2a3a8a',pants:'#e8e8e8',arm2:-2.2,id:1});A.c.restore();C(160,141-28.5*1.05*.7,4.3,'#26262e');
  alpha(.55,()=>{A.box(ZX-CW*1.5,ZY-CHh*1.5,CW*3,CHh*3,'#ffffff');for(let i=1;i<3;i++){L(ZX-CW*1.5+i*CW,ZY-CHh*1.5,ZX-CW*1.5+i*CW,ZY+CHh*1.5,'rgba(255,255,255,.4)');L(ZX-CW*1.5,ZY-CHh*1.5+i*CHh,ZX+CW*1.5,ZY-CHh*1.5+i*CHh,'rgba(255,255,255,.4)');}});
  const G=guess();if(hist.length>=2){const [gx,gy]=cell(G.x,G.y);alpha(.12+.25*G.c,()=>C(gx,gy,9,'#ff3030'));}
  C(mx,my+2,4.5,'#8a5a2a');
  const bx=140,byy=146,bsc=1.25,swing=swA<0?0:swA,ba=-2.3+swing*3.1,hx=bx+7+swing*5,hy=byy-27;
  A.person(bx,byy,{s:bsc,c:'#d05020',pants:'#e8e8e8',num:(bat%9)+1,d:1,id:bat%6,arm1:-1.6-swing*.4,arm2:-1.9+swing*.6});helm(bx,byy-28.5*bsc,bsc,'#d05020',false);
  L(hx,hy,hx+Math.cos(ba)*20,hy+Math.sin(ba)*20,'#c8a060',2.5);L(hx,hy,hx+Math.cos(ba)*7,hy+Math.sin(ba)*7,'#5a3a1a',2.5);
  if(ph==='fly'&&pc){const p=pc,P=PT[p.ty],s=[174,166],e=cell(p.fx,p.fy),a=cell(p.fx-P[2],p.fy-P[3]);for(let k=2;k>=0;k--){const uu=Math.max(0,u-k*.06),x=s[0]+(a[0]-s[0])*uu+(e[0]-a[0])*Math.pow(uu,2.6),y=s[1]+(a[1]-s[1])*uu+(e[1]-a[1])*Math.pow(uu,2.6),r=4.6-2.6*uu;alpha(k?.25:1,()=>C(x,y,r,'#f6f6f0'));if(!k&&r>3)L(x-r*.5,y-r*.2,x+r*.5,y+r*.3,'#d03030',.8);}}
  if(ph==='set'){A.ring(mx,my,7,K.y);L(mx-10,my,mx-5,my,K.y);L(mx+5,my,mx+10,my,K.y);}
  if(hitB)C(hitB.x,hitB.y,hitB.r,'#f6f6f0');
  const wa=ph==='wind'?wu/20:ph==='fly'?1:0,ps=2.05;A.person(160,240,{s:ps,c:'#f2f2f2',pants:'#e4e4e4',num:21,id:5,arm2:wa<1?-wa*3.6:-3.6+Math.min(1,u*3)*2.8,arm1:wa>0&&wa<1?.6:.2});C(160,240-28.5*ps,4.4*ps,'#1c2a5a');L(160-4*ps,240-30*ps,160+4*ps,240-30*ps,'#ffffff',1);C(160-5*ps-.6*ps*2,240-12*ps,3*ps,'#8a5a2a');
  hud(15);T('INN '+Math.min(inn,3)+'/3',5,4,K.w,2);T('RUNS '+runs,92,4,runs?K.r:K.w,2);T('B'+cnt.b+' S'+cnt.s,186,4,K.y,2);for(let i=0;i<3;i++)C(258+i*8,8,2.6,i<outs?K.r:'#444455');
  [[300,8],[292,4],[284,8]].forEach((p,i)=>{A.c.save();A.c.translate(p[0],p[1]);A.c.rotate(PI/4);R(-2.5,-2.5,5,5,bs[i]?K.y:'#555566');A.c.restore();});
  PT.forEach((p,i)=>{const sel=i===ty;if(sel)R(2,170+i*11,70,10,'rgba(0,0,0,.5)');T((sel?'> ':'  ')+p[0],6,172+i*11,sel?p[4]:K.gr,1);});T('B: PITCH',6,216,K.gr,1);T('PITCHES '+np,W-6,212,np>60?K.o:K.gr,1,'r');T('K '+ks,W-6,224,K.y,1,'r');
  if(hist.length>=2&&G.c>.45)T('SITTING ON '+PT[G.t][0],W-6,180,'#ff8a8a',1,'r');
  if(ph==='res')T(msg,160,62,mc,msg.length>12?2:3,'c');};
 return g;}});

/* =========================== RUGBY BREAKAWAY =========================== */
A.add({id:'rugbyrun',name:'RUGBY BREAKAWAY',cat:'SPORTS',how:'LEFT/RIGHT WEAVE, UP SPRINTS, B SIDESTEPS, A HANDS OFF TACKLERS. SCORE TRIES.',make(){
 const g={over:null,score:0},TRY=1500,M=15;
 let p,def=[],tries=0,tack=0,st=1,msg='',mc=K.w,mt=0,t=0,fend=0,fcd=0,side=0,sdir=0,scd=0,gain=0,phase=0,after='',ra=0;
 const spawn=(d0,n)=>{for(let i=0;i<n;i++)def.push({x:34+rnd(252),d:d0+i*95+rnd(70),down:0,slow:0,sp:1.12+rnd(.3)+phase*.07,num:2+ri(13),st:rnd(6),id:ri(6)});};
 const setup=()=>{p={x:160,d:0,vx:0,st:0};def=[];spawn(260,5+phase*2);gain=0;st=1;};setup();
 g.update=()=>{t++;if(mt>0){if(--mt===0){if(after==='try'){if(tries>=5){g.over='GRAND SLAM - WIN';return;}phase++;setup();}else if(after==='tack'){if(tack>=3){g.over='TURNOVER - '+tries+' TRIES';return;}def=def.filter(q=>Math.abs(q.d-p.d)>70);spawn(p.d+200,2);}after='';}return;}
  const k=A.in(0),h=A.hit(0);if(fend)fend--;if(fcd)fcd--;if(scd)scd--;
  const spr=k.u&&st>0,fwd=k.d?1:spr?2.45:1.65;st=cl(st+(spr?-.007:.0035),0,1);
  if(h.b&&scd<=0){sdir=ax(k)||(p.x<160?1:-1);side=9;scd=42;S('jump');def.forEach(q=>{if(!q.down&&Math.abs(q.d-p.d)<34&&Math.abs(q.x-p.x)<30){q.slow=50;g.score+=10;A.fx.push({txt:'SIDESTEP!',x:p.x,y:150,vx:0,vy:-.5,t:40,c:K.c,g:0});}});}
  if(h.a&&fcd<=0){fend=14;fcd=34;S('blip');}
  if(side>0){side--;p.vx=sdir*4.4;}else{p.vx+=ax(k)*.55;p.vx*=.8;}p.x=cl(p.x+p.vx,26,294);p.d+=fwd;p.st+=fwd*.11;ra=fend?1:Math.max(0,ra-.1);
  while(p.d>gain+50){gain+=50;g.score+=5;}
  for(const q of def){if(q.down>0){q.down--;continue;}if(q.slow)q.slow--;const behind=q.d<p.d-6,sp=(behind?q.sp+.35:q.sp)*(q.slow?.35:1),tx=p.x+p.vx*7,td=p.d+fwd*10;let dx=tx-q.x,dd=td-q.d;const m=Math.hypot(dx,dd)||1;q.x+=dx/m*sp;q.d+=dd/m*sp;q.st+=sp*.12;
   if(Math.hypot(p.x-q.x,(p.d-q.d)*.9)<10){if(fend>0){q.down=120;fend=0;g.score+=15;S('hit');A.burst(q.x,180-(q.d-p.d)-14,K.w,10,2);A.fx.push({txt:'HAND OFF!',x:p.x,y:140,vx:0,vy:-.5,t:40,c:K.y,g:0});}else{tack++;msg='TACKLED!';mc=K.r;mt=80;after='tack';S('boom');A.shake=8;A.burst(p.x,170,'#8a6a3a',16,2);return;}}}
  if(p.d>=TRY){tries++;g.score+=100;msg='TRY!';mc=K.y;mt=100;after='try';S('win');A.burst(p.x,150,K.y,30,3);A.burst(p.x,150,K.w,20,2);}};
 g.draw=()=>{const sy=d=>180-(d-p.d);A.cls('#2c7a34');
  for(let i=Math.floor((p.d-80)/40);i<(p.d+200)/40;i++){const y=sy(i*40+40);fill(20,y,280,40,i%2?'#2f8838':'#36963f');}
  const ln=(d,c,w,dash)=>{const y=sy(d);if(y<-4||y>H+4)return;if(dash)for(let x=22;x<298;x+=14)R(x,y,8,w,c);else R(20,y,280,w,c);};
  for(let m=10;m<100;m+=10)ln(m*M,'#ffffff',m===50?2:1,m!==50&&m!==22&&m!==78);ln(22*M,'#ffffff',2);ln(78*M,'#ffffff',2);
  {const y0=sy(TRY+150),y1=sy(TRY);if(y1>-10){fill(20,y0,280,y1-y0,'#24703a');for(let i=0;i<6;i++)fill(20,y0+i*25,280,12,'rgba(255,255,255,.05)');ln(TRY,'#ffffff',3);ln(TRY+150,'#ffffff',2);}}
  fill(0,0,20,H,'#3a6a3a');fill(300,0,20,H,'#3a6a3a');R(19,0,2,H,'#ffffff');R(299,0,2,H,'#ffffff');
  for(let i=-1;i<22;i++){const y=((i*12+p.d*1)%12+12)%12+i*12-12;for(let c=0;c<3;c++){fill(2+c*5,y+((c*5)%12),4,5,CRW[(i*3+c*5+Math.floor(p.d/12)*0)%8]);fill(304+c*5,y+((c*7)%12),4,5,CRW[(i*5+c*3+3)%8]);}}
  const pole=d=>{const y=sy(d);if(y<-80||y>H+10)return;[-18,18].forEach(o=>{R(160+o-1,y-72,3,72,'#f4f4f4');R(160+o-3,y-14,7,14,'#2a5ab0');});R(140,y-28,40,3,'#f4f4f4');};
  const ents=def.map(q=>({y:sy(q.d),q}));ents.push({y:180,me:1});ents.sort((a,b)=>a.y-b.y);
  if(sy(TRY)<180)pole(TRY);
  for(const e of ents){if(e.y<-40||e.y>H+40)continue;if(e.me){const fx=p.x,run=Math.sin(p.st)*1.2;A.person(fx,180,{s:1.15,c:'#1e4ab0',pants:'#f2f2f2',num:11,st:p.st,id:2,arm2:ra?3.0:undefined,arm1:.5});for(let i=0;i<3;i++)R(fx-5.6,180-24+i*3.4,11.2,1.4,'#f2f2f2');C(fx,180-28.5*1.15,4.5,'#3a2010');el(fx-6,180-17+run,4.2,2.6,'#8a4a1a',.5);if(side)alpha(.3,()=>A.person(fx-sdir*8,180,{s:1.15,c:'#1e4ab0',pants:'#f2f2f2',id:2}));}
   else{const q=e.q;if(q.down){A.c.save();A.c.translate(q.x,e.y);A.c.rotate(PI/2);A.person(0,0,{s:1.1,c:'#c02030',pants:'#1a1a2a',num:q.num,id:q.id});A.c.restore();}else{A.person(q.x,e.y,{s:1.1,c:'#c02030',pants:'#1a1a2a',num:q.num,st:q.st,id:q.id,arm1:q.slow?2.5:-.4,arm2:q.slow?-2.5:.4});if(q.slow)T('?',q.x,e.y-44,K.y,1,'c');}}}
  if(sy(TRY)>=180)pole(TRY);
  hud(15);T('TRIES '+tries,5,4,K.y,2);T(Math.max(0,Math.ceil((TRY-p.d)/M))+'M TO GO',160,4,K.w,2,'c');for(let i=0;i<3;i++)el(W-36+i*12,8,4,3,i<3-tack?'#a0602a':'#3a3a44');
  meter(6,226,60,5,st,st>.25?K.g:K.r,'SPRINT');R(250,224,64,10,'rgba(0,0,0,.4)');T(scd?'STEP '+Math.ceil(scd/10):'B STEP',254,226,scd?K.gr:K.c,1);if(mt)T(msg,160,96,mc,4,'c');};
 return g;}});

/* =========================== WATER POLO =========================== */
A.add({id:'waterpolo',name:'WATER POLO',cat:'SPORTS',time:150,how:'ARROWS SWIM. A PASSES OR STEALS. B SHOOTS - HOLD UP/DOWN TO PICK A CORNER.',make(){
 const g={over:null,score:0},X0=16,X1=304,Y0=42,Y1=226,GY=134,GH=18;
 let poss=-1,shotc=1200,msg2='',m2=0,sw=[],ball,sc=[0,0],clock=7200,t=0,msg='',mt=0,ctrl=null,stealCd=0,passes=0,phase=0;
 const mk=(x,y,tm,gk)=>({x,y,vx:0,vy:0,tm,gk,dir:tm?PI:0,ph:rnd(6),stun:0,num:sw.length%4+1});
 const reset=(own)=>{sw=[];sw.push(mk(X0+12,GY,0,1),mk(110,90,0,0),mk(130,GY,0,0),mk(110,178,0,0),mk(X1-12,GY,1,1),mk(210,90,1,0),mk(190,GY,1,0),mk(210,178,1,0));ball={x:160,y:GY,vx:0,vy:0,own:null,cd:0,from:-1,shot:0,hold:0};const c=sw.find(s=>s.tm===own&&!s.gk&&s.y===GY);if(c){ball.own=c;c.x=own?178:142;}ctrl=sw[2];};reset(0);
 const wave=(x,y)=>Math.sin(x*.045+t*.035)+Math.sin(y*.06-t*.028);
 const goalX=tm=>tm?X0+3:X1-3;
 const near=(tm,x,y,ex)=>{let b=null,bd=1e9;for(const s of sw)if(s.tm===tm&&!s.gk&&s!==ex){const d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;b=s;}}return b;};
 const steer=(s,tx,ty,mx)=>{const dx=tx-s.x,dy=ty-s.y,m=Math.hypot(dx,dy);if(m>2){s.vx+=dx/m*.16;s.vy+=dy/m*.16;}const v=Math.hypot(s.vx,s.vy);if(v>mx){s.vx*=mx/v;s.vy*=mx/v;}};
 const pass=(s,to)=>{const lead=8;ball.own=null;const tx=to.x+to.vx*lead,ty=to.y+to.vy*lead,d=Math.hypot(tx-s.x,ty-s.y)||1;ball.vx=(tx-s.x)/d*4.2;ball.vy=(ty-s.y)/d*4.2;ball.cd=10;ball.from=s.tm;ball.shot=0;ball.passer=s;S('blip');};
 const shoot=(s,aimY)=>{ball.own=null;const gx=s.tm?X0:X1,gy=GY+aimY,d=Math.hypot(gx-s.x,gy-s.y)||1;ball.vx=(gx-s.x)/d*5.4;ball.vy=(gy-s.y)/d*5.4+(rnd(.4)-.2);ball.cd=12;ball.from=s.tm;ball.shot=1;ball.passer=s;ball.react=6+ri(6);S('shoot');};
 const goal=tm=>{sc[tm]++;if(tm===0){g.score+=100;S('score');A.burst(X1-6,GY,K.y,30,3);}else{S('lose');A.burst(X0+6,GY,K.r,20,2);}msg=tm===0?'GOAL!':'THEY SCORE';mt=90;ball.own=null;ball.vx=ball.vy=0;ball.dead=tm;};
 g.update=()=>{t++;if(mt>0){if(--mt===0){reset(1-ball.dead);}return;}
  if(--clock<=0){const w=sc[0]>sc[1]?0:sc[0]<sc[1]?1:2;if(w===0)g.score+=300;g.over='FINAL '+sc[0]+'-'+sc[1]+(w===0?' - WIN':w===1?' - LOSS':' - DRAW');return;}
  if(stealCd)stealCd--;const own=ball.own,ownT=own?own.tm:-1;if(ownT!==poss){poss=ownT;if(ownT>=0)shotc=1200;}else if(ownT>=0&&--shotc<=0){const o=own;const m=near(1-o.tm,o.x,o.y);if(m){ball.own=m;o.stun=20;msg2='SHOT CLOCK!';m2=60;S('lose');}}if(m2)m2--;
  if(own&&own.tm===0&&!own.gk)ctrl=own;else if(!own||own.tm===1||own.gk){const c=near(0,ball.x,ball.y);if(c&&(!ctrl||ctrl.gk||Math.hypot(c.x-ball.x,c.y-ball.y)+14<Math.hypot(ctrl.x-ball.x,ctrl.y-ball.y)))ctrl=c;}
  const k=A.in(0),h=A.hit(0);
  for(const s of sw){if(s.stun>0){s.stun--;s.vx*=.9;s.vy*=.9;continue;}const has=ball.own===s,mx=(has?1.2:1.55)*(s.tm===1?.86+phase*.04:1);
   if(s===ctrl){s.vx+=ax(k)*.2;s.vy+=ay(k)*.2;const v=Math.hypot(s.vx,s.vy);if(v>mx){s.vx*=mx/v;s.vy*=mx/v;}
    if(has&&h.a){let best=null,bs=-1e9;const dx=ax(k)||1,dy=ay(k);for(const m of sw)if(m.tm===0&&m!==s&&!m.gk){const ex=m.x-s.x,ey=m.y-s.y,d=Math.hypot(ex,ey)||1,sc_=(ex*dx+ey*dy)/d/Math.hypot(dx,dy)-d*.004;if(sc_>bs){bs=sc_;best=m;}}if(best)pass(s,best);}
    else if(has&&h.b)shoot(s,k.u?-GH+4:k.d?GH-4:(sw[4].y>GY?-GH+5:GH-5));
    else if(!has&&h.a&&own&&own.tm===1&&stealCd<=0&&Math.hypot(own.x-s.x,own.y-s.y)<11){stealCd=24;if(rnd(1)<.42){ball.own=s;own.stun=30;S('coin');A.fx.push({txt:'STEAL!',x:s.x,y:s.y-14,vx:0,vy:-.5,t:30,c:K.c,g:0});}else{s.stun=14;S('hit');}}}
   else if(s.gk){const gx=s.tm?X1-10:X0+10;let ty=GY+(ball.y-GY)*.45;if(ball.shot&&ball.from!==s.tm&&(ball.react--)<=0)ty=ball.y+ball.vy*6;steer(s,gx,cl(ty,GY-GH+2,GY+GH-2),s.tm?.95+phase*.08:1.05);s.x=cl(s.x,s.tm?X1-16:X0+4,s.tm?X1-4:X0+16);
    if(has){ball.hold++;if(ball.hold>45){const m=near(s.tm,s.tm?100:220,GY);if(m)pass(s,m);}}}
   else if(s.tm===1){if(has){const ourD=sw.find(o=>o.tm===0&&!o.gk&&Math.hypot(o.x-s.x,o.y-s.y)<14&&o.x<s.x);steer(s,X0+56,GY+Math.sin(t*.02+s.num)*40,mx);if(ourD&&rnd(1)<.04){const m=near(1,X0+70,GY,s);if(m)pass(s,m);}else if(s.x<X0+70||s.x<X0+100&&rnd(1)<.025)shoot(s,sw[0].y>GY?-GH+5:GH-5);}
    else if(ownT===1){const c=own,lane=[86,GY,182][s.num%3];steer(s,cl(c.x-10+(s.num%2)*24,X0+40,X1-30),lane,mx);}
    else if(ownT===0){let tgt=sw.filter(o=>o.tm===0&&!o.gk)[(s.num-1)%3];const pr=near(1,ball.x,ball.y)===s;if(pr)tgt=own||tgt;steer(s,tgt.x+(pr?5:12),tgt.y,mx);if(ball.own&&ball.own===tgt&&!tgt.gk&&Math.hypot(tgt.x-s.x,tgt.y-s.y)<11&&rnd(1)<.01+.004*phase){ball.own=s;tgt.stun=30;S('hit');A.fx.push({txt:'STOLEN',x:s.x,y:s.y-14,vx:0,vy:-.5,t:30,c:K.r,g:0});}}
    else{if(near(1,ball.x,ball.y)===s)steer(s,ball.x,ball.y,mx);else steer(s,200,[86,GY,182][s.num%3],mx*.6);}}
   else{if(ownT===0){const c=own;steer(s,cl(c.x+50,X0+60,X1-40),[80,GY,188][s.num%3],mx*.85);}else if(ownT===1){const tgt=sw.filter(o=>o.tm===1&&!o.gk)[(s.num-1)%3];steer(s,tgt.x-12,tgt.y,mx*.9);}else{if(near(0,ball.x,ball.y)===s)steer(s,ball.x,ball.y,mx);else steer(s,120,[86,GY,182][s.num%3],mx*.6);}}
   s.vx*=.93;s.vy*=.93;const wv=wave(s.x,s.y);s.x+=s.vx+Math.cos(t*.03)*.04*wv;s.y+=s.vy;s.x=cl(s.x,X0+5,X1-5);s.y=cl(s.y,Y0+5,Y1-5);const sp=Math.hypot(s.vx,s.vy);if(sp>.15)s.dir=Math.atan2(s.vy,s.vx);s.ph+=.1+sp*.12;}
  for(let i=0;i<sw.length;i++)for(let j=i+1;j<sw.length;j++){const a=sw[i],b=sw[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<10&&d>0){const o=(10-d)/2;a.x-=dx/d*o;a.y-=dy/d*o;b.x+=dx/d*o;b.y+=dy/d*o;}}
  if(ball.own){const s=ball.own;ball.x=s.x+Math.cos(s.dir)*5;ball.y=s.y+Math.sin(s.dir)*5;ball.shot=0;}
  else{if(ball.cd)ball.cd--;ball.x+=ball.vx;ball.y+=ball.vy;ball.vx*=.975;ball.vy*=.975;ball.vx+=Math.cos(t*.03)*.004*wave(ball.x,ball.y);if(Math.hypot(ball.vx,ball.vy)<1.6)ball.shot=0;
   if(ball.y<Y0+3||ball.y>Y1-3){ball.vy*=-.6;ball.y=cl(ball.y,Y0+3,Y1-3);}
   const inMouth=Math.abs(ball.y-GY)<GH;if(ball.x>X1-3){if(inMouth){goal(0);return;}ball.vx*=-.5;ball.x=X1-3;}if(ball.x<X0+3){if(inMouth){goal(1);return;}ball.vx*=-.5;ball.x=X0+3;}
   for(const s of sw){if(s.stun||(ball.cd&&s===ball.passer))continue;const d=Math.hypot(s.x-ball.x,s.y-ball.y),r=s.gk?11:7;if(d<r){if(s.gk&&ball.shot&&ball.from!==s.tm){if(rnd(1)<.3){ball.vx=-ball.vx*.4;ball.vy=rnd(4)-2;ball.cd=8;ball.passer=s;ball.shot=0;S('hit');A.burst(ball.x,ball.y,K.w,8);continue;}S('hit');A.fx.push({txt:'SAVED',x:s.x,y:s.y-12,vx:0,vy:-.5,t:30,c:s.tm?K.r:K.c,g:0});}if(ball.from===0&&s.tm===0&&!ball.shot&&ball.passer!==s){passes++;g.score+=5;}ball.own=s;ball.hold=0;ball.from=-1;break;}}}};
 g.draw=()=>{A.cls('#1a2440');fill(0,14,W,20,'#2a3048');crowd(-2,16,W+4,3,4,t,mt&&ball.dead===0?2:0);fill(0,32,W,10,'#d8d0c0');fill(0,Y1,W,H-Y1,'#d8d0c0');for(let x=0;x<W;x+=10){R(x,32,9,9,'#e2dccc');R(x,Y1+1,9,13,'#e2dccc');}
  fill(X0,Y0,X1-X0,Y1-Y0,lg(0,Y0,0,Y1,[[0,'#2a8ad0'],[.5,'#1f74bc'],[1,'#1a64a8']]));alpha(.12,()=>{for(let y=Y0+12;y<Y1;y+=16)L(X0,y,X1,y,'#0a3a6a');});
  alpha(.22,()=>{for(let y=Y0+6,j=0;y<Y1;y+=10,j++)for(let x=X0+((j*13)%24),i=0;x<X1-8;x+=24,i++){const o=Math.sin(t*.035+i*.9+j*1.3)*5;L(x+o,y,x+o+9,y+Math.sin(t*.05+i)*1.2,'#d8f0ff');}});
  for(let x=X0;x<X1;x+=6){R(x,Y0,4,3,['#ff4040','#ffffff','#2050e0'][(x/6|0)%3]);R(x,Y1-3,4,3,['#ff4040','#ffffff','#2050e0'][(x/6|0)%3]);}
  [[X0+30,'#e03030'],[X0+75,'#ffcf3f'],[X1-30,'#e03030'],[X1-75,'#ffcf3f']].forEach(([x,c])=>{R(x-1,Y0-4,3,4,c);R(x-1,Y1,3,4,c);});
  [[X0,-1],[X1,1]].forEach(([x,d])=>{alpha(.5,()=>{for(let i=0;i<5;i++)L(x,GY-GH+i*9,x+d*10,GY-GH+i*9,'#ffffff');for(let i=0;i<3;i++)L(x+d*i*4,GY-GH,x+d*i*4,GY+GH,'#ffffff');});R(x-1,GY-GH-1,3,3,'#ffffff');R(x-1,GY+GH-1,3,3,'#ffffff');L(x,GY-GH,x,GY+GH,'#ffffff',2);});
  const refx=cl(ball.x,40,280);A.person(refx,40,{s:.7,c:'#f4f4f4',pants:'#f4f4f4',id:3,arm2:-1.6});A.person(refx,H,{s:.5,c:'#f4f4f4',pants:'#f4f4f4',id:1,arm1:1.6});
  for(const s of sw){const c=Math.cos(s.dir),n=Math.sin(s.dir),sk=SKN[(s.num+s.tm*2)%5];alpha(.4,()=>el(s.x-c*7.5,s.y-n*7.5,10,4,sk,s.dir));const st=Math.sin(s.ph);[[1,st],[-1,-st]].forEach(([sd,ph])=>{const ex=s.x+c*(2.5+ph*7.5)-n*sd*5,ey=s.y+n*(2.5+ph*7.5)+c*sd*5;L(s.x-n*sd*3.2,s.y+c*sd*3.2,ex,ey,sk,2.4);if(ph>.85&&Math.hypot(s.vx,s.vy)>.4)alpha(.7,()=>C(ex,ey,1.5,'#ffffff'));});
   alpha(.3,()=>A.ring(s.x,s.y,6.5+Math.sin(s.ph*.5)*1.2,'#bfe8ff'));const cap=s.gk?'#d02020':s.tm?'#1a2a7a':'#f4f4f4';C(s.x,s.y,4.3,cap);C(s.x-n*3.9,s.y+c*3.9,1.4,s.tm&&!s.gk?'#6a8ae0':'#aaaaaa');C(s.x+n*3.9,s.y-c*3.9,1.4,s.tm&&!s.gk?'#6a8ae0':'#aaaaaa');
   if(s===ctrl){A.poly([[s.x-3,s.y-13],[s.x+3,s.y-13],[s.x,s.y-9]],K.y,1);}if(s.stun)T('*',s.x,s.y-12,K.w,1,'c');}
  alpha(.35,()=>el(ball.x+1,ball.y+2,3,1.6,'#002040'));C(ball.x,ball.y-Math.abs(Math.sin(t*.1))*.8,3.3,'#ffd23a');L(ball.x-2,ball.y,ball.x+2,ball.y,'#2a50c0',.8);
  hud(14);T('HOME '+sc[0],5,4,K.w,2);T('AWAY '+sc[1],W-5,4,'#8aa8ff',2,'r');const s_=Math.ceil(clock/60);T((s_/60|0)+':'+String(s_%60).padStart(2,'0'),160,4,clock<600?K.r:K.y,2,'c');
  if(mt)T(msg,160,110,ball.dead===0?K.y:K.r,4,'c');if(m2)T(msg2,160,60,K.o,2,'c');if(poss===0&&shotc<300)T('SHOT CLOCK '+Math.ceil(shotc/60),160,216,K.o,1,'c');};
 return g;}});

/* =========================== FENCING (VS) =========================== */
A.add({id:'fencing',name:'FENCING',cat:'SPORTS',vs:1,how:'LEFT/RIGHT ADVANCE AND RETREAT. A LUNGES, B PARRIES. FIRST TO 5 TOUCHES.',make(){
 const g={over:null,score:0},PL=24,PR=296,FY=192,SC=1.3,TIP=41;
 let f,sc=[0,0],freeze=0,msg='',lamp=[0,0],t=0,mem=[],ai={plan:64,pt:0,seen:-1},lid=0,after=-1;
 const reset=()=>{f=[0,1].map(i=>({x:i?196:124,dir:i?-1:1,lg:0,rec:0,par:0,pcd:0,stun:0,st:1.1,hit:false,id:0}));mem=[];};reset();
 const tip=q=>q.x+q.dir*(TIP+(q.lg?1:0));
 const touch=(i,why)=>{sc[i]++;lamp[i]=1;freeze=90;msg=why;S('score');const o=f[1-i];A.burst(o.x,FY-26,i?'#3dff8b':'#ff4f6d',18,2.5);A.shake=4;after=sc[i]>=5?i:-1;};
 g.timeUp=()=>sc[0]===sc[1]?'TIME UP - DRAW':'TIME UP - '+A.win(sc[0]>sc[1]?0:1);
 const act=(i)=>{const q=f[i];if(i===0||A.two){const k=A.in(i),h=A.hit(i);return{fw:q.dir>0?k.r:k.l,bk:q.dir>0?k.l:k.r,lunge:h.a,parry:h.b};}
  const o=f[0],d=q.x-o.x,delay=Math.round(15-11*A.ai);mem.push({lg:o.lg,id:o.id,rec:o.rec});if(mem.length>30)mem.shift();const ob=mem[Math.max(0,mem.length-1-delay)];const r={fw:false,bk:false,lunge:false,parry:false};
  if(ob.lg>0&&ob.lg<9&&d<72&&ai.seen!==ob.id){ai.seen=ob.id;if(rnd(1)<.22+.6*A.ai){r.parry=true;return r;}}
  if(o.stun>0&&d<64&&rnd(1)<.25+.5*A.ai){r.lunge=true;return r;}
  if(ob.rec>0&&d<62&&rnd(1)<.1+.25*A.ai){r.lunge=true;return r;}
  if(d<57&&o.lg===0&&rnd(1)<.012+.035*A.ai){r.lunge=true;return r;}
  if(--ai.pt<=0){ai.pt=20+ri(30);ai.plan=50+rnd(34);}if(q.x>PR-26)r.fw=true;else if(d>ai.plan+4)r.fw=true;else if(d<ai.plan-4)r.bk=true;return r;};
 g.update=()=>{t++;if(freeze>0){if(--freeze===0){if(after>=0){g.over=A.win(after);return;}lamp=[0,0];reset();}return;}
  const hits=[];
  for(let i=0;i<2;i++){const q=f[i],c=act(i);if(q.pcd>0)q.pcd--;if(q.par>0)q.par--;
   if(q.stun>0){q.stun--;continue;}
   if(q.lg>0){q.lg++;if(q.lg<=10)q.x+=q.dir*1.8;q.st=PI/2;if(q.lg>=6&&q.lg<=10&&!q.hit){const o=f[1-i],tp=tip(q);if(q.dir*(o.x-tp)<=5){q.hit=true;if(o.par>0){q.lg=0;q.rec=0;q.stun=32;o.par=0;o.pcd=0;S('hit');A.burst(tp,FY-26,'#ffffff',10,2);A.fx.push({txt:'PARRY!',x:o.x,y:FY-60,vx:0,vy:-.4,t:36,c:K.w,g:0});}else hits.push(i);}}if(q.lg>10){q.lg=0;q.rec=18;}continue;}
   if(q.rec>0){q.rec--;q.x-=q.dir*1.0;q.st=1.1+q.rec/18*.4;continue;}
   if(c.lunge){q.lg=1;q.hit=false;q.id=++lid;S('shoot');continue;}
   if(c.parry&&q.pcd===0){q.par=12;q.pcd=26;S('blip');}
   if(c.fw){q.x+=q.dir*1.2;q.st+=.22;}else if(c.bk){q.x-=q.dir*1.05;q.st-=.22;}else q.st+=(1.1-q.st)*.2;}
  if(f[1].x-f[0].x<26){const m=(f[0].x+f[1].x)/2;f[0].x=m-13;f[1].x=m+13;}
  if(hits.length===2){freeze=60;msg='DOUBLE - NO POINT';S('hit');lamp=[1,1];after=-1;return;}
  if(hits.length===1){touch(hits[0],'TOUCH!');return;}
  for(let i=0;i<2;i++)if(f[i].x<PL||f[i].x>PR){touch(1-i,'OFF THE PISTE');return;}};
 const fencer=(q,i)=>{const lf=q.lg?Math.min(1,q.lg/5):0,x=q.x,y=FY+lf*3,s=SC,d=q.dir,parA=q.par>0?.9:0,wa=d*-(1.3+lf*.27),ra=d*2.35;
  A.person(x,y,{s,c:'#f4f4f4',pants:'#ececec',d,st:q.st,arm1:d>0?ra:wa,arm2:d>0?wa:ra,id:i?3:1,hair:i?'#2a1a10':'#c89040'});
  alpha(.55,()=>A.poly([[x-5*s,y-23*s],[x+5*s,y-23*s],[x+4.4*s,y-14*s],[x-4.4*s,y-14*s]],'#b8bec8',1));R(x-4.4*s,y-13.5*s,8.8*s,1.5*s,i?'#2fbf6a':'#e8455f');
  const hx=x,hy=y-28.5*s;C(hx+d*.6,hy,4.7*s,'#34343c');alpha(.5,()=>{for(let k=-3;k<=3;k+=1.5)L(hx+d*.6+k*s,hy-4*s,hx+d*.6+k*s,hy+4*s,'#8a8a96',.6);});R(hx-3*s,hy+3.6*s,6*s,2*s,'#f4f4f4');
  const sx=x+d*5*s,sy=y-21*s,a=wa,hx2=sx-Math.sin(a)*10*s,hy2=sy+Math.cos(a)*10*s,ba=d>0?0:PI,ang=ba-d*(parA+(lf?0:.12)),tx=hx2+Math.cos(ang)*22,ty=hy2+Math.sin(ang)*22;
  L(hx2,hy2,tx,ty,'#e8eef8',1.2);el(hx2+d*1.5,hy2,1.4,3,'#c8ccd4');C(tx,ty,.9,'#ffffff');};
 g.draw=()=>{A.cls('#141626');fill(0,0,W,120,lg(0,0,0,120,[[0,'#0c0e1c'],[1,'#22263c']]));crowd(-2,62,W+4,4,4,t,freeze&&!msg.startsWith('D')?2:0);alpha(.55,()=>fill(0,58,W,40,'#0a0c18'));
  for(let i=0;i<5;i++)R(10+i*64,30,50,14,['#2a3a7a','#7a2a3a','#2a6a4a','#6a5a2a','#4a2a6a'][i]);
  alpha(.07,()=>{A.poly([[110,0],[130,0],[200,FY+8],[60,FY+8]],'#fff8e0',1);A.poly([[190,0],[210,0],[260,FY+8],[120,FY+8]],'#fff8e0',1);});
  fill(0,120,W,H-120,lg(0,120,0,H,[[0,'#2a2c3c'],[1,'#14141e']]));
  A.poly([[14,FY-9],[306,FY-9],[318,FY+9],[2,FY+9]],'#7a8290',1);A.poly([[14,FY-9],[306,FY-9],[308,FY-5],[12,FY-5]],'#a8b0bc',1);
  alpha(.35,()=>{A.poly([[14,FY-9],[PL+30,FY-9],[PL+28,FY+9],[2,FY+9]],'#ff3a3a',1);A.poly([[PR-30,FY-9],[306,FY-9],[318,FY+9],[PR-28,FY+9]],'#ff3a3a',1);});
  [[160,2],[124,1],[196,1],[PL,1],[PR,1]].forEach(([x,w])=>L(x,FY-9,x+(x-160)*.04,FY+9,'#ffffff',w));
  R(118,24,84,34,'#101014');A.box(118,24,84,34,'#4a4a5a');C(134,38,8,lamp[0]?'#ff3040':'#401018');C(186,38,8,lamp[1]?'#30ff70':'#103018');if(lamp[0])alpha(.25,()=>C(134,38,16,'#ff3040'));if(lamp[1])alpha(.25,()=>C(186,38,16,'#30ff70'));T(sc[0]+'-'+sc[1],160,32,K.y,2,'c');R(158,58,4,40,'#3a3a46');
  A.person(160,FY-16,{s:.9,c:'#1a1a24',pants:'#24242e',id:4,arm1:lamp[0]?2.6:0,arm2:lamp[1]?-2.6:0});
  fencer(f[0],0);fencer(f[1],1);
  T(A.nm(0),134,52,'#ff8a9a',1,'c');T(A.nm(1),186,52,'#8affb0',1,'c');
  for(let i=0;i<2;i++){const q=f[i];if(q.par>0)T('PARRY',q.x,FY-56,K.c,1,'c');if(q.stun>0)T('STUNNED',q.x,FY-56,K.o,1,'c');}
  if(freeze)T(msg,160,96,lamp[0]&&!lamp[1]?'#ff8a9a':lamp[1]&&!lamp[0]?'#8affb0':K.w,msg.length>10?2:3,'c');else if(t<70)T('EN GARDE!',160,96,K.y,3,'c');};
 return g;}});

/* =========================== TRACK CYCLING =========================== */
A.add({id:'trackcycle',name:'TRACK CYCLING',cat:'SPORTS',how:'A SPRINTS, B EASES OFF, UP/DOWN SWITCH LINE. SIT IN THE DRAFT, THEN JUMP.',make(){
 const g={over:null,score:0},LAP=700,LAPS=3,FIN=LAP*LAPS,MX=110;
 let me,rv,cnt,msg='',mc=K.w,mt=0,t=0,rd=1,res=-1,react=0;
 const start=()=>{me={d:0,v:0,ln:0,ly:0,st:1,cr:0,laps:0,e:0};rv={d:14,v:0,ln:0,ly:0,st:1,cr:2,laps:0,e:0,go:FIN-(250+rnd(170)),pw:.83+rd*.07+rnd(.04),jump:false,lt:120};cnt=150;res=-1;react=0;};start();
 const draft=(q,o)=>q.ln===o.ln&&o.d-q.d>3&&o.d-q.d<60;
 const upd=(q,o,e)=>{if(q.st<=0)e=Math.min(e,.32);q.e=e;const dr=draft(q,o),tgt=1.9+e*1.5+(dr?.32:0),prev=q.ly;q.ly+=(q.ln-q.ly)*.08;const dl=q.ly-prev;q.v+=(tgt-q.v)*.025-dl*.9;q.d+=q.v;q.st=cl(q.st+(e>.6?-.0075*e:.0022+(e<.4?.0012:0)+(dr?.003:0)),0,1);q.cr+=q.v*.11;q.dr=dr;};
 g.update=()=>{t++;if(mt>0){if(--mt===0){if(res===0){rd++;if(rd>4){g.over='GOLD MEDAL - WIN';return;}start();}else{g.over='ELIMINATED IN ROUND '+rd;return;}}return;}
  if(cnt>0){cnt--;if(cnt===0)S('coin');else if(cnt%50===0)S('blip');return;}
  const k=A.in(0),h=A.hit(0);if(h.u&&me.ln===0){me.ln=1;S('blip');}if(h.d&&me.ln===1){me.ln=0;S('blip');}
  const gap=rv.d-me.d;let re=.5;if(!rv.jump){if(rv.d>=rv.go||(me.e>.9&&me.d>FIN-520&&(react+=1)>18-rd*3))rv.jump=true;else if(gap>0)re=gap>60?.65:.36;else re=gap<-45?.78:.52;if(--rv.lt<=0){rv.lt=150+ri(200);if(rnd(1)<.4)rv.ln=1-rv.ln;}}
  if(rv.jump){re=rv.pw;if(me.ln===rv.ln&&gap<0&&gap>-30)rv.ln=1-rv.ln;}
  const om=me.d,orv=rv.d;upd(me,rv,k.a?1:k.b?.3:.5);upd(rv,{d:om,ln:me.ln},re);
  const ml=Math.floor(me.d/LAP);if(ml>me.laps&&me.d<FIN){me.laps=ml;g.score+=10;S('coin');if(ml===LAPS-1){msg='BELL LAP!';mc=K.y;mt=0;}}
  if(me.d>=FIN||rv.d>=FIN){const fm=me.d>=FIN?(FIN-om)/(me.d-om):9,fr=rv.d>=FIN?(FIN-orv)/(rv.d-orv):9;res=fm<=fr?0:1;const marg=Math.abs(fm-fr)/60+Math.abs(me.d-rv.d)/Math.max(1,me.v)/60;if(res===0){g.score+=100*rd+Math.round(marg*100);msg='WON BY '+marg.toFixed(2)+' S';mc=K.y;S('win');A.burst(MX,170,K.y,30,3);}else{msg='BEATEN BY '+marg.toFixed(2)+' S';mc=K.r;S('lose');}mt=130;}};
 const leg=(hx,hy,px,py,col,w)=>{const l=10,dx=px-hx,dy=py-hy,d=Math.min(19.6,Math.hypot(dx,dy)),mx=hx+dx/2,my=hy+dy/2,hh=Math.sqrt(Math.max(0,l*l-d*d/4)),n=Math.hypot(dx,dy)||1,kx=mx+(-dy/n)*-hh,ky=my+(dx/n)*-hh;L(hx,hy,kx,ky,col,w);L(kx,ky,px,py,col,w*.85);return[kx,ky];};
 const rider=(x,y,cr,col,dark,num,sc)=>{const c=A.c;c.save();c.translate(x,y);c.scale(sc,sc);
  const bb=[-1,-8],cp=[bb[0]+Math.cos(cr+PI)*5,bb[1]+Math.sin(cr+PI)*5],hip=[-6,-23],sh=[7,-31];leg(hip[0],hip[1],cp[0],cp[1],dark,3.2);
  C(-11,-9,9,'#1e1e24');A.ring(-11,-9,9,'#55555f');C(-11,-9,2,'#888890');A.ring(11,-9,9,'#2a2a30');for(let k=0;k<3;k++){const a=-cr*.9+k*PI/3;L(11-Math.cos(a)*8.5,-9-Math.sin(a)*8.5,11+Math.cos(a)*8.5,-9+Math.sin(a)*8.5,'#9a9aa4',.5);}A.ring(11,-9,9.3,'#101014');
  [[-11,-9,-1,-8],[-1,-8,-6,-21],[-6,-21,-11,-9],[-6,-21,8,-21],[8,-21,-1,-8],[8,-21,11,-9]].forEach(s=>L(s[0],s[1],s[2],s[3],'#d8dce4',1.8));R(-9,-23,6,2,'#222228');L(8,-21,12,-22,'#222',1.6);L(12,-22,12,-18,'#222',1.6);
  const cf=[bb[0]+Math.cos(cr)*5,bb[1]+Math.sin(cr)*5];
  L(hip[0],hip[1],sh[0],sh[1],col,5.5);L(hip[0]-1,hip[1]+1,hip[0]+4,hip[1]-2,col,4);const k2=leg(hip[0],hip[1],cf[0],cf[1],col,3.4);R(cf[0]-2,cf[1]-1,4,2,'#f4f4f4');
  L(sh[0],sh[1],10,-25,col,2.4);L(10,-25,12,-22,'#e0a57c',2);
  el(sh[0]+4,sh[1]-3,4.2,3.6,'#f1c7a3');A.poly([[sh[0]-4,sh[1]-5],[sh[0]+3,sh[1]-8.5],[sh[0]+8.5,sh[1]-5],[sh[0]+4,sh[1]-2.5]],dark,1);A.poly([[sh[0]+4,sh[1]-5],[sh[0]+8.6,sh[1]-5],[sh[0]+8,sh[1]-3.6],[sh[0]+4.6,sh[1]-3.6]],'#40c0ff',1);
  c.fillStyle='#ffffff';c.font='bold 4px monospace';c.textAlign='center';if(c.fillText)c.fillText(num,-1,-24);c.restore();};
 g.draw=()=>{const cam=me.d-MX;fill(0,0,W,46,lg(0,0,0,46,[[0,'#0c1020'],[1,'#1c2236']]));for(let i=0;i<8;i++){const x=((i*60-cam*.08)%480+480)%480-80;A.poly([[x,0],[x+40,0],[x+70,30],[x+30,30]],'#2a3048',1);R(x+30,6,16,4,'#fff6d0');}
  fill(0,46,W,78,'#1c2030');crowd(-((cam*.3)%13)-13,52,W+30,7,5,t,mt&&res===0?2:0);
  fill(0,122,W,12,'#e8e8ec');for(let i=-1;i<7;i++){const x=i*60-((cam%60)+60)%60;R(x+2,124,56,8,['#2a5ab0','#c02a3a','#ffcf3f','#2a9a5a'][(Math.floor((cam)/60)+i+40)%4]);T(['VELO','SPRINT','TRACK','KEIRIN'][(Math.floor(cam/60)+i+40)%4],x+30,126,K.w,1,'c');}
  fill(0,134,W,80,lg(0,134,0,214,[[0,'#b07a46'],[1,'#d29a62']]));alpha(.18,()=>{for(let i=0;i<24;i++){const x=i*16-((cam%16)+16)%16;L(x,134,x-6,214,'#5a3a1a');}});
  R(0,160,W,2,'#2a6ad8');R(0,186,W,2,'#d82a2a');R(0,198,W,1,'#111111');fill(0,204,W,10,'#3a86d0');fill(0,214,W,26,'#2a3a52');
  for(let k=0;k<=LAPS;k++){const x=MX+(k*LAP-me.d);if(x>-10&&x<W+10){R(x-3,134,6,80,'#f4f4f4');R(x-.5,134,1.5,80,'#111111');}}
  A.person(40-((cam*1)%400+400)%400+400,236,{s:.8,c:'#d02a2a',pants:'#202030',id:2,arm2:-2.4});A.person(250-((cam*1)%420+420)%420+420,236,{s:.8,c:'#2a8a3a',pants:'#202030',id:5});
  const ys=q=>196-q.ly*26,list=[{q:rv,x:MX+(rv.d-me.d),col:'#c8282a',dk:'#7a1818',n:2},{q:me,x:MX,col:'#2a5ae0',dk:'#14306a',n:1}];list.sort((a,b)=>ys(a.q)-ys(b.q));
  for(const r of list){const sc=.92+(1-r.q.ly)*.08;if(r.x>-30&&r.x<W+30){alpha(.25,()=>el(r.x,ys(r.q),18*sc,2,'#000'));rider(r.x,ys(r.q),r.q.cr,r.col,r.dk,r.n,sc);if(r.q.dr&&r.q===me)alpha(.25+.15*Math.sin(t*.4),()=>{for(let i=0;i<3;i++)L(r.x+14+i*7,ys(r.q)-30+i*4,r.x+22+i*7,ys(r.q)-30+i*4,'#ffffff');});}else{const ax_=r.x<0?8:W-8;A.poly(r.x<0?[[2,ys(r.q)-20],[10,ys(r.q)-26],[10,ys(r.q)-14]]:[[W-2,ys(r.q)-20],[W-10,ys(r.q)-26],[W-10,ys(r.q)-14]],r.col,1);T(Math.abs(Math.round((r.q.d-me.d)/7))+'M',ax_+(r.x<0?6:-6),ys(r.q)-36,K.w,1,r.x<0?'l':'r');}}
  hud(15);T('ROUND '+rd+'/4',5,4,K.y,2);const lp=Math.min(LAPS,Math.floor(me.d/LAP)+1);T('LAP '+lp+'/'+LAPS,150,4,lp===LAPS?K.o:K.w,2,'c');
  A.c.save();A.c.strokeStyle='#8a90a8';A.c.lineWidth=3;A.c.beginPath();A.c.ellipse(286,8,22,5.5,0,0,TAU);A.c.stroke();A.c.restore();[[rv,'#ff5050'],[me,'#60a0ff']].forEach(([q,c])=>{const a=q.d/LAP*TAU;C(286+Math.cos(a)*22,8+Math.sin(a)*5.5,2.2,c);});
  meter(6,222,70,6,me.st,me.st>.3?K.g:K.r,'STAMINA');if(me.dr)T('DRAFTING',84,222,K.c,1);T(me.e>.9?'SPRINT!':me.e<.4?'EASING OFF':'A SPRINT  B EASE',W-6,222,me.e>.9?K.o:me.e<.4?K.c:K.gr,1,'r');T(Math.round(me.v*24)+' KMH',W-6,230,K.w,1,'r');
  if(cnt>0)T(cnt>100?'3':cnt>50?'2':'1',160,70,K.y,5,'c');else if(t<cnt+200&&me.d<60)T('GO!',160,70,K.g,4,'c');if(mt)T(msg,160,70,mc,3,'c');else if(me.laps===LAPS-1&&me.d<LAP*(LAPS-1)+120)T('BELL LAP!',160,70,K.y,3,'c');};
 return g;}});

/* =========================== FIGURE SKATING =========================== */
A.add({id:'figureskate',name:'FIGURE SKATING',cat:'SPORTS',how:'PRESS A, B OR THE ARROW AS EACH MOVE HITS THE RING. HOLD B THROUGH SPINS.',make(){
 const g={over:null,score:0},TX=44,SPD=2.3,JN=['AXEL','LUTZ','FLIP','LOOP','SALCHOW','TOE LOOP'];
 let nN=0,T0=0,notes=[],prog=0,ph='prog',pt=0,sk={x:160,vx:1.1,st:'glide',at:0,rot:0,hold:null},pts=0,maxp=0,acc=[0,0],streak=0,judge=[],tech=[0,0],comp=[0,0],fb='',fc=K.w,ft=0,el_='',elt=0;
 const build=lv=>{notes=[];let tt=T0+130;const n=lv?22:16,gap=lv?44:58;for(let i=0;i<n;i++){const r=rnd(1);if(r<.32){notes.push({k:'a',t:tt,nm:(ri(2)+2===3?'TRIPLE ':'DOUBLE ')+JN[ri(6)]});tt+=gap+10;}else if(r<.55){const len=40+ri(30);notes.push({k:'b',t:tt,len,nm:['CAMEL SPIN','SIT SPIN','LAYBACK SPIN','UPRIGHT SPIN'][ri(4)]});tt+=len+gap;}else{const m=3+ri(lv?3:2);for(let j=0;j<m;j++){notes.push({k:'lrud'[ri(4)],t:tt,nm:j?'':'STEP SEQUENCE'});tt+=lv?15:20;}tt+=Math.round(gap*.7);}}notes.forEach(q=>{q.res=null;nN++;});prog=lv;};
 build(0);
 const grade=(q,d)=>{const a=Math.abs(d),p=a<=4?['PERFECT',10,K.y]:a<=8?['GREAT',7,K.g]:['GOOD',4,K.c];q.res=p[0];let v=p[1]*(q.k==='a'?1.5:1)*(1+Math.min(1,streak*.05));streak++;pts+=v;g.score=Math.round(pts);fb=p[0];fc=p[2];ft=30;acc[prog]+=p[1];if(q.nm){el_=q.nm;elt=60;}};
 const miss=q=>{q.res='MISS';streak=0;fb='MISS';fc=K.r;ft=30;if(q.k==='a'){sk.st='fall';sk.at=0;S('boom');pts=Math.max(0,pts-3);g.score=Math.round(pts);}else S('lose');};
 g.update=()=>{pt++;const T_=pt;if(ft)ft--;if(elt)elt--;
  if(ph==='judge'){if(pt>=T0+200){if(prog===0){T0=pt;ph='prog';build(1);}else{const tot=tech[0]+tech[1]+comp[0]+comp[1],r=(acc[0]+acc[1])/Math.max(1,nN*10);g.score=Math.round(tot*10);g.over=r>=.78?'GOLD MEDAL - WIN':r>=.6?'SILVER MEDAL':r>=.42?'BRONZE MEDAL':'NO MEDAL';}}return;}
  const h=A.hit(0),k=A.in(0);
  if(sk.st!=='fall'&&sk.st!=='jump'){sk.x+=sk.vx;if(sk.x>270||sk.x<50)sk.vx=-sk.vx;}
  sk.at++;if(sk.st==='jump'){sk.rot+=TAU*2.6/40;sk.x+=sk.vx*1.4;if(sk.at>=40){sk.st='glide';sk.rot=0;A.burst(sk.x,206,'#dff4ff',8,1.5);}}else if(sk.st==='fall'&&sk.at>50)sk.st='glide';else if(sk.st==='step'&&sk.at>14)sk.st='glide';else if(sk.st==='slip'&&sk.at>16)sk.st='glide';
  if(sk.hold){const q=sk.hold;sk.rot+=.45;if(!k.b){const fr=cl((T_-q.t)/q.len,0,1);pts+=fr*8;g.score=Math.round(pts);fb=fr>.9?'FULL SPIN':'SHORT SPIN';fc=fr>.9?K.y:K.o;ft=30;sk.hold=null;sk.st='glide';sk.rot=0;}else if(T_>=q.t+q.len){pts+=8;g.score=Math.round(pts);fb='FULL SPIN';fc=K.y;ft=30;sk.hold=null;sk.st='glide';sk.rot=0;S('score');}}
  for(const key of['a','b','l','r','u','d'])if(h[key]){let best=null;for(const q of notes)if(!q.res&&q.k===key&&Math.abs(q.t-T_)<=14&&(!best||Math.abs(q.t-T_)<Math.abs(best.t-T_)))best=q;
   if(best){grade(best,best.t-T_);if(key==='a'){sk.st='jump';sk.at=0;sk.rot=0;S('jump');}else if(key==='b'){sk.st='spin';sk.at=0;sk.hold=best;S('coin');}else{sk.st='step';sk.at=0;S('blip');}}
   else if(!notes.some(q=>!q.res&&Math.abs(q.t-T_)<26)&&sk.st==='glide'){sk.st='slip';sk.at=0;pts=Math.max(0,pts-1);fb='WOBBLE';fc=K.o;ft=20;}}
  for(const q of notes)if(!q.res&&T_-q.t>14)miss(q);
  const last=notes[notes.length-1];if(!sk.hold&&last&&last.res&&T_>last.t+(last.len||0)+80){const n=notes.length,a=acc[prog]/(n*10);tech[prog]=+(pts-(prog?tech[0]:0)).toFixed(2);judge=[];for(let i=0;i<5;i++)judge.push(cl(4+a*5.6+rnd(.8)-.4,0,10));comp[prog]=+(judge.reduce((s,v)=>s+v,0)*(prog?2:1)).toFixed(2);T0=pt;ph='judge';S('win');}};
 g.draw=()=>{const t=pt;fill(0,0,W,120,lg(0,0,0,120,[[0,'#0a0c1e'],[1,'#1e2440']]));crowd(-2,46,W+4,7,4,t,ph==='judge'?2:0);alpha(.08,()=>{A.poly([[60,0],[90,0],[sk.x+30,200],[sk.x-30,200]],'#ffffff',1);});
  fill(0,118,W,26,'#f4f6fa');for(let x=0;x<W;x+=64)R(x+3,122,58,16,['#1a5ab0','#c0203a','#1a8a7a','#e8a020','#5a2aa0'][(x/64)%5]);R(0,116,W,3,'#2a6ae0');
  for(let i=0;i<5;i++){A.person(18+i*14,128,{s:.5,c:'#2a2a3a',id:i});}R(8,124,74,12,'#3a2a20');
  fill(0,144,W,H-144,lg(0,144,0,H,[[0,'#cfe4f2'],[1,'#f2f8fc']]));alpha(.25,()=>{for(let i=0;i<8;i++){A.c.strokeStyle='#9ab8d0';A.c.lineWidth=.6;A.c.beginPath();A.c.ellipse(80+i*30,190+(i%3)*12,40+i*5,6+i%2*3,0,0,PI);A.c.stroke();}});
  const draw=(ref)=>{const c=A.c,y0=206,jy=sk.st==='jump'?-Math.sin(sk.at/40*PI)*30:0,sx=Math.cos(sk.rot),d=sk.vx>0?1:-1;c.save();c.translate(sk.x,ref?y0*2-y0:y0+jy);if(ref)c.scale(1,-1);
   if(sk.st==='fall'){c.rotate(d*PI/2*Math.min(1,sk.at/8));c.translate(0,0);}else if(sk.st==='slip')c.rotate(Math.sin(sk.at*.8)*.2);
   c.scale((sk.st==='jump'||sk.st==='spin'||sk.hold)?(Math.abs(sx)<.15?.15*Math.sign(sx||1):sx):1,1);
   const up=sk.st==='spin'||sk.hold,jumping=sk.st==='jump',stp=sk.st==='step'?Math.sin(sk.at*.5):0;
   A.person(0,0,{s:1.25,c:'#d0206a',pants:'#e8c0a8',d:sx<0?-d:d,st:sk.st==='glide'?Math.sin(t*.05)*.5:stp,id:0,hair:'#2a1a10',arm1:up?2.9:jumping?.3:1.35+stp*.5,arm2:up?-2.9:jumping?-.3:-1.35+stp*.5});
   A.poly([[-5.5,-15],[5.5,-15],[8,-10],[-8,-10]],'#ff4f9a',1);R(-3,-1,6,1.5,'#f4f4f4');L(-4,.8,4,.8,'#c0c8d0',1);C(-1,-32.5*1.25+3,2.2,'#2a1a10');c.restore();};
  alpha(.22,()=>draw(true));draw(false);if(sk.hold)alpha(.5,()=>A.ring(sk.x,206,14+Math.sin(t*.5)*2,'#ffffff'));
  R(0,15,W,28,'rgba(10,10,30,.6)');R(0,28,W,1,'rgba(255,255,255,.2)');A.ring(TX,29,10,K.w);A.ring(TX,29,11,'rgba(255,255,255,.4)');
  for(const q of notes){if(q.res&&q.res!=='MISS'&&!(sk.hold===q))continue;const x=TX+(q.t-t)*SPD;if(x>W+10||x<-40)continue;const col=q.k==='a'?'#ffcf3f':q.k==='b'?'#ff4f9a':'#2fd6c3';
   if(q.k==='b'){const x2=TX+(q.t+q.len-t)*SPD;R(Math.max(TX,x),25,Math.max(0,x2-Math.max(TX,x)),8,'rgba(255,79,154,.5)');}if(q.res==='MISS'){alpha(.35,()=>C(x,29,7,'#666677'));continue;}if(sk.hold===q&&x<TX)continue;
   C(x,29,7.5,col);if(q.k==='a'||q.k==='b')T(q.k,x,27,K.k,1,'c');else{const r={l:PI,r:0,u:-PI/2,d:PI/2}[q.k];A.poly([[x+Math.cos(r)*5,29+Math.sin(r)*5],[x+Math.cos(r+2.4)*4,29+Math.sin(r+2.4)*4],[x+Math.cos(r-2.4)*4,29+Math.sin(r-2.4)*4]],'#0a2a2a',1);}}
  hud(14);T(prog?'FREE SKATE':'SHORT PROGRAM',5,4,K.c,1);T('SCORE '+g.score,W-5,4,K.y,1,'r');if(streak>2)T('X'+streak,160,4,K.o,1,'c');
  if(ft)T(fb,TX+20,48,fc,2);if(elt)T(el_,W-8,48,K.w,1,'r');if(t<T0+110&&ph==='prog')T(prog?'FREE SKATE - FASTER':'A JUMP  B HOLD SPIN  ARROWS STEP',160,90,K.w,1,'c');
  if(ph==='judge'){R(40,70,240,96,'rgba(0,0,0,.75)');A.box(40,70,240,96,K.y);T(prog?'FREE SKATE':'SHORT PROGRAM',160,76,K.y,1,'c');const n=Math.min(5,Math.floor((t-T0)/20));for(let i=0;i<5;i++){R(56+i*44,90,36,26,i<n?'#f4f4f4':'#333344');if(i<n)T(judge[i].toFixed(1),74+i*44,99,K.k,1,'c');T('J'+(i+1),74+i*44,120,K.gr,1,'c');}if(n>=5){T('TECH '+tech[prog].toFixed(1)+'   PRES '+comp[prog].toFixed(1),160,134,K.w,1,'c');T('TOTAL '+(tech[prog]+comp[prog]).toFixed(1),160,148,K.y,2,'c');}}};
 return g;}});

/* =========================== VAULT =========================== */
A.add({id:'gymvault',name:'VAULT',cat:'SPORTS',how:'TAP LEFT/RIGHT TO SPRINT, A ON THE BOARD. HOLD A TO TUCK, LET GO TO LAND.',make(){
 const g={over:null,score:0},BX=520,TX=566,M0=606,M1=770,FL=184,TH=42;
 let n=0,tot=0,ph,x,v,last,q,xt,h,vh,vx,a,tk,res,mt,t=0,cheer=0,scores=[],note='';
 const reset=()=>{ph='ready';x=30;v=0;last='';q=0;xt=0;h=0;vh=0;vx=0;a=0;tk=0;res=null;mt=0;note='';};reset();
 g.update=()=>{t++;if(cheer)cheer--;const k=A.in(0),hh=A.hit(0);
  if(ph==='ready'){mt++;if(hh.l||hh.r||hh.a||mt>90){ph='run';mt=0;}return;}
  if(ph==='run'){if(hh.l&&last!=='l'){v+=.34;last='l';}if(hh.r&&last!=='r'){v+=.34;last='r';}v=Math.max(.9,Math.min(5.6,v*.986));x+=v;
   if(hh.a&&x>=BX-24&&x<=BX+6){q=cl(1-Math.abs(x-(BX-8))/26,.25,1);note=q>.85?'PERFECT HURDLE':q>.6?'GOOD HURDLE':'EARLY';ph='pre';xt=x;S('jump');A.burst(BX-cam()+0,FL,'#ffffff',6,1.2);}
   else if(x>BX+6){q=.2;note='LATE HURDLE';ph='pre';xt=x;S('jump');}return;}
  if(ph==='pre'){x+=Math.max(2.2,v*.8);const f=cl((x-xt)/(TX-xt),0,1);a=PI*f;h=16+Math.sin(f*PI)*16+f*(TH-4);if(x>=TX){ph='fly';vh=2.4+v*.58*q+(q>.8?.5:0);vx=1.3+v*.24;a=PI;h=TH+14;S('hit');}return;}
  if(ph==='fly'){vh-=.16;h+=vh;x+=vx;const tuck=k.a;tk=tuck?Math.min(1,tk+.2):Math.max(0,tk-.2);a+=.045+.2*tk;if(vh<0&&h<=26){h=26;const er=Math.abs(wrap(a)),flips=Math.max(1,Math.round(a/TAU)),D=[0,3.0,4.6,6.0,7.2][Math.min(4,flips)];let E=10-(1-q)*1.6-(v<3?.6:0),lab;if(er<.22){lab='STUCK IT!';cheer=90;S('win');}else if(er<.5){lab='SMALL STEP';E-=.3;S('score');}else if(er<.95){lab='BIG HOP';E-=.9;S('hit');}else{lab='FALL';E-=2.2;S('boom');A.shake=6;}
    E=Math.max(5,E);const sc=+(D+E).toFixed(3);res={lab,D,E,sc,fall:er>=.95,name:['','HANDSPRING','HANDSPRING FRONT','HANDSPRING DOUBLE','TRIPLE!'][Math.min(4,flips)]};scores.push(sc);tot+=sc;g.score=Math.round(tot*100);ph='land';mt=0;A.burst(x-cam(),FL-10,'#ffffff',10,2);}return;}
  if(ph==='land'){if(++mt>150){n++;if(n>=3){const bt=Math.max(...scores);g.over=tot>=44?'GOLD '+tot.toFixed(3)+' - WIN':tot>=40?'SILVER '+tot.toFixed(3):'TOTAL '+tot.toFixed(3);return;}reset();}}};
 const cam=()=>cl(x-120,0,M1-W+10);
 g.draw=()=>{const cx=cam();fill(0,0,W,H,lg(0,0,0,H,[[0,'#0e1630'],[1,'#1a2850']]));crowd(-((cx*.4)%13)-13,40,W+30,8,4,t,cheer?3:0);alpha(.6,()=>fill(0,30,W,10,'#0a0e20'));
  for(let i=0;i<6;i++){const bx=i*90-((cx*.4)%90);R(bx,16,22,30,['#c0203a','#2050c0','#e8b020'][i%3]);A.poly([[bx,46],[bx+22,46],[bx+11,52]],['#c0203a','#2050c0','#e8b020'][i%3],1);}
  R(250,6,64,30,'#101018');A.box(250,6,64,30,'#40405a');T('VAULT '+Math.min(n+1,3)+'/3',282,10,K.y,1,'c');T(scores.length?scores[scores.length-1].toFixed(3):'-.---',282,22,K.w,1,'c');
  fill(0,132,W,H-132,lg(0,132,0,H,[[0,'#2a3a6a'],[1,'#1a2448']]));
  const jx=640-cx;R(jx-50,126,120,22,'#1a2040');for(let i=0;i<4;i++){A.person(jx-36+i*30,150,{s:.8,c:'#2a2a3a',id:i+1});}R(jx-54,136,128,16,'#3a1a4a');R(jx-54,136,128,2,'#e8b020');
  fill(0,FL-8,W,8,'#4a6ab0');R(-cx,FL-9,BX+10,2,'#ffffff');for(let m=0;m<BX;m+=50){const xx=m-cx;if(xx>-4&&xx<W)R(xx,FL-8,1,8,'rgba(255,255,255,.4)');}
  fill(0,FL,W,H-FL,'#24305a');
  const bx=BX-cx;A.poly([[bx-14,FL],[bx+12,FL],[bx+12,FL-7]],'#f0f0f0',1);R(bx-14,FL-2,26,2,'#d02030');
  const tx=TX-cx;R(tx-3,FL-TH+6,6,TH-6,'#a8acb8');A.poly([[tx-12,FL],[tx+12,FL],[tx+4,FL-8],[tx-4,FL-8]],'#5a5e6a',1);R(tx-15,FL-TH,30,7,'#2a4ab0');R(tx-15,FL-TH,30,2,'#4a6ad8');
  const m0=M0-cx;R(m0,FL-10,M1-M0,10,'#3a6ae0');R(m0,FL-10,M1-M0,3,'#f4f4f4');for(let i=0;i<4;i++)R(m0+20+i*36,FL-6,18,3,'#ffffff');
  const sx=x-cx,c=A.c;let yy,ang=0,tuck=0;if(ph==='ready'||ph==='run'){A.person(sx,FL-8,{s:1.25,c:'#7a1aa8',pants:'#e0a57c',st:ph==='run'?x*.18:0,id:0,hair:'#5a3a1e',arm1:ph==='run'?Math.sin(x*.18)*.9:.1,arm2:ph==='run'?-Math.sin(x*.18)*.9:-.1});C(sx-1,FL-8-34*1.25,2,'#5a3a1e');}
  else{if(ph==='pre'){yy=FL-8-h+16;ang=a;}else if(ph==='fly'){yy=FL-h;ang=a;tuck=tk;}else{yy=FL-26;ang=res&&res.fall?PI*.45:0;}
   c.save();c.translate(sx,ph==='land'?FL-10:yy);if(ph==='land'){c.rotate(ang);A.person(0,0,{s:1.25,c:'#7a1aa8',pants:'#e0a57c',id:0,hair:'#5a3a1e',arm1:res&&!res.fall?2.6:.4,arm2:res&&!res.fall?-2.6:-.4});}else{c.rotate(ang);c.scale(1,1-tuck*.38);A.person(0,16,{s:1.25,c:'#7a1aa8',pants:'#e0a57c',id:0,hair:'#5a3a1e',arm1:tuck?.4:3,arm2:tuck?-.4:-3});}c.restore();}
  hud(15);T('VAULT '+Math.min(n+1,3)+'/3',5,4,K.y,2);T('TOTAL '+tot.toFixed(3),W-5,4,K.w,2,'r');
  if(ph==='run'||ph==='ready'){meter(6,226,80,6,v/5.6,v>4.5?K.g:K.y,'SPEED');T(ph==='ready'?'TAP LEFT/RIGHT':'A AT THE BOARD',W-6,228,K.gr,1,'r');}
  if(ph==='fly')T(tk>.5?'TUCK':'OPEN',sx,Math.max(24,yy-44),tk>.5?K.o:K.c,1,'c');
  if(note&&ph!=='land'&&ph!=='run')T(note,160,30,K.c,1,'c');
  if(ph==='land'&&res){R(70,40,180,58,'rgba(0,0,0,.7)');T(res.lab,160,46,res.fall?K.r:K.y,2,'c');T(res.name,160,62,K.w,1,'c');T('D '+res.D.toFixed(1)+'  E '+res.E.toFixed(3),160,74,K.c,1,'c');T(res.sc.toFixed(3),160,84,K.y,2,'c');}};
 return g;}});

/* =========================== BOBSLED (3D) =========================== */
A.add({id:'bobsled',name:'BOBSLED',cat:'SPORTS',hd:1,low:1,how:"TAP LEFT/RIGHT TO PUSH OFF, THEN STEER THE BANKED CURVES. DON'T FLIP OUT.",make(){
 const g={over:null,score:0},Z=2000,HW=1.5,PAR=31.8;
 const cx=z=>Math.sin(z*.021)*9+Math.sin(z*.0077+1)*14+Math.sin(z*.043+2)*2.5,dcx=z=>cx(z+.5)-cx(z-.5),k2=z=>(cx(z+2)-2*cx(z)+cx(z-2))/4;
 const US=[-1.45,-1.15,-.85,-.55,0,.55,.85,1.15,1.45],wy=u=>{const a=Math.abs(u)-.5;return a>0?a*a*2.4:0;},su=u=>{const a=Math.abs(u)-.5;return a>0?Math.sign(u)*4.8*a:0;};
 let cb=6.5,z=0,u=0,vu=0,v=0,ph='ready',tm=0,t=0,last='',crashes=0,ct=0,msg='',mt=0,split=null,steer=0;
 g.update=()=>{t++;if(mt)mt--;const k=A.in(0),h=A.hit(0);
  if(ph==='ready'){if(t>80){ph='push';msg='PUSH!';mt=40;S('coin');}return;}
  tm++;if(ph==='push'){if(h.l&&last!=='l'){v+=.05;last='l';S('blip');}if(h.r&&last!=='r'){v+=.05;last='r';S('blip');}v=Math.min(.62,v*.993+.0012);z+=v;if(z>=26){ph='run';msg='LOAD UP!';mt=50;S('jump');}return;}
  if(ph==='crash'){z+=v;v*=.985;if(--ct<=0){if(crashes>=3){g.over='DNF - CRASHED OUT';g.lost=true;g.score=0;return;}ph='run';u=0;vu=0;}return;}
  if(ph==='fin'){v*=.96;z+=v;return;}
  const kk=k2(z);steer+=(ax(k)-steer)*.25;v+=.0029-.00142*v*v-.0004-Math.abs(steer)*.00018-Math.max(0,Math.abs(u)-.95)*.0022;v=Math.max(.15,v);
  vu+=steer*.0034-kk*v*v*1.6-su(u)*.0075;vu*=.955;u+=vu;v-=Math.abs(vu)*.004;
  if(Math.abs(u)>1.2&&t%3===0){const p=A.p3(cx(z)+u*HW,wy(u)+.2,z);if(p[2]>.1)A.burst(p[0],p[1],'#fff4c0',3,1.5);}
  if(Math.abs(u)>1.42){crashes++;ph='crash';ct=80;v*=.35;msg='FLIPPED!';mt=80;S('boom');A.shake=12;return;}
  z+=v;if(!split&&z>=1000){split=(tm/60).toFixed(2);msg='SPLIT '+split;mt=90;S('coin');}
  if(z>=Z){ph='fin';const s=tm/60;g.score=Math.round(s*100);g.over=s<PAR?'TRACK RECORD '+s.toFixed(2)+' S - WIN':'FINISH '+s.toFixed(2)+' S';}};
 const sled=(sz,uu,vv)=>{const sx=cx(sz)+uu*HW,sy=wy(uu),yaw=Math.atan(dcx(sz)),ro=Math.atan(su(uu)/HW),cr=Math.cos(ro),sr=Math.sin(ro),cy=Math.cos(yaw),sy_=Math.sin(yaw);
  const P=(l,h,f)=>{const lr=l*cr-h*sr,hr=l*sr+h*cr;return[sx+lr*cy+f*sy_,sy+hr+.02,sz+f*cy-lr*sy_];};
  const q=(a,b,c,d,col)=>F([P(...a),P(...b),P(...c),P(...d)],col);
  const box=(l0,l1,h0,h1,f0,f1,col)=>{q([l0,h1,f0],[l1,h1,f0],[l1,h1,f1],[l0,h1,f1],col);q([l0,h0,f0],[l0,h1,f0],[l1,h1,f0],[l1,h0,f0],col);q([l1,h0,f1],[l1,h1,f1],[l0,h1,f1],[l0,h0,f1],col);q([l0,h0,f1],[l0,h1,f1],[l0,h1,f0],[l0,h0,f0],col);q([l1,h0,f0],[l1,h1,f0],[l1,h1,f1],[l1,h0,f1],col);};
  box(-.3,-.24,0,.1,-.95,.95,'#2a2a30');box(.24,.3,0,.1,-.95,.95,'#2a2a30');
  box(-.32,.32,.1,.42,-1,.6,'#d8262a');q([-.32,.42,.6],[.32,.42,.6],[.15,.26,1.1],[-.15,.26,1.1],'#e83a3a');q([-.32,.1,.6],[-.32,.42,.6],[-.15,.26,1.1],[-.15,.12,1.06],'#b81e22');q([.32,.42,.6],[.32,.1,.6],[.15,.12,1.06],[.15,.26,1.1],'#b81e22');
  box(-.33,.33,.26,.31,-.98,.58,'#f4f4f4');
  const crew=ph==='push'?1:4;for(let i=0;i<crew;i++){const f=.35-i*.4;box(-.12,.12,.42,.64,f-.12,f+.12,i?'#2a4ab0':'#f2f2f2');box(-.1,.1,.5,.58,f+.1,f+.13,'#1a1a22');}
  if(ph==='push')for(let i=0;i<3;i++){const f=i===1?-1.5:-.75,l=i===1?0:(i-1)*.62,ph_=Math.sin(t*.5+i*2)*.12;box(l-.1,l+.1,0,.55,f-.08+ph_,f+.08+ph_,'#1e3a8a');box(l-.13,l+.13,.55,1.05,f-.12,f+.12,'#1e3a8a');box(l-.11,l+.11,1.05,1.3,f-.1,f+.12,'#f2f2f2');}};
 g.draw=()=>{cb+=((ph==='push'||ph==='ready'?6.5:4.8)-cb)*.04;const cz=z-cb;A.skyband('#5a8ac8','#e6f0fa',112);const yaw=Math.atan(dcx(z)),off=-yaw*220;
  for(let i=0;i<3;i++){const b=((i*140+off*.5)%480+480)%480-80;A.poly([[b,112],[b+60,56+i*8],[b+90,70],[b+130,48+i*6],[b+200,112]],'#9ab0cc',1);A.poly([[b+50,62+i*8],[b+60,56+i*8],[b+72,64]],'#f4f8ff',1);A.poly([[b+120,55+i*6],[b+130,48+i*6],[b+142,58]],'#f4f8ff',1);}
  fill(0,108,W,H-108,lg(0,108,0,H,[[0,'#dfe8f2'],[1,'#f6f9fc']]));
  A.cam.x=cx(cz)+u*HW*.55;A.cam.y=wy(u)*.5+1.9+(cb-4.8)*.3;A.cam.z=cz;A.cam.ry=Math.atan(dcx(z+1));A.cam.rx=-.2;A.cam.f=210;A.fog={col:'#e4ecf6',near:22,far:50};
  for(let zz=Math.floor(cz)+1;zz<z+48;){const st=zz<z+22?1:2,z0=zz,z1=zz+st,c0=cx(z0),c1=cx(z1),mk=Math.floor(z0/10)!==Math.floor(z1/10);
   for(let i=0;i<8;i++){const u0=US[i],u1=US[i+1],col=i===3||i===4?(mk?'#4a8ae0':'#e6eff8'):(i===0||i===7)?'#cddcec':'#dae6f2';F([[c0+u0*HW,wy(u0),z0],[c0+u1*HW,wy(u1),z0],[c1+u1*HW,wy(u1),z1],[c1+u0*HW,wy(u0),z1]],col);}
   [-1,1].forEach(s=>{const a=1.45*s,b=1.65*s,y=wy(1.45);F([[c0+a*HW,y,z0],[c0+b*HW,y,z0],[c1+b*HW,y,z1],[c1+a*HW,y,z1]],'#f8fafc',false);F([[c0+b*HW,y,z0],[c0+b*HW,0,z0],[c1+b*HW,0,z1],[c1+b*HW,y,z1]],'#b8c6d6');});
   if(z0%7===0&&z0>z)[-1,1].forEach((s,j)=>{const tx=cx(z0)+s*(HW*1.65+2.2+((z0*3+j*5)%4)),ty=0;F([[tx-1.1,ty+.6,z0],[tx+1.1,ty+.6,z0],[tx,ty+4.6,z0]],'#2f6a4a',false);F([[tx,ty+.6,z0-1.1],[tx,ty+.6,z0+1.1],[tx,ty+4.6,z0]],'#255a3e',false);F([[tx-.5,ty+3.4,z0],[tx+.5,ty+3.4,z0],[tx,ty+4.7,z0]],'#f4f8ff',false);A.box3(tx,0,z0,.25,.7,.25,'#5a3a22');});
   if(z0%500===0&&z0>0&&z0<=Z){const c=cx(z0);A.box3(c-HW*1.9,0,z0,.3,3.4,.3,'#3a3a46');A.box3(c+HW*1.9,0,z0,.3,3.4,.3,'#3a3a46');A.box3(c,3.1,z0,HW*3.9,.6,.2,z0===Z?'#d82a2a':'#2a5ab0');if(z0===Z)for(let i=-3;i<3;i++)F([[c+i*.5,.03,z0],[c+i*.5+.5,.03,z0],[c+i*.5+.5,.03,z0+.5],[c+i*.5,.03,z0+.5]],(i+3)%2?'#111111':'#ffffff',false);}
   zz+=st;}
  
  sled(z,u,v);A.flush();A.fog=null;
  hud(16);T((tm/60).toFixed(2)+' S',5,4,K.y,2);T(Math.round(v*104)+' KMH',160,4,K.w,2,'c');for(let i=0;i<3;i++)T('X',W-34+i*11,4,i<crashes?K.r:'#555566',2);
  meter(100,226,120,5,z/Z,K.c);T('TRACK',96,226,K.gr,1,'r');
  if(ph==='push'){T('TAP LEFT  RIGHT!',160,40,K.y,2,'c');meter(110,56,100,6,v/.62,K.o);}if(ph==='ready')T(t<40?'READY':'SET',160,60,K.y,3,'c');if(mt&&msg)T(msg,160,76,msg==='FLIPPED!'?K.r:K.y,3,'c');};
 return g;}});

/* =========================== SLOPESTYLE =========================== */
A.add({id:'slopestyle',name:'SLOPESTYLE',cat:'SPORTS',how:'A JUMPS. IN THE AIR LEFT/RIGHT SPIN, UP/DOWN FLIP, B GRABS. LAND STRAIGHT.',make(){
 const g={over:null,score:0},END=3050;
 const FT=[['k',380],['r',700],['k',1000],['r',1330],['k',1640],['k',1960],['r',2300],['k',2620]];
 const KS=FT.filter(f=>f[0]==='k').map(f=>f[1]),RS=FT.filter(f=>f[0]==='r').map(f=>f[1]);
 const sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
 const ground=x=>{let y=x*.32+120;for(const k of KS){if(x>k-56&&x<=k)y-=28*Math.pow((x-(k-56))/56,2);y+=26*sm((x-k-36)/120);}for(const r of RS){if(x>r-34&&x<=r-6)y-=10*Math.pow((x-(r-34))/28,2);}return y;};
 const railY=(r,x)=>ground(r-6)+3+(x-r)*.08;
 let p,lives=3,t=0,msg='',mc=K.w,mt=0,combo=0,cy=0,lipK=0,crash=0,fin=false,popT=0;
 const reset=x=>{p={x,y:ground(x),vx:3,vy:0,v:3,air:false,spin:0,flip:0,grab:0,airT:0,rail:null,bal:0,bv:0,rp:0,face:1};};reset(40);cy=p.y-140;
 const say=(m,c)=>{msg=m;mc=c||K.w;mt=70;};
 const slope=x=>(ground(x+1)-ground(x-1))/2;
 g.update=()=>{t++;if(mt)mt--;if(popT)popT--;const k=A.in(0),h=A.hit(0);if(h.a)popT=8;
  if(crash>0){if(--crash===0){if(lives<=0){g.over='CRASHED OUT';return;}reset(p.x+20);}return;}
  if(fin)return;
  if(p.rail!==null){const r=p.rail;p.x+=p.v*.97;p.y=railY(r,p.x);p.bv+=(rnd(.03)-.015)+p.bal*.01+ax(k)*.011;p.bv*=.96;p.bal+=p.bv;p.rp++;if(Math.abs(p.bal)>1){p.rail=null;p.air=true;p.vx=p.v;p.vy=0;say('SLIPPED OFF',K.o);p.rp=0;}else if(p.x>r+90){const pts=p.rp*2+40;g.score+=pts*(1+combo*.25)|0;combo++;say('BOARDSLIDE +'+pts,K.c);S('score');p.rail=null;p.air=true;p.vx=p.v;p.vy=-1.2;p.spin=0;p.flip=0;p.grab=0;p.airT=0;}return;}
  if(!p.air){const s=slope(p.x);p.v+=.16*s/Math.sqrt(1+s*s)-.0028*p.v*p.v-.003;p.v=Math.max(1.2,p.v);const ox=p.x;p.x+=p.v/Math.sqrt(1+s*s);p.y=ground(p.x);
   let lip;for(const k of KS)if(ox<=k&&p.x>k)lip=k;for(const r of RS)if(ox<=r-6&&p.x>r-6)lip=r-6;
   if(lip!==undefined){const ls=slope(lip-1),c=1/Math.sqrt(1+ls*ls);p.air=true;p.vx=p.v*c;p.vy=p.v*ls*c-(popT?1.3:0);if(popT)A.fx.push({txt:'POP!',x:160,y:100,vx:0,vy:-.5,t:25,c:K.y,g:0});p.spin=0;p.flip=0;p.grab=0;p.airT=0;S('jump');}
   else if(h.a){p.air=true;p.vx=p.v;p.vy=-2.7;p.spin=0;p.flip=0;p.grab=0;p.airT=0;S('jump');}
   if(p.x>=END){fin=true;g.score+=lives*100;g.over='RUN COMPLETE';}return;}
  const py=p.y,px=p.x;p.vy+=.14;p.x+=p.vx;p.y+=p.vy;p.airT++;p.spin+=ax(k)*.27;p.flip+=ay(k)*.21;if(k.b){p.grab++;}
  for(const r of RS)if(p.vy>=0&&p.x>=r&&p.x<=r+88&&py<=railY(r,px)+1&&p.y>=railY(r,p.x)){if(Math.abs(wrap(p.flip))>.6){break;}p.rail=r;p.y=railY(r,p.x);p.bal=0;p.bv=rnd(.04)-.02;p.rp=0;p.v=Math.max(2.2,p.vx);S('hit');A.burst(160,p.y-cy,'#d0e8ff',6,1.5);return;}
  if(p.vy>0&&p.y>=ground(p.x)){p.y=ground(p.x);const fe=Math.abs(wrap(p.flip)),s=((p.spin%PI)+PI)%PI,se=Math.min(s,PI-s);
   if(fe<.6&&se<.55){const sp=Math.round(Math.abs(p.spin)/PI)*180,fl=Math.round(Math.abs(p.flip)/TAU),gr=p.grab>6;let pts=sp/180*60+fl*250+(gr?40+Math.min(60,p.grab):0)+Math.round(p.airT*.8);const nm=[];if(fl)nm.push((p.flip<0?'BACK':'FRONT')+(fl>1?' DOUBLE':'FLIP'));if(sp)nm.push((p.spin<0?'BS ':'FS ')+sp);if(gr)nm.push('GRAB');if(nm.length){combo++;pts=Math.round(pts*(1+combo*.25));S('score');}else S('hit');g.score+=pts;say((nm.join(' ')||'CLEAN')+' +'+pts,nm.length?K.y:K.w);if(Math.round(Math.abs(p.spin)/PI)%2)p.face=-p.face;p.air=false;const sl=slope(p.x);p.v=Math.max(1.5,(p.vx+p.vy*sl)/Math.sqrt(1+sl*sl)*.92);A.burst(160,p.y-cy,'#ffffff',10,2);}
   else{lives--;combo=0;crash=70;say('WIPEOUT!',K.r);S('boom');A.shake=8;A.burst(160,p.y-cy,'#ffffff',24,3);p.air=false;}}};
 g.draw=()=>{const camX=p.x-110;cy+=((p.y-130)-cy)*.12;
  fill(0,0,W,H,lg(0,0,0,H,[[0,'#3a7ad8'],[.6,'#a8d0f4'],[1,'#e8f4ff']]));C(270,34,12,'#fff6c0');
  [[.08,'#8aa4c8',90,60],[.18,'#a4bad8',120,46]].forEach(([pr,col,base,amp],j)=>{A.c.fillStyle=col;A.c.beginPath();A.c.moveTo(0,H);for(let x=0;x<=W;x+=20){const wx=x+camX*pr+j*300;A.c.lineTo(x,base-Math.abs(Math.sin(wx*.013+j))*amp-Math.sin(wx*.031)*12-cy*pr*.3);}A.c.lineTo(W,H);A.c.fill();});
  for(let i=0;i<14;i++){const wx=i*60,x=((wx-camX*.5)%840+840)%840-60,yb=150-cy*.4+Math.sin(i*2.3)*10;A.poly([[x-8,yb],[x+8,yb],[x,yb-26]],'#2a5a48',1);A.poly([[x-4,yb-14],[x+4,yb-14],[x,yb-26]],'#e8f2ff',1);}
  A.c.fillStyle='#f4f8fc';A.c.beginPath();A.c.moveTo(0,H);for(let x=0;x<=W;x+=4)A.c.lineTo(x,ground(camX+x)-cy);A.c.lineTo(W,H);A.c.fill();
  A.c.strokeStyle='#b8cce0';A.c.lineWidth=2;A.c.beginPath();for(let x=0;x<=W;x+=4){const y=ground(camX+x)-cy+2;x?A.c.lineTo(x,y):A.c.moveTo(x,y);}A.c.stroke();
  for(const k of KS){const sx=k-camX;if(sx<-80||sx>W+40)continue;A.c.strokeStyle='#3a8ae0';A.c.lineWidth=2;A.c.beginPath();for(let x=k-56;x<=k;x+=4){const y=ground(x)-cy;x===k-56?A.c.moveTo(x-camX,y):A.c.lineTo(x-camX,y);}A.c.stroke();R(sx-2,ground(k)-cy-1,3,3,'#ff6a1a');R(sx+60,ground(k+60)-cy-22,2,22,'#ff6a1a');A.poly([[sx+62,ground(k+60)-cy-22],[sx+72,ground(k+60)-cy-19],[sx+62,ground(k+60)-cy-16]],'#ff6a1a',1);}
  for(const r of RS){const sx=r-camX;if(sx<-100||sx>W+20)continue;for(let x=r+6;x<r+90;x+=20)R(x-camX,railY(r,x)-cy,2,ground(x)-railY(r,x),'#6a7484');L(sx,railY(r,r)-cy,sx+90,railY(r,r+90)-cy,'#c8d0dc',3);L(sx,railY(r,r)-cy-1,sx+90,railY(r,r+90)-cy-1,'#ffffff',1);}
  {const sx=END-camX;if(sx<W+40){R(sx,ground(END)-cy-50,4,50,'#d02a2a');R(sx+60,ground(END+60)-cy-50,4,50,'#d02a2a');R(sx,ground(END)-cy-50,64,10,'#d02a2a');T('FINISH',sx+32,ground(END)-cy-48,K.w,1,'c');crowd(sx+80,ground(END+100)-cy-40,120,3,4,t,2);}}
  const sx=p.x-camX,sy=p.y-cy,c=A.c;if(crash){c.save();c.translate(sx,sy-6);c.rotate(t*.4);A.person(0,10,{s:1,c:'#ff7a1a',pants:'#2a3a6a',id:1,cap:'#20a0e0'});c.restore();}
  else{const sl=p.air?0:Math.atan(slope(p.x)),ang=sl+(p.air?p.flip:0)+(p.rail!==null?Math.atan(.32):0),cs=Math.cos(p.spin),sc=Math.abs(cs)<.2?.2*(cs<0?-1:1):cs;c.save();c.translate(sx,sy);c.rotate(ang);c.scale(sc*p.face,p.grab&&k_b()?.85:1);
   R(-11,-1.5,22,3,'#1a1a1a');R(-9,-1,18,1.5,'#e83a6a');A.person(0,-1,{s:1,c:'#ff7a1a',pants:'#2a3a6a',d:1,id:1,cap:'#20a0e0',st:.5,arm1:p.grab&&k_b()?-.2:1.3,arm2:p.grab&&k_b()?.3:-1.3});R(-1,-30.5,6,2,'#1a1a1a');R(1,-30.2,3,1,'#ffcf3f');c.restore();
   if(p.rail!==null){R(130,40,60,6,'#202030');R(159+p.bal*28,38,3,10,Math.abs(p.bal)>.7?K.r:K.y);T('BALANCE',160,30,K.w,1,'c');}}
  hud(15);T(String(g.score),5,4,K.y,2);if(combo>1)T('COMBO X'+combo,160,4,K.o,1,'c');for(let i=0;i<3;i++)C(W-30+i*10,7,3,i<lives?K.c:'#3a3a4a');meter(110,228,100,4,p.x/END,K.c);
  if(mt)T(msg,160,56,mc,msg.length>16?1:2,'c');if(t<150&&p.x<300)T('A AT THE LIP FOR POP',160,74,K.k,1,'c');};
 const k_b=()=>A.in(0).b;
 return g;}});

/* =========================== CLAY TRAP =========================== */
A.add({id:'claytrap',name:'CLAY TRAP',cat:'SPORTS',mouse:1,how:'AIM WITH MOUSE OR ARROWS. CLICK OR A FIRES. 16 SHELLS PER ROUND OF 10 CLAYS.',make(){
 const g={over:null,score:0},FC=420,HOR=150;
 let cx=160,cy=158,rd=1,shells=16,thrown=0,hits=0,tot=0,clays=[],wait=90,t=0,msg='',mc=K.w,mt=0,rec=0,flash=0,cd=0,rings=[],pull=0,dbl=0;
 const pj=(X,Y,Z)=>[160+X*FC/Z,HOR-(Y-1.5)*FC/Z];
 const launch=()=>{const n=rd===1?1:rd===2?2:(rnd(1)<.5?2:1);pull=30;dbl=n;for(let i=0;i<n;i++){if(rd===3&&rnd(1)<.35){const s=rnd(1)<.5?-1:1;clays.push({X:-s*22,Y:2+rnd(2),Z:26+rnd(8),vx:s*(15+rnd(5)),vy:4+rnd(2),vz:2,t:0,a:1});}else{const yaw=(rnd(2)-1)*(rd===1?(thrown<5?.08:.4):.6),sp=19+rd*2+rnd(3),el=.36+rnd(.12);clays.push({X:i?.4:-.4,Y:.6,Z:16,vx:Math.sin(yaw)*Math.cos(el)*sp,vy:Math.sin(el)*sp,vz:Math.cos(yaw)*Math.cos(el)*sp,t:0,a:1});}}thrown+=n;S('jump');};
 g.update=()=>{t++;if(mt)mt--;if(rec)rec--;if(flash)flash--;if(cd)cd--;if(pull)pull--;rings.forEach(r=>r.t--);rings=rings.filter(r=>r.t>0);
  const k=A.in(0),lock=typeof document!=='undefined'&&document.pointerLockElement;if(lock){cx+=A.mouse.dx*.55;cy+=A.mouse.dy*.55;}else if(A.mouse.t>0&&(A.mouse.dx||A.mouse.dy)){cx=A.mouse.x;cy=A.mouse.y;}cx=cl(cx+ax(k)*3.2,4,W-4);cy=cl(cy+ay(k)*3.2,18,H-30);
  if(A.fire(8)&&cd<=0&&shells>0&&clays.some(c=>c.a&&c.t>4)){shells--;cd=8;rec=7;flash=3;S('shoot');A.shake=2;rings.push({x:cx,y:cy,t:10});let hitAny=false;
   for(const c of clays){if(!c.a)continue;const[sx,sy]=pj(c.X,c.Y,c.Z),r=Math.max(2,.3*FC/c.Z);if(Math.hypot(sx-cx,sy-cy)<11+r*.6&&rnd(1)<(c.Z<38?1:Math.max(.35,1-(c.Z-38)/40))){c.a=0;hits++;tot++;const pts=10+Math.max(0,Math.round(12-c.t/6));g.score+=pts;hitAny=true;A.burst(sx,sy,'#ff7a2a',16,2.4);A.burst(sx,sy,'#3a2a20',8,1.2);S('hit');msg=c.t<30?'SMOKED IT!':'DEAD!';mc=K.y;mt=30;}}if(!hitAny&&clays.some(c=>c.a)){msg='LOST';mc=K.gr;mt=14;}}
  const dt=1/60;for(const c of clays){if(!c.a)continue;c.t++;c.vy-=9.8*.62*dt;c.X+=c.vx*dt;c.Y+=c.vy*dt;c.Z+=c.vz*dt;c.vx*=.996;c.vz*=.996;if(c.Y<0||c.Z>95||Math.abs(c.X/c.Z)>.5){c.a=0;c.lost=1;}}
  if(clays.length&&clays.every(c=>!c.a)){clays=[];wait=70;}
  if(!clays.length&&--wait<=0){if(thrown>=10){if(rd>=3){g.over=tot>=26?tot+'/30 - CHAMP SHOT WIN':tot>=20?'NICE SHOOTING '+tot+'/30':tot+'/30 BROKEN';if(tot>=26)g.score+=200;return;}msg='ROUND '+rd+': '+hits+'/10';mc=K.c;mt=110;rd++;thrown=0;hits=0;shells=16;wait=130;}else launch();}};
 g.draw=()=>{fill(0,0,W,HOR,lg(0,0,0,HOR,[[0,'#5a8ed0'],[1,'#f0d8b4']]));for(let i=0;i<4;i++){const x=((i*110+t*.05)%440)-60;alpha(.6,()=>{el(x,30+i*12,26,6,'#ffffff');el(x+18,27+i*12,16,6,'#ffffff');});}
  A.poly([[0,HOR],[0,128],[60,118],[130,126],[200,114],[270,124],[320,116],[320,HOR]],'#7a8ea0',1);
  for(let x=-4;x<W;x+=9)C(x,HOR-4-Math.abs(Math.sin(x*.7))*4,6+Math.abs(Math.sin(x*1.3))*3,'#3a5a3a');
  fill(0,HOR,W,H-HOR,lg(0,HOR,0,H,[[0,'#6aa050'],[1,'#3a7a30']]));alpha(.12,()=>{for(let i=-8;i<=8;i++)L(160+i*6,HOR,160+i*60,H,'#ffffff');});
  A.poly([[118,180],[202,180],[208,194],[112,194]],'#a8a8a0',1);R(112,194,96,4,'#8a8a82');A.poly([[118,180],[202,180],[200,177],[120,177]],'#c8c8c0',1);R(146,186,28,4,'#2a2a2a');R(214,150,1,40,'#5a5a5a');A.poly([[215,150],[226,154],[215,158]],pull?'#e82a2a':'#f4f4f4',1);
  alpha(.4,()=>{for(let i=0;i<5;i++)R(40+i*60,214,40,26,'#c8c4b8');});
  A.person(32,234,{s:1.9,c:'#d8d0b8',pants:'#4a4030',id:2,cap:'#2a4a2a',arm2:pull?-2.4:-.3});R(32-5*1.9,234-23*1.9,10*1.9,6,'rgba(200,120,40,.6)');
  for(const c of clays){if(!c.a)continue;const[sx,sy]=pj(c.X,c.Y,c.Z),r=Math.max(1.6,.3*FC/c.Z);el(sx,sy,r,r*.45,'#ff7a2a',Math.atan2(c.vy,c.vx)*.15);el(sx,sy-r*.12,r*.6,r*.18,'#ffb070');}
  rings.forEach(r=>alpha(r.t/10*.6,()=>{A.ring(r.x,r.y,11+(10-r.t)*.6,'#ffffff');}));
  const gx=212+(cx-160)*.12,gy=246+rec*1.4,ang=Math.atan2(cy-gy,cx-gx),bl=70-rec;
  A.poly([[gx+18,H+10],[gx+44,H+10],[gx+26,gy-4],[gx+14,gy]],'#7a4a22',1);
  for(let i=-1;i<=1;i+=2){const ox=-Math.sin(ang)*i*2.4,oy=Math.cos(ang)*i*2.4;L(gx+ox,gy+oy,gx+ox+Math.cos(ang)*bl,gy+oy+Math.sin(ang)*bl,'#2a2a30',4.4);}L(gx,gy,gx+Math.cos(ang)*bl,gy+Math.sin(ang)*bl,'#6a6a78',1);C(gx+Math.cos(ang)*bl,gy+Math.sin(ang)*bl,1.3,'#ffe080');
  if(flash)alpha(.9,()=>{C(gx+Math.cos(ang)*(bl+6),gy+Math.sin(ang)*(bl+6),6,'#fff2a0');});
  A.ring(cx,cy,7,'rgba(255,255,255,.9)');L(cx-11,cy,cx-4,cy,'#ffffff');L(cx+4,cy,cx+11,cy,'#ffffff');L(cx,cy-11,cx,cy-4,'#ffffff');L(cx,cy+4,cx,cy+11,'#ffffff');C(cx,cy,1,'#ff3030');
  hud(15);T('ROUND '+rd+'/3',5,4,K.y,2);T('CLAY '+Math.min(thrown,10)+'/10',120,4,K.w,1);T('HITS '+tot,120,10,K.g,1);for(let i=0;i<16;i++){R(W-6-(16-i)*6,3,4,9,i<shells?'#d02a2a':'#3a3a44');R(W-6-(16-i)*6,10,4,2,i<shells?'#e8c050':'#3a3a44');}
  if(pull)T('PULL!',160,40,K.w,3,'c');if(mt)T(msg,160,60,mc,msg.length>10?2:3,'c');if(shells===0&&clays.some(c=>c.a))T('OUT OF SHELLS',160,80,K.r,2,'c');};
 return g;}});

/* =========================== WEIGHTLIFTING =========================== */
A.add({id:'weightlift',name:'WEIGHTLIFTING',cat:'SPORTS',how:'A IN THE GREEN TO PULL AND JERK. LEFT/RIGHT KEEP THE BAR LEVEL. 3 FAILS OUT.',make(){
 const g={over:null,score:0},PX=160,PY=206,SS=2.3;
 let bad=0,kg=120,best=0,fails=0,ph='ready',pt=0,m=0,md=1,tilt=0,tv=0,msg='',mc=K.w,mt=0,lights=null,t=0,cheer=0,ring=0,lifts=0,anim=0,barY=0;
 const zoneW=()=>Math.max(.07,.22-(kg-120)*.0013),sp=()=>.016+(kg-120)*.00011,noise=()=>.0032+(kg-120)*.00004;
 const fail=w=>{anim=0;fails++;msg='NO LIFT - '+w;mc=K.r;ph='res';pt=0;lights=[0,0,0];S('lose');A.shake=6;};
 const ok=()=>{lifts++;best=kg;g.score+=kg;msg='GOOD LIFT! '+kg+' KG';mc=K.y;ph='res';pt=0;lights=[1,1,1];cheer=120;S('win');A.burst(PX,60,K.y,24,3);};
 g.update=()=>{t++;pt++;if(cheer)cheer--;if(bad)bad--;const k=A.in(0),h=A.hit(0);
  if(ph==='ready'){tilt=0;tv=0;anim=0;if(pt>70||h.a&&pt>15){ph='pull';pt=0;m=0;md=1;}return;}
  if(ph==='pull'){m+=md*sp();if(m>=1){m=1;md=-1;}if(m<=0){m=0;md=1;}if(h.a){if(Math.abs(m-.72)<zoneW()/2){ph='clean';pt=0;g.score+=5;S('jump');}else{m=0;md=1;bad=30;S('hit');}}else if(pt>480)fail('OUT OF TIME');return;}
  if(ph==='clean'){anim=Math.min(1,pt/22);if(pt>=22){ph='rack';pt=0;}return;}
  if(ph==='rack'||ph==='hold'){const n=noise()*(ph==='hold'?1.45:1);tv+=(rnd(2)-1)*n+tilt*.006*(1+kg/180)+ax(k)*.0046;tv*=.95;tilt+=tv;if(Math.abs(tilt)>1){fail('DROPPED IT');return;}if(ph==='rack'&&pt>=100){ph='jerk';pt=0;ring=46;g.score+=10;}if(ph==='hold'&&pt>=110){anim=2;ok();}return;}
  if(ph==='jerk'){ring-=.75+(kg-120)*.004;tv*=.9;tilt+=tv;const tol=Math.max(2.6,6-(kg-120)*.03);if(h.a){if(Math.abs(ring-12)<=tol){ph='drive';pt=0;g.score+=10;S('jump');}else fail('JERK FAILED');}else if(ring<=2)fail('JERK FAILED');return;}
  if(ph==='drive'){anim=1+Math.min(1,pt/14);if(pt>=14){ph='hold';pt=0;anim=2;}return;}
  if(ph==='res'){if(pt>=130){lights=null;if(fails>=3){g.over='OUT - BEST '+best+' KG';return;}if(msg.startsWith('GOOD')){if(kg>=220){g.score+=500;g.over='WORLD RECORD '+kg+' KG - WIN';return;}kg+=10;}ph='ready';pt=0;anim=0;}}};
 const plates=()=>{let r=(kg-20)/2;const out=[];for(const[w,c,hh] of[[25,'#d82a2a',22],[20,'#2a5ad8',22],[15,'#e8c020',20],[10,'#2aa04a',18],[5,'#f0f0f0',13],[2.5,'#d82a2a',10]])while(r>=w-.01&&out.length<9){out.push([c,hh]);r-=w;}return out;};
 g.draw=()=>{fill(0,0,W,H,lg(0,0,0,H,[[0,'#0e0e1a'],[1,'#242036']]));crowd(-2,40,W+4,9,4,t,cheer?3:0);alpha(.5,()=>fill(0,36,W,8,'#000'));R(60,4,200,26,'#141428');A.box(60,4,200,26,'#4a4a6a');T('WORLD CHAMPIONSHIPS',160,8,K.y,1,'c');T('ATTEMPT '+kg+' KG',160,18,K.w,1,'c');
  alpha(.08,()=>A.poly([[130,30],[190,30],[250,230],[70,230]],'#fff8d0',1));
  A.poly([[40,200],[280,200],[300,224],[20,224]],'#c89058',1);A.poly([[20,224],[300,224],[300,232],[20,232]],'#2a2a30',1);alpha(.25,()=>{for(let i=0;i<8;i++)L(40+i*34,200,20+i*40,224,'#7a5030');});
  A.person(38,200,{s:1.4,c:'#1a4ab0',pants:'#202030',id:3,arm2:-.5});A.person(282,200,{s:1.4,c:'#1a4ab0',pants:'#202030',id:5,arm1:.5});
  const sw=tilt*3,x=PX+sw,stage=anim,rack=stage>=.95&&stage<1.5;
  const by=stage<=1?PY-10-stage*(24*SS-10):PY-24*SS-(stage-1)*14*SS,eff=Math.min(1,Math.abs(tilt)*1.2+(ph==='hold'||ph==='rack'?.3:0)),skin=A.mix('#e0a57c','#d84a3a',eff*.6);
  const a1=stage<=1?.15+stage*(PI-.9):PI-.9+(stage-1)*.7,a2=-a1;A.person(x,PY+(rack?2:0),{s:SS,c:'#c02030',pants:'#c02030',skin,id:2,hair:'#1a1a1a',arm1:a1,arm2:a2});R(x-5*SS,PY-13.5*SS,10*SS,2.2,'#1a1a1a');
  const ba=tilt*.28,c=A.c;c.save();c.translate(x,by);c.rotate(ba);
  c.restore();const hs=[[x-5*SS-Math.sin(a1)*10*SS,PY-21*SS+Math.cos(a1)*10*SS],[x+5*SS-Math.sin(a2)*10*SS,PY-21*SS+Math.cos(a2)*10*SS]];
  hs.forEach((hp,i)=>{const gx=x+(i?16:-16),gy=by+(i?1:-1)*16*Math.sin(ba);L(hp[0],hp[1],gx,gy,skin,2.4*SS*.5);});
  c.save();c.translate(x,by);c.rotate(ba);R(-62,-1.5,124,3,'#c8ccd4');R(-62,-1.5,124,1,'#ffffff');R(-46,-3,4,6,'#9aa0aa');R(42,-3,4,6,'#9aa0aa');
  const pl=plates();pl.forEach((p,i)=>{R(-48-i*4.4,-p[1]/2,4,p[1],p[0]);R(44+i*4.4,-p[1]/2,4,p[1],p[0]);});c.restore();
  if(ph==='pull'){R(60,150,200,10,'#101018');const z=zoneW();fill(60+200*(.72-z/2),150,200*z,10,'#2a9a4a');R(58+200*m,146,4,18,K.y);T(bad?'BAD GRIP - RESET!':'PULL - PRESS A IN THE GREEN',160,138,bad?K.o:K.w,1,'c');meter(110,166,100,4,1-pt/480,pt>360?K.r:K.c);T('CLOCK',106,165,K.gr,1,'r');}
  if(ph==='rack'||ph==='hold'){R(100,150,120,8,'#101018');R(159,148,2,12,'#ffffff');fill(100,150,18,8,'rgba(220,40,40,.6)');fill(202,150,18,8,'rgba(220,40,40,.6)');C(160+tilt*58,154,4,Math.abs(tilt)>.7?K.r:K.y);T(ph==='rack'?'CATCH! LEFT/RIGHT BALANCE':'HOLD IT!',160,138,K.w,1,'c');meter(110,166,100,4,pt/(ph==='rack'?100:110),K.c);}
  if(ph==='jerk'){A.ring(PX,96,12,K.g);A.ring(PX,96,12.8,K.g);A.ring(PX,96,Math.max(1,ring),K.y);T('JERK - A WHEN THE RINGS MEET',160,138,K.w,1,'c');}
  if(lights)lights.forEach((l,i)=>{C(130+i*30,66,9,l?'#f8f8f8':'#e02020');alpha(.3,()=>C(130+i*30,66,15,l?'#ffffff':'#ff2020'));});
  hud(15);T('BEST '+best+' KG',5,4,K.y,1);T('LIFTS '+lifts,5,10,K.w,1);for(let i=0;i<3;i++)C(W-30+i*10,7,3.5,i<fails?K.r:'#3a3a4a');T('MISSES',W-40,4,K.gr,1,'r');
  if(ph==='res')T(msg,160,92,mc,2,'c');if(ph==='ready')T(kg+' KG',160,92,K.w,3,'c');};
 return g;}});

/* =========================== DRAG RACE =========================== */
A.add({id:'dragrace',name:'DRAG RACE',cat:'SPORTS',how:'A LAUNCHES ON GREEN, NEVER BEFORE. A SHIFTS UP IN THE GREEN RPM BAND.',make(){
 const g={over:null,score:0},RAT=[2.9,1.95,1.45,1.15,.95],KV=.0105,LIM=8500,QM=402,PXM=6;
 let rd=1,lives=3,ph,pt,tg,me,rv,t=0,msg='',mc=K.w,mt=0,react=0,fl=[],sl='';
 const car=(pw)=>({d:0,v:0,g:0,rpm:1200,go:false,st:0,et:0,done:false,pw,lim:0,fin:0});
 const start=()=>{ph='stage';pt=0;tg=70+ri(70);me=car(1);rv=car(.88+rd*.022);rv.react=(.3-rd*.035+rnd(.08))*60|0;rv.shift=7500+rd*120;me.rpm=rv.rpm=3800;fl=[];sl='';react=0;};start();
 const tq=r=>cl(r<7200?.55+.45*(r-3000)/4200:1-(r-7200)/4000,.3,1);
 const step=c=>{if(!c.go||c.done)return;if(c.st>0){c.st--;c.v-=.00055*c.v*c.v/60;}else{let a=tq(c.rpm)*RAT[c.g]*3.1*c.pw-.00055*c.v*c.v;const top=LIM*KV/RAT[c.g];if(c.v>=top-.05){a=Math.min(a,0);c.lim++;}c.v=Math.min(top,c.v+a/60);}c.rpm=Math.max(c.d<3&&c.g===0?4200:1500,c.v*RAT[c.g]/KV);c.d+=c.v/60;c.et++;if(c.d>=QM){c.done=true;c.fin=c.et-(c.d-QM)/c.v*60;}};
 const shift=(c,me_)=>{if(c.g>=4||c.st>0)return;const r=c.rpm;c.g++;c.st=9;c.lim=0;if(me_){if(r>=7600&&r<=LIM-10){sl='PERFECT SHIFT';g.score+=25;S('coin');}else if(r>=7000){sl='GOOD SHIFT';g.score+=10;S('blip');}else{sl='EARLY SHIFT';S('hit');}fl.push(10);}};
 g.update=()=>{t++;pt++;if(mt)mt--;const h=A.hit(0);
  if(ph==='stage'){if(pt>=60){ph='tree';pt=0;}return;}
  if(ph==='tree'){const gT=tg+90;if(h.a&&!me.go){me.go=true;react=(pt-gT)/60;if(pt<gT){me.red=1;sl='RED LIGHT!';S('lose');A.shake=6;}else if(react<.1){g.score+=40;A.fx.push({txt:'HOLESHOT!',x:100,y:150,vx:0,vy:-.5,t:40,c:K.y,g:0});}S('boom');A.burst(60,206,'#c8c8c8',20,2);}
   if(pt>=gT+rv.react&&!rv.go)rv.go=true;if(pt>=gT&&!me.go&&pt>gT+180){me.go=true;react=3;}if(me.go||rv.go)ph='race';else return;}
  if(ph==='race'){if(!me.go){const gT=tg+90;if(h.a||pt>gT+180){me.go=true;react=Math.min(3,(pt-gT)/60);S('boom');}}else if(h.a&&!me.done)shift(me,true);
   if(!rv.go&&pt>=tg+90+rv.react)rv.go=true;if(rv.go&&!rv.done&&rv.rpm>=rv.shift+(rnd(300)-150))shift(rv,false);step(me);step(rv);if(me.go&&me.et<70&&t%3===0)A.burst(90-22-(me.d*PXM-me.d*PXM),206,'#d8d8d8',3,1.4);fl=fl.map(f=>f-1).filter(f=>f>0);
   if(me.done&&rv.done){const mT=me.fin/60+react,rT=rv.fin/60+rv.react/60;ph='done';mt=170;const pp=Math.max(5,Math.round(200-me.fin/60*12));g.score+=pp;if(me.red){lives--;msg='RED LIGHT - LOSS';mc=K.r;S('lose');}else if(mT<=rT){g.score+=150*rd+Math.round((rT-mT)*100);msg='WIN! '+(me.fin/60).toFixed(3)+' S';mc=K.y;S('win');me.won=1;}else{lives--;msg='LOST BY '+(mT-rT).toFixed(3);mc=K.r;S('lose');}}return;}
  if(ph==='done'){if(mt<=0){if(lives<=0){g.over='OUT IN ROUND '+rd;return;}if(me.won){rd++;if(rd>5){g.over='EVENT CHAMP - WIN';return;}}start();}}};
 const drawCar=(x,y,sc,col,c_,wr,flame)=>{const c=A.c;c.save();c.translate(x,y);c.scale(sc,sc);
  alpha(.35,()=>el(0,0,40,3,'#000'));L(-35,-8,-54,-4,'#888890',1.5);C(-54,-4,2.5,'#222');
  A.poly([[-36,-8],[-36,-20],[-28,-23],[-12,-24],[-4,-34],[14,-34],[22,-24],[36,-18],[38,-10],[35,-6]],col,1);A.poly([[-36,-20],[-28,-23],[-12,-24],[-4,-34],[14,-34],[22,-24],[36,-18],[36,-16],[-36,-16]],c_,1);
  A.poly([[-2,-32],[12,-32],[18,-25],[-8,-25]],'#1a2438',1);L(0,-31,6,-26,'rgba(255,255,255,.4)',1);C(4,-28,2.6,'#f4f4f4');R(4,-37,12,3,'#1a1a1a');R(-40,-33,13,3,'#1a1a1a');L(-34,-30,-32,-22,'#1a1a1a',1.5);
  R(-30,-14,60,2,'rgba(255,255,255,.35)');
  const wh=(wx,wy,r)=>{C(wx,wy,r,'#141414');C(wx,wy,r*.48,'#b8bcc4');for(let i=0;i<5;i++){const a=wr+i*TAU/5;L(wx,wy,wx+Math.cos(a)*r*.45,wy+Math.sin(a)*r*.45,'#6a6e78',.8);}};wh(-22,-11,11);wh(25,-7,7);
  if(flame)A.poly([[-30,-9],[-44-flame,-11],[-38,-6]],'#ffb020',1);c.restore();};
 g.draw=()=>{const cam=me.d*PXM-90;fill(0,0,W,120,lg(0,0,0,120,[[0,'#2a1a4a'],[.6,'#d0605a'],[1,'#f0b070']]));C(240,96,16,'#ffd0a0');
  A.poly([[0,120],[0,96],[50,84],[90,96],[150,78],[220,94],[280,82],[320,92],[320,120]].map(([x,y])=>[((x-cam*.04)%340+340)%340-10,y]),'#5a3a5a',1);A.poly([[-cam*.04%320,120],[0,100],[320,100],[320,120]],'#5a3a5a',1);
  fill(0,100,W,46,'#3a3040');crowd(-((cam*.5)%13)-13,104,W+30,5,4,t,me.won&&ph==='done'?2:0);for(let i=0;i<5;i++){const x=((i*90-cam*.5)%450+450)%450-60;R(x,80,3,40,'#5a5a66');R(x-6,78,15,5,'#fff0c0');}
  fill(0,146,W,94,lg(0,146,0,H,[[0,'#3a3a40'],[1,'#26262c']]));alpha(.2,()=>{for(let i=0;i<4;i++)fill(0-cam,160+i*16,180,4,'#111111');});
  R(0,170,W,12,'#b8b8b0');R(0,168,W,3,'#d8d8d0');fill(0,182,W,2,'#8a8a82');R(0,226,W,2,'#f4f4f4');
  [[18.3,'60FT'],[100.6,'330FT'],[201,'1/8'],[305,'1000FT'],[402,'FINISH']].forEach(([m,l])=>{const x=m*PXM-cam;if(x>-20&&x<W+20){R(x-1,146,2,24,'#f4f4f4');R(x-14,140,28,8,m===402?'#d82a2a':'#1a1a1a');T(l,x,142,K.w,1,'c');if(m===402){for(let i=0;i<8;i++){R(x-2,184+i*5,4,5,i%2?'#111':'#fff');R(x-2,148+i*3,4,3,i%2?'#111':'#fff');}}}});
  {const x=-4*PXM-cam;if(x>-30){R(x-1,108,3,64,'#3a3a44');const gT=tg+90,on=(n)=>ph==='tree'&&pt>=tg+n*30||ph!=='stage'&&ph!=='tree'&&!me.red;R(x-8,104,17,62,'#1a1a1e');[0,1,2].forEach(i=>{C(x-4,124+i*8,2.6,ph==='tree'&&pt>=tg+i*30&&pt<gT?'#ffb020':'#3a2a10');C(x+5,124+i*8,2.6,ph==='tree'&&pt>=tg+i*30&&pt<gT?'#ffb020':'#3a2a10');});C(x-4,110,1.6,'#ffe060');C(x+5,110,1.6,'#ffe060');C(x-4,116,1.6,ph!=='stage'?'#ffe060':'#3a3a10');C(x+5,116,1.6,ph!=='stage'?'#ffe060':'#3a3a10');
   const gr=(ph==='tree'&&pt>=gT)||ph==='race'||ph==='done'&&!me.red;C(x-4,150,3,me.red?'#401010':gr?'#30ff60':'#103a18');C(x+5,150,3,gr?'#30ff60':'#103a18');C(x-4,158,3,me.red?'#ff2020':'#401010');C(x+5,158,3,'#401010');}}
  drawCar(90+(rv.d-me.d)*PXM,166,.78,'#ffcf3f','#e8a810',rv.d*2,0);
  drawCar(90,212,1,'#d82a2a','#a81a1a',me.d*2.4,fl.length?fl[0]:0);
  hud(15);T('ROUND '+rd+'/5',5,4,K.y,2);for(let i=0;i<3;i++)C(W-30+i*10,7,3.5,i<lives?K.g:'#3a3a4a');T(Math.round(me.v*3.6)+' KMH',160,4,K.w,2,'c');
  const tx=34,ty=50;alpha(.75,()=>C(tx,ty,26,'#101018'));A.ring(tx,ty,26,'#8a8aa0');const an=r=>PI*.75+r/9000*PI*1.5;A.c.strokeStyle='#2acc5a';A.c.lineWidth=4;A.c.beginPath();A.c.arc(tx,ty,21,an(7600),an(LIM));A.c.stroke();A.c.strokeStyle='#e02020';A.c.beginPath();A.c.arc(tx,ty,21,an(LIM),an(9000));A.c.stroke();
  for(let r=0;r<=9000;r+=1000){const a=an(r);L(tx+Math.cos(a)*16,ty+Math.sin(a)*16,tx+Math.cos(a)*19,ty+Math.sin(a)*19,'#ffffff');}const na=an(me.rpm);L(tx,ty,tx+Math.cos(na)*22,ty+Math.sin(na)*22,'#ff5030',2);C(tx,ty,2.5,'#cccccc');T(String(me.g+1),tx,ty+9,K.y,2,'c');T('RPM',tx,ty-12,K.gr,1,'c');
  if(ph==='race'&&sl)T(sl,160,40,sl[0]==='P'?K.g:sl[0]==='G'?K.c:K.o,2,'c');if(react&&ph!=='stage'&&react<3)T('R/T '+react.toFixed(3),W-6,22,react<.1?K.g:K.w,1,'r');
  if(ph==='stage')T('STAGED... WAIT FOR GREEN',160,60,K.w,1,'c');if(mt&&msg)T(msg,160,60,mc,3,'c');if(ph==='done'&&rv.done)T('RIVAL '+(rv.fin/60).toFixed(3)+' S',160,84,K.w,1,'c');};
 return g;}});

/* =========================== REGATTA =========================== */
A.add({id:'sailing',name:'REGATTA',cat:'SPORTS',time:240,how:"STEER LEFT/RIGHT. YOU CAN'T SAIL INTO THE WIND, SO TACK. ROUND THE BUOYS.",make(){
 const g={over:null,score:0},MK=[[520,140],[870,640],[170,660],[500,1180]];
 let wp=rnd(3000),t=0,wf=0,ws=1,me,rv=[],fin=[],msg='',mc=K.w,mt=0,streaks=[],done=false,bestD=1e9;
 const boat=(x,y,col,sk)=>({x,y,h:0,v:.3,mk:0,col,sk,tr:[],fin:0,tack:1});
 me=boat(480,1260,'#e83a3a',1);me.h=.85;[['#3a7ae8',.9],['#e8c03a',.93],['#3ac87a',.96]].forEach((c,i)=>{const b=boat(400+i*40+(i>0?80:0),1270+i*6,c[0],c[1]-.015+rnd(.03));b.h=i%2?-.85:.85;b.tack=i%2?-1:1;rv.push(b);});
 for(let i=0;i<30;i++)streaks.push({x:rnd(W),y:rnd(H),l:rnd(1)});
 const polar=a=>{if(a<.68)return .05+a/.68*.1;const P=[[.68,.6],[1,.85],[1.57,1],[2.2,.95],[2.8,.78],[PI,.7]];for(let i=1;i<P.length;i++)if(a<=P[i][0]){const f=(a-P[i-1][0])/(P[i][0]-P[i-1][0]);return P[i-1][1]+(P[i][1]-P[i-1][1])*f;}return .7;};
 const brg=(b,x,y)=>Math.atan2(x-b.x,-(y-b.y));
 const sail=(b,turn)=>{const aw=Math.abs(wrap(b.h-wf));b.v+=(ws*polar(aw)*1.3*b.sk-b.v)*.02;if(turn)b.v*=.996;b.x+=Math.sin(b.h)*b.v*1.6;b.y-=Math.cos(b.h)*b.v*1.6;if(t%4===0){b.tr.push([b.x,b.y]);if(b.tr.length>18)b.tr.shift();}};
 const pass=b=>{if(b.mk>=4)return false;const m=MK[b.mk];if(b.mk===3)return Math.abs(b.y-m[1])<10&&Math.abs(b.x-m[0])<70;return Math.hypot(b.x-m[0],b.y-m[1])<26;};
 const aiSteer=b=>{const m=MK[Math.min(3,b.mk)],tb=brg(b,m[0],m[1]),rel=wrap(tb-wf);let want=tb;if(Math.abs(rel)<.8){const opt=wf+b.tack*.82;if(Math.abs(wrap(tb-opt))>1.4||Math.sign(rel)===b.tack&&Math.abs(rel)>.12)b.tack=-b.tack;want=wf+b.tack*.82;}const d=wrap(want-b.h);b.h+=cl(d,-.03,.03);return Math.abs(d)>.03;};
 g.update=()=>{t++;if(mt)mt--;wf=.32*Math.sin((t+wp)*.0017)+.16*Math.sin((t+wp)*.0049+1);ws=.92+.14*Math.sin((t+wp)*.003+2);
  if(!done){const k=A.in(0);me.h+=ax(k)*.034;sail(me,ax(k)!==0);const m=MK[me.mk],dd=Math.hypot(me.x-m[0],me.y-m[1]);if(dd<bestD-20){bestD=dd;g.score+=2;}
   if(pass(me)){me.mk++;bestD=1e9;S('score');if(me.mk>=4){done=true;const place=fin.length+1;g.score+=[600,350,200,100][place-1];msg='FINISHED '+ord(place);mt=999;setTimeout0(place);}else{g.score+=100;msg=me.mk===3?'NOW THE FINISH LINE':'MARK '+me.mk+' ROUNDED';mc=K.y;mt=90;A.burst(160,130,K.y,16,2);}}}
  for(const b of rv){if(b.mk>=4){b.v*=.98;b.x+=Math.sin(b.h)*b.v;b.y-=Math.cos(b.h)*b.v;continue;}const tn=aiSteer(b);sail(b,tn);if(pass(b)){b.mk++;if(b.mk>=4)fin.push(b);}}
  const all=[me,...rv];for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<14&&d>0){const o=(14-d)/2;a.x-=dx/d*o;a.y-=dy/d*o;b.x+=dx/d*o;b.y+=dy/d*o;}}
  for(const s of streaks){s.x+=Math.sin(wf+PI)*1.6-0;s.y+=-Math.cos(wf+PI)*1.6;s.l+=.01;if(s.l>1||s.x<-20||s.x>W+20||s.y<-20||s.y>H+20){s.x=rnd(W);s.y=rnd(H);s.l=0;}}
  if(done&&endT>0&&--endT===0){const place=fin.indexOf(me)+1||1;g.over='FINISHED '+ord(place)+(place===1?' - WIN':'');}};
 let endT=0;const setTimeout0=pl=>{fin.push(me);endT=120;mc=pl===1?K.y:K.w;};
 const drawBoat=(b,ox,oy)=>{const x=b.x-ox,y=b.y-oy;if(x<-30||x>W+30||y<-30||y>H+30)return;b.tr.forEach((p,i)=>alpha(i/b.tr.length*.4,()=>C(p[0]-ox,p[1]-oy,1+i*.08,'#ffffff')));const c=A.c,rel=wrap(wf-b.h),aw=Math.abs(rel),irons=aw<.68;c.save();c.translate(x,y);c.rotate(b.h);c.scale(1.35,1.35);
  alpha(.3,()=>el(1.5,2,7,15,'#002040'));A.poly([[0,-16],[5,-9],[6,3],[4.5,13],[-4.5,13],[-6,3],[-5,-9]],'#f6f6f6',1);A.poly([[0,-14],[3.6,-8],[4.4,3],[3.2,11],[-3.2,11],[-4.4,3],[-3.6,-8]],'#c89a60',1);L(-5.6,0,5.6,0,b.col,1.5);L(-5,-6,5,-6,b.col,1);
  const side=rel>0?-1:1,ba=side*Math.min(1.35,Math.max(.12,(aw-.35)*.62))+(irons?Math.sin(t*.6)*.4:0),ex=Math.sin(-ba)*-16,ey=-4+Math.cos(ba)*16;L(0,-4,ex,ey,'#5a5a64',1.3);
  const bx=(0+ex)/2+side*(irons?1:4)*Math.cos(ba),by=(-4+ey)/2;A.poly([[0,-5],[ex,ey],[bx+side*3,by]],irons?'#c8c8d0':'#ffffff',1);A.poly([[0,-15],[0,-5],[side*-1.5+bx*.3,-9]],irons?'#d8d8e0':'#f0f4ff',1);C(0,-4,1.4,'#3a3a44');
  const hk=rel>0?2.6:-2.6;C(hk,7,2,'#f1c7a3');C(hk,7,2,b===me?'#ffcf3f':'#202028');C(hk*.6,10,1.8,'#e0a57c');c.restore();if(b===me){alpha(.12,()=>{c.fillStyle='#ff4040';c.beginPath();c.moveTo(x,y);c.arc(x,y,34,wf-PI/2-.68,wf-PI/2+.68);c.closePath();c.fill();});}};
 g.draw=()=>{const ox=me.x-160,oy=me.y-130;fill(0,0,W,H,lg(0,0,0,H,[[0,'#1a5a98'],[1,'#22689e']]));
  alpha(.25,()=>{for(let i=Math.floor(ox/32)-1;i<(ox+W)/32+1;i++)for(let j=Math.floor(oy/32)-1;j<(oy+H)/32+1;j++){if(Math.sin(t*.05+i*1.3+j*.7)<.3)continue;const wx=i*32+((j*17)%32)-ox,wy=j*32-oy;L(wx,wy,wx+6,wy-1.5,'#cfe8ff');L(wx+6,wy-1.5,wx+11,wy,'#cfe8ff');}});
  alpha(.3,()=>streaks.forEach(s=>{const dx=Math.sin(wf+PI)*12,dy=-Math.cos(wf+PI)*12;L(s.x,s.y,s.x+dx,s.y+dy,'#e0f0ff');}));
  MK.forEach((m,i)=>{const x=m[0]-ox,y=m[1]-oy;if(i===3){const lx=x-70,rx=x+70;R(lx-2,y-8,4,8,'#ff8a1a');C(lx,y,3,'#ff8a1a');A.poly([[rx-8,y-4],[rx+18,y-4],[rx+14,y+6],[rx-6,y+6]],'#f4f4f4',1);R(rx+4,y-16,1,12,'#444');A.poly([[rx+5,y-16],[rx+13,y-13],[rx+5,y-10]],'#2a5ad8',1);A.person(rx,y+2,{s:.45,c:'#e8c020',id:2});alpha(.35,()=>{for(let xx=lx;xx<rx;xx+=8)R(xx,y,3,1,'#ffffff');});return;}
   const nx=i===me.mk;alpha(.3,()=>A.ring(x,y,7+Math.sin(t*.1)*1.5,'#ffffff'));C(x,y,5,'#ff7a1a');C(x-1.5,y-1.5,1.8,'#ffc080');if(nx)A.ring(x,y,12+Math.sin(t*.15)*2,K.y);T(String(i+1),x+9,y-12,nx?K.y:K.w,1);});
  rv.forEach(b=>drawBoat(b,ox,oy));drawBoat(me,ox,oy);
  const nm=MK[Math.min(3,me.mk)],nx=nm[0]-ox,ny=nm[1]-oy;if(!done&&(nx<8||nx>W-8||ny<20||ny>H-8)){const a=Math.atan2(ny-130,nx-160),ex=cl(160+Math.cos(a)*200,12,W-12),ey=cl(130+Math.sin(a)*200,26,H-12);A.poly([[ex+Math.cos(a)*8,ey+Math.sin(a)*8],[ex+Math.cos(a+2.5)*6,ey+Math.sin(a+2.5)*6],[ex+Math.cos(a-2.5)*6,ey+Math.sin(a-2.5)*6]],K.y,1);}
  R(W-62,H-82,58,78,'rgba(0,20,50,.6)');A.box(W-62,H-82,58,78,'#6a8ab0');const mm=(x,y)=>[W-60+x/1000*54,H-80+y/1320*74];MK.forEach((m,i)=>{const p=mm(m[0],m[1]);R(p[0]-1,p[1]-1,3,3,i===me.mk?K.y:'#ff7a1a');});[...rv,me].forEach(b=>{const p=mm(b.x,b.y);R(p[0]-1,p[1]-1,2,2,b.col);});
  hud(15);const place=1+rv.filter(b=>b.mk>me.mk||b.mk===me.mk&&Math.hypot(b.x-nm[0],b.y-nm[1])<Math.hypot(me.x-nm[0],me.y-nm[1])).length;T(done?'FINISHED':me.mk===3?'TO FINISH':'MARK '+(me.mk+1)+'/3',5,4,K.y,2);T(ord(done?fin.indexOf(me)+1:place),W-5,4,place===1?K.y:K.w,2,'r');
  const wx=150,wy=7;T('WIND',wx-6,4,K.gr,1,'r');const wa=wf+PI;L(wx+6-Math.sin(wa)*6,wy+Math.cos(wa)*6,wx+6+Math.sin(wa)*6,wy-Math.cos(wa)*6,K.c,2);C(wx+6+Math.sin(wa)*6,wy-Math.cos(wa)*6,2,K.c);T((me.v*6).toFixed(1)+' KN',176,4,Math.abs(wrap(me.h-wf))<.68?K.r:K.w,1);
  if(Math.abs(wrap(me.h-wf))<.68&&!done)T('IN IRONS - TURN AWAY FROM THE WIND',160,26,K.r,1,'c');if(mt)T(msg,160,60,mc,2,'c');};
 return g;}});

/* =========================== BMX TRICKS =========================== */
A.add({id:'bmx',name:'BMX TRICKS',cat:'SPORTS',how:'DOWN PUMPS DOWNHILL, UP PULLS AT THE LIP. A/B TRICKS, HOLD LEFT TO BACKFLIP.',make(){
 const g={over:null,score:0},N=12,TR=[['TAILWHIP',28,300],['SUPERMAN',30,260],['NO HANDER',22,200],['TABLETOP',24,180]],BS=['BARSPIN',18,150];
 const J=[];let X=260;for(let i=0;i<N;i++){const G=54+i*4;J.push({x0:X,lip:X+104,l0:X+104+G,l1:X+104+G+62,H:22,n:i+1});X+=104+G+62+90;}const END=X+40;
 const ground=x=>{for(const j of J){if(x<j.x0)break;if(x<j.x0+60)return 200;if(x<=j.lip)return 200-j.H*Math.pow((x-j.x0-60)/44,1.8);if(x<j.l0)return 214;if(x<=j.l1)return 200-(j.H-2)*(.5+.5*Math.cos((x-j.l0)/62*PI));}return 200;};
 const slope=x=>{const f=ground(x+1.5)-ground(x),b=ground(x)-ground(x-1.5);return(Math.abs(f)<Math.abs(b)?f:b)/1.5;};
 let p,lives=3,t=0,msg='',mc=K.w,mt=0,combo=0,crash=0,pull=0,cheer=-1,fin=false,cy=0;
 const reset=x=>{p={x,y:ground(x),v:2.6,vx:0,vy:0,air:false,ang:0,rot:0,tr:null,tp:0,done:[],airT:0};};reset(40);
 const say=(m,c)=>{msg=m;mc=c||K.w;mt=70;};
 g.update=()=>{t++;if(mt)mt--;if(pull)pull--;const k=A.in(0),h=A.hit(0);if(h.u)pull=10;
  if(crash>0){if(--crash===0){if(lives<=0){g.over='CRASHED OUT';return;}const j=J.find(j=>j.l1>p.x-40);reset(j?j.l1+4:p.x);}return;}
  if(fin)return;
  if(!p.air){const s=slope(p.x);let a=.1*s/Math.sqrt(1+s*s)-.003-.0003*p.v*p.v;if(k.d&&s>.12)a+=.09;if(k.d&&s<-.12)a-=.03;if(k.r&&Math.abs(s)<.12&&p.v<3)a+=.05;p.v=Math.max(.45,p.v+a);const ox=p.x;p.x+=p.v/Math.sqrt(1+s*s);p.y=ground(p.x);p.ang=Math.atan(s);
   const j=J.find(j=>ox<=j.lip&&p.x>j.lip);if(j){const ls=(ground(j.lip)-ground(j.lip-2))/2,c=1/Math.sqrt(1+ls*ls);p.air=true;p.y=ground(j.lip);p.vx=p.v*c;p.vy=p.v*ls*c-(pull?1.05:0);p.rot=0;p.tr=null;p.done=[];p.airT=0;S('jump');g.score+=10;if(pull)A.fx.push({txt:'PULL!',x:p.x-p.x+110,y:120,vx:0,vy:-.5,t:24,c:K.c,g:0});}
   if(p.x>=END){fin=true;g.score+=lives*150;g.over='LINE COMPLETE';}return;}
  p.vy+=.16;p.x+=p.vx;p.y+=p.vy;p.airT++;if(k.l)p.rot-=.13;else{const tr_=Math.round(p.rot/TAU)*TAU;p.rot+=cl(tr_-p.rot,-.07,.07);}const gb=ground(p.x+p.vx*6),auto=p.y>gb-38&&p.vy>0?Math.atan(slope(p.x+p.vx*6)):Math.atan2(p.vy,p.vx)*.7;p.ang+=(auto-p.ang)*.1;
  if(!p.tr){if(h.a){const tr=TR[p.done.length%4];p.tr=tr;p.tp=0;S('blip');}else if(h.b){p.tr=BS;p.tp=0;S('blip');}}else if(++p.tp>=p.tr[1]){p.done.push(p.tr);p.tr=null;}
  const gy=ground(p.x);if(p.vy>0&&p.y>=gy){p.y=gy;const s=slope(p.x),inPit=gy>=213,re=Math.abs(wrap(p.rot)),diff=Math.abs(wrap(p.ang+p.rot-Math.atan(s)));
   if(inPit||p.tr||re>.5||diff>.8){lives--;combo=0;crash=70;say(inPit?'CAME UP SHORT!':p.tr?'TRICK NOT FINISHED!':'BAILED!',K.r);S('boom');A.shake=8;A.burst(110,p.y-cy,'#a07040',24,3);return;}
   const flips=Math.round(Math.abs(p.rot)/TAU);let pts=p.done.reduce((s,tr)=>s+tr[2],0)+flips*500+p.airT*2;const nm=p.done.map(t=>t[0]);if(flips)nm.unshift(flips>1?'DOUBLE BACKFLIP':'BACKFLIP');if(nm.length){combo++;pts=Math.round(pts*(1+(combo-1)*.25));S('score');cheer=40;}else S('hit');g.score+=pts;say((nm.slice(0,2).join(' + ')||'CLEAN')+' +'+pts,nm.length?K.y:K.w);
   p.air=false;p.v=Math.max(1,(p.vx+p.vy*s)/Math.sqrt(1+s*s)*.9);if(Math.abs(s)<.05&&gy===200){p.v*=.6;A.fx.push({txt:'FLAT LANDING',x:110,y:140,vx:0,vy:-.5,t:30,c:K.o,g:0});}A.burst(110,p.y-cy,'#b08050',10,1.6);}};
 g.draw=()=>{const camX=p.x-110;cy+=((p.y-150)-cy)*.1;fill(0,0,W,H,lg(0,0,0,H,[[0,'#3a2a6a'],[.55,'#e0705a'],[1,'#f0b070']]));C(250,90-cy*.1,20,'#ffd090');
  for(let i=0;i<20;i++){const x=((i*37-camX*.2)%740+740)%740-40,yb=170-cy*.3;A.poly([[x-14,yb],[x+14,yb],[x,yb-50-(i%3)*12]],'#3a2a4a',1);}
  for(let i=0;i<16;i++){const x=((i*53-camX*.5)%848+848)%848-50,yb=196-cy*.6;A.poly([[x-12,yb],[x+12,yb],[x,yb-40-(i%4)*10]],'#1e3a2a',1);R(x-2,yb,4,8,'#3a2a1a');}
  A.c.fillStyle='#8a5a32';A.c.beginPath();A.c.moveTo(0,H);for(let x=0;x<=W;x+=3)A.c.lineTo(x,ground(camX+x)-cy);A.c.lineTo(W,H);A.c.fill();
  A.c.strokeStyle='#b88050';A.c.lineWidth=2;A.c.beginPath();for(let x=0;x<=W;x+=3){const y=ground(camX+x)-cy+1;x?A.c.lineTo(x,y):A.c.moveTo(x,y);}A.c.stroke();
  for(let x=-(camX%7);x<W;x+=7){const wx=x+camX,gy=ground(wx)-cy;R(x,gy+4+((wx*13)%9),2,2,'#6a4224');if(ground(wx)===200&&((wx|0)%29)<5)L(x,gy,x-1,gy-4,'#4a8a3a');}
  for(const j of J){const sx=j.x0-camX;if(sx<-200||sx>W+40)continue;alpha(.4,()=>fill(j.lip-camX,214-cy,j.l0-j.lip,30,'#3a2414'));R(sx+30,200-cy-24,2,24,'#5a3a1e');R(sx+18,200-cy-30,26,10,'#e8d8b0');T(String(j.n),sx+31,200-cy-28,'#3a2a1a',1,'c');
   if(j.n%3===1){const px=j.l1+30-camX,hy=cheer>0&&Math.abs(j.l1-p.x)<200;A.person(px,200-cy,{s:1,c:CRW[j.n%8],pants:'#2a2a3a',id:j.n,arm1:hy?2.8:0,arm2:hy?-2.8:0});A.person(px+14,200-cy,{s:.95,c:CRW[(j.n+3)%8],pants:'#3a2a1a',id:j.n+2,arm1:hy?2.6:.2,arm2:hy?-2.6:-.2});}}
  {const fx=END-camX;if(fx<W+40){R(fx,160-cy,3,40,'#e8e8e8');A.poly([[fx+3,160-cy],[fx+26,166-cy],[fx+3,172-cy]],'#d82a2a',1);}}
  if(cheer>0)cheer--;
  const sx=p.x-camX,sy=p.y-cy,c=A.c;if(crash){c.save();c.translate(sx,sy-8);c.rotate(t*.3);A.person(0,8,{s:.85,c:'#2a8ae8',pants:'#2a2a3a',id:1,cap:'#e03030'});c.restore();R(sx-20,sy-4,18,3,'#d02a2a');return hudB();}
  c.save();c.translate(sx,sy);c.rotate(p.ang+(p.air?p.rot:0));const tr=p.tr,f=tr?p.tp/tr[1]:0;
  const bike=()=>{const tw=tr&&tr[0]==='TAILWHIP'?Math.cos(f*TAU):1,tt=tr&&tr[0]==='TABLETOP'?1-Math.sin(f*PI)*.7:1;c.save();c.scale(1,tt);C(10,-6,6.2,'#1a1a1a');A.ring(10,-6,6.2,'#555');c.save();c.translate(7,0);c.scale(tw,1);c.translate(-7,0);C(-10,-6,6.2,'#1a1a1a');A.ring(-10,-6,6.2,'#555');for(let i=0;i<4;i++){const a=t*.4+i*PI/4;L(-10+Math.cos(a)*5,-6+Math.sin(a)*5,-10-Math.cos(a)*5,-6-Math.sin(a)*5,'#999',.5);}
   [[-10,-6,0,-5],[0,-5,-4,-14],[-4,-14,-10,-6],[-4,-14,7,-15],[7,-15,0,-5]].forEach(s=>L(s[0],s[1],s[2],s[3],'#e03a3a',1.8));c.restore();L(7,-15,10,-6,'#e03a3a',1.8);const bs=tr&&tr[0]==='BARSPIN'?Math.cos(f*TAU):1;L(7,-15,6,-19,'#222',1.5);L(6-4*bs,-19,6+4*bs,-19,'#333',1.6);R(-6,-16,5,2,'#222');c.restore();};
  bike();const sup=tr&&tr[0]==='SUPERMAN'?Math.sin(f*PI):0,nh=tr&&tr[0]==='NO HANDER'?Math.sin(f*PI):0;c.save();c.translate(0,-5);c.rotate(-sup*1.3);A.person(0,0,{s:.82,c:'#2a8ae8',pants:'#2a2a3a',d:1,id:1,cap:'#e03030',st:.3,arm1:nh>.3?2.7:-1.3,arm2:nh>.3?-2.7:-1.5});c.restore();c.restore();
  hudB();};
 const hudB=()=>{hud(15);T(String(g.score),5,4,K.y,2);if(combo>1)T('COMBO X'+combo,160,4,K.o,1,'c');for(let i=0;i<3;i++)C(W-30+i*10,7,3,i<lives?K.c:'#3a3a4a');const nj=J.find(j=>j.lip>p.x);T(nj?'JUMP '+nj.n+'/'+N:'FINISH',160,10,K.w,1,'c');if(p.air&&p.tr)T(p.tr[0],110,Math.max(20,p.y-cy-50),K.c,1,'c');if(mt)T(msg,160,40,mc,msg.length>18?1:2,'c');if(t<160)T('HOLD RIGHT TO PEDAL ON THE FLAT',160,56,K.w,1,'c');};
 return g;}});

/* =========================== RODEO BULL =========================== */
A.add({id:'rodeo',name:'RODEO BULL',cat:'SPORTS',how:'ARROWS LEAN AGAINST THE BULL TO KEEP THE DOT IN THE RING. LAST 8 SECONDS.',make(){
 const g={over:null,score:0},MV=[['BUCK',0,1],['KICK',0,-1],['SPIN',-1,0],['SPIN',1,0],['SHAKE',0,0]];
 let rd=1,lives=3,ph='chute',pt=0,b={x:0,y:0},bv={x:0,y:0},mv=null,nx=null,ride=0,dsum=0,msg='',mc=K.w,mt=0,t=0,fly=null,face=1,turn=1,cheer=0,clw=[{x:60,v:1.2,st:0},{x:250,v:-1,st:0}],tot=0;
 const pick=()=>{const m=MV[ri(5)];return{n:m[0],dx:m[1],dy:m[2],dur:Math.max(26,64-rd*4-ri(14)),t:0,tele:16};};
 const reset=()=>{ph='chute';pt=0;b={x:0,y:0};bv={x:0,y:0};mv=null;nx=pick();ride=0;dsum=0;fly=null;face=1;turn=1;};reset();
 g.update=()=>{t++;pt++;if(mt)mt--;if(cheer)cheer--;clw.forEach(c=>{c.x+=c.v;c.st+=.3;if(c.x<30||c.x>290)c.v=-c.v;});
  if(ph==='chute'){if(pt>70){ph='ride';pt=0;S('boom');msg='GATE OPEN!';mc=K.y;mt=40;}return;}
  if(ph==='thrown'){fly.x+=fly.vx;fly.y+=fly.vy;fly.vy+=.25;fly.r+=.2;if(fly.y>205){fly.y=205;fly.vx*=.8;fly.vy=0;fly.r=PI/2;}if(pt>110){if(lives<=0){g.over='BUCKED OUT - '+(rd-1)+' RIDES';return;}reset();}return;}
  if(ph==='score'){if(pt>140){rd++;if(rd>6){g.score+=300;g.over='WORLD CHAMP - WIN';return;}reset();}return;}
  ride++;if(ride%60===0){g.score+=1;}
  if(!mv){if(--nx.tele<=0){mv=nx;nx=pick();if(mv.n==='SPIN')turn=mv.dx;}}else{mv.t++;const ph_=mv.t/mv.dur,A_=.0008+rd*.0012;let fx=0,fy=0;if(mv.n==='BUCK'||mv.n==='KICK')fy=mv.dy*A_*Math.sin(ph_*TAU)*1.6;else if(mv.n==='SPIN')fx=mv.dx*A_*(.9+.4*Math.sin(ph_*TAU*2));else{fx=(rnd(2)-1)*A_*2.2;fy=(rnd(2)-1)*A_*2.2;}bv.x+=fx;bv.y+=fy;if(mv.t>=mv.dur)mv=null;}
  const k=A.in(0);bv.x+=ax(k)*.0072+b.x*.0009;bv.y+=ay(k)*.0072+b.y*.0009;bv.x*=.9;bv.y*=.9;b.x+=bv.x;b.y+=bv.y;dsum+=Math.hypot(b.x,b.y);
  if(mv&&mv.n==='SPIN')face+=(turn-face)*.14;
  if(Math.hypot(b.x,b.y)>1){lives--;ph='thrown';pt=0;fly={x:160+b.x*10,y:120,vx:b.x*3+(rnd(2)-1),vy:-4,r:0};msg='BUCKED OFF!';mc=K.r;mt=90;S('boom');A.shake=10;A.burst(160,150,'#c8a070',24,3);return;}
  if(ride>=480){const style=1-dsum/ride,rs=cl(Math.round(28+style*22+rnd(2)),25,50),bs=cl(20+rd*4+ri(4),20,50),sc=rs+bs;tot+=sc;g.score+=sc;msg=sc+' POINTS!';mc=K.y;mt=140;ph='score';pt=0;cheer=140;S('win');A.burst(160,90,K.y,30,3);g.last=[rs,bs];}};
 const bull=(x,y,pa,hop,sx,legP)=>{const c=A.c;c.save();c.translate(x,y-hop);c.rotate(pa);c.scale(sx,1);
  const lg_=(lx,ph)=>{const e=Math.sin(legP+ph)*4;L(lx,-14,lx+e*.5,6+Math.min(0,e),'#3a2014',4.5);R(lx-2.5+e*.5,4+Math.min(0,e),5,3,'#1a1a1a');};lg_(-20,0);lg_(18,PI);
  L(-31,-26,-40,-34+Math.sin(t*.4)*5,'#3a2014',1.5);el(-40,-35+Math.sin(t*.4)*5,2,3,'#1a1008');
  el(0,-22,31,15,'#5a3220');el(-2,-18,26,9,'#6a4028');el(14,-33,13,9,'#4a2818');L(-14,-30,-6,-10,'#d0b070',1.5);
  lg_(-26,PI);lg_(12,0);el(37,-18,10,8,'#3a2014');el(44,-14,5,4,'#7a5a4a');C(45,-13,1.4,'#e8c050');C(36,-22,1.4,'#ffffff');C(36.4,-22,.7,'#000000');
  A.poly([[32,-24],[28,-32],[24,-36],[27,-30]],'#e8dcc0',1);A.poly([[40,-24],[44,-32],[49,-35],[45,-29]],'#e8dcc0',1);c.restore();};
 g.draw=()=>{fill(0,0,W,H,lg(0,0,0,H,[[0,'#0c0a1a'],[1,'#2a1a24']]));[[30,4],[290,4]].forEach(([x,y])=>{R(x-12,y,24,10,'#c8c0a8');for(let i=0;i<4;i++)C(x-8+i*5.4,y+5,2,'#fff4c0');alpha(.06,()=>A.poly([[x-12,y+10],[x+12,y+10],[160+x*.3,150],[100+x*.3,150]],'#fff0c0',1));});
  crowd(-2,32,W+4,8,4,t,cheer?3:0);fill(0,96,W,44,'#6a4a2a');for(let x=0;x<W;x+=4)R(x,96,1,44,'rgba(0,0,0,.25)');for(let i=0;i<3;i++)R(0,100+i*14,W,3,'#8a6a3a');for(let x=8;x<W;x+=64)R(x,104,44,16,['#e8e0c8','#b02a2a','#2a4a8a','#e8b020','#2a6a3a'][(x/64|0)%5]);
  fill(0,136,W,H-136,lg(0,136,0,H,[[0,'#a07848'],[1,'#c89a62']]));alpha(.25,()=>{for(let i=0;i<40;i++)el((i*47)%W,150+(i*29)%86,3,1.2,'#7a5430');});
  for(let i=0;i<5;i++)R(2+i*6,100,3,46,'#8a8a96');R(0,104,34,3,'#8a8a96');R(0,124,34,3,'#8a8a96');
  clw.forEach((c,i)=>A.person(c.x,232,{s:1.05,c:i?'#e83a8a':'#30a0e8',pants:i?'#f0c020':'#e83030',st:c.st,id:i+2,cap:i?'#202020':'#e8c020',arm1:cheer?2.6:Math.sin(c.st)*.6,arm2:cheer?-2.6:-Math.sin(c.st)*.6}));
  const prog=mv?mv.t/mv.dur:0,pa=mv&&mv.n==='BUCK'?-.32*Math.sin(prog*PI):mv&&mv.n==='KICK'?.3*Math.sin(prog*PI):mv&&mv.n==='SHAKE'?Math.sin(t*.9)*.08:0,hop=ph==='ride'?Math.abs(Math.sin(t*.22))*7*(1+rd*.1):0,sx=(face<0?-1:1)*Math.max(.62,Math.abs(face));
  const bx=160,by=196,c=A.c;if(nx&&!mv&&nx.tele<10&&ph==='ride')T('!',bx+52*sx,by-60,K.r,2,'c');
  if(ph!=='thrown'){c.save();c.translate(bx,by-hop);c.rotate(pa);c.scale(sx,1);c.save();c.translate(-2,-34);c.rotate(b.y*.55+b.x*.2);A.person(0,10,{s:.95,c:'#4a6ab0',pants:'#2a3a5a',id:1,hair:'#5a3a1e',arm1:2.4+Math.sin(t*.3)*.4,arm2:.2,d:1});R(-7,-23.5,14,2.2,'#6a4a2a');R(-4,-29,8,6,'#7a5a3a');c.restore();c.restore();}
  bull(bx,by,pa,hop,sx,t*(ph==='ride'?.5:.1));
  if(ph!=='thrown'){c.save();c.translate(bx,by-hop);c.rotate(pa);c.scale(sx,1);L(-4,-35,6,-27,'#2a3a5a',3.5);L(6,-27,4,-18,'#2a3a5a',3);R(1,-19,6,4,'#5a3a1a');c.restore();}
  else{c.save();c.translate(fly.x,fly.y);c.rotate(fly.r);A.person(0,0,{s:.95,c:'#4a6ab0',pants:'#2a3a5a',id:1,hair:'#5a3a1e',arm1:2.5,arm2:-2.5});c.restore();}
  R(0,0,W,30,'rgba(0,0,0,.55)');T('RIDE '+rd+'/6',5,4,K.y,2);for(let i=0;i<3;i++)C(10+i*10,22,3,i<lives?K.c:'#3a3a4a');
  const left=Math.max(0,(480-ride)/60);T(ph==='ride'?left.toFixed(1):ph==='score'?'8.0':'-.-',160,4,left<2&&ph==='ride'?K.g:K.w,3,'c');
  const gx=290,gy=58;alpha(.7,()=>C(gx,gy,24,'#101018'));A.ring(gx,gy,22,'#ff4040');A.ring(gx,gy,14,'#5a5a6a');A.ring(gx,gy,22.8,'#ff4040');C(gx+b.x*22,gy+b.y*22,3.5,Math.hypot(b.x,b.y)>.7?K.r:K.y);if(mv&&ph==='ride')T(mv.n,gx,gy+28,K.o,1,'c');T('BALANCE',gx,34,K.gr,1,'c');
  if(mt)T(msg,160,64,mc,3,'c');if(ph==='score'&&g.last)T('RIDER '+g.last[0]+'  BULL '+g.last[1],160,90,K.w,1,'c');if(ph==='chute')T('RIDE '+rd+' - GET READY',160,64,K.w,2,'c');};
 return g;}});

})();
