// KART GRAND PRIX — CPU drivers: racing line, shortcuts, drifting for mini-turbos, hazard avoidance, item tactics, rubber-banding.
import {cl,wrapA} from './util.js';
import {F,SURF} from './trackmath.js';

// path look-up that can continue from a shortcut back onto the main loop
function pathPoint(C,B,i,ahead,o){const st=B.step;let k=i+Math.round(ahead/st);
 if(B.closed){k=((k%B.n)+B.n)%B.n;o.B=B;o.i=k;}
 else if(k<B.n){o.B=B;o.i=k;}
 else{const M=C.main,ib=Math.round(((B.def.b%1)+1)%1*M.n)%M.n;o.B=M;o.i=(ib+(k-B.n+1)+M.n*4)%M.n;}
 return o;}
const P={},P2={};
export function thinkRace(k,G,dt){const c=k.ctrl,D=k.human>=0?G.D2:G.diff,C=G.C,q=k.q;
 c.thr=1;c.brake=0;c.item=false;c.back=false;c.look=false;
 if(!q.ok||!q.B){c.steer=0;return;}
 // personal lane offset drifts slowly; easy CPUs wander more
 k.aiT=(k.aiT||0)+dt;if(!k.aiOff||k.aiT>k.aiNext){k.aiT=0;k.aiNext=2+Math.random()*3;k.aiOffT=(Math.random()-.5)*(4-2*D.line);}k.aiOff=(k.aiOff||0)+((k.aiOffT||0)-(k.aiOff||0))*Math.min(1,dt*.8);
 let B=q.B,i=q.i;
 // shortcut decision at the entry of each cut
 if(B.kind==='main'){for(const cut of C.branches){if(cut.kind!=='cut')continue;const ia=Math.round(((cut.a%1)+1)%1*B.n)%B.n;let d=(ia-i+B.n)%B.n;
   if(d<14&&d>0){const rough=cut.def.surf&&cut.def.surf!=='road';if(k.cutLap!==k.lap+'_'+cut.id){k.cutLap=k.lap+'_'+cut.id;const _r=cut.def.surf&&cut.def.surf!=='road';const pr=_r?(k.boost>0||k.aura>0||(k.item&&k.item.startsWith('pepper'))?.85*D.skill:0):[.25,.55,.85][G.diffI];k.takeCut=Math.random()<pr?cut:null;}
    if(k.takeCut===cut){// steer onto the cut: find nearest cut sample
     let bi=0,bd=1e9;for(let j=0;j<Math.min(cut.n,30);j++){const dd=(cut.x[j]-k.p.x)**2+(cut.z[j]-k.p.z)**2;if(dd<bd){bd=dd;bi=j;}}B=cut;i=bi;if(rough&&k.item&&k.item.startsWith('pepper'))k.wantItem=true;}}}}
 const spd=Math.max(8,k.spd),edgeT=G.fall||(q.flag&F.noWall),look=edgeT||B.kind==='cut'?4+spd*.27:5+spd*.42;pathPoint(C,B,i,look,P);
 const T=P.B,j=P.i;let off=T.line[j]*D.line*(G.fall?.6:1)+k.aiOff*(T.kind==='cut'||G.fall?.3:1);
 // avoid peels, bombs and hazards on the line ahead
 const tx0=T.x[j],tz0=T.z[j];
 for(const p of G.items.list){if(p.type!=='peel'&&p.type!=='bomb')continue;const dx=p.p.x-k.p.x,dz=p.p.z-k.p.z;const fwd=dx*Math.sin(k.yaw)+dz*Math.cos(k.yaw);if(fwd<0||fwd>24)continue;const lat=dx*Math.cos(k.yaw)-dz*Math.sin(k.yaw);if(Math.abs(lat)<3.4&&Math.random()<D.skill+.1){off+=lat>0?-3.5:3.5;}}
 for(const h of G.W.haz){if(!h.active&&!h.warn)continue;const dx=h.p.x-k.p.x,dz=h.p.z-k.p.z;const fwd=dx*Math.sin(k.yaw)+dz*Math.cos(k.yaw);if(fwd<0||fwd>22)continue;const lat=dx*Math.cos(k.yaw)-dz*Math.sin(k.yaw);if(Math.abs(lat)<h.r+2.2&&Math.random()<D.skill)off+=lat>0?-(h.r+2.5):h.r+2.5;}
 const edgy=G.fall||(T.flag[j]&F.noWall)||T.kind==='cut';off=cl(off,-T.w[j]*(edgy?.5:.85),T.w[j]*(edgy?.5:.85));
 const tx=tx0+T.nx[j]*off,tz=tz0+T.nz[j]*off;
 const want=Math.atan2(tx-k.p.x,tz-k.p.z),err=wrapA(want-k.yaw);
 c.steer=cl(err*2.8,-1,1);
 if(Math.abs(err)>1.1&&k.spd>14){c.thr=.3;c.brake=.4;}
 // on roads without walls, ease off when drifting wide of the line
 if(G.fall||(q.flag&F.noWall)){const lat=Math.abs(q.u)/q.w;if(lat>.7&&Math.abs(err)>.25){c.thr=.5;if(k.drift&&Math.sign(q.u)!==k.drift)c.drift=false;}}
 if(Math.abs(err)>2.2){c.thr=0;c.brake=1;c.steer=-Math.sign(err);}// facing backwards: reverse turn
 if(k.glide){c.brake=0;c.thr=1;}
 // drifting: look at curvature ahead
 let curv=0;for(let a=6;a<46;a+=4){pathPoint(C,B,i,a,P2);curv+=P2.B.curv[P2.i]*4;}
 if(!k.drift){if(k.driftArm&&k.airT<.5&&!k.ground){c.drift=true;}else if(Math.abs(curv)>.42&&k.spd>18&&k.ground&&Math.random()<D.drift*dt*6&&!k.aiDriftCd){c.drift=true;k.aiHold=Math.sign(curv);}else c.drift=false;}
 else{const target=G.diffI===2?(Math.abs(curv)>1.1?3:2):G.diffI===1?2:1;c.drift=!(k.driftLv>=target&&Math.abs(curv)<.6)&&Math.abs(curv)>.18;if(k.driftT>4.5)c.drift=false;
  // hold the drift into the corner: steer by the error but never fight the drift direction too hard
  c.steer=cl(err*3,-1,1);if(Math.sign(c.steer)!==k.drift&&Math.abs(err)<.35)c.steer=k.drift*.2;}
 if(k.drift&&!c.drift)k.aiDriftCd=.4;if(k.aiDriftCd){k.aiDriftCd-=dt;if(k.aiDriftCd<=0)k.aiDriftCd=0;}
 if(c.drift&&!k.drift&&k.ground&&Math.abs(c.steer)<.4)c.steer=(k.aiHold||1)*.6;
 // tricks off ramps
 if(!k.ground&&k.trickWin>0&&!k.trickDone&&Math.random()<D.skill*dt*12)c.drift=true;
 // items
 thinkItems(k,G,dt,curv);}

