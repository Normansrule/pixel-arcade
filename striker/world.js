// STRIKER 11 — stadium: sky, lights, striped pitch + line geometry, goals with cloth nets, corner flags,
// LED boards, tiered bowl with instanced animated crowd, roofs, floodlight towers, dugouts and big screens.
import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {P,R} from './physics.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a;
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
export function makeEnv(R2,night){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{n:{value:night?1:0}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float n;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 day=mix(vec3(.18,.22,.14),vec3(.55,.7,.95),smoothstep(-.1,.4,h));vec3 nt=mix(vec3(.04,.06,.04),vec3(.04,.05,.1),smoothstep(-.1,.4,h));gl_FragColor=vec4(mix(day,nt,n),1.);}'})));
 const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(night?12:6,night?11.5:6,night?10:5.5),side:THREE.DoubleSide});
 for(const[x,z]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(18,8),lm);m.position.set(x*50,45,z*60);m.lookAt(0,0,0);s.add(m);}
 const pm=new THREE.PMREMGenerator(R2);const rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}

// rounded-rectangle perimeter at half sizes (a,b) + offset `off`, corner radius rc; points carry outward normals
function perimeter(a,b,rc,off,step){const pts=[],cx=a-rc,cz=b-rc,r=rc+off;let u=0,last=null;
 const add=(x,z,ox,oz)=>{if(last)u+=Math.hypot(x-last.x,z-last.z);last={x,z,ox,oz,u};pts.push(last);};
 const line=(x0,z0,x1,z1,ox,oz)=>{const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,z1-z0)/step));for(let i=0;i<n;i++){const t=i/n;add(x0+(x1-x0)*t,z0+(z1-z0)*t,ox,oz);}};
 const arc=(ccx,ccz,a0)=>{const n=Math.max(3,Math.ceil(r*Math.PI/2/step));for(let i=0;i<n;i++){const t=a0+i/n*Math.PI/2;add(ccx+Math.cos(t)*r,ccz+Math.sin(t)*r,Math.cos(t),Math.sin(t));}};
 line(a+off,-cz,a+off,cz,1,0);arc(cx,cz,0);line(cx,b+off,-cx,b+off,0,1);arc(-cx,cz,Math.PI/2);line(-(a+off),cz,-(a+off),-cz,-1,0);arc(-cx,-cz,Math.PI);line(-cx,-(b+off),cx,-(b+off),0,-1);arc(cx,-cz,Math.PI*1.5);
 const f=pts[0];add(f.x,f.z,f.ox,f.oz);return pts;}
function sweep(per,prof,skip,tint){const nP=prof.length,pos=[],uv=[],col=[],idx=[];
 for(const p of per)for(const q of prof){pos.push(p.x+p.ox*q.s,q.y,p.z+p.oz*q.s);uv.push(p.u/4,q.v);if(tint){const c=tint(p,q);col.push(c.r,c.g,c.b);}}
 for(let i=0;i<per.length-1;i++)for(let j=0;j<nP-1;j++){if(skip&&skip(per[i],per[i+1],prof[j]))continue;const a=i*nP+j,b=a+nP;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(tint)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function mergeG(list){const gs=list.map(([g,m])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));return r;}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));

