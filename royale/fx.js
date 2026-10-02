// STORM ROYALE — effects: additive sparks + soft smoke particles, bullet tracers, muzzle flashes, shockwaves,
// physical debris chunks and the animated storm wall.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl} from './util.js';

export class Particles{
 constructor(scene,n=4000,additive=true){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.grow=new Float32Array(n);this.i=0;this.add=additive;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('col',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 col;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=col;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}':'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.15,d)*vC.a;gl_FragColor=vec4(vC.rgb,a);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=3;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.grow[i]=grow;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const sp=o.spread??.6;dx=dx*sp+o.dir.x;dy=dy*sp+o.dir.y;dz=dz*sp+o.dir.z;}if(o.up)dy=Math.abs(dy);const s=speed*(.3+Math.random()*.7);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.grow??0);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,grow}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(this.add){const f=k*k;c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=f;s[i]=os[i]*(.4+.6*k);}
   else{c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=Math.min(1,k*1.6)*Math.min(1,(1-k)*8)*.8;s[i]=os[i]*(1+(1-k)*grow[i]);}}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.col.needsUpdate=this.geo.attributes.size.needsUpdate=true;}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}}

export class Tracers{
 constructor(scene,n=96){this.n=n;this.list=[];this.pos=new Float32Array(n*4*3);this.col=new Float32Array(n*4*3);const idx=[];for(let i=0;i<n;i++){const a=i*4;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.col,3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));this.mesh.frustumCulled=false;this.mesh.renderOrder=4;scene.add(this.mesh);}
 add(a,b,col,w=.045,life=.1){if(this.list.length>=this.n)this.list.shift();this.list.push({a:a.clone(),b:b.clone(),c:col,w,life,max:life});}
 update(dt,cam){const side=new V(),d=new V(),m=new V();let i=0;for(let k=this.list.length-1;k>=0;k--){const t=this.list[k];t.life-=dt;if(t.life<=0)this.list.splice(k,1);}
  for(const t of this.list){const f=t.life/t.max;d.subVectors(t.b,t.a);const len=d.length();m.copy(t.a).addScaledVector(d,.5);side.subVectors(cam.position,m).cross(d).normalize().multiplyScalar(t.w);
   // streak travels along the shot
   const h0=Math.max(0,1-f*1.15-.05),h1=Math.min(1,1-f+.55),A=new V().copy(t.a).addScaledVector(d,h0),Bv=new V().copy(t.a).addScaledVector(d,h1);
   const o=i*12;this.pos.set([A.x+side.x,A.y+side.y,A.z+side.z,A.x-side.x,A.y-side.y,A.z-side.z,Bv.x+side.x,Bv.y+side.y,Bv.z+side.z,Bv.x-side.x,Bv.y-side.y,Bv.z-side.z],o);
   const a0=f*.25,a1=f;this.col.set([t.c.r*a0,t.c.g*a0,t.c.b*a0,t.c.r*a0,t.c.g*a0,t.c.b*a0,t.c.r*a1,t.c.g*a1,t.c.b*a1,t.c.r*a1,t.c.g*a1,t.c.b*a1],o);i++;if(i>=this.n)break;}
  for(let j=i;j<this.n;j++)this.pos.fill(0,j*12,j*12+12);this.mesh.geometry.attributes.position.needsUpdate=this.mesh.geometry.attributes.color.needsUpdate=true;this.mesh.geometry.setDrawRange(0,i*6);}
 clear(){this.list.length=0;}}

// pooled additive star sprites + a couple of shared point lights (fixed light count keeps shaders stable)
export class Flashes{
 constructor(scene,n=10){const tex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(.25,'rgba(255,210,120,.9)');g.addColorStop(1,'rgba(255,120,20,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
   x.globalCompositeOperation='lighter';x.strokeStyle='rgba(255,230,180,.8)';x.lineWidth=3;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;x.beginPath();x.moveTo(32,32);x.lineTo(32+Math.cos(a)*30,32+Math.sin(a)*30);x.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
  this.list=[];for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,color:new THREE.Color(2.2,1.9,1.5)}));s.visible=false;s.renderOrder=5;scene.add(s);this.list.push({s,t:0});}
  this.lights=[0,1].map(()=>{const l=new THREE.PointLight(0xffc070,0,22,1.8);scene.add(l);return{l,t:0};});this.li=0;}
 fire(p,size=.7,light=true,col){const f=this.list.find(f=>f.t<=0)||this.list[0];f.s.position.copy(p);f.s.scale.setScalar(size*(.8+Math.random()*.4));f.s.material.rotation=Math.random()*6;f.t=.06;f.s.visible=true;if(col)f.s.material.color.copy(col);else f.s.material.color.setRGB(2.2,1.9,1.5);
  if(light){const L=this.lights[this.li++%2];L.l.position.copy(p);L.l.intensity=60*size;L.t=.06;}}
 boom(p,i=600,d=60){const L=this.lights[this.li++%2];L.l.position.copy(p);L.l.distance=d;L.l.intensity=i;L.t=.35;}
 update(dt){for(const f of this.list){if(f.t>0){f.t-=dt;if(f.t<=0)f.s.visible=false;}}for(const L of this.lights){if(L.t>0){L.t-=dt;L.l.intensity*=Math.exp(-dt*14);if(L.t<=0){L.l.intensity=0;L.l.distance=22;}}}}}

