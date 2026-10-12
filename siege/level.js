// FORTRESS BREACH — level: the Halvorsen embassy (2 floors, 14 rooms), destructible wall panels as cell grids,
// floor slab with hatches, stairs, static boxes, collision, hitscan with penetration, line of sight, 2-layer nav grid + A*.
// No three.js dependency (unit-testable in node).
export const CELL=.2,FH=3.2,SLAB_B=2.95,ROOF=6.1,PH=3.0,STEP=.45,BAND=.36;
export const BX0=-12,BX1=12,BZ0=-8,BZ1=8,OX0=-32,OX1=32,OZ0=-26,OZ1=26,NX=OX1-OX0,NZ=OZ1-OZ0;
// penetration cost of each surface family (bullet "power" is spent crossing it). Infinity = stops bullets.
export const PEN={soft:.34,ext:.55,bar:.18,rein:1e9,hard:1e9,wood:.3,metal:.85,stone:1e9,glass:.05,hatch:.4,slab:1e9,ground:1e9,shield:1e9};
export const SND={soft:'plaster',ext:'wood',bar:'wood',rein:'metal',hard:'stone',wood:'wood',metal:'metal',stone:'stone',glass:'glass',hatch:'wood',slab:'stone',ground:'dirt',shield:'metal'};

/* ============================================================ LAYOUT
 Walls are axis-aligned runs on integer metre lines. axis 'x' = the run goes along x (normal is z).
 [floor, axis, c, u0, u1, type, openings]  type: soft (interior drywall) | ext (timber-frame exterior) | hard (concrete)
 openings: [a, kind] kind d=door (1.2 x 2.2) w=window (1.2, sill 1.0, top 2.2) A=archway (2.0 x 2.4)                       */
const WALLS=[
 // ---------- ground floor (y = 0) ----------
 [0,'x',-8,-12,-4,'ext',[[-9,'w']]],[0,'x',-8,-4,4,'hard',[]],[0,'x',-8,4,12,'ext',[[8,'d']]],
 [0,'x',8,-12,-4,'ext',[[-10,'w'],[-7,'w']]],[0,'x',8,-4,4,'ext',[[-1,'d'],[2,'w']]],[0,'x',8,4,12,'ext',[[6,'w'],[9,'w']]],
 [0,'z',-12,-8,0,'ext',[[-5,'w']]],[0,'z',-12,0,8,'ext',[[3,'w']]],
 [0,'z',12,-8,2,'ext',[[-5,'w']]],[0,'z',12,2,8,'ext',[[5,'w']]],
 [0,'z',-4,-8,-3,'soft',[]],[0,'z',-4,-3,0,'soft',[[-2,'d']]],[0,'z',-4,0,3,'soft',[]],[0,'z',-4,3,8,'soft',[[5,'d']]],
 [0,'z',4,-8,-3,'soft',[[-6,'d']]],[0,'z',4,-3,2,'soft',[]],[0,'z',4,2,8,'soft',[[5,'d']]],
 [0,'x',3,-4,2,'soft',[[-3,'A']]],[0,'x',-3,-4,4,'soft',[[-2,'d']]],[0,'x',0,-12,-4,'soft',[[-9,'d']]],[0,'x',2,4,12,'soft',[[7,'d']]],
 // ---------- upper floor (y = 3.2) ----------
 [1,'x',-8,-12,-4,'ext',[[-9,'w']]],[1,'x',-8,-4,4,'ext',[[0,'w']]],[1,'x',-8,4,12,'ext',[[8,'w']]],
 [1,'x',8,-12,-4,'ext',[[-10,'w'],[-7,'w']]],[1,'x',8,-4,4,'ext',[[0,'w']]],[1,'x',8,4,12,'ext',[[6,'w'],[9,'w']]],
 [1,'z',-12,-8,0,'ext',[[-5,'w']]],[1,'z',-12,0,8,'ext',[[3,'w']]],
 [1,'z',12,-8,0,'ext',[[-3,'d']]],[1,'z',12,0,8,'ext',[[4,'w']]],
 [1,'z',-4,-8,-3,'soft',[[-6,'d']]],[1,'z',-4,-3,0,'soft',[]],[1,'z',-4,0,3,'soft',[[1,'d']]],[1,'z',-4,3,8,'soft',[]],
 [1,'z',4,-8,0,'soft',[[-6,'d']]],[1,'z',4,0,8,'soft',[[5,'d']]],
 [1,'x',3,-4,4,'soft',[[-1,'d']]],[1,'x',0,-12,-4,'soft',[[-7,'d']]],[1,'x',0,4,12,'soft',[[8,'d']]]];

export const ROOMS=[
 {id:'living',n:'LIVING ROOM',f:0,r:[-12,-4,0,8],floor:'wood',tint:[.62,.55,.46],lamp:1},{id:'foyer',n:'FOYER',f:0,r:[-4,4,3,8],floor:'tile',tint:[.55,.6,.62],lamp:1},
 {id:'hall',n:'MAIN HALL',f:0,r:[-4,4,-3,3],floor:'wood',tint:[.5,.42,.36],lamp:1},{id:'dining',n:'DINING',f:0,r:[4,12,2,8],floor:'wood',tint:[.5,.56,.48],lamp:1},
 {id:'kitchen',n:'KITCHEN',f:0,r:[4,12,-8,2],floor:'tile',tint:[.72,.72,.68],lamp:1},{id:'vault',n:'VAULT',f:0,r:[-4,4,-8,-3],floor:'concrete',tint:[.44,.47,.5],lamp:1},
 {id:'study',n:'STUDY',f:0,r:[-12,-4,-8,0],floor:'carpet',tint:[.36,.42,.36],lamp:1},
 {id:'comms',n:'COMMS ROOM',f:1,r:[-12,-4,-8,0],floor:'carpet',tint:[.4,.44,.52],lamp:1},{id:'landing',n:'LANDING',f:1,r:[-4,4,-8,-3],floor:'wood',tint:[.52,.44,.38],lamp:1},
 {id:'gallery',n:'GALLERY',f:1,r:[-4,4,-3,3],floor:'wood',tint:[.52,.44,.38],lamp:1},{id:'bedroom',n:'BEDROOM',f:1,r:[-12,-4,0,8],floor:'carpet',tint:[.6,.5,.52],lamp:1},
 {id:'bath',n:'BATHROOM',f:1,r:[-4,4,3,8],floor:'tile',tint:[.7,.74,.76],lamp:1},{id:'server',n:'SERVER ROOM',f:1,r:[4,12,-8,0],floor:'server',tint:[.42,.46,.5],lamp:1},
 {id:'lounge',n:'LOUNGE',f:1,r:[4,12,0,8],floor:'wood',tint:[.55,.42,.34],lamp:1}];
