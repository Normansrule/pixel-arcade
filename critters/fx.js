// HARBOR PALS — particles (dust, splash, poof, sparkles, hearts), a zap arc, the tow rope and the waypoint ring.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
function tex(draw){const c=document.createElement('canvas');c.width=c.height=64;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);return t;}
export const DOT=()=>tex(x=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);});
export const HEART=()=>tex(x=>{x.fillStyle='#fff';x.beginPath();x.moveTo(32,54);x.bezierCurveTo(4,34,8,8,32,20);x.bezierCurveTo(56,8,60,34,32,54);x.fill();});
export class Particles{
 constructor(scene,n,map,additive){this.n=n;this.i=0;const g=new THREE.BufferGeometry();this.P=new Float32Array(n*3);this.Cc=new Float32Array(n*3);this.S=new Float32Array(n);this.A=new Float32Array(n);
  g.setAttribute('position',new THREE.BufferAttribute(this.P,3));g.setAttribute('color',new THREE.BufferAttribute(this.Cc,3));g.setAttribute('size',new THREE.BufferAttribute(this.S,1));g.setAttribute('alpha',new THREE.BufferAttribute(this.A,1));
  this.v=new Float32Array(n*3);this.life=new Float32Array(n);this.max=new Float32Array(n);this.gr=new Float32Array(n);this.dr=new Float32Array(n);this.s0=new Float32Array(n);
  this.U={map:{value:map},scale:{value:600}};
  const m=new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute float alpha;attribute vec3 color;varying vec3 vC;varying float vA;uniform float scale;void main(){vC=color;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*scale/-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform sampler2D map;varying vec3 vC;varying float vA;void main(){vec4 t=texture2D(map,gl_PointCoord);if(t.a*vA<.01)discard;gl_FragColor=vec4(vC,t.a*vA);}'});
  this.pts=new THREE.Points(g,m);this.pts.frustumCulled=false;scene.add(this.pts);this.g=g;}
 emit(p,v,col,size,life,grav=0,drag=0){const i=this.i;this.i=(this.i+1)%this.n;this.P.set([p.x,p.y,p.z],i*3);this.v.set([v.x,v.y,v.z],i*3);this.Cc.set([col.r,col.g,col.b],i*3);this.s0[i]=size;this.S[i]=size;this.life[i]=life;this.max[i]=life;this.gr[i]=grav;this.dr[i]=drag;this.A[i]=1;}
 burst(p,n,spd,col,size,life,o={}){const c=col.isColor?col:new THREE.Color(col);for(let k=0;k<n;k++){const a=Math.random()*6.283,u=o.up?Math.random()*.8+.2:Math.random()*2-1,r=Math.sqrt(1-u*u),s=spd*(.4+Math.random()*.6);
  this.emit(new V(p.x+(Math.random()-.5)*(o.spread||0),p.y,p.z+(Math.random()-.5)*(o.spread||0)),new V(Math.cos(a)*r*s,u*s*(o.upk??1),Math.sin(a)*r*s),c,size*(.6+Math.random()*.6),life*(.6+Math.random()*.5),o.grav||0,o.drag||0);}}
 update(dt,h){this.U.scale.value=h;for(let i=0;i<this.n;i++){if(this.life[i]<=0){if(this.A[i]){this.A[i]=0;}continue;}this.life[i]-=dt;const k=i*3,d=Math.exp(-this.dr[i]*dt);this.v[k]*=d;this.v[k+1]=this.v[k+1]*d-this.gr[i]*dt;this.v[k+2]*=d;
  this.P[k]+=this.v[k]*dt;this.P[k+1]+=this.v[k+1]*dt;this.P[k+2]+=this.v[k+2]*dt;const f=Math.max(0,this.life[i]/this.max[i]);this.A[i]=Math.min(1,f*2.2);this.S[i]=this.s0[i]*(.6+.4*f);}
  for(const n of['position','alpha','size','color'])this.g.attributes[n].needsUpdate=true;}
 clear(){this.life.fill(0);this.A.fill(0);this.g.attributes.alpha.needsUpdate=true;}}

// jagged electric arc from a to b, re-rolled every frame while on
export class Arc{
 constructor(scene){this.n=14;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(this.n*3),3));this.line=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xf4ffb0,transparent:true,opacity:.95}));this.line.visible=false;this.line.frustumCulled=false;scene.add(this.line);
  const g2=g.clone();this.line2=new THREE.Line(g2,new THREE.LineBasicMaterial({color:0xb8ff5a,transparent:true,opacity:.6}));this.line2.visible=false;this.line2.frustumCulled=false;scene.add(this.line2);}
 set(a,b,on){this.line.visible=this.line2.visible=on;if(!on)return;for(const L of[this.line,this.line2]){const p=L.geometry.attributes.position;for(let i=0;i<this.n;i++){const t=i/(this.n-1),j=i&&i<this.n-1?.28:0;p.setXYZ(i,a.x+(b.x-a.x)*t+(Math.random()-.5)*j,a.y+(b.y-a.y)*t+(Math.random()-.5)*j,a.z+(b.z-a.z)*t+(Math.random()-.5)*j);}p.needsUpdate=true;}}}

// the tow rope: a sagging tube between two points, rebuilt only when its ends move
export class Rope{
 constructor(scene){this.mat=new THREE.MeshStandardMaterial({color:0xd8b878,roughness:.9});this.mesh=new THREE.Mesh(new THREE.BufferGeometry(),this.mat);this.mesh.castShadow=true;this.mesh.visible=false;this.mesh.frustumCulled=false;scene.add(this.mesh);this.key='';}
 set(a,b,sag,on){this.mesh.visible=on;if(!on)return;const key=[a.x,a.y,a.z,b.x,b.y,b.z,sag].map(v=>v.toFixed(2)).join();if(key===this.key)return;this.key=key;
  const pts=[];for(let i=0;i<=16;i++){const t=i/16;pts.push(new V(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t-Math.sin(t*Math.PI)*sag,a.z+(b.z-a.z)*t));}
  this.mesh.geometry.dispose();this.mesh.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.045,5,false);}}

// pulsing ring + beacon that marks the current objective (hint level decides when it shows)
export class Marker{
 constructor(scene){this.g=new THREE.Group();const ring=new THREE.Mesh(new THREE.RingGeometry(.8,1,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xfff0b0,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3,6,1,true),new THREE.MeshBasicMaterial({color:0xfff0b0,transparent:true,opacity:.35,depthWrite:false}));beam.position.y=1.5;
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.22),new THREE.MeshBasicMaterial({color:0xffe070}));gem.position.y=3.2;this.g.add(ring,beam,gem);this.ring=ring;this.gem=gem;this.g.visible=false;scene.add(this.g);}
 set(p,on,t){this.g.visible=!!on;if(!on)return;this.g.position.copy(p);const k=1+Math.sin(t*4)*.12;this.ring.scale.set(k,1,k);this.gem.rotation.y=t*2;this.gem.position.y=3.2+Math.sin(t*3)*.15;}}
