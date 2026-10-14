// HOLLOW MANOR — procedural textures (no image files): damask wallpapers, wainscot, floors, tiles, stone, plaster, books,
// oil portraits, the night outside the windows and the sprites for flames, dust and the creature's shroud.
import * as THREE from '../vendor/three.module.min.js';
export const DISP="'Anton',Impact,sans-serif",MONO="'JetBrains Mono',ui-monospace,monospace",SERIF="Georgia,'Times New Roman',serif";
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
function noiseField(w,h,cell,oct=4){const out=new Float32Array(w*h);let amp=1,sum=0;
 for(let o=0;o<oct;o++){const cw=Math.max(1,cell>>o),gx=Math.ceil(w/cw)+1,gz=Math.ceil(h/cw)+1;const g=new Float32Array(gx*gz);for(let i=0;i<g.length;i++)g[i]=rnd();
  for(let y=0;y<h;y++){const fy=y/cw,iy=fy|0,ty=fy-iy,sy=ty*ty*(3-2*ty);for(let x=0;x<w;x++){const fx=x/cw,ix=fx|0,tx=fx-ix,sx=tx*tx*(3-2*tx);
   const x0=ix%(gx-1),x1=(ix+1)%(gx-1),y0=iy%(gz-1),y1=(iy+1)%(gz-1);const a=g[y0*gx+x0],b=g[y0*gx+x1],c=g[y1*gx+x0],d=g[y1*gx+x1];out[y*w+x]+=amp*((a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy);}}
  sum+=amp;amp*=.5;}
 for(let i=0;i<out.length;i++)out[i]/=sum;return out;}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h||w;return c;}
function tex(c,o={}){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.userData.canvas=c;return t;}
function mk(size,draw,o){const c=canvas(size);draw(c.getContext('2d'),size);return tex(c,o);}
function paint(x,s,f,h=s){const img=x.getImageData(0,0,s,h),d=img.data;for(let i=0;i<s*h;i++){const[r,g,b]=f(i%s,(i/s)|0,i);d[i*4]=r;d[i*4+1]=g;d[i*4+2]=b;d[i*4+3]=255;}x.putImageData(img,0,0);}
const mix=(a,b,t)=>a+(b-a)*t,cl=(v,a,b)=>v<a?a:v>b?b:v;
// age a texture: grime blotches, water stains running down, darkening at the bottom
function age(x,s,k=1,stains=3){const n=noiseField(s,s,64,4);const img=x.getImageData(0,0,s,s),d=img.data;for(let i=0;i<s*s;i++){const m=.72+n[i]*.5*k;d[i*4]*=m;d[i*4+1]*=m;d[i*4+2]*=m*.97;}x.putImageData(img,0,0);
 for(let i=0;i<stains;i++){const sx=rnd()*s,w=8+rnd()*30,l=s*(.2+rnd()*.6);const g=x.createLinearGradient(0,0,0,l);g.addColorStop(0,'rgba(40,30,10,.32)');g.addColorStop(1,'rgba(40,30,10,0)');x.fillStyle=g;x.beginPath();x.moveTo(sx-w,0);x.bezierCurveTo(sx-w*.5,l*.5,sx-w*.2,l*.8,sx,l);x.bezierCurveTo(sx+w*.2,l*.8,sx+w*.5,l*.5,sx+w,0);x.fill();}}
