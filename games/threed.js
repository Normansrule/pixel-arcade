(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- TURBO ROAD 3D ---- */
A.add({id:'road',name:'TURBO ROAD 3D',cat:'RETRO 3D',how:'UP GAS. DOWN BRAKE. HIT CHECKPOINTS.',make(){
 const g={over:null,score:0};let pos=0,spd=0,px=0,time=3600,next=24000,cars=[],flash=0;const cx=new Float32Array(H);
 const curve=s=>{const v=Math.sin(s/28)*1.4+Math.sin(s/11)*.7;return Math.abs(v)<.55?0:v;};
 for(let i=0;i<7;i++)cars.push({z:900+i*650,lane:rnd(1.4)-.7,v:3+rnd(2.5),c:[K.r,K.y,K.p,K.w,K.o][i%5]});
 g.update=()=>{const k=A.in(0),off=Math.abs(px)>1.05;if(k.u||k.a)spd+=.055;else spd-=.03;if(k.d)spd-=.12;if(off&&spd>3)spd*=.96;spd=cl(spd,0,9);
  const cv=curve(Math.floor(pos/200));px=cl(px+ax(k)*.045*(.3+spd/9)-cv*spd*spd*.00042,-1.7,1.7);pos+=spd*4;g.score=pos/100|0;if(flash>0)flash--;
  for(const c of cars){c.z+=c.v*4;const zr=c.z-pos;if(zr<75&&zr>8&&Math.abs(c.lane-px)<.34){spd*=.3;c.z+=140;S('boom');}if(zr<-80||zr>6000){c.z=pos+3000+rnd(1800);c.lane=rnd(1.5)-.75;}}
  if(pos>=next){next+=24000;time+=1320;flash=90;S('score');}if(--time<=0)g.over='TIME UP';};
 g.draw=()=>{A.cls('#ff7a59');R(0,0,W,60,'#3a2a7a');R(0,60,W,22,'#c7497d');C(160,96,26,K.y);const sh=-(curve(Math.floor(pos/200))*pos*.002)%W;for(let i=-1;i<3;i++)A.poly([[i*160+sh%160,101],[i*160+60+sh%160,74],[i*160+130+sh%160,101]],'#2b2257',1);
  let x=160,dx=0;for(let y=H-1;y>100;y--){const z=3000/(y-100),s=Math.floor((pos+z)/200),w=(y-100)*1.05,st=s%2;cx[y]=x;const rc=x-px*w;R(0,y,W,1,st?'#1a7a3d':'#176b35');R(rc-w*1.12,y,w*2.24,1,st?K.w:K.r);R(rc-w,y,w*2,1,st?'#555':'#4a4a4a');if(st){R(rc-w*.34,y,Math.max(1,w*.04),1,K.w);R(rc+w*.3,y,Math.max(1,w*.04),1,K.w);}if(s%120===0&&next-pos-z<200&&next-pos-z>-200)R(rc-w,y,w*2,1,K.y);dx+=curve(s)*.011;x+=dx;}
  cars.slice().sort((a,b)=>b.z-a.z).forEach(c=>{const zr=c.z-pos;if(zr<22||zr>2800)return;const y=Math.floor(100+3000/zr);if(y>=H)return;const w=(y-100)*1.05,sx=cx[y]-px*w+c.lane*w,s=w*.3;R(sx-s/2,y-s*.7,s,s*.7,c.c);R(sx-s*.35,y-s*.95,s*.7,s*.3,'#9fd8ff');R(sx-s/2,y-s*.12,s*.2,s*.12,K.k);R(sx+s*.3,y-s*.12,s*.2,s*.12,K.k);});
  const tl=ax(A.in(0))*3;R(138+tl,202,44,18,K.c);R(144+tl*1.4,192,32,12,'#178a7d');R(148+tl*1.4,194,24,7,'#9fd8ff');R(136+tl,214,8,8,K.k);R(176+tl,214,8,8,K.k);R(140+tl,206,6,3,K.r);R(174+tl,206,6,3,K.r);
  T('SCORE '+g.score,6,4,K.w,2);T('TIME '+Math.ceil(time/60),W-6,4,time<600?K.r:K.y,2,'r');T(Math.round(spd*28)+' KMH',160,4,K.w,2,'c');if(flash>0)T('CHECKPOINT! +22',160,40,K.y,2,'c');};
 return g;}});

/* ---- DUNGEON 3D ---- */
A.add({id:'dungeon',name:'DUNGEON 3D',cat:'RETRO 3D',how:'UP/DOWN WALK. TURN. B = MAP. FIND EXIT.',make(){
 const g={over:null,score:0};let N,m,p,ex,lvl=0,time=0;const zb=new Float32Array(160);
 const build=()=>{lvl++;N=Math.min(9+lvl*2,21);m=[];for(let y=0;y<N;y++)m.push(Array(N).fill(1));const st=[[1,1]];m[1][1]=0;while(st.length){const c=st[st.length-1],ds=[[2,0],[-2,0],[0,2],[0,-2]].filter(d=>{const x=c[0]+d[0],y=c[1]+d[1];return x>0&&y>0&&x<N-1&&y<N-1&&m[y][x];});if(!ds.length){st.pop();continue;}const d=ds[ri(ds.length)];m[c[1]+d[1]/2][c[0]+d[0]/2]=0;m[c[1]+d[1]][c[0]+d[0]]=0;st.push([c[0]+d[0],c[1]+d[1]]);}
  for(let i=0;i<N;i++){const x=1+ri(N-2),y=1+ri(N-2);if((x%2)!==(y%2))m[y][x]=0;}
  const ds=m.map(r=>r.map(()=>-1)),q=[[1,1]];ds[1][1]=0;let far=[1,1];while(q.length){const c=q.shift();if(ds[c[1]][c[0]]>ds[far[1]][far[0]])far=c;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const x=c[0]+d[0],y=c[1]+d[1];if(!m[y][x]&&ds[y][x]<0){ds[y][x]=ds[c[1]][c[0]]+1;q.push([x,y]);}});}
  ex=far;p={x:1.5,y:1.5,a:m[1][2]?1.57:0};time=(40+N*4)*60;};build();
 const solid=(x,y)=>m[Math.floor(y)][Math.floor(x)]===1;
 g.update=()=>{const k=A.in(0);p.a+=ax(k)*.05;const mv=-ay(k)*.055,nx=p.x+Math.cos(p.a)*mv,ny=p.y+Math.sin(p.a)*mv,r=.2*Math.sign(mv||1);if(!solid(nx+Math.cos(p.a)*r,p.y))p.x=nx;if(!solid(p.x,ny+Math.sin(p.a)*r))p.y=ny;
  if(Math.hypot(p.x-ex[0]-.5,p.y-ex[1]-.5)<.5){g.score+=500+(time/6|0);S('win');build();return;}if(--time<=0)g.over='TORCH OUT';};
 g.draw=()=>{R(0,0,W,120,'#1a1238');R(0,120,W,120,'#3a2a18');const dx=Math.cos(p.a),dy=Math.sin(p.a),plx=-dy*.66,ply=dx*.66;
  for(let c=0;c<160;c++){const cm=2*c/160-1,rx=dx+plx*cm,ry=dy+ply*cm;let mx=Math.floor(p.x),my=Math.floor(p.y);const ddx=Math.abs(1/(rx||1e-9)),ddy=Math.abs(1/(ry||1e-9)),sx=rx<0?-1:1,sy=ry<0?-1:1;let sdx=(rx<0?p.x-mx:mx+1-p.x)*ddx,sdy=(ry<0?p.y-my:my+1-p.y)*ddy,side=0,n=0;
   while(n++<64){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0;}else{sdy+=ddy;my+=sy;side=1;}if(m[my][mx])break;}const d=Math.max(.05,side?sdy-ddy:sdx-ddx);zb[c]=d;const h=Math.min(H,200/d),f=Math.max(.15,1-d/9)*(side?.7:1);
   R(c*2,120-h/2,2,h,'rgb('+(150*f|0)+','+(90*f|0)+','+(190*f|0)+')');if(((side?p.x+d*rx:p.y+d*ry)%1)<.06)R(c*2,120-h/2,2,h,'rgba(0,0,0,.35)');else for(let i=1;i<4;i++)R(c*2,120-h/2+h*i/4,2,Math.max(1,h/60),'rgba(0,0,0,.28)');}
  const ox=ex[0]+.5-p.x,oy=ex[1]+.5-p.y,inv=1/(plx*dy-dx*ply),tx=inv*(dy*ox-dx*oy),tz=inv*(-ply*ox+plx*oy);if(tz>.1){const scx=80*(1+tx/tz),h=200/tz,w=h/5;for(let c=Math.max(0,Math.floor(scx-w/2));c<Math.min(160,scx+w/2);c++)if(zb[c]>tz)R(c*2,120-h/2,2,h,A.t%20<10?K.g:'#1e8a45');}
  T('SCORE '+g.score,6,4,K.y,2);T('TORCH '+Math.ceil(time/60),W-6,4,time<600?K.r:K.w,2,'r');T('FLOOR '+lvl,160,4,K.w,1,'c');
  if(A.in(0).b){const s=Math.floor(150/N),o=160-N*s/2,oy2=125-N*s/2;m.forEach((row,y)=>row.forEach((v,x)=>R(o+x*s,oy2+y*s,s,s,v?'#2b2257':'rgba(0,0,0,.8)')));R(o+ex[0]*s,oy2+ex[1]*s,s,s,K.g);C(o+p.x*s,oy2+p.y*s,2,K.y);L(o+p.x*s,oy2+p.y*s,o+(p.x+dx)*s,oy2+(p.y+dy)*s,K.y);}};
 return g;}});

