/* PIXEL ARCADE - frontier pack (round 30): twenty story-sized cabinets built around characters and places.
   Shared here: a character kit (outlined chibi people with eyes that blink, five hair styles, hats, outfits and
   something in hand), small creatures, and scenery pieces (round trees, pines, cottages with lit windows, clouds),
   so every game in the pack has a cast and a setting rather than shapes on a background. */
(function(){'use strict';const A=window.A,{W,H}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off',hi=()=>A.gfx==='high';
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),TAU=Math.PI*2,hyp=Math.hypot;
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};

/* ---------- character kit ---------- */
const OUT='rgba(22,14,30,.9)';
// fill a path, then ink it: the dark outline is what makes small characters read at 320x240
const ink=(path,fill,lw)=>{const c=A.c;c.beginPath();path(c);c.fillStyle=fill;c.fill();c.lineWidth=lw||.8;c.strokeStyle=OUT;c.stroke();};
const shade=(col,a,b)=>X.lg(-6,0,6,0,[X.lt(col,a||1.25),col,X.lt(col,b||.72)]);
/* hero(x,y,o): feet at x,y. o = {s scale, d facing 1/-1, st walk phase, skin, hair, style 0-4 (crop, spikes, long, bun, curls),
   top, bot, shoe, hat ('cap','straw','wizard','hood','helm','beanie','cowboy','chef'), hatC, cape, apron, hold(c) drawn at
   the front hand, arm (front arm angle), mood ('happy','o','sad'), seed (blink timing), bob} */
function hero(x,y,o){o=o||{};const c=A.c,s=o.s||1,d=o.d||1,st=o.st||0,sk=o.skin||'#f2c29a',hr=o.hair||'#3a2418',top=o.top||'#e2574c',bot=o.bot||'#2f3b63',sw=Math.sin(st),seed=o.seed||0;
 c.save();c.translate(x,y);if(lo())X.shadow(0,0,7*s,2*s,.35);c.scale(s*d,s);const bob=o.bob!==undefined?o.bob:Math.abs(Math.cos(st))*.8;c.translate(0,-bob);
 if(o.cape)ink(c=>{c.moveTo(-4,-18);c.quadraticCurveTo(-9-sw,-8,-7-sw*2,-2);c.lineTo(3,-4);c.lineTo(3,-18);c.closePath();},shade(o.cape,1.1,.6));
 for(const k of[1,-1]){c.save();c.translate(k*2.1,-9.5);c.rotate(sw*k*.55);ink(c=>c.rect(-1.7,0,3.4,7.5),shade(bot));ink(c=>c.ellipse(.9,7.9,2.7,1.6,0,0,TAU),o.shoe||'#4a3226');c.restore();}
 const arm=(k,a)=>{c.save();c.translate(k*1.5,-16.5);c.rotate(a);ink(c=>c.rect(-1.5,0,3,6),shade(top,1.1,.65));ink(c=>c.arc(0,7,1.8,0,TAU),sk,.7);if(k>0&&o.hold){c.translate(0,7);o.hold(c);}c.restore();};
 arm(-1,-sw*.5+.15);
 ink(c=>{c.moveTo(-5,-9);c.quadraticCurveTo(-5.8,-16.5,-3.2,-18.4);c.lineTo(3.2,-18.4);c.quadraticCurveTo(5.8,-16.5,5,-9);c.closePath();},shade(top));
 if(o.apron)ink(c=>c.rect(-3.5,-14,7,6),o.apron,.6);
 c.fillStyle='rgba(0,0,0,.28)';c.fillRect(-5,-10.6,10,1.4);c.fillStyle=X.lt(top,1.6);c.fillRect(-1.6,-18.2,3.2,1);
 arm(1,o.arm!==undefined?o.arm:sw*.5+.15);
 // head
 const hy=-24.6;c.fillStyle=X.lt(sk,.8);c.fillRect(-1.3,-20,2.6,2);
 if(o.style===2)ink(c=>{c.moveTo(-6,hy-2);c.quadraticCurveTo(-8,hy+6,-5,hy+9);c.lineTo(2,hy+8);c.lineTo(2,hy);c.closePath();},hr);
 const gr=X.rg(-2,hy-2,.5,0,hy,7,[X.lt(sk,1.15),sk,X.lt(sk,.8)]);ink(c=>c.arc(0,hy,6.3,0,TAU),gr);
 ink(c=>c.ellipse(-4.6,hy+.6,1.4,1.9,0,0,TAU),sk,.6);
 // hair
 if(o.style===1)ink(c=>{c.moveTo(-6.6,hy+1);for(let i=0;i<6;i++){const a=Math.PI*(1.05+i*.19);c.lineTo(Math.cos(a)*9.4,hy+Math.sin(a)*9.4);c.lineTo(Math.cos(a+.3)*6,hy+Math.sin(a+.3)*6);}c.lineTo(6.4,hy-1);c.closePath();},hr);
 else if(o.style===4){for(let i=0;i<7;i++){const a=Math.PI*(1+i*.16);ink(c=>c.arc(Math.cos(a)*5.4,hy+Math.sin(a)*5.4,2.6,0,TAU),hr,.6);}}
 else ink(c=>{c.arc(0,hy,6.6,Math.PI*1.02,Math.PI*1.98);c.quadraticCurveTo(3,hy-2,-1,hy-3.4);c.quadraticCurveTo(-4,hy-1,-6.5,hy+1.2);c.closePath();},hr);
 if(o.style===3)ink(c=>c.arc(-4,hy-6,2.8,0,TAU),hr);
 c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(-1,hy-5.2,2.6,.8,-.2,0,TAU);c.fill();
 // face: big eyes with highlight; blink every few seconds
 const bl=((A.t+seed*53)%200)<6;
 for(const ex of[1.3,4.4]){if(bl){c.fillStyle=OUT;c.fillRect(ex-1.2,hy+.2,2.4,.7);continue;}c.fillStyle='#fff';c.beginPath();c.ellipse(ex,hy+.4,1.35,1.8,0,0,TAU);c.fill();c.fillStyle=o.eye||'#2a1a30';c.beginPath();c.ellipse(ex+.35,hy+.6,.95,1.35,0,0,TAU);c.fill();c.fillStyle='#fff';c.fillRect(ex+.1,hy-.3,.6,.6);}
 c.fillStyle='rgba(255,110,110,.35)';c.beginPath();c.ellipse(1,hy+3,1.2,.7,0,0,TAU);c.ellipse(5.4,hy+3,1,.7,0,0,TAU);c.fill();
 c.strokeStyle=OUT;c.lineWidth=.6;c.beginPath();if(o.mood==='o'){c.arc(3.2,hy+3.6,.8,0,TAU);}else if(o.mood==='sad'){c.arc(3.2,hy+4.8,1.2,Math.PI*1.15,Math.PI*1.85);}else c.arc(3.2,hy+2.6,1.3,.25,Math.PI-.25);c.stroke();
 hat(o.hat,o.hatC,hy);
 c.restore();}
function hat(t,col,hy){if(!t)return;const c=A.c;col=col||'#c84a3a';
 if(t==='cap'){ink(c=>{c.arc(0,hy-1.5,6.6,Math.PI,0);c.closePath();},shade(col));ink(c=>c.rect(2,hy-2.2,7,1.6),X.lt(col,.75),.6);}
 else if(t==='straw'){ink(c=>c.ellipse(0,hy-3.5,10,2.2,0,0,TAU),'#e8c26a');ink(c=>{c.ellipse(0,hy-5,5.6,4,0,Math.PI,0);c.closePath();},'#f0d488');c.fillStyle=col;c.fillRect(-5.4,hy-5.4,10.8,1.4);}
 else if(t==='wizard'){ink(c=>c.ellipse(0,hy-4,9.5,2.2,0,0,TAU),shade(col));ink(c=>{c.moveTo(-5.5,hy-4.5);c.quadraticCurveTo(-1,hy-12,-3,hy-19);c.quadraticCurveTo(3,hy-11,5.5,hy-4.5);c.closePath();},shade(col));c.fillStyle='#ffe36a';c.fillRect(-1,hy-10,1.6,1.6);c.fillRect(1.6,hy-7,1.2,1.2);}
 else if(t==='hood'){ink(c=>{c.arc(0,hy,7.6,Math.PI*.82,Math.PI*2.18);c.quadraticCurveTo(0,hy-2,-6,hy+3);c.closePath();},shade(col));}
 else if(t==='helm'){ink(c=>{c.arc(0,hy-.5,7,Math.PI,0);c.lineTo(7,hy+1);c.lineTo(-7,hy+1);c.closePath();},X.lg(-7,0,7,0,['#e8ecf4','#9aa4b8','#5a6478']));c.fillStyle=col;c.fillRect(-.8,hy-11,1.6,4);}
 else if(t==='beanie'){ink(c=>{c.arc(0,hy-1,6.8,Math.PI,0);c.closePath();},shade(col));ink(c=>c.rect(-6.9,hy-2,13.8,2.2),X.lt(col,.8),.6);ink(c=>c.arc(0,hy-8.4,1.8,0,TAU),'#fff',.6);}
 else if(t==='cowboy'){ink(c=>{c.moveTo(-10,hy-3);c.quadraticCurveTo(0,hy-.5,10,hy-3);c.quadraticCurveTo(0,hy-5.5,-10,hy-3);},shade(col));ink(c=>{c.moveTo(-5,hy-4);c.lineTo(-4,hy-10);c.quadraticCurveTo(0,hy-8,4,hy-10);c.lineTo(5,hy-4);c.closePath();},shade(col));}
 else if(t==='chef'){ink(c=>c.rect(-5,hy-6,10,3.5),'#f4f4f8');for(const k of[-3,0,3])ink(c=>c.arc(k,hy-8,3,0,TAU),'#ffffff',.6);}}
// a round blob creature with feet and eyes (o: ears 'cat'|'bunny'|'horn', mood, d)
function critter(x,y,r,col,o){o=o||{};const c=A.c,d=o.d||1,t=A.t*.2+(o.seed||0);c.save();c.translate(x,y);if(lo())X.shadow(0,0,r,r*.3,.3);c.scale(d,1);const sq=1+Math.sin(t)*.05;
 for(const k of[-1,1])ink(c=>c.ellipse(k*r*.45,-r*.12,r*.32,r*.2,0,0,TAU),X.lt(col,.75),.6);
 if(o.ears==='cat')for(const k of[-1,1])ink(c=>{c.moveTo(k*r*.7,-r*1.5);c.lineTo(k*r*.85,-r*2.3);c.lineTo(k*r*.2,-r*1.85);c.closePath();},col,.6);
 if(o.ears==='bunny')for(const k of[-1,1])ink(c=>c.ellipse(k*r*.4,-r*2.2,r*.22,r*.7,k*.2,0,TAU),col,.6);
 if(o.ears==='horn')for(const k of[-1,1])ink(c=>{c.moveTo(k*r*.5,-r*1.7);c.lineTo(k*r*.75,-r*2.5);c.lineTo(k*r*.15,-r*1.85);c.closePath();},'#f4e8c8',.6);
 ink(c=>c.ellipse(0,-r,r*sq,r/sq,0,0,TAU),X.rg(-r*.3,-r*1.4,r*.1,0,-r,r*1.2,[X.lt(col,1.35),col,X.lt(col,.7)]));
 c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(-r*.3,-r*1.55,r*.35,r*.15,-.3,0,TAU);c.fill();
 const bl=((A.t+(o.seed||0)*41)%170)<5;for(const ex of[r*.05,r*.5]){if(bl){c.fillStyle=OUT;c.fillRect(ex-r*.12,-r*1.1,r*.26,.8);}else{c.fillStyle='#fff';c.beginPath();c.ellipse(ex,-r*1.1,r*.17,r*.23,0,0,TAU);c.fill();c.fillStyle=o.mood==='mad'?'#c81830':'#1a1020';c.beginPath();c.arc(ex+r*.05,-r*1.06,r*.11,0,TAU);c.fill();c.fillStyle='#fff';c.fillRect(ex,-r*1.2,.7,.7);}}
 if(o.mood==='mad'){c.strokeStyle=OUT;c.lineWidth=.8;c.beginPath();c.moveTo(-r*.1,-r*1.45);c.lineTo(r*.2,-r*1.3);c.moveTo(r*.65,-r*1.45);c.lineTo(r*.35,-r*1.3);c.stroke();}
 c.restore();}
/* scenery */
const tree=(x,y,r,col)=>{const c=A.c;X.shadow(x,y,r*.9,r*.25,.3);X.rr(x-r*.14,y-r*1.1,r*.28,r*1.1,1,X.lg(x-r*.14,0,x+r*.14,0,['#7a5434','#4a3020']));for(const[dx,dy,rr,f]of[[-.5,-1.5,.62,.8],[.5,-1.5,.62,.85],[0,-2.1,.75,1],[-.2,-1.8,.5,1.15]])X.disc(x+dx*r,y+dy*r,rr*r,X.rg(x+dx*r-rr*r*.3,y+dy*r-rr*r*.4,1,x+dx*r,y+dy*r,rr*r,[X.lt(col,1.3*f),X.lt(col,f),X.lt(col,.6*f)]));};
const pine=(x,y,h,col)=>{X.rr(x-1.2,y-h*.25,2.4,h*.25,.5,'#4a3020');for(let k=0;k<3;k++){const yb=y-h*.18-k*h*.24,w=h*(.32-k*.07);X.poly([[x-w,yb],[x,yb-h*.42],[x+w,yb]],k%2?X.lt(col,.85):col);X.poly([[x,yb-h*.42],[x+w,yb],[x+w*.3,yb]],'rgba(0,0,0,.18)');}};
const cottage=(x,y,w,h,wall,roof,lit)=>{X.shadow(x+w/2,y,w*.6,3,.3);X.rr(x,y-h,w,h,1,X.lg(x,0,x+w,0,[X.lt(wall,1.15),wall,X.lt(wall,.75)]));X.poly([[x-3,y-h],[x+w/2,y-h-h*.75],[x+w+3,y-h]],X.lg(0,y-h-h*.75,0,y-h,[X.lt(roof,1.2),roof]));X.stroke([[x-3,y-h],[x+w/2,y-h-h*.75],[x+w+3,y-h]],'rgba(0,0,0,.35)',1);
 const wc=lit?'#ffd87a':'#4a5a7a';X.rr(x+w*.18,y-h*.7,w*.22,h*.3,.5,wc);X.rr(x+w*.6,y-h*.7,w*.22,h*.3,.5,wc);if(lit&&lo()){X.glow(x+w*.29,y-h*.55,8,'#ffc860',.35);X.glow(x+w*.71,y-h*.55,8,'#ffc860',.35);}X.rr(x+w*.42,y-h*.42,w*.16,h*.42,.5,'#5a3a24');};
const cloud=(x,y,s,col)=>{col=col||'#ffffff';for(const[dx,dy,r]of[[-10,0,7],[0,-4,9],[10,0,7],[4,2,7],[-4,2,6]])X.disc(x+dx*s,y+dy*s,r*s,col);};
const T=(s,x,y,col,sc,al)=>X.ot(s,x,y,col,sc||1,al);
// shared with later packs (games/voyage.js)
A.kit={hero,hat,critter,tree,pine,cottage,cloud,ink,shade,OUT};

