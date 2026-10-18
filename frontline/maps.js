// FRONTLINE OPS — four original battlegrounds, each with its own place and time of day.
import * as THREE from '../vendor/three.module.min.js';
import {Level} from './world.js';
const PI=Math.PI,H=PI/2;

// lighting / atmosphere per time of day (tuned for readable silhouettes, no murk)
export const LOOK={
 noon:{name:'HIGH NOON',sky:{top:0x3a7ccc,mid:0x8cb8e6,hor:0xe8dfcf,cloud:0xffffff,clouds:.32,sunK:1.1,ground:0xd8c8a8},sun:{dir:[.42,.84,.34],c:0xfff0dc,i:3.3},hemi:{s:0xc8def6,g:0xc8a878,i:1.2},fog:{c:0xe4d8c4,d:.0042},exp:.9,tint:0xfff8f0,sat:1.08,env:.75,amb:'wind',grime:0x6a5236,dust:1.1},
 golden:{name:'GOLDEN HOUR',sky:{top:0x30508e,mid:0xc28a78,hor:0xffc28a,cloud:0xffd2b0,clouds:.42,sunK:1.5,ground:0x8a6a58,sunSize:.0013},sun:{dir:[-.72,.3,-.62],c:0xffb27a,i:3.4},hemi:{s:0xb8cae8,g:0x8a6a56,i:1.75},fog:{c:0xe6b896,d:.0045},exp:1.05,tint:0xfff2e6,sat:1.08,env:.85,amb:'harbor',grime:0x4a3a30,dust:.9},
 snow:{name:'COLD MORNING',sky:{top:0x3a76c4,mid:0x9ec2e8,hor:0xe8eff7,cloud:0xffffff,clouds:.5,sunK:1.05,ground:0xdfe8f2},sun:{dir:[.58,.44,-.68],c:0xffe6c8,i:2.9},hemi:{s:0xd4e4ff,g:0x9ea8b8,i:1.05},fog:{c:0xdde6f0,d:.0045},exp:.78,tint:0xf6f8ff,sat:1.04,env:.8,amb:'snow',grime:0x3a3c40,dust:.7},
 dusk:{name:'BLUE HOUR',sky:{top:0x22305e,mid:0x6c5e94,hor:0xff9c6a,cloud:0xb090b0,clouds:.38,sunK:1.3,ground:0x3a3040,sunSize:.0016},sun:{dir:[.86,.12,.42],c:0xffa068,i:2.2},hemi:{s:0xa4b0e6,g:0x54444c,i:1.55},fog:{c:0x84769a,d:.0072},exp:1.18,tint:0xf6eeff,sat:1.06,env:.65,lampsOn:true,amb:'town',grime:0x3a3a34,dust:.6}};

// splat map (R = path texture, G = alt texture) painted in world space
function splat(L,draw){const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,S,S);const k=S/(L.half*2);
 x.setTransform(k,0,0,k,L.half*k,L.half*k);draw(x);x.setTransform(1,0,0,1,0,0);x.filter='blur(2px)';x.drawImage(c,0,0);x.filter='none';
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;L.splatTex=t;}
const R_=(x,cx,cz,w,d,col)=>{x.fillStyle=col;x.fillRect(cx-w/2,cz-d/2,w,d);},C_=(x,cx,cz,r,col)=>{x.fillStyle=col;x.beginPath();x.arc(cx,cz,r,0,7);x.fill();};
function scatter(L,kind,n,x0,z0,x1,z1,avoid=[],o={}){for(let i=0;i<n;i++){for(let k=0;k<10;k++){const x=x0+L.rnd()*(x1-x0),z=z0+L.rnd()*(z1-z0);if(avoid.some(r=>x>r[0]&&x<r[2]&&z>r[1]&&z<r[3]))continue;if(L.boxes.some(b=>b.solid&&x>b.x0-1.6&&x<b.x1+1.6&&z>b.z0-1.6&&z<b.z1+1.6))continue;
 L.prop(kind,x,z,L.rnd()*6.28,{free:true,s:o.s?o.s[0]+L.rnd()*(o.s[1]-o.s[0]):1,solid:o.solid,col:o.col});break;}}}
function crates(L,x,z,n=3){const k=['crate','crate','crateS','crateL','barrel'];for(let i=0;i<n;i++){const t=k[(L.rnd()*k.length)|0];L.prop(t,x+(i%2)*1.35-(n>2?.6:0),z+((i/2)|0)*1.35,0,{jit:(L.rnd()-.5)*.25,col:t==='barrel'?[0x4a6a3a,0xa83a2a,0x2a5a8a][i%3]:undefined});}
 if(n>2&&L.rnd()<.6)L.prop('crateS',x,z,0,{y0:1.2,jit:.3});}
const lane=(L,cx,cz,len,w,rot=0,kind='asphalt',lines=null)=>L.roads.push({x:cx,z:cz,w,len,rot,kind,lines});

