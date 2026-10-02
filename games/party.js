(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const PC=['#2fd6c3','#ff4f9a'];
const tag=(txt,col,y)=>{const w=txt.length*4+12;X.panel(160-w/2,y-3,w,11,col);T(txt,160,y,col,1,'c');};
const powerBar=(x,y,f)=>{X.panel(x-3,y-3,16,106,'#ffffff');X.rr(x,y,10,100,4,'rgba(0,0,0,.4)');const h=f*96;X.rr(x+1,y+98-h,8,h,3,X.lg(0,y+98,0,y,['#3ddc84','#ffcf3f','#ff4f6d']));};

/* ---- POOL SHARK ---- */
A.add({id:'pool',name:'POOL SHARK',cat:'PARTY',vs:1,how:'LEFT/RIGHT AIM. HOLD A, RELEASE TO SHOOT. POT YOUR 3 BALLS THEN THE BLACK.',make(){
 const g={over:null,score:0},fx=X.fx(),RED='#e03040',YEL='#ffc020',BLK='#1a1a1a';let balls=[],p=0,ang=0,pow=0,chg=false,moving=false,potted=[[],[]],msg='',mt=0,think=0,aiPlan=null,strike=0;
 const cue=()=>balls.find(b=>b.id===0);
 const setup=()=>{balls=[{id:0,x:80,y:120,vx:0,vy:0,c:'#f8f4ec'}];const cols=[RED,YEL,RED,BLK,YEL,RED,YEL];let n=1;for(let r=0;r<3;r++)for(let j=0;j<=r;j++){balls.push({id:n,x:210+r*12,y:120+(j-r/2)*13,vx:0,vy:0,c:cols[n-1],t:cols[n-1]===RED?0:cols[n-1]===YEL?1:2});n++;}};setup();
 const POCK=[[14,24],[160,20],[306,24],[14,216],[160,220],[306,216]];
 g.update=()=>{if(mt>0)mt--;if(strike)strike--;if(moving){let any=false;for(const b of balls){b.x+=b.vx;b.y+=b.vy;b.vx*=.985;b.vy*=.985;if(Math.hypot(b.vx,b.vy)<.05){b.vx=b.vy=0;}else any=true;if(b.x<20){b.x=20;b.vx=Math.abs(b.vx);}if(b.x>W-20){b.x=W-20;b.vx=-Math.abs(b.vx);}if(b.y<28){b.y=28;b.vy=Math.abs(b.vy);}if(b.y>H-28){b.y=H-28;b.vy=-Math.abs(b.vy);}}
   for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<12&&d>0){const nx=dx/d,ny=dy/d,rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){a.vx+=rv*nx;a.vy+=rv*ny;b.vx-=rv*nx;b.vy-=rv*ny;S('hit');if(rv<-1.5)fx.spark((a.x+b.x)/2,(a.y+b.y)/2,'#ffffff',3,1.2);}const o=(12-d)/2;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;}}
   for(const b of balls.slice()){const pk=POCK.find(q=>Math.hypot(q[0]-b.x,q[1]-b.y)<11);if(pk){balls.splice(balls.indexOf(b),1);S('score');fx.ring(pk[0],pk[1],'#ffffff',16,12);fx.spark(pk[0],pk[1],b.c==='#1a1a1a'?'#888':b.c,10,2);if(b.id===0){balls.push({id:0,x:80,y:120,vx:0,vy:0,c:'#f8f4ec'});msg='SCRATCH';mt=60;}else if(b.t===2){const mine=potted[p].length>=3;g.over=mine?A.win(p):A.win(1-p);return;}else{const own=b.t===p;potted[own?p:1-p].push(b);if(own){msg='POTTED!';g.again=true;}else msg='WRONG BALL';mt=60;}}}
   if(!any){moving=false;if(!g.again)p=1-p;g.again=false;think=0;aiPlan=null;}return;}
  const c=cue();if(!c)return;
  if(A.cpu&&p===1){if(++think<40)return;if(!aiPlan){const tg=balls.filter(b=>b.t===1).concat(potted[1].length>=3?balls.filter(b=>b.t===2):[])[0]||balls.find(b=>b.id!==0);let best=null,bs=1e9;for(const q of POCK){const dx=q[0]-tg.x,dy=q[1]-tg.y,d=Math.hypot(dx,dy),gx=tg.x-dx/d*12,gy=tg.y-dy/d*12,a=Math.atan2(gy-c.y,gx-c.x);const sc=d+Math.abs(Math.atan2(dy,dx)-a)*80;if(sc<bs){bs=sc;best={a:a+(rnd(.1)-.05)*(2-A.ai*1.5),pw:.55+rnd(.25)};}}aiPlan=best;}
   ang+=(aiPlan.a-ang)*.1;if(Math.abs(aiPlan.a-ang)<.01&&think>70){c.vx=Math.cos(aiPlan.a)*(2+aiPlan.pw*7);c.vy=Math.sin(aiPlan.a)*(2+aiPlan.pw*7);moving=true;strike=8;S('shoot');}return;}
  const k=A.in(human(p));ang+=ax(k)*(k.b?.008:.03);if(k.a){chg=true;pow=.5+.5*Math.sin(A.t*.08-1.57);}else if(chg){chg=false;c.vx=Math.cos(ang)*(2+pow*7);c.vy=Math.sin(ang)*(2+pow*7);moving=true;strike=8;S('shoot');fx.spark(c.x,c.y,'#ffffff',4,1.5);}};
 const bg=()=>{X.sky(['#1a120a','#0a0604']);X.rr(4,10,W-8,H-20,10,X.lg(0,10,0,H-10,['#9a5a2a','#6a3814','#4a2408']));A.c.fillStyle='rgba(255,220,170,.12)';A.c.fillRect(10,12,W-20,2);X.rr(12,20,W-24,H-40,4,'#0e5a2e');X.rr(16,24,W-32,H-48,3,X.rg(160,120,10,160,120,170,['#2ab060','#1e8a45','#14683a']));
  for(const x of[60,110,210,260]){X.disc(x,15,1.4,'#f0e0c0');X.disc(x,H-15,1.4,'#f0e0c0');}for(const y of[70,120,170]){X.disc(8,y,1.4,'#f0e0c0');X.disc(W-8,y,1.4,'#f0e0c0');}A.c.strokeStyle='rgba(255,255,255,.18)';A.c.lineWidth=1;A.c.beginPath();A.c.moveTo(80,24);A.c.lineTo(80,H-24);A.c.stroke();
  POCK.forEach(q=>{X.disc(q[0],q[1],10.5,'#2a1a0a');X.disc(q[0],q[1],8.5,X.rg(q[0],q[1],1,q[0],q[1],8.5,['#000000','#0a0a0a','#2a2a2a']));});};
 g.draw=()=>{X.cache('pool_bg',bg);const c=A.c;
  balls.forEach(b=>{X.shadow(b.x+1.5,b.y+2.5,6,4.5,.35);X.orb(b.x,b.y,6,b.c);if(b.id&&b.t!==2)X.disc(b.x,b.y,2.2,'#ffffff');if(b.t===2){X.disc(b.x,b.y,2.2,'#ffffff');T('8',b.x+.5,b.y-1.5,'#111',.6,'c',1);}});
  const cb=cue();if(cb&&!moving){let x=cb.x,y=cb.y,hit=null;for(let i=1;i<60&&!hit;i++){x=cb.x+Math.cos(ang)*i*4;y=cb.y+Math.sin(ang)*i*4;if(x<20||x>W-20||y<28||y>H-28)break;hit=balls.find(b=>b.id!==0&&Math.hypot(b.x-x,b.y-y)<12);if(i%2===0&&!hit)X.disc(x,y,.8,'rgba(255,255,255,.7)');}if(hit){A.ring(x,y,6,'rgba(255,255,255,.6)');}
   const back=8+(chg?pow*30:0);c.save();c.translate(cb.x,cb.y);c.rotate(ang);X.shadow(-back-55,5,50,2.5,.25);c.fillStyle=X.lg(0,-2,0,2,['#f0d090','#b07830','#6a4010']);c.beginPath();c.moveTo(-back,-1.2);c.lineTo(-back-110,-2.6);c.lineTo(-back-110,2.6);c.lineTo(-back,1.2);c.closePath();c.fill();c.fillStyle='#2a2a2a';c.fillRect(-back-110,-2.6,30,5.2);c.fillStyle='#4dabff';c.fillRect(-back-1.5,-1.2,2,2.4);c.restore();if(chg)powerBar(296,70,pow);}
  fx.draw();X.bar();T(A.nm(0),6,6,K.c,1);for(let i=0;i<3;i++)X.orb(28+i*10,8,3.6,i<potted[0].length?RED:'rgba(255,255,255,.12)');T(A.nm(1),W-6,6,K.p,1,'r');for(let i=0;i<3;i++)X.orb(W-30-i*10,8,3.6,i<potted[1].length?YEL:'rgba(255,255,255,.12)');T('RED',60,6,RED,1);T('YELLOW',W-62,6,YEL,1,'r');tag(A.nm(p)+(potted[p].length>=3?' ON BLACK':' TO SHOOT'),PC[p],226);if(mt>0)X.ot(msg,160,110,K.y,2,'c');};
 return g;}});

