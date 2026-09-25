(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- STRIKE ZONE 3D (first-person shooter) ---- */
A.add({id:'fps',name:'STRIKE ZONE 3D',cat:'ACTION',hd:1,how:'TURN + WALK. A FIRES. B STRAFES. CLEAR EVERY WAVE.',make(){
 const g={over:null,score:0},N=17,M=[];for(let y=0;y<N;y++){M.push([]);for(let x=0;x<N;x++)M[y].push(x===0||y===0||x===N-1||y===N-1||((x%4===2)&&(y%4===2))||(x%8===6&&y%3===0&&y>2&&y<N-3)?1:0);}
 let p={x:2.5,y:2.5,a:0},en=[],hp=100,ammo=30,wave=0,kick=0,fl=0,hurt=0,rl=0;const zb=new Float32Array(160);
 const spawn=()=>{wave++;for(let i=0;i<3+wave*2;i++){let x,y;do{x=1.5+ri(N-2);y=1.5+ri(N-2);}while(M[y|0][x|0]||Math.hypot(x-p.x,y-p.y)<5);en.push({x,y,hp:2+wave/2|0,cd:60+ri(60),t:ri(100)});}};spawn();
 const solid=(x,y)=>M[y|0][x|0]===1;const los=(ax_,ay_,bx,by)=>{const d=Math.hypot(bx-ax_,by-ay_),n=d*4|0;for(let i=1;i<n;i++){if(solid(ax_+(bx-ax_)*i/n,ay_+(by-ay_)*i/n))return false;}return true;};
 g.update=()=>{const k=A.in(0);if(kick>0)kick--;if(fl>0)fl--;if(hurt>0)hurt--;if(rl>0){rl--;if(rl===0){ammo=30;}}
  if(k.b){const s=ax(k)*.05,nx=p.x+Math.cos(p.a+1.57)*s,ny=p.y+Math.sin(p.a+1.57)*s;if(!solid(nx,p.y))p.x=nx;if(!solid(p.x,ny))p.y=ny;}else p.a+=ax(k)*.045;
  const mv=-ay(k)*.06,nx=p.x+Math.cos(p.a)*mv,ny=p.y+Math.sin(p.a)*mv;if(!solid(nx+Math.cos(p.a)*.2*Math.sign(mv||1),p.y))p.x=nx;if(!solid(p.x,ny+Math.sin(p.a)*.2*Math.sign(mv||1)))p.y=ny;
  if(A.hit(0).a&&rl===0){if(ammo>0){ammo--;kick=6;fl=3;S('shoot');let best=null,bd=1e9;for(const e of en){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);let da=Math.atan2(dy,dx)-p.a;while(da>3.14)da-=6.28;while(da<-3.14)da+=6.28;if(Math.abs(da)<.09+.25/d&&d<bd&&los(p.x,p.y,e.x,e.y)){bd=d;best=e;}}if(best){best.hp--;best.hit=6;if(best.hp<=0){en.splice(en.indexOf(best),1);g.score+=100;S('boom');}else S('hit');}}else{rl=60;S('lose');}}
  for(const e of en){e.t++;if(e.hit>0)e.hit--;const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy),see=los(e.x,e.y,p.x,p.y);if(see&&d>2){const s=.018+wave*.002;const ex=e.x+dx/d*s,ey=e.y+dy/d*s;if(!solid(ex,e.y))e.x=ex;if(!solid(e.x,ey))e.y=ey;}else if(!see){const a=e.t*.02;const ex=e.x+Math.cos(a)*.02,ey=e.y+Math.sin(a)*.02;if(!solid(ex,e.y))e.x=ex;if(!solid(e.x,ey))e.y=ey;}
   if(see&&--e.cd<=0){e.cd=90+ri(60)-wave*5;if(Math.random()<.6){hp-=8;hurt=12;S('hit');if(hp<=0){g.over='K.I.A.  WAVE '+wave;return;}}}}
  if(!en.length){g.score+=500;hp=Math.min(100,hp+40);S('win');spawn();}};
 g.draw=()=>{const bob=Math.sin(A.t*.15)*(A.in(0).u||A.in(0).d?2:0);R(0,0,W,120,'#1b1e2a');R(0,120,W,120,'#2a2d38');const dx=Math.cos(p.a),dy=Math.sin(p.a),plx=-dy*.66,ply=dx*.66;
  for(let c=0;c<160;c++){const cm=2*c/160-1,rx=dx+plx*cm,ry=dy+ply*cm;let mx=p.x|0,my=p.y|0;const ddx=Math.abs(1/(rx||1e-9)),ddy=Math.abs(1/(ry||1e-9)),sx=rx<0?-1:1,sy=ry<0?-1:1;let sdx=(rx<0?p.x-mx:mx+1-p.x)*ddx,sdy=(ry<0?p.y-my:my+1-p.y)*ddy,side=0,n=0;
   while(n++<64){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0;}else{sdy+=ddy;my+=sy;side=1;}if(M[my][mx])break;}const d=Math.max(.05,side?sdy-ddy:sdx-ddx);zb[c]=d;const h=Math.min(H,200/d),f=Math.max(.12,1-d/11)*(side?.75:1),wx=(side?p.x+d*rx:p.y+d*ry)%1;
   const base=(wx<.08||wx>.92)?60:110;R(c*2,120-h/2+bob,2,h,'rgb('+(base*f|0)+','+((base+10)*f|0)+','+((base+30)*f|0)+')');if(Math.abs(wx-.5)<.02)R(c*2,120-h/2+bob,2,h,'rgba(255,220,120,'+(.5*f)+')');}
  en.slice().sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y)).forEach(e=>{const ox=e.x-p.x,oy=e.y-p.y,inv=1/(plx*dy-dx*ply),tx=inv*(dy*ox-dx*oy),tz=inv*(-ply*ox+plx*oy);if(tz<.2)return;const scx=80*(1+tx/tz),h=200/tz,w=h*.5;let c0=Math.max(0,Math.floor(scx-w/4)),c1=Math.min(160,Math.ceil(scx+w/4));
   for(let c=c0;c<c1;c++)if(zb[c]>tz){const f=Math.max(.2,1-tz/11);R(c*2,120-h*.45+bob,2,h*.85,e.hit?'#fff':'rgb('+(200*f|0)+','+(40*f|0)+','+(60*f|0)+')');if(Math.abs(c-scx*1)<w/8)R(c*2,120-h*.35+bob,2,h*.12,'rgb('+(255*f|0)+','+(230*f|0)+',0)');}});
  if(hurt>0)R(0,0,W,H,'rgba(255,0,0,'+(hurt/40)+')');L(160-8,120,160-3,120,K.g);L(160+3,120,160+8,120,K.g);L(160,112,160,117,K.g);L(160,123,160,128,K.g);
  const gy=200+kick*3+bob;R(176,gy,34,50,'#333');R(180,gy-14,26,18,'#555');R(186,gy-30,14,20,'#444');if(fl>0){C(193,gy-36,10+rnd(6),K.y);C(193,gy-36,5,K.w);}
  R(6,222,100,10,K.k);R(7,223,hp*.98,8,hp>30?K.g:K.r);T('HP',8,214,K.w);T(rl?'RELOADING':'AMMO '+ammo,W-6,214,ammo<6?K.r:K.w,1,'r');T('WAVE '+wave+'   '+en.length+' LEFT',W-6,224,K.w,1,'r');T('SCORE '+g.score,160,4,K.y,2,'c');};
 return g;}});

