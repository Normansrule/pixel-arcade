/* PIXEL ARCADE engine: 320x240 canvas, bitmap font, input, sound, game shell */
(function(){
'use strict';
const W=320,H=240;
const A=window.A={W,H,t:0,cpu:false,two:false,lvl:1,ai:.75,c:null,silent:false,games:[]};
const lift=(h,f)=>{const n=parseInt(h.slice(1),16);const r=n>>16,g=(n>>8)&255,b=n&255;const m=v=>Math.max(0,Math.min(255,f>1?v+(255-v)*(f-1):v*f))|0;return`rgb(${m(r)},${m(g)},${m(b)})`;};
A.K={bg:'#0d0926',w:'#fff3d6',r:'#ff4f6d',g:'#3dff8b',b:'#4dabff',y:'#ffcf3f',o:'#ff9838',p:'#ff4f9a',c:'#2fd6c3',d:'#2b2257',gr:'#8d86b8',k:'#000'};
const K=A.K;
A.add=g=>{try{const s=document.currentScript&&document.currentScript.src;if(s)g.src=s.replace(/^.*?(games\/[^?#]+).*$/,'$1');}catch(_){}A.games.push(g);};
A.rnd=n=>Math.random()*n;A.ri=n=>Math.random()*n|0;A.clamp=(v,a,b)=>v<a?a:v>b?b:v;
A.win=i=>i===0?'PLAYER 1 WINS!':A.cpu?'CPU WINS!':'PLAYER 2 WINS!';
A.nm=i=>i===0?'P1':A.cpu?'CPU':'P2';

/* ---------- drawing ---------- */
const bgC=new Map();
function mkBg(col,def){try{const s=A.scale||2,cv=document.createElement('canvas');cv.width=W*s;cv.height=H*s;const x=cv.getContext('2d');x.scale(s,s);const n=parseInt(col.slice(1),16),r=n>>16,gg=(n>>8)&255,b=n&255,la=(f,a)=>{const m=v=>Math.max(0,Math.min(255,f>1?v+(255-v)*(f-1):v*f))|0;return'rgba('+m(r)+','+m(gg)+','+m(b)+','+a+')';};
 let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,lift(col,1.2));gr.addColorStop(.55,col);gr.addColorStop(1,lift(col,.66));x.fillStyle=gr;x.fillRect(0,0,W,H);
 gr=x.createRadialGradient(W/2,-30,10,W/2,-30,250);gr.addColorStop(0,la(1.55,.32));gr.addColorStop(1,la(1.55,0));x.fillStyle=gr;x.fillRect(0,0,W,H);
 if(def){x.fillStyle='rgba(255,255,255,.045)';for(let yy=8;yy<H;yy+=16)for(let xx=8;xx<W;xx+=16)x.fillRect(xx-.5,yy-.5,1,1);}
 gr=x.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*1.05);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.32)');x.fillStyle=gr;x.fillRect(0,0,W,H);return{cv,s};}catch(e){return null;}}
A.cls=col=>{col=col||K.bg;const c=A.c;if(A.hd&&A.gfx!=='off'&&col[0]==='#'&&col.length===7&&c.drawImage&&typeof document!=='undefined'){let b=bgC.get(col);if(!b||b.s!==A.scale){b=mkBg(col,col===K.bg);if(bgC.size>10)bgC.clear();bgC.set(col,b);}if(b){c.drawImage(b.cv,0,0,W,H);return;}}
 if(A.hdOn&&col[0]==='#'&&col.length===7&&c.createLinearGradient){const g=c.createLinearGradient(0,0,0,H);if(g&&g.addColorStop){g.addColorStop(0,lift(col,1.18));g.addColorStop(1,lift(col,.72));c.fillStyle=g;}else c.fillStyle=col;}else c.fillStyle=col;c.fillRect(0,0,W,H);};
A.rect=(x,y,w,h,col)=>{const c=A.c;x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);c.fillStyle=col;c.fillRect(x,y,w,h);if(A.hdOn&&w>=5&&h>=5&&w<=110&&h<=110&&typeof col==='string'&&col[0]==='#'&&col.length===7){c.fillStyle=lift(col,1.4);c.fillRect(x,y,w,1);c.fillRect(x,y,1,h);c.fillStyle=lift(col,.6);c.fillRect(x,y+h-1,w,1);c.fillRect(x+w-1,y,1,h);}};
A.box=(x,y,w,h,col)=>{A.rect(x,y,w,1,col);A.rect(x,y+h-1,w,1,col);A.rect(x,y,1,h,col);A.rect(x+w-1,y,1,h,col);};
const gcache=new Map();const lift0=(h,f)=>{const n=parseInt(h.slice(1),16);const r=n>>16,g=(n>>8)&255,b=n&255;const m=v=>Math.max(0,Math.min(255,f>1?v+(255-v)*(f-1):v*f))|0;return`rgb(${m(r)},${m(g)},${m(b)})`;};
A.circ=(x,y,r,col)=>{const c=A.c;r=Math.max(r,.5);if(A.hdOn&&r>=3&&typeof col==='string'&&col[0]==='#'&&col.length===7&&c.createRadialGradient){const gr=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);if(gr&&gr.addColorStop){gr.addColorStop(0,lift(col,1.45));gr.addColorStop(.55,col);gr.addColorStop(1,lift(col,.55));c.fillStyle=gr;}else c.fillStyle=col;}else c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,6.2832);c.fill();};
A.ring=(x,y,r,col)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=1;c.beginPath();c.arc(x,y,Math.max(r,.5),0,6.2832);c.stroke();};
A.line=(x1,y1,x2,y2,col,w)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=w||1;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
A.poly=(pts,col,fill)=>{const c=A.c;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(fill){c.fillStyle=col;c.fill();}else{c.strokeStyle=col;c.lineWidth=1;c.stroke();}};
const FONT={A:'25755',B:'65656',C:'34443',D:'65556',E:'74647',F:'74644',G:'34553',H:'55755',I:'72227',J:'11152',K:'55655',L:'44447',M:'57755',N:'65555',O:'75557',P:'65644',Q:'25563',R:'65655',S:'34216',T:'72222',U:'55557',V:'55552',W:'55775',X:'55255',Y:'55222',Z:'71247','0':'25552','1':'26227','2':'61247','3':'61216','4':'55711','5':'74616','6':'34757','7':'71222','8':'75757','9':'75716','.':'00002',':':'02020','-':'00700','!':'22202','?':'61202','/':'11244','+':'02720','>':'42124','<':'12421',',':'00024',"'":'22000','(':'24442',')':'21112','%':'51245','=':'07070','*':'05250','$':'37276','#':'57575','_':'00007'};
const G={};for(const k in FONT){G[k]=[];for(let r=0;r<5;r++){const b=+FONT[k][r];for(let c=0;c<3;c++)if(b&(4>>c))G[k].push([c,r]);}}
A.text=(s,x,y,col,sc,al,noSh)=>{s=String(s).toUpperCase();sc=sc||1;const w=s.length*4*sc-sc;if(al==='c')x-=w/2;else if(al==='r')x-=w;x=Math.round(x);y=Math.round(y);if(!noSh&&sc>=2){A.c.fillStyle='rgba(0,0,0,.55)';let xx=x;for(const ch of s){const g=G[ch];if(g)for(const p of g)A.c.fillRect(xx+p[0]*sc+sc/2,y+p[1]*sc+sc/2,sc,sc);xx+=4*sc;}}A.c.fillStyle=col||K.w;for(const ch of s){const g=G[ch];if(g)for(const p of g)A.c.fillRect(x+p[0]*sc,y+p[1]*sc,sc,sc);x+=4*sc;}};
A.hud2=(a,b)=>{A.text(A.nm(0)+' '+a,6,4,K.c,2);A.text(b+' '+A.nm(1),W-6,4,K.p,2,'r');};


/* ---------- mini 3D (flat-shaded painter's renderer with fog) ---------- */
A.cam={x:0,y:1.2,z:-4,ry:0,rx:0,f:210};A.fog=null;A.sun=[.35,.85,-.4];let F3=[];
A.p3=(x,y,z)=>{const c=A.cam;let dx=x-c.x,dy=y-c.y,dz=z-c.z;const cy=Math.cos(c.ry),sy=Math.sin(c.ry);let tx=dx*cy-dz*sy,tz=dx*sy+dz*cy;const cx=Math.cos(c.rx),sx=Math.sin(c.rx);let ty=dy*cx-tz*sx;tz=dy*sx+tz*cx;return[160+tx*c.f/tz,120-ty*c.f/tz,tz];};
const hex2=h=>{const n=parseInt(h.slice(1),16);return[n>>16,(n>>8)&255,n&255];};
A.mix=(a,b,t)=>{const A_=hex2(a),B_=hex2(b);return'rgb('+(A_[0]+(B_[0]-A_[0])*t|0)+','+(A_[1]+(B_[1]-A_[1])*t|0)+','+(A_[2]+(B_[2]-A_[2])*t|0)+')';};
A.shade=(hex,f,z)=>{if(!hex)hex='#888888';if(hex[0]!=='#')return hex;let[r,g,b]=hex2(hex);r=Math.min(255,r*f);g=Math.min(255,g*f);b=Math.min(255,b*f);if(A.fog&&z!==undefined){const t=A.clamp((z-A.fog.near)/(A.fog.far-A.fog.near),0,1);const F_=hex2(A.fog.col);r+=(F_[0]-r)*t;g+=(F_[1]-g)*t;b+=(F_[2]-b)*t;}return'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';};
A.face=(pts,col,shade)=>{const P=pts.map(p=>A.p3(p[0],p[1],p[2]));if(P.some(p=>p[2]<.08))return;if(P.every(p=>p[0]<-40)||P.every(p=>p[0]>360)||P.every(p=>p[1]<-40)||P.every(p=>p[1]>280))return;let z=0;for(const p of P)z+=p[2];z/=P.length;let f=1;if(shade!==false){const a=pts[0],b=pts[1],c=pts[2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const n=Math.hypot(nx,ny,nz)||1;const s=A.sun,d=(nx*s[0]+ny*s[1]+nz*s[2])/n;f=.5+.5*Math.abs(d)+(d>0?.15:0);}F3.push({z,P,col:A.shade(col,f,z)});};
A.box3=(x,y,z,w,h,d,col)=>{const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2;A.face([[a,y+h,c],[b,y+h,c],[b,y+h,e],[a,y+h,e]],col);A.face([[a,y,c],[a,y+h,c],[b,y+h,c],[b,y,c]],col);A.face([[b,y,e],[b,y+h,e],[a,y+h,e],[a,y,e]],col);A.face([[a,y,e],[a,y+h,e],[a,y+h,c],[a,y,c]],col);A.face([[b,y,c],[b,y+h,c],[b,y+h,e],[b,y,e]],col);};
A.cyl3=(x,y,z,r,h,col,n,ax_)=>{n=n||8;for(let i=0;i<n;i++){const a=i/n*6.283,b=(i+1)/n*6.283;if(ax_==='x'){A.face([[x-h/2,y+Math.cos(a)*r,z+Math.sin(a)*r],[x+h/2,y+Math.cos(a)*r,z+Math.sin(a)*r],[x+h/2,y+Math.cos(b)*r,z+Math.sin(b)*r],[x-h/2,y+Math.cos(b)*r,z+Math.sin(b)*r]],col);}else{A.face([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r],[x+Math.cos(b)*r,y+h,z+Math.sin(b)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r]],col);}}if(ax_!=='x'){const top=[];for(let i=0;i<n;i++)top.push([x+Math.cos(i/n*6.283)*r,y+h,z+Math.sin(i/n*6.283)*r]);A.face(top,col);}};
A.shadow3=(x,z,w,d)=>{const P=[[x-w/2,.01,z-d/2],[x+w/2,.01,z-d/2],[x+w/2,.01,z+d/2],[x-w/2,.01,z+d/2]].map(p=>A.p3(p[0],p[1],p[2]));if(P.some(p=>p[2]<.08))return;F3.push({z:Math.max(...P.map(p=>p[2]))+.01,P,col:'rgba(0,0,0,.35)'});};
A.flush=()=>{F3.sort((a,b)=>b.z-a.z);const c=A.c;for(const f of F3){c.fillStyle=f.col;c.beginPath();c.moveTo(f.P[0][0],f.P[0][1]);for(let i=1;i<f.P.length;i++)c.lineTo(f.P[i][0],f.P[i][1]);c.closePath();c.fill();if(A.hd){c.strokeStyle=f.col;c.lineWidth=.6;c.stroke();}}F3=[];};
A.skyband=(top,bot,horizon)=>{horizon=horizon||130;for(let i=0;i<24;i++)A.rect(0,i*horizon/24,W,horizon/24+1,A.mix(top,bot,i/23));};


/* ---------- detailed human figure (feet at x,y) ---------- */
const shG=new WeakMap();
const SKIN=['#f1c7a3','#e0a57c','#c68a5e','#9a6440','#6e4428','#f6d2b8'],HAIR=['#2a1a10','#5a3a1e','#1a1a1a','#c89040','#8a2a1a','#e8e0d0'];
A.person=(x,y,o)=>{o=o||{};const s=o.s||1,c=A.c,sh=o.c||'#2fe8d0',pants=o.pants||'#2a2a3a',seed=(o.id!==undefined?o.id:(parseInt(String(sh).slice(1,7),16)||7))%6,skin=o.skin||SKIN[seed],hair=o.hair||HAIR[(seed*5+1)%6],st=o.st||0,d=o.d||1,sw=Math.sin(st)*4*s;
 c.save();c.translate(x,y);c.scale(s,s);
 if(A.hd&&A.gfx!=='off'&&c.createRadialGradient){let sg=shG.get(c);if(!sg){sg=c.createRadialGradient(0,0,0,0,0,10);sg.addColorStop(0,'rgba(0,0,0,.46)');sg.addColorStop(.55,'rgba(0,0,0,.24)');sg.addColorStop(1,'rgba(0,0,0,0)');shG.set(c,sg);}c.save();c.scale(1,.3);c.fillStyle=sg;c.beginPath();c.arc(0,0,10,0,6.283);c.fill();c.restore();}else{c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(0,0,8,2.2,0,0,6.283);c.fill();}
 const leg=(lx,a)=>{c.save();c.translate(lx,-12);c.rotate(a);c.fillStyle=pants;c.fillRect(-2,0,4.2,11);c.fillStyle='#161616';c.fillRect(-2.4+(d>0?0:-1),10,5.4,2.4);c.restore();};
 leg(-2,sw*.09);leg(2,-sw*.09);
 const arm=(ax,a)=>{c.save();c.translate(ax,-21);c.rotate(a);c.fillStyle=sh;c.fillRect(-1.6,0,3.2,5);c.fillStyle=skin;c.fillRect(-1.4,5,2.8,5);c.restore();};
 arm(-5,o.arm1!==undefined?o.arm1:-sw*.09);
 let gr=c.createLinearGradient?c.createLinearGradient(-5,0,5,0):null;if(gr&&gr.addColorStop){gr.addColorStop(0,lift(sh,1.25));gr.addColorStop(1,lift(sh,.7));c.fillStyle=gr;}else c.fillStyle=sh;
 c.beginPath();c.moveTo(-5,-23);c.lineTo(5,-23);c.lineTo(4.4,-12);c.lineTo(-4.4,-12);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.22)';c.fillRect(-4.4,-13.5,8.8,1.5);c.fillStyle=lift(sh,1.5);c.fillRect(-2,-23,4,1.3);
 if(o.num!==undefined){c.fillStyle='rgba(255,255,255,.85)';c.font='bold 5px monospace';c.textAlign='center';c.fillText(o.num,0,-15.5);}
 arm(5,o.arm2!==undefined?o.arm2:sw*.09);
 c.fillStyle=skin;c.fillRect(-1.5,-25,3,2.5);
 gr=c.createRadialGradient?c.createRadialGradient(-1.5*d,-29,.5,0,-28,5):null;if(gr&&gr.addColorStop){gr.addColorStop(0,lift(skin,1.2));gr.addColorStop(1,lift(skin,.8));c.fillStyle=gr;}else c.fillStyle=skin;
 c.beginPath();c.arc(0,-28.5,4.2,0,6.283);c.fill();
 c.fillStyle=hair;c.beginPath();c.arc(0,-29.6,4.4,Math.PI*1.02,Math.PI*1.98);c.fill();c.fillRect(-4.4,-30,1.6,2.5+seed%2*2);
 if(o.cap){c.fillStyle=o.cap;c.beginPath();c.arc(0,-29.8,4.5,Math.PI,0);c.fill();c.fillRect(d>0?0:-7,-30.2,7,1.5);}
 c.fillStyle='#1a1a1a';c.fillRect(d>0?.6:-2.2,-29,1.2,1.4);c.fillRect(d>0?2.6:-.2-2.2+1,-29,1.2,1.4);c.fillStyle='rgba(120,40,40,.6)';c.fillRect(d>0?.8:-2,-26.2,2,.7);
 c.restore();};

A.emoji=(ch,x,y,size)=>{const c=A.c;if(!c.fillText)return;c.save();c.font=size+'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ffffff';c.fillText(ch,x,y);c.restore();};
/* ---------- sound ---------- */
let ac=null,mute=false;
const SFX={blip:[440,.05],hit:[220,.08],score:[660,.15,'square',.07,440],boom:[110,.3,'sawtooth',.1,-80],jump:[300,.12,'square',.06,300],lose:[300,.5,'sawtooth',.09,-250],win:[520,.4,'square',.07,520],shoot:[880,.08,'square',.04,-600],coin:[990,.1,'square',.05,300]};
/* ---------- effects: particles, shake, confetti ---------- */
A.fx=[];A.shake=0;const lastB={x:W/2,y:54,t:-99};
A.burst=(x,y,col,n,sp)=>{if(A.silent)return;lastB.x=x;lastB.y=y;lastB.t=A.t;for(let i=0;i<(n||12);i++){const a=A.rnd(6.283),v=(sp||2)*(0.4+A.rnd(1));A.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,t:20+A.ri(20),c:col||K.y,g:.08});}};
A.confetti=()=>{for(let i=0;i<70;i++)A.fx.push({x:A.rnd(W),y:-10-A.rnd(40),vx:A.rnd(2)-1,vy:1+A.rnd(2),t:80+A.ri(60),c:[K.y,K.p,K.c,K.g,K.o,'#ff4d00'][i%6],g:.02,w:3+A.ri(3),cf:1,ph:i*1.7});};
A.fxStep=()=>{for(const p of A.fx){p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.t--;}A.fx=A.fx.filter(p=>p.t>0);if(A.shake>0)A.shake--;};
const glowC=new Map();function glowSpr(col){let s=glowC.get(col);if(s!==undefined)return s;if(glowC.size>80)glowC.clear();s=null;try{s=document.createElement('canvas');s.width=s.height=32;const x=s.getContext('2d'),gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,col);gr.addColorStop(.25,col);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);}catch(e){s=null;}glowC.set(col,s);return s;}
function popDraw(p){const c=A.c;if(!A.hd||!c.fillText){c.globalAlpha=Math.min(1,p.t/20);A.text(p.txt,p.x,p.y,p.c,2,'c');c.globalAlpha=1;return;}
 if(p.t0===undefined)p.t0=p.t;const age=p.t0-p.t,k=age<7?.55+.6*Math.sin(age/7*2.2):1,z=p.pop?11:10,s=String(p.txt).toUpperCase();
 c.save();c.globalAlpha=Math.min(1,p.t/14);c.font=z+"px 'PA Display',Anton,Impact,'Arial Narrow',sans-serif";const hw=c.measureText(s).width/2+2;c.translate(A.clamp(p.x,hw,W-hw),p.y+5);c.scale(k,k);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=2.6;c.strokeStyle='rgba(0,0,0,.75)';c.strokeText(s,0,0);c.fillStyle=p.c;c.fillText(s,0,0);c.restore();}