// a mirrored damask motif tile
function damask(x,s,bg,fg,line){x.fillStyle=bg;x.fillRect(0,0,s,s);
 const motif=(cx,cy,sc)=>{x.save();x.translate(cx,cy);x.scale(sc,sc);for(const m of[1,-1]){x.save();x.scale(m,1);x.beginPath();x.moveTo(0,-60);x.bezierCurveTo(20,-50,34,-30,22,-12);x.bezierCurveTo(40,-18,48,6,30,14);x.bezierCurveTo(44,26,30,48,12,40);x.bezierCurveTo(14,52,6,60,0,64);x.lineTo(0,-60);x.fill();
  x.beginPath();x.moveTo(6,-30);x.bezierCurveTo(30,-40,60,-30,56,-6);x.bezierCurveTo(52,10,34,4,40,-6);x.stroke();x.beginPath();x.arc(46,30,5,0,7);x.fill();x.restore();}
  x.beginPath();x.ellipse(0,0,6,14,0,0,7);x.fillStyle=bg;x.fill();x.fillStyle=fg;x.restore();};
 x.fillStyle=fg;x.strokeStyle=fg;x.lineWidth=3;for(const[cx,cy]of[[s/2,s/2],[0,0],[s,0],[0,s],[s,s]])motif(cx,cy,s/300);
 x.globalAlpha=.5;x.fillStyle=line;for(const[cx,cy]of[[s/2,0],[s/2,s],[0,s/2],[s,s/2]]){x.beginPath();x.arc(cx,cy,s/40,0,7);x.fill();}x.globalAlpha=1;}
function woodGrain(x,s,base,dark,cell=8,vert=false){const n=noiseField(s,s,cell*8,3);paint(x,s,(px,py,i)=>{const t=(vert?px:py)*.11+n[i]*4;const g=.5+.5*Math.sin(t*2.2+Math.sin((vert?py:px)*.02)*2);const v=.75+n[i]*.4;return[mix(dark[0],base[0],g)*v,mix(dark[1],base[1],g)*v,mix(dark[2],base[2],g)*v];});}

