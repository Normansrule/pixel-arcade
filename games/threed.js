(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]});

/* ---- TURBO ROAD 3D ---- */
A.add({id:'road',name:'TURBO ROAD 3D',cat:'RETRO 3D',how:'UP GAS. DOWN BRAKE. HIT CHECKPOINTS.',make(){
 const g={over:null,score:0},fx=X.fx();let pos=0,spd=0,px=0,time=3600,next=24000,cars=[],flash=0,bump=0;const cx=new Float32Array(H);
 const curve=s=>{const v=Math.sin(s/28)*1.4+Math.sin(s/11)*.7;return Math.abs(v)<.55?0:v;};
 for(let i=0;i<7;i++)cars.push({z:900+i*650,lane:rnd(1.4)-.7,v:3+rnd(2.5),c:[K.r,K.y,K.p,K.w,K.o][i%5]});
 g.update=()=>{const k=A.in(0),off=Math.abs(px)>1.05;if(k.u||k.a)spd+=.055;else spd-=.03;if(k.d)spd-=.12;if(off&&spd>3)spd*=.96;spd=cl(spd,0,9);if(bump>0)bump--;if(off&&spd>2&&A.t%3===0)fx.debris(160+rnd(40)-20,220,'#3a8a3a',1,1.2);
  const cv=curve(Math.floor(pos/200));px=cl(px+ax(k)*.045*(.3+spd/9)-cv*spd*spd*.00042,-1.7,1.7);pos+=spd*4;g.score=pos/100|0;if(flash>0)flash--;
  for(const c of cars){c.z+=c.v*4;const zr=c.z-pos;if(zr<75&&zr>8&&Math.abs(c.lane-px)<.34){spd*=.3;c.z+=140;S('boom');A.shake=6;bump=20;fx.spark(160,200,'#ffd080',16,2.6);fx.flash('#ffffff',4);}if(zr<-80||zr>6000){c.z=pos+3000+rnd(1800);c.lane=rnd(1.5)-.75;}}
  if(pos>=next){next+=24000;time+=1320;flash=90;S('score');fx.flash(K.y,6);}if(--time<=0)g.over='TIME UP';};
 const bg=()=>{X.sky(['#1a1050','#5a2a8a','#e0508a','#ffa060'],101);X.stars(30,3,0,0,50,.7);X.disc(160,92,30,X.rg(160,92,0,160,92,30,['#fff4b0','#ffd040','#ff8040']));const c=A.c;c.fillStyle='rgba(255,120,120,.6)';for(let i=0;i<5;i++)c.fillRect(126,86+i*3.2,68,1+i*.3);X.glow(160,92,90,'#ff9050',.35);};
 const tree=(x,y,s,k)=>{if(s<.06)return;if(k){X.rr(x-1.5*s,y-46*s,3*s,46*s,1,'#6a4a2a');for(let i=0;i<5;i++){const a=-2.6+i*.55;X.stroke([[x,y-46*s],[x+Math.cos(a)*16*s,y-46*s+Math.sin(a)*10*s+8*s]],'#2a8a3a',Math.max(1,3*s));}}else{X.rr(x-1*s,y-40*s,2*s,40*s,0,'#8a8a96');X.rr(x-6*s,y-40*s,12*s,3*s,1,'#8a8a96');X.glow(x-5*s,y-36*s,6*s,'#ffe0a0',.5);}};
 const car=(sx,y,s,col,me,tl)=>{X.shadow(sx,y,s*.6,s*.12,.4);X.rr(sx-s/2,y-s*.55,s,s*.45,s*.12,X.lg(0,y-s*.55,0,y-s*.1,[X.lt(col,1.3),col,X.lt(col,.55)]));X.rr(sx-s*.36,y-s*.86,s*.72,s*.34,s*.1,X.lt(col,.85));X.rr(sx-s*.3,y-s*.8,s*.6,s*.22,s*.06,X.lg(0,y-s*.8,0,y-s*.58,['#cfefff','#5a8ab0']));X.rr(sx-s*.52,y-s*.16,s*.22,s*.16,s*.05,'#151515');X.rr(sx+s*.3,y-s*.16,s*.22,s*.16,s*.05,'#151515');
  X.rr(sx-s*.46,y-s*.42,s*.16,s*.08,1,'#ff3030');X.rr(sx+s*.3,y-s*.42,s*.16,s*.08,1,'#ff3030');if(me||s>14){X.glow(sx-s*.38,y-s*.38,s*.25,'#ff3030',me&&tl?.8:.35);X.glow(sx+s*.38,y-s*.38,s*.25,'#ff3030',me&&tl?.8:.35);}};
 g.draw=()=>{X.cache('road_bg',bg);const c=A.c,sh=-(curve(Math.floor(pos/200))*pos*.002)%W;
  for(let i=-1;i<3;i++){const o=i*160+sh%160;X.poly([[o-20,101],[o+60,70],[o+150,101]],'#3a2060');X.poly([[o+40,101],[o+60,70],[o+75,84],[o+90,101]],'rgba(255,255,255,.06)');}for(let i=-1;i<4;i++){const o=i*110+(sh*1.6)%110;X.poly([[o-10,101],[o+40,86],[o+90,101]],'#2a1650');}
  const objs=[];let x=160,dx=0,ls=-1;for(let y=H-1;y>100;y--){const z=3000/(y-100),s=Math.floor((pos+z)/200),w=(y-100)*1.05,st=s%2;cx[y]=x;const rc=x-px*w;R(0,y,W,1,st?'#1f8a45':'#1a7a3d');R(rc-w*1.12,y,w*2.24,1,st?'#f4f0e6':'#ff3a5a');R(rc-w,y,w*2,1,st?'#5a5a64':'#4e4e58');if(st){R(rc-w*.34,y,Math.max(1,w*.04),1,'#f4f0e6');R(rc+w*.3,y,Math.max(1,w*.04),1,'#f4f0e6');}if(s%120===0&&next-pos-z<200&&next-pos-z>-200)R(rc-w,y,w*2,1,(A.t>>2)%2?K.y:'#ffffff');
   if(s!==ls&&ls>=0)objs.push({x:rc-w*1.45,y,s:w/34,k:s%3===0?0:1},{x:rc+w*1.45,y,s:w/34,k:s%3===1?0:1});ls=s;dx+=curve(s)*.011;x+=dx;}
  c.fillStyle=X.lg(0,101,0,125,['rgba(255,140,170,.35)','rgba(255,140,170,0)']);c.fillRect(0,101,W,24);
  for(let i=objs.length-1;i>=0;i--){const o=objs[i];tree(o.x,o.y,o.s,o.k);}
  cars.slice().sort((a,b)=>b.z-a.z).forEach(o=>{const zr=o.z-pos;if(zr<22||zr>2800)return;const y=Math.floor(100+3000/zr);if(y>=H)return;const w=(y-100)*1.05,sx=cx[y]-px*w+o.lane*w,s=w*.3;car(sx,y,s,o.c,false);});
  const tl=ax(A.in(0))*3,by=bump?Math.sin(bump)*2:0,brk=A.in(0).d;c.save();c.translate(160+tl,214+by);c.rotate(tl*.02);car(0,8,46,'#2fe8d0',true,brk);c.restore();if(spd>6&&A.t%2)for(let k=0;k<2;k++)X.disc(160+tl+(k?14:-14)+rnd(2),226,2+rnd(2),'rgba(200,200,220,.4)');
  if(spd>6){c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=1;for(let i=0;i<8;i++){const a=i*.785+A.t*.05,r0=60+((A.t*6+i*30)%90);c.beginPath();c.moveTo(160+Math.cos(a)*r0,130+Math.sin(a)*r0*.6);c.lineTo(160+Math.cos(a)*(r0+20),130+Math.sin(a)*(r0+20)*.6);c.stroke();}}
  fx.draw();X.bar('SCORE '+g.score,'TIME '+Math.ceil(time/60),'',K.y,time<600?K.r:'#ffffff');X.panel(120,20,80,14,'#2fe8d0');X.meter(124,24,44,6,spd/9,spd>7?K.o:K.c);T(Math.round(spd*28)+'',194,24,'#ffffff',1,'r',1);if(flash>0)X.ot('CHECKPOINT! +22',160,44,flash%10<6?K.y:'#ffffff',2,'c');};
 return g;}});

