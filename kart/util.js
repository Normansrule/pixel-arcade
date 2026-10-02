// CRITTER KART — shared helpers: maths, seeded noise, canvas textures, geometry merging, particles.
import * as THREE from '../vendor/three.module.min.js';
export const V=THREE.Vector3;
export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const wrapA=a=>{a%=Math.PI*2;if(a>Math.PI)a-=Math.PI*2;if(a<-Math.PI)a+=Math.PI*2;return a;};
export function rng(seed=1){let s=(seed*2654435761)>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* ---------- value noise ---------- */
const P=new Uint8Array(512);{const r=rng(4242),p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=r()*(i+1)|0;[p[i],p[j]]=[p[j],p[i]];}for(let i=0;i<512;i++)P[i]=p[i&255];}
const fade=t=>t*t*(3-2*t);
export function noise2(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,X=xi&255,Z=zi&255,h=(a,b)=>P[P[a]+b]/255,u=fade(xf),v=fade(zf);
 return lerp(lerp(h(X,Z),h(X+1,Z),u),lerp(h(X,Z+1),h(X+1,Z+1),u),v)*2-1;}
export function fbm(x,z,o=4){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=noise2(x*f+i*17.3,z*f-i*9.1)*a;a*=.5;f*=2.07;}return s;}
export const ridge=(x,z)=>1-Math.abs(fbm(x,z,4));

/* ---------- canvas textures ---------- */
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
export function speckle(x,w,h,base,spread,n=6000,sz=2){x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<n;i++){const v=(Math.random()-.5)*spread;x.fillStyle=v>0?`rgba(255,255,255,${v})`:`rgba(0,0,0,${-v})`;x.fillRect(Math.random()*w,Math.random()*h,sz,sz);}}
export function textSprite(lines,o={}){const w=o.w||512,h=o.h||256;const t=ctex(w,h,(x)=>{x.fillStyle=o.bg||'rgba(10,8,20,.82)';const r=36;x.beginPath();x.roundRect?x.roundRect(6,6,w-12,h-12,r):x.rect(6,6,w-12,h-12);x.fill();
  if(o.border){x.strokeStyle=o.border;x.lineWidth=10;x.stroke();}x.textAlign='center';x.textBaseline='middle';
  lines.forEach((l,i)=>{x.fillStyle=l.c||'#fff';x.font=l.f||'64px Anton, Impact, sans-serif';x.fillText(l.t,w/2,l.y??(h/(lines.length+1))*(i+1));});},{clamp:true});
 const m=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));m.scale.set(o.sx||8,(o.sx||8)*h/w,1);return m;}

/* ---------- geometry merge with vertex colours ---------- */
export function M4(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx){return new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz,'YXZ')),new V(sx,sy,sz));}
export function merge(list){const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c!=null){const c=new THREE.Color(g.userData.c);for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.setAttribute('color',new THREE.BufferAttribute(col,3));
 out.computeBoundingSphere();out.computeBoundingBox();return out;}
export function lumpy(g,amt,seed=1){g=g.index?g.toNonIndexed():g;const p=g.attributes.position,r=rng(seed),cache=new Map();for(let i=0;i<p.count;i++){const k=`${p.getX(i).toFixed(2)},${p.getY(i).toFixed(2)},${p.getZ(i).toFixed(2)}`;let d=cache.get(k);if(!d){d=[(r()-.5)*amt,(r()-.5)*amt,(r()-.5)*amt];cache.set(k,d);}p.setXYZ(i,p.getX(i)+d[0],p.getY(i)+d[1],p.getZ(i)+d[2]);}g.computeVertexNormals();return g;}

/* ---------- particles (additive sparks or soft alpha puffs) ---------- */
export class Particles{
 constructor(scene,n=3000,additive=true){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.grow=new Float32Array(n);this.i=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('pc',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 pc;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=pc;vC.a*=smoothstep(.3,2.,-mv.z);gl_PointSize=min(256.,size*uScale/max(.1,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}'
    :'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.12,d)*vC.a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb,a);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?6:5;scene.add(this.pts);this.geo=geo;this.live=0;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.grow[i]=grow;this.live=1;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const sp=o.spread??.6;dx=dx*sp+o.dir.x;dy=dy*sp+o.dir.y;dz=dz*sp+o.dir.z;}if(o.up)dy=Math.abs(dy);const s=speed*(.35+Math.random()*.65);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.grow??0);}}
 clear(){this.life.fill(0);this.s.fill(0);this.c.fill(0);this.geo.attributes.size.needsUpdate=true;}
 update(dt){if(!this.live)return;const{p,v,c,oc,s,os,life,max,g,drag,grow}=this,add=this.add;let any=0;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0){s[i]=0;c[i*4+3]=0;}continue;}any=1;life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(add){const f=k*k;c[i*4]=oc[i*3]*f;c[i*4+1]=oc[i*3+1]*f;c[i*4+2]=oc[i*3+2]*f;c[i*4+3]=1;s[i]=os[i]*(.4+.6*k);}
   else{c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=Math.min(1,(1-k)*6)*k*.85;s[i]=os[i]*(1+(1-k)*grow[i]);}}
  this.live=any;this.geo.attributes.position.needsUpdate=this.geo.attributes.pc.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

export const ORD=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');
export const fmtT=t=>{t=Math.max(0,t);const m=t/60|0,s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(2);};
export const fmtClock=t=>{t=Math.max(0,Math.ceil(t));return (t/60|0)+':'+String(t%60).padStart(2,'0');};
