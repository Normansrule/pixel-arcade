// STARSHIP SUSPECTS — task minigames. Each is a small canvas game inside a modal panel:
// cook rations, tidy up, chart stars, calibrate beacon, tune radio, water sprouts, mix sample, gravity test,
// route coolant, sort cargo, plus the repair panels (breakers, scrubber keypad).
const W=420,H=420,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a,ri=n=>Math.random()*n|0;
const FONT='JetBrains Mono, ui-monospace, monospace';
function panelBg(g,accent){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#26305a');gr.addColorStop(1,'#1a2142');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.strokeStyle='rgba(255,255,255,.05)';g.lineWidth=1;for(let i=0;i<W;i+=21){g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();}
 g.fillStyle=accent;g.fillRect(0,0,W,5);}
const txt=(g,s,x,y,size=13,c='#f2f4ff',al='center',w=700)=>{g.font=`${w} ${size}px ${FONT}`;g.textAlign=al;g.fillStyle=c;g.fillText(s,x,y);};
function rr(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r);}
const COL={red:'#ff5a5f',yel:'#ffd23a',blu:'#4fa3ff',grn:'#4fd16a',pur:'#b27bff',pnk:'#ff7ab8',org:'#ff9a3c',cyn:'#4fe3ff'};
const hit=(x,y,bx,by,bw,bh)=>x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh;

