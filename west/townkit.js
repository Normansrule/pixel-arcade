// DUSTWATER — town and camp materials and props: weathered board siding, cedar shingles, adobe plaster, canvas,
// stave barrels with iron hoops, plank crates, troughs, hay bales, lanterns, benches, A-frame tents, campfires.
import * as THREE from '../vendor/three.module.min.js';
import {V,M,merge,cl,lerp,smooth,rng,ctex,normalFrom,rbox,loft,tnoise} from './util.js';

const B=(w,h,d,x,y,z,c,ry=0,rx=0,rz=0)=>[new THREE.BoxGeometry(w,h,d),M(x,y,z,rx,ry,rz),c];
// weathered board siding: per-board tint, wavy grain, knots, nail pairs, butt joints, peeling paint, water stains, dark gaps
export function plankTex(seed=4){const r=rng(seed),n=512,bw=32;return ctex(n,n,(x,w,h)=>{x.fillStyle='#d0d0d0';x.fillRect(0,0,w,h);
 for(let j=0;j<n/bw;j++){const y0=j*bw,v=150+r()*80|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(0,y0,w,bw);
  for(let k=0;k<34;k++){const yy=y0+2+r()*(bw-4),a=.08+r()*.18,dk=r()<.6;x.strokeStyle=dk?`rgba(40,36,32,${a})`:`rgba(255,250,240,${a*.7})`;x.lineWidth=.6+r()*.9;x.beginPath();x.moveTo(0,yy);const f=.01+r()*.02,ph=r()*6,amp=.6+r()*2.2;for(let X=0;X<=w;X+=16)x.lineTo(X,yy+Math.sin(X*f+ph)*amp);x.stroke();}
  for(let k=0;k<(r()<.6?1:2);k++){const kx=r()*w,ky=y0+bw*(.3+r()*.4);for(let q=4;q>0;q--){x.strokeStyle=`rgba(50,40,30,${.12+.1*(4-q)})`;x.lineWidth=1;x.beginPath();x.ellipse(kx,ky,q*4+2,q*1.6+1,0,0,7);x.stroke();}x.fillStyle='rgba(40,30,22,.55)';x.beginPath();x.ellipse(kx,ky,3,1.6,0,0,7);x.fill();}
  const cut=r()*w;x.fillStyle='rgba(25,22,20,.7)';x.fillRect(cut,y0,1.5,bw);for(const sx of[cut-6,cut+5]){x.fillStyle='rgba(30,26,24,.85)';x.fillRect(sx,y0+bw*.3,2,2);x.fillRect(sx,y0+bw*.68,2,2);}
  if(r()<.5){x.fillStyle=`rgba(255,252,245,${.08+r()*.1})`;x.beginPath();x.ellipse(r()*w,y0+bw/2,10+r()*50,bw*.35,0,0,7);x.fill();}
  x.fillStyle='rgba(20,18,16,.75)';x.fillRect(0,y0+bw-2,w,2);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(0,y0,w,1);}
 for(let k=0;k<26;k++){const sx=r()*w,sw=4+r()*18,g=x.createLinearGradient(0,0,0,h);const a=.05+r()*.1;g.addColorStop(0,`rgba(40,32,26,0)`);g.addColorStop(.5+r()*.4,`rgba(40,32,26,${a})`);g.addColorStop(1,`rgba(40,32,26,0)`);x.fillStyle=g;x.fillRect(sx,0,sw,h);}});}
