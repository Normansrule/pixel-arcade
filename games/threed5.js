/* RETRO 3D pack 5: sixteen pseudo-3D cabinets on the engine's painter renderer.
   Shared kit: culled model boxes/cylinders/spheres, layered passes (ground -> decals -> objects), roll, gradient skies, 3D particles. */
(function(){'use strict';const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face;
const sin=Math.sin,cos=Math.cos,abs=Math.abs,hyp=Math.hypot,PI=Math.PI,TAU=PI*2,atan=Math.atan,atan2=Math.atan2,sq=Math.sqrt,mn=Math.min,mx=Math.max,fl=Math.floor;
const lerp=(a,b,t)=>a+(b-a)*t,ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),wrapA=a=>a-TAU*Math.round(a/TAU),ORD=n=>n+(n===1?'ST':n===2?'ND':n===3?'RD':'TH');
/* ---------- camera + screen helpers ---------- */
const cam=(x,y,z,ry,rx,f)=>{const c=A.cam;c.x=x;c.y=y;c.z=z;c.ry=ry||0;c.rx=rx||0;c.f=f||210;};
const hzY=()=>120+A.cam.f*Math.tan(cl(A.cam.rx,-1.5,1.5));
const alpha=(a,fn)=>{A.c.globalAlpha=a;fn();A.c.globalAlpha=1;};
const lg=(x0,y0,x1,y1,st)=>{const c=A.c,g=c.createLinearGradient?c.createLinearGradient(x0,y0,x1,y1):null;if(g&&g.addColorStop){for(const s of st)g.addColorStop(s[0],s[1]);return g;}return st[st.length>>1][1];};
const fillG=(x,y,w,h,st)=>{if(!(h>0)||!(w>0))return;A.c.fillStyle=lg(x,y,x,y+h,st);A.c.fillRect(x,y,w,h);};
const glow=(x,y,r,rgb,a)=>{if(!(r>.5)||!isFinite(x)||!isFinite(y)||x<-r-60||x>W+r+60||y<-r-60||y>H+r+60)return;const c=A.c,g=c.createRadialGradient?c.createRadialGradient(x,y,0,x,y,r):null;if(g&&g.addColorStop){g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(1,'rgba('+rgb+',0)');c.fillStyle=g;}else c.fillStyle='rgba('+rgb+','+(a*.3)+')';c.fillRect(x-r,y-r,r*2,r*2);};
const roll=a=>{const c=A.c;c.save();c.translate(160,120);c.rotate(a);c.translate(-160,-120);},unroll=()=>A.c.restore();
const sky=(top,bot,hz,gTop,gBot)=>{if(hz>-120)fillG(-140,-140,600,mn(hz,400)+141,[[0,top],[1,bot]]);if(gTop&&hz<380){const y=mx(hz,-140);fillG(-140,y,600,380-y,[[0,gTop],[1,gBot||gTop]]);}};
const sun=(x,y,r,rgb,col)=>{glow(x,y,r*5,rgb,.35);glow(x,y,r*2.2,rgb,.5);C(x,y,r,col||'#fff6d8');};
const ridge=(hz,col,amp,seed,shift,step)=>{const c=A.c;c.fillStyle=col;c.beginPath();c.moveTo(-140,hz+3);for(let x=-140;x<=460;x+=step||8){const u=(x+shift)*.011+seed;c.lineTo(x,hz-amp*(.55+.28*sin(u)+.17*sin(u*2.7+seed)+.09*sin(u*6.3)));}c.lineTo(460,hz+3);c.closePath();c.fill();};
const speedLines=(amt,cx,cy,rgb)=>{if(!(amt>.03))return;const c=A.c;c.strokeStyle='rgba('+(rgb||'255,255,255')+','+mn(.55,amt*.7)+')';c.lineWidth=1;c.beginPath();const n=fl(5+amt*20);for(let i=0;i<n;i++){const a=((i*137.5+A.t*37)%360)*PI/180,r0=60+((i*53+A.t*23)%110),r1=r0+8+amt*46;c.moveTo(cx+cos(a)*r0,cy+sin(a)*r0*.75);c.lineTo(cx+cos(a)*r1,cy+sin(a)*r1*.75);}c.stroke();};
const vign=(a,rgb)=>{const c=A.c,g=c.createRadialGradient?c.createRadialGradient(160,120,80,160,120,230):null;if(g&&g.addColorStop){g.addColorStop(0,'rgba('+(rgb||'0,0,0')+',0)');g.addColorStop(1,'rgba('+(rgb||'0,0,0')+','+a+')');c.fillStyle=g;c.fillRect(0,0,W,H);}};
const bar=(y,h,a)=>alpha(a||.42,()=>R(0,y,W,h,'#000000'));
const meter=(x,y,w,h,f,col,bg)=>{R(x,y,w,h,bg||'#15122a');const v=cl(f,0,1)*(w-2);if(v>0)R(x+1,y+1,v,h-2,col);};
const pop=(s,col,y)=>{if(!A.silent)A.fx.push({txt:s,x:160,y:y||70,vx:0,vy:-.4,t:50,c:col||K.y,g:0});};
const P2=(x,y,z)=>{const p=A.p3(x,y,z);return p[2]>.1?p:null;};
/* ---------- 3D primitives (back-face culled) ---------- */
const ID=(x,y,z)=>[x,y,z];
const xf=(ox,oy,oz,yaw,pit,rol,s)=>{const cy=cos(yaw||0),sy=sin(yaw||0),cp=cos(pit||0),sp=sin(pit||0),cr=cos(rol||0),sr=sin(rol||0);s=s||1;return(x,y,z)=>{x*=s;y*=s;z*=s;const X=x*cr-y*sr,Y=x*sr+y*cr,Y2=Y*cp+z*sp,Z2=-Y*sp+z*cp;return[ox+X*cy+Z2*sy,oy+Y2,oz-X*sy+Z2*cy];};};
const sub=(P,ox,oy,oz,a,rz)=>{const c=cos(a||0),s=sin(a||0),c2=cos(rz||0),s2=sin(rz||0);return(x,y,z)=>{const X=x*c2-y*s2,Y=x*s2+y*c2;return P(ox+X,oy+Y*c-z*s,oz+Y*s+z*c);};};
const cf=(pts,col,o,sh)=>{const a=pts[0],b=pts[1],c=pts[2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;let mx_=0,my_=0,mz_=0;for(const p of pts){mx_+=p[0];my_+=p[1];mz_+=p[2];}const n=pts.length;mx_/=n;my_/=n;mz_/=n;const cm=A.cam,s=nx*(mx_-o[0])+ny*(my_-o[1])+nz*(mz_-o[2]),v=nx*(cm.x-mx_)+ny*(cm.y-my_)+nz*(cm.z-mz_);if(s*v<=0)return;F(pts,col,sh);};
const BX=[[3,2,6,7],[0,1,2,3],[4,7,6,5],[0,3,7,4],[1,5,6,2],[0,4,5,1]];
const mbox=(P,x,y,z,w,h,d,col,top,sd)=>{const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2,t=y+h,v=[P(a,y,c),P(b,y,c),P(b,t,c),P(a,t,c),P(a,y,e),P(b,y,e),P(b,t,e),P(a,t,e)],o=P(x,y+h/2,z);for(let i=0;i<6;i++){const f=BX[i];cf([v[f[0]],v[f[1]],v[f[2]],v[f[3]]],i===0&&top?top:i>1&&sd?sd:col,o);}};
const wbox=(x,y,z,w,h,d,col,top,sd)=>mbox(ID,x,y,z,w,h,d,col,top,sd);
const mcyl=(P,x,y,z,r,h,col,n,axx,cap)=>{n=n||8;const A0=[],A1=[];for(let i=0;i<n;i++){const a=i/n*TAU,cs=cos(a)*r,sn=sin(a)*r;if(axx){A0.push(P(x-h/2,y+cs,z+sn));A1.push(P(x+h/2,y+cs,z+sn));}else{A0.push(P(x+cs,y,z+sn));A1.push(P(x+cs,y+h,z+sn));}}const o=axx?P(x,y,z):P(x,y+h/2,z);for(let i=0;i<n;i++){const j=(i+1)%n;cf([A0[i],A1[i],A1[j],A0[j]],col,o);}cf(A1,cap||col,o);if(axx)cf(A0.slice().reverse(),cap||col,o);};
const cone=(P,x,y,z,r,h,col,n)=>{n=n||6;const tp=P(x,y+h,z),o=P(x,y+h*.3,z),B=[];for(let i=0;i<n;i++){const a=i/n*TAU+.3;B.push(P(x+cos(a)*r,y,z+sin(a)*r));}for(let i=0;i<n;i++)cf([B[i],B[(i+1)%n],tp],col,o);};
const msph=(P,x,y,z,r,col,col2,nl,nm)=>{nl=nl||4;nm=nm||8;const o=P(x,y,z),V=[];for(let i=0;i<=nl;i++){const la=-PI/2+i/nl*PI,row=[];for(let j=0;j<nm;j++){const lo=j/nm*TAU;row.push(P(x+cos(la)*cos(lo)*r,y+sin(la)*r,z+cos(la)*sin(lo)*r));}V.push(row);}for(let i=0;i<nl;i++)for(let j=0;j<nm;j++){const j2=(j+1)%nm,pts=i===0?[V[0][j],V[1][j2],V[1][j]]:i===nl-1?[V[i][j],V[i][j2],V[nl][j]]:[V[i][j],V[i][j2],V[i+1][j2],V[i+1][j]];cf(pts,col2&&(i+j)%2?col2:col,o);}};
const flat=(x,y,z,r,col,n,sq_)=>{n=n||8;const p=[];for(let i=0;i<n;i++){const a=i/n*TAU;p.push([x+cos(a)*r,y,z+sin(a)*r*(sq_||1)]);}F(p,col,false);};
const tree=(x,y,z,s,c1,c2)=>{mcyl(ID,x,y,z,.16*s,1*s,'#5a3a22',5);cone(ID,x,y+.7*s,z,1.1*s,1.7*s,c1||'#2f6a2a',6);cone(ID,x,y+1.6*s,z,.8*s,1.4*s,c2||'#3b7d33',6);};
const bb=(x,y,z,s,col)=>{const c=A.cam,cy=cos(c.ry),sy=sin(c.ry),cx=cos(c.rx),sx=sin(c.rx),rx=cy*s,rz=-sy*s,ux=-sy*sx*s,uy=cx*s,uz=-cy*sx*s;F([[x-rx-ux,y-uy,z-rz-uz],[x+rx-ux,y-uy,z+rz-uz],[x+rx+ux,y+uy,z+rz+uz],[x-rx+ux,y+uy,z-rz+uz]],col,false);};
const puff=(x,y,z,s,col,n)=>{n=n||6;const c=A.cam,cy=cos(c.ry),sy=sin(c.ry),cx=cos(c.rx),sx=sin(c.rx),R_=[cy,0,-sy],U=[-sy*sx,cx,-cy*sx],p=[];for(let i=0;i<n;i++){const a=i/n*TAU,u=cos(a)*s,v=sin(a)*s;p.push([x+R_[0]*u+U[0]*v,y+U[1]*v,z+R_[2]*u+U[2]*v]);}F(p,col,false);};
const man=(P,o)=>{o=o||{};const sw=sin(o.ph||0)*(o.sw===undefined?.7:o.sw),cr=o.cr||0,hip=.9-cr*.4,pa=o.pa||'#2a3a6a',sh=o.sh||'#e84a2a',lg_=.86-cr*.3;
 mbox(sub(P,-.13,hip,0,sw+(o.lg||0),o.sp||0),0,-lg_,0,.17,lg_,.19,pa);mbox(sub(P,.13,hip,0,-sw+(o.lg||0),-(o.sp||0)),0,-lg_,0,.17,lg_,.19,pa);
 const TP=sub(P,0,hip,0,o.lean||0);mbox(TP,0,0,0,.46,.62,.27,sh);mbox(sub(TP,-.3,.58,0,-sw*.8+(o.arm||0),-(o.as||0)),0,-.56,0,.13,.56,.15,sh);mbox(sub(TP,.3,.58,0,sw*.8+(o.arm||0),o.as||0),0,-.56,0,.13,.56,.15,sh);
 mbox(TP,0,.64,0,.27,.29,.27,o.sk||'#f1c7a3');if(o.hl)mbox(TP,0,.8,0,.32,.17,.32,o.hl);};
const shd=(x,y,z,w,d,a)=>{const p=[];for(let i=0;i<8;i++){const q=i/8*TAU;p.push([x+cos(q)*w,y+.02,z+sin(q)*d]);}F(p,'rgba(0,0,0,'+(a||.35)+')',false);};
const mkP=()=>{const ps=[];return{ps,add(x,y,z,vx,vy,vz,t,col,s,gr,grow){if(ps.length<240)ps.push({x,y,z,vx,vy,vz,t,t0:t,col,s:s||.12,gr:gr||0,grow:grow||0});},step(){let j=0;for(const p of ps){p.x+=p.vx;p.y+=p.vy;p.z+=p.vz;p.vy-=p.gr;p.t--;if(p.t>0)ps[j++]=p;}ps.length=j;},draw(){for(const p of ps){const f=p.t/p.t0;puff(p.x,p.y,p.z,p.s*(p.grow?1+(1-f)*p.grow:.35+.65*f),p.col);}},clear(){ps.length=0;}};};
const wedge=(dist,near,far)=>{const c=A.cam;return(x,z)=>{const dx=x-c.x,dz=z-c.z,al=dx*sin(c.ry)+dz*cos(c.ry),lt=dx*cos(c.ry)-dz*sin(c.ry);return al>(near||-4)&&al<(far||dist)&&abs(lt)<al*1.05+10;};};

/* =================================================================== 1. MOTO RACER 3D */
A.add({id:'moto3d',name:'MOTO RACER 3D',cat:'RETRO 3D',hd:1,how:'UP THROTTLE, DOWN BRAKE. LEAN INTO CURVES WITH LEFT/RIGHT. FINISH 1ST OF 12.',make(){
 const g={over:null,score:0},LEN=3600,RW=4.6;
 const cx=z=>9*sin(z*.013)+5*sin(z*.031+1),dcx=z=>.117*cos(z*.013)+.155*cos(z*.031+1),ddx=z=>-.001521*sin(z*.013)-.004805*sin(z*.031+1);
 const hy=z=>3*sin(z*.006)+1.6*sin(z*.017+2),dhy=z=>.018*cos(z*.006)+.0272*cos(z*.017+2);
 const COL=['#ff4f6d','#ffcf3f','#3dff8b','#ff9838','#ff4f9a','#b070ff','#f4f4f4','#4d7bff','#8a8a8a','#ffe070','#40e0a0'];
 const p={d:0,x:0,v:0,lean:0,crash:0,off:0},rv=[],ps=mkP();let start=100,best=12,tilt=0,slip=0;
 for(let i=0;i<11;i++)rv.push({d:5+i*5,x:(i%2?1.7:-1.7),v:0,top:.79+i*.0125+rnd(.01),c:COL[i],lean:0,ph:rnd(9),bump:0});
 const place=()=>1+rv.filter(q=>q.d>p.d).length;g.dbg=()=>({x:+p.x.toFixed(2),d:fl(p.d),v:+p.v.toFixed(2),pl:place()});
 const bike=(x,y,z,yaw,lean,col,sh,v)=>{const P=xf(x,y,z,yaw,0,-lean*.75),wr=v*9;shd(x,y,z,.5,1.1,.3);
  mcyl(P,0,.34,.62,.34,.16,'#141414',8,1,'#3a3a3a');mcyl(P,0,.34,-.62,.34,.2,'#141414',8,1,'#3a3a3a');
  mbox(P,0,.42,0,.34,.3,1.1,'#2a2a30');mbox(P,0,.62,.28,.42,.26,.62,col,null,col);mbox(P,0,.6,-.45,.36,.2,.5,col);mbox(P,0,.82,.58,.44,.3,.14,'#9fe0ff');
  const RP=sub(P,0,.8,-.18,.9);mbox(RP,0,0,0,.44,.62,.3,sh);mbox(RP,0,.64,0,.34,.32,.34,col,'#1a1a1a');mbox(P,-.17,.55,-.2,.14,.36,.52,'#22222a');mbox(P,.17,.55,-.2,.14,.36,.52,'#22222a');
  };
 g.update=()=>{ps.step();if(start>0){start--;if(start%30===0&&start>0)S('blip');if(start===0){S('score');pop('GO!',K.g);}return;}
  const k=A.in(0);slip=0;
  if(p.crash>0){p.crash--;p.v*=.92;p.lean*=.9;if(p.crash===0)p.x=cl(p.x,-RW+1,RW-1);}
  else{p.lean+=(ax(k)-p.lean)*.13;p.off=abs(p.x)>RW;
   if(k.u||k.a)p.v+=.0068*(1-p.v/.97);else p.v-=.0022;if(k.d||k.b)p.v-=.015;
   const vmax=p.off?.4:.92;if(p.v>vmax)p.v-=.02;
   if(rv.some(q=>q.d-p.d>1.4&&q.d-p.d<8&&abs(q.x-p.x)<.9)){p.v+=.0011;slip=1;}
   p.v=cl(p.v,0,.97);p.x+=p.lean*(.05+p.v*.11)-ddx(p.d)*p.v*p.v*15;
   if(p.off&&p.v>.1){const X=cx(p.d)+p.x;ps.add(X,hy(p.d)+.2,p.d-.6,rnd(.1)-.05,.05+rnd(.04),-.05,22,'rgba(150,120,70,.45)',.1,.003,2);}
   if(abs(p.x)>RW+4.4){p.crash=80;p.v*=.2;S('boom');A.shake=10;p.x=Math.sign(p.x)*(RW+4);pop('CRASH!',K.r);}}
  p.x=cl(p.x,-RW-5,RW+5);if(fl((p.d+p.v)/20)>fl(p.d/20))g.score+=1;p.d+=p.v;
  for(const q of rv){const curve=abs(ddx(q.d))*9;q.v+=((q.top*(1-curve)*(start>0?0:1))-q.v)*.02;q.lean+=((sin(q.d*.01+q.ph)*2.4-q.x)*.4-q.lean)*.05;q.x+=((sin(q.d*.01+q.ph)*2.4)-q.x)*.02;q.d+=q.v;
   const dd=q.d-p.d;if(abs(dd)<1.3&&abs(q.x-p.x)<.85&&p.crash===0){if(dd>0){p.v*=.72;q.v+=.05;}else{q.v*=.8;p.v+=.02;}p.x+=p.x<q.x?-.35:.35;S('hit');A.shake=5;}}
  const pl=place();if(pl<best){g.score+=100*(best-pl);best=pl;S('coin');}
  if(p.d>=LEN){const pl2=place();g.score+=[0,2000,1400,1000,700,500,400,300,200,150,100,50,25][pl2];g.over=pl2===1?'1ST PLACE - YOU WIN!':'FINISHED '+ORD(pl2);}};
 g.draw=()=>{const d=p.d,cz=d-5.4,ry=atan(dcx(d+3))*.85,camx=cx(cz)+p.x*.85;cam(camx,hy(cz)+2.15+(p.crash?.5:0),cz,ry,atan(dhy(d+2))*.7-.12,200);const hz=hzY();
  tilt+=(-p.lean*.2-tilt)*.18;roll(tilt);
  sky('#1b1c58','#f08a52',hz,'#e39a62','#2c5a26');sun(160-ry*200+40,hz-22,11,'255,190,120','#fff0c8');ridge(hz,'#7a4a6a',30,1,ry*150+d*.05,10);ridge(hz,'#4a3050',16,4,ry*260+d*.1,8);
  A.fog={col:'#e8956a',near:24,far:80};
  for(let z=fl(d)-5,st=1;z<d+82;z+=st){st=z<d+26?1:2;const z2=z+st,a=cx(z),b=cx(z2),ya=hy(z),yb=hy(z2),alt=fl(z/2)%2;
   F([[a-RW,ya,z],[a+RW,ya,z],[b+RW,yb,z2],[b-RW,yb,z2]],alt?'#4a4a55':'#43434d');
   F([[a-RW-.7,ya,z],[a-RW,ya,z],[b-RW,yb,z2],[b-RW-.7,yb,z2]],alt?'#ff4f6d':'#f2f2f2',false);F([[a+RW,ya,z],[a+RW+.7,ya,z],[b+RW+.7,yb,z2],[b+RW,yb,z2]],alt?'#ff4f6d':'#f2f2f2',false);
   F([[a-42,ya-.3,z],[a-RW-.7,ya,z],[b-RW-.7,yb,z2],[b-42,yb-.3,z2]],alt?'#3d7a33':'#377230');F([[a+RW+.7,ya,z],[a+42,ya-.3,z],[b+42,yb-.3,z2],[b+RW+.7,yb,z2]],alt?'#3d7a33':'#377230');}
  A.flush();
  for(let z=fl(d/4)*4;z<d+60;z+=4)if(fl(z/4)%2===0){const a=cx(z),b=cx(z+2);F([[a-.1,hy(z)+.01,z],[a+.1,hy(z)+.01,z],[b+.1,hy(z+2)+.01,z+2],[b-.1,hy(z+2)+.01,z+2]],'#f4f0d8',false);}
  if(LEN-d<90){const z=LEN,a=cx(z);for(let i=-5;i<5;i++)F([[a+i*RW/5,hy(z)+.02,z],[a+(i+1)*RW/5,hy(z)+.02,z],[a+(i+1)*RW/5,hy(z)+.02,z+1.2],[a+i*RW/5,hy(z)+.02,z+1.2]],(i+10)%2?'#111111':'#ffffff',false);}
  A.flush();
  for(let z=fl(d/7)*7-7;z<d+76;z+=7){if(z<d-6)continue;const a=cx(z),y=hy(z),s=((z*7919)%13+13)%13,side=(z/7)%2?1:-1;
   if(s<8)tree(a+side*(RW+5+s*.6),y-.1,z,1.2+s*.08,s%2?'#2c6a2e':'#2a5f2a','#3a8a38');
   else if(s<11){mcyl(ID,a+side*(RW+2.2),y,z,.08,4,'#8a8a96',5);wbox(a+side*(RW+1.5),y+4,z,1.6,.12,.2,'#8a8a96');}
   const curv=ddx(z+10);if(abs(curv)>.0038&&s%3===0){const sd=curv>0?-1:1;wbox(a+sd*(RW+1.6),y+.9,z,1.5,.8,.12,'#ffcf3f');wbox(a+sd*(RW+1.6),y,z,.1,.9,.1,'#555555');}}
  if(LEN-d<90){const z=LEN,a=cx(z),y=hy(z);wbox(a-RW-1,y,z,.4,4.4,.4,'#dddddd');wbox(a+RW+1,y,z,.4,4.4,.4,'#dddddd');wbox(a,y+4,z,RW*2+2.4,.8,.3,'#ff4f6d');}
  for(const q of rv){const rel=q.d-d;if(rel<-5||rel>70)continue;bike(cx(q.d)+q.x,hy(q.d),q.d,atan(dcx(q.d)),q.lean*.5,q.c,'#2a2a3a',q.v);}
  const X=cx(d)+p.x;bike(X,hy(d),d,atan(dcx(d))+p.lean*.12,p.crash?.9*Math.sign(p.x||1):p.lean,'#2fd6c3','#1a4a8a',p.v);ps.draw();A.flush();A.fog=null;
  speedLines(p.v>.6?(p.v-.6)*2.2+(slip?.3:0):0,160,hz+20);unroll();
  bar(0,18);const pl=place();T(ORD(pl),6,3,pl===1?K.y:K.w,2);T('/12',6+ORD(pl).length*8,6,K.gr,1);T(Math.round(p.v*240)+' KMH',160,3,p.v>.85?K.y:K.w,2,'c');meter(W-86,5,80,7,p.d/LEN,K.c);
  if(slip)T('SLIPSTREAM',160,22,K.c,1,'c');if(p.off&&!p.crash)T('OFF ROAD',160,22,K.o,1,'c');
  if(start>0)T(start>60?'3':start>30?'2':'1',160,90,K.y,5,'c');};
 return g;}});

/* =================================================================== 2. JET SKI 3D */
A.add({id:'jetski3d',name:'JET SKI 3D',cat:'RETRO 3D',hd:1,how:'UP THROTTLE, LEFT/RIGHT CARVE. PASS GATES FOR TIME. A SPINS OFF RAMPS.',make(){
 const g={over:null,score:0};const wv=(x,z)=>{const t=A.t;return .34*sin(x*.33+t*.05)+.3*sin(z*.21-t*.07)+.14*sin((x+z)*.55+t*.09);};
 const cc=z=>sin(z*.012)*10+sin(z*.027)*5;
 const p={x:0,y:0,z:0,h:0,v:.1,vy:0,air:0,spin:0,tgt:0,stun:0,roll:0,pit:0},ps=mkP();let time=60*20,gates=[],next=34,ob=[],combo=0,passed=0,camH=0,camY=2,dist=0,msg='';
 const addGate=()=>{const z=next;gates.push({z,x:cc(z)+rnd(10)-5,ok:0});const r=Math.random();if(passed+gates.length>3&&r<.4)ob.push({k:'ramp',x:cc(z+15)+rnd(4)-2,z:z+15});else if(r<.8)ob.push({k:'rock',x:cc(z+14)+(Math.random()<.5?-1:1)*(2.5+rnd(3)),z:z+14,s:.7+rnd(.7)});if(Math.random()<.5)ob.push({k:'isle',x:cc(z)+(Math.random()<.5?-1:1)*(20+rnd(10)),z:z+rnd(20)});next+=27+rnd(8);};
 for(let i=0;i<6;i++)addGate();
 g.dbg=()=>{const q=gates.find(q=>!q.ok);const tx=q?q.x:p.x,dz=q?q.z-p.z:10;return{da:+(atan2(tx-p.x,mx(dz,3))-p.h).toFixed(2),passed,t:fl(time/60)};};const onRamp=o=>o.k==='ramp'&&abs(p.x-o.x)<1.4&&p.z>o.z-2&&p.z<o.z+2;
 g.update=()=>{ps.step();const k=A.in(0);time--;if(p.stun>0)p.stun--;
  const turn=ax(k)*(p.air?0:.032)*(p.stun?.3:1);p.h=cl(p.h+turn,-1.15,1.15);
  if(!p.air){if((k.u||k.a)&&!p.stun)p.v+=.0055*(1-p.v/.64);else p.v*=.992;p.v=mx(p.v,.03);}
  p.x+=sin(p.h)*p.v;p.z+=cos(p.h)*p.v;dist+=p.v;g.score+=0;if(fl(dist/12)>fl((dist-p.v)/12))g.score+=1;
  const w=wv(p.x,p.z);let base=w;const rp=ob.find(onRamp);if(rp)base=w+cl((p.z-(rp.z-2))/4,0,1)*1.3;
  if(p.air){p.vy-=.0105;p.y+=p.vy;if(k.a&&A.hit(0).a&&p.spin>=p.tgt-.01){p.tgt+=TAU;S('jump');}p.spin=mn(p.tgt,p.spin+.24);
   if(p.y<=w){p.air=0;const bad=p.tgt-p.spin>.5;for(let i=0;i<16;i++)ps.add(p.x,w+.2,p.z,rnd(.3)-.15,.1+rnd(.12),rnd(.3)-.15,30,'rgba(235,250,255,.8)',.18,.01);
    if(bad){p.stun=50;p.v*=.25;S('lose');A.shake=8;pop('WIPEOUT!',K.r);}else{const n=Math.round(p.tgt/TAU);if(n>0){g.score+=300*n;S('score');pop(n>1?n+'X SPIN! +'+300*n:'SPIN! +300',K.y);}else S('hit');}p.spin=p.tgt=0;}}
  else{const wasR=p.y>w+.4&&!rp;if(rp&&p.z>rp.z+1.6){p.air=1;p.vy=.2+p.v*.12;p.y=base;S('jump');}else{p.vy=base-p.y;p.y=base;}if(wasR){}}
  p.pit+=((p.air?cl(p.vy*2,-.5,.5):(wv(p.x,p.z+1)-wv(p.x,p.z-1))*.5)-p.pit)*.2;p.roll+=((-ax(k)*.35*p.v/.6)+(wv(p.x+1,p.z)-wv(p.x-1,p.z))*.4-p.roll)*.15;
  if(!p.air&&p.v>.15&&A.t%2===0){const sx=sin(p.h),sz=cos(p.h);for(const sd of[-1,1])ps.add(p.x-sx*1.1+sd*cos(p.h)*.4,p.y+.2,p.z-sz*1.1,-sx*.05+sd*cos(p.h)*(.03+rnd(.04)),.06+p.v*.12,-sz*.05+rnd(.02),22,'rgba(240,252,255,.6)',.07,.008,.6);if(abs(turn)>0)ps.add(p.x-sx*.8-Math.sign(turn)*cos(p.h)*.6,p.y+.3,p.z-sz*.8,-Math.sign(turn)*cos(p.h)*.12,.14,Math.sign(turn)*sin(p.h)*.12,20,'rgba(255,255,255,.7)',.09,.01);}
  for(const q of gates){if(!q.ok&&p.z>=q.z){q.ok=1;if(abs(p.x-q.x)<2.1){combo++;passed++;g.score+=50*mn(combo,4);time+=90;S('coin');pop('GATE +'+50*mn(combo,4),K.g,78);}else{combo=0;time-=120;S('lose');pop('MISSED -2S',K.r,78);q.miss=1;}}}
  for(const o of ob)if(o.k==='rock'&&!o.hit&&hyp(o.x-p.x,o.z-p.z)<o.s+.55){o.hit=1;p.v*=.25;p.stun=40;p.h*=-.5;S('boom');A.shake=10;pop('ROCK!',K.r);}
  gates=gates.filter(q=>q.z>p.z-6);ob=ob.filter(o=>o.z>p.z-30);while(gates.length<6)addGate();
  if(passed>=40){g.score+=fl(time/6);g.over='COURSE COMPLETE! WIN';}else if(time<=0)g.over='OUT OF TIME - '+passed+' GATES';};
 g.draw=()=>{camH+=(p.h-camH)*.08;const sh=sin(camH),ch=cos(camH);camY+=((p.air?p.y*.6:p.y*.3)+2.2-camY)*.2;cam(p.x-sh*5.8,camY,p.z-ch*5.8,camH,-.16,205);const hz=hzY();roll(p.roll*.45);
  sky('#1e62c8','#bfe8ff',hz,'#9fd4ec','#155f9a');sun(250-camH*205,hz-78,10,'255,250,210');ridge(hz,'#5a9a8a',9,2,camH*205,6);ridge(hz,'#3f7a5a',5,6,camH*205*1.1,5);
  A.fog={col:'#a8dcf0',near:22,far:62};const inV=wedge(64),S5=5,ox=fl(p.x/S5)*S5,oz=fl(p.z/S5)*S5;
  for(let i=-13;i<=13;i++)for(let j=-3;j<=13;j++){const x0=ox+i*S5,z0=oz+j*S5;if(!inV(x0+2.5,z0+2.5))continue;const a=wv(x0,z0),b=wv(x0+S5,z0),c=wv(x0+S5,z0+S5),d=wv(x0,z0+S5),m=(a+b+c+d)/4,lit=.82+(b+c-a-d)*.45+(d+c-a-b)*.25+(m>.42?.25:0);
   F([[x0,a,z0],[x0+S5,b,z0],[x0+S5,c,z0+S5],[x0,d,z0+S5]],A.shade(m>.45?'#3fa4d8':'#1c7fc4',cl(lit,.55,1.35),hyp(x0-A.cam.x,z0-A.cam.z)),false);}
  A.flush();if(!p.air||p.y-wv(p.x,p.z)<3)shd(p.x,wv(p.x,p.z)+.05,p.z,.7,1.2,p.air?.2:.25);A.flush();
  for(const o of ob){if(o.z<p.z-8||o.z>p.z+62)continue;const w=wv(o.x,o.z);
   if(o.k==='rock'){mbox(xf(o.x,w-.4,o.z,o.z,0,.2),0,0,0,o.s*1.6,o.s*1.3,o.s*1.4,'#6a6a70','#8a8a90');mbox(xf(o.x+o.s*.6,w-.4,o.z+.3,o.z*2),0,0,0,o.s,o.s*.8,o.s,'#5a5a62');}
   else if(o.k==='ramp'){const y=wv(o.x,o.z)-.1,z0=o.z-2,z1=o.z+2,x0=o.x-1.4,x1=o.x+1.4;F([[x0,y,z0],[x1,y,z0],[x1,y+1.3,z1],[x0,y+1.3,z1]],'#d9a441');F([[x0,y,z0],[x0,y+1.3,z1],[x0,y,z1]],'#a0702a');F([[x1,y,z0],[x1,y,z1],[x1,y+1.3,z1]],'#a0702a');F([[x0+.9,y+.02,z0],[x1-.9,y+.02,z0],[x1-.9,y+1.32,z1],[x0+.9,y+1.32,z1]],'#ff4f6d',false);}
   else if(o.k==='isle'){cone(ID,o.x,-.6,o.z,6,2.2,'#e8d49a',7);const px=o.x+1,pz=o.z;for(let i=0;i<4;i++)wbox(px+i*.25,1+i*1.1,pz,.35,1.15,.35,'#8a6a3a');for(let i=0;i<5;i++){const a=i*1.26;F([[px+.8,5.4,pz],[px+.8+cos(a)*2.6,4.2,pz+sin(a)*2.6],[px+.8+cos(a+.4)*2.2,4.9,pz+sin(a+.4)*2.2]],'#2f8a3a');}}}
  for(const q of gates){if(q.z<p.z-3||q.z>p.z+62)continue;const col=q.ok?(q.miss?'#8a8a8a':'#3dff8b'):'#ff7a2a',y1=wv(q.x-2.4,q.z),y2=wv(q.x+2.4,q.z);
   mcyl(ID,q.x-2.4,y1-.3,q.z,.45,1.2,col,7);mcyl(ID,q.x+2.4,y2-.3,q.z,.45,1.2,col,7);mcyl(ID,q.x-2.4,y1+.9,q.z,.12,2.4,'#f0f0f0',5);mcyl(ID,q.x+2.4,y2+.9,q.z,.12,2.4,'#f0f0f0',5);
   F([[q.x-2.4,y1+3.3,q.z],[q.x+2.4,y2+3.3,q.z],[q.x+2.4,y2+2.6,q.z],[q.x-2.4,y1+2.6,q.z]],q.ok?col:'#ffcf3f');for(let i=0;i<4;i++)F([[q.x-2.4+i*1.2+.2,y1+3.28,q.z-.01],[q.x-2.4+i*1.2+.8,y1+3.28,q.z-.01],[q.x-2.4+i*1.2+.8,y1+2.62,q.z-.01],[q.x-2.4+i*1.2+.2,y1+2.62,q.z-.01]],'#ff4f6d',false);}
  const P=xf(p.x,p.y,p.z,p.h+p.spin,p.pit,p.roll);mbox(P,0,0,0,.9,.38,2.2,'#f4f4f4','#ff4f9a');F([P(-.45,.38,1.1),P(.45,.38,1.1),P(0,.1,1.8)],'#ff4f9a');F([P(-.45,0,1.1),P(0,.1,1.8),P(-.45,.38,1.1)],'#e0e0e0');F([P(.45,0,1.1),P(.45,.38,1.1),P(0,.1,1.8)],'#e0e0e0');
  mbox(P,0,.38,-.3,.5,.22,1.1,'#222230');mbox(P,0,.55,.55,.9,.1,.1,'#333');man(sub(P,0,.1,-.25,-.35),{cr:.55,sh:'#ffcf3f',pa:'#1a3a8a',hl:'#ff4f6d',arm:-1.1,sw:0,lg:.9});
  ps.draw();A.flush();A.fog=null;speedLines(p.v>.45?(p.v-.45)*3:0,160,hz+30);unroll();
  bar(0,18);const tc=time<300;T(Math.ceil(mx(0,time)/60)+'S',160,3,tc&&A.t%20<10?K.r:K.w,2,'c');T('GATES '+passed+'/40',6,5,K.y,1);T(combo>1?'COMBO X'+mn(combo,4):'',W-6,5,K.g,1,'r');meter(6,H-12,70,6,p.v/.64,K.c);T('SPEED',80,H-12,K.gr,1);
  if(p.air)T(p.spin<p.tgt?'SPINNING!':'A = SPIN',160,24,K.y,1,'c');};
 return g;}});

/* =================================================================== 3. MONSTER TRUCK 3D */
A.add({id:'monster3d',name:'MONSTER TRUCK 3D',cat:'RETRO 3D',hd:1,how:'UP GAS, DOWN BRAKE, B NITRO. TILT IN AIR. CRUSH CARS, LAND ON 4 WHEELS.',make(){
 const g={over:null,score:0},ST=.25,hs=[],cars=[],CC=['#d8453a','#3a6ad8','#e8c840','#40a860','#e8e8e8','#8a3ad8','#ff8a3a'];let X=0;
 const push=(len,fn)=>{const n=Math.round(len/ST);for(let i=0;i<n;i++)hs.push(fn(i/n));X+=n*ST;},park=(x0,n)=>{for(let i=0;i<n;i++)cars.push({x:x0+1.3+i*2.3,cr:0,c:CC[ri(7)],bus:0});};
 push(16,()=>0);
 const KS0=['cars','jump','bumps','jump','table','cars','big','bumps','jump','table','cars','big','jump','mega','cars','bumps','big','table','mega','jump','cars','big','bumps','mega','table','cars','mega','jump','big','mega'],KS=KS0.concat(KS0.slice(1));for(const k of KS){
  if(k==='cars'){const n=3+ri(3);park(X+2,n);push(4+n*2.3+3,()=>0);}
  else if(k==='jump'||k==='big'||k==='mega'){const hh=k==='mega'?4.2:k==='big'?3.1:2.2,up=k==='mega'?6:k==='big'?6:5,gap=k==='mega'?10:k==='big'?8:6;push(up,t=>hh*t);park(X,fl(gap/2.3));push(gap,()=>0);push(4.5,t=>hh*.85*t);push(9,t=>hh*.85*(1-t));push(5,()=>0);}
  else if(k==='bumps')push(15,t=>.55*abs(sin(t*PI*5)));
  else if(k==='table'){push(4,t=>1.8*t);push(6,()=>1.8);push(4,t=>1.8*(1-t));push(4,()=>0);}}
 push(22,()=>0);const END=X-16;
 const hG=x=>{const f=x/ST,i=fl(f);if(i<0)return 0;if(i>=hs.length-1)return 0;return hs[i]+(hs[i+1]-hs[i])*(f-i);},slp=x=>(hG(x+.3)-hG(x-.3))/.6,slb=x=>(hG(x)-hG(x-.3))/.3;
 const p={x:3,y:0,vx:0,vy:0,a:0,w:0,gr:1,air:0,rot:0,crash:0,susp:0},ps=mkP();let lives=3,nitro=100,safe=3,crushed=0;
 g.dbg=()=>({x:+p.x.toFixed(2),y:+p.y.toFixed(2),a:+p.a.toFixed(2),vx:+p.vx.toFixed(3),vy:+p.vy.toFixed(3),gr:p.gr,lives});const crowd=[];for(let i=0;i<260;i++)crowd.push({x:i*1.6+rnd(1),r:ri(5),c:['#ff4f6d','#ffcf3f','#4dabff','#f4f4f4','#3dff8b','#ff9838'][ri(6)],f:rnd(9)});
 g.update=()=>{ps.step();const k=A.in(0);
  if(p.crash>0){p.crash--;p.a+=.2;p.y+=p.vy;p.vy-=.012;if(p.y<hG(p.x))p.y=hG(p.x),p.vy*=-.3;if(p.crash===0){if(lives<=0){g.over='TOTALED! GAME OVER';return;}p.x=safe;p.y=hG(safe);p.vx=p.vy=p.w=0;p.a=0;p.gr=1;}return;}
  if(p.gr){const gas=k.u||k.a;if(gas)p.vx+=.0058;if(k.d)p.vx-=.008;if(k.b&&nitro>0){p.vx+=.004;nitro-=.8;ps.add(p.x-1.8,p.y+1.1,.3,-.05,.02,0,16,'rgba(90,180,255,.7)',.18,0,1.5);}
   p.vx-=slb(p.x)*.0042;p.vx*=.992;p.vx=cl(p.vx,-.14,k.b&&nitro>0?.56:.46);p.a+=(atan(slb(p.x))-p.a)*.4;p.w=0;p.vy=p.vx*slb(p.x);
   if(abs(p.vx)>.1&&A.t%2===0)ps.add(p.x-1.3,p.y+.2,-.4+rnd(.8),-p.vx*.3,.04+rnd(.04),rnd(.04)-.02,26,'rgba(140,100,60,.55)',.22,.002,2.5);
   if(abs(slp(p.x))<.05&&!cars.some(c=>!c.cr&&abs(c.x-p.x)<4))safe=p.x;}
  else{p.vy-=.012;p.air++;p.w+=(k.l?.0048:0)-(k.r?.0048:0);p.w*=.975;if(!k.l&&!k.r&&abs(p.w)<.02)p.a+=(atan2(p.vy,mx(.05,p.vx))-p.a)*.012;p.a+=p.w;p.rot+=p.w;nitro=mn(100,nitro+.15);}
  p.x+=p.vx;p.y+=p.vy;nitro=mn(100,nitro+.05);p.susp*=.85;
  const ng=hG(p.x);
  if(p.y>ng+1.1&&!p.gr&&hG(p.x+.6)>p.y+.4){p.vx=-.08;}
  if(p.y<=ng){if(!p.gr){const df=abs(wrapA(p.a-atan(slp(p.x))));if((df>.62&&abs(p.vy)>.16)||df>1.1||p.vy<-.45){p.crash=90;lives--;S('boom');A.shake=14;p.vy=.2;pop('CRASH!',K.r,60);const q=A.p3(p.x,p.y+1,0);A.burst(q[0],q[1],K.o,30,3);for(let i=0;i<20;i++)ps.add(p.x,p.y+1,0,rnd(.4)-.2,rnd(.3),rnd(.4)-.2,40,i%2?'#ff9838':'#3a3a3a',.2,.01);return;}
    const fl_=Math.round(p.rot/TAU);if(fl_!==0&&abs(p.rot-fl_*TAU)<1.2){g.score+=500*abs(fl_);S('win');pop((abs(fl_)>1?abs(fl_)+'X ':'')+(fl_>0?'BACKFLIP':'FRONTFLIP')+'!',K.y,60);}
    if(p.air>22){g.score+=p.air*3;pop('AIR +'+p.air*3,K.c,80);}S('hit');A.shake=mn(10,4+p.air/8);p.susp=.35;for(let i=0;i<14;i++)ps.add(p.x+rnd(3)-1.5,ng+.2,rnd(2)-1,rnd(.2)-.1,.08+rnd(.08),rnd(.1)-.05,30,'rgba(150,110,70,.6)',.25,.006,2);}
   p.y=ng;p.gr=1;p.air=0;p.rot=0;}
  else if(p.gr&&p.y>ng+.06){p.gr=0;p.air=0;p.rot=0;}
  if(p.gr&&p.y<ng+.06)p.y=ng;
  for(const c of cars)if(!c.cr&&abs(c.x-p.x)<1.6&&p.y<hG(c.x)+1.3){c.cr=1;crushed++;g.score+=100;S('hit');A.shake=6;p.susp=.4;if(p.gr)p.vy=.06;p.vx*=.96;const q=A.p3(c.x,.8,0);if(q[2]>.1)A.burst(q[0],q[1],K.y,14,2);for(let i=0;i<8;i++)ps.add(c.x,.6,rnd(1)-.5,rnd(.2)-.1,.1+rnd(.1),rnd(.2)-.1,30,i%2?'#bfe6ff':'#ffcf3f',.08,.01);pop('CRUSH +100',K.o,90);}
  if(p.x>=END){g.score+=lives*500+fl(nitro);g.over='FINISH! COURSE COMPLETE';}};
 const truck=(x,y,a,sus)=>{const P=xf(x,y,0,PI/2,a,0);for(const[wx,wz]of[[-1.05,1.2],[1.05,1.2],[-1.05,-1.2],[1.05,-1.2]])mcyl(P,wx,.78,wz,.78,.62,'#161616',10,1,'#5a5a5a');
  const B=sub(P,0,-sus,0,0);mbox(B,0,1.2,0,1.9,.5,3.4,'#ff4f6d','#ff6f86');mbox(B,0,1.7,.95,1.7,.35,1.3,'#ff4f6d');mbox(B,0,1.7,-.3,1.6,.72,1.4,'#1a1a2a','#ff4f6d');mbox(B,0,1.95,-.3,1.66,.12,.9,'#2fd6c3');mbox(B,0,1.08,1.75,1.2,.3,.2,'#c0c0c0');mbox(B,.6,1.8,-1.3,.2,.5,.2,'#888');mbox(B,-.6,1.8,-1.3,.2,.5,.2,'#888');mbox(B,0,2.15,-1.3,1.6,.12,.3,'#ffcf3f');};
 const car=c=>{const y=hG(c.x),s=c.cr?.38:1,P=xf(c.x,y,0,PI/2,0,0);mbox(P,0,.18,0,1.1,.42*s,2.1,c.cr?'#555a60':c.c);mbox(P,0,.18+.42*s,-.1,.95,.38*s,1.1,c.cr?'#44484e':'#9ad0ff',c.cr?'#44484e':c.c);};
 g.draw=()=>{const cx0=p.x+3.6+p.vx*6,cyy=mx(p.y*.55,0)+3.2;cam(cx0,cyy,-12.5,0,-.1-cyy*.012,215);const hz=hzY();
  sky('#05061a','#26204e',hz,'#3a2a3a','#2a1c14');
  for(let i=0;i<5;i++){const lx=((i*70-cx0*6)%350+350)%350-15;L(lx,hz-70,lx-40+i*20,hz+60,'rgba(255,240,200,.08)',18);glow(lx,hz-72,24,'255,240,200',.55);R(lx-5,hz-76,10,6,'#fff6d8');}
  A.fog={col:'#2a2238',near:22,far:52};
  for(let x=fl(cx0/6)*6-36;x<cx0+36;x+=6){F([[x,0,7],[x+6,0,7],[x+6,7,15],[x,7,15]],'#3a2e4a');F([[x,-.01,4],[x+6,-.01,4],[x+6,0,7],[x,0,7]],'#4a3222');F([[x,0,3.9],[x+6,0,3.9],[x+6,1.1,3.9],[x,1.1,3.9]],((x/6)%3+3)%3===0?'#ff4f6d':((x/6)%3+3)%3===1?'#4dabff':'#ffcf3f');F([[x,-.01,-3],[x+6,-.01,-3],[x+6,-.01,-12],[x,-.01,-12]],'#3e2a1c');}
  for(let x=fl(p.x/.5)*.5-18,st=.5;x<p.x+30;x+=st){const a=hG(x),b=hG(x+st);F([[x,a,-3],[x+st,b,-3],[x+st,b,3],[x,a,3]],fl(x)%2?'#8a5a34':'#825530');if(a>.01||b>.01)F([[x,0,-3],[x+st,0,-3],[x+st,b,-3],[x,a,-3]],'#5a3a22');}
  A.flush();
  for(const c of crowd){const X_=c.x-40+fl((cx0)/416)*416;for(const xx of[X_,X_+416]){if(abs(xx-cx0)>34)continue;const q=A.p3(xx,1.2+c.r*1.1,7.7+c.r*1.1);if(q[2]<.1)continue;const jump=(A.t+c.f*10)%60<8?1:0;R(q[0],q[1]-jump,2,3,c.c);if((A.t*7+c.f*97|0)%400===0)glow(q[0],q[1],6,'255,255,255',.9);}}
  for(let x=fl(p.x)-16;x<p.x+30;x+=4){const a=hG(x);if(fl(x/4)%2===0)F([[x,a+.01,-1.7],[x+2,hG(x+2)+.01,-1.7],[x+2,hG(x+2)+.01,-1.3],[x,a+.01,-1.3]],'rgba(60,35,20,.55)',false);}
  shd(p.x,hG(p.x),0,1.8,1.4,.35);if(END-p.x<40)for(let i=0;i<6;i++)F([[END,.02,-3+i],[END+1,.02,-3+i],[END+1,.02,-2+i],[END,.02,-2+i]],i%2?'#111111':'#ffffff',false);
  A.flush();
  for(const c of cars)if(abs(c.x-cx0)<34)car(c);
  if(END-p.x<40){wbox(END+.5,0,-3.4,.3,4,.3,'#dddddd');wbox(END+.5,0,3.4,.3,4,.3,'#dddddd');wbox(END+.5,4,0,.4,.8,7.2,'#ff4f6d');}
  if(p.crash>0&&p.crash%10<5&&lives>=0){}truck(p.x,p.y,p.a,p.susp);ps.draw();A.flush();A.fog=null;
  bar(0,18);T(g.score,6,3,K.y,2);for(let i=0;i<3;i++)R(W-14-i*14,4,10,8,i<lives?K.r:'#3a3040');meter(W-120,6,64,6,nitro/100,'#4dabff');T('N',W-128,6,K.b,1);meter(6,H-8,W-12,4,p.x/END,K.o);
  if(!p.gr&&p.air>6)T(Math.abs(p.rot)>1?'ROTATING '+Math.round(abs(p.rot)*57)+'D':'AIR TIME',160,24,K.c,1,'c');if(p.crash&&lives<=0)T('WRECKED',160,100,K.r,3,'c');};
 return g;}});

/* =================================================================== 4. HANG GLIDER 3D */
A.add({id:'glider3d',name:'HANG GLIDER 3D',cat:'RETRO 3D',hd:1,how:'LEFT/RIGHT BANK. UP CLIMB, DOWN DIVE. CIRCLE THERMALS. FLY THROUGH RINGS.',make(){
 const g={over:null,score:0};const vc=z=>sin(z*.008)*18+sin(z*.019)*8;
 const TH=(x,z)=>{const d=(x-vc(z))/24;return mx(-1.4,3.4*d*d+2.1*sin(x*.09+z*.05)*sin(z*.07-x*.03)+1.3*sin(x*.21)*sin(z*.17)-1.5);};
 const p={x:0,y:16,z:0,yaw:0,bank:0,pch:0,v:.32},rings=[],th=[],ps=mkP();let lives=3,passed=0,idx=0,inv=0,lift=0,camY=0,flash=0,dist=0;
 for(let i=0;i<24;i++){const z=70+i*58,x=vc(z)+rnd(10)-5;rings.push({x,z,y:TH(x,z)+6+rnd(4)+(i%5===4?6:0),gold:i%5===4,st:0});}
 for(let i=0;i<30;i++){const z=40+i*48,x=vc(z)+rnd(16)-8;th.push({x,z,r:9});}
 g.dbg=()=>({x:+p.x.toFixed(1),y:+p.y.toFixed(1),z:+p.z.toFixed(1),gy:+TH(p.x,p.z).toFixed(1),v:+p.v.toFixed(2),idx,passed,lives});const inTh=()=>{let l=0;for(const t of th){const d=hyp(p.x-t.x,p.z-t.z);if(d<t.r)l=mx(l,.095*(1-d*d/(t.r*t.r)));}return l;};
 g.update=()=>{ps.step();if(inv>0)inv--;if(flash>0)flash--;const k=A.in(0);
  p.bank+=(ax(k)*.9-p.bank)*.07;p.yaw+=p.bank*.04;
  const tp=k.u?.32:k.d?-.5:-.05;p.pch+=(tp-p.pch)*.05;if(p.v<.17&&p.pch>0)p.pch-=.04;
  p.v+=-sin(p.pch)*.0045-(p.v-.3)*.004;p.v=cl(p.v,.14,.62);lift=inTh();
  const vy=sin(p.pch)*p.v-.006-abs(p.bank)*.003+lift;p.y+=vy;p.y=mn(p.y,34);const fz=cos(p.pch)*p.v,oz=p.z;p.x+=sin(p.yaw)*fz;p.z+=cos(p.yaw)*fz;dist+=fz;
  if(fl(dist/15)>fl((dist-fz)/15))g.score+=1;if(lift>.02&&A.t%4===0){g.score+=1;ps.add(p.x+rnd(4)-2,p.y-2,p.z+rnd(4)-2,0,.06,0,30,'rgba(255,230,160,.35)',.15);}
  const r=rings[idx];if(r){if((oz<r.z)!==(p.z<r.z)){const d=hyp(p.x-r.x,p.y-r.y);if(d<2.5){r.st=1;passed++;const pts=r.gold?300:100;g.score+=pts;S('coin');pop((r.gold?'GOLD ':'RING ')+'+'+pts,K.y);flash=12;}else{r.st=2;S('lose');}idx++;}else if(p.z>r.z+30||hyp(p.x-r.x,p.z-r.z)>140){r.st=2;idx++;}}
  const gy=TH(p.x,p.z);if(p.y<gy+.6&&inv===0){lives--;S('boom');A.shake=12;pop('CRASH!',K.r);const q=A.p3(p.x,p.y,p.z);A.burst(q[0],q[1],K.o,24,2.5);if(lives<=0){g.over='CRASHED - '+passed+' RINGS';return;}p.y=gy+10;p.pch=0;p.v=.32;inv=90;}
  if(p.y<gy+.6)p.y=gy+.6;
  if(idx>=rings.length){g.score+=lives*300;g.over=passed>=15?'FLIGHT COMPLETE! WIN':'LANDED - '+passed+'/24 RINGS';}};
 g.draw=()=>{const sy=sin(p.yaw),cy=cos(p.yaw);camY+=(p.y+1.7-camY)*.15;cam(p.x-sy*6.2,camY,p.z-cy*6.2,p.yaw,-.1+p.pch*.35,205);const hz=hzY();roll(-p.bank*.4);
  sky('#2a6ad0','#d8ecf8',hz,'#b8d0d8','#6a8a6a');sun(90-p.yaw*205%1300,hz-90,9,'255,245,200');ridge(hz,'#8aa0b8',34,3,p.yaw*205,10);ridge(hz+1,'#6a86a0',20,7,p.yaw*205*1.05,7);
  A.fog={col:'#c8dce6',near:30,far:92};const inV=wedge(96,-6,96),G=6,ox=fl(p.x/G)*G,oz=fl(p.z/G)*G;
  for(let i=-17;i<=17;i++)for(let j=-17;j<=17;j++){const x0=ox+i*G,z0=oz+j*G;if(!inV(x0+3,z0+3))continue;const a=TH(x0,z0),b=TH(x0+G,z0),c=TH(x0+G,z0+G),d=TH(x0,z0+G),m=(a+b+c+d)/4;const col=m<-1.3?'#3a78b0':m<1.5?((i+j)&1?'#6aa846':'#62a040'):m<5?((i+j)&1?'#4a8a36':'#45843a'):m<11?'#2f6a2e':m<17?'#7a7266':'#eef2f8';F([[x0,a,z0],[x0+G,b,z0],[x0+G,c,z0+G],[x0,d,z0+G]],col);}
  A.flush();
  for(let i=-6;i<=6;i++)for(let j=-1;j<=8;j++){const x0=ox+i*G+3,z0=oz+j*G+3,h=((x0*73856093)^(z0*19349663))>>>0;if(h%5)continue;const y=TH(x0,z0);if(y<-1||y>9||!inV(x0,z0))continue;const s=1+(h%7)*.15;mcyl(ID,x0,y,z0,.2*s,.7*s,'#5a3a22',4);cone(ID,x0,y+.5*s,z0,1*s,2.4*s,'#285a28',5);}
  for(const t of th){const d=t.z-p.z;if(d<-20||d>95||abs(t.x-p.x)>80)continue;for(let i=0;i<5;i++)puff(t.x+sin(i*1.7)*3.5,30+i%2*1.5,t.z+cos(i*2.3)*3,3.6+i%2*1.2,'rgba(255,255,255,.85)',10);for(let i=0;i<6;i++){const y=((A.t*.08+i*4.3)%24),a=i*1.05+A.t*.01;bb(t.x+cos(a)*t.r*.6,TH(t.x,t.z)+y,t.z+sin(a)*t.r*.6,.35,'rgba(255,220,150,'+(.3-y/100)+')');}
   const ba=A.t*.03;for(let i=0;i<2;i++){const q=A.p3(t.x+cos(ba+i*3)*6,TH(t.x,t.z)+14+i*3,t.z+sin(ba+i*3)*6);if(q[2]>.5&&q[2]<60){L(q[0]-4,q[1]-2,q[0],q[1],'#222',1);L(q[0],q[1],q[0]+4,q[1]-2,'#222',1);}}}
  for(let i=idx;i<mn(rings.length,idx+4);i++){const r=rings[i];if(r.z<p.z-5)continue;const col=r.gold?'#ffcf3f':i===idx?'#ff4f9a':'#ff9838';for(let s=0;s<10;s++){const a=s/10*TAU,b=(s+1)/10*TAU,R1=2.5,R2=3.1;F([[r.x+cos(a)*R1,r.y+sin(a)*R1,r.z],[r.x+cos(b)*R1,r.y+sin(b)*R1,r.z],[r.x+cos(b)*R2,r.y+sin(b)*R2,r.z],[r.x+cos(a)*R2,r.y+sin(a)*R2,r.z]],s%2?col:'#fff0e0',false);}}
  if(inv%8<5){const P=xf(p.x,p.y,p.z,p.yaw,p.pch*.8,-p.bank*.7);F([P(0,.35,1.3),P(-2.6,0,-.7),P(0,.18,-.5)],'#ff4f6d');F([P(0,.35,1.3),P(0,.18,-.5),P(2.6,0,-.7)],'#ffcf3f');F([P(0,.36,1.1),P(-1.2,.2,.1),P(0,.3,.3)],'#f4f4f4');F([P(0,.36,1.1),P(0,.3,.3),P(1.2,.2,.1)],'#f4f4f4');
   mbox(P,0,-.95,-.1,.3,.22,1.2,'#2a4ab0');mbox(P,0,-.9,.55,.26,.26,.26,'#ffcf3f');}
  ps.draw();A.flush();A.fog=null;
  if(inv%8<5){const a=A.p3(p.x,p.y+.3,p.z+.2),b=A.p3(p.x,p.y-.8,p.z);if(a[2]>.1&&b[2]>.1){L(a[0],a[1],b[0],b[1],'rgba(40,40,40,.8)');}}
  if(lift>.02)vign(.35,'255,200,120');if(flash)alpha(flash/30,()=>R(0,0,W,H,'#ffffff'));unroll();
  const r=rings[idx];if(r){const q=A.p3(r.x,r.y,r.z);if(q[2]<.5||q[0]<8||q[0]>W-8||q[1]<20||q[1]>H-8){let dx=q[0]-160,dy=q[1]-120;if(q[2]<.5){dx=-dx;dy=-dy;}const a=atan2(dy,dx),ex=160+cos(a)*120,ey=120+sin(a)*90;A.poly([[ex+cos(a)*9,ey+sin(a)*9],[ex+cos(a+2.5)*7,ey+sin(a+2.5)*7],[ex+cos(a-2.5)*7,ey+sin(a-2.5)*7]],K.p,1);}}
  bar(0,18);T('RINGS '+passed,6,3,K.y,2);T('ALT '+Math.round((p.y-TH(p.x,p.z))*10)+'M',W-6,3,p.y-TH(p.x,p.z)<3?K.r:K.w,2,'r');
  const vs=lift-.009;T(lift>.02?'THERMAL LIFT':'',160,22,K.o,1,'c');meter(W-10,40,6,70,.5+vs*4,lift>.02?K.g:K.b);for(let i=0;i<3;i++)R(6+i*10,H-12,7,5,i<lives?K.c:'#3a3040');meter(6,H-20,60,5,(p.v-.14)/.48,K.w);};
 return g;}});

/* =================================================================== 5. SPACE DOGFIGHT 3D */
A.add({id:'dogfight3d',name:'SPACE DOGFIGHT 3D',cat:'RETRO 3D',hd:1,how:'ARROWS STEER, A FIRES, B BOOSTS. AIM AT THE LEAD DIAMOND. DOWN 15 FIGHTERS.',make(){
 const g={over:null,score:0};const fwd=(y,p)=>[sin(y)*cos(p),sin(p),cos(y)*cos(p)];
 const p={x:0,y:0,z:0,yaw:0,pit:0,yr:0,pr:0,v:.42},ps=mkP();let en=[],bl=[],eb=[],sh=100,boost=100,kills=0,hitF=0,rollV=0,target=null,lead=null,streak=0,wave=0;
 const stars=[];for(let i=0;i<170;i++){const a=rnd(TAU),b=Math.asin(rnd(2)-1);stars.push([cos(b)*sin(a),sin(b),cos(b)*cos(a),.3+rnd(.7)]);}
 const dust=[];for(let i=0;i<46;i++)dust.push([rnd(40)-20,rnd(40)-20,rnd(40)-20]);
 const rocks=[];for(let i=0;i<9;i++)rocks.push({x:rnd(160)-80,y:rnd(60)-30,z:rnd(160)-80,r:2+rnd(3.5),s:rnd(9)});
 const spawn=()=>{const a=p.yaw+rnd(2)-1,d=55+rnd(25);en.push({x:p.x+sin(a)*d,y:p.y+rnd(20)-10,z:p.z+cos(a)*d,yaw:a+PI+rnd(1)-.5,pit:0,v:.34+rnd(.06)+mn(.08,kills*.006),hp:2,cd:90+ri(90),ev:0,tr:.016+A.ai*.008+mn(.012,kills*.0008)});};
 for(let i=0;i<3;i++)spawn();
 g.update=()=>{ps.step();if(hitF>0)hitF--;const k=A.in(0);
  p.yr+=(ax(k)*.03-p.yr)*.14;p.pr+=(-ay(k)*.024-p.pr)*.14;p.yaw+=p.yr;p.pit=cl(p.pit+p.pr,-1.2,1.2);rollV+=(-p.yr*14-rollV)*.1;
  const bst=k.b&&boost>0;if(bst){boost-=.9;}else boost=mn(100,boost+.25);p.v+=((bst?.75:.42)-p.v)*.06;
  const f=fwd(p.yaw,p.pit);p.x+=f[0]*p.v;p.y+=f[1]*p.v;p.z+=f[2]*p.v;sh=mn(100,sh+.03);if(A.t%120===0)g.score+=1;
  // lead solution on the enemy nearest the crosshair
  target=null;lead=null;let bestA=.45;const Vp=[f[0]*p.v,f[1]*p.v,f[2]*p.v],BS=2.4;
  for(const e of en){const dx=e.x-p.x,dy=e.y-p.y,dz=e.z-p.z,d=hyp(dx,dy,dz);if(d>90)continue;const ang=Math.acos(cl((dx*f[0]+dy*f[1]+dz*f[2])/d,-1,1));if(ang<bestA){bestA=ang;target=e;}}
  if(target){const e=target,ef=fwd(e.yaw,e.pit),Vr=[ef[0]*e.v-Vp[0],ef[1]*e.v-Vp[1],ef[2]*e.v-Vp[2]],D=[e.x-p.x,e.y-p.y,e.z-p.z],a=Vr[0]*Vr[0]+Vr[1]*Vr[1]+Vr[2]*Vr[2]-BS*BS,b=2*(D[0]*Vr[0]+D[1]*Vr[1]+D[2]*Vr[2]),c=D[0]*D[0]+D[1]*D[1]+D[2]*D[2],disc=b*b-4*a*c;
   if(disc>0&&a<0){const t=(-b-sq(disc))/(2*a);if(t>0&&t<80){const Lx=D[0]+Vr[0]*t,Ly=D[1]+Vr[1]*t,Lz=D[2]+Vr[2]*t,ld=hyp(Lx,Ly,Lz);lead={x:Lx/ld,y:Ly/ld,z:Lz/ld,d:ld,ok:(Lx*f[0]+Ly*f[1]+Lz*f[2])/ld>.9985};}}}
  if(A.fire(7)){const r=[cos(p.yaw),0,-sin(p.yaw)];let dir=f;if(lead&&(lead.x*f[0]+lead.y*f[1]+lead.z*f[2])>.996)dir=[lead.x,lead.y,lead.z];for(const s of[-1,1])bl.push({x:p.x+r[0]*s*.9+f[0],y:p.y-.1+f[1],z:p.z+r[2]*s*.9+f[2],vx:dir[0]*BS+Vp[0],vy:dir[1]*BS+Vp[1],vz:dir[2]*BS+Vp[2],t:42});S('shoot');}
  for(const b of bl){b.x+=b.vx;b.y+=b.vy;b.z+=b.vz;b.t--;}
  for(const e of en){const dx=p.x-e.x,dy=p.y-p.y+(p.y-e.y),dz=p.z-e.z,d=hyp(dx,dy,dz);if(e.ev>0){e.ev--;}else if(d<9){e.ev=70+ri(50);e.eyaw=e.yaw+(Math.random()<.5?1.6:-1.6);e.epit=rnd(1.2)-.6;}
   const ty=e.ev>0?e.eyaw:atan2(dx,dz),tp=e.ev>0?e.epit:atan2(dy,hyp(dx,dz));e.yaw+=cl(wrapA(ty-e.yaw),-e.tr,e.tr);e.pit+=cl(tp-e.pit,-e.tr,e.tr);e.pit=cl(e.pit,-1.1,1.1);
   const ef=fwd(e.yaw,e.pit);e.x+=ef[0]*e.v;e.y+=ef[1]*e.v;e.z+=ef[2]*e.v;if(d>130){e.x=p.x-dx*.5;e.y=p.y-dy*.5;e.z=p.z-dz*.5;}
   if(--e.cd<=0&&d<55&&e.ev===0&&(ef[0]*dx+ef[1]*dy+ef[2]*dz)/d>.93){e.cd=70+ri(70)-A.ai*20;eb.push({x:e.x,y:e.y,z:e.z,vx:dx/d*1.15+Vp[0]*.6,vy:dy/d*1.15+Vp[1]*.6,vz:dz/d*1.15+Vp[2]*.6,t:100});}
   for(const b of bl)if(b.t>0&&hyp(b.x-e.x,b.y-e.y,b.z-e.z)<1.9){b.t=0;e.hp--;g.score+=10;S('hit');for(let i=0;i<5;i++)ps.add(e.x,e.y,e.z,rnd(.3)-.15,rnd(.3)-.15,rnd(.3)-.15,16,'#ffcf3f',.15);
    if(e.hp<=0&&!e.dead){e.dead=1;kills++;streak++;g.score+=100+mn(5,streak)*20;S('boom');A.shake=6;for(let i=0;i<26;i++)ps.add(e.x,e.y,e.z,rnd(.6)-.3,rnd(.6)-.3,rnd(.6)-.3,26+ri(20),['#ffcf3f','#ff9838','#ff4f6d','#f4f4f4'][i%4],.22+rnd(.25));pop('SPLASH! '+kills+'/15',K.o);}}}
  for(const b of eb){b.x+=b.vx;b.y+=b.vy;b.z+=b.vz;b.t--;if(hyp(b.x-p.x,b.y-p.y,b.z-p.z)<1.1){b.t=0;sh-=12;hitF=14;streak=0;S('hit');A.shake=8;if(sh<=0){g.over='SHIP DESTROYED - '+kills+' KILLS';S('boom');}}}
  for(const r of rocks){const rx=p.x+((r.x-p.x)%160+240)%160-80,ry=p.y+((r.y-p.y)%60+90)%60-30,rz=p.z+((r.z-p.z)%160+240)%160-80,d=hyp(rx-p.x,ry-p.y,rz-p.z);if(d<r.r+.8){sh-=25;hitF=20;A.shake=12;S('boom');p.yaw+=PI*.6;if(sh<=0)g.over='SHIP DESTROYED - '+kills+' KILLS';}}
  bl=bl.filter(b=>b.t>0);eb=eb.filter(b=>b.t>0);en=en.filter(e=>!e.dead);
  const want=mn(5,3+fl(kills/5));while(en.length<want&&kills+en.length<15)spawn();
  if(kills>=15){g.score+=fl(sh)*10;g.over='SECTOR CLEAR! VICTORY';}};
 const ship=(x,y,z,yaw,pit,rl,c1,c2,eng)=>{const P=xf(x,y,z,yaw,pit,rl);mbox(P,0,-.15,0,.5,.3,2,c1,c2);F([P(-.25,.15,1),P(.25,.15,1),P(0,0,1.9)],c2);F([P(-.25,-.15,1),P(0,0,1.9),P(.25,-.15,1)],c1);F([P(-.25,.15,1),P(0,0,1.9),P(-.25,-.15,1)],c1);F([P(.25,.15,1),P(.25,-.15,1),P(0,0,1.9)],c1);
  F([P(-.25,0,.5),P(-2,0,-.7),P(-1.9,0,-1),P(-.25,0,-.9)],c2);F([P(.25,0,.5),P(.25,0,-.9),P(1.9,0,-1),P(2,0,-.7)],c2);mbox(P,0,.15,.1,.28,.18,.7,'#9fe0ff');mbox(P,-1.9,-.15,-.85,.14,.3,.5,c1);mbox(P,1.9,-.15,-.85,.14,.3,.5,c1);
  const e=P(0,0,-1.1);bb(e[0],e[1],e[2],eng*(.3+rnd(.08)),'rgba(120,200,255,.85)');};
 g.draw=()=>{const f=fwd(p.yaw,p.pit),up=[-sin(p.yaw)*sin(p.pit),cos(p.pit),-cos(p.yaw)*sin(p.pit)];cam(p.x-f[0]*7.5+up[0]*1.9,p.y-f[1]*7.5+up[1]*1.9,p.z-f[2]*7.5+up[2]*1.9,p.yaw,p.pit-.05,205);
  A.cls('#03020c');roll(rollV*.05);const c=A.cam;
  const sp=d=>A.p3(c.x+d[0]*900,c.y+d[1]*900,c.z+d[2]*900);
  for(const[d,rgb,r]of[[[.6,.2,.8],'120,60,200',150],[[-.7,-.3,.5],'40,160,190',130],[[.1,.5,-.9],'200,60,120',160],[[-.3,-.1,-.95],'60,90,220',140]]){const q=sp(d);if(q[2]>0)glow(q[0],q[1],r,rgb,.45);}
  for(const s of stars){const q=sp(s);if(q[2]>0&&q[0]>-50&&q[0]<370&&q[1]>-50&&q[1]<290){const b=s[3];R(q[0],q[1],b>.8?2:1,b>.8?2:1,b>.7?'#ffffff':'#9aa8d8');}}
  {const q=sp([.45,-.25,.86]);if(q[2]>0){glow(q[0],q[1],90,'255,150,90',.25);C(q[0],q[1],48,'#c26a3a');alpha(.5,()=>C(q[0]+10,q[1]+8,44,'#5a2a1a'));A.c.strokeStyle='rgba(255,220,180,.6)';A.c.lineWidth=3;A.c.beginPath();A.c.ellipse(q[0],q[1],86,16,-.3,0,TAU);A.c.stroke();}}
  {const q=sp([-.5,.3,-.81]);if(q[2]>0)sun(q[0],q[1],8,'255,240,200');}
  A.fog={col:'#0a0820',near:40,far:110};
  for(const r of rocks){const rx=p.x+((r.x-p.x)%160+240)%160-80,ry=p.y+((r.y-p.y)%60+90)%60-30,rz=p.z+((r.z-p.z)%160+240)%160-80;msph(xf(rx,ry,rz,r.s+A.t*.003,r.s,0),0,0,0,r.r,'#6a5a52','#5a4c46',3,6);}
  for(const e of en){const d=hyp(e.x-p.x,e.y-p.y,e.z-p.z);if(d<120)ship(e.x,e.y,e.z,e.yaw,e.pit,0,'#4a4a58','#ff4f6d',1);}
  for(const b of bl){const s=.12;F([[b.x-s,b.y,b.z],[b.x+s,b.y,b.z],[b.x+s-b.vx*.5,b.y-b.vy*.5,b.z-b.vz*.5],[b.x-s-b.vx*.5,b.y-b.vy*.5,b.z-b.vz*.5]],'rgba(120,255,180,.95)',false);}
  for(const b of eb)bb(b.x,b.y,b.z,.3,'rgba(255,90,90,.95)');
  ship(p.x,p.y,p.z,p.yaw,p.pit,rollV*.06,'#d8dde8','#2fd6c3',p.v>.5?1.6:1);ps.draw();A.flush();A.fog=null;
  A.c.strokeStyle='rgba(255,255,255,.35)';A.c.beginPath();for(const d of dust){const wx=p.x+((d[0]-p.x)%40+60)%40-20,wy=p.y+((d[1]-p.y)%40+60)%40-20,wz=p.z+((d[2]-p.z)%40+60)%40-20,a=A.p3(wx,wy,wz),b=A.p3(wx-f[0]*p.v*5,wy-f[1]*p.v*5,wz-f[2]*p.v*5);if(a[2]>.3&&b[2]>.3){A.c.moveTo(a[0],a[1]);A.c.lineTo(b[0],b[1]);}}A.c.stroke();
  const ch=A.p3(p.x+f[0]*60,p.y+f[1]*60,p.z+f[2]*60);A.ring(ch[0],ch[1],7,'rgba(160,255,200,.8)');L(ch[0]-12,ch[1],ch[0]-4,ch[1],'#a0ffc8');L(ch[0]+4,ch[1],ch[0]+12,ch[1],'#a0ffc8');L(ch[0],ch[1]+4,ch[0],ch[1]+9,'#a0ffc8');
  for(const e of en){const q=A.p3(e.x,e.y,e.z);if(q[2]<.5)continue;const s=mx(5,mn(18,300/q[2])),col=e===target?K.r:'rgba(255,120,120,.6)';A.c.strokeStyle=col;A.c.beginPath();for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){A.c.moveTo(q[0]+sx*s,q[1]+sy*s);A.c.lineTo(q[0]+sx*s-sx*4,q[1]+sy*s);A.c.moveTo(q[0]+sx*s,q[1]+sy*s);A.c.lineTo(q[0]+sx*s,q[1]+sy*s-sy*4);}A.c.stroke();
   if(e===target&&lead){const lq=A.p3(p.x+lead.x*60,p.y+lead.y*60,p.z+lead.z*60);if(lq[2]>.5){L(q[0],q[1],lq[0],lq[1],'rgba(255,207,63,.5)');const lc=lead.ok?K.g:K.y;A.poly([[lq[0],lq[1]-6],[lq[0]+6,lq[1]],[lq[0],lq[1]+6],[lq[0]-6,lq[1]]],lc);if(lead.ok)A.poly([[lq[0],lq[1]-3],[lq[0]+3,lq[1]],[lq[0],lq[1]+3],[lq[0]-3,lq[1]]],lc,1);}T(Math.round(hyp(e.x-p.x,e.y-p.y,e.z-p.z)*10)+'M',q[0],q[1]+s+3,K.r,1,'c');}}
  unroll();if(hitF)alpha(hitF/30,()=>R(0,0,W,H,'#ff2040'));vign(.5);
  if(!target&&en.length){let best=null,bd=1e9;for(const e of en){const d=hyp(e.x-p.x,e.y-p.y,e.z-p.z);if(d<bd){bd=d;best=e;}}const q=A.p3(best.x,best.y,best.z);let dx=q[0]-160,dy=q[1]-120;if(q[2]<.5){dx=-dx;dy=-dy;}const a=atan2(dy,dx),ex=160+cos(a)*70,ey=120+sin(a)*55;A.poly([[ex+cos(a)*9,ey+sin(a)*9],[ex+cos(a+2.4)*7,ey+sin(a+2.4)*7],[ex+cos(a-2.4)*7,ey+sin(a-2.4)*7]],K.r,1);}
  bar(0,18);T('KILLS '+kills+'/15',6,3,K.y,2);meter(W-90,4,84,5,sh/100,sh<30?K.r:K.c);T('SHIELD',W-118,4,K.gr,1);meter(W-90,11,84,4,boost/100,K.b);T('BOOST',W-114,10,K.gr,1);
  const RX=W-26,RY=H-28;alpha(.5,()=>C(RX,RY,21,'#0a2a1a'));A.ring(RX,RY,21,'rgba(80,255,150,.6)');R(RX-1,RY-1,2,2,K.g);for(const e of en){const dx=e.x-p.x,dz=e.z-p.z,lx=dx*cos(p.yaw)-dz*sin(p.yaw),lz=dx*sin(p.yaw)+dz*cos(p.yaw),d=hyp(lx,lz),s=mn(1,20/mx(d,1))*d/4.5;if(d>0)R(RX+lx/d*mn(s,19)-1,RY-lz/d*mn(s,19)-1,3,3,e.y>p.y+5?K.o:K.r);}
  if(lead&&lead.ok)T('LOCK',160,150,K.g,1,'c');};
 return g;}});

/* =================================================================== 6. MINE CART 3D */
A.add({id:'minecart3d',name:'MINE CART 3D',cat:'RETRO 3D',hd:1,how:'LEFT/RIGHT SET THE NEXT SWITCH. UP JUMPS GAPS, DOWN DUCKS BEAMS.',make(){
 const g={over:null,score:0},LN=[-1.7,0,1.7],SEG=34,END=2400;
 const cx=z=>sin(z*.017)*4+sin(z*.041)*1.5,dcx=z=>.068*cos(z*.017)+.0615*cos(z*.041),cy=z=>sin(z*.011)*3+sin(z*.027)*1.2,dcy=z=>.033*cos(z*.011)+.0324*cos(z*.027);
 const p={z:2,lane:1,lx:0,jy:0,vy:0,duck:0,v:.24,sw:0,crash:0,inv:0},ps=mkP(),segs=[];let lives=3,gold=0,camLx=0,lastFork=0;
 const mkSeg=i=>{const z0=i*SEG,o=[];segs[i]={z0,o};if(i<1)return;const dead=Math.random()<.8?ri(3):-1;for(let l=0;l<3;l++){if(l===dead){o.push({l,k:'end',z:z0+15});continue;}const r=Math.random();if(r<.38)o.push({l,k:'gap',z:z0+9+ri(9)});else if(r<.72)o.push({l,k:'beam',z:z0+9+ri(12)});for(let j=0;j<3;j++)if(Math.random()<.55)o.push({l,k:'gold',z:z0+5+j*7+rnd(2)});}};
 for(let i=0;i<4;i++)mkSeg(i);
 const objs=l=>{const r=[];for(const s of segs)if(s)for(const o of s.o)if(l===undefined||o.l===l)r.push(o);return r;};
 const segOf=z=>segs[fl(z/SEG)];
 g.update=()=>{ps.step();const k=A.in(0),h=A.hit(0);if(p.inv>0)p.inv--;
  if(p.crash>0){p.crash--;if(p.crash===0){if(lives<=0){g.over='WRECKED IN THE MINE';return;}const i=fl(p.z/SEG)+1;p.z=i*SEG-6;const s=segOf(p.z);const deadL=s?s.o.filter(o=>o.k==='end').map(o=>o.l):[];if(deadL.includes(p.lane))p.lane=p.lane===1?0:1;p.lx=LN[p.lane];p.inv=60;p.v=.22;p.jy=0;p.vy=0;}return;}
  if(h.l)p.sw=p.sw===1?0:-1;if(h.r)p.sw=p.sw===-1?0:1;if(h.l||h.r)S('blip');
  if((h.u||h.a)&&p.jy===0){p.vy=.21;S('jump');}p.duck=k.d&&p.jy===0?1:0;
  if(p.jy>0||p.vy>0){p.jy+=p.vy;p.vy-=.0125;if(p.jy<=0){p.jy=0;p.vy=0;A.shake=3;for(let i=0;i<6;i++)ps.add(cx(p.z)+p.lx+rnd(1)-.5,cy(p.z)+.2,p.z,rnd(.1)-.05,.08,0,14,'#ffcf3f',.06,.01);}}
  p.v=cl(p.v+(.24+p.z/END*.3-p.v)*.02-dcy(p.z)*.01,.18,.62);const oz=p.z;p.z+=p.v;g.score+=fl(p.z/5)>fl(oz/5)?1:0;
  const fz=fl(p.z/SEG)*SEG;if(oz<fz&&p.z>=fz){if(p.sw){const nl=cl(p.lane+p.sw,0,2);if(nl!==p.lane){p.lane=nl;S('hit');for(let i=0;i<8;i++)ps.add(cx(p.z)+p.lx,cy(p.z)+.2,p.z,rnd(.2)-.1,.06+rnd(.06),0,16,'#ffd070',.05,.01);}}p.sw=0;mkSeg(fl(p.z/SEG)+3);}
  p.lx+=(LN[p.lane]-p.lx)*.15;
  if(abs(cy(p.z+2)-cy(p.z))>0||abs(dcx(p.z))>.1)if(A.t%3===0&&p.v>.4)ps.add(cx(p.z)+p.lx+(Math.random()<.5?-.5:.5),cy(p.z)+.15,p.z,rnd(.08)-.04,.05+rnd(.05),-.02,12,'#ffcf3f',.05,.008);
  for(const o of objs(p.lane)){if(o.done)continue;const d=p.z-o.z;
   if(o.k==='gold'&&abs(d)<.6&&p.jy<.8){o.done=1;gold++;g.score+=50;S('coin');}
   else if(o.k==='end'&&d>-.8){o.done=1;crash('DEAD END!');return;}
   else if(o.k==='beam'&&abs(d)<.4&&!p.duck&&p.inv===0){o.done=1;crash('BONK!');return;}
   else if(o.k==='gap'&&d>.3&&d<2.7&&p.jy<.15&&p.inv===0){o.done=1;crash('FELL IN!');return;}}
  segs.forEach((s,i)=>{if(s&&s.z0<p.z-SEG*2)segs[i]=null;});
  if(p.z>=END){g.score+=lives*300+gold*20;g.over='ESCAPED THE MINE! WIN';}};
 const crash=m=>{lives--;p.crash=70;S('boom');A.shake=12;pop(m,K.r);const q=A.p3(cx(p.z)+p.lx,cy(p.z)+1,p.z);if(q[2]>.1)A.burst(q[0],q[1],K.o,26,2.5);};
 g.draw=()=>{const z=p.z,czz=z-4.4;camLx+=(p.lx-camLx)*.2;cam(cx(czz)+camLx*.85,cy(czz)+2.25-p.duck*.55+p.jy*.5,czz,atan(dcx(z+3))*.8,atan(dcy(z+2))*.7-.12,200);const hz=hzY();
  A.cls('#050302');A.fog={col:'#0c0705',near:5,far:33};roll((LN[p.lane]-p.lx)*.06);
  for(let i=fl(z/1.5)*1.5-6;i<z+36;i+=1.5){const a=cx(i),b=cx(i+1.5),ya=cy(i),yb=cy(i+1.5),i2=i+1.5,n=((i*13)%7+7)%7,c1=['#3a2a1e','#36261a','#3e2c20','#33241a','#40301f','#382818','#3c2a1c'][n];
   F([[a-3.6,ya,i],[a+3.6,ya,i],[b+3.6,yb,i2],[b-3.6,yb,i2]],n%2?'#4a3a2a':'#463626');F([[a-3.6,ya,i],[a-3,ya+3.4,i],[b-3,yb+3.4,i2],[b-3.6,yb,i2]],c1);F([[a+3.6,ya,i],[b+3.6,yb,i2],[b+3,yb+3.4,i2],[a+3,ya+3.4,i]],c1);F([[a-3,ya+3.4,i],[a+3,ya+3.4,i],[b+3,yb+3.4,i2],[b-3,yb+3.4,i2]],'#241a12');}
  A.flush();
  const gapAt=(l,zz)=>objs(l).some(o=>o.k==='gap'&&zz>o.z-.2&&zz<o.z+3),endAt=(l,zz)=>{const s=segOf(zz);return s&&s.o.some(o=>o.k==='end'&&o.l===l&&zz>o.z+.4&&zz<s.z0+SEG);};
  for(let i=fl(z)-4;i<z+34;i+=2){const a=cx(i),ya=cy(i);for(let l=0;l<3;l++){const x=a+LN[l];if(gapAt(l,i)){F([[x-.9,ya+.01,i],[x+.9,ya+.01,i],[cx(i+2)+LN[l]+.9,cy(i+2)+.01,i+2],[cx(i+2)+LN[l]-.9,cy(i+2)+.01,i+2]],'#000000',false);continue;}if(endAt(l,i))continue;F([[x-.75,ya+.03,i],[x+.75,ya+.03,i],[x+.75,ya+.03,i+.35],[x-.75,ya+.03,i+.35]],'#5a3c22');}}
  A.flush();
  for(let i=fl(z/2)*2-4;i<z+34;i+=2){const i2=i+2,a=cx(i),b=cx(i2),ya=cy(i),yb=cy(i2);for(let l=0;l<3;l++){if(gapAt(l,i+1)||endAt(l,i+1))continue;for(const s of[-.5,.5]){const xa=a+LN[l]+s,xb=b+LN[l]+s;F([[xa-.06,ya+.1,i],[xa+.06,ya+.1,i],[xb+.06,yb+.1,i2],[xb-.06,yb+.1,i2]],'#9a9aa8',false);}}}
  for(let f0=fl(z/SEG)*SEG;f0<z+36;f0+=SEG){if(f0<z-4||f0<SEG)continue;const a=cx(f0-4),b=cx(f0),ya=cy(f0-4),yb=cy(f0);for(let l=0;l<3;l++)for(const d of[-1,1]){const l2=l+d;if(l2<0||l2>2)continue;const sel=l===p.lane&&d===p.sw;for(const s of[-.5,.5])F([[a+LN[l]+s-.06,ya+.11,f0-4],[a+LN[l]+s+.06,ya+.11,f0-4],[b+LN[l2]+s+.06,yb+.11,f0],[b+LN[l2]+s-.06,yb+.11,f0]],sel?'#ffcf3f':'#7a7a88',false);}
   const sl=p.lane,sx=a+LN[sl]+(p.sw?p.sw*.9:0);F([[sx-.5,ya+.12,f0-3],[sx+.5,ya+.12,f0-3],[sx,ya+.12,f0-1.6]],p.sw?'#ffcf3f':'#3dff8b',false);}
  A.flush();const lights=[];
  for(let i=fl(z/6)*6;i<z+36;i+=6){if(i<z-4)continue;const a=cx(i),y=cy(i);wbox(a-3.2,y,i,.35,3.4,.35,'#6a4628');wbox(a+3.2,y,i,.35,3.4,.35,'#6a4628');wbox(a,y+3.05,i,6.8,.35,.4,'#7a5230');if(fl(i/6)%2===0){wbox(a-2.85,y+2.3,i,.22,.3,.22,'#ffd070');lights.push([a-2.75,y+2.4,i]);}}
  for(const o of objs()){if(o.z<z-4||o.z>z+36||o.done&&o.k==='gold')continue;const a=cx(o.z),y=cy(o.z),x=a+LN[o.l];
   if(o.k==='gold'){mbox(xf(x,y+.35+sin(A.t*.1+o.z)*.08,o.z,A.t*.05),0,0,0,.32,.3,.32,'#ffcf3f','#fff0a0');lights.push([x,y+.5,o.z,1]);}
   else if(o.k==='beam'){wbox(x,y+1.05,o.z,1.9,.32,.36,'#c9a030');wbox(x-.95,y,o.z,.2,1.4,.2,'#6a4628');wbox(x+.95,y,o.z,.2,1.4,.2,'#6a4628');for(let s=0;s<3;s++)F([[x-.8+s*.6,y+1.38,o.z-.19],[x-.55+s*.6,y+1.38,o.z-.19],[x-.75+s*.6,y+1.06,o.z-.19],[x-1+s*.6,y+1.06,o.z-.19]],'#1a1a1a',false);}
   else if(o.k==='end'){wbox(x,y,o.z,1.5,.9,.5,'#c83a2a','#e8e8e8');wbox(x-.5,y+.9,o.z,.25,.4,.25,'#e8e8e8');wbox(x+.5,y+.9,o.z,.25,.4,.25,'#e8e8e8');for(let r=0;r<3;r++)mbox(xf(x+(r-1)*.6,y,o.z+1.2+r*.7,r),0,0,0,.7,.5,.6,'#4a4038');lights.push([x,y+1.4,o.z,2]);}}
  if(END-z<40){const a=cx(END),y=cy(END);F([[a-3,y,END],[a+3,y,END],[a+3,y+3.4,END],[a-3,y+3.4,END]],'#fff6d0',false);}
  const X=cx(z)+p.lx,Y=cy(z)+p.jy,P=xf(X,Y,z,atan(dcx(z)),-atan(dcy(z)),0);
  if(!p.crash||p.crash%8<4){mbox(P,0,.25,0,1.3,.85,1.7,'#6a6a72','#2a2420');mbox(P,0,.5,0,1.36,.1,1.76,'#8a5a30');mbox(P,0,.85,0,1.38,.08,1.78,'#8a8a96');for(const[wx,wz]of[[-.6,.55],[.6,.55],[-.6,-.55],[.6,-.55]])mcyl(P,wx,.22,wz,.22,.14,'#222',6,1);
   man(sub(P,0,p.duck?-.45:.15,-.1,0),{cr:.6,sh:'#3a6ad8',pa:'#3a3a3a',hl:'#ffcf3f',arm:p.duck?-.3:-.9,sw:0,lean:p.duck?.9:.1});}
  ps.draw();A.flush();A.fog=null;
  for(const l of lights){const q=A.p3(l[0],l[1],l[2]);if(q[2]>.5&&q[2]<36){const f=1-q[2]/36;glow(q[0],q[1],(l[3]===2?30:l[3]?14:40)*f+4,l[3]===2?'255,60,40':'255,190,90',.5*f);}}
  {const q=A.p3(X,Y+2,z+6);if(q[2]>.1){A.c.fillStyle=lg(q[0],q[1]-30,q[0],q[1]+40,[[0,'rgba(255,230,160,0)'],[1,'rgba(255,230,160,.12)']]);A.poly([[q[0]-10,q[1]-30],[q[0]+10,q[1]-30],[q[0]+90,q[1]+60],[q[0]-90,q[1]+60]],null,1);}}
  unroll();vign(.7);bar(0,18);T('GOLD '+gold,6,3,K.y,2);T(Math.round(mx(0,END-z))+'M',160,3,K.w,2,'c');for(let i=0;i<3;i++)R(W-14-i*13,4,10,8,i<lives?K.o:'#3a3040');
  const ax_=160,ay_=H-16;R(ax_-24,ay_-8,48,16,'#1a120c');A.box(ax_-24,ay_-8,48,16,p.sw?K.y:'#5a4a3a');T(p.sw<0?'< LEFT':p.sw>0?'RIGHT >':'STRAIGHT',ax_,ay_-3,p.sw?K.y:K.gr,1,'c');meter(6,H-10,60,5,(p.z%SEG)/SEG,K.o);T('FORK',70,H-10,K.gr,1);};
 return g;}});

/* =================================================================== 7. SKYDIVE 3D */
A.add({id:'skydive3d',name:'SKYDIVE 3D',cat:'RETRO 3D',hd:1,how:'ARROWS STEER THROUGH RINGS. A OPENS THE CHUTE. LAND ON THE TARGET.',make(){
 const g={over:null,score:0};const p={x:-30,y:900,z:-70,vx:0,vz:0,hd:0,chute:0,open:0,vy:.9},rings=[],ps=mkP();let passed=0,camT=0,flash=0,wind={x:rnd(.06)-.03,z:rnd(.06)-.03},msg=0;
 for(let i=0;i<15;i++){const y=860-i*46,t=i/14;rings.push({y,x:-30+30*t+sin(i*1.3)*9,z:-70+70*t+cos(i*1.7)*9,st:0});}
 const fieldC=['#6a9a3a','#7aa848','#9aa848','#c8b45a','#5a8a32','#8a7a42','#6aa050'],hash=(i,j)=>((i*73856093)^(j*19349663))>>>0;
 const clouds=[];for(let i=0;i<26;i++)clouds.push({x:rnd(300)-150,z:rnd(300)-150,y:i<13?620:400,r:14+rnd(18)});
 g.update=()=>{ps.step();if(flash>0)flash--;const k=A.in(0);
  if(!p.chute){p.vx+=ax(k)*.014;p.vz+=-ay(k)*.014;p.vx*=.965;p.vz*=.965;p.y-=p.vy;p.x+=p.vx;p.z+=p.vz;
   const r=rings.find(r=>!r.st&&r.y>p.y-1&&r.y<=p.y+p.vy+.01);if(r){const d=hyp(p.x-r.x,p.z-r.z);if(d<4.2){r.st=1;passed++;g.score+=100;S('coin');flash=10;pop('RING +100',K.y);}else{r.st=2;S('blip');}}
   for(const q of rings)if(!q.st&&q.y>p.y+1)q.st=2;
   if(A.hit(0).a&&p.y<820){p.chute=1;p.open=0;const bonus=p.y<220?fl((220-p.y)*3):0;g.score+=bonus;S('jump');if(bonus>0)pop('LOW PULL +'+bonus,K.c);p.hd=atan2(-p.x,-p.z);}
   if(p.y<60){p.chute=1;p.open=0;msg=90;S('lose');p.hd=atan2(-p.x,-p.z);}}
  else{p.open=mn(1,p.open+.03);p.hd+=ax(k)*.03;const fs=k.u?.32:k.d?.1:.22,sink=k.u?.16:k.d?.065:.1;const v=mn(p.vy,lerp(p.vy,sink,.05));p.vy=v<sink?sink:v;p.vy+=(sink-p.vy)*.06;
   p.x+=sin(p.hd)*fs*p.open+wind.x;p.z+=cos(p.hd)*fs*p.open+wind.z;p.y-=p.vy;if(A.t%30===0&&p.y>0)g.score+=1;
   if(p.y<=0){const d=hyp(p.x,p.z),hard=p.vy>.13;let pts=d<1.5?1000:d<4?600:d<9?300:d<20?120:40;if(hard)pts=fl(pts/2);g.score+=pts;S(d<4?'win':'score');
    g.over=d<1.5?'BULLSEYE! PERFECT LANDING':d<4?'ON TARGET! WIN':hard?'HARD LANDING '+Math.round(d*4)+'M OFF':'LANDED '+Math.round(d*4)+'M OFF';}}};
 g.draw=()=>{const fall=!p.chute;camT+=((fall?0:1)-camT)*.04;const t=camT,sh=sin(p.hd),ch=cos(p.hd);
  const cxp=lerp(p.x,p.x-sh*7,t),czp=lerp(p.z-2.6,p.z-ch*7,t),cyp=lerp(p.y+8,p.y+5.2,t);cam(cxp,cyp,czp,t>.5?p.hd:p.hd*t,lerp(-1.25,-.42,t),fall?190+mx(0,(300-p.y)*.0):205);const hz=hzY();
  sky('#2a5ab8','#cfe6f8',hz,'#b8c8c8','#b8c8c8');if(hz>-100)ridge(hz,'#8a9ab8',14,2,A.cam.ry*205,8);
  A.fog={col:'#c4d6e2',near:mx(30,p.y*.5),far:mx(140,p.y*1.6)};const G=40;
  if(t<.5)F([[-2000,-.1,-2000],[2000,-.1,-2000],[2000,-.1,2000],[-2000,-.1,2000]],'#6a9040',false);
  for(let i=-8;i<8;i++)for(let j=-8;j<8;j++){const x0=i*G,z0=j*G,h=hash(i,j);F([[x0,0,z0],[x0+G,0,z0],[x0+G,0,z0+G],[x0,0,z0+G]],fieldC[h%7],false);}
  A.flush();F([[-320,.05,-6],[320,.05,-6],[320,.05,-2],[-320,.05,-2]],'#6a6a72',false);F([[46,.05,-320],[50,.05,-320],[50,.05,320],[46,.05,320]],'#6a6a72',false);for(let i=-8;i<8;i++){const x0=i*G;F([[x0,.06,90+sin(i)*20],[x0+G,.06,90+sin(i+1)*20],[x0+G,.06,100+sin(i+1)*20],[x0,.06,100+sin(i)*20]],'#3a7ab8',false);}
  A.flush();
  if(p.y<500){const rr=[[12,'#f4f4f4'],[8,'#ff4f6d'],[4,'#f4f4f4'],[1.5,'#ffcf3f']];for(const[r,c]of rr){const pts=[];let ok=1;for(let i=0;i<20;i++){const a=i/20*TAU,q=A.p3(cos(a)*r,.1,sin(a)*r);if(q[2]<.1){ok=0;break;}pts.push([q[0],q[1]]);}if(ok)A.poly(pts,A.shade(c,1,hyp(A.cam.x,A.cam.y,A.cam.z)),1);}}
  if(p.y<260){for(let i=0;i<14;i++){const a=i*.9,d=24+(i*7)%30;tree(cos(a)*d,0,sin(a)*d,1.6+(i%3)*.3);}for(let i=0;i<8;i++)mbox(ID,60+(i%4)*7,0,-30+fl(i/4)*9,4,2.4+(i%3),5,['#d8c8a8','#c87a5a','#e8e0d0'][i%3],'#8a3a2a');const wp=[-14,0,-14];mcyl(ID,wp[0],0,wp[2],.1,3,'#888',4);const wa=atan2(wind.x,wind.z);F([[wp[0],3,wp[2]],[wp[0]+sin(wa)*2.2,2.8,wp[2]+cos(wa)*2.2],[wp[0],2.4,wp[2]]],'#ff9838',false);}
  for(const c of clouds){if(abs(c.y-p.y)>260||c.y>p.y+6)continue;flat(c.x,c.y,c.z,c.r,'rgba(255,255,255,.42)',10,.8);flat(c.x+c.r*.5,c.y+.5,c.z+c.r*.3,c.r*.6,'rgba(255,255,255,.4)',9);flat(c.x-c.r*.5,c.y+1,c.z-c.r*.2,c.r*.55,'rgba(255,255,255,.4)',9);}
  for(const r of rings){if(r.st===2||r.y>p.y+12||r.y<p.y-260)continue;const col=r.st?'#3dff8b':'#ff9838';for(let s=0;s<12;s++){const a=s/12*TAU,b=(s+1)/12*TAU;F([[r.x+cos(a)*3.6,r.y,r.z+sin(a)*3.6],[r.x+cos(b)*3.6,r.y,r.z+sin(b)*3.6],[r.x+cos(b)*4.4,r.y,r.z+sin(b)*4.4],[r.x+cos(a)*4.4,r.y,r.z+sin(a)*4.4]],s%2?col:'#ffcf3f',false);}}
  if(fall){const P=xf(p.x,p.y,p.z,0,-PI/2+.15,0);man(sub(P,0,-.9,0,0),{sh:'#ff4f9a',pa:'#2a2a6a',hl:'#ffcf3f',sw:0,sp:.5,as:1.4,arm:-.2});}
  else{const P=xf(p.x,p.y,p.z,p.hd,0,-ax(A.in(0))*.25),o=p.open;man(sub(P,0,-1.8,0,0),{sh:'#ff4f9a',pa:'#2a2a6a',hl:'#ffcf3f',sw:.15,ph:A.t*.05,arm:-2.6});for(let i=0;i<7;i++){const xx=(i-3)*.95*o,yy=1.6+(2.2-abs(i-3)*abs(i-3)*.12)*o;mbox(sub(P,xx,yy,0,0,-(i-3)*.12*o),0,0,0,.92*o+.05,.32,1.6*o+.1,i%2?'#ff4f6d':'#f4f4f4',null,'#c8c8c8');}}
  ps.draw();A.flush();A.fog=null;
  if(!fall&&p.open>.3){const P=xf(p.x,p.y,p.z,p.hd,0,0),a=A.p3(...P(0,-.6,0));A.c.strokeStyle='rgba(30,30,30,.5)';A.c.beginPath();for(const i of[0,2,4,6]){const b=A.p3(...P((i-3)*.95,1.6+(2.2-(i-3)*(i-3)*.12),0));if(a[2]>.1&&b[2]>.1){A.c.moveTo(a[0],a[1]);A.c.lineTo(b[0],b[1]);}}A.c.stroke();}
  for(const c of[620,400])if(abs(p.y-c)<12)alpha((1-abs(p.y-c)/12)*.7,()=>R(0,0,W,H,'#ffffff'));
  if(fall)speedLines(.7,160,130,'230,240,255');if(flash)alpha(flash/25,()=>R(0,0,W,H,'#ffffff'));
  bar(0,18);T('RINGS '+passed,6,3,K.y,2);T(fall?Math.round(p.vy*240)+' KMH':'CANOPY',160,3,fall?K.w:K.c,2,'c');T(Math.round(hyp(p.x,p.z)*4)+'M',W-6,3,K.w,2,'r');
  const ax0=W-12;R(ax0,26,6,170,'#15122a');R(ax0,26+170*(1-p.y/900),6,2,K.y);R(ax0-1,26+170*(1-220/900),8,1,K.c);T(Math.round(mx(0,p.y)*4)+'M',ax0-3,26+170*(1-p.y/900)-2,K.y,1,'r');
  if(fall&&p.y<300&&A.t%30<20)T('A = PULL CHUTE',160,24,p.y<120?K.r:K.y,1,'c');if(msg>0){msg--;T('AUTO-OPEN!',160,34,K.r,1,'c');}
  if(!fall){const wa=atan2(wind.x,wind.z)-p.hd;const ax2=30,ay2=40;A.ring(ax2,ay2,10,K.gr);L(ax2,ay2,ax2+sin(wa)*9,ay2-cos(wa)*9,K.o,2);T('WIND',ax2,53,K.gr,1,'c');}};
 return g;}});

/* =================================================================== 8. DIRT RALLY 3D */
A.add({id:'rally3d',name:'DIRT RALLY 3D',cat:'RETRO 3D',hd:1,how:'UP GAS, DOWN BRAKE, STEER. B HANDBRAKE. REACH CHECKPOINTS IN TIME.',make(){
 const g={over:null,score:0},N=900,RW=3.4,PT=[];let hx=0,hz=0,an=0,da=0;
 for(let i=0;i<N;i++){PT.push([hx,hz]);if(i>12){if(Math.random()<.04)da=(rnd(2)-1)*.055;da*=.985;}an=cl(an+da,-1.25,1.25);if(abs(an)>1.2)da*=-.5;hx+=sin(an)*2;hz+=cos(an)*2;}
 const EL=i=>sin(i*.02)*2.5+sin(i*.053)*1,NR=[];for(let i=0;i<N;i++){const a=PT[mx(0,i-1)],b=PT[mn(N-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],d=hyp(dx,dz)||1;NR.push([dz/d,-dx/d]);}
 const CPS=[150,300,450,600,750,N-10];
 const c={x:0,z:2,h:0,vx:0,vz:0,idx:1,lat:0,steer:0},ps=mkP();g.dbg=()=>{const a=PT[mn(N-1,c.idx+4)],da=wrapA(atan2(a[0]-c.x,a[1]-c.z)-c.h);return{da:+da.toFixed(2),lat:+c.lat.toFixed(2),cp,t:fl(time/60),i:c.idx};};let time=60*22,cp=0,drift=0,dcool=0,camH=0,bump=0,msgT=0,best=0;
 const near=()=>{let bi=c.idx,bd=1e9;for(let i=mx(0,c.idx-4);i<mn(N-1,c.idx+10);i++){const d=hyp(PT[i][0]-c.x,PT[i][1]-c.z);if(d<bd){bd=d;bi=i;}}c.idx=bi;const n=NR[bi];c.lat=(c.x-PT[bi][0])*n[0]+(c.z-PT[bi][1])*n[1];};
 g.update=()=>{ps.step();const k=A.in(0);time--;if(dcool>0)dcool--;
  const f=[sin(c.h),cos(c.h)],r=[cos(c.h),-sin(c.h)];let vf=c.vx*f[0]+c.vz*f[1],vl=c.vx*r[0]+c.vz*r[1];const dirt=abs(c.lat)<RW;
  if(k.u||k.a)vf+=.0075*(1-vf/(dirt?.8:.45));if(k.d)vf-=vf>0?.015:.004;vf*=.996;if(!dirt&&vf>.45)vf*=.97;
  c.steer+=(ax(k)-c.steer)*.25;c.h+=c.steer*.04*cl(abs(vf)/.22,0,1)*(vf<0?-1:1)+vl*.035;
  vl*=k.b?.975:dirt?.91:.87;if(k.b)vf*=.985;
  c.vx=f[0]*vf+r[0]*vl;c.vz=f[1]*vf+r[1]*vl;c.x+=c.vx;c.z+=c.vz;near();
  if(abs(c.lat)>RW+4.3){const n=NR[c.idx],s=Math.sign(c.lat),ex=abs(c.lat)-(RW+4.3);c.x-=n[0]*s*ex;c.z-=n[1]*s*ex;const vn=c.vx*n[0]+c.vz*n[1];c.vx-=n[0]*vn*1.5;c.vz-=n[1]*vn*1.5;c.vx*=.6;c.vz*=.6;S('hit');A.shake=8;drift=0;bump=10;}
  if(abs(vl)>.06&&vf>.22&&dirt){drift+=abs(vl)*10;dcool=20;}else if(dcool===0&&drift>0){const pts=fl(drift);if(pts>=5){g.score+=pts;pop('DRIFT +'+pts,K.c);}drift=0;}
  const spd=hyp(c.vx,c.vz);if(spd>.12&&(abs(vl)>.04||k.u)&&A.t%2===0){for(const s of[-.6,.6])ps.add(c.x+r[0]*s-f[0]*1.1,EL(c.idx)+.25,c.z+r[1]*s-f[1]*1.1,-c.vx*.2+rnd(.04)-.02,.03+rnd(.03),-c.vz*.2+rnd(.04)-.02,30,dirt?'rgba(176,138,96,.45)':'rgba(120,150,80,.4)',.14,0,4);}
  if(c.idx>=CPS[cp]){cp++;S('score');if(cp>=CPS.length){g.score+=fl(time/6)+500;g.over='STAGE CLEAR! WIN';return;}time+=60*10;g.score+=200;pop('CHECKPOINT +10S',K.g,60);msgT=60;}
  if(c.idx>best){g.score+=c.idx-best>0&&fl(c.idx/5)>fl(best/5)?1:0;best=c.idx;}
  if(time<=0)g.over='TIME UP - CP '+cp+'/5';};
 const tr=(x,y,z,s)=>{mcyl(ID,x,y,z,.2*s,1.2*s,'#5a3a22',4);cone(ID,x,y+1*s,z,1.3*s,3*s,'#2a5a28',6);};
 g.draw=()=>{camH+=wrapA(c.h-camH)*.09;const sh=sin(camH),ch=cos(camH),Y=EL(c.idx);cam(c.x-sh*6,Y+2.6,c.z-ch*6,camH,-.17,205);const hz=hzY();
  sky('#3a78c8','#e8e0c8',hz,'#d8d0b8','#4a6a32');sun(220-camH*205%1290,hz-70,8,'255,245,210');ridge(hz,'#7a9a8a',22,3,camH*205,9);ridge(hz,'#3a6a3a',12,8,camH*240,6);
  A.fog={col:'#ddd6c2',near:24,far:84};
  for(let i=mx(1,c.idx-3);i<mn(N-1,c.idx+44);i++){const a=PT[i],b=PT[i+1],na=NR[i],nb=NR[i+1],ya=EL(i),yb=EL(i+1),q=(i>>1)%2;
   F([[a[0]-na[0]*RW,ya,a[1]-na[1]*RW],[a[0]+na[0]*RW,ya,a[1]+na[1]*RW],[b[0]+nb[0]*RW,yb,b[1]+nb[1]*RW],[b[0]-nb[0]*RW,yb,b[1]-nb[1]*RW]],q?'#a8784a':'#a27246');
   for(const s of[-1,1])F([[a[0]+na[0]*RW*s,ya,a[1]+na[1]*RW*s],[a[0]+na[0]*22*s,ya-.4,a[1]+na[1]*22*s],[b[0]+nb[0]*22*s,yb-.4,b[1]+nb[1]*22*s],[b[0]+nb[0]*RW*s,yb,b[1]+nb[1]*RW*s]],q?'#5e8a38':'#588434');}
  A.flush();
  for(let i=mx(1,c.idx-3);i<mn(N-2,c.idx+30);i+=1){const a=PT[i],b=PT[i+1],na=NR[i],nb=NR[i+1],ya=EL(i)+.01,yb=EL(i+1)+.01;for(const s of[-1.2,1.2])F([[a[0]+na[0]*(s-.25),ya,a[1]+na[1]*(s-.25)],[a[0]+na[0]*(s+.25),ya,a[1]+na[1]*(s+.25)],[b[0]+nb[0]*(s+.25),yb,b[1]+nb[1]*(s+.25)],[b[0]+nb[0]*(s-.25),yb,b[1]+nb[1]*(s-.25)]],'rgba(90,60,35,.35)',false);}
  const cy_=EL(c.idx);shd(c.x,cy_,c.z,1.1,1.5,.35);
  for(const ci of CPS)if(ci>c.idx-3&&ci<c.idx+44){const a=PT[ci],n=NR[ci];for(let s=-4;s<4;s++)F([[a[0]+n[0]*s*RW/4,EL(ci)+.02,a[1]+n[1]*s*RW/4],[a[0]+n[0]*(s+1)*RW/4,EL(ci)+.02,a[1]+n[1]*(s+1)*RW/4],[a[0]+n[0]*(s+1)*RW/4+ (PT[ci+1][0]-a[0])*.5,EL(ci)+.02,a[1]+n[1]*(s+1)*RW/4+(PT[ci+1][1]-a[1])*.5],[a[0]+n[0]*s*RW/4+(PT[ci+1][0]-a[0])*.5,EL(ci)+.02,a[1]+n[1]*s*RW/4+(PT[ci+1][1]-a[1])*.5]],(s+8)%2?'#f4f4f4':'#1a1a1a',false);}
  A.flush();const ppl=[];
  for(let i=fl(c.idx/3)*3;i<mn(N-1,c.idx+42);i+=3){if(i<c.idx-3)continue;const a=PT[i],n=NR[i],h=(i*2654435761)>>>0,s=h%2?1:-1,off=RW+5+(h%5);const y=EL(i);if(h%7<5)tr(a[0]+n[0]*off*s,y-.3,a[1]+n[1]*off*s,1+(h%4)*.15);else mbox(xf(a[0]+n[0]*(RW+2.5)*s,y-.2,a[1]+n[1]*(RW+2.5)*s,h),0,0,0,1.1,.7,1,'#8a8478','#a09a8a');if(h%9===0)tr(a[0]-n[0]*off*s,y-.3,a[1]-n[1]*off*s,1.2);}
  for(const ci of CPS)if(ci>c.idx-3&&ci<c.idx+44){const a=PT[ci],n=NR[ci],y=EL(ci),fin=ci===CPS[CPS.length-1];for(const s of[-1,1])wbox(a[0]+n[0]*(RW+.6)*s,y,a[1]+n[1]*(RW+.6)*s,.3,3.6,.3,'#e8e8e8');const L1=[a[0]-n[0]*(RW+.6),y+3.1,a[1]-n[1]*(RW+.6)],L2=[a[0]+n[0]*(RW+.6),y+3.1,a[1]+n[1]*(RW+.6)];F([L1,L2,[L2[0],y+3.9,L2[2]],[L1[0],y+3.9,L1[2]]],fin?'#1a1a1a':'#ff4f6d');
   for(let j=0;j<6;j++)ppl.push([a[0]+n[0]*(RW+2+j%3*.8)*(j<3?1:-1),y,a[1]+n[1]*(RW+2+j%3*.8)*(j<3?1:-1),j]);}
  const P=xf(c.x,cy_+(bump>0?sin(bump--)*.06:0),c.z,c.h,0,-c.steer*.05),wr=A.t*.4;mbox(P,0,.32,0,1.36,.46,2.5,'#1a4ac8','#2a5ad8');mbox(P,0,.78,-.15,1.12,.42,1.3,'#9ad0ff','#1a4ac8');mbox(P,0,.79,-.15,1.18,.06,.06,'#ffcf3f');mbox(P,0,.5,1.26,1.2,.18,.06,'#ffcf3f');mbox(P,0,.98,-1.15,1.3,.06,.36,'#1a1a1a');for(const s of[-.45,.45])mbox(P,s,.88,-1.05,.08,.16,.08,'#333');
  mbox(P,-.69,.32,.2,.04,.3,1.6,'#ffcf3f');mbox(P,.69,.32,.2,.04,.3,1.6,'#ffcf3f');for(const[wx,wz]of[[-.66,.85],[.66,.85],[-.66,-.85],[.66,-.85]])mcyl(P,wx,.32,wz,.32,.24,'#161616',7,1,'#7a7a7a');
  ps.draw();A.flush();A.fog=null;
  for(const q0 of ppl){const q=A.p3(q0[0],q0[1],q0[2]);if(q[2]>2&&q[2]<60){const s=1.75*205/q[2]/33;A.person(q[0],q[1],{s,c:['#ff4f6d','#ffcf3f','#4dabff','#3dff8b','#ff9838','#f4f4f4'][q0[3]],arm1:-2.5+sin(A.t*.3+q0[3])*.5,id:q0[3]});}}
  speedLines(hyp(c.vx,c.vz)>.6?(hyp(c.vx,c.vz)-.6)*3:0,160,hz+30,'255,240,220');
  bar(0,18);T(Math.ceil(mx(0,time)/60)+'S',160,3,time<300&&A.t%20<10?K.r:K.w,2,'c');T('CP '+cp+'/5',6,3,K.y,2);T(Math.round(hyp(c.vx,c.vz)*200)+' KMH',W-6,5,K.w,1,'r');meter(6,H-9,W-12,4,c.idx/N,K.o);if(drift>5)T('DRIFT '+fl(drift),160,24,K.c,1,'c');if(abs(c.lat)>RW)T('OFF ROAD',160,34,K.o,1,'c');};
 return g;}});

/* =================================================================== 9. DEEP SUB 3D */
A.add({id:'sub3d',name:'DEEP SUB 3D',cat:'RETRO 3D',hd:1,how:'ARROWS STEER. A PINGS SONAR TO REVEAL ROCKS AND MINES. REACH THE BASE.',make(){
 const g={over:null,score:0},END=1600,HW=6.6;
 const cx=z=>sin(z*.02)*6+sin(z*.047)*3,dcx=z=>.12*cos(z*.02)+.141*cos(z*.047),fy=z=>-4+sin(z*.03)*1.2+sin(z*.071)*.5;
 const p={x:0,y:0,z:0,vx:0,vy:0,v:.15},ps=mkP();let ob=[],nz=26,hull=3,inv=0,ping=-1,cd=0,pearls=0,dist=0,camX=0,camY=0,scrape=0;
 const snow=[];for(let i=0;i<46;i++)snow.push([rnd(W),rnd(H),.3+rnd(.7)]);
 const addOb=()=>{const z=nz,c=cx(z),r=Math.random(),f=fy(z);let o;if(r<.32)o={k:'pillar',x:c+rnd(10)-5,z,w:1.4+rnd(1.2)};else if(r<.52)o={k:'arch',x:c,z,h:f+1.2+rnd(4.5)};else if(r<.8)o={k:'mine',x:c+rnd(10)-5,y:f+1.5+rnd(5.5),z,ph:rnd(9)};else o={k:'jelly',x:c+rnd(10)-5,y:f+2+rnd(5),z,ph:rnd(9)};o.seen=0;ob.push(o);if(Math.random()<.55)ob.push({k:'pearl',x:c+rnd(8)-4,y:f+1+rnd(5.5),z:z+4.5,seen:0});nz+=mx(5.5,11-z/220)+rnd(5);};
 while(nz<90)addOb();
 const hurt=m=>{if(inv>0)return;hull--;inv=90;S('boom');A.shake=12;pop(m,K.r);if(hull<=0)g.over='HULL BREACHED - '+Math.round(p.z)+'M';};
 g.update=()=>{ps.step();if(inv>0)inv--;if(cd>0)cd--;const k=A.in(0);
  if(A.hit(0).a&&cd===0){ping=0;cd=130;S('blip');}if(ping>=0){ping+=1.15;for(const o of ob)if(!o.seen&&hyp(o.x-p.x,(o.y||0)-p.y,o.z-p.z)<ping)o.seen=260;if(ping>62)ping=-1;}
  p.vx+=ax(k)*.012;p.vy+=-ay(k)*.011;p.vx*=.92;p.vy*=.92;p.v=mn(.32,.15+p.z/END*.17);p.x+=p.vx;p.y+=p.vy;p.z+=p.v;dist+=p.v;if(fl(dist/6)>fl((dist-p.v)/6))g.score+=1;
  const c=cx(p.z),f=fy(p.z);scrape=0;if(abs(p.x-c)>HW-.9){p.x=c+Math.sign(p.x-c)*(HW-.9);p.vx*=-.3;scrape=1;}p.y=cl(p.y,f+.7,f+10);if(p.y===f+.7)scrape=1;if(scrape&&A.t%3===0){S('hit');ps.add(p.x,p.y-.3,p.z+1,rnd(.1)-.05,.05,0,20,'#ffcf3f',.06,.004);}
  if(A.t%4===0)ps.add(p.x+rnd(.3),p.y+rnd(.3),p.z-1.6,rnd(.02)-.01,.03+rnd(.02),-.02,50,'rgba(200,240,255,.55)',.06);
  for(const o of ob){if(o.seen>0)o.seen--;if(o.done)continue;const dz=o.z-p.z;if(abs(dz)>3)continue;
   if(o.k==='pillar'&&abs(p.x-o.x)<o.w/2+.6&&abs(dz)<o.w/2+.8){o.done=1;hurt('ROCK!');}
   else if(o.k==='arch'&&abs(dz)<1&&abs(p.y-(o.h+1.1))<1.6){o.done=1;hurt('ROCK SHELF!');}
   else if(o.k==='mine'&&hyp(p.x-o.x,p.y-o.y,dz)<1.4){o.done=1;hurt('MINE!');const q=A.p3(o.x,o.y,o.z);if(q[2]>.1)A.burst(q[0],q[1],K.o,30,3);}
   else if(o.k==='jelly'&&hyp(p.x-o.x,p.y-o.y,dz)<1.2){o.done=1;hurt('STUNG!');}
   else if(o.k==='pearl'&&hyp(p.x-o.x,p.y-o.y,dz)<1.4){o.done=1;pearls++;g.score+=50;S('coin');}}
  for(const o of ob){if(o.k==='mine')o.y+=sin(A.t*.03+o.ph)*.01;if(o.k==='jelly'){o.y+=sin(A.t*.05+o.ph)*.02;o.x+=sin(A.t*.02+o.ph)*.015;}}
  ob=ob.filter(o=>o.z>p.z-6);while(nz<p.z+90&&nz<END-20)addOb();
  if(p.z>=END){g.score+=hull*300+pearls*20;g.over='DOCKED AT THE BASE! COMPLETE';}};
 g.draw=()=>{camX+=(p.x-camX)*.15;camY+=(p.y-camY)*.15;const z=p.z,cz=z-7.2;cam(camX*.8+cx(cz)*.2,camY+2.1,cz,atan(dcx(z+4))*.7,-.13,205);const hz=hzY();
  fillG(0,0,W,H,[[0,'#0e4a7a'],[.45,'#06264a'],[1,'#020a18']]);
  A.c.fillStyle='rgba(120,200,255,.05)';for(let i=0;i<4;i++){const x=((i*97+A.t*.15)%420)-50;A.poly([[x,0],[x+26,0],[x+70,H],[x+20,H]],null,1);}
  A.fog={col:'#03142a',near:5,far:30};
  for(let s=fl(z/1.5)*1.5-3;s<z+42;s+=1.5){const a=cx(s),b=cx(s+1.5),fa=fy(s),fb=fy(s+1.5),s2=s+1.5,n=((s*7)%5+5)%5,wc=['#24384a','#203446','#28404e','#1e3040','#2a3c4c'][n];
   F([[a-HW,fa,s],[a+HW,fa,s],[b+HW,fb,s2],[b-HW,fb,s2]],n%2?'#4a5a5a':'#445452');F([[a-HW,fa,s],[a-HW-1.6,fa+11,s],[b-HW-1.6,fb+11,s2],[b-HW,fb,s2]],wc);F([[a+HW,fa,s],[b+HW,fb,s2],[b+HW+1.6,fb+11,s2],[a+HW+1.6,fa+11,s]],wc);}
  A.flush();
  for(let s=fl(z/5)*5;s<z+30;s+=5){if(s<z-3)continue;const h=(s*2654435761)>>>0,a=cx(s),f=fy(s);if(h%3===0){const kx=a+(h%2?-1:1)*(HW-1.2);for(let i=0;i<3;i++)F([[kx+i*.25-.05,f,s],[kx+i*.25+.05,f,s],[kx+i*.25+sin(A.t*.04+i)*.3,f+1.6+i*.3,s]],'#2f8a5a',false);}else if(h%3===1)mbox(xf(a+(h%5-2)*1.8,f-.1,s,h),0,0,0,.9,.4,.7,'#6a6a62');}
  const marks=[];for(const o of ob){if(o.done||o.z<z-4)continue;const d=hyp(o.x-p.x,(o.y||p.y)-p.y,o.z-z);const vis=d<10||o.seen>0;if(!vis)continue;
   A.fog=d<10?{col:'#03142a',near:4,far:14}:{col:'#0a3a2a',near:30,far:80};const f=fy(o.z),sn=d>=10;
   if(o.k==='pillar'){mbox(xf(o.x,f,o.z,o.z),0,0,0,o.w,11,o.w,sn?'#2a8a5a':'#5a6a6a',sn?'#3dff8b':'#6a7a7a');}
   else if(o.k==='arch'){wbox(o.x,o.h,o.z,HW*2+2,2.2,1.4,sn?'#2a8a5a':'#5a5e60',sn?'#3dff8b':'#6e7276');}
   else if(o.k==='mine'){const P=xf(o.x,o.y,o.z,A.t*.01);msph(P,0,0,0,.6,sn?'#2a8a5a':'#3a3a40',sn?'#2a7a50':'#2a2a30',3,6);for(const[sx,sy,sz]of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])mbox(P,sx*.75,sy*.75-.08,sz*.75,.14,.16,.14,sn?'#3dff8b':'#8a8a90');mcyl(ID,o.x,f,o.z,.03,o.y-f,'#3a3a3a',3);if(!sn&&A.t%30<15)marks.push([o.x,o.y+.7,o.z,'255,60,60',8]);}
   else if(o.k==='jelly'){const pu=1+sin(A.t*.12+o.ph)*.15;msph(ID,o.x,o.y,o.z,.6*pu,'rgba(255,120,220,.65)',null,3,7);for(let i=0;i<4;i++)F([[o.x+cos(i*1.6)*.4,o.y,o.z+sin(i*1.6)*.4],[o.x+cos(i*1.6)*.4+.05,o.y,o.z+sin(i*1.6)*.4],[o.x+cos(i*1.6)*.4+sin(A.t*.1+i)*.2,o.y-1.4,o.z+sin(i*1.6)*.4]],'rgba(255,160,230,.5)',false);marks.push([o.x,o.y,o.z,'255,120,220',14]);}
   else if(o.k==='pearl'){mcyl(ID,o.x,o.y-.15,o.z,.4,.15,'#c8a8e8',6);msph(ID,o.x,o.y+.1,o.z,.22,'#ffffff','#f0e8ff',3,6);marks.push([o.x,o.y,o.z,'240,230,255',12]);}
   if(sn)marks.push([o.x,o.y||o.h||f+3,o.z,'s']);}
  A.fog={col:'#03142a',near:6,far:32};
  if(END-z<40){const a=cx(END),f=fy(END);msph(ID,a,f,END+4,4.5,'#8a9aa8','#7a8a98',4,10);wbox(a,f,END-.5,2.4,2.6,1.5,'#3a4a5a');for(let i=0;i<5;i++)marks.push([a-3+i*1.5,f+3.6,END+1,'255,220,120',16]);}
  const P=xf(p.x,p.y,p.z,-PI/2+p.vx*.6,0,-p.vy*.3);if(inv%8<5){mcyl(P,0,0,0,.55,2.6,'#ffcf3f',8,1,'#e8b02a');msph(sub(P,1.3,0,0,0),0,0,0,.55,'#ffcf3f',null,3,8);mbox(P,-.1,.42,0,.9,.55,.42,'#e8b02a');mbox(P,.05,.98,0,.08,.4,.08,'#888');mbox(P,-1.25,-.45,0,.35,.9,.06,'#d89a2a');mbox(P,-1.25,0,0,.35,.06,1.3,'#d89a2a');const PR=sub(P,-1.45,0,0,A.t*.4);mbox(PR,0,-.35,0,.05,.7,.1,'#666');mbox(PR,0,-.05,-.35,.05,.1,.7,'#666');mbox(P,1.15,.1,0,.3,.3,.75,'#9fe0ff');}
  ps.draw();A.flush();A.fog=null;
  const hq=A.p3(...P(1.6,0,0));if(hq[2]>.1){A.c.fillStyle=lg(hq[0],hq[1],hq[0],hq[1]-90,[[0,'rgba(220,250,255,.22)'],[1,'rgba(220,250,255,0)']]);A.poly([[hq[0]-6,hq[1]],[hq[0]+6,hq[1]],[hq[0]+60,hq[1]-100],[hq[0]-60,hq[1]-100]],null,1);glow(hq[0],hq[1],18,'230,250,255',.7);}
  for(const m of marks){const q=A.p3(m[0],m[1],m[2]);if(q[2]<.3)continue;if(m[3]==='s'){const s=mx(5,mn(16,140/q[2]));A.c.strokeStyle='rgba(61,255,139,.8)';A.c.strokeRect(q[0]-s,q[1]-s,s*2,s*2);}else glow(q[0],q[1],m[4]*mn(2,10/q[2])+3,m[3],.6);}
  if(ping>=0){const pq=A.p3(p.x,p.y,p.z);if(pq[2]>.1){A.c.strokeStyle='rgba(61,255,139,'+(1-ping/62)*.8+')';A.c.lineWidth=2;A.c.beginPath();A.c.ellipse(pq[0],pq[1],ping*5,ping*2.6,0,0,TAU);A.c.stroke();A.c.lineWidth=1;}alpha((1-ping/62)*.12,()=>R(0,0,W,H,'#3dff8b'));}
  for(const s of snow){s[1]+=.15*s[2];s[0]-=p.vx*8*s[2];if(s[1]>H)s[1]=0;if(s[0]<0)s[0]+=W;if(s[0]>W)s[0]-=W;R(s[0],s[1],1,1,'rgba(220,240,255,'+(s[2]*.5)+')');}
  vign(.75,'0,5,20');
  bar(0,18);T(Math.round(p.z)+'M',6,3,K.c,2);T('PEARLS '+pearls,160,5,K.w,1,'c');for(let i=0;i<3;i++)R(W-14-i*13,4,10,8,i<hull?K.y:'#3a3040');meter(6,H-10,70,5,1-cd/130,K.g);T(cd?'SONAR':'SONAR READY',80,H-10,cd?K.gr:K.g,1);meter(W-86,H-10,80,5,p.z/END,K.c);};
 return g;}});

/* =================================================================== 10. MINI GOLF 3D */
A.add({id:'minigolf3d',name:'MINI GOLF 3D',cat:'RETRO 3D',hd:1,time:480,how:'LEFT/RIGHT AIM. HOLD A FOR POWER, RELEASE TO PUTT. B OVERVIEW. 6 HOLES.',make(){
 const g={over:null,score:0};const rim=(x0,z0,x1,z1)=>[[x0-.2,z0-.2,x1+.2,z0],[x0-.2,z1,x1+.2,z1+.2],[x0-.2,z0,x0,z1],[x1,z0,x1+.2,z1]];
 const HO=[{par:2,tee:[0,1],cup:[0,11.5],fl:[[-1.2,0,1.2,4,0,0],[-1.2,4,1.2,6,0,.35,'z'],[-1.2,6,1.2,8,.35,.35],[-1.2,8,1.2,10,.35,0,'z'],[-1.2,10,1.2,13,0,0]],wl:rim(-1.2,0,1.2,13)},
  {par:3,tee:[0,1],cup:[5.4,10.3],fl:[[-1.2,0,1.2,9,0,0],[-1.2,9,6.5,11.6,0,0]],wl:[[-1.4,0,-1.2,11.8],[1.2,0,1.4,9],[-1.4,-.2,1.4,0],[-1.4,11.6,6.7,11.8],[1.2,8.8,6.7,9],[6.5,9,6.7,11.6],[2.7,9.7,3.3,10.6]]},
  {par:3,tee:[0,1],cup:[0,12.5],fl:[[-1.5,0,1.5,14,0,0]],wl:rim(-1.5,0,1.5,14).concat([[-1.5,6.7,-.45,7.3],[.45,6.7,1.5,7.3]]),mill:7},
  {par:3,tee:[0,1],cup:[.6,12.4],fl:[[-1.5,0,1.5,5,0,0],[-1.5,5,1.5,9,0,.9,'z'],[-1.5,9,1.5,14,.9,.9]],wl:rim(-1.5,0,1.5,14).concat([[-.8,10.6,-.2,11]])},
  {par:3,tee:[0,1],cup:[0,13],fl:[[-1.5,0,1.5,6,0,0],[-1.5,6,1.5,7.4,0,.45,'z'],[-1.8,9.6,1.8,15,.2,.2]],wl:[[-1.7,0,-1.5,7.4],[1.5,0,1.7,7.4],[-1.7,-.2,1.7,0],[-2,9.6,-1.8,15],[1.8,9.6,2,15],[-2,15,2,15.2]],water:[7.4,9.6]},
  {par:4,tee:[0,1],cup:[0,16.5],fl:[[-1.5,0,1.5,18,0,0]],wl:rim(-1.5,0,1.5,18).concat([[-1.5,4.7,-.45,5.3],[.45,4.7,1.5,5.3],[-.9,9.6,-.3,10.2],[.3,11.6,.9,12.2],[-.3,13.6,.3,14.2]]),mill:5}];
 let hn=0,h,b,ang,st,strokes,pw=0,pt=0,charging=0,wa=0,last,res=0,camP=null,tot=0,totPar=0,over=0,flagW=0;
 const load=()=>{h=HO[hn];b={x:h.tee[0],y:0,z:h.tee[1],vx:0,vy:0,vz:0,gr:1};ang=atan2(h.cup[0]-b.x,h.cup[1]-b.z);st='aim';strokes=0;last=[b.x,b.z];res=0;charging=0;};load();
 const floorAt=(x,z)=>{for(const f of h.fl)if(x>=f[0]&&x<=f[2]&&z>=f[1]&&z<=f[3]){let t=0,sx=0,sz=0;if(f[6]==='z'){t=(z-f[1])/(f[3]-f[1]);sz=(f[5]-f[4])/(f[3]-f[1]);}else if(f[6]==='x'){t=(x-f[0])/(f[2]-f[0]);sx=(f[5]-f[4])/(f[2]-f[0]);}return{h:f[4]+(f[5]-f[4])*t,sx,sz};}return null;};
 const blocked=()=>{if(!h.mill)return 0;for(let i=0;i<4;i++)if(abs(wrapA(wa+i*PI/2+PI/2))<.34)return 1;return 0;};
 const walls=()=>{const w=h.wl.slice();if(h.mill&&blocked())w.push([-.45,h.mill-.15,.45,h.mill+.15]);return w;};
 g.update=()=>{wa+=.028;flagW+=.1;const k=A.in(0);
  if(st==='aim'){ang+=ax(k)*.03;if(k.a){charging=1;pt++;pw=(1-cos(pt*PI/50))/2;}else if(charging){charging=0;const v=.04+pw*.34;b.vx=sin(ang)*v;b.vz=cos(ang)*v;strokes++;st='roll';last=[b.x,b.z];S('hit');pt=0;}}
  else if(st==='roll'){const R0=.12;for(let s=0;s<4;s++){b.x+=b.vx/4;b.z+=b.vz/4;const fa=floorAt(b.x,b.z);
    if(b.gr){if(!fa||fa.h<b.y-.06){b.gr=0;}else{b.y=fa.h;b.vy=b.vx*fa.sx+b.vz*fa.sz;b.vx-=fa.sx*.0026;b.vz-=fa.sz*.0026;}}
    if(!b.gr){b.y+=b.vy/4;b.vy-=.003;if(fa&&b.y<=fa.h){if(fa.h-b.y<.25){b.y=fa.h;b.gr=1;b.vy=0;S('blip');}else{b.vx*=-.5;b.vz*=-.5;}}}
    for(const w of walls()){const nx=cl(b.x,w[0],w[2]),nz=cl(b.z,w[1],w[3]),dx=b.x-nx,dz=b.z-nz,d=hyp(dx,dz);if(d<R0&&b.y<1.2){if(d>1e-6){b.x=nx+dx/d*R0;b.z=nz+dz/d*R0;const vn=b.vx*dx/d+b.vz*dz/d;if(vn<0){b.vx-=1.75*vn*dx/d;b.vz-=1.75*vn*dz/d;if(abs(vn)>.03)S('blip');}}else{b.vx*=-.7;b.vz*=-.7;}}}}
   if(b.gr){b.vx*=.983;b.vz*=.983;}const sp=hyp(b.vx,b.vz),fa=floorAt(b.x,b.z);
   if(b.gr&&hyp(b.x-h.cup[0],b.z-h.cup[1])<.21){if(sp<.25){st='sunk';res=110;S('win');const rs=strokes===1?'HOLE IN ONE!':strokes<=h.par-2?'EAGLE!':strokes===h.par-1?'BIRDIE!':strokes===h.par?'PAR':strokes===h.par+1?'BOGEY':'+'+(strokes-h.par);const pts=strokes===1?500:strokes<h.par?300:strokes===h.par?200:strokes===h.par+1?100:50;g.score+=pts;pop(rs+' +'+pts,K.y,60);tot+=strokes;totPar+=h.par;return;}else{b.vx+=(b.x-h.cup[0])*.02;b.vz+=(b.z-h.cup[1])*.02;}}
   if(b.y<-.5||(!fa&&b.gr)){st='aim';strokes++;b.x=last[0];b.z=last[1];const f0=floorAt(b.x,b.z);b.y=f0?f0.h:0;b.vx=b.vz=b.vy=0;b.gr=1;S('lose');pop('SPLASH! +1',K.b,60);}
   else if(b.gr&&sp<.004&&(!fa||abs(fa.sx)+abs(fa.sz)<.01)){b.vx=b.vz=0;if(strokes>=7){st='sunk';res=110;g.score+=25;tot+=8;totPar+=h.par;pop('PICKED UP',K.gr,60);S('lose');}else{st='aim';ang=atan2(h.cup[0]-b.x,h.cup[1]-b.z);}}}
  else if(st==='sunk'){if(--res<=0){hn++;if(hn>=HO.length){const d=tot-totPar;g.over=d<=0?'COURSE COMPLETE! '+(d<0?d:'EVEN'):'ROUND OVER +'+d;return;}load();}}};
 g.draw=()=>{const ov=A.in(0).b;let tx,ty,tz,ry,rx;if(ov){tx=0;ty=13;tz=h.cup[1]*.5-5.5;ry=0;rx=-1.0;}else{const a=st==='aim'?ang:atan2(b.vx,b.vz)||ang;tx=b.x-sin(a)*3.6;tz=b.z-cos(a)*3.6;ty=b.y+2.3;ry=a;rx=-.45;}
  if(!camP)camP={x:tx,y:ty,z:tz,ry,rx};const kk=.12;camP.x+=(tx-camP.x)*kk;camP.y+=(ty-camP.y)*kk;camP.z+=(tz-camP.z)*kk;camP.ry+=wrapA(ry-camP.ry)*kk;camP.rx+=(rx-camP.rx)*kk;cam(camP.x,camP.y,camP.z,camP.ry,camP.rx,210);const hz=hzY();
  sky('#4a8ae0','#d8eefa',hz,'#7ab84a','#4a8a32');ridge(hz,'#5a9a5a',16,hn,camP.ry*210,8);A.fog={col:'#cfe6f0',near:20,far:48};
  for(let x=-12;x<12;x+=6)for(let z=-6;z<24;z+=6)F([[x,-.05,z],[x+6,-.05,z],[x+6,-.05,z+6],[x,-.05,z+6]],((x+z)/6)&1?'#5aa040':'#539a3a');
  if(h.water)F([[-2.5,-.02,h.water[0]],[2.5,-.02,h.water[0]],[2.5,-.02,h.water[1]],[-2.5,-.02,h.water[1]]],A.t%40<20?'#3a8ad8':'#3484d0',false);
  A.flush();
  for(const f of h.fl){const nx=mx(1,Math.round((f[2]-f[0])/1.2)),nz=mx(1,Math.round(f[3]-f[1]));for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x0=f[0]+(f[2]-f[0])*i/nx,x1=f[0]+(f[2]-f[0])*(i+1)/nx,z0=f[1]+(f[3]-f[1])*j/nz,z1=f[1]+(f[3]-f[1])*(j+1)/nz,H_=(x,z)=>f[6]==='z'?f[4]+(f[5]-f[4])*(z-f[1])/(f[3]-f[1]):f[6]==='x'?f[4]+(f[5]-f[4])*(x-f[0])/(f[2]-f[0]):f[4];
    F([[x0,H_(x0,z0),z0],[x1,H_(x1,z0),z0],[x1,H_(x1,z1),z1],[x0,H_(x0,z1),z1]],(i+j)%2?'#2fae4a':'#2aa444');}
   if(f[4]>0||f[5]>0){const ya=f[4],yb=f[6]==='z'?f[5]:f[4];F([[f[0],0,f[1]],[f[0],ya,f[1]],[f[0],yb,f[3]],[f[0],0,f[3]]],'#8a6a4a');F([[f[2],0,f[1]],[f[2],0,f[3]],[f[2],yb,f[3]],[f[2],ya,f[1]]],'#8a6a4a');if(ya>0)F([[f[0],0,f[1]],[f[2],0,f[1]],[f[2],ya,f[1]],[f[0],ya,f[1]]],'#7a5a3a');}}
  A.flush();const cf_=floorAt(h.cup[0],h.cup[1]),cy0=cf_?cf_.h:0;flat(h.cup[0],cy0+.01,h.cup[1],.2,'#101010',10);if(st!=='sunk'||res>100)shd(b.x,(floorAt(b.x,b.z)||{h:-.03}).h,b.z,.14,.14,.4);A.flush();
  for(const w of h.wl){let top=0;for(const f of h.fl)if(w[0]<f[2]+.25&&w[2]>f[0]-.25&&w[1]<f[3]+.25&&w[3]>f[1]-.25)top=mx(top,f[4],f[5]);const ww=w[2]-w[0],dd=w[3]-w[1];if(ww*dd>.5)wbox((w[0]+w[2])/2,-.05,(w[1]+w[3])/2,ww,top+.35,dd,'#c8503a','#f0e6d8');else{const n=mx(1,Math.round(mx(ww,dd)/2));for(let i=0;i<n;i++){const a=i/n,c=(i+1)/n;wbox(ww>dd?w[0]+ww*(a+c)/2:(w[0]+w[2])/2,-.05,ww>dd?(w[1]+w[3])/2:w[1]+dd*(a+c)/2,ww>dd?ww/n:ww,top+.35,ww>dd?dd:dd/n,'#c8503a','#f0e6d8');}}}
  if(h.mill){const mz=h.mill;wbox(0,0,mz+.9,2.6,2.6,1.6,'#f0e0c0','#f0e0c0','#e8d6b4');cone(ID,0,2.6,mz+.9,2,1.4,'#b8483a',4);wbox(0,0,mz+.31,.9,.75,.05,'#2a1a10');const c=[0,2.6,mz+.05];for(let i=0;i<4;i++){const a=wa+i*PI/2,ca=cos(a),sa=sin(a),px=-sa*.32,py=ca*.32;F([[c[0]+px*.2,c[1]+py*.2,c[2]],[c[0]-px*.2,c[1]-py*.2,c[2]],[c[0]+ca*2.3-px,c[1]+sa*2.3-py,c[2]],[c[0]+ca*2.3+px,c[1]+sa*2.3+py,c[2]]],i%2?'#f4f4f4':'#6a4a2a');}mbox(ID,0,2.45,mz,.3,.3,.2,'#333');}
  mcyl(ID,h.cup[0],cy0,h.cup[1],.03,1.6,'#e8e8e8',4);F([[h.cup[0],cy0+1.6,h.cup[1]],[h.cup[0]+.6+sin(flagW)*.05,cy0+1.45,h.cup[1]+sin(flagW)*.1],[h.cup[0],cy0+1.25,h.cup[1]]],'#ff4f6d',false);
  for(let i=0;i<3;i++)tree(-6+i*12*(i%2?1:.4),0,6+i*6,1.4);
  if(st!=='sunk')msph(ID,b.x,b.y+.12,b.z,.12,'#ffffff','#e8e8f0',3,6);A.flush();A.fog=null;
  if(st==='aim'){for(let i=1;i<12;i++){const d=i*.35*(.4+pw*1.4),q=A.p3(b.x+sin(ang)*d,b.y+.05,b.z+cos(ang)*d);if(q[2]>.1)R(q[0]-1,q[1]-1,2,2,i%2?'#ffffff':'#ffcf3f');}}
  bar(0,18);T('HOLE '+(hn+1)+'/6',6,3,K.y,2);T('PAR '+h.par,160,5,K.w,1,'c');T('STROKES '+strokes,W-6,5,K.w,1,'r');
  if(st==='aim'){meter(110,H-14,100,8,pw,pw>.85?K.r:pw>.5?K.y:K.g);T(charging?'RELEASE!':'HOLD A',160,H-24,K.w,1,'c');}if(h.mill)T(blocked()?'BLOCKED':'',160,24,K.r,1,'c');};
 return g;}});

