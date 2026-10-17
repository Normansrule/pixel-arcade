// SKY LANCERS — canvas HUD: aim reticle, gun cross, target boxes + lead pipper, missile seeker/lock, warnings, tapes, compass, radar.
import * as THREE from '../vendor/three.module.min.js';
import {HGRID,WORLD} from './world.js';
const V=THREE.Vector3,TAU=Math.PI*2;
const ORANGE='#ff4d00',RED='#ff3b30',BLUE='#4da3ff',GREEN='#5dff9a',WHITE='rgba(255,255,255,.92)',DIM='rgba(255,255,255,.45)';
const HN=Math.round(Math.sqrt(HGRID.length));
function mapImage(){const c=document.createElement('canvas');c.width=c.height=HN;const x=c.getContext('2d'),im=x.createImageData(HN,HN);
 for(let i=0;i<HN*HN;i++){const h=HGRID[i];let r,g,b,a;if(h>0){const k=Math.min(1,h/700);r=70+k*80;g=110+k*40;b=70+k*50;a=230;}else if(h>-12){r=40;g=120;b=140;a=120;}else{r=g=b=0;a=0;}im.data[i*4]=r;im.data[i*4+1]=g;im.data[i*4+2]=b;im.data[i*4+3]=a;}
 x.putImageData(im,0,0);return c;}