export function shingleTex(seed=6){const r=rng(seed),n=256;return ctex(n,n,(x,w,h)=>{x.fillStyle='#3a3a3a';x.fillRect(0,0,w,h);const rh=16;for(let j=0;j<n/rh;j++){let X=(j%2)*-9;while(X<w){const sw=12+r()*14,v=120+r()*90|0;x.fillStyle=`rgb(${v},${v-2},${v-6})`;x.fillRect(X+1,j*rh,sw-1.5,rh+3);
  const g=x.createLinearGradient(0,j*rh,0,j*rh+rh+3);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(.25,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(255,255,255,.06)');x.fillStyle=g;x.fillRect(X+1,j*rh,sw-1.5,rh+3);
  for(let k=0;k<3;k++){x.fillStyle=`rgba(30,26,22,${.15+r()*.2})`;x.fillRect(X+1+r()*sw,j*rh,1,rh);}X+=sw;}}});}
export function adobeTex(seed=8){const r=rng(seed),n=256,f=tnoise(n,8,seed,4);return ctex(n,n,(x,w,h)=>{const img=x.createImageData(w,h);for(let i=0;i<w*h;i++){const v=180+f[i]*60;img.data[i*4]=v;img.data[i*4+1]=v*.97;img.data[i*4+2]=v*.93;img.data[i*4+3]=255;}x.putImageData(img,0,0);
 for(let k=0;k<4;k++){const cx=r()*w,cy=r()*h,rw=14+r()*26,rh=10+r()*16;x.save();x.globalAlpha=.55;x.beginPath();x.ellipse(cx,cy,rw,rh,r(),0,7);x.clip();x.fillStyle='#8a7a6a';x.fillRect(0,0,w,h);for(let j=-2;j<h/12+2;j++)for(let i=-2;i<w/26+2;i++){const v=140+r()*60|0;x.fillStyle=`rgb(${v},${v*.9|0},${v*.8|0})`;x.fillRect(i*26+(j%2)*13,j*12,24,10);}x.restore();
  x.strokeStyle='rgba(60,50,40,.5)';x.lineWidth=1.5;x.beginPath();x.ellipse(cx,cy,rw,rh,0,0,7);x.stroke();}
 for(let k=0;k<30;k++){x.strokeStyle=`rgba(70,60,50,${.2+r()*.3})`;x.lineWidth=.8;x.beginPath();let px=r()*w,py=r()*h;x.moveTo(px,py);for(let q=0;q<5;q++){px+=(r()-.5)*20;py+=r()*14;x.lineTo(px,py);}x.stroke();}});}
export function canvasTex(seed=9){const r=rng(seed),n=256;return ctex(n,n,(x,w,h)=>{x.fillStyle='#e4e0d6';x.fillRect(0,0,w,h);for(let j=0;j<h;j+=2){x.fillStyle=`rgba(120,110,95,${.05+r()*.05})`;x.fillRect(0,j,w,1);}for(let i=0;i<w;i+=2){x.fillStyle=`rgba(120,110,95,${.04+r()*.04})`;x.fillRect(i,0,1,h);}
 for(let k=0;k<26;k++){x.fillStyle=`rgba(${110+r()*40},${90+r()*30},${60+r()*20},${.06+r()*.12})`;x.beginPath();x.ellipse(r()*w,r()*h,8+r()*40,6+r()*30,r()*3,0,7);x.fill();}
 x.strokeStyle='rgba(90,80,64,.35)';x.lineWidth=2;for(let k=0;k<3;k++){const yy=r()*h;x.beginPath();x.moveTo(0,yy);x.lineTo(w,yy+(r()-.5)*8);x.stroke();}});}
export function townMats(){const P=plankTex(4),S=shingleTex(6),A=adobeTex(8),C=canvasTex(9);
 const woodM=new THREE.MeshStandardMaterial({vertexColors:true,map:P,normalMap:normalFrom(P.image,2.6),normalScale:new THREE.Vector2(.9,.9),roughness:.86,envMapIntensity:.7});
 const roofM=new THREE.MeshStandardMaterial({vertexColors:true,map:S,normalMap:normalFrom(S.image,3),roughness:.9,envMapIntensity:.6});
 const adobeM=new THREE.MeshStandardMaterial({vertexColors:true,map:A,normalMap:normalFrom(A.image,2.5),roughness:.95,envMapIntensity:.6});
 const canvasM=new THREE.MeshStandardMaterial({vertexColors:true,map:C,normalMap:normalFrom(C.image,1.2),normalScale:new THREE.Vector2(.5,.5),roughness:.92,side:THREE.DoubleSide,envMapIntensity:.7});
 const metalM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.75,envMapIntensity:1.2});
 const glassM=new THREE.MeshStandardMaterial({color:0x2a2a26,roughness:.06,metalness:.85,emissive:0xffa040,emissiveIntensity:0,envMapIntensity:1.5});
 return{woodM,roofM,adobeM,canvasM,metalM,glassM,plankT:P};}