const OUTZONES=[['STREET',-32,32,15,26],['FRONT YARD',-32,32,8,15],['GARDEN',-32,32,-26,-8],['ALLEY',-32,-12,-8,8],['SIDE YARD',12,32,-8,8]];

// hatches: [x,z] = min corner of a 1 m slab cell
const HATCHES=[[-2,0,'GALLERY HATCH'],[-1,-6,'LANDING HATCH'],[9,-6,'SERVER HATCH'],[-9,-5,'COMMS HATCH']];
// ramps: rect + height along an axis  {x0,x1,z0,z1, h(z) linear from h0 at zA to h1 at zB}
const RAMPS=[{x0:2.08,x1:3.92,z0:-3,z1:3,zA:3,zB:-3,h0:0,h1:FH,name:'STAIRS'},{x0:12.13,x1:14.1,z0:-1,z1:5,zA:5,zB:-1,h0:0,h1:FH,name:'OUTER STAIRS'}];

export const SITES=[
 {id:'server',n:'SERVER ROOM',f:1,r:[4,12,-8,0],c:[8,-4],plant:[[7,-4],[9,-3],[10,-5.4],[6.5,-5.6]],
  holds:[[11.2,-6.6,4,-5.4],[5,-1,12,-2.4],[6,-7.3,8.6,0],[10.8,-1.2,4,-5.4],[7.4,-4.3,12,-2.4]],
  rein:[[1,'z',4,-8,0],[1,'x',0,4,12],[1,'z',12,-8,0]],hatch:[2],
  breach:[[1,'z',4,-3.9,2.8,-3.9],[1,'x',0,6,6,1.1],[1,'z',12,-4.2,13.2,-4.2]],
  traps:[[2.6,-5.4],[8.6,.9],[13.1,-2.4],[3.2,-4.8]],shield:[[6.2,-5.4,1],[9,-1.4,0]],jam:[[5,-4],[10,-1]]},
 {id:'vault',n:'VAULT',f:0,r:[-4,4,-8,-3],c:[0,-5.5],plant:[[0,-6.6],[2.6,-4.4],[-2.5,-6.8],[-2,-4]],
  holds:[[3.2,-6.9,-1.4,-3],[-3.3,-6.9,4,-5.4],[-3.3,-3.6,4,-5.4],[1.5,-3.6,-4,-5.5],[-1.5,-5,-1.4,-3]],
  rein:[[0,'z',-4,-8,-3],[0,'z',4,-8,-3],[0,'x',-3,-4,4]],hatch:[1],
  breach:[[0,'z',-4,-5.5,-5,-5.5],[0,'z',4,-6.9,5,-6.7],[0,'x',-3,1.2,1.2,-2.1]],
  traps:[[-1.4,-2.2],[5,-5.4],[-1.5,-4.2],[4.8,-6]],shield:[[-1.4,-4.2,0],[2.8,-5.4,1]],jam:[[-3,-5],[3,-7]]},
 {id:'comms',n:'COMMS ROOM',f:1,r:[-12,-4,-8,0],c:[-8,-4],plant:[[-8,-4],[-10,-2],[-6,-6.5],[-10.4,-6.5]],
  holds:[[-11.2,-6.6,-4,-5.4],[-11.2,-1,-6.4,0],[-4.8,-6.7,-6.4,0],[-6,-1.2,-4,-5.4],[-8.5,-3.2,-4,-5.4]],
  rein:[[1,'z',-4,-8,-3],[1,'z',-4,-3,0],[1,'x',0,-12,-4]],hatch:[3],
  breach:[[1,'z',-4,-1.5,-3,-1.5],[1,'x',0,-10,-10,1.1],[1,'z',-4,-7,-3,-6.9]],
  traps:[[-3,-5.4],[-6.4,1],[-2.8,-1.4],[-6.4,-.8]],shield:[[-5.4,-5.4,1],[-6.4,-1,0]],jam:[[-5,-3],[-10,-1]]}];
export const SPAWNS={street:{n:'STREET',pts:[[-4,21],[-2,22.5],[0,21],[2,22.5],[4,21]],look:[0,0]},garden:{n:'GARDEN',pts:[[-6,-21],[-3,-22],[0,-21],[3,-22],[6,-21]],look:[0,0]},
 alley:{n:'ALLEY',pts:[[-27,-4],[-28,-2],[-27,0],[-28,2],[-27,4]],look:[0,0]}};
export const CAMS=[{n:'FRONT DOOR',p:[-2.6,2.7,8.45],look:[-1,1,22]},{n:'BACK GARDEN',p:[6,2.7,-8.45],look:[2,0,-22]},{n:'FOYER',p:[3.6,2.65,7.6],look:[-2,.8,3]},
 {n:'LANDING',p:[3.7,5.8,-7.6],look:[-3,3.6,-3]},{n:'KITCHEN',p:[11.6,2.65,1.6],look:[5,.8,-6]},{n:'LIVING',p:[-11.6,2.65,7.6],look:[-5,.6,1]},{n:'SIDE YARD',p:[12.4,2.7,6.5],look:[24,0,0]}];
// roam points (defender roamers + attacker clearing)
export const ROAM=[[-8,4,0],[-8,-5.5,0],[0,6,0],[0,0,0],[8,6.4,0],[8,-4,0],[0,-5.5,0],[-8,-4,1],[0,-5,1],[-1,0,1],[-8,4,1],[0,5.5,1],[8,-4,1],[8,2.2,1]];

