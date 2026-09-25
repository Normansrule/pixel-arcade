/* PIXEL ARCADE engine: 320x240 canvas, bitmap font, input, sound, game shell */
(function(){
'use strict';
const W=320,H=240;
const A=window.A={W,H,t:0,cpu:false,two:false,lvl:1,ai:.75,c:null,silent:false,games:[]};
A.K={bg:'#0d0926',w:'#fff3d6',r:'#ff4f6d',g:'#3dff8b',b:'#4dabff',y:'#ffcf3f',o:'#ff9838',p:'#ff4f9a',c:'#2fd6c3',d:'#2b2257',gr:'#8d86b8',k:'#000'};
const K=A.K;
A.add=g=>A.games.push(g);
A.rnd=n=>Math.random()*n;A.ri=n=>Math.random()*n|0;A.clamp=(v,a,b)=>v<a?a:v>b?b:v;
A.win=i=>i===0?'PLAYER 1 WINS!':A.cpu?'CPU WINS!':'PLAYER 2 WINS!';
A.nm=i=>i===0?'P1':A.cpu?'CPU':'P2';

/* ---------- drawing ---------- */
A.cls=col=>{A.c.fillStyle=col||K.bg;A.c.fillRect(0,0,W,H);};
A.rect=(x,y,w,h,col)=>{A.c.fillStyle=col;A.c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
A.box=(x,y,w,h,col)=>{A.rect(x,y,w,1,col);A.rect(x,y+h-1,w,1,col);A.rect(x,y,1,h,col);A.rect(x+w-1,y,1,h,col);};
A.circ=(x,y,r,col)=>{const c=A.c;c.fillStyle=col;c.beginPath();c.arc(x,y,Math.max(r,.5),0,6.2832);c.fill();};
A.ring=(x,y,r,col)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=1;c.beginPath();c.arc(x,y,Math.max(r,.5),0,6.2832);c.stroke();};
A.line=(x1,y1,x2,y2,col,w)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=w||1;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
A.poly=(pts,col,fill)=>{const c=A.c;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(fill){c.fillStyle=col;c.fill();}else{c.strokeStyle=col;c.lineWidth=1;c.stroke();}};
const FONT={A:'25755',B:'65656',C:'34443',D:'65556',E:'74647',F:'74644',G:'34553',H:'55755',I:'72227',J:'11152',K:'55655',L:'44447',M:'57755',N:'65555',O:'75557',P:'65644',Q:'25563',R:'65655',S:'34216',T:'72222',U:'55557',V:'55552',W:'55775',X:'55255',Y:'55222',Z:'71247','0':'25552','1':'26227','2':'61247','3':'61216','4':'55711','5':'74616','6':'34757','7':'71222','8':'75757','9':'75716','.':'00002',':':'02020','-':'00700','!':'22202','?':'61202','/':'11244','+':'02720','>':'42124','<':'12421',',':'00024',"'":'22000','(':'24442',')':'21112','%':'51245','=':'07070','*':'05250'};
const G={};for(const k in FONT){G[k]=[];for(let r=0;r<5;r++){const b=+FONT[k][r];for(let c=0;c<3;c++)if(b&(4>>c))G[k].push([c,r]);}}
A.text=(s,x,y,col,sc,al)=>{s=String(s).toUpperCase();sc=sc||1;const w=s.length*4*sc-sc;if(al==='c')x-=w/2;else if(al==='r')x-=w;x=Math.round(x);y=Math.round(y);A.c.fillStyle=col||K.w;for(const ch of s){const g=G[ch];if(g)for(const p of g)A.c.fillRect(x+p[0]*sc,y+p[1]*sc,sc,sc);x+=4*sc;}};
A.hud2=(a,b)=>{A.text(A.nm(0)+' '+a,6,4,K.c,2);A.text(b+' '+A.nm(1),W-6,4,K.p,2,'r');};


/* ---------- mini 3D (flat-shaded painter's renderer with fog) ---------- */
A.cam={x:0,y:1.2,z:-4,ry:0,rx:0,f:210};A.fog=null;A.sun=[.35,.85,-.4];let F3=[];
A.p3=(x,y,z)=>{const c=A.cam;let dx=x-c.x,dy=y-c.y,dz=z-c.z;const cy=Math.cos(c.ry),sy=Math.sin(c.ry);let tx=dx*cy-dz*sy,tz=dx*sy+dz*cy;const cx=Math.cos(c.rx),sx=Math.sin(c.rx);let ty=dy*cx-tz*sx;tz=dy*sx+tz*cx;return[160+tx*c.f/tz,120-ty*c.f/tz,tz];};
const hex2=h=>{const n=parseInt(h.slice(1),16);return[n>>16,(n>>8)&255,n&255];};
A.mix=(a,b,t)=>{const A_=hex2(a),B_=hex2(b);return'rgb('+(A_[0]+(B_[0]-A_[0])*t|0)+','+(A_[1]+(B_[1]-A_[1])*t|0)+','+(A_[2]+(B_[2]-A_[2])*t|0)+')';};
A.shade=(hex,f,z)=>{if(hex[0]!=='#')return hex;let[r,g,b]=hex2(hex);r=Math.min(255,r*f);g=Math.min(255,g*f);b=Math.min(255,b*f);if(A.fog&&z!==undefined){const t=A.clamp((z-A.fog.near)/(A.fog.far-A.fog.near),0,1);const F_=hex2(A.fog.col);r+=(F_[0]-r)*t;g+=(F_[1]-g)*t;b+=(F_[2]-b)*t;}return'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';};
A.face=(pts,col,shade)=>{const P=pts.map(p=>A.p3(p[0],p[1],p[2]));if(P.some(p=>p[2]<.08))return;if(P.every(p=>p[0]<-40)||P.every(p=>p[0]>360)||P.every(p=>p[1]<-40)||P.every(p=>p[1]>280))return;let z=0;for(const p of P)z+=p[2];z/=P.length;let f=1;if(shade!==false){const a=pts[0],b=pts[1],c=pts[2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const n=Math.hypot(nx,ny,nz)||1;const s=A.sun,d=(nx*s[0]+ny*s[1]+nz*s[2])/n;f=.5+.5*Math.abs(d)+(d>0?.15:0);}F3.push({z,P,col:A.shade(col,f,z)});};
A.box3=(x,y,z,w,h,d,col)=>{const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2;A.face([[a,y+h,c],[b,y+h,c],[b,y+h,e],[a,y+h,e]],col);A.face([[a,y,c],[a,y+h,c],[b,y+h,c],[b,y,c]],col);A.face([[b,y,e],[b,y+h,e],[a,y+h,e],[a,y,e]],col);A.face([[a,y,e],[a,y+h,e],[a,y+h,c],[a,y,c]],col);A.face([[b,y,c],[b,y+h,c],[b,y+h,e],[b,y,e]],col);};
A.cyl3=(x,y,z,r,h,col,n,ax_)=>{n=n||8;for(let i=0;i<n;i++){const a=i/n*6.283,b=(i+1)/n*6.283;if(ax_==='x'){A.face([[x-h/2,y+Math.cos(a)*r,z+Math.sin(a)*r],[x+h/2,y+Math.cos(a)*r,z+Math.sin(a)*r],[x+h/2,y+Math.cos(b)*r,z+Math.sin(b)*r],[x-h/2,y+Math.cos(b)*r,z+Math.sin(b)*r]],col);}else{A.face([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r],[x+Math.cos(b)*r,y+h,z+Math.sin(b)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r]],col);}}if(ax_!=='x'){const top=[];for(let i=0;i<n;i++)top.push([x+Math.cos(i/n*6.283)*r,y+h,z+Math.sin(i/n*6.283)*r]);A.face(top,col);}};
A.shadow3=(x,z,w,d)=>{const P=[[x-w/2,.01,z-d/2],[x+w/2,.01,z-d/2],[x+w/2,.01,z+d/2],[x-w/2,.01,z+d/2]].map(p=>A.p3(p[0],p[1],p[2]));if(P.some(p=>p[2]<.08))return;F3.push({z:Math.max(...P.map(p=>p[2]))+.01,P,col:'rgba(0,0,0,.35)'});};
A.flush=()=>{F3.sort((a,b)=>b.z-a.z);const c=A.c;for(const f of F3){c.fillStyle=f.col;c.beginPath();c.moveTo(f.P[0][0],f.P[0][1]);for(let i=1;i<f.P.length;i++)c.lineTo(f.P[i][0],f.P[i][1]);c.closePath();c.fill();if(A.hd){c.strokeStyle=f.col;c.lineWidth=.6;c.stroke();}}F3=[];};
A.skyband=(top,bot,horizon)=>{horizon=horizon||130;for(let i=0;i<24;i++)A.rect(0,i*horizon/24,W,horizon/24+1,A.mix(top,bot,i/23));};

/* ---------- sound ---------- */
let ac=null,mute=false;
const SFX={blip:[440,.05],hit:[220,.08],score:[660,.15,'square',.07,440],boom:[110,.3,'sawtooth',.1,-80],jump:[300,.12,'square',.06,300],lose:[300,.5,'sawtooth',.09,-250],win:[520,.4,'square',.07,520],shoot:[880,.08,'square',.04,-600],coin:[990,.1,'square',.05,300]};
A.sfx=n=>{if(mute||A.silent)return;const s=SFX[n];if(!s)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type=s[2]||'square';o.frequency.setValueAtTime(s[0],t);if(s[4])o.frequency.linearRampToValueAtTime(Math.max(40,s[0]+s[4]),t+s[1]);g.gain.setValueAtTime(s[3]||.06,t);g.gain.linearRampToValueAtTime(0,t+s[1]);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+s[1]);}catch(e){}};

