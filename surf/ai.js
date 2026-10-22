// SWELL GUARD — CPU surfer brains. Brain drives a Surfer through the same controls a player uses: wait in the lineup,
// read the sets, paddle into a wave, ride the pocket with bottom turns, snaps, cutbacks and (skill permitting) airs,
// kick out, paddle back out duck-diving the whitewater. Skill sets wave choice, timing, air rate and mistakes.
import {C,TLIP} from './ocean.js';
const cl=(v,a,b)=>v<a?a:v>b?b:v,wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
export const AISKILL=[{air:.12,err:.3,spin:1,read:.7,duck:.6},{air:.3,err:.16,spin:2,read:.85,duck:.8},{air:.55,err:.07,spin:3,read:.97,duck:.95}];
export class Brain{
 constructor(S,sk,home,rand=Math.random){this.S=S;this.k=sk;this.home=home;this.rand=rand;this.mode='out';this.goUp=false;this.cut=0;this.plan=null;this.waitT=0;this.target=null;this.maxRide=8+rand()*6;this.cool=0;}
 steerTo(tx,tz,dt){const S=this.S,c=S.ctl,want=Math.atan2(tx-S.x,tz-S.z);const d=wrap(want-S.yaw);c.x=cl(-d*2.2,-1,1);return Math.abs(d);}
 faceYaw(yaw){const S=this.S,d=wrap(yaw-S.yaw);this.S.ctl.x=cl(-d*2.2,-1,1);return Math.abs(d);}
 // a wave worth paddling for: crest approaching, decent size here, about to break (not whitewater)
 pick(){const S=this.S,sim=S.sim;let best=null,bs=0,o={};
  for(const w of sim.waves){const dist=w.zc-S.z;if(dist<2||dist>16||w.riders>1)continue;sim.sample(S.x,w.zc,o);if(o.w!==w)continue;const ab=(w.broke?w.tb+dist/C:(w.zB-S.z)/C)-Math.abs(S.x-w.x0)/o.sp;if(o.a<.9||ab>.4||ab<-4)continue;
   const sc=o.a*(this.rand()<this.k.read?1:.5)-Math.abs(ab+1)*.2;if(sc>bs){bs=sc;best=w;}}return best;}
 update(dt){const S=this.S,c=S.ctl;c.paddle=false;c.pop=false;c.jump=false;c.duck=false;c.has=false;c.grab=null;c.y=0;c.x=0;c.mx=c.mz=0;c.crouch=false;c.autoPop=false;this.cool-=dt;
  switch(S.state){
   case'foot':{const tx=this.home.x,tz=12;const dx=tx-S.x,dz=tz-S.z,l=Math.hypot(dx,dz)||1;c.mx=dx/l;c.mz=dz/l;break;}
   case'paddle':this.paddle(dt);break;
   case'ride':this.ride(dt);break;
   case'air':this.air(dt);break;
   case'wipe':c.mash=this.rand()<.12;break;}}
 paddle(dt){const S=this.S,c=S.ctl,sim=S.sim;
  if(this.mode==='chase'){const w=this.plan;if(!w||!sim.waves.includes(w)||w.zc<S.z-3||S.state!=='paddle'){this.mode='out';this.plan=null;return;}
   this.faceYaw(Math.PI+cl((S.x-w.x0)*.01,-.3,.3));c.paddle=true;if(S.canPop)c.pop=true;return;}
  // whitewater coming? duck under it
  const o=sim.sample(S.x,S.z+2.5,this._o||(this._o={}));if(o.w&&o.br>.5&&o.u>-o.wf*1.6&&o.u<0&&this.rand()<this.k.duck*dt*12)c.duck=true;
  const hx=this.home.x,hz=this.home.z;const d=Math.hypot(hx-S.x,hz-S.z);
  if(d>5||this.mode==='out'){this.steerTo(hx,hz,dt);c.paddle=true;if(d<5)this.mode='wait';}
  else{this.mode='wait';this.faceYaw(0);if(Math.abs(wrap(S.yaw))<.3)c.y=-1;const w=this.pick();if(w&&this.cool<=0){this.plan=w;this.mode='chase';this.maxRide=7+this.rand()*7;this.tube=undefined;}}}
 ride(dt){const S=this.S,c=S.ctl,sim=S.sim,w=S.w;if(!w)return;const o=sim.sampleWave(w,S.x,S.z,this._o||(this._o={}));
  const px=sim.peelX(w,S.dir),ahead=(S.x-px)*S.dir;const u=o.u/Math.max(o.wf,.5);
  if(u<-1.0)this.goUp=true;else if(u>-.36)this.goUp=false;
  let vx=S.dir,vz=this.goUp?.85:-.8;
  if(w.tb>0&&ahead<3){vz=this.goUp?.35:-.35;}// curl close: stay high and fast
  if(this.cut>0){this.cut-=dt;vx=-S.dir;vz=-.15;}else if(w.tb>0&&ahead>11&&this.rand()<dt*2.5)this.cut=.75;
  // barrel attempt: let the curl catch up (drag a hand), then hold a flat mid-face line under the lip
  if(this.tube===undefined)this.tube=this.rand()<this.k.air*1.4;
  if(this.tube&&w.tb>0&&o.stp>.5){vz=u<-.75?.25:u>-.45?-.3:0;vx=S.dir;if(ahead>-4)c.stall=true;if(ahead<-7)c.crouch=true;this.cut=0;}
  if(S.rideT>this.maxRide||S.z<22){vx=S.dir*.3;vz=1;}
  const l=Math.hypot(vx,vz);c.dx=vx/l;c.dz=vz/l;c.has=true;
  // hit the lip
  if(this.goUp&&u>-.6&&S.speed>7.5&&this.rand()<this.k.air*dt*3.5){c.jump=true;this.trick={spin:Math.floor(this.rand()*(this.k.spin+1)),grab:this.rand()<.5?['rail','tail','superman'][Math.floor(this.rand()*3)]:null,flip:this.rand()<this.k.air*.25,dir:this.rand()<.5?1:-1,err:this.rand()<this.k.err};}}
 air(dt){const S=this.S,c=S.ctl,t=this.trick||{spin:0};const h=S.sim.height(S.x,S.z),drop=S.y-h,tl=S.vy<0?drop/Math.max(1,-S.vy):1;
  const want=t.spin*Math.PI;if(Math.abs(S.spin)<want-.25)c.x=t.dir;
  if(t.flip&&Math.abs(S.flip)<Math.PI*2-.3&&tl>.12)c.y=1;
  if(t.grab&&S.airT>.08&&(tl>(t.err?.03:.22)))c.grab=t.grab;}
}
