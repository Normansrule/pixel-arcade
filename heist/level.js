// HALCYON HEIST — level data: grid-painted heist sites (1 m cells), collision boxes with dynamic doors + breakable glass,
// hitscan rays, grid-accelerated line of sight, ceilings, rooms, nav grid (0.5 m) + A*. No three.js dependency.
export const CS=1,STEP=.42;
// box materials: pen = penetration cost per metre (Infinity = stops), snd = impact sound family
export const MATS={wall:{pen:1e9,snd:'stone'},ext:{pen:1e9,snd:'stone'},glass:{pen:0,snd:'glass'},wood:{pen:.6,snd:'wood'},metal:{pen:.5,snd:'metal'},steel:{pen:1e9,snd:'metal'},
 counter:{pen:3,snd:'stone'},door:{pen:.7,snd:'wood'},prop:{pen:.8,snd:'wood'},stone:{pen:6,snd:'stone'},ceil:{pen:1e9,snd:'stone'},car:{pen:1.2,snd:'metal'},floor:{pen:1e9,snd:'stone'}};
const FLOORS='mktcvsrax';const OUTSIDE='sra';const INTERIOR='mktcvx';
const THIN='wgDLKn';const WALLISH='#wgGnDLKEV!';const DOORS='DLKE';
// cells that block movement (nav); doors are walkable (opened on approach), V until the vault opens
export const SOLID='!#wgGnNoPAXhzZqyjSMTbdpuVl';
// prop footprint + height (cell fraction, metres) and material
const PROP={o:{s:.86,h:0,mat:'stone'},p:{s:.8,h:.95,mat:'prop'},b:{s:.9,h:.48,mat:'wood',thin:.55},d:{s:.98,h:.78,mat:'wood'},P:{s:.9,h:1.25,mat:'prop'},A:{s:.86,h:.95,mat:'metal'},X:{s:1,h:2.6,mat:'steel'},
 h:{s:.9,h:2.2,mat:'metal',thin:.5},q:{s:.95,h:1.35,mat:'metal'},y:{s:.8,h:1.8,mat:'metal',thin:.6},j:{s:.86,h:.92,mat:'wood'},S:{s:.96,h:1.7,mat:'steel'},M:{s:.98,h:.78,mat:'wood'},T:{s:.9,h:.76,mat:'wood'},
 u:{s:.95,h:.8,mat:'prop',thin:.8},N:{s:1,h:1.05,mat:'counter'},z:{s:1,h:1.45,mat:'car'},Z:{s:1,h:2.4,mat:'car'},l:{s:.5,h:2.6,mat:'metal'}};

function painter(W,H){const g=Array.from({length:H},()=>Array(W).fill('!'));const ok=(c,r)=>c>=0&&r>=0&&c<W&&r<H;
 return{g,W,H,
  rect(c0,r0,c1,r1,ch){for(let r=Math.min(r0,r1);r<=Math.max(r0,r1);r++)for(let c=Math.min(c0,c1);c<=Math.max(c0,c1);c++)if(ok(c,r))g[r][c]=ch;},
  set(c,r,ch){if(ok(c,r))g[r][c]=ch;},pts(ch,...l){for(const[c,r]of l)if(ok(c,r))g[r][c]=ch;},
  conv(c0,r0,c1,r1,from,to){for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)if(ok(c,r)&&g[r][c]===from)g[r][c]=to;},
  frame(c0,r0,c1,r1,ch){this.rect(c0,r0,c1,r0,ch);this.rect(c0,r1,c1,r1,ch);this.rect(c0,r0,c0,r1,ch);this.rect(c1,r0,c1,r1,ch);}};}

/* ===================================================================== SITES
 Legend (1 cell = 1 m):  ! invisible border   # outer wall / facade   w interior wall   g glass partition   G window in a facade
  n teller counter + glass   N counter   D door   L locked door (lockpick)   K keycard door   E entrance (glass)   V vault door
  floors: m marble  k carpet  t tile  c concrete  v vault steel  x parquet  s sidewalk  r road  a alley
  props: o column  p planter  b bench  d desk  P cash pallet  A gold pallet  X deposit boxes  h shelf  q dumpster  y ATM
         j display case  S safe  M monitor desk  T table  u sofa  z parked car  Z escape van  l lamp post */
