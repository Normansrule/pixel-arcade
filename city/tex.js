// NEON BAY — procedural canvas textures: asphalt + markings, pavers, wood, concrete, noise, neon/billboard atlas, sprites.
import {THREE,ctex,rng} from './util.js';
const R=rng(77);
function grain(x,w,h,n,a,dark=.5){for(let i=0;i<n;i++){const v=R();x.fillStyle=v<dark?`rgba(0,0,0,${R()*a})`:`rgba(255,255,255,${R()*a*.6})`;x.fillRect(R()*w,R()*h,1+R()*2,1+R()*2);}}
function asphalt(x,w,h){x.fillStyle='#2c2e33';x.fillRect(0,0,w,h);grain(x,w,h,w*h/6,.22);
 for(let i=0;i<14;i++){x.strokeStyle=`rgba(10,10,12,${.25+R()*.3})`;x.lineWidth=.6+R();x.beginPath();let px=R()*w,py=R()*h;x.moveTo(px,py);for(let k=0;k<6;k++){px+=(R()-.5)*30;py+=R()*24;x.lineTo(px,py);}x.stroke();}
 for(let i=0;i<10;i++){x.fillStyle=`rgba(0,0,0,${.08+R()*.1})`;x.beginPath();x.ellipse(R()*w,R()*h,8+R()*20,6+R()*30,R()*3,0,7);x.fill();}}
const paint=(x,c,a=.92)=>{x.fillStyle=c;x.globalAlpha=a;};
// street: 14 m across (256 px), 32 m along (512 px). centre double yellow, white edge lines
export function streetTex(){return ctex(256,512,(x,w,h)=>{asphalt(x,w,h);const m=w/14;paint(x,'#e8c440');x.fillRect(w/2-.32*m,0,.13*m,h);x.fillRect(w/2+.19*m,0,.13*m,h);paint(x,'#e8e8e8',.85);x.fillRect(.45*m,0,.14*m,h);x.fillRect(w-.59*m,0,.14*m,h);x.globalAlpha=1;grain(x,w,h,1600,.25);});}
// freeway: 22 m across, dashed lane dividers at +-5.5 m
export function fwyTex(){return ctex(256,512,(x,w,h)=>{asphalt(x,w,h);const m=w/22;paint(x,'#e8c440');x.fillRect(w/2-.3*m,0,.12*m,h);x.fillRect(w/2+.18*m,0,.12*m,h);paint(x,'#eee',.85);x.fillRect(.5*m,0,.16*m,h);x.fillRect(w-.66*m,0,.16*m,h);
 for(const u of[w/2-5.5*m,w/2+5.5*m])for(let v=0;v<h;v+=h/2)x.fillRect(u-.08*m,v,.16*m,h/4.5);x.globalAlpha=1;grain(x,w,h,1600,.25);});}
// intersection: 14x14 m, zebra crossings on each side
export function interTex(){return ctex(256,256,(x,w,h)=>{asphalt(x,w,h);const m=w/14;paint(x,'#e8e8e8',.8);for(let k=0;k<7;k++){const o=(k*2+.6)*m*.95;x.fillRect(o,.25*m,.9*m,2.1*m);x.fillRect(o,h-2.35*m,.9*m,2.1*m);x.fillRect(.25*m,o,2.1*m,.9*m);x.fillRect(w-2.35*m,o,2.1*m,.9*m);}x.globalAlpha=1;grain(x,w,h,900,.3);});}
// sidewalk pavers (4 m tile)
export function paverTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#8a8680';x.fillRect(0,0,w,h);const n=4;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=150+R()*26|0;x.fillStyle=`rgb(${v},${v-4},${v-12})`;x.fillRect(i*w/n+2,j*h/n+2,w/n-4,h/n-4);}grain(x,w,h,3000,.18);
 for(let i=0;i<5;i++){x.fillStyle=`rgba(60,50,40,${R()*.12})`;x.beginPath();x.arc(R()*w,R()*h,6+R()*14,0,7);x.fill();}});}
export function woodTex(){return ctex(256,256,(x,w,h)=>{for(let i=0;i<8;i++){const v=R();x.fillStyle=`rgb(${150+v*40|0},${105+v*30|0},${70+v*20|0})`;x.fillRect(0,i*h/8,w,h/8-2);x.fillStyle='rgba(40,25,15,.6)';x.fillRect(0,i*h/8+h/8-2,w,2);
  for(let k=0;k<30;k++){x.fillStyle=`rgba(60,40,20,${R()*.25})`;x.fillRect(R()*w,i*h/8+R()*h/8,20+R()*60,1);}const cut=R()*w;x.fillStyle='rgba(30,20,10,.7)';x.fillRect(cut,i*h/8,2,h/8);}});}
