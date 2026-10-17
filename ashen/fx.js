// ASHEN VIGIL — particles (additive sparks / embers, soft alpha smoke), blade ribbon trails, verlet cloth capes and ground telegraph decals.
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

/* verlet cloth: cols×rows grid, the top row pinned to anchors set every frame (cape, banners) */
export class Cloth{
 constructor(scene,cols,rows,w,h,mat){this.cols=cols;this.rows=rows;this.w=w;this.h=h;const n=cols*rows;this.n=n;this.p=new Float32Array(n*3);this.o=new Float32Array(n*3);this.pin=new Float32Array(cols*3);this.spheres=[];this.wind=new THREE.Vector3(.4,0,.2);this.init=false;
  const g=new THREE.PlaneGeometry(w,h,cols-1,rows-1);this.geo=g;this.mesh=new THREE.Mesh(g,mat);this.mesh.frustumCulled=false;this.mesh.castShadow=true;scene.add(this.mesh);
  const C=[];const dx=w/(cols-1),dy=h/(rows-1);const L=(a,b,l)=>C.push(a,b,l);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=j*cols+i;if(i<cols-1)L(k,k+1,dx);if(j<rows-1)L(k,k+cols,dy);if(i<cols-1&&j<rows-1){L(k,k+cols+1,Math.hypot(dx,dy));L(k+1,k+cols,Math.hypot(dx,dy));}if(j<rows-2)L(k,k+cols*2,dy*2);}
  this.C=new Float32Array(C);this.acc=0;}
 // anchor i of the top row at world position (x,y,z); `down` is the hang direction used when (re)initialising
 setPin(i,x,y,z){this.pin[i*3]=x;this.pin[i*3+1]=y;this.pin[i*3+2]=z;}
 reset(down){const{p,o,cols,rows}=this,dy=this.h/(rows-1);for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=(j*cols+i)*3;p[k]=this.pin[i*3]+down.x*dy*j;p[k+1]=this.pin[i*3+1]+down.y*dy*j;p[k+2]=this.pin[i*3+2]+down.z*dy*j;o[k]=p[k];o[k+1]=p[k+1];o[k+2]=p[k+2];}this.init=true;}
 update(dt,down){if(!this.init)this.reset(down);this.acc=Math.min(this.acc+dt,.05);const h=1/60;
  while(this.acc>=h){this.acc-=h;this._step(h);}
  const a=this.geo.attributes.position;a.array.set(this.p);a.needsUpdate=true;this.geo.computeVertexNormals();this.geo.computeBoundingSphere();}
 _step(h){const{p,o,cols,n,C}=this;const t=performance.now()*.001;const wx=this.wind.x,wy=this.wind.y,wz=this.wind.z;
  for(let k=0;k<n;k++){const i=k*3;if(k<cols){p[i]=this.pin[k*3];p[i+1]=this.pin[k*3+1];p[i+2]=this.pin[k*3+2];o[i]=p[i];o[i+1]=p[i+1];o[i+2]=p[i+2];continue;}
   const g=Math.sin(t*2.3+k*.37)*.5+.7;const vx=(p[i]-o[i])*.985,vy=(p[i+1]-o[i+1])*.985,vz=(p[i+2]-o[i+2])*.985;o[i]=p[i];o[i+1]=p[i+1];o[i+2]=p[i+2];
   p[i]+=vx+wx*g*h*h;p[i+1]+=vy+(-11+wy)*h*h;p[i+2]+=vz+wz*g*h*h;}
  for(let it=0;it<4;it++){for(let c=0;c<C.length;c+=3){const a=C[c]*3,b=C[c+1]*3,l=C[c+2];const dx=p[b]-p[a],dy=p[b+1]-p[a+1],dz=p[b+2]-p[a+2],d=Math.hypot(dx,dy,dz)||1e-6;const f=(d-l)/d*.5;
     const pa=C[c]<cols,pb=C[c+1]<cols;if(pa&&pb)continue;if(pa){p[b]-=dx*f*2;p[b+1]-=dy*f*2;p[b+2]-=dz*f*2;}else if(pb){p[a]+=dx*f*2;p[a+1]+=dy*f*2;p[a+2]+=dz*f*2;}else{p[a]+=dx*f;p[a+1]+=dy*f;p[a+2]+=dz*f;p[b]-=dx*f;p[b+1]-=dy*f;p[b+2]-=dz*f;}}
   for(const s of this.spheres)for(let k=cols;k<n;k++){const i=k*3,dx=p[i]-s.c.x,dy=p[i+1]-s.c.y,dz=p[i+2]-s.c.z,d=Math.hypot(dx,dy,dz);if(d<s.r&&d>1e-5){const f=s.r/d;p[i]=s.c.x+dx*f;p[i+1]=s.c.y+dy*f;p[i+2]=s.c.z+dz*f;}}
   if(this.floor!==undefined)for(let k=cols;k<n;k++){const i=k*3+1;if(p[i]<this.floor+.03)p[i]=this.floor+.03;}}}
 dispose(scene){scene.remove(this.mesh);this.geo.dispose();}}

