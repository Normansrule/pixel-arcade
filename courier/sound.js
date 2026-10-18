// TIDEWAY COURIER — WebAudio synth (no files): engine hum, drift whine whose pitch steps up with each charge tier
// (the non-colour cue for the drift meter), tier chimes, boost whoosh, wall thuds, splashes, gate pings, parcel jingles,
// countdown, a harbor ambience bed (waves + gulls) and a light accordion-and-ukulele style loop (M toggles music).
import {boot,master,gain,noiseBuf,bed,tone,hiss} from '../js/kit3d/audio.js';
const KEY='pxd_tidewaycourier_music';
export class Sound{
 constructor(){this.ac=null;this.music=true;try{this.music=localStorage.getItem(KEY)!=='0';}catch(e){}this.mus=null;this.muted=false;}
 init(){boot(this,ac=>{this.m=master(ac,.5,-12,4);this.sfx=gain(ac,1,this.m);this.mb=gain(ac,this.music?.13:0,this.m);this.noise=noiseBuf(ac,2);
  // engine: two detuned saws through a low-pass
  const o1=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter();o1.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=700;this.eg=gain(ac,0,this.sfx);o1.connect(f);o2.connect(f);f.connect(this.eg);o1.start();o2.start();this.o1=o1;this.o2=o2;this.ef=f;
  // drift whine: a sine whose pitch follows the charge tier, plus tyre hiss
  const w=ac.createOscillator();w.type='triangle';this.wg=gain(ac,0,this.sfx);w.connect(this.wg);w.start();this.wo=w;
  const s=bed(ac,this.noise,'bandpass',2600,2.5,this.sfx,0);this.skid=s;
  // harbor bed: soft surf
  this.surf=bed(ac,this.noise,'lowpass',420,null,this.m,.05);});}
 resume(){if(this.ac&&this.ac.state==='suspended')this.ac.resume();}
 suspend(){if(this.ac&&this.ac.state==='running')this.ac.suspend();}
 engine(v,on,drift,lvl,boost,wade){if(!this.ac)return;const t=this.ac.currentTime,f=48+Math.abs(v)*4.4*(boost?1.12:1);
  this.o1.frequency.setTargetAtTime(f,t,.05);this.o2.frequency.setTargetAtTime(f*.502,t,.05);this.ef.frequency.setTargetAtTime(boost?1900:wade?380:800,t,.08);
  this.eg.gain.setTargetAtTime(on?.035+Math.min(.05,Math.abs(v)*.0018):0,t,.08);
  // tier pitch steps: none 330 Hz, I 440, II 587, III 784 (rising, so the tier can be heard as well as seen)
  const wf=[330,440,587,784][lvl]||330;this.wo.frequency.setTargetAtTime(wf*(1+Math.sin(t*30)*.01),t,.03);this.wg.gain.setTargetAtTime(on&&drift?.022+lvl*.008:0,t,.04);
  this.skid.g.gain.setTargetAtTime(on&&(drift||wade)?.04:0,t,.05);this.skid.f.frequency.setTargetAtTime(wade?700:2600,t,.1);}
 stop(){if(!this.ac)return;const t=this.ac.currentTime;this.eg.gain.setTargetAtTime(0,t,.05);this.wg.gain.setTargetAtTime(0,t,.05);this.skid.g.gain.setTargetAtTime(0,t,.05);this.stopMusic();}
 b(f,d,type='square',v=.12,f1=f,at=0,dst){if(!this.ac||this.muted)return;tone(this.ac,dst||this.sfx,this.ac.currentTime+at,type,f,f1,d,v);}
 n(d,v,f0,f1=f0,type='lowpass',q=1){if(!this.ac||this.muted)return;hiss(this.ac,this.noise,this.sfx,this.ac.currentTime,d,f0,f1,q,v,type);}
 play(k,a=0){switch(k){
  case'beep':this.b(520,.2,'square',.1);break;case'go':this.b(1040,.5,'square',.11);this.b(1560,.5,'triangle',.07);break;
  case'perfect':[784,988,1319].forEach((f,i)=>this.b(f,.16,'triangle',.12,f,i*.06));this.n(.5,.12,1500,6000,'highpass');break;
  case'stall':this.b(140,.5,'sawtooth',.1,60);this.n(.4,.12,500,200);break;
  case'hop':this.b(300,.07,'square',.05,180);break;
  case'lv':this.b([0,880,1175,1568][a],.12,'triangle',.12);this.b([0,1320,1760,2350][a],.1,'sine',.06,undefined,.05);break;
  case'boost':this.b(200,.45,'sawtooth',.09,700+a*250);this.n(.4,.12,2000,5000,'highpass');break;
  case'cancel':this.b(260,.15,'square',.05,140);break;
  case'wall':this.n(.22,.25*Math.min(1,a/8+.3),900,200);this.b(110,.18,'sine',.16,60);break;
  case'bump':this.n(.12,.12,1400,500);break;
  case'splash':this.n(.9,.3,2200,300);this.b(500,.5,'sine',.08,120);break;
  case'respawn':this.b(660,.12,'sine',.1);this.b(990,.15,'sine',.08,undefined,.1);break;
  case'cp':this.b(1175,.1,'sine',.1);this.b(1568,.14,'sine',.07,undefined,.07);break;
  case'pick':this.b(523,.1,'triangle',.12);this.b(784,.14,'triangle',.11,undefined,.08);this.n(.15,.08,3000,1200);break;
  case'drop':[523,659,784,1047].forEach((f,i)=>this.b(f,.18,'triangle',.13,f,i*.08));this.b(2093,.4,'sine',.05,undefined,.32);break;
  case'nope':this.b(220,.15,'square',.06,200);break;
  case'lap':[659,784,988].forEach((f,i)=>this.b(f,.14,'triangle',.12,f,i*.09));break;
  case'final':[784,988,1175,1568].forEach((f,i)=>this.b(f,.15,'square',.07,f,i*.08));break;
  case'win':[523,659,784,1047,784,1047].forEach((f,i)=>this.b(f,.2,'triangle',.13,f,i*.12));break;
  case'lose':[440,370,294].forEach((f,i)=>this.b(f,.26,'triangle',.11,f,i*.18));break;
  case'warn':this.b(880,.08,'square',.07);break;
  case'tick':this.b(1200,.05,'square',.05);break;
  case'gull':this.b(1500,.25,'sine',.025,1100);this.b(1650,.2,'sine',.02,1200,.22);break;}}
 // procedural harbor tune: bass + plucked arpeggio + soft shaker, C major/A minor
 startMusic(){if(!this.ac||this.mus)return;const beat=60/112/2;let step=0,next=this.ac.currentTime+.1;const prog=[[0,4,7],[9,12,16],[5,9,12],[7,11,14]];
  const tick=()=>{if(!this.ac||!this.mus)return;while(next<this.ac.currentTime+.25){const bar=(step>>3)%4,s=step%8,ch=prog[bar],f=n=>261.63*Math.pow(2,n/12),at=next-this.ac.currentTime;
    if(s===0||s===4)this.b(f(ch[0]-24),beat*1.6,'triangle',.45,undefined,at,this.mb);
    if(s===2||s===6)this.b(f(ch[2]-24),beat*.8,'triangle',.25,undefined,at,this.mb);
    if(s!==3&&s!==7)this.b(f(ch[(s*2)%3]+(s>4?12:0)),beat*.9,'sine',.16,undefined,at,this.mb);
    if(s%2===1)tone(this.ac,this.mb,next,'square',f(ch[1]+12),f(ch[1]+12),beat*.4,.035);
    step++;next+=beat;}};
  this.mus=setInterval(tick,90);tick();}
 stopMusic(){if(this.mus){clearInterval(this.mus);this.mus=null;}}
 toggleMusic(){this.music=!this.music;try{localStorage.setItem(KEY,this.music?'1':'0');}catch(e){}if(this.mb)this.mb.gain.value=this.music?.13:0;return this.music;}}
