// HARBOR PALS — the three helper creatures + the harbor-hand (player) rig. Procedural low-poly parts baked into a few
// vertex-coloured meshes per animated group (adapted from pets/models.js), species gaits, and trail following
// with stuck detection and a safe teleport recovery.
import * as THREE from '../vendor/three.module.min.js';
import {ground,heightAt,STEP} from './world.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const GEO={sph:new THREE.IcosahedronGeometry(1,2),cyl:new THREE.CylinderGeometry(1,1,1,10),cone:new THREE.ConeGeometry(1,1,8),box:new THREE.BoxGeometry(1,1,1),tor:new THREE.TorusGeometry(1,.3,8,16)};
const MAT=[new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:0}),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.18,metalness:0})];
const C=c=>new THREE.Color(c);
function part(g,geo,col,x,y,z,sx,sy=sx,sz=sx,rx=0,ry=0,rz=0,gloss){const m=new THREE.Mesh(GEO[geo],null);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);m.userData.c=C(col);m.userData.g=gloss;g.add(m);return m;}
function grp(p,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
function bake(g,mat){const L=[[],[]];for(const m of[...g.children])if(m.isMesh&&m.userData.c){L[m.userData.g?1:0].push(m);g.remove(m);}
 for(let k=0;k<2;k++){if(!L[k].length)continue;let n=0;const gs=L[k].map(m=>{m.updateMatrix();const q=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();q.applyMatrix4(m.matrix);n+=q.attributes.position.count;return[q,m.userData.c];});
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;for(const[q,c]of gs){const P=q.attributes.position,N=q.attributes.normal,cnt=P.count;pos.set(P.array,o*3);nor.set(N.array,o*3);for(let i=0;i<cnt;i++){const f=.9+N.getY(i)*.1;col[(o+i)*3]=c.r*f;col[(o+i)*3+1]=c.g*f;col[(o+i)*3+2]=c.b*f;}o+=cnt;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeBoundingSphere();
  const mesh=new THREE.Mesh(geo,(mat&&k===0)?mat:MAT[k]);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
 for(const c of g.children)if(c.isGroup)bake(c,c.userData.mat||mat);}
function eyes(g,y,z,sep,r,col='#1a1620'){for(const s of[-1,1]){part(g,'sph','#ffffff',s*sep,y,z,r,r*1.1,r*.7,0,0,0,1);part(g,'sph',col,s*sep,y+.004,z+r*.45,r*.62,r*.72,r*.4,0,0,0,1);part(g,'sph','#ffffff',s*sep+r*.22,y+r*.32,z+r*.78,r*.22,r*.22,r*.15,0,0,0,1);}}

/* ================= species ================= */
// gait: walk cycle Hz per m/s, bob height, max speed. ab: the ability key. col: the HUD tint (never the only cue).
export const SPECIES={
 mollo:{name:'MOLLO',ab:'dig',abName:'DIG',verb:'digs up buried things',col:'#ff8a3a',body:'low · wide · sprout',speed:6.4,gait:3.4,bob:.07,gap:1.5},
 stilt:{name:'STILT',ab:'bridge',abName:'BRIDGE',verb:'stretches into a bridge',col:'#2fb8a8',body:'tall · long legs · flat shell',speed:5.6,gait:1.25,bob:.12,gap:2},
 fizz:{name:'FIZZ',ab:'zap',abName:'ZAP',verb:'glows and zaps machines',col:'#d6ff6a',body:'floating · glowing · tendrils',speed:6,gait:.9,bob:.14,gap:1.6}};
export const ORDER=['mollo','stilt','fizz'];

function makeMollo(){const root=new THREE.Group(),body=grp(root,0,0,0),U={root,body,legs:[],claws:[]};
 const o='#e8743a',belly='#f8dcb0',dk='#b8582a';
 part(body,'sph',o,0,.42,0,.58,.4,.55);part(body,'sph',belly,0,.34,.2,.44,.28,.36);part(body,'sph',dk,0,.56,-.18,.42,.2,.34);
 for(let i=0;i<3;i++)part(body,'sph',dk,-.2+i*.2,.7,-.05-i*.04,.09,.05,.09);// back spots
 part(body,'sph',belly,0,.4,.52,.2,.15,.2);part(body,'sph','#ff6a86',0,.43,.71,.085,.075,.07,0,0,0,1);
 for(const s of[-1,1])part(body,'sph',belly,s*.07,.4,.68,.025,.025,.025);// nose nubs
 eyes(body,.6,.4,.17,.075);for(const s of[-1,1])part(body,'sph','#ff9a8a',s*.27,.45,.42,.07,.04,.04);
 for(const s of[-1,1])part(body,'sph',o,s*.4,.74,.08,.09,.1,.05);// ears
 const sprout=grp(body,0,.8,0);U.sprout=sprout;part(sprout,'cyl','#4a8a2a',0,.1,0,.025,.22,.025);part(sprout,'sph','#6ac83a',-.1,.24,0,.13,.04,.07,0,0,.5);part(sprout,'sph','#8ae04a',.1,.27,0,.12,.04,.07,0,0,-.6);
 for(const s of[-1,1]){const c=grp(body,s*.46,.28,.32);U.claws.push(c);part(c,'sph','#fff0d6',0,0,0,.2,.07,.24);for(let k=0;k<3;k++)part(c,'cone','#f4f0e6',(k-1)*.1,0,.24,.035,.12,.035,Math.PI/2);}
 for(const s of[-1,1]){const L=grp(body,s*.3,.14,-.3);U.legs.push(L);part(L,'sph',dk,0,-.06,0,.13,.08,.17);}
 part(body,'sph',o,0,.38,-.56,.08,.08,.1);
 bake(root);return U;}
function makeStilt(){const root=new THREE.Group(),body=grp(root,0,0,0),U={root,body,legs:[],shins:[],claws:[]};
 const t='#2a9c90',lt='#86e0d0',leg='#ff8a5a',bill='#f6e2a6';
 const shell=grp(body,0,1.42,0);U.shell=shell;part(shell,'sph',t,0,0,0,.55,.22,.74);part(shell,'sph',lt,0,.1,0,.46,.14,.62);for(let i=0;i<3;i++)part(shell,'tor','#1f7a72',0,.04,-.38+i*.38,.52,.52,.3,Math.PI/2);
 part(shell,'sph','#f4f0e6',0,-.14,.05,.42,.1,.55);
 for(const s of[-1,1]){const c=grp(shell,s*.32,-.18,.5);U.claws.push(c);part(c,'cyl',leg,0,-.12,0,.04,.24,.04);part(c,'cone',leg,-.04*s,-.3,.03,.05,.14,.05,0,0,Math.PI+.3*s);part(c,'cone',leg,.04*s,-.3,-.03,.05,.14,.05,0,0,Math.PI-.3*s);}
 const neck=grp(shell,0,.08,.55);U.neck=neck;part(neck,'cyl',t,0,.25,.08,.075,.55,.075,.3);
 const head=grp(neck,0,.55,.2);U.head=head;part(head,'sph',t,0,0,0,.17,.15,.22);part(head,'box',bill,0,-.04,.3,.12,.05,.36);part(head,'box','#d8b874',0,-.075,.28,.1,.025,.3);
 eyes(head,.07,.1,.11,.06);for(let i=0;i<3;i++)part(head,'cone',leg,0,.14+i*.02,-.1-i*.08,.03,.18,.03,-.7-i*.25);
 for(const s of[-1,1]){const L=grp(body,s*.22,1.28,0);U.legs.push(L);part(L,'cyl',leg,0,-.33,0,.055,.66,.055);part(L,'sph',leg,0,-.66,0,.07);const sh=grp(L,0,-.66,0);U.shins.push(sh);part(sh,'cyl',leg,0,-.3,0,.045,.6,.045);part(sh,'sph','#e86a3a',0,-.6,.08,.1,.04,.18);}
 bake(root);return U;}
let fizzMat=null;
function makeFizz(){const root=new THREE.Group(),body=grp(root,0,1,0),U={root,body,legs:[],claws:[],tend:[]};
 fizzMat=fizzMat||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,emissive:0x7ab83a,emissiveIntensity:.35,transparent:true,opacity:.93});
 const dome=grp(body,0,0,0);dome.userData.mat=fizzMat;U.dome=dome;part(dome,'sph','#bce86a',0,.06,0,.4,.34,.4);part(dome,'sph','#f4ffb0',0,.14,0,.22,.18,.22);part(dome,'tor','#8ac84a',0,-.12,0,.38,.38,.5,Math.PI/2);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;part(dome,'sph','#c8f080',Math.cos(a)*.31,.22,Math.sin(a)*.31,.06,.04,.06);}
 const face=grp(body,0,0,0);eyes(face,.06,.3,.13,.1,'#2a2440');part(face,'tor','#3a2a40',0,-.07,.36,.04,.03,.03,0,0,Math.PI);
 const ant=grp(body,0,.36,0);U.ant=ant;part(ant,'cyl','#8ab84a',0,.12,0,.018,.26,.018);const spark=grp(ant,0,.28,0);spark.userData.mat=fizzMat;part(spark,'sph','#ffffa0',0,0,0,.07);
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.3,t=grp(body,Math.cos(a)*.22,-.16,Math.sin(a)*.22);t.userData.mat=fizzMat;U.tend.push(t);let p=t;for(let k=0;k<3;k++){part(p,'sph',k===2?'#ffffa0':'#c8f080',0,-.1,0,.06-k*.01,.1,.06-k*.01);const n=grp(p,0,-.16,0);n.userData.mat=fizzMat;p=n;}}
 bake(root);
 const light=new THREE.PointLight(0xd8ff8a,1.5,7,1.6);light.position.y=1;root.add(light);U.light=light;return U;}
