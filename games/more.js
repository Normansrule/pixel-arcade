(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;if(h.l||h.r||h.u||h.d)S('blip');};
const cursor=(x,y,w,h,col)=>{const p=1+Math.sin(A.t*.15)*.8;X.glow(x+w/2,y+h/2,Math.max(w,h)*.8,col||'#ffcf3f',.15);X.rrs(x-p,y-p,w+2*p,h+2*p,3,col||'#ffcf3f',1.5);};

/* ---- COIN DASH 3D ---- */
A.add({id:'coindash',name:'COIN DASH 3D',cat:'RETRO 3D',hd:1,how:'RUN AROUND THE ARENA. GRAB COINS. AVOID THE ROLLERS. 60 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:0,z:0,a:0,st:0},coins=[],rollers=[],time=3600,inv=0;for(let i=0;i<12;i++)coins.push({x:rnd(40)-20,z:rnd(40)-20});for(let i=0;i<4;i++)rollers.push({x:rnd(40)-20,z:rnd(40)-20,a:rnd(6.28),v:.08+rnd(.05),r:0});
 const scr=(x,y,z)=>A.p3(x,y,z);
 g.update=()=>{time--;if(inv>0)inv--;const k=A.in(0),dx=ax(k),dz=-ay(k);if(dx||dz){p.a=Math.atan2(dx,dz);p.x=cl(p.x+dx*.16,-22,22);p.z=cl(p.z+dz*.16,-22,22);p.st+=.3;}
  coins=coins.filter(c=>{if(Math.hypot(c.x-p.x,c.z-p.z)<1){g.score+=10;S('coin');const s=scr(c.x,.6,c.z);fx.spark(s[0],s[1],K.y,10,2.2);fx.pop(s[0],s[1]-10,'+10',K.y);coins.push({x:rnd(40)-20,z:rnd(40)-20});return false;}return true;});
  for(const r of rollers){r.x+=Math.sin(r.a)*r.v;r.z+=Math.cos(r.a)*r.v;r.r+=r.v*1.4;if(Math.abs(r.x)>22||Math.abs(r.z)>22){r.a+=3.14+rnd(1)-.5;}if(inv===0&&Math.hypot(r.x-p.x,r.z-p.z)<1.5){inv=60;g.score=Math.max(0,g.score-20);S('boom');fx.flash(K.r,8);const s=scr(p.x,1,p.z);fx.spark(s[0],s[1],K.r,14,3);fx.pop(s[0],s[1]-14,'-20',K.r);}}
  if(time<=0)g.over='TIME UP';};
 g.draw=()=>{A.skyband('#0a0430','#ff3f8e',130);X.stars(40,3,0,0,90,.7);A.fog={col:'#3a1060',near:20,far:50};A.cam.x=p.x;A.cam.y=8;A.cam.z=p.z-11;A.cam.ry=0;A.cam.rx=-.6;
  for(let i=-22;i<22;i+=4)for(let j=-22;j<22;j+=4)F([[i,0,j],[i+4,0,j],[i+4,0,j+4],[i,0,j+4]],((i+j)/4)%2?'#3a2a78':'#2a1e5a');for(let i=-22;i<=22;i+=4){B3(i,0,-22.5,4,1,1,'#6a5aa0');B3(i,0,22.5,4,1,1,'#6a5aa0');B3(-22.5,0,i,1,1,4,'#6a5aa0');B3(22.5,0,i,1,1,4,'#6a5aa0');}
  coins.forEach(c=>{A.shadow3(c.x,c.z,.6,.6);A.cyl3(c.x,.5+Math.sin(A.t*.1+c.x)*.15,c.z,.35,.12,'#ffcf3f',8,'x');});rollers.forEach(r=>{A.shadow3(r.x,r.z,1.6,1.6);A.cyl3(r.x,.7,r.z,.7,1.4,'#ff4f6d',10,'x');B3(r.x,.62,r.z,1.45,.16,.16,'#ffd0d0');});
  if(inv%6<4){A.shadow3(p.x,p.z,1,1);const bob=Math.abs(Math.sin(p.st))*.08;B3(p.x,.1+bob,p.z,.6,.9,.6,'#2fd6c3');B3(p.x,1+bob,p.z,.5,.5,.5,'#f1c7a3');B3(p.x,1.45+bob,p.z,.55,.12,.55,'#ff4f6d');const s=Math.sin(p.a),c=Math.cos(p.a);B3(p.x+s*.3,1.05+bob,p.z+c*.3,.15,.15,.15,K.k);}A.flush();A.fog=null;
  coins.forEach(c=>{const s=scr(c.x,.55,c.z);if(s[2]>.5)X.glow(s[0],s[1],Math.min(16,60/s[2]),'#ffcf3f',.3);});
  fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),'',K.y,time<600?K.r:K.w);};
 return g;}});

