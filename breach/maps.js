// BREACH POINT — level data: grid-painted maps, collision boxes, hitscan rays with penetration, heightfield, nav grid + A*.
// No three.js dependency so it can be unit-tested in node.
export const CS=2,STEP=.48;
// box materials: pen = penetration cost per metre (Infinity = impenetrable), snd = impact sound family
export const MATS={
 wall:{pen:1e9,snd:'stone'},low:{pen:6,snd:'stone'},wood:{pen:.55,snd:'wood'},crate:{pen:.5,snd:'wood'},thin:{pen:1.6,snd:'wood'},metal:{pen:.45,snd:'metal'},
 barrel:{pen:.9,snd:'metal'},roof:{pen:1e9,snd:'stone'},floor:{pen:1e9,snd:'stone'},water:{pen:1e9,snd:'water'}};
const WALLS={'#':6,'%':3.4,'*':9.5,'@':6};
export const SOLIDCH='#%*@~cCoLk|-';

function painter(W,H){const g=Array.from({length:H},()=>Array(W).fill('#'));
 const ok=(c,r)=>c>0&&r>0&&c<W-1&&r<H-1;
 return{g,W,H,
  rect(c0,r0,c1,r1,ch){for(let r=Math.min(r0,r1);r<=Math.max(r0,r1);r++)for(let c=Math.min(c0,c1);c<=Math.max(c0,c1);c++)if(ok(c,r))g[r][c]=ch;},
  set(c,r,ch){if(ok(c,r))g[r][c]=ch;},
  pts(ch,...l){for(const[c,r]of l)if(ok(c,r))g[r][c]=ch;},
  hline(r,c0,c1,ch){this.rect(c0,r,c1,r,ch);},vline(c,r0,r1,ch){this.rect(c,r0,c,r1,ch);}};}

/* ===================================================================== MAPS
 Legend (each cell = 2 m):
  # wall 6m   % wall 3.4m   * tower 9.5m   @ wall 6m (alt material)   ~ water
  . ground   , path   ; alt ground   a/b bomb site floor   T attacker spawn   K defender spawn
  t tunnel (roof 3m)   u indoor (roof 5.6m)   1 2 3 raised floor 0.6/1.2/1.8m   r ramp (see ramps)
  c crate   C crate stack   o barrels   L low wall   k container   | - thin walls   d door (lintel)            */
