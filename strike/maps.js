// STRIKE ZONE — three original arenas authored from boxes: interiors, storeys, stairs, catwalks, cover and sightlines.
// Coordinates in metres, y up, north = -z. Materials are keys resolved by world.js.

// a building shell: walls with door/window gaps per storey, floors with a stair hole, interior stairs, roof, balcony, ceiling lamps
function building(K,o){const t=o.t??.4,y=o.y??0,h=o.h??3.6,F=o.floors??2,wm=o.wm||'plaster',fm=o.fm||'tile',{x0,x1,z0,z1}=o,tint=o.tint||null,top=y+F*h;
 const G={n:[],s:[],e:[],w:[]};
 for(const s in o.doors||{})for(const[a,b,hh]of o.doors[s])G[s].push([a,b,0,hh||2.6]);
 for(const s in o.win||{})for(const[a,b]of o.win[s])G[s].push([a,b,1.05,2.35]);
 for(let f=1;f<F;f++)for(const s in o.up||{})for(const[a,b,k]of o.up[s])G[s].push([a,b,f*h+(k==='d'?0:1.05),f*h+(k==='d'?2.5:2.35)]);
 K.wall(x0,z0,x1,z0+t,y,top,wm,G.n,{tint});K.wall(x0,z1-t,x1,z1,y,top,wm,G.s,{tint});K.wall(x0,z0+t,x0+t,z1-t,y,top,wm,G.w,{tint});K.wall(x1-t,z0+t,x1,z1-t,y,top,wm,G.e,{tint});
 K.box(x0+t,y,z0+t,x1-t,y+.04,z1-t,fm,{kind:'floor'});
 const st=o.stair;for(let f=1;f<F;f++)slabHole(K,x0+t,z0+t,x1-t,z1-t,y+f*h,.3,o.cm||'plaster',f===1?st:null,{kind:'slab',top:fm});
 if(st){K.stairs(st.x0,st.z0,st.x1,st.z1,y,y+h,st.dir,o.sm||'stone');holeRails(K,st,x0+t,z0+t,x1-t,z1-t,y+h);}
 if(o.roof!==false){slabHole(K,x0,z0,x1,z1,top+.35,.35,o.cm||'plaster',o.roofHole||null,{kind:'roof',top:o.rm||'concrete2'});if(o.pitch)K.dec({k:'gable',x0:x0-.3,z0:z0-.3,x1:x1+.3,z1:z1+.3,y:top+.35,ax:o.pitch,col:o.roofCol});}
 if(o.parapet){const p=o.parapet,ty=top+.35;for(const[a,b,c,d]of[[x0,z0,x1,z0+.3],[x0,z1-.3,x1,z1],[x0,z0+.3,x0+.3,z1-.3],[x1-.3,z0+.3,x1,z1-.3]]){const gaps=(p.gaps||[]).filter(g=>g.on===(c-a>d-b?(b<(z0+z1)/2?'n':'s'):(a<(x0+x1)/2?'w':'e'))).map(g=>[g.a,g.b,0,2]);K.wall(a,b,c,d,ty,ty+(p.h||1),o.pm||wm,gaps,{kind:'parapet',tint});}}
 for(let f=0;f<F;f++)K.light((x0+x1)/2,y+f*h+h-.32,(z0+z1)/2,o.lc??0xffd6a0,o.li??7,Math.max(x1-x0,z1-z0)*.85,{real:!!(o.real&&f===(o.realF||0)),fixture:'ceil'});
 if(o.balc){const b=o.balc,by=y+h,d=b.d||1.6;let r;if(b.side==='s')r=[b.a,z1,b.b,z1+d];else if(b.side==='n')r=[b.a,z0-d,b.b,z0];else if(b.side==='e')r=[x1,b.a,x1+d,b.b];else r=[x0-d,b.a,x0,b.b];
  K.slab(r[0],r[1],r[2],r[3],by,.25,b.m||'stone',{kind:'balcony'});const R=(a,c,e,f)=>K.rail(a,c,e,f,by,1.0,{solid:true,m:b.rm||'steel',kind:'balrail'});
  if(b.side==='s'||b.side==='n'){const zz=b.side==='s'?r[3]-.12:r[1];R(r[0],zz,r[2],zz+.12);R(r[0],r[1],r[0]+.12,r[3]);R(r[2]-.12,r[1],r[2],r[3]);}else{const xx=b.side==='e'?r[2]-.12:r[0];R(xx,r[1],xx+.12,r[3]);R(r[0],r[1],r[2],r[1]+.12);R(r[0],r[3]-.12,r[2],r[3]);}}
 return top;}
function slabHole(K,x0,z0,x1,z1,y,th,m,hole,o={}){if(!hole){K.slab(x0,z0,x1,z1,y,th,m,o);return;}const H={x0:Math.max(x0,hole.x0),z0:Math.max(z0,hole.z0),x1:Math.min(x1,hole.x1),z1:Math.min(z1,hole.z1)};
 K.slab(x0,z0,x1,H.z0,y,th,m,o);K.slab(x0,H.z1,x1,z1,y,th,m,o);K.slab(x0,H.z0,H.x0,H.z1,y,th,m,o);K.slab(H.x1,H.z0,x1,H.z1,y,th,m,o);}
