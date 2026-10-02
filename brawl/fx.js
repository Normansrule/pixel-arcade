// PLATFORM BRAWL — effects: GPU-light particles, ribbon trails, shock rings, star hit-sparks, KO blast beams, text sprites.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;

export class Particles{constructor(scene,n=4000){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.i=0;this.live=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
   vertexShader:'attribute float size;uniform float uScale;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC*a*a*1.4,1.);}'}));this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=(Math.random()*2-1)*(o.flat??.5);const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){dx=dx*(o.spread??.6)+o.dir.x;dy=dy*(o.spread??.6)+o.dir.y;dz=dz*(o.spread??.6)+(o.dir.z||0);}if(o.up)dy=Math.abs(dy);const s=speed*(.3+Math.random()*.7);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x,p.y,p.z||0,dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??2);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   const f=k*k;c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f;c[i*3+2]=oc[i*3+2]*f;s[i]=os[i]*(.35+.65*k);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}
 clear(){this.life.fill(0);}}

// camera-facing ribbon following a point
export class Trail{constructor(scene,n,width,color,o={}){this.n=n;this.w=width;this.col=color.clone();this.pts=[];this.pos=new Float32Array(n*2*3);this.c=new Float32Array(n*2*3);const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:o.normal?THREE.NormalBlending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,opacity:o.opacity??1}));this.mesh.frustumCulled=false;this.mesh.renderOrder=4;scene.add(this.mesh);this.str=0;this.minD=o.minD??.0025;this.taper=o.taper??.25;}
 push(p,on,dt,rate=10){this.str+=((on?1:0)-this.str)*Math.min(1,dt*(on?rate*2:rate*.6));const last=this.pts[0];if(!last||last.distanceToSquared(p)>this.minD){this.pts.unshift(p.clone());if(this.pts.length>this.n)this.pts.pop();}else last.copy(p);}
 clear(){this.pts.length=0;this.str=0;}
 update(cam){const P=this.pts,n=P.length,tmp=new V(),side=new V(),tan=new V();if(n<2||this.str<.01){this.mesh.visible=false;return;}this.mesh.visible=true;
  for(let i=0;i<this.n;i++){const k=Math.min(i,n-1),p=P[k];tan.subVectors(P[Math.max(0,k-1)],P[Math.min(n-1,k+1)]);tmp.subVectors(cam.position,p);side.crossVectors(tan,tmp).normalize();
   const f=1-i/(this.n-1),w=this.w*(this.taper+(1-this.taper)*f);this.pos[i*6]=p.x+side.x*w;this.pos[i*6+1]=p.y+side.y*w;this.pos[i*6+2]=p.z+side.z*w;this.pos[i*6+3]=p.x-side.x*w;this.pos[i*6+4]=p.y-side.y*w;this.pos[i*6+5]=p.z-side.z*w;
   const a=f*f*this.str*(i<n?1:0);for(let j=0;j<2;j++){this.c[i*6+j*3]=this.col.r*a;this.c[i*6+j*3+1]=this.col.g*a;this.c[i*6+j*3+2]=this.col.b*a;}}
  this.mesh.geometry.attributes.position.needsUpdate=this.mesh.geometry.attributes.color.needsUpdate=true;}}

// expanding rings (in the camera plane) + fresnel shells
export class Shocks{constructor(scene,n=10){this.list=[];const ring=new THREE.RingGeometry(.82,1,48),shell=new THREE.SphereGeometry(1,32,16);
  for(let i=0;i<n;i++){const ringM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
   const shellM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color()},uA:{value:0}},
    vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.4);gl_FragColor=vec4(uC*f*uA,1.);}'});
   const r=new THREE.Mesh(ring,ringM),s=new THREE.Mesh(shell,shellM);r.visible=s.visible=false;r.renderOrder=s.renderOrder=6;scene.add(r,s);this.list.push({r,s,t:1,d:1,R:1,shell:false});}}
 fire(p,col,radius,dur,shell=false){const o=this.list.reduce((a,b)=>b.t/b.d>a.t/a.d?b:a);o.t=0;o.d=dur;o.R=radius;o.shell=shell;const m=shell?o.s:o.r;(shell?o.r:o.s).visible=false;m.visible=true;m.position.set(p.x,p.y,p.z||0);
  if(shell)m.material.uniforms.uC.value.copy(col);else m.material.color.copy(col);}
 update(dt,cam){for(const o of this.list){if(o.t>=o.d){o.r.visible=o.s.visible=false;continue;}o.t+=dt;const k=Math.min(1,o.t/o.d),e=1-Math.pow(1-k,3);const m=o.shell?o.s:o.r;m.scale.setScalar(.2+o.R*e);
   if(o.shell)m.material.uniforms.uA.value=(1-k)*(1-k)*1.1;else{m.material.opacity=(1-k)*(1-k)*.8;m.quaternion.copy(cam.quaternion);}}}}

