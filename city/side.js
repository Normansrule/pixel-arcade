// NEON BAY — side activities: speed-trap cameras on long straights, and hidden neon graffiti tags on building walls.
import {THREE,rng,fmtCash,ctex} from './util.js';
import {polyAt,RW,FWY_HW} from './world.js';

const TRAP_NAMES=['BAYLOOP NORTH','BAYLOOP SOUTH','NEON MILE','HARBOR LINE','PALMWOOD AVE'];
const TAG_WORDS=['VOLT','RUSH','KOI','ZED','OMNI','LUX','JINX','NOVA','RIOT','FLUX','HAZE','ECHO'];
const TAG_COLS=['#ff2f9a','#36f0ff','#9dff3a','#ffb21f','#b46bff','#ff5a2a'];

export class Side{constructor(G){this.G=G;const W=G.W,R=rng(515);
  /* ---- speed traps: two on the freeway loop, three on long streets, spread apart ---- */
  const pick=(list,n,minGap,out)=>{const L=list.slice();for(let k=L.length-1;k>0;k--){const j=R()*(k+1)|0;[L[k],L[j]]=[L[j],L[k]];}
   for(const e of L){if(out.filter(t=>t.fwy===(e.kind==='fwy')).length>=n)break;const p=polyAt(e.pts,e.len/2,{});if(out.some(t=>Math.hypot(t.x-p.x,t.z-p.z)<minGap))continue;out.push({x:p.x,z:p.z,y:e.kind==='fwy'?p.y??12:W.groundBase(p.x,p.z),tx:p.tx,tz:p.tz,fwy:e.kind==='fwy'});}};
  this.traps=[];pick(W.edges.filter(e=>e.kind==='fwy'&&e.len>160),2,400,this.traps);
  pick(W.edges.filter(e=>e.kind==='street'&&e.len>95&&!e.bridge&&Math.hypot(e.pts[e.pts.length-1].x-e.pts[0].x,e.pts[e.pts.length-1].z-e.pts[0].z)>e.len*.97),3,260,this.traps);
  this.traps.forEach((t,i)=>{t.name=TRAP_NAMES[t.fwy?i:2+(i-2)%3]||('TRAP '+(i+1));t.best=0;t.cool=0;const side=(t.fwy?FWY_HW+.4:RW+.7);t.px=t.x-t.tz*side;t.pz=t.z+t.tx*side;t.py=t.fwy?t.y:W.groundBase(t.px,t.pz);});
  // one instanced mesh for all camera poles (a single draw call)
  const parts=[[new THREE.CylinderGeometry(.09,.11,5.2,8),0,2.6,0,[.32,.33,.35]],[new THREE.BoxGeometry(.5,.38,.8),0,5.25,-.25,[.92,.92,.88]],[new THREE.BoxGeometry(.2,.2,.08),0,5.25,-.68,[.05,.05,.06]],[new THREE.BoxGeometry(.7,.06,.9),0,5.47,-.25,[.25,.25,.27]],[new THREE.BoxGeometry(.5,.9,.3),0,3.1,.12,[.86,.82,.2]]];
  const geos=parts.map(([g,x,y,z,c])=>{g=g.toNonIndexed();g.translate(x,y,z);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set(c,i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));g.deleteAttribute('uv');return g;});
  const pg=mergeG(geos);this.poles=new THREE.InstancedMesh(pg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.4}),this.traps.length);this.poles.castShadow=true;
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);this.traps.forEach((t,i)=>{// camera head faces oncoming traffic across the road
   q.setFromAxisAngle(up,Math.atan2(t.x-t.px,t.z-t.pz)+Math.PI);m.compose(new THREE.Vector3(t.px,t.py,t.pz),q,new THREE.Vector3(1,1,1));this.poles.setMatrixAt(i,m);});
  G.scene.add(this.poles);
  /* ---- graffiti tags: street-facing ground-floor walls, at least 110 m apart ---- */
  const B=W.bld.filter(b=>b.y0<1&&b.h>6&&b.w>7&&b.d>7);const inside=(x,z)=>W.bld.some(b=>Math.abs(x-b.x)<b.w/2+.2&&Math.abs(z-b.z)<b.d/2+.2&&b.y0<2);const cand=[];
  for(const b of B){for(const[nx,nz]of[[1,0],[-1,0],[0,1],[0,-1]]){const fx=nx?b.x+nx*(b.w/2+.06):b.x,fz=nz?b.z+nz*(b.d/2+.06):b.z;
    const ox=fx+nx*3,oz=fz+nz*3;if(inside(ox,oz))continue;const ne=W.nearestEdge(ox,oz,16);if(!ne||ne.e.kind==='fwy'||ne.d>12)continue;if(W.groundBase(ox,oz)>b.y0+1.5)continue;cand.push({x:fx,z:fz,nx,nz,y:b.y0+2.7,len:nx?b.d:b.w});}}
  for(let k=cand.length-1;k>0;k--){const j=R()*(k+1)|0;[cand[k],cand[j]]=[cand[j],cand[k]];}
  this.tags=[];for(const c of cand){if(this.tags.length>=12)break;if(c.len<5)continue;if(this.tags.some(t=>Math.hypot(t.x-c.x,t.z-c.z)<110))continue;if(W.pois.some(p=>Math.hypot(p.x-c.x,p.z-c.z)<25))continue;this.tags.push({...c,found:false});}
  // one 1024x512 atlas (4x3 cells), one merged mesh
  const tex=ctex(1024,512,(x,w,h)=>{x.clearRect(0,0,w,h);const cw=w/4,ch=h/3;TAG_WORDS.forEach((wd,i)=>{const cx=(i%4)*cw+cw/2,cy=(i/4|0)*ch+ch/2,col=TAG_COLS[i%TAG_COLS.length];x.save();x.translate(cx,cy);x.rotate((R()-.5)*.25);x.font=`italic 900 ${wd.length>3?78:96}px Impact, "Arial Black", sans-serif`;x.textAlign='center';x.textBaseline='middle';
    x.lineJoin='round';x.shadowColor=col;x.shadowBlur=22;x.strokeStyle=col;x.lineWidth=14;x.strokeText(wd,0,0);x.shadowBlur=0;x.lineWidth=5;x.strokeStyle='#fff';x.strokeText(wd,0,0);x.fillStyle='rgba(10,10,20,.85)';x.fillText(wd,0,0);
    x.fillStyle=col;for(let d=0;d<5;d++){x.fillRect(-90+R()*180,20+R()*12,2.5,10+R()*30);}x.beginPath();x.arc(cw*.36,-ch*.3,7,0,7);x.fill();x.restore();});});
  tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const pos=[],uv=[],idx=[];this.tags.forEach((t,i)=>{const w=3.4,h=1.6;const rx=-t.nz,rz=t.nx;const u0=(i%4)/4,v1=1-(i/4|0)/3,u1=u0+.25,v0=v1-1/3;const b=pos.length/3;
   for(const[s,v,uu,vv]of[[-1,-1,u0,v0],[1,-1,u1,v0],[1,1,u1,v1],[-1,1,u0,v1]])pos.push(t.x+rx*s*w/2,t.y+v*h/2,t.z+rz*s*w/2),uv.push(uu,vv);idx.push(b,b+1,b+2,b,b+2,b+3);});
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));tg.setIndex(idx);tg.computeBoundingSphere();
  this.tagMat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,side:THREE.DoubleSide,color:new THREE.Color(1.3,1.3,1.3)});
  this.tagMesh=new THREE.Mesh(tg,this.tagMat);this.tagMesh.frustumCulled=false;G.scene.add(this.tagMesh);
  this.reset();}
 reset(){for(const t of this.traps){t.best=0;t.cool=0;}for(const t of this.tags)t.found=false;this.found=0;this.top=0;}
 update(dt,night){const G=this.G,P=G.player,v=P.veh;this.tagMat.color.setScalar(1.05+night*1.4);
  if(v)for(const t of this.traps){t.cool-=dt;if(t.cool>0)continue;if(Math.abs(v.y-t.y)>3.5)continue;const dx=v.x-t.x,dz=v.z-t.z;const along=dx*t.tx+dz*t.tz,across=Math.abs(-dx*t.tz+dz*t.tx);if(Math.abs(along)>2.5||across>(t.fwy?FWY_HW:RW))continue;
   t.cool=3;const kmh=Math.round(v.speed*3.6);G.glow.burst({x:t.px,y:t.py+5.3,z:t.pz},18,3,[new THREE.Color(3,3,3.2)],.5,.18,{});G.snd.play('shutter');this.top=Math.max(this.top,kmh);G.stats.topTrap=this.top;
   if(kmh>t.best&&kmh>=80){const pay=Math.min(600,Math.round((kmh-70)*(t.best?2:3.5)));t.best=kmh;G.stats.trapRecords=(G.stats.trapRecords||0)+1;G.addCash(pay,'SPEED TRAP');G.addRep(kmh>160?3:1);G.hud.toast(`SPEED TRAP · ${t.name} · ${kmh} KM/H · NEW RECORD`,2.4);}
   else G.hud.toast(`SPEED TRAP · ${t.name} · ${kmh} KM/H`+(t.best?` · RECORD ${t.best}`:' · HIT 80 TO SCORE'),2);}
  if((this.tt=(this.tt||0)-dt)>0)return;this.tt=.2;
  for(const t of this.tags){if(t.found)continue;if(Math.hypot(P.x-t.x,P.z-t.z)<9&&Math.abs(P.y-t.y)<5){t.found=true;this.found++;G.stats.tags=this.found;G.snd.play('cp');
    if(this.found>=this.tags.length){G.addCash(1500,'ALL TAGS');G.addRep(20);G.hud.banner('EVERY TAG FOUND','THE WHOLE CITY IS YOUR GALLERY','#ff2f9a',3);}else{G.addCash(100,'NEON TAG');G.addRep(2);G.hud.toast(`NEON TAG ${this.found}/${this.tags.length}`,2);}}}}}

function mergeG(geos){let n=0;for(const g of geos)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
 for(const g of geos){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));return g;}