const MAKERS={mollo:makeMollo,stilt:makeStilt,fizz:makeFizz};

/* ================= the player: a small harbor-hand in a yellow raincoat ================= */
export function makeKid(){const root=new THREE.Group(),body=grp(root,0,0,0),U={root,body,legs:[],arms:[]};
 const coat='#ffc83a',skin='#f6d0aa',pants='#2a3a5a',boot='#2a6a7a';
 for(const s of[-1,1]){const L=grp(body,s*.11,.42,0);U.legs.push(L);part(L,'cyl',pants,0,-.15,0,.075,.3,.075);part(L,'sph',boot,0,-.33,.04,.1,.09,.14);}
 part(body,'cone',coat,0,.68,0,.3,.56,.27);part(body,'sph',coat,0,.86,0,.2,.12,.18);for(let i=0;i<3;i++)part(body,'sph','#e8a020',0,.82-i*.13,.205+i*.03,.022,.022,.015,0,0,0,1);
 part(body,'box','#8a5a3a',0,.75,-.22,.3,.32,.14);part(body,'tor','#d8c08a',0,.95,-.24,.09,.09,.09,Math.PI/2);// backpack + rope coil
 for(const s of[-1,1]){const A=grp(body,s*.21,.86,0);U.arms.push(A);part(A,'cyl',coat,0,-.15,0,.06,.3,.06,0,0,s*.15);part(A,'sph',skin,s*.03,-.32,0,.06);}
 const head=grp(body,0,1.18,0);U.head=head;part(head,'sph',skin,0,0,0,.3,.28,.28);part(head,'sph',coat,0,.06,-.06,.33,.32,.3);part(head,'sph',skin,0,-.02,.08,.27,.25,.24);
 part(head,'sph','#7a3a2a',0,.17,.12,.2,.07,.14);eyes(head,-.0,.25,.1,.055,'#1a1620');for(const s of[-1,1])part(head,'sph','#ff9a8a',s*.17,-.08,.2,.05,.03,.02);
 part(head,'cone',coat,0,.33,-.08,.06,.12,.06,-.4);part(head,'sph','#ff6a5a',0,.4,-.13,.05);
 const hand=new THREE.Object3D();hand.position.set(.24,.52,.05);body.add(hand);U.hand=hand;
 bake(root);return U;}