/* ---- SHUFFLEBOARD ---- */
A.add({id:'shuffle',name:'SHUFFLEBOARD',cat:'PARTY',vs:1,how:'LEFT/RIGHT AIM. A LOCKS POWER. 4 PUCKS EACH, HIGHEST ZONE SCORES.',make(){
 const g={over:null,score:0},fx=X.fx();let pucks=[],p=0,n=0,live=null,t=0,aim=0,ph=0,sc=[0,0],rnd_=1,msg='',mt=0;
 g.update=()=>{t++;if(mt>0)mt--;if(live){live.y-=live.vy;live.x+=live.vx;live.vy*=.985;live.vx*=.985;for(const q of pucks){const dx=q.x-live.x,dy=q.y-live.y,d=Math.hypot(dx,dy);if(d<14&&d>0){const nx=dx/d,ny=dy/d,rv=(-live.vy)*ny+live.vx*nx;if(rv>0){q.vx=(q.vx||0)+rv*nx;q.vy=(q.vy||0)+rv*ny;live.vx-=rv*nx;live.vy+=rv*ny;S('hit');fx.spark((q.x+live.x)/2,(q.y+live.y)/2,'#ffffff',5,1.8);}}}pucks.forEach(q=>{q.x+=q.vx||0;q.y+=q.vy||0;q.vx=(q.vx||0)*.97;q.vy=(q.vy||0)*.97;});
   if(Math.abs(live.vy)+Math.abs(live.vx)<.05){if(live.y>20&&live.x>40&&live.x<W-40)pucks.push(live);else fx.pop(live.x,Math.max(30,live.y),'OFF!',K.r);live=null;n++;p=1-p;ph=0;t=0;pucks=pucks.filter(q=>q.y>20);
    if(n>=8){const zone=q=>q.y<60?3:q.y<100?2:q.y<140?1:0;const s=[0,0];pucks.forEach(q=>s[q.o]+=zone(q));sc[0]+=s[0];sc[1]+=s[1];msg=A.nm(0)+' +'+s[0]+'   '+A.nm(1)+' +'+s[1];mt=90;pucks=[];n=0;rnd_++;S('score');if(rnd_>3)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}}return;}
  const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));if(ph===0){if(cpu){if(t>40){aim=(rnd(.3)-.15)*(2-A.ai);ph=1;t=0;}}else{aim=cl(aim+ax(k)*.02,-.5,.5);if(h.a){ph=1;t=0;}}}
  else{const pw=.5+.5*Math.sin(t*.07);if(cpu?t>25+rnd(20):h.a){const P=cpu?.55+rnd(.2)*(2-A.ai):pw;live={x:160+Math.sin(aim)*40,y:225,vy:2+P*3.5,vx:Math.sin(aim)*(2+P*2),o:p};S('shoot');}}};
 const bg=()=>{X.vg(0,0,W,H,['#2a1a10','#140a04']);X.rr(34,16,252,H-20,6,X.lg(34,0,286,0,['#5a3418','#8a5428','#5a3418']));X.rr(40,20,240,H-30,3,X.lg(0,20,0,H,['#f8e0a8','#ecc888','#e0b878']));const c=A.c;c.fillStyle='rgba(120,70,20,.08)';for(let x=44;x<280;x+=9)c.fillRect(x,20,2,H-30);
  [[20,60,3,'#ff4f6d'],[60,100,2,'#ffcf3f'],[100,140,1,'#4dabff']].forEach(z=>{c.fillStyle=X.rgba(z[3],.18);c.fillRect(40,z[0],240,z[1]-z[0]);c.fillStyle=X.rgba(z[3],.8);c.fillRect(40,z[1]-1,240,2);T(z[2],160,(z[0]+z[1])/2-5,X.rgba(z[3],.7),3,'c',1);});c.fillStyle='#d02a3a';c.fillRect(40,20,240,3);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(44,20,232,H-30);};
 const puck=(x,y,o)=>{X.shadow(x+1.5,y+2.5,7.5,5,.35);X.disc(x,y+1.4,7,'#6a6a78');X.disc(x,y,7,X.rg(x-2,y-3,1,x,y,7,['#ffffff','#c8ccd8','#8a8e9a']));X.disc(x,y,4.5,X.rg(x-1,y-2,0,x,y,4.5,[X.lt(PC[o],1.4),PC[o],X.lt(PC[o],.6)]));};
 g.draw=()=>{X.cache('shuffle_bg',bg);pucks.forEach(q=>puck(q.x,q.y,q.o));if(live)puck(live.x,live.y,live.o);
  if(!live){const sx=160+Math.sin(aim)*40;A.c.globalAlpha=.8;for(let i=1;i<10;i++)X.disc(sx+Math.sin(aim)*i*12,225-i*12*Math.cos(aim),1.6-i*.08,K.y);A.c.globalAlpha=1;puck(sx,225,p);if(ph===1)powerBar(12,60,.5+.5*Math.sin(t*.07));}
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);T('ROUND '+Math.min(rnd_,3)+'/3  PUCK '+(n+1)+'/8',160,6,K.w,1,'c');tag(A.nm(p)+' THROWS',PC[p],226);if(mt>0)X.ot(msg,160,180,K.y,1,'c');};
 return g;}});