/* ---- FROST PEAK ---- */
A.add({id:'frost',name:'FROST PEAK',cat:'CLASSICS',how:'A JUMPS. BREAK THROUGH FLOORS ABOVE YOU. CLIMB BEFORE THE ICE FALLS.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:200,vy:0,f:1,st:0},floors=[],cam=0,fall=[];for(let i=0;i<40;i++){const f=[];for(let x=0;x<10;x++)f.push(x===0||x===9?2:Math.random()<.15?0:1);floors.push(f);}
 const at=(x,y)=>{const r=Math.round((220-y)/48),c=Math.floor(x/32);return floors[r]&&floors[r][c];};
 g.update=()=>{const k=A.in(0);if(ax(k)){p.f=ax(k);p.st+=.3;}p.x=(p.x+ax(k)*2.2+W)%W;const row=(220-p.y)/48,onF=Math.abs(row-Math.round(row))<.03&&at(p.x,p.y)&&p.vy>=0;
  if(onF){p.vy=0;p.y=220-Math.round(row)*48;if(A.hit(0).a){p.vy=-7.2;S('jump');fx.spark(p.x,p.y-cam,'#ffffff',4,1.2);}}else{p.vy+=.28;}const oy=p.y;p.y+=p.vy;
  if(p.vy<0){const r=Math.round((220-(p.y-30))/48),c=Math.floor(p.x/32);if(floors[r]&&floors[r][c]===1&&(220-r*48)>p.y-30&&(220-r*48)<oy-30+1){floors[r][c]=0;p.vy=1;fall.push({x:c*32,y:220-r*48,vy:0,r:0});S('hit');g.score+=5;fx.debris(c*32+16,220-r*48-cam,'#bfe8ff',8,2);fx.spark(c*32+16,220-r*48-cam,'#ffffff',6,2);}}
  if(p.vy>0){const r=Math.round((220-p.y)/48),fy=220-r*48;if(oy<=fy&&p.y>=fy&&floors[r]&&floors[r][Math.floor(p.x/32)]){p.y=fy;p.vy=0;}}
  const want=p.y-150;if(want<cam)cam=want;g.score=Math.max(g.score,-cam/10|0);fall.forEach(f=>{f.vy+=.3;f.y+=f.vy;f.r+=.05;});fall=fall.filter(f=>f.y<cam+H+40);if(p.y>cam+H+30)g.over='FELL';if(g.score>360)g.over='SUMMIT! WIN';};
 g.draw=()=>{const c=A.c,k=cl(-cam/3000,0,1);c.fillStyle=X.lg(0,0,0,H,[A.mix('#1a3a7a','#05051a',k),A.mix('#6a9ad8','#2a2a6a',k)]);c.fillRect(0,0,W,H);X.stars(40,9,0,cam*.1,H,.6+k*.4);
  X.hills(H+40-cam*.05,90,'rgba(200,220,255,.25)',0,.015,2);X.hills(H+60-cam*.12,70,'rgba(160,190,240,.35)',40,.025,5);
  floors.forEach((f,r)=>{const y=220-r*48-cam;if(y<-50||y>H+10)return;f.forEach((v,cc)=>{const x=cc*32;if(v===1){X.rr(x+.5,y,31,9,3,X.lg(0,y,0,y+9,['#ffffff','#bfe8ff','#6aa8e0']));c.fillStyle='rgba(255,255,255,.6)';c.fillRect(x+4,y+1,10,1);for(let i=0;i<3;i++)X.poly([[x+6+i*9,y+9],[x+9+i*9,y+9],[x+7.5+i*9,y+12+(i+cc+r)%3*2]],'rgba(190,230,255,.85)');}else if(v===2){c.fillStyle=X.lg(x,0,x+32,0,['#3a5a8a','#6a8aba','#3a5a8a']);c.fillRect(x,y-40,32,48);c.fillStyle='rgba(255,255,255,.15)';for(let yy=y-36;yy<y+8;yy+=8)c.fillRect(x+2,yy,28,1);X.rr(x,y-42,32,5,2,'#ffffff');}});});
  fall.forEach(f=>{c.save();c.translate(f.x+16,f.y-cam+4);c.rotate(f.r);X.rr(-16,-4,32,9,3,X.lg(0,-4,0,5,['#ffffff','#9fd8ff']));c.restore();});
  const y=p.y-cam;A.person(p.x,y,{s:.75,c:'#ff9838',pants:'#2a4a8a',cap:'#ff4f6d',st:p.vy!==0?1.2:p.st,d:p.f,arm1:p.vy<0?-2.9:undefined,arm2:p.vy<0?2.9:undefined,id:1});X.ell(p.x,y-26,5,1.5,'#ffffff');
  fx.draw();X.ot('HEIGHT '+g.score,160,6,K.w,2,'c');X.meter(306,30,6,180,g.score/360,'#9fd8ff');};
 return g;}});

