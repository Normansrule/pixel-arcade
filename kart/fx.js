// CRITTER KART — particle effects: drift sparks, boost flames, water spray, dust, explosions, lightning, confetti.
import * as THREE from '../vendor/three.module.min.js';
import {V,Particles} from './util.js';
const C=h=>new THREE.Color(h);
export class FX{
 constructor(scene){this.scene=scene;this.add=new Particles(scene,3000,true);this.soft=new Particles(scene,2600,false);this.bolts=[];this.t=0;}
 trail(p,col,size=1){const c=C(col);this.add.emit(p.x,p.y,p.z,(Math.random()-.5)*2,(Math.random()-.5)*2,(Math.random()-.5)*2,c.r*.7,c.g*.7,c.b*.7,.45*size,.3);if(Math.random()<.5)this.soft.emit(p.x,p.y,p.z,0,.6,0,.7,.7,.72,.7*size,.7,0,1,1.5);}
 boom(p,kind){const fire=[C(0xffd040),C(0xff7a20),C(0xff3010)],goo=[C(0x8aff4a),C(0x4ad81a)],ice=[C(0xffffff),C(0xa8e8ff)];
  const col=kind==='goo'?goo:kind==='ice'?ice:fire;this.add.burst(p,40,16,col,1.2,.7,{drag:2.2});this.soft.burst(p,16,5,[C(0x9a9aa0),C(0x7a7a80)],2.6,1.2,{grow:2,drag:1.5,up:true});}
 spark(p,lvl){const c=lvl===2?[C(0xffa020),C(0xff6a10)]:lvl===1?[C(0x60c0ff),C(0xb0e8ff)]:[C(0xffffff)];this.add.burst(p,2,5,c,.45,.3,{up:true,grav:12,drag:1});}
 flame(p,dir,big){const c=big?[C(0x80d0ff),C(0xffffff)]:[C(0xffb040),C(0xff6020)];for(let k=0;k<2;k++)this.add.emit(p.x,p.y,p.z,dir.x*8+(Math.random()-.5)*2,dir.y*8+Math.random(),dir.z*8+(Math.random()-.5)*2,c[k].r,c[k].g,c[k].b,big?1:.7,.22);}
 spray(p,v,col=0xe8f8ff){const c=C(col);for(let k=0;k<2;k++)this.soft.emit(p.x+(Math.random()-.5)*2,p.y,p.z+(Math.random()-.5)*2,(Math.random()-.5)*4,3+Math.random()*4*Math.min(1,v/25),(Math.random()-.5)*4,c.r,c.g,c.b,1+Math.random(),.7,9,.8,1.6);}
 dust(p,col=0xd8c8a0){const c=C(col);this.soft.emit(p.x+(Math.random()-.5),p.y+.2,p.z+(Math.random()-.5),(Math.random()-.5)*2,1+Math.random(),(Math.random()-.5)*2,c.r,c.g,c.b,1.2,.8,0,1,2.5);}
 sparkle(p,col=0xffffff,n=18){this.add.burst(p,n,7,[C(col),C(0xffffff)],.7,.6,{drag:2});}
 confetti(p){this.add.burst(p,60,14,[C(0xff4d8a),C(0xffd03a),C(0x3ac8ff),C(0x7aff4a)],.8,1.6,{grav:6,drag:1.2,up:true});}
 bolt(p){const pts=[];let x=p.x,z=p.z;for(let y=60;y>=p.y;y-=6){pts.push(new V(x,y,z));x+=(Math.random()-.5)*3;z+=(Math.random()-.5)*3;}pts.push(p.clone());
  const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xe0e8ff}));this.scene.add(l);this.bolts.push({l,t:.35});
  this.add.burst(p,30,14,[C(0x8090c0),C(0xa0a8c0)],.6,.5,{drag:2});const L=new THREE.PointLight(0xb0c0ff,120,40,1.5);L.position.copy(p);L.position.y+=4;this.scene.add(L);this.bolts.push({l:L,t:.25});}
 scale(cam,h){this.add.U.uScale.value=this.soft.U.uScale.value=h/(2*Math.tan(cam.fov*Math.PI/360));}
 update(dt){this.add.update(dt);this.soft.update(dt);
  this.bolts=this.bolts.filter(b=>{b.t-=dt;if(b.t<=0){this.scene.remove(b.l);if(b.l.geometry)b.l.geometry.dispose();return false;}return true;});}
 clear(){this.add.clear();this.soft.clear();this.bolts.forEach(b=>this.scene.remove(b.l));this.bolts=[];}}