/* =================================================================== 11. SNOW ROLLER 3D */
A.add({id:'snowroll3d',name:'SNOW ROLLER 3D',cat:'RETRO 3D',hd:1,how:'UP PUSH, LEFT/RIGHT TURN. ROLL OVER THINGS SMALLER THAN YOU TO GROW.',make(){
 const g={over:null,score:0},FS=95,GOAL=5;const b={x:0,z:0,r:.5,hd:0,v:0,rot:0},stuck=[],trail=[],obs=[];let camH=0,bonk=0,grow=0;
 const KC={pebble:'#8a8a92',cone:'#7a4a2a',gift:'#ff4f6d',man:'#f4f8ff',sled:'#d84a2a',bush:'#3a7a3a',car:'#4d7bff',tree:'#2f6a2e',cabin:'#9a6a3a',barn:'#c8402a'};
 const kindOf=s=>s<.25?(Math.random()<.5?'pebble':'cone'):s<.45?'gift':s<.8?'man':s<1.3?(Math.random()<.5?'sled':'bush'):s<2.2?'car':s<3.6?'tree':s<5.2?'cabin':'barn';
 const mk=(s,x,z)=>({x,z,s,k:kindOf(s),yaw:rnd(TAU),c:['#ff4f6d','#ffcf3f','#3dff8b','#4dabff','#ff9838','#b070ff'][ri(6)]});
 for(let i=0;i<120;i++){const a=rnd(TAU),d=3+rnd(28);obs.push(mk(.13+rnd(.3),sin(a)*d,cos(a)*d));}for(let i=0;i<70;i++){const a=rnd(TAU),d=14+rnd(60);obs.push(mk(.45+rnd(1.2),sin(a)*d,cos(a)*d));}for(let i=0;i<50;i++){const a=rnd(TAU),d=38+rnd(55);obs.push(mk(1.6+rnd(5),cl(sin(a)*d,-FS,FS),cl(cos(a)*d,-FS,FS)));}
 g.dbg=()=>{let bd=1e9,da=0;for(const o of obs){if(o.s>=b.r*.72)continue;const d=hyp(o.x-b.x,o.z-b.z);if(d<bd){bd=d;da=wrapA(atan2(o.x-b.x,o.z-b.z)-b.hd);}}return{da:+da.toFixed(2),r:+b.r.toFixed(2)};};const respawn=o=>{const a=b.hd+rnd(3)-1.5,d=10+b.r*3+rnd(14+b.r*5);const s=b.r*(.22+rnd(.75));Object.assign(o,mk(s,cl(b.x+sin(a)*d,-FS,FS),cl(b.z+cos(a)*d,-FS,FS)));};
 g.update=()=>{const k=A.in(0);if(bonk>0)bonk--;if(grow>0)grow--;b.hd+=ax(k)*.045/(1+b.r*.12);if(k.u||k.a)b.v+=.006;if(k.d)b.v-=.008;b.v=cl(b.v*.986,-.08,.2+b.r*.05);
  b.x+=sin(b.hd)*b.v;b.z+=cos(b.hd)*b.v;b.rot+=b.v/b.r;if(abs(b.x)>FS-b.r||abs(b.z)>FS-b.r){b.x=cl(b.x,-FS+b.r,FS-b.r);b.z=cl(b.z,-FS+b.r,FS-b.r);b.v*=-.5;S('hit');}
  if(A.t%4===0&&abs(b.v)>.02){trail.push([b.x,b.z,b.r]);if(trail.length>40)trail.shift();}
  for(const o of obs){const d=hyp(o.x-b.x,o.z-b.z);if(d>b.r+o.s)continue;
   if(o.s<b.r*.72){if(d<b.r+o.s*.3){const v0=b.r;b.r=Math.cbrt(b.r*b.r*b.r+o.s*o.s*o.s*2.2);g.score+=mx(1,Math.round(o.s*o.s*40));stuck.push({c:KC[o.k]==='#f4f8ff'?o.c:KC[o.k],s:o.s/v0,th:rnd(TAU),ph:rnd(PI)-PI/2});if(stuck.length>16)stuck.shift();S(o.s>b.r*.4?'score':'coin');grow=10;if(fl(b.r)>fl(v0))pop('SIZE '+fl(b.r)+'M!',K.c,60);respawn(o);}}
   else{const nx=(b.x-o.x)/(d||1),nz=(b.z-o.z)/(d||1),pen=b.r+o.s*.85-d;if(pen>0){b.x+=nx*pen;b.z+=nz*pen;if(abs(b.v)>.05&&bonk===0){S('hit');A.shake=4;bonk=20;if(stuck.length&&abs(b.v)>.12){stuck.pop();b.r*=.985;}}b.v*=-.35;}}}
  if(b.r>=GOAL){g.score+=500;g.over='GIANT SNOWBALL! WIN';}};
 const model=o=>{const P=xf(o.x,0,o.z,o.yaw),s=o.s;switch(o.k){
  case'pebble':msph(P,0,s*.4,0,s*.6,'#8a8a92',null,2,5);break;case'cone':mbox(P,0,0,0,s*.8,s*1.1,s*.8,'#7a4a2a');break;
  case'gift':mbox(P,0,0,0,s*1.2,s*1.1,s*1.2,o.c);mbox(P,0,0,0,s*.25,s*1.15,s*1.25,'#ffcf3f');break;
  case'man':msph(P,0,s*.55,0,s*.6,'#f4f8ff',null,3,6);msph(P,0,s*1.4,0,s*.42,'#f4f8ff',null,3,6);mbox(P,0,s*1.4,s*.38,s*.1,s*.1,s*.3,'#ff9838');mbox(P,0,s*1.75,0,s*.5,s*.4,s*.5,'#222');break;
  case'sled':mbox(P,0,s*.25,0,s*.9,s*.15,s*1.8,'#d84a2a');mbox(P,-s*.4,0,0,s*.08,s*.25,s*1.9,'#888');mbox(P,s*.4,0,0,s*.08,s*.25,s*1.9,'#888');break;
  case'bush':msph(P,0,s*.5,0,s*.8,'#3a7a3a','#f4f8ff',2,6);break;
  case'car':mbox(P,0,s*.2,0,s*1.1,s*.5,s*2.2,o.c);mbox(P,0,s*.7,-s*.1,s*.95,s*.45,s*1.2,'#bfe6ff','#f4f8ff');break;
  case'tree':mcyl(P,0,0,0,s*.12,s*.6,'#5a3a22',4);cone(P,0,s*.4,0,s*.7,s*1.3,'#2f6a2e',6);cone(P,0,s*1.1,0,s*.5,s*1.1,'#f4f8ff',6);break;
  case'cabin':mbox(P,0,0,0,s*1.4,s*1,s*1.2,'#9a6a3a');const r1=P(-s*.75,s,-s*.65),r2=P(s*.75,s,-s*.65),r3=P(s*.75,s,s*.65),r4=P(-s*.75,s,s*.65),rt=P(-s*.75,s*1.6,0),rt2=P(s*.75,s*1.6,0);F([r1,r2,rt2,rt],'#f4f8ff');F([r4,rt,rt2,r3],'#e8f0fa');F([r1,rt,r4],'#9a6a3a');F([r2,r3,rt2],'#9a6a3a');mbox(P,0,s*.2,s*.61,s*.3,s*.5,s*.02,'#ffcf3f');break;
  case'barn':mbox(P,0,0,0,s*1.4,s*.9,s*1.6,'#c8402a','#f4f8ff');cone(P,0,s*.9,0,s*1.05,s*.7,'#f4f8ff',4);break;}};
 g.draw=()=>{camH+=wrapA(b.hd-camH)*.07;const r=b.r,D=3+r*3.4,sh=sin(camH),ch=cos(camH);cam(b.x-sh*D,1.2+r*2.1,b.z-ch*D,camH,-.3,205);const hz=hzY();
  sky('#7aa4d8','#eef4fa',hz,'#e6eef6','#c8d8ea');ridge(hz,'#c8d4e8',30,2,camH*205,9);ridge(hz,'#a8b8d0',16,5,camH*230,7);
  const far=24+r*14;A.fog={col:'#e8eef6',near:far*.35,far};const G=r<2?6:12,ox=fl(b.x/G)*G,oz=fl(b.z/G)*G,inV=wedge(far+G),n=Math.ceil((far+G)/G);
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const x0=ox+i*G,z0=oz+j*G;if(!inV(x0+G/2,z0+G/2))continue;const out=abs(x0+G/2)>FS||abs(z0+G/2)>FS;F([[x0,0,z0],[x0+G,0,z0],[x0+G,0,z0+G],[x0,0,z0+G]],out?'#b8c8dc':((i+j)&1?'#f4f8fc':'#eaf0f8'),false);}
  A.flush();for(const t of trail)flat(t[0],.01,t[1],t[2]*.7,'rgba(160,180,215,.16)',8);shd(b.x,0,b.z,r*1.05,r*1.05,.3);A.flush();
  for(let i=-FS;i<FS;i+=8)for(const[x,z]of[[i,-FS],[i,FS],[-FS,i],[FS,i]])if(hyp(x-b.x,z-b.z)<far)wbox(x,0,z,.25,1.2,.25,'#8a5a3a');
  const vis=obs.filter(o=>{const d=hyp(o.x-b.x,o.z-b.z);return d<far+o.s&&!(o.s<r*.07&&d>r*7)&&inV(o.x,o.z);}).sort((a,c)=>hyp(a.x-b.x,a.z-b.z)-hyp(c.x-b.x,c.z-b.z)).slice(0,70);
  for(const o of vis){model(o);if(o.s<r*.72&&hyp(o.x-b.x,o.z-b.z)<r*5+4){const q=A.p3(o.x,o.s*1.6+.2,o.z);if(q[2]>.5)o.mark=q;else o.mark=null;}else o.mark=null;}
  const P=xf(b.x,r,b.z,b.hd,-b.rot,0);msph(P,0,0,0,r,'#ffffff','#e2eaf6',5,9);for(const s of stuck){const q=P(0,0,0),u=[cos(s.ph)*cos(s.th),sin(s.ph),cos(s.ph)*sin(s.th)];const pp=P(u[0]*r*.97,u[1]*r*.97,u[2]*r*.97),cm=A.cam,vis2=(pp[0]-q[0])*(cm.x-pp[0])+(pp[1]-q[1])*(cm.y-pp[1])+(pp[2]-q[2])*(cm.z-pp[2])>0;if(vis2)mbox(ID,pp[0],pp[1]-r*.06,pp[2],r*mn(.35,s.s*.7)+.03,r*mn(.35,s.s*.7)+.03,r*mn(.35,s.s*.7)+.03,s.c);}
  A.flush();A.fog=null;for(const o of vis)if(o.mark&&A.t%40<30)R(o.mark[0]-1,o.mark[1]-1,3,3,'#3dff8b');
  for(let i=0;i<50;i++){const x=((i*71+A.t*(.4+i%3*.2)-camH*120)%340+340)%340-10,y=((i*53+A.t*(.6+i%4*.25))%250);R(x,y,i%5?1:2,i%5?1:2,'rgba(255,255,255,.85)');}
  if(grow)vign(grow/20,'120,200,255');
  bar(0,18);T('SIZE '+r.toFixed(2)+'M',6,3,K.c,2);T('GOAL '+GOAL+'M',W-6,5,K.w,1,'r');meter(110,6,100,6,(r-.5)/(GOAL-.5),K.c);T('GRAB < '+(r*.72).toFixed(2)+'M',160,H-12,K.g,1,'c');};
 return g;}});

