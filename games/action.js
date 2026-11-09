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
 const fpsBg=()=>{X.vg(0,0,W,121,['#04060c','#0b0f1c','#1a2034']);X.vg(0,120,W,120,['#141824','#232838','#3a3e4e']);const c=A.c;X.vg(0,100,W,20,['rgba(90,140,230,0)','rgba(90,140,230,.12)']);X.vg(0,120,W,18,['rgba(90,140,230,.12)','rgba(90,140,230,0)']);
  for(let i=0;i<7;i++){const y=124+i*i*2.4;c.fillStyle='rgba(0,0,0,'+(.05+i*.01)+')';c.fillRect(0,y,W,1);}for(let i=0;i<5;i++){const y=116-i*i*2.6;c.fillStyle='rgba(120,160,255,.035)';c.fillRect(0,y,W,1);}};
 const FOG=[13,16,28],WT=[[100,112,138],[138,96,82],[80,122,126],[110,104,124]];
 const bot=(x,ft,s,f,hit,ph)=>{const c=A.c,col=hit?'#ffffff':X.lt('#c8344a',f),dk=hit?'#ffffff':X.lt('#3a2a3a',f),mt=hit?'#ffffff':X.lt('#6a7088',f),lw=Math.sin(ph*.2)*4*s;
  X.shadow(x,ft,24*s,4.5*s,.45*f);X.rr(x-13*s,ft-32*s+Math.max(0,lw),9*s,32*s-Math.max(0,lw),2.5*s,dk);X.rr(x+4*s,ft-32*s+Math.max(0,-lw),9*s,32*s-Math.max(0,-lw),2.5*s,dk);
  X.rr(x-14*s,ft-36*s,28*s,8*s,3*s,mt);X.block(x-17*s,ft-66*s,34*s,34*s,col,5*s);X.rr(x-7*s,ft-58*s,14*s,10*s,2*s,hit?'#fff':X.lt('#1a1420',f));if(!hit)X.disc(x,ft-53*s,3*s,'rgba(255,'+(140+Math.sin(ph*.3)*60|0)+',60,'+(.5+.5*f)+')');
  X.rr(x-25*s,ft-60*s,8*s,26*s,3*s,mt);X.rr(x+17*s,ft-60*s,8*s,22*s,3*s,mt);X.rr(x+14*s,ft-42*s,14*s,10*s,2*s,dk);X.disc(x+21*s,ft-37*s,3.2*s,'#050505');A.ring(x+21*s,ft-37*s,3.6*s,X.lt('#ff6040',f));
  X.orb(x-19*s,ft-62*s,7*s,col);X.orb(x+19*s,ft-62*s,7*s,col);X.rr(x-4*s,ft-70*s,8*s,5*s,1,dk);X.orb(x,ft-78*s,11*s,mt);X.rr(x-9*s,ft-83*s,18*s,6.5*s,3*s,hit?'#fff':X.lt('#ffd23a',.5+.5*f));
  if(!hit){X.disc(x-5*s+Math.sin(ph*.08)*5*s,ft-80*s,2*s,'#ffffff');if(A.gfx!=='off')X.glow(x,ft-80*s,16*s,'#ffc030',.35*f);}};
 g.draw=()=>{const k0=A.in(0),bob=Math.sin(A.t*.15)*(k0.u||k0.d?2:0),c=A.c;X.cache('fps_bg',fpsBg);const dx=Math.cos(p.a),dy=Math.sin(p.a),plx=-dy*.66,ply=dx*.66;
  for(let ci=0;ci<160;ci++){const cm=2*ci/160-1,rx=dx+plx*cm,ry=dy+ply*cm;let mx=p.x|0,my=p.y|0;const ddx=Math.abs(1/(rx||1e-9)),ddy=Math.abs(1/(ry||1e-9)),sx=rx<0?-1:1,sy=ry<0?-1:1;let sdx=(rx<0?p.x-mx:mx+1-p.x)*ddx,sdy=(ry<0?p.y-my:my+1-p.y)*ddy,side=0,n=0;
   while(n++<64){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0;}else{sdy+=ddy;my+=sy;side=1;}if(M[my][mx])break;}const d=Math.max(.05,side?sdy-ddy:sdx-ddx);zb[ci]=d;const h=Math.min(H*3,200/d),f=Math.max(0,1-d/12),wx=(side?p.x+d*rx:p.y+d*ry)%1,ti=(mx*3+my*5)%4,tc=WT[ti];
   const e=((wx<.05||wx>.95)?.5:(wx<.09||wx>.91)?1.18:1)*(side?.74:1)*(.86+.14*Math.sin(wx*3.14)),y0=120-h/2+bob,X0=ci*2,col=k=>FOG[k]+(tc[k]*e-FOG[k])*f|0;
   if(A.gfx==='off')R(X0,y0,2,h,'rgb('+col(0)+','+col(1)+','+col(2)+')');else{X.wallCol(X.walltex(ti===1?'brick':'panel'),wx,X0,y0,2,h,1,FOG);c.fillStyle='rgba('+tc[0]+','+tc[1]+','+tc[2]+',.3)';c.fillRect(X0,y0,2,h);if(e<.99||e>1.01){c.fillStyle=e<1?'rgba(0,0,0,'+(1-e).toFixed(3)+')':'rgba(255,255,255,'+((e-1)*.5).toFixed(3)+')';c.fillRect(X0,y0,2,h);}if(f<1){c.fillStyle='rgba('+FOG[0]+','+FOG[1]+','+FOG[2]+','+(1-f).toFixed(3)+')';c.fillRect(X0,y0,2,h);}}if(h>10){c.fillStyle='rgba(255,255,255,'+(.12*f).toFixed(3)+')';c.fillRect(X0,y0,2,h*.035);c.fillStyle='rgba(0,0,0,'+(.38*f).toFixed(3)+')';c.fillRect(X0,y0+h*.88,2,h*.12);c.fillRect(X0,y0+h*.34,2,Math.max(.6,h*.012));c.fillStyle='rgba(255,255,255,'+(.06*f).toFixed(3)+')';c.fillRect(X0,y0+h*.35,2,Math.max(.5,h*.008));}
   if(ti===2&&Math.abs(wx-.5)<.045)R(X0,y0+h*.14,2,h*.62,'rgba(90,230,255,'+(.25+.7*f).toFixed(3)+')');else if(ti===0&&Math.abs(wx-.5)<.07)R(X0,y0+h*.1,2,h*.05,'rgba(255,210,120,'+(.2+.8*f).toFixed(3)+')');else if(ti===1&&wx>.2&&wx<.8&&((wx*10|0)%2))R(X0,y0+h*.5,2,h*.25,'rgba(255,190,40,'+(.18*f).toFixed(3)+')');
   if(f>.3&&(ti===2&&Math.abs(wx-.5)<.12)){c.fillStyle='rgba(90,230,255,'+(.10*f).toFixed(3)+')';c.fillRect(X0,y0+h,2,h*.25);}}
  en.slice().sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y)).forEach(e=>{const ox=e.x-p.x,oy=e.y-p.y,inv=1/(plx*dy-dx*ply),tx=inv*(dy*ox-dx*oy),tz=inv*(-ply*ox+plx*oy);if(tz<.2)return;const scx=80*(1+tx/tz),h=200/tz,c0=Math.max(0,Math.floor(scx-h*.16)),c1=Math.min(160,Math.ceil(scx+h*.16));
   c.save();c.beginPath();let any=0;for(let ci=c0;ci<c1;ci++)if(zb[ci]>tz){c.rect(ci*2,0,2,H);any=1;}if(any){c.clip();bot(scx*2,120+h*.4+bob,h/100*.95,Math.max(.22,1-tz/12),e.hit>0,e.t);}c.restore();});
  X.cache('fps_vig',()=>X.vignette(.6));if(hurt>0){c.fillStyle=X.rg(160,120,50,160,120,210,['rgba(255,0,20,0)','rgba(255,0,20,'+(hurt/18).toFixed(3)+')']);c.fillRect(0,0,W,H);}
  L(160-8,120,160-3,120,K.g);L(160+3,120,160+8,120,K.g);L(160,112,160,117,K.g);L(160,123,160,128,K.g);R(159.5,119.5,1,1,K.g);
  const gy=200+kick*3+bob;X.poly([[214,240],[252,240],[226,gy+12],[206,gy+14]],X.lg(206,0,252,0,['#232838','#3a4258','#1a1e2a']));
  X.poly([[176,240],[226,240],[214,gy-10],[186,gy-10]],X.lg(176,0,226,0,['#2a3040','#5c6680','#363d50','#141820']));X.poly([[186,gy-10],[214,gy-10],[207,gy-36],[193,gy-36]],X.lg(186,0,214,0,['#20242e','#4a5268','#1a1e28']));
  X.stroke([[187,gy-9],[194,gy-35]],'rgba(255,255,255,.22)',1);X.rr(194,gy-42,12,8,2,'#1a1e28');X.disc(200,gy-38,2.6,'#000');const ec=ammo<6?'#ff4050':'#3ad8ff';X.rr(197,gy-4,6,30,2,ec);c.fillStyle='rgba(255,255,255,.5)';c.fillRect(198,gy-2,1,26);if(A.gfx!=='off')X.glow(200,gy+10,20,ec,.3);
  for(let i=0;i<3;i++)X.rr(182+i*1.5,gy+14+i*9,3,5,1,'#0e1018');
  if(fl>0){X.glow(200,gy-40,34,'#ffb040',.9);const pts=[];for(let i=0;i<12;i++){const a=i*.5236+A.t,r=i%2?5:13+rnd(7);pts.push([200+Math.cos(a)*r,gy-40+Math.sin(a)*r*.8]);}X.poly(pts,'#ffd060');X.disc(200,gy-40,5,'#ffffff');}
  X.panel(4,208,110,28,hp>30?K.g:K.r);T('HP',10,212,K.w);T(''+Math.max(0,hp),108,212,hp>30?K.g:K.r,1,'r');X.meter(9,222,100,9,hp/100,hp>30?K.g:K.r);
  X.panel(W-122,208,118,28,ammo<6?K.r:'#3ad8ff');T(rl?'RELOADING':'AMMO '+ammo,W-10,212,ammo<6||rl?K.r:K.w,1,'r');T('WAVE '+wave+'   '+en.length+' LEFT',W-10,225,K.y,1,'r');
  X.ot('SCORE '+g.score,160,5,K.y,2,'c');
  X.disc(290,40,24,'rgba(4,14,10,.78)');const sa=A.t*.06;c.save();c.globalAlpha=.35;X.poly([[290,40],[290+Math.cos(sa)*23,40+Math.sin(sa)*23],[290+Math.cos(sa-.5)*23,40+Math.sin(sa-.5)*23]],'#2fe86a');c.restore();A.ring(290,40,23,K.g);A.ring(290,40,12,'rgba(47,232,106,.35)');L(267,40,313,40,'rgba(47,232,106,.2)');L(290,17,290,63,'rgba(47,232,106,.2)');
  en.forEach(e=>{const ex=e.x-p.x,ey=e.y-p.y,ca=Math.cos(-p.a+1.57),sa=Math.sin(-p.a+1.57),rx=ex*ca-ey*sa,ry=ex*sa+ey*ca,d=Math.hypot(rx,ry);if(d<9){X.glow(290+rx*2.4,40-ry*2.4,4,K.r,.6);R(290+rx*2.4-1,40-ry*2.4-1,3,3,K.r);}});X.poly([[290,36],[287,42],[293,42]],K.c);};
 return g;}});