export function animKid(U,t,spd,dt,carry){const w=Math.min(1,spd/4),f=t*(6+spd*1.6);U.body.position.y=Math.abs(Math.sin(f))*.06*w;
 U.legs.forEach((L,i)=>L.rotation.x=Math.sin(f+(i?Math.PI:0))*.75*w);U.arms.forEach((A,i)=>A.rotation.x=carry&&i===1?-1.1:Math.sin(f+(i?0:Math.PI))*.6*w);
 U.head.rotation.z=Math.sin(t*1.3)*.04*(1-w);U.body.rotation.x=w*.08;}

/* ================= a pal ================= */
export class Pal{
 constructor(id,scene){this.id=id;this.S=SPECIES[id];this.U=MAKERS[id]();this.root=this.U.root;scene.add(this.root);this.pos=new V();this.yaw=0;this.t=Math.random()*9;this.mode='wild';this.order=0;
  this.s=0;this.off=0;this.fade=1;this.free=null;this.reactT=0;this.react='';this.spd=0;this.stuckT=0;this.bestD=1e9;this.work=null;this.bridgeK=0;this.uses=0;this.home=new V();this.vy=0;}
 // own material copies so one pal can fade out when it stands between the camera and the player
 initFade(){this.mats=[];this.glowMats=[];this.root.traverse(o=>{if(o.isMesh){const g=o.material===fizzMat;o.material=o.material.clone();if(g)this.glowMats.push(o.material);o.material.userData.op=o.material.opacity;this.mats.push(o.material);}});}
 setFade(a,dt){const f=this.fade+(a-this.fade)*Math.min(1,dt*8);if(Math.abs(f-this.fade)<.002&&f===a)return;this.fade=f;for(const m of this.mats){const tr=f<.98||m.userData.op<1;if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true;}m.opacity=m.userData.op*f;m.depthWrite=f>.98;}if(this.U.light)this.U.light.intensity*=f;}
 place(p,yaw=0){this.pos.copy(p);this.pos.y=this.groundY(p.x,p.z);this.yaw=yaw;this.sync();}
 groundY(x,z){const h=heightAt(x,z);return h<-50?0:h;}
 sync(){this.root.position.copy(this.pos);this.root.rotation.y=this.yaw;}
 poke(kind){this.react=kind;this.reactT=kind==='pet'?1.1:kind==='joy'?1.4:1;}
 // walk straight toward goal (free mode); returns false when a wall or water blocks (the stuck timer then fires a teleport)
 walkTo(goal,dt,speed){const dx=goal.x-this.pos.x,dz=goal.z-this.pos.z,d=Math.hypot(dx,dz);if(d<.05){this.spd=0;return true;}
  const st=Math.min(d,speed*dt),nx=this.pos.x+dx/d*st,nz=this.pos.z+dz/d*st,g=ground(nx,nz),cur=this.pos.y;
  const fly=this.id==='fizz';if(!fly&&(g.h<-50||g.h-cur>STEP+.05)){this.spd=0;return false;}
  this.pos.x=nx;this.pos.z=nz;this.pos.y=fly?Math.max(g.h<-50?this.pos.y:g.h,-.2):lerp(cur,g.h,Math.min(1,dt*14));this.spd=st/dt;this.face(dx,dz,dt);return true;}
 face(dx,dz,dt){const a=Math.atan2(dx,dz);let d=a-this.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));this.yaw+=d*Math.min(1,dt*(this.id==='stilt'?5:9));}
 // per-species idle / walk / work animation
 anim(dt,lp){const U=this.U,S=this.S,t=this.t+=dt,sp=this.spd,w=cl(sp/3.5,0,1),f=t*(S.gait*Math.max(1.6,sp)*1.9);let r=this.reactT>0?this.reactT-=dt:0;const rk=this.react;
  const work=this.mode==='work'&&this.work&&this.work.t>0?this.work.kind:null;
  if(this.id==='mollo'){U.body.position.y=Math.abs(Math.sin(f))*S.bob*w+Math.sin(t*2)*.01;U.body.rotation.z=Math.sin(f)*.12*w;U.legs.forEach((L,i)=>L.rotation.x=Math.sin(f+(i?Math.PI:0))*.9*w);
   U.claws.forEach((c,i)=>{c.rotation.x=work==='dig'?Math.sin(t*28+i*Math.PI)*.9-.4:Math.sin(f+(i?0:Math.PI))*.5*w;});U.body.rotation.x=work==='dig'?.45:0;
   U.sprout.rotation.z=Math.sin(t*3)*.15+Math.sin(f)*.2*w;}
  else if(this.id==='stilt'){const b=this.bridgeK;U.body.position.y=(Math.sin(f*2)*.5+.5)*S.bob*w-b*1.32+Math.sin(t*1.4)*.015;U.legs.forEach((L,i)=>L.rotation.x=lerp(Math.sin(f+(i?Math.PI:0))*.55*w,1.45,b));
   U.shins.forEach((s,i)=>s.rotation.x=lerp(Math.max(0,-Math.sin(f+(i?Math.PI:0)))*.8*w,.1,b));U.shell.scale.z=lerp(1,3.15,b);U.shell.position.y=lerp(1.42,1.42,b);
   U.neck.rotation.x=lerp(Math.sin(f)*.15*w+(rk==='sniff'&&r>0?.6:0),1.25,b);U.head.rotation.x=lerp(Math.sin(t*1.7)*.1,-1.1,b);U.claws.forEach((c,i)=>c.rotation.x=Math.sin(t*2+i)*.2-b*1.2);}
  else{U.body.position.y=.85+Math.sin(t*2.6)*S.bob+(work==='zap'?.3:0);U.body.rotation.z=Math.sin(t*1.3)*.08+(sp>.5?Math.sin(t*4)*.05:0);U.body.rotation.x=w*.25;
   U.tend.forEach((tn,i)=>{let p=tn,k=0;while(p){p.rotation.x=Math.sin(t*3+i+k)*.25-w*.4;p.rotation.z=Math.cos(t*2.3+i*1.7+k)*.2;p=p.children.find(c=>c.isGroup);k++;}});
   U.ant.rotation.z=Math.sin(t*5)*.2;const glow=(lp??1)*(1+(work==='zap'?Math.random()*2.5:0)+(rk==='pet'&&r>0?1.5:0));U.light.intensity=1.5*glow;const ei=.3+.12*Math.sin(t*3)+(work==='zap'?.6:0)+(rk==='pet'&&r>0?.4:0);for(const m of this.glowMats||[])m.emissiveIntensity=ei;}
  // reactions: pet = hop + wiggle, joy = spin hop, no = head shake, sniff = lean
  if(r>0){const k=r;if(rk==='pet'){U.root.position.y+=Math.abs(Math.sin(k*9))*.35*k;U.body.rotation.z+=Math.sin(k*22)*.18;}
   else if(rk==='joy'){U.root.position.y+=Math.abs(Math.sin(k*6))*.5*k;U.root.rotation.y+=(1.4-k)*Math.PI*2/1.4;}
   else if(rk==='no'){U.body.rotation.y=Math.sin(k*24)*.3*k;}
   else if(rk==='sniff'){U.body.rotation.x+=.25*Math.sin(Math.min(1,k)*Math.PI);}}
  else U.body.rotation.y=0;}}