/* ---- DRONE DROP ---- */
A.add({id:'drone',name:'DRONE DROP',cat:'SIM',how:'FLY. PICK UP PARCELS, A DROPS ONTO THE MARKED ROOF. BATTERY DRAINS. 90 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let d={x:160,y:60,vx:0,vy:0,has:false},bld=[],time=5400,tgt=0,pick={x:0,y:0},drop=null;for(let i=0;i<7;i++)bld.push({x:20+i*42,w:30,h:40+ri(80),c:['#3a3a5a','#4a3a5a','#2a3a5a'][i%3]});const newT=()=>{tgt=ri(7);let pb;do{pb=ri(7);}while(pb===tgt);const b=bld[pb];pick={x:b.x+b.w/2,y:H-b.h-8};};newT();
 g.update=()=>{time--;const k=A.in(0);d.vx=(d.vx+ax(k)*.15)*.95;d.vy=(d.vy+ay(k)*.15)*.95;d.x=cl(d.x+d.vx,8,W-8);d.y=cl(d.y+d.vy,20,H-8);if(!d.has&&Math.hypot(d.x-pick.x,d.y-pick.y)<12){d.has=true;g.score+=10;S('coin');fx.pop(d.x,d.y-12,'+10',K.y);fx.ring(d.x,d.y+8,'#ffcf3f',14,10);}
  if(drop){drop.vy+=.25;drop.y+=drop.vy;if(drop.y>drop.ty){fx.spark(drop.x,drop.ty,drop.ok?'#3ddc84':'#ff4f6d',10,2);drop=null;}}
  if(A.hit(0).a&&d.has){d.has=false;const b=bld[tgt];const ok=d.x>b.x&&d.x<b.x+b.w&&d.y<H-b.h-4&&d.y>H-b.h-40;drop={x:d.x,y:d.y+8,vy:0,ty:ok?H-b.h-4:H-4,ok};if(ok){g.score+=100;S('score');fx.pop(d.x,H-b.h-24,'DELIVERED +100',K.g);}else{g.score=Math.max(0,g.score-20);S('lose');fx.pop(d.x,d.y-14,'-20',K.r);}newT();}
  if(bld.some(b=>d.x>b.x-4&&d.x<b.x+b.w+4&&d.y>H-b.h-4)){d.y=Math.min(d.y,H-bld.find(b=>d.x>b.x-4&&d.x<b.x+b.w+4).h-5);d.vy=-Math.abs(d.vy)*.5;}if(time<=0)g.over='SHIFT OVER';};
 const box=(x,y)=>{X.block(x-6,y-6,12,12,'#c8853a',1);A.c.fillStyle='#e8d090';A.c.fillRect(x-1,y-6,2,12);};
 g.draw=()=>{const c=A.c;X.cache('drone_bg',()=>{X.sky(['#2a5aa8','#8ac0e8','#ffc890'],H);X.disc(250,150,26,'rgba(255,230,180,.7)');X.glow(250,150,80,'#ffb060',.3);X.skyline(H,'rgba(80,90,140,.5)',0,4,'rgba(255,240,200,.4)');});
  bld.forEach((b,i)=>{const top=H-b.h;c.fillStyle=X.lg(b.x,0,b.x+b.w,0,[X.lt(b.c,1.3),b.c,X.lt(b.c,.7)]);c.fillRect(b.x,top,b.w,b.h);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(b.x,top,b.w,2);for(let y=top+6;y<H-6;y+=10)for(let x=b.x+4;x<b.x+b.w-4;x+=8){c.fillStyle=(x*3+y+i)%5<2?'#ffe08a':'rgba(20,20,40,.8)';c.fillRect(x,y,4,5);}
   if(i===tgt){const p_=Math.sin(A.t*.15)*.5+.5;X.glow(b.x+b.w/2,top-2,22,'#3ddc84',.3+p_*.2);c.fillStyle='#3ddc84';c.fillRect(b.x+3,top-2,b.w-6,2);X.ot('X',b.x+b.w/2,top-16-p_*3,K.g,2,'c');X.poly([[b.x+b.w/2-4,top-6],[b.x+b.w/2+4,top-6],[b.x+b.w/2,top-2]],'#3ddc84');}});
  if(!d.has){X.glow(pick.x,pick.y,10,K.y,.3);box(pick.x,pick.y+Math.sin(A.t*.1));}if(drop)box(drop.x,drop.y);
  const tl=d.vx*.08;c.save();c.translate(d.x,d.y);c.rotate(tl);X.shadow(0,30,8,2,.15);c.fillStyle='#555';c.fillRect(-13,-3,26,2);X.rr(-6,-5,12,8,3,X.lg(0,-5,0,3,['#bff8ff','#2fd6c3','#0e6a66']));X.disc(0,-1,1.6,A.t%30<15?'#ff4f6d':'#3ddc84');for(const o of[-12,12]){c.fillStyle='rgba(230,240,255,'+(A.t%2?.4:.85)+')';c.fillRect(o-7,-6,14,1.4);c.fillStyle='#777';c.fillRect(o-.5,-5,1,3);}if(d.has){c.strokeStyle='#888';c.lineWidth=.6;c.beginPath();c.moveTo(-3,3);c.lineTo(-4,6);c.moveTo(3,3);c.lineTo(4,6);c.stroke();box(0,12);}c.restore();
  fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),d.has?'DROP ON THE X ROOF':'GRAB THE PARCEL');X.meter(110,13,100,3,time/5400,'#3ddc84');};
 return g;}});