/* ---- DUNGEON 3D ---- */
A.add({id:'dungeon',name:'DUNGEON 3D',cat:'RETRO 3D',how:'UP/DOWN WALK. TURN. B = MAP. FIND EXIT.',make(){
 const g={over:null,score:0};let N,m,p,ex,lvl=0,time=0,ban=0,wob=0;const zb=new Float32Array(160);
 const build=()=>{lvl++;ban=90;N=Math.min(9+lvl*2,21);m=[];for(let y=0;y<N;y++)m.push(Array(N).fill(1));const st=[[1,1]];m[1][1]=0;while(st.length){const c=st[st.length-1],ds=[[2,0],[-2,0],[0,2],[0,-2]].filter(d=>{const x=c[0]+d[0],y=c[1]+d[1];return x>0&&y>0&&x<N-1&&y<N-1&&m[y][x];});if(!ds.length){st.pop();continue;}const d=ds[ri(ds.length)];m[c[1]+d[1]/2][c[0]+d[0]/2]=0;m[c[1]+d[1]][c[0]+d[0]]=0;st.push([c[0]+d[0],c[1]+d[1]]);}
  for(let i=0;i<N;i++){const x=1+ri(N-2),y=1+ri(N-2);if((x%2)!==(y%2))m[y][x]=0;}
  const ds=m.map(r=>r.map(()=>-1)),q=[[1,1]];ds[1][1]=0;let far=[1,1];while(q.length){const c=q.shift();if(ds[c[1]][c[0]]>ds[far[1]][far[0]])far=c;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const x=c[0]+d[0],y=c[1]+d[1];if(!m[y][x]&&ds[y][x]<0){ds[y][x]=ds[c[1]][c[0]]+1;q.push([x,y]);}});}
  ex=far;p={x:1.5,y:1.5,a:m[1][2]?1.57:0};time=(40+N*4)*60;};build();
 const solid=(x,y)=>m[Math.floor(y)][Math.floor(x)]===1;
 g.update=()=>{if(ban>0)ban--;const k=A.in(0);p.a+=ax(k)*.05;const mv=-ay(k)*.055,nx=p.x+Math.cos(p.a)*mv,ny=p.y+Math.sin(p.a)*mv,r=.2*Math.sign(mv||1);if(mv)wob+=.18;if(!solid(nx+Math.cos(p.a)*r,p.y))p.x=nx;if(!solid(p.x,ny+Math.sin(p.a)*r))p.y=ny;
  if(Math.hypot(p.x-ex[0]-.5,p.y-ex[1]-.5)<.5){g.score+=500+(time/6|0);S('win');build();return;}if(--time<=0)g.over='TORCH OUT';};
 g.draw=()=>{const c=A.c,bob=Math.sin(wob)*2,hz=120+bob,tf=Math.min(1,time/1800),fl=.92+.08*Math.sin(A.t*.37)*Math.sin(A.t*.13);X.vg(0,0,W,hz,['#06040e','#1a1430','#2a2040']);X.vg(0,hz,W,H-hz,['#2a2018','#4a3624','#6a4c30']);
  c.fillStyle='rgba(0,0,0,.18)';for(let j=0;j<8;j++){const y=hz+4*Math.pow(1.6,j);c.fillRect(0,y,W,1);}
  const dx=Math.cos(p.a),dy=Math.sin(p.a),plx=-dy*.66,ply=dx*.66;
  for(let cc=0;cc<160;cc++){const cm=2*cc/160-1,rx=dx+plx*cm,ry=dy+ply*cm;let mx=Math.floor(p.x),my=Math.floor(p.y);const ddx=Math.abs(1/(rx||1e-9)),ddy=Math.abs(1/(ry||1e-9)),sx=rx<0?-1:1,sy=ry<0?-1:1;let sdx=(rx<0?p.x-mx:mx+1-p.x)*ddx,sdy=(ry<0?p.y-my:my+1-p.y)*ddy,side=0,n=0;
   while(n++<64){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0;}else{sdy+=ddy;my+=sy;side=1;}if(m[my][mx])break;}const d=Math.max(.05,side?sdy-ddy:sdx-ddx);zb[cc]=d;const h=Math.min(H*1.2,200/d),f=Math.max(.08,1-d/(5+4*tf))*(side?.72:1)*fl,wx=((side?p.x+d*rx:p.y+d*ry)%1+1)%1,top=hz-h/2;
   R(cc*2,top,2,h,'rgb('+(170*f|0)+','+(120*f|0)+','+(96*f|0)+')');for(let i=0;i<4;i++){const o=(i%2)*.5;if(((wx*2+o)%1)<.07)R(cc*2,top+h*i/4,2,h/4,'rgba(0,0,0,.4)');R(cc*2,top+h*i/4,2,Math.max(1,h/50),'rgba(0,0,0,.35)');if(((wx*2+o)%1)>.1&&((wx*2+o)%1)<.16)R(cc*2,top+h*i/4,2,h/4,'rgba(255,220,180,'+(.08*f)+')');}
   if(((mx*7+my*13)%5===0)&&wx>.42&&wx<.58&&d<6){const ty=top+h*.3;R(cc*2,ty,2,h*.12,'rgba(90,60,30,'+f+')');if(wx>.47&&wx<.53)R(cc*2,ty-h*.08,2,h*.08,'rgba(255,'+(160+60*Math.sin(A.t*.4+mx)|0)+',60,'+Math.min(1,f*1.6)+')');}}
  const ox=ex[0]+.5-p.x,oy=ex[1]+.5-p.y,inv=1/(plx*dy-dx*ply),tx=inv*(dy*ox-dx*oy),tz=inv*(-ply*ox+plx*oy);if(tz>.1){const scx=80*(1+tx/tz),h=200/tz,w=h/2.6;for(let cc=Math.max(0,Math.floor(scx-w/2));cc<Math.min(160,scx+w/2);cc++)if(zb[cc]>tz){const u=Math.abs(cc-scx)/(w/2),hh=h*(1-u*u*.4);R(cc*2,hz-hh/2+h*.1,2,hh*.8,'rgba(80,255,160,'+(.35+.25*Math.sin(A.t*.2+cc*.3))*(1-u*.5)+')');}if(scx>0&&scx<160)X.glow(scx*2,hz,h*.6,'#50ffa0',.35);}
  c.fillStyle=X.rg(W-60,H,10,W/2,H/2,240,['rgba(255,150,60,'+(.12*fl)+')','rgba(0,0,0,0)','rgba(0,0,0,.5)']);c.fillRect(0,0,W,H);
  const tx2=W-54+Math.sin(wob*.5)*3,ty2=H-38+Math.abs(bob)*2;X.rr(tx2-3,ty2,7,46,2,X.lg(tx2-3,0,tx2+4,0,['#8a5a30','#4a2a10']));X.glow(tx2,ty2-6,30*fl*(.5+tf*.5),'#ffa040',.55);X.poly([[tx2-6,ty2],[tx2-1,ty2-18-4*Math.sin(A.t*.5)],[tx2+2,ty2-10],[tx2+5,ty2-15-3*Math.sin(A.t*.4)],[tx2+6,ty2]],'#ff8020');X.poly([[tx2-3,ty2],[tx2,ty2-9-2*Math.sin(A.t*.6)],[tx2+3,ty2]],'#ffe060');
  X.bar('SCORE '+g.score,'TORCH '+Math.ceil(time/60),'FLOOR '+lvl,K.y,time<600?K.r:'#ffffff');if(ban>0)X.ot('FLOOR '+lvl,160,70,'#ffd080',3,'c');
  if(A.in(0).b){const s=Math.floor(150/N),o=160-N*s/2,oy2=125-N*s/2;X.panel(o-6,oy2-6,N*s+12,N*s+12,'#ffd080');m.forEach((row,y)=>row.forEach((v,x)=>R(o+x*s,oy2+y*s,s,s,v?'#4a3a5a':'rgba(10,6,20,.85)')));R(o+ex[0]*s,oy2+ex[1]*s,s,s,K.g);X.disc(o+p.x*s,oy2+p.y*s,2.2,K.y);L(o+p.x*s,oy2+p.y*s,o+(p.x+dx*1.2)*s,oy2+(p.y+dy*1.2)*s,K.y);}else T('HOLD B FOR MAP',160,228,'rgba(255,220,180,.5)',1,'c',1);};
 return g;}});

