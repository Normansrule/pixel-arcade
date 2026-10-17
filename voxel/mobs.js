// VOXEL FRONTIER — creatures: grazing sheep, pigs and hens by day; shamblers, bonewalker archers, bloaters and
// cave crawlers in the dark. Blocky rigs with walk cycles, hurt flashes, light-aware shading, simple steering AI.
import * as THREE from '../vendor/three.module.min.js';
import {SOL,LIQ} from './blocks.js';

const faceTex=(paint)=>{const c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');paint((a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);});const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;return t;};
const FACES={
 sheep:faceTex(p=>{p(0,0,8,8,'#d8c8b0');p(1,3,2,1,'#fff');p(5,3,2,1,'#fff');p(2,3,1,1,'#222');p(5,3,1,1,'#222');p(3,5,2,2,'#e8a0a0');p(0,0,8,1,'#eee');}),
 pig:faceTex(p=>{p(0,0,8,8,'#f0a0a0');p(1,2,2,2,'#fff');p(5,2,2,2,'#fff');p(2,3,1,1,'#222');p(5,3,1,1,'#222');p(2,5,4,2,'#e07a80');p(3,5,1,1,'#7a3036');p(5,5,1,1,'#7a3036');}),
 hen:faceTex(p=>{p(0,0,8,8,'#f4f4f0');p(1,2,1,1,'#222');p(6,2,1,1,'#222');p(2,4,4,2,'#f2a020');p(3,6,2,2,'#e02020');}),
 shambler:faceTex(p=>{p(0,0,8,8,'#5f7a5a');p(0,0,8,2,'#3a4a36');p(1,3,2,1,'#ffe060');p(5,3,2,1,'#ffe060');p(2,5,4,1,'#2a2a22');p(3,6,1,1,'#7a1a1a');p(6,1,1,2,'#4a6046');}),
 bone:faceTex(p=>{p(0,0,8,8,'#e6e2d2');p(1,2,2,2,'#1a1a1a');p(5,2,2,2,'#1a1a1a');p(3,5,2,1,'#3a3a3a');p(1,6,6,1,'#7a7a70');p(2,6,1,1,'#e6e2d2');p(4,6,1,1,'#e6e2d2');}),
 bloat:faceTex(p=>{p(0,0,8,8,'#5c9a3c');p(1,2,2,2,'#101410');p(5,2,2,2,'#101410');p(2,5,4,2,'#203018');p(3,4,2,1,'#c8ff5a');}),
 crawl:faceTex(p=>{p(0,0,8,8,'#2a2030');p(1,2,1,1,'#ff3030');p(6,2,1,1,'#ff3030');p(2,3,1,1,'#ff5050');p(5,3,1,1,'#ff5050');p(3,6,2,1,'#c8a0d0');})};
export const KINDS={
 sheep:{hp:8,sp:1.2,w:.45,h:1.3,hostile:0,face:'sheep',col:{a:'#ecece4',b:'#c8bca8'}},
 pig:{hp:10,sp:1.3,w:.45,h:.95,hostile:0,face:'pig',col:{a:'#f0a6a6',b:'#d88a8a'}},
 hen:{hp:4,sp:1.5,w:.25,h:.8,hostile:0,face:'hen',col:{a:'#f4f4f0',b:'#f2b020'}},
 shambler:{hp:20,sp:2.6,w:.3,h:1.9,hostile:1,dmg:3,face:'shambler',col:{a:'#2c7a86',b:'#5f7a5a',c:'#33384a'},burn:1},
 bonewalker:{hp:16,sp:2.4,w:.3,h:1.95,hostile:1,dmg:3,face:'bone',col:{a:'#e6e2d2',b:'#bcb8a8',c:'#4a3424'},burn:1,ranged:1},
 bloater:{hp:14,sp:2.2,w:.45,h:1.7,hostile:1,dmg:0,face:'bloat',col:{a:'#5c9a3c',b:'#c8ff5a'},boom:1},
 crawler:{hp:12,sp:4,w:.6,h:.7,hostile:1,dmg:2,face:'crawl',col:{a:'#2a2030',b:'#4a3858'}}};
const geoCache={};const box=(w,h,d)=>{const k=w+'_'+h+'_'+d;return geoCache[k]||(geoCache[k]=new THREE.BoxGeometry(w,h,d));};
function build(kind){const K=KINDS[kind],g=new THREE.Group(),mats=[],legs=[],arms=[];
 const M=(hex,em)=>{const m=new THREE.MeshLambertMaterial({color:hex,emissive:em||0x000000,emissiveIntensity:em?1.6:0});m.userData.base=new THREE.Color(hex);mats.push(m);return m;};
 const ma=M(K.col.a),mb=M(K.col.b),mc=K.col.c?M(K.col.c):mb;const fm=new THREE.MeshLambertMaterial({map:FACES[K.face]});fm.userData.base=new THREE.Color(1,1,1);mats.push(fm);
 const part=(w,h,d,m,x,y,z,parent=g)=>{const o=new THREE.Mesh(box(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 const head=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(box(w,h,d),[m,m,m,m,fm,m]);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;};
 const limb=(w,h,d,m,x,y,z,arr,rx=0)=>{const p=new THREE.Group();p.position.set(x,y,z);g.add(p);const o=part(w,h,d,m,0,-h/2,0,p);p.rotation.x=rx;arr.push(p);return p;};
 let hd=null;
 if(kind==='sheep'){part(.86,.72,1.2,ma,0,.95,0);hd=head(.46,.46,.5,mb,0,1.2,.74);part(.56,.2,.46,ma,0,1.48,.7);for(const[x,z]of[[-.26,-.4],[.26,-.4],[-.26,.4],[.26,.4]])limb(.2,.6,.2,mb,x,.6,z,legs);}
 else if(kind==='pig'){part(.78,.62,1.1,ma,0,.72,0);hd=head(.56,.52,.5,ma,0,.86,.72);part(.26,.18,.08,mb,0,.78,.99);for(const[x,z]of[[-.24,-.36],[.24,-.36],[-.24,.36],[.24,.36]])limb(.22,.4,.22,mb,x,.4,z,legs);}
 else if(kind==='hen'){part(.42,.42,.56,ma,0,.52,0);hd=head(.3,.36,.26,ma,0,.86,.26);part(.12,.4,.36,ma,-.26,.56,0);part(.12,.4,.36,ma,.26,.56,0);for(const x of[-.1,.1])limb(.07,.3,.07,mb,x,.32,0,legs);}
 else if(kind==='shambler'||kind==='bonewalker'){const bone=kind==='bonewalker';const tw=bone?.16:.25;
  for(const x of[-.13,.13])limb(tw,.76,tw,bone?mb:mc,x,.76,0,legs);part(bone?.42:.5,.74,bone?.2:.28,ma,0,1.13,0);if(bone){part(.36,.08,.22,mb,0,1.32,0);part(.36,.08,.22,mb,0,1.14,0);}
  hd=head(.5,.5,.5,bone?ma:mb,0,1.76,0);for(const x of[-.34,.34])limb(bone?.14:.22,.72,bone?.14:.22,bone?mb:mb,x,1.46,0,arms,bone?-.6:-1.45);
  if(bone){const bow=M('#5a3a20');const b=new THREE.Group();b.position.set(0,-.7,.05);arms[0].add(b);part(.05,.9,.05,bow,0,0,.12,b);part(.05,.25,.05,bow,0,.42,.04,b).rotation.x=.6;part(.05,.25,.05,bow,0,-.42,.04,b).rotation.x=-.6;}}
 else if(kind==='bloater'){part(.9,.92,.9,ma,0,.92,0);hd=head(.74,.4,.74,ma,0,1.56,0);const spot=M('#c8ff5a',0x9aff30);for(const[a,b,c]of[[.46,1.1,.1],[-.46,.9,-.2],[.1,1.2,.46],[-.2,.8,.46],[.2,1.35,-.46],[-.3,1.25,-.46]])part(.16,.16,.16,spot,a,b,c);for(const x of[-.24,.24])limb(.26,.46,.26,ma,x,.46,0,legs);}
 else if(kind==='crawler'){part(.9,.42,1.0,ma,0,.5,-.1);hd=head(.56,.4,.42,mb,0,.52,.56);for(let i=0;i<4;i++)for(const s of[-1,1]){const p=new THREE.Group();p.position.set(s*.42,.52,-.4+i*.26);g.add(p);const o=part(.7,.08,.08,mb,s*.32,0,0,p);o.rotation.z=s*.5;legs.push(p);}}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return{g,mats,legs,arms,hd};}

const _v=new THREE.Vector3(),_ray=new THREE.Ray(),_box=new THREE.Box3();
export class Mobs{
 constructor(scene,api){this.scene=scene;this.api=api;this.list=[];this.arrows=[];this.arrowGeo=new THREE.BoxGeometry(.04,.04,.6);this.arrowMat=new THREE.MeshLambertMaterial({color:0xd8c8a8});}
 spawn(kind,x,y,z){const K=KINDS[kind],r=build(kind);r.g.position.set(x,y,z);this.scene.add(r.g);const m={kind,K,...r,hp:K.hp*(K.hostile?this.api.hpMul():1),vx:0,vy:0,vz:0,on:false,t:Math.random()*10,hurt:0,cd:1+Math.random(),fuse:0,dir:Math.random()*6.28,panic:0,burn:0,yaw:0,idle:0,strafe:Math.random()<.5?1:-1,lit:1};
  m.pos=r.g.position;this.list.push(m);return m;}
 remove(m){this.scene.remove(m.g);m.mats.forEach(x=>x.dispose());const i=this.list.indexOf(m);if(i>=0)this.list.splice(i,1);}
 clear(){for(const m of this.list.slice())this.remove(m);for(const a of this.arrows)this.scene.remove(a.mesh);this.arrows=[];}
 count(f){return this.list.filter(f).length;}
 collides(x,y,z,w,h){const g=this.api.get;for(let bx=Math.floor(x-w);bx<=Math.floor(x+w-1e-6);bx++)for(let by=Math.floor(y);by<=Math.floor(y+h-1e-6);by++)for(let bz=Math.floor(z-w);bz<=Math.floor(z+w-1e-6);bz++)if(SOL[g(bx,by,bz)])return true;return false;}
 // ray vs mob boxes; returns {m,t}
 hit(o,d,maxD){let best=null,bt=maxD;_ray.set(o,d);for(const m of this.list){const p=m.pos,w=m.K.w+.08;_box.min.set(p.x-w,p.y,p.z-w);_box.max.set(p.x+w,p.y+m.K.h,p.z+w);if(_ray.intersectBox(_box,_v)){const t=_v.distanceTo(o);if(t<bt){bt=t;best=m;}}}return best?{m:best,t:bt}:null;}
 damage(m,n,from,kb=1){if(m.dead)return false;m.hp-=n;m.hurt=.3;if(from){const dx=m.pos.x-from.x,dz=m.pos.z-from.z,d=Math.hypot(dx,dz)||1;m.vx+=dx/d*6*kb;m.vz+=dz/d*6*kb;m.vy=Math.max(m.vy,5.5);}if(!m.K.hostile)m.panic=4;if(m.hp<=0){m.dead=true;return true;}return false;}
 step(dt,P){const api=this.api;for(const m of this.list.slice()){if(m.dead){this.api.onDeath(m);this.remove(m);continue;}this.ai(m,dt,P);this.phys(m,dt);this.anim(m,dt);
   const d=Math.hypot(m.pos.x-P.x,m.pos.z-P.z);if(d>90||m.pos.y<-10)this.remove(m);}
  // arrows
  for(const a of this.arrows.slice()){a.t-=dt;if(a.t<=0){this.scene.remove(a.mesh);this.arrows.splice(this.arrows.indexOf(a),1);continue;}if(a.stuck)continue;
   a.vel.y-=16*dt;const np=a.mesh.position.clone().addScaledVector(a.vel,dt);if(SOL[api.get(Math.floor(np.x),Math.floor(np.y),Math.floor(np.z))]){a.stuck=true;a.t=3;api.sfx('thunk',a.mesh.position);continue;}
   a.mesh.position.copy(np);a.mesh.lookAt(np.clone().add(a.vel));
   if(Math.abs(np.x-P.x)<.4&&Math.abs(np.z-P.z)<.4&&np.y>P.y&&np.y<P.y+1.85){api.hurtPlayer(a.dmg,{x:np.x-a.vel.x,z:np.z-a.vel.z},'arrow');this.scene.remove(a.mesh);this.arrows.splice(this.arrows.indexOf(a),1);}}}
 shoot(m,P){const from=new THREE.Vector3(m.pos.x,m.pos.y+1.5,m.pos.z);const to=new THREE.Vector3(P.x+P.vx*.35,P.y+1.2,P.z+P.vz*.35);const d=from.distanceTo(to);const sp=19;const t=d/sp;const vel=to.sub(from).divideScalar(t);vel.y+=8*t;
  const spread=this.api.diff()===0?.9:.45;vel.x+=(Math.random()-.5)*spread;vel.z+=(Math.random()-.5)*spread;const mesh=new THREE.Mesh(this.arrowGeo,this.arrowMat);mesh.position.copy(from);this.scene.add(mesh);this.arrows.push({mesh,vel,t:4,dmg:Math.round(3*this.api.dmgMul()),stuck:false});this.api.sfx('bow',from);}
 ai(m,dt,P){const K=m.K,api=this.api,p=m.pos;m.t+=dt;if(m.hurt>0)m.hurt-=dt;m.cd-=dt;let ax=0,az=0,want=0;const dx=P.x-p.x,dz=P.z-p.z,dist=Math.hypot(dx,dz)||1,dy=P.y-p.y;
  const lt=api.light(p.x,p.y+K.h*.8,p.z);m.lit=Math.max(api.lc(lt>>4)*api.dayF(),api.lc(lt&15)*1.1,.12);
  // sunlight burns night creatures
  if(K.burn&&(lt>>4)>=15&&api.dayF()>.6&&!api.inWater(p)){m.burn+=dt;if(m.burn>.5){m.burn=0;this.damage(m,2,null);api.smoke(p.x,p.y+1,p.z);}}
  const chase=K.hostile&&api.alive()&&dist<(K.boom?20:26)&&Math.abs(dy)<12;
  if(!K.hostile){if(m.panic>0){m.panic-=dt;want=1.9;m.dir=Math.atan2(-dx,-dz)+Math.sin(m.t*3)*.6;}else{m.idle-=dt;if(m.idle<=0){m.idle=2+Math.random()*5;m.walk=Math.random()<.55;m.dir+=Math.random()*3-1.5;}want=m.walk?.6:0;}ax=Math.sin(m.dir)*want;az=Math.cos(m.dir)*want;m.yaw=m.dir;}
  else if(chase){const ang=Math.atan2(dx,dz);m.yaw=ang;
   if(K.ranged){const pref=9;let f=dist>pref+2?1:dist<pref-3?-.8:0;ax=Math.sin(ang)*f+Math.cos(ang)*m.strafe*.5;az=Math.cos(ang)*f-Math.sin(ang)*m.strafe*.5;if(Math.random()<dt*.4)m.strafe*=-1;
    if(m.cd<=0&&dist<22){m.cd=api.diff()===2?1.5:2.3;this.shoot(m,P);}}
   else if(K.boom){if(m.fuse<=0||dist>2.6){ax=dx/dist;az=dz/dist;}if(dist<2.6&&Math.abs(dy)<2){if(m.fuse===0)api.sfx('hiss',p);m.fuse+=dt;}else if(dist>4.5)m.fuse=Math.max(0,m.fuse-dt);
    if(m.fuse>1.5){m.dead=true;m.exploded=true;api.explode(p.x,p.y+.8,p.z,2.6,true);return;}}
   else{ax=dx/dist;az=dz/dist;if(K===KINDS.crawler&&dist<5&&dist>1.6&&m.on&&m.cd<=0){m.vy=6.5;m.vx=dx/dist*8;m.vz=dz/dist*8;m.cd=1.6;api.sfx('crawl',p);}
    if(dist<1.25+K.w&&Math.abs(dy)<1.7&&m.cd<=0){m.cd=1;api.hurtPlayer(Math.round(K.dmg*api.dmgMul()),p,m.kind);}}
   if(Math.random()<dt*.18)api.sfx(m.kind,p);want=1;}
  else{m.idle-=dt;if(m.idle<=0){m.idle=2+Math.random()*4;m.dir+=Math.random()*3-1.5;}ax=Math.sin(m.dir)*.35;az=Math.cos(m.dir)*.35;m.yaw=m.dir;}
  if(m.sideT>0){m.sideT-=dt;const c=Math.cos(1.3*m.side),sn=Math.sin(1.3*m.side);const nx=ax*c-az*sn,nz=ax*sn+az*c;ax=nx;az=nz;}
  const sp=K.sp*(K.hostile?api.spdMul():1)*(m.fuse>0?.3:1);const k=Math.min(1,(m.on?10:2)*dt);m.vx+=(ax*sp-m.vx)*k;m.vz+=(az*sp-m.vz)*k;}
 phys(m,dt){const p=m.pos,K=m.K,inW=this.api.inWater(p);const w=Math.min(.42,K.w),h=Math.min(1.8,K.h);
  if(this.collides(p.x,p.y+.01,p.z,w,h)){p.y=Math.floor(p.y)+1;m.vy=0;return;}m.vy-=(inW?6:24)*dt;if(inW&&m.vy<1.6)m.vy+=14*dt;m.vy=Math.max(m.vy,-30);
  let blocked=false;
  for(const ax of['x','z']){const v=(ax==='x'?m.vx:m.vz)*dt;if(!v)continue;const o=p[ax];p[ax]+=v;if(this.collides(p.x,p.y+.01,p.z,w,h)){p[ax]=o;blocked=true;}}
  if(blocked){if(m.on)m.vy=7.4;m.stuck=(m.stuck||0)+dt;if(m.stuck>.8){m.side=(Math.random()<.5?1:-1);m.sideT=1.2;m.stuck=0;}}else m.stuck=Math.max(0,(m.stuck||0)-dt);
  const oy=p.y;p.y+=m.vy*dt;if(this.collides(p.x,p.y,p.z,w,h)){if(m.vy<0){p.y=Math.floor(p.y)+1;if(this.collides(p.x,p.y,p.z,w,h))p.y=oy;m.on=true;}else p.y=oy;m.vy=0;}else m.on=false;}
 anim(m,dt){const s=Math.min(1,Math.hypot(m.vx,m.vz)/2),sw=Math.sin(m.t*(m.K.hostile?9:8))*s*.7;m.legs.forEach((l,i)=>{if(m.kind==='crawler')l.rotation.y=Math.sin(m.t*14+i)*.35*s;else l.rotation.x=(i%2?sw:-sw);});
  if(m.kind==='shambler')m.arms.forEach((a,i)=>a.rotation.x=-1.45+Math.sin(m.t*4+i)*.08);if(m.kind==='bonewalker'){m.arms[0].rotation.x=-1.4;m.arms[1].rotation.x=-1.2+Math.sin(m.t*2)*.05;}
  let dyaw=m.yaw-m.g.rotation.y;dyaw=Math.atan2(Math.sin(dyaw),Math.cos(dyaw));m.g.rotation.y+=dyaw*Math.min(1,dt*8);
  if(m.hd&&!m.K.hostile)m.hd.rotation.x=m.idle>0&&!m.walk&&Math.sin(m.t*.7)>.3?.6:0;
  const fs=m.fuse>0?1+Math.min(1,m.fuse/1.5)*.32:1;m.g.scale.set(fs,fs,fs);
  const flash=m.hurt>0,blink=m.fuse>0&&Math.sin(m.fuse*24)>0;for(const mt of m.mats){mt.color.copy(mt.userData.base).multiplyScalar(m.lit);if(flash){mt.color.lerp(new THREE.Color(1,.15,.1),.6);}if(blink)mt.color.setRGB(1.6,1.6,1.6);}}}
