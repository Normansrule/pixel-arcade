// SLED DASH — downhill sled race vs 3 CPU penguins: steer, tuck, hop ramps, spin tricks, dodge rocks, grab fish.
import {THREE,V3,Particles,baseScene,follow,snowMaterial,textSprite,ctex} from './common.js';
import {Penguin,makeSled} from '../penguin.js';
import {instancedPines} from '../env.js';
import {merge,M,cl,rnd,pick,damp,rng} from '../util.js';
import {BODY_COLORS,WEAR} from '../items.js';
const LEN=1500,HW=7;
const cx=s=>14*Math.sin(s*.006)+7*Math.sin(s*.017+1)+3*Math.sin(s*.041),cy=s=>-s*.24+2.2*Math.sin(s*.021)-1.2*Math.sin(s*.05);
const NAMES=['Flurry','Pip','Noodle','Biscuit','Marble','Zuzu','Skipper'];
export default{id:'sled',name:'SLED DASH',room:'ski',time:75,music:'race',medals:[1,2,3],medalText:'Bronze: 3rd · Silver: 2nd · Gold: 1st place',
 desc:'Race three CPU sledders down the ski hill. Tuck for speed, hop ramps, spin for style and dodge the rocks.',
 long:'A downhill race against three CPU penguins. Hold tuck to go faster (but you steer slower), launch off snow ramps and spin in the air for style points, skate over blue ice for a boost and grab fish for bonus coins. Rocks will stop you cold!',
 keys:[['Steer','A D · ← → · mouse X'],['Tuck (faster, stiffer)','W · ↑ · hold left mouse'],['Brake','S · ↓'],['Spin trick (in the air)','Space'],['Bonus','fish +5 · tricks +15']],
 create(ctx){const{R,snd}=ctx;const B=baseScene(R,{hour:12.5,fogD:.0065,shadowSize:40});const{scene,sun,cam}=B;cam.fov=62;const this_snow=[];
  // ---- track samples ----
  const N=LEN+120,P=[],T=[],Rt=[];for(let i=0;i<=N;i++){const s=i-40;P.push(new V3(cx(s),cy(s),-s));}
  for(let i=0;i<=N;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(N,i+1)],t=b.clone().sub(a).normalize();T.push(t);Rt.push(new V3(-t.z,0,t.x).normalize().negate());}
  const at=(s,u,out=new V3())=>{const f=cl(s+40,0,N-1.001),i=f|0,k=f-i;out.lerpVectors(P[i],P[i+1],k);const r=Rt[i];out.x+=r.x*u;out.z+=r.z*u;out.y+=bank(u);return out;};
  const bank=u=>{const e=Math.abs(u)-HW;return e>0?Math.pow(e,1.5)*.32:0;};
  const frame=(s)=>{const i=cl(s+40,0,N-1)|0;return{t:T[i],r:Rt[i]};};
  // ---- terrain ribbon ----
  {const US=[-46,-34,-24,-16,-11,-8.5,-7,-5,-3,-1.5,0,1.5,3,5,7,8.5,11,16,24,34,46],pos=[],col=[],idx=[],c=new THREE.Color();
   for(let i=0;i<=N;i+=2){for(const u of US){const p=at(i-40,u);p.y+=Math.abs(u)>20?Math.sin(i*.07+u)*1.2:0;pos.push(p.x,p.y,p.z);const onT=Math.abs(u)<HW;c.setRGB(.88,.92,.98);if(onT)c.setRGB(.74,.82,.95);if(onT&&(Math.abs(Math.abs(u)-3)<.6||Math.abs(u)<.4))c.setRGB(.62,.72,.9);if(Math.abs(Math.abs(u)-HW)<.5)c.setRGB(.95,.55,.4);col.push(c.r,c.g,c.b);}}
   const nu=US.length,rows=pos.length/3/nu;for(let r=0;r<rows-1;r++)for(let j=0;j<nu-1;j++){const a=r*nu+j,b=a+nu;idx.push(a,b,a+1,a+1,b,b+1);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
   const m=new THREE.Mesh(g,snowMaterial());m.receiveShadow=true;scene.add(m);this_snow.push(m.material);}
  // ---- trees + flags + arches ----
  const r=rng(9),tp=[];for(let s=-30;s<LEN+60;s+=3.2){for(const sd of[-1,1]){if(r()<.55){const u=sd*(12+r()*26);const p=at(s,u);tp.push({x:p.x,y:p.y-.3,z:p.z,s:.8+r()*.9});}}}
  instancedPines(scene,tp);
  const flagG=[];for(let s=10;s<LEN;s+=24)for(const sd of[-1,1]){const p=at(s,sd*(HW+.6));flagG.push([new THREE.CylinderGeometry(.06,.06,2.4,5),M(p.x,p.y+1.2,p.z),0x333333],[new THREE.PlaneGeometry(.9,.6),M(p.x+.45*sd*0,p.y+2.1,p.z,0,Math.PI/2,0),sd>0?0xff4d00:0x2f86ff]);}
  {const m=new THREE.Mesh(merge(flagG),new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.6}));m.castShadow=true;scene.add(m);}
  const arch=(s,text,col)=>{const p=at(s,0),{r:rr}=frame(s);const g=new THREE.Group();g.position.copy(p);g.rotation.y=Math.atan2(rr.x,rr.z)-Math.PI/2;
   const tex=ctex(512,96,(x,w,h)=>{for(let i=0;i<32;i++)for(let j=0;j<6;j++){x.fillStyle=(i+j)%2?'#111':'#fff';x.fillRect(i*16,j*16,16,16);}x.fillStyle=col;x.fillRect(60,14,w-120,h-28);x.fillStyle='#fff';x.font='60px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+3);});
   const ban=new THREE.Mesh(new THREE.BoxGeometry(16,1.8,.2),new THREE.MeshStandardMaterial({map:tex,roughness:.6}));ban.position.y=6;g.add(ban);for(const sd of[-1,1]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,7,10),new THREE.MeshStandardMaterial({color:col}));pole.position.set(sd*8,3.5,0);pole.castShadow=true;g.add(pole);}scene.add(g);return g;};
  arch(-2,'SLED DASH','#d8383e');arch(LEN,'FINISH','#2f86ff');
  // ---- obstacles, ramps, ice, fish ----
  const rocks=[],ramps=[],ices=[],fish=[];const rr2=rng(31+ctx.diff);
  for(let s=60;s<LEN-30;s+=22+rr2()*20){const kind=rr2();if(kind<.55){const n=1+(rr2()*2|0);for(let k=0;k<n;k++)rocks.push({s:s+rr2()*6,u:(rr2()*2-1)*5.6,r:1.1});}
   else if(kind<.75)ramps.push({s,u:(rr2()*2-1)*3.5,w:3.2});else ices.push({s,u:(rr2()*2-1)*4,len:14});
   if(rr2()<.6){const u0=(rr2()*2-1)*5;for(let k=0;k<4;k++)fish.push({s:s+12+k*3.5,u:u0+Math.sin(k)*1.2,got:false});}}
  {const L=[];for(const o of rocks){const p=at(o.s,o.u);L.push([new THREE.IcosahedronGeometry(1,0),M(p.x,p.y+.3,p.z,rnd(3),rnd(3),0,1.3,.9,1.1),0x6a7080]);L.push([new THREE.IcosahedronGeometry(1,1),M(p.x,p.y+.85,p.z,0,rnd(3),0,1,.35,.9),0xffffff]);}
   const m=new THREE.Mesh(merge(L),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true}));m.castShadow=m.receiveShadow=true;scene.add(m);
   const RL=[];for(const o of ramps){const p=at(o.s,o.u),{t}=frame(o.s);const sh=new THREE.Shape();sh.moveTo(-2,0);sh.lineTo(2,0);sh.lineTo(2,1.5);sh.lineTo(-2,0);const g=new THREE.ExtrudeGeometry(sh,{depth:o.w*2,bevelEnabled:false});g.translate(0,0,-o.w);
    RL.push([g,M(p.x,p.y-.05,p.z,0,Math.atan2(t.x,t.z)+Math.PI/2,0),0xffffff]);}
   if(RL.length){const rm=new THREE.Mesh(merge(RL),snowMaterial());rm.castShadow=rm.receiveShadow=true;scene.add(rm);this_snow.push(rm.material);}
   const IL=[];for(const o of ices){for(let k=0;k<7;k++){const p=at(o.s+k*2,o.u);IL.push([new THREE.PlaneGeometry(3.4,2.2),M(p.x,p.y+.06,p.z,-Math.PI/2,0,0)]);}}
   if(IL.length){const im=new THREE.Mesh(merge(IL),new THREE.MeshStandardMaterial({color:0x7ad8ff,roughness:.05,metalness:.1,emissive:0x2aa0ff,emissiveIntensity:.5,transparent:true,opacity:.75,envMapIntensity:2}));scene.add(im);}}
  const fishG=merge([[new THREE.SphereGeometry(.32,10,8),M(0,0,0,0,0,0,1.5,1,.55),0xff9a3a],[new THREE.ConeGeometry(.25,.4,4),M(-.55,0,0,0,0,Math.PI/2,1,1,.4),0xff9a3a],[new THREE.SphereGeometry(.06,6,4),M(.3,.08,.15),0x111111]]);
  const fishM=new THREE.InstancedMesh(fishG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,emissive:0x803000,emissiveIntensity:.6}),fish.length);scene.add(fishM);
  // spectators at the finish
  const fans=[];for(let i=0;i<8;i++){const sd=i%2?1:-1,p=at(LEN+6+(i>>1)*2.5,sd*(HW+3+(i>>1)%2*1.5));const pg=new Penguin({color:pick(BODY_COLORS).hex,wear:{hat:pick(WEAR.filter(w=>w.slot==='hat')).id},scale:1.2});pg.group.position.copy(p);pg.group.rotation.y=sd>0?-Math.PI/2:Math.PI/2;scene.add(pg.group);fans.push(pg);}
  // ---- racers ----
  const look=ctx.look,cols=[look.color,0xd8383e,0x2fb05a,0xf2c230].map((c,i)=>i&&c===look.color?0x8a55d0:c);const names=NAMES.slice().sort(()=>Math.random()-.5);
  const racers=[0,1,2,3].map(i=>{const pg=new Penguin({color:cols[i],wear:i?{hat:pick(WEAR.filter(w=>w.slot==='hat')).id,neck:pick(WEAR.filter(w=>w.slot==='neck')).id}:look.wear,scale:1.15});pg.pose='sled';
   const sled=makeSled([0xff4d00,0x2f86ff,0xffc83a,0x9a55e0][i]);const g=new THREE.Group();g.add(sled);pg.group.position.y=.15;g.add(pg.group);scene.add(g);
   return{i,me:i===0,name:i?names[i]:ctx.name,pg,g,s:-6-(i>>1)*4,u:(i%2?2.5:-2.5)*(i<2?1:.5),v:0,vu:0,crash:0,ice:0,y:0,vy:0,air:false,spin:0,spinT:0,tuck:false,fin:0,place:0,fish:0,tricks:0,plan:0,tu:0,err:0,yaw:0};});
  const me=racers[0];const parts=new Particles(scene,1600,'normal'),glit=new Particles(scene,500,'add');
  const D=[{mx:.9,react:.45,err:1.2,tuck:.35},{mx:.97,react:.28,err:.6,tuck:.65},{mx:1.03,react:.15,err:.25,tuck:.9}][ctx.diff];
  let t=0,finished=[],started=false,score=0,doneT=-1;
  const inst={scene,camera:cam,score:0,particles:[parts,glit],post:{exposure:.82,bloomThreshold:1.8,bloom:.35},
   start(){started=true;},
   idle(dt){simVisual(dt);},
   update(dt,inp){t+=dt;
    // player input
    let st=(inp.right()?1:0)-(inp.left()?1:0);if(Math.abs(inp.ax)>.2)st=inp.ax;if(!st&&inp.mouse.nx!==undefined&&inp.mouse.down)st=cl(inp.mouse.nx*2.2,-1,1);
    me.tuck=!!(inp.up()||inp.mouse.down&&Math.abs(inp.mouse.nx)<.2);me.brake=!!inp.down();me.steer=st;
    if(inp.act()&&me.air&&me.spinT<=0){me.spinT=.62;snd.play('whoosh');}
    for(const c of racers)if(!c.me)think(c,dt);
    for(const c of racers)physics(c,dt);
    // racer bumps
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){const A=racers[a],Bq=racers[b];const ds=A.s-Bq.s,du=A.u-Bq.u;if(Math.abs(ds)<1.7&&Math.abs(du)<1.5&&!A.air&&!Bq.air){const push=(1.5-Math.abs(du))*.5*Math.sign(du||1);A.u+=push;Bq.u-=push;A.vu+=push*4;Bq.vu-=push*4;const back=ds>0?Bq:A;back.v*=.985;if(A.me||Bq.me)snd.play('land');}}
    // places
    const order=racers.slice().sort((a,b)=>(b.fin?1e6-b.fin:b.s)-(a.fin?1e6-a.fin:a.s));order.forEach((c,i)=>{if(!c.fin)c.place=i+1;});
    score=calcScore();inst.score=score;
    if(me.fin&&doneT<0)doneT=1.4;if(doneT>0){doneT-=dt;if(doneT<=0){inst.done=true;inst.doneReason='finish';}}
    simVisual(dt);},
   hud(){const pl=me.fin?me.place:me.place;ctx.hud.innerHTML=`<div class="mgpanel" style="left:18px;top:16px"><b style="font-size:2.6rem">${pl}<sup style="font-size:1rem">${['ST','ND','RD','TH'][pl-1]}</sup></b> / 4<br>${Math.round(me.v*3.6)} KM/H${me.tuck?' · TUCK':''}<br>🐟 ${me.fish} · ✦ ${me.tricks}</div>
    <div class="mgpanel" style="left:18px;bottom:18px;width:min(520px,60vw);padding:12px 14px"><div style="position:relative;height:6px;border-radius:9px;background:rgba(255,255,255,.12)">${racers.map(c=>`<i style="position:absolute;top:-5px;left:calc(${cl(c.s/LEN,0,1)*100}% - 8px);width:16px;height:16px;border-radius:50%;background:#${new THREE.Color(c.pg.mat.color).getHexString()};border:2px solid ${c.me?'#fff':'#0008'}"></i>`).join('')}</div></div>`;},
   finish(reason){if(reason==='time'){for(const c of racers)if(!c.fin)c.dnf=true;}},
   result(){const place=me.fin?me.place:5;const medal=me.fin?[3,2,1,0][place-1]:0;const s=calcScore();const coins=Math.round(s/4);
    return{score:s,medal,coins,title:me.fin?['WINNER!','2ND PLACE!','3RD PLACE!','4TH PLACE'][place-1]:'DID NOT FINISH',sub:me.fin?`FINISHED IN ${fmt(me.time)}`:'OUT OF TIME',stats:[['Place',me.fin?place+' / 4':'DNF'],['Time',me.fin?fmt(me.time):'—'],['Fish grabbed',me.fish],['Tricks landed',me.tricks],['Crashes',me.crashes||0]]};},
   cheat:{win(){me.s=LEN-3;me.v=40;for(const c of racers)if(!c.me)c.s=Math.min(c.s,LEN-200);},lose(){me.v=0;me.s=0;for(const c of racers)if(!c.me)c.s=LEN+1;}},
   racers,get me(){return me;},LEN};
  const fmt=x=>(x/60|0)+':'+(x%60).toFixed(2).padStart(5,'0');
  function calcScore(){const p=me.fin?me.place:me.place;return(me.fin?[100,70,45,25][p-1]:Math.round(me.s/LEN*25))+me.fish*5+me.tricks*15;}
  function think(c,dt){c.plan-=dt;if(c.plan<=0){c.plan=D.react+rnd(.15);let best=c.u,bc=1e9;
    for(let cu=-6;cu<=6;cu+=.75){let cost=Math.abs(cu-c.u)*.15+(Math.abs(cu)>5.6?3:0);for(const o of rocks){const ds=o.s-c.s;if(ds<0||ds>48)continue;if(Math.abs(cu-o.u)<2.4)cost+=12*(1-ds/60);}
     for(const o of ramps){const ds=o.s-c.s;if(ds>0&&ds<40&&Math.abs(cu-o.u)<2.5)cost-=1.5;}for(const o of ices){const ds=o.s-c.s;if(ds>-5&&ds<40&&Math.abs(cu-o.u)<1.5)cost-=2;}
     for(const f of fish){const ds=f.s-c.s;if(!f.got&&ds>0&&ds<30&&Math.abs(cu-f.u)<1)cost-=1.2;}for(const o of racers){if(o!==c&&Math.abs(o.s-c.s)<4&&Math.abs(o.u-cu)<1.6)cost+=2;}
     if(cost<bc){bc=cost;best=cu;}}c.tu=best+rnd(-D.err,D.err)*.5;
    const clear=!rocks.some(o=>o.s-c.s>0&&o.s-c.s<30&&Math.abs(o.u-c.tu)<3);c.tuck=clear&&Math.random()<D.tuck;}
   c.steer=cl((c.tu-c.u)*.7-c.vu*.12,-1,1);c.brake=false;if(c.air&&c.spinT<=0&&Math.random()<dt*D.tuck*1.5&&c.y>1.2)c.spinT=.62;}
  function physics(c,dt){if(c.fin&&c.s>LEN+30){c.v=damp(c.v,0,2,dt);}
   const drag=c.tuck?.0011:.0017,mx=c.me?1:D.mx;let acc=(2.7+(c.tuck?1.3:0))*mx-drag*c.v*c.v-(c.brake?14:0);
   // gentle rubber band
   if(!c.me&&!c.fin){const gap=me.s-c.s;acc+=cl(gap*.02,-.8,1.6);}
   if(c.crash>0){c.crash-=dt;acc=0;c.v*=Math.exp(-dt*1.5);}
   if(c.ice>0){c.ice-=dt;acc+=8;}
   if(!started)acc=0;c.v=Math.max(0,c.v+acc*dt);if(Math.abs(c.u)>HW){c.v*=Math.exp(-dt*1.4);c.vu-=Math.sign(c.u)*16*dt;}
   const steerK=c.air?.25:c.tuck?.55:1;if(c.crash<=0){c.vu=damp(c.vu,c.steer*13*steerK,6,dt);c.v*=1-Math.abs(c.steer)*.035*dt*(c.air?0:1);}else c.vu*=Math.exp(-dt*3);
   c.u=cl(c.u+c.vu*dt,-13,13);c.s+=c.v*dt;
   // air
   if(c.air){c.vy-=24*dt;c.y+=c.vy*dt;if(c.spinT>0){c.spinT-=dt;c.spin+=dt/.62*Math.PI*2;}
    if(c.y<=0){c.y=0;c.air=false;const mid=c.spinT>0;const off=Math.abs(((c.spin%(Math.PI*2))+Math.PI*2)%(Math.PI*2));const clean=!mid&&(off<.5||off>Math.PI*2-.5);
     if(c.spin>0){if(clean){c.tricks++;c.v+=5;if(c.me){snd.play('chime');ctx.msg('SPIN! +15','#ffe09a',.9);glit.burst(c.g.position.clone().setY(c.g.position.y+1),30,6,[new THREE.Color(2,1.6,.4),new THREE.Color(1.6,1.8,2.4)],.4,.8,{up:true,grav:4});}}else crash(c);}
     c.spin=0;c.spinT=0;if(c.me)snd.play('land');parts.burst(c.g.position,20,5,new THREE.Color(1,1,1),.5,.6,{up:true,grav:8});}}
   if(c.fin)return;
   // obstacles
   for(const o of rocks)if(!c.air&&Math.abs(o.s-c.s)<1.3&&Math.abs(o.u-c.u)<o.r+.55&&c.crash<=0)crash(c,o);
   for(const o of ramps)if(!c.air&&c.s>o.s-.5&&c.s<o.s+.8&&Math.abs(o.u-c.u)<o.w){c.air=true;c.vy=7+c.v*.12;c.y=.01;if(c.me)snd.play('jump');}
   for(const o of ices)if(!c.air&&c.s>o.s&&c.s<o.s+o.len&&Math.abs(o.u-c.u)<1.8){if(c.ice<=0&&c.me)snd.play('boost');c.ice=.6;}
   for(const f of fish)if(!f.got&&Math.abs(f.s-c.s)<1.2&&Math.abs(f.u-c.u)<1.2&&c.y<1.4){f.got=true;c.fish++;if(c.me){snd.play('coin');glit.burst(at(f.s,f.u).setY(at(f.s,f.u).y+.8),16,4,new THREE.Color(2.4,1.4,.4),.3,.5,{up:true});}}
   if(c.s>=LEN&&!c.fin){finished.push(c);c.fin=finished.length;c.place=c.fin;c.time=t;if(c.me){snd.play(c.place===1?'win':'cheer');ctx.msg(c.place===1?'1ST PLACE!':`${c.place}${['ST','ND','RD','TH'][c.place-1]} PLACE`,'#ffe09a',2);}for(const f of fans)f.play('cheer');}}
  function crash(c,o){c.crash=1.1;c.v*=.25;c.vu=(c.u-(o?o.u:c.u))*3;c.crashes=(c.crashes||0)+1;c.spinT=0;c.spin=0;c.pg.play('hit');parts.burst(c.g.position.clone().setY(c.g.position.y+.6),40,7,new THREE.Color(1,1,1),.7,.8,{up:true,grav:10});if(c.me){snd.play('crash');ctx.msg('WIPEOUT!','#ff8a6a',.8);}}
  const tq=new THREE.Quaternion(),up=new V3(0,1,0),fw=new V3(),cpos=new V3(),clook=new V3();let camInit=false;
  function simVisual(dt){for(const c of racers){const p=at(c.s,c.u),{t:tt}=frame(c.s);p.y+=c.y;c.g.position.copy(p);
    const yaw=Math.atan2(-tt.x,-tt.z)+Math.PI+(-c.vu*.03);c.yaw=yaw;const pitch=Math.asin(cl(tt.y,-1,1));c.g.rotation.set(0,0,0);c.g.rotateY(yaw);c.g.rotateX(-pitch*.9+(c.air?-.15:0));
    c.g.rotateZ(-c.vu*.03+(c.crash>0?Math.sin(c.crash*20)*.3:0));c.pg.group.rotation.y=c.spin+(c.crash>0?c.crash*8:0);c.pg.update(dt,0);
    c.pg.fl[0].rotation.x=c.tuck?-2.2:-.9;c.pg.fl[1].rotation.x=c.tuck?-2.2:-.9;c.pg.bob.rotation.x=c.tuck?.45:-.1;
    if(!c.air&&c.v>8&&Math.random()<.7){const s=c.v*.12;parts.emit(p.x+rnd(-.6,.6),p.y+.1,p.z,rnd(-1,1)*s+(-c.vu)*.2,rnd(.5,2.2),rnd(-.5,.5)+tt.z*-.5,1,1,1,.45,.5,6,2);}
    if(c.ice>0&&Math.random()<.5)glit.emit(p.x+rnd(-.5,.5),p.y+.3,p.z,0,1,0,.6,1.4,2.4,.3,.4);}
   const tm=t*3;fish.forEach((f,i)=>{const p=at(f.s,f.u);const m4=new THREE.Matrix4().compose(new V3(p.x,p.y+.9+Math.sin(tm+i)*.2,p.z),tq.setFromAxisAngle(up,tm+i),new V3(1,1,1).multiplyScalar(f.got?0:1));fishM.setMatrixAt(i,m4);});fishM.instanceMatrix.needsUpdate=true;
   for(const f of fans)f.update(dt,0);parts.update(dt);glit.update(dt);
   // camera
   const p=me.g.position,{t:tt}=frame(me.s);fw.copy(tt).setY(tt.y*.5).normalize();cpos.copy(p).addScaledVector(fw,-9).add(new V3(0,6.2,0));cpos.x+=-me.vu*.05;clook.copy(p).addScaledVector(fw,11).add(new V3(0,.4,0));
   if(!camInit){cam.position.copy(cpos);camInit=true;}else cam.position.lerp(cpos,1-Math.exp(-dt*6));cam.lookAt(clook);cam.fov=damp(cam.fov,60+me.v*.35+(me.ice>0?8:0),3,dt);cam.updateProjectionMatrix();
   follow(sun,p,B.pal.sunDir);for(const c of racers)if(!c.me)c.g.visible=c.g.position.distanceTo(cam.position)>5.5;for(const m of this_snow){m.userData.U.uT.value=t;}}
  return inst;}};