/* ===================== SANDGATE — walled desert market town, high noon ===================== */
function sandgate(){const L=new Level({id:'sandgate',name:'SANDGATE',half:60,look:LOOK.noon,terrain:{base:'sand',alt:'dirt',path:'slab',altK:.45,height:16,ramp:50,dunes:true,far:{h:40,c:0xd8c0a0}},leafCol:0xa8b880,rockCol:0xc8a882,grassCol:0xc8b888});L._s=771;
 const SW=0xd8c09a,P=[0xf2ead8,0xeadcc0,0xe2cca8,0xf0e2cc,0xd8c4a4,0xeee4d4],SH=[1,2],AW=[0xc84a2a,0x2a6ab0,0xd8a030,0x3a8a6a,0x8a3a8a];let ci=0;
 const b=(x0,z0,x1,z1,h,doors,o={})=>{ci++;return L.building(x0,z0,x1,z1,h,{mat:o.mat||(ci%4===2?'stone':'plaster'),col:o.col??(ci%4===2?SW:P[ci%P.length]),trim:0xf4ecdc,doors,shut:SH[ci%2],lit:.08,dens:.75,plinth:0xb8a07c,...o});};
 // town walls with gates
 const tw={mat:'stone',col:SW};L.wallGaps(-56,-56,56,-56,4.6,[[56,7]],.9,tw);L.wallGaps(-56,56,56,56,4.6,[[56,7]],.9,tw);L.wallGaps(-56,-56,-56,56,4.6,[[60,5]],.9,tw);L.wallGaps(56,-56,56,56,4.6,[[48,5]],.9,tw);
 for(const[x,z]of[[-56,-56],[56,-56],[-56,56],[56,56],[-4.5,-56],[4.5,-56],[-4.5,56],[4.5,56]])L.boxC(x,z,2.6,2.6,6,{mat:'stone',col:0xcfb48a});
 // south rows (team A side)
 b(-50,30,-38,46,6,{e:[[8,1.8]],n:[[6,1.8]]},{awn:[['n',6,4,AW[0]]]});b(-33,32,-19,44,5,{n:[[7,1.8]],w:[[6,1.8]]},{awn:[['n',4,5,AW[1]]],roof:'dome'});b(-14,30,-6,42,7.4,{n:[[4,1.8]],e:[[5,1.8]]});
 b(6,30,16,42,5,{n:[[5,1.8]],w:[[7,1.8]]},{awn:[['n',5,6,AW[2]]]});b(20,32,34,46,6.4,{n:[[7,1.8]],e:[[6,1.8]]});b(38,30,50,44,4.6,{n:[[6,1.8]],w:[[6,1.8]]},{awn:[['n',6,8,AW[3]]]});
 // plaza rows
 b(-30,14,-18,24,5.2,{e:[[5,1.8]],s:[[6,1.8]]},{awn:[['e',5,6,AW[4]]]});b(18,14,30,24,6.2,{w:[[5,1.8]],s:[[6,1.8]]});
 b(-30,-24,-18,-14,6,{e:[[5,1.8]],n:[[6,1.8]]});b(18,-24,30,-14,5,{w:[[5,1.8]],n:[[6,1.8]]},{awn:[['w',5,6,AW[1]]]});
 b(-30,-6,-21,6,4.6,{e:[[6,1.8]],w:[[6,1.8]]},{roof:'dome'});b(21,-6,30,6,6.6,{w:[[6,1.8]],e:[[6,1.8]]});
 // north rows (team B side)
 b(-50,-46,-38,-30,5.6,{s:[[6,1.8]],e:[[8,1.8]]});b(-33,-44,-19,-32,6.2,{s:[[7,1.8]]},{awn:[['s',7,5,AW[0]]]});b(-14,-42,-6,-30,4.6,{s:[[4,1.8]],e:[[5,1.8]]});
 b(6,-42,16,-30,7.2,{s:[[5,1.8]],w:[[6,1.8]]});b(20,-46,34,-34,5,{s:[[7,1.8]]},{awn:[['s',7,6,AW[2]]],roof:'dome'});
 // west courtyard: old bathhouse + walled garden (flag A)
 b(-53,-14,-41,-2,5.2,{e:[[6,2.2]],n:[[6,1.8]]},{roof:'dome',mat:'stone',col:0xdcc6a0});
 L.wall(-41,10,-41,22,1.3,.5,{mat:'stone',col:SW});L.wall(-53,22,-45,22,1.3,.5,{mat:'stone',col:SW});L.wall(-34,4,-34,12,1.2,.5,{mat:'stone',col:SW});
 for(const[x,z]of[[-49,6],[-47,16],[-38,-10],[-52,26],[-36,20]])L.prop('palm',x,z,L.rnd()*6,{free:true,s:.9+L.rnd()*.3});
 crates(L,-45,4,3);L.sandbags(-40,0,-36,0);L.prop('stall',-48,10,H);
 // east: fuel stop + garage (flag C)
 L.building(44,-26,54,-12,5.4,{mat:'concrete',col:0xe8e2d6,doors:{w:[[7,4.2]],n:[[5,1.8]]},dh:3.8,trim:0xc83a2a,lit:0,shut:null});
 for(const[x,z]of[[35,-4],[45,-4],[35,6],[45,6]])L.boxC(x,z,.35,.35,4.2,{mat:'trim',col:0xe8e8e8});L.box(33.5,-5.5,46.5,7.5,.35,{y0:4.2,mat:'trim',col:0xd83a2a,solid:false});L.box(33.3,-5.7,46.7,7.7,.12,{y0:4.55,mat:'trim',col:0xf4f4f4,solid:false});
 L.boxC(38,1,.8,1.4,1.6,{mat:'trim',col:0xd8d8d0});L.boxC(42,1,.8,1.4,1.6,{mat:'trim',col:0xd8d8d0});L.signs.push({text:'FUEL · 24H',bg:'#c83a2a',fg:'#fff',x:40,y:4.4,z:7.72,w:5,ry:0});
 L.prop('pickup',37,10,H,{col:0xe8e4da});L.prop('pickup',50,-8,0,{col:0x8a4a2a});L.prop('fueltank',51,14,0,{col:0xe8e0d0});L.prop('fueltank',51,21,0,{col:0xd8d0c0});L.prop('tires',39,-10,0);L.prop('barrel',47,-1,0,{col:0xc83a2a});L.prop('barrel',47.8,-.2,0,{col:0x2a5a8a});
 // plaza (flag B): fountain, stalls, palms, sandbag nest
 L.boxC(0,0,5,5,.7,{mat:'stone',col:0xe0cca8});L.boxC(0,0,1.4,1.4,2.2,{mat:'stone',col:0xd4bc94});L.paint.push({x:0,z:0,w:4.2,d:4.2,c:0x3a8aa0});
 for(const[x,z,r]of[[-10,-7,0],[-6,-8,0],[6,-8,0],[10,-7,0],[-10,8,PI],[10,8,PI]])L.prop('stall',x,z,r);
 for(const[x,z]of[[-12.5,-11],[12.5,-11],[-12.5,11],[12.5,11]])L.prop('palm',x,z,L.rnd()*6,{free:true,s:1.05});
 crates(L,-4,11,2);crates(L,7,12.5,2);L.prop('car',-2.5,22,0.1,{col:0x2a6ab0});L.prop('wreck',2.6,-22,PI+.2);
 // main street clutter
 L.jersey(-3,46,3,46);L.jersey(-3,-46,3,-46);L.prop('jeep',-9,50,H+.1,{col:0xb8a478});L.prop('truck',10,51,H,{col:0xc8b48a});L.prop('truck',-10,-51,-H,{col:0x8a7a5a});L.prop('jeep',12,-50,-H,{col:0x6a6e5a});
 L.sandbags(-6,27,-2,27);L.sandbags(2,-27,6,-27);L.sandbags(-38,-27,-34,-27);L.sandbags(34,27,38,27);
 crates(L,-24,27,3);crates(L,24,-28,3);crates(L,-46,-26,2);crates(L,46,26,2);crates(L,-10,-26,2);crates(L,12,26,2);crates(L,30,-50,3);crates(L,-30,50,3);
 for(const[x,z]of[[-36,28],[36,-28],[-18,-50],[18,50],[-52,-50],[52,50]])L.prop('barrel',x,z,0,{col:[0x4a6a3a,0xa83a2a,0x2a5a8a][(x+z)&1]});
 for(const[x,z]of[[-30,49],[24,-52],[-46,-52],[50,52],[-16,10],[16,-10]])L.prop('palm',x,z,L.rnd()*6,{free:true,s:.85+L.rnd()*.3});
 L.prop('car',-36,-2,0,{col:0xe8e0d0});L.prop('car',33,18,H,{col:0x3a3a40});
 for(const[x,z,r]of[[-4.6,-18,0],[4.6,18,PI],[-4.6,36,0],[4.6,-36,PI]])L.lamp(x,z,r,false);
 // outside the walls: dunes, shrubs, rocks
 for(let i=0;i<40;i++){const a=L.rnd()*6.28,r=66+L.rnd()*60;L.props.push({kind:L.rnd()<.5?'shrub':'rock',x:Math.cos(a)*r,z:Math.sin(a)*r,y:0,rot:L.rnd()*6,s:.8+L.rnd()*1.2,col:null});}
 for(let i=0;i<10;i++){const a=L.rnd()*6.28,r=70+L.rnd()*40;L.props.push({kind:'palm',x:Math.cos(a)*r,z:Math.sin(a)*r,y:0,rot:L.rnd()*6,s:.9+L.rnd()*.4,col:null});}
 scatter(L,'shrub',22,-55,-55,55,55,[[-15,-12,15,12],[-6,-56,6,56],[-56,22,56,31],[-56,-31,56,-22],[-56,46,56,56],[-56,-56,56,-46]],{s:[.4,.8]});
 splat(L,x=>{R_(x,0,0,9,112,'#f00');R_(x,0,26,112,6,'#f00');R_(x,0,-27,112,6,'#f00');C_(x,0,0,15,'#f00');R_(x,-40,8,14,30,'#0f0');R_(x,40,0,16,22,'#f00');R_(x,0,51,112,8,'#0f0');R_(x,0,-51,112,8,'#0f0');});
 L.spawns.a=[[0,51],[-8,51],[8,51],[-16,51],[16,51],[-26,51],[26,51],[-36,51],[36,51],[-46,51],[46,51]];
 L.spawns.b=[[0,-51],[-8,-51],[8,-51],[-16,-51],[16,-51],[-26,-51],[26,-51],[-38,-51],[38,-51],[-48,-51],[46,-51]];
 L.flags=[{id:'A',x:-38,z:8},{id:'B',x:0,z:7},{id:'C',x:40,z:-1}];
 L.pts={start:{x:-44,z:50,yaw:PI},safe:{x:-44,z:38},vip:{x:-44,z:40},plaza:{x:0,z:3},lz:{x:0,z:-50},gate:{x:0,z:-56}};L.pads.push({x:0,z:-50,r:5});
 L.hot=[[0,0],[0,26],[0,-27],[-38,8],[40,0],[-25,0],[25,0],[-36,-27],[36,27],[-24,27],[24,-27],[0,40],[0,-40]];
 L.finalize();return L;}

