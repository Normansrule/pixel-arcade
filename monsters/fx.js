// BLOCK BEASTS — voxel particle system, battle ring, type palettes.
import * as THREE from '../vendor/three.module.min.js';

export const PAL={EMBER:['#ff4a10','#ff9a26','#ffe070'],TIDE:['#2a8cff','#7cc8ff','#e0f6ff'],LEAF:['#3aa82a','#7ad84a','#d8ff8a'],SPARK:['#ffd23a','#fff27a','#ffffff'],STONE:['#8a6a48','#a88860','#6a5a4a'],
 FROST:['#8be6ff','#dff8ff','#ffffff'],WIND:['#e6eeff','#b8d0ff','#ffffff'],SHADE:['#7a3aff','#b88aff','#2a1050'],BASIC:['#ffffff','#ffe8c0','#d8d0c0'],HEAL:['#6aff8a','#c8ffb0','#ffffff'],CUBE:['#7ffff0','#ffffff','#2fd6c8'],GREAT:['#c8a0ff','#ffd23a','#ffffff']};
// physics feel per type: grav (+ falls), drag, glow
const FEEL={EMBER:{g:-3,drag:1.5,glow:1},TIDE:{g:14,drag:.5,glow:.7},LEAF:{g:2,drag:2.2,glow:.6},SPARK:{g:0,drag:4,glow:1.4},STONE:{g:18,drag:.3,glow:0},FROST:{g:1.5,drag:1.8,glow:.9},WIND:{g:-.5,drag:2.5,glow:.6},SHADE:{g:-1,drag:2,glow:.9},BASIC:{g:6,drag:1,glow:.6},HEAL:{g:-3,drag:1.5,glow:1},CUBE:{g:0,drag:2,glow:1.5},GREAT:{g:0,drag:2,glow:1.5}};
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3(),_p=new THREE.Vector3(),_c=new THREE.Color();
export class Particles{
 constructor(scene,n=900){this.n=n;this.list=[];for(let i=0;i<n;i++)this.list.push({t:0});this.head=0;
  const g=new THREE.BoxGeometry(1,1,1);this.glow=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(1,1,1),toneMapped:true}),n);this.glow.frustumCulled=false;this.glow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.solid=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({roughness:.8}),n);this.solid.frustumCulled=false;this.solid.castShadow=true;this.solid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<n;i++){this.glow.setColorAt(i,_c.setRGB(1,1,1));this.solid.setColorAt(i,_c.setRGB(1,1,1));_m.makeScale(0,0,0);this.glow.setMatrixAt(i,_m);this.solid.setMatrixAt(i,_m);}scene.add(this.glow,this.solid);}
 // spawn one particle: p (Vector3), v (Vector3), o {col, life, size, g, drag, glow, spin}
 add(p,v,o){const P=this.list[this.head];this.head=(this.head+1)%this.n;P.x=p.x;P.y=p.y;P.z=p.z;P.vx=v.x;P.vy=v.y;P.vz=v.z;P.t=P.life=o.life||.8;P.s=o.size||.12;P.g=o.g??6;P.drag=o.drag??1;P.r=Math.random()*6;P.spin=o.spin??5;P.glow=(o.glow??1)>0;P.bright=1+(o.glow??1)*1.2;_c.set(o.col||'#fff');P.cr=_c.r;P.cg=_c.g;P.cb=_c.b;P.dirty=true;P.shrink=o.shrink??1;}
 // burst of a type's particles at p
 burst(p,type,n=24,speed=3,o={}){const pal=PAL[type]||PAL.BASIC,F=FEEL[type]||FEEL.BASIC;for(let i=0;i<n;i++){const a=Math.random()*6.283,e=(Math.random()-.3)*2,sp=speed*(.4+Math.random()*.8);
  this.add(p,_p.set(Math.cos(a)*Math.cos(e)*sp,Math.abs(Math.sin(e))*sp*(o.up??1)+(o.lift||0),Math.sin(a)*Math.cos(e)*sp),{col:pal[i%pal.length],life:(o.life||.7)*(.6+Math.random()*.7),size:(o.size||.11)*(.6+Math.random()*.9),g:o.g??F.g,drag:o.drag??F.drag,glow:o.glow??F.glow});}}
 // stream from a to b (projectiles) — returns nothing; call each frame while active
 stream(a,b,type,k,n=3,o={}){const pal=PAL[type]||PAL.BASIC,F=FEEL[type]||FEEL.BASIC;for(let i=0;i<n;i++){const t=Math.min(1,k+(Math.random()-.5)*.08);_p.lerpVectors(a,b,t);_p.y+=Math.sin(t*Math.PI)*(o.arc||0);_p.x+=(Math.random()-.5)*(o.spread||.15);_p.y+=(Math.random()-.5)*(o.spread||.15);_p.z+=(Math.random()-.5)*(o.spread||.15);
  this.add(_p,new THREE.Vector3((Math.random()-.5)*.6,(Math.random()-.5)*.6,(Math.random()-.5)*.6),{col:pal[(Math.random()*pal.length)|0],life:o.life||.35,size:(o.size||.12)*(.6+Math.random()*.8),g:F.g*.2,drag:3,glow:o.glow??F.glow});}}
 update(dt){let gi=0,si=0;const G=this.glow,S=this.solid;let any=false;
  for(let i=0;i<this.n;i++){const P=this.list[i];const tgt=P.glow?G:S;if(P.t<=0){if(P.dirty){_m.makeScale(0,0,0);tgt.setMatrixAt(i,_m);(P.glow?S:G).setMatrixAt(i,_m);P.dirty=false;any=true;}continue;}any=true;
   P.t-=dt;const dr=Math.exp(-P.drag*dt);P.vx*=dr;P.vy=P.vy*dr-P.g*dt;P.vz*=dr;P.x+=P.vx*dt;P.y+=P.vy*dt;P.z+=P.vz*dt;P.r+=dt*P.spin;
   const k=Math.max(0,P.t/P.life),sc=P.s*(P.shrink?Math.min(1,k*2.5):1);_m.compose(_p.set(P.x,P.y,P.z),_q.setFromEuler(_e.set(P.r,P.r*.7,P.r*.3)),_s.set(sc,sc,sc));tgt.setMatrixAt(i,_m);_m.makeScale(0,0,0);(P.glow?S:G).setMatrixAt(i,_m);
   if(P.dirty||P.glow){const b=P.glow?P.bright*(.5+k*.5):1;tgt.setColorAt(i,_c.setRGB(P.cr*b,P.cg*b,P.cb*b));}P.dirty=true;}
  if(any){G.instanceMatrix.needsUpdate=true;S.instanceMatrix.needsUpdate=true;if(G.instanceColor)G.instanceColor.needsUpdate=true;if(S.instanceColor)S.instanceColor.needsUpdate=true;}}
 clear(){for(const P of this.list)P.t=0;}
}