const GAMES={
 /* ---- GALLEY: flip the ration cake when the heat needle is in the sweet spot, three times ---- */
 cook:{title:'COOK RATIONS',hint:'Click (or Space) when the needle is in the green: flip 3 cakes.',accent:COL.org,
  init(s){s.n=0;s.p=0;s.dir=1;s.sp=.9;s.zone=.38+rnd(.3);s.flip=0;s.burn=0;s.msg='';},
  draw(g,s){// stove + pan
   rr(g,60,150,300,190,24);g.fillStyle='#3a4366';g.fill();for(let i=0;i<3;i++){g.beginPath();g.arc(210,250,70-i*18,0,7);g.strokeStyle=`rgba(255,${120+i*40},60,${.5-i*.12})`;g.lineWidth=5;g.stroke();}
   g.beginPath();g.arc(210,245,88,0,7);g.fillStyle='#262b3d';g.fill();g.fillStyle='#4a5370';g.fillRect(290,236,110,18);
   const f=s.flip>0?Math.cos(s.flip*Math.PI):1,lift=s.flip>0?Math.sin(s.flip*Math.PI)*60:0;const done=cl(s.n/3,0,1);
   g.save();g.translate(210,245-lift);g.scale(1,Math.abs(f)*.75+.05);g.beginPath();g.arc(0,0,62,0,7);g.fillStyle=s.burn>0?'#5a3a24':f<0?'#c9853e':'#f2c27a';g.fill();g.strokeStyle='#b0702e';g.lineWidth=4;g.stroke();g.restore();
   for(let i=0;i<3;i++){g.beginPath();g.arc(160+i*50,370,13,0,7);g.fillStyle=i<s.n?COL.org:'rgba(255,255,255,.12)';g.fill();}
   // heat bar
   rr(g,40,60,340,30,15);g.fillStyle='#141933';g.fill();rr(g,40+s.zone*340-34,60,68,30,15);g.fillStyle=COL.grn;g.fill();
   const nx=40+s.p*340;g.fillStyle='#fff';g.beginPath();g.moveTo(nx,52);g.lineTo(nx-9,40);g.lineTo(nx+9,40);g.fill();g.fillRect(nx-2,56,4,38);
   txt(g,s.msg,210,124,13,s.msg==='NICE FLIP!'?COL.grn:COL.red);},
  update(s,dt){if(s.flip>0){s.flip+=dt*2.2;if(s.flip>=1)s.flip=0;}s.burn=Math.max(0,s.burn-dt);s.p+=s.dir*dt*s.sp;if(s.p>1){s.p=1;s.dir=-1;}if(s.p<0){s.p=0;s.dir=1;}},
  press(s,api){if(s.flip>0)return;if(Math.abs(s.p-s.zone)<.1){s.n++;s.flip=.01;s.msg='NICE FLIP!';api.snd('blip');s.zone=.2+rnd(.6);s.sp+=.25;if(s.n>=3){api.snd('done');api.win(.6);}}else{s.burn=.6;s.msg='TOO HOT. TRY AGAIN';api.snd('fail');}},
  down(s,x,y,api){this.press(s,api);},key(s,c,d,api){if(d&&(c==='Space'||c==='Enter'))this.press(s,api);}},
 /* ---- tidy up: click the floating junk to toss it in the bin ---- */
 trash:{title:'TIDY UP',hint:'Click every bit of floating junk to toss it in the bin.',accent:COL.pnk,
  init(s){const K=['sock','can','paper','peel','cup','sock','can'];s.j=K.map((k,i)=>({k,x:60+rnd(300),y:70+rnd(220),vx:rnd(40)-20,vy:rnd(40)-20,r:rnd(6),vr:rnd(2)-1,c:[COL.pnk,COL.blu,COL.yel,COL.grn][i%4],fly:0}));s.n=0;},
  draw(g,s){rr(g,170,330,80,76,10);g.fillStyle='#4a5370';g.fill();rr(g,160,322,100,16,6);g.fillStyle='#5f6a8f';g.fill();txt(g,`${s.n}/${s.j.length}`,210,375,15);
   for(const j of s.j){if(j.fly>=1)continue;g.save();g.translate(j.x,j.y);g.rotate(j.r);const sc=1-j.fly*.6;g.scale(sc,sc);g.fillStyle=j.c;
    if(j.k==='sock'){rr(g,-10,-22,18,30,6);g.fill();rr(g,-10,0,30,14,7);g.fill();g.fillStyle='#fff';g.fillRect(-10,-22,18,6);}
    else if(j.k==='can'){rr(g,-11,-17,22,34,5);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.fillRect(-11,-6,22,8);}
    else if(j.k==='paper'){g.fillStyle='#eef2ff';g.beginPath();for(let i=0;i<9;i++){const a=i/9*Math.PI*2,r=i%2?12:18;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}g.fill();}
    else if(j.k==='peel'){g.fillStyle=COL.yel;g.beginPath();g.ellipse(0,0,20,9,0,0,7);g.fill();g.fillStyle='#e8b81f';g.beginPath();g.ellipse(-8,8,6,10,.6,0,7);g.ellipse(8,8,6,10,-.6,0,7);g.fill();}
    else{g.fillStyle='#fff';g.beginPath();g.moveTo(-12,-16);g.lineTo(12,-16);g.lineTo(8,16);g.lineTo(-8,16);g.fill();g.fillStyle=j.c;g.fillRect(-10,-4,20,6);}g.restore();}},
  update(s,dt){for(const j of s.j){if(j.fly>0){j.fly=Math.min(1,j.fly+dt*2.5);j.x+=(210-j.x)*dt*6;j.y+=(330-j.y)*dt*6;continue;}j.x+=j.vx*dt;j.y+=j.vy*dt;j.r+=j.vr*dt;if(j.x<30||j.x>390)j.vx*=-1;if(j.y<40||j.y>300)j.vy*=-1;}},
  down(s,x,y,api){for(const j of s.j){if(j.fly>0)continue;if(Math.hypot(x-j.x,y-j.y)<30){j.fly=.01;s.n++;api.snd('blip',1+s.n*.08);if(s.n>=s.j.length){api.snd('done');api.win(.8);}return;}}}},
 /* ---- OBSERVATORY / BRIDGE: join the stars in number order ---- */
 stars:{title:'CHART STARS',hint:'Click the stars in order, 1 to 7, to chart the constellation.',accent:COL.pur,
  init(s){s.p=[];for(let i=0;i<7;i++){let x,y,ok;do{x=50+rnd(320);y=60+rnd(300);ok=s.p.every(q=>Math.hypot(q.x-x,q.y-y)>70);}while(!ok);s.p.push({x,y});}s.n=0;s.bad=0;s.t=0;},
  draw(g,s){for(let i=0;i<60;i++){g.fillStyle='rgba(255,255,255,.35)';g.fillRect((i*137)%W,(i*71)%H,2,2);}
   g.strokeStyle=COL.pur;g.lineWidth=4;g.lineCap='round';g.beginPath();for(let i=0;i<s.n;i++){const p=s.p[i];i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);}g.stroke();
   s.p.forEach((p,i)=>{const on=i<s.n,nx=i===s.n;const r=on?13:11+(nx?Math.sin(s.t*6)*2:0);g.fillStyle=on?'#fff6c8':s.bad>0&&nx?COL.red:'#c9c2ff';g.beginPath();for(let k=0;k<10;k++){const a=k/10*Math.PI*2-Math.PI/2,rr2=k%2?r*.45:r;g.lineTo(p.x+Math.cos(a)*rr2,p.y+Math.sin(a)*rr2);}g.fill();txt(g,String(i+1),p.x,p.y+30,12,on?'#fff6c8':'#9d97c9');});},
  update(s,dt){s.t+=dt;s.bad=Math.max(0,s.bad-dt);},
  down(s,x,y,api){const i=s.p.findIndex(p=>Math.hypot(p.x-x,p.y-y)<26);if(i<0)return;if(i===s.n){s.n++;api.snd('blip',1+s.n*.1);if(s.n>=s.p.length){api.snd('done');api.win(.6);}}else if(i>s.n){s.bad=.5;api.snd('fail');}}},
 /* ---- calibrate beacon: repeat the light pattern (two rounds) ---- */
 beacon:{title:'CALIBRATE BEACON',hint:'Watch the lights, then repeat the pattern. Two rounds.',accent:COL.yel,
  init(s){s.seq=[ri(4),ri(4),ri(4)];s.round=0;s.show=1.1;s.i=0;s.in=[];s.lit=-1;s.litT=0;s.msg='WATCH';},
  pads:[[70,90,COL.red],[220,90,COL.blu],[70,230,COL.grn],[220,230,COL.yel]],
  draw(g,s){this.pads.forEach(([x,y,c],i)=>{rr(g,x,y,130,120,22);g.fillStyle=c;g.globalAlpha=s.lit===i?1:.28;g.fill();g.globalAlpha=1;if(s.lit===i){g.shadowColor=c;g.shadowBlur=30;rr(g,x,y,130,120,22);g.fill();g.shadowBlur=0;}});
   txt(g,s.msg,210,385,14,s.msg==='YOUR TURN'?COL.grn:s.msg==='WRONG · WATCH AGAIN'?COL.red:'#f2f4ff');for(let i=0;i<2;i++){g.beginPath();g.arc(190+i*40,405,6,0,7);g.fillStyle=i<s.round?COL.grn:'rgba(255,255,255,.2)';g.fill();}},
  update(s,dt,api){s.litT-=dt;if(s.litT<=0&&s.show<=0)s.lit=-1;if(s.show>0){s.show-=dt;if(s.show<=0){if(s.i<s.seq.length){s.lit=s.seq[s.i];s.litT=.45;s.i++;s.show=.62;api.snd('wire',1+s.lit*.25);}else{s.lit=-1;s.msg='YOUR TURN';}}else if(s.show<.17)s.lit=-1;}},
  press(s,i,api){if(s.show>0||s.msg!=='YOUR TURN')return;s.lit=i;s.litT=.25;api.snd('wire',1+i*.25);s.in.push(i);const k=s.in.length-1;
   if(s.seq[k]!==i){s.msg='WRONG · WATCH AGAIN';api.snd('fail');s.in=[];s.i=0;s.show=1.2;return;}
   if(s.in.length===s.seq.length){s.round++;if(s.round>=2){api.snd('done');api.win(.6);return;}s.seq.push(ri(4));s.in=[];s.i=0;s.show=1.1;s.msg='WATCH';}},
  down(s,x,y,api){this.pads.forEach(([px,py],i)=>{if(hit(x,y,px,py,130,120))this.press(s,i,api);});},key(s,c,d,api){if(!d)return;const m=c.match(/^Digit([1-4])$/);if(m)this.press(s,+m[1]-1,api);}},
 /* ---- RADIO: match the signal wave with two sliders ---- */
 radio:{title:'TUNE RADIO',hint:'Drag both sliders until your wave sits on the dashed signal.',accent:COL.cyn,
  init(s){s.tf=.25+rnd(.5);s.ta=.3+rnd(.5);s.f=s.tf>.5?.1:.9;s.a=s.ta>.5?.1:.9;s.drag=-1;s.hold=0;s.t=0;},
  wave(g,f,a,t,dash,c){g.strokeStyle=c;g.lineWidth=dash?3:5;g.setLineDash(dash?[8,8]:[]);g.beginPath();for(let x=0;x<=340;x+=4){const y=150+Math.sin(x/340*Math.PI*2*(1.5+f*5)+t*2)*(15+a*70);x?g.lineTo(40+x,y):g.moveTo(40+x,y);}g.stroke();g.setLineDash([]);},
  draw(g,s){rr(g,30,60,360,180,16);g.fillStyle='#0f1430';g.fill();this.wave(g,s.tf,s.ta,s.t,true,'rgba(255,255,255,.55)');const ok=this.ok(s);this.wave(g,s.f,s.a,s.t,false,ok?COL.grn:COL.cyn);
   ['FREQ','GAIN'].forEach((l,i)=>{const y=290+i*60,v=i?s.a:s.f;txt(g,l,60,y+6,12,'#c9d2ff','left');rr(g,120,y-6,260,12,6);g.fillStyle='#141933';g.fill();rr(g,120,y-6,260*v,12,6);g.fillStyle=COL.cyn;g.fill();g.beginPath();g.arc(120+260*v,y,15,0,7);g.fillStyle='#fff';g.fill();});
   rr(g,30,248,360*cl(s.hold/.8,0,1),6,3);g.fillStyle=COL.grn;g.fill();},
  ok(s){return Math.abs(s.f-s.tf)<.04&&Math.abs(s.a-s.ta)<.06;},
  update(s,dt,api){s.t+=dt;if(this.ok(s)&&s.drag<0){s.hold+=dt;if(s.hold>.8&&!s.fin){s.fin=true;api.snd('done');api.win();}}else s.hold=Math.max(0,s.hold-dt*2);},
  down(s,x,y){for(let i=0;i<2;i++)if(Math.abs(y-(290+i*60))<22&&x>100)s.drag=i;this.move(s,x,y);},move(s,x){if(s.drag>=0){const v=cl((x-120)/260,0,1);if(s.drag)s.a=v;else s.f=v;}},up(s){s.drag=-1;},
  key(s,c,d){if(!d)return;if(c==='ArrowLeft')s.f=cl(s.f-.02,0,1);if(c==='ArrowRight')s.f=cl(s.f+.02,0,1);if(c==='ArrowDown')s.a=cl(s.a-.02,0,1);if(c==='ArrowUp')s.a=cl(s.a+.02,0,1);}},
 /* ---- GREENHOUSE: fill each pot to its line without overflowing ---- */
 water:{title:'WATER SPROUTS',hint:'Hold on a pot (or keys 1-3) to pour. Stop inside the green band.',accent:COL.grn,
  init(s){s.p=[0,1,2].map(i=>({v:0,t:.45+rnd(.35),x:85+i*125}));s.hold=-1;},
  draw(g,s){for(const[i,p]of s.p.entries()){const ok=Math.abs(p.v-p.t)<.07;
    rr(g,p.x-45,170,90,190,14);g.fillStyle='#c9764a';g.fill();rr(g,p.x-52,160,104,22,8);g.fillStyle='#d98c5f';g.fill();
    rr(g,p.x-36,186,72,164,10);g.fillStyle='#3a2a20';g.fill();const h=164*p.v;rr(g,p.x-36,350-h,72,h,10);g.fillStyle=p.v>p.t+.07?'#4a6fd1':'#5fb3ff';g.fill();
    g.fillStyle='rgba(79,209,106,.35)';g.fillRect(p.x-40,350-164*(p.t+.07),80,164*.14);g.fillStyle=COL.grn;g.fillRect(p.x-44,350-164*p.t-1,88,3);
    const gr=cl(p.v/p.t,0,1.2);g.strokeStyle='#3fa34f';g.lineWidth=5;g.beginPath();g.moveTo(p.x,160);g.lineTo(p.x,160-gr*60);g.stroke();g.fillStyle=ok?'#6fe07a':'#4fd16a';g.beginPath();g.ellipse(p.x-14,160-gr*55,14*gr,7*gr,-.5,0,7);g.ellipse(p.x+14,160-gr*48,14*gr,7*gr,.5,0,7);g.fill();
    if(s.hold===i){g.fillStyle='#8fd0ff';for(let k=0;k<6;k++)g.fillRect(p.x-3+rnd(6),40+((k*29+performance.now()/4)%120),4,10);}
    txt(g,String(i+1),p.x,395,13,ok?COL.grn:'#c9d2ff');}},
  update(s,dt,api){if(s.hold>=0){const p=s.p[s.hold];p.v+=dt*.32;if(p.v>1){p.v=0;api.snd('fail');s.hold=-1;}}
   if(s.hold<0&&!s.fin&&s.p.every(p=>Math.abs(p.v-p.t)<.07)){s.fin=true;api.snd('done');api.win(.6);}},
  down(s,x,y){s.p.forEach((p,i)=>{if(Math.abs(x-p.x)<55&&y>40&&y<370)s.hold=i;});},up(s){s.hold=-1;},
  key(s,c,d){const m=c.match(/^Digit([1-3])$/);if(m){if(d)s.hold=+m[1]-1;else if(s.hold===+m[1]-1)s.hold=-1;}}},
 /* ---- LAB: add the right drops to match the recipe card ---- */
 mix:{title:'MIX SAMPLE',hint:'Add drops to match the recipe card, then press MIX.',accent:COL.cyn,
  init(s){do{s.want=[ri(4),ri(4),ri(4)];}while(s.want.reduce((a,b)=>a+b,0)<3);s.have=[0,0,0];s.msg='';s.drop=null;},
  cols:[[255,90,95],[255,210,58],[79,163,255]],
  mixc(c){const n=c.reduce((a,b)=>a+b,0);if(!n)return'rgba(220,240,255,.25)';let r=0,gg=0,b=0;c.forEach((k,i)=>{r+=this.cols[i][0]*k;gg+=this.cols[i][1]*k;b+=this.cols[i][2]*k;});return`rgb(${r/n|0},${gg/n|0},${b/n|0})`;},
  draw(g,s){rr(g,24,24,150,96,10);g.fillStyle='#f4ecc8';g.fill();txt(g,'RECIPE',99,46,11,'#6b5a2a');['RED','YEL','BLU'].forEach((l,i)=>txt(g,`${l} × ${s.want[i]}`,99,68+i*18,13,['#c0303a','#a07b00','#2a5fb0'][i]));
   rr(g,250,30,60,80,10);g.fillStyle=this.mixc(s.want);g.fill();txt(g,'TARGET',280,124,10,'#c9d2ff');
   // flask
   g.beginPath();g.moveTo(185,170);g.lineTo(235,170);g.lineTo(235,220);g.lineTo(290,330);g.quadraticCurveTo(295,350,270,350);g.lineTo(150,350);g.quadraticCurveTo(125,350,130,330);g.lineTo(185,220);g.closePath();g.fillStyle='rgba(255,255,255,.12)';g.fill();g.strokeStyle='#dfe9ff';g.lineWidth=4;g.stroke();
   const n=s.have.reduce((a,b)=>a+b,0);if(n){g.save();g.clip();g.fillStyle=this.mixc(s.have);g.fillRect(120,350-Math.min(170,n*22),180,180);g.restore();}
   ['#ff5a5f','#ffd23a','#4fa3ff'].forEach((c,i)=>{const x=60+i*0;const y=190+i*55;rr(g,30,y,70,40,10);g.fillStyle=c;g.fill();txt(g,'+ DROP',65,y+25,11,'#1a2142');txt(g,String(s.have[i]),112,y+26,14,'#f2f4ff','left');});
   rr(g,320,300,80,44,22);g.fillStyle=COL.grn;g.fill();txt(g,'MIX',360,328,14,'#10301a');rr(g,320,250,80,36,18);g.fillStyle='rgba(255,255,255,.12)';g.fill();txt(g,'EMPTY',360,273,11);
   if(s.drop){g.fillStyle=s.drop.c;g.beginPath();g.arc(210,s.drop.y,8,0,7);g.fill();}
   txt(g,s.msg,210,395,13,s.msg==='PERFECT!'?COL.grn:COL.red);},
  update(s,dt){if(s.drop){s.drop.y+=dt*500;if(s.drop.y>330)s.drop=null;}},
  add(s,i,api){s.have[i]++;s.drop={y:150,c:['#ff5a5f','#ffd23a','#4fa3ff'][i]};api.snd('blip',1+i*.15);s.msg='';if(s.have.reduce((a,b)=>a+b,0)>9){s.have=[0,0,0];s.msg='OVERFLOW · START AGAIN';api.snd('fail');}},
  check(s,api){if(s.have.every((v,i)=>v===s.want[i])){s.msg='PERFECT!';api.snd('done');api.win(.7);}else{s.msg='WRONG MIX · FLASK EMPTIED';s.have=[0,0,0];api.snd('fail');}},
  down(s,x,y,api){for(let i=0;i<3;i++)if(hit(x,y,30,190+i*55,70,40))this.add(s,i,api);if(hit(x,y,320,300,80,44))this.check(s,api);if(hit(x,y,320,250,80,36)){s.have=[0,0,0];api.snd('click');}},
  key(s,c,d,api){if(!d)return;const m=c.match(/^Digit([1-3])$/);if(m)this.add(s,+m[1]-1,api);if(c==='Enter'||c==='Space')this.check(s,api);}},
 /* ---- LAB pad: a visible task, anyone watching sees you float in the beam ---- */
 scan:{title:'GRAVITY TEST',hint:'Stand on the pad and float. Anyone watching sees your test.',accent:'#6cf7ff',
  init(s){s.p=0;s.t=0;},
  draw(g,s){const y=300-Math.sin(Math.min(1,s.p*3)*Math.PI/2)*90+Math.sin(s.t*3)*6;g.fillStyle='rgba(108,247,255,.12)';g.fillRect(130,60,160,300);for(let i=0;i<8;i++){g.fillStyle=`rgba(108,247,255,${.15+.1*Math.sin(s.t*4+i)})`;g.fillRect(130,60+((i*40+s.t*80)%300),160,3);}
   g.beginPath();g.ellipse(210,360,90,18,0,0,7);g.fillStyle='#4fe3ff';g.fill();g.beginPath();g.ellipse(210,y,48,44,0,0,7);g.fillStyle=s.css||'#f4f6fb';g.fill();g.fillStyle='#1a2142';g.beginPath();g.ellipse(195,y-8,6,8,0,0,7);g.ellipse(225,y-8,6,8,0,0,7);g.fill();
   ['MASS 41 kg','BOUNCE 98%','SQUISH OK','GRAV 0.00 g'].slice(0,Math.floor(s.p*5)).forEach((l,i)=>txt(g,l,300,110+i*24,11,'#9fe9ef','left'));
   rr(g,60,392,300,10,5);g.fillStyle='#141933';g.fill();rr(g,60,392,300*s.p,10,5);g.fillStyle='#6cf7ff';g.fill();},
  update(s,dt,api){s.t+=dt;s.p=Math.min(1,s.p+dt/7);if(s.p>=1&&!s.fin){s.fin=true;api.snd('done');api.win();}}},
 /* ---- POWER / ENGINE: rotate pipe tiles to link the inlet to the outlet ---- */
 pipes:{title:'ROUTE COOLANT',hint:'Click tiles to rotate them until coolant flows from IN to OUT.',accent:COL.blu,
  init(s){const N=4;s.N=N;let path;for(let tries=0;tries<50&&!path;tries++){const r0=ri(N),r1=ri(N);const seen=new Set();const out=[];
    const walk=(x,y)=>{if(x<0||y<0||x>=N||y>=N||seen.has(x+','+y))return false;seen.add(x+','+y);out.push([x,y]);if(x===N-1&&y===r1&&out.length>=5)return true;
     const d=[[1,0],[0,1],[0,-1],[-1,0]].sort(()=>Math.random()-.5);for(const[a,b]of d)if(walk(x+a,y+b))return true;out.pop();seen.delete(x+','+y);return false;};
    if(walk(0,r0)){path=out;s.r0=r0;s.r1=r1;}}
   const D={'0,-1':1,'1,0':2,'0,1':4,'-1,0':8};s.g=[...Array(N*N)].map(()=>Math.random()<.5?5:3);
   path.forEach(([x,y],i)=>{const p=i?path[i-1]:[x-1,y],n=i<path.length-1?path[i+1]:[x+1,y];s.g[y*N+x]=D[(p[0]-x)+','+(p[1]-y)]|D[(n[0]-x)+','+(n[1]-y)];});
   for(let i=0;i<N*N;i++){const k=1+ri(3);for(let j=0;j<k;j++)s.g[i]=this.rot(s.g[i]);}s.flow=new Set();this.calc(s);if(s.done)this.init(s);},
  rot:m=>((m<<1)|(m>>3))&15,
  calc(s){const N=s.N;s.flow=new Set();let st=[[0,s.r0,8]];s.done=false;while(st.length){const[x,y,from]=st.pop();if(x<0||y<0||x>=N||y>=N)continue;const m=s.g[y*N+x];if(!(m&from)||s.flow.has(y*N+x))continue;s.flow.add(y*N+x);
    if(x===N-1&&y===s.r1&&(m&2))s.done=true;for(const[b,dx,dy,op]of[[1,0,-1,4],[2,1,0,8],[4,0,1,1],[8,-1,0,2]])if(m&b)st.push([x+dx,y+dy,op]);}},
  draw(g,s){const N=s.N,S=72,ox=210-N*S/2,oy=220-N*S/2;txt(g,'IN',ox-26,oy+s.r0*S+S/2+5,12,COL.cyn);txt(g,'OUT',ox+N*S+26,oy+s.r1*S+S/2+5,12,s.done?COL.grn:'#c9d2ff');
   g.fillStyle=COL.cyn;g.fillRect(ox-14,oy+s.r0*S+S/2-8,14,16);g.fillStyle=s.done?COL.grn:'#5f6a8f';g.fillRect(ox+N*S,oy+s.r1*S+S/2-8,14,16);
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const m=s.g[y*N+x],cx=ox+x*S+S/2,cy=oy+y*S+S/2,on=s.flow.has(y*N+x);rr(g,ox+x*S+3,oy+y*S+3,S-6,S-6,10);g.fillStyle='#2d3760';g.fill();
    g.strokeStyle=on?(s.done?COL.grn:COL.cyn):'#8a94b8';g.lineWidth=16;g.lineCap='round';for(const[b,dx,dy]of[[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]])if(m&b){g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+dx*S/2,cy+dy*S/2);g.stroke();}
    g.beginPath();g.arc(cx,cy,9,0,7);g.fillStyle=on?'#fff':'#c9d2ff';g.fill();}},
  down(s,x,y,api){if(s.done)return;const N=s.N,S=72,ox=210-N*S/2,oy=220-N*S/2;const gx=Math.floor((x-ox)/S),gy=Math.floor((y-oy)/S);if(gx<0||gy<0||gx>=N||gy>=N)return;s.g[gy*N+gx]=this.rot(s.g[gy*N+gx]);api.snd('click');this.calc(s);if(s.done){api.snd('done');api.win(.7);}}},
 /* ---- CARGO: drag each crate to the bin with its colour ---- */
 crates:{title:'SORT CARGO',hint:'Drag each crate onto the bin of the same colour (or keys 1-3).',accent:COL.org,
  init(s){s.c=[...Array(6)].map(()=>ri(3));s.i=0;s.x=210;s.y=120;s.drag=false;s.shake=0;},
  bins:[[COL.red,'▲'],[COL.yel,'●'],[COL.blu,'■']],
  draw(g,s){g.fillStyle='#3a4366';g.fillRect(0,96,W,48);for(let i=0;i<14;i++){g.fillStyle='#4a5370';g.fillRect((i*34+performance.now()/30)%W,100,18,40);}
   this.bins.forEach(([c,sym],i)=>{const x=30+i*130;rr(g,x,290,100,100,14);g.fillStyle=c;g.globalAlpha=.85;g.fill();g.globalAlpha=1;txt(g,sym,x+50,350,30,'#1a2142');txt(g,String(i+1),x+50,382,11,'#1a2142');});
   for(let k=s.i+1;k<Math.min(s.c.length,s.i+3);k++)this.crate(g,330+(k-s.i)*60,120,s.c[k],.6);
   if(s.i<s.c.length)this.crate(g,s.x+(s.shake>0?Math.sin(s.shake*60)*6:0),s.y,s.c[s.i],1);txt(g,`${s.i}/${s.c.length}`,W-20,30,13,'#c9d2ff','right');},
  crate(g,x,y,k,sc){const[c,sym]=this.bins[k];g.save();g.translate(x,y);g.scale(sc,sc);rr(g,-34,-34,68,68,8);g.fillStyle='#c98b4c';g.fill();g.strokeStyle='#8a5a2c';g.lineWidth=4;g.stroke();g.beginPath();g.arc(0,0,20,0,7);g.fillStyle=c;g.fill();txt(g,sym,0,9,22,'#1a2142');g.restore();},
  update(s,dt){s.shake=Math.max(0,s.shake-dt);if(!s.drag){s.x+=(210-s.x)*dt*10;s.y+=(120-s.y)*dt*10;}},
  drop(s,b,api){if(s.i>=s.c.length)return;if(b===s.c[s.i]){s.i++;s.x=360;s.y=120;api.snd('blip',1+s.i*.08);if(s.i>=s.c.length){api.snd('done');api.win(.6);}}else{s.shake=.4;api.snd('fail');}},
  down(s,x,y){if(Math.hypot(x-s.x,y-s.y)<50)s.drag=true;},move(s,x,y){if(s.drag){s.x=x;s.y=y;}},
  up(s,x,y,api){if(!s.drag)return;s.drag=false;if(y>260){const b=Math.floor((x-15)/130);if(b>=0&&b<3)this.drop(s,b,api);}},
  key(s,c,d,api){if(!d)return;const m=c.match(/^Digit([1-3])$/);if(m)this.drop(s,+m[1]-1,api);}},
 /* ---- repairs ---- */
 lights:{title:'FLIP BREAKERS',hint:'Flip every breaker up to bring the lights back.',accent:COL.red,
  init(s){s.sw=[0,1,2,3,4].map(()=>Math.random()<.5);if(s.sw.every(Boolean))s.sw[2]=false;},
  draw(g,s){rr(g,30,70,360,280,18);g.fillStyle='#d3d8e6';g.fill();for(let i=0;i<5;i++){const x=78+i*66;rr(g,x-24,120,48,170,10);g.fillStyle='#2d3760';g.fill();g.fillStyle=s.sw[i]?COL.grn:COL.red;g.beginPath();g.arc(x,100,9,0,7);g.fill();rr(g,x-17,s.sw[i]?130:224,34,56,8);g.fillStyle='#f2f4ff';g.fill();txt(g,s.sw[i]?'ON':'OFF',x,312,11,'#2d3760');}},
  down(s,x,y,api){for(let i=0;i<5;i++){if(Math.abs(x-(78+i*66))<30&&y>110&&y<300){s.sw[i]=!s.sw[i];api.snd('click');if(s.sw.every(Boolean)){api.snd('fixed');api.win();}}}},
  key(s,c,d,api){if(!d)return;const m=c.match(/^Digit([1-5])$/);if(m){const i=+m[1]-1;s.sw[i]=!s.sw[i];api.snd('click');if(s.sw.every(Boolean)){api.snd('fixed');api.win();}}}},
 keypad:{title:'RESET SCRUBBER',hint:'Type the code from the sticky note.',accent:COL.red,
  init(s){s.code=[...Array(5)].map(()=>ri(10)).join('');s.in='';},
  draw(g,s){g.save();g.translate(84,150);g.rotate(-.06);rr(g,-60,-60,120,120,6);g.fillStyle='#ffe98a';g.fill();txt(g,'AIR CODE',0,-26,11,'#6b5a2a');txt(g,s.code,0,18,24,'#2a2210');g.restore();
   rr(g,180,60,210,48,10);g.fillStyle='#0f1430';g.fill();txt(g,s.in.padEnd(5,'·'),285,94,24,COL.grn);
   for(let i=0;i<12;i++){const c=i%3,r=i/3|0,x=200+c*64,y=124+r*64,l='123456789C0✓'[i];rr(g,x,y,54,54,12);g.fillStyle=l==='✓'?'#2f9a55':l==='C'?'#b03a3a':'#3a4570';g.fill();txt(g,l,x+27,y+35,18);}},
  down(s,x,y,api){for(let i=0;i<12;i++){const c=i%3,r=i/3|0,bx=200+c*64,by=124+r*64;if(x>bx&&x<bx+54&&y>by&&y<by+54)this.press(s,'123456789C0✓'[i],api);}},
  key(s,c,d,api){if(!d)return;const m=c.match(/^(?:Digit|Numpad)(\d)$/);if(m)this.press(s,m[1],api);if(c==='Enter'||c==='NumpadEnter')this.press(s,'✓',api);if(c==='Backspace')this.press(s,'C',api);},
  press(s,l,api){if(l==='C'){s.in='';api.snd('click');return;}if(l==='✓'){if(s.in===s.code){api.snd('fixed');api.win();}else{s.in='';api.snd('fail');}return;}if(s.in.length<5){s.in+=l;api.snd('click');}}},
};
export const GAME_TYPES=Object.keys(GAMES);