/* ---- STAR RUN 3D ---- */
A.add({id:'starrun',name:'STAR RUN 3D',cat:'RETRO 3D',how:'FLY. A FIRES. DODGE ROCKS.',make(){
 const g={over:null,score:0},fx=X.fx();let px=0,py=0,ob=[],bl=[],st=[],sh=3,inv=0,d=0,bank=0;for(let i=0;i<50;i++)st.push({x:rnd(4)-2,y:rnd(4)-2,z:rnd(12)+.5});
 const pj=(x,y,z)=>[160+(x-px*.7)*170/z,120+(y-py*.7)*170/z];
 g.update=()=>{const k=A.in(0);d++;bank+=(ax(k)*.35-bank)*.15;px=cl(px+ax(k)*.045,-1,1);py=cl(py+ay(k)*.045,-.8,.8);if(inv>0)inv--;const sp=.11+Math.min(.12,d/30000);if(d%10===0)g.score++;
  if(Math.random()<.035+d/90000)ob.push({x:cl(px+rnd(2.4)-1.2,-1.4,1.4),y:cl(py+rnd(2)-1,-1.1,1.1),z:14,r:.22+rnd(.18),rot:rnd(6),cr:ri(3)});if(A.fire(7)&&bl.length<12){bl.push({x:px,y:py,z:.8});S('shoot');}
  st.forEach(s=>{s.z-=sp;if(s.z<.3){s.z=12;s.x=rnd(4)-2;s.y=rnd(4)-2;}});bl.forEach(b=>b.z+=.5);
  for(const o of ob){o.z-=sp;o.rot+=.02;for(const b of bl)if(!b.dead&&Math.abs(b.z-o.z)<.6&&Math.abs(b.x-o.x)<o.r+.08&&Math.abs(b.y-o.y)<o.r+.08){b.dead=o.dead=1;g.score+=50;S('hit');const v=pj(o.x,o.y,o.z);fx.debris(v[0],v[1],'#a07858',10,2.2);fx.spark(v[0],v[1],'#ffd080',10,2.4);fx.pop(v[0],v[1]-10,'+50',K.y);}
   if(!o.dead&&o.z<1&&o.z>.55&&inv===0&&Math.abs(o.x-px)<o.r+.14&&Math.abs(o.y-py)<o.r+.1){o.dead=1;sh--;inv=90;S('boom');A.shake=7;fx.flash('#ff4020',6);fx.spark(160+px*48,150+py*60,'#ff9040',20,3);if(sh<=0)g.over='SHIP LOST';}}
  ob=ob.filter(o=>!o.dead&&o.z>.5);bl=bl.filter(b=>!b.dead&&b.z<14);};
 const bg=()=>{X.vg(0,0,W,H,['#0a0620','#14082a','#05030f']);X.disc(70,60,90,X.rg(70,60,0,70,60,90,['rgba(180,60,200,.35)','rgba(80,20,120,.15)','rgba(0,0,0,0)']));X.disc(260,170,110,X.rg(260,170,0,260,170,110,['rgba(40,120,220,.3)','rgba(20,40,120,.12)','rgba(0,0,0,0)']));X.stars(90,5,0,0,H,.7);X.disc(250,50,14,X.rg(245,45,1,250,50,14,['#ffd0a0','#c06040','#401810']));A.c.strokeStyle='rgba(255,220,180,.35)';A.c.lineWidth=1;A.c.beginPath();if(A.c.ellipse)A.c.ellipse(250,50,22,5,-.3,0,6.283);A.c.stroke();};
 g.draw=()=>{X.cache('starrun_bg',bg);const c=A.c;st.forEach(s=>{const a=pj(s.x,s.y,s.z),b=pj(s.x,s.y,s.z+.5);X.stroke([a,b],s.z<4?'#ffffff':s.z<8?'#9ab0ff':'#5a5a8a',s.z<4?1.4:.8);});
  ob.slice().sort((a,b)=>b.z-a.z).forEach(o=>{const v=pj(o.x,o.y,o.z),r=o.r*170/o.z,f=Math.max(.2,1-o.z/14);c.globalAlpha=Math.min(1,(14-o.z)/2);X.orb(v[0],v[1],r,'rgb('+(170*f+40|0)+','+(120*f+30|0)+','+(95*f+25|0)+')',0);for(let k=0;k<3;k++){const a=o.rot+k*2.1+o.cr;X.disc(v[0]+Math.cos(a)*r*.45,v[1]+Math.sin(a)*r*.45,r*(.18+k*.05),'rgba(0,0,0,.22)');}X.disc(v[0]-r*.35,v[1]-r*.35,r*.25,'rgba(255,255,255,.12)');c.globalAlpha=1;
});
  bl.forEach(b=>{const v=pj(b.x,b.y,b.z),s=Math.max(1,6/b.z);X.glow(v[0],v[1],s*3,'#ffe060',.7);X.disc(v[0],v[1],s*.6,'#ffffff');});
  const sx=160+px*48,sy=150+py*60;if(inv%8<5){c.save();c.translate(sx,sy);c.rotate(bank);X.glow(0,6,14+Math.sin(A.t*.8)*3,'#40a0ff',.6);X.poly([[0,-12],[-18,8],[-6,5],[0,8],[6,5],[18,8]],X.lg(-18,0,18,0,['#1a9a8a','#4ff8e0','#1a9a8a']));X.poly([[0,-12],[-4,2],[0,5],[4,2]],'#c8fff8');X.poly([[-18,8],[-20,2],[-14,6]],'#ff4f6d');X.poly([[18,8],[20,2],[14,6]],'#ff4f6d');X.ell(0,-2,2.5,4,'#203050');X.disc(0,9,2.6,A.t%4<2?'#ffd040':'#ff8020');c.restore();}
  const rx=160+px*.3*170/6,ry=120+py*.3*170/6;A.ring(rx,ry,6,'rgba(120,255,220,.6)');A.line(rx-10,ry,rx-7,ry,'rgba(120,255,220,.6)',1);A.line(rx+7,ry,rx+10,ry,'rgba(120,255,220,.6)',1);
  fx.draw();X.bar('SCORE '+g.score,'','',K.y);for(let i=0;i<3;i++)X.orb(W-12-i*14,9,4.5,i<sh?'#4ff8e0':'#2a2a3a');};
 return g;}});
})();
