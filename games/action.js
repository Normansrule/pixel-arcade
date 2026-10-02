(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const coinA=(x,y,r)=>{X.orb(x,y,r,'#ffcf3f');A.line(x,y-r*.55,x,y+r*.55,'#a06a00',Math.max(.8,r*.32));};
/* top-down soldier: x,y centre, facing angle a, body colour */
const trooper=(x,y,a,col,hit,step)=>{const c=A.c;X.shadow(x+1,y+3,8,4,.3);c.save();c.translate(x,y);c.rotate(a);const sw=Math.sin(step||0)*2;X.ell(-1+sw*.3,-4,2.6,2,'#2a2a34');X.ell(-1-sw*.3,4,2.6,2,'#2a2a34');
 X.stroke([[2,2],[12,1]],'#2a2a2a',2.6);X.stroke([[9,1],[13,1]],'#555',1.6);X.ell(0,0,5,6.5,hit?'#ffffff':X.lg(-5,0,5,0,[X.lt(col,1.3),col,X.lt(col,.6)]));X.orb(1,0,3.6,hit?'#ffffff':X.lt(col,.75));c.restore();};

/* ---- STRIKE ZONE 3D (first-person shooter) ---- */
A.add({id:'fps',name:'STRIKE ZONE 3D',cat:'ACTION',hd:1,mouse:1,how:'MOUSE TO LOOK, CLICK TO FIRE (HOLD OR SPAM). W/S MOVE, A/D STRAFE.',make(){
 const g={over:null,score:0},N=17,M=[];g.dbg=()=>({p,en:en.map(e=>[+e.x.toFixed(1),+e.y.toFixed(1)]),hp});for(let y=0;y<N;y++){M.push([]);for(let x=0;x<N;x++)M[y].push(x===0||y===0||x===N-1||y===N-1||((x%4===2)&&(y%4===2))||(x%8===6&&y%3===0&&y>2&&y<N-3)?1:0);}
 let p={x:1.5,y:1.5,a:.785},en=[],hp=100,ammo=30,wave=0,kick=0,fl=0,hurt=0,rl=0;const zb=new Float32Array(160);
 const spawn=()=>{wave++;for(let i=0;i<3+wave*2;i++){let x,y;do{x=1.5+ri(N-2);y=1.5+ri(N-2);}while(M[y|0][x|0]||Math.hypot(x-p.x,y-p.y)<5);en.push({x,y,hp:2+wave/2|0,cd:60+ri(60),t:ri(100)});}};spawn();
 const solid=(x,y)=>M[y|0][x|0]===1;const los=(ax_,ay_,bx,by)=>{const d=Math.hypot(bx-ax_,by-ay_),n=d*4|0;for(let i=1;i<n;i++){if(solid(ax_+(bx-ax_)*i/n,ay_+(by-ay_)*i/n))return false;}return true;};
 g.update=()=>{const k=A.in(0);if(kick>0)kick--;if(fl>0)fl--;if(hurt>0)hurt--;if(rl>0){rl--;if(rl===0){ammo=30;}}
  p.a+=A.mouse.dx*.0035;const strafe=A.mouse.t>0||k.b;if(strafe){const s=ax(k)*.055,nx=p.x+Math.cos(p.a+1.57)*s,ny=p.y+Math.sin(p.a+1.57)*s;if(!solid(nx,p.y))p.x=nx;if(!solid(p.x,ny))p.y=ny;}else p.a+=ax(k)*.045;
  const mv=-ay(k)*.06,nx=p.x+Math.cos(p.a)*mv,ny=p.y+Math.sin(p.a)*mv;if(!solid(nx+Math.cos(p.a)*.2*Math.sign(mv||1),p.y))p.x=nx;if(!solid(p.x,ny+Math.sin(p.a)*.2*Math.sign(mv||1)))p.y=ny;
  if(A.fire(7)&&rl===0){if(ammo>0){ammo--;kick=6;fl=3;S('shoot');let best=null,bd=1e9;for(const e of en){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);let da=Math.atan2(dy,dx)-p.a;while(da>3.14)da-=6.28;while(da<-3.14)da+=6.28;if(Math.abs(da)<.09+.25/d&&d<bd&&los(p.x,p.y,e.x,e.y)){bd=d;best=e;}}if(best){best.hp--;best.hit=6;if(best.hp<=0){en.splice(en.indexOf(best),1);g.score+=100;S('boom');A.burst(160,120,K.r,14,3);}else S('hit');}}else{rl=60;S('lose');}}
  if(A.t%20===0||!g.fl){const fl=new Int16Array(N*N).fill(-1),q=[(p.y|0)*N+(p.x|0)];fl[q[0]]=0;while(q.length){const c=q.shift(),cx=c%N,cy=(c/N)|0;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+d[0],ny=cy+d[1],ni=ny*N+nx;if(!M[ny][nx]&&fl[ni]<0){fl[ni]=fl[c]+1;q.push(ni);}}}g.fl=fl;}
  for(const e of en){e.t++;if(e.hit>0)e.hit--;let dx=p.x-e.x,dy=p.y-e.y;const d=Math.hypot(dx,dy),see=los(e.x,e.y,p.x,p.y);if(!see){const cx=e.x|0,cy=e.y|0;let bd=g.fl[cy*N+cx],bx=cx,by=cy;for(const o of[[1,0],[-1,0],[0,1],[0,-1]]){const v=g.fl[(cy+o[1])*N+cx+o[0]];if(v>=0&&v<bd){bd=v;bx=cx+o[0];by=cy+o[1];}}dx=bx+.5-e.x;dy=by+.5-e.y;const dd=Math.hypot(dx,dy)||1;dx=dx/dd*d;dy=dy/dd*d;}if(see&&d>2){const s=.018+wave*.002;const ex=e.x+dx/d*s,ey=e.y+dy/d*s;if(!solid(ex,e.y))e.x=ex;if(!solid(e.x,ey))e.y=ey;}else if(!see){const s=.02+wave*.0015,dl=Math.hypot(dx,dy)||1;const ex=e.x+dx/dl*s,ey=e.y+dy/dl*s;if(!solid(ex,e.y))e.x=ex;if(!solid(e.x,ey))e.y=ey;}
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
  R(6,222,100,10,K.k);R(7,223,hp*.98,8,hp>30?K.g:K.r);T('HP',8,214,K.w);T(rl?'RELOADING':'AMMO '+ammo,W-6,214,ammo<6?K.r:K.w,1,'r');T('WAVE '+wave+'   '+en.length+' LEFT',W-6,224,K.w,1,'r');T('SCORE '+g.score,160,4,K.y,2,'c');C(290,40,22,'rgba(0,0,0,.5)');A.ring(290,40,22,K.g);en.forEach(e=>{const ex=e.x-p.x,ey=e.y-p.y,ca=Math.cos(-p.a+1.57),sa=Math.sin(-p.a+1.57),rx=ex*ca-ey*sa,ry=ex*sa+ey*ca,d=Math.hypot(rx,ry);if(d<9)R(290+rx*2.4-1,40-ry*2.4-1,3,3,K.r);});R(289,39,3,3,K.c);};
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
   if(q.act){q.at++;if(q.at===6){const rng=q.act==='kick'?44:36,dmg=(q.act==='kick'?9:6)*ch.pw;if(Math.abs(o.x-q.x)<rng&&Math.abs(o.y-q.y)<30){if(o.blk){o.hp-=1;o.x+=q.d*6;S('blip');}else{o.hp-=dmg;o.st=12;S('hit');A.burst(o.x,o.y-30,K.y,10,2.5);}}}if(q.at>(q.act==='kick'?20:14)){q.act='';q.at=0;}}
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
 const g={over:null,score:0},MW=600,MH=600,fx=X.fx();let p={x:300,y:300,fx:1,fy:0,hp:100,cd:0},bots=[],sh=[],zone=340,t=0,alive=0,cover=[],hurt=0;for(let i=0;i<25;i++)cover.push({x:rnd(MW),y:rnd(MH),r:12+rnd(14),k:i%3});
 for(let i=0;i<9;i++){let x,y;do{x=rnd(MW);y=rnd(MH);}while(Math.hypot(x-300,y-300)<220);bots.push({x,y,hp:100,cd:120+ri(120),tx:rnd(MW),ty:rnd(MH),c:['#ff4f6d','#ff9a3f','#c06aff','#ffcf3f','#7a8aff'][i%5],a:0});}
 const inC=(x,y)=>cover.some(c=>Math.hypot(c.x-x,c.y-y)<c.r);
 g.update=()=>{t++;if(hurt>0)hurt--;zone=Math.max(60,340-t*.06);const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){p.fx=dx;p.fy=dy;const nx=cl(p.x+dx*2.2,0,MW),ny=cl(p.y+dy*2.2,0,MH);if(!inC(nx,p.y))p.x=nx;if(!inC(p.x,ny))p.y=ny;p.st=(p.st||0)+.4;}if(p.cd>0)p.cd--;
  if(A.in(0).a&&p.cd===0){p.cd=14;const m=Math.hypot(p.fx,p.fy)||1;sh.push({x:p.x,y:p.y,vx:p.fx/m*6,vy:p.fy/m*6,o:-1,t:50});S('shoot');p.mf=4;}if(p.mf>0)p.mf--;
  const all=[p,...bots];for(const b of bots){if(b.hp<=0)continue;if(b.cd>0)b.cd--;if(b.mf>0)b.mf--;const zc=Math.hypot(b.x-MW/2,b.y-MH/2)>zone-30;let tg=null,td=1e9;for(const o of all)if(o!==b&&o.hp>0){const d=Math.hypot(o.x-b.x,o.y-b.y);if(d<td){td=d;tg=o;}}
   if(zc){b.tx=MW/2;b.ty=MH/2;}else if(Math.hypot(b.tx-b.x,b.ty-b.y)<10||Math.random()<.01){b.tx=cl(MW/2+rnd(zone*1.6)-zone*.8,0,MW);b.ty=cl(MH/2+rnd(zone*1.6)-zone*.8,0,MH);}
   const mx=b.tx-b.x,my=b.ty-b.y,md=Math.hypot(mx,my)||1;const nx=b.x+mx/md*1.4,ny=b.y+my/md*1.4;if(!inC(nx,b.y))b.x=nx;if(!inC(b.x,ny))b.y=ny;b.a=tg&&td<150?Math.atan2(tg.y-b.y,tg.x-b.x):Math.atan2(my,mx);b.st=(b.st||0)+.3;
   if(tg&&td<150&&b.cd===0){b.cd=60+ri(40);const sp=40-Math.min(30,t/60),ox=tg.x-b.x+rnd(sp)-sp/2,oy=tg.y-b.y+rnd(sp)-sp/2,d=Math.hypot(ox,oy)||1;sh.push({x:b.x,y:b.y,vx:ox/d*5,vy:oy/d*5,o:b,t:50});b.mf=4;}}
  for(const s of sh){s.x+=s.vx;s.y+=s.vy;s.t--;if(inC(s.x,s.y)){s.t=0;fx.spark(s.x,s.y,'#c8b890',3,1.2);continue;}for(const o of all){if(o===s.o||(s.o===-1&&o===p)||o.hp<=0)continue;if(Math.hypot(o.x-s.x,o.y-s.y)<8){o.hp-=20;s.t=0;o.hit=4;fx.spark(o.x,o.y,'#ffd080',5,1.6);if(o===p){o.hp+=8;S('hit');A.shake=5;hurt=10;if(p.hp<=0){g.over='ELIMINATED  #'+(alive+1);return;}}else if(o.hp<=0&&s.o===-1){g.score+=100;S('boom');fx.debris(o.x,o.y,o.c,10,2);fx.pop(o.x,o.y-14,'+100',K.y);}}}}sh=sh.filter(s=>s.t>0);
  for(const o of all){if(o.hit>0)o.hit--;if(o.hp>0&&Math.hypot(o.x-MW/2,o.y-MH/2)>zone&&t%20===0){o.hp-=5;if(o===p){S('blip');hurt=6;if(p.hp<=0){g.over='ZONED OUT';return;}}}}
  alive=bots.filter(b=>b.hp>0).length;if(alive===0){g.score+=1000;g.over='VICTORY! WIN';}};
 g.draw=()=>{const cx=p.x-160,cy=p.y-120,c=A.c;X.vg(0,0,W,H,['#3a8a4a','#2e7a3e']);
  for(let i=Math.floor(cx/40)*40;i<cx+W+40;i+=40)for(let j=Math.floor(cy/40)*40;j<cy+H+40;j+=40){if(i<0||j<0||i>=MW||j>=MH)continue;const h=((i*7+j*13)>>3)%7;if(h<2){c.fillStyle='rgba(0,0,0,.06)';c.fillRect(i-cx,j-cy,40,40);}if(h===3)X.poly([[i-cx+12,j-cy+20],[i-cx+14,j-cy+13],[i-cx+16,j-cy+20]],'#4a9a4a');if(h===5){X.disc(i-cx+24,j-cy+26,1.6,'#ffe070');X.disc(i-cx+28,j-cy+24,1.4,'#ff8ab0');}}
  c.fillStyle='#1a3a20';if(cx<0)c.fillRect(0,0,-cx,H);if(cy<0)c.fillRect(0,0,W,-cy);if(cx+W>MW)c.fillRect(MW-cx,0,W,H);if(cy+H>MH)c.fillRect(0,MH-cy,W,H);
  bots.forEach(b=>{if(b.hp<=0){const x=b.x-cx,y=b.y-cy;X.rr(x-5,y-4,10,8,2,'#6a5a3a');X.rr(x-5,y-4,10,2,1,'#8a7a50');}});
  cover.forEach(o=>{const x=o.x-cx,y=o.y-cy;if(x<-30||y<-30||x>W+30||y>H+30)return;X.shadow(x+3,y+4,o.r,o.r*.55,.3);if(o.k===0){X.orb(x,y,o.r,'#8a8a96');X.disc(x+o.r*.3,y+o.r*.2,o.r*.3,'rgba(0,0,0,.12)');}else if(o.k===1){for(let q=0;q<5;q++){const a=q*1.256;X.disc(x+Math.cos(a)*o.r*.45,y+Math.sin(a)*o.r*.45,o.r*.6,q%2?'#2a7a3a':'#3a8a40');}X.disc(x-o.r*.2,y-o.r*.25,o.r*.4,'#5ab050');}else{const s=o.r*1.3;X.block(x-s/2,y-s/2,s,s,'#a87a40',2);A.line(x-s/2+2,y-s/2+2,x+s/2-2,y+s/2-2,'#6a4a20',1.5);A.line(x+s/2-2,y-s/2+2,x-s/2+2,y+s/2-2,'#6a4a20',1.5);}});
  const zx=MW/2-cx,zy=MH/2-cy;c.strokeStyle='rgba(120,60,220,.34)';c.lineWidth=600;c.beginPath();c.arc(zx,zy,zone+300,0,6.283);c.stroke();for(let k=0;k<3;k++){c.strokeStyle='rgba(170,110,255,'+(.08+k*.04)+')';c.lineWidth=2;c.beginPath();c.arc(zx,zy,zone+8+k*10+(A.t*.3)%10,0,6.283);c.stroke();}c.strokeStyle='rgba(200,150,255,.9)';c.lineWidth=2.5;c.beginPath();c.arc(zx,zy,zone,0,6.283);c.stroke();c.strokeStyle='rgba(200,150,255,.3)';c.lineWidth=7;c.stroke();
  bots.forEach(b=>{if(b.hp<=0)return;const x=b.x-cx,y=b.y-cy;if(x<-20||y<-20||x>W+20||y>H+20)return;trooper(x,y,b.a,b.c,b.hit>0,b.st);if(b.mf)X.glow(x+Math.cos(b.a)*14,y+Math.sin(b.a)*14,6,'#ffd080',.8);X.meter(x-8,y-14,16,3,b.hp/100,b.hp>40?K.g:K.r);});
  sh.forEach(s=>{const x=s.x-cx,y=s.y-cy;X.stroke([[x-s.vx*1.6,y-s.vy*1.6],[x,y]],s.o===-1?'#fff0a0':'#ffb060',1.6);X.glow(x,y,4,s.o===-1?'#ffe060':'#ff9040',.6);});
  const pa=Math.atan2(p.fy,p.fx);trooper(160,120,pa,'#2fe8d0',hurt>6,p.st);if(p.mf)X.glow(160+Math.cos(pa)*14,120+Math.sin(pa)*14,7,'#ffe080',.9);A.ring(160,120,11+Math.sin(A.t*.15),'rgba(47,232,208,.45)');
  fx.draw();const out=Math.hypot(p.x-MW/2,p.y-MH/2)>zone;if(hurt){c.fillStyle='rgba(255,0,40,'+(hurt*.025)+')';c.fillRect(0,0,W,H);}
  X.panel(W-58,20,54,54,'#c896ff');const mm=50/MW;c.fillStyle='rgba(120,60,220,.4)';c.fillRect(W-56,22,50,50);X.disc(W-56+MW/2*mm,22+MH/2*mm,zone*mm,'#2e7a3e');X.disc(W-56+p.x*mm,22+p.y*mm,1.8,'#2fe8d0');
  X.bar('SCORE '+g.score,'ALIVE '+(alive+1),out?'GET IN THE ZONE!':'',K.y,'#ffffff');X.panel(4,220,110,16,p.hp>30?K.g:K.r);T('HP',9,225,'#ffffff',1,'l',1);X.meter(22,224,88,8,p.hp/100,p.hp>30?K.g:K.r);};
 return g;}});