/* ---- STAR RUN 3D ---- */
A.add({id:'starrun',name:'STAR RUN 3D',cat:'RETRO 3D',how:'FLY. A FIRES. DODGE ROCKS.',make(){
 const g={over:null,score:0};let px=0,py=0,ob=[],bl=[],st=[],sh=3,inv=0,d=0;for(let i=0;i<50;i++)st.push({x:rnd(4)-2,y:rnd(4)-2,z:rnd(12)+.5});
 const pj=(x,y,z)=>[160+(x-px*.7)*170/z,120+(y-py*.7)*170/z];
 g.update=()=>{const k=A.in(0);d++;px=cl(px+ax(k)*.045,-1,1);py=cl(py+ay(k)*.045,-.8,.8);if(inv>0)inv--;const sp=.11+Math.min(.12,d/30000);if(d%10===0)g.score++;
  if(Math.random()<.035+d/90000)ob.push({x:cl(px+rnd(2.4)-1.2,-1.4,1.4),y:cl(py+rnd(2)-1,-1.1,1.1),z:14,r:.22+rnd(.18)});if(A.hit(0).a&&bl.length<4){bl.push({x:px,y:py,z:.8});S('shoot');}
  st.forEach(s=>{s.z-=sp;if(s.z<.3){s.z=12;s.x=rnd(4)-2;s.y=rnd(4)-2;}});bl.forEach(b=>b.z+=.5);
  for(const o of ob){o.z-=sp;for(const b of bl)if(!b.dead&&Math.abs(b.z-o.z)<.6&&Math.abs(b.x-o.x)<o.r+.08&&Math.abs(b.y-o.y)<o.r+.08){b.dead=o.dead=1;g.score+=50;S('hit');}
   if(!o.dead&&o.z<1&&o.z>.55&&inv===0&&Math.abs(o.x-px)<o.r+.14&&Math.abs(o.y-py)<o.r+.1){o.dead=1;sh--;inv=90;S('boom');if(sh<=0)g.over='SHIP LOST';}}
  ob=ob.filter(o=>!o.dead&&o.z>.5);bl=bl.filter(b=>!b.dead&&b.z<14);};
 g.draw=()=>{A.cls('#05030f');st.forEach(s=>{const a=pj(s.x,s.y,s.z),b=pj(s.x,s.y,s.z+.4);L(a[0],a[1],b[0],b[1],s.z<4?K.w:K.gr);});
  ob.slice().sort((a,b)=>b.z-a.z).forEach(o=>{const v=pj(o.x,o.y,o.z),r=o.r*170/o.z,f=Math.max(.25,1-o.z/14);C(v[0],v[1],r,'rgb('+(200*f|0)+','+(140*f|0)+','+(110*f|0)+')');C(v[0]-r*.3,v[1]-r*.3,r*.3,'rgba(0,0,0,.25)');});
  bl.forEach(b=>{const v=pj(b.x,b.y,b.z);R(v[0]-1,v[1]-1,3,3,K.y);});const sx=160+px*48,sy=150+py*60;if(inv%8<5){A.poly([[sx,sy-10],[sx-16,sy+8],[sx,sy+3],[sx+16,sy+8]],K.c,1);R(sx-2,sy-4,4,6,K.w);if(A.t%4<2)R(sx-2,sy+5,4,4,K.o);}
  A.ring(160+px*.3*170/6,120+py*.3*170/6,5,'rgba(255,255,255,.4)');T('SCORE '+g.score,6,4,K.y,2);T('SHIELDS '+sh,W-6,4,sh<2?K.r:K.w,2,'r');};
 return g;}});
})();