/* ---- DODGEBALL ---- */
A.add({id:'dodgeball',name:'DODGEBALL',cat:'PARTY',vs:1,how:'MOVE ON YOUR HALF. A THROWS AT YOUR RIVAL. 3 HITS WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let pl,balls=[],sc=[0,0],wait=40,hitF=[0,0];const reset=()=>{pl=[{x:70,y:120,fx:1,fy:0,cd:0,has:true,th:0},{x:250,y:120,fx:-1,fy:0,cd:0,has:true,th:0}];balls=[];wait=40;};reset();
 g.update=()=>{hitF=hitF.map(v=>v?v-1:0);pl.forEach(q=>{if(q.th)q.th--;});if(wait>0){wait--;return;}if(A.cpu){const q=pl[1],o=pl[0],inc=balls.find(b=>b.o===0&&b.vx>0&&Math.abs(b.y-q.y)<20),loose=balls.find(b=>b.loose&&b.x>160);let b={};if(inc){if(!q.dg||q.dgb!==inc){q.dgb=inc;q.dg=q.y>120?-1:1;if(q.y<70)q.dg=1;if(q.y>170)q.dg=-1;}b={u:q.dg<0,d:q.dg>0};}else q.dg=0;if(inc)b.a=false;else if(!q.has&&loose)b={l:q.x>loose.x+3,r:q.x<loose.x-3,u:q.y>loose.y+3,d:q.y<loose.y-3};else if(q.has)b={u:q.y>o.y+4,d:q.y<o.y-4,a:Math.abs(q.y-o.y)<22&&Math.random()<.1+.15*A.ai};else b={u:q.y>124,d:q.y<116};A.bot(b);}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),sp=i&&A.cpu?1.3+1.3*A.ai:2.6;q.mv=!!(ax(k)||ay(k));if(ax(k)||ay(k)){q.fx=ax(k);q.fy=ay(k);}q.x=cl(q.x+ax(k)*sp,i?172:14,i?W-14:148);q.y=cl(q.y+ay(k)*sp,34,H-14);if(q.cd>0)q.cd--;
   if(A.hit(i).a&&q.has&&q.cd===0){q.has=false;q.cd=20;q.th=10;const o=pl[1-i],dx=o.x-q.x,dy=o.y-q.y,d=Math.hypot(dx,dy);balls.push({x:q.x,y:q.y-14,vx:dx/d*5.5,vy:dy/d*5.5+(rnd(1)-.5),o:i,loose:false,tr:[]});S('shoot');}
   for(const b of balls){if(b.loose&&Math.hypot(b.x-q.x,b.y-(q.y-6))<14&&!q.has){q.has=true;b.dead=1;S('blip');}else if(!b.loose&&b.o!==i&&Math.hypot(b.x-q.x,b.y-(q.y-12))<12){b.dead=1;sc[1-i]++;S('boom');hitF[i]=20;fx.spark(q.x,q.y-14,'#ffffff',14,3);fx.ring(q.x,q.y-14,K.r,26);fx.pop(q.x,q.y-40,'OUT!',K.r);if(sc[1-i]>=3){g.over=A.win(1-i);return;}reset();return;}}}
  for(const b of balls){if(!b.loose){b.tr.unshift([b.x,b.y]);if(b.tr.length>6)b.tr.pop();}b.x+=b.vx;b.y+=b.vy;if(!b.loose){b.vx*=.995;}else{b.vx*=.95;b.vy*=.95;b.tr=[];}if(b.x<14||b.x>W-14){b.vx*=-.6;b.x=cl(b.x,14,W-14);b.loose=true;fx.spark(b.x,b.y,'#ffd0c0',4,1.2);}if(b.y<34||b.y>H-14){b.vy*=-.6;b.y=cl(b.y,34,H-14);b.loose=true;}if(!b.loose&&Math.abs(b.vx)<1)b.loose=true;}balls=balls.filter(b=>!b.dead);};
 const bg=()=>{X.sky(['#2a1a3a','#1a1028'],30);X.wood(0,30,W,H-30,'#c8945a',true);X.vg(0,30,W,H-30,['rgba(255,240,200,.12)','rgba(0,0,0,.18)']);const c=A.c;c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.5;c.strokeRect(10,30,W-20,H-40);c.beginPath();c.moveTo(160,30);c.lineTo(160,H-10);c.stroke();c.beginPath();c.arc(160,120,20,0,6.283);c.stroke();c.fillStyle='rgba(47,214,195,.08)';c.fillRect(11,31,148,H-42);c.fillStyle='rgba(255,79,154,.08)';c.fillRect(161,31,148,H-42);X.vignette(.35);};
 const rball=(x,y,r)=>{X.orb(x,y,r||5,'#e83a3a');A.c.strokeStyle='rgba(120,10,10,.5)';A.c.lineWidth=.6;A.c.beginPath();A.c.arc(x,y,(r||5)*.7,.3,2.6);A.c.stroke();};
 g.draw=()=>{X.cache('dodge_bg',bg);
  balls.forEach(b=>{b.tr.forEach((q,i)=>{A.c.globalAlpha=.3*(1-i/6);X.disc(q[0],q[1],4.5-i*.5,'#ff8080');});A.c.globalAlpha=1;X.shadow(b.x,b.loose?b.y+5:b.y+16,4.5,1.6,.3);rball(b.x,b.y);});
  pl.slice().sort((a,b)=>a.y-b.y).forEach(q=>{const i=pl.indexOf(q);if(hitF[i]&&hitF[i]%4<2)return;const d=i?-1:1;A.person(q.x,q.y+10,{c:PC[i],pants:'#2a2a3a',st:q.mv?(q.x+q.y)*.3:0,s:.85,id:i*5,d,arm1:q.th?(d>0?-2.4:2.4):undefined,arm2:q.has?(d>0?-1:1):undefined});if(q.has)rball(q.x+d*9,q.y-10,4.5);});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);for(let i=0;i<3;i++){X.heart(118+i*10,8,.8,i<3-sc[1]?'#2fd6c3':'rgba(255,255,255,.15)');X.heart(202-i*10,8,.8,i<3-sc[0]?'#ff4f9a':'rgba(255,255,255,.15)');}if(wait>0)X.ot('READY',160,60,K.y,2,'c');};
 return g;}});

