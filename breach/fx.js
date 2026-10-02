// BREACH POINT — effects: additive sparks/fire, soft lit smoke (grenade clouds that block vision), tracers, decals, light flashes.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;

class Points{constructor(scene,n,additive,tex){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.gr=new Float32Array(n);
  this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.rot=new Float32Array(n);this.al=new Float32Array(n);this.fi=new Float32Array(n);this.i=0;this.alive=0;this.fy=new Float32Array(n).fill(-99);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('rot',new THREE.BufferAttribute(this.rot,1).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('fy',new THREE.BufferAttribute(this.fy,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500},uTex:{value:tex},uFog:{value:new THREE.Color()},uFogD:{value:.01},uMax:{value:2048}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute float rot;attribute float fy;attribute vec4 color;uniform float uScale,uMax;varying vec4 vC;varying float vR,vD,vY,vS,vF;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vR=rot;vD=-mv.z;vY=position.y;vS=size;vF=fy;gl_PointSize=min(uMax,size*uScale/max(.05,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;varying float vR,vD;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}'
    :'uniform sampler2D uTex;uniform vec3 uFog;uniform float uFogD;varying vec4 vC;varying float vR,vD,vY,vS,vF;void main(){vec2 q=gl_PointCoord;vec2 p=q-.5;float c=cos(vR),s=sin(vR);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+.5;vec4 t=texture2D(uTex,p);float f=1.-exp(-uFogD*uFogD*vD*vD);float near=smoothstep(.15,1.2,vD);float wy=vY-(q.y-.5)*vS;float soft=vF>-50.?smoothstep(vF-.02,vF+.55,wy):1.;float lit=1.12-.42*q.y+.12*(t.a-.5);gl_FragColor=vec4(mix(vC.rgb*lit,uFog,f),t.a*vC.a*2.4*near*soft);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?4:3;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0,alpha=1,fadeIn=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.gr[i]=grow;this.rot[i]=Math.random()*6.28;this.al[i]=alpha;this.fi[i]=fadeIn;this.fy[i]=this.nextFy;this.nextFy=-99;return i;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.6;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy);const sp=speed*(.3+Math.random()*.7);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*sp,dy*sp,dz*sp,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.grow??0,o.alpha??1,o.fadeIn??0);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,gr,al,fi}=this;let alive=0;const add=this.add;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}alive++;life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;if(g[i]>0&&p[i*3+1]<this.floor){p[i*3+1]=this.floor;v[i*3+1]*=-.3;v[i*3]*=.6;v[i*3+2]*=.6;}
   if(add){const f=k*k;c[i*4]=oc[i*3]*f;c[i*4+1]=oc[i*3+1]*f;c[i*4+2]=oc[i*3+2]*f;c[i*4+3]=1;s[i]=os[i]*(.4+.6*k);}
   else{const age=max[i]-life[i];const fin=fi[i]>0?Math.min(1,age/fi[i]):Math.min(1,(1-k)*8);const fout=Math.min(1,life[i]/Math.min(2.2,max[i]*.35));c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=al[i]*fin*fout;os[i]+=gr[i]*dt;s[i]=os[i];this.rot[i]+=dt*.12;}}
  this.alive=alive;const A=this.geo.attributes;A.position.needsUpdate=A.color.needsUpdate=A.size.needsUpdate=A.rot.needsUpdate=true;}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}}
Points.prototype.floor=.03;Points.prototype.nextFy=-99;

class Tracers{constructor(scene,n=96){this.n=n;this.list=[];const g=new THREE.BoxGeometry(.016,.016,1);g.translate(0,0,-.5);
  this.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(6,4.4,2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),n);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.z=new V(0,0,-1);this.t=new V();this.sc=new V();}
 fire(a,b,speed=380,len=3){if(this.list.length>=this.n)this.list.shift();const d=new V().subVectors(b,a),dist=d.length();if(dist<1.5)return;d.divideScalar(dist);this.list.push({a:a.clone(),d,dist,t:0,speed,len:Math.min(len,dist)});}
 update(dt){let k=0;for(let i=this.list.length-1;i>=0;i--){const t=this.list[i];t.t+=dt*t.speed;if(t.t-t.len>t.dist)this.list.splice(i,1);}
  for(const t of this.list){const head=Math.min(t.dist,t.t),tail=Math.max(0,t.t-t.len),L=head-tail;if(L<=.01)continue;this.q.setFromUnitVectors(this.z,t.d);this.m.compose(this.t.copy(t.a).addScaledVector(t.d,head),this.q,this.sc.set(1,1,L));this.mesh.setMatrixAt(k++,this.m);}
  this.mesh.count=k;this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.list.length=0;this.mesh.count=0;}}

