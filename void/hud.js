// VOIDWING — canvas HUD: reticle with heat/boost arcs, target brackets + lead pip, subsystem markers, lock-on, power console, radar.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,TAU} from './util.js';
import {TEAMS} from './ships.js';
const WHITE='rgba(235,245,255,.92)',DIM='rgba(235,245,255,.45)',ORANGE='#ff8a3d',RED='#ff4a3d',BLUE='#4db8ff',CYAN='#6fe3ff',GOLD='#ffcf3f',GREEN='#6dff9e';
const _iq=new THREE.Quaternion(),_l=new V(),_p=new V();
export class HUD{constructor(cv,radar){this.cv=cv;this.x=cv.getContext('2d');this.rc=radar;this.rx=radar.getContext('2d');this.hitT=0;this.killT=0;this.pr=new V();this.w=0;this.h=0;this.pd=new V();this.pq=new V();}
 resize(){const d=Math.min(2,devicePixelRatio||1),w=innerWidth,h=innerHeight;if(this.w!==w||this.h!==h||this.d!==d){this.w=w;this.h=h;this.d=d;this.cv.width=w*d;this.cv.height=h*d;}}
 proj(cam,p,out={}){const v=this.pr.copy(p).project(cam);const behind=this.pq.copy(p).sub(cam.position).dot(cam.getWorldDirection(this.pd))<0;out.x=(v.x*.5+.5)*this.w;out.y=(-v.y*.5+.5)*this.h;out.b=behind;out.on=!behind&&v.x>-1&&v.x<1&&v.y>-1&&v.y<1;return out;}
 edgeArrow(P,col,R,size=10,label){const x=this.x,cx=this.w/2,cy=this.h/2;let ax=P.x-cx,ay=P.y-cy;if(P.b){ax=-ax;ay=-ay;}const a=Math.atan2(ay,ax);x.save();x.translate(cx+Math.cos(a)*R,cy+Math.sin(a)*R);x.rotate(a);x.fillStyle=col;x.beginPath();x.moveTo(size,0);x.lineTo(-size*.6,-size*.7);x.lineTo(-size*.2,0);x.lineTo(-size*.6,size*.7);x.closePath();x.fill();x.restore();
  if(label){x.fillStyle=col;x.fillText(label,cx+Math.cos(a)*(R-22),cy+Math.sin(a)*(R-22));}}
 bars(px,py,w,sh,hu,col){const x=this.x;x.fillStyle='rgba(0,0,0,.55)';x.fillRect(px-w/2,py,w,7);x.fillStyle=CYAN;x.fillRect(px-w/2,py,w*cl(sh,0,1),3);x.fillStyle=col;x.fillRect(px-w/2,py+4,w*cl(hu,0,1),3);}
 draw(S){this.resize();const x=this.x,w=this.w,h=this.h,cam=S.cam,pl=S.pl;x.setTransform(this.d,0,0,this.d,0,0);x.clearRect(0,0,w,h);if(!pl||S.hidden){this.radar(null);return;}
  x.lineCap='round';x.lineJoin='round';x.font='600 11px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.shadowColor='rgba(0,0,0,.7)';x.shadowBlur=4;
  const cx=w/2,cy=h/2,P={},Q={},R0=Math.min(w,h)*.42;
  if(pl.alive){
   // ---- capital ships
   for(const cp of S.caps){if(cp.dead)continue;const hos=cp.team!==pl.team,col=hos?RED:BLUE;this.proj(cam,cp.p,P);const d=cp.p.distanceTo(pl.p);
    if(P.on){x.strokeStyle=col;x.lineWidth=1.5;const s=14;x.beginPath();x.moveTo(P.x,P.y-s);x.lineTo(P.x+s,P.y);x.lineTo(P.x,P.y+s);x.lineTo(P.x-s,P.y);x.closePath();x.stroke();
     x.fillStyle=col;x.fillText(cp.name+' · '+(d/1000).toFixed(1)+'KM',P.x,P.y-s-12);this.bars(P.x,P.y+s+6,70,cp.locked?1:cp.shield/cp.maxShield*(cp.shieldUp()?1:0),cp.hull/cp.maxHull,col);
     if(cp.locked){x.fillStyle=GOLD;x.font='700 9px "JetBrains Mono",monospace';x.fillText('SHIELD LINKED',P.x,P.y+s+22);x.font='600 11px "JetBrains Mono",monospace';}}
    else if(hos&&S.target===cp)this.edgeArrow(P,col,R0,11);
    // subsystem markers when this capital (or one of its parts) is targeted, or close by
    const showSubs=hos&&(S.target===cp||S.target&&S.target.cap===cp||d<1500);if(showSubs&&!cp.shieldUp()||showSubs&&S.target&&S.target.cap===cp){for(const s of cp.subs){if(s.dead)continue;s.wp(_p);this.proj(cam,_p,Q);if(!Q.on)continue;const sel=S.target===s,sz=sel?11:6;
     x.strokeStyle=sel?GOLD:s.kind==='turret'?'rgba(255,120,100,.6)':ORANGE;x.lineWidth=sel?2:1.3;x.strokeRect(Q.x-sz,Q.y-sz,sz*2,sz*2);
     if(sel||s.kind!=='turret'){x.fillStyle=x.strokeStyle;x.font='600 9px "JetBrains Mono",monospace';x.fillText(s.label,Q.x,Q.y-sz-8);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(Q.x-sz,Q.y+sz+3,sz*2,3);x.fillStyle=x.strokeStyle;x.fillRect(Q.x-sz,Q.y+sz+3,sz*2*s.hp/s.max,3);x.font='600 11px "JetBrains Mono",monospace';}}}}
   // ---- fighters
   for(const o of S.ships){if(o===pl||!o.alive)continue;const hos=o.team!==pl.team,d=o.p.distanceTo(pl.p);if(d>(hos?4500:3000))continue;this.proj(cam,o.p,P);const col=hos?RED:BLUE,sel=o===S.target;
    if(!P.on){if(sel)this.edgeArrow(P,GOLD,R0,12);else if(hos&&d<1200)this.edgeArrow(P,'rgba(255,74,61,.7)',R0,7);continue;}
    const sz=cl(o.c.rad*1.4/d*h/(2*Math.tan(cam.fov*Math.PI/360)),8,60);
    if(hos){x.strokeStyle=sel?GOLD:col;x.lineWidth=sel?2.2:1.5;const s=sz,k=s*.45;x.beginPath();for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){x.moveTo(P.x+sx*s,P.y+sy*(s-k));x.lineTo(P.x+sx*s,P.y+sy*s);x.lineTo(P.x+sx*(s-k),P.y+sy*s);}x.stroke();
     if(sel||d<900){x.fillStyle=x.strokeStyle;x.font='600 9px "JetBrains Mono",monospace';x.fillText((sel?o.name+' · ':'')+(d<1000?Math.round(d)+'M':(d/1000).toFixed(1)+'KM'),P.x,P.y+sz+10);x.font='600 11px "JetBrains Mono",monospace';}
     if(sel)this.bars(P.x,P.y-sz-11,Math.max(36,sz*2),o.shield/o.shieldMax(),o.hull/o.maxHull,RED);}
    else{x.fillStyle=col;x.beginPath();x.moveTo(P.x,P.y-sz-3);x.lineTo(P.x-5,P.y-sz-11);x.lineTo(P.x+5,P.y-sz-11);x.closePath();x.fill();if(d<1500){x.font='600 9px "JetBrains Mono",monospace';x.fillText(o.name,P.x,P.y-sz-19);x.font='600 11px "JetBrains Mono",monospace';}}}
   // ---- lead pip for the selected target
   if(S.lead&&S.target){this.proj(cam,S.lead,Q);if(Q.on){x.strokeStyle=S.leadIn?GOLD:WHITE;x.lineWidth=1.8;x.beginPath();x.moveTo(Q.x,Q.y-8);x.lineTo(Q.x+8,Q.y);x.lineTo(Q.x,Q.y+8);x.lineTo(Q.x-8,Q.y);x.closePath();x.stroke();x.beginPath();x.arc(Q.x,Q.y,1.6,0,TAU);x.fillStyle=x.strokeStyle;x.fill();}}
   // ---- lock-on
   if(S.lockTgt){const tp=S.lockTgt.wp?S.lockTgt.wp(_p):S.lockTgt.p;this.proj(cam,tp,Q);if(Q.on){const L=S.lockT>=1,s=L?20:34-S.lockT*14;x.save();x.translate(Q.x,Q.y);x.rotate(L?Math.PI/4:S.time*4);x.strokeStyle=L?RED:GOLD;x.lineWidth=L?2.6:1.6;x.strokeRect(-s,-s,2*s,2*s);x.restore();
     x.fillStyle=L?RED:GOLD;x.font='700 10px "JetBrains Mono",monospace';x.fillText(L?'LOCKED':'LOCKING '+Math.round(S.lockT*100)+'%',Q.x,Q.y+s+16);x.font='600 11px "JetBrains Mono",monospace';}}
   // ---- incoming missiles
   for(const m of S.incoming){this.proj(cam,m.p,P);if(P.on){x.strokeStyle=RED;x.lineWidth=2;x.beginPath();x.arc(P.x,P.y,10,0,TAU);x.stroke();}else this.edgeArrow(P,RED,R0*.7,15);}
   // ---- reticle with heat (left) and boost (right) arcs
   const g=S.reticle||{x:cx,y:cy};const rx=g.x,ry=g.y,RR=44;x.shadowBlur=0;
   x.lineWidth=4;x.strokeStyle='rgba(255,255,255,.12)';x.beginPath();x.arc(rx,ry,RR,Math.PI*.7,Math.PI*1.3);x.stroke();x.beginPath();x.arc(rx,ry,RR,-Math.PI*.3,Math.PI*.3);x.stroke();
   const heat=pl.heat;x.strokeStyle=pl.overheat?(Math.floor(S.time*8)%2?RED:'#7a1a10'):heat>.75?RED:heat>.45?ORANGE:WHITE;x.beginPath();x.arc(rx,ry,RR,Math.PI*1.3,Math.PI*1.3-Math.PI*.6*cl(heat,0,1),true);x.stroke();
   const be=pl.boostE/pl.c.boostCap;x.strokeStyle=pl.boosting?CYAN:be<.15?'rgba(111,227,255,.4)':'rgba(111,227,255,.85)';x.beginPath();x.arc(rx,ry,RR,Math.PI*.3,Math.PI*.3-Math.PI*.6*be,true);x.stroke();
   x.fillStyle=DIM;x.font='600 8px "JetBrains Mono",monospace';x.fillText(pl.overheat?'OVERHEAT':'LASER',rx-RR-24,ry);x.fillText(pl.drifting?'DRIFT':'BOOST',rx+RR+22,ry);
   x.strokeStyle=WHITE;x.lineWidth=1.8;x.beginPath();x.arc(rx,ry,9,0,TAU);x.moveTo(rx-20,ry);x.lineTo(rx-12,ry);x.moveTo(rx+12,ry);x.lineTo(rx+20,ry);x.moveTo(rx,ry+12);x.lineTo(rx,ry+18);x.stroke();x.beginPath();x.arc(rx,ry,1.4,0,TAU);x.fillStyle=WHITE;x.fill();
   if(this.hitT>0){const k=this.hitT/.25,s=10+8*(1-k);x.strokeStyle=this.killT>0?RED:'rgba(255,255,255,'+k+')';x.lineWidth=this.killT>0?3:2;x.beginPath();for(const[a,b]of[[1,1],[-1,1],[1,-1],[-1,-1]]){x.moveTo(rx+a*s,ry+b*s);x.lineTo(rx+a*(s+7),ry+b*(s+7));}x.stroke();}
   // secondary readout under the reticle
   x.font='700 9px "JetBrains Mono",monospace';x.fillStyle=pl.secN?(S.lockT>=1?RED:WHITE):DIM;x.fillText(pl.c.sec.name+' ×'+pl.secN,rx,ry+RR+12);
   // virtual-stick cursor
   if(S.stick&&(Math.abs(S.stick.x)+Math.abs(S.stick.y)>.03)){const sx=cx+S.stick.x*RR*2.4,sy=cy+S.stick.y*RR*2.4;x.strokeStyle='rgba(111,227,255,.5)';x.lineWidth=1;x.setLineDash([2,4]);x.beginPath();x.moveTo(cx,cy);x.lineTo(sx,sy);x.stroke();x.setLineDash([]);x.fillStyle=CYAN;x.beginPath();x.arc(sx,sy,3.2,0,TAU);x.fill();}
   this.console(S);}
  if(this.hitT>0)this.hitT-=S.dt;if(this.killT>0)this.killT-=S.dt;this.radar(S);}
 // bottom-centre flight console: power pips, shield/hull, speed + throttle, countermeasures
 console(S){const x=this.x,pl=S.pl,w=this.w,h=this.h,cx=w/2,by=h-104,W=Math.min(460,w*.5);x.shadowBlur=0;
  x.fillStyle='rgba(6,10,16,.6)';x.beginPath();x.roundRect(cx-W/2,by,W,86,12);x.fill();x.strokeStyle='rgba(255,255,255,.1)';x.lineWidth=1;x.stroke();
  // power pips
  const sys=[['ENG','eng',ORANGE],['WPN','wpn',RED],['SHD','shd',CYAN]];sys.forEach(([lab,k,col],i)=>{const px=cx-W/2+18+i*36,n=pl.pips[k];for(let j=0;j<4;j++){x.fillStyle=j<n?col:'rgba(255,255,255,.1)';x.fillRect(px,by+62-j*12,24,9);}x.fillStyle=DIM;x.font='600 8px "JetBrains Mono",monospace';x.textAlign='center';x.fillText(lab,px+12,by+78);x.fillStyle=WHITE;x.fillText(String(i+1),px+12,by+9);});
  // shield + hull
  const sx=cx-W/2+132,bw=W-132-118;x.textAlign='left';x.font='600 8px "JetBrains Mono",monospace';x.fillStyle=DIM;x.fillText('SHIELD',sx,by+14);x.fillText('HULL',sx,by+40);
  const sm=pl.shieldMax(),sh=pl.shield/sm;x.fillStyle='rgba(255,255,255,.08)';x.fillRect(sx,by+20,bw,9);x.fillRect(sx,by+46,bw,9);x.fillStyle=CYAN;x.fillRect(sx,by+20,bw*cl(sh,0,1),9);
  const hk=pl.hull/pl.maxHull;x.fillStyle=hk>.5?WHITE:hk>.25?ORANGE:RED;x.fillRect(sx,by+46,bw*cl(hk,0,1),9);x.fillStyle=WHITE;x.textAlign='right';x.fillText(Math.round(pl.shield)+'',sx+bw,by+14);x.fillText(Math.round(pl.hull)+'',sx+bw,by+40);
  // countermeasures
  x.textAlign='left';x.fillStyle=DIM;x.fillText('COUNTERMEASURES',sx,by+70);for(let i=0;i<pl.c.cm;i++){x.fillStyle=i<pl.cmN?GOLD:'rgba(255,255,255,.12)';x.beginPath();x.arc(sx+96+i*13,by+67,4,0,TAU);x.fill();}
  // speed + throttle with the agility sweet spot
  const tx=cx+W/2-104;x.fillStyle=DIM;x.textAlign='left';x.fillText('SPEED',tx,by+14);x.font='400 26px Anton,Impact,sans-serif';x.fillStyle=pl.boosting?CYAN:WHITE;x.fillText(Math.round(pl.sp),tx,by+38);
  x.font='600 8px "JetBrains Mono",monospace';x.fillStyle=DIM;x.fillText('M/S',tx+52,by+40);
  const th=pl.thr;x.fillStyle='rgba(255,255,255,.08)';x.fillRect(tx,by+54,88,8);x.fillStyle='rgba(109,255,158,.25)';x.fillRect(tx+88*.45,by+54,88*.3,8);x.fillStyle=pl.boosting?CYAN:WHITE;x.fillRect(tx,by+54,88*th,8);
  x.fillStyle=DIM;x.fillText(pl.boosting?(pl.drifting?'DRIFTING':'BOOSTING'):'THROTTLE '+Math.round(th*100)+'%',tx,by+74);x.textAlign='center';}
 hit(kill){this.hitT=.25;if(kill)this.killT=.45;}
 // ship-relative radar: forward is up, elevation as stalks
 radar(S){const x=this.rx,c=this.rc,d=Math.min(2,devicePixelRatio||1),W=180;if(c.width!==W*d){c.width=c.height=W*d;}x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,W,W);if(!S||!S.pl)return;const pl=S.pl;
  const r=W/2-6,cx=W/2,cy=W/2,range=S.radarRange||3000,k=r/range;_iq.copy(pl.q).invert();
  x.save();x.translate(cx,cy);x.scale(1,.62);x.beginPath();x.arc(0,0,r,0,TAU);x.fillStyle='rgba(6,10,16,.6)';x.fill();x.strokeStyle='rgba(111,227,255,.25)';x.lineWidth=1.5;x.stroke();
  x.strokeStyle='rgba(255,255,255,.08)';for(const rr of[.33,.66]){x.beginPath();x.arc(0,0,r*rr,0,TAU);x.stroke();}x.beginPath();x.moveTo(-r,0);x.lineTo(r,0);x.moveTo(0,-r);x.lineTo(0,r);x.stroke();x.restore();
  const dot=(wp,col,s,sq)=>{_l.subVectors(wp,pl.p).applyQuaternion(_iq);let px=_l.x*k,pz=_l.z*k;const dd=Math.hypot(px,pz);if(dd>r-3){px*=(r-3)/dd;pz*=(r-3)/dd;}const el=cl(_l.y*k,-r*.6,r*.6);const X=cx+px,Y=cy+pz*.62;
   x.strokeStyle=col;x.globalAlpha=.55;x.lineWidth=1;x.beginPath();x.moveTo(X,Y);x.lineTo(X,Y-el*.62);x.stroke();x.globalAlpha=1;x.fillStyle=col;if(sq)x.fillRect(X-s,Y-el*.62-s,2*s,2*s);else{x.beginPath();x.arc(X,Y-el*.62,s,0,TAU);x.fill();}};
  for(const cp of S.caps)if(!cp.dead)dot(cp.p,cp.team===pl.team?BLUE:RED,5,true);
  for(const m of S.missiles)dot(m.p,m.target===pl?RED:'rgba(255,255,255,.7)',1.4);
  for(const o of S.ships){if(o===pl||!o.alive)continue;dot(o.p,o===S.target?GOLD:o.team===pl.team?BLUE:RED,o.cls==='bomber'?3.4:2.6);}
  x.fillStyle=WHITE;x.beginPath();x.moveTo(cx,cy-6);x.lineTo(cx+4,cy+4);x.lineTo(cx-4,cy+4);x.closePath();x.fill();
  x.fillStyle=DIM;x.font='600 9px "JetBrains Mono",monospace';x.textAlign='right';x.textBaseline='alphabetic';x.fillText((range/1000)+' KM',W-6,W-8);}}