/* ---------- cloth net (roof + back) ---------- */
class NetCloth{constructor(side,tex){this.s=side;const nu=26,nr=6,nb=10,nv=nr+nb;this.nu=nu;this.nv=nv;const L=P.L,GW=P.GW,GH=P.GH,GD=P.GD;
  const prof=[];for(let j=0;j<=nr;j++){const t=j/nr;prof.push([GH-t*.18,L+t*GD]);}for(let j=1;j<nb;j++){const t=j/(nb-1);prof.push([(GH-.18)*(1-t),L+GD]);}
  this.n=nu*prof.length;this.nvv=prof.length;this.p=new Float32Array(this.n*3);this.o=new Float32Array(this.n*3);this.rest=new Float32Array(this.n*3);this.pin=new Uint8Array(this.n);
  const uv=[],idx=[];let arc=0,lastP=null;for(let j=0;j<prof.length;j++){const[y,z]=prof[j];if(lastP)arc+=Math.hypot(y-lastP[0],z-lastP[1]);lastP=prof[j];
   for(let i=0;i<nu;i++){const k=j*nu+i,x=-GW+2*GW*i/(nu-1);this.p[k*3]=x;this.p[k*3+1]=y;this.p[k*3+2]=side*z;uv.push(x/.16,arc/.16);if(j===0||j===prof.length-1||i===0||i===nu-1)this.pin[k]=1;}}
  this.rest.set(this.p);this.o.set(this.p);
  for(let j=0;j<prof.length-1;j++)for(let i=0;i<nu-1;i++){const a=j*nu+i,b=a+nu;idx.push(a,b,a+1,a+1,b,b+1);}
  const g=new THREE.BufferGeometry();this.attr=new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage);g.setAttribute('position',this.attr);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  this.mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:tex,alphaTest:.35,side:THREE.DoubleSide,roughness:.9,color:0xf4f4f4}));this.mesh.frustumCulled=false;
  // constraints: horizontal + vertical neighbours
  this.c=[];const nvv=prof.length;for(let j=0;j<nvv;j++)for(let i=0;i<nu;i++){const k=j*nu+i;if(i<nu-1)this.c.push(k,k+1,this.d(k,k+1));if(j<nvv-1)this.c.push(k,k+nu,this.d(k,k+nu));}
  this.active=0;}
 d(a,b){const p=this.p;return Math.hypot(p[a*3]-p[b*3],p[a*3+1]-p[b*3+1],p[a*3+2]-p[b*3+2]);}
 kick(hp,v,str){// impulse to nodes near the hit point along the ball velocity
  const p=this.p,o=this.o;for(let k=0;k<this.n;k++){if(this.pin[k])continue;const dx=p[k*3]-hp.x,dy=p[k*3+1]-hp.y,dz=p[k*3+2]-hp.z,d2=dx*dx+dy*dy+dz*dz;if(d2>2.2)continue;const f=Math.exp(-d2*2.2)*str*.016;o[k*3]-=v.x*f;o[k*3+1]-=v.y*f*.6;o[k*3+2]-=v.z*f;}this.active=3;}
 step(dt,ball){const p=this.p,o=this.o,near=Math.abs(ball.z-this.s*(P.L+P.GD*.5))<P.GD&&Math.abs(ball.x)<P.GW+.5&&ball.y<P.GH+.5;if(near)this.active=3;if(this.active<=0)return;this.active-=dt;
  const dt2=dt*dt;for(let k=0;k<this.n;k++){if(this.pin[k])continue;const i=k*3;for(let a=0;a<3;a++){const x=p[i+a],vv=(x-o[i+a])*.93;o[i+a]=x;p[i+a]=x+vv+(a===1?-2.5*dt2:0);}
   // gentle pull back to the rest shape so the net keeps its form
   p[i]+=(this.rest[i]-p[i])*.02;p[i+1]+=(this.rest[i+1]-p[i+1])*.02;p[i+2]+=(this.rest[i+2]-p[i+2])*.02;}
  const c=this.c;for(let it=0;it<3;it++){for(let q=0;q<c.length;q+=3){const a=c[q]*3,b=c[q+1]*3,rl=c[q+2];const dx=p[b]-p[a],dy=p[b+1]-p[a+1],dz=p[b+2]-p[a+2],d=Math.hypot(dx,dy,dz)||1e-6;if(d<=rl)continue;const f=(d-rl)/d*.5;
    const pa=this.pin[c[q]],pb=this.pin[c[q+1]];if(!pa&&!pb){p[a]+=dx*f;p[a+1]+=dy*f;p[a+2]+=dz*f;p[b]-=dx*f;p[b+1]-=dy*f;p[b+2]-=dz*f;}else if(!pa){p[a]+=dx*f*2;p[a+1]+=dy*f*2;p[a+2]+=dz*f*2;}else if(!pb){p[b]-=dx*f*2;p[b+1]-=dy*f*2;p[b+2]-=dz*f*2;}}
   if(near){const rr=R+.05;for(let k=0;k<this.n;k++){if(this.pin[k])continue;const i=k*3,dx=p[i]-ball.x,dy=p[i+1]-ball.y,dz=p[i+2]-ball.z,d2=dx*dx+dy*dy+dz*dz;if(d2<rr*rr){const d=Math.sqrt(d2)||1e-4,f=(rr-d)/d;p[i]+=dx*f;p[i+1]+=dy*f;p[i+2]+=dz*f;}}}}
  this.attr.needsUpdate=true;}}

