// AEONFALL — WebAudio synthesis (no audio files): positional combat one-shots, spell casts by element, structures,
// UI chimes, a calm modal music bed with a battle layer, and the announcer.
import {boot,SpatialSound} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 constructor(){super();this.range=55;}
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.beds(ac,700);this.amb([700,.035,0,0]);});}
 play(k,pos=null,vol=1,a=0){if(!this.ac)return;try{const r=1+(Math.random()-.5)*.1;let d;const D=(v,range)=>(d=this._dst(pos,v*vol,range));
  switch(k){
  case'swing':if(!D(.35,40))return;this._n(d,.16,700*r,2600,1.6,.4,'bandpass');break;
  case'heavy':if(!D(.45,40))return;this._n(d,.2,400*r,1800,1.2,.45,'bandpass');this._o(d,'sine',110,50,.15,.35);break;
  case'bow':if(!D(.3,45))return;this._o(d,'triangle',420*r,180,.09,.25);this._n(d,.1,4000,1500,2,.15,'bandpass');break;
  case'gun':if(!D(.35,50))return;this._n(d,.09,3000,600,.8,.35,'bandpass');this._o(d,'square',700*r,180,.06,.12);this._o(d,'sine',1800,2400,.08,.06);break;
  case'magic':if(!D(.28,45))return;this._o(d,'sine',900*r,1400,.12,.18);this._o(d,'triangle',1350*r,600,.1,.08);break;
  case'mshot':if(!D(.12,30))return;this._o(d,'triangle',1100*r,500,.06,.1);break;
  case'mhit':if(!D(.12,30))return;this._n(d,.06,1600*r,500,1,.25);break;
  case'hit':if(!D(.3,40))return;this._o(d,'sine',200*r,70,.1,.35);this._n(d,.07,1400,300,1,.3);break;
  case'tower':if(!D(.5,70))return;this._o(d,'sine',300,1400,.15,.2);this._o(d,'sawtooth',1500,200,.3,.12,.1);this._n(d,.3,6000,800,2,.15,'bandpass',.1);break;
  case'towerhit':if(!D(.55,60))return;this._o(d,'sine',160,40,.35,.6);this._n(d,.3,2400,200,.8,.45);break;
  // spells by element
  case'rock':if(!D(.6,55))return;this._n(d,.45,900,90,.8,.7);this._o(d,'sine',90,35,.4,.6);break;
  case'water':if(!D(.5,55))return;this._n(d,.6,600,2400,1.2,.45,'bandpass');this._n(d,.5,3000,500,.8,.25,'bandpass',.15);this._o(d,'sine',300,120,.4,.15);break;
  case'fire':if(!D(.55,55))return;this._n(d,.5,300,2600,.7,.55,'bandpass');this._o(d,'sawtooth',120,60,.4,.12);break;
  case'star':if(!D(.5,60))return;[1046,1318,1568,2093].forEach((f,i)=>this._o(d,'sine',f*r,f*r,.5,.1,i*.04));this._n(d,.4,6000,1200,1,.2,'bandpass');break;
  case'ice':if(!D(.5,55))return;this._o(d,'triangle',2400*r,800,.3,.18);this._n(d,.35,9000,2500,1.2,.3,'highpass');this._o(d,'sine',3200,3000,.4,.06,.05);break;
  case'wind':if(!D(.45,50))return;this._n(d,.5,500,3200,1.6,.4,'bandpass');break;
  case'zap':if(!D(.5,55))return;this._o(d,'sawtooth',90*r,90,.25,.18);this._n(d,.25,7000,2000,3,.35,'bandpass');this._o(d,'square',2400,600,.12,.08);break;
  case'nature':if(!D(.45,50))return;[523,659,784].forEach((f,i)=>this._o(d,'sine',f*r,f*r*1.01,.45,.12,i*.06));this._n(d,.4,2000,5000,2,.12,'bandpass');break;
  case'shadow':if(!D(.45,50))return;this._o(d,'sawtooth',220*r,55,.35,.12);this._n(d,.35,1200,300,1.4,.35,'bandpass');break;
  case'blink':if(!D(.45,50))return;this._o(d,'sine',300,1800,.18,.2);this._n(d,.25,5000,9000,2,.15,'bandpass');break;
  case'boom':if(!D(.9,80))return;this._n(d,1,2000,60,.5,.85);this._o(d,'sine',85,26,.9,.8);break;
  case'big':if(!D(1,100))return;this._n(d,1.6,1800,40,.5,1);this._o(d,'sine',70,22,1.4,.9);this._o(d,'sawtooth',220,55,1.2,.1);break;
  case'heal':if(!D(.35,40))return;[659,880,1046].forEach((f,i)=>this._o(d,'sine',f,f,.3,.1,i*.05));break;
  case'shield':if(!D(.35,40))return;this._o(d,'triangle',600,1200,.25,.15);this._o(d,'sine',1200,1210,.4,.08,.05);break;
  case'stun':if(!D(.35,40))return;[1568,1318,1568].forEach((f,i)=>this._o(d,'square',f,f,.06,.05,i*.07));break;
  case'die':if(!D(.55,60))return;this._o(d,'sawtooth',300,60,.7,.15);this._n(d,.6,1600,150,.8,.35);break;
  case'mdie':if(!D(.15,30))return;this._n(d,.15,900,200,1,.3);break;
  case'roar':if(!D(.9,90))return;this._n(d,1.4,400,120,1.5,.7,'bandpass');this._o(d,'sawtooth',110,70,1.3,.25);this._o(d,'sawtooth',165,90,1.2,.15);break;
  // ui
  case'gold':D(.25);this._o(d,'square',1568,1568,.05,.08);this._o(d,'square',2093,2093,.1,.08,.05);break;
  case'buy':D(.35);this._o(d,'triangle',784,784,.08,.2);this._o(d,'triangle',1175,1175,.14,.2,.07);this._n(d,.1,6000,3000,2,.12,'bandpass');break;
  case'lvl':D(.45);[523,659,784,1046,1318].forEach((f,i)=>this._o(d,'triangle',f,f,.3,.14,i*.05));break;
  case'click':D(.2);this._o(d,'square',1200,1100,.03,.08);break;
  case'deny':D(.2);this._o(d,'square',220,200,.12,.1);break;
  case'ping':D(.3);this._o(d,'sine',1400,1400,.15,.2);this._o(d,'sine',1870,1870,.2,.15,.1);break;
  case'recall':if(!D(.3,40))return;this._o(d,'sine',220,880,1.2,.12,0,.6);this._o(d,'triangle',440,1760,1,.05,0,.5);break;
  case'horn':D(.55);[196,247,294,392].forEach(f=>this._o(d,'sawtooth',f,f,1.8,.05,0,.06));break;
  case'kill':D(.5);[784,988,1175].forEach((f,i)=>this._o(d,'triangle',f,f,.25,.16,i*.06));break;
  case'dead':D(.5);[392,330,262,196].forEach((f,i)=>this._o(d,'triangle',f,f,.35,.14,i*.12));break;
  case'win':D(.6);[523,659,784,1046,784,1046,1318].forEach((f,i)=>this._o(d,'triangle',f,f,.4,.16,i*.13));break;
  case'lose':D(.6);[392,370,330,294,262].forEach((f,i)=>this._o(d,'sawtooth',f,f*.99,.5,.06,i*.18));break;
  }}catch(e){}}
 // modal music bed: slow pad chords, plucked arpeggio, a war-drum layer that follows fight intensity
 music(on,intensity=0){if(!this.ac)return;this.musI=intensity;if(on&&!this.mus){const st={step:0,next:this.ac.currentTime+.1};this.mus=st;const tick=()=>{if(this.mus!==st)return;const ac=this.ac,spb=60/84/4;
   while(st.next<ac.currentTime+.3){const s=st.step%128,bar=(st.step/16|0)%8,t=st.next;const roots=[50,46,48,45,50,53,48,52],root=roots[bar];const hz=m=>440*Math.pow(2,(m-69)/12);const g=this.musG;
    if(s%16===0){for(const iv of[0,7,10,14]){const o=ac.createOscillator(),gg=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=hz(root+iv-12);o.detune.value=(Math.random()-.5)*12;f.type='lowpass';f.frequency.value=700;gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(.025,t+.8);gg.gain.linearRampToValueAtTime(.0,t+spb*16+.4);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+spb*16+.5);}}
    const arp=[0,7,12,14,19,14,12,7];if(s%2===0){const o=ac.createOscillator(),gg=ac.createGain();o.type='triangle';o.frequency.value=hz(root+12+arp[(s/2)%8]);gg.gain.setValueAtTime(.045,t);gg.gain.exponentialRampToValueAtTime(.001,t+.5);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.55);}
    if(this.musI>.25&&(s%8===0||s%8===6&&this.musI>.6)){const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.3);gg.gain.setValueAtTime(.35*this.musI,t);gg.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.4);}
    st.step++;st.next+=spb;}setTimeout(tick,80);};tick();}
  else if(!on&&this.mus){this.mus=null;}}}