/* =================================================================== 12. WATER SLIDE 3D */
A.add({id:'waterslide3d',name:'WATER SLIDE 3D',cat:'RETRO 3D',hd:1,how:'LEFT/RIGHT LEAN. LEAN INTO BANKS OR FLY OFF. GRAB RINGS. HIT THE POOL.',make(){
 const g={over:null,score:0},END=2400,RD=2.2,LIP=1.85;
 const cx=s=>9*sin(s*.016)+5*sin(s*.037),dcx=s=>.144*cos(s*.016)+.185*cos(s*.037),ddx=s=>-.002304*sin(s*.016)-.006845*sin(s*.037),cy=s=>-s*.11+2.5*sin(s*.021),dcy=s=>-.11+.0525*cos(s*.021);
 const tube=s=>(s>420&&s<540)||(s>1050&&s<1200)||(s>1750&&s<1900);
 const p={s:3,th:0,tv:0,v:.3,fly:0,fx:0,fy:0,fz:0,fvx:0,fvy:0,fvz:0},ps=mkP();let lives=3,camT=0,items=[],nI=30,boostT=0;
 const addI=()=>{const s=nI,eq=cl(-ddx(s+4)*.36*3/(.012),-1.3,1.3);items.push(Math.random()<.25?{k:'boost',s,th:0}:{k:'ring',s,th:cl(eq*.6+rnd(.4)-.2,-1.4,1.4)});nI+=14+rnd(14);};while(nI<120)addI();
 g.dbg=()=>({th:+p.th.toFixed(2),tv:+p.tv.toFixed(3),s:fl(p.s),lives});const pos=(s,th,r)=>[cx(s)+sin(th)*r,cy(s)-cos(th)*r,s];
 g.update=()=>{ps.step();if(boostT>0)boostT--;const k=A.in(0);
  if(p.fly){p.fly--;p.fx+=p.fvx;p.fy+=p.fvy;p.fz+=p.fvz;p.fvy-=.012;if(p.fly===0){if(lives<=0){g.over='WIPED OUT - '+Math.round(p.s)+'M';return;}p.th=0;p.tv=0;p.v=.3;}return;}
  p.v+=-dcy(p.s)*.012-p.v*p.v*.006;if(boostT>0)p.v+=.004;p.v=cl(p.v,.2,.95);
  p.tv+=-sin(p.th)*.006*(1+p.v)-ddx(p.s)*p.v*p.v*4+ax(k)*.0058;p.tv*=.95;p.th+=p.tv;const os=p.s;p.s+=p.v;if(fl(p.s/8)>fl(os/8))g.score+=1;
  if(tube(p.s))p.th=cl(p.th,-2.6,2.6);else if(abs(p.th)>LIP){lives--;p.fly=80;const q=pos(p.s,p.th,RD);p.fx=q[0];p.fy=q[1];p.fz=q[2];p.fvx=sin(p.th)*.25+dcx(p.s)*p.v;p.fvy=.2;p.fvz=p.v;S('lose');A.shake=8;pop('FLEW OFF!',K.r);return;}
  for(const it of items){if(it.got||abs(it.s-p.s)>p.v+.6)continue;if(abs(it.th-p.th)<.32){it.got=1;if(it.k==='ring'){g.score+=50;S('coin');}else{boostT=60;g.score+=20;S('score');pop('BOOST!',K.c);}}}
  items=items.filter(it=>it.s>p.s-5);while(nI<p.s+90&&nI<END-40)addI();
  if(A.t%2===0){const q=pos(p.s,p.th,RD-.1);ps.add(q[0]+rnd(.4)-.2,q[1]+.15,q[2]-.6,rnd(.06)-.03,.04+rnd(.05),-.05,18,'rgba(220,245,255,.7)',.07,.006);}
  if(p.s>=END){g.score+=lives*400;g.over='SPLASHDOWN! COMPLETE';S('win');}};
 g.draw=()=>{const s=p.s,flying=p.fly>0;camT+=((flying?0:p.th)-camT)*.12;const cs=s-4.6,c0=pos(cs,camT*.8,.75);cam(c0[0],c0[1]+.55,c0[2],atan(dcx(s+2))*.9,atan(dcy(s+3))*.8-.12,200);const hz=hzY();roll(camT*.5);
  sky('#2a8ae8','#d8f4ff',hz,'#8ac870','#3a8a3a');sun(240-A.cam.ry*200,hz-80,10,'255,250,210');ridge(hz,'#5aa86a',20,4,A.cam.ry*200+s*.1,8);ridge(hz,'#3a8a4a',10,9,A.cam.ry*240+s*.2,6);
  A.fog={col:'#cfeefa',near:22,far:62};
  for(let q=fl(s/2)*2-4;q<s+50;q+=2){const tb=tube(q)&&tube(q+2),n=tb?14:10,a0=tb?-PI:-LIP,a1=tb?PI:LIP,ri_=fl(q/2);for(let i=0;i<n;i++){const t0=a0+(a1-a0)*i/n,t1=a0+(a1-a0)*(i+1)/n,P1=pos(q,t0,RD),P2=pos(q,t1,RD),P3=pos(q+2,t1,RD),P4=pos(q+2,t0,RD),mid=abs((t0+t1)/2);
    const col=tb?((ri_+i)%2?'#3a6ad8':'#2a58c4'):mid<.45?((ri_+fl(A.t/6))%2?'#8ad8ff':'#6ac8f8'):((ri_)%2?'#ffcf3f':'#ff9838');F([P1,P2,P3,P4],col);}
   if(tb&&ri_%5===0)for(let i=0;i<n;i+=2){const t=-PI+i/n*TAU;bb(...pos(q,t,RD-.05),.12,'rgba(255,255,200,.9)');}}
  A.flush();
  for(const it of items){if(it.got||it.s<s-2||it.s>s+48)continue;const c=pos(it.s,it.th,RD-.35);if(it.k==='ring'){for(let i=0;i<8;i++){const a=i/8*TAU,b2=(i+1)/8*TAU,r1=.32,r2=.45;F([[c[0]+cos(a)*r1,c[1]+sin(a)*r1,c[2]],[c[0]+cos(b2)*r1,c[1]+sin(b2)*r1,c[2]],[c[0]+cos(b2)*r2,c[1]+sin(b2)*r2,c[2]],[c[0]+cos(a)*r2,c[1]+sin(a)*r2,c[2]]],i%2?'#ff4f9a':'#ffffff',false);}}else{const b0=pos(it.s,0,RD-.02),b1=pos(it.s+1.4,0,RD-.02);F([[b0[0]-.6,b0[1],b0[2]],[b0[0]+.6,b0[1],b0[2]],[b1[0],b1[1],b1[2]]],'#3dff8b',false);}}
  for(let q=fl(s/12)*12;q<s+50;q+=12){if(q<s-4)continue;const b0=pos(q,0,RD);mcyl(ID,b0[0],b0[1]-24,q,.3,24,'#e8e8f0',5);}
  if(END-s<60){const e=pos(END,0,RD);F([[e[0]-12,e[1]-1,END],[e[0]+12,e[1]-1,END],[e[0]+12,e[1]-1,END+24],[e[0]-12,e[1]-1,END+24]],'#2aa8e8');wbox(e[0],e[1]-1.6,END+12,25,.6,25,'#f0f0f0');}
  if(flying){const P=xf(p.fx,p.fy,p.fz,0,A.t*.2,A.t*.15);mcyl(P,0,0,0,.55,.3,'#ff4f9a',8);man(P,{sh:'#ffcf3f',pa:'#2a5ad8',sw:.6,ph:A.t*.3,arm:-2.5});}
  else{const c=pos(s,p.th,RD-.25),P=xf(c[0],c[1],c[2],atan(dcx(s)),-atan(dcy(s))*.8,-p.th);mcyl(P,0,-.15,0,.6,.28,'#ff4f9a',8,0,'#ff7ab4');man(sub(P,0,-.05,.1,-1.3),{cr:.3,sh:'#ffcf3f',pa:'#2a5ad8',sw:0,arm:-.4+ax(A.in(0))*.4,as:.5,lg:-.4});}
  ps.draw();A.flush();A.fog=null;speedLines(p.v>.5?(p.v-.5)*2.5+(boostT?.4:0):0,160,hz+40,'220,245,255');unroll();
  bar(0,18);T(Math.round(p.s)+'M',6,3,K.c,2);for(let i=0;i<3;i++)R(W-14-i*13,4,10,8,i<lives?K.p:'#3a3040');T(Math.round(p.v*150)+' KMH',160,5,K.w,1,'c');
  const dg=abs(p.th)/LIP;if(!tube(s)&&dg>.6)T('LEAN '+(p.th>0?'LEFT!':'RIGHT!'),160,26,A.t%16<8?K.r:K.y,2,'c');if(tube(s))T('TUBE',160,26,K.c,1,'c');meter(6,H-9,W-12,4,p.s/END,K.c);};
 return g;}});