/* ===================== HARBOR 9 — container port at golden hour ===================== */
function harbor(){const L=new Level({id:'harbor',name:'HARBOR 9',half:60,look:LOOK.golden,terrain:{base:'slab',alt:'asphalt',path:'gravel',altK:.35,height:24,ramp:70,seaSide:(x,z)=>x<-62||z<-66,water:{c:0x1e4a5c,y:-1.4},far:{h:30,c:0x8a6a6a}},leafCol:0x98a870,rockCol:0x9a948a,grassCol:0xb8b088});L._s=4242;
 const CC=[0xb8442e,0x2a5a8a,0x2e7a6a,0xd8a032,0xe8e4dc,0x8a3a5a,0x5a6a7a,0xc86a2a,0x3a4a8a];let k=0;const cc=()=>CC[(k++*7)%CC.length];
 // quay edge + bollards + ship
 L.box(-61,-60,-59.6,60,2.5,{mat:'concrete',col:0xc8c4bc,y0:-2.5,solid:false});L.box(-59.6,-60,-58.6,60,.12,{mat:'trim',col:0xe8c020,solid:false});
 for(let z=-50;z<=50;z+=10)L.prop('bollard',-57.5,z,0);
 L.box(-95,-55,-68,40,10,{mat:'metal',col:0x2a3a52,y0:-3,solid:false});L.box(-95,-55,-68,40,1.4,{mat:'metal',col:0xa83a2a,y0:-3,solid:false});L.box(-92,-50,-71,-30,9,{mat:'plaster',col:0xe8e8e8,y0:7,solid:false});L.box(-90,-46,-73,-34,3,{mat:'trim',col:0x2a2e34,y0:16,solid:false});
 for(let z=-24;z<36;z+=6.6)for(let s=0;s<2;s++)L.box(-93,z,-70,z+6.06,2.59,{mat:'metal',col:cc(),y0:7+s*2.6,solid:false});
 L.signs.push({text:'HARBOR 9',bg:'#1e2a3a',fg:'#f0e6d0',x:-67.9,y:4,z:-10,w:16,ry:H});
 // container rows (lanes run east-west)
 const row=(z,x0,x1,two)=>{for(let x=x0;x<=x1;x+=6.5){const c=L.container(x,z,false,cc());if(two&&L.rnd()<two)L.container(x,z,false,cc(),2.6);}};
 row(-31,-38,-12,.55);row(-27.4,-38,-25,.2);row(-31,12,24,.5);row(31,-38,-12,.5);row(27.4,-25,-12,.25);row(31,12,24,.55);
 row(-14,-44,-31,.5);row(14,-44,-31,.5);row(-14,18,24,.4);row(14,18,24,.4);
 L.container(-20,-6,true,cc());L.container(-20,-6,true,cc(),2.6);L.container(-20,6,true,cc());L.container(20,-6,true,cc());L.container(20,6,true,cc());L.container(20,6,true,cc(),2.6);
 L.container(-48,-40,true,cc());L.container(-48,40,true,cc());L.container(-45.4,40,true,cc());
 // gantry crane straddling the middle (flag B underneath)
 const cy=0xe8b020;for(const[x,z]of[[-11,-9],[11,-9],[-11,9],[11,9]])L.boxC(x,z,1,1,19,{mat:'trim',col:cy});
 L.box(-12,-9.6,12,-8.4,1.4,{y0:19,mat:'trim',col:cy,solid:false});L.box(-12,8.4,12,9.6,1.4,{y0:19,mat:'trim',col:cy,solid:false});for(const x of[-11,11])L.box(x-.6,-9,x+.6,9,1.2,{y0:19.2,mat:'trim',col:cy,solid:false});
 L.box(-11.6,-9.6,-10.4,9.6,.6,{y0:1,mat:'trim',col:cy,solid:false});L.box(10.4,-9.6,11.6,9.6,.6,{y0:1,mat:'trim',col:cy,solid:false});
 L.box(-2,-3,2,3,2.2,{y0:16.6,mat:'trim',col:0x3a3e44,solid:false});L.box(-1.5,-2.5,1.5,2.5,.3,{y0:16.3,mat:'trim',col:0x222428,solid:false});
 L.container(0,0,false,0xd8a032,6);L.paint.push({x:0,z:0,w:18,d:14,c:0x504a40});
 crates(L,-5,-5,2);crates(L,5,4,3);L.prop('forklift',6,-4,PI);L.prop('pallet',-6,4,0);L.prop('pallet',-7.4,4,0,{y0:0});
 // warehouse east (flag C inside)
 L.building(30,-30,54,-6,8.5,{mat:'metal',col:0x7a8a96,doors:{w:[[12,6]],s:[[6,2.2],[18,2.2]],n:[[12,4]]},dh:4.6,trim:0x3a4a56,lit:0,dens:.45,plinth:0x6a6e72,clutter:false,parapet:false});
 L.signs.push({text:'WAREHOUSE 4',bg:'#e8e4d8',fg:'#2a3a4a',x:29.8,y:7,z:-18,w:9,ry:-H});
 crates(L,36,-26,3);crates(L,48,-10,3);L.prop('crateL',38,-12,0);L.prop('crateL',46,-22,H);L.prop('forklift',42,-14,H);for(const[x,z]of[[34,-12],[50,-26],[44,-28]])L.prop('pallet',x,z,0);L.prop('cable',47,-17,0);
 // harbour office south-east
 L.building(30,20,50,34,7,{mat:'concrete',col:0xe8e4dc,doors:{w:[[7,1.8]],n:[[10,1.8]]},trim:0x2a5a8a,lit:.15,dens:.95,plinth:0x8a8a8a});L.signs.push({text:'PORT AUTHORITY',bg:'#2a5a8a',fg:'#fff',x:40,y:5.6,z:19.78,w:10,ry:PI});
 L.prop('car',36,40,H,{col:0xe8e8e8});L.prop('car',44,40,H,{col:0x2a2a30});L.prop('pickup',52,8,0,{col:0x8a2a2a});
 // pier yard west (flag A)
 L.building(-54,-6,-42,4,4.2,{mat:'metal',col:0xc8c0b0,doors:{e:[[5,2.4]]},trim:0x8a3a2a,lit:0,clutter:false});
 crates(L,-44,10,3);crates(L,-52,18,2);L.prop('crateL',-38,20,H);L.prop('cable',-50,26,0);L.prop('cable',-47.6,26,0);L.prop('forklift',-36,10,0);for(const[x,z]of[[-40,-8],[-41.5,-8],[-38,24]])L.prop('pallet',x,z,0);
 L.sandbags(-34,-2,-34,4);L.prop('barrier',-30,16,0);L.prop('barrier',-30,-16,0);
 // spawns' clutter
 L.prop('truck',-20,51,H,{col:0x2a5a8a});L.prop('tanker',20,-51,H,{col:0xe8e8e8});L.jersey(-10,46,2,46);L.jersey(-2,-46,10,-46);
 crates(L,-30,46,2);crates(L,30,-46,2);crates(L,8,46,2);crates(L,-8,-46,2);
 for(const[x,z]of[[-24,0],[24,0],[0,-20],[0,20],[-34,-40],[34,40]])L.prop('barrel',x,z,0,{col:[0x2a5a8a,0xa83a2a][(x>0)|0]});
 for(const[x,z]of[[-30,0],[30,0]])L.prop('cone',x,z,0);
 L.fence(58,-58,58,58);L.fence(-58,58,58,58);L.fence(-58,-58,58,-58);
 for(const[x,z,r]of[[-31.6,-22,0],[31.6,22,PI],[-31.6,22,0],[31.6,-22,PI],[-52,-22,0],[52,12,PI]])L.lamp(x,z,r,false);
 // light towers + wires
 lane(L,0,40,120,8,H,'asphalt',0xe8e0c8);lane(L,0,-40,120,8,H,'asphalt',0xe8e0c8);lane(L,-27,0,60,7,0,'asphalt',0xe8e0c8);lane(L,27,0,60,7,0,'asphalt',0xe8e0c8);
 for(let i=0;i<14;i++){L.props.push({kind:'tree',x:70+L.rnd()*50,z:-60+L.rnd()*120,y:0,rot:L.rnd()*6,s:1+L.rnd()*.5,col:null});}
 splat(L,x=>{R_(x,-50,0,18,110,'#0f0');R_(x,0,0,26,24,'#f00');R_(x,42,-18,30,30,'#0f0');});
 L.spawns.a=[[0,51],[-8,51],[8,51],[-16,51],[16,51],[-26,52],[26,52],[-36,51],[36,50],[-46,50],[46,51]];
 L.spawns.b=[[0,-51],[-8,-51],[8,-51],[-16,-52],[16,-52],[-26,-51],[26,-51],[-36,-51],[36,-50],[-46,-50],[46,-51]];
 L.flags=[{id:'A',x:-44,z:4},{id:'B',x:0,z:-5},{id:'C',x:42,z:-18}];
 L.pts={start:{x:-46,z:50,yaw:PI},c1:{x:-37.5,z:16.4},c2:{x:22.6,z:-6},c3:{x:-18.5,z:25},up:{x:42,z:-18},lz:{x:0,z:42}};L.pads.push({x:0,z:42,r:5});
 L.hot=[[0,0],[-44,4],[42,-18],[-27,0],[27,0],[0,40],[0,-40],[-27,-22],[27,22],[-40,-22],[40,22],[0,-22],[0,22]];
 L.finalize();return L;}