export class Shocks{constructor(scene,n=6){this.list=[];const geo=new THREE.SphereGeometry(1,32,16);for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color()},uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(uC*f*uA,1.);}'}));m.visible=false;scene.add(m);this.list.push({m,t:0,d:1,r:1});}}
 fire(p,col,radius,dur){const s=this.list.find(s=>!s.m.visible)||this.list[0];s.m.position.copy(p);s.m.material.uniforms.uC.value.copy(col);s.t=0;s.d=dur;s.r=radius;s.m.visible=true;}
 update(dt){for(const s of this.list){if(!s.m.visible)continue;s.t+=dt;const k=s.t/s.d;if(k>=1){s.m.visible=false;continue;}s.m.scale.setScalar(.3+s.r*(1-Math.pow(1-k,3)));s.m.material.uniforms.uA.value=(1-k)*(1-k)*1.4;}}}

// solid chunks (wood splinters, stone, metal) with gravity + bounce
export class Debris{
 constructor(scene,n=420){this.n=n;this.mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.8}),n);this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3).fill(1),3);this.mesh.castShadow=true;this.mesh.frustumCulled=false;
  this.d=[];for(let i=0;i<n;i++)this.d.push({p:new V(),v:new V(),r:new THREE.Euler(),w:new V(),s:new V(1,1,1),life:0});this.i=0;this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.zero=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<n;i++)this.mesh.setMatrixAt(i,this.zero);scene.add(this.mesh);this.ground=null;}
 spawn(p,col,n=8,size=.3,speed=6,o={}){const c=new THREE.Color(col);for(let k=0;k<n;k++){const i=this.i;this.i=(i+1)%this.n;const d=this.d[i];d.p.set(p.x+(Math.random()-.5)*(o.sx||1),p.y+(Math.random()-.2)*(o.sy||1),p.z+(Math.random()-.5)*(o.sz||1));
  d.v.set((Math.random()-.5)*speed,Math.random()*speed*.9+1.5,(Math.random()-.5)*speed);if(o.dir)d.v.addScaledVector(o.dir,speed*.5);d.w.set(Math.random()*10-5,Math.random()*10-5,Math.random()*10-5);d.r.set(Math.random()*6,Math.random()*6,0);
  const s=size*(.5+Math.random());d.s.set(s*(o.flat?2.4:1),s*(o.flat?.35:1),s*(o.flat?1:1));d.life=1.6+Math.random()*1.2;const sh=.75+Math.random()*.4;this.mesh.setColorAt(i,new THREE.Color(c.r*sh,c.g*sh,c.b*sh));}this.mesh.instanceColor.needsUpdate=true;}
 update(dt){let any=false;for(let i=0;i<this.n;i++){const d=this.d[i];if(d.life<=0)continue;any=true;d.life-=dt;d.v.y-=22*dt;d.p.addScaledVector(d.v,dt);const g=this.ground?this.ground(d.p.x,d.p.z):-1e9;
  if(d.p.y<g+d.s.y*.5){d.p.y=g+d.s.y*.5;d.v.y*=-.3;d.v.x*=.6;d.v.z*=.6;d.w.multiplyScalar(.6);}d.r.x+=d.w.x*dt;d.r.y+=d.w.y*dt;d.r.z+=d.w.z*dt;
  const sc=Math.min(1,d.life*2);this.q.setFromEuler(d.r);this.m.compose(d.p,this.q,new V(d.s.x*sc,d.s.y*sc,d.s.z*sc));this.mesh.setMatrixAt(i,d.life>0?this.m:this.zero);}if(any)this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){for(let i=0;i<this.n;i++){this.d[i].life=0;this.mesh.setMatrixAt(i,this.zero);}this.mesh.instanceMatrix.needsUpdate=true;}}

export function makeStorm(scene){const U={uT:{value:0},uR:{value:300},uCam:{value:new V()}};
 const geo=new THREE.CylinderGeometry(1,1,700,128,1,true);geo.translate(0,250,0);
 const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uT,uR;varying vec2 vUv;varying vec3 vW;
   float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
   void main(){float a=vUv.x*6.2832*uR,y=vW.y;
    float n1=n(vec2(a*.035+uT*.25,y*.018-uT*.45))*.6+n(vec2(a*.11-uT*.6,y*.05+uT*.9))*.4;
    float st=pow(n(vec2(a*.32,y*.006-uT*1.8)),4.)*2.2;float bolt=step(.985,n(vec2(a*.07+floor(uT*6.)*3.1,y*.002)))*step(.5,fract(uT*3.));
    vec3 c=mix(vec3(.32,.1,.72),vec3(.72,.42,1.),n1)+st*vec3(.55,.45,1.)+bolt*vec3(2.,1.8,3.);
    float al=(.34+.34*n1+st*.2)*smoothstep(-25.,8.,y)*(1.-smoothstep(110.,330.,y));
    float d=length(cameraPosition-vW);al*=.15+.85*smoothstep(1.5,30.,d);
    float gl=smoothstep(14.,0.,abs(y-0.))*.4;c+=gl*vec3(.8,.5,1.);
    gl_FragColor=vec4(c*1.25,clamp(al+gl*.3,0.,.92));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));m.renderOrder=2;m.frustumCulled=false;scene.add(m);return{mesh:m,U};}