/* ---- NEON FIGHTERS ---- */
A.add({id:'fighters',name:'NEON FIGHTERS',cat:'ACTION',vs:1,how:'A PUNCH. B KICK. UP JUMP. BACK BLOCKS. DOWN+A SPECIAL. BEST OF 3.',make(){
 const g={over:null,score:0},GY=200,CH=[{n:'VOLTA',c:K.c,c2:'#178a7d',sp:2.6,pw:1,sh:'bolt'},{n:'BRICK',c:K.o,c2:'#a0521a',sp:1.9,pw:1.4,sh:'rock'},{n:'SABLE',c:K.p,c2:'#a0205a',sp:3.2,pw:.8,sh:'blade'},{n:'MOSS',c:K.g,c2:'#1e8a45',sp:2.3,pw:1.1,sh:'vine'}];
 let ph='sel',pick=[0,1],cur=0,f,proj=[],rw=[0,0],time=3600,msg='',mt=0,seq=0;
 const mk=(ch,x,d)=>({ch,x,y:GY,vy:0,hp:100,d,act:'',at:0,cd:0,st:0,blk:false});
 const start=()=>{f=[mk(CH[pick[0]],90,1),mk(CH[pick[1]],230,-1)];proj=[];time=3600;ph='fight';msg='ROUND '+(rw[0]+rw[1]+1);mt=70;};
 g.update=()=>{if(mt>0)mt--;
  if(ph==='sel'){const h=A.hit(cur);if(h.l){pick[cur]=(pick[cur]+3)%4;S('blip');}if(h.r){pick[cur]=(pick[cur]+1)%4;S('blip');}if(h.a){S('coin');if(A.cpu){pick[1]=ri(4);start();}else if(cur===0)cur=1;else start();}return;}
  if(ph==='ko'){if(mt===0){if(rw[0]>=2||rw[1]>=2)g.over=A.win(rw[0]>=2?0:1);else start();}return;}
  if(mt>40)return;time--;
  if(A.cpu){const q=f[1],o=f[0],d=Math.abs(q.x-o.x),pf=proj.find(p=>p.o===0&&Math.abs(p.x-q.x)<60);let b={};
   if(pf&&Math.random()<A.ai*.8)b={u:Math.random()<.5,l:q.x<o.x?false:true,r:q.x<o.x?true:false};
   else if(o.act&&o.at<10&&d<50&&Math.random()<A.ai*.7)b={[q.x<o.x?'l':'r']:1};
   else if(d>60){b={[q.x<o.x?'r':'l']:Math.random()<.8,a:Math.random()<.02*A.ai,d:Math.random()<.02*A.ai};if(b.d)b.a=1;}
   else b={a:Math.random()<.06+.06*A.ai,b:Math.random()<.04+.05*A.ai,u:Math.random()<.01};A.bot(b);}
  for(let i=0;i<2;i++){const q=f[i],o=f[1-i],k=A.in(i),h=A.hit(i),ch=q.ch;q.d=q.x<o.x?1:-1;if(q.st>0){q.st--;q.x-=q.d*1.2;q.x=cl(q.x,20,W-20);continue;}
   const back=ax(k)===-q.d;q.blk=back&&q.y>=GY&&!q.act;if(q.cd>0)q.cd--;
   if(q.act){q.at++;if(q.at===6){const rng=q.act==='kick'?44:36,dmg=(q.act==='kick'?9:6)*ch.pw;if(Math.abs(o.x-q.x)<rng&&Math.abs(o.y-q.y)<30){if(o.blk){o.hp-=1;o.x+=q.d*6;S('blip');}else{o.hp-=dmg;o.st=12;S('hit');}}}if(q.at>(q.act==='kick'?20:14)){q.act='';q.at=0;}}
   else{if(!q.blk&&q.y>=GY)q.x=cl(q.x+ax(k)*ch.sp,20,W-20);else if(q.y<GY)q.x=cl(q.x+ax(k)*ch.sp*.6,20,W-20);
    if(k.u&&q.y>=GY){q.vy=-6;S('jump');}if(h.a&&k.d&&q.cd===0){q.cd=90;proj.push({x:q.x+q.d*20,y:GY-30,vx:q.d*4,o:i,c:ch.c,sh:ch.sh,t:0});S('shoot');}else if(h.a&&!q.blk){q.act='punch';q.at=0;}else if(h.b&&!q.blk){q.act='kick';q.at=0;}}
   q.vy+=.3;q.y+=q.vy;if(q.y>GY){q.y=GY;q.vy=0;}}
  if(Math.abs(f[0].x-f[1].x)<22){const m=(f[0].x+f[1].x)/2,d=f[0].x<f[1].x?1:-1;f[0].x=m-11*d;f[1].x=m+11*d;}
  for(const p of proj){p.x+=p.vx;p.t++;const o=f[1-p.o];if(Math.abs(p.x-o.x)<14&&o.y>GY-40){p.dead=1;if(o.blk){o.hp-=2;S('blip');}else{o.hp-=12*f[p.o].ch.pw;o.st=16;S('boom');}}if(p.x<0||p.x>W)p.dead=1;}proj=proj.filter(p=>!p.dead);
  for(let i=0;i<2;i++)if(f[i].hp<=0){f[i].hp=0;rw[1-i]++;ph='ko';msg='K.O.!';mt=90;S('win');return;}
  if(time<=0){const w=f[0].hp>f[1].hp?0:f[0].hp<f[1].hp?1:-1;if(w>=0)rw[w]++;else rw[0]++;ph='ko';msg='TIME!';mt=90;}};
 const man=(q,x,y,d,ch,anim)=>{const c=ch.c,c2=ch.c2,qi=f?f.indexOf(q):-1,crouch=qi>=0&&A.in(qi).d&&q.y>=GY&&!q.act;const by=crouch?y+8:y;R(x-7,by-40,14,22,c);R(x-5,by-50,10,10,'#ffd9a8');R(x-6,by-53,12,4,c2);
  if(ch.sh==='rock'){R(x-9,by-42,18,6,c2);}if(ch.sh==='blade'){R(x-3,by-56,6,6,K.w);}if(ch.sh==='vine'){R(x-9,by-48,3,10,c2);R(x+6,by-48,3,10,c2);}if(ch.sh==='bolt'){R(x-2,by-58,4,6,K.y);}
  R(x-6,by-18,5,18,c2);R(x+1,by-18,5,18,c2);const ext=q.act?(q.at<6?q.at*4:Math.max(0,24-q.at*2)):0;if(q.act==='kick'){R(x+d*6,by-16,d*(10+ext),5,c2);R(x+d*(6+ext)+(d<0?-6:0),by-20,6,8,K.w);}else if(q.blk){R(x+d*8-3,by-44,6,16,K.w);}else{R(x+d*8-3,by-36,6+ext,6,'#ffd9a8');R(x+d*(5+ext)-3+d*4,by-37,7,7,'#ffd9a8');R(x-d*6-3,by-30,6,6,'#ffd9a8');}};
 g.draw=()=>{if(ph==='sel'){A.cls('#0d0926');T('CHOOSE YOUR FIGHTER',160,16,K.y,2,'c');CH.forEach((ch,i)=>{const x=50+i*74,sel=pick[cur]===i;R(x-28,44,56,110,sel?'#3a2a78':K.d);if(sel)A.box(x-28,44,56,110,ch.c);const dummy={act:'',at:0,blk:false,y:GY};man(dummy,x,140,1,ch);T(ch.n,x,158,sel?ch.c:K.gr,1,'c');});
   const ch=CH[pick[cur]];T((A.cpu?'':A.nm(cur)+': ')+ch.n,160,176,ch.c,2,'c');T('SPEED '+'|'.repeat(Math.round(ch.sp*2))+'   POWER '+'|'.repeat(Math.round(ch.pw*4)),160,196,K.w,1,'c');T('LEFT/RIGHT PICK   A CONFIRM',160,222,K.gr,1,'c');return;}
  A.cls('#0a0520');for(let i=0;i<7;i++){const h=40+(i*37)%70;R(i*50-10,GY-60-h,36,h,'#1b1440');for(let w=0;w<h;w+=10)R(i*50-4+((i+w)%3)*8,GY-60-h+w+3,4,4,(i*w)%7<3?K.y:'#2b2257');}
  R(0,GY,W,40,'#2a2d38');R(0,GY,W,3,K.p);R(0,GY+3,W,1,K.c);
  f.forEach((q,i)=>man(q,q.x,q.y,q.d,q.ch));proj.forEach(p=>{const s=Math.sin(p.t*.5)*3;if(p.sh==='bolt'){R(p.x-8,p.y-2+s,16,4,K.y);R(p.x-4,p.y-5,8,10,p.c);}else if(p.sh==='rock'){C(p.x,p.y+s,7,'#8a6a4a');C(p.x-2,p.y-2,3,'#b58a5a');}else if(p.sh==='blade'){A.poly([[p.x-10,p.y],[p.x,p.y-6],[p.x+10,p.y],[p.x,p.y+6]],K.w,1);A.poly([[p.x-6,p.y],[p.x,p.y-3],[p.x+6,p.y],[p.x,p.y+3]],p.c,1);}else{C(p.x,p.y+s,6,p.c);C(p.x-6,p.y-s,4,p.c);C(p.x+6,p.y-s*.5,4,p.c);}});
  f.forEach((q,i)=>{const x=i?W-130:8;A.box(x,14,122,10,K.w);R(i?x+1+(120-q.hp*1.2):x+1,15,q.hp*1.2,8,q.hp>30?K.g:K.r);T(q.ch.n,i?W-8:8,4,q.ch.c,1,i?'r':'l');for(let r=0;r<2;r++)C(i?W-14-r*10:14+r*10,30,3,rw[i]>r?K.y:K.d);});
  T(Math.ceil(time/60),160,10,K.w,2,'c');if(mt>0)T(msg,160,80,K.y,4,'c');if(ph==='ko'&&mt<60)T(A.nm(f[0].hp>f[1].hp?0:1)+' TAKES THE ROUND',160,120,K.w,2,'c');};
 return g;}});