export class HUD{constructor(cv,radar){this.cv=cv;this.x=cv.getContext('2d');this.rc=radar;this.rx=radar.getContext('2d');this.map=mapImage();this.hitT=0;this.killT=0;this.pr=new V();this.w=0;this.h=0;}
 resize(){const d=Math.min(2,devicePixelRatio||1);const w=innerWidth,h=innerHeight;if(this.w!==w||this.h!==h||this.d!==d){this.w=w;this.h=h;this.d=d;this.cv.width=w*d;this.cv.height=h*d;}}
 proj(cam,p,out={}){const v=this.pr.copy(p).project(cam);const behind=(this.pq||(this.pq=new V())).copy(p).sub(cam.position).dot(cam.getWorldDirection(this.pd||(this.pd=new V())))<0;out.x=(v.x*.5+.5)*this.w;out.y=(-v.y*.5+.5)*this.h;out.b=behind;out.on=!behind&&v.x>-1&&v.x<1&&v.y>-1&&v.y<1;return out;}
 draw(S){this.resize();const x=this.x,w=this.w,h=this.h,cam=S.cam,pl=S.pl;x.setTransform(this.d,0,0,this.d,0,0);x.clearRect(0,0,w,h);if(!pl||S.hidden)return;
  x.lineCap='round';x.lineJoin='round';x.font='600 11px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';
  const shadow=()=>{x.shadowColor='rgba(0,0,0,.65)';x.shadowBlur=4;};shadow();
  const cx=w/2,cy=h/2,P={},Q={};
  // ---- world markers
  if(pl.alive){
   for(const t of S.sites){if(t.dead||t.p.distanceTo(pl.p)>9000)continue;this.proj(cam,t.markP||t.p,P);if(!P.on)continue;const s=7;x.strokeStyle=t.team===0?GREEN:ORANGE;x.lineWidth=1.6;x.beginPath();x.moveTo(P.x,P.y-s);x.lineTo(P.x+s,P.y);x.lineTo(P.x,P.y+s);x.lineTo(P.x-s,P.y);x.closePath();x.stroke();
    if(t.label){x.fillStyle=x.strokeStyle;x.fillText(t.label,P.x,P.y-s-9);}if(t.hpBar){x.fillStyle='rgba(0,0,0,.5)';x.fillRect(P.x-18,P.y+s+5,36,3);x.fillStyle=x.strokeStyle;x.fillRect(P.x-18,P.y+s+5,36*Math.max(0,t.hp/t.max),3);}}
   for(const o of S.planes){if(o===pl||!o.alive)continue;const d=o.p.distanceTo(pl.p);const hostile=S.hostile(pl,o);if(d>(hostile?7000:4000))continue;this.proj(cam,o.p,P);
    const col=hostile?(o.ace?'#ffcf3f':RED):BLUE;
    if(!P.on){if(hostile&&d<4500){let ax=P.x-cx,ay=P.y-cy;if(P.b){ax=-ax;ay=-ay;}const a=Math.atan2(ay,ax),R=Math.min(w,h)*.36;const px=cx+Math.cos(a)*R,py=cy+Math.sin(a)*R;x.save();x.translate(px,py);x.rotate(a);x.fillStyle=col;x.globalAlpha=.85;x.beginPath();x.moveTo(10,0);x.lineTo(-6,-7);x.lineTo(-6,7);x.closePath();x.fill();x.restore();}continue;}
    const sz=Math.max(11,Math.min(80,o.s.rad*1.2/d*h/(2*Math.tan(cam.fov*Math.PI/360))));
    if(hostile){x.strokeStyle=col;x.lineWidth=1.7;const s=sz,k=s*.45;x.beginPath();for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){x.moveTo(P.x+sx*s,P.y+sy*(s-k));x.lineTo(P.x+sx*s,P.y+sy*s);x.lineTo(P.x+sx*(s-k),P.y+sy*s);}x.stroke();
     if(o===S.target){x.lineWidth=1;x.strokeRect(P.x-s-3,P.y-s-3,2*s+6,2*s+6);}
     x.fillStyle=col;if(d<3000||o===S.target)x.fillText(d<1000?Math.round(d)+'m':(d/1000).toFixed(1)+'km',P.x,P.y+sz+10);if(o.ace||o.s.kind==='prop4'||o.s.kind==='wing')x.fillText(o.name,P.x,P.y-sz-9);
     if(o.s.hp>200||o.hpShow){x.fillStyle='rgba(0,0,0,.5)';x.fillRect(P.x-sz,P.y-sz-4,2*sz,3);x.fillStyle=col;x.fillRect(P.x-sz,P.y-sz-4,2*sz*Math.max(0,o.hp/o.maxHp),3);}}
    else{x.fillStyle=col;x.beginPath();x.moveTo(P.x,P.y-sz-4);x.lineTo(P.x-6,P.y-sz-13);x.lineTo(P.x+6,P.y-sz-13);x.closePath();x.fill();if(d<2500||o.s.kind==='prop4'){x.font='600 10px "JetBrains Mono",monospace';x.fillText(o.name,P.x,P.y-sz-22);x.font='600 11px "JetBrains Mono",monospace';}}}
   // lead pipper for the gun target
   if(S.target&&S.lead){this.proj(cam,S.lead,Q);this.proj(cam,S.target.p,P);if(Q.on&&P.on){x.strokeStyle='rgba(255,255,255,.35)';x.setLineDash([3,4]);x.lineWidth=1;x.beginPath();x.moveTo(P.x,P.y);x.lineTo(Q.x,Q.y);x.stroke();x.setLineDash([]);
     const inr=S.leadIn;x.strokeStyle=inr?'#ffe066':WHITE;x.lineWidth=2;x.beginPath();x.arc(Q.x,Q.y,inr?9:7,0,TAU);x.stroke();x.beginPath();x.arc(Q.x,Q.y,1.6,0,TAU);x.fillStyle=x.strokeStyle;x.fill();}}
   // missile seeker + lock
   if(S.seeker){this.proj(cam,S.seeker.center,P);if(P.on){x.strokeStyle=S.lockT>=1?RED:'rgba(255,255,255,.28)';x.lineWidth=1.2;x.setLineDash([6,6]);x.beginPath();x.arc(P.x,P.y,S.seeker.r,0,TAU);x.stroke();x.setLineDash([]);}
    if(S.lockTgt){this.proj(cam,S.lockTgt.p,Q);if(Q.on){const L=S.lockT>=1,s=L?22:30-S.lockT*8;x.save();x.translate(Q.x,Q.y);x.rotate(L?0:S.time*3);x.strokeStyle=L?RED:'#ffd166';x.lineWidth=L?2.4:1.6;x.beginPath();x.moveTo(0,-s);x.lineTo(s,0);x.lineTo(0,s);x.lineTo(-s,0);x.closePath();x.stroke();x.restore();
      x.fillStyle=L?RED:'#ffd166';x.font='700 11px "JetBrains Mono",monospace';x.fillText(L?'LOCK':'SEEK',Q.x,Q.y+s+12);}}}
   // bomb CCIP
   if(S.ccip){this.proj(cam,S.ccip,P);if(P.on){x.strokeStyle='#ffd166';x.lineWidth=1.8;x.beginPath();x.arc(P.x,P.y,10,0,TAU);x.moveTo(P.x-16,P.y);x.lineTo(P.x-10,P.y);x.moveTo(P.x+10,P.y);x.lineTo(P.x+16,P.y);x.stroke();x.fillStyle='#ffd166';x.fillText('BOMB',P.x,P.y+20);
     const gc=this.proj(cam,S.gunPt,{});if(gc.on){x.strokeStyle='rgba(255,209,102,.4)';x.setLineDash([2,5]);x.beginPath();x.moveTo(gc.x,gc.y);x.lineTo(P.x,P.y);x.stroke();x.setLineDash([]);}}}
   // incoming missiles
   for(const m of S.incoming){this.proj(cam,m.p,P);let ax=P.x-cx,ay=P.y-cy;if(P.b){ax=-ax;ay=-ay;}if(P.on&&!P.b){x.strokeStyle=RED;x.lineWidth=2;x.beginPath();x.arc(P.x,P.y,10,0,TAU);x.stroke();}else{const a=Math.atan2(ay,ax),R=Math.min(w,h)*.3;x.save();x.translate(cx+Math.cos(a)*R,cy+Math.sin(a)*R);x.rotate(a);x.fillStyle=RED;x.beginPath();x.moveTo(16,0);x.lineTo(-8,-10);x.lineTo(-3,0);x.lineTo(-8,10);x.closePath();x.fill();x.restore();}}
   // landing guide
   if(S.landing){this.proj(cam,S.landing.p,P);if(P.on){x.strokeStyle=S.landing.ok?GREEN:'#ffd166';x.lineWidth=1.6;x.strokeRect(P.x-26,P.y-10,52,20);x.fillStyle=x.strokeStyle;x.fillText('LAND',P.x,P.y-20);x.fillText(S.landing.msg,P.x,P.y+22);}}
   // gun cross (where the nose points) + aim reticle (where the mouse points)
   this.proj(cam,S.gunPt,P);if(P.on){x.strokeStyle=WHITE;x.lineWidth=1.8;x.beginPath();x.moveTo(P.x-13,P.y);x.lineTo(P.x-5,P.y);x.moveTo(P.x+5,P.y);x.lineTo(P.x+13,P.y);x.moveTo(P.x,P.y+5);x.lineTo(P.x,P.y+12);x.stroke();x.beginPath();x.arc(P.x,P.y,1.5,0,TAU);x.fillStyle=WHITE;x.fill();
    if(this.hitT>0){const k=this.hitT/.25,s=7+8*(1-k);x.strokeStyle=this.killT>0?RED:'rgba(255,255,255,'+k+')';x.lineWidth=this.killT>0?3:2;x.beginPath();for(const[a,b]of[[1,1],[-1,1],[1,-1],[-1,-1]]){x.moveTo(P.x+a*s,P.y+b*s);x.lineTo(P.x+a*(s+7),P.y+b*(s+7));}x.stroke();}}
   if(S.aimPt){this.proj(cam,S.aimPt,Q);if(Q.on){x.strokeStyle=ORANGE;x.lineWidth=2;x.beginPath();x.arc(Q.x,Q.y,11,0,TAU);x.stroke();x.beginPath();x.arc(Q.x,Q.y,2,0,TAU);x.fillStyle=ORANGE;x.fill();
     if(P.on&&Math.hypot(P.x-Q.x,P.y-Q.y)>26){x.strokeStyle='rgba(255,77,0,.35)';x.lineWidth=1;x.setLineDash([2,6]);x.beginPath();x.moveTo(P.x,P.y);x.lineTo(Q.x,Q.y);x.stroke();x.setLineDash([]);}}}}
  // ---- flight tapes
  const sp=Math.round(pl.sp*3.6),alt=Math.max(0,Math.round(pl.p.y)),ty=cy+46,TX=Math.min(300,w*.21);x.shadowBlur=0;
  const box=(bx,label,val,unit,warn,al)=>{x.fillStyle='rgba(6,8,12,.55)';x.fillRect(bx-48,ty-20,96,40);x.strokeStyle=warn?RED:'rgba(255,255,255,.18)';x.lineWidth=1;x.strokeRect(bx-48+.5,ty-20+.5,95,39);
   x.textAlign=al;x.fillStyle=DIM;x.font='600 9px "JetBrains Mono",monospace';x.fillText(label,al==='left'?bx-42:bx+42,ty-11);x.fillStyle=warn?RED:WHITE;x.font='400 22px Anton,Impact,sans-serif';x.fillText(val,al==='left'?bx-42:bx+42,ty+6);
   x.font='600 9px "JetBrains Mono",monospace';x.fillStyle=DIM;x.fillText(unit,al==='left'?bx+42-x.measureText(unit).width:bx-42+x.measureText(unit).width,ty-11);x.textAlign='center';};
  box(cx-TX,'SPD',sp,'KM/H',pl.stall>.2||pl.over,'left');box(cx+TX,'ALT',alt,'M',S.pullUp,'right');
  {const bx=cx-TX-48,by=ty+26;x.fillStyle='rgba(6,8,12,.55)';x.fillRect(bx,by,96,8);x.fillStyle=pl.ab?ORANGE:'rgba(255,255,255,.75)';x.fillRect(bx+1,by+1,94*pl.thr,6);
   x.fillStyle=DIM;x.font='600 9px "JetBrains Mono",monospace';x.textAlign='left';x.fillText(pl.ab?(pl.s.kind==='prop'?'WEP':'AFTERBURNER'):'THR '+Math.round(pl.thr*100)+'%',bx,by+18);
   x.textAlign='right';const g=pl.g;x.fillStyle=g>9||g<-2?RED:DIM;x.fillText(g.toFixed(1)+' G',cx+TX+48,by+4);x.fillStyle=DIM;x.fillText('VS '+(pl.v.y>=0?'+':'')+Math.round(pl.v.y)+' m/s',cx+TX+48,by+18);x.textAlign='center';}
  // compass strip
  {const hd=(Math.atan2(pl.v.x,-pl.v.z)*180/Math.PI+360)%360,yy=58,ww=Math.min(360,w*.5);x.save();x.beginPath();x.rect(cx-ww/2,yy-14,ww,30);x.clip();x.strokeStyle='rgba(255,255,255,.5)';x.fillStyle=WHITE;x.lineWidth=1;x.font='600 9px "JetBrains Mono",monospace';
   for(let a=Math.floor((hd-60)/5)*5;a<=hd+60;a+=5){const px=cx+(a-hd)*ww/120,an=(a+360)%360;x.beginPath();x.moveTo(px,yy);x.lineTo(px,yy+(an%15===0?7:3));x.stroke();if(an%30===0)x.fillText(an===0?'N':an===90?'E':an===180?'S':an===270?'W':String(an/10),px,yy+14);}
   x.restore();x.fillStyle=ORANGE;x.beginPath();x.moveTo(cx,yy-2);x.lineTo(cx-5,yy-9);x.lineTo(cx+5,yy-9);x.closePath();x.fill();}
  if(this.hitT>0)this.hitT-=S.dt;if(this.killT>0)this.killT-=S.dt;
  this.radar(S);}
 hit(kill){this.hitT=.25;if(kill)this.killT=.45;}
 radar(S){const x=this.rx,c=this.rc,d=Math.min(2,devicePixelRatio||1),W=170;if(c.width!==W*d){c.width=c.height=W*d;}x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,W,W);const pl=S.pl;if(!pl)return;
  const r=W/2-4,cx=W/2,cy=W/2,range=S.radarRange||6000,k=r/range,hd=Math.atan2(pl.v.x,-pl.v.z);
  x.save();x.beginPath();x.arc(cx,cy,r,0,TAU);x.fillStyle='rgba(6,10,16,.62)';x.fill();x.clip();
  x.translate(cx,cy);x.rotate(-hd);const ms=(2*WORLD*1.2)/HN;x.globalAlpha=.85;x.imageSmoothingEnabled=true;x.drawImage(this.map,(-WORLD*1.2-pl.p.x)*k,(-WORLD*1.2-pl.p.z)*k,HN*ms*k,HN*ms*k);x.globalAlpha=1;
  x.strokeStyle='rgba(255,255,255,.08)';x.lineWidth=1;for(const rr of[.33,.66]){x.beginPath();x.arc(0,0,r*rr,0,TAU);x.stroke();}
  // combat boundary
  x.strokeStyle='rgba(255,77,0,.4)';x.setLineDash([4,4]);x.strokeRect((-WORLD-pl.p.x)*k,(-WORLD-pl.p.z)*k,2*WORLD*k,2*WORLD*k);x.setLineDash([]);
  const dot=(p,col,s,shape,ang)=>{const px=(p.x-pl.p.x)*k,py=(p.z-pl.p.z)*k;const dd=Math.hypot(px,py);let qx=px,qy=py;if(dd>r-4){qx=px/dd*(r-4);qy=py/dd*(r-4);}x.fillStyle=col;
   if(shape==='tri'){x.save();x.translate(qx,qy);x.rotate(ang);x.beginPath();x.moveTo(0,-s-1.5);x.lineTo(s*.8,s);x.lineTo(-s*.8,s);x.closePath();x.fill();x.restore();}else if(shape==='sq'){x.fillRect(qx-s,qy-s,2*s,2*s);}else{x.beginPath();x.arc(qx,qy,s,0,TAU);x.fill();}};
  for(const t of S.sites)if(!t.dead)dot(t.p,t.team===0?GREEN:ORANGE,t.big?5:3,'sq');
  if(S.carrier){dot(S.carrier.p,GREEN,4,'sq');}
  for(const m of S.missiles)dot(m.p,m.target===pl?RED:'rgba(255,255,255,.8)',1.5);
  for(const o of S.planes){if(o===pl||!o.alive)continue;dot(o.p,S.hostile(pl,o)?(o.ace?'#ffcf3f':RED):BLUE,o.s.rad>15?4.5:3.2,'tri',Math.atan2(o.v.x,-o.v.z));}
  x.restore();x.save();x.translate(cx,cy);x.fillStyle=ORANGE;x.beginPath();x.moveTo(0,-7);x.lineTo(5,5);x.lineTo(0,2);x.lineTo(-5,5);x.closePath();x.fill();
  x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=1.5;x.beginPath();x.arc(0,0,r,0,TAU);x.stroke();
  x.fillStyle=WHITE;x.font='700 10px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText('N',Math.sin(-hd)*(r-9),-Math.cos(-hd)*(r-9));x.restore();
  x.fillStyle=DIM;x.font='600 9px "JetBrains Mono",monospace';x.textAlign='right';x.fillText((range/1000)+' KM',W-6,W-6);}}