// rails around a stair hole, except the arrival end and edges touching walls
function holeRails(K,s,ix0,iz0,ix1,iz1,y){const top={'+x':'e','-x':'w','+z':'s','-z':'n'}[s.dir];const R=(a,b,c,d)=>K.rail(a,b,c,d,y,1.0,{solid:true,m:'steel',kind:'balrail'});
 if(top!=='n'&&Math.abs(s.z0-iz0)>.05)R(s.x0,s.z0-.1,s.x1,s.z0);if(top!=='s'&&Math.abs(s.z1-iz1)>.05)R(s.x0,s.z1,s.x1,s.z1+.1);
 if(top!=='w'&&Math.abs(s.x0-ix0)>.05)R(s.x0-.1,s.z0,s.x0,s.z1);if(top!=='e'&&Math.abs(s.x1-ix1)>.05)R(s.x1,s.z0,s.x1+.1,s.z1);}
const yawTo=(x,z,tx=0,tz=0)=>Math.atan2(-(tx-x),-(tz-z));
function posts(K,pts,y0,y1,m='steel',s=.36){for(const[x,z]of pts)K.box(x-s/2,y0,z-s/2,x+s/2,y1,z+s/2,m,{kind:'post'});}

/* ===================================================================== FOUNDRY — dusk steelworks */
function foundry(K){
 // perimeter
 for(const[a,b,c,d]of[[-36,-36,36,-35],[-36,35,36,36],[-36,-35,-35,35],[35,-35,36,35]])K.box(a,0,b,c,9,d,'brick',{kind:'perimeter'});
 // ---- the furnace hall (two storeys of catwalk inside)
 const hx0=-14,hx1=14,hz0=-9,hz1=9,t=.5;
 K.wall(hx0,hz0,hx0+t,hz1,0,10,'brick',[[-2.5,2.5,0,4.5],[-7,-4,5.6,7],[4,7,5.6,7]]);
 K.wall(hx1-t,hz0,hx1,hz1,0,10,'brick',[[-2.5,2.5,0,4.5],[-7,-4,5.6,7],[4,7,5.6,7]]);
 K.wall(hx0+t,hz0,hx1-t,hz0+t,0,10,'brick',[[-10,-7,0,3],[10,12.5,4.5,7.2],[-4,-1,5.6,7],[2,5,5.6,7]]);
 K.wall(hx0+t,hz1-t,hx1-t,hz1,0,10,'brick',[[7,10,0,3],[-5,-2,5.6,7],[1,4,5.6,7],[-12,-9,5.6,7]]);
 K.slab(hx0,hz0,hx1,hz1,10.4,.4,'concrete2',{kind:'roof',top:'metal'});
 K.box(hx0+t,0,hz0+t,hx1-t,.04,hz1-t,'plate',{kind:'floor'});
 K.slab(-13.5,-8.5,13.5,-5.5,4.5,.35,'plate');K.slab(-13.5,5.5,13.5,8.5,4.5,.35,'plate');K.slab(-1.25,-5.5,1.25,5.5,4.5,.35,'plate',{kind:'catwalk'});
 K.stairs(4,-5.5,10,-3.5,0,4.5,'-x','plate');K.stairs(-10,3.5,-4,5.5,0,4.5,'+x','plate');
 for(const[a,b]of[[-13.5,-1.25],[1.25,4],[10,13.5]])K.rail(a,-5.6,b,-5.5,4.5);for(const[a,b]of[[-13.5,-10],[-4,-1.25],[1.25,13.5]])K.rail(a,5.5,b,5.6,4.5);
 K.rail(-1.35,-5.5,-1.25,5.5,4.5);K.rail(1.25,-5.5,1.35,5.5,4.5);
 K.box(-3,0,-3,3,3.2,3,'painted',{kind:'furnace'});K.dec({k:'furnace',x:0,z:0,y:3.2,s:6});
 K.box(-9,0,3,-7,2.2,5,'painted',{kind:'machine'});K.box(7,0,-5,9,2.2,-3,'painted',{kind:'machine'});
 K.box(-9,0,-2,-7.6,1,1,'steel',{kind:'ingot'});K.box(7.6,0,-1,9,1,2,'steel',{kind:'ingot'});
 K.crate(-11.5,-7,1.3);K.crate(-11.4,-5.7,1.1);K.crate(11.5,7,1.3);K.crate(12,5.6,1.1);K.crate(4.5,6.6,1.2);K.crate(-4.5,-6.6,1.2);
 K.box(-13.4,4.5,-8.4,-11.8,5.5,-7.2,'crate',{kind:'crate',uvBox:true});K.box(11.8,4.5,7.2,13.4,5.5,8.4,'crate',{kind:'crate',uvBox:true});
 for(const x of[-8,0,8])K.light(x,9.4,0,0xffb070,x===0?14:10,18,{real:x!==0,fixture:'hang'});
 for(const x of[-10,0,10]){K.light(x,7.4,-7,0xffc890,5,9,{real:false,fixture:'ceil'});K.light(x,7.4,7,0xffc890,5,9,{real:false,fixture:'ceil'});}
 K.zone('HALL',-14,-9,14,9,-1,4);K.zone('MEZZANINE',-14,-9,14,9,4,99);
 // ---- north yard: gantry platform + bridge into the hall mezzanine
 K.slab(22,-35,35,-24,4.5,.35,'plate',{kind:'gantry'});posts(K,[[22.3,-24.3],[22.3,-34.6],[28.5,-24.3],[34.6,-24.3]],0,4.15);
 K.slab(10,-26.5,22,-24,4.5,.35,'plate',{kind:'bridge'});K.slab(10,-24,12.5,-9,4.5,.35,'plate',{kind:'bridge'});posts(K,[[11.25,-16],[16,-25.25]],0,4.15);
 K.rail(10,-26.6,22,-26.5,4.5);K.rail(12.5,-24,22,-23.9,4.5);K.rail(9.9,-26.5,10,-9,4.5);K.rail(12.5,-23.9,12.6,-9,4.5);
 K.rail(22,-24.1,32.5,-24,4.5);K.rail(22,-35,22.1,-26.6,4.5);
 K.stairs(32.5,-24,34.6,-13,0,4.5,'-z','plate');
 K.pad(16,0,-31,28,4.5,-29.5);
 K.container(-30,-31,-24,-28.6,0,0);K.container(-29,-31,-23,-28.6,2.6,1);K.container(-20,-24,-17.6,-18,0,2);K.container(-8,-30,-2,-27.6,0,3);K.container(2,-33.5,8,-31.1,0,1);
 K.container(15,-20,21,-17.6,0,0);K.container(15.5,-20,21.5,-17.6,2.6,4);K.container(26,-20,28.4,-14,0,2);
 for(const[x0,z0,x1,z1]of[[-14,-15,-10,-14.4],[3,-14,3.6,-11],[-26,-12,-25.4,-16],[6,-22,10,-21.4],[-3,-21,1,-20.4],[24,-30,24.6,-26]])K.box(x0,0,z0,x1,1.05,z1,'concrete',{kind:'barrier'});
 K.crate(-12,-27,1.3);K.crate(-12,-25.6,1.3);K.crate(-12.2,-26.3,1.1,1.3);K.crate(30,-15,1.2);K.crate(31.4,-15.2,1.2);K.crate(9,-33,1.2);
 K.barrel(-16,-12);K.barrel(-15.2,-11.4,0,1);K.barrel(20,-12);K.barrel(-32,-24,0,1);
 K.zone('GANTRY',22,-35,35,-24,3,99);K.zone('BRIDGE',10,-27,22,-9,3,99);K.zone('NORTH YARD',-35,-35,35,-9);
 // ---- south yard: loading dock with shed, sniper tower
 K.box(-35,0,29,6,1.2,35,'concrete',{kind:'dock'});K.stairs(6,29,9,35,0,1.2,'-x','concrete');K.stairs(-14,26,-10,29,0,1.2,'+z','concrete');
 K.slab(-35,28,-16,35,6,.3,'metal',{kind:'shed'});posts(K,[[-16.3,29.3],[-25,29.3]],1.2,5.7);
 K.crate(-30,32,1.3,1.2);K.crate(-28.6,32.4,1.3,1.2);K.crate(-29.3,32.2,1.2,2.5);K.crate(-21,31,1.3,1.2);K.box(-8,1.2,31.5,-4,2.3,33.5,'crate',{kind:'crate',uvBox:true});
 for(const x of[-30,-22])K.light(x,5.5,31.5,0xffd090,6,10,{real:false,fixture:'hang'});
 K.slab(24,22,35,30,6.5,.35,'plate',{kind:'tower'});posts(K,[[24.3,22.3],[24.3,29.7],[32.2,29.7]],0,6.15);
 K.wall(24,22,32.5,22.25,6.5,7.6,'concrete2',[],{kind:'parapet'});K.wall(24,22.25,24.25,30,6.5,7.6,'concrete2',[],{kind:'parapet'});K.wall(24.25,29.75,35,30,6.5,7.6,'concrete2',[],{kind:'parapet'});
 K.stairs(32.5,11,34.6,22,0,6.5,'+z','plate');K.pad(19,0,26,28,6.5,26);
 K.box(-24,0,16,-21.6,2.6,22,'steel',{kind:'truck'});K.dec({k:'truck',x:-22.8,z:19,ry:0});
 K.crate(0,15,1.3);K.crate(1.3,15.3,1.3);K.crate(.6,15.1,1.1,1.3);K.crate(-6,20,1.4);K.crate(12,18,1.3);K.crate(13.3,18.2,1.2);K.crate(-14,14,1.2);K.crate(20,14,1.2);
 for(const[x0,z0,x1,z1]of[[-4,24,0,24.6],[8,22,8.6,26],[16,12,20,12.6],[-30,14,-26,14.6]])K.box(x0,0,z0,x1,1.05,z1,'concrete',{kind:'barrier'});
 K.barrel(4,24);K.barrel(4.8,24.5,0,1);K.barrel(-18,24);
 K.zone('TOWER',24,22,35,30,5,99);K.zone('DOCK',-35,28,6,35);K.zone('SOUTH YARD',-35,9,35,35);
 // ---- west office (2 storeys) + balcony
 building(K,{x0:-35,x1:-22,z0:-12,z1:12,h:4,floors:2,wm:'concrete',fm:'tile',rm:'metal',cm:'concrete2',doors:{e:[[-1.5,1.5]],n:[[-31,-28]],s:[[-31,-28]]},win:{e:[[-9,-6],[6,9]],n:[[-26,-24]],s:[[-26,-24]]},
  up:{e:[[-9,-6],[6,9],[-1.5,1.5,'d']],n:[[-31,-28],[-26,-24]],s:[[-31,-28],[-26,-24]]},stair:{x0:-34.6,z0:1,x1:-32.6,z1:9,dir:'-z'},balc:{side:'e',a:-3,b:3,d:2.4,m:'plate'},lc:0xf4f0e0,li:6,real:true});
 K.box(-30,0,-8,-27,.85,-7,'wood',{kind:'desk'});K.box(-30,0,6,-27,.85,7,'wood',{kind:'desk'});K.box(-25,4,-9,-23.5,5.9,-8.4,'steel',{kind:'cabinet'});K.box(-30,4,-3,-27,4.85,-2,'wood',{kind:'desk'});K.box(-30,4,5,-27,4.85,6,'wood',{kind:'desk'});
 K.zone('OFFICE',-35,-12,-22,12);K.zone('BALCONY',-22,-3,-19.5,3,3,99);
 // ---- east: silos + conveyor
 for(const[x,z,r]of[[20,-4,2],[27,4,2.2],[30,-5,1.6]]){const a=r*.42;K.box(x-r,0,z-a,x+r,12,z+a,'metal',{kind:'silo',vis:false});K.box(x-a,0,z-r,x+a,12,z+r,'metal',{kind:'silo',vis:false});K.box(x-r*.71,0,z-r*.71,x+r*.71,12,z+r*.71,'metal',{kind:'silo',vis:false});K.dec({k:'silo',x,z,r,h:12});}
 K.box(15,1.1,6,22,1.5,7.2,'steel',{kind:'conveyor'});posts(K,[[15.4,6.6],[21.6,6.6]],0,1.1,'steel',.3);
 for(const[x0,z0,x1,z1]of[[16,-12,16.6,-8],[31,8,33,8.6],[22,10,26,10.6]])K.box(x0,0,z0,x1,1.05,z1,'concrete',{kind:'barrier'});
 K.crate(33,-12,1.3);K.crate(17,12,1.2);K.barrel(24,-11);K.barrel(33,2);
 K.zone('SILOS',14,-12,35,12);
 // floodlights + pickups + spawns
 K.light(-20,7,-22,0xffe0b0,22,26,{fixture:'pole'});K.light(10,7,22,0xffe0b0,22,26,{fixture:'pole'});
 K.pickup('hp',-32,0,-14);K.pickup('hp',32,0,14);K.pickup('hp',-30,1.2,33);K.pickup('hp',-30,4,0);K.pickup('hp',0,0,-6.5);K.pickup('hp',28,6.5,27);
 K.pickup('ammo',-6,0,-24);K.pickup('ammo',6,0,22);K.pickup('ammo',22,0,-8);K.pickup('ammo',-20,0,4);K.pickup('rl',30,4.5,-31);K.pickup('rl',0,4.5,0);
 const sp=[[-30,0,-20,0],[-28,0,-6,0],[-18,0,-31,0],[-32,1.2,31,0],[-12,0,-20,0],[-28,4,8,0],[-12,0,18,0],[30,0,10,1],[24,0,-10,1],[10,0,31,1],[30,0,-16,1],[20,0,-30,1],[2,0,24,1],[0,0,-14,1]];
 for(const[x,y,z,tm]of sp)K.spawn(x,y,z,yawTo(x,z),tm);}

