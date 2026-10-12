// LONG SHOT — HUD: DOM panels + a 2D overlay canvas for the scope (first-focal-plane mil-dot reticle, BDC chevron,
// rangefinder, breath arc, lens parallax), spotter binoculars (trait read-out, tagging), world markers and hit markers.
import * as THREE from '../vendor/three.module.min.js';
const $=id=>document.getElementById(id);
const _v=new THREE.Vector3();
export const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
export class HUD{
 constructor(){this.ov=$('ov');this.x=this.ov.getContext('2d');this.wc=$('windc').getContext('2d');this.c={};this.banT=0;this.toasts=[];this.resize();addEventListener('resize',()=>this.resize());}
 resize(){const d=Math.min(devicePixelRatio,2);this.dpr=d;this.ov.width=innerWidth*d;this.ov.height=innerHeight*d;}
 set(id,v){if(this.c[id]!==v){this.c[id]=v;$(id).textContent=v;}}
 html(id,v){if(this.c['h'+id]!==v){this.c['h'+id]=v;$(id).innerHTML=v;}}
 banner(t,s,col='#fff',dur=2.4){$('bt').textContent=t;$('bt').style.color=col;$('bs').textContent=s||'';$('bs').style.display=s?'':'none';$('banner').classList.add('on');this.banT=dur;}
 toast(h,cls='',dur=3.2){const d=document.createElement('div');d.innerHTML=h;if(cls)d.className=cls;$('toast').prepend(d);setTimeout(()=>d.remove(),dur*1000);while($('toast').children.length>4)$('toast').lastChild.remove();}
 clearToasts(){$('toast').innerHTML='';$('banner').classList.remove('on');this.banT=0;}
 objectives(list){this.html('objs',list.map(o=>o.h?`<h5>${o.h}</h5>`:`<div class="${o.state}${o.pri?' pri':''}"><i></i><span>${o.n}</span></div>`).join(''));}
 update(G,dt){if(this.banT>0){this.banT-=dt;if(this.banT<=0)$('banner').classList.remove('on');}
  this.set('clock',fmt(G.clock));$('clock').classList.toggle('low',G.clock<=30&&G.clock>0);this.set('clab',G.departing?'TARGET IS LEAVING':'TARGET DEPARTS IN');this.set('mname',G.M.n);
  const s=Math.min(100,G.susp);$('sbar').style.width=s+'%';this.set('sstate',G.alarm?'ALARM RAISED':s>65?'SEARCHING':s>30?'SUSPICIOUS':s>2?'UNEASY':'UNDETECTED');$('sus').classList.toggle('alarm',G.alarm);
  $('exw').hidden=!G.alarm;$('exl').hidden=!G.alarm||G.expo<5;$('ebar').style.width=Math.min(100,G.expo)+'%';$('redv').style.opacity=Math.min(.85,G.expo/100*.9+(G.flashRed||0));
  this.set('rname',G.rifle.n);const am=G.ammo,mag=G.rifle.mag;const k=am+'|'+G.reserve+'|'+(G.reloadT>0);if(this.c.ammo!==k){this.c.ammo=k;$('ammo').innerHTML=(G.reloadT>0?'<span>RELOADING</span>':'')+Array.from({length:mag},(_,i)=>`<i class="${i<am?'':'e'}"></i>`).join('')+`<b>${G.reserve}</b>`;}
  this.set('zero','ZERO '+G.zero+' M');this.set('zoomr',(G.binos?G.bzoom:G.scoped>.5?G.zoom:1).toFixed(1)+'×'+(G.binos?' BINO':''));this.set('perchn',G.perches[G.perch].n+' · '+(G.perch+1)+'/'+G.perches.length);
  this.set('hint',G.hint||'');this.wind(G);}
 wind(G){const x=this.wc,w=128,c=w/2;x.clearRect(0,0,w,w);x.fillStyle='rgba(8,10,14,.74)';x.beginPath();x.arc(c,c,c-2,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=1;x.beginPath();x.arc(c,c,c-12,0,7);x.stroke();
  for(let i=0;i<12;i++){const a=i/12*6.283;x.beginPath();x.moveTo(c+Math.sin(a)*(c-12),c-Math.cos(a)*(c-12));x.lineTo(c+Math.sin(a)*(c-(i%3?16:20)),c-Math.cos(a)*(c-(i%3?16:20)));x.stroke();}
  // wind relative to view: up = where you are looking
  const wv=G.wind,sp=Math.hypot(wv.x,wv.z);const fx=-Math.sin(G.yaw),fz=-Math.cos(G.yaw),rx=Math.cos(G.yaw),rz=-Math.sin(G.yaw);const along=wv.x*fx+wv.z*fz,cross=wv.x*rx+wv.z*rz;const a=Math.atan2(cross,along);
  const L=12+Math.min(1,sp/10)*30;x.save();x.translate(c,c);x.rotate(a);x.strokeStyle=x.fillStyle=sp>7?'#ff6a3a':sp>4?'#ffd040':'#9ef0ff';x.lineWidth=3;x.beginPath();x.moveTo(0,L);x.lineTo(0,-L);x.stroke();x.beginPath();x.moveTo(0,-L-8);x.lineTo(-7,-L+4);x.lineTo(7,-L+4);x.closePath();x.fill();x.restore();
  x.fillStyle='#fff';x.textAlign='center';x.font='700 10px "JetBrains Mono",monospace';x.fillText('WIND',c,22);
  if(G.diff<2){x.font='400 20px Anton,Impact,sans-serif';x.fillStyle='rgba(8,10,14,.85)';x.fillRect(c-22,c+16,44,22);x.fillStyle='#fff';x.fillText(sp.toFixed(1),c,c+34);x.font='700 8px "JetBrains Mono",monospace';x.fillStyle='#aab';x.fillText('M/S · '+(cross>=0?'→':'←')+' '+Math.abs(cross).toFixed(1),c,w-8);}
  x.fillStyle='#ffb38a';x.beginPath();x.moveTo(c,8);x.lineTo(c-5,15);x.lineTo(c+5,15);x.fill();}
 // ---------------- overlay ----------------
 project(cam,p,W,H){_v.copy(p).project(cam);if(_v.z>1)return null;return{x:(_v.x*.5+.5)*W,y:(-_v.y*.5+.5)*H,z:_v.z};}
 draw(G,cam){const x=this.x,d=this.dpr,W=this.ov.width,H=this.ov.height;x.clearRect(0,0,W,H);if(G.app!=='play'&&G.app!=='paused'&&G.app!=='brief')return;if(G.phase==='bulletcam'||G.phase==='relocate')return;
  const fovR=cam.fov*Math.PI/180,ppm=(H/2)/Math.tan(fovR/2)*.001;const night=G.M.env.night;
  if(G.binos){this.binosMask(W,H);this.markers(G,cam,W,H,d);this.binos(G,cam,W,H,d,ppm);}
  else if(G.scoped>.02){this.scope(G,cam,W,H,d,ppm,night);this.markers(G,cam,W,H,d);}
  else{this.markers(G,cam,W,H,d);x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=1.5*d;const cx=W/2,cy=H/2;x.beginPath();x.arc(cx,cy,3*d,0,7);x.stroke();for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){x.beginPath();x.moveTo(cx+a*8*d,cy+b*8*d);x.lineTo(cx+a*15*d,cy+b*15*d);x.stroke();}
   if(G.range&&G.diff<2){x.font=`700 ${11*d}px "JetBrains Mono",monospace`;x.fillStyle='rgba(255,255,255,.85)';x.textAlign='center';x.fillText(Math.round(G.range)+' M',cx,cy+32*d);}}
  if(G.hitFx&&G.hitFx.t>0){const a=Math.min(1,G.hitFx.t/.15),cx=W/2,cy=H/2,s=(10+(1-a)*6)*d;x.strokeStyle=G.hitFx.kill?`rgba(255,70,40,${a})`:`rgba(255,255,255,${a})`;x.lineWidth=2.5*d;
   for(const[i,j]of[[1,1],[1,-1],[-1,1],[-1,-1]]){x.beginPath();x.moveTo(cx+i*s*.45,cy+j*s*.45);x.lineTo(cx+i*s*1.3,cy+j*s*1.3);x.stroke();}}}
 markers(G,cam,W,H,d){const x=this.x;const inScope=G.scoped>.5&&!G.binos;const R=Math.min(W,H)*.47;
  for(const p of G.L.people){if(!p.tag||p.gone)continue;const pos=p.rig.rag?p.rig.rag.pts[6].clone().add(_v.set(0,.6,0)):_v.set(p.pos.x,p.pos.y+2.15,p.pos.z).clone();const s=this.project(cam,pos,W,H);if(!s)continue;
   if(inScope&&Math.hypot(s.x-W/2,s.y-H/2)>R)continue;const dead=!p.alive;const col=dead?'rgba(160,160,160,.8)':p.isTarget&&G.diff===0?'#ff3a3a':'#ff8a2a';
   x.fillStyle=col;x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=1*d;x.beginPath();x.moveTo(s.x,s.y);x.lineTo(s.x-6*d,s.y-10*d);x.lineTo(s.x+6*d,s.y-10*d);x.closePath();x.fill();x.stroke();
   let lab=dead?'✕':G.diff===0?(p.isTarget?'TARGET':p.hostile?'HOSTILE':'CIVILIAN'):G.diff===1&&p.role==='guard'?'GUARD':'';if(p.tagN)lab=(lab?lab+' ':'')+p.tagN;
   if(lab){x.font=`700 ${9*d}px "JetBrains Mono",monospace`;x.textAlign='center';x.fillStyle='rgba(0,0,0,.6)';const tw=x.measureText(lab).width;x.fillRect(s.x-tw/2-4*d,s.y-24*d,tw+8*d,12*d);x.fillStyle=col;x.fillText(lab,s.x,s.y-15*d);}}
  if(G.binos){for(const o of G.pois){if(o.done&&o.done())continue;const s=this.project(cam,o.p,W,H);if(!s)continue;x.strokeStyle='#ffd040';x.lineWidth=1.5*d;x.beginPath();x.moveTo(s.x,s.y-8*d);x.lineTo(s.x+7*d,s.y);x.lineTo(s.x,s.y+8*d);x.lineTo(s.x-7*d,s.y);x.closePath();x.stroke();
   x.font=`700 ${9*d}px "JetBrains Mono",monospace`;x.fillStyle='#ffd040';x.textAlign='left';x.fillText(o.n,s.x+11*d,s.y+3*d);}}}
 scope(G,cam,W,H,d,ppm,night){const x=this.x;const k=G.scoped;const R=Math.min(W,H)*.47*(.55+.45*k);const cx=W/2+G.par.x*d,cy=H/2+G.par.y*d;
  // reticle
  const ink=night?'rgba(255,40,30,.95)':'rgba(5,6,8,.95)';x.save();x.beginPath();x.arc(cx,cy,R,0,7);x.clip();
  const rc=W/2,rcy=H/2;x.strokeStyle=ink;x.fillStyle=ink;x.lineWidth=1.2*d;x.beginPath();x.moveTo(rc-R*1.2,rcy);x.lineTo(rc+R*1.2,rcy);x.moveTo(rc,rcy-R*1.2);x.lineTo(rc,rcy+R*1.2);x.stroke();
  const post=Math.max(R*.42,Math.min(R*.7,ppm*10.5));x.lineWidth=5*d;x.beginPath();x.moveTo(rc-R*1.2,rcy);x.lineTo(rc-post,rcy);x.moveTo(rc+post,rcy);x.lineTo(rc+R*1.2,rcy);x.moveTo(rc,rcy+post);x.lineTo(rc,rcy+R*1.2);x.moveTo(rc,rcy-post);x.lineTo(rc,rcy-R*1.2);x.stroke();
  const fine=G.scope.id!=='field';x.font=`700 ${Math.max(8,Math.min(11,ppm*.35))*d}px "JetBrains Mono",monospace`;x.textAlign='center';
  for(let i=-10;i<=10;i++){if(!i)continue;const o=i*ppm;if(Math.abs(o)>post-2)continue;const r=Math.max(1.6*d,Math.min(4*d,ppm*.075));x.beginPath();x.arc(rc+o,rcy,r,0,7);x.fill();x.beginPath();x.arc(rc,rcy+o,r,0,7);x.fill();
   if(fine&&Math.abs(o+ppm/2*Math.sign(-i))<post){x.lineWidth=1*d;x.beginPath();x.moveTo(rc+o-ppm/2*Math.sign(i),rcy-4*d);x.lineTo(rc+o-ppm/2*Math.sign(i),rcy+4*d);x.moveTo(rc-4*d,rcy+o-ppm/2*Math.sign(i));x.lineTo(rc+4*d,rcy+o-ppm/2*Math.sign(i));x.stroke();}
   if(i%5===0&&ppm>14){x.fillText(Math.abs(i),rc+o,rcy-10*d);x.fillText(Math.abs(i),rc+16*d,rcy+o+4*d);}}
  x.lineWidth=1*d;x.beginPath();x.arc(rc,rcy,1.6*d,0,7);x.fill();
  // ballistic drop chevron / wind hold (BDC scopes) and the recruit impact predictor
  if(G.scope.bdc&&G.range>40){const dm=G.dropAt||0,wm=G.scope.bdc>1?G.windMil||0:0;const px=rc+wm*ppm,py=rcy+dm*ppm;x.strokeStyle=night?'rgba(255,200,80,.95)':'rgba(255,120,20,.95)';x.lineWidth=2*d;x.beginPath();x.moveTo(px-7*d,py+6*d);x.lineTo(px,py);x.lineTo(px+7*d,py+6*d);x.stroke();
   x.font=`700 ${9*d}px "JetBrains Mono",monospace`;x.fillStyle=x.strokeStyle;x.textAlign='left';x.fillText(Math.round(G.range)+'',px+10*d,py+8*d);}
  if(G.pred){const p=G.pred;x.strokeStyle='rgba(255,50,40,.95)';x.lineWidth=1.8*d;x.beginPath();x.arc(p.x,p.y,6*d,0,7);x.stroke();x.fillStyle='rgba(255,50,40,.95)';x.beginPath();x.arc(p.x,p.y,1.6*d,0,7);x.fill();}
  x.restore();
  // lens vignette + mask with parallax
  const g=x.createRadialGradient(cx,cy,R*.78,cx,cy,R);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.8,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,.95)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,R,0,7);x.fill();
  x.fillStyle='#000';x.beginPath();x.rect(0,0,W,H);x.moveTo(cx+R,cy);x.arc(cx,cy,R,0,Math.PI*2,true);x.closePath();x.fill('evenodd');
  x.strokeStyle='rgba(120,150,170,.18)';x.lineWidth=2*d;x.beginPath();x.arc(cx,cy,R-1*d,0,7);x.stroke();
  // breath arc (left) + readouts
  const br=G.breath/100;x.lineWidth=4*d;x.strokeStyle='rgba(255,255,255,.12)';x.beginPath();x.arc(cx,cy,R+14*d,Math.PI*.82,Math.PI*1.18);x.stroke();
  x.strokeStyle=G.gasp>0?'#ff5040':G.holding?'#fff':'#9ef0ff';x.beginPath();x.arc(cx,cy,R+14*d,Math.PI*1.18-.36*Math.PI*br,Math.PI*1.18);x.stroke();
  x.font=`700 ${10*d}px "JetBrains Mono",monospace`;x.fillStyle='rgba(255,255,255,.75)';x.textAlign='right';x.fillText(G.gasp>0?'OUT OF BREATH':G.holding?'HOLDING':'BREATH',cx-R-24*d,cy+4*d);
  x.textAlign='left';const rx=cx+R+22*d;x.font=`400 ${26*d}px Anton,Impact,sans-serif`;x.fillStyle='#fff';x.fillText(G.zoom.toFixed(1)+'×',rx,cy-18*d);
  x.font=`700 ${10*d}px "JetBrains Mono",monospace`;x.fillStyle='#ffd9b8';x.fillText('ZERO '+G.zero+' M',rx,cy+2*d);
  if(G.range&&G.diff<2){x.fillStyle='#9ef0ff';x.fillText('RANGE '+Math.round(G.range)+' M',rx,cy+18*d);}
  if(G.diff<2&&G.range){const dm=G.dropAt||0;x.fillStyle='rgba(255,255,255,.65)';x.fillText('DROP '+(dm>=0?'+':'')+dm.toFixed(1)+' MIL',rx,cy+34*d);x.fillText('WIND '+(G.windMil>=0?'R ':'L ')+Math.abs(G.windMil||0).toFixed(1)+' MIL',rx,cy+50*d);}
  if(G.cycleT>0||G.reloadT>0){x.fillStyle='#ffb38a';x.fillText(G.reloadT>0?'RELOADING…':'CHAMBERING…',rx,cy+68*d);}}
 binosMask(W,H){const x=this.x;const r=Math.min(H*.44,W*.27),cy=H/2,c1=W/2-r*.62,c2=W/2+r*.62;x.fillStyle='#000';x.fillRect(0,0,W,H);x.save();x.globalCompositeOperation='destination-out';
  x.beginPath();x.arc(c1,cy,r,0,7);x.fill();x.beginPath();x.arc(c2,cy,r,0,7);x.fill();x.restore();
  x.save();x.beginPath();x.arc(c1,cy,r,0,7);x.arc(c2,cy,r,0,7);x.clip();x.lineWidth=r*.3;x.strokeStyle='rgba(0,0,0,.35)';for(const c of[c1,c2]){x.beginPath();x.arc(c,cy,r*1.12,0,7);x.stroke();}x.restore();}
 binos(G,cam,W,H,d,ppm){const x=this.x;const r=Math.min(H*.44,W*.27),cy=H/2;
  const cx=W/2;x.strokeStyle='rgba(160,255,200,.8)';x.lineWidth=1*d;x.beginPath();x.moveTo(cx-30*d,cy);x.lineTo(cx-8*d,cy);x.moveTo(cx+8*d,cy);x.lineTo(cx+30*d,cy);x.moveTo(cx,cy-8*d);x.lineTo(cx,cy-24*d);x.stroke();
  for(let i=-5;i<=5;i++){x.beginPath();x.moveTo(cx+i*ppm*2,cy+r*.55);x.lineTo(cx+i*ppm*2,cy+r*.55-(i%5?4:9)*d);x.stroke();}
  x.font=`700 ${10*d}px "JetBrains Mono",monospace`;x.fillStyle='rgba(160,255,200,.9)';x.textAlign='center';const brg=((-G.yaw*180/Math.PI)%360+360)%360;x.fillText('BRG '+brg.toFixed(0).padStart(3,'0')+'°   '+G.bzoom.toFixed(1)+'×'+(G.range&&G.diff<2?'   '+Math.round(G.range)+' M':''),cx,cy-r*.78);
  x.fillText('LMB / F · TAG      B · CLOSE      WHEEL · ZOOM',cx,cy+r*.86);
  const p=G.look;if(p){const top=p.rig.rag?p.rig.rag.pts[6]:_v.set(p.pos.x,p.pos.y+1.9,p.pos.z).clone(),bot=p.rig.rag?p.rig.rag.pts[0]:new THREE.Vector3(p.pos.x,p.pos.y,p.pos.z);const a=this.project(cam,top,W,H),b=this.project(cam,bot,W,H);if(a&&b){const h=Math.max(16*d,b.y-a.y),w=h*.45,X=a.x,Y=a.y;
   x.strokeStyle=p.tag?'#ff8a2a':'rgba(160,255,200,.95)';x.lineWidth=2*d;const L=w*.35;for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const px=X+sx*w/2,py=Y+(sy<0?-4*d:h+4*d);x.beginPath();x.moveTo(px,py+(-sy)*L);x.lineTo(px,py);x.lineTo(px-sx*L,py);x.stroke();}
   const tx=Math.min(W-250*d,X+w/2+14*d),ty=Math.max(60*d,Y-10*d);const lines=G.lookTraits;x.fillStyle='rgba(6,10,10,.82)';x.fillRect(tx,ty,236*d,(30+lines.length*15)*d);x.textAlign='left';
   x.fillStyle=p.tag?'#ff8a2a':'rgba(160,255,200,1)';x.font=`700 ${10*d}px "JetBrains Mono",monospace`;x.fillText(!p.alive?'DECEASED':p.tag?'TAGGED':'SUBJECT',tx+10*d,ty+16*d);
   lines.forEach((l,i)=>{x.fillStyle=l.m===1?'#7dff9a':l.m===-1?'#ff8a8a':'#e8ecf0';x.fillText((l.m===1?'✓ ':l.m===-1?'✗ ':'· ')+l.t,tx+10*d,ty+(34+i*15)*d);});}}}
}