/* ---------------- props: return [wood parts, metal parts] in world space ---------------- */
// stave barrel: bulging lathe body, lid, three iron hoops
export function barrel(x,y,z,s=1,col=0x7a5232){const pr=[];for(let i=0;i<=10;i++){const t=i/10;pr.push(new THREE.Vector2(.36+.07*Math.sin(t*Math.PI),t*1.1));}const body=new THREE.LatheGeometry(pr,16);
 const st=body.attributes.position,cc=[];// darken every other stave a touch via uv-free vertex colour later
 const W=[[body,M(x,y,z,0,0,0,s),col],[new THREE.CylinderGeometry(.37*s,.37*s,.03,16),M(x,y+1.08*s,z),0x5a3a22]],Mt=[];for(const t of[.12,.5,.88])Mt.push([new THREE.TorusGeometry((.36+.07*Math.sin(t*Math.PI))*s+.012,.018*s,4,20),M(x,y+t*1.1*s,z,Math.PI/2),0x3a3634]);return[W,Mt];}
export function crate(x,y,z,s=1,ry=0,col=0x9a7448){const c=Math.cos(ry),sn=Math.sin(ry),T=(lx,ly,lz)=>[x+lx*c+lz*sn,y+ly,z-lx*sn+lz*c];const W=[B(.96*s,.96*s,.96*s,x,y+.5*s,z,col,ry)];
 for(const f of[-1,1]){const[a,b,d]=T(0,.5*s,f*.49*s);W.push(B(.98*s,.12*s,.04,a,b+.36*s,d,0x6a4a2a,ry),B(.98*s,.12*s,.04,a,b-.36*s,d,0x6a4a2a,ry),B(1.2*s,.1*s,.04,a,b,d,0x6a4a2a,ry,0,f*.78));const[e,g,h]=T(f*.49*s,.5*s,0);W.push(B(.04,.12*s,.98*s,e,g+.36*s,h,0x6a4a2a,ry),B(.04,.12*s,.98*s,e,g-.36*s,h,0x6a4a2a,ry));}return[W,[]];}
export function trough(x,y,z,ry){const c=Math.cos(ry),s=Math.sin(ry);const W=[B(2.4,.12,.8,x,y+.5,z,0x6a4a30,ry),B(2.4,.5,.08,x+.36*s,y+.7,z+.36*c,0x7a5a3a,ry),B(2.4,.5,.08,x-.36*s,y+.7,z-.36*c,0x7a5a3a,ry),B(.08,.5,.8,x+1.16*c,y+.7,z-1.16*s,0x7a5a3a,ry),B(.08,.5,.8,x-1.16*c,y+.7,z+1.16*s,0x7a5a3a,ry)];
 for(const k of[-1,1])W.push(B(.14,.5,.9,x+k*.9*c,y+.25,z-k*.9*s,0x5a3a20,ry));const water=[new THREE.PlaneGeometry(2.25,.66).rotateX(-Math.PI/2),M(x,y+.86,z,0,ry,0),0x3a4a40];return[W,[],[water]];}
