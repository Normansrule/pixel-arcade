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

// the storm: a domain-warped energy wall (two shells) with rising streaks, lightning and a glowing seam where it meets the
// terrain (sampled from the island height texture), plus a dark churning cloud ceiling over the stormed area.
const NOISE=`float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fb(vec2 p){float a=0.,w=.5;for(int i=0;i<4;i++){a+=n(p)*w;p=p*2.03+vec2(1.7,9.2);w*=.5;}return a;}`;
export function makeStorm(scene,world){const U={uT:{value:0},uR:{value:300},uC:{value:new THREE.Vector2()},uHT:{value:world&&world.hTex},uL:{value:0},uFl:{value:0}},EXT=420,N=337,STEP=2*EXT/(N-1);
 const geo=new THREE.CylinderGeometry(1,1,700,160,1,true);geo.translate(0,250,0);
 const wallMat=layer=>new THREE.ShaderMaterial({uniforms:{...U,uL:{value:layer},uR:{value:300}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uT,uR,uL,uFl;uniform vec2 uC;uniform sampler2D uHT;varying vec2 vUv;varying vec3 vW;${NOISE}
   void wl(float a,float y,float t,out float bill,out float lit,out float f2,out float st){
    vec2 q=vec2(a*.013+t*(.035+uL*.02),y*.0085);
    vec2 w=vec2(fb(q*1.2+vec2(0.,-t*.12)),fb(q*1.2+vec2(5.2,-t*.09)));
    float f=fb(q*2.+w*2.4+vec2(-t*.05,-t*.24));f2=fb(q*6.5+w*3.+vec2(t*.1,-t*.7));bill=f*.78+f2*.32;
    float fu=fb(q*2.+w*2.4+vec2(-t*.05,-t*.24)+vec2(.0,.035))*.78+f2*.32;lit=clamp((bill-fu)*9.+.5,0.,1.);
    st=pow(n(vec2(a*.22+uL*9.,y*.008-t*1.6)),6.)*2.4+pow(n(vec2(a*.6,y*.02-t*2.4)),8.)*1.4;
   }
   void main(){float t=uT*(1.-uL*.3)+uL*17.,a=vUv.x*6.2832*uR,y=vW.y;
    float bill,lit,f2,st;wl(a,y,t,bill,lit,f2,st);
    // the cylinder's uv seam: cross-fade into the noise evaluated one circumference back so the wall wraps without a cut
    float sw=smoothstep(.88,1.,vUv.x);if(sw>0.){float b2,l2,g2,s2;wl(a-6.2832*uR,y,t,b2,l2,g2,s2);bill=mix(bill,b2,sw);lit=mix(lit,l2,sw);f2=mix(f2,g2,sw);st=mix(st,s2,sw);}
    vec2 tuv=((vW.xz+${EXT}.)/${STEP.toFixed(6)}+.5)/${N}.;float gh=max(texture2D(uHT,tuv).r,0.),dz=y-gh;
    float seam=exp(-max(dz,0.)*.18),seam2=exp(-max(dz,0.)*1.1);
    vec3 c=mix(vec3(.04,.01,.12),vec3(.3,.08,.62),smoothstep(.36,.7,bill));c=mix(c,vec3(.85,.5,1.2),smoothstep(.66,.9,bill)*lit);
    c+=vec3(.25,.12,.5)*f2*f2;c+=st*vec3(.6,.42,1.);
    float slot=floor(uT*1.7),bx=h(vec2(slot,uL))*6.2832*uR,bo=(fb(vec2(y*.03,slot))-.5)*22.+(n(vec2(y*.2,slot))-.5)*4.;float ad=abs(mod(a-bx-bo+3.1416*uR,6.2832*uR)-3.1416*uR);
    float bolt=smoothstep(1.4,.0,ad)*step(fract(uT*1.7),.14)*step(.35,h(vec2(slot,3.+uL)))*smoothstep(240.,40.,y);c+=bolt*vec3(2.6,2.2,3.4)+uFl*vec3(.5,.35,.8);
    c+=seam*vec3(.7,.3,1.)*.35+seam2*vec3(1.,.7,1.3)*.35;
    vec3 V=normalize(cameraPosition-vW);vec2 rn=normalize(vW.xz-uC);float edge=1.-abs(dot(normalize(V.xz+1e-4),rn));
    c+=vec3(.7,.35,1.2)*pow(edge,5.)*(.5+bill);
    float al=(.3+.55*bill+st*.15+edge*.2)*(1.-uL*.4)*smoothstep(gh-6.,gh+2.,y)*(1.-smoothstep(120.,360.,y));
    float d=length(cameraPosition-vW);al*=.18+.82*smoothstep(1.5,26.,d);al=clamp(al+seam*.2+bolt,0.,.94);
    gl_FragColor=vec4(c*1.2,al);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 const m=new THREE.Mesh(geo,wallMat(0));m.renderOrder=2;m.frustumCulled=false;scene.add(m);
 const inner=new THREE.Mesh(geo,wallMat(1));inner.scale.set(.985,1,.985);inner.renderOrder=2;inner.frustumCulled=false;m.add(inner);
 // cloud ceiling outside the safe circle
 const ceil=new THREE.Mesh(new THREE.PlaneGeometry(2,2).rotateX(Math.PI/2),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uT,uR,uFl;uniform vec2 uC;varying vec3 vW;${NOISE}
   void main(){float d=length(vW.xz-uC);vec2 p=vW.xz*.012;float an=atan(vW.z-uC.y,vW.x-uC.x);vec2 sw=vec2(cos(an+uT*.05),sin(an+uT*.05))*d*.012;
    float f=fb(sw+fb(p+uT*.04)*1.6+vec2(uT*.03,0.));vec3 c=mix(vec3(.07,.02,.16),vec3(.36,.16,.62),smoothstep(.3,.85,f))+uFl*vec3(.6,.4,.9)*f;
    float al=smoothstep(uR-4.,uR+60.,d)*(.55+.4*f)*(1.-smoothstep(100.,128.,cameraPosition.y));gl_FragColor=vec4(c,al);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}));ceil.renderOrder=2;ceil.frustumCulled=false;scene.add(ceil);
 // x,z,r: current circle; on: visible; q: quality (inner shell + ceiling from medium up); flash: lightning light 0..1
 const update=(x,z,r,t,on,q,flash=0)=>{m.visible=on;inner.visible=on&&q>0;ceil.visible=on&&q>0;if(!on)return;m.position.set(x,-40,z);m.scale.set(Math.max(.5,r),1,Math.max(.5,r));U.uR.value=Math.max(1,r);U.uT.value=t;U.uC.value.set(x,z);U.uFl.value=flash;
  m.material.uniforms.uR.value=U.uR.value;inner.material.uniforms.uR.value=U.uR.value*.985;
  ceil.position.set(x,118,z);ceil.scale.set(r+900,1,r+900);};
 return{mesh:m,inner,ceil,U,update};}