export function makeTextures(){seed=7;const T={};
 // ---- wallpapers: [background, motif, dot]
 const WP={wpG:['#1c2a20','#2c4232','#3a5040'],wpR:['#33141a','#4a2028','#5a2a30'],wpD:['#1e1c1a','#3a3020','#4a3a24'],wpP:['#2a1c2a','#3e2a3e','#4a3448'],wpB:['#1a2230','#28344a','#34405a']};
 for(const k in WP)T[k]=mk(256,(x,s)=>{damask(x,s,...WP[k]);age(x,s,1.1,4);x.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<s;i+=s/4)x.fillRect(i,0,1,s);});
 // nursery: faded pastel stripes with little stars, badly stained
 T.wpN=mk(256,(x,s)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?'#5a6470':'#6e7068';x.fillRect(i*s/8,0,s/8,s);}x.fillStyle='rgba(230,220,170,.35)';for(let i=0;i<14;i++){const a=(i%4+.5)*s/4,b=((i*37)%s);x.font='18px serif';x.fillText('✦',a-6,b);}age(x,s,1.6,6);});
 // wainscot: dark raised panels, one per metre
 T.panel=mk(256,(x,s)=>{woodGrain(x,s,[92,58,34],[48,28,16],8,true);x.lineWidth=6;const m=s*.12;
  x.strokeStyle='rgba(0,0,0,.55)';x.strokeRect(m,m,s-2*m,s-2*m);x.strokeStyle='rgba(255,210,150,.12)';x.lineWidth=3;x.strokeRect(m-4,m-4,s-2*m+8,s-2*m+8);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(m+6,m+6,s-2*m-12,s-2*m-12);age(x,s,.8,0);});
 T.trim=mk(128,(x,s)=>{woodGrain(x,s,[80,50,30],[40,24,14],4);});
 T.wood=mk(256,(x,s)=>{woodGrain(x,s,[110,72,44],[60,36,20],8);});
 T.dark=mk(256,(x,s)=>{woodGrain(x,s,[58,36,24],[26,16,10],6);age(x,s,.6,0);});
 // floors
 T.oak=mk(512,(x,s)=>{const n=noiseField(s,s,40,4);const pw=s/6;paint(x,s,(px,py,i)=>{const b=(px/pw)|0,off=(b*137)%s,yy=(py+off)%s,plank=(yy/(s/2))|0;const g=.5+.5*Math.sin((px%pw)*.35+n[i]*14+b);const v=(.62+((b*7+plank*3)%5)*.07)*(.8+n[i]*.4);
  let r=mix(58,104,g)*v,gg=mix(34,66,g)*v,bb=mix(20,40,g)*v;if(px%pw<2||yy%(s/2)<2){r*=.4;gg*=.4;bb*=.4;}return[r,gg,bb];});age(x,s,.8,0);});
 T.marble=mk(512,(x,s)=>{const n=noiseField(s,s,128,5),v2=noiseField(s,s,32,3);const c=s/4;paint(x,s,(px,py,i)=>{const w=((px/c|0)+(py/c|0))%2===0;const vein=Math.pow(1-Math.abs(Math.sin((px+py)*.02+n[i]*12)),12);
  const e=(px%c<2||py%c<2)?.45:1;if(w){const v=(150+v2[i]*50)*e;return[v-vein*60,v-vein*62,v-4-vein*55];}const v=(26+v2[i]*18)*e;return[v+vein*50,v+vein*44,v+vein*40];});age(x,s,.9,0);});
 T.ktile=mk(256,(x,s)=>{const c=s/8,n=noiseField(s,s,32,3);paint(x,s,(px,py,i)=>{const w=((px/c|0)+(py/c|0))%2===0;const e=(px%c<2||py%c<2)?.35:1;const v=(w?150:46)*(.8+n[i]*.35)*e;return[v,v*.97,v*.9];});age(x,s,1.2,0);});
 T.wtile=mk(256,(x,s)=>{const c=s/8,n=noiseField(s,s,32,3);paint(x,s,(px,py,i)=>{const e=(px%c<2||(py+(((px/c)|0)%2)*c/2)%c<2)?.45:1;const v=(170+n[i]*40)*e;return[v*.95,v*.97,v*.9];});age(x,s,1.4,5);});
 T.planks=mk(256,(x,s)=>{woodGrain(x,s,[96,74,52],[46,34,24],6);x.fillStyle='rgba(0,0,0,.6)';for(let i=0;i<5;i++)x.fillRect(0,i*s/5,s,2);for(let i=0;i<40;i++){x.fillStyle='rgba(20,14,8,.7)';x.beginPath();x.arc(rnd()*s,((rnd()*5|0)+.5)*s/5+(rnd()<.5?-14:14),1.6,0,7);x.fill();}age(x,s,1.1,0);});
 T.stone=mk(256,(x,s)=>{const n=noiseField(s,s,24,4);paint(x,s,(px,py,i)=>{const v=56+n[i]*44;return[v,v*.96,v*.9];});const rows=6,h=s/rows;
  for(let r=0;r<rows;r++){let cx=-rnd()*40;while(cx<s){const w=36+rnd()*50;x.strokeStyle='rgba(10,8,6,.85)';x.lineWidth=3;x.beginPath();x.roundRect(cx+2,r*h+2,w-4,h-4,6);x.stroke();x.fillStyle=`rgba(${rnd()<.5?'0,0,0':'120,110,90'},${rnd()*.15})`;x.fill();cx+=w;}}age(x,s,1.3,4);});
 T.stonef=mk(256,(x,s)=>{const n=noiseField(s,s,32,4);paint(x,s,(px,py,i)=>{const v=44+n[i]*40;return[v,v*.97,v*.92];});x.strokeStyle='rgba(8,6,4,.8)';x.lineWidth=3;for(let i=0;i<4;i++){x.beginPath();x.moveTo(0,i*s/4+rnd()*6);x.lineTo(s,i*s/4+rnd()*6);x.stroke();for(let j=0;j<3;j++){const a=(j+rnd()*.5)*s/3;x.beginPath();x.moveTo(a,i*s/4);x.lineTo(a,(i+1)*s/4);x.stroke();}}age(x,s,1.2,0);});
 T.plaster=mk(256,(x,s)=>{const n=noiseField(s,s,32,5);paint(x,s,(px,py,i)=>{const v=120+n[i]*40;return[v,v*.95,v*.86];});x.strokeStyle='rgba(30,24,16,.4)';x.lineWidth=1;for(let i=0;i<6;i++){let a=rnd()*s,b=rnd()*s;x.beginPath();x.moveTo(a,b);for(let j=0;j<8;j++){a+=(rnd()-.5)*30;b+=rnd()*20;x.lineTo(a,b);}x.stroke();}age(x,s,1.6,6);});
 T.ceil=mk(256,(x,s)=>{const n=noiseField(s,s,64,5);paint(x,s,(px,py,i)=>{const v=90+n[i]*40;return[v,v*.95,v*.88];});for(let i=0;i<4;i++){const g=x.createRadialGradient(rnd()*s,rnd()*s,4,rnd()*s,rnd()*s,40+rnd()*60);g.addColorStop(0,'rgba(70,50,20,.35)');g.addColorStop(1,'rgba(70,50,20,0)');x.fillStyle=g;x.fillRect(0,0,s,s);}});
 T.cloth=mk(128,(x,s)=>{const n=noiseField(s,s,16,3);paint(x,s,(px,py,i)=>{const f=.75+.25*Math.sin(px*.4+n[i]*3);return[120*f*(.8+n[i]*.3),24*f,30*f];});});
 T.sheet=mk(128,(x,s)=>{const n=noiseField(s,s,32,4);paint(x,s,(px,py,i)=>{const f=.82+.18*Math.sin(px*.15+n[i]*6);const v=170*f*(.8+n[i]*.3);return[v,v*.97,v*.9];});age(x,s,1.4,3);});
 T.rug=mk(256,(x,s)=>{x.fillStyle='#4a1414';x.fillRect(0,0,s,s);x.strokeStyle='#a07a3a';x.lineWidth=6;x.strokeRect(14,14,s-28,s-28);x.strokeStyle='#1a2a3a';x.lineWidth=12;x.strokeRect(30,30,s-60,s-60);
  x.fillStyle='#8a6a30';x.save();x.translate(s/2,s/2);for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.beginPath();x.ellipse(0,40,12,34,0,0,7);x.fill();}x.restore();x.fillStyle='#2a1010';x.beginPath();x.arc(s/2,s/2,20,0,7);x.fill();age(x,s,1.2,0);});
 T.metal=mk(128,(x,s)=>{const n=noiseField(s,s,16,4);paint(x,s,(px,py,i)=>{const v=50+n[i]*50;return[v,v*.95,v*.9];});for(let i=0;i<30;i++){x.fillStyle=`rgba(110,50,20,${rnd()*.4})`;x.beginPath();x.arc(rnd()*s,rnd()*s,rnd()*10,0,7);x.fill();}});
 // book spines (one shelf row, tiled)
 T.books=mk(256,(x,s)=>{x.fillStyle='#0a0806';x.fillRect(0,0,s,s);const C=['#5a1a14','#1e3a2a','#2a2a40','#4a3a1a','#3a1a2a','#6a5030','#202020','#5a3a20'];
  for(let row=0;row<2;row++){let cx=0;const y0=row*s/2;while(cx<s){const w=6+rnd()*12,h=s/2*(.72+rnd()*.26);x.fillStyle=C[(rnd()*C.length)|0];x.fillRect(cx,y0+s/2-h,w-1,h);x.fillStyle='rgba(200,170,90,.55)';x.fillRect(cx+1,y0+s/2-h+8,w-3,2);x.fillRect(cx+1,y0+s/2-12,w-3,2);
   x.fillStyle='rgba(0,0,0,.35)';x.fillRect(cx+w-3,y0+s/2-h,2,h);cx+=w;if(rnd()<.06)cx+=10;}}age(x,s,.8,0);});
 // the night outside: sky, bare trees, rain on the glass
 T.night=mk(256,(x,s)=>{const g=x.createLinearGradient(0,0,0,s);g.addColorStop(0,'#1a2440');g.addColorStop(.6,'#2c3a5e');g.addColorStop(1,'#0a0e18');x.fillStyle=g;x.fillRect(0,0,s,s);
  const m=x.createRadialGradient(s*.7,s*.25,2,s*.7,s*.25,s*.5);m.addColorStop(0,'rgba(220,230,255,.8)');m.addColorStop(.1,'rgba(150,170,220,.35)');m.addColorStop(1,'rgba(80,100,160,0)');x.fillStyle=m;x.fillRect(0,0,s,s);
  x.strokeStyle='#05070c';x.fillStyle='#05070c';const tree=(bx,by,len,a,w)=>{if(len<4)return;const ex=bx+Math.sin(a)*len,ey=by-Math.cos(a)*len;x.lineWidth=w;x.beginPath();x.moveTo(bx,by);x.lineTo(ex,ey);x.stroke();tree(ex,ey,len*.72,a-.4-rnd()*.3,w*.7);tree(ex,ey,len*.68,a+.35+rnd()*.3,w*.7);};
  tree(s*.2,s,s*.32,.05,7);tree(s*.85,s,s*.26,-.1,6);x.fillRect(0,s*.88,s,s*.12);
  for(let i=0;i<90;i++){const a=rnd()*s,b=rnd()*s,l=4+rnd()*14;x.strokeStyle=`rgba(180,200,255,${.08+rnd()*.15})`;x.lineWidth=1;x.beginPath();x.moveTo(a,b);x.lineTo(a+.6,b+l);x.stroke();}});
 // flame / glow / dust sprite
 T.glow=mk(64,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,s,s);},{srgb:false});
 T.flame=mk(64,(x,s)=>{x.clearRect(0,0,s,s);const g=x.createRadialGradient(s/2,s*.62,1,s/2,s*.55,s*.42);g.addColorStop(0,'rgba(255,250,220,1)');g.addColorStop(.3,'rgba(255,190,90,.9)');g.addColorStop(.7,'rgba(255,90,20,.3)');g.addColorStop(1,'rgba(255,60,0,0)');x.fillStyle=g;x.beginPath();x.ellipse(s/2,s*.55,s*.22,s*.45,0,0,7);x.fill();},{srgb:false});
 // shaft / window light patch gradient
 T.shaft=mk(64,(x,s)=>{const img=x.createImageData(s,s);for(let j=0;j<s;j++)for(let i=0;i<s;i++){const u=i/(s-1),v=j/(s-1);const e=Math.pow(Math.sin(u*Math.PI),1.5)*Math.pow(1-v,1.6)*Math.min(1,v*8+.2);const o=(j*s+i)*4;img.data[o]=img.data[o+1]=img.data[o+2]=255*e;img.data[o+3]=255;}x.putImageData(img,0,0);},{srgb:false});
 T.patch=mk(128,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);x.filter='blur(6px)';x.fillStyle='#fff';const m=s*.14,w=(s-3*m)/2,h=(s-3*m)/2;for(const[i,j]of[[0,0],[1,0],[0,1],[1,1]])x.fillRect(m+i*(w+m),m+j*(h+m),w,h);x.filter='none';},{srgb:false});
 // tattered shroud: dark cloth with a torn, alpha-tested hem
 T.shroud=mk(256,(x,s)=>{const n=noiseField(s,s,16,4);const img=x.createImageData(s,s);for(let j=0;j<s;j++)for(let i=0;i<s;i++){const k=j*s+i,f=.7+.3*Math.sin(i*.25+n[k]*8);const v=26*f*(.7+n[k]*.6);const hem=.78+.18*Math.sin(i*.31)*Math.sin(i*.07+2)+n[(j%s)*s+i]*.12;
  img.data[k*4]=v*1.05;img.data[k*4+1]=v;img.data[k*4+2]=v*.95;img.data[k*4+3]=(j/s>hem||(n[k]>.72&&j/s>.4))?0:255;}x.putImageData(img,0,0);});
 // pale cracked porcelain
 T.mask=mk(256,(x,s)=>{const n=noiseField(s,s,32,4);paint(x,s,(px,py,i)=>{const v=200+n[i]*40;return[v,v*.95,v*.88];});x.strokeStyle='rgba(40,20,14,.7)';x.lineWidth=1.4;
  for(let c=0;c<5;c++){let a=s*.3+rnd()*s*.4,b=rnd()*s*.3;x.beginPath();x.moveTo(a,b);for(let j=0;j<10;j++){a+=(rnd()-.5)*26;b+=rnd()*18;x.lineTo(a,b);}x.stroke();}
  const g=x.createLinearGradient(0,s*.4,0,s);g.addColorStop(0,'rgba(60,10,8,0)');g.addColorStop(1,'rgba(60,10,8,.55)');x.fillStyle=g;x.fillRect(s*.35,s*.4,s*.08,s*.6);x.fillRect(s*.58,s*.45,s*.06,s*.55);});
 T.skin=mk(128,(x,s)=>{const n=noiseField(s,s,16,4);paint(x,s,(px,py,i)=>{const v=60+n[i]*50;return[v*1.05,v*.92,v*.86];});});
 return T;}

