// SWELL GUARD — the beach: wet/dry sand terrain, dunes and grass, palms, rocky headlands, distant hills, the lifeguard
// tower (TOWER 7) with flags and gear, swim-zone flags, umbrellas, towels and a baked crowd. Static props are merged per
// material so the whole beach costs a handful of draw calls.
import * as THREE from '../vendor/three.module.min.js';
import {sandY} from './ocean.js';
import {mergeGeometries} from './merge.js';
import {bakePose,POSE,SKIN,HAIR,bodyMaterial,boardGeometry} from './rig.js';
import {sr,srand} from './tex.js';
const V=THREE.Vector3;
export const TOWER={x:0,z:-27};export const ZONE=[-42,42];
const dune=(x,z)=>z<-40?(Math.sin(x*.045)*1.2+Math.sin(x*.11+1)*.6+1.8)*Math.min(1,(-40-z)/14):0;
export const groundY=(x,z)=>sandY(z)+dune(x,z)+(z<0?.05*Math.sin(x*.3+z*.2)*Math.min(1,-z/8):0);
function std(o){return new THREE.MeshStandardMaterial(o);}
function xform(g,x,y,z,ry=0,s=1,rx=0,rz=0){g=g.index?g.toNonIndexed():g.clone();g.scale(s,s,s);g.rotateX(rx);g.rotateZ(rz);g.rotateY(ry);g.translate(x,y,z);return g;}

