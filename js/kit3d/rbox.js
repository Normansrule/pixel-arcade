// Rounded, bevelled box geometry for small hard-surface parts (gun receivers, magazines, grips...).
// A plain BoxGeometry has razor edges that never catch a highlight; this rounds the corners of the
// width x height profile and bevels the ends, so edges pick up the light like machined or moulded parts.
// Geometry is cached per size and shared; it carries box-projected UVs so textured materials still work.
import * as THREE from '../../vendor/three.module.min.js';
const CACHE=new Map();
export function roundBox(w,h,d,r){
 r=Math.min(r??Math.min(w,h)*.22,w*.45,h*.45);const key=w.toFixed(4)+'|'+h.toFixed(4)+'|'+d.toFixed(4)+'|'+r.toFixed(4);
 let g=CACHE.get(key);if(g)return g;
 if(r<.0015||d<.004){g=new THREE.BoxGeometry(w,h,d);CACHE.set(key,g);return g;}
 const s=new THREE.Shape(),x=-w/2+r,y=-h/2+r,W=w-2*r,H=h-2*r;
 s.moveTo(x,y-r);s.lineTo(x+W,y-r);s.quadraticCurveTo(x+W+r,y-r,x+W+r,y);s.lineTo(x+W+r,y+H);s.quadraticCurveTo(x+W+r,y+H+r,x+W,y+H+r);
 s.lineTo(x,y+H+r);s.quadraticCurveTo(x-r,y+H+r,x-r,y+H);s.lineTo(x-r,y);s.quadraticCurveTo(x-r,y-r,x,y-r);
 const b=Math.min(r*.6,d*.2);g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.0005,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b*.8,bevelSegments:2,curveSegments:3});
 g.translate(0,0,-Math.max(.0005,d-2*b)/2);g.computeVertexNormals();
 // box-projected UVs (metres x 4), picked per vertex by the dominant normal axis
 const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;
  if(ax>=ay&&ax>=az){u=p.getZ(i);v=p.getY(i);}else if(ay>=az){u=p.getX(i);v=p.getZ(i);}else{u=p.getX(i);v=p.getY(i);}uv[i*2]=u*4+.5;uv[i*2+1]=v*4+.5;}
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2));CACHE.set(key,g);return g;}
