/* PIXEL ARCADE engine · Screen filters for the arcade cabinets (press V on the pause card or a menu to cycle).
   They repaint the game picture each frame before the clock, cards and toasts go on top, so menus stay sharp.
     CLEAN    no filter
     POCKET   four shades of green with 4x4 ordered (Bayer) dithering, like an old handheld's screen
     8-COLOUR each colour channel dithered to on/off: the eight-colour home-computer look
     PRINT    one-bit Atkinson error diffusion on warm paper, like a photocopied fanzine
     ASCII    the picture rebuilt from text characters, each cell tinted by its average colour, over a faint
              copy of the frame so the scene still reads
     ARCADE   a tube monitor: phosphor halation around bright things, a faint red/blue convergence fringe, a barrel-
              curved picture, one dark scanline per game row, an aperture grille, a vignette, rounded tube corners and
              a reflection across the glass
   The first four work on a 320x240 (ASCII: 64x40 cells) copy, so the cost is the same at any window size. ARCADE
   never reads pixels back: it is a few dozen drawImage calls over a mask that is drawn once per canvas size. */
(function(){
'use strict';
const A=window.A,E=A._e;
const MODES=['clean','arcade','pocket','eight','print','ascii'],NAMES={clean:'CLEAN',arcade:'ARCADE',pocket:'POCKET',eight:'8-COLOUR',print:'PRINT',ascii:'ASCII'};
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
// ARCADE: the mask (scanlines, grille, vignette, glass) is cached per canvas size; glow and fringe come from small copies
let mask=null,glow=null,gx=null,fr=null,fx=null;
function mkMask(w,h){const m=document.createElement('canvas');m.width=w;m.height=h;const x=m.getContext('2d'),row=h/240;
 // one dark scanline under every game row, softer when the canvas is too small to show a gap
 x.fillStyle=row>=2?'rgba(0,0,0,.5)':'rgba(0,0,0,.22)';for(let y=0;y<240;y++)x.fillRect(0,Math.round((y+.62)*row),w,Math.max(1,Math.round(row*.38)));
 // aperture grille: a faint dark column every third device pixel, only where there is room for it
 if(w>=960){x.fillStyle='rgba(0,0,0,.16)';for(let i=2;i<w;i+=3)x.fillRect(i,0,1,h);}
 // curved glass: darker towards the corners, a little brighter in the middle
 let g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*.28,w/2,h/2,Math.hypot(w,h)*.56);if(g&&g.addColorStop){g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.72,'rgba(0,0,0,.18)');g.addColorStop(1,'rgba(0,0,0,.72)');x.fillStyle=g;x.fillRect(0,0,w,h);}
 // a soft reflection of the room across the top left of the tube
 g=x.createLinearGradient(0,0,w*.55,h*.7);if(g&&g.addColorStop){g.addColorStop(0,'rgba(255,255,255,.07)');g.addColorStop(.45,'rgba(255,255,255,.025)');g.addColorStop(.46,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);}
 // the bezel: black outside a rounded tube face
 x.fillStyle='#000';x.beginPath();x.rect(0,0,w,h);const r=Math.min(w,h)*.07,i0=w*.004;
 x.moveTo(i0+r,i0);x.arcTo(i0,i0,i0,i0+r,r);x.lineTo(i0,h-i0-r);x.arcTo(i0,h-i0,i0+r,h-i0,r);x.lineTo(w-i0-r,h-i0);x.arcTo(w-i0,h-i0,w-i0,h-i0-r,r);x.lineTo(w-i0,i0+r);x.arcTo(w-i0,i0,w-i0-r,i0,r);x.closePath();x.fill('evenodd');
 return m;}
// barrel curvature: the picture is redrawn in thin strips, each squeezed a little more the further it is from the centre
let warpC=null,wx=null;const STRIPS=40,BULGE=.045;
function warp(c,cv,w,h){if(!warpC){warpC=document.createElement('canvas');wx=warpC.getContext('2d');}if(warpC.width!==w||warpC.height!==h){warpC.width=w;warpC.height=h;}
 for(let pass=0;pass<2;pass++){wx.globalCompositeOperation='copy';wx.drawImage(cv,0,0);c.fillStyle='#000';c.fillRect(0,0,w,h);
  for(let i=0;i<STRIPS;i++){const n=(i+.5)/STRIPS*2-1,k=1-BULGE*n*n;
   if(pass===0){const y0=Math.floor(i*h/STRIPS),hh=Math.ceil(h/STRIPS)+1;c.drawImage(warpC,0,y0,w,hh,w*(1-k)/2,y0,w*k,hh);}
   else{const x0=Math.floor(i*w/STRIPS),ww=Math.ceil(w/STRIPS)+1;c.drawImage(warpC,x0,0,ww,h,x0,h*(1-k)/2,ww,h*k);}}}}
function arcade(){const c=A.c,cv=c.canvas,w=cv.width,h=cv.height;if(!w||!h)return;
 if(!mask||mask.width!==w||mask.height!==h)mask=mkMask(w,h);
 if(!glow){glow=document.createElement('canvas');glow.width=160;glow.height=120;gx=glow.getContext('2d');fr=document.createElement('canvas');fr.width=320;fr.height=240;fx=fr.getContext('2d');}
 c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=true;
 // convergence fringe: the red gun lands a hair right of the blue one, so bright edges pick up warm and cool rims
 if(A.gfx==='high'){fx.globalCompositeOperation='copy';fx.drawImage(cv,0,0,320,240);fx.globalCompositeOperation='multiply';fx.fillStyle='#ff2a00';fx.fillRect(0,0,320,240);
  fx.globalCompositeOperation='source-over';c.globalCompositeOperation='lighter';c.globalAlpha=.16;const d=Math.max(1,w/640);c.drawImage(fr,d,0,w,h);
  fx.globalCompositeOperation='copy';fx.drawImage(cv,0,0,320,240);fx.globalCompositeOperation='multiply';fx.fillStyle='#0038ff';fx.fillRect(0,0,320,240);c.globalAlpha=.12;c.drawImage(fr,-d,0,w,h);fx.globalCompositeOperation='source-over';}
 // halation: a blurred bright-pass of the picture, screened back over it
 gx.globalCompositeOperation='copy';if('filter' in gx){gx.filter='brightness(.9) contrast(1.9) blur(3px)';gx.drawImage(cv,0,0,160,120);gx.filter='none';}
 else{gx.drawImage(cv,0,0,40,30);gx.drawImage(glow,0,0,40,30,0,0,160,120);}
 gx.globalCompositeOperation='multiply';gx.drawImage(glow,0,0);gx.globalCompositeOperation='source-over';
 c.globalCompositeOperation='screen';c.globalAlpha=A.gfx==='low'?.55:.85;c.drawImage(glow,0,0,w,h);
 c.globalCompositeOperation='source-over';c.globalAlpha=1;if(A.gfx!=='off')warp(c,cv,w,h);c.drawImage(mask,0,0);c.restore();}
const RUN={arcade,pocket,eight,print,ascii};
A.screenFilter=()=>{if(A.filter==='clean'||typeof document==='undefined'||!A.c||!A.c.canvas||!A.c.getImageData||!A.c.canvas.getContext)return;try{RUN[A.filter]();}catch(e){}};
})();