/* ---- LASER MAZE ---- */
A.add({id:'lasermaze',name:'LASER MAZE',cat:'PUZZLE',how:'A ROTATES A MIRROR. BOUNCE THE BEAM INTO THE TARGET.',make(){
 const g={over:null,score:0},N=7,fx=X.fx();let grid=[],c={x:3,y:3},lvl=0,src,tgt,path=[],spin={};
 const gen=()=>{lvl++;grid=[];for(let i=0;i<N*N;i++)grid.push(Math.random()<.35?{m:ri(2)}:null);src={x:0,y:ri(N),d:[1,0]};tgt={x:N-1,y:ri(N)};grid[src.y*N+src.x]=null;grid[tgt.y*N+tgt.x]=null;let n=0;while(!solvable()&&n++<200){const i=ri(N*N);if(i!==src.y*N+src.x&&i!==tgt.y*N+tgt.x)grid[i]=Math.random()<.5?{m:ri(2)}:null;}};
 const trace=()=>{path=[];let x=src.x,y=src.y,d=src.d.slice(),n=0;while(n++<60){path.push([x,y]);if(x===tgt.x&&y===tgt.y)return true;const cell=grid[y*N+x];if(cell){if(cell.m===0)d=[-d[1],-d[0]];else d=[d[1],d[0]];}x+=d[0];y+=d[1];if(x<0||y<0||x>=N||y>=N){path.push([x,y]);return false;}}return false;};
 const solvable=()=>{const ms=grid.map((v,i)=>v?i:-1).filter(i=>i>=0);for(let k=0;k<300;k++){if(trace())return true;const i=ms[ri(ms.length)];if(i>=0)grid[i].m^=1;}return trace();};
 gen();for(let k=0;k<30;k++){const ms=grid.map((v,i)=>v?i:-1).filter(i=>i>=0);const i=ms[ri(ms.length)];if(i>=0)grid[i].m^=1;}trace();
 const CS=26,OX=69,OY=29;
 g.update=()=>{for(const k in spin)if(spin[k]>0)spin[k]--;const h=A.hit(0);mvCur(h,c,N,N);if(h.a){const cell=grid[c.y*N+c.x];if(cell){cell.m^=1;spin[c.y*N+c.x]=8;S('blip');if(trace()){g.score+=100;S('score');fx.ring(OX+tgt.x*CS+CS/2,OY+tgt.y*CS+CS/2,'#3ddc84',30);fx.spark(OX+tgt.x*CS+CS/2,OY+tgt.y*CS+CS/2,'#3ddc84',14,2.5);fx.flash('#ffffff',6);if(lvl>=6){g.over='ALL BEAMS ALIGNED! WIN';return;}gen();for(let k=0;k<30;k++){const ms=grid.map((v,i)=>v?i:-1).filter(i=>i>=0);const i=ms[ri(ms.length)];if(i>=0)grid[i].m^=1;}trace();}}else S('lose');}};
 g.draw=()=>{const cx=A.c;X.cache('lmaze_bg',()=>{X.sky(['#100a24','#06040e']);X.rr(OX-6,OY-6,N*CS+12,N*CS+12,6,X.lg(0,OY,0,OY+N*CS,['#3a3a5a','#1a1a2a']));for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS;X.rr(x+1,y+1,CS-2,CS-2,3,(i%N+((i/N)|0))%2?'#1a1636':'#1e1a3e');}});
  const pts=path.map(q=>[OX+q[0]*CS+CS/2,OY+q[1]*CS+CS/2]);if(pts.length>1){X.stroke(pts,'rgba(255,40,80,.25)',7);X.stroke(pts,'#ff4f6d',2.5);X.stroke(pts,'#ffd0d8',1);const e=pts[pts.length-1];X.glow(e[0],e[1],8,'#ff4f6d',.6);}
  for(let i=0;i<N*N;i++){const m=grid[i];if(!m)continue;const x=OX+(i%N)*CS+CS/2,y=OY+((i/N)|0)*CS+CS/2,sp=spin[i]||0,an=(m.m===0?.785:-.785)+(sp?(m.m===0?-1:1)*sp/8*1.5708:0);cx.save();cx.translate(x,y);cx.rotate(an);X.rr(-11,-2.5,22,5,2,X.lg(0,-2.5,0,2.5,['#ffffff','#a8c8e8','#4a6a8a']));cx.fillStyle='rgba(255,255,255,.8)';cx.fillRect(-9,-2,18,1);cx.restore();X.disc(x,y,2,'#5a5a7a');}
  const sx=OX+src.x*CS+CS/2,sy=OY+src.y*CS+CS/2;X.block(sx-10,sy-6,14,12,'#5a5a78',2);X.glow(sx+5,sy,8,'#ff4f6d',.8);X.disc(sx+4,sy,2.5,'#ffd0d8');
  const tx=OX+tgt.x*CS+CS/2,ty=OY+tgt.y*CS+CS/2,lit=path.length&&path[path.length-1][0]===tgt.x&&path[path.length-1][1]===tgt.y;X.glow(tx,ty,14,'#3ddc84',lit?.7:.25);X.disc(tx,ty,9,X.rg(tx,ty,1,tx,ty,9,['#c0ffd0','#3ddc84','#1a6a3a']));X.disc(tx,ty,4,'#0a2a14');X.disc(tx,ty,2,lit?'#ffffff':'#3ddc84');
  cursor(OX+c.x*CS,OY+c.y*CS,CS,CS,'#ffcf3f');fx.draw();X.bar('LEVEL '+lvl+'/6','SCORE '+g.score,'',K.w,K.y);};
 return g;}});