/* ---- ZOMBIE NIGHT ---- */
A.add({id:'zombies',name:'ZOMBIE NIGHT',cat:'ACTION',how:'MOVE. A FIRES. SURVIVE THE WAVES.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:120,fx:1,fy:0,hp:100,cd:0},z=[],sh=[],wave=0,t=0,hurt=0,splat=[],ban=90;
 const spawn=()=>{wave++;ban=90;for(let i=0;i<5+wave*3;i++){const e=ri(4);z.push({x:e===0?-10:e===1?W+10:rnd(W),y:e===2?-10:e===3?H+10:rnd(H),hp:2+(wave/3|0),sp:.5+rnd(.5)+wave*.05,big:Math.random()<.1,ph:rnd(6)});}};spawn();
 g.update=()=>{t++;if(hurt>0)hurt--;if(ban>0)ban--;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){p.fx=dx;p.fy=dy;p.st=(p.st||0)+.4;}p.x=cl(p.x+dx*2,8,W-8);p.y=cl(p.y+dy*2,28,H-8);if(p.cd>0)p.cd--;if(p.mf>0)p.mf--;
  if(A.in(0).a&&p.cd===0){p.cd=Math.max(6,12-wave);const m=Math.hypot(p.fx,p.fy)||1;sh.push({x:p.x,y:p.y,vx:p.fx/m*6+rnd(.6)-.3,vy:p.fy/m*6+rnd(.6)-.3,t:40});S('shoot');p.mf=3;}
  for(const s of sh){s.x+=s.vx;s.y+=s.vy;s.t--;for(const e of z){const r=e.big?12:7;if(Math.hypot(e.x-s.x,e.y-s.y)<r){e.hp-=1;s.t=0;e.hit=4;fx.spark(s.x,s.y,'#9ad050',4,1.4);if(e.hp<=0){e.dead=1;g.score+=e.big?50:10;S('hit');A.burst(e.x,e.y,'#5f8a3a',10,2);fx.debris(e.x,e.y,'#4a6a2a',8,1.8);splat.push({x:e.x,y:e.y,r:e.big?10:6,a:rnd(6)});if(splat.length>40)splat.shift();}break;}}}sh=sh.filter(s=>s.t>0);
  for(const e of z){if(e.hit>0)e.hit--;const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;e.x+=dx/d*e.sp*(e.big?.6:1);e.y+=dy/d*e.sp*(e.big?.6:1);for(const o of z)if(o!==e){const ox=e.x-o.x,oy=e.y-o.y,od=Math.hypot(ox,oy);if(od<10&&od>0){e.x+=ox/od*.5;e.y+=oy/od*.5;}}
   if(d<(e.big?14:9)&&t%15===0){p.hp-=e.big?12:5;hurt=10;S('hit');A.shake=3;if(p.hp<=0){g.over='OVERRUN  WAVE '+wave;return;}}}z=z.filter(e=>!e.dead);if(!z.length){g.score+=100*wave;p.hp=Math.min(100,p.hp+30);S('win');fx.pop(160,90,'WAVE CLEAR +'+100*wave,K.y);spawn();}};
 const bg=()=>{X.vg(0,0,W,H,['#20242e','#181a22']);const c=A.c;for(let i=0;i<W;i+=16)for(let j=20;j<H;j+=12){const o=(j/12%2)*8;c.fillStyle=((i+j*3)%5)?'rgba(255,255,255,.03)':'rgba(0,0,0,.18)';c.fillRect(i+o+1,j+1,14,10);}
  X.rr(0,110,W,22,0,'#2a2a30');for(let i=6;i<W;i+=28)X.rr(i,120,14,2,1,'#c8b860');
  for(let i=0;i<6;i++){const x=(i*71+30)%W,y=40+(i*53)%160;if(i%2){X.rr(x-12,y-7,24,14,4,'#4a4a58');X.rr(x-8,y-5,8,10,2,'#2a3a4a');X.rr(x+2,y-5,7,10,2,'#2a3a4a');X.disc(x+12,y-4,1.5,'#ffe0a0');X.disc(x+12,y+4,1.5,'#ffe0a0');}else{X.rr(x-7,y-10,14,18,6,'#6a6a78');X.rr(x-7,y+4,14,4,1,'#4a4a58');A.line(x,y-6,x,y+1,'#3a3a44',1.5);A.line(x-3,y-4,x+3,y-4,'#3a3a44',1.5);}}};
 g.draw=()=>{X.cache('zomb_bg',bg);const c=A.c;splat.forEach(s=>{X.ell(s.x,s.y,s.r,s.r*.6,'rgba(70,110,40,.45)',s.a);X.disc(s.x+s.r*.6,s.y-1,s.r*.25,'rgba(70,110,40,.45)');});
  z.forEach(e=>{const r=e.big?12:7,a=Math.atan2(p.y-e.y,p.x-e.x),wb=Math.sin(A.t*.15+e.ph)*.25,col=e.hit?'#ffffff':e.big?'#4a6a2a':'#6a9a44';X.shadow(e.x+1,e.y+3,r,r*.5,.35);c.save();c.translate(e.x,e.y);c.rotate(a+wb);
   X.stroke([[0,-r*.6],[r*1.3,-r*.5+Math.sin(A.t*.2+e.ph)]],col,r*.35);X.stroke([[0,r*.6],[r*1.3,r*.5-Math.sin(A.t*.2+e.ph)]],col,r*.35);X.ell(0,0,r*.6,r*.85,e.hit?'#ffffff':e.big?'#3a3a4a':'#5a4a6a');X.orb(r*.2,0,r*.55,col);X.disc(r*.55,-r*.22,r*.13,'#ff3030');X.disc(r*.55,r*.22,r*.13,'#ff3030');c.restore();});
  sh.forEach(s=>{X.stroke([[s.x-s.vx*1.5,s.y-s.vy*1.5],[s.x,s.y]],'#fff0a0',1.8);});
  const pa=Math.atan2(p.fy,p.fx);trooper(p.x,p.y,pa,'#2fe8d0',hurt>6,p.st);
  const gl=c.globalCompositeOperation;c.fillStyle=X.rg(p.x,p.y,30,p.x,p.y,170,['rgba(0,0,10,0)','rgba(0,0,10,.55)','rgba(0,0,10,.8)']);c.fillRect(0,0,W,H);
  c.globalCompositeOperation='lighter';X.poly([[p.x+Math.cos(pa)*8,p.y+Math.sin(pa)*8],[p.x+Math.cos(pa-.42)*120,p.y+Math.sin(pa-.42)*120],[p.x+Math.cos(pa+.42)*120,p.y+Math.sin(pa+.42)*120]],X.rg(p.x,p.y,0,p.x,p.y,120,['rgba(255,240,180,.28)','rgba(255,240,180,0)']));c.globalCompositeOperation=gl||'source-over';
  z.forEach(e=>{const r=e.big?12:7,a=Math.atan2(p.y-e.y,p.x-e.x);X.glow(e.x+Math.cos(a)*r*.5,e.y+Math.sin(a)*r*.5,4,'#ff2020',.5);});if(p.mf)X.glow(p.x+Math.cos(pa)*14,p.y+Math.sin(pa)*14,9,'#ffe080',.9);
  fx.draw();if(hurt){c.fillStyle='rgba(255,0,0,'+(hurt*.03)+')';c.fillRect(0,0,W,H);}
  X.bar('','SCORE '+g.score,'WAVE '+wave+'  '+z.length+' LEFT',K.y,K.y);X.meter(6,5,100,8,p.hp/100,p.hp>30?K.g:K.r);if(ban>0)X.ot('WAVE '+wave,160,96,ban%20<14?'#ff6a5a':'#ffffff',3,'c');};
 return g;}});