/* ---- BALLOON BLITZ ---- */
A.add({id:'balloons',name:'BALLOON BLITZ',cat:'PARTY',vs:1,how:'TAP A TO PUMP. FILL YOUR BALLOON FIRST. TOO FAST AND IT POPS.',make(){
 const g={over:null,score:0},fx=X.fx();let s=[0,0],heat=[0,0],t=-90,pop=[0,0],pump=[0,0];
 g.update=()=>{t++;pump=pump.map(v=>v?v-1:0);if(t<0)return;for(let i=0;i<2;i++){if(pop[i]>0){pop[i]--;if(pop[i]===0){s[i]=0;heat[i]=0;}continue;}if(A.cpu&&i===1){if(t%(4-A.ai*2|0)===0&&heat[1]<.8){s[1]+=1;heat[1]+=.06;pump[1]=6;}}else if(A.hit(i).a){s[i]+=1;heat[i]+=.08;pump[i]=6;if(heat[i]>1){pop[i]=60;S('boom');const x=90+i*140,r=10+s[i]*.5;fx.debris(x,150-r,PC[i],18,3.5);fx.ring(x,150-r,'#ffffff',r*2,16);fx.flash('#ffffff',6);}else S('blip');}heat[i]=Math.max(0,heat[i]-.01);if(s[i]>=100){g.over=A.win(i);S('win');}}};
 const bg=()=>{X.sky(['#ff9a6a','#ffd0a0','#a8e0ff'],200);X.disc(40,40,14,'rgba(255,255,255,.6)');const c=A.c;for(let i=0;i<10;i++){c.fillStyle=['#ff4f6d','#ffcf3f','#4dabff','#3ddc84'][i%4];X.poly([[i*34,0],[i*34+34,0],[i*34+17,14]],c.fillStyle);}X.hills(205,20,'#5ab050',0,.03,2);X.turf(0,200,W,40,'#3f8a3a','#4a9a44',10,true);};
 g.draw=()=>{X.cache('balloon_bg',bg);const c=A.c;[0,1].forEach(i=>{const x=90+i*140,r=10+s[i]*.5,col=PC[i],wob=Math.sin(A.t*.1+i)*1.5,ph=pump[i]*.6;
   X.rr(x-12,190,24,14,3,X.lg(0,190,0,204,['#c8ccd8','#6a6e80']));c.fillStyle='#888';c.fillRect(x-1.5,172+ph,3,20-ph);X.rr(x-9,170+ph,18,4,2,'#ff4f6d');
   if(!pop[i]){const by=150-r;c.strokeStyle='rgba(60,60,60,.7)';c.lineWidth=.8;c.beginPath();c.moveTo(x,150);c.quadraticCurveTo(x+wob*3,160,x,190);c.stroke();X.poly([[x-3,151],[x+3,151],[x,147]],X.lt(col,.7));c.save();c.translate(x+wob,by);X.ell(0,0,r*.92,r*1.08,X.rg(-r*.35,-r*.4,1,0,0,r*1.1,[X.lt(col,1.6),col,X.lt(col,.55)]));X.ell(-r*.35,-r*.45,r*.2,r*.32,'rgba(255,255,255,.55)',-.4);c.restore();if(heat[i]>.75&&A.t%8<4)X.glow(x,by,r*1.4,'#ff2020',.3);}
   X.meter(x-30,212,60,7,Math.min(1,heat[i]),heat[i]>.8?'#ff4f6d':'#ffcf3f');X.ot(A.nm(i)+' '+Math.min(100,s[i])+'%',x,224,col,1,'c');});fx.draw();X.ot(t<0?'READY...':'PUMP!',160,22,K.w,3,'c');};
 return g;}});

/* ---- COLOR RUSH ---- */
A.add({id:'colorrush',name:'COLOR RUSH',cat:'PARTY',vs:1,how:'PRESS A ONLY WHEN THE WORD MATCHES ITS COLOUR. FIRST TO 10.',make(){
 const g={over:null,score:0},CO=[['RED','#ff4f6d'],['BLUE','#4dabff'],['GREEN','#3ddc84'],['PINK','#ff7fd0'],['GOLD','#ffcf3f']],fx=X.fx();let w=0,c=0,sc=[0,0],t=0,dur=80,fl=[0,0],cpuAt=999,pop=0;
 const next=()=>{w=ri(5);c=Math.random()<.4?w:ri(5);t=0;pop=8;dur=Math.max(35,80-(sc[0]+sc[1])*3);cpuAt=w===c?20+ri(40)-A.ai*15:(Math.random()<.15*(2-A.ai*2)?30:999);};next();
 g.update=()=>{t++;if(pop)pop--;fl=fl.map(v=>v>0?v-1:v<0?v+1:0);if(A.cpu)A.bot({a:t===cpuAt});for(let i=0;i<2;i++)if(A.hit(i).a){if(w===c){sc[i]++;fl[i]=15;S('coin');fx.spark(i?260:60,120,PC[i],12,2.5);fx.pop(i?260:60,100,'+1',PC[i]);}else{sc[i]=Math.max(0,sc[i]-1);fl[i]=-15;S('lose');fx.pop(i?260:60,100,'-1',K.r);}if(sc[i]>=10){g.over=A.win(i);return;}next();return;}if(t>dur)next();};
 g.draw=()=>{X.cache('color_bg',()=>{X.sky(['#1a1030','#0a0618']);const cc=A.c;cc.strokeStyle='rgba(255,255,255,.04)';for(let i=-H;i<W;i+=16){cc.beginPath();cc.moveTo(i,H);cc.lineTo(i+H,0);cc.stroke();}});const cc=A.c;
  [0,1].forEach(i=>{if(fl[i]){cc.fillStyle=fl[i]>0?'rgba(61,255,139,'+fl[i]/60+')':'rgba(255,79,109,'+(-fl[i]/50)+')';cc.fillRect(i?W/2:0,18,W/2,H);}});
  const s=1+pop*.03;X.panel(160-104*s,115-46*s,208*s,92*s,'#ffffff');X.glow(160,112,90,CO[c][1],.25);cc.save();cc.translate(160,112);cc.scale(s,s);T(CO[w][0],0,-12,CO[c][1],5,'c');cc.restore();X.meter(64,170,192,6,1-t/dur,t/dur>.7?'#ff4f6d':'#ffffff');
  [0,1].forEach(i=>{for(let j=0;j<10;j++)X.disc(i?W-14-j*9:14+j*9,214,3,j<sc[i]?PC[i]:'rgba(255,255,255,.12)');});fx.draw();X.bar();A.hud2(sc[0],sc[1]);X.ot('WORD = COLOUR?  PRESS A',160,196,K.w,1,'c');};
 return g;}});