/* ================= LIGHTHOUSE KEEPER ================= */
// a storm on the sea; ships make for the harbour channel and only the ones you light see the reef
A.add({id:'lighthouse',name:'LIGHTHOUSE KEEPER',cat:'CLASSICS',tags:'beam ships storm guide',how:'UP/DOWN SWING THE BEAM. LIGHT SHIPS SO THEY STEER INTO THE CHANNEL. A = FLARE.',make(){
 const g={over:null,score:0},fx=X.fx(),LX=44,LY=74,CH0=170,CH1=188;let ang=.35,ships=[],t=0,lives=3,flare=0,cd=0,saved=0,bolt=0,rain=[];for(let i=0;i<60;i++)rain.push({x:rnd(W),y:rnd(H)});
 const reef=y=>y<CH0-2||y>CH1+2;
 g.update=()=>{t++;if(flare)flare--;if(cd)cd--;if(bolt)bolt--;else if(Math.random()<.004){bolt=10;S('boom');}const k=A.in(0);ang=cl(ang+ay(k)*.022,.05,1.05);if(A.hit(0).a&&!cd){flare=40;cd=150;S('power');fx.ring(LX,LY,'#fff3b0',60,18);}
  if(t%Math.max(70,170-t/30|0)===1){const y=118+rnd(100);ships.push({x:W+20,y,ty:y,lit:0,ok:!reef(y),v:.45+rnd(.35)+t/9000,bob:rnd(6),c:['#c84a3a','#3a6ac8','#2a9a6a','#c8a03a'][ri(4)]});}
  const bw=flare?.2:.09;for(const s of ships){s.x-=s.v;s.bob+=.06;const a=Math.atan2(s.y-LY,s.x-LX);if(Math.abs(a-ang)<bw&&s.x<W){s.lit++;if(s.lit===14&&!s.ok){s.ok=1;s.ty=CH0+4+rnd(CH1-CH0-8);g.score+=5;fx.pop(s.x,s.y-16,'SEEN!','#fff3b0');S('blip');}}
   s.y+=(s.ty-s.y)*.03;if(s.x<150&&s.x>120&&reef(s.y)&&!s.dead){s.dead=1;lives--;S('lose');A.shake=6;fx.debris(s.x,s.y,'#8a5a3a',14,2.2);fx.spark(s.x,s.y,'#fff',10,2);fx.pop(s.x,s.y-18,'WRECKED','#ff6a5a');if(lives<=0)g.over='LOST AT SEA';}
   if(s.x<120&&!s.dead&&!s.home){s.home=1;saved++;g.score+=20;S('coin');fx.pop(s.x,s.y-16,'+20','#7dff9a');}}
  ships=ships.filter(s=>s.x>-30&&!(s.dead&&s.x<100));for(const r of rain){r.x-=2;r.y+=7;if(r.y>H){r.y=-5;r.x=rnd(W+60);}}};
 g.draw=()=>{const c=A.c;X.cache('fr_light',()=>{X.sky(['#0a1020','#16233a','#2a3a52','#3a4a5a'],140);X.vg(0,0,W,90,['rgba(0,0,0,.4)','rgba(0,0,0,0)']);for(let i=0;i<9;i++)cloud(30+i*38,22+(i%3)*10,1.4+(i%2)*.4,i%2?'#1e2a40':'#243248');
   X.vg(0,112,W,128,['#16324a','#0c1e30','#081420']);for(let i=0;i<60;i++){const y=118+i*2,o=(i*17)%40;c.fillStyle='rgba(140,180,220,'+(.05+i*.0015)+')';for(let x=-o;x<W;x+=40)c.fillRect(x,y,14+(i%3)*4,1);}
   for(const[x,y,r]of[[126,118,7],[132,140,10],[124,160,8],[136,202,9],[128,222,11],[140,232,8]]){X.disc(x,y,r,X.rg(x-3,y-3,1,x,y,r,['#5a5a62','#33333a','#1a1a20']));X.ell(x,y+r*.5,r*1.2,2,'rgba(220,240,255,.25)');}
   X.poly([[0,90],[30,84],[64,92],[86,112],[100,140],[96,240],[0,240]],X.lg(0,90,90,240,['#3a3a34','#24241e','#141410']));X.poly([[0,94],[30,88],[64,96],[70,100],[0,104]],'#3a5a2a');
   X.rr(34,LY,20,24,1,X.lg(34,0,54,0,['#e8e4dc','#b8b0a4','#7a7268']));X.poly([[30,92],[58,92],[62,90],[26,90]],'#5a2a24');
   X.poly([[30,90],[58,90],[54,44],[34,44]],X.lg(30,0,58,0,['#f4f0e8','#c8c0b4','#8a8278']));for(const yy of[52,66,80])X.poly([[34.3,yy],[54,yy],[54.6,yy+6],[33.4,yy+6]],'#b83a32');X.rr(40,74,6,8,1,'#ffd87a');
   X.rr(31,40,26,4,1,'#2a2a30');X.rr(36,30,16,10,1,'rgba(255,240,180,.4)');X.poly([[34,30],[44,22],[54,30]],'#5a2a24');X.vignette(.45);});
  // beam: additive cone from the lamp
  const bw=flare?.2:.09,L=330,b1=ang-bw,b2=ang+bw;c.save();if(lo())c.globalCompositeOperation='lighter';X.poly([[LX,LY-38],[LX+Math.cos(b1)*L,LY-38+Math.sin(b1)*L],[LX+Math.cos(b2)*L,LY-38+Math.sin(b2)*L]],X.lg(LX,0,LX+260,0,['rgba(255,240,170,.55)','rgba(255,240,170,.16)','rgba(255,240,170,0)']));c.restore();X.glow(LX,LY-38,flare?40:22,'#fff3b0',.8);X.disc(LX,LY-38,3.4,'#fffbe0');
  // the keeper on the gallery, cranking the lamp
  hero(LX+12,LY-27,{s:.62,d:1,top:'#3a5a8a',bot:'#2a2a3a',hat:'beanie',hatC:'#c84a3a',style:4,hair:'#c86a2a',arm:-1.2+ang,seed:3,bob:0});
  for(const s of ships){const y=s.y+Math.sin(s.bob)*1.5,x=s.x,lit=s.lit>0&&s.ok;c.save();c.translate(x,y);c.rotate(Math.sin(s.bob)*.08);X.poly([[-12,0],[12,0],[9,6],[-9,6]],X.lg(0,0,0,6,['#7a4a2a','#4a2a18']));c.fillStyle='rgba(0,0,0,.3)';c.fillRect(-10,2,20,1);X.rr(-.6,-20,1.2,20,0,'#3a2a1a');X.poly([[1,-19],[11,-4],[1,-4]],lit?'#fff8e8':'#c8c0b0');X.poly([[-1,-17],[-9,-5],[-1,-5]],s.c);c.fillStyle=lit?'#ffd87a':'#6a5a3a';c.fillRect(-7,1.5,2,2);c.fillRect(-2,1.5,2,2);c.fillRect(3,1.5,2,2);c.restore();
   if(lo())X.ell(x,y+7,14,2,'rgba(220,240,255,.2)');if(!s.ok&&x<W&&A.t%30<15){T('!',x,y-30,'#ff6a5a',1,'c');}}
  c.fillStyle='rgba(120,255,160,.25)';c.fillRect(150,CH0,4,CH1-CH0);c.fillStyle='rgba(120,255,160,.6)';c.fillRect(150,CH0,4,1);c.fillRect(150,CH1,4,1);
  if(lo()){c.strokeStyle='rgba(170,200,230,.35)';c.lineWidth=.8;c.beginPath();for(const r of rain){c.moveTo(r.x,r.y);c.lineTo(r.x-2,r.y+7);}c.stroke();}
  if(bolt){c.fillStyle='rgba(220,230,255,'+(bolt/20)+')';c.fillRect(0,0,W,H);}
  fx.draw();X.bar('SAVED '+saved,String(g.score),'','#7dff9a','#ffe27a');for(let i=0;i<3;i++)X.heart(130+i*12,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');X.meter(W-60,22,50,4,1-cd/150,'#fff3b0');};
 return g;}});

/* ================= MUSHROOM FORAGER ================= */
A.add({id:'forager',name:'MUSHROOM FORAGER',cat:'ACTION',tags:'forest mushrooms basket boar',how:'LEFT/RIGHT WALK. A PICKS. SKIP RED TOADSTOOLS. UP JUMPS THE BOAR. 3 HEARTS.',make(){
 const g={over:null,score:0},fx=X.fx(),GY=206;let p={x:160,vy:0,y:0,d:1,st:0,pick:0},sh=[],boar=null,t=0,lives=3,inv=0,cam=0,basket=0;
 const spawn=()=>{const x=cam+20+rnd(W-40);const bad=Math.random()<.28,gold=!bad&&Math.random()<.12;sh.push({x,kind:bad?2:gold?1:0,g:0,life:900});};for(let i=0;i<4;i++)spawn();
 g.update=()=>{t++;if(inv)inv--;if(p.pick)p.pick--;const k=A.in(0),h=A.hit(0);const dx=ax(k);if(dx){p.x+=dx*1.6;p.d=dx;p.st+=.25;}else p.st*=.8;cam+=(p.x-160-cam)*.08;
  if(h.u&&p.y===0){p.vy=-4.2;S('jump');}p.vy+=.25;p.y=Math.min(0,p.y+p.vy);if(p.y===0)p.vy=0;
  if(h.a&&!p.pick){p.pick=14;const m=sh.find(m=>Math.abs(m.x-p.x-p.d*6)<11&&m.g>.9);if(m){m.done=1;if(m.kind===2){lives--;inv=60;S('lose');fx.pop(m.x-cam,GY-30,'YUCK!','#ff6a5a');A.shake=4;if(lives<=0)g.over='POISONED';}else{const v=m.kind===1?50:10;g.score+=v;basket++;S('coin');fx.spark(m.x-cam,GY-8,m.kind?'#ffe27a':'#fff0d0',8,1.6);fx.pop(m.x-cam,GY-26,'+'+v,m.kind?'#ffe27a':'#fff');}}}
  for(const m of sh){m.g=Math.min(1,m.g+.04);m.life--;}sh=sh.filter(m=>!m.done&&m.life>0);if(sh.length<6&&t%40===0)spawn();
  if(!boar&&t>300&&t%420===0){const fromL=Math.random()<.5;boar={x:fromL?cam-30:cam+W+30,v:fromL?2.6:-2.6};S('power');}
  if(boar){boar.x+=boar.v;if(!inv&&Math.abs(boar.x-p.x)<12&&p.y>-10){lives--;inv=80;S('hit');A.shake=7;fx.pop(160,90,'OOF!','#ff6a5a');if(lives<=0)g.over='TRAMPLED';}if(boar.x<cam-60||boar.x>cam+W+60)boar=null;}};
 g.draw=()=>{const c=A.c;X.cache('fr_forest',()=>{X.sky(['#9ad0e8','#c8e4d0','#e8ecc8']);X.glow(250,40,90,'#fff6c8',.5);X.hills(150,30,'#8ab8a0',0,.02,3);X.hills(170,24,'#6a9a74',40,.03,5);});
  const o1=cam*.35;for(let k=Math.floor(o1/46)-1;k<Math.floor(o1/46)+9;k++){const x=k*46-o1,h=hash(k,3);pine(x,176,46+h*30,h<.5?'#2a5a3a':'#2f6a44');}
  c.save();if(lo())c.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const x=((i*97-cam*.5)%400+400)%400-40;X.poly([[x,0],[x+26,0],[x-30,GY],[x-70,GY]],'rgba(255,250,210,.07)');}c.restore();
  const o2=cam*.7;for(let k=Math.floor(o2/90)-1;k<Math.floor(o2/90)+5;k++){const x=k*90-o2+hash(k,5)*30;tree(x,GY-6,22+hash(k,7)*8,hash(k,9)<.5?'#3f8a3a':'#4a9a42');}
  X.vg(0,GY-6,W,H-GY+6,['#5a7a32','#3a5222','#26361a']);for(let i=0;i<40;i++){const x=((i*29-cam)%W+W)%W;X.stroke([[x,GY-4],[x-2,GY-10-(i%4)*2]],'#7aa040',1.2);}
  for(const m of sh){const x=m.x-cam,s=m.g,cap=m.kind===2?'#d8282a':m.kind===1?'#f0b830':'#9a5a2a';if(x<-20||x>W+20)continue;c.save();c.translate(x,GY-2);c.scale(s,s);X.shadow(0,1,7,2,.3);X.rr(-2.4,-8,4.8,8,2,'#f4ead4');ink(c=>{c.ellipse(0,-8,8,5.4,0,Math.PI,0);c.closePath();},X.lg(0,-14,0,-8,[X.lt(cap,1.35),cap]));if(m.kind===2)for(const[a,b]of[[-4,-10],[1,-12],[4,-9.5]])X.disc(a,b,1.1,'#fff');if(m.kind===1&&lo())X.glow(0,-9,10,'#ffe27a',.35);c.restore();}
  if(boar){const x=boar.x-cam,d=boar.v>0?1:-1,r=A.t*.6;c.save();c.translate(x,GY);c.scale(d,1);X.shadow(0,0,13,3,.4);for(let i=0;i<4;i++)ink(c=>c.rect(-8+i*5,-6+Math.sin(r+i)*1,2.6,6),'#3a2418',.6);ink(c=>c.ellipse(0,-10,12,7,0,0,TAU),X.lg(0,-17,0,-3,['#8a5a3a','#5a3a24']));ink(c=>c.ellipse(11,-10,5,4.5,0,0,TAU),'#7a4a2e');ink(c=>c.ellipse(15,-9,2.2,2,0,0,TAU),'#d8a090',.6);X.stroke([[12,-7],[15,-11]],'#f4f0e0',1.4);X.disc(11,-12,1,'#1a0a0a');c.restore();}
  if(!(inv&&A.t%6<3))hero(p.x-cam,GY+p.y,{d:p.d,st:p.st,top:'#c86a3a',bot:'#3a4a2a',hat:'straw',hatC:'#4a8a3a',style:2,hair:'#6a3a1e',seed:1,arm:p.pick?-1.6+p.pick*.08:undefined,
   hold:c=>{X.rr(-4,0,8,6,2,'#b8884a');c.strokeStyle='#7a5430';c.lineWidth=.8;c.beginPath();c.arc(0,1,4,Math.PI,0);c.stroke();for(let i=0;i<Math.min(4,basket);i++)X.disc(-2.5+i*1.7,0,1.4,'#9a5a2a');}});
  fx.draw();X.bar('BASKET '+basket,String(g.score),'','#fff0d0','#ffe27a');for(let i=0;i<3;i++)X.heart(130+i*12,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');};
 return g;}});

/* ================= TRAIN HOP ================= */
A.add({id:'trainhop',name:'TRAIN HOP',cat:'ACTION',tags:'train roof runner desert',how:'A OR UP JUMPS THE GAPS. DOWN DUCKS UNDER SIGNAL BRIDGES. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx(),RY=168;let x=0,v=2.4,py=0,vy=0,duck=0,cars=[],bridges=[],t=0,lives=3,inv=0,st=0,dist=0;
 let ex=0;const addCar=()=>{const w=70+ri(40);cars.push({x:ex,w,c:['#8a3a2a','#3a5a7a','#6a6a3a','#5a3a6a'][ri(4)],tank:Math.random()<.25});ex+=w+16+ri(Math.min(26,6+dist/200|0));};while(ex<600)addCar();
 g.update=()=>{t++;if(inv)inv--;v=Math.min(4.2,2.4+t/2400);x+=v;dist+=v;g.score=dist/10|0;st+=.32;const k=A.in(0),h=A.hit(0);duck=k.d&&py===0?1:0;
  if((h.a||h.u)&&py===0){vy=-4.6;S('jump');}vy+=.26;py=Math.min(0,py+vy);const px=x+90,on=cars.find(c=>px>=c.x-2&&px<=c.x+c.w+2);if(py===0&&!on){py=.01;}
  if(py>0){vy=Math.max(vy,1);py+=vy;}if(py===0)vy=0;
  if(py>30){lives--;inv=90;S('lose');A.shake=6;fx.pop(160,90,'FELL!','#ff6a5a');py=0;vy=0;const n=cars.find(c=>c.x>px-40);if(n)x=n.x+10-90;if(lives<=0)g.over='OFF THE RAILS';}
  if(ex-x<500)addCar();cars=cars.filter(c=>c.x+c.w>x-40);if(t%260===0)bridges.push({x:x+W+40});
  for(const b of bridges)if(!b.hit&&!inv&&Math.abs(b.x-px)<6&&!duck&&py>-14){b.hit=1;lives--;inv=90;S('hit');A.shake=7;fx.pop(160,90,'BONK!','#ff6a5a');if(lives<=0)g.over='CLOTHESLINED';}else if(!b.pass&&b.x<px-8){b.pass=1;dist+=60;fx.pop(90,RY-40,'DUCKED +6','#7dff9a');}
  bridges=bridges.filter(b=>b.x>x-60);};
 g.draw=()=>{const c=A.c;X.cache('fr_desert',()=>{X.sky(['#3a2a5a','#a04a5a','#f08a4a','#ffd08a'],150);X.glow(230,120,120,'#ffe0a0',.55);X.disc(230,124,22,'#fff0c0');X.hills(130,14,'#c86a5a',0,.015,2);
   for(const[mx,mw,mh]of[[20,60,50],[110,40,34],[250,70,58]]){X.poly([[mx,150],[mx+8,150-mh],[mx+mw-8,150-mh],[mx+mw,150]],X.lg(0,150-mh,0,150,['#b85a40','#7a3a2e']));X.rr(mx+8,150-mh,mw-16,3,0,'#d8785a');}
   X.vg(0,150,W,90,['#d89a5a','#a86a3a','#6a4226']);});
  const o1=x*.25;for(let k=Math.floor(o1/70)-1;k<Math.floor(o1/70)+6;k++){const cx=k*70-o1,h=hash(k,11);if(h<.5)continue;X.rr(cx,128,3,22,1,'#3a5a2a');X.rr(cx-5,134,5,2,1,'#3a5a2a');X.rr(cx-5,128,2,8,1,'#3a5a2a');X.rr(cx+3,131,5,2,1,'#3a5a2a');X.rr(cx+6,126,2,7,1,'#3a5a2a');}
  c.fillStyle='#4a3020';c.fillRect(0,RY+28,W,3);for(let i=0;i<20;i++){const tx=((i*20-x)%W+W)%W;c.fillStyle='#3a2416';c.fillRect(tx,RY+29,10,4);}c.fillStyle='#9a9aa8';c.fillRect(0,RY+27,W,1.5);
  for(const cr of cars){const cx=cr.x-x;if(cx>W+10||cx+cr.w<-10)continue;X.shadow(cx+cr.w/2,RY+30,cr.w*.5,3,.4);for(const wx of[cx+12,cx+cr.w-12]){X.disc(wx,RY+26,5,'#2a2a30');X.disc(wx,RY+26,2,'#8a8a90');}
   if(cr.tank){X.rr(cx,RY+4,cr.w,20,9,X.lg(0,RY+4,0,RY+24,[X.lt(cr.c,1.4),cr.c,X.lt(cr.c,.6)]));X.rr(cx+cr.w/2-4,RY,8,5,1,'#3a3a40');}
   else{X.rr(cx,RY,cr.w,24,1,X.lg(0,RY,0,RY+24,[X.lt(cr.c,1.3),cr.c,X.lt(cr.c,.65)]));c.fillStyle='rgba(0,0,0,.25)';for(let i=6;i<cr.w-4;i+=8)c.fillRect(cx+i,RY+3,1,19);X.rr(cx+cr.w/2-7,RY+5,14,15,1,'rgba(0,0,0,.3)');}
   c.fillStyle='rgba(255,255,255,.18)';c.fillRect(cx,RY,cr.w,1.2);}
  for(const b of bridges){const bx=b.x-x+90-90;X.rr(bx-3,RY-60,6,100,1,'#3a3a44');X.rr(bx-14,RY-26,28,8,1,X.lg(0,RY-26,0,RY-18,['#6a6a78','#3a3a44']));X.disc(bx-8,RY-22,2,A.t%30<15?'#ff4040':'#5a1010');X.disc(bx+8,RY-22,2,A.t%30>=15?'#ff4040':'#5a1010');}
  if(lo())for(let i=0;i<5;i++){c.globalAlpha=.35-i*.06;X.disc(60-i*14-(A.t%20),RY-30-i*6,4+i*2,'#d8c8b8');}c.globalAlpha=1;
  const hx=90,hy=RY+py;if(!(inv&&A.t%6<3)){if(duck){c.save();c.translate(hx,hy);c.scale(1,.62);hero(0,0,{st:0,top:'#2a7a9a',bot:'#4a3a2a',hat:'cowboy',hatC:'#8a5a2e',style:0,hair:'#2a1a10',seed:5,bob:0});c.restore();}else hero(hx,hy,{st:py<0?1.2:st,top:'#2a7a9a',bot:'#4a3a2a',hat:'cowboy',hatC:'#8a5a2e',style:0,hair:'#2a1a10',seed:5,cape:'#c84a3a'});}
  fx.draw();X.bar((dist/10|0)+' M',String(g.score),'','#ffe0a0','#ffe27a');for(let i=0;i<3;i++)X.heart(130+i*12,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');};
 return g;}});

/* ================= SKY FISHER ================= */
A.add({id:'skyfisher',name:'SKY FISHER',cat:'CLASSICS',tags:'fishing clouds island',how:'MOVE THE HOOK. TOUCH A FISH, THEN HAUL IT UP TO THE ISLAND. STORM GULLS CUT LINES.',make(){
 const g={over:null,score:0},fx=X.fx(),RX=150,RY=62;let hk={x:150,y:110},fish=[],gulls=[],t=0,lines=3,got=null,inv=0;
 const FS=[{c:'#ff9a4a',v:10,r:5},{c:'#4ad8ff',v:20,r:4},{c:'#ff5ac8',v:40,r:3.5},{c:'#ffe24a',v:80,r:6}];
 g.update=()=>{t++;if(inv)inv--;const k=A.in(0);hk.x=cl(hk.x+ax(k)*2.2,8,W-8);hk.y=cl(hk.y+ay(k)*2,RY+14,H-10);
  if(fish.length<7&&t%45===0){const i=Math.random()<.08?3:Math.random()<.2?2:Math.random()<.45?1:0,L=Math.random()<.5;fish.push({x:L?-10:W+10,y:100+rnd(H-110),v:(L?1:-1)*(.5+rnd(.8)),i,ph:rnd(6)});}
  if(t>240&&t%Math.max(110,300-t/20|0)===0){const L=Math.random()<.5;gulls.push({x:L?-20:W+20,y:80+rnd(130),v:(L?1:-1)*(1.4+rnd(.8))});}
  for(const f of fish){f.x+=f.v;f.ph+=.15;if(!got&&hyp(f.x-hk.x,f.y-hk.y)<f.r+4){got=f;f.on=1;S('blip');fx.spark(f.x,f.y,'#fff',6,1.4);}}
  if(got){got.x=hk.x;got.y=hk.y+6;if(hk.y<RY+20){g.score+=FS[got.i].v;S('coin');fx.pop(hk.x,RY-6,'+'+FS[got.i].v,FS[got.i].c);fx.spark(hk.x,RY+10,FS[got.i].c,12,2);got.done=1;got=null;}}
  fish=fish.filter(f=>!f.done&&f.x>-20&&f.x<W+20||f.on&&!f.done);
  for(const b of gulls){b.x+=b.v;b.y+=Math.sin(t*.05+b.x*.02)*.6;if(!inv){const dx=hk.x-RX,dy=hk.y-RY,L=hyp(dx,dy),u=cl(((b.x-RX)*dx+(b.y-RY)*dy)/(L*L),0,1),px=RX+dx*u,py=RY+dy*u;if(hyp(b.x-px,b.y-py)<7){lines--;inv=80;S('lose');A.shake=4;fx.pop(b.x,b.y-12,'SNAP!','#ff6a5a');if(got){got.done=1;got=null;}hk={x:RX,y:RY+40};if(lines<=0)g.over='OUT OF LINE';}}}
  gulls=gulls.filter(b=>b.x>-30&&b.x<W+30);};
 g.draw=()=>{const c=A.c;X.cache('fr_sky',()=>{X.sky(['#4a7ad8','#7aa8f0','#b8d4ff','#e8f0ff']);X.glow(60,30,70,'#fff8d0',.6);for(let i=0;i<14;i++)cloud((i*53)%W,90+(i*37)%130,1+(i%3)*.4,i%2?'rgba(255,255,255,.7)':'rgba(240,246,255,.85)');
   X.poly([[96,62],[204,62],[188,80],[160,96],[130,88],[110,76]],X.lg(0,62,0,96,['#8a6a4a','#5a4030','#3a2a20']));X.vg(96,58,108,6,['#6ac04a','#4a9a3a']);for(let i=0;i<5;i++)X.stroke([[120+i*16,96-i%2*5],[122+i*16,106-i%2*4]],'#5a7a3a',1);tree(116,60,10,'#4a9a42');cottage(172,60,18,12,'#e8d8b8','#c84a3a',false);});
  const t2=A.t;for(let i=0;i<3;i++){const x=((i*140+t2*.2)%440)-60;c.globalAlpha=.55;cloud(x,140+i*30,1.3,'#ffffff');c.globalAlpha=1;}
  for(const f of fish){const F=FS[f.i],d=f.on?1:Math.sign(f.v)||1;c.save();c.translate(f.x,f.y);c.scale(d,1);if(f.i===3&&lo())X.glow(0,0,12,'#ffe24a',.4);X.poly([[-F.r-4,0],[-F.r-8,-4+Math.sin(f.ph)*1.5],[-F.r-8,4+Math.sin(f.ph)*1.5]],X.lt(F.c,.8));ink(c=>c.ellipse(0,0,F.r+2,F.r,0,0,TAU),X.lg(0,-F.r,0,F.r,[X.lt(F.c,1.4),F.c,X.lt(F.c,.7)]),.6);ink(c=>{c.moveTo(-1,-F.r);c.quadraticCurveTo(1,-F.r-4,4,-F.r+.5);},'rgba(255,255,255,.6)',.5);X.disc(F.r-.6,-1,1.3,'#fff');X.disc(F.r-.3,-1,.7,'#1a1020');c.restore();}
  for(const b of gulls){const d=Math.sign(b.v),fl=Math.sin(A.t*.4+b.x)*4;c.save();c.translate(b.x,b.y);c.scale(d,1);ink(c=>c.ellipse(0,0,6,3,0,0,TAU),'#4a4a5a',.6);ink(c=>{c.moveTo(-2,-1);c.quadraticCurveTo(-6,-7-fl,-11,-3-fl);c.lineTo(-2,1);},'#3a3a48',.6);X.poly([[6,-.5],[10,0],[6,1]],'#ffb030');X.disc(4,-1,.8,'#ffe060');c.restore();if(lo())X.glow(b.x,b.y,8,'#8a7aff',.2);}
  c.strokeStyle=inv&&A.t%6<3?'rgba(255,255,255,.2)':'rgba(255,255,255,.85)';c.lineWidth=.8;c.beginPath();c.moveTo(RX+8,RY-22);c.quadraticCurveTo((RX+hk.x)/2,(RY+hk.y)/2+10,hk.x,hk.y);c.stroke();X.disc(hk.x,hk.y,2,'#d8d8e0');X.disc(hk.x,hk.y-4,2.4,'#ff4a4a');
  hero(RX,RY,{d:1,top:'#f0c040',bot:'#3a4a8a',hat:'straw',hatC:'#3a8ad8',style:3,hair:'#2a1a10',seed:2,bob:0,arm:-2.3,hold:c=>{X.stroke([[0,0],[8,-14]],'#7a5430',1.4);}});
  fx.draw();X.bar('LINES '+lines,String(g.score),'','#ffffff','#ffe27a');};
 return g;}});

/* ================= NIGHT MARKET ================= */
A.add({id:'nightmarket',name:'NIGHT MARKET',cat:'SIM',tags:'food stall customers orders lanterns',how:'LEFT/RIGHT PICK A DISH, A SERVES THE FRONT CUSTOMER. MATCH THEIR ORDER. 3 STARS.',make(){
 const g={over:null,score:0},fx=X.fx(),D=[{n:'DUMPLINGS',c:'#f4ead4'},{n:'NOODLES',c:'#f0c060'},{n:'SKEWERS',c:'#c86a3a'},{n:'BUNS',c:'#ffd0e0'}];let sel=0,q=[],t=0,stars=3,served=0,combo=0,steam=[];
 const LOOK=[['#3a8ad8','#2a2a3a','cap','#c84a3a',0],['#c84a8a','#3a2a4a',null,null,2],['#4aa86a','#2a3a2a','beanie','#f0c040',1],['#f0a03a','#3a3a5a','straw','#c84a3a',3],['#8a6ad8','#2a2a3a','hood','#5a3a8a',4],['#e85a4a','#2a3a5a',null,null,3]];
 const add=()=>q.push({o:ri(D.length),p:900-Math.min(500,t/6),pm:900-Math.min(500,t/6),x:W+20,look:ri(LOOK.length),skin:['#f2c29a','#c68a5e','#8a5a3a','#f6d2b8'][ri(4)],hair:['#2a1a10','#6a3a1e','#c89040','#1a1a1a'][ri(4)],seed:ri(99)});
 add();
 g.update=()=>{t++;const h=A.hit(0);if(h.l)sel=(sel+D.length-1)%D.length;if(h.r)sel=(sel+1)%D.length;if(h.l||h.r)S('blip');
  if(q.length<4&&t%Math.max(90,220-t/25|0)===0)add();q.forEach((c,i)=>{const tx=150+i*44;c.x+=(tx-c.x)*.08;c.p--;});
  if(h.a&&q.length&&q[0].x<170){const c=q[0];if(c.o===sel){combo++;const v=10+combo*2+Math.round(c.p/c.pm*10);g.score+=v;served++;S('coin');fx.pop(150,96,'+'+v,'#7dff9a');fx.spark(150,120,D[sel].c,10,1.8);c.done=1;}else{combo=0;stars--;S('lose');fx.pop(150,96,'WRONG!','#ff6a5a');A.shake=4;c.done=1;if(stars<=0)g.over='MARKET CLOSED';}}
  for(const c of q)if(!c.done&&c.p<=0){c.done=1;combo=0;stars--;S('lose');fx.pop(150,96,'LEFT HUNGRY','#ff6a5a');if(stars<=0)g.over='MARKET CLOSED';}q=q.filter(c=>!c.done);
  if(t%6===0)steam.push({x:16+sel*28+rnd(6)-3,y:158,l:40});steam.forEach(s=>{s.y-=.5;s.x+=Math.sin(s.y*.1)*.3;s.l--;});steam=steam.filter(s=>s.l>0);};
 g.draw=()=>{const c=A.c;X.cache('fr_market',()=>{X.sky(['#0a0a24','#1a1440','#3a1a4a'],170);X.stars(40,9,0,0,60,.6);
   for(let i=0;i<6;i++){const x=i*58-10;X.rr(x,60+(i%2)*10,46,110,1,X.lg(0,60,0,170,['#2a2240','#1a1830']));for(let r=0;r<3;r++)for(let k=0;k<3;k++)X.rr(x+6+k*13,70+(i%2)*10+r*22,8,12,1,hash(i,r*3+k)<.6?'#ffcf6a':'#2a2a48');}
   X.vg(0,170,W,70,['#3a2a2a','#2a1e1e','#1a1414']);for(let i=0;i<12;i++){c.fillStyle='rgba(255,180,90,.06)';c.fillRect(i*28,170,1,70);}X.ell(160,232,140,10,'rgba(255,170,80,.1)');
   X.rr(0,150,124,60,2,X.lg(0,150,0,210,['#8a3a2a','#5a2418']));X.rr(-4,146,132,6,2,'#c8a06a');X.rr(4,90,4,60,1,'#5a3a24');X.rr(116,90,4,60,1,'#5a3a24');
   for(let i=0;i<8;i++)X.poly([[i*16,84],[i*16+16,84],[i*16+16,96],[i*16+8,100],[i*16,96]],i%2?'#e8e0d0':'#c83a3a');X.ot('MOON NOODLE',62,72,'#ffd87a',1,'c');X.vignette(.4);});
  // lantern string with swaying glow
  c.strokeStyle='rgba(40,30,30,.9)';c.lineWidth=.8;c.beginPath();c.moveTo(0,30);c.quadraticCurveTo(160,60,320,30);c.stroke();for(let i=0;i<9;i++){const x=16+i*36,y=30+Math.sin(i/8*Math.PI)*15*1.1+Math.sin(A.t*.04+i)*1,col=['#ff5a4a','#ffb03a','#ff7ac8'][i%3];if(lo())X.glow(x,y+5,16,col,.35);ink(c=>c.ellipse(x,y+5,4,5,0,0,TAU),X.lg(x-4,0,x+4,0,[X.lt(col,1.4),col,X.lt(col,.6)]),.6);c.fillStyle='#2a1a1a';c.fillRect(x-1.5,y-.5,3,1.5);c.fillRect(x-1.5,y+9.5,3,1.5);}
  // the cook behind the counter
  hero(62,150,{s:1.1,d:1,top:'#f4f4f8',bot:'#2a2a3a',hat:'chef',style:0,hair:'#1a1a1a',seed:7,apron:'#c83a3a',arm:-1.4+Math.sin(A.t*.2)*.3,bob:0,mood:'happy'});
  for(let i=0;i<D.length;i++){const x=16+i*28,y=160,s=i===sel;X.rr(x-11,y-2,22,16,3,s?'#ffe27a':'rgba(0,0,0,.35)');X.ell(x,y+8,9,4,'#f4f4f8');dish(i,x,y+5);if(s&&A.t%30<20)X.poly([[x-3,y+20],[x+3,y+20],[x,y+16]],'#ffe27a');}
  if(lo())for(const s of steam){c.globalAlpha=s.l/40*.4;X.disc(s.x,s.y,3+(40-s.l)*.1,'#ffffff');}c.globalAlpha=1;
  q.forEach((cu,i)=>{const L=LOOK[cu.look];hero(cu.x,206,{d:-1,s:1.05,top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],skin:cu.skin,hair:cu.hair,seed:cu.seed,mood:cu.p<cu.pm*.3?'sad':'happy',st:Math.abs(cu.x-(150+i*44))>2?A.t*.3:0});
   if(i<3){const bx=cu.x,by=148;X.rr(bx-12,by-14,24,18,5,'#ffffff');X.poly([[bx-3,by+4],[bx+3,by+4],[bx-1,by+8]],'#ffffff');dish(cu.o,bx,by-5);X.meter(bx-10,by+10,20,3,cu.p/cu.pm,cu.p<cu.pm*.3?'#ff5a4a':'#7dff9a');}});
  fx.draw();X.bar('SERVED '+served,String(g.score),D[sel].n,'#ffd87a','#ffe27a');for(let i=0;i<3;i++)X.ot('*',304-i*12,22,i<stars?'#ffe27a':'rgba(255,255,255,.2)',2);};
 const dish=(i,x,y)=>{if(i===0)for(let k=0;k<3;k++){ink(c=>{c.arc(x-4+k*4,y,2.8,Math.PI,0);c.closePath();},'#f4ead4',.5);}else if(i===1){X.ell(x,y,7,3,'#d84a2a');for(let k=0;k<4;k++)X.stroke([[x-5+k*3,y-1],[x-3+k*3,y-4]],'#f0c060',1);X.stroke([[x+2,y-2],[x+8,y-9]],'#5a3a24',.8);}else if(i===2){for(let k=0;k<2;k++){X.stroke([[x-6+k*5,y+2],[x-2+k*5,y-7]],'#c8a06a',.8);for(let j=0;j<3;j++)X.disc(x-5+k*5+j*1.3,y-j*2.7,1.6,j%2?'#5aa03a':'#c86a3a');}}else{for(let k=0;k<2;k++)ink(c=>c.arc(x-3+k*6,y-1,3,0,TAU),'#ffe0ea',.5);X.disc(x-3,y-2,.8,'#e84a7a');X.disc(x+3,y-2,.8,'#e84a7a');}};
 return g;}});

/* ================= CRYSTAL CAVE ================= */
A.add({id:'crystalcave',name:'CRYSTAL CAVE',cat:'ACTION',tags:'mine lantern bats crystals',how:'MOVE THE MINER. GRAB CRYSTALS. A SWINGS THE PICK AT BATS. LANTERN OIL RUNS LOW.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:150,d:1,st:0,sw:0},cr=[],bats=[],oil=1,t=0,lives=3,inv=0;
 const rocks=[];for(let i=0;i<14;i++)rocks.push({x:20+((i*67)%280),y:50+((i*41)%170),r:8+(i*7)%10});
 const free=(x,y)=>!rocks.some(r=>hyp(r.x-x,r.y-y)<r.r+6);
 const add=()=>{for(let n=0;n<30;n++){const x=16+rnd(W-32),y=40+rnd(H-56);if(free(x,y)&&hyp(x-p.x,y-p.y)>40){cr.push({x,y,c:['#6af0ff','#ff6ad8','#9a7aff','#7dff9a'][ri(4)],oil:Math.random()<.2});return;}}};for(let i=0;i<5;i++)add();
 g.update=()=>{t++;if(inv)inv--;if(p.sw)p.sw--;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx)p.d=dx;const nx=cl(p.x+dx*1.5,10,W-10),ny=cl(p.y+dy*1.5,34,H-8);if(free(nx,p.y))p.x=nx;if(free(p.x,ny))p.y=ny;if(dx||dy)p.st+=.3;
  oil=Math.max(0,oil-.0006-t/4e6);if(A.hit(0).a&&!p.sw){p.sw=16;S('hit');for(const b of bats)if(hyp(b.x-p.x-p.d*10,b.y-p.y+12)<16){b.dead=1;g.score+=15;fx.spark(b.x,b.y,'#c8a0ff',10,2);fx.pop(b.x,b.y-10,'+15','#c8a0ff');}}
  for(const c of cr)if(hyp(c.x-p.x,c.y-p.y+8)<12){c.done=1;if(c.oil){oil=Math.min(1,oil+.45);fx.pop(c.x,c.y-12,'OIL!','#ffd87a');S('power');}else{g.score+=10;fx.pop(c.x,c.y-12,'+10',c.c);S('coin');}fx.spark(c.x,c.y,c.c,10,1.8);}cr=cr.filter(c=>!c.done);while(cr.length<5)add();
  if(bats.length<2+t/900&&t%150===0){const L=Math.random()<.5;bats.push({x:L?-10:W+10,y:40+rnd(160),vx:0,vy:0});}
  const lr=40+oil*60;for(const b of bats){const ddx=p.x-b.x,ddy=p.y-12-b.y,d=hyp(ddx,ddy)||1,scared=d<lr*.5&&oil>.15;b.vx=(b.vx+(scared?-ddx:ddx)/d*.08)*.96;b.vy=(b.vy+(scared?-ddy:ddy)/d*.08+Math.sin(t*.2+b.x)*.05)*.96;b.x+=b.vx*1.6;b.y+=b.vy*1.6;
   if(!inv&&d<9){lives--;inv=90;S('lose');A.shake=5;fx.pop(p.x,p.y-30,'BITTEN!','#ff6a5a');if(lives<=0)g.over='LOST IN THE DARK';}}bats=bats.filter(b=>!b.dead&&b.x>-40&&b.x<W+40);
  if(oil<=0&&t%120===0){lives--;S('lose');if(lives<=0)g.over='LANTERN OUT';}};
 g.draw=()=>{const c=A.c;X.cache('fr_cave',()=>{X.vg(0,0,W,H,['#2a2438','#1c1828','#120e1a']);for(let i=0;i<200;i++){c.fillStyle=i%2?'rgba(255,255,255,.03)':'rgba(0,0,0,.12)';c.fillRect(hash(i,1)*W,hash(i,2)*H,2+hash(i,3)*6,1+hash(i,4)*3);}
   for(let i=0;i<9;i++){const x=i*38+10;X.poly([[x,24],[x+10,24],[x+5,44+hash(i,5)*20]],'#3a3248');}
   for(const r of rocks){X.shadow(r.x+2,r.y+r.r*.6,r.r,r.r*.3,.5);X.disc(r.x,r.y,r.r,X.rg(r.x-r.r*.4,r.y-r.r*.4,1,r.x,r.y,r.r,['#6a6278','#443c52','#2a2436']));for(let k=0;k<3;k++)X.gem(r.x-r.r*.5+k*r.r*.5,r.y-r.r*.6,2,['#6af0ff','#9a7aff','#ff6ad8'][k]);}
   X.rr(250,190,40,30,2,'#3a2a20');for(let i=0;i<4;i++)X.rr(252,192+i*7,36,1,0,'#2a1a10');X.rr(260,180,20,12,2,'#5a5a64');});
  for(const cc of cr){const pu=Math.sin(A.t*.1+cc.x)*.15+1;if(lo())X.glow(cc.x,cc.y,14*pu,cc.oil?'#ffd87a':cc.c,.45);if(cc.oil){X.rr(cc.x-3.5,cc.y-6,7,9,2,X.lg(cc.x-3.5,0,cc.x+3.5,0,['#ffe8a0','#c8902a']));X.rr(cc.x-1.5,cc.y-8,3,2,.5,'#5a3a1a');}else{X.poly([[cc.x,cc.y-9*pu],[cc.x+4,cc.y-2],[cc.x+2,cc.y+3],[cc.x-2,cc.y+3],[cc.x-4,cc.y-2]],X.lg(cc.x-4,0,cc.x+4,0,[X.lt(cc.c,1.5),cc.c,X.lt(cc.c,.6)]));X.poly([[cc.x,cc.y-9*pu],[cc.x+1.5,cc.y-2],[cc.x,cc.y+3]],'rgba(255,255,255,.45)');}}
  for(const b of bats){const f=Math.sin(A.t*.8+b.x)*5;c.save();c.translate(b.x,b.y);ink(c=>{c.moveTo(-2,0);c.quadraticCurveTo(-8,-4-f,-13,-1-f);c.quadraticCurveTo(-8,1,-5,3);c.closePath();},'#3a2a4a',.6);ink(c=>{c.moveTo(2,0);c.quadraticCurveTo(8,-4-f,13,-1-f);c.quadraticCurveTo(8,1,5,3);c.closePath();},'#3a2a4a',.6);ink(c=>c.ellipse(0,0,3.6,4,0,0,TAU),'#4a3a5a',.6);X.disc(-1.2,-1,.8,'#ff4a4a');X.disc(1.2,-1,.8,'#ff4a4a');c.restore();}
  if(!(inv&&A.t%6<3))hero(p.x,p.y,{d:p.d,st:p.st,top:'#c86a2a',bot:'#3a3a4a',hat:'helm',hatC:'#ffd87a',style:0,hair:'#5a3a1e',seed:4,arm:p.sw?-2.4+(16-p.sw)*.2:-.4,hold:c=>{X.stroke([[0,0],[0,-12]],'#7a5430',1.4);X.poly([[-6,-12],[6,-13],[0,-10]],'#b8c0d0');}});
  if(c.createRadialGradient){const lr=40+oil*60,gr=c.createRadialGradient(p.x,p.y-14,lr*.25,p.x,p.y-14,lr*1.5+20);if(gr&&gr.addColorStop){gr.addColorStop(0,'rgba(255,200,120,0)');gr.addColorStop(.5,'rgba(6,4,14,.55)');gr.addColorStop(1,'rgba(4,2,10,.94)');c.fillStyle=gr;c.fillRect(0,0,W,H);}}
  X.glow(p.x,p.y-20,20,'#ffc860',.35);
  fx.draw();X.bar('LIVES '+lives,String(g.score),'LANTERN','#ffd87a','#ffe27a');X.meter(120,12,80,3,oil,oil<.25?'#ff5a4a':'#ffd87a');};
 return g;}});

/* ================= MAIL OWL ================= */
A.add({id:'mailowl',name:'MAIL OWL',cat:'CLASSICS',tags:'owl letters night village',how:'UP/DOWN FLY. A DROPS A LETTER INTO A LIT MAILBOX. DODGE BRANCHES AND BATS.',make(){
 const g={over:null,score:0},fx=X.fx();let oy=100,vy=0,ld=[],houses=[],obs=[],t=0,lives=3,inv=0,cx=0,miss=0,cd=0;
 let hx=200;const addH=()=>{houses.push({x:hx,h:24+ri(20),w:30+ri(12),lit:Math.random()<.7,c:['#d8b890','#b8c8d8','#e8c8c8','#c8d8b8'][ri(4)],r:['#7a3a3a','#3a4a6a','#5a3a5a'][ri(3)],got:0});hx+=70+ri(60);};for(let i=0;i<6;i++)addH();
 g.update=()=>{t++;if(inv)inv--;if(cd)cd--;const sp=1.6+t/3000;cx+=sp;const k=A.in(0);vy=(vy+ay(k)*.25)*.9;oy=cl(oy+vy,40,170);
  if(A.hit(0).a&&!cd){cd=18;ld.push({x:cx+80,y:oy+6,vx:sp,vy:0});S('blip');}
  for(const l of ld){l.vy+=.12;l.x+=l.vx*.98;l.y+=l.vy;const h=houses.find(h=>l.x>h.x+h.w*.55&&l.x<h.x+h.w*.55+12&&l.y>200-8&&l.y<206);if(h&&!l.done){l.done=1;if(h.lit&&!h.got){h.got=1;g.score+=20;S('coin');fx.pop(l.x-cx,180,'+20','#ffd87a');fx.spark(l.x-cx,200,'#ffd87a',10,1.8);}else{fx.pop(l.x-cx,180,'NOT HOME','#8ab8ff');}}if(l.y>214&&!l.done){l.done=1;}}ld=ld.filter(l=>!l.done);
  for(const h of houses)if(h.lit&&!h.got&&!h.missed&&h.x+h.w<cx+20){h.missed=1;miss++;fx.pop(30,150,'MISSED A HOUSE','#ff8a7a');if(miss>=5)g.over='MAILBAG FULL';}
  if(hx-cx<500)addH();houses=houses.filter(h=>h.x+h.w>cx-40);
  if(t%120===0&&t>120){obs.push(Math.random()<.5?{k:'b',x:cx+W+20,y:50+rnd(110)}:{k:'t',x:cx+W+20,y:0,h:30+rnd(40)});}
  for(const o of obs){if(o.k==='b'){o.x-=.8;o.y+=Math.sin(t*.1+o.x)*.8;}const hit=o.k==='b'?hyp(o.x-cx-80,o.y-oy)<10:Math.abs(o.x-cx-80)<10&&oy<o.h+6;if(hit&&!inv){lives--;inv=90;S('lose');A.shake=5;fx.pop(80,oy-16,'OUCH!','#ff6a5a');if(lives<=0)g.over='GROUNDED';}}obs=obs.filter(o=>o.x>cx-30);};
 g.draw=()=>{const c=A.c;X.cache('fr_owl',()=>{X.sky(['#0a1030','#1a2450','#2a3a6a','#3a3a62']);X.stars(90,21,0,0,150,.8);X.glow(250,46,60,'#dce8ff',.3);X.disc(250,46,16,X.rg(245,41,2,250,46,16,['#ffffff','#e0e8f4','#a8b8d0']));X.disc(244,44,2.5,'rgba(120,140,170,.35)');X.disc(255,51,2,'rgba(120,140,170,.35)');});
  const o1=cx*.2;for(let k=Math.floor(o1/50)-1;k<Math.floor(o1/50)+8;k++)pine(k*50-o1,190,40+hash(k,4)*30,'#1a2a3a');X.hills(196,8,'#16243a',cx*.4,.03,7);
  X.vg(0,204,W,36,['#2a3a4a','#1a2632','#121a22']);
  for(const h of houses){const x=h.x-cx;cottage(x,204,h.w,h.h,h.c,h.r,h.lit);const mx=x+h.w*.55;X.rr(mx+4,192,1.5,12,0,'#3a2a20');X.rr(mx,186,10,7,2,h.got?'#5a9a5a':'#c84a3a');if(h.lit&&!h.got){X.rr(mx+8,180,1,6,0,'#fff');X.poly([[mx+9,180],[mx+13,182],[mx+9,184]],'#ffd87a');}}
  for(const o of obs){const x=o.x-cx;if(o.k==='t'){X.rr(x-3,0,6,o.h,1,'#3a2a20');for(let i=0;i<3;i++)X.disc(x+(i-1)*7,o.h-2+i%2*3,7,'#1a3a2a');}else{const f=Math.sin(A.t*.8)*4;ink(c=>{c.moveTo(x,o.y);c.quadraticCurveTo(x-6,o.y-4-f,x-11,o.y-f);c.lineTo(x,o.y+3);},'#3a2a4a',.6);ink(c=>{c.moveTo(x,o.y);c.quadraticCurveTo(x+6,o.y-4-f,x+11,o.y-f);c.lineTo(x,o.y+3);},'#3a2a4a',.6);X.disc(x,o.y,3,'#4a3a5a');}}
  for(const l of ld){const x=l.x-cx;c.save();c.translate(x,l.y);c.rotate(l.vy*.2);X.rr(-4,-3,8,6,.5,'#f4ead4');X.stroke([[-4,-3],[0,0],[4,-3]],'#c8a06a',.6);X.disc(0,.5,1,'#c83a3a');c.restore();}
  if(!(inv&&A.t%6<3)){const x=80,y=oy,f=Math.sin(A.t*.35)*6;c.save();c.translate(x,y);if(lo())X.glow(0,0,18,'#ffd87a',.12);
   ink(c=>{c.moveTo(-3,-2);c.quadraticCurveTo(-12,-8-f,-18,-2-f);c.quadraticCurveTo(-10,2,-3,4);c.closePath();},'#8a6a4a',.7);
   ink(c=>c.ellipse(0,0,8,9,0,0,TAU),X.rg(-2,-3,1,0,0,10,['#c8a070','#9a7044','#6a4a2e']));ink(c=>c.ellipse(1,3,4.5,5,0,0,TAU),'#e8d8b8',.5);for(let i=0;i<3;i++)X.stroke([[-1+i*1.5,1+i],[1+i*1.5,2+i]],'#b89a70',.6);
   for(const k of[-1,1])ink(c=>{c.moveTo(k*3,-7);c.lineTo(k*6,-12);c.lineTo(k*6.5,-6);c.closePath();},'#8a6a4a',.6);for(const ex of[-2.6,2.6]){ink(c=>c.arc(ex,-3,2.6,0,TAU),'#fff8d0',.5);X.disc(ex+.5,-3,1.3,'#1a1020');X.disc(ex+.9,-3.6,.5,'#fff');}X.poly([[-1,0],[1,0],[0,2.4]],'#ffb030');
   ink(c=>{c.moveTo(3,-2);c.quadraticCurveTo(12,-8-f,18,-2-f);c.quadraticCurveTo(10,2,3,4);c.closePath();},'#9a7a54',.7);X.rr(-5,5,7,5,1,'#7a4a2a');c.restore();}
  fx.draw();X.bar('MISSED '+miss+'/5',String(g.score),'','#ffd87a','#ffe27a');for(let i=0;i<3;i++)X.heart(140+i*12,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');};
 return g;}});

/* ================= GONDOLA ================= */
A.add({id:'gondola',name:'GONDOLA',cat:'CLASSICS',tags:'canal boat city steer',how:'LEFT/RIGHT STEER. PICK UP PASSENGERS AT THE STEPS, DROP THEM AT THE FLAG. DODGE BOATS.',make(){
 const g={over:null,score:0},fx=X.fx(),CL=70,CR=250;let x=160,vx=0,scroll=0,boats=[],stops=[],t=0,hull=3,inv=0,rider=null,d=0;
 g.update=()=>{t++;if(inv)inv--;const sp=1.3+t/4000;scroll+=sp;const k=A.in(0);vx=(vx+ax(k)*.18)*.92;x=cl(x+vx,CL+10,CR-10);d+=.05;
  if(t%Math.max(60,140-t/40|0)===0){const L=Math.random()<.5;boats.push({x:CL+16+rnd(CR-CL-32),y:-30,v:sp*(.3+rnd(.5)),c:['#3a6ac8','#c84a3a','#2a8a6a'][ri(3)]});}
  if(t%200===100)stops.push({y:-20,side:Math.random()<.5?0:1,kind:rider?1:0});
  for(const b of boats){b.y+=sp-b.v;if(!inv&&Math.abs(b.x-x)<12&&Math.abs(b.y-190)<20){hull--;inv=90;S('hit');A.shake=6;fx.pop(x,170,'BUMP!','#ff6a5a');if(rider){rider=null;fx.pop(x,156,'PASSENGER JUMPED','#ff8a7a');}if(hull<=0)g.over='SUNK';}}boats=boats.filter(b=>b.y<H+40);
  for(const s of stops){s.y+=sp;const sx=s.side?CR-14:CL+14;if(!s.done&&Math.abs(s.y-190)<12&&Math.abs(sx-x)<26){if(s.kind===0&&!rider){rider={look:ri(4),seed:ri(99)};s.done=1;S('blip');fx.pop(x,170,'ALL ABOARD','#7dff9a');}else if(s.kind===1&&rider){rider=null;s.done=1;g.score+=30;S('coin');fx.spark(x,180,'#ffd87a',14,2);fx.pop(x,166,'+30','#ffd87a');}}}stops=stops.filter(s=>s.y<H+30);
  if(t%30===0)g.score+=1;};
 g.draw=()=>{const c=A.c;const o=scroll%40;
  X.vg(CL,0,CR-CL,H,['#2a6a7a','#1e5a6a','#1a4a5a']);c.fillStyle='rgba(180,230,240,.12)';for(let i=-1;i<8;i++){const y=i*40+o;for(let k=0;k<4;k++)c.fillRect(CL+10+k*45+((i*13)%20),y+(k%2)*14,20,1.4);}
  for(const side of[0,1]){const x0=side?CR:0,w=side?W-CR:CL;for(let i=-1;i<5;i++){const y=i*64+(scroll%64),hh=hash(Math.floor((scroll-i*64)/64)+i*0,side*7+i);const col=['#e8b88a','#d8987a','#f0d0a0','#c8a0a0'][Math.floor(hash(Math.floor(scroll/64)-i,side)*4)];
    X.rr(x0,y,w,62,0,X.lg(x0,0,x0+w,0,side?[X.lt(col,.7),col]:[col,X.lt(col,.7)]));for(let r=0;r<2;r++)for(let q=0;q<2;q++){const wx=x0+10+q*(w-30),wy=y+10+r*24;X.rr(wx,wy,10,14,4,'#3a2a3a');X.rr(wx,wy,10,14,4,'rgba(255,210,120,'+(hash(i+r,q+side)<.4?.8:0)+')');X.rr(wx-1,wy+13,12,2,0,'#8a6a4a');}
    if(hash(Math.floor((scroll+(4-i)*64)/64),side+3)<.4){X.rr(side?x0+2:x0+w-14,y+44,12,3,1,'#5a8a3a');for(let f=0;f<4;f++)X.disc((side?x0+4:x0+w-12)+f*3,y+43,1.4,['#ff6a8a','#ffd87a'][f%2]);}}
   X.rr(side?CR-4:CL-2,0,6,H,0,'rgba(60,40,30,.5)');}
  for(const s of stops){const sx=s.side?CR:CL-20;X.rr(sx,s.y-8,20,16,1,'#c8b8a0');for(let i=0;i<3;i++)X.rr(sx,s.y-8+i*5,20,1,0,'rgba(0,0,0,.2)');if(s.kind===0&&!s.done)hero(s.side?CR+10:CL-10,s.y+6,{s:.8,d:s.side?-1:1,top:'#8a4ad8',bot:'#2a2a3a',hat:'straw',hatC:'#3a3a8a',style:3,seed:s.y|0,bob:0});if(s.kind===1){X.rr(s.side?CR+4:CL-6,s.y-26,1.4,22,0,'#fff');X.poly([[s.side?CR+5:CL-5,s.y-26],[s.side?CR+15:CL+5,s.y-22],[s.side?CR+5:CL-5,s.y-18]],A.t%20<10?'#ffd87a':'#ffb030');}}
  for(const b of boats){c.save();c.translate(b.x,b.y);X.ell(0,4,10,22,'rgba(0,0,0,.25)');ink(c=>{c.moveTo(0,-20);c.quadraticCurveTo(9,-6,7,14);c.lineTo(-7,14);c.quadraticCurveTo(-9,-6,0,-20);},X.lg(-8,0,8,0,[X.lt(b.c,1.3),b.c,X.lt(b.c,.6)]));X.rr(-5,-4,10,10,1,'rgba(255,255,255,.8)');c.restore();}
  c.save();c.translate(x,190);c.rotate(vx*.04);if(lo())for(let i=0;i<4;i++){c.globalAlpha=.25-i*.05;X.ell(0,26+i*7,6+i*3,2,'#cfeef4');}c.globalAlpha=1;X.ell(2,4,10,26,'rgba(0,0,0,.3)');ink(c=>{c.moveTo(0,-30);c.quadraticCurveTo(10,-10,6,22);c.quadraticCurveTo(0,28,-6,22);c.quadraticCurveTo(-10,-10,0,-30);},X.lg(-8,0,8,0,['#3a3a44','#1a1a22','#0a0a10']));X.rr(-4,-8,8,10,2,'#8a2a3a');X.poly([[0,-30],[3,-36],[1,-30]],'#d8c070');
   if(rider){const L=[['#e85a8a','straw'],['#4aa8e8','cap'],['#f0b040','beanie'],['#8ad85a','hood']][rider.look];hero(0,2,{s:.75,top:L[0],bot:'#2a2a3a',hat:L[1],hatC:'#3a3a6a',style:rider.look,seed:rider.seed,bob:0,mood:'happy'});}
   hero(0,22,{s:.85,top:'#f4f4f4',bot:'#1a1a2a',hat:'straw',hatC:'#c83a3a',style:0,hair:'#1a1a1a',seed:8,bob:0,arm:-.6+Math.sin(d*2)*.5,hold:c=>X.stroke([[0,0],[8,16]],'#7a5430',1.2)});c.restore();
  fx.draw();X.bar(rider?'TO THE FLAG':'FIND A RIDER',String(g.score),'','#7dff9a','#ffe27a');for(let i=0;i<3;i++)X.heart(176+i*12,8,1,i<hull?'#ff4f6d':'rgba(255,255,255,.2)');};
 return g;}});

/* ================= DINO DIG ================= */
A.add({id:'dinodig',name:'DINO DIG',cat:'PUZZLE',tags:'fossil dig brush archaeology',how:'MOVE THE TROWEL. A BRUSHES DIRT AWAY, B CHISELS FAST BUT CRACKS BONE. FIND EVERY BONE.',make(){
 const g={over:null,score:0},fx=X.fx(),GW=14,GH=9,CS=18,OX=34,OY=46;let cur={x:7,y:4},dirt,bone,crack,lvl=1,wait=0,mv=0,cracks=0;
 const SK=[[[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,3],[10,3],[11,3],[11,2],[4,5],[5,6],[7,5],[8,6],[2,3],[1,3]],[[2,5],[3,5],[4,4],[5,4],[6,4],[7,4],[8,4],[9,5],[10,5],[5,2],[5,3],[6,2],[4,6],[6,6],[8,6],[11,6]],[[3,3],[4,3],[5,4],[6,4],[7,4],[8,4],[9,4],[10,3],[11,2],[12,2],[6,5],[6,6],[8,5],[8,6],[2,2],[1,2],[4,6],[10,6]]];
 const make=()=>{dirt=new Uint8Array(GW*GH).fill(2);bone=new Uint8Array(GW*GH);crack=new Uint8Array(GW*GH);const s=SK[(lvl-1)%SK.length],ox=ri(2),oy=ri(2);for(const[a,b]of s){const x=Math.min(GW-1,a+ox),y=Math.min(GH-1,b+oy);bone[y*GW+x]=1;}for(let i=0;i<GW*GH;i++)if(Math.random()<.25&&!bone[i])dirt[i]=3;};make();
 const left=()=>{let n=0;for(let i=0;i<GW*GH;i++)if(bone[i]&&dirt[i])n++;return n;};
 g.update=()=>{if(wait){if(--wait===0){lvl++;make();}return;}if(mv)mv--;const k=A.in(0),h=A.hit(0);if(!mv&&(ax(k)||ay(k))){cur.x=cl(cur.x+ax(k),0,GW-1);cur.y=cl(cur.y+ay(k),0,GH-1);mv=6;}
  const i=cur.y*GW+cur.x;if(h.a&&dirt[i]){dirt[i]--;S('blip');fx.debris(OX+cur.x*CS+9,OY+cur.y*CS+9,'#b88a5a',4,1.2);if(!dirt[i]&&bone[i]){g.score+=10;fx.pop(OX+cur.x*CS+9,OY+cur.y*CS-4,'+10','#fff0d0');S('coin');}}
  if(h.b&&dirt[i]){if(bone[i]){crack[i]=1;cracks++;g.score=Math.max(0,g.score-15);S('lose');fx.pop(OX+cur.x*CS+9,OY+cur.y*CS-4,'CRACK!','#ff6a5a');A.shake=3;if(cracks>=6){g.over='MUSEUM SAYS NO';return;}}dirt[i]=0;S('hit');fx.debris(OX+cur.x*CS+9,OY+cur.y*CS+9,'#9a7a4a',8,1.8);if(bone[i]&&!crack[i])g.score+=10;}
  if(!left()){g.score+=100;wait=90;S('win');A.confetti();fx.pop(160,30,'SKELETON COMPLETE!','#ffe27a');}};
 g.draw=()=>{const c=A.c;X.cache('fr_dig',()=>{X.sky(['#7ab8e0','#c8e0f0','#f0e8d0'],46);X.hills(40,10,'#c8a070',0,.02,3);X.vg(0,40,W,H-40,['#c89a62','#a87a48','#7a5432']);
   for(let i=0;i<80;i++){c.fillStyle='rgba(60,30,10,.15)';c.fillRect(hash(i,7)*W,40+hash(i,8)*200,2+hash(i,9)*4,1);}X.rrs(OX-3,OY-3,GW*CS+5,GH*CS+5,2,'#e8e0d0',1.4);for(let i=0;i<=GW;i+=2){X.rr(OX-3+i*CS,OY-8,1.4,6,0,'#e8e0d0');}
   X.rr(4,200,24,14,2,'#d8c098');X.rr(4,198,24,3,1,'#b89a70');X.rr(292,60,22,30,2,'#e8e0d0');for(let i=0;i<4;i++)X.rr(295,64+i*6,16,1,0,'#8a8a90');});
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x,px=OX+x*CS,py=OY+y*CS;X.rr(px,py,CS-1,CS-1,1,'#8a6440');if(bone[i]){const cc=crack[i]?'#a89a80':'#f4ead4';X.rr(px+2,py+5,CS-5,7,3,cc);X.disc(px+3,py+6,3.2,cc);X.disc(px+CS-4,py+11,3.2,cc);if(crack[i])X.stroke([[px+5,py+4],[px+9,py+9],[px+7,py+13]],'#3a2a20',.8);}
   if(dirt[i]){X.rr(px,py,CS-1,CS-1,2,dirt[i]===3?'#6a4a2a':dirt[i]===2?'#a87a4a':'#c8985e');c.fillStyle='rgba(0,0,0,.12)';c.fillRect(px+2+(i*5)%9,py+4+(i*3)%8,3,1.5);c.fillStyle='rgba(255,255,255,.1)';c.fillRect(px,py,CS-1,1);if(dirt[i]===3){X.disc(px+5,py+12,2,'#5a5a5a');X.disc(px+12,py+6,1.6,'#6a6a6a');}}}
  const px=OX+cur.x*CS,py=OY+cur.y*CS;X.rrs(px-1,py-1,CS+1,CS+1,2,A.t%30<20?'#ffe27a':'#fff',1.5);
  hero(Math.min(W-14,px+28),py+30,{s:.8,d:-1,top:'#e8c060',bot:'#6a5a3a',hat:'straw',hatC:'#6a4a2a',style:2,hair:'#c86a2a',seed:9,bob:0,arm:-1+Math.sin(A.t*.3)*.3,hold:c=>{X.rr(-1,0,2,6,.5,'#7a5430');X.rr(-2.5,6,5,3,1,'#e8d8a0');}});
  fx.draw();X.bar('DIG '+lvl,String(g.score),left()+' BONES LEFT','#ffd87a','#ffe27a');for(let i=0;i<6;i++)X.disc(120+i*8,30,2.4,i<cracks?'#ff5a4a':'rgba(255,255,255,.25)');T('CRACKS',112,27,'#fff0d0',1,'r');};
 return g;}});

/* ================= STORM CHASER ================= */
A.add({id:'stormchaser',name:'STORM CHASER',cat:'ACTION',tags:'tornado truck photo plains',how:'LEFT/RIGHT DRIVE. STAY IN THE GREEN ZONE AND PRESS A TO SNAP. TOO CLOSE = DEBRIS.',make(){
 const g={over:null,score:0},fx=X.fx(),RY=196;let tx=0,tor=220,tv=0,t=0,lives=3,inv=0,flash=0,deb=[],cd=0,shots=0,wob=0,cam=0;
 g.update=()=>{t++;if(inv)inv--;if(flash)flash--;if(cd)cd--;const k=A.in(0);tx+=ax(k)*1.9+1.2;tv+=(rnd(.4)-.2);tv=cl(tv*.98,-1,1);tor+=1.2+tv*.9;wob+=.05;cam=tx-100;
  const d=tor-tx,good=d>50&&d<110;if(A.hit(0).a&&!cd){cd=30;flash=8;S('blip');if(good){const v=Math.round(40-Math.abs(d-80)*.6);g.score+=v;shots++;fx.pop(160,60,'GREAT SHOT +'+v,'#7dff9a');S('coin');}else fx.pop(160,60,d>=110?'TOO FAR':'TOO CLOSE!','#ffb07a');}
  if(t%Math.max(14,40-t/100|0)===0&&d<120)deb.push({x:tor+rnd(20)-10,y:120+rnd(60),vx:-2-rnd(2),vy:-1-rnd(2),r:rnd(6),k:ri(3)});
  for(const b of deb){b.vy+=.08;b.x+=b.vx;b.y+=b.vy;b.r+=.2;if(!inv&&b.y>RY-24&&b.y<RY&&Math.abs(b.x-tx)<14){b.dead=1;lives--;inv=90;S('hit');A.shake=6;fx.pop(160,100,'DENTED!','#ff6a5a');if(lives<=0)g.over='TOTALLED';}}deb=deb.filter(b=>!b.dead&&b.y<H);
  if(d<20&&!inv){lives--;inv=120;tx-=40;S('lose');fx.pop(160,100,'SUCKED IN!','#ff6a5a');if(lives<=0)g.over='GONE WITH THE WIND';}if(d>200){tx+=1;}};
 g.draw=()=>{const c=A.c;X.cache('fr_storm',()=>{X.sky(['#2a2a38','#4a4a58','#6a6a6a','#8a8a72'],RY);for(let i=0;i<12;i++)cloud(i*30,30+(i%3)*12,1.6,i%2?'#3a3a48':'#44445a');X.vg(0,0,W,70,['rgba(20,20,30,.6)','rgba(20,20,30,0)']);X.vg(0,RY-30,W,30,['rgba(200,190,140,0)','rgba(200,190,140,.25)']);});
  const o1=cam*.3;for(let k=Math.floor(o1/80)-1;k<Math.floor(o1/80)+6;k++){const x=k*80-o1,h=hash(k,2);if(h<.4)continue;X.rr(x,RY-28,2,28,0,'#3a3a3a');X.stroke([[x-8,RY-26],[x+8,RY-26]],'#3a3a3a',1);if(h>.8){X.rr(x+14,RY-22,18,22,1,'#8a3a2a');X.poly([[x+12,RY-22],[x+23,RY-32],[x+34,RY-22]],'#5a2a20');}}
  X.vg(0,RY-6,W,H-RY+6,['#8a8a52','#6a6a3a','#4a4a2a']);for(let i=0;i<50;i++){const x=((i*37-cam*1.0)%W+W)%W;X.stroke([[x,RY-4],[x-2-Math.sin(A.t*.1+i)*2,RY-10]],'#a0a060',1);}c.fillStyle='#3a3a40';c.fillRect(0,RY+8,W,12);c.fillStyle='#e8d870';for(let i=0;i<10;i++)c.fillRect(((i*40-cam*1.4)%W+W)%W,RY+13,16,1.5);
  const sx=tor-cam;c.save();for(let i=0;i<26;i++){const yy=10+i*7,w=6+i*i*.09,ox=Math.sin(A.t*.15+i*.4)*(4+i*.3);c.globalAlpha=.55;X.ell(sx+ox,RY-4-(25-i)*7,w,4,i%2?'#6a6a6a':'#5a5a5a');}c.globalAlpha=1;c.restore();if(lo()){c.globalAlpha=.3;X.ell(sx,RY-2,40,8,'#8a7a5a');c.globalAlpha=1;}
  const z0=tx+50-cam,z1=tx+110-cam;c.fillStyle='rgba(120,255,140,.12)';c.fillRect(z0,RY-6,z1-z0,4);c.fillStyle='rgba(120,255,140,.6)';c.fillRect(z0,RY-6,1,4);c.fillRect(z1,RY-6,1,4);
  for(const b of deb){const x=b.x-cam;c.save();c.translate(x,b.y);c.rotate(b.r);if(b.k===0)X.rr(-4,-1.5,8,3,0,'#7a5430');else if(b.k===1)X.rr(-3,-3,6,6,0,'#8a3a2a');else X.disc(0,0,2.5,'#4a6a3a');c.restore();}
  const vx=tx-cam;if(!(inv&&A.t%6<3)){c.save();c.translate(vx,RY+6);X.shadow(0,2,22,3,.4);X.rr(-20,-14,40,12,3,X.lg(0,-14,0,-2,['#f0f0f4','#c84a3a','#8a2a24']));X.rr(-12,-22,20,9,3,X.lg(0,-22,0,-13,['#e8e8ec','#a8a8b0']));X.rr(-10,-20,8,6,1,'#5a8ab8');X.rr(0,-20,6,6,1,'#5a8ab8');X.rr(-16,-26,28,3,1,'#3a3a40');X.disc(-6,-26,2,A.t%20<10?'#ff4040':'#4040ff');X.disc(6,-26,2,A.t%20>=10?'#ff4040':'#4040ff');for(const w of[-12,12]){X.disc(w,-1,5,'#1a1a1e');X.disc(w,-1,2,'#9a9aa0');}
   hero(-5,-12,{s:.55,d:1,top:'#f0b030',bot:'#2a2a3a',hat:'cap',hatC:'#2a6ac8',style:0,seed:11,bob:0,arm:-1.6,hold:c=>X.rr(-2,-1,4,3,.5,'#2a2a2a')});c.restore();}
  if(flash){c.fillStyle='rgba(255,255,255,'+(flash/10)+')';c.fillRect(0,0,W,H);}
  fx.draw();X.bar('PHOTOS '+shots,String(g.score),'','#7dff9a','#ffe27a');for(let i=0;i<3;i++)X.heart(140+i*12,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');};
 return g;}});

/* ================= YETI ESCAPE ================= */
A.add({id:'yetiescape',name:'YETI ESCAPE',cat:'CLASSICS',tags:'sled snow downhill yeti',how:'LEFT/RIGHT STEER THE SLED. PASS FLAGS, MISS TREES. EVERY CRASH LETS THE YETI CLOSER.',make(){
 const g={over:null,score:0},fx=X.fx();let x=160,vx=0,ob=[],t=0,yeti=-60,spd=2,trail=[],flk=[];for(let i=0;i<50;i++)flk.push({x:rnd(W),y:rnd(H),s:.5+rnd(1.2)});
 g.update=()=>{t++;spd=Math.min(4.4,2+t/1400);const k=A.in(0);vx=(vx+ax(k)*.3)*.9;x=cl(x+vx,12,W-12);
  if(t%Math.max(10,24-t/300|0)===0){const r=Math.random();ob.push(r<.18?{k:'f',x:30+rnd(W-90),y:H+20}:{k:r<.75?'t':'r',x:rnd(W),y:H+20,s:.8+rnd(.5)});}
  for(const o of ob){o.y-=spd;if(o.hit)continue;if(o.k==='f'){if(o.y<150&&o.y>140&&!o.pass){o.pass=1;if(x>o.x&&x<o.x+50){g.score+=25;S('coin');fx.pop(x,120,'+25','#7dff9a');}}}
   else if(Math.abs(o.x-x)<(o.k==='t'?9:8)*(o.s||1)&&Math.abs(o.y-148)<8){o.hit=1;S('hit');A.shake=5;yeti+=34;spd=1;vx=-vx;fx.debris(x,148,'#ffffff',12,2);fx.pop(x,130,'CRASH!','#ff8a7a');}}
  ob=ob.filter(o=>o.y>-30);yeti=Math.max(-60,yeti-.04);g.score+=t%20===0?1:0;if(yeti>120){g.over='CAUGHT BY THE YETI';S('lose');}
  trail.unshift(x);if(trail.length>40)trail.pop();for(const f of flk){f.y-=spd*.3*f.s-1;f.x+=Math.sin(t*.02+f.s)*.4;if(f.y>H)f.y=0;if(f.y<0)f.y=H;}};
 g.draw=()=>{const c=A.c;X.vg(0,0,W,H,['#eaf2fa','#dce8f4','#cad8ea']);const o=(t*spd)%40;c.fillStyle='rgba(150,180,210,.18)';for(let i=-1;i<8;i++)for(let k=0;k<5;k++)c.fillRect((k*71+i*23)%W,i*40-o+20,18,1.2);
  c.strokeStyle='rgba(140,170,210,.45)';c.lineWidth=1;for(const off of[-4,4]){c.beginPath();trail.forEach((tx,i)=>{const y=148-i*spd;i?c.lineTo(tx+off,y):c.moveTo(tx+off,y);});c.stroke();}
  for(const o of ob){if(o.k==='f'){for(const fx2 of[o.x,o.x+50]){X.rr(fx2,o.y-14,1.4,14,0,'#3a3a3a');X.poly([[fx2+1,o.y-14],[fx2+9,o.y-11],[fx2+1,o.y-8]],o.pass?'#7dff9a':'#ff4a4a');}}else if(o.k==='t'){c.save();c.translate(o.x,o.y);c.scale(o.s,o.s);X.shadow(4,2,10,3,.25);pine(0,4,30,'#2a5a4a');for(const[a,b]of[[-6,-6],[0,-14],[5,-8]])X.ell(a,b,4,1.5,'#ffffff');c.restore();}else{X.shadow(o.x+2,o.y+3,8*o.s,2.5,.25);X.disc(o.x,o.y,6*o.s,X.rg(o.x-2,o.y-2,1,o.x,o.y,6*o.s,['#9aa0aa','#6a7080','#4a5060']));X.ell(o.x,o.y-4*o.s,5*o.s,2,'#ffffff');}}
  c.save();c.translate(x,148);c.rotate(vx*.08);X.shadow(0,6,12,3,.3);X.rr(-9,-2,18,9,3,X.lg(0,-2,0,7,['#e85a3a','#a83a24']));X.stroke([[-10,7],[12,7],[14,4]],'#7a5430',1.4);hero(0,0,{s:.85,top:'#3a8ad8',bot:'#2a2a4a',hat:'beanie',hatC:'#ff6a3a',style:4,hair:'#c86a2a',seed:12,bob:0,arm:-.4,mood:yeti>60?'o':'happy'});c.restore();
  // the yeti: a big white shaggy beast closing in from the top
  const yy=yeti;if(yy>-50){c.save();c.translate(x*.6+64+Math.sin(t*.1)*10,yy);const sw=Math.sin(t*.3)*.3;for(const s of[-1,1]){c.save();c.translate(s*14,-6);c.rotate(s*(.4+sw));ink(c=>c.ellipse(0,10,6,14,0,0,TAU),'#e8eef8');ink(c=>c.ellipse(0,24,5,4,0,0,TAU),'#6a7a9a');c.restore();}
   ink(c=>c.ellipse(0,0,18,22,0,0,TAU),X.rg(-5,-8,2,0,0,24,['#ffffff','#dce6f4','#aab8d0']));for(let i=0;i<8;i++)X.stroke([[-14+i*4,14],[-15+i*4,20]],'#c8d4e8',1.2);ink(c=>c.ellipse(0,-6,10,8,0,0,TAU),'#8a9ab8');X.disc(-4,-8,2.2,'#fff');X.disc(4,-8,2.2,'#fff');X.disc(-4,-7.6,1.1,'#1a1020');X.disc(4,-7.6,1.1,'#1a1020');ink(c=>{c.moveTo(-5,-2);c.lineTo(5,-2);c.lineTo(4,1);c.lineTo(-4,1);c.closePath();},'#3a2a3a',.6);X.poly([[-3,-2],[-2,0],[-1,-2]],'#fff');X.poly([[1,-2],[2,0],[3,-2]],'#fff');c.restore();}
  if(lo())for(const f of flk){c.globalAlpha=.8;X.disc(f.x,f.y,f.s,'#ffffff');}c.globalAlpha=1;
  fx.draw();X.bar('YETI '+Math.max(0,Math.round((yeti+60)/1.8))+'%',String(g.score),'','#8ab8ff','#ffe27a');};
 return g;}});

/* ================= WIZARD DUEL ================= */
A.add({id:'wizardduel',name:'WIZARD DUEL',cat:'VERSUS',vs:1,tags:'magic duel elements spells',how:'UP/DOWN PICK FIRE, WATER OR LEAF. A CASTS, B SHIELDS. FIRE>LEAF>WATER>FIRE. 3 HEARTS.',make(){
 const g={over:null,score:0},fx=X.fx(),EL=[{n:'FIRE',c:'#ff6a2a'},{n:'WATER',c:'#3aa8ff'},{n:'LEAF',c:'#5ad84a'}],beats=(a,b)=>(a===0&&b===2)||(a===2&&b===1)||(a===1&&b===0);
 const P=[{x:46,el:0,cd:0,sh:0,shc:0,hp:3,hurt:0},{x:274,el:1,cd:0,sh:0,shc:0,hp:3,hurt:0}];let orbs=[],t=0,think=0;
 g.timeUp=()=>tu(P[0].hp,P[1].hp);
 g.update=()=>{t++;if(A.cpu){const me=P[1],inc=orbs.find(o=>o.o===0&&o.x>200);const o={};if(inc){const want=[1,2,0][inc.el];if(me.el!==want&&Math.random()<.2+A.ai*.3)o[(want-me.el+3)%3===1?'d':'u']=1;else if(me.cd===0&&Math.random()<.5)o.a=1;else if(!me.shc&&inc.x>240&&Math.random()<.06*A.ai)o.b=1;}else if(me.cd===0&&Math.random()<.04+.04*A.ai){if(Math.random()<.4)o.u=1;else o.a=1;}A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i],h=A.hit(i);if(p.cd)p.cd--;if(p.sh)p.sh--;if(p.shc)p.shc--;if(p.hurt)p.hurt--;if(h.u)p.el=(p.el+2)%3;if(h.d)p.el=(p.el+1)%3;
   if(h.a&&!p.cd){p.cd=40;orbs.push({x:p.x+(i?-14:14),y:118,v:i?-2.4:2.4,el:p.el,o:i,ph:0});S('shoot');}if(h.b&&!p.shc){p.sh=40;p.shc=150;S('power');}}
  for(const a of orbs){a.x+=a.v;a.ph+=.2;for(const b of orbs)if(a!==b&&a.o!==b.o&&!a.dead&&!b.dead&&Math.abs(a.x-b.x)<10){if(beats(a.el,b.el))b.dead=1;else if(beats(b.el,a.el))a.dead=1;else{a.dead=b.dead=1;}fx.spark((a.x+b.x)/2,118,'#ffffff',12,2.2);S('hit');}
   const tg=P[1-a.o];if(!a.dead&&Math.abs(a.x-tg.x)<12){a.dead=1;if(tg.sh){fx.ring(tg.x,118,'#c8e8ff',30,14);S('blip');}else{tg.hp--;tg.hurt=30;A.shake=6;S('boom');fx.spark(tg.x,112,EL[a.el].c,18,2.6);fx.pop(tg.x,80,'-1',EL[a.el].c);if(tg.hp<=0){g.over=A.win(a.o);return;}}}}
  orbs=orbs.filter(o=>!o.dead&&o.x>-20&&o.x<W+20);g.score=P[0].hp*100-P[1].hp*100+300;};
 g.draw=()=>{const c=A.c;X.cache('fr_wiz',()=>{X.sky(['#140a30','#2a1458','#5a2a7a','#a04a7a'],180);X.stars(70,33,0,0,130,.8);X.glow(160,60,90,'#c88aff',.3);X.disc(160,60,20,X.rg(154,54,2,160,60,20,['#fff0ff','#e0b8ff','#9a6ad8']));
   for(const[x,s]of[[46,1],[274,-1]]){X.poly([[x-24,240],[x-18,140],[x+18,140],[x+24,240]],X.lg(x-24,0,x+24,0,['#6a6278','#4a4458','#2a2636']));for(let i=0;i<6;i++)for(let k=0;k<3;k++)X.rr(x-18+k*12+(i%2)*6,148+i*15,10,1,0,'rgba(0,0,0,.25)');X.rr(x-24,132,48,10,1,'#5a5468');for(let k=0;k<5;k++)X.rr(x-24+k*10,126,7,7,1,'#5a5468');X.rr(x-5,170,10,14,5,'#ffcf6a');}
   X.hills(220,20,'#1a1030',0,.03,5);X.vg(0,226,W,14,['#100822','#0a0414']);});
  for(let i=0;i<2;i++){const p=P[i],e=EL[p.el];if(lo())X.glow(p.x,108,26,e.c,.25);if(p.sh){c.strokeStyle=X.rgba('#c8e8ff',.4+.3*Math.sin(A.t*.5));c.lineWidth=2;c.beginPath();c.arc(p.x,112,20,0,TAU);c.stroke();}
   if(!(p.hurt&&A.t%6<3))hero(p.x,132,{s:1.2,d:i?-1:1,top:i?'#3a6ad8':'#c83a5a',bot:'#2a1a3a',cape:i?'#2a3a8a':'#7a1a3a',hat:'wizard',hatC:i?'#3a4ad8':'#9a2a4a',style:i?2:4,hair:i?'#e8e0d0':'#c86a2a',seed:i*7,bob:Math.sin(A.t*.1+i)*1,arm:p.cd>30?-2:-1,mood:p.hurt?'o':'happy',hold:c=>{X.stroke([[0,0],[2,-14]],'#7a5430',1.4);X.disc(2,-15,2.4,e.c);if(lo())X.glow(2,-15,6,e.c,.6);}});
   for(let k=0;k<3;k++)X.heart(p.x-12+k*12,184-30*0+20,1,k<p.hp?'#ff4f6d':'rgba(255,255,255,.2)');T(e.n,p.x,212,e.c,1,'c');X.meter(p.x-16,220,32,3,1-p.shc/150,'#c8e8ff');}
  for(const o of orbs){const e=EL[o.el];if(lo())X.glow(o.x,o.y,14,e.c,.55);if(o.el===0){X.disc(o.x,o.y,5,'#ffb03a');X.disc(o.x-Math.sign(o.v)*2,o.y,3,'#fff0a0');for(let k=1;k<4;k++){c.globalAlpha=.5-k*.12;X.disc(o.x-o.v*k*2,o.y+Math.sin(o.ph+k)*2,4-k,'#ff6a2a');}c.globalAlpha=1;}
   else if(o.el===1){ink(c=>c.arc(o.x,o.y,5,0,TAU),X.rg(o.x-2,o.y-2,.5,o.x,o.y,5,['#e0f4ff','#3aa8ff','#1a5aa8']),.6);X.disc(o.x-1.5,o.y-1.5,1.2,'#fff');}else{c.save();c.translate(o.x,o.y);c.rotate(o.ph);ink(c=>c.ellipse(0,0,6,3,0,0,TAU),'#5ad84a',.6);X.stroke([[-5,0],[5,0]],'#2a7a2a',.6);c.restore();}}
  fx.draw();X.bar();A.hud2(P[0].hp,P[1].hp);};
 return g;}});

/* ================= TREASURE DIVE ================= */
A.add({id:'treasuredive',name:'TREASURE DIVE',cat:'ACTION',tags:'diver ocean treasure oxygen',how:'SWIM ANY WAY. GRAB GOLD, THEN SURFACE AT THE BOAT TO BANK IT AND REFILL AIR.',make(){
 const g={over:null,score:0},fx=X.fx(),SURF=46;let p={x:160,y:60,d:1,st:0},air=1,bag=0,gold=[],jel=[],t=0,stings=0,inv=0,bub=[];
 const add=()=>gold.push({x:16+rnd(W-32),y:120+rnd(100),k:Math.random()<.15?1:0});for(let i=0;i<6;i++)add();for(let i=0;i<3;i++)jel.push({x:rnd(W),y:100+rnd(110),ph:rnd(6),v:.3+rnd(.3)});
 g.update=()=>{t++;if(inv)inv--;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx)p.d=dx;p.x=cl(p.x+dx*1.5,10,W-10);p.y=cl(p.y+dy*1.4+.15,SURF,H-14);if(dx||dy)p.st+=.2;
  if(p.y<=SURF+2){if(bag){g.score+=bag;fx.pop(p.x,SURF-10,'BANKED +'+bag,'#ffe27a');S('coin');bag=0;}air=Math.min(1,air+.02);}else air-=.0012+(t/300000);
  if(air<=0){g.over='OUT OF AIR';S('lose');return;}
  for(const o of gold)if(hyp(o.x-p.x,o.y-p.y)<10){o.done=1;const v=o.k?50:10;bag+=v;S('blip');fx.spark(o.x,o.y,'#ffe27a',8,1.6);fx.pop(o.x,o.y-10,'+'+v,'#ffe27a');}gold=gold.filter(o=>!o.done);while(gold.length<6)add();
  for(const j of jel){j.ph+=.05;j.y+=Math.sin(j.ph)*.4-.05;j.x+=Math.sin(j.ph*.5)*j.v;if(j.y<SURF+30)j.y=SURF+30;if(!inv&&hyp(j.x-p.x,j.y-p.y)<10){stings++;inv=90;bag=Math.floor(bag/2);S('hit');A.shake=4;fx.pop(p.x,p.y-16,'STUNG!','#ff8ad8');if(stings>=3)g.over='TOO MANY STINGS';}}
  if(jel.length<3+t/1200&&t%300===0)jel.push({x:rnd(W),y:H-10,ph:0,v:.3+rnd(.4)});if(t%10===0&&p.y>SURF+4)bub.push({x:p.x+p.d*5,y:p.y-24,l:60});bub.forEach(b=>{b.y-=.7;b.x+=Math.sin(b.l*.3)*.3;b.l--;});bub=bub.filter(b=>b.l>0&&b.y>SURF);};
 g.draw=()=>{const c=A.c;X.cache('fr_sea',()=>{X.sky(['#8ad0f0','#c8e8f8'],SURF);X.vg(0,SURF,W,H-SURF,['#2a9ac8','#1a6a9a','#0e3a62','#0a2242']);for(let i=0;i<5;i++){c.save();c.globalCompositeOperation='lighter';X.poly([[40+i*60,SURF],[60+i*60,SURF],[30+i*60,H],[0+i*60,H]],'rgba(200,240,255,.05)');c.restore();}
   X.vg(0,214,W,26,['#c8b080','#a08a5a']);for(let i=0;i<12;i++){const x=i*28+6,h=14+(i*7)%18;for(let k=0;k<3;k++)X.stroke([[x+k*3,226],[x+k*3+Math.sin(i+k)*4,226-h]],k%2?'#3a8a4a':'#2a6a3a',2);}
   for(const[x,col]of[[50,'#ff6a8a'],[140,'#ffb04a'],[250,'#c86aff']]){for(let k=0;k<5;k++)X.disc(x+(k-2)*5,222-Math.abs(k-2)*4,3.4,col);}
   X.rr(240,198,40,18,3,'#6a4424');X.rr(240,192,40,8,4,'#8a5a30');X.rr(256,196,8,6,1,'#ffd040');for(let i=0;i<3;i++)X.disc(246+i*12,198,1.4,'#ffe27a');});
  const wv=A.t*.05;c.fillStyle='rgba(255,255,255,.6)';for(let x=0;x<W;x+=6)c.fillRect(x,SURF-1+Math.sin(wv+x*.08)*1.5,4,1.4);
  c.save();c.translate(70,SURF-2+Math.sin(wv)*1.5);X.poly([[-26,0],[26,0],[20,10],[-20,10]],X.lg(0,0,0,10,['#c84a3a','#8a2a24']));X.rr(-24,-1,48,2,0,'#f4ead4');X.rr(-1,-30,2,30,0,'#7a5430');X.poly([[1,-28],[18,-6],[1,-6]],'#f4f0e8');hero(-12,0,{s:.75,top:'#f4f4f4',bot:'#2a3a5a',hat:'cap',hatC:'#2a3a6a',style:0,hair:'#8a8a8a',seed:13,bob:0,mood:'happy'});c.restore();
  for(const o of gold){if(lo())X.glow(o.x,o.y,10,'#ffe27a',.3);if(o.k){X.rr(o.x-6,o.y-4,12,8,2,'#7a4a24');X.rr(o.x-6,o.y-6,12,4,2,'#9a6a34');X.rr(o.x-1,o.y-3,2,3,.5,'#ffd040');}else{X.disc(o.x,o.y,3.6,X.rg(o.x-1,o.y-1,.3,o.x,o.y,3.6,['#fff8c0','#ffd040','#b88a1a']));X.disc(o.x,o.y,1.6,'rgba(160,110,20,.5)');}}
  for(const j of jel){const pu=Math.sin(j.ph*3)*.15+1;if(lo())X.glow(j.x,j.y,14,'#ff8ad8',.3);ink(c=>{c.ellipse(j.x,j.y,7*pu,6/pu,0,Math.PI,0);c.closePath();},X.rg(j.x-2,j.y-4,1,j.x,j.y,8,['#ffe0f4','#ff8ad8','#c84aa8']),.6);for(let k=0;k<4;k++)X.stroke([[j.x-5+k*3.3,j.y],[j.x-5+k*3.3+Math.sin(j.ph*2+k)*2,j.y+8+k%2*2]],'rgba(255,170,230,.7)',.8);}
  for(const b of bub){c.strokeStyle='rgba(220,250,255,.6)';c.lineWidth=.6;c.beginPath();c.arc(b.x,b.y,1.6,0,TAU);c.stroke();}
  if(!(inv&&A.t%6<3)){c.save();c.translate(p.x,p.y);c.rotate(p.y>SURF+4?p.d*1.2:0);hero(0,12,{d:p.d,st:p.st,top:'#2a2a3a',bot:'#2a2a3a',shoe:'#ffb030',hat:'cap',hatC:'#ffb030',style:0,seed:14,bob:0});X.rr(-6*p.d-3,-10,4,10,2,'#c8c8d0');if(p.y>SURF+4){c.fillStyle='rgba(180,230,255,.5)';c.beginPath();c.arc(2*p.d,-12,4,0,TAU);c.fill();}c.restore();}
  if(c.createRadialGradient&&p.y>120){const gr=c.createRadialGradient(p.x,p.y,40,p.x,p.y,220);if(gr&&gr.addColorStop){gr.addColorStop(0,'rgba(0,10,30,0)');gr.addColorStop(1,'rgba(0,10,30,'+cl((p.y-120)/200,0,.45)+')');c.fillStyle=gr;c.fillRect(0,SURF,W,H-SURF);}}
  fx.draw();X.bar('BAG '+bag,String(g.score),'AIR','#ffe27a','#ffe27a');X.meter(120,12,80,3,air,air<.25?'#ff5a4a':'#7ae8ff');for(let i=0;i<3;i++)X.disc(220+i*8,9,2.4,i<stings?'#ff8ad8':'rgba(255,255,255,.25)');};
 return g;}});

/* ================= FIREWORK SHOW ================= */
A.add({id:'fireworks',name:'FIREWORK SHOW',cat:'PARTY',tags:'fireworks timing river city',how:'LEFT/RIGHT PICK A LAUNCHER. A BURSTS THE ROCKET INSIDE THE RING. 5 DUDS AND IT ENDS.',make(){
 const g={over:null,score:0},fx=X.fx(),LX=[80,160,240];let sel=1,rk=[],bursts=[],t=0,duds=0,combo=0,ring={x:160,y:70,r:16};
 g.update=()=>{t++;const h=A.hit(0);if(h.l)sel=(sel+2)%3;if(h.r)sel=(sel+1)%3;if(t%Math.max(40,90-t/80|0)===0){const i=ri(3);rk.push({x:LX[i],y:200,vy:-(2.6+rnd(.6)),l:i,c:['#ff4a6a','#ffd04a','#4ad8ff','#a86aff','#7dff6a'][ri(5)],tr:[]});S('blip');}
  if(t%240===0)ring={x:60+rnd(200),y:50+rnd(50),r:14+rnd(8)};
  if(h.a){const r=rk.filter(r=>r.l===sel).sort((a,b)=>a.y-b.y)[0];if(r){r.done=1;const d=hyp(r.x-ring.x,r.y-ring.y);const inR=d<ring.r+6;combo=inR?combo+1:0;const v=inR?20+combo*5:5;g.score+=v;S(inR?'coin':'hit');bursts.push({x:r.x,y:r.y,c:r.c,l:60,big:inR});fx.pop(r.x,r.y-14,inR?'PERFECT +'+v:'+5',inR?'#ffe27a':'#ffffff');}}
  for(const r of rk){r.y+=r.vy;r.vy+=.02;r.tr.unshift([r.x,r.y]);if(r.tr.length>8)r.tr.pop();r.x+=Math.sin(r.y*.1)*.2;if(r.vy>-.2&&!r.done){r.done=1;duds++;combo=0;S('lose');fx.pop(r.x,r.y,'DUD','#8a8a9a');if(duds>=5)g.over='SHOW OVER';}}rk=rk.filter(r=>!r.done);bursts.forEach(b=>b.l--);bursts=bursts.filter(b=>b.l>0);};
 g.draw=()=>{const c=A.c;X.cache('fr_fw',()=>{X.sky(['#060818','#0e1230','#1a1a40','#2a2048'],170);X.stars(60,41,0,0,120,.6);X.skyline(170,'#141428',0,7,true);X.vg(0,170,W,70,['#101830','#0a1022','#060a16']);X.vg(0,206,W,34,['#2a2a30','#1a1a20']);});
  for(const b of bursts){const k=1-b.l/60,n=b.big?28:14,R=(b.big?44:24)*Math.sqrt(k);c.globalAlpha=b.l/60;if(lo())X.glow(b.x,b.y,R+10,b.c,.3);for(let i=0;i<n;i++){const a=i/n*TAU,x=b.x+Math.cos(a)*R,y=b.y+Math.sin(a)*R+k*k*12;X.disc(x,y,b.big?1.8:1.3,b.c);if(b.big&&lo())X.stroke([[b.x+Math.cos(a)*R*.7,b.y+Math.sin(a)*R*.7+k*k*8],[x,y]],X.rgba(b.c,.5),.6);}c.globalAlpha=1;
   if(lo()){c.globalAlpha=b.l/120;X.ell(b.x,210+(170-b.y)*.12,R*.6,3,b.c);c.globalAlpha=1;}}
  c.strokeStyle='rgba(255,230,140,'+(.5+.3*Math.sin(A.t*.15))+')';c.lineWidth=1.4;c.setLineDash&&c.setLineDash([4,3]);c.beginPath();c.arc(ring.x,ring.y,ring.r,0,TAU);c.stroke();c.setLineDash&&c.setLineDash([]);
  for(const r of rk){r.tr.forEach((q,i)=>{c.globalAlpha=.6-i*.07;X.disc(q[0],q[1],1.4-i*.1,'#ffd8a0');});c.globalAlpha=1;X.rr(r.x-1.2,r.y-4,2.4,6,1,r.c);if(lo())X.glow(r.x,r.y+3,6,'#ffd8a0',.5);}
  for(let i=0;i<3;i++){const x=LX[i],s=i===sel;X.rr(x-8,198,16,10,1,s?'#ffe27a':'#5a5a6a');X.rr(x-5,192,10,8,1,'#3a3a48');if(s&&A.t%30<20)X.poly([[x-4,214],[x+4,214],[x,210]],'#ffe27a');}
  for(let i=0;i<14;i++){const x=10+i*23,j=Math.sin(A.t*.1+i)*1;hero(x,240+j,{s:.75,top:['#c84a3a','#3a8ad8','#f0b040','#8a4ad8','#4aa86a'][i%5],bot:'#1a1a2a',style:i%5,hair:['#2a1a10','#c89040','#1a1a1a'][i%3],skin:['#f2c29a','#c68a5e','#8a5a3a'][i%3],seed:i,bob:0,d:1,arm:i%3===0?-2.6:undefined,mood:'o'});}
  fx.draw();X.bar('COMBO '+combo,String(g.score),'DUDS '+duds+'/5','#ffe27a','#ffe27a');};
 return g;}});

/* ================= GNOME GARDEN ================= */
A.add({id:'gnomegarden',name:'GNOME GARDEN',cat:'VERSUS',vs:1,tags:'garden flowers territory gnomes',how:'MOVE YOUR GNOME. A PLANTS YOUR FLOWER ON A TILE. MOST FLOWERS WHEN TIME RUNS OUT WINS.',time:90,make(){
 const g={over:null,score:0},fx=X.fx(),GW=10,GH=7,CS=26,OX=30,OY=42;let b=new Int8Array(GW*GH).fill(-1),grow=new Float32Array(GW*GH),P=[{x:0,y:3,mv:0,d:1},{x:GW-1,y:3,mv:0,d:-1}];
 const cnt=i=>b.reduce((a,v)=>a+(v===i?1:0),0);g.timeUp=()=>tu(cnt(0),cnt(1));
 g.update=()=>{if(A.cpu){const q=P[1];let best=null,bd=99;for(let i=0;i<GW*GH;i++)if(b[i]!==1){const x=i%GW,y=i/GW|0,d=Math.abs(x-q.x)+Math.abs(y-q.y)+(b[i]===0?-.5*A.ai:0)+Math.random()*(1.5-A.ai);if(d<bd){bd=d;best=[x,y];}}const o={};if(best){if(best[0]<q.x)o.l=1;else if(best[0]>q.x)o.r=1;else if(best[1]<q.y)o.u=1;else if(best[1]>q.y)o.d=1;else o.a=Math.random()<.3+A.ai*.5;}A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i],k=A.in(i);if(p.mv)p.mv--;else{const dx=ax(k),dy=dx?0:ay(k);if(dx||dy){const nx=cl(p.x+dx,0,GW-1),ny=cl(p.y+dy,0,GH-1);if(!(P[1-i].x===nx&&P[1-i].y===ny)){p.x=nx;p.y=ny;}p.mv=7;if(dx)p.d=dx;}}
   if(A.hit(i).a){const j=p.y*GW+p.x;if(b[j]!==i){b[j]=i;grow[j]=0;S('blip');fx.spark(OX+p.x*CS+13,OY+p.y*CS+13,i?'#ff6ad8':'#6ad8ff',6,1.4);}}}
  for(let i=0;i<GW*GH;i++)grow[i]=Math.min(1,grow[i]+.05);g.score=cnt(0);};
 g.draw=()=>{const c=A.c;X.cache('fr_gnome',()=>{X.sky(['#8ad0f8','#c8ecff'],50);X.hills(40,10,'#7ac06a',0,.03,4);tree(14,46,14,'#4a9a42');tree(306,46,16,'#3f8a3a');cottage(250,42,26,18,'#f4e8d0','#c84a3a',false);X.vg(0,38,W,H-38,['#6ab84a','#4a9a3a','#3a7a2e']);
   for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const px=OX+x*CS,py=OY+y*CS;X.rr(px+1,py+1,CS-2,CS-2,4,X.lg(0,py,0,py+CS,['#8a6440','#6a4a2e']));c.fillStyle='rgba(0,0,0,.15)';for(let k=0;k<3;k++)c.fillRect(px+4,py+6+k*6,CS-8,1);}
   X.rr(OX-6,OY+GH*CS+2,GW*CS+12,6,2,'#c8a070');for(let i=0;i<=GW*2;i++)X.rr(OX-6+i*13.4,OY-8,3,GH*CS+12,1,'rgba(240,230,210,.0)');});
  for(let i=0;i<GW*GH;i++)if(b[i]>=0){const x=OX+(i%GW)*CS+13,y=OY+((i/GW)|0)*CS+20,s=grow[i],col=b[i]?'#ff6ad8':'#6ad8ff';X.stroke([[x,y],[x,y-12*s]],'#3a8a2a',1.4);X.ell(x+3,y-5*s,3*s,1.4*s,'#4aa83a',-.5);if(s>.5){for(let k=0;k<5;k++){const a=k/5*TAU+A.t*.01;X.disc(x+Math.cos(a)*3.4*s,y-12*s+Math.sin(a)*3.4*s,2.2*s,col);}X.disc(x,y-12*s,1.8*s,'#ffe27a');}}
  for(let i=0;i<2;i++){const p=P[i],x=OX+p.x*CS+13,y=OY+p.y*CS+24;X.rrs(OX+p.x*CS+1,OY+p.y*CS+1,CS-2,CS-2,4,i?'#ff6ad8':'#6ad8ff',1.2);hero(x,y,{s:.9,d:p.d,st:p.mv?A.t*.4:0,top:i?'#c83a8a':'#2a7ac8',bot:'#3a5a2a',hat:'wizard',hatC:i?'#e84a4a':'#e84a4a',style:4,hair:'#f4f4f4',skin:'#f6c8a8',seed:20+i,mood:'happy',hold:c=>{X.rr(-1,-6,2,8,.5,'#7a5430');X.poly([[-3,2],[3,2],[0,6]],'#9aa0aa');}});}
  fx.draw();X.bar();A.hud2(cnt(0),cnt(1));};
 return g;}});

