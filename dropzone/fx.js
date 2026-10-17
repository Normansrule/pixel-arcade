// DROPZONE (adapted from EXFIL) — effects: soft particle systems (dust, smoke, sparks), bullet tracers, impact decals, flare light, marker smoke, plate breaks.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,R=Math.random;

class Parts{
 constructor(scene,n,tex,additive){this.n=n;this.i=0;const g=new THREE.BufferGeometry();this.P=new Float32Array(n*3);this.C=new Float32Array(n*4);this.S=new Float32Array(n);this.v=new Float32Array(n*3);this.life=new Float32Array(n);this.max=new Float32Array(n);this.grow=new Float32Array(n);this.drag=new Float32Array(n);this.grav=new Float32Array(n);this.a0=new Float32Array(n);this.s0=new Float32Array(n);
  g.setAttribute('position',new THREE.BufferAttribute(this.P,3));g.setAttribute('color',new THREE.BufferAttribute(this.C,4));g.setAttribute('size',new THREE.BufferAttribute(this.S,1));
  this.U={uTex:{value:tex},uScale:{value:600}};
  const m=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,this.U]),transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,fog:true,
   vertexShader:`attribute float size;attribute vec4 color;varying vec4 vC;uniform float uScale;
    #include <fog_pars_vertex>
    void main(){vC=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uScale/max(.1,-mvPosition.z);gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
   fragmentShader:`uniform sampler2D uTex;varying vec4 vC;
    #include <fog_pars_fragment>
    void main(){vec4 t=texture2D(uTex,gl_PointCoord);gl_FragColor=vec4(vC.rgb,vC.a*t.a);if(gl_FragColor.a<.004)discard;
    #include <fog_fragment>
    }`});
  this.U=m.uniforms;this.mesh=new THREE.Points(g,m);this.mesh.frustumCulled=false;scene.add(this.mesh);}
 emit(x,y,z,vx,vy,vz,r,g,b,a,size,life,o={}){const i=this.i;this.i=(this.i+1)%this.n;this.P[i*3]=x;this.P[i*3+1]=y;this.P[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;
  this.C[i*4]=r;this.C[i*4+1]=g;this.C[i*4+2]=b;this.C[i*4+3]=a;this.a0[i]=a;this.S[i]=size;this.s0[i]=size;this.life[i]=life;this.max[i]=life;this.grow[i]=o.grow||0;this.drag[i]=o.drag??1.5;this.grav[i]=o.grav??0;}
 update(dt){const P=this.P,v=this.v;for(let i=0;i<this.n;i++){if(this.life[i]<=0){if(this.C[i*4+3]!==0){this.C[i*4+3]=0;}continue;}this.life[i]-=dt;const k=Math.max(0,this.life[i]/this.max[i]);
  const dr=Math.exp(-this.drag[i]*dt);v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-this.grav[i]*dt;v[i*3+2]*=dr;P[i*3]+=v[i*3]*dt;P[i*3+1]+=v[i*3+1]*dt;P[i*3+2]+=v[i*3+2]*dt;
  this.C[i*4+3]=this.a0[i]*Math.min(1,k*2.2)*(this.life[i]<=0?0:1);this.S[i]=this.s0[i]*(1+this.grow[i]*(1-k));}
  const g=this.mesh.geometry;g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;g.attributes.size.needsUpdate=true;}
 clear(){this.life.fill(0);this.C.fill(0);}
}

export class FX{
 constructor(scene,sprites){this.scene=scene;this.dust=new Parts(scene,2600,sprites.puff,false);this.spark=new Parts(scene,700,sprites.glow,true);
  // tracers
  this.trN=64;this.tr=[];const tg=new THREE.BufferGeometry();this.tP=new Float32Array(this.trN*6);this.tC=new Float32Array(this.trN*6);tg.setAttribute('position',new THREE.BufferAttribute(this.tP,3));tg.setAttribute('color',new THREE.BufferAttribute(this.tC,3));
  this.trMesh=new THREE.LineSegments(tg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));this.trMesh.frustumCulled=false;scene.add(this.trMesh);
  // decals
  this.dN=220;this.di=0;const dm=new THREE.MeshBasicMaterial({map:sprites.hole,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,color:0x777777});this.dec=new THREE.InstancedMesh(new THREE.PlaneGeometry(.11,.11),dm,this.dN);this.dec.count=0;this.dec.frustumCulled=false;scene.add(this.dec);
  this.m4=new THREE.Matrix4();this.q=new THREE.Quaternion();this.flares=[];this.sprites=sprites;
  this.light=new THREE.PointLight(0x50ff80,0,60,1.6);scene.add(this.light);}
 tracer(a,b,col=[1,.85,.55],speed=360){this.tr.push({a:a.clone(),b:b.clone(),t:0,len:a.distanceTo(b),speed,col});if(this.tr.length>this.trN)this.tr.shift();}
 decal(p,n){const i=this.di;this.di=(this.di+1)%this.dN;this.q.setFromUnitVectors(new V(0,0,1),n);this.q.multiply(new THREE.Quaternion().setFromAxisAngle(new V(0,0,1),R()*6));const s=.7+R()*.6;this.m4.compose(p.clone().addScaledVector(n,.012),this.q,new V(s,s,s));this.dec.setMatrixAt(i,this.m4);this.dec.count=Math.max(this.dec.count,i+1);this.dec.instanceMatrix.needsUpdate=true;}
 // surface: 0 concrete 1 metal 2 wood 3 dirt 4 water 5 soft
 impact(p,n,surf=0,big=1){const c=surf===1?[.6,.6,.62]:surf===2?[.5,.4,.3]:surf===3?[.45,.4,.32]:surf===4?[.8,.85,.9]:[.62,.6,.56];const k=surf===4?2:1;
  for(let i=0;i<6*big*k;i++)this.dust.emit(p.x,p.y,p.z,n.x*(1+R()*2)+(R()-.5)*1.2,n.y*(1+R()*2)+(R()-.2)*(surf===4?4:1.2),n.z*(1+R()*2)+(R()-.5)*1.2,c[0],c[1],c[2],.5,.18+R()*.22,.5+R()*.6,{grow:2.5,drag:3,grav:surf===4?6:.6});
  if(surf===1||surf===0&&R()<.5)for(let i=0;i<5*big;i++)this.spark.emit(p.x,p.y,p.z,n.x*4+(R()-.5)*6,n.y*4+R()*4,n.z*4+(R()-.5)*6,2.4,1.6,.7,1,.05,.18+R()*.15,{drag:1,grav:14});
  if(surf!==4&&surf!==3)this.decal(p,n);}
 hitPuff(p,d){for(let i=0;i<8;i++)this.dust.emit(p.x,p.y,p.z,-d.x*1.5+(R()-.5)*1.5,-d.y*1.5+(R()-.5)*1.5+.5,-d.z*1.5+(R()-.5)*1.5,.45,.12,.1,.6,.12+R()*.14,.4,{grow:2,drag:4,grav:1.5});}
 plateBreak(p){for(let i=0;i<14;i++)this.spark.emit(p.x,p.y,p.z,(R()-.5)*5,R()*4,(R()-.5)*5,.8,1.6,2.8,1,.07,.35,{drag:1.5,grav:8});}
 smokeCol(p,c=[1,.3,.2],n=2){for(let i=0;i<n;i++)this.dust.emit(p.x+(R()-.5)*.5,p.y+.2,p.z+(R()-.5)*.5,(R()-.5)*.6,2.2+R()*1.5,(R()-.5)*.6,c[0],c[1],c[2],.55,.6+R()*.5,4+R()*2,{grow:5,drag:.5,grav:-.1});}
 boom(p){for(let i=0;i<40;i++)this.spark.emit(p.x,p.y+.5,p.z,(R()-.5)*14,R()*10,(R()-.5)*14,2.6,1.4,.4,1,.18,.5,{drag:2,grav:6});for(let i=0;i<24;i++)this.dust.emit(p.x+(R()-.5)*2,p.y+R()*2,p.z+(R()-.5)*2,(R()-.5)*4,1+R()*3,(R()-.5)*4,.3,.28,.26,.7,1.2+R(),2.5+R()*2,{grow:3,drag:1.5,grav:-.3});}
 armorSpark(p,d){for(let i=0;i<10;i++)this.spark.emit(p.x,p.y,p.z,-d.x*3+(R()-.5)*5,-d.y*3+R()*3,-d.z*3+(R()-.5)*5,2.6,2,1.2,1,.06,.2,{drag:1,grav:10});}
 muzzle(p,d,sup){if(sup){for(let i=0;i<2;i++)this.dust.emit(p.x,p.y,p.z,d.x*.8,d.y*.8+.2,d.z*.8,.7,.7,.7,.12,.12,.6,{grow:3,drag:2});return;}
  for(let i=0;i<4;i++)this.dust.emit(p.x+d.x*.1,p.y+d.y*.1,p.z+d.z*.1,d.x*(1+R()*2)+(R()-.5)*.4,d.y*(1+R()*2)+.3+(R()-.5)*.4,d.z*(1+R()*2)+(R()-.5)*.4,.75,.74,.72,.18,.12+R()*.1,.8+R()*.6,{grow:4,drag:2.5,grav:-.4});
  for(let i=0;i<3;i++)this.spark.emit(p.x,p.y,p.z,d.x*8+(R()-.5)*2,d.y*8+(R()-.5)*2,d.z*8+(R()-.5)*2,2.5,1.6,.6,1,.05,.08,{drag:2});}
 flare(p){const f={p:p.clone(),v:new V((R()-.5)*1.2,26,(R()-.5)*1.2),t:0};this.flares.push(f);this.light.intensity=40;}
 dustCloud(p,n=10){for(let i=0;i<n;i++)this.dust.emit(p.x+(R()-.5)*.6,p.y+R()*.4,p.z+(R()-.5)*.6,(R()-.5)*1.4,R()*.6,(R()-.5)*1.4,.55,.52,.48,.35,.35+R()*.3,1.2+R(),{grow:2,drag:2});}
 update(dt){this.dust.update(dt);this.spark.update(dt);
  // tracers
  let k=0;for(let i=this.tr.length-1;i>=0;i--){const t=this.tr[i];t.t+=dt;const head=Math.min(t.len,t.t*t.speed),tail=Math.max(0,head-Math.min(5,t.speed*.016));if(tail>=t.len){this.tr.splice(i,1);continue;}
   const d=new V().subVectors(t.b,t.a).normalize();const A=t.a.clone().addScaledVector(d,tail),B=t.a.clone().addScaledVector(d,head);this.tP.set([A.x,A.y,A.z,B.x,B.y,B.z],k*6);const c=t.col;this.tC.set([c[0]*.15,c[1]*.15,c[2]*.15,c[0]*1.4,c[1]*1.3,c[2]*1.2],k*6);k++;}
  for(let i=k;i<this.trN;i++){this.tP.fill(0,i*6,i*6+6);}this.trMesh.geometry.attributes.position.needsUpdate=true;this.trMesh.geometry.attributes.color.needsUpdate=true;this.trMesh.geometry.setDrawRange(0,k*2);
  // flares
  let lit=null;for(let i=this.flares.length-1;i>=0;i--){const f=this.flares[i];f.t+=dt;if(f.t<2.2){f.v.y-=9*dt;f.p.addScaledVector(f.v,dt);}else{f.p.y-=dt*1.4;f.p.x+=dt*.6;}
   this.spark.emit(f.p.x,f.p.y,f.p.z,(R()-.5)*.6,-.5,(R()-.5)*.6,.6,3,1,1,.7+R()*.3,.25,{drag:1});if(R()<.7)this.dust.emit(f.p.x,f.p.y,f.p.z,(R()-.5)*.4,.3,(R()-.5)*.4,.7,.85,.72,.35,.6,3.5,{grow:3,drag:.6});lit=f;if(f.t>26)this.flares.splice(i,1);}
  if(lit){this.light.position.copy(lit.p);this.light.intensity=60*(.85+R()*.3);}else this.light.intensity=0;}
 clear(){this.dust.clear();this.spark.clear();this.tr.length=0;this.flares.length=0;this.dec.count=0;this.light.intensity=0;}
}
