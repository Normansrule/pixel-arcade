// ZENITH PROTOCOL — WebAudio synthesis (no audio files): spatial weapon/impact/ability one-shots, heal-beam loop, payload hum,
// ambience, a small music sequencer and a speech-synthesis announcer. Adapted from NOVA ARENA.
import {boot,SpatialSound} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.beds(ac,900);});}
 ambience(theme){if(!this.ac)return;this.amb({coast:[700,.05,0,0],neon:[320,.05,52,.025]}[theme]||[300,0,0,0]);}
 jet(on,k=1){if(!this.ac)return;const t=this.ac.currentTime;this.jg.gain.setTargetAtTime(on?.13*k:0,t,.05);this.jf.frequency.setTargetAtTime(on?700+Math.random()*300:500,t,.05);}
 beam(on,heal=true){if(!this.ac)return;const t=this.ac.currentTime;if(!this.bo){const o=this.ac.createOscillator(),o2=this.ac.createOscillator(),g=this.ac.createGain();o.type='sine';o2.type='triangle';o.frequency.value=660;o2.frequency.value=990;g.gain.value=0;o.connect(g);o2.connect(g);g.connect(this.sfx);o.start();o2.start();this.bo=[o,o2,g];}
  this.bo[2].gain.setTargetAtTime(on?.05:0,t,.06);this.bo[0].frequency.setTargetAtTime(heal?660+Math.sin(t*6)*20:300,t,.05);this.bo[1].frequency.setTargetAtTime(heal?990:450,t,.05);}
 cart(k){if(!this.ac)return;const t=this.ac.currentTime;this.hum.frequency.setTargetAtTime(k>0?48+k*10:52,t,.3);this.hg.gain.setTargetAtTime(k>0?.04+k*.01:0,t,.3);}
 play(k,pos=null,vol=1,a=0){if(!this.ac)return;
  // voice budget: the same cue at most once per 35ms, and at most 28 cues per 250ms window (keeps the audio graph light in big fights)
  const now=this.ac.currentTime,lt=(this._lt||(this._lt={}));if(lt[k]!==undefined&&now-lt[k]<.035)return;if(now-(this._w0||0)>.25){this._w0=now;this._wn=0;}if(++this._wn>28&&!['kill','horn','cp','overtime','ultReady','beep'].includes(k))return;lt[k]=now;
  try{const r=1+(Math.random()-.5)*.08;let d;
  const D=(v,range)=>(d=this._dst(pos,v*vol,range));
  switch(k){
  case'rivet':if(!D(.5,70))return;this._o(d,'square',420*r,90,.08,.2);this._n(d,.08,3000,500,.8,.35,'bandpass');this._o(d,'sine',120,50,.08,.3);break;
  case'scrap':if(!D(.85,90))return;this._n(d,.45,3800,120,.6,.65);this._o(d,'sine',110,32,.35,.6);this._n(d,.07,9000,3000,.6,.25,'highpass');break;
  case'arc':if(!D(.45,70))return;this._o(d,'square',1500*r,300,.06,.12);this._o(d,'sawtooth',640*r,120,.07,.1);this._n(d,.05,7000,2000,.8,.2,'bandpass');break;
  case'longbow':if(!D(.9,160))return;this._n(d,.25,12000,2000,.7,.4,'highpass');this._o(d,'sawtooth',2000,80,.45,.25);this._o(d,'sine',1400,1380,.6,.1,.02);this._o(d,'sine',85,30,.4,.5);break;
  case'lbcharge':if(!D(.3,30))return;this._o(d,'sine',300,1200,.5,.08,0,.3);break;
  case'ember':if(!D(.7,90))return;this._o(d,'sine',300*r,70,.3,.45);this._n(d,.25,1800,200,1,.35,'bandpass');this._o(d,'triangle',700,160,.15,.1);break;
  case'dart':if(!D(.5,70))return;this._o(d,'triangle',1800*r,700,.08,.2);this._n(d,.06,8000,4000,2,.15,'bandpass');this._o(d,'sine',500,200,.06,.15);break;
  case'healHit':if(!D(.4,40))return;[880,1320].forEach((f,i)=>this._o(d,'sine',f,f*1.01,.18,.12,i*.05));break;
  case'barrier':if(!D(.7,60))return;this._o(d,'sawtooth',90,180,.5,.12,0,.05);this._n(d,.5,600,4000,2,.25,'bandpass');[440,660].forEach((f,i)=>this._o(d,'triangle',f,f,.4,.08,i*.06));break;
  case'barrierHit':if(!D(.3,40))return;this._o(d,'triangle',1200*r,500,.08,.12);break;
  case'barrierBreak':if(!D(.8,60))return;this._n(d,.6,9000,800,.8,.45,'highpass');[1400,1100,800,600].forEach((f,i)=>this._o(d,'triangle',f,f*.5,.4,.12,i*.04));break;
  case'charge':if(!D(.8,60))return;this._n(d,.7,300,1800,1.4,.4,'bandpass');this._o(d,'sawtooth',70,140,.7,.18);break;
  case'slam':if(!D(1,120))return;this._n(d,1.2,1800,40,.5,.9);this._o(d,'sine',70,22,1.1,.9);this._o(d,'square',140,40,.4,.2);break;
  case'dome':if(!D(.7,60))return;this._o(d,'sine',200,800,.6,.2,0,.2);this._n(d,.6,400,3000,3,.2,'bandpass');break;
  case'leap':if(!D(.6,50))return;this._n(d,.4,500,2400,1.2,.35,'bandpass');this._o(d,'sine',90,180,.3,.3);break;
  case'well':if(!D(.8,80))return;this._o(d,'sawtooth',50,200,1.4,.15,0,.3);this._o(d,'sine',400,60,1.6,.25);this._n(d,1.4,200,2000,4,.2,'bandpass');break;
  case'blink':if(!D(.6,50))return;this._o(d,'sine',2200,300,.25,.25);this._n(d,.2,8000,1000,3,.2,'bandpass');break;
  case'volley':if(!D(.6,80))return;this._n(d,.25,2400,400,1,.4,'bandpass');this._o(d,'sawtooth',500,1200,.2,.08);break;
  case'hook':if(!D(.6,50))return;this._o(d,'square',300,1600,.2,.12);this._n(d,.4,1200,3000,2,.25,'bandpass');break;
  case'scan':if(!D(.7,80))return;[0,.12,.24].forEach(t=>this._o(d,'sine',1600,1200,.25,.15,t));this._o(d,'sine',200,800,.5,.15);break;
  case'mark':D(.8);this._o(d,'sawtooth',110,110,1.2,.1,0,.1);[330,415,494].forEach((f,i)=>this._o(d,'triangle',f,f,1,.1,i*.08));break;
  case'fire':if(!D(.6,60))return;this._n(d,1.2,600,2400,.7,.4,'bandpass');this._o(d,'sawtooth',80,60,1,.12);break;
  case'meteorWarn':if(!D(.8,120))return;this._o(d,'sine',1800,200,1.2,.18);this._n(d,1.2,500,6000,1,.2,'bandpass');break;
  case'gdash':if(!D(.5,40))return;this._o(d,'sine',600,1600,.3,.15);this._n(d,.3,3000,6000,2,.15,'bandpass');break;
  case'sanct':if(!D(.6,50))return;[523,659,784,1046].forEach((f,i)=>this._o(d,'sine',f,f,.6,.1,i*.05));break;
  case'revive':D(.9);[392,523,659,784,1046].forEach((f,i)=>this._o(d,'triangle',f,f,.9,.14,i*.09));this._o(d,'sine',130,260,1.2,.3);break;
  case'tempo':if(!D(.6,50))return;[0,.1,.2,.3].forEach((t,i)=>this._o(d,'square',[440,554,659,880][i],[440,554,659,880][i],.08,.1,t));break;
  case'bass':if(!D(.8,70))return;this._o(d,'sine',160,40,.5,.7);this._n(d,.3,800,100,1,.3);this._o(d,'triangle',880,880,.2,.1,.05);break;
  case'amp':D(.8);this._o(d,'sawtooth',220,440,.8,.12,0,.1);this._o(d,'sawtooth',277,554,.8,.1,0,.1);this._o(d,'sine',110,110,1,.3);break;
  case'stun':if(!D(.5,40))return;[1800,2200,1600].forEach((f,i)=>this._o(d,'sine',f,f,.15,.1,i*.08));break;
  case'ultReady':D(.6);[523,784,1046].forEach((f,i)=>this._o(d,'triangle',f,f,.3,.15,i*.07));break;
  case'cp':D(.8);[523,659,784,1046,784,1046].forEach((f,i)=>this._o(d,'square',f,f,.15,.08,i*.1));break;
  case'overtime':D(.8);[880,660,880,660,880].forEach((f,i)=>this._o(d,'square',f,f,.12,.1,i*.13));break;
  case'abilityCd':D(.3);this._o(d,'square',300,280,.05,.08);break;
  case'pulse':if(!D(.5,70))return;this._o(d,'square',1300*r,260,.07,.14);this._o(d,'sawtooth',520*r,90,.09,.12);this._n(d,.06,6000,1500,.8,.22,'bandpass');break;
  case'carbine':if(!D(.55,90))return;this._o(d,'triangle',820*r,150,.11,.3);this._n(d,.09,3200,500,.9,.3,'bandpass');this._o(d,'sine',150,50,.12,.25);break;
  case'scatter':if(!D(.8,90))return;this._n(d,.42,4200,140,.6,.6);this._o(d,'sine',120,36,.35,.55);this._n(d,.08,9000,3000,.6,.25,'highpass');break;
  case'charge':if(!D(.45,40))return;this._o(d,'sine',220,1500,.42,.12,0,.2);this._o(d,'triangle',110,750,.42,.08,0,.2);break;
  case'rail':if(!D(.9,160))return;this._n(d,.25,12000,2000,.7,.45,'highpass');this._o(d,'sawtooth',2400,70,.5,.28);this._o(d,'sine',1210,1180,.9,.12,.02);this._o(d,'sine',1820,1790,.7,.08,.02);this._o(d,'sine',90,30,.4,.5);break;
  case'plasma':if(!D(.7,90))return;this._o(d,'sine',360*r,70,.35,.45);this._n(d,.3,1600,200,1,.35,'bandpass');this._o(d,'triangle',900,200,.2,.12);break;
  case'boom':if(!D(1,150))return;this._n(d,1.3,2600,50,.5,.9);this._o(d,'sine',95,24,1.1,.9);this._n(d,.25,8000,1000,.5,.35,'highpass');break;
  case'blade':if(!D(.6,40))return;this._n(d,.28,500,3800,2,.45,'bandpass');this._o(d,'sawtooth',180,420,.25,.08);break;
  case'bladeHum':if(!D(.25,20))return;this._o(d,'sawtooth',96,100,.3,.05);break;
  case'melee':if(!D(.6,40))return;this._n(d,.16,1800,200,1,.5);this._o(d,'sine',140,60,.15,.5);break;
  case'hitShield':if(!D(.45,50))return;this._o(d,'triangle',2100*r,900,.12,.22);this._n(d,.08,7000,3000,2,.12,'bandpass');break;
  case'hitBody':if(!D(.5,50))return;this._o(d,'sine',220*r,70,.1,.4);this._n(d,.06,1200,300,1,.25);break;
  case'headshot':if(!D(.8,80))return;this._o(d,'sine',2600,2500,.18,.3);this._o(d,'sine',3900,3800,.12,.18);this._o(d,'triangle',1300,600,.08,.25);break;
  case'hitmark':D(.35);this._o(d,'square',a?1900:1500,a?1700:1300,.03,.12);break;
  case'kill':D(.5);this._o(d,'sine',880,880,.1,.25);this._o(d,'sine',1320,1320,.18,.25,.08);break;
  case'shieldBreak':if(!D(.7,50))return;this._n(d,.45,9000,1200,.8,.4,'highpass');[1600,1250,980].forEach((f,i)=>this._o(d,'triangle',f,f*.5,.35,.12,i*.04));break;
  case'recharge':D(.35);this._o(d,'sine',300,1400,.7,.12,0,.3);this._o(d,'triangle',150,700,.7,.06,0,.3);break;
  case'lowShield':D(.3);this._o(d,'square',720,720,.07,.08);this._o(d,'square',720,720,.07,.08,.14);break;
  case'jump':if(!D(.25,30))return;this._n(d,.15,700,2500,1.4,.25,'bandpass');break;
  case'land':if(!D(.3,30))return;this._o(d,'sine',100,45,.12,.4*Math.min(1,a/10));this._n(d,.08,900,200,1,.2);break;
  case'step':if(!D(.12,20))return;this._n(d,.05,1400*r,500,1.2,.3,'bandpass');break;
  case'jetPuff':if(!D(.3,40))return;this._n(d,.3,900,600,.8,.35,'bandpass');break;
  case'slide':if(!D(.3,30))return;this._n(d,.5,2500,600,.7,.25,'bandpass');break;
  case'pad':if(!D(.6,50))return;this._o(d,'sine',180,900,.35,.35);this._o(d,'triangle',360,1600,.3,.12);this._n(d,.3,800,4000,1,.2,'bandpass');break;
  case'tele':if(!D(.6,50))return;this._o(d,'sine',1600,200,.5,.25);this._o(d,'sawtooth',400,1600,.4,.06);this._n(d,.4,5000,300,3,.2,'bandpass');break;
  case'pickup':D(.45);this._o(d,'triangle',660,660,.08,.2);this._o(d,'triangle',990,990,.12,.2,.06);break;
  case'power':D(.7);[523,659,784,1046].forEach((f,i)=>this._o(d,'triangle',f,f,.35,.18,i*.06));this._o(d,'sine',130,260,.6,.3);break;
  case'reload':if(!D(.35,25))return;this._n(d,.05,3000,1500,2,.4,'bandpass');this._n(d,.06,2400,1200,2,.4,'bandpass',.35);this._o(d,'square',300,200,.04,.1,.6);break;
  case'empty':D(.3);this._o(d,'square',1800,1700,.02,.12);break;
  case'swap':D(.25);this._n(d,.12,1800,800,2,.35,'bandpass');break;
  case'throw':if(!D(.35,30))return;this._n(d,.2,600,2200,1.5,.35,'bandpass');break;
  case'tink':if(!D(.3,40))return;this._o(d,'sine',2600*r,2400,.08,.15);break;
  case'stick':if(!D(.6,40))return;this._o(d,'sawtooth',400,1600,.25,.12);this._n(d,.4,3000,6000,4,.2,'bandpass');break;
  case'beep':D(.4);this._o(d,'square',a?1046:660,a?1046:660,a?.5:.15,.1);break;
  case'horn':D(.6);[196,247,294,392].forEach(f=>this._o(d,'sawtooth',f,f,1.6,.06,0,.05));break;
  case'medal':D(.45);[880,1175,1568].forEach((f,i)=>this._o(d,'triangle',f,f,.22,.13,i*.05));break;
  case'streak':D(.6);[392,523,659,784].forEach((f,i)=>this._o(d,'sawtooth',f,f*1.002,.5,.06,i*.07));this._o(d,'sine',98,98,.8,.25);break;
  case'hill':D(.5);[660,550,660,550].forEach((f,i)=>this._o(d,'square',f,f,.12,.08,i*.14));break;
  case'spawn':if(!D(.35,40))return;this._o(d,'sine',200,800,.4,.15);this._n(d,.4,600,3000,2,.12,'bandpass');break;
  case'death':if(!D(.5,50))return;this._o(d,'sawtooth',300,60,.6,.15);this._n(d,.5,2000,200,.8,.3);break;
  }}catch(e){}}
 // tiny music sequencer (bass + arp + hats); intensity 0..1
 music(on,intensity=0){if(!this.ac)return;this.musI=intensity;if(on&&!this.mus){const st={step:0,next:this.ac.currentTime+.1};this.mus=st;const tick=()=>{if(this.mus!==st)return;const ac=this.ac,spb=60/118/4;
   while(st.next<ac.currentTime+.25){const s=st.step%64,bar=(st.step/16|0)%4,root=[45,41,48,43][bar],t=st.next;const hz=m=>440*Math.pow(2,(m-69)/12);
    const g=ac.createGain();g.connect(this.musG);this._v=1;
    if(s%4===0||s%16===14){const o=ac.createOscillator(),f=ac.createBiquadFilter(),gg=ac.createGain();o.type='sawtooth';o.frequency.value=hz(root-12);f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(140,t+.22);gg.gain.setValueAtTime(.32,t);gg.gain.exponentialRampToValueAtTime(.001,t+.24);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+.26);}
    const arp=[0,7,12,15,19,15,12,7][s%8];if(s%2===0||this.musI>.5){const o=ac.createOscillator(),gg=ac.createGain();o.type='triangle';o.frequency.value=hz(root+12+arp);gg.gain.setValueAtTime(.07*(.6+this.musI*.6),t);gg.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.18);}
    if(s%4===2||this.musI>.6&&s%2===1){const n=ac.createBufferSource(),f=ac.createBiquadFilter(),gg=ac.createGain();n.buffer=this.noise;f.type='highpass';f.frequency.value=7000;gg.gain.setValueAtTime(.05,t);gg.gain.exponentialRampToValueAtTime(.001,t+.05);n.connect(f);f.connect(gg);gg.connect(g);n.start(t,Math.random());n.stop(t+.06);}
    if(s%16===8&&this.musI>.3){const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.2);gg.gain.setValueAtTime(.3,t);gg.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.26);}
    st.step++;st.next+=spb;}setTimeout(tick,60);};tick();}
  else if(!on&&this.mus){this.mus=null;}}}
