// HOLLOW MANOR — every sound is synthesized: wind and rain on the windows, house drones, creaks and footsteps placed around
// the listener (muffled through floors), the heartbeat, the creature's stomps and breath, stingers, the music box, the clock.
import {boot,master,gain,noiseBuf,reverb,bed,tone,hiss} from '../js/kit3d/audio.js';
const R=Math.random;
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.lp={x:0,y:0,z:0,yaw:0};this.tension=0;this.chase=false;this.near=0;this.nextBeat=0;this.nextPulse=0;this.on=false;this.clock=null;this.inside=1;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-16,6);this.sfx=gain(ac,1,this.master);this.mus=gain(ac,.7,this.master);this.noise=noiseBuf(ac,3);this.verb=reverb(ac,3.2,2.6,.5,this.master);this.room=reverb(ac,1.2,3.5,.35,this.sfx);
  // wind howling around the house, rain on glass, a low room tone
  this.amb=gain(ac,0,this.master);const w=bed(ac,this.noise,'bandpass',380,.9,this.amb,.3);const lfo=ac.createOscillator();lfo.frequency.value=.06;const lg=gain(ac,240,w.f.frequency);lfo.connect(lg);lfo.start();
  const l2=ac.createOscillator();l2.frequency.value=.13;const lg2=gain(ac,.18,w.g.gain);l2.connect(lg2);l2.start();bed(ac,this.noise,'highpass',3800,.5,this.amb,.035,.7);bed(ac,this.noise,'lowpass',90,1,this.amb,.5,1.3);
  // drone: detuned low sines + a dissonant pad that swells with tension
  this.drone=gain(ac,0,this.mus);const df=ac.createBiquadFilter();df.type='lowpass';df.frequency.value=220;df.connect(this.drone);this.droneF=df;for(const f of[43.6,44.1,65.4,98.2]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(gain(ac,.1,df));o.start();}
  this.pad=gain(ac,0,this.mus);const pf=ac.createBiquadFilter();pf.type='bandpass';pf.frequency.value=900;pf.Q.value=1.5;pf.connect(this.pad);this.padF=pf;for(const f of[233.1,246.9,349.2,370]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;const v=ac.createOscillator();v.frequency.value=4+R()*2;v.connect(gain(ac,f*.006,o.frequency));v.start();o.connect(gain(ac,.05,pf));o.start();}
  this.timer=setInterval(()=>this.tick(),90);});}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 ambience(on){if(!this.ac)return;this.on=on;const t=this.ac.currentTime;this.amb.gain.setTargetAtTime(on?1:0,t,.8);if(!on){this.drone.gain.setTargetAtTime(0,t,.5);this.pad.gain.setTargetAtTime(0,t,.5);}}
 // tension 0..1, chasing, near 0..1 (heartbeat)
 mood(tension,chase,near){this.tension=tension;this.chase=chase;this.near=near;if(!this.ac||!this.on)return;const t=this.ac.currentTime;this.drone.gain.setTargetAtTime(.05+tension*.12,t,1.5);this.droneF.frequency.setTargetAtTime(160+tension*500,t,1);this.pad.gain.setTargetAtTime(chase?.32:tension>.5?(tension-.5)*.25:0,t,chase?.25:1.6);this.padF.frequency.setTargetAtTime(chase?1800:700,t,.6);}
 listener(x,y,z,yaw){this.lp.x=x;this.lp.y=y;this.lp.z=z;this.lp.yaw=yaw;}
 tick(){if(!this.ac||!this.on)return;const t=this.ac.currentTime;
  if(this.near>.04&&t>=this.nextBeat){const n=this.near;this.nextBeat=t+60/(58+n*95);this._o(this.sfx,'sine',62,38,.16,.5*n+.1,0);this._o(this.sfx,'sine',55,34,.14,.32*n+.06,.24);this._n(this.sfx,.08,180,60,1,.25*n,'lowpass',0);}
  if(this.chase&&t>=this.nextPulse){this.nextPulse=t+.42;this._o(this.mus,'sawtooth',55,52,.35,.12,0,.01);this._o(this.mus,'square',110,108,.08,.04,0);if(R()<.18)this._o(this.mus,'sawtooth',1480+R()*200,1200,.9,.035,0,.25);}
  // the house settles: far creaks, knocks, the odd whisper
  if(R()<.012){const a=R()*6.28,d=6+R()*14;this.creak({x:this.lp.x+Math.cos(a)*d,y:this.lp.y+(R()<.4?3.6:0),z:this.lp.z+Math.sin(a)*d},.35);}
  if(R()<.003){const a=R()*6.28;this.knock({x:this.lp.x+Math.cos(a)*10,y:this.lp.y+(R()<.5?3.6:-3.6),z:this.lp.z+Math.sin(a)*10});}
  if(R()<.0016+this.tension*.002)this.whisper();
  if(this.clock){const c=this.clock;if(t>=(this.nextTick||0)){this.nextTick=t+1;this.play(c,.25,(g,v)=>{this._n(g,.03,4200,2600,6,.5*v,'bandpass');this._o(g,'square',2400,2300,.02,.04*v);});}}}
 /* ---------- primitives ---------- */
 _o(dst,type,f0,f1,dur,vol,delay=0,atk=.004){if(vol<.002)return;return tone(this.ac,dst,this.ac.currentTime+delay,type,f0,f1,dur,vol,atk);}
 _n(dst,dur,f0,f1,q,vol,type='lowpass',delay=0,atk=0){if(vol<.002)return;return hiss(this.ac,this.noise,dst,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,atk);}
 // positioned destination: distance falloff, stereo pan by listener yaw, a low-pass when the sound is on another floor
 play(pos,vol,fn,range=22,wet=.25){if(!this.ac)return;let v=vol,pan=0,muff=0;if(pos){const dx=pos.x-this.lp.x,dy=(pos.y??this.lp.y)-this.lp.y,dz=pos.z-this.lp.z,d=Math.hypot(dx,dz);v*=1/(1+(d/(range*.3))**2);if(Math.abs(dy)>2)muff=Math.min(1,Math.abs(dy)/4);
   if(d>.4){const rx=Math.cos(this.lp.yaw),rz=-Math.sin(this.lp.yaw);pan=Math.max(-.9,Math.min(.9,(dx*rx+dz*rz)/d));}}if(v<.004)return;
  const ac=this.ac,g=ac.createGain();g.gain.value=1;let out=g;if(muff){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=900-muff*600;g.connect(f);out=f;v*=1-muff*.35;}
  let fin=out;if(pan&&ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=pan;out.connect(p);fin=p;}fin.connect(this.sfx);if(wet)fin.connect(gain(ac,wet,this.room));fn(g,v);}
 /* ---------- the player ---------- */
 step(surf,vol,run){if(!this.ac)return;const g=this.sfx,v=vol*(run?1.3:1);if(surf==='stonef'||surf==='marble'||surf==='ktile'){this._n(g,.07,2600,600,1.2,.16*v);this._o(g,'triangle',160,90,.05,.05*v);}else{this._n(g,.1,900,180,1,.22*v);this._o(g,'sine',110,60,.07,.1*v);}
  if(R()<(surf==='oak'||surf==='planks'?.14:.03))this.creak(null,.25*v);}
 creak(pos,vol=.4){this.play(pos,vol,(g,v)=>{const ac=this.ac,t=ac.currentTime,o=ac.createOscillator();o.type='sawtooth';const f=140+R()*120;o.frequency.setValueAtTime(f,t);for(let i=1;i<8;i++)o.frequency.linearRampToValueAtTime(f*(1+(R()-.5)*.25)*(1-i*.03),t+i*.07);
  const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=700+R()*500;bp.Q.value=6;const e=ac.createGain();e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(.22*v,t+.08);e.gain.exponentialRampToValueAtTime(.001,t+.6);o.connect(bp);bp.connect(e);e.connect(g);o.start(t);o.stop(t+.65);},30,.4);}
 knock(pos){this.play(pos,.7,(g,v)=>{for(let i=0;i<(R()<.5?1:3);i++){this._o(g,'sine',90,45,.18,.5*v,i*.32);this._n(g,.1,500,120,1,.3*v,'lowpass',i*.32);}},40,.6);}
 whisper(){if(!this.ac)return;const pan=(R()-.5)*1.6;const ac=this.ac,p=ac.createStereoPanner();p.pan.value=pan;p.connect(this.sfx);p.connect(this.verb);for(let i=0;i<4;i++){const f0=1200+R()*1800;this._n(p,.25+R()*.3,f0,f0*(.7+R()*.6),9,.05,'bandpass',i*.28,.06);}}
 breath(hold){if(!this.ac)return;if(hold)this._n(this.sfx,.5,700,300,1,.12,'bandpass',0,.08);else this._n(this.sfx,.8,900,400,.8,.16,'bandpass',0,.05);}
 gasp(){if(!this.ac)return;this._n(this.sfx,.45,1400,500,1,.35,'bandpass',0,.02);this._n(this.sfx,.9,800,300,1,.2,'bandpass',.45,.1);}
 pant(v){if(!this.ac)return;this._n(this.sfx,.32,1100,500,1,.07*v,'bandpass',0,.05);}
 click(){if(!this.ac)return;this._o(this.sfx,'square',2200,1800,.02,.08);this._n(this.sfx,.02,5000,3000,2,.1,'bandpass',.015);}
 battery(){if(!this.ac)return;for(let i=0;i<3;i++){this._n(this.sfx,.03,3000,1500,3,.18,'bandpass',i*.12);this._o(this.sfx,'square',900+i*300,700,.025,.05,i*.12);}}
 pickup(kind){if(!this.ac)return;const b=kind==='key'?[1046,1568]:kind==='note'?null:[784,1175];if(!b){this._n(this.sfx,.35,3000,1200,1,.12,'bandpass',0,.05);this._n(this.sfx,.25,2500,900,1,.08,'bandpass',.25,.04);return;}
  for(let i=0;i<b.length;i++)this._o(this.sfx,'sine',b[i],b[i],.6,.07,i*.08,.01);this._n(this.sfx,.08,4000,2000,2,.06,'bandpass');}
 sigil(){if(!this.ac)return;for(const[f,d]of[[261.6,0],[392,.05],[523.3,.1],[622.3,.16],[1046.5,.22]]){const g=this._o(this.mus,'sine',f,f*.999,3.5,.09,d,.01);if(g)g.connect(gain(this.ac,.6,this.verb));}this._o(this.mus,'sine',65.4,65,3,.2,0,.05);}
 /* ---------- the house ---------- */
 door(pos,kind){this.play(pos,kind==='slam'?1:.6,(g,v)=>{const ac=this.ac,t=ac.currentTime;if(kind==='slam'){this._o(g,'sine',80,38,.3,.9*v);this._n(g,.35,1800,200,1,.7*v);for(let i=0;i<3;i++)this._n(g,.04,3000,2000,4,.15*v,'bandpass',.08+i*.05);return;}
  const o=ac.createOscillator();o.type='sawtooth';const f=260+R()*80;o.frequency.setValueAtTime(f,t);o.frequency.linearRampToValueAtTime(f*.62,t+.9);const v2=ac.createOscillator();v2.frequency.value=17;const vg=gain(ac,f*.05,o.frequency);v2.connect(vg);v2.start(t);v2.stop(t+1);
  const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1200;bp.Q.value=9;const e=ac.createGain();e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(.3*v,t+.1);e.gain.exponentialRampToValueAtTime(.001,t+1);o.connect(bp);bp.connect(e);e.connect(g);o.start(t);o.stop(t+1.05);this._n(g,.5,700,300,1,.12*v,'lowpass',.1,.1);},30,.5);}
 locked(pos){this.play(pos,.6,(g,v)=>{for(let i=0;i<4;i++){this._n(g,.04,2500,1200,3,.35*v,'bandpass',i*.09);this._o(g,'square',300,200,.03,.05*v,i*.09);}});}
 grind(pos){this.play(pos,.9,(g,v)=>{const ac=this.ac,t=ac.currentTime;const s=this._n(g,.75,500,300,2,.45*v,'lowpass',0,.08);this._o(g,'sawtooth',55,48,.7,.12*v,0,.05);this._n(g,.05,2000,900,2,.3*v,'bandpass',.7);});}
 clunk(pos){this.play(pos,1,(g,v)=>{this._o(g,'square',120,60,.15,.4*v);this._n(g,.2,2500,300,1,.6*v);this._o(g,'sine',60,40,.4,.6*v);});}
 power(){if(!this.ac)return;const t=this.ac.currentTime;const g=gain(this.ac,0,this.sfx);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.6);g.gain.exponentialRampToValueAtTime(.001,t+4);for(const f of[50,100,150]){const o=this.ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(g);o.start(t);o.stop(t+4);}
  for(let i=0;i<6;i++)this._n(this.sfx,.05,6000,3000,2,.2,'bandpass',.3+R()*1.4);}
 buzz(pos){this.play(pos,.25,(g,v)=>{this._o(g,'sawtooth',100,100,.15,.12*v);this._n(g,.1,5000,3000,3,.1*v,'bandpass');},12,0);}
 safeTick(){if(!this.ac)return;this._n(this.sfx,.02,4500,3000,8,.25,'bandpass');this._o(this.sfx,'square',1500,1400,.015,.04);}
 safeOpen(ok,pos){this.play(pos,.8,(g,v)=>{if(ok){this._o(g,'square',400,200,.1,.15*v);this._n(g,.3,1500,300,1,.4*v,'lowpass',.1);this._o(g,'sine',90,50,.5,.4*v,.15);}else{this._o(g,'square',160,120,.18,.2*v);this._n(g,.12,900,300,1,.3*v);}});}
 chime(n){if(!this.ac)return;for(let i=0;i<n;i++)for(const f of[196,392,588]){const g=this._o(this.mus,'sine',f,f*.998,2.6,.06,i*1.6,.005);if(g)g.connect(gain(this.ac,.5,this.verb));}}
 musicBox(pos){const mel=[12,15,19,24,22,19,15,17,14,12,7,12];this.play(pos,1,(g,v)=>{mel.forEach((s,i)=>{const f=523*Math.pow(2,s/12)*(1-i*.004);this._o(g,'triangle',f,f*.99,.9,.11*v,i*.42,.003);this._o(g,'sine',f*2,f*2,.3,.03*v,i*.42);});},20,.6);}
 /* ---------- the creature ---------- */
 stomp(pos,run,above){this.play(pos,run?1.1:.85,(g,v)=>{this._o(g,'sine',run?78:64,34,.24,.75*v);this._n(g,.2,run?900:600,120,1,.5*v);if(R()<.5)this._n(g,.35,2400,1400,6,.06*v,'bandpass',.05,.05);if(above&&R()<.5)this.creak(pos,.6);},34,.3);}
 breathe(pos,v0=1){this.play(pos,.5*v0,(g,v)=>{this._n(g,1.1,420,200,2,.35*v,'bandpass',0,.25);this._o(g,'sawtooth',62,55,1,.05*v,0,.3);},14,.2);}
 growl(pos){this.play(pos,1,(g,v)=>{const ac=this.ac,t=ac.currentTime;const o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(70,t);o.frequency.linearRampToValueAtTime(52,t+1.2);
  const e=ac.createGain();e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(.4*v,t+.15);e.gain.exponentialRampToValueAtTime(.001,t+1.3);const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=600;o.connect(lp);lp.connect(e);e.connect(g);o.start(t);o.stop(t+1.35);
  this._n(g,1.2,900,300,3,.3*v,'bandpass',0,.1);},30,.4);}
 shriek(){if(!this.ac)return;const g=this.sfx;this._n(g,.9,6000,1500,1,.9,'highpass',0,.005);this._o(g,'sawtooth',1100,180,.9,.4,0,.005);this._o(g,'sawtooth',1170,200,.9,.3,0,.005);this._o(g,'sine',70,30,.8,1,0,.005);this._n(this.verb,.6,3000,800,1,.6);}
 stinger(kind){if(!this.ac)return;const m=this.mus;if(kind==='spot'){for(const f of[466,494,523,740]){this._o(m,'sawtooth',f,f*1.02,1.3,.07,0,.02);}this._o(m,'sine',55,40,1.4,.5,0,.01);this._n(m,.8,4000,800,1,.25,'bandpass',0,.01);}
  else if(kind==='notice'){this._o(m,'sine',880,870,1.6,.06,0,.2);this._o(m,'sine',932,925,1.6,.05,0,.2);}
  else if(kind==='lost'){this._o(m,'triangle',220,110,2.5,.08,0,.3);}
  else if(kind==='scare'){this._n(m,.5,5000,500,1,.6,'lowpass',0,.003);for(const f of[311,330,349])this._o(m,'sawtooth',f,f*.9,.8,.12,0,.003);this._o(m,'sine',60,30,.9,.8,0,.003);}}
}