export function buildWorld(scene,T,q){srand(42);const root=new THREE.Group();scene.add(root);const R={root,flags:[],update:null};
 // ---------- sand ----------
 {const g=new THREE.PlaneGeometry(900,230,q>=1?260:150,q>=1?120:70);g.rotateX(-Math.PI/2);g.translate(0,0,-75);const P=g.attributes.position,uv=g.attributes.uv,n=P.count,wet=new Float32Array(n),col=new Float32Array(n*3);
  for(let i=0;i<n;i++){const x=P.getX(i),z=P.getZ(i);P.setY(i,groundY(x,z));uv.setXY(i,x/7,z/7);const w=Math.min(1,Math.max(0,(z+11)/7));wet[i]=w*w*(3-2*w);
   const m=.92+.08*Math.sin(x*.021+Math.sin(z*.05)*2)+.05*Math.sin(x*.07-z*.09);col[i*3]=m*1.02;col[i*3+1]=m;col[i*3+2]=m*.97;}
  g.setAttribute('wet',new THREE.BufferAttribute(wet,1));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
  const m=std({map:T.sand,normalMap:T.sandN,normalScale:new THREE.Vector2(.35,.35),roughness:.95,vertexColors:true,envMapIntensity:1});m.userData.wetR=q>=1?.07:.55;
  m.onBeforeCompile=sh=>{sh.uniforms.wetR={value:m.userData.wetR};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float wet;varying float vWet;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWet=wet;');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vWet;uniform float wetR;')
    .replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=mix(1.,.5,vWet);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.9,.95,1.),vWet);')
    .replace('#include <roughnessmap_fragment>','float roughnessFactor=mix(roughness,wetR,vWet*vWet);')
    .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(mix(normal,nonPerturbedNormal,vWet*.85));');};
  const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;root.add(mesh);R.sandMat=m;}
 // ---------- headlands + distant hills ----------
 {const rockM=std({map:T.rock,normalMap:T.rockN,roughness:.92,color:0xd8c8b8});const parts=[];
  for(const[sx,len]of[[-1,1],[1,.8]])for(let k=0;k<7;k++){const g=new THREE.IcosahedronGeometry(1,q>=1?4:3);const P=g.attributes.position;
   for(let i=0;i<P.count;i++){const v=new V().fromBufferAttribute(P,i);const n=Math.sin(v.x*3.1+k)*Math.sin(v.y*2.7)*Math.sin(v.z*3.3+k*2)*.18+Math.sin(v.x*7+v.z*5)*.05+Math.abs(Math.sin(v.y*9+k))*.04;v.multiplyScalar(1+n);P.setXYZ(i,v.x,v.y,v.z);}
   g.computeVertexNormals();const t=k/6;const x=sx*(250+t*30+sr()*20),z=-30+t*170*len,s=40-t*16+sr()*10;g.scale(s*(.9+sr()*.4),s*(.55+(1-t)*.35),s*(.9+sr()*.3));g.translate(x,-s*.25+(1-t)*8,z);parts.push(g);}
  const rm=new THREE.Mesh(mergeGeometries(parts),rockM);rm.receiveShadow=true;rm.castShadow=false;root.add(rm);
  // vegetated ridge silhouettes behind the dunes
  const hg=new THREE.PlaneGeometry(1600,120,96,6);const P=hg.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i);const top=60+Math.sin(x*.006)*30+Math.sin(x*.017+1)*14+Math.sin(x*.05)*4;P.setY(i,(y+60)/120*top);P.setZ(i,-(y+60)/120*90);}
  hg.computeVertexNormals();hg.translate(0,-2,-260);const hm=new THREE.Mesh(hg,std({color:0x6c7a52,roughness:1}));root.add(hm);
  const hg2=hg.clone();hg2.scale(1.4,1.6,1);hg2.translate(200,-10,-200);const hm2=new THREE.Mesh(hg2,std({color:0x8a9a9a,roughness:1}));root.add(hm2);}
 // ---------- dune grass + palms ----------
 {const parts=[];const tuft=new THREE.PlaneGeometry(1.2,.8);tuft.translate(0,.4,0);
  for(let i=0;i<(q>=1?520:240);i++){const x=-300+sr()*600,z=-44-sr()*50,s=.7+sr()*.9;for(const r of[0,Math.PI/2]){parts.push(xform(tuft,x,groundY(x,z)-.05,z,r+sr(),s));}}
  const gm=new THREE.Mesh(mergeGeometries(parts),std({map:T.grass,alphaTest:.4,side:THREE.DoubleSide,roughness:1,color:0xc8c090}));root.add(gm);
  const trunks=[],fronds=[];const frond=new THREE.PlaneGeometry(3.4,.9,8,2);{const P=frond.attributes.position;for(let i=0;i<P.count;i++){const X=P.getX(i)+1.7,y=P.getY(i);P.setXYZ(i,X,-X*X*.075-Math.abs(y)*.25,y);}frond.computeVertexNormals();}
  for(const[x,z]of[[-34,-46],[-29,-52],[22,-48],[30,-44],[64,-50],[-80,-49],[-118,-46],[105,-47],[150,-52],[-160,-50],[190,-46],[-200,-47]]){const h=7+sr()*4,bx=x,bz=z,lean=(sr()-.5)*.5;const by=groundY(bx,bz)-.3;const pts=[];
   for(let k=0;k<=10;k++){const t=k/10;pts.push(new V(bx+Math.sin(lean)*t*t*h*.35,by+t*h,bz+t*t*1.4));}const cur=new THREE.CatmullRomCurve3(pts);const tg=new THREE.TubeGeometry(cur,14,.2,7,false);
   const P=tg.attributes.position,uvs=tg.attributes.uv;for(let i=0;i<P.count;i++){const t=uvs.getX(i);const c=cur.getPoint(t);const v=new V().fromBufferAttribute(P,i).sub(c).multiplyScalar(1.25-t*.5+(Math.sin(t*90)*.06));P.setXYZ(i,c.x+v.x,c.y+v.y,c.z+v.z);uvs.setXY(i,uvs.getY(i),t*h*1.6);}
   trunks.push(tg);const top=cur.getPoint(1);for(let f=0;f<11;f++){const a=f/11*Math.PI*2+sr()*.4;const fg=frond.clone();fg.scale(.85+sr()*.4,1,1);fg.rotateZ(.25-sr()*.5);fg.rotateY(a);fg.translate(top.x,top.y,top.z);fronds.push(fg);}}
  const bark=T.timber.clone();bark.repeat.set(1,1);const tm=new THREE.Mesh(mergeGeometries(trunks),std({map:bark,color:0xb0a080,roughness:1}));tm.castShadow=true;root.add(tm);
  const fm=new THREE.Mesh(mergeGeometries(fronds),std({map:T.frond,alphaTest:.45,side:THREE.DoubleSide,roughness:.8}));fm.castShadow=true;root.add(fm);R.fronds=fm;}
 // ---------- lifeguard tower ----------
 {const tx=TOWER.x,tz=TOWER.z,ty=groundY(tx,tz);const wood=[],timb=[],roof=[],glass=[],red=[];const H=2.6;
  // stilts + braces
  for(const[x,z]of[[-1.7,-1.5],[1.7,-1.5],[-1.7,1.5],[1.7,1.5]]){const g=new THREE.BoxGeometry(.24,H+.4,.24);timb.push(xform(g,tx+x,ty+H/2-.2,tz+z));}
  for(const z of[-1.5,1.5]){const b=new THREE.BoxGeometry(.1,.14,4.4);b.rotateY(Math.PI/2);for(const s of[1,-1]){const g=b.clone();g.rotateZ(s*.5);timb.push(xform(g,tx,ty+1.2,tz+z));}}
  // deck with apron toward the sea (+z)
  wood.push(xform(new THREE.BoxGeometry(4.6,.18,5.4),tx,ty+H,tz+.5));
  // cabin: walls, corner posts, window bands
  const cw=3.6,cd=3.2,ch=2.2,cy=ty+H+.09;for(const[x,z,w,d]of[[0,-cd/2,cw,.12],[-cw/2,0,.12,cd],[cw/2,0,.12,cd]]){wood.push(xform(new THREE.BoxGeometry(w,ch*.45,d),tx+x,cy+ch*.225,tz-.4+z));wood.push(xform(new THREE.BoxGeometry(w,.25,d),tx+x,cy+ch-.12,tz-.4+z));}
  wood.push(xform(new THREE.BoxGeometry(cw,ch*.45,.12),tx,cy+ch*.225,tz-.4+cd/2));wood.push(xform(new THREE.BoxGeometry(cw,.25,.12),tx,cy+ch-.12,tz-.4+cd/2));
  for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])red.push(xform(new THREE.BoxGeometry(.16,ch,.16),tx+x*cw/2,cy+ch/2,tz-.4+z*cd/2));
  red.push(xform(new THREE.BoxGeometry(.14,ch*.55,.14),tx,cy+ch*.72,tz-.4+cd/2));
  for(const[x,z,w,d]of[[0,cd/2,cw-.2,.03],[0,-cd/2,cw-.2,.03],[-cw/2,0,.03,cd-.2],[cw/2,0,.03,cd-.2]])glass.push(xform(new THREE.BoxGeometry(w,ch*.42,d),tx+x,cy+ch*.66,tz-.4+z));
  // hip roof with overhang
  {const rg=new THREE.ConeGeometry(3.4,1.3,4,1);rg.rotateY(Math.PI/4);rg.scale(1.1,1,1);roof.push(xform(rg,tx,cy+ch+.65,tz-.4));roof.push(xform(new THREE.BoxGeometry(4.9,.12,4.5),tx,cy+ch+.02,tz-.4));}
  // railing on the apron
  for(let i=0;i<=8;i++){const x=-2.2+i*.55;red.push(xform(new THREE.BoxGeometry(.06,.9,.06),tx+x,ty+H+.5,tz+3.1));}red.push(xform(new THREE.BoxGeometry(4.5,.08,.08),tx,ty+H+.95,tz+3.1));
  for(const s of[-1,1]){for(let i=0;i<4;i++)red.push(xform(new THREE.BoxGeometry(.06,.9,.06),tx+s*2.25,ty+H+.5,tz+1.4+i*.55));red.push(xform(new THREE.BoxGeometry(.08,.08,1.8),tx+s*2.25,ty+H+.95,tz+2.2));}
  // ramp down to the sand (seaward side, angled)
  {const rl=6.2,ang=Math.atan2(H,rl-.5);const rg=new THREE.BoxGeometry(1.2,.12,rl);rg.rotateX(-ang);wood.push(xform(rg,tx+2.95,ty+H/2,tz+3.0-rl/2+2.6,0));
   for(let i=0;i<10;i++)timb.push(xform(new THREE.BoxGeometry(1.2,.05,.08),tx+2.95,ty+H*(i/10)+.06,tz+3-rl/2+2.6+(i/10-.5)*rl*.98*-1));
   for(const s of[-1,1]){const hg=new THREE.BoxGeometry(.06,.08,rl);hg.rotateX(-ang);red.push(xform(hg,tx+2.95+s*.6,ty+H/2+.85,tz+3.0-rl/2+2.6));}}
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.6),std({map:T.sign,roughness:.6}));sign.position.set(tx,cy+ch-.12,tz-.4+cd/2+.08);
  const mats={wood:std({map:T.wood,roughness:.75,color:0xf6f4ee}),timb:std({map:T.timber,roughness:.95}),roof:std({color:0x2a7da6,roughness:.45,metalness:.3}),glass:new THREE.MeshPhysicalMaterial({color:0x1b2a33,roughness:.05,metalness:.1,clearcoat:1,envMapIntensity:1.6}),red:std({color:0xc8261c,roughness:.5})};
  for(const[k,arr]of Object.entries({wood,timb,roof,glass,red})){const list=arr.filter(Boolean);if(!list.length)continue;const m=new THREE.Mesh(mergeGeometries(list),mats[k]);m.castShadow=m.receiveShadow=true;root.add(m);}
  root.add(sign);
  // rescue cans on hooks, a board rack with two rescue boards, binocular box
  const cans=[];for(let i=0;i<3;i++){const c=new THREE.CapsuleGeometry(.11,.55,3,8);c.rotateZ(.08);cans.push(xform(c,tx-1.3+i*.35,ty+H-.75,tz+3.08));}
  const cm=new THREE.Mesh(mergeGeometries(cans),std({color:0xff5a14,roughness:.35}));cm.castShadow=true;root.add(cm);
  const rack=[];for(const x of[-.7,.7])rack.push(xform(new THREE.BoxGeometry(.1,1.4,.1),tx-5+x,ty+.7,tz+1));rack.push(xform(new THREE.BoxGeometry(1.6,.08,.12),tx-5,ty+1.25,tz+1),xform(new THREE.BoxGeometry(1.6,.08,.12),tx-5,ty+.75,tz+1));
  root.add(Object.assign(new THREE.Mesh(mergeGeometries(rack),mats.timb),{castShadow:true}));
  const bg=boardGeometry(2.9,.6,.11);const brd=[xform(bg,tx-5,ty+1.35,tz+1,Math.PI/2,1,0,Math.PI/2*0),xform(bg,tx-5,ty+.86,tz+1,Math.PI/2)];
  const bm=new THREE.Mesh(mergeGeometries(brd),std({color:0xffd21f,roughness:.3}));bm.castShadow=true;root.add(bm);
  // flag poles: tower status flag + swim zone flags at the water
  const poleG=[];const fl=(x,z,h,row)=>{const y=groundY(x,z);poleG.push(xform(new THREE.CylinderGeometry(.045,.06,h,6),x,y+h/2,z));const g=new THREE.PlaneGeometry(1.4,.9,10,4);g.translate(.7,0,0);const m=new THREE.Mesh(g,R.flagMat);m.position.set(x+.05,y+h-.5,z);root.add(m);const f={mesh:m,row};R.flags.push(f);setRow(f,row);return f;};
  R.flagMat=std({map:T.flags,side:THREE.DoubleSide,roughness:.85});R.flagT={value:0};R.flagMat.onBeforeCompile=sh=>{sh.uniforms.fT=R.flagT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float fT;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat fx=position.x/1.4;transformed.z+=sin(fx*5.-fT*7.+position.y*2.)*.16*fx;transformed.y+=sin(fx*4.-fT*6.)*.04*fx-fx*fx*.08;');};
  const setRow=(f,row)=>{const g=f.mesh.geometry,uv=g.attributes.uv;const base=g.userData.uv0||(g.userData.uv0=uv.array.slice());for(let i=0;i<uv.count;i++){uv.setY(i,1-(row+1-base[i*2+1])/5);}uv.needsUpdate=true;f.row=row;};
  R.setFlag=setRow;R.towerFlag=fl(tx+2.2,tz-2,9.5,0);R.zoneFlags=[fl(ZONE[0],-5,4,0),fl(ZONE[1],-5,4,0)];
  const pm=new THREE.Mesh(mergeGeometries(poleG),std({color:0xd8d8d8,roughness:.3,metalness:.8}));pm.castShadow=true;root.add(pm);
  R.towerTop=new V(tx,cy+1,tz+2.2);R.towerBase=new V(tx+2.95,ty,tz+6);}
 // ---------- umbrellas, towels, coolers, crowd ----------
 {const can=[],pole=[],tow=[],cool=[],ppl=[];const spots=[];
  const umb=new THREE.ConeGeometry(1.25,.5,8,1,true);{const uv=umb.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i),uv.getY(i)*.12);}
  const towel=new THREE.PlaneGeometry(.9,1.9);towel.rotateX(-Math.PI/2);
  const looks=[];for(let i=0;i<10;i++){const fem=sr()<.5;looks.push({skin:SKIN[sr()*5|0],hair:HAIR[sr()*6|0],shorts:['#2d5fa0','#d84a3a','#1f8a6a','#f0b429','#e46b8a','#222','#7b4fbf','#ff8a3d'][sr()*8|0],top:fem?'suit':(sr()<.3?'tee':'none'),topC:['#e94f37','#1c3144','#44bba4','#f6f7eb','#ffba08'][sr()*5|0],female:fem,long:fem&&sr()<.7,cap:sr()<.15?'#f4f0e8':null,glasses:sr()<.3});}
  const baked={};const bk=(li,p)=>{const k=li+p;if(!baked[k])baked[k]=bakePose(looks[li],POSE[p](0),q>=2?.6:.4);return baked[k];};
  for(let i=0;i<(q>=1?150:90);i++){const x=-210+sr()*420,z=-36+sr()*26;if(Math.abs(x-TOWER.x)<9&&z<-14)continue;if(Math.abs(x)<60&&sr()<.25)continue;spots.push([x,z]);}
  // denser near the flags
  for(let i=0;i<(q>=1?40:24);i++){const x=-55+sr()*110,z=-30+sr()*18;if(Math.abs(x-TOWER.x)<9&&z<-16)continue;spots.push([x,z]);}
  for(const[x,z]of spots){const y=groundY(x,z),ry=sr()*6.28,k=sr();
   if(k<.42){const r=sr()*8|0;const c=xform(umb,0,0,0);const uv=c.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)+(7-r)/8);c.rotateX(.18*(sr()-.5));c.translate(x,y+2.1,z);can.push(c);pole.push(xform(new THREE.CylinderGeometry(.025,.025,2.2,5),x,y+1.1,z));}
   if(k<.85){const tw=xform(towel,x+Math.cos(ry)*.9,y+.02,z+Math.sin(ry)*.9,ry);const uv=tw.attributes.uv,c=sr()*16|0;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.25+(c%4)*.25,uv.getY(i)*.25+(c>>2)*.25);tow.push(tw);
    if(sr()<.75){const li=sr()*looks.length|0,p=['lie','lieFront','beachSit'][sr()*3|0];ppl.push(xform(bk(li,p),x+Math.cos(ry)*.9,y+.02,z+Math.sin(ry)*.9,p==='beachSit'?(sr()-.5)*.9:ry));}}
   else if(k<.95){cool.push(xform(new THREE.BoxGeometry(.6,.4,.4),x,y+.2,z,ry));}
   else{const li=sr()*looks.length|0;ppl.push(xform(bk(li,'stand'),x,y,z,sr()*6.28));}}
  const mk=(arr,m,cs=true)=>{if(!arr.length)return;const mesh=new THREE.Mesh(mergeGeometries(arr),m);mesh.castShadow=cs;mesh.receiveShadow=true;root.add(mesh);return mesh;};
  mk(can,std({map:T.umb,side:THREE.DoubleSide,roughness:.8}));mk(pole,std({color:0xe8e8e8,roughness:.4,metalness:.6}));mk(tow,std({map:T.towel,roughness:1}),false);mk(cool,std({color:0x2f8fd0,roughness:.4}));
  R.crowd=mk(ppl,bodyMaterial());}
 R.update=(t)=>{R.flagT.value=t;};
 return R;}
