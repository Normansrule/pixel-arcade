(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const kart=(x,y,z,a,col)=>{const c=Math.cos(a),s=Math.sin(a),P=(px,py,pz)=>[x+px*c-pz*s,y+py,z+px*s+pz*c];A.shadow3(x,z,1.2,1.6);const q=(p1,p2,p3,p4,cc)=>F([P(...p1),P(...p2),P(...p3),P(...p4)],cc);
 q([-.4,.15,-.7],[.4,.15,-.7],[.4,.4,-.5],[-.4,.4,-.5],col);q([-.4,.4,-.5],[.4,.4,-.5],[.4,.4,.5],[-.4,.4,.5],col);q([-.4,.15,-.7],[-.4,.4,-.5],[-.4,.4,.5],[-.4,.15,.7],col);q([.4,.15,.7],[.4,.4,.5],[.4,.4,-.5],[.4,.15,-.7],col);q([-.2,.4,.1],[.2,.4,.1],[.2,.75,.2],[-.2,.75,.2],'#ffd9a8');q([-.25,.75,.05],[.25,.75,.05],[.25,.85,.3],[-.25,.85,.3],K.r);
 [[-.45,-.5],[.45,-.5],[-.45,.5],[.45,.5]].forEach(w=>{const wp=P(w[0],.18,w[1]);A.cyl3(wp[0],wp[1],wp[2],.18,.16,'#151515',8,'x');});};

/* ---- KART CUP 3D ---- */
A.add({id:'kart',name:'KART CUP 3D',cat:'RETRO 3D',hd:1,how:'UP GAS. STEER. 3 LAPS VS 5 KARTS. BOOST PADS ARE YELLOW.',make(){
 const g={over:null,score:0},LEN=400;const cx=z=>Math.sin(z*.05)*6+Math.sin(z*.021)*4;
 let p={d:0,x:0,v:0,lap:0},ai=[],boost=0,fin=false,res=0;for(let i=0;i<5;i++)ai.push({d:6+i*3,x:(i%2?1.5:-1.5),v:.16+rnd(.05)+i*.01,c:[K.r,K.y,K.p,K.o,K.w][i],lap:0});
 const pads=[60,180,300];
 g.update=()=>{if(fin){return;}const k=A.in(0);p.v+=k.u||k.a?.004:-.002;if(k.d)p.v-=.006;const off=Math.abs(p.x)>6.5;p.v=cl(p.v,0,off?.14:boost>0?.36:.27);if(boost>0)boost--;p.x+=ax(k)*.15;p.x=cl(p.x,-9,9);const old=p.d;p.d+=p.v;
  if(pads.some(z=>(old%LEN)<z&&(p.d%LEN)>=z)&&Math.abs(p.x-(cx(p.d)+cx(p.d))*0)<8&&Math.abs(p.x)<3){boost=90;S('coin');}
  if(Math.floor(p.d/LEN)>Math.floor(old/LEN)){p.lap++;S('score');if(p.lap>=3){fin=true;res=1+ai.filter(q=>q.d>p.d).length;g.score=[0,1000,600,400,250,150,100][res];g.over=['','1ST PLACE! WIN','2ND PLACE','3RD PLACE','4TH','5TH','6TH'][res];return;}}
  for(const q of ai){q.d+=q.v*(Math.abs(q.x)>6.5?.6:1);q.x+=(Math.sin(q.d*.03)*3-q.x)*.02;const pd=q.d-p.d;if(Math.abs(pd)<1.4&&Math.abs(q.x-p.x)<1){p.v*=.6;q.v=Math.max(.14,q.v*.9);p.x+=p.x<q.x?-.3:.3;S('hit');}}};
 g.draw=()=>{A.skyband('#1a2a6a','#ff9838',130);C(160,118,22,'#ffd75a');R(0,130,W,110,'#3f8a3a');A.fog={col:'#c78a5a',near:16,far:36};A.cam.x=cx(p.d-4)+p.x*.8;A.cam.z=p.d-4;A.cam.y=1.6;A.cam.ry=0;A.cam.rx=-.2;
  for(let z=Math.floor(p.d)-2;z<p.d+34;z++){const a=cx(z),b=cx(z+1);F([[a-7,0,z],[a+7,0,z],[b+7,0,z+1],[b-7,0,z+1]],z%2?'#4a4a55':'#3e3e48');F([[a-7.6,0,z],[a-7,0,z],[b-7,0,z+1],[b-7.6,0,z+1]],z%2?K.r:K.w);F([[a+7,0,z],[a+7.6,0,z],[b+7.6,0,z+1],[b+7,0,z+1]],z%2?K.r:K.w);const zm=((z%LEN)+LEN)%LEN;if(pads.includes(zm))F([[a-3,.02,z],[a+3,.02,z],[b+3,.02,z+1],[b-3,.02,z+1]],K.y,false);if(zm===0)for(let i=-7;i<7;i++)F([[a+i,.03,z],[a+i+1,.03,z],[b+i+1,.03,z+1],[b+i,.03,z+1]],(i+z)%2?K.w:K.k,false);}
  ai.forEach(q=>{let rel=q.d-p.d;if(rel<-3||rel>34)return;kart(cx(q.d)+q.x,0,q.d,0,q.c);});kart(cx(p.d)+p.x,0,p.d,ax(A.in(0))*.3,K.c);A.flush();A.fog=null;
  const pos=1+ai.filter(q=>q.d>p.d).length;T('LAP '+Math.min(p.lap+1,3)+'/3',6,4,K.w,2);T(Math.round(p.v*900)+' KMH',160,4,boost>0?K.y:K.w,2,'c');T(['','1ST','2ND','3RD','4TH','5TH','6TH'][pos],W-6,4,pos===1?K.y:K.w,3,'r');};
 return g;}});

/* ---- SKY ACE 3D ---- */
A.add({id:'skyace',name:'SKY ACE 3D',cat:'RETRO 3D',hd:1,how:'FLY. A FIRES. SHOOT DOWN 20 ENEMY PLANES.',make(){
 const g={over:null,score:0};let px=0,py=2,z=0,bl=[],en=[],hp=5,inv=0,kills=0,roll=0;const spawn=()=>en.push({x:rnd(10)-5,y:1+rnd(4),z:z+50+rnd(20),vx:rnd(.06)-.03,cd:60+ri(90)});for(let i=0;i<4;i++)spawn();
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.12,-6,6);py=cl(py-ay(k)*.1,.5,6);roll+=(ax(k)*.5-roll)*.1;z+=.2;if(inv>0)inv--;if(A.hit(0).a&&bl.length<6){bl.push({x:px-.5,y:py,z:z+1});bl.push({x:px+.5,y:py,z:z+1});S('shoot');}
  bl.forEach(b=>b.z+=1);bl=bl.filter(b=>b.z<z+60);
  for(const e of en){e.z-=.12;e.x+=e.vx;if(Math.abs(e.x)>6)e.vx*=-1;e.x+=(px-e.x)*.002;for(const b of bl)if(Math.abs(b.z-e.z)<1.2&&Math.abs(b.x-e.x)<.9&&Math.abs(b.y-e.y)<.7){e.dead=1;b.z=999;kills++;g.score+=100;S('boom');}
   if(--e.cd<=0){e.cd=120;if(Math.abs(e.x-px)<1.5&&Math.abs(e.y-py)<1.2&&inv===0){hp--;inv=60;S('hit');if(hp<=0)g.over='SHOT DOWN';}}if(e.z<z-2){e.dead=1;}if(Math.abs(e.z-z)<1&&Math.abs(e.x-px)<1&&Math.abs(e.y-py)<.8&&inv===0){e.dead=1;hp--;inv=60;S('boom');if(hp<=0)g.over='COLLISION';}}
  en=en.filter(e=>!e.dead);while(en.length<4+kills/5)spawn();if(kills>=20)g.over='ACE! WIN';};
 g.draw=()=>{A.skyband('#1a4aa8','#bfe4ff',150);R(0,150,W,90,'#3f8a3a');A.fog={col:'#9fc8ee',near:25,far:65};A.cam.x=px*.6;A.cam.y=py*.6+1.5;A.cam.z=z-4;A.cam.ry=0;A.cam.rx=-.08;
  for(let i=0;i<10;i++){const cz=z+((i*17)%60)+5,cxx=((i*31)%24)-12;B3(cxx,5+(i%3),cz,3+(i%2),.6,1.5,'#f4f8ff');}for(let zz=Math.floor(z/4)*4;zz<z+60;zz+=4)for(let x=-16;x<=16;x+=8)F([[x,0,zz],[x+8,0,zz],[x+8,0,zz+4],[x,0,zz+4]],((x+zz)/4)%2?'#3f8a3a':'#377f33');
  en.forEach(e=>{B3(e.x,e.y,e.z,.5,.3,1.4,K.r);B3(e.x,e.y+.1,e.z-.1,2.2,.12,.5,K.r);B3(e.x,e.y+.2,e.z-.6,.1,.4,.3,'#8a1d33');});
  bl.forEach(b=>B3(b.x,b.y,b.z,.1,.1,.6,K.y));if(inv%6<4){const c=Math.cos(roll),s=Math.sin(roll);B3(px,py,z,.5,.3,1.6,K.c);F([[px-2.4*c,py+2.4*s+.1,z-.2],[px+2.4*c,py-2.4*s+.1,z-.2],[px+2.4*c,py-2.4*s+.1,z+.4],[px-2.4*c,py+2.4*s+.1,z+.4]],'#178a7d');B3(px,py+.3,z-.7,.1,.5,.3,K.c);}A.flush();A.fog=null;
  T('KILLS '+kills+'/20',6,4,K.y,2);T('ARMOUR '+'|'.repeat(hp),W-6,4,hp<2?K.r:K.w,2,'r');};
 return g;}});