/* ================= LANTERN FLOAT ================= */
A.add({id:'lanternfloat',name:'LANTERN FLOAT',cat:'CLASSICS',tags:'sky lantern wind festival',how:'LEFT/RIGHT DRIFT. A PUFFS HEAT TO RISE. DODGE KITES AND BRANCHES, CATCH SPARKS.',make(){
 const g={over:null,score:0},fx=X.fx();let x=160,y=150,vx=0,vy=0,heat=1,alt=0,ob=[],sp=[],t=0,lives=3,inv=0,wind=0;
 g.update=()=>{t++;if(inv)inv--;wind=Math.sin(t*.006)*.6;const k=A.in(0);vx=(vx+ax(k)*.1+wind*.02)*.96;x=cl(x+vx,14,W-14);if(A.in(0).a&&heat>0){vy-=.09;heat=Math.max(0,heat-.006);}vy=(vy+.035)*.98;y+=vy;if(y<90){alt+=90-y;y=90;}if(y>H-34){y=H-34;vy=0;}alt+=1;g.score=alt/20|0;heat=Math.min(1,heat+.0015);
  if(t%70===0)ob.push(Math.random()<.5?{k:'kite',x:rnd(W),y:-20,ph:rnd(6),c:['#ff4a6a','#4ad8ff','#ffd04a'][ri(3)]}:{k:'br',x:Math.random()<.5?0:W,y:-20,w:60+rnd(60)});if(t%50===0)sp.push({x:20+rnd(W-40),y:-10});
  const scr=Math.max(0,-vy)+.8;for(const o of ob){o.y+=scr;if(o.k==='kite'){o.ph+=.05;o.x+=Math.sin(o.ph)*1.2;}const hit=o.k==='kite'?hyp(o.x-x,o.y-y)<12:(o.x===0?x<o.w:x>W-o.w)&&Math.abs(o.y-y)<8;if(hit&&!inv&&!o.hit){o.hit=1;lives--;inv=90;S('hit');A.shake=5;fx.pop(x,y-30,'SINGED!','#ff8a5a');if(lives<=0)g.over='LANTERN TORN';}}ob=ob.filter(o=>o.y<H+30);
  for(const s of sp){s.y+=scr;if(hyp(s.x-x,s.y-y)<12){s.done=1;heat=Math.min(1,heat+.3);g.score+=0;alt+=60;S('coin');fx.spark(s.x,s.y,'#ffd87a',8,1.6);fx.pop(s.x,s.y-10,'+3','#ffd87a');}}sp=sp.filter(s=>!s.done&&s.y<H+10);};
 g.draw=()=>{const c=A.c,k=cl(alt/6000,0,1);X.vg(0,0,W,H,[A.mix?A.mix('#1a1040','#04040e',k):'#1a1040',A.mix?A.mix('#4a2a5a','#0a0a24',k):'#4a2a5a',A.mix?A.mix('#c86a5a','#1a1a40',k):'#c86a5a']);X.stars(60,51,0,(alt*.05)%240,240,.3+k*.7);
  const hy=200+alt*.2;if(hy<H+60){X.skyline(Math.min(H+60,hy),'#1a1424',0,9,true);for(let i=0;i<20;i++){const lx=(i*53)%W,ly=hy-20-(i*31)%60-((alt*.3+i*40)%400);if(ly>-20&&ly<H){if(lo())X.glow(lx,ly,8,'#ffb050',.4);X.rr(lx-2,ly-3,4,5,1.5,'#ffb050');}}}
  for(let i=0;i<10;i++){const lx=(i*71+40)%W,ly=((i*97-alt*.4)%340+340)%340-50;c.globalAlpha=.5;if(lo())X.glow(lx,ly,6,'#ffb050',.4);X.rr(lx-1.5,ly-2,3,4,1,'#ffb050');}c.globalAlpha=1;
  for(const o of ob){if(o.k==='kite'){c.save();c.translate(o.x,o.y);c.rotate(Math.sin(o.ph)*.3);ink(c=>{c.moveTo(0,-9);c.lineTo(7,0);c.lineTo(0,9);c.lineTo(-7,0);c.closePath();},X.lg(-7,0,7,0,[X.lt(o.c,1.3),o.c]),.6);X.stroke([[0,-9],[0,9]],'rgba(0,0,0,.3)',.6);X.stroke([[0,9],[Math.sin(o.ph)*6,20],[0,30]],'#e8e0d0',.6);c.restore();}else{const x0=o.x===0?0:W-o.w,x1=o.x===0?o.w:W;X.stroke([[o.x===0?0:W,o.y],[o.x===0?o.w:W-o.w,o.y+3]],'#2a1a14',4);for(let k=0;k<5;k++)X.disc(x0+(x1-x0)*(k/5)+6,o.y-2+k%2*4,6,'#1a3a2a');}}
  for(const s of sp){if(lo())X.glow(s.x,s.y,10,'#ffd87a',.5);X.disc(s.x,s.y,2,'#fff4c0');}
  if(!(inv&&A.t%6<3)){if(lo())X.glow(x,y,30+heat*20,'#ffa040',.35);ink(c=>{c.moveTo(x-10,y-16);c.quadraticCurveTo(x-12,y+2,x-7,y+10);c.lineTo(x+7,y+10);c.quadraticCurveTo(x+12,y+2,x+10,y-16);c.quadraticCurveTo(x,y-21,x-10,y-16);},X.lg(x-12,0,x+12,0,['#ffb060','#fff0c0','#ff9040']),.7);for(const k2 of[-5,0,5])X.stroke([[x+k2,y-18],[x+k2*1.1,y+10]],'rgba(200,90,40,.35)',.6);X.disc(x,y+8,2+heat*1.5+Math.sin(A.t*.5)*.6,'#fff8d0');
   ink(c=>c.rect(x-4,y-8,8,6),'#c83a2a',.5);T('WISH',x,y-7,'#ffe27a',1,'c');}
  fx.draw();X.bar('ALT '+(alt/20|0)+'M',String(g.score),'HEAT','#ffd87a','#ffe27a');X.meter(120,12,80,3,heat,'#ffa040');for(let i=0;i<3;i++)X.heart(220+i*12,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');};
 return g;}});

/* ================= LANCE TOURNEY ================= */
A.add({id:'lancetourney',name:'LANCE TOURNEY',cat:'VERSUS',vs:1,tags:'joust knights horses tilt',how:'HOLD UP OR DOWN TO AIM HIGH OR LOW. A BRACES YOUR SHIELD AS YOU PASS. FIRST TO 5.',make(){
 const g={over:null,score:0},fx=X.fx();let P=[{aim:1,brace:0,pts:0,col:'#2a6ac8'},{aim:1,brace:0,pts:0,col:'#c83a3a'}],dist=0,phase=0,res='',rt=0,round=1;
 g.timeUp=()=>tu(P[0].pts,P[1].pts);
 g.update=()=>{if(phase===1){if(--rt<=0){phase=0;dist=0;round++;P.forEach(p=>{p.brace=0;});if(P[0].pts>=5||P[1].pts>=5){g.over=A.win(P[0].pts>=5?0:1);}}return;}
  dist+=1.3;if(A.cpu){const o={};const r=Math.random();if(dist>60&&dist<90)o[r<.33+.1*A.ai?'u':r<.66?'d':'']=1;if(dist>100&&Math.random()<.15+.5*A.ai)o.a=1;A.bot(o);}
  for(let i=0;i<2;i++){const k=A.in(i),p=P[i];p.aim=k.u?0:k.d?2:1;if(A.hit(i).a&&dist>80&&!p.brace)p.brace=dist;}
  if(dist>=120){const sc=[0,0];for(let i=0;i<2;i++){const a=P[i],b=P[1-i];const timing=b.brace?Math.abs(120-b.brace):99;const blocked=timing<12&&a.aim===1;if(a.aim===0&&b.aim!==0)sc[i]+=2;else if(a.aim===2&&b.aim===1)sc[i]+=1;else if(!blocked&&a.aim!==b.aim)sc[i]+=1;if(timing<6)sc[i]+=0;}
   P[0].pts+=sc[0];P[1].pts+=sc[1];res=sc[0]>sc[1]?'BLUE STRIKES':sc[1]>sc[0]?'RED STRIKES':'SHIELDS RING';S(sc[0]||sc[1]?'boom':'hit');A.shake=6;fx.spark(160,120,'#fff',16,2.6);fx.debris(160,120,'#c8a070',12,2.2);phase=1;rt=90;}
  g.score=P[0].pts*100;};
 g.draw=()=>{const c=A.c;X.cache('fr_lance',()=>{X.sky(['#6ab0e8','#a8d4f4','#e8f0f8'],150);cloud(60,40,1.3);cloud(240,30,1.1);X.hills(120,16,'#8ab87a',0,.02,4);
   for(let i=0;i<8;i++){const x=10+i*42;X.rr(x,96,34,24,1,i%2?'#c8a070':'#a87a48');X.poly([[x-2,96],[x+17,80],[x+36,96]],i%2?'#c83a3a':'#2a6ac8');X.rr(x+16,70,1.4,12,0,'#5a3a24');X.poly([[x+17,70],[x+26,73],[x+17,76]],i%2?'#ffd04a':'#ffffff');}
   for(let i=0;i<30;i++)hero(8+i*10.5,128,{s:.5,top:['#c84a3a','#3a8ad8','#f0b040','#8a4ad8','#4aa86a'][i%5],bot:'#2a2a3a',style:i%5,seed:i,bob:0,hat:i%4===0?'straw':null,mood:'o'});
   X.vg(0,128,W,112,['#c8a870','#a88a52','#7a6438']);X.rr(0,166,W,6,1,'#7a5430');for(let i=0;i<W;i+=20)X.rr(i,160,3,18,1,'#5a3a24');});
  const k=Math.min(1,dist/120),xs=[40+k*110,280-k*110];for(let i=0;i<2;i++){const x=phase?xs[i]+(i?-1:1)*(rt<80?(80-rt)*.5:0)*0:xs[i],y=i?150:190,d=i?-1:1,run=phase?0:A.t*.5,p=P[i];c.save();c.translate(x,y);c.scale(d,1);
   X.shadow(0,2,22,4,.35);for(let l=0;l<4;l++){const a=Math.sin(run+l*1.6)*.6;c.save();c.translate(-10+l*6,-14);c.rotate(a);ink(c=>c.rect(-1.5,0,3,13),'#e8e0d8',.6);c.restore();}
   ink(c=>c.ellipse(0,-20,17,9,0,0,TAU),'#f4f0e8');ink(c=>c.rect(-16,-28,32,12),X.lg(0,-28,0,-16,[X.lt(p.col,1.3),p.col]),.6);for(let s=0;s<4;s++)X.rr(-14+s*8,-17,4,4,1,'#ffd04a');
   ink(c=>{c.moveTo(12,-24);c.lineTo(22,-36);c.lineTo(27,-32);c.lineTo(18,-20);c.closePath();},'#f4f0e8');ink(c=>c.ellipse(25,-34,5,3.4,-.6,0,TAU),'#f4f0e8');X.disc(26,-36,1,'#1a1a1a');X.stroke([[20,-38],[14,-30]],'#5a3a24',1.6);
   hero(0,-24,{s:1,top:'#b8c0d0',bot:'#6a6a7a',hat:'helm',hatC:p.col,style:0,seed:30+i,bob:Math.sin(run)*1,arm:-.2,hold:c=>{}});
   const la=[-.35,0,.3][p.aim];c.save();c.translate(4,-36);c.rotate(la);X.poly([[0,-2],[44,-.6],[44,.6],[0,2]],X.lg(0,0,44,0,['#f4f0e8',p.col,'#f4f0e8']));X.poly([[0,-4],[6,-1],[6,1],[0,4]],'#9aa0aa');c.restore();
   ink(c=>c.ellipse(-2,-36,5,7,0,0,TAU),p.brace?'#ffe27a':X.lt(p.col,.8),.7);c.restore();}
  if(phase&&rt>20){X.panel(80,60,160,30,'#ffe27a');X.ot(res,160,70,'#ffe27a',1,'c');}
  for(let i=0;i<2;i++)T(['HIGH','MID','LOW'][P[i].aim],i?W-30:30,212,i?'#ff8a7a':'#8ab8ff',1,'c');T('ROUND '+round,160,24,'#fff0d0',1,'c');fx.draw();X.bar();A.hud2(P[0].pts,P[1].pts);};
 return g;}});

/* ================= ICE FISHING ================= */
A.add({id:'icefishing',name:'ICE FISHING',cat:'SIM',tags:'ice lake fish winter',how:'LEFT/RIGHT PICK A HOLE. A DROPS OR HAULS THE LINE WHEN THE BOBBER DIPS. SKIP THE BOOTS.',make(){
 const g={over:null,score:0},fx=X.fx(),HX=[70,160,250];let sel=1,holes=HX.map(()=>({st:0,t:0,bite:0,f:null,dip:0})),t=0,caught=0,miss=0,snow=[];for(let i=0;i<40;i++)snow.push({x:rnd(W),y:rnd(H)});
 const FISH=[{n:'PERCH',c:'#7ab84a',v:10},{n:'TROUT',c:'#e88a6a',v:20},{n:'PIKE',c:'#5a8a6a',v:35},{n:'GOLDFIN',c:'#ffd04a',v:80},{n:'OLD BOOT',c:'#5a4a3a',v:-15}];
 g.update=()=>{t++;const h=A.hit(0);if(h.l)sel=(sel+2)%3;if(h.r)sel=(sel+1)%3;if(h.l||h.r)S('blip');
  holes.forEach((o,i)=>{if(o.st===1){o.t--;if(o.t<=0&&!o.bite){o.bite=40+ri(20);o.f=Math.random()<.06?3:Math.random()<.15?4:Math.random()<.3?2:Math.random()<.5?1:0;S('hit');}if(o.bite){o.bite--;o.dip=o.bite%10<5?1:0;if(!o.bite){o.st=1;o.t=60+ri(140);miss++;fx.pop(HX[i],150,'GOT AWAY','#8ab8ff');if(miss>=6)g.over='THE FISH WON';}}}if(o.st===2){o.t--;if(o.t<=0)o.st=0;}});
  if(h.a){const o=holes[sel];if(o.st===0){o.st=1;o.t=50+ri(160);o.bite=0;S('blip');}else if(o.st===1){if(o.bite){const F=FISH[o.f];g.score=Math.max(0,g.score+F.v);if(F.v>0)caught++;S(F.v>0?'coin':'lose');fx.pop(HX[sel],120,F.n+(F.v>0?' +'+F.v:' '+F.v),F.v>0?'#ffe27a':'#ff8a7a');fx.spark(HX[sel],160,'#c8f0ff',12,2);o.st=2;o.t=50;o.bite=0;o.last=o.f;}else{o.st=0;fx.pop(HX[sel],150,'TOO EARLY','#8ab8ff');}}}
  for(const s of snow){s.y+=.6;s.x+=Math.sin(t*.02+s.y*.05)*.3;if(s.y>H){s.y=0;s.x=rnd(W);}}};
 g.draw=()=>{const c=A.c;X.cache('fr_ice',()=>{X.sky(['#9ab8d8','#c8d8e8','#e8eef4'],110);X.hills(92,14,'#dce6f0',0,.02,4);for(let i=0;i<14;i++)pine(i*24+(i%2)*8,108,26+(i*7)%14,'#2a4a4a');for(let i=0;i<14;i++)X.ell(i*24+(i%2)*8,96,5,2,'#ffffff');
   X.vg(0,106,W,134,['#d8e8f4','#c0d4e8','#a8c0d8']);for(let i=0;i<30;i++)X.stroke([[hash(i,1)*W,110+hash(i,2)*130],[hash(i,1)*W+20+hash(i,3)*30,112+hash(i,2)*130]],'rgba(255,255,255,.5)',.8);
   X.rr(268,116,40,26,2,'#8a4a2a');X.poly([[264,116],[288,100],[312,116]],'#5a2a1e');X.rr(280,126,8,16,1,'#3a2a20');X.rr(292,122,8,8,1,'#ffd87a');X.rr(296,96,5,10,0,'#4a4a4a');});
  if(lo())for(let i=0;i<3;i++){c.globalAlpha=.3-i*.08;X.disc(298+Math.sin(A.t*.03+i)*3,92-i*8-(A.t*.2%8),3+i*1.5,'#e8e8f0');}c.globalAlpha=1;
  holes.forEach((o,i)=>{const x=HX[i],y=170;X.ell(x,y+4,22,8,'rgba(255,255,255,.6)');X.ell(x,y+2,16,6,X.lg(0,y-4,0,y+8,['#0a2a4a','#1a4a6a']));c.fillStyle='rgba(150,220,255,.25)';c.fillRect(x-10,y,6,1);
   if(o.st===1){const by=y+1+(o.dip?3:0)+Math.sin(A.t*.1+i)*.6;X.stroke([[x,by],[x+14,y-30]],'rgba(255,255,255,.7)',.6);X.disc(x,by,2.6,'#ff3a3a');X.disc(x,by-1.6,1.6,'#ffffff');if(o.bite&&lo())for(let r=1;r<3;r++){c.strokeStyle='rgba(200,240,255,'+(.5-r*.15)+')';c.beginPath();c.ellipse(x,y+2,4+r*4+(o.bite%10),2+r*1.4,0,0,TAU);c.stroke();}}
   if(o.st===2&&o.last!==undefined){const F=FISH[o.last];c.save();c.translate(x+16,y-24-(50-o.t)*.3);c.rotate(Math.sin(A.t*.6)*.4);if(o.last===4){X.rr(-4,-6,7,10,1,F.c);X.rr(-4,2,10,4,1,F.c);}else{X.poly([[-11,0],[-15,-4],[-15,4]],X.lt(F.c,.8));ink(c=>c.ellipse(0,0,10,4,0,0,TAU),X.lg(0,-4,0,4,[X.lt(F.c,1.4),F.c,X.lt(F.c,.6)]),.6);X.disc(6,-1,1,'#1a1a1a');}c.restore();}
   hero(x+18,y-2,{s:1,d:-1,top:['#c83a3a','#3a6ac8','#4aa86a'][i],bot:'#2a2a3a',hat:'beanie',hatC:['#f0f0f0','#ffd04a','#ff6a3a'][i],style:i+1,seed:40+i,bob:0,arm:o.st===2?-2.6:-1.6,mood:o.bite?'o':'happy',hold:c=>X.stroke([[0,0],[-4,-10]],'#3a3a3a',1)});
   if(i===sel){X.rrs(x-26,y-46,52,62,6,A.t%30<20?'#ffe27a':'#ffffff',1.2);}});
  if(lo())for(const s of snow)X.disc(s.x,s.y,1,'#ffffff');
  fx.draw();X.bar('CAUGHT '+caught,String(g.score),'GOT AWAY '+miss+'/6','#c8f0ff','#ffe27a');};
 return g;}});

/* ================= SHEEPDOG ================= */
A.add({id:'sheepdog',name:'SHEEPDOG',cat:'ACTION',tags:'sheep herd dog pen farm',how:'RUN THE DOG. SHEEP FLEE FROM YOU. HERD THEM ALL INTO THE PEN. A BARKS.',make(){
 const g={over:null,score:0},fx=X.fx(),PEN={x:250,y:60,w:56,h:60};let d={x:60,y:180,f:1,st:0},sh=[],t=0,bark=0,lvl=1,wait=0;
 const make=()=>{sh=[];for(let i=0;i<3+lvl*2;i++)sh.push({x:60+rnd(140),y:60+rnd(150),vx:0,vy:0,in:0,seed:i*7});};make();
 const inPen=s=>s.x>PEN.x&&s.x<PEN.x+PEN.w&&s.y>PEN.y&&s.y<PEN.y+PEN.h;
 g.update=()=>{t++;if(bark)bark--;if(wait){if(--wait===0){lvl++;make();}return;}const k=A.in(0),dx=ax(k),dy=ay(k);if(dx)d.f=dx;d.x=cl(d.x+dx*2.1,8,W-8);d.y=cl(d.y+dy*2.1,30,H-8);if(dx||dy)d.st+=.4;if(A.hit(0).a&&!bark){bark=30;S('blip');fx.ring(d.x,d.y-6,'#ffffff',50,14);}
  const R=bark?70:44;for(const s of sh){if(s.in){s.x+=Math.sin(t*.02+s.seed)*.1;continue;}const ex=s.x-d.x,ey=s.y-d.y,dd=hyp(ex,ey)||1;if(dd<R){s.vx+=ex/dd*.25*(bark?2:1);s.vy+=ey/dd*.25*(bark?2:1);}else{s.vx+=(rnd(.2)-.1);s.vy+=(rnd(.2)-.1);}
   for(const o of sh)if(o!==s){const qx=s.x-o.x,qy=s.y-o.y,q=hyp(qx,qy)||1;if(q<10){s.vx+=qx/q*.1;s.vy+=qy/q*.1;}}
   s.vx*=.9;s.vy*=.9;const nx=cl(s.x+s.vx,8,W-8),ny=cl(s.y+s.vy,30,H-8);const crossing=(nx>PEN.x&&nx<PEN.x+PEN.w)&&((s.y<PEN.y&&ny>=PEN.y)||(s.y>PEN.y+PEN.h&&ny<=PEN.y+PEN.h))||((ny>PEN.y&&ny<PEN.y+PEN.h)&&(s.x>PEN.x+PEN.w&&nx<=PEN.x+PEN.w));if(crossing)s.vx=s.vy=0;else{s.x=nx;s.y=ny;}
   if(inPen(s)){s.in=1;g.score+=10;S('coin');fx.pop(s.x,s.y-14,'+10','#7dff9a');}}
  if(sh.every(s=>s.in)){g.score+=50+lvl*10;wait=80;S('win');A.confetti();fx.pop(160,90,'FLOCK PENNED!','#ffe27a');}};
 g.draw=()=>{const c=A.c;X.cache('fr_farm',()=>{X.vg(0,0,W,H,['#8ac85a','#7ab84a','#6aa83e']);X.turf(0,24,W,216,'#7ab84a','#6aa83e',16);for(let i=0;i<60;i++){const x=hash(i,1)*W,y=30+hash(i,2)*210;X.disc(x,y,1.4,['#ffffff','#ffe27a','#ff8ad8'][i%3]);}
   tree(20,60,14,'#3f8a3a');tree(40,226,12,'#4a9a42');cottage(20,120,30,20,'#e8d8b8','#a83a2a',false);X.rr(0,24,W,2,0,'rgba(0,0,0,.15)');
   const P2=PEN;X.rr(P2.x-2,P2.y-2,P2.w+4,P2.h+4,2,'rgba(160,120,70,.25)');for(const[x0,y0,x1,y1]of[[P2.x,P2.y,P2.x+P2.w,P2.y],[P2.x+P2.w,P2.y,P2.x+P2.w,P2.y+P2.h],[P2.x,P2.y+P2.h,P2.x+P2.w,P2.y+P2.h]]){X.stroke([[x0,y0],[x1,y1]],'#8a5a30',2.4);X.stroke([[x0,y0-3],[x1,y1-3]],'#a87040',1.6);for(let k=0;k<=4;k++)X.rr(x0+(x1-x0)*k/4-1.5,y0+(y1-y0)*k/4-6,3,8,1,'#6a4424');}
   X.ot('PEN',P2.x+P2.w/2,P2.y+P2.h/2-3,'rgba(255,255,255,.5)',1,'c');});
  const all=[...sh.map(s=>({y:s.y,f:()=>{const b=Math.abs(Math.sin(A.t*.3+s.seed))*(hyp(s.vx,s.vy)>.3?1.2:0);c.save();c.translate(s.x,s.y-b);X.shadow(0,b,7,2,.3);for(const lx of[-3,3])X.rr(lx-.8,-3,1.6,4,.5,'#2a2a2a');for(const[a,bb]of[[-4,-7],[0,-9],[4,-7],[-2,-5],[2,-5]])X.disc(a,bb,3.6,'#ffffff');ink(c=>c.ellipse(0,-7,6,4.5,0,0,TAU),'rgba(255,255,255,0)',.5);const hd=s.vx>=0?1:-1;ink(c=>c.ellipse(hd*6,-8,2.6,2.2,0,0,TAU),'#3a3a3a',.5);X.disc(hd*6.8,-8.4,.6,'#fff');c.restore();}})),{y:d.y,f:()=>{c.save();c.translate(d.x,d.y);c.scale(d.f,1);X.shadow(0,0,9,2.5,.35);const r=d.st;for(let l=0;l<4;l++){c.save();c.translate(-5+l*3.4,-4);c.rotate(Math.sin(r+l*1.7)*.5);X.rr(-.8,0,1.6,4,.5,'#2a2a2a');c.restore();}ink(c=>c.ellipse(0,-7,7,3.6,0,0,TAU),X.lg(0,-11,0,-3,['#3a3a3a','#1a1a1a']));X.ell(1,-5.6,4,1.6,'#f4f4f4');ink(c=>c.ellipse(7,-10,3.6,3,0,0,TAU),'#2a2a2a',.6);X.ell(9,-9,2,1.4,'#f4f4f4');X.disc(10.4,-9.6,.8,'#1a1a1a');X.disc(7.6,-11,.7,'#fff');X.poly([[5,-12],[6,-15],[7.5,-12]],'#2a2a2a');X.stroke([[-7,-8],[-11,-12+Math.sin(A.t*.6)*2]],'#2a2a2a',1.6);c.restore();if(bark)T('WOOF',cl(d.x+d.f*10,14,W-14),Math.max(20,d.y-30),'#ffffff',1,'c');}}];
  all.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  hero(300,226,{s:.9,d:-1,top:'#5a8ac8',bot:'#4a3a2a',hat:'straw',hatC:'#c83a3a',style:0,hair:'#8a8a8a',seed:50,bob:0,arm:Math.sin(A.t*.1)*.6-1,mood:'happy',hold:c=>X.stroke([[0,0],[0,-16]],'#7a5430',1.2)});
  fx.draw();const pen=sh.filter(s=>s.in).length;X.bar('FIELD '+lvl,String(g.score),pen+'/'+sh.length+' PENNED','#7dff9a','#ffe27a');};
 return g;}});

/* ================= TIDE POOL ================= */
A.add({id:'tidepool',name:'TIDE POOL',cat:'PUZZLE',tags:'beach crabs rock pool tide',how:'MOVE THE NET OVER THE POOLS. A SCOOPS. CATCH THE CREATURE SHOWN BEFORE THE TIDE COMES IN.',make(){
 const g={over:null,score:0},fx=X.fx(),POOLS=[[60,110,30],[150,90,26],[240,120,32],[100,180,28],[200,190,30]];let cur={x:160,y:150},cr=[],want=0,t=0,tide=0,round=1,scoop=0,miss=0;
 const K=[{n:'CRAB',c:'#e85a3a'},{n:'STARFISH',c:'#ffb04a'},{n:'SHRIMP',c:'#ff8aa8'},{n:'URCHIN',c:'#7a4ad8'}];
 const fill=()=>{cr=[];for(let i=0;i<10;i++){const p=POOLS[i%5],a=rnd(6),r=rnd(p[2]-8);cr.push({k:i<3?want:ri(4),pool:i%5,x:p[0]+Math.cos(a)*r,y:p[1]+Math.sin(a)*r*.6,a:rnd(6),hid:0});}};want=ri(4);fill();
 g.update=()=>{t++;if(scoop)scoop--;tide+=.0006+round*.0001;if(tide>=1){g.over='TIDE CAME IN';S('lose');return;}const k=A.in(0);cur.x=cl(cur.x+ax(k)*2,10,W-10);cur.y=cl(cur.y+ay(k)*2,40,H-10);
  for(const c of cr){const p=POOLS[c.pool];c.a+=.03+rnd(.04);const nx=c.x+Math.cos(c.a)*.4,ny=c.y+Math.sin(c.a)*.25;if(hyp(nx-p[0],(ny-p[1])/.6)<p[2]-6){c.x=nx;c.y=ny;}else c.a+=Math.PI;if(hyp(c.x-cur.x,c.y-cur.y)<20&&!scoop)c.a=Math.atan2(c.y-cur.y,c.x-cur.x);}
  if(A.hit(0).a&&!scoop){scoop=20;S('blip');const hit=cr.filter(c=>hyp(c.x-cur.x,c.y-cur.y)<10);if(hit.length){const c=hit[0];c.done=1;if(c.k===want){g.score+=20;S('coin');fx.pop(cur.x,cur.y-16,'+20 '+K[want].n,'#7dff9a');fx.spark(cur.x,cur.y,K[want].c,10,1.6);tide=Math.max(0,tide-.06);}else{g.score=Math.max(0,g.score-5);miss++;fx.pop(cur.x,cur.y-16,'WRONG ONE','#ff8a7a');}}else fx.debris(cur.x,cur.y,'#a8e0f0',6,1.4);}
  cr=cr.filter(c=>!c.done);if(!cr.some(c=>c.k===want)){round++;g.score+=30;want=ri(4);fill();fx.pop(160,60,'NEXT: '+K[want].n,'#ffe27a');S('win');}};
 g.draw=()=>{const c=A.c;X.cache('fr_tide',()=>{X.sky(['#7ac8f0','#b8e4f8'],36);X.vg(0,30,W,H-30,['#e8d8a8','#d8c090','#c8a878']);for(let i=0;i<80;i++){c.fillStyle='rgba(120,90,50,.15)';c.fillRect(hash(i,3)*W,30+hash(i,4)*210,2,1);}
   for(const p of POOLS){X.ell(p[0],p[1]+3,p[2]+8,(p[2]+8)*.62,'#7a7a72');for(let k=0;k<8;k++){const a=k/8*TAU;X.disc(p[0]+Math.cos(a)*(p[2]+5),p[1]+Math.sin(a)*(p[2]+5)*.62,6,X.rg(0,0,0,0,0,1,['#8a8a80']));X.disc(p[0]+Math.cos(a)*(p[2]+5),p[1]+Math.sin(a)*(p[2]+5)*.62-1,5,'#9a9a90');}
    X.ell(p[0],p[1],p[2],p[2]*.6,X.rg(p[0]-p[2]*.3,p[1]-p[2]*.2,2,p[0],p[1],p[2],['#7ae0f0','#3aa8c8','#1a6a8a']));for(let k=0;k<4;k++){X.stroke([[p[0]-p[2]*.5+k*p[2]*.3,p[1]+p[2]*.4],[p[0]-p[2]*.5+k*p[2]*.3+2,p[1]+p[2]*.15]],'#2a8a5a',1.4);}}
   hero(296,90,{s:.9,d:-1,top:'#f0d040',bot:'#3a8ac8',hat:'straw',hatC:'#ff6a8a',style:3,hair:'#2a1a10',skin:'#c68a5e',seed:60,bob:0,mood:'happy'});X.rr(280,96,24,10,2,'#c83a3a');X.rr(282,92,20,6,2,'#e85a4a');});
  const tw=A.t*.05,ty=H-tide*(H-30);X.vg(0,ty-4,W,H-ty+4,['rgba(80,180,220,.0)','rgba(80,180,220,.75)','rgba(40,120,180,.9)']);c.fillStyle='rgba(255,255,255,.7)';for(let x=0;x<W;x+=5)c.fillRect(x,ty+Math.sin(tw+x*.06)*2,4,1.4);
  for(const cc of cr){const K2=K[cc.k];c.save();c.translate(cc.x,cc.y);c.rotate(cc.a*.1);if(cc.k===0){for(const s of[-1,1]){X.stroke([[s*3,0],[s*7,-3],[s*8,-6]],K2.c,1.2);for(let l=0;l<3;l++)X.stroke([[s*2,1+l],[s*6,3+l*1.4]],K2.c,.7);}ink(c=>c.ellipse(0,0,4.5,3,0,0,TAU),K2.c,.6);X.disc(-1.4,-2.6,.8,'#fff');X.disc(1.4,-2.6,.8,'#fff');}
   else if(cc.k===1){const pts=[];for(let i=0;i<10;i++){const a=i/10*TAU-1.57+cc.a*.05,r=i%2?2:5.5;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}X.poly(pts,K2.c);X.disc(0,0,1.2,X.lt(K2.c,1.4));}
   else if(cc.k===2){c.scale(Math.cos(cc.a)>0?1:-1,1);ink(c=>{c.moveTo(-5,0);c.quadraticCurveTo(0,-4,5,-1);c.quadraticCurveTo(1,2,-5,0);},K2.c,.5);X.stroke([[5,-1],[9,-5]],K2.c,.5);X.disc(3,-1.6,.6,'#1a1a1a');}
   else{for(let i=0;i<10;i++){const a=i/10*TAU;X.stroke([[0,0],[Math.cos(a)*5.4,Math.sin(a)*5.4]],K2.c,.7);}X.disc(0,0,3,X.lt(K2.c,.7));}c.restore();}
  c.save();c.translate(cur.x,cur.y);const s=scoop?1+(20-scoop)*.02:1;c.strokeStyle='#f4f4f4';c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,10*s,6*s,0,0,TAU);c.stroke();c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=.5;for(let k=-8;k<=8;k+=3){c.beginPath();c.moveTo(k,-5);c.lineTo(k,5);c.stroke();}X.stroke([[8,4],[22,18]],'#c8a060',2);c.restore();
  X.panel(6,22,92,20,K[want].c);T('CATCH: '+K[want].n,52,29,K[want].c,1,'c');
  fx.draw();X.bar('POOL '+round,String(g.score),'TIDE','#7ae8ff','#ffe27a');X.meter(120,12,80,3,tide,tide>.75?'#ff5a4a':'#7ae8ff');};
 return g;}});

/*NEXT*/
})();