export const MAPS=[
{id:'bank',name:'HALCYON SAVINGS & TRUST',short:'HALCYON SAVINGS',sub:'BANK · PORT HALCYON · DUSK',mood:'dusk',W:60,H:50,
 paint(P){
  P.rect(1,38,58,41,'s');P.rect(1,42,58,47,'r');P.rect(1,48,58,48,'s');
  P.rect(48,2,56,37,'a');P.rect(57,1,58,37,'#');P.rect(1,1,47,37,'#');
  // rooms
  P.rect(17,2,31,8,'v');P.rect(2,2,15,13,'c');P.rect(33,2,46,8,'k');P.rect(17,10,31,13,'c');P.rect(33,10,46,13,'t');P.rect(2,15,46,16,'t');
  P.rect(2,18,13,24,'k');P.rect(2,26,13,30,'k');P.rect(2,32,13,36,'k');P.rect(15,18,39,22,'k');P.rect(41,18,46,26,'t');P.rect(41,28,46,36,'k');P.rect(15,24,39,36,'m');
  P.conv(2,2,46,36,'#','w');
  // vault walls stay thick
  P.rect(16,1,16,9,'#');P.rect(32,1,32,9,'#');P.rect(16,9,32,9,'#');
  // teller counter
  P.rect(15,23,39,23,'n');
  // doors
  P.rect(23,9,25,9,'V');P.rect(24,14,25,14,'K');P.set(9,14,'L');P.set(39,14,'D');P.set(44,9,'D');P.rect(47,15,47,16,'L');
  P.set(30,17,'D');P.set(8,17,'D');P.set(43,17,'D');P.set(14,24,'L');P.set(14,28,'D');P.set(14,34,'D');P.set(40,32,'D');
  P.rect(14,19,14,22,'g');P.rect(14,26,14,27,'g');P.rect(14,29,14,30,'g');P.rect(14,32,14,33,'g');P.rect(14,35,14,36,'g');
  // facade
  for(const c of[3,4,7,8,11,12,17,18,21,22,32,33,36,37,42,43,44,45])P.set(c,37,'G');P.rect(26,37,28,37,'E');P.rect(47,29,47,31,'G');P.rect(47,33,47,35,'G');
  // lobby
  for(const c of[18,23,31,36])for(const r of[27,33])P.set(c,r,'o');P.rect(20,30,21,30,'b');P.rect(33,30,34,30,'b');P.rect(26,29,28,29,'N');P.pts('p',[15,36],[39,36],[15,26],[39,26]);
  // teller desks, manager + offices
  for(const c of[17,21,25,29,33,37])P.set(c,20,'d');P.rect(5,20,7,21,'d');P.pts('p',[12,18],[2,24]);P.rect(2,18,4,18,'h');P.rect(5,28,6,28,'d');P.rect(5,34,6,34,'d');P.pts('h',[2,26],[2,32]);
  // archive stacks
  for(const c of[4,7,10,13])P.rect(c,3,c,11,'h');
  // vault: deposit walls, cash + gold
  P.rect(17,2,17,8,'X');P.rect(31,2,31,8,'X');P.rect(18,2,30,2,'X');P.pts('P',[20,5],[22,5],[26,5],[28,5],[20,7],[28,7]);P.pts('A',[22,7],[26,7]);
  // security, break room, lounge, ATM room
  P.rect(36,10,40,10,'M');P.rect(37,4,38,5,'T');P.rect(42,2,45,2,'u');P.rect(33,2,33,4,'h');P.rect(46,18,46,23,'h');P.pts('y',[42,28],[44,28]);P.set(46,25,'T');
  // alley + street dressing
  P.rect(50,6,52,11,'Z');P.rect(55,19,55,21,'q');P.rect(55,28,55,29,'q');P.rect(4,42,8,43,'z');P.rect(37,42,41,43,'z');P.rect(15,46,19,47,'z');
  P.pts('l',[10,39],[24,39],[33,39],[46,39],[10,48],[30,48],[50,48]);P.pts('p',[17,40],[38,40]);
 },
 ceil:[[15,24,39,36,6.4],[17,2,31,8,4.2],[17,10,31,13,3.8]],ceilH:3.4,
 public:[[15,24,39,36],[41,28,46,36]],
 rooms:[['LOBBY',15,24,39,36],['VAULT',17,2,31,8],['VAULT ANTECHAMBER',17,10,31,13],['ARCHIVE',2,2,15,13],['BREAK ROOM',33,2,46,8],['SECURITY',33,10,46,13],['STAFF CORRIDOR',2,15,46,16],
  ['MANAGER',2,18,13,24],['LOAN OFFICE',2,26,13,30],['ADVISOR',2,32,13,36],['TELLERS',15,18,39,22],['STAFF LOUNGE',41,18,46,26],['ATM ROOM',41,28,46,36],['ALLEY',48,2,56,37],['FRONT STREET',1,38,58,48]],
 van:{zone:[48,12,55,15],door:[51,12]},start:[27,40,0],crew:[[49,13],[54,13],[51,14]],
 police:[[2,44],[57,44],[52,2],[2,39],[57,39]],
 cams:[[15.6,5.6,24.6,-35,40],[38.4,5.6,24.6,35,40],[15.6,3.1,18.6,-140,30],[46.4,3.1,15.4,-90,35],[17.6,3.5,10.6,-35,25],[56.4,4,16,90,35],[23.5,7,37.5,180,45]],
 guards:[{route:[[17,35],[17,25],[37,25],[37,35]],wait:2.5},{route:[[3,15],[45,15],[30,18],[17,21],[37,21],[30,18]],wait:2},{route:[[52,36],[52,17],[50,16],[52,27],[52,36],[44,40],[52,36]],wait:3}],
 operator:[38,11,0],manager:[6,22],
 civs:{lobby:[[19,31],[22,28],[27,34],[33,27],[36,32],[30,35],[25,32],[17,29],[38,30],[44,33],[42,31],[29,26],[21,26]],tellers:[[17,22],[21,22],[25,22],[29,22],[33,22],[37,22]],office:[[6,29],[6,35],[4,22]],count:[7,3,2]},
 keycards:[[6,21,.8],[37,11,.8],[44,4,.8],[3,26,1.2]],
 cash:[[17,20,.8],[21,20,.8],[25,20,.8],[29,20,.8],[33,20,.8],[7,20,.8],[6,28,.8],[6,34,.8],[37.5,4.5,.78],[46,25,.78]],
 drill:{site:'V',t:[70,95,120],label:'VAULT'},minBags:2,limit:[16*60,14*60,12*60],
 brief:'Case the lobby unmasked. Find the manager\'s keycard, slip past the cameras, drill the vault and carry the cash to the van in the east alley.',
 lamps:[[10,39],[24,39],[33,39],[46,39],[10,48],[30,48],[50,48]]},

{id:'jewel',name:'LUMEN & CO. JEWELLERS',short:'LUMEN & CO.',sub:'JEWELLERY STORE · OLD MARKET · NIGHT RAIN',mood:'night',W:46,H:40,
 paint(P){
  P.rect(1,29,44,31,'s');P.rect(1,32,44,37,'r');P.rect(1,38,44,38,'s');
  P.rect(35,2,42,28,'a');P.rect(43,1,44,28,'#');P.rect(3,5,34,28,'#');P.rect(3,1,34,4,'#');
  // back rooms + corridor + showroom
  P.rect(4,6,13,11,'k');P.rect(15,6,23,11,'c');P.rect(25,6,33,11,'c');P.rect(4,13,33,14,'t');P.rect(4,16,33,27,'x');
  P.conv(4,5,33,27,'#','w');
  P.set(8,12,'D');P.set(19,12,'L');P.rect(28,12,29,12,'K');P.rect(34,13,34,14,'L');P.rect(30,15,31,15,'D');P.set(6,15,'L');
  P.rect(14,7,14,10,'g');
  // facade with display windows
  for(const c of[5,6,7,9,10,11,13,14,15,21,22,23,25,26,27,29,30,31])P.set(c,28,'G');P.rect(17,28,19,28,'E');
  // showroom: island cases, wall cases, sales counter, columns
  for(const c of[9,11,13])for(const r of[20,24])P.set(c,r,'j');for(const c of[23,25,27])for(const r of[20,24])P.set(c,r,'j');
  for(const r of[17,19,21,23,25])P.set(4,r,'j');for(const r of[17,19,21,23,25])P.set(33,r,'j');P.rect(14,17,22,17,'N');P.pts('o',[18,21],[18,25]);P.pts('p',[5,27],[32,27]);P.rect(8,27,9,27,'b');P.rect(27,27,28,27,'b');
  // back rooms: office, stock room, strong room
  P.rect(6,7,8,8,'d');P.rect(10,6,12,6,'M');P.rect(16,6,16,10,'h');P.rect(19,6,19,9,'h');P.rect(22,6,22,10,'h');P.rect(30,7,31,8,'S');P.rect(25,6,25,10,'X');P.rect(26,6,28,6,'X');
  // alley + street
  P.rect(37,4,39,9,'Z');P.rect(41,15,41,17,'q');P.rect(5,33,9,34,'z');P.rect(28,33,32,34,'z');P.pts('l',[8,30],[20,30],[32,30],[14,38],[36,38]);
 },
 ceil:[[4,16,33,27,4.6]],ceilH:3.3,
 public:[[4,16,33,27]],
 rooms:[['SHOWROOM',4,16,33,27],['OFFICE',4,6,13,11],['STOCK ROOM',15,6,23,11],['STRONG ROOM',25,6,33,11],['BACK CORRIDOR',4,13,33,14],['ALLEY',35,2,42,28],['MARKET STREET',1,29,44,38]],
 van:{zone:[35,10,42,13],door:[38,10]},start:[18,31,0],crew:[[36,11],[41,11],[38,12]],
 police:[[2,34],[43,34],[39,2],[2,30]],
 cams:[[4.6,4.2,16.6,-40,35],[33.4,4.2,16.6,40,35],[4.6,3,13.4,-90,30],[25.6,3,6.6,-35,20],[41.6,3.6,13.5,90,30],[18.5,6,29.4,180,40]],
 guards:[{route:[[6,26],[6,18],[31,18],[31,26]],wait:2.5},{route:[[5,13],[32,13],[30,14],[31,18],[30,14]],wait:2},{route:[[39,27],[39,14],[36,13],[39,22],[39,27],[30,30],[39,27]],wait:3}],
 operator:[11,7,0],manager:[7,9],
 civs:{lobby:[[8,22],[12,22],[16,22],[22,22],[26,22],[29,25],[10,26],[20,26],[15,19],[24,19]],tellers:[[15,16],[18,16],[21,16]],office:[[5,9],[20,8]],count:[6,2,1]},
 keycards:[[7,8,.8],[11,6.4,.8],[17,8,1.1]],
 cash:[[15,17,1.05],[18,17,1.05],[21,17,1.05],[7,7.5,.8],[12,6.2,.8]],
 drill:{site:'S',t:[45,60,80],label:'STRONG SAFE'},minBags:2,limit:[12*60,10*60,9*60],
 brief:'Twenty glass cases of stones. Mask up, smash and bag the jewels, crack the strong safe in the back and load the van in the east alley.',
 lamps:[[8,30],[20,30],[32,30],[14,38],[36,38]]}];

