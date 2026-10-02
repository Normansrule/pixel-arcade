// WILD QUEST — particles (additive sparks / embers / fireflies, soft alpha puffs) and ribbon trails.
import * as THREE from '../vendor/three.module.min.js';
export class Particles{
 constructor(scene,n=4000,additive=true){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.i=0;this.alive=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('pc',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 pc;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=pc;vC.a*=smoothstep(.3,1.5,-mv.z);gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}':'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.1,d)*vC.a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb,a);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?5:4;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){dx=dx*(o.spread??.6)+o.dir.x;dy=dy*(o.spread??.6)+o.dir.y;dz=dz*(o.spread??.6)+o.dir.z;}if(o.up)dy=Math.abs(dy);if(o.flat)dy*=.2;const s=speed*(.35+Math.random()*.65);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;const r=o.r||0;this.emit(p.x+dx*r,p.y+dy*r,p.z+dz*r,dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag}=this;const add=this.add;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   const f=add?k*k:Math.min(1,k*2.5)*Math.min(1,(1-k)*8);c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=add?f:f*.55;s[i]=add?os[i]*(.4+.6*k):os[i]*(1.6-.6*k);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.pc.needsUpdate=this.geo.attributes.size.needsUpdate=true;}
 clear(){this.life.fill(0);this.s.fill(0);}}

export class Trail{constructor(scene,n,color){this.n=n;this.col=color;this.a=[];this.b=[];this.pos=new Float32Array(n*2*3);this.c=new Float32Array(n*2*3);const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));this.mesh.frustumCulled=false;this.mesh.renderOrder=6;scene.add(this.mesh);this.str=0;}
 // a = blade base, b = blade tip (world)
 push(a,b,on,dt){this.str+=((on?1:0)-this.str)*Math.min(1,dt*(on?30:9));if(on||this.str>.02){this.a.unshift(a.clone());this.b.unshift(b.clone());if(this.a.length>this.n){this.a.pop();this.b.pop();}}else{this.a.length=this.b.length=0;}
  const A=this.a,B=this.b,n=A.length;for(let i=0;i<this.n;i++){const k=Math.min(i,Math.max(0,n-1));if(!n){this.pos.fill(0);break;}const p=A[k],q=B[k];this.pos.set([p.x,p.y,p.z,q.x,q.y,q.z],i*6);const f=(1-i/(this.n-1))**1.5*this.str*(i<n?1:0);
   this.c[i*6]=this.col.r*f*.4;this.c[i*6+1]=this.col.g*f*.4;this.c[i*6+2]=this.col.b*f*.4;this.c[i*6+3]=this.col.r*f;this.c[i*6+4]=this.col.g*f;this.c[i*6+5]=this.col.b*f;}
  this.mesh.geometry.attributes.position.needsUpdate=this.mesh.geometry.attributes.color.needsUpdate=true;this.mesh.visible=this.str>.02&&n>1;}}
