// SIDEWAYS — drift judging. Points flow at angle x speed while sliding; a chain grows its multiplier with time,
// proximity to walls, clipping points and tandem; the chain banks when you straighten and is lost on a crash or spin.
const cl=(v,a,b)=>v<a?a:v>b?b:v;
export const RULES={minAngle:12,minKmh:22,grace:1.4,rate:.32,multStep:2.2,multMax:8,prox:1.6,spin:115};
export class Scorer{
 constructor(){this.reset();}
 reset(){Object.assign(this,{total:0,chain:0,mult:1,chainT:0,grace:0,drifting:false,bestCombo:0,events:[],tags:{},longest:0,maxAngle:0,topKmh:0,drifts:0,clips:0,crashes:0,tandemT:0,driveT:0,driftT:0,proxT:0,angle:0,rate:0,clipBonus:0,tandem:0,lastClip:-1});}
 // c: physics car; o: {wallDist, wrongWay, lead (tandem info) }
 update(dt,c,o={}){this.events.length=0;const kmh=c.speed*3.6,ang=Math.abs(c.beta)*180/Math.PI;this.angle=ang;this.topKmh=Math.max(this.topKmh,kmh);this.driveT+=dt;
  for(const k in this.tags){this.tags[k]-=dt;if(this.tags[k]<=0)delete this.tags[k];}
  if(this.chain>0&&ang>RULES.spin&&kmh>8){this.lose('SPUN OUT');}
  const fwd=c.u>-1;
  const on=!o.wrongWay&&fwd&&ang>RULES.minAngle&&ang<RULES.spin&&kmh>RULES.minKmh;
  this.drifting=on;this.rate=0;this.tandem=0;
  if(on){this.grace=0;this.chainT+=dt;this.driftT+=dt;this.maxAngle=Math.max(this.maxAngle,ang);
   let r=Math.min(ang,75)*Math.min(kmh,180)*RULES.rate;
   if(ang>=40){r*=1.15;this.tag('BIG ANGLE',.6);}
   if(o.wallDist!=null&&o.wallDist<RULES.prox){const k=1+(RULES.prox-Math.max(0,o.wallDist))/RULES.prox;r*=1+.6*k;this.proxT+=dt;this.tag('PROXIMITY',.5);}
   if(o.lead){const t=o.lead;if(t.ok){const close=cl(1-(t.dist-3)/(t.max-3),0,1),match=cl(1-t.angDiff/22,0,1);this.tandem=.5+close*.6+match*.4;r*=1+this.tandem;this.tandemT+=dt;this.tag('TANDEM',.5);}}
   this.rate=r;this.chain+=r*dt;
   this.mult=Math.min(RULES.multMax,1+Math.floor(this.chainT/RULES.multStep)*.5+this.clipBonus);
   this.longest=Math.max(this.longest,this.chainT);}
  else if(this.chain>0){this.grace+=dt;if(this.grace>RULES.grace||o.wrongWay)this.bank();}
 }
 tag(t,d){if(!(t in this.tags))this.events.push(['tag',t]);this.tags[t]=d;}
 clip(id,kind){if(!this.drifting||id===this.lastClip)return false;this.lastClip=id;this.clips++;this.clipBonus+=.5;const b=Math.round(250+this.angle*12);this.chain+=b;this.events.push(['clip',b,kind]);this.tag('CLIP',1.1);return true;}
 bank(){const v=Math.round(this.chain*this.mult);if(this.chainT>.8)this.drifts++;if(v>0){this.total+=v;this.bestCombo=Math.max(this.bestCombo,v);this.events.push(['bank',v,this.mult]);}this.clear();}
 lose(why='CRASH'){if(this.chain>0){this.crashes++;this.events.push(['lost',Math.round(this.chain*this.mult),why]);}this.clear();}
 clear(){this.chain=0;this.mult=1;this.chainT=0;this.grace=0;this.clipBonus=0;this.lastClip=-1;}
 get live(){return Math.round(this.chain*this.mult);}
}
