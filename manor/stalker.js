// HOLLOW MANOR — "the Mourner": a tall veiled thing in a torn shroud with a cracked porcelain face. It hunts by sound and sight:
// roam → investigate (a noise) → search (look around where it lost you) → chase (it has seen you) → drag (it saw you hide).
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v;
export const SKILL=[ // easy, normal, hard
 {n:'EASY',walk:1.2,inv:1.8,run:3.3,range:11,hear:.75,notice:.8,lose:2.6,search:7,err:2.6,grace:45,drift:0,checkHide:.25,breath:.12,cool:32,wounds:4,see:.5},
 {n:'NORMAL',walk:1.35,inv:2.15,run:3.95,range:14,hear:1,notice:1.25,lose:4,search:10,err:1.4,grace:30,drift:75,checkHide:.6,breath:.28,cool:24,wounds:3,see:.42},
 {n:'HARD',walk:1.5,inv:2.5,run:4.55,range:17,hear:1.3,notice:1.8,lose:6,search:13,err:.6,grace:18,drift:40,checkHide:1,breath:.45,cool:16,wounds:2,see:.35}];

export class Stalker{
 constructor(scene,T,house){this.house=house;this.pos=new V();this.L=2;this.yaw=0;this.state='dormant';this.path=null;this.alert=0;this.t=0;this.gait=0;this.anim={run:0,lean:0,look:0,reach:0};this.root=this._model(T);scene.add(this.root);this.reset(2,5,6);}
 _model(T){const g=new THREE.Group();const skin=new THREE.MeshStandardMaterial({map:T.skin,color:0x9a8e88,roughness:.75});const mask=new THREE.MeshStandardMaterial({map:T.mask,roughness:.35,color:0xf4ece0,emissive:0x1a1612});
  const shroud=new THREE.MeshStandardMaterial({map:T.shroud,alphaTest:.5,side:THREE.DoubleSide,roughness:.95,color:0x7a7476});const black=new THREE.MeshBasicMaterial({color:0x000000});
  const body=new THREE.Group();body.position.y=1.15;g.add(body);this.body=body;
  // shroud: an open flared tube with folds, hung from the shoulders
  const sg=new THREE.CylinderGeometry(.19,.5,2.05,22,10,true);const P=sg.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),a=Math.atan2(z,x),k=(1-(y+1.02)/2.05);const f=1+Math.sin(a*7)*.07*k+Math.sin(a*13+1)*.04*k;P.setXYZ(i,x*f,y,z*f*(.82));}sg.computeVertexNormals();
  const sh=new THREE.Mesh(sg,shroud);sh.position.y=-.1;body.add(sh);this.shroud=sh;const hood=new THREE.Mesh(new THREE.SphereGeometry(.23,16,10,Math.PI/2+1.05,Math.PI*2-2.1,0,Math.PI*.62),shroud);hood.position.set(0,1.0,-.03);hood.scale.set(1,1.15,1.05);body.add(hood);
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.17,.12,.85,10),skin);torso.position.y=.55;torso.scale.z=.7;body.add(torso);
  // head: porcelain mask, empty sockets with pinprick eyes, a crown of dead twigs
  const head=new THREE.Group();head.position.set(0,1.03,.05);body.add(head);this.head=head;const neck=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.3,6),skin);neck.position.y=-.14;head.add(neck);
  const face=new THREE.Mesh(new THREE.SphereGeometry(.15,20,16),mask);face.scale.set(.9,1.3,.85);face.position.set(0,.08,.03);head.add(face);
  this.eyes=[];for(const s of[-1,1]){const so=new THREE.Mesh(new THREE.SphereGeometry(.038,10,8),black);so.position.set(s*.055,.12,.135);so.scale.set(1,1.3,.5);head.add(so);
   const e=new THREE.Mesh(new THREE.SphereGeometry(.009,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,2.6,2.2)}));e.position.set(s*.055,.115,.152);head.add(e);this.eyes.push(e);}
  const mouth=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),black);mouth.scale.set(1.2,2.4,.4);mouth.position.set(0,-.06,.12);head.add(mouth);this.mouth=mouth;
  for(let i=0;i<9;i++){const a=(i/8-.5)*2.2,len=.25+R()*.3;const tw=new THREE.Mesh(new THREE.CylinderGeometry(.004,.012,len,4),skin);tw.position.set(Math.sin(a)*.12,.26+len*.4,-.02+Math.cos(a)*.02);tw.rotation.set(-.2+R()*.3,0,-a*.55);head.add(tw);}
  // arms (shoulder → elbow → hand with long fingers) and legs
  const limb=(len,r)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.8,r,len,6),skin);m.position.y=-len/2;return m;};
  this.arms=[-1,1].map(s=>{const sh=new THREE.Group();sh.position.set(s*.27,.95,0);body.add(sh);sh.add(limb(.62,.04));const el=new THREE.Group();el.position.y=-.62;sh.add(el);el.add(limb(.6,.032));
   const hand=new THREE.Group();hand.position.y=-.6;el.add(hand);const palm=new THREE.Mesh(new THREE.BoxGeometry(.07,.1,.03),skin);palm.position.y=-.05;hand.add(palm);
   for(let f=0;f<4;f++){const fg=new THREE.Mesh(new THREE.CylinderGeometry(.005,.009,.24,4),skin);fg.position.set((f-1.5)*.02,-.2,0);fg.rotation.x=.15*(f-1.5);hand.add(fg);}return{sh,el,hand,s};});
  this.legs=[-1,1].map(s=>{const hp=new THREE.Group();hp.position.set(s*.11,0,0);body.add(hp);hp.add(limb(.58,.05));const kn=new THREE.Group();kn.position.y=-.58;hp.add(kn);kn.add(limb(.56,.04));const ft=new THREE.Mesh(new THREE.BoxGeometry(.07,.04,.2),skin);ft.position.set(0,-.57,.06);kn.add(ft);return{hp,kn,s};});
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});return g;}
 reset(L,x,z){this.L=L;this.pos.set(x,this.house.groundAt(L,x,z),z);this.state='dormant';this.path=null;this.alert=0;this.target=null;this.lastSeen=null;this.loseT=0;this.searchT=0;this.waitT=0;this.repathT=0;this.cool=0;this.sawHide=null;this.dormantT=0;this.driftT=0;this.stuckT=0;this.stuckP=new V(x,0,z);this.root.visible=true;this.seeing=false;this.dist=99;this.stepAcc=0;this.doorWait=null;this.speed=0;}
 get chasing(){return this.state==='chase'||this.state==='drag';}
 /* ---------- perception ---------- */
 sees(G){const p=G.player,S=G.skill;if(p.hidden||this.state==='retreat'||!this.root.visible)return false;const dy=Math.abs(p.y-this.pos.y);if(p.L!==this.L&&dy>1.9)return false;if(dy>2.4)return false;
  const dx=p.pos.x-this.pos.x,dz=p.pos.z-this.pos.z,d=Math.hypot(dx,dz);let range=S.range*(p.flash?1:p.lit?.8:.5)*(p.crouch?.78:1);const fx=Math.sin(this.yaw),fz=Math.cos(this.yaw);const dot=(dx*fx+dz*fz)/(d||1);
  const beam=p.flash&&p.beamAt(this.pos)>.6&&d<15;if(d>range&&!beam)return false;if(dot<S.see&&d>2.4&&!beam)return false;return this.house.los(this.L,this.pos.x,this.pos.z,p.pos.x,p.pos.z);}
 hear(G,pos,L,r){const S=G.skill;if(this.state==='chase'||this.state==='drag'||this.state==='retreat'||this.cool>0)return false;if(this.state==='dormant'&&this.dormantT<S.grace*.6)return false;
  const d=Math.hypot(pos.x-this.pos.x,pos.z-this.pos.z)+Math.abs(pos.y-this.pos.y)*1.6,eff=r*S.hear*(L!==this.L?.6:1);if(d>eff)return false;
  const e=S.err*(1+d/eff*2);this.state='investigate';this.target={L,x:pos.x+(R()-.5)*e,z:pos.z+(R()-.5)*e};this.path=null;this.waitT=R()*.4;return true;}
 /* ---------- think + move ---------- */
 update(dt,G){const S=G.skill,p=G.player,H=this.house;this.t+=dt;this.cool=Math.max(0,this.cool-dt);
  if(this.state==='retreat'){this.root.visible=false;this.waitT-=dt;if(this.waitT<=0)G.respawnStalker(this);return;}
  if(this.state==='scare'){this.root.visible=true;return;}
  if(this.state==='dormant'){this.dormantT+=dt;if(this.dormantT>S.grace){this.state='roam';this.path=null;}}
  const dx=p.pos.x-this.pos.x,dz=p.pos.z-this.pos.z;this.dist=Math.hypot(dx,dz)+Math.abs(p.y-this.pos.y)*1.5;
  // sight → alert meter
  const see=this.state!=='dormant'&&this.cool<=0&&this.sees(G);this.seeing=see;
  if(see){const d=Math.hypot(dx,dz);this.alert+=dt*S.notice*(d<4?6:1.6-d/(S.range*1.2))*(p.flash?1.25:.8);this.lastSeen={L:p.L,x:p.pos.x,z:p.pos.z};this.loseT=0;
   if(this.alert>=1&&!this.chasing){this.state='chase';this.path=null;G.onSpotted();}else if(!this.chasing&&this.alert>.35&&this.state!=='investigate'){this.state='investigate';this.target={L:p.L,x:p.pos.x,z:p.pos.z};this.path=null;this.waitT=.6;G.onNotice();}}
  else this.alert=Math.max(0,this.alert-dt*(this.chasing?.08:.22));this.alert=Math.min(this.alert,1.2);
  let speed=0;
  switch(this.state){
   case 'dormant':case 'roam':{speed=S.walk*(this.state==='dormant'?.8:1);if(this.waitT>0){this.waitT-=dt;speed=0;break;}
    if(!this.path||!this.path.length){this.target=G.roamTarget(this);this.path=this.target&&H.path(this.L,this.pos.x,this.pos.z,this.target.L,this.target.x,this.target.z);if(!this.path)this.waitT=1;else this.waitT=R()<.35?1.5+R()*3:0;}
    if(this.state==='roam'&&S.drift){this.driftT+=dt;if(this.driftT>S.drift){this.driftT=0;this.state='investigate';this.target={L:p.L,x:p.pos.x+(R()-.5)*6,z:p.pos.z+(R()-.5)*6};this.path=null;}}break;}
   case 'investigate':{speed=S.inv;if(this.waitT>0){this.waitT-=dt;speed=0;this._face(this.target,dt*3);break;}
    if(!this.path){this.path=H.path(this.L,this.pos.x,this.pos.z,this.target.L,this.target.x,this.target.z);if(!this.path){this.state='search';this.searchT=S.search*.5;this.searchAt=this.target;}}
    else if(!this.path.length){this.state='search';this.searchT=S.search*.6;this.searchAt={L:this.L,x:this.pos.x,z:this.pos.z};this.path=null;this.waitT=1.2;}break;}
   case 'search':{speed=S.walk*.9;this.searchT-=dt;if(this.waitT>0){this.waitT-=dt;speed=0;break;}
    if(!this.path||!this.path.length){const a=this.searchAt||{L:this.L,x:this.pos.x,z:this.pos.z};const tx=a.x+(R()-.5)*7,tz=a.z+(R()-.5)*7;this.path=H.path(this.L,this.pos.x,this.pos.z,a.L,tx,tz);this.waitT=1+R()*1.8;if(!this.path)this.path=[];}
    // a hidden player close by may give itself away by breathing
    if(p.hidden&&this.dist<2.6&&!p.holding&&R()<dt*S.breath*(p.panic?2:1)){this.sawHide=p.hidden;this.state='drag';this.path=null;G.onSpotted(true);}
    if(this.searchT<=0){this.state='roam';this.path=null;this.alert=0;}break;}
   case 'chase':{speed=S.run;this.repathT-=dt;const tgt=see?{L:p.L,x:p.pos.x,z:p.pos.z}:this.loseT<(S.n==='HARD'?2:.6)?{L:p.L,x:p.pos.x,z:p.pos.z}:this.lastSeen;
    if(!see)this.loseT+=dt;if(p.hidden&&this.sawHide===p.hidden){this.state='drag';this.path=null;break;}
    if(this.repathT<=0||!this.path){this.repathT=.3;this.path=tgt&&H.path(this.L,this.pos.x,this.pos.z,tgt.L,tgt.x,tgt.z);}
    if(this.loseT>S.lose||(!see&&this.path&&!this.path.length)){this.state='search';this.searchT=S.search;this.searchAt=this.lastSeen;this.path=null;this.alert=.5;this.sawHide=null;G.onLost();}
    if(see&&this.dist<1.15&&!p.hidden&&p.L===this.L)G.caught(this);break;}
   case 'drag':{speed=S.run*.9;const h=p.hidden||G.hideById(this.sawHide);if(!h){this.state='search';this.searchT=S.search;this.path=null;break;}
    if(!this.path){this.path=H.path(this.L,this.pos.x,this.pos.z,h.L,h.ex,h.ez);if(!this.path){this.state='search';this.searchT=S.search;}}
    const d=Math.hypot(h.ex-this.pos.x,h.ez-this.pos.z);if(d<.9||(this.path&&!this.path.length&&d<1.6)){if(p.hidden===h)G.caught(this,true);else{this.state='search';this.searchT=S.search;this.path=null;}}break;}}
  this.speed=this._follow(dt,speed,G);
  // stuck → new plan
  if(speed>0){this.stuckT+=dt;if(this.stuckT>2.5){if(this.stuckP.distanceTo(new V(this.pos.x,0,this.pos.z))<.3){this.path=null;if(this.state==='investigate'||this.state==='search'){this.state='roam';}this.waitT=.3;}this.stuckT=0;this.stuckP.set(this.pos.x,0,this.pos.z);}}
  this._animate(dt,G);}
 _face(t,k){if(!t)return;const a=Math.atan2(t.x-this.pos.x,t.z-this.pos.z);let d=a-this.yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;this.yaw+=d*Math.min(1,k);}
 _follow(dt,speed,G){const H=this.house;if(!this.path||!this.path.length||speed<=0)return 0;const nx=this.path[0];let dx=nx.x-this.pos.x,dz=nx.z-this.pos.z;const d=Math.hypot(dx,dz);
  if(d<.22){this.path.shift();return speed*.5;}dx/=d;dz/=d;
  // a closed door ahead: open it (a loud shove when chasing), wait for it to swing
  const ax=Math.floor(this.pos.x+dx*.55),az=Math.floor(this.pos.z+dz*.55);const dr=H.door(this.L,ax,az);if(dr&&!dr.pass){if(dr.locked){this.path=null;return 0;}if(!dr.open)G.openDoor(dr,this);this._face({x:nx.x,z:nx.z},.2);return 0;}
  const step=Math.min(d,speed*dt);this.pos.x+=dx*step;this.pos.z+=dz*step;this._face({x:this.pos.x+dx,z:this.pos.z+dz},dt*(this.chasing?10:5));
  this.pos.y=H.groundAt(this.L,this.pos.x,this.pos.z);this.L=H.levelAt(this.L,this.pos.x,this.pos.y,this.pos.z);
  this.stepAcc+=step;const stride=this.chasing?1.25:.85;if(this.stepAcc>stride){this.stepAcc=0;G.stalkerStep(this);}return speed;}
 _animate(dt,G){const a=this.anim,run=this.chasing?1:0,mv=cl(this.speed/1.4,0,1);a.run+=(run-a.run)*Math.min(1,dt*4);a.lean+=((run?.42:.12)-a.lean)*Math.min(1,dt*3);
  this.gait+=dt*(this.speed>0?(2.4+this.speed*1.5):0);const ph=this.gait,sw=Math.sin(ph)*mv;
  this.root.position.copy(this.pos);this.root.rotation.y=this.yaw;this.body.rotation.x=a.lean;this.body.position.y=1.15+Math.abs(Math.cos(ph))*.05*mv;this.body.rotation.z=Math.sin(ph)*.05*mv;
  for(const l of this.legs){const s=l.s*sw;l.hp.rotation.x=s*(.45+a.run*.35)-a.lean;l.kn.rotation.x=Math.max(0,-Math.sin(this.gait+(l.s>0?0:Math.PI)))*(.6+a.run*.5)*mv;}
  for(const r of this.arms){const s=-r.s*sw;r.sh.rotation.x=a.run?(-.4-a.reach)+s*.6:s*.25+.05-a.reach;r.sh.rotation.z=r.s*(.26+a.run*.15);r.el.rotation.x=-.25-a.run*.5-a.reach*.3;r.hand.rotation.x=-.2;}
  // the head: slow searching sweeps, sudden twitches, locks on when it sees you
  const look=this.state==='search'||this.waitT>0?Math.sin(this.t*.9)*.9:this.seeing?0:Math.sin(this.t*.35)*.25;a.look+=(look-a.look)*Math.min(1,dt*2);
  this.head.rotation.y=a.look+(R()<.01?(R()-.5)*.6:0);this.head.rotation.z=Math.sin(this.t*.6)*.15+(this.state==='search'?.3:0);this.head.rotation.x=-a.lean*.8;
  this.shroud.rotation.x=-a.lean*.5;const gl=this.chasing?1.6:this.seeing?1.2:.7;for(const e of this.eyes)e.material.color.setRGB(3.2*gl,2.4*gl*(this.chasing?.5:1),2*gl*(this.chasing?.4:1));}
}