/* ===================== NORTHWATCH — snowbound radar station, cold morning ===================== */
function northwatch(){const L=new Level({id:'northwatch',name:'NORTHWATCH',half:60,look:LOOK.snow,terrain:{base:'snow',alt:'snow',path:'gravel',altK:.3,height:48,ramp:90,far:{h:90,c:0xc8d4e4}},snowTrees:true,pineCol:0x86a890,rockCol:0xc4c8d0,grassCol:0xa8a890});L._s=909;
 const RED=0xb83a2a,OR=0xd8742a,WH=0xe8ecf0;
 // perimeter fence with gates
 L.fence(-57,-54,-4,-54);L.fence(4,-54,57,-54);L.fence(-57,54,-4,54);L.fence(4,54,57,54);L.fence(-57,-54,-57,54);L.fence(57,-54,57,54);
 // central radar tower + radome (flag B below)
 L.boxC(0,-8,9,9,7,{mat:'concrete',col:0xd8dce0});L.boxC(0,-8,9.6,9.6,.4,{y0:7,mat:'trim',col:0x8a9098,solid:false});L.props.push({kind:'radome',x:0,z:-8,y:7.4,rot:0,s:1,col:null});
L.signs.push({text:'NW-3 RADAR',bg:'#b83a2a',fg:'#fff',x:0,y:5.4,z:-3.33,w:5,ry:0});
 L.sandbags(-6,4,-2,4);L.sandbags(2,4,6,4);L.prop('crateL',-7,0,H);L.prop('gen',7,-1,H);crates(L,-8,-14,2);
 // west hangar (flag A in its mouth)
 L.building(-54,-10,-34,14,8,{mat:'metal',col:0x8e98a2,doors:{s:[[10,9]],e:[[6,1.8]]},dh:6,trim:0x4a5058,lit:0,dens:.3,plinth:0x5a5e62,parapet:false,clutter:false});
 L.prop('truck',-44,0,0,{col:0xe8e8e8});L.prop('crateL',-50,8,0);crates(L,-38,-6,3);L.prop('gen',-50,-6,0);L.prop('cable',-38,8,0);
 // east bunker complex (flag C)
 L.building(30,-28,50,-14,3.4,{mat:'concrete',col:0xc8ccd0,doors:{w:[[7,1.8]],s:[[6,1.8],[15,1.8]]},trim:0x8a9098,lit:.2,dens:.4,plinth:0x7a7e84,clutter:false});
 L.sandbags(32,-6,38,-6);L.sandbags(32,-6,32,-2);L.sandbags(38,-6,38,-2);L.prop('barrier',44,-6,0);L.prop('barrier',44,2,0);crates(L,48,-6,3);
 // prefab huts (red / orange cladding)
 const hut=(x0,z0,x1,z1,col,doors)=>L.building(x0,z0,x1,z1,3.4,{mat:'metal',col,doors,trim:0xf0f0f0,lit:.2,dens:.6,plinth:0x5a5e62,clutter:false,parapet:false});
 hut(-24,22,-12,30,RED,{n:[[6,1.8]],e:[[4,1.8]]});hut(12,24,24,32,OR,{n:[[6,1.8]],w:[[4,1.8]]});hut(-26,-36,-14,-28,OR,{s:[[6,1.8]],e:[[4,1.8]]});hut(14,-38,26,-30,RED,{s:[[6,1.8]],w:[[4,1.8]]});
 hut(-30,36,-20,44,WH,{n:[[5,1.8]]});hut(22,-48,32,-40,WH,{s:[[5,1.8]]});
 // fuel farm + antenna mast
 L.prop('fueltank',-34,-44,0,{col:0xe8e8e8});L.prop('fueltank',-26,-46,0,{col:0xd8dce0});L.prop('fueltank',38,44,0,{col:0xe8e8e8});
 L.boxC(30,32,3,3,1,{mat:'concrete',col:0xc8c8c8});for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])L.box(30+x*.9-.1,32+z*.9-.1,30+x*.9+.1,32+z*.9+.1,24,{y0:1,mat:'trim',col:0xd83a2a,solid:false});
 for(let y=3;y<24;y+=3){L.box(29,31,31,31.12,.08,{y0:y,mat:'trim',col:0xf0f0f0,solid:false});L.box(29,32.88,31,33,.08,{y0:y,mat:'trim',col:0xf0f0f0,solid:false});}
 L.wire([30,32],[-12,26],9);L.wire([-12,26],[-44,14],9);
 // vehicles, cover, snow drifts
 L.prop('jeep',-6,22,.3,{col:0xe8eaec});L.prop('truck',18,12,H,{col:0x6a7468});L.prop('pickup',-20,-16,-.4,{col:0xb83a2a});L.prop('jeep',24,-6,PI,{col:0x6a7468});
 L.jersey(-16,8,-8,8);L.jersey(10,-20,18,-20);crates(L,-28,4,3);crates(L,26,14,3);crates(L,-10,40,2);crates(L,10,-42,2);crates(L,-40,30,2);crates(L,40,-34,2);
 for(const[x,z]of[[-18,0],[18,0],[0,22],[0,-28]])L.prop('barrel',x,z,0,{col:0x3a5a3a});
 // pines + rocks (inside & outside)
 scatter(L,'pine',22,-55,-55,55,55,[[-14,-20,14,8],[-56,-12,-32,16],[28,-30,52,-12],[-6,40,6,60],[-6,-60,6,-40],[-56,46,56,56],[-56,-56,56,-46]],{s:[.8,1.3]});
 scatter(L,'rock',20,-55,-55,55,55,[[-14,-20,14,8],[-56,46,56,56],[-56,-56,56,-46]],{s:[.8,1.8]});
 for(let i=0;i<120;i++){const a=L.rnd()*6.28,r=64+L.rnd()*80;L.props.push({kind:'pine',x:Math.cos(a)*r,z:Math.sin(a)*r,y:0,rot:L.rnd()*6,s:.9+L.rnd()*.7,col:null});}
 for(const[x,z,r]of[[-6,-30,0],[6,30,PI],[-36,22,0],[36,-10,PI]])L.lamp(x,z,r,false);
 lane(L,0,0,120,7,0,'asphalt');lane(L,0,18,70,6,H,'asphalt');
 splat(L,x=>{R_(x,0,-34,70,6,'#f00');R_(x,-44,20,14,14,'#f00');R_(x,40,-8,18,14,'#f00');C_(x,0,-8,13,'#f00');});
 L.spawns.a=[[0,51],[-8,51],[8,51],[-16,51],[16,51],[-26,50],[26,50],[-36,51],[36,51],[-46,51],[46,51]];
 L.spawns.b=[[0,-51],[-8,-51],[8,-51],[-16,-51],[16,-51],[-26,-51],[26,-51],[-36,-51],[36,-51],[-46,-51],[46,-51]];
 L.flags=[{id:'A',x:-44,z:10},{id:'B',x:0,z:6},{id:'C',x:35,z:-3}];
 L.pts={start:{x:0,z:57.5,yaw:PI},gate:{x:0,z:54},radar:{x:0,z:-2},bunker:{x:40,z:-21},lz:{x:-30,z:-20},hang:{x:-44,z:4}};L.pads.push({x:-30,z:-20,r:5});
 L.hot=[[0,6],[-44,10],[35,-3],[0,30],[0,-34],[-20,-10],[20,10],[-30,40],[30,-40],[-20,26],[20,-34]];
 L.finalize();return L;}

