// STARSHIP SUSPECTS — task minigames: wiring, card swipe, fuel, shields, asteroids, download, engine alignment, scan,
// plus the repair panels (light switches, oxygen keypad). Each is a small canvas game inside a modal panel.
const W=420,H=420,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a;
const FONT='JetBrains Mono, ui-monospace, monospace';
function panelBg(g,title,accent='#ff4d00'){g.fillStyle='#0b0e14';g.fillRect(0,0,W,H);const gr=g.createRadialGradient(W/2,H/2,40,W/2,H/2,320);gr.addColorStop(0,'rgba(80,110,160,.10)');gr.addColorStop(1,'rgba(0,0,0,.4)');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.strokeStyle='rgba(255,255,255,.08)';for(let i=0;i<W;i+=20){g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();}
 g.fillStyle=accent;g.fillRect(0,0,W,3);g.fillStyle='#e8ecf2';g.font=`700 13px ${FONT}`;g.textAlign='left';g.fillText(title,16,26);}
const txt=(g,s,x,y,size=13,c='#e8ecf2',al='center',w=700)=>{g.font=`${w} ${size}px ${FONT}`;g.textAlign=al;g.fillStyle=c;g.fillText(s,x,y);};
function rr(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r);}

const GAMES={
 wires:{title:'FIX WIRING',hint:'Drag each wire to the matching colour.',init(s){const C=['#ff4b4b','#3f8cff','#ffd23a','#e45cff'];s.L=C.map((c,i)=>({c,y:110+i*72}));const r=[0,1,2,3].sort(()=>Math.random()-.5);s.R=r.map((k,i)=>({c:C[k],y:110+i*72}));s.done=new Set();s.drag=null;},
  draw(g,s){for(const[side,arr]of[[0,s.L],[1,s.R]])for(const w of arr){const x=side?W-40:40;g.fillStyle='#2a2f38';g.fillRect(side?W-40:0,w.y-14,40,28);g.fillStyle=w.c;g.fillRect(side?W-46:28,w.y-8,18,16);
    g.fillStyle='#c9ced6';g.fillRect(side?W-52:46,w.y-4,8,8);}
   g.lineCap='round';for(const c of s.done){const a=s.L.find(w=>w.c===c),b=s.R.find(w=>w.c===c);wire(g,54,a.y,W-54,b.y,c);}
   if(s.drag)wire(g,54,s.drag.w.y,s.drag.x,s.drag.y,s.drag.w.c);},
  down(s,x,y){if(x<90){const w=s.L.find(w=>Math.abs(w.y-y)<26&&!s.done.has(w.c));if(w)s.drag={w,x,y};}},move(s,x,y){if(s.drag){s.drag.x=x;s.drag.y=y;}},
  up(s,x,y,api){if(!s.drag)return;const t=s.R.find(w=>Math.abs(w.y-y)<28);if(x>W-110&&t&&t.c===s.drag.w.c){s.done.add(t.c);api.snd('wire',1+s.done.size*.2);if(s.done.size===4)api.win();}else api.snd('fail');s.drag=null;}},
 swipe:{title:'SWIPE CARD',hint:'Drag the card through the reader. Not too fast, not too slow.',init(s){s.x=60;s.drag=false;s.t0=0;s.msg='';s.ok=false;s.time=0;},
  draw(g,s){rr(g,40,190,340,90,14);g.fillStyle='#1a1e26';g.fill();g.fillStyle='#050608';g.fillRect(40,226,340,10);
   rr(g,140,90,140,70,10);g.fillStyle='#10141a';g.fill();txt(g,s.msg||'READY',210,132,13,s.ok?'#5cff9d':s.msg?'#ff6b6b':'#8fd3ff');
   rr(g,s.x-52,196,104,64,8);const gr=g.createLinearGradient(s.x-52,0,s.x+52,0);gr.addColorStop(0,'#e9edf2');gr.addColorStop(1,'#a9b4c4');g.fillStyle=gr;g.fill();g.fillStyle='#ff4d00';g.fillRect(s.x-44,206,30,22);g.fillStyle='#3a4250';g.fillRect(s.x-44,238,80,5);g.fillRect(s.x-44,247,56,5);txt(g,'CREW ID',s.x+18,224,9,'#3a4250');
   txt(g,'SWIPE →',210,330,12,'#6b7380');},
  down(s,x,y){if(Math.abs(x-s.x)<60&&y>180&&y<280){s.drag=true;s.ox=x-s.x;s.t0=0;s.msg='';s.ok=false;}},move(s,x){if(s.drag){const nx=cl(x-s.ox,60,370);if(s.x<90&&nx>=90)s.t0=s.time;s.x=nx;}},
  up(s,x,y,api){if(!s.drag)return;s.drag=false;if(s.x>=360&&s.t0){const d=s.time-s.t0;if(d<.4){s.msg='TOO FAST. TRY AGAIN';api.snd('fail');}else if(d>1.5){s.msg='TOO SLOW. TRY AGAIN';api.snd('fail');}else{s.msg='ACCEPTED';s.ok=true;api.snd('done');api.win(.5);return;}}else if(s.x>90){s.msg='BAD READ. TRY AGAIN';api.snd('fail');}s.x=60;},
  update(s,dt){s.time+=dt;}},
 fuel:{title:'FUEL ENGINES',hint:'Hold the pump (or Space) until the tank is full.',init(s){s.v=0;s.hold=false;},
  draw(g,s){rr(g,90,70,120,280,16);g.fillStyle='#141922';g.fill();g.strokeStyle='#3a4250';g.lineWidth=3;g.stroke();const h=272*s.v;const gr=g.createLinearGradient(0,346-h,0,346);gr.addColorStop(0,'#ffcf5a');gr.addColorStop(1,'#ff7a1a');g.fillStyle=gr;rr(g,94,346-h,112,h,12);g.fill();
   g.strokeStyle='rgba(255,255,255,.4)';for(let i=1;i<10;i++){g.beginPath();g.moveTo(94,74+i*27.2);g.lineTo(110,74+i*27.2);g.stroke();}txt(g,Math.round(s.v*100)+'%',150,380,14);
   g.beginPath();g.arc(310,230,62,0,7);g.fillStyle=s.hold?'#ff4d00':'#2a2f38';g.fill();g.lineWidth=4;g.strokeStyle='#ff4d00';g.stroke();txt(g,'PUMP',310,236,15,s.hold?'#000':'#e8ecf2');},
  down(s,x,y){if(Math.hypot(x-310,y-230)<70)s.hold=true;},up(s){s.hold=false;},key(s,c,d){if(c==='Space')s.hold=d;},
  update(s,dt,api){if(s.hold&&s.v<1){s.v=Math.min(1,s.v+dt*.3);if(Math.random()<dt*14)api.snd('step',.5);if(s.v>=1){api.snd('done');api.win();}}}},
 shields:{title:'PRIME SHIELDS',hint:'Click every red cell until the whole grid glows blue.',init(s){s.c=[];const r=54;s.c.push({x:210,y:220});for(let i=0;i<6;i++){const a=i/6*Math.PI*2+Math.PI/6;s.c.push({x:210+Math.cos(a)*r*1.8,y:220+Math.sin(a)*r*1.8});}
   const n=3+(Math.random()*3|0);s.c.forEach(c=>c.on=true);[...s.c].sort(()=>Math.random()-.5).slice(0,n).forEach(c=>c.on=false);},
  draw(g,s){for(const c of s.c){hex(g,c.x,c.y,52);g.fillStyle=c.on?'rgba(70,140,255,.85)':'rgba(255,60,60,.85)';g.fill();g.lineWidth=3;g.strokeStyle=c.on?'#bfe0ff':'#ffc1c1';g.stroke();}},
  down(s,x,y,api){for(const c of s.c)if(Math.hypot(x-c.x,y-c.y)<48&&!c.on){c.on=true;api.snd('blip');if(s.c.every(c=>c.on)){api.snd('done');api.win();}}}},
 asteroids:{title:'CLEAR ASTEROIDS',hint:'Click to blast 10 asteroids before they hit the hull.',init(s){s.a=[];s.k=0;s.t=0;s.mx=210;s.my=210;s.fx=[];},
  draw(g,s){g.save();g.beginPath();g.arc(210,220,180,0,7);g.clip();g.fillStyle='#03050a';g.fillRect(0,0,W,H);for(let i=0;i<60;i++){g.fillStyle='rgba(255,255,255,.5)';g.fillRect((i*97)%W,(i*53+s.t*8)%H,1.5,1.5);}
   for(const a of s.a){g.save();g.translate(a.x,a.y);g.rotate(a.r);g.beginPath();for(let i=0;i<9;i++){const an=i/9*Math.PI*2,rr=a.s*(.75+a.j[i]*.35);g.lineTo(Math.cos(an)*rr,Math.sin(an)*rr);}g.closePath();g.fillStyle='#6e6258';g.fill();g.strokeStyle='#a8998a';g.lineWidth=2;g.stroke();g.restore();}
   for(const f of s.fx){g.beginPath();g.arc(f.x,f.y,f.r,0,7);g.strokeStyle=`rgba(255,180,80,${f.l})`;g.lineWidth=3;g.stroke();}g.restore();
   g.beginPath();g.arc(210,220,180,0,7);g.strokeStyle='#3a4250';g.lineWidth=4;g.stroke();g.strokeStyle='#5cff9d';g.lineWidth=2;g.beginPath();g.arc(s.mx,s.my,14,0,7);g.moveTo(s.mx-22,s.my);g.lineTo(s.mx+22,s.my);g.moveTo(s.mx,s.my-22);g.lineTo(s.mx,s.my+22);g.stroke();
   txt(g,`${s.k} / 10`,W-20,26,13,'#5cff9d','right');},
  move(s,x,y){s.mx=x;s.my=y;},down(s,x,y,api){s.mx=x;s.my=y;api.snd('shoot');for(const a of s.a)if(Math.hypot(x-a.x,y-a.y)<a.s+6&&!a.dead){a.dead=true;s.k++;s.fx.push({x:a.x,y:a.y,r:a.s,l:1});api.snd('boom');if(s.k>=10){api.snd('done');api.win();}break;}},
  update(s,dt){s.t+=dt;if(s.a.filter(a=>!a.dead).length<5&&Math.random()<dt*2.2){const an=rnd(Math.PI*2);const x=210+Math.cos(an)*200,y=220+Math.sin(an)*200;const tx=210+rnd(160)-80,ty=220+rnd(160)-80,d=Math.hypot(tx-x,ty-y);s.a.push({x,y,vx:(tx-x)/d*(55+rnd(40)),vy:(ty-y)/d*(55+rnd(40)),s:14+rnd(14),r:0,vr:rnd(2)-1,j:[...Array(9)].map(()=>Math.random())});}
   for(const a of s.a){a.x+=a.vx*dt;a.y+=a.vy*dt;a.r+=a.vr*dt;}s.a=s.a.filter(a=>!a.dead&&Math.hypot(a.x-210,a.y-220)<230);for(const f of s.fx){f.r+=dt*60;f.l-=dt*2;}s.fx=s.fx.filter(f=>f.l>0);}},
 download:{title:'DOWNLOAD DATA',hint:'Start the transfer and wait for it to finish.',init(s){s.go=false;s.p=0;s.files=[];},
  draw(g,s){rr(g,60,90,110,90,10);g.fillStyle='#1a2230';g.fill();rr(g,250,90,110,90,10);g.fillStyle='#1a2230';g.fill();txt(g,'NODE',115,142,12,'#8fd3ff');txt(g,'CORE',305,142,12,'#8fd3ff');
   for(const f of s.files){g.fillStyle='#ffd23a';g.fillRect(f.x,f.y,14,18);}
   rr(g,60,250,300,22,11);g.fillStyle='#141922';g.fill();rr(g,60,250,300*s.p,22,11);g.fillStyle='#5cff9d';g.fill();txt(g,s.go?Math.round(s.p*100)+'%  ·  '+Math.max(0,Math.ceil((1-s.p)*6))+'s LEFT':'',210,300,12);
   if(!s.go){rr(g,130,320,160,48,24);g.fillStyle='#ff4d00';g.fill();txt(g,'DOWNLOAD',210,350,14,'#000');}},
  down(s,x,y,api){if(!s.go&&x>130&&x<290&&y>320&&y<368){s.go=true;api.snd('blip');}},key(s,c,d,api){if(d&&(c==='Enter'||c==='Space')&&!s.go){s.go=true;api.snd('blip');}},
  update(s,dt,api){if(!s.go)return;s.p=Math.min(1,s.p+dt/6);if(Math.random()<dt*5)s.files.push({x:160,y:120+rnd(30)});for(const f of s.files)f.x+=dt*160;s.files=s.files.filter(f=>f.x<250);if(s.p>=1&&!s.fin){s.fin=true;api.snd('done');api.win();}}},
 align:{title:'ALIGN ENGINE',hint:'Drag the lever until the thrust line sits on the target, then hold.',init(s){s.v=Math.random()<.5?.1:.9;s.target=.3+rnd(.4);s.hold=0;s.drag=false;},
  draw(g,s){g.strokeStyle='#3a4250';g.lineWidth=2;g.beginPath();g.arc(120,220,150,-Math.PI/2.6,Math.PI/2.6);g.stroke();
   const ang=v=>(-1+2*v)*Math.PI/2.8;const ta=ang(s.target),va=ang(s.v);
   g.strokeStyle='rgba(92,255,157,.5)';g.lineWidth=12;g.beginPath();g.arc(120,220,150,ta-.04,ta+.04);g.stroke();
   g.strokeStyle=Math.abs(s.v-s.target)<.035?'#5cff9d':'#ffb36b';g.lineWidth=4;g.beginPath();g.moveTo(120,220);g.lineTo(120+Math.cos(va)*170,220+Math.sin(va)*170);g.stroke();
   g.beginPath();g.arc(120,220,12,0,7);g.fillStyle='#ffb36b';g.fill();
   rr(g,330,60,24,320,12);g.fillStyle='#141922';g.fill();const hy=60+s.v*296;rr(g,316,hy,52,28,8);g.fillStyle='#ff4d00';g.fill();
   rr(g,30,370,240*cl(s.hold/.8,0,1),8,4);g.fillStyle='#5cff9d';g.fill();},
  down(s,x,y){if(x>300&&x<380)s.drag=true;this.move(s,x,y);},move(s,x,y){if(s.drag)s.v=cl((y-74)/296,0,1);},up(s){s.drag=false;},
  key(s,c,d){if(!d)return;if(c==='ArrowUp'||c==='KeyW')s.v=cl(s.v-.012,0,1);if(c==='ArrowDown'||c==='KeyS')s.v=cl(s.v+.012,0,1);},
  update(s,dt,api){if(Math.abs(s.v-s.target)<.035&&!s.fin){s.hold+=dt;if(s.hold>.8){s.fin=true;api.snd('done');api.win();}}else s.hold=Math.max(0,s.hold-dt*2);}},
 scan:{title:'SUBMIT SCAN',hint:'Stand still on the scanner. Anyone watching will see you scan.',init(s){s.p=0;},
  draw(g,s){g.fillStyle='rgba(108,247,255,.08)';g.fillRect(110,60,200,320);const y=60+((s.p*4)%1)*320;g.fillStyle='rgba(108,247,255,.7)';g.fillRect(110,y,200,3);
   g.strokeStyle='#6cf7ff';g.lineWidth=2;g.beginPath();g.ellipse(210,150,34,40,0,0,7);g.stroke();g.beginPath();g.roundRect(160,195,100,120,30);g.stroke();
   txt(g,`ID ${(s.id||'')}`,210,350,11,'#6cf7ff');const lines=['HEIGHT 1.43 m','O2 SAT 98%','SUIT INTACT','PULSE 76'];lines.slice(0,Math.floor(s.p*5)).forEach((l,i)=>txt(g,l,330,120+i*22,11,'#9fe9ef','left'));
   rr(g,60,392,300,10,5);g.fillStyle='#141922';g.fill();rr(g,60,392,300*s.p,10,5);g.fillStyle='#6cf7ff';g.fill();},
  update(s,dt,api){s.p=Math.min(1,s.p+dt/7);if(s.p>=1&&!s.fin){s.fin=true;api.snd('done');api.win();}}},
 lights:{title:'RESTORE LIGHTS',hint:'Flip every breaker up.',init(s){s.sw=[0,1,2,3,4].map(()=>Math.random()<.5);if(s.sw.every(Boolean))s.sw[2]=false;},
  draw(g,s){for(let i=0;i<5;i++){const x=60+i*75;rr(g,x-24,120,48,170,10);g.fillStyle='#141922';g.fill();g.fillStyle=s.sw[i]?'#5cff9d':'#ff4b4b';g.beginPath();g.arc(x,100,8,0,7);g.fill();rr(g,x-16,s.sw[i]?132:226,32,52,6);g.fillStyle='#c9ced6';g.fill();}},
  down(s,x,y,api){for(let i=0;i<5;i++){if(Math.abs(x-(60+i*75))<30&&y>110&&y<300){s.sw[i]=!s.sw[i];api.snd('click');if(s.sw.every(Boolean)){api.snd('fixed');api.win();}}}}},
 keypad:{title:'OXYGEN KEYPAD',hint:'Enter the code shown on the note.',init(s){s.code=[...Array(5)].map(()=>Math.random()*10|0).join('');s.in='';},
  draw(g,s){rr(g,24,90,120,120,6);g.fillStyle='#f4e9b8';g.fill();txt(g,'TODAY',84,124,11,'#6b5a2a');txt(g,s.code,84,170,22,'#2a2210');
   rr(g,180,60,210,48,6);g.fillStyle='#05070b';g.fill();txt(g,s.in.padEnd(5,'·'),285,94,22,'#5cff9d');
   for(let i=0;i<12;i++){const c=i%3,r=i/3|0,x=200+c*64,y=124+r*64,l='123456789C0✓'[i];rr(g,x,y,54,54,8);g.fillStyle=l==='✓'?'#1f5f3a':l==='C'?'#5f1f1f':'#1d2330';g.fill();txt(g,l,x+27,y+34,18);}},
  down(s,x,y,api){for(let i=0;i<12;i++){const c=i%3,r=i/3|0,bx=200+c*64,by=124+r*64;if(x>bx&&x<bx+54&&y>by&&y<by+54)this.press(s,'123456789C0✓'[i],api);}},
  key(s,c,d,api){if(!d)return;const m=c.match(/^(?:Digit|Numpad)(\d)$/);if(m)this.press(s,m[1],api);if(c==='Enter'||c==='NumpadEnter')this.press(s,'✓',api);if(c==='Backspace')this.press(s,'C',api);},
  press(s,l,api){if(l==='C'){s.in='';api.snd('click');return;}if(l==='✓'){if(s.in===s.code){api.snd('fixed');api.win();}else{s.in='';api.snd('fail');}return;}if(s.in.length<5){s.in+=l;api.snd('click');}}},
};
function wire(g,x0,y0,x1,y1,c){g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=16;g.beginPath();g.moveTo(x0,y0+3);g.bezierCurveTo((x0+x1)/2,y0+3,(x0+x1)/2,y1+3,x1,y1+3);g.stroke();g.strokeStyle=c;g.lineWidth=12;g.beginPath();g.moveTo(x0,y0);g.bezierCurveTo((x0+x1)/2,y0,(x0+x1)/2,y1,x1,y1);g.stroke();g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=3;g.beginPath();g.moveTo(x0,y0-3);g.bezierCurveTo((x0+x1)/2,y0-3,(x0+x1)/2,y1-3,x1,y1-3);g.stroke();}
function hex(g,x,y,r){g.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}g.closePath();}
export const GAME_TYPES=Object.keys(GAMES);

