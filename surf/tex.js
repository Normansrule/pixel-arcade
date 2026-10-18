// SWELL GUARD — procedural textures (canvas, baked once at load, cached, 1024 or less): water ripple normals, foam lace,
// sand albedo + ripple normals, wood planks, rock, sky cloud noise, board decks, umbrellas, towels, flags, vest print.
// Nothing is loaded from disk: every pixel here is generated in code.
import * as THREE from '../vendor/three.module.min.js';
let seed=7;export const srand=s=>{seed=s>>>0||1;};
export function sr(){seed^=seed<<13;seed>>>=0;seed^=seed>>17;seed^=seed<<5;seed>>>=0;return seed/4294967296;}
const rnd=(a=1)=>sr()*a;
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
export function ctex(w,h,draw,o={}){const c=canvas(w,h),x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=o.aniso??8;if(o.mip===false){t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;}return t;}
// tileable value noise: lattice of period p, smooth interpolated; fbm sums octaves (each octave period doubles, so it still tiles)
function lattice(p){const g=new Float32Array(p*p);for(let i=0;i<g.length;i++)g[i]=sr();return g;}
function vnoise(g,p,x,y){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 const a=g[((yi%p+p)%p)*p+((xi%p+p)%p)],b=g[((yi%p+p)%p)*p+(((xi+1)%p+p)%p)],c=g[(((yi+1)%p+p)%p)*p+((xi%p+p)%p)],d=g[(((yi+1)%p+p)%p)*p+(((xi+1)%p+p)%p)];
 return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;}
export function fbmField(n,base,oct,gain=.5,warp=0){const F=new Float32Array(n*n);const L=[];for(let o=0;o<oct;o++){const p=base<<o;L.push([lattice(p),p]);}
 const W=warp?[lattice(base),lattice(base)]:null;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){let u=x/n,v=y/n;if(W){const wu=vnoise(W[0],base,u*base,v*base)-.5,wv=vnoise(W[1],base,u*base+3.1,v*base+7.7)-.5;u+=wu*warp;v+=wv*warp;}
  let s=0,a=1,t=0;for(const[g,p]of L){s+=vnoise(g,p,u*p,v*p)*a;t+=a;a*=gain;}F[y*n+x]=s/t;}return F;}
// normal map (linear) from a tileable height field
function normalsFrom(H,n,str){const c=canvas(n,n),x=c.getContext('2d'),d=x.createImageData(n,n),D=d.data;
 for(let y=0;y<n;y++)for(let i=0;i<n;i++){const l=H[y*n+(i-1+n)%n],r=H[y*n+(i+1)%n],u=H[((y-1+n)%n)*n+i],b=H[((y+1)%n)*n+i];let nx=(l-r)*str,ny=(u-b)*str,nz=1;const k=1/Math.hypot(nx,ny,nz);
  const j=(y*n+i)*4;D[j]=(nx*k*.5+.5)*255;D[j+1]=(ny*k*.5+.5)*255;D[j+2]=(nz*k*.5+.5)*255;D[j+3]=255;}x.putImageData(d,0,0);return c;}
