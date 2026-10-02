// STRIKE ZONE — pickups: health, mega, armour, shards, ammo crates, weapons, quad damage, glory-kill orbs (magnetic drops) + respawn.
import * as THREE from '../vendor/three.module.min.js';
import {mergeRig} from './monsters.js';
const V=THREE.Vector3,R=Math.random;
export const ITEM={
 hp:{respawn:20,col:0x40ff90},mega:{respawn:60,col:0x60c0ff},armor:{respawn:25,col:0x5ac8ff},megaarmor:{respawn:60,col:0x8ad8ff},shard:{respawn:15,col:0x80e0ff},
 shells:{respawn:18,col:0xff9a30},bullets:{respawn:18,col:0xffd040},cells:{respawn:18,col:0x40d8ff},rockets:{respawn:22,col:0xff4020},slugs:{respawn:22,col:0x50ff80},
 quad:{respawn:90,col:0xb050ff},orb:{col:0x50ff80},aorb:{col:0x60c8ff},weapon:{respawn:25,col:0xffb040}};
const std=o=>new THREE.MeshStandardMaterial(o);
const glowM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.4)});
const haloM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(.5),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
const GEO={sph:new THREE.SphereGeometry(1,16,12),box:new THREE.BoxGeometry(1,1,1),oct:new THREE.OctahedronGeometry(1,0),ico:new THREE.IcosahedronGeometry(1,0),cyl:new THREE.CylinderGeometry(1,1,1,14),ring:new THREE.RingGeometry(.55,.75,32).rotateX(-Math.PI/2)};
function m(geo,mat,s,x=0,y=0,z=0,p){const o=new THREE.Mesh(geo,mat);if(Array.isArray(s))o.scale.set(...s);else o.scale.setScalar(s);o.position.set(x,y,z);o.castShadow=true;p&&p.add(o);return o;}
function model(kind,w){const g=new THREE.Group(),col=ITEM[kind].col;const dark=std({color:0x1a1a1e,metalness:.8,roughness:.35});
 if(kind==='hp'){m(GEO.cyl,std({color:0xdddddd,metalness:.6,roughness:.3}),[.18,.1,.18],0,.32,0,g);m(GEO.cyl,glowM(col),[.15,.42,.15],0,.58,0,g);m(GEO.cyl,std({color:0xdddddd,metalness:.6,roughness:.3}),[.18,.08,.18],0,.82,0,g);}
 else if(kind==='mega'){m(GEO.sph,glowM(col),.32,0,.7,0,g);m(GEO.sph,haloM(col),.55,0,.7,0,g);const r=new THREE.Mesh(new THREE.TorusGeometry(.48,.03,6,32),glowM(0xffffff));r.position.y=.7;g.add(r);g.userData.ring=r;}
 else if(kind==='armor'||kind==='megaarmor'){const c=kind==='megaarmor'?0xffd060:col;m(GEO.box,std({color:c,metalness:.85,roughness:.25,emissive:c,emissiveIntensity:.35}),[.6,.55,.22],0,.65,0,g);for(const s of[-1,1])m(GEO.sph,std({color:c,metalness:.85,roughness:.25}),[.18,.12,.18],s*.32,.9,0,g);m(GEO.box,glowM(c),[.08,.4,.24],0,.65,0,g);}
 else if(kind==='shard'){m(GEO.oct,glowM(col),[.13,.22,.13],0,.5,0,g);}
 else if(kind==='orb'||kind==='aorb'){m(GEO.sph,glowM(col),.13,0,0,0,g);m(GEO.sph,haloM(col),.26,0,0,0,g);}
 else if(kind==='quad'){m(GEO.ico,std({color:0x2a0a50,metalness:.5,roughness:.2,emissive:col,emissiveIntensity:1.6}),.36,0,.9,0,g);m(GEO.ico,haloM(col),.62,0,.9,0,g);}
 else if(kind==='weapon'){const gm=std({color:0x2c2a2a,metalness:.9,roughness:.3});const gl=glowM(w.col);const s=1.5;
  if(w.id==='rl'){m(GEO.cyl,gm,[.09*s,.6*s,.09*s],0,.6,0,g).rotation.z=Math.PI/2;m(GEO.sph,gl,.07*s,.32*s,.6,0,g);}
  else if(w.id==='cg'){for(let k=0;k<4;k++){m(GEO.cyl,gm,[.02*s,.5*s,.02*s],0,.6+Math.cos(k*1.57)*.05*s,Math.sin(k*1.57)*.05*s,g).rotation.z=Math.PI/2;}m(GEO.box,gm,[.25*s,.14*s,.14*s],-.3*s,.6,0,g);m(GEO.box,gl,[.05,.05,.16*s],-.3*s,.7*s,0,g);}
  else{const L=w.id==='rg'?.7:w.id==='ssg'?.55:.5;m(GEO.box,gm,[L*s,.1*s,.08*s],0,.6,0,g);m(GEO.cyl,w.id==='pg'?gl:gm,[.03*s,L*.8*s,.03*s],L*.25*s,.66,0,g).rotation.z=Math.PI/2;if(w.id==='ssg')m(GEO.cyl,gm,[.03*s,L*.8*s,.03*s],L*.25*s,.66,.06,g).rotation.z=Math.PI/2;m(GEO.box,gl,[L*.6*s,.03,.09*s],-.05,.67,0,g);m(GEO.box,gm,[.08*s,.16*s,.06*s],-L*.3*s,.48,0,g);}}
 else{// ammo crate
  m(GEO.box,dark,[.5,.32,.36],0,.2,0,g);m(GEO.box,glowM(col),[.52,.06,.38],0,.25,0,g);m(GEO.box,std({color:col,metalness:.5,roughness:.4}),[.2,.1,.38],0,.39,0,g);}
 mergeRig(g);return g;}