/* ---------- input ---------- */
const N=['l','r','u','d','a','b'],keys={},vk={};let tap={};
const MAP1={l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],a:['KeyF','Space'],b:['KeyG','ShiftLeft']};
const MAP2={l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],a:['Enter','Slash','Period'],b:['ShiftRight','Comma']};
const MAPS={};for(const n of N)MAPS[n]=MAP1[n].concat(MAP2[n],n==='a'?['KeyZ']:n==='b'?['KeyX']:[]);
const held=[{},{}],hitS=[{},{}],prev=[{},{}];let botPrev={};
let state='hub';
function poll(){const split=A.two&&state==='play';for(let p=0;p<2;p++){const m=split?(p?MAP2:MAP1):(p?null:MAPS);for(const n of N){let v=m?m[n].some(k=>keys[k]||tap[k]):false;if(p===0&&vk[n])v=true;hitS[p][n]=v&&!prev[p][n];prev[p][n]=v;held[p][n]=v;}}tap={};}
A.in=p=>held[p];A.hit=p=>hitS[p];
A.bot=o=>{for(const n of N){const v=!!o[n];hitS[1][n]=v&&!botPrev[n];botPrev[n]=v;held[1][n]=v;}};
A._set=(p,o)=>{for(const n of N){const v=!!o[n];hitS[p][n]=v&&!held[p][n];held[p][n]=v;}}; /* test hook */

