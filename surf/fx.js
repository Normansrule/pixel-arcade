// SWELL GUARD — effects: pooled GPU spray particles (rail spray fans, lip explosions, crest mist blown off by the
// offshore wind, wipeout splashes, paddle splashes, board wake) and the whistle's expanding ring on the water.
import * as THREE from '../vendor/three.module.min.js';
export class Spray{
 constructor(scene,n){this.n=n;const A=k=>new Float32Array(n*k);this.p=A(3);this.v=A(3);this.c=A(4);this.s=A(1);this.os=A(1);this.life=A(1);this.max=A(1);this.g=A(1);this.dr=A(1);this.grow=A(1);this.a0=A(1);this.i=0;this.live=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('col',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500},uSunC:{value:new THREE.Color(1,.88,.72)},uAmb:{value:new THREE.Color(.55,.66,.8)}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,
   vertexShader:`attribute float size;attribute vec4 col;uniform float uScale;varying vec4 vC;varying float vR;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=col;vR=fract(sin(dot(position.xz,vec2(12.9,78.2)))*437.5);gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`uniform vec3 uSunC,uAmb;varying vec4 vC;varying float vR;void main(){vec2 q=gl_PointCoord-.5;float d=length(q)*2.;float n=sin(q.x*13.+vR*40.)*sin(q.y*11.-vR*30.);float a=(1.-smoothstep(.2,1.,d+n*.12))*(.8+.2*n)*vC.a;a*=a;if(a<.004)discard;
    float lit=.5+.5*clamp(.5-q.y*1.4,0.,1.);vec3 c=vC.rgb*(uAmb*.55+uSunC*lit*.62);gl_FragColor=vec4(c,a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`}));
  this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);this.geo=geo;this.ground=null;}
 emit(x,y,z,vx,vy,vz,size,life,o={}){const i=this.i;this.i=(i+1)%this.n;const j=i*3;this.p[j]=x;this.p[j+1]=y;this.p[j+2]=z;this.v[j]=vx;this.v[j+1]=vy;this.v[j+2]=vz;
  const c=o.c||[1,1,1];this.c[i*4]=c[0];this.c[i*4+1]=c[1];this.c[i*4+2]=c[2];this.a0[i]=o.a??.85;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=o.g??6;this.dr[i]=o.drag??1.2;this.grow[i]=o.grow??1.6;}
 update(dt,waterH){const{p,v,c,s,os,life,max,g,dr,grow,a0}=this;let live=0;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0){s[i]=0;c[i*4+3]=0;}continue;}live++;life[i]-=dt;const k=Math.max(0,life[i]/max[i]),d=Math.exp(-dr[i]*dt),j=i*3;
   v[j]*=d;v[j+1]=v[j+1]*d-g[i]*dt;v[j+2]*=d;p[j]+=v[j]*dt;p[j+1]+=v[j+1]*dt;p[j+2]+=v[j+2]*dt;
   if(waterH&&g[i]>2&&v[j+1]<0){const h=waterH(p[j],p[j+2]);if(p[j+1]<h){life[i]=Math.min(life[i],.12);}}
   s[i]=os[i]*(1+(1-k)*grow[i]);c[i*4+3]=a0[i]*Math.min(1,k*2.2)*Math.min(1,(1-k)*12+.2);}
  this.live=live;const a=this.geo.attributes;a.position.needsUpdate=a.col.needsUpdate=a.size.needsUpdate=true;}
 clear(){this.life.fill(0);}
 // recipes
 rail(x,y,z,hx,hz,side,amt){const n=Math.round(2+amt*5);for(let k=0;k<n;k++){const sp=4+Math.random()*5*amt,up=3+Math.random()*4*amt;this.emit(x+(Math.random()-.5)*.4,y+.1,z+(Math.random()-.5)*.4,(-hz*side)*sp+hx*(Math.random()-.3)*2,up,(hx*side)*sp+hz*(Math.random()-.3)*2,.1+Math.random()*.16,.5+Math.random()*.5,{g:9,drag:1.4,a:.8});}}
 crash(x,y,z,a,dir){const n=Math.round(4+a*3);for(let k=0;k<n;k++){const big=k<2;this.emit(x+(Math.random()-.5)*2.5,y+Math.random()*.5,z+(Math.random()-.5)*1.5,(Math.random()-.5)*2.5+dir*1.5,(big?1.2:2.5)+Math.random()*a*(big?1.2:2.8),-1-Math.random()*3,big?.3+Math.random()*a*.2:.08+Math.random()*.16,big?1.3+Math.random():.6+Math.random()*.6,{g:big?1.2:7,drag:big?1.1:.6,a:big?.16:.8,grow:big?2.2:.6});}}
 mist(x,y,z,a){this.emit(x+(Math.random()-.5)*3,y+Math.random()*.3,z,(Math.random()-.5)*.8,.6+Math.random()*.8,2.4+Math.random()*2.2,.4+Math.random()*a*.3,1.2+Math.random(),{g:-.2,drag:.6,a:.2,grow:2.6,c:[1,.98,.95]});}
 splash(x,y,z,n=40,pow=5){for(let k=0;k<n;k++){const a=Math.random()*6.28,r=Math.random();this.emit(x,y+.2,z,Math.cos(a)*r*pow*.6,2+Math.random()*pow,Math.sin(a)*r*pow*.6,.15+Math.random()*.3,.6+Math.random()*.6,{g:9,drag:1,a:.85});}}
 wake(x,y,z){this.emit(x+(Math.random()-.5)*.3,y+.04,z+(Math.random()-.5)*.3,(Math.random()-.5)*.4,.15,(Math.random()-.5)*.4,.22+Math.random()*.16,1.6,{g:0,drag:2,a:.55,grow:2.5});}
 paddle(x,y,z){for(let k=0;k<5;k++)this.emit(x,y+.05,z,(Math.random()-.5)*1.4,1+Math.random()*1.5,(Math.random()-.5)*1.4,.06+Math.random()*.08,.4,{g:9,drag:1,a:.8});}
}
export class Rings{
 constructor(scene){this.list=[];this.g=new THREE.RingGeometry(.92,1,64);this.g.rotateX(-Math.PI/2);this.scene=scene;}
 add(x,y,z,max=22,color=0xffffff,life=1.1){const m=new THREE.Mesh(this.g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));m.position.set(x,y+.15,z);m.renderOrder=6;this.scene.add(m);this.list.push({m,t:0,max,life});}
 update(dt,hf){for(const r of this.list){r.t+=dt;const k=r.t/r.life;r.m.scale.setScalar(.5+k*r.max);r.m.material.opacity=.8*(1-k);if(hf)r.m.position.y=hf(r.m.position.x,r.m.position.z)+.2;}
  this.list=this.list.filter(r=>{if(r.t>=r.life){this.scene.remove(r.m);r.m.material.dispose();return false;}return true;});}
 clear(){for(const r of this.list){this.scene.remove(r.m);r.m.material.dispose();}this.list=[];}}