A.fxDraw=()=>{const c=A.c,lo=A.hd&&A.gfx!=='off',hi=lo&&A.gfx==='high'&&c.drawImage;
 if(!lo){for(const p of A.fx){if(p.txt){popDraw(p);continue;}c.fillStyle=p.c;c.fillRect(p.x|0,p.y|0,p.w||2,p.w||2);}return;}
 if(hi){c.globalCompositeOperation='lighter';for(const p of A.fx){if(p.txt||p.cf||typeof p.c!=='string')continue;const s=glowSpr(p.c);if(!s)continue;const a=Math.min(1,p.t/18),r=(p.w||2)*2.6+2;c.globalAlpha=a*.45;c.drawImage(s,p.x+1-r,p.y+1-r,r*2,r*2);}c.globalCompositeOperation='source-over';}
 for(const p of A.fx){if(p.txt)continue;const a=Math.min(1,p.t/12);c.globalAlpha=a;c.fillStyle=p.c;if(p.cf){const w=p.w,f=Math.cos(p.t*.22+p.ph),fw=w*Math.abs(f)+.5;if(f<0)c.globalAlpha=a*.7;c.fillRect(p.x+w/2-fw/2,p.y,fw,w*.62);continue;}const w=(p.w||2)*(.55+.45*a);c.fillRect(p.x+(p.w||2)/2-w/2,p.y+(p.w||2)/2-w/2,w,w);}
 c.globalAlpha=1;for(const p of A.fx)if(p.txt)popDraw(p);};