/* ---------- shell ---------- */
let cur=null,g=null,sel=0,hot=false,turn=0,ts=[0,0],overT=0,paused=false,record=false;
const hsKey=()=>'pxd_hs_'+cur.id;
function getHS(){try{const v=localStorage.getItem(hsKey());return v===null?null:+v;}catch(e){return null;}}
function setHS(v){try{localStorage.setItem(hsKey(),v);}catch(e){}}
function begin(){botPrev={};A.t=0;g=cur.make();state='play';paused=false;}
function start(){hot=false;A.cpu=false;A.two=false;if(cur.vs){if(sel===0)A.cpu=true;else A.two=true;}else if(sel===1){hot=true;turn=0;ts=[0,0];}A.ai=[.5,.75,1][A.lvl];begin();}
function step(){poll();A.t++;const h=hitS[0];
 if(state==='title'){if(h.u||h.d){sel^=1;A.sfx('blip');}if(cur.vs&&sel===0){if(h.l&&A.lvl>0){A.lvl--;A.sfx('blip');}if(h.r&&A.lvl<2){A.lvl++;A.sfx('blip');}}if(h.a){A.sfx('coin');start();}}
 else if(state==='play'){if(paused)return;g.update();if(g.over){overT=0;record=false;if(hot){ts[turn]=g.score;state=turn===0?'swap':'over';}else{state='over';if(!cur.vs){const b=getHS();if(b===null||(cur.low?g.score<b:g.score>b)){if(!(cur.low&&g.lost)){setHS(g.score);record=true;}}}}A.sfx(record||/WIN|CLEAR/.test(g.over)?'win':'lose');}}
 else if(state==='swap'){overT++;if(overT>30&&h.a){turn=1;begin();}}
 else if(state==='over'){overT++;if(overT>30&&h.a){if(hot){turn=0;ts=[0,0];}begin();}}
}
function panel(lines){const h=lines.length*14+16;A.rect(50,120-h/2,220,h,K.k);A.box(50,120-h/2,220,h,K.y);lines.forEach((l,i)=>A.text(l[0],160,120-h/2+10+i*14,l[1]||K.w,l[2]||1,'c'));}
function render(){
 if(state==='title'){A.cls();for(let i=0;i<16;i++)A.rect(i*20,0,10,3,i%2?K.p:K.y);
  A.text(cur.name,160,30,K.y,cur.name.length>12?2:3,'c');A.text(cur.how||'',160,64,K.w,1,'c');
  const o=cur.vs?['VS CPU','2 PLAYERS']:['1 PLAYER','2P TAKE TURNS'];
  o.forEach((t,i)=>A.text((sel===i?'> ':'  ')+t,160,100+i*16,sel===i?K.y:K.gr,2,'c'));
  if(cur.vs&&sel===0)A.text('< '+['EASY','NORMAL','HARD'][A.lvl]+' >',160,136,K.c,2,'c');
  if(!cur.vs){const b=getHS();if(b!==null)A.text('BEST '+b,160,136,K.c,1,'c');}
  if(cur.vs&&sel===1)A.text('P1 WASD F/G     P2 ARROWS ENTER/SHIFT',160,160,K.p,1,'c');else A.text('ARROWS   SPACE=A   X=B',160,160,K.gr,1,'c');
  if(A.t%60<40)A.text('SPACE TO PLAY',160,196,K.w,2,'c');A.text('ESC BACK   P PAUSE   M MUTE',160,226,K.gr,1,'c');return;}
 if(!g)return;g.draw();
 if(paused)panel([['PAUSED',K.y,2],['P TO RESUME',K.gr]]);
 else if(hot&&state==='play')A.text('P'+(turn+1)+' TURN',160,232,K.gr,1,'c');
 if(state==='swap')panel([['PLAYER 1 DONE',K.y,2],['SCORE '+ts[0]],['P2 READY? SPACE',K.c]]);
 if(state==='over'){if(hot){const w=ts[0]===ts[1]?-1:(cur.low?ts[0]<ts[1]:ts[0]>ts[1])?0:1;panel([[w<0?'DRAW!':'PLAYER '+(w+1)+' WINS!',K.y,2],['P1 '+ts[0]+'    P2 '+ts[1]],['SPACE AGAIN   ESC BACK',K.gr]]);}
  else{const L=[[g.over,K.y,2]];if(!cur.vs)L.push(['SCORE '+g.score+(record?'   NEW BEST!':'')]);L.push(['SPACE AGAIN   ESC BACK',K.gr]);panel(L);}}
}
let last=0,acc=0;
function frame(ts_){if(state==='hub')return;acc+=Math.min(100,ts_-last);last=ts_;let n=0;while(acc>=16.667&&n<5){step();acc-=16.667;n++;}if(n===5)acc=0;if(state!=='hub')render();requestAnimationFrame(frame);}
A.open=game=>{cur=game;sel=0;state='title';g=null;A.setHD(!!game.hd);try{if(location.hash!=='#'+game.id)history.replaceState(null,'','#'+game.id);}catch(e){}document.body.classList.add('playing');last=performance.now();acc=0;requestAnimationFrame(frame);};
A.close=()=>{state='hub';g=null;A.setHD(false);try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}document.body.classList.remove('playing');const f=document.querySelector('[data-id="'+(cur&&cur.id)+'"]');if(f)f.focus();};
A.toggleMute=()=>{mute=!mute;const b=document.getElementById('mute');if(b)b.textContent=mute?'Sound off':'Sound on';};