/* =================================================================== 13. HOVERBOARD 3D */
A.add({id:'hoverboard3d',name:'HOVERBOARD 3D',cat:'RETRO 3D',hd:1,how:'LEFT/RIGHT CARVE, UP JUMPS. LAND ON RAILS TO GRIND. GRAB CELLS FOR POWER.',make(){
 const g={over:null,score:0},END=3000,RW=6;const p={x:0,y:.5,z:0,vy:0,v:.42,en:100,sh:3,inv:0,gr:null,lean:0},ps=mkP();let ob=[],nz=30,cells=0,camX=0,gT=0;
 const NE=['#ff3fd0','#2fe8ff','#ffcf3f','#7a5aff','#3dff8b'];const bld=[];for(let i=0;i<120;i++){const h=(i*2654435761)>>>0;bld.push({z:i*16,hL:8+h%22,hR:8+(h>>5)%22,cL:NE[h%5],cR:NE[(h>>3)%5],wL:5+(h>>7)%4,wR:5+(h>>9)%4});}
 const chunk=()=>{const z=nz,r=Math.random();if(r<.3){const x=[-3.5,0,3.5][ri(3)],len=14+ri(14);ob.push({k:'rail',x,z0:z,z1:z+len,h:1.2});for(let i=0;i<3;i++)ob.push({k:'cell',x,y:2.4,z:z+3+i*4});ob.push({k:'bar',x:x+(Math.random()<.5?-3.2:3.2),z:z+len/2,w:2.4});}
  else if(r<.55){const x=rnd(8)-4;ob.push({k:'bar',x,z,w:3+rnd(2)});ob.push({k:'cell',x,y:2.2,z});}
  else if(r<.75){ob.push({k:'car',x:[-3.8,0,3.8][ri(3)],z:z+10,c:NE[ri(5)]});if(Math.random()<.5)ob.push({k:'cell',x:rnd(10)-5,y:.9,z:z+4});}
  else{ob.push({k:'drone',x:rnd(8)-4,y:1.1,z,ph:rnd(9)});ob.push({k:'cell',x:rnd(10)-5,y:.9,z:z+6});}
  nz+=mx(10,18-p.z/400)+rnd(6);};
 while(nz<120)chunk();
 const hurt=m=>{if(p.inv>0)return;p.sh--;p.inv=70;p.gr=null;S('boom');A.shake=10;pop(m,K.r);if(p.sh<=0)g.over='WIPED OUT AT '+Math.round(p.z)+'M';};
 g.update=()=>{ps.step();if(p.inv>0)p.inv--;const k=A.in(0),h=A.hit(0);p.lean+=(ax(k)-p.lean)*.18;p.v=mn(.85,.42+p.z/END*.36+(p.gr?.08:0));
  if(p.gr){const r=p.gr;p.y=r.h+.5;p.x+=(r.x-p.x)*.4;g.score+=1;gT++;p.en=mn(100,p.en+.08);if(A.t%2===0)for(const s of[-.4,.4])ps.add(p.x+s,p.y-.1,p.z-.3,rnd(.1)-.05,.06+rnd(.06),-.1,14,'#ffcf3f',.05,.01);if(A.t%8===0)S('blip');
   if(p.z>r.z1||h.l||h.r||h.u||h.a){p.gr=null;p.vy=h.u||h.a?.2:.08;if(h.l)p.x-=.6;if(h.r)p.x+=.6;if(gT>30){const b=gT*2;g.score+=b;pop('GRIND +'+b,K.y);}gT=0;}}
  else{p.x=cl(p.x+p.lean*.17,-RW+.5,RW-.5);const gy=.5;if(p.y<=gy+.001&&p.vy<=0){p.y=gy;p.vy=0;if(h.u||h.a){p.vy=.21;S('jump');}}else{p.vy-=.011;p.y+=p.vy;if(p.y<gy){p.y=gy;p.vy=0;}}
   for(const o of ob)if(o.k==='rail'&&p.vy<=0&&p.z>=o.z0&&p.z<=o.z1&&abs(p.x-o.x)<.8&&p.y>=o.h+.25&&p.y+p.vy<=o.h+.65){p.gr=o;p.vy=0;gT=0;S('hit');break;}}
  p.z+=p.v;p.en-=.045;if(fl(p.z/10)>fl((p.z-p.v)/10))g.score+=1;
  for(const o of ob){if(o.got)continue;const dz=o.z-p.z;
   if(o.k==='cell'&&abs(dz)<.8&&abs(o.x-p.x)<.9&&abs(o.y-p.y-.6)<1.2){o.got=1;cells++;p.en=mn(100,p.en+22);g.score+=50;S('coin');}
   else if(o.k==='bar'&&abs(dz)<.5&&abs(o.x-p.x)<o.w/2+.3&&p.y<1.25){o.got=1;hurt('BARRIER!');}
   else if(o.k==='car'&&abs(dz)<2&&abs(o.x-p.x)<1.2&&p.y<1.9){o.got=1;hurt('HOVERCAR!');}
   else if(o.k==='drone'&&abs(dz)<.7&&abs(o.x+sin(A.t*.04+o.ph)*2-p.x)<.9&&abs(o.y-p.y-.5)<1){o.got=1;hurt('DRONE!');}}
  for(const o of ob)if(o.k==='car')o.z+=.16;ob=ob.filter(o=>(o.z1||o.z)>p.z-8);while(nz<p.z+110&&nz<END-30)chunk();
  if(p.en<=0){g.over='OUT OF POWER AT '+Math.round(p.z)+'M';S('lose');}else if(p.z>=END){g.score+=p.sh*400+fl(p.en)*5;g.over='DISTRICT CLEAR! WIN';}};
 g.draw=()=>{camX+=(p.x*.75-camX)*.15;cam(camX,2.7+p.y*.45,p.z-5.6,0,-.16,205);const hz=hzY();roll(-p.lean*.12);
  sky('#07021a','#5a1a6a',hz,'#2a0a3a','#0a0418');sun(70,hz-95,18,'200,170,255','#e8dcff');A.c.strokeStyle='rgba(220,200,255,.5)';A.c.beginPath();A.c.ellipse(70,hz-95,34,7,-.3,0,TAU);A.c.stroke();
  for(let i=0;i<46;i++){const w=10+((i*37)%14),x=((i*29-p.z*.3-camX*4)%400+400)%400-40,hh=20+((i*53)%60);R(x,hz-hh,w,hh+2,i%2?'#1a0c32':'#160a2a');if(i%3===0)for(let j=0;j<4;j++)R(x+2+(j*5)%(w-3),hz-hh+4+j*7,2,2,['#ff3fd0','#2fe8ff','#ffcf3f'][(i+j)%3]);}
  A.fog={col:'#2a0c3e',near:22,far:80};
  for(let z=fl(p.z/4)*4-4;z<p.z+80;z+=4){F([[-RW,0,z],[RW,0,z],[RW,0,z+4],[-RW,0,z+4]],(z/4)%2?'#16142a':'#131126');F([[-RW-3,.3,z],[-RW,.3,z],[-RW,.3,z+4],[-RW-3,.3,z+4]],'#24203a');F([[RW,.3,z],[RW+3,.3,z],[RW+3,.3,z+4],[RW,.3,z+4]],'#24203a');F([[-RW,0,z],[-RW,.3,z],[-RW,.3,z+4],[-RW,0,z+4]],'#ff3fd0',false);F([[RW,0,z],[RW,0,z+4],[RW,.3,z+4],[RW,.3,z]],'#2fe8ff',false);}
  A.flush();
  for(let z=fl(p.z/6)*6;z<p.z+70;z+=6)for(const x of[-2,2])if(fl(z/6)%2===0)F([[x-.07,.01,z],[x+.07,.01,z],[x+.07,.01,z+3],[x-.07,.01,z+3]],'#2fe8ff',false);shd(p.x,0,p.z,.5,.8,.22);
  A.flush();
  for(const b of bld){if(b.z<p.z-16||b.z>p.z+84)continue;for(const sd of[-1,1]){const hh=sd<0?b.hL:b.hR,w=sd<0?b.wL:b.wR,x=sd*(RW+3+w/2),nc=sd<0?b.cL:b.cR;wbox(x,0,b.z+8,w,hh,14,'#1c1a34','#2a2650');const fx=x-sd*w/2-sd*.02;F([[fx,hh*.15,b.z+3],[fx,hh*.15,b.z+13],[fx,hh*.15+.25,b.z+13],[fx,hh*.15+.25,b.z+3]],nc,false);for(let r=0;r<3;r++){const y=hh*(.35+r*.2);F([[fx,y,b.z+2],[fx,y,b.z+14],[fx,y+.8,b.z+14],[fx,y+.8,b.z+2]],'rgba(255,220,140,.35)',false);}F([[fx,hh-.6,b.z+1],[fx,hh-.6,b.z+15],[fx,hh,b.z+15],[fx,hh,b.z+1]],nc,false);}}
  for(const o of ob){const zz=o.z||o.z0;if(o.got||(o.z1||zz)<p.z-4||zz>p.z+80)continue;
   if(o.k==='rail'){const z0=mx(o.z0,p.z-4),z1=mn(o.z1,p.z+80);F([[o.x-.09,o.h,z0],[o.x+.09,o.h,z0],[o.x+.09,o.h,z1],[o.x-.09,o.h,z1]],'#e8e8ff',false);F([[o.x-.09,o.h-.12,z0],[o.x-.09,o.h,z0],[o.x-.09,o.h,z1],[o.x-.09,o.h-.12,z1]],'#8a8ab0',false);for(let z=Math.ceil(o.z0/4)*4;z<=o.z1;z+=4)if(z>p.z-4&&z<p.z+80)wbox(o.x,0,z,.12,o.h,.12,'#5a5a7a');}
   else if(o.k==='cell'){const y=o.y+sin(A.t*.1+o.z)*.12;mcyl(xf(o.x,y,o.z,A.t*.05),0,0,0,.22,.55,'#2fe8ff',6,0,'#e0fbff');mbox(ID,o.x,y+.55,o.z,.12,.1,.12,'#ffffff');}
   else if(o.k==='bar'){wbox(o.x,0,o.z,o.w,1.05,.3,'#ff9838','#ffcf3f');for(let i=0;i<3;i++)F([[o.x-o.w/2+i*o.w/3+.1,.35,o.z-.16],[o.x-o.w/2+i*o.w/3+.45,.35,o.z-.16],[o.x-o.w/2+i*o.w/3+.25,.75,o.z-.16],[o.x-o.w/2+i*o.w/3-.1,.75,o.z-.16]],'#1a1a1a',false);}
   else if(o.k==='car'){const P=xf(o.x,.6+sin(A.t*.06+o.z)*.08,o.z,0);mbox(P,0,0,0,1.8,.7,3.4,'#2a2840',o.c);mbox(P,0,.7,-.3,1.4,.55,1.8,'#9ad0ff','#2a2840');bb(o.x-.6,.4,o.z-1.75,.18,'rgba(255,60,60,.9)');bb(o.x+.6,.4,o.z-1.75,.18,'rgba(255,60,60,.9)');F([[o.x-.9,.02,o.z-1.6],[o.x+.9,.02,o.z-1.6],[o.x+.9,.02,o.z+1.6],[o.x-.9,.02,o.z+1.6]],'rgba(47,232,255,.35)',false);}
   else if(o.k==='drone'){const x=o.x+sin(A.t*.04+o.ph)*2,P=xf(x,o.y+.4,o.z,A.t*.2);mbox(P,0,0,0,.7,.25,.7,'#3a3a4a','#ff4f6d');for(const[a,b2]of[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]])mbox(P,a,.25,b2,.5,.03,.08,'#aaa');bb(x,o.y+.3,o.z-.36,.12,'rgba(255,40,40,1)');}}
  if(p.inv%8<5){const P=xf(p.x,p.y,p.z,0,0,-p.lean*.35);mbox(P,0,-.12,0,.62,.1,1.5,'#2fe8ff','#e0fbff');bb(p.x,p.y-.25,p.z,.5,'rgba(47,232,255,.35)');man(sub(P,0,-.07,0,0),{cr:.45,sh:'#ff3fd0',pa:'#2a2a4a',hl:'#ffcf3f',sw:0,arm:-.4,as:.9,lean:.25});}
  ps.draw();A.flush();A.fog=null;speedLines((p.v-.45)*2.5,160,hz+30,'255,120,240');unroll();
  bar(0,18);T(Math.round(p.z)+'M',6,3,K.c,2);for(let i=0;i<3;i++)R(W-14-i*13,4,10,8,i<p.sh?K.p:'#3a3040');meter(110,5,100,8,p.en/100,p.en<25?(A.t%20<10?K.r:K.o):K.c);T('POWER',214,6,K.gr,1);if(p.gr)T('GRINDING!',160,24,K.y,2,'c');meter(6,H-9,W-12,4,p.z/END,K.p);};
 return g;}});