function thinkItems(k,G,dt,curv){const c=k.ctrl,D=k.human>=0?G.D2:G.diff;k.itemT=(k.itemT||0)+dt;
 if(k.wantItem){k.wantItem=false;c.item=true;return;}
 if(!k.item&&!k.orbs)return;if(k.roulette>0)return;
 if(k.itemT<.6+D.react*3)return;
 const it=k.orbs?'orb':k.item,others=G.karts.filter(o=>o!==k&&!o.out&&o.respawn<=0);
 const rel=o=>{const dx=o.p.x-k.p.x,dz=o.p.z-k.p.z;return{f:dx*Math.sin(k.yaw)+dz*Math.cos(k.yaw),l:dx*Math.cos(k.yaw)-dz*Math.sin(k.yaw)};};
 const ahead=others.some(o=>{const r=rel(o);return r.f>4&&r.f<34&&Math.abs(r.l)<3+r.f*.08;}),behind=others.some(o=>{const r=rel(o);return r.f<-2&&r.f>-16&&Math.abs(r.l)<3;});
 let use=false,back=false;const roll=Math.random()<D.item*dt*3;
 switch(it){
  case'coin':use=true;break;
  case'pepper':case'pepper3':use=(Math.abs(curv)<.35&&roll)||(k.place>G.karts.length*.6&&roll);break;
  case'aura':use=k.itemT>1.5&&roll;break;
  case'bolt':use=k.itemT>2&&roll;break;
  case'seeker':use=k.place>1&&roll;break;
  case'orb':if(ahead&&roll)use=true;else if(behind&&roll){use=true;back=true;}break;
  case'peel':if(behind&&roll)use=true;else if(k.itemT>9&&roll)use=true;break;
  case'bomb':if(ahead&&roll)use=true;else if(behind&&roll){use=true;back=true;}else if(k.itemT>10&&roll)use=true;break;}
 if(use){c.item=true;c.back=back;k.itemT=0;}}

