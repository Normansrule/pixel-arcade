// IRONCLAD — effects: additive sparks/fire, alpha smoke & dust, debris, shockwaves, scorch decals, track marks, tracers, beams, flashes.
import * as THREE from '../vendor/three.module.min.js';
import {V3,ctex,canvas} from './util.js';
const R=(a=1)=>Math.random()*a;

function cloudTex(){return ctex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.55,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.globalCompositeOperation='destination-out';for(let i=0;i<40;i++){x.fillStyle=`rgba(0,0,0,${R(.35)})`;x.beginPath();x.arc(R(64),R(64),2+R(7),0,7);x.fill();}},{clamp:true,srgb:false});}

class Points{constructor(scene,n,additive,tex){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*4);this.s=new Float32Array(n);this.s0=new Float32Array(n);this.s1=new Float32Array(n);
  this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.i=0;this.live=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500},uTex:{value:tex},uFog:{value:new THREE.Color()},uFogD:{value:0}};
  this.mat=new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 color;uniform float uScale;varying vec4 vC;varying float vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vD=-mv.z;'+(additive?'vC.rgb*=smoothstep(.8,4.,-mv.z);':'vC.a*=smoothstep(.5,3.,-mv.z);')+'if(-mv.z<.4){vC=vec4(0.);}gl_PointSize=min(size*uScale/max(.4,-mv.z),uScale*.9);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform sampler2D uTex;uniform vec3 uFog;uniform float uFogD;varying vec4 vC;varying float vD;void main(){vec4 t=texture2D(uTex,clamp(gl_PointCoord,0.,1.));float f=1.-exp(-uFogD*uFogD*vD*vD);vec4 o='+(additive?'vec4(vC.rgb*t.a*(1.-f),1.)':'vec4(mix(vC.rgb,uFog,f),vC.a*t.a)')+';if(isnan(o.r+o.g+o.b+o.a)||isinf(o.r+o.g+o.b))discard;gl_FragColor=clamp(o,0.,16.);}'});
  this.pts=new THREE.Points(geo,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=additive?6:5;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,a,s0,s1,life,grav=0,drag=1){const i=this.i;this.i=(i+1)%this.n;const k=i*3,q=i*4;this.p[k]=x;this.p[k+1]=y;this.p[k+2]=z;this.v[k]=vx;this.v[k+1]=vy;this.v[k+2]=vz;
  this.oc[q]=r;this.oc[q+1]=g;this.oc[q+2]=b;this.oc[q+3]=a;this.s0[i]=s0;this.s1[i]=s1;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;}
 update(dt){const{p,v,c,oc,s,s0,s1,life,max,g,drag}=this;let live=0;
  for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0){s[i]=0;c[i*4+3]=0;}continue;}live++;life[i]-=dt;const k=i*3,q=i*4,t=1-Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[k]*=dr;v[k+1]=v[k+1]*dr-g[i]*dt;v[k+2]*=dr;p[k]+=v[k]*dt;p[k+1]+=v[k+1]*dt;p[k+2]+=v[k+2]*dt;
   s[i]=s0[i]+(s1[i]-s0[i])*(1-(1-t)*(1-t));
   if(this.add){const f=(1-t)*(1-t);c[q]=oc[q]*f;c[q+1]=oc[q+1]*f;c[q+2]=oc[q+2]*f;}else{c[q]=oc[q];c[q+1]=oc[q+1];c[q+2]=oc[q+2];c[q+3]=oc[q+3]*Math.min(1,t*8)*(1-t);}}
  this.live=live;this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