/* ---- BOMB PASS ---- */
A.add({id:'bombpass',name:'BOMB PASS',cat:'PARTY',vs:1,how:'TYPE THE ARROWS TO PASS THE BOMB. DON\'T HOLD IT AT ZERO.',make(){
 const g={over:null,score:0},KS=['l','u','r','d'],fx=X.fx();let holder=0,seq=[],idx=0,fuse=0,sc=[0,0],wait=40,cpuT=0,fly=0,bad=0;
 const newSeq=()=>{seq=[];for(let i=0;i<3+ri(2);i++)seq.push(ri(4));idx=0;cpuT=20+ri(30)-A.ai*12;};
 const reset=()=>{holder=ri(2);fuse=300+ri(200);newSeq();wait=40;};reset();
 const pass=()=>{holder=1-holder;newSeq();S('hit');fly=16;};
 g.update=()=>{if(fly)fly--;if(bad)bad--;if(wait>0){wait--;return;}fuse--;if(fuse<=0){sc[1-holder]++;S('boom');const x=80+holder*160;fx.spark(x,96,K.o,28,4);fx.debris(x,96,'#333',12,3);fx.ring(x,96,'#ffffff',60,20);fx.flash('#ffffff',10);A.shake=10;if(sc[1-holder]>=3){g.over=A.win(1-holder);return;}reset();return;}
  if(A.cpu&&holder===1){if(--cpuT<=0){cpuT=10+ri(20)-A.ai*8;if(Math.random()<.1*(1-A.ai))idx=0;else idx++;S('blip');if(idx>=seq.length)pass();}return;}
  const h=A.hit(human(holder));for(let k=0;k<4;k++)if(h[KS[k]]){if(k===seq[idx]){idx++;S('blip');if(idx>=seq.length)pass();}else{idx=0;bad=8;S('lose');}}};
 const key=(x,y,k,st)=>{const col=st===2?'#3ddc84':st===1?'#ffcf3f':'#5a5478',c=A.c;X.rr(x-11,y-9,22,20,4,'rgba(0,0,0,.4)');X.rr(x-11,y-11,22,20,4,X.lg(0,y-11,0,y+9,[X.lt(col,1.35),col]));const rot=[Math.PI,-Math.PI/2,0,Math.PI/2][k];c.save();c.translate(x,y-1);c.rotate(rot);X.poly([[6,0],[-2,-6],[-2,6]],st?'#1a1a2a':'#c8c0e8');c.restore();};
 g.draw=()=>{X.cache('bomb_bg',()=>{X.sky(['#2a1a3a','#1a0e24'],170);X.vg(0,170,W,70,['#4a3a5a','#2a2036']);X.glow(80,120,70,'#2fd6c3',.12);X.glow(240,120,70,'#ff4f9a',.12);});const c=A.c,danger=fuse<120;if(danger&&A.t%20<10){c.fillStyle='rgba(255,40,40,.08)';c.fillRect(0,0,W,H);}
  [0,1].forEach(i=>{const x=80+i*160,has=holder===i&&!fly;A.person(x,190,{c:PC[i],pants:'#2a2a3a',s:2.2,id:i*2+3,d:i?-1:1,arm1:has?(i?.3:-2.7):-.2,arm2:has?(i?2.7:-.3):.2});});
  let bx=80+holder*160,by=96;if(fly){const f=1-fly/16,from=80+(1-holder)*160;bx=from+(bx-from)*f;by=96-Math.sin(f*Math.PI)*50;}const sh=danger?Math.sin(A.t*1.3)*1.5:0;X.shadow(bx,190,12,3,.3);X.orb(bx+sh,by,14,danger&&A.t%10<5?'#6a1010':'#2a2a3a');X.rr(bx+sh-4,by-17,8,5,1,'#8a8a9a');c.strokeStyle='#c8a060';c.lineWidth=1.5;c.beginPath();c.moveTo(bx+sh,by-17);c.quadraticCurveTo(bx+sh+5,by-24,bx+sh+3,by-27);c.stroke();X.glow(bx+sh+3,by-28,8,'#ffb040',.9);if(A.t%3===0)fx.spark(bx+sh+3,by-28,'#ffe080',1,1.2);
  X.panel(58,26,204,12,danger?'#ff4f6d':'#ff9838');X.meter(62,29,196,6,fuse/500,danger?'#ff4f6d':'#ff9838');
  const ox=bad?Math.sin(bad*2)*3:0;seq.forEach((k,i)=>key(160-seq.length*14+i*28+14+ox,212,k,i<idx?2:i===idx?1:0));
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);X.ot(A.nm(holder)+' HAS THE BOMB',160,46,PC[holder],1,'c');if(wait>0)X.ot('READY',160,110,K.y,2,'c');};
 return g;}});

/* ---- TURF TAG ---- */
A.add({id:'tag',name:'TURF TAG',cat:'PARTY',vs:1,how:'TOUCH TO TAG. TAGGED PLAYER CHASES. LEAST TIME AS "IT" IN 60 SEC WINS.',make(){
 const g={over:null,score:0},WL=[[60,60,40,14],[220,60,40,14],[60,166,40,14],[220,166,40,14],[150,100,20,40]],fx=X.fx();let p=[{x:60,y:120,f:1,mv:0},{x:260,y:120,f:-1,mv:0}],it=0,itT=[0,0],time=3600,cd=0;
 const blk=(x,y)=>x<12||x>W-12||y<30||y>H-12||WL.some(w=>x>w[0]-6&&x<w[0]+w[2]+6&&y>w[1]-6&&y<w[1]+w[3]+6);
 g.update=()=>{time--;if(cd>0)cd--;itT[it]++;if(A.cpu){const q=p[1],o=p[0],chase=it===1,dx=o.x-q.x,dy=o.y-q.y;let b={};const s=chase?1:-1;b={l:dx*s<-3,r:dx*s>3,u:dy*s<-3,d:dy*s>3};if(!chase&&(blk(q.x+(b.r?3:b.l?-3:0),q.y)||blk(q.x,q.y+(b.d?3:b.u?-3:0))))b={u:q.y>120,d:q.y<=120,l:q.x>160,r:q.x<=160};if(Math.random()<.02*(1-A.ai))b={[['l','r','u','d'][ri(4)]]:1};A.bot(b);}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),sp=(i&&A.cpu?1.2+1.4*A.ai:2.6)*(it===i?1.1:1);if(ax(k))q.f=ax(k);q.mv=!!(ax(k)||ay(k));if(!blk(q.x+ax(k)*sp,q.y))q.x+=ax(k)*sp;if(!blk(q.x,q.y+ay(k)*sp))q.y+=ay(k)*sp;}
  if(cd===0&&Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)<16){it=1-it;cd=60;S('hit');fx.ring((p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2-8,'#ffcf3f',24);fx.spark((p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2-8,'#ffffff',10,2.5);fx.pop(p[it].x,p[it].y-40,'TAG!',K.y);}if(time<=0)g.over=itT[0]===itT[1]?'DRAW!':A.win(itT[0]<itT[1]?0:1);};
 const bg=()=>{X.turf(0,18,W,H-18,'#3f9a3a','#48a844',20,true);X.vignette(.3);const c=A.c;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.5;c.strokeRect(10,28,W-20,H-38);
  WL.forEach(w=>{c.fillStyle='rgba(0,0,0,.3)';c.fillRect(w[0]+3,w[1]+4,w[2],w[3]);for(let x=w[0];x<w[0]+w[2];x+=7)for(let y=w[1];y<w[1]+w[3];y+=7)X.disc(x+3.5,y+3.5,4.5,(x+y)%14?'#2a7a2a':'#348a30');c.fillStyle='rgba(255,255,255,.12)';c.fillRect(w[0],w[1],w[2],2);});};
 g.draw=()=>{X.cache('tag_bg',bg);p.slice().sort((a,b)=>a.y-b.y).forEach(q=>{const i=p.indexOf(q);if(it===i){X.glow(q.x,q.y-10,22,'#ffcf3f',.35);A.ring(q.x,q.y+2,10,cd?'rgba(255,255,255,.4)':'#ffcf3f');}A.person(q.x,q.y+8,{c:PC[i],pants:'#2a2a3a',s:.75,st:q.mv?(q.x+q.y)*.3:0,d:q.f,id:i*4+1});if(it===i){const b=Math.sin(A.t*.2)*2;X.poly([[q.x-6,q.y-24+b],[q.x-6,q.y-30+b],[q.x-3,q.y-27+b],[q.x,q.y-32+b],[q.x+3,q.y-27+b],[q.x+6,q.y-30+b],[q.x+6,q.y-24+b]],'#ffcf3f');}});
  fx.draw();X.bar();T(A.nm(0)+' '+(itT[0]/60|0)+'S',6,4,K.c,2);T((itT[1]/60|0)+'S '+A.nm(1),W-6,4,K.p,2,'r');X.panel(140,2,40,14,time<600?K.r:K.c);T(Math.ceil(time/60),160,4,K.w,2,'c');};
 return g;}});