export const MAPS=[
{id:'sandgate',name:'SANDGATE',sub:'DESERT TOWN · NOON',mood:'noon',W:48,H:38,
 paint(P){
  // defender spawn + routes to sites
  P.rect(19,2,28,6,'K');P.rect(15,3,18,5,',');P.rect(29,3,32,5,',');
  // A site (east) with raised back platform
  P.rect(33,2,44,13,'a');P.rect(38,2,44,4,'2');P.rect(38,5,44,6,'r');
  // A long: south corridor along the east wall, doors at row 21
  P.rect(40,14,44,29,';');P.hline(21,40,44,'#');P.pts('d',[41,21],[42,21]);P.rect(30,27,39,29,';');P.rect(30,30,32,32,',');
  // A short: from mid to A, slightly raised catwalk
  P.rect(26,10,32,12,'.');P.rect(28,10,31,11,'1');P.rect(27,10,27,11,'r');P.rect(32,10,32,11,'r');
  // mid: long north-south street
  P.rect(22,7,25,31,',');P.rect(21,14,21,18,',');P.rect(26,19,27,24,'.');
  P.pts('%',[24,25],[25,25],[22,29],[23,29],[20,29],[21,29]);
  // mid doors (defender side)
  P.hline(8,22,25,'%');P.pts('d',[23,8],[24,8]);
  // T spawn
  P.rect(19,32,28,35,'T');P.rect(29,31,32,33,',');
  // B tunnels: lower then upper (roofed), exits into B
  P.rect(14,29,18,31,'t');P.rect(6,28,17,30,'t');P.rect(5,15,8,30,'t');P.rect(9,24,12,26,'.');P.rect(5,13,8,14,'.');
  // B site (west)
  P.rect(3,2,14,12,'b');P.rect(3,2,6,4,'1');P.rect(7,2,7,4,'r');
  // mid to B connector ("market")
  P.rect(13,15,21,17,'.');P.rect(13,13,15,14,'.');P.set(16,16,'|');P.pts('d',[13,13],[14,13]);P.hline(13,15,15,'#');
  // courtyard south of market (T side approach to market)
  P.rect(15,18,19,23,';');P.rect(18,24,21,27,';');P.rect(20,28,21,31,',');
  // cover — A site
  P.pts('c',[35,4],[36,4],[35,9],[41,10],[42,10]);P.pts('C',[35,5],[41,9]);P.pts('L',[33,7],[34,7]);P.pts('o',[44,12]);
  P.pts('c',[38,8]);P.pts('L',[39,7]);
  // cover — B site
  P.pts('c',[10,5],[10,6],[4,9],[12,10],[8,11]);P.pts('C',[11,5],[5,10]);P.pts('L',[9,9],[10,9]);P.pts('o',[13,3]);
  // mid / routes
  P.pts('c',[24,13],[22,22],[25,27]);P.pts('C',[25,13]);P.pts('o',[22,17],[27,21]);P.pts('c',[43,17],[40,25],[41,25]);P.pts('C',[44,26]);
  P.pts('c',[31,28],[16,20]);P.pts('o',[19,21]);P.pts('c',[20,4],[27,4]);P.pts('c',[10,25],[6,20]);P.pts('o',[16,30]);
  // thin fences
  P.rect(34,15,39,16,';');P.set(36,16,'c');
  // tall landmarks
  P.rect(17,9,20,12,'*');P.rect(27,15,30,17,'*');P.rect(10,15,11,18,'@');P.rect(35,22,37,24,'@');
  // break spawn-to-spawn sightlines at the lower-mid exit
  P.pts('%',[20,29],[21,29]);
 },
 ramps:[[38,5,44,6,'N',0,1.2],[27,10,27,11,'E',0,.6],[32,10,32,11,'W',0,.6],[7,2,7,4,'W',0,.6]],
 spawns:{atk:[[20,33],[22,34],[24,33],[26,34],[27,33]],def:[[21,4],[23,3],[24,5],[26,3],[25,6]]},
 sites:{A:{c:[38,9],plant:[[37,8],[39,10],[36,11],[40,7]]},B:{c:[8,7],plant:[[8,6],[7,8],[11,8],[5,7]]}},
 callouts:[['A SITE',38,9],['A PLATFORM',41,3],['A LONG',42,17],['LONG DOORS',42,22],['OUTSIDE LONG',36,28],['A SHORT',29,11],['MID',23,15],['MID DOORS',23,9],['LOWER MID',23,26],
  ['DEF SPAWN',24,4],['ATK SPAWN',24,34],['B SITE',8,7],['B BALCONY',4,3],['B TUNNELS',6,21],['LOWER TUNNEL',11,29],['MARKET',17,16],['COURTYARD',17,21],['A RAMP',41,5],['B DOORS',14,14],['GARDEN',35,15]],
 // defender holds [col,row, lookCol,lookRow]
 holds:{A:[[41,3,42,15],[35,6,29,11],[39,11,41,18],[43,8,42,16]],B:[[5,3,6,14],[11,6,14,14],[4,11,7,15],[9,10,14,13]],mid:[[23,10,23,22],[25,7,23,24]]},
 // attacker staging before executes, utility targets
 stage:{A:[[42,23],[43,24],[41,27],[44,28],[38,28]],B:[[5,18],[7,19],[8,21],[5,22],[7,23]]},
 stage2:{A:[[25,20],[24,17]],B:[[18,20],[16,19]]},
 util:{A:[{k:'smoke',to:[38,7]},{k:'flash',to:[40,13]},{k:'smoke',to:[33,11]}],B:[{k:'smoke',to:[11,8]},{k:'flash',to:[7,12]},{k:'smoke',to:[13,10]}]},
 post:{A:[[42,15],[34,10],[43,3]],B:[[6,14],[13,13],[4,3]]},
 retake:{A:[[30,4],[29,11],[42,16]],B:[[16,4],[14,15],[6,15]]},
 mmBg:'#c9ab7c'},

{id:'drydock',name:'DRYDOCK',sub:'INDUSTRIAL PORT · DUSK · RAIN',mood:'dusk',W:50,H:40,
 paint(P){
  // the quay (water on the east edge)
  P.rect(46,1,48,38,'~');
  // defender spawn: north yard
  P.rect(18,2,30,6,'K');P.rect(14,3,17,5,',');P.rect(31,3,34,6,',');
  // A site: container yard by the water (east)
  P.rect(35,2,45,14,'a');
  // A quay ("long"): road along the water
  P.rect(42,15,45,31,';');P.rect(33,30,41,32,';');P.hline(22,42,45,'L');P.pts(';',[43,22],[44,22]);
  // B site: warehouse interior (west), roofed
  P.rect(3,3,15,13,'b');
  // warehouse garage doors (south + east)
  P.rect(4,14,6,15,'u');P.rect(16,8,17,10,'u');
  // B lower: drain tunnel from T side to warehouse
  P.rect(5,16,7,29,'t');P.rect(8,27,17,29,'t');P.rect(4,16,8,17,'.');
  // mid: open rail yard with a loading platform
  P.rect(21,8,28,32,',');P.rect(23,7,26,7,',');P.rect(23,14,26,19,'2');P.rect(23,20,26,21,'r');P.rect(23,12,26,13,'r');
  // offices: connector mid -> B (indoor)
  P.rect(14,9,20,12,'u');
  // T spawn south
  P.rect(18,33,31,37,'T');P.rect(32,31,33,34,',');P.rect(16,30,20,32,';');
  // west yard (outside B)
  P.rect(8,18,16,24,';');P.rect(17,22,20,26,';');
  // east approach to A from mid ("ladder alley")
  P.rect(29,15,34,17,'.');P.rect(33,10,34,14,'.');
  // containers
  P.rect(37,4,37,6,'k');P.rect(40,9,42,9,'k');P.rect(44,4,44,7,'k');P.rect(38,12,39,12,'k');P.rect(43,17,43,19,'k');P.rect(35,31,37,31,'k');
  P.rect(10,20,12,20,'k');P.rect(14,23,14,24,'k');P.rect(21,25,21,27,'k');P.rect(28,9,28,11,'k');P.rect(22,29,26,29,'k');P.pts('C',[27,31],[21,31],[28,29]);
  // crates / barrels
  P.pts('c',[36,10],[41,6],[42,6],[35,13],[44,13]);P.pts('C',[41,5]);P.pts('o',[39,3],[45,10]);
  P.pts('c',[6,6],[6,7],[11,10],[12,10],[9,4],[13,6]);P.pts('C',[10,7],[4,11]);P.pts('L',[8,9],[9,9]);
  P.pts('c',[25,9],[22,23],[27,27],[44,26],[42,29],[12,18],[19,31]);P.pts('C',[22,10],[27,24]);P.pts('o',[16,21],[30,16],[24,35]);
  // thin sheet walls
  P.vline(31,8,12,'|');P.rect(29,8,30,12,'.');P.rect(32,8,32,12,'.');P.vline(32,9,9,'c');
  // tall silos / office tower
  P.rect(36,20,39,26,'*');P.rect(9,31,13,35,'@');P.rect(31,19,33,24,'@');
  P.pts('%',[27,32],[28,32]);
 },
 ramps:[[23,20,26,21,'N',0,1.2],[23,12,26,13,'S',0,1.2]],
 roofed:{u:[3,3,20,15]},
 spawns:{atk:[[20,35],[23,34],[25,36],[27,34],[29,35]],def:[[20,4],[22,3],[24,5],[27,3],[29,5]]},
 sites:{A:{c:[40,8],plant:[[39,7],[41,11],[38,10],[43,8]]},B:{c:[9,8],plant:[[8,7],[10,11],[7,10],[12,8]]}},
 callouts:[['A SITE',40,8],['QUAY',44,22],['LOWER QUAY',38,31],['A YARD',36,15],['MID',24,22],['PLATFORM',24,16],['RAIL YARD',24,10],['DEF SPAWN',24,4],['ATK SPAWN',24,35],
  ['B WAREHOUSE',9,8],['OFFICES',16,10],['DRAIN',6,22],['DRAIN EXIT',12,28],['WEST YARD',12,21],['GARAGE',5,14],['SHEETS',31,10],['CRANE',43,4]],
 holds:{A:[[43,3,44,18],[36,8,31,16],[41,13,44,24],[38,3,34,14]],B:[[4,4,5,16],[13,12,17,9],[10,4,5,14],[14,6,17,10]],mid:[[24,9,24,24],[27,6,26,22]]},
 stage:{A:[[43,28],[42,30],[44,30],[38,31],[40,30]],B:[[13,28],[11,28],[6,26],[15,28],[9,28]]},
 stage2:{A:[[29,16],[27,17]],B:[[17,24],[15,22]]},
 util:{A:[{k:'smoke',to:[40,8]},{k:'flash',to:[43,14]},{k:'smoke',to:[36,13]}],B:[{k:'smoke',to:[8,9]},{k:'flash',to:[5,13]},{k:'smoke',to:[15,10]}]},
 post:{A:[[44,16],[33,14],[38,3]],B:[[5,16],[17,10],[4,4]]},
 retake:{A:[[34,4],[33,12],[44,17]],B:[[13,4],[18,10],[5,17]]},
 mmBg:'#3b4350'}];