/* ===================================================================== SKYLINE — neon rooftops at night, a void below */
function skyline(K){
 const roof=(x0,x1)=>{K.box(x0,-1,-24,x1,0,24,'membrane',{kind:'roofslab',noBottom:true});K.dec({k:'facade',x0,x1,z0:-24,z1:24,y:-1});};
 roof(-34,-6);roof(6,34);
 const par=(x0,z0,x1,z1,gaps=[])=>K.wall(x0,z0,x1,z1,0,1.1,'concrete2',gaps,{kind:'parapet'});
 par(-34,-24,-6,-23.7);par(-34,23.7,-6,24);par(-34,-23.7,-33.7,23.7);par(-6.3,-23.7,-6,23.7,[[-16,-12.5,0,2],[-7.5,-4.5,0,2],[-3.5,-.5,0,2]]);
 par(6,-24,34,-23.7);par(6,23.7,34,24);par(33.7,-23.7,34,23.7);par(6,-23.7,6.3,23.7,[[-16,-12.5,0,2],[-7.5,-4.5,0,2],[-3.5,-.5,0,2]]);
 // skybridge (glazed corridor)
 K.box(-6.3,-.6,-16,6.3,0,-12.5,'tile',{kind:'bridgefloor',noBottom:false});K.wall(-6,-16,6,-15.8,0,3.2,'steel',[[-5,5,.7,2.9]]);K.wall(-6,-12.7,6,-12.5,0,3.2,'steel',[[-5,5,.7,2.9]]);
 K.slab(-6.3,-16,6.3,-12.5,3.5,.3,'steel',{kind:'roof'});K.dec({k:'glass',x0:-5,x1:5,z:-15.9,y0:.7,y1:2.9});K.dec({k:'glass',x0:-5,x1:5,z:-12.6,y0:.7,y1:2.9});
 K.light(0,3,-14.25,0x80e0ff,6,9,{real:true,fixture:'strip'});K.zone('SKYBRIDGE',-6.3,-16,6.3,-12.5);
 // roof A: penthouse with a roof terrace, deck, water tank
 building(K,{x0:-28,x1:-14,z0:4,z1:18,h:4.05,floors:1,wm:'concrete2',fm:'tile',rm:'deck',cm:'concrete2',doors:{e:[[8,11]],n:[[-24,-21]],s:[[-20,-17]]},win:{n:[[-27,-25],[-19,-15]],s:[[-27,-22],[-15.5,-14.5]],w:[[6,10],[12,16]],e:[[13,16.5],[5,7]]},
  parapet:{h:.95,gaps:[{on:'e',a:4,b:18}]},lc:0xffa8e0,li:7,real:true});
 K.box(-26,0,14,-20,1.1,15,'wood',{kind:'bar'});K.box(-27,0,6,-24,.8,7.4,'fabric',{kind:'sofa'});K.box(-18,0,6,-16.6,.8,9,'fabric',{kind:'sofa'});K.box(-22,0,9,-20,2.2,11,'concrete2',{kind:'column'});
 K.slab(-14,3,-6.3,15,4.4,.35,'deck',{kind:'deck'});posts(K,[[-13.7,3.3],[-6.6,3.3],[-13.7,14.7],[-6.6,14.7],[-10,9]],0,4.05,'concrete2',.4);
 K.rail(-14,3,-12,3.1,4.4);K.rail(-10,3,-6.3,3.1,4.4);K.rail(-6.4,3,-6.3,12,4.4);K.rail(-6.4,14.5,-6.3,15,4.4);K.rail(-14,14.9,-6.3,15,4.4);
 K.stairs(-12,-7,-10,3,0,4.4,'+z','plate');K.zone('TERRACE',-28,3,-6,18,3,99);K.zone('PENTHOUSE',-28,4,-14,18,-1,3);
 K.slab(-6.3,12,6.3,14.5,4.4,.3,'plate',{kind:'catwalk'});K.rail(-6.3,11.9,6.3,12,4.4);K.rail(-6.3,14.5,6.3,14.6,4.4);K.zone('CATWALK',-6.3,11,6.3,15.5,2,99);
 K.slab(-33.7,-23.7,-25,-15,5.2,.35,'plate',{kind:'tankdeck'});posts(K,[[-33.4,-15.3],[-25.3,-15.3],[-25.3,-23.4]],0,4.85);K.box(-31.6,5.2,-21.6,-27.4,9,-17.4,'metal',{kind:'tank',vis:false});K.dec({k:'tank',x:-29.5,z:-19.5,y:5.2,r:2.5,h:4.6});
 K.rail(-33.7,-15.1,-27,-15,5.2);K.rail(-25.1,-23.7,-25,-15,5.2);K.stairs(-27,-15,-25,-2,0,5.2,'-z','plate');K.zone('WATER TANK',-34,-24,-25,-15,3,99);
 for(const[x,z,w,d]of[[-22,-8,2.4,1.8],[-30,0,1.8,2.6],[-17,-18,2.2,2.2],[-12,20,2.6,1.8]]){K.box(x-w/2,0,z-d/2,x+w/2,1.6,z+d/2,'metal',{kind:'hvac'});K.dec({k:'hvac',x,z,w,d});}
 K.box(-20,0,-2,-18.6,.9,1,'glass',{kind:'skylight'});K.crate(-30,-8,1.2);K.crate(-31.3,-8.2,1.2);K.crate(-9,-20,1.3);K.crate(-16,-12,1.2);K.barrel(-9,20);K.barrel(-8.3,20.6,0,1);
 K.light(-10,3.6,9,0xff60c0,9,12,{fixture:'neon'});
 for(const[x,y,z,c]of[[-28.6,3.2,11,0xffc890],[-13.6,3,0,0x6ad8ff],[-20,2.6,-23.2,0xff5ab0],[-33.2,2.6,0,0x6ad8ff],[-20,2.6,23.2,0xffc890],[-29.5,7.8,-15.6,0xffd8a0],[-6.8,2.6,-20,0xff5ab0],[-6.8,2.6,20,0x6ad8ff],[-11,6,-2,0xffc890],[-29,2.8,-4,0xffc890]])K.light(x,y,z,c,7,13,{real:false,fixture:'wall'});K.zone('ROOF A',-34,-24,-6,24);
 // roof B: helipad deck over a covered lane, construction floor
 K.slab(14,2,30,20,4.4,.4,'concrete2',{kind:'helipad'});posts(K,[[14.3,2.3],[29.7,2.3],[14.3,19.7],[29.7,19.7],[22,2.3],[22,19.7],[14.3,11],[29.7,11]],0,4,'concrete2',.5);K.dec({k:'helipad',x:22,z:11,y:4.4});
 K.slab(6.3,11,14,15.5,4.4,.3,'plate',{kind:'catwalk'});K.rail(6.3,10.9,14,11,4.4);K.rail(6.3,15.5,14,15.6,4.4);
 K.stairs(16,-8,18,2,0,4.4,'+z','plate');K.stairs(27,-8,29,2,0,4.4,'+z','plate');
 K.rail(14,1.9,16,2,4.4);K.rail(18,1.9,27,2,4.4);K.rail(29,1.9,30,2,4.4);K.rail(30,2,30.1,20,4.4);K.rail(14,20,30,20.1,4.4);K.rail(13.9,2,14,11,4.4);K.rail(13.9,15.5,14,20,4.4);
 K.zone('HELIPAD',14,2,30,20,3,99);K.zone('UNDERPASS',14,2,30,20,-1,3);
 for(const x of[12,18,24,30])for(const z of[-20,-14])K.box(x-.35,0,z-.35,x+.35,4,z+.35,'concrete2',{kind:'column'});K.slab(16,-23.7,33.7,-12,4.3,.3,'concrete2',{kind:'canopy'});
 for(const[x0,z0,x1,z1]of[[20,-18,24,-17.6],[26,-22,26.4,-18],[9,-10,12,-9.6],[30,-9,30.4,-5]])K.box(x0,0,z0,x1,1.4,z1,'brick',{kind:'blockwall'});
 K.crate(22,-21,1.3);K.crate(23.3,-21.2,1.3);K.crate(22.6,-21.1,1.2,1.3);K.crate(12,-18,1.4);K.crate(31,-14,1.2);K.barrel(19,-10);K.barrel(19.8,-10.4,0,1);
 for(const[x,z]of[[10,0],[32,6]]){K.box(x-1.1,0,z-.9,x+1.1,1.6,z+.9,'metal',{kind:'hvac'});K.dec({k:'hvac',x,z,w:2.2,d:1.8});}
 K.crate(18,8,1.2);K.crate(26,14,1.2);K.crate(25,6,1.3);K.box(20,0,12,22,1.1,13,'concrete2',{kind:'barrier'});
 K.light(22,3.6,11,0x50d8ff,10,14,{fixture:'neon'});
 for(const[x,y,z,c]of[[33.2,2.6,10,0xff5ab0],[20,2.6,23.2,0x6ad8ff],[33.2,2.6,-16,0xffc890],[6.8,2.6,-20,0x6ad8ff],[6.8,2.6,20,0xff5ab0],[17,6.4,-5,0xffc890],[28,6.4,-5,0xffc890],[14.6,3.4,6,0x6ad8ff],[29.4,3.4,16,0xff5ab0],[22,6.8,20,0xffd8a0],[12,2.8,-14,0xffc890]])K.light(x,y,z,c,7,13,{real:false,fixture:'wall'});K.light(24,3.6,-17,0xffd090,6,10,{real:false,fixture:'hang'});K.zone('SITE',8,-24,34,-8);K.zone('ROOF B',6,-24,34,24);
 K.dec({k:'billboard',x:33.9,z:-2,w:14,h:6,y:2,face:-1,col:0xff3d8a});K.dec({k:'billboard',x:-33.9,z:-6,w:12,h:5,y:2,face:1,col:0x3de0ff});K.dec({k:'city'});
 K.pad(-8.5,0,-6,9,0,-6);K.pad(8.5,0,-2,-9,0,-2);
 K.pickup('hp',-30,0,20);K.pickup('hp',30,0,-20);K.pickup('hp',-22,0,12);K.pickup('hp',22,0,8);K.pickup('hp',0,0,-14.25);K.pickup('hp',-29,5.2,-16.2);
 K.pickup('ammo',-16,0,-6);K.pickup('ammo',16,0,-4);K.pickup('ammo',-10,4.4,12);K.pickup('rl',22,4.4,11);K.pickup('rl',0,4.4,13.25);
 const sp=[[-30,0,-8,0],[-20,0,-20,0],[-31,0,12,0],[-18,0,22,0],[-10,0,-17,0],[-22,0,10,0],[-29,5.2,-16,0],[30,0,-6,1],[20,0,-20,1],[30,0,22,1],[12,0,20,1],[10,0,-17,1],[22,0,10,1],[28,4.4,16,1]];
 for(const[x,y,z,tm]of sp)K.spawn(x,y,z,yawTo(x,z),tm);}