export function hay(x,y,z,ry){return[[B(1.1,.55,.6,x,y+.28,z,0xc8a860,ry),B(1.12,.04,.62,x,y+.15,z,0x8a7040,ry),B(1.12,.04,.62,x,y+.41,z,0x8a7040,ry)],[]];}
export function bench(x,y,z,ry){const c=Math.cos(ry),s=Math.sin(ry);return[[B(1.8,.07,.4,x,y+.48,z,0x6a4a30,ry),B(1.8,.4,.05,x-.2*s,y+.75,z-.2*c,0x6a4a30,ry,0,-.15),...[-1,1].map(k=>B(.07,.48,.36,x+k*.8*c,y+.24,z-k*.8*s,0x4a3020,ry))],[]];}
export function lantern(x,y,z){return[[],[[new THREE.CylinderGeometry(.09,.11,.04,8),M(x,y-.16,z),0x2a2826],[new THREE.ConeGeometry(.11,.1,8),M(x,y+.16,z),0x2a2826],[new THREE.TorusGeometry(.05,.008,4,8),M(x,y+.24,z),0x2a2826]],null,[[new THREE.CylinderGeometry(.08,.08,.28,8),M(x,y,z),0xffffff]]];}
export function sack(x,y,z,ry,col=0xb8a882){const g=new THREE.SphereGeometry(.32,10,8);const p=g.attributes.position;for(let i=0;i<p.count;i++){const yy=p.getY(i);p.setY(i,yy*(yy<0?.55:1.1));p.setX(i,p.getX(i)*(1-yy*.3));}g.computeVertexNormals();return[[[g,M(x,y+.2,z,0,ry,.08),col]],[]];}
// A-frame canvas tent with a sagging ridge, poles, guy ropes; returns [wood, metal, canvas]
export function tent(x,y,z,ry,w=2.6,L=3.2,h=1.9,col=0xe0d6c0){const c=Math.cos(ry),s=Math.sin(ry),T=(lx,ly,lz)=>[x+lx*c+lz*s,y+ly,z-lx*s+lz*c];const C=[];
 for(const side of[-1,1]){const g=new THREE.PlaneGeometry(L,Math.hypot(w/2,h),8,4);const p=g.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i)/L+.5,v=p.getY(i)/Math.hypot(w/2,h)+.5;const sag=Math.sin(u*Math.PI)*.12*(1-Math.abs(v-.5)*1.2);p.setZ(i,-sag*side);}g.computeVertexNormals();
  const ang=Math.atan2(h,w/2);g.applyMatrix4(M(0,0,0,0,0,0));g.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI/2));g.applyMatrix4(new THREE.Matrix4().makeRotationZ(side*(Math.PI/2-ang)));
  g.applyMatrix4(new THREE.Matrix4().makeTranslation(side*w/4,h/2,0));if(side>0){}g.applyMatrix4(M(x,y,z,0,ry,0));C.push([g,null,col]);}
 const back=new THREE.BufferGeometry().setFromPoints([new V(-w/2,0,-L/2),new V(w/2,0,-L/2),new V(0,h,-L/2)]);back.computeVertexNormals();back.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));back.applyMatrix4(M(x,y,z,0,ry,0));C.push([back,null,new THREE.Color(col).multiplyScalar(.9).getHex()]);
 for(const f of[-1,1]){const A=new V(f*w/2,0,L/2),Bt=new V(0,h,L/2),ax=Bt.clone().sub(A).normalize(),Cc=new V(0,0,L/2).sub(A).applyAxisAngle(ax,-f*2.3).add(A);
  const fl=new THREE.BufferGeometry().setFromPoints(f>0?[A,Bt,Cc]:[A,Cc,Bt]);fl.computeVertexNormals();fl.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));fl.applyMatrix4(M(x,y,z,0,ry,0));C.push([fl,null,col]);}
 const W=[];for(const zz of[-L/2-.05,L/2+.05]){const[a,b,d]=T(0,h/2,zz);W.push([new THREE.CylinderGeometry(.035,.04,h+.2,6),M(a,b,d),0x5a4430]);}const[a,b,d]=T(0,h,0);W.push([new THREE.CylinderGeometry(.03,.03,L+.3,6).rotateX(Math.PI/2).rotateY(ry),M(a,b,d),0x5a4430]);
 const R=[];for(const zz of[-L/2-.05,L/2+.05]){const p0=new V(...T(0,h+.05,zz)),p1=new V(...T(0,0,zz+Math.sign(zz)*1.4));const len=p0.distanceTo(p1),mid=p0.clone().add(p1).multiplyScalar(.5),g=new THREE.CylinderGeometry(.008,.008,len,3);const q=new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),p1.clone().sub(p0).normalize());g.applyQuaternion(q);g.translate(mid.x,mid.y,mid.z);R.push([g,null,0xb8a880]);
  const[px,py,pz]=T(0,0,zz+Math.sign(zz)*1.4);W.push([new THREE.CylinderGeometry(.02,.03,.3,4),M(px,py+.1,pz),0x6a5034]);}
 return[W.concat(R),[],C];}