export class FX{constructor(scene){this.scene=scene;const sp=ctex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true,srgb:false});
  this.glow=new Points(scene,4000,true,sp);this.smk=new Points(scene,3000,false,cloudTex());this.time=0;
  // debris
  this.dN=260;this.deb=[];const dg=new THREE.BoxGeometry(1,1,1);this.debM=new THREE.InstancedMesh(dg,new THREE.MeshStandardMaterial({roughness:.9,metalness:.2}),this.dN);this.debM.castShadow=true;this.debM.frustumCulled=false;
  const m0=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<this.dN;i++){this.debM.setMatrixAt(i,m0);this.debM.setColorAt(i,new THREE.Color(1,1,1));this.deb.push({life:0,p:new V3(),v:new V3(),r:new THREE.Euler(),w:new V3(),s:1});}scene.add(this.debM);this.di=0;
  // shock spheres + ground rings
  this.shocks=[];const sg=new THREE.SphereGeometry(1,32,16),rg=new THREE.RingGeometry(.7,1,48);rg.rotateX(-Math.PI/2);
  for(let i=0;i<8;i++){const m=new THREE.Mesh(sg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color()},uA:{value:0}},
   vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.5);gl_FragColor=vec4(uC*f*uA,1.);}'}));m.visible=false;scene.add(m);
   const ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));ring.visible=false;scene.add(ring);this.shocks.push({m,ring,t:0,d:1,r:1});}
  // scorch decals
  this.scN=140;this.scI=0;const st=ctex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,4,64,64,62);g.addColorStop(0,'rgba(10,8,6,.95)');g.addColorStop(.5,'rgba(20,16,12,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);
   for(let i=0;i<26;i++){x.strokeStyle='rgba(15,12,10,.5)';x.lineWidth=1+R(3);const a=R(6.28);x.beginPath();x.moveTo(64+Math.cos(a)*20,64+Math.sin(a)*20);x.lineTo(64+Math.cos(a)*(40+R(22)),64+Math.sin(a)*(40+R(22)));x.stroke();}},{clamp:true});
  const pg=new THREE.PlaneGeometry(1,1);this.scM=new THREE.InstancedMesh(pg,new THREE.MeshBasicMaterial({map:st,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,opacity:.9}),this.scN);
  for(let i=0;i<this.scN;i++)this.scM.setMatrixAt(i,m0);this.scM.frustumCulled=false;this.scM.renderOrder=1;scene.add(this.scM);
  // track marks (ring buffer of quads with per-vertex alpha)
  this.tmN=2400;this.tmI=0;this.tmPos=new Float32Array(this.tmN*12);this.tmCol=new Float32Array(this.tmN*16);this.tmAge=new Float32Array(this.tmN).fill(99);const idx=[];for(let i=0;i<this.tmN;i++){const a=i*4;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(this.tmPos,3).setUsage(THREE.DynamicDrawUsage));tg.setAttribute('color',new THREE.BufferAttribute(this.tmCol,4).setUsage(THREE.DynamicDrawUsage));tg.setIndex(idx);
  this.tmMesh=new THREE.Mesh(tg,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));this.tmMesh.frustumCulled=false;this.tmMesh.renderOrder=1;scene.add(this.tmMesh);this.tmColor=[.2,.16,.12];this.tmLast={};this.tmT=0;
  // tracers
  this.tr=[];const cg=new THREE.CylinderGeometry(1,1,1,6,1,true);cg.rotateX(Math.PI/2);cg.translate(0,0,-.5);
  for(let i=0;i<40;i++){const m=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:new THREE.Color(4,2.6,1.2),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));m.visible=false;m.frustumCulled=false;scene.add(m);this.tr.push(m);}
  // beams
  this.beams=[];for(let i=0;i<6;i++){const g=new THREE.CylinderGeometry(1,1,1,8,1,true);g.rotateX(Math.PI/2);g.translate(0,0,.5);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffffff,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));m.visible=false;m.frustumCulled=false;scene.add(m);this.beams.push({m,t:0,c:new THREE.Color()});}
  // muzzle flash cards
  const ft=ctex(128,128,(x,w,h)=>{x.translate(64,64);for(let i=0;i<9;i++){x.rotate(Math.PI*2/9);const g=x.createLinearGradient(0,0,0,-60);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.beginPath();x.moveTo(-7,0);x.lineTo(0,-40-R(22));x.lineTo(7,0);x.fill();}
   const g=x.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,180,90,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,30,0,7);x.fill();},{clamp:true,srgb:false});
  this.flashes=[];for(let i=0;i<6;i++){const g=new THREE.Group();for(let k=0;k<3;k++){const pl=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:ft,color:new THREE.Color(3,2.2,1.3),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   if(k===0){pl.rotation.y=0;}else if(k===1){pl.rotation.y=Math.PI/2;pl.scale.set(1.8,1,1);pl.position.z=.5;}else{pl.rotation.x=Math.PI/2;pl.rotation.z=Math.PI/2;pl.scale.set(1.8,1,1);pl.position.z=.5;}g.add(pl);}g.visible=false;scene.add(g);this.flashes.push({g,t:0});}
  // dynamic lights (fixed count so shaders never recompile)
  this.lights=[];for(let i=0;i<3;i++){const l=new THREE.PointLight(0xffaa66,0,40,1.6);scene.add(l);this.lights.push(l);}this.li=0;}
 setFog(col,d){for(const s of[this.glow,this.smk]){s.U.uFog.value.set(col);s.U.uFogD.value=d;}}
 setTrackColor(c){this.tmColor=c;}
 /* --- primitives --- */
 spark(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=R(2)-1,dy=R(2)-1,dz=R(2)-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.6;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy)+(o.up===2?.6:0);const s=speed*(.3+R(.7));
  const c=Array.isArray(col)?col[R(col.length)|0]:col;this.glow.emit(p.x,p.y,p.z,dx*s,dy*s,dz*s,c[0],c[1],c[2],1,size*(.6+R(.8)),size*(o.grow??.3),life*(.5+R(.7)),o.grav??0,o.drag??2);}}
 puff(p,n,speed,col,s0,s1,life,o={}){for(let k=0;k<n;k++){let dx=R(2)-1,dy=R(2)-1,dz=R(2)-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.7;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy)*(o.up===2?.3:1);if(o.flat)dy*=.15;const sp=speed*(.25+R(.75));
  const c=Array.isArray(col)?col[R(col.length)|0]:col;const j=.85+R(.3);this.smk.emit(p.x+(o.jit?R(o.jit*2)-o.jit:0),p.y+(o.jit?R(o.jit):0),p.z+(o.jit?R(o.jit*2)-o.jit:0),dx*sp,dy*sp+(o.rise??0),dz*sp,c[0]*j,c[1]*j,c[2]*j,o.a??.6,s0*(.7+R(.6)),s1*(.7+R(.6)),life*(.6+R(.6)),o.grav??-.3,o.drag??1.4);}}
 debris(p,n,speed,cols,size,o={}){for(let k=0;k<n;k++){const d=this.deb[this.di];const i=this.di;this.di=(this.di+1)%this.dN;d.p.copy(p);d.p.x+=R(o.jit??.5)-(o.jit??.5)/2;d.p.z+=R(o.jit??.5)-(o.jit??.5)/2;let dx=R(2)-1,dz=R(2)-1;
  if(o.dir){dx=dx*.8+o.dir.x;dz=dz*.8+o.dir.z;}const s=speed*(.3+R(.7));d.v.set(dx*s,(o.up??.8)*speed*(.4+R(.8)),dz*s);d.w.set(R(20)-10,R(20)-10,R(20)-10);d.r.set(R(6),R(6),R(6));const sz=size*(.4+R(.9));d.sz=new V3(sz*(.6+R(.8)),sz*(.4+R(.6)),sz*(.6+R(.9)));d.life=o.life??(2.5+R(2));d.ground=o.ground;
  this.debM.setColorAt(i,Array.isArray(cols)?cols[R(cols.length)|0]:cols);}this.debM.instanceColor.needsUpdate=true;}
 shock(p,col,radius,dur,ring=true){const s=this.shocks.find(s=>!s.m.visible)||this.shocks[0];s.m.position.copy(p);s.m.material.uniforms.uC.value.copy(col);s.t=0;s.d=dur;s.r=radius;s.m.visible=true;s.ring.visible=ring;s.ring.position.set(p.x,p.y+.15,p.z);s.ring.material.color.copy(col).multiplyScalar(.6);}
 light(p,col,int,dist=40){const l=this.lights[this.li];this.li=(this.li+1)%this.lights.length;l.position.copy(p);l.color.set(col);l.intensity=int;l.distance=dist;}
 scorch(p,n,size){const m=new THREE.Matrix4(),q=new THREE.Quaternion().setFromUnitVectors(new V3(0,0,1),n);q.multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0,0,1),R(6.28)));
  m.compose(new V3(p.x+n.x*.06,p.y+n.y*.06,p.z+n.z*.06),q,new V3(size,size,size));this.scM.setMatrixAt(this.scI,m);this.scI=(this.scI+1)%this.scN;this.scM.instanceMatrix.needsUpdate=true;}
 flash(p,dir,size){const f=this.flashes.find(f=>!f.g.visible)||this.flashes[0];f.g.visible=true;f.t=0;f.g.position.copy(p);f.g.lookAt(p.x+dir.x,p.y+dir.y,p.z+dir.z);f.g.scale.setScalar(size);f.g.rotateZ(R(6));}
 // drop one track-mark segment for a tank track. key identifies the track
 track(key,x,y,z,fx,fz,w,alpha=.4){const last=this.tmLast[key];if(!last||last.reset){this.tmLast[key]={x,y,z};return;}const dx=x-last.x,dz=z-last.z,d=Math.hypot(dx,dz);if(d<.7)return;if(d>4){this.tmLast[key]={x,y,z};return;}
  const i=this.tmI;this.tmI=(i+1)%this.tmN;const px=-dz/d*w/2,pz=dx/d*w/2,P=this.tmPos,k=i*12;
  P.set([last.x+px,last.y+.05,last.z+pz,last.x-px,last.y+.05,last.z-pz,x+px,y+.05,z+pz,x-px,y+.05,z-pz],k);this.tmAge[i]=0;const c=this.tmColor;for(let v=0;v<4;v++)this.tmCol.set([c[0],c[1],c[2],alpha],i*16+v*4);this.tmA=this.tmA||new Float32Array(this.tmN);this.tmA[i]=alpha;
  this.tmLast[key]={x,y,z};this.tmDirty=true;}
 trackBreak(key){if(this.tmLast[key])this.tmLast[key].reset=true;}
 tracer(i,p,v,len,col,w){const m=this.tr[i];if(!m)return;m.visible=true;m.position.copy(p);const s=Math.hypot(v.x,v.y,v.z)||1;m.lookAt(p.x+v.x/s,p.y+v.y/s,p.z+v.z/s);m.scale.set(w,w,len);m.material.color.setRGB(col[0],col[1],col[2]);}
 hideTracers(from){for(let i=from;i<this.tr.length;i++)this.tr[i].visible=false;}
 beam(a,b,col,w=.12){const s=this.beams.find(s=>!s.m.visible)||this.beams[0];s.m.visible=true;s.t=0;s.w=w;s.m.position.copy(a);s.m.lookAt(b);s.m.scale.set(w,w,a.distanceTo(b));s.c.setRGB(col[0],col[1],col[2]);s.m.material.color.copy(s.c);}
 /* --- composites --- */
 explosion(p,size,o={}){const s=size;const fire=[[4,2.2,.8],[3.6,1.5,.4],[4,3,1.6],[2.6,.9,.2]];
  this.spark(p,Math.round(30*s),9*s,fire,1.8*s,.55,{up:true,drag:3,grow:1.4});
  this.spark(p,Math.round(26*s),26*s,[[4,3,1.5],[3,1.6,.5]],.25,1.1,{grav:16,drag:.9,up:true});
  const sc=o.smoke||[.16,.14,.13];this.puff(p,Math.round(14*s),5*s,[sc,[sc[0]*1.4,sc[1]*1.4,sc[2]*1.4]],1.6*s,5.5*s,3.4,{up:true,rise:1.2,a:.8,jit:s*.6});
  if(o.dust)this.puff(p,Math.round(18*s),9*s,o.dust,1.4*s,4.2*s,2.2,{flat:true,a:.55,grav:0,drag:2.2});
  if(o.debris!==false)this.debris(p,Math.round(8*s),8*s,o.cols||[new THREE.Color(.25,.22,.2),new THREE.Color(.4,.36,.3)],.35*Math.sqrt(s));
  this.shock(p,new THREE.Color(1.6,1,.5).multiplyScalar(.6),4.5*s,.45,o.ring!==false);this.light(new V3(p.x,p.y+1.5,p.z),0xffa050,60*s*s,22*s);}
 update(dt,cam,uScale){this.time+=dt;this.glow.U.uScale.value=this.smk.U.uScale.value=uScale;this.glow.update(dt);this.smk.update(dt);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion();let any=false;
  for(let i=0;i<this.dN;i++){const d=this.deb[i];if(d.life<=0)continue;any=true;d.life-=dt;d.v.y-=22*dt;d.p.addScaledVector(d.v,dt);d.r.x+=d.w.x*dt;d.r.y+=d.w.y*dt;d.r.z+=d.w.z*dt;
   const gy=d.ground?d.ground(d.p.x,d.p.z):0;if(d.p.y<gy+.05){d.p.y=gy+.05;d.v.y*=-.3;d.v.x*=.6;d.v.z*=.6;d.w.multiplyScalar(.5);}
   const k=d.life<=0?0:Math.min(1,d.life*2);q.setFromEuler(d.r);m.compose(d.p,q,new V3(d.sz.x*k,d.sz.y*k,d.sz.z*k));this.debM.setMatrixAt(i,m);}
  if(any)this.debM.instanceMatrix.needsUpdate=true;
  for(const s of this.shocks){if(!s.m.visible)continue;s.t+=dt;const k=s.t/s.d;if(k>=1){s.m.visible=false;s.ring.visible=false;continue;}const e=1-Math.pow(1-k,3);s.m.scale.setScalar(.3+s.r*e);s.m.material.uniforms.uA.value=(1-k)*(1-k)*1.4;
   if(s.ring.visible){s.ring.scale.setScalar(.5+s.r*1.8*e);s.ring.material.opacity=(1-k)*.9;}}
  for(const b of this.beams){if(!b.m.visible)continue;b.t+=dt;const k=b.t/.55;if(k>=1){b.m.visible=false;continue;}b.m.material.color.copy(b.c).multiplyScalar((1-k)*(1-k));const w=b.w*(1+k*2.5);b.m.scale.x=b.m.scale.y=w;}
  for(const f of this.flashes){if(!f.g.visible)continue;f.t+=dt;if(f.t>.06)f.g.visible=false;}
  for(const l of this.lights)l.intensity*=Math.exp(-dt*9);
  this.tmT+=dt;if(this.tmT>.2||this.tmDirty){const step=this.tmT;this.tmT=0;const C=this.tmCol,A=this.tmA;if(A){for(let i=0;i<this.tmN;i++){if(this.tmAge[i]>40)continue;this.tmAge[i]+=step;const a=A[i]*Math.max(0,1-this.tmAge[i]/40);for(let v=0;v<4;v++)C[i*16+v*4+3]=a;}}
   const g=this.tmMesh.geometry;g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;this.tmDirty=false;}}
 clear(){for(const s of[this.glow,this.smk])s.life.fill(0);for(const d of this.deb)d.life=0;const m0=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<this.dN;i++)this.debM.setMatrixAt(i,m0);this.debM.instanceMatrix.needsUpdate=true;
  for(let i=0;i<this.scN;i++)this.scM.setMatrixAt(i,m0);this.scM.instanceMatrix.needsUpdate=true;this.tmCol.fill(0);this.tmAge.fill(99);this.tmLast={};this.tmDirty=true;for(const b of this.beams)b.m.visible=false;this.hideTracers(0);}}