/* =================================================================== 14. MECH WALKER 3D */
A.add({id:'mech3d',name:'MECH WALKER 3D',cat:'RETRO 3D',hd:1,how:'UP/DOWN WALK, LEFT/RIGHT TURN. A FIRES TWIN CANNONS. DON\'T OVERHEAT.',make(){
 const g={over:null,score:0},AR=70;const m={x:0,z:0,h:0,ph:0,heat:0,oh:0,arm:100,side:1,hitF:0},ps=mkP();let en=[],sh=[],eb=[],kills=0,crates=[],wrecks=[];
 const blds=[];for(let i=0;i<14;i++){let x,z;do{x=rnd(120)-60;z=rnd(120)-60;}while(hyp(x,z)<12);blds.push({x,z,w:4+rnd(5),d:4+rnd(5),h:3+rnd(6)});}
 const craters=[];for(let i=0;i<30;i++)craters.push([rnd(140)-70,rnd(140)-70,1+rnd(2.5)]);
 const free=(x,z,r)=>!blds.some(b=>abs(x-b.x)<b.w/2+r&&abs(z-b.z)<b.d/2+r);
 const spawn=()=>{let x,z,t=0;do{const a=rnd(TAU),d=35+rnd(20);x=cl(m.x+sin(a)*d,-AR,AR);z=cl(m.z+cos(a)*d,-AR,AR);}while(!free(x,z,2)&&t++<20);const r=Math.random();en.push({k:r<.5?'tank':r<.75?'turret':'heli',x,z,y:r<.75?0:7,h:rnd(TAU),hp:r<.5?3:r<.75?4:2,cd:90+ri(90),ph:rnd(9)});};
 for(let i=0;i<4;i++)spawn();for(let i=0;i<3;i++)crates.push({x:rnd(100)-50,z:rnd(100)-50});g.dbg=()=>{let bd=9,da=0;for(const e of en){const a=wrapA(atan2(e.x-m.x,e.z-m.z)-m.h);if(abs(a)<abs(bd)){bd=a;da=a;}}return{da:+da.toFixed(2),heat:fl(m.heat),oh:m.oh,arm:fl(m.arm),kills};};
 g.update=()=>{ps.step();if(m.hitF>0)m.hitF--;const k=A.in(0);m.h+=ax(k)*.032;const mv=k.u?.11:k.d?-.06:0;
  if(mv){const nx=m.x+sin(m.h)*mv,nz=m.z+cos(m.h)*mv;if(free(nx,m.z,1.6))m.x=cl(nx,-AR,AR);if(free(m.x,nz,1.6))m.z=cl(nz,-AR,AR);const op=m.ph;m.ph+=abs(mv)*.9;if(fl(op/PI)!==fl(m.ph/PI)){A.shake=mx(A.shake,2);S('hit');const sd=fl(m.ph/PI)%2?1:-1;for(let i=0;i<6;i++)ps.add(m.x+cos(m.h)*sd*.9,.1,m.z-sin(m.h)*sd*.9,rnd(.12)-.06,.04+rnd(.04),rnd(.12)-.06,30,'rgba(150,130,100,.5)',.2,.001,2);}}
  m.heat=mx(0,m.heat-(m.oh?.6:.42));if(m.oh&&m.heat<25)m.oh=0;if(m.oh&&A.t%3===0)ps.add(m.x+rnd(1)-.5,3.3,m.z+rnd(1)-.5,rnd(.04)-.02,.08,rnd(.04)-.02,30,'rgba(230,230,240,.5)',.25,0,2);
  if(!m.oh&&A.fire(9)){m.side*=-1;const f=[sin(m.h),cos(m.h)],r=[cos(m.h),-sin(m.h)];let dx=f[0],dz=f[1],dy=0;let best=null,bd=.16;for(const e of en){const ex=e.x-m.x,ez=e.z-m.z,d=hyp(ex,ez),a=abs(wrapA(atan2(ex,ez)-m.h));if(d<60&&a<bd){bd=a;best=e;}}
   const ox=m.x+r[0]*1.25*m.side+f[0]*1.6,oz=m.z+r[1]*1.25*m.side+f[1]*1.6,oy=2.75;if(best){const ex=best.x-ox,ey=best.y+.6-oy,ez=best.z-oz,d=hyp(ex,ey,ez);dx=ex/d;dy=ey/d;dz=ez/d;}
   sh.push({x:ox,y:oy,z:oz,vx:dx*1.3,vy:dy*1.3,vz:dz*1.3,t:55});m.heat+=7.5;S('shoot');for(let i=0;i<3;i++)ps.add(ox+dx*.8,oy,oz+dz*.8,dx*.1+rnd(.06)-.03,rnd(.06),dz*.1+rnd(.06)-.03,10,'#ffcf3f',.15);if(m.heat>=100){m.oh=1;S('lose');pop('OVERHEAT!',K.r);}}
  for(const s of sh){s.x+=s.vx;s.y+=s.vy;s.z+=s.vz;s.t--;if(!free(s.x,s.z,0)&&s.y<8||s.y<0)s.t=0;
   for(const e of en)if(!e.dead&&s.t>0&&hyp(s.x-e.x,s.y-e.y-.6,s.z-e.z)<(e.k==='heli'?1.8:1.6)){s.t=0;e.hp--;S('hit');for(let i=0;i<5;i++)ps.add(s.x,s.y,s.z,rnd(.2)-.1,rnd(.2),rnd(.2)-.1,14,'#ffcf3f',.12,.01);
    if(e.hp<=0){e.dead=1;kills++;g.score+=e.k==='heli'?200:e.k==='turret'?150:100;S('boom');A.shake=8;for(let i=0;i<24;i++)ps.add(e.x,e.y+.6,e.z,rnd(.5)-.25,rnd(.4),rnd(.5)-.25,30+ri(20),['#ffcf3f','#ff9838','#ff4f6d','#3a3a3a'][i%4],.25+rnd(.3),.01);wrecks.push({x:e.x,z:e.z,t:600});pop('DESTROYED '+kills+'/20',K.o);if(Math.random()<.3)crates.push({x:e.x,z:e.z});}}}
  for(const e of en){if(e.dead)continue;const dx=m.x-e.x,dz=m.z-e.z,d=hyp(dx,dz);
   if(e.k==='tank'){const th=atan2(dx,dz);e.h+=cl(wrapA(th-e.h),-.02,.02);if(d>16){const nx=e.x+sin(e.h)*.05,nz=e.z+cos(e.h)*.05;if(free(nx,nz,1.5)){e.x=nx;e.z=nz;}else e.h+=.5;}}
   else if(e.k==='heli'){e.ph+=.01;const tx=m.x+sin(e.ph)*18,tz=m.z+cos(e.ph)*18;e.x+=(tx-e.x)*.01;e.z+=(tz-e.z)*.01;e.h=atan2(dx,dz);}else e.h=atan2(dx,dz);
   if(--e.cd<=0){e.cd=(e.k==='heli'?110:150)+ri(80)-A.ai*20;if(d<42){const dy=2.2-(e.y+.8),dd=hyp(dx,dy,dz);eb.push({x:e.x,y:e.y+.9,z:e.z,vx:dx/dd*.45,vy:dy/dd*.45,vz:dz/dd*.45,t:130});}}}
  for(const b of eb){b.x+=b.vx;b.y+=b.vy;b.z+=b.vz;b.t--;if(!free(b.x,b.z,0)&&b.y<8)b.t=0;if(b.t>0&&hyp(b.x-m.x,b.y-2,b.z-m.z)<1.8){b.t=0;m.arm-=5;m.hitF=14;S('boom');A.shake=10;if(m.arm<=0)g.over='MECH DESTROYED - '+kills+' KILLS';}}
  for(const c of crates)if(!c.got&&hyp(c.x-m.x,c.z-m.z)<2){c.got=1;m.arm=mn(100,m.arm+30);S('coin');pop('REPAIR +30',K.g);}
  for(const w of wrecks){w.t--;if(A.t%6===0)ps.add(w.x+rnd(1),1,w.z+rnd(1),rnd(.03),.06,rnd(.03),60,'rgba(60,55,50,.45)',.35,0,3);}
  sh=sh.filter(s=>s.t>0);eb=eb.filter(b=>b.t>0);en=en.filter(e=>!e.dead);crates=crates.filter(c=>!c.got);wrecks=wrecks.filter(w=>w.t>0);while(en.length<mn(6,4+fl(kills/6))&&kills+en.length<20)spawn();
  if(kills>=20){g.score+=fl(m.arm)*10;g.over='SECTOR CLEAR! WIN';}};
 g.draw=()=>{const f=[sin(m.h),cos(m.h)],r=[cos(m.h),-sin(m.h)],bob=abs(sin(m.ph))*.12;cam(m.x-f[0]*7.5+r[0]*1.3,5.2+bob,m.z-f[1]*7.5+r[1]*1.3,m.h,-.2,205);const hz=hzY();
  sky('#4a3a4a','#c89870',hz,'#8a7058','#4a4030');sun(160-m.h*205%1300,hz-40,14,'255,170,90','#ffd0a0');ridge(hz,'#6a5050',18,3,m.h*205,10);ridge(hz,'#4a3a38',9,8,m.h*230,7);
  A.fog={col:'#b08868',near:24,far:70};const G=8,ox=fl(m.x/G)*G,oz=fl(m.z/G)*G,inV=wedge(74);
  for(let i=-9;i<=9;i++)for(let j=-9;j<=9;j++){const x0=ox+i*G,z0=oz+j*G;if(!inV(x0+4,z0+4))continue;const out=abs(x0+4)>AR||abs(z0+4)>AR;F([[x0,0,z0],[x0+G,0,z0],[x0+G,0,z0+G],[x0,0,z0+G]],out?'#5a4a3a':((i+j)&1?'#6a6a48':'#646444'),false);}
  A.flush();for(const c of craters)if(inV(c[0],c[1])){flat(c[0],.01,c[1],c[2],'rgba(40,30,20,.45)',8);flat(c[0],.02,c[1],c[2]*.6,'rgba(30,22,15,.4)',8);}shd(m.x,0,m.z,1.6,1.6,.35);A.flush();
  for(const b of blds)if(inV(b.x,b.z)){wbox(b.x,0,b.z,b.w,b.h,b.d,'#7a7068','#5a5048');wbox(b.x-b.w*.2,b.h,b.z,b.w*.5,1.5,b.d*.6,'#6a6058');}
  for(const c of crates)if(inV(c.x,c.z)){wbox(c.x,0,c.z,1,1,1,'#3a8a3a','#5aa85a');wbox(c.x,.3,c.z,1.05,.3,.3,'#f4f4f4');}
  for(const w of wrecks)if(inV(w.x,w.z))mbox(xf(w.x,0,w.z,w.x),0,0,0,2,.6,2.6,'#2a2620');
  for(const e of en){if(!inV(e.x,e.z))continue;const P=xf(e.x,e.y,e.z,e.h);if(e.k==='tank'){mbox(P,0,0,0,2,.7,3,'#5a6a3a','#6a7a48');mbox(P,0,.7,-.2,1.3,.55,1.4,'#4a5a30');mbox(P,0,.85,1.2,.18,.18,1.8,'#3a3a2a');for(const s of[-1.05,1.05])mbox(P,s,0,0,.3,.5,3.1,'#2a2a22');}
   else if(e.k==='turret'){mcyl(ID,e.x,0,e.z,1.1,1.2,'#6a6a72',8);mbox(P,0,1.2,0,1.3,.8,1.3,'#8a3a30');mbox(P,-.3,1.5,1.2,.15,.15,1.6,'#333');mbox(P,.3,1.5,1.2,.15,.15,1.6,'#333');}
   else{mbox(P,0,0,0,1.2,1,2.4,'#3a4a5a','#4a5a6a');mbox(P,0,.3,-2,.3,.3,2,'#3a4a5a');const RP=xf(e.x,e.y+1.1,e.z,A.t*.5);mbox(RP,0,0,0,5,.05,.25,'#222');mbox(RP,0,0,0,.25,.05,5,'#222');shd(e.x,0,e.z,1.2,1.6,.25);}}
  const P=xf(m.x,bob,m.z,m.h),sw=sin(m.ph)*.5;for(const sd of[-1,1]){const LP=sub(P,sd*.75,2.1,0,sd*sw);mbox(LP,0,-1.1,0,.5,1.1,.6,'#7a8090');const KP=sub(LP,0,-1.1,0,-abs(sw)*.6);mbox(KP,0,-1,0,.42,1,.5,'#6a7080');mbox(sub(P,sd*.75,0,sd*sw*1.1,0),0,0,.15,.75,.18,1.1,'#4a4e5a');}
  mbox(P,0,1.9,0,1.8,.5,1.3,'#5a606e');mbox(P,0,2.35,0,2,1.1,1.8,'#8a94a8','#a0aabc');mbox(P,0,2.75,.92,1.2,.4,.08,'#ffcf3f');for(const sd of[-1,1]){mbox(P,sd*1.25,2.45,.3,.5,.5,1.4,'#6a7080');mbox(P,sd*1.25,2.6,1.4,.22,.22,1.6,'#2a2a30');mbox(P,sd*.65,3.45,-.4,.6,.4,.7,'#7a8494','#ff4f6d');}
  for(const s of sh){F([[s.x-.12,s.y,s.z],[s.x+.12,s.y,s.z],[s.x+.12-s.vx*.6,s.y-s.vy*.6,s.z-s.vz*.6],[s.x-.12-s.vx*.6,s.y-s.vy*.6,s.z-s.vz*.6]],'rgba(255,220,90,.95)',false);}for(const b of eb)bb(b.x,b.y,b.z,.3,'rgba(255,80,60,.95)');
  ps.draw();A.flush();A.fog=null;
  const cq=A.p3(m.x+f[0]*30,2.6,m.z+f[1]*30);if(cq[2]>.1){A.ring(cq[0],cq[1],8,m.oh?K.r:'#a0ffc8');L(cq[0]-14,cq[1],cq[0]-6,cq[1],'#a0ffc8');L(cq[0]+6,cq[1],cq[0]+14,cq[1],'#a0ffc8');}
  for(const e of en){const q=A.p3(e.x,e.y+1,e.z);if(q[2]>1&&q[2]<70){const s=mx(5,mn(16,240/q[2]));A.c.strokeStyle='rgba(255,80,80,.8)';A.c.strokeRect(q[0]-s,q[1]-s,s*2,s*2);}}
  if(m.hitF)alpha(m.hitF/30,()=>R(0,0,W,H,'#ff2020'));vign(.5);
  bar(0,18);T('KILLS '+kills+'/20',6,3,K.y,2);meter(W-90,4,84,5,m.arm/100,m.arm<30?K.r:K.g);T('ARMOR',W-114,4,K.gr,1);meter(W-90,11,84,4,m.heat/100,m.oh?(A.t%10<5?K.r:K.o):m.heat>70?K.o:K.y);T('HEAT',W-110,10,K.gr,1);if(m.oh)T('OVERHEATED - VENTING',160,24,K.r,1,'c');
  const RX=W-26,RY=H-28;alpha(.5,()=>C(RX,RY,21,'#1a1a10'));A.ring(RX,RY,21,'rgba(255,200,120,.6)');R(RX-1,RY-1,2,2,K.g);for(const e of en){const dx=e.x-m.x,dz=e.z-m.z,lx=dx*cos(m.h)-dz*sin(m.h),lz=dx*sin(m.h)+dz*cos(m.h),d=hyp(lx,lz),s=mn(19,d/3);if(d>0)R(RX+lx/d*s-1,RY-lz/d*s-1,3,3,K.r);}for(const c of crates){const dx=c.x-m.x,dz=c.z-m.z,lx=dx*cos(m.h)-dz*sin(m.h),lz=dx*sin(m.h)+dz*cos(m.h),d=hyp(lx,lz),s=mn(19,d/3);if(d>0)R(RX+lx/d*s-1,RY-lz/d*s-1,2,2,K.g);}};
 return g;}});

