// AEONFALL — visual effects: additive sparks and soft smoke particles, ground decals (telegraphs, rings, area spells),
// projectile visuals, lightning/beam strips, shockwave shells and pooled flash lights. Adapted from royale/fx.js.
import * as THREE from '../vendor/three.module.min.js';
import {height} from './map.js';

export class Particles{
 constructor(scene,n=4000,additive=true){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.grow=new Float32Array(n);this.i=0;this.add=additive;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('col',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 col;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=col;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}':'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.15,d)*vC.a;gl_FragColor=vec4(vC.rgb,a);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=3;scene.add(this.pts);this.geo=geo;this.hot=0;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.grow[i]=grow;this.hot=this.n;}
 burst(x,y,z,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.up)dy=Math.abs(dy)*(o.up===2?2:1);if(o.flat){dy*=.15;}const s=speed*(.3+Math.random()*.7);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(x,y,z,dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.grow??0);}}
 update(dt){if(this.hot<=0)return;this.hot--;const{p,v,c,oc,s,os,life,max,g,drag,grow}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}this.hot=Math.max(this.hot,2);life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(this.add){const f=k*k;c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=f;s[i]=os[i]*(.4+.6*k);}
   else{c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=Math.min(1,k*1.6)*Math.min(1,(1-k)*8)*.8;s[i]=os[i]*(1+(1-k)*grow[i]);}}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.col.needsUpdate=this.geo.attributes.size.needsUpdate=true;}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}}