export class TaskUI{
 constructor(snd){this.snd=snd;this.cur=null;const el=this.el=document.createElement('div');el.id='task';el.hidden=true;
  el.innerHTML='<div class="tbox"><div class="thead"><b></b><span></span><button class="tx" title="Close (Esc)">✕</button></div><canvas width="420" height="420"></canvas><div class="tok">TASK COMPLETE</div></div>';document.body.appendChild(el);
  this.cv=el.querySelector('canvas');this.g=this.cv.getContext('2d');el.querySelector('.tx').onclick=()=>this.close(true);
  const pos=e=>{const r=this.cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
  this.cv.addEventListener('pointerdown',e=>{if(!this.cur||this.cur.won)return;this.cv.setPointerCapture(e.pointerId);const[x,y]=pos(e);this.cur.G.down&&this.cur.G.down(this.cur.s,x,y,this.api);});
  this.cv.addEventListener('pointermove',e=>{if(!this.cur||this.cur.won)return;const[x,y]=pos(e);this.cur.G.move&&this.cur.G.move(this.cur.s,x,y,this.api);});
  this.cv.addEventListener('pointerup',e=>{if(!this.cur||this.cur.won)return;const[x,y]=pos(e);this.cur.G.up&&this.cur.G.up(this.cur.s,x,y,this.api);});
  addEventListener('keydown',e=>{if(!this.cur)return;if(e.code==='Escape'){this.close(true);e.stopImmediatePropagation();return;}if(this.cur.won)return;this.cur.G.key&&this.cur.G.key(this.cur.s,e.code,true,this.api);if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();},true);
  addEventListener('keyup',e=>{if(this.cur&&!this.cur.won&&this.cur.G.key)this.cur.G.key(this.cur.s,e.code,false,this.api);},true);
  this.api={snd:(k,a)=>this.snd.play(k,a),win:(delay=.35)=>{if(this.cur&&!this.cur.won){this.cur.won=true;this.cur.wt=delay;this.el.classList.add('won');}}};}
 get active(){return !!this.cur;}
 open(type,o={}){const G=GAMES[type];if(!G)return false;this.cur={type,G,s:{id:o.id||''},o,won:false,wt:0};G.init(this.cur.s);this.el.hidden=false;this.el.classList.remove('won');
  this.el.querySelector('.thead b').textContent=o.title||G.title;this.el.querySelector('.thead span').textContent=(o.room?o.room+' · ':'')+G.hint;this.draw();return true;}
 close(cancel){if(!this.cur)return;const c=this.cur;this.cur=null;this.el.hidden=true;if(cancel&&c.o.onClose)c.o.onClose();}
 solve(){if(this.cur&&!this.cur.won){this.cur.won=true;this.cur.wt=0;}}
 update(dt){const c=this.cur;if(!c)return;if(c.won){c.wt-=dt;if(c.wt<=0){this.cur=null;this.el.hidden=true;c.o.onDone&&c.o.onDone();return;}}else if(c.G.update)c.G.update(c.s,dt,this.api);this.draw();}
 draw(){const c=this.cur;if(!c)return;const g=this.g;panelBg(g,c.G.title,c.type==='lights'||c.type==='keypad'?'#ff3b30':'#ff4d00');c.G.draw(g,c.s);}
}