/* =================================================================== 15. TRAIN DRIVER 3D */
A.add({id:'train3d',name:'TRAIN DRIVER 3D',cat:'RETRO 3D',hd:1,time:300,how:'UP/DOWN MOVE THE LEVER. STOP AT THE MARKER, THEN A OPENS THE DOORS.',make(){
 const g={over:null,score:0},NM=['MAPLE ST','HARBOR','OLD MILL','CENTRAL','SUMMIT'],ST=NM.map((n,i)=>({n,z:380+i*470,done:0}));
 const cx=z=>sin(z*.0021)*28+sin(z*.0053)*9,dcx=z=>.0588*cos(z*.0021)+.0477*cos(z*.0053),hy=z=>sin(z*.0031)*5,dhy=z=>.0155*cos(z*.0031);
 const t={z:0,v:0,n:0,doors:0,board:0,wait:0},ppl=[];let si=0,clock=0,due=0,msg='',msgT=0,odo=0,ovs=0;
 const mkPpl=()=>{ppl.length=0;const s=ST[si];if(!s)return;for(let i=0;i<7;i++)ppl.push({z:s.z-24+i*5+rnd(3),x:3.6+rnd(2),id:ri(6),c:['#ff4f6d','#ffcf3f','#4dabff','#3dff8b','#ff9838','#b070ff'][ri(6)],gone:0});};
 g.dbg=()=>{const s=ST[si];return{err:s?+(s.z-t.z).toFixed(2):0,v:+t.v.toFixed(3),n:t.n,doors:t.doors,si};};const setDue=()=>{const s=ST[si];if(s)due=clock+Math.round((s.z-t.z)/(.36*60))+10;};mkPpl();setDue();
 g.update=()=>{clock+=1/60;if(msgT>0)msgT--;const h=A.hit(0);if(!t.doors){if(h.u&&t.n<4){t.n++;S('blip');}if(h.d&&t.n>-4){t.n--;S('blip');}}
  const s=ST[si];let a=t.n>0?t.n*.00018*(1-t.v/.62):t.n*.00012;if(t.n===-4)a=-.0006;a-=.00002+dhy(t.z)*.0012;t.v=mx(0,t.v+a);if(t.doors)t.v=0;
  const kmh=t.v*216;if(kmh>100){ovs++;if(ovs%20===0){g.score=mx(0,g.score-5);S('lose');}}else ovs=0;
  t.z+=t.v;odo+=t.v;if(odo>=25){odo-=25;g.score+=1;}
  if(s&&!s.done){const err=s.z-t.z;
   if(t.v===0&&err<60&&err>-12&&!t.doors&&!t.board&&t.n<=0){t.wait++;if(A.hit(0).a||t.wait>240){t.doors=1;t.board=150;S('coin');const e=abs(err);let pts=e<.5?400:e<1.5?250:e<4?120:e<12?50:20;msg=e<.5?'PERFECT STOP!':e<1.5?'GREAT STOP':e<4?'GOOD STOP':'STOPPED '+e.toFixed(1)+'M OFF';const late=clock-due;if(late<=0){pts+=150;msg+=' ON TIME';}else msg+=' LATE '+Math.ceil(late)+'S';g.score+=pts+100;pop('+'+(pts+100),K.y,60);msgT=150;}}
   if(err<-12){s.done=2;msg='OVERRUN '+s.n+'!';msgT=120;S('lose');si++;mkPpl();setDue();}}
  if(t.board>0){t.board--;for(const p of ppl)if(!p.gone&&t.board<140-p.id*12){p.x-=.05;if(p.x<2.2)p.gone=1;}if(t.board===0){t.doors=0;s.done=1;si++;t.n=0;mkPpl();setDue();S('score');}}
  if(si>=ST.length&&!t.board){const ok=ST.filter(q=>q.done===1).length;g.over=ok===ST.length?'LINE COMPLETE! ALL 5 STOPS':'END OF LINE - '+ok+'/5 STOPS';}};
 g.draw=()=>{const z=t.z,X=cx(z);cam(X,hy(z)+2.7,z,atan(dcx(z+30)),atan(dhy(z+20))-.035,215);const hz=hzY();
  sky('#3a7ad0','#e0eef8',hz,'#c8d8c0','#4a7a38');sun(250-A.cam.ry*215,hz-70,9,'255,245,210');ridge(hz,'#7a98b0',26,2,A.cam.ry*215+z*.02,10);ridge(hz,'#5a8a5a',13,6,A.cam.ry*240+z*.05,7);
  A.fog={col:'#d8e6ec',near:60,far:220};
  for(let q=fl(z/6)*6-6,st=6;q<z+220;q+=st){st=q<z+60?6:12;const a=cx(q),b=cx(q+st),ya=hy(q),yb=hy(q+st);F([[a-2.2,ya,q],[a+2.2,ya,q],[b+2.2,yb,q+st],[b-2.2,yb,q+st]],'#8a8078');F([[a-40,ya-.2,q],[a-2.2,ya,q],[b-2.2,yb,q+st],[b-40,yb-.2,q+st]],fl(q/12)%2?'#5a8a3a':'#558536');F([[a+2.2,ya,q],[a+40,ya-.2,q],[b+40,yb-.2,q+st],[b+2.2,yb,q+st]],fl(q/12)%2?'#5a8a3a':'#558536');}
  A.flush();
  for(let q=Math.ceil(z/1.2)*1.2;q<z+45;q+=1.2){const a=cx(q),y=hy(q)+.02;F([[a-1.3,y,q],[a+1.3,y,q],[a+1.3,y,q+.4],[a-1.3,y,q+.4]],'#5a4030',false);}
  A.flush();for(let q=fl(z/6)*6;q<z+200;q+=6){const a=cx(q),b=cx(q+6),ya=hy(q)+.15,yb=hy(q+6)+.15;for(const s of[-.75,.75])F([[a+s-.05,ya,q],[a+s+.05,ya,q],[b+s+.05,yb,q+6],[b+s-.05,yb,q+6]],'#c0c0cc',false);}
  for(const s of ST){if(s.z+20<z||s.z-80>z+200)continue;const a=cx(s.z),y=hy(s.z);F([[a+2.3,y+1.12,s.z-70],[a+2.6,y+1.12,s.z-70],[a+2.6,y+1.12,s.z+15],[a+2.3,y+1.12,s.z+15]],'#ffcf3f',false);}
  A.flush();const lines=[];
  for(let q=fl(z/30)*30+30;q<z+200;q+=30){const a=cx(q),y=hy(q);for(const s of[-1,1]){mcyl(ID,a+s*3.4,y,q,.12,6,'#8a8a92',4);wbox(a+s*2.4,y+5.6,q,2.2,.12,.12,'#8a8a92');}lines.push([a,y+5.5,q]);}
  for(let q=fl(z/20)*20;q<z+200;q+=20){if(q<z+4)continue;const hsh=(q*2654435761)>>>0,a=cx(q),y=hy(q);const sd=hsh%2?1:-1,off=9+hsh%14;if(ST.some(s=>abs(s.z-q)<90)&&sd>0)continue;if(hsh%5<3)tree(a+sd*off,y-.2,q,2+(hsh%3)*.4);else{wbox(a+sd*(off+4),y,q,6,3.4,5,['#e8d8c0','#d89a7a','#c8d0e0'][hsh%3]);cone(ID,a+sd*(off+4),y+3.4,q,4.4,2.2,'#a8483a',4);}}
  for(const s of ST){if(s.z+20<z||s.z-80>z+200)continue;const a=cx(s.z),y=hy(s.z);wbox(a+4.5,y,s.z-27.5,4,1.1,85,'#a8a8a0','#c8c8c0');for(let q=s.z-50;q<=s.z+5;q+=11){wbox(a+5.6,y+1.1,q,.2,3.2,.2,'#5a5a6a');}wbox(a+4.8,y+4.3,s.z-22.5,3.6,.25,57,'#3a5aa8','#4a6ab8');wbox(a+9,y,s.z-20,5,4,14,'#d8c8a8','#8a3a2a');
   wbox(a+2.9,y+1.1,s.z,.12,1.8,.12,'#333');wbox(a+2.9,y+2.9,s.z,.08,.8,.8,'#ffcf3f');wbox(a+5,y+3.2,s.z-35,.1,.7,3.4,'#1a3a8a');const sg=A.p3(a+4.9,y+3.55,s.z-35);if(sg[2]>.1&&sg[2]<120)lines.push(['N',sg,s.n]);const mk=A.p3(a+2.85,y+3.3,s.z);if(mk[2]>.1&&mk[2]<160)lines.push(['M',mk]);
   const sig=A.p3(a-2.8,y+4,s.z+40);wbox(a-2.8,y,s.z+40,.15,4,.15,'#333');wbox(a-2.8,y+3.6,s.z+40,.5,1,.3,'#1a1a1a');if(sig[2]>.1)lines.push(['G',sig,s===ST[si]&&t.doors?'255,60,60':'60,255,120']);}
  A.flush();A.fog=null;
  A.c.strokeStyle='rgba(40,40,40,.6)';A.c.beginPath();for(let i=0;i<lines.length-1;i++){const l1=lines[i],l2=lines[i+1];if(l1.length!==3||typeof l1[0]!=='number'||typeof l2[0]!=='number')continue;const p1=A.p3(...l1),p2=A.p3(...l2);if(p1[2]>.5&&p2[2]>.5){A.c.moveTo(p1[0],p1[1]);A.c.lineTo(p2[0],p2[1]);}}A.c.stroke();
  for(const l of lines){if(l[0]==='N'){const sc=l[1][2]<40?2:1;T(l[2],l[1][0],l[1][1]-(sc*2),'#ffffff',sc,'c');}else if(l[0]==='M'){const q=l[1];R(q[0]-3,q[1]-4,7,8,'#ffcf3f');T('8',q[0]-1,q[1]-2,'#1a1a1a',1);}else if(l[0]==='G')glow(l[1][0],l[1][1],mx(3,40/l[1][2]*3),l[2],.9);}
  const s=ST[si];if(s){const vp=ppl.slice().sort((a,b)=>b.z-a.z);for(const p of vp){if(p.gone)continue;const a=cx(p.z),q=A.p3(a+p.x,hy(p.z)+1.1,p.z);if(q[2]>2&&q[2]<120&&q[1]<186){const sc=1.75*215/q[2]/33;A.person(q[0],q[1],{s:sc,c:p.c,id:p.id,st:t.doors?A.t*.3:0,d:-1});}}}
  A.c.fillStyle='#15171e';A.c.fillRect(0,0,W,10);A.c.fillRect(0,0,12,186);A.c.fillRect(W-12,0,12,186);A.poly([[0,10],[30,10],[0,40]],'#15171e',1);A.poly([[W,10],[W-30,10],[W,40]],'#15171e',1);
  fillG(0,184,W,56,[[0,'#2a2e3a'],[1,'#14161c']]);R(0,184,W,2,'#4a5060');
  const kmh=t.v*216,SX=52,SY=226;A.c.strokeStyle='#5a6070';A.c.lineWidth=3;A.c.beginPath();A.c.arc(SX,SY,30,PI,TAU);A.c.stroke();A.c.lineWidth=1;A.c.strokeStyle='#ff4f6d';A.c.lineWidth=3;A.c.beginPath();A.c.arc(SX,SY,30,PI+PI*100/120,TAU);A.c.stroke();A.c.lineWidth=1;const na=PI+PI*mn(kmh,120)/120;L(SX,SY,SX+cos(na)*26,SY+sin(na)*26,K.y,2);C(SX,SY,3,'#c0c0c0');T(Math.round(kmh)+'',SX,SY-14,kmh>100?K.r:K.w,2,'c');T('KM/H',SX,SY+4,K.gr,1,'c');
  const LX=112;R(LX,190,22,46,'#0e1016');for(let n=-4;n<=4;n++){const y=212-n*5;R(LX+2,y,18,1,n===0?'#8a8a8a':'#30343e');}R(LX+1,210-t.n*5,20,5,t.n>0?K.g:t.n<0?(t.n===-4?K.r:K.o):K.w);T(t.n>0?'P'+t.n:t.n<0?(t.n===-4?'EB':'B'+(-t.n)):'N',LX+11,190,K.w,1,'c');T('LEVER',LX+11,236-6,K.gr,1,'c');
  if(s){const err=s.z-t.z;T('NEXT '+s.n,150,192,K.c,1);T('STOP '+(err>=0?err.toFixed(err<100?1:0):'-'+(-err).toFixed(1))+'M',150,204,abs(err)<1.5?K.g:err<0?K.r:K.y,2);const rem=due-clock;T((rem>=0?'DUE ':'LATE ')+fl(abs(rem)/60)+':'+String(fl(abs(rem))%60).padStart(2,'0'),150,222,rem>=0?K.w:K.r,1);
   if(t.v===0&&err<60&&err>-12&&!t.doors&&t.n<=0&&A.t%30<20)T('A = OPEN DOORS',W-8,222,K.y,1,'r');if(t.doors)T('BOARDING...',W-8,222,K.g,1,'r');}
  T('SCORE '+g.score,W-8,192,K.y,1,'r');T((si+1>5?5:si+1)+'/5',W-8,204,K.gr,1,'r');if(kmh>100&&A.t%20<12)T('OVERSPEED!',160,30,K.r,2,'c');if(msgT>0)T(msg,160,50,K.y,1,'c');};
 return g;}});