class Decals{constructor(scene,tex,n,size,o={}){this.n=n;this.i=0;const m=new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,roughness:.95,color:o.color||0xffffff});
  this.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(size,size),m,n);this.mesh.count=0;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.Z=new V(0,0,1);this.sv=new V();this.pv=new V();}
 add(p,n,s=1){const i=this.i;this.i=(i+1)%this.n;this.q.setFromUnitVectors(this.Z,n);this.q2.setFromAxisAngle(this.Z,Math.random()*6.28);this.q.multiply(this.q2);this.m.compose(this.pv.copy(p).addScaledVector(n,.006),this.q,this.sv.set(s,s,s));this.mesh.setMatrixAt(i,this.m);this.mesh.count=Math.max(this.mesh.count,i+1);this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.mesh.count=0;this.i=0;}}

export class FX{
 constructor(scene,TX){this.scene=scene;this.sparks=new Points(scene,2600,true);this.smoke=new Points(scene,1400,false,TX.puff);this.tracers=new Tracers(scene);
  this.holes=new Decals(scene,TX.decal,320,.12);this.scorch=new Decals(scene,TX.scorch,24,3.4);
  this.lights=[0,1,2].map(()=>{const l=new THREE.PointLight(0xffb060,0,14,1.8);scene.add(l);return l;});this.li=0;this.clouds=[];this.fires=[];this.fireLight=[0,1].map(()=>{const l=new THREE.PointLight(0xff7a2a,0,12,1.6);scene.add(l);return l;});}
 flash(p,col,int,dist=14){const l=this.lights[this.li];this.li=(this.li+1)%this.lights.length;l.position.copy(p);l.color.set(col);l.intensity=int;l.distance=dist;}
 impact(p,n,mat,big=1){const dust=mat==='wood'?new THREE.Color(.45,.35,.22):mat==='metal'?new THREE.Color(.4,.4,.42):this.dustCol||new THREE.Color(.6,.52,.4);
  this.smoke.burst(p,3,1.4*big,dust,.35*big,.9,{dir:n,spread:.8,drag:3,grow:.9,alpha:.55});
  if(mat==='metal'||Math.random()<.4)this.sparks.burst(p,mat==='metal'?7:3,6,[new THREE.Color(3,2.2,1),new THREE.Color(2.4,1.4,.5)],.05,.25,{dir:n,spread:.9,grav:9,drag:1});
  if(mat!=='water')this.holes.add(p,n,.7+Math.random()*.5);}
 blood(p,d){this.sparks.burst(p,6,3,new THREE.Color(.5,.02,.02),.09,.35,{dir:d,spread:.6,grav:8});this.smoke.burst(p,3,1.2,new THREE.Color(.4,.03,.03),.25,.5,{dir:d,spread:.5,drag:3,grow:.6,alpha:.7});}
 muzzle(p,d,big=1){this.sparks.burst(p,4,5*big,[new THREE.Color(3,2,.8)],.06,.08,{dir:d,spread:.5,drag:4});this.smoke.emit(p.x,p.y,p.z,d.x*.6,d.y*.6+.15,d.z*.6,.62,.6,.58,.18*big,.6,0,2,.7,.32);this.flash(p,0xffb060,6*big,9);}
 explosion(p){this.sparks.burst(p,90,20,[new THREE.Color(3.4,2.2,.8),new THREE.Color(2.8,1.2,.3),new THREE.Color(3,3,2.4)],.4,.55,{drag:2.6,grav:3});
  this.sparks.burst(p,30,14,[new THREE.Color(2.4,1.5,.6)],.06,1.1,{up:true,grav:12,drag:.6});
  this.smoke.burst(p,26,5,[new THREE.Color(.22,.2,.19),new THREE.Color(.34,.31,.28)],1.4,3.2,{up:true,drag:1.6,grow:1.4,alpha:.75,grav:-.4});this.flash(p,0xffa040,90,22);
  this.scorch.add(new V(p.x,p.y-.02,p.z),new V(0,1,0),1);}
 // grenade smoke cloud: dome of large soft puffs that blocks vision; returns the cloud record used for LOS tests
 smokeCloud(p,dur=18,col){const c={x:p.x,y:p.y,z:p.z,r:0,R:4.6,t:0,dur,ids:[]};const base=col||new THREE.Color(.78,.78,.79);
  for(let i=0;i<78;i++){const small=i<26;const a=Math.random()*6.28,rr=small?1+Math.random()*3.4:Math.sqrt(Math.random())*3.6;const size=small?1.2+Math.random()*.7:2.3+Math.random()*1.5;
   const h=small?.45+Math.random()*.4:size*.38+Math.random()*Math.max(.2,2.6-rr*.45);const shade=.6+Math.min(1,h/3.4)*.38+Math.random()*.06;
   this.smoke.nextFy=p.y;c.ids.push(this.smoke.emit(p.x+Math.cos(a)*rr*.2,p.y+h*.4,p.z+Math.sin(a)*rr*.2,Math.cos(a)*rr*1.15,h*.5+.1,Math.sin(a)*rr*1.15,base.r*shade,base.g*shade,base.b*shade,size,dur+Math.random()*1.5,0,1.3,.1,.92,.9));}
  this.clouds.push(c);return c;}
 fire(p,dur=7,lvl){const f={x:p.x,y:p.y,z:p.z,r:3.1,t:0,dur};this.fires.push(f);this.scorch.add(new V(p.x,p.y+.01,p.z),new V(0,1,0),1.2);return f;}
 update(dt,fog){this.sparks.update(dt);this.smoke.update(dt);this.tracers.update(dt);if(fog){this.smoke.U.uFog.value.copy(fog.color);this.smoke.U.uFogD.value=fog.density;}
  for(const l of this.lights)l.intensity*=Math.exp(-dt*22);
  for(let i=this.clouds.length-1;i>=0;i--){const c=this.clouds[i];c.t+=dt;c.r=Math.min(c.R,c.t*5)*(c.t>c.dur-1.5?Math.max(0,(c.dur-c.t)/1.5):1);if(c.t>c.dur+1)this.clouds.splice(i,1);}
  let fl=0;for(let i=this.fires.length-1;i>=0;i--){const f=this.fires[i];f.t+=dt;if(f.t>f.dur||this.inSmoke(f.x,f.y+.5,f.z)){this.fires.splice(i,1);continue;}const k=f.t<.3?f.t/.3:f.t>f.dur-1?(f.dur-f.t):1;
   for(let n=0;n<Math.round(9*k)+1;n++){const a=Math.random()*6.28,r=Math.sqrt(Math.random())*f.r;const core=Math.random()<.35;const h=1-r/f.r;this.sparks.emit(f.x+Math.cos(a)*r,f.y+.04,f.z+Math.sin(a)*r,(Math.random()-.5)*.5,1.6+Math.random()*2.4*(.4+h),(Math.random()-.5)*.5,core?2.8:2.4,core?1.7:.85+Math.random()*.35,core?.6:.12,.16+Math.random()*.2*(.5+h),.28+Math.random()*.4*(.5+h),-1.5,.6);}
   if(Math.random()<dt*14)this.sparks.emit(f.x+(Math.random()-.5)*f.r,f.y+.3,f.z+(Math.random()-.5)*f.r,(Math.random()-.5)*1.5,3+Math.random()*3,(Math.random()-.5)*1.5,3,1.6,.4,.035,1.2,1.2,.3);
   if(Math.random()<dt*6)this.smoke.emit(f.x+(Math.random()-.5)*f.r,f.y+1.4,f.z+(Math.random()-.5)*f.r,0,1.4,0,.12,.1,.09,1,2.2,0,.6,.8,.5);
   if(fl<2){const l=this.fireLight[fl++];l.position.set(f.x,f.y+1,f.z);l.intensity=(28+Math.random()*12)*k;}}
  for(;fl<2;fl++)this.fireLight[fl].intensity=0;}
 // does segment a->b pass through a smoke cloud?
 smokeBlocks(ax,ay,az,bx,by,bz){for(const c of this.clouds){if(c.r<1)continue;const R=c.r*.92,cy=c.y+1.2;const dx=bx-ax,dy=by-ay,dz=bz-az,L2=dx*dx+dy*dy+dz*dz;let t=((c.x-ax)*dx+(cy-ay)*dy+(c.z-az)*dz)/L2;t=Math.max(0,Math.min(1,t));
   const px=ax+dx*t-c.x,py=(ay+dy*t-cy)*1.3,pz=az+dz*t-c.z;if(px*px+py*py+pz*pz<R*R)return true;}return false;}
 inSmoke(x,y,z){for(const c of this.clouds){const dx=x-c.x,dy=(y-c.y-1.2)*1.3,dz=z-c.z;if(dx*dx+dy*dy+dz*dz<(c.r*.85)**2)return Math.min(1,(c.r*.85-Math.sqrt(dx*dx+dy*dy+dz*dz))/1.2);}return 0;}
 inFire(x,z,y=0){for(const f of this.fires){if(Math.abs(y-f.y)<1.6&&Math.hypot(x-f.x,z-f.z)<f.r)return f;}return null;}
 clear(){this.sparks.clear();this.smoke.clear();this.tracers.clear();this.holes.clear();this.scorch.clear();this.clouds.length=0;this.fires.length=0;for(const l of this.fireLight)l.intensity=0;}}