// text / label canvas texture (notes on paper, plaques)
export function labelTex(w,h,draw){const c=canvas(w,h);draw(c.getContext('2d'),w,h);const t=tex(c);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;}

// four oil portraits of the Hollow family; each is upright only one way round
export function portraitTex(i){seed=100+i*31;const P=[{n:'LORD ALDRIC',coat:'#1a1a22',hair:'#2a2018',bg:'#2a2416',beard:1},{n:'LADY MAREN',coat:'#3a1420',hair:'#4a2a14',bg:'#1c2420',dress:1},{n:'MASTER TOBIAS',coat:'#1a2a3a',hair:'#6a5030',bg:'#241c1c',child:1},{n:'MISS ELSPETH',coat:'#2a3a2a',hair:'#1a1210',bg:'#20202a',dress:1,child:1}][i];
 return labelTex(256,320,(x,w,h)=>{const g=x.createRadialGradient(w*.5,h*.35,10,w*.5,h*.45,h*.7);g.addColorStop(0,P.bg);g.addColorStop(1,'#050403');x.fillStyle=g;x.fillRect(0,0,w,h);
  const hy=P.child?h*.4:h*.34,hr=P.child?w*.15:w*.17;
  x.fillStyle=P.coat;x.beginPath();x.moveTo(w*.08,h);x.bezierCurveTo(w*.1,h*.62,w*.3,h*.58,w*.5,h*.57);x.bezierCurveTo(w*.7,h*.58,w*.9,h*.62,w*.92,h);x.fill();
  if(P.dress){x.fillStyle='rgba(220,200,170,.5)';x.beginPath();x.ellipse(w*.5,h*.6,w*.13,h*.03,0,0,7);x.fill();}else{x.fillStyle='#d8d0c0';x.beginPath();x.moveTo(w*.44,h*.56);x.lineTo(w*.5,h*.68);x.lineTo(w*.56,h*.56);x.fill();}
  x.fillStyle='#a88a70';x.fillRect(w*.45,hy+hr*.8,w*.1,h*.08);
  x.fillStyle=P.hair;x.beginPath();x.ellipse(w*.5,hy-hr*.15,hr*1.12,hr*1.2,0,0,7);x.fill();if(P.dress){x.beginPath();x.ellipse(w*.5,hy+hr*.5,hr*1.3,hr*1.2,0,0,7);x.fill();}
  const fg=x.createRadialGradient(w*.46,hy-hr*.2,4,w*.5,hy,hr*1.1);fg.addColorStop(0,'#e8d0b8');fg.addColorStop(1,'#7a5a48');x.fillStyle=fg;x.beginPath();x.ellipse(w*.5,hy+hr*.08,hr*.8,hr*1.02,0,0,7);x.fill();
  if(P.beard){x.fillStyle=P.hair;x.beginPath();x.ellipse(w*.5,hy+hr*.7,hr*.6,hr*.42,0,0,Math.PI);x.fill();}
  x.fillStyle='#1a0e08';for(const s of[-1,1]){x.beginPath();x.ellipse(w*.5+s*hr*.34,hy-hr*.05,hr*.13,hr*.08,0,0,7);x.fill();}x.fillStyle='rgba(255,240,220,.6)';for(const s of[-1,1])x.fillRect(w*.5+s*hr*.34-1,hy-hr*.09,2,2);
  x.strokeStyle='#5a2a20';x.lineWidth=2;x.beginPath();x.moveTo(w*.5-hr*.22,hy+hr*.5);x.quadraticCurveTo(w*.5,hy+hr*.56,w*.5+hr*.22,hy+hr*.5);x.stroke();
  // craquelure + varnish
  x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=.6;for(let k=0;k<70;k++){const a=rnd()*w,b=rnd()*h;x.beginPath();x.moveTo(a,b);x.lineTo(a+(rnd()-.5)*20,b+(rnd()-.5)*20);x.stroke();}
  const v=x.createRadialGradient(w/2,h/2,h*.2,w/2,h/2,h*.75);v.addColorStop(0,'rgba(80,60,10,.1)');v.addColorStop(1,'rgba(0,0,0,.7)');x.fillStyle=v;x.fillRect(0,0,w,h);
  x.fillStyle='rgba(200,170,100,.5)';x.font=`11px ${SERIF}`;x.textAlign='center';x.fillText(P.n,w/2,h-10);});}