A.sfx=n=>{if(n==='boom'&&!A.silent)A.shake=8;if(mute||A.silent)return;const s=SFX[n];if(!s)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type=s[2]||'square';o.frequency.setValueAtTime(s[0],t);if(s[4])o.frequency.linearRampToValueAtTime(Math.max(40,s[0]+s[4]),t+s[1]);g.gain.setValueAtTime(s[3]||.06,t);g.gain.linearRampToValueAtTime(0,t+s[1]);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+s[1]);}catch(e){}};

/* ---------- input ---------- */
const N=['l','r','u','d','a','b'],keys={},vk={};let tap={};
const MAP1={l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],a:['KeyF','Space'],b:['KeyG','ShiftLeft']};
const MAP2={l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],a:['Enter','Slash','Period'],b:['ShiftRight','Comma']};
const MAPS={};for(const n of N)MAPS[n]=MAP1[n].concat(MAP2[n],n==='a'?['KeyZ']:n==='b'?['KeyX']:[]);
const held=[{},{}],hitS=[{},{}],prev=[{},{}];let botPrev={};
let state='hub';
function poll(){A.mouse.dx=mdx;A.mouse.dy=mdy;mdx=0;mdy=0;if(A.mouse.t>0)A.mouse.t--;const split=A.two&&state==='play';for(let p=0;p<2;p++){const m=split?(p?MAP2:MAP1):(p?null:MAPS);for(const n of N){let v=m?m[n].some(k=>keys[k]||tap[k]):false;if(p===0&&(vk[n]||mtap[n]||(n==='a'&&A.mouse.down)||(n==='b'&&A.mouse.bdown)))v=true;hitS[p][n]=v&&(!prev[p][n]||(p===0&&mtap[n+'!']));prev[p][n]=v;held[p][n]=v;}}tap={};mtap={};}
A.in=p=>held[p];A.hit=p=>hitS[p];
A.typed=[];A.mouse={x:160,y:120,dx:0,dy:0,t:0,down:false};const fireT={};A.fire=(rate,p)=>{p=p||0;if(A.hit(p).a||(A.in(p).a&&A.t-(fireT[p]||-999)>=rate)){fireT[p]=A.t;return true;}return false;};let mdx=0,mdy=0,mtap={};
A.bot=o=>{for(const n of N){const v=!!o[n];hitS[1][n]=v&&!botPrev[n];botPrev[n]=v;held[1][n]=v;}};
A._set=(p,o)=>{for(const n of N){const v=!!o[n];hitS[p][n]=v&&!held[p][n];held[p][n]=v;}}; /* test hook */