export class TaskUI{
 constructor(snd){this.snd=snd;this.cur=null;const el=this.el=document.createElement('div');el.id='task';el.hidden=true;
  el.innerHTML='<div class="tbox"><div class="thead"><b></b><span></span><button class="tx" title="Close (Esc)">✕</button></div><canvas width="420" height="420"></canvas><div class="tok">TASK COMPLETE!</div></div>';document.body.appendChild(el);
  this.cv=el.querySelector('canvas');this.g=this.cv.getContext('2d');el.querySelector('.tx').onclick=()=>this.close(true);
  const pos=e=>{const r=this.cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
  this.cv.addEventListener('pointerdown',e=>{if(!this.cur||this.cur.won)return;this.cv.setPointerCapture(e.pointerId);const[x,y]=pos(e);this.cur.G.down&&this.cur.G.down(this.cur.s,x,y,this.api);});
  this.cv.addEventListener('pointermove',e=>{if(!this.cur||this.cur.won)return;const[x,y]=pos(e);this.cur.G.move&&this.cur.G.move(this.cur.s,x,y,this.api);});
  this.cv.addEventListener('pointerup',e=>{if(!this.cur||this.cur.won)return;const[x,y]=pos(e);this.cur.G.up&&this.cur.G.up(this.cur.s,x,y,this.api);});
  addEventListener('keydown',e=>{if(!this.cur)return;if(e.code==='Escape'){this.close(true);e.stopImmediatePropagation();return;}if(this.cur.won)return;if(e.repeat&&e.code!=='ArrowLeft'&&e.code!=='ArrowRight'&&e.code!=='ArrowUp'&&e.code!=='ArrowDown')return;this.cur.G.key&&this.cur.G.key(this.cur.s,e.code,true,this.api);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();e.stopImmediatePropagation();},true);
  addEventListener('keyup',e=>{if(this.cur&&!this.cur.won&&this.cur.G.key)this.cur.G.key(this.cur.s,e.code,false,this.api);},true);
  this.api={snd:(k,a)=>this.snd.play(k,a),win:(delay=.45)=>{if(this.cur&&!this.cur.won){this.cur.won=true;this.cur.wt=delay+.35;this.el.classList.add('won');}}};}
 get active(){return !!this.cur;}
 open(type,o={}){const G=GAMES[type];if(!G)return false;this.cur={type,G,s:{id:o.id||'',css:o.css},o,won:false,wt:0};G.init(this.cur.s);this.el.hidden=false;this.el.classList.remove('won');this.el.style.setProperty('--acc',G.accent||'#ff4d00');
  this.el.querySelector('.thead b').textContent=o.title||G.title;this.el.querySelector('.thead span').textContent=(o.room?o.room+' · ':'')+G.hint;this.draw();return true;}
 close(cancel){if(!this.cur)return;const c=this.cur;this.cur=null;this.el.hidden=true;if(cancel&&c.o.onClose)c.o.onClose();}
 solve(){if(this.cur&&!this.cur.won){this.cur.won=true;this.cur.wt=0;}}
 update(dt){const c=this.cur;if(!c)return;if(c.won){c.wt-=dt;if(c.wt<=0){this.cur=null;this.el.hidden=true;c.o.onDone&&c.o.onDone();return;}}else if(c.G.update)c.G.update(c.s,dt,this.api);this.draw();}
 draw(){const c=this.cur;if(!c)return;const g=this.g;panelBg(g,c.G.accent||'#ff4d00');c.G.draw(g,c.s);}
}