// a darker landscape / still-life painting for the walls
export function paintingTex(i){seed=300+i*17;return labelTex(256,192,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,i%2?'#2a2a20':'#1a2028');g.addColorStop(1,'#0a0806');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.fillStyle='#0c0a08';x.beginPath();x.moveTo(0,h*.7);for(let k=0;k<=8;k++)x.lineTo(k*w/8,h*(.55+rnd()*.2));x.lineTo(w,h);x.lineTo(0,h);x.fill();
 if(i%2){x.fillStyle='#3a3020';x.fillRect(w*.6,h*.4,w*.12,h*.3);x.beginPath();x.moveTo(w*.58,h*.4);x.lineTo(w*.66,h*.28);x.lineTo(w*.74,h*.4);x.fill();x.fillStyle='rgba(255,200,100,.6)';x.fillRect(w*.64,h*.48,6,8);}
 else{x.fillStyle='rgba(200,210,230,.5)';x.beginPath();x.arc(w*.3,h*.25,10,0,7);x.fill();}
 const v=x.createRadialGradient(w/2,h/2,h*.2,w/2,h/2,w*.7);v.addColorStop(0,'rgba(80,60,10,.1)');v.addColorStop(1,'rgba(0,0,0,.7)');x.fillStyle=v;x.fillRect(0,0,w,h);});}
