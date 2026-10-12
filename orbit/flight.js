// ORBIT LAB — one flight: vessel + universal time + warp + maneuver node + coach + debris + prediction. Pure JS.
import * as P from './physics.js';
import {Vessel,Debris} from './vessel.js';
import {Coach,WARPS} from './coach.js';
const {add,sub,mul,len,norm,VERDA,LUNE}=P;

export class Flight{
 constructor(ids,o={}){this.o=o;this.t=o.t0??0;this.t0=this.t;this.ves=new Vessel(ids,{easy:o.easy});this.warpI=0;this.node=null;this.debris=[];this.sas='hold';
  this.events=[];this.pred=null;this.predAt=-1;this.coach=null;this.target=o.target||null;this.real=0;this.coachUsed=false;this.throttle=0;this.ok=true;
  if(o.orbit)this.ok=this.skipAscent(o.orbit);}
 get warp(){return WARPS[this.warpI];}
 thrusting(){const v=this.ves;return v.throttle>0&&v.thrustInfo(0).live;}
 maxWarpI(){const v=this.ves;if(v.destroyed)return WARPS.length-1;if(this.thrusting())return 0;if(v.landed)return WARPS.length-1;if(v.alt<v.warpFloor())return 3;return WARPS.length-1;}
 setWarp(i){const m=this.maxWarpI();if(i>m){this.events.push({type:'warpblock',why:this.thrusting()?'thrust':'low'});}this.warpI=Math.max(0,Math.min(i,m));}
 startCoach(plan){this.coach=new Coach(plan);this.coachUsed=true;this.events.push({type:'coach',on:true});}
 stopCoach(){if(this.coach){this.coach=null;this.events.push({type:'coach',on:false});}}
 // place directly in a circular parking orbit, spending the Δv the ascent would have cost
 skipAscent(alt){const v=this.ves;v.ignited=true;let left=2650+(this.o.easy?-250:0);let guard=0;
  while(left>0&&guard++<20){const st=v.dvStages(.25)[0];if(!st)return false;if(st.dv<=0){if(v.segs().length<=1)return false;v.stage();continue;}
   if(st.dv<=left){left-=st.dv;for(const p of v.bottomSeg())p.fuel=0;if(v.segs().length<=1)return left<=0;v.stage();}
   else{const mf=st.m0*Math.exp(-left/(st.isp*P.G0)),burn=st.m0-mf,seg=v.bottomSeg().filter(p=>p.fuel>0),tot=seg.reduce((a,p)=>a+p.fuel,0);for(const p of seg)p.fuel-=burn*p.fuel/tot;left=0;}}
  const r=VERDA.R+alt,th=.35;v.landed=false;v.landedOn=null;v.r=[r*Math.cos(th),0,-r*Math.sin(th)];const vc=P.vCirc(VERDA.mu,r);v.v=[-vc*Math.sin(th),0,-vc*Math.cos(th)];
  v.q4=P.qLook(norm(v.v),norm(v.r));v.events.length=0;v.stats.maxAlt=alt;v.solarOpen=v.hasSolar();return true;}
 setNode(n){if(!n){this.node=null;return;}const st={body:this.ves.body,r:this.ves.r,v:this.ves.v};const ns=P.nodeState(st,this.t,n);this.node={...n,body:st.body,dvW:ns.dvW,dv:len(ns.dvW),pred:P.predict(ns,n.t,{max:3})};}
 refreshNode(){if(this.node)this.setNode({t:this.node.t,pro:this.node.pro,nrm:this.node.nrm,rad:this.node.rad});}
 targetInfo(){const v=this.ves;if(this.target==='station'&&v.body==='verda'){const S=P.stationState(this.t);const rel=sub(S.r,v.r),vr=sub(v.v,S.v);return{name:'STATION',d:len(rel),dir:norm(rel),vrel:vr,vr:len(vr),closing:-P.dot(vr,mul(rel,-1/len(rel)))};}
  if(this.target==='lune'){const L=P.luneState(this.t);const up=v.uniPos(this.t),rel=sub(L.r,up),vr=sub(v.uniVel(this.t),L.v);return{name:'LUNE',d:len(rel),dir:norm(rel),vrel:vr,vr:len(vr)};}return null;}
 sasDirFor(mode){const v=this.ves;const ti=this.targetInfo();return v.sasDir(mode,{nodeDir:this.node?norm(this.node.dvW):null,tgtDir:ti?ti.dir:null});}
 // inp: {pitch,yaw,roll,throttle,stage,chute,legs,solar,manual}
 update(dtReal,inp={}){const v=this.ves;this.real+=dtReal;
  let out=null;if(this.coach){if(inp.manual){this.stopCoach();}else{out=this.coach.update(this);if(this.coach.done){this.events.push({type:'coachdone',title:this.coach.title,text:this.coach.text});this.lastCoach=this.coach;this.coach=null;}}}
  if(out){if(out.stage)v.stage();if(out.chute)v.deployChute();if(out.legs&&!v.legs)v.toggleLegs();this.throttle=out.throttle??0;}
  else{if(inp.throttle!=null)this.throttle=inp.throttle;if(inp.stage)v.stage();if(inp.chute)v.deployChute();if(inp.legs)v.toggleLegs();}
  if(inp.solar||(out&&out.solar))v.toggleSolar();
  v.throttle=this.throttle;
  if(out&&out.warp!=null){const i=Math.max(0,WARPS.lastIndexOf(WARPS.filter(w=>w<=out.warp).pop()||1));this.warpI=Math.min(i,this.maxWarpI());}
  else this.warpI=Math.min(this.warpI,this.maxWarpI());
  const dir=out&&out.dir?out.dir:(this.sas!=='off'&&this.sas!=='hold'?this.sasDirFor(this.sas):null);
  if(this.sas==='hold'&&(inp.pitch||inp.yaw||inp.roll||!v.holdDir))v.holdDir=v.nose;
  const hd=this.sas==='hold'&&!out?v.holdDir:null;
  v.sas=out?'auto':this.sas;
  const w=this.warp;
  if(v.destroyed){this.t+=dtReal*w;}
  else if(w>10){if(v.landed){this.t+=dtReal*w;v.stats.flightT+=dtReal*w;}else{const res=v.rails(dtReal*w,this.t,dir||hd?()=>dir||hd:null);this.t=res.t;if(!res.ok)this.warpI=Math.min(this.warpI,3);}}
  else{const simDt=dtReal*w,n=Math.max(1,Math.ceil(simDt/.02)),h=simDt/n;
   for(let i=0;i<n&&!v.destroyed;i++){const d=out&&out.dir?out.dir:(this.sas==='hold'?(inp.pitch||inp.yaw||inp.roll?null:v.holdDir):this.sasDirFor(this.sas));
    v.step(h,{pitch:inp.pitch,yaw:inp.yaw,roll:inp.roll,throttle:this.throttle,dir:this.sas==='off'&&!out?null:d},this.t);this.t+=h;}}
  if(this.thrusting()&&this.warpI>0)this.warpI=0;
  // dropped stages
  for(const e of v.events){if(e.type==='sep')this.debris.push(new Debris(e,this.t));this.events.push(e);}v.events.length=0;
  const dd=dtReal*Math.min(w,10);for(const d of this.debris){if(w>10){d.dead=d.dead||'gone';continue;}d.step(dd,this.t);if(d.dead==='crash')this.events.push({type:'debriscrash',d});if(len(sub(d.r,v.body===d.body?v.r:d.r))>60000||d.age>240)d.dead=d.dead||'gone';}
  this.debris=this.debris.filter(d=>!d.dead);
  // patched-conic prediction (cheap enough to refresh a few times a second)
  if(this.real-this.predAt>.25||this.predAt<0){this.predAt=this.real;this.pred=v.landed?null:P.predict({body:v.body,r:v.r,v:v.v},this.t,{max:3});
   if(this.node){const age=this.t-this.node.t;if(age>600)this.node=null;}}
 }
 // headless helper for tests: run with fixed dt until fn() is true or limit seconds of real time pass
 run(fn,limit=600,dt=1/30,inp={}){let k=0;const n=limit/dt;while(k++<n){this.update(dt,inp);if(fn(this))return true;if(this.ves.destroyed)return false;}return false;}
}