/* ---- BASKET TOSS ---- */
A.add({id:'toss',name:'BASKET TOSS',cat:'PARTY',vs:1,how:'UP/DOWN AIM. A LOCKS POWER. 5 SHOTS EACH, HOOP MOVES. MOST BASKETS WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let p=0,n=0,ang=.9,pw=0,ph=0,t=0,ball=null,sc=[0,0],hoop={x:240,y:100,d:1},msg='',mt=0,net=0;
 g.update=()=>{t++;if(mt>0)mt--;if(net)net--;hoop.y+=hoop.d*.6;if(hoop.y<60||hoop.y>160)hoop.d*=-1;
  if(ball){ball.vy+=.18;ball.x+=ball.vx;ball.y+=ball.vy;ball.r+=.15;if(ball.vy>0&&Math.abs(ball.x-hoop.x)<10&&Math.abs(ball.y-hoop.y)<6&&!ball.done){ball.done=1;sc[p]++;msg='SWISH!';mt=50;S('score');net=20;fx.spark(hoop.x,hoop.y+8,'#ffffff',12,2.5);fx.ring(hoop.x,hoop.y,K.y,24);}if(ball.y>220||ball.x>W+10){if(!ball.done){msg='MISS';mt=40;S('lose');}ball=null;n++;p=1-p;ph=0;t=0;if(n>=10)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}return;}
  const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));if(ph===0){if(cpu){if(t>30){ang=.85+rnd(.2)-.1;ph=1;t=0;}}else{ang=cl(ang-ay(k)*.02,.4,1.3);if(h.a){ph=1;t=0;}}}
  else{pw=.5+.5*Math.sin(t*.08);if(cpu){if(!g.want){let best=0,bd=1e9;for(let w=0;w<=1;w+=.02){let x=60,y=200,vx=Math.cos(ang)*(3+w*6),vy=-Math.sin(ang)*(3+w*6),hy=hoop.y,hd=hoop.d,ok=1e9;for(let f=0;f<200;f++){vy+=.18;x+=vx;y+=vy;hy+=hd*.6;if(hy<60||hy>160)hd*=-1;if(vy>0&&Math.abs(x-hoop.x)<10){ok=Math.min(ok,Math.abs(y-hy));if(y>hy)break;}if(y>220)break;}if(ok<bd){bd=ok;best=w;}}g.want=cl(best+(rnd(.16)-.08)*(2-A.ai*1.6),0,1);}if(Math.abs(pw-g.want)<.03||t>140){ball={x:60,y:200,vx:Math.cos(ang)*(3+g.want*6),vy:-Math.sin(ang)*(3+g.want*6),r:0};g.want=null;S('shoot');}}else if(h.a){ball={x:60,y:200,vx:Math.cos(ang)*(3+pw*6),vy:-Math.sin(ang)*(3+pw*6),r:0};S('shoot');}}};
 const bg=()=>{X.sky(['#140c30','#2a1a50','#3a2050'],210);const c=A.c;for(let y=60;y<150;y+=5)for(let x=(y/5%2)*3;x<W;x+=6){c.globalAlpha=.4;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0'][((x|0)*3+(y|0))%4];c.fillRect(x,y,4,4);}c.globalAlpha=1;for(const lx of[80,240]){X.glow(lx,20,30,'#fff0c0',.35);X.disc(lx,20,3,'#fffbe8');}X.vg(0,210,W,30,['#d89a5a','#8a5428']);c.fillStyle='rgba(0,0,0,.12)';for(let x=0;x<W;x+=14)c.fillRect(x,210,1,30);c.fillStyle='#fff';c.fillRect(0,210,W,1.5);};
 g.draw=()=>{X.cache('toss_bg',bg);const c=A.c,hx=hoop.x,hy=hoop.y;c.fillStyle='rgba(220,240,255,.35)';c.fillRect(hx+11,hy-34,6,44);c.strokeStyle='#fff';c.lineWidth=1;c.strokeRect(hx+11,hy-34,6,44);X.vg(hx+13,hy+10,2,210-hy-10,['#9aa0b0','#5a6070']);
  const sw=net?Math.sin(net*.8)*2:0;c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=.7;c.beginPath();for(let i=0;i<4;i++){c.moveTo(hx-10+i*6,hy+3);c.lineTo(hx-6+i*4+sw,hy+16);}for(let y=hy+6;y<hy+16;y+=4){c.moveTo(hx-9+(y-hy)*.25,y);c.lineTo(hx+9-(y-hy)*.25+sw,y);}c.stroke();X.vg(hx-12,hy,24,3,['#ff9a5a','#d0401a']);
  A.person(60,210,{s:1.2,c:PC[p],pants:'#2a2a3a',d:1,id:p*3+2,arm1:ball&&!ball.done&&ball.y<190?-2.8:ph?-2.2:-1.2,arm2:ball&&ball.y<190?-2.8:ph?-2.2:-1.2});
  if(!ball){for(let i=1;i<8;i++){const x=60+Math.cos(ang)*i*12,y=200-Math.sin(ang)*i*12+.18*i*i*2;X.disc(x,y,1.6-i*.12,'rgba(255,255,255,.7)');}X.orb(64,170,5,'#ff8a2a');if(ph===1)powerBar(10,60,pw);}
  if(ball){X.shadow(ball.x,210,4,1.2,.25);c.save();c.translate(ball.x,ball.y);X.orb(0,0,6,'#ff8a2a');c.rotate(ball.r);c.strokeStyle='rgba(60,20,0,.7)';c.lineWidth=.6;c.beginPath();c.moveTo(-6,0);c.lineTo(6,0);c.moveTo(0,-6);c.lineTo(0,6);c.stroke();c.restore();}
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);T('SHOT '+(n+1)+'/10',160,6,K.w,1,'c');tag(A.nm(p)+' SHOOTS',PC[p],226);if(mt>0)X.ot(msg,160,40,msg==='MISS'?K.r:K.y,3,'c');};
 return g;}});

