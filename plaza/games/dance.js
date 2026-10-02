// DISCO FLOE — a four-lane rhythm game on a light-up dance floor. The notes you hit are the song's melody.
import {THREE,V3,Particles,baseScene,ctex,textSprite,toScreen} from './common.js';
import {Penguin} from '../penguin.js';
import {merge,M,cl,rnd,pick,damp,rng,lerp} from '../util.js';
import {BODY_COLORS,WEAR} from '../items.js';
const LANES=[-2.4,-.8,.8,2.4],LCOL=[0xff3cac,0x2fe0ff,0x7aff5a,0xffc83a],HITZ=2.2,SPEED=13,LAND=['←','↓','↑','→'];
const SCALE=[0,2,4,7,9,12,14,16];
export default{id:'dance',name:'DISCO FLOE',room:'club',time:72,music:null,medals:[50,75,90],medalText:'Bronze 50% · Silver 75% · Gold 90% of the max score',
 desc:'Hit the arrows on the beat to keep the dance floor alive. Build combos, fill the fever meter and light up the club.',
 long:'Notes slide down four lanes toward the line. Press the matching key as each one crosses it - perfect timing scores most. Hold the long notes until they end. Every 10-note combo raises your multiplier. Fill the fever meter with perfects, then press Space for double points. Miss too often and the crowd loses energy.',
 keys:[['Lanes','← ↓ ↑ → · D F J K'],['Fever (when full)','Space'],['Timing','PERFECT · GREAT · GOOD'],['Crowd energy','misses drain it - empty = booed off']],
 create(ctx){const{R,snd}=ctx;const B=baseScene(R,{sky:false,bg:0x0a0612,fog:0x0a0612,fogD:.018,hs:0x8a60ff,hg:0x301040,hi:.7,sunCol:0xd0b8ff,si:1.1,sunDir:new V3(.2,1,.5).normalize(),shadowSize:14});
  const{scene,cam}=B;cam.fov=50;cam.position.set(0,6.2,10.5);cam.lookAt(0,1.2,-6);
  // ---- club ----
  const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(1.9,.12,1.9),new THREE.MeshBasicMaterial({color:0xffffff}),12*14);{let i=0;const m4=new THREE.Matrix4();for(let a=0;a<12;a++)for(let b=0;b<14;b++){m4.makeTranslation(-11+a*2,0,-22+b*2);tiles.setMatrixAt(i,m4);tiles.setColorAt(i++,new THREE.Color(.1,.1,.1));}}scene.add(tiles);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(40,16),new THREE.MeshStandardMaterial({color:0x1a1030,roughness:.8}));back.position.set(0,8,-23);scene.add(back);
  const neon=[];for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(30,.15,.15),new THREE.MeshBasicMaterial({color:new THREE.Color(LCOL[i%4]).multiplyScalar(2)}));m.position.set(0,2+i*2.4,-22.8);scene.add(m);neon.push(m);}
  {const ds=ctex(512,128,(x,w,h)=>{x.font='96px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#ff3cac';x.shadowBlur=24;x.fillStyle='#ffe0f6';x.fillText('DISCO FLOE',w/2,h/2+4);});
   const m=new THREE.Mesh(new THREE.PlaneGeometry(12,3),new THREE.MeshBasicMaterial({map:ds,transparent:true,blending:THREE.AdditiveBlending,color:new THREE.Color(1.8,1.8,1.8)}));m.position.set(0,12,-22.7);scene.add(m);}
  const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3,2),new THREE.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:.1,flatShading:true,envMapIntensity:3}));ball.position.set(0,10,-10);scene.add(ball);
  const bm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uC:{value:new THREE.Color(.5,.3,.9)}},vertexShader:'varying float vY;void main(){vY=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 uC;varying float vY;void main(){gl_FragColor=vec4(uC*vY*.32,1.);}'});
  const beams=new THREE.Group();for(let k=0;k<8;k++){const g=new THREE.ConeGeometry(1.4,12,14,1,true);g.translate(0,-6,0);const c=new THREE.Mesh(g,bm.clone());c.material.uniforms.uC.value=new THREE.Color(LCOL[k%4]).multiplyScalar(.5);c.rotation.set(.55,k/8*Math.PI*2,0,'YXZ');beams.add(c);}beams.position.copy(ball.position);scene.add(beams);
  for(const sx of[-1,1]){const sp=new THREE.Mesh(new THREE.BoxGeometry(2.2,5,2),new THREE.MeshStandardMaterial({color:0x15151c,roughness:.5}));sp.position.set(sx*12,2.5,-18);scene.add(sp);for(const y of[1.4,3.4]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.1,20),new THREE.MeshStandardMaterial({color:0x333344}));c.rotation.x=Math.PI/2;c.position.set(sx*12,y,-16.95);scene.add(c);}}
  const lights=[0,1,2].map(i=>{const l=new THREE.PointLight(LCOL[i],20,26,1.5);l.position.set(-8+i*8,6,-10);scene.add(l);return l;});
  // ---- dancers ----
  const me=new Penguin({color:ctx.look.color,wear:ctx.look.wear,scale:1.6});me.pose='dance';me.group.position.set(0,.06,-13);scene.add(me.group);
  const crowd=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const pg=new Penguin({color:pick(BODY_COLORS).hex,wear:{hat:Math.random()<.7?pick(WEAR.filter(w=>w.slot==='hat')).id:null,face:Math.random()<.3?pick(WEAR.filter(w=>w.slot==='face')).id:null},scale:1.3});
   pg.group.position.set((i%2?1:-1)*(5.5+(i>>1)%3*2.2),.06,-16+(i>>1)*1.6+rnd(-.5,.5));pg.group.rotation.y=(i%2?-1:1)*.5;pg.pose='dance';pg.danceStyle=i%4;scene.add(pg.group);crowd.push(pg);}
  // ---- highway ----
  const hw=new THREE.Mesh(new THREE.PlaneGeometry(7.2,34),new THREE.MeshBasicMaterial({color:0x05040a,transparent:true,opacity:.72}));hw.rotation.x=-Math.PI/2;hw.position.set(0,.14,HITZ-15);scene.add(hw);
  for(let i=0;i<5;i++){const l=new THREE.Mesh(new THREE.PlaneGeometry(.05,34),new THREE.MeshBasicMaterial({color:0x6a5a9a}));l.rotation.x=-Math.PI/2;l.position.set(-3.2+i*1.6,.15,HITZ-15);scene.add(l);}
  const recv=LANES.map((x,i)=>{const g=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(.6,.07,8,32),new THREE.MeshBasicMaterial({color:new THREE.Color(LCOL[i]).multiplyScalar(1.4)}));ring.rotation.x=-Math.PI/2;g.add(ring);
   const fill=new THREE.Mesh(new THREE.CircleGeometry(.55,24),new THREE.MeshBasicMaterial({color:new THREE.Color(LCOL[i]),transparent:true,opacity:0}));fill.rotation.x=-Math.PI/2;g.add(fill);const lb=textSprite(LAND[i],{size:56,color:'#fff',scale:.5,fog:false});lb.position.set(0,.05,.95);g.add(lb);g.position.set(x,.18,HITZ);scene.add(g);return{g,fill,flash:0};});
  const gemG=new THREE.OctahedronGeometry(.55,0);gemG.scale(1,.55,.8);const noteM=LCOL.map(c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.15)}));
  const tailM=LCOL.map(c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(.9),transparent:true,opacity:.55}));
  // ---- song + chart ----
  const bpm=[108,120,132][ctx.diff],spb=60/bpm,bars=Math.floor((66/spb)/4),r=rng(77+ctx.diff),chart=[],song=[];
  const prog=[[57,[0,3,7]],[53,[0,4,7]],[48,[0,4,7]],[55,[0,4,7]]];
  for(let b=0;b<bars;b++){const[root,ch]=prog[b%4];const intro=b<2,outro=b>=bars-1;
   for(let s=0;s<16;s++){const tt=(b*16+s)*spb/4+1.5;if(s%4===0)song.push(['kick',0,tt,.3,.5]);if(s===4||s===12)song.push(['clap',0,tt,.2,.14]);if(s%4===2)song.push(['hat',1,tt,.08,.06]);if(s%2===1)song.push(['hat',0,tt,.03,.03]);
    if(s%4===2||s===14)song.push(['bass',root-24+(s===14?7:0),tt,.18,.12]);if(s===0)ch.forEach(c=>song.push(['pad',root+c,tt,spb*4,.022]));
    if(intro||outro)continue;
    const dens=[[0,8],[0,4,8,12],[0,4,6,8,12,14]][ctx.diff];const extra=ctx.diff>=1&&r()<.25?[2,10]:[];
    if(dens.includes(s)||extra.includes(s)&&r()<.5){if(r()<(ctx.diff===0?.75:.85)){const lane=Math.floor(r()*4);const hold=ctx.diff>0&&s%8===0&&r()<.22?spb*(1+Math.floor(r()*2)):0;chart.push({t:tt,lane,hold,hit:0,m:null,judged:false});
      song.push(['pluck',root+12+SCALE[(lane*2+b)%8]+(SCALE.includes(ch[1])?0:0),tt,hold||.18,.06]);
      if(ctx.diff===2&&s%8===4&&r()<.3){const l2=(lane+2)%4;chart.push({t:tt,lane:l2,hold:0,hit:0,m:null,judged:false});}}}}}
  const songLen=bars*4*spb+1.5;
  let maxScore=0;{let c=0;for(const n of chart){c++;maxScore+=(300+(n.hold?100:0))*Math.min(4,1+Math.floor(c/10)*.5);}maxScore*=1.15;}
  const parts=new Particles(scene,900,'add');
  let t=-.0001,clockStart=null,score=0,combo=0,maxCombo=0,energy=.7,fever=0,feverOn=0,counts={perfect:0,great:0,good:0,miss:0},judge=null,sched=0,heldLane=[null,null,null,null],beatPulse=0;
  const KEYS=[['ArrowLeft','KeyD','GpLeft'],['ArrowDown','KeyF','GpDown'],['ArrowUp','KeyJ','GpUp'],['ArrowRight','KeyK','GpRight']];
  function noteMesh(n){const g=new THREE.Group();const gem=new THREE.Mesh(gemG,noteM[n.lane]);g.add(gem);if(n.hold){const tl=new THREE.Mesh(new THREE.PlaneGeometry(.36,n.hold*SPEED),tailM[n.lane]);tl.rotation.x=-Math.PI/2;tl.position.z=-n.hold*SPEED/2;g.add(tl);}scene.add(g);return g;}
  const inst={scene,camera:cam,score:0,particles:[parts],ownClock:true,post:{exposure:1,bloomThreshold:1.05,bloom:.7,bloomRadius:.6},
   start(){ctx.tLeft=songLen+1;if(snd.ac)clockStart=snd.ac.currentTime;},
   idle(dt){vis(dt,false);},
   update(dt,inp){const manual=window.PLAZA&&window.PLAZA.manual;if(snd.ac&&clockStart!==null&&!manual&&snd.ac.state==='running')t=snd.ac.currentTime-clockStart;else t+=dt;ctx.tLeft=Math.max(0,songLen+1-t);
    // schedule audio
    if(snd.ac&&snd.ac.state==='running'&&!manual){while(sched<song.length&&song[sched][2]<t+.35){const[i,m,tt,l,v]=song[sched];snd.note(i,m,clockStart+tt,l,v,snd.sfx);sched++;}}
    // spawn note meshes
    for(const n of chart){if(!n.m&&!n.judged&&n.t-t<34/SPEED)n.m=noteMesh(n);}
    // input
    for(let l=0;l<4;l++){const pressed=KEYS[l].some(k=>inp.e(k)),held=KEYS[l].some(k=>inp.k(k));if(pressed){recv[l].flash=.6;press(l);}
     const h=heldLane[l];if(h){if(held&&t<h.t+h.hold){score+=Math.round(60*dt*mult());energy=Math.min(1,energy+dt*.02);if(Math.random()<.4)burst(l,3);}else{if(t>=h.t+h.hold-.12){score+=100*mult();show('HOLD!',LCOL[l]);}else show('DROP',0xff6a6a);heldLane[l]=null;}}}
    if((inp.e('Space')||inp.e('PadA'))&&fever>=1&&!feverOn){feverOn=8;fever=0;snd.play('boost');ctx.msg('FEVER!','#ff3cac',1.2);for(const c of crowd)c.play('cheer');}
    // misses
    for(const n of chart){if(!n.judged&&t>n.t+.18){n.judged=true;miss(n);}}
    if(feverOn>0)feverOn-=dt;
    if(energy<=0){inst.done=true;inst.doneReason='boo';inst.endText='BOOED OFF!';}
    if(t>songLen+.6){inst.done=true;inst.doneReason='song';inst.endText='SONG COMPLETE!';}
    inst.score=score;vis(dt,true);},
   hud(){const pct=Math.round(score/maxScore*100);const j=judge&&judge.t>0?`<div class="mgp" style="left:50%;top:44%;transform:translate(-50%,-50%) scale(${1+judge.t*.3});font:400 2.6rem Anton,Impact,sans-serif;color:#${new THREE.Color(judge.c).getHexString()};opacity:${Math.min(1,judge.t*3)}">${judge.txt}</div>`:'';
    ctx.hud.innerHTML=`${j}<div class="mgpanel" style="left:18px;top:16px;width:200px"><b style="font-size:2rem">${combo}</b> COMBO · ×${mult().toFixed(1)}<br><span style="color:#8a8f9a">${pct}% OF MAX</span>
     <div style="margin-top:8px;font-size:.58rem;letter-spacing:.14em;color:#8a8f9a">CROWD ENERGY</div><div style="height:8px;border-radius:9px;background:rgba(255,255,255,.1)"><div style="height:100%;width:${energy*100}%;border-radius:9px;background:${energy>.35?'#5ad06a':'#ff5a3a'}"></div></div>
     <div style="margin-top:8px;font-size:.58rem;letter-spacing:.14em;color:#8a8f9a">FEVER ${fever>=1&&!feverOn?'· PRESS SPACE!':feverOn>0?'· ON!':''}</div><div style="height:8px;border-radius:9px;background:rgba(255,255,255,.1)"><div style="height:100%;width:${feverOn>0?feverOn/8*100:fever*100}%;border-radius:9px;background:linear-gradient(90deg,#ff3cac,#ffc83a)"></div></div></div>`;},
   result(){const pct=score/maxScore;const md=pct>=.9?3:pct>=.75?2:pct>=.5?1:0;return{score,medal:md,coins:5+Math.round(pct*50),title:inst.doneReason==='boo'?'BOOED OFF!':undefined,stats:[['Accuracy',Math.round(pct*100)+'% of max'],['Perfect · great · good',`${counts.perfect} · ${counts.great} · ${counts.good}`],['Misses',counts.miss],['Best combo',maxCombo]],sub:inst.doneReason==='boo'?'THE CROWD LEFT':'SONG COMPLETE'};},
   cheat:{win(){score=maxScore;counts.perfect=chart.length;t=songLen+.7;},lose(){energy=0;}},chart,get t(){return t;},press,get energy(){return energy;},get combo(){return combo;},get maxScore(){return maxScore;},songLen};
  function mult(){return Math.min(4,1+Math.floor(combo/10)*.5)*(feverOn>0?2:1);}
  function press(l){let best=null,bd=.2;for(const n of chart){if(n.judged||n.lane!==l)continue;const d=Math.abs(n.t-t);if(d<bd){bd=d;best=n;}}
   if(!best){snd.play('miss');energy=Math.max(0,energy-.015);return;}
   best.judged=true;const q=bd<.06?'perfect':bd<.12?'great':'good';counts[q]++;combo++;maxCombo=Math.max(maxCombo,combo);score+=Math.round({perfect:300,great:200,good:100}[q]*mult());energy=Math.min(1,energy+.03);if(q==='perfect')fever=Math.min(1,fever+.06);
   show(q.toUpperCase()+'!',q==='perfect'?0xffe14a:q==='great'?0x5aff9a:0x9ad0ff);snd.play('hit',l);burst(l,q==='perfect'?22:12);if(best.m){scene.remove(best.m);best.m=null;}if(best.hold)heldLane[l]=best;
   if(combo%25===0){ctx.msg(combo+' COMBO!','#ffe09a',.9);for(const c of crowd)if(Math.random()<.6)c.play('cheer');}}
  function miss(n){counts.miss++;combo=0;energy=Math.max(0,energy-.08);show('MISS',0xff5a5a);if(n.m){scene.remove(n.m);n.m=null;}}
  function show(txt,c){judge={txt,c,t:.6};}
  function burst(l,n){parts.burst(new V3(LANES[l],.4,HITZ),n,6,[new THREE.Color(LCOL[l]).multiplyScalar(2),new THREE.Color(2,2,2)],.35,.5,{up:true,grav:6});}
  const tc=new THREE.Color();
  function vis(dt,live){const beat=Math.max(0,t-1.5)/spb;beatPulse=Math.pow(1-(beat%1),3);
   for(const n of chart){if(!n.m)continue;const z=HITZ-(n.t-t)*SPEED;n.m.position.set(LANES[n.lane],.3,z);n.m.children[0].rotation.y+=dt*3;if(z>HITZ+4){scene.remove(n.m);n.m=null;}}
   for(let l=0;l<4;l++){const rc=recv[l];rc.flash=Math.max(0,rc.flash-dt*3);rc.fill.material.opacity=rc.flash+(heldLane[l]?.4:0);rc.g.scale.setScalar(1+rc.flash*.25+beatPulse*.05);}
   if(judge)judge.t-=dt;
   let i=0;for(let a=0;a<12;a++)for(let b=0;b<14;b++){const v=Math.sin(a*.8+b*.6+beat*Math.PI)*.5+.5;const on=((a+b+Math.floor(beat))%3===0);tc.setHex(LCOL[(a+b+Math.floor(beat/2))%4]).multiplyScalar((on?.9:.08)*(.4+beatPulse*.9)*(feverOn>0?1.6:1)+v*.06);tiles.setColorAt(i++,tc);}tiles.instanceColor.needsUpdate=true;
   ball.rotation.y+=dt*.8;beams.rotation.y+=dt*(feverOn>0?1.6:.6);beams.children.forEach((c,k)=>c.rotation.x=.5+Math.sin(t*1.4+k)*.25);
   lights.forEach((l,k)=>{l.intensity=10+beatPulse*30*(feverOn>0?1.5:1);l.color.setHex(LCOL[(k+Math.floor(beat/4))%4]);});neon.forEach((n,k)=>n.material.color.setHex(LCOL[(k+Math.floor(beat))%4]).multiplyScalar(1.2+beatPulse*1.5));
   me.danceRate=bpm/60/2;me.danceStyle=combo>=30?3:combo>=20?2:combo>=10?1:0;me.update(dt,0);for(const c of crowd){c.danceRate=bpm/60/2;c.update(dt,0);}
   if(feverOn>0&&Math.random()<dt*30)parts.emit(rnd(-10,10),12,rnd(-18,0),rnd(-1,1),-rnd(2,4),rnd(-1,1),...new THREE.Color(LCOL[Math.random()*4|0]).multiplyScalar(2).toArray(),.4,3,1.5,.5);
   parts.update(dt);cam.position.y=6.2+beatPulse*.05;}
  return inst;}};
