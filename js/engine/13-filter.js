/* PIXEL ARCADE engine · Screen filters for the arcade cabinets (press V on the pause card or a menu to cycle).
   They repaint the game picture each frame before the clock, cards and toasts go on top, so menus stay sharp.
     CLEAN    no filter
     POCKET   four shades of green with 4x4 ordered (Bayer) dithering, like an old handheld's screen
     8-COLOUR each colour channel dithered to on/off: the eight-colour home-computer look
     PRINT    one-bit Atkinson error diffusion on warm paper, like a photocopied fanzine
     ASCII    the picture rebuilt from text characters, each cell tinted by its average colour, over a faint
              copy of the frame so the scene still reads
   All of them work on a 320x240 (ASCII: 64x40 cells) copy, so the cost is the same at any window size. */
(function(){
'use strict';
const A=window.A,E=A._e;
const MODES=['clean','pocket','eight','print','ascii'],NAMES={clean:'CLEAN',pocket:'POCKET',eight:'8-COLOUR',print:'PRINT',ascii:'ASCII'};
try{const v=localStorage.getItem('pa.filter');A.filter=MODES.includes(v)?v:'clean';}catch(e){A.filter='clean';}
A.filterName=()=>NAMES[A.filter];
A.cycleFilter=()=>{A.filter=MODES[(MODES.indexOf(A.filter)+1)%MODES.length];try{localStorage.setItem('pa.filter',A.filter);}catch(e){}if(A.toast)A.toast('FILTER '+NAMES[A.filter]);};
// 4x4 Bayer threshold matrix, scaled to -0.5..0.5
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16-.5);
const POCKET=[[15,56,15],[48,98,48],[139,172,15],[202,220,159]];
const RAMP=' .,:;-=+*cox%#&@';
let off=null,ox=null,asc=null,ax=null,err=null;
function grab(w,h){if(!off){off=document.createElement('canvas');ox=off.getContext('2d',{willReadFrequently:true});}
 if(off.width!==w||off.height!==h){off.width=w;off.height=h;}ox.imageSmoothingEnabled=true;ox.drawImage(A.c.canvas,0,0,w,h);return ox.getImageData(0,0,w,h);}
function put(img){ox.putImageData(img,0,0);const c=A.c;c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;c.drawImage(off,0,0,c.canvas.width,c.canvas.height);c.restore();}
const lum=(d,i)=>(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255;
function pocket(){const img=grab(320,240),d=img.data;for(let y=0;y<240;y++)for(let x=0;x<320;x++){const i=(y*320+x)*4;
  // a little contrast so dark game backgrounds don't all sink into the darkest shade
  let v=Math.min(1,Math.max(0,(lum(d,i)-.04)*1.25+BAYER[(y&3)*4+(x&3)]*.33));const p=POCKET[Math.min(3,v*4|0)];d[i]=p[0];d[i+1]=p[1];d[i+2]=p[2];}put(img);}
function eight(){const img=grab(320,240),d=img.data;for(let y=0;y<240;y++)for(let x=0;x<320;x++){const i=(y*320+x)*4,t=BAYER[(y&3)*4+(x&3)];
  for(let k=0;k<3;k++)d[i+k]=d[i+k]/255+t>.5?255:0;}put(img);}
function print(){const W=320,H=240,img=grab(W,H),d=img.data;if(!err||err.length!==W*H)err=new Float32Array(W*H);
 for(let i=0;i<W*H;i++)err[i]=Math.pow(lum(d,i*4),.8);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,o=err[i],n=o<.5?0:1,e=(o-n)/8;
  // Atkinson spreads 6/8 of the error to six neighbours (the rest is dropped, which keeps contrast high)
  if(x+1<W)err[i+1]+=e;if(x+2<W)err[i+2]+=e;if(y+1<H){if(x>0)err[i+W-1]+=e;err[i+W]+=e;if(x+1<W)err[i+W+1]+=e;}if(y+2<H)err[i+2*W]+=e;
  const p=i*4;if(n){d[p]=238;d[p+1]=228;d[p+2]=206;}else{d[p]=28;d[p+1]=26;d[p+2]=34;}}put(img);}
function ascii(){const CW=64,CH=40,img=grab(CW,CH),d=img.data,c=A.c,cw=c.canvas.width,ch=c.canvas.height,sx=cw/CW,sy=ch/CH;
 c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=.84;c.fillStyle='#07080c';c.fillRect(0,0,cw,ch);c.globalAlpha=1;c.font='700 '+Math.round(sy*1.05)+'px "JetBrains Mono",ui-monospace,monospace';c.textAlign='center';c.textBaseline='middle';
 for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){const i=(y*CW+x)*4,v=Math.pow(lum(d,i),.55);if(v<.12)continue;
  // brighten the tint so dark cells still read, and pick the glyph by brightness
  const m=255/Math.max(40,d[i],d[i+1],d[i+2]);c.fillStyle='rgb('+Math.min(255,d[i]*m|0)+','+Math.min(255,d[i+1]*m|0)+','+Math.min(255,d[i+2]*m|0)+')';
  c.fillText(RAMP[Math.min(RAMP.length-1,v*RAMP.length|0)],(x+.5)*sx,(y+.5)*sy);}
 c.restore();}
const RUN={pocket,eight,print,ascii};
A.screenFilter=()=>{if(A.filter==='clean'||typeof document==='undefined'||!A.c||!A.c.canvas||!A.c.getImageData)return;try{RUN[A.filter]();}catch(e){}};
})();