/* ===================================================================== MERIDIAN — sunlit hill town */
function meridian(K){
 for(const[a,b,c,d]of[[-34,-34,34,-33.4],[-34,33.4,34,34],[-34,-33.4,-33.4,33.4]])K.box(a,0,b,c,5,d,'stone',{kind:'perimeter'});
 // east terrace (+2.4 m) with balustrade and three stairways
 K.box(14,0,-34,34,2.4,34,'stone',{kind:'terrace',top:'cobble2'});K.box(33.4,2.4,-34,34,7,34,'stone',{kind:'perimeter'});
 for(const[z0,z1]of[[-3,3],[24,28],[-28,-24]])K.stairs(10,z0,14,z1,0,2.4,'+x','stone');
 for(const[z0,z1]of[[-33.4,-28],[-24,-3],[3,24],[28,33.4]])K.box(14,2.4,z0,14.35,3.35,z1,'stone',{kind:'balustrade'});
 K.zone('TERRACE',14,-34,34,34,1.5,99);
 // bell tower with stairs wrapping its north-west corner
 K.box(24,2.4,-6,30,10.4,0,'stone',{kind:'towerbody'});K.stairs(22,-6,24,4,2.4,6.4,'-z','stone');K.box(22,2.4,-8,24,6.4,-6,'stone',{kind:'landing'});K.stairs(24,-8,30,-6,6.4,10.4,'+x','stone',{base:2.4});
 K.box(30,2.4,-8,30.5,11.4,-6,'stone',{kind:'wall'});
 const by=10.4,bt=13.4;K.wall(24,-6,30,-5.6,by,bt,'stone',[[27.6,30,0,2.4],[24.8,26.6,.9,2.6]]);K.wall(24,-.4,30,0,by,bt,'stone',[[25.6,28.4,.9,2.6]]);K.wall(24,-5.6,24.4,-.4,by,bt,'stone',[[-4.4,-1.6,.9,2.6]]);K.wall(29.6,-5.6,30,-.4,by,bt,'stone',[[-4.4,-1.6,.9,2.6]]);
 K.slab(23.8,-6.2,30.2,.2,bt+.35,.35,'stone',{kind:'roof'});K.dec({k:'spire',x:27,z:-3,y:bt+.35,s:6.4});K.dec({k:'bell',x:27,z:-3,y:bt-.4});
 K.light(27,bt-.5,-3,0xffd8a0,4,7,{real:false,fixture:'none'});K.zone('BELL TOWER',22,-8,31,1,5,99);
 // villa on the terrace (2 storeys, balcony over the steps)
 building(K,{x0:18,x1:32,z0:-28,z1:-14,y:2.4,h:3.6,floors:2,wm:'plaster',tint:[1,.93,.82],fm:'terracotta',doors:{w:[[-23,-20]],s:[[24,27]]},win:{w:[[-27,-25],[-18,-16]],s:[[20,22],[29,31]],n:[[22,26]]},
  up:{w:[[-23,-20,'d'],[-27,-25],[-18,-16]],s:[[20,22],[24,27],[29,31]],e:[[-24,-18]]},stair:{x0:29.6,z0:-26,x1:31.6,z1:-18,dir:'-z'},balc:{side:'w',a:-25,b:-18,d:1.8},pitch:'x',roofCol:0xb5583a,real:true});
 K.box(21,2.4,-17,24,3.25,-16,'wood',{kind:'table'});K.box(21,6,-27,23,7.8,-26.5,'wood',{kind:'cabinet'});K.zone('VILLA',18,-28,32,-14);
 // cafe on the terrace (1 storey, pergola)
 building(K,{x0:18,x1:30,z0:14,z1:26,y:2.4,h:3.6,floors:1,wm:'plaster',tint:[.86,.92,1],fm:'terracotta',doors:{w:[[18,21]],n:[[22,25]]},win:{w:[[22.5,25]],s:[[20,23],[25,28]],e:[[17,20],[21,24]],n:[[19,21],[26,28.5]]},pitch:'z',roofCol:0xa94f32});
 K.box(21,2.4,17,23,3.3,18.5,'wood',{kind:'counter'});K.zone('CAFE',18,14,30,26);
 for(const[x,z]of[[20,6],[26,8],[20,30],[30,10],[17,-8],[31,-30]]){K.box(x-.7,2.4,z-.7,x+.7,3.2,z+.7,'stone',{kind:'planter'});K.box(x-.22,3.2,z-.22,x+.22,6,z+.22,'wood',{kind:'trunk',vis:false,ray:false});K.dec({k:'tree',x,z,y:3.2,s:1});}
 K.dec({k:'pergola',x0:18,z0:4,x1:28,z1:12,y:2.4});K.box(19,2.4,7,23,3.3,8,'wood',{kind:'table'});K.box(24,2.4,9,27,3.3,10,'wood',{kind:'table'});
 // north-west house
 building(K,{x0:-32,x1:-18,z0:-32,z1:-18,h:3.6,floors:2,wm:'plaster',tint:[1,.86,.7],fm:'terracotta',doors:{e:[[-27,-24]],s:[[-27,-24]]},win:{e:[[-31,-29],[-21.5,-19.5]],s:[[-31,-29],[-22,-20]],n:[[-28,-24]]},
  up:{e:[[-31,-29],[-27,-24],[-22,-20]],s:[[-27,-24,'d'],[-31,-29],[-22,-20]],w:[[-28,-24]]},stair:{x0:-31.6,z0:-30,x1:-29.6,z1:-22,dir:'-z'},balc:{side:'s',a:-28,b:-22,d:1.6},pitch:'z',roofCol:0xb5583a});
 K.box(-24,0,-30,-21,.9,-29,'wood',{kind:'table'});K.box(-26,3.6,-23,-22.5,4.4,-21.5,'fabric',{kind:'bed'});K.zone('NW HOUSE',-32,-32,-18,-18);
 // south-west house
 building(K,{x0:-32,x1:-18,z0:18,z1:32,h:3.6,floors:2,wm:'plaster',tint:[.92,.96,.84],fm:'terracotta',doors:{e:[[24,27]],n:[[-27,-24]]},win:{e:[[19.5,21.5],[29,31]],n:[[-31,-29],[-22,-20]],s:[[-28,-24]]},
  up:{e:[[19.5,21.5],[24,27],[29,31]],n:[[-27,-24,'d'],[-31,-29],[-22,-20]],w:[[24,28]]},stair:{x0:-31.6,z0:22,x1:-29.6,z1:30,dir:'+z'},balc:{side:'n',a:-28,b:-22,d:1.6},pitch:'z',roofCol:0xa9502f});
 K.box(-24,0,29,-21,.9,30,'wood',{kind:'table'});K.box(-26,3.6,21.5,-22.5,4.4,23,'fabric',{kind:'bed'});K.zone('SW HOUSE',-32,18,-18,32);
 // north arcade + south market hall (arched fronts, galleries)
 building(K,{x0:-10,x1:8,z0:-32,z1:-20,h:3.8,floors:2,wm:'stone',fm:'terracotta',doors:{s:[[-8,-5,3],[-3,0,3],[2,5,3]],e:[[-27,-24]]},win:{n:[[-6,-2],[1,5]]},up:{s:[[-8,-5],[-3,0],[2,5]],e:[[-28,-24]],w:[[-28,-24]]},
  stair:{x0:-9.6,z0:-30,x1:-7.6,z1:-22,dir:'-z'},pitch:'x',roofCol:0xb05a3c,real:true,lc:0xffe0b0});
 K.box(-1,0,-29,4,1,-28,'wood',{kind:'counter'});K.box(2,3.8,-31,5,5.3,-30.4,'wood',{kind:'shelf'});K.zone('ARCADE',-10,-32,8,-20);
 building(K,{x0:-10,x1:8,z0:20,z1:32,h:3.8,floors:2,wm:'stone',fm:'terracotta',doors:{n:[[-8,-5,3],[-3,0,3],[2,5,3]],e:[[24,27]]},win:{s:[[-6,-2],[1,5]]},up:{n:[[-8,-5],[-3,0],[2,5]],e:[[24,28]],w:[[24,28]]},
  stair:{x0:-9.6,z0:22,x1:-7.6,z1:30,dir:'+z'},pitch:'x',roofCol:0xa34a2c});
 K.box(-4,0,26,1,1,27,'wood',{kind:'counter'});K.crate(4,29,1.1);K.crate(5.2,29.2,1.1);K.zone('MARKET HALL',-10,20,8,32);
 // gatehouse with a walkable roof (west)
 building(K,{x0:-34,x1:-28,z0:-6,z1:6,h:3.6,floors:1,wm:'stone',fm:'terracotta',doors:{e:[[-2,2]]},win:{n:[[-32,-30]],s:[[-33,-31]]},parapet:{h:1,gaps:[{on:'s',a:-30,b:-28}]},rm:'cobble2'});
 K.stairs(-30,6,-28,13,0,3.95,'-z','stone');K.zone('GATEHOUSE',-34,-6,-28,6);
 // plaza: fountain, stalls, trees, low walls
 K.box(-2.6,0,-1.1,2.6,.9,1.1,'stone',{kind:'fountain',vis:false});K.box(-1.1,0,-2.6,1.1,.9,2.6,'stone',{kind:'fountain',vis:false});K.box(-1.9,0,-1.9,1.9,.9,1.9,'stone',{kind:'fountain',vis:false});K.box(-.45,0,-.45,.45,2.8,.45,'stone',{kind:'fountain',vis:false});K.dec({k:'fountain',x:0,z:0});
 for(const[x,z,c]of[[-6,9,0xd2452f],[6,9,0x2f7fd2],[-6,-9,0x2fae6a],[6,-9,0xe0a020]]){K.box(x-1.1,0,z-.5,x+1.1,1,z+.5,'wood',{kind:'stall'});K.dec({k:'awning',x,z,w:3.2,d:2.4,y:2.5,col:c});}
 for(const[x,z]of[[-12,-12],[12,-14],[-13,12],[-24,-6],[-22,8],[-14,-26],[-14,28]]){K.box(x-.25,0,z-.25,x+.25,3,z+.25,'wood',{kind:'trunk',vis:false});K.dec({k:'tree',x,z,y:0,s:1.15});}
 for(const[x0,z0,x1,z1]of[[-17,-4,-16.4,4],[-26,-14,-20,-13.4],[-26,13.4,-20,14],[8,-14,8.6,-10],[8,10,8.6,14],[-4,14,2,14.6],[-3,-14.6,3,-14]])K.box(x0,0,z0,x1,1.05,z1,'stone',{kind:'lowwall'});
 K.box(-15,0,-24,-12.6,1.3,-22,'wood',{kind:'cart'});K.dec({k:'cart',x:-13.8,z:-23});K.crate(10,-18,1.2);K.crate(11.2,-18.2,1.1);K.crate(-30,-12,1.2);K.crate(-30,12,1.2);K.barrel(11,18);K.barrel(11.7,18.5,0,1);K.barrel(-17,-30);
 K.zone('PLAZA',-12,-12,12,12);K.zone('WEST GARDEN',-34,-18,-16,18);K.zone('NORTH LANE',-18,-20,14,-12);K.zone('SOUTH LANE',-18,12,14,20);
 K.pickup('hp',-25,0,-25);K.pickup('hp',-25,0,25);K.pickup('hp',26,2.4,20);K.pickup('hp',25,2.4,-20);K.pickup('hp',0,0,-26);K.pickup('hp',-31,3.95,0);
 K.pickup('ammo',-14,0,0);K.pickup('ammo',18,2.4,0);K.pickup('ammo',0,0,26);K.pickup('rl',27,by,-3);K.pickup('rl',0,0,0+3.4);
 const sp=[[-30,0,-12,0],[-30,0,8.5,0],[-25,0,-25,0],[-25,0,25,0],[-14,0,0,0],[-8,0,-16,0],[-2,0,-26,0],[30,2.4,6,1],[30,2.4,-12,1],[24,2.4,30,1],[24,2.4,-31,1],[17,2.4,10,1],[20,2.4,-8,1],[2,0,26,1]];
 for(const[x,y,z,tm]of sp)K.spawn(x,y,z,yawTo(x,z),tm);}

export const MAPS=[
 {id:'foundry',name:'FOUNDRY',sub:'STEELWORKS · DUSK',mood:'dusk',bounds:[-36,-36,36,36],ground:true,floor:'asphalt',build:foundry},
 {id:'skyline',name:'SKYLINE',sub:'NEON ROOFTOPS · NIGHT',mood:'night',bounds:[-35,-25,35,25],ground:false,killY:-12,build:skyline},
 {id:'meridian',name:'MERIDIAN',sub:'HILL TOWN · NOON',mood:'noon',bounds:[-34,-34,34,34],ground:true,floor:'cobble',build:meridian}];