/* ---- NONOGRAM ---- */
A.add({id:'nonogram',name:'NONOGRAM',cat:'PUZZLE',how:'NUMBERS = RUNS OF FILLED CELLS. A FILLS, B MARKS X. SOLVE THE PICTURE.',make(){
 const g={over:null,score:0},N=6,fx=X.fx();let sol=[],b=[],c={x:0,y:0},CU=c,lvl=0,t=0,pop=Array(36).fill(0);
 const clue=arr=>{const o=[];let n=0;arr.forEach(v=>{if(v)n++;else if(n){o.push(n);n=0;}});if(n)o.push(n);return o.length?o:[0];};
 const gen=()=>{lvl++;sol=[];for(let i=0;i<N*N;i++)sol.push(Math.random()<.55?1:0);b=Array(N*N).fill(0);t=0;};gen();
 const rowC=y=>clue(sol.slice(y*N,y*N+N)),colC=x=>clue([...Array(N).keys()].map(y=>sol[y*N+x]));
 const rowOk=y=>JSON.stringify(rowC(y))===JSON.stringify(clue(b.slice(y*N,y*N+N).map(v=>v===1?1:0))),colOk=x=>JSON.stringify(colC(x))===JSON.stringify(clue([...Array(N).keys()].map(y=>b[y*N+x]===1?1:0)));
 const done=()=>[...Array(N).keys()].every(rowOk)&&[...Array(N).keys()].every(colOk);
 const CS=22,OX=120,OY=70;
 g.update=()=>{t++;pop=pop.map(v=>v?v-1:0);const h=A.hit(0);mvCur(h,c,N,N);const i=c.y*N+c.x;if(h.a){b[i]=b[i]===1?0:1;pop[i]=6;S('hit');if(done()){g.score+=Math.max(50,300-(t/60|0)*3);S('score');fx.flash('#ffffff',8);fx.ring(OX+N*CS/2,OY+N*CS/2,'#3ddc84',70,20);fx.pop(OX+N*CS/2,OY-30,'SOLVED!',K.g);if(lvl>=5)g.over='GALLERY COMPLETE! WIN';else gen();}}if(h.b){b[i]=b[i]===2?0:2;S('blip');}};
 g.draw=()=>{const cx=A.c;X.cache('nono_bg',()=>{X.vg(0,0,W,H,['#f4ecd8','#e0d4b8']);X.rr(OX-4,OY-4,N*CS+6,N*CS+6,4,'#5a4a3a');});
  for(let y=0;y<N;y++){const cc=rowC(y),ok=rowOk(y);if(y===CU.y){cx.fillStyle='rgba(255,207,63,.2)';cx.fillRect(OX-70,OY+y*CS,70,CS-1);}cc.forEach((v,i)=>T(v,OX-8-(cc.length-1-i)*12,OY+y*CS+7,ok?'#2a8a3a':'#3a2a1a',1,'l',1));}
  for(let x=0;x<N;x++){const cc=colC(x),ok=colOk(x);if(x===CU.x){cx.fillStyle='rgba(255,207,63,.2)';cx.fillRect(OX+x*CS,OY-64,CS-1,64);}cc.forEach((v,i)=>T(v,OX+x*CS+10,OY-10-(cc.length-1-i)*10,ok?'#2a8a3a':'#3a2a1a',1,'c',1));}
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS,s=pop[i]?1-pop[i]*.04:1;cx.fillStyle='#fffaf0';cx.fillRect(x,y,CS-1,CS-1);if(b[i]===1){const w=(CS-3)*s;X.rr(x+1+(CS-3-w)/2,y+1+(CS-3-w)/2,w,w,2,X.lg(0,y,0,y+CS,['#4a6ab8','#2a3a7a']));}if(b[i]===2){X.stroke([[x+5,y+5],[x+CS-6,y+CS-6]],'#c84a4a',1.4);X.stroke([[x+CS-6,y+5],[x+5,y+CS-6]],'#c84a4a',1.4);}}
  cx.fillStyle='rgba(90,70,50,.6)';for(let k=0;k<=N;k+=3){cx.fillRect(OX+k*CS-1,OY,1.5,N*CS);cx.fillRect(OX,OY+k*CS-1,N*CS,1.5);}
  cursor(OX+CU.x*CS-1,OY+CU.y*CS-1,CS+1,CS+1,'#ff9838');fx.draw();X.bar('PUZZLE '+lvl+'/5','SCORE '+g.score,'',K.w,K.y);T('A FILL   B MARK X',160,226,'#5a4a3a',1,'c');};
 return g;}});

/* ---- SPACE MINER 3D ---- */
A.add({id:'spaceminer',name:'SPACE MINER 3D',cat:'RETRO 3D',hd:1,how:'FLY. A FIRES THE MINING LASER AT ORE ROCKS. DODGE THE GREY ONES. 90 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let px=0,py=0,z=0,rocks=[],time=5400,beam=0,sh=3,inv=0;for(let i=0;i<30;i++)rocks.push({x:rnd(16)-8,y:rnd(10)-5,z:i*4+10,ore:Math.random()<.4,r:.6+rnd(.8),hp:3});
 g.update=()=>{time--;if(inv>0)inv--;const k=A.in(0);px=cl(px+ax(k)*.12,-7,7);py=cl(py-ay(k)*.12,-4,4);z+=.16;if(beam>0)beam--;
  if(A.in(0).a){beam=2;const t=rocks.filter(r=>r.z>z+1&&r.z<z+30&&Math.abs(r.x-px)<r.r+.4&&Math.abs(r.y-py)<r.r+.4).sort((a,b)=>a.z-b.z)[0];if(t&&t.ore){t.hp-=.08;const s=A.p3(t.x,t.y,t.z);if(A.t%4===0)fx.spark(s[0],s[1],K.y,3,1.5);if(t.hp<=0){t.z=-1;g.score+=50;S('coin');fx.spark(s[0],s[1],K.y,14,3);fx.pop(s[0],s[1]-10,'+50',K.y);}}}
  for(const r of rocks){if(r.z<z-2){r.z+=120;r.x=rnd(16)-8;r.y=rnd(10)-5;r.ore=Math.random()<.4;r.hp=3;}if(Math.abs(r.z-z)<r.r&&Math.abs(r.x-px)<r.r+.5&&Math.abs(r.y-py)<r.r+.4&&inv===0){inv=60;sh--;S('boom');fx.flash(K.r,10);r.z=-1;if(sh<=0)g.over='HULL BREACH';}}
  if(time<=0)g.over='SHIFT OVER';};
 g.draw=()=>{X.cache('sminer_bg',()=>{X.sky(['#02010a','#0a0620','#04020c']);X.glow(80,80,110,'#4a1a8a',.3);X.glow(250,170,110,'#0a5a7a',.28);X.stars(110,12,0,0,H,.9);});X.stars(30,17,0,-z*8,H,.7);A.fog={col:'#08041a',near:25,far:60};A.cam.x=px*.5;A.cam.y=py*.5;A.cam.z=z-4;A.cam.ry=0;A.cam.rx=0;
  rocks.forEach(r=>{if(r.z>z-1&&r.z<z+60){const c=r.ore?(r.hp<3?A.mix('#8a5c33','#ffcf3f',1-r.hp/3):'#8a5c33'):'#6a6a78';B3(r.x,r.y-r.r/2,r.z,r.r*1.4,r.r,r.r*1.2,c);B3(r.x+r.r*.2,r.y-r.r*.6,r.z-r.r*.1,r.r*.9,r.r*.4,r.r*.8,c);if(r.ore)B3(r.x,r.y+r.r*.3,r.z,r.r*.5,r.r*.4,r.r*.5,'#ffcf3f');}});A.flush();A.fog=null;
  rocks.forEach(r=>{if(r.ore&&r.z>z+1&&r.z<z+40){const s=A.p3(r.x,r.y+r.r*.4,r.z);if(s[2]>.1)X.glow(s[0],s[1],Math.min(30,120/s[2]),'#ffcf3f',.25);}});
  const s=A.p3(px,py,z+1.5);if(beam){const t=rocks.filter(r=>r.z>z+1&&Math.abs(r.x-px)<r.r+.4&&Math.abs(r.y-py)<r.r+.4).sort((a,b)=>a.z-b.z)[0];const e=t?A.p3(t.x,t.y,t.z):A.p3(px,py,z+30);X.stroke([[s[0],s[1]-3],[e[0],e[1]]],'rgba(61,255,139,.35)',5);X.stroke([[s[0],s[1]-3],[e[0],e[1]]],'#c8ffd8',1.5);X.glow(e[0],e[1],10,'#3ddc84',.6);}
  if(inv%6<4){X.glow(s[0],s[1]+6,8,'#ff8030',.5);X.poly([[s[0],s[1]-8],[s[0]-13,s[1]+6],[s[0],s[1]+2],[s[0]+13,s[1]+6]],X.lg(s[0]-13,0,s[0]+13,0,['#2a8aa0','#bff8ff','#2a8aa0']));X.disc(s[0],s[1]-1,1.8,'#ff4f9a');}
  fx.draw();X.bar('ORE '+g.score,'',''+Math.ceil(time/60));for(let i=0;i<3;i++)X.heart(W-10-i*11,8,1,i<sh?'#2fd6c3':'rgba(255,255,255,.15)');};
 return g;}});