/* ===================== OLD QUARTER — European old town at blue hour ===================== */
function oldquarter(){const L=new Level({id:'oldquarter',name:'OLD QUARTER',half:60,look:LOOK.dusk,terrain:{base:'grass',alt:'dirt',path:'cobble',pathScale:2.6,altK:.4,height:26,ramp:60,far:{h:46,c:0x4a4060}},leafCol:0x8aa070,grassCol:0xa8b888,bushCol:0x90a878});L._s=9001;
 const C=[0xf0d8b8,0xe8b890,0xd89878,0xc8d0b0,0xf0dcc8,0xb8c8d0,0xe8c088,0xd8a8a0,0xf4ecd8];let ci=0;
 const b=(x0,z0,x1,z1,h,doors,o={})=>{ci++;return L.building(x0,z0,x1,z1,h,{mat:o.mat||(ci%6===4?'brick':'plaster'),col:o.col??(ci%6===4?0xffffff:C[ci%C.length]),doors,roof:'pitched',rcol:[0xd88a6a,0xc8705a,0xb86850][ci%3],trim:0xf4ecdc,shut:[1,2][ci%2],lit:.45,dens:.85,plinth:0x7a6e66,...o});};
 // west
 b(-56,-56,-40,-44,7,{s:[[8,1.8]]});b(-37,-56,-24,-46,5,{s:[[6,1.8]],e:[[4,1.7]]});b(-21,-56,-6,-43,8,{e:[[6,1.8]],s:[[7,1.8]]},{light:true});
 b(-56,-40,-44,-30,4.5,{e:[[5,1.8]]});b(-40,-41,-26,-30,6,{s:[[7,1.8]],n:[[3,1.7]]});b(-22,-39,-6,-30,5,{e:[[4.5,1.8]],s:[[8,1.8]]},{light:true,awn:[['s',8,6,0x2a5a4a]]});
 b(-56,-20,-42,-6,6,{e:[[7,1.8]],n:[[5,1.8]]});b(-38,-20,-26,-8,4.5,{s:[[6,1.8]],n:[[6,1.8]]});b(-22,-20,-14,-12,5,{e:[[4,1.8]]});
 b(-56,6,-44,20,5,{e:[[7,1.8]]});b(-40,4,-28,16,7,{n:[[6,1.8]],s:[[6,1.8]]},{light:true});b(-24,6,-14,18,5,{e:[[6,1.8]],n:[[5,1.8]]},{awn:[['e',6,6,0x8a2a2a]]});
 b(-56,30,-44,42,5,{e:[[6,1.8]]},{light:true});b(-40,30,-26,40,6,{n:[[7,1.8]]});b(-22,30,-6,44,7,{e:[[7,1.8]],n:[[8,1.8]]});b(-56,46,-40,56,4.5,{n:[[8,1.8]]});b(-36,44,-20,56,5,{n:[[8,1.8]]});
 // east
 b(6,-56,20,-44,6,{s:[[7,1.8]],w:[[6,1.8]]});b(24,-56,36,-46,5,{s:[[6,1.8]]});b(40,-56,56,-50,4,{s:[[8,1.8]]});b(6,-40,18,-30,5,{w:[[5,1.8]],n:[[6,1.8]]},{light:true});b(22,-40,32,-30,7,{n:[[5,1.8]],e:[[5,1.8]]});
 b(14,-20,22,-12,5,{w:[[4,1.8]]});b(26,-20,38,-6,6,{n:[[6,1.8]],w:[[7,1.8]]},{light:true,awn:[['w',7,8,0x2a3a6a]]});b(42,-20,56,-8,5,{n:[[7,1.8]]});
 b(14,12,22,20,4.5,{w:[[4,1.8]]});b(26,6,40,18,6,{s:[[7,1.8]],w:[[6,1.8]]});b(44,4,56,20,7,{w:[[8,1.8]]});
 b(6,30,20,42,5,{w:[[6,1.8]],n:[[7,1.8]]},{light:true});b(24,30,36,44,6,{n:[[6,1.8]]});b(40,30,56,40,5,{n:[[8,1.8]]});b(8,46,26,56,4.5,{n:[[9,1.8]]});b(32,48,48,56,5,{n:[[8,1.8]]});
 // clock tower on the plaza (stone, tall landmark)
 L.boxC(-10.5,-10,3.6,3.6,15,{mat:'stone',col:0xd8ccb4});L.boxC(-10.5,-10,4.2,4.2,.5,{y0:15,mat:'trim',col:0xc8bca4,solid:false});L.roofs.push({x0:-12.7,z0:-12.2,x1:-8.3,z1:-7.8,y:15.5,col:0xd8ccb4,mat:'stone',rcol:0x6a7a8a});
 L.props.push({kind:'clock',x:-10.5,z:-10,y:12.6,rot:0,s:1,col:null});
 // plaza: fountain, cafés, market
 L.boxC(0,0,5,5,.7,{mat:'stone',col:0xd8d0c0});L.boxC(0,0,1.2,1.2,2.4,{mat:'stone',col:0xc8c0b0});L.paint.push({x:0,z:0,w:4.2,d:4.2,c:0x2a6a80});
 for(const[x,z]of[[-8,7],[-5,9],[5,9],[8,7],[7,-7]])L.prop('cafe',x,z,0);for(const[x,z]of[[4,-8],[-4,-8]])L.prop('stall',x,z,0);
 crates(L,-10.5,-2,2);crates(L,9.5,1,2);L.prop('bench',-6,-4,H);L.prop('bench',6,3,-H);
 // street clutter
 const cc=[0x8a2a22,0x2a4a7a,0xd8d0c0,0x3a3a40,0xc89a3a,0x5a7a5a,0x9aa0a8];let k=0;
 for(const[x,z,r]of[[-3.6,-42,0],[3.6,-20,PI],[-3.6,17,0],[3.6,34,PI],[-3.6,49,0],[3.6,-50,PI],[-30,-26.6,H],[28,-23.4,-H],[-16,23.4,-H],[40,26.6,H],[-46,23.4,H],[12,-26.6,H]])L.prop('car',x,z,r,{col:cc[k++%cc.length]});
 L.prop('wreck',22,25,H+.2);L.prop('jeep',-24,-25,H,{col:0x5a6448});
 for(const[x,z]of[[-42,-43],[21,-43],[-23,-4],[23,4],[41,-10],[-41,22],[38,46],[-25,57]])L.prop('dumpster',x,z,(x+z)&1?0:H,{col:[0x2d6a4a,0x3a4a6a][(x>0)|0]});
 crates(L,-42,-27,2);crates(L,44,-27,3);crates(L,-12,27,2);crates(L,20,22,2);crates(L,-50,-3,2);crates(L,50,1,2);crates(L,-38,42,2);crates(L,31,-43,2);
 for(let z=-52;z<=52;z+=16)L.lamp(z%32===0?-5.6:5.6,z,z%32===0?0:PI);for(const x of[-40,-20,20,40]){L.lamp(x,-29.5,-H,true);L.lamp(x,29.5,H,true);}
 for(const[x,z]of[[-30,-48],[30,-12],[48,52],[-50,50],[-10,-50],[12,52],[-48,0],[48,24]])L.prop('tree',x,z,L.rnd()*6,{s:.9,free:true});
 for(let i=0;i<50;i++){const a=L.rnd()*6.28,r=68+L.rnd()*70;L.props.push({kind:'tree',x:Math.cos(a)*r,z:Math.sin(a)*r,y:0,rot:L.rnd()*6,s:1+L.rnd()*.6,col:null});}
 L.grass.push([-60,57,60,60],[-60,-60,60,-57]);
 L.pads.push({x:47,z:-37,r:5});L.container(54,-28,true,0x3a4a5a);crates(L,40,-31,3);L.prop('truck',53,-42,0,{col:0x5a6448});
 splat(L,x=>{R_(x,0,0,120,120,'#f00');});
 L.spawns.a=[[-50,25],[-40,25],[-30,25],[-20,25],[0,50],[0,40],[-10,25],[-57,25],[0,30],[-50,52],[-30,58]];L.spawns.b=[[50,-25],[40,-25],[30,-25],[20,-25],[0,-50],[0,-40],[10,-25],[52,-32],[0,-30],[50,-52],[30,-58]];
 L.flags=[{id:'A',x:-32,z:25},{id:'B',x:0,z:4},{id:'C',x:32,z:-25}];
 L.pts={start:{x:-30,z:25,yaw:-H},plaza:{x:0,z:2},lz:{x:47,z:-37}};
 L.hot=[[0,0],[0,-25],[0,25],[-30,-25],[30,25],[-30,25],[30,-25],[-45,0],[45,0],[0,-45],[0,45],[47,-37]];
 L.finalize();return L;}

export const MAPS={sandgate,harbor,northwatch,oldquarter};
export const MAP_LIST=[{id:'sandgate',name:'SANDGATE',tag:'DESERT · NOON'},{id:'harbor',name:'HARBOR 9',tag:'PORT · GOLDEN HOUR'},{id:'northwatch',name:'NORTHWATCH',tag:'SNOW · MORNING'},{id:'oldquarter',name:'OLD QUARTER',tag:'TOWN · BLUE HOUR'}];