const tc=t=>t.split(' ').map(w=>/\d/.test(w)?w:w.charAt(0)+w.slice(1).toLowerCase()).join(' ');
A.hd=false;A.setHD=on=>{const scr=document.getElementById('scr');if(!scr||A.hd===on)return;A.hd=on;scr.width=on?640:320;scr.height=on?480:240;A.c=scr.getContext('2d');A.c.imageSmoothingEnabled=false;if(on)A.c.scale(2,2);};
function boot(){
 const scr=document.getElementById('scr');A.c=scr.getContext('2d');A.c.imageSmoothingEnabled=false;
 const PREV=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Slash'];
 addEventListener('keydown',e=>{if(state==='hub')return;keys[e.code]=true;if(!e.repeat)tap[e.code]=1;if(PREV.includes(e.code))e.preventDefault();
  if(e.code==='Escape')A.close();else if(e.code==='KeyP'&&state==='play')paused=!paused;else if(e.code==='KeyM')A.toggleMute();});
 addEventListener('keyup',e=>{keys[e.code]=false;});
 addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
 document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k,on=e=>{e.preventDefault();vk[k]=true;},off=e=>{e.preventDefault();vk[k]=false;};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);});
 document.getElementById('back').onclick=A.close;document.getElementById('mute').onclick=A.toggleMute;
 document.getElementById('pause').onclick=()=>{if(state==='play')paused=!paused;};
 /* build hub */
 const grid=document.getElementById('grid'),chips=document.getElementById('chips'),count=document.getElementById('count');
 const cats=['All'].concat([...new Set(A.games.map(x=>x.cat))]);let filt='All';
 const q=document.getElementById('q'),rndB=document.getElementById('rnd');if(q)q.oninput=()=>show();if(rndB)rndB.onclick=()=>A.open(A.games[Math.random()*A.games.length|0]);
 function show(){const s=(q&&q.value||'').trim().toLowerCase();let n=0;grid.querySelectorAll('.cab').forEach(el=>{const ok=(filt==='All'||el.dataset.cat===filt)&&(!s||el.dataset.id.includes(s)||el.querySelector('.nm').textContent.toLowerCase().includes(s));el.hidden=!ok;if(ok)n++;});grid.querySelectorAll('section').forEach(sec=>{sec.hidden=!sec.querySelector('.cab:not([hidden])');});chips.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===filt));const em=document.getElementById('empty');if(em)em.hidden=n>0;}
 cats.forEach(c=>{const b=document.createElement('button');b.type='button';b.dataset.c=c;const n=c==='All'?A.games.length:A.games.filter(x=>x.cat===c).length;b.textContent=(c==='All'?'All':tc(c))+' '+n;b.onclick=()=>{filt=c;show();if(c!=='All'){const sec=document.getElementById('cat-'+c.replace(/\W/g,''));if(sec)sec.scrollIntoView({behavior:'smooth',block:'start'});}};chips.appendChild(b);});
 A.silent=true;A.cpu=true;
 const BL={SPORTS:'Courts, pitches, lanes and slopes.',CLASSICS:'The golden age, rebuilt from scratch.',VERSUS:'Grab a friend or fight the machine.','RETRO 3D':'Polygon worlds with fog, shadows and speed.',BOARD:'Real search behind every CPU move.',PUZZLE:'Think, then think faster.',ACTION:'Shooters, brawlers and a fighting roster.',CARDS:'Green felt, proper suits, house rules.',SIM:'Zoos, farms, pets and reefs to look after.',PARTY:'Quick head-to-head rounds. Loud, fast, fair.'};
 const secs={};A.games.forEach(gm=>{if(!secs[gm.cat]){const sec=document.createElement('section');sec.id='cat-'+gm.cat.replace(/\W/g,'');sec.className='shelf';const hd=document.createElement('header');hd.innerHTML='<h2></h2><p></p><span class="cnt"></span>';hd.querySelector('h2').textContent=tc(gm.cat);hd.querySelector('p').textContent=BL[gm.cat]||'';hd.querySelector('.cnt').textContent=A.games.filter(x=>x.cat===gm.cat).length+' games';sec.appendChild(hd);const g2=document.createElement('div');g2.className='row';sec.appendChild(g2);grid.appendChild(sec);secs[gm.cat]=g2;}
  const el=document.createElement('button');el.type='button';el.className='cab';el.dataset.cat=gm.cat;el.dataset.id=gm.id;el.style.setProperty('--i',secs[gm.cat].children.length%8);
  const mq=document.createElement('span');mq.className='mq';mq.textContent=gm.vs?'VS CPU · 2P':gm.hd?'HD 3D':'SOLO';el.appendChild(mq);
  const bez=document.createElement('span');bez.className='bez';const cv=document.createElement('canvas');cv.width=320;cv.height=240;bez.appendChild(cv);const play=document.createElement('i');play.className='play';play.textContent='▶';bez.appendChild(play);el.appendChild(bez);
  const nm=document.createElement('span');nm.className='nm';nm.textContent=tc(gm.name);el.appendChild(nm);
  const tg=document.createElement('span');tg.className='tg';tg.textContent=(gm.how||'').split('.')[0].toLowerCase();el.appendChild(tg);
  const bt=document.createElement('span');bt.className='btns';bt.innerHTML='<i></i><i></i><i></i>';el.appendChild(bt);el.onclick=()=>A.open(gm);secs[gm.cat].appendChild(el);
  try{const t=gm.make();for(let i=0;i<(gm.warm||45);i++){A.bot({});t.update();if(t.over)break;}A.cls();t.draw();A.flush&&A.flush();const x=cv.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(scr,0,0,320,240);}catch(e){console.warn('thumb',gm.id,e);}
  /* live preview on hover */
  let pv=null;const off=document.createElement('canvas');off.width=320;off.height=240;
  el.addEventListener('pointerenter',()=>{if(pv||matchMedia('(prefers-reduced-motion: reduce)').matches)return;let t;try{A.silent=true;A.cpu=true;A.two=false;t=gm.make();}catch(e){return;}const octx=off.getContext('2d');octx.imageSmoothingEnabled=false;const x=cv.getContext('2d');let f=0;
   pv={id:setInterval(()=>{if(state!=='hub'){return;}const saveC=A.c,saveT=A.t,saveCpu=A.cpu,saveTwo=A.two,saveS=A.silent;A.c=octx;A.silent=true;A.cpu=true;A.two=false;try{const k=f%30<15?{r:1,a:f%7===0}:{l:1,u:f%5===0,a:f%9===0};A._set(0,f%60<30?k:{d:1,a:f%6===0});A.bot({});A.t++;t.update();A.cls();t.draw();A.flush&&A.flush();x.drawImage(off,0,0,320,240);if(t.over){t=gm.make();}}catch(e){clearInterval(pv.id);pv=null;}A.c=saveC;A.t=saveT;A.cpu=saveCpu;A.two=saveTwo;A.silent=saveS;A._set(0,{});f++;},1000/30)};});
  el.addEventListener('pointerleave',()=>{if(pv){clearInterval(pv.id);pv=null;A._set(0,{});}});});
 /* reveal on scroll */
 if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{rootMargin:'0px 0px -8% 0px'});document.querySelectorAll('.cab,.shelf header,.feat,.stat').forEach(el=>io.observe(el));}
 /* stats */
 const st={games:A.games.length,vs:A.games.filter(x=>x.vs).length,hd:A.games.filter(x=>x.hd).length+1,cats:cats.length-1};document.querySelectorAll('[data-stat]').forEach(el=>{const v=st[el.dataset.stat]||0;let n=0;const iv=setInterval(()=>{n=Math.min(v,n+Math.max(1,v/40|0));el.textContent=n;if(n>=v)clearInterval(iv);},30);});
 /* pointer glow + hero parallax */
 const glow=document.getElementById('glow');addEventListener('pointermove',e=>{if(glow){glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';}document.documentElement.style.setProperty('--mx',(e.clientX/innerWidth-.5).toFixed(3));document.documentElement.style.setProperty('--my',(e.clientY/innerHeight-.5).toFixed(3));});
 A.silent=false;A.cpu=false;if(count)count.textContent=A.games.length;show();
 const want=(location.hash||'').slice(1),direct=A.games.find(x=>x.id===want);if(direct)A.open(direct);addEventListener('hashchange',()=>{const id=location.hash.slice(1),gm=A.games.find(x=>x.id===id);if(gm&&(state==='hub'||!cur||cur.id!==id)){if(state!=='hub')A.close();A.open(gm);}});
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();}
})();
