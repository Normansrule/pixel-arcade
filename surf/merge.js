// SWELL GUARD — tiny geometry merge (non-indexed concat of the attributes the first geometry has).
import * as THREE from '../vendor/three.module.min.js';
export function mergeGeometries(list){const gs=list.map(g=>g.index?g.toNonIndexed():g),names=Object.keys(gs[0].attributes),out=new THREE.BufferGeometry();
 for(const n of names){const a0=gs[0].attributes[n],tot=gs.reduce((s,g)=>s+(g.attributes[n]?g.attributes[n].array.length:g.attributes.position.count*a0.itemSize),0),arr=new a0.array.constructor(tot);let o=0;
  for(const g of gs){const a=g.attributes[n];if(a)arr.set(a.array,o);o+=a?a.array.length:g.attributes.position.count*a0.itemSize;}out.setAttribute(n,new THREE.BufferAttribute(arr,a0.itemSize,a0.normalized));}
 return out;}