export class Items{
 constructor(scene){this.scene=scene;this.list=[];this.ringM={};}
 clear(){for(const it of this.list){this.scene.remove(it.g);if(it.ring)this.scene.remove(it.ring);}this.list.length=0;}
 add(kind,pos,o={}){const g=model(kind,o.w);g.position.copy(pos);this.scene.add(g);const it={kind,g,pos:pos.clone(),base:pos.y,placed:!!o.placed,t:R()*6,active:true,respawnT:0,w:o.w,vel:o.vel?o.vel.clone():null,life:o.life||0,secret:o.secret};
  if(it.placed){const c=ITEM[kind].col;if(!this.ringM[kind])this.ringM[kind]=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(.9),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});it.ring=new THREE.Mesh(GEO.ring,this.ringM[kind]);it.ring.position.set(pos.x,pos.y+.04,pos.z);this.scene.add(it.ring);}
  this.list.push(it);return it;}
 // magnetic drops fly to the player; placed items bob and respawn
 update(dt,G,take){const P=G.player;for(let i=this.list.length-1;i>=0;i--){const it=this.list[i];it.t+=dt;
   if(!it.active){it.respawnT-=dt;if(it.respawnT<=0&&!G.noRespawn){it.active=true;it.g.visible=true;G.fx&&G.fx.sparks.burst(it.pos.clone().add(new V(0,.6,0)),20,4,[new THREE.Color(ITEM[it.kind].col).multiplyScalar(2)],.12,.5,{up:true});}continue;}
   if(it.vel){it.vel.y-=18*dt;it.pos.addScaledVector(it.vel,dt);const gr=G.L.groundAt(it.pos.x,it.pos.z,it.pos.y+.3)+.35;if(it.pos.y<gr){if(gr>-30){it.pos.y=gr;it.vel.y*=-.3;it.vel.x*=.6;it.vel.z*=.6;}if(Math.abs(it.vel.y)<.6&&gr>-30){it.vel=null;it.base=it.pos.y;}}}
   if(it.life){it.life-=dt;if(it.life<=0){this.remove(i);continue;}it.g.visible=it.life>2.5||Math.sin(it.t*20)>0;}
   const dx=P.pos.x-it.pos.x,dy=P.pos.y+.8-it.pos.y,dz=P.pos.z-it.pos.z,d=Math.hypot(dx,dy,dz);
   const magnet=(it.kind==='orb'||it.kind==='aorb'||(!it.placed&&it.kind!=='weapon'))&&d<5.5&&G.player.alive;
   if(magnet&&take(it,true)){const k=Math.min(1,dt*(6+12/(d+.3)));it.pos.x+=dx*k;it.pos.y+=dy*k;it.pos.z+=dz*k;it.vel=null;it.base=it.pos.y;}
   if(!it.vel&&!magnet){it.g.position.set(it.pos.x,it.base+Math.sin(it.t*2.4)*.08,it.pos.z);}else it.g.position.copy(it.pos);
   it.g.rotation.y+=dt*(it.kind==='quad'?2:1.4);if(it.g.userData.ring)it.g.userData.ring.rotation.x=it.t;
   if(d<1.25&&P.alive&&take(it,false)){if(it.placed&&ITEM[it.kind].respawn&&!it.secret){it.active=false;it.respawnT=ITEM[it.kind].respawn;it.g.visible=false;}else this.remove(i);}}}
 remove(i){const it=this.list[i];this.scene.remove(it.g);if(it.ring)this.scene.remove(it.ring);this.list.splice(i,1);}}