// in-cockpit status screen (canvas texture on the dashboard)
export function drawScreen(sc,pl,team,tgt){const x=sc.x,W=512,H=192;x.fillStyle='#03070c';x.fillRect(0,0,W,H);const col=TEAMS[team].col;x.strokeStyle=col;x.globalAlpha=.4;x.lineWidth=2;x.strokeRect(4,4,W-8,H-8);x.globalAlpha=1;
 x.font='700 22px "JetBrains Mono",monospace';x.fillStyle=col;x.textBaseline='top';x.fillText(pl.c.names[team]+' · '+pl.c.role,18,14);
 const bar=(y,lab,v,c)=>{x.fillStyle='rgba(255,255,255,.4)';x.font='600 16px "JetBrains Mono",monospace';x.fillText(lab,18,y);x.fillStyle='rgba(255,255,255,.1)';x.fillRect(110,y+2,240,14);x.fillStyle=c;x.fillRect(110,y+2,240*cl(v,0,1),14);};
 bar(56,'SHIELD',pl.shield/pl.shieldMax(),'#6fe3ff');bar(82,'HULL',pl.hull/pl.maxHull,pl.hull/pl.maxHull>.3?'#e8f0ff':'#ff4a3d');bar(108,'LASER',1-pl.heat,pl.overheat?'#ff4a3d':'#ffcf3f');bar(134,'BOOST',pl.boostE/pl.c.boostCap,'#6fe3ff');
 x.fillStyle='rgba(255,255,255,.55)';x.font='600 16px "JetBrains Mono",monospace';x.fillText('TGT',372,56);x.fillStyle='#ffcf3f';x.font='700 18px "JetBrains Mono",monospace';x.fillText(tgt?(tgt.label||tgt.name||'').slice(0,10):'—',372,78);
 x.fillStyle='rgba(255,255,255,.55)';x.font='600 16px "JetBrains Mono",monospace';x.fillText('E'+pl.pips.eng+' W'+pl.pips.wpn+' S'+pl.pips.shd,372,112);x.fillText('CM '+pl.cmN+' · '+pl.secN,372,136);sc.tex.needsUpdate=true;}