/* ---- LAST BOT STANDING ---- */
A.add({id:'royale',name:'LAST BOT STANDING',cat:'ACTION',how:'MOVE. A FIRES WHERE YOU FACE. THE ZONE SHRINKS. BE LAST.',make(){
 const g={over:null,score:0},MW=600,MH=600;let p={x:300,y:300,fx:1,fy:0,hp:100,cd:0},bots=[],sh=[],zone=340,t=0,alive=0,cover=[];for(let i=0;i<25;i++)cover.push({x:rnd(MW),y:rnd(MH),r:12+rnd(14)});
 for(let i=0;i<9;i++)bots.push({x:rnd(MW),y:rnd(MH),hp:100,cd:ri(60),tx:rnd(MW),ty:rnd(MH)});
 const inC=(x,y)=>cover.some(c=>Math.hypot(c.x-x,c.y-y)<c.r);
 g.update=()=>{t++;zone=Math.max(60,340-t*.06);const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){p.fx=dx;p.fy=dy;const nx=cl(p.x+dx*2.2,0,MW),ny=cl(p.y+dy*2.2,0,MH);if(!inC(nx,p.y))p.x=nx;if(!inC(p.x,ny))p.y=ny;}if(p.cd>0)p.cd--;
  if(A.in(0).a&&p.cd===0){p.cd=14;const m=Math.hypot(p.fx,p.fy)||1;sh.push({x:p.x,y:p.y,vx:p.fx/m*6,vy:p.fy/m*6,o:-1,t:50});S('shoot');}
  const all=[p,...bots];for(const b of bots){if(b.hp<=0)continue;if(b.cd>0)b.cd--;const zc=Math.hypot(b.x-MW/2,b.y-MH/2)>zone-30;let tg=null,td=1e9;for(const o of all)if(o!==b&&o.hp>0){const d=Math.hypot(o.x-b.x,o.y-b.y);if(d<td){td=d;tg=o;}}
   if(zc){b.tx=MW/2;b.ty=MH/2;}else if(Math.hypot(b.tx-b.x,b.ty-b.y)<10||Math.random()<.01){b.tx=cl(MW/2+rnd(zone*1.6)-zone*.8,0,MW);b.ty=cl(MH/2+rnd(zone*1.6)-zone*.8,0,MH);}
   const mx=b.tx-b.x,my=b.ty-b.y,md=Math.hypot(mx,my)||1;const nx=b.x+mx/md*1.4,ny=b.y+my/md*1.4;if(!inC(nx,b.y))b.x=nx;if(!inC(b.x,ny))b.y=ny;
   if(tg&&td<150&&b.cd===0){b.cd=40+ri(30);const ox=tg.x-b.x+rnd(30)-15,oy=tg.y-b.y+rnd(30)-15,d=Math.hypot(ox,oy)||1;sh.push({x:b.x,y:b.y,vx:ox/d*5,vy:oy/d*5,o:b,t:50});}}
  for(const s of sh){s.x+=s.vx;s.y+=s.vy;s.t--;if(inC(s.x,s.y)){s.t=0;continue;}for(const o of all){if(o===s.o||o.hp<=0)continue;if(Math.hypot(o.x-s.x,o.y-s.y)<8){o.hp-=20;s.t=0;if(o===p){S('hit');if(p.hp<=0){g.over='ELIMINATED  #'+(alive+1);return;}}else if(o.hp<=0&&s.o===-1){g.score+=100;S('boom');}}}}sh=sh.filter(s=>s.t>0);
  for(const o of all)if(o.hp>0&&Math.hypot(o.x-MW/2,o.y-MH/2)>zone&&t%20===0){o.hp-=5;if(o===p){S('blip');if(p.hp<=0){g.over='ZONED OUT';return;}}}
  alive=bots.filter(b=>b.hp>0).length;if(alive===0){g.score+=1000;g.over='VICTORY! WIN';}};
 g.draw=()=>{A.cls('#1e5a35');const cx=p.x-160,cy=p.y-120;for(let i=0;i<MW;i+=40)for(let j=0;j<MH;j+=40)if((i+j)%80===0)R(i-cx,j-cy,40,40,'#1f6039');cover.forEach(c=>{C(c.x-cx,c.y-cy,c.r,'#3a2a18');C(c.x-cx,c.y-cy-3,c.r*.8,'#5b3a1e');});
  A.c.strokeStyle=K.b;A.c.lineWidth=3;A.c.beginPath();A.c.arc(MW/2-cx,MH/2-cy,zone,0,6.283);A.c.stroke();A.c.fillStyle='rgba(60,120,255,.25)';A.c.beginPath();A.c.rect(0,0,W,H);A.c.arc(MW/2-cx,MH/2-cy,zone,0,6.283,true);A.c.fill();
  bots.forEach(b=>{if(b.hp<=0){R(b.x-cx-6,b.y-cy-2,12,4,'#333');return;}C(b.x-cx,b.y-cy,7,K.r);R(b.x-cx-7,b.y-cy-12,14*b.hp/100,2,K.g);});sh.forEach(s=>C(s.x-cx,s.y-cy,2,s.o===-1?K.y:K.o));
  C(160,120,7,K.c);const m=Math.hypot(p.fx,p.fy)||1;L(160,120,160+p.fx/m*12,120+p.fy/m*12,K.w,3);R(6,222,100,8,K.k);R(7,223,p.hp*.98,6,p.hp>30?K.g:K.r);T('ALIVE '+(alive+1),W-6,4,K.w,2,'r');T('SCORE '+g.score,6,4,K.y,2);};
 return g;}});