/* ============================================================ panels */
export class Panel{
 constructor(o){Object.assign(this,o);this.cols=Math.round((this.u1-this.u0)/CELL);this.rows=Math.round(this.hgt/CELL);this.cells=new Uint8Array(this.cols*this.rows).fill(1);this.ver=0;this.rein=false;this.active=true;this.dmg=0;this.total=this.cols*this.rows;}
 get top(){return this.y0+this.rows*CELL;}
 at(c,r){return c<0||r<0||c>=this.cols||r>=this.rows?0:this.cells[r*this.cols+c];}
 solidAt(u,y){return this.at(Math.floor((u-this.u0)/CELL),Math.floor((y-this.y0)/CELL));}
 carveRect(a,b,y0,y1){let n=0;for(let r=Math.max(0,Math.round((y0-this.y0)/CELL));r<Math.min(this.rows,Math.round((y1-this.y0)/CELL));r++)for(let c=Math.max(0,Math.round((a-this.u0)/CELL));c<Math.min(this.cols,Math.round((b-this.u0)/CELL));c++){if(this.cells[r*this.cols+c]){this.cells[r*this.cols+c]=0;n++;}}if(n)this.ver++;return n;}
 world(u,y,side=0){return this.axis==='x'?{x:u,y,z:this.c+side*this.th/2}:{x:this.c+side*this.th/2,y,z:u};}
 intact(){let n=0;for(const v of this.cells)n+=v;return n/this.total;}
 reset(){this.cells.fill(1);if(this.pre)for(const p of this.pre)this.carveRect(...p);this.ver++;this.rein=false;this.dmg=0;}}

/* ============================================================ level */
export class Level{
 constructor(){this.boxes=[];this.walk=[];this.panels=[];this.openings=[];this.ramps=RAMPS;this.rooms=ROOMS;this.sites=SITES;
  this.hatches=HATCHES.map(([x,z,n],i)=>({i,x,z,n,state:'closed',hp:3,rein:false}));
  this.buildWalls();this.buildStatic();this.buildBuckets();for(const s of SITES){s.reinP=[];for(const[f,ax,c,a,b]of s.rein)s.reinP.push(...this.findPanels(f,ax,c,a,b).filter(p=>p.full));
   s.breachP=s.breach.map(([f,ax,c,u,sx,sz])=>({p:this.findPanels(f,ax,c,u-.01,u+.01)[0],u,f,stand:[sx,sz]})).filter(b=>b.p);}
  this.buildNav();}