/* ground telegraphs: circles that fill as an attack winds up, lines (fire waves, beams), expanding shock rings */
const DECAL_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const DECAL_FS=`uniform float uP,uA,uMode;uniform vec3 uCol;varying vec2 vUv;
void main(){vec2 c=vUv*2.-1.;float a=0.;
 if(uMode<.5){float r=length(c);if(r>1.)discard;float edge=smoothstep(.9,.97,r)*(1.-smoothstep(.97,1.,r));float fill=step(r,uP)*.32*(.6+.4*r);float rim=smoothstep(uP-.06,uP,r)*(1.-step(uP,r))*.9;a=edge*.9+fill+rim;}
 else if(uMode<1.5){float x=abs(c.x),y=vUv.y;float side=smoothstep(.82,.95,x)*(1.-smoothstep(.95,1.,x));float fill=step(y,uP)*(1.-x*.6)*.35;a=side*.8+fill;}
 else{float r=length(c);if(r>1.)discard;float ring=smoothstep(.72,.93,r)*(1.-smoothstep(.93,1.,r));a=ring*(1.-uP);}
 gl_FragColor=vec4(uCol*a*uA,1.);}`;
export class Decals{
 constructor(scene){this.scene=scene;this.list=[];this.geo=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);this.lineGeo=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2).translate(0,0,.5);}
 // o: {x,y,z,r,dur,col,mode:'circle'|'line'|'wave',len,w,yaw,grow}
 add(o){const m=new THREE.Mesh(o.mode==='line'?this.lineGeo:this.geo,new THREE.ShaderMaterial({uniforms:{uP:{value:0},uA:{value:1},uMode:{value:o.mode==='line'?1:o.mode==='wave'?2:0},uCol:{value:new THREE.Color(o.col??0xff3a10)}},vertexShader:DECAL_VS,fragmentShader:DECAL_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2}));
  m.position.set(o.x,(o.y||0)+.04,o.z);if(o.mode==='line'){m.scale.set(o.w||2,1,o.len||8);m.rotation.y=o.yaw||0;}else m.scale.setScalar((o.r||2)*2);m.renderOrder=3;this.scene.add(m);const d={m,t:0,dur:o.dur||1,o,fade:o.fade??.25};this.list.push(d);return d;}
 update(dt){for(let i=this.list.length-1;i>=0;i--){const d=this.list[i];d.t+=dt;const k=Math.min(1,d.t/d.dur);const u=d.m.material.uniforms;u.uP.value=d.o.mode==='wave'?k:k;
   if(d.o.mode==='wave')d.m.scale.setScalar(Math.max(.1,(d.o.r||6)*2*(.15+.85*Math.sqrt(k))));
   if(d.t>d.dur){const f=1-(d.t-d.dur)/d.fade;u.uA.value=Math.max(0,f);if(f<=0||d.o.mode==='wave'){this.scene.remove(d.m);d.m.material.dispose();this.list.splice(i,1);}}}}
 clear(){for(const d of this.list){this.scene.remove(d.m);d.m.material.dispose();}this.list.length=0;}}