/* ---- RAIL BLASTER 3D ---- */
A.add({id:'rail',name:'RAIL BLASTER 3D',cat:'RETRO 3D',hd:1,mouse:1,how:'AIM WITH MOUSE OR ARROWS. CLICK TO FIRE. SURVIVE 10 WAVES.',make(){
 const g={over:null,score:0},fx=X.fx();let z=0,cx=0,cy=1.5,en=[],hp=5,wave=0,fl=0,inv=0,left=0,msg=0;const spawn=()=>{wave++;left=4+wave;msg=90;};spawn();
 g.update=()=>{z+=.05;if(fl>0)fl--;if(inv>0)inv--;if(msg)msg--;const k=A.in(0);cx=cl(cx+ax(k)*.09+A.mouse.dx*.025,-4,4);cy=cl(cy-ay(k)*.09-A.mouse.dy*.025,.3,3.2);
  if(left>0&&Math.random()<.03){left--;en.push({x:rnd(8)-4,y:.6,z:z+12+rnd(10),t:0,up:0,cd:90+ri(60),hp:1,mz:0});}
  for(const e of en){e.t++;if(e.mz)e.mz--;e.up=Math.min(1,e.t/25);e.z-=.03;if(--e.cd<=0){e.cd=120;e.mz=6;if(inv===0){hp--;inv=50;S('hit');A.shake=5;if(hp<=0)g.over='RAIL DERAILED  WAVE '+wave;}}if(e.z<z+1)e.hp=0;}
  if(A.fire(10)){fl=4;S('shoot');const best=en.filter(e=>e.hp>0).map(e=>{const sx=e.x/(e.z-z)*8,sy=(e.y+.8*e.up-1.5)/(e.z-z)*8;return{e,d:Math.hypot(sx-cx*8/(e.z-z)*(e.z-z)/8,sy-(cy-1.5))};}).filter(o=>Math.abs(o.e.x-cx)<.9&&Math.abs(o.e.y+.8*o.e.up-cy)<.9).sort((a,b)=>a.e.z-b.e.z)[0];if(best){best.e.hp=0;g.score+=100;S('boom');const s=A.p3(best.e.x,best.e.y+.8*best.e.up-.2,best.e.z);fx.spark(s[0],s[1],K.o,16,3);fx.debris(s[0],s[1],'#8a3a3a',8,2.5);fx.pop(s[0],s[1]-14,'+100',K.y);}}
  en=en.filter(e=>e.hp>0);if(left===0&&!en.length){if(wave>=10){g.over='RAIL CLEARED! WIN';return;}hp=Math.min(5,hp+1);S('win');spawn();}};
 g.draw=()=>{A.skyband('#1a0a4a','#ff7a59',120);X.disc(250,96,22,'rgba(255,200,140,.7)');X.hills(122,24,'#4a2a5a',z*20,.03,3);A.c.fillStyle='#2a2a38';A.c.fillRect(0,120,W,120);A.fog={col:'#5a3a6a',near:14,far:40};A.cam.x=0;A.cam.y=1.6;A.cam.z=z;A.cam.ry=cx*.06;A.cam.rx=(cy-1.5)*.08;
  for(let zz=Math.floor(z)+1;zz<z+35;zz+=2){F([[-.6,0,zz],[.6,0,zz],[.6,0,zz+2],[-.6,0,zz+2]],'#5a4a3a');B3(-.5,0,zz,.12,.12,2,'#c8c8d8');B3(.5,0,zz,.12,.12,2,'#c8c8d8');F([[-5,-.05,zz],[5,-.05,zz],[5,-.05,zz+2],[-5,-.05,zz+2]],(zz/2)%2?'#3a3a44':'#40404c');if(zz%6===1){B3(-4,0,zz,1.2,1.4,1.2,'#6a6a78');B3(4,0,zz,1.2,1.4,1.2,'#6a6a78');}}
  en.forEach(e=>{const y0=e.y-.6+.8*e.up;B3(e.x,y0-.4,e.z,.8,.8,.6,'#8a3a3a');B3(e.x,y0+.4,e.z,.5,.4,.5,'#ff4f6d');B3(e.x,y0+.1,e.z-.35,.15,.15,.4,K.k);});A.flush();A.fog=null;
  en.forEach(e=>{const y0=e.y-.6+.8*e.up,s=A.p3(e.x,y0+.6,e.z-.3);if(s[2]>.1){X.glow(s[0],s[1],5,'#ff3040',.6);if(e.mz)X.glow(s[0],s[1]+4,14,'#ffe080',.9);}});
  const s=A.p3(cx,cy,z+8),r=8+(fl?2:0);X.glow(s[0],s[1],14,'#3ddc84',.15);A.ring(s[0],s[1],r,'#3ddc84');for(let i=0;i<4;i++){const a=i*1.5708+A.t*.03;X.stroke([[s[0]+Math.cos(a)*(r+2),s[1]+Math.sin(a)*(r+2)],[s[0]+Math.cos(a)*(r+7),s[1]+Math.sin(a)*(r+7)]],'#3ddc84',1.4);}X.disc(s[0],s[1],1,'#ffffff');
  if(fl){A.c.fillStyle='rgba(255,255,200,.12)';A.c.fillRect(0,0,W,H);X.glow(W-40,H-20,40,'#ffe080',.5);}if(inv>40){A.c.fillStyle='rgba(255,0,0,.25)';A.c.fillRect(0,0,W,H);}
  fx.draw();X.bar('WAVE '+wave+'/10','','SCORE '+g.score);for(let i=0;i<5;i++)X.heart(W-10-i*11,8,1,i<hp?'#ff4f6d':'rgba(255,255,255,.15)');if(msg&&msg<80)X.ot('WAVE '+wave,160,90,K.y,3,'c');};
 return g;}});