export function concreteTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#a9a69f';x.fillRect(0,0,w,h);grain(x,w,h,9000,.16);for(let i=0;i<20;i++){x.fillStyle=`rgba(70,65,60,${R()*.1})`;x.beginPath();x.arc(R()*w,R()*h,4+R()*30,0,7);x.fill();}x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,0,w,2);x.fillRect(0,0,2,h);});}
export function noiseTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<500;i++){const v=R()*255|0;x.fillStyle=`rgba(${v},${v},${v},.08)`;x.beginPath();x.arc(R()*w,R()*h,3+R()*24,0,7);x.fill();}grain(x,w,h,12000,.2);},{srgb:false});}
export function sandTex(){return noiseTex();}
// soft radial sprite (light pools, beams)
export function glowTex(){return ctex(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true,srgb:false});}
export function beamTex(){return ctex(64,128,(x,w,h)=>{const g=x.createLinearGradient(0,h,0,0);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);const s=x.createLinearGradient(0,0,w,0);s.addColorStop(0,'rgba(0,0,0,1)');s.addColorStop(.5,'rgba(0,0,0,0)');s.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=s;x.fillRect(0,0,w,h);},{clamp:true,srgb:false});}
// skid mark strip
export function skidTex(){return ctex(32,64,(x,w,h)=>{x.clearRect(0,0,w,h);for(let i=0;i<w;i++){const a=.5+R()*.5;x.fillStyle=`rgba(255,255,255,${a})`;x.fillRect(i,0,1,h);}},{clamp:true,srgb:false});}

/* ---------- sign atlas: 4 cols x 6 rows of 512x256 cells ---------- */
export const ATLAS={cols:4,rows:6};
const NEON=[['MOTEL','#ff3fa4','#36f0ff'],['BAR','#36f0ff','#ff3fa4'],['TACOS','#ffd23f','#ff5a1f'],['24/7','#7dff6a','#36f0ff'],['DINER','#ff5a5a','#ffe9a0'],['ARCADE','#b06bff','#36f0ff'],['SURF','#36f0ff','#ffd23f'],['HOTEL','#ff8a3d','#ff3fa4']];
const ADS=[['SUNBURST','COLA','#ff5a1f','#ffd23f','#2a0a04'],['PALMS','RESORT & SPA','#1fd1c4','#fff4d6','#06302e'],['MANGO','MOBILE','#ffb31a','#ffffff','#3a1a00'],['BYTE','BURGER','#ff3b5c','#ffe9a0','#2a0610'],['TURBO','TIRES','#e8e8e8','#ff4d00','#101216'],['NIGHT OWL','RADIO 88.1','#b06bff','#36f0ff','#0c0620'],['BAY','BANK','#3d8bff','#ffffff','#061230'],['SURF & SAND','RENTALS','#36f0ff','#ffd23f','#04202a']];
const POI=[['TAXI','#ffd23f','#ff9a1f'],['MOTORS','#36f0ff','#3d8bff'],["SPRAY",'#ff3fa4','#ffd23f'],['POLICE','#3d8bff','#ffffff'],['COURIER','#7dff6a','#ffffff'],['LOOKOUT','#ffe9a0','#ff8a3d'],['NEON BAY','#ff3fa4','#36f0ff'],['OPEN','#ff5a5a','#ffffff']];
export function signAtlas(){const CW=512,CH=256;return ctex(CW*4,CH*6,(x)=>{x.textBaseline='middle';x.textAlign='center';
 const cell=(i,f)=>{const cx=(i%4)*CW,cy=(i/4|0)*CH;x.save();x.beginPath();x.rect(cx,cy,CW,CH);x.clip();x.translate(cx,cy);f();x.restore();};
 const neon=(t,c1,c2,size)=>{x.fillStyle='#0b0b10';x.fillRect(0,0,CW,CH);x.strokeStyle='#1d1d26';x.lineWidth=10;x.strokeRect(5,5,CW-10,CH-10);x.font=`${size}px Anton, Impact, sans-serif`;
  x.shadowColor=c1;x.shadowBlur=28;x.fillStyle=c1;x.fillText(t,CW/2,CH/2+6);x.shadowBlur=8;x.fillStyle='#fff';x.globalAlpha=.75;x.fillText(t,CW/2,CH/2+6);x.globalAlpha=1;x.shadowBlur=18;x.shadowColor=c2;x.strokeStyle=c2;x.lineWidth=6;x.strokeRect(22,22,CW-44,CH-44);x.shadowBlur=0;};
 NEON.forEach(([t,a,b],i)=>cell(i,()=>neon(t,a,b,t.length>5?120:150)));
 ADS.forEach(([t,s,a,b,bg],i)=>cell(8+i,()=>{const g=x.createLinearGradient(0,0,CW,CH);g.addColorStop(0,bg);g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,CW,CH);
  x.fillStyle=a;x.globalAlpha=.25;for(let k=0;k<6;k++){x.beginPath();x.arc(CW*.82,CH*.5,30+k*26,0,7);x.lineWidth=8;x.strokeStyle=a;x.stroke();}x.globalAlpha=1;
  x.textAlign='left';x.font=`${t.length>8?96:120}px Anton, Impact, sans-serif`;x.fillStyle=a;x.fillText(t,28,CH*.4);x.font='bold 38px "JetBrains Mono", monospace';x.fillStyle=b;x.fillText(s,32,CH*.78);x.textAlign='center';
  x.fillStyle=a;x.fillRect(0,CH-14,CW,14);}));
 POI.forEach(([t,a,b],i)=>cell(16+i,()=>neon(t,a,b,t.length>6?100:130)));});}
// small icon sprites for map markers (letters on rounded squares)
export function iconTex(letter,bg,fg='#000'){return ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle=bg;x.beginPath();x.roundRect(8,8,w-16,h-16,26);x.fill();x.fillStyle=fg;x.font='bold 70px "JetBrains Mono", monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(letter,w/2,h/2+4);},{clamp:true});}
export {THREE};
