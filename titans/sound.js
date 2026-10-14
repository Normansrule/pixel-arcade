// HARDFALL — WebAudio synthesis (no audio files): spatial gun / frame / impact one-shots, wall-run + frame servo loops, ambience, music, announcer.
import {boot,SpatialSound} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.beds(ac,1600);});}
 ambience(theme){if(!this.ac)return;const cfg={dusk:[700,.06,0,0],neon:[380,.06,52,.02]}[theme]||[300,0,0,0];this.amb(cfg);this.hum0=cfg[3];}
 jet(on,k=1){if(!this.ac)return;const t=this.ac.currentTime;this.jg.gain.setTargetAtTime(on?.08*k:0,t,.05);this.jf.frequency.setTargetAtTime(on?1400+Math.random()*400:900,t,.05);}
 mech(on,sp=0){if(!this.ac)return;const t=this.ac.currentTime;this.hg.gain.setTargetAtTime(on?.05+sp*.004:this.hum0||0,t,.2);this.hum.frequency.setTargetAtTime(on?38+sp*2:50,t,.2);}
 play(k,pos=null,vol=1,a=0){if(!this.ac)return;try{const r=1+(Math.random()-.5)*.08;let d;
  const D=(v,range)=>(d=this._dst(pos,v*vol,range));
  switch(k){
  case'rifle':if(!D(.55,80))return;this._n(d,.09,5200*r,900,.8,.45,'bandpass');this._o(d,'square',420*r,90,.07,.16);this._o(d,'sine',160,50,.08,.3);break;
  case'carbine':if(!D(.45,70))return;this._n(d,.1,3600*r,700,.8,.38,'bandpass');this._o(d,'triangle',380*r,80,.08,.18);break;
  case'shotgun':if(!D(.85,90))return;this._n(d,.45,3800,120,.6,.65);this._o(d,'sine',110,32,.35,.6);this._n(d,.08,9000,3000,.6,.25,'highpass');this._n(d,.08,1500,600,2,.2,'bandpass',.42);break;
  case'seeker':if(!D(.45,60))return;this._o(d,'square',1500*r,400,.05,.12);this._n(d,.07,6400,1600,.9,.35,'bandpass');this._o(d,'sine',2200,2100,.06,.06);break;
  case'chaingun':if(!D(.75,120))return;this._n(d,.11,2600*r,300,.7,.55);this._o(d,'sawtooth',180*r,50,.09,.3);this._o(d,'sine',70,30,.12,.5);break;
  case'spin':if(!D(.35,40))return;this._o(d,'sawtooth',90,a?420:90,.4,.08,0,.2);break;
  case'rocket':if(!D(.75,100))return;this._n(d,.6,900,3000,1,.4,'bandpass');this._o(d,'sawtooth',160,60,.4,.18);break;
  case'boom':if(!D(1,160))return;this._n(d,1.3,2600,50,.5,.9);this._o(d,'sine',95,24,1.1,.9);this._n(d,.25,8000,1000,.5,.35,'highpass');break;
  case'mechBoom':if(!D(1.2,220))return;this._n(d,2.6,1800,30,.4,1);this._o(d,'sine',70,18,2.2,1);this._n(d,.4,6000,600,.5,.5,'highpass');this._n(d,1.6,900,60,.6,.5,'lowpass',.25);break;
  case'stomp':if(!D(.7,90))return;this._o(d,'sine',62*r,26,.32,.9);this._n(d,.2,600,90,.8,.5);this._n(d,.05,3200,900,2,.15,'bandpass',.02);break;
  case'servo':if(!D(.3,40))return;this._o(d,'sawtooth',140*r,110,.18,.05);this._n(d,.16,1800,1200,4,.12,'bandpass');break;
  case'dash':if(!D(.7,70))return;this._n(d,.5,700,3200,1.1,.55,'bandpass');this._o(d,'sawtooth',90,220,.4,.15);this._o(d,'sine',50,30,.3,.5);break;
  case'aegis':if(!D(.6,60))return;this._o(d,'sine',220,880,.5,.25,0,.15);this._o(d,'triangle',440,1760,.5,.1,0,.15);this._n(d,.5,3000,9000,3,.15,'bandpass');break;
  case'aegisHit':if(!D(.4,60))return;this._o(d,'triangle',1800*r,900,.08,.15);break;
  case'punch':if(!D(.8,60))return;this._n(d,.3,1400,120,.8,.7);this._o(d,'sine',90,30,.3,.7);break;
  case'incoming':D(.6);this._o(d,'sine',2400,500,2.2,.2,0,.4);this._n(d,2.2,800,5000,2,.15,'bandpass');break;
  case'mechLand':if(!D(1.2,200))return;this._n(d,1.6,2000,40,.4,1);this._o(d,'sine',58,16,1.4,1);this._n(d,.3,4000,800,1,.4,'bandpass');break;
  case'hatch':if(!D(.5,30))return;this._o(d,'sawtooth',120,60,.4,.12);this._n(d,.3,2000,400,2,.25,'bandpass',.1);this._o(d,'square',300,300,.06,.1,.45);break;
  case'boot':D(.5);[330,440,554,660,880].forEach((f,i)=>this._o(d,'triangle',f,f,.18,.12,i*.09));this._o(d,'sine',55,110,.9,.4);break;
  case'eject':D(.8);this._n(d,.8,500,4000,1,.6,'bandpass');this._o(d,'sawtooth',200,900,.5,.2);this._o(d,'sine',80,40,.6,.6);break;
  case'alarm':D(.4);this._o(d,'square',880,880,.12,.1);this._o(d,'square',660,660,.12,.1,.16);break;
  case'ready':D(.6);[523,659,784,1046,1318].forEach((f,i)=>this._o(d,'triangle',f,f,.3,.14,i*.07));break;
  case'lock':D(.3);this._o(d,'square',a?2400:1700,a?2400:1700,.04,.08);break;
  case'wallrun':if(!D(.3,30))return;this._n(d,.4,1800,900,1.2,.22,'bandpass');break;
  case'hitArmor':if(!D(.45,60))return;this._o(d,'square',900*r,400,.06,.12);this._n(d,.06,5000,2000,2,.12,'bandpass');break;
  case'hitBody':if(!D(.5,50))return;this._o(d,'sine',220*r,70,.1,.4);this._n(d,.06,1200,300,1,.25);break;
  case'headshot':if(!D(.8,80))return;this._o(d,'sine',2600,2500,.18,.3);this._o(d,'sine',3900,3800,.12,.18);this._o(d,'triangle',1300,600,.08,.25);break;
  case'hitmark':D(.35);this._o(d,'square',a?1900:1500,a?1700:1300,.03,.12);break;
  case'kill':D(.5);this._o(d,'sine',880,880,.1,.25);this._o(d,'sine',1320,1320,.18,.25,.08);break;
  case'melee':if(!D(.6,40))return;this._n(d,.16,1800,200,1,.5);this._o(d,'sine',140,60,.15,.5);break;
  case'jump':if(!D(.25,30))return;this._n(d,.15,700,2500,1.4,.25,'bandpass');break;
  case'thrust':if(!D(.35,40))return;this._n(d,.25,1200,3500,1.2,.35,'bandpass');this._o(d,'sine',300,120,.2,.1);break;
  case'land':if(!D(.3,30))return;this._o(d,'sine',100,45,.12,.4*Math.min(1,a/10));this._n(d,.08,900,200,1,.2);break;
  case'step':if(!D(.12,20))return;this._n(d,.05,1400*r,500,1.2,.3,'bandpass');break;
  case'slide':if(!D(.3,30))return;this._n(d,.5,2500,600,.7,.25,'bandpass');break;
  case'reload':if(!D(.35,25))return;this._n(d,.05,3000,1500,2,.4,'bandpass');this._n(d,.06,2400,1200,2,.4,'bandpass',.35);this._o(d,'square',300,200,.04,.1,.6);break;
  case'empty':D(.3);this._o(d,'square',1800,1700,.02,.12);break;
  case'swap':D(.25);this._n(d,.12,1800,800,2,.35,'bandpass');break;
  case'throw':if(!D(.35,30))return;this._n(d,.2,600,2200,1.5,.35,'bandpass');break;
  case'tink':if(!D(.3,40))return;this._o(d,'sine',2600*r,2400,.08,.15);break;
  case'beep':D(.4);this._o(d,'square',a?1046:660,a?1046:660,a?.5:.15,.1);break;
  case'horn':D(.6);[196,247,294,392].forEach(f=>this._o(d,'sawtooth',f,f,1.6,.06,0,.05));break;
  case'medal':D(.45);[880,1175,1568].forEach((f,i)=>this._o(d,'triangle',f,f,.22,.13,i*.05));break;
  case'spawn':if(!D(.35,40))return;this._o(d,'sine',200,800,.4,.15);this._n(d,.4,600,3000,2,.12,'bandpass');break;
  case'death':if(!D(.5,50))return;this._o(d,'sawtooth',300,60,.6,.15);this._n(d,.5,2000,200,.8,.3);break;
  case'pickup':D(.45);this._o(d,'triangle',660,660,.08,.2);this._o(d,'triangle',990,990,.12,.2,.06);break;
  }}catch(e){}}
 // tiny music sequencer (bass + arp + hats); intensity 0..1
 music(on,intensity=0){if(!this.ac)return;this.musI=intensity;if(on&&!this.mus){const st={step:0,next:this.ac.currentTime+.1};this.mus=st;const tick=()=>{if(this.mus!==st)return;const ac=this.ac,spb=60/118/4;
   while(st.next<ac.currentTime+.25){const s=st.step%64,bar=(st.step/16|0)%4,root=[40,36,43,38][bar],t=st.next;const hz=m=>440*Math.pow(2,(m-69)/12);
    const g=ac.createGain();g.connect(this.musG);this._v=1;
    if(s%4===0||s%16===14){const o=ac.createOscillator(),f=ac.createBiquadFilter(),gg=ac.createGain();o.type='sawtooth';o.frequency.value=hz(root-12);f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(140,t+.22);gg.gain.setValueAtTime(.32,t);gg.gain.exponentialRampToValueAtTime(.001,t+.24);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+.26);}
    const arp=[0,7,12,15,19,15,12,7][s%8];if(s%2===0||this.musI>.5){const o=ac.createOscillator(),gg=ac.createGain();o.type='triangle';o.frequency.value=hz(root+12+arp);gg.gain.setValueAtTime(.07*(.6+this.musI*.6),t);gg.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.18);}
    if(s%4===2||this.musI>.6&&s%2===1){const n=ac.createBufferSource(),f=ac.createBiquadFilter(),gg=ac.createGain();n.buffer=this.noise;f.type='highpass';f.frequency.value=7000;gg.gain.setValueAtTime(.05,t);gg.gain.exponentialRampToValueAtTime(.001,t+.05);n.connect(f);f.connect(gg);gg.connect(g);n.start(t,Math.random());n.stop(t+.06);}
    if(s%16===8&&this.musI>.3){const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.2);gg.gain.setValueAtTime(.3,t);gg.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.26);}
    st.step++;st.next+=spb;}setTimeout(tick,60);};tick();}
  else if(!on&&this.mus){this.mus=null;}}}
