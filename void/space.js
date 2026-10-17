// VOIDWING — the battlefield: baked nebula skybox, stars, sun + flare, a planet (gas giant with rings or ocean world), asteroid field with cover, speed dust.
import * as THREE from '../vendor/three.module.min.js';
import {V,C,cl,rng,ctex,smoothNormals,fbm3,GLSL_NOISE,TAU} from './util.js';

export const MAPS=[
 {id:'kessler',name:'KESSLER DRIFT',tag:'RINGED GIANT · DENSE BELT',desc:'A shattered moon orbits an amber gas giant. Thick asteroid belt between the fleets — great cover, tight flying.',
  neb:[[.02,.05,.10],[.05,.32,.42],[.42,.16,.55],[1,.62,.36]],sun:[.55,.32,-.77],sunCol:0xfff1dc,fill:0x3a6c8a,planet:{kind:'gas',dir:[-.62,-.18,-.76],ang:.33,tilt:.42,c:[[.82,.58,.34],[.55,.32,.2],[.95,.82,.6],[.36,.22,.16]],rings:true},rocks:300,belt:1,seed:7},
 {id:'ember',name:'EMBERVEIL RIFT',tag:'OCEAN WORLD · CRIMSON NEBULA',desc:'Fleet anchorage above a storm-wrapped ocean world, lit by a burning nebula. Open space with scattered rock clusters.',
  neb:[[.06,.02,.03],[.55,.09,.07],[.95,.42,.16],[.35,.2,.55]],sun:[-.42,.5,-.75],sunCol:0xffe0c4,fill:0x8a3a2a,planet:{kind:'ocean',dir:[.48,-.42,-.77],ang:.42,tilt:.2,c:[[.04,.16,.32],[.1,.34,.45],[.92,.95,1],[.42,.34,.24]],rings:false},rocks:180,belt:0,seed:21},
];
export const ARENA=6200; // soft combat boundary (radius)

