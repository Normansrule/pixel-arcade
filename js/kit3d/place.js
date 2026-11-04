// Shared scenery placement guard for the 3D worlds: a spatial hash of footprints (circles and boxes on the
// ground plane) so props, trees and street furniture never spawn inside each other, inside buildings or on the road.
// const P=new Placer(8); P.box(x0,z0,x1,z1); if(P.free(x,z,r)){P.circle(x,z,r); ...place...}
export class Placer{
 constructor(cell=8){this.c=cell;this.h=new Map();}
 _keys(x0,z0,x1,z1,f){const c=this.c;for(let i=Math.floor(x0/c);i<=Math.floor(x1/c);i++)for(let j=Math.floor(z0/c);j<=Math.floor(z1/c);j++)f(i+','+j);}
 _add(s){this._keys(s.x0,s.z0,s.x1,s.z1,k=>{let L=this.h.get(k);if(!L)this.h.set(k,L=[]);L.push(s);});return s;}
 // reserve a circle (trunks, poles, bins) or an axis-aligned box (buildings, road strips, benches)
 circle(x,z,r,tag){return this._add({x,z,r,x0:x-r,z0:z-r,x1:x+r,z1:z+r,tag});}
 box(x0,z0,x1,z1,tag){return this._add({x0:Math.min(x0,x1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),z1:Math.max(z0,z1),tag});}
 // true when a circle of radius r at (x,z) touches nothing reserved (optionally ignoring some tags)
 free(x,z,r,ignore){let ok=true;const seen=new Set();this._keys(x-r,z-r,x+r,z+r,k=>{if(!ok)return;const L=this.h.get(k);if(!L)return;for(const s of L){if(seen.has(s))continue;seen.add(s);if(ignore&&s.tag&&ignore.includes(s.tag))continue;
   if(s.r!==undefined){if(Math.hypot(s.x-x,s.z-z)<s.r+r){ok=false;return;}}
   else{const dx=Math.max(s.x0-x,0,x-s.x1),dz=Math.max(s.z0-z,0,z-s.z1);if(dx*dx+dz*dz<r*r){ok=false;return;}}}});return ok;}
 // true when the box touches nothing reserved
 freeBox(x0,z0,x1,z1,pad=0,ignore){let ok=true;const seen=new Set();this._keys(x0-pad,z0-pad,x1+pad,z1+pad,k=>{if(!ok)return;const L=this.h.get(k);if(!L)return;for(const s of L){if(seen.has(s))continue;seen.add(s);if(ignore&&s.tag&&ignore.includes(s.tag))continue;
   if(s.x1>x0-pad&&s.x0<x1+pad&&s.z1>z0-pad&&s.z0<z1+pad){if(s.r!==undefined){const dx=Math.max(x0-s.x,0,s.x-x1),dz=Math.max(z0-s.z,0,s.z-z1);if(dx*dx+dz*dz>=(s.r+pad)**2)continue;}ok=false;return;}}});return ok;}
 // try to claim a circle; returns true when placed
 take(x,z,r,tag){if(!this.free(x,z,r))return false;this.circle(x,z,r,tag);return true;}
 takeBox(x0,z0,x1,z1,pad,tag){if(!this.freeBox(x0,z0,x1,z1,pad))return false;this.box(x0,z0,x1,z1,tag);return true;}}

// pack non-overlapping rectangles (rooftop units, crates) inside a rectangle; returns [{x,z,hw,hd}] centres + half sizes
export function packRects(x0,z0,x1,z1,items,R,margin=.6,tries=14){const P=new Placer(4),out=[];
 for(const[hw,hd]of items){for(let t=0;t<tries;t++){const ax=x0+margin+hw,bx=x1-margin-hw,az=z0+margin+hd,bz=z1-margin-hd;if(ax>bx||az>bz)break;
   const x=ax+(bx-ax)*R(),z=az+(bz-az)*R();if(P.takeBox(x-hw,z-hd,x+hw,z+hd,.4)){out.push({x,z,hw,hd});break;}}}
 return out;}
