// KART GRAND PRIX — shared helpers: canvas textures, geometry merging, noise, particles, item icons.
import * as THREE from '../vendor/three.module.min.js';
export const V=THREE.Vector3;
export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const wrapA=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
export function rng(seed=1){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}

// value noise + fbm (deterministic)
const P=new Uint8Array(512);{const r=rng(1337),p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=r()*(i+1)|0;[p[i],p[j]]=[p[j],p[i]];}for(let i=0;i<512;i++)P[i]=p[i&255];}
const fade=t=>t*t*(3-2*t);
export function noise2(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,X=xi&255,Z=zi&255;
 const h=(a,b)=>P[P[a]+b]/255;const u=fade(xf),v=fade(zf);
 return lerp(lerp(h(X,Z),h(X+1,Z),u),lerp(h(X,Z+1),h(X+1,Z+1),u),v)*2-1;}
export function fbm(x,z,o=4){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=noise2(x*f,z*f)*a;a*=.5;f*=2.03;}return s;}

// merge [geometry, matrix?, color?] entries into one non-indexed geometry with vertex colors
const _m=new THREE.Matrix4();
export function merge(list){const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c!==undefined&&g.userData.c!==null){const c=new THREE.Color(g.userData.c);for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.setAttribute('color',new THREE.BufferAttribute(col,3));
 out.computeBoundingSphere();out.computeBoundingBox();return out;}
