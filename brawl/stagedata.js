// PLATFORM BRAWL — stage layouts (pure data). Solids have ledges; plats are pass-through and may move.
const bz=(x0,x1)=>({l:x0-21,r:x1+21,t:28,b:-18});
export const STAGES=[
 {id:'garden',name:'SKY GARDEN',sub:'Three floating ledges over a sunset sea of cloud.',
  solids:[{x0:-11,x1:11,y:0,yb:-4,ledge:true}],plats:[{x0:-7.6,x1:-3,y:3.7},{x0:3,x1:7.6,y:3.7},{x0:-2.3,x1:2.3,y:7.2}],
  blast:bz(-11,11),spawns:[[-6,0],[6,0],[-2.2,0],[2.2,0]],respawn:[0,11]},
 {id:'foundry',name:'FOUNDRY',sub:'A shuttle platform rides the rails while magma geysers erupt from the vats.',
  solids:[{x0:-12,x1:12,y:0,yb:-3,ledge:true}],plats:[{x0:-2.6,x1:2.6,y:4.2,path:{ax:7.2,period:9}},{x0:-11,x1:-7.5,y:2.9},{x0:7.5,x1:11,y:2.9}],
  hazard:{kind:'geyser',every:720,jit:420,warn:96,dur:50,d:13,b:62,g:66,fx:'fire'},
  blast:bz(-12,12),spawns:[[-7,0],[7,0],[-2.5,0],[2.5,0]],respawn:[0,11]},
 {id:'bay',name:'DRIFT BAY',sub:'A harbour dock with bobbing rafts off both ends and a drifting skiff above.',
  solids:[{x0:-10,x1:10,y:0,yb:-2.6,ledge:true}],plats:[{x0:-16,x1:-12.2,y:.4,path:{ay:1.1,period:6,phase:0}},{x0:12.2,x1:16,y:.4,path:{ay:1.1,period:6,phase:Math.PI}},{x0:-2.6,x1:2.6,y:4.4,path:{ax:4,period:10}}],
  blast:bz(-12,12),spawns:[[-6,0],[6,0],[-2,0],[2,0]],respawn:[0,11]},
 {id:'spire',name:'NEON SPIRE',sub:'A skyscraper roof with a service lift. Watch for the security drone’s laser sweep.',
  solids:[{x0:-11,x1:11,y:0,yb:-7,ledge:true}],plats:[{x0:-9.2,x1:-5.4,y:3.2,path:{ay:2.4,period:7}},{x0:4,x1:9,y:4.4}],
  hazard:{kind:'laser',every:780,jit:420,warn:110,dur:44,d:11,b:56,g:60,fx:'elec',high:4.75},
  blast:bz(-11,11),spawns:[[-6,0],[6,0],[-2,0],[2,0]],respawn:[0,11]},
 {id:'zenith',name:'ZENITH',sub:'One flat slab of crystal at the edge of space. No platforms, no excuses.',
  solids:[{x0:-12.5,x1:12.5,y:0,yb:-3.2,ledge:true}],plats:[],
  blast:bz(-12.5,12.5),spawns:[[-7,0],[7,0],[-2.5,0],[2.5,0]],respawn:[0,10]},
];
export const cloneStage=i=>{const s=STAGES[i];return{...s,solids:s.solids.map(o=>({...o})),plats:s.plats.map(o=>({...o,path:o.path?{...o.path}:null})),hazard:s.hazard?{...s.hazard}:null};};