// the three sigils: ash, bone, salt
export const SIGILS=[{id:'ash',n:'SIGIL OF ASH',col:'#ff7a3a',hex:0xff6a2a},{id:'bone',n:'SIGIL OF BONE',col:'#e8dcc0',hex:0xf0e4c8},{id:'salt',n:'SIGIL OF SALT',col:'#8ad0ff',hex:0x7ac8ff}];
export function sigilTex(i){return labelTex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);const c=SIGILS[i].col;x.strokeStyle=c;x.fillStyle=c;x.lineWidth=5;x.shadowColor=c;x.shadowBlur=12;x.beginPath();x.arc(64,64,48,0,7);x.stroke();x.lineWidth=4;
 x.beginPath();if(i===0){x.moveTo(64,22);x.lineTo(100,90);x.lineTo(28,90);x.closePath();x.moveTo(64,50);x.lineTo(64,100);}else if(i===1){x.moveTo(40,36);x.lineTo(88,92);x.moveTo(88,36);x.lineTo(40,92);x.moveTo(64,20);x.lineTo(64,108);}else{for(let k=0;k<6;k++){const a=k*Math.PI/3;x.moveTo(64,64);x.lineTo(64+Math.cos(a)*40,64+Math.sin(a)*40);}}x.stroke();x.beginPath();x.arc(64,64,9,0,7);x.fill();});}