// ground decals: one shader handles telegraphs (ring + filling disc), persistent area spells (swirl), rings and cones
const DEC_V='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const DEC_F=`uniform vec3 uC;uniform float uP,uA,uMode,uT,uHalf;varying vec2 vUv;
 void main(){vec2 d=vUv-.5;float r=length(d)*2.;if(r>1.)discard;float a=0.;
  if(uMode<.5){float ring=smoothstep(.9,.97,r)*smoothstep(1.,.975,r);float fill=step(r,uP)*(.22+.5*smoothstep(uP-.06,uP,r));a=ring*.95+fill+.08;}
  else if(uMode<1.5){float ang=atan(d.y,d.x);float sw=.5+.5*sin(ang*6.+uT*3.-r*8.);float ring=smoothstep(.86,.96,r)*smoothstep(1.,.96,r);a=ring*.9+(.12+.18*sw*r)*smoothstep(1.,.6,r);}
  else if(uMode<2.5){a=smoothstep(.75,.95,r)*smoothstep(1.,.95,r);}
  else{float ang=atan(d.x,d.y);if(abs(ang)>uHalf)discard;a=(.25+.5*smoothstep(.6,1.,r))*smoothstep(1.,.92,r);}
  gl_FragColor=vec4(uC*a*uA,1.);}`;
export class Decals{
 constructor(scene,n=48){this.list=[];const geo=new THREE.PlaneGeometry(2,2);geo.rotateX(-Math.PI/2);
  for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color()},uP:{value:0},uA:{value:1},uMode:{value:0},uT:{value:0},uHalf:{value:1}},vertexShader:DEC_V,fragmentShader:DEC_F,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
   m.visible=false;m.renderOrder=2;scene.add(m);this.list.push({m,t:0,life:0,o:null});}}
 get(){return this.list.find(d=>!d.m.visible)||this.list[0];}
 // o: {x,z,r,col,mode,life,fade,follow(),prog(),rot,half}
 add(o){const d=this.get();d.o=o;d.t=0;d.life=o.life??1;const m=d.m,u=m.material.uniforms;m.visible=true;u.uC.value.set(o.col);u.uMode.value=o.mode||0;u.uHalf.value=o.half||1;u.uP.value=0;u.uA.value=1;m.scale.setScalar(o.r);m.rotation.y=o.rot||0;this.place(d);return d;}
 place(d){const o=d.o;let x=o.x,z=o.z;if(o.follow){const p=o.follow();if(!p){d.m.visible=false;return;}x=p.x;z=p.z;}let h=-9;for(const[a,b]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]])h=Math.max(h,height(x+a*o.r*.7,z+b*o.r*.7));d.m.position.set(x,h+.12,z);}
 update(dt,t){for(const d of this.list){if(!d.m.visible)continue;d.t+=dt;const o=d.o,u=d.m.material.uniforms;u.uT.value=t;if(o.prog)u.uP.value=o.prog();else u.uP.value=Math.min(1,d.t/(d.life||1));
  if(o.alive&&!o.alive()){d.m.visible=false;continue;}if(o.follow||o.alive)this.place(d);
  const k=d.t/d.life;if(!o.alive&&k>=1){d.m.visible=false;continue;}if(o.fade)u.uA.value=Math.max(0,1-k)*(o.a||1);else u.uA.value=(o.a||1)*(o.pulse?(.75+.25*Math.sin(t*8)):1);if(o.grow)d.m.scale.setScalar(o.r*(.3+.7*Math.min(1,k*1.6)));}}
 clear(){for(const d of this.list)d.m.visible=false;}}

// shockwave shells
export class Shocks{constructor(scene,n=10){this.list=[];const geo=new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2);for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color()},uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(uC*f*uA,1.);}'}));m.visible=false;m.renderOrder=4;scene.add(m);this.list.push({m,t:0,d:1,r:1});}}
 fire(x,y,z,col,radius,dur,flat=.35){const s=this.list.find(s=>!s.m.visible)||this.list[0];s.m.position.set(x,y,z);s.m.material.uniforms.uC.value.set(col);s.t=0;s.d=dur;s.r=radius;s.flat=flat;s.m.visible=true;}
 update(dt){for(const s of this.list){if(!s.m.visible)continue;s.t+=dt;const k=s.t/s.d;if(k>=1){s.m.visible=false;continue;}const r=.3+s.r*(1-Math.pow(1-k,3));s.m.scale.set(r,r*s.flat,r);s.m.material.uniforms.uA.value=(1-k)*(1-k)*1.6;}}
 clear(){for(const s of this.list)s.m.visible=false;}}

// camera-facing strips: lightning, beams, hook chains, rail shots
export class Strips{
 constructor(scene,n=48){this.n=n;this.list=[];this.pos=new Float32Array(n*4*3);this.col=new Float32Array(n*4*3);const idx=[];for(let i=0;i<n;i++){const a=i*4;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.col,3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));this.mesh.frustumCulled=false;this.mesh.renderOrder=5;scene.add(this.mesh);this.tmp=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];}
 // a,b: {x,y,z} (or functions returning one); jag: zig-zag segments for lightning
 add(a,b,col,w=.15,life=.15,jag=0){const c=new THREE.Color(col);if(jag){let px=a.x,py=a.y,pz=a.z;for(let i=1;i<=jag;i++){const t=i/jag,j=i===jag?0:.6;const nx=a.x+(b.x-a.x)*t+(Math.random()-.5)*j,ny=a.y+(b.y-a.y)*t+(Math.random()-.5)*j,nz=a.z+(b.z-a.z)*t+(Math.random()-.5)*j;this.push({x:px,y:py,z:pz},{x:nx,y:ny,z:nz},c,w,life);px=nx;py=ny;pz=nz;}return;}this.push(a,b,c,w,life);}
 push(a,b,c,w,life){if(this.list.length>=this.n)this.list.shift();this.list.push({a,b,c,w,life,max:life});}
 update(dt,cam){const[A,B,S,M]=this.tmp;let i=0;for(let k=this.list.length-1;k>=0;k--){const t=this.list[k];t.life-=dt;if(t.life<=0)this.list.splice(k,1);}
  for(const t of this.list){const a=typeof t.a==='function'?t.a():t.a,b=typeof t.b==='function'?t.b():t.b;if(!a||!b)continue;A.set(a.x,a.y,a.z);B.set(b.x,b.y,b.z);M.addVectors(A,B).multiplyScalar(.5);S.subVectors(B,A);const side=new THREE.Vector3().subVectors(cam.position,M).cross(S).normalize().multiplyScalar(t.w);
   const o=i*12;this.pos.set([A.x+side.x,A.y+side.y,A.z+side.z,A.x-side.x,A.y-side.y,A.z-side.z,B.x+side.x,B.y+side.y,B.z+side.z,B.x-side.x,B.y-side.y,B.z-side.z],o);const f=Math.min(1,t.life/t.max*1.5);
   for(let q=0;q<4;q++){this.col[o+q*3]=t.c.r*f;this.col[o+q*3+1]=t.c.g*f;this.col[o+q*3+2]=t.c.b*f;}i++;if(i>=this.n)break;}
  this.mesh.geometry.attributes.position.needsUpdate=this.mesh.geometry.attributes.color.needsUpdate=true;this.mesh.geometry.setDrawRange(0,i*6);}
 clear(){this.list.length=0;}}

// projectile looks: colour, size, shape and trail
export const LOOK={rock:{c:'#ffb070',s:.55,shape:'rock',trail:'#c89060'},hook:{c:'#5ff0e0',s:.4,shape:'hook',trail:'#5ff0e0'},tsunami:{c:'#5ff0e0',s:2.4,shape:'wave',trail:'#9af8ff'},
 star:{c:'#d8b0ff',s:.32,shape:'orb',trail:'#c99aff'},comet:{c:'#ffe08a',s:.5,shape:'orb',trail:'#c99aff'},ice:{c:'#aaf0ff',s:.45,shape:'shard',trail:'#9ae8ff'},arrow:{c:'#c8ff9a',s:.35,shape:'arrow',trail:'#b8ff8a'},
 bigarrow:{c:'#d8ffb0',s:1.1,shape:'arrow',trail:'#b8ff8a'},bolt:{c:'#7af4ff',s:.28,shape:'orb',trail:'#5af0ff'},blast:{c:'#ffb050',s:.6,shape:'orb',trail:'#ff8030'},rail:{c:'#9af8ff',s:.7,shape:'arrow',trail:'#5af0ff'},
 petal:{c:'#ffb0e8',s:.3,shape:'orb',trail:'#ff9ad8'},thorn:{c:'#9dff9a',s:.4,shape:'shard',trail:'#7dff9a'},shuriken:{c:'#ff8aff',s:.5,shape:'star',trail:'#e04aff'},
 shot:{c:'#ffe8b0',s:.25,shape:'orb',trail:'#ffd080'},mshot:{c:'#ffffff',s:.22,shape:'orb',trail:null},cannon:{c:'#ffb050',s:.35,shape:'orb',trail:'#a07050'},tower:{c:'#ffffff',s:.55,shape:'orb',trail:'#ffffff'},
 fireball:{c:'#ffa040',s:.7,shape:'orb',trail:'#ff6020'},spit:{c:'#c8ff60',s:.4,shape:'orb',trail:'#90d040'}};
