/* SPACE PACK 1: space games that teach real physics. Every cabinet shows its governing equation with live numbers.
   Units are real (km, m/s, N, kg, days, light-years) and scaled only in time so the play stays snappy. */
(function(){const A=window.A,{W,H,K}=A,T=A.text,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off',hi=()=>A.gfx==='high';
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const TAU=Math.PI*2,D2R=Math.PI/180,G0=9.80665;
const fin=v=>Number.isFinite(v)?v:0;
const MONO="'PA Mono','JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
/* crisp vector text for equations (Unicode: · ² ₁ Δ θ γ √ φ) */
const ft=(s,x,y,col,z,al,b)=>{const c=A.c;if(!c.fillText)return;c.font=(b?'700 ':'')+(z||6.2)+'px '+MONO;c.textAlign=al==='c'?'center':al==='r'?'right':'left';c.textBaseline='middle';c.fillStyle=col||'#e3ecff';c.fillText(String(s),fin(x),fin(y));};
const fw=(s,z,b)=>{const c=A.c;s=String(s);if(!c.measureText)return s.length*(z||6.2)*.6;c.font=(b?'700 ':'')+(z||6.2)+'px '+MONO;const m=c.measureText(s);return m&&m.width?m.width:s.length*(z||6.2)*.6;};
/* tidy equation panel. lines: strings or {t,c,b,z}. o.al==='r' anchors the right edge at x. returns {w,h} */
const eq=(x,y,lines,o)=>{o=o||{};const z=o.z||6,lh=z+2.4;const L=lines.filter(Boolean).map(l=>typeof l==='string'?{t:l}:l);let w=o.w||0;if(!o.w)for(const l of L)w=Math.max(w,fw(l.t,l.z||z,l.b));if(!o.w)w+=9;const h=L.length*lh+4;if(o.al==='r')x-=w;
 X.rr(x,y,w,h,3,'rgba(5,9,26,.8)');X.rrs(x+.5,y+.5,w-1,h-1,3,o.acc?X.rgba(o.acc,.5):'rgba(140,180,255,.26)',.6);A.c.fillStyle=o.acc||'#6fb6ff';A.c.fillRect(x+3,y,12,.8);
 L.forEach((l,i)=>ft(l.t,x+4.5,y+2.2+lh*i+lh/2,l.c||'#d8e4ff',l.z||z,'l',l.b));return{w,h};};
const fmt=(v,d)=>{v=fin(v);const s=Math.abs(v).toFixed(d||0).split('.');s[0]=s[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');return(v<0?'-':'')+s.join('.');};
const sci=v=>{v=fin(v);if(v===0)return'0';const e=Math.floor(Math.log10(Math.abs(v))),m=v/Math.pow(10,e);return m.toFixed(2)+'×10'+String(e).split('').map(ch=>'⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(ch)]||'⁻').join('');};
/* seeded rng for layouts */
const srng=seed=>{let s=(seed*2654435761>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};};
/* cached deep-space backdrop: gradient, nebula clouds, dust lanes, static stars */
const nebula=(key,pal,seed)=>X.cache('space1_'+key,()=>{const c=A.c,r=srng(seed||7);X.sky([pal[0],pal[1],pal[0]]);
 const o=c.globalCompositeOperation;c.globalCompositeOperation='lighter';
 for(let i=0;i<10;i++){const x=r()*W,y=r()*H,rad=40+r()*110,col=pal[2+i%(pal.length-2)];X.disc(x,y,rad,X.rg(x,y,0,x,y,rad,[X.rgba(col,.13+r()*.12),X.rgba(col,0)]));}
 for(let i=0;i<5;i++){const x=r()*W,y=r()*H,rad=14+r()*30,col=pal[2+i%(pal.length-2)];X.disc(x,y,rad,X.rg(x,y,0,x,y,rad,[X.rgba(col,.2),X.rgba(col,0)]));}
 c.globalCompositeOperation=o||'source-over';
 for(let i=0;i<5;i++){const x=r()*W,y=r()*H,rad=30+r()*60;X.disc(x,y,rad,X.rg(x,y,0,x,y,rad,['rgba(0,0,0,.28)','rgba(0,0,0,0)']));}
 for(let i=0;i<300;i++){const x=r()*W,y=r()*H,b=r();c.fillStyle='rgba('+(200+(b*55|0))+','+(210+(b*45|0))+',255,'+(.12+b*.5).toFixed(2)+')';const s=b>.95?1.2:.6;c.fillRect(x,y,s,s);}
 for(let i=0;i<7;i++){const x=r()*W,y=r()*H;X.glow(x,y,5,'#cfe0ff',.45);c.fillStyle='rgba(255,255,255,.45)';c.fillRect(x-3.5,y-.25,7,.5);c.fillRect(x-.25,y-3.5,.5,7);}});
/* parallax star layers on top of the cached backdrop */
const pstars=(sx,sy,n)=>{X.stars(n||36,3,sx||0,sy||0,H,.75);if(lo())X.stars(14,11,(sx||0)*2.2,(sy||0)*2.2,H,1);};
/* planet with lit gradient, optional bands/craters/ring/atmosphere and a soft terminator. lx,ly = direction TO the light */
const STY=[{c:'#9a958e',cr:1},{c:'#3f7fd8',c2:'#9fe0a0',atm:'#7fc8ff',bands:5},{c:'#c8603a',cr:1,atm:'#ffb08a'},{c:'#d89a5a',c2:'#fff0d0',bands:9,spot:'#c0503a'},{c:'#4fc8d8',c2:'#d0ffff',atm:'#9ff0ff',bands:5},{c:'#d0502a',c2:'#ffd060',cr:1,atm:'#ff7040'},{c:'#100818'},{c:'#9a6ad8',c2:'#f0d8ff',bands:7,ring:1,atm:'#c8a0ff'},{c:'#e0d8c8',c2:'#a8d0ff',cr:1,atm:'#d8f0ff'}];
const planet=(x,y,r,o)=>{o=typeof o==='number'?STY[o]:o||STY[1];const c=A.c,col=o.c,lx=o.lx===undefined?-.62:o.lx,ly=o.ly===undefined?-.5:o.ly;r=Math.max(.8,r);
 if(o.ring&&lo()){c.strokeStyle=X.rgba(o.c2||'#ffffff',.45);c.lineWidth=Math.max(1,r*.18);c.beginPath();if(c.ellipse)c.ellipse(x,y,r*1.9,r*.55,-.3,Math.PI,TAU);c.stroke();}
 if(o.atm&&lo())X.disc(x,y,r*1.3,X.rg(x,y,r*.92,x,y,r*1.3,[X.rgba(o.atm,.5),X.rgba(o.atm,0)]));
 X.disc(x,y,r,X.rg(x+lx*r*.45,y+ly*r*.45,r*.05,x,y,r*1.05,[X.lt(col,1.55),col,X.lt(col,.4)]));
 if(lo()&&r>4&&(o.bands||o.cr)){c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  if(o.bands)for(let i=0;i<o.bands;i++){const yy=y-r+(i+.5)*2*r/o.bands+Math.sin(i*2.7)*r*.05,hh=r/o.bands*(.55+.6*Math.abs(Math.sin(i*1.31)));c.fillStyle=i%2?X.rgba(o.c2||'#ffffff',.2):'rgba(0,0,0,.13)';c.fillRect(x-r,yy-hh/2,2*r,hh);}
  if(o.spot)X.ell(x+r*.28,y+r*.3,r*.2,r*.11,X.rgba(o.spot,.75));
  if(o.cr){const q=srng((r*7|0)+3);for(let i=0;i<7;i++){const a=q()*TAU,d=q()*r*.8,s=r*(.08+q()*.14);X.ell(x+Math.cos(a)*d,y+Math.sin(a)*d,s,s*.8,'rgba(0,0,0,.18)');X.ell(x+Math.cos(a)*d-s*.25,y+Math.sin(a)*d-s*.25,s*.5,s*.35,'rgba(255,255,255,.08)');}}
  c.restore();}
 X.disc(x,y,r+.25,X.rg(x+lx*r,y+ly*r,r*.55,x+lx*r,y+ly*r,r*2.15,['rgba(0,0,10,0)','rgba(0,0,10,.86)']));
 if(o.atm&&r>3){const a0=Math.atan2(ly,lx);c.strokeStyle=X.rgba(o.atm,.65);c.lineWidth=Math.max(.6,r*.07);c.beginPath();c.arc(x,y,r,a0-1.1,a0+1.1);c.stroke();}
 if(o.ring&&lo()){c.strokeStyle=X.rgba(o.c2||'#ffffff',.6);c.lineWidth=Math.max(1,r*.18);c.beginPath();if(c.ellipse)c.ellipse(x,y,r*1.9,r*.55,-.3,0,Math.PI);c.stroke();}};
/* black hole with accretion disk */
const bhole=(x,y,r)=>{const c=A.c,t=A.t*.05;if(lo()){X.glow(x,y,r*5,'#ff9a40',.35);c.strokeStyle='rgba(255,190,110,.75)';c.lineWidth=r*.7;c.beginPath();if(c.ellipse)c.ellipse(x,y,r*2.6,r*.8,.25,0,TAU);c.stroke();c.strokeStyle='rgba(255,240,200,.55)';c.lineWidth=r*.25;c.beginPath();c.arc(x,y,r*1.35,t,t+4);c.stroke();}
 X.disc(x,y,r,'#000000');c.strokeStyle='rgba(255,220,170,.9)';c.lineWidth=.8;c.beginPath();c.arc(x,y,r+.4,0,TAU);c.stroke();};
/* star / sun */
const sun=(x,y,r,col)=>{col=col||'#ffd060';if(lo()){X.glow(x,y,r*4.2,col,.32);X.glow(x,y,r*2.1,'#fff0c0',.4);}X.disc(x,y,r,X.rg(x-r*.2,y-r*.2,r*.1,x,y,r,['#ffffff','#fff3c0',col]));};
const arrow=(x1,y1,x2,y2,col,w)=>{const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy);if(!(l>1.2))return;const ux=dx/l,uy=dy/l,h=Math.min(4.5,l*.45);X.stroke([[x1,y1],[x2-ux*h*.7,y2-uy*h*.7]],col,w||1.1);X.poly([[x2,y2],[x2-ux*h-uy*h*.5,y2-uy*h+ux*h*.5],[x2-ux*h+uy*h*.5,y2-uy*h-ux*h*.5]],col);};
/* engine flame pointing along ang (radians) */
const flame=(x,y,ang,len,wid,blue)=>{if(!(len>.6))return;const c=A.c,fl=len*(.82+Math.random()*.32),dx=Math.cos(ang),dy=Math.sin(ang),px=-dy*wid,py=dx*wid,o=c.globalCompositeOperation;c.globalCompositeOperation='lighter';
 X.poly([[x+px,y+py],[x+dx*fl,y+dy*fl],[x-px,y-py]],X.lg(x,y,x+dx*fl,y+dy*fl,blue?['rgba(220,240,255,.95)','rgba(90,160,255,.6)','rgba(40,60,255,0)']:['rgba(255,245,210,.95)','rgba(255,150,40,.65)','rgba(255,60,20,0)']));
 X.poly([[x+px*.45,y+py*.45],[x+dx*fl*.5,y+dy*fl*.5],[x-px*.45,y-py*.45]],'rgba(255,255,255,.7)');if(lo())X.glow(x+dx*fl*.25,y+dy*fl*.25,wid*3.2,blue?'#6aa8ff':'#ff9a40',.3);c.globalCompositeOperation=o||'source-over';};
const hud=(l,r)=>X.bar(l,r);
const banner=(s,y,col,sub)=>{const w=s.length*8+18;X.rr(W/2-w/2,y-6,w,sub?30:20,5,'rgba(4,8,24,.82)');X.rrs(W/2-w/2+.5,y-5.5,w-1,(sub?30:20)-1,5,X.rgba(col||'#6fb6ff',.6),.8);X.ot(s,W/2,y,col||K.y,2,'c');if(sub)ft(sub,W/2,y+17.5,'#c8d6ff',6,'c');};
const mlen=(v,k)=>cl(Math.sqrt(Math.abs(v))*k,0,60);
A.space1={};

/* ================= GRAVITY SLINGSHOT ================= */
/* 1 px = 1,000 km, 1 frame = 501 s, so a = M/r² (M in 0.01 Earth masses) is exactly G·M/r² in real units. */
const SL_DT=501,SL_MP=722,SL_ME=5.972e24,SL_G=6.674e-11,SL_A=1e6/(SL_DT*SL_DT);
// body: [x,y,r,M,style,orbit{p:parent,R,w,ph}]  rocks: [x,y,r]
const SL_LV=[
 {n:'FIRST FLYBY',s:[26,176],P:[[150,128,14,90,1]],T:[292,70,11],sh:[[150,84],[214,92]],pv:260},
 {n:'AROUND THE BEND',s:[26,120],P:[[165,120,16,110,2]],T:[294,120,11],sh:[[165,74],[165,166]],pv:260},
 {n:'TWIN WORLDS',s:[26,204],P:[[118,96,13,90,1],[212,160,15,110,4]],T:[296,40,11],sh:[[165,128],[250,100]],pv:260},
 {n:'TURNAROUND',s:[40,56],P:[[206,134,18,220,3]],T:[40,192,11],sh:[[262,134],[150,192]],pv:260},
 {n:'ROCK GARDEN',s:[26,120],P:[[160,52,13,100,0],[160,190,13,100,0]],R:'wall:244:30:212:90:136',T:[296,180,11],sh:[[200,110],[270,150]],pv:260},
 {n:'MOON DANCE',s:[26,40],P:[[160,124,16,140,1],[0,0,6,24,0,{p:0,R:46,w:.014,ph:0}]],T:[292,204,11],sh:[[160,60],[224,124]],pv:260},
 {n:'GAS GIANT',s:[26,32],P:[[170,132,22,300,3],[0,0,5,14,8,{p:0,R:52,w:.011,ph:2}]],T:[292,206,11],sh:[[110,132],[170,206]],pv:170},
 {n:'SLALOM',s:[20,120],P:[[90,66,12,70,2],[160,174,12,70,0],[232,66,12,70,5]],T:[300,150,11],sh:[[125,120],[196,120]],pv:170},
 {n:'HIDDEN GATE',s:[24,40],P:[[236,186,14,260,4]],R:'ring:236:110:24:215:325',T:[236,110,10],sh:[[120,60],[290,150]],pv:170},
 {n:'BLACK HOLE',s:[26,206],P:[[164,120,4,460,6]],T:[56,40,11],sh:[[200,120],[164,78]],pv:170},
 {n:'COMPANION',s:[26,218],P:[[160,120,14,150,7],[0,0,8,60,8,{p:0,R:56,w:.01,ph:1}]],T:[292,24,11],sh:[[96,120],[224,120]],pv:170},
 {n:'THE WALL',s:[26,120],P:[[200,150,15,240,3]],R:'wall:150:44:196:0:0',T:[300,196,10],sh:[[150,30],[150,210]],pv:170},
 {n:'MOON GAUNTLET',s:[24,120],P:[[160,120,14,120,1],[0,0,6,20,0,{p:0,R:40,w:.02,ph:0}],[0,0,5,15,2,{p:0,R:72,w:-.013,ph:2}]],T:[296,120,11],sh:[[160,30],[160,210]],pv:110},
 {n:'DOUBLE ASSIST',s:[30,32],P:[[150,62,12,100,4],[232,170,14,160,3]],R:'wall:0:120:140:0:0:h',T:[30,206,11],sh:[[280,90],[150,200]],pv:110},
 {n:'EVENT HORIZON',s:[24,30],P:[[120,150,4,400,6],[232,72,13,110,5]],T:[296,214,11],sh:[[70,150],[180,120]],pv:110},
 {n:'ASTEROID BELT',s:[20,206],P:[[100,170,13,110,2],[222,60,13,110,0]],R:'belt:60:26:270:222:150:40',T:[300,30,11],sh:[[160,140],[262,110]],pv:110},
 {n:'RING WORLD',s:[24,206],P:[[160,120,15,220,7],[0,0,6,30,8,{p:0,R:62,w:.012,ph:4}]],R:'ring:160:120:31:0:0',T:[296,36,11],sh:[[160,40],[240,120]],pv:110},
 {n:'SLINGSHOT CHAIN',s:[20,206],P:[[70,64,10,60,0],[140,172,12,90,2],[210,70,12,90,4],[272,172,10,60,5]],T:[300,28,11],sh:[[105,120],[240,120]],pv:72},
 {n:'TWIN SINGULARITY',s:[24,220],P:[[120,92,4,300,6],[202,150,4,300,6]],T:[296,22,11],sh:[[160,120],[80,200]],pv:72},
 {n:'GRAND TOUR',s:[20,120],P:[[150,120,20,280,3],[0,0,6,20,8,{p:0,R:48,w:.016,ph:0}],[250,50,4,260,6]],R:'wall:212:150:226:0:0',T:[300,190,11],sh:[[150,40],[250,110]],pv:72}];
const slRocks=lv=>{if(!lv.R)return[];const a=lv.R.split(':'),k=a[0],v=a.slice(1).map(Number),o=[];
 if(k==='wall'){const[x,y0,y1,g0,g1]=v;if(a[6]==='h'){for(let x2=y0;x2<=y1;x2+=9)o.push([x2,x,4.5]);return o;}for(let y=y0;y<=y1;y+=9)if(!(y>g0&&y<g1))o.push([x,y,4.5]);}
 else if(k==='ring'){const[x,y,R,g0,g1]=v;for(let d=0;d<360;d+=12)if(!(d>g0&&d<g1))o.push([x+Math.cos(d*D2R)*R,y+Math.sin(d*D2R)*R,4]);}
 else if(k==='belt'){const[x0,y0,x1,y1,gc,gw]=v,n=26,q=srng(5);for(let i=0;i<n;i++){const t=i/(n-1),x=x0+(x1-x0)*t,y=y0+(y1-y0)*t;const d=Math.hypot(x-x0,y-y0);if(Math.abs(d-gc)<gw/2)continue;o.push([x+(q()-.5)*8,y+(q()-.5)*8,3.5+q()*2]);}}
 return o;};
const slPos=(lv,i,tc)=>{const b=lv.P[i],o=b[5];if(!o)return[b[0],b[1]];const p=slPos(lv,o.p,tc),a=o.ph+o.w*tc;return[p[0]+Math.cos(a)*o.R,p[1]+Math.sin(a)*o.R];};
/* one frame of flight: returns null or 'hit:i' / 'rock' / 'gate' / 'lost' */
const slStep=(lv,rocks,q,tc)=>{const nb=lv.P.length;for(let s=0;s<6;s++){const t=tc+s/6;let axx=0,ayy=0;for(let i=0;i<nb;i++){const p=slPos(lv,i,t),dx=p[0]-q.x,dy=p[1]-q.y,d2=dx*dx+dy*dy,d=Math.sqrt(d2);if(d<lv.P[i][2])return'hit:'+i;const a=lv.P[i][3]/d2;axx+=a*dx/d;ayy+=a*dy/d;}
  q.vx+=axx/6;q.vy+=ayy/6;q.x+=q.vx/6;q.y+=q.vy/6;}
 for(const r of rocks)if(Math.hypot(r[0]-q.x,r[1]-q.y)<r[2]+1.5)return'rock';
 if(Math.hypot(lv.T[0]-q.x,lv.T[1]-q.y)<lv.T[2])return'gate';if(q.x<-40||q.x>W+40||q.y<-40||q.y>H+40)return'lost';return null;};
A.space1.sling={LV:SL_LV,rocks:slRocks,step:slStep};
A.add({id:'slingshot',name:'GRAVITY SLINGSHOT',cat:'PUZZLE',time:600,tags:'space physics gravity assist slingshot inverse square newton orbit education puzzle',how:'LEFT/RIGHT AIM, UP/DOWN POWER, A LAUNCHES. BEND THROUGH GRAVITY WELLS INTO THE GATE.',make(){
 const g={over:null,score:0},fx=X.fx();let li=0,lv,rocks,grid,probes=6,tries=0,tc=0,ang=0,pw=3,hold=0,q=null,trail=[],got=[],assist=[],msg='',mt=0,ft2=0,clearT=0,best={};
 const load=i=>{li=i;lv=SL_LV[i];rocks=slRocks(lv);got=lv.sh.map(()=>0);tries=0;tc=0;q=null;trail=[];
  ang=Math.atan2(lv.T[1]-lv.s[1],lv.T[0]-lv.s[0])/D2R;pw=2.6;msg='SECTOR '+(i+1)+': '+lv.n;mt=110;
  grid=[];const st=lv.P.filter(b=>!b[5]);const warp=(x,y)=>{let ox=0,oy=0;for(const b of st){const dx=b[0]-x,dy=b[1]-y,d=Math.hypot(dx,dy)||1,s=Math.min(d*.7,b[3]*.55/(d+b[2]));ox+=dx/d*s;oy+=dy/d*s;}return[x+ox,y+oy];};
  for(let y=20;y<=H;y+=16){const l=[];for(let x=-8;x<=W+8;x+=8)l.push(warp(x,y));grid.push(l);}
  for(let x=0;x<=W;x+=16){const l=[];for(let y=18;y<=H+8;y+=8)l.push(warp(x,y));grid.push(l);}};
 load(0);
 const launch=()=>{q={x:lv.s[0],y:lv.s[1],vx:Math.cos(ang*D2R)*pw,vy:Math.sin(ang*D2R)*pw,t:0,near:lv.P.map(()=>1e9),dir0:ang};trail=[];assist=lv.P.map(()=>0);tries++;S('jump');fx.ring(lv.s[0],lv.s[1],'#9fd8ff',16,14);};
 const lose=(why,x,y)=>{S('boom');A.shake=6;fx.debris(x,y,'#c8c8d8',10,2);fx.spark(x,y,'#ffb060',14,2.5);q=null;probes--;msg=why;mt=80;if(probes<=0){g.over='OUT OF PROBES - SECTOR '+(li+1);}};
 g.update=()=>{tc++;if(mt)mt--;if(clearT>0){if(--clearT===0){if(li>=SL_LV.length-1){g.score+=probes*150;g.over='ALL 20 SECTORS CLEAR';return;}load(li+1);}return;}
  const k=A.in(0),h=A.hit(0);
  if(!q){const d=ax(k)||ay(k)?1:0;hold=d?hold+1:0;const sp=hold<12?.25:Math.min(1.6,.25+(hold-12)*.04);ang+=ax(k)*sp;pw=cl(pw-ay(k)*sp*.035,1.2,5);if(h.a)launch();return;}
  if(h.b){lose('PROBE ABORTED',q.x,q.y);return;}
  const r=slStep(lv,rocks,q,tc);q.t++;if(q.t%2===0){trail.push([q.x,q.y]);if(trail.length>260)trail.shift();}
  lv.P.forEach((b,i)=>{const p=slPos(lv,i,tc),d=Math.hypot(p[0]-q.x,p[1]-q.y);if(d<q.near[i])q.near[i]=d;
   if(!assist[i]&&q.near[i]<b[2]*2.6&&d>q.near[i]+14){assist[i]=1;const turn=Math.abs(((Math.atan2(q.vy,q.vx)/D2R-q.dir0)+540)%360-180);if(turn>20){g.score+=25;A.burst(q.x,q.y,'#7fe0ff',6,1.2);fx.pop(q.x,q.y-8,'GRAVITY ASSIST','#7fe0ff');S('coin');}}});
  lv.sh.forEach((s,i)=>{if(!got[i]&&Math.hypot(s[0]-q.x,s[1]-q.y)<8){got[i]=1;g.score+=50;A.burst(s[0],s[1],'#6ff0ff',12,1.6);S('coin');}});
  if(r==='gate'){const first=tries===1;g.score+=300+(first?200:0);A.burst(lv.T[0],lv.T[1],K.y,30,2.6);fx.ring(lv.T[0],lv.T[1],'#ffe080',40,24);fx.flash('#bfe8ff',8);S('win');probes=Math.min(9,probes+1);msg=first?'FIRST-SHOT BONUS!':'GATE REACHED';mt=90;clearT=80;q=null;}
  else if(r==='rock')lose('HIT AN ASTEROID',q.x,q.y);else if(r==='lost')lose('LOST IN DEEP SPACE',cl(q.x,10,W-10),cl(q.y,24,H-10));
  else if(r&&r.startsWith('hit')){const p=slPos(lv,+r.slice(4),tc);lose(lv.P[+r.slice(4)][4]===6?'SWALLOWED BY THE HOLE':'CRASHED ON A PLANET',q.x,q.y);fx.ring(p[0],p[1],'#ff8040',30,16);}
  else if(q&&q.t>1100)lose('MISSION TIMED OUT',q.x,q.y);};
 const pre=()=>{const p={x:lv.s[0],y:lv.s[1],vx:Math.cos(ang*D2R)*pw,vy:Math.sin(ang*D2R)*pw},pts=[];let end=null;for(let i=0;i<lv.pv;i++){end=slStep(lv,rocks,p,tc+i);if(i%3===0)pts.push([p.x,p.y]);if(end)break;}return{pts,end,p};};
 g.draw=()=>{const c=A.c;nebula('sl'+(li%4),[['#05061a','#0c0a2a','#5a2aa0','#2050c0','#c03a7a'],['#03101a','#081a2a','#1a7a9a','#3a40b0','#20a080'],['#120612','#1a0a20','#a03a3a','#6a2a9a','#d07a30'],['#060a14','#0a1022','#3a5ac0','#8a3ab0','#30a0c0']][li%4],li%4+2);
  pstars(0,0,30);
  if(lo()){c.strokeStyle='rgba(110,170,255,.13)';c.lineWidth=.5;for(const l of grid){c.beginPath();l.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();}}
  for(const r of rocks){X.disc(r[0]+.6,r[1]+.8,r[2],'rgba(0,0,0,.4)');X.disc(r[0],r[1],r[2],X.rg(r[0]-r[2]*.4,r[1]-r[2]*.4,.3,r[0],r[1],r[2],['#b8a898','#6a5a4e','#2a221e']));}
  lv.P.forEach((b,i)=>{const p=slPos(lv,i,tc);if(b[5]&&lo()){const pp=slPos(lv,b[5].p,tc);c.strokeStyle='rgba(180,200,255,.12)';c.lineWidth=.6;c.beginPath();c.arc(pp[0],pp[1],b[5].R,0,TAU);c.stroke();}
   if(b[4]===6)bhole(p[0],p[1],b[2]);else{const lx=-.62,ly=-.5;planet(p[0],p[1],b[2],Object.assign({},STY[b[4]],{lx,ly}));}});
  /* gate */
  const[tx,ty,tr]=lv.T;if(lo())X.glow(tx,ty,tr*2.6,'#ffc860',.35);c.lineWidth=1.6;for(let i=0;i<6;i++){const a=A.t*.04+i*TAU/6;c.strokeStyle=i%2?'#ffd870':'#ff9a40';c.beginPath();c.arc(tx,ty,tr,a,a+.7);c.stroke();}
  X.disc(tx,ty,tr*.7,X.rg(tx,ty,0,tx,ty,tr*.7,['rgba(255,255,255,.9)','rgba(160,120,255,.5)','rgba(40,20,90,.1)']));
  lv.sh.forEach((s,i)=>{if(!got[i]){if(lo())X.glow(s[0],s[1],7,'#5ff0ff',.4);X.gem(s[0],s[1]+Math.sin(A.t*.06+i)*1.5,6,'#5ff0ff');}});
  /* launcher */
  const[sx,sy]=lv.s;X.disc(sx,sy,6,X.rg(sx-2,sy-2,.5,sx,sy,6,['#e0e8f0','#7a8aa0','#2a3448']));c.fillStyle='#ffcf3f';c.fillRect(sx-8,sy-.6,16,1.2);c.fillStyle='rgba(120,200,255,.8)';c.fillRect(sx-1,sy-8,2,16);
  if(!q){const P=pre();P.pts.forEach((p,i)=>{c.globalAlpha=Math.max(.22,1-i/P.pts.length);X.disc(p[0],p[1],i%4===0?1.3:.9,i%4===0?'#ffffff':'#9fdcff');});c.globalAlpha=1;
   if(P.end){const e=P.pts[P.pts.length-1]||[sx,sy];X.disc(e[0],e[1],2.5,P.end==='gate'?'#7dff9a':P.end==='lost'?'#9aa':'#ff6060');}
   arrow(sx,sy,sx+Math.cos(ang*D2R)*(10+pw*5),sy+Math.sin(ang*D2R)*(10+pw*5),'#ffcf3f',1.4);}
  if(trail.length>1){c.lineWidth=1;for(let i=1;i<trail.length;i++){c.strokeStyle='rgba(140,220,255,'+(i/trail.length*.8).toFixed(2)+')';c.beginPath();c.moveTo(trail[i-1][0],trail[i-1][1]);c.lineTo(trail[i][0],trail[i][1]);c.stroke();}}
  let dom=-1,da=0,net=[0,0];
  if(q){lv.P.forEach((b,i)=>{const p=slPos(lv,i,tc),dx=p[0]-q.x,dy=p[1]-q.y,d=Math.hypot(dx,dy)||1,a=b[3]/(d*d);net[0]+=a*dx/d;net[1]+=a*dy/d;if(a>da){da=a;dom=i;}const L=mlen(a,46);arrow(q.x,q.y,q.x+dx/d*L,q.y+dy/d*L,b[4]===6?'#ffb060':X.lt(STY[b[4]].c,1.3),.9);});
   const nl=Math.hypot(net[0],net[1])||1,NL=mlen(nl,46);arrow(q.x,q.y,q.x+net[0]/nl*NL,q.y+net[1]/nl*NL,'#ffffff',1.4);
   X.glow(q.x,q.y,7,'#9fe0ff',.6);X.disc(q.x,q.y,2.2,'#ffffff');const va=Math.atan2(q.vy,q.vx);c.fillStyle='#ffcf3f';c.fillRect(q.x-Math.sin(va)*3-.6,q.y+Math.cos(va)*3-.6,1.2,1.2);c.fillRect(q.x+Math.sin(va)*3-.6,q.y-Math.cos(va)*3-.6,1.2,1.2);}
  fx.draw();
  hud('SECTOR '+(li+1)+'/20','SCORE '+g.score);
  for(let i=0;i<probes;i++){const x=W-8-i*7,y=24;X.disc(x,y,2.2,i<probes?'#9fe0ff':'#334');}T('PROBES',W-12-probes*7,22,'#8aa8d0',1,'r');
  const lines=[{t:'F = G·M·m / r²',c:'#7fd0ff',b:1}];
  if(q&&dom>=0){const b=lv.P[dom],p=slPos(lv,dom,tc),d=Math.hypot(p[0]-q.x,p[1]-q.y),ar=da*SL_A;
   lines.push('M = '+(b[3]/100).toFixed(b[4]===6?1:2)+' M⊕   r = '+fmt(d*1000)+' km');lines.push({t:'F = '+fmt(ar*SL_MP,ar*SL_MP<10?2:0)+' N   a = F/m = '+ar.toFixed(2)+' m/s²',c:'#ffe08a'});
   lines.push('|v| = '+(Math.hypot(q.vx,q.vy)*1e3/SL_DT).toFixed(2)+' km/s   T+ '+(q.t*SL_DT/86400).toFixed(1)+' d');}
  else lines.push('m = 722 kg   v₀ = '+(pw*1e3/SL_DT).toFixed(2)+' km/s','θ = '+(((ang%360)+360)%360).toFixed(1)+'°   preview '+(lv.pv*SL_DT/86400).toFixed(1)+' d');
  eq(4,20,lines);
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,H/2-34,clearT?'#7dff9a':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= DOCKING ================= */
/* real units: metres, m/s, N, kg. 1 frame = 1/15 s (4x time warp). capsule 9,500 kg, RCS 4 x 400 N, Isp 220 s */
const DK_DT=1/15,DK_M=9500,DK_F=1600,DK_ISP=220,DK_LP=6,DK_LC=2.2;
// [start d, lateral y, closing v, lateral v, att err deg, att rate deg/s, station rate deg/s, prop kg, rate lim, lat lim, att lim]
const DK_LV=[[26,.7,.18,0,0,0,0,26,.25,.32,4],[36,3,.12,0,0,0,0,24,.25,.3,4],[42,-4,.05,.04,5,0,0,22,.22,.28,3.5],[50,6,0,-.06,-8,.3,0,20,.2,.26,3.5],
 [60,-2,.65,0,0,0,0,20,.2,.25,3],[46,0,.1,0,0,0,.4,20,.2,.25,3],[55,5,.08,.05,6,-.4,.3,18,.18,.24,3],[70,-6,.25,-.08,-10,.5,0,16,.16,.22,3],
 [60,4,.12,0,4,0,-.6,15,.15,.2,2.5],[80,8,.4,.1,12,-.6,.4,14,.14,.2,2.5],[70,-7,.2,-.1,-8,.6,.8,13,.12,.18,2],[90,10,.5,.12,15,.8,-.9,12,.1,.15,2]];
A.add({id:'dockmaster',name:'DOCKMASTER',cat:'SIM',time:480,tags:'space docking rendezvous rcs iss capsule physics education newton simulator',how:'ARROWS FIRE RCS JETS, A/B ROLL. DOCK SLOW, CENTRED AND SQUARE. CONTACT IN T = D/V.',make(){
 const g={over:null,score:0},fx=X.fx();let li=0,lv,p,v,th,om,ph,oms,prop,prop0,gates,lives=3,msg='',mt=0,endT=0,ok=0,zoom=4,cxm=0,cym=0,jets=[],cone=0,tt=0,last={};
 const load=i=>{li=i;lv=DK_LV[i];ph=0;oms=lv[6]*D2R;const u=[-1,0],w=[0,1];const P=[-DK_LP,0];
  p=[P[0]+u[0]*(lv[0]+DK_LC)+w[0]*lv[1],P[1]+u[1]*(lv[0]+DK_LC)+lv[1]];v=[-u[0]*lv[2]+w[0]*lv[3],-u[1]*lv[2]+lv[3]];th=lv[4]*D2R;om=lv[5]*D2R;prop=prop0=lv[7];gates=[50,30,20,10,5].map(d=>d<lv[0]?0:1);endT=0;cone=0;tt=0;
  msg='DOCKING '+(i+1)+' / '+DK_LV.length;mt=100;zoom=cl(180/(lv[0]+10),1.6,12);};
 load(0);
 const geo=()=>{const c=Math.cos(ph),s=Math.sin(ph),P=[-DK_LP*c,-DK_LP*s],u=[-c,-s],w=[-s,c],Vp=[-oms*P[1],oms*P[0]],n=[Math.cos(th),Math.sin(th)],Q=[p[0]+n[0]*DK_LC,p[1]+n[1]*DK_LC],r=[Q[0]-P[0],Q[1]-P[1]],vr=[v[0]-Vp[0],v[1]-Vp[1]];
  let ae=((th-ph)/D2R+540)%360-180;return{P,u,w,n,Q,d:r[0]*u[0]+r[1]*u[1],y:r[0]*w[0]+r[1]*w[1],vc:-(vr[0]*u[0]+vr[1]*u[1]),vl:vr[0]*w[0]+vr[1]*w[1],ae,ar:(om-oms)/D2R,c,s};};
 const fail=why=>{S('boom');A.shake=8;fx.flash('#ff6040',8);lives--;msg=why;mt=110;endT=110;ok=0;if(lives<=0)g.over='MISSION SCRUBBED - '+g.score+' PTS';};
 g.update=()=>{if(mt)mt--;
  if(endT>0){if(--endT===0&&!g.over){if(ok){if(li>=DK_LV.length-1){g.over='ALL PORTS DOCKED - MISSION COMPLETE';return;}load(li+1);}else load(li);}if(ok){const da=oms*DK_DT,c=Math.cos(da),s=Math.sin(da);p=[p[0]*c-p[1]*s,p[0]*s+p[1]*c];th=ph+da;om=oms;}ph+=oms*DK_DT;return;}
  const k=A.in(0);let fx_=ax(k),fy_=ay(k),rot=(A.in(0).b?1:0)-(A.in(0).a?1:0);if(prop<=0){fx_=fy_=rot=0;}
  const n=[Math.cos(th),Math.sin(th)],l=[-n[1],n[0]],acc=DK_F/(DK_M+prop);
  v[0]+=(n[0]*fx_+l[0]*fy_)*acc*DK_DT;v[1]+=(n[1]*fx_+l[1]*fy_)*acc*DK_DT;om+=rot*1.6*D2R*DK_DT;
  const used=(Math.abs(fx_)+Math.abs(fy_))*DK_F/(DK_ISP*G0)*DK_DT*.5+Math.abs(rot)*.004;prop=Math.max(0,prop-used);
  if(fx_)jets.push({x:p[0]-n[0]*fx_*1.6,y:p[1]-n[1]*fx_*1.6,vx:-n[0]*fx_*2,vy:-n[1]*fx_*2,t:8});if(fy_)jets.push({x:p[0]-l[0]*fy_*1.8,y:p[1]-l[1]*fy_*1.8,vx:-l[0]*fy_*2,vy:-l[1]*fy_*2,t:8});
  if(rot){jets.push({x:p[0]+n[0]*1.2+l[0]*rot*1.6,y:p[1]+n[1]*1.2+l[1]*rot*1.6,vx:l[0]*rot*2,vy:l[1]*rot*2,t:6});}
  jets.forEach(j=>{j.x+=j.vx*DK_DT;j.y+=j.vy*DK_DT;j.t--;});jets=jets.filter(j=>j.t>0);if(jets.length>80)jets.splice(0,jets.length-80);
  p[0]+=v[0]*DK_DT;p[1]+=v[1]*DK_DT;th+=om*DK_DT;ph+=oms*DK_DT;tt++;
  const G=geo();
  gates.forEach((q,i)=>{const d=[50,30,20,10,5][i];if(!q&&G.d<d){gates[i]=1;const good=G.vc<=lv[8]+d*.012&&G.vc>0;g.score+=good?20:10;fx.pop(160,64,d+' M '+(good?'GOOD RATE':'FAST!'),good?'#7dff9a':'#ffb060');A.burst(160,70,good?'#7dff9a':'#ffb060',6,1);S(good?'coin':'blip');}});
  if(G.d<30&&G.d>0){const lim=G.d*Math.tan(12*D2R)+1;if(Math.abs(G.y)>lim){cone++;if(cone>60*4){fail('WAVE-OFF: LEFT APPROACH CORRIDOR');return;}}else cone=Math.max(0,cone-2);}else cone=0;
  if(G.d<=0){if(Math.abs(G.y)<1.4){const okR=G.vc<=lv[8],okL=Math.abs(G.y)<=lv[9],okA=Math.abs(G.ae)<=lv[10],okW=Math.abs(G.ar)<=.6;last={vc:G.vc,y:G.y,ae:G.ae};
    if(okR&&okL&&okA&&okW&&G.vc>-.05){ok=1;const bonus=Math.round(400+prop/prop0*300+(1-G.vc/lv[8])*150+(1-Math.abs(G.y)/lv[9])*150);g.score+=bonus;A.burst(160,110,K.y,30,2.5);fx.ring(160,110,'#7dff9a',50,26);S('win');msg='SOFT CAPTURE! +'+bonus;mt=120;endT=120;
     const c=G.c,s=G.s;th=ph;om=oms;p=[G.P[0]+G.u[0]*DK_LC,G.P[1]+G.u[1]*DK_LC];v=[-oms*p[1],oms*p[0]];}
    else fail(!okR?'HARD CONTACT: '+G.vc.toFixed(2)+' M/S':!okL?'MISALIGNED: '+Math.abs(G.y).toFixed(2)+' M OFF':!okA?'BAD ATTITUDE: '+Math.abs(G.ae).toFixed(1)+' DEG':'SPINNING AT CONTACT');}
   else if(G.d<-.5)fail('COLLIDED WITH STATION');}
  if(Math.hypot(p[0],p[1])>170)fail('DRIFTED OUT OF RANGE');else if(prop<=0&&G.vc<=0.005&&!endT){fail('RCS PROPELLANT EXHAUSTED');}};
 const earth=()=>X.cache('space1_dkearth',()=>{const c=A.c;X.sky(['#000006','#02051a']);X.stars(120,21,0,0,150,.8);
  const cx=160,cy=1020,R=860;X.disc(cx,cy,R+26,X.rg(cx,cy,R-4,cx,cy,R+26,['rgba(120,200,255,.9)','rgba(60,120,255,.35)','rgba(20,40,120,0)']));
  X.disc(cx,cy,R,X.rg(cx-200,cy-R,40,cx,cy,R,['#4aa8e8','#1a5aa8','#0a2050']));
  c.save();c.beginPath();c.arc(cx,cy,R,0,TAU);c.clip();const q=srng(9);for(let i=0;i<70;i++){const x=q()*W,y=160+q()*90;X.ell(x,y,8+q()*26,1.2+q()*3,'rgba(255,255,255,'+(.25+q()*.4).toFixed(2)+')');}
  for(let i=0;i<6;i++){const x=q()*W,y=175+q()*60;X.ell(x,y,14+q()*30,5+q()*8,'rgba(70,120,60,.45)');}c.restore();
  c.strokeStyle='rgba(180,230,255,.8)';c.lineWidth=1.2;c.beginPath();c.arc(cx,cy,R,Math.PI*1.3,Math.PI*1.7);c.stroke();});
 g.draw=()=>{const c=A.c,G=geo();earth();
  /* camera */
  const dist=Math.hypot(G.Q[0]-G.P[0],G.Q[1]-G.P[1]);const tz=cl(175/(dist+9),1.4,13);zoom+=(tz-zoom)*.06;const mx=(p[0]+G.P[0])/2,my=(p[1]+G.P[1])/2;cxm+=(mx-cxm)*.1;cym+=(my-cym)*.1;
  const sx=x=>160+(x-cxm)*zoom,sy=y=>124+(y-cym)*zoom;
  /* approach corridor */
  if(lo()){c.globalAlpha=.5;const L=30,ta=Math.tan(12*D2R);const a1=[G.P[0]+G.u[0]*L+G.w[0]*(L*ta+1),G.P[1]+G.u[1]*L+G.w[1]*(L*ta+1)],a2=[G.P[0]+G.u[0]*L-G.w[0]*(L*ta+1),G.P[1]+G.u[1]*L-G.w[1]*(L*ta+1)],b1=[G.P[0]+G.w[0],G.P[1]+G.w[1]],b2=[G.P[0]-G.w[0],G.P[1]-G.w[1]];
   X.poly([[sx(b1[0]),sy(b1[1])],[sx(a1[0]),sy(a1[1])],[sx(a2[0]),sy(a2[1])],[sx(b2[0]),sy(b2[1])]],cone?'rgba(255,90,60,.12)':'rgba(90,200,255,.08)');c.setLineDash&&c.setLineDash([2,3]);c.strokeStyle=cone?'rgba(255,120,90,.7)':'rgba(120,210,255,.45)';c.lineWidth=.7;c.beginPath();c.moveTo(sx(b1[0]),sy(b1[1]));c.lineTo(sx(a1[0]),sy(a1[1]));c.moveTo(sx(b2[0]),sy(b2[1]));c.lineTo(sx(a2[0]),sy(a2[1]));c.moveTo(sx(G.P[0]),sy(G.P[1]));c.lineTo(sx(G.P[0]+G.u[0]*60),sy(G.P[1]+G.u[1]*60));c.stroke();c.setLineDash&&c.setLineDash([]);c.globalAlpha=1;
   for(const d of[50,30,20,10,5]){const m=[G.P[0]+G.u[0]*d,G.P[1]+G.u[1]*d];const x=sx(m[0]),y=sy(m[1]);if(x>-10&&x<W+10&&y>20&&y<H){c.fillStyle='rgba(160,220,255,.6)';c.fillRect(x-.5,y-3,1,6);ft(d+' m',x,y-7,'rgba(170,220,255,.75)',5,'c');}}}
  /* station (station frame: port at x=-6, modules extend to +x) */
  c.save();c.translate(sx(0),sy(0));c.rotate(ph);c.scale(zoom,zoom);
  const mod=(x0,x1,r,col)=>{c.fillStyle=X.lg(0,-r,0,r,[X.lt(col,1.5),col,X.lt(col,.45)]);c.fillRect(x0,-r,x1-x0,2*r);c.fillStyle='rgba(0,0,0,.25)';for(let x=x0+1.5;x<x1;x+=3)c.fillRect(x,-r,.15,2*r);};
  c.fillStyle='#6a6e78';c.fillRect(14,-1.2,4,2.4);for(const sgn of[-1,1]){c.fillStyle='#8a8e98';c.fillRect(15.4,sgn*2,1.2,sgn*30);for(let i=0;i<2;i++){const yy=sgn>0?6+i*13:-6-i*13-11;c.fillStyle=X.lg(10,0,22,0,['#1a2a6a','#2a4aa8','#14205a']);c.fillRect(9,yy,14,11);c.strokeStyle='rgba(200,170,90,.7)';c.lineWidth=.12;for(let gx=9;gx<=23;gx+=2){c.beginPath();c.moveTo(gx,yy);c.lineTo(gx,yy+11);c.stroke();}for(let gy=yy;gy<=yy+11;gy+=2.2){c.beginPath();c.moveTo(9,gy);c.lineTo(23,gy);c.stroke();}}}
  mod(-4,6,2.2,'#d8d8d0');mod(6,14,2.6,'#c8ccd4');mod(14,26,2.4,'#e0e0d8');mod(26,34,2,'#b8bcc4');c.fillStyle='#c8c8c0';c.fillRect(1,-6,3,4);c.fillRect(1,2,3,4);
  c.fillStyle='#9aa0aa';c.fillRect(-6,-1.4,2,2.8);c.fillStyle='#e8e8e0';c.fillRect(-6.3,-1.6,.5,3.2);c.fillStyle='#f0f0f0';c.fillRect(-4.5,-3.6,.25,1.6);c.fillRect(-5.2,-2.95,1.6,.25);
  if(A.t%50<25){c.fillStyle='#ff4040';c.fillRect(-4.5,2.4,.5,.5);c.fillStyle='#40ff60';c.fillRect(-4.5,-2.9,.5,.5);}c.restore();
  /* RCS puffs */
  for(const j of jets){c.globalAlpha=j.t/8*.7;X.disc(sx(j.x),sy(j.y),Math.max(.8,zoom*.35*(1.5-j.t/8)),'#e8f4ff');}c.globalAlpha=1;
  /* capsule (body frame: nose +x) */
  c.save();c.translate(sx(p[0]),sy(p[1]));c.rotate(th);c.scale(zoom,zoom);
  c.fillStyle=X.lg(0,-2,0,2,['#f4f4f4','#c8c8cc','#7a7a84']);c.beginPath();c.moveTo(-1.8,-2);c.lineTo(1.2,-1.1);c.lineTo(1.2,1.1);c.lineTo(-1.8,2);c.closePath();c.fill();
  c.fillStyle='#2a2a30';c.fillRect(-2.2,-2,.5,4);c.fillStyle=X.lg(0,-2,0,2,['#e8e8ec','#a8a8b0','#5a5a64']);c.fillRect(-4.6,-1.9,2.4,3.8);c.fillStyle='rgba(20,30,60,.9)';c.fillRect(-4.4,-1.75,.6,3.5);
  c.fillStyle='#1a2a4a';c.fillRect(-.6,-1.2,.5,.5);c.fillRect(-.6,.7,.5,.5);c.fillStyle='#d0d0d4';c.fillRect(1.2,-.7,.9,1.4);c.fillStyle='#ffcf3f';c.fillRect(2.1,-.15,.3,.3);c.restore();
  /* alignment cue line */
  c.strokeStyle='rgba(255,220,120,.35)';c.lineWidth=.6;c.beginPath();c.moveTo(sx(G.Q[0]),sy(G.Q[1]));c.lineTo(sx(G.Q[0]+G.n[0]*8),sy(G.Q[1]+G.n[1]*8));c.stroke();
  /* velocity vector */
  const vv=Math.hypot(v[0],v[1]);if(vv>.01)arrow(sx(p[0]),sy(p[1]),sx(p[0])+v[0]/vv*cl(vv*60,4,30),sy(p[1])+v[1]/vv*cl(vv*60,4,30),'#7dff9a',1);
  fx.draw();
  hud('DOCK '+(li+1)+'/'+DK_LV.length,'SCORE '+g.score);for(let i=0;i<3;i++){c.globalAlpha=i<lives?1:.25;X.disc(98+i*8,9,2.5,'#9fe0ff');}c.globalAlpha=1;
  const tc=G.vc>.004?G.d/G.vc:Infinity,rec=lv[8]+Math.max(0,G.d)*.012;
  eq(4,20,[{t:'t = d / v',c:'#7fd0ff',b:1},'d = '+Math.max(0,G.d).toFixed(1)+' m   v = '+G.vc.toFixed(3)+' m/s',{t:'t = '+(isFinite(tc)?fmt(tc,0)+' s to contact':'NOT CLOSING'),c:isFinite(tc)?'#ffe08a':'#ff9a8a'},{t:'safe rate ≤ '+rec.toFixed(2)+' m/s',c:G.vc>rec?'#ff8a7a':'#9fe8b0'},'a = F/m = '+(DK_F/(DK_M+prop)).toFixed(3)+' m/s²']);
  const chk=(lab,val,lim,u)=>({t:lab+' '+val+u+' / '+lim+u+(Math.abs(parseFloat(val))<=lim?'  OK':'  !!'),c:Math.abs(parseFloat(val))<=lim?'#9fe8b0':'#ffb08a'});
  eq(W-4,20,[{t:'CONTACT LIMITS',c:'#7fd0ff',b:1},chk('RATE',G.vc.toFixed(2),lv[8],''),chk('LAT ',G.y.toFixed(2),lv[9],' m'),chk('ATT ',G.ae.toFixed(1),lv[10],'°'),{t:'ROLL RATE '+G.ar.toFixed(2)+' °/s',c:Math.abs(G.ar)<=.6?'#9fe8b0':'#ffb08a'},{t:'Δv LEFT '+(DK_ISP*G0*Math.log((DK_M+prop)/DK_M)).toFixed(1)+' m/s',c:prop/prop0<.25?'#ff9a8a':'#d8e4ff'}],{al:'r'});
  /* centreline camera inset */
  const ix=W-62,iy=150,iw=58,ih=48;X.rr(ix,iy,iw,ih,3,'rgba(2,6,16,.85)');X.rrs(ix+.5,iy+.5,iw-1,ih-1,3,'rgba(140,200,255,.4)',.6);c.save();c.beginPath();c.rect(ix+1,iy+1,iw-2,ih-2);c.clip();
  const sc=cl(60/(Math.max(0,G.d)+4),2,30),ox=ix+iw/2-G.y*sc,oy=iy+ih/2+Math.sin(G.ae*D2R)*40;c.strokeStyle='rgba(120,255,160,.85)';c.lineWidth=.7;c.beginPath();c.arc(ox,oy,Math.max(1.5,1.6*sc),0,TAU);c.stroke();c.beginPath();c.moveTo(ox-3*sc,oy);c.lineTo(ox+3*sc,oy);c.moveTo(ox,oy-3*sc);c.lineTo(ox,oy+3*sc);c.stroke();
  c.strokeStyle='rgba(255,220,120,.9)';c.beginPath();c.moveTo(ix+iw/2-6,iy+ih/2);c.lineTo(ix+iw/2+6,iy+ih/2);c.moveTo(ix+iw/2,iy+ih/2-6);c.lineTo(ix+iw/2,iy+ih/2+6);c.stroke();c.restore();ft('CL CAM',ix+3,iy+5,'#8ac8ff',4.6);
  if(cone)ft('OUT OF CORRIDOR '+Math.ceil((240-cone)/60)+'s',W/2,H-34,A.t%20<10?'#ff8070':'#ffd0c0',7,'c',1);
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,H/2-36,ok?'#7dff9a':endT?'#ff8a70':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= TRANSFER WINDOW ================= */
/* Two-body physics in screen units (μ=20 px³/frame²), converted to real km/s and days per level via the circular speed and period of the start orbit. */
const HO_MU=20;
// central: [name, μ (m³/s²), body radius km, style]  bodies: [name, orbit radius (km), style]
const HO_C=[['SUN',1.32712e20,696000,-1],['EARTH',3.986e14,6371,1],['JUPITER',1.26687e17,69911,3],['SATURN',3.7931e16,58232,7]];
const AU=1.496e8;
const HO_LV=[
 {n:'EARTH TO MARS',c:0,b:[['EARTH',1*AU,1],['MARS',1.524*AU,2]],m:1.6},
 {n:'DOWN TO VENUS',c:0,b:[['EARTH',1*AU,1],['VENUS',.723*AU,8]],m:1.6},
 {n:'CLIMB TO GEO',c:1,b:[['PARKING ORBIT',13000,0],['GEO SAT',42164,0]],m:1.45},
 {n:'IO TO GANYMEDE',c:2,b:[['IO',421700,5],['GANYMEDE',1070400,0]],m:1.4},
 {n:'MARS TO CERES',c:0,b:[['MARS',1.524*AU,2],['CERES',2.77*AU,0]],m:1.35},
 {n:'TITAN TO ENCELADUS',c:3,b:[['TITAN',1221870,3],['ENCELADUS',238020,8]],m:1.35},
 {n:'SUNWARD: MERCURY',c:0,b:[['EARTH',1*AU,1],['MERCURY',.387*AU,0]],m:1.3},
 {n:'EARTH-MARS-CERES',c:0,b:[['EARTH',1*AU,1],['MARS',1.524*AU,2],['CERES',2.77*AU,0]],m:1.3},
 {n:'JOVIAN RELAY',c:2,b:[['IO',421700,5],['EUROPA',671034,8],['GANYMEDE',1070400,0]],m:1.25},
 {n:'TIGHT BUDGET',c:0,b:[['EARTH',1*AU,1],['MARS',1.524*AU,2]],m:1.12},
 {n:'TO THE BELT',c:0,b:[['EARTH',1*AU,1],['VESTA',2.36*AU,0]],m:1.2},
 {n:'GRAND TOUR',c:0,b:[['VENUS',.723*AU,8],['EARTH',1*AU,1],['MARS',1.524*AU,2],['CERES',2.77*AU,0]],m:1.15}];
const hoElem=(x,y,vx,vy,mu)=>{const r=Math.hypot(x,y),v2=vx*vx+vy*vy,rv=x*vx+y*vy,h=x*vy-y*vx,ex=((v2-mu/r)*x-rv*vx)/mu,ey=((v2-mu/r)*y-rv*vy)/mu,e=Math.hypot(ex,ey),a=1/(2/r-v2/mu);
 const w=e>1e-7?Math.atan2(ey,ex):Math.atan2(y,x);let M0=0,n=0;if(e<1&&a>0){n=Math.sqrt(mu/(a*a*a));const E0=Math.atan2(rv/Math.sqrt(mu*a),1-r/a);M0=E0-e*Math.sin(E0);}return{a,e,w,M0,n,h,sg:h<0?-1:1};};
const hoPos=(o,t)=>{let M=o.M0+o.n*t,E=M;for(let i=0;i<8;i++)E-=(E-o.e*Math.sin(E)-M)/(1-o.e*Math.cos(E));const xp=o.a*(Math.cos(E)-o.e),yp=o.a*Math.sqrt(Math.max(0,1-o.e*o.e))*Math.sin(E)*o.sg,c=Math.cos(o.w),s=Math.sin(o.w);return[xp*c-yp*s,xp*s+yp*c];};
A.add({id:'hohmann',name:'TRANSFER WINDOW',cat:'PUZZLE',time:600,tags:'space orbital mechanics hohmann transfer delta-v phase angle kepler kerbal education puzzle',how:'WAIT FOR THE PHASE ANGLE. UP/A BURN PROGRADE, DOWN/B RETRO, HOLD RIGHT TO WARP.',make(){
 const g={over:null,score:0},fx=X.fx(),CX=196,CY=130;let li=0,lv,C,R,BA,BW,tgt,s,th2,w2,acc0=.004,fuel,dvUsed,need,lives=3,msg='',mt=0,endT=0,ok=0,simT=0,crossed=0,burn=0,kv=1,ktime=1,trail=[],pred=null,predT=0,warp=1,ideal=0,soi=0;
 const rpx=i=>R[i];
 const load=(i,keep)=>{li=i;lv=HO_LV[i];C=HO_C[lv.c];const rmax=Math.max(...lv.b.map(b=>b[1]));R=lv.b.map(b=>Math.max(16,90*b[1]/rmax));tgt=1;simT=0;crossed=0;trail=[];ok=0;endT=0;
  const r1=R[0],v1=Math.sqrt(HO_MU/r1);kv=Math.sqrt(C[1]/(lv.b[0][1]*1e3))/1e3/v1;ktime=(TAU*Math.sqrt(Math.pow(lv.b[0][1]*1e3,3)/C[1]))/(TAU*Math.sqrt(r1*r1*r1/HO_MU));
  s={x:r1,y:0,vx:0,vy:-v1};BW=R.map(r=>-Math.sqrt(HO_MU/(r*r*r)));BA=R.map((r,j)=>j?rnd(TAU):0);ideal=0;for(let j=1;j<lv.b.length;j++){const d=hoDv(R[j-1],R[j]);ideal+=d[0]+d[1];}fuel=ideal*lv.m;dvUsed=0;setTarget();msg=lv.n;mt=110;};
 const hoDv=(r1,r2)=>{const v1=Math.sqrt(HO_MU/r1),v2=Math.sqrt(HO_MU/r2),at=(r1+r2)/2;return[Math.abs(v1*(Math.sqrt(2*r2/(r1+r2))-1)),Math.abs(v2*(1-Math.sqrt(2*r1/(r1+r2)))),Math.PI*Math.sqrt(at*at*at/HO_MU)];};
 const phNeed=(r1,r2)=>{const v=180*(1-Math.pow((r1+r2)/(2*r2),1.5));return((v%360)+540)%360-180;};
 /* angles shrink in the direction of motion, so phase φ = (ship angle − target angle) */
 const setTarget=()=>{const r1=R[tgt-1],r2=R[tgt];w2=BW[tgt];need=phNeed(r1,r2);const sa=Math.atan2(s.y,s.x),sgn=Math.sign(w2-BW[tgt-1])||1;th2=sa-(need+sgn*(55+rnd(35)))*D2R;BA[tgt]=th2;soi=0;const d=hoDv(r1,r2),T1=TAU*Math.sqrt(r1*r1*r1/HO_MU);acc0=Math.max(d[0],d[1])/Math.max(3,Math.min(16,T1*.045));};
 load(0);
 g.dbg=()=>({msg,s,th2,need,R,tgt,pn:phaseNow(),pred,soi,ok,lives,li,fuel,dvUsed,ideal,endT});
 const phaseNow=()=>{const sa=Math.atan2(s.y,s.x),ta=th2;let d=-(ta-sa)/D2R;d=((d%360)+540)%360-180;return d;};
 const fail=why=>{S('boom');A.shake=6;lives--;msg=why;mt=110;endT=110;ok=0;if(lives<=0)g.over='MISSION LOST - '+g.score+' PTS';};
 g.update=()=>{if(mt)mt--;if(endT>0){if(--endT===0&&!g.over){if(ok){if(li>=HO_LV.length-1){g.over='ALL TRANSFERS COMPLETE';return;}load(li+1);}else load(li);}return;}
  const k=A.in(0),pro=(k.u||k.a)?1:0,ret=(k.d||k.b)?1:0,th=fuel>0?pro-ret:0;warp=k.l?.2:th?1:k.r?8:1;burn=th;
  const steps=Math.max(1,Math.round(warp*4)),dt=warp/steps;
  for(let i=0;i<steps;i++){const r=Math.hypot(s.x,s.y),a=-HO_MU/(r*r*r);if(th){const v=Math.hypot(s.vx,s.vy)||1,acc=acc0*th;s.vx+=s.vx/v*acc*dt;s.vy+=s.vy/v*acc*dt;fuel=Math.max(0,fuel-acc0*dt);dvUsed+=acc0*dt;}
   s.vx+=a*s.x*dt*.5;s.vy+=a*s.y*dt*.5;s.x+=s.vx*dt;s.y+=s.vy*dt;const r2=Math.hypot(s.x,s.y),a2=-HO_MU/(r2*r2*r2);s.vx+=a2*s.x*dt*.5;s.vy+=a2*s.y*dt*.5;for(let j=0;j<BA.length;j++)BA[j]+=BW[j]*dt;th2=BA[tgt];simT+=dt;}
  if(A.t%3===0){trail.push([s.x,s.y]);if(trail.length>140)trail.shift();}
  const r=Math.hypot(s.x,s.y),R0=R[tgt-1],R2=R[tgt];if(!crossed&&((R2>R0&&r>=R2-1)||(R2<R0&&r<=R2+1))){crossed=1;g.score+=20;fx.pop(CX+s.x,CY+s.y-8,'ORBIT REACHED','#7fd0ff');A.burst(CX+s.x,CY+s.y,'#7fd0ff',6,1);S('coin');}
  const tx=Math.cos(th2)*R2,ty=Math.sin(th2)*R2,dd=Math.hypot(s.x-tx,s.y-ty),SO=7+R2*.04;
  if(dd<SO){soi=1;const v2=Math.sqrt(HO_MU/R2),tvx=v2*Math.sin(th2),tvy=-v2*Math.cos(th2);const rv=Math.hypot(s.vx-tvx,s.vy-tvy);
   if(rv<v2*.09){ok=1;const eff=Math.min(1,ideal/Math.max(1e-6,dvUsed));const pts=Math.round(300+900*eff*eff);g.score+=pts;A.burst(CX+tx,CY+ty,K.y,26,2.4);fx.ring(CX+tx,CY+ty,'#7dff9a',30,22);S('win');
    if(tgt<lv.b.length-1){tgt++;msg='CAPTURED AT '+lv.b[tgt-1][0]+' +'+pts;mt=90;s.x=tx;s.y=ty;s.vx=tvx;s.vy=tvy;crossed=0;setTarget();ok=0;}
    else{msg='CAPTURED! EFFICIENCY '+Math.round(eff*100)+'%';mt=120;endT=120;}}}
  else if(soi){soi=0;msg='FLYBY - TOO FAST';mt=60;S('blip');}
  if(r<(C[3]<0?8:Math.max(5,R[0]*C[2]/lv.b[0][1]))+.5)fail('BURNED UP / CRASHED');else if(r>150)fail('ESCAPED THE SYSTEM');else if(simT>60*60*4)fail('MISSION CLOCK EXPIRED');
  predT--;if(predT<=0||th){predT=6;const o=hoElem(s.x,s.y,s.vx,s.vy,HO_MU);if(o.e<.98&&o.a>0){const P=TAU/o.n,pts=[];for(let i=0;i<=72;i++){const E=i/72*TAU,xp=o.a*(Math.cos(E)-o.e),yp=o.a*Math.sqrt(1-o.e*o.e)*Math.sin(E)*o.sg,c=Math.cos(o.w),si=Math.sin(o.w);pts.push([xp*c-yp*si,xp*si+yp*c]);}
    let best=1e9,bt=0;const span=Math.min(P*1.02,6000);for(let i=1;i<=90;i++){const t=i/90*span,q=hoPos(o,t),a2=th2+w2*t,d=Math.hypot(q[0]-Math.cos(a2)*R2,q[1]-Math.sin(a2)*R2);if(d<best){best=d;bt=t;}}
    pred={pts,ap:o.a*(1+o.e),pe:o.a*(1-o.e),w:o.w,best,bt,o};}else pred=null;}};
 g.draw=()=>{const c=A.c;nebula('ho'+lv.c,[['#03040e','#070a1c','#3a2a80','#1a3a7a','#7a2a6a'],['#020810','#04101e','#1a4a8a','#1a6a8a','#2a2a6a'],['#0a0608','#140c10','#8a4a2a','#5a3a7a','#2a4a7a'],['#08060c','#100c18','#7a6a3a','#4a3a7a','#2a5a6a']][lv.c],20+lv.c);pstars(0,0,30);
  /* orbits */
  c.lineWidth=.6;R.forEach((r,i)=>{c.strokeStyle=i===tgt?'rgba(255,220,120,.4)':'rgba(150,180,255,.18)';c.beginPath();c.arc(CX,CY,r,0,TAU);c.stroke();});
  /* central body */
  if(C[3]<0)sun(CX,CY,7);else{const rr=Math.max(5,R[0]*C[2]/lv.b[0][1]);planet(CX,CY,rr,Object.assign({},STY[C[3]],{lx:-.8,ly:-.3}));}
  /* phase arcs */
  const sa=Math.atan2(s.y,s.x),pn=phaseNow();if(!ok&&lo()){c.lineWidth=1.2;c.strokeStyle='rgba(125,255,154,.75)';c.beginPath();const a0=sa,a1=sa-need*D2R;c.arc(CX,CY,19,Math.min(a0,a1),Math.max(a0,a1));c.stroke();
   c.strokeStyle='rgba(255,207,63,.85)';c.beginPath();const b1=sa-pn*D2R;c.arc(CX,CY,23,Math.min(a0,b1),Math.max(a0,b1));c.stroke();c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=.5;c.beginPath();c.moveTo(CX,CY);c.lineTo(CX+Math.cos(sa)*R[tgt],CY+Math.sin(sa)*R[tgt]);c.moveTo(CX,CY);c.lineTo(CX+Math.cos(th2)*R[tgt],CY+Math.sin(th2)*R[tgt]);c.stroke();}
  /* bodies on their orbits */
  lv.b.forEach((b,j)=>{if(j===tgt)return;const a=BA[j];planet(CX+Math.cos(a)*R[j],CY+Math.sin(a)*R[j],2.6,Object.assign({},STY[b[2]],{lx:-Math.cos(a),ly:-Math.sin(a)}));if(lo())ft(b[0],CX+Math.cos(a)*R[j],CY+Math.sin(a)*R[j]-7,'rgba(200,215,255,.55)',4.4,'c');});
  const tx=CX+Math.cos(th2)*R[tgt],ty=CY+Math.sin(th2)*R[tgt],bs=lv.b[tgt][2];if(lo()){c.strokeStyle='rgba(255,220,120,.35)';c.setLineDash&&c.setLineDash([2,2]);c.lineWidth=.6;c.beginPath();c.arc(tx,ty,7+R[tgt]*.04,0,TAU);c.stroke();c.setLineDash&&c.setLineDash([]);}
  const lx=-Math.cos(th2),ly=-Math.sin(th2);planet(tx,ty,lv.c===0&&bs===3?5:3.6,Object.assign({},STY[bs],{lx,ly}));ft(lv.b[tgt][0],tx,ty-10,'#ffe8a8',5,'c');
  /* predicted orbit + closest approach */
  if(pred){c.strokeStyle='rgba(120,210,255,.65)';c.lineWidth=.7;c.setLineDash&&c.setLineDash([3,2]);c.beginPath();pred.pts.forEach((p,i)=>i?c.lineTo(CX+p[0],CY+p[1]):c.moveTo(CX+p[0],CY+p[1]));c.stroke();c.setLineDash&&c.setLineDash([]);
   const apx=CX+Math.cos(pred.w+Math.PI)*pred.ap,apy=CY+Math.sin(pred.w+Math.PI)*pred.ap;X.disc(apx,apy,1.5,'#7fd0ff');ft('AP',apx+3,apy-3,'#9fd8ff',4.6);
   if(pred.best<30&&lo()){const q=hoPos(pred.o,pred.bt),a2=th2+w2*pred.bt;c.globalAlpha=.6;X.disc(CX+q[0],CY+q[1],2,'#ffffff');planet(CX+Math.cos(a2)*R[tgt],CY+Math.sin(a2)*R[tgt],2.4,STY[bs]);c.globalAlpha=1;c.strokeStyle='rgba(255,255,255,.4)';c.beginPath();c.moveTo(CX+q[0],CY+q[1]);c.lineTo(CX+Math.cos(a2)*R[tgt],CY+Math.sin(a2)*R[tgt]);c.stroke();}}
  /* trail + ship */
  c.lineWidth=.8;trail.forEach((p,i)=>{if(i){c.strokeStyle='rgba(255,255,255,'+(i/trail.length*.5).toFixed(2)+')';c.beginPath();c.moveTo(CX+trail[i-1][0],CY+trail[i-1][1]);c.lineTo(CX+p[0],CY+p[1]);c.stroke();}});
  const shx=CX+s.x,shy=CY+s.y,va=Math.atan2(s.vy,s.vx);if(burn)flame(shx-Math.cos(va)*burn*3,shy-Math.sin(va)*burn*3,va+(burn>0?Math.PI:0),7,1.6);
  c.save();c.translate(shx,shy);c.rotate(va);X.poly([[4,0],[-3,-2.4],[-1.6,0],[-3,2.4]],'#e8f0ff');c.restore();if(lo())X.glow(shx,shy,5,'#9fe0ff',.4);
  fx.draw();
  hud('LEG '+(li+1)+'/'+HO_LV.length,'SCORE '+g.score);for(let i=0;i<3;i++){c.globalAlpha=i<lives?1:.25;X.disc(110+i*8,9,2.5,'#ffcf3f');}c.globalAlpha=1;
  const r1=R[tgt-1]!==undefined?Math.hypot(s.x,s.y):R[0],r2=R[tgt],d=hoDv(R[tgt-1],r2),v1=Math.sqrt(HO_MU/R[tgt-1]),v2=Math.sqrt(HO_MU/r2),tH=d[2]*ktime/86400;const kvl=kv,lc=lv.c===0?'d':'h',tf=lv.c===0?tH:tH*24;
  eq(3,20,[{t:'HOHMANN TRANSFER',c:'#7fd0ff',b:1},'v₁ = √(μ/r₁) = '+(v1*kvl).toFixed(2)+' km/s',{t:'Δv₁ = v₁(√(2r₂/(r₁+r₂)) − 1)',z:5.4},{t:'    = '+(d[0]*kvl).toFixed(2)+' km/s',c:'#ffe08a'},{t:'Δv₂ = v₂(1 − √(2r₁/(r₁+r₂)))',z:5.4},{t:'    = '+(d[1]*kvl).toFixed(2)+' km/s',c:'#ffe08a'},'t = π√(a³/μ) = '+fmt(tf,tf<10?1:0)+' '+lc],{w:108});
  const ok2=Math.abs(pn-need)<4;
  eq(3,95,[{t:'PHASE ANGLE',c:'#7fd0ff',b:1},{t:'φ = 180°(1 − ((r₁+r₂)/2r₂)^1.5)',z:5.2},{t:'need '+need.toFixed(1)+'°',c:'#7dff9a'},{t:'now  '+pn.toFixed(1)+'°'+(ok2?'  BURN!':''),c:ok2?'#7dff9a':'#ffcf3f'}],{w:108});
  eq(3,148,[{t:'Δv used '+(dvUsed*kvl).toFixed(2)+' km/s',c:'#d8e4ff'},{t:'Δv left '+(fuel*kvl).toFixed(2)+' km/s',c:fuel<ideal*.3?'#ff9a8a':'#d8e4ff'},'T+ '+fmt(simT*ktime/86400*(lv.c===0?1:24),0)+(lv.c===0?' d':' h')+(warp>1?'   WARP x8':warp<1?'   SLOW':''),pred?{t:'closest '+fmt(pred.best/R[0]*lv.b[0][1]*(lv.c===0?1/AU:1),lv.c===0?3:0)+(lv.c===0?' AU':' km'),c:pred.best<8?'#7dff9a':'#c8d6ff'}:{t:'ESCAPE PATH',c:'#ff9a8a'}],{w:108});
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,44,ok?'#7dff9a':endT?'#ff8a70':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= LANDER PRO ================= */
/* 1 px = 1 m at zoom 1. 1 frame = 1/40 s. dry 2,000 kg, 16 kN engine, Isp 311 s (Apollo-class descent engine) */
const LP_DT=1/40,LP_DRY=2000,LP_T=16000,LP_ISP=311,LP_WW=960;
// name, g, fuel kg, sky top, sky bottom, ground, ground dark, start [x, alt, vx, vy], hazard, sky body style, sun scale
const LP_B=[
 {n:'MOON',g:1.62,f:420,s1:'#000000',s2:'#05060c',gc:'#9a9a98',gd:'#3a3a3c',st:[120,460,14,-12],hz:'',sky:1,seed:3},
 {n:'CERES',g:.28,f:150,s1:'#000000',s2:'#06060a',gc:'#6a665e',gd:'#2a2824',st:[90,380,24,-4],hz:'',sky:-1,seed:8},
 {n:'MARS',g:3.71,f:540,s1:'#3a1e18',s2:'#c0806a',gc:'#b8603a',gd:'#5a2a1a',st:[140,520,-10,-30],hz:'wind',sky:-2,seed:5},
 {n:'EUROPA',g:1.31,f:360,s1:'#000004',s2:'#0a0c18',gc:'#c8d0d8',gd:'#6a7080',st:[100,420,10,-14],hz:'ridges',sky:3,seed:11},
 {n:'TITAN',g:1.35,f:300,s1:'#4a3010',s2:'#c88a3a',gc:'#7a5a3a',gd:'#3a2a1a',st:[160,460,6,-20],hz:'drag',sky:7,seed:13},
 {n:'IO',g:1.80,f:440,s1:'#000000',s2:'#0a0806',gc:'#d8c050',gd:'#7a5a1a',st:[110,470,12,-16],hz:'plume',sky:3,seed:17},
 {n:'MERCURY',g:3.70,f:560,s1:'#000000',s2:'#08060a',gc:'#8a8078',gd:'#3a3430',st:[60,520,42,-18],hz:'',sky:-3,seed:19},
 {n:'TRITON',g:.78,f:240,s1:'#000004',s2:'#0a0a16',gc:'#d8c8c0',gd:'#7a6a70',st:[120,400,16,-10],hz:'geyser',sky:4,seed:23}];
const lpTerrain=b=>{const q=srng(b.seed),N=LP_WW/8+1,h=[];for(let i=0;i<N;i++)h.push(0);let amp=b.hz==='ridges'?90:70;
 const md=(a,z,am)=>{if(z-a<2)return;const m=(a+z)>>1;h[m]=(h[a]+h[z])/2+(q()-.5)*am;md(a,m,am*.55);md(m,z,am*.55);};h[0]=40+q()*40;h[N-1]=40+q()*40;md(0,N-1,amp*2);
 const lo_=Math.min(...h);for(let i=0;i<N;i++)h[i]=h[i]-lo_+12;
 if(b.hz==='ridges')for(let i=3;i<N;i+=9)h[i]+=40+q()*30;
 const pads=[];const spots=[[.25,5,2],[.55,3,3],[.85,2,5]];for(const[f,w,mul]of spots){const i0=Math.round(f*(N-1)-w/2+(q()-.5)*6);const lvl=h.slice(i0,i0+w+1).reduce((a,v)=>a+v,0)/(w+1);for(let i=i0;i<=i0+w;i++)h[i]=lvl;pads.push({x0:i0*8,x1:(i0+w)*8,y:lvl,mul});}
 const deco=[];for(let i=0;i<40;i++)deco.push([q()*LP_WW,q(),q()]);const vents=[];if(b.hz==='plume'||b.hz==='geyser')for(let i=0;i<4;i++){let x;do{x=60+q()*(LP_WW-120);}while(pads.some(p=>x>p.x0-30&&x<p.x1+30));vents.push({x,ph:q()*600,per:b.hz==='plume'?420:300});}
 return{h,pads,deco,vents};};
A.add({id:'landerpro',name:'LANDER PRO',cat:'ACTION',time:480,tags:'space lander moon mars titan suicide burn rocket physics tsiolkovsky education apollo',how:'LEFT/RIGHT TILT, UP FULL THRUST, DOWN HOVER. BURN WHEN ALTITUDE = V²/2A. LAND ON A PAD.',make(){
 const g={over:null,score:0},fx=X.fx();let bi=0,B,TR,l,lives=3,msg='',mt=0,endT=0,ok=0,cam={x:0,y:0,s:.4},dust=[],heat=0,prof=0,thr=0,wind=0,bestPad=null;
 const gy=x=>{const i=cl(x/8,0,TR.h.length-1.001),i0=Math.floor(i),f=i-i0;return TR.h[i0]*(1-f)+TR.h[i0+1]*f;};
 const load=i=>{bi=i;B=LP_B[i];TR=lpTerrain(B);const s=B.st;l={x:s[0],y:gy(s[0])+s[1],vx:s[2],vy:s[3],a:0,fuel:B.f};endT=0;ok=0;heat=0;dust=[];msg=B.n+'  g = '+B.g+' M/S2';mt=120;cam={x:l.x,y:l.y,s:.35};};
 load(0);
 const crash=why=>{S('boom');A.shake=10;fx.flash('#ffa060',10);const p=scr(l.x,l.y);fx.debris(p[0],p[1],'#d8c070',14,2.5);fx.spark(p[0],p[1],'#ffb040',20,3);A.burst(p[0],p[1],'#ff8040',20,2.5);lives--;msg=why;mt=110;endT=110;ok=0;if(lives<=0)g.over='ALL LANDERS LOST - '+g.score+' PTS';};
 const scr=(x,y)=>[160+(x-cam.x)*cam.s,140-(y-cam.y)*cam.s];
 g.update=()=>{if(mt)mt--;if(endT>0){if(--endT===0&&!g.over){if(ok){if(bi>=LP_B.length-1){g.over='ALL 8 WORLDS LANDED - TOUR COMPLETE';return;}load(bi+1);}else load(bi);}return;}
  const k=A.in(0),m=LP_DRY+l.fuel,hov=m*B.g/LP_T;
  l.a=cl(l.a+ax(k)*2.4*D2R*60*LP_DT,-Math.PI/2,Math.PI/2);
  thr=l.fuel>0?(k.u?1:k.d?Math.min(1,hov*.85):0):0;
  const F=thr*LP_T,ac=F/m;l.vx+=Math.sin(l.a)*ac*LP_DT;l.vy+=(Math.cos(l.a)*ac-B.g)*LP_DT;l.fuel=Math.max(0,l.fuel-F/(LP_ISP*G0)*LP_DT);
  if(B.hz==='wind'){wind=Math.sin(A.t*.011)*.5+Math.sin(A.t*.037)*.35;l.vx+=wind*LP_DT;}
  if(B.hz==='drag'){const v=Math.hypot(l.vx,l.vy),kd=.0055;l.vx-=kd*l.vx*v*LP_DT;l.vy-=kd*l.vy*v*LP_DT;wind=Math.sin(A.t*.009)*.3;l.vx+=wind*LP_DT;}
  for(const v of TR.vents){const ph=(A.t+v.ph)%v.per,on=ph<150;v.on=on;if(on&&Math.abs(l.x-v.x)<14){const top=gy(v.x)+(B.hz==='plume'?180:110)*Math.min(1,ph/40);if(l.y<top){l.vy+=(B.hz==='plume'?6:3)*LP_DT;l.vx+=(l.x-v.x)*.05*LP_DT;heat+=B.hz==='plume'?1.4:.5;}}}
  heat=Math.max(0,heat-.15);if(heat>100){crash('MELTED BY A VOLCANIC PLUME');return;}
  l.x+=l.vx*LP_DT;l.y+=l.vy*LP_DT;if(l.x<10){l.x=10;l.vx=Math.abs(l.vx)*.3;}if(l.x>LP_WW-10){l.x=LP_WW-10;l.vx=-Math.abs(l.vx)*.3;}if(l.y>gy(l.x)+1100){l.y=gy(l.x)+1100;l.vy=Math.min(0,l.vy);}
  const alt=l.y-Math.max(gy(l.x-4),gy(l.x+4))-1;
  /* glide-profile points: descending no faster than the safe stopping curve */
  const amax=LP_T/m-B.g,vs=amax>0?Math.sqrt(2*amax*Math.max(0,alt))*.8+1.5:2;prof=l.vy<-.5&&-l.vy<=vs&&alt<320;if(prof&&A.t%30===0){g.score+=2;}
  if(thr>0&&alt<40&&lo()&&A.t%2===0)for(let i=0;i<2;i++)dust.push({x:l.x+(rnd(2)-1)*6,y:gy(l.x),vx:(rnd(2)-1)*(30-alt*.6),vy:rnd(4),t:30});
  dust.forEach(d=>{d.x+=d.vx*LP_DT;d.y+=d.vy*LP_DT;d.t--;});dust=dust.filter(d=>d.t>0);if(dust.length>120)dust.splice(0,dust.length-120);
  /* touchdown: feet at ±5 m, 0 m below body origin */
  const fl=[l.x-Math.cos(l.a)*5,l.y+Math.sin(l.a)*5],fr=[l.x+Math.cos(l.a)*5,l.y-Math.sin(l.a)*5];
  if(fl[1]<=gy(fl[0])||fr[1]<=gy(fr[0])||l.y<gy(l.x)+.5){const pad=TR.pads.find(p=>l.x-4>=p.x0&&l.x+4<=p.x1),vv=-l.vy,hv=Math.abs(l.vx),tilt=Math.abs(l.a)/D2R,slope=Math.abs(gy(l.x+5)-gy(l.x-5))/10;
   if(vv<=2.5&&hv<=1.5&&tilt<=10&&(pad||slope<.12)){ok=1;const mul=pad?pad.mul:1,pts=Math.round((150+l.fuel*.6+(2.5-vv)*40)*mul*(pad?1:.4));g.score+=pts;const p=scr(l.x,l.y);A.burst(p[0],p[1]-6,K.y,24,2);fx.ring(p[0],p[1],'#7dff9a',30,20);S('win');msg=(pad?'THE EAGLE HAS LANDED x'+mul:'OFF-PAD LANDING')+' +'+pts;mt=130;endT=130;l.vx=l.vy=0;l.a=0;l.y=gy(l.x);}
   else crash(vv>2.5?'IMPACT AT '+vv.toFixed(1)+' M/S':hv>1.5?'SKIDDED AT '+hv.toFixed(1)+' M/S':tilt>10?'TIPPED OVER':'TOO STEEP TO LAND');}};
 g.draw=()=>{const c=A.c,alt=l.y-gy(l.x);const ts=cl(150/(Math.max(0,alt)+34),.24,1.5);cam.s+=(ts-cam.s)*.08;cam.x+=(cl(l.x,160/cam.s,LP_WW-160/cam.s)-cam.x)*.15;cam.y+=((l.y+gy(l.x))/2-cam.y)*.15;if(!(cam.x>-1e5))cam.x=l.x;
  X.cache('space1_lp'+bi,()=>{X.sky([B.s1,B.s2]);if(B.s1==='#000000'||B.s1==='#000004')X.stars(140,bi+31,0,0,H,.9);
   if(B.sky===1)planet(250,46,16,Object.assign({},STY[1],{lx:-1,ly:.1}));else if(B.sky===3)planet(240,60,30,Object.assign({},STY[3],{lx:-.9,ly:-.2}));else if(B.sky===7)planet(70,50,20,Object.assign({},STY[7],{lx:.8,ly:-.3}));else if(B.sky===4)planet(250,44,22,Object.assign({},STY[4],{lx:-.8,ly:-.3}));
   if(B.sky===-1)sun(60,40,3);if(B.sky===-2)sun(250,36,4,'#fff0d0');if(B.sky===-3)sun(250,52,13);
});
  for(let j=0;j<2;j++){const col=X.lt(B.gd,1+j*.25);c.globalAlpha=.5+j*.25;X.hills(150+j*26+cam.s*20,40-j*12,col,cam.x*(.08+j*.08)+bi*90,.012+j*.01,bi*3+j);}c.globalAlpha=1;
  if(B.hz==='drag'&&lo()){c.fillStyle='rgba(200,140,60,.18)';c.fillRect(0,0,W,H);}
  /* terrain */
  const xs=Math.max(0,Math.floor((cam.x-160/cam.s)/8)-1),xe=Math.min(TR.h.length-1,Math.ceil((cam.x+160/cam.s)/8)+1);c.beginPath();let p0=scr(xs*8,TR.h[xs]);c.moveTo(p0[0],H+5);for(let i=xs;i<=xe;i++){const p=scr(i*8,TR.h[i]);c.lineTo(p[0],p[1]);}const pe=scr(xe*8,TR.h[xe]);c.lineTo(pe[0],H+5);c.closePath();
  const gt=scr(0,Math.max(...TR.h))[1];c.fillStyle=X.lg(0,gt,0,H,[B.gc,B.gd,X.lt(B.gd,.5)]);c.fill();
  c.strokeStyle=X.lt(B.gc,1.4);c.lineWidth=1;c.beginPath();for(let i=xs;i<=xe;i++){const p=scr(i*8,TR.h[i]);i===xs?c.moveTo(p[0],p[1]):c.lineTo(p[0],p[1]);}c.stroke();
  if(lo())for(const d of TR.deco){const x=d[0],p=scr(x,gy(x)-4-d[1]*30);if(p[0]<-10||p[0]>W+10)continue;X.ell(p[0],p[1],(2+d[2]*5)*cam.s,(1+d[2]*1.6)*cam.s,'rgba(0,0,0,.22)');}
  for(const pd of TR.pads){const a=scr(pd.x0,pd.y),b=scr(pd.x1,pd.y);if(b[0]<-20||a[0]>W+20)continue;c.fillStyle='#e8e8e0';c.fillRect(a[0],a[1]-1.5,b[0]-a[0],2.5);c.fillStyle='#ffcf3f';for(let x=a[0];x<b[0];x+=6)c.fillRect(x,a[1]-1.5,3,1);
   const blink=A.t%40<20;X.disc(a[0],a[1]-2.5,1.4,blink?'#ff4040':'#602020');X.disc(b[0],b[1]-2.5,1.4,blink?'#40ff60':'#206030');if(lo())X.glow((a[0]+b[0])/2,a[1]-2,12,'#ffd070',.18);ft('x'+pd.mul,(a[0]+b[0])/2,a[1]-8,'#ffe08a',6,'c',1);}
  /* vents */
  for(const v of TR.vents){const p=scr(v.x,gy(v.x));if(p[0]<-30||p[0]>W+30)continue;X.ell(p[0],p[1],5*cam.s+1,2*cam.s+.5,'#2a1a10');if(v.on&&lo()){const ph=(A.t+v.ph)%v.per,hgt=(B.hz==='plume'?180:110)*Math.min(1,ph/40)*cam.s,fade=ph>120?(150-ph)/30:1;
    c.globalAlpha=.55*fade;c.fillStyle=X.lg(0,p[1],0,p[1]-hgt,B.hz==='plume'?['rgba(255,160,40,.9)','rgba(220,200,80,.5)','rgba(120,100,60,0)']:['rgba(230,240,255,.9)','rgba(180,200,230,.4)','rgba(150,160,190,0)']);c.beginPath();c.moveTo(p[0]-2,p[1]);c.lineTo(p[0]-14*cam.s-3,p[1]-hgt);c.lineTo(p[0]+14*cam.s+3,p[1]-hgt);c.lineTo(p[0]+2,p[1]);c.fill();c.globalAlpha=1;}}
  c.fillStyle=X.lt(B.gc,1.2);for(const d of dust){const p=scr(d.x,d.y);c.globalAlpha=d.t/30*.7;c.fillRect(p[0],p[1],1.5,1.5);}c.globalAlpha=1;
  /* lander */
  if(!(endT&&!ok)){const p=scr(l.x,l.y),s=Math.max(.85,cam.s*1.25);c.save();c.translate(p[0],p[1]);c.rotate(l.a);c.scale(s,s);
   if(thr>0)flame(0,-1.5,Math.PI/2,6+thr*12*(.9+Math.random()*.2),2.1);
   c.strokeStyle='#c8c8c8';c.lineWidth=.6;c.beginPath();c.moveTo(-2.5,-3);c.lineTo(-5,0);c.moveTo(2.5,-3);c.lineTo(5,0);c.stroke();c.fillStyle='#d8d8d8';c.fillRect(-6,-.6,2.2,.6);c.fillRect(3.8,-.6,2.2,.6);
   c.fillStyle='#5a5a60';c.beginPath();c.moveTo(-1.2,-2.2);c.lineTo(1.2,-2.2);c.lineTo(1.8,-.6);c.lineTo(-1.8,-.6);c.fill();
   c.fillStyle=X.lg(-3.5,0,3.5,0,['#ffe08a','#d8a030','#8a5a10']);c.fillRect(-3.5,-5.5,7,3.3);c.fillStyle='rgba(0,0,0,.2)';c.fillRect(-3.5,-3.1,7,.6);
   c.fillStyle=X.lg(-3,0,3,0,['#e8e8ec','#a8a8b0','#5a5a64']);c.beginPath();c.moveTo(-3,-5.5);c.lineTo(-2.4,-9);c.lineTo(2.4,-9);c.lineTo(3,-5.5);c.fill();c.fillStyle='#1a2a4a';c.fillRect(-1.4,-8.2,1.2,1.2);c.fillStyle='#9fd8ff';c.fillRect(-1.2,-8,.4,.4);c.fillStyle='#ccc';c.fillRect(1.2,-10.5,.3,1.5);c.restore();}
  if(cam.s<.6&&!endT){const p=scr(l.x,l.y);c.strokeStyle='rgba(255,220,120,.6)';c.lineWidth=.7;c.beginPath();c.arc(p[0],p[1]-5,10,0,TAU);c.stroke();}
  fx.draw();
  /* HUD */
  hud(B.n+' '+(bi+1)+'/8','SCORE '+g.score);for(let i=0;i<3;i++){c.globalAlpha=i<lives?1:.25;X.disc(120+i*8,9,2.5,'#ffcf3f');}c.globalAlpha=1;
  const m=LP_DRY+l.fuel,amax=LP_T/m-B.g,v=-l.vy,ds=amax>0?v*v/(2*amax):Infinity,altd=Math.max(0,alt),burnNow=v>2&&altd<=ds*1.12+4;
  eq(3,20,[{t:'d = v² / 2a',c:'#7fd0ff',b:1},'v = '+v.toFixed(1)+' m/s ↓   g = '+B.g+' m/s²','a = T/m − g = '+(amax>0?amax.toFixed(2):'< 0 !')+' m/s²',{t:'stop d = '+(isFinite(ds)?fmt(ds,0):'∞')+' m   alt '+fmt(altd,0)+' m',c:burnNow?'#ff8a70':'#ffe08a'},{t:burnNow?'>> BURN NOW <<':prof?'ON GLIDE PROFILE':'',c:burnNow?(A.t%16<8?'#ff7060':'#ffd0c0'):'#7dff9a',b:1}],{w:132});
  const dv=LP_ISP*G0*Math.log(m/LP_DRY);eq(W-3,20,[{t:'Δv = Isp·g₀·ln(m₀/m₁)',c:'#7fd0ff',b:1},'= '+fmt(dv,0)+' m/s   fuel '+fmt(l.fuel,0)+' kg','TWR = T/(m·g) = '+(LP_T/(m*B.g)).toFixed(2),'hover = m·g/T = '+Math.round(Math.min(1,m*B.g/LP_T)*100)+'%','vx '+l.vx.toFixed(1)+' m/s   tilt '+(l.a/D2R).toFixed(0)+'°'+(B.hz==='wind'||B.hz==='drag'?'  wind '+wind.toFixed(1):'')],{al:'r',w:118});
  /* suicide burn gauge */
  const gx=W-16,gy0=96,gh=88;X.rr(gx,gy0,10,gh,3,'rgba(5,9,26,.8)');const sc=v=>gy0+gh-cl(v/400,0,1)*gh;c.fillStyle='rgba(125,255,154,.5)';c.fillRect(gx+2,sc(altd),6,gy0+gh-sc(altd));if(isFinite(ds)){c.fillStyle=burnNow?'#ff6050':'#ffcf3f';c.fillRect(gx,sc(ds)-.6,10,1.2);}ft('ALT',gx+5,gy0-4,'#8ac8ff',4.6,'c');ft('d',gx-3,sc(isFinite(ds)?ds:0),burnNow?'#ff8070':'#ffcf3f',5,'r');
  if(heat>5){X.meter(W/2-30,H-34,60,6,heat/100,'#ff6030');ft('PLUME HEAT',W/2,H-39,'#ffb080',5,'c');}
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,72,ok?'#7dff9a':endT?'#ff8a70':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= ORBIT DESIGNER ================= */
/* Planet TALOS: R = 3,400 km, μ = 4.28×10¹³ m³/s², day 8.69 h (so the synchronous orbit sits at 3R). 1 frame = 30 s. */
const OB_R=3.4e6,OB_MU=4.28e13,OB_DAY=TAU*Math.sqrt(Math.pow(3*OB_R,3)/OB_MU),OB_DT=30,OB_PX=30,OB_EL=8*D2R;
const OB_CITY=[['HALE',0],['DRAKE',52],['VEGA',118],['TYCHO',176],['LOWELL',214],['SAGAN',268],['KEPLER',318]];
// stage: name, pairs [[a,b]...], uptime target, window days
const OB_ST=[['FIRST LINK',[[0,1]],.6,1.5],['ACROSS THE SEA',[[2,3]],.6,1.5],['TRIANGLE',[[0,2],[2,5]],.7,2],['ANTIPODES',[[0,3]],.7,2],['RELAY RING',[[1,4],[3,6],[5,0]],.75,2],['ALWAYS ON',[[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],.85,2.5]];
const obT=a=>TAU*Math.sqrt(Math.pow(a*OB_R/OB_PX,3)/OB_MU);
A.add({id:'orbitbuilder',name:'ORBIT DESIGNER',cat:'SIM',time:600,tags:'space satellite constellation orbit kepler third law coverage communications geostationary education sim',how:'UP/DOWN SET ORBIT HEIGHT, LEFT/RIGHT SLOT, A LAUNCHES, B SCRAPS. KEEP THE CITIES LINKED.',make(){
 const g={over:null,score:0},fx=X.fx(),CX=112,CY=126;let sats=[],cr=260,earned=0,rad=46,slot=0,st=0,stT=0,up=[],tot=0,strikes=0,msg='',mt=0,simT=0,links=[],rot=0,paths=[],flash=0;
 const cost=a=>Math.round(30+70*Math.pow(a/OB_PX-1,1.3));
 const startStage=i=>{st=i;stT=0;up=OB_ST[i][1].map(()=>0);tot=0;msg='CONTRACT '+(i+1)+': '+OB_ST[i][0];mt=120;};startStage(0);
 const cityA=i=>OB_CITY[i][1]*D2R+rot;
 const visible=(ca,s)=>{const d=Math.abs(((s.th-ca)%TAU+TAU+Math.PI)%TAU-Math.PI);const beta=Math.acos(Math.min(1,OB_PX*Math.cos(OB_EL)/s.a))-OB_EL;return d<=beta;};
 const los=(a,b)=>{const ax_=Math.cos(a.th)*a.a,ay_=Math.sin(a.th)*a.a,bx=Math.cos(b.th)*b.a,by=Math.sin(b.th)*b.a,dx=bx-ax_,dy=by-ay_,L=dx*dx+dy*dy||1;const t=cl(-(ax_*dx+ay_*dy)/L,0,1);return Math.hypot(ax_+dx*t,ay_+dy*t)>OB_PX*1.04;};
 const net=()=>{const n=OB_CITY.length,N=n+sats.length,adj=[...Array(N)].map(()=>[]);links=[];
  for(let i=0;i<n;i++){const ca=cityA(i);sats.forEach((s,j)=>{if(visible(ca,s)){adj[i].push(n+j);adj[n+j].push(i);links.push([0,i,j]);}});}
  for(let i=0;i<sats.length;i++)for(let j=i+1;j<sats.length;j++)if(los(sats[i],sats[j])){adj[n+i].push(n+j);adj[n+j].push(n+i);links.push([1,i,j]);}
  return(a,b)=>{const pv=Array(N).fill(-1);pv[a]=a;const q=[a];while(q.length){const u=q.shift();if(u===b)break;for(const v of adj[u])if(pv[v]<0){pv[v]=u;q.push(v);}}if(pv[b]<0)return null;const p=[b];let u=b;while(u!==a){u=pv[u];p.push(u);}return p;};};
 g.update=()=>{if(mt)mt--;if(flash)flash--;const k=A.in(0),h=A.hit(0);simT++;rot=-(simT*OB_DT/OB_DAY)*TAU;
  rad=cl(rad+ay(k)*-.45,OB_PX+2,104);slot=(slot+ax(k)*.035+TAU)%TAU;
  if(h.a){const c0=cost(rad);if(cr>=c0&&sats.length<14){cr-=c0;sats.push({a:rad,th:slot,w:-TAU/(obT(rad)/OB_DT)});S('jump');A.burst(CX+Math.cos(slot)*rad,CY+Math.sin(slot)*rad,'#9fe0ff',10,1.4);fx.ring(CX,CY,'#9fd8ff',OB_PX+6,14);}else{msg=sats.length>=14?'TRACKING NETWORK FULL':'NOT ENOUGH CREDITS';mt=50;S('blip');}}
  if(h.b&&sats.length){const s=sats.pop();cr+=Math.round(cost(s.a)*.4);fx.spark(CX+Math.cos(s.th)*s.a,CY+Math.sin(s.th)*s.a,'#ff9a60',10,1.5);S('hit');}
  for(const s of sats){s.th+=s.w;if(s.a<OB_PX*1.12)s.a-=.0016;}
  for(let i=sats.length-1;i>=0;i--)if(sats[i].a<=OB_PX+.6){const s=sats[i];A.burst(CX+Math.cos(s.th)*s.a,CY+Math.sin(s.th)*s.a,'#ff8040',14,1.6);msg='SATELLITE RE-ENTERED (DRAG)';mt=70;sats.splice(i,1);S('boom');}
  const path=net(),n=OB_CITY.length;paths=[];stT++;tot++;let pay=0;
  OB_ST[st][1].forEach((pr,i)=>{const p=path(pr[0],pr[1]);paths.push(p);if(p){up[i]++;pay+=1;}});
  if(pay&&A.t%10===0){const inc=pay*2;cr+=inc;earned+=inc;g.score=earned;if(A.t%60===0){const p=paths.find(Boolean);if(p){const ca=cityA(OB_CITY.length>p[0]?p[0]:0);A.burst(CX+Math.cos(ca)*(OB_PX+2),CY+Math.sin(ca)*(OB_PX+2),'#7dff9a',3,.6);}}}
  const win=OB_ST[st][3]*OB_DAY/OB_DT;if(stT>=win){const ups=up.map(u=>u/tot),okk=ups.every(u=>u>=OB_ST[st][2]);
   if(okk){const b=150*(st+1);cr+=b;earned+=b;g.score=earned;A.burst(CX,CY-40,K.y,26,2.2);S('win');flash=20;if(st>=OB_ST.length-1){g.over='NETWORK COMPLETE - ALL CONTRACTS MET';return;}startStage(st+1);msg='CONTRACT MET! +'+b;mt=110;}
   else{strikes++;S('lose');A.shake=5;if(strikes>=3){g.over='LICENSE REVOKED - 3 FAILED CONTRACTS';return;}msg='CONTRACT FAILED ('+strikes+'/3) - RETRY';mt=110;startStage(st);msg='CONTRACT FAILED ('+strikes+'/3) - RETRY';}}};
 g.draw=()=>{const c=A.c;nebula('ob',['#03040c','#070a18','#2a3a8a','#5a2a7a','#1a6a7a'],41);pstars(A.t*.05,0,26);
  /* sun light from the left */
  if(lo())X.glow(-30,CY,120,'#fff0c0',.12);
  /* orbits & coverage of cursor */
  c.lineWidth=.5;for(const s of sats){c.strokeStyle='rgba(140,180,255,.16)';c.beginPath();c.arc(CX,CY,s.a,0,TAU);c.stroke();}
  const beta=Math.acos(Math.min(1,OB_PX*Math.cos(OB_EL)/rad))-OB_EL,curx=CX+Math.cos(slot)*rad,cury=CY+Math.sin(slot)*rad;
  if(lo()){c.fillStyle='rgba(255,207,63,.08)';c.beginPath();c.moveTo(curx,cury);c.arc(CX,CY,OB_PX,slot-beta,slot+beta);c.closePath();c.fill();}
  c.setLineDash&&c.setLineDash([2,3]);c.strokeStyle='rgba(255,207,63,.55)';c.lineWidth=.7;c.beginPath();c.arc(CX,CY,rad,0,TAU);c.stroke();c.setLineDash&&c.setLineDash([]);
  if(Math.abs(rad-3*OB_PX)<1.2){c.strokeStyle='rgba(125,255,154,.6)';c.beginPath();c.arc(CX,CY,rad,0,TAU);c.stroke();}
  /* planet */
  const R=OB_PX;planet(CX,CY,R,{c:'#3a78c8',atm:'#8fd0ff',lx:-1,ly:0});
  c.save();c.beginPath();c.arc(CX,CY,R,0,TAU);c.clip();const q=srng(77);for(let i=0;i<9;i++){const a=q()*TAU+rot,d=q()*R*.85,s=4+q()*8;X.ell(CX+Math.cos(a)*d,CY+Math.sin(a)*d,s,s*.7,'rgba(80,150,70,.75)',a);}
  for(let i=0;i<10;i++){const a=q()*TAU+rot*1.08,d=q()*R*.9;X.ell(CX+Math.cos(a)*d,CY+Math.sin(a)*d,5+q()*7,1.4,'rgba(255,255,255,.35)',a+1.5);}
  c.restore();X.disc(CX,CY,R+.3,X.rg(CX-R,CY,R*.55,CX-R,CY,R*2.15,['rgba(0,0,10,0)','rgba(0,0,10,.86)']));if(lo())X.glow(CX,CY,8,'#ffffff',.08);
  /* links */
  for(const L of links){const s=sats[L[2]];if(!s)continue;const sx=CX+Math.cos(s.th)*s.a,sy=CY+Math.sin(s.th)*s.a;if(L[0]===0){const ca=cityA(L[1]);c.strokeStyle='rgba(125,255,154,.28)';c.lineWidth=.5;c.beginPath();c.moveTo(CX+Math.cos(ca)*R,CY+Math.sin(ca)*R);c.lineTo(sx,sy);c.stroke();}else{const s2=sats[L[1]];c.strokeStyle='rgba(120,210,255,.22)';c.lineWidth=.5;c.beginPath();c.moveTo(CX+Math.cos(s2.th)*s2.a,CY+Math.sin(s2.th)*s2.a);c.lineTo(sx,sy);c.stroke();}}
  const pos=id=>{const n=OB_CITY.length;if(id<n){const a=cityA(id);return[CX+Math.cos(a)*R,CY+Math.sin(a)*R];}const s=sats[id-n];return s?[CX+Math.cos(s.th)*s.a,CY+Math.sin(s.th)*s.a]:[CX,CY];};
  paths.forEach(p=>{if(!p)return;c.strokeStyle='rgba(255,215,90,.85)';c.lineWidth=1.1;c.beginPath();p.forEach((id,i)=>{const q2=pos(id);i?c.lineTo(q2[0],q2[1]):c.moveTo(q2[0],q2[1]);});c.stroke();const f=(A.t*.03)%1,seg=Math.floor(f*(p.length-1)),u=f*(p.length-1)-seg,a=pos(p[seg]),b=pos(p[Math.min(p.length-1,seg+1)]);X.glow(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,4,'#ffe080',.8);});
  /* cities */
  const need=new Set();OB_ST[st][1].forEach(p=>{need.add(p[0]);need.add(p[1]);});
  OB_CITY.forEach((cy_,i)=>{const a=cityA(i),x=CX+Math.cos(a)*R,y=CY+Math.sin(a)*R,night=Math.cos(a)>0.05;if(night&&lo())X.glow(x,y,5,'#ffd070',.5);X.disc(x,y,need.has(i)?2:1.3,need.has(i)?'#ffcf3f':'#c8d0e0');if(need.has(i)){const lx=CX+Math.cos(a)*(R+9),ly=CY+Math.sin(a)*(R+9);ft(cy_[0],lx,ly,'#ffe8b0',4.6,'c');}});
  /* satellites */
  for(const s of sats){const x=CX+Math.cos(s.th)*s.a,y=CY+Math.sin(s.th)*s.a;c.fillStyle='#4a6ac8';c.fillRect(x-4,y-.8,2.6,1.6);c.fillRect(x+1.4,y-.8,2.6,1.6);X.disc(x,y,1.5,s.a<OB_PX*1.12?'#ffb080':'#e8eef8');}
  X.disc(curx,cury,2.2,'rgba(255,207,63,.9)');c.strokeStyle='#ffcf3f';c.lineWidth=.6;c.beginPath();c.arc(curx,cury,4.5,0,TAU);c.stroke();
  fx.draw();
  hud('CONTRACT '+(st+1)+'/'+OB_ST.length,'$'+fmt(cr)+'K');
  /* Kepler panel */
  const T=obT(rad),aKm=rad*OB_R/OB_PX/1e3,v=Math.sqrt(OB_MU/(rad*OB_R/OB_PX))/1e3;
  eq(W-3,20,[{t:"KEPLER'S THIRD LAW",c:'#7fd0ff',b:1},{t:'T² = (4π²/μ)·a³',c:'#7fd0ff'},'a = '+fmt(aKm)+' km',{t:'T = '+(T/3600).toFixed(2)+' h   day '+(OB_DAY/3600).toFixed(2)+' h',c:Math.abs(T-OB_DAY)<OB_DAY*.02?'#7dff9a':'#ffe08a'},'v = √(μ/a) = '+v.toFixed(2)+' km/s','cover β = acos(R/a) − ε = '+Math.round(beta/D2R)+'°',{t:'cost $'+cost(rad)+'K'+(rad<OB_PX*1.12?'  (drag decay)':''),c:cr>=cost(rad)?'#d8e4ff':'#ff9a8a'}],{al:'r'});
  /* contract + uptime */
  const ST=OB_ST[st],win=ST[3]*OB_DAY/OB_DT;let y=118;X.panel(W-115,y,112,18+ST[1].length*9);ft(ST[0]+'  '+Math.round(ST[2]*100)+'% UP',W-111,y+6,'#ffcf3f',5,'l',1);ft(((win-stT)*OB_DT/3600).toFixed(1)+' h left',W-7,y+6,'#a8b8e0',4.6,'r');
  ST[1].forEach((pr,i)=>{const u=tot?up[i]/tot:0,yy=y+14+i*9;ft(OB_CITY[pr[0]][0].slice(0,6)+'-'+OB_CITY[pr[1]][0].slice(0,6),W-111,yy,paths[i]?'#7dff9a':'#c8d0e0',4.6);X.meter(W-52,yy-2.5,44,5,u,u>=ST[2]?'#3dff8b':'#ffcf3f');c.fillStyle='#ffffff';c.fillRect(W-52+44*ST[2],yy-3.5,.6,7);});
  /* coverage strip (planet longitude) */
  const sx0=W-115,sy0=Math.max(150,y+22+ST[1].length*9),sw=112,sh=14;X.rr(sx0,sy0,sw,sh+10,3,'rgba(5,9,26,.82)');ft('COVERAGE BY LONGITUDE',sx0+4,sy0+5,'#8ac8ff',4.4);
  for(let i=0;i<56;i++){const lon=i/56*TAU,ca=lon+rot;let n=0;for(const s of sats)if(visible(ca,s))n++;c.fillStyle=n?(n>1?'rgba(61,255,139,.85)':'rgba(61,255,139,.45)'):'rgba(255,80,60,.35)';c.fillRect(sx0+2+i*2,sy0+10,2,sh-2);}
  OB_CITY.forEach((cy_,i)=>{const x=sx0+2+OB_CITY[i][1]/360*112;c.fillStyle=need.has(i)?'#ffcf3f':'#ffffff';c.fillRect(x-.4,sy0+8,.8,sh+1);});
  if(flash){c.globalAlpha=flash/20*.3;c.fillStyle='#7dff9a';c.fillRect(0,0,W,H);c.globalAlpha=1;}
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,186,/MET|COMPLETE/.test(msg)?'#7dff9a':/FAIL|RE-ENTER|NOT|FULL/.test(msg)?'#ff8a70':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= SOLAR SAIL ================= */
/* 1 AU = 60 px, 1 frame ≈ 1 day (μ=20 px³/frame² → Earth year 653 frames, so 1 frame = 0.56 d). Sail 100 m × 100 m, 130 kg → lightness β ≈ 0.12 */
const SS_MU=20,SS_AU=60,SS_BETA=.12,SS_P0=4.56e-6,SS_A=1e4,SS_M=130;
const SS_WP=[['VENUS',43,8],['MERCURY',27,0],['EARTH',60,1],['MARS',91,2],['APOPHIS',55,0],['VESTA',112,0],['VENUS',43,8],['COMET ENCKE',100,4],['MERCURY',27,0],['CERES',124,0]];
A.add({id:'solarsail',name:'SOLAR SAIL',cat:'ACTION',time:420,tags:'space solar sail radiation pressure light orbit spiral ikaros physics education',how:'LEFT/RIGHT TILT THE SAIL, UP/DOWN SNAP TO 35°, A FEATHERS. RIDE SUNLIGHT TO EACH TARGET.',make(){
 const g={over:null,score:0},fx=X.fx(),CX=150,CY=130;let s,th=35.26*D2R,feather=0,wi=0,tgt,hp=3,msg='',mt=0,flare=null,flareT=500,motes=[],pred=[],warp=1,trail=[],done=0,dead=0;
 const mk=(r,ph)=>({r,a:ph,w:-Math.sqrt(SS_MU/(r*r*r))});
 const nextT=()=>{const w=SS_WP[wi%SS_WP.length];tgt=Object.assign(mk(w[1],rnd(TAU)),{n:w[0],st:w[2]});const sa=Math.atan2(s.y,s.x);if(Math.abs(((tgt.a-sa)%TAU+TAU)%TAU-Math.PI)>2.6)tgt.a+=Math.PI;msg='TARGET: '+w[0];mt=90;};
 s={x:SS_AU,y:0,vx:0,vy:-Math.sqrt(SS_MU/SS_AU)};nextT();
 for(let i=0;i<26;i++)motes.push(mk(25+rnd(100),rnd(TAU)));
 const planets=[[23,8],[43,8],[60,1],[91,2]].map(p=>Object.assign(mk(p[0],rnd(TAU)),{st:p[1]}));
 const sailAcc=(x,y,vx,vy,ang,f)=>{const r=Math.hypot(x,y),ux=x/r,uy=y/r;if(f)return[0,0];const tx=-uy,ty=ux;/* prograde is clockwise motion: tangent toward velocity */const sg=Math.sign(tx*vx+ty*vy)||1;const nx=ux*Math.cos(ang)+tx*sg*Math.sin(ang),ny=uy*Math.cos(ang)+ty*sg*Math.sin(ang),c2=Math.cos(ang)*Math.cos(ang),a=SS_BETA*SS_MU/(r*r)*c2*(hp/3*.6+.4);return[nx*a,ny*a];};
 const stepS=(q,ang,f,dt)=>{const r=Math.hypot(q.x,q.y),gA=-SS_MU/(r*r*r),sa=sailAcc(q.x,q.y,q.vx,q.vy,ang,f);q.vx+=(gA*q.x+sa[0])*dt;q.vy+=(gA*q.y+sa[1])*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;};
 g.update=()=>{if(mt)mt--;if(dead){if(--dead===0)g.over=done>=SS_WP.length?'GRAND TOUR COMPLETE':'SAIL LOST - '+wi+' TARGETS';return;}
  const k=A.in(0),h=A.hit(0);th=cl(th+ax(k)*1.4*D2R,-89*D2R,89*D2R);if(h.u)th=35.26*D2R;if(h.d)th=-35.26*D2R;feather=k.a?1:0;warp=k.b?3:1;
  for(let w=0;w<warp;w++){for(let i=0;i<2;i++)stepS(s,th,feather,.5);for(const m of motes)m.a+=m.w;for(const p of planets)p.a+=p.w;tgt.a+=tgt.w;
   if(flare){flare.r+=1.6;const r=Math.hypot(s.x,s.y);if(!flare.hit&&flare.r>=r){flare.hit=1;if(!(feather||Math.abs(th)>=1.2)){hp--;S('boom');A.shake=6;fx.flash('#ffd0a0',10);fx.spark(CX+s.x,CY+s.y,'#ffb060',16,2.2);msg=hp>0?'SAIL TORN BY FLARE ('+hp+'/3)':'SAIL SHREDDED';mt=90;if(hp<=0){dead=60;return;}}else{g.score+=30;fx.pop(CX+s.x,CY+s.y-10,'FEATHERED +30','#7dff9a');S('coin');}}if(flare.r>200)flare=null;}
   if(--flareT<=0){flare={r:8,hit:0,warn:0};flareT=520+ri(380)-Math.min(250,wi*25);}}
  if(!flare&&flareT<150&&A.t%30===0)S('blip');
  if(A.t%3===0){trail.push([s.x,s.y]);if(trail.length>120)trail.shift();}
  const r=Math.hypot(s.x,s.y);if(r<14){msg='SAIL MELTED NEAR THE SUN';mt=99;S('boom');A.shake=10;fx.flash('#ffffff',14);dead=70;return;}if(r>150){msg='LOST TO DEEP SPACE';mt=99;S('lose');dead=70;return;}
  for(const m of motes){const mx=Math.cos(m.a)*m.r,my=Math.sin(m.a)*m.r;if(Math.hypot(mx-s.x,my-s.y)<6){g.score+=5;A.burst(CX+mx,CY+my,'#9ff0ff',5,.9);S('blip');m.r=25+rnd(100);m.a=rnd(TAU);m.w=-Math.sqrt(SS_MU/(m.r*m.r*m.r));}}
  const tx=Math.cos(tgt.a)*tgt.r,ty=Math.sin(tgt.a)*tgt.r;if(Math.hypot(tx-s.x,ty-s.y)<10){const pts=300+wi*50;g.score+=pts;A.burst(CX+tx,CY+ty,K.y,26,2.4);fx.ring(CX+tx,CY+ty,'#ffe080',30,20);S('win');wi++;done++;if(done>=SS_WP.length){msg='ALL TARGETS REACHED';mt=99;dead=80;return;}nextT();msg='RENDEZVOUS +'+pts+' / NEXT: '+tgt.n;mt=110;}
  if(A.t%4===0){const q={x:s.x,y:s.y,vx:s.vx,vy:s.vy};pred=[];for(let i=0;i<150;i++){stepS(q,th,feather,1);if(i%3===0)pred.push([q.x,q.y]);if(Math.hypot(q.x,q.y)<10)break;}}};
 g.draw=()=>{const c=A.c;nebula('ss',['#06030a','#0c0614','#7a3a2a','#5a2a7a','#2a3a8a'],53);pstars(0,0,30);
  /* sun with flares */
  sun(CX,CY,8,'#ffb040');if(lo()){for(let i=0;i<5;i++){const a=A.t*.004+i*1.3;c.strokeStyle='rgba(255,160,60,.45)';c.lineWidth=1.4;c.beginPath();c.arc(CX+Math.cos(a)*9,CY+Math.sin(a)*9,3+Math.sin(A.t*.03+i)*1.2,a+Math.PI,a+TAU);c.stroke();}}
  if(flare){c.strokeStyle='rgba(255,200,120,'+Math.max(.1,.8-flare.r/220).toFixed(2)+')';c.lineWidth=3;c.beginPath();c.arc(CX,CY,flare.r,0,TAU);c.stroke();c.lineWidth=1;c.strokeStyle='rgba(255,255,255,.4)';c.beginPath();c.arc(CX,CY,flare.r-2,0,TAU);c.stroke();}
  /* orbits */
  c.lineWidth=.5;for(const p of planets){c.strokeStyle='rgba(160,180,255,.12)';c.beginPath();c.arc(CX,CY,p.r,0,TAU);c.stroke();planet(CX+Math.cos(p.a)*p.r,CY+Math.sin(p.a)*p.r,2.4,Object.assign({},STY[p.st],{lx:-Math.cos(p.a),ly:-Math.sin(p.a)}));}
  for(const m of motes){const x=CX+Math.cos(m.a)*m.r,y=CY+Math.sin(m.a)*m.r;c.fillStyle='rgba(160,240,255,.8)';c.fillRect(x-.6,y-.6,1.2,1.2);}
  const tx=CX+Math.cos(tgt.a)*tgt.r,ty=CY+Math.sin(tgt.a)*tgt.r;c.strokeStyle='rgba(255,220,120,.3)';c.beginPath();c.arc(CX,CY,tgt.r,0,TAU);c.stroke();if(lo())X.glow(tx,ty,10,'#ffd070',.35);
  planet(tx,ty,3.6,Object.assign({},STY[tgt.st],{lx:-Math.cos(tgt.a),ly:-Math.sin(tgt.a)}));c.strokeStyle='#ffcf3f';c.lineWidth=.8;c.beginPath();c.arc(tx,ty,8,A.t*.05,A.t*.05+4.5);c.stroke();ft(tgt.n,tx,ty-12,'#ffe8b0',5,'c');
  /* prediction + trail */
  c.fillStyle='rgba(180,230,255,.6)';pred.forEach((p,i)=>{c.globalAlpha=1-i/pred.length;c.fillRect(CX+p[0]-.5,CY+p[1]-.5,1,1);});c.globalAlpha=1;
  c.lineWidth=.8;for(let i=1;i<trail.length;i++){c.strokeStyle='rgba(255,230,200,'+(i/trail.length*.45).toFixed(2)+')';c.beginPath();c.moveTo(CX+trail[i-1][0],CY+trail[i-1][1]);c.lineTo(CX+trail[i][0],CY+trail[i][1]);c.stroke();}
  /* the sail */
  if(!dead||hp>0){const x=CX+s.x,y=CY+s.y,r=Math.hypot(s.x,s.y),ux=s.x/r,uy=s.y/r,tx2=-uy,ty2=ux,sg=Math.sign(tx2*s.vx+ty2*s.vy)||1,ang=feather?Math.PI/2:th;const nx=ux*Math.cos(ang)+tx2*sg*Math.sin(ang),ny=uy*Math.cos(ang)+ty2*sg*Math.sin(ang),px=-ny,py=nx,L=9;
   c.strokeStyle='rgba(255,240,200,.25)';c.lineWidth=.6;c.beginPath();c.moveTo(CX+ux*9,CY+uy*9);c.lineTo(x,y);c.stroke();
   if(lo())X.glow(x,y,8,'#fff0d0',feather?.15:.45*Math.cos(ang)*Math.cos(ang)+.1);
   c.lineCap='round';c.strokeStyle=X.lg(x-px*L,y-py*L,x+px*L,y+py*L,['#9aa8c8','#ffffff','#c8d0f0','#ffffff','#8a98b8']);c.lineWidth=2.2;c.beginPath();c.moveTo(x-px*L,y-py*L);c.lineTo(x+px*L,y+py*L);c.stroke();c.lineCap='butt';
   if(hp<3){c.strokeStyle='rgba(20,10,30,.9)';c.lineWidth=2.4;c.beginPath();c.moveTo(x+px*(L-3*(3-hp)),y+py*(L-3*(3-hp)));c.lineTo(x+px*L,y+py*L);c.stroke();}
   c.strokeStyle='rgba(200,210,240,.6)';c.lineWidth=.4;c.beginPath();c.moveTo(x-px*L,y-py*L);c.lineTo(x-nx*3,y-ny*3);c.lineTo(x+px*L,y+py*L);c.stroke();X.disc(x-nx*3,y-ny*3,1.2,'#ffcf3f');
   if(!feather){const fa=SS_BETA*Math.cos(ang)*Math.cos(ang);arrow(x,y,x+nx*(6+fa*80),y+ny*(6+fa*80),'#ffb060',1);}}
  fx.draw();
  hud('TARGET '+(done+1)+'/'+SS_WP.length,'SCORE '+g.score);for(let i=0;i<3;i++){c.globalAlpha=i<hp?1:.25;X.rr(112+i*9,5,7,7,1.5,'#e8ecff');}c.globalAlpha=1;
  const r=Math.hypot(s.x,s.y),rAU=r/SS_AU,ang=feather?90:th/D2R,c2=Math.cos(ang*D2R)**2,F=2*SS_P0*SS_A*c2/(rAU*rAU)*(hp/3*.6+.4);
  eq(3,20,[{t:'F = 2·P₀·A·cos²θ / r²',c:'#7fd0ff',b:1},'P₀ = 4.56 µN/m² at 1 AU','A = 10,000 m²   m = 130 kg','θ = '+ang.toFixed(1)+'°   cos²θ = '+c2.toFixed(2),{t:'r = '+rAU.toFixed(2)+' AU  →  F = '+(F*1e3).toFixed(1)+' mN',c:'#ffe08a'},'a = F/m = '+(F/SS_M*1e3).toFixed(3)+' mm/s²'],{w:122});
  const tdx=Math.cos(tgt.a)*tgt.r-s.x,tdy=Math.sin(tgt.a)*tgt.r-s.y;
  eq(W-3,20,[{t:'SPIRAL GUIDE',c:'#7fd0ff',b:1},'max push along orbit at','θ = 35.3° (cos²θ·sinθ)',{t:'+θ spirals OUT, −θ IN',c:'#ffe08a'},'target '+(tgt.r/SS_AU).toFixed(2)+' AU  you '+rAU.toFixed(2),'gap '+(Math.hypot(tdx,tdy)/SS_AU).toFixed(2)+' AU'],{al:'r'});
  if(!flare&&flareT<150){ft('SOLAR FLARE IN '+Math.ceil(flareT/60)+' - HOLD A TO FEATHER',W/2,H-30,A.t%20<10?'#ffb060':'#ffe0c0',6.5,'c',1);}
  if(flare&&!flare.hit)ft('FLARE INBOUND - FEATHER (A)!',W/2,H-30,A.t%14<7?'#ff7050':'#ffd0c0',6.5,'c',1);
  if(warp>1)ft('TIME x3',W-6,H-30,'#9fd8ff',6,'r',1);
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,96,/TORN|MELT|LOST|SHRED/.test(msg)?'#ff8a70':/RENDEZ|ALL/.test(msg)?'#7dff9a':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= DEFLECT ================= */
/* heliocentric: 1 AU = 64 px, 1 frame = 1 day (μ chosen so Earth's year is 365 frames). 1 px/day = 27.05 km/s */
const DF_RE=64,DF_MU=4*Math.PI*Math.PI*DF_RE*DF_RE*DF_RE/(365.25*365.25),DF_KMS=1.496e8/DF_RE/86400,DF_REK=6371,DF_VESC=11.19,DF_MI=1500,DF_BETA=3.6;
const DF_NM=['2031 QX','APEP','1999 KW','TORO','2041 BN','NEREUS','KALI-7','2029 AZ','SEKHMET','2044 RT','IRIS-B','DORADO','2050 FF','HEKA'];
A.add({id:'asteroiddefense',name:'ASTEROID DEFLECT',cat:'ACTION',time:420,tags:'space asteroid deflection planetary defense dart kinetic impactor momentum physics education',how:'LEFT/RIGHT AIM, UP/DOWN LAUNCH SPEED, A FIRES AN IMPACTOR, B FOCUS. PUSH EARLY: DX = DV·T.',make(){
 const g={over:null,score:0},fx=X.fx(),CX=118,CY=124;let day=0,eA=0,rocks=[],imps=[],stock=5,cd=0,aim=0,spd=6,foc=0,hits=0,spawned=0,resolved=0,nextSpawn=0,msg='',mt=0,pred=null,last=null,end=0;
 const earth=t=>{const a=eA+TAU*t/365.25;return{x:Math.cos(a)*DF_RE,y:Math.sin(a)*DF_RE,vx:-Math.sin(a)*DF_RE*TAU/365.25,vy:Math.cos(a)*DF_RE*TAU/365.25};};
 const step=(q,dt)=>{for(let i=0;i<2;i++){const h=dt/2,r=Math.hypot(q.x,q.y),a=-DF_MU/(r*r*r);q.vx+=a*q.x*h*.5;q.vy+=a*q.y*h*.5;q.x+=q.vx*h;q.y+=q.vy*h;const r2=Math.hypot(q.x,q.y),a2=-DF_MU/(r2*r2*r2);q.vx+=a2*q.x*h*.5;q.vy+=a2*q.y*h*.5;}};
 const spawn=()=>{const lead=Math.max(200,430-spawned*20),D=Math.min(85,28+spawned*5+ri(10));for(let tries=0;tries<30;tries++){const E=earth(day+lead),ve=Math.hypot(E.vx,E.vy),k=.2+rnd(.16),al=(70+rnd(220))*D2R,vx=E.vx+(E.vx*Math.cos(al)-E.vy*Math.sin(al))*k,vy=E.vy+(E.vx*Math.sin(al)+E.vy*Math.cos(al))*k;
  const q={x:E.x,y:E.y,vx,vy};let ok=1;for(let t=0;t<lead;t++){step(q,-1);const r=Math.hypot(q.x,q.y);if(r<26||r>190){ok=0;break;}}if(!ok&&tries<29)continue;
  const vinf=Math.hypot(vx-E.vx,vy-E.vy)*DF_KMS,Rf=DF_REK*Math.sqrt(1+DF_VESC*DF_VESC/(vinf*vinf));
  rocks.push({x:q.x,y:q.y,vx:q.vx,vy:q.vy,T:lead,T0:lead,D,M:Math.PI/6*D*D*D*2600,b:(rnd(1.2)-.6)*Rf,Rf,vinf,ux:(vx-E.vx)/Math.hypot(vx-E.vx,vy-E.vy),uy:(vy-E.vy)/Math.hypot(vx-E.vx,vy-E.vy),n:DF_NM[spawned%DF_NM.length],safe:0,off:0,rot:rnd(6),seed:ri(999)});spawned++;msg='NEW THREAT: '+rocks[rocks.length-1].n+' IMPACT IN '+lead+' D';mt=100;S('lose');return;}};
 spawn();nextSpawn=150;
 g.update=()=>{if(mt)mt--;if(end){if(--end===0)g.over=g._o;return;}const k=A.in(0),h=A.hit(0);day++;if(cd)cd--;
  aim=(aim+ax(k)*2.2*D2R+TAU)%TAU;spd=cl(spd-ay(k)*.06,3,9);if(h.b&&rocks.length){foc=(foc+1)%rocks.length;S('blip');}foc=Math.min(foc,Math.max(0,rocks.length-1));
  if(day%45===0&&stock<6)stock++;
  const E=earth(day);
  if(h.a||(k.a&&A.t%6===0)){if(stock>0&&!cd){stock--;cd=6;const v=spd/DF_KMS;imps.push({x:E.x+Math.cos(aim)*2.5,y:E.y+Math.sin(aim)*2.5,vx:E.vx+Math.cos(aim)*v,vy:E.vy+Math.sin(aim)*v,t:0,tr:[]});S('shoot');fx.spark(CX+E.x,CY+E.y,'#ffd080',8,1.5);}else if(h.a&&!stock){msg='NO IMPACTORS - NEXT IN '+(45-day%45)+' D';mt=50;}}
  for(const r of rocks){step(r,1);r.T--;r.rot+=.05;if(r.safe)r.off=Math.min(1,r.off+.02);}
  for(let i=imps.length-1;i>=0;i--){const m=imps[i];step(m,1);m.t++;if(m.t%3===0){m.tr.push([m.x,m.y]);if(m.tr.length>30)m.tr.shift();}
   let best=null,bd=1e9;for(const r of rocks){const d=Math.hypot(r.x-m.x,r.y-m.y);if(d<bd){bd=d;best=r;}}
   if(best&&bd<14){/* terminal guidance: turn velocity toward the rock relative to it */const rvx=m.vx-best.vx,rvy=m.vy-best.vy,sp=Math.hypot(rvx,rvy),want=Math.atan2(best.y-m.y,best.x-m.x),cur=Math.atan2(rvy,rvx);let d=((want-cur+Math.PI*3)%TAU)-Math.PI;d=cl(d,-.12,.12);const na=cur+d;m.vx=best.vx+Math.cos(na)*sp;m.vy=best.vy+Math.sin(na)*sp;m.home=1;}
   if(best&&bd<2.4){const vr=Math.hypot(m.vx-best.vx,m.vy-best.vy)*DF_KMS,p=DF_MI*vr*1e3,dv=DF_BETA*p/best.M,dx=dv*best.T*86400/1e3,dn=((m.vx-best.vx)*-best.uy+(m.vy-best.vy)*best.ux)/(Math.hypot(m.vx-best.vx,m.vy-best.vy)||1);
    const sg=Math.abs(dn)>.2?Math.sign(dn):(Math.sign(best.b)||1);best.b+=sg*dx*Math.max(Math.abs(dn),.5);hits++;g.score+=25;last={p,vr,dv,dx,T:best.T,M:best.M,n:best.n};
    A.burst(CX+best.x,CY+best.y,'#ffd070',16,2);fx.ring(CX+best.x,CY+best.y,'#ffe0a0',14,12);fx.debris(CX+best.x,CY+best.y,'#a89888',6,1.4);S('hit');A.shake=3;foc=rocks.indexOf(best);
    if(!best.safe&&Math.abs(best.b)>best.Rf){best.safe=1;const pts=Math.round(150+best.D*2+best.T/2);g.score+=pts;fx.pop(CX+best.x,CY+best.y-10,'DEFLECTED +'+pts,'#7dff9a');S('win');}
    imps.splice(i,1);continue;}
   if(m.t>420||Math.hypot(m.x,m.y)>220||Math.hypot(m.x,m.y)<12)imps.splice(i,1);}
  for(let i=rocks.length-1;i>=0;i--){const r=rocks[i];if(r.T<=0){resolved++;if(Math.abs(r.b)>r.Rf){g.score+=50;msg=r.n+' MISSED BY '+fmt(Math.abs(r.b))+' KM';mt=90;S('coin');}
    else{hits=hits;msg='IMPACT! '+r.n+' ('+r.D+' M) HIT EARTH';mt=120;S('boom');A.shake=14;fx.flash('#ff8040',16);A.burst(CX+E.x,CY+E.y,'#ff6030',40,3);fx.ring(CX+E.x,CY+E.y,'#ff9050',40,30);g.dmg=(g.dmg||0)+1;
     if(g.dmg>=3){g._o='EARTH STRUCK 3 TIMES - '+g.score+' PTS';end=90;}}rocks.splice(i,1);}}
  if(!end&&resolved>=12&&!rocks.length){g.score+=200*(3-(g.dmg||0));g._o='PLANET DEFENDED - 12 THREATS';end=60;}
  if(--nextSpawn<=0&&spawned<12&&rocks.length<3){spawn();nextSpawn=Math.max(90,190-spawned*8);}
  /* aim preview */
  if(A.t%2===0){const v=spd/DF_KMS,q={x:E.x,y:E.y,vx:E.vx+Math.cos(aim)*v,vy:E.vy+Math.sin(aim)*v},F=rocks[foc],fr=F?{x:F.x,y:F.y,vx:F.vx,vy:F.vy}:null,pts=[],fp=[];let bd=1e9,bt=0;
   for(let t=1;t<=220;t++){step(q,1);if(t%4===0)pts.push([q.x,q.y]);if(fr){step(fr,1);if(t%20===0)fp.push([fr.x,fr.y,t]);const d=Math.hypot(fr.x-q.x,fr.y-q.y);if(d<bd&&t<(F.T||999)){bd=d;bt=t;}}}pred={pts,fp,bd,bt};}};
 const rockDraw=(x,y,r,rot,seed)=>{const c=A.c,q=srng(seed),n=9,pts=[];for(let i=0;i<n;i++){const a=rot+i/n*TAU,rr=r*(.75+q()*.4);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}X.poly(pts,X.rg(x-r*.4,y-r*.4,.2,x,y,r*1.2,['#c8b8a0','#7a6a58','#3a3028']));X.disc(x+r*.2,y-r*.1,r*.22,'rgba(0,0,0,.25)');};
 g.draw=()=>{const c=A.c,E=earth(day);nebula('df',['#05040a','#0c0812','#6a2a3a','#2a3a7a','#4a2a6a'],61);pstars(0,0,30);
  sun(CX,CY,6);c.strokeStyle='rgba(120,180,255,.22)';c.lineWidth=.6;c.beginPath();c.arc(CX,CY,DF_RE,0,TAU);c.stroke();
  /* asteroid future tracks */
  rocks.forEach((r,i)=>{const q={x:r.x,y:r.y,vx:r.vx,vy:r.vy};c.strokeStyle=r.safe?'rgba(125,255,154,.35)':i===foc?'rgba(255,90,70,.6)':'rgba(255,120,90,.28)';c.lineWidth=i===foc?.9:.6;c.setLineDash&&c.setLineDash([2,2]);c.beginPath();c.moveTo(CX+q.x,CY+q.y);const n=Math.min(r.T,400);for(let t=0;t<n;t+=4){step(q,4);c.lineTo(CX+q.x,CY+q.y);}c.stroke();c.setLineDash&&c.setLineDash([]);
   if(!r.safe){const ie=earth(day+r.T);X.disc(CX+ie.x,CY+ie.y,2.5,'rgba(255,60,40,.5)');}});
  /* preview */
  if(pred){c.fillStyle='rgba(255,220,140,.75)';pred.pts.forEach((p,i)=>{c.globalAlpha=1-i/pred.pts.length*.8;c.fillRect(CX+p[0]-.6,CY+p[1]-.6,1.2,1.2);});c.globalAlpha=1;pred.fp.forEach(p=>{c.strokeStyle='rgba(255,110,90,.6)';c.lineWidth=.5;c.beginPath();c.arc(CX+p[0],CY+p[1],1.6,0,TAU);c.stroke();});
   if(pred.bd<14&&rocks[foc]){const t=pred.bt;ft('INTERCEPT ~'+t+' D',CX+E.x+8,CY+E.y+10,'#7dff9a',5,'l',1);}}
  /* earth */
  const ex=CX+E.x,ey=CY+E.y;if(lo())X.glow(ex,ey,10,'#6ab8ff',.35);planet(ex,ey,4,Object.assign({},STY[1],{lx:-E.x/DF_RE,ly:-E.y/DF_RE}));
  arrow(ex,ey,ex+Math.cos(aim)*(10+spd*2),ey+Math.sin(aim)*(10+spd*2),'#ffcf3f',1.1);
  /* impactors */
  for(const m of imps){c.strokeStyle='rgba(255,200,120,.45)';c.lineWidth=.6;c.beginPath();m.tr.forEach((p,i)=>i?c.lineTo(CX+p[0],CY+p[1]):c.moveTo(CX+p[0],CY+p[1]));c.stroke();X.disc(CX+m.x,CY+m.y,1.3,m.home?'#ff8a40':'#ffe0a0');if(lo())X.glow(CX+m.x,CY+m.y,4,'#ffb060',.5);}
  /* rocks */
  rocks.forEach((r,i)=>{const s=r.safe?r.off*6*Math.sign(r.b):0,x=CX+r.x-r.uy*s,y=CY+r.y+r.ux*s,rad=1.8+r.D/30;rockDraw(x,y,rad,r.rot,r.seed);if(i===foc){c.strokeStyle=r.safe?'#7dff9a':'#ff6050';c.lineWidth=.7;c.beginPath();c.arc(x,y,rad+3,A.t*.05,A.t*.05+5);c.stroke();}
   ft(r.n,x,y-rad-5,r.safe?'#9fffb0':'#ffb0a0',4.4,'c');});
  fx.draw();
  hud('DAY '+day,'SCORE '+g.score);for(let i=0;i<3;i++){c.globalAlpha=i<3-(g.dmg||0)?1:.22;planet(98+i*9,9,3,STY[1]);}c.globalAlpha=1;
  /* threat board */
  const lines=[{t:'THREATS   T-days   size',c:'#7fd0ff',b:1}];rocks.forEach((r,i)=>lines.push({t:(i===foc?'> ':'  ')+r.n.padEnd(8)+String(r.T).padStart(5)+'   '+r.D+' m',c:r.safe?'#9fffb0':r.T<60?'#ff8a70':'#ffd8c8'}));lines.push({t:'impactors '+stock+'/6   v∞ '+spd.toFixed(1)+' km/s',c:'#ffe08a'});eq(3,20,lines,{w:116});
  /* momentum panel */
  const F=rocks[foc],L=last;eq(W-3,20,[{t:'p = m·v   (momentum)',c:'#7fd0ff',b:1},L?'p = '+fmt(DF_MI)+' kg × '+L.vr.toFixed(1)+' km/s':'impactor m = 1,500 kg',L?'  = '+sci(L.p)+' kg·m/s':'β = 3.6 (ejecta boost)',L?{t:'Δv = β·p/M = '+(L.dv*100).toFixed(2)+' cm/s',c:'#ffe08a'}:'Δv = β·p / M',L?{t:'Δx = Δv·t = '+fmt(L.dx)+' km',c:'#7dff9a'}:'Δx = Δv·t',L?'   (t = '+L.T+' d, M = '+sci(L.M)+' kg)':''],{al:'r',w:122});
  /* B-plane inset */
  const bx=W-80,by=150,bw=77,bh=62;X.rr(bx,by,bw,bh,3,'rgba(4,8,22,.86)');X.rrs(bx+.5,by+.5,bw-1,bh-1,3,'rgba(140,190,255,.35)',.6);ft('B-PLANE '+(F?F.n:''),bx+3,by+5,'#8ac8ff',4.4);
  if(F){const cx=bx+bw/2,cy=by+bh/2+4,sc=12/F.Rf;c.save();c.beginPath();c.rect(bx+1,by+9,bw-2,bh-10);c.clip();planet(cx,cy,DF_REK*sc,STY[1]);c.setLineDash&&c.setLineDash([2,2]);c.strokeStyle='rgba(255,120,90,.8)';c.lineWidth=.6;c.beginPath();c.arc(cx,cy,12,0,TAU);c.stroke();c.setLineDash&&c.setLineDash([]);
   const px=cx+cl(F.b*sc,-36,36);c.strokeStyle=F.safe?'#7dff9a':'#ff5040';c.lineWidth=.9;c.beginPath();c.moveTo(px-3,cy-3);c.lineTo(px+3,cy+3);c.moveTo(px+3,cy-3);c.lineTo(px-3,cy+3);c.stroke();c.restore();
   ft('b = '+fmt(Math.abs(F.b))+' km'+(F.safe?'  SAFE':''),bx+3,by+bh-5,F.safe?'#9fffb0':'#ffb0a0',4.4);}
  if(F)ft('capture b = R⊕√(1+v²esc/v²∞) = '+fmt(F.Rf)+' km',bx-2,by-5,'#a8b8e0',4.6,'r');
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,H-44,/IMPACT/.test(msg)?'#ff8a70':/MISSED|DEFEND/.test(msg)?'#7dff9a':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= LAUNCH CONTROL ================= */
/* real rocket equation + 2D ascent: gravity (inverse square), centrifugal relief, exponential atmosphere drag, Isp varying sea-level→vacuum. sim runs at 10x. */
const LC_R=6.371e6,LC_MU=3.986e14,LC_DT=1/6;
const LC_MS=[['RIDESHARE CUBESATS',800,0,30,'LEO'],['WEATHER SATELLITE',3500,0,45,'LEO'],['CREW CAPSULE',9500,0,80,'LEO'],['GPS SATELLITE',3800,2460,70,'GTO'],['LUNAR PROBE',3000,3150,85,'TLI'],['STATION MODULE',16000,0,110,'LEO'],['MARS ORBITER',2500,3600,120,'TMI'],['DEEP SPACE PROBE',1000,4200,150,'ESCAPE']];
const LC_WX=['UPPER WINDS','SURFACE WIND','LIGHTNING','CLOUD CEILING','RANGE SAFETY','LOX LOADING'];
A.add({id:'launchwindow',name:'LAUNCH CONTROL',cat:'SIM',time:600,tags:'space rocket launch tsiolkovsky delta-v twr max-q countdown weather go no-go falcon saturn sim education',how:'BUILD WITH ARROWS, A ROLLS OUT. B HOLDS THE COUNT. IN FLIGHT A STAGES, DOWN THROTTLES.',make(){
 const g={over:null,score:0},fx=X.fx();let mi=0,money=50,ph='cfg',row=0,cfg={b:2,e:5,c:300,u:60},msg='',mt=0,tc=0,hold=0,win=0,wx=[],wxT=0,r=null,lastQ=0,qmax=0,qBad=0,stgT=0,clouds=[],strike=0,res=null,resT=0,miles={},plot=[];
 const MS=()=>LC_MS[mi];
 const stats=cf=>{const pay=MS()[1]+2000,bD=4500,bP=36000,bT=2.2e6,bI=[255,275],eT=845e3,eI=[282,311],cD=cf.c*1e3*.06+cf.e*470,uD=cf.u*1e3*.07+600,uT=981e3,uI=348;
  const bm=cf.b*(bD+bP),cm=cD+cf.c*1e3,um=uD+cf.u*1e3,m0=bm+cm+um+pay,T0=cf.b*bT+cf.e*eT,tw=T0/(m0*G0);let dv=[],mm=m0;
  if(cf.b){const md_b=cf.b*bT/(bI[0]*G0),tb=cf.b*bP/md_b,md_c=cf.e*eT/(eI[0]*G0),cu=Math.min(cf.c*1e3,md_c*tb),isp=(cf.b*bT+cf.e*eT)/((md_b+md_c)*G0),m1=m0-cf.b*bP-cu;dv.push(isp*1.04*G0*Math.log(m0/m1));mm=m1-cf.b*bD;var cRem=cf.c*1e3-cu;}else var cRem=cf.c*1e3;
  const ci=(eI[0]+eI[1])/2+6;dv.push(ci*G0*Math.log(mm/(mm-cRem)));mm=mm-cRem-cD;dv.push(uI*G0*Math.log(mm/(mm-cf.u*1e3)));
  const cost=cf.b*4+cf.e*1+cf.c/100+cf.u/20+3;return{m0,T0,tw,dv,tot:dv.reduce((a,b)=>a+b,0),cost:Math.round(cost*10)/10,pay,cD,uD};};
 const need=()=>9300+MS()[2];
 const newWx=()=>{wx=LC_WX.map((n,i)=>({n,go:1,v:0,t:0}));wxT=120+ri(200);};
 const toCount=()=>{ph='count';tc=30;hold=0;win=45;newWx();clouds=[];for(let i=0;i<8;i++)clouds.push([rnd(W),30+rnd(70),20+rnd(40)]);msg='T-30 - LAUNCH WINDOW OPEN';mt=90;S('blip');};
 const launch=()=>{const st=stats(cfg);ph='fly';r={h:0,x:0,vh:0,vx:0,t:0,st:cfg.b?0:1,bP:cfg.b*36000,cP:cfg.c*1e3,uP:cfg.u*1e3,pitch:0,thr:1,stageNeed:0,lift:0};qmax=0;qBad=0;plot=[];miles={};
  const bad=wx.filter(w=>!w.go).map(w=>w.n);r.risk=bad;money-=st.cost;msg='LIFTOFF!';mt=60;S('boom');A.shake=6;};
 const mass=()=>{const st=stats(cfg);return MS()[1]+2000+(r.st===0?cfg.b*4500+r.bP:0)+(r.st<=1?st.cD+r.cP:0)+st.uD+r.uP;};
 const finish=(okk,why)=>{ph='res';resT=0;res={ok:okk,why};if(okk){const pay=MS()[3];money+=pay;g.score+=pay*10;S('win');A.burst(160,90,K.y,30,2.4);fx.ring(160,90,'#7dff9a',50,30);}else{S('boom');A.shake=10;}};
 g.dbg=()=>({ph,r,res,mi,money,cfg,st:stats(cfg),wx,hold});g.dbgSet=(i,c)=>{mi=i;money=999;Object.assign(cfg,c);};
 const mile=(k,txt,pts)=>{if(miles[k])return;miles[k]=1;g.score+=pts;fx.pop(160,70,txt+' +'+pts,'#9fd8ff');S('coin');};
 g.update=()=>{if(mt)mt--;const k=A.in(0),h=A.hit(0);
  if(ph==='cfg'){if(h.u)row=(row+3)%4;if(h.d)row=(row+1)%4;const d=(h.r?1:0)-(h.l?1:0);if(d){S('blip');if(row===0)cfg.b=cl(cfg.b+d*2,0,6);if(row===1)cfg.e=cl(cfg.e+d,1,9);if(row===2)cfg.c=cl(cfg.c+d*50,100,600);if(row===3)cfg.u=cl(cfg.u+d*10,20,160);}
   if(h.a){const st=stats(cfg);if(st.cost>money){msg='OVER BUDGET: $'+st.cost+'M';mt=60;S('lose');}else toCount();}return;}
  if(ph==='count'){win-=1/60;if(win<=0){money-=2;msg='WINDOW CLOSED - SCRUB ($2M)';mt=100;S('lose');if(money<8){g.over='BANKRUPT - '+g.score+' PTS';return;}ph='cfg';return;}
   if(--wxT<=0){const w=wx[ri(wx.length)];if(w.go){w.go=0;w.t=200+ri(260);msg=w.n+' NO-GO';mt=70;S('lose');}wxT=150+ri(260);}
   for(const w of wx)if(!w.go&&--w.t<=0){w.go=1;msg=w.n+' GO';mt=50;S('coin');}
   if(h.b){hold=!hold;S('blip');msg=hold?'HOLD HOLD HOLD':'COUNT RESUMED';mt=50;}if(h.a&&hold){hold=0;msg='COUNT RESUMED';mt=40;}
   if(!hold){tc-=1/20;if(tc<=0)launch();}if(wx[2]&&!wx[2].go&&A.t%90<4)strike=6;if(strike)strike--;return;}
  if(ph==='res'){resT++;if(resT>150&&(h.a||resT>420)){if(res.ok){mi++;if(mi>=LC_MS.length){g.over='ALL 8 LAUNCHES - FLIGHT DIRECTOR CHAMP';return;}}if(money<8){g.over='BANKRUPT - '+g.score+' PTS';return;}ph='cfg';row=0;}return;}
  /* ---- flight ---- */
  const st=stats(cfg);for(let s=0;s<4;s++){const dt=LC_DT/4,hh=Math.max(0,r.h),rho=1.225*Math.exp(-hh/8500),rr=LC_R+hh,gg=LC_MU/(rr*rr),v=Math.hypot(r.vh,r.vx);
   r.thr=k.d?.6:1;
   let T=0,md=0;const fr=rho/1.225;if(r.st===0&&r.bP>0){const tb=cfg.b*2.2e6*r.thr,ib=255+20*(1-fr);T+=tb;md+=tb/(ib*G0);}if(r.st<=1&&r.cP>0){const tc_=cfg.e*845e3*r.thr*(r.st===1?1:1),ic=282+29*(1-fr);T+=tc_*(1+.1*(1-fr));md+=tc_/(ic*G0);}if(r.st===2&&r.uP>0){T+=981e3*r.thr;md+=981e3*r.thr/(348*G0);}
   const m=mass(),aT=T/m;let guide=90*Math.sqrt(cl((hh-800)/95000,0,1));if(hh>25000&&aT>0){const geff=gg-r.vx*r.vx/rr,vdes=cl((185000-hh)/70,-150,900),av=(vdes-r.vh)/18,cs=cl((av+geff)/aT,-.2,1),gpe=Math.acos(cs)/D2R,bl=cl((hh-25000)/20000,0,1);guide=guide*(1-bl)+gpe*bl;}
   r.pitch+=((cl(guide+ax(k)*25,0,110))-r.pitch)*.03;
   const cda=(cfg.b?9:5.4)*(r.st===2?.6:1),D=.5*rho*v*v*cda*.35;const pa=r.pitch*D2R,ax_=(T*Math.sin(pa)-(v>1?D*r.vx/v:0))/m,ay_=(T*Math.cos(pa)-(v>1?D*r.vh/v:0))/m-gg+r.vx*r.vx/rr;
   if(!r.lift){if(T/(m*G0)<1){finish(0,'TWR BELOW 1 - STUCK ON THE PAD');return;}r.lift=1;}
   r.vx+=ax_*dt;r.vh+=ay_*dt;r.x+=r.vx*dt;r.h+=r.vh*dt;r.t+=dt;
   if(r.st===0){const used=Math.min(r.bP,cfg.b*2.2e6*r.thr/(260*G0)*dt);r.bP-=used;}if(r.st<=1&&r.cP>0){const used=Math.min(r.cP,cfg.e*845e3*r.thr/(296*G0)*dt);r.cP-=used;}if(r.st===2&&r.uP>0)r.uP-=Math.min(r.uP,981e3*r.thr/(348*G0)*dt);
   lastQ=.5*rho*v*v;qmax=Math.max(qmax,lastQ);}
  if(r.t>3)mile('lift','LIFTOFF',10);if(qmax>15000&&lastQ<qmax*.8)mile('maxq','MAX-Q PASSED',20);if(r.h>1e5)mile('karman','KARMAN LINE',30);
  if(lastQ>36000){qBad++;if(qBad>20){finish(0,'STRUCTURAL FAILURE AT MAX-Q');return;}}else qBad=Math.max(0,qBad-1);
  if(r.risk.length&&r.t>20&&r.t<21){const w=r.risk[0];finish(0,w==='LIGHTNING'?'LIGHTNING STRIKE - VEHICLE LOST':w==='UPPER WINDS'?'WIND SHEAR - VEHICLE BROKE UP':w==='RANGE SAFETY'?'RANGE VIOLATION - FLIGHT TERMINATED':w==='LOX LOADING'?'ENGINE STARVED - LOX UNDERFILL':'LAUNCHED NO-GO - VEHICLE LOST');return;}
  /* staging */
  const empty=(r.st===0&&r.bP<=0)||(r.st===1&&r.cP<=0);if(empty){r.stageNeed++;if(h.a||r.stageNeed>150){const late=r.stageNeed>150;r.st++;r.stageNeed=0;mile('stg'+r.st,late?'LATE STAGING':'STAGE SEP',late?2:15);fx.debris(160,140,'#c8c8d0',8,1.6);S('hit');}}
  if(r.t%2<LC_DT)plot.push([r.x,r.h]);if(plot.length>400)plot.shift();
  const rr=LC_R+r.h,E=(r.vh*r.vh+r.vx*r.vx)/2-LC_MU/rr,hm=rr*r.vx,a=-LC_MU/(2*E),e=Math.sqrt(Math.max(0,1+2*E*hm*hm/(LC_MU*LC_MU))),rp=E<0?a*(1-e):rr;r.pe=(rp-LC_R)/1e3;r.ap=E<0?(a*(1+e)-LC_R)/1e3:9999;
  if(r.h<-5&&r.t>2){finish(0,'VEHICLE IMPACTED THE GROUND');return;}
  if(r.pe>150){const left=348*G0*Math.log((st.uD+r.uP+MS()[1]+2000)/(st.uD+MS()[1]+2000));finish(left>=MS()[2]*.98,left>=MS()[2]*.98?'ORBIT! '+(MS()[2]?MS()[4]+' BURN DONE':'PAYLOAD DEPLOYED'):'IN ORBIT BUT SHORT '+Math.round(MS()[2]-left)+' M/S FOR '+MS()[4]);r.left=left;return;}
  if(r.st===2&&r.uP<=0&&r.pe<140){finish(0,'OUT OF PROPELLANT - SUBORBITAL');return;}};
 const rocket=(x,y,s,stg,thr,ang)=>{const c=A.c,cl_=20+cfg.c/14,ul=6+cfg.u/9,bl=cl_*.72;c.save();c.translate(x,y);c.rotate(ang||0);c.scale(s,s);
  const cyl=(x0,y0,w,h,col)=>{c.fillStyle=X.lg(x0,0,x0+w,0,[X.lt(col,.55),X.lt(col,1.35),col,X.lt(col,.5)]);c.fillRect(x0,y0,w,h);};
  if(thr>0){flame(0,0,Math.PI/2,(10+thr*14)*(1+(r?Math.min(2,r.h/40000):0)),2.4+(r?Math.min(5,r.h/20000):0));if(stg===0&&cfg.b)for(const sx of[-3.6,3.6])flame(sx,-2,Math.PI/2,14,1.4);}
  let top=0;if(stg<=1){cyl(-2,-cl_,4,cl_,'#e8e8ec');c.fillStyle='#222';c.fillRect(-2,-cl_*.55,4,.6);c.fillStyle='#1a1a20';for(let i=0;i<Math.min(cfg.e,5);i++)c.fillRect(-1.8+i*.8,0,.6,1.4);top=-cl_;}
  if(stg===0&&cfg.b){for(const sx of[-4.6,2.4]){cyl(sx,-bl,2.2,bl,'#f0f0f0');X.poly([[sx,-bl],[sx+1.1,-bl-3],[sx+2.2,-bl]],'#d8d8d8');}if(cfg.b>2){c.globalAlpha=.6;for(const sx of[-3.5,1.3])cyl(sx,-bl+2,2.2,bl-2,'#c8c8c8');c.globalAlpha=1;}}
  cyl(-2,top-ul,4,ul,'#d8dce4');c.fillStyle='#2a2a30';c.fillRect(-2,top-.5,4,.5);X.poly([[-2,top-ul],[-2,top-ul-6],[0,top-ul-10],[2,top-ul-6],[2,top-ul]],X.lg(-2,0,2,0,['#a8aab8','#ffffff','#9a9cac']));
  c.fillStyle='#3a5aa8';c.fillRect(-2,top-ul*.6,4,.8);c.restore();return cl_+ul+10;};
 g.draw=()=>{const c=A.c,st=stats(cfg),M=MS();
  if(ph==='cfg'){X.cache('space1_lcvab',()=>{X.sky(['#0a0e1c','#141a30','#0a0c18']);const cc=A.c;for(let x=0;x<W;x+=24){cc.fillStyle='rgba(255,255,255,.03)';cc.fillRect(x,0,1,H);}cc.fillStyle='#1a2034';cc.fillRect(0,214,W,26);cc.fillStyle='rgba(255,207,63,.25)';for(let x=0;x<W;x+=16)cc.fillRect(x,214,8,1.5);X.glow(70,40,80,'#8ab0ff',.12);});
   c.strokeStyle='rgba(255,140,60,.55)';c.lineWidth=1;for(let y=60;y<214;y+=18){c.beginPath();c.moveTo(28,y);c.lineTo(36,y);c.stroke();}c.fillStyle='#4a3a2a';c.fillRect(30,50,3,164);
   const L=20+cfg.c/14+6+cfg.u/9+10,s=Math.min(1.6,170/L);rocket(70,212,s,0,0);
   const rows=[['BOOSTERS',cfg.b+' × SRB','2.2 MN each'],['CORE ENGINES',cfg.e+' × 845 kN','Isp 282-311 s'],['CORE PROPELLANT',cfg.c+' t','dry 6%'],['UPPER STAGE',cfg.u+' t','981 kN, Isp 348 s']];
   X.panel(118,20,199,62);ft('MISSION '+(mi+1)+'/8  '+M[0],124,27,'#ffcf3f',5.4,'l',1);ft('payload '+fmt(M[1])+' kg → '+M[4]+'   pays $'+M[3]+'M',124,35,'#d8e4ff',5);
   rows.forEach((rw,i)=>{const y=45+i*9;if(i===row)X.rr(120,y-4,195,8.5,2,'rgba(255,207,63,.18)');ft((i===row?'◀ ':'  ')+rw[0],124,y,i===row?'#ffe08a':'#b8c4e0',5.2,'l',i===row);ft(rw[1]+(i===row?' ▶':''),250,y,'#ffffff',5.2,'r',1);ft(rw[2],312,y,'#8a98b8',4.6,'r');});
   const nd=need(),ok=st.tot>=nd,tok=st.tw>=1.2;
   eq(118,86,[{t:'Δv = Isp·g₀·ln(m₀/m_f)',c:'#7fd0ff',b:1},cfg.b?'stage 0  (SRB + core)  '+(st.dv[0]/1e3).toFixed(2)+' km/s':'stage 0  (no boosters)','stage 1  core   '+(st.dv[cfg.b?1:0]/1e3).toFixed(2)+' km/s','stage 2  upper  '+(st.dv[cfg.b?2:1]/1e3).toFixed(2)+' km/s',{t:'total '+(st.tot/1e3).toFixed(2)+' km/s  need '+(nd/1e3).toFixed(2)+(M[2]?' ('+M[4]+' +'+(M[2]/1e3).toFixed(2)+')':''),c:ok?'#7dff9a':'#ff9a8a'},{t:'TWR = T/(m·g₀) = '+fmt(st.T0/1e3)+' kN / ('+fmt(st.m0/1e3)+' t·g) = '+st.tw.toFixed(2),c:tok?'#7dff9a':st.tw>=1?'#ffe08a':'#ff9a8a',z:5.2}],{w:199});
   X.panel(118,150,199,38);ft('COST $'+st.cost+'M     BUDGET $'+fmt(money,1)+'M',124,158,st.cost>money?'#ff9a8a':'#ffe08a',5.6,'l',1);ft(!tok?'TWR under 1.2: slow, heavy gravity losses':!ok?'Not enough Δv for this mission':'Looks flyable. A = ROLL OUT TO THE PAD',124,168,!tok||!ok?'#ffb0a0':'#9fffb0',5);ft('need ≈ 9.3 km/s to LEO incl. gravity + drag losses',124,178,'#8a98b8',4.6);
   hud('LAUNCH CONTROL','$'+fmt(money,0)+'M');}
  else if(ph==='count'){const bad=wx.some(w=>!w.go),storm=wx[2]&&!wx[2].go;X.sky(storm?['#1a1c26','#3a3e4c']:['#2a5aa8','#9ac8f0']);if(strike){c.fillStyle='rgba(255,255,255,.5)';c.fillRect(0,0,W,H);X.stroke([[200,0],[190,40],[205,60],[185,110]],'#ffffff',1.6);}
   for(const cl0 of clouds){X.ell((cl0[0]+A.t*.1)%(W+60)-30,cl0[1],cl0[2],cl0[2]*.3,storm?'rgba(60,64,80,.8)':'rgba(255,255,255,.55)');}
   c.fillStyle='#2a3a2a';c.fillRect(0,206,W,34);c.fillStyle='#5a5a5a';c.fillRect(40,200,90,8);c.fillStyle='#8a3020';for(let y=72;y<200;y+=8){c.fillRect(110,y,10,1.2);}c.fillRect(110,70,2,130);c.fillRect(118,70,2,130);
   const L=20+cfg.c/14+6+cfg.u/9+10;rocket(80,200,Math.min(1.5,130/L),0,0);if(lo()&&A.t%3===0)fx.spark(80+rnd(10)-5,198,'#ffffff',1,.5);
   const lines=[{t:'GO / NO-GO POLL',c:'#7fd0ff',b:1}];wx.forEach(w=>lines.push({t:(w.go?'GO     ':'NO-GO  ')+w.n,c:w.go?'#7dff9a':'#ff8a70'}));lines.push({t:'window '+Math.ceil(win)+' s   B = hold',c:'#ffe08a'});eq(W-3,22,lines,{al:'r',w:104});
   eq(3,22,[{t:'TWR = T/(m·g₀) = '+st.tw.toFixed(2),c:'#d8e4ff'},'Δv total '+(st.tot/1e3).toFixed(2)+' km/s',{t:'launching NO-GO = risk',c:bad?'#ff9a8a':'#9fffb0'}],{w:104});
   X.ot((hold?'HOLD ':'T-')+Math.ceil(tc),160,96,hold?'#ff8a70':'#ffffff',3,'c');hud(M[0].slice(0,18),'$'+fmt(money,0)+'M');}
  else{/* flight or result */const hh=r?Math.max(0,r.h):0,f=cl(hh/80000,0,1);X.sky([X.lt('#2a64c8',1-f*.95).replace('rgb','rgb'),A.mix('#9ac8f0','#04060e',Math.min(1,f*1.3))]);
   if(f>.3){c.globalAlpha=f;X.stars(80,5,0,(hh/400)%H,H,.9);c.globalAlpha=1;}
   const gy0=200+hh/60;if(gy0<H+600){const curv=Math.min(1200,600+hh/50);X.disc(160,gy0+curv,curv,X.rg(160,gy0,curv*.95,160,gy0+curv,curv,['#3a6a3a','#1a3a6a']));if(hh>15000&&lo())X.disc(160,gy0+curv,curv+6,X.rg(160,gy0+curv,curv,160,gy0+curv,curv+6,['rgba(120,190,255,.5)','rgba(120,190,255,0)']));}
   const ang=r?r.pitch*D2R:0,L=20+cfg.c/14+6+cfg.u/9+10,sc=Math.min(1.3,110/L);if(r&&!(res&&!res.ok&&resT>2))rocket(160,140,sc,r.st,ph==='fly'&&((r.st===0&&r.bP>0)||(r.st===1&&r.cP>0)||(r.st===2&&r.uP>0))?r.thr:0,ang);
   if(res&&!res.ok&&resT<40&&resT%4===0)A.burst(160,120,'#ff8040',10,2.5);
   fx.draw();
   if(r){const v=Math.hypot(r.vh,r.vx),stg=r.st,m=mass(),mf=m-(stg===0?r.bP:stg===1?r.cP:r.uP),isp=stg===2?348:stg===1?296:265,dvl=isp*G0*Math.log(m/Math.max(1,mf));
    eq(3,20,[{t:'Δv = Isp·g₀·ln(m₀/m_f)',c:'#7fd0ff',b:1},'stage '+stg+':  '+fmt(m/1e3,1)+' t → '+fmt(mf/1e3,1)+' t',{t:'Δv left in stage = '+(dvl/1e3).toFixed(2)+' km/s',c:'#ffe08a'},{t:'q = ½ρv² = '+(lastQ/1e3).toFixed(1)+' kPa'+(lastQ>30000?'  THROTTLE!':''),c:lastQ>36000?'#ff6050':lastQ>30000?'#ffb080':'#d8e4ff'},'TWR now '+((stg===0?cfg.b*2.2e6+cfg.e*845e3:stg===1?cfg.e*845e3:981e3)*r.thr/(m*G0)).toFixed(2)],{w:118});
    eq(W-3,20,[{t:'TELEMETRY',c:'#7fd0ff',b:1},'alt '+fmt(r.h/1e3,1)+' km','v '+fmt(v,0)+' m/s  (orbit '+fmt(Math.sqrt(LC_MU/(LC_R+Math.max(0,r.h))),0)+')','pitch '+r.pitch.toFixed(0)+'° from vertical','peri '+(r.pe<-6000?'—':fmt(r.pe,0)+' km')+'   T+'+fmt(r.t,0)+' s'],{al:'r',w:110});
    const px=W-82,py=150,pw=78,ph2=46;X.rr(px,py,pw,ph2,3,'rgba(4,8,22,.85)');c.strokeStyle='#7fd0ff';c.lineWidth=.7;c.beginPath();plot.forEach((p,i)=>{const x=px+3+cl(p[0]/2e6,0,1)*(pw-6),y=py+ph2-3-cl(p[1]/2e5,0,1)*(ph2-8);i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();ft('ASCENT PROFILE',px+3,py+4.5,'#8ac8ff',4.2);
    if(r.stageNeed>0&&ph==='fly')ft('STAGE EMPTY - PRESS A TO STAGE',160,H-34,A.t%16<8?'#ffcf3f':'#fff0c0',6.6,'c',1);}
   hud(ph==='res'?'MISSION '+(mi+1):'FLIGHT '+(mi+1),'$'+fmt(money,0)+'M');
   if(ph==='res'){X.panel(50,82,220,56,res.ok?'#7dff9a':'#ff8a70');X.ot(res.ok?'MISSION SUCCESS':'MISSION FAILED',160,88,res.ok?'#7dff9a':'#ff8a70',2,'c');ft(res.why,160,108,'#ffffff',6,'c',1);ft(res.ok?'paid $'+M[3]+'M   budget $'+fmt(money,1)+'M':'budget $'+fmt(money,1)+'M - redesign and retry',160,118,'#ffe08a',5.4,'c');if(resT>150)ft('A = CONTINUE',160,129,A.t%30<15?'#ffffff':'#9aa',5.4,'c',1);}}
  if(mt>0&&ph!=='res'){c.globalAlpha=Math.min(1,mt/20);banner(msg,ph==='cfg'?196:60,/NO-GO|SCRUB|OVER|HOLD/.test(msg)?'#ff8a70':/GO|RESUMED|LIFTOFF/.test(msg)?'#7dff9a':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= STAR NAVIGATOR ================= */
/* real nearby stars (distance, RA, Dec → 3D light-year coordinates). special relativity: t = d/v (Earth), τ = t/γ (crew). */
const SN_ST=[['SOL',0,0,0,'G',1],['ALPHA CEN',4.37,14.66,-60.8,'G',0],['BARNARD',5.96,17.96,4.7,'M',0],['WOLF 359',7.86,10.94,7,'M',0],['LALANDE',8.31,11.06,35.9,'M',1],['SIRIUS',8.6,6.75,-16.7,'A',0],['LUYTEN 726',8.73,1.65,-17.9,'M',0],['ROSS 154',9.7,18.83,-23.8,'M',0],['ROSS 248',10.3,23.7,44.2,'M',0],['EPS ERIDANI',10.5,3.55,-9.5,'K',1],['LACAILLE 9352',10.7,23.1,-35.9,'M',1],['ROSS 128',11.0,11.79,.8,'M',1],['PROCYON',11.46,7.65,5.2,'F',0],['61 CYGNI',11.4,21.11,38.7,'K',0],['GROOMBRIDGE',11.6,.3,44,'M',1],['EPS INDI',11.9,22.06,-56.8,'K',1],['TAU CETI',11.9,1.73,-15.9,'G',1],['LUYTEN STAR',12.4,7.46,5.2,'M',0],['TEEGARDEN',12.5,2.88,16.9,'M',1],['KAPTEYN',12.8,5.19,-45,'M',1],['WOLF 1061',14.0,16.5,-12.7,'M',1],['GLIESE 876',15.2,22.89,-14.3,'M',1],['ALTAIR',16.7,19.85,8.9,'A',0],['GLIESE 581',20.4,15.32,-7.7,'M',1]];
const SN_P=SN_ST.map(s=>{const a=s[2]*15*D2R,d=s[3]*D2R;return[s[1]*Math.cos(d)*Math.cos(a),s[1]*Math.cos(d)*Math.sin(a),s[1]*Math.sin(d)];});
const SN_COL={G:'#fff2a8',K:'#ffc070',M:'#ff7a5a',A:'#c8dcff',F:'#f4f0ff'};
const snD=(i,j)=>Math.hypot(SN_P[i][0]-SN_P[j][0],SN_P[i][1]-SN_P[j][1],SN_P[i][2]-SN_P[j][2]);
const SN_SP=[.1,.2,.3,.4,.5,.6,.7,.8,.9,.95,.99],SN_RANGE=10.5;
const snFuel=(d,b)=>10*(1/Math.sqrt(1-b*b)-1)+d/2;
// name, start, targets, tank, Earth-time limit (y), crew-time limit (y)   (limits generated by an exhaustive route solver: every mission is solvable)
const SN_M=[["FIRST STEP",0,[1],20,6.8,3],["BARNARD RUN",0,[2],16,8.6,3.8],["DOG STAR",0,[5],16,13.4,8.1],["RED DWARF RELAY",0,[11],20,17.6,10.6],["TAU CETI COLONY",0,[16],18,18.3,11.6],["LITTLE DOG",0,[12],16,23,16.4],["SOUTHERN CROSSING",1,[15],18,12.4,5.4],["SURVEY: ERIDANI + CETI",0,[9,16],18,27.7,16.4],["KAPTEYN ARK",0,[19],16,28,21.2],["EAGLE STAR",0,[22],20,41.8,26.4],["GLIESE 581 EXODUS",0,[23],22,31.5,17.2]];
A.space1.nav={ST:SN_ST,P:SN_P,M:SN_M,fuel:snFuel,d:snD};
A.add({id:'starnav',name:'STAR NAVIGATOR',cat:'PUZZLE',time:720,tags:'space relativity time dilation lorentz factor light year interstellar star map route puzzle education',how:'LEFT/RIGHT PICK A STAR, UP/DOWN SET SPEED, A JUMPS, B UNDOES. BEAT BOTH CLOCKS ON FUEL.',make(){
 const g={over:null,score:0},fx=X.fx(),CX=160,CY=128,SC=6.2;let mi=0,M,cur,ti,fuel,t,tau,hist,sel=0,spi=6,reach=[],seen=new Set(),travel=null,msg='',mt=0,done=0,warn='',vstars=[];
 for(let i=0;i<160;i++){const u=rnd(2)-1;vstars.push([Math.acos(u),rnd(TAU),.4+rnd(.6),ri(5)]);}
 const scr=i=>{const p=SN_P[i];return[CX+p[0]*SC,CY+p[1]*SC*.5-p[2]*SC*.72,CY+p[1]*SC*.5];};
 const load=i=>{mi=i;M=SN_M[i];cur=M[1];ti=0;fuel=M[3];t=0;tau=0;hist=[];warn='';msg='MISSION '+(i+1)+': '+M[0];mt=120;calc();};
 const calc=()=>{const c0=scr(cur);reach=[];for(let j=0;j<SN_ST.length;j++)if(j!==cur&&snD(cur,j)<=SN_RANGE)reach.push(j);const ang=j=>{const p=scr(j);return Math.atan2(p[1]-c0[1],p[0]-c0[0]);};reach.sort((a,b)=>ang(a)-ang(b));const tg=M[2][ti];const k=reach.indexOf(tg);sel=k>=0?k:0;};
 load(0);
 const arrive=()=>{const tr=travel;travel=null;hist.push({cur,ti,fuel,t,tau});t+=tr.d/tr.b;tau+=tr.d/tr.b/tr.g;fuel-=tr.f;cur=tr.to;if(SN_ST[cur][5]){fuel=M[3];fx.pop(scr(cur)[0],scr(cur)[1]-12,'REFUELLED','#7dff9a');}
  if(!seen.has(mi+':'+cur)){seen.add(mi+':'+cur);g.score+=10;A.burst(scr(cur)[0],scr(cur)[1],SN_COL[SN_ST[cur][4]],8,1.2);}
  warn=t>M[4]+1e-6?'EARTH CHARTER EXPIRED - B TO UNDO':tau>M[5]+1e-6?'CREW AGED PAST LIMIT - B TO UNDO':'';if(warn){S('lose');A.shake=4;}else S('coin');
  if(!warn&&cur===M[2][ti]){ti++;if(ti>=M[2].length){const bonus=Math.round(400+300*(1-t/M[4])+300*(1-tau/M[5]));g.score+=bonus;done++;S('win');A.burst(scr(cur)[0],scr(cur)[1],K.y,30,2.4);fx.ring(scr(cur)[0],scr(cur)[1],'#ffe080',30,24);
    if(mi>=SN_M.length-1){g.over='ALL 11 COLONIES FOUNDED - COMPLETE';return;}msg='COLONY FOUNDED! +'+bonus;mt=110;travel={wait:110};return;}msg='SURVEY TARGET REACHED';mt=70;}
  calc();};
 g.update=()=>{if(mt)mt--;if(travel&&travel.wait){if(--travel.wait<=0){travel=null;load(mi+1);}return;}
  if(travel){travel.k++;if(travel.k>=travel.n)arrive();return;}
  const h=A.hit(0);if(h.l&&reach.length){sel=(sel+reach.length-1)%reach.length;S('blip');}if(h.r&&reach.length){sel=(sel+1)%reach.length;S('blip');}
  if(h.u&&spi<SN_SP.length-1){spi++;S('blip');}if(h.d&&spi>0){spi--;S('blip');}
  if(h.b&&hist.length){const p=hist.pop();cur=p.cur;ti=p.ti;fuel=p.fuel;t=p.t;tau=p.tau;warn='';g.score=Math.max(0,g.score-5);calc();S('hit');msg='UNDO';mt=30;}
  if(h.a&&reach.length&&!warn){const to=reach[sel],d=snD(cur,to),b=SN_SP[spi],f=snFuel(d,b);if(f>fuel+1e-9){msg='NOT ENOUGH FUEL';mt=50;S('lose');}else{travel={to,d,b,g:1/Math.sqrt(1-b*b),f,k:0,n:110};S('jump');}}};
 g.draw=()=>{const c=A.c;
  if(travel&&!travel.wait){/* relativistic view: aberration + Doppler */const k=travel.k/travel.n,ramp=Math.min(1,k*4,(1-k)*4),b=travel.b*ramp,gm=1/Math.sqrt(1-b*b);X.sky(['#000000','#02020a']);
   for(const s of vstars){const ct=(Math.cos(s[0])+b)/(1+b*Math.cos(s[0])),th=Math.acos(cl(ct,-1,1)),D=1/(gm*(1-b*ct)),r=th/Math.PI*190,x=160+Math.cos(s[1])*r,y=120+Math.sin(s[1])*r*.8;if(x<-4||x>W+4||y<-4||y>H+4)continue;
    const br=cl(s[2]*D*D*.6,0,1.6),col=D>1.05?A.mix('#ffffff','#7aa8ff',cl((D-1)/2,0,1)):D<.95?A.mix('#ffffff','#ff5a3a',cl((1-D)*1.5,0,1)):'#ffffff';c.globalAlpha=cl(br,0,1);c.fillStyle=col;const sz=Math.min(2.6,.7+br);c.fillRect(x-sz/2,y-sz/2,sz,sz);}
   c.globalAlpha=1;if(lo())X.glow(160,120,30+b*40,'#9ab8ff',.15+b*.2);
   const dt_=travel.d/travel.b*k,dtau=dt_/travel.g;
   eq(3,20,[{t:'ABERRATION + DOPPLER',c:'#7fd0ff',b:1},"cos θ' = (cos θ + β)/(1 + β·cos θ)",'D = 1/(γ(1 − β·cos θ\'))','β = '+b.toFixed(3)+'   γ = '+gm.toFixed(3)],{w:150});
   eq(W-3,20,[{t:'CLOCKS THIS LEG',c:'#7fd0ff',b:1},{t:'EARTH  '+dt_.toFixed(2)+' y',c:'#ffe08a'},{t:'CREW   '+dtau.toFixed(2)+' y',c:'#7dff9a'},'→ '+SN_ST[travel.to][0]],{al:'r',w:96});
   hud('JUMP '+travel.d.toFixed(1)+' LY','SCORE '+g.score);return;}
  nebula('sn',['#02030a','#060818','#2a2a7a','#4a1a5a','#1a4a6a'],71);pstars(0,0,24);
  /* galactic plane rings around Sol */
  c.lineWidth=.5;for(const R of[5,10,15,20]){c.strokeStyle='rgba(120,160,255,'+(R%10?'.10':'.2')+')';c.beginPath();if(c.ellipse)c.ellipse(CX,CY,R*SC,R*SC*.5,0,0,TAU);c.stroke();if(R%10===0)ft(R+' ly',CX+R*SC+2,CY,'rgba(150,180,255,.5)',4.4);}
  /* range ring around current */
  const c0=scr(cur);c.strokeStyle='rgba(125,255,154,.18)';c.setLineDash&&c.setLineDash([2,3]);c.beginPath();if(c.ellipse)c.ellipse(c0[0],c0[2],SN_RANGE*SC,SN_RANGE*SC*.5,0,0,TAU);c.stroke();c.setLineDash&&c.setLineDash([]);
  /* route so far */
  if(hist.length){c.strokeStyle='rgba(255,207,63,.75)';c.lineWidth=1;c.beginPath();const pts=hist.map(h=>h.cur).concat(cur);pts.forEach((i,k)=>{const p=scr(i);k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});c.stroke();}
  const to=reach[sel],d=to!==undefined?snD(cur,to):0,b=SN_SP[spi],gm=1/Math.sqrt(1-b*b),f=to!==undefined?snFuel(d,b):0,okF=f<=fuel+1e-9;
  if(to!==undefined){const p=scr(to);c.strokeStyle=okF?'rgba(110,220,255,.9)':'rgba(255,100,80,.9)';c.lineWidth=1;c.setLineDash&&c.setLineDash([3,2]);c.beginPath();c.moveTo(c0[0],c0[1]);c.lineTo(p[0],p[1]);c.stroke();c.setLineDash&&c.setLineDash([]);}
  /* stars sorted back to front */
  const order=SN_ST.map((s,i)=>i).sort((a,b)=>SN_P[a][1]-SN_P[b][1]);
  for(const i of order){const p=scr(i),s=SN_ST[i],col=SN_COL[s[4]],tgt=M[2].indexOf(i)>=ti&&M[2].includes(i),isR=reach.includes(i);
   c.strokeStyle='rgba(160,180,255,.25)';c.lineWidth=.5;c.beginPath();c.moveTo(p[0],p[2]);c.lineTo(p[0],p[1]);c.stroke();X.ell(p[0],p[2],1.6,.6,'rgba(160,180,255,.3)');
   const r=s[4]==='A'?2.6:s[4]==='M'?1.5:2;if(lo())X.glow(p[0],p[1],r*3.2,col,.4);X.disc(p[0],p[1],r,col);
   if(s[5]){c.strokeStyle='rgba(125,255,154,.8)';c.lineWidth=.5;c.beginPath();c.arc(p[0],p[1],r+2.2,0,TAU);c.stroke();}
   if(tgt){c.strokeStyle='#ffcf3f';c.lineWidth=.8;c.beginPath();c.arc(p[0],p[1],r+4+Math.sin(A.t*.1),0,TAU);c.stroke();}
   if(i===cur||i===to||tgt||i===0)ft(s[0],p[0],p[1]-r-5,i===cur?'#ffffff':tgt?'#ffe08a':i===to?'#9fe0ff':'rgba(200,210,240,.6)',4.6,'c',i===cur||tgt);else if(isR&&lo())ft(s[0],p[0],p[1]-r-4,'rgba(170,190,230,.45)',4,'c');}
  /* ship */
  X.poly([[c0[0],c0[1]-6],[c0[0]-2.5,c0[1]-2],[c0[0]+2.5,c0[1]-2]],'#ffffff');
  fx.draw();
  hud('MISSION '+(mi+1)+'/'+SN_M.length,'SCORE '+g.score);
  eq(3,20,[{t:'γ = 1/√(1 − v²/c²)',c:'#7fd0ff',b:1},{t:'v = '+b+'c   →   γ = '+gm.toFixed(3),c:'#ffe08a'},to!==undefined?'d = '+d.toFixed(2)+' ly → '+SN_ST[to][0]:'no star in range','t = d/v = '+(d/b).toFixed(2)+' y (Earth)','τ = t/γ = '+(d/b/gm).toFixed(2)+' y (crew)',{t:'fuel = 10(γ−1) + d/2 = '+f.toFixed(1),c:okF?'#d8e4ff':'#ff9a8a'}],{w:122});
  const tg=M[2].slice(ti).map(i=>SN_ST[i][0]).join(' + ');
  eq(W-3,20,[{t:M[0],c:'#ffcf3f',b:1},'to: '+(tg||'DONE'),{t:'Earth t '+t.toFixed(1)+' / '+M[4]+' y',c:t>M[4]?'#ff8a70':'#d8e4ff'},{t:'crew τ '+tau.toFixed(1)+' / '+M[5]+' y',c:tau>M[5]?'#ff8a70':'#d8e4ff'},{t:'fuel '+fuel.toFixed(1)+' / '+M[3],c:fuel<5?'#ffb080':'#d8e4ff'},{t:'○ green ring = gas giant refuel',c:'#7dff9a',z:5}],{al:'r',w:104});
  X.meter(W-104,82,100,5,fuel/M[3],'#3dff8b');
  if(warn)ft(warn,160,H-34,A.t%20<10?'#ff8a70':'#ffd0c0',6.6,'c',1);
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,H-56,/FOUNDED|REACHED/.test(msg)?'#7dff9a':/NOT|UNDO/.test(msg)?'#ff8a70':K.y);c.globalAlpha=1;}};
 return g;}});

/* ================= CARGO RUN ================= */
/* Jovian moons with real μ, radii and orbits. Δv = patched-conic Hohmann between 100 km parking orbits; propellant from Tsiolkovsky. */
const CG_MUJ=1.26687e8;/* km³/s² */
const CG_MO=[['IO',421700,5959.9,1821.6,5,4.0,1.769],['EUROPA',671034,3202.7,1560.8,8,.8,3.551],['GANYMEDE',1070400,9887.8,2634.1,0,1.2,7.155],['CALLISTO',1882700,7179.3,2410.3,0,1.5,16.69]];
const cgDv=(i,j)=>{const a=CG_MO[i],b=CG_MO[j],r1=a[1],r2=b[1],at=(r1+r2)/2,v1=Math.sqrt(CG_MUJ/r1),v2=Math.sqrt(CG_MUJ/r2),vt1=Math.sqrt(CG_MUJ*(2/r1-1/at)),vt2=Math.sqrt(CG_MUJ*(2/r2-1/at)),vi1=Math.abs(vt1-v1),vi2=Math.abs(v2-vt2);
 const lo1=a[3]+100,lo2=b[3]+100,d1=Math.sqrt(vi1*vi1+2*a[2]/lo1)-Math.sqrt(a[2]/lo1),d2=Math.sqrt(vi2*vi2+2*b[2]/lo2)-Math.sqrt(b[2]/lo2);return{dv:(d1+d2)*1e3,t:Math.PI*Math.sqrt(at*at*at/CG_MUJ)/86400,d1:d1*1e3,d2:d2*1e3};};
const CG_GOODS=[['WATER ICE',1],['SULFUR',1.1],['MED SUPPLIES',2.2],['COLONISTS',2.6],['REACTOR PARTS',1.8],['SEED STOCK',1.6],['HELIUM-3',2],['SCIENCE CORES',2.4],['MACHINERY',1.3]];
const CG_UP=[['ENGINE',[['CHEMICAL',450,0],['NUCLEAR THERMAL',900,1400],['FUSION DRIVE',2200,4200]]],['TANK',[['60 t',60,0],['120 t',120,900],['220 t',220,2400]]],['CARGO BAY',[['40 t',40,0],['90 t',90,700],['160 t',160,2000]]]];
A.add({id:'colonycargo',name:'CARGO RUN',cat:'SIM',time:600,tags:'space cargo trade jupiter moons delta-v tsiolkovsky mass fraction logistics business sim education',how:'UP/DOWN PICK A ROW, A TAKES A CONTRACT, HOLD A OR TAP B TO LAUNCH. MIND THE MASS RATIO.',make(){
 const g={over:null,score:0},fx=X.fx(),JX=92,JY=134,OR=[34,50,68,92];let at=1,day=0,cr=400,earned=0,up=[0,0,0],fuelT=20,hold=[],offers=[],row=0,dest=2,fly=null,msg='',mt=0,ang=CG_MO.map((m,i)=>i*1.6),goal=6000,lastRun=null;
 const isp=()=>CG_UP[0][1][up[0]][1],tank=()=>CG_UP[1][1][up[1]][1],bay=()=>CG_UP[2][1][up[2]][1],dry=()=>18+up[0]*6+up[1]*3+up[2]*3;
 const cargo=()=>hold.reduce((a,c)=>a+c.m,0);
 const need=(dv,cg)=>(dry()+cg)*(Math.exp(dv/(isp()*G0))-1);
 const gen=()=>{offers=[];const n=3+ri(3);for(let i=0;i<n;i++){let d;do{d=ri(4);}while(d===at);const gd=CG_GOODS[ri(CG_GOODS.length)],m=5+ri(8)*5,T=cgDv(at,d);offers.push({g:gd[0],m,to:d,pay:Math.round(m*gd[1]*(T.dv/1e3)*(9+ri(6))/3)*5/5,dl:Math.round(day+T.t*2+2+ri(6)),tk:0});}};
 gen();
 const rows=()=>offers.length+4;
 const launch=()=>{if(dest===at){msg='PICK ANOTHER MOON';mt=50;S('blip');return;}const T=cgDv(at,dest),cg=cargo(),req=need(T.dv,cg);let f=Math.max(fuelT,0);
  if(req>tank()){msg='TANK TOO SMALL: NEED '+fmt(req,1)+' T';mt=80;S('lose');return;}
  const buy=Math.max(0,Math.max(req*1.02,Math.min(f,tank()))-fuel);const price=CG_MO[at][5];const costF=buy*price;if(costF>cr){const can=cr/price;if(fuel+can<req){msg='CANNOT AFFORD FUEL';mt=80;S('lose');if(earned<=0&&cr<5)g.over='STRANDED AT '+CG_MO[at][0];return;}fuel+=can;cr=0;}else{fuel+=buy;cr-=costF;}
  const m0=dry()+cg+fuel;fuel-=req;lastRun={dv:T.dv,m0,m1:m0-req,req,cg,isp:isp()};fly={from:at,to:dest,k:0,n:Math.round(90+T.t*40),t:T.t};S('jump');};
 let fuel=20;
 g.update=()=>{if(mt)mt--;day+=fly?0:.004;for(let i=0;i<4;i++)ang[i]+=TAU/(CG_MO[i][6]*250)*(fly?3:1);
  if(fly){fly.k++;day+=fly.t/fly.n;if(fly.k>=fly.n){at=fly.to;fly=null;let pay=0,late=0;hold=hold.filter(c=>{if(c.to!==at)return true;const p=day<=c.dl?c.pay:Math.round(c.pay/2);if(day>c.dl)late++;pay+=p;return false;});
    if(pay){cr+=pay;earned+=pay;g.score=earned;A.burst(JX+Math.cos(ang[at])*OR[at],JY+Math.sin(ang[at])*OR[at],K.y,20,2);fx.pop(JX+Math.cos(ang[at])*OR[at],JY+Math.sin(ang[at])*OR[at]-10,'+'+pay+'K','#ffe08a');S('win');msg='DELIVERED +$'+pay+'K'+(late?' ('+late+' LATE)':'');mt=100;}else{S('coin');msg='DOCKED AT '+CG_MO[at][0];mt=60;}
    gen();row=0;dest=(at+1)%4;if(cr+earned*0>=goal){g.over='TRADE EMPIRE COMPLETE - $'+fmt(cr)+'K';return;}
    const cheapest=Math.min(...[0,1,2,3].filter(j=>j!==at).map(j=>need(cgDv(at,j).dv,0)));if(fuel<cheapest&&cr<(cheapest-fuel)*CG_MO[at][5]){g.over='STRANDED AT '+CG_MO[at][0]+' - $'+fmt(earned)+'K EARNED';}}return;}
  const h=A.hit(0),k=A.in(0),n=rows();if(h.u)row=(row+n-1)%n;if(h.d)row=(row+1)%n;if(h.u||h.d)S('blip');
  const ro=row-offers.length;
  if(row<offers.length&&h.a){const o=offers[row];if(o.tk){o.tk=0;hold=hold.filter(c=>c!==o);S('hit');}else if(cargo()+o.m<=bay()){o.tk=1;hold.push(o);S('coin');}else{msg='CARGO BAY FULL ('+bay()+' T)';mt=60;S('lose');}}
  if(ro===0&&(h.l||h.r)){do{dest=(dest+(h.r?1:3))%4;}while(dest===at);S('blip');}
  if(ro===1){if(k.l)fuelT=Math.max(0,fuelT-.5);if(k.r)fuelT=Math.min(tank(),fuelT+.5);}
  if(ro===2&&(h.l||h.r)){row=row;g._u=((g._u||0)+(h.r?1:2))%3;S('blip');}
  if(ro===2&&h.a){const u=g._u||0,lv=up[u]+1;if(lv>2){msg='ALREADY MAXED';mt=40;}else{const c0=CG_UP[u][1][lv][2];if(cr>=c0){cr-=c0;up[u]=lv;msg=CG_UP[u][0]+': '+CG_UP[u][1][lv][0];mt=80;S('win');}else{msg='NEED $'+c0+'K';mt=50;S('lose');}}}
  g._hA=k.a?(g._hA||0)+1:0;if(g._hA===24&&!fly){launch();}
  if(ro===3&&h.a)launch();if(h.b)launch();};
 g.draw=()=>{const c=A.c;nebula('cg',['#05040a','#0a0812','#6a3a1a','#3a2a6a','#2a4a6a'],83);pstars(0,0,24);
  /* Jupiter */
  planet(JX,JY,22,Object.assign({},STY[3],{lx:-.8,ly:-.4}));c.lineWidth=.5;
  CG_MO.forEach((m,i)=>{c.strokeStyle=i===at&&!fly?'rgba(255,207,63,.35)':'rgba(160,180,255,.16)';c.beginPath();c.arc(JX,JY,OR[i],0,TAU);c.stroke();});
  if(!fly&&dest!==at){const a1=ang[at],r1=OR[at],r2=OR[dest],aa=(r1+r2)/2,e=Math.abs(r2-r1)/(r1+r2);c.strokeStyle='rgba(120,220,255,.6)';c.setLineDash&&c.setLineDash([2,2]);c.beginPath();for(let i=0;i<=40;i++){const th=i/40*Math.PI,rr=aa*(1-e*e)/(1+e*Math.cos(th))*(r2<r1?-1:1);const R=r2>r1?aa*(1-e*e)/(1+e*Math.cos(th)):aa*(1-e*e)/(1-e*Math.cos(th));const x=JX+Math.cos(a1+th)*R,y=JY+Math.sin(a1+th)*R;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.setLineDash&&c.setLineDash([]);}
  CG_MO.forEach((m,i)=>{const x=JX+Math.cos(ang[i])*OR[i],y=JY+Math.sin(ang[i])*OR[i];planet(x,y,i===2?4:3.3,Object.assign({},STY[m[4]],{lx:-Math.cos(ang[i]),ly:-Math.sin(ang[i])}));ft(m[0],x,y-8,i===at?'#ffe08a':i===dest?'#9fe0ff':'rgba(200,210,240,.7)',4.6,'c',i===at);});
  ft('orbits not to scale',JX,JY+100,'rgba(160,170,200,.45)',4.2,'c');
  /* ship */
  let sx,sy,sa=0;if(fly){const k=fly.k/fly.n,r1=OR[fly.from],r2=OR[fly.to],a1=ang[fly.from]-k*0,th=k*Math.PI,aa=(r1+r2)/2,e=Math.abs(r2-r1)/(r1+r2),R=r2>r1?aa*(1-e*e)/(1+e*Math.cos(th)):aa*(1-e*e)/(1-e*Math.cos(th));fly.a0=fly.a0===undefined?ang[fly.from]:fly.a0;const wT=TAU/(CG_MO[fly.to][6]*250)*3,de=ang[fly.to]+wT*(fly.n-fly.k),dl=((de-(fly.a0+Math.PI))%TAU+TAU*1.5)%TAU-Math.PI*.5,sw=th+k*dl;sx=JX+Math.cos(fly.a0+sw)*R;sy=JY+Math.sin(fly.a0+sw)*R;sa=fly.a0+sw+Math.PI/2;if(k<.12||k>.88)flame(sx,sy,sa+Math.PI,6,1.4,up[0]===2);}
  else{sx=JX+Math.cos(ang[at])*(OR[at]+6);sy=JY+Math.sin(ang[at])*(OR[at]+6);sa=ang[at]+Math.PI/2;}
  c.save();c.translate(sx,sy);c.rotate(sa);X.poly([[5,0],[-3,-2.5],[-2,0],[-3,2.5]],'#e8eef8');c.fillStyle='#ffcf3f';c.fillRect(-2,-.6,3,1.2);c.restore();
  if(g._hA>3&&!fly){c.strokeStyle='#ffcf3f';c.lineWidth=1.4;c.beginPath();c.arc(sx,sy,8,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,g._hA/24));c.stroke();}
  fx.draw();
  hud('DAY '+fmt(day,1),'$'+fmt(cr)+'K');
  /* trade panel */
  const px=176,pw=141;X.panel(px,20,pw,104);ft('CONTRACTS AT '+CG_MO[at][0],px+4,26,'#ffcf3f',5.2,'l',1);ft('fuel $'+CG_MO[at][5]+'K/t',px+pw-4,26,'#a8b8e0',4.6,'r');
  offers.forEach((o,i)=>{const y=34+i*8.5;if(row===i&&!fly)X.rr(px+2,y-3.8,pw-4,7.8,2,'rgba(255,207,63,.18)');ft((o.tk?'■ ':'□ ')+o.g.slice(0,12),px+4,y,o.tk?'#7dff9a':'#d8e4ff',4.8);ft(o.m+'t→'+CG_MO[o.to][0].slice(0,3),px+80,y,'#b8c4e0',4.6);ft('$'+o.pay+'K',px+pw-4,y,'#ffe08a',4.8,'r');});
  const ry=34+offers.length*8.5+2,T=cgDv(at,dest),cg=cargo(),req=need(T.dv,cg),m0=dry()+cg+Math.max(req,fuel),ok=req<=tank();
  const R2=[['DESTINATION','◀ '+CG_MO[dest][0]+' ▶',dest===at?'#ff9a8a':'#9fe0ff'],['FUEL TARGET','◀ '+fuelT.toFixed(1)+' t ▶  (have '+fuel.toFixed(1)+')','#d8e4ff'],['UPGRADE','◀ '+CG_UP[g._u||0][0]+' '+(up[g._u||0]<2?'→ '+CG_UP[g._u||0][1][up[g._u||0]+1][0]+' $'+CG_UP[g._u||0][1][up[g._u||0]+1][2]+'K':'MAX')+' ▶','#ffd8a0'],['LAUNCH (HOLD A / B)',ok?'Δv '+fmt(T.dv)+' m/s, '+T.t.toFixed(1)+' d':'TANK TOO SMALL',ok?'#7dff9a':'#ff9a8a']];
  R2.forEach((r,i)=>{const y=ry+i*8.5,on=row===offers.length+i&&!fly;if(on)X.rr(px+2,y-3.8,pw-4,7.8,2,'rgba(255,207,63,.18)');ft(r[0],px+4,y,on?'#ffe08a':'#a8b8e0',4.6,'l',on);ft(r[1],px+pw-4,y,r[2],4.6,'r');});
  /* rocket equation panel */
  const L=lastRun&&fly?lastRun:null,dvv=L?L.dv:T.dv,ms=L?L.m0:m0,mf=L?L.m1:m0-req,rq=L?L.req:req;
  eq(px,128,[{t:'Δv = Isp·g₀·ln(m₀/m₁)',c:'#7fd0ff',b:1},'Isp '+isp()+' s ('+CG_UP[0][1][up[0]][0].toLowerCase()+')','m₀ = '+fmt(ms,1)+' t   m₁ = '+fmt(mf,1)+' t',{t:'fuel = m₁(e^(Δv/Isp·g₀) − 1) = '+fmt(rq,1)+' t',c:ok?'#ffe08a':'#ff9a8a',z:5.2},{t:'payload fraction '+Math.round((L?L.cg:cg)/Math.max(1,ms)*100)+'%',c:'#c8d6ff'},'hold '+cg+'/'+bay()+' t  tank '+tank()+' t  dry '+dry()+' t'],{w:pw});
  /* manifest */
  if(hold.length){const lines=[{t:'MANIFEST',c:'#7fd0ff',b:1}];hold.slice(0,5).forEach(o=>lines.push({t:o.g.slice(0,11)+' '+o.m+'t → '+CG_MO[o.to][0].slice(0,4)+' d'+o.dl,c:day>o.dl?'#ff9a8a':'#d8e4ff',z:5}));eq(3,20,lines);}
  ft('GOAL $'+fmt(goal)+'K',4,H-30,'#8a98b8',5,'l');X.meter(4,H-26,80,5,cr/goal,'#ffcf3f');
  if(mt>0){c.globalAlpha=Math.min(1,mt/20);banner(msg,194,/DELIVER|DOCKED|DRIVE|THERMAL|T$/.test(msg)?'#7dff9a':/NEED|FULL|SMALL|CANNOT|PICK|MAX/.test(msg)?'#ff8a70':K.y);c.globalAlpha=1;}};
 return g;}});

})();