// ---------- balloon battle ----------
export function thinkBattle(k,G,dt){const c=k.ctrl,D=G.diff,A=G.A;c.thr=1;c.brake=0;c.item=false;c.back=false;c.drift=false;
 k.aiT=(k.aiT||0)-dt;
 if(k.aiT<=0||!k.aiTarget||(k.aiTarget.out)||(k.aiTarget.t>0)){k.aiT=1.2+Math.random()*1.5;
  const foes=G.karts.filter(o=>o!==k&&!o.out&&o.respawn<=0);const nearFoe=foes.sort((a,b)=>a.p.distanceToSquared(k.p)-b.p.distanceToSquared(k.p))[0];
  const box=!k.item&&!k.orbs&&!k.roulette?G.W.boxes.filter(b=>b.t<=0).sort((a,b)=>a.p.distanceToSquared(k.p)-b.p.distanceToSquared(k.p))[0]:null;
  k.aiTarget=box&&(!nearFoe||box.p.distanceTo(k.p)<nearFoe.p.distanceTo(k.p)*1.4)?box:nearFoe||{p:{x:0,z:0}};}
 const t=k.aiTarget.p;let tx=t.x,tz=t.z;
 // steer around pillars
 for(const p of A.cols){const dx=p.x-k.p.x,dz=p.z-k.p.z,f=dx*Math.sin(k.yaw)+dz*Math.cos(k.yaw);if(f<0||f>16)continue;const l=dx*Math.cos(k.yaw)-dz*Math.sin(k.yaw);if(Math.abs(l)<p.r+2.5){const s=l>0?-1:1;tx=k.p.x+Math.sin(k.yaw)*10+Math.cos(k.yaw)*s*(p.r+4);tz=k.p.z+Math.cos(k.yaw)*10-Math.sin(k.yaw)*s*(p.r+4);}}
 // keep off the wall
 const r=Math.hypot(k.p.x,k.p.z);if(r>A.R-14){tx=tx*.4;tz=tz*.4;}
 const want=Math.atan2(tx-k.p.x,tz-k.p.z),err=wrapA(want-k.yaw);c.steer=cl(err*2.6,-1,1);if(Math.abs(err)>1.6&&k.spd>8){c.thr=.2;}
 if(Math.abs(err)>.9&&k.spd>16&&Math.random()<D.drift*.5)c.drift=true;
 // items
 k.itemT=(k.itemT||0)+dt;if((k.item||k.orbs)&&!k.roulette&&k.itemT>.8+D.react*3){const it=k.orbs?'orb':k.item,foe=k.aiTarget&&k.aiTarget.balloons!==undefined?k.aiTarget:null;
  let use=false,back=false;if(foe){const dx=foe.p.x-k.p.x,dz=foe.p.z-k.p.z,f=dx*Math.sin(k.yaw)+dz*Math.cos(k.yaw),l=dx*Math.cos(k.yaw)-dz*Math.sin(k.yaw),d=Math.hypot(dx,dz);
   if((it==='orb'||it==='bomb'||it==='peel')&&f>3&&f<34&&Math.abs(l)<3+f*.1)use=true;if(it==='seeker'&&d<60)use=true;if((it==='pepper'||it==='aura')&&f>2&&d<22)use=true;if(it==='peel'&&f<-2&&d<12){use=true;}}
  if(it==='coin'||k.itemT>9)use=true;if(use&&Math.random()<D.item*dt*8){c.item=true;c.back=back;k.itemT=0;}}}