/* ================= skybox: nebula + stars baked once into a cube map ================= */
export function bakeSky(R,map,size){
 const s=new THREE.Scene(),U={uN0:{value:new C(...map.neb[0])},uN1:{value:new C(...map.neb[1])},uN2:{value:new C(...map.neb[2])},uN3:{value:new C(...map.neb[3])},uSun:{value:new V(...map.sun).normalize()},uSeed:{value:map.seed}};
 const m=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uN0,uN1,uN2,uN3,uSun;uniform float uSeed;varying vec3 vD;${GLSL_NOISE}
  float star(vec3 d,float sc,float th){vec3 p=d*sc;vec3 i=floor(p);float h=h13(i+uSeed);if(h<th)return 0.;vec3 o=vec3(h13(i+7.1),h13(i+3.3),h13(i+5.9))*.6+.2;float r=length(fract(p)-o);return smoothstep(.32,0.,r)*(h-th)/(1.-th);}
  void main(){vec3 d=normalize(vD);vec3 sd=uSeed*vec3(.37,.11,.23);
   // galactic band
   float band=exp(-pow(dot(d,normalize(vec3(.3,1.,.2))),2.)*9.);
   vec3 q=vec3(fbm(d*1.6+sd,5),fbm(d*1.6+sd+4.3,5),fbm(d*1.6+sd+8.1,5));
   float n=fbm(d*2.4+q*2.2+sd,7),n2=fbm(d*5.+q*3.+sd*2.,6),dust=fbm(d*3.5+q*1.4+11.,6);
   float neb=smoothstep(.35,.85,n)*(.45+band*.8);float hot=smoothstep(.55,.9,n2*n*1.6);
   vec3 col=uN0*.35+uN1*neb*1.1+uN2*hot*neb*1.6;
   col*=1.-smoothstep(.45,.75,dust)*.75;
   // filaments
   float fil=pow(1.-abs(fbm(d*7.+q*4.,5)*2.-1.),10.)*neb;col+=uN2*fil*.9+uN1*fil*.4;
   // sun scatter in the gas
   float sdot=max(dot(d,uSun),0.);col+=uN3*(pow(sdot,6.)*.35+pow(sdot,60.)*.8)*(.4+neb);
   // stars: three layers, denser along the band
   float st=star(d,180.,.985-band*.012)*1.6+star(d,420.,.975-band*.02)*.8+star(d,900.,.965-band*.03)*.45;
   vec3 sc=mix(vec3(.75,.85,1.3),vec3(1.3,1.05,.8),h13(floor(d*420.)));col+=sc*st*(1.-smoothstep(.5,.8,dust)*.7);
   col+=vec3(.9,.92,1.)*band*fbm(d*60.,3)*.05;
   gl_FragColor=vec4(col,1.);}`});
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,64,32),m));
 const rt=new THREE.WebGLCubeRenderTarget(size,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
 const cc=new THREE.CubeCamera(1,1000,rt);const tm=R.toneMapping;R.toneMapping=THREE.NoToneMapping;cc.update(R,s);R.toneMapping=tm;m.dispose();s.children[0].geometry.dispose();
 return rt;}

/* ================= planet (always drawn behind everything, follows the camera) ================= */
export function makePlanet(map){const P=map.planet,g=new THREE.Group();g.renderOrder=-20;
 const U={uSun:{value:new V(...map.sun).normalize()},uC0:{value:new C(...P.c[0])},uC1:{value:new C(...P.c[1])},uC2:{value:new C(...P.c[2])},uC3:{value:new C(...P.c[3])},uTime:{value:0},uRim:{value:new C(...(P.kind==='gas'?[1,.75,.45]:[.35,.65,1]))}};
 const body=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.ShaderMaterial({uniforms:U,
  vertexShader:'varying vec3 vN,vL,vW;void main(){vL=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform vec3 uSun,uC0,uC1,uC2,uC3,uRim;uniform float uTime;varying vec3 vN,vL,vW;${GLSL_NOISE}
  void main(){vec3 n=normalize(vN),l=normalize(vL);vec3 vd=normalize(cameraPosition-vW);
   ${P.kind==='gas'?`float w=fbm(l*3.+vec3(0,uTime*.002,0),5);float lat=l.y+ (w-.5)*.22+fbm(l*vec3(1.5,14.,1.5),4)*.08;
   float b=sin(lat*24.)*.5+.5,b2=sin(lat*57.+w*6.)*.5+.5;vec3 col=mix(uC0,uC1,b);col=mix(col,uC2,smoothstep(.6,1.,b2)*.55);col=mix(col,uC3,smoothstep(.55,.8,fbm(l*9.,4))*.35);
   float storm=smoothstep(.09,.0,length(l-normalize(vec3(.5,-.25,.83))));col=mix(col,vec3(.9,.45,.25),storm*.8);`
   :`float cn=fbm(l*2.4,6);float land=smoothstep(.55,.58,cn);vec3 col=mix(uC0,uC1,smoothstep(.3,.55,cn));col=mix(col,uC3*(.7+.6*fbm(l*14.,4)),land);
   float cl=smoothstep(.45,.75,fbm(l*4.+vec3(fbm(l*3.,4)*1.5),6));col=mix(col,uC2,cl*.9);`}
   float ndl=dot(n,uSun);float lit=smoothstep(-.12,.35,ndl)*(.25+.85*max(ndl,0.));
   vec3 c=col*lit*1.25;
   ${P.kind==='ocean'?'vec3 hv=normalize(uSun+vd);c+=(1.-land)*(1.-cl)*pow(max(dot(n,hv),0.),90.)*vec3(1.,.85,.7)*1.4*step(0.,ndl);float city=smoothstep(.7,.9,fbm(l*40.,3))*land*(1.-cl);c+=vec3(1.,.6,.3)*city*.7*(1.-smoothstep(-.2,.05,ndl));':''}
   float fr=pow(1.-max(dot(n,vd),0.),3.);c+=uRim*fr*(smoothstep(-.35,.45,ndl))*1.1;
   gl_FragColor=vec4(c,1.);}`}));
 body.renderOrder=-20;g.add(body);
 // thin atmosphere halo
 const halo=new THREE.Mesh(new THREE.SphereGeometry(1.06,64,32),new THREE.ShaderMaterial({uniforms:U,depthTest:true,depthWrite:false,transparent:true,blending:THREE.AdditiveBlending,side:THREE.BackSide,
  vertexShader:'varying vec3 vN,vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform vec3 uSun,uRim;varying vec3 vN,vW;void main(){vec3 n=normalize(vN);vec3 vd=normalize(cameraPosition-vW);float x=max(-dot(n,vd),0.);float a=smoothstep(0.,.3,x)*(1.-smoothstep(.34,.62,x));gl_FragColor=vec4(uRim*a*.9*smoothstep(-.45,.4,dot(n,uSun)),1.);}'}));
 halo.renderOrder=-19;g.add(halo);
 if(P.rings){const rg=new THREE.RingGeometry(1.35,2.35,192,1);const ring=new THREE.Mesh(rg,new THREE.ShaderMaterial({uniforms:U,depthTest:true,depthWrite:false,transparent:true,side:THREE.DoubleSide,
  vertexShader:'varying vec3 vW,vL,vCtr;varying float vR;void main(){vL=position;vCtr=(modelMatrix*vec4(0,0,0,1)).xyz;vR=length(modelMatrix[0].xyz);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform vec3 uSun,uC0,uC2;uniform float uTime;varying vec3 vW,vL,vCtr;varying float vR;${GLSL_NOISE}
   void main(){float r=length(vL.xy);float b=fbm(vec3(r*38.,0.,0.),5);float a=smoothstep(.35,.7,b)*smoothstep(1.35,1.45,r)*smoothstep(2.35,2.2,r)*(1.-smoothstep(1.86,1.9,r)*smoothstep(1.97,1.93,r)*.9);
    vec3 ctr=vCtr;float R=vR;
    // occluded by the planet (ray from camera)
    vec3 ro=cameraPosition,rd=normalize(vW-ro);vec3 oc=ro-ctr;float bb=dot(oc,rd),cc=dot(oc,oc)-R*R,h=bb*bb-cc;if(h>0.){float t=-bb-sqrt(h);if(t>0.&&t<length(vW-ro))discard;}
    // planet shadow on the rings
    vec3 o2=vW-ctr;float b2=dot(o2,uSun),c2=dot(o2,o2)-R*R*.98;float sh=(b2<0.&&b2*b2-c2>0.)?.12:1.;
    vec3 col=mix(uC0,uC2,b)*1.15*sh;gl_FragColor=vec4(col*a,a*.85);}`}));
  ring.renderOrder=-18;g.add(ring);g.userData.ring=ring;}
 g.userData.U=U;g.userData.dir=new V(...P.dir).normalize();g.userData.ang=P.ang;
 g.rotation.set(P.tilt,0,P.tilt*.6);return g;}
export function placePlanet(pl,cam){const D=18000,R=D*Math.sin(pl.userData.ang);pl.position.copy(cam.position).addScaledVector(pl.userData.dir,D);pl.scale.setScalar(R);}

/* ================= sun: bright core + soft glow + lens ghosts ================= */
export function makeSun(map){const t=ctex(256,256,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.05,'rgba(255,250,235,1)');g.addColorStop(.12,'rgba(255,220,170,.5)');g.addColorStop(.35,'rgba(255,170,110,.1)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true});
 const g=new THREE.Group();const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,color:new C(5,4.6,4.2),blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,transparent:true,fog:false}));s.renderOrder=-15;g.add(s);
 const gt=ctex(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,w*.3,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.8,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true});
 const ghosts=[[.35,.06,0x66aaff],[.62,.03,0xff9966],[1.25,.09,0x88ffcc],[1.6,.04,0xaa88ff]].map(([k,sz,c])=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:new C(c).multiplyScalar(.35),blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,transparent:true}));m.renderOrder=50;m.userData={k,sz};g.add(m);return m;});
 g.userData={core:s,ghosts,dir:new V(...map.sun).normalize()};return g;}
const _sp=new V(),_c=new V();
export function placeSun(sun,cam,occluded){const d=sun.userData.dir,D=32000;sun.userData.core.position.copy(cam.position).addScaledVector(d,D);sun.userData.core.scale.setScalar(D*.16);
 // ghosts along the screen-space line through the centre
 _sp.copy(sun.userData.core.position).project(cam);const vis=_sp.z<1&&Math.abs(_sp.x)<1.3&&Math.abs(_sp.y)<1.3&&!occluded;
 for(const m of sun.userData.ghosts){m.visible=vis;if(!vis)continue;const k=m.userData.k;_c.set(-_sp.x*(k-.0)+_sp.x*(1-k),-_sp.y*(k-.0)+_sp.y*(1-k),.5).unproject(cam);m.position.copy(cam.position).addScaledVector(_c.sub(cam.position).normalize(),100);m.scale.setScalar(100*m.userData.sz*(1-Math.min(1,Math.hypot(_sp.x,_sp.y)*.4)));}}

/* ================= asteroid field ================= */
function rockTex(seed){return ctex(512,512,(x,w,h)=>{const r=rng(seed);x.fillStyle='#7d746b';x.fillRect(0,0,w,h);const im=x.getImageData(0,0,w,h),d=im.data;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const u=i/w*8,v=j/h*8;const n=fbm3(u,v,seed,5),n2=fbm3(u*4,v*4,seed+9,3);const k=(.55+n*.7)*(.85+n2*.3);const o=(j*w+i)*4;d[o]=118*k;d[o+1]=108*k;d[o+2]=100*k;}
  x.putImageData(im,0,0);
  for(let i=0;i<70;i++){const cx=r()*w,cy=r()*h,cr=3+Math.pow(r(),3)*40;const g=x.createRadialGradient(cx,cy,cr*.2,cx,cy,cr);g.addColorStop(0,'rgba(20,16,14,.55)');g.addColorStop(.75,'rgba(40,34,30,.25)');g.addColorStop(.9,'rgba(220,210,190,.25)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,cr,0,TAU);x.fill();}
  for(let i=0;i<40;i++){x.strokeStyle=`rgba(${r()<.5?'30,26,24':'190,180,165'},${.1+r()*.15})`;x.lineWidth=1+r()*2;x.beginPath();let px=r()*w,py=r()*h;x.moveTo(px,py);for(let k=0;k<6;k++){px+=(r()-.5)*60;py+=(r()-.5)*60;x.lineTo(px,py);}x.stroke();}});}
function rockGeo(seed,det){const g=new THREE.IcosahedronGeometry(1,det);const p=g.attributes.position;const sx=.7+(seed*.37%1)*.6,sy=.6+(seed*.71%1)*.5;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=fbm3(x*1.4+seed,y*1.4,z*1.4,4),n2=fbm3(x*4+seed,y*4,z*4,3);const k=.72+n*.55+n2*.12;p.setXYZ(i,x*k*sx,y*k*sy,z*k);}
 g.computeVertexNormals();smoothNormals(g);g.computeBoundingSphere();return g;}
export class Asteroids{constructor(scene,map,q){this.scene=scene;this.list=[];this.meshes=[];const r=rng(map.seed*31+5);const n=Math.round(map.rocks*[.55,.8,1][q]);
  const mat=new THREE.MeshStandardMaterial({map:rockTex(map.seed),roughness:.93,metalness:.05,color:0xffffff});mat.map.repeat.set(2,2);
  const det=q>=2?4:q?3:2;const geos=[0,1,2,3].map(i=>rockGeo(i*1.7+map.seed,det));const per=[[],[],[],[]];
  const add=(p,rad,big)=>{const v=r()*4|0;const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(r()*TAU,r()*TAU,r()*TAU));const spin=new V(r()-.5,r()-.5,r()-.5).normalize().multiplyScalar((.02+r()*.06)*(big?.3:1));
   const tint=new C().setHSL(.07+r()*.05,.12+r()*.12,.32+r()*.22);this.list.push({p,r:rad*.82,rad,v,q,spin,tint});per[v].push(this.list.length-1);};
  // belt across the middle of the battlefield + big cover rocks + clusters
  for(let i=0;i<n;i++){let p;if(map.belt){const x=(r()*2-1)*4200,z=(r()*2-1)*(900+r()*500),y=(r()*2-1)*(380+Math.abs(x)*.12);p=new V(x,y,z);}
   else{const c=[[-1400,200,-300],[1600,-300,500],[200,500,1300],[-500,-400,-1500],[2600,200,-1400],[-2700,-100,1200]][i%6];p=new V(c[0]+(r()*2-1)*650,c[1]+(r()*2-1)*420,c[2]+(r()*2-1)*650);}
   const big=r()<.1;const rad=big?60+r()*90:6+Math.pow(r(),2.2)*45;let ok=true;for(const a of this.list)if(a.p.distanceTo(p)<a.rad+rad+8){ok=false;break;}if(ok)add(p,rad,big);}
  // a few giant anchor rocks for cover
  for(const c of(map.belt?[[-900,40,-120],[1250,-60,260],[150,120,-420]]:[[-1400,200,-300],[1600,-300,500]])){add(new V(...c),190+r()*60,true);}
  const dummy=new THREE.Object3D();
  for(let v=0;v<4;v++){const ids=per[v];if(!ids.length)continue;const m=new THREE.InstancedMesh(geos[v],mat,ids.length);m.castShadow=q>=2;m.receiveShadow=q>=2;
   ids.forEach((id,k)=>{const a=this.list[id];a.mesh=m;a.k=k;dummy.position.copy(a.p);dummy.quaternion.copy(a.q);dummy.scale.setScalar(a.rad);dummy.updateMatrix();m.setMatrixAt(k,dummy.matrix);m.setColorAt(k,a.tint);});
   m.instanceColor.needsUpdate=true;m.frustumCulled=false;scene.add(m);this.meshes.push(m);}
  // spatial hash for collision queries
  this.cell=260;this.grid=new Map();this.list.forEach((a,i)=>{const c=this.cell,r0=Math.ceil(a.rad/c);const X=Math.floor(a.p.x/c),Y=Math.floor(a.p.y/c),Z=Math.floor(a.p.z/c);
   for(let x=X-r0;x<=X+r0;x++)for(let y=Y-r0;y<=Y+r0;y++)for(let z=Z-r0;z<=Z+r0;z++){const k=x+','+y+','+z;let l=this.grid.get(k);if(!l)this.grid.set(k,l=[]);l.push(a);}});
  this._d=dummy;this.spinT=0;}
 near(p){return this.grid.get(Math.floor(p.x/this.cell)+','+Math.floor(p.y/this.cell)+','+Math.floor(p.z/this.cell))||EMPTY;}
 // first asteroid hit by a segment a->b (returns {a,t})
 seg(ax,ay,az,bx,by,bz){const l=this.grid.get(Math.floor(bx/this.cell)+','+Math.floor(by/this.cell)+','+Math.floor(bz/this.cell));if(!l)return null;
  for(const r of l){const dx=r.p.x-ax,dy=r.p.y-ay,dz=r.p.z-az,sx=bx-ax,sy=by-ay,sz=bz-az,sl=sx*sx+sy*sy+sz*sz||1;let t=(dx*sx+dy*sy+dz*sz)/sl;t=t<0?0:t>1?1:t;const ex=ax+sx*t-r.p.x,ey=ay+sy*t-r.p.y,ez=az+sz*t-r.p.z;if(ex*ex+ey*ey+ez*ez<r.r*r.r)return{a:r,t};}return null;}
 update(dt){// slow tumble of the small rocks (cheap: a slice per frame)
  this.spinT+=dt;const n=this.list.length,d=this._d,dirty=new Set();const step=Math.ceil(n/6);const s0=(this.si=(this.si||0)+1)%6;
  for(let i=s0*step;i<Math.min(n,(s0+1)*step);i++){const a=this.list[i];if(a.rad>50)continue;a.q.multiply(_qs.setFromAxisAngle(_ax.copy(a.spin).normalize(),a.spin.length()*dt*6));d.position.copy(a.p);d.quaternion.copy(a.q);d.scale.setScalar(a.rad);d.updateMatrix();a.mesh.setMatrixAt(a.k,d.matrix);dirty.add(a.mesh);}
  for(const m of dirty)m.instanceMatrix.needsUpdate=true;}}
const EMPTY=[],_qs=new THREE.Quaternion(),_ax=new V();

/* ================= speed dust: short streaks wrapping around the camera ================= */
export class Dust{constructor(scene,n=700){this.n=n;this.box=360;this.base=new Float32Array(n*3);for(let i=0;i<n*3;i++)this.base[i]=Math.random()*this.box;
  this.pos=new Float32Array(n*6);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));
  const col=new Float32Array(n*6);for(let i=0;i<n;i++){const b=.25+Math.random()*.5;col.set([b,b,b*1.1,0,0,0],i*6);}g.setAttribute('color',new THREE.BufferAttribute(col,3));
  this.mesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.8}));this.mesh.frustumCulled=false;scene.add(this.mesh);}
 update(cam,vel){const B=this.box,h=B/2,cx=cam.position.x,cy=cam.position.y,cz=cam.position.z,k=.06,sp=vel.length();const vx=vel.x*k,vy=vel.y*k,vz=vel.z*k;
  const m=(a,c)=>{let r=(a-c+h)%B;if(r<0)r+=B;return r-h+c;};const fade=Math.min(1,sp/40);this.mesh.material.opacity=.15+.65*fade;
  for(let i=0;i<this.n;i++){const x=m(this.base[i*3],cx),y=m(this.base[i*3+1],cy),z=m(this.base[i*3+2],cz);this.pos[i*6]=x;this.pos[i*6+1]=y;this.pos[i*6+2]=z;this.pos[i*6+3]=x-vx-.05;this.pos[i*6+4]=y-vy;this.pos[i*6+5]=z-vz;}
  this.mesh.geometry.attributes.position.needsUpdate=true;}}