/* ---- SKEE BALL ---- */
A.add({id:'skee',name:'SKEE BALL',cat:'SPORTS',how:'LEFT/RIGHT AIM. A LOCKS POWER. 9 BALLS. RING SCORES 10 TO 50.',make(){
 const g={over:null,score:0},fx=X.fx(),RC=['#4dabff','#3ddc84','#ffcf3f','#ff9838','#ff4f6d'];let ang=0,pw=0,ph=0,t=0,ball=null,n=0,msg='',mt=0,lit=-1,litT=0;
 const pr=(x,z,h)=>{const s=1/(1+z*.15);return[160+x*30*s,225-(1-s)*190-(h||0)*20*s,s];};
 g.update=()=>{t++;if(mt>0)mt--;if(litT)litT--;if(ball){ball.z+=ball.v;ball.x+=ball.vx;ball.v*=.99;ball.sp+=ball.v;if(ball.z>16){ball.z=16;ball.air=true;}if(ball.air){ball.vy=(ball.vy||ball.v*3)-.5;ball.h=(ball.h||0)+ball.vy;if(ball.h<0){const d=Math.hypot(ball.x,ball.h0-8);const p=d<1.2?50:d<2.4?40:d<3.6?30:d<4.8?20:10;g.score+=p;msg='+'+p;mt=50;lit=[10,20,30,40,50].indexOf(p);litT=40;S(p>=40?'score':'hit');const c=pr(0,16,4);fx.spark(c[0],c[1]-(5-lit)*6,RC[lit],p>=40?18:8,2.5);if(p===50)fx.flash('#ffffff',6);ball=null;n++;ph=0;t=0;if(n>=9)g.over=g.score+' POINTS';}}return;}
  const h=A.hit(0),k=A.in(0);if(ph===0){ang=cl(ang+ax(k)*.02,-.3,.3);if(h.a){ph=1;t=0;}}else{pw=.5+.5*Math.sin(t*.08);if(h.a){ball={x:0,z:0,v:.25+pw*.35,vx:Math.sin(ang)*.15,h:0,h0:6+pw*8,sp:0};S('shoot');}}};
 const bg=()=>{X.vg(0,0,W,H,['#1a0a2a','#3a1a3a']);const c=A.c;for(let i=0;i<14;i++){X.glow(10+i*24,8,8,['#ff4f6d','#ffcf3f','#2fd6c3'][i%3],.5);X.disc(10+i*24,8,2,'#ffffff');}
  const q=[pr(-3.6,0),pr(3.6,0),pr(3.6,16),pr(-3.6,16)];X.poly(q.map(v=>[v[0],v[1]]),'#5a3a1a');const ln=[pr(-3,0),pr(3,0),pr(3,16),pr(-3,16)];X.poly(ln.map(v=>[v[0],v[1]]),X.lg(0,ln[2][1],0,ln[0][1],['#c8904a','#f0c070']));c.strokeStyle='rgba(120,70,20,.3)';c.lineWidth=1;for(let i=-2;i<=2;i++){const a=pr(i,0),b=pr(i,16);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();}
  const cc=pr(0,16,4);X.rr(cc[0]-80,cc[1]-70,160,80,10,X.lg(0,cc[1]-70,0,cc[1]+10,['#4a2a5a','#2a1438']));};
 g.draw=()=>{X.cache('skee_bg',bg);const c=A.c,cc=pr(0,16,4);
  [[5,10],[4,20],[3,30],[2,40],[1,50]].forEach((rg,i)=>{const on=litT&&lit===i&&A.t%8<5,col=RC[i];X.ell(cc[0],cc[1]-rg[0]*6,rg[0]*14+1.5,rg[0]*8+1.5,'#1a0a1a');X.ell(cc[0],cc[1]-rg[0]*6,rg[0]*14,rg[0]*8,X.lg(0,cc[1]-rg[0]*14,0,cc[1],[on?'#ffffff':X.lt(col,1.3),col]));X.ell(cc[0],cc[1]-rg[0]*6+rg[0]*2,rg[0]*11,rg[0]*5.5,'rgba(0,0,0,.35)');T(rg[1],cc[0]+rg[0]*14-6,cc[1]-rg[0]*6-rg[0]*8-1,'#ffffff',1,'c');});
  if(ball){const v=pr(ball.x,ball.z,ball.h),sh=pr(ball.x,Math.min(ball.z,16),0);X.shadow(sh[0],sh[1],7*sh[2],2.5*sh[2],.3);X.orb(v[0],v[1],7*v[2]+1,'#e8d0b0');}
  else{const a=pr(0,0),b=pr(Math.sin(ang)*8,10);c.globalAlpha=.8;for(let i=1;i<8;i++){const f=i/8;X.disc(a[0]+(b[0]-a[0])*f,a[1]-6+(b[1]-a[1]+6)*f,1.6-f,'#ffcf3f');}c.globalAlpha=1;X.orb(a[0],a[1]-6,8,'#e8d0b0');if(ph===1){X.panel(5,57,16,106,'#ffffff');X.rr(8,60,10,100,4,'rgba(0,0,0,.4)');X.rr(9,158-pw*96,8,pw*96,3,X.lg(0,158,0,62,['#3ddc84','#ffcf3f','#ff4f6d']));}}
  fx.draw();X.bar('SCORE '+g.score,'BALL '+Math.min(n+1,9)+'/9');if(mt>0)X.ot(msg,160,40,K.y,3,'c');};
 return g;}});