/* ---- SNIPER ALLEY 3D ---- */
A.add({id:'sniper',name:'SNIPER ALLEY 3D',cat:'RETRO 3D',hd:1,how:'MOVE THE SCOPE. HOLD B TO ZOOM. A FIRES. HIT 15 TARGETS.',make(){
 const g={over:null,score:0};let cx=0,cy=1.5,tg=[],hits=0,ammo=25,fl=0,zoom=1;const spawn=()=>tg.push({x:rnd(16)-8,y:1+rnd(2),z:14+rnd(22),t:0,life:200+ri(100),up:0});for(let i=0;i<3;i++)spawn();
 g.update=()=>{const k=A.in(0);zoom+=((k.b?2.6:1)-zoom)*.15;const sp=.06/zoom;cx=cl(cx+ax(k)*sp*3,-3,3);cy=cl(cy-ay(k)*sp*3,.2,3.5);if(fl>0)fl--;
  for(const t of tg){t.t++;t.up=Math.min(1,t.t/20);if(t.t>t.life){t.dead=1;}}tg=tg.filter(t=>!t.dead);while(tg.length<3)spawn();
  if(A.hit(0).a&&ammo>0){ammo--;fl=4;S('shoot');const ray={x:cx,y:cy};let best=null,bd=1e9;for(const t of tg){const sx=t.x/t.z*12,sy=(t.y-1.5)/t.z*12;const d=Math.hypot(sx-ray.x,sy-(ray.y-1.5));if(d<.9*12/t.z*.9+.05&&t.z<bd){bd=t.z;best=t;}}if(best){best.dead=1;hits++;g.score+=Math.round(best.z*10);S('hit');if(hits>=15)g.over='MISSION COMPLETE! WIN';}else if(ammo===0)g.over='OUT OF AMMO';}};
 g.draw=()=>{A.skyband('#6a4aaa','#ffb070',120);R(0,120,W,120,'#6a6a78');A.fog={col:'#c08a8a',near:18,far:50};A.cam.x=0;A.cam.y=1.5;A.cam.z=0;A.cam.ry=cx*.14/zoom*0+cx*.1;A.cam.rx=(cy-1.5)*.1;A.cam.f=210*zoom;
  for(let z=4;z<44;z+=4){B3(-10,0,z,3,4+(z%3)*2,4,'#8a8aa8');B3(10,0,z,3,3+(z%5),4,'#9a9ab0');F([[-8,0,z],[8,0,z],[8,0,z+4],[-8,0,z+4]],(z/4)%2?'#6a6a78':'#74748a');}
  tg.forEach(t=>{const h=1.6*t.up;B3(t.x,t.y-.4,t.z,.5,h,.3,'#8a3a3a');B3(t.x,t.y-.4+h,t.z,.4,.4*t.up,.4,'#ffd9a8');B3(t.x,t.y-.4+h*.6,t.z-.2,.5,.3,.1,K.y);});A.flush();A.fog=null;A.cam.f=210;
  A.c.fillStyle='rgba(0,0,0,.92)';A.c.beginPath();A.c.rect(0,0,W,H);A.c.arc(160,120,zoom>1.5?95:150,0,6.283,true);A.c.fill();L(160-20,120,160+20,120,K.k);L(160,100,160,140,K.k);A.ring(160,120,6,K.k);if(fl>0)R(0,0,W,H,'rgba(255,255,255,.25)');
  T('HITS '+hits+'/15',6,4,K.y,2);T('AMMO '+ammo,W-6,4,ammo<5?K.r:K.w,2,'r');T('HOLD B TO ZOOM',160,226,K.gr,1,'c');};
 return g;}});
})();