/* ================= trail following =================
   The player leaves breadcrumbs (every 0.3 m, with cumulative distance). Each following pal keeps an arc position s along that
   trail, a gap behind the player that depends on its place in line, and walks the player's exact path: around the corners and
   down the stairs the player took. A pal off the trail (just joined, back from a job) walks straight to its trail point; if a wall
   or water stops it, or it falls 16 m behind, it poofs to a safe trail point (the player stood there). */
export class Trail{
 constructor(){this.p=[];}
 reset(pos,seed=[]){const a=seed.length?seed[0]:pos;this.p=[{x:a.x,y:a.y,z:a.z,d:0}];for(const q of seed.slice(1))this.push(q);this.push(pos);}
 get end(){return this.p[this.p.length-1].d;}
 push(pos){const l=this.p[this.p.length-1];const d=Math.hypot(pos.x-l.x,pos.z-l.z);if(d>=.3){this.p.push({x:pos.x,y:pos.y,z:pos.z,d:l.d+d});if(this.p.length>400)this.p.splice(0,100);}}
 at(s,out){const P=this.p;if(s<=P[0].d)return out.set(P[0].x,P[0].y,P[0].z);let lo=0,hi=P.length-1;if(s>=P[hi].d)return out.set(P[hi].x,P[hi].y,P[hi].z);
  while(hi-lo>1){const m=(lo+hi)>>1;if(P[m].d<=s)lo=m;else hi=m;}const a=P[lo],b=P[hi],t=(s-a.d)/Math.max(1e-6,b.d-a.d);return out.set(lerp(a.x,b.x,t),lerp(a.y,b.y,t),lerp(a.z,b.z,t));}
 get start(){return this.p[0].d;}}