/* ---- DUNGEON BRAWL ---- */
A.add({id:'brawl',name:'DUNGEON BRAWL',cat:'ACTION',how:'MOVE. A SWINGS YOUR SWORD. CLEAR THE ROOM, TAKE THE DOOR.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:120,fx:1,fy:0,hp:6,sw:0,cd:0},en=[],room=0,door=false,pots=[],inv=0,ban=60;
 const build=()=>{room++;ban=60;en=[];pots=[];for(let i=0;i<2+room;i++){let x,y;do{x=30+rnd(W-60);y=50+rnd(H-80);}while(Math.hypot(x-p.x,y-p.y)<60);en.push({x,y,hp:room>3?3:2,t:Math.random()<.3&&room>1?1:0,cd:ri(90)});}if(Math.random()<.5)pots.push({x:30+rnd(W-60),y:50+rnd(H-80)});door=false;};build();
 g.update=()=>{if(ban>0)ban--;if(inv>0)inv--;if(p.cd>0)p.cd--;if(p.sw>0)p.sw--;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){p.fx=dx;p.fy=dy;}if(p.sw===0){p.x=cl(p.x+dx*2,14,W-14);p.y=cl(p.y+dy*2,36,H-14);if(dx||dy)p.st=(p.st||0)+.35;}
  if(A.hit(0).a&&p.cd===0){p.sw=12;p.cd=20;S('hit');const m=Math.hypot(p.fx,p.fy)||1,sx=p.x+p.fx/m*16,sy=p.y+p.fy/m*16;for(const e of en){if(Math.hypot(e.x-sx,e.y-sy)<20){e.hp--;e.kb=8;e.kx=p.fx/m;e.ky=p.fy/m;A.burst(e.x,e.y,K.w,5,1.5);fx.spark(e.x,e.y-4,'#ffffff',6,2);A.shake=2;if(e.hp<=0){e.dead=1;g.score+=e.t?60:30;S('boom');A.burst(e.x,e.y,K.r,12,2.5);fx.debris(e.x,e.y,e.t?'#e8e0d0':'#5a9a3a',10,2.2);fx.pop(e.x,e.y-16,'+'+(e.t?60:30),K.y);}}}}
  for(const e of en){e.st=(e.st||0)+.2;if(e.kb>0){e.kb--;e.x=cl(e.x+e.kx*3,14,W-14);e.y=cl(e.y+e.ky*3,36,H-14);continue;}const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(e.t===0||d>80){e.x+=dx/d*(e.t?.6:.9);e.y+=dy/d*(e.t?.6:.9);}if(e.t===1&&--e.cd<=0){e.cd=100;e.arrow={x:e.x,y:e.y,vx:dx/d*3,vy:dy/d*3};}
   if(e.arrow){e.arrow.x+=e.arrow.vx;e.arrow.y+=e.arrow.vy;if(Math.hypot(e.arrow.x-p.x,e.arrow.y-p.y)<8&&inv===0){p.hp--;inv=50;e.arrow=null;S('hit');A.shake=4;fx.flash('#ff2040',4);}else if(e.arrow.x<0||e.arrow.x>W||e.arrow.y<0||e.arrow.y>H)e.arrow=null;}
   if(d<12&&inv===0){p.hp--;inv=50;S('hit');A.shake=4;fx.flash('#ff2040',4);}}en=en.filter(e=>!e.dead);if(p.hp<=0){g.over='SLAIN IN ROOM '+room;return;}
  pots=pots.filter(q=>{if(Math.hypot(q.x-p.x,q.y-p.y)<10){p.hp=Math.min(6,p.hp+2);S('coin');fx.spark(q.x,q.y,'#ff6a8a',10,1.8);fx.pop(q.x,q.y-12,'+2 HP','#ff6a8a');return false;}return true;});
  if(!en.length){if(!door)fx.ring(160,30,K.y,30);door=true;if(Math.abs(p.x-160)<14&&p.y<44){g.score+=100;S('win');p.y=H-30;build();}}};
 const bg=()=>{X.vg(0,0,W,H,['#2a2438','#1e1a2a']);const c=A.c;for(let i=8;i<W-8;i+=20)for(let j=30;j<H-8;j+=20){const h=((i*7+j*11)>>2)%9;X.rr(i+1,j+1,18,18,2,h<2?'#363048':h<5?'#302a40':'#2c2640');if(h===7){A.line(i+4,j+5,i+10,j+11,'rgba(0,0,0,.35)',1);A.line(i+10,j+11,i+13,j+9,'rgba(0,0,0,.35)',1);}c.fillStyle='rgba(255,255,255,.04)';c.fillRect(i+2,j+2,16,1);}
  X.vg(0,18,W,16,['#5a4a6a','#3a3048']);for(let r=0;r<2;r++)for(let i=0;i<W;i+=16)X.rr(i+(r%2)*8,19+r*7,15,6,1,r?'#4a3e5a':'#5a4e6a');X.rr(0,H-8,W,8,0,'#3a3048');X.rr(0,30,8,H,0,'#3a3048');X.rr(W-8,30,8,H,0,'#3a3048');c.fillStyle='rgba(0,0,0,.35)';c.fillRect(8,34,W-16,3);
  X.rr(144,18,32,16,3,'#2a1a10');X.vignette(.55);};
 const torch=(x,y)=>{const f=Math.sin(A.t*.3+x)*1.5;X.glow(x,y-2,34+f*3,'#ff9a40',.3);X.rr(x-1.5,y,3,7,1,'#6a4a2a');X.poly([[x-3,y],[x,y-8-f],[x+3,y]],'#ff8a20');X.poly([[x-1.5,y],[x,y-5-f*.5],[x+1.5,y]],'#ffe060');};
 const goblin=e=>{const st=e.st||0,x=e.x,y=e.y,hit=e.kb>0,bob=Math.abs(Math.sin(st))*1.5,d=p.x<x?-1:1;X.shadow(x,y+9,7,2.5,.35);
  if(e.t){X.rr(x-3,y+2-bob,2,7,1,'#d8d0c0');X.rr(x+1,y+2-bob,2,7,1,'#d8d0c0');X.rr(x-5,y-6-bob,10,9,3,hit?'#ffffff':'#e8e0d0');for(let k=0;k<3;k++)A.line(x-4,y-4+k*2.5-bob,x+4,y-4+k*2.5-bob,'rgba(0,0,0,.3)',.8);X.orb(x,y-11-bob,5,hit?'#ffffff':'#f0e8d8');X.disc(x-2,y-12-bob,1.4,'#1a1a2a');X.disc(x+2,y-12-bob,1.4,'#1a1a2a');X.disc(x-2,y-12-bob,.6,'#ff3030');X.disc(x+2,y-12-bob,.6,'#ff3030');
   const c=A.c;c.strokeStyle='#8a5a2a';c.lineWidth=1.4;c.beginPath();c.arc(x+d*5,y-4-bob,6,d>0?-1.3:1.84,d>0?1.3:4.44);c.stroke();A.line(x+d*(5+Math.cos(1.3)*6),y-4-bob-Math.sin(1.3)*6,x+d*(5+Math.cos(1.3)*6),y-4-bob+Math.sin(1.3)*6,'#e8e0d0',.6);}
  else{X.rr(x-4,y+2-bob,3,6,1,'#3a5a2a');X.rr(x+1,y+2-bob,3,6,1,'#3a5a2a');X.rr(x-6,y-6-bob,12,10,4,hit?'#ffffff':'#7a4a2a');X.orb(x,y-10-bob,6,hit?'#ffffff':'#6aaa40');X.poly([[x-5,y-12-bob],[x-11,y-15-bob],[x-5,y-9-bob]],'#5a9a3a');X.poly([[x+5,y-12-bob],[x+11,y-15-bob],[x+5,y-9-bob]],'#5a9a3a');X.disc(x-2,y-11-bob,1.3,'#ffe040');X.disc(x+2,y-11-bob,1.3,'#ffe040');X.rr(x-2,y-7-bob,4,1.2,.5,'#2a3a1a');
   X.stroke([[x+d*5,y-2-bob],[x+d*9,y-10-bob+Math.sin(st*2)*2]],'#6a4a2a',2.5);X.disc(x+d*9,y-10-bob+Math.sin(st*2)*2,2.6,'#8a6a3a');}
  if(e.hp<(room>3?3:2))for(let k=0;k<e.hp;k++)X.disc(x-3+k*6,y-20,1.6,K.r);if(e.arrow){const a=e.arrow,an=Math.atan2(a.vy,a.vx);X.stroke([[a.x-Math.cos(an)*7,a.y-Math.sin(an)*7],[a.x,a.y]],'#c8a060',1.4);X.poly([[a.x+Math.cos(an)*3,a.y+Math.sin(an)*3],[a.x+Math.cos(an+2.4)*3,a.y+Math.sin(an+2.4)*3],[a.x+Math.cos(an-2.4)*3,a.y+Math.sin(an-2.4)*3]],'#d8d8e0');}};
 g.draw=()=>{X.cache('brawl_bg',bg);const c=A.c;[[40,24],[100,24],[220,24],[280,24]].forEach(([x,y])=>torch(x,y+4));
  if(door){X.glow(160,26,30,K.y,.4+.15*Math.sin(A.t*.2));X.rr(146,18,28,16,3,X.lg(0,18,0,34,['#fff0a0','#ffb040']));X.poly([[160,38+Math.sin(A.t*.2)*2],[155,44],[165,44]],K.y);}else{X.rr(146,19,28,15,3,'#6a4022');for(let k=0;k<4;k++)A.line(150+k*7,19,150+k*7,34,'#4a2a12',1);X.rr(146,25,28,2,0,'#888');}
  pots.forEach(q=>{const b=Math.sin(A.t*.1+q.x)*1;X.shadow(q.x,q.y+5,5,1.6,.35);X.orb(q.x,q.y+b,5,'#ff3a6a');X.rr(q.x-1.6,q.y-8+b,3.2,4,1,'#c8d0e0');X.rr(q.x-2.4,q.y-9+b,4.8,1.6,.8,'#8a5a2a');X.glow(q.x,q.y+b,10,'#ff3a6a',.25);});
  const ents=[...en.map(e=>({y:e.y,d:()=>goblin(e)})),{y:p.y,d:()=>{const m=Math.hypot(p.fx,p.fy)||1,a=Math.atan2(p.fy,p.fx)+(p.sw?(p.sw-6)*.2:0),blink=inv>0&&inv%8>=5;if(blink)c.globalAlpha=.35;
    if(p.sw){c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=6;c.beginPath();const a0=Math.atan2(p.fy,p.fx);c.arc(p.x,p.y-6,18,a0-1.2,a0+(p.sw-6)*.2);c.stroke();}
    A.person(p.x,p.y+8,{s:.62,c:'#2fe8d0',pants:'#3a3a5a',st:p.st||0,d:p.fx<0?-1:1,id:2,arm1:p.sw?(p.fx<0?1.6:-1.6):undefined});const hx=p.x+Math.cos(a)*5,hy=p.y-6+Math.sin(a)*5;X.stroke([[hx,hy],[hx+Math.cos(a)*18,hy+Math.sin(a)*18]],p.sw?'#ffffff':'#c8d0e0',2.4);X.stroke([[hx-Math.sin(a)*3,hy+Math.cos(a)*3],[hx+Math.sin(a)*3,hy-Math.cos(a)*3]],'#c8a040',2);c.globalAlpha=1;}}];
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());fx.draw();
  X.bar('','SCORE '+g.score,'ROOM '+room,K.y,K.y);for(let i=0;i<6;i++)X.heart(10+i*12,7,1.25,i<p.hp?'#ff4f6d':'rgba(255,255,255,.18)');if(ban>0)X.ot('ROOM '+room,160,100,'#ffffff',3,'c');if(door&&!en.length&&A.t%40<28)X.ot('DOOR OPEN!',160,48,K.y,1,'c');};
 return g;}});