/* ---- SUSHI STACK ---- */
A.add({id:'sushi',name:'SUSHI STACK',cat:'PUZZLE',how:'MOVE THE PLATE. CATCH FALLING SUSHI, DODGE WASABI. STACK HIGH. 3 MISSES.',make(){
 const g={over:null,score:0},fx=X.fx();let px=160,items=[],stack=0,miss=0,t=0,wob=0,lean=0;
 g.update=()=>{t++;const opx=px;px=cl(px+ax(A.in(0))*3.4,20,W-20);lean+=((px-opx)*-.04-lean)*.15;if(wob)wob--;if(t%Math.max(18,50-(t/100|0))===0)items.push({x:rnd(W-40)+20,y:-10,v:1.5+rnd(1.5)+t/2000,k:Math.random()<.2?'w':['s','m','r','t'][ri(4)],r:rnd(.6)-.3});
  for(const it of items){it.y+=it.v;const top=200-stack*6;if(it.y>top-6&&it.y<top+4&&Math.abs(it.x-px)<18){it.dead=1;wob=10;if(it.k==='w'){miss++;stack=Math.max(0,stack-3);S('boom');fx.spark(px,top,'#7ad04a',14,3);fx.flash('#7ad04a',6);fx.pop(px,top-16,'WASABI!',K.g);if(miss>=3)g.over='STACK TOPPLED';}else{stack++;const pts=10*Math.min(5,1+stack/5|0);g.score+=pts;S('coin');fx.ring(px,top,'#ffffff',14,10);fx.pop(px,top-16,'+'+pts,K.y);}}else if(it.y>H){it.dead=1;if(it.k!=='w'){miss++;S('lose');if(miss>=3)g.over='TOO MANY DROPPED';}}}items=items.filter(i=>!i.dead);};
 const piece=(k,x,y,r)=>{const c=A.c;c.save();c.translate(x,y);if(r)c.rotate(r);if(k==='w'){X.orb(0,0,5,'#7ad04a');c.fillStyle='rgba(255,255,255,.4)';c.fillRect(-2,-3,2,1);}else{X.rr(-8,-2,16,6,3,X.lg(0,-2,0,4,['#ffffff','#e8e4d8']));c.fillStyle='rgba(0,0,0,.06)';c.fillRect(-6,0,12,1);if(k==='m'){X.rr(-8,-5,16,8,3,'#1a2a1a');X.rr(-6,-4,12,4,2,'#ff7a5a');}else{const col=k==='s'?'#ff8a5a':k==='r'?'#e83a4a':'#ffcf3f';X.rr(-8.5,-6,17,5,2.5,X.lg(0,-6,0,-1,[X.lt(col,1.4),col]));c.fillStyle='rgba(255,255,255,.45)';for(let i=-6;i<7;i+=4)c.fillRect(i,-5.5,1.5,4);if(k==='t'){c.fillStyle='#1a2a1a';c.fillRect(-1.5,-6,3,10);}}}c.restore();};
 g.draw=()=>{const c=A.c;X.cache('sushi_bg',()=>{X.vg(0,0,W,200,['#3a1a1a','#5a2a2a']);const cc=A.c;for(let x=0;x<W;x+=40){cc.fillStyle='rgba(255,220,180,.06)';cc.fillRect(x,0,2,200);}for(const lx of[50,160,270]){X.glow(lx,30,40,'#ffb060',.3);X.ell(lx,30,10,14,X.lg(0,16,0,44,['#ff6040','#c02020']));cc.fillStyle='#2a1010';cc.fillRect(lx-5,15,10,2);cc.fillRect(lx-5,43,10,2);}X.wood(0,200,W,40,'#a87444');cc.fillStyle='rgba(255,230,190,.25)';cc.fillRect(0,200,W,2);});
  items.forEach(i=>{X.shadow(i.x,205,6,1.4,.2);piece(i.k,i.x,i.y,i.r+A.t*.02*(i.k==='w'?0:1));});
  const w=wob?Math.sin(wob*.9)*.04:0;c.save();c.translate(px,201);X.shadow(0,3,22,3,.3);X.ell(0,0,20,4,X.lg(0,-4,0,4,['#ffffff','#c8c8d0']));X.ell(0,-1,14,2,'#e8e8f0');for(let i=0;i<stack;i++){c.rotate(lean*.08+w);piece(['s','m','r','t'][i%4],0,-6,0);c.translate(0,-6);}c.restore();
  fx.draw();X.bar('SCORE '+g.score,'','STACK '+stack);for(let i=0;i<3;i++)X.heart(W-10-i*11,8,1,i<3-miss?'#ff4f6d':'rgba(255,255,255,.15)');};
 return g;}});
})();