/* ---- RHYTHM DUEL ---- */
A.add({id:'rhythmduel',name:'RHYTHM DUEL',cat:'PARTY',vs:1,how:'HIT YOUR ARROWS ON THE LINE. P1 LEFT LANES, P2 RIGHT. MOST POINTS WINS.',make(){
 const g={over:null,score:0},KS=['l','d','u','r'],COL=['#ff4f9a','#2fd6c3','#3ddc84','#ffcf3f'],fx=X.fx();let notes=[],t=0,sc=[0,0],combo=[0,0],flash={};
 for(let i=0;i<120;i++){const k=ri(4);notes.push({k,t:120+i*36,ok:[0,0]});}
 g.update=()=>{t++;for(const kk in flash)if(flash[kk]>0)flash[kk]--;if(A.cpu){const n=notes.find(n=>!n.ok[1]&&Math.abs(n.t-t)<=3);A.bot({[n&&Math.random()<.5+.45*A.ai?KS[n.k]:'x']:!!n});}
  for(let p=0;p<2;p++){const h=A.hit(p);for(const n of notes){if(n.ok[p])continue;const dy=n.t-t;if(dy<-14){n.ok[p]=2;combo[p]=0;}else if(Math.abs(dy)<=14&&h[KS[n.k]]){n.ok[p]=1;combo[p]++;const pf=Math.abs(dy)<5;sc[p]+=(pf?3:1)*Math.min(combo[p],10);flash[p+''+n.k]=8;S(p?'coin':'blip');const x=(p?190:30)+n.k*30;fx.ring(x,190,COL[n.k],16,10);if(pf)fx.spark(x,190,COL[n.k],6,2);h[KS[n.k]]=false;}}}
  if(t>notes[notes.length-1].t+30)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);};
 const arrow=(x,y,k,col,s)=>{const rot=[Math.PI,Math.PI/2,-Math.PI/2,0][k],c=A.c;c.save();c.translate(x,y);c.rotate(rot);c.scale(s||1,s||1);X.poly([[8,0],[0,-8],[0,-3.5],[-7,-3.5],[-7,3.5],[0,3.5],[0,8]],X.lg(-7,-8,7,8,[X.lt(col,1.5),col,X.lt(col,.55)]));c.restore();};
 g.draw=()=>{X.cache('rduel_bg',()=>{X.sky(['#120a2a','#08051a']);[0,1].forEach(p=>{const X0=p?190:30;X.rr(X0-14,20,118,H-24,6,X.lg(0,0,0,H,[p?'rgba(90,20,60,.6)':'rgba(20,70,80,.6)','rgba(10,6,24,.8)']));});});
  [0,1].forEach(p=>{const X0=p?190:30;A.c.fillStyle='rgba(255,255,255,.5)';A.c.fillRect(X0-10,189,114,2);for(let i=0;i<4;i++){const f=flash[p+''+i];if(f)X.glow(X0+i*30,190,18,COL[i],.6*f/8);arrow(X0+i*30,190,i,f?'#ffffff':'#4a4470',f?1.15:1);}notes.forEach(n=>{if(n.ok[p])return;const y=190-(n.t-t)*1.5;if(y>-10&&y<H)arrow(X0+n.k*30,y,n.k,COL[n.k]);});if(combo[p]>4)X.ot('X'+combo[p],X0+45,30,K.w,2,'c');});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- QUAD PONG ---- */
A.add({id:'quadpong',name:'QUAD PONG',cat:'PARTY',vs:1,how:'GUARD TWO WALLS. LEFT/RIGHT = BOTTOM, UP/DOWN = SIDE. FIRST TO 5.',make(){
 const g={over:null,score:0},fx=X.fx();let pad=[{h:160,v:120},{h:160,v:120}],b,sc=[0,0],wait=40,tr=[];const reset=()=>{const a=rnd(6.28);b={x:160,y:120,vx:Math.cos(a)*2.5,vy:Math.sin(a)*2.5};wait=40;tr=[];};reset();
 const hit=(i)=>{S('hit');fx.spark(b.x,b.y,PC[i],8,2.2);fx.ring(b.x,b.y,'#ffffff',12,10);};const miss=(w)=>{sc[w]++;S('score');fx.flash(PC[w],8);fx.ring(b.x,b.y,PC[1-w],40,16);};
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=pad[1];A.bot({l:q.h>b.x+4,r:q.h<b.x-4,u:q.v>b.y+4,d:q.v<b.y-4});}
  for(let i=0;i<2;i++){const q=pad[i],k=A.in(i),sp=i&&A.cpu?1.5+1.7*A.ai:3.2;q.h=cl(q.h+ax(k)*sp,40,W-40);q.v=cl(q.v+ay(k)*sp,60,H-40);}
  tr.unshift([b.x,b.y]);if(tr.length>8)tr.pop();b.x+=b.vx;b.y+=b.vy;const P0=pad[0],P1=pad[1];
  if(b.y>H-14&&b.vy>0){if(Math.abs(b.x-P0.h)<26){b.vy=-Math.abs(b.vy)*1.04;b.vx+=(b.x-P0.h)*.08;hit(0);}else{miss(1);if(sc[1]>=5)g.over=A.win(1);else reset();return;}}
  if(b.x<14&&b.vx<0){if(Math.abs(b.y-P0.v)<26){b.vx=Math.abs(b.vx)*1.04;b.vy+=(b.y-P0.v)*.08;hit(0);}else{miss(1);if(sc[1]>=5)g.over=A.win(1);else reset();return;}}
  if(b.y<34&&b.vy<0){if(Math.abs(b.x-P1.h)<26){b.vy=Math.abs(b.vy)*1.04;b.vx+=(b.x-P1.h)*.08;hit(1);}else{miss(0);if(sc[0]>=5)g.over=A.win(0);else reset();return;}}
  if(b.x>W-14&&b.vx>0){if(Math.abs(b.y-P1.v)<26){b.vx=-Math.abs(b.vx)*1.04;b.vy+=(b.y-P1.v)*.08;hit(1);}else{miss(0);if(sc[0]>=5)g.over=A.win(0);else reset();return;}}
  const sp=Math.hypot(b.vx,b.vy);if(sp>7){b.vx*=7/sp;b.vy*=7/sp;}};
 g.draw=()=>{X.cache('quad_bg',()=>{X.sky(['#0a0628','#130a3a']);const c=A.c;c.strokeStyle='rgba(120,100,255,.08)';c.beginPath();for(let x=8;x<W;x+=16){c.moveTo(x,28);c.lineTo(x,H-8);}for(let y=28;y<H;y+=16){c.moveTo(8,y);c.lineTo(W-8,y);}c.stroke();c.fillStyle='rgba(47,214,195,.5)';c.fillRect(8,H-9,W-16,1);c.fillRect(8,28,1,H-36);c.fillStyle='rgba(255,79,154,.5)';c.fillRect(8,28,W-16,1);c.fillRect(W-9,28,1,H-36);X.glow(160,130,120,'#5a3aff',.12);});const c=A.c;
  const pd=(x,y,w,h,col)=>{X.glow(x+w/2,y+h/2,Math.max(w,h)*.6,col,.3);X.rr(x,y,w,h,2.5,X.lg(x,y,x+(w>h?0:w),y+(w>h?h:0),[X.lt(col,1.5),col,X.lt(col,.6)]));};
  pd(pad[0].h-24,H-12,48,5,PC[0]);pd(8,pad[0].v-24,5,48,PC[0]);pd(pad[1].h-24,28,48,5,PC[1]);pd(W-13,pad[1].v-24,5,48,PC[1]);
  tr.forEach((q,i)=>{c.globalAlpha=.35*(1-i/8);X.disc(q[0],q[1],3-i*.25,'#ffffff');});c.globalAlpha=1;X.glow(b.x,b.y,10,'#ffffff',.5);X.orb(b.x,b.y,3.4,'#f0f0ff');
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(wait>0)X.ot('READY',160,110,K.y,2,'c');};
 return g;}});

/* ---- GOLF DUEL ---- */
A.add({id:'golfduel',name:'GOLF DUEL',cat:'PARTY',vs:1,how:'TAKE TURNS. AIM, HOLD A, RELEASE. FEWEST STROKES OVER 3 HOLES.',make(){
 const g={over:null,score:0},fx=X.fx();const HO=[{s:[40,125],c:[280,125],w:[[150,70,20,110]]},{s:[40,200],c:[280,50],w:[[100,24,16,130],[200,100,16,130]]},{s:[40,50],c:[280,200],w:[[90,90,140,16],[90,150,16,80]]}];
 let hi=0,b=[null,null],ang=[0,0],pow=0,chg=false,st=[[0,0,0],[0,0,0]],ht,p=0,done=[false,false],wait=0,think=0;
 const load=()=>{ht=HO[hi];b=[{x:ht.s[0],y:ht.s[1]-6,vx:0,vy:0},{x:ht.s[0],y:ht.s[1]+6,vx:0,vy:0}];ang=b.map(q=>Math.atan2(ht.c[1]-q.y,ht.c[0]-q.x));done=[false,false];p=0;think=0;};load();
 const inW=(x,y)=>x<13||x>W-13||y<27||y>H-13||ht.w.some(w=>x>w[0]-3&&x<w[0]+w[2]+3&&y>w[1]-3&&y<w[1]+w[3]+3);
 g.update=()=>{if(wait>0){if(--wait===0){hi++;if(hi>=3){const a=st[0].reduce((x,y)=>x+y),c=st[1].reduce((x,y)=>x+y);g.over=a===c?'DRAW!':A.win(a<c?0:1);}else load();}return;}
  const q=b[p],mv=Math.hypot(q.vx,q.vy)>.05;if(mv){q.x+=q.vx;if(inW(q.x,q.y)){q.x-=q.vx;q.vx*=-.8;S('blip');}q.y+=q.vy;if(inW(q.x,q.y)){q.y-=q.vy;q.vy*=-.8;S('blip');}q.vx*=.982;q.vy*=.982;const o=b[1-p];if(!done[1-p]&&Math.hypot(q.x-o.x,q.y-o.y)<6){const dx=o.x-q.x,dy=o.y-q.y,d=Math.hypot(dx,dy)||1;o.vx+=q.vx*.5;o.vy+=q.vy*.5;q.vx*=.5;q.vy*=.5;}
   if(Math.hypot(q.x-ht.c[0],q.y-ht.c[1])<6&&Math.hypot(q.vx,q.vy)<3.2){done[p]=true;q.x=ht.c[0];q.y=ht.c[1];q.vx=q.vy=0;S('score');fx.ring(ht.c[0],ht.c[1],'#ffffff',20);fx.spark(ht.c[0],ht.c[1],PC[p],10,2);fx.pop(ht.c[0],ht.c[1]-26,st[p][hi]===1?'HOLE IN ONE!':'IN!',K.y);}if(Math.hypot(q.vx,q.vy)<=.05||done[p]){q.vx=q.vy=0;if(done[0]&&done[1]){wait=50;return;}p=1-p;if(done[p])p=1-p;think=0;ang[p]=Math.atan2(ht.c[1]-b[p].y,ht.c[0]-b[p].x);}return;}
  const o=b[1-p];o.x+=o.vx;o.y+=o.vy;o.vx*=.95;o.vy*=.95;
  if(A.cpu&&p===1){if(++think>40){const d=Math.hypot(ht.c[0]-q.x,ht.c[1]-q.y),pw_=cl(d/220,.15,1)+(rnd(.2)-.1)*(2-A.ai*1.5);ang[1]+=(rnd(.1)-.05)*(2-A.ai*1.5);q.vx=Math.cos(ang[1])*(1+pw_*6);q.vy=Math.sin(ang[1])*(1+pw_*6);st[1][hi]++;S('hit');if(st[1][hi]>=8)done[1]=true;}return;}
  const k=A.in(human(p));ang[p]+=ax(k)*.035;if(k.a){chg=true;pow=.5+.5*Math.sin(A.t*.08-1.57);}else if(chg){chg=false;q.vx=Math.cos(ang[p])*(1+pow*6);q.vy=Math.sin(ang[p])*(1+pow*6);st[p][hi]++;S('hit');fx.spark(q.x,q.y,'#ffffff',4,1.4);if(st[p][hi]>=8)done[p]=true;}};
 g.draw=()=>{const c=A.c;X.cache('golfduel_bg'+hi,()=>{X.vg(0,0,W,H,['#2a5a2a','#1a3a1a']);X.rr(8,22,W-16,H-30,6,X.lg(0,22,0,H,['#8a5a2a','#5a3414']));X.turf(12,26,W-24,H-38,'#2e9e57','#35a85e',16,true);X.disc(ht.c[0],ht.c[1],22,'rgba(120,220,140,.25)');X.disc(ht.s[0],ht.s[1],10,'rgba(255,255,255,.1)');
   ht.w.forEach(w=>{c.fillStyle='rgba(0,0,0,.3)';A.c.fillStyle='rgba(0,0,0,.3)';A.c.fillRect(w[0]+3,w[1]+3,w[2],w[3]);X.block(w[0],w[1],w[2],w[3],'#a8743a',2);A.c.fillStyle='rgba(0,0,0,.15)';if(w[2]>w[3])for(let x=w[0]+10;x<w[0]+w[2];x+=10)A.c.fillRect(x,w[1]+1,1,w[3]-2);else for(let y=w[1]+10;y<w[1]+w[3];y+=10)A.c.fillRect(w[0]+1,y,w[2]-2,1);});
   X.disc(ht.c[0],ht.c[1],5.5,'#0a0a0a');X.ell(ht.c[0],ht.c[1]-1.5,5,2,'rgba(255,255,255,.12)');});
  const fw=Math.sin(A.t*.15);c.fillStyle='#eee';c.fillRect(ht.c[0],ht.c[1]-20,1.2,20);X.poly([[ht.c[0]+1,ht.c[1]-20],[ht.c[0]+11,ht.c[1]-17+fw],[ht.c[0]+1,ht.c[1]-13]],'#ff4f6d');
  b.forEach((q,i)=>{if(done[i])return;X.shadow(q.x+1,q.y+2,3.5,2,.35);X.orb(q.x,q.y,3.2,'#ffffff');A.ring(q.x,q.y,4.2,PC[i]);});
  const q=b[p];if(Math.hypot(q.vx,q.vy)<=.05&&!wait&&!done[p]){for(let i=1;i<=6;i++)X.disc(q.x+Math.cos(ang[p])*i*7,q.y+Math.sin(ang[p])*i*7,1.4-i*.12,'rgba(255,255,255,.85)');if(chg){X.rr(q.x-17,q.y+8,34,7,3,'rgba(0,0,0,.5)');X.rr(q.x-16,q.y+9,32*pow,5,2,X.lg(q.x-16,0,q.x+16,0,['#3ddc84','#ffcf3f','#ff4f6d']));}}
  const tot=i=>st[i].reduce((a,cc)=>a+cc);fx.draw();X.bar();T(A.nm(0)+' '+tot(0),6,4,K.c,2);T(tot(1)+' '+A.nm(1),W-6,4,K.p,2,'r');T('HOLE '+(hi+1)+'/3',160,6,K.w,1,'c');tag(A.nm(p)+' TO PUTT',PC[p],226);if(wait)X.ot('HOLE DONE',160,110,K.y,2,'c');};
 return g;}});
})();