/* ---------- shell ---------- */
let cur=null,g=null,sel=0,hot=false,turn=0,ts=[0,0],overT=0,paused=false,record=false;
/* ---------- profile (GitHub username, local), tokens, leaderboard via GitHub issues ---------- */
const REPO='Normansrule/pixel-arcade';
A.profile=(()=>{try{return JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};}catch(e){return{user:'',tokens:0,played:0,wins:0};}})();
A.saveProfile=()=>{try{localStorage.setItem('pxd_profile',JSON.stringify(A.profile));}catch(e){}A.renderProfile&&A.renderProfile();};
A.setUser=u=>{A.profile.user=(u||'').trim().replace(/^@/,'').slice(0,39);A.saveProfile();};
const hsKey=()=>'pxd_hs_'+(A.profile.user?A.profile.user.toLowerCase()+'_':'')+cur.id;
A.award=g=>{const p=A.profile;p.played++;let t=5;const win=/WIN|CLEAR|COMPLETE|VICTORY|1ST|SOLVED|PERFECT|CHECKOUT|ACE|DEFENDED|ALIGNED|GALLERY|FLOODED|SUMMIT|FLOW|HOME|CHAMP|ROYAL/.test(g.over)||(/PLAYER 1 WINS/.test(g.over)&&A.cpu);if(win){p.wins++;t+=A.cpu?[10,20,35][A.lvl]:15;}if(!cur.vs&&g.score>0)t+=Math.min(20,Math.floor(Math.log2(g.score+1)));p.tokens+=t;g.tok=t;A.saveProfile();};
A.level=()=>Math.floor(Math.sqrt(A.profile.tokens/40))+1;
A.submitScore=(g)=>{const u=A.profile.user;const title=`[score] ${cur.id} ${g.score}`;const body=`Game: ${cur.name}\nScore: ${g.score}\nMode: ${cur.vs?(A.cpu?'vs CPU '+['easy','normal','hard'][A.lvl]:'2 players'):'solo'}\nResult: ${g.over}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;window.open('https://github.com/'+REPO+'/issues/new?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body),'_blank');};
A.leaderboard=async id=>{const r=await fetch('https://api.github.com/search/issues?q='+encodeURIComponent('repo:'+REPO+' in:title "[score] '+id+' "')+'&per_page=50');if(!r.ok)throw new Error('GitHub API '+r.status);const j=await r.json();const rows=[];for(const it of j.items||[]){const m=/^\[score\]\s+(\S+)\s+(-?\d+)/.exec(it.title);if(!m||m[1]!==id)continue;rows.push({user:it.user.login,avatar:it.user.avatar_url,score:+m[2],url:it.html_url,date:it.created_at.slice(0,10)});}const low=!!cur&&cur.low;rows.sort((a,b)=>low?a.score-b.score:b.score-a.score);const seen=new Set();return rows.filter(r=>!seen.has(r.user)&&seen.add(r.user)).slice(0,10);};
function getHS(){try{const v=localStorage.getItem(hsKey());return v===null?null:+v;}catch(e){return null;}}
function setHS(v){try{localStorage.setItem(hsKey(),v);}catch(e){}}
// every cabinet runs against a round clock: per-game `time` (seconds) or a category default
const LIMITS={PUZZLE:300,BOARD:360,CARDS:360,SIM:300,VERSUS:180,PARTY:120,SPORTS:180,ACTION:180,CLASSICS:180,'RETRO 3D':180};
const TIMES={chess:900,checkers:600,gomoku:480,uttt:480,battleship:480,mancala:480,dominoes:480,hex:480,dicepoker:360,eights:360,war:300,snakes:300,freecell:600,spider:600,sudoku6:420,nonogram:420};
A.limitOf=gm=>gm.time||TIMES[gm.id]||LIMITS[gm.cat]||180;let clock=0,clockMax=0;A.clock=()=>clock;A.setClock=v=>{clock=v;};
function begin(){botPrev={};A.t=0;howEnd=230;g=cur.make();state='play';paused=false;clockMax=clock=A.limitOf(cur)*60;}
function start(){hot=false;A.cpu=false;A.two=false;if(cur.vs){if(sel===0)A.cpu=true;else A.two=true;}else if(sel===1){hot=true;turn=0;ts=[0,0];}A.ai=[.5,.75,1][A.lvl];begin();}
/* ---------- cabinet UI layer: HD typography, cards, chrome (drawn at backing resolution) ---------- */
const ACC='#ff4d00',FD="'PA Display',Anton,Impact,'Arial Narrow',sans-serif",FM="'PA Mono','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const WIN_RE=/WIN|CLEAR|COMPLETE|VICTORY|1ST|SOLVED|PERFECT|CHECKOUT|ACE|DEFENDED|ALIGNED|GALLERY|FLOODED|SUMMIT|FLOW|HOME|CHAMP|ROYAL/;
const isWin=o=>WIN_RE.test(o)&&!/WINS!/.test(o)||/PLAYER 1 WINS/.test(o)&&A.cpu;
let TOUCH=false;try{TOUCH=matchMedia('(pointer:coarse)').matches;}catch(e){}
let howEnd=230,LS=null,sT=0,pT=0,toastT=0,toastM='',hits=[];
const ease=t=>{t=t<0?0:t>1?1:t;return 1-Math.pow(1-t,3);};
const fmtT=f=>{const s=Math.max(0,Math.ceil(f/60));return(s/60|0)+':'+String(s%60).padStart(2,'0');};
const fmtN=n=>typeof n==='number'?n.toLocaleString('en-US'):String(n);
function font(f,z,w){A.c.font=(w?w+' ':'')+z+'px '+(f==='d'?FD:FM);}
function tx(s,x,y,o){const c=A.c;o=o||{};s=String(s);font(o.f,o.z||7,o.w);if(LS===null)LS='letterSpacing' in c;c.textAlign=o.a==='c'?'center':o.a==='r'?'right':'left';c.textBaseline=o.b||'alphabetic';if(o.ls&&LS)c.letterSpacing=o.ls+'px';c.fillStyle=o.c||'#f2f2f2';if(o.mw)c.fillText(s,x,y,o.mw);else c.fillText(s,x,y);if(o.ls&&LS)c.letterSpacing='0px';}
function tw(s,o){o=o||{};font(o.f,o.z||7,o.w);return A.c.measureText(String(s)).width+(o.ls&&LS?o.ls*String(s).length:0);}
function rr(x,y,w,h,r){const c=A.c;c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else{c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}}
function frr(x,y,w,h,r,col){rr(x,y,w,h,r);A.c.fillStyle=col;A.c.fill();}
function srr(x,y,w,h,r,col){const c=A.c,l=1/(A.scale||2);rr(x+l/2,y+l/2,w-l,h-l,r);c.strokeStyle=col;c.lineWidth=l;c.stroke();}
function hair(x,y,w,col){A.c.fillStyle=col;A.c.fillRect(x,y,w,1/(A.scale||2));}
function wrap(s,maxW,o){const ws=String(s||'').split(/\s+/),L=[''];for(const w of ws){const t=(L[L.length-1]+' '+w).trim();if(tw(t,o)>maxW&&L[L.length-1])L.push(w);else L[L.length-1]=t;}return L.filter(Boolean);}
const hov=(x,y,w,h)=>A.mouse.t>0&&!document.pointerLockElement&&A.mouse.x>=x&&A.mouse.x<=x+w&&A.mouse.y>=y&&A.mouse.y<=y+h;
/* keycap + label chip; returns width */
function kchip(x,y,k,l,o){o=o||{};const kz=5.6,kw=Math.max(11,tw(k,{z:kz,w:700})+7),lw=l?tw(l,{z:6}):0,w=kw+(l?lw+5:0),h=11,on=o.fn&&hov(x-2,y-2,w+4,h+4);
 if(on)frr(x-3,y-2,w+6,h+4,4,'rgba(255,77,0,.14)');
 frr(x,y,kw,h,2.5,o.hot?ACC:'#1b1b1b');srr(x,y,kw,h,2.5,o.hot?ACC:'#3a3a3a');tx(k,x+kw/2,y+h/2+.4,{z:kz,w:700,a:'c',b:'middle',c:o.hot?'#000':'#f2f2f2'});
 if(l)tx(l,x+kw+5,y+h/2+.4,{z:6,b:'middle',c:on?'#fff':o.dim?'#5c5c5c':'#a3a3a3'});if(o.fn)hits.push({x:x-3,y:y-2,w:w+6,h:h+4,fn:o.fn,pass:o.pass});return w;}
function krow(items,cx,y,gap){gap=gap||10;const ws=items.map(i=>{const kw=Math.max(11,tw(i.k,{z:5.6,w:700})+7);return kw+(i.l?tw(i.l,{z:6})+5:0);});let x=cx-(ws.reduce((a,b)=>a+b,0)+gap*(items.length-1))/2;items.forEach((i,n)=>{kchip(x,y,i.k,i.l,i);x+=ws[n]+gap;});}
function pill(x,y,s,o){o=o||{};const z=o.z||5.6,w=tw(s,{z,w:700,ls:.6})+10,h=o.h||11;if(o.fill)frr(x,y,w,h,h/2,o.fill);else srr(x,y,w,h,h/2,o.line||'rgba(255,255,255,.22)');tx(s,x+w/2,y+h/2+.4,{z,w:700,ls:.6,a:'c',b:'middle',c:o.c||'#d9d9d9'});return w;}
/* blurred, darkened copy of the current frame behind menus */
let blurC=null;function veil(k,dark){const c=A.c;if(!c.canvas||!c.drawImage){c.globalAlpha=k*(dark||.6);c.fillStyle='#000';c.fillRect(0,0,W,H);c.globalAlpha=1;return;}
 if(A.gfx!=='off'){try{if(!blurC){blurC=document.createElement('canvas');blurC.width=160;blurC.height=120;}const bx=blurC.getContext('2d');bx.imageSmoothingEnabled=true;bx.imageSmoothingQuality='high';if('filter' in bx){bx.filter='blur(2.5px)';bx.drawImage(c.canvas,-6,-6,172,132);bx.filter='none';}else{bx.drawImage(c.canvas,0,0,40,30);bx.drawImage(blurC,0,0,40,30,0,0,160,120);}c.save();c.imageSmoothingEnabled=true;c.globalAlpha=k;c.drawImage(blurC,0,0,W,H);c.restore();}catch(e){}}
 c.globalAlpha=k*(dark||.6);c.fillStyle='#050505';c.fillRect(0,0,W,H);c.globalAlpha=1;}
function card(x,y,w,h,a){const c=A.c;c.save();if(A.gfx!=='off'){c.shadowColor='rgba(0,0,0,'+(.7*a)+')';c.shadowBlur=30;c.shadowOffsetY=8;}frr(x,y,w,h,6,'rgba(10,10,10,.94)');c.restore();srr(x,y,w,h,6,'rgba(255,255,255,.13)');A.c.fillStyle=ACC;A.c.fillRect(x+14,y,26,1);}
function anim(e,dy,fn){const c=A.c;c.save();c.globalAlpha*=e;c.translate(0,(1-e)*(dy===undefined?8:dy));fn();c.restore();}
A.toast=m=>{toastM=m;toastT=100;};
function toastDraw(){if(toastT<=0)return;toastT--;const a=Math.min(1,toastT/16,(100-toastT)/8);anim(a,-6,()=>{const w=tw(toastM,{z:6.5,w:700,ls:.8})+20;frr(W/2-w/2,8,w,15,7.5,'rgba(8,8,8,.9)');srr(W/2-w/2,8,w,15,7.5,'rgba(255,77,0,.6)');tx(toastM,W/2,15.9,{z:6.5,w:700,ls:.8,a:'c',b:'middle'});});}

function drawTitle(){const c=A.c;A.cls();if(demo){const sv=A.silent,sf=A.fx,sc=A.cpu,st=A.two;A.silent=true;A.fx=[];A.cpu=true;A.two=false;try{A.bot({});demo.update();if(demo.over)demo=cur.make();demo.draw();A.flush&&A.flush();}catch(_){demo=null;}A.silent=sv;A.fx=sf;A.cpu=sc;A.two=st;}
 veil(1,.5);let gr=c.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(0,0,0,.35)');gr.addColorStop(.45,'rgba(0,0,0,.05)');gr.addColorStop(1,'rgba(0,0,0,.7)');c.fillStyle=gr;c.fillRect(0,0,W,H);
 if(A.gfx!=='off'){gr=c.createRadialGradient(W/2,86,4,W/2,86,150);gr.addColorStop(0,'rgba(255,77,0,.10)');gr.addColorStop(1,'rgba(255,77,0,0)');c.fillStyle=gr;c.fillRect(0,0,W,H);}
 const e=i=>ease((sT-4-i*4)/22),best=cur.vs?null:getHS(),L=A.limitOf(cur);
 /* top row: chips + stats */
 anim(e(0),-6,()=>{let x=12;x+=pill(x,11,cur.cat,{fill:ACC,c:'#000'})+5;x+=pill(x,11,cur.vs?'VS CPU · 2P':'SOLO')+5;if(cur.hd)x+=pill(x,11,'3D')+5;if(cur.mouse)x+=pill(x,11,'MOUSE')+5;if(cur.typing)x+=pill(x,11,'KEYBOARD')+5;
  tx('TIME '+fmtT(L*60),W-12,18.6,{z:6,w:700,ls:.6,a:'r',b:'middle',c:'#9a9a9a'});if(best!==null){const bw=tw('TIME '+fmtT(L*60),{z:6,w:700,ls:.6});tx('BEST '+fmtN(best),W-22-bw,18.6,{z:6,w:700,ls:.6,a:'r',b:'middle',c:'#f2f2f2'});}
  hair(12,30,W-24,'rgba(255,255,255,.12)');});
 /* name */
 anim(e(1),12,()=>{const nm=cur.name,dot=/[A-Z0-9]$/.test(nm);let z=Math.min(46,46*292/Math.max(1,tw(nm+(dot?'.':''),{f:'d',z:46})));z=Math.max(20,z);const w=tw(nm,{f:'d',z}),dw=dot?tw('.',{f:'d',z}):0,x0=W/2-(w+dw)/2,by=50+z*.62+10;
  c.save();if(A.gfx!=='off'){c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=18;}tx(nm,x0,by,{f:'d',z,mw:292});c.restore();if(dot)tx('.',x0+w,by,{f:'d',z,c:ACC});
  const lw=Math.min(w,120)*e(2);c.fillStyle=ACC;c.fillRect(W/2-lw/2,by+8,lw,1);});
 anim(e(2),8,()=>{wrap(cur.how,262,{z:6.6,ls:.3}).slice(0,2).forEach((l,i)=>tx(l,W/2,122+i*10,{z:6.6,ls:.3,a:'c',c:'#c9c9c9'}));});
 /* mode selector */
 const ops=cur.vs?['VS CPU','2 PLAYERS']:['1 PLAYER','2P TAKE TURNS'];
 anim(e(3),8,()=>{const bw=112,gap=6,x0=W/2-bw-gap/2;ops.forEach((o,i)=>{const x=x0+i*(bw+gap),y=152,on=sel===i,hv=hov(x,y,bw,18);frr(x,y,bw,18,9,on?ACC:hv?'rgba(255,255,255,.08)':'rgba(10,10,10,.6)');srr(x,y,bw,18,9,on?ACC:hv?'rgba(255,255,255,.4)':'rgba(255,255,255,.2)');tx(o,x+bw/2,y+9.6,{z:7,w:700,ls:.8,a:'c',b:'middle',c:on?'#000':'#bdbdbd'});hits.push({x,y,w:bw,h:18,fn:()=>{sel=i;},pass:true});});});
 anim(e(4),8,()=>{const y=178;if(cur.vs&&sel===0){const lv=['EASY','NORMAL','HARD'],sw=52,x0=W/2-sw*1.5;tx('CPU',x0-8,y+6.4,{z:5.6,w:700,ls:.8,a:'r',b:'middle',c:'#7a7a7a'});srr(x0,y,sw*3,13,6.5,'rgba(255,255,255,.2)');lv.forEach((l,i)=>{const x=x0+i*sw,on=A.lvl===i,hv=hov(x,y,sw,13);if(on)frr(x+1.5,y+1.5,sw-3,10,5,'#f2f2f2');else if(hv)frr(x+1.5,y+1.5,sw-3,10,5,'rgba(255,255,255,.1)');tx(l,x+sw/2,y+6.8,{z:5.8,w:700,ls:.6,a:'c',b:'middle',c:on?'#000':'#9a9a9a'});hits.push({x,y,w:sw,h:13,fn:()=>{if(A.lvl!==i){A.lvl=i;A.sfx('blip');}}});});tx('◀ ▶',x0+sw*3+8,y+6.6,{z:5.6,b:'middle',c:'#5f5f5f'});}
  else if(cur.vs&&sel===1)krow([{k:'P1',l:'WASD + F / G'},{k:'P2',l:'ARROWS + ENTER / SHIFT'}],W/2,y+1,14);
  else if(cur.typing)krow([{k:'A–Z',l:'TYPE'},{k:'ENTER',l:'SUBMIT'},{k:'⌫',l:'DELETE'}],W/2,y+1);
  else if(cur.mouse)krow([{k:'MOUSE',l:'AIM'},{k:'CLICK',l:'FIRE'},{k:'←→↑↓',l:'ALT'}],W/2,y+1);
  else krow([{k:'←→↑↓',l:'MOVE'},{k:'SPACE',l:'A'},{k:'X',l:'B'}],W/2,y+1);});
 /* start prompt + footer */
 anim(e(5),6,()=>{const p=.6+.4*Math.sin(sT*.09);c.globalAlpha*=p;tx(TOUCH?'TAP TO PLAY':'PRESS SPACE OR CLICK TO PLAY',W/2,210,{z:7.6,w:700,ls:1.4,a:'c',b:'middle'});c.globalAlpha/=p;const tw2=tw(TOUCH?'TAP TO PLAY':'PRESS SPACE OR CLICK TO PLAY',{z:7.6,w:700,ls:1.4});c.fillStyle=ACC;c.beginPath();const ax=W/2-tw2/2-9;c.moveTo(ax,206.5);c.lineTo(ax+5,210);c.lineTo(ax,213.5);c.fill();});
 if(!TOUCH)anim(e(6),0,()=>{hair(12,222,W-24,'rgba(255,255,255,.08)');const ks=[['ESC','LOBBY'],['P','PAUSE'],['R','RESTART'],['M','MUTE'],['G','GFX'],['L','SCORES']];let tot=0;const ws=ks.map(([k,l])=>{const w=tw(k,{z:5.4,w:700})+3+tw(l,{z:5.4});tot+=w;return w;});let x=W/2-(tot+9*(ks.length-1))/2;ks.forEach(([k,l],i)=>{tx(k,x,231,{z:5.4,w:700,b:'middle',c:'#d0d0d0'});tx(l,x+tw(k,{z:5.4,w:700})+3,231,{z:5.4,b:'middle',c:'#6a6a6a'});x+=ws[i]+9;});});}

function clockUI(){if(!(state==='play'&&clockMax))return;const c=A.c,f=clock/clockMax,lo=clock<=600,hd=A.hd;
 if(!hd){c.globalAlpha=lo?.9:.45;A.rect(0,H-2,W*f,2,lo?(A.t%30<15?K.r:K.y):K.w);c.globalAlpha=1;return;}
 c.fillStyle='rgba(255,255,255,.07)';c.fillRect(0,H-1,W,1);c.fillStyle=lo?ACC:'rgba(255,255,255,.42)';c.fillRect(0,H-1,W*f,1);
 if(lo&&clock>0){const n=Math.ceil(clock/60),fr=(clock%60)/60,pop=1+.18*ease((fr-.82)/.18),pw=34,px=W/2-pw/2,py=H-17;
  c.fillStyle=ACC;c.globalAlpha=.6+.4*fr;c.fillRect(W*f-2,H-2,3,2);c.globalAlpha=1;
  c.save();c.translate(W/2,py+6);c.scale(pop,pop);c.translate(-W/2,-py-6);frr(px,py,pw,12,6,'rgba(8,8,8,.86)');srr(px,py,pw,12,6,n<=3?ACC:'rgba(255,77,0,.5)');tx('0:'+String(n).padStart(2,'0'),W/2,py+6.5,{z:6.6,w:700,ls:.4,a:'c',b:'middle',c:n<=3?'#fff':'#ffb08a'});c.restore();
  if(n<=3){const k=ease(1-fr);c.save();c.globalAlpha=.42*Math.pow(fr,1.4);c.translate(W/2,H/2);c.scale(1+k*.35,1+k*.35);tx(String(n),0,0,{f:'d',z:72,a:'c',b:'middle',c:'#fff'});c.restore();}}}

function howStrip(){if(hot){const w=tw('P'+(turn+1)+' TURN',{z:6,w:700,ls:.8})+16;frr(W/2-w/2,H-17,w,12,6,'rgba(8,8,8,.82)');tx('P'+(turn+1)+' TURN',W/2,H-10.6,{z:6,w:700,ls:.8,a:'c',b:'middle',c:ACC});return;}
 if(A.t>=howEnd||(clockMax&&clock<=600))return;const a=ease(Math.min(A.t-6,howEnd-A.t)/14);if(a<=0)return;const L=wrap(cur.how,236,{z:6.2,ls:.2}).slice(0,2),h=L.length>1?27:17,tg=tw('HOW TO',{z:5.4,w:700,ls:1}),w=Math.min(W-16,Math.max(...L.map(l=>tw(l,{z:6.2,ls:.2})))+tg+30);
 anim(a,10,()=>{const x=W/2-w/2,y=H-8-h;frr(x,y,w,h,7,'rgba(8,8,8,.84)');srr(x,y,w,h,7,'rgba(255,255,255,.12)');tx('HOW TO',x+10,y+h/2+.4,{z:5.4,w:700,ls:1,b:'middle',c:ACC});A.c.fillStyle='rgba(255,255,255,.15)';A.c.fillRect(x+16+tg,y+4,1/(A.scale||2),h-8);L.forEach((l,i)=>tx(l,x+22+tg,y+h/2+.4+(L.length>1?(i-.5)*10:0),{z:6.2,ls:.2,b:'middle',c:'#e6e6e6'}));});}

function pauseCard(){const e=ease(pT/12);veil(e,.55);anim(e,10,()=>{const how=wrap(cur.how,212,{z:6.4,ls:.2}).slice(0,3),w=244,h=118+how.length*10,x=W/2-w/2,y=H/2-h/2;card(x,y,w,h,e);
 tx('PAUSED',x+14,y+17,{z:6,w:700,ls:1.6,b:'middle',c:ACC});tx(clockMax?fmtT(clock)+' LEFT':'',x+w-14,y+17,{z:6,w:700,ls:.6,a:'r',b:'middle',c:'#8a8a8a'});
 tx(cur.name,x+14,y+46,{f:'d',z:Math.min(24,24*(w-28)/Math.max(1,tw(cur.name,{f:'d',z:24}))),mw:w-28});
 how.forEach((l,i)=>tx(l,x+14,y+62+i*10,{z:6.4,ls:.2,c:'#bdbdbd'}));const ry=y+66+how.length*10;hair(x+14,ry,w-28,'rgba(255,255,255,.1)');
 krow([{k:'P',l:'RESUME',hot:1,fn:()=>{paused=false;}},{k:'R',l:'RESTART',fn:()=>{if(hot){turn=0;ts=[0,0];}begin();}},{k:'ESC',l:'LOBBY',fn:()=>A.close()}],W/2,ry+12);
 krow([{k:'M',l:mute?'SOUND OFF':'SOUND ON',fn:()=>A.toggleMute()},{k:'G',l:'GFX '+A.gfx.toUpperCase(),fn:()=>A.cycleGfx()}].concat(!cur.vs||A.cpu?[{k:'L',l:'SCORES',fn:()=>A.showBoard(cur)}]:[]),W/2,ry+30);});}

function resultCard(kind){const e=ease(sT/16),c=A.c;veil(e,.5);anim(e,12,()=>{const solo=kind==='over'&&!hot&&!cur.vs,w=248;let h=kind==='swap'?132:solo||hot?150:124;const x=W/2-w/2,y=H/2-h/2-4;card(x,y,w,h,e);
 const mode=hot?'2P TAKE TURNS':cur.vs?(A.cpu?'VS CPU · '+['EASY','NORMAL','HARD'][A.lvl]:'2 PLAYERS'):'SOLO';
 tx(kind==='swap'?'ROUND 1 OF 2':'RESULT',x+14,y+17,{z:6,w:700,ls:1.6,b:'middle',c:ACC});tx(mode,x+w-14,y+17,{z:6,w:700,ls:.6,a:'r',b:'middle',c:'#8a8a8a'});
 let head,won=false;if(kind==='swap')head='PLAYER 1 DONE';else if(hot){const wv=ts[0]===ts[1]?-1:(cur.low?ts[0]<ts[1]:ts[0]>ts[1])?0:1;head=wv<0?'DRAW!':'PLAYER '+(wv+1)+' WINS!';won=wv>=0;}else{head=g.over;won=isWin(g.over);}
 const hz=Math.min(30,30*(w-28)/Math.max(1,tw(head,{f:'d',z:30})));tx(head,x+14,y+48,{f:'d',z:hz,c:won?ACC:'#f2f2f2',mw:w-28});hair(x+14,y+58,w-28,'rgba(255,255,255,.1)');
 const cu=ease(sT/40);
 if(kind==='swap'){tx('SCORE',x+14,y+72,{z:5.6,w:700,ls:1,c:'#7a7a7a',b:'middle'});tx(fmtN(Math.round(ts[0]*cu)),x+14,y+94,{f:'d',z:24});tx('PLAYER 2, GET READY',x+w-14,y+92,{z:6.4,w:700,ls:.6,a:'r',c:'#bdbdbd'});}
 else if(hot){[0,1].forEach(i=>{const cx=x+14+i*(w-28)/2,win=(cur.low?ts[i]<ts[1-i]:ts[i]>ts[1-i]);tx('PLAYER '+(i+1),cx,y+72,{z:5.6,w:700,ls:1,b:'middle',c:win?ACC:'#7a7a7a'});tx(fmtN(Math.round(ts[i]*cu)),cx,y+100,{f:'d',z:28,c:win?'#fff':'#9a9a9a'});});if(g.tok)pill(x+14,y+110,'+'+g.tok+' TOKENS',{line:'rgba(255,77,0,.6)',c:'#ffb08a'});}
 else if(solo){tx('SCORE',x+14,y+72,{z:5.6,w:700,ls:1,b:'middle',c:'#7a7a7a'});const sv=fmtN(typeof g.score==='number'?Math.round(g.score*cu):g.score);tx(sv,x+14,y+104,{f:'d',z:34});const sw_=tw(fmtN(g.score),{f:'d',z:34});
  const b=getHS(),rx=x+w-14;tx('BEST',rx,y+72,{z:5.6,w:700,ls:1,a:'r',b:'middle',c:'#7a7a7a'});tx(b===null?'—':fmtN(b),rx,y+90,{f:'d',z:16,a:'r',c:record?ACC:'#d9d9d9'});
  if(g.tok){const tw_=tw('+'+g.tok+' TOKENS',{z:5.6,w:700,ls:.6})+10;pill(rx-tw_,y+96,'+'+g.tok+' TOKENS',{line:'rgba(255,77,0,.6)',c:'#ffb08a'});}
  if(record&&sT>20){const k=ease((sT-20)/10),bx_=x+14+sw_+10;c.save();c.translate(bx_,y+93);c.scale(k,k);pill(0,-5.5,'NEW BEST',{fill:ACC,c:'#000'});c.restore();}}
 else{if(g.tok)pill(x+14,y+68,'+'+g.tok+' TOKENS',{line:'rgba(255,77,0,.6)',c:'#ffb08a'});tx('LV '+A.level()+' · '+fmtN(A.profile.tokens)+' TOKENS TOTAL',x+w-14,y+73.4,{z:5.6,ls:.4,a:'r',b:'middle',c:'#7a7a7a'});}
 const ready=overT>30,ay=y+h-22;hair(x+14,ay-8,w-28,'rgba(255,255,255,.08)');
 if(kind==='swap')krow([{k:'SPACE',l:'PLAYER 2 START',hot:ready,dim:!ready,pass:ready,fn:()=>{}},{k:'ESC',l:'LOBBY',fn:()=>A.close()}],W/2,ay);
 else krow([{k:'SPACE',l:'AGAIN',hot:ready,dim:!ready,pass:ready,fn:()=>{}},{k:'ESC',l:'LOBBY',fn:()=>A.close()}].concat(!hot&&(!cur.vs||A.cpu)?[{k:'U',l:'POST',fn:()=>A.submitScore(g)},{k:'L',l:'TOP 10',fn:()=>A.showBoard(cur)}]:[]),W/2,ay,9);});}

function step(){poll();A.t++;sT++;const h=hitS[0];
 if(state==='title'){if(h.u||h.d){sel^=1;A.sfx('blip');}if(cur.vs&&sel===0){if(h.l&&A.lvl>0){A.lvl--;A.sfx('blip');}if(h.r&&A.lvl<2){A.lvl++;A.sfx('blip');}}if(h.a){A.sfx('coin');start();}}
 else if(state==='play'){if(paused){pT++;return;}pT=0;if(A.t>50&&howEnd>A.t+14&&N.some(n=>held[0][n]))howEnd=A.t+14;const s0=g.score;g.update();A.fxStep();if(!g.over&&clock>0){clock--;if(clock<=600&&clock%60===0&&clock>0&&!A.silent)A.sfx('blip');if(clock===0){g.over=cur.vs?(g.timeUp?g.timeUp():'TIME UP · DRAW'):'TIME UP';g.timeout=true;}}
  if(!cur.vs&&typeof g.score==='number'&&g.score>s0&&!A.silent){const d=g.score-s0;if(d>=5||A.t%6===0){const near=A.t-lastB.t<=2,px=near?A.clamp(lastB.x,24,W-24):W/2+A.rnd(60)-30,py=near?A.clamp(lastB.y-10,34,H-20):54;A.fx.push({txt:'+'+d,x:px,y:py,vx:0,vy:near?-.45:-.3,t:40,c:d>=50?K.y:K.w,g:0,pop:1});}}
  if(g.over){overT=0;sT=0;record=false;A.award(g);if(isWin(g.over))A.confetti();if(hot){ts[turn]=g.score;state=turn===0?'swap':'over';}else{state='over';if(!cur.vs){const b=getHS();if(b===null||(cur.low?g.score<b:g.score>b)){if(!(cur.low&&g.lost)){setHS(g.score);record=true;}}}}A.sfx(record||/WIN|CLEAR/.test(g.over)?'win':'lose');}}
 else if(state==='swap'){overT++;if(overT>30&&h.a){turn=1;begin();}}
 else if(state==='over'){overT++;A.fxStep();if(overT>30&&h.a){if(hot){turn=0;ts=[0,0];}begin();}}
}
function crtFx(){if(crtOn>0){crtOn--;A.c.globalAlpha=Math.pow(crtOn/crtMax,1.6);A.c.fillStyle='#000';A.c.fillRect(0,0,W,H);A.c.globalAlpha=1;}}
let crtEl=null;
function render(){hits=[];
 if(state==='title'){bloom(false);drawTitle();toastDraw();return;}
 if(!g)return;g.draw();A.flush&&A.flush();
 if(state==='play'){A.fxDraw();clockUI();bloom(!paused);if(paused)pauseCard();else howStrip();}
 else if(state==='swap'){bloom(false);A.fxDraw();resultCard('swap');}
 else if(state==='over'){bloom(false);resultCard('over');A.fxDraw();}
 toastDraw();
 if(!crtEl)crtEl=document.querySelector('.crt');if(crtEl){const s=paused?0:A.shake;crtEl.style.transform=s>0?'translate('+(A.rnd(s)-s/2)+'px,'+(A.rnd(s)-s/2)+'px)':'';}}
let last=0,acc=0;
/* bloom: thresholded (v^4 via self-multiply) low-res copy, blurred + screen-blended by CSS; ambient colour sampled rarely */
let bloomC=null,ambC=null,needFit=true,pauseLbl=null;
function bloom(live){if(A.gfx==='off'||!A.c.canvas)return;if(!bloomC){bloomC=document.getElementById('bloom');if(!bloomC)return;}const bx=bloomC.getContext('2d'),scr=A.c.canvas;if(!live){bx.globalCompositeOperation='destination-out';bx.fillStyle='rgba(0,0,0,.18)';bx.fillRect(0,0,bloomC.width,bloomC.height);bx.globalCompositeOperation='source-over';return;}if(A.gfx==='low'&&A.t%2)return;
 bx.globalCompositeOperation='copy';bx.drawImage(scr,0,0,bloomC.width,bloomC.height);bx.globalCompositeOperation='multiply';bx.drawImage(bloomC,0,0);bx.drawImage(bloomC,0,0);bx.globalCompositeOperation='source-over';
 if(A.gfx==='high'&&A.t%20===0){try{if(!ambC){ambC=document.createElement('canvas');ambC.width=4;ambC.height=3;}const ax=ambC.getContext('2d',{willReadFrequently:true});ax.drawImage(bloomC,0,0,4,3);const d=ax.getImageData(0,0,4,3).data;let r=0,g2=0,b=0;for(let i=0;i<d.length;i+=4){r+=d[i];g2+=d[i+1];b+=d[i+2];}const n=d.length/4,m=Math.max(1,r/n,g2/n,b/n),k=Math.min(1,m/60);if(!crtEl)crtEl=document.querySelector('.crt');if(crtEl)crtEl.style.setProperty('--amb','rgba('+(r/n/m*255|0)+','+(g2/n/m*255|0)+','+(b/n/m*255|0)+','+(.08+.22*k).toFixed(2)+')');}catch(e){}}}
function frame(ts_){if(state==='hub')return;if(needFit){needFit=false;fitScr();}acc+=Math.min(100,ts_-last);last=ts_;let n=0;while(acc>=16.667&&n<5){step();acc-=16.667;n++;}if(n===5)acc=0;if(state!=='hub'){render();crtFx();if(pauseLbl!==paused){pauseLbl=paused;const pb=document.getElementById('pause');if(pb)pb.setAttribute('aria-pressed',paused);const pl=pb&&pb.querySelector('span');if(pl)pl.textContent=paused?'Resume':'Pause';}}requestAnimationFrame(frame);}
let demo=null,crtOn=0,crtMax=24;A.open=game=>{cur=game;sel=0;state='title';sT=0;toastT=0;paused=false;A.fx=[];g=null;A.setHD(true);crtOn=crtMax=20;try{const sv=A.silent;A.silent=true;demo=game.make();A.silent=sv;}catch(_){demo=null;}try{if(location.hash!=='#'+game.id)history.replaceState(null,'','#'+game.id);}catch(e){}document.body.classList.add('playing');needFit=true;
 const nm=document.getElementById('cabname'),mt=document.getElementById('cabmeta');if(nm)nm.textContent=tc(game.name);if(mt)mt.textContent=tc(game.cat)+' · '+(game.vs?'VS CPU · 2P':'Solo');
 last=performance.now();acc=0;requestAnimationFrame(frame);};
A.close=()=>{state='hub';g=null;paused=false;if(document.exitPointerLock&&document.pointerLockElement)document.exitPointerLock();A.mouse.down=false;A.mouse.bdown=false;A.setHD(false);try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}document.body.classList.remove('playing');if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});const f=document.querySelector('[data-id="'+(cur&&cur.id)+'"]');if(f)f.focus();};
A.toggleMute=()=>{mute=!mute;const b=document.getElementById('mute');if(b){b.setAttribute('aria-pressed',mute);const s=b.querySelector('span');(s||b).textContent=mute?'Sound off':'Sound on';}if(state!=='hub')A.toast(mute?'SOUND OFF':'SOUND ON');};
/* graphics: off / low / high, stored per browser */
const GFX=['off','low','high'];
A.gfx=(()=>{try{const v=localStorage.getItem('pxd_gfx2D');if(GFX.includes(v))return v;}catch(e){}try{return matchMedia('(pointer:coarse)').matches?'low':'high';}catch(e){return'high';}})();
function syncGfx(){const cab=document.getElementById('cab');if(cab)cab.dataset.gfx=A.gfx;const b=document.getElementById('gfx');if(b){const s=b.querySelector('span');(s||b).textContent='GFX '+A.gfx;b.title='Graphics: '+A.gfx+' (G)';}}
A.setGfx=v=>{if(!GFX.includes(v))return;A.gfx=v;try{localStorage.setItem('pxd_gfx2D',v);}catch(e){}syncGfx();needFit=true;bgC.clear();if(state!=='hub')A.toast('GRAPHICS · '+v.toUpperCase());};
A.cycleGfx=()=>A.setGfx(GFX[(GFX.indexOf(A.gfx)+1)%3]);
const tc=t=>t.split(' ').map(w=>/\d/.test(w)?w:w.charAt(0)+w.slice(1).toLowerCase()).join(' ');
A.preview=(gm,cv,fps)=>{let t;try{A.silent=true;t=gm.make();}catch(e){return()=>{};}const off=document.createElement('canvas');off.width=320;off.height=240;const octx=off.getContext('2d');octx.imageSmoothingEnabled=false;const x=cv.getContext('2d');x.imageSmoothingEnabled=false;let f=0,alive=true;
 const id=setInterval(()=>{if(!alive||state!=='hub')return;const sc=A.c,st=A.t,scpu=A.cpu,stwo=A.two,ss=A.silent,sfx=A.fx;A.c=octx;A.silent=true;A.cpu=true;A.two=false;A.fx=[];try{const k=f%30<15?{r:1,a:f%7===0}:{l:1,u:f%5===0,a:f%9===0};A._set(0,f%60<30?k:{d:1,a:f%6===0});A.bot({});A.t=f;t.update();A.cls();t.draw();A.flush&&A.flush();x.drawImage(off,0,0,cv.width,cv.height);if(t.over)t=gm.make();}catch(e){alive=false;}A.c=sc;A.t=st;A.cpu=scpu;A.two=stwo;A.silent=ss;A.fx=sfx;A._set(0,{});f++;},1000/(fps||30));
 return()=>{alive=false;clearInterval(id);};};
A.hdOn=true;A.hd=false;A.scale=1;
function fitScr(){const scr=document.getElementById('scr');if(!scr)return;const dpr=window.devicePixelRatio||1;let s=1;if(A.hd){s=2;if(A.gfx==='high'){const r=scr.getBoundingClientRect();if(r.width>0)s=Math.max(2,Math.min(dpr>=1.5?4:3,Math.round(r.width*dpr/320)));}}
 const cw=320*s;if(scr.width!==cw){scr.width=cw;scr.height=240*s;}A.c=scr.getContext('2d');A.c.setTransform(s,0,0,s,0,0);A.c.imageSmoothingEnabled=false;A.scale=s;
 if(A.hd){const r=scr.getBoundingClientRect(),q=r.width*dpr/cw;scr.style.imageRendering=q>.98&&Math.abs(q-Math.round(q))<.03?'pixelated':'auto';}else scr.style.imageRendering='';}
A.setHD=on=>{const scr=document.getElementById('scr');if(!scr||A.hd===on)return;A.hd=on;fitScr();};
function boot(){
 const scr=document.getElementById('scr');A.c=scr.getContext('2d');A.c.imageSmoothingEnabled=false;
 const PREV=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Slash'];
 addEventListener('keydown',e=>{if(state==='hub')return;keys[e.code]=true;if(!e.repeat)tap[e.code]=1;if(PREV.includes(e.code))e.preventDefault();
  if(e.code==='Escape'){if(A.closeBoard&&A.closeBoard())return;A.close();}else if(cur&&cur.typing&&state==='play'&&!paused&&(/^Key[A-Z]$/.test(e.code)||e.code==='Backspace'||e.code==='Enter')){A.typed.push(e.code==='Backspace'?'<':e.code==='Enter'?'>':e.code.slice(3));e.preventDefault();}else if((e.code==='KeyP'||e.code==='KeyH')&&state==='play')paused=!paused;else if(e.code==='KeyR'&&(state==='play'||state==='over')&&cur){if(hot){turn=0;ts=[0,0];}begin();}else if(e.code==='KeyM')A.toggleMute();else if(e.code==='KeyG'&&(state!=='play'||paused))A.cycleGfx();else if(state==='over'&&g&&e.code==='KeyU'&&(!cur.vs||A.cpu))A.submitScore(g);else if((state==='over'||state==='title')&&e.code==='KeyL')A.showBoard(cur);});
 addEventListener('keyup',e=>{keys[e.code]=false;});
 addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
 document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k,on=e=>{e.preventDefault();vk[k]=true;b.classList.add('on');},off=e=>{e.preventDefault();vk[k]=false;b.classList.remove('on');};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);});
 const toGame=ev=>{const r=scr.getBoundingClientRect();return[(ev.clientX-r.left)/r.width*320,(ev.clientY-r.top)/r.height*240];};
 scr.addEventListener('contextmenu',ev=>ev.preventDefault());
 scr.addEventListener('pointerdown',ev=>{ev.preventDefault();if(state!=='play'||paused){const[hx,hy]=toGame(ev);A.mouse.x=hx;A.mouse.y=hy;A.mouse.t=240;const ht=hits.find(q=>hx>=q.x&&hx<=q.x+q.w&&hy>=q.y&&hy<=q.y+q.h);if(ht){ht.fn();if(!ht.pass)return;}else if(state==='play'&&paused)return;}if(cur&&cur.mouse&&state==='play'&&document.pointerLockElement!==scr&&scr.requestPointerLock){try{scr.requestPointerLock();}catch(_){}}if(ev.button===2){A.mouse.bdown=true;mtap.b=1;mtap['b!']=1;}else{A.mouse.down=true;mtap.a=1;mtap['a!']=1;}const[x,y]=toGame(ev);A.mouse.x=x;A.mouse.y=y;A.mouse.t=240;});
 addEventListener('pointerup',ev=>{if(ev.button===2)A.mouse.bdown=false;else A.mouse.down=false;});
 scr.addEventListener('pointermove',ev=>{if(document.pointerLockElement===scr){mdx+=ev.movementX;mdy+=ev.movementY;A.mouse.t=240;return;}const[x,y]=toGame(ev);if(Math.abs(x-A.mouse.x)+Math.abs(y-A.mouse.y)>.5)A.mouse.t=240;A.mouse.dx=0;mdx+=x-A.mouse.x;mdy+=y-A.mouse.y;A.mouse.x=x;A.mouse.y=y;});
 document.getElementById('back').onclick=A.close;document.getElementById('mute').onclick=A.toggleMute;
 document.getElementById('pause').onclick=()=>{if(state==='play')paused=!paused;};
 const gb=document.getElementById('gfx');if(gb)gb.onclick=()=>A.cycleGfx();syncGfx();
 const fb=document.getElementById('fs'),cabEl=document.getElementById('cab');if(fb){if(!(cabEl&&cabEl.requestFullscreen))fb.hidden=true;fb.onclick=()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else if(cabEl&&cabEl.requestFullscreen)cabEl.requestFullscreen().catch(()=>{});};document.addEventListener('fullscreenchange',()=>{fb.setAttribute('aria-pressed',!!document.fullscreenElement);needFit=true;});}
 addEventListener('resize',()=>{needFit=true;});if(window.ResizeObserver){const crt=document.querySelector('.crt');if(crt)new ResizeObserver(()=>{needFit=true;}).observe(crt);}
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play'&&g&&!g.over)paused=true;});
 try{if(document.fonts&&document.fonts.load){document.fonts.load('20px "PA Display"');document.fonts.load('700 10px "PA Mono"');document.fonts.load('10px "PA Mono"');}}catch(e){}
 /* profile chip + leaderboard modal */
 const chip=document.getElementById('profile');A.renderProfile=()=>{if(!chip)return;const p=A.profile;chip.innerHTML='';const img=document.createElement('img');img.alt='';img.src=p.user?'https://github.com/'+encodeURIComponent(p.user)+'.png?size=64':'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3a2a78"/><circle cx="16" cy="12" r="6" fill="#ffcf3f"/><rect x="6" y="20" width="20" height="10" fill="#ffcf3f"/></svg>');img.onerror=()=>{img.src='';img.style.background='#3a2a78';};chip.appendChild(img);const t=document.createElement('span');t.innerHTML='<b></b><i></i>';t.querySelector('b').textContent=p.user?'@'+p.user:'GUEST · CLICK TO SIGN IN';t.querySelector('i').textContent='LV '+A.level()+' · '+p.tokens+' TOKENS · '+p.wins+' WINS';chip.appendChild(t);};
 if(chip){chip.onclick=()=>{const u=prompt('Your GitHub username (scores are saved per name in this browser; posting to the global board opens GitHub):',A.profile.user||'');if(u!==null)A.setUser(u);};A.renderProfile();}
 const board=document.getElementById('board');A.showBoard=async gm=>{if(!board)return;board.hidden=false;board.querySelector('h3').textContent=tc(gm.name)+' · GLOBAL TOP 10';const ol=board.querySelector('ol');ol.innerHTML='<li>Loading from GitHub...</li>';try{const rows=await A.leaderboard(gm.id);ol.innerHTML=rows.length?'':'<li>No scores posted yet. Be the first: press U on the game-over screen.</li>';rows.forEach((r,i)=>{const li=document.createElement('li');const a=document.createElement('a');a.href=r.url;a.target='_blank';a.rel='noopener';const im=document.createElement('img');im.src=r.avatar+'&s=48';im.alt='';a.appendChild(im);const sp=document.createElement('span');sp.textContent='@'+r.user;a.appendChild(sp);const sc=document.createElement('b');sc.textContent=r.score;a.appendChild(sc);const d=document.createElement('i');d.textContent=r.date;a.appendChild(d);li.appendChild(a);ol.appendChild(li);});}catch(err){ol.innerHTML='<li>Could not reach GitHub ('+err.message+'). Try again in a minute.</li>';}};
 A.closeBoard=()=>{if(board&&!board.hidden){board.hidden=true;return true;}return false;};if(board){board.querySelector('button').onclick=A.closeBoard;}
 /* build hub */
 const grid=document.getElementById('grid'),chips=document.getElementById('chips'),count=document.getElementById('count');
 const cats=['All'].concat([...new Set(A.games.map(x=>x.cat))]);let filt='All';
 const ls=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d;}catch(e){return d;}},lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
 const favs=new Set(ls('pxd_favs',[]));let recent=ls('pxd_recent',[]);
 A.played=id=>{recent=[id].concat(recent.filter(x=>x!==id)).slice(0,12);lsSet('pxd_recent',recent);syncChips();};{const _o=A.open;A.open=g=>{if(g&&g.id)A.played(g.id);return _o(g);};}
 const q=document.getElementById('q'),rndB=document.getElementById('rnd');if(q)q.oninput=()=>show();if(rndB)rndB.onclick=()=>A.open(A.games[Math.random()*A.games.length|0]);
 const norm=v=>(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');function show(){const s=norm(q&&q.value);let n=0;grid.querySelectorAll('.cab').forEach(el=>{const ok=(filt==='All'||el.dataset.cat===filt||(filt==='FAV'&&favs.has(el.dataset.id))||(filt==='RECENT'&&recent.includes(el.dataset.id)))&&(!s||el.dataset.id.includes(s)||norm(el.querySelector('.nm').textContent).includes(s)||norm(el.dataset.tags).includes(s));el.hidden=!ok;if(ok)n++;});grid.querySelectorAll('section').forEach(sec=>{sec.hidden=!sec.querySelector('.cab:not([hidden])');});chips.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===filt));const em=document.getElementById('empty');if(em)em.hidden=n>0;}
 cats.forEach(c=>{const b=document.createElement('button');b.type='button';b.dataset.c=c;const n=c==='All'?A.games.length:A.games.filter(x=>x.cat===c).length;b.textContent=(c==='All'?'All':tc(c))+' '+n;b.onclick=()=>{filt=c;show();if(c!=='All'){const sec=document.getElementById('cat-'+c.replace(/\W/g,''));if(sec)sec.scrollIntoView({behavior:'smooth',block:'start'});}};chips.appendChild(b);});
 const special=[['RECENT','↺ Recent'],['FAV','★ Favorites']].map(([c,l])=>{const b=document.createElement('button');b.type='button';b.dataset.c=c;b.className='sp';b.onclick=()=>{filt=filt===c?'All':c;show();};chips.insertBefore(b,chips.children[1]||null);return [b,l,c];});
 function syncChips(){special.forEach(([b,l,c])=>{const n=c==='FAV'?favs.size:recent.length;b.textContent=l+' '+n;b.hidden=!n&&filt!==c;});if(filt!=='All')show();}syncChips();
 A.silent=true;A.cpu=true;
 const BL={SPORTS:'Courts, pitches, lanes and slopes.',CLASSICS:'The golden age, rebuilt from scratch.',VERSUS:'Grab a friend or fight the machine.','RETRO 3D':'Polygon worlds with fog, shadows and speed.',BOARD:'Real search behind every CPU move.',PUZZLE:'Think, then think faster.',ACTION:'Shooters, brawlers and a fighting roster.',CARDS:'Green felt, proper suits, house rules.',SIM:'Zoos, farms, pets and reefs to look after.',PARTY:'Quick head-to-head rounds. Loud, fast, fair.'};
 A._thumbQ=[];let pumping=0;A._pump=()=>{if(pumping)return;pumping=1;const run=()=>{if(state!=='hub'){setTimeout(run,300);return;}const t0=performance.now();while(A._thumbQ.length&&performance.now()-t0<12)A._thumbQ.pop()();if(A._thumbQ.length)requestAnimationFrame(run);else pumping=0;};requestAnimationFrame(run);};
 const secs={};A.games.forEach(gm=>{if(!secs[gm.cat]){const sec=document.createElement('section');sec.id='cat-'+gm.cat.replace(/\W/g,'');sec.className='shelf';const hd=document.createElement('header');hd.innerHTML='<h2></h2><span class="cnt"></span>';hd.querySelector('h2').textContent=tc(gm.cat);hd.querySelector('.cnt').textContent=A.games.filter(x=>x.cat===gm.cat).length;sec.appendChild(hd);const g2=document.createElement('div');g2.className='row';sec.appendChild(g2);grid.appendChild(sec);secs[gm.cat]=g2;}
  const el=document.createElement('button');el.type='button';el.className='cab';el.dataset.cat=gm.cat;el.dataset.id=gm.id;el.dataset.tags=((gm.tags||'')+' '+(gm.how||'')).toLowerCase();el.style.setProperty('--i',secs[gm.cat].children.length%8);
  const mq=document.createElement('span');mq.className='mq';mq.textContent=gm.href?(gm.id==='critterkart'?'8 PLAYER 3D':gm.id==='petbrawl'?'AUTO-BATTLER':gm.id==='voxel3d'?'SANDBOX 3D':gm.id==='rocket3d'?'CAR SOCCER 3D':gm.id==='abyss3d'?'OCEAN 3D':'FULL 3D'):gm.vs?'VS CPU · 2P':gm.hd?'3D':'SOLO';el.appendChild(mq);
  const bez=document.createElement('span');bez.className='bez';const cv=document.createElement('canvas');cv.width=320;cv.height=240;bez.appendChild(cv);const play=document.createElement('i');play.className='play';play.textContent='▶';bez.appendChild(play);el.appendChild(bez);
  const nm=document.createElement('span');nm.className='nm';nm.textContent=tc(gm.name);el.appendChild(nm);
  const acts=document.createElement('span');acts.className='acts';if(gm.src){const s=document.createElement('a');s.href='https://github.com/Normansrule/pixel-arcade/blob/main/'+gm.src;s.target='_blank';s.rel='noopener';s.title='View source on GitHub';s.textContent='</>';s.onclick=ev=>ev.stopPropagation();acts.appendChild(s);}if(!gm.href&&!gm.vs){const b=document.createElement('span');b.className='lb';b.title='Leaderboard';b.textContent='TOP';b.onclick=ev=>{ev.stopPropagation();A.showBoard(gm);};acts.appendChild(b);}{const f=document.createElement('span');f.className='fav';f.setAttribute('role','button');f.title='Favorite';const upd=()=>{f.textContent=favs.has(gm.id)?'★':'☆';f.classList.toggle('on',favs.has(gm.id));};upd();f.onclick=ev=>{ev.stopPropagation();favs.has(gm.id)?favs.delete(gm.id):favs.add(gm.id);lsSet('pxd_favs',[...favs]);upd();syncChips();};acts.appendChild(f);}el.appendChild(acts);
  el.addEventListener('pointermove',ev=>{const r=el.getBoundingClientRect(),px=(ev.clientX-r.left)/r.width,py=(ev.clientY-r.top)/r.height;el.style.setProperty('--px',(px*100).toFixed(1)+'%');el.style.setProperty('--py',(py*100).toFixed(1)+'%');el.style.setProperty('--rx',((.5-py)*10).toFixed(2)+'deg');el.style.setProperty('--ry',((px-.5)*12).toFixed(2)+'deg');});
  el.addEventListener('pointerleave',()=>{el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');});
  const bt=document.createElement('span');bt.className='btns';bt.innerHTML='<i></i><i></i><i></i>';el.appendChild(bt);el.onclick=()=>{if(gm.href){A.played(gm.id);location.href=gm.href;}else A.open(gm);};secs[gm.cat].appendChild(el);
  const live=()=>{const sv=A.silent,sc=A.cpu,sf=A.fx;A.silent=true;A.cpu=true;A.fx=[];try{const t=gm.make();for(let i=0;i<(gm.warm||45);i++){A.bot({});t.update();if(t.over)break;}A.cls();t.draw();A.flush&&A.flush();const x=cv.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(scr,0,0,320,240);}catch(e){console.warn('thumb',gm.id,e);}A.silent=sv;A.cpu=sc;A.fx=sf;};
  // prefer a pre-rendered thumbnail (docs/thumbs, made by thumbs.py); fall back to rendering the game live
  const thumb=()=>{const im=new Image();im.onload=()=>cv.getContext('2d').drawImage(im,0,0,320,240);if(gm.img){im.src=gm.img;return;}im.onerror=()=>{A._thumbQ.push(live);A._pump();};im.src='docs/thumbs/'+gm.id+'.jpg';};el.__live=live;
  // thumbnails render lazily as cabinets approach the viewport, a few per frame, only while the lobby is showing
  if(window.IntersectionObserver&&!window.__eagerThumbs){el.__thumb=thumb;(A._thumbIO=A._thumbIO||new IntersectionObserver(es=>{for(const en of es)if(en.isIntersecting&&en.target.__thumb){const f=en.target.__thumb;en.target.__thumb=null;A._thumbIO.unobserve(en.target);f();}},{rootMargin:'600px 0px'})).observe(el);}else thumb();
  if(!gm.href){let stop=null;el.addEventListener('pointerenter',()=>{if(!stop&&!matchMedia('(prefers-reduced-motion: reduce)').matches)stop=A.preview(gm,cv);});el.addEventListener('pointerleave',()=>{if(stop){stop();stop=null;}});}});
 const tk=document.getElementById('ticker');if(tk){const s=A.games.map(x=>tc(x.name)).join('  ✦  ')+'  ✦  ';tk.innerHTML='<span></span><span></span>';tk.children[0].textContent=s;tk.children[1].textContent=s;}
 /* reveal on scroll */
 if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{rootMargin:'0px 0px -8% 0px'});document.querySelectorAll('.cab,.shelf header,.feat,.stat').forEach(el=>io.observe(el));}
 /* stats */
 const st={games:A.games.length,vs:A.games.filter(x=>x.vs).length,hd:A.games.filter(x=>x.hd||x.href).length,cats:cats.length-1};A.ready=true;dispatchEvent(new Event('arcade-ready'));document.querySelectorAll('[data-stat]').forEach(el=>{const v=st[el.dataset.stat]||0;let n=0;const iv=setInterval(()=>{n=Math.min(v,n+Math.max(1,v/40|0));el.textContent=n;if(n>=v)clearInterval(iv);},30);});
 /* pointer glow + hero parallax */
 const glow=document.getElementById('glow');addEventListener('pointermove',e=>{if(glow){glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';}document.documentElement.style.setProperty('--mx',(e.clientX/innerWidth-.5).toFixed(3));document.documentElement.style.setProperty('--my',(e.clientY/innerHeight-.5).toFixed(3));});
 A.silent=false;A.cpu=false;if(count)count.textContent=A.games.length;show();
 const want=(location.hash||'').slice(1),direct=A.games.find(x=>x.id===want);if(direct)A.open(direct);addEventListener('hashchange',()=>{const id=location.hash.slice(1),gm=A.games.find(x=>x.id===id);if(gm&&(state==='hub'||!cur||cur.id!==id)){if(state!=='hub')A.close();A.open(gm);}});
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();}
})();