const _g=new V(),_h=new V();
export function followStep(pal,trail,player,dt,gapBefore,onTeleport,side=0){
 const want=Math.max(trail.start,trail.end-gapBefore);
 if(pal.free){// walking back to the trail
  trail.at(Math.max(trail.start,want),_g);const ok=pal.walkTo(_g,dt,pal.S.speed*1.15);const d=Math.hypot(_g.x-pal.pos.x,_g.z-pal.pos.z);
  if(d<pal.bestD-.05){pal.bestD=d;pal.stuckT=0;}else pal.stuckT+=dt;
  if(d<.6){pal.free=null;pal.s=want;pal.bestD=1e9;}
  else if(pal.stuckT>1.6||!ok&&pal.stuckT>.6||Math.hypot(player.x-pal.pos.x,player.z-pal.pos.z)>16){pal.free=null;pal.s=want;trail.at(want,pal.pos);pal.pos.y=pal.groundY(pal.pos.x,pal.pos.z);pal.bestD=1e9;pal.stuckT=0;onTeleport&&onTeleport(pal);}
  return;}
 if(pal.s<trail.start)pal.s=trail.start;
 const lag=want-pal.s;let spd=0;if(lag>0){spd=Math.min(pal.S.speed*(lag>4?1.5:1),lag*3.2+.6);pal.s=Math.min(want,pal.s+spd*dt);}
 trail.at(pal.s,_g);trail.at(Math.min(trail.end,pal.s+.6),_h);const dx=_h.x-_g.x,dz=_h.z-_g.z;
 // stand a little to one side of the trail (alternating down the line) where the ground there is the same walkable level
 const tl=Math.hypot(dx,dz);let want2=0;if(side&&tl>.05){const px=dz/tl,pz=-dx/tl,cx=_g.x+px*side*.75,cz=_g.z+pz*side*.75,ch=heightAt(cx,cz),gh=heightAt(_g.x,_g.z);if(ch>-50&&Math.abs(ch-gh)<.15&&heightAt(_g.x+px*side*1.1,_g.z+pz*side*1.1)>gh-.4)want2=side*.75;pal.px=px;pal.pz=pz;}
 pal.off+=(want2-pal.off)*Math.min(1,dt*3);const ox=(pal.px||0)*pal.off,oz=(pal.pz||0)*pal.off;
 pal.pos.x=_g.x+ox;pal.pos.z=_g.z+oz;const gy=pal.groundY(pal.pos.x,pal.pos.z);pal.pos.y=pal.id==='fizz'?lerp(pal.pos.y,gy,Math.min(1,dt*6)):lerp(pal.pos.y,gy,Math.min(1,dt*16));
 pal.spd=lag>.02?spd:0;if(Math.hypot(dx,dz)>.05&&pal.spd>0)pal.face(dx,dz,dt);else{const px=player.x-pal.pos.x,pz=player.z-pal.pos.z;if(Math.hypot(px,pz)>.3)pal.face(px,pz,dt*.5);}
 if(Math.hypot(player.x-pal.pos.x,player.z-pal.pos.z)>16&&trail.end-pal.s>16){pal.s=want;trail.at(want,pal.pos);onTeleport&&onTeleport(pal);}}