// matrix helper: T(x,y,z, rx,ry,rz, sx,sy,sz)
export function M(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx){return new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));}
// jitter vertices for organic shapes
export function lumpy(g,amt,seed=1){g=g.index?g.toNonIndexed():g;const p=g.attributes.position,r=rng(seed),cache=new Map();for(let i=0;i<p.count;i++){const k=`${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;let d=cache.get(k);if(!d){d=[(r()-.5)*amt,(r()-.5)*amt,(r()-.5)*amt];cache.set(k,d);}p.setXYZ(i,p.getX(i)+d[0],p.getY(i)+d[1],p.getZ(i)+d[2]);}g.computeVertexNormals();return g;}

/* ---------- particles: additive sparks + alpha smoke/dust ---------- */
export class Particles{
 constructor(scene,n=4000,additive=true){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.grow=new Float32Array(n);this.i=0;this.live=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('pc',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 pc;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=pc;vC.a*=smoothstep(.4,2.5,-mv.z);gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}'
    :'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.15,d)*vC.a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb,a);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?5:4;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.grow[i]=grow;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){dx=dx*(o.spread??.6)+o.dir.x;dy=dy*(o.spread??.6)+o.dir.y;dz=dz*(o.spread??.6)+o.dir.z;}if(o.up)dy=Math.abs(dy);const s=speed*(.35+Math.random()*.65);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.grow??0);}}
 clear(){this.life.fill(0);this.s.fill(0);}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,grow}=this,add=this.add;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0){s[i]=0;c[i*4+3]=0;}continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(add){const f=k*k;c[i*4]=oc[i*3]*f;c[i*4+1]=oc[i*3+1]*f;c[i*4+2]=oc[i*3+2]*f;c[i*4+3]=1;s[i]=os[i]*(.4+.6*k);}
   else{c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=Math.min(1,(1-k)*6)*k*.85;s[i]=os[i]*(1+(1-k)*grow[i]);}}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.pc.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

/* ---------- skid marks: a ring buffer of quads on the ground ---------- */
export class Skids{
 constructor(scene,n=1400){this.n=n;this.i=0;this.pos=new Float32Array(n*4*3);this.a=new Float32Array(n*4);const idx=[];for(let i=0;i<n;i++){const o=i*4;idx.push(o,o+1,o+2,o+1,o+3,o+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('alpha',new THREE.BufferAttribute(this.a,1).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.mesh=new THREE.Mesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,uniforms:{uC:{value:new THREE.Color(0x111114)}},
   vertexShader:'attribute float alpha;varying float vA;void main(){vA=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 uC;varying float vA;void main(){gl_FragColor=vec4(uC,vA*.55);}'}));
  this.mesh.frustumCulled=false;scene.add(this.mesh);this.dirty=false;}
 add(a,b,pa,pb,w,alpha=1){// segment from pa to pb (previous and current wheel contact), width w
  const dx=pb.x-pa.x,dz=pb.z-pa.z,l=Math.hypot(dx,dz);if(l<.05||l>4)return;const nx=-dz/l*w,nz=dx/l*w,o=this.i*12,P=this.pos;
  P.set([pa.x+nx,pa.y+.04,pa.z+nz,pa.x-nx,pa.y+.04,pa.z-nz,pb.x+nx,pb.y+.04,pb.z+nz,pb.x-nx,pb.y+.04,pb.z-nz],o);this.a.fill(alpha,this.i*4,this.i*4+4);this.i=(this.i+1)%this.n;this.dirty=true;}
 clear(){this.pos.fill(0);this.a.fill(0);this.dirty=true;}
 update(){if(!this.dirty)return;this.dirty=false;const g=this.mesh.geometry;g.attributes.position.needsUpdate=g.attributes.alpha.needsUpdate=true;}}

/* ---------- 2D item icons for the HUD roulette ---------- */
const ICON={};
export function icon(id,size=96){const k=id+size;if(ICON[k])return ICON[k];const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),s=size/96;x.scale(s,s);x.lineJoin='round';x.lineCap='round';
 const orb=(cx,cy,r,c1,c2)=>{const g=x.createRadialGradient(cx-r*.35,cy-r*.4,r*.1,cx,cy,r);g.addColorStop(0,'#fff');g.addColorStop(.25,c1);g.addColorStop(1,c2);x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=3;x.stroke();};
 switch(id){
  case'coin':{const g=x.createLinearGradient(20,20,76,76);g.addColorStop(0,'#fff3a0');g.addColorStop(.5,'#ffc21a');g.addColorStop(1,'#c07800');x.fillStyle=g;x.beginPath();x.ellipse(48,48,28,32,0,0,7);x.fill();x.strokeStyle='#8a5200';x.lineWidth=4;x.stroke();x.strokeStyle='#fff8c8';x.lineWidth=5;x.beginPath();x.moveTo(48,30);x.lineTo(48,66);x.stroke();break;}
  case'peel':{x.fillStyle='#ffd83a';x.strokeStyle='#7a5a00';x.lineWidth=3;for(const a of[-1.9,-.6,.7]){x.save();x.translate(48,58);x.rotate(a);x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(14,-14,4,-34);x.quadraticCurveTo(-6,-16,0,0);x.fill();x.stroke();x.restore();}x.fillStyle='#fff3b0';x.beginPath();x.arc(48,58,9,0,7);x.fill();x.stroke();x.fillStyle='#5a3a10';x.fillRect(45,62,6,14);break;}
  case'orb':orb(30,62,15,'#5dffb0','#0a8a5a');orb(66,62,15,'#5dffb0','#0a8a5a');orb(48,32,15,'#5dffb0','#0a8a5a');break;
  case'seeker':{orb(48,50,25,'#ff5a5a','#8a0a1a');x.fillStyle='#ffe04a';x.beginPath();x.moveTo(26,40);x.lineTo(12,30);x.lineTo(24,52);x.fill();x.beginPath();x.moveTo(70,40);x.lineTo(84,30);x.lineTo(72,52);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(40,46,5,0,7);x.arc(56,46,5,0,7);x.fill();x.fillStyle='#000';x.beginPath();x.arc(41,47,2.5,0,7);x.arc(57,47,2.5,0,7);x.fill();break;}
  case'bomb':{orb(46,56,27,'#555a6a','#0a0a12');x.strokeStyle='#c8a060';x.lineWidth=5;x.beginPath();x.moveTo(60,34);x.quadraticCurveTo(70,18,80,20);x.stroke();x.fillStyle='#ffdd44';x.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?5:11;x.lineTo(82+Math.cos(a)*r,18+Math.sin(a)*r);}x.fill();break;}
  case'pepper':case'pepper3':{const n=id==='pepper3'?3:1;for(let k=0;k<n;k++){x.save();if(n===3){x.translate([20,48,76][k]-48,[10,-10,10][k]);x.scale(.7,.7);x.translate(20,20);}x.fillStyle='#ff2a1a';x.strokeStyle='#6a0a00';x.lineWidth=3;x.beginPath();x.moveTo(30,30);x.bezierCurveTo(70,24,78,50,58,82);x.bezierCurveTo(52,70,36,52,30,30);x.fill();x.stroke();x.fillStyle='#ffd0c0';x.beginPath();x.ellipse(46,40,6,3,.4,0,7);x.fill();x.fillStyle='#2ab03a';x.beginPath();x.moveTo(24,22);x.lineTo(36,34);x.lineTo(30,22);x.lineTo(22,14);x.fill();x.stroke();x.restore();}break;}
  case'bolt':{x.fillStyle='#7ad8ff';x.strokeStyle='#0a3a8a';x.lineWidth=4;x.beginPath();x.moveTo(56,10);x.lineTo(26,52);x.lineTo(46,52);x.lineTo(36,88);x.lineTo(72,40);x.lineTo(50,40);x.closePath();x.fill();x.stroke();break;}
  case'aura':{const g=x.createConicGradient?x.createConicGradient(0,48,48):null;if(g){['#ff4a4a','#ffd23a','#5dff7a','#3ac8ff','#a05aff','#ff4a4a'].forEach((c,i)=>g.addColorStop(i/5,c));x.fillStyle=g;}else x.fillStyle='#ffd23a';x.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2-Math.PI/2,r=i%2?18:40;x.lineTo(48+Math.cos(a)*r,48+Math.sin(a)*r);}x.closePath();x.fill();x.strokeStyle='#fff';x.lineWidth=4;x.stroke();break;}
  case'balloon':{orb(48,40,24,'#ff6aa0','#a01a4a');x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.moveTo(48,64);x.quadraticCurveTo(40,76,50,90);x.stroke();break;}}
 return ICON[k]=c.toDataURL();}