/* ---- ZOMBIE NIGHT ---- */
A.add({id:'zombies',name:'ZOMBIE NIGHT',cat:'ACTION',how:'MOVE. A FIRES. SURVIVE THE WAVES.',make(){
 const g={over:null,score:0};let p={x:160,y:120,fx:1,fy:0,hp:100,cd:0},z=[],sh=[],wave=0,t=0,hurt=0;
 const spawn=()=>{wave++;for(let i=0;i<5+wave*3;i++){const e=ri(4);z.push({x:e===0?-10:e===1?W+10:rnd(W),y:e===2?-10:e===3?H+10:rnd(H),hp:2+(wave/3|0),sp:.5+rnd(.5)+wave*.05,big:Math.random()<.1});}};spawn();
 g.update=()=>{t++;if(hurt>0)hurt--;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){p.fx=dx;p.fy=dy;}p.x=cl(p.x+dx*2,8,W-8);p.y=cl(p.y+dy*2,28,H-8);if(p.cd>0)p.cd--;
  if(A.in(0).a&&p.cd===0){p.cd=Math.max(6,12-wave);const m=Math.hypot(p.fx,p.fy)||1;sh.push({x:p.x,y:p.y,vx:p.fx/m*6+rnd(.6)-.3,vy:p.fy/m*6+rnd(.6)-.3,t:40});S('shoot');}
  for(const s of sh){s.x+=s.vx;s.y+=s.vy;s.t--;for(const e of z){const r=e.big?12:7;if(Math.hypot(e.x-s.x,e.y-s.y)<r){e.hp-=1;s.t=0;e.hit=4;if(e.hp<=0){e.dead=1;g.score+=e.big?50:10;S('hit');}break;}}}sh=sh.filter(s=>s.t>0);
  for(const e of z){if(e.hit>0)e.hit--;const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;e.x+=dx/d*e.sp*(e.big?.6:1);e.y+=dy/d*e.sp*(e.big?.6:1);for(const o of z)if(o!==e){const ox=e.x-o.x,oy=e.y-o.y,od=Math.hypot(ox,oy);if(od<10&&od>0){e.x+=ox/od*.5;e.y+=oy/od*.5;}}
   if(d<(e.big?14:9)&&t%15===0){p.hp-=e.big?12:5;hurt=10;S('hit');if(p.hp<=0){g.over='OVERRUN  WAVE '+wave;return;}}}z=z.filter(e=>!e.dead);if(!z.length){g.score+=100*wave;p.hp=Math.min(100,p.hp+30);S('win');spawn();}};
 g.draw=()=>{A.cls('#12141c');for(let i=0;i<W;i+=32)for(let j=24;j<H;j+=32)R(i+1,j+1,30,30,(i+j)%64?'#171a24':'#141720');for(let i=0;i<6;i++){const x=(i*71+30)%W,y=40+(i*53)%160;R(x-10,y-14,20,28,'#333');R(x-6,y-10,12,8,'#8a5c33');}
  const grd=A.c.createRadialGradient?null:null;z.forEach(e=>{const r=e.big?12:7;C(e.x,e.y,r,e.hit?K.w:e.big?'#4a6a2a':'#5f8a3a');R(e.x-3,e.y-2,2,2,K.r);R(e.x+1,e.y-2,2,2,K.r);});sh.forEach(s=>R(s.x-1,s.y-1,3,3,K.y));
  C(p.x,p.y,7,K.c);const m=Math.hypot(p.fx,p.fy)||1;L(p.x,p.y,p.x+p.fx/m*12,p.y+p.fy/m*12,K.w,3);if(hurt)R(0,0,W,H,'rgba(255,0,0,.25)');
  R(0,0,W,22,K.bg);R(6,7,100,8,K.k);R(7,8,p.hp*.98,6,p.hp>30?K.g:K.r);T('WAVE '+wave+'  '+z.length+' LEFT',160,6,K.w,1,'c');T('SCORE '+g.score,W-6,4,K.y,2,'r');};
 return g;}});