// four-point star sparks (billboards) for hit impacts
function starTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
 x.globalCompositeOperation='lighter';x.fillStyle='#fff';for(const r of[0,Math.PI/2]){x.save();x.translate(64,64);x.rotate(r);x.beginPath();x.moveTo(-64,0);x.quadraticCurveTo(0,-5,64,0);x.quadraticCurveTo(0,5,-64,0);x.fill();x.restore();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export class Sparks{constructor(scene,n=24){this.list=[];const tex=starTex();for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));s.visible=false;s.renderOrder=8;scene.add(s);this.list.push({s,t:1,d:1,R:1});}}
 fire(p,col,size,dur=.22){const o=this.list.reduce((a,b)=>b.t/b.d>a.t/a.d?b:a);o.t=0;o.d=dur;o.R=size;o.s.visible=true;o.s.position.set(p.x,p.y,(p.z||0)+.6);o.s.material.color.copy(col);o.s.material.rotation=Math.random()*Math.PI;}
 update(dt){for(const o of this.list){if(o.t>=o.d){o.s.visible=false;continue;}o.t+=dt;const k=Math.min(1,o.t/o.d);o.s.scale.setScalar(o.R*(k<.2?k/.2:1)*(1+k*.4));o.s.material.opacity=1-k*k;o.s.material.rotation+=dt*2;}}}

// KO blast: a tall cone of light shooting from the exit point back toward the stage
export class Beams{constructor(scene,n=4){this.list=[];const g=new THREE.ConeGeometry(1,1,32,1,true);g.translate(0,-.5,0);g.rotateX(Math.PI);
  for(let i=0;i<n;i++){const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uC:{value:new THREE.Color()},uA:{value:0},uT:{value:0}},
    vertexShader:'varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 uC;uniform float uA,uT;varying vec2 vUv;varying vec3 vN,vV;void main(){float e=abs(dot(vN,vV));float core=pow(e,2.2);float L=1.-vUv.y;float len=smoothstep(0.,.03,L)*pow(1.-L,1.6);float st=.75+.25*sin(vUv.x*60.+uT*30.);gl_FragColor=vec4(uC*(core*2.+.2)*len*st*uA,1.);}'});
   const o=new THREE.Mesh(g,m);o.visible=false;o.renderOrder=7;scene.add(o);this.list.push({o,t:1,d:1});}}
 fire(p,dir,col,len=30,width=5,dur=1.1){const b=this.list.reduce((a,b)=>b.t/b.d>a.t/a.d?b:a);b.t=0;b.d=dur;b.len=len;b.w=width;b.o.visible=true;b.o.position.set(p.x,p.y,0);
  b.o.quaternion.setFromUnitVectors(new V(0,1,0),new V(dir.x,dir.y,0).normalize());b.o.material.uniforms.uC.value.copy(col);}
 update(dt){for(const b of this.list){if(b.t>=b.d){b.o.visible=false;continue;}b.t+=dt;const k=Math.min(1,b.t/b.d),grow=1-Math.pow(1-Math.min(1,k*4),3);b.o.scale.set(b.w*(1-k*.6),b.len*grow,b.w*(1-k*.6));b.o.material.uniforms.uA.value=(1-k)*(1-k)*(k<.06?k/.06:1)*1.1;b.o.material.uniforms.uT.value+=dt;}}}

export const FX={elec:[new THREE.Color(1.6,1.5,.4),new THREE.Color(.6,1.4,2.4)],fire:[new THREE.Color(2.6,1.1,.2),new THREE.Color(2.2,.45,.08)],water:[new THREE.Color(.3,1.6,1.8),new THREE.Color(.8,1.6,2.2)],
 dark:[new THREE.Color(1.3,.4,2.4),new THREE.Color(.6,.2,1.4)],arcane:[new THREE.Color(.5,1.8,2.2),new THREE.Color(1.4,1.2,2.4)],rock:[new THREE.Color(1.8,1.0,.4),new THREE.Color(.9,.8,.7)],
 impact:[new THREE.Color(2.2,1.6,.5),new THREE.Color(1.8,1.8,1.6)],tech:[new THREE.Color(.5,2.2,.7),new THREE.Color(1.4,2,1.4)]};