// battle ring: a dashed glowing ring that follows the terrain + posts that rise out of the ground
export class Ring{
 constructor(scene){this.N=48;this.NP=8;this.mat=new THREE.MeshBasicMaterial({color:new THREE.Color(2,2,2),transparent:true});
  this.tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(.42,.05,.12),this.mat,this.N);this.posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.14,.55,.14),this.mat,this.NP);
  for(const m of[this.tiles,this.posts]){m.frustumCulled=false;m.visible=false;scene.add(m);}
  this.light=new THREE.PointLight(0xffffff,0,14,1.6);scene.add(this.light);this.t=0;this.on=false;this.pos=[];}
 show(center,radius,col,groundFn){this.on=true;this.t=0;this.c=center.clone();this.rad=radius;this.mat.color.set(col).multiplyScalar(1.7);this.light.color.set(col);
  this.pos=[];for(let i=0;i<this.N;i++){const a=i/this.N*Math.PI*2,x=center.x+Math.cos(a)*radius,z=center.z+Math.sin(a)*radius;this.pos.push([x,groundFn(x,z,center.y+3),z,a]);}
  this.tiles.visible=this.posts.visible=true;this.light.position.set(center.x,center.y+2.2,center.z);}
 hide(){this.on=false;this.t=0;}
 update(dt){if(!this.tiles.visible)return;this.t+=dt;const k=this.on?Math.min(1,this.t/1.1):Math.max(0,1-this.t/.6);
  for(let i=0;i<this.N;i++){const[x,y,z,a]=this.pos[i];const ki=this.on?Math.max(0,Math.min(1,k*2-i/this.N)):k;const e=1-Math.pow(1-ki,3);
   _m.compose(_p.set(x,y+.03-(1-e)*.3,z),_q.setFromEuler(_e.set(0,-a,0)),_s.set(e,1,e));this.tiles.setMatrixAt(i,_m);
   if(i%(this.N/this.NP)===0){const j=i/(this.N/this.NP);const bob=Math.sin(this.t*2.4+j)*.06;_m.compose(_p.set(x,y-.35+e*.7+bob,z),_q.setFromEuler(_e.set(0,-a+this.t*.5,0)),_s.set(1,e,1));this.posts.setMatrixAt(j,_m);}}
  this.tiles.instanceMatrix.needsUpdate=this.posts.instanceMatrix.needsUpdate=true;this.mat.opacity=.55+.45*k;this.light.intensity=k*5;
  if(!this.on&&k<=0){this.tiles.visible=this.posts.visible=false;this.light.intensity=0;}}
}

// a reusable "!" / "?" sprite
export function iconSprite(ch,col){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='rgba(10,10,14,.75)';x.beginPath();x.arc(32,32,26,0,7);x.fill();x.strokeStyle=col;x.lineWidth=4;x.stroke();x.fillStyle=col;x.font='bold 40px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(ch,32,34);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));s.scale.setScalar(.6);s.renderOrder=999;return s;}