/* ---- DUNGEON BRAWL ---- */
A.add({id:'brawl',name:'DUNGEON BRAWL',cat:'ACTION',how:'MOVE. A SWINGS YOUR SWORD. CLEAR THE ROOM, TAKE THE DOOR.',make(){
 const g={over:null,score:0};let p={x:160,y:120,fx:1,fy:0,hp:6,sw:0,cd:0},en=[],room=0,door=false,pots=[],inv=0;
 const build=()=>{room++;en=[];pots=[];for(let i=0;i<2+room;i++){let x,y;do{x=30+rnd(W-60);y=50+rnd(H-80);}while(Math.hypot(x-p.x,y-p.y)<60);en.push({x,y,hp:room>3?3:2,t:Math.random()<.3&&room>1?1:0,cd:ri(90)});}if(Math.random()<.5)pots.push({x:30+rnd(W-60),y:50+rnd(H-80)});door=false;};build();
 g.update=()=>{if(inv>0)inv--;if(p.cd>0)p.cd--;if(p.sw>0)p.sw--;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){p.fx=dx;p.fy=dy;}if(p.sw===0){p.x=cl(p.x+dx*2,14,W-14);p.y=cl(p.y+dy*2,36,H-14);}
  if(A.hit(0).a&&p.cd===0){p.sw=12;p.cd=20;S('hit');const m=Math.hypot(p.fx,p.fy)||1,sx=p.x+p.fx/m*16,sy=p.y+p.fy/m*16;for(const e of en){if(Math.hypot(e.x-sx,e.y-sy)<20){e.hp--;e.kb=8;e.kx=p.fx/m;e.ky=p.fy/m;if(e.hp<=0){e.dead=1;g.score+=e.t?60:30;S('boom');}}}}
  for(const e of en){if(e.kb>0){e.kb--;e.x=cl(e.x+e.kx*3,14,W-14);e.y=cl(e.y+e.ky*3,36,H-14);continue;}const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(e.t===0||d>80){e.x+=dx/d*(e.t?.6:.9);e.y+=dy/d*(e.t?.6:.9);}if(e.t===1&&--e.cd<=0){e.cd=100;e.arrow={x:e.x,y:e.y,vx:dx/d*3,vy:dy/d*3};}
   if(e.arrow){e.arrow.x+=e.arrow.vx;e.arrow.y+=e.arrow.vy;if(Math.hypot(e.arrow.x-p.x,e.arrow.y-p.y)<8&&inv===0){p.hp--;inv=50;e.arrow=null;S('hit');}else if(e.arrow.x<0||e.arrow.x>W||e.arrow.y<0||e.arrow.y>H)e.arrow=null;}
   if(d<12&&inv===0){p.hp--;inv=50;S('hit');}}en=en.filter(e=>!e.dead);if(p.hp<=0){g.over='SLAIN IN ROOM '+room;return;}
  pots=pots.filter(q=>{if(Math.hypot(q.x-p.x,q.y-p.y)<10){p.hp=Math.min(6,p.hp+2);S('coin');return false;}return true;});
  if(!en.length){door=true;if(Math.abs(p.x-160)<14&&p.y<44){g.score+=100;S('win');p.y=H-30;build();}}};
 g.draw=()=>{A.cls('#2a2438');for(let i=0;i<W;i+=20)for(let j=30;j<H;j+=20)R(i+1,j+1,18,18,(i+j)%40?'#302a40':'#2c2640');R(0,22,W,8,'#5b3a1e');R(0,H-8,W,8,'#5b3a1e');R(0,22,8,H,'#5b3a1e');R(W-8,22,8,H,'#5b3a1e');R(146,22,28,10,door?K.g:'#3a2a18');
  pots.forEach(q=>{R(q.x-4,q.y-6,8,10,K.r);R(q.x-2,q.y-9,4,3,K.gr);});en.forEach(e=>{R(e.x-7,e.y-8,14,16,e.kb?K.w:e.t?K.p:'#8a3a3a');R(e.x-4,e.y-4,3,3,K.y);R(e.x+1,e.y-4,3,3,K.y);if(e.arrow)R(e.arrow.x-2,e.arrow.y-2,4,4,K.y);});
  if(inv%8<5){R(p.x-6,p.y-8,12,16,K.c);R(p.x-4,p.y-12,8,5,'#ffd9a8');}const m=Math.hypot(p.fx,p.fy)||1,a=Math.atan2(p.fy,p.fx)+(p.sw?(p.sw-6)*.2:0);L(p.x,p.y,p.x+Math.cos(a)*22,p.y+Math.sin(a)*22,p.sw?K.w:K.gr,3);
  for(let i=0;i<6;i++)R(6+i*12,6,10,10,i<p.hp?K.r:K.d);T('ROOM '+room,160,6,K.w,2,'c');T('SCORE '+g.score,W-6,4,K.y,2,'r');};
 return g;}});