 /* ---------- construction ---------- */
 buildWalls(){const ends=new Map();const addEnd=(f,x,z,ext)=>{const k=f+':'+x+':'+z;ends.set(k,{f,x,z,ext:ext||(ends.get(k)||{}).ext});};
  for(const[f,axis,c,u0,u1,type,ops]of WALLS){const base=f*FH;addEnd(f,axis==='x'?u0:c,axis==='x'?c:u0,type==='ext');addEnd(f,axis==='x'?u1:c,axis==='x'?c:u1,type==='ext');
   const th=type==='ext'?.26:type==='hard'?.34:.16;
   if(type==='hard'){this.wallBox(axis,c,u0,u1,base,base+PH,th,'hard',f);continue;}
   // split the run into full-height panels and opening panels
   const cuts=ops.map(([a,k])=>({a,w:k==='A'?2:1.2,k})).sort((p,q)=>p.a-q.a);let u=u0;
   const mk=(a,b,pre,op)=>{const p=new Panel({id:this.panels.length,axis,c,u0:a,u1:b,y0:base,hgt:PH,th,kind:type,f,full:!pre,pre});if(pre)for(const q of pre)p.carveRect(...q);p.ver=0;this.panels.push(p);return p;};
   for(const o of cuts){if(o.a>u+.01)mk(u,o.a,null);const y0=o.k==='w'?base+1:base,y1=base+(o.k==='w'?2.2:o.k==='A'?2.4:2.2);
    const p=mk(o.a,o.a+o.w,[[o.a,o.a+o.w,y0,y1]]);
    const op={id:this.openings.length,kind:o.k,panel:p,axis,c,a:o.a,b:o.a+o.w,y0,y1,f,bar:null};
    if(o.k!=='A'){const by0=o.k==='w'?y0:base+.2;op.bar=new Panel({id:this.panels.length,axis,c,u0:o.a,u1:o.a+o.w,y0:by0,hgt:y1-by0,th:.07,kind:'bar',f,full:false,op});op.bar.active=false;this.panels.push(op.bar);}
    this.openings.push(op);u=o.a+o.w;}
   if(u1>u+.01)mk(u,u1,null);}
  // junction pillars hide the seams
  for(const e of ends.values()){const s=e.ext?.2:.13;this.addBox(e.x-s,e.f*FH,e.z-s,e.x+s,e.f*FH+PH,e.z+s,'hard',{kind:'pillar'});}}
 wallBox(axis,c,u0,u1,y0,y1,th,mat,f){return axis==='x'?this.addBox(u0,y0,c-th/2,u1,y1,c+th/2,mat,{kind:'wall',f}):this.addBox(c-th/2,y0,u0,c+th/2,y1,u1,mat,{kind:'wall',f});}
 addBox(x0,y0,z0,x1,y1,z1,mat,o={}){const b={x0:Math.min(x0,x1),y0:Math.min(y0,y1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),y1:Math.max(y0,y1),z1:Math.max(z0,z1),mat,kind:o.kind||mat,coll:o.coll!==false,ray:o.ray!==false,vis:o.vis!==false,col:o.col,f:o.f,id:this.boxes.length,prop:o.prop,rot:o.rot};
  this.boxes.push(b);if(o.walk)this.walk.push(b);return b;}
 // furniture + exterior props. prop = render hint for world.js
 buildStatic(){const B=(x0,z0,x1,z1,h,mat,prop,f=0,o={})=>this.addBox(x0,f*FH+(o.y||0),z0,x1,f*FH+(o.y||0)+h,z1,mat,{kind:'prop',prop,walk:o.walk,col:o.col});
  // stair stringers (solid under the ramps) + railings
  for(let i=0;i<6;i++){const zA=3-i,zB=2-i;if(i>0)this.addBox(2.08,0,Math.min(zA,zB),3.92,Math.max(.05,FH*i/6-.5),Math.max(zA,zB),'hard',{kind:'under',vis:false});}
  for(let i=0;i<6;i++){const zA=5-i,zB=4-i;if(i>0)this.addBox(12.13,0,Math.min(zA,zB),14.1,Math.max(.05,FH*i/6-.5),Math.max(zA,zB),'hard',{kind:'under',vis:false});}
  this.addBox(1.92,FH*.5,-3,2.06,FH+1.05,2.2,'wood',{kind:'rail',prop:'rail'});// interior stair balustrade (upper part)
  this.addBox(1.92,0,-3,2.06,FH*.5,2.2,'hard',{kind:'stringer',prop:'stringer'});
  // balcony + outer stair rail
  this.addBox(12.13,FH-.22,-5,14.6,FH,-1,'hard',{kind:'balcony',walk:true,prop:'balcony'});
  this.addBox(14.48,FH,-5,14.6,FH+1.05,-1,'metal',{kind:'rail',prop:'rail'});this.addBox(12.13,FH,-5.1,14.6,FH+1.05,-4.98,'metal',{kind:'rail',prop:'rail'});
  this.addBox(14.1,0,-1,14.22,FH+1,5,'metal',{kind:'rail',prop:'srail',ray:false});
  for(const[x,z]of[[14.4,-4.85],[14.4,-1.15]])this.addBox(x-.1,0,z-.1,x+.1,FH-.22,z+.1,'metal',{kind:'post',prop:'post'});
  // ---- furniture (wood = penetrable, metal = mostly not)
  // living
  B(-10.4,4.4,-7.6,5.3,.85,'wood','sofa');B(-9.6,2.4,-8.2,3.2,.45,'wood','table');B(-11.85,1,-11.45,3.2,.6,'wood','cabinet');B(-5.2,7.45,-4.2,7.85,1.9,'wood','shelf');
  B(-5.6,.15,-4.2,.6,1.0,'wood','cabinet');
  // foyer
  B(2.6,7.5,3.85,7.9,.85,'wood','cabinet');B(-3.85,3.2,-3.45,4.6,.9,'wood','cabinet');
  // hall
  B(-3.85,-2.7,-3.45,-.9+.6,.85,'wood','cabinet');
  // vault: deposit cabinets, steel table, crates
  B(-3.8,-7.85,3.8,-7.35,2.2,'metal','lockers');B(.6,-5.6,2.4,-4.8,.92,'metal','steeltable');B(-.4,-4.2,.6,-3.4,1.1,'wood','crate');
  // kitchen
  B(6.6,-3.2,9.4,-2,.95,'wood','island');B(4.2,-7.85,7.4,-7.25,.95,'wood','counter');B(11.25,-2,11.85,1.6,.95,'wood','counter');B(10.85,-7.85,11.85,-6.9,2,'metal','fridge');
  // dining
  B(6,4.5,10,5.5,.78,'wood','dtable');B(11.4,2.4,11.85,4.4,1.1,'wood','cabinet');B(4.2,7.4,5.6,7.85,.9,'wood','cabinet');
  // study
  B(-10,-4.2,-8,-3.3,.8,'wood','desk');B(-11.85,-7.85,-11.4,-6,2.1,'wood','shelf');B(-7.4,-7.85,-4.6,-7.45,2.1,'wood','shelf');B(-6.2,-1.4,-4.6,-.5,.85,'wood','sofa');
  // comms (upper)
  B(-11.85,-4.4,-11.1,-1.6,.8,'wood','desk',1);B(-9.2,-7.85,-5.2,-7.2,.8,'wood','desk',1);B(-7.2,-3.4,-5.6,-2.6,1.6,'metal','console',1);B(-11.85,-7.85,-10.6,-7.2,1.9,'metal','rack',1);
  // server (upper)
  B(5.8,-6.75,8.6,-6.15,2,'metal','rack',1);B(5.8,-3,8.6,-2.4,2,'metal','rack',1);B(10.4,-7.85,11.85,-7.2,.8,'wood','desk',1);B(10.6,-3.4,11.4,-2.6,1.2,'metal','ups',1);
  // landing
  B(-3.85,-7.85,-2.2,-7.4,.5,'wood','bench',1);B(2.4,-7.85,3.85,-7.4,1.9,'wood','shelf',1);
  // bedroom
  B(-11.85,3.8,-9.6,6.2,.62,'wood','bed',1);B(-6,7.4,-4.2,7.85,2,'wood','wardrobe',1);B(-11.85,1,-11.3,2.4,.7,'wood','cabinet',1);
  // bath
  B(1.6,6.4,3.85,7.85,.62,'metal','tub',1);B(-3.85,6.9,-2.7,7.85,.9,'wood','cabinet',1);
  // lounge
  B(6.6,3.5,9.4,5,.86,'wood','pool',1);B(11.3,1,11.85,4.4,1.1,'wood','bar',1);B(4.2,7.4,6.6,7.85,.85,'wood','sofa',1);
  // ---- exterior
  const E=(x0,z0,x1,z1,h,mat,prop,o={})=>this.addBox(x0,0,z0,x1,h,z1,mat,{kind:'ext',prop,col:o.col,walk:o.walk,ray:o.ray});
  // perimeter hedges / walls
  E(OX0,OZ0-1,OX1,OZ0,3.4,'stone','hedge');E(OX0,OZ1,OX1,OZ1+1,3.4,'stone','hedge');E(OX0-1,OZ0,OX0,OZ1,3.4,'stone','hedge');E(OX1,OZ0,OX1+1,OZ1,3.4,'stone','hedge');
  // front garden wall with gate
  E(-30,13,-2,13.4,1,'stone','lowwall');E(2,13,30,13.4,1,'stone','lowwall');
  // street cars + van
  E(-13.2,18.2,-8.8,20,1.45,'metal','car',{col:0});E(8,20.4,12.4,22.2,1.45,'metal','car',{col:1});E(-24,19.6,-18,21.8,2.4,'metal','van',{col:2});E(20,17.6,24.4,19.4,1.45,'metal','car',{col:3});
  // front yard planters
  E(-9,10.2,-6,11.2,.7,'stone','planter');E(6,10.2,9,11.2,.7,'stone','planter');
  // garden: shed, fountain, low walls, trees
  E(-16,-20,-12,-17,2.7,'wood','shed');E(5,-18,7.4,-15.6,.85,'stone','fountain');E(-6,-14,2,-13.6,1,'stone','lowwall');E(10,-14,18,-13.6,1,'stone','lowwall');
  for(const[x,z]of[[-22,-16],[18,-20],[-8,-22],[24,-4],[-24,12],[26,14],[14,-12]])E(x-.3,z-.3,x+.3,z+.3,5,'wood','tree');
  // alley: dumpsters, fence segments, generator
  E(-19,-6,-17,-4.6,1.4,'metal','dumpster');E(-19,5,-17,6.4,1.4,'metal','dumpster');E(-22,-12,-21.8,-2,2,'wood','fence');E(-22,2,-21.8,10,2,'wood','fence');E(-15,-1,-13.8,1,1.2,'metal','generator');
  // side yard: garage + cars + crates
  E(22,-14,30,-6,3.2,'stone','garage');E(17,3,19,7.4,1.45,'metal','car',{col:4});E(17.2,-6,21.6,-4.2,1.45,'metal','car',{col:5});E(15,9,16.4,10.4,1.1,'wood','crate');E(24,4,25.4,5.4,1.1,'wood','crate');}