/* ===================================================================== LEVEL */
export class Level{
 constructor(def){this.def=def;const P=painter(def.W,def.H);def.paint(P);this.g=P.g;const W=this.W=def.W,H=this.H=def.H;this.hw=W*CS/2;this.hh=H*CS/2;
  this.boxes=[];this.props=[];this.doors=[];this.glass=[];this.vault=null;this.loot=[];this.boxGroups=[];
  this.floorKind();this.ceilings();this.buildBoxes();this.finalize();this.buildNav();this.buildRooms();}
 cx(c){return(c-this.W/2+.5)*CS;}cz(r){return(r-this.H/2+.5)*CS;}X(c){return(c-this.W/2)*CS;}Z(r){return(r-this.H/2)*CS;}
 cellOf(x,z){const c=Math.floor(x/CS+this.W/2),r=Math.floor(z/CS+this.H/2);return(c<0||r<0||c>=this.W||r>=this.H)?-1:r*this.W+c;}
 chAt(x,z){const k=this.cellOf(x,z);return k<0?'!':this.g[k/this.W|0][k%this.W];}
 at(c,r){return c<0||r<0||c>=this.W||r>=this.H?'!':this.g[r][c];}
 P(cr){return{x:this.cx(cr[0]),z:this.cz(cr[1])};}
 cr(x,z){return[Math.floor(x/CS+this.W/2),Math.floor(z/CS+this.H/2)];}
 floorH(){return 0;}
 // nearest floor char for every cell (props / walls inherit the floor around them)
 floorKind(){const W=this.W,H=this.H;const fk=this.fk=Array.from({length:H},()=>Array(W).fill(null));const q=[];
  for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(FLOORS.includes(this.g[r][c])){fk[r][c]=this.g[r][c];q.push(c,r);}
  for(let i=0;i<q.length;i+=2){const c=q[i],r=q[i+1];for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=c+dc,b=r+dr;if(a<0||b<0||a>=W||b>=H||fk[b][a])continue;fk[b][a]=fk[r][c];q.push(a,b);}}}
 fkAt(x,z){const[c,r]=this.cr(x,z);return c<0||r<0||c>=this.W||r>=this.H?'s':this.fk[r][c]||'s';}
 inside(x,z){return INTERIOR.includes(this.fkAt(x,z))&&this.chAt(x,z)!=='!';}
 isOutside(c,r){const f=this.fk[r]?.[c];return!f||OUTSIDE.includes(f);}
 ceilings(){const W=this.W,H=this.H;this.ch=new Float32Array(W*H);for(let r=0;r<H;r++)for(let c=0;c<W;c++){const f=this.fk[r][c];const k=this.g[r][c];
   if(!f||OUTSIDE.includes(f)||k==='#'||k==='!'||k==='G'||k==='E'){this.ch[r*W+c]=0;continue;}let h=this.def.ceilH;for(const[c0,r0,c1,r1,hh]of this.def.ceil)if(c>=c0&&c<=c1&&r>=r0&&r<=r1)h=hh;this.ch[r*W+c]=h;}}
 ceilAt(x,z){const k=this.cellOf(x,z);return k<0?0:this.ch[k];}
 isPublic(x,z){if(!this.inside(x,z))return true;const[c,r]=this.cr(x,z);return this.def.public.some(([c0,r0,c1,r1])=>c>=c0&&c<=c1&&r>=r0&&r<=r1);}
 room(x,z){const[c,r]=this.cr(x,z);for(const[n,c0,r0,c1,r1]of this.def.rooms)if(c>=c0&&c<=c1&&r>=r0&&r<=r1)return n;return'';}
 addBox(x0,y0,z0,x1,y1,z1,mat,o={}){const b={x0:Math.min(x0,x1),y0,z0:Math.min(z0,z1),x1:Math.max(x0,x1),y1,z1:Math.max(z0,z1),mat,coll:o.coll!==false,ray:o.ray!==false,vis:o.vis!==false,kind:o.kind||mat,ch:o.ch,ent:o.ent||null,c:o.c,r:o.r};b.i=this.boxes.length;this.boxes.push(b);return b;}
 rects(fn){const W=this.W,H=this.H,seen=new Uint8Array(W*H),out=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++){if(seen[r*W+c]||!fn(this.g[r][c],c,r))continue;const ch=this.g[r][c];let w=1;while(c+w<W&&!seen[r*W+c+w]&&this.g[r][c+w]===ch&&fn(ch,c+w,r))w++;
   let h=1;outer:while(r+h<H){for(let i=0;i<w;i++){if(seen[(r+h)*W+c+i]||this.g[r+h][c+i]!==ch)break outer;}h++;}for(let j=0;j<h;j++)for(let i=0;i<w;i++)seen[(r+j)*W+c+i]=1;out.push({c,r,w,h,ch});}return out;}
 wallish(c,r){return WALLISH.includes(this.at(c,r));}
 // orientation of a thin cell: 'h' runs along x, 'v' along z
 orient(c,r){const L=this.wallish(c-1,r),R=this.wallish(c+1,r),U=this.wallish(c,r-1),D=this.wallish(c,r+1);if((L||R)&&!(U&&D&&!(L&&R)))return'h';if(U||D)return'v';return'h';}
 // thin slab for a run of cells; extends into perpendicular neighbours so corners close
 thinBox(q,y0,y1,th,mat,o={}){const X=c=>this.X(c),Z=r=>this.Z(r);const hor=q.h===1&&(q.w>1||this.orient(q.c,q.r)==='h');
  if(hor){let x0=X(q.c),x1=X(q.c+q.w);const zc=Z(q.r)+.5;const L=q.c-1,R=q.c+q.w;
   if(THIN.includes(this.at(L,q.r))&&this.orient(L,q.r)==='v')x0-=.5-th/2;else if(!this.wallish(L,q.r)&&(this.wallish(q.c,q.r-1)||this.wallish(q.c,q.r+1)))x0=X(q.c)+.5-th/2;
   if(THIN.includes(this.at(R,q.r))&&this.orient(R,q.r)==='v')x1+=.5-th/2;else if(!this.wallish(R,q.r)&&(this.wallish(q.c+q.w-1,q.r-1)||this.wallish(q.c+q.w-1,q.r+1)))x1=X(q.c+q.w)-.5+th/2;
   return this.addBox(x0,y0,zc-th/2,x1,y1,zc+th/2,mat,{...o,axis:'x'});}
  let z0=Z(q.r),z1=Z(q.r+q.h);const xc=X(q.c)+.5;const U=q.r-1,D=q.r+q.h;
  if(THIN.includes(this.at(q.c,U))&&this.orient(q.c,U)==='h')z0-=.5-th/2;else if(!this.wallish(q.c,U)&&(this.wallish(q.c-1,q.r)||this.wallish(q.c+1,q.r)))z0=Z(q.r)+.5-th/2;
  if(THIN.includes(this.at(q.c,D))&&this.orient(q.c,D)==='h')z1+=.5-th/2;else if(!this.wallish(q.c,D)&&(this.wallish(q.c-1,q.r+q.h-1)||this.wallish(q.c+1,q.r+q.h-1)))z1=Z(q.r+q.h)-.5+th/2;
  const b=this.addBox(xc-th/2,y0,z0,xc+th/2,y1,z1,mat,o);b.axis='z';return b;}
 buildBoxes(){const W=this.W,H=this.H,g=this.g;const X=c=>this.X(c),Z=r=>this.Z(r);const WH=6.6,EH=this.def.wallH||9;
  for(const q of this.rects(ch=>ch==='#'))this.addBox(X(q.c),0,Z(q.r),X(q.c+q.w),EH,Z(q.r+q.h),'ext',{kind:'ext'});
  for(const q of this.rects(ch=>ch==='!'))this.addBox(X(q.c),0,Z(q.r),X(q.c+q.w),12,Z(q.r+q.h),'ext',{kind:'inv',vis:false});
  // interior walls: split per cell orientation so each greedy run is straight
  for(const q of this.rects((ch,c,r)=>ch==='w'&&this.orient(c,r)==='h'))for(let j=0;j<q.h;j++)this.thinBox({c:q.c,r:q.r+j,w:q.w,h:1},0,WH,.32,'wall',{kind:'wall'});
  for(const q of this.rects((ch,c,r)=>ch==='w'&&this.orient(c,r)==='v'))for(let i=0;i<q.w;i++)this.thinBox({c:q.c+i,r:q.r,w:1,h:q.h},0,WH,.32,'wall',{kind:'wall'});
  // glass partitions: pane to 3.0 m + transom wall
  for(let r=0;r<H;r++)for(let c=0;c<W;c++){const k=g[r][c];if(k!=='g')continue;const q={c,r,w:1,h:1};const ent={kind:'pane',c,r,broken:false,hp:1};
   const b=this.thinBox(q,.02,3,.08,'glass',{kind:'glass',ent,vis:false});ent.box=b;this.glass.push(ent);this.thinBox(q,3,WH,.32,'wall',{kind:'wall'});this.thinBox(q,0,.02,.12,'metal',{kind:'trim',ray:false,coll:false});}
  // teller counters with glass screens
  for(const q of this.rects(ch=>ch==='n')){const zc=Z(q.r)+.5;this.addBox(X(q.c),0,zc-.42,X(q.c+q.w),1.08,zc+.42,'counter',{kind:'counter'});
   for(let i=0;i<q.w;i++){const ent={kind:'teller',c:q.c+i,r:q.r,broken:false};ent.box=this.addBox(X(q.c+i)+.04,1.08,zc-.03,X(q.c+i+1)-.04,2.45,zc+.03,'glass',{kind:'glass',ent,vis:false});this.glass.push(ent);}}
  // facade windows: sill, pane, head
  for(const q of this.rects(ch=>ch==='G')){const hor=q.h===1&&(q.w>1||this.orient(q.c,q.r)==='h');const x0=X(q.c),x1=X(q.c+q.w),z0=Z(q.r),z1=Z(q.r+q.h);
   this.addBox(x0,0,z0,x1,.7,z1,'ext',{kind:'sill'});this.addBox(x0,3.5,z0,x1,EH,z1,'ext',{kind:'head'});
   const n=hor?q.w:q.h;for(let i=0;i<n;i++){const ent={kind:'window',c:hor?q.c+i:q.c,r:hor?q.r:q.r+i,broken:false};const a0=hor?X(q.c+i):Z(q.r+i),a1=a0+1;
    ent.box=hor?this.addBox(a0,.7,(z0+z1)/2-.04,a1,3.5,(z0+z1)/2+.04,'glass',{kind:'glass',ent,vis:false}):this.addBox((x0+x1)/2-.04,.7,a0,(x0+x1)/2+.04,3.5,a1,'glass',{kind:'glass',ent,vis:false});this.glass.push(ent);}}
  // doors: lintel + swinging leaf (dynamic box)
  for(let r=0;r<H;r++)for(let c=0;c<W;c++){const k=g[r][c];if(!DOORS.includes(k))continue;const ext=k==='E'||this.at(c-1,r)==='#'||this.at(c+1,r)==='#'||this.at(c,r-1)==='#'||this.at(c,r+1)==='#';
   const hor=this.orient(c,r)==='h';const th=ext?1:.32,top=ext?EH:WH;const q={c,r,w:1,h:1};
   if(ext)this.addBox(X(c),2.5,Z(r),X(c+1),top,Z(r+1),'ext',{kind:'lintel'});else this.thinBox(q,2.5,top,th,'wall',{kind:'lintel'});
   const same=(dc,dr)=>this.at(c+dc,r+dr)===k;const hinge=hor?(same(-1,0)&&!same(1,0)?1:-1):(same(0,-1)&&!same(0,1)?1:-1);
   const d={kind:k,c,r,x:this.cx(c),z:this.cz(r),hor,hinge,open:false,ang:0,want:0,locked:k==='L'||k==='K',glass:k==='E',ext,picked:0,broken:false};
   const lt=k==='E'?.06:.07;d.box=hor?this.addBox(X(c)+.02,0,this.cz(r)-lt,X(c+1)-.02,2.48,this.cz(r)+lt,k==='E'?'glass':'door',{kind:'leaf',ent:d,vis:false}):this.addBox(this.cx(c)-lt,0,Z(r)+.02,this.cx(c)+lt,2.48,Z(r+1)-.02,k==='E'?'glass':'door',{kind:'leaf',ent:d,vis:false});
   if(k==='E')d.box.mat='door';this.doors.push(d);}
  // vault door spans its V cells
  {const vs=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(g[r][c]==='V')vs.push([c,r]);if(vs.length){const c0=Math.min(...vs.map(v=>v[0])),c1=Math.max(...vs.map(v=>v[0])),r0=vs[0][1];
    this.addBox(X(c0),3.6,Z(r0),X(c1+1),EH,Z(r0+1),'ext',{kind:'lintel'});this.vault={c0,c1,r:r0,x:(X(c0)+X(c1+1))/2,z:this.cz(r0),open:false,ang:0,cells:vs};this.vault.box=this.addBox(X(c0),0,Z(r0),X(c1+1),3.6,Z(r0+1),'steel',{kind:'vaultdoor',ent:this.vault,vis:false});}}
  // props
  const seenRect=new Set();
  for(const q of this.rects(ch=>ch in PROP&&!'zZo'.includes(ch))){const pr=PROP[q.ch];if(q.ch==='j'||q.ch==='S'||q.ch==='P'||q.ch==='A'||q.ch==='X'||q.ch==='d'||q.ch==='M'||q.ch==='y'||q.ch==='h'||q.ch==='T'||q.ch==='u'||q.ch==='b'||q.ch==='N'||q.ch==='p'||q.ch==='q'||q.ch==='l'){}
   const per=q.ch==='j'||q.ch==='P'||q.ch==='A'||q.ch==='y'||q.ch==='p'||q.ch==='l'||q.ch==='d'&&false;const list=per?[]:[q];if(per)for(let j=0;j<q.h;j++)for(let i=0;i<q.w;i++)list.push({c:q.c+i,r:q.r+j,w:1,h:1,ch:q.ch});
   for(const p of list){let x0=X(p.c),x1=X(p.c+p.w),z0=Z(p.r),z1=Z(p.r+p.h);const inset=(1-pr.s)/2;x0+=inset;x1-=inset;z0+=inset;z1-=inset;
    if(pr.thin){// shallow props hug the nearest wall
     const cx=(x0+x1)/2,cz=(z0+z1)/2;let best=null;for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=this.at(p.c+(dc>0?p.w:dc),p.r+(dr>0?p.h:dr));if(WALLISH.includes(a)||'h'.includes(a)){best=[dc,dr];break;}}
     if(best&&p.w*p.h<=6){const t=pr.thin;if(best[0]>0)x0=x1-t;if(best[0]<0)x1=x0+t;if(best[1]>0)z0=z1-t;if(best[1]<0)z1=z0+t;}else if(p.w>=p.h){const m=(z0+z1)/2;z0=m-pr.thin/2;z1=m+pr.thin/2;}else{const m=(x0+x1)/2;x0=m-pr.thin/2;x1=m+pr.thin/2;}}
    if(p.ch==='l'){const cx=(x0+x1)/2,cz=(z0+z1)/2;x0=cx-.12;x1=cx+.12;z0=cz-.12;z1=cz+.12;}
    const ent={kind:p.ch,ch:p.ch,c:p.c,r:p.r,w:p.w,h:p.h,x:(x0+x1)/2,z:(z0+z1)/2,x0,x1,z0,z1,hgt:pr.h};const b=this.addBox(x0,0,z0,x1,pr.h,z1,pr.mat,{kind:'prop',ch:p.ch,ent,vis:false});ent.box=b;this.props.push(ent);
    if(p.ch==='j'){const ge={kind:'case',c:p.c,r:p.r,broken:false,prop:ent};ge.box=this.addBox(x0+.03,pr.h,z0+.03,x1-.03,1.42,z1-.03,'glass',{kind:'glass',ent:ge,vis:false});this.glass.push(ge);ent.glass=ge;this.loot.push({kind:'jewel',prop:ent,x:ent.x,z:ent.z,y:1.05,left:1,need:'case'});}
    if(p.ch==='P')this.loot.push({kind:'cash',prop:ent,x:ent.x,z:ent.z,y:1.3,left:2,need:'vault'});
    if(p.ch==='A')this.loot.push({kind:'gold',prop:ent,x:ent.x,z:ent.z,y:1,left:1,need:'vault'});
    if(p.ch==='S'){this.safe=ent;this.loot.push({kind:'gold',prop:ent,x:ent.x,z:ent.z,y:1.2,left:2,need:'safe'});this.loot.push({kind:'cash',prop:ent,x:ent.x,z:ent.z,y:.6,left:2,need:'safe'});}
    if(p.ch==='X'){for(let j=0;j<p.h;j++)for(let i=0;i<p.w;i++)if((i+j)%2===0)this.loot.push({kind:'box',prop:ent,x:this.cx(p.c+i),z:this.cz(p.r+j),y:1.3,left:1,need:this.vault?'vault':null,cell:[p.c+i,p.r+j]});}}}
  // columns (round, ceiling height) + cars
  for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(g[r][c]==='o'){const x=this.cx(c),z=this.cz(r),h=this.ch[r*W+c]||4;const ent={kind:'o',c,r,x,z,hgt:h};this.addBox(x-.38,0,z-.38,x+.38,h,z+.38,'stone',{kind:'prop',ch:'o',ent,vis:false});this.props.push(ent);}
  for(const q of this.rects(ch=>ch==='z'||ch==='Z')){const pr=PROP[q.ch];const x0=X(q.c)+.1,x1=X(q.c+q.w)-.1,z0=Z(q.r)+.1,z1=Z(q.r+q.h)-.1;const ent={kind:q.ch,c:q.c,r:q.r,w:q.w,h:q.h,x:(x0+x1)/2,z:(z0+z1)/2,x0,x1,z0,z1,hgt:pr.h};
   this.addBox(x0,0,z0,x1,pr.h,z1,'car',{kind:'prop',ch:q.ch,ent,vis:false});this.props.push(ent);if(q.ch==='Z')this.van=ent;}
  // ceilings: ray-only slabs per run of equal height
  const ch=this.ch;for(const q of this.rects((k,c,r)=>ch[r*W+c]>0)){/* group by height row-by-row */}
  for(let r=0;r<H;r++){let c=0;while(c<W){const h=ch[r*W+c];if(!h){c++;continue;}let e=c;while(e+1<W&&ch[r*W+e+1]===h)e++;this.addBox(X(c),h,Z(r),X(e+1),h+.4,Z(r+1),'ceil',{kind:'ceil',vis:false,coll:false});c=e+1;}}}

 finalize(){const S=this.boxes;const n=S.length,B=this.B=new Float32Array(n*6);S.forEach((b,i)=>B.set([b.x0,b.y0,b.z0,b.x1,b.y1,b.z1],i*6));
  this.pen=new Float32Array(n);this.rayOK=new Uint8Array(n);this.collOK=new Uint8Array(n);S.forEach((b,i)=>{this.pen[i]=MATS[b.mat].pen;this.rayOK[i]=b.ray?1:0;this.collOK[i]=b.coll?1:0;});
  const GS=this.GS=3,GX=this.GX=Math.ceil(this.hw*2/GS),GZ=this.GZ=Math.ceil(this.hh*2/GS);this.grid=Array.from({length:GX*GZ},()=>[]);
  S.forEach((b,i)=>{const i0=Math.max(0,Math.floor((b.x0+this.hw)/GS)),i1=Math.min(GX-1,Math.floor((b.x1+this.hw)/GS)),j0=Math.max(0,Math.floor((b.z0+this.hh)/GS)),j1=Math.min(GZ-1,Math.floor((b.z1+this.hh)/GS));for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++)this.grid[j*GX+k].push(i);});
  this.qs=new Uint32Array(n);this.qg=0;this.ql=[];}
 setBox(b,on){this.collOK[b.i]=on&&b.coll?1:0;this.rayOK[b.i]=on&&b.ray?1:0;}
 near(x,z,r){return this.nearRect(x-r,z-r,x+r,z+r);}
 nearRect(ax,az,bx,bz){const GS=this.GS,GX=this.GX,GZ=this.GZ,out=this.ql;out.length=0;const g=++this.qg;const i0=Math.max(0,Math.floor((Math.min(ax,bx)+this.hw)/GS)),i1=Math.min(GX-1,Math.floor((Math.max(ax,bx)+this.hw)/GS)),j0=Math.max(0,Math.floor((Math.min(az,bz)+this.hh)/GS)),j1=Math.min(GZ-1,Math.floor((Math.max(az,bz)+this.hh)/GS));
  for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++){const c=this.grid[j*GX+k];for(let m=0;m<c.length;m++){const i=c[m];if(this.qs[i]!==g){this.qs[i]=g;out.push(i);}}}return out;}

 /* ---------- rays: first box hit with entry/exit; candidates from the grid cells under the segment's bounds ---------- */
 ray(ox,oy,oz,dx,dy,dz,maxT,out,skip=-1,opt){if(Math.abs(dx)<1e-7)dx=1e-7;if(Math.abs(dy)<1e-7)dy=1e-7;if(Math.abs(dz)<1e-7)dz=1e-7;const B=this.B;let best=maxT,ax=-1,sg=0,bi=-1,bx=0;const ix=1/dx,iy=1/dy,iz=1/dz;
  if(dy<0){const t=-oy/dy;if(t<best&&t>0){best=t;ax=1;sg=1;bi=-2;bx=t+1e9;}}
  const ex=ox+dx*Math.min(maxT,200),ez=oz+dz*Math.min(maxT,200);const cand=maxT>60?null:this.nearRect(ox,oz,ex,ez);const n=cand?cand.length:B.length/6;
  for(let q=0;q<n;q++){const i=cand?cand[q]:q;if(!this.rayOK[i]||i===skip)continue;if(opt&&opt.noGlass&&this.boxes[i].mat==='glass')continue;const k=i*6;let t1=(B[k]-ox)*ix,t2=(B[k+3]-ox)*ix,tmin,tmax,a=0,s;if(t1<t2){tmin=t1;tmax=t2;s=-1;}else{tmin=t2;tmax=t1;s=1;}
   t1=(B[k+1]-oy)*iy;t2=(B[k+4]-oy)*iy;if(t1>t2){const qq=t1;t1=t2;t2=qq;if(t1>tmin){tmin=t1;a=1;s=1;}}else if(t1>tmin){tmin=t1;a=1;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax)continue;
   t1=(B[k+2]-oz)*iz;t2=(B[k+5]-oz)*iz;if(t1>t2){const qq=t1;t1=t2;t2=qq;if(t1>tmin){tmin=t1;a=2;s=1;}}else if(t1>tmin){tmin=t1;a=2;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax||tmax<0)continue;
   if(tmin<0)continue;if(tmin<best){best=tmin;ax=a;sg=s;bi=i;bx=tmax;}}
  if(out){out.t=best;out.i=bi;out.exit=bx;out.nx=ax===0?sg:0;out.ny=ax===1?sg:0;out.nz=ax===2?sg:0;}return best<maxT?best:Infinity;}
 // line of sight; glass is see-through unless solid=true
 los(ax,ay,az,bx,by,bz,solid){const dx=bx-ax,dy=by-ay,dz=bz-az,l=Math.hypot(dx,dy,dz);if(l<1e-4)return true;return this.ray(ax,ay,az,dx/l,dy/l,dz/l,l-.05,null,-1,solid?null:{noGlass:true})===Infinity;}

 /* ---------- character collision ---------- */
 ground(x,z,feet,r=.3){let g=0;const B=this.B,L=this.near(x,z,r+.1);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i])continue;if(B[k+4]>feet+STEP||B[k+4]<=g)continue;if(x+r<B[k]||x-r>B[k+3]||z+r<B[k+2]||z-r>B[k+5])continue;g=B[k+4];}return g;}
 ceil(x,z,feet){let c=Infinity;const B=this.B,L=this.near(x,z,.4);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i]||B[k+1]<feet+.4)continue;if(x<B[k]||x>B[k+3]||z<B[k+2]||z>B[k+5])continue;c=Math.min(c,B[k+1]);}return c;}
 collide(p,r,h){const B=this.B,L=this.near(p.x,p.z,r+.6).slice();let hit=null;for(let pass=0;pass<2;pass++)for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i])continue;if(B[k+4]<=p.y+STEP||B[k+1]>=p.y+h)continue;
   const cx=Math.max(B[k],Math.min(p.x,B[k+3])),cz=Math.max(B[k+2],Math.min(p.z,B[k+5]));let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;if(d2>=r*r)continue;hit=this.boxes[i];
   if(d2>1e-8){const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d);}else{const l=p.x-B[k],rr=B[k+3]-p.x,u=p.z-B[k+2],dd=B[k+5]-p.z,m=Math.min(l,rr,u,dd);if(m===l)p.x=B[k]-r;else if(m===rr)p.x=B[k+3]+r;else if(m===u)p.z=B[k+2]-r;else p.z=B[k+5]+r;}}
  return hit;}
 inside3(x,y,z){const B=this.B,L=this.near(x,z,.05);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i])continue;if(x>B[k]&&x<B[k+3]&&y>B[k+1]&&y<B[k+4]&&z>B[k+2]&&z<B[k+5])return i;}return -1;}

 /* ---------- rooms (flood fill through open floor; glass passes light) for baking + callouts ---------- */
 buildRooms(){const W=this.W,H=this.H;const id=this.rid=new Int32Array(W*H).fill(-1);let n=0;const stop='#w!DLKVE';
  for(let r=0;r<H;r++)for(let c=0;c<W;c++){if(id[r*W+c]>=0||stop.includes(this.g[r][c]))continue;const st=[c,r];id[r*W+c]=n;while(st.length){const b=st.pop(),a=st.pop();for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=a+dc,y=b+dr;if(x<0||y<0||x>=W||y>=H||id[y*W+x]>=0||stop.includes(this.g[y][x]))continue;id[y*W+x]=n;st.push(x,y);}}n++;}this.nRooms=n;}
 roomId(x,z){const k=this.cellOf(x,z);return k<0?-1:this.rid[k];}

 /* ---------- nav grid (0.5 m) + A* ---------- */
 buildNav(){const NX=this.NX=this.W*2,NZ=this.NZ=this.H*2;const N=NX*NZ;this.blk=new Uint8Array(N);this.cost=new Float32Array(N);
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const ch=this.g[j>>1][i>>1];if(SOLID.includes(ch))this.blk[j*NX+i]=1;}
  this.g2=new Float32Array(N);this.par=new Int32Array(N);this.st=new Uint32Array(N);this.cs=new Uint32Array(N);this.gen=1;this.heap=new Int32Array(N*4);this.hf=new Float32Array(N*4);this.calcAdj();}
 calcAdj(){const NX=this.NX,NZ=this.NZ;this.wallAdj=new Uint8Array(NX*NZ);for(let j=1;j<NZ-1;j++)for(let i=1;i<NX-1;i++){const k=j*NX+i;if(this.blk[k])continue;let a=0;for(const d of[1,-1,NX,-NX])if(this.blk[k+d])a++;this.wallAdj[k]=a;}}
 setCell(c,r,blocked){const NX=this.NX;for(let j=0;j<2;j++)for(let i=0;i<2;i++)this.blk[(r*2+j)*NX+c*2+i]=blocked?1:0;this.calcAdj();}
 nidx(x,z){const i=Math.floor((x+this.hw)*2),j=Math.floor((z+this.hh)*2);return(i<0||j<0||i>=this.NX||j>=this.NZ)?-1:j*this.NX+i;}
 npos(k){return{x:(k%this.NX+.5)/2-this.hw,z:((k/this.NX|0)+.5)/2-this.hh};}
 nfree(x,z){const k=this.nidx(x,z);return k>=0&&!this.blk[k];}
 nearestFree(x,z){const NX=this.NX,NZ=this.NZ;const i=Math.floor((x+this.hw)*2),j=Math.floor((z+this.hh)*2);for(let r=0;r<16;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const a=i+di,b=j+dj;if(a>0&&b>0&&a<NX-1&&b<NZ-1&&!this.blk[b*NX+a])return b*NX+a;}return -1;}
 walkable(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),n=Math.ceil(l/.2);for(let k=1;k<=n;k++){const t=k/n,x=ax+dx*t,z=az+dz*t;for(const[ox,oz]of[[.26,.26],[-.26,.26],[.26,-.26],[-.26,-.26]]){const q=this.nidx(x+ox,z+oz);if(q<0||this.blk[q])return false;}}return true;}
 path(sx,sz,tx,tz,maxIter=14000){const NX=this.NX,NZ=this.NZ;let s=this.nidx(sx,sz),t=this.nidx(tx,tz);if(s<0||this.blk[s])s=this.nearestFree(sx,sz);if(t<0||this.blk[t])t=this.nearestFree(tx,tz);if(s<0||t<0)return null;
  const gen=++this.gen,g=this.g2,par=this.par,st=this.st,cs=this.cs,Hh=this.heap,F=this.hf;let hn=0;const ti=t%NX,tj=t/NX|0;
  const h=c=>{const dx=Math.abs(c%NX-ti),dz=Math.abs((c/NX|0)-tj);return Math.max(dx,dz)+.414*Math.min(dx,dz);};
  const push=(c,f)=>{if(hn>=Hh.length)return;let k=hn++;while(k>0){const p=(k-1)>>1;if(F[p]<=f)break;Hh[k]=Hh[p];F[k]=F[p];k=p;}Hh[k]=c;F[k]=f;};
  const pop=()=>{const top=Hh[0],lc=Hh[--hn],lf=F[hn];let k=0;for(;;){let c=2*k+1;if(c>=hn)break;if(c+1<hn&&F[c+1]<F[c])c++;if(F[c]>=lf)break;Hh[k]=Hh[c];F[k]=F[c];k=c;}Hh[k]=lc;F[k]=lf;return top;};
  g[s]=0;st[s]=gen;par[s]=-1;push(s,h(s));let it=0,found=false;
  while(hn>0&&it++<maxIter){const c=pop();if(c===t){found=true;break;}if(cs[c]===gen)continue;cs[c]=gen;const ci=c%NX,cj=c/NX|0;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=NX||nj>=NZ)continue;const k=nj*NX+ni;if(cs[k]===gen||this.blk[k])continue;
    if(di&&dj&&(this.blk[cj*NX+ni]||this.blk[nj*NX+ci]))continue;const ng=g[c]+(di&&dj?1.414:1)+this.wallAdj[k]*.35+this.cost[k];if(st[k]!==gen||ng<g[k]){st[k]=gen;g[k]=ng;par[k]=c;push(k,ng+h(k));}}}
  if(!found)return null;const cells=[];for(let c=t;c>=0;c=par[c])cells.push(c);cells.reverse();
  const pts=cells.map(c=>this.npos(c));const out=[pts[0]];let i=0;while(i<pts.length-1){let j=Math.min(pts.length-1,i+24);for(;j>i+1;j--)if(this.walkable(pts[i].x,pts[i].z,pts[j].x,pts[j].z))break;out.push(pts[j]);i=j;}
  if(this.nfree(tx,tz))out[out.length-1]={x:tx,z:tz};return out;}
 ascii(){return this.g.map(r=>r.join('')).join('\n');}
}