/* ---------- the whole venue ---------- */
export function buildWorld(scene,o){// o: {night, crowd(0..1), kits:[home,away], name}
 const G=new THREE.Group();scene.add(G);const out={group:G,nets:[],time:{value:0},hypeH:{value:0},hypeA:{value:0},hype:{value:0},flags:[],screens:[]};
 const L=P.L,W=P.W,night=o.night;
 // ----- sky -----
 if(night){G.add(new THREE.Mesh(new THREE.SphereGeometry(1800,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.09,.08,.13),vec3(.01,.015,.04),smoothstep(0.,.5,h));c+=vec3(.16,.09,.05)*exp(-h*h*80.);gl_FragColor=vec4(c,1.);}'})));
  const p=[];for(let i=0;i<1400;i++){const a=rnd(6.283),e=Math.asin(.12+rnd(.88)),r=1700;p.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  G.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xcfd8ff,size:1.4,fog:false,sizeAttenuation:false,transparent:true,opacity:.7})));}
 else{const sky=new Sky();sky.scale.setScalar(3000);const u=sky.material.uniforms;u.turbidity.value=5;u.rayleigh.value=1.4;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.82;
  out.sun=new V().setFromSphericalCoords(1,THREE.MathUtils.degToRad(52),THREE.MathUtils.degToRad(68));u.sunPosition.value.copy(out.sun);G.add(sky);}
 // ----- lights -----
 const hemi=new THREE.HemisphereLight(night?0x9fb0d8:0xcfe2ff,night?0x1c2a1a:0x4a5a32,night?.55:.75);G.add(hemi);
 const key=new THREE.DirectionalLight(night?0xf2f5ff:0xfff0dc,night?2.5:3.1);
 if(night)key.position.set(18,95,24);else key.position.copy(out.sun).multiplyScalar(160);
 key.castShadow=true;const ext=night?Math.max(W,L)+12:Math.max(W,L)+52;Object.assign(key.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:10,far:420});key.shadow.bias=-.0004;key.shadow.normalBias=.03;
 G.add(key,key.target);out.key=key;
 if(night){const f=new THREE.DirectionalLight(0xc8d4ff,.7);f.position.set(-40,60,-50);G.add(f);const f2=new THREE.DirectionalLight(0xfff0e0,.45);f2.position.set(50,50,-60);G.add(f2);}
 else{const f=new THREE.DirectionalLight(0xbfd4ff,.35);f.position.set(-50,40,-30);G.add(f);}
 // ----- pitch -----
 const a=W+7,b=L+8;// grass extends to the stand fronts
 const stripes=ctex(64,1024,(x,w,h)=>{const n=P.size===5?10:18,band=h/(n);for(let i=0;i<n;i++){x.fillStyle=i%2?(night?'#2f7a34':'#3a8a3a'):(night?'#287030':'#317d33');x.fillRect(0,i*band,w,band+1);}
  for(let i=0;i<3000;i++){x.fillStyle=`rgba(${rnd()<.5?'20,40,10':'120,160,60'},${rnd(.05)})`;x.fillRect(rnd(w),rnd(h),1,2);}},{});
 stripes.wrapS=THREE.ClampToEdgeWrapping;stripes.wrapT=THREE.ClampToEdgeWrapping;
 const detail=ctex(256,256,(x,w,h)=>{const id=x.createImageData(w,h);for(let i=0;i<w*h;i++){const v=150+rnd(105)|0;id.data[i*4]=v;id.data[i*4+1]=v;id.data[i*4+2]=v;id.data[i*4+3]=255;}x.putImageData(id,0,0);},{srgb:false});
 const wear=ctex(256,512,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);const blob=(cx,cy,rx,ry,al)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,1);g.addColorStop(0,`rgba(255,255,255,${al})`);g.addColorStop(1,'rgba(255,255,255,0)');x.save();x.translate(cx,cy);x.scale(rx,ry);x.translate(-cx,-cy);x.fillStyle=g;x.beginPath();x.arc(cx,cy,1,0,7);x.fill();x.restore();};
  const ex=w/(2*a),ez=h/(2*b);for(const s of[-1,1]){blob(w/2,h/2+s*L*ez,P.GW*2.2*ex,P.SD*1.4*ez,.75);blob(w/2,h/2+s*(L-P.SPOT)*ez,2*ex,2*ez,.6);}blob(w/2,h/2,3*ex,3*ez,.35);
  for(let i=0;i<60;i++)blob(w/2+(rnd()-.5)*w*.6,h/2+(rnd()-.5)*h*.8,rnd(12),rnd(18),.12);},{srgb:false,clamp:true});
 const grassM=new THREE.MeshStandardMaterial({map:stripes,roughness:.93,metalness:0,envMapIntensity:.35});
 grassM.onBeforeCompile=sh=>{sh.uniforms.tDet={value:detail};sh.uniforms.tWear={value:wear};sh.uniforms.uRep={value:new THREE.Vector2(a*2/1.1,b*2/1.1)};
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tDet,tWear;uniform vec2 uRep;')
   .replace('#include <map_fragment>',`#include <map_fragment>
   float d1=texture2D(tDet,vMapUv*uRep).r,d2=texture2D(tDet,vMapUv*uRep*.13+.37).r,d3=texture2D(tDet,vMapUv*uRep*3.1).r;
   diffuseColor.rgb*=.78+.22*d1*.6+.25*d2*.5+d3*.08;float wr=texture2D(tWear,vMapUv).r;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.36,.32,.2)*(.7+.4*d1),wr*.55);`);};
 grassM.customProgramCacheKey=()=>'grass';
 const grass=new THREE.Mesh(new THREE.PlaneGeometry(2*a,2*b),grassM);grass.rotation.x=-Math.PI/2;grass.rotation.z=0;grass.receiveShadow=true;G.add(grass);
 const under=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshStandardMaterial({color:night?0x0a0b0e:0x3b3d3a,roughness:1}));under.rotation.x=-Math.PI/2;under.position.y=-.05;G.add(under);
 // ----- lines (geometry: crisp at any zoom) -----
 {const lw=.12,q=[];const quad=(x0,z0,x1,z1)=>{const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz),nx=-dz/l*lw/2,nz=dx/l*lw/2;q.push(x0+nx,z0+nz,x1+nx,z1+nz,x1-nx,z1-nz,x0+nx,z0+nz,x1-nx,z1-nz,x0-nx,z0-nz);};
  const arc=(cx,cz,r,a0,a1,clip)=>{const n=Math.max(8,Math.ceil(Math.abs(a1-a0)*r/.5));for(let i=0;i<n;i++){const t0=a0+(a1-a0)*i/n,t1=a0+(a1-a0)*(i+1)/n;if(clip&&!clip(cx+Math.cos(t0)*r,cz+Math.sin(t0)*r))continue;
   const ri=Math.max(0,r-lw/2),ro=r+lw/2,c0=Math.cos(t0),s0=Math.sin(t0),c1=Math.cos(t1),s1=Math.sin(t1);
   q.push(cx+c0*ri,cz+s0*ri,cx+c1*ro,cz+s1*ro,cx+c1*ri,cz+s1*ri,cx+c0*ri,cz+s0*ri,cx+c0*ro,cz+s0*ro,cx+c1*ro,cz+s1*ro);}};
  const rect=(x0,z0,x1,z1)=>{quad(x0,z0,x1,z0);quad(x1,z0,x1,z1);quad(x1,z1,x0,z1);quad(x0,z1,x0,z0);};
  rect(-W,-L,W,L);quad(-W,0,W,0);arc(0,0,P.CR,0,Math.PI*2);arc(0,0,.18,0,Math.PI*2);arc(0,0,.09,0,Math.PI*2);
  for(const s of[-1,1]){const gl=s*L;quad(-P.BW,gl,-P.BW,gl-s*P.BD);quad(-P.BW,gl-s*P.BD,P.BW,gl-s*P.BD);quad(P.BW,gl-s*P.BD,P.BW,gl);
   quad(-P.SW,gl,-P.SW,gl-s*P.SD);quad(-P.SW,gl-s*P.SD,P.SW,gl-s*P.SD);quad(P.SW,gl-s*P.SD,P.SW,gl);
   const sp=gl-s*P.SPOT;arc(0,sp,.11,0,Math.PI*2);arc(0,sp,.05,0,Math.PI*2);arc(0,sp,P.CR,0,Math.PI*2,(x,z)=>s*(z-(gl-s*P.BD))<-.05);
   for(const sx of[-1,1])arc(sx*W,gl,1,0,Math.PI*2,(x,z)=>Math.abs(x)<=W+.01&&Math.abs(z)<=L+.01);}
  const pos=[];for(let i=0;i<q.length;i+=6){let[x0,z0,x1,z1,x2,z2]=q.slice(i,i+6);if((x1-x0)*(z2-z0)-(z1-z0)*(x2-x0)>0){[x1,z1,x2,z2]=[x2,z2,x1,z1];}pos.push(x0,.012,z0,x1,.012,z1,x2,.012,z2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const nrm=new Float32Array(pos.length);for(let i=1;i<nrm.length;i+=3)nrm[i]=1;g.setAttribute('normal',new THREE.BufferAttribute(nrm,3));
  const lm=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:night?0xb8bcb8:0xf0f2ee,roughness:.85,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));lm.receiveShadow=true;G.add(lm);}
 // ----- goals -----
 const netTex=ctex(32,32,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#fff';x.fillRect(0,0,w,3);x.fillRect(0,0,3,h);},{});netTex.magFilter=THREE.LinearFilter;
 const postM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3,metalness:.1,envMapIntensity:.8});const barM=new THREE.MeshStandardMaterial({color:0xb8bcc4,roughness:.5,metalness:.6});
 for(const s of[-1,1]){const z=s*L,GW=P.GW,GH=P.GH,GD=P.GD,pr=.065;
  const pg=mergeG([[new THREE.CylinderGeometry(pr,pr,GH+pr,14),M4(-GW,(GH+pr)/2,z)],[new THREE.CylinderGeometry(pr,pr,GH+pr,14),M4(GW,(GH+pr)/2,z)],[new THREE.CylinderGeometry(pr,pr,2*GW+pr*2,14),M4(0,GH,z,0,0,Math.PI/2)]]);
  const post=new THREE.Mesh(pg,postM);post.castShadow=true;G.add(post);
  const bg=mergeG([[new THREE.CylinderGeometry(.03,.03,Math.hypot(GD,.18),6),M4(-GW,GH-.09,z+s*GD/2,s*Math.PI/2-Math.atan2(.18,GD)*s)],[new THREE.CylinderGeometry(.03,.03,Math.hypot(GD,.18),6),M4(GW,GH-.09,z+s*GD/2,s*Math.PI/2-Math.atan2(.18,GD)*s)],
   [new THREE.CylinderGeometry(.03,.03,GH-.18,6),M4(-GW,(GH-.18)/2,z+s*GD)],[new THREE.CylinderGeometry(.03,.03,GH-.18,6),M4(GW,(GH-.18)/2,z+s*GD)],[new THREE.CylinderGeometry(.03,.03,2*GW,6),M4(0,.03,z+s*GD,0,0,Math.PI/2)],
   [new THREE.CylinderGeometry(.03,.03,GD,6),M4(-GW,.03,z+s*GD/2,Math.PI/2)],[new THREE.CylinderGeometry(.03,.03,GD,6),M4(GW,.03,z+s*GD/2,Math.PI/2)]]);G.add(new THREE.Mesh(bg,barM));
  const cloth=new NetCloth(s,netTex);G.add(cloth.mesh);out.nets.push(cloth);
  // static side nets
  for(const sx of[-1,1]){const sg=new THREE.BufferGeometry();const p=[sx*GW,GH,z,sx*GW,GH-.18,z+s*GD,sx*GW,0,z+s*GD,sx*GW,0,z];sg.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
   sg.setAttribute('uv',new THREE.Float32BufferAttribute([0,GH/.16,GD/.16,(GH-.18)/.16,GD/.16,0,0,0],2));sg.setIndex([0,1,2,0,2,3]);sg.computeVertexNormals();G.add(new THREE.Mesh(sg,cloth.mesh.material));}}
 // ----- corner flags -----
 {const flagM=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uT:out.time,uC:{value:new THREE.Color(night?1.6:1.2,night?.45:.35,0)}},vertexShader:'uniform float uT;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z+=sin(uT*7.+p.x*9.)*.06*uv.x;p.x*=1.-.12*abs(sin(uT*3.));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragmentShader:'uniform vec3 uC;varying vec2 vUv;void main(){gl_FragColor=vec4(uC*(.8+.2*vUv.y),1.);}'});const poleM=new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.5});
  for(const sx of[-1,1])for(const sz of[-1,1]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.55,6),poleM);pole.position.set(sx*W,.775,sz*L);pole.castShadow=true;G.add(pole);
   const fl=new THREE.Mesh(new THREE.PlaneGeometry(.42,.3,6,1),flagM);fl.geometry.translate(.21,0,0);fl.position.set(sx*W,1.38,sz*L);fl.rotation.y=Math.atan2(-sx,-sz)+Math.PI/2;G.add(fl);}}
 // ----- LED advertising boards -----
 {const brands=[['STRIKER 11','#ffffff'],['◆','#ff4d00'],['PIXEL ARCADE','#ffcf3f'],['◆','#2ad1ff'],['VOLTWAVE ENERGY','#9cff6a'],['◆','#ff4d00'],['ORBITAIR','#9ec0ff'],['◆','#ffcf3f'],['KITECORE BOOTS','#ff8fd1'],['◆','#2ad1ff'],['MERIDIAN BANK','#ffffff']];
  const mc=document.createElement('canvas').getContext('2d');mc.font='44px Anton, Impact, sans-serif';const cyc=brands.reduce((s,[t])=>s+mc.measureText(t).width+34,0);const AW=Math.ceil(cyc);
  const ads=ctex(AW,64,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0c1022');g.addColorStop(1,'#05060c');x.fillStyle=g;x.fillRect(0,0,w,h);x.font='44px Anton, Impact, sans-serif';x.textBaseline='middle';let px=17;
   for(const[t,c]of brands){x.fillStyle=c;x.fillText(t,px,h/2+3);px+=x.measureText(t).width+34;}x.fillStyle='rgba(0,0,0,.3)';for(let i=0;i<w;i+=3)x.fillRect(i,0,1,h);});
  ads.repeat.set(1,1);out.ads=ads;const span=AW/64*.9;const bm=new THREE.MeshBasicMaterial({map:ads,color:new THREE.Color(night?1.12:1,night?1.12:1,night?1.12:1)}),back=new THREE.MeshStandardMaterial({color:0x15171d,roughness:.6});
  const segs=[[-W-3.6,-L-1,-W-3.6,L+1],[W+3.6,-L-1,W+3.6,L+1],[-W+2,-L-4.2,W-2,-L-4.2],[-W+2,L+4.2,W-2,L+4.2]];
  for(const[x0,z0,x1,z1]of segs){const len=Math.hypot(x1-x0,z1-z0),g=new THREE.BoxGeometry(len,.9,.12);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len/span);
   const m=new THREE.Mesh(g,[back,back,back,back,bm,bm]);m.position.set((x0+x1)/2,.45,(z0+z1)/2);m.rotation.y=Math.abs(x1-x0)<1?Math.PI/2:0;m.castShadow=true;G.add(m);}}
 // ----- stands (two tiers) + crowd -----
 const rc=14,N1=P.size===5?12:20,N2=P.size===5?10:16,d1=.85,r1=.42,d2=.85,r2=.6;const prof=[{s:0,y:0,v:0},{s:0,y:1.3,v:.1}];
 for(let i=0;i<N1;i++){prof.push({s:.4+i*d1,y:1.3+i*r1,v:i},{s:.4+i*d1,y:1.3+(i+1)*r1,v:i+.5});}const y1=1.3+N1*r1,s1=.4+N1*d1;
 prof.push({s:s1+1.6,y:y1,v:N1+1},{s:s1+1.6,y:y1+2.6,v:N1+2});const y2=y1+2.6,s2=s1+2.2;for(let i=0;i<N2;i++){prof.push({s:s2+i*d2,y:y2+i*r2,v:N1+3+i},{s:s2+i*d2,y:y2+(i+1)*r2,v:N1+3.5+i});}
 const sTop=s2+N2*d2,yTop=y2+N2*r2;prof.push({s:sTop+.8,y:yTop,v:N1+N2+4},{s:sTop+.8,y:yTop+4,v:N1+N2+5});
 const per=perimeter(a,b,rc,0,3);const near=(p)=>p.x<-a+1&&Math.abs(p.z)<b-rc*.2;
 const seatT=ctex(64,64,(x,w,h)=>{x.fillStyle='#3a3f4a';x.fillRect(0,0,w,h);x.fillStyle='#2a2e36';x.fillRect(0,h*.55,w,h*.45);for(let i=0;i<200;i++){x.fillStyle=`rgba(0,0,0,${rnd(.15)})`;x.fillRect(rnd(w),rnd(h),2,2);}});
 const standM=new THREE.MeshStandardMaterial({color:0x8b93a4,map:seatT,roughness:.85,side:THREE.DoubleSide});
 const stands=new THREE.Mesh(sweep(per,prof),standM);stands.receiveShadow=true;G.add(stands);
 // hospitality boxes band (glowing windows)
 {const win=ctex(256,32,(x,w,h)=>{x.fillStyle='#0b0d12';x.fillRect(0,0,w,h);for(let i=0;i<8;i++){const g=x.createLinearGradient(0,4,0,h-4);g.addColorStop(0,'#ffe3b0');g.addColorStop(1,'#a07040');x.fillStyle=g;x.fillRect(i*32+3,6,26,h-12);}});
  const g=sweep(per,[{s:s1+1.55,y:y1+.2,v:0},{s:s1+1.55,y:y1+2.4,v:1}]);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:win,color:new THREE.Color(night?1.3:.75,night?1.25:.75,night?1.2:.75),side:THREE.DoubleSide}));G.add(m);}
 // roofs (not over the camera gantry side)
 {const rp=[{s:sTop+1,y:yTop+4.2,v:0},{s:8,y:yTop+6.5,v:1}];const g=sweep(per,rp,(p0,p1)=>near(p0)||near(p1));
  const roof=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x3a3e48,roughness:.6,metalness:.5,side:THREE.DoubleSide}));roof.castShadow=!night;roof.receiveShadow=false;G.add(roof);
  const lip=sweep(per,[{s:7.8,y:yTop+6.2,v:0},{s:7.8,y:yTop+6.75,v:1}],(p0,p1)=>near(p0)||near(p1));G.add(new THREE.Mesh(lip,new THREE.MeshBasicMaterial({color:night?new THREE.Color(5,4.8,4.4):new THREE.Color(.85,.86,.9),side:THREE.DoubleSide})));
  // gantry over the near side: a thin truss that the TV cameras sit on
  const gt=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.2,2*b*.55),new THREE.MeshStandardMaterial({color:0x22252c,roughness:.7,metalness:.4}));gt.position.set(-a-sTop*.7,yTop+3,0);G.add(gt);}
 // crowd
 {const geo=crowdGeo();const kits=o.kits;const mat=new THREE.MeshLambertMaterial({color:0xffffff});
  mat.onBeforeCompile=sh=>{sh.uniforms.uT=out.time;sh.uniforms.uH=out.hypeH;sh.uniforms.uA=out.hypeA;sh.uniforms.uN=out.hype;
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uH,uA,uN;attribute float arm;attribute float fan;attribute float head;varying float vHead,vPh;')
    .replace('#include <begin_vertex>',`#include <begin_vertex>
    vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float ph=fract(sin(dot(ip.xz,vec2(12.9898,78.233)))*43758.5453);
    vHead=head;vPh=ph;float hy=fan>1.5?uA:fan>.5?uH:uN*.5;float ex=clamp(hy+uN*.35,0.,1.);
    float jb=max(0.,sin(uT*(5.+ph*4.)+ph*40.));float up=smoothstep(.15,.6,ex)*step(.25,ph+ex*.6);
    float raise=clamp(ex*1.4-ph*.5,0.,1.)*arm*up;transformed.y=mix(transformed.y,1.16-transformed.y,raise);transformed.x*=1.+raise*.2;
    transformed.y+=jb*jb*(.04+ex*.5)*(.5+ph)*up+up*.3;`);
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vHead,vPh;').replace('#include <color_fragment>',`#include <color_fragment>
    if(vHead>.5){float k=fract(vPh*7.31);diffuseColor.rgb=mix(vec3(.93,.72,.56),vec3(.32,.2,.13),k*k);}`);};
  const den=o.crowd??1,pts=[];const ring=(s,y,t,step)=>{for(const p of perimeter(a,b,rc,s,step)){if(rnd()>den*.92)continue;if(near(p)&&y>y2+6)continue;pts.push([p.x+rnd(.15),y,p.z+rnd(.15),Math.atan2(-p.ox,-p.oz),p]);}};
  for(let i=0;i<N1;i++)ring(.4+i*d1+.45,1.3+(i+1)*r1,0,.72);for(let i=0;i<N2;i++)ring(s2+i*d2+.45,y2+(i+1)*r2,1,.72);
  const mesh=new THREE.InstancedMesh(geo,mat,pts.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();const fanA=new Float32Array(pts.length);
  const pal=['#e8e8e8','#2a2a2e','#c8c8d0','#6a6a74','#3d5a8a','#8a3d3d','#d8c060','#5a8a5a','#3a3a44','#b06a3a','#204060'];
  pts.forEach((p,i)=>{q.setFromAxisAngle(new V(0,1,0),p[3]);const s=.92+rnd(.2);m4.compose(new V(p[0],p[1],p[2]),q,new V(s,s*(.9+rnd(.2)),s));mesh.setMatrixAt(i,m4);
   const awayEnd=p[2]>b-2,homeBias=awayEnd?0:.55;const r=rnd();let fan=0;
   if(awayEnd&&r<.7){fan=2;c.set(rnd()<.6?kits[1].c1:kits[1].c2);}else if(r<homeBias){fan=1;c.set(rnd()<.62?kits[0].c1:kits[0].c2);}else c.set(pal[rnd(pal.length)|0]);
   c.multiplyScalar(.75+rnd(.35));mesh.setColorAt(i,c);fanA[i]=fan;});
  geo.setAttribute('fan',new THREE.InstancedBufferAttribute(fanA,1));mesh.frustumCulled=false;G.add(mesh);out.crowd=mesh;out.crowdN=pts.length;
  // phone/camera flashes at night
  if(night){const fp=[],fr=[];for(let i=0;i<600;i++){const p=pts[rnd(pts.length)|0];fp.push(p[0],p[1]+1.3,p[2]);fr.push(rnd());}
   const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('ph',new THREE.Float32BufferAttribute(fr,1));
   G.add(new THREE.Points(fg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:out.time,uN:out.hype},
    vertexShader:'attribute float ph;uniform float uT,uN;varying float vA;void main(){float t=fract(uT*(.12+ph*.2+uN*.5)+ph*7.);vA=smoothstep(.975,1.,t);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=vA*1600./-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(3.)*vA*smoothstep(.5,0.,d),1.);}'})));}}
 // ----- floodlight towers -----
 {const towerM=new THREE.MeshStandardMaterial({color:0x2a2e38,roughness:.6,metalness:.6});
  const lampT=ctex(256,128,(x,w,h)=>{x.fillStyle='#111';x.fillRect(0,0,w,h);for(let i=0;i<8;i++)for(let j=0;j<4;j++){const g=x.createRadialGradient(16+i*32,16+j*32,1,16+i*32,16+j*32,14);g.addColorStop(0,'#fff');g.addColorStop(.6,'#fff6e0');g.addColorStop(1,'#333');x.fillStyle=g;x.fillRect(i*32+2,j*32+2,28,28);}});
  const lampM=new THREE.MeshBasicMaterial({map:lampT,color:night?new THREE.Color(7,6.6,6):new THREE.Color(.5,.5,.5)});
  const glowT=ctex(128,128,(x)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,250,235,1)');g.addColorStop(.2,'rgba(255,240,210,.4)');g.addColorStop(1,'rgba(255,240,210,0)');x.fillStyle=g;x.fillRect(0,0,128,128);},{clamp:true});
  const H=yTop+34;for(const[sx,sz]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const x=sx*(a+sTop*.62+6),z=sz*(b+sTop*.62+6),g=new THREE.Group();g.position.set(x,0,z);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.9,2.2,H,8),towerM);pole.position.y=H/2;g.add(pole);
   const head=new THREE.Group();head.position.y=H+2;head.add(new THREE.Mesh(new THREE.BoxGeometry(22,12,1.6),towerM));const lamp=new THREE.Mesh(new THREE.PlaneGeometry(20,10),lampM);lamp.position.z=.85;head.add(lamp);g.add(head);
   head.lookAt(new V(-x*.4,-H*.9,-z*.4).add(new V(x,H,z)));
   if(night){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:0xfff2dd,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.85,fog:false}));sp.scale.set(58,58,1);sp.position.set(0,H+2,0);g.add(sp);}G.add(g);}}
 // ----- big screens on the end roofs -----
 {const jc=document.createElement('canvas');jc.width=512;jc.height=192;const jt=new THREE.CanvasTexture(jc);jt.colorSpace=THREE.SRGBColorSpace;out.screen={c:jc,t:jt};
  const fm=new THREE.MeshStandardMaterial({color:0x20232a,roughness:.6,metalness:.5});
  for(const sz of[-1,1]){const g=new THREE.Group();g.position.set(0,yTop+12,sz*(b+sTop-2));g.lookAt(0,yTop*.4,0);g.add(new THREE.Mesh(new THREE.BoxGeometry(26,10,1.2),fm));
   const sc=new THREE.Mesh(new THREE.PlaneGeometry(24.5,8.8),new THREE.MeshBasicMaterial({map:jt,color:new THREE.Color(night?1.4:1.1,night?1.4:1.1,night?1.4:1.1)}));sc.position.z=.65;g.add(sc);G.add(g);}}
 // ----- dugouts on the far touchline -----
 {const shell=new THREE.MeshStandardMaterial({color:0x1d2028,roughness:.5,metalness:.3}),glass=new THREE.MeshStandardMaterial({color:0x8fb0d0,transparent:true,opacity:.28,roughness:.05,metalness:.2});
  for(const s of[-1,1]){const g=new THREE.Group();g.position.set(W+5.4,0,s*(P.size===5?5:9));g.add(new THREE.Mesh(new THREE.BoxGeometry(1.6,2.2,7),shell).translateX(.7).translateY(1.1));
   const roof=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,7,16,1,true,0,Math.PI/2),glass);roof.rotation.x=Math.PI/2;roof.rotation.z=Math.PI/2;roof.position.set(-.1,1.9,0);roof.scale.set(1,1,.9);g.add(roof);
   g.add(new THREE.Mesh(new THREE.BoxGeometry(.8,.5,6.4),new THREE.MeshStandardMaterial({color:s<0?o.kits[0].c1:o.kits[1].c1,roughness:.6})).translateX(.2).translateY(.5));G.add(g);}}
 out.yTop=yTop;out.sTop=sTop;out.a=a;out.b=b;
 out.update=(dt,ball)=>{out.time.value+=dt;if(out.ads)out.ads.offset.x=(out.time.value*.02)%1;for(const n of out.nets)n.step(Math.min(dt,1/30),ball);};
 out.dispose=()=>{scene.remove(G);G.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});};
 return out;}
// spectator: torso + head + two arms (arm vertices tagged so the shader can raise them)
function crowdGeo(){const parts=[[new THREE.BoxGeometry(.46,.5,.3),M4(0,.3,0),0,0],[new THREE.BoxGeometry(.21,.23,.21),M4(0,.68,.02),0,1],[new THREE.BoxGeometry(.1,.4,.1),M4(.29,.38,0),1,0],[new THREE.BoxGeometry(.1,.4,.1),M4(-.29,.38,0),1,0]];
 const gs=parts.map(([g,m,a,h])=>{g=g.toNonIndexed();g.applyMatrix4(m);const c=g.attributes.position.count;g.setAttribute('arm',new THREE.Float32BufferAttribute(new Float32Array(c).fill(a),1));g.setAttribute('head',new THREE.Float32BufferAttribute(new Float32Array(c).fill(h),1));return g;});
 let n=0;gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),arm=new Float32Array(n),hd=new Float32Array(n);let o=0;
 for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);arm.set(g.attributes.arm.array,o);hd.set(g.attributes.head.array,o);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('arm',new THREE.BufferAttribute(arm,1));r.setAttribute('head',new THREE.BufferAttribute(hd,1));return r;}