/* =================================================================== 16. LAVA ESCAPE 3D */
A.add({id:'lavaescape3d',name:'LAVA ESCAPE 3D',cat:'RETRO 3D',hd:1,how:'UP SPRINTS, LEFT/RIGHT DODGE, A JUMPS GAPS. OUTRUN THE LAVA TO THE SUMMIT.',make(){
 const g={over:null,score:0},N=250,RL=2,SL=.42;const cx=z=>sin(z*.025)*5+sin(z*.061)*2,dcx=z=>.125*cos(z*.025)+.122*cos(z*.061),ry=r=>r*SL;
 const rows=[];for(let r=0;r<=N+4;r++){const t=[0,0];if(r>14&&r<N-2){const q=Math.random();if(q<.1&&rows[r-1]&&rows[r-1][0]!==3&&rows[r-1][1]!==3){t[0]=t[1]=3;}else if(q<.28)t[ri(2)]=3;}rows.push(t.map(s=>({s,tm:0,dy:0})));}
 const p={z:1,x:0,y:0,vy:0,air:0,ph:0,st:0,hp:3,inv:0},ps=mkP();let lava=-5,bombs=[],best=0,camY=2;
 g.dbg=()=>{const r=fl((p.z+1.2)/RL),q=rows[r]||[{s:0},{s:0}];return{L:q[0].s,R:q[1].s,x:+p.x.toFixed(2),air:p.air,lava:+(p.y-lava).toFixed(1),z:fl(p.z)};};const rowAt=z=>fl(z/RL),half=x=>x<0?0:1,tile=(z,x)=>{const r=rows[rowAt(z)];return r?r[half(x)]:null;};
 g.update=()=>{ps.step();if(p.inv>0)p.inv--;if(p.st>0)p.st--;const k=A.in(0),h=A.hit(0);
  const sp=p.st?0:k.u?.2:k.d?.07:.13;p.x=cl(p.x+ax(k)*.09,-1.75,1.75);p.z+=sp;p.ph+=sp*2.2;
  const r0=rowAt(p.z),gy=ry(p.z/RL),tl=tile(p.z,p.x);const solid=tl&&tl.s<2;
  if(p.air){p.vy-=.014;p.y+=p.vy;if(p.y<=gy&&solid&&p.vy<0){p.y=gy;p.air=0;S('hit');}else if(p.y<gy-3){g.over='FELL INTO THE LAVA';S('boom');return;}}
  else{if(!solid){p.air=1;p.vy=0;}else{p.y=gy;if(h.a&&!p.st){p.air=1;p.vy=.2;S('jump');}if(tl.s===0){tl.s=1;tl.tm=55;}}}
  for(let r=mx(0,r0-12);r<mn(rows.length,r0+30);r++)for(const t of rows[r]){if(t.s===1&&--t.tm<=0){t.s=2;t.dy=0;}else if(t.s===2){t.dy+=.04;if(t.dy>5)t.s=3;}}
  const lr=fl((lava+1.5)/SL);for(let r=mx(0,lr);r<lr+5&&r<rows.length;r++)for(const t of rows[r])if(t.s===0&&Math.random()<.02){t.s=1;t.tm=40+ri(30);}
  lava+=.031+mn(.009,p.z/6000);if(p.y<lava+.25&&!p.air||p.y<lava){g.over='CONSUMED BY LAVA';S('boom');return;}
  if(A.t%85===0){const rr=r0+5+ri(8);if(rr<N)bombs.push({r:rr,x:rnd(3.2)-1.6,y:ry(rr)+18,vy:0});}
  for(const b of bombs){b.vy-=.012;b.y+=b.vy;const by=ry(b.r);if(b.y<=by){b.done=1;S('boom');A.shake=6;const t=rows[b.r][half(b.x)];if(t.s===0){t.s=1;t.tm=30;}const bz=b.r*RL+1;for(let i=0;i<14;i++)ps.add(cx(bz)+b.x,by+.3,bz,rnd(.3)-.15,.1+rnd(.15),rnd(.3)-.15,30,i%2?'#ffcf3f':'#ff6a20',.15,.01);if(hyp(cx(bz)+b.x-(cx(p.z)+p.x),bz-p.z)<1.5&&p.inv===0){p.hp--;p.st=40;p.inv=80;pop('HIT BY A LAVA BOMB!',K.r);if(p.hp<=0){g.over='KNOCKED OUT BY LAVA BOMBS';return;}}}}bombs=bombs.filter(b=>!b.done);
  if(A.t%3===0)ps.add(cx(p.z)+rnd(20)-10,lava+.2,p.z+rnd(30)-6,rnd(.04)-.02,.08+rnd(.06),0,60,'#ff8a2a',.08,-.001);
  if(r0>best){g.score+=(r0-best)*5;best=r0;}if(r0>=N){g.score+=p.hp*300+fl((p.y-lava)*20);g.over='SUMMIT REACHED! WIN';}};
 g.draw=()=>{const z=p.z,cz=z-5.6;camY+=(p.y+3.1-camY)*.15;cam(cx(cz)+p.x*.6,camY,cz,atan(dcx(z+3))*.7,.02,200);const hz=hzY();
  sky('#120404','#7a2008',hz,'#5a1808','#1a0604');for(let i=0;i<7;i++){const x=((i*83+A.t*.2)%440)-60,y=hz-50-((i*37)%60);glow(x,y,46+(i%3)*14,'30,12,10',.55);}
  {const sx=160-A.cam.ry*200;A.poly([[sx-150,hz+2],[sx-30,hz-70],[sx+30,hz-70],[sx+150,hz+2]],'#2a0e08',1);glow(sx,hz-70,40,'255,120,40',.6);}
  A.fog={col:'#4a1408',near:16,far:46};
  for(let x=-40;x<40;x+=8)for(let q=fl(z/8)*8-8;q<z+48;q+=8){const a=cx(q),b=cx(q+8),w=sin(x*.2+q*.1+A.t*.05)*.08;F([[a+x,lava+w,q],[a+x+8,lava-w,q],[b+x+8,lava+w,q+8],[b+x,lava-w,q+8]],(fl(x/8)+fl(q/8)+fl(A.t/20))%2?'#ff6a10':'#ff7a20',false);}
  A.flush();
  for(let r=mx(0,rowAt(z)-4);r<mn(rows.length-1,rowAt(z)+24);r+=1){const z0=r*RL,z1=z0+RL,a=cx(z0),b=cx(z1),y0=ry(r),y1=ry(r+1);if(y1<lava)continue;for(const s of[-1,1]){const e0=a+s*2,e1=b+s*2,t0=cl((y0-lava)/7,0,1),t1=cl((y1-lava)/7,0,1);F([[e0,y0,z0],[e1,y1,z1],[e1+s*13*t1,y1-7*t1,z1],[e0+s*13*t0,y0-7*t0,z0]],r%2?'#3a2622':'#34221e');}}
  A.flush();
  for(let r=mx(0,rowAt(z)-4);r<mn(rows.length-1,rowAt(z)+24);r++){const z0=r*RL,z1=z0+RL,a=cx(z0),b=cx(z1),y0=ry(r),y1=ry(r+1);if(y1<lava-.5)continue;
   for(let hh=0;hh<2;hh++){const t=rows[r][hh];if(t.s===3)continue;const dy=t.s===2?t.dy:0,sh=t.s===1&&t.tm<25?(rnd(.06)-.03):0,xa=hh?0:-2,xb=hh?2:0,col=t.s===1?(t.tm%10<5?'#a83a18':'#7a2a14'):(r+hh)%2?'#4a3c38':'#443632';
    F([[a+xa+sh,y0-dy,z0],[a+xb+sh,y0-dy,z0],[b+xb+sh,y1-dy,z1],[b+xa+sh,y1-dy,z1]],col);F([[a+xa,y0-dy-.6,z0],[a+xb,y0-dy-.6,z0],[a+xb,y0-dy,z0],[a+xa,y0-dy,z0]],'#2a1e1a');const ex=hh?xb:xa;F([[a+ex,y0-dy,z0],[b+ex,y1-dy,z1],[b+ex,y1-dy-.6,z1],[a+ex,y0-dy-.6,z0]],'#2e2220');}}
  if(N*RL-z<50){const zz=N*RL,a=cx(zz),y=ry(N);for(let i=0;i<8;i++){const an=i/8*TAU;wbox(a+cos(an)*5,y,zz+4+sin(an)*5,2.4,1.5+(i%3)*.6,2.4,'#3a2a26');}wbox(a,y,zz+4,1.2,.05,1.2,'#ffcf3f');mcyl(ID,a,y,zz+2,.06,3,'#ddd',4);F([[a,y+3,zz+2],[a+1.2,y+2.7,zz+2],[a,y+2.4,zz+2]],'#3dff8b',false);}
  for(const b of bombs){const bz=b.r*RL+1,bx=cx(bz)+b.x;msph(ID,bx,b.y,bz,.45,'#ff6a10','#3a1a10',3,6);flat(bx,ry(b.r)+.05,bz,.9+mx(0,(b.y-ry(b.r))*.05),'rgba(255,60,20,'+(.3+.3*sin(A.t*.4))+')',8);}
  if(p.inv%8<5){const X=cx(p.z)+p.x,P=xf(X,p.y,p.z,atan(dcx(p.z)),0,0);shd(X,ry(p.z/RL),p.z,.4,.35,.3);man(P,{ph:p.ph,sw:p.air?.3:.8,sh:'#2fd6c3',pa:'#3a3050',hl:'#ffcf3f',lean:.25,arm:p.air?-1.5:0});}
  ps.draw();A.flush();A.fog=null;
  const dist=p.y-lava;vign(cl(1-dist/8,.25,.85),'255,60,0');
  bar(0,18);T(Math.round(rowAt(z)/N*100)+'%',6,3,K.y,2);T('LAVA '+dist.toFixed(1)+'M',160,5,dist<2.5?(A.t%16<8?K.r:K.o):K.o,1,'c');for(let i=0;i<3;i++)R(W-14-i*13,4,10,8,i<p.hp?K.r:'#3a3040');meter(6,H-9,W-12,4,rowAt(z)/N,K.o);};
 return g;}});

})();