/* ---- TOWER DEFENSE ---- */
A.add({id:'towers',name:'TOWER LINE',cat:'ACTION',how:'MOVE CURSOR. A BUILDS A TURRET (50). B UPGRADES (80). 10 WAVES.',make(){
 const g={over:null,score:0},fx=X.fx(),PATH=[[0,60],[100,60],[100,160],[220,160],[220,60],[320,60]],SLOTS=[[60,100],[140,120],[180,200],[260,110],[140,30],[260,200],[60,200],[180,100]];
 let c=0,tw=[],en=[],sh=[],money=120,lives=10,wave=0,t=0,left=0,next=120,ban=90;
 const spawnW=()=>{wave++;left=6+wave*2;ban=90;};spawnW();
 const at=d=>{let acc=0;for(let i=0;i<PATH.length-1;i++){const a=PATH[i],b=PATH[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=acc+l){const f=(d-acc)/l;return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];}acc+=l;}return null;};
 g.update=()=>{t++;if(ban>0)ban--;const h=A.hit(0);if(h.l||h.u)c=(c+SLOTS.length-1)%SLOTS.length;if(h.r||h.d)c=(c+1)%SLOTS.length;if(h.l||h.r||h.u||h.d)S('blip');
  const ex=tw.find(q=>q.s===c);if(h.a&&!ex&&money>=50){money-=50;tw.push({s:c,lv:1,cd:0,ang:0});S('coin');fx.ring(SLOTS[c][0],SLOTS[c][1],K.c,24);fx.debris(SLOTS[c][0],SLOTS[c][1],'#8a8a96',6,1.5);}if(h.b&&ex&&ex.lv<3&&money>=80){money-=80;ex.lv++;S('coin');fx.spark(SLOTS[c][0],SLOTS[c][1],K.y,14,2.2);fx.pop(SLOTS[c][0],SLOTS[c][1]-18,'LEVEL '+ex.lv,K.y);}
  if(left>0&&--next<=0){next=Math.max(20,60-wave*3);left--;en.push({d:0,hp:3+wave*1.5|0,mx:3+wave*1.5|0,sp:.8+wave*.05,big:left%5===0});}
  for(const e of en){e.d+=e.sp*(e.big?.6:1);const p=at(e.d);if(!p){e.dead=1;lives--;S('lose');A.shake=4;fx.flash('#ff2040',5);if(lives<=0){g.over='BASE FALLEN  WAVE '+wave;return;}}else{e.x=p[0];e.y=p[1];}}
  for(const q of tw){if(q.cd>0){q.cd--;continue;}const s=SLOTS[q.s],rng=60+q.lv*15,tg=en.filter(e=>!e.dead&&Math.hypot(e.x-s[0],e.y-s[1])<rng).sort((a,b)=>b.d-a.d)[0];if(tg){q.cd=Math.max(8,30-q.lv*7);q.ang=Math.atan2(tg.y-s[1],tg.x-s[0]);q.rc=4;sh.push({x:s[0]+Math.cos(q.ang)*9,y:s[1]+Math.sin(q.ang)*9,tx:tg.x,ty:tg.y,t:5,lv:q.lv});tg.hp-=q.lv;tg.hit=4;if(tg.hp<=0){tg.dead=1;money+=tg.big?12:6;g.score+=10;S('hit');fx.debris(tg.x,tg.y,tg.big?'#8a3a3a':'#ff6a5a',7,1.8);fx.pop(tg.x,tg.y-10,'+'+(tg.big?12:6),K.y);}}}
  tw.forEach(q=>{if(q.rc>0)q.rc--;});en.forEach(e=>{if(e.hit>0)e.hit--;});sh.forEach(s=>s.t--);sh=sh.filter(s=>s.t>0);en=en.filter(e=>!e.dead);if(left===0&&!en.length){if(wave>=10){g.over='BASE DEFENDED! WIN';return;}money+=40;g.score+=100;S('win');spawnW();}};
 const bg=()=>{X.vg(0,0,W,H,['#4a9a4a','#3a8a3e']);const cx=A.c;for(let i=0;i<260;i++){cx.fillStyle=i%3?'rgba(0,0,0,.07)':'rgba(255,255,255,.06)';cx.fillRect((i*53)%W,(i*97)%H,2,1);}
  [[30,140],[300,150],[20,30],[200,230],[120,220],[300,230]].forEach(([x,y])=>{X.shadow(x+2,y+5,9,3,.25);X.disc(x,y,8,'#2a6a2a');X.disc(x-2,y-2,5,'#3a8a3a');});
  for(let i=0;i<PATH.length-1;i++){const a=PATH[i],b=PATH[i+1];X.stroke([a,b],'#6a5030',18,'square');}for(let i=0;i<PATH.length-1;i++){const a=PATH[i],b=PATH[i+1];X.stroke([a,b],'#c8a46a',14,'square');}for(let i=0;i<PATH.length-1;i++){const a=PATH[i],b=PATH[i+1];X.stroke([a,b],'rgba(255,255,255,.08)',4,'square');}
  cx.fillStyle='rgba(90,60,30,.35)';for(let i=0;i<60;i++){const q=at(i*13);if(q)cx.fillRect(q[0]-4+(i*7)%9,q[1]-4+(i*5)%9,2,2);}
  X.shadow(310,74,16,4,.3);X.block(296,40,24,32,'#8a8aa0',2);for(let k=0;k<3;k++)X.rr(296+k*9,34,6,8,1,'#7a7a90');X.rr(304,56,8,16,4,'#3a2a1a');X.rr(306,24,1.5,12,0,'#ddd');X.poly([[307.5,24],[316,27],[307.5,30]],'#2f7fff');
  SLOTS.forEach(s=>{X.shadow(s[0],s[1]+9,12,3,.25);X.rr(s[0]-11,s[1]-11,22,22,4,X.lg(0,s[1]-11,0,s[1]+11,['#9a9aa8','#6a6a78']));X.rrs(s[0]-10.5,s[1]-10.5,21,21,4,'rgba(0,0,0,.35)',1);X.rr(s[0]-8,s[1]-8,16,16,3,'rgba(0,0,0,.12)');});};
 const turret=(q,sel)=>{const s=SLOTS[q.s],col=['#2fe8d0','#ff9a3f','#ff4fd0'][q.lv-1],x=s[0],y=s[1],rc=(q.rc||0)*.6,cx=A.c;X.orb(x,y,8,col);for(let k=0;k<q.lv;k++)X.disc(x-4+k*4,y+6,1.3,K.y);cx.save();cx.translate(x,y);cx.rotate(q.ang||0);X.rr(-rc,-2.5,12-rc,5,2,'#3a3a48');if(q.lv>1)X.rr(-rc,-4.5,10-rc,2,1,'#5a5a68');if(q.lv>2)X.rr(-rc,2.5,10-rc,2,1,'#5a5a68');cx.restore();X.orb(x,y,4.5,X.lt(col,.75));};
 const creep=e=>{const r=e.big?8:5,bob=Math.abs(Math.sin(A.t*.3+e.d*.1))*1.5,col=e.hit?'#ffffff':e.big?'#8a3a5a':'#ff5a4a';X.shadow(e.x,e.y+r*.7,r,r*.35,.35);X.ell(e.x,e.y-bob,r,r*.8,X.lg(0,e.y-r,0,e.y+r,[X.lt(col,1.4),col,X.lt(col,.6)]));if(e.big)for(let k=-1;k<=1;k++)X.poly([[e.x+k*4-2,e.y-r*.6-bob],[e.x+k*4,e.y-r-3-bob],[e.x+k*4+2,e.y-r*.6-bob]],'#e8e0d0');X.disc(e.x+r*.35,e.y-r*.25-bob,r*.22,'#ffffff');X.disc(e.x+r*.42,e.y-r*.25-bob,r*.11,'#1a1a1a');X.meter(e.x-7,e.y-r-7,14,3,e.hp/e.mx,K.g);};
 g.draw=()=>{X.cache('towers_bg',bg);const cx=A.c;const sel=SLOTS[c],ex=tw.find(q=>q.s===c);
  cx.fillStyle='rgba(255,255,255,.07)';cx.beginPath();cx.arc(sel[0],sel[1],ex?60+ex.lv*15:75,0,6.283);cx.fill();A.ring(sel[0],sel[1],ex?60+ex.lv*15:75,'rgba(255,255,255,.35)');
  en.forEach(creep);tw.forEach(q=>turret(q));
  sh.forEach(s=>{const col=['#7ff8ff','#ffc070','#ff8af0'][s.lv-1];X.stroke([[s.x,s.y],[s.tx,s.ty]],col,1+s.t*.4);X.glow(s.tx,s.ty,6,col,.6);});
  const pu=1+Math.sin(A.t*.25);X.rrs(sel[0]-13-pu,sel[1]-13-pu,26+2*pu,26+2*pu,5,K.y,2);if(!ex){X.ot(money>=50?'+50':'50',sel[0],sel[1]-3,money>=50?'#ffffff':'#ff6a6a',1,'c');}
  fx.draw();X.bar('  '+money,'',ex?(ex.lv<3?'B UPGRADE 80':'MAX LEVEL'):'A BUILD 50',K.y);coinA(12,9,5);for(let i=0;i<10;i++)X.heart(W-10-i*10,7,1,i<lives?'#ff4f6d':'rgba(255,255,255,.15)');
  X.panel(118,20,84,14,'#ffffff');T('WAVE '+wave+'/10',160,24,'#ffffff',1,'c',1);if(ban>0)X.ot('WAVE '+wave,160,110,K.y,3,'c');if(t<200)X.ot('A BUILD 50   B UPGRADE 80',160,226,'#ffffff',1,'c');};
 return g;}});
})();