/* ---- NEON FIGHTERS (rebuilt round 23: rain-soaked rooftop, jointed fighters, hit-stop, combos, elemental specials) ---- */
A.add({id:'fighters',name:'NEON FIGHTERS',cat:'ACTION',vs:1,tags:'street fighter fighting game rooftop',how:'A PUNCH. B KICK. DOWN+B SWEEP. UP JUMP. HOLD BACK TO BLOCK. DOWN+A SPECIAL. BEST OF 3.',make(){
 const g={over:null,score:0},GY=204,fx=X.fx(),lo=()=>A.gfx!=='off',hi=()=>A.gfx==='high';
 const CH=[{n:'VOLTA',c:'#2fe8d0',c2:'#1e4e5a',sk:'#e8b48a',hair:'#eef4ff',sp:2.6,pw:1,sh:'bolt',tag:'STORM SPRINTER',sn:'ARC BALL - DUCK IT'},
  {n:'BRICK',c:'#ff9838',c2:'#5a3420',sk:'#a8704a',hair:'#20140c',sp:1.9,pw:1.4,sh:'rock',big:1.12,tag:'STREET BRUISER',sn:'ROCK ROLL - JUMP IT'},
  {n:'SABLE',c:'#ff4f9a',c2:'#46163e',sk:'#f0c8a8',hair:'#140a18',sp:3.2,pw:.8,sh:'blade',tag:'SHADOW DANCER',sn:'MOON BLADE - DUCK IT'},
  {n:'MOSS',c:'#6af07a',c2:'#22482a',sk:'#7a4e30',hair:'#2a5a24',sp:2.3,pw:1.1,sh:'vine',tag:'ROOFTOP DRUID',sn:'THORN WAVE - JUMP IT'}];
 const AT={punch:{on:5,end:14,rng:36,dmg:6,stun:12,hs:4,hy:-46},kick:{on:7,end:22,rng:46,dmg:9,stun:16,hs:6,hy:-30},sweep:{on:8,end:26,rng:44,dmg:7,stun:0,hs:6,hy:-5,low:1,kd:1},air:{on:4,end:30,rng:36,dmg:8,stun:14,hs:5,hy:-24},spec:{on:7,end:22}};
 const PJ={bolt:{y:-40,v:3.8},rock:{y:-8,v:3.1,low:1},blade:{y:-44,v:4.4},vine:{y:-4,v:3.4,low:1}};
 let ph='sel',pick=[0,1],cur=0,selT=600,f=null,proj=[],rw=[0,0],time=3600,msg='',mt=0,hs=0,koT=0,bolt=0,steam=[],drips=[];const rain=[];for(let i=0;i<80;i++)rain.push({x:rnd(W+80),y:rnd(H),v:5+rnd(3),z:Math.random()<.35});
 const mk=(ch,x,d)=>({ch,x,y:GY,vy:0,jx:0,hp:100,lag:100,d,act:'',at:0,done:0,cd:0,st:0,blk:false,cr:false,kd:0,ws:0,fl:0,combo:0,cT:0,win:0});
 const start=()=>{f=[mk(CH[pick[0]],96,1),mk(CH[pick[1]],224,-1)];proj=[];time=3600;ph='fight';msg='ROUND '+(rw[0]+rw[1]+1);mt=100;koT=0;S('coin');};
 const land=(q,o,m,hx,hy)=>{const blocked=o.blk&&!o.kd&&(!m.low||o.cr)&&o.y>=GY;if(blocked){o.hp-=1;o.x=cl(o.x+q.d*7,20,W-20);S('blip');fx.spark(hx,hy,'#bfe8ff',6,1.6);fx.ring(hx,hy,'#bfe8ff',10,8);hs=Math.max(hs,2);return;}
  q.combo=o.st>0||o.kd>0?q.combo+1:1;q.cT=70;o.hp-=m.dmg*q.ch.pw;o.st=m.stun;o.fl=6;if(m.kd||o.y<GY-2){o.kd=m.kd?54:40;o.vy=-3.4;o.y-=1;}o.x=cl(o.x+q.d*(m.kd?10:5),20,W-20);
  S(m.dmg*q.ch.pw>10?'boom':'hit');hs=Math.max(hs,m.hs);A.shake=Math.max(A.shake,m.dmg*q.ch.pw>10?6:3);fx.spark(hx,hy,'#ffffff',8,2.6);fx.spark(hx,hy,q.ch.c,10,3.2);fx.ring(hx,hy,q.ch.c,12+m.dmg,10);if(f.indexOf(q)===0)g.score+=Math.round(m.dmg*q.ch.pw*10);};
 const brain=i=>{const q=f[i],o=f[1-i],d=Math.abs(q.x-o.x),pf=proj.find(p=>p.o!==i&&Math.abs(p.x-q.x)<74&&Math.sign(p.vx)===Math.sign(q.x-p.x)),tw=q.x<o.x?'r':'l',aw=q.x<o.x?'l':'r',ai=i?A.ai:.7;
  if(pf&&Math.random()<ai*.85)return pf.low?{u:1,[tw]:1}:Math.random()<.55?{d:1}:{[aw]:1};
  if(o.act&&o.at<8&&d<56&&Math.random()<ai*.7)return{[aw]:1,d:o.act==='sweep'};
  if(d>70){const b={[tw]:Math.random()<.85};if(q.cd===0&&Math.random()<.025*ai)return{d:1,a:1};if(Math.random()<.006)b.u=1;return b;}
  return{a:Math.random()<.06+.06*ai,b:Math.random()<.04+.05*ai,u:Math.random()<.012,d:Math.random()<.05};};
 const ko=(i)=>{const q=f[i],w=f[1-i];q.hp=0;q.kd=9999;q.st=0;q.vy=-4.2;q.act='';rw[1-i]++;ph='ko';msg=w.hp>=100?'PERFECT K.O.':'K.O.';mt=170;hs=26;koT=0;fx.flash('#ffffff',12);S('win');A.shake=10;fx.spark(q.x,q.y-40,w.ch.c,24,4);fx.ring(q.x,q.y-40,'#ffffff',40,24);};
 g._st=()=>({ph,mt,koT,rw,f,set hp(v){f[1].hp=v;}});
 g.update=()=>{if(mt>0)mt--;if(bolt>0)bolt--;else if(Math.random()<.0025)bolt=9;rain.forEach(r=>{r.y+=r.v;r.x-=r.v*.25;if(r.y>H){r.y=-10;r.x=rnd(W+80);}});if(A.t%7===0)steam.push({x:62+rnd(6),y:170,r:3,a:.35});steam.forEach(s=>{s.y-=.45;s.x+=.25;s.r+=.12;s.a-=.004;});steam=steam.filter(s=>s.a>0);if(Math.random()<.35)drips.push({x:rnd(W),y:GY-30+rnd(70),r:0});drips.forEach(d=>d.r+=.35);drips=drips.filter(d=>d.r<6);
  if(ph==='sel'){if(g.auto){pick=[ri(4),ri(4)];start();return;}selT--;const h=A.hit(cur);if(h.l){pick[cur]=(pick[cur]+3)%4;S('blip');}if(h.r){pick[cur]=(pick[cur]+1)%4;S('blip');}if(h.a||selT<=0){S('coin');selT=600;if(A.cpu){pick[1]=ri(4);start();}else if(cur===0)cur=1;else start();}return;}
  if(hs>0){hs--;return;}
  if(ph==='ko'){koT++;if(koT<70&&koT%2)return;for(const q of f){q.vy+=.3;q.y+=q.vy;if(q.y>GY){q.y=GY;q.vy=0;}if(q.kd>9000)q.x=cl(q.x-q.d*(q.y<GY?1.6:0),16,W-16);if(q.lag>q.hp)q.lag-=.8;if(q.kd<9000&&koT>60)q.win=1;}
   if(mt===0){if(rw[0]>=2||rw[1]>=2)g.over=A.win(rw[0]>=2?0:1);else start();}return;}
  if(mt>45){f.forEach(q=>{q.d=q.x<f[1-f.indexOf(q)].x?1:-1;});return;}
  time--;if(A.cpu)A.bot(brain(1));if(g.auto)A._set(0,brain(0));
  for(let i=0;i<2;i++){const q=f[i],o=f[1-i],k=A.in(i),h=A.hit(i),ch=q.ch;if(q.lag>q.hp)q.lag=Math.max(q.hp,q.lag-.6);if(q.cT>0)q.cT--;else q.combo=0;if(q.fl)q.fl--;if(q.cd>0)q.cd--;
   const air=q.y<GY;q.vy+=.3;q.y+=q.vy;if(air)q.x=cl(q.x+q.jx,20,W-20);if(q.y>=GY){if(air&&q.vy>2){fx.spark(q.x,GY,'#9ab8ff',5,1.3);if(q.act==='air')q.act='';}q.y=GY;q.vy=0;}
   if(q.kd>0){q.kd--;q.x=cl(q.x-q.d*(q.kd>36?1.4:0),20,W-20);q.act='';q.blk=q.cr=false;q.ws=0;if(!q.kd)q.st=0;continue;}
   if(q.st>0){q.st--;q.x=cl(q.x-q.d*1.2,20,W-20);q.act='';q.blk=q.cr=false;q.ws=0;continue;}
   if(q.y>=GY&&!q.act)q.d=q.x<o.x?1:-1;const gr=q.y>=GY;q.cr=!!k.d&&gr&&!q.act;q.blk=ax(k)===-q.d&&gr&&(!q.act);
   if(q.act){q.at++;const m=AT[q.act];if(q.act==='spec'&&q.at===m.on){const P=PJ[ch.sh];proj.push({x:q.x+q.d*22,y:GY+P.y,vx:q.d*P.v,o:i,c:ch.c,sh:ch.sh,low:P.low,t:0,a:0});S('shoot');fx.spark(q.x+q.d*20,GY+P.y,ch.c,8,2);}
    else if(m.rng&&!q.done&&q.at>=m.on&&q.at<=m.on+(q.act==='air'?14:2)){const s=ch.big||1,dx=(o.x-q.x)*q.d,hy=q.y+m.hy*s,top=o.y-(o.cr?40:62),okY=q.act==='sweep'?o.y>=GY-3:hy>top-6&&hy<o.y+4;if(dx>-6&&dx<m.rng*s&&okY&&!o.kd){q.done=1;land(q,o,m,q.x+q.d*Math.min(dx,m.rng*s*.8),hy);}}
    if(q.act!=='air'&&q.at>m.end){q.act='';q.at=0;}q.ws=0;}
   else{const mv=gr&&!q.blk&&!q.cr?ax(k):0;q.x=cl(q.x+mv*ch.sp,20,W-20);q.ws=mv?q.ws+.28:0;
    if(k.u&&gr){q.vy=-6.6;q.jx=ax(k)*ch.sp*.85;S('jump');fx.spark(q.x,GY,'#9ab8ff',4,1);}
    else if(h.a&&k.d&&gr&&q.cd===0){q.cd=90;q.act='spec';q.at=0;q.done=0;}
    else if((h.a||h.b)&&!gr){q.act='air';q.at=0;q.done=0;S('blip');}
    else if(h.b&&k.d&&gr){q.act='sweep';q.at=0;q.done=0;S('blip');}
    else if(h.a&&!q.blk){q.act='punch';q.at=0;q.done=0;S('blip');}
    else if(h.b&&!q.blk){q.act='kick';q.at=0;q.done=0;S('blip');}}}
  if(Math.abs(f[0].x-f[1].x)<22&&Math.abs(f[0].y-f[1].y)<40){const m=(f[0].x+f[1].x)/2,d=f[0].x<f[1].x?1:-1;f[0].x=cl(m-11*d,20,W-20);f[1].x=cl(m+11*d,20,W-20);}
  for(const p of proj){p.x+=p.vx;p.t++;p.a+=p.vx*.08;if(p.sh==='rock'&&p.t%4===0)fx.debris(p.x,GY-2,'#8a6a4a',1,1);const o=f[1-p.o],top=o.y-(o.cr?36:62);if(!o.kd&&Math.abs(p.x-o.x)<14&&p.y>top&&p.y<o.y+4){p.dead=1;if(o.blk&&o.y>=GY){o.hp-=2;S('blip');fx.spark(p.x,p.y,'#bfe8ff',8,2);}else{const q=f[p.o];land(q,o,{dmg:12,stun:16,hs:7,kd:p.low?1:0},p.x,p.y);}}
   for(const p2 of proj)if(p2!==p&&p2.o!==p.o&&!p2.dead&&Math.abs(p2.x-p.x)<12&&Math.abs(p2.y-p.y)<30){p.dead=p2.dead=1;fx.spark(p.x,p.y,'#ffffff',14,3);fx.ring(p.x,p.y,'#ffffff',20,14);S('hit');hs=Math.max(hs,4);}if(p.x<-20||p.x>W+20)p.dead=1;}proj=proj.filter(p=>!p.dead);
  for(let i=0;i<2;i++)if(f[i].hp<=0){ko(i);return;}
  if(time<=0){const w=f[0].hp>f[1].hp?0:f[0].hp<f[1].hp?1:-1;if(w>=0){rw[w]++;f[1-w].kd=9999;f[1-w].vy=-2;}else rw[0]++;ph='ko';msg='TIME!';mt=150;koT=0;S('lose');}};
 /* ---- figure: two-bone limbs solved per pose, suit colour + neon seam ---- */
 const ik=(x0,y0,x1,y1,a,b,bend)=>{const dx=x1-x0,dy=y1-y0;let d=cl(Math.hypot(dx,dy),Math.abs(a-b)+.01,a+b-.01);const base=Math.atan2(dy,dx),off=Math.acos(cl((a*a+d*d-b*b)/(2*a*d),-1,1)),an=base+off*bend;return[x0+Math.cos(an)*a,y0+Math.sin(an)*a];};
 const pose=q=>{const b=Math.sin(A.t*.09+q.ch.sp)*1.1;let P={hip:[0,-30],nk:[2,-54+b],h1:[13,-45+b],h2:[7,-41+b],f1:[9,0],f2:[-9,0]};
  if(q.win)return{hip:[0,-30],nk:[1,-55],h1:[5,-77+Math.sin(A.t*.2)*2],h2:[-7,-36],f1:[10,0],f2:[-9,0]};
  if(q.kd>0){if(q.y<GY-1)return{hip:[0,-26],nk:[-20,-36],h1:[-26,-44],h2:[-14,-30],f1:[14,-20],f2:[8,-12]};return{hip:[0,-5],nk:[-24,-6],h1:[-30,-2],h2:[-18,-1],f1:[20,0],f2:[15,-1],lie:1};}
  if(q.st>0)return{hip:[-2,-30],nk:[-8,-51],h1:[-2,-40],h2:[-12,-44],f1:[9,0],f2:[-10,0]};
  if(q.y<GY-1&&q.act!=='air')return{hip:[0,-32],nk:[1,-56],h1:[12,-52],h2:[-4,-46],f1:[9,-14],f2:[-6,-10]};
  if(q.cr)P={hip:[0,-18],nk:[5,-40+b*.5],h1:[13,-34],h2:[9,-30],f1:[11,0],f2:[-10,0]};
  if(q.blk){P.h1=q.cr?[12,-36]:[10,-50];P.h2=q.cr?[10,-32]:[8,-46];P.nk[0]-=2;}
  if(q.ws){const s=Math.sin(q.ws);P.f1=[9+s*7,s>0?-s*3:0];P.f2=[-9-s*7,s<0?s*3:0];}
  if(q.act){const m=AT[q.act],e=q.at<m.on?q.at/m.on:Math.max(0,1-(q.at-m.on)/Math.max(1,(q.act==='air'?14:m.end-m.on)));
   if(q.act==='punch'){P.h1=[10+20*e,-47];P.nk=[3+3*e,-54];P.f1=[11,0];P.f2=[-10,0];}
   if(q.act==='kick'){P.f1=[6+28*e,-8-26*e];P.nk=[-5*e,-53];P.h2=[-6,-44];}
   if(q.act==='sweep')P={hip:[-2,-15],nk:[-4,-36],h1:[-8,-10],h2:[4,-12],f1:[8+28*e,-3],f2:[-10,0]};
   if(q.act==='air')P={hip:[0,-32],nk:[-3,-55],h1:[8,-48],h2:[-6,-46],f1:[10+20*e,-18+4*e],f2:[-6,-12]};
   if(q.act==='spec'){P.h1=[10+18*e,-46];P.h2=[8+18*e,-42];P.f1=[13,0];P.f2=[-13,0];P.nk=[4*e,-53];}}
  return P;};
 const fig=(q,ref)=>{const P=pose(q),ch=q.ch,d=q.d,s=(ch.big||1)*1.12,c=A.c,ox=q.x,oy=q.y,wh=q.fl%3===1,col=v=>wh?'#ffffff':v,suit=col(ch.c2),dark=col(A.mix(ch.c2,'#05030c',.45)),neon=col(ch.c),skin=col(ch.sk),OL='#06040e';
  const px=v=>ox+v[0]*d*s,py=v=>oy+v[1]*s,pt=v=>[px(v),py(v)];c.lineCap='round';c.lineJoin='round';
  const seg=(a,b,cl_,w)=>{c.strokeStyle=cl_;c.lineWidth=w;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();};
  const limb=(r,t,la,lb,bend,w1,w2,back,end,er,boot)=>{const j=ik(r[0],r[1],t[0],t[1],la,lb,bend),R0=pt(r),J=pt(j),T0=pt(t),sc_=back?dark:suit;
   seg(R0,J,OL,w1*s+2);seg(J,T0,OL,w2*s+2);seg(R0,J,sc_,w1*s);seg(J,T0,sc_,w2*s);c.globalAlpha=back?.12:.22;seg([R0[0]-.6,R0[1]-.8],[J[0]-.6,J[1]-.8],'#ffffff',w1*s*.35);c.globalAlpha=1;
   seg(R0,J,back?X.rgba(ch.c,.5):neon,1);seg(J,T0,back?X.rgba(ch.c,.5):neon,1);X.disc(J[0],J[1],w2*s*.42,back?X.rgba(ch.c,.4):neon);
   if(boot){const bx=T0[0]+d*2.5*s;X.ell(bx,T0[1]-1*s,5*s+1,3*s+1,OL);X.ell(bx,T0[1]-1*s,5*s,3*s,back?dark:col('#141020'));c.fillStyle=back?X.rgba(ch.c,.5):neon;c.fillRect(Math.min(bx-d*4*s,bx+d*4*s),T0[1]+.6*s,8*s,1);}
   else{X.disc(T0[0],T0[1],er*s+1,OL);X.orb(T0[0],T0[1],er*s,back?A.mix(ch.c,'#000000',.4):end);}return T0;};
  if(!ref)X.shadow(ox,GY+1,17*s*Math.max(.4,1-(GY-oy)/110),3.8,.55);
  const hip=P.hip,nk=P.nk,sh=[nk[0]*.9+hip[0]*.1,nk[1]+4],hd=[nk[0]+1,nk[1]-8.5];
  if(P.lie){limb(hip,P.f2,15,15,-1,7,6,1,0,0,1);seg(pt(hip),pt(nk),OL,13*s);seg(pt(hip),pt(nk),suit,11*s);seg(pt(hip),pt(nk),neon,1.2);limb(hip,P.f1,15,15,-1,7,6,0,0,0,1);const Hh=pt(hd);X.disc(px(nk)-d*5*s,py(nk)-1,6.5*s+1,OL);X.disc(px(nk)-d*5*s,py(nk)-1,6.5*s,skin);return;}
  if(ch.n==='MOSS'){const sw=Math.sin(A.t*.1)*3;X.poly([pt([sh[0]-2,sh[1]-3]),pt([-16+sw,hip[1]+18]),pt([-5+sw,hip[1]+22]),pt([hip[0]+2,hip[1]])],col('#1a4422'));X.stroke([pt([sh[0]-2,sh[1]-3]),pt([-16+sw,hip[1]+18]),pt([-5+sw,hip[1]+22])],X.rgba(ch.c,.7),1);}
  if(ch.n==='SABLE'){const sw=Math.sin(A.t*.14)*3;X.stroke([pt([sh[0],sh[1]]),pt([-12,sh[1]+2+sw]),pt([-24,sh[1]+7-sw])],OL,4.4*s);X.stroke([pt([sh[0],sh[1]]),pt([-12,sh[1]+2+sw]),pt([-24,sh[1]+7-sw])],col('#ff4f9a'),2.8*s);}
  limb(sh,P.h2,11,11,1,5.6,5,1,0,3.6);limb(hip,P.f2,15,15,-1,7.5,6.5,1,0,0,1);
  const sw_=(ch.n==='BRICK'?10:7.5)*s,ww=5.5*s,S0=pt(sh),Hp=pt(hip),ang=Math.atan2(S0[1]-Hp[1],S0[0]-Hp[0])+1.5708,cx_=Math.cos(ang),cy_=Math.sin(ang);
  const tor=[[S0[0]+cx_*sw_,S0[1]+cy_*sw_],[S0[0]-cx_*sw_,S0[1]-cy_*sw_],[Hp[0]-cx_*ww,Hp[1]-cy_*ww],[Hp[0]+cx_*ww,Hp[1]+cy_*ww]];
  X.polys(tor,OL,3);X.poly(tor,X.lg(S0[0],S0[1],Hp[0],Hp[1],[A.mix(ch.c2,'#ffffff',.18),suit,dark]));
  seg([S0[0]+cx_*sw_*.6,S0[1]+cy_*sw_*.6],[Hp[0],Hp[1]-3*s],neon,1.1);seg([S0[0]-cx_*sw_*.6,S0[1]-cy_*sw_*.6],[Hp[0],Hp[1]-3*s],neon,1.1);X.disc((S0[0]+Hp[0])/2,(S0[1]+Hp[1])/2-2,1.8*s,neon);if(lo()&&!ref)X.glow((S0[0]+Hp[0])/2,(S0[1]+Hp[1])/2-2,6,ch.c,.6);
  X.rr(Hp[0]-6*s,Hp[1]-2.4*s,12*s,3.4*s,1,OL);X.rr(Hp[0]-5.5*s,Hp[1]-2*s,11*s,2.6*s,1,neon);
  if(ch.n==='BRICK'){X.disc(S0[0]+d*2,S0[1],6.4*s+1,OL);X.orb(S0[0]+d*2,S0[1],6.4*s,col(ch.c));}
  limb(hip,P.f1,15,15,-1,7.5,6.5,0,0,0,1);
  const H0=pt(hd),R_=6.6*s;X.rr(px(nk)-2*s,py(nk)-4*s,4*s,6*s,1,skin);X.disc(H0[0],H0[1],R_+1.2,OL);X.disc(H0[0],H0[1],R_,X.rg(H0[0]-d*2,H0[1]-2,1,H0[0],H0[1],R_,[col(A.mix(ch.sk,'#ffffff',.25)),skin,col(A.mix(ch.sk,'#000000',.3))]));c.fillStyle=col(ch.hair);
  if(ch.n==='VOLTA'){const sp=[[H0[0]-d*6,H0[1]-1],[H0[0]-d*14,H0[1]-10],[H0[0]-d*4,H0[1]-7],[H0[0]-d*6,H0[1]-15],[H0[0]+d*1,H0[1]-8],[H0[0]+d*5,H0[1]-12],[H0[0]+d*6,H0[1]-4]];X.polys(sp,OL,2);X.poly(sp,col(ch.hair));}
  else if(ch.n==='BRICK'){c.beginPath();c.arc(H0[0],H0[1]-1,R_,Math.PI*1.05,Math.PI*1.95);c.fill();X.rr(H0[0]-R_,H0[1]-4*s,R_*2,2.6*s,1,neon);X.stroke([[H0[0]-d*R_,H0[1]-3*s],[H0[0]-d*(R_+7),H0[1]+1+Math.sin(A.t*.2)*2],[H0[0]-d*(R_+11),H0[1]+4-Math.sin(A.t*.2)*2]],neon,1.6);}
  else if(ch.n==='SABLE'){c.beginPath();c.arc(H0[0],H0[1]-1,R_+.4,Math.PI*1.0,Math.PI*2.0);c.fill();const sw=Math.sin(A.t*.12)*2;X.stroke([[H0[0]-d*5,H0[1]-3],[H0[0]-d*12,H0[1]+2+sw],[H0[0]-d*16,H0[1]+11-sw]],OL,4.6);X.stroke([[H0[0]-d*5,H0[1]-3],[H0[0]-d*12,H0[1]+2+sw],[H0[0]-d*16,H0[1]+11-sw]],col(ch.hair),3.2);}
  else{c.fillStyle=col('#2a5a2a');c.beginPath();c.arc(H0[0]-d*.5,H0[1]-.5,R_+1.4,Math.PI*.9,Math.PI*2.1);c.fill();X.poly([[H0[0]-d*7,H0[1]-1],[H0[0]-d*10,H0[1]+7],[H0[0]-d*4,H0[1]+4]],col('#2a5a2a'));X.stroke([[H0[0]-d*(R_+1),H0[1]+1],[H0[0]-d*.5,H0[1]-R_-1.5],[H0[0]+d*(R_+1),H0[1]]],X.rgba(ch.c,.7),.8);}
  const ex=H0[0]+d*3*s,ey=H0[1]-1;if(ch.n==='SABLE'||ch.n==='VOLTA'){X.rr(Math.min(ex-d*1.5,ex+d*5)-.5,ey-1.4,6.5,2.8,1,neon);X.disc(ex+d*3,ey-.4,.7,'#ffffff');if(lo()&&!ref)X.glow(ex+d*2,ey,7,ch.c,.6);}else{X.disc(ex,ey,1.1,ch.n==='MOSS'?neon:'#1a1a1a');if(ch.n==='MOSS'&&lo()&&!ref)X.glow(ex,ey,5,ch.c,.6);}
  const er=ch.n==='BRICK'?4.8:3.8,F=limb(sh,P.h1,11,11,1,5.6,5,0,neon,er);
  if(ch.n==='SABLE')X.stroke([[F[0]-d*2,F[1]+3],[F[0]-d*13,F[1]+5]],col('#f0f0ff'),1.5);
  if(!ref&&lo()&&((q.act==='punch'||q.act==='spec')&&q.at>=AT[q.act].on-2||!q.cd&&ch.n==='VOLTA'&&A.t%20<6))X.glow(F[0],F[1],q.act?13:7,ch.c,.7);
  if(!ref&&ch.n==='VOLTA'&&!q.cd&&A.t%9<3){c.strokeStyle='#e8ffff';c.lineWidth=.8;c.beginPath();c.moveTo(F[0],F[1]);for(let k=1;k<4;k++)c.lineTo(F[0]+rnd(10)-5,F[1]+rnd(10)-5);c.stroke();}
  if(!ref&&(q.act==='kick'||q.act==='air'||q.act==='sweep')&&q.at>=AT[q.act].on-1&&q.at<=AT[q.act].on+3){const t=pt(P.f1);if(lo())X.glow(t[0],t[1],12,ch.c,.6);}};
 /* ---- projectiles ---- */
 const shot=p=>{const c=A.c,x=p.x,y=p.y,d=Math.sign(p.vx);
  if(p.sh==='bolt'){for(let i=1;i<5;i++){c.globalAlpha=.25-i*.05;X.disc(x-d*i*6,y,6-i,'#2fe8d0');}c.globalAlpha=1;if(lo())X.glow(x,y,20,'#2fe8d0',.8);X.orb(x,y,6,'#7ffff0');X.disc(x,y,2.6,'#ffffff');c.strokeStyle='#e8ffff';c.lineWidth=1;for(let k=0;k<3;k++){const a=rnd(6.28);c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*6+rnd(4)-2,y+Math.sin(a)*6+rnd(4)-2);c.lineTo(x+Math.cos(a)*11,y+Math.sin(a)*11);c.stroke();}}
  else if(p.sh==='rock'){X.shadow(x,GY+1,9,2,.45);c.save();c.translate(x,y);c.rotate(p.a);X.poly([[-8,-2],[-5,-7],[2,-8],[8,-3],[7,4],[1,8],[-6,6]],X.lg(-8,-8,8,8,['#c89a6a','#8a6040','#4a3020']));X.poly([[-5,-7],[2,-8],[0,-3],[-4,-2]],'rgba(255,230,190,.35)');c.strokeStyle='rgba(255,152,56,.8)';c.lineWidth=1;c.beginPath();c.moveTo(-3,-3);c.lineTo(1,0);c.lineTo(0,5);c.stroke();c.restore();if(lo())X.glow(x,y,12,'#ff9838',.35);}
  else if(p.sh==='blade'){for(let i=0;i<3;i++){c.globalAlpha=.5-i*.15;c.save();c.translate(x-d*i*7,y);c.rotate(p.a*1.6-i*.4);c.strokeStyle=i?'#ff4f9a':'#ffffff';c.lineWidth=i?2.5:1.6;c.beginPath();c.arc(0,0,8,-.9,.9);c.stroke();c.restore();}c.globalAlpha=1;if(lo())X.glow(x,y,14,'#ff4f9a',.7);c.save();c.translate(x,y);c.rotate(p.a*1.6);c.strokeStyle='#ff4f9a';c.lineWidth=3;c.beginPath();c.arc(0,0,8,-.9,.9);c.stroke();c.strokeStyle='#ffffff';c.lineWidth=1.2;c.beginPath();c.arc(0,0,8,-.8,.8);c.stroke();c.restore();}
  else{for(let i=0;i<7;i++){const tx=x-d*i*6,hh=(10-i*1.2)*(.7+.3*Math.sin(p.t*.5+i)),lean=d*2;if(hh<=1)continue;X.poly([[tx-3,GY],[tx+lean,GY-hh],[tx+3,GY]],X.lg(0,GY-hh,0,GY,['#c8ff9a','#3aa84a','#1a5a24']));if(i%2===0)X.ell(tx+d*3,GY-hh*.6,2.4,1.2,'#6af07a',d*.5);}if(lo())X.glow(x,GY-6,14,'#6af07a',.5);}};
 /* ---- rooftop stage, cached ---- */
 const stage=()=>{const c=A.c;X.sky(['#07041a','#1a0b3a','#4a1550','#8a2a5a'],176);X.stars(40,9,0,0,90,.5);X.glow(250,40,46,'#e8d8ff',.18);X.disc(250,40,13,X.rg(246,36,1,250,40,13,['#fff8f0','#d8c8f0','#a898d0']));
  for(let i=0;i<24;i++){const x=i*15-6,h=30+((i*53)%40);X.vg(x,150-h,14,h+30,['#2a1a4a','#1a1034']);for(let wy=150-h+4;wy<150;wy+=5)for(let wx=x+2;wx<x+12;wx+=4)if(((wx*7+wy*3+i)%9)<2){c.fillStyle=(i%3)?'#ffcf6a':'#8ae8ff';c.globalAlpha=.55;c.fillRect(wx,wy,2,2);c.globalAlpha=1;}}
  const BL=[[0,46,64,'#140a26'],[56,70,40,'#180c2c'],[104,30,52,'#120824'],[186,56,46,'#160a2a'],[236,84,30,'#120824'],[268,40,60,'#150a28']];BL.forEach(([x,y,w,cc],i)=>{X.vg(x,y,w,170-y,[cc,'#0a0618']);c.fillStyle='rgba(255,255,255,.05)';c.fillRect(x,y,w,1.5);for(let wy=y+6;wy<160;wy+=8)for(let wx=x+4;wx<x+w-4;wx+=7)if(((wx*13+wy*7+i*5)%11)<4){c.fillStyle=((wx+wy)%3)?'rgba(255,200,120,.7)':'rgba(120,220,255,.6)';c.fillRect(wx,wy,3,4);}});
  X.rr(112,46,40,50,2,X.lg(112,46,152,96,['#2a0a3a','#5a1a6a']));X.rrs(112.5,46.5,39,49,2,'rgba(255,79,154,.8)',1);X.glow(132,70,40,'#ff4f9a',.2);c.fillStyle='rgba(255,180,220,.55)';c.beginPath();c.arc(132,64,8,0,6.283);c.fill();X.poly([[120,94],[124,76],[140,76],[144,94]],'rgba(255,180,220,.45)');for(let y=48;y<96;y+=3){c.fillStyle='rgba(0,0,0,.18)';c.fillRect(113,y,38,1);}
  X.rr(10,60,14,64,2,'#0a0614');for(const[t,i]of[['A',0],['R',1],['C',2],['A',3],['D',4],['E',5]])X.ot(t,17,64+i*10,'#2fe8d0',1,'c');X.glow(17,92,26,'#2fe8d0',.25);
  X.rr(196,92,40,13,2,'#0a0614');X.ot('RAMEN',216,95,'#ffcf3f',1,'c');X.glow(216,98,24,'#ff9838',.22);
  X.rr(272,110,44,13,2,'#0a0614');X.ot('HOTEL',294,113,'#ff4f6d',1,'c');X.glow(294,116,24,'#ff4f6d',.2);
  for(const lx of[262,302]){X.stroke([[lx,148],[lx-6,104]],'#2a2038',3);}X.vg(248,74,64,34,['#5a4a6a','#3a2c48']);X.ell(280,74,32,6,'#6a5a7a');c.fillStyle='rgba(0,0,0,.25)';for(let x=252;x<312;x+=6)c.fillRect(x,76,1,32);X.poly([[246,74],[280,58],[314,74]],'#4a3a58');X.stroke([[280,58],[280,44]],'#3a2c48',1.5);
  X.vg(0,148,W,26,['#3a3048','#241c30']);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(0,148,W,1.5);c.fillStyle='rgba(0,0,0,.3)';for(let x=0;x<W;x+=26)c.fillRect(x,149,1,25);
  for(const[ax_,aw]of[[48,34],[150,26]]){X.block(ax_,132,aw,18,'#5a5a6e',2);c.fillStyle='rgba(0,0,0,.4)';for(let y=136;y<148;y+=3)c.fillRect(ax_+3,y,aw-6,1.2);X.disc(ax_+aw-8,141,5,'#2a2a38');X.disc(ax_+aw-8,141,1.2,'#8a8aa0');}
  X.rr(0,144,W,3,1,'#2fe8d0');X.glow(160,146,180,'#2fe8d0',.1);
  X.vg(0,174,W,H-174,['#221a36','#120e22','#0a0816']);c.strokeStyle='rgba(140,120,200,.14)';c.lineWidth=1;for(let i=-12;i<=12;i++){c.beginPath();c.moveTo(160+i*20,174);c.lineTo(160+i*58,H);c.stroke();}for(const y of[180,188,199,213,231]){c.fillStyle='rgba(140,120,200,.1)';c.fillRect(0,y,W,1);}
  c.globalCompositeOperation='lighter';for(const[x,cc,w]of[[17,'#2fe8d0',10],[132,'#ff4f9a',26],[216,'#ff9838',20],[294,'#ff4f6d',22]]){c.fillStyle=X.lg(0,176,0,H,[X.rgba(cc,.22),X.rgba(cc,0)]);c.fillRect(x-w/2,176,w,H-176);}c.fillStyle=X.lg(0,174,0,186,['rgba(47,232,208,.18)','rgba(47,232,208,0)']);c.fillRect(0,174,W,12);c.globalCompositeOperation='source-over';
  for(const[x,y,rx]of[[70,222,26],[246,214,20],[150,234,30]]){X.ell(x,y,rx,3.5,'rgba(160,140,255,.10)');X.ell(x-rx*.3,y-.8,rx*.4,1,'rgba(255,255,255,.12)');}
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,174,W,2);X.vignette(.4);};
 const dyn=()=>{const c=A.c;if(lo()){const a=Math.sin(A.t*.01)*.6;c.globalCompositeOperation='lighter';X.poly([[70,150],[74,150],[72+Math.sin(a)*240+30,0],[72+Math.sin(a)*240-30,0]],'rgba(200,220,255,.05)');c.globalCompositeOperation='source-over';}
  const fl=(A.t%173<5)||(A.t%61<2);if(fl){c.fillStyle='rgba(10,6,20,.75)';c.fillRect(198,94,36,9);}
  if(A.t%50<25){X.disc(280,44,1.6,'#ff3040');if(lo())X.glow(280,44,7,'#ff3040',.8);}
  steam.forEach(s=>X.disc(s.x,s.y,s.r,'rgba(200,190,230,'+s.a.toFixed(3)+')'));
  if(bolt>0){c.fillStyle='rgba(220,210,255,'+(bolt/9*.35).toFixed(2)+')';c.fillRect(0,0,W,174);}};
 const rainDraw=(z)=>{const c=A.c;c.strokeStyle=z?'rgba(190,200,255,.35)':'rgba(170,180,240,.18)';c.lineWidth=z?1.1:.7;c.beginPath();rain.forEach(r=>{if(r.z!==z)return;c.moveTo(r.x,r.y);c.lineTo(r.x+2,r.y-(z?9:6));});c.stroke();if(!z)drips.forEach(d=>{c.strokeStyle='rgba(190,200,255,'+(.4-d.r*.06).toFixed(2)+')';c.beginPath();c.ellipse(d.x,d.y,d.r,d.r*.3,0,0,6.283);c.stroke();});};
 /* ---- HUD ---- */
 const hud=()=>{const c=A.c;f.forEach((q,i)=>{const r=i===1,x0=r?W-138:10,w=128,sl=8,pts=r?[[x0+sl,10],[x0+w,10],[x0+w,22],[x0,22]]:[[x0,10],[x0+w-sl,10],[x0+w,22],[x0,22]];
   X.poly(pts.map(p=>[p[0]+(r?1:-1),p[1]-1]).concat([]),'rgba(0,0,0,.6)');X.poly(pts,'#140c24');c.save();c.beginPath();pts.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip();
   const lw=w*q.lag/100,hw=w*Math.max(0,q.hp)/100;c.fillStyle='#ffffff';c.globalAlpha=.85;c.fillRect(r?x0+w-lw:x0,10,lw,12);c.globalAlpha=1;c.fillStyle=X.lg(0,10,0,22,[X.lt(q.ch.c,1.4),q.ch.c,X.lt(q.ch.c,.55)]);c.fillRect(r?x0+w-hw:x0,10,hw,12);if(q.hp<30&&A.t%20<10){c.fillStyle='rgba(255,40,60,.35)';c.fillRect(x0,10,w,12);}c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x0,11,w,2);c.restore();
   c.strokeStyle=X.rgba(q.ch.c,.9);c.lineWidth=1;c.beginPath();pts.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.stroke();
   X.ot(q.ch.n,r?W-10:10,26,q.ch.c,1,r?'r':'l');X.ot(A.nm(i),r?W-10:10,1,'#fff3d6',1,r?'r':'l');
   for(let k=0;k<2;k++){const px_=r?W-60-k*10:60+k*10;X.poly([[px_,27],[px_+3.5,30.5],[px_,34],[px_-3.5,30.5]],rw[i]>k?'#ffcf3f':'rgba(255,255,255,.15)');if(rw[i]>k&&lo())X.glow(px_,30.5,7,'#ffcf3f',.6);}
   const sp=1-q.cd/90,sx=r?W-10-50:10;X.rr(sx,36,50,4,2,'rgba(0,0,0,.55)');X.rr(sx+(r?50*(1-sp):0),36,50*sp,4,2,sp>=1?(A.t%16<8?'#ffffff':q.ch.c):X.rgba(q.ch.c,.6));
   if(q.combo>1&&q.cT>0){const a=Math.min(1,q.cT/20);c.globalAlpha=a;X.ot(q.combo+' HITS',r?W-14:14,50,'#ffcf3f',2,r?'r':'l');X.ot('COMBO!',r?W-14:14,64,q.ch.c,1,r?'r':'l');c.globalAlpha=1;}});
  X.poly([[146,6],[174,6],[180,16],[174,28],[146,28],[140,16]],'#140c24');X.polys([[146,6],[174,6],[180,16],[174,28],[146,28],[140,16]],'#ffcf3f',1);const tl=Math.ceil(time/60);X.ot(tl,160,10,tl<=10&&A.t%30<15?'#ff4f6d':'#fff3d6',2,'c');};
 const banner=(txt,col,sc,y)=>{const c=A.c;X.poly([[0,y-6],[W,y-14],[W,y+18],[0,y+26]],'rgba(8,4,20,.78)');c.fillStyle=X.rgba(col,.9);c.fillRect(0,y-7,W,1);c.fillRect(0,y+19,W,1);X.ot(txt,160,y,col,sc,'c');};
 /* ---- select screen ---- */
 const card=(i,x,y,sel,tg)=>{const ch=CH[i],c=A.c,w=66,h=128,bob=sel?Math.sin(A.t*.15)*1.5:0;X.rr(x,y+bob,w,h,5,X.lg(0,y,0,y+h,[sel?X.rgba(ch.c,.35):'rgba(40,30,70,.75)','rgba(10,6,24,.92)']));
  if(sel){X.rrs(x+.5,y+.5+bob,w-1,h-1,5,ch.c,2);if(lo())X.glow(x+w/2,y+h/2,60,ch.c,.18);}else X.rrs(x+.5,y+.5,w-1,h-1,5,'rgba(255,255,255,.18)',1);
  c.save();c.beginPath();c.rect(x+2,y+2+bob,w-4,h-26);c.clip();X.glow(x+w/2,y+70+bob,40,ch.c,.25);c.translate(x+w/2,y+102+bob);c.scale(1.12,1.12);c.translate(0,-GY);fig({ch,x:0,y:GY,d:1,act:sel&&A.t%120<20?'punch':'',at:(A.t%120)%20,cd:0,st:0,kd:0,cr:false,blk:false,ws:0,fl:0,win:0},true);c.restore();
  c.globalCompositeOperation='source-over';X.ot(ch.n,x+w/2,y+h-18+bob,sel?ch.c:'#c8c0e0',1,'c');if(tg)tg.forEach((t,k)=>{X.rr(x+4+k*30,y-11,26,10,2,t[1]);X.ot(t[0],x+17+k*30,y-10,'#140c24',1,'c');});};
 g.draw=()=>{const c=A.c;X.cache('nf_stage3',stage);dyn();rainDraw(false);
  if(ph==='sel'){c.fillStyle='rgba(6,4,16,.55)';c.fillRect(0,0,W,H);X.ot('CHOOSE YOUR FIGHTER',160,8,'#ffcf3f',2,'c');for(let i=0;i<4;i++){const tg=[];if(pick[0]===i)tg.push(['P1','#2fe8d0']);if(!A.cpu&&cur===1&&pick[1]===i)tg.push(['P2','#ff4f9a']);card(i,16+i*74,38,pick[cur]===i,tg);}
   const ch=CH[pick[cur]];X.panel(16,176,288,56,ch.c);X.ot((A.cpu?'':A.nm(cur)+': ')+ch.n+' - '+ch.tag,26,182,ch.c,1);T('SPEED',26,197,'#fff3d6',1);X.meter(72,197,90,5,ch.sp/3.2,ch.c);T('POWER',26,208,'#fff3d6',1);X.meter(72,208,90,5,ch.pw/1.4,ch.c);T('SPECIAL: '+ch.sn,26,220,'#c8c0e0',1);
   X.ot(Math.ceil(selT/60),286,196,selT<180&&A.t%20<10?'#ff4f6d':'#fff3d6',2,'c');T('TIME',286,214,'#c8c0e0',1,'c');T('LEFT/RIGHT PICK  A CONFIRM',160,28,'#c8c0e0',1,'c');rainDraw(true);return;}
  if(lo()){c.save();c.beginPath();c.rect(0,GY+1,W,H-GY);c.clip();c.translate(0,GY*2+2);c.scale(1,-1);c.globalAlpha=.2;f.forEach(q=>fig(q,true));c.restore();c.globalAlpha=1;}
  const ord=f[0].act&&!f[1].act?[1,0]:[0,1];ord.forEach(i=>fig(f[i],false));proj.forEach(shot);fx.draw();rainDraw(true);hud();
  if(ph==='fight'&&mt>45){const k=Math.min(1,(100-mt)/10);c.globalAlpha=k;banner(msg,'#fff3d6',3,104);c.globalAlpha=1;}
  else if(ph==='fight'&&mt>18){const k=(mt-18)/27;c.globalAlpha=Math.min(1,k*2);banner('FIGHT!','#ffcf3f',4,102);c.globalAlpha=1;}
  if(ph==='ko'){if(koT<4){c.fillStyle='rgba(255,255,255,.5)';c.fillRect(0,0,W,H);}banner(msg,msg==='TIME!'?'#ffcf3f':'#ff4f6d',msg.length>5?3:4,96);if(koT>60&&mt>0){const w=f[0].hp>f[1].hp?0:f[1].hp>f[0].hp?1:-1;const t_=w<0?'DRAW ROUND':A.nm(w)+' TAKES THE ROUND';X.rr(160-t_.length*3-8,128,t_.length*6+16,15,4,'rgba(8,4,20,.8)');X.ot(t_,160,132,w<0?'#fff3d6':f[w].ch.c,1,'c');}}};
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
 g.draw=()=>{const cx=p.x-160,cy=p.y-120,c=A.c;X.cache('roy_bg',()=>X.vg(0,0,W,H,['#3f9150','#327f42','#2a7038']));
  for(let i=Math.floor(cx/80)*80;i<cx+W;i+=80)if(((i/80)|0)%2===0&&i>=0&&i<MW){c.fillStyle='rgba(255,255,240,.035)';c.fillRect(i-cx,Math.max(0,-cy),80,Math.min(H,MH-cy)-Math.max(0,-cy));}
  for(let i=Math.floor(cx/40)*40;i<cx+W+40;i+=40)for(let j=Math.floor(cy/40)*40;j<cy+H+40;j+=40){if(i<0||j<0||i>=MW||j>=MH)continue;const k=(Math.imul(i/40|0,73856093)^Math.imul(j/40|0,19349663))>>>0,h=k%7,h2=(k>>5)%5,x=i-cx+((k>>9)%14)-7,y=j-cy+((k>>13)%14)-7;c.fillStyle='rgba(20,60,20,.18)';c.fillRect(x+(k>>3)%37,y+(k>>7)%37,1,2);c.fillRect(x+(k>>11)%37,y+(k>>15)%37,1,2);c.fillStyle='rgba(180,240,140,.12)';c.fillRect(x+(k>>17)%37,y+(k>>19)%37,1,2);if(h<2){c.fillStyle='rgba(0,30,0,.07)';c.fillRect(i-cx,j-cy,40,40);}
   if(h===3||h2===1){const bx=x+8+h2*5,by=y+22;X.stroke([[bx,by],[bx-2,by-6]],'#5aa858',1.2);X.stroke([[bx+2,by],[bx+2,by-8]],'#6ab860',1.2);X.stroke([[bx+4,by],[bx+6,by-5]],'#4a9a4a',1.2);}
   if(h===5){X.disc(x+24,y+26,1.6,'#ffe070');X.disc(x+28,y+24,1.4,'#ff8ab0');X.disc(x+21,y+23,1.3,'#ffffff');X.disc(x+24,y+26,.6,'#c07020');}
   if(h===6&&h2>2){X.ell(x+16,y+14,8,4,'rgba(110,80,40,.28)',.3);X.disc(x+14,y+13,1.2,'rgba(160,150,130,.6)');X.disc(x+19,y+15,.9,'rgba(160,150,130,.6)');}
   if(h2===4){c.fillStyle='rgba(255,255,200,.05)';c.fillRect(x+4,y+30,10,1);}}
  c.fillStyle='#163018';if(cx<0)c.fillRect(0,0,-cx,H);if(cy<0)c.fillRect(0,0,W,-cy);if(cx+W>MW)c.fillRect(MW-cx,0,W,H);if(cy+H>MH)c.fillRect(0,MH-cy,W,H);
  c.strokeStyle='#5a5048';c.lineWidth=4;c.strokeRect(-cx-2,-cy-2,MW+4,MH+4);c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=1;c.strokeRect(-cx-3.5,-cy-3.5,MW+7,MH+7);
  bots.forEach(b=>{if(b.hp<=0){const x=b.x-cx,y=b.y-cy;X.rr(x-5,y-4,10,8,2,'#6a5a3a');X.rr(x-5,y-4,10,2,1,'#8a7a50');}});
  cover.forEach(o=>{const x=o.x-cx,y=o.y-cy;if(x<-30||y<-30||x>W+30||y>H+30)return;X.shadow(x+3,y+4,o.r,o.r*.55,.3);if(o.k===0){X.orb(x,y,o.r,'#8a8a96');X.disc(x+o.r*.3,y+o.r*.2,o.r*.3,'rgba(0,0,0,.12)');X.ell(x-o.r*.15,y-o.r*.62,o.r*.45,o.r*.2,'rgba(90,150,60,.6)',-.2);A.line(x+o.r*.1,y+o.r*.05,x+o.r*.55,y+o.r*.4,'rgba(40,40,50,.35)',1);}else if(o.k===1){X.disc(x,y,o.r*.95,'#1e5a2a');for(let q=0;q<6;q++){const a=q*1.047+o.r;X.orb(x+Math.cos(a)*o.r*.48,y+Math.sin(a)*o.r*.48,o.r*.5,q%2?'#2f7f3a':'#3a9044',0);}X.orb(x-o.r*.12,y-o.r*.15,o.r*.5,'#4aa850',0);X.disc(x-o.r*.3,y-o.r*.35,o.r*.18,'rgba(200,255,160,.35)');if(o.r>18){X.disc(x+o.r*.3,y-o.r*.1,1.6,'#ff4a5a');X.disc(x-o.r*.1,y+o.r*.35,1.4,'#ff4a5a');}}else{const s=o.r*1.3;X.block(x-s/2,y-s/2,s,s,'#a87a40',2);A.line(x-s/2+2,y-s/2+2,x+s/2-2,y+s/2-2,'#6a4a20',1.5);A.line(x+s/2-2,y-s/2+2,x-s/2+2,y+s/2-2,'#6a4a20',1.5);}});
  const zx=MW/2-cx,zy=MH/2-cy;c.strokeStyle='rgba(120,60,220,.34)';c.lineWidth=600;c.beginPath();c.arc(zx,zy,zone+300,0,6.283);c.stroke();for(let k=0;k<3;k++){c.strokeStyle='rgba(170,110,255,'+(.08+k*.04)+')';c.lineWidth=2;c.beginPath();c.arc(zx,zy,zone+8+k*10+(A.t*.3)%10,0,6.283);c.stroke();}c.strokeStyle='rgba(200,150,255,.9)';c.lineWidth=2.5;c.beginPath();c.arc(zx,zy,zone,0,6.283);c.stroke();c.strokeStyle='rgba(200,150,255,.3)';c.lineWidth=7;c.stroke();
  bots.forEach(b=>{if(b.hp<=0)return;const x=b.x-cx,y=b.y-cy;if(x<-20||y<-20||x>W+20||y>H+20)return;trooper(x,y,b.a,b.c,b.hit>0,b.st);if(b.mf)X.glow(x+Math.cos(b.a)*14,y+Math.sin(b.a)*14,6,'#ffd080',.8);X.meter(x-8,y-14,16,3,b.hp/100,b.hp>40?K.g:K.r);});
  sh.forEach(s=>{const x=s.x-cx,y=s.y-cy;X.stroke([[x-s.vx*1.6,y-s.vy*1.6],[x,y]],s.o===-1?'#fff0a0':'#ffb060',1.6);X.glow(x,y,4,s.o===-1?'#ffe060':'#ff9040',.6);});
  const pa=Math.atan2(p.fy,p.fx);trooper(160,120,pa,'#2fe8d0',hurt>6,p.st);if(p.mf)X.glow(160+Math.cos(pa)*14,120+Math.sin(pa)*14,7,'#ffe080',.9);A.ring(160,120,11+Math.sin(A.t*.15),'rgba(47,232,208,.45)');
  fx.draw();X.cache('roy_light',()=>{X.rr(0,0,W,H,0,X.rg(40,0,10,60,30,300,['rgba(255,240,190,.10)','rgba(255,240,190,0)']));X.vignette(.42);});const out=Math.hypot(p.x-MW/2,p.y-MH/2)>zone;if(hurt){c.fillStyle='rgba(255,0,40,'+(hurt*.025)+')';c.fillRect(0,0,W,H);}
  X.panel(W-58,20,54,54,'#c896ff');const mm=50/MW;c.save();c.beginPath();c.rect(W-56,22,50,50);c.clip();c.fillStyle='rgba(120,60,220,.55)';c.fillRect(W-56,22,50,50);X.disc(W-56+MW/2*mm,22+MH/2*mm,zone*mm,'#2e7a3e');A.ring(W-56+MW/2*mm,22+MH/2*mm,zone*mm,'rgba(220,180,255,.9)');c.restore();X.glow(W-56+p.x*mm,22+p.y*mm,5,'#2fe8d0',.6);X.disc(W-56+p.x*mm,22+p.y*mm,1.8,'#2fe8d0');
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
 const bg=()=>{X.vg(0,0,W,H,['#1e2332','#151820']);const c=A.c;for(let j=18,r=0;j<H;j+=9,r++)for(let i=-(r%3)*5;i<W;i+=13){const k=(i*31+j*17+r*7)&15;X.rr(i+.5,j+.5,11+(k&3)*.4,8,2.2,k<3?'#2c3240':k<9?'#252a36':'#222631');c.fillStyle='rgba(255,255,255,.05)';c.fillRect(i+2,j+1,8,1);c.fillStyle='rgba(0,0,0,.2)';c.fillRect(i+2,j+7.5,8,1);}
  for(let i=0;i<5;i++){const x=(i*97+40)%W,y=30+(i*67)%190;X.ell(x,y,14+i%3*6,5+i%2*2,'rgba(30,60,30,.35)',i*.7);for(let q=0;q<6;q++)X.stroke([[x-8+q*3,y+2],[x-9+q*3+(q%2)*2,y-3]],'rgba(70,110,60,.5)',1);}
  X.vg(0,104,W,34,['#191b22','#1f2129','#17181e']);for(let i=0;i<260;i++){c.fillStyle=i%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.25)';c.fillRect((i*67)%W,105+(i*29)%32,1,1);}
  X.vg(0,101,W,4,['#4a4e5c','#2a2c36']);X.vg(0,137,W,4,['#4a4e5c','#2a2c36']);for(let i=6;i<W;i+=28){X.rr(i,120,14,2.2,1,'#d8c060');c.fillStyle='rgba(255,255,255,.3)';c.fillRect(i+1,120,12,.7);}
  A.line(40,112,70,128,'rgba(0,0,0,.4)',1);A.line(70,128,82,124,'rgba(0,0,0,.4)',1);A.line(220,108,236,116,'rgba(0,0,0,.4)',1);
  [[120,170,16],[250,60,12],[60,210,10]].forEach(([x,y,r])=>{X.ell(x,y,r,r*.4,'#10141e');X.ell(x-r*.2,y-r*.1,r*.5,r*.14,'rgba(170,190,255,.25)');X.ell(x+r*.3,y+r*.1,r*.15,r*.05,'rgba(255,255,255,.4)');});
  for(let i=0;i<6;i++){const x=(i*71+30)%W,y=40+(i*53)%160;X.shadow(x+2,y+6,15,6,.4);if(i%2){X.block(x-12,y-7,24,14,['#4a5a7a','#6a3a3a','#4a5a4a'][i%3],4);X.rr(x-8,y-5,8,10,2,X.lg(x-8,0,x,0,['#3a5068','#1a2430']));X.rr(x+2,y-5,7,10,2,'#1e2a36');c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x-7,y-4,2,8);X.disc(x+12,y-4,1.5,'#ffe0a0');X.disc(x+12,y+4,1.5,'#ffe0a0');X.glow(x+16,y-4,10,'#ffe0a0',.35);X.glow(x+16,y+4,10,'#ffe0a0',.35);X.disc(x-12,y-4,1.2,'#ff3030');X.disc(x-12,y+4,1.2,'#ff3030');}
   else{X.ell(x,y+8,10,3,'#2a2218');X.rr(x-7,y-10,14,18,6,X.lg(x-7,0,x+7,0,['#8a8a9a','#6a6a78','#44444e']));X.rr(x-7,y+4,14,4,1,'#3e3e48');A.line(x,y-6,x,y+1,'#2a2a34',1.5);A.line(x-3,y-4,x+3,y-4,'#2a2a34',1.5);X.ell(x-3,y-8,3,1.4,'rgba(80,130,60,.6)',-.3);X.ell(x+4,y+3,2,1,'rgba(80,130,60,.5)');}}
  [[10,90],[310,150]].forEach(([x,y])=>{X.disc(x,y,3,'#3a3e4a');X.glow(x,y+6,46,'#ffcf70',.22);X.ell(x,y+8,28,12,'rgba(255,210,120,.06)');});};
 const mist=()=>{if(A.gfx!=='high')return;for(let i=0;i<5;i++){const x=((A.t*.25*(1+i%3*.4)+i*90)%(W+120))-60,y=40+i*44+Math.sin(A.t*.01+i)*8;X.glow(x,y,50+i%2*20,'#8a9ac0',.07);}};
 g.draw=()=>{X.cache('zomb_bg2',bg);const c=A.c;splat.forEach(s=>{X.ell(s.x,s.y,s.r,s.r*.6,'rgba(70,110,40,.45)',s.a);X.disc(s.x+s.r*.6,s.y-1,s.r*.25,'rgba(70,110,40,.45)');});
  z.forEach(e=>{const r=e.big?12:7,a=Math.atan2(p.y-e.y,p.x-e.x),wb=Math.sin(A.t*.15+e.ph)*.25,col=e.hit?'#ffffff':e.big?'#4a6a2a':'#6a9a44';X.shadow(e.x+1,e.y+3,r,r*.5,.35);c.save();c.translate(e.x,e.y);c.rotate(a+wb);
   X.stroke([[0,-r*.6],[r*1.3,-r*.5+Math.sin(A.t*.2+e.ph)]],col,r*.35);X.stroke([[0,r*.6],[r*1.3,r*.5-Math.sin(A.t*.2+e.ph)]],col,r*.35);X.ell(0,0,r*.6,r*.85,e.hit?'#ffffff':e.big?'#3a3a4a':'#5a4a6a');X.orb(r*.2,0,r*.55,col);X.disc(r*.55,-r*.22,r*.13,'#ff3030');X.disc(r*.55,r*.22,r*.13,'#ff3030');c.restore();});
  sh.forEach(s=>{X.stroke([[s.x-s.vx*1.5,s.y-s.vy*1.5],[s.x,s.y]],'#fff0a0',1.8);});
  const pa=Math.atan2(p.fy,p.fx);trooper(p.x,p.y,pa,'#2fe8d0',hurt>6,p.st);mist();
  const gl=c.globalCompositeOperation;c.fillStyle=X.rg(p.x,p.y,30,p.x,p.y,170,['rgba(0,0,10,0)','rgba(0,0,10,.55)','rgba(0,0,10,.8)']);c.fillRect(0,0,W,H);
  c.globalCompositeOperation='lighter';X.poly([[p.x+Math.cos(pa)*8,p.y+Math.sin(pa)*8],[p.x+Math.cos(pa-.42)*120,p.y+Math.sin(pa-.42)*120],[p.x+Math.cos(pa+.42)*120,p.y+Math.sin(pa+.42)*120]],X.rg(p.x,p.y,0,p.x,p.y,120,['rgba(255,240,180,.28)','rgba(255,240,180,0)']));c.globalCompositeOperation=gl||'source-over';
  z.forEach(e=>{const r=e.big?12:7,a=Math.atan2(p.y-e.y,p.x-e.x);X.glow(e.x+Math.cos(a)*r*.5,e.y+Math.sin(a)*r*.5,4,'#ff2020',.5);});sh.forEach(s=>X.glow(s.x,s.y,6,'#ffe070',.7));if(p.mf)X.glow(p.x+Math.cos(pa)*14,p.y+Math.sin(pa)*14,9,'#ffe080',.9);
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
  for(let i=8;i<W-8;i+=20)for(let j=30;j<H-8;j+=20){const h=((Math.imul(i+3,2654435761)^Math.imul(j+11,40503))>>>9)%19;c.fillStyle='rgba(0,0,0,.22)';c.fillRect(i+2,j+18,17,1);c.fillRect(i+18,j+2,1,16);if(h===3)X.ell(i+10,j+12,6,3,'rgba(60,90,50,.25)',.4);if(h===8)X.ell(i+8,j+9,5,3,'rgba(90,20,30,.25)',1);if(h===5&&j>60){X.stroke([[i+5,j+10],[i+14,j+12]],'#cfc6b0',1.6);X.disc(i+5,j+10,1.3,'#cfc6b0');X.disc(i+14,j+12,1.3,'#cfc6b0');}if(h===9){X.disc(i+6,j+14,1.4,'#4a4258');X.disc(i+9,j+15,1,'#3e3650');}}
  for(let i=0;i<W;i+=16)for(let r=0;r<2;r++){c.fillStyle='rgba(255,255,255,.08)';c.fillRect(i+(r%2)*8+1,19+r*7,13,1);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(i+(r%2)*8,24.6+r*7,15,.8);}
  X.vg(8,34,W-16,14,['rgba(0,0,0,.35)','rgba(0,0,0,0)']);X.hg(8,34,10,H-42,['rgba(0,0,0,.3)','rgba(0,0,0,0)']);X.hg(W-18,34,10,H-42,['rgba(0,0,0,0)','rgba(0,0,0,.3)']);
  [40,100,220,280].forEach(x=>{X.rr(x-60,34,120,90,0,X.rg(x,34,4,x,40,85,['rgba(255,150,60,.16)','rgba(255,150,60,.05)','rgba(255,150,60,0)']));});
  X.rr(140,16,40,20,4,'#4a405a');X.rr(141,17,38,4,2,'#6a5e7a');X.rr(144,18,32,16,3,'#2a1a10');X.vignette(.55);};
 const motes=()=>{if(A.gfx!=='high')return;const c=A.c;for(let i=0;i<14;i++){const x=(i*53+A.t*.12*(1+i%3))%(W-20)+10,y=40+((i*37+A.t*(.08+i%4*.03))%(H-50)),a=.15+.15*Math.sin(A.t*.05+i);c.fillStyle='rgba(255,210,150,'+a.toFixed(2)+')';c.fillRect(x,y,1,1);}};
 const torch=(x,y)=>{const f=Math.sin(A.t*.3+x)*1.5;X.glow(x,y-2,34+f*3,'#ff9a40',.3);X.rr(x-1.5,y,3,7,1,'#6a4a2a');X.poly([[x-3,y],[x,y-8-f],[x+3,y]],'#ff8a20');X.poly([[x-1.5,y],[x,y-5-f*.5],[x+1.5,y]],'#ffe060');};
 const goblin=e=>{const st=e.st||0,x=e.x,y=e.y,hit=e.kb>0,bob=Math.abs(Math.sin(st))*1.5,d=p.x<x?-1:1;X.shadow(x,y+9,7,2.5,.35);
  if(e.t){X.rr(x-3,y+2-bob,2,7,1,'#d8d0c0');X.rr(x+1,y+2-bob,2,7,1,'#d8d0c0');X.rr(x-5,y-6-bob,10,9,3,hit?'#ffffff':'#e8e0d0');for(let k=0;k<3;k++)A.line(x-4,y-4+k*2.5-bob,x+4,y-4+k*2.5-bob,'rgba(0,0,0,.3)',.8);X.orb(x,y-11-bob,5,hit?'#ffffff':'#f0e8d8');X.disc(x-2,y-12-bob,1.4,'#1a1a2a');X.disc(x+2,y-12-bob,1.4,'#1a1a2a');X.disc(x-2,y-12-bob,.6,'#ff3030');X.disc(x+2,y-12-bob,.6,'#ff3030');
   const c=A.c;c.strokeStyle='#8a5a2a';c.lineWidth=1.4;c.beginPath();c.arc(x+d*5,y-4-bob,6,d>0?-1.3:1.84,d>0?1.3:4.44);c.stroke();A.line(x+d*(5+Math.cos(1.3)*6),y-4-bob-Math.sin(1.3)*6,x+d*(5+Math.cos(1.3)*6),y-4-bob+Math.sin(1.3)*6,'#e8e0d0',.6);}
  else{X.rr(x-4,y+2-bob,3,6,1,'#3a5a2a');X.rr(x+1,y+2-bob,3,6,1,'#3a5a2a');X.rr(x-6,y-6-bob,12,10,4,hit?'#ffffff':'#7a4a2a');X.orb(x,y-10-bob,6,hit?'#ffffff':'#6aaa40');X.poly([[x-5,y-12-bob],[x-11,y-15-bob],[x-5,y-9-bob]],'#5a9a3a');X.poly([[x+5,y-12-bob],[x+11,y-15-bob],[x+5,y-9-bob]],'#5a9a3a');X.disc(x-2,y-11-bob,1.3,'#ffe040');X.disc(x+2,y-11-bob,1.3,'#ffe040');X.rr(x-2,y-7-bob,4,1.2,.5,'#2a3a1a');
   X.stroke([[x+d*5,y-2-bob],[x+d*9,y-10-bob+Math.sin(st*2)*2]],'#6a4a2a',2.5);X.disc(x+d*9,y-10-bob+Math.sin(st*2)*2,2.6,'#8a6a3a');}
  if(e.hp<(room>3?3:2))for(let k=0;k<e.hp;k++)X.disc(x-3+k*6,y-20,1.6,K.r);if(e.arrow){const a=e.arrow,an=Math.atan2(a.vy,a.vx);X.stroke([[a.x-Math.cos(an)*7,a.y-Math.sin(an)*7],[a.x,a.y]],'#c8a060',1.4);X.poly([[a.x+Math.cos(an)*3,a.y+Math.sin(an)*3],[a.x+Math.cos(an+2.4)*3,a.y+Math.sin(an+2.4)*3],[a.x+Math.cos(an-2.4)*3,a.y+Math.sin(an-2.4)*3]],'#d8d8e0');}};
 g.draw=()=>{X.cache('brawl_bg3',bg);const c=A.c;[[40,24],[100,24],[220,24],[280,24]].forEach(([x,y])=>torch(x,y+4));
  if(door){X.glow(160,26,30,K.y,.4+.15*Math.sin(A.t*.2));X.rr(146,18,28,16,3,X.lg(0,18,0,34,['#fff0a0','#ffb040']));X.poly([[160,38+Math.sin(A.t*.2)*2],[155,44],[165,44]],K.y);}else{X.rr(146,19,28,15,3,'#6a4022');for(let k=0;k<4;k++)A.line(150+k*7,19,150+k*7,34,'#4a2a12',1);X.rr(146,25,28,2,0,'#888');}
  pots.forEach(q=>{const b=Math.sin(A.t*.1+q.x)*1;X.shadow(q.x,q.y+5,5,1.6,.35);X.orb(q.x,q.y+b,5,'#ff3a6a');X.rr(q.x-1.6,q.y-8+b,3.2,4,1,'#c8d0e0');X.rr(q.x-2.4,q.y-9+b,4.8,1.6,.8,'#8a5a2a');X.glow(q.x,q.y+b,10,'#ff3a6a',.25);});
  const ents=[...en.map(e=>({y:e.y,d:()=>goblin(e)})),{y:p.y,d:()=>{const m=Math.hypot(p.fx,p.fy)||1,a=Math.atan2(p.fy,p.fx)+(p.sw?(p.sw-6)*.2:0),blink=inv>0&&inv%8>=5;if(blink)c.globalAlpha=.35;
    if(p.sw){c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=6;c.beginPath();const a0=Math.atan2(p.fy,p.fx);c.arc(p.x,p.y-6,18,a0-1.2,a0+(p.sw-6)*.2);c.stroke();}
    A.person(p.x,p.y+8,{s:.62,c:'#2fe8d0',pants:'#3a3a5a',st:p.st||0,d:p.fx<0?-1:1,id:2,arm1:p.sw?(p.fx<0?1.6:-1.6):undefined});const hx=p.x+Math.cos(a)*5,hy=p.y-6+Math.sin(a)*5;X.stroke([[hx,hy],[hx+Math.cos(a)*18,hy+Math.sin(a)*18]],p.sw?'#ffffff':'#c8d0e0',2.4);X.stroke([[hx-Math.sin(a)*3,hy+Math.cos(a)*3],[hx+Math.sin(a)*3,hy-Math.cos(a)*3]],'#c8a040',2);if(p.sw)X.glow(hx+Math.cos(a)*18,hy+Math.sin(a)*18,10,'#c0e0ff',.6);c.globalAlpha=1;}}];
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());motes();fx.draw();
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