function fromCanvas(c,srgb){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
function noise(x,w,h,n,a,sz=1,col='0,0,0'){const d=x.getImageData(0,0,w,h),D=d.data;const[r,g,b]=col.split(',').map(Number);
 for(let i=0;i<n;i++){const al=sr()*a,px=sr()*w|0,py=sr()*h|0;for(let yy=0;yy<sz;yy++)for(let xx=0;xx<sz;xx++){const k=(((py+yy)%h)*w+(px+xx)%w)*4;D[k]+=(r-D[k])*al;D[k+1]+=(g-D[k+1])*al;D[k+2]+=(b-D[k+2])*al;}}x.putImageData(d,0,0);}
function blotch(x,w,h,n,r,col,a){for(let i=0;i<n;i++){const cx=rnd(w),cy=rnd(h),rr=r*(.4+rnd());const g=x.createRadialGradient(cx,cy,0,cx,cy,rr);g.addColorStop(0,`rgba(${col},${a*rnd()})`);g.addColorStop(1,`rgba(${col},0)`);x.fillStyle=g;
 for(const ox of[-w,0,w])for(const oy of[-h,0,h]){x.save();x.translate(ox,oy);x.fillRect(cx-rr,cy-rr,rr*2,rr*2);x.restore();}}}

export function makeTextures(q){srand(11);const T={},big=q>=1?512:256;
 // --- water: capillary ripple normals (two octave sets of crossing wavelets, domain-warped so it never looks gridded)
 {const n=big,H=fbmField(n,8,5,.6,.5),H2=fbmField(n,32,2,.5,.3);for(let i=0;i<H.length;i++)H[i]=H[i]*.8+H2[i]*.2;
  T.waterN=fromCanvas(normalsFrom(H,n,n/14),false);}
 // --- foam lace: two worley rim networks (thin bubble walls) modulated by fbm patches, plus pin bubbles. Linear.
 {const n=big,F=fbmField(n,5,4,.55,.5);const nets=[9,21].map(P=>{const pts=[];for(let i=0;i<P*P*2;i++)pts.push([sr(),sr()]);return{P,pts};});
  const c=canvas(n,n),x=c.getContext('2d'),d=x.createImageData(n,n),D=d.data;
  const rim=(N,u,v)=>{const P=N.P;let d1=9,d2=9;const cx=Math.floor(u*P),cy=Math.floor(v*P);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const gx=((cx+ox)%P+P)%P,gy=((cy+oy)%P+P)%P;for(let k=0;k<2;k++){const p=N.pts[(gy*P+gx)*2+k];let dx=(gx+p[0])/P-u,dy=(gy+p[1])/P-v;dx-=Math.round(dx);dy-=Math.round(dy);const dd=Math.sqrt(dx*dx+dy*dy);if(dd<d1){d2=d1;d1=dd;}else if(dd<d2)d2=dd;}}
   return 1-Math.min(1,(d2-d1)*P*7);};
  for(let y=0;y<n;y++)for(let i=0;i<n;i++){const u=i/n,v=y/n,f=F[y*n+i];const r1=rim(nets[0],u,v),r2=rim(nets[1],u,v);
   let val=Math.max(r1*.95,r2*.75)*(.5+.5*f)+f*.38+(sr()<.012?.5:0);val=Math.max(0,Math.min(1,val));const j=(y*n+i)*4;D[j]=D[j+1]=D[j+2]=val*255;D[j+3]=255;}
  x.putImageData(d,0,0);T.foam=fromCanvas(c,false);}
 // --- sky clouds: soft fbm with a threshold done in the shader (linear)
 {const n=256,F=fbmField(n,4,6,.55,.6);const c=canvas(n,n),x=c.getContext('2d'),d=x.createImageData(n,n),D=d.data;for(let i=0;i<F.length;i++){const v=F[i]*255;D[i*4]=D[i*4+1]=D[i*4+2]=v;D[i*4+3]=255;}x.putImageData(d,0,0);T.cloud=fromCanvas(c,false);}
 // --- sand: grain albedo with drifts, plus wind-ripple normals
 {const n=q>=2?1024:512,F=fbmField(n,6,5,.6,.4),c=canvas(n,n),x=c.getContext('2d'),d=x.createImageData(n,n),D=d.data;
  for(let i=0;i<n*n;i++){const f=F[i],g=sr();let r=214+(f-.5)*60+(g-.5)*38,gg=190+(f-.5)*56+(g-.5)*34,b=150+(f-.5)*50+(g-.5)*30;if(g>.985){r*=.55;gg*=.55;b*=.6;}else if(g>.97){r=Math.min(255,r+30);gg=Math.min(255,gg+28);b=Math.min(255,b+26);}
   D[i*4]=r;D[i*4+1]=gg;D[i*4+2]=b;D[i*4+3]=255;}x.putImageData(d,0,0);blotch(x,n,n,30,n/6,'150,120,90',.18);
  // shell fragments and pebbles
  for(let i=0;i<180;i++){x.fillStyle=`rgba(${sr()<.5?'245,236,220':'120,100,84'},${.35+rnd(.5)})`;x.beginPath();x.ellipse(rnd(n),rnd(n),1+rnd(3),1+rnd(2),rnd(3),0,7);x.fill();}
  T.sand=fromCanvas(c,true);
  const m=n/2,R=fbmField(m,4,3,.5,.8),H=new Float32Array(m*m);for(let y=0;y<m;y++)for(let i=0;i<m;i++){const w=R[y*m+i];H[y*m+i]=Math.sin((y/m)*Math.PI*2*16+w*16)*.22*(w*w)+w*.6+sr()*.12;}
  T.sandN=fromCanvas(normalsFrom(H,m,m/70),false);}
 // --- wood planks (tower, ramp, decking): painted boards with chipped paint over grey timber
 T.wood=ctex(512,512,(x,w,h)=>{const pw=64;for(let i=0;i<w/pw;i++){const v=rnd(24)|0;x.fillStyle=`rgb(${226+v/3|0},${222+v/3|0},${210+v/4|0})`;x.fillRect(i*pw,0,pw-4,h);
   for(let k=0;k<22;k++){x.strokeStyle=`rgba(90,80,70,${rnd(.18)})`;x.lineWidth=1;x.beginPath();const xx=i*pw+rnd(pw);x.moveTo(xx,0);x.bezierCurveTo(xx+rnd(8)-4,h/3,xx+rnd(8)-4,h*2/3,xx+rnd(6)-3,h);x.stroke();}
   for(let k=0;k<5;k++){x.fillStyle='rgba(120,108,92,.55)';x.beginPath();x.ellipse(i*pw+rnd(pw),rnd(h),2+rnd(9),1+rnd(4),rnd(3),0,7);x.fill();}}
  x.fillStyle='#3a342c';for(let i=0;i<w/pw;i++)x.fillRect(i*pw+pw-4,0,4,h);for(let i=0;i<w/pw;i++)for(const yy of[20,h-20]){x.fillStyle='#5a5048';x.beginPath();x.arc(i*pw+10,yy,2.5,0,7);x.arc(i*pw+pw-14,yy,2.5,0,7);x.fill();}noise(x,w,h,6000,.08);blotch(x,w,h,14,60,'110,96,80',.2);});
 T.timber=ctex(256,256,(x,w,h)=>{x.fillStyle='#8a7c6a';x.fillRect(0,0,w,h);for(let k=0;k<70;k++){x.strokeStyle=`rgba(${sr()<.5?'60,50,40':'170,160,145'},${rnd(.3)})`;x.beginPath();const xx=rnd(w);x.moveTo(xx,0);x.bezierCurveTo(xx+rnd(8)-4,h/3,xx+rnd(8)-4,h*2/3,xx+rnd(6)-3,h);x.stroke();}noise(x,w,h,3000,.1);blotch(x,w,h,8,40,'50,60,40',.25);});
 // --- rock: layered sandstone with cracks
 {const n=512,F=fbmField(n,8,6,.55,.7),c=canvas(n,n),x=c.getContext('2d'),d=x.createImageData(n,n),D=d.data;
  for(let y=0;y<n;y++)for(let i=0;i<n;i++){const f=F[y*n+i],band=Math.sin((y/n)*Math.PI*2*9+f*9)*.5+.5,g=sr()*.08;const k=.55+f*.55+band*.12+g;D[(y*n+i)*4]=124*k;D[(y*n+i)*4+1]=104*k;D[(y*n+i)*4+2]=86*k;D[(y*n+i)*4+3]=255;}
  x.putImageData(d,0,0);x.lineWidth=1.5;for(let i=0;i<30;i++){x.strokeStyle=`rgba(30,22,18,${.3+rnd(.4)})`;x.beginPath();let px=rnd(n),py=rnd(n);x.moveTo(px,py);let a=rnd(6.28);for(let k=0;k<12;k++){a+=rnd(1)-.5;px+=Math.cos(a)*10;py+=Math.sin(a)*10;x.lineTo(px,py);}x.stroke();}
  blotch(x,n,n,16,70,'60,70,50',.2);T.rock=fromCanvas(c,true);T.rockN=fromCanvas(normalsFrom(F,n,n/40),false);}
 // --- grass tuft + palm frond cut-outs (alpha)
 T.grass=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);for(let i=0;i<40;i++){const bx=10+rnd(108),ht=50+rnd(74),lean=rnd(30)-15;x.strokeStyle=`rgb(${120+rnd(60)|0},${130+rnd(50)|0},${70+rnd(30)|0})`;x.lineWidth=1.5+rnd(2);x.beginPath();x.moveTo(bx,h);x.quadraticCurveTo(bx+lean*.3,h-ht*.6,bx+lean,h-ht);x.stroke();}},{aniso:4});
 T.frond=ctex(256,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#5d6e2a';x.lineWidth=3;x.beginPath();x.moveTo(0,h/2);x.quadraticCurveTo(w/2,h/2-4,w,h/2+2);x.stroke();
  for(let i=4;i<w-4;i+=5){const t=i/w,len=(1-Math.abs(t-.35)*1.2)*28+4,c=`rgb(${70+rnd(30)|0},${100+rnd(40)|0},${36+rnd(20)|0})`;x.strokeStyle=c;x.lineWidth=2.4;for(const s of[-1,1]){x.beginPath();x.moveTo(i,h/2);x.lineTo(i+8,h/2+s*len);x.stroke();}}},{aniso:4});
 // --- board deck: base colour, stringer, rail band, traction pad, a cross emblem (rescue board) or stripes
 T.board=(base,stripe,cross)=>ctex(512,128,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(.12,'rgba(255,255,255,0)');g.addColorStop(.88,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,.22)');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.fillStyle=stripe;x.fillRect(w*.18,h*.12,w*.62,h*.06);x.fillRect(w*.18,h*.82,w*.62,h*.06);x.fillStyle='rgba(60,40,20,.55)';x.fillRect(0,h/2-1,w,2);
  // tail pad with grooves
  x.fillStyle='#202226';x.fillRect(4,h*.24,w*.13,h*.52);x.fillStyle='rgba(255,255,255,.08)';for(let i=0;i<12;i++)x.fillRect(8+i*5,h*.26,2,h*.48);
  if(cross){x.fillStyle='#fff';x.fillRect(w*.56,h*.38,w*.12,h*.24);x.fillRect(w*.6,h*.24,w*.04,h*.52);x.fillStyle=stripe;x.fillRect(w*.565,h*.41,w*.11,h*.18);x.fillRect(w*.605,h*.27,w*.03,h*.46);}
  x.font='bold 22px Anton, Impact, sans-serif';x.fillStyle='rgba(255,255,255,.85)';x.textAlign='center';x.textBaseline='middle';if(cross){x.save();x.translate(w*.37,h/2);x.fillText('RESCUE',0,1);x.restore();}
  noise(x,w,h,2500,.05);},{aniso:8});
 // umbrellas: 8 striped gores; towels: woven stripes
 T.umb=ctex(512,64,(x,w,h)=>{const cols=[['#d8452e','#f4ecdc'],['#2d6fb0','#f4ecdc'],['#f0b429','#f4ecdc'],['#1f8a7a','#f8d9b0'],['#e46b8a','#fff4e8'],['#3a3f8f','#ffd36b'],['#ff7a3d','#1f6a8a'],['#6aaa4a','#f4ecdc']];
  for(let r=0;r<8;r++)for(let i=0;i<8;i++){x.fillStyle=cols[r][i%2];x.fillRect(i*64,r*8,64,8);}noise(x,w,h,1500,.06);},{aniso:4});
 T.towel=ctex(256,256,(x,w,h)=>{const cols=['#e94f37','#f6f7eb','#3f88c5','#ffba08','#1c3144','#44bba4','#e85d75','#f9c784'];for(let r=0;r<4;r++)for(let c=0;c<4;c++){const A=cols[(r*4+c)%8],B=cols[(r*4+c+3)%8];for(let i=0;i<8;i++){x.fillStyle=i%2?A:B;x.fillRect(c*64,r*64+i*8,64,8);}}noise(x,w,h,8000,.12,1,'255,255,255');noise(x,w,h,6000,.1);},{aniso:4});
 // flags: 0 red/yellow halves, 1 red, 2 purple (marine life), 3 yellow, 4 double red (water closed); rows of a 4x... strip
 T.flags=ctex(256,320,(x,w,h)=>{const r=64;x.fillStyle='#d42a1e';x.fillRect(0,0,w,r/2);x.fillStyle='#ffd21f';x.fillRect(0,r/2,w,r/2);x.fillStyle='#d42a1e';x.fillRect(0,r,w,r);x.fillStyle='#7b2fbe';x.fillRect(0,r*2,w,r);x.fillStyle='#ffd21f';x.fillRect(0,r*3,w,r);
  x.fillStyle='#d42a1e';x.fillRect(0,r*4,w,r);x.fillStyle='#fff';x.font='bold 40px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('✕',w/2,r*4.5);
  noise(x,w,h,5000,.08);for(let i=0;i<5;i++){x.fillStyle='rgba(0,0,0,.15)';x.fillRect(0,i*r,4,r);}},{aniso:4});
 // lifeguard vest: red with a white cross band and a 'GUARD' print (front/back)
 T.vest=ctex(256,128,(x,w,h)=>{x.fillStyle='#d8261c';x.fillRect(0,0,w,h);noise(x,w,h,4000,.08);x.fillStyle='#f3f0ea';x.font='bold 30px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('GUARD',w*.25,h*.52);x.fillText('GUARD',w*.75,h*.52);x.fillStyle='#ffd21f';x.fillRect(0,h*.86,w,h*.06);x.fillRect(0,h*.06,w,h*.04);},{aniso:4});
 // tower sign
 T.sign=ctex(512,128,(x,w,h)=>{x.fillStyle='#0f3f66';x.fillRect(0,0,w,h);x.strokeStyle='#f3f0ea';x.lineWidth=6;x.strokeRect(8,8,w-16,h-16);x.fillStyle='#f3f0ea';x.font='bold 64px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('TOWER 7',w/2,h/2+3);noise(x,w,h,3000,.08);});
 return T;}
