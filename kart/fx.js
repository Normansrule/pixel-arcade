// CRITTER KART — particle effects: tiered drift sparks, tyre smoke, skid marks, boost flames, water spray, dust,
// explosions, lava, slipstream wind lines, trick stars, lightning, confetti.
import * as THREE from '../vendor/three.module.min.js';
import {V,Particles} from './util.js';
const C=h=>new THREE.Color(h);
const SPARK=[[C(0xffffff)],[C(0x60c0ff),C(0xb0e8ff)],[C(0xffa020),C(0xff6a10)],[C(0xd060ff),C(0xff8af0)]];
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new V(),_p=new V();
class Skids{constructor(scene,n=900){this.n=n;this.i=0;const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
  this.m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.22,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),n);this.m.frustumCulled=false;this.m.renderOrder=1;
  _m.makeScale(0,0,0);for(let k=0;k<n;k++)this.m.setMatrixAt(k,_m);scene.add(this.m);}
 add(a,b,w=.32){const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<.05||l>3)return;_p.set((a.x+b.x)/2,(a.y+b.y)/2+.06,(a.z+b.z)/2);_q.setFromEuler(_e.set(0,Math.atan2(dx,dz),0));_s.set(w,1,l+.05);_m.compose(_p,_q,_s);this.m.setMatrixAt(this.i,_m);this.i=(this.i+1)%this.n;this.m.instanceMatrix.needsUpdate=true;}
 clear(){_m.makeScale(0,0,0);for(let k=0;k<this.n;k++)this.m.setMatrixAt(k,_m);this.m.instanceMatrix.needsUpdate=true;}}
