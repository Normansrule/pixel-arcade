// SKATE CITY — effects: pooled GPU particles (grind sparks, dust, confetti, water spray) and screen-space speed lines.
import * as THREE from '../vendor/three.module.min.js';
export class Particles{
 constructor(scene,n=4000,additive=true){this.n=n;const A=k=>new Float32Array(n*k);this.p=A(3);this.v=A(3);this.c=A(3);this.oc=A(3);this.s=A(1);this.os=A(1);this.life=A(1);this.max=A(1);this.g=A(1);this.drag=A(1);this.i=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,vertexColors:true,
   vertexShader:'attribute float size;uniform float uScale;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC*a,1.);}':'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.1,d);if(a<.02)discard;gl_FragColor=vec4(vC,a*.55);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=6;scene.add(this.pts);this.geo=geo;this.ground=null;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0){const i=this.i;this.i=(i+1)%this.n;const j=i*3;this.p[j]=x;this.p[j+1]=y;this.p[j+2]=z;this.v[j]=vx;this.v[j+1]=vy;this.v[j+2]=vz;this.oc[j]=r;this.oc[j+1]=g;this.oc[j+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;}
 burst(p,n,speed,cols,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.6;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy)+(o.lift||0);
  const sp=speed*(.35+Math.random()*.65),c=Array.isArray(cols)?cols[Math.random()*cols.length|0]:cols;this.emit(p.x,p.y,p.z,dx*sp,dy*sp,dz*sp,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag}=this,G=this.ground;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt),j=i*3;
   v[j]*=dr;v[j+1]=v[j+1]*dr-g[i]*dt;v[j+2]*=dr;p[j]+=v[j]*dt;p[j+1]+=v[j+1]*dt;p[j+2]+=v[j+2]*dt;
   if(G&&g[i]>0){const h=G(p[j],p[j+2]);if(p[j+1]<h+.02){p[j+1]=h+.02;v[j+1]*=-.35;v[j]*=.6;v[j+2]*=.6;}}
   const f=k*k;c[j]=oc[j]*f;c[j+1]=oc[j+1]*f;c[j+2]=oc[j+2]*f;s[i]=os[i]*(.45+.55*k);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}
 clear(){this.life.fill(0);}}

// radial speed streaks drawn on a 2D overlay canvas
export class SpeedLines{
 constructor(cv){this.cv=cv;this.x=cv.getContext('2d');this.l=[];this.a=0;}
 update(dt,amt){const cv=this.cv,w=cv.clientWidth,h=cv.clientHeight;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}this.a+=(amt-this.a)*Math.min(1,dt*5);const x=this.x;x.clearRect(0,0,w,h);if(this.a<.02){this.l.length=0;return;}
  const n=Math.round(this.a*46);while(this.l.length<n)this.l.push({ang:Math.random()*Math.PI*2,r:.35+Math.random()*.4,len:.12+Math.random()*.25,v:.8+Math.random()*1.4,w:1+Math.random()*2.2});
  if(this.l.length>n)this.l.length=n;const cx=w/2,cy=h*.46,R=Math.hypot(w,h)*.5;x.lineCap='round';
  for(const s of this.l){s.r+=s.v*dt*1.6;if(s.r>1.2){s.r=.35+Math.random()*.15;s.ang=Math.random()*Math.PI*2;}const a=s.r*R,b=(s.r+s.len)*R,ca=Math.cos(s.ang),sa=Math.sin(s.ang);
   const g=x.createLinearGradient(cx+ca*a,cy+sa*a,cx+ca*b,cy+sa*b);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,`rgba(255,240,220,${.35*this.a})`);x.strokeStyle=g;x.lineWidth=s.w;x.beginPath();x.moveTo(cx+ca*a,cy+sa*a);x.lineTo(cx+ca*b,cy+sa*b);x.stroke();}}}
