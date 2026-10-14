// STARWARDEN — WebAudio synthesis (no audio files): spatial weapon/impact one-shots, jetpack loop, ambience, a small music sequencer, announcer.
import {boot,SpatialSound} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.beds(ac,900);});}
 ambience(theme){if(!this.ac)return;this.amb({moon:[260,.05,46,.03],wastes:[620,.08,0,0],reach:[900,.05,52,.02]}[theme]||[300,0,0,0]);}
 jet(on,k=1){if(!this.ac)return;const t=this.ac.currentTime;this.jg.gain.setTargetAtTime(on?.13*k:0,t,.05);this.jf.frequency.setTargetAtTime(on?700+Math.random()*300:500,t,.05);}
 play(k,pos=null,vol=1,a=0){if(!this.ac)return;try{const r=1+(Math.random()-.5)*.08;let d;
  const D=(v,range)=>(d=this._dst(pos,v*vol,range));
  switch(k){
  case'auto':if(!D(.45,70))return;this._o(d,'square',1100*r,240,.06,.13);this._o(d,'sawtooth',420*r,80,.08,.12);this._n(d,.06,5200,1400,.8,.24,'bandpass');break;
  case'pulse':if(!D(.5,80))return;this._o(d,'triangle',900*r,170,.1,.26);this._n(d,.08,3600,600,.9,.28,'bandpass');this._o(d,'sine',160,55,.1,.2);break;
  case'scout':if(!D(.6,110))return;this._o(d,'triangle',760*r,120,.14,.3);this._n(d,.12,4200,500,.8,.32,'bandpass');this._o(d,'sine',120,40,.16,.3);break;
  case'hand':if(!D(.85,110))return;this._n(d,.3,3000,120,.6,.55);this._o(d,'sine',150*r,38,.26,.55);this._o(d,'square',420,90,.08,.12);break;
  case'smg':if(!D(.4,60))return;this._o(d,'square',1500*r,320,.045,.12);this._n(d,.05,6500,1800,.8,.2,'bandpass');break;
  case'shot':if(!D(.85,90))return;this._n(d,.42,4200,140,.6,.6);this._o(d,'sine',120,36,.35,.55);this._n(d,.08,9000,3000,.6,.25,'highpass');break;
  case'snipe':if(!D(.95,180))return;this._n(d,.35,9000,300,.6,.6);this._o(d,'sawtooth',1800,60,.5,.25);this._o(d,'sine',80,26,.6,.6);break;
  case'charge':if(!D(.45,40))return;this._o(d,'sine',220,1500,.55,.12,0,.25);this._o(d,'triangle',110,750,.55,.08,0,.25);break;
  case'fusion':if(!D(.8,100))return;this._n(d,.3,7000,600,.7,.4,'bandpass');this._o(d,'sawtooth',1300,200,.3,.2);this._o(d,'sine',200,50,.3,.4);break;
  case'rocket':if(!D(.8,100))return;this._n(d,.6,1400,300,.6,.5,'bandpass');this._o(d,'sawtooth',90,60,.5,.2);break;
  case'arc':if(!D(.75,70))return;this._n(d,.35,8000,2500,4,.45,'bandpass');[0,.05,.11].forEach(t=>this._o(d,'square',1900*r,700,.06,.12,t));break;
  case'solar':if(!D(.75,80))return;this._n(d,.6,900,140,.7,.6);this._o(d,'sawtooth',220,70,.45,.18);break;
  case'void':if(!D(.75,80))return;this._o(d,'sine',600,60,.7,.45);this._o(d,'triangle',300,40,.8,.25,.03);this._n(d,.5,1800,200,2,.25,'bandpass');break;
  case'cast':D(.5);this._o(d,'sine',300,900,.25,.2);this._n(d,.25,1000,5000,2,.2,'bandpass');break;
  case'super':D(.9);[196,262,330,392,523].forEach((f,i)=>this._o(d,'sawtooth',f,f*1.003,1.2,.07,i*.05,.08));this._o(d,'sine',70,40,1.2,.6);this._n(d,1,600,6000,1,.25,'bandpass');break;
  case'foe':if(!D(.4,70))return;this._o(d,'sawtooth',520*r,180,.12,.12);this._n(d,.1,2400,700,2,.15,'bandpass');break;
  case'foeBig':if(!D(.7,110))return;this._o(d,'sawtooth',180*r,60,.35,.25);this._n(d,.3,1200,200,1,.3);break;
  case'foeDie':if(!D(.45,60))return;this._n(d,.4,3000,300,1.4,.3,'bandpass');this._o(d,'triangle',500,90,.35,.12);break;
  case'shieldPop':if(!D(.8,60))return;this._n(d,.4,9000,1500,.8,.45,'highpass');[1800,1300,900].forEach((f,i)=>this._o(d,'triangle',f,f*.4,.3,.14,i*.04));break;
  case'orb':D(.45);this._o(d,'sine',880,1760,.18,.16);this._o(d,'triangle',1320,2640,.22,.1,.06);break;
  case'engram':D(.6);[523,784,1046,1568].forEach((f,i)=>this._o(d,'triangle',f,f,.4,.14,i*.07));this._o(d,'sine',262,262,.8,.2);break;
  case'exotic':D(.8);[392,494,587,784,988,1175].forEach((f,i)=>this._o(d,'sawtooth',f,f*1.002,.9,.06,i*.06,.04));this._o(d,'sine',98,98,1.4,.3);break;
  case'roar':D(.9);this._o(d,'sawtooth',90,45,2,.35,0,.2);this._o(d,'sawtooth',135,60,2,.2,.05,.2);this._n(d,2,900,100,.6,.4);break;
  case'slam':if(!D(1,140))return;this._n(d,1.1,1800,40,.5,.9);this._o(d,'sine',70,22,1,.9);break;
  case'beam':if(!D(.6,120))return;this._o(d,'sawtooth',140,140,.5,.12);this._n(d,.5,3000,3000,6,.15,'bandpass');break;
  case'door':D(.7);this._o(d,'sawtooth',60,40,2.2,.25,0,.4);this._n(d,2.2,400,120,.8,.3);[392,523,659].forEach((f,i)=>this._o(d,'triangle',f,f,.6,.1,.3+i*.15));break;
  case'objective':D(.55);[659,880,1175].forEach((f,i)=>this._o(d,'triangle',f,f,.35,.15,i*.09));break;
  case'revive':D(.6);this._o(d,'sine',300,1200,.8,.2,0,.3);[784,1046].forEach((f,i)=>this._o(d,'triangle',f,f,.4,.12,.5+i*.1));break;
  case'down':D(.6);this._o(d,'sawtooth',400,80,1,.2);this._n(d,.8,1500,200,1,.3);break;
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
 music(on,intensity=0){if(!this.ac)return;this.musI=intensity;if(on&&!this.mus){const st={step:0,next:this.ac.currentTime+.1};this.mus=st;const tick=()=>{if(this.mus!==st)return;const ac=this.ac,spb=60/(this.boss?128:112)/4;
   while(st.next<ac.currentTime+.25){const s=st.step%64,bar=(st.step/16|0)%4,root=(this.boss?[40,41,40,43]:[45,41,48,43])[bar],t=st.next;const hz=m=>440*Math.pow(2,(m-69)/12);
    const g=ac.createGain();g.connect(this.musG);this._v=1;
    if(s%4===0||s%16===14){const o=ac.createOscillator(),f=ac.createBiquadFilter(),gg=ac.createGain();o.type='sawtooth';o.frequency.value=hz(root-12);f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(140,t+.22);gg.gain.setValueAtTime(.32,t);gg.gain.exponentialRampToValueAtTime(.001,t+.24);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+.26);}
    const arp=[0,7,12,15,19,15,12,7][s%8]+(this.boss&&s%16>11?1:0);if(s%2===0||this.musI>.5){const o=ac.createOscillator(),gg=ac.createGain();o.type='triangle';o.frequency.value=hz(root+12+arp);gg.gain.setValueAtTime(.07*(.6+this.musI*.6),t);gg.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.18);}
    if(s%4===2||this.musI>.6&&s%2===1){const n=ac.createBufferSource(),f=ac.createBiquadFilter(),gg=ac.createGain();n.buffer=this.noise;f.type='highpass';f.frequency.value=7000;gg.gain.setValueAtTime(.05,t);gg.gain.exponentialRampToValueAtTime(.001,t+.05);n.connect(f);f.connect(gg);gg.connect(g);n.start(t,Math.random());n.stop(t+.06);}
    if(s%16===8&&this.musI>.3){const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.2);gg.gain.setValueAtTime(.3,t);gg.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.26);}
    st.step++;st.next+=spb;}setTimeout(tick,60);};tick();}
  else if(!on&&this.mus){this.mus=null;}}}