/* ===================================================================== LEVEL */
export class Level{
 constructor(def){this.def=def;const P=painter(def.W,def.H);def.paint(P);if(def.post2)def.post2(P);this.g=P.g;const W=this.W=def.W,H=this.H=def.H;
  this.hw=W*CS/2;this.hh=H*CS/2;this.boxes=[];this.props=[];this.doors=[];
  // cell heights + ramp lookup
  this.ch=new Float32Array(W*H);this.rampOf=new Int16Array(W*H).fill(-1);
  for(let r=0;r<H;r++)for(let c=0;c<W;c++){const k=this.g[r][c];if(k>='1'&&k<='3')this.ch[r*W+c]=(+k)*.6;}
  def.ramps.forEach((R,i)=>{for(let r=R[1];r<=R[3];r++)for(let c=R[0];c<=R[2];c++)this.rampOf[r*W+c]=i;});
  this.buildBoxes();this.finalize();this.buildNav();}
 cx(c){return(c-this.W/2+.5)*CS;}cz(r){return(r-this.H/2+.5)*CS;}
 cellOf(x,z){const c=Math.floor(x/CS+this.W/2),r=Math.floor(z/CS+this.H/2);return(c<0||r<0||c>=this.W||r>=this.H)?-1:r*this.W+c;}
 chAt(x,z){const k=this.cellOf(x,z);return k<0?'#':this.g[k/this.W|0][k%this.W];}
 P(cr){return{x:this.cx(cr[0]),z:this.cz(cr[1])};}
 // continuous floor height (ramps interpolate)
 floorH(x,z){const k=this.cellOf(x,z);if(k<0)return 0;const ri=this.rampOf[k];if(ri<0)return this.ch[k];const R=this.def.ramps[ri];
  const x0=(R[0]-this.W/2)*CS,x1=(R[2]+1-this.W/2)*CS,z0=(R[1]-this.H/2)*CS,z1=(R[3]+1-this.H/2)*CS;let t;
  if(R[4]==='N')t=(z1-z)/(z1-z0);else if(R[4]==='S')t=(z-z0)/(z1-z0);else if(R[4]==='E')t=(x-x0)/(x1-x0);else t=(x1-x)/(x1-x0);t=Math.max(0,Math.min(1,t));return R[5]+(R[6]-R[5])*t;}
 roofAt(x,z){const k=this.chAt(x,z);return k==='t'?3:k==='u'?5.6:Infinity;}
 addBox(x0,y0,z0,x1,y1,z1,mat,o={}){const b={x0:Math.min(x0,x1),y0,z0:Math.min(z0,z1),x1:Math.max(x0,x1),y1,z1:Math.max(z0,z1),mat,coll:o.coll!==false,ray:o.ray!==false,vis:o.vis!==false,kind:o.kind||mat,col:o.col,ch:o.ch};this.boxes.push(b);return b;}
 // greedy rectangles of cells matching fn
 rects(fn){const W=this.W,H=this.H,seen=new Uint8Array(W*H),out=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++){if(seen[r*W+c]||!fn(this.g[r][c],c,r))continue;const ch=this.g[r][c];let w=1;while(c+w<W&&!seen[r*W+c+w]&&this.g[r][c+w]===ch&&fn(ch,c+w,r))w++;
   let h=1;outer:while(r+h<H){for(let i=0;i<w;i++){if(seen[(r+h)*W+c+i]||this.g[r+h][c+i]!==ch)break outer;}h++;}for(let j=0;j<h;j++)for(let i=0;i<w;i++)seen[(r+j)*W+c+i]=1;out.push({c,r,w,h,ch});}return out;}
 buildBoxes(){const W=this.W,H=this.H,g=this.g;const X=c=>(c-W/2)*CS,Z=r=>(r-H/2)*CS;
  for(const q of this.rects(ch=>ch in WALLS))this.addBox(X(q.c),0,Z(q.r),X(q.c+q.w),WALLS[q.ch],Z(q.r+q.h),'wall',{kind:q.ch==='@'?'wall2':q.ch==='*'?'tower':q.ch==='%'?'wallLow':'wall',ch:q.ch});
  for(const q of this.rects(ch=>ch==='~'))this.addBox(X(q.c),-3,Z(q.r),X(q.c+q.w),2.2,Z(q.r+q.h),'water',{ray:false,vis:false});
  for(const q of this.rects(ch=>ch==='L'))this.addBox(X(q.c),0,Z(q.r),X(q.c+q.w),1.02,Z(q.r+q.h),'low',{kind:'lowwall'});
  for(const q of this.rects(ch=>ch==='k')){const b=this.addBox(X(q.c)+.06,0,Z(q.r)+.06,X(q.c+q.w)-.06,2.6,Z(q.r+q.h)-.06,'metal',{kind:'container'});b.col=(q.c*7+q.r*3)%5;}
  for(const q of this.rects(ch=>ch>='1'&&ch<='3'))this.addBox(X(q.c),0,Z(q.r),X(q.c+q.w),(+q.ch)*.6,Z(q.r+q.h),'wall',{kind:'raised'});
  for(const q of this.rects(ch=>ch==='t'))this.addBox(X(q.c),3,Z(q.r),X(q.c+q.w),3.6,Z(q.r+q.h),'roof',{kind:'roof'});
  for(const q of this.rects(ch=>ch==='u'))this.addBox(X(q.c),5.6,Z(q.r),X(q.c+q.w),6.1,Z(q.r+q.h),'roof',{kind:'roofHi'});
  // roofed site cells (warehouse) — handled via def.roofed rectangle
  if(this.def.roofed){const[c0,r0,c1,r1]=this.def.roofed.u;for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const ch=g[r][c];if('bcCLo'.includes(ch))this.roofCell(c,r);}
   for(const q of this.rects((ch,c,r)=>this._rc&&this._rc.has(r*W+c)))this.addBox(X(q.c),5.6,Z(q.r),X(q.c+q.w),6.1,Z(q.r+q.h),'roof',{kind:'roofHi'});}
  // ramps: ray-only step slices
  for(const R of this.def.ramps){const n=6,ns=R[4]==='N'||R[4]==='S';for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,hgt=R[5]+(R[6]-R[5])*(i+.5)/n;let x0=X(R[0]),x1=X(R[2]+1),z0=Z(R[1]),z1=Z(R[3]+1);
    if(R[4]==='N'){const L=z1-z0;[z0,z1]=[z1-L*b,z1-L*a];}else if(R[4]==='S'){const L=z1-z0;[z0,z1]=[z0+L*a,z0+L*b];}else if(R[4]==='E'){const L=x1-x0;[x0,x1]=[x0+L*a,x0+L*b];}else{const L=x1-x0;[x0,x1]=[x1-L*b,x1-L*a];}
    this.addBox(x0,0,z0,x1,hgt,z1,'wall',{coll:false,vis:false,kind:'rampstep'});}}
  // per-cell props
  for(let r=0;r<H;r++)for(let c=0;c<W;c++){const ch=g[r][c],x=this.cx(c),z=this.cz(r),y=this.ch[r*W+c];const jit=((c*31+r*17)%7-3)*.05;
   if(ch==='c'){const s=1.45;this.addBox(x-s/2+jit,0,z-s/2,x+s/2+jit,s*.82,z+s/2,'crate',{vis:false,kind:'crate'});this.props.push({k:'crate',x:x+jit,z,y:0,s,rot:jit*2});}
   else if(ch==='C'){const s=1.6;this.addBox(x-s/2,0,z-s/2,x+s/2,2.5,z+s/2,'crate',{vis:false,kind:'crate'});this.props.push({k:'crate',x,z,y:0,s,rot:0},{k:'crate',x:x+jit,z:z+jit,y:s*.82,s:1.15,rot:.3+jit});}
   else if(ch==='o'){this.addBox(x-.75,0,z-.75,x+.75,1.0,z+.75,'barrel',{vis:false,kind:'barrel'});for(const[dx,dz]of[[-.38,-.36],[.38,-.32],[0,.38]])this.props.push({k:'barrel',x:x+dx,z:z+dz,y:0,rot:jit});}
   else if(ch==='|'||ch==='-'){const v=ch==='|';this.addBox(v?x-.12:x-1,0,v?z-1:z-.12,v?x+.12:x+1,3,v?z+1:z+.12,'thin',{kind:'thin'});}
   else if(ch==='d'){const ewall=c>0&&c<W-1&&(g[r][c-1]in WALLS||g[r][c-1]==='d')&&(g[r][c+1]in WALLS||g[r][c+1]==='d');let wh=6;for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=g[r+dr]?.[c+dc];if(n in WALLS)wh=Math.min(wh,WALLS[n]);}
    this.addBox(x-1,2.5,z-1,x+1,wh,z+1,'wall',{kind:'lintel'});this.doors.push({x,z,ew:ewall,c,r});}}}
 roofCell(c,r){(this._rc||(this._rc=new Set())).add(r*this.W+c);}
 isRoofed(x,z){const k=this.cellOf(x,z);if(k<0)return false;const ch=this.g[k/this.W|0][k%this.W];return ch==='t'||ch==='u'||!!(this._rc&&this._rc.has(k));}

 finalize(){const S=this.boxes;const n=S.length,B=this.B=new Float32Array(n*6);S.forEach((b,i)=>B.set([b.x0,b.y0,b.z0,b.x1,b.y1,b.z1],i*6));
  this.pen=new Float32Array(n);this.rayOK=new Uint8Array(n);this.collOK=new Uint8Array(n);S.forEach((b,i)=>{this.pen[i]=MATS[b.mat].pen;this.rayOK[i]=b.ray?1:0;this.collOK[i]=b.coll?1:0;});
  const GS=this.GS=4,GX=this.GX=Math.ceil(this.hw*2/GS),GZ=this.GZ=Math.ceil(this.hh*2/GS);this.grid=Array.from({length:GX*GZ},()=>[]);
  S.forEach((b,i)=>{const i0=Math.max(0,Math.floor((b.x0+this.hw)/GS)),i1=Math.min(GX-1,Math.floor((b.x1+this.hw)/GS)),j0=Math.max(0,Math.floor((b.z0+this.hh)/GS)),j1=Math.min(GZ-1,Math.floor((b.z1+this.hh)/GS));for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++)this.grid[j*GX+k].push(i);});
  this.qs=new Uint32Array(n);this.qg=0;this.ql=[];}
 near(x,z,r){const GS=this.GS,GX=this.GX,GZ=this.GZ,out=this.ql;out.length=0;const g=++this.qg;const i0=Math.max(0,Math.floor((x-r+this.hw)/GS)),i1=Math.min(GX-1,Math.floor((x+r+this.hw)/GS)),j0=Math.max(0,Math.floor((z-r+this.hh)/GS)),j1=Math.min(GZ-1,Math.floor((z+r+this.hh)/GS));
  for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++){const c=this.grid[j*GX+k];for(let m=0;m<c.length;m++){const i=c[m];if(this.qs[i]!==g){this.qs[i]=g;out.push(i);}}}return out;}

 /* ---------- rays: first box hit with entry/exit (for penetration) ---------- */
 ray(ox,oy,oz,dx,dy,dz,maxT,out,skip=-1){if(Math.abs(dx)<1e-7)dx=1e-7;if(Math.abs(dy)<1e-7)dy=1e-7;if(Math.abs(dz)<1e-7)dz=1e-7;const B=this.B,n=B.length/6;let best=maxT,ax=-1,sg=0,bi=-1,bx=0;const ix=1/dx,iy=1/dy,iz=1/dz;
  if(dy<0){const t=-oy/dy;if(t<best&&t>0){best=t;ax=1;sg=1;bi=-2;bx=t+1e9;}}
  for(let i=0;i<n;i++){if(!this.rayOK[i]||i===skip)continue;const k=i*6;let t1=(B[k]-ox)*ix,t2=(B[k+3]-ox)*ix,tmin,tmax,a=0,s;if(t1<t2){tmin=t1;tmax=t2;s=-1;}else{tmin=t2;tmax=t1;s=1;}
   t1=(B[k+1]-oy)*iy;t2=(B[k+4]-oy)*iy;if(t1>t2){const q=t1;t1=t2;t2=q;if(t1>tmin){tmin=t1;a=1;s=1;}}else if(t1>tmin){tmin=t1;a=1;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax)continue;
   t1=(B[k+2]-oz)*iz;t2=(B[k+5]-oz)*iz;if(t1>t2){const q=t1;t1=t2;t2=q;if(t1>tmin){tmin=t1;a=2;s=1;}}else if(t1>tmin){tmin=t1;a=2;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax||tmax<0)continue;
   if(tmin<0)continue;if(tmin<best){best=tmin;ax=a;sg=s;bi=i;bx=tmax;}}
  if(out){out.t=best;out.i=bi;out.exit=bx;out.nx=ax===0?sg:0;out.ny=ax===1?sg:0;out.nz=ax===2?sg:0;}return best<maxT?best:Infinity;}
 los(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,l=Math.hypot(dx,dy,dz);if(l<1e-4)return true;return this.ray(ax,ay,az,dx/l,dy/l,dz/l,l-.05)===Infinity;}

 /* ---------- character collision ---------- */
 ground(x,z,feet,r=.3){let g=this.floorH(x,z);const B=this.B,L=this.near(x,z,r+.1);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i])continue;if(B[k+4]>feet+STEP||B[k+4]<=g)continue;if(x+r<B[k]||x-r>B[k+3]||z+r<B[k+2]||z-r>B[k+5])continue;g=B[k+4];}return g;}
 ceil(x,z,feet){let c=Infinity;const B=this.B,L=this.near(x,z,.4);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i]||B[k+1]<feet+.4)continue;if(x<B[k]||x>B[k+3]||z<B[k+2]||z>B[k+5])continue;c=Math.min(c,B[k+1]);}return c;}
 collide(p,r,h){const B=this.B,L=this.near(p.x,p.z,r+.6).slice();let hit=false;for(let pass=0;pass<2;pass++)for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i])continue;if(B[k+4]<=p.y+STEP||B[k+1]>=p.y+h)continue;
   const cx=Math.max(B[k],Math.min(p.x,B[k+3])),cz=Math.max(B[k+2],Math.min(p.z,B[k+5]));let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;if(d2>=r*r)continue;hit=true;
   if(d2>1e-8){const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d);}else{const l=p.x-B[k],rr=B[k+3]-p.x,u=p.z-B[k+2],dd=B[k+5]-p.z,m=Math.min(l,rr,u,dd);if(m===l)p.x=B[k]-r;else if(m===rr)p.x=B[k+3]+r;else if(m===u)p.z=B[k+2]-r;else p.z=B[k+5]+r;}}
  return hit;}
 // ray-free point test (grenades)
 inside(x,y,z){const B=this.B,L=this.near(x,z,.05);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.rayOK[i])continue;if(x>B[k]&&x<B[k+3]&&y>B[k+1]&&y<B[k+4]&&z>B[k+2]&&z<B[k+5])return i;}return -1;}
 site(x,z){const ch=this.chAt(x,z);return ch==='a'?'A':ch==='b'?'B':null;}
 nearSite(x,z){for(const s of['A','B']){const S=this.def.sites[s];const p=this.P(S.c);if(Math.hypot(p.x-x,p.z-z)<16&&this.siteCellNear(x,z,s))return s;}return null;}
 siteCellNear(x,z,s){const want=s==='A'?'a':'b';for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(this.chAt(x+dx*.9,z+dz*.9)===want)return true;return false;}
 callout(x,z){let best='',bd=1e9;for(const[n,c,r]of this.def.callouts){const d=Math.hypot(this.cx(c)-x,this.cz(r)-z);if(d<bd&&this.losFloor(x,z,this.cx(c),this.cz(r),d)){bd=d;best=n;}}if(!best){for(const[n,c,r]of this.def.callouts){const d=Math.hypot(this.cx(c)-x,this.cz(r)-z);if(d<bd){bd=d;best=n;}}}return best;}
 losFloor(ax,az,bx,bz,d){if(d>26)return false;return this.los(ax,1.5+this.floorH(ax,az),az,bx,1.5+this.floorH(bx,bz),bz);}

 /* ---------- nav grid (1 m) + A* ---------- */
 buildNav(){const NX=this.NX=this.W*2,NZ=this.NZ=this.H*2;const N=NX*NZ;this.blk=new Uint8Array(N);this.nh=new Float32Array(N);this.cost=new Float32Array(N);
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=(i-NX/2+.5),z=(j-NZ/2+.5);const ch=this.chAt(x,z);const k=j*NX+i;this.nh[k]=this.floorH(x,z);if(SOLIDCH.includes(ch))this.blk[k]=1;}
  // keep a margin off tall walls so bots don't scrape corners
  this.g2=new Float32Array(N);this.par=new Int32Array(N);this.st=new Uint32Array(N);this.cs=new Uint32Array(N);this.gen=1;this.heap=new Int32Array(N*4);this.hf=new Float32Array(N*4);
  this.wallAdj=new Uint8Array(N);for(let j=1;j<NZ-1;j++)for(let i=1;i<NX-1;i++){const k=j*NX+i;if(this.blk[k])continue;let a=0;for(const d of[1,-1,NX,-NX,NX+1,NX-1,-NX+1,-NX-1])if(this.blk[k+d])a++;this.wallAdj[k]=a;}}
 nidx(x,z){const i=Math.floor(x+this.NX/2),j=Math.floor(z+this.NZ/2);return(i<0||j<0||i>=this.NX||j>=this.NZ)?-1:j*this.NX+i;}
 npos(k){return{x:k%this.NX-this.NX/2+.5,z:(k/this.NX|0)-this.NZ/2+.5};}
 nfree(x,z){const k=this.nidx(x,z);return k>=0&&!this.blk[k];}
 nearestFree(x,z){const NX=this.NX,NZ=this.NZ;let i=Math.floor(x+NX/2),j=Math.floor(z+NZ/2);for(let r=0;r<14;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const a=i+di,b=j+dj;if(a>0&&b>0&&a<NX-1&&b<NZ-1&&!this.blk[b*NX+a])return b*NX+a;}return -1;}
 step(a,b){return!this.blk[b]&&this.nh[b]-this.nh[a]<=.62;}
 walkable(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),n=Math.ceil(l/.35);let prev=this.nidx(ax,az);if(prev<0)return false;for(let k=1;k<=n;k++){const t=k/n,x=ax+dx*t,z=az+dz*t;
   for(const[ox,oz]of[[.3,.3],[-.3,.3],[.3,-.3],[-.3,-.3]]){const q=this.nidx(x+ox,z+oz);if(q<0||this.blk[q])return false;}const c=this.nidx(x,z);if(c!==prev){if(!this.step(prev,c)||this.cost[c]>5)return false;prev=c;}}return true;}
 path(sx,sz,tx,tz,maxIter=9000){const NX=this.NX,NZ=this.NZ;let s=this.nidx(sx,sz),t=this.nidx(tx,tz);if(s<0||this.blk[s])s=this.nearestFree(sx,sz);if(t<0||this.blk[t])t=this.nearestFree(tx,tz);if(s<0||t<0)return null;
  const gen=++this.gen,g=this.g2,par=this.par,st=this.st,cs=this.cs,Hh=this.heap,F=this.hf;let hn=0;const ti=t%NX,tj=t/NX|0;
  const h=c=>{const dx=Math.abs(c%NX-ti),dz=Math.abs((c/NX|0)-tj);return Math.max(dx,dz)+.414*Math.min(dx,dz);};
  const push=(c,f)=>{if(hn>=Hh.length)return;let k=hn++;while(k>0){const p=(k-1)>>1;if(F[p]<=f)break;Hh[k]=Hh[p];F[k]=F[p];k=p;}Hh[k]=c;F[k]=f;};
  const pop=()=>{const top=Hh[0],lc=Hh[--hn],lf=F[hn];let k=0;for(;;){let c=2*k+1;if(c>=hn)break;if(c+1<hn&&F[c+1]<F[c])c++;if(F[c]>=lf)break;Hh[k]=Hh[c];F[k]=F[c];k=c;}Hh[k]=lc;F[k]=lf;return top;};
  g[s]=0;st[s]=gen;par[s]=-1;push(s,h(s));let it=0,found=false;
  while(hn>0&&it++<maxIter){const c=pop();if(c===t){found=true;break;}if(cs[c]===gen)continue;cs[c]=gen;const ci=c%NX,cj=c/NX|0;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=NX||nj>=NZ)continue;const k=nj*NX+ni;if(cs[k]===gen||!this.step(c,k))continue;
    if(di&&dj&&(this.blk[cj*NX+ni]||this.blk[nj*NX+ci]))continue;const ng=g[c]+(di&&dj?1.414:1)+this.wallAdj[k]*.12+this.cost[k];if(st[k]!==gen||ng<g[k]){st[k]=gen;g[k]=ng;par[k]=c;push(k,ng+h(k));}}}
  if(!found)return null;const cells=[];for(let c=t;c>=0;c=par[c])cells.push(c);cells.reverse();
  // string-pull
  const pts=cells.map(c=>this.npos(c));const out=[pts[0]];let i=0;while(i<pts.length-1){let j=pts.length-1;for(;j>i+1;j--)if(this.walkable(pts[i].x,pts[i].z,pts[j].x,pts[j].z))break;out.push(pts[j]);i=j;}
  out[out.length-1]={x:tx,z:tz};if(!this.nfree(tx,tz)){const p=this.npos(t);out[out.length-1]=p;}return out;}
 // ASCII dump for debugging
 ascii(){return this.g.map(r=>r.join('')).join('\n');}
}