/* ---- TOWER DEFENSE ---- */
A.add({id:'towers',name:'TOWER LINE',cat:'ACTION',how:'MOVE CURSOR. A BUILDS A TURRET (50). B UPGRADES (80). 10 WAVES.',make(){
 const g={over:null,score:0},PATH=[[0,60],[100,60],[100,160],[220,160],[220,60],[320,60]],SLOTS=[[60,100],[140,120],[180,200],[260,110],[140,30],[260,200],[60,200],[180,100]];
 let c=0,tw=[],en=[],sh=[],money=120,lives=10,wave=0,t=0,left=0,next=120;
 const spawnW=()=>{wave++;left=6+wave*2;};spawnW();
 const at=d=>{let acc=0;for(let i=0;i<PATH.length-1;i++){const a=PATH[i],b=PATH[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=acc+l){const f=(d-acc)/l;return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];}acc+=l;}return null;};
 g.update=()=>{t++;const h=A.hit(0);if(h.l||h.u)c=(c+SLOTS.length-1)%SLOTS.length;if(h.r||h.d)c=(c+1)%SLOTS.length;if(h.l||h.r||h.u||h.d)S('blip');
  const ex=tw.find(q=>q.s===c);if(h.a&&!ex&&money>=50){money-=50;tw.push({s:c,lv:1,cd:0});S('coin');}if(h.b&&ex&&ex.lv<3&&money>=80){money-=80;ex.lv++;S('coin');}
  if(left>0&&--next<=0){next=Math.max(20,60-wave*3);left--;en.push({d:0,hp:3+wave*1.5|0,mx:3+wave*1.5|0,sp:.8+wave*.05,big:left%5===0});}
  for(const e of en){e.d+=e.sp*(e.big?.6:1);const p=at(e.d);if(!p){e.dead=1;lives--;S('lose');if(lives<=0){g.over='BASE FALLEN  WAVE '+wave;return;}}else{e.x=p[0];e.y=p[1];}}
  for(const q of tw){if(q.cd>0){q.cd--;continue;}const s=SLOTS[q.s],rng=60+q.lv*15,tg=en.filter(e=>!e.dead&&Math.hypot(e.x-s[0],e.y-s[1])<rng).sort((a,b)=>b.d-a.d)[0];if(tg){q.cd=Math.max(8,30-q.lv*7);sh.push({x:s[0],y:s[1],tx:tg.x,ty:tg.y,t:5});tg.hp-=q.lv;if(tg.hp<=0){tg.dead=1;money+=tg.big?12:6;g.score+=10;S('hit');}}}
  sh.forEach(s=>s.t--);sh=sh.filter(s=>s.t>0);en=en.filter(e=>!e.dead);if(left===0&&!en.length){if(wave>=10){g.over='BASE DEFENDED! WIN';return;}money+=40;g.score+=100;S('win');spawnW();}};
 g.draw=()=>{A.cls('#1e5a35');for(let i=0;i<PATH.length-1;i++){const a=PATH[i],b=PATH[i+1];L(a[0],a[1],b[0],b[1],'#8a6a4a',14);}R(300,48,20,24,K.b);R(304,42,12,6,K.b);
  SLOTS.forEach((s,i)=>{R(s[0]-10,s[1]-10,20,20,'#2a7a45');A.box(s[0]-10,s[1]-10,20,20,i===c?K.y:'#3a8a55');});tw.forEach(q=>{const s=SLOTS[q.s];R(s[0]-7,s[1]-7,14,14,[K.c,K.o,K.p][q.lv-1]);R(s[0]-3,s[1]-12,6,8,K.w);if(q.s===c)A.ring(s[0],s[1],60+q.lv*15,'rgba(255,255,255,.3)');});
  en.forEach(e=>{const r=e.big?8:5;C(e.x,e.y,r,e.big?'#8a3a3a':K.r);R(e.x-7,e.y-r-6,14*e.hp/e.mx,2,K.g);});sh.forEach(s=>L(s.x,s.y,s.tx,s.ty,K.y));
  T('$'+money,6,4,K.y,2);T('WAVE '+wave+'/10',160,4,K.w,2,'c');T('LIVES '+lives,W-6,4,lives<4?K.r:K.w,2,'r');if(t<200)T('A BUILD 50   B UPGRADE 80',160,226,K.w,1,'c');};
 return g;}});
})();