 // 4 m buckets of static boxes + panels for fast collision queries
 buildBuckets(){const S=4,W=Math.ceil(NX/S)+2,H=Math.ceil(NZ/S)+2;this.bk={S,W,H,b:Array.from({length:W*H},()=>[]),p:Array.from({length:W*H},()=>[])};
  const ins=(x0,z0,x1,z1,list,o)=>{const i0=Math.max(0,Math.floor((x0-.6-OX0)/S)+1),i1=Math.min(W-1,Math.floor((x1+.6-OX0)/S)+1),j0=Math.max(0,Math.floor((z0-.6-OZ0)/S)+1),j1=Math.min(H-1,Math.floor((z1+.6-OZ0)/S)+1);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)this.bk[list][j*W+i].push(o);};
  for(const b of this.boxes)if(b.coll)ins(b.x0,b.z0,b.x1,b.z1,'b',b);for(const p of this.panels){if(p.axis==='x')ins(p.u0,p.c-p.th,p.u1,p.c+p.th,'p',p);else ins(p.c-p.th,p.u0,p.c+p.th,p.u1,'p',p);}}
 bucket(x,z){const B=this.bk,i=Math.max(0,Math.min(B.W-1,Math.floor((x-OX0)/B.S)+1)),j=Math.max(0,Math.min(B.H-1,Math.floor((z-OZ0)/B.S)+1));return j*B.W+i;}
 findPanels(f,axis,c,a,b){return this.panels.filter(p=>p.f===f&&p.axis===axis&&Math.abs(p.c-c)<.01&&p.kind!=='bar'&&p.u1>a+.001&&p.u0<b-.001);}
 /* ---------- spatial queries ---------- */
 inFoot(x,z){return x>BX0&&x<BX1&&z>BZ0&&z<BZ1;}
 hatchAt(x,z){const ix=Math.floor(x),iz=Math.floor(z);for(const h of this.hatches)if(h.x===ix&&h.z===iz)return h;return null;}
 // 0 = none/outside, 1 = solid slab, 2 = stairwell, 3 = hatch closed, 4 = hatch open
 slab(x,z){if(!this.inFoot(x,z))return 0;if(x>2&&x<4&&z>-3&&z<3)return 2;const h=this.hatchAt(x,z);if(h)return h.state==='open'?4:3;return 1;}
 slabSolid(x,z){const s=this.slab(x,z);return s===1||s===3;}
 rampAt(x,z){for(const r of RAMPS)if(x>=r.x0-.08&&x<=r.x1+.08&&z>=r.z0&&z<=r.z1)return r.h0+(r.h1-r.h0)*((z-r.zA)/(r.zB-r.zA));return null;}
 groundAt(x,z,y){let g=0;const r=this.rampAt(x,z);if(r!==null&&r<=y+STEP+.3)g=Math.max(0,r);if(FH<=y+STEP&&this.slabSolid(x,z))g=Math.max(g,FH);
  for(const b of this.walk)if(x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1&&b.y1<=y+STEP&&b.y1>g)g=b.y1;return g;}
 ceilAt(x,z,y){let c=99;if(this.inFoot(x,z)){if(y<SLAB_B-.1&&this.slabSolid(x,z))c=SLAB_B;else if(y<ROOF)c=ROOF;}for(const b of this.walk)if(x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1&&b.y0>y+.3&&b.y0<c)c=b.y0;return c;}
 floorOf(y){return y>FH-.9?1:0;}
 roomAt(x,z,y){const f=y>FH-.6?1:0;for(const r of ROOMS)if(r.f===f&&x>r.r[0]&&x<r.r[1]&&z>r.r[2]&&z<r.r[3])return r;return null;}
 callout(x,z,y){const r=this.roomAt(x,z,y);if(r)return r.n;if(x>12&&x<14.7&&z>-5.2&&z<-1&&y>2)return'BALCONY';if(this.rampAt(x,z)!==null&&x>12)return'OUTER STAIRS';
  for(const[n,x0,x1,z0,z1]of OUTZONES)if(x>=x0&&x<=x1&&z>=z0&&z<=z1)return n;return'GROUNDS';}
 /* ---------- collision: circle (radius r) of an actor with feet at y and height h ---------- */
 collide(p,r,h,o={}){const yb=p.y+(o.band??BAND),yt=p.y+h;let hit=false;
  const bi=this.bucket(p.x,p.z);
  for(const b of this.bk.b[bi]){if(b.y1<=yb||b.y0>=yt)continue;if(p.x<b.x0-r||p.x>b.x1+r||p.z<b.z0-r||p.z>b.z1+r)continue;if(this.pushBox(p,r,b.x0,b.z0,b.x1,b.z1))hit=true;}
  for(const b of this.dyn||[]){if(!b.coll||b.y1<=yb||b.y0>=yt)continue;if(p.x<b.x0-r||p.x>b.x1+r||p.z<b.z0-r||p.z>b.z1+r)continue;if(this.pushBox(p,r,b.x0,b.z0,b.x1,b.z1))hit=true;}
  for(const pn of this.bk.p[bi]){if(!pn.active||(o.noBar&&pn.kind==='bar'))continue;if(this.panelPush(p,r,yb,yt,pn))hit=true;}return hit;}
 pushBox(p,r,x0,z0,x1,z1){const cx=Math.max(x0,Math.min(p.x,x1)),cz=Math.max(z0,Math.min(p.z,z1));let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;if(d2>=r*r)return false;
  if(d2<1e-8){// centre inside: push out along the shallowest axis
   const l=p.x-x0,R=x1-p.x,t=p.z-z0,B=z1-p.z,m=Math.min(l,R,t,B);if(m===l)p.x=x0-r;else if(m===R)p.x=x1+r;else if(m===t)p.z=z0-r;else p.z=z1+r;return true;}
  const d=Math.sqrt(d2),k=(r-d)/d;p.x+=dx*k;p.z+=dz*k;return true;}
 // columns of the panel overlapping the circle, merged into runs of solid columns
 panelPush(p,r,yb,yt,pn){const ax=pn.axis==='x';const pu=ax?p.x:p.z,pv=ax?p.z:p.x,ht=pn.th/2;if(Math.abs(pv-pn.c)>ht+r||pu<pn.u0-r||pu>pn.u1+r)return false;if(yt<=pn.y0||yb>=pn.top)return false;
  const r0=Math.max(0,Math.floor((yb-pn.y0)/CELL)),r1=Math.min(pn.rows-1,Math.floor((yt-pn.y0-1e-4)/CELL));const c0=Math.max(0,Math.floor((pu-r-pn.u0)/CELL)),c1=Math.min(pn.cols-1,Math.floor((pu+r-pn.u0)/CELL));
  let hit=false,run=-1;const flush=(a,b)=>{const ua=pn.u0+a*CELL,ub=pn.u0+(b+1)*CELL;const q={x:ax?p.x:p.z,z:ax?p.z:p.x};if(this.pushBox(q,r,ua,pn.c-ht,ub,pn.c+ht)){hit=true;if(ax){p.x=q.x;p.z=q.z;}else{p.z=q.x;p.x=q.z;}}};
  for(let c=c0;c<=c1+1;c++){let s=false;if(c<=c1)for(let rr=r0;rr<=r1;rr++)if(pn.cells[rr*pn.cols+c]){s=true;break;}if(s&&run<0)run=c;else if(!s&&run>=0){flush(run,c-1);run=-1;}}return hit;}
 // is a circle free of solids at height h (nav probe)
 free(x,z,h,r=.3,o={}){const p={x,y:h,z};const ox=x,oz=z;this.collide(p,r,1.7,{band:.4,noBar:o.noBar});return Math.abs(p.x-ox)<.02&&Math.abs(p.z-oz)<.02;}
 /* ---------- rays ---------- */
 // nearest hit from o along unit d up to maxT. returns {t,type,obj,mat,nx,ny,nz,exit} or null. skip: Set of objects to ignore
 ray(ox,oy,oz,dx,dy,dz,maxT,skip,o={}){let best=null;const set=(t,type,obj,mat,nx,ny,nz,exit)=>{if(t<(best?best.t:maxT))best={t,type,obj,mat,nx,ny,nz,exit};};
  const idx=1/dx,idy=1/dy,idz=1/dz;
  const testBox=(b,type)=>{if(skip&&skip.has(b))return;let t0=(b.x0-ox)*idx,t1=(b.x1-ox)*idx;if(t0>t1){const s=t0;t0=t1;t1=s;}let u0=(b.y0-oy)*idy,u1=(b.y1-oy)*idy;if(u0>u1){const s=u0;u0=u1;u1=s;}
   let v0=(b.z0-oz)*idz,v1=(b.z1-oz)*idz;if(v0>v1){const s=v0;v0=v1;v1=s;}const tn=Math.max(t0,u0,v0),tf=Math.min(t1,u1,v1);if(tn>tf||tf<0||tn<0)return;if(tn>=(best?best.t:maxT))return;
   const nx=tn===t0?-Math.sign(dx):0,ny=tn===u0&&!nx?-Math.sign(dy):0,nz=!nx&&!ny?-Math.sign(dz):0;set(tn,type,b,b.mat,nx,ny,nz,tf);};
  for(const b of this.boxes)if(b.ray)testBox(b,'box');for(const b of this.dyn||[])if(b.ray)testBox(b,'dyn');
  for(const pn of this.panels){if(!pn.active||skip&&skip.has(pn))continue;const ax=pn.axis==='x';const dn=ax?dz:dx,on=ax?oz:ox;if(Math.abs(dn)<1e-7)continue;const t=(pn.c-on)/dn;if(t<=0||t>=(best?best.t:maxT))continue;
   const u=(ax?ox+dx*t:oz+dz*t),y=oy+dy*t;if(u<pn.u0||u>=pn.u1||y<pn.y0||y>=pn.top)continue;if(o.ghostBar&&pn.kind==='bar')continue;if(!pn.solidAt(u,y))continue;
   const s=-Math.sign(dn);set(t,'panel',pn,pn.rein?'rein':pn.kind,ax?0:s,0,ax?s:0,t+pn.th/Math.max(.2,Math.abs(dn)));best&&best.obj===pn&&(best.u=u,best.y=y);}
  // upper floor slab (mid plane), roof, ground
  if(Math.abs(dy)>1e-7){const ps=[[FH-.12,'slab'],[ROOF+.1,'roof'],[0,'ground']];for(const[py,k]of ps){const t=(py-oy)/dy;if(t<=0||t>=(best?best.t:maxT))continue;const x=ox+dx*t,z=oz+dz*t;
    if(k==='slab'){const s=this.slab(x,z);if(s===1)set(t,'slab',null,'slab',0,-Math.sign(dy),0,t+.3/Math.abs(dy));else if(s===3){const h=this.hatchAt(x,z);if(skip&&skip.has(h))continue;set(t,'hatch',h,h.rein?'rein':'hatch',0,-Math.sign(dy),0,t+.12/Math.abs(dy));}}
    else if(k==='roof'){if(this.inFoot(x,z))set(t,'roof',null,'hard',0,-Math.sign(dy),0,t+1);}else if(x>OX0-2&&x<OX1+2&&z>OZ0-2&&z<OZ1+2)set(t,'ground',null,'ground',0,1,0,t+1);}}
  return best;}
 los(ax,ay,az,bx,by,bz,skip){const dx=bx-ax,dy=by-ay,dz=bz-az,d=Math.hypot(dx,dy,dz);if(d<1e-4)return true;const h=this.ray(ax,ay,az,dx/d,dy/d,dz/d,d-.02,skip);return!h;}

 /* ---------- destruction ---------- */
 // remove cells within radius rad around (u,y) on the panel; jag adds ragged edges. returns removed cell centres [{u,y}]
 carve(pn,u,y,rad,o={}){if(!pn.active||pn.rein&&!o.thermal)return[];const out=[];const jag=o.jag??.35,ry=o.ry??rad;
  const c0=Math.max(0,Math.floor((u-rad*1.4-pn.u0)/CELL)),c1=Math.min(pn.cols-1,Math.floor((u+rad*1.4-pn.u0)/CELL)),r0=Math.max(0,Math.floor((y-ry*1.4-pn.y0)/CELL)),r1=Math.min(pn.rows-1,Math.floor((y+ry*1.4-pn.y0)/CELL));
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const k=r*pn.cols+c;if(!pn.cells[k])continue;const cu=pn.u0+(c+.5)*CELL,cy=pn.y0+(r+.5)*CELL;const du=Math.abs(cu-u)/rad,dv=Math.abs(cy-y)/ry,dd=o.sq?Math.pow(du**4+dv**4,.25):Math.hypot(du,dv);
   if(dd<1-jag*.5+Math.random()*jag){if(o.minY!==undefined&&cy<o.minY)continue;pn.cells[k]=0;out.push({u:cu,y:cy});}}
  // floating islands: tiny unsupported chunks fall out
  if(out.length){pn.ver++;pn.dmg+=out.length;this.dropIslands(pn,out);this.dirtyPanel(pn);}return out;}
 dropIslands(pn,out){const C=pn.cols,R=pn.rows,seen=new Uint8Array(C*R);const stack=[];// flood from anchored edges (sides + bottom + top)
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(!(c===0||c===C-1||r===0||r===R-1))continue;const k=r*C+c;if(pn.cells[k]&&!seen[k]){seen[k]=1;stack.push(k);}}
  while(stack.length){const k=stack.pop(),c=k%C,r=(k/C)|0;for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const cc=c+dc,rr=r+dr;if(cc<0||rr<0||cc>=C||rr>=R)continue;const q=rr*C+cc;if(pn.cells[q]&&!seen[q]){seen[q]=1;stack.push(q);}}}
  for(let k=0;k<C*R;k++)if(pn.cells[k]&&!seen[k]){pn.cells[k]=0;out.push({u:pn.u0+(k%C+.5)*CELL,y:pn.y0+((k/C|0)+.5)*CELL});}}
 breakHatch(h,o={}){if(h.state==='open'||h.rein&&!o.thermal)return false;h.state='open';h.rein=false;this.dirtyHatch(h);return true;}
 dirtyPanel(pn){(this.dirty||(this.dirty=new Set())).add(pn);}
 dirtyHatch(h){(this.dirtyH||(this.dirtyH=new Set())).add(h);}
 // apply pending nav updates (call once per tick)
 flushNav(){if(this.dirty&&this.dirty.size){for(const pn of this.dirty)this.reNavPanel(pn);this.dirty.clear();}if(this.dirtyH&&this.dirtyH.size){for(const h of this.dirtyH)this.reNavHatch(h);this.dirtyH.clear();}}
 resetRound(){for(const p of this.panels){if(p.kind==='bar'){p.active=false;p.cells.fill(1);p.ver++;p.rein=false;}else p.reset();}for(const h of this.hatches){h.state='closed';h.rein=false;h.hp=3;}this.dyn=[];this.buildNav();}

 /* ============================================================ navigation: 1 m cells, layer 0 = ground floor/outside, layer 1 = upper floor/balcony */
 nid(l,ix,iz){return l*NX*NZ+iz*NX+ix;}
 cellC(ix,iz){return[OX0+ix+.5,OZ0+iz+.5];}
 nodeOf(x,z,y){const ix=Math.floor(x-OX0),iz=Math.floor(z-OZ0);if(ix<0||iz<0||ix>=NX||iz>=NZ)return-1;const a=this.nid(0,ix,iz),b=this.nid(1,ix,iz);const ok0=this.nOK[a],ok1=this.nOK[b];
  if(ok0&&ok1)return Math.abs(this.nH[a]-y)<Math.abs(this.nH[b]-y)?a:b;return ok1?b:ok0?a:-1;}
 // nearest valid node (spiral search)
 nearNode(x,z,y){let n=this.nodeOf(x,z,y);if(n>=0&&Math.abs(this.nH[n]-y)<1.6)return n;let best=-1,bd=1e9;const ix=Math.floor(x-OX0),iz=Math.floor(z-OZ0);
  for(let r=1;r<=3&&best<0;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){if(Math.max(Math.abs(i),Math.abs(j))!==r)continue;const cx=ix+i,cz=iz+j;if(cx<0||cz<0||cx>=NX||cz>=NZ)continue;for(let l=0;l<2;l++){const k=this.nid(l,cx,cz);if(!this.nOK[k])continue;const q=this.nodePos(k);const d=Math.hypot(q.x-x,q.z-z)+Math.abs(q.y-y)*1.5;if(d>=bd)continue;if(!this.los(x,y+.9,z,q.x,q.y+.9,q.z))continue;bd=d;best=k;}}return best;}
 nodePos(n){const l=n>=NX*NZ?1:0,k=n-l*NX*NZ,ix=k%NX,iz=(k/NX)|0;return{x:OX0+ix+.5,z:OZ0+iz+.5,y:this.nH[n],l};}
 nodeHeight(l,ix,iz){const[x,z]=this.cellC(ix,iz);if(l===0){const r=this.rampAt(x,z);return r!==null?r:0;}if(this.slabSolid(x,z)||(x>12&&x<14.6&&z>-5&&z<-1))return FH;return null;}
 buildNav(){const N=NX*NZ*2;this.nOK=new Uint8Array(N);this.nH=new Float32Array(N);this.adj=new Array(N);
  for(let l=0;l<2;l++)for(let iz=0;iz<NZ;iz++)for(let ix=0;ix<NX;ix++)this.evalNode(l,ix,iz);
  for(let n=0;n<N;n++)if(this.nOK[n])this.adj[n]=this.edges(n);}
 evalNode(l,ix,iz){const k=this.nid(l,ix,iz);const h=this.nodeHeight(l,ix,iz);if(h===null||(l===0&&h>2.6&&this.rampAt(...this.cellC(ix,iz))===null)){this.nOK[k]=0;return;}const[x,z]=this.cellC(ix,iz);
  this.nH[k]=h;this.nOK[k]=this.free(x,z,h,.3,{noBar:true})?1:0;}
 // edges of node n: [nb, cost, flag] flag: 0 walk, 1 barricade (breakable), 2 drop (hatch)
 edges(n){const out=[];const p=this.nodePos(n);const l=p.l,k=n-l*NX*NZ,ix=k%NX,iz=(k/NX)|0;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const jx=ix+dx,jz=iz+dz;if(jx<0||jz<0||jx>=NX||jz>=NZ)continue;
   for(let m=0;m<2;m++){const nb=this.nid(m,jx,jz);if(!this.nOK[nb])continue;const hb=this.nH[nb];if(Math.abs(hb-p.y)>.75)continue;
    if(dx&&dz){// diagonal: both orthogonals must be walkable at a similar height
     const a=this.nodeOf(p.x+dx,p.z,p.y),b=this.nodeOf(p.x,p.z+dz,p.y);if(a<0||b<0||Math.abs(this.nH[a]-p.y)>.75||Math.abs(this.nH[b]-p.y)>.75)continue;}
    const fl=this.passFlag(p.x,p.z,p.y,p.x+dx,p.z+dz,hb);if(fl<0)continue;out.push([nb,(dx&&dz?1.414:1)+Math.abs(hb-p.y)*.5+(fl===1?6:0),fl,fl===1?this.barAt(p.x,p.z,p.x+dx,p.z+dz,Math.max(p.y,hb)):null]);}}
  // hatch drops: open hatch next to this upper-floor node
  if(l===1)for(const h of this.hatches){if(h.state!=='open')continue;const hx=h.x+.5,hz=h.z+.5;if(Math.abs(hx-p.x)<1.1&&Math.abs(hz-p.z)<1.1&&!(hx===p.x&&hz===p.z)){const t=this.nodeOf(hx,hz,0);if(t>=0)out.push([t,3,2,h]);}}
  return out;}
 passFlag(ax,az,ah,bx,bz,bh){let ok=true;for(const t of[.25,.5,.75]){if(!this.free(ax+(bx-ax)*t,az+(bz-az)*t,ah+(bh-ah)*t,.27)){ok=false;break;}}if(ok)return 0;
  for(const t of[.25,.5,.75])if(!this.free(ax+(bx-ax)*t,az+(bz-az)*t,ah+(bh-ah)*t,.27,{noBar:true}))return-1;return 1;}
 barAt(ax,az,bx,bz,h){const mx=(ax+bx)/2,mz=(az+bz)/2;for(const p of this.panels){if(p.kind!=='bar'||!p.active)continue;const ax2=p.axis==='x';const u=ax2?mx:mz,v=ax2?mz:mx;if(Math.abs(v-p.c)<.8&&u>p.u0-.4&&u<p.u1+.4&&h<p.top&&h+1.8>p.y0)return p;}return null;}
 reNavArea(x0,z0,x1,z1){const ix0=Math.max(0,Math.floor(x0-OX0)-1),ix1=Math.min(NX-1,Math.floor(x1-OX0)+1),iz0=Math.max(0,Math.floor(z0-OZ0)-1),iz1=Math.min(NZ-1,Math.floor(z1-OZ0)+1);
  for(let l=0;l<2;l++)for(let iz=iz0;iz<=iz1;iz++)for(let ix=ix0;ix<=ix1;ix++)this.evalNode(l,ix,iz);
  for(let l=0;l<2;l++)for(let iz=Math.max(0,iz0-1);iz<=Math.min(NZ-1,iz1+1);iz++)for(let ix=Math.max(0,ix0-1);ix<=Math.min(NX-1,ix1+1);ix++){const n=this.nid(l,ix,iz);this.adj[n]=this.nOK[n]?this.edges(n):null;}this.navVer=(this.navVer||0)+1;}
 reNavPanel(pn){if(pn.axis==='x')this.reNavArea(pn.u0,pn.c-.6,pn.u1,pn.c+.6);else this.reNavArea(pn.c-.6,pn.u0,pn.c+.6,pn.u1);}
 reNavHatch(h){this.reNavArea(h.x-1,h.z-1,h.x+2,h.z+2);}
 reNavBox(b){this.reNavArea(b.x0,b.z0,b.x1,b.z1);}
 // A* over the nav graph. o.bar: allow barricade edges (attackers), o.drone: barricades are no obstacle
 path(from,to,o={}){if(from<0||to<0)return null;if(from===to)return[to];const N=this.nOK.length;const g=this.gS||(this.gS=new Float32Array(N)),came=this.cm||(this.cm=new Int32Array(N)),stamp=this.st||(this.st=new Uint32Array(N));
  const run=this.run=(this.run||0)+1;const tp=this.nodePos(to);const H=n=>{const p=this.nodePos(n);const dx=Math.abs(p.x-tp.x),dz=Math.abs(p.z-tp.z);return Math.max(dx,dz)+.414*Math.min(dx,dz)+Math.abs(p.y-tp.y);};
  const heap=[[H(from),from]];stamp[from]=run;g[from]=0;came[from]=-1;let it=0;
  while(heap.length&&it++<20000){const[,n]=hpop(heap);if(n===to){const out=[];let c=n;while(c>=0){out.push(c);c=came[c];}return out.reverse();}
   const A=this.adj[n];if(!A)continue;for(const[nb,cost,fl]of A){if(fl===1&&!o.bar&&!o.drone)continue;if(o.inside&&!this.isIn(nb))continue;const c=fl===1&&o.drone?1:cost;const ng=g[n]+c;if(stamp[nb]===run&&ng>=g[nb])continue;stamp[nb]=run;g[nb]=ng;came[nb]=n;hpush(heap,[ng+H(nb),nb]);}}
  return null;}
 isIn(n){if(!this.inMask){this.inMask=new Uint8Array(NX*NZ*2);for(let k=0;k<NX*NZ*2;k++){const p=this.nodePos(k);this.inMask[k]=this.inFoot(p.x,p.z)||(p.x>12&&p.x<14.7&&p.z>-5.2&&p.z<5.2)?1:0;}}return this.inMask[n];}
 edgeFlag(a,b){const A=this.adj[a];if(!A)return null;for(const e of A)if(e[0]===b)return e;return null;}
}
function hpush(h,v){h.push(v);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p][0]<=h[i][0])break;[h[p],h[i]]=[h[i],h[p]];i=p;}}
function hpop(h){const top=h[0],last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<h.length&&h[l][0]<h[m][0])m=l;if(r<h.length&&h[r][0]<h[m][0])m=r;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m;}}return top;}