export class FX{
 constructor(scene){this.scene=scene;this.add=new Particles(scene,3500,true);this.soft=new Particles(scene,2800,false);this.skids=new Skids(scene);this.bolts=[];this.t=0;}
 trail(p,col,size=1){const c=C(col);this.add.emit(p.x,p.y,p.z,(Math.random()-.5)*2,(Math.random()-.5)*2,(Math.random()-.5)*2,c.r*.7,c.g*.7,c.b*.7,.45*size,.3);if(Math.random()<.5)this.soft.emit(p.x,p.y,p.z,0,.6,0,.7,.7,.72,.7*size,.7,0,1,1.5);}
 boom(p,kind){const fire=[C(0xffd040),C(0xff7a20),C(0xff3010)],goo=[C(0x8aff4a),C(0x4ad81a)],ice=[C(0xffffff),C(0xa8e8ff)];
  const col=kind==='goo'?goo:kind==='ice'||kind==='snowball'?ice:fire;this.add.burst(p,40,16,col,1.2,.7,{drag:2.2});this.soft.burst(p,16,5,kind==='snowball'?[C(0xffffff),C(0xe8f0ff)]:[C(0x9a9aa0),C(0x7a7a80)],2.6,1.2,{grow:2,drag:1.5,up:true});}
 spark(p,lvl,dir){const c=SPARK[Math.min(3,lvl)];this.add.burst(p,lvl>0?4:1,lvl>0?8:4,c,lvl>0?.32:.24,.24,{up:true,grav:18,drag:.6,dir:dir,spread:1.1});}
 smoke(p,col=0xd8d8d8,k=1){const c=C(col);this.soft.emit(p.x+(Math.random()-.5)*.4,p.y+.2,p.z+(Math.random()-.5)*.4,(Math.random()-.5)*1.2,.8+Math.random(),(Math.random()-.5)*1.2,c.r,c.g,c.b,.9*k,.7,0,1.4,1.8);}
 flame(p,dir,kind){const c=kind===3?[C(0xff70ff),C(0xffffff)]:kind===1?[C(0x80d0ff),C(0xffffff)]:kind===4?[C(0xffe080),C(0xffffff)]:[C(0xffb040),C(0xff6020)];for(let k=0;k<2;k++)this.add.emit(p.x,p.y,p.z,dir.x*8+(Math.random()-.5)*2,dir.y*8+Math.random(),dir.z*8+(Math.random()-.5)*2,c[k].r,c[k].g,c[k].b,kind?1:.7,.22);}
 spray(p,v,col=0xe8f8ff){const c=C(col);for(let k=0;k<2;k++)this.soft.emit(p.x+(Math.random()-.5)*2,p.y,p.z+(Math.random()-.5)*2,(Math.random()-.5)*4,3+Math.random()*4*Math.min(1,v/25),(Math.random()-.5)*4,c.r,c.g,c.b,1+Math.random(),.7,9,.8,1.6);}
 dust(p,col=0xd8c8a0){const c=C(col);this.soft.emit(p.x+(Math.random()-.5),p.y+.2,p.z+(Math.random()-.5),(Math.random()-.5)*2,1+Math.random(),(Math.random()-.5)*2,c.r,c.g,c.b,.95,.7,0,1.2,1.8);}
 ringDust(p,col=0xd8c8a0,n=14){const c=C(col);for(let k=0;k<n;k++){const a=k/n*Math.PI*2;this.soft.emit(p.x+Math.cos(a)*.8,p.y+.15,p.z+Math.sin(a)*.8,Math.cos(a)*5,.6,Math.sin(a)*5,c.r,c.g,c.b,1.1,.7,0,2.5,2);}}
 wind(p,yaw){const s=Math.sin(yaw),c=Math.cos(yaw);for(let k=0;k<2;k++){const o=(Math.random()-.5)*3,h=Math.random()*1.6;this.add.emit(p.x+c*o+s*3,p.y+.4+h,p.z-s*o+c*3,-s*24,0,-c*24,.5,.6,.7,.22,.2);}}
 stars(p){this.add.burst(p,16,9,[C(0xfff06a),C(0xffffff),C(0x8af0ff)],.7,.6,{drag:2.5,up:true});}
 lava(p,e){const c=[C(0xffe080),C(0xff8a20),C(0xff4010)];for(let k=0;k<3;k++){const q=c[k%3];this.add.emit(p.x+(Math.random()-.5)*1.4,p.y+.3,p.z+(Math.random()-.5)*1.4,(Math.random()-.5)*4,10+Math.random()*12*e,(Math.random()-.5)*4,q.r,q.g,q.b,1.2,.9,16,.4);}if(Math.random()<.3)this.soft.emit(p.x,p.y+4,p.z,0,4,0,.35,.3,.3,3,1.6,0,.6,2);}
 ember(p){const c=C(0xff7a20);this.add.emit(p.x+(Math.random()-.5)*2,p.y+.2,p.z+(Math.random()-.5)*2,0,2+Math.random()*2,0,c.r,c.g,c.b,.5,.6,0,1);}
 sparkle(p,col=0xffffff,n=18){this.add.burst(p,n,7,[C(col),C(0xffffff)],.7,.6,{drag:2});}
 rainbow(p,t){const c=new THREE.Color().setHSL((t*1.5)%1,1,.6);this.add.emit(p.x+(Math.random()-.5),p.y+.6+Math.random(),p.z+(Math.random()-.5),0,.5,0,c.r,c.g,c.b,.9,.5);}
 confetti(p){this.add.burst(p,60,14,[C(0xff4d8a),C(0xffd03a),C(0x3ac8ff),C(0x7aff4a)],.8,1.6,{grav:6,drag:1.2,up:true});}
 bolt(p){const pts=[];let x=p.x,z=p.z;for(let y=p.y+60;y>=p.y;y-=6){pts.push(new V(x,y,z));x+=(Math.random()-.5)*3;z+=(Math.random()-.5)*3;}pts.push(p.clone());
  const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xe0e8ff}));this.scene.add(l);this.bolts.push({l,t:.35});
  this.add.burst(p,30,14,[C(0x8090c0),C(0xa0a8c0)],.6,.5,{drag:2});this.add.burst(p,12,3,[C(0xe0e8ff)],3.5,.25,{drag:4});}
 scale(cam,h){this.add.U.uScale.value=this.soft.U.uScale.value=h/(2*Math.tan(cam.fov*Math.PI/360));}
 update(dt){this.add.update(dt);this.soft.update(dt);
  this.bolts=this.bolts.filter(b=>{b.t-=dt;if(b.t<=0){this.scene.remove(b.l);if(b.l.geometry)b.l.geometry.dispose();return false;}return true;});}
 clear(){this.add.clear();this.soft.clear();this.skids.clear();this.bolts.forEach(b=>this.scene.remove(b.l));this.bolts=[];}}
